//Main Thread Code for face detection
class FaceDetector {

  constructor() {
    this.video = document.getElementById("local");
    this.container = document.getElementById("localContainer");

    //Setup drawing canvas
    this.canvas_box = document.createElement("canvas");
    this.canvas_box.style.position = "absolute";
    this.canvas_box.style.zIndex = "1001"; //make detection appear in front of local video
    document.body.append(this.canvas_box);

    this.webWorker = new Worker("/assets/js/faceDetectWorker.js");

    this.running = false;

    this.detectX = 0.0;
    this.detectY = 0.0;
    this.detectWidth = 0.0;
    this.detectHeight = 0.0;

    console.log("Face Detect - init done");
  }

  //Sample video and call worker at fixed intervals
  sampleAndDetect() {
    var self = this;
    self.video.addEventListener("play", () => {
      self.canvas_box.width = self.video.offsetWidth;
      self.canvas_box.height = self.video.offsetHeight;
      //Position the canvas on the video
      var video_rect = self.video.getBoundingClientRect();
      self.canvas_box.style.left =
        self.video.getBoundingClientRect().left + "px";
      self.canvas_box.style.top = self.video.getBoundingClientRect().top + "px";
      var ctx = self.canvas_box.getContext("2d");
      ctx.strokeStyle = "#0000FF";
      ctx.lineWidth = 7;

      //Detect and crop function
      async function detectAndCrop() {
        if (self.running) return;
        try {
          //console.log("creating canvas, calling worker");
          self.running = true;
          var vWidth = self.video.width;
          var vHeight = self.video.height;

          const frame = await createImageBitmap(self.video, {
            resizeWidth: vWidth,
            resizeHeight: vHeight
          });

          var message = {
            videoFrame: frame,
            width: vWidth,
            height: vHeight
          };
          self.webWorker.postMessage(message, [frame]);
          self.running = false;

          self.webWorker.onmessage = e => {
            if (e.data.boundingBox !== "undefined") {
              var detectX = e.data.boundingBox.xmin;
              var detectY = e.data.boundingBox.ymin;
              var detectWidth = e.data.boundingBox.width;
              var detectHeight = e.data.boundingBox.height;

              //Crop - TODO - cropping done on receiver side
              var croppedSquareLength =
                detectWidth > detectHeight ? detectWidth : detectHeight;
              self.container.style.width = croppedSquareLength + 50 + "px";
              self.container.style.height = croppedSquareLength + 50 + "px";
              self.container.style.borderRadius = "90%";
              self.container.style.clipPath = "circle(50%)";

              self.video.style.clipPath = "none";
              console.log("detectX = ", detectX);
              console.log("detectY = ", detectY);
              self.video.style.marginLeft = -detectX + 20 + "px";
              self.video.style.marginBottom = -(vHeight - (detectHeight + detectY)) + "px";
              // video.style.marginTop = -detectY + 0 + "px";

              //Set member values for export
              self.detectX = detectX;
              self.detectY = detectY;
              self.detectWidth = detectWidth;
              self.detectHeight = detectHeight;
            }
          };
        } catch (err) {
          console.log(err);
        }

        setTimeout(detectAndCrop, 2000);
      }

      detectAndCrop();
    });
  }
}

export {
  FaceDetector
};
/*
//Main Thread Code for face detection
var video = document.getElementById("local");
var container = document.getElementById("localContainer");

//Setup drawing canvas
const canvas_box = document.createElement("canvas");
canvas_box.style.position = "absolute";
canvas_box.style.zIndex = "1001"; //make detection appear in front of local video
document.body.append(canvas_box);

var webWorker = new Worker("/assets/js/faceDetectWorker.js");

var running = false;

video.addEventListener("play", () => {
  canvas_box.width = video.offsetWidth;
  canvas_box.height = video.offsetHeight;
  //Position the canvas on the video
  var video_rect = video.getBoundingClientRect();
  canvas_box.style.left = video.getBoundingClientRect().left + "px";
  canvas_box.style.top = video.getBoundingClientRect().top + "px";
  var ctx = canvas_box.getContext("2d");
  ctx.strokeStyle = "#0000FF";
  ctx.lineWidth = 7;

  //Detect and crop function
  async function detectAndCrop() {
    if (running) return;
    try {
      //console.log("creating canvas, calling worker");
      running = true;
      var vWidth = video.width;
      var vHeight = video.height;

      const frame = await createImageBitmap(video, {
        resizeWidth: vWidth,
        resizeHeight: vHeight
      });

      var message = {
        videoFrame: frame,
        width: vWidth,
        height: vHeight
      };
      webWorker.postMessage(message, [frame]);
      running = false;

      webWorker.onmessage = e => {
        if (e.data.boundingBox !== "undefined") {
          var detectX = e.data.boundingBox.xmin;
          var detectY = e.data.boundingBox.ymin;
          var detectWidth = e.data.boundingBox.width;
          var detectHeight = e.data.boundingBox.height;

          //Crop - TODO - cropping done on receiver side
          var croppedSquareLength =
            detectWidth > detectHeight ? detectWidth : detectHeight;
          container.style.width = croppedSquareLength + 50 + "px";
          container.style.height = croppedSquareLength + 50 + "px";
          container.style.borderRadius = "90%";
          container.style.clipPath = "circle(50%)";

          video.style.clipPath = "none";
          console.log("detectX = ", detectX);
          console.log("detectY = ", detectY);
          video.style.marginLeft = -detectX + 20 + "px";
          video.style.marginBottom =
            -(vHeight - (detectHeight + detectY)) + "px";
          // video.style.marginTop = -detectY + 0 + "px";
        }
      };
    } catch (err) {
      console.log(err);
    }

    setTimeout(detectAndCrop, 2000);
  }

  detectAndCrop();
});
*/