import helpers from './helpers.js';
import EventEmitter from './ee.js';
let med = null;
window.addEventListener('DOMContentLoaded', () => {
    // set mediator
    med = window.meething;
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
      med.ee.emit('toggle-device-selection',e); //fire EventEmitter
 
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
})
