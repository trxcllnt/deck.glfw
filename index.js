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
    vsync: process.platform === 'darwin',
    mode: process.argv.includes('--fullscreen') ? 'fullscreen' :
          process.argv.includes('--borderless') ? 'borderless' : 'windowed',
    glfwInit(glfw) {
        switch (process.platform) {
            case 'darwin':
                glfw.windowHint(glfw.OPENGL_FORWARD_COMPAT, 1);
                glfw.windowHint(glfw.CONTEXT_VERSION_MAJOR, 4);
                glfw.windowHint(glfw.CONTEXT_VERSION_MINOR, 1);
                glfw.windowHint(glfw.OPENGL_PROFILE, glfw.OPENGL_CORE_PROFILE);
                break;
        }
    }
});

global.document = document;
global.document.body = document;
document.documentElement = document;
global.cancelAnimationFrame = document.cancelAnimationFrame;
global.requestAnimationFrame = document.requestAnimationFrame;

Object.setPrototypeOf(window, document);

const canvas = document.createElement('canvas');

Object.defineProperties(webgl, {
    canvas: { get() { return canvas; } },
    viewportWidth: { get() { return canvas.width; }, set(w) { canvas.width = w; }, },
    viewportHeight: { get() { return canvas.height; }, set(h) { canvas.height = h; }, },
    drawingBufferWidth: { get() { return canvas.width; }, set(w) { canvas.width = w; }, },
    drawingBufferHeight: { get() { return canvas.height; }, set(h) { canvas.height = h; }, },
});


require('./lib/mjolnir');

const glOptions = {
    gl: webgl,
    canvas, document,
    width: canvas.width,
    height: canvas.height,
};

module.exports = { glOptions, ...glOptions };
