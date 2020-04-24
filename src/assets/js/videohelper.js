export default class VideoHelper {
    constructor() {
        this.worker = new Worker('assets/js/videoworker.js');
        this.canvas = document.getElementById('canvas');
        this.offscreen = this.canvas.transferControlToOffscreen();
        this.worker.postMessage({ offscreen: this.offscreen }, [this.offscreen]);
        this.streams = [];
        this.requestID = 0;
        this.fps = 30;
        this.animate = this.animate;
    }

    animate() {
        var count = 0;
        // this.streams.forEach(function (stream, key) {
        this.streams.forEach(stream => {
            if (stream.active) {
                var imageCapture = new ImageCapture(stream.getVideoTracks()[0]);
                imageCapture.grabFrame().then(imageBitmap => {
                    imageBitmap.count = count;
                    count++;
                    this.worker.postMessage({ imageBitmap: imageBitmap, count: count });
                }).catch(e => {
                    // console.log(e);
                });
                imageCapture = null;
            }
        });
    }

    add(stream) {
        if (stream.active) {
            this.streams.push(stream);
        }
    }

    start() {
        let then = performance.now();
        const interval = 1000 / this.fps;

        const animateLoop = (now) => {
            this.requestID = requestAnimationFrame(animateLoop);
            const delta = now - then;

            if (delta > interval) {
                then = now - (delta % interval);
                this.animate(delta);
            }
        };
        this.requestID = requestAnimationFrame(animateLoop);
    }

    stop() {
        cancelAnimationFrame(this.requestID);
    }



    // start(stream) {
    //     if (!this.isStarted) {
    //         if (this.imageCapture == undefined) {
    //             this.imageCapture = new ImageCapture(stream.getVideoTracks()[0]);
    //         }
    //         this.isStarted = true;
    //         this.draw = () => {
    //             this.imageCapture.grabFrame().then(imageBitmap => {
    //                 this.worker.postMessage({ imageBitmap }, [imageBitmap]);
    //             }).catch(e => {
    //                 console.log(e);
    //             });

    //             requestAnimationFrame(this.draw);
    //         };

    //         requestAnimationFrame(this.draw);
    //     }
    // }
}
