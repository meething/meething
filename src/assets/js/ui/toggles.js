var med = null;

export default class Toggles {
  constructor(mediator) {
    med = mediator;
    this.init();
    self = this;
  }

  init() {
    this.initToggleVideo();
    this.initToggleAudio();
    this.initToggleScreenShare();
    this.initToggleAudioRecording();
    this.initTogglePiPMode();
    this.initToggleSpacebar();
    this.initToggleMesh();
  }

  initToggleVideo() {
    document.getElementById("toggle-video").addEventListener("click", e => {
      e.preventDefault();
      if (!med.videoMuted) {
        med.videoMuted = true;
        e.srcElement.style.backgroundColor = "#DE0046";
        e.srcElement.classList.remove("fa-video");
        e.srcElement.classList.add("fa-video-slash");
        med.metaData.sendNotificationData({ username: med.username, subEvent: "mute", audioMuted: med.audioMuted, videoMuted: med.videoMuted });
        med.h.showLocalNotification("Video Disabled");
      } else {
        med.videoMuted = false;
        e.srcElement.style.backgroundColor = "#3F069C";
        e.srcElement.classList.add("fa-video");
        e.srcElement.classList.remove("fa-video-slash");
        med.metaData.sendNotificationData({ username: med.username, subEvent: "mute", audioMuted: med.audioMuted, videoMuted: med.videoMuted});
        med.h.showLocalNotification("Video Enabled");
      }
      window.ee.emit("video-toggled")
    });
  }

  initToggleAudio() {

    document.getElementById("toggle-mute").addEventListener("click", e => {
      e.preventDefault();
      if (!med.audioMuted) {
        med.audioMuted = true;
        e.srcElement.style.backgroundColor = "#DE0046";
        e.srcElement.classList.remove("fa-volume-up");
        e.srcElement.classList.add("fa-volume-mute");
        med.metaData.sendNotificationData({ username: med.username, subEvent: "mute", audioMuted: med.audioMuted, videoMuted: med.videoMuted});
        med.h.showLocalNotification("Audio Muted");
        med.h.showWarning("Audio Muted","#de0046")
      } else {
        med.audioMuted = false;
        e.srcElement.style.backgroundColor = "#3F069C";
        e.srcElement.classList.add("fa-volume-up");
        e.srcElement.classList.remove("fa-volume-mute");
        med.metaData.sendNotificationData({ username: med.username, subEvent: "mute", audioMuted: med.audioMuted, videoMuted: med.videoMuted });
        med.h.showLocalNotification("Audio Unmuted");
        med.h.hideWarning();
      }
      window.ee.emit("audio-toggled")
    });
  }

  initToggleSpacebar() {
        document.body.onkeyup = function(e){
          e.preventDefault();
          let soundbtn = document.querySelector('#toggle-mute')
          if(e.keyCode == 32){
            if(document.activeElement.tagName !== 'TEXTAREA') {
              if (!med.audioMuted) {
                med.audioMuted = true;
                soundbtn.style.backgroundColor = "#DE0046";
                soundbtn.classList.remove("fa-volume-up");
                soundbtn.classList.add("fa-volume-mute");
                med.metaData.sendNotificationData({ username: med.username, subEvent: "mute", audioMuted: med.audioMuted, videoMuted: med.videoMuted});
                med.h.showLocalNotification("Audio Muted");
                med.h.showWarning("Audio Muted","#de0046")
              } else {
                med.audioMuted = false;
                soundbtn.style.backgroundColor = "#3F069C";
                soundbtn.classList.add("fa-volume-up");
                soundbtn.classList.remove("fa-volume-mute");
                med.metaData.sendNotificationData({ username: med.username, subEvent: "mute", audioMuted: med.audioMuted, videoMuted: med.videoMuted });
                med.h.showLocalNotification("Audio Unmuted");
                med.h.hideWarning();
              }
              window.ee.emit("audio-toggled")
            }
        }
  }
  }

  initToggleScreenShare() {
    document.getElementById("toggle-screen").addEventListener("click", async e => {
      e.preventDefault();
      if (!med.screenShare) {
        med.screenShare = true;
        e.srcElement.classList.add("sharing");
        e.srcElement.classList.remove("text-white");
        e.srcElement.classList.add("text-black");
      } else {
        med.screenShare = false;
        e.srcElement.classList.remove("sharing");
        e.srcElement.classList.add("text-white");
        e.srcElement.classList.remove("text-black");
      }
      window.ee.emit("screen-toggled")
    });
  }
  initToggleAudioRecording() {
    document.getElementById("record-toggle").addEventListener("click", e => {
      e.preventDefault();
      if (!med.isRecording) {
        med.h.recordAudio();
        med.isRecording = true
        e.srcElement.classList.add("text-danger");
        e.srcElement.classList.remove("text-white");
        med.h.showLocalNotification("Recording Started");
      } else {
        med.h.stopRecordAudio()
        med.isRecording = false
        e.srcElement.classList.add("text-white");
        e.srcElement.classList.remove("text-danger");
        med.h.showLocalNotification("Recording Stopped");
      }
      med.metaData.sendNotificationData({ username: med.username, subEvent: "recording", isRecording: med.isRecording })
      window.ee.emit("record-audio-toggled")
    });
  }

  initTogglePiPMode() {
    const togglePip = document.getElementById("pip-toggle");
    const pipVideo = document.getElementById("pip");
    if ("pictureInPictureEnabled" in document) {
      togglePip.hidden = false;
      togglePip.addEventListener("click", e => {
        e.preventDefault();
        window.ee.emit("pip-toggled")
      });

      pipVideo.addEventListener('enterpictureinpicture', function (event) {
        togglePip.classList.add("text-success");
        togglePip.classList.remove("text-white");
      });

      pipVideo.addEventListener('leavepictureinpicture', function (event) {
        togglePip.classList.add("text-white");
        togglePip.classList.remove("text-success");
      });
    }
  }

  initToggleMesh() {
    const mesh = med.h.getQString(location.href, "mesh") || "false";
    if (mesh == "true") {
      med.mesh = true;
      document.getElementById("mesh-toggle").checked = true;
    } else {
      med.mesh = false;
      document.getElementById("mesh-toggle").checked = false;
    }
    document.getElementById("mesh-toggle").addEventListener("click", e => {
      med.mesh = e.srcElement.checked;
    });
  }
}
