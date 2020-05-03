/**
 * @author Lorenzo Mangani, QXIP BV <lorenzo.mangani@gmail.com>
 * @date 27th April, 2020
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 6th January, 2020
 */
import h from "./helpers.js";
import EventEmitter from "./ee.js";
import DamEventEmitter from "./emitter.js";
import Presence from "./presence.js";
import MetaData from "./metadata.js";

var DEBUG = false; // if (DEBUG) 

var TIMEGAP = 6000;
var allUsers = [];
var enableHacks = false;
var meethrix = window.meethrix = false;

var root;
var room;
var username;
var title = "ChatRoom";
var localVideo;
var audio;
var isRecording = false;
var videoBitrate = 'unlimited'

window.addEventListener('DOMContentLoaded', function () {
  room = h.getQString(location.href, "room") ? h.getQString(location.href, "room") : "";
  username = sessionStorage && sessionStorage.getItem("username") ? sessionStorage.getItem("username") : "";
  title = room.replace(/_(.*)/, '');
  localVideo = document.getElementById("local");
  if (title && document.getElementById('chat-title')) document.getElementById('chat-title').innerHTML = title;
  initSocket();
  initRTC();
});

var socket;
var room;
const pcMap = new Map(); // A map of all peer ids to their peerconnections.
window.pcmap = pcMap;
var myStream;
var screenStream;
var mutedStream,
  audioMuted = false,
  videoMuted = false;
var socketId;
var damSocket;
var presence;
var metaData;

function initSocket() {
  var roomPeer = "https://gundb-multiserver.glitch.me/lobby";
  if (room) {
    roomPeer = "https://gundb-multiserver.glitch.me/" + room;
  }

  var peers = [roomPeer];
  var opt = { peers: peers, localStorage: false, radisk: false };
  root = Gun(opt);

  socket = root
    .get("rtcmeeting")
    .get(room)
    .get("socket");
}

function sendMsg(msg, local) {
  let data = {
    room: room,
    msg: msg,
    sender: username || socketId
  };

  //emit chat message
  if (!local) {
    if (data.sender && data.to && data.sender == data.to) return;
    if (!data.ts) data.ts = Date.now();
    metaData.sentChatData(data);
  }
  //add localchat
  h.addChat(data, "local");
}
var _ev = h.isiOS() ? 'pagehide' : 'beforeunload';
window.addEventListener(_ev,function () {
  presence.leave();
  pcMap.forEach((pc, id) => {
    if (pcMap.has(id)) {
      pcMap.get(id).close();
      pcMap.delete(id);
    }
  });
});

function initPresence() {
  presence = new Presence(root, room);
  damSocket.setPresence(presence);
  presence.enter();
}

function metaDataReceived(data) {
  if (data.event == "chat") {
    if (data.ts && Date.now() - data.ts > 5000) return;
    if (data.socketId == socketId || data.sender == socketId) return;
    if (data.sender == username) return;
    if (DEBUG) console.log("got chat", data);
    h.addChat(data, "remote");
  } else if (data.event == "notification") {
    if (data.ts && Date.now() - data.ts > 5000 || data.ts == undefined || data.username == username) return;
    if (data.subEvent == "recording") {
      if (data.isRecording) {
        var notification = data.username + " started recording this meething";
        h.showNotification(notification);
      } else {
        var notification = data.username + " stopped recording this meething"
        h.showNotification(notification);
      }
    } else if (data.subEvent == "grid") {
      if (data.isOngrid) {
        var notification = data.username + " is going off the grid";
        h.showNotification(notification);
      } else {
        var notification = data.username + " is back on the grid"
        h.showNotification(notification);
      }
    } else if (data.subEvent == "mute") {
      if (data.muted) {
        var notification = data.username + " is going silence";
        h.showNotification(notification);
      } else {
        var notification = data.username + " is on speaking terms"
        h.showNotification(notification);
      }
    }
  } else if (data.event == "control") {
    if (data.username && data.socketId) {
      h.swapUserDetails(data.socketId + "-title", data);
    }
    if (data.talking) {
      if (DEBUG) console.log('Speaker Focus on ' + data.username);
      h.swapDiv(data.socketId + "-widget");
    }
    if (data.readonly) {
      if (DEBUG) console.log('Read-Only Joined: ' + data.username);
      h.showNotification("Read-Only Join by "+data.username);
      h.hideVideo(data.socketId, true);
    }
  }
  else {
    if (DEBUG) console.log("META::" + JSON.stringify(data));
    //TODO @Jabis do stuff here with the data
    //data.socketId and data.pid should give you what you want
    //Probably want to filter but didnt know if you wanted it filter on socketId or PID
  }
}

function initRTC() {
  if (!room) {
    document.querySelector("#room-create").attributes.removeNamedItem("hidden");
  } else if (!username) {
    document
      .querySelector("#username-set")
      .attributes.removeNamedItem("hidden");
  } else {
    damSocket = new DamEventEmitter(root, room);
    initPresence();
    let commElem = document.getElementsByClassName("room-comm");

    for (let i = 0; i < commElem.length; i++) {
      commElem[i].attributes.removeNamedItem("hidden");
    }

    if (localVideo)
      mutedStream = h.setMutedStream(localVideo);

    document.getElementById("demo").attributes.removeNamedItem("hidden");

    socketId = h.uuidv4();
    metaData = new MetaData(root, room, socketId, metaDataReceived);
    damSocket.setMetaData(metaData);
    metaData.sentControlData({ username: username, sender: username, status: "online", audioMuted: audioMuted, videoMuted: videoMuted });

    console.log("Starting! you are", socketId);
    presence.update(username, socketId);

    // Initialize Session
    damSocket.out("subscribe", {
      room: room,
      socketId: socketId,
      name: username || socketId
    });


    //Do we do this here this is now triggered from DAM?
    damSocket.on('Subscribe', function (data) {
      console.log("Got channel subscribe", data);
      if (data.ts && Date.now() - data.ts > TIMEGAP * 2) {
        console.log("discarding old sub", data);
        return;
      }
      if (
        pcMap.get(data.socketId) !== undefined &&
        pcMap.get(data.socketId).connectionState == "connected"
      ) {
        console.log(
          "Existing peer subscribe, discarding...",
          pcMap.get(data.socketId)
        );
        return;
      }
      // Ignore self-generated subscribes
      if (data.socketId == socketId || data.sender == socketId) return;
      if (DEBUG) console.log("got subscribe!", data);

      if (data.to && data.to != socketId) return; // experimental on-to-one reinvite (handle only messages target to us)
      /* discard new user for connected parties? */
      if (
        pcMap.get(data.socketId) &&
        pcMap.get(data.socketId).iceConnectionState == "connected"
      ) {
        if (DEBUG) console.log("already connected to peer", data.socketId);
        //return;
      }
      // New Peer, setup peerConnection
      damSocket.out("newUserStart", {
        to: data.socketId,
        sender: socketId,
        name: data.name || data.socketId
      });

      init(true, data.socketId);
    });

    damSocket.on('NewUserStart', function (data) {
      if (data.ts && Date.now() - data.ts > TIMEGAP) return;
      if (data.socketId == socketId || data.sender == socketId) return;
      if (
        pcMap.get(data.sender) &&
        pcMap.get(data.sender).connectionState == "connected" &&
        pcMap.get(data.sender).iceConnectionState == "connected"
      ) {
        if (DEBUG) console.log("already connected to peer? bypass", data.socketId);
        return; // We don't need another round of Init for existing peers
      }

      init(false, data.sender);
    });

    damSocket.on('IceCandidates', function (data) {
      try {
        if (
          (data.ts && Date.now() - data.ts > TIMEGAP) ||
          !data.sender ||
          !data.to
        )
        return;
        if (DEBUG) console.log(
          data.sender.trim() + " is trying to connect with " + data.to.trim()
        );
        data.candidate = new RTCIceCandidate(data.candidate);
        if (!data.candidate) return;
      } catch (e) {
        console.log(e, data);
        return;
      }
      if (data.socketId == socketId || data.to != socketId) return;
      if (DEBUG) console.log("ice candidate", data);
      //data.candidate ? pcMap.get(data.sender).addIceCandidate(new RTCIceCandidate(data.candidate)) : "";
      data.candidate ? pcMap.get(data.sender).addIceCandidate(data.candidate) : "";
    });

    damSocket.on('SDP', function (data) {
      try {
        if (data.ts && Date.now() - data.ts > TIMEGAP) return;
        if (
          !data ||
          data.socketId == socketId ||
          data.sender == socketId ||
          !data.description
        )
          return;
        if (data.to !== socketId) {
          if (DEBUG) console.log("not for us? dropping sdp");
          return;
        }
      } catch (e) {
        console.log(e, data);
        return;
      }

      if (data.description.type === "offer") {
        data.description
          ? pcMap.get(data.sender).setRemoteDescription(
            new RTCSessionDescription(data.description)
          )
          : "";

        h.getUserMedia()
          .then(async stream => {
            if (localVideo) h.setVideoSrc(localVideo, stream);

            //save my stream
            myStream = stream;

            stream.getTracks().forEach(track => {
              pcMap.get(data.sender).addTrack(track, stream);
            });

            let answer = await pcMap.get(data.sender).createAnswer();
            answer.sdp = setMediaBitrates(answer.sdp);
	    // SDP Interop
	    // if (navigator.mozGetUserMedia) answer = Interop.toUnifiedPlan(answer);
	    // SDP Bitrate Hack
	    // if (answer.sdp) answer.sdp = h.setMediaBitrate(answer.sdp, 'video', 500);

            await pcMap.get(data.sender).setLocalDescription(answer);

            damSocket.out("sdp", {
              description: pcMap.get(data.sender).localDescription,
              to: data.sender,
              sender: socketId
            });
          })
          .catch(async e => {
            console.error(`answer stream error: ${e}`);
	    if (!enableHacks) {
               var r = confirm("No Media Devices! Join as Viewer?");
	       if (r) {
		 enableHacks = true;
                 metaData.sentControlData({ username: username + "(readonly)", id: socketId, readonly: true });
	       } else { location.replace("/"); return; }
	    }
            // start crazy mode lets answer anyhow
            console.log(
              "no media devices! answering receive only"
            );
            var answerConstraints = {
              OfferToReceiveAudio: true,
              OfferToReceiveVideo: true
            };
            let answer = await pcMap.get(data.sender).createAnswer(answerConstraints);
            answer.sdp = setMediaBitrates(answer.sdp);
	    // SDP Interop
	    // if (navigator.mozGetUserMedia) answer = Interop.toUnifiedPlan(answer);
            await pcMap.get(data.sender).setLocalDescription(answer);

            damSocket.out("sdp", {
              description: pcMap.get(data.sender).localDescription,
              to: data.sender,
              sender: socketId
            });
            // end crazy mode
          });
      } else if (data.description.type === "answer") {
        pcMap.get(data.sender).setRemoteDescription(
          new RTCSessionDescription(data.description)
        );
      }
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
      var muted = mutedStream ? mutedStream : h.getMutedStream();
      var mine = myStream ? myStream : muted;
      if (!mine) {
        return;
      }
      if (!videoMuted) {
        h.replaceVideoTrackForPeers(pcMap, muted.getVideoTracks()[0]).then(r => {
          videoMuted = true;
          h.setVideoSrc(localVideo,muted);
          e.srcElement.classList.remove("fa-video");
          e.srcElement.classList.add("fa-video-slash");
	  h.showNotification("Video Disabled");
        });
      } else {
        h.replaceVideoTrackForPeers(pcMap, mine.getVideoTracks()[0]).then(r => {
          h.setVideoSrc(localVideo,mine);
          videoMuted = false;
          e.srcElement.classList.add("fa-video");
          e.srcElement.classList.remove("fa-video-slash");
	  h.showNotification("Video Enabled");
        });
      }

    });

    document.getElementById("record-toggle").addEventListener("click", e => {
      e.preventDefault();

      if (!isRecording) {
        h.recordAudio();
        isRecording = true
        e.srcElement.classList.add("text-danger");
        e.srcElement.classList.remove("text-white");
	h.showNotification("Recording Started");

      } else {
        h.stopRecordAudio()
        isRecording = false
        e.srcElement.classList.add("text-white");
        e.srcElement.classList.remove("text-danger");
	h.showNotification("Recording Stopped");
      }
      metaData.sentNotificationData({ username: username, subEvent: "recording", isRecording: isRecording })
    });

    document.getElementById("toggle-mute").addEventListener("click", e => {
      e.preventDefault();
      var muted = mutedStream ? mutedStream : h.getMutedStream();
      var mine = myStream ? myStream : muted;
      if (!mine) {
        return;
      }
      if (!audioMuted) {
        h.replaceAudioTrackForPeers(pcMap, muted.getAudioTracks()[0]).then(r => {
          audioMuted = true;
          //localVideo.srcObject = muted; // TODO: Show voice muted icon on top of the video or something
          e.srcElement.classList.remove("fa-volume-up");
          e.srcElement.classList.add("fa-volume-mute");
          metaData.sentNotificationData({ username: username, subEvent: "mute", muted: audioMuted });
 	  h.showNotification("Audio Muted");
        });
      } else {
        h.replaceAudioTrackForPeers(pcMap, mine.getAudioTracks()[0]).then(r => {
          audioMuted = false;
          //localVideo.srcObject = mine; 
          e.srcElement.classList.add("fa-volume-up");
          e.srcElement.classList.remove("fa-volume-mute");
          metaData.sentNotificationData({ username: username, subEvent: "mute", muted: audioMuted });
 	  h.showNotification("Audio Unmuted");
        });
      }

    });

    document.getElementById("toggle-invite").addEventListener("click", e => {
      e.preventDefault();
      //if (!myStream) return;
      if (DEBUG) console.log("Re-Send presence to all users...");
      var r = confirm("Re-Invite ALL room participants?");
      if (r == true) {
        damSocket.out("subscribe", {
          room: room,
          socketId: socketId,
          name: username || socketId
        });
      }
    });

    document
      .getElementById("toggle-screen")
      .addEventListener("click", async e => {
        e.preventDefault();
        if (screenStream) {
          screenStream.getTracks().forEach(t => {
            t.stop();
            t.onended();
          });
        } else {
          var stream = await h.getDisplayMedia({ audio: true, video: true });
          var atrack = stream.getAudioTracks()[0];
          var vtrack = stream.getVideoTracks()[0];
          if (false) h.replaceAudioTrackForPeers(pcMap, atrack); // TODO: decide somewhere whether to stream audio from DisplayMedia or not
          h.replaceVideoTrackForPeers(pcMap, vtrack);
          h.setVideoSrc(localVideo,stream);
          vtrack.onended = function (event) {
            if (DEBUG) console.log("Screensharing ended via the browser UI");
            screenStream = null;
            if (myStream) {
              h.setVideoSrc(localVideo, myStream);
              h.replaceStreamForPeers(pcMap, myStream);
            }
            e.srcElement.classList.remove("sharing");
            e.srcElement.classList.add("text-white");
            e.srcElement.classList.remove("text-black");
          };
          screenStream = stream;
          e.srcElement.classList.add("sharing");
          e.srcElement.classList.remove("text-white");
          e.srcElement.classList.add("text-black");
        }
      });

    document.getElementById("private-toggle").addEventListener("click", e => {
      e.preventDefault();
      // Detect if we are already in private mode
      let keys = Object.keys(presence.root._.opt.peers);
      if (keys.length == 0) {
        //if in private mode, go public
        presence.onGrid(presence.room);
        e.srcElement.classList.remove("fa-lock");
        e.srcElement.classList.add("fa-unlock");
        metaData.sentNotificationData({ username: username, subEvent: "grid", isOngrid: false })
      } else {
        //if public, go private
        metaData.sentNotificationData({ username: username, subEvent: "grid", isOngrid: true })
        presence.offGrid();
        e.srcElement.classList.remove("fa-unlock");
        e.srcElement.classList.add("fa-lock");
      }
    });
  }
}

function init(createOffer, partnerName) {
  // OLD: track peerconnections in array
  if (pcMap.has(partnerName)) return pcMap.get(partnerName);
   var pcPartnerName = new RTCPeerConnection(h.getIceServer());
  // DAM: replace with local map keeping tack of users/peerconnections
  pcMap.set(partnerName, pcPartnerName); // MAP Tracking
  h.addVideo(partnerName, false);

  // Q&A: Should we use the existing myStream when available? Potential cause of issue and no-mute
  if (screenStream) {
    var tracks = {};
    tracks['audio'] = screenStream.getAudioTracks();
    tracks['video'] = screenStream.getVideoTracks();
    if (myStream) {
      tracks['audio'] = myStream.getAudioTracks(); //We want sounds from myStream if there is such
      if (!tracks.video.length) tracks['video'] = myStream.getVideoTracks(); //also if our screenStream is malformed, let's default to myStream in that case
    }
    ['audio', 'video'].map(tracklist => {
      tracks[tracklist].forEach(track => {
        pcPartnerName.addTrack(track, screenStream); //should trigger negotiationneeded event
      });
    });
  } else if (!screenStream && myStream) {
    var tracks = {};
    tracks['audio'] = myStream.getAudioTracks();
    tracks['video'] = myStream.getVideoTracks();
    if (audioMuted || videoMuted) {
      var mutedStream = mutedStream ? mutedStream : h.getMutedStream();
      if (videoMuted) tracks['video'] = mutedStream.getVideoTracks();
      if (audioMuted) tracks['audio'] = mutedStream.getAudioTracks();
    }
    ['audio', 'video'].map(tracklist => {
      tracks[tracklist].forEach(track => {
        pcPartnerName.addTrack(track, myStream); //should trigger negotiationneeded event
      });
    });
  } else {
    h.getUserMedia()
      .then(stream => {
        //save my stream
        myStream = stream;
        var mixstream = null;
        //provide access to window for debug
        if(h.canCreateMediaStream()){
          mixstream = new MediaStream();
        } else {
          //Safari trickery
          mixstream = myStream.clone();
          mixstream.getTracks().forEach(track=>{
            mixstream.removeTrack(track);
          });
        }
        window.myStream = myStream;
        window.mixstream = mixstream;
        var tracks = {};
        tracks['audio'] = myStream.getAudioTracks();
        tracks['video'] = myStream.getVideoTracks();
        if (audioMuted || videoMuted) {
          var mutedStream = mutedStream ? mutedStream : h.getMutedStream();
          if (videoMuted) tracks['video'] = mutedStream.getVideoTracks();
          if (audioMuted) tracks['audio'] = mutedStream.getAudioTracks();
        }
        ['audio', 'video'].map(tracklist => {
          tracks[tracklist].forEach(track => {
            mixstream.addTrack(track);
            pcPartnerName.addTrack(track, mixstream); //should trigger negotiationneeded event
          });
        });

        h.setVideoSrc(localVideo, mixstream);

        // SoundMeter for Local Stream
        if (myStream) {
          // Soundmeter
          if (DEBUG) console.log('Init Soundmeter.........');
          const soundMeter = new SoundMeter(function () {
              if (DEBUG) console.log('Imm Speaking! Sending metadata mesh focus...');
              if (!audioMuted) metaData.sentControlData({ username: username, id: socketId, talking: true });
          });
          soundMeter.connectToSource(myStream)
        }

      })
      .catch(async e => {
        console.error(`stream error: ${e}`);
        if (!enableHacks) return;
        // start crazy mode - lets offer anyway
        console.log("no media devices! offering receive only");
        var offerConstraints = {
          mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true }
        };
        let offer = await pcPartnerName.createOffer(offerConstraints);
        offer.sdp = setMediaBitrates(offer.sdp);
        // SDP Interop
	// if (navigator.mozGetUserMedia) offer = Interop.toUnifiedPlan(offer);
        await pcPartnerName.setLocalDescription(offer);
        damSocket.out("sdp", {
          description: pcPartnerName.localDescription,
          to: partnerName,
          sender: socketId
        });
        // end crazy mode
      });
  }

  //create offer
  if (createOffer) {
    pcPartnerName.onnegotiationneeded = async () => {
      try {
        if (pcPartnerName.isNegotiating) {
          console.log(
            "negotiation needed with existing state?",
            partnerName,
            pcPartnerName.isNegotiating,
            pcPartnerName.signalingState
          );
          return; // Chrome nested negotiation bug
        }
        pcPartnerName.isNegotiating = true;
        let offer = await pcPartnerName.createOffer();
        offer.sdp = setMediaBitrates(offer.sdp);
	// SDP Interop
	// if (navigator.mozGetUserMedia) offer = Interop.toUnifiedPlan(offer);
	// SDP Bitrate Hack
	// if (offer.sdp) offer.sdp = h.setMediaBitrate(offer.sdp, 'video', 500);

        await pcPartnerName.setLocalDescription(offer);
        damSocket.out("sdp", {
          description: pcPartnerName.localDescription,
          to: partnerName,
          sender: socketId
        });
      } finally {
        pcPartnerName.isNegotiating = false;
      }
    };
  }

  //send ice candidate to partnerNames
  pcPartnerName.onicecandidate = ({ candidate }) => {
    if (!candidate) return;
    damSocket.out("icecandidates", {
      candidate: candidate,
      to: partnerName,
      sender: socketId
    });
  };

  //add
  pcPartnerName.ontrack = e => {
    let str = e.streams[0];
    var el = document.getElementById(`${partnerName}-video`);
    if (el) {
      h.setVideoSrc(el,str);
    } else {
      h.addVideo(partnerName, str);
    }
  };

  pcPartnerName.onconnectionstatechange = d => {
    console.log(
      "Connection State Change: " + partnerName,
      pcPartnerName.iceConnectionState
    );
    // Save State
    switch (pcPartnerName.iceConnectionState) {
      case "connected":
        sendMsg(
          partnerName + " is " + pcPartnerName.iceConnectionState,
          true
        );
        h.hideVideo(partnerName, false);
	metaData.sentControlData({ username: username, id: socketId, online: true });
        break;
      case "disconnected":
        if (partnerName == socketId) {
          return;
        }
        sendMsg(
          partnerName + " is " + pcPartnerName.iceConnectionState,
          true
        );
        h.closeVideo(partnerName);
        // PC Tracking cleanup
        pcMap.get(partnerName).close();
        pcMap.delete(partnerName);
        break;
      case "new":
        // h.hideVideo(partnerName, true);
        /* objserved when certain clients are stuck disconnecting/reconnecting - do we need to trigger a new candidate? */
	/* GC if state is stuck */
        break;
      case "failed":
        if (partnerName == socketId) {
          return;
        } // retry catch needed
        h.closeVideo(partnerName);
	// Send presence to attempt a reconnection
        damSocket.out("subscribe", {
          room: room,
          socketId: socketId,
          name: username || socketId
        });
        break;
      case "closed":
        h.closeVideo(partnerName);
        pcMap.get(partnerName).close();
        pcMap.delete(partnerName);
        break;
      default:
        console.log("Change of state: ", pcPartnerName.iceConnectionState);
        break;
    }
  };

  pcPartnerName.onsignalingstatechange = d => {
    console.log(
      "Signaling State Change: " + partnerName,
      pcPartnerName.signalingState
    );
    //h.hideVideo(pcPartnerName, pcPartnerName.isNegotiating);
    switch (pcPartnerName.signalingState) {
      case "have-local-offer":
        pcPartnerName.isNegotiating = true;
	setTimeout(function(){
		console.log('set GC for',partnerName);
		if(pcPartnerName.signalingState == "have-local-offer"){
			console.log('GC Stuck Peer '+partnerName, pcPartnerName.signalingState);
		        // pcMap.get(partnerName).close();
			h.closeVideo(partnerName);
		}
	}, 5000, pcPartnerName, partnerName);
	/* GC if state is stuck */
        break;
      case "stable":
        pcPartnerName.isNegotiating = false;
        break;
      case "closed":
        console.log("Signalling state is 'closed'");
	// Do we have a connection? If not kill the widget
	if (pcPartnerName.iceConnectionState !== "connected") {
		h.closeVideo(partnerName);
	        pcMap.delete(partnerName);
	}
        // Peers go down here and there - let's send a Subscribe, Just in case...
        damSocket.out("subscribe", {
          room: room,
          socketId: socketId,
          name: username || socketId
        });
        break;
    }
  };
}

function calculateBitrate() {
  var oldBitrate = videoBitrate;
  switch (presence.users.size) {
    case 0:
    case 1:
    case 2:
      videoBitrate = "2000";
      break;
    case 3:
      videoBitrate = "1000";
      break;
    case 4:
      videoBitrate = "500";
      break;
    case 5:
      videoBitrate = "250";
      break;
    case 6:
      videoBitrate = "125";
      break;
    default:
      videoBitrate = "60";
      break;
  }

  if (oldBitrate == videoBitrate) {
    return false;
  } else {
    sendMsg("Bitrate " + videoBitrate, true);
    return true;
  }
}

function setBitrate(count) {
  if (calculateBitrate()) {
    console.log("Adapt to " + count + " users");
    if ((adapter.browserDetails.browser === 'chrome' ||
      adapter.browserDetails.browser === 'safari' ||
      (adapter.browserDetails.browser === 'firefox' &&
        adapter.browserDetails.version >= 64)) &&
      'RTCRtpSender' in window &&
      'setParameters' in window.RTCRtpSender.prototype) {
      var bandwidth = videoBitrate;
      console.log("Setting bandwidth::" + bandwidth);
      pc.forEach((pc1, id) => {
        pc[pc1].getSenders().forEach((sender) => {
          if (sender.transport && sender.transport.state == "connected") {
            const parameters = sender.getParameters();
            if (!parameters.encodings) {
              parameters.encodings = [{}];
            }
            if (bandwidth === 'unlimited') {
              console.log("Removing bitrate setting");
              if (parameters.encodings[0]) {
                delete parameters.encodings[0].maxBitrate;
              }
            } else {
              if (parameters.encodings[0] !== undefined) {
                parameters.encodings[0].maxBitrate = bandwidth * 1000;
              }
            }
            sender.setParameters(parameters)
              .then(() => {
                console.log("Done setting Bandwidth to:" + bandwidth)
              })
              .catch(e => console.error(e));
          }
        })
      });
      return;
    }
  }
}

function setMediaBitrates(sdp) {
  if (videoBitrate == 'unlimited' || !calculateBitrate()) {
    console.log("Not changing bitrate max is set")
    return sdp;
  } else {
    return setMediaBitrate(setMediaBitrate(sdp, "video", videoBitrate), "audio", 50);
  }
}

function setMediaBitrate(sdp, media, bitrate) {
  var lines = sdp.split("\n");
  var line = -1;
  for (var i = 0; lines.length; i++) {
    if (lines[i].indexOf("m=" + media) === 0) {
      line = i;
      break;
    }
  }
  if (line === -1) {
    console.debug("Could not find the m line for", media);
    return sdp;
  }
  console.debug("Found the m line for", media, "at line", line);

  // Pass the m line
  line++;

  // Skip i and c lines
  while (lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
    line++;
  }

  // If we're on a b line, replace it
  if (lines[line].indexOf("b") === 0) {
    console.debug("Replaced b line at line", line);
    lines[line] = "b=AS:" + bitrate;
    return lines.join("\n");
  }

  // Add a new b line
  console.debug("Adding new b line before line", line);
  var newLines = lines.slice(0, line)
  newLines.push("b=AS:" + bitrate)
  newLines = newLines.concat(lines.slice(line, lines.length))
  return newLines.join("\n")
}
