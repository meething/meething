import SFU from './sfu.js'
import helper from '../helpers.js'

export default class Video {
  constructor() {
    this.joined = false;
    self = this;
  }

  // Determine the room name and public URL for this chat session.
  getRoom() {
    var query = location.search && location.search.split("?")[1];

    if (query) {
      return (location.search && decodeURIComponent(query.split("=")[1]));
    }

    return "no-id"
  }

  // Retrieve the absolute room URL.
  getRoomURL() {
    return location.protocol + "//" + location.host + (location.path || "") + "?room=" + this.getRoom();
  }

  // Enable video on the page.
  enableVideo() {
    this.joined = true;
    this.loadSimpleWebRTC();
  }

  showVolume(el, volume) {
    if (!el) return;
    if (volume < -45) volume = -45; // -45 to -20 is
    if (volume > -20) volume = -20; // a good range
    el.value = volume;
  }

  // Dynamically load the simplewebrtc script so that we can
  // kickstart the video call.
  loadSimpleWebRTC() {
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
    webrtc.joinRoom(this.getRoom());
    this.disabled = true;
    // }

    // Immediately join room when loaded.
    webrtc.on("readyToCall", function () {
      // webrtc.joinRoom(self.getRoom());
      webrtc.startBroadcast();
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
        peer.video.srcObject.addTrack(peer.consumer._track);
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
    webrtc.init();
  }
}

