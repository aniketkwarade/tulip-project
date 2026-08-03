import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES, NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS, NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS, NONCAUSAL_GENERATED_METRIC_BINDINGS } from '../src/data.js';
import {
  CASCADE_ANCHOR_IDS,
  CASCADE_ANCHOR_RELATIONSHIPS,
  CASCADE_UNSUPPORTED_EDGE_KEYS,
  hasCompletePromotedDossier
} from '../src/cascade-anchor-contracts.js';
import {
  FIRST_50_ANCHOR_REPAIR_IDS,
  NODE_METRIC_CONTRACTS,
  PHENOMENON_PROMOTION_CANDIDATES,
  REHABILITATED_GENERATED_NODE_IDS
} from '../src/northstar-contracts.js';
import {
  PROMOTED_EXPANSION_NODE_IDS,
  PROMOTED_EXPANSION_RELATIONSHIPS,
  PROMOTION_APPROVALS,
  hasCompleteExpansionDossier
} from '../src/promoted-expansion-contracts.js';
import { INGESTION_JOB_CONTRACTS } from '../src/ingestion-job-contracts.js';
import { CARBON_EFFECT_METRIC_BINDINGS } from '../src/carbon-emission-expansion-contracts.js';

const PUBLIC_DIR = path.resolve('public');
const generatedAt = new Date().toISOString();
let phenomenonResearch = { missing_phenomenon_candidates: [] };
try {
  phenomenonResearch = JSON.parse(
    await fs.readFile(path.resolve('tmp-phenomenon-ingestion-research.json'), 'utf8')
  );
} catch {
  // The compact promotion registry still exports; detailed dossiers remain absent until research is restored.
}
const researchByName = new Map(
  (phenomenonResearch.missing_phenomenon_candidates || [])
    .map(candidate => [candidate.candidate, candidate])
);

const graphContractRegistry = {
  version: 'northstar_graph_contract_v1',
  generated_at: generatedAt,
  source: 'src/data.js live export',
  node_classes: ['phenomenon', 'operational_indicator', 'response', 'authored_root_driver'],
  policies: {
    phenomenon_driver_gate: 3,
    operational_indicator_driver_gate: 1,
    response_driver_gate: 0,
    authored_root_driver_gate: 0,
    promotion_boundary: 'Only relationship-specific, bounded evidence contracts are promoted into the live graph. Candidate phenomena remain outside NODES and EDGES until separately approved.',
    composite_label_policy: 'Reject labels that blend pressure, state, and impact unless every component is independently measurable and the combined construct has a defensible common unit.'
  },
  summary: {
    nodes: NODES.length,
    edges: EDGES.length,
    first_anchor_repair_batch: FIRST_50_ANCHOR_REPAIR_IDS.length,
    cascade_anchor_dossier_batch: CASCADE_ANCHOR_IDS.length,
    promoted_cascade_edge_dossiers: CASCADE_ANCHOR_RELATIONSHIPS.filter(hasCompletePromotedDossier).length,
    promoted_outcome_system_anchors: PROMOTED_EXPANSION_NODE_IDS.length,
    promoted_outcome_system_edge_dossiers: PROMOTED_EXPANSION_RELATIONSHIPS.filter(hasCompleteExpansionDossier).length,
    rehabilitated_generated_nodes: REHABILITATED_GENERATED_NODE_IDS.size,
    nodes_by_class: Object.fromEntries(
      Object.entries(NODES.reduce((counts, node) => {
        const key = node.graph_contract?.node_class || 'missing';
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {})).sort(([a], [b]) => a.localeCompare(b))
    ),
    driver_gate_status: Object.fromEntries(
      Object.entries(NODES.reduce((counts, node) => {
        const key = node.graph_contract?.driver_gate?.status || 'missing';
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {})).sort(([a], [b]) => a.localeCompare(b))
    )
  },
  first_anchor_repair_batch: FIRST_50_ANCHOR_REPAIR_IDS.map(id => {
    const node = NODES.find(candidate => candidate.id === id);
    return {
      id,
      name: node?.name || null,
      sphere: node?.sphere || null,
      driver_gate: node?.graph_contract?.driver_gate || null
    };
  }),
  cascade_anchor_dossier_batch: CASCADE_ANCHOR_IDS.map(id => {
    const node = NODES.find(candidate => candidate.id === id);
    return {
      id,
      name: node?.name || null,
      sphere: node?.sphere || null,
      driver_gate: node?.graph_contract?.driver_gate || null,
      promoted_driver_edge_keys: EDGES.filter(edge => (
        edge.target === id && hasCompletePromotedDossier(edge)
      )).map(edge => `${edge.source}->${edge.target}`)
    };
  }),
  rehabilitated_generated_nodes: [...REHABILITATED_GENERATED_NODE_IDS].map(id => {
    const node = NODES.find(candidate => candidate.id === id);
    return {
      id,
      name: node?.name || null,
      sphere: node?.sphere || null,
      driver_gate: node?.graph_contract?.driver_gate || null,
      outgoing_effects: node?.graph_contract?.observed_outgoing_effects || 0,
      authenticity: node?.authenticity || null
    };
  })
};

const metricRegistry = {
  version: 'northstar_metric_contract_v1',
  generated_at: generatedAt,
  required_fields: [
    'metric_id',
    'metric_name',
    'unit',
    'geography',
    'cadence',
    'observation_time_field',
    'source_id',
    'transformation',
    'uncertainty',
    'threshold_provenance',
    'failure_behavior'
  ],
  bindings: Object.fromEntries(Object.entries(NODE_METRIC_CONTRACTS).map(([ownerId, contract]) => {
    const edgeBinding = CARBON_EFFECT_METRIC_BINDINGS[ownerId] || NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS[ownerId] || NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS[ownerId] || NONCAUSAL_GENERATED_METRIC_BINDINGS[ownerId] || null;
    return [ownerId, {
      metric_id: contract.metric_id,
      binding_type: edgeBinding?.binding_type || (edgeBinding ? 'edge_evidence_metric' : 'node_metric'),
      canonical_node_id: edgeBinding?.canonical_node_id || ownerId,
      edge_key: edgeBinding?.edge_key || edgeBinding?.replaced_edge_key || null,
      disposition: edgeBinding?.disposition || null
    }];
  })),
  noncausal_root_driver_metric_bindings: NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS,
  noncausal_operational_indicator_metric_bindings: NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS,
  noncausal_generated_metric_bindings: NONCAUSAL_GENERATED_METRIC_BINDINGS,
  contracts: NODE_METRIC_CONTRACTS
};

const promotionRegistry = {
  version: 'northstar_phenomenon_promotion_v2',
  generated_at: generatedAt,
  research_artifact: 'deep-research-report (12).md',
  policy: 'Research-ready is not graph-ready. Staged candidates require explicit one-by-one approval after live duplicate review, source readback, relationship contracts, and a metric decision.',
  summary: {
    source_candidates: PHENOMENON_PROMOTION_CANDIDATES.length,
    approved_and_promoted: PHENOMENON_PROMOTION_CANDIDATES.filter(candidate => candidate.status === 'approved_and_promoted').length,
    staged_new: PHENOMENON_PROMOTION_CANDIDATES.filter(candidate => candidate.status === 'staged_awaiting_explicit_promotion_approval').length,
    metric_merges: PHENOMENON_PROMOTION_CANDIDATES.filter(candidate => candidate.status === 'merged_metric_only').length,
    deferred: PHENOMENON_PROMOTION_CANDIDATES.filter(candidate => candidate.status === 'deferred_research_track').length,
    rejected: PHENOMENON_PROMOTION_CANDIDATES.filter(candidate => candidate.status === 'rejected_ontology').length
  },
  candidates: PHENOMENON_PROMOTION_CANDIDATES.map(candidate => {
    const research = researchByName.get(candidate.original_name);
    const approval = PROMOTION_APPROVALS.find(item => item.id === candidate.canonical_id);
    const approvalStatus = candidate.status === 'approved_and_promoted'
      ? 'approved_and_promoted'
      : candidate.status === 'staged_awaiting_explicit_promotion_approval'
      ? 'awaiting_explicit_promotion_approval'
      : candidate.status === 'merged_metric_only'
        ? 'not_applicable_metric_merge'
        : candidate.status === 'rejected_ontology'
          ? 'not_applicable_rejected'
          : 'not_applicable_deferred';
    return {
      ...candidate,
      gap_type: research?.status || null,
      rationale: research?.why_missing || null,
      proposed_driver_ids: research?.candidate_drivers || candidate.proposed_driver_ids || [],
      proposed_effect_ids: research?.candidate_effects || candidate.proposed_effect_ids || [],
      official_sources: research?.official_sources || candidate.official_sources || [],
      approval: {
        status: approvalStatus,
        approved_at: approval?.approved_at || null,
        approved_by: approval ? 'northstar_review_sequence' : null,
        sequence: approval?.sequence || null,
        boundary: approval?.boundary || null
      }
    };
  })
};

const cascadeAnchorDossierRegistry = {
  version: 'cascade_anchor_edge_dossier_v1',
  generated_at: generatedAt,
  policy: {
    qualification: 'A cascade anchor passes only with at least three incoming direct or indirect relationships carrying complete promoted dossiers, moderate-or-high confidence, two source locators, bounded mechanism and scope, counterevidence, and an associated indicator.',
    unsupported_edge_removal: [...CASCADE_UNSUPPORTED_EDGE_KEYS],
    unsourced_edge_quarantine: 'Inferred or extrapolated relationships touching a cascade anchor are omitted from the live graph until relationship-specific sources are supplied.'
  },
  summary: {
    anchors: CASCADE_ANCHOR_IDS.length,
    promoted_dossiers: CASCADE_ANCHOR_RELATIONSHIPS.filter(hasCompletePromotedDossier).length,
    live_promoted_dossiers: EDGES.filter(hasCompletePromotedDossier).length,
    unsupported_edges_removed: CASCADE_UNSUPPORTED_EDGE_KEYS.size
  },
  anchors: CASCADE_ANCHOR_IDS.map(id => {
    const node = NODES.find(candidate => candidate.id === id);
    return {
      id,
      name: node?.name || null,
      driver_gate: node?.graph_contract?.driver_gate || null,
      dossiers: EDGES.filter(edge => edge.target === id && hasCompletePromotedDossier(edge)).map(edge => ({
        edge_key: `${edge.source}->${edge.target}`,
        relationship_level: edge.evidence.relationship_level,
        confidence: edge.evidence.confidence,
        ...edge.evidence.dossier
      }))
    };
  })
};

const promotedPhenomenonDossierRegistry = {
  version: 'promoted_phenomenon_edge_dossier_v1',
  generated_at: generatedAt,
  policy: 'Each approved phenomenon requires three complete incoming dossiers and one bounded downstream effect dossier.',
  summary: { anchors: PROMOTED_EXPANSION_NODE_IDS.length, dossiers: PROMOTED_EXPANSION_RELATIONSHIPS.filter(hasCompleteExpansionDossier).length },
  anchors: PROMOTED_EXPANSION_NODE_IDS.map(id => ({
    id,
    approval: PROMOTION_APPROVALS.find(item => item.id === id) || null,
    driver_gate: NODES.find(node => node.id === id)?.graph_contract?.driver_gate || null,
    dossiers: EDGES.filter(edge => (edge.source === id || edge.target === id) && hasCompleteExpansionDossier(edge)).map(edge => ({
      edge_key: `${edge.source}->${edge.target}`,
      relationship_level: edge.evidence.relationship_level,
      confidence: edge.evidence.confidence,
      ...edge.evidence.dossier
    }))
  }))
};

const ingestionJobRegistry = {
  version: 'northstar_ingestion_job_registry_v1',
  generated_at: generatedAt,
  policy: 'Every job names the metric or edge-evidence contract it serves and declares cadence, provenance, uncertainty, and failure behavior.',
  summary: { jobs: INGESTION_JOB_CONTRACTS.length, contract_bindings: INGESTION_JOB_CONTRACTS.reduce((sum, item) => sum + item.contract_bindings.length, 0) },
  jobs: INGESTION_JOB_CONTRACTS
};

await fs.mkdir(PUBLIC_DIR, { recursive: true });
await Promise.all([
  fs.writeFile(path.join(PUBLIC_DIR, 'graph-contract-registry.json'), `${JSON.stringify(graphContractRegistry, null, 2)}\n`),
  fs.writeFile(path.join(PUBLIC_DIR, 'node-metric-contracts.json'), `${JSON.stringify(metricRegistry, null, 2)}\n`),
  fs.writeFile(path.join(PUBLIC_DIR, 'phenomenon-promotion-registry.json'), `${JSON.stringify(promotionRegistry, null, 2)}\n`),
  fs.writeFile(path.join(PUBLIC_DIR, 'anchor-edge-dossiers.json'), `${JSON.stringify(cascadeAnchorDossierRegistry, null, 2)}\n`),
  fs.writeFile(path.join(PUBLIC_DIR, 'promoted-phenomenon-edge-dossiers.json'), `${JSON.stringify(promotedPhenomenonDossierRegistry, null, 2)}\n`),
  fs.writeFile(path.join(PUBLIC_DIR, 'ingestion-job-registry.json'), `${JSON.stringify(ingestionJobRegistry, null, 2)}\n`)
]);

console.log(JSON.stringify({
  graph_contract_registry: 'public/graph-contract-registry.json',
  node_metric_contracts: 'public/node-metric-contracts.json',
  phenomenon_promotion_registry: 'public/phenomenon-promotion-registry.json',
  anchor_edge_dossiers: 'public/anchor-edge-dossiers.json',
  promoted_phenomenon_edge_dossiers: 'public/promoted-phenomenon-edge-dossiers.json',
  ingestion_job_registry: 'public/ingestion-job-registry.json',
  node_count: NODES.length,
  edge_count: EDGES.length
}, null, 2));
