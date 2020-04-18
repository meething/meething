var cache;
export default {
  generateRandomString() {
    return Math.random().toString(36).slice(2).substring(0, 15);
  },

  closeVideo(elemId) {
    if (document.getElementById(elemId)) {
      document.getElementById(elemId).remove();
    }
  },

  uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
      c
    ) {
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
        video: true,
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
        { urls:["turn:stun.hepic.tel:3478", "turns:stun.hepic.tel:443", "stun:stun.hepic.tel:3478"], "username":"meething",credential:"meething"}
        /*
          { urls: "stun:stun.sipgate.net:3478"},
          {urls: "stun:stun.stunprotocol.org"},
          {urls: "stun:stun.sipgate.net:10000"},
          {urls: "stun:217.10.68.152:10000"},
          {urls: 'stun:stun.services.mozilla.com'}
        */
      ],
    };
    
    return servers;
    /*
      return {
      iceServers: [
        { urls: "stun:stun.hepic.tel:19302"},
        { urls: "stun:stun.l.google.com:19302" },
        { urls:["turn:stun.hepic.tel:19302","stun:stun.hepic.tel:19302"], "username":"meething",credential:"meething"}  
      ]};
    */
    /*
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
        },
      ],
    };
    */
    
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
      elem.addEventListener("click", (e) => {
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
      elem.addEventListener("click", (e) => {
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

  addVideo(partnerName, str) {
    let newVid = document.createElement("video");
    newVid.id = `${partnerName}-video`;
    newVid.srcObject = str;
    newVid.autoplay = true;
    newVid.className = "remote-video";
    this.addVideoElementEvent(newVid, "pip");

    // Video user title
    var vtitle = document.createElement("p");
    var vuser = partnerName;
    vtitle.innerHTML = `<center>${vuser}</center>`;
    vtitle.id = `${partnerName}-title`;

    //create a new div for card
    let cardDiv = document.createElement("div");
    cardDiv.className = "card mb-3";
    cardDiv.style = "color:#FFF;";
    cardDiv.appendChild(newVid);
    cardDiv.appendChild(vtitle);

    //create a new div for everything
    let div = document.createElement("div");
    div.className = "col-sm-12 col-md-6";
    div.id = partnerName;
    div.appendChild(cardDiv);

    //put div in videos elem
    document.getElementById("videos").appendChild(div);
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

  //For screensharing
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
      return reject("no sender");
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
        console.log("Promises passed", results);
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
        console.log("Promises passed", results);
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
