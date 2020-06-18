import config from './config.js';
var cache,
  mutedStream,
  ac,
  mediaStreamDestination,
  mediaRecorder,
  MutedAudioTrack,
  MutedVideoTrack,
  MutedStream,
  isEdge = /Edge\/(\d+)(\d+)/.test(navigator.userAgent),
  isOldEdge = /Edge\/1(\d)/.test(navigator.userAgent),
  isTouchScreen = ("ontouchstart" in document.documentElement) ? true : false,
  isiOS = (['iPad', 'iPhone', 'iPod'].indexOf(navigator.platform) >= 0) ? true : false,
  isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor),
  isMobile = (window.orientation > -1) ? true : false,
  userMediaAvailable = function userMediaAvailable() {
    return !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
  },

  typeOf = function typeOf(o) {
    return Object.prototype.toString
      .call(o).match(/(\w+)\]/)[1].toLowerCase();
  },
  t = function t(i, r) {
    return r.test(i);
  },
  getWindowResolution = () => { return { width: window.innerWidth, height: window.innerHeight, pixelRatio: window.devicePixelRatio } },
  fromPath = function fromPath(obj, path) {
    path = path.replace(/\[(\w+)\]/g, '.$1');
    path = path.replace(/^\./, '');
    var a = path.split('.');
    //console.log(obj,path);
    while (a.length) {
      var n = a.shift();
      if (obj && n in obj)
        obj = obj[n];
      else
        return;
    }
    return obj;
  },
  sleep = async function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  },
  toPath = function toPath(obj, path, value) {
    if (typeOf(path) == "string")
      var path = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');
    if (path.length > 1) {
      var p = path.shift();
      //console.log("p",p,"path",path,"objp",obj[p]);
      if (fromPath(obj, p) == null) {
        //console.log("were in","typeof p is",typeOf(p),"p is",p);
        var r = /^\d$/;
        if (t(p, r) || (path.length > 0 && t(path[0], r))) {
          obj[p] = [];
        } else if (!t(p, r) && typeOf(obj[p]) != 'object') {
          obj[p] = {};
        }
      }
      toPath(obj[p], path, value);
    } else {
      var p = path.shift();
      var r = /^\d$/;
      if (t(p, r) || typeOf(obj[p]) == "array") {
        if (!obj[p] && typeOf(value) == "array") obj[p] = value;
        else if (!obj[p] && typeOf(value) == "string") obj[p] = [value];
        else obj[p] = value;
      } else {
        obj[p] = value;
      }
    }
  },
  canCaptureCanvas = ('captureStream' in HTMLCanvasElement.prototype) ? true : false,
  canCaptureStream = ('captureStream' in HTMLMediaElement.prototype) ? true : false,
  canCaptureAudio = ('MediaStreamAudioDestinationNode' in window) ? true : false,
  canSelectAudioDevices = ('sinkId' in HTMLMediaElement.prototype) ? true : false,
  canCreateMediaStream = ('MediaStream' in window) ? true : false,
  canReplaceTracks = (('replaceVideoTrack' in MediaStream.prototype) && ('replaceAudioTrack' in MediaStream.prototype)) ? true : false;

function getDevices() {
  return new Promise(async (resolve, reject) => {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices != "function") return reject('no mediaDevices');
    let devices = await navigator.mediaDevices.enumerateDevices();
    let grouped = {};
    for (let i = 0; i !== Object.keys(devices).length; ++i) {
      let asLength = 0, aoLength = 0, vsLength = 0, oLength = 0;
      const deviceInfo = devices[i];
      if (deviceInfo.kind === 'audioinput') {
        if (!grouped['as']) {
          grouped['as'] = {};
        }
        let label = deviceInfo.label || `Mic ${asLength + 1}`;
        grouped['as'][label] = deviceInfo;
        asLength++;
      } else if (deviceInfo.kind === 'audiooutput') {
        if (!grouped['ao']) {
          grouped['ao'] = {};
        }
        let label = deviceInfo.label || `Speaker ${aoLength + 1}`;
        grouped['ao'][label] = deviceInfo;
        aoLength++;
      } else if (deviceInfo.kind === 'videoinput') {
        if (!grouped['vs']) {
          grouped['vs'] = {};
        }
        let label = deviceInfo.label || `Cam ${vsLength + 1}`;
        grouped['vs'][label] = deviceInfo;
        vsLength++;
      } else {
        if (!grouped['other']) {
          grouped['other'] = {}
        }
        let label = deviceInfo.label || `Other ${oLength + 1}`;
        grouped['other'] = deviceInfo;
        oLength++;
      }
    }
    return resolve(grouped);
  });
}
var each = function each(o, fn) {
  for (var i in o) fn(i, o[i]);
};
function removeElement(elementId) {
  // Removes an element from the document
  var element = document.getElementById(elementId);
  if (element) element.parentNode.removeChild(element);
}
var copyToClipboard = function copyToClipboard(text) {
  if (window.clipboardData && window.clipboardData.setData) {
    // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
    return clipboardData.setData("Text", text);
  }
  else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
    var textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand("copy");  // Security exception may be thrown by some browsers.
    }
    catch (ex) {
      console.warn("Copy to clipboard failed.", ex);
      return false;
    }
    finally {
      document.body.removeChild(textarea);
    }
  }
};
if (canCreateMediaStream && canCaptureCanvas) {
  MutedAudioTrack = ({ elevatorJingle = false } = {}) => {
    // TODO: if elevatorJingle, add some random track of annoying music instead :D
    let audio = new AudioContext();
    let oscillator = audio.createOscillator();
    let destination = oscillator.connect(audio.createMediaStreamDestination());
    // oscillator.start(); Uncomment to create buzz :)
    return Object.assign(destination.stream.getAudioTracks()[0], {
      enabled: false,
    });
  };

  MutedVideoTrack = ({ width = 320, height = 180 } = {}) => {
    let c = Object.assign(document.createElement("canvas"), { width, height });
    let ctx = c.getContext("2d");
    let stream = c.captureStream();
    ctx.fillRect(0, 0, width, height);
    ctx.font = '18px';
    ctx.fillStyle = 'rgb(' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ')';
    ctx.textAlign = "center";
    ctx.fillText("¯\\_(ツ)_/¯ ", width / 2, c.height / 2);
    ctx.drawImage(document.getElementById('local'), 0, 0, width / 2, c.height / 2);
    if (window && window.meethrix == true) {
      //EASTER EGG
      var chars = "MEETHINGM33TH1NGGN1HT33MGNIHTEEM";
      chars = chars.split("");
      var font_size = 10;
      var columns = c.width / font_size; //number of columns for the rain
      var drops = [];
      for (var x = 0; x < columns; x++) drops[x] = 1;

      function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#0F0";
        ctx.font = font_size + "px arial";
        for (var i = 0; i < drops.length; i++) {
          var text = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(text, i * font_size, drops[i] * font_size);
          if (drops[i] * font_size > c.height && Math.random() > 0.975)
            drops[i] = 0;
          drops[i]++;
        }
        setTimeout(draw, 33);
        //else
        //  setTimeout(draw,33);
      }
      draw();
    }
    return Object.assign(stream.getVideoTracks()[0], { enabled: true });
  };
  MutedStream = (videoOpts, audioOpts) =>
    new MediaStream([MutedVideoTrack(videoOpts), MutedAudioTrack(audioOpts)]);
} else {

  console.warn("no MediaStream constructor, we're IE/Edge/Safari");
  // LOAD VIDEO
  var mediaSource = new MediaSource(),
    source,
    tmp = document.createElement("video");
  if (isOldEdge) {
    console.log("typeOf mediasource", typeOf(mediaSource));
    var tof = typeOf(mediaSource);
    source = tof == "mediasource" ? URL.createObjectURL(mediaSource) : tof == "mediastream" ? mediaSource : null;
    tmp[tof == "mediasource" ? "src" : "srcObject"] = source;
  } else {
    if ("srcObject" in tmp) {
      try {
        source = mediaSource;
        tmp.srcObject = source;
      } catch (err) {
        console.warn("error setting mediaSource", err);
        source = URL.createObjectURL(mediaSource);
        // Try to set mediaSource src instead
        tmp.src = source;
      }
    } else {
      source = URL.createObjectURL(mediaSource)
      tmp.src = source;
    }
    //	tmp.src=  /*(cpmp4) ? '/video/blank.mp4' : (cpogv) ? '/video/blank.ogg' : (cpwebm) ? '/video/blank.webm' : */  URL.createObjectURL(mediaSource);
  }
  mutedStream = source;

  MutedStream = () => {
    return mutedStream;
  };
}
export default {
  copyToClipboard,
  removeElement,
  fromPath,
  toPath,
  typeOf,
  sleep,
  each,
  getWindowResolution,
  getDevices,
  isEdge() {
    return isEdge;
  },
  isOldEdge() {
    return isOldEdge;
  },
  isTouchScreen() {
    return isTouchScreen;
  },
  isSafari() {
    return isSafari;
  },
  isiOS() {
    return isiOS;
  },
  isMobile() {
    return isMobile;
  },
  isMobileOriOS() {
    return this.isMobile() || this.isiOS() ? true : false;
  },
  canCreateMediaStream() {
    return canCreateMediaStream;
  },
  canCaptureStream() {
    return canCaptureStream;
  },
  canCaptureAudio() {
    return canCaptureAudio;
  },
  canReplaceTracks() {
    return canReplaceTracks;
  },
  canSelectAudioDevices() {
    return canSelectAudioDevices;
  },
  canPlayType(type) {
    return document.createElement("video").canPlayType(type);
  },
  canPlayMP4() {
    return this.canPlayType('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
  },
  canPlayOGG() {
    return this.canPlayType('video/ogg; codecs="theora,vorbis"');
  },
  canPlayWEBM() {
    return this.canPlayType('video/webm; codecs="vp8,vorbis"');
  },
  getOrientation() {
    if (window.innerHeight && window.innerWidth) {
      if (window.innerHeight > window.innerWidth) return "portrait";
      else return "landscape";
    } else if (window.matchMedia) {
      // we shouldn't reach here but if we do, let's have matchMedia do the work
      var mql = window.matchMedia("(orientation: portrait)");
      if (mql && mql.matches) return "portrait";
      else return "landscape";
    } else {
      return "landscape";
    }
  },
  resetMutedStream(){
    mutedStream = null;
    return mutedStream = MutedStream();
  },
  attachSinkToVideo(video, sinkId, select) {
    if (typeof video.sinkId !== "undefined") {
      return video
        .setSinkId(sinkId)
        .then(() => {
          console.log(`Success, audio output device attached: ${sinkId}`);
        })
        .catch((error) => {
          let errorMessage = error;
          if (error.name === "SecurityError") {
            errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
          }
          console.error(errorMessage);
          // Jump back to first output device in the list as it's the default.
          select.selectedIndex = 0;
        });
    } else {
      console.warn("Browser does not support output device selection.");
    }
  },
  setAudioToVideo(audio, video) {
    const sink = audio.value;
    return this.attachSinkToVideo(video, sink, audio);
  },
  setAudioTrack(video, track) {
    video.srcObject.addTrack(track);
    this.addAudio(video.srcObject);
  },
  setVideoSrc(video, mediaSource) {
    let source,
      tof = "";
    this.addAudio(mediaSource);
    if (isOldEdge) {
      //if(video.id=="local") return;
      //console.log("typeOf mediasource",typeOf(mediaSource));
      if (!mediaSource) mediaSource = this.getMutedStream();
      source =
        this.typeOf(mediaSource) == "mediasource"
          ? URL.createObjectURL(mediaSource)
          : this.typeOf(mediaSource) == "mediastream"
            ? mediaSource
            : null;
      video[tof == "mediastream" ? "srcObject" : "src"] = source;
      return { video, source };
    } else {
      if ("srcObject" in video) {
        try {
          source = mediaSource;
          video.srcObject = source;
        } catch (err) {
          console.warn("error setting mediaSource", err);
          source =
            this.typeOf(mediaSource) == "mediasource"
              ? URL.createObjectURL(mediaSource)
              : this.typeOf(mediaSource) == "mediastream"
                ? mediaSource
                : null;
          // Try to set mediaSource src instead
          video.src = source;
        }
      } else {
        source =
          this.typeOf(mediaSource) == "mediasource"
            ? URL.createObjectURL(mediaSource)
            : this.typeOf(mediaSource) == "mediastream"
              ? mediaSource
              : null;
        video.src = source;
      }
      window.ee.emit("local-video-loaded");
      return { video, source };
    }
  },
  generateRandomString() {
    return Math.random().toString(36).slice(2).substring(0, 15);
  },
  hideVideo(elemId, state) {
    var video = document.getElementById(elemId + "-widget");
    if (video && state) {
      if (state) {
        console.log("hiding video", video);
        video.setAttribute("hidden", true);
      } else {
        console.log("showing video", video);
        video.removeAttribute("hidden", true);
      }
    }
  },
  closeVideo(elemId) {
    if (document.getElementById(elemId + "-widget")) {
      document.getElementById(elemId + "-widget").remove();
    }
    if (document.getElementById(elemId)) {
      document.getElementById(elemId).remove();
    }
  },
  uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  pageHasFocus() {
    return !(
      document.hidden ||
      document.onfocusout ||
      window.onpagehide ||
      window.onblur
    );
  },
  getQString(url = "", keyToReturn = "") {
    url = url ? url : location.href;
    let queryStrings = decodeURIComponent(url)
      .split("#", 2)[0]
      .split("?");
    queryStrings.shift(); // get rid of address
    for(let string of queryStrings) {
      if (string) {
        let splittedQStrings = string.split("&");

        if (splittedQStrings.length) {
          let queryStringObj = {};

          splittedQStrings.forEach(function (keyValuePair) {
            let keyValue = keyValuePair.split("=", 2);

            if (keyValue.length) {
              queryStringObj[keyValue[0]] = keyValue[1];
            }
          });
          if(typeof queryStringObj[keyToReturn] !== "undefined"){
            return queryStringObj[keyToReturn];
          }
        }
      }
    }
    return null;
  },
  userMediaAvailable,
  getUserMedia(opts) {
    if (this.userMediaAvailable()) {
      opts = opts && this.typeOf(opts) == "object" ? opts : {
        video: {
          height: {
            ideal: 720,
            max: 720,
            min: 240,
            frameRate: {
              ideal: 15,
              min: 10,
            },
          },
        },
        audio: {
          echoCancellation: true,
        },
      };
      return navigator.mediaDevices.getUserMedia(opts);
    } else {
      throw new Error("User media not available");
    }
  },
  getIceServer() {
    var servers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "stun:stun.sipgate.net:3478",
        } /*,
          {urls: "stun:stun.stunprotocol.org"},
          {urls: "stun:stun.sipgate.net:10000"},
          {urls: "stun:217.10.68.152:10000"},
          {urls: 'stun:stun.services.mozilla.com'}*/,
      ],
    };
    //return servers;    let srvs = (isEdge) ? ["turn:gamma.coder.fi"] : ["turns:gamma.coder.fi","turn:gamma.coder.fi"];
    return {
      sdpSemantics: "unified-plan",
      //iceCandidatePoolSize: 2,
      iceServers: [
        { urls: ["stun:turn.hepic.tel"] },
        { urls: ["stun:stun.l.google.com:19302"] },
        {
          username: "meething",
          credential: "b0756813573c0e7f95b2ef667c75ace3",
          urls: ["turn:turn.hepic.tel", "turns:turn.hepic.tel?transport=tcp"],
        },
      ],
    };
  },
  addChat(data, senderType) {
    try {
      if (data == cache) {
        cache = null;
        return;
      }
      let chatMsgDiv = document.querySelector("#chat-messages");
      let contentAlign = "justify-content-end";
      let senderName = "You";
      let msgBg = "bg-white";

      if (senderType === "remote") {
        contentAlign = "justify-content-start";
        senderName = data.sender;
        msgBg = "bg-green";

        this.toggleChatNotificationBadge();
      }
      let infoDiv = document.createElement("div");
      infoDiv.className = "sender-info";
      infoDiv.innerHTML = `${senderName} - ${moment().format(
        "Do MMMM, YYYY h:mm a"
      )}`;
      let colDiv = document.createElement("div");
      colDiv.className = `col-10 card chat-card msg ${msgBg}`;
      colDiv.innerHTML = data.msg;
      let rowDiv = document.createElement("div");
      rowDiv.className = `row ${contentAlign} mb-2`;
      colDiv.appendChild(infoDiv);
      rowDiv.appendChild(colDiv);
      chatMsgDiv.appendChild(rowDiv);
      /**
       * Move focus to the newly added message but only if:
       * 1. Page has focus
       * 2. User has not moved scrollbar upward. This is to prevent moving the scroll position if user is reading previous messages.
       */
      if (this.pageHasFocus) {
        rowDiv.scrollIntoView();
      }
      cache = data;
    } catch (e) {
      console.warn('chat error:',e);
    }
  },

  addVideoElementEvent(elem, type = "pip") {

    if ("pictureInPictureEnabled" in document && type == "pip" && elem) {
      elem.addEventListener("dblclick", (e) => {
        e.preventDefault();
        if (!document.pictureInPictureElement) {
          elem.requestPictureInPicture().catch((error) => {
            // Video failed to enter Picture-in-Picture mode.
            console.error(error);
          });
        } else {
          document.exitPictureInPicture().catch((error) => {
            // Video failed to leave Picture-in-Picture mode.
            console.error(error);
          });
        }
      });
    } else {
      elem.addEventListener("dblclick", (e) => {
        e.preventDefault();
        elem.className = /fullscreen/.test(elem.className)
          ? "remote-video"
          : "remote-video fullscreen";
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
      });
    }
  },
  collectAudio() {
    ac = new AudioContext();
    mediaStreamDestination = new MediaStreamAudioDestinationNode(ac);
  },
  addAudio(stream) {
    if (ac != undefined && ac != null) {
      var mediaElementSource = ac.createMediaStreamSource(stream);
      mediaElementSource.connect(mediaStreamDestination);
    }
  },
  recordAudio() {
    if (!this.canCaptureAudio()) return stream;
    try {
      this.collectAudio();
      var all = document.getElementsByTagName("video");
      for (var i = 0, max = all.length; i < max; i++) {
        this.addAudio(all[i].captureStream());
      }
      var pip = document.getElementById("pip")
      if(pip.srcObject && canCaptureStream && canReplaceTracks) {
        mediaStreamDestination.stream.addTrack(pip.srcObject.getVideoTracks()[0])
      }
      var recordingStream = new MediaStream(mediaStreamDestination.stream)
      mediaRecorder = new MediaRecorder(recordingStream);
      console.log(mediaRecorder.state);
      console.log("recorder started");
      var chunks = [];
      mediaRecorder.onstop = function (e) {
        var blob = new Blob(chunks, {
          type: "video/webm"
        });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = "test.webm";
        a.click();
        window.URL.revokeObjectURL(url);
        chunks = [];
      };
      mediaRecorder.ondataavailable = function (e) {
        chunks.push(e.data);
      };
      mediaRecorder.start();
    } catch(e) {
      console.log(e);
    }
  },
  stopRecordAudio() {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log("recorder stopped");
    mediaStreamDestination = null;
    ac = null;
  },
  addVideo(partnerName, stream) {
    // video element
    var videohtml = `<video id="${partnerName}-video" autoplay playsinline>
    <source src="/assets/video/muted.webm" type="video/webm">
    <source src="/assets/video/muted.mp4" type="video/mp4">
    <source src="/assets/video/muted.ogg" type="video/ogv">
    </video>`;
    var videoParent = document.createElement("div.offscreen");
    videoParent.innerHTML = videohtml;
    document.body.appendChild(videoParent);
    let newVid =
      document.getElementById(partnerName + "-video") ||
      document.createElement("video");

    this.addVideoElementEvent(newVid, "pip");
    newVid.className = "remote-video";
    newVid.volume = 0.75;

    let ogrid = document.createElement("div");
    ogrid.id = partnerName + "-widget";
    ogrid.className = 'remote-widget'
   ogrid.appendChild(newVid);

    //Top toolbox
    var topToolbox = document.createElement("div");
    topToolbox.className = "top-widget-toolbox";

    // close window button // should include close video method
    var closeButton = this.addButton(
      "close-video-button",
      "widget-button",
      "fas fa-expand"
    );
    closeButton.addEventListener("click", function () {
      // do fullscreen
      var elem = document.getElementById(`${partnerName}-video`) ? document.getElementById(`${partnerName}-video`) : document.getElementById(`${partnerName}-screenshare`);
      if (elem) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
          elem.msRequestFullscreen();
        }
      }
    });

    // full screen button
    var fullscreenBtn = this.addButton(
      "full-screen-button",
      "widget-button",
      "fas fa-share-square"
    );
    fullscreenBtn.addEventListener("click", function () {
      var doubleClickEvent = document.createEvent("MouseEvents");
      doubleClickEvent.initEvent("dblclick", true, true);
      var vselect = document.getElementById(`${partnerName}-video`) ? document.getElementById(`${partnerName}-video`) : document.getElementById(`${partnerName}-screenshare`);
      if (vselect) vselect.dispatchEvent(doubleClickEvent);
    });
    //fullscreenBtn.addEventListener('click',()=>this.fullScreen(`${partnerName}-widget`));

    // autopilot button
    var autopilotBtn = this.addButton(
      `${partnerName}-talker`,
      "widget-button",
      "fas fa-bullhorn talker"
    );
    // autopilotBtn.addEventListener('click',()=>this.autoPilot(`${partnerName}-widget`));

    topToolbox.appendChild(closeButton);
    topToolbox.appendChild(fullscreenBtn);
    topToolbox.appendChild(autopilotBtn);
    var toolbox = document.createElement("div");
    toolbox.className = "toolbox";

    // bottom toolbox
    var videoToolbox = document.createElement("div");
    videoToolbox.className = "v-toolbox";
    var mutedSpan = document.createElement("span")
    mutedSpan.style.display = "none"
    mutedSpan.innerText = "MUTED"
    mutedSpan.style.color = "white"
    mutedSpan.style.backgroundColor = "#DE0046"
      mutedSpan.style.padding="3px";
      mutedSpan.style.margin = "3px"
    var vtitle = document.createElement("p");
    if(partnerName.length > 35)
    {
      var vuser = partnerName.substring(0,10) + '...';
      vtitle.title = partnerName;
    } else {
      var vuser = partnerName
    }

    vtitle.textContent = `● ${vuser}`;
    vtitle.appendChild(mutedSpan)
    vtitle.className = "v-user";
    vtitle.id = `${partnerName}-title`;

    videoToolbox.appendChild(vtitle);
    toolbox.appendChild(topToolbox);
    toolbox.appendChild(videoToolbox);
    ogrid.appendChild(toolbox);


    var realgrid = document.getElementById("grid");
    realgrid.appendChild(ogrid);

    // Play join notification
    try {
      let src = "assets/sounds/join.mp3";
      let audio = new Audio(src);
      audio.play();
    } catch (err) { }

    return newVid;
  },

  toggleChatNotificationBadge() {
    try{
      if (
        document.querySelector("#chat-pane").classList.contains("chat-opened")
      ) {
        document
          .querySelector("#new-chat-notification")
          .setAttribute("hidden", true);
      } else {
        document
          .querySelector("#new-chat-notification")
          .removeAttribute("hidden");
      }
    } catch (e) {
      console.warn('chatNotification:', e)
    }

  },

  getMutedStream() {
    return this.resetMutedStream();
  },

  setMutedStream(elem) {
    let stream = this.getMutedStream();
    if (elem) this.setVideoSrc(elem, stream);
    return stream;
  },

  replaceStreamForPeer(peer, stream) {
    if (peer && peer.getSenders)
      return Promise.all(
        peer.getSenders().map((sender) =>
          sender.replaceTrack(
            stream.getTracks().find((t) => t.kind == sender.track.kind),
            stream
          )
        )
      );
    else return Promise.reject({ error: "no sender in peer", peer: peer });
  },

  replaceMutedStreamForPeer(peer) {
    let stream = this.getMutedStream();
    return this.replaceStreamForPeer(peer, stream);
  },

  replaceTrackForPeer(peer, track, kind) {
    return new Promise((resolve, reject) => {
      var sender =
        peer && peer.getSenders
          ? peer.getSenders().find((s) => s.track && s.track.kind === kind)
          : false;
      if (sender) {
        sender.replaceTrack(track);
        resolve(sender);
      }
      return reject({ error: "no sender in peer", peer: peer });
    });
  },

  replaceMutedStreamForPeers(peers) {
    var self = this;
    var promises = [];
    peers.forEach((peer, id) => {
      console.log("trying to send muted Stream to peer`" + id + "`");
      promises.push(self.replaceMutedStreamForPeer(peer));
    });
    return Promise.all(promises)
      .then((results) => {
        return results;
      })
      .catch((err) => {
        console.log("there was a problem with peers", err);
      });
  },

  replaceStreamForPeers(peers, stream) {
    var self = this;
    var promises = [];
    peers.forEach((peer, id) => {
      console.log("trying to send Stream to peer`" + id + "`");
      promises.push(self.replaceStreamForPeer(peer, stream));
    });
    return Promise.all(promises)
      .then((results) => {
        return results;
      })
      .catch((err) => {
        console.log("there was a problem with peers", err);
      });
  },
  replaceAudioTrackForPeers(peers, track) {
    var self = this;
    let promises = [];
    peers.forEach((peer, id) => {
      console.log("trying to send new Audio track to peer `" + id + "`");
      promises.push(self.replaceTrackForPeer(peer, track, "audio"));
    });
    return Promise.all(promises)
      .then((results) => {
        return results;
      })
      .catch((err) => {
        console.log("there was a problem with peers", err);
      });
  },
  replaceVideoTrackForPeers(peers, track) {
    var self = this;
    let promises = [];
    peers.forEach((peer, id) => {
      console.log("trying to send new Video track to peer `" + id + "`");
      promises.push(self.replaceTrackForPeer(peer, track, "video"));
    });
    return Promise.all(promises)
      .then((results) => {
        return results;
      })
      .catch((err) => {
        console.log("there was a problem with peers", err);
      });
  },
  getDisplayMedia(opts) {
    if (navigator.mediaDevices.getDisplayMedia) {
      return navigator.mediaDevices.getDisplayMedia(opts);
    } else if (navigator.getDisplayMedia) {
      navigator.getDisplayMedia(opts);
    } else {
      throw new Error("Display media not available");
    }
  }, //End screensharing
  showLocalNotification(msg) {
    try {
      //Snackbar notification
      var snackbar = document.getElementById("snackbar");
      snackbar.innerHTML = msg;
      snackbar.className = "show";
      setTimeout(function () {
        snackbar.className = snackbar.className.replace("show", "");
      }, 3000);
    } catch (e) {
      console.warn('snackbar error: ', e);
    }
  },
  showRemoteNotification(msg) {
    try {
      //Snackbar notification
      var snackbar = document.getElementById("snackbar");
      snackbar.innerHTML = msg;
      snackbar.className = "show";
      setTimeout(function () {
        snackbar.className = snackbar.className.replace("show", "");
      }, 3000);
    } catch (e) {
      console.warn('snackbar error: ', e);
    }
  },
  showUserMutedNotification(data) {
    try {
      let title = document.getElementById(data.socketId + "-title").childNodes[1]
      let glowed = document.getElementById(data.socketId + "-talker");
      if(data.videoMuted || data.audioMuted) {
        glowed.style.color = "red";
      }
     if(data.videoMuted && data.audioMuted) {
        title.style.display = "inline";
          title.innerText = " Audio and Video MUTED"
      }
      else if(data.videoMuted){
        title.style.display = "inline";
        title.innerText = " Video MUTED"
      }
      else if(data.audioMuted){
       title.style.display = "inline";
        title.innerText = " Audio MUTED"

      }
      else {
        let glowed = document.getElementById(data.socketId + "-talker");
        glowed.style.color = "white";
        title.style.display = "none";
      }
    } catch (e) {
      console.warn('mutedNotification error:', e);
    }
  },
  showWarning(msg, color) {
    try {
      var wSign = document.getElementById("warning-sign");
      console.log("silence please!")
      wSign.innerHTML = msg;
      wSign.hidden = false;
      wSign.style.backgroundColor = color;
    } catch (e) {
      console.warn('warning error: ', e);
    }
  },
  hideWarning() {
    try {
      var wSign = document.getElementById("warning-sign");
      wSign.hidden = true
    } catch (e) {
      console.warn('warning error: ', e);
    }
  },
  addButton(id, className, iconName) {
    try {
      let button = document.createElement("button");
      button.id = id;
      button.className = className;
      let icon = document.createElement("i");
      icon.className = iconName;
      button.appendChild(icon);
      return button;
    } catch (e) {
      console.warn('error adding Button: ',e);
    }

  },
  swapPiP(id) {
    if (!id) return;
    try {
      const pipVid = document.getElementById("pip");
      if (!pipVid.srcObject) return;
      if (pipVid && pipVid.currentId !== id) {
        const speakingVid = document.getElementById(id);
        if (!speakingVid) return;
        pipVid.currentId = id;
        if(canReplaceTracks) {
          pipVid.srcObject.replaceVideoTrack(speakingVid.srcObject.getVideoTracks()[0])
          pipVid.srcObject.replaceAudioTrack(speakingVid.srcObject.getAudioTracks()[0])
        } else {
          pipVid.srcObject = speakingVid.srcObject;
        }
        if (pipVid.paused) {
          var playPromise = pipVid.play();
          if (playPromise !== undefined) {
            playPromise.then(_ => {
            })
              .catch(error => {
              });
          }
        }
      }
    } catch (e) {
      console.warn('error swapPiP: ', e);
    }
  },
  swapDiv(id) {
    try {
      if (!id) return;
      // console.log('Focusing grid widget with id '+id);
      try {
        var container = document.getElementById("grid"),
          fresh = document.getElementById(id),
          first = container.firstElementChild;
        // Move speaker to first position
        first.getElementsByTagName("video")[0].volume = 0.75;
        fresh.getElementsByTagName("video")[0].volume = 1.0;
        if (container && fresh && first) container.insertBefore(fresh, first);
      } catch (e) {
        console.log(e);
      }
    } catch (e) {
      console.warn('error swapDiv: ',e);
    }
  },
  swapGlow(id) {
    if (!id) return;
    try {
      let glowed = document.getElementById(id);
      if (glowed.classList.contains("lighter")) {
        glowed.classList.toggle("lighter");
        glowed.classList.remove("lighter")
      }
      glowed.classList.toggle("lighter");
      setTimeout(function () {
        glowed.classList.remove("lighter");
      }, 500);

    } catch (e) {
      console.log(e);
    }
  },
  swapUserDetails(id, metadata) {
    if (!id || !metadata) return;
    // console.log('Updating widget with id '+id);
    try {
      var container = document.getElementById("grid"),
        id = document.getElementById(id);
      if (metadata.username && container && id) {
        id.textContent = metadata.username;
      }
    } catch (e) {
      console.log(e);
    }
  },
  // adjust audio or video rates, ie: setMediaBitRate(sdp, 'video', 500);
  setMediaBitrate(sdp, mediaType, bitrate) {
    var sdpLines = sdp.split("\n"),
      mediaLineIndex = -1,
      mediaLine = "m=" + mediaType,
      bitrateLineIndex = -1,
      bitrateLine = "b=AS:" + bitrate,
      mediaLineIndex = sdpLines.findIndex((line) => line.startsWith(mediaLine));
    // If we find a line matching “m={mediaType}”
    if (mediaLineIndex && mediaLineIndex < sdpLines.length) {
      // Skip the media line
      bitrateLineIndex = mediaLineIndex + 1;
      // Skip both i=* and c=* lines (bandwidths limiters have to come afterwards)
      while (
        sdpLines[bitrateLineIndex].startsWith("i=") ||
        sdpLines[bitrateLineIndex].startsWith("c=")
      ) {
        bitrateLineIndex++;
      }
      if (sdpLines[bitrateLineIndex].startsWith("b=")) {
        // If the next line is a b=* line, replace it with our new bandwidth
        sdpLines[bitrateLineIndex] = bitrateLine;
      } else {
        // Otherwise insert a new bitrate line.
        sdpLines.splice(bitrateLineIndex, 0, bitrateLine);
      }
    }
    // Then return the updated sdp content as a string
    return sdpLines.join("\n");
  },
  updateBandwidthRestriction(sdp, bandwidth) {
    let modifier = "AS";
    if (adapter.browserDetails.browser === "firefox") {
      bandwidth = (bandwidth >>> 0) * 1000;
      modifier = "TIAS";
    }
    if (sdp.indexOf("b=" + modifier + ":") === -1) {
      // insert b= after c= line.
      sdp = sdp.replace(
        /c=IN (.*)\r\n/,
        "c=IN $1\r\nb=" + modifier + ":" + bandwidth + "\r\n"
      );
    } else {
      sdp = sdp.replace(
        new RegExp("b=" + modifier + ":.*\r\n"),
        "b=" + modifier + ":" + bandwidth + "\r\n"
      );
    }
    return sdp;
  },

  removeBandwidthRestriction(sdp) {
    return sdp.replace(/b=AS:.*\r\n/, "").replace(/b=TIAS:.*\r\n/, "");
  },
};
