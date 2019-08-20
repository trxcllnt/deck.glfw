// Creates the GLFW Window. Must be required before '@deck.gl/core' so mjolnir is patched first.
require('../../index');

module.exports = require('./app');

// export * from './app';
