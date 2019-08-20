const SegfaultHandler = require('segfault-handler');

SegfaultHandler.registerHandler('./crash.log');

// Creates the GLFW Window. Must be required before '@deck.gl/core' so mjolnir is patched first.
const deckGLFWConfig = require('../');

window.website = true;

const [lessonNo] = process.argv.slice(2);

const lesson = require.resolve(`../../luma.gl/examples/lessons/${lessonNo}/app`);

// Change cwd to the example dir so relative file paths are resolved
process.chdir(require('path').parse(lesson).dir);
const AppAnimationLoop = require(lesson).default;

new AppAnimationLoop(deckGLFWConfig).start();
