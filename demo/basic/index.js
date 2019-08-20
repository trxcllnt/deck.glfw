const SegfaultHandler = require('segfault-handler');

SegfaultHandler.registerHandler('./crash.log');

// Creates the GLFW Window. Must be required before '@deck.gl/core' so mjolnir is patched first.
const deckGLFWConfig = require('../../');

// deckGLFWConfig.gl.clearColor(1, 1, 1, 1);
// deckGLFWConfig.gl.clear(deckGLFWConfig.gl.COLOR_BUFFER_BIT);

// Change any window properties you like
// deckGLFWConfig.document.mode = 'borderless';
// deckGLFWConfig.document.size = { width: 800, height: 600 };

const { Deck } = require('@deck.gl/core');
const { GeoJsonLayer, ArcLayer } = require('@deck.gl/layers');

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const COUNTRIES =
    'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson'; //eslint-disable-line
const AIR_PORTS =
    'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

const INITIAL_VIEW_STATE = {
    latitude: 51.47,
    longitude: 0.45,
    zoom: 1,
    bearing: 0,
    pitch: 30
};

module.exports = new Deck({
    ...deckGLFWConfig,
    debug: true,
    initialViewState: INITIAL_VIEW_STATE,
    controller: true,
    layers: [
        new GeoJsonLayer({
            id: 'base-map',
            data: COUNTRIES,
            // Styles
            stroked: true,
            filled: true,
            lineWidthMinPixels: 2,
            opacity: 0.4,
            getLineDashArray: [3, 3],
            getLineColor: [60, 60, 60],
            getFillColor: [200, 200, 200],
            // Interactive props
            pickable: false,
        }),
        new GeoJsonLayer({
            id: 'airports',
            data: AIR_PORTS,
            // Styles
            filled: true,
            pointRadiusMinPixels: 2,
            opacity: 1,
            pointRadiusScale: 2000,
            getRadius: f => 11 - f.properties.scalerank,
            getFillColor: [200, 0, 80, 180],
            // Interactive props
            pickable: true,
            autoHighlight: true,
            onClick: info =>
                // eslint-disable-next-line
                info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
        }),
        new ArcLayer({
            id: 'arcs',
            data: AIR_PORTS,
            dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
            // Styles
            getSourcePosition: f => [-0.4531566, 51.4709959], // London
            getTargetPosition: f => f.geometry.coordinates,
            getSourceColor: [0, 128, 200],
            getTargetColor: [200, 0, 80],
            getWidth: 1,
            // Interactive props
            pickable: false,
        })
    ]
});
