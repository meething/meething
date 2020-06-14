const MIMETYPE_VIDEO_AUDIO = 'video/webm; codecs="opus,vp8"';
const OPTIONS = { mimeType: MIMETYPE_VIDEO_AUDIO };
var med = null;

var video
var recordVideo;
var mediaRecorder;
var finalMediaRecorder;
var finalRecordedChunks = [];
var mediaSource = new MediaSource();
var sourceBuffer;
var self = null;

mediaSource.addEventListener('sourceopen', function () {
    sourceBuffer = mediaSource.addSourceBuffer(MIMETYPE_VIDEO_AUDIO);
    sourceBuffer.mode = "sequence"
    console.log("PiP recorder ready");
});

export default class PiPRecorder {
    constructor(mediator) {
        med = mediator;
        self = this;
        video = document.getElementById("pip");
        this.initRecorderVideo();
        window.ee.on("start-record-active-speaker", function () {
            self.record();
            self.startFinalRecord();
        });
        window.ee.on("stop-record-active-speaker", function () {
            self.stopFinalRecord()
        });
        window.ee.on("start-switch-pip", function () {
            self.stopRecord();
        });
        window.ee.on("done-switch-pip", function () {
            self.startRecord();
        });
        return this;
    }

    initRecorderVideo() {
        recordVideo = document.getElementById("record-video");
        recordVideo.src = window.URL.createObjectURL(mediaSource);
    }

    async record() {
        if (document.pictureInPictureElement && !video.paused && video.srcObject) {
            console.log("Start Active speaker recording");
            this.startRecord();
        } else {
            console.log("Active speaker pip is not active");
        }
    }

    async handleDataAvailable(event) {
        console.log("data");
        if (event.data.size > 0) {
            var blob = event.data;
            new Response(blob).arrayBuffer().then(function (arrayBuffer) {
                blob = null;
                if (!sourceBuffer.updating) {
                    sourceBuffer.appendBuffer(arrayBuffer);
                    if (!recordVideo.playing) {
                        recordVideo.play();
                    }
                } else {
                    console.log("Skip");
                }
            });
        } else {
            console.log("Manual request");
            // mediaRecorder.requestData();
        }
    }

    async handleDataAvailableFinal(event) {
        console.log("data");
        if (event.data.size > 0) {
            finalRecordedChunks.push(event.data);
        }
    }

    download() {
        var blob = new Blob(finalRecordedChunks, {
            type: 'video/webm'
        });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = 'test.webm';
        a.click();
        window.URL.revokeObjectURL(url);
        finalRecordedChunks = [];
    }

    getMutedAudio() {
        let audio = new AudioContext();
        let oscillator = audio.createOscillator();
        let destination = oscillator.connect(audio.createMediaStreamDestination());
        return destination.stream.getAudioTracks()[0];
    }

    async startRecord() {
        console.log("Start Record");
        if (!mediaRecorder) {
            mediaRecorder = await new MediaRecorder(video.captureStream(), options);
            mediaRecorder.ondataavailable = this.handleDataAvailable;
            await mediaRecorder.start(800);
            console.log("Recording Started");
        }
    }

    async stopRecord() {
        console.log("Stop Record");
        if (mediaRecorder != undefined) {
            if (mediaRecorder.state == "recording") {
                console.log("Stop Record");
                await mediaRecorder.stop();
                mediaRecorder = null;
                console.log("Recording Stopped");
            }
        }
    }

    startFinalRecord() {
        console.log("Start real recording");
        if (!finalMediaRecorder) {
            finalMediaRecorder = new MediaRecorder(recordVideo.captureStream(), options);
            finalMediaRecorder.ondataavailable = this.handleDataAvailableFinal;
            finalMediaRecorder.onstop = function (e) {
                self.download();
            }
            finalMediaRecorder.start();
        }
    }

    async stopFinalRecord() {
        console.log("Stop real recording");
        await self.stopRecord()
        if (finalMediaRecorder && finalMediaRecorder.state == "recording")
            await finalMediaRecorder.stop();
    }
}
