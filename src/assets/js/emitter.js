export default class EventEmitter {
  constructor(gun) {
    this.events = {};
    this.root = gun;
    this.init();
  }

  init() {
    this.pid = this.root._.opt.pid;
    // DAM Receiver : signaling event
    /* LIMITATIONS: This is NOT scoped to a Room! Filtering is client side only! */
    this.root.on("in", function(msg) {      
      if (msg && msg.signaling) {
        console.log("DAM: handle inbound signaling!", msg.signaling);
        if (msg.signaling == "subscribe" && msg.data.socketId) {
          // This is a broadcast subscribe
          console.log("DAM: subscribe from", msg.data.socketId);
          // if (pcmap.has(msg.data.socketId)) {
          //   console.log(
          //     "DAM: Known Peer! Check status",
          //     pcmap.get(msg.data.socketId).iceConnectionState
          //   );
            //;
          // }
        }
        // if (msg.to && (msg.to == pid || msg.to == socketId)) {
        //   // Switch by msg.signaling event
        //   console.log("DAM: signaling for our local peer!", msg.data);
        // }
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
