// Experimental input contract for a future absolute-anchored TULIP method.
// This module validates a consequence quantity; it never manufactures a score.
import { REGISTERED_DALY_OBSERVATIONS,
  REGISTERED_COUNTERFACTUAL_DEFINITIONS } from './tulip-source-observation-registry.js';

export const SOURCE_NATIVE_BURDEN_VERSION = 'tulip_source_native_burden_2026_09_27_v4';

const finiteNonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const finitePositive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

// The source registry is stored separately from the node assessment. The
// assessor may cite and copy a row, but cannot establish its values by editing
// the assessment packet. Registry provenance still needs editorial review.
export function evaluateAttributableDalyEndpoint(assessment) {
  const reasons = [];
  if (assessment?.methodVersion !== SOURCE_NATIVE_BURDEN_VERSION) reasons.push('method_version_mismatch');
  if (!nonempty(assessment?.nodeId)) reasons.push('node_id_missing');
  if (assessment?.nodeKind !== 'issue') reasons.push('issue_node_required');
  if (assessment?.domain !== 'human') reasons.push('human_domain_required');
  if (assessment?.outcomeKind !== 'attributable_dalys') reasons.push('attributable_dalys_required');
  if (assessment?.coverage !== 'endpoint_only') reasons.push('endpoint_only_coverage_required');
  if (assessment?.reportingPeriodBasis !== 'single_calendar_year_estimate') reasons.push('single_year_reporting_basis_required');
  for (const field of ['endpointId', 'affectedGroup', 'geography', 'assessmentPeriod',
    'counterfactualId', 'counterfactualVersion', 'counterfactualArtifactSha256', 'includedCauses']) {
    if (!nonempty(assessment?.[field])) reasons.push(`${field}_missing`);
  }
  if (Object.hasOwn(assessment ?? {}, 'counterfactual')) reasons.push('packet_counterfactual_description_forbidden');
  if (!/^\d{4}$/.test(assessment?.assessmentPeriod ?? '')) reasons.push('assessment_period_calendar_year_required');
  if (!nonempty(assessment?.overlapReview)) reasons.push('overlap_review_missing');
  if (!nonempty(assessment?.sourceId)) reasons.push('source_id_missing');
  const observation = assessment?.sourceObservation;
  const registered = Object.hasOwn(REGISTERED_DALY_OBSERVATIONS, assessment?.sourceId)
    ? REGISTERED_DALY_OBSERVATIONS[assessment.sourceId] : null;
  if (!registered || typeof registered !== 'object') reasons.push('registered_source_row_required');
  if (registered && (!nonempty(registered.sourceVersion) || !nonempty(registered.sourceLocator)
    || !/^[a-f0-9]{64}$/.test(registered.sourceArtifactSha256 ?? ''))) {
    reasons.push('registered_source_provenance_missing');
  }
  const counterfactual = Object.hasOwn(REGISTERED_COUNTERFACTUAL_DEFINITIONS, registered?.counterfactualId)
    ? REGISTERED_COUNTERFACTUAL_DEFINITIONS[registered.counterfactualId] : null;
  if (!counterfactual || !nonempty(counterfactual.definition) || !nonempty(counterfactual.sourceUrl)
    || !counterfactual.sourceUrl.startsWith('https://') || !nonempty(counterfactual.locator)
    || !counterfactual.appliesToSourceIds?.includes(registered?.sourceId)
    || counterfactual.version !== registered?.counterfactualVersion
    || counterfactual.artifactSha256 !== registered?.counterfactualArtifactSha256
    || !/^[a-f0-9]{64}$/.test(counterfactual.artifactSha256 ?? '')) {
    reasons.push('registered_source_counterfactual_required');
  }
  if (!observation || observation.sourceId !== assessment?.sourceId
    || !nonempty(observation.sourceUrl) || !observation.sourceUrl.startsWith('https://')) {
    reasons.push('source_reference_missing_or_mismatched');
  }
  for (const field of ['endpointId', 'affectedGroup', 'geography', 'assessmentPeriod', 'includedCauses',
    'counterfactualId', 'counterfactualVersion', 'counterfactualArtifactSha256']) {
    if (observation?.[field] !== assessment?.[field]) reasons.push(`${field}_source_scope_mismatch`);
  }
  if (Object.hasOwn(observation ?? {}, 'counterfactual')) reasons.push('copied_counterfactual_description_forbidden');
  if (observation?.reportingPeriodBasis !== assessment?.reportingPeriodBasis) reasons.push('reporting_period_basis_source_scope_mismatch');
  if (!finitePositive(observation?.reportedResolutionDalys)) reasons.push('source_value_resolution_missing');
  if (observation?.outcomeKind !== 'attributable_dalys'
    || observation?.unit !== 'DALY'
    || observation?.normalization !== 'absolute_total') {
    reasons.push('source_outcome_or_unit_mismatch');
  }
  if (!finiteNonnegative(observation?.central) || !finiteNonnegative(observation?.lower)
    || !finiteNonnegative(observation?.upper)
    || observation.lower > observation.central || observation.central > observation.upper) {
    reasons.push('source_interval_invalid');
  }
  if (finitePositive(observation?.reportedResolutionDalys)
    && ['lower', 'central', 'upper'].some(key => {
      const value = observation?.[key];
      const resolution = observation.reportedResolutionDalys;
      return finiteNonnegative(value)
        && Math.abs(value - Math.round(value / resolution) * resolution) > Math.max(1e-6, resolution * 1e-9);
    })) reasons.push('source_value_resolution_mismatch');
  // Compare all fields used to determine the burden or its scope. This also
  // rejects a candidate that changes both its headline value and its copied
  // sourceObservation to an internally consistent but unregistered number.
  const sourceFields = ['sourceId', 'sourceUrl', 'endpointId', 'affectedGroup',
    'geography', 'assessmentPeriod', 'includedCauses', 'reportingPeriodBasis',
    'counterfactualId', 'counterfactualVersion', 'counterfactualArtifactSha256',
    'reportedResolutionDalys', 'outcomeKind', 'unit', 'normalization',
    'lower', 'central', 'upper'];
  if (registered && sourceFields.some(field => observation?.[field] !== registered[field])) {
    reasons.push('candidate_source_row_differs_from_registry');
  }
  if (reasons.length) return { status: 'needs_source_native_endpoint', score: null, reasons };
  return {
    status: 'source_bound_endpoint',
    methodVersion: SOURCE_NATIVE_BURDEN_VERSION,
    nodeId: assessment.nodeId,
    endpointId: assessment.endpointId,
    domain: 'human',
    outcomeKind: 'attributable_dalys',
    unit: 'DALY',
    period: assessment.assessmentPeriod,
    reportingPeriodBasis: assessment.reportingPeriodBasis,
    geography: assessment.geography,
    coverage: assessment.coverage,
    counterfactual: {
      id: counterfactual.id, version: counterfactual.version, definition: counterfactual.definition,
      sourceUrl: counterfactual.sourceUrl, locator: counterfactual.locator,
      artifactSha256: counterfactual.artifactSha256, identityReview: counterfactual.identityReview,
    },
    burden: { lower: observation.lower, central: observation.central, upper: observation.upper },
    source: { id: registered.sourceId, url: registered.sourceUrl,
      version: registered.sourceVersion, locator: registered.sourceLocator,
      artifactSha256: registered.sourceArtifactSha256,
      reportedResolutionDalys: registered.reportedResolutionDalys },
    score: null,
    publicReady: false,
    scoreReason: 'A fixed, independently challenged DALY-to-TULIP anchor map has not been approved.',
    reasons: [],
  };
}
