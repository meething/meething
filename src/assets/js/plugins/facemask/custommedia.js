const getUserMediaFn = MediaDevices.prototype.getUserMedia;
let model, worker;

MediaDevices.prototype.getUserMedia = async function () {
    arguments[0].video.width = { max: 480 };
    const stream = await getUserMediaFn.call(navigator.mediaDevices, ...arguments);
    await tf.setBackend('wasm');
    var vs = document.getElementById('localStream');
    const video = document.createElement('video');
    video.id = "local_video";
    video.autoplay = true;
    video.muted = true;
    video.hidden = true;
    video.width = video.videoWidth;
    video.height = video.videoHeight;
    video.srcObject = stream;
    await video.play();

    vs.appendChild(video);

    var canvas = document.createElement('canvas')
    canvas.id = "output";
    canvas.style.transform = "scale(0.01)";
    vs.appendChild(canvas);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    var offscreen = canvas.transferControlToOffscreen();
    worker = new Worker("/assets/js/plugins/facemask/offscreencanvas.js");
    worker.postMessage({ canvas: offscreen }, [offscreen]);
    worker.postMessage([INITIAL_FACE]);

    var newStream = new MediaStream();
    newStream.addTrack(stream.getAudioTracks()[0]);
    newStream.addTrack(canvas.captureStream(24).getVideoTracks()[0]);

    model = await facemesh.load();
    renderPrediction();

    return newStream;
}

const renderPrediction = async () => {
    const predictions = await model.estimateFaces(document.getElementById("local_video"));
    if (predictions !== undefined && predictions.length > 0) {
        // out("face", predictions[0].annotations);
        worker.postMessage([predictions[0].annotations]);//Local use debug
        window.ee.emit("face-moving", { left: Math.floor(predictions[0].boundingBox.topLeft[0][0])}) // set the left position
        window.ee.emit("middle-face", { coordinates: predictions[0].annotations.midwayBetweenEyes })
    }
    requestAnimationFrame(renderPrediction);
};