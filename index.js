const Image = require('image-raub');
const webgl = require('./lib/webgl');
const { Document } = require('./lib/glfw');

Document.setWebgl(webgl);
Document.setImage(Image);

global.gl = webgl;
global.cwrap = null;
global.Image = Image;
global.window = Object.create(global);
global.alert = console.log.bind(console);
global.location = require('3d-core-raub/js/core/location');
global.navigator = require('3d-core-raub/js/core/navigator');
global.WebVRManager = require('3d-core-raub/js/core/vr-manager');

const document = new Document({
    mode: process.argv.includes('--fullscreen') ? 'fullscreen' :
          process.argv.includes('--borderless') ? 'borderless' : 'windowed'
});

global.document = document;
global.document.body = document;
document.documentElement = document;
global.requestAnimationFrame = document.requestAnimationFrame;

Object.setPrototypeOf(window, document);

const canvas = document.createElement('canvas');

Object.defineProperties(webgl, {
    canvas: { get() { return canvas; } },
    viewportWidth: { get() { return canvas.clientWidth; }, set(w) { canvas.clientWidth = w; }, },
    viewportHeight: { get() { return canvas.clientHeight; }, set(h) { canvas.clientHeight = h; }, },
    drawingBufferWidth: { get() { return canvas.clientWidth; }, set(w) { canvas.clientWidth = w; }, },
    drawingBufferHeight: { get() { return canvas.clientHeight; }, set(h) { canvas.clientHeight = h; }, },
});


require('./lib/mjolnir');

const glOptions = {
    gl: webgl,
    canvas, document,
    width: canvas.width,
    height: canvas.height,
};

module.exports = { glOptions, ...glOptions };
