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
      
      const frame = await createImageBitmap(video, {resizeWidth: vWidth, resizeHeight: vHeight});

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
          video.style.marginBottom = -(vHeight - (detectHeight + detectY)) + "px";
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
