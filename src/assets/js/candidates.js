class Candidates {
    constructor(gun, room) {
        this.gun = gun;
        this.think = gun.get(room);
        this.think.map().on(this.show);
    }

    add(user) {
        this.think.set(user);
    }

    remove(user) {
        todos.get(user.id).put(null)
        this.think.unset(user);
    }

    update(user) {
        this.think.get(user.id).put(user);
    }

    show(thought, id) {
        console.log(thought);
        var htmlCollection = document.getElementsByTagName("li");
        var elements = [...htmlCollection];
        const result = elements.map(element => element.id);

        if(result.includes(thought.id) && thought.online) {
            return;
        }

        if (thought !== null && thought.online == true) {
            var ul = document.getElementById("dynamic-list");
            var candidate = document.getElementById("candidate");
            var li = document.createElement("li");
            li.setAttribute("id", thought.id);
            li.appendChild(document.createTextNode(thought.name));
            ul.appendChild(li);
        } else {
            var elements = document.getElementsByTagName("li");
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i]
                if (element.id == id) {
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