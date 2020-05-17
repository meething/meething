import helpers from './helpers.js';
import EventEmitter from './ee.js';
let med = null;
window.addEventListener('DOMContentLoaded', () => {
    med = window.meething;
    console.log(med.modal);
    //When the chat icon is clicked
    document.querySelector('#toggle-chat-pane').addEventListener('click', (e) => {
        document.querySelector('#chat-pane').classList.toggle('chat-opened');
        //remove the 'New' badge on chat icon (if any) once chat is opened.
        setTimeout(() => {
            if (document.querySelector('#chat-pane').classList.contains('chat-opened')) {
                helpers.toggleChatNotificationBadge();
            }
        }, 300);
    });

    // Show/Hide user list
    document.getElementById("toggle-users").addEventListener("click", e => {
        e.preventDefault();
        var div = document.getElementById('mydiv');
        if (!div.style.display || div.style.display === 'block') div.style.display = 'none';
        else div.style.display = 'block';

        e.srcElement.classList.toggle("fa-user-plus");
        e.srcElement.classList.toggle("fa-user-minus");

    });

    document.getElementById("sam").addEventListener("click", e => {
        e.preventDefault();
        e.srcElement.classList.toggle("fa-volume-up");
        e.srcElement.classList.toggle("fa-volume-mute");
    })

    document.getElementById("svm").addEventListener("click", e => {
        e.preventDefault();
        e.srcElement.classList.toggle("fa-video");
        e.srcElement.classList.toggle("fa-video-slash");
        
    })

    document.getElementById("toggle-devices-menu").addEventListener("click", e => {
        e.preventDefault();
        document.getElementById("devices-menu").classList.toggle('device-select-open')

        e.srcElement.classList.toggle("fa-ellipsis-v");
        e.srcElement.classList.toggle("fa-ellipsis-h");

    })

    document.getElementById("toggle-main-menu").addEventListener("click", e => {
        e.preventDefault();
        let div = document.getElementById("top-menu");
        if (!div.style.display || div.style.display === 'block') div.style.display = 'none';
        else div.style.display = 'block';
        

        e.srcElement.classList.toggle("fa-ellipsis-h");
        e.srcElement.classList.toggle("fa-ellipsis-v");
    })

    document.getElementById("toggle-device-selection").addEventListener("click", e => {
      e.preventDefault();
      window.ee.emit('toggle-device-selection',e);
      document.getElementById("devices-selection").classList.toggle('speech-bubble-open');
        e.srcElement.classList.toggle("fa-video");
        e.srcElement.classList.toggle("fa-times");
    })
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
    /*MOVED TO rtc event emitter
    var em = window.ee;
    console.log(em,ee);
    if(em) em.on('tingle:load',function(content){
    console.log("we're here",content);
    //When the 'Create room" is button is clicked
    var cr = document.getElementById('create-room');
    if(cr)  cr.addEventListener('click', (e) => {
            e.preventDefault();

            let roomName = document.querySelector('#room-name').value;
            let yourName = document.querySelector('#your-name').value;

            if (roomName && yourName) {
                //remove error message, if any
                document.querySelector('#err-msg').innerHTML = "";

                //save the user's name in sessionStorage
                sessionStorage.setItem('username', yourName);

                //create room link
                let roomLink = `${location.origin}?room=${roomName.trim().replace(' ', '_')}_${helpers.generateRandomString()}`;

                //show message with link to room
                document.querySelector('#room-created').innerHTML = `Room successfully created. Click <a href='${roomLink}'>here</a> to enter room. 
                    Share the <a href='${roomLink}'>room link</a> with your partners.`;

                // add room name to chat title
                document.querySelector('#chat-title').innerHTML = roomName;

                //empty the values
                document.querySelector('#room-name').value = '';
                document.querySelector('#your-name').value = '';
            }

            else {
                document.querySelector('#err-msg').innerHTML = "All fields are required";
            }
        });

        var er = document.getElementById('enter-room');
        if(cr)  document.getElementById('enter-room').addEventListener('click', (e) => {
            e.preventDefault();

            let name = document.querySelector('#username').value;

            if (name) {
                //remove error message, if any
                document.querySelector('#err-msg-username').innerHTML = "";

                //save the user's name in sessionStorage
                sessionStorage.setItem('username', name);

                //reload room
                location.reload();
            }

            else {
                document.querySelector('#err-msg-username').innerHTML = "Please input your name";
            }
        });
       
    }); */
})