const webgl = require('webgl-raub');

const getExtension = webgl.getExtension;
webgl.getExtension = function(...args) {
    switch (args[0]) {
        // webgl-raub doesn't handle the render_info constants so just return undefined
        case 'WEBGL_debug_renderer_info': return undefined;
    }
    return getExtension.apply(this, args);
}

const clearDepth = webgl.clearDepth;
webgl.clearDepth = (d) => clearDepth(Array.isArray(d) ? d[0] : d);

module.exports = webgl;
