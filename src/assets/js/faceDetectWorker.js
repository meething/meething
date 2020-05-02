// VIP: Patch the faceapi.js to avoid env errors
self.importScripts('faceEnvWorkerPatch.js')
self.importScripts('face-api.min.js');

global = {}
require = function () {}
module = {}
process = {
    version: 1.0
}

self.global = global
self.require = require
self.module = module
self.process = process

function testNode() {
    return typeof global === 'object' &&
        typeof require === 'function' &&
        typeof module !== 'undefined'
        // issues with gatsby.js: module.exports is undefined
        // && !!module.exports
        &&
        typeof process !== 'undefined' && !!process.version
}
console.log("Testing Node env:\n", "global: ", typeof global === 'object', '\nrequire: ', typeof require === 'function',
    '\nmodule: ', typeof module !== 'undefined', '\nprocess: ', typeof process !== 'undefined' && !!process.version)

var loaded = false

faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models').then(
    async () => {
            this.console.log("Try to load")
            var test_canvas = new OffscreenCanvas(90, 90)
            const detections = await faceapi.detectSingleFace(test_canvas,
                new faceapi.TinyFaceDetectorOptions())
            loaded = true
            console.log('Model Loaded')
        },
        (err) => {
            console.log("failed")
            this.console.log(err)

        }
);



this.onmessage = async function handler(e) {

    if (!loaded) {


        return;
    }

    console.log("in worker !")

    this.console.log(e.data.videoFrame)
    if (e.data.videoFrame !== 'undefined') {
        this.console.log("Got the frame !")
        var frame = e.data.videoFrame
        this.displaySize = {
            width: e.data.width,
            height: e.data.height
        }
        console.log('frame: ', e.data.videoFrame)
        console.log('width: ', this.displaySize.width)
        console.log('height: ', this.displaySize.height)
        var canvas = new OffscreenCanvas(this.displaySize.width, this.displaySize.height)
        faceapi.matchDimensions(canvas, displaySize)
        // canvas.width = this.displaySize.width;
        // canvas.height = this.displaySize.height;
        canvas.getContext('bitmaprenderer').transferFromImageBitmap(frame);
        try {
            const detections = await faceapi.detectSingleFace(canvas,
                new faceapi.TinyFaceDetectorOptions())

            this.console.log('detections: ', detections)
            /*
               const detections = await faceapi.detectAllFaces(frame,
                 new faceapi.SsdMobilenetv1Options())
                 */


            console.log('xmin : ' + detections._box._x)
            console.log('ymin : ' + detections._box._y)
            console.log('width : ' + detections._box._width)
            console.log('height : ' + detections._box._height)

            const resizedDetections = faceapi.resizeResults(detections, displaySize)

            console.log('xmin : ' + resizedDetections.box.x)
            console.log('ymin : ' + resizedDetections.box.y)
            console.log('width : ' + resizedDetections.box.width)
            console.log('height : ' + resizedDetections.box.height)

            //Send Bounding box to main thread
            var message = {
                boundingBox: {
                    xmin: resizedDetections.box.x,
                    ymin: resizedDetections.box.y,
                    width: resizedDetections.box.width,
                    height: resizedDetections.box.height
                }
            }

            this.postMessage(message)
        } catch (err) {
            this.console.log(err)
        }
    }
}