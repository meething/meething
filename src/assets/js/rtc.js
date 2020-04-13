/**
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 6th January, 2020
 */
import h from "./helpers.js";
import EventEmitter from "./emitter.js";
var TIMEGAP = 6000;
var allUsers = [];
var enableHacks = false;

var room;
var username;

window.onload = function(e) {
  room = h.getQString(location.href, "room");
  username = sessionStorage.getItem("username");

  initSocket();
  initUser();
  initRTC();
};

var socket;
var room;
var pc = []; // hold local peerconnection statuses
const pcmap = new Map(); // A map of all peer ids to their peerconnections.
var myStream = "";
var socketId;

function initSocket() {
  //var peers = ["https://gunmeetingserver.herokuapp.com/gun"];
  var peers = [
    "https://livecodestream-us.herokuapp.com/gun" //,"https://livecodestream-eu.herokuapp.com/gun"
  ];
  var opt = { peers: peers, localStorage: false, radisk: false };
  var opt_out = { peers: [], localStorage: false, radisk: false };

  var root = Gun(opt);

  socket = root
    .get("rtcmeeting")
    .get(room)
    .get("socket");

  const pid = root._.opt.pid;
  var damSocket = new EventEmitter(root);  

  // Custom Emit Function - move to Emitter?
  socket.emit = function(key, value) {
    // if (value.sender && value.to && value.sender == value.to) return;
    // console.log("debug emit key", key, "value", value);
    // if (!key || !value) return;
    // if (!value.ts) value.ts = Date.now();
    //  // Legacy send through GUN JSON
    // if (key == "sdp" || key == "icecandidates") value = JSON.stringify(value);
    // socket.get(key).put(value);

    // Send through DAM as-is
    root.on("out", { pid: pid, to: value.to || pid, signaling: key, data: value });
  };
}

function initUser(r) {
  var peers = [
    "https://livecodestream-us.herokuapp.com/gun",
    "https://livecodestream-eu.herokuapp.com/gun"
  ];
  var opt = { peers: peers, localStorage: false, radisk: false };
  var gun = Gun(opt);

  var pid = sessionStorage.getItem("pid");
  if (pid == null || pid == undefined) {
    pid = gun._.opt.pid;
    sessionStorage.setItem("pid", pid);
  }
}

function sendMsg(msg, local) {
  let data = {
    room: room,
    msg: msg,
    sender: username || socketId
  };

  //emit chat message
  if (!local) socket.emit("chat", data);
  //add localchat
  h.addChat(data, "local");
}

window.onbeforeunload = function() {
  // Cleanup peerconnections
  pcmap.forEach((pc, id) => {
    pcmap.get(id).close();
    pcmap.delete(id);
  });
};

function initRTC() {
  if (!room) {
    document.querySelector("#room-create").attributes.removeNamedItem("hidden");
  } else if (!username) {
    document
      .querySelector("#username-set")
      .attributes.removeNamedItem("hidden");
  } else {
    let commElem = document.getElementsByClassName("room-comm");

    for (let i = 0; i < commElem.length; i++) {
      commElem[i].attributes.removeNamedItem("hidden");
    }

    // Remove animated bg... to be replaced entirely with something cpu friendly
    document.getElementById("demo").remove();

    socketId = h.uuidv4();

    console.log("Starting! you are", socketId);

    // Initialize Session
    socket.emit("subscribe", {
      room: room,
      socketId: socketId,
      name: username || socketId
    });

    socket.get("subscribe").on(function(data, key) {
      // Ignore subscribes older than TIMEGAP
      console.log("Got channel subscribe", data);
      if (data.ts && Date.now() - data.ts > TIMEGAP * 2) {
        console.log("discarding old sub", data);
        return;
      }
      if (
        pc[data.socketId] !== undefined &&
        pc[data.socketId].connectionState == "connected"
      ) {
        console.log(
          "Existing peer subscribe, discarding...",
          pc[data.socketId]
        );
        return;
      }
      // Ignore self-generated subscribes
      if (data.socketId == socketId || data.sender == socketId) return;
      console.log("got subscribe!", data);

      if (data.to && data.to != socketId) return; // experimental on-to-one reinvite (handle only messages target to us)
      /* discard new user for connected parties? */
      if (
        pc[data.socketId] &&
        pc[data.socketId].iceConnectionState == "connected"
      ) {
        console.log("already connected to peer?", data.socketId);
        //return;
      }
      // New Peer, setup peerConnection
      socket.emit("newUserStart", {
        to: data.socketId,
        sender: socketId,
        name: data.name || data.socketId
      });
      pc.push(data.socketId);
      init(true, data.socketId);
    });

    socket.get("newUserStart").on(function(data, key) {
      if (data.ts && Date.now() - data.ts > TIMEGAP) return;
      if (data.socketId == socketId || data.sender == socketId) return;
      if (
        pc[data.socketId] &&
        pc[data.socketId].iceConnectionState == "connected"
      ) {
        console.log("already connected to peer?", data.socketId);
        //return;
      }
      pc.push(data.sender);
      init(false, data.sender);
    });

    socket.get("icecandidates").on(function(data, key) {
      try {
        data = JSON.parse(data);
        if (
          (data.ts && Date.now() - data.ts > TIMEGAP) ||
          !data.sender ||
          !data.to
        )
          return;
        console.log(
          data.sender.trim() + " is trying to connect with " + data.to.trim()
        );
        data.candidate = new RTCIceCandidate(data.candidate);
        if (!data.candidate) return;
      } catch (e) {
        console.log(e, data);
        return;
      }
      if (data.socketId == socketId || data.to != socketId) return;
      console.log("ice candidate", data);
      //data.candidate ? pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : "";
      data.candidate ? pc[data.sender].addIceCandidate(data.candidate) : "";
    });

    socket.get("sdp").on(function(data, key) {
      try {
        data = JSON.parse(data);
        if (data.ts && Date.now() - data.ts > TIMEGAP) return;
        if (
          !data ||
          data.socketId == socketId ||
          data.sender == socketId ||
          !data.description
        )
          return;
        if (data.to !== socketId) {
          console.log("not for us? dropping sdp");
          return;
        }
      } catch (e) {
        console.log(e, data);
        return;
      }

      if (data.description.type === "offer") {
        data.description
          ? pc[data.sender].setRemoteDescription(
              new RTCSessionDescription(data.description)
            )
          : "";

        h.getUserMedia()
          .then(async stream => {
            if (!document.getElementById("local").srcObject) {
              document.getElementById("local").srcObject = stream;
            }

            //save my stream
            myStream = stream;

            stream.getTracks().forEach(track => {
              pc[data.sender].addTrack(track, stream);
            });

            let answer = await pc[data.sender].createAnswer();
            await pc[data.sender].setLocalDescription(answer);

            socket.emit("sdp", {
              description: pc[data.sender].localDescription,
              to: data.sender,
              sender: socketId
            });
          })
          .catch(async e => {
            console.error(`answer stream error: ${e}`);
            if (!enableHacks) return;
            // start crazy mode lets answer anyhow
            console.log(
              ">>>>>>>>>>>> no media devices! answering receive only"
            );
            var answerConstraints = {
              OfferToReceiveAudio: true,
              OfferToReceiveVideo: true
            };
            let answer = await pc[data.sender].createAnswer(answerConstraints);
            await pc[data.sender].setLocalDescription(answer);

            socket.emit("sdp", {
              description: pc[data.sender].localDescription,
              to: data.sender,
              sender: socketId
            });
            // end crazy mode
          });
      } else if (data.description.type === "answer") {
        pc[data.sender].setRemoteDescription(
          new RTCSessionDescription(data.description)
        );
      }
    });

    socket.get("chat").on(function(data, key) {
      if (data.ts && Date.now() - data.ts > 1000) return;
      if (data.socketId == socketId || data.sender == socketId) return;
      if (data.sender == username) return;
      console.log("got chat", key, data);
      h.addChat(data, "remote");
    });

    document.getElementById("chat-input").addEventListener("keypress", e => {
      if (e.which === 13 && e.target.value.trim()) {
        e.preventDefault();

        sendMsg(e.target.value);

        setTimeout(() => {
          e.target.value = "";
        }, 50);
      }
    });

    document.getElementById("toggle-video").addEventListener("click", e => {
      e.preventDefault();
      if (!myStream) return;
      const videoTrack = myStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      console.log("local video enable: ", myStream.getVideoTracks()[0].enabled);
      //toggle video icon
      e.srcElement.classList.toggle("fa-video");
      e.srcElement.classList.toggle("fa-video-slash");
    });

    document.getElementById("toggle-mute").addEventListener("click", e => {
      e.preventDefault();
      if (!myStream) return;
      //myStream.getAudioTracks()[0].enabled = !myStream.getAudioTracks()[0].enabled;
      const audioTrack = myStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      console.log("local audio enable: ", myStream.getAudioTracks()[0].enabled);
      //toggle audio icon
      e.srcElement.classList.toggle("fa-volume-up");
      e.srcElement.classList.toggle("fa-volume-mute");
    });

    document.getElementById("toggle-invite").addEventListener("click", e => {
      e.preventDefault();
      //if (!myStream) return;
      console.log("Re-Send presence to all users...");
      var r = confirm("Re-Invite ALL room participants?");
      if (r == true) {
        socket.emit("subscribe", {
          room: room,
          socketId: socketId,
          name: username || socketId
        });
      }
    });
  }
}

function init(createOffer, partnerName) {
  // OLD: track peerconnections in array
  pc[partnerName] = new RTCPeerConnection(h.getIceServer());
  // DAM: replace with local map keeping tack of users/peerconnections
  pcmap.set(partnerName, pc[partnerName]); // MAP Tracking

  // Q&A: Should we use the existing myStream when available? Potential cause of issue and no-mute
  if (myStream) {
    myStream.getTracks().forEach(track => {
      pc[partnerName].addTrack(track, myStream); //should trigger negotiationneeded event
    });
  } else {
    h.getUserMedia()
      .then(stream => {
        //save my stream
        myStream = stream;
        //provide access to window for debug
        window.myStream = myStream;
        stream.getTracks().forEach(track => {
          pc[partnerName].addTrack(track, stream); //should trigger negotiationneeded event
        });

        document.getElementById("local").srcObject = stream;
      })
      .catch(async e => {
        console.error(`stream error: ${e}`);
        if (!enableHacks) return;
        // start crazy mode - lets offer anyway
        console.log(">>>>>>>>>>>> no media devices! offering receive only");
        var offerConstraints = {
          mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true }
        };
        let offer = await pc[partnerName].createOffer(offerConstraints);
        await pc[partnerName].setLocalDescription(offer);
        socket.emit("sdp", {
          description: pc[partnerName].localDescription,
          to: partnerName,
          sender: socketId
        });
        // end crazy mode
      });
  }

  //create offer
  if (createOffer) {
    pc[partnerName].onnegotiationneeded = async () => {
      try {
        if (pc[partnerName].isNegotiating) {
          console.log(
            "negotiation needed with existing state?",
            partnerName,
            pc[partnerName].isNegotiating,
            pc[partnerName].signalingState
          );
          //return; // Chrome nested negotiation bug
        }
        pc[partnerName].isNegotiating = true;
        let offer = await pc[partnerName].createOffer();
        await pc[partnerName].setLocalDescription(offer);
        socket.emit("sdp", {
          description: pc[partnerName].localDescription,
          to: partnerName,
          sender: socketId
        });
      } finally {
        pc[partnerName].isNegotiating = false;
      }
    };
  }

  //send ice candidate to partnerNames
  pc[partnerName].onicecandidate = ({ candidate }) => {
    if (!candidate) return;
    socket.emit("icecandidates", {
      candidate: candidate,
      to: partnerName,
      sender: socketId
    });
  };

  //add
  pc[partnerName].ontrack = e => {
    let str = e.streams[0];
    if (document.getElementById(`${partnerName}-video`)) {
      document.getElementById(`${partnerName}-video`).srcObject = str;
      //When the video frame is clicked. This will enable picture-in-picture
      document
        .getElementById(`${partnerName}-video`)
        .addEventListener("click", () => {
          if (!document.pictureInPictureElement) {
            document
              .getElementById(`${partnerName}-video`)
              .requestPictureInPicture()
              .catch(error => {
                // Video failed to enter Picture-in-Picture mode.
                console.error(error);
              });
          } else {
            document.exitPictureInPicture().catch(error => {
              // Video failed to leave Picture-in-Picture mode.
              console.error(error);
            });
          }
        });
    } else {
      //video elem
      let newVid = document.createElement("video");
      newVid.id = `${partnerName}-video`;
      newVid.srcObject = str;
      newVid.autoplay = true;
      newVid.className = "remote-video";

      // Video user title
      var vtitle = document.createElement("p");
      var vuser = partnerName;
      vtitle.innerHTML = `<center>${vuser}</center>`;
      vtitle.id = `${partnerName}-title`;

      //create a new div for card
      let cardDiv = document.createElement("div");
      cardDiv.className = "card mb-3";
      cardDiv.style = "color:#FFF;";
      cardDiv.appendChild(newVid);
      cardDiv.appendChild(vtitle);

      //create a new div for everything
      let div = document.createElement("div");
      div.className = "col-sm-12 col-md-6";
      div.id = partnerName;
      div.appendChild(cardDiv);

      //put div in videos elem
      document.getElementById("videos").appendChild(div);
    }
  };

  pc[partnerName].onconnectionstatechange = d => {
    console.log(
      "Connection State Change: " + partnerName,
      pc[partnerName].iceConnectionState
    );
    // Save State
    switch (pc[partnerName].iceConnectionState) {
      case "connected":
        sendMsg(
          partnerName + " is " + pc[partnerName].iceConnectionState,
          true
        );
        break;
      case "disconnected":
        if (partnerName == socketId) {
          return;
        }
        sendMsg(
          partnerName + " is " + pc[partnerName].iceConnectionState,
          true
        );
        h.closeVideo(partnerName);
        // PC Tracking cleanup
        pcmap.get(partnerName).close();
        pcmap.delete(partnerName);
        break;
      case "new":
        /* why is new objserved when certain clients are disconnecting? */
        h.closeVideo(partnerName);
        break;
      case "failed":
        if (partnerName == socketId) {
          return;
        } // retry catch needed
        h.closeVideo(partnerName);
        break;
      case "closed":
        h.closeVideo(partnerName);
        break;
      default:
        console.log("Change of state: ", pc[partnerName].iceConnectionState);
        break;
    }
  };

  pc[partnerName].onsignalingstatechange = d => {
    console.log(
      "Signaling State Change: " + partnerName,
      pc[partnerName].signalingState
    );
    switch (pc[partnerName].signalingState) {
      case "stable":
        pc[partnerName].isNegotiating = false;
        break;
      case "closed":
        console.log("Signalling state is 'closed'");
        h.closeVideo(partnerName);
        break;
    }
  };
}
