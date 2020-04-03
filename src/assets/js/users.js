class Presence {
  init(gun, room) {
    this.gun = gun;
    this.users = gun.get("presence").get(room);
    this.users.map().on(this.show, true);
  }

  show(user, id) {
    if (user !== null) {
      console.log(JSON.stringify(user));
    }
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
