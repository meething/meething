import h from './helpers.js';
export default class EventEmitter {
  constructor() {
    this.listeners = {};
    this.store = sessionStorage ? JSON.parse(sessionStorage.getItem('eeShared')?sessionStorage.getItem('eeShared'):"{}") : {};
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
  get(key){ 
    return this._get(((key) ? 'store.'+key : 'store')); 
  }
  set(key,value){ 
    return this._set(((key)?'store.'+key : 'store') ,value);
  }
  _get(key){
    return h.fromPath(this,key);
  }
  _set(key,value){
    h.toPath(this,key,value);
    if(sessionStorage) sessionStorage.setItem('eeShared',JSON.stringify(this.get()));
    return this;
  }
}