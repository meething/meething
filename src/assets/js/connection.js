// need to split this intelligently, might be above me
import DamEventEmitter from "./emitter.js";
import Presence from "./presence.js";
import MetaData from "./metadata.js";

export default class Connection {
  constructor (mediator){
    this.mediator = mediator;
    this.inited = false;
  }
  // for now MCU webRTC, soon need to make SFU here with mode switching
  establish () {
    if(this.inited) return;
    this.inited = true;

      this.mediator.damSocket = new DamEventEmitter(this.mediator.root, this.mediator.room);
      let commElem = document.getElementsByClassName("room-comm");

      for (let i = 0; i < commElem.length; i++) {
        commElem[i].hidden=false;
      }

      document.getElementById("demo").hidden = false;

      this.mediator.socketId = this.mediator.h.uuidv4();
      this.mediator.damSocket.on("postauth",function(auth){
        this.initPresence();
        this.mediator.metaData = new MetaData(this.mediator.root, this.mediator.room, this.mediator.socketId, this.metaDataReceived.bind(this));
        this.mediator.damSocket.setMetaData(this.mediator.metaData);
        this.mediator.metaData.sendControlData({ username: this.mediator.username, sender: this.mediator.username, status: "online", audioMuted: this.mediator.audioMuted, videoMuted: this.mediator.videoMuted });

        console.log("Starting! you are", this.mediator.socketId);
        this.mediator.presence.update(this.mediator.username, this.mediator.socketId);


      // Initialize Session
      this.mediator.damSocket.out("subscribe", {
        room: room,
        socketId: this.mediator.socketId,
        name: this.mediator.username || this.mediator.socketId
      });


      //Do we do this here this is now triggered from DAM?
      this.mediator.damSocket.on('Subscribe', function (data) {
        console.log("Got channel subscribe", data);
        if (data.ts && Date.now() - data.ts > TIMEGAP * 2) {
          console.log("discarding old sub", data);
          return;
        }
        if (
          this.mediator.pcMap.get(data.socketId) !== undefined &&
          this.mediator.pcMap.get(data.socketId).connectionState == "connected"
        ) {
          console.log(
            "Existing peer subscribe, discarding...",
            this.mediator.pcMap.get(data.socketId)
          );
          return;
        }
        // Ignore self-generated subscribes
        if (data.socketId == this.mediator.socketId || data.sender == this.mediator.socketId) return;
        if (this.mediator.DEBUG) console.log("got subscribe!", data);

        if (data.to && data.to != this.mediator.socketId) return; // experimental on-to-one reinvite (handle only messages target to us)
        /* discard new user for connected parties? */
        if (
          this.mediator.pcMap.get(data.socketId) &&
          this.mediator.pcMap.get(data.socketId).iceConnectionState == "connected"
        ) {
          if (this.mediator.DEBUG) console.log("already connected to peer", data.socketId);
          //return;
        }
        // New Peer, setup peerConnection
        this.mediator.damSocket.out("newUserStart", {
          to: data.socketId,
          sender: this.mediator.socketId,
          name: data.name || data.socketId
        });

        this.init(true, data.socketId);
      }.bind(this));

      this.mediator.damSocket.on('NewUserStart', function (data) {
        if (data.ts && Date.now() - data.ts > TIMEGAP) return;
        if (data.socketId == this.mediator.socketId || data.sender == this.mediator.socketId) return;
        if (
          this.mediator.pcMap.get(data.sender) &&
          this.mediator.pcMap.get(data.sender).connectionState == "connected" &&
          this.mediator.pcMap.get(data.sender).iceConnectionState == "connected"
        ) {
          if (this.mediator.DEBUG) console.log("already connected to peer? bypass", data.socketId);
          return; // We don't need another round of Init for existing peers
        }

        this.init(false, data.sender);
      }.bind(this));

      this.mediator.damSocket.on('IceCandidates', function (data) {
        try {
          if (
            (data.ts && Date.now() - data.ts > TIMEGAP) ||
            !data.sender ||
            !data.to
          )
          return;
          if (this.mediator.DEBUG) console.log(
            data.sender.trim() + " is trying to connect with " + data.to.trim()
          );
          if(data.candidate && data.candidate.hasOwnProperty('candidate')){
            if(!data.candidate.candidate) return; //Edge receiving BLANK candidates from STUN/TURN - ice fails if we pass it along to non-EDGE clients
          }
          data.candidate = new RTCIceCandidate(data.candidate);
          if (!data.candidate) return;
        } catch (e) {
          console.log(e, data);
          return;
        }
        if (data.socketId == this.mediator.socketId || data.to != this.mediator.socketId) return;
        if (this.mediator.DEBUG) console.log("ice candidate", data);
        //data.candidate ? pcMap.get(data.sender).addIceCandidate(new RTCIceCandidate(data.candidate)) : "";
        data.candidate ? this.mediator.pcMap.get(data.sender).addIceCandidate(data.candidate) : "";
      }.bind(this));

      this.mediator.damSocket.on('SDP', function (data) {
        try {
          if (data.ts && Date.now() - data.ts > TIMEGAP) return;
          if (
            !data ||
            data.socketId == this.mediator.socketId ||
            data.sender == this.mediator.socketId ||
            !data.description
          )
            return;
          if (data.to !== this.mediator.socketId) {
            if (this.mediator.DEBUG) console.log("not for us? dropping sdp");
            return;
          }
        } catch (e) {
          console.log(e, data);
          return;
        }

        if (data.description.type === "offer") {
          data.description
            ? this.mediator.pcMap.get(data.sender).setRemoteDescription(
              new RTCSessionDescription(data.description)
            )
            : "";

          this.mediator.h.getUserMedia()
            .then(async stream => {
              if (this.mediator.localVideo) this.mediator.h.setVideoSrc(this.mediator.localVideo, stream);

              //save my stream
              this.mediator.myStream = stream;

              stream.getTracks().forEach(track => {
                this.mediator.pcMap.get(data.sender).addTrack(track, stream);
              });

              let answer = await this.mediator.pcMap.get(data.sender).createAnswer();
              answer.sdp = this.setMediaBitrates(answer.sdp);
        // SDP Interop
        // if (navigator.mozGetUserMedia) answer = Interop.toUnifiedPlan(answer);
        // SDP Bitrate Hack
        // if (answer.sdp) answer.sdp = h.setMediaBitrate(answer.sdp, 'video', 500);

              await this.mediator.pcMap.get(data.sender).setLocalDescription(answer);

              this.mediator.damSocket.out("sdp", {
                description: this.mediator.pcMap.get(data.sender).localDescription,
                to: data.sender,
                sender: this.mediator.socketId
              });
            })
            .catch(async e => {
              console.error(`answer stream error: ${e}`);
              if (!this.mediator.enableHacks) {
                       var r = confirm("No Media Devices! Join as Viewer?");
                 if (r) {
                   this.mediator.enableHacks = true;
                   this.mediator.metaData.sendControlData({ username: this.mediator.username + "(readonly)", id: this.mediator.socketId, readonly: true });
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
              let answer = await this.mediator.pcMap.get(data.sender).createAnswer(answerConstraints);
              answer.sdp = this.setMediaBitrates(answer.sdp);
        // SDP Interop
        // if (navigator.mozGetUserMedia) answer = Interop.toUnifiedPlan(answer);
              await this.mediator.pcMap.get(data.sender).setLocalDescription(answer);

              this.mediator.damSocket.out("sdp", {
                description: this.mediator.pcMap.get(data.sender).localDescription,
                to: data.sender,
                sender: this.mediator.socketId
              });
              // end crazy mode
            });
        } else if (data.description.type === "answer") {
          this.mediator.pcMap.get(data.sender).setRemoteDescription(
            new RTCSessionDescription(data.description)
          );
        }
      }.bind(this));

      document.getElementById("chat-input").addEventListener("keypress", e => {
        if (e.which === 13 && e.target.value.trim()) {
          e.preventDefault();

          this.sendMsg(e.target.value);

          setTimeout(() => {
            e.target.value = "";
          }, 50);
        }});

      document.getElementById("toggle-video").addEventListener("click", e => {
        e.preventDefault();
        var muted = this.mediator.mutedStream ? this.mediator.mutedStream : this.mediator.h.getMutedStream();
        var mine = this.mediator.myStream ? this.mediator.myStream : muted;
        if (!mine) {
          return;
        }
        if (!this.mediator.videoMuted) {
          this.mediator.h.replaceVideoTrackForPeers(this.mediator.pcMap, muted.getVideoTracks()[0]).then(r => {
            this.mediator.videoMuted = true;
            this.mediator.h.setVideoSrc(this.mediator.localVideo,muted);
            e.srcElement.classList.remove("fa-video");
            e.srcElement.classList.add("fa-video-slash");
            this.mediator.h.showNotification("Video Disabled");
          });
        } else {
          this.mediator.h.replaceVideoTrackForPeers(this.mediator.pcMap, mine.getVideoTracks()[0]).then(r => {
            this.mediator.h.setVideoSrc(this.mediator.localVideo,mine);
            this.mediator.videoMuted = false;
            e.srcElement.classList.add("fa-video");
            e.srcElement.classList.remove("fa-video-slash");
            this.mediator.h.showNotification("Video Enabled");
          });
        }

      });

      document.getElementById("record-toggle").addEventListener("click", e => {
        e.preventDefault();

        if (!this.mediator.isRecording) {
          this.mediator.h.recordAudio();
          this.mediator.isRecording = true
          e.srcElement.classList.add("text-danger");
          e.srcElement.classList.remove("text-white");
    this.mediator.h.showNotification("Recording Started");

        } else {
          this.mediator.h.stopRecordAudio()
          this.mediator.isRecording = false
          e.srcElement.classList.add("text-white");
          e.srcElement.classList.remove("text-danger");
    this.mediator.h.showNotification("Recording Stopped");
        }
        this.mediator.metaData.sendNotificationData({ username: this.mediator.username, subEvent: "recording", isRecording: this.mediator.isRecording })
      });

      document.getElementById("toggle-mute").addEventListener("click", e => {
        e.preventDefault();
        var muted = this.mediator.mutedStream ? this.mediator.mutedStream : this.mediator.h.getMutedStream();
        var mine = this.mediator.myStream ? this.mediator.myStream : muted;
        if (!mine) {
          return;
        }
        if (!this.mediator.audioMuted) {
          this.mediator.h.replaceAudioTrackForPeers(this.mediator.pcMap, muted.getAudioTracks()[0]).then(r => {
            this.mediator.audioMuted = true;
            //localVideo.srcObject = muted; // TODO: Show voice muted icon on top of the video or something
            e.srcElement.classList.remove("fa-volume-up");
            e.srcElement.classList.add("fa-volume-mute");
            this.mediator.metaData.sendNotificationData({ username: this.mediator.username, subEvent: "mute", muted: this.mediator.audioMuted });
            this.mediator.h.showNotification("Audio Muted");
            this.mediator.myStream.getAudioTracks()[0].enabled = !this.mediator.audioMuted;
          });
        } else {
          this.mediator.h.replaceAudioTrackForPeers(this.mediator.pcMap, mine.getAudioTracks()[0]).then(r => {
            this.mediator.audioMuted = false;
            //localVideo.srcObject = mine;
            e.srcElement.classList.add("fa-volume-up");
            e.srcElement.classList.remove("fa-volume-mute");
            this.mediator.metaData.sendNotificationData({ username: this.mediator.username, subEvent: "mute", muted: this.mediator.audioMuted });
            this.mediator.h.showNotification("Audio Unmuted");
            this.mediator.myStream.getAudioTracks()[0].enabled = !this.mediator.audioMuted;
          });
        }

      });

      document.getElementById("toggle-invite").addEventListener("click", e => {
        e.preventDefault();
        //if (!myStream) return;
        if (this.mediator.DEBUG) console.log("Re-Send presence to all users...");
        var r = confirm("Re-Invite ALL room participants?");
        if (r == true) {
          this.mediator.damSocket.out("subscribe", {
            room: this.mediator.room,
            socketId: this.mediator.socketId,
            name: this.mediator.username || this.mediator.socketId
          });
        }
      });

      document
        .getElementById("toggle-screen")
        .addEventListener("click", async e => {
          e.preventDefault();
          if (this.mediator.screenStream) {
            this.mediator.screenStream.getTracks().forEach(t => {
              t.stop();
              t.onended();
            });
          } else {
            var stream = await this.mediator.h.getDisplayMedia({ audio: true, video: true });
            var atrack = stream.getAudioTracks()[0];
            var vtrack = stream.getVideoTracks()[0];
            if (false) this.mediator.h.replaceAudioTrackForPeers(this.mediator.pcMap, atrack); // TODO: decide somewhere whether to stream audio from DisplayMedia or not
            this.mediator.h.replaceVideoTrackForPeers(this.mediator.pcMap, vtrack);
            this.mediator.h.setVideoSrc(this.mediator.localVideo,stream);
            vtrack.onended = function (event) {
              if (this.mediator.DEBUG) console.log("Screensharing ended via the browser UI");
              this.mediator.screenStream = null;
              if (this.mediator.myStream) {
                this.mediator.h.setVideoSrc(this.mediator.localVideo, this.mediator.myStream);
                this.mediator.h.replaceStreamForPeers(this.mediator.pcMap, this.mediator.myStream);
              }
              e.srcElement.classList.remove("sharing");
              e.srcElement.classList.add("text-white");
              e.srcElement.classList.remove("text-black");
            };
            this.mediator.screenStream = stream;
            e.srcElement.classList.add("sharing");
            e.srcElement.classList.remove("text-white");
            e.srcElement.classList.add("text-black");
          }
        });

      document.getElementById("private-toggle").addEventListener("click", e => {
        e.preventDefault();
        // Detect if we are already in private mode
        let keys = Object.keys(this.mediator.presence.root._.opt.peers);
        if (keys.length == 0) {
          //if in private mode, go public
          this.mediator.presence.onGrid(this.mediator.presence.room);
          e.srcElement.classList.remove("fa-lock");
          e.srcElement.classList.add("fa-unlock");
          this.mediator.metaData.sendNotificationData({ username: this.mediator.username, subEvent: "grid", isOngrid: false })
        } else {
          //if public, go private
          this.mediator.metaData.sendNotificationData({ username: this.mediator.username, subEvent: "grid", isOngrid: true })
          this.mediator.presence.offGrid();
          e.srcElement.classList.remove("fa-unlock");
          e.srcElement.classList.add("fa-lock");
        }
      });
    }.bind(this));

    var _ev = this.mediator.h.isiOS() ? 'pagehide' : 'beforeunload';

    window.addEventListener(_ev,function () {
      if(this.mediator.damSocket && this.mediator.damSocket.getPresence()) this.mediator.damSocket.getPresence().leave();
      this.mediator.pcMap.forEach((pc, id) => {
        if (this.mediator.pcMap.has(id)) {
          this.mediator.pcMap.get(id).close();
          this.mediator.pcMap.delete(id);
        }
      });
    }.bind(this));
  }

  initPresence () {
    this.mediator.presence = new Presence(root, room);
    this.mediator.damSocket.setPresence(this.mediator.presence);
    // why not use natural typeOf? don't tell me edge doesn't support that?? @jabis
    if(this.mediator.h.typeOf(this.mediator.presence.enter)=="function") this.mediator.presence.enter();
  }

  metaDataReceived (data) {
    if (data.event == "chat") {
      if (data.ts && Date.now() - data.ts > 5000) return;
      if (data.socketId == this.mediator.socketId || data.sender == this.mediator.socketId) return;
      if (data.sender == this.mediator.username) return;
      if (this.mediator.DEBUG) console.log("got chat", data);
      this.mediator.h.addChat(data, "remote");
    } else if (data.event == "notification") {
      if (data.ts && Date.now() - data.ts > 5000 || data.ts == undefined || data.username == this.mediator.username) return;
      if (data.subEvent == "recording") {
        if (data.isRecording) {
          var notification = data.username + " started recording this meething";
          this.mediator.h.showNotification(notification);
        } else {
          var notification = data.username + " stopped recording this meething"
          this.mediator.h.showNotification(notification);
        }
      } else if (data.subEvent == "grid") {
        if (data.isOngrid) {
          var notification = data.username + " is going off the grid";
          this.mediator.h.showNotification(notification);
        } else {
          var notification = data.username + " is back on the grid"
          this.mediator.h.showNotification(notification);
        }
      } else if (data.subEvent == "mute") {
        if (data.muted) {
          var notification = data.username + " is going silence";
          this.mediator.h.showNotification(notification);
        } else {
          var notification = data.username + " is on speaking terms"
          this.mediator.h.showNotification(notification);
        }
      }
    } else if (data.event == "control") {
      if (data.username && data.socketId) {
        this.mediator.h.swapUserDetails(data.socketId + "-title", data);
      }
      if (data.talking) {
        if (this.mediator.DEBUG) console.log('Speaker Focus on ' + data.username);
        this.mediator.h.swapDiv(data.socketId + "-widget");
      }
      if (data.readonly) {
        if (this.mediator.DEBUG) console.log('Read-Only Joined: ' + data.username);
        this.mediator.h.showNotification("Read-Only Join by "+data.username);
        this.mediator.h.hideVideo(data.socketId, true);
      }
    }
    else {
      if (this.mediator.DEBUG) console.log("META::" + JSON.stringify(data));
      //TODO @Jabis do stuff here with the data
      //data.socketId and data.pid should give you what you want
      //Probably want to filter but didnt know if you wanted it filter on socketId or PID
    }
    // TODO update graph
  }

  init (createOffer, partnerName) {
    // OLD: track peerconnections in array
    if (this.mediator.pcMap.has(partnerName)) return this.mediator.pcMap.get(partnerName);
     var pcPartnerName = new RTCPeerConnection(this.mediator.h.getIceServer());
    // DAM: replace with local map keeping tack of users/peerconnections
    this.mediator.pcMap.set(partnerName, pcPartnerName); // MAP Tracking
    this.mediator.h.addVideo(partnerName, false);

    //TODO: SET THE BELOW TRACK HANDLERS SOMEWHERE IN A BETTER PLACE!
    //TODO: KNOWN REGRESSION IN THIS BRANCH IS MUTING DOES NOT WORK!

    // Q&A: Should we use the existing myStream when available? Potential cause of issue and no-mute
    if (this.mediator.screenStream) {
      var tracks = {};
      tracks['audio'] = this.mediator.screenStream.getAudioTracks();
      tracks['video'] = this.mediator.screenStream.getVideoTracks();
      if (this.mediator.myStream) {
        tracks['audio'] = this.mediator.myStream.getAudioTracks(); //We want sounds from myStream if there is such
        if (!tracks.video.length) tracks['video'] = this.mediator.myStream.getVideoTracks(); //also if our screenStream is malformed, let's default to myStream in that case
      }
      var screenStream = this.mediator.screenStream;
      ['audio', 'video'].map(tracklist => {
        tracks[tracklist].forEach(track => {
          pcPartnerName.addTrack(track, screenStream); //should trigger negotiationneeded event
        });
      });
    } else if (!this.mediator.screenStream && this.mediator.myStream) {
      var tracks = {};
      tracks['audio'] = this.mediator.myStream.getAudioTracks();
      tracks['video'] = this.mediator.myStream.getVideoTracks();
      if (this.mediator.audioMuted || this.mediator.videoMuted) {
        var mutedStream = mutedStream ? mutedStream : this.mediator.h.getMutedStream();
        if (this.mediator.videoMuted) tracks['video'] = mutedStream.getVideoTracks();
        if (this.mediator.audioMuted) tracks['audio'] = mutedStream.getAudioTracks();
      }
      var myStream = this.mediator.myStream;
      ['audio', 'video'].map(tracklist => {
        tracks[tracklist].forEach(track => {
          pcPartnerName.addTrack(track, myStream); //should trigger negotiationneeded event
        });
      });
    } else {
      this.mediator.h.getUserMedia()
        .then(stream => {
          //save my stream
          this.mediator.myStream = stream;
          var mixstream = null;
          //provide access to window for debug
          if(this.mediator.h.canCreateMediaStream()){
            mixstream = new MediaStream();
          } else {
            //Safari trickery
            mixstream = this.mediator.myStream.clone();
            mixstream.getTracks().forEach(track=>{
              mixstream.removeTrack(track);
            });
          }
          window.myStream = this.mediator.myStream;
          window.mixstream = mixstream;
          var tracks = {};
          tracks['audio'] = this.mediator.myStream.getAudioTracks();
          tracks['video'] = this.mediator.myStream.getVideoTracks();
          if (this.mediator.audioMuted || this.mediator.videoMuted) {
            var mutedStream = mutedStream ? mutedStream : this.mediator.getMutedStream();
            if (videoMuted) tracks['video'] = mutedStream.getVideoTracks();
            if (audioMuted) tracks['audio'] = mutedStream.getAudioTracks();
          }
          ['audio', 'video'].map(tracklist => {
            tracks[tracklist].forEach(track => {
              mixstream.addTrack(track);
              pcPartnerName.addTrack(track, mixstream); //should trigger negotiationneeded event
            });
          });

          this.mediator.setVideoSrc(this.mediator.localVideo, mixstream);

          // SoundMeter for Local Stream
          if (this.mediator.myStream) {
            // Soundmeter
            if (this.mediator.DEBUG) console.log('Init Soundmeter.........');
            const soundMeter = new SoundMeter(function () {
                if (this.mediator.DEBUG) console.log('Imm Speaking! Sending metadata mesh focus...');
                if (!this.mediator.audioMuted) this.mediator.metaData.sendControlData({ username: this.mediator.username, id: this.mediator.socketId, talking: true });
            });
            soundMeter.connectToSource(this.mediator.myStream)
          }

        })
        .catch(async e => {
          console.error(`stream error: ${e}`);
          if (!this.mediator.enableHacks) return;
          // start crazy mode - lets offer anyway
          console.log("no media devices! offering receive only");
          var offerConstraints = {
            mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true }
          };
          let offer = await pcPartnerName.createOffer(offerConstraints);
          offer.sdp = this.setMediaBitrates(offer.sdp);
          // SDP Interop
  	// if (navigator.mozGetUserMedia) offer = Interop.toUnifiedPlan(offer);
          await pcPartnerName.setLocalDescription(offer);
          damSocket.out("sdp", {
            description: pcPartnerName.localDescription,
            to: partnerName,
            sender: this.mediator.socketId
          });
          // end crazy mode
        });
    }
  ///////
  }

  sendMsg (msg, local) {
    let data = {
        room: room,
        msg: msg,
        sender: username || socketId
    };

    if (local) {
      // TODO fix this message aka Chat Module
      if(this.mediator.DEBUG) {console.log('sendMsg needs fixing still')}
        //ee.emit("local", data)
    } else {
      if(this.mediator.DEBUG) {console.log('sendMsg needs fixing still')}
        //ee.emit("tourist", data)
    }
  }

  setMediaBitrates (sdp) {
    if (this.mediator.videoBitrate == 'unlimited' || !this.calculateBitrate()) {
      console.log("Not changing bitrate max is set")
      return sdp;
    } else {
      return this.setMediaBitrate(this.setMediaBitrate(sdp, "video", this.mediator.videoBitrate), "audio", 50);
    }
  }

  calculateBitrate () {
    var oldBitrate = this.mediator.videoBitrate;
    switch (this.mediator.presence.users.size) {
      case 0:
      case 1:
      case 2:
        this.mediator.videoBitrate = "1000";
        break;
      case 3:
        this.mediator.videoBitrate = "750";
        break;
      case 4:
        this.mediator.videoBitrate = "500";
        break;
      default:
        this.mediator.videoBitrate = "250";
        break;
    }

    if (oldBitrate == this.mediator.videoBitrate) {
      return false;
    } else {
      this.sendMsg("Bitrate " + this.mediator.videoBitrate, true);
      return true;
    }
  }

  setMediaBitrate (sdp, media, bitrate) {
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

}
