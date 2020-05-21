/// VIP - Video should be square for this to work !!

export default class PoseDetector {
    constructor(mediator) {
        // self = this;
        window.ee.on('navigator:gotDevices', devices => {
            this.init();
            this.sampleAndDetect();
        });
    }

    init() {
        this.video = document.getElementById("local");
        // Camera stream video element

        this.videoWidth = 300;
        this.videoHeight = 300;

        // Canvas
        this.faceDetection = null;
        this.illustration = null;
        this.canvasScope;
        this.canvasWidth = 800;
        this.canvasHeight = 800;

        // ML models
        // let facemesh;
        this.minPoseConfidence = 0.15;
        this.minPartConfidence = 0.1;
        this.nmsRadius = 30.0;
        this.loadedModel = false;
        this.poseModel = null;
        this.faceModel = null;

        // Misc
        this.mobile = false;

        this.defaultPoseNetArchitecture = 'MobileNetV1';
        this.defaultQuantBytes = 2;
        this.defaultMultiplier = 1.0;
        this.defaultStride = 16;
        this.defaultInputResolution = 200;

        this.loadModels = async () => {
            this.poseModel = await posenet.load();
            this.faceModel = await facemesh.load();
            this.loadedModel = true;
        }


    }
    //var webWorker = new Worker('/assets/js/poseWorker.js');
    /**
     * Feeds an image to posenet to estimate poses - this is where the magic
     * happens. This function loops with a requestAnimationFrame method.
     */

    sampleAndDetect() {
        if (!this.loadedModel) {
            this.loadModels();
        }
        if (!this.video) {
            this.video = document.getElementById("local");
            setTimeout(this.sampleAndDetect, 1000);
            return;
        }
        this.video.width = 300;
        this.video.height = 300;
        // const canvas = document.getElementById('output');
        // const keypointCanvas = document.getElementById('keypoints');
        // //const videoCtx = canvas.getContext('2d');
        // const keypointCtx = keypointCanvas.getContext('2d');

        // canvas.style.width = video.getBoundingClientRect().width + "px";
        // canvas.style.height = video.getBoundingClientRect().height + "px";
        // canvas.style.left = video.getBoundingClientRect().left + "px";
        // canvas.style.top = video.getBoundingClientRect().top + "px";

        var self = this;
        async function poseDetectionFrame() {
            var input;
            try {
                self.video.style.clipPath = "none";  //disable the clipping, to make pose estimation work
                if (self.video.style.width !== self.video.style.height) {
                    self.video.style.width = self.video.style.height;
                }
                const input = tf.browser.fromPixels(self.video);
                // var message = {
                //       input: input,
                //       width: video.width,
                //       height: video.height
                //     };
                //webWorker.postMessage(message, [input]);

                self.faceDetection = await self.faceModel.estimateFaces(input, false, false);
                console.log("Facemesh detected : ", self.faceDetection);
                let poses = [];
                let all_poses = await self.poseModel.estimatePoses(input, {
                    flipHorizontal: true,
                    decodingMethod: 'multi-person',
                    maxDetections: 1,
                    scoreThreshold: self.minPartConfidence,
                    nmsRadius: self.nmsRadius
                });
                console.log("pose detected : ", all_poses);

                //Dispatch event
                var event = new CustomEvent('poseDetected', {
                    detail: {
                        faceMesh: self.faceDetection,
                        pose: all_poses
                    }
                });
                console.log("sending event : ", event.detail);
                self.video.dispatchEvent(event);

                poses = poses.concat(all_poses);
                input.dispose();
            }
            catch (err) {
                // input.dispose();
                console.log(err);
            }

            setTimeout(poseDetectionFrame, 1000);
        }

        poseDetectionFrame();

    }

}

// export { PoseDetector };