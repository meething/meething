// Import all the modules here instead of index.html
import config from './config.js';
import h from "./helpers.js";
import EventEmitter from './ee.js';
import DamEventEmitter from "./emitter.js";
import Presence from "./presence.js";
import MetaData from "./metadata.js";
import ChatEvents from "./chatevents.js"
import Graph from "./graphThing.js";
import Chat from "./chat.js";
import Modal from "./modal.js";

// define Mediator
function Mediator () {
  // state tracking should occur in here for global state
  // module specific state should be kept in the module (I think?)
  this.DEBUG = false;
  this.TIMEGAP = 6000; //RTC Module?
  this.allUsers = []; // needs to live here
  this.enableHacks = true; // @jabis what is this?
  this.meethrix = false; // lives here for now, video module?
  this.autoload = true; // okay here
  this.root; //need this initiated as soon as possible
  this.room = ''; // need a random name?
  this.roompass;
  this.username = ''; //add a random name here
  this.title = 'Chat'; // move to chat module?
  this.localVideo; // move to UI module
  this.audio;
  this.videoBitrate = '1000';
  this.pcMap = new Map();
  this.myStream;
  this.screenStream;
  this.mutedStream;
  this.audioMuted = false;
  this.videoMuted = false;
  this.isRecording = false;
  this.inited = false;
  this.devices = {};
  this.pc = []; //move this out?
  this.socketId; //this clients socketId (MCU only)
  this.damSocket;
  this.presence; // probably better to move this out
  this.metaData; // separate module
  this.chatEvents; //chat module
  this.h = h;
  this.graph;
  // define 'Workflows' that consist of work across modules

  // welcomeMat is fired as soon as the DOM is loaded
  this.welcomeMat = function () {
    mModal.createModal(); // create and display
  };
}

// Initialize Mediator

var meething = new Mediator();

// Initiate Modules with Mediator

var mGraph = new Graph(meething);
var mModal = new Modal(meething);
var mChat = new Chat(meething);

document.addEventListener('DOMContentLoaded', (event) => {
  console.log('DOM fully loaded and parsed');
  meething.welcomeMat();
});
