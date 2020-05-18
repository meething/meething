var med = null;
var _modal = null;
let self;

export default class Modal {
  constructor (mediator) {
    this.mediator = mediator;
    med = this.mediator;
    this.ee = med.ee;
    self = this;
    return this;
  }
  // function that creates the modal and then renders it
  createModal () {
    med.room = med.h.getQString(location.href, "room") ? med.h.getQString(location.href, "room") : "";
    med.username = sessionStorage && sessionStorage.getItem("username") ? sessionStorage.getItem("username") : "";
    med.title = med.room.replace(/(_.*)/, '');
    if (med.title && document.getElementById('chat-title')) document.getElementById('chat-title').innerHTML = med.title;
    //initSocket(); // letting socket start for now
    _modal = new tingle.modal({
      closeMethods: [],
      footer: true,
      stickyFooter: false,
      onOpen: self.tingleOnOpen
    });
    
    this._modal = _modal; //remove this later

    var toggleModal = document.getElementById('toggle-modal');

    if(toggleModal) toggleModal.addEventListener('click',e=>{
      e.preventDefault();
      _modal.open();
    })

    var modalContent = "";
    var errmsg = '<span class="form-text small text-danger" id="err-msg"></span>';
    var settingmsg = `<small class="text-white m-4 text-center" style="width:100%;" id="setting-msg">Select your audio and video devices</small>`;
    var cammicsetc =
      med.h.isOldEdge() || !med.autoload
        ? `
        <div class="p-container" id="deviceSelection" hidden>
      <div id="" class="preview-container">
        <div class="row">

          <div class="col-md-12 mx-auto">
      <video id="local" class="mx-auto" playsinline autoplay muted></video>
       </div>

          <div class="preview-video-buttons row col-md-12">
          <div class="col m-1 mb-3 mx-auto">
          <button id="toggle-devices-menu" class="fas fa-ellipsis-v mx-auto"></button>

          </div>
          <div class="col m-1 mb-3 mx-auto">
            <button id="sam" class="fa fa-volume-up mx-auto" title="Mute/Unmute Audio">
            </button>

            </div>
            <div class="col m-1 mb-3 mx-auto">
            <button id="svm" class="fa fa-video mx-auto" title="Mute/Unmute Video">

            </button>

            </div>
        </div>
        </div>

      </div>


          <div id="devicesSelection">


            <div class="form-row device-select" id="devices-menu" style="display: none;">

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
        </div>
        <div class="col m-1 mb-3 mx-auto">
        <button id="svm" class="fa fa-video mx-auto" title="Mute/Unmute Video">
        </button>

        </div>
    </div>
    <div class="col m-1 mb-3 mx-auto d-inline">
    ${settingmsg}<button id="toggle-devices-menu" class="btn btn-sm fas fa-ellipsis-v mx-auto text-white"></button>

    </div>
    </div>

  </div>

  <button class="form-control rounded-0" id="tingleSetupBtn" hidden>Set up your devices</button>

      <div id="deviceSelection">

        <div class="form-row device-select" id="devices-menu">

          <div class="col-md-12 mb-3">
           <label for="as" class="text-white">Mic:</label>
             <select id="as" class="form-control btn-sm rounded-0"></select>
           </div>

         <div class="col-md-12 mb-3">
              <label for="ao" class="text-white">Speakers: </label>
                <select id="ao" class="form-control btn-sm rounded-0"></select>
             </div>

        <div class="col-md-12 mb-3">
                <label for="vs" class="text-white">Camera:</label>
              <select id="vs" class="form-control btn-sm rounded-0"></select>
            </div>
        </div>
      </div>
      </div>

    `;

    med.h.getDevices().then(devices=>{
      med.devices = devices;
      devices = window.devices = devices;
      self.navigatorGotDevices(devices);
    });
    this.ee.on('toggle-device-selection',function(event){
      var el = document.getElementById('deviceSelection');
      if(el) el.hidden=false;
      self.resetDevices();
      self.modalFilled(_modal);
    })
    // default inputs
    var joinnameinput = `<label for="username">Your Name</label><input type="text" id="username" class="form-control rounded-0" placeholder="Your Name" required/>`;
    var createnameinput = `<label for="your-name">Your Name</label> <input type="text" id="your-name" class="form-control rounded-0" placeholder="Your Name" required/>`;
    var passwinput = `<label for="room-pass">Room password</label> <input id="room-pass" class="form-control rounded-0" type="password" autocomplete="new-password" placeholder="Password (optional)" />`;
    var roominput = `<label for="room-name">Room Name</label><input type="text" id="room-name" class="form-control rounded-0" placeholder="Room Name" required/> `;
    // @TODO disable roomcreate button when errors
    var roomcreatebtn = `<button id="create-room" class="btn btn-block rounded-0 btn-info">Create Room</button>`
    var roomcreated = `<div id="room-created"></div>`;

    if(med.room && med.username){
      // Welcome back xX!
      modalContent = `
      <div class="container-fluid">
        <button id='toggle-device-selection' class='fas fa-sliders-h btn btn-circle '></button>
        <div class="row">
          <div class="col-md-4 speech-bubble mx-auto" id='devices-selection'>
            ${cammicsetc}
            </div>
      <div class="col-md-4 mt-4 mx-auto text-white">
      <div class='mx-auto text-center mb-4'>
      <img src='https://camo.githubusercontent.com/057efe39855e1a06d6c7f264c4545fc435954717/68747470733a2f2f692e696d6775722e636f6d2f585337396654432e706e67' width='150' style='filter:invert(1);'  id="meethlogo"/>
   </div>
      <h4 class="speech-msg">Welcome back, <input type="hidden" id="username" value="${med.username}"/>${med.username}! </h4>
      <p>You're joining room: <input type="hidden" id="room-name" value="${med.room}"/> ${med.title} </p>
      <br/>${passwinput}<br/></br>
      </div>
      </div>
      </div>`;
      self.loadModal(_modal,modalContent,'join');
      return this;
    } else if(med.room && !med.username){
      // set username and camera options
      // when is room created
      modalContent =
      `
      <div class="container-fluid">
    <button id='toggle-device-selection' class='fas fa-sliders-h btn btn-circle '></button>
      <div class='row'>
        <div class='col-md-4 speech-bubble mx-auto' id='devices-selection'>
          ${cammicsetc}
        </div>
      <div class="col-md-4 mt-4 mx-auto room-form">
      <div class='mx-auto text-center mb-4'>
      <img src='https://camo.githubusercontent.com/057efe39855e1a06d6c7f264c4545fc435954717/68747470733a2f2f692e696d6775722e636f6d2f585337396654432e706e67' width='200' style='filter:invert(1); opacity:.5' id="meethlogo" />
   </div>
      <h4 class="speech-msg">
      Welcome, you're joining room <input type="hidden" id="room-name" value="${med.room}"/> ${med.title}</h4>
        <p>
        Please enter your username and set up your camera options! </p>
        <br/>
        ${joinnameinput} <br/>
        ${passwinput} <br/>

        </div>
       </div>
      </div>
      `;
      self.loadModal(_modal,modalContent,'nouser');
      return this;
    } else if (!med.room && med.username) {

      // enter room name to join
      modalContent = `
    <div class="container-fluid">
      <button id='toggle-device-selection' class='fas fa-sliders-h btn btn-circle '></button>
      <div class='row'>
        <div class='col-md-4 speech-bubble mx-auto' id='devices-selection'>
          ${cammicsetc}
        </div>
        <div class='col-md-4 mt-4 mx-auto room-form'>
          <div class='mx-auto text-center mb-4'>
            <img src='https://camo.githubusercontent.com/057efe39855e1a06d6c7f264c4545fc435954717/68747470733a2f2f692e696d6775722e636f6d2f585337396654432e706e67' width='200' style='filter:invert(1); opacity:.5' id="meethlogo"/>
          </div>
        <h4 class='speech-msg'>
        Welcome back, <input type='hidden' id='username' value='${med.username}'/>${med.username}</h4>
        <p>
        Please enter the room name you want to join or create below! </p>
        <br/>
      ${roominput}<br/>
      ${passwinput}<br/>
        </div>
    </div>
  </div>`;


      self.loadModal(_modal,modalContent,'noroom');
      return this;
    }else {
      // Set up a new room
      modalContent = `
      <div class="container-fluid">
      <button id='toggle-device-selection' class='fas fa-sliders-h btn btn-circle '></button>
      <div class='row'>
        <div class='col-md-4 speech-bubble mx-auto' id='devices-selection'>
          ${cammicsetc}
        </div>
        <div class='col-md-4 mx-auto mt-5 room-form'>
          <div class='mx-auto text-center mb-4'>
            <img src='https://camo.githubusercontent.com/057efe39855e1a06d6c7f264c4545fc435954717/68747470733a2f2f692e696d6775722e636f6d2f585337396654432e706e67' width='200' style='filter:invert(1); opacity:.5' id="meethlogo"/>
         </div>
         <p>${roomcreated}</p>
          ${errmsg}<br>
          ${createnameinput}<br>
          ${roominput}<br>
          ${passwinput}<br>
          <br>
          ${roomcreatebtn}
         </div>
        </div>
        </div>
        `

      self.loadModal(_modal, modalContent, 'setup');
      return this;
    }

  }

  tingleOnOpen () {
    let setupBtn = document.getElementById('tingleSetupBtn');
    if(setupBtn){
      let deviceSelection = document.getElementById('deviceSelection');
      let preview = document.getElementById('preview');
      let local = document.getElementById('local');
      if(med.h.isOldEdge() || !med.autoload){
        setupBtn.addEventListener('click',function(e){
          e.preventDefault();
          setupBtn.hidden = true;
          if(deviceSelection.hidden) {
            deviceSelection.hidden=false;
            self.resetDevices();
            self.modalFilled(_modal);
          }
        })
      } else {
        setupBtn.hidden = true;
        self.resetDevices();
        self.modalFilled(_modal);
      }
      if(preview && local) {
        preview.appendChild(local);
        local.className = "";
      }
    }
    var cr = document.getElementById('create-room');
    if(cr)  cr.addEventListener('click', async (e) => {
              e.preventDefault();
              let roomName = document.querySelector('#room-name').value;
              let yourName = document.querySelector('#your-name').value;
              let romp = document.querySelector('#room-pass').value;
              let fb = document.querySelector('.tingle-modal-box__footer');
              if (roomName && yourName) {
                //remove error message, if any
                var errmsg = document.querySelector('#err-msg');
                if (errmsg) document.querySelector('#err-msg').innerHTML = "";

                //save the user's name in sessionStorage
                sessionStorage.setItem('username', yourName);
                //create room link
                let roomgen = `${roomName.trim().replace(' ', '_')}_${med.h.generateRandomString()}`;
                let roomLink = `${location.origin}?room=${roomgen}`;
                var copyLink = `Room successfully created. Share the
                <a id="clipMe" href='${roomLink}' title="Click to copy">
                room link</a>  with your partners.`
                //
                med.room = roomgen;
                med.username = yourName;
                cr.hidden = true;
                fb.style.display = 'flex';
                if (romp) {
                  med.roompass = romp;
                  await med.storePass(romp, yourName);
                }
                //show message with link to room
                document.getElementById('meethlogo').style.width = '150px'
                document.querySelector('#room-created').innerHTML = copyLink;
                var clip = document.getElementById('clipMe');
                if (clip) clip.addEventListener('click', function (e) {
                  e.preventDefault();
                  med.h.copyToClipboard(e.target.href);
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

  // function to call after modal has been created
  modalFilled (modal) {
    let cr = document.getElementById('create-room')
    if(!cr) document.querySelector('.tingle-modal-box__footer').style.display='flex';
    let type = modal.__type;
    setTimeout(function(){ modal.checkOverflow() }, 300);
    var letsgo = document.querySelectorAll('.letsgo');
    if(!letsgo.length){

      modal.addFooterBtn("Let's Go !  <i class='fas fa-chevron-right'></i>", 'tingle-btn tingle-btn--primary letsgo tingle-btn--pull-right', function(e){
        try { med.mutedStream = med.h.getMutedStream(); } catch(err){ console.warn("error in getting mutedstream",err); }
        self.handleOk({type,modal,e});

      });
    }
  }

  resetDevices() { //looks like this should be UI??
    var as = document.getElementById('as');
    var ao = document.getElementById('ao');
    var vs = document.getElementById('vs');
    var ve = document.getElementById('local');
    if(ve) med.localVideo=ve;
    if (med.myStream) {
      med.myStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    if(!med.h.canSelectAudioDevices()) { //Firefox springs to mind ;(
      ao.disabled = true;
      ao.readonly = true;
    }
    // TODO : move this listener out of this function
    var aoListener = function(e){
      return med.h.setAudioToVideo(ao,ve);
    }
    ao.removeEventListener('change',aoListener);
    ao.addEventListener('change',aoListener)
    as.removeEventListener('change',self.resetDevices);
    as.addEventListener('change',self.resetDevices);
    vs.removeEventListener('change',self.resetDevices);
    vs.addEventListener('change',self.resetDevices);
    // TODO : move this listener out of this function
    var clicked = function clicked(e){
      var p = med.setSS('config['+e.target.id+']',!!self.checked)
    };
    sam.removeEventListener('click',clicked);
    svm.removeEventListener('click',clicked);
    sam.addEventListener('click',clicked);
    svm.addEventListener('click',clicked);
    const asv = as.value;
    const vsv = vs.value;
    const samv = sam.checked;
    const svmv = svm.checked;
    const constraints = {
      audio: {deviceId: asv ? {exact: asv} : undefined},
      video: {deviceId: vsv ? {exact: vsv} : undefined}
    };
    med.h.getUserMedia(constraints).then(async stream=>{
      med.myStream = stream;
      window.myStream = stream;
      med.h.setVideoSrc(ve,stream);
      med.h.replaceStreamForPeers(med.pcMap, stream);
      ve.oncanplay = function(){ _modal.checkOverflow(); }
      med.initComm();
      return Object.keys(devices).length>0 ? devices : med.h.getDevices();
    }).then(devices=>{
      self.navigatorGotDevices(devices);
    }).catch(err=>{
      console.warn('something fishy in devices',err);
    });

  }

  cancelFn (why) {
    med.room=''; //if we null here we might ruin other stuff
    sessionStorage.clear();
    why.modal.close();
    window.location = '/';
  }

  loadModal (modal, createOrJoin, type){
    Object.assign(modal,{ __type: type});
    modal.setContent(`${createOrJoin}`);
    modal.addFooterBtn(`<i class='fas fa-times'></i> Reset`, 'tingle-btn tingle-btn--default tingle-btn--pull-left', function(e){
      try { med.mutedStream = med.mutedStream ? med.mutedStream : med.h.getMutedStream(); } catch(err){ console.warn("error in getting mutedstream",err); }
      self.cancelFn({modal, e});
    });
    modal.open();
    var sB = document.getElementById('tingleSetupBtn');
    if(sB && !med.autoload) { console.log("clicked It", self.simulateClick(sB))}
    self.modalFilled(_modal);
    return this;
  }

  navigatorGotDevices (devices) {
    this.ee.emit('navigator:gotDevices',devices);
      if(med.DEBUG){console.log('hello',devices);}
      ["as","ao","vs"].map(function(group){
        let devs = devices[group];
        var str = "";
        var qs = document.getElementById(group);
        med.h.each(devs,function(label,device){
          if(med.DEBUG){console.log(label,device);}
          var opt = document.getElementById(label.replace(/[^a-zA-Z0-9]/g,''));
          if(!opt) {
            opt = document.createElement('option');
            opt.id= label.replace(/[^a-zA-Z0-9]/g,'');
          }
          opt.value = device.deviceId;
          opt.text = label;
          if(qs) qs.appendChild(opt);
        });
        _modal.checkOverflow();
      });
      return this;
  }

  async handleOk (info) {
    document.querySelector('.tingle-modal-box__footer').style.display='flex';
    // switch instead of multiple types
    switch (info.type) {
      case 'join':
        var _username = document.querySelector('#username') ? document.querySelector('#username') : sessionStorage.getItem('username') ? {value: sessionStorage.getItem('username')} : false;
        var _pass = document.querySelector('#room-pass');
        if(!_username || !_username.value) return;
        if (_username && _username.value) {
          sessionStorage.setItem('username', _username.value);
        }
        if (med.room && history.pushState) {
          window.history.pushState(null,'','?room='+med.room);
        }
        var pval = _pass && _pass.value ? _pass.value : false;
        if(pval) await med.storePass(pval);
        break;
      case 'setup':
        var _username = document.querySelector('#your-name');
        var _room = document.querySelector('#room-name');
        var _pass = document.querySelector('#room-pass');
        if(!_username || !_username.value || !_room  || !_room.value) {
          document.querySelector('#err-msg').innerHTML = "Room and username fields are required";
          return;
        }
        if (_username && _username.value) {
          sessionStorage.setItem('username', _username.value);
        }
        if (_room && _room.value && history.pushState) {
          window.history.pushState(null,'','?room='+_room.value);
          med.room = _room.value;
        }
        var pval = _pass && _pass.value ? _pass.value : false;
        if(pval) await med.storePass(pval, _username.value);
        break;
      case 'nouser':
        var _username = document.querySelector('#username');
        var _pass = document.querySelector('#room-pass');
        if (!_username || !_username.value) { return; }
        if (_username && _username.value) {
          sessionStorage.setItem('username', _username.value);
        }
        if (med.room && history.pushState) {
          window.history.pushState(null,'','?room='+med.room);
        }
        var pval = _pass && _pass.value ? _pass.value : false;
        if(pval) await med.storePass(pval);
        break;
      case 'noroom':
        var _name = document.querySelector('#room-name');
        var _pass = document.querySelector('#room-pass');
        if (_name && _name.value) {
          let roomgen = `${_name.value.trim().replace(' ', '_')}_${med.h.generateRandomString()}`;
          med.room = roomgen;
        }

        if (med.room && history.pushState) {
          window.history.pushState(null,'','?room='+med.room);
        }
        var pval = _pass && _pass.value ? _pass.value : false;
        if(pval) await med.storePass(pval);
        break;
    }
    // stuff that is common
    if(!med.myStream){ 
      await this.resetDevices();
    }
    var ve = document.getElementById('local');
    var vs = document.getElementById('localStream');
    if(ve && vs){
      ve.className="local-video clipped";
      vs.appendChild(ve);
    }
    med.initSocket().then(sock=>{
      info.modal.close();
    })
    return this;
  }
  /* if autoload is false we need to simulate a click */

  simulateClick (el) {

    var defaultOptions = {
      pointerX: 0,
      pointerY: 0,
      button: 0,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      bubbles: true,
      cancelable: true
    }

    var eventType = "click";
    //var eventName = "MouseEvents";

    if (document.createEvent)
    {
        var oEvent = new CustomEvent(eventType, defaultOptions);
        el.dispatchEvent(oEvent);
        return true;
    } else {
      console.log('your Browser kind of sucks')
      return false;
    }
  }
////////
}
