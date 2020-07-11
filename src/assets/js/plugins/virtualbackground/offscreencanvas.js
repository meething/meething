

onmessage = async function (evt) {
    if (evt.data.canvas) {
        this.canvas = evt.data.canvas;
        this.ctx = canvas.getContext("2d");
        this.imageData = new ImageData(canvas.width, canvas.height);
        await getImage('/assets/images/background.png');
    }
    else if (evt.data.event == "background") {
        await getImage(evt.data.url);
    }
    else {
        this.segmentation = evt.data.segmentation
        this.img_width = evt.data.img_width
        this.img_height = evt.data.img_height
        this.data_img = new ImageData(
            new Uint8ClampedArray(evt.data.data_img),
            evt.data.img_width,
            evt.data.img_height
        );
    }

    async function getImage(url) {
        const imgblob = await fetch(url)
            .then(r => r.blob());
        var bitmap = await createImageBitmap(imgblob);
        var canvas = new OffscreenCanvas(imageData.width, imageData.height);
        var context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0, imageData.width, imageData.height);
        this.img = context.getImageData(0, 0, imageData.width, imageData.height);
    }

    function render(time) {
        if (this.img == undefined) return;
        canvas.width = img_width;
        canvas.height = img_height;
        let width = img_width;
        let height = img_height;
        let pixels = imageData.data;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let base = (y * width + x) * 4;
                let segbase = y * width + x;
                if (segmentation.data[segbase] == 1) { // is fg
                    pixels[base + 0] = data_img.data[base + 0];
                    pixels[base + 1] = data_img.data[base + 1];
                    pixels[base + 2] = data_img.data[base + 2];
                    pixels[base + 3] = data_img.data[base + 3];
                } else {
                    pixels[base + 0] = img.data[base + 0];
                    pixels[base + 1] = img.data[base + 1];
                    pixels[base + 2] = img.data[base + 2];
                    pixels[base + 3] = img.data[base + 3];
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
    requestAnimationFrame(render);
}
