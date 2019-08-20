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
            'fetch': { get() { return xfetch.fetch; } },
            'Response': { get() { return xfetch.Response; } },
            'Headers': { get() { return xfetch.Headers; } },
            'Request': { get() { return xfetch.Request; } },
        };
        Object.defineProperties(global, xfetchDefs);
        Object.defineProperties(Window.prototype, xfetchDefs);
    }

    if (typeof global['ReadableStream'] === 'undefined') {
        const streams = require('web-streams-polyfill');
        const streamsDefs = {
            'ReadableStream': { get() { return streams.ReadableStream; } },
            'WritableStream': { get() { return streams.WritableStream; } },
            'TransformStream': { get() { return streams.TransformStream; } },
            'CountQueuingStrategy': { get() { return streams.CountQueuingStrategy; } },
            'ByteLengthQueuingStrategy': { get() { return streams.ByteLengthQueuingStrategy; } },
        };
        Object.defineProperties(global, streamsDefs);
        Object.defineProperties(Window.prototype, streamsDefs);
    }
}

module.exports.Window = Window;
module.exports.Document = Document;
