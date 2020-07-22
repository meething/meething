/**
 * @license
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import { drawKeypoints, drawPoint, drawSkeleton, isMobile, toggleLoadingUI, setStatusText } from './utils/demoUtils.js';
import { SVGUtils } from './utils/svgUtils.js'
import { PoseIllustration } from './illustrationGen/illustration.js';
import { Skeleton, facePartName2Index } from './illustrationGen/skeleton.js';
import { FileUtils } from './utils/fileUtils.js';

// Camera stream video element
let video;
let videoWidth = 300;
let videoHeight = 300;

// Canvas
let faceDetection = null;
let illustration = null;
let canvasScope;
let canvasWidth = 800;
let canvasHeight = 800;

// ML models
let facemodel;
let posemodel;
let minPoseConfidence = 0.15;
let minPartConfidence = 0.1;
let nmsRadius = 30.0;

// Misc
let mobile = false;
const avatarSvgs = ["boy", "girl", "blathers", "tom-nook", "lego"];

async function setupCamera(stream) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            'Browser API navigator.mediaDevices.getUserMedia not available');
    }

    var vs = document.getElementById('local');
    const video = document.createElement('video');
    video.id = "local_video";
    video.autoplay = true;
    video.muted = true;
    video.hidden = true;
    video.width = videoWidth;
    video.height = videoHeight;
    video.srcObject = stream;
    vs.appendChild(video);

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadVideo(stream) {
    const video = await setupCamera(stream);
    video.play();

    return video;
}

const defaultPoseNetArchitecture = 'MobileNetV1';
const defaultQuantBytes = 2;
const defaultMultiplier = 0.75;
const defaultStride = 16;
const defaultInputResolution = 200;

const guiState = {
    debug: {
        showDetectionDebug: false,
        showIllustrationDebug: false,
    },
};

async function detectPoseInRealTime(video, posemodel, facemodel) {
    const canvas = document.getElementById('output');
    const videoCtx = canvas.getContext('2d');

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    async function poseDetectionFrame() {
        let poses = [];

        videoCtx.clearRect(0, 0, videoWidth, videoHeight);
        // Draw video
        videoCtx.save();
        videoCtx.scale(-1, 1);
        videoCtx.translate(-videoWidth, 0);
        videoCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
        videoCtx.restore();

        // Creates a tensor from an image
        const input = tf.browser.fromPixels(canvas);
        faceDetection = await facemodel.estimateFaces(input, false, false);
        let all_poses = await posemodel.estimatePoses(video, {
            flipHorizontal: true,
            decodingMethod: 'single-person',
            maxDetections: 1,
            scoreThreshold: minPartConfidence,
            nmsRadius: nmsRadius
        });

        poses = poses.concat(all_poses);
        input.dispose();

        canvasScope.project.clear();

        if (poses.length >= 1 && illustration) {
            Skeleton.flipPose(poses[0]);

            if (faceDetection && faceDetection.length > 0) {
                let face = Skeleton.toFaceFrame(faceDetection[0]);
                illustration.updateSkeleton(poses[0], face);
            } else {
                illustration.updateSkeleton(poses[0], null);
            }
            illustration.draw(canvasScope, videoWidth, videoHeight);

            if (guiState.debug.showIllustrationDebug) {
                illustration.debugDraw(canvasScope);
            }
        }

        canvasScope.project.activeLayer.scale(
            canvasWidth / videoWidth,
            canvasHeight / videoHeight,
            new canvasScope.Point(0, 0));

        requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
}

function setupCanvas() {
    mobile = isMobile();
    if (mobile) {
        canvasWidth = Math.min(window.innerWidth, window.innerHeight);
        canvasHeight = canvasWidth;
        videoWidth *= 0.7;
        videoHeight *= 0.7;
    }

    canvasScope = paper;
    let canvas = document.getElementById('illustration-canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    paper.setup(canvas);
}

export async function bindPage(stream, avatarName) {
    if(posenet.loaded) {
        await parseSVG(`./assets/js/plugins/pose/resources/illustration/${avatarName}.svg`);
        return;
    }
    setupCanvas();
    console.log('Loading PoseNet model...');

    posenet.load({
        architecture: defaultPoseNetArchitecture,
        outputStride: defaultStride,
        inputResolution: defaultInputResolution,
        multiplier: defaultMultiplier,
        quantBytes: defaultQuantBytes
    }).then((posemodel) => {
        posenet.loaded = true;
        facemesh.load().then(async (facemodel) => {
            // const avatarName = sessionStorage.avatar ? sessionStorage.avatar : avatarSvgs[Math.floor(Math.random() * avatarSvgs.length)];
            console.log(`Loading Avatar file...${avatarName}`);
            await parseSVG(`./assets/js/plugins/pose/resources/illustration/${avatarName}.svg`);

            console.log('Setting up camera...');
            try {
                video = await loadVideo(stream);
            } catch (e) {
                let info = document.getElementById('info');
                info.textContent = 'this device type is not supported yet, ' +
                    'or this browser does not support video capture: ' + e.toString();
                info.style.display = 'block';
                throw e;
            }

            detectPoseInRealTime(video, posemodel, facemodel);

        });
    });
}

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
FileUtils.setDragDropHandler((result) => { parseSVG(result) });

async function parseSVG(target) {
    let svgScope = await SVGUtils.importSVG(target /* SVG string or file path */);
    let skeleton = new Skeleton(svgScope);
    illustration = new PoseIllustration(canvasScope);
    illustration.bindSkeleton(skeleton, svgScope);
}