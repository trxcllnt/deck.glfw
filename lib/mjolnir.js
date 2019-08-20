const hammerjs = require('hammerjs');

for (const x of ['es5', 'es6', 'esm']) {
    try {
        const {enhancePointerEventInput, enhanceMouseInput} = require(`mjolnir.js/dist/${x}/utils/hammer-overrides`);
        
        enhancePointerEventInput(hammerjs.PointerEventInput);
        enhanceMouseInput(hammerjs.MouseInput);
        
        const mjolnirHammer = require(`mjolnir.js/dist/${x}/utils/hammer`);
        
        mjolnirHammer.Manager = hammerjs.Manager;
        mjolnirHammer.default = hammerjs;

        module.exports.Manager || (module.exports.Manager = mjolnirHammer.Manager);
        module.exports.default || (module.exports.default = mjolnirHammer.default);
    } catch (e) {}
}
