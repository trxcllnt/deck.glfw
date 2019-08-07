const hammerjs = require('hammerjs');
const {enhancePointerEventInput, enhanceMouseInput} = require('mjolnir.js/dist/es5/utils/hammer-overrides');

enhancePointerEventInput(hammerjs.PointerEventInput);
enhanceMouseInput(hammerjs.MouseInput);

const mjolnirHammer = require('mjolnir.js/dist/es5/utils/hammer');

module.exports.Manager = mjolnirHammer.Manager = hammerjs.Manager;
module.exports.default = mjolnirHammer.default = hammerjs;
