class Presence {
  constructor(gun, room) {
    this.gun = gun;
    this.users = gun.get("presence").get(room);
    this.users.map().on(this.show)
  }

  show(user, id) {
      if (user !== null) {
        console.log(JSON.stringify(user));
      }
  }

  async getAllUsers() {
    var everyone = [];
    await this.users.once().map().once(function(user, id) {
      if (user !== null) {
        everyone.push(user);
      }
    });
    return everyone;
  }

  addUser(user) {
    if (user instanceof User) {
      this.users.get(user.id).put({name : user.name, ud});
    } else {
      console.log("Not of type User");
    }
  }

  async getUser(id) {
    var user = null;
    await this.users.get(id).on(function(lookedUpUser, key) {
      user = lookedUpUser;
    });
    return user;
  }

  remove(id) {
    this.users.get(id).put(null);
  }
}

class User {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.online = false;
  }
}

var peers = ['https://livecodestream-us.herokuapp.com/gun','https://livecodestream-eu.herokuapp.com/gun'];
var opt = { peers: peers, localStorage: false, radisk: false };
var gunDB = Gun(opt);

var pid = sessionStorage.getItem("pid");
if (pid == null || pid == undefined) {
  pid = gunDB._.opt.pid;
  sessionStorage.setItem("pid", pid);
}

const meUser = new User(pid, pid);
const presence = new Presence(gunDB, "test");

window.onunload = window.onbeforeunload = function() {
  console.log("leaving " + pid);
  meUser.online = false;
  presence.remove(meUser.id);
};

window.onload = function(e) {
  console.log("entering " + pid);
  meUser.online = true;
  presence.addUser(meUser);
};
