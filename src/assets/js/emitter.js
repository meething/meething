export default class EventEmitter {
  constructor(gun, room) {
    this.listeners = {};
    this.room = room;
    this.root = gun;
    this.init();
    return this;
  }
  on(event,cb){
    if(!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
    //Object.assign(this,{[event]:this.listeners[event]});
    console.log("added on event",event,"callback",cb,this);
    return this;
  }
  emit(event,data){
    console.log("emitting event",event,"with data",data);
    let cbs = this.listeners[event];
    if(cbs){
      cbs.forEach(cb => cb(data))
    }
    return this;
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

    this.root.on("in", function (msg) {
      /*if (msg && msg.event && self.presence && self.presence.handleADamEvents) {
        self.presence.handleADamEvents(msg);
      }
      else */
      if (msg && msg.signaling) {
        console.log(
          "DAM: handle inbound signaling!",
          msg.signaling + " for room " + msg.data.room
        );
        if (msg.data.room == self.room) {
          switch (msg.signaling) {
            case "subscribe":
              if (msg.data.socketId) {
                console.log("DAM: subscribe from", msg.data.socketId);
                self.emit('Subscribe',msg.data);
              }
              break;
            case "newUserStart":
              console.log("DAM: newUserStart " + msg.data);
              self.emit('NewUserStart',msg.data);
              break;
            case "icecandidates":
              console.log("DAM: icecandidates");
              self.emit('IceCandidates', msg.data);
              break;
            case "sdp":
              console.log("DAM: sdp");
              self.emit('SDP',msg.data);
              break;
            default:
              console.log("DAM: Unknown signaling " + msg.signaling);
              break;
          }
        } else {
          console.error("Should never happen privacy issue we got msg for other room " + msg.data.room);
        }
        if (msg.to && msg.to == this.pid) {
          console.log("DAM: signaling for our local peer!", msg.data);
        }
      }
    });
    return this;
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
