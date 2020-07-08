var med = null;
var self = null;

export default class Chat {
  constructor(mediator) {
    this.mediator = mediator;
    med = this.mediator;
    self = this;
    self.cache = null;
    // subscribe to outSideChatMessages
    med.ee.on("chat:ExtMsg", self.receiver);

    return this;
  }
  /* strip XSS */
  stripTags(data){
    const sandbox = document.createElement("iframe");
    sandbox.sandbox = "allow-same-origin";
    sandbox['allow-scripts'] = false;
    sandbox.style.setProperty("display", "none", "important");
    document.body.appendChild(sandbox);
    const sandboxContent = sandbox.contentWindow.document;
    let untrustedString = data.msg;
    if (typeof untrustedString !== "string") data.msg = untrustedString = "";
    let trusted = "";
    sandboxContent.open();
    try {
      sandboxContent.write(untrustedString);
    } catch (e) {
      console.warn("error in shit",e);
    }
    sandboxContent.close();
    trusted = sandboxContent.body.textContent || sandboxContent.body.innerText || "";
    document.body.removeChild(sandbox);
    if(window.anchorme) {
      //SEE OPTIONS IN http://alexcorvi.github.io/anchorme.js/
      var parsed = window.anchorme({
        input:trusted,
        options:{
          attributes: {
              target: "_blank"
          }
        }
      });
      //console.log("trusted >?",parsed);
      if(typeof parsed == "string") trusted = parsed; 
    }
    data.msg = trusted; 
    return data;
  }
  /* A message is sending out from me */
  broadcast(data) {
    let senderType = "local";
    data = self.stripTags(data);
    if (!self.executeCommand(data)) {
      if (data.sender && data.to && data.sender == data.to) return;
      if (!data.ts) data.ts = Date.now();
      med.ee.emit("chat:IntMsg", data);
      med.metaData.sendChatData(data);
      self.remoteCommand(data);
      if(data.msg && !data.msg.match(/^(\!|\/)/))
        self.showInChat(data, senderType);
    }

  }

  receiver(data) {
    if (data.event !== "chat") { return; }
    let senderType = "remote";
    data = self.stripTags(data);
    self.remoteCommand(data);
    if(data.msg && !data.msg.match(/^(\!|\/)/))
      self.showInChat(data,senderType);
  }

  async remoteCommand(data){
    if(!data.msg) return true;
    if (data.msg.startsWith("!")) {
      let msg = data.msg.replace("!", "");
      let parts = msg.split(" ");
      let trigger = (parts.length) ? parts.shift() : "";
      const room = med.root.get("meething").get(med.room);
      let roomdata = await room.promOnce();
      if(!roomdata) roomdata = {}; //just as security were not pulling 'data' out of undefined
      roomdata = med.h.fromPath(roomdata,'data') || {};
      if(med.DEBUG) console.log("roomdata",roomdata);
      let sender = data.sender;
      let commandFromOwner = sender == roomdata.creator;
      if(med.DEBUG) console.log("sender?",sender,"sender is owner?", commandFromOwner,"roomdata.owner",roomdata.creator); 
      //console.log(msg,parts,trigger)
      if(!trigger) return true;
      switch (trigger) {
        case "mute": 
          var who = parts.length>0 ? parts.join(" ") : null;
          if(med.DEBUG) console.log("asking to mute",who);
          if(who != med.username) {
            data.msg = data.sender+" is voting to mute:"+who;
            return false;
          } else {
            // TODO: Actually mute the person
            alert('you just got muted by: '+data.sender);
            return true;
          }
        break;
        case "kick": 
          var who = parts.length>0 ? parts.join(" ") : null;
          if(who == med.username || who == med.socketId) {
            if(commandFromOwner) window.location = 'https://builders.mozilla.community/index.html';
            return false;
          } else {
            if(commandFromOwner) {
              data.msg = "Room Owner is kicking :"+who 
              this.showInChat(data);
            }
            return false
          }
        break;
        case "meethrix":
          let presence = med.presence ? med.presence : false;
          if(!presence) return true;
          window.meethrix = med.meethrix = true;
          window.meethrixStream = med.meethrixStream = med.h.resetMutedStream();
          //med.meethrixStreams = med.meethrixStreams ? med.meethrixStreams : {};
          var who = parts.length>0 ? parts.join(" ") : null;
          if(med.DEBUG) console.log("asking to meethrix",who,presence.users);
          if(presence.users) presence.users.forEach((data,key) => {
            if(med.DEBUG) console.log("key",key,"data",data);
            if(data.username && data.username == who) {
              var sock = data.socketId;
              var sockVideo = sock+'-video';
              var sockEl = document.getElementById(sockVideo);
              if(sockEl) {
                console.log("meethrixing",sockVideo);
                sockEl.srcObject = med.meethrixStream
              }
            }
          });
          return true;
        break;
        case "bluepill":
          window.meethrix = med.meethrix = false;
          window.mutedStream = meething.h.resetMutedStream();
          var who = parts.length>0 ? parts.shift() : null;
          if(med.DEBUG) console.log("asking to bluepill",who);
          if(who != med.username) {
            //pls gib uuid
          } else {
            
          }
          return true;
        break;

        case "breakout":
        break;
      }
    } else {
      return false;
    }
  }

  executeCommand(data) {
    if(!data.msg) return true;
    if (data.msg.startsWith("/")) {
      var trigger = data.msg.replace("/", "");
      switch (trigger) {
        case "help":
          data.msg = "Welcome to chat commands these are your options:<br/>" +
            "/help - this will trigger this information<br/>" +
            "/share - copies the room link to clipboard for you to share";
          self.showInChat(data);
          return true;
        case "share":
          let link = location.href;
          if(med.h.copyToClipboard) med.h.copyToClipboard(link);
          if(window.anchorme) link = anchorme(link);
          data.msg = "Room link > <strong>"+link+"</strong> < copied to clipboard!";
          self.showInChat(data); 
          return true;
        case "qxip":
        case "qvdev":
          self.showTime("Europe/Amsterdam", data)
          return true;
        case "jabis":
          self.showTime("Asia/Bangkok", data)
          return true;
        case "joe":
          data.msg = "&#128526;"
          return true;
        case "dletta":
          self.showTime("America/Vancouver", data)
          return true;
        case "graph":
          med.ee.emit("graph:toggle", data)
          return true;
        case "graphU":
          med.ee.emit("graph:update", data)
          return true;
        case "background":
          med.ee.emit("background:update", data)
          return true;
        default:
          return false;
      }
    } else {
      return false;
    }
  }

  showInChat(data, senderType) {
    if (data == self.cache) {
      self.cache = null;
      return;
    }
    let chatMsgDiv = document.querySelector("#chat-messages");
    let contentAlign = "justify-content-end";
    let senderName = data.sender;
    let msgBg = "bg-white";

    if (senderType === "remote") {
      contentAlign = "justify-content-start";
      senderName = data.sender;
      msgBg = "bg-green";

      med.h.toggleChatNotificationBadge();
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
    self.cache = data;
  }

  async showTime(timezone, data) {
    let response = await fetch("https://worldtimeapi.org/api/timezone/" + timezone);
    if (response.ok) {
      let json = await response.json();
      data.msg = json.datetime;
      this.showInChat(data);
    }
  }
}
