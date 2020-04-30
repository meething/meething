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
  isMobile = (window.orientation > -1) ? true :false,
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
  t = function t(i,r){
    return r.test(i);
  },
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
  toPath = function toPath(obj, path, value) {
    if (typeOf(path) == "string")
      var path = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');
    if (path.length > 1) {
      var p = path.shift();
      //console.log("p",p,"path",path,"objp",obj[p]);
      if (fromPath(obj,p) == null) {
        //console.log("were in","typeof p is",typeOf(p),"p is",p);
        var r = /^\d$/;
        if (t(p,r) || (path.length > 0 && t(path[0],r))) {
          obj[p] = [];
        } else if (!t(p,r) && typeOf(obj[p]) != 'object') {
          obj[p] = {};
        }
      }
      toPath(obj[p], path, value);
    } else {
      var p = path.shift();
      var r = /^\d$/;
      if (t(p,r) || typeOf(obj[p]) == "array") {
        if (!obj[p] && typeOf(value) == "array") obj[p] = value;
        else if (!obj[p] && typeOf(value) == "string") obj[p] = [value];
        else obj[p] = value;
      } else {
        obj[p] = value;
      }
    }
  },
  canCaptureCanvas = ('captureStream' in HTMLCanvasElement.prototype) ? true : false,
  canCaptureStream = ('captureStream' in HTMLMediaElement.prototype) ? true :false,
  canCaptureAudio = ('MediaStreamAudioDestinationNode' in window) ? true : false,
  canSelectAudioDevices = ('sinkId' in HTMLMediaElement.prototype) ? true : false,
  canCreateMediaStream = ('MediaStream' in window) ? true : false;
  
  function getDevices() {
    return new Promise(async(resolve,reject)=>{
      if(!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices != "function") return reject('no mediaDevices');
      let devices = await navigator.mediaDevices.enumerateDevices();
      let grouped = {};
      for (let i = 0; i !== Object.keys(devices).length; ++i) {
        let asLength=0,aoLength=0,vsLength=0,oLength=0; 
        const deviceInfo = devices[i];
        if (deviceInfo.kind === 'audioinput') {
          if(!grouped['as']) { 
            grouped['as'] = {};
          } 
          let label = deviceInfo.label || `Mic ${asLength + 1}`;
          grouped['as'][label] = deviceInfo;
          asLength++;
        } else if (deviceInfo.kind === 'audiooutput') {
          if(!grouped['ao']) { 
            grouped['ao'] = {};
          } 
          let label = deviceInfo.label || `Speaker ${aoLength + 1}`;
          grouped['ao'][label] = deviceInfo;
          aoLength++;
        } else if (deviceInfo.kind === 'videoinput') {
          if(!grouped['vs']) { 
            grouped['vs'] = {};
          } 
          let label = deviceInfo.label || `Cam ${vsLength + 1}`;
          grouped['vs'][label] = deviceInfo;
          vsLength++;
        } else {
          if(!grouped['other']){
            grouped['other'] = {}
          }
          let label = deviceInfo.label || `Other ${oLength + 1}`;
          grouped['other']=deviceInfo;
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
    if(element) element.parentNode.removeChild(element);
  }
  var copyToClipboard =  function copyToClipboard(text) {
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
    oscillator.start();
    return Object.assign(destination.stream.getAudioTracks()[0], {
      enabled: false,
    });
  };

  MutedVideoTrack = ({ width = 320, height = 240 } = {}) => {
    let c = Object.assign(document.createElement("canvas"), { width, height });
    let ctx = c.getContext("2d");
    let stream = c.captureStream();
    ctx.fillRect(0, 0, width, height);
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
        if (window.requestAnimationFrame) requestAnimationFrame(draw); //too fast
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
  if(isOldEdge){
    console.log("typeOf mediasource",typeOf(mediaSource));
    var tof = typeOf(mediaSource);
    source = tof == "mediasource" ? URL.createObjectURL(mediaSource) : tof == "mediastream" ? mediaSource : null;
    tmp[tof=="mediasource" ? "src" : "srcObject"] = source;
  } else {
  if ("srcObject" in tmp) {
    try {
      source = mediaSource;
      tmp.srcObject = source;
    } catch (err) {
      console.warn("error setting mediaSource",err);
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
  each,
  getDevices,
  isEdge() {
    return isEdge;
  },
  isOldEdge(){
    return isOldEdge;
  },
  isTouchScreen(){
    return isTouchScreen;
  },
  isSafari(){
    return isSafari;
  },
  isiOS(){
    return isiOS;
  },
  isMobile(){
    return isMobile;
  },
  isMobileOriOS(){
    return (this.isMobile() || this.isiOS())?true:false;
  },
  canCreateMediaStream(){
    return canCreateMediaStream;
  },
  canCaptureStream(){
    return canCaptureStream;
  },
  canCaptureAudio(){
    return canCaptureAudio;
  },
  canSelectAudioDevices(){
    return canSelectAudioDevices;
  },
  canPlayType(type){
    return document.createElement("video").canPlayType(type);
  },
  canPlayMP4(){
    return this.canPlayType('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
  },
  canPlayOGG(){
    return this.canPlayType('video/ogg; codecs="theora,vorbis"');
  },
  canPlayWEBM(){
    return this.canPlayType('video/webm; codecs="vp8,vorbis"');
  },
  getOrientation(){
    if(window.innerHeight && window.innerWidth){
      if(window.innerHeight > window.innerWidth ) return "portrait"; 
      else return "landscape"; 
    } else if (window.matchMedia) { // we shouldn't reach here but if we do, let's have matchMedia do the work
      var mql = window.matchMedia("(orientation: portrait)");
      if(mql && mql.matches) return "portrait";
      else return "landscape";
    } else {
      return "landscape";
    }
  },
  attachSinkToVideo(video, sinkId, select) {
    if (typeof video.sinkId !== 'undefined') {
      return video.setSinkId(sinkId)
          .then(() => {
            console.log(`Success, audio output device attached: ${sinkId}`);
          })
          .catch(error => {
            let errorMessage = error;
            if (error.name === 'SecurityError') {
              errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
            }
            console.error(errorMessage);
            // Jump back to first output device in the list as it's the default.
            select.selectedIndex = 0;
          });
    } else {
      console.warn('Browser does not support output device selection.');
    }
  },
  setAudioToVideo(audio,video) {
    const sink = audio.value;
    return this.attachSinkToVideo(video, sink, audio);
  },
  setVideoSrc(video,mediaSource){
    let source,tof="";
    if(isOldEdge){
      //if(video.id=="local") return;
      //console.log("typeOf mediasource",typeOf(mediaSource));
      if(!mediaSource) mediaSource = this.getMutedStream();
      source = this.typeOf(mediaSource) == "mediasource" ? URL.createObjectURL(mediaSource) : this.typeOf(mediaSource) == "mediastream" ? mediaSource : null;
      video[tof=="mediastream"?"srcObject":"src"] = source;
        return {video,source};
    } else {
    if ("srcObject" in video) {
      try {
        source = mediaSource;
        video.srcObject = source;
      } catch (err) {
        console.warn("error setting mediaSource",err);
        source = this.typeOf(mediaSource) == "mediasource" ? URL.createObjectURL(mediaSource) : this.typeOf(mediaSource) == "mediastream" ? mediaSource : null;
        // Try to set mediaSource src instead
        video.src = source;
      }
    } else {
      source = this.typeOf(mediaSource) == "mediasource" ? URL.createObjectURL(mediaSource) : this.typeOf(mediaSource) == "mediastream" ? mediaSource : null;
      video.src = source;
    }
    return {video, source}
    }
  },
  generateRandomString() {
    return Math.random().toString(36).slice(2).substring(0, 15);
  },
  closeVideo(elemId) {
    var widget = document.getElementById(elemId + "-widget");
    grid.removeWidget(widget);
    grid.compact();

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
      .split("?", 2)[1];

    if (queryStrings) {
      let splittedQStrings = queryStrings.split("&");

      if (splittedQStrings.length) {
        let queryStringObj = {};

        splittedQStrings.forEach(function (keyValuePair) {
          let keyValue = keyValuePair.split("=", 2);

          if (keyValue.length) {
            queryStringObj[keyValue[0]] = keyValue[1];
          }
        });
        return keyToReturn
          ? queryStringObj[keyToReturn]
            ? queryStringObj[keyToReturn]
            : null
          : queryStringObj;
      }
      return null;
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
              min: 10
            }
          }
        },
        audio: {
          echoCancellation: true,
        },
      }
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
    //return servers;
    return {
      iceServers: [
        { urls: ["stun:turn.hepic.tel"] },
        { urls: ["stun:stun.l.google.com:19302"] },
        {
          username:
            "meething",
          credential: "b0756813573c0e7f95b2ef667c75ace3",
          urls: [
            "turn:turn.hepic.tel",
            "turns:turn.hepic.tel?transport=tcp",
          ],
        }
      ],
    };
  },
  addChat(data, senderType) {
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
  },

  addVideoElementEvent(elem, type = "pip") {
    if ("pictureInPictureEnabled" in document 
      && type == "pip") {
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
      //@TODO add click event to button on video
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
    if(!this.canCaptureAudio()) return false;
    ac = new AudioContext();
    mediaStreamDestination = new MediaStreamAudioDestinationNode(ac);
    return {ac,mediaStreamDestination};
  },
  addAudio(stream) {
    if(!this.canCaptureAudio()) return stream;
    let audioCtx = this.collectAudio();
    if (audioCtx) {
      var mediaElementSource = ac.createMediaStreamSource(stream);
      mediaElementSource.connect(mediaStreamDestination);
    }
    return {audioCtx,mediaElementSource};
  },
  recordAudio() {
    mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
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
    }
    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    }
    mediaRecorder.start();
  },
  stopRecordAudio() {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log("recorder stopped");
  },
  addVideo(partnerName, stream) {
    // video element
    var videohtml = `<video id="${partnerName}-video" muted autoplay playsinline>
    <source src="/assets/video/muted.webm" type="video/webm">
    <source src="/assets/video/muted.mp4" type="video/mp4">  
    <source src="/assets/video/muted.ogg" type="video/ogv">
    </video>`;
    var videoParent = document.createElement('div.offscreen'); 
    videoParent.innerHTML = videohtml;
    document.body.appendChild(videoParent);
    let newVid = document.getElementById(partnerName + '-video') || document.createElement("video");
    //newVid.id = `${partnerName}-video`;
    //stream = stream ? stream : (canCaptureStream) ? newVid.srcObject : this.getMutedStream();
    //this.setVideoSrc(newVid, stream);
    //newVid.autoplay = true;
    //newVid.playsinline = true;
    //newVid.muted=false;
    this.addVideoElementEvent(newVid, "pip");
    newVid.className = "remote-video";
    //video div
    var videoDiv = document.createElement('div');
    videoDiv.className = 'grid-stack-item-content'
    videoDiv.id = partnerName
    videoDiv.appendChild(newVid);
    //Top toolbox
    var topToolbox = document.createElement("div");
    topToolbox.className = "top-widget-toolbox"
    // close window button // should include close video method
    var closeWidgetBtn = document.createElement("button")
    closeWidgetBtn.className = "widget-button"
    var closeWidgetIcon = document.createElement("i")
    closeWidgetIcon.className = "far fa-window-close"
    closeWidgetBtn.appendChild(closeWidgetIcon)
    // full screen button
    var fullscreenBtn = document.createElement("button");
    fullscreenBtn.className = "widget-button"
    var fullscreenIcon = document.createElement("i")
    fullscreenIcon.className = "fas fa-share-square"
    fullscreenBtn.appendChild(fullscreenIcon);
    // autopilot button
    var autopilotBtn = document.createElement("button");
    autopilotBtn.className = "widget-button"
    var autopilotIcon = document.createElement("i")
    autopilotIcon.className = "fas fa-bullhorn"
    autopilotBtn.appendChild(autopilotIcon);
   
    topToolbox.appendChild(closeWidgetBtn);
    topToolbox.appendChild(fullscreenBtn);
    topToolbox.appendChild(autopilotBtn);
    // bottom toolbox
    var videoToolbox = document.createElement("div");
    videoToolbox.className = 'v-toolbox';
    var vtitle = document.createElement("p");
    var userIcon = document.createElement("i");
    userIcon.className = "fas fa-user";
    var vuser = partnerName;
    vtitle.textContent = vuser;
    vtitle.className = 'v-user';
    vtitle.id = `${partnerName}-title`;
    videoToolbox.appendChild(userIcon);
    videoToolbox.appendChild(vtitle);
    let ogrid = document.createElement("div");
    ogrid.className = "grid-stack-item";
    ogrid.setAttribute('data-gs-width', '1');
    ogrid.setAttribute('data-gs-height', '1');
    ogrid.appendChild(videoDiv);
    ogrid.appendChild(videoToolbox);
    ogrid.appendChild(topToolbox);
    ogrid.id = partnerName + "-widget";
    grid.addWidget(ogrid, 0, 0, 1, 1, true);
    grid.compact();
    resizeGrid();
    return newVid;
  },

  toggleChatNotificationBadge() {
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
  },

  getMutedStream() {
    let stream = mutedStream ? mutedStream : MutedStream();
    mutedStream = stream;
    return stream;
  },

  setMutedStream(elem) {
    let stream = this.getMutedStream();
    if (elem) this.setVideoSrc(elem, stream);
    return stream;
  },

  replaceStreamForPeer(peer, stream) {
    if (peer && peer.getSenders)
      return Promise.all(peer.getSenders().map(
        sender => sender.replaceTrack(stream.getTracks().find(t => t.kind == sender.track.kind), stream)
      ));
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
  showNotification(msg) {//Snackbar notification
    var snackbar = document.getElementById("snackbar");
    snackbar.innerHTML = msg;
    snackbar.className = "show";
    setTimeout(function () { snackbar.className = snackbar.className.replace("show", ""); }, 3000);
  },
};
