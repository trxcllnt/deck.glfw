const SegfaultHandler = require('segfault-handler');

SegfaultHandler.registerHandler('./crash.log');

// Creates the GLFW Window. Must be required before '@deck.gl/core' so mjolnir is patched first.
const deckGLFWConfig = require('../../index');

// deckGLFWConfig.gl.clearColor(255, 255, 255, 1);
// deckGLFWConfig.gl.clear(deckGLFWConfig.gl.COLOR_BUFFER_BIT);

import { Deck, OrthographicView, COORDINATE_SYSTEM, log as deckLog } from '@deck.gl/core';
import ArrowGraphLayer from './layers/arrow-graph-layer';
import { loadFromFile } from './loader';

Object.assign(document.body.style, {
    margin: 0,
    background: '#333'
});

let redrawTimeout = null;
let boundingBoxSet = false;
let numNodes = 0;
let numEdges = 0;
let graphVersion = 0;
const nodeUpdates = [];
const edgeUpdates = [];
const DATA_URL =
    'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/arrow/';

const deck = new Deck({
    ...deckGLFWConfig,
    initialViewState: {
        offset: [0, 0],
        zoom: -10
    },
    views: [new OrthographicView({ controller: { minZoom: -Infinity, maxZoom: Infinity } })],
    onViewStateChange: ({ viewState }) => {
        deck.setProps({ viewState });
        redraw({drawEdges: false});
        redrawTimeout !== null && clearTimeout(redrawTimeout);
        redrawTimeout = setTimeout(() => {
            redrawTimeout = null;
            redraw({ drawEdges: true });
        }, 350);
    }
});

loadFromFile(`${DATA_URL}/biogrid-nodes.arrow`, ({ metadata, length, offset, ...columns }) => {

    if (deck.width > 0 && deck.height > 0 && metadata.has('globalBoundBox') && !boundingBoxSet) {
        zoomTo(JSON.parse(metadata.get('globalBoundBox')));
    }

    !numNodes && (numNodes = Number(metadata.get('length')));

    nodeUpdates.push({ length, offset, ...columns });
    graphVersion++;
    redraw();
});

loadFromFile(`${DATA_URL}/biogrid-edges.arrow`, ({ metadata, length, offset, ...columns }) => {
    !numEdges && (numEdges = Number(metadata.get('length')));
    edgeUpdates.push({ length, offset, ...columns });
    graphVersion++;
    redraw();
});

function redraw(props) {
    deck.setProps({
        layers: [
            new ArrowGraphLayer(
                {
                    id: 'graph',
                    coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
                    numNodes,
                    numEdges,
                    nodeUpdates,
                    edgeUpdates,
                    version: graphVersion
                },
                props
            )
        ]
    });
}

function zoomTo([top, right, bottom, left]) {

    const zoom = Math.max(
        ((right - left) || 0) / deck.width,
        ((bottom - top) || 0) / deck.height);

    const offset = [
        ((left + right) * 0.5 / zoom) || 0,
        ((top + bottom) * 0.5 / zoom) || 0];

    deck.setProps({ viewState: { offset, zoom } });
}
