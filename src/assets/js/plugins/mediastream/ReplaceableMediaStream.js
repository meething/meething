'use strict';

async function init(debug) {
    if (debug) {
        debugLog = function (debugstring) {
            console.log(debugstring)
        }
    }

    let localStream;
    let pc1;
    let pc2;
    const offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };

    let silence = () => {
        let ctx = new AudioContext(), oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    }

    let blackSilence = (...args) => new MediaStream([black(...args), silence()]);

    await start();
    await call();


    async function start() {
        debugLog('Requesting local stream');
        try {
            const stream = blackSilence();// await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            debugLog('Received local stream');
            localStream = stream;
        } catch (e) {
            alert(`getUserMedia() error: ${e.name}`);
        }
    }

    async function call() {
        debugLog('Starting call');
        const videoTracks = localStream.getVideoTracks();
        const audioTracks = localStream.getAudioTracks();
        if (videoTracks.length > 0) {
            debugLog(`Using video device: ${videoTracks[0].label}`);
        }
        if (audioTracks.length > 0) {
            debugLog(`Using audio device: ${audioTracks[0].label}`);
        }
        const configuration = {};
        debugLog('RTCPeerConnection configuration:', configuration);
        pc1 = new RTCPeerConnection(configuration);
        debugLog('Created local peer connection object pc1');
        pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
        pc2 = new RTCPeerConnection(configuration);
        debugLog('Created remote peer connection object pc2');
        pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
        pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));
        pc2.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc2, e));
        pc2.addEventListener('track', gotRemoteStream);

        localStream.getTracks().forEach(track => {
            if (track.kind == "video") {
                MediaStream.prototype.videoSender = pc1.addTrack(track, localStream)
            } else if (track.kind == "audio") {
                MediaStream.prototype.audioSender = pc1.addTrack(track, localStream)
            } else {
                pc1.addTrack(track, localStream)
            }
        });
        debugLog('Added local stream to pc1');

        try {
            debugLog('pc1 createOffer start');
            const offer = await pc1.createOffer(offerOptions);
            await onCreateOfferSuccess(offer);
        } catch (e) {
            onCreateSessionDescriptionError(e);
        }
    }

    function onCreateSessionDescriptionError(error) {
        debugLog(`Failed to create session description: ${error.toString()}`);
    }

    async function onCreateOfferSuccess(desc) {
        debugLog(`Offer from pc1\n${desc.sdp}`);
        debugLog('pc1 setLocalDescription start');
        try {
            await pc1.setLocalDescription(desc);
            onSetLocalSuccess(pc1);
        } catch (e) {
            onSetSessionDescriptionError();
        }

        debugLog('pc2 setRemoteDescription start');
        try {
            await pc2.setRemoteDescription(desc);
            onSetRemoteSuccess(pc2);
        } catch (e) {
            onSetSessionDescriptionError();
        }

        debugLog('pc2 createAnswer start');
        try {
            const answer = await pc2.createAnswer();
            await onCreateAnswerSuccess(answer);
        } catch (e) {
            onCreateSessionDescriptionError(e);
        }
    }

    function onSetLocalSuccess(pc) {
        debugLog(`${getName(pc)} setLocalDescription complete`);
    }

    function onSetRemoteSuccess(pc) {
        debugLog(`${getName(pc)} setRemoteDescription complete`);
    }

    function onSetSessionDescriptionError(error) {
        debugLog(`Failed to set session description: ${error.toString()}`);
    }

    function gotRemoteStream(e) {
        if (MediaStream.prototype.remoteStream !== e.streams[0]) {
            MediaStream.prototype.remoteStream = e.streams[0];
            debugLog('pc2 received remote stream');
        }
    }

    async function onCreateAnswerSuccess(desc) {
        debugLog(`Answer from pc2:\n${desc.sdp}`);
        debugLog('pc2 setLocalDescription start');
        try {
            await pc2.setLocalDescription(desc);
            onSetLocalSuccess(pc2);
        } catch (e) {
            onSetSessionDescriptionError(e);
        }
        debugLog('pc1 setRemoteDescription start');
        try {
            await pc1.setRemoteDescription(desc);
            onSetRemoteSuccess(pc1);
        } catch (e) {
            onSetSessionDescriptionError(e);
        }
    }

    async function onIceCandidate(pc, event) {
        try {
            await (getOtherPc(pc).addIceCandidate(event.candidate));
            onAddIceCandidateSuccess(pc);
        } catch (e) {
            onAddIceCandidateError(pc, e);
        }
        debugLog(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
    }

    function onAddIceCandidateSuccess(pc) {
        debugLog(`${getName(pc)} addIceCandidate success`);
    }

    function onAddIceCandidateError(pc, error) {
        debugLog(`${getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
    }

    function onIceStateChange(pc, event) {
        if (pc) {
            debugLog(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
            debugLog('ICE state change event: ', event);
        }
    }

    function getName(pc) {
        return (pc === pc1) ? 'pc1' : 'pc2';
    }

    function getOtherPc(pc) {
        return (pc === pc1) ? pc2 : pc1;
    }

    function debugLog(debugstring) { }
}

MediaStream.prototype.constructor = init();

MediaStream.prototype.replaceVideoTrack = function (track) {
    this.videoSender.replaceTrack(track);
}

MediaStream.prototype.replaceAudioTrack = function (track) {
    this.audioSender.replaceTrack(track);
}

