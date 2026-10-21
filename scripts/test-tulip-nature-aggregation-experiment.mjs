import assert from 'node:assert/strict';
import { NATURE_REFERENCE_VERSION, NATURE_TYPE_REFERENCES } from '../src/tulip-nature-burden-experiment.js';
import { ECOSYSTEM_SEVERITY_VERSION } from '../src/tulip-ecosystem-severity-experiment.js';
import { NATURE_AGGREGATION_VERSION, EXPERIMENTAL_NATURE_POLICIES,
  evaluateFrozenNaturePolicyChallenge } from '../src/tulip-nature-aggregation-experiment.js';

const comparison = {
  methodVersion: ECOSYSTEM_SEVERITY_VERSION, nodeId: 'synthetic_node', nodeKind: 'issue',
  indicatorId: 'synthetic_reef_function', indicatorBehavior: 'continuous_state', unit: 'synthetic_function_units',
  harmfulDirection: 'decrease', referenceId: 'synthetic_reference', referenceValue: 100,
  collapseThresholdId: 'synthetic_collapse', collapseValue: 0,
  comparisonBasis: 'matched_with_and_without_node', geography: 'synthetic_fixed_distribution', assessmentPeriod: '2025',
  causalModelId: 'synthetic_model', causalModelVersion: 'v1',
  jointScenarioSourceId: 'synthetic_source', jointScenarioSourceVersion: 'v1',
};
const scope = Object.fromEntries(['nodeId', 'indicatorId', 'unit', 'referenceId', 'collapseThresholdId',
  'geography', 'assessmentPeriod', 'causalModelId', 'causalModelVersion'].map(field => [field, comparison[field]]));
comparison.withNodeScenario = { ...scope, id: 'synthetic_with', scenarioKind: 'with_node', sourceId: 'synthetic_source', sourceVersion: 'v1', value: 80 };
comparison.withoutNodeScenario = { ...scope, id: 'synthetic_without', scenarioKind: 'without_node', sourceId: 'synthetic_source', sourceVersion: 'v1', value: 100 };
const policyId = 'equal_two_family_emphasis';
const packet = {
  methodVersion: NATURE_AGGREGATION_VERSION, referenceVersion: NATURE_REFERENCE_VERSION,
  policyId, policyVersion: EXPERIMENTAL_NATURE_POLICIES[policyId].version,
  nodeId: 'synthetic_node', nodeKind: 'issue', assessmentPeriod: '2025',
  summaryTimebase: 'current_condition_stock', coverage: 'synthetic_two_family_policy_challenge',
  familyCoverage: {
    mapped_coral_reef: { status: 'assessed_fixed_distribution', reviewEvidenceId: 'synthetic_review', indicatorId: comparison.indicatorId },
    mapped_mangrove: { status: 'reviewed_unaffected_distribution', reviewEvidenceId: 'synthetic_no_effect_review', indicatorId: 'synthetic_mangrove_function' },
  },
  cohorts: [{ canonicalTypeId: 'mapped_coral_reef', subtypeId: 'original_subtype', spatialUnitId: 'synthetic_area',
    disjointCohortReviewId: 'synthetic_disjoint_review', areaUnit: 'km2',
    lossAggregationBasis: 'spatial_cohort_positive_loss',
    affectedArea: NATURE_TYPE_REFERENCES.mapped_coral_reef.mappedExtentKm2 / 10,
    scenarioComparison: comparison }],
};
const result = evaluateFrozenNaturePolicyChallenge(packet);
assert.equal(result.status, 'experimental_frozen_policy_index');
assert(Math.abs(result.index - 0.01) < 1e-14);
assert.equal(result.score, null);
assert.equal(result.publicReady, false);
const reject = (mutate, reason) => {
  const variant = structuredClone(packet);
  mutate(variant);
  const tested = evaluateFrozenNaturePolicyChallenge(variant);
  assert.equal(tested.status, 'needs_complete_policy_challenge');
  assert.equal(tested.index, null);
  assert.equal(tested.score, null);
  assert(tested.reasons.includes(reason), tested.reasons.join(', '));
};
reject(p => { delete p.familyCoverage.mapped_mangrove; }, 'mapped_mangrove_complete_distribution_review_required');
reject(p => { p.familyCoverage.mapped_mangrove.status = 'unsupported'; }, 'mapped_mangrove_complete_distribution_review_required');
reject(p => { p.weights = { mapped_coral_reef: 1, mapped_mangrove: 0 }; }, 'assessment_entered_weights_forbidden');
reject(p => { p.policyVersion = 'retuned'; }, 'registered_fixed_policy_required');
reject(p => { p.referenceVersion = 'changed'; }, 'fixed_reference_version_mismatch');
reject(p => { p.nodeKind = 'response'; }, 'issue_node_required');
reject(p => { p.cohorts.push(structuredClone(p.cohorts[0])); }, 'spatial_unit_missing_or_duplicate');
reject(p => { p.cohorts[0].affectedArea = NATURE_TYPE_REFERENCES.mapped_coral_reef.mappedExtentKm2 + 1; }, 'cohort_area_exceeds_fixed_family_extent');
reject(p => { p.cohorts[0].areaUnit = 'acres'; }, 'compatible_affected_area_required');
reject(p => { p.cohorts[0].affectedArea = '100'; }, 'compatible_affected_area_required');
reject(p => { p.cohorts[0].canonicalTypeId = 'newly_named_ecosystem'; }, 'unregistered_type_requires_reference_policy_review');
reject(p => { p.cohorts[0].scenarioComparison.nodeId = 'different_node'; }, 'cohort_node_or_period_mismatch');
reject(p => { p.cohorts[0].scenarioComparison.assessmentPeriod = '2024'; }, 'cohort_node_or_period_mismatch');
reject(p => { p.familyCoverage.mapped_coral_reef.status = 'reviewed_unaffected_distribution'; }, 'unaffected_family_cannot_contain_loss_cohort');
reject(p => { p.cohorts[0].durationYears = 10; }, 'condition_stock_cannot_be_multiplied_by_duration');
reject(p => { p.summaryTimebase = 'ten_year_projection'; }, 'current_condition_stock_timebase_required');
reject(p => { p.cohorts[0].scenarioComparison.indicatorId = 'another_function'; }, 'family_indicator_profile_mismatch');
reject(p => { p.cohorts = []; }, 'mapped_coral_reef_assessed_cohorts_required');
reject(p => { p.cohorts[0].lossAggregationBasis = 'signed_net_response_mean'; }, 'loss_preserving_spatial_cohort_basis_required');

const split = structuredClone(packet);
split.cohorts = ['subtype_a', 'subtype_b'].map(subtypeId => ({ ...structuredClone(packet.cohorts[0]),
  subtypeId, spatialUnitId: subtypeId, affectedArea: packet.cohorts[0].affectedArea / 2 }));
assert.equal(evaluateFrozenNaturePolicyChallenge(split).index, result.index);
split.cohorts.reverse();
assert.equal(evaluateFrozenNaturePolicyChallenge(split).index, result.index);
const hectares = structuredClone(packet);
hectares.cohorts[0].areaUnit = 'ha';
hectares.cohorts[0].affectedArea *= 100;
assert.equal(evaluateFrozenNaturePolicyChallenge(hectares).index, result.index);
const larger = structuredClone(packet);
larger.cohorts[0].affectedArea *= 2;
assert.equal(evaluateFrozenNaturePolicyChallenge(larger).index, result.index * 2);
const worse = structuredClone(packet);
worse.cohorts[0].scenarioComparison.withNodeScenario.value = 60;
assert.equal(evaluateFrozenNaturePolicyChallenge(worse).index, result.index * 2);
const futureNode = structuredClone(packet);
futureNode.nodeId = 'synthetic_future_node';
futureNode.cohorts[0].scenarioComparison.nodeId = futureNode.nodeId;
futureNode.cohorts[0].scenarioComparison.withNodeScenario.nodeId = futureNode.nodeId;
futureNode.cohorts[0].scenarioComparison.withoutNodeScenario.nodeId = futureNode.nodeId;
assert.equal(evaluateFrozenNaturePolicyChallenge(futureNode).index, result.index);
assert.deepEqual(evaluateFrozenNaturePolicyChallenge(packet), result);
// Clip/retain loss before spatial aggregation. A gain elsewhere cannot erase
// the harmed cohort; the regional signed average cannot recover gross loss.
const mixed = structuredClone(packet);
mixed.cohorts = ['loss_patch', 'gain_patch'].map((id, i) => {
  const cohort = structuredClone(packet.cohorts[0]);
  cohort.spatialUnitId = id;
  cohort.affectedArea = NATURE_TYPE_REFERENCES.mapped_coral_reef.mappedExtentKm2 / 2;
  cohort.scenarioComparison.withNodeScenario.value = i === 0 ? 40 : 160;
  return cohort;
});
assert(Math.abs(evaluateFrozenNaturePolicyChallenge(mixed).index - 0.15) < 1e-12);
const netMean = structuredClone(packet);
netMean.cohorts[0].affectedArea = NATURE_TYPE_REFERENCES.mapped_coral_reef.mappedExtentKm2;
netMean.cohorts[0].scenarioComparison.withNodeScenario.value = (40 + 160) / 2;
netMean.cohorts[0].lossAggregationBasis = 'signed_net_response_mean';
assert.equal(evaluateFrozenNaturePolicyChallenge(netMean).index, null);
console.log(JSON.stringify({ status: 'passed', adversarialRejections: 19,
  catalogueInvariant: true, subtypePartitionInvariant: true, unitInvariant: true,
  sameTypeMagnitudePreserved: true, incompleteCoverageNotReweighted: true,
  gainsCannotEraseDisjointLosses: true,
  scoreAssigned: false }, null, 2));
