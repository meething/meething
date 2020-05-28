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
    
    // GRID: Load/Unload custom CSS classes (Chrome Only?)
    document.getElementById("toggle-grid-stage").addEventListener("click", e => {
        e.preventDefault();
        document.getElementById("grid-stage-css").disabled = !document.getElementById("grid-stage-css").disabled;
        if (med.DEBUG) console.log("Local Grid Stage changed", !document.getElementById("grid-stage-css").disabled);
    });
    

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
        e.srcElement.classList.toggle("fa-user-plus");
        e.srcElement.classList.toggle("fa-user-minus");
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
