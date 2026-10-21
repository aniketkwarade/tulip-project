// Experimental accounting layer, not a TULIP Score. The two indicators below
// have different ecological meanings; their area-years must not be summed.
export const NATURE_BURDEN_VERSION = 'tulip_nature_burden_2026_09_27_v1_experimental';
export const NATURE_REFERENCE_VERSION = 'tulip_nature_references_2026_09_27_v1';

export const NATURE_TYPE_REFERENCES = Object.freeze({
  mapped_coral_reef: Object.freeze({
    conditionMetric: 'live_hard_coral_cover_fraction',
    mappedExtentKm2: 260433.73766,
    sourceVersion: 'gcrmn_status_coral_reefs_2025',
    sourceSnapshotSha256: 'a8c93b454c5634ee12b484edebcb65b2c2a070538d2786017b691d53224eef5f',
    sourceUrl: 'https://doi.org/10.59387/LFPR6347',
  }),
  mapped_mangrove: Object.freeze({
    conditionMetric: 'mapped_extent_loss_fraction',
    mappedExtentKm2: 147283.6426,
    sourceVersion: 'global_mangrove_watch_v4112',
    sourceSnapshotSha256: '5f7fd020f8bb0bbf1903f544f9ffab7960b5430ed90a0267040cd07fd19ea3a8',
    sourceUrl: 'https://doi.org/10.5281/zenodo.21346457',
  }),
});

const validText = value => typeof value === 'string' && value.trim().length > 0;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const AREA_TO_KM2 = Object.freeze({ km2: 1, ha: 0.01, m2: 1e-6 });
const areaKm2 = cohort => Object.hasOwn(AREA_TO_KM2, cohort?.areaUnit)
  ? cohort.affectedArea * AREA_TO_KM2[cohort.areaUnit] : NaN;

// A cohort is a reviewed, non-overlapping affected area under one indicator.
// The evaluator checks arithmetic and declared scope, not the truth of an
// attribution claim or whether two different spatial IDs actually overlap.
export function evaluateNatureBurdenVector(input) {
  const reasons = [];
  if (input?.methodVersion !== NATURE_BURDEN_VERSION) reasons.push('method_version_mismatch');
  if (input?.referenceVersion !== NATURE_REFERENCE_VERSION) reasons.push('reference_version_mismatch');
  if (input?.nodeKind !== 'issue' || !validText(input?.nodeId)) reasons.push('issue_node_required');
  if (input?.coverage !== 'experimental_cohorts_only') reasons.push('experimental_coverage_required');
  if (!validText(input?.assessmentPeriod)) reasons.push('assessment_period_required');
  if (!Array.isArray(input?.cohorts) || input.cohorts.length === 0) reasons.push('cohorts_required');

  const effectIds = new Set();
  const spatialKeys = new Set();
  const areaByType = new Map();
  for (const cohort of Array.isArray(input?.cohorts) ? input.cohorts : []) {
    if (!validText(cohort?.effectId) || effectIds.has(cohort.effectId)) reasons.push('effect_id_missing_or_duplicate');
    else effectIds.add(cohort.effectId);
    const reference = Object.hasOwn(NATURE_TYPE_REFERENCES, cohort?.canonicalTypeId)
      ? NATURE_TYPE_REFERENCES[cohort.canonicalTypeId] : null;
    if (!reference) reasons.push('unknown_canonical_ecosystem_type');
    if (reference && cohort?.conditionMetric !== reference.conditionMetric) reasons.push('condition_metric_mismatch');
    const convertedArea = areaKm2(cohort);
    if (!finite(convertedArea) || convertedArea <= 0) {
      reasons.push('compatible_affected_area_required');
    }
    if (!finite(cohort?.counterfactualConditionFraction)
      || !finite(cohort?.currentConditionFraction)
      || cohort.counterfactualConditionFraction < 0
      || cohort.counterfactualConditionFraction > 1
      || cohort.currentConditionFraction < 0
      || cohort.currentConditionFraction > cohort.counterfactualConditionFraction) {
      reasons.push('compatible_condition_pair_required');
    }
    if (Object.hasOwn(cohort ?? {}, 'conditionLossFraction')) {
      reasons.push('ambiguous_entered_loss_fraction_forbidden');
    }
    if (!finite(cohort?.durationYears) || cohort.durationYears <= 0) reasons.push('duration_years_required');
    if (cohort?.attributionStatus !== 'documented_node_attribution'
      || !validText(cohort?.causalModelId) || !validText(cohort?.counterfactualId)
      || !validText(cohort?.sourceObservationId)) reasons.push('attribution_record_incomplete');
    if (!validText(cohort?.spatialUnitId)) reasons.push('spatial_unit_id_required');
    else {
      const spatialKey = `${cohort.canonicalTypeId}:${cohort.spatialUnitId}`;
      if (spatialKeys.has(spatialKey)) reasons.push('duplicate_spatial_unit_requires_overlap_resolution');
      spatialKeys.add(spatialKey);
    }
    if (cohort?.assessmentPeriod !== input?.assessmentPeriod) reasons.push('cohort_period_mismatch');
    if (reference && finite(convertedArea) && convertedArea > 0) {
      areaByType.set(cohort.canonicalTypeId,
        (areaByType.get(cohort.canonicalTypeId) ?? 0) + convertedArea);
    }
  }
  for (const [typeId, area] of areaByType) {
    if (area > NATURE_TYPE_REFERENCES[typeId].mappedExtentKm2 + 1e-8) {
      reasons.push('affected_area_exceeds_fixed_type_extent');
    }
  }
  if (reasons.length) return { status: 'needs_compatible_nature_cohorts', score: null,
    reasons: [...new Set(reasons)] };

  const byType = {};
  for (const cohort of input.cohorts) {
    const typeId = cohort.canonicalTypeId;
    const reference = NATURE_TYPE_REFERENCES[typeId];
    byType[typeId] ??= { conditionMetric: reference.conditionMetric,
      mappedExtentKm2: reference.mappedExtentKm2, affectedAreaKm2: 0,
      conditionEquivalentKm2: 0, conditionEquivalentKm2Years: 0,
      shareOfFixedTypeAreaYears: 0, sourceSnapshotSha256: reference.sourceSnapshotSha256 };
    const affectedAreaKm2 = areaKm2(cohort);
    // This is an absolute change in an area-fraction indicator. For example,
    // a modeled 30% no-node state versus 27.5% with-node state differs by
    // 0.025, not the relative decline of about 0.0833.
    const equivalentArea = affectedAreaKm2
      * (cohort.counterfactualConditionFraction - cohort.currentConditionFraction);
    byType[typeId].affectedAreaKm2 += affectedAreaKm2;
    byType[typeId].conditionEquivalentKm2 += equivalentArea;
    byType[typeId].conditionEquivalentKm2Years += equivalentArea * cohort.durationYears;
    byType[typeId].shareOfFixedTypeAreaYears += equivalentArea * cohort.durationYears / reference.mappedExtentKm2;
  }
  return {
    status: 'experimental_type_vector', methodVersion: NATURE_BURDEN_VERSION,
    referenceVersion: NATURE_REFERENCE_VERSION, nodeId: input.nodeId,
    assessmentPeriod: input.assessmentPeriod,
    byType: Object.fromEntries(Object.entries(byType).sort(([a], [b]) => a.localeCompare(b))),
    score: null, publicReady: false,
    reasons: [],
    limitation: 'Cohort attribution, condition comparability, spatial non-overlap and duration require independent evidence review. Unlike ecosystem indicators are not added or mapped to 1–10.',
  };
}
