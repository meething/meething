import {lib} from './lib.js';

var med = null;
var self = null;

/*
* Module for manipulating the UI/UX.
* To replace events.js, capture and emit into event emitter all the UI
* events we could encounter.
* User Eenterface eXperience @jacovinus May 2020
*/

export default class UEX {
  constructor (mediator) {
    this.mediator = mediator;
    med = this.mediator;
    self = this;
    return this;
  }

  initialRegister() {

    /* What follows is a long list of events previously
    *  found in events.js.
    *  They are decoupled and also trigger events
    *  into the app scope for modules to listen to
    *  via med.ee
    */
/*
    // GRID: Load/Unload custom CSS classes (Chrome Only?)
    document.getElementById("toggle-grid-stage").addEventListener("click", e => {
        e.preventDefault();
        document.getElementById("grid-stage-css").disabled = !document.getElementById("grid-stage-css").disabled;
        if (med.DEBUG) console.log("Local Grid Stage changed", !document.getElementById("grid-stage-css").disabled);
    });
*/
    // CHAT: Open and Close Chat
    document.querySelector('#toggle-chat-pane').addEventListener('click', (e) => {
        document.querySelector('#chat-pane').classList.toggle('chat-opened');
        med.ee.emit('uex:ChatPaneToggle', e);
        //remove the 'New' badge on chat icon (if any) once chat is opened.
        setTimeout(() => {
            if (document.querySelector('#chat-pane').classList.contains('chat-opened')) {
                med.h.toggleChatNotificationBadge();
            }
        }, 300);
    });

    // CHAT: On enter, emit to chat
    document.querySelector('#chat-input').addEventListener('keydown', (e)=>{
      let val = document.querySelector('#chat-input').value;
      var chatcont = document.getElementById('chat-messages');
      if(val !==''){
        if(e.key == 'Enter') {
          // assemble the chat message
          let chatMessage = {
            sender: med.username,
            msg: val
          };
          med.chat.broadcast(chatMessage);
          chatcont.scrollBy(0,80 * chatcont.childElementCount)
          document.querySelector('#chat-input').value = '';
          document.querySelector('#chat-input').blur();
        }
      }
    });
    // CHAT: On button, emit to chat
    document.querySelector('#chat-send').addEventListener('click', (e)=>{
        let val = document.querySelector('#chat-input').value;
        var chatcont = document.getElementById('chat-messages');
        // assemble the chat message
        if(val!==''){
          let chatMessage = {
            sender: med.username,
            msg: val
          };
          med.chat.broadcast(chatMessage);
          chatcont.scrollBy(0,80 * chatcont.childElementCount)
          document.querySelector('#chat-input').value = '';
          document.querySelector('#chat-input').blur();
        }

    });

    // Show / Hide User List
    document.getElementById("toggle-users").addEventListener("click", e => {
        e.preventDefault();
        var div = document.getElementById('mydiv');
        if (!div.style.display || div.style.display === 'block') div.style.display = 'none';
        else div.style.display = 'block';

        med.ee.emit('uex:UserListToggle', e);
    });

    // Toggle Main Menu
    document.getElementById("toggle-main-menu").addEventListener("click", e => {
        e.preventDefault();
        let div = document.getElementById("top-menu");
        if (!div.style.display || div.style.display === 'block') div.style.display = 'none';
        else div.style.display = 'block';
        e.srcElement.classList.toggle("fa-ellipsis-h");
        e.srcElement.classList.toggle("fa-ellipsis-v");
        med.ee.emit('uex:MainMenuToggle', e);
    });

    // picture in picture button on local
    med.ee.on('connection:VideoLoaded', function() {
      //When the video frame is clicked. This will enable picture-in-picture
      if ("pictureInPictureEnabled" in document
        && typeof document.getElementById('local').requestPictureInPicture === 'function' )
        {
          document.getElementById('local').addEventListener('click', () => {
              if (!document.pictureInPictureElement) {
                  document.getElementById('local').requestPictureInPicture()
                      .catch(error => {
                          // Video failed to enter Picture-in-Picture mode.
                          console.error(error);
                      });
              }

              else {
                  document.exitPictureInPicture()
                      .catch(error => {
                          // Video failed to leave Picture-in-Picture mode.
                          console.error(error);
                      });
              }
          });
        }
    });

    // options: we got the mediaStream

    med.ee.on('media:Got MediaStream', function(stream) {
      var local = document.querySelector('#local');
      if(local) {
        var _stream = med.myStream;
        if(med.DEBUG) console.log(_stream,med.h.typeOf(_stream))
        if(_stream && med.h.typeOf(_stream) == "mediastream") {
          local.srcObject =_stream;
          local.play().then().catch((err)=>{console.warn(err);}); //not working in ios
        }
      }
    });

    // options: got deviceList and set it on preview

    med.currentVideoDevice = '';
    med.currentAudioDevice = '';

    med.ee.on('media:Got DeviceList', async function() {
      med.videoDevices['Muted Video'] = {deviceId:false, label:'Mute Video'};
      med.videoDevices['Avatar Lego'] = {deviceId:"avatar-lego", label:'Lego'};
      med.videoDevices['Avatar Boy'] = {deviceId:"avatar-boy", label:'Boy'};
      med.videoDevices['Avatar Girl'] = {deviceId:"avatar-girl", label:'Girl'};
      med.videoDevices['Avatar Blathers'] = {deviceId:"avatar-blathers", label:'Blathers'};
      med.videoDevices['Avatar Tom Nook'] = {deviceId:"avatar-tom-nook", label:'Tom Nook'};
      med.videoDevices['VR Video'] = {deviceId:"vr-video", label:'VR Video'};

      var propsV = Object.keys(med.videoDevices);
      for(let i=0; i < propsV.length; i++) {
        console.log(med.videoDevices[propsV[i]].deviceId + "::" + med.videoDevices[propsV[i]].label);
        if(i == 0) {
          // add last item in array to prev of first
          med.videoDevices[propsV[i]].prev = med.videoDevices[propsV[propsV.length-1]];
          if(propsV[i+1] !== undefined) {
            med.videoDevices[propsV[i]].next = med.videoDevices[propsV[i+1]];
          }
          // we don't currently have a currentVideoDevice
          if(med.currentVideoDevice == '') {
            med.currentVideoDevice = med.videoDevices[propsV[i]];
            document.querySelector('#currentVideoDevice').innerText = med.videoDevices[propsV[i]].label;
          }
          // if it's the last not the first
        } else if (i == propsV.length-1 ) {
          med.videoDevices[propsV[i]].next = med.videoDevices[propsV[0]];
          if(propsV[i-1] !== undefined) {
            med.videoDevices[propsV[i]].prev = med.videoDevices[propsV[i-1]];
          }
        }
        // if it's also the last item
        if(i == propsV.length-1) {
          med.videoDevices[propsV[i]].next = med.videoDevices[propsV[0]];
          if(propsV[i-1] !== undefined) {
            med.videoDevices[propsV[i]].prev = med.videoDevices[propsV[i-1]];
          }
        } else {
          med.videoDevices[propsV[i]].next = med.videoDevices[propsV[i+1]];
          if(propsV[i-1] !== undefined) {
            med.videoDevices[propsV[i]].prev = med.videoDevices[propsV[i-1]];
          }
        }
      }
      // set device to list
      med.audioDevices['Muted Audio'] = {deviceId:false, label:'Mute Audio'};
      var propsA = Object.keys(med.audioDevices);
      for(let y=0; y < propsA.length; y++) {
        console.log(med.audioDevices[propsA[y]].deviceId + "::" + med.audioDevices[propsA[y]].label);
        if(y == 0) {
          // add last item in array to prev of first
          med.audioDevices[propsA[y]].prev = med.audioDevices[propsA[propsA.length-1]];
          if(propsA[y+1] !== undefined) {
            med.audioDevices[propsA[y]].next = med.audioDevices[propsA[y+1]];
          }
          // we don't currently have a currentVideoDevice
          if(med.currentAudioDevice == '') {
            med.currentAudioDevice = med.audioDevices[propsA[y]];
            document.querySelector('#currentAudioDevice').innerText = med.audioDevices[propsA[y]].label;
          }
          // if it's the last not the first
        } else if (y == propsA.length-1 ) {
          med.audioDevices[propsA[y]].next = med.audioDevices[propsA[0]];
          if(propsA[y-1] !== undefined) {
            med.audioDevices[propsA[y]].prev = med.audioDevices[propsA[y-1]];
          }
        }
        // if it's also the last item
        if(y == propsA.length-1) {
          med.audioDevices[propsA[y]].next = med.audioDevices[propsA[0]];
          if(propsA[y-1] !== undefined) {
            med.audioDevices[propsA[y]].prev = med.audioDevices[propsA[y-1]];
          }
        } else {
          med.audioDevices[propsA[y]].next = med.audioDevices[propsA[y+1]];
          if(propsA[y-1] !== undefined) {
            med.audioDevices[propsA[y]].prev = med.audioDevices[propsA[y-1]];
          }
        }
      }

      //await med.getMediaStream(med.currentVideoDevice.deviceId, med.currentAudioDevice.deviceId)
    });

    /* options : navigating through cameras */

    document.querySelector('#nextCam').addEventListener('click', async function (ev) {
      med.currentVideoDevice = med.currentVideoDevice.next;
      await med.getMediaStream(med.currentVideoDevice.deviceId, med.currentAudioDevice.deviceId);
      document.querySelector('#currentVideoDevice').innerText = med.currentVideoDevice.label;
    });

    document.querySelector('#prevCam').addEventListener('click', async function (ev) {
      med.currentVideoDevice = med.currentVideoDevice.prev;
      await med.getMediaStream(med.currentVideoDevice.deviceId, med.currentAudioDevice.deviceId);
      document.querySelector('#currentVideoDevice').innerText = med.currentVideoDevice.label;
    });

    /* options: navigating through microphones */

    document.querySelector('#nextAudio').addEventListener('click', async function (ev) {
      med.currentAudioDevice = med.currentAudioDevice.next;
      await med.getMediaStream(med.currentVideoDevice.deviceId, med.currentAudioDevice.deviceId);
      document.querySelector('#currentAudioDevice').innerText = med.currentAudioDevice.label;
    });

    document.querySelector('#prevAudio').addEventListener('click', async function (ev) {
      med.currentAudioDevice = med.currentAudioDevice.prev;
      await med.getMediaStream(med.currentVideoDevice.deviceId, med.currentAudioDevice.deviceId);
      document.querySelector('#currentAudioDevice').innerText = med.currentAudioDevice.label;
    });

    // options: password on / off

    document.querySelector('#password').addEventListener( 'change', function(ev) {
      if(this.checked) {
          document.querySelector('#pass').removeAttribute("hidden");
      } else {
          document.querySelector('#pass').setAttribute("hidden", "");
      }
    });

    // options: clear button

    document.querySelector('#clear').addEventListener('click', function (ev) {
      //remove sessionStorage
      sessionStorage.clear()
      med.room = '';
      med.username = '';
      window.location = '/';
      if(document.querySelector('#username')){document.querySelector('#username').setAttribute('value', '')}
      if(document.querySelector('#username')){document.querySelector('#roomname').setAttribute('value', '')}
      if(document.querySelector('#pass')){document.querySelector('#pass').setAttribute('value', '')}
    });

    // options: slide out options

    document.querySelector('#options-button').addEventListener('click', function(ev) {
      var opt = document.querySelector('#options');
      opt.classList.toggle('out')
    });


    // options: go button pushed
    document.querySelector('#randomGo').addEventListener('click', async function (ev) {
      // When go is pushed, we get the values from the form and adjust accordingly
      // get username, if empty make an random one
      med.username = document.querySelector('#username').value || window.chance.name();
      sessionStorage.setItem('username', med.username);
      // get roomname, if empty make an random one
      med.room = document.querySelector('#roomname').value || window.chance.city().trim() + "-" + window.chance.first().trim() + "-" + window.chance.city().trim();
      sessionStorage.setItem('roomname', med.room);
      window.history.pushState(null,'',`?room=${med.room}&mesh=${med.mesh}`);

      // if password option is on
      let _pass = document.querySelector('#pass');

      if(document.querySelector('#password').checked && _pass.value !== "") {
        var pval = _pass && _pass.value ? _pass.value : false;
        if(pval) await med.storePass(pval);
      } else if (document.querySelector('#password').checked){
        // get password, if empty alert that it is empty
        alert('Password must be filled in')
        return;
      }
      // otherwise ignore
      // hide the options
      if(document.querySelector('#inputs')){document.querySelector('#inputs').setAttribute("hidden","");}
      if(document.querySelector('#title')){document.querySelector('#title').setAttribute("hidden","");}
      if(document.querySelector('#selfview')){document.querySelector('#selfview').setAttribute("hidden","");}
      if(document.querySelector('#options')){document.querySelector('#options').setAttribute("hidden","");}
      if(document.querySelector('#options')){document.querySelector('#options').setAttribute("class","floating-1 out");}
      if(!med.myStream){
        await self.resetDevices();
      }
      var ve = document.getElementById('local');
      med.localVideo = ve;
      var vs = document.getElementById('localStream');
      if(ve && vs){
        ve.className="local-video clipped";
        vs.appendChild(ve);
        med.ee.emit("local-video-loaded");
      }
      med.socket = await med.initSocket();
      med.initComm();
    });

    // options: show options or hide options from room

    self.optShown = false;

    document.querySelector('#toggle-modal').addEventListener('click', function(ev){
      // TODO: disable Mesh selection in options?
      if(!self.optShown) {
        if(document.querySelector('#selfview')){document.querySelector('#selfview').removeAttribute("hidden");}
        if(document.querySelector('#options')){document.querySelector('#options').removeAttribute("hidden");}
        self.optShown = true;
        var ve = document.getElementById('local');
        med.localVideo = ve;
        var el = document.getElementById('selfview');
        document.querySelector("#top-menu").style.display = 'none'
        document.querySelector("#toggle-ok-option").style.display = "inline-block"
        if(ve && el){
          ve.className="";
          el.appendChild(ve);
        }
      } else {
        if(document.querySelector('#selfview')){document.querySelector('#selfview').setAttribute("hidden","");}
        if(document.querySelector('#options')){document.querySelector('#options').setAttribute("hidden","");}
        var ve = document.getElementById('local');
        document.querySelector("#toggle-ok-option").style.display = 'none';
        med.localVideo = ve;
        var vs = document.getElementById('localStream');
        if(ve && vs){
          ve.className="local-video clipped";
          vs.appendChild(ve);
          med.ee.emit("local-video-loaded");
        }
        self.optShown = false;
      }
    });
    document.querySelector("#toggle-ok-option").addEventListener("click",function(){
      document.querySelector("#toggle-ok-option").style.display = 'none';
     if(document.querySelector('#selfview')){document.querySelector('#selfview').setAttribute("hidden","");}
     if(document.querySelector('#options')){document.querySelector('#options').setAttribute("hidden","");}
     var ve = document.getElementById('local');
     med.localVideo = ve;
     var vs = document.getElementById('localStream');
     if(ve && vs){
       ve.className="local-video clipped";
       vs.appendChild(ve);
       med.ee.emit("local-video-loaded");
     }

    })

  }



  /* Since some of the buttons we care about don't exist until modal
  *  is created. We call this to register the buttons after creation
  */

  afterModalRegister () {
    // Audio Mute / Unmute Button Pressed
    document.getElementById("sam").addEventListener("click", e => {
        e.preventDefault();
        e.srcElement.classList.toggle("fa-volume-up");
        e.srcElement.classList.toggle("fa-volume-mute");
        med.ee.emit('uex:AudioMuteToggle', e);
    });

    // Video Mute / Unmute Button Pressed
    document.getElementById("svm").addEventListener("click", e => {
        e.preventDefault();
        e.srcElement.classList.toggle("fa-video");
        e.srcElement.classList.toggle("fa-video-slash");
        med.ee.emit('uex:VideoMuteToggle', e);
    });

    // Toggle Device Selection
    document.getElementById("toggle-device-selection").addEventListener("click", e => {
      e.preventDefault();
      if(event.target.classList.contains("fa-sliders-h")) {
        e.state = "open";
      } else {
        e.state = "closed";
      }
      document.getElementById("devices-selection").classList.toggle('speech-bubble-open');
      e.srcElement.classList.toggle("fa-sliders-h");
      e.srcElement.classList.toggle("fa-times");
      med.ee.emit('toggle-device-selection', e);
    });

  }
////
}
