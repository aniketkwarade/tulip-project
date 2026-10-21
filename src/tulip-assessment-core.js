import { getTulipUrgencyBandV3 } from './tulip-urgency-v3.js';

export const ASSESSMENT_VERSION = 'tulip_assessment_pilot_1';
export const LEGACY_SCORE_NOTE = 'Legacy urgency is an editorial index, not a validated measure of equal harm across topics.';

// Keep the review digest independent of JSON formatting and object key order.
export function canonicalJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function unassessedNode(node) {
  const response = node.node_kind === 'response';
  return {
    nodeId: node.id,
    nodeKind: response ? 'response' : 'issue',
    version: ASSESSMENT_VERSION,
    status: response ? 'not_applicable' : 'not_assessed',
    legacy: null,
    criticality: {
      value: null,
      status: response ? 'not_applicable_response' : 'not_assessed',
      label: response ? 'Response · no danger score' : 'Criticality not assessed',
    },
    pilot: null,
  };
}

export function createAssessment(node, receipt, review, inputsMatch = false) {
  const result = unassessedNode(node);
  if (result.nodeKind !== 'response' && receipt) {
    if (receipt.node_id !== node.id || receipt.method_version !== 'tulip_urgency_v3'
      || !Number.isFinite(receipt.value) || receipt.value < 1 || receipt.value > 10
      || !['current_data', 'impact_fallback', 'modeled'].includes(receipt.method)
      || receipt.band !== getTulipUrgencyBandV3(receipt.value)) {
      throw new Error(`Invalid legacy receipt for ${node.id}`);
    }
    result.legacy = {
      value: receipt.value,
      band: receipt.band,
      method: receipt.method,
      version: receipt.method_version,
      label: receipt.method === 'modeled' ? 'Legacy urgency · modeled' : 'Legacy urgency',
    };
  }
  if (!review) return result;
  if (review.node_id !== node.id) throw new Error(`Assessment identity mismatch: ${node.id}`);
  const allowedStatuses = ['not_calibrated', 'metric_scope_mismatch', 'impact_model_missing',
    'consequence_scope_incomplete', 'node_scope_too_broad', 'endpoint_available_policy_scale_missing', 'not_applicable_response'];
  if (!allowedStatuses.includes(review.criticality_status)
    || (result.nodeKind === 'response') !== (review.criticality_status === 'not_applicable_response')) {
    throw new Error(`Unsupported criticality contract: ${node.id}`);
  }
  for (const field of ['reviewed_on', 'observation_period', 'scoped_result', 'anomaly_result',
    'consequences', 'source_review_status', 'main_pitfall', 'method_needed']) {
    if (typeof review[field] !== 'string' || !review[field].trim()) throw new Error(`Missing ${field}: ${node.id}`);
  }
  for (const source of review.sources ?? []) {
    const url = new URL(source.url);
    if (url.protocol !== 'https:' || url.username || url.password || !source.label) throw new Error(`Invalid source: ${node.id}`);
  }
  if (!inputsMatch) {
    result.status = 'needs_review';
    result.criticality.label = result.nodeKind === 'response'
      ? 'Response · evidence needs review' : 'Assessment needs review';
    return result; // Never keep old findings attached to new observations.
  }
  result.status = 'pilot';
  result.criticality.status = review.criticality_status;
  result.criticality.label = result.nodeKind === 'response'
    ? 'Response · no danger score' : 'Criticality not yet calibrated';
  result.pilot = {
    reviewedOn: review.reviewed_on,
    observationPeriod: review.observation_period,
    observation: review.scoped_result,
    unusualness: review.anomaly_result,
    consequences: review.consequences,
    evidence: review.source_review_status,
    limitation: review.main_pitfall,
    nextStep: review.method_needed,
    sources: review.sources,
  };
  return result;
}

// An empirical rank describes an observation within a specified reference.
// It is never converted into criticality, damage, or event probability.
export function historicalRank({ value, reference, direction, minimumSamples = 30 }) {
  if (!Number.isFinite(value) || !Array.isArray(reference)
    || !Number.isInteger(minimumSamples) || minimumSamples < 2
    || reference.length < minimumSamples || reference.some(v => !Number.isFinite(v))
    || !['higher', 'lower'].includes(direction)) return null;
  const lessAdverse = reference.filter(v => direction === 'higher' ? v < value : v > value).length;
  const ties = reference.filter(v => v === value).length;
  return {
    percentile: 100 * (lessAdverse + ties / 2) / reference.length,
    sampleSize: reference.length,
    outsideReference: value < Math.min(...reference) || value > Math.max(...reference),
    direction,
  };
}

export function assessmentRows(assessment) {
  const p = assessment?.pilot;
  if (!p) return [];
  return [
    ['Observation period', p.observationPeriod],
    ['Observed indicator', p.observation],
    ['Unusualness', p.unusualness],
    ['Consequences', p.consequences],
    ['Evidence quality', p.evidence],
    ['Interpretation limit', p.limitation],
    ['What is needed next', p.nextStep],
  ];
}

// Used by both mobile exporters. Scores never fall back to graph display seeds.
export function applyAssessmentToProfile(profile, assessment) {
  return {
    ...profile,
    urgency: assessment.value ?? null,
    urgencyBand: null,
    assessment,
  };
}
