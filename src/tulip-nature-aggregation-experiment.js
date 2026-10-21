import { NATURE_REFERENCE_VERSION, NATURE_TYPE_REFERENCES } from './tulip-nature-burden-experiment.js';
import { compareAttributableIndicatorScenarios } from './tulip-ecosystem-severity-experiment.js';

// Policy sensitivity experiment on TWO ecosystem families, not a global nature
// method. Real mapped areas set fixed reference denominators; synthetic
// indicator/scenario packets test trade-offs. Neither policy is approved.
export const NATURE_AGGREGATION_VERSION = 'tulip_nature_aggregation_2026_09_27_v1_experimental';
const TYPE_IDS = Object.freeze(['mapped_coral_reef', 'mapped_mangrove']);
const totalMappedArea = TYPE_IDS.reduce((sum, id) => sum + NATURE_TYPE_REFERENCES[id].mappedExtentKm2, 0);
export const EXPERIMENTAL_NATURE_POLICIES = Object.freeze({
  equal_two_family_emphasis: Object.freeze({
    version: 'nature_equal_two_family_2026_09_27_v1',
    description: 'Each of these two ecosystem families receives half of the experimental emphasis.',
    weights: Object.freeze({ mapped_coral_reef: 0.5, mapped_mangrove: 0.5 }),
  }),
  area_two_family_emphasis: Object.freeze({
    version: 'nature_area_two_family_2026_09_27_v1',
    description: 'Each family receives its share of the fixed combined mapped area of these two families.',
    weights: Object.freeze(Object.fromEntries(TYPE_IDS.map(id => [id,
      NATURE_TYPE_REFERENCES[id].mappedExtentKm2 / totalMappedArea]))),
  }),
});
const text = value => typeof value === 'string' && value.trim().length > 0;
const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
const AREA_TO_KM2 = Object.freeze({ km2: 1, ha: 0.01, m2: 1e-6 });

export function evaluateFrozenNaturePolicyChallenge(input) {
  const reasons = [];
  if (input?.methodVersion !== NATURE_AGGREGATION_VERSION) reasons.push('method_version_mismatch');
  if (input?.referenceVersion !== NATURE_REFERENCE_VERSION) reasons.push('fixed_reference_version_mismatch');
  if (input?.nodeKind !== 'issue' || !text(input?.nodeId)) reasons.push('issue_node_required');
  if (!text(input?.assessmentPeriod)) reasons.push('assessment_period_required');
  if (input?.summaryTimebase !== 'current_condition_stock') reasons.push('current_condition_stock_timebase_required');
  if (input?.coverage !== 'synthetic_two_family_policy_challenge') reasons.push('synthetic_two_family_scope_required');
  const policy = Object.hasOwn(EXPERIMENTAL_NATURE_POLICIES, input?.policyId)
    ? EXPERIMENTAL_NATURE_POLICIES[input.policyId] : null;
  if (!policy || policy.version !== input?.policyVersion) reasons.push('registered_fixed_policy_required');
  if (Object.hasOwn(input ?? {}, 'weights')) reasons.push('assessment_entered_weights_forbidden');
  if (!Array.isArray(input?.cohorts)) reasons.push('cohort_array_required');
  if (!input?.familyCoverage || Object.keys(input.familyCoverage).some(id => !TYPE_IDS.includes(id))) {
    reasons.push('fixed_family_coverage_required');
  }
  for (const id of TYPE_IDS) {
    const coverage = input?.familyCoverage?.[id];
    if (!['assessed_fixed_distribution', 'reviewed_unaffected_distribution'].includes(coverage?.status)
      || !text(coverage?.reviewEvidenceId) || !text(coverage?.indicatorId)) reasons.push(`${id}_complete_distribution_review_required`);
  }
  const spatialIds = new Set();
  const familyArea = Object.fromEntries(TYPE_IDS.map(id => [id, 0]));
  const familyLossArea = Object.fromEntries(TYPE_IDS.map(id => [id, 0]));
  const cohortResults = [];
  for (const cohort of Array.isArray(input?.cohorts) ? input.cohorts : []) {
    const typeId = cohort?.canonicalTypeId;
    if (!TYPE_IDS.includes(typeId)) {
      reasons.push('unregistered_type_requires_reference_policy_review');
      continue;
    }
    // Subtype labels do not create new weights. Every cohort retains its fixed
    // canonical parent's denominator and policy emphasis.
    if (!text(cohort?.spatialUnitId) || spatialIds.has(`${typeId}:${cohort.spatialUnitId}`)) {
      reasons.push('spatial_unit_missing_or_duplicate');
    }
    spatialIds.add(`${typeId}:${cohort?.spatialUnitId}`);
    if (!text(cohort?.disjointCohortReviewId)) reasons.push('disjoint_cohort_review_required');
    if (cohort?.lossAggregationBasis !== 'spatial_cohort_positive_loss') {
      reasons.push('loss_preserving_spatial_cohort_basis_required');
    }
    const convertedArea = positive(cohort?.affectedArea) && Object.hasOwn(AREA_TO_KM2, cohort?.areaUnit)
      ? cohort.affectedArea * AREA_TO_KM2[cohort.areaUnit] : NaN;
    if (!positive(convertedArea)) reasons.push('compatible_affected_area_required');
    if (['durationYears', 'projectedRecoveryYears'].some(field => Object.hasOwn(cohort ?? {}, field))) {
      reasons.push('condition_stock_cannot_be_multiplied_by_duration');
    }
    const scenario = cohort?.scenarioComparison;
    if (scenario?.indicatorId !== input?.familyCoverage?.[typeId]?.indicatorId) reasons.push('family_indicator_profile_mismatch');
    if (scenario?.nodeId !== input?.nodeId || scenario?.assessmentPeriod !== input?.assessmentPeriod
      || scenario?.nodeKind !== input?.nodeKind) reasons.push('cohort_node_or_period_mismatch');
    const result = compareAttributableIndicatorScenarios(scenario);
    reasons.push(...result.reasons);
    if (result.status === 'experimental_attributable_indicator_difference' && positive(convertedArea)) {
      familyArea[typeId] += convertedArea;
      familyLossArea[typeId] += convertedArea * result.attributableDegradationFraction;
      cohortResults.push({ canonicalTypeId: typeId, spatialUnitId: cohort.spatialUnitId,
        areaKm2: convertedArea, indicatorId: scenario.indicatorId,
        attributableDegradationFraction: result.attributableDegradationFraction,
        signedDifference: result.signedDifference });
    }
    if (input?.familyCoverage?.[typeId]?.status === 'reviewed_unaffected_distribution') {
      reasons.push('unaffected_family_cannot_contain_loss_cohort');
    }
  }
  for (const id of TYPE_IDS) {
    if (familyArea[id] > NATURE_TYPE_REFERENCES[id].mappedExtentKm2 + 1e-8) reasons.push('cohort_area_exceeds_fixed_family_extent');
    if (input?.familyCoverage?.[id]?.status === 'assessed_fixed_distribution' && !familyArea[id]) {
      reasons.push(`${id}_assessed_cohorts_required`);
    }
  }
  if (reasons.length) return { status: 'needs_complete_policy_challenge', index: null,
    score: null, publicReady: false, reasons: [...new Set(reasons)] };
  const byFamily = Object.fromEntries(TYPE_IDS.map(id => {
    const reference = NATURE_TYPE_REFERENCES[id];
    const distributionLossFraction = familyLossArea[id] / reference.mappedExtentKm2;
    return [id, { mappedExtentKm2: reference.mappedExtentKm2,
      assessedCohortAreaKm2: familyArea[id],
      collapseRelativeIndicatorLossAreaKm2: familyLossArea[id], distributionLossFraction,
      fixedWeight: policy.weights[id], weightedContribution: policy.weights[id] * distributionLossFraction,
      sourceSnapshotSha256: reference.sourceSnapshotSha256 }];
  }));
  const index = TYPE_IDS.reduce((sum, id) => sum + byFamily[id].weightedContribution, 0);
  return {
    status: 'experimental_frozen_policy_index', methodVersion: NATURE_AGGREGATION_VERSION,
    referenceVersion: NATURE_REFERENCE_VERSION, policyId: input.policyId, policyVersion: policy.version,
    nodeId: input.nodeId, assessmentPeriod: input.assessmentPeriod,
    summaryTimebase: input.summaryTimebase, coverage: input.coverage, byFamily, cohorts: cohortResults, index,
    score: null, publicReady: false, reasons: [],
    limitation: 'Synthetic indicator and attribution cases plus a two-family reference universe cannot establish current nature harm or a whole-catalogue method. Cross-indicator and cross-family equivalence is an unapproved TULIP policy assumption. Review labels do not prove non-overlap, unaffected remainder or attribution. Current condition differences are not multiplied by history length or projected recovery time.',
  };
}
