if (typeof Gun === 'undefined') {
  throw new Error(
    'Gun is not available add\n<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>'
  );
}

var users = Gun().get("presence");

Gun().__proto__.show = function() {
  users.map().on(function(user, id) {
    if (user !== null) {
      console.log(JSON.stringify(user));
    }
  });
};

Gun().__proto__.getAllUsers = async function() {
  var everyone = [];
  await users.map().on(function(user, id) {
    if (user !== null) {
      everyone.push(user);
    }
  });
  return everyone;
};

Gun().__proto__.add = function(user) {
  if (user instanceof User) {
    users.get(user.id).put(user);
  } else {
    console.log("Not of type User");
  }
};

Gun().__proto__.getUser = async function(id) {  
  var user = null
  await users.get(id).on(function(lookedUpUser, key){
    user = lookedUpUser;
  });
  return user;
};

Gun().__proto__.remove = function(id) {
  users.get(id).put(null);
};

class User {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.online = false;
  }
}

var gun = new Gun();

var pid = sessionStorage.getItem("pid");
if (pid == null || pid == undefined) {
  pid = Gun()._.opt.pid;
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


var everyone = gun.getAllUsers().then(function(result) {
  console.log(result);
});

var me = gun.getUser(meUser.id).then(function(result) {
  console.log(result);
});
