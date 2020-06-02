// Import all the modules here instead of index.html
import config from './config.js';
import h from "./helpers.js";

// new ones here
import Conn from "./connection.js";
import Graph from "./graphThing.js";
import Chat from "./chat.js";
import Modal from "./modal.js";
import UEX from "./uex.js";
import EventEmitter from './ee.js';
import Toggles from "./ui/toggles.js";
import PipMode from './ui/pipmode.js';
import GunControl from "./gunControl.js";
import Embed from "./ui/embed.js";
let mGraph,
    mModal,
    mChat,
    mConn,
    mToggles,
    mUex,
    mGunControl,
    mPipMode,
    mEmbed;
// define Mediator
function Mediator() {
  // state tracking should occur in here for global state
  // module specific state should be kept in the module (I think?)
  this.SFU_ENABLED = true;
  this.DEBUG = true;
  this.TIMEGAP = 6000; //RTC Module?
  this.allUsers = []; // needs to live here
  this.enableHacks = config.enableHacks; // @jabis what is this?
  this.meethrix = config.meethrix; // lives here for now, video module?
  this.autoload = config.autoload; // okay here but likely should go to modal
  this.config = config;
  this.root; //need this initiated as soon as possible
  this.room = ''; // need a random name?
  this.roompass;
  this.username = ''; //add a random name here
  this.title = 'Chat'; // move to chat module?
  this.localVideo; // move to CONN?
  this.audio;
  this.videoBitrate = '1000';
  this.pcMap = new Map();
  this.myStream;
  this.screenStream;
  this.mutedStream; // move to CONN?
  this.audioMuted = false; // move to CONN?
  this.videoMuted = false; // move to CONN?
  this.screenShare = false; // move to CONN?
  this.isRecording = false; //move to connection.js
  //this.inited = false; // moved to CONN!!
  this.devices = {};
  this.pc = []; //move this out?
  this.socketId; //this clients socketId (MCU only)
  this.presence; // keep here for others to use
  this.metaData; // separate module
  this.modal;
  this.chat;
  this.conn;
  this.toggles;
  this.pipMode;
  this.h = h;
  this.ee = window.ee = new EventEmitter(),
  this.graph;
  this.embed;

  /* Define 'Workflows' that consist of work across modules
  */

  /* Roll out the welcomeMat is fired as soon as the DOM is loaded
     Sets up the options for the user.
  */

  this.welcomeMat = async function () {
    // 1. Find out who is coming in so we can present options accordingly (handle in this.h)
    // 2. Set options from the start and set them to sessionStorage
    this.mode = this.h.getQString(location.href, "mode");
    this.room = this.h.getQString(location.href, "room") || sessionStorage && sessionStorage.getItem("roomname") ? this.h.getQString(location.href, "room") || sessionStorage.getItem("roomname") : "";
    document.querySelector('#roomname').setAttribute("value", this.room);
    this.username = sessionStorage && sessionStorage.getItem("username") ? sessionStorage.getItem("username") : "";
    document.querySelector('#username').setAttribute("value", this.username);
    this.title = this.room;
    if (this.title && document.getElementById('chat-title')) document.getElementById('chat-title').innerText = this.title;

    // handle the embeded case with a embedded option screen
    if(this.mode == "embed" && this.room) {
      //only embed if room is specified
      console.log("embed detected");
      this.embed.landingPage();
      return;
    };
    this.uex.initialRegister(); // attach dom listeners into ui/ux
    this.gunControl.createInstance();
    await this.getMediaStream();
    await this.getDeviceList(); // get and store devices for later use;
    /* the modal was great but buggy it needed a rewrite */
    //this.modal.createModal(); // create and display
    //this.uex.afterModalRegister(); // attach listeners to items in modal
  };

  /* Initiate sockets and get stuff set up for streaming
     this needs to interface into communication module in the future.
     So we will need to separate out more here.
  */

  this.initSocket = async function () {
    return new Promise((res, rej) => {
      var roomPeer = config.multigun + "gun";
      var hash = null,
        creator = null;
      if (this.room) {
        hash = this.getSS('rooms.' + this.room + '.hash');
        creator = this.getSS('rooms.' + this.room + '.creator');
        var r = (hash && creator) ? this.room + '?sig=' + encodeURIComponent(hash) + "&creator=" + encodeURIComponent(creator) : this.room;
        console.log(r);
        roomPeer = config.multigun + r; //"https://gundb-multiserver.glitch.me/" + room;
      }
      localStorage.clear();
      window.room = this.room;
      window.root = this.gunControl.clearPeers();
      this.gunControl.addPeer(roomPeer);

      // initiate graph
      mGraph.init();

      this.socket = window.socket = this.root
        .get("meething")
        .get(this.room)
        .get("socket");
      if (this.DEBUG) { console.log('initiating Socket', this.root, this.room, this.socket) }
      return res({ root: this.root, room: this.room, socket: this.socket });
    })
  }

  /* Call connection module to establish connection */

  this.initComm = function () {
    mConn.establish();
  }

  /* Helper functions that need to be here for now until modules are more split
  */

  this.storePass = async function (pval, creator) {
    return new Promise(async (res, rej) => {
      let it = await SEA.work({ room: this.room, secret: pval }, pval, null, { name: 'SHA-256' });
      if (this.DEBUG) { console.log("hash", it); }
      this.roompass = pval;
      this.setSS('rooms.' + this.room + '.pwal', pval);
      this.setSS('rooms.' + this.room + '.hash', it);
      if (creator) this.setSS('rooms.' + this.room + '.creator', creator);
      return res(it);
    });
  }
  // Session Storage Helper from @jabis
  this.setSS = function (key, value) {
    return this._setSS(((key) ? 'store.' + key : 'store'), value);
  }

  this._setSS = function (key, value) {
    this.h.toPath(this, key, value);
    if (sessionStorage) sessionStorage.setItem('eeShared', JSON.stringify(this.getSS()));
    return this;
  }

  this.getSS = function (key) {
    return this._getSS(((key) ? 'store.' + key : 'store'));
  }

  this._getSS = function (key) {
    return this.h.fromPath(this, key);
  }

  this.sendMsg = function (msg, local) {
    let data = {
      room: this.room,
      msg: msg,
      sender: this.username || this.socketId
    };

    if (local) {
      // TODO fix this message aka Chat Module
      if (this.DEBUG) { console.log('sendMsg needs fixing still') }
    } else {
      if (this.DEBUG) { console.log('sendMsg needs fixing still') }
    }
  }

  // End of Session Storage Helper

  this.getDeviceList = async function () {
    var devices = await this.h.getDevices();
    this.videoDevices = devices.vs;
    this.audioDevices = devices.as;
    this.speakerDevices = devices.ao;
    this.otherDevices = devices.other;
    this.ee.emit("media:Got DeviceList")
    return true;
  }

  this.getMediaStream = async function(videoDeviceId, audioDeviceId) {
    // TODO: On iOs seems to change device id but still show front camera
    var constraints = {video: videoDeviceId || {facingMode:{ideal:'user'}}, audio: audioDeviceId || true};
    this.myStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.ee.emit("media:Got MediaStream", this.myStream);
    return true;
  }
}

// Initialize Mediator
document.addEventListener('DOMContentLoaded', (event) => {

  var meething = new Mediator();
  // TODO delete this after testing
  window.meething = meething;
  // Initiate Modules with Mediator

  mGraph = new Graph(meething);
  mModal = new Modal(meething);
  mChat = new Chat(meething);
  mConn = new Conn(meething);
  mToggles = new Toggles(meething);
  mUex = new UEX(meething);
  mPipMode = new PipMode(meething);
  mGunControl = new GunControl(meething);
  mEmbed = new Embed(meething);

  meething.graph = mGraph;
  meething.chat = mChat;
  meething.conn = mConn;
  meething.modal = mModal;
  meething.toggles = mToggles;
  meething.gunControl = mGunControl;
  meething.uex = mUex;
  meething.pipMode = mPipMode;
  meething.embed = mEmbed;
  console.log('DOM fully loaded and parsed');
  meething.welcomeMat();

});
