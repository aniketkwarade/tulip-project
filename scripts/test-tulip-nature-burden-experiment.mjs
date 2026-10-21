import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  evaluateNatureBurdenVector, NATURE_BURDEN_VERSION,
  NATURE_REFERENCE_VERSION, NATURE_TYPE_REFERENCES,
} from '../src/tulip-nature-burden-experiment.js';

const snapshot = path => {
  const bytes = readFileSync(new URL(path, import.meta.url));
  return { data: JSON.parse(bytes), sha256: createHash('sha256').update(bytes).digest('hex') };
};
const reef = snapshot('../artifacts/tulip-calibration-2026-09-22/coral-bleaching-reference-snapshot.json');
const mangrove = snapshot('../artifacts/tulip-calibration-2026-09-22/gmw-mangrove-extent-reference-snapshot.json');
assert.equal(NATURE_TYPE_REFERENCES.mapped_coral_reef.sourceSnapshotSha256, reef.sha256);
assert.equal(NATURE_TYPE_REFERENCES.mapped_coral_reef.mappedExtentKm2,
  reef.data.endpoints.subregionConditionDistribution.mappedGlobalReefAreaM2 / 1e6);
assert.equal(NATURE_TYPE_REFERENCES.mapped_mangrove.sourceSnapshotSha256, mangrove.sha256);
assert.equal(NATURE_TYPE_REFERENCES.mapped_mangrove.mappedExtentKm2,
  mangrove.data.currentWindow.endingExtentHa / 100);

const cohort = (effectId, canonicalTypeId, spatialUnitId, affectedArea,
  counterfactualConditionFraction, currentConditionFraction, durationYears) => ({
  effectId, canonicalTypeId, spatialUnitId, affectedArea, areaUnit: 'km2',
  conditionMetric: NATURE_TYPE_REFERENCES[canonicalTypeId].conditionMetric,
  counterfactualConditionFraction, currentConditionFraction, durationYears,
  attributionStatus: 'documented_node_attribution', causalModelId: 'synthetic_model',
  counterfactualId: 'synthetic_no_node_counterfactual',
  sourceObservationId: 'synthetic_observation', assessmentPeriod: 'synthetic_period',
});
const input = cohorts => ({
  methodVersion: NATURE_BURDEN_VERSION, referenceVersion: NATURE_REFERENCE_VERSION,
  nodeId: 'synthetic_issue', nodeKind: 'issue', coverage: 'experimental_cohorts_only',
  assessmentPeriod: 'synthetic_period', cohorts,
});
const assertEquivalentVector = (actual, expected) => {
  assert.deepEqual(Object.keys(actual), Object.keys(expected));
  for (const typeId of Object.keys(expected)) {
    assert.deepEqual(Object.keys(actual[typeId]), Object.keys(expected[typeId]));
    for (const [field, value] of Object.entries(expected[typeId])) {
      if (typeof value === 'number') {
        assert(Math.abs(actual[typeId][field] - value) <= 1e-10 * Math.max(1, Math.abs(value)),
          `${typeId}.${field}: ${actual[typeId][field]} versus ${value}`);
      } else assert.equal(actual[typeId][field], value);
    }
  }
};
const reefCohort = cohort('reef_effect', 'mapped_coral_reef', 'reef_patch', 100, 0.3, 0.1, 5);
const mangroveCohort = cohort('mangrove_effect', 'mapped_mangrove', 'mangrove_patch', 20, 1, 0.5, 2);
const base = evaluateNatureBurdenVector(input([reefCohort, mangroveCohort]));
assert.equal(base.status, 'experimental_type_vector');
assert.equal(base.score, null);
assert.equal(base.publicReady, false);
assert(Math.abs(base.byType.mapped_coral_reef.conditionEquivalentKm2Years - 100) < 1e-10);
assert.equal(base.byType.mapped_mangrove.conditionEquivalentKm2Years, 20);
assert.equal(Object.hasOwn(base, 'combinedNatureValue'), false);

const split = evaluateNatureBurdenVector(input([
  cohort('reef_effect_a', 'mapped_coral_reef', 'reef_patch_a', 40, 0.3, 0.1, 5),
  cohort('reef_effect_b', 'mapped_coral_reef', 'reef_patch_b', 60, 0.3, 0.1, 5),
  mangroveCohort,
]));
assertEquivalentVector(split.byType, base.byType); // Floating summation is equivalent at source precision.
const reordered = evaluateNatureBurdenVector(input([mangroveCohort, reefCohort]));
assertEquivalentVector(reordered.byType, base.byType);
const newNode = evaluateNatureBurdenVector({ ...input([reefCohort, mangroveCohort]), nodeId: 'unrelated_new_node' });
assertEquivalentVector(newNode.byType, base.byType);
const hectares = evaluateNatureBurdenVector(input([
  { ...reefCohort, affectedArea: 10000, areaUnit: 'ha' },
  { ...mangroveCohort, affectedArea: 2000, areaUnit: 'ha' },
]));
assertEquivalentVector(hectares.byType, base.byType);
const zeroLoss = evaluateNatureBurdenVector(input([
  reefCohort, { ...mangroveCohort, currentConditionFraction: 1 },
]));
assert.equal(zeroLoss.byType.mapped_coral_reef.shareOfFixedTypeAreaYears,
  base.byType.mapped_coral_reef.shareOfFixedTypeAreaYears);
const moreLoss = evaluateNatureBurdenVector(input([
  { ...reefCohort, currentConditionFraction: 0 }, mangroveCohort,
]));
assert(moreLoss.byType.mapped_coral_reef.conditionEquivalentKm2Years
  > base.byType.mapped_coral_reef.conditionEquivalentKm2Years);
// Synthetic counterfactual/current pair: a historical before value cannot
// automatically stand in for the no-node counterfactual of a later year.
const reefPointDifference = evaluateNatureBurdenVector(input([
  cohort('synthetic_reef_condition_pair', 'mapped_coral_reef', 'example_patch',
    100, 0.3, 0.275, 1),
]));
assert(Math.abs(reefPointDifference.byType.mapped_coral_reef.conditionEquivalentKm2 - 2.5) < 1e-10);
assert(reefPointDifference.byType.mapped_coral_reef.conditionEquivalentKm2 < 8.333333);

const rejection = (changed, reason) => {
  const result = evaluateNatureBurdenVector(changed);
  assert.equal(result.score, null);
  assert.equal(result.status, 'needs_compatible_nature_cohorts');
  assert(result.reasons.includes(reason), `${reason}: ${result.reasons.join(', ')}`);
};
rejection(input([{ ...reefCohort, areaUnit: 'acres' }]), 'compatible_affected_area_required');
rejection(input([{ ...reefCohort, conditionMetric: 'reef_area_destroyed' }]), 'condition_metric_mismatch');
rejection(input([{ ...reefCohort, canonicalTypeId: '__proto__' }]), 'unknown_canonical_ecosystem_type');
rejection(input([{ ...reefCohort, attributionStatus: 'not_established_for_node' }]), 'attribution_record_incomplete');
rejection(input([{ ...reefCohort, assessmentPeriod: 'other_period' }]), 'cohort_period_mismatch');
rejection(input([reefCohort, { ...reefCohort, effectId: 'other_effect' }]),
  'duplicate_spatial_unit_requires_overlap_resolution');
rejection(input([reefCohort, { ...reefCohort, spatialUnitId: 'other_patch' }]),
  'effect_id_missing_or_duplicate');
rejection(input([{ ...reefCohort,
  affectedArea: NATURE_TYPE_REFERENCES.mapped_coral_reef.mappedExtentKm2 + 1 }]),
  'affected_area_exceeds_fixed_type_extent');
rejection(input([{ ...reefCohort, conditionLossFraction: 0.0891 }]),
  'ambiguous_entered_loss_fraction_forbidden');
rejection(input([{ ...reefCohort, currentConditionFraction: 0.4 }]),
  'compatible_condition_pair_required');
rejection(input([{ ...reefCohort, durationYears: 0 }]), 'duration_years_required');

console.log(JSON.stringify({ status: 'passed', sourceReferencesVerified: 2,
  partitionInvariant: true, nodeAdditionInvariant: true, unitInvariant: true,
  monotoneWithinType: true,
  incompatibleCasesRejected: 11, crossTypeScoreAssigned: false }, null, 2));
