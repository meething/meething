
/*
* Module for injecting html elements on other modules
* To define html elements inside modal.js
*/

export var lib = (() => {
let errmsg = '<span class="form-text small text-danger" id="err-msg"></span>';
let settingmsg = `<small class="text-white m-4 text-center" style="width:100%;" id="setting-msg">Select your audio and video devices</small>`;
var joinnameinput = `<label for="username">Your Name</label><input type="text" id="username" class="form-control rounded-0" placeholder="Your Name" required/>`;
var createnameinput = `<label for="your-name">Your Name</label> <input type="text" id="your-name" class="form-control rounded-0" placeholder="Your Name" required/>`;
var passwinput = `<label for="room-pass">Room password</label> <input id="room-pass" class="form-control rounded-0" type="password" autocomplete="new-password" placeholder="Password (optional)" />`;
var roominput = `<label for="room-name">Room Name</label><input type="text" id="room-name" class="form-control rounded-0" placeholder="Room Name" required/> `;
var roomcreatebtn = `<button id="create-room" class="btn btn-block rounded-0 btn-info">Create Room</button>`
var roomcreated = `<div id="room-created"></div>`;
let cammicsetc = (settingmsg,isoldedge,autoload) => {
return isoldedge || autoload
? ` <div class="p-container" id="deviceSelection" hidden>
<div id="" class="preview-container">
<div class="row">
  <div class="col-md-12 mx-auto">
<video id="local" class="mx-auto" playsinline autoplay muted></video>
</div>
  <div class="preview-video-buttons row col-md-12">
  <div class="col m-1 mb-3 mx-auto">
    <button id="sam" class="fa fa-volume-up mx-auto shadow" title="Mute/Unmute Audio"></button>
    </div>
    <div class="col m-1 mb-3 mx-auto">
    <button id="svm" class="fa fa-video mx-auto shadow" title="Mute/Unmute Video"></button>
    </div>
</div>
</div>
</div>
  <div id="devicesSelection">
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
`;}
let roometusername = (room, username, passwinput, title, camisset) => {
  return `
<div class="container-fluid">
  <button id='toggle-device-selection' class='fas fa-sliders-h btn btn-circle '></button>
  <div class="row">
    <div class="col-md-4 speech-bubble mx-auto" id='devices-selection'>
      ${camisset}
      </div>
<div class="col-md-4 mt-4 mx-auto text-white">

<div class='mx-auto text-center mb-4'>
<img src='https://camo.githubusercontent.com/057efe39855e1a06d6c7f264c4545fc435954717/68747470733a2f2f692e696d6775722e636f6d2f585337396654432e706e67' width='150' style='filter:invert(1);'  id="meethlogo"/>

</div>
<h4 class="speech-msg">Welcome back, <input type="hidden" id="username" value="${username}"/>${username}! </h4>
<p>You're joining room: <input type="hidden" id="room-name" value="${room}"/> ${title} </p>
<br/>${passwinput}<br/></br>
</div>
</div>
</div>`; }
let roometnusername = (room, joinnameinput, passwinput, title, camisset) => {
  return `<div class="container-fluid">
<button id='toggle-device-selection' class='fas fa-sliders-h btn btn-circle '></button>
  <div class='row'>
    <div class='col-md-4 speech-bubble mx-auto' id='devices-selection'>
      ${camisset}
    </div>
  <div class="col-md-4 mt-4 mx-auto room-form">
  <div class='mx-auto text-center mb-4'>
  <img src='https://camo.githubusercontent.com/057efe39855e1a06d6c7f264c4545fc435954717/68747470733a2f2f692e696d6775722e636f6d2f585337396654432e706e67' width='200' style='filter:invert(1); opacity:.5' id="meethlogo" />
</div>
  <h4 class="speech-msg">
  Welcome, you're joining room <input type="hidden" id="room-name" value="${room}"/> ${title}</h4>
    <p>
    Please enter your username and set up your camera options! </p>
    <br/>
    ${joinnameinput} <br/>
    ${passwinput} <br/>
    </div>
   </div>
  </div>
  `; }
  let nroometusername = (username, passwinput, roominput, camisset) => {
    return `
  <div class="container-fluid">
    <button id='toggle-device-selection' class='fas fa-sliders-h btn btn-circle '></button>
    <div class='row'>
      <div class='col-md-4 speech-bubble mx-auto' id='devices-selection'>
        ${camisset}
      </div>
      <div class='col-md-4 mt-4 mx-auto room-form'>
        <div class='mx-auto text-center mb-4'>
        
          <img src='https://camo.githubusercontent.com/057efe39855e1a06d6c7f264c4545fc435954717/68747470733a2f2f692e696d6775722e636f6d2f585337396654432e706e67' width='200' style='filter:invert(1); opacity:.5' id="meethlogo"/>
        </div>
      <h4 class='speech-msg'>
      Welcome back, <input type='hidden' id='username' value='${username}'/>${username}</h4>
      <p>
      Please enter the room name you want to join or create below! </p>
      <br/>
    ${roominput}<br/>
    ${passwinput}<br/>
      </div>
  </div>
</div>`;}
let nroometnusername = (camisset, roomcreated, errmsg, createnameinput, roomcreatebtn) =>{
  return `
<div class="container-fluid">
<button id='toggle-device-selection' class='fas fa-sliders-h btn btn-circle '></button>
<div class='row'>
  <div class='col-md-4 speech-bubble mx-auto' id='devices-selection'>
    ${camisset}
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
  `;}
  let roomgen = (room, rand ) => `${room.trim().replace(' ', '_')}_${rand}`;
  let roomLink = (location, roomgen) => `${location}?room=${roomgen}`;
  var copyLink = roomLink => `Room successfully created. Share the
<a id="clipMe" href='${roomLink}' title="Click to copy">
  room link</a>  with your partners.`;
 return {
   errmsg, 
   settingmsg, 
   cammicsetc, 
   joinnameinput, 
   createnameinput, 
   passwinput, 
   roomcreatebtn, 
   roomcreated, 
   roometusername,
   roometnusername,
   nroometusername,
   nroometnusername,
   roomgen,
   roomLink,
   copyLink
 }

})()