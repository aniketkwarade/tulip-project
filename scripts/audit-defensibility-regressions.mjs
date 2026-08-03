import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES } from '../src/data.js';

const registryPath = path.resolve('public/graph-reference-registry.json');
const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
const researchBacklog = JSON.parse(await fs.readFile(path.resolve('public/research-backlog.json'), 'utf8'));
const resolvedMetricRecordIds = new Set((researchBacklog.resolved_metric_records || []).map(record => record.id));
const totalKnowledgeRecordCount = new Set([...registry.nodes.map(node => node.id), ...resolvedMetricRecordIds]).size;
const nodeIds = new Set(registry.nodes.map(node => node.id));
const seenEdgeKeys = new Set();
const degree = new Map(registry.nodes.map(node => [node.id, 0]));
const counts = {};
const authenticityCounts = {};
const failures = [];
const degreeWarnings = [];
const acceptedNodeSourceStatuses = new Set([
  'primary_research_link',
  'web_verified_official',
  'official_registry_link',
  'node_specific_rehabilitation',
  'relationship_dossier_readback',
  'curated_response_reference'
]);

const liveNodeIds = new Set(NODES.map(node => node.id));
const liveEdgeKeys = new Set(EDGES.map(edge => `${edge.source}->${edge.target}`));
const registryNodeIds = new Set(registry.nodes.map(node => node.id));
const registryEdgeKeys = new Set(registry.edges.map(edge => edge.key));
if (registry.nodes.length !== NODES.length
  || liveNodeIds.size !== registryNodeIds.size
  || [...liveNodeIds].some(id => !registryNodeIds.has(id))) {
  failures.push(`Stale graph-reference node registry: live=${NODES.length}, exported=${registry.nodes.length}`);
}
if (registry.edges.length !== EDGES.length
  || liveEdgeKeys.size !== registryEdgeKeys.size
  || [...liveEdgeKeys].some(key => !registryEdgeKeys.has(key))) {
  failures.push(`Stale graph-reference edge registry: live=${EDGES.length}, exported=${registry.edges.length}`);
}

for (const node of registry.nodes) {
  const authenticity = node.authenticity;
  const sourceUrls = node.source_urls || [];
  const status = authenticity?.status || 'missing';
  authenticityCounts[status] = (authenticityCounts[status] || 0) + 1;

  if (!authenticity?.status) failures.push(`Node lacks authenticity classification: ${node.id}`);
  if (!sourceUrls.length) failures.push(`Node lacks source provenance: ${node.id}`);
  if (!acceptedNodeSourceStatuses.has(node.source_status)) {
    failures.push(`Node lacks an accepted source status: ${node.id} (${node.source_status || 'missing'})`);
  }
  if (authenticity?.source_scope === 'unverified') failures.push(`Node has unverified source scope: ${node.id}`);

  if (node.role === 'generated') {
    if (!node.anchor_id) failures.push(`Generated node lacks reviewed anchor: ${node.id}`);
    if (authenticity?.status?.startsWith('reviewed_') && !(
      authenticity?.exact_label_validated === true
      && ['label_specific_review', 'node_specific'].includes(authenticity?.source_scope)
    )) {
      failures.push(`Generated-origin node lacks explicit promotion evidence: ${node.id}`);
    }
  }

  if (node.role !== 'generated' && authenticity?.source_scope !== 'node_specific') {
    failures.push(`Reviewed anchor lacks node-specific source scope: ${node.id}`);
  }
}

for (const edge of registry.edges) {
  counts[edge.defensibility?.label || 'unclassified'] = (counts[edge.defensibility?.label || 'unclassified'] || 0) + 1;

  if (seenEdgeKeys.has(edge.key)) failures.push(`Duplicate edge: ${edge.key}`);
  seenEdgeKeys.add(edge.key);

  if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
    failures.push(`Dangling edge: ${edge.key}`);
    continue;
  }

  degree.set(edge.source, degree.get(edge.source) + 1);
  degree.set(edge.target, degree.get(edge.target) + 1);

  if (edge.defensibility?.label === 'curated_direct' && !edge.evidence?.relationship_source_urls?.length) {
    failures.push(`Direct edge lacks relationship sources: ${edge.key}`);
  }

  if (['modeled_local', 'weak_modeled'].includes(edge.defensibility?.label)) {
    failures.push(`Modeled edge returned: ${edge.key}`);
  }
}

for (const [nodeId, nodeDegree] of degree) {
  const node = registry.nodes.find(candidate => candidate.id === nodeId);
  const isReviewedResponse = node?.authenticity?.status === 'reviewed_climate_response';
  if (isReviewedResponse && nodeDegree < 3) {
    failures.push(`Response node below degree floor: ${nodeId} (${nodeDegree})`);
  } else if (nodeDegree < 3) {
    degreeWarnings.push(`Node below aspirational degree floor: ${nodeId} (${nodeDegree})`);
  }
}

const curatedCount = (counts.curated_direct || 0) + (counts.curated_local || 0);
const residualExpansionCount = registry.edges.filter(edge => edge.topology_rule?.startsWith('expansion_')).length;
const anchorHypothesisCount = registry.edges.filter(edge => edge.evidence?.evidence_mode === 'anchor_context_reference').length;
const responseNodes = registry.nodes.filter(node => node.authenticity?.status === 'reviewed_climate_response');
const responseNodeIds = new Set(responseNodes.map(node => node.id));
const responseEdges = registry.edges.filter(edge => edge.topology_rule === 'response_system');
const responseEdgeTypes = responseEdges.reduce((acc, edge) => {
  const type = edge.evidence?.relationship_type || 'unclassified';
  acc[type] = (acc[type] || 0) + 1;
  return acc;
}, {});
const negativeResponseEdgeCount = responseEdges.filter(edge => edge.influence < 0).length;
const responseTradeoffCount = responseEdges.filter(edge => edge.evidence?.relationship_type === 'tradeoff').length;
const responseMinimumDegree = responseNodes.length
  ? Math.min(...responseNodes.map(node => degree.get(node.id) || 0))
  : 0;

for (const edge of responseEdges) {
  if (!edge.evidence?.relationship_source_urls?.length) {
    failures.push(`Response edge lacks relationship sources: ${edge.key}`);
  }
  if (!edge.evidence?.relationship_type) {
    failures.push(`Response edge lacks relationship type: ${edge.key}`);
  }
  if (!responseNodeIds.has(edge.source) && !responseNodeIds.has(edge.target)) {
    failures.push(`Response edge has no response endpoint: ${edge.key}`);
  }
}

if (totalKnowledgeRecordCount < 500) failures.push(`Unexpected causal-plus-metric record regression: ${totalKnowledgeRecordCount}`);
if (registry.edges.length < 817) failures.push(`Unexpected density regression: ${registry.edges.length} edges`);
if (curatedCount < 390) failures.push(`Curated-edge regression: ${curatedCount}`);
if (residualExpansionCount > 0) failures.push(`Residual expansion edges returned: ${residualExpansionCount}`);
if (anchorHypothesisCount > 57) failures.push(`Anchor-hypothesis queue grew: ${anchorHypothesisCount}`);
if (responseNodes.length < 27) failures.push(`Response-node regression: ${responseNodes.length}`);
if (responseEdges.length < 100) failures.push(`Response-edge regression: ${responseEdges.length}`);
if (negativeResponseEdgeCount < 50) failures.push(`Signed mitigation/adaptation edge regression: ${negativeResponseEdgeCount}`);
if (responseTradeoffCount < 10) failures.push(`Response trade-off visibility regression: ${responseTradeoffCount}`);

const result = {
  registry: registryPath,
  node_count: registry.nodes.length,
  resolved_metric_record_count: resolvedMetricRecordIds.size,
  total_knowledge_record_count: totalKnowledgeRecordCount,
  edge_count: registry.edges.length,
  minimum_degree: Math.min(...degree.values()),
  counts,
  authenticity_counts: authenticityCounts,
  curated_count: curatedCount,
  residual_expansion_count: residualExpansionCount,
  anchor_hypothesis_count: anchorHypothesisCount,
  response_layer: {
    node_count: responseNodes.length,
    edge_count: responseEdges.length,
    minimum_degree: responseMinimumDegree,
    signed_reduction_edges: negativeResponseEdgeCount,
    tradeoff_edges: responseTradeoffCount,
    relationship_types: responseEdgeTypes
  },
  degree_warning_count: degreeWarnings.length,
  degree_warnings: degreeWarnings.slice(0, 25),
  degree_warnings_truncated: degreeWarnings.length > 25,
  failures
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
