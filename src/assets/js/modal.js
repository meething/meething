export default class Modal {
  constructor (mediator) {
    this.mediator = mediator;
    this.modal;
  }
  // function that creates the modal and then renders it
  createModal () {
    this.modal = new tingle.modal({
      closeMethods: [],
      footer: true,
      stickyFooter: true,
      onOpen:function(){
        let setupBtn = document.getElementById('tingleSetupBtn');
        if(setupBtn){
          let deviceSelection = document.getElementById('deviceSelection');
          let preview = document.getElementById('preview');
          let local = document.getElementById('local');
          if(this.mediator.h.isOldEdge() || !this.mediator.autoload){
            setupBtn.addEventListener('click',function(e){
              e.preventDefault();
              setupBtn.hidden = true;
              if(deviceSelection.hidden) {
                deviceSelection.hidden=false;
                resetDevices();
                this.filledModal(modal);
              }
            })
          } else {
            setupBtn.hidden = true;
            resetDevices();
            this.filledModal(modal);
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
              if (roomName && yourName) {
                  //remove error message, if any
                  var errmsg = document.querySelector('#err-msg');
                  if(errmsg) document.querySelector('#err-msg').innerHTML = "";

                  //save the user's name in sessionStorage
                  sessionStorage.setItem('username', yourName);
                  //create room link
                  let roomgen = `${roomName.trim().replace(' ', '_')}_${this.mediator.h.generateRandomString()}`;
                  let roomLink = `${location.origin}?room=${roomgen}`;
                  room = roomgen;
                  username = yourName;
                  cr.hidden=true;
                  if(romp) {
                    roompass=romp;
                    await storePass(romp,yourName);
                  }
                  //show message with link to room
                  document.querySelector('#room-created').innerHTML = `Room successfully created. Share the <a id="clipMe" style="background:lightgrey;font-family:Helvetica,sans-serif;padding:3px;color:grey" href='${roomLink}' title="Click to copy">room link</a>  with your partners.`;
                  var clip = document.getElementById('clipMe');
                  if(clip) clip.addEventListener('click',function(e){
                    e.preventDefault();
                    this.mediator.h.copyToClipboard(e.target.href);
                    if(errmsg) {
                      errmsg.innerHTML='Link copied to clipboard '+roomLink;
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
    if(toggleModal) toggleModal.addEventListener('click',e=>{
      e.preventDefault();
      modal.open();
    })
    var modalContent="";
    var errmsg = '<span class="form-text small text-danger" id="err-msg"></span>';
    var cammicsetc =
    this.mediator.h.isOldEdge() || !this.mediator.autoload
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

  }

  // function to call after modal has been created
  filledModal (modal) {
    let type = modal.__type;
    setTimeout(function(){ modal.checkOverflow() },300);
    var letsgo = document.querySelectorAll('.letsgo');
    if(!letsgo.length){

      modal.addFooterBtn("Let's Go !  <i class='fas fa-chevron-right'></i>", 'tingle-btn tingle-btn--primary letsgo tingle-btn--pull-right', function(e){
        try { mutedStream = this.mediator.h.getMutedStream(); } catch(err){ console.warn("error in getting mutedstream",err); }
        ee.emit(type+':ok',{modal,e});
      });
    }
  }
}
