import { CompositeLayer } from '@deck.gl/core';
import { Buffer, Texture2D, Transform } from 'luma.gl';
import GL from 'luma.gl/constants';
// import { CompositeLayer } from '@deck.gl/core';
// import { Buffer, Texture2D, Transform } from '@luma.gl/core';
// import GL from '@luma.gl/constants';

import { getLayerAttributes } from './utils';
import ScatterplotLayer from './scatterplot-layer-2d';
import EdgeLayer from './edge-layer';

import edgePositionsVS from './edge-positions-vertex.glsl';

const defaultProps = {
    numNodes: 0,
    numEdges: 0,
    nodeUpdates: [],
    edgeUpdates: [],
    drawEdges: true
};

const TEXTURE_WIDTH = 256;
const scatterplotLayerAttributes = getLayerAttributes(ScatterplotLayer);
const edgeLayerAttributes = getLayerAttributes(EdgeLayer);

/* 
LayerAttribute.allocate(numInstances) also creates a typed array as `value`, which we don't want.
Maybe extend it into
LayerAttribute.allocate(numInstances, {valueArray = true})
*/
function resizeBuffer(buffer, numInstances) {
    buffer.reallocate(numInstances * buffer.accessor.BYTES_PER_VERTEX);
}

/*
Always use bufferSubData in
LayerAttribute.updateBuffer ?
*/
function updatePartialBuffer(buffer, data, instanceOffset) {
    buffer.subData({ data, offset: instanceOffset * buffer.accessor.BYTES_PER_VERTEX });
}

export default class ArrowGraphLayer extends CompositeLayer {
    initializeState() {
        const { gl } = this.context;
        this.setState({
            loadedNodeCount: 0,
            loadedEdgeCount: 0,
            edgePositionsToUpdate: Object.create(null),

            // Node layer buffers
            nodeColorsBuffer: new Buffer(gl, {
                // accessor: scatterplotLayerAttributes.instanceFillColors,
                accessor: scatterplotLayerAttributes.instanceColors,
                byteLength: 1
            }),
            nodeRadiusBuffer: new Buffer(gl, {
                accessor: scatterplotLayerAttributes.instanceRadius,
                byteLength: 1
            }),
            nodePositionsBuffer: new Buffer(gl, {
                accessor: scatterplotLayerAttributes.instancePositions,
                byteLength: 1
            }),

            // Line layer buffers
            edgeSourcePositionsBuffer: new Buffer(gl, {
                accessor: edgeLayerAttributes.instanceSourcePositions,
                byteLength: 1
            }),
            edgeTargetPositionsBuffer: new Buffer(gl, {
                accessor: edgeLayerAttributes.instanceTargetPositions,
                byteLength: 1
            }),
            edgeColorsBuffer: new Buffer(gl, {
                accessor: { ...edgeLayerAttributes.instanceSourceColors, size: 8 },
                byteLength: 1
            }),

            // Transform feedback buffers
            nodePositionsTexture: new Texture2D(gl, {
                format: GL.RG32F,
                type: GL.FLOAT,
                width: 1,
                height: 1,
                parameters: {
                    [GL.TEXTURE_MIN_FILTER]: [GL.NEAREST],
                    [GL.TEXTURE_MAG_FILTER]: [GL.NEAREST]
                },
                mipmap: false
            }),
            edgeIdsBuffer: new Buffer(gl, {
                accessor: { type: GL.UNSIGNED_INT, size: 2 },
                byteLength: 1
            }),
            edgeSourcePositionsBufferTemp: new Buffer(gl, {
                accessor: edgeLayerAttributes.instanceSourcePositions,
                byteLength: 1
            }),
            edgeTargetPositionsBufferTemp: new Buffer(gl, {
                accessor: edgeLayerAttributes.instanceTargetPositions,
                byteLength: 1
            })
        });

        this.setState({
            // Transform feedback that looks up node positions from ids
            edgePositionsTransform: new Transform(gl, {
                sourceBuffers: {
                    instanceIds: this.state.edgeIdsBuffer
                },
                feedbackBuffers: {
                    sourcePositions: this.state.edgeSourcePositionsBufferTemp,
                    targetPositions: this.state.edgeTargetPositionsBufferTemp
                },
                vs: edgePositionsVS,
                varyings: ['sourcePositions', 'targetPositions'],
                elementCount: 1,
                isInstanced: false,
            })
        });
    }

    /* eslint-disable max-statements */
    updateState({ props, oldProps }) {
        const { nodeUpdates, edgeUpdates, numNodes, numEdges, drawEdges } = props;
        const {
            nodeColorsBuffer,
            nodeRadiusBuffer,
            nodePositionsBuffer,
            nodePositionsTexture,
            edgePositionsTransform,
            edgeSourcePositionsBuffer,
            edgeTargetPositionsBuffer,
            edgeSourcePositionsBufferTemp,
            edgeTargetPositionsBufferTemp,
            edgeColorsBuffer,
            edgeIdsBuffer
        } = this.state;

        let { loadedNodeCount, loadedEdgeCount } = this.state;

        // Resize node layer buffers
        if (numNodes && numNodes !== oldProps.numNodes) {
            resizeBuffer(nodeColorsBuffer, numNodes);
            resizeBuffer(nodeRadiusBuffer, numNodes);
            nodePositionsTexture.resize({
                width: TEXTURE_WIDTH,
                height: Math.ceil(numNodes / TEXTURE_WIDTH)
            });
            resizeBuffer(nodePositionsBuffer, nodePositionsTexture.width * nodePositionsTexture.height);
            loadedNodeCount = 0;
        }

        // Resize edge layer buffers
        if (numEdges && numEdges !== oldProps.numEdges) {
            resizeBuffer(edgeSourcePositionsBuffer, numEdges);
            resizeBuffer(edgeTargetPositionsBuffer, numEdges);
            resizeBuffer(edgeColorsBuffer, numEdges);
            resizeBuffer(edgeIdsBuffer, numEdges);
            loadedEdgeCount = 0;
        }

        // Apply node data updates
        const nodesUpdated = nodeUpdates.length > 0;
        while (nodeUpdates.length) {
            const { length, offset, pointColors, pointSizes, pointPositions } = nodeUpdates.shift();
            pointColors && updatePartialBuffer(nodeColorsBuffer, pointColors, offset);
            pointSizes && updatePartialBuffer(nodeRadiusBuffer, pointSizes, offset);
            pointPositions && updatePartialBuffer(nodePositionsBuffer, pointPositions, offset);
            loadedNodeCount = Math.max(loadedNodeCount, offset + length);
        }

        const allNodesLoaded = (numNodes && loadedNodeCount === numNodes);

        if (nodesUpdated && allNodesLoaded) {
            // First time all nodes are loaded
            nodePositionsTexture.setImageData({ data: nodePositionsBuffer });
        }

        // Apply edge data updates
        const edgesUpdated = edgeUpdates.length > 0;
        let edgePositionsToUpdate = this.state.edgePositionsToUpdate;
        while (edgeUpdates.length) {
            const { length, offset, edgeColors, logicalEdges } = edgeUpdates.shift();
            edgeColors && updatePartialBuffer(edgeColorsBuffer, edgeColors, offset);
            logicalEdges && updatePartialBuffer(edgeIdsBuffer, logicalEdges, offset);
            loadedEdgeCount = Math.max(loadedEdgeCount, offset + length);
            edgePositionsToUpdate[`[${offset},${length}]`] = { offset, length };
        }

        // Update edge position buffers
        if (drawEdges && numEdges > 0) {

            const allEdgesLoaded = (numEdges && loadedEdgeCount === numEdges);

            const edgePositionUpdateInfo = {
                loadedNodeCount,
                nodePositionsTexture,
                edgePositionsTransform,
                edgeSourcePositionsBuffer,
                edgeTargetPositionsBuffer,
                edgeSourcePositionsBufferTemp,
                edgeTargetPositionsBufferTemp
            };

            if (nodesUpdated && allEdgesLoaded) {
                edgePositionUpdateInfo.offset = 0;
                edgePositionUpdateInfo.length = numEdges;
                copyEdgePositions(edgePositionUpdateInfo);
            } else if (edgesUpdated && allNodesLoaded) {
                for (const k in edgePositionsToUpdate) {
                    edgePositionUpdateInfo.offset = edgePositionsToUpdate[k].offset;
                    edgePositionUpdateInfo.length = edgePositionsToUpdate[k].length;
                    copyEdgePositions(edgePositionUpdateInfo);
                }
                edgePositionsToUpdate = Object.create(null);
            }
        }

        // console.log(`Nodes: ${loadedNodeCount}/${numNodes}, Edges: ${loadedEdgeCount}/${numEdges}`);

        this.setState({ loadedNodeCount, loadedEdgeCount, edgePositionsToUpdate });
    }
    /* eslint-enable max-statements */

    renderLayers() {
        const {
            loadedNodeCount,
            loadedEdgeCount,
            nodeColorsBuffer,
            nodeRadiusBuffer,
            nodePositionsBuffer,
            edgeSourcePositionsBuffer,
            edgeTargetPositionsBuffer,
            edgeColorsBuffer
        } = this.state;

        return [
            loadedEdgeCount &&
            new EdgeLayer(
                this.getSubLayerProps({
                    id: 'edges',
                    visible: this.props.drawEdges,
                    numInstances: loadedEdgeCount,
                    instanceSourcePositions: edgeSourcePositionsBuffer,
                    instanceTargetPositions: edgeTargetPositionsBuffer,
                    instanceSourceColors: edgeColorsBuffer,
                    instanceTargetColors: edgeColorsBuffer,
                    instancePickingColors: edgeColorsBuffer, // TODO
                    pickable: false,
                    opacity: 0.1
                })
            ),
            loadedNodeCount &&
            new ScatterplotLayer(
                this.getSubLayerProps({
                    id: 'nodes',
                    numInstances: loadedNodeCount,
                    instanceColors: nodeColorsBuffer,
                    instanceRadius: nodeRadiusBuffer,
                    instancePositions: nodePositionsBuffer,
                    instancePickingColors: nodeColorsBuffer, // TODO
                    pickable: false,
                    radiusScale: 1,
                    radiusMinPixels: 5,
                    radiusMaxPixels: 50,
                    opacity: 0.5,
                })
            )
        ];
    }
}

ArrowGraphLayer.layerName = 'ArrowGraphLayer';
ArrowGraphLayer.defaultProps = defaultProps;

function copyEdgePositions({
    offset,
    length,
    loadedNodeCount,
    nodePositionsTexture,
    edgePositionsTransform,
    edgeSourcePositionsBuffer,
    edgeTargetPositionsBuffer,
    edgeSourcePositionsBufferTemp,
    edgeTargetPositionsBufferTemp
}) {

    if (length <= 0) return;

    // Update edge position buffers
    resizeBuffer(edgeSourcePositionsBufferTemp, length);
    resizeBuffer(edgeTargetPositionsBufferTemp, length);
    edgePositionsTransform.update({ elementCount: length });
    edgePositionsTransform.run({
        offset,
        uniforms: { loadedNodeCount, width: TEXTURE_WIDTH, nodePositions: nodePositionsTexture }
    });

    edgeSourcePositionsBuffer.copyData({
        sourceBuffer: edgeSourcePositionsBufferTemp,
        size: length * edgeSourcePositionsBuffer.accessor.BYTES_PER_VERTEX,
        writeOffset: offset * edgeSourcePositionsBuffer.accessor.BYTES_PER_VERTEX,
    });
    
    edgeTargetPositionsBuffer.copyData({
        sourceBuffer: edgeTargetPositionsBufferTemp,
        size: length * edgeTargetPositionsBuffer.accessor.BYTES_PER_VERTEX,
        writeOffset: offset * edgeTargetPositionsBuffer.accessor.BYTES_PER_VERTEX,
    });

    resizeBuffer(edgeSourcePositionsBufferTemp, 0);
    resizeBuffer(edgeTargetPositionsBufferTemp, 0);
}
