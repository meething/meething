class Candidates {
  constructor(gun, room) {
    this.gun = gun;
    this.think = gun.get(room);
    this.think.map(function(data, id) {
      console.log('room', data.online);
    });
    this.think.map().on(this.show);
  }

  add(user) {
    this.think.set(user);
  }

  remove(user) {
    this.think.get(user.id).put(null);
    this.think.unset(user);
  }

  update(user) {
    this.think.get(user.id).put(user);
  }
  
  get(id) {
    var user;
    this.think.map(function(data, gunId) {
      if(data !== null && data.id != null && data.online && data.id == id) {
        user = data;
      }
    });
    return user;
  }

  getAll() {
    var all = [];
    this.think.map(function(data, id) {
      if(data && !data.online) return;
      all.push(data);
    });
    return all;
  }

  show(thought, id) {
    var htmlCollection = document.getElementsByTagName("li");
    var elements = [...htmlCollection];
    const result = elements.map(element => element.id);

    if (thought != null && result.includes(thought.id) && thought.online) {
      return;
    }

    if (thought !== null && thought.online == true) {
      var ul = document.getElementById("dynamic-list");
      var candidate = document.getElementById("candidate");
      var li = document.createElement("li");
      li.addEventListener("click", Candidates.prototype.onCall);
      li.setAttribute("id", thought.id);
      li.appendChild(document.createTextNode(thought.name));
      ul.appendChild(li);
    } else {
      var elements = document.getElementsByTagName("li");
      for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        if (element.id == id && id != sessionStorage.getItem("pid")) {
          element.parentNode.removeChild(element);
        }
      }
    }
  }
}

class User {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.online = false;
  }
}
