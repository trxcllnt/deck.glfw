const { Window, Document } = require('glfw-raub');

const emit = Window.prototype.emit;
Window.prototype.emit = function(type, event) {
    this.event = event;
    if (event && (typeof event === 'object') && !event.target) {
        event.target = this;
    }
    if (type.includes('mouse')) {
        event.offsetX = event.clientX;
        event.offsetY = event.clientY;
        event.screenX = event.clientX;
        event.screenY = event.clientY;
    }
    return emit.call(this, type, event);
};

const createElement = Document.prototype.createElement;
Document.prototype.createElement = function(name) {
    if (name !== 'img') {
        name = 'canvas';
    }
    const element = createElement.call(this, name);
    element.style || (element.style = {});
    return element;
}

Window.prototype.getBoundingClientRect = function() {
    return {
        x: 0,
        y: 0,
        width: this._width,
        height: this._height,
        left: 0,
        top: 0,
        right: this._width,
        bottom: this._height,
    };
}

Window.prototype.scrollTop = 0;
Window.prototype.clientTop = 0;
Window.prototype.scrollLeft = 0;
Window.prototype.clientLeft = 0;
Window.prototype.devicePixelRatio = 2;

Object.defineProperties(Window.prototype, {
    offsetWidth: { get() { return this._width; } },
    offsetHeight: { get() { return this._height; } },
    fetch: { get() { return global.fetch; } },
    Response: { get() { return global.Response; } },
    Headers: { get() { return global.Headers; } },
    Request: { get() { return global.Request; } },
});

require('cross-fetch/polyfill');

module.exports.Window = Window;
module.exports.Document = Document;
