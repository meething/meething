// From: https://github.com/justadudewhohacks/face-api.js/issues/47


self.Canvas = self.HTMLCanvasElement = OffscreenCanvas;
self.HTMLCanvasElement.name = 'HTMLCanvasElement';
self.Canvas.name = 'Canvas';

self.CanvasRenderingContext2D = OffscreenCanvasRenderingContext2D;

function HTMLImageElement() {}

function HTMLVideoElement() {}

self.Image = HTMLImageElement;
self.Video = HTMLVideoElement;

// Canvas.prototype = Object.create(OffscreenCanvas.prototype);

function Storage() {
    let _data = {};
    this.clear = function () {
        return _data = {};
    };
    this.getItem = function (id) {
        return _data.hasOwnProperty(id) ? _data[id] : undefined;
    };
    this.removeItem = function (id) {
        return delete _data[id];
    };
    this.setItem = function (id, val) {
        return _data[id] = String(val);
    };
}
class Document extends EventTarget {}

let window, document = new Document();

// do terrible things to the worker's global namespace to fool tensorflow
// for (let key in event.data.fakeWindow) {
// 	if(!self[key]) {
// 		self[key] = event.data.fakeWindow[key];
// 	} 
// }

window = self.Window = self;
self.localStorage = new Storage();
// console.log('*faked* Window object for the worker', window);

// for (let key in event.data.fakeDocument) {
// 	if (document[key]) { continue; }

// 	let d = event.data.fakeDocument[key];
// 	// request to create a fake function (instead of doing a proxy trap, fake better)
// 	if (d && d.type && d.type === '*function*') {
// 		document[key] = function(){ console.log('FAKE instance', key, 'type', document[key].name, '(',document[key].arguments,')'); };
// 		document[key].name = d.name;
// 	} else {
// 		document[key] = d;
// 	}
// }

// console.log('*faked* Document object for the worker', document);

function createElement(element) {
    // console.log('FAKE ELELEMT instance', createElement, 'type', createElement, '(', createElement.arguments, ')');
    switch (element) {
        case 'canvas':
            // console.log('creating canvas');
            let canvas = new Canvas(1, 1);
            canvas.localName = 'canvas';
            canvas.nodeName = 'CANVAS';
            canvas.tagName = 'CANVAS';
            canvas.nodeType = 1;
            canvas.innerHTML = '';
            canvas.remove = () => {
                console.log('nope');
            };
            // console.log('returning canvas', canvas);
            return canvas;
        default:
            console.log('arg', element);
            break;
    }
}

document.createElement = createElement;
document.location = self.location;
//console.log('*faked* Document object for the worker', document);


if (!typeof window == 'object') {
    console.warn("Check failed: window");
}
if (typeof document === 'undefined') {
    console.warn("Check failed: document");
}
if (typeof HTMLImageElement === 'undefined') {
    console.warn("Check failed: HTMLImageElement");
}
if (typeof HTMLCanvasElement === 'undefined') {
    console.warn("Check failed: HTMLCanvasElement");
}
if (typeof HTMLVideoElement === 'undefined') {
    console.warn("Check failed: HTMLVideoElement");
}
if (typeof ImageData === 'undefined') {
    console.warn("Check failed: ImageData");
}
if (typeof CanvasRenderingContext2D === 'undefined') {
    console.warn("Check failed: CanvasRenderingContext2D");
}

self.window = window;
self.document = document;
self.HTMLImageElement = HTMLImageElement;
self.HTMLVideoElement = HTMLVideoElement;

const isBrowserCheck = typeof window === 'object' &&
    typeof document !== 'undefined' &&
    typeof HTMLImageElement !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLVideoElement !== 'undefined' &&
    typeof ImageData !== 'undefined' &&
    typeof CanvasRenderingContext2D !== 'undefined';;
// console.warn("++ Check passed locally:", isBrowserCheck);
if (!isBrowserCheck) {
    throw new Error("Failed to monkey patch for face-api, face-api will fail");
}

// const ofc = new OffscreenCanvas(1,1);
// const ctx = ofc.getContext('2d');
// console.log(typeof ctx, ctx);