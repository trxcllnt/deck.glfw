const { Window, Document } = require('glfw-raub');

const createElement = Document.prototype.createElement;
Document.prototype.createElement = function(name) {
    if (name !== 'img') {
        name = 'canvas';
    }
    const element = createElement.call(this, name);
    element.style || (element.style = {});
    return element;
}

if (typeof global !== 'undefined') {

    if (typeof global['fetch'] === 'undefined') {
        const xfetch = require('cross-fetch');
        const xfetchDefs = {
            'fetch': { writable: false, get() { return xfetch.fetch; } },
            'Response': { writable: false, get() { return xfetch.Response; } },
            'Headers': { writable: false, get() { return xfetch.Headers; } },
            'Request': { writable: false, get() { return xfetch.Request; } },
        };
        Object.defineProperties(global, xfetchDefs);
        Object.defineProperties(Window.prototype, xfetchDefs);
    }

    if (typeof global['ReadableStream'] === 'undefined') {
        const streams = require('web-streams-polyfill');
        const streamsDefs = {
            'ReadableStream': { writable: false, get() { return streams.ReadableStream; } },
            'WritableStream': { writable: false, get() { return streams.WritableStream; } },
            'TransformStream': { writable: false, get() { return streams.TransformStream; } },
            'CountQueuingStrategy': { writable: false, get() { return streams.CountQueuingStrategy; } },
            'ByteLengthQueuingStrategy': { writable: false, get() { return streams.ByteLengthQueuingStrategy; } },
        };
        Object.defineProperties(global, streamsDefs);
        Object.defineProperties(Window.prototype, streamsDefs);
    }
}

module.exports.Window = Window;
module.exports.Document = Document;
