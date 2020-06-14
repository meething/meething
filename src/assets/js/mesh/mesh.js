// create global scope to avoid .bind(this)
var self = null;
var med = null;
var damSocket = null;

export default class Mesh {
    constructor(mediator) {
        med = mediator;
        this.inited = false;
        self = this;
        return this;
    }

    establish() {
        if (self.inited) return;
        self.inited = true;

        console.log("Starting! you are", med.socketId);

        // Initialize Session
        med.damSocket.out("subscribe", {
            room: room,
            socketId: med.socketId,
            name: med.username || med.socketId
        });


        //Do we do this here this is now triggered from DAM?
        med.damSocket.on('Subscribe', function (data) {
            console.log("Got channel subscribe", data);
            if (data.ts && Date.now() - data.ts > TIMEGAP * 2) {
                console.log("discarding old sub", data);
                return;
            }
            if (
                med.pcMap.get(data.socketId) !== undefined &&
                med.pcMap.get(data.socketId).connectionState == "connected"
            ) {
                console.log(
                    "Existing peer subscribe, discarding...",
                    med.pcMap.get(data.socketId)
                );
                return;
            }
            // Ignore self-generated subscribes
            if (data.socketId == med.socketId || data.sender == med.socketId) return;
            if (med.DEBUG) console.log("got subscribe!", data);

            if (data.to && data.to != med.socketId) return; // experimental on-to-one reinvite (handle only messages target to us)
            /* discard new user for connected parties? */
            if (
                med.pcMap.get(data.socketId) &&
                med.pcMap.get(data.socketId).iceConnectionState == "connected"
            ) {
                if (med.DEBUG) console.log("already connected to peer", data.socketId);
                //return;
            }
            // New Peer, setup peerConnection
            med.damSocket.out("newUserStart", {
                to: data.socketId,
                sender: med.socketId,
                name: data.name || data.socketId
            });

            self.init(true, data.socketId);
        });

        med.damSocket.on('NewUserStart', function (data) {
            if (data.ts && Date.now() - data.ts > TIMEGAP) return;
            if (data.socketId == med.socketId || data.sender == med.socketId) return;
            if (
                med.pcMap.get(data.sender) &&
                med.pcMap.get(data.sender).connectionState == "connected" &&
                med.pcMap.get(data.sender).iceConnectionState == "connected"
            ) {
                if (med.DEBUG) console.log("already connected to peer? bypass", data.socketId);
                return; // We don't need another round of Init for existing peers
            }

            self.init(false, data.sender);
        });

        med.damSocket.on('IceCandidates', function (data) {
            try {
                if (
                    (data.ts && Date.now() - data.ts > TIMEGAP) ||
                    !data.sender ||
                    !data.to
                )
                    return;
                if (med.DEBUG) console.log(
                    data.sender.trim() + " is trying to connect with " + data.to.trim()
                );
                if (data.candidate && data.candidate.hasOwnProperty('candidate')) {
                    if (!data.candidate.candidate) return; //Edge receiving BLANK candidates from STUN/TURN - ice fails if we pass it along to non-EDGE clients
                }
                data.candidate = new RTCIceCandidate(data.candidate);
                if (!data.candidate) return;
            } catch (e) {
                console.log(e, data);
                return;
            }
            if (data.socketId == med.socketId || data.to != med.socketId) return;
            if (med.DEBUG) console.log("ice candidate", data);
            //data.candidate ? pcMap.get(data.sender).addIceCandidate(new RTCIceCandidate(data.candidate)) : "";
            data.candidate ? med.pcMap.get(data.sender).addIceCandidate(data.candidate) : "";
        });

        med.damSocket.on('SDP', function (data) {
            try {
                if (data.ts && Date.now() - data.ts > TIMEGAP) return;
                if (
                    !data ||
                    data.socketId == med.socketId ||
                    data.sender == med.socketId ||
                    !data.description
                )
                    return;
                if (data.to !== med.socketId) {
                    if (med.DEBUG) console.log("not for us? dropping sdp");
                    return;
                }
            } catch (e) {
                console.log(e, data);
                return;
            }

            if (data.description.type === "offer") {
                data.description
                    ? med.pcMap.get(data.sender).setRemoteDescription(
                        new RTCSessionDescription(data.description)
                    )
                    : "";

                med.h.getUserMedia()
                    .then(async stream => {
                        if (med.localVideo) med.h.setVideoSrc(med.localVideo, stream);

                        //save my stream
                        med.myStream = stream;

                        stream.getTracks().forEach(track => {
                            med.pcMap.get(data.sender).addTrack(track, stream);
                        });

                        let answer = await med.pcMap.get(data.sender).createAnswer();
                        answer.sdp = self.setMediaBitrates(answer.sdp);
                        // SDP Interop
                        // if (navigator.mozGetUserMedia) answer = Interop.toUnifiedPlan(answer);
                        // SDP Bitrate Hack
                        // if (answer.sdp) answer.sdp = h.setMediaBitrate(answer.sdp, 'video', 500);

                        await med.pcMap.get(data.sender).setLocalDescription(answer);

                        med.damSocket.out("sdp", {
                            description: med.pcMap.get(data.sender).localDescription,
                            to: data.sender,
                            sender: med.socketId
                        });
                    })
                    .catch(async e => {
                        console.error(`answer stream error: ${e}`);
                        if (!med.enableHacks) {
                            var r = confirm("No Media Devices! Join as Viewer?");
                            if (r) {
                                med.enableHacks = true;
                                med.metaData.sendControlData({ username: med.username + "(readonly)", id: med.socketId, readonly: true });
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
                        let answer = await med.pcMap.get(data.sender).createAnswer(answerConstraints);
                        answer.sdp = self.setMediaBitrates(answer.sdp);
                        // SDP Interop
                        // if (navigator.mozGetUserMedia) answer = Interop.toUnifiedPlan(answer);
                        await med.pcMap.get(data.sender).setLocalDescription(answer);

                        med.damSocket.out("sdp", {
                            description: med.pcMap.get(data.sender).localDescription,
                            to: data.sender,
                            sender: med.socketId
                        });
                        // end crazy mode
                    });
            } else if (data.description.type === "answer") {
                med.pcMap.get(data.sender).setRemoteDescription(
                    new RTCSessionDescription(data.description)
                );
            }
        });

        document.getElementById("chat-input").addEventListener("keypress", e => {
            if (e.which === 13 && e.target.value.trim()) {
                e.preventDefault();
                // split out into Chat interface
                med.sendMsg(e.target.value);

                setTimeout(() => {
                    e.target.value = "";
                }, 50);
            }
        });

        window.ee.on("video-toggled", function () {
            var muted = med.mutedStream ? med.mutedStream : med.h.getMutedStream();
            var mine = med.myStream ? med.myStream : muted;
            if (!mine) {
                return;
            }
            if (med.videoMuted) {
                med.h.replaceVideoTrackForPeers(med.pcMap, muted.getVideoTracks()[0]).then(r => {
                    med.h.setVideoSrc(med.localVideo, muted);
                    med.myStream.getVideoTracks()[0].enabled = !med.videoMuted;
                });
            } else {
                med.h.replaceVideoTrackForPeers(med.pcMap, mine.getVideoTracks()[0]).then(r => {
                    med.h.setVideoSrc(med.localVideo, mine);
                    med.myStream.getVideoTracks()[0].enabled = !med.videoMuted;
                });
            }
        });

        window.ee.on("uex:VideoMuteToggle", function () {
            var muted = med.mutedStream ? med.mutedStream : med.h.getMutedStream();
            var mine = med.myStream ? med.myStream : muted;
            if (!mine) {
                return;
            }
            if (!med.videoMuted) {
                med.h.replaceVideoTrackForPeers(med.pcMap, muted.getVideoTracks()[0]).then(r => {
                    med.videoMuted = true;
                    med.h.setVideoSrc(med.localVideo, muted);
                    e.srcElement.classList.remove("fa-video");
                    e.srcElement.classList.add("fa-video-slash");
                    med.h.showLocalNotification("Video Disabled");
                });
            } else {
                med.h.replaceVideoTrackForPeers(med.pcMap, mine.getVideoTracks()[0]).then(r => {
                    med.h.setVideoSrc(med.localVideo, mine);
                    med.videoMuted = false;
                    e.srcElement.classList.add("fa-video");
                    e.srcElement.classList.remove("fa-video-slash");
                    med.h.showLocalNotification("Video Enabled");
                });
            }
        });


        window.ee.on("audio-toggled", function () {
            var muted = med.mutedStream ? med.mutedStream : med.h.getMutedStream();
            var mine = med.myStream ? med.myStream : muted;
            if (!mine) {
                return;
            }
            if (med.audioMuted) {
                med.h.replaceAudioTrackForPeers(med.pcMap, muted.getAudioTracks()[0]).then(r => {
                    med.myStream.getAudioTracks()[0].enabled = !med.audioMuted;
                });
            } else {
                med.h.replaceAudioTrackForPeers(med.pcMap, mine.getAudioTracks()[0]).then(r => {
                    med.myStream.getAudioTracks()[0].enabled = !med.audioMuted;
                });
            }
        });

        window.ee.on("uex:AudioMuteToggle", function () {
            var muted = med.mutedStream ? med.mutedStream : med.h.getMutedStream();
            var mine = med.myStream ? med.myStream : muted;
            if (!mine) {
                return;
            }
            if (!med.audioMuted) {
                med.h.replaceAudioTrackForPeers(med.pcMap, muted.getAudioTracks()[0]).then(r => {
                    med.audioMuted = true;
                    //localVideo.srcObject = muted; // TODO: Show voice muted icon on top of the video or something
                    e.srcElement.classList.remove("fa-volume-up");
                    e.srcElement.classList.add("fa-volume-mute");
                    med.metaData.sendNotificationData({ username: med.username, subEvent: "mute", muted: med.audioMuted });
                    med.h.showLocalNotification("Audio Muted");
                    med.myStream.getAudioTracks()[0].enabled = !med.audioMuted;
                });
            } else {
                med.h.replaceAudioTrackForPeers(med.pcMap, mine.getAudioTracks()[0]).then(r => {
                    med.audioMuted = false;
                    //localVideo.srcObject = mine;
                    e.srcElement.classList.add("fa-volume-up");
                    e.srcElement.classList.remove("fa-volume-mute");
                    med.metaData.sendNotificationData({ username: med.username, subEvent: "mute", muted: med.audioMuted });
                    med.h.showLocalNotification("Audio Unmuted");
                    med.myStream.getAudioTracks()[0].enabled = !med.audioMuted;
                });
            }
        });

        window.ee.on("screen-toggled", async function () {
            if (med.screenStream) {
                med.screenStream.getTracks().forEach(t => {
                    t.stop();
                    t.onended();
                });
            } else {
                var stream = await med.h.getDisplayMedia({ audio: true, video: true });
                var atrack = stream.getAudioTracks()[0];
                var vtrack = stream.getVideoTracks()[0];
                if (false) med.h.replaceAudioTrackForPeers(med.pcMap, atrack); // TODO: decide somewhere whether to stream audio from DisplayMedia or not
                med.h.replaceVideoTrackForPeers(med.pcMap, vtrack);
                med.h.setVideoSrc(med.localVideo, stream);
                vtrack.onended = function (event) {
                    if (med.DEBUG) console.log("Screensharing ended via the browser UI");
                    med.screenStream = null;
                    if (med.myStream) {
                        med.h.setVideoSrc(med.localVideo, med.myStream);
                        med.h.replaceStreamForPeers(med.pcMap, med.myStream);
                    }
                };
                med.screenStream = stream;
            }
        });

        var _ev = med.h.isiOS() ? 'pagehide' : 'beforeunload';

        window.addEventListener(_ev, function () {
            if (damSocket && med.damSocket.getPresence()) med.damSocket.getPresence().leave();
            med.pcMap.forEach((pc, id) => {
                if (med.pcMap.has(id)) {
                    med.pcMap.get(id).close();
                    med.pcMap.delete(id);
                }
            });
        });
    }

    metaDataReceived(data) {
        if (data.event == "chat") {
            if (data.ts && Date.now() - data.ts > 5000) return;
            if (data.socketId == med.socketId || data.sender == med.socketId) return;
            if (data.sender == med.username) return;
            if (med.DEBUG) console.log("got chat", data);
            med.h.addChat(data, "remote");
        } else if (data.event == "notification") {
            if (data.ts && Date.now() - data.ts > 5000 || data.ts == undefined || data.username == med.username) return;
            if (data.subEvent == "recording") {
                if (data.isRecording) {
                    var notification = data.username + " started recording this meething";
                    med.h.showRemoteNotification(notification);
                } else {
                    var notification = data.username + " stopped recording this meething"
                    med.h.showRemoteNotification(notification);
                }
            } else if (data.subEvent == "grid") {
                if (data.isOngrid) {
                    var notification = data.username + " is going off the grid";
                    med.h.showRemoteNotification(notification);
                } else {
                    var notification = data.username + " is back on the grid"
                    med.h.showRemoteNotification(notification);
                }
            } else if (data.subEvent == "mute") {
                med.h.showUserMutedNotification(data);
            }
        } else if (data.event == "control") {
            if (data.username && data.socketId) {
                med.h.swapUserDetails(data.socketId + "-title", data);
            }
            if (data.talking) {
                if (med.DEBUG) console.log('Speaker Focus on ' + data.username);
                med.h.swapDiv(data.socketId + "-widget");
            }
            if (data.readonly) {
                if (med.DEBUG) console.log('Read-Only Joined: ' + data.username);
                med.h.showRemoteNotification("Read-Only Join by " + data.username);
                med.h.hideVideo(data.socketId, true);
            }
        }
        else {
            if (med.DEBUG) console.log("META::" + JSON.stringify(data));
            //TODO @Jabis do stuff here with the data
            //data.socketId and data.pid should give you what you want
            //Probably want to filter but didnt know if you wanted it filter on socketId or PID
        }
        // TODO update graph
    }

    init(createOffer, partnerName) {
        // OLD: track peerconnections in array
        if (med.pcMap.has(partnerName)) return med.pcMap.get(partnerName);
        var pcPartnerName = new RTCPeerConnection(med.h.getIceServer());
        // DAM: replace with local map keeping tack of users/peerconnections
        med.pcMap.set(partnerName, pcPartnerName); // MAP Tracking
        med.h.addVideo(partnerName, false);

        //TODO: SET THE BELOW TRACK HANDLERS SOMEWHERE IN A BETTER PLACE!
        //TODO: KNOWN REGRESSION IN THIS BRANCH IS MUTING DOES NOT WORK!

        // Q&A: Should we use the existing myStream when available? Potential cause of issue and no-mute
        if (med.screenStream) {
            var tracks = {};
            tracks['audio'] = med.screenStream.getAudioTracks();
            tracks['video'] = med.screenStream.getVideoTracks();
            if (med.myStream) {
                tracks['audio'] = med.myStream.getAudioTracks(); //We want sounds from myStream if there is such
                if (!tracks.video.length) tracks['video'] = med.myStream.getVideoTracks(); //also if our screenStream is malformed, let's default to myStream in that case
            }
            ['audio', 'video'].map(tracklist => {
                tracks[tracklist].forEach(track => {
                    pcPartnerName.addTrack(track, med.screenStream); //should trigger negotiationneeded event
                });
            });
        } else if (!med.screenStream && med.myStream) {
            var tracks = {};
            tracks['audio'] = med.myStream.getAudioTracks();
            tracks['video'] = med.myStream.getVideoTracks();
            if (med.audioMuted || med.videoMuted) {
                med.mutedStream = med.mutedStream ? med.mutedStream : med.h.getMutedStream();
                if (med.videoMuted) tracks['video'] = med.mutedStream.getVideoTracks();
                if (med.audioMuted) tracks['audio'] = med.mutedStream.getAudioTracks();
            }
            ['audio', 'video'].map(tracklist => {
                tracks[tracklist].forEach(track => {
                    pcPartnerName.addTrack(track, med.myStream); //should trigger negotiationneeded event
                });
            });
        } else {
            med.h.getUserMedia()
                .then(stream => {
                    //save my stream
                    med.myStream = stream;
                    var mixstream = null;
                    //provide access to window for debug
                    if (med.h.canCreateMediaStream()) {
                        mixstream = new MediaStream();
                    } else {
                        //Safari trickery
                        mixstream = med.myStream.clone();
                        mixstream.getTracks().forEach(track => {
                            mixstream.removeTrack(track);
                        });
                    }
                    window.myStream = med.myStream;
                    window.mixstream = mixstream;
                    var tracks = {};
                    tracks['audio'] = med.myStream.getAudioTracks();
                    tracks['video'] = med.myStream.getVideoTracks();
                    if (med.audioMuted || med.videoMuted) {
                        med.mutedStream = med.mutedStream ? med.mutedStream : med.getMutedStream();
                        if (videoMuted) tracks['video'] = med.mutedStream.getVideoTracks();
                        if (audioMuted) tracks['audio'] = med.mutedStream.getAudioTracks();
                    }
                    ['audio', 'video'].map(tracklist => {
                        tracks[tracklist].forEach(track => {
                            mixstream.addTrack(track);
                            pcPartnerName.addTrack(track, mixstream); //should trigger negotiationneeded event
                        });
                    });

                    med.h.setVideoSrc(med.localVideo, mixstream);

                    // SoundMeter for Local Stream
                    if (med.myStream) {
                        // Soundmeter
                        if (med.DEBUG) console.log('Init Soundmeter.........');
                        const soundMeter = new SoundMeter(function () {
                            if (med.DEBUG) console.log('Imm Speaking! Sending metadata mesh focus...');
                            if (!med.audioMuted) med.metaData.sendControlData({ username: med.username, id: med.socketId, talking: true });
                        });
                        soundMeter.connectToSource(med.myStream)
                    }

                })
                .catch(async e => {
                    console.error(`stream error: ${e}`);
                    if (!med.enableHacks) return;
                    // start crazy mode - lets offer anyway
                    console.log("no media devices! offering receive only");
                    var offerConstraints = {
                        mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true }
                    };
                    let offer = await pcPartnerName.createOffer(offerConstraints);
                    offer.sdp = self.setMediaBitrates(offer.sdp);
                    // SDP Interop
                    // if (navigator.mozGetUserMedia) offer = Interop.toUnifiedPlan(offer);
                    await pcPartnerName.setLocalDescription(offer);
                    med.damSocket.out("sdp", {
                        description: pcPartnerName.localDescription,
                        to: partnerName,
                        sender: med.socketId
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
                    offer.sdp = self.setMediaBitrates(offer.sdp);
                    // SDP Interop
                    // if (navigator.mozGetUserMedia) offer = Interop.toUnifiedPlan(offer);
                    // SDP Bitrate Hack
                    // if (offer.sdp) offer.sdp = h.setMediaBitrate(offer.sdp, 'video', 500);

                    await pcPartnerName.setLocalDescription(offer);
                    med.damSocket.out("sdp", {
                        description: pcPartnerName.localDescription,
                        to: partnerName,
                        sender: med.socketId
                    });
                } finally {
                    pcPartnerName.isNegotiating = false;
                }
            };
        }

        //send ice candidate to partnerNames
        pcPartnerName.onicecandidate = ({ candidate }) => {
            if (!candidate) return;
            med.damSocket.out("icecandidates", {
                candidate: candidate,
                to: partnerName,
                sender: med.socketId
            });
        };

        //add
        pcPartnerName.ontrack = e => {
            let str = e.streams[0];
            var el = document.getElementById(`${partnerName}-video`);
            if (el) {
                med.h.setVideoSrc(el, str);
            } else {
                var el = med.h.addVideo(partnerName);
                med.h.setVideoSrc(el, str);
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
                    med.sendMsg(
                        partnerName + " is " + pcPartnerName.iceConnectionState,
                        true
                    );
                    med.h.hideVideo(partnerName, false);
                    med.metaData.sendControlData({ username: med.username, id: med.socketId, online: true });
                    break;
                case "disconnected":
                    if (partnerName == med.socketId) {
                        return;
                    }
                    med.sendMsg(
                        partnerName + " is " + pcPartnerName.iceConnectionState,
                        true
                    );
                    med.h.closeVideo(partnerName);
                    // PC Tracking cleanup
                    med.pcMap.get(partnerName).close();
                    med.pcMap.delete(partnerName);
                    break;
                case "new":
                    // med.h.hideVideo(partnerName, true);
                    /* objserved when certain clients are stuck disconnecting/reconnecting - do we need to trigger a new candidate? */
                    /* GC if state is stuck */
                    break;
                case "failed":
                    if (partnerName == med.socketId) {
                        return;
                    } // retry catch needed
                    med.h.closeVideo(partnerName);
                    // Send presence to attempt a reconnection
                    med.damSocket.out("subscribe", {
                        room: med.room,
                        socketId: med.socketId,
                        name: med.username || med.socketId
                    });
                    break;
                case "closed":
                    med.h.closeVideo(partnerName);
                    med.pcMap.get(partnerName).close();
                    med.pcMap.delete(partnerName);
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
                    setTimeout(function () {
                        console.log('set GC for', partnerName);
                        if (pcPartnerName.signalingState == "have-local-offer") {
                            console.log('GC Stuck Peer ' + partnerName, pcPartnerName.signalingState);
                            // pcMap.get(partnerName).close();
                            med.h.closeVideo(partnerName);
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
                        med.h.closeVideo(partnerName);
                        med.pcMap.delete(partnerName);
                    }
                    // Peers go down here and there - let's send a Subscribe, Just in case...
                    med.damSocket.out("subscribe", {
                        room: med.room,
                        socketId: med.socketId,
                        name: med.username || med.socketId
                    });
                    break;
            }
        };

    }

    setMediaBitrates(sdp) {
        if (med.videoBitrate == 'unlimited' || !self.calculateBitrate()) {
            console.log("Not changing bitrate max is set")
            return sdp;
        } else {
            return self.setMediaBitrate(self.setMediaBitrate(sdp, "video", med.videoBitrate), "audio", 50);
        }
    }

    calculateBitrate() {
        var oldBitrate = med.videoBitrate;
        switch (med.presence.users.size) {
            case 0:
            case 1:
            case 2:
                med.videoBitrate = "1000";
                break;
            case 3:
                med.videoBitrate = "750";
                break;
            case 4:
                med.videoBitrate = "500";
                break;
            default:
                med.videoBitrate = "250";
                break;
        }

        if (oldBitrate == med.videoBitrate) {
            return false;
        } else {
            med.sendMsg("Bitrate " + med.videoBitrate, true);
            return true;
        }
    }

    setMediaBitrate(sdp, media, bitrate) {
        var lines = sdp.split("\n");
        var line = -1;
        for (var i = 0; lines.length; i++) {
            if (lines[i] && lines[i].indexOf("m=" + media) === 0) {
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

    setBitrate(count) {
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

}
