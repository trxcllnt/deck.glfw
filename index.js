const Image = require('image-raub');
const webgl = require('./lib/webgl');
const { Document } = require('./lib/glfw');

Document.setWebgl(webgl);
Document.setImage(Image);

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

webgl.canvas = canvas;
webgl.viewportWidth = canvas.clientWidth;
webgl.viewportHeight = canvas.clientHeight;
webgl.drawingBufferWidth = canvas.clientWidth;
webgl.drawingBufferHeight = canvas.clientHeight;

require('./lib/mjolnir');

const glOptions = {
    canvas, document, gl: webgl,
    width: webgl.drawingBufferWidth,
    height: webgl.drawingBufferHeight,
};

module.exports = { glOptions, ...glOptions };
