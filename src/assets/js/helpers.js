var cache,
  mutedStream;
const MutedAudioTrack = ({elevatorJingle = false} = {}) => {
  // TODO: if elevatorJingle, add some random track of annoying music instead :D
  let audio = new AudioContext(); 
  let oscillator = audio.createOscillator();
  let destination = oscillator.connect(audio.createMediaStreamDestination());
  oscillator.start();
  return Object.assign(destination.stream.getAudioTracks()[0], {enabled: false});
}  

const MutedVideoTrack = ({width = 320, height = 240} = {}) => {
  let c = Object.assign(document.createElement("canvas"), {width, height});
  let ctx = c.getContext('2d');
  let stream = c.captureStream();
  ctx.fillRect(0, 0, width, height);  
  if(window && window.meethrix==true) { //EASTER EGG
    var chars = "MEETHINGM33TH1NGGN1HT33MGNIHTEEM";
    chars = chars.split("");
    var font_size = 10;
    var columns = c.width/font_size; //number of columns for the rain
    var drops = [];
    for(var x = 0; x < columns; x++)
      drops[x] = 1; 

    function draw() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#0F0";
      ctx.font = font_size + "px arial";
      for(var i = 0; i < drops.length; i++)
      {
        var text = chars[Math.floor(Math.random()*chars.length)];
        ctx.fillText(text, i*font_size, drops[i]*font_size);
        if(drops[i]*font_size > c.height && Math.random() > 0.975)
          drops[i] = 0;
        drops[i]++;
      }
      if(window.requestAnimationFrame) requestAnimationFrame(draw); //too fast
      //else 
      //  setTimeout(draw,33);
    }
    draw();
  }
  return Object.assign(stream.getVideoTracks()[0], {enabled: true});
}
const MutedStream = (videoOpts,audioOpts) => new MediaStream([MutedVideoTrack(videoOpts), MutedAudioTrack(audioOpts)]);

export default {
  generateRandomString() {
    return Math.random().toString(36).slice(2).substring(0, 15);
  },
  closeVideo(elemId) {
    var widget = document.getElementById(elemId+"-widget");
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
      iceServers: [
        { urls: ["stun:eu-turn4.xirsys.com"] },
        {
          username:
            "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",
          credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
          urls: [
            "turn:eu-turn4.xirsys.com:80?transport=udp",
            "turn:eu-turn4.xirsys.com:3478?transport=udp",
            "turn:eu-turn4.xirsys.com:80?transport=tcp",
            "turn:eu-turn4.xirsys.com:3478?transport=tcp",
            "turns:eu-turn4.xirsys.com:443?transport=tcp",
            "turns:eu-turn4.xirsys.com:5349?transport=tcp",
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
    if ("pictureInPictureEnabled" in document && type == "pip") {
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
  addVideo(partnerName, stream) {
    stream = stream ? stream : this.getMutedStream();
    let newVid = document.getElementById(partnerName+'-video') || document.createElement("video");
    newVid.id = `${partnerName}-video`;
    newVid.srcObject = stream;
    newVid.autoplay = true;
    this.addVideoElementEvent(newVid, "pip");
    newVid.className = "remote-video";
    var videoDiv = document.createElement('div');
    videoDiv.className = 'grid-stack-item-content'
    videoDiv.id = partnerName
    videoDiv.appendChild(newVid);
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
    ogrid.className ="grid-stack-item";
    //proposrtion constrint on grid
    ogrid.setAttribute('data-gs-width','1');
    ogrid.setAttribute('data-gs-height','1');
    ogrid.appendChild(videoDiv);
    ogrid.appendChild(videoToolbox)
    ogrid.id = partnerName + "-widget";
    grid.addWidget(ogrid, 0, 0, 1, 1, true);
    grid.compact();
    resizeGrid();
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
  
  getMutedStream(){
    let stream = mutedStream ? mutedStream : MutedStream();
    mutedStream = stream;
    return stream;
  },

  setMutedStream(elem){
    let stream = this.getMutedStream();
    if(elem) elem.srcObject = stream;
    return stream;
  },

  replaceStreamForPeer(peer,stream){
    if(peer && peer.getSenders) 
      return Promise.all(peer.getSenders().map(
        sender => sender.replaceTrack(stream.getTracks().find(t => t.kind == sender.track.kind), stream)
      ));
    else return Promise.reject({error:"no sender in peer",peer:peer});
  },

  replaceMutedStreamForPeer(peer) {
    let stream = this.getMutedStream();
    return this.replaceStreamForPeer(peer,stream);
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
      return reject({error:"no sender in peer",peer:peer});
    });
  },

  replaceMutedStreamForPeers(peers){
    var self = this;
    var promises = [];
    peers.forEach((peer,id)=>{
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

  replaceStreamForPeers(peers, stream){
    var self = this;
    var promises = [];
    peers.forEach((peer,id)=>{
      console.log("trying to send Stream to peer`" + id + "`");
      promises.push(self.replaceStreamForPeer(peer,stream));
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
};
