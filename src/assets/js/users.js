class Candidates {
  constructor(room) {
    this.gun = Gun("https://gunmeetingserver.herokuapp.com/gun");
    this.think = this.gun.get("presence/" + room);
    this.think.map().on(this.show);
  }

  add(user) {
    this.think.get(user.id).put(user);
  }

  remove(user) {
    this.think.get(user.id).put(null);
  }

  show(thought, id) {
    console.log(thought);
    if (thought !== null) {
      var ul = document.getElementById("dynamic-list");
      var candidate = document.getElementById("candidate");
      var li = document.createElement("li");
      li.setAttribute("id", id);
      li.appendChild(document.createTextNode(thought.name));
      ul.appendChild(li);
    } else {
      var element = document.getElementById(id);
      if (element !== null) {
        element.parentNode.removeChild(element);
      }
    }
  }
}

class Presence {
  constructor(gun, room) {
    this.gun = gun;
    this.users = gun.get("presence").get(room);
    this.subscribe(function(user, id) {
      // console.log(user);
    });
  }

  subscribe(callback) {
    this.users.map().on(function(user, id) {
      if (user !== null) {
        // console.log(JSON.stringify(user));
      }
      callback(user, id);
    }, true);
  }

  async getAllUsers() {
    var everyone = [];
    await this.users
      .once()
      .map()
      .once(function(user, id) {
        if (user !== null) {
          everyone.push(user);
        }
      });
    return everyone;
  }

  addUser(user) {
    if (user instanceof User) {
      console.log("adding user");
      this.users.get(user.id).put(user);
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
