import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

import { EDGES, NODES } from '../src/data.js';
import { INGESTION_JOB_CONTRACTS } from '../src/ingestion-job-contracts.js';
import { MANUAL_FULL_TEXT_PROMOTIONS } from '../src/literature-full-text-decisions.js';
import {
  CLOSED_MISSING_LINK_CANDIDATE_KEYS,
  MISSING_LINK_CANDIDATE_DECISIONS
} from '../src/missing-link-candidate-decisions.js';
import { ANALYTICAL_LABEL_REVIEW } from '../src/analytical-label-review.js';
import { MANUAL_READBACK_EDGE_KEYS } from '../src/relationship-evidence-governance.js';
import { REGIONAL_HUB_PROFILES } from '../src/regional-hub-profiles.js';
import { NODE_METRIC_CONTRACTS } from '../src/northstar-contracts.js';

const failures = [];
const confidenceEnum = new Set(['low', 'moderate', 'high']);
const quantitativeFields = ['effect_direction', 'effect_magnitude', 'uncertainty', 'evidence_design', 'population', 'sample_period', 'replication'];
const edgeByKey = new Map(EDGES.map(edge => [`${edge.source}->${edge.target}`, edge]));
const nodeById = new Map(NODES.map(node => [node.id, node]));

for (const edge of EDGES) {
  const key = `${edge.source}->${edge.target}`;
  if (!confidenceEnum.has(edge.confidence) || edge.evidence?.confidence !== edge.confidence) failures.push(`${key}: invalid or inconsistent confidence`);
  if (!edge.evidence?.confidence_basis) failures.push(`${key}: missing confidence basis`);
  const quantitative = edge.evidence?.quantitative_evidence;
  if (!quantitative) {
    failures.push(`${key}: missing quantitative evidence envelope`);
    continue;
  }
  for (const field of quantitativeFields) if (quantitative[field] === undefined || quantitative[field] === null) failures.push(`${key}: missing quantitative field ${field}`);
  if (!['not_estimated_from_current_structured_evidence', 'source_reported_estimate'].includes(quantitative.effect_magnitude?.status)) failures.push(`${key}: effect magnitude lacks explicit scientific estimate status`);
  if (!['method_required_not_estimated', 'reported_qualitatively', 'quantified'].includes(quantitative.uncertainty?.status)) failures.push(`${key}: uncertainty lacks explicit status`);
  const relationshipQuant = quantitative.relationship_quantification;
  if (!relationshipQuant?.estimand || !Number.isFinite(relationshipQuant?.evidence_support_quantification?.score)) failures.push(`${key}: relationship quantification is incomplete`);
  if (!['estimand_defined_measurement_pending', 'estimand_blocked_by_missing_node_metric', 'source_reported_effect_estimate'].includes(relationshipQuant?.status)) failures.push(`${key}: invalid quantification status`);
  if (relationshipQuant?.scientific_effect_estimate?.status === 'source_reported_estimate') {
    const estimate = relationshipQuant.scientific_effect_estimate;
    if (!Number.isFinite(estimate.estimate) || !Number.isFinite(estimate.lower_bound) || !Number.isFinite(estimate.upper_bound) || !estimate.unit || !estimate.source_locator?.url || !estimate.source_locator?.section || !estimate.evidence_design || !estimate.boundary) failures.push(`${key}: source-reported estimate is incomplete`);
  }
  if (edge.influence === quantitative.effect_magnitude?.estimate) failures.push(`${key}: graph influence was misrepresented as an effect estimate`);
  if (edge.evidence?.confidence_basis === 'conservative_default_pending_reassessment') failures.push(`${key}: conservative confidence default remains pending`);
  if (edge.evidence?.confidence_basis === 'evidence_factor_reassessment_v1') {
    const reassessment = edge.evidence?.confidence_reassessment;
    if (!reassessment || reassessment.prior_state !== 'conservative_default_pending_reassessment' || reassessment.decision !== edge.confidence || !Number.isFinite(reassessment.score) || !reassessment.rationale) failures.push(`${key}: confidence reassessment is incomplete`);
  }
  if (edge.evidence?.confidence === 'low') {
    const readback = edge.evidence?.source_readback;
    if (readback?.status !== 'confirmed_bounded'
      || !readback.exact_claim
      || readback.source_locators?.length < 2
      || !readback.geographic_temporal_scope
      || !readback.moderators_and_counterevidence) {
      failures.push(`${key}: retained low-confidence relationship lacks a complete bounded source readback`);
    }
  }
}

for (const key of MANUAL_READBACK_EDGE_KEYS) {
  const readback = edgeByKey.get(key)?.evidence?.source_readback;
  if (!readback || readback.status !== 'confirmed_bounded' || readback.source_locators?.length < 2 || !readback.geographic_temporal_scope || !readback.moderators_and_counterevidence) {
    failures.push(`${key}: source readback is not closed`);
  }
}
for (const edge of EDGES) {
  const key = `${edge.source}->${edge.target}`;
  const readback = edge.evidence?.source_readback;
  if (readback && (readback.status !== 'confirmed_bounded'
    || !readback.exact_claim
    || readback.source_locators?.length < 2
    || !readback.geographic_temporal_scope
    || !readback.moderators_and_counterevidence)) {
    failures.push(`${key}: structured source readback is incomplete`);
  }
}

if (Object.keys(ANALYTICAL_LABEL_REVIEW).length !== 16) failures.push(`Expected 16 terminology decisions; found ${Object.keys(ANALYTICAL_LABEL_REVIEW).length}`);
for (const [nodeId, review] of Object.entries(ANALYTICAL_LABEL_REVIEW)) {
  const node = nodeById.get(nodeId);
  if (!node) failures.push(`${nodeId}: reviewed label node missing`);
  if (node?.name !== review.canonical_name || node?.terminology_review?.reviewed_at !== review.reviewed_at) failures.push(`${nodeId}: terminology decision not applied`);
  if (review.source_locators?.length < 2 || !review.disposition || !review.rationale) failures.push(`${nodeId}: terminology decision incomplete`);
}

const degree = new Map(NODES.map(node => [node.id, 0]));
for (const edge of EDGES) {
  degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
  degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
}
const top25Ids = [...degree.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 25).map(([id]) => id);
if (Object.keys(REGIONAL_HUB_PROFILES).length !== 25) failures.push(`Expected 25 regional profiles; found ${Object.keys(REGIONAL_HUB_PROFILES).length}`);
for (const nodeId of top25Ids) {
  const profile = nodeById.get(nodeId)?.regional_profile;
  if (!profile) failures.push(`${nodeId}: top-25 hub lacks regional profile`);
  if (!profile?.applies_where?.length || !profile?.weakens_where?.length || !profile?.evidence_absent_or_limited_where?.length || profile?.source_locators?.length < 2) failures.push(`${nodeId}: regional profile incomplete`);
}
for (const nodeId of Object.keys(REGIONAL_HUB_PROFILES)) if (!top25Ids.includes(nodeId)) failures.push(`${nodeId}: regional profile is not attached to the current top 25`);

const metricPath = path.resolve('public/priority-metric-operationalization-registry.json');
const metricRegistry = JSON.parse(await fs.readFile(metricPath, 'utf8'));
const sourceRegistry = JSON.parse(await fs.readFile(path.resolve('public/tulip-source-registry.json'), 'utf8'));
const activeMetricSources = new Map(sourceRegistry.sources
  .filter(source => source.platform_integration?.active)
  .filter(source => fsSync.existsSync(path.resolve('public', source.platform_integration.public_file)))
  .map(source => [source.id, source]));
const sourceServesMetric = (sourceId, metricId) => {
  const servedMetricIds = activeMetricSources.get(sourceId)?.platform_integration?.served_metric_ids;
  return activeMetricSources.has(sourceId)
    && (!Array.isArray(servedMetricIds) || servedMetricIds.includes(metricId));
};
const eligibleOperationalMetricIds = new Set(Object.entries(NODE_METRIC_CONTRACTS)
  .filter(([nodeId, contract]) => nodeById.has(nodeId) && sourceServesMetric(contract.source_id, contract.metric_id))
  .map(([, contract]) => contract.metric_id));
const eligibleExplicitOntologyMetricIds = new Set(INGESTION_JOB_CONTRACTS
  .flatMap(job => job.contract_bindings.map(binding => ({ job, binding })))
  .filter(({ binding }) => !nodeById.has(binding.node_id))
  .filter(({ job, binding }) => {
    const contract = NODE_METRIC_CONTRACTS[binding.node_id];
    const source = activeMetricSources.get(job.source_id);
    return contract
      && contract.source_id === job.source_id
      && contract.metric_id === binding.metric_contract_id
      && source?.platform_integration?.route === job.api_route
      && source?.platform_integration?.public_file === job.snapshot_file
      && source?.platform_integration?.measurement_ready_metric_ids?.includes(contract.metric_id);
  })
  .map(({ binding }) => binding.metric_contract_id));
const eligibleOperationalMetricCount = eligibleOperationalMetricIds.size + eligibleExplicitOntologyMetricIds.size;
if (metricRegistry.bindings?.length !== eligibleOperationalMetricCount) failures.push(`Expected ${eligibleOperationalMetricIds.size} eligible live-node and ${eligibleExplicitOntologyMetricIds.size} explicit ontology metric bindings; found ${metricRegistry.bindings?.length || 0}`);
const metricIds = new Set();
const eligibleTopHubMetricIds = new Set(Object.entries(NODE_METRIC_CONTRACTS)
  .filter(([nodeId, contract]) => top25Ids.includes(nodeId) && sourceServesMetric(contract.source_id, contract.metric_id))
  .map(([, contract]) => contract.metric_id));
for (const binding of metricRegistry.bindings || []) {
  const contract = NODE_METRIC_CONTRACTS[binding.node_id];
  if (!contract || contract.metric_id !== binding.metric_id) failures.push(`${binding.node_id}: operational binding does not match source metric contract`);
  if (metricIds.has(binding.metric_id)) failures.push(`${binding.metric_id}: duplicate priority metric binding`);
  metricIds.add(binding.metric_id);
  if (!binding.route || !binding.public_file || !binding.transformation || !binding.uncertainty || !binding.failure_behavior) failures.push(`${binding.metric_id}: incomplete operational contract`);
  if (!['measurement_snapshot_available', 'source_dataset_snapshot_available', 'support_or_catalog_only'].includes(binding.measurement_readiness)) failures.push(`${binding.metric_id}: measurement readiness is not explicit`);
  if (binding.measurement_readiness === 'support_or_catalog_only' && !binding.scoring_boundary?.includes('must not update')) failures.push(`${binding.metric_id}: support-only binding lacks scoring prohibition`);
  if (!fsSync.existsSync(path.resolve('public', binding.public_file))) failures.push(`${binding.metric_id}: bound source artifact missing`);
}
for (const metricId of eligibleOperationalMetricIds) if (!metricIds.has(metricId)) failures.push(`${metricId}: eligible live-node metric was omitted from operationalization`);
for (const metricId of eligibleExplicitOntologyMetricIds) if (!metricIds.has(metricId)) failures.push(`${metricId}: explicit ontology metric job was omitted from operationalization`);
for (const metricId of eligibleTopHubMetricIds) if (!metricIds.has(metricId)) failures.push(`${metricId}: eligible top-25 hub metric was not prioritized into the first 50`);
const lastHubPriority = Math.max(0, ...(metricRegistry.bindings || []).filter(binding => eligibleTopHubMetricIds.has(binding.metric_id)).map(binding => binding.priority));
const firstNonHubPriority = Math.min(Infinity, ...(metricRegistry.bindings || []).filter(binding => !eligibleTopHubMetricIds.has(binding.metric_id)).map(binding => binding.priority));
if (lastHubPriority >= firstNonHubPriority) failures.push('Eligible top-25 hub metrics were not ordered ahead of non-hub metrics');
for (const job of metricRegistry.jobs || []) {
  if (!job.cadence || !job.provenance || !job.uncertainty || !job.failure_behavior || !job.contract_bindings?.length) failures.push(`${job.job_id}: incomplete metric ingestion job`);
}

const queue = JSON.parse(await fs.readFile(path.resolve('public/missing-link-discovery-queue.json'), 'utf8'));
const literatureAdjudication = JSON.parse(await fs.readFile(path.resolve('public/literature-match-adjudication-registry.json'), 'utf8'));
const literatureIntake = JSON.parse(await fs.readFile(path.resolve('public/missing-link-literature-intake.json'), 'utf8'));
const intakeCycles = [
  { captured_at: literatureIntake.captured_at, results: literatureIntake.results || [] },
  ...(literatureIntake.refresh_history || [])
];
const intakeAdjudicationIds = new Set();
for (const cycle of intakeCycles) {
  for (const result of cycle.results || []) {
    for (const work of result.works || []) intakeAdjudicationIds.add(`${result.edge_key}::${work.doi || work.url}`);
  }
}
if (literatureAdjudication.summary?.matches_adjudicated !== intakeAdjudicationIds.size) failures.push(`Expected all ${intakeAdjudicationIds.size} retained literature matches adjudicated; found ${literatureAdjudication.summary?.matches_adjudicated || 0}`);
if (literatureAdjudication.summary?.manual_full_text_promotions !== MANUAL_FULL_TEXT_PROMOTIONS.length) failures.push(`Expected ${MANUAL_FULL_TEXT_PROMOTIONS.length} manual full-text promotion record(s); found ${literatureAdjudication.summary?.manual_full_text_promotions || 0}`);
if (literatureAdjudication.summary?.pending_adjudication !== 0) failures.push('Literature matches remain pending adjudication');
if (literatureAdjudication.summary?.metadata_promoted_directly_to_graph !== 0) failures.push('Bibliographic metadata was promoted directly to the graph');
const fullTextPromotions = (literatureAdjudication.decisions || []).filter(item => item.decision === 'full_text_confirmed_bounded_and_promoted');
if (literatureAdjudication.summary?.full_text_promoted_to_graph !== fullTextPromotions.length) failures.push('Full-text promotion summary does not match adjudication records');
for (const decision of literatureAdjudication.decisions || []) {
  if (!decision.edge_key || !decision.title || !decision.decision || !decision.rationale || !decision.evidence_boundary) failures.push(`${decision.adjudication_id || 'literature match'}: adjudication is incomplete`);
  const decisionIntakeDate = String(decision.intake_captured_at || '').slice(0, 10);
  if (decision.reviewer === 'northstar_metadata_adjudication_v1' && decision.reviewed_at !== decisionIntakeDate) {
    failures.push(`${decision.adjudication_id}: metadata review date drifted from the immutable intake capture date`);
  }
  if (decision.decision === 'full_text_confirmed_bounded_and_promoted') {
    if (decision.source_locators?.length < 2) failures.push(`${decision.adjudication_id}: full-text promotion lacks exact source locators`);
    if (!edgeByKey.has(decision.edge_key)) failures.push(`${decision.adjudication_id}: full-text promotion is absent from the live graph`);
  }
}
if (!queue.candidates?.length) failures.push('Continuous missing-link discovery queue is empty');
if (!queue.source_watch?.literature?.cadence || !queue.source_watch?.operational_apis?.cadence) failures.push('Missing-link source watch is incomplete');
if (queue.source_watch?.literature?.status !== 'active') failures.push('Missing-link literature watch has no successful intake capture');
const activeCandidateKeys = new Set((queue.candidates || []).map(candidate => candidate.edge_key));
const exportedDecisionByKey = new Map((queue.adjudicated_source_backed_candidates || []).map(item => [item.edge_key, item]));
for (const edgeKey of CLOSED_MISSING_LINK_CANDIDATE_KEYS) {
  const decision = MISSING_LINK_CANDIDATE_DECISIONS[edgeKey];
  if (activeCandidateKeys.has(edgeKey)) failures.push(`${edgeKey}: adjudicated candidate remains active`);
  if (edgeByKey.has(edgeKey)) failures.push(`${edgeKey}: rejected or deferred candidate leaked into live graph`);
  if (!decision?.decision || !decision.rationale || !decision.evidence_boundary || decision.source_locators?.length < 2 || !decision.reviewed_at) failures.push(`${edgeKey}: candidate adjudication is incomplete`);
  if (!exportedDecisionByKey.has(edgeKey)) failures.push(`${edgeKey}: candidate adjudication missing from exported queue`);
}
if (queue.summary?.source_backed_candidates_adjudicated_closed !== CLOSED_MISSING_LINK_CANDIDATE_KEYS.length) failures.push('Missing-link adjudication summary does not match the decision registry');
for (const candidate of queue.candidates || []) {
  if (edgeByKey.has(candidate.edge_key)) failures.push(`${candidate.edge_key}: discovery candidate already exists in live graph`);
  const topologyHypothesis = candidate.candidate_origin === 'directed_two_hop_topology_motif';
  const expectedStatus = topologyHypothesis ? 'topology_hypothesis_awaiting_literature_discovery' : 'discovery_only_pending_human_review';
  if (candidate.auto_promotion !== false || candidate.status !== expectedStatus) failures.push(`${candidate.edge_key}: candidate is not quarantined`);
  if (!candidate.human_promotion_gate?.required || candidate.human_promotion_gate.checks?.length < 7) failures.push(`${candidate.edge_key}: human promotion gate incomplete`);
  if (topologyHypothesis) {
    if (candidate.mechanism !== null || candidate.sources?.length !== 0) failures.push(`${candidate.edge_key}: topology hypothesis improperly claims relationship evidence`);
    if (!candidate.research_notes || candidate.path_leg_evidence?.length < 2) failures.push(`${candidate.edge_key}: topology search rationale is incomplete`);
  } else if (candidate.sources?.length < 2 || !candidate.mechanism) {
    failures.push(`${candidate.edge_key}: insufficient discovery evidence`);
  }
}

const report = {
  ok: failures.length === 0,
  generated_at: new Date().toISOString(),
  summary: {
    nodes: NODES.length,
    relationships: EDGES.length,
    normalized_confidence: EDGES.length,
    quantitative_evidence_envelopes: EDGES.filter(edge => edge.evidence?.quantitative_evidence).length,
    relationship_quantifications: EDGES.filter(edge => edge.evidence?.quantitative_evidence?.relationship_quantification).length,
    confidence_reassessments: EDGES.filter(edge => edge.evidence?.confidence_reassessment).length,
    pending_conservative_confidence_defaults: EDGES.filter(edge => edge.evidence?.confidence_basis === 'conservative_default_pending_reassessment').length,
    literature_matches_adjudicated: literatureAdjudication.summary?.matches_adjudicated || 0,
    source_readbacks_closed: EDGES.filter(edge => edge.evidence?.source_readback?.status === 'confirmed_bounded').length,
    terminology_decisions: Object.keys(ANALYTICAL_LABEL_REVIEW).length,
    regional_hub_profiles: Object.keys(REGIONAL_HUB_PROFILES).length,
    operational_metric_contracts: metricRegistry.bindings?.length || 0,
    metric_ingestion_jobs: metricRegistry.jobs?.length || 0,
    missing_link_candidates: queue.candidates?.length || 0,
    missing_link_candidates_adjudicated_closed: CLOSED_MISSING_LINK_CANDIDATE_KEYS.length
  },
  failures
};

await fs.writeFile(path.resolve('tmp-evidence-campaign-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
