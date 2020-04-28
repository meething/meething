export default class EventEmitter {
  constructor() {
    this.listeners = {};
    return this;
  }
  on(event,cb){
    if(!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
    return this;
  }
  emit(event,data){
    let cbs = this.listeners[event];
    if(cbs){
      cbs.forEach(cb => cb(data))
    }
    return this;
  }
}