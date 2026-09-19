import assert from 'node:assert/strict';

import { TulipGraph } from '../src/graph.js';
import mobileGraphSnapshot from '../Stitch Import/tulip-mobile/src/mobile-graph-snapshot.json' with { type: 'json' };

function assignDeterministicSpherePositions(nodes) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  nodes.forEach((node, index) => {
    const z = 1 - (2 * (index + 0.5)) / nodes.length;
    const radial = Math.sqrt(Math.max(0, 1 - z * z));
    const theta = index * goldenAngle;
    node.sphereX = radial * Math.cos(theta);
    node.sphereY = radial * Math.sin(theta);
    node.sphereZ = z;
    node.z = z;
  });
}

function createGraphHarness(nodes, edges) {
  const graph = Object.create(TulipGraph.prototype);
  graph.nodes = structuredClone(nodes);
  graph.edges = structuredClone(edges);
  assignDeterministicSpherePositions(graph.nodes);

  for (const key of [
    'nodeById',
    'incomingIdsById',
    'outgoingIdsById',
    'incomingEdgesById',
    'outgoingEdgesById',
    'adjacentIdsById',
    'nodeDegreeById'
  ]) {
    graph[key] = new Map();
  }

  Object.assign(graph, {
    analyzeEdgeRankingCache: new Map(),
    cachedAnalyzeFocusData: null,
    cachedAnalyzeFocusKey: null,
    cachedTreeLayout: null,
    cachedTreeLayoutKey: null,
    selectionContext: '',
    selectionContextTokens: new Set(),
    selectionContextVersion: 0,
    selectionHistory: [],
    requestRender() {}
  });

  graph.buildIndexes();
  graph.assignDiscoveryProfiles();
  return graph;
}

function representativeSelection(graph, selectedId, context = '') {
  const selectedNode = graph.nodeById.get(selectedId);
  graph.selectedNode = selectedNode;
  graph.setSelectionContext(context);
  const incoming = graph.rankAnalyzeEdges(graph.incomingEdgesById.get(selectedId) || [], 'incoming');
  const outgoing = graph.rankAnalyzeEdges(graph.outgoingEdgesById.get(selectedId) || [], 'outgoing');
  return graph.getCollapsedAnalyzeSelection(incoming, outgoing, 6, selectedNode, new Set());
}

const productionGraph = createGraphHarness(
  mobileGraphSnapshot.graphNodes,
  mobileGraphSnapshot.graphEdges
);
const defaultTemperatureSelection = representativeSelection(productionGraph, 'temp');
const contextualTemperatureSelection = representativeSelection(
  productionGraph,
  'temp',
  'ocean flooding and sea level'
);

assert.equal(contextualTemperatureSelection.displayedDriverEdges.length, 3);
assert.equal(contextualTemperatureSelection.displayedImpactEdges.length, 3);
assert.equal(contextualTemperatureSelection.representativeCandidates.length, 6);
assert.ok(
  contextualTemperatureSelection.representativeCandidates.some(candidate => candidate.isBridge || candidate.isFeedback),
  'the representative set should retain a cross-system bridge or feedback signal'
);
assert.ok(
  !defaultTemperatureSelection.displayedImpactEdges.some(edge => edge.target === 'sea_level_rise'),
  'sea-level rise should not be forced into the generic default set'
);
assert.ok(
  contextualTemperatureSelection.displayedImpactEdges.some(edge => edge.target === 'sea_level_rise'),
  'search context should promote a relevant causal relationship'
);

const syntheticNodes = [
  { id: 'focus', name: 'Focus', sphere: 'atmosphere', impactScore: 80 },
  { id: 'coal', name: 'Coal Carbon Output', sphere: 'energy', impactScore: 80 },
  { id: 'gas', name: 'Gas Carbon Output', sphere: 'energy', impactScore: 79 },
  { id: 'oil', name: 'Oil Carbon Output', sphere: 'energy', impactScore: 78 },
  { id: 'methane', name: 'Methane Leakage', sphere: 'atmosphere', impactScore: 70 },
  { id: 'aerosol', name: 'Aerosol Cooling Loss', sphere: 'atmosphere', impactScore: 68 },
  { id: 'heat', name: 'Heat Stress', sphere: 'sociopolitical', impactScore: 80 },
  { id: 'ice', name: 'Ice Loss', sphere: 'cryosphere', impactScore: 78 },
  { id: 'water', name: 'Water Stress', sphere: 'oceans', impactScore: 76 },
  { id: 'food', name: 'Food Stress', sphere: 'agriculture', impactScore: 74 }
];
const syntheticEdges = [
  { source: 'coal', target: 'focus', influence: 0.96, topology_rule: 'fossil_carbon_family' },
  { source: 'gas', target: 'focus', influence: 0.95, topology_rule: 'fossil_carbon_family' },
  { source: 'oil', target: 'focus', influence: 0.94, topology_rule: 'fossil_carbon_family' },
  { source: 'methane', target: 'focus', influence: 0.76, topology_rule: 'methane_pathway' },
  { source: 'aerosol', target: 'focus', influence: 0.72, topology_rule: 'aerosol_pathway' },
  { source: 'focus', target: 'heat', influence: 0.82, topology_rule: 'heat_pathway' },
  { source: 'focus', target: 'ice', influence: 0.8, topology_rule: 'ice_pathway' },
  { source: 'focus', target: 'water', influence: 0.78, topology_rule: 'water_pathway' },
  { source: 'focus', target: 'food', influence: 0.76, topology_rule: 'food_pathway' }
];
const syntheticGraph = createGraphHarness(syntheticNodes, syntheticEdges);
const syntheticSelection = representativeSelection(syntheticGraph, 'focus');
const fossilFamilyCount = syntheticSelection.representativeCandidates.filter(
  candidate => candidate.mechanismCluster === 'incoming:fossil_carbon_family'
).length;

assert.equal(syntheticSelection.displayedDriverEdges.length, 3);
assert.equal(syntheticSelection.displayedImpactEdges.length, 3);
assert.equal(
  fossilFamilyCount,
  1,
  'redundant siblings from one mechanism family should not consume the representative set'
);

console.log('Representative causal-set tests passed.');
