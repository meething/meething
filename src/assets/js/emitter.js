export default class EventEmitter {
  constructor(gun, pcmap) {
    this.events = {};
    this.root = gun;
    this.pcmap = pcmap;
    this.init(); 
  }

  init() {
    this.pid = this.root._.opt.pid;

    this.root.on("in", function(msg) {      
      if (msg && msg.signaling) {
        console.log("DAM: handle inbound signaling!", msg.signaling);        
      }
    });
  }

  _getEventListByName(eventName) {
    if (typeof this.events[eventName] === "undefined") {
      this.events[eventName] = new Set();
    }
    return this.events[eventName];
  }

  on(eventName, fn) {
    this._getEventListByName(eventName).add(fn);
  }

  once(eventName, fn) {
    const self = this;

    const onceFn = function(...args) {
      self.removeListener(eventName, onceFn);
      fn.apply(self, args);
    };
    this.on(eventName, onceFn);
  }

  emit(eventName, ...args) {
    this._getEventListByName(eventName).forEach(
      function(fn) {
        fn.apply(this, args);
      }.bind(this)
    );
  }

  removeListener(eventName, fn) {
    this._getEventListByName(eventName).delete(fn);
  }
}
