export default class EventEmitter {
  constructor(gun, room) {
    this.root = gun;
    this.room = room;
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
        console.log("DAM: ROOM ", msg.data.room);
        if (msg.data.room !== self.room) {
          console.log("Not our room " + msg.data.room);
        }

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

  out(key, value) {
    value.room = this.room;
    this.root.on("out", {
      pid: this.pid,
      to: value.to || this.pid,
      signaling: key,
      data: value
    });
  }
}
