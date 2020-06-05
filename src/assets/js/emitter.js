import EventEmitter from './ee.js';
import h from './helpers.js';
export default class DamEventEmitter extends EventEmitter {
  constructor(gun, room) {
    super();
    this.presence = null;
    this.metaData = null;
    this.room = room;
    this.root = gun;
    this.user = gun.user();
    this.init();
    this.checkAuth();
    return this;
  }
  async reinit(){
    var self = this;
    return new Promise(async(res,rej)=>{
      if(window.reinit) {
        let socks = await window.reinit();
        console.log(socks);
        self.root = socks.root;
        self.room = socks.room;
        self.user = socks.root.user();
        return res(self);
      } else {
        return res(self);
      }
    })
  }
  async checkAuth(){
    console.log("checking auth");
    var self = this;
    if(self.user.is) self.user.leave();
    this.root.get("meething").get(this.room).on(async function(data,key,g,events){
      events.off();
      console.log('data',data,key);
      if(data && data.hasOwnProperty('passwordProtected')){
        console.log("are we password protected?",data.passwordProtected ? 'yes' : 'no');
        if(!data.passwordProtected) { 
          return self.emit('auth:ok',data);
        } else {
          //self = await self.reinit(); // let the magic happen reconnecting gun because of reasons
          console.log("OK searching for user hash");
          var hash = self.get('rooms['+self.room+'].hash');
          console.log("hash found?",hash);
          if(hash){
            console.log("trying to authenticate");
            self.user.auth(self.room,hash,function(ack){
              if(ack.err){ 
                console.warn("error authenticating",self.room,"with hash",hash, "had error:",ack.err); 
                return self.emit('auth:fail',{err:ack.err}); 
              }
              self.emit('auth:ok', data);
            });
          } else {
            return self.emit('auth:fail',{err:'No credentials!'});
          }
        }
      } else {
        console.warn("something wrong with data",data,key);
      }
    });
    return this;
  }
  setPresence(presence) {
    this.presence = presence;
  }

  getPresence() {
    return this.presence ? this.presence : false;
  }
 
  setMetaData(metaData) {
    this.metaData = metaData;
  }

  getMetaData() {
    return this.metaData ? this.metaData : false;
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
    this.on('auth:ok',function(auth){
      //self.emit('postauth',auth);
      // window.addEventListener('DOMContentLoaded',function(){
        self.emit('postauth',auth);
      // })
      self.root.on("in", function (msg) {
        if (msg && msg.event && self.getPresence()) {
          let presence = self.getPresence();
          if (presence) presence.handleADamEvents(msg);
        } else if (msg && msg.metaData) {
          let metaData = self.getMetaData();
          if (metaData) metaData.receiveData(msg.metaData);
        }
        else if (msg && msg.signaling) {
          /*console.log(
            "DAM: handle inbound signaling!",
            msg.signaling + " for room " + msg.data.room
          );*/
          if (msg.data.room == self.room) {
            switch (msg.signaling) {
              case "subscribe":
                if (msg.data.socketId) {
                // console.log("DAM: subscribe from", msg.data.socketId);
                  self.emit('Subscribe', msg.data);
                }
                break;
              case "newUserStart":
              // console.log("DAM: newUserStart " + msg.data);
                self.emit('NewUserStart', msg.data);
                break;
              case "icecandidates":
              //  console.log("DAM: icecandidates");
                self.emit('IceCandidates', msg.data);
                break;
              case "sdp":
              //  console.log("DAM: sdp");
                self.emit('SDP', msg.data);
                break;
              default:
            //   console.log("DAM: Unknown signaling " + msg.signaling);
                break;
            }
          } else {
            console.error("Should never happen privacy issue we got msg for other room " + msg.data.room);
          }
          if (msg.to && msg.to == self.pid) {
          //  console.log("DAM: signaling for our local peer!", msg.data);
          }
        }
      });
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
