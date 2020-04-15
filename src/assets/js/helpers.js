var cache;
export default {
  generateRandomString() {
    return Math.random()
      .toString(36)
      .slice(2)
      .substring(0, 15);
  },

  closeVideo(elemId) {
    if (document.getElementById(elemId)) {
      document.getElementById(elemId).remove();
    }
  },
  uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
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

        splittedQStrings.forEach(function(keyValuePair) {
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
  replaceVideoTrackForPeers(peers,track) {
    peers.forEach((peer,id) => {
      console.log('trying to send new track to peer `'+id+'`');
      var sender = (peer && peer.getSenders) ? peer.getSenders().find(s => s.track && s.track.kind === 'video') : false;
      if (sender) {
        sender.replaceTrack(track);
      }
    });
  },
  userMediaAvailable() {
    return !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    );
  },
  getDisplayMedia(opts){
    if(navigator.mediaDevices.getDisplayMedia) {
      return navigator.mediaDevices.getDisplayMedia(opts)
    }
    else if(navigator.getDisplayMedia) {
      navigator.getDisplayMedia(opts)
    }
    else {
      throw new Error('Display media not available');
    }
  },
  getUserMedia() {
    if (this.userMediaAvailable()) {
      return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true
        }
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
          urls: "stun:stun.sipgate.net:3478"
        } /*,
          {urls: "stun:stun.stunprotocol.org"},
          {urls: "stun:stun.sipgate.net:10000"},
          {urls: "stun:217.10.68.152:10000"},
          {urls: 'stun:stun.services.mozilla.com'}*/
      ]
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
            "turns:eu-turn4.xirsys.com:5349?transport=tcp"
          ]
        }
      ]
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

  addVideo(partnerName, str) {
    let newVid = document.createElement("video");
      newVid.id = `${partnerName}-video`;
      newVid.srcObject = str;
      newVid.autoplay = true;
      newVid.className = "remote-video";

      // fullscreen on click of video check if it works with the new card system
      /*
      newVid.addEventListener('click', function(){ 
        newVid.className = /fullscreen/.test(newVid.className) ? 'remote-video' : 'remote-video fullscreen';
        if (newVid.requestFullscreen) {
          newVid.requestFullscreen();
        } else if (newVid.msRequestFullscreen) {
          newVid.msRequestFullscreen();
        } else if (newVid.mozRequestFullScreen) {
          newVid.mozRequestFullScreen();
        } else if (newVid.webkitRequestFullscreen) {
          newVid.webkitRequestFullscreen();
        }
      });
      */
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
  }
};
