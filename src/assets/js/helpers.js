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
  typeOf = function(o) {
    return Object.prototype.toString
      .call(o).match(/(\w+)\]/)[1].toLowerCase();
  },
  canCaptureStream = (document.createElement('canvas').captureStream && typeof document.createElement('canvas').captureStream === "function") ? true : false,
  canCaptureAudio = ('MediaStreamAudioDestinationNode' in window) ? true : false,
  canCreateMediaStream = ('MediaStream' in window) ? true : false,
  canPlayType = document.createElement("video").canPlayType,canplaymp4,canplayogv,canplaywebm;
  try {
    canplaymp4 = canPlayType('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');
  } catch (err){ }
  try {
    canplayogv = canPlayType('video/ogg; codecs="theora,vorbis"'); 
  } catch (err){ }
  try { 
    canplaywebm = canPlayType('video/webm; codecs="vp8,vorbis"'); 
  } catch (err){ }
if (canCreateMediaStream && canCaptureStream) {
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

  MutedVideoTrack = ({ width = 320, height = 180 } = {}) => {
    let c = Object.assign(document.createElement("canvas"), { width, height });
    let ctx = c.getContext("2d");
    let stream = c.captureStream();
    ctx.fillRect(0, 0, width, height);
    ctx.font = '18px';
    ctx.fillStyle = 'rgb(' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ')';
    ctx.textAlign = "center";
    ctx.fillText("¯\\_(ツ)_/¯ ", width/2, c.height/2);
    ctx.drawImage(document.getElementById('local'), 0, 0, width/2, c.height/2);
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
  canplaymp4(){
    return canplaymp4;
  },
  canplayogv(){
    return canplayogv;
  },
  canplaywebm(){
    return canplaywebm;
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
  typeOf(...args){
    return typeOf(...args);
  },
  setVideoSrc(video,mediaSource){
    let source;
    if(isOldEdge){
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
        this.addAudio(source);
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
  hideVideo(elemId,state) {
    var video = document.getElementById(elemId + "-widget");
    if (video && state) {
        if (state) {
		console.log('hiding video', video);
		video.setAttribute("hidden", true);
        } else {
		console.log('showing video', video);
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
  userMediaAvailable() {
    return !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
  },
  getUserMedia() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getUserMedia({
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
      });
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
      sdpSemantics: 'unified-plan',
      //iceCandidatePoolSize: 2,
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
      && typeof elem.requestPictureInPicture === 'function' 
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
    stream = stream ? stream : this.getMutedStream();
    // video element
    let newVid = document.getElementById(partnerName + '-video') || document.createElement("video");
    newVid.id = `${partnerName}-video`;
    newVid.poster = "assets/images/poster.gif";
    newVid.onplay = function(){this.poster = ""};
    this.setVideoSrc(newVid, stream);
    newVid.autoplay = true;
    this.addVideoElementEvent(newVid, "pip");
    newVid.className = "remote-video";
    //newVid.style.zIndex = -1;
    //video div
    var videoDiv = document.createElement('div');
    videoDiv.id = partnerName
    videoDiv.appendChild(newVid);
   
    //Top toolbox
    var topToolbox = document.createElement("div");
    topToolbox.className = "top-widget-toolbox"

    // close window button // should include close video method
    var closeButton = this.addButton("close-video-button","widget-button","fas fa-expand")
    closeButton.addEventListener('click',function(){
	// do fullscreen
	var elem = document.getElementById(`${partnerName}-video`);
	if (elem){
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
    var fullscreenBtn = this.addButton("full-screen-button","widget-button","fas fa-share-square")
    fullscreenBtn.addEventListener('click',function(){
	    var doubleClickEvent = document.createEvent('MouseEvents');
	    doubleClickEvent.initEvent('dblclick', true, true);
	    var vselect = document.getElementById(`${partnerName}-video`);
	    if (vselect) vselect.dispatchEvent(doubleClickEvent);
    });
    //fullscreenBtn.addEventListener('click',()=>this.fullScreen(`${partnerName}-widget`));

    // autopilot button
    var autopilotBtn = this.addButton("auto-pilot-button","widget-button","fas fa-bullhorn")
   // autopilotBtn.addEventListener('click',()=>this.autoPilot(`${partnerName}-widget`));
   
    topToolbox.appendChild(closeButton);
    topToolbox.appendChild(fullscreenBtn);
    topToolbox.appendChild(autopilotBtn);
    var toolbox = document.createElement("div");
    toolbox.className="toolbox";
 
    // bottom toolbox
    var videoToolbox = document.createElement("div");
    videoToolbox.className = 'v-toolbox';
    var vtitle = document.createElement("p");
    var vuser = partnerName;
    vtitle.textContent = `● ${vuser}`;
    vtitle.className = 'v-user';
    vtitle.id = `${partnerName}-title`;
    videoToolbox.appendChild(vtitle);
    let ogrid = document.createElement("div");
    toolbox.appendChild(topToolbox);
    toolbox.appendChild(videoToolbox);
  
    ogrid.appendChild(videoDiv);
    videoDiv.appendChild(toolbox);
//ogrid.appendChild(videoToolbox);
  
  
   // ogrid.appendChild(topToolbox);
 // ogrid.appendChild(videoToolbox);
    ogrid.id = partnerName + "-widget";
    var realgrid = document.getElementById('grid');
    realgrid.appendChild(ogrid);

    // Play join notification
    let src = 'assets/sounds/join.mp3';
    let audio = new Audio(src);
    audio.play();
    // Play with Speech
    /*
    let synth = window.speechSynthesis;
    let message = new SpeechSynthesisUtterance ();
    let voices = synth.getVoices ();
	for (let voice of voices)
	{
		if ((voice.lang === 'US') || (voice.name.startsWith('Google US')) )
		{
			message.voice = voice;
		}
	}
	// message.lang = 'en';
	message.text = "Hello!";
	speechSynthesis.speak (message);
     */
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
  addButton(id,className,iconName){
    let button = document.createElement("button");
    button.id = id;
    button.className = className;
    let icon = document.createElement("i");
    icon.className = iconName;
    button.appendChild(icon);
    return button;
  },
  swapDiv(id){
    if(!id) return;
    // console.log('Focusing grid widget with id '+id);
    try {
      var container = document.getElementById('grid'),
          fresh = document.getElementById(id),
          first = container.firstElementChild;
      // Move speaker to first position
      if (container && fresh && first) container.insertBefore(fresh, first);
    } catch(e) { console.log(e); }
  },
  swapUserDetails(id,metadata){
    if(!id||!metadata) return;
    // console.log('Updating widget with id '+id);
    try {
      var container = document.getElementById('grid'),
          id = document.getElementById(id);
      	  if (metadata.username && container && id) {
		id.textContent = metadata.username;
 	  }
    } catch(e) { console.log(e); }
  },
  // adjust audio or video rates, ie: setMediaBitRate(sdp, 'video', 500);
  setMediaBitrate(sdp, mediaType, bitrate) {
      var sdpLines = sdp.split('\n'),
  	  mediaLineIndex = -1,
  	  mediaLine = 'm=' + mediaType,
  	  bitrateLineIndex = -1,
  	  bitrateLine = 'b=AS:' + bitrate,
  	  mediaLineIndex = sdpLines.findIndex(line => line.startsWith(mediaLine));
	  // If we find a line matching “m={mediaType}”
	  if (mediaLineIndex && mediaLineIndex < sdpLines.length) {
	  // Skip the media line
	  bitrateLineIndex = mediaLineIndex + 1;
	  // Skip both i=* and c=* lines (bandwidths limiters have to come afterwards)
	  while (sdpLines[bitrateLineIndex].startsWith('i=') || sdpLines[bitrateLineIndex].startsWith('c=')) {
	    bitrateLineIndex++;
	  }
	    if (sdpLines[bitrateLineIndex].startsWith('b=')) {
	      // If the next line is a b=* line, replace it with our new bandwidth
	      sdpLines[bitrateLineIndex] = bitrateLine;
	    } else {
	      // Otherwise insert a new bitrate line.
	      sdpLines.splice(bitrateLineIndex, 0, bitrateLine);
	    }
	  }
	  // Then return the updated sdp content as a string
	  return sdpLines.join('\n');
  },
  updateBandwidthRestriction(sdp, bandwidth) {
	  let modifier = 'AS';
	  if (adapter.browserDetails.browser === 'firefox') {
	    bandwidth = (bandwidth >>> 0) * 1000;
	    modifier = 'TIAS';
	  }
	  if (sdp.indexOf('b=' + modifier + ':') === -1) {
	    // insert b= after c= line.
	    sdp = sdp.replace(/c=IN (.*)\r\n/, 'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n');
	  } else {
	    sdp = sdp.replace(new RegExp('b=' + modifier + ':.*\r\n'), 'b=' + modifier + ':' + bandwidth + '\r\n');
	  }
	  return sdp;
  },

  removeBandwidthRestriction(sdp) {
   return sdp.replace(/b=AS:.*\r\n/, '').replace(/b=TIAS:.*\r\n/, '');
  },
};
