const SKIN_COLOR = getRandomColor();//'#936855';
const LIP_COLOR = getRandomColor();//'#b8696a';
const EYE_COLOR = getRandomColor();//'#a1caf1';
const NEUTRAL_COLOR = getRandomColor();//'#ffffff';
const NOSE_COLOR = getRandomColor();//'#000000';

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

onmessage = async function (evt) {
    if (evt.data.canvas) {
        this.canvas = evt.data.canvas;
        this.ctx = canvas.getContext("2d");
        // await getImage('../images/boy.png');
    }
    if (evt.data[0]) {
        this.annotations = evt.data[0];
        render()
    }

    async function getImage(url) {
        const imgblob = await fetch(url)
            .then(r => r.blob());
        this.img = await createImageBitmap(imgblob);
    }

    function render(time) {

        if (annotations !== undefined) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            //Lips
            const keypointsLipsUpperOuter = annotations.lipsUpperOuter;
            const keypointsLipsLowerOuter = annotations.lipsLowerOuter;
            const keypointsLipsUpperInner = annotations.lipsUpperInner;
            const keypointsLipsLipsLowerInner = annotations.lipsLowerInner;

            //Silhouette
            const keypointsSilhouette = annotations.silhouette;

            //Eyebrows
            const keypointsRightEyebrowUpper = annotations.rightEyebrowUpper;
            const keypointsRightEyebrowLower = annotations.rightEyebrowLower;
            const keypointsLeftEyebrowUpper = annotations.leftEyebrowUpper;
            const keypointsLeftEyebrowLower = annotations.leftEyebrowLower;

            //RightEye
            const keyPointsRightEyeUpper0 = annotations.rightEyeUpper0;
            const keyPointsRightEyeLower0 = annotations.rightEyeLower0;

            //LeftEye
            const keyPointsLeftEyeUpper0 = annotations.leftEyeUpper0;
            const keyPointsLeftEyeLower0 = annotations.leftEyeLower0;

            //Nose
            const keyPointsMidwayBetweenEyes = annotations.midwayBetweenEyes;
            const keyPointsNoseTip = annotations.noseTip;
            const keyPointsNoseBottom = annotations.noseBottom;
            const keyPointsNoseRightCorner = annotations.noseRightCorner;
            const keyPointsNoseLeftCorner = annotations.noseLeftCorner;
            var keyPointsNose = keyPointsMidwayBetweenEyes.concat(keyPointsNoseRightCorner, keyPointsNoseLeftCorner, keyPointsMidwayBetweenEyes);

            //Draw everything in order for overlapping
            // renderImage(keyPointsNoseTip);

            renderPoints(keypointsSilhouette, true, SKIN_COLOR);

            renderPoints(keypointsLipsUpperOuter, true, LIP_COLOR);
            renderPoints(keypointsLipsLowerOuter, true, LIP_COLOR);
            renderPoints(keypointsLipsUpperInner, true, NEUTRAL_COLOR);
            renderPoints(keypointsLipsLipsLowerInner, true, NEUTRAL_COLOR);

            renderPoints(keypointsRightEyebrowUpper);
            renderPoints(keypointsRightEyebrowLower);
            renderPoints(keypointsLeftEyebrowUpper);
            renderPoints(keypointsLeftEyebrowLower);

            renderPoints(keyPointsRightEyeUpper0, true, EYE_COLOR);
            renderPoints(keyPointsRightEyeLower0, true, EYE_COLOR);

            renderPoints(keyPointsLeftEyeUpper0, true, EYE_COLOR);
            renderPoints(keyPointsLeftEyeLower0, true, EYE_COLOR);

            renderPoints(keyPointsNose, true, SKIN_COLOR);


            annotations = null;
        }
    }

    function renderPoints(keypoints, closePath, color) {
        ctx.beginPath();
        var x;
        var y;
        var xStart;
        var yStart;
        for (let i = 0; i < keypoints.length; i++) {
            if (x == undefined && y == undefined) {
                x = keypoints[i][0];
                y = keypoints[i][1];
                xStart = x;
                yStart = y;
                ctx.moveTo(x, y);
            } else {
                xNext = keypoints[i][0];
                yNext = keypoints[i][1];
                ctx.lineTo(xNext, yNext);
                x = xNext;
                y = yNext;
            }
        }
        ctx.stroke();
        if (closePath) {
            ctx.lineTo(xStart, yStart);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

    }

    function renderNose(keypoints, color) {
        ctx.beginPath();
        ctx.arc(keypoints[0][0], keypoints[0][1], 1, 0, 2 * Math.PI, false);
        ctx.fillStyle = SKIN_COLOR;
        ctx.fill();
        ctx.lineWidth = 0;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
    }

    function renderImage(keypoints) {
        ctx.drawImage(this.img, keypoints[0][0] - (this.img.width / 2), keypoints[0][1] - (this.img.height / 2));
    }
};