// A measured reef-condition trend is an endpoint input, not an attributable
// ecosystem-harm component or a whole-node TULIP Score.
import { REGISTERED_ECOSYSTEM_CONDITION_OBSERVATIONS } from './tulip-source-observation-registry.js';

export const ECOSYSTEM_CONDITION_VERSION = 'tulip_ecosystem_condition_2026_09_27_v1';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const validPercent = value => typeof value === 'number' && Number.isFinite(value)
  && value >= 0 && value <= 100;

export function evaluateEcosystemConditionObservation(input) {
  const reasons = [];
  const source = input?.sourceObservation;
  const registered = Object.hasOwn(REGISTERED_ECOSYSTEM_CONDITION_OBSERVATIONS, input?.sourceId)
    ? REGISTERED_ECOSYSTEM_CONDITION_OBSERVATIONS[input.sourceId] : null;
  if (!registered) reasons.push('registered_source_row_required');
  if (registered && (!nonempty(registered.sourceVersion) || !nonempty(registered.sourceLocator)
    || !/^[a-f0-9]{64}$/.test(registered.sourceArtifactSha256 ?? ''))) {
    reasons.push('registered_source_provenance_missing');
  }
  if (input?.methodVersion !== ECOSYSTEM_CONDITION_VERSION) reasons.push('method_version_mismatch');
  if (!nonempty(input?.nodeId) || input?.nodeKind !== 'issue') reasons.push('issue_node_id_required');
  if (input?.domain !== 'ecosystem' || input?.coverage !== 'endpoint_only') {
    reasons.push('ecosystem_endpoint_only_required');
  }
  if (input?.attributionStatus !== 'not_established_for_node') {
    reasons.push('node_attribution_not_established');
  }
  if (!nonempty(input?.overlapReview)) reasons.push('overlap_review_missing');
  if (!source || source.sourceId !== input?.sourceId || !nonempty(source.sourceUrl)
    || !source.sourceUrl.startsWith('https://')) {
    reasons.push('source_reference_missing_or_mismatched');
  }
  for (const field of ['geography', 'ecosystemType', 'outcomeKind', 'unit', 'reportingPeriodBasis']) {
    if (!nonempty(input?.[field]) || source?.[field] !== input[field]) {
      reasons.push(`${field}_source_scope_mismatch`);
    }
  }
  for (const field of ['referenceStartYear', 'referenceEndYear', 'currentStartYear', 'currentEndYear']) {
    if (!Number.isInteger(input?.[field]) || source?.[field] !== input[field]) {
      reasons.push(`${field}_source_period_mismatch`);
    }
  }
  if (Number.isInteger(input?.referenceEndYear) && Number.isInteger(input?.currentStartYear)
    && input.referenceEndYear >= input.currentStartYear) {
    reasons.push('reference_and_current_periods_overlap');
  }
  if (source?.outcomeKind !== 'live_hard_coral_cover_condition'
    || source?.unit !== 'percent_reef_surface'
    || source?.reportingPeriodBasis !== 'modelled_period_mean'
    || !validPercent(source?.referenceCoverPct) || source.referenceCoverPct === 0
    || !validPercent(source?.currentCoverPct)) {
    reasons.push('hard_coral_condition_observation_required');
  }
  if (source?.periodMeanUncertaintyInterval !== null) {
    reasons.push('unsupported_period_mean_interval_claim');
  }
  const sourceFields = ['sourceId', 'sourceUrl', 'geography', 'ecosystemType',
    'outcomeKind', 'unit', 'reportingPeriodBasis', 'referenceStartYear',
    'referenceEndYear', 'currentStartYear', 'currentEndYear', 'referenceCoverPct',
    'currentCoverPct', 'periodMeanUncertaintyInterval'];
  if (registered && sourceFields.some(field => source?.[field] !== registered[field])) {
    reasons.push('candidate_source_row_differs_from_registry');
  }
  if (reasons.length) return { status: 'needs_source_native_condition', score: null, reasons };
  return {
    status: 'source_bound_condition_observation',
    methodVersion: ECOSYSTEM_CONDITION_VERSION,
    nodeId: input.nodeId,
    coverage: 'endpoint_only',
    domain: 'ecosystem',
    attributionStatus: 'not_established_for_node',
    ecosystemType: registered.ecosystemType,
    geography: registered.geography,
    metric: registered.outcomeKind,
    reference: { startYear: registered.referenceStartYear, endYear: registered.referenceEndYear,
      meanModelledCoverPct: registered.referenceCoverPct },
    current: { startYear: registered.currentStartYear, endYear: registered.currentEndYear,
      meanModelledCoverPct: registered.currentCoverPct },
    relativeCoverChangePct: Number(((registered.currentCoverPct / registered.referenceCoverPct - 1) * 100).toFixed(6)),
    periodMeanUncertaintyInterval: null,
    source: { id: registered.sourceId, url: registered.sourceUrl,
      version: registered.sourceVersion, locator: registered.sourceLocator,
      artifactSha256: registered.sourceArtifactSha256,
      repositoryCommit: registered.repositoryCommit },
    score: null,
    scoreReason: 'The condition trend is not apportioned to this node and cross-ecosystem consequence anchors are not calibrated.',
    reasons: [],
  };
}
