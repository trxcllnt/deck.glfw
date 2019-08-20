const webgl = require('webgl-raub');

const getExtension = webgl.getExtension;
webgl.getExtension = function(...args) {
    switch (args[0]) {
        // webgl-raub doesn't handle the render_info constants so just return undefined
        case 'WEBGL_debug_renderer_info': return undefined;
    }
    return getExtension.apply(this, args);
}

// luma.gl@6.4.3 checks the existence of this property to infer WebGL2
webgl.TEXTURE_BINDING_3D = 0x806a;

// luma.gl@7.x.x checks the existence of these properties to infer WebGL2
webgl._version = 2;
webgl.webgl2 = true;

// Don't set this yet because `gl.getProgramiv(gl.LINK_STATUS)` currently returns false, even though the program links just fine
// webgl.debug = true;

const {
    clearDepth,
    texParameteri,
    bindBufferBase,
    bindBufferRange
} = webgl;

const isArray = Array.isArray;
const unwrap = (x) => isArray(x) ? x[0] : x;

webgl.clearDepth = (d) => clearDepth(unwrap(d));
webgl.texParameteri = (x, y, z) => texParameteri(x, y, unwrap(z));
webgl.bindBufferBase = (target, index, handle) => bindBufferBase(target, +index, handle);
webgl.bindBufferRange = (target, index, handle, offset, size) => bindBufferRange(target, +index, handle, offset, size);

module.exports = webgl;
