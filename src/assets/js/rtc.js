/**
 * @author Amir Sanni <amirsanni@gmail.com>
 * @date 6th January, 2020
 */
import h from './helpers.js';
import users from './users.js';
var TIMEGAP = 2000;
var STATE = { media: {}, users: {} };

window.gunState = function(){
  console.log(STATE);
}

users.getMe();
users.getAllUser();

window.addEventListener('load', ()=>{
    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');

    if(!room){
        document.querySelector('#room-create').attributes.removeNamedItem('hidden');
    }

    else if(!username){
        document.querySelector('#username-set').attributes.removeNamedItem('hidden');
    }

    else{
      let commElem = document.getElementsByClassName('room-comm');
      
      for(let i = 0; i < commElem.length; i++){
            commElem[i].attributes.removeNamedItem('hidden');
      }

      var pc = []; // hold local peerconnection statuses
      var peers = ['https://gunmeetingserver.herokuapp.com/gun'];
      var opt = { peers: peers, localStorage: false, radisk: false };
      var socket = Gun(opt).get('rtcmeeting').get(room).get('socket');
      var users = Gun(opt).get('rtcmeeting').get(room).get("users");

      // Custom Emit Function
      socket.emit = function(key,value){
        if((value.sender && value.to)&&value.sender==value.to) return;
        console.log('debug emit key',key,'value',value);
        if(!key||!value) return;
        if (!value.ts) value.ts = Date.now();
        if(key=="sdp"||key=="icecandidates") value = JSON.stringify(value);
        socket.get(key).put(value);
      }
      window.GUN = { socket: socket, users: users };

      var socketId = h.uuidv4();
      var myStream = '';
      
      console.log('Starting! you are',socketId);
      
      // users.get(socketId).put({name: name, status: null, peers: [] })

	    // Initialize Session
      socket.emit('subscribe', {
                room: room,
                socketId: socketId,
		            name: username || socketId
      });

      socket.get('subscribe').on(function(data,key){
        if(data.ts && (Date.now() - data.ts) > TIMEGAP) return;
        //users.get('subscribers').get(data.socketId).put({name:data.name, status: false});        
        if(pc[data.socketId] !== undefined) {
          return;
        }
        if(data.socketId == socketId || data.sender == socketId) return;
        console.log('got subscribe!',data);
        socket.emit('newuser', {socketId:data.socketId});
      });

      socket.get('newuser').on(function(data,key){
        if(data.ts && (Date.now() - data.ts) > TIMEGAP) return;
              if(data.socketId == socketId || data.sender == socketId) return;
                    socket.emit('newUserStart', {to:data.socketId, sender:socketId, name:data.name||data.socketId});
                    pc.push(data.socketId);
                    init(true, data.socketId);
      });

      socket.get('newUserStart').on(function(data,key){
        if(data.ts && (Date.now() - data.ts) > TIMEGAP) return;
              if(data.socketId == socketId || data.sender == socketId) return;
                    pc.push(data.sender);
                    init(false, data.sender);
      });

      socket.get('icecandidates').on(function(data,key){
        try {
          data = JSON.parse(data);
          console.log(data.sender.trim() + " is trying to connect with " + data.to.trim())      
          if(data.ts && (Date.now() - data.ts) > TIMEGAP) return;
          data.candidate = new RTCIceCandidate(data.candidate);
          if (!data.candidate) return;
        } catch(e){ console.log(e); return; };
              if(data.socketId == socketId || data.to != socketId) return;
              console.log('ice candidate',data);
              data.candidate ? pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
      });

      socket.get('sdp').on(function(data,key){
        try {
          data = JSON.parse(data);
          if(data.ts && (Date.now() - data.ts) > TIMEGAP) return;
                if(!data || data.socketId == socketId || data.sender == socketId || !data.description ) return;
          if(data.to !== socketId) {
            console.log('not for us? dropping sdp');
            return;
          }
        } catch(e) { console.log(e); return; }

                    if(data.description.type === 'offer'){
                        data.description ? pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

                        h.getUserMedia().then(async (stream)=>{
                            if(!document.getElementById('local').srcObject){
                                document.getElementById('local').srcObject = stream;
                            }

                            //save my stream
                            myStream = stream;

                            stream.getTracks().forEach((track)=>{
                                pc[data.sender].addTrack(track, stream);
                            });

                            let answer = await pc[data.sender].createAnswer();
                            pc[data.sender].setLocalDescription(answer);

                            socket.emit('sdp', {description:pc[data.sender].localDescription, to:data.sender, sender:socketId});
                        }).catch((e)=>{
                            console.error(e);
                        });
                    }

                    else if(data.description.type === 'answer'){
                        pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                    }
      });

      socket.get('chat').on(function(data,key){
          if(data.ts && (Date.now() - data.ts) > TIMEGAP) return;
          if(data.socketId == socketId || data.sender == socketId) return;
          if(data.sender == username) return;
          console.log('got chat',key,data);
          h.addChat(data, 'remote');
      })

        function sendMsg(msg,local){
            let data = {
                room: room,
                msg: msg,
                sender: username
            };

            //emit chat message
            if(!local) socket.emit('chat', data);
            //add localchat
            h.addChat(data, 'local');
        }



        function init(createOffer, partnerName){
            pc[partnerName] = new RTCPeerConnection(h.getIceServer());
            h.getUserMedia().then((stream)=>{
                //save my stream
                myStream = stream;

                stream.getTracks().forEach((track)=>{
                    pc[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
                });

                document.getElementById('local').srcObject = stream;
            }).catch((e)=>{
                console.error(`stream error: ${e}`);
            });



            //create offer
            if(createOffer){
                pc[partnerName].onnegotiationneeded = async ()=>{
                    let offer = await pc[partnerName].createOffer();
                    await pc[partnerName].setLocalDescription(offer);
                    socket.emit('sdp', {description:pc[partnerName].localDescription, to:partnerName, sender:socketId});
                };
            }

            //send ice candidate to partnerNames
            pc[partnerName].onicecandidate = ({candidate})=>{
		            if (!candidate) return;
                socket.emit('icecandidates', {candidate: candidate, to:partnerName, sender:socketId});
            };

            //add
            pc[partnerName].ontrack = (e)=>{
                let str = e.streams[0];
                if(document.getElementById(`${partnerName}-video`)){
                    document.getElementById(`${partnerName}-video`).srcObject = str;
                    //When the video frame is clicked. This will enable picture-in-picture
                    document.getElementById(`${partnerName}-video`).addEventListener('click', ()=>{
                        if (!document.pictureInPictureElement) {
                            document.getElementById(`${partnerName}-video`).requestPictureInPicture()
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

                else{
                    //video elem
                    let newVid = document.createElement('video');
                    newVid.id = `${partnerName}-video`;            
                    newVid.srcObject = str;
                    newVid.autoplay = true;
                    newVid.className = 'remote-video';
                    
                    // Video user title
                    var vtitle = document.createElement("p");
                    var vuser = partnerName;
                    vtitle.innerHTML = `<center>${vuser}</center>`;
                    vtitle.id = `${partnerName}-title`

                    //create a new div for card
                    let cardDiv = document.createElement('div');
                    cardDiv.className = 'card mb-3';
		                cardDiv.style = "color:#FFF;";
                    cardDiv.appendChild(newVid);
                    cardDiv.appendChild(vtitle);
                    
                    //create a new div for everything
                    let div = document.createElement('div');
                    div.className = 'col-sm-12 col-md-6';
                    div.id = partnerName;
                    div.appendChild(cardDiv);
                    
                    //put div in videos elem
                    document.getElementById('videos').appendChild(div);

                }
            };



            pc[partnerName].onconnectionstatechange = (d)=>{
                console.log("Connection State Change:" + pc[partnerName], pc[partnerName].iceConnectionState);
                // Save State
                STATE.media[pc[partnerName]] = pc[partnerName].iceConnectionState;
                switch(pc[partnerName].iceConnectionState){
                    case 'connected':
                        sendMsg(partnerName+" is "+STATE.media[pc[partnerName]],true);
                        break;
                    case 'disconnected':
                        sendMsg(partnerName+" is "+STATE.media[pc[partnerName]],true);
                        h.closeVideo(partnerName);
                        break;
                    case 'failed':
                        h.closeVideo(partnerName);
                        break;
                    case 'closed':
                        h.closeVideo(partnerName);
                        break;
                  default:
                      console.log("Unknown state?",pc[partnerName].iceConnectionState)
                      break;
                }
            };


            pc[partnerName].onsignalingstatechange = (d)=>{
                console.log("Signaling State Change:" + pc[partnerName], pc[partnerName].signalingState);
                switch(pc[partnerName].signalingState){
                    case 'closed':
                        console.log("Signalling state is 'closed'");
                        h.closeVideo(partnerName);
                        break;
                }
            };
        }


        document.getElementById('chat-input').addEventListener('keypress', (e)=>{
            if(e.which === 13 && (e.target.value.trim())){
                e.preventDefault();
                
                sendMsg(e.target.value);

                setTimeout(()=>{
                    e.target.value = '';
                }, 50);
            }
        });


        document.getElementById('toggle-video').addEventListener('click', (e)=>{
            e.preventDefault();
            if(!myStream) return;
            myStream.getVideoTracks()[0].enabled = !(myStream.getVideoTracks()[0].enabled);

            //toggle video icon
            e.srcElement.classList.toggle('fa-video');
            e.srcElement.classList.toggle('fa-video-slash');
        });


        document.getElementById('toggle-mute').addEventListener('click', (e)=>{
            e.preventDefault();
            if(!myStream) return;

            myStream.getVideoTracks()[0].enabled = !(myStream.getVideoTracks()[0].enabled);

            //toggle audio icon
            e.srcElement.classList.toggle('fa-volume-up');
            e.srcElement.classList.toggle('fa-volume-mute');
        });
    }
});