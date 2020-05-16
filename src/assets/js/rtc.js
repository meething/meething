/**
 * @author Jabis Sevón <jabis.is@gmail.com>
 * @date 1st May, 2020
 * @author Lorenzo Mangani, QXIP BV <lorenzo.mangani@gmail.com>
 * @date 27th April, 2020
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 6th January, 2020
 */
import config from './config.js';
import h from "./helpers.js";
import EventEmitter from './ee.js';
import DamEventEmitter from "./emitter.js";
import Presence from "./presence.js";
import MetaData from "./metadata.js";
import ChatEvents from "./chatevents.js"
import Graph from "./graphThing.js";
import Video from "./sfu/video.js"


var DEBUG = false; // if (DEBUG)
var TIMEGAP = 6000;
var allUsers = [];
var enableHacks = true;
var meethrix = window.meethrix = true,
  autoload = window.autoload = true; //SET TO FALSE IF YOU DON'T WANT TO DEVICES TO AUTOLOAD

window.h = h;
var ee = null,
  modal = null;
var root;
var room,
  roompass;
var username;
var title = "ChatRoom";
var localVideo;
var audio;
var isRecording = false;
var videoBitrate = '1000'
var socket;
var room;
const pcMap = new Map(); // A map of all peer ids to their peerconnections.
window.pcmap = pcMap;
var myStream;
var screenStream;
var mutedStream,
  audioMuted = false,
  videoMuted = false,
  isRecording = false,
  inited = false,
  devices = {};
var socket;
var pc = []; // hold local peerconnection statuses
const pcmap = new Map(); // A map of all peer ids to their peerconnections.
var socketId;
var damSocket;
var presence;
var metaData;
var chatEvents;
var graph;

// SFU ENABLED MEETHING
const SFU_ENABLED = true;
const video = new Video();

window.addEventListener('DOMContentLoaded', function () {
  room = h.getQString(location.href, "room") ? h.getQString(location.href, "room") : "";
  username = sessionStorage && sessionStorage.getItem("username") ? sessionStorage.getItem("username") : "";
  title = room.replace(/(_.*)/, '');
  if (title && document.getElementById('chat-title')) document.getElementById('chat-title').innerHTML = title;
  ee = window.ee = new EventEmitter();
  chatEvents = new ChatEvents(ee);
  //initSocket(); // letting socket start for now
  modal = window.modal = new tingle.modal({
    closeMethods: [],
    footer: true,
    stickyFooter: true,
    onOpen: function () {
      let setupBtn = document.getElementById('tingleSetupBtn');
      if (setupBtn) {
        let deviceSelection = document.getElementById('deviceSelection');
        let preview = document.getElementById('preview');
        let local = document.getElementById('local');
        if (h.isOldEdge() || !autoload) {
          setupBtn.addEventListener('click', function (e) {
            e.preventDefault();
            setupBtn.hidden = true;
            if (deviceSelection.hidden) {
              deviceSelection.hidden = false;
              resetDevices();
              ee.emit('modal:filled', modal);
            }
          })
        } else {
          setupBtn.hidden = true;
          resetDevices();
          ee.emit('modal:filled', modal);
        }
        if (preview && local) {
          preview.appendChild(local);
          local.className = "";
        }
      }
      var cr = document.getElementById('create-room');
      if (cr) cr.addEventListener('click', async (e) => {
        e.preventDefault();
        let roomName = document.querySelector('#room-name').value;
        let yourName = document.querySelector('#your-name').value;
        let romp = document.querySelector('#room-pass').value;
        if (roomName && yourName) {
          //remove error message, if any
          var errmsg = document.querySelector('#err-msg');
          if (errmsg) document.querySelector('#err-msg').innerHTML = "";

          //save the user's name in sessionStorage
          sessionStorage.setItem('username', yourName);
          //create room link
          let roomgen = `${roomName.trim().replace(' ', '_')}_${h.generateRandomString()}`;
          let roomLink = `${location.origin}?room=${roomgen}`;
          room = roomgen;
          username = yourName;
          cr.hidden = true;
          if (romp) {
            roompass = romp;
            await storePass(romp, yourName);
          }
          //show message with link to room
          document.querySelector('#room-created').innerHTML = `Room successfully created. Share the <a id="clipMe" style="background:lightgrey;font-family:Helvetica,sans-serif;padding:3px;color:grey" href='${roomLink}' title="Click to copy">room link</a>  with your partners.`;
          var clip = document.getElementById('clipMe');
          if (clip) clip.addEventListener('click', function (e) {
            e.preventDefault();
            h.copyToClipboard(e.target.href);
            if (errmsg) {
              errmsg.innerHTML = 'Link copied to clipboard ' + roomLink;
            }
          });
          //empty the values
          document.querySelector('#room-name').value = roomgen;
          document.querySelector('#room-name').readonly = true;
          document.querySelector('#your-name').readonly = true;
          document.querySelector('#room-pass').readonly = true;
          document.querySelector('#room-name').disabled = true;
          document.querySelector('#your-name').disabled = true;
          document.querySelector('#room-pass').disabled = true;
        }
        else {

          document.querySelector('#err-msg').innerHTML = "All fields are required";
          // roomName.focus();
        }
      });

    }
  });
  var toggleModal = document.getElementById('toggle-modal');
  if (toggleModal) toggleModal.addEventListener('click', e => {
    e.preventDefault();
    modal.open();
  })
  async function storePass(pval, creator) {
    return new Promise(async (res, rej) => {
      let it = await SEA.work({ room: room, secret: pval }, pval, null, { name: 'SHA-256' });
      console.log("hash", it);
      roompass = pval;
      ee.set('rooms.' + room + '.pwal', pval);
      ee.set('rooms.' + room + '.hash', it);
      if (creator) ee.set('rooms.' + room + '.creator', creator);
      return res(it);
    });
  }
  ee.on('join:ok', async function () {
    var args = Array.from(arguments); // no spread here, because of Edge crapping
    console.log('Arguments are ', args);
    let _name = document.querySelector('#username') ? document.querySelector('#username') : sessionStorage.getItem('username') ? { value: sessionStorage.getItem('username') } : false;
    let _pass = document.querySelector('#room-pass');

    if (!_name || !_name.value) return;
    if (_name && _name.value) {
      sessionStorage.setItem('username', _name.value);
    }
    if (room && history.pushState) {
      window.history.pushState(null, '', '?room=' + room);
    }
    var pval = _pass && _pass.value ? _pass.value : false;
    if (pval) await storePass(pval);
    var ve = document.getElementById('local');
    var vs = document.getElementById('localStream');
    if (ve && vs) {
      ve.className = "local-video clipped";
      vs.appendChild(ve);
    }
    initSocket().then(sock => {
      initRTC();
      modal.close();
    })
  });
  ee.on('setup:ok', async function () {
    var args = Array.from(arguments); // no spread here, because of Edge crapping
    let _name = document.querySelector('#your-name');
    let _room = document.querySelector('#room-name');
    let _pass = document.querySelector('#room-pass');

    if (!_name || !_name.value || !_room || !_room.value) {
      document.querySelector('#err-msg').innerHTML = "Room and username fields are required";
      return;
    }
    if (_name && _name.value) {
      sessionStorage.setItem('username', _name.value);
    }
    if (_room && _room.value && history.pushState) {
      window.history.pushState(null, '', '?room=' + _room.value);
      room = _room.value;
    }
    var pval = _pass && _pass.value ? _pass.value : false;
    if (pval) await storePass(pval, _name.value);
    console.log('Arguments are ', args);
    var ve = document.getElementById('local');
    var vs = document.getElementById('localStream');
    if (ve && vs) {
      ve.className = "local-video clipped";
      vs.appendChild(ve);
    }
    initSocket().then(sock => {
      initRTC();
      modal.close();
    })
  });
  ee.on('nouser:ok', async function () {
    var args = Array.from(arguments); // no spread here, because of Edge crapping
    let _name = document.querySelector('#username');
    let _pass = document.querySelector('#room-pass');

    if (!_name || !_name.value) { return; }
    if (_name && _name.value) {
      sessionStorage.setItem('username', _name.value);
    }
    if (room && history.pushState) {
      window.history.pushState(null, '', '?room=' + room);
    }
    var pval = _pass && _pass.value ? _pass.value : false;
    if (pval) await storePass(pval);
    console.log('Arguments are ', args);
    var ve = document.getElementById('local');
    var vs = document.getElementById('localStream');
    if (ve && vs) {
      ve.className = "local-video clipped";
      vs.appendChild(ve);
    }
    initSocket().then(sock => {
      initRTC();
      modal.close();
    })
  });
  ee.on('noroom:ok', async function () {
    var args = Array.from(arguments); // no spread here, because of Edge crapping
    console.log('Arguments are ', args);
    let _name = document.querySelector('#room-name');
    let _pass = document.querySelector('#room-pass');

    if (_name && _name.value) {
      room = _name.value
    }
    if (room && history.pushState) {
      window.history.pushState(null, '', '?room=' + room);
    }
    var pval = _pass && _pass.value ? _pass.value : false;
    if (pval) await storePass(pval);
    var ve = document.getElementById('local');
    var vs = document.getElementById('localStream');
    if (ve && vs) {
      ve.className = "local-video clipped";
      vs.appendChild(ve);
    }
    initSocket().then(sock => {
      initRTC();
      modal.close();
    })
  });
  ee.on('modal:filled', function (modal) {
    let type = modal.__type;
    setTimeout(function () { modal.checkOverflow() }, 300);
    var letsgo = document.querySelectorAll('.letsgo');
    if (!letsgo.length) {

      modal.addFooterBtn("Let's Go !  <i class='fas fa-chevron-right'></i>", 'tingle-btn tingle-btn--primary letsgo tingle-btn--pull-right', function (e) {
        try { mutedStream = h.getMutedStream(); } catch (err) { console.warn("error in getting mutedstream", err); }
        ee.emit(type + ':ok', { modal, e });

      });
    }
  })
  var cancelFn = function (why) {
    room = null;
    sessionStorage.clear();
    modal.close();
    window.location = '/';
  }
  ee.on('join:cancel', cancelFn);
  ee.on('nouser:cancel', cancelFn);
  ee.on('noroom:cancel', cancelFn);
  ee.on('setup:cancel', cancelFn);
  ee.on("Chat-Message", function (data) {
    metaData.sendChatData(data);
  });

  function resetDevices() {
    var as = document.getElementById('as');
    var ao = document.getElementById('ao');
    var vs = document.getElementById('vs');
    var ve = document.getElementById('local');
    if (ve) localVideo = ve;
    if (myStream) {
      myStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    if (!h.canSelectAudioDevices()) { //Firefox springs to mind ;(
      ao.disabled = true;
      ao.readonly = true;
    }
    var aoListener = function (e) {
      return h.setAudioToVideo(ao, ve);
    }
    ao.removeEventListener('change', aoListener);
    ao.addEventListener('change', aoListener)
    as.removeEventListener('change', resetDevices);
    as.addEventListener('change', resetDevices);
    vs.removeEventListener('change', resetDevices);
    vs.addEventListener('change', resetDevices);
    var clicked = function clicked(e) { ee.set('config[' + e.target.id + ']', !!this.checked); };
    sam.removeEventListener('click', clicked);
    svm.removeEventListener('click', clicked);
    sam.addEventListener('click', clicked);
    svm.addEventListener('click', clicked);
    const asv = as.value;
    const vsv = vs.value;
    const samv = sam.checked;
    const svmv = svm.checked;
    const constraints = {
      audio: { deviceId: asv ? { exact: asv } : undefined },
      video: { deviceId: vsv ? { exact: vsv } : undefined }
    };
    h.getUserMedia(constraints).then(async stream => {
      myStream = stream;
      window.myStream = stream;
      h.setVideoSrc(ve, stream);
      h.replaceStreamForPeers(pcmap, stream);
      ve.oncanplay = function () { modal.checkOverflow(); }
      return Object.keys(devices).length > 0 ? devices : h.getDevices();
    }).then(devices => {
      ee.emit('navigator:gotDevices', devices);
    }).catch(err => {
      console.warn('something fishy in devices', err);
    });

  }
  var modalContent = "";
  var errmsg = '<span class="form-text small text-danger" id="err-msg"></span>';
  var cammicsetc =
    h.isOldEdge() || !autoload
      ? `
      <div class="col-md-12">
      <button class="form-control rounded-0" id="tingleSetupBtn">Set up your devices</button>
    <div id="deviceSelection" hidden>
    <label for="as">Mic:</label><br/>
    <select id="as"></select><br/>
    <label for="ao">Speakers: </label><br/>
    <select id="ao"></select><br/>
    <label for="vs">Camera:</label><br/>
    <select id="vs"></select><br/>
    <button class="btn btn-lg btn-outline-light" id="sam" title="Mute/Unmute Audio">
      <i class="fa fa-volume-up"></i>
    </button>
    <button class="btn btn-lg btn btn-outline-light fas fa-video" id="svm" title="Mute/Unmute Video">
    </button><br/>
    <div id="preview"><video id="local" playsinline autoplay muted width="150px"></video></div>
  </div>
  </div>
`
      : `
<div class="p-container">
<div id="" class="preview-container">
  <div class="row">

    <div class="col-md-12 mx-auto">
<video id="local" class="mx-auto" playsinline autoplay muted></video>
 </div>

    <div class="preview-video-buttons row col-md-12">

    <div class="col m-1 mb-3 mx-auto">
      <button id="sam" class="fa fa-volume-up mx-auto" title="Mute/Unmute Audio">
      </button>
      <small class="d-block d-xs-block d-md-none text-white m-3 mx-auto text-center">Sound On / Off</small>
      </div>
      <div class="col m-1 mb-3 mx-auto">
      <button id="svm" class="fa fa-video mx-auto" title="Mute/Unmute Video">

      </button>
      <small class="d-block d-xs-block d-md-none text-white m-3 mx-auto text-center">Cam On / Off</small>
      </div>
  </div>
  </div>

</div>

<button class="form-control rounded-0" id="tingleSetupBtn">Set up your devices</button>

    <div id="deviceSelection">

      <div class="form-row">

        <div class="col-md-4 mb-3">
         <label for="as" class="text-white">Mic:</label>
           <select id="as" class="form-control btn-sm rounded-0"></select>
         </div>

       <div class="col-md-4 mb-3">
            <label for="ao" class="text-white">Speakers: </label>
              <select id="ao" class="form-control btn-sm rounded-0"></select>
           </div>

      <div class="col-md-4 mb-3">
              <label for="vs" class="text-white">Camera:</label>
            <select id="vs" class="form-control btn-sm rounded-0"></select>
          </div>
      </div>
    </div>
    </div>

  `;

  ee.on('navigator:gotDevices', function (devices) {
    //console.log('hello',devices);
    ["as", "ao", "vs"].map(function (group) {
      let devs = devices[group];
      var str = "";
      var qs = document.getElementById(group);
      h.each(devs, function (label, device) {
        //console.log(label,device);
        var opt = document.getElementById(label.replace(/[^a-zA-Z0-9]/g, ''));
        if (!opt) {
          opt = document.createElement('option');
          opt.id = label.replace(/[^a-zA-Z0-9]/g, '');
        }
        opt.value = device.deviceId;
        opt.text = label;
        if (qs) qs.appendChild(opt);
      });
      modal.checkOverflow();
    });
  });
  h.getDevices().then(devices => {
    devices = window.devices = devices;
    ee.emit('navigator:gotDevices', devices);
  });
  // default inputs
  var joinnameinput = `<label for="username">Your Name</label><input type="text" id="username" class="form-control rounded-0" placeholder="Your Name" required/>`;
  var createnameinput = `<label for="your-name">Your Name</label> <input type="text" id="your-name" class="form-control rounded-0" placeholder="Your Name" required/>`;
  var passwinput = `<label for="room-pass">Room password</label> <input id="room-pass" class="form-control rounded-0" type="password" autocomplete="new-password" placeholder="Password (optional)" />`;
  var roominput = `<label for="room-name">Room Name</label><input type="text" id="room-name" class="form-control rounded-0" placeholder="Room Name" required/> `;
  // @TODO disable roomcreate button when errors
  var roomcreatebtn = `<button id="create-room" class="btn btn-block rounded-0 btn-info">Create Room</button>`
  var roomcreated = `<div id="room-created"></div>`;

  if (room && username) {
    // Welcome back xX!
    modalContent = `
    <div class="container-fluid">
    <div class="row">
    <div class="col-md-4 speech-bubble mx-auto">
     ${cammicsetc}
    </div>
    <div class="col-md-4 mt-4 mx-auto text-white">
    <h4 class="speech-msg">Welcome back, <input type="hidden" id="username" value="${username}"/>${username}! </h4>
    <p>You're joining room: <input type="hidden" id="room-name" value="${room}"/> ${title} </p>
    <br/>${passwinput}<br/>
    </div> 
    </div> 
    </div>`;
    return loadModal(modal, modalContent, 'join');
    //
  } else if (room && !username) {
    // set username and camera options 
    // when is room created
    modalContent =
      ` 
    <div class="row"> 
    <div class="col-md-4 speech-bubble mx-auto"> 

      ${cammicsetc}
       </div>
      <div class="col-md-4 mt-4 mx-auto room-form">
      <h4 class="speech-msg">
      Welcome, you're joining room <input type="hidden" id="room-name" value="${room}"/> ${title}</h4>

      <p>
      Please enter your username and set up your camera options! </p>
      <br/>
      ${joinnameinput} <br/>
      ${passwinput} <br/>

      </div>

    </div>
    `;
    return loadModal(modal, modalContent, 'nouser');

  } else if (!room && username) {

    // enter room name to join
    modalContent = `
  <div class="container-fluid">
    <div class='row'>
    <div class='col-md-4 speech-bubble mx-auto'>
      ${cammicsetc}
       </div>
      <div class='col-md-4 mt-4 mx-auto room-form'>
      <h4 class='speech-msg'>

      Welcome back, <input type='hidden' id='username' value='${username}'/>${username}</h4>
      <p>
      Please enter the room name you want to join or create below! </p>
      <br/>
    ${roominput}<br/>
    ${passwinput}<br/>
      </div>
    </div>
    </div>`;


    return loadModal(modal, modalContent, 'noroom');
  } else {
    // Set up a new room
    modalContent = `
    <div class="container-fluid">
    <div class='row'>
      <div class='col-md-4 speech-bubble mx-auto'>
        <p class='speech-msg'>
        Hey, let\'s set up a new room!</p>
        ${cammicsetc}
      </div>
      <div class='col-md-4 mx-auto mt-5 room-form'>
        <div class='d-none d-xs-none d-md-block'>
          <img src='https://camo.githubusercontent.com/057efe39855e1a06d6c7f264c4545fc435954717/68747470733a2f2f692e696d6775722e636f6d2f585337396654432e706e67' width='200' style='filter:invert(1); opacity:.5' />
       </div>
       <p>${roomcreated}</p>
        ${errmsg}<br>
        ${createnameinput}<br>
        ${roominput}<br>
        ${passwinput}<br>
        <br> <br>
        ${roomcreatebtn}
       </div>
      </div>
      </div>
      `

    return loadModal(modal, modalContent, 'setup');
  }

});

function loadModal(modal, createOrJoin, type) {
  Object.assign(modal, { __type: type });
  modal.setContent(`${createOrJoin}`);
  modal.addFooterBtn(`<i class='fas fa-times'></i> Reset`, 'tingle-btn tingle-btn--default tingle-btn--pull-left', function (e) {
    try { mutedStream = mutedStream ? mutedStream : h.getMutedStream(); } catch (err) { console.warn("error in getting mutedstream", err); }
    ee.emit(type + ':cancel', { modal, e });
  });
  modal.open();
}

async function initSocket() {
  return new Promise((res, rej) => {
    var roomPeer = config.multigun + "gun";
    var hash = null,
      creator = null;
    if (room) {
      hash = ee.get('rooms.' + room + '.hash');
      creator = ee.get('rooms.' + room + '.creator');
      var r = (hash && creator) ? room + '?sig=' + encodeURIComponent(hash) + "&creator=" + encodeURIComponent(creator) : room;
      console.log(r);
      roomPeer = config.multigun + r; //"https://gundb-multiserver.glitch.me/" + room;
    }
    localStorage.clear();
    var peers = [roomPeer];
    var opt = { peers: peers, /*localStorage: false,*/ radisk: false };
    window.room = room;
    root = window.root = Gun(opt);
    graph = new Graph(root, ee)

    socket = window.socket = root
      .get("meething")
      .get(room)
      .get("socket");
    return res({ root, room, socket });
  })
}
var reinit = window.reinit = async function () {
  let stuff = await initSocket();
  return stuff;
}

function sendMsg(msg, local) {
  let data = {
    room: room,
    msg: msg,
    sender: username || socketId
  };

  if (local) {
    ee.emit("local", data)
  } else {
    ee.emit("tourist", data)
  }
}

var _ev = h.isiOS() ? 'pagehide' : 'beforeunload';
window.addEventListener(_ev, function () {
  if (damSocket && damSocket.getPresence()) damSocket.getPresence().leave();
  pcMap.forEach((pc, id) => {
    if (pcMap.has(id)) {
      pcMap.get(id).close();
      pcMap.delete(id);
    }
  });
});

function initPresence() {
  presence = new Presence(root, room);
  damSocket.setPresence(presence);
  if (h.typeOf(presence.enter) == "function") presence.enter();
}

function metaDataReceived(data) {
  if (data.event == "chat") {
    if (data.ts && Date.now() - data.ts > 5000) return;
    if (data.socketId == socketId || data.sender == socketId) return;
    if (data.sender == username) return;
    if (DEBUG) console.log("got chat", data);
    h.addChat(data, "remote");
  } else if (data.event == "notification") {
    if (data.ts && Date.now() - data.ts > 5000 || data.ts == undefined || data.username == username) return;
    if (data.subEvent == "recording") {
      if (data.isRecording) {
        var notification = data.username + " started recording this meething";
        h.showNotification(notification);
      } else {
        var notification = data.username + " stopped recording this meething"
        h.showNotification(notification);
      }
    } else if (data.subEvent == "grid") {
      if (data.isOngrid) {
        var notification = data.username + " is going off the grid";
        h.showNotification(notification);
      } else {
        var notification = data.username + " is back on the grid"
        h.showNotification(notification);
      }
    } else if (data.subEvent == "mute") {
      if (data.muted) {
        var notification = data.username + " is going silent";
        h.showNotification(notification);
      } else {
        var notification = data.username + " is on speaking terms"
        h.showNotification(notification);
      }
    }
  } else if (data.event == "control") {
    if (data.username && data.socketId) {
      h.swapUserDetails(data.socketId + "-title", data);
    }
    if (data.talking) {
      if (DEBUG) console.log('Speaker Focus on ' + data.username);
      h.swapDiv(data.socketId + "-widget");
    }
    if (data.readonly) {
      if (DEBUG) console.log('Read-Only Joined: ' + data.username);
      h.showNotification("Read-Only Join by " + data.username);
      h.hideVideo(data.socketId, true);
    }
  }
  else {
    if (DEBUG) console.log("META::" + JSON.stringify(data));
    //TODO @Jabis do stuff here with the data
    //data.socketId and data.pid should give you what you want
    //Probably want to filter but didnt know if you wanted it filter on socketId or PID
  }
  ee.emit('graph:update');
}

function initRTC() {
  if (inited) return;
  inited = true;

  damSocket = new DamEventEmitter(root, room);
  let commElem = document.getElementsByClassName("room-comm");

  for (let i = 0; i < commElem.length; i++) {
    commElem[i].hidden = false;
  }

  document.getElementById("demo").hidden = false;

  socketId = h.uuidv4();
  damSocket.on("postauth", function (auth) {
    initPresence();
    metaData = new MetaData(root, room, socketId, metaDataReceived);
    damSocket.setMetaData(metaData);
    metaData.sendControlData({ username: username, sender: username, status: "online", audioMuted: audioMuted, videoMuted: videoMuted });

    console.log("Starting! you are", socketId);
    presence.update(username, socketId);

    if(SFU_ENABLED) {
      if (!video.joined) {
        video.enableVideo();
      }
    }

    // Initialize Session
    damSocket.out("subscribe", {
      room: room,
      socketId: socketId,
      name: username || socketId,
      sfu: SFU_ENABLED
    });


    //Do we do this here this is now triggered from DAM?
    damSocket.on('Subscribe', function (data) {
      if (data.sfu) {
        console.log("Starting SFU Subscribe");        
        damSocket.out("newUserStart", {
          to: data.socketId,
          sender: socketId,
          name: data.name || data.socketId,
          sfu: SFU_ENABLED
        });
        return;
      }

      console.log("Got channel subscribe", data);
      if (data.ts && Date.now() - data.ts > TIMEGAP * 2) {
        console.log("discarding old sub", data);
        return;
      }
      if (
        pcMap.get(data.socketId) !== undefined &&
        pcMap.get(data.socketId).connectionState == "connected"
      ) {
        console.log(
          "Existing peer subscribe, discarding...",
          pcMap.get(data.socketId)
        );
        return;
      }
      // Ignore self-generated subscribes
      if (data.socketId == socketId || data.sender == socketId) return;
      if (DEBUG) console.log("got subscribe!", data);

      if (data.to && data.to != socketId) return; // experimental on-to-one reinvite (handle only messages target to us)
      /* discard new user for connected parties? */
      if (
        pcMap.get(data.socketId) &&
        pcMap.get(data.socketId).iceConnectionState == "connected"
      ) {
        if (DEBUG) console.log("already connected to peer", data.socketId);
        //return;
      }
      // New Peer, setup peerConnection
      damSocket.out("newUserStart", {
        to: data.socketId,
        sender: socketId,
        name: data.name || data.socketId,
        sfu: SFU_ENABLED
      });
      // add info to grap, socketId label
      root.get('meething').get(room).get(socketId).put({label:socketId});
      // add person we are connecting to
      root.get('meething').get(room).get(socketId).get(data.socketId).put({label:data.name || data.socketId});
      ee.emit('graph:update');
      init(true, data.socketId);
    });

    damSocket.on('NewUserStart', function (data) {
      if (data.sfu) {
        console.log("Start SFU new user start");
        return;
      }
      if (data.ts && Date.now() - data.ts > TIMEGAP) return;
      if (data.socketId == socketId || data.sender == socketId) return;
      if (
        pcMap.get(data.sender) &&
        pcMap.get(data.sender).connectionState == "connected" &&
        pcMap.get(data.sender).iceConnectionState == "connected"
      ) {
        if (DEBUG) console.log("already connected to peer? bypass", data.socketId);
        return; // We don't need another round of Init for existing peers
      }

      init(false, data.sender);
    });

    damSocket.on('IceCandidates', function (data) {
      try {
        if (
          (data.ts && Date.now() - data.ts > TIMEGAP) ||
          !data.sender ||
          !data.to
        )
          return;
        if (DEBUG) console.log(
          data.sender.trim() + " is trying to connect with " + data.to.trim()
        );
        if (data.candidate && data.candidate.hasOwnProperty('candidate')) {
          if (!data.candidate.candidate) return; //Edge receiving BLANK candidates from STUN/TURN - ice fails if we pass it along to non-EDGE clients
        }
        data.candidate = new RTCIceCandidate(data.candidate);
        if (!data.candidate) return;
      } catch (e) {
        console.log(e, data);
        return;
      }
      if (data.socketId == socketId || data.to != socketId) return;
      if (DEBUG) console.log("ice candidate", data);
      //data.candidate ? pcMap.get(data.sender).addIceCandidate(new RTCIceCandidate(data.candidate)) : "";
      data.candidate ? pcMap.get(data.sender).addIceCandidate(data.candidate) : "";
    });

    damSocket.on('SDP', function (data) {
      try {
        if (data.ts && Date.now() - data.ts > TIMEGAP) return;
        if (
          !data ||
          data.socketId == socketId ||
          data.sender == socketId ||
          !data.description
        )
          return;
        if (data.to !== socketId) {
          if (DEBUG) console.log("not for us? dropping sdp");
          return;
        }
      } catch (e) {
        console.log(e, data);
        return;
      }

      if (data.description.type === "offer") {
        data.description
          ? pcMap.get(data.sender).setRemoteDescription(
            new RTCSessionDescription(data.description)
          )
          : "";

        h.getUserMedia()
          .then(async stream => {
            if (localVideo) h.setVideoSrc(localVideo, stream);

            //save my stream
            myStream = stream;

            stream.getTracks().forEach(track => {
              pcMap.get(data.sender).addTrack(track, stream);
            });

            let answer = await pcMap.get(data.sender).createAnswer();
            answer.sdp = setMediaBitrates(answer.sdp);
            // SDP Interop
            // if (navigator.mozGetUserMedia) answer = Interop.toUnifiedPlan(answer);
            // SDP Bitrate Hack
            // if (answer.sdp) answer.sdp = h.setMediaBitrate(answer.sdp, 'video', 500);

            await pcMap.get(data.sender).setLocalDescription(answer);

            damSocket.out("sdp", {
              description: pcMap.get(data.sender).localDescription,
              to: data.sender,
              sender: socketId
            });
          })
          .catch(async e => {
            console.error(`answer stream error: ${e}`);
            if (!enableHacks) {
              var r = confirm("No Media Devices! Join as Viewer?");
              if (r) {
                enableHacks = true;
                metaData.sendControlData({ username: username + "(readonly)", id: socketId, readonly: true });
              } else { location.replace("/"); return; }
            }
            // start crazy mode lets answer anyhow
            console.log(
              "no media devices! answering receive only"
            );
            var answerConstraints = {
              OfferToReceiveAudio: true,
              OfferToReceiveVideo: true
            };
            let answer = await pcMap.get(data.sender).createAnswer(answerConstraints);
            answer.sdp = setMediaBitrates(answer.sdp);
            // SDP Interop
            // if (navigator.mozGetUserMedia) answer = Interop.toUnifiedPlan(answer);
            await pcMap.get(data.sender).setLocalDescription(answer);

            damSocket.out("sdp", {
              description: pcMap.get(data.sender).localDescription,
              to: data.sender,
              sender: socketId
            });
            // end crazy mode
          });
      } else if (data.description.type === "answer") {
        pcMap.get(data.sender).setRemoteDescription(
          new RTCSessionDescription(data.description)
        );
      }
    });

    document.getElementById("chat-input").addEventListener("keypress", e => {
      if (e.which === 13 && e.target.value.trim()) {
        e.preventDefault();

        sendMsg(e.target.value);

        setTimeout(() => {
          e.target.value = "";
        }, 50);
      }
    });

    document.getElementById("toggle-video").addEventListener("click", e => {
      e.preventDefault();
      var muted = mutedStream ? mutedStream : h.getMutedStream();
      var mine = myStream ? myStream : muted;
      if (!mine) {
        return;
      }
      if (!videoMuted) {
        h.replaceVideoTrackForPeers(pcMap, muted.getVideoTracks()[0]).then(r => {
          videoMuted = true;
          h.setVideoSrc(localVideo, muted);
          e.srcElement.classList.remove("fa-video");
          e.srcElement.classList.add("fa-video-slash");
          h.showNotification("Video Disabled");
        });
      } else {
        h.replaceVideoTrackForPeers(pcMap, mine.getVideoTracks()[0]).then(r => {
          h.setVideoSrc(localVideo, mine);
          videoMuted = false;
          e.srcElement.classList.add("fa-video");
          e.srcElement.classList.remove("fa-video-slash");
          h.showNotification("Video Enabled");
        });
      }

    });

    document.getElementById("record-toggle").addEventListener("click", e => {
      e.preventDefault();

      if (!isRecording) {
        h.recordAudio();
        isRecording = true
        e.srcElement.classList.add("text-danger");
        e.srcElement.classList.remove("text-white");
        h.showNotification("Recording Started");

      } else {
        h.stopRecordAudio()
        isRecording = false
        e.srcElement.classList.add("text-white");
        e.srcElement.classList.remove("text-danger");
        h.showNotification("Recording Stopped");
      }
      metaData.sendNotificationData({ username: username, subEvent: "recording", isRecording: isRecording })
    });

    document.getElementById("toggle-mute").addEventListener("click", e => {
      e.preventDefault();
      var muted = mutedStream ? mutedStream : h.getMutedStream();
      var mine = myStream ? myStream : muted;
      if (!mine) {
        return;
      }
      if (!audioMuted) {
        h.replaceAudioTrackForPeers(pcMap, muted.getAudioTracks()[0]).then(r => {
          audioMuted = true;
          //localVideo.srcObject = muted; // TODO: Show voice muted icon on top of the video or something
          e.srcElement.classList.remove("fa-volume-up");
          e.srcElement.classList.add("fa-volume-mute");
          metaData.sendNotificationData({ username: username, subEvent: "mute", muted: audioMuted });
          h.showNotification("Audio Muted");
          myStream.getAudioTracks()[0].enabled = !audioMuted;
        });
      } else {
        h.replaceAudioTrackForPeers(pcMap, mine.getAudioTracks()[0]).then(r => {
          audioMuted = false;
          //localVideo.srcObject = mine;
          e.srcElement.classList.add("fa-volume-up");
          e.srcElement.classList.remove("fa-volume-mute");
          metaData.sendNotificationData({ username: username, subEvent: "mute", muted: audioMuted });
          h.showNotification("Audio Unmuted");
          myStream.getAudioTracks()[0].enabled = !audioMuted;
        });
      }

    });

    document.getElementById("toggle-invite").addEventListener("click", e => {
      e.preventDefault();
      //if (!myStream) return;
      if (DEBUG) console.log("Re-Send presence to all users...");
      var r = confirm("Re-Invite ALL room participants?");
      if (r == true) {
        damSocket.out("subscribe", {
          room: room,
          socketId: socketId,
          name: username || socketId,
          sfu: SFU_ENABLED
        });
      }
    });

    document
      .getElementById("toggle-screen")
      .addEventListener("click", async e => {
        e.preventDefault();
        if (screenStream) {
          screenStream.getTracks().forEach(t => {
            t.stop();
            t.onended();
          });
        } else {
          var stream = await h.getDisplayMedia({ audio: true, video: true });
          var atrack = stream.getAudioTracks()[0];
          var vtrack = stream.getVideoTracks()[0];
          if (false) h.replaceAudioTrackForPeers(pcMap, atrack); // TODO: decide somewhere whether to stream audio from DisplayMedia or not
          h.replaceVideoTrackForPeers(pcMap, vtrack);
          h.setVideoSrc(localVideo, stream);
          vtrack.onended = function (event) {
            if (DEBUG) console.log("Screensharing ended via the browser UI");
            screenStream = null;
            if (myStream) {
              h.setVideoSrc(localVideo, myStream);
              h.replaceStreamForPeers(pcMap, myStream);
            }
            e.srcElement.classList.remove("sharing");
            e.srcElement.classList.add("text-white");
            e.srcElement.classList.remove("text-black");
          };
          screenStream = stream;
          e.srcElement.classList.add("sharing");
          e.srcElement.classList.remove("text-white");
          e.srcElement.classList.add("text-black");
        }
      });

    document.getElementById("private-toggle").addEventListener("click", e => {
      e.preventDefault();
      // Detect if we are already in private mode
      let keys = Object.keys(presence.root._.opt.peers);
      if (keys.length == 0) {
        //if in private mode, go public
        presence.onGrid(presence.room);
        e.srcElement.classList.remove("fa-lock");
        e.srcElement.classList.add("fa-unlock");
        metaData.sendNotificationData({ username: username, subEvent: "grid", isOngrid: false })
      } else {
        //if public, go private
        metaData.sendNotificationData({ username: username, subEvent: "grid", isOngrid: true })
        presence.offGrid();
        e.srcElement.classList.remove("fa-unlock");
        e.srcElement.classList.add("fa-lock");
      }
    });
  });
}

function init(createOffer, partnerName) {
  // OLD: track peerconnections in array
  if (pcMap.has(partnerName)) return pcMap.get(partnerName);
  var pcPartnerName = new RTCPeerConnection(h.getIceServer());
  // DAM: replace with local map keeping tack of users/peerconnections
  pcMap.set(partnerName, pcPartnerName); // MAP Tracking
  h.addVideo(partnerName, false);

  //TODO: SET THE BELOW TRACK HANDLERS SOMEWHERE IN A BETTER PLACE!
  //TODO: KNOWN REGRESSION IN THIS BRANCH IS MUTING DOES NOT WORK!

  // Q&A: Should we use the existing myStream when available? Potential cause of issue and no-mute
  if (screenStream) {
    var tracks = {};
    tracks['audio'] = screenStream.getAudioTracks();
    tracks['video'] = screenStream.getVideoTracks();
    if (myStream) {
      tracks['audio'] = myStream.getAudioTracks(); //We want sounds from myStream if there is such
      if (!tracks.video.length) tracks['video'] = myStream.getVideoTracks(); //also if our screenStream is malformed, let's default to myStream in that case
    }
    ['audio', 'video'].map(tracklist => {
      tracks[tracklist].forEach(track => {
        pcPartnerName.addTrack(track, screenStream); //should trigger negotiationneeded event
      });
    });
  } else if (!screenStream && myStream) {
    var tracks = {};
    tracks['audio'] = myStream.getAudioTracks();
    tracks['video'] = myStream.getVideoTracks();
    if (audioMuted || videoMuted) {
      var mutedStream = mutedStream ? mutedStream : h.getMutedStream();
      if (videoMuted) tracks['video'] = mutedStream.getVideoTracks();
      if (audioMuted) tracks['audio'] = mutedStream.getAudioTracks();
    }
    ['audio', 'video'].map(tracklist => {
      tracks[tracklist].forEach(track => {
        pcPartnerName.addTrack(track, myStream); //should trigger negotiationneeded event
      });
    });
  } else {
    h.getUserMedia()
      .then(stream => {
        //save my stream
        myStream = stream;
        var mixstream = null;
        //provide access to window for debug
        if (h.canCreateMediaStream()) {
          mixstream = new MediaStream();
        } else {
          //Safari trickery
          mixstream = myStream.clone();
          mixstream.getTracks().forEach(track => {
            mixstream.removeTrack(track);
          });
        }
        window.myStream = myStream;
        window.mixstream = mixstream;
        var tracks = {};
        tracks['audio'] = myStream.getAudioTracks();
        tracks['video'] = myStream.getVideoTracks();
        if (audioMuted || videoMuted) {
          var mutedStream = mutedStream ? mutedStream : h.getMutedStream();
          if (videoMuted) tracks['video'] = mutedStream.getVideoTracks();
          if (audioMuted) tracks['audio'] = mutedStream.getAudioTracks();
        }
        ['audio', 'video'].map(tracklist => {
          tracks[tracklist].forEach(track => {
            mixstream.addTrack(track);
            pcPartnerName.addTrack(track, mixstream); //should trigger negotiationneeded event
          });
        });

        h.setVideoSrc(localVideo, mixstream);

        // SoundMeter for Local Stream
        if (myStream) {
          // Soundmeter
          if (DEBUG) console.log('Init Soundmeter.........');
          const soundMeter = new SoundMeter(function () {
            if (DEBUG) console.log('Imm Speaking! Sending metadata mesh focus...');
            if (!audioMuted) metaData.sendControlData({ username: username, id: socketId, talking: true });
          });
          soundMeter.connectToSource(myStream)
        }

      })
      .catch(async e => {
        console.error(`stream error: ${e}`);
        if (!enableHacks) return;
        // start crazy mode - lets offer anyway
        console.log("no media devices! offering receive only");
        var offerConstraints = {
          mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true }
        };
        let offer = await pcPartnerName.createOffer(offerConstraints);
        offer.sdp = setMediaBitrates(offer.sdp);
        // SDP Interop
        // if (navigator.mozGetUserMedia) offer = Interop.toUnifiedPlan(offer);
        await pcPartnerName.setLocalDescription(offer);
        damSocket.out("sdp", {
          description: pcPartnerName.localDescription,
          to: partnerName,
          sender: socketId
        });
        // end crazy mode
      });
  }

  //create offer
  if (createOffer) {
    pcPartnerName.onnegotiationneeded = async () => {
      try {
        if (pcPartnerName.isNegotiating) {
          console.log(
            "negotiation needed with existing state?",
            partnerName,
            pcPartnerName.isNegotiating,
            pcPartnerName.signalingState
          );
          return; // Chrome nested negotiation bug
        }
        pcPartnerName.isNegotiating = true;
        let offer = await pcPartnerName.createOffer();
        offer.sdp = setMediaBitrates(offer.sdp);
        // SDP Interop
        // if (navigator.mozGetUserMedia) offer = Interop.toUnifiedPlan(offer);
        // SDP Bitrate Hack
        // if (offer.sdp) offer.sdp = h.setMediaBitrate(offer.sdp, 'video', 500);

        await pcPartnerName.setLocalDescription(offer);
        damSocket.out("sdp", {
          description: pcPartnerName.localDescription,
          to: partnerName,
          sender: socketId
        });
      } finally {
        pcPartnerName.isNegotiating = false;
      }
    };
  }

  //send ice candidate to partnerNames
  pcPartnerName.onicecandidate = ({ candidate }) => {
    if (!candidate) return;
    damSocket.out("icecandidates", {
      candidate: candidate,
      to: partnerName,
      sender: socketId
    });
  };

  //add
  pcPartnerName.ontrack = e => {
    let str = e.streams[0];
    var el = document.getElementById(`${partnerName}-video`);
    if (el) {
      h.setVideoSrc(el, str);
    } else {
      var el = h.addVideo(partnerName);
      h.setVideoSrc(el, str);
    }
  };

  pcPartnerName.onconnectionstatechange = d => {
    console.log(
      "Connection State Change: " + partnerName,
      pcPartnerName.iceConnectionState
    );
    // Save State
    switch (pcPartnerName.iceConnectionState) {
      case "connected":
        sendMsg(
          partnerName + " is " + pcPartnerName.iceConnectionState,
          true
        );
        h.hideVideo(partnerName, false);
        metaData.sendControlData({ username: username, id: socketId, online: true });
        break;
      case "disconnected":
        if (partnerName == socketId) {
          return;
        }
        sendMsg(
          partnerName + " is " + pcPartnerName.iceConnectionState,
          true
        );
        h.closeVideo(partnerName);
        // PC Tracking cleanup
        pcMap.get(partnerName).close();
        pcMap.delete(partnerName);
        break;
      case "new":
        // h.hideVideo(partnerName, true);
        /* objserved when certain clients are stuck disconnecting/reconnecting - do we need to trigger a new candidate? */
        /* GC if state is stuck */
        break;
      case "failed":
        if (partnerName == socketId) {
          return;
        } // retry catch needed
        h.closeVideo(partnerName);
        // Send presence to attempt a reconnection
        damSocket.out("subscribe", {
          room: room,
          socketId: socketId,
          name: username || socketId,
          sfu: SFU_ENABLED
        });
        break;
      case "closed":
        h.closeVideo(partnerName);
        pcMap.get(partnerName).close();
        pcMap.delete(partnerName);
        break;
      default:
        console.log("Change of state: ", pcPartnerName.iceConnectionState);
        break;
    }
  };

  pcPartnerName.onsignalingstatechange = d => {
    console.log(
      "Signaling State Change: " + partnerName,
      pcPartnerName.signalingState
    );
    //h.hideVideo(pcPartnerName, pcPartnerName.isNegotiating);
    switch (pcPartnerName.signalingState) {
      case "have-local-offer":
        pcPartnerName.isNegotiating = true;
        setTimeout(function () {
          console.log('set GC for', partnerName);
          if (pcPartnerName.signalingState == "have-local-offer") {
            console.log('GC Stuck Peer ' + partnerName, pcPartnerName.signalingState);
            // pcMap.get(partnerName).close();
            h.closeVideo(partnerName);
          }
        }, 5000, pcPartnerName, partnerName);
        /* GC if state is stuck */
        break;
      case "stable":
        pcPartnerName.isNegotiating = false;
        break;
      case "closed":
        console.log("Signalling state is 'closed'");
        // Do we have a connection? If not kill the widget
        if (pcPartnerName.iceConnectionState !== "connected") {
          h.closeVideo(partnerName);
          pcMap.delete(partnerName);
        }
        // Peers go down here and there - let's send a Subscribe, Just in case...
        damSocket.out("subscribe", {
          room: room,
          socketId: socketId,
          name: username || socketId,
          sfu: SFU_ENABLED
        });
        break;
    }
  };
}

function calculateBitrate() {
  var oldBitrate = videoBitrate;
  switch (presence.users.size) {
    case 0:
    case 1:
    case 2:
      videoBitrate = "1000";
      break;
    case 3:
      videoBitrate = "750";
      break;
    case 4:
      videoBitrate = "500";
      break;
    default:
      videoBitrate = "250";
      break;
  }

  if (oldBitrate == videoBitrate) {
    return false;
  } else {
    sendMsg("Bitrate " + videoBitrate, true);
    return true;
  }
}

function setBitrate(count) {
  if (calculateBitrate()) {
    console.log("Adapt to " + count + " users");
    if ((adapter.browserDetails.browser === 'chrome' ||
      adapter.browserDetails.browser === 'safari' ||
      (adapter.browserDetails.browser === 'firefox' &&
        adapter.browserDetails.version >= 64)) &&
      'RTCRtpSender' in window &&
      'setParameters' in window.RTCRtpSender.prototype) {
      var bandwidth = videoBitrate;
      console.log("Setting bandwidth::" + bandwidth);
      pc.forEach((pc1, id) => {
        pc[pc1].getSenders().forEach((sender) => {
          if (sender.transport && sender.transport.state == "connected") {
            const parameters = sender.getParameters();
            if (!parameters.encodings) {
              parameters.encodings = [{}];
            }
            if (bandwidth === 'unlimited') {
              console.log("Removing bitrate setting");
              if (parameters.encodings[0]) {
                delete parameters.encodings[0].maxBitrate;
              }
            } else {
              if (parameters.encodings[0] !== undefined) {
                parameters.encodings[0].maxBitrate = bandwidth * 1000;
              }
            }
            sender.setParameters(parameters)
              .then(() => {
                console.log("Done setting Bandwidth to:" + bandwidth)
              })
              .catch(e => console.error(e));
          }
        })
      });
      return;
    }
  }
}

function setMediaBitrates(sdp) {
  if (videoBitrate == 'unlimited' || !calculateBitrate()) {
    console.log("Not changing bitrate max is set")
    return sdp;
  } else {
    return setMediaBitrate(setMediaBitrate(sdp, "video", videoBitrate), "audio", 50);
  }
}

function setMediaBitrate(sdp, media, bitrate) {
  var lines = sdp.split("\n");
  var line = -1;
  for (var i = 0; lines.length; i++) {
    if (lines[i].indexOf("m=" + media) === 0) {
      line = i;
      break;
    }
  }
  if (line === -1) {
    console.debug("Could not find the m line for", media);
    return sdp;
  }
  console.debug("Found the m line for", media, "at line", line);

  // Pass the m line
  line++;

  // Skip i and c lines
  while (lines[line].indexOf("i=") === 0 || lines[line].indexOf("c=") === 0) {
    line++;
  }

  // If we're on a b line, replace it
  if (lines[line].indexOf("b") === 0) {
    console.debug("Replaced b line at line", line);
    lines[line] = "b=AS:" + bitrate;
    return lines.join("\n");
  }

  // Add a new b line
  console.debug("Adding new b line before line", line);
  var newLines = lines.slice(0, line)
  newLines.push("b=AS:" + bitrate)
  newLines = newLines.concat(lines.slice(line, lines.length))
  return newLines.join("\n")
}
