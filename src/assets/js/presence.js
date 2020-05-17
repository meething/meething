import h from "./helpers.js";
export default class Presence {
  constructor(gun, room) {
    this.root = gun;
    this.room = room;
    this.pid = this.root._.opt.pid;
    this.users = new Map();
    var _ev = h.isiOS() ? 'pagehide' : 'beforeunload';    
    window.addEventListener(_ev, function () { this.leave(); });
    return this;
  }

  handleADamEvents(msg) {
    if (msg && msg.event) {
      switch (msg.event) {
        case "enter":
          this.users.set(msg.pid, msg);
          this.addItem(msg.pid, msg.pid);
          this.distributePresence();
          break;
        case "leave":
          this.users.delete(msg.pid);
          this.removeItem(msg.pid);
          this.distributePresence();
          break;
        case "presence":
          this.addReceivedUsers(msg.data);
          break;
        case "update":
          this.updateUser(msg)
          this.distributePresence();
          break;
        default:
          console.log(msg);
      }
    }
  }

  updateUser(msg) {
    if (this.users != undefined) {
      this.users.set(msg.pid, msg.data);
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
    this.root.on("out", { pid: this.pid, event: event, data: data });
  }

  update(username, socketId) {
    var msg = { pid: this.pid }
    var data = { username: username, socketId: socketId }
    msg.data = data;
    this.updateUser(msg);
    this.send("update", data)
  }

  enter() {
    this.send("enter", null);
    this.users.set(this.pid, null);
    this.addItem(this.pid, this.pid);
  }

  leave() {
    this.send("leave", null);
  }

  distributePresence() {
    this.send("presence", JSON.stringify([...this.users]));
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
    const keys = Object.keys(this.root._.opt.peers)
    for (const key of keys) {
      var peer = this.root._.opt.peers[key];
      peer.enabled = false;
      this.root.on('bye', peer);
      peer.url = '';
    }
  }

  onGrid(peerUrl) {
    let peers = this.root._.opt.peers;
    let peer = {};
    peerUrl = "https://gundb-multiserver.glitch.me/" + peerUrl; //TODO use import config.js for this
    peer.id = peerUrl;
    peer.url = peerUrl;
    peers[peerUrl] = peer;
    this.root._.opt.peers = peers;
  }
}
