var cache;
export default {
  generateRandomString() {
    return Math.random().toString(36).slice(2).substring(0, 15);
  },
  closeVideo(elemId) {
    var widget = document.getElementById(elemId);
    var gridster = $(".gridster ul").gridster().data('gridster');
    gridster.remove_widget(widget);

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
        },
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
    chatMsgDiv.appendChild(rowDiv);``
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
    // add toolbox div for vdeo title and options
    var videoToolbox = document.createElement("div");
    videoToolbox.className = 'v-toolbox';
    // Video user title
    var vtitle = document.createElement("p");
     // add user icon
     let userIcon = document.createElement("i");
     userIcon.className = "fas fa-user";
     
     // add user name
    var vuser = partnerName;
    //vtitle.appendChild(userIcon);
    vtitle.textContent = vuser;
    vtitle.className = 'v-user';
    vtitle.id = `${partnerName}-title`;
    videoToolbox.appendChild(userIcon);
    videoToolbox.appendChild(vtitle);
    
    //create a new div for card
    let cardDiv = document.createElement("div");
    cardDiv.className = "card mb-3";
    cardDiv.style = "color:#FFF; font-size";
    cardDiv.appendChild(newVid);
    cardDiv.appendChild(videoToolbox);

    //create a new div for everything
    let div = document.createElement("div");
    div.className = "col-sm-12 col-md-6";
    div.id = partnerName;
    div.appendChild(cardDiv);

    let ligrid = document.createElement("li");
    let gridiv = document.createElement("div");
    gridiv.appendChild(cardDiv);
    ligrid.appendChild(gridiv);
    ligrid.id = partnerName;
    //document.getElementById("gridul").appendChild(ligrid);
    var gridster = $(".gridster ul").gridster().data('gridster');
    gridster.add_widget(ligrid, 1, 1, 1, 1);
    gridster.resize_responsive_layout();
    console.log(gridster.serialize());
    //put div in videos elem
    // document.getElementById("videos").appendChild(div);
  },
  // method to resize all elements when remove or add video to grid;
  //https://dsmorse.github.io/gridster.js/#resize_widget_method
  resizeElements(ligrid,partnerName){
    // array of widgets ids
    let $widget = ligrid.className = partnerName ;
    let widgets = [];
    // widget max widths
    let size_x = [4,6,8];
    let size_y = [4,6,8]

    for(let i = 0 ; i < widgets.length ; i++ ) {
    gridster.resize_widget( $widget/*widgets[i]*/, [size_x], [size_y], [reposition], [callback] )
    }
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