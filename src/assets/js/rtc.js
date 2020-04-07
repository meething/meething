/**
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 6th January, 2020
 */
import h from "./helpers.js";
var TIMEGAP = 6000;
var STATE = { media: {}, users: {} };
var allUsers = [];
var enableHacks = false;

window.gunState = function() {
  console.log(STATE);
};

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
var users;
var pc = []; // hold local peerconnection statuses
var peers = window.peers=new Map();
var myStream = "";
var screenStream;
var socketId;

function initSocket() {
  var peers = [""+location.protocol+"//"+location.hostname+"/gun"];
  var opt = { peers: peers, localStorage: false, radisk: false };

  socket = Gun(opt)
    .get("rtcmeeting")
    .get(room)
    .get("socket");
  users = Gun(opt)
    .get("rtcmeeting")
    .get(room)
    .get("users");

  // Custom Emit Function
  socket.emit = function(key, value) {
    if (value.sender && value.to && value.sender == value.to) return;
    console.log("debug emit key", key, "value", value);
    if (!key || !value) return;
    if (!value.ts) value.ts = Date.now();
    if (key == "sdp" || key == "icecandidates") value = JSON.stringify(value);
    socket.get(key).put(value);
  };
}

var meUser;
var presence;
var candidates;

function initUser(r) {
  var peers = [
    ""+location.protocol+"//"+location.hostname+"/gun"
//    "https://livecodestream-us.herokuapp.com/gun",
//    "https://livecodestream-eu.herokuapp.com/gun"
  ];
  var opt = { peers: peers, localStorage: false, radisk: false };
  var gun = Gun(opt);

  var pid = sessionStorage.getItem("pid");
  if (pid == null || pid == undefined) {
    pid = gun._.opt.pid;
    sessionStorage.setItem("pid", pid);
  }

  candidates = new Candidates(gun, room);
  Candidates.prototype.onCall = onCall;
  meUser = new User(username, pid);
}

function onCall() {
  var callTo = candidates.get(this.id);
  console.log("Start calling " + callTo.name);
  //TODO make call to clicked candidate
  // pc.push(callTo.uuid);
  // init(true, callTo.uuid);
}

function enter() {
  console.log("entering " + meUser.id);
  meUser.online = true;
  // presence.addUser(meUser);
  sendMsg(meUser.name + " joining", false);
  candidates.add(meUser);
}

function leave() {
  console.log("leaving " + meUser.id);
  meUser.online = false;
  // presence.remove(meUser.id);
  sendMsg(meUser.name + " leaving", false);
  candidates.remove(meUser);
}

function sendMsg(msg, local) {
  let data = {
    room: room,
    msg: msg,
    sender: username
  };

  //emit chat message
  if (!local) socket.emit("chat", data);
  //add localchat
  h.addChat(data, "local");
}

window.onbeforeunload = function() {
  leave();
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

    window.GUN = { socket: socket, users: users };

    socketId = h.uuidv4();
    meUser.uuid = socketId; //assign UUID to own user
    enter();    

    console.log("Starting! you are", socketId);

	    // Initialize Session
      socket.emit("subscribe", {
        room: room,
        socketId: socketId,
        name: username || socketId
      });

      socket.get("subscribe").on(function(data, key) {
        // Ignore subscribes older than TIMEGAP
        if (data.ts && Date.now() - data.ts > TIMEGAP) {
          console.log('discarding old sub',data);
          return;                                             
        }
        if (pc[data.socketId] !== undefined) {
          return;
        }
        // Ignore self-generated subscribes
        if (data.socketId == socketId || data.sender == socketId) return;
        console.log("got subscribe!", data);
        socket.emit("newuser", { socketId: data.socketId });
      });
  
      socket.get("newuser").on(function(data, key) {
        if (data.ts && Date.now() - data.ts > TIMEGAP) return;
        if (data.socketId == socketId || data.sender == socketId) return;
        socket.emit("newUserStart", {
          to: data.socketId,
          sender: socketId,
          name: data.name || data.socketId
        });
        pc.push(data.socketId);
        //TODO : decide where this screen sharing happens
		    init(true,data.socketId);
      });

      socket.get("newUserStart").on(function(data, key) {
        if (data.ts && Date.now() - data.ts > TIMEGAP) return;
        if (data.socketId == socketId || data.sender == socketId) return;
        pc.push(data.sender);
        //TODO : decide where this screen sharing happens
        init(false, data.sender); 
      });

      socket.get("icecandidates").on(function(data, key) {      
        try {
          data = JSON.parse(data);
          console.log(
            data.sender.trim() + " is trying to connect with " + data.to.trim()
          );
          if (data.ts && Date.now() - data.ts > TIMEGAP) return;
          data.candidate = new RTCIceCandidate(data.candidate);
          if (!data.candidate) return;
        } catch (e) {
          console.log(e,data);
          return;
        }
        if (data.socketId == socketId || data.to != socketId) return;
        console.log("ice candidate", data);      
        data.candidate
          ? pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate))
          : "";
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
          console.log(e,data);
          return;
        }
    
        if (data.description.type === "offer") {
          data.description
            ? pc[data.sender].setRemoteDescription(
                new RTCSessionDescription(data.description)
              )
            : "";

            var opts =false;
            var method = 'getUserMedia';
            /*if(confirm('screensharing?')) {
              opts={ audio:true, video:true}
              method='getDisplayMedia';
            }*/
            // if we do screensharing, we use getDisplayMedia, if not getUserMedia 
            h[method](opts)
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
                  pc[data.sender].setLocalDescription(answer);

                  socket.emit("sdp", {
                    description: pc[data.sender].localDescription,
                    to: data.sender,
                    sender: socketId
                  });
              })
              .catch(async e => {
                console.error(`answer stream error: ${e}`);
                if(!enableHacks) return;
                  // start crazy mode lets answer anyhow
                  console.log('>>>>>>>>>>>> no media devices! answering receive only');
                  var answerConstraints = { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true }; 
                  let answer = await pc[data.sender].createAnswer(answerConstraints);
                  pc[data.sender].setLocalDescription(answer);
    
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
      function replaceVideoTrack(withTrack) {
        peers.forEach((peer,id) => {
          var _pc = (peer && typeof peer == "object" && peer.hasOwnProperty(id)) ? peer[id] : false; 
          var sender = (_pc && _pc.getSenders) ? _pc.getSenders().find(s => s.track && s.track.kind === 'video') : false;
          if (sender) {
            sender.replaceTrack(withTrack);
          }
        });
      };
      document.getElementById("chat-input").addEventListener("keypress", e => {
        if (e.which === 13 && e.target.value.trim()) {
          e.preventDefault();
  
          sendMsg(e.target.value);

          setTimeout(() => {
            e.target.value = "";
          }, 50);
        }
      });
     
      document.getElementById("toggle-screen").addEventListener("click", async (e) => {
        e.preventDefault();
        //TODO: When new people arrive to chat and you're screen sharing, send the screenStream instead of default video track
        if (screenStream) { // click-to-end.
          screenStream.getTracks().forEach(t => t.stop());
          screenStream = null;
          document.getElementById('local').srcObject = myStream;
          replaceVideoTrack(myStream.getVideoTracks()[0]);
          e.srcElement.classList.remove('sharing');
          e.srcElement.classList.add('text-white');
          e.srcElement.classList.remove('text-black');
          return;
        }
        var stream = await navigator.mediaDevices.getDisplayMedia({video: true});
        var track = stream.getVideoTracks()[0];
        replaceVideoTrack(track);
        document.getElementById('local').srcObject = stream;
        track.addEventListener('ended', () => {
            console.log('Screensharing ended via the browser UI');
            screenStream = null;
            document.getElementById('local').srcObject = myStream;
            replaceVideoTrack(myStream.getVideoTracks()[0]);
            e.srcElement.classList.remove('sharing');
            e.srcElement.classList.add('text-white');
            e.srcElement.classList.remove('text-black');    
        });
        screenStream = stream;
        e.srcElement.classList.add('sharing');
        e.srcElement.classList.remove("text-white");
        e.srcElement.classList.add("text-black");
      });
      
      document.getElementById("toggle-video").addEventListener("click", e => {
        e.preventDefault();
        if (!myStream) return;
        myStream.getVideoTracks()[0].enabled = !myStream.getVideoTracks()[0].enabled;
        console.log('local video enable: ',myStream.getVideoTracks()[0].enabled );
        //toggle video icon
        e.srcElement.classList.toggle("fa-video");
        e.srcElement.classList.toggle("fa-video-slash");
      });
  
      document.getElementById("toggle-mute").addEventListener("click", e => {
        e.preventDefault();
        if (!myStream) return;
        myStream.getAudioTracks()[0].enabled = !myStream.getAudioTracks()[0].enabled;
        console.log('local audio enable: ',myStream.getAudioTracks()[0].enabled);
        //toggle audio icon
        e.srcElement.classList.toggle("fa-volume-up");
        e.srcElement.classList.toggle("fa-volume-mute");
      });
    }
  }

function init(createOffer, partnerName, type='video'){
  pc[partnerName] = new RTCPeerConnection(h.getIceServer());
  var constraints = { video: { minFrameRate: 10, maxFrameRate: 30 }, audio: { sampleSize: 8, echoCancellation: true } };
  // Q&A: Should we use the existing myStream when available? Potential cause of issue and no-mute
  if (myStream){    
      myStream.getTracks().forEach(track => {
        pc[partnerName].addTrack(track, myStream); //should trigger negotiationneeded event
      });
  } else {
    var method = 'getUserMedia';
    if(type=='screen') {
      constraints = {
        audio:true,
        video:true
      }
      method = 'getDisplayMedia';	    
    }
    h[method](constraints)
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
      if(!enableHacks) return;
      // start crazy mode - lets offer anyway
      console.log('>>>>>>>>>>>> no media devices! offering receive only');
      var offerConstraints = { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } } 
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
      let offer = await pc[partnerName].createOffer();
      await pc[partnerName].setLocalDescription(offer);
      socket.emit("sdp", {
        description: pc[partnerName].localDescription,
        to: partnerName,
        sender: socketId
      });
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


      //Fullscreen toggler
      newVid.addEventListener('click', function(){ 
        newVid.className = /fullscreen/.test(newVid.className) ? 'remote-video' : 'remote-video fullscreen';
        if (newVid.requestFullscreen) {
          newVid.requestFullscreen();
        } else if (newVid.msRequestFullscreen) {
          newVid.msRequestFullscreen();
        } else if (newVid.mozRequestFullScreen) {
          newVid.mozRequestFullScreen();
        } else if (newVid.webkitRequestFullscreen) {
          newVid.webkitRequestFullscreen();
        }
      });
      //put div in videos elem
      document.getElementById("videos").appendChild(div);
    }
  };

  pc[partnerName].onconnectionstatechange = d => {
    console.log(
      "Connection State Change:" + pc[partnerName],
      pc[partnerName].iceConnectionState
    );
    // Save State
    STATE.media[partnerName] = pc[partnerName].iceConnectionState;
    switch (pc[partnerName].iceConnectionState) {
      case "connected":
        sendMsg(partnerName + " is " + STATE.media[partnerName], true);
        enter();
        break;
      case "disconnected":
        sendMsg(partnerName + " is " + STATE.media[partnerName], true);
        h.closeVideo(partnerName);
        leave();
        break;
      case "new":
        /* why is new objserved when certain clients are disconnecting? */
        //h.closeVideo(partnerName);
        //leave();
        break;
      case "failed":
        h.closeVideo(partnerName);
        leave();
        break;
      case "closed":
        h.closeVideo(partnerName);
        leave();
        break;
      default:
        console.log("Unknown state?", pc[partnerName].iceConnectionState);
        break;
    }
  };

  pc[partnerName].onsignalingstatechange = d => {
    console.log(
      "Signaling State Change:" + pc[partnerName],
      pc[partnerName].signalingState
    );
    switch (pc[partnerName].signalingState) {
      case "closed":
        console.log("Signalling state is 'closed'");
        h.closeVideo(partnerName);
        break;
    }
  };
  peers.set(partnerName, pc);
}
