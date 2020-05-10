
export class Button {
  constructor(c){
      this.c = c;
      return this;
  }
  create = () => { 
    let {id, classList} = this.c.data
    let btn = document.createElement('button');
    btn.id = id
     this.add(btn, classList)
     if(this.c.data.content) this.content(btn,this.c.data.content)
     if(this.c.data.text) this.txt(btn, this.c.data.text)
     if(this.c.data.icon) this.addIcon(btn, this.c.data.icon)
    return btn;
  }
  content = (b,c) => {
    b.innerHTML = c;
  }
  txt = (b,t) => {
    b.innerText = t;
  }
  add = (b,c) => {
    b.classList.add(c)
  }
  addIcon = (b,i) => {
   this.add(b,i)
  }
}


class Input {
  constructor(type,id,classList,placeholder,active){
    this.type = type;
    this.id = id;
    this.classList = classList;
    this.placeholder = placeholder;
    this.active = active;
  }

}


export  class Textarea {
  constructor(id,classList,content,text){
    this.id = id;
    this.classList = classList;
    this.content = content;
    this.text = text;
  }
}
export class Video {
  video = document.createElement('video')
  source = {}
  constructor(src,types, id, classList){
    this.id = id;
    this.src = src;
    this.types = types;
    this.classList = classList;
  }
  addVideoTypes(){
    this.types.forEach((type,i) => this.source[type] = this.src[i]);
    return this.source;
  }
  addClass(v,c){
    c.forEach(a => v.addClassList(a))
  }
  addSource(s){
    let src ="";
    s.forEach( source => {
      src += `<source src="${s.src}" type="${s.type}">`
    })
    return src
  }
  create(){
    let vid = document.createElement(this.video);
    let src = addSource(this.source);
    this.addClass(vid,this.classList);
    vid.id = this.id;
    vid.innerHTML = src;
    return vid;
  }

}

class Chat {
  constructor(id){
    this.id = id;
   // this.classList.add("chat");
  }
}

export class Bubble{
  constructor(id){
    this.id = id;
    //this.classList.add("chat-bubble")
  }
}


class Widget {
  constructor(id,classList,content){
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
  constructor(id,classList,content){
    this.id = id;
    this.classList = classList;
    this.content = content
  }
}

export class MenuItem {
  constructor(id,classList,content,event){
    this.id = id;
    this.classList = classList;
  }
}

export class Link{}

