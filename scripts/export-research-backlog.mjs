import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES, PUBLISHED_NODES, NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS, NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS, NONCAUSAL_GENERATED_METRIC_BINDINGS, REJECTED_LOW_DEGREE_ANCHOR_INFERENCE_EDGE_KEYS } from '../src/data.js';
import { OPEN_BACKLOG_WAVE_ONE_CAMPAIGN_PROMOTED_NODE_IDS } from '../src/open-backlog-wave-one-contracts.js';
import { UNSUPPORTED_FAMILY_RELATIONSHIP_DECISIONS } from '../src/relationship-rejection-decisions.js';

const publishedIds = new Set(PUBLISHED_NODES.map(node => node.id));
const degree = new Map(NODES.map(node => [node.id, 0]));
const incoming = new Map(NODES.map(node => [node.id, 0]));
const outgoing = new Map(NODES.map(node => [node.id, 0]));
for (const edge of EDGES) {
  degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
  degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
  outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1);
  incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
}

function disposition(node) {
  const totalDegree = degree.get(node.id) || 0;
  const nodeClass = node.graph_contract?.node_class || 'missing';
  const exactTerm = node.authenticity?.exact_label_validated === true;
  const nodeSpecific = node.authenticity?.source_scope === 'node_specific';
  const generated = node.calibration?.role === 'generated';
  const sourceUrls = node.calibration?.source_urls || [];

  if (node.id.startsWith('evidence_') || node.id.startsWith('extension_')) {
    return {
      action: 'retain_as_edge_metric_not_live_causal_node',
      priority: 3,
      status: 'resolved',
      rationale: 'This record is an operational measurement or evidence field, not an independent causal driver; retain it on the relationship dossier and exclude it from the live causal sphere.'
    };
  }

  if (!exactTerm && generated) {
    return {
      action: sourceUrls.length ? 'normalize_or_merge_generated_label' : 'retire_unsubstantiated_label',
      priority: totalDegree === 0 ? 2 : 3,
      rationale: sourceUrls.length
        ? 'The topic has inherited evidence, but the exact generated wording is not validated; normalize or merge it before relationship research.'
        : 'Neither the exact term nor a node-specific evidence base is established; retirement is safer than inventing graph support.'
    };
  }
  if (totalDegree >= 3) {
    return {
      action: 'repair_core_dependencies',
      priority: 1,
      rationale: 'The node already has at least three relationships but is disconnected by iterative pruning; repair or merge its weak neighboring chain before adding more edges.'
    };
  }
  if (nodeClass === 'authored_root_driver' && exactTerm && nodeSpecific) {
    return {
      action: 'research_effects_for_root_driver',
      priority: totalDegree === 2 ? 1 : 2,
      rationale: 'Incoming-driver exemption is valid, but the live sphere still requires three defensible total relationships.'
    };
  }
  if (nodeClass === 'authored_root_driver') {
    return {
      action: 'validate_root_driver_class_then_research_effects_or_merge',
      priority: totalDegree === 2 ? 1 : 2,
      rationale: 'The node was authored as a causal input, but its exact label or independent evidence scope is incomplete; confirm the class, then add bounded effects or merge it into a stronger driver.'
    };
  }
  if (nodeClass === 'operational_indicator' && node.metric_contract?.metric_id) {
    return {
      action: 'connect_indicator_to_measured_system',
      priority: totalDegree === 2 ? 1 : 2,
      rationale: 'Keep this measurable indicator only if its upstream condition and downstream interpretation are explicitly contracted.'
    };
  }
  if (totalDegree === 0) {
    return {
      action: 'exact_term_research_then_promote_or_retire',
      priority: 2,
      rationale: 'The node is orphaned and needs exact-term validation before any causal edge campaign.'
    };
  }
  if (nodeClass === 'phenomenon') {
    return {
      action: 'research_bounded_drivers_and_effects',
      priority: totalDegree === 2 ? 1 : 2,
      rationale: 'A phenomenon needs enough relationship-specific evidence to satisfy both its driver contract and the live degree floor.'
    };
  }
  return {
    action: 'manual_ontology_review',
    priority: 3,
    rationale: 'The present class, evidence scope, or topology is insufficient for automatic promotion.'
  };
}

function campaignContract(node, decision) {
  const open = (decision.status || 'open') === 'open';
  const action = decision.action;
  const totalDegree = degree.get(node.id) || 0;
  const needsExactTermReview = node.authenticity?.exact_label_validated !== true;
  const needsNodeSpecificEvidence = node.authenticity?.source_scope !== 'node_specific';
  const requiredRelationshipDossiers = open ? Math.max(0, 3 - totalDegree) : 0;

  const topologyLane = !open
    ? 'resolved_noncausal_record'
    : totalDegree === 0
      ? 'orphan_resolution'
      : totalDegree === 1
        ? 'single_relationship_rehabilitation'
        : totalDegree === 2
          ? 'near_floor_repair'
          : 'disconnected_cluster_restructure';

  const evidenceLane = !open
    ? 'resolved'
    : needsExactTermReview && needsNodeSpecificEvidence
      ? 'exact_term_and_node_specific_evidence'
      : needsExactTermReview
        ? 'exact_term_validation'
        : needsNodeSpecificEvidence
          ? 'node_specific_evidence'
          : 'relationship_dossier_completion';

  const workstream = action.includes('normalize_or_merge') || action.includes('exact_term') || action.includes('retire_')
    ? topologyLane
    : action.includes('root_driver')
      ? 'root_driver_validation_and_effects'
      : action.includes('indicator')
        ? 'indicator_system_contracts'
        : action === 'repair_core_dependencies'
          ? 'dependency_chain_repair'
          : action === 'research_bounded_drivers_and_effects'
            ? 'phenomenon_relationship_research'
            : action === 'manual_ontology_review'
              ? 'manual_ontology_resolution'
              : 'noncausal_record_retention';

  const researchQuestions = [];
  if (needsExactTermReview && open) {
    researchQuestions.push('Is this exact term used by a primary, peer-reviewed, or authoritative source, or should it be normalized, merged, or retired?');
  }
  if (open && action.includes('root_driver')) {
    researchQuestions.push('Is this appropriately an authored root driver, and which bounded downstream effects are supported by relationship-specific evidence?');
  } else if (open && action.includes('indicator')) {
    researchQuestions.push('Which measured upstream condition and downstream system interpretation does this indicator validly represent?');
  } else if (open) {
    researchQuestions.push('Which incoming drivers and downstream effects have explicit mechanisms, bounded scope, and relationship-specific sources?');
  }
  if (needsNodeSpecificEvidence && open) {
    researchQuestions.push('Which node-specific sources support this record independently of inherited family or anchor evidence?');
  }

  const promotionBlockers = [];
  if (needsExactTermReview) promotionBlockers.push('exact_term_unverified');
  if (needsNodeSpecificEvidence) promotionBlockers.push('node_specific_evidence_missing');
  if (requiredRelationshipDossiers > 0) promotionBlockers.push(`relationship_dossiers_missing:${requiredRelationshipDossiers}`);
  if (!node.metric_contract?.metric_id && node.graph_contract?.node_class === 'operational_indicator') promotionBlockers.push('metric_contract_missing');

  return {
    review_scope: 'full_campaign_backlog',
    review_eligible: true,
    campaign_scope: open ? 'full_open_backlog' : 'resolved_noncausal_record',
    campaign_eligible: open,
    campaign_wave: open ? 'continuous_exhaustive_review' : 'not_applicable',
    topology_lane: topologyLane,
    evidence_lane: evidenceLane,
    workstream,
    required_relationship_dossiers: requiredRelationshipDossiers,
    needs_exact_term_review: needsExactTermReview,
    needs_node_specific_evidence: needsNodeSpecificEvidence,
    promotion_blockers: promotionBlockers,
    research_questions: researchQuestions,
    relationship_dossier_contract: open ? [
      'source_and_target',
      'direction_and_bounded_mechanism',
      'geographic_and_temporal_scope',
      'moderators_and_alternative_explanations',
      'exact_relationship_source_locators',
      'confidence_and_counterevidence',
      'associated_measurable_indicator',
      'evidence_basis_direct_indirect_inferred_or_extrapolated'
    ] : []
  };
}

const backlog = NODES
  .filter(node => !publishedIds.has(node.id))
  .map(node => {
    const decision = disposition(node);
    const campaign = campaignContract(node, decision);
    return {
      id: node.id,
      display_name: node.name,
      sphere: node.sphere,
      node_class: node.graph_contract?.node_class || 'missing',
      total_degree: degree.get(node.id) || 0,
      incoming_relationships: incoming.get(node.id) || 0,
      outgoing_relationships: outgoing.get(node.id) || 0,
      relationships_needed_for_degree_floor: Math.max(0, 3 - (degree.get(node.id) || 0)),
      exact_label_validated: node.authenticity?.exact_label_validated === true,
      evidence_scope: node.authenticity?.source_scope || 'missing',
      metric_contract_id: node.metric_contract?.metric_id || null,
      source_urls: node.calibration?.source_urls || [],
      action: decision.action,
      priority: decision.priority,
      rationale: decision.rationale,
      status: decision.status || 'open',
      ...campaign
    };
  })
  .sort((a, b) => a.priority - b.priority || b.total_degree - a.total_degree || a.display_name.localeCompare(b.display_name));

function titleFromId(id) {
  return String(id)
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function metricResolutionRecords(bindings, resolutionType) {
  return Object.entries(bindings).map(([id, binding]) => ({
    id,
    display_name: titleFromId(id),
    sphere: 'resolved metric ledger',
    node_class: resolutionType === 'root_driver_metric' ? 'authored_root_driver_metric' : 'operational_indicator',
    total_degree: null,
    incoming_relationships: null,
    outgoing_relationships: null,
    relationships_needed_for_degree_floor: 0,
    exact_label_validated: true,
    evidence_scope: 'relationship_or_metric_specific',
    metric_contract_id: binding.metric_id || null,
    source_urls: binding.source_urls || [],
    action: binding.binding_type || 'canonical_node_metric_alias',
    priority: 4,
    rationale: binding.decision || 'Resolved as a bounded measurement on a canonical graph node.',
    status: 'resolved',
    review_scope: 'full_campaign_backlog',
    review_eligible: true,
    campaign_scope: 'resolved_metric_record',
    campaign_eligible: false,
    campaign_wave: 'not_applicable',
    topology_lane: 'resolved_metric_binding',
    evidence_lane: 'resolved',
    workstream: resolutionType,
    required_relationship_dossiers: 0,
    needs_exact_term_review: false,
    needs_node_specific_evidence: false,
    promotion_blockers: [],
    research_questions: [],
    relationship_dossier_contract: [],
    canonical_node_id: binding.canonical_node_id || null,
    resolution_type: resolutionType,
    reviewed_at: binding.reviewed_at || null
  }));
}

const resolvedMetricRecords = [
  ...metricResolutionRecords(NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS, 'root_driver_metric'),
  ...metricResolutionRecords(NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS, 'operational_indicator_metric'),
  ...metricResolutionRecords(NONCAUSAL_GENERATED_METRIC_BINDINGS, 'generated_metric_alias')
].sort((a, b) => a.display_name.localeCompare(b.display_name));
const resolvedPromotionRecords = OPEN_BACKLOG_WAVE_ONE_CAMPAIGN_PROMOTED_NODE_IDS
  .map(id => PUBLISHED_NODES.find(node => node.id === id))
  .filter(Boolean)
  .map(node => ({
    id: node.id,
    display_name: node.name,
    sphere: node.sphere,
    node_class: node.graph_contract?.node_class || 'phenomenon',
    total_degree: degree.get(node.id) || 0,
    incoming_relationships: incoming.get(node.id) || 0,
    outgoing_relationships: outgoing.get(node.id) || 0,
    relationships_needed_for_degree_floor: 0,
    exact_label_validated: node.authenticity?.exact_label_validated === true,
    evidence_scope: node.authenticity?.source_scope || 'node_specific',
    metric_contract_id: node.metric_contract?.metric_id || null,
    source_urls: node.calibration?.source_urls || [],
    action: 'promoted_to_published_graph',
    priority: 4,
    rationale: 'Promoted after node-specific review, bounded relationship dossiers, metric-contract completion, and the applicable driver gate.',
    status: 'resolved',
    review_scope: 'full_campaign_backlog',
    review_eligible: true,
    campaign_scope: 'resolved_promotion_record',
    campaign_eligible: false,
    campaign_wave: 'not_applicable',
    topology_lane: 'published_degree_three_core',
    evidence_lane: 'resolved',
    workstream: 'researched_relationship_promotion',
    required_relationship_dossiers: 0,
    needs_exact_term_review: false,
    needs_node_specific_evidence: false,
    promotion_blockers: [],
    research_questions: [],
    relationship_dossier_contract: [],
    canonical_node_id: node.id,
    resolution_type: 'published_promotion',
    reviewed_at: '2026-07-17'
  }));
const campaignRecords = [...backlog, ...resolvedMetricRecords, ...resolvedPromotionRecords];

const countBy = key => Object.fromEntries([...backlog.reduce((counts, item) => {
  const value = item[key] ?? 'missing';
  counts.set(String(value), (counts.get(String(value)) || 0) + 1);
  return counts;
}, new Map())].sort(([a], [b]) => a.localeCompare(b)));

const registry = {
  version: 'full_research_backlog_v3',
  generated_at: new Date().toISOString(),
  policy: 'Every registered backlog and resolution record is reviewable. Every unresolved record is immediately eligible for research; there is no fixed-size frontier or hand-selected next-node subset. Promotion still requires real relationship-specific evidence, and unsupported nodes are normalized, merged, held, or retired instead of receiving synthetic edges.',
  campaign: {
    scope: 'entire_registered_backlog',
    scheduling: 'continuous_exhaustive_review',
    fixed_batch_limit: null,
    review_policy: 'All campaign records, including prior metric bindings, merges, and promotions, remain reviewable and may be reopened when stronger evidence changes the disposition.',
    promotion_policy: 'Every registered record remains visible to the campaign. Open records can proceed in any evidence-ready order, while resolved records remain reviewable and only records satisfying their ontology, evidence, metric, and relationship gates enter the live causal graph.',
    execution_model: 'All topology and evidence lanes are open concurrently. Lane labels organize the work; they do not limit eligibility or impose a batch frontier.'
  },
  summary: {
    backlog_nodes: backlog.length,
    open_backlog_nodes: backlog.filter(item => item.status === 'open').length,
    campaign_eligible_nodes: backlog.filter(item => item.campaign_eligible).length,
    resolved_noncausal_records: backlog.filter(item => item.status === 'resolved').length,
    resolved_root_driver_metric_records: Object.keys(NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS).length,
    resolved_operational_indicator_metric_records: Object.keys(NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS).length,
    resolved_generated_metric_records: Object.keys(NONCAUSAL_GENERATED_METRIC_BINDINGS).length,
    resolved_promotion_records: resolvedPromotionRecords.length,
    rejected_low_degree_anchor_inference_relationships: REJECTED_LOW_DEGREE_ANCHOR_INFERENCE_EDGE_KEYS.length,
    rejected_unsupported_family_relationships: Object.keys(UNSUPPORTED_FAMILY_RELATIONSHIP_DECISIONS).length,
    resolved_campaign_records: campaignRecords.filter(item => item.status === 'resolved').length,
    campaign_reviewable_records: campaignRecords.filter(item => item.review_eligible === true).length,
    total_campaign_records_accounted_for: campaignRecords.length,
    minimum_relationships_if_every_node_were_independently_repaired: backlog.reduce((sum, item) => sum + item.relationships_needed_for_degree_floor, 0),
    by_action: countBy('action'),
    by_priority: countBy('priority'),
    by_node_class: countBy('node_class'),
    by_degree: countBy('total_degree')
  },
  execution_queue: backlog.filter(item => item.status === 'open').map(item => item.id),
  review_queue: campaignRecords.map(item => item.id),
  execution_lanes: Object.fromEntries([...backlog.filter(item => item.status === 'open').reduce((lanes, item) => {
    if (!lanes.has(item.topology_lane)) lanes.set(item.topology_lane, []);
    lanes.get(item.topology_lane).push(item.id);
    return lanes;
  }, new Map())]),
  resolution_ledger: backlog.filter(item => item.status === 'resolved').map(item => item.id),
  nodes: backlog,
  campaign_records: campaignRecords,
  resolved_metric_records: resolvedMetricRecords,
  resolved_promotion_records: resolvedPromotionRecords,
  resolved_root_driver_metric_bindings: NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS,
  resolved_operational_indicator_metric_bindings: NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS,
  rejected_low_degree_anchor_inference_edge_keys: REJECTED_LOW_DEGREE_ANCHOR_INFERENCE_EDGE_KEYS,
  rejected_unsupported_family_relationship_decisions: UNSUPPORTED_FAMILY_RELATIONSHIP_DECISIONS,
  resolved_generated_metric_bindings: NONCAUSAL_GENERATED_METRIC_BINDINGS
};

const csvFields = ['id', 'display_name', 'sphere', 'node_class', 'total_degree', 'incoming_relationships', 'outgoing_relationships', 'relationships_needed_for_degree_floor', 'exact_label_validated', 'evidence_scope', 'metric_contract_id', 'action', 'priority', 'status', 'review_scope', 'review_eligible', 'campaign_scope', 'campaign_eligible', 'campaign_wave', 'topology_lane', 'evidence_lane', 'workstream', 'required_relationship_dossiers', 'needs_exact_term_review', 'needs_node_specific_evidence', 'promotion_blockers', 'research_questions', 'rationale'];
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csv = [csvFields.join(','), ...campaignRecords.map(item => csvFields.map(field => csvCell(item[field])).join(','))].join('\n');

await Promise.all([
  fs.writeFile(path.resolve('public/research-backlog.json'), `${JSON.stringify(registry, null, 2)}\n`),
  fs.writeFile(path.resolve('public/research-backlog.csv'), `${csv}\n`)
]);

console.log(JSON.stringify({ outputs: ['public/research-backlog.json', 'public/research-backlog.csv'], summary: registry.summary }, null, 2));
