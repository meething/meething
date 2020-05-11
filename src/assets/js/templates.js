export class Template {
  // default element
  // {type:'',id:'',classList:[],attr:{},}
  constructor(c) {
    this.c = c;
    return this;
  }
  create = () => {
    let data = this.c.data;
    let el = document.createElement(data.type);
    el.id = data.id;
    data.classList.forEach((c) => el.classList.add(c));
    if (data.attr) {
      for (let a of data.attr) {
        el.setAttribute(data.attr[a]);
      }
    }

    el.innerHTML = data.content;
    return el;
  };
}
export class Button {
  constructor(c) {
    this.c = c;
    return this;
  }
  create = () => {
    let { id, classList } = this.c.data;
    let btn = document.createElement("button");
    btn.id = id;
    this.add(btn, classList);
    if (this.c.data.content) this.content(btn, this.c.data.content);
    if (this.c.data.text) this.txt(btn, this.c.data.text);
    if (this.c.data.icon) this.addIcon(btn, this.c.data.icon);
    return btn;
  };
  content = (b, c) => {
    b.innerHTML = c;
  };
  txt = (b, t) => {
    b.innerText = t;
  };
  add = (b, c) => {
    b.classList.add(c);
  };
  addIcon = (b, i) => {
    this.add(b, i);
  };
}

export class Input {
  constructor(c) {
    this.c = c;
    return this;
  }
  create = () => {
    let { type, id, classList, attr, placeholder, active } = this.c.data;
    let inp = document.createElement("input");
    inp.type = type;
    inp.id = id;
    classList.forEach((c) => inp.classList.add(c));
    attr.forEach((a) => inp.setAttribute(a, true));
    inp.placeholder = placeholder;
    inp.active = active;
    return inp;
  };
}

export class Textarea {
  constructor(id, classList, content, text) {
    this.id = id;
    this.classList = classList;
    this.content = content;
    this.text = text;
  }
}
export class Video {
  video = document.createElement("video");
  source = {};
  constructor(src, types, id, classList) {
    this.id = id;
    this.src = src;
    this.types = types;
    this.classList = classList;
  }
  addVideoTypes() {
    this.types.forEach((type, i) => (this.source[type] = this.src[i]));
    return this.source;
  }
  addClass(v, c) {
    c.forEach((a) => v.addClassList(a));
  }
  addSource(s) {
    let src = "";
    s.forEach((source) => {
      src += `<source src="${s.src}" type="${s.type}">`;
    });
    return src;
  }
  create() {
    let vid = document.createElement(this.video);
    let src = addSource(this.source);
    this.addClass(vid, this.classList);
    vid.id = this.id;
    vid.innerHTML = src;
    return vid;
  }
}

class Chat {
  constructor(id) {
    this.id = id;
    // this.classList.add("chat");
  }
}

export class Bubble {
  constructor(id) {
    this.id = id;
    //this.classList.add("chat-bubble")
  }
}

class Widget {
  constructor(id, classList, content) {
    this.id = id;
    this.classList = classList;
    //this.classList.add("widget")
    this.content = content;
  }
}

export class Graph {
  constructor(id, classList, content) {
    this.id = id;
    this.classList = classList;
    // this.classList.add('graph-widget');
    this.content = content;
  }
}

class Menu {
  constructor(id, classList, content) {
    this.id = id;
    this.classList = classList;
    this.content = content;
  }
}

export class MenuItem {
  constructor(id, classList, content, event) {
    this.id = id;
    this.classList = classList;
  }
}

export class Text {
  // type,classname,id,content
  constructor(c) {
    this.c = c;
    return this;
  }
  create() {
    let { type, classList, id, content } = this.c.data;
    let txt = document.createElement(type);
    txt.id = id;
    classList.forEach((c) => txt.classList.add(c));
    txt.innerHTML = content;
    return txt;
  }
}

export class Link {}
