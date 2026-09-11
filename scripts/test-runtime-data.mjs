import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DISCOVERY_TRAILS,
  EDGES,
  NODES,
  PUBLISHED_EDGES,
  PUBLISHED_NODES
} from '../src/data.js';
import runtimeGraph from '../src/runtime-graph.generated.js';
import {
  buildRuntimeGraphSnapshot,
  buildRuntimeNodeDetails
} from '../src/runtime-data-projection.js';

const projected = buildRuntimeGraphSnapshot({
  nodes: NODES,
  edges: EDGES,
  publishedNodes: PUBLISHED_NODES,
  publishedEdges: PUBLISHED_EDGES,
  discoveryTrails: DISCOVERY_TRAILS
});
const expected = JSON.parse(JSON.stringify(projected));

assert.deepEqual(runtimeGraph, expected, 'Generated runtime graph must match the authoritative graph projection');
assert.equal(runtimeGraph.nodes.length, NODES.length);
assert.equal(runtimeGraph.edges.length, EDGES.length);
assert.equal(runtimeGraph.publishedNodeIds.length, PUBLISHED_NODES.length);
assert.equal(runtimeGraph.publishedEdgeKeys.length, PUBLISHED_EDGES.length);

const generatedNodeDetails = JSON.parse(await readFile(
  new URL('../public/runtime-node-details.json', import.meta.url),
  'utf8'
));
const expectedNodeDetails = JSON.parse(JSON.stringify({
  version: 1,
  nodes: buildRuntimeNodeDetails(NODES)
}));
assert.deepEqual(generatedNodeDetails, expectedNodeDetails, 'Generated node details must match the authoritative projection');

console.log(`Runtime graph parity passed: ${runtimeGraph.nodes.length} nodes and ${runtimeGraph.edges.length} relationships.`);
