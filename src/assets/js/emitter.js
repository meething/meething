export default class EventEmitter {
  constructor(gun) {
    this.events = [];
    this.root = gun;
    this.init();
  }

  //Posible signaling events
  /*
  subscribe
  newUserStart
  icecandidates
  sdp
  */
  init() {
    const self = this;
    this.pid = this.root._.opt.pid;

    this.root.on("in", function(msg) {
      if (msg && msg.signaling) {
        console.log("DAM: handle inbound signaling!", msg.signaling);

        switch (msg.signaling) {
          case "subscribe":
            if (msg.data.socketId) {
              console.log("DAM: subscribe from", msg.data.socketId);
              self.onSubscribe(msg.data);
            }
            break;
          case "newUserStart":
            console.log("DAM: newUserStart " + msg.data);
            self.onNewUserStart(msg.data);
            break;
          case "icecandidates":
            console.log("DAM: icecandidates");
            self.onIceCandidates(msg.data);
            break;
          case "sdp":
            console.log("DAM: sdp");
            self.onSdp(msg.data);
            break;
          default:
            console.log("DAM: Unknown signaling " + msg.signaling);
            break;
        }

        if (msg.to && msg.to == this.pid) {
          console.log("DAM: signaling for our local peer!", msg.data);
        }
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

  out(key, value) {
    this.root.on("out", {
      pid: this.pid,
      to: value.to || this.pid,
      signaling: key,
      data: value
    });
  }
}
