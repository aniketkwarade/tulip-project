import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES } from '../src/data.js';
import { REJECTED_LEGACY_EDGE_KEYS } from '../src/northstar-contracts.js';

const OUTPUT_PATH = path.resolve('public/topology-missing-link-intake.json');
const MAX_CANDIDATES = 240;

const nodeById = new Map(NODES.map(node => [node.id, node]));
const liveEdgeKeys = new Set(EDGES.map(edge => `${edge.source}->${edge.target}`));
const liveEitherDirection = new Set(EDGES.flatMap(edge => [
  `${edge.source}->${edge.target}`,
  `${edge.target}->${edge.source}`
]));

let metricContracts = { contracts: [] };
let connectionResearch = [];
try { metricContracts = JSON.parse(await fs.readFile(path.resolve('public/node-metric-contracts.json'), 'utf8')); } catch {}
try { connectionResearch = JSON.parse(await fs.readFile(path.resolve('public/connection-research.json'), 'utf8')); } catch {}

const measuredNodeIds = new Set(Object.keys(metricContracts.contracts || {}));
const sourceBackedResearchKeys = new Set(connectionResearch.map(item => `${item.source_id}->${item.target_id}`));

const outgoing = new Map(NODES.map(node => [node.id, []]));
const degree = new Map(NODES.map(node => [node.id, 0]));
for (const edge of EDGES) {
  outgoing.get(edge.source)?.push(edge);
  degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
  degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
}

const motifByKey = new Map();
for (const first of EDGES) {
  for (const second of outgoing.get(first.target) || []) {
    if (first.source === second.target) continue;
    const edgeKey = `${first.source}->${second.target}`;
    if (liveEitherDirection.has(edgeKey) || REJECTED_LEGACY_EDGE_KEYS.has(edgeKey)) continue;
    const record = motifByKey.get(edgeKey) || {
      edge_key: edgeKey,
      source_id: first.source,
      target_id: second.target,
      mediators: []
    };
    if (!record.mediators.some(item => item.node_id === first.target)) {
      record.mediators.push({
        node_id: first.target,
        node_name: nodeById.get(first.target)?.name || first.target,
        path: [
          {
            edge_key: `${first.source}->${first.target}`,
            relationship_level: first.evidence?.relationship_level || 'unspecified',
            confidence: first.evidence?.confidence || 'unassessed',
            relationship_source_urls: first.evidence?.relationship_source_urls || []
          },
          {
            edge_key: `${second.source}->${second.target}`,
            relationship_level: second.evidence?.relationship_level || 'unspecified',
            confidence: second.evidence?.confidence || 'unassessed',
            relationship_source_urls: second.evidence?.relationship_source_urls || []
          }
        ]
      });
    }
    motifByKey.set(edgeKey, record);
  }
}

const candidates = [...motifByKey.values()]
  .filter(item => item.mediators.length >= 2)
  .filter(item => !sourceBackedResearchKeys.has(item.edge_key))
  .map(item => {
    const source = nodeById.get(item.source_id);
    const target = nodeById.get(item.target_id);
    const highPaths = item.mediators.reduce((sum, mediator) => sum + (mediator.path.every(edge => edge.confidence === 'high') ? 1 : 0), 0);
    const directLegs = item.mediators.reduce((sum, mediator) => sum + mediator.path.filter(edge => edge.relationship_level === 'direct').length, 0);
    const endpointMeasurementReady = measuredNodeIds.has(item.source_id) && measuredNodeIds.has(item.target_id);
    const topologyScore = item.mediators.length * 12 + highPaths * 5 + directLegs * 2
      + Math.min(20, ((degree.get(item.source_id) || 0) + (degree.get(item.target_id) || 0)) / 4)
      + (endpointMeasurementReady ? 8 : 0);
    return {
      candidate_origin: 'directed_two_hop_topology_motif',
      edge_key: item.edge_key,
      source_id: item.source_id,
      source_name: source?.name || item.source_id,
      target_id: item.target_id,
      target_name: target?.name || item.target_id,
      candidate_relationship_type: 'unresolved_research_hypothesis',
      candidate_confidence: 'unassessed',
      topology_score: Number(topologyScore.toFixed(2)),
      endpoint_measurement_ready: endpointMeasurementReady,
      mediators: item.mediators
        .sort((a, b) => Number(b.path.every(edge => edge.confidence === 'high')) - Number(a.path.every(edge => edge.confidence === 'high')))
        .slice(0, 8),
      hypothesis: `${source?.name || item.source_id} and ${target?.name || item.target_id} participate in at least ${item.mediators.length} directed two-hop paths in the reviewed graph. This is a search hypothesis only; transitivity does not establish a real relationship.`,
      evidence_boundary: 'The cited path-leg sources support only the two existing relationships. They do not support the collapsed source-to-target candidate. Promotion requires a new relationship-specific source that directly addresses the proposed direction, mechanism, geography, period, moderators and alternatives.',
      graph_state: 'not_live_candidate',
      status: 'topology_hypothesis_awaiting_literature_discovery',
      auto_promotion: false
    };
  })
  .sort((a, b) => b.topology_score - a.topology_score || a.edge_key.localeCompare(b.edge_key))
  .slice(0, MAX_CANDIDATES);

const output = {
  version: 'topology_missing_link_intake_v1',
  generated_at: new Date().toISOString(),
  policy: 'Two-hop motifs prioritize literature searches only. They never establish transitivity, confidence, mechanism, or graph eligibility.',
  generation_contract: {
    minimum_distinct_mediators: 2,
    excludes_live_edges_in_either_direction: true,
    excludes_rejected_legacy_edges: true,
    excludes_connection_research_candidates: true,
    maximum_candidates: MAX_CANDIDATES
  },
  summary: {
    candidates: candidates.length,
    endpoint_measurement_ready: candidates.filter(item => item.endpoint_measurement_ready).length,
    distinct_source_nodes: new Set(candidates.map(item => item.source_id)).size,
    distinct_target_nodes: new Set(candidates.map(item => item.target_id)).size,
    live_edges_added: 0
  },
  candidates
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(output.summary, null, 2));
