if (typeof Gun === "undefined") {
  throw new Error(
    'Gun is not available add\n<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>'
  );
}

var gun = window.GUN()
var users = gun.get("presence");



gun.__proto__.show = function() {
  users.map().on(function(user, id) {
    if (user !== null) {
      console.log(JSON.stringify(user));
    }
  });
};

gun.__proto__.getAllUsers = async function() {
  var everyone = [];
  await users.map().on(function(user, id) {
    if (user !== null) {
      everyone.push(user);
    }
  });
  return everyone;
};

gun.__proto__.add = function(user) {
  if (user instanceof User) {
    users.get(user.id).put(user);
  } else {
    console.log("Not of type User");
  }
};

gun.__proto__.getUser = async function(id) {
  var user = null;
  await users.get(id).on(function(lookedUpUser, key) {
    user = lookedUpUser;
  });
  return user;
};

gun.__proto__.remove = function(id) {
  users.get(id).put(null);
};

class User {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.online = false;
  }
}

var pid = sessionStorage.getItem("pid");
if (pid == null || pid == undefined) {
  pid = gun._.opt.pid;
  sessionStorage.setItem("pid", pid);
}

var meUser = new User("me", pid);

window.onunload = window.onbeforeunload = function() {
  meUser.online = false;
  gun.add(meUser);
};

window.onload = function(e) {
  meUser.online = true;
  gun.add(meUser);
};

export default {
  getAllUser() {
    var everyone = gun.getAllUsers().then(function(result) {
      console.log(result);
    });
  },

  getMe() {
    var me = gun.getUser(meUser.id).then(function(result) {
      console.log(result);
    });
  }
};
