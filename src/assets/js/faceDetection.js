//Main Thread Code for face detection
var video = document.getElementById("local");
var container = document.getElementById("localContainer");

//Setup drawing canvas
const canvas_box = document.createElement("canvas");
canvas_box.style.position = "absolute";
canvas_box.style.zIndex = "1001"; //make detection appear in front of local video

document.body.append(canvas_box);

//console.log("Load the model");
//faceapi.nets.tinyFaceDetector.loadFromUri("/assets/models");

video.addEventListener("play", () => {
  //const canvas = faceapi.createCanvasFromMedia(video);
  //faceapi.matchDimensions(canvas, displaySize);
  //document.body.append(canvas);
  canvas_box.width = video.offsetWidth;
  canvas_box.height = video.offsetHeight;
  //Position the canvas on the video
  var video_rect = video.getBoundingClientRect();
  canvas_box.style.left = video.getBoundingClientRect().left + "px";
  canvas_box.style.top = video.getBoundingClientRect().top + "px";
  var ctx = canvas_box.getContext("2d");
  ctx.strokeStyle = "#0000FF";
  ctx.lineWidth = 7;

  var webWorker = new Worker("/assets/js/faceDetectWorker.js");
  //Detect and crop function
  async function detectAndCrop() {
    try {
      console.log("creating canvas, calling worker");
      const frame = await createImageBitmap(video);

      vWidth = video.offsetWidth;
      vHeight = video.offsetHeight;
      console.log("video_width = ", vWidth);
      console.log("video_height = ", vHeight);

      var message = {
        videoFrame: frame,
        width: vWidth,
        height: vHeight
      };
      console.log("message:", message);
      webWorker.postMessage(message, [frame]);

      webWorker.onmessage = e => {
        if (e.data.boundingBox !== "undefined") {
          var detectX = e.data.boundingBox.xmin;
          var detectY = e.data.boundingBox.ymin;
          var detectWidth = e.data.boundingBox.width;
          var detectHeight = e.data.boundingBox.height;

          console.log("detectX = ", detectX);
          console.log("detectY = ", detectY);
          console.log("detectWidth = ", detectWidth);
          console.log("detectHeight = ", detectHeight);

          //Draw Detections
          // ctx.clearRect(0, 0, canvas_box.width, canvas_box.height);
          // ctx.beginPath();
          // ctx.rect(detectX, detectY, detectWidth, detectHeight);
          // ctx.stroke();

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
          video.style.marginBottom = -(vHeight - (detectHeight + detectY)) + "px";
          // video.style.marginTop = -detectY + 0 + "px";
        }
      };
    } catch (err) {
      console.log(err);
    }

    setTimeout(detectAndCrop, 1000);

    //Draw detections
    // canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    // faceapi.draw.drawDetections(canvas, resizedDetections)
  }

  detectAndCrop();
});