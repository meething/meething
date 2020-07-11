let scripts = new Map()
scripts.set('tf', "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.1")
scripts.set('bodypix', "https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.0.5")

let net = null;
let continueAnimation = false;
let animationId = null;
var worker;

async function loadScripts() {
    scripts.forEach(function (value, key, map) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = value;
        script.async = false;
        if (key == "bodypix") {
            script.addEventListener('load', function () {
                loadBodyPix();
            });
        }
        document.getElementsByTagName('head')[0].appendChild(script);
    });
}

async function loadBodyPix() {
    this.net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.50,
        quantBytes: 2
    });
    console.log("loaded");
}

const getUserMediaBackground = MediaDevices.prototype.getUserMedia;

MediaDevices.prototype.getUserMedia = async function () {
    if (worker !== undefined) {
        worker.terminate();
        delete worker;
    }

    if (arguments[0].video.deviceId == undefined || arguments[0].video.deviceId.ideal !== "vr-video") {
        return await getUserMediaBackground.call(navigator.mediaDevices, ...arguments);
    }

    var vs = document.getElementById('local');
    vs.poster = "https://media.giphy.com/media/wqzktGaaBDEF9TpCyK/giphy.gif"

    arguments[0].video.width = { max: 640 };
    if (window.bodyPix == undefined) {
        loadScripts()
    }
    const stream = await getUserMediaBackground.call(navigator.mediaDevices, ...arguments);

    var vs = document.getElementById('localStream');
    const video = document.createElement('video');
    video.id = "vr_video";
    video.autoplay = true;
    video.muted = true;
    video.hidden = true;
    video.srcObject = stream;
    await video.play();

    video.width = video.videoWidth;
    video.height = video.videoHeight;

    vs.appendChild(video);

    var canvas = document.createElement('canvas')
    canvas.id = "output";
    canvas.style.transform = "scale(0.01)";
    vs.appendChild(canvas);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;


    var offscreen = canvas.transferControlToOffscreen();
    worker = new Worker("./assets/js/plugins/virtualbackground/offscreencanvas.js");
    worker.postMessage({ canvas: offscreen }, [offscreen]);

    var newStream = new MediaStream();
    newStream.addTrack(stream.getAudioTracks()[0]);
    newStream.addTrack(canvas.captureStream(24).getVideoTracks()[0]);

    window.ee.on("background:update", () => changeBackground())
    updateCanvas()

    return newStream;
}

async function getImages() {
    const img = await document.getElementById('vr_video');
    const cv_img = document.createElement('canvas');
    cv_img.width = img.width;
    cv_img.height = img.height;
    const ctx_img = cv_img.getContext('2d');
    ctx_img.drawImage(img, 0, 0, img.width, img.height);
    const data_img = ctx_img.getImageData(0, 0, img.width, img.height);
    return [img, data_img];
}

async function updateCanvas() {
    getImages().then(function (images) {
        let img = images[0];
        let data_img = images[1];
        this.net.segmentPerson(img, {
            flipHorizontal: false,
            internalResolution: 'low',
            maxDetections: 1,
            segmentationThreshold: 0.7
        }).then(function (segmentation) {
            worker.postMessage({
                data_img: data_img.data.buffer,
                segmentation: segmentation,
                img_width: img.width,
                img_height: img.height
            }, [data_img.data.buffer]);
            updateCanvas();
        });
    });
}

function changeBackground(url) {
    if (url == undefined) {
        url = "https://source.unsplash.com/random"
    }
    worker.postMessage({
        event: "background",
        url: url
    });
}
