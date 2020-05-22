import h from "./helpers.js";

var self = null;

export default class Presence {
  constructor(gun, room) {
    this.root = gun;
    this.room = room;
    this.pid = this.root._.opt.pid;
    this.users = new Map();
    self = this;
    var _ev = h.isiOS() ? 'pagehide' : 'beforeunload';
    window.addEventListener(_ev, function () { self.leave(); });
    return this;
  }

  handleADamEvents(msg) {
    if (msg && msg.event) {
      switch (msg.event) {
        case "enter":
          self.users.set(msg.pid, msg);
          self.addItem(msg.pid, msg.pid);
          self.distributePresence();
          break;
        case "leave":
          self.users.delete(msg.pid);
          self.removeItem(msg.pid);
          self.distributePresence();
          break;
        case "presence":
          self.addReceivedUsers(msg.data);
          break;
        case "update":
          self.updateUser(msg)
          self.distributePresence();
          break;
        default:
          console.log(msg);
      }
    }
  }

  updateUser(msg) {
    if (self.users != undefined) {
      self.users.set(msg.pid, msg.data);
      var item = document.getElementById(msg.pid);
      item.innerHTML = msg.data.username;
    }
  }

  addReceivedUsers(data) {
    // self = this;
    const receivedUsers = new Map(JSON.parse(data));
    receivedUsers.forEach(function (value, key) {
      self.users.set(key, value);
      if (value != null && value.username) {
        self.addItem(key, value.username);
      } else {
        self.addItem(key, key);
      }
    });
  }

  send(event, data) {
    self.root.on("out", { pid: self.pid, event: event, data: data });
  }

  update(username, socketId) {
    var msg = { pid: self.pid }
    var data = { username: username, socketId: socketId }
    msg.data = data;
    self.updateUser(msg);
    self.send("update", data)
  }

  enter() {
    self.send("enter", null);
    self.users.set(self.pid, null);
    self.addItem(self.pid, self.pid);
  }

  leave() {
    self.send("leave", null);
  }

  distributePresence() {
    self.send("presence", JSON.stringify([...self.users]));
  }

  addItem(pid, username) {
    var item = document.getElementById(pid);
    if (item != undefined) {
      item.innerHTML = username;
    } else {
      var ul = document.getElementById("dynamic-list");
      var li = document.createElement("li");
      li.setAttribute("id", pid);
      li.appendChild(document.createTextNode(username));
      ul.appendChild(li);
    }
  }

  removeItem(pid) {
    var ul = document.getElementById("dynamic-list");
    var item = document.getElementById(pid);
    if (item && ul) ul.removeChild(item);
  }

  offGrid() {
    med.gunControl.clearPeers();
  }

  onGrid(peerUrl) {
    peerUrl = med.config.multigun + peerUrl;
    med.gunControl.addPeer(peerUrl);
  }
}
