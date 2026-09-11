import runtimeGraph from './runtime-graph.generated.js';

export const NODES = runtimeGraph.nodes;
export const EDGES = runtimeGraph.edges;

const publishedNodeIds = new Set(runtimeGraph.publishedNodeIds);
const publishedEdgeKeys = new Set(runtimeGraph.publishedEdgeKeys);

export const PUBLISHED_NODES = NODES.filter(node => publishedNodeIds.has(node.id));
export const PUBLISHED_EDGES = EDGES.filter(edge => publishedEdgeKeys.has(`${edge.source}->${edge.target}`));
export const DISCOVERY_TRAILS = runtimeGraph.discoveryTrails;
