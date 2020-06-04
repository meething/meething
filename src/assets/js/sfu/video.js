import SFU from './sfu.js'
import helper from '../helpers.js'

var med = null;

export default class Video {
  constructor(mediator) {
    med = mediator;
    this.joined = false;
    self = this;
  }

  // Enable video on the page.
  establish() {
    this.joined = true;
    this.loadSimpleWebRTC(med);
  }

  showVolume(el, volume) {
    if (!el) return;
    if (volume < -45) volume = -45; // -45 to -20 is
    if (volume > -20) volume = -20; // a good range
    el.value = volume;
  }

  // Dynamically load the simplewebrtc script so that we can
  // kickstart the video call.
  loadSimpleWebRTC(med) {
    var webrtc = new SFU({
      localVideoEl: document.getElementById("local"),
      // the id/element dom element that will hold remote videos
      remoteVideosEl: "",
      autoRequestMedia: true,
      debug: false,
      detectSpeakingEvents: true,
      autoAdjustMic: false
    });

    // Set the publicly available room URL.
    // startButton.onclick = function () {
    webrtc.joinRoom(med.room, med.socketId);
    this.disabled = true;
    // }

    // Immediately join room when loaded.
    webrtc.on("readyToCall", function (peerCount) {
      // webrtc.joinRoom(self.getRoom());
      webrtc.startBroadcast(peerCount);
    });

    // Display the volume meter.
    webrtc.on("localStream", function () {
      var button = document.querySelector("form>button");
      if (button) button.removeAttribute("disabled");
      startButton.disabled = false;
      document.getElementById("localVolume").style.display = "block";
    });

    // If we didn't get access to the camera, raise an error.
    webrtc.on("localMediaError", function (err) {
      alert("This service only works if you allow camera access.Please grant access and refresh the page.");
    });

    // When another person joins the chat room, we'll display their video.
    webrtc.on("videoAdded", function (peer) {
      if (peer.consumer._track.kind == "audio") {
        helper.setAudioTrack(peer.video, peer.consumer._track)
        return;
      }
      var stream = new MediaStream([peer.consumer._track]);
      helper.setVideoSrc(peer.video, stream);
      console.log("user added to chat", peer);
    });

    // If a user disconnects from chat, we need to remove their video feed.
    webrtc.on("videoRemoved", function (id) {
      console.log("user removed from chat", id);
      helper.closeVideo(id);
      return;
    });

    // If our volume has changed, update the meter.
    webrtc.on("volumeChange", function (volume, treshold) {
      showVolume(document.getElementById("localVolume"), volume);
    });

    // If a remote user's volume has changed, update the meter.
    webrtc.on("remoteVolumeChange", function (peer, volume) {
      showVolume(document.getElementById("volume_" + peer.id), volume);
    });

    // If there is a P2P failure, we need to error out.
    webrtc.on("iceFailed", function (peer) {
      var connstate = document.querySelector("#container_" + webrtc.getDomId(peer) + " .connectionstate");
      console.log("local fail", connstate);
      if (connstate) {
        connstate.innerText = "connection failed";
        fileinput.disabled = "disabled";
      }
    });

    // remote p2p/ice failure
    webrtc.on("connectivityError", function (peer) {
      var connstate = document.querySelector("#container_" + webrtc.getDomId(peer) + " .connectionstate");
      console.log("remote fail", connstate);
      if (connstate) {
        connstate.innerText = "connection failed";
        fileinput.disabled = "disabled";
      }
    });

    webrtc.on("soundmeter", function () {
      med.metaData.sendControlData({ username: med.username, id: med.socketId, talking: true });
    });

    window.ee.on("audio-toggled", function () {
      webrtc.toggleAudio();
    });

    window.ee.on("video-toggled", function () {
      webrtc.toggleVideo();
    });

    window.ee.on("screen-toggled", function () {
      webrtc.toggleScreen();
    });

    med.ee.on('media:Got MediaStream', function(stream) {
      console.log("Media Stream changed SFU");
      webrtc.changeStream(stream);
    });

    webrtc.init();
  }
}

