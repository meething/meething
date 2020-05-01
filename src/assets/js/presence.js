import h from "./helpers.js";
export default class Presence {
  constructor(gun, room) {
    this.root = gun;
    this.room = room;
    this.pid = this.root._.opt.pid;
    this.users = new Map();
    var _ev = h.isiOS() ? 'pagehide' : 'beforeunload';
    var self = this;
    window.addEventListener(_ev, function () { self.leave(); });
    return this;
  }

  handleADamEvents(msg) {
    if (msg && msg.event) {
      switch (msg.event) {
        case "enter":
          this.users.set(msg.pid, msg);
          this.addItem(msg.pid);
          this.distrubutePresence();
          break;
        case "leave":
          this.users.delete(msg.pid);
          this.removeItem(msg.pid);
          this.distrubutePresence();
          break;
        case "presence":
          this.addReceivedUsers(msg.data);
          break;
        case "update":
          this.updateUser(msg)
          this.distrubutePresence();
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
    self = this;
    const receivedUsers = new Map(JSON.parse(data));
    receivedUsers.forEach(function (value, key) {
      if (!self.users.has(key)) {
        self.users.set(key, value);
        if(value != null && value.username) {
          self.addItem(value.username);
        } else {
          self.addItem(key);
        }
      }
    });
  }

  send(event, data) {
    this.root.on("out", { pid: this.pid, event: event, data: data });
  }

  update(username, socketId) {
    var data = { username: username, socketId: socketId }
    this.send("update", data)
  }

  enter() {
    this.send("enter", null);
    this.users.set(this.pid, null);
    this.addItem(this.pid);
  }

  leave() {
    this.send("leave", null);
  }

  distrubutePresence() {
    this.send("presence", JSON.stringify([...this.users]));
  }

  addItem(pid) {
    var ul = document.getElementById("dynamic-list");
    var li = document.createElement("li");
    li.setAttribute("id", pid);
    li.appendChild(document.createTextNode(pid));
    ul.appendChild(li);
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
    peerUrl = "https://gundb-multiserver.glitch.me/" + peerUrl;
    peer.id = peerUrl;
    peer.url = peerUrl;
    peers[peerUrl] = peer;
    this.root._.opt.peers = peers;
  }
}
