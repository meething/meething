import { appEvents as app } from '/assets/js/app.js';
import buttons from './buttons.js';

app.on("load_ui", loadUI);
app.on("incoming_peer", handleIncomingPeer);

var localTracks;
var remoteTracks

function loadUI() {
    localTracks = document.getElementById("js-local-tracks");
    remoteTracks = document.getElementById("js-remote-tracks");
    buttons.loadButtons(app);
}

function handleIncomingPeer(consumer) {
    console.log("Incoming " + consumer._appData.peerId + " " + consumer._id + " " + consumer._producerId);
    var video = document.getElementById(consumer._appData.peerId);
    if (video == undefined) {
        const el = document.createElement("video");
        el.id = consumer._appData.peerId;
        el.srcObject = new MediaStream([consumer._track]);
        el.setAttribute("data-peer-id", consumer._appData.peerId);
        el.setAttribute("data-search-id", consumer._id);
        el.width = 200;
        el.height = 200;
        el.playsInline = true;
        el.play();

        remoteTracks.append(el);
    } else {
        video.srcObject.addTrack(consumer._track);
    }
}
