let canvas;
let context;

addEventListener('message', event => {
    if (event.data.offscreen) {
        canvas = event.data.offscreen;
        context = canvas.getContext('2d');
    } else if (event.data.imageBitmap && context) {
        var x = event.data.count * 130;
        context.drawImage(event.data.imageBitmap, x, 5, 130, 72)
    }
});