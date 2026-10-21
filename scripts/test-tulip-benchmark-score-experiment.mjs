import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createFixedBenchmarkScoreExperiment } from '../src/tulip-benchmark-score-experiment.js';
import { mapFixedBenchmarkMagnitude, roundBenchmarkDisplay } from '../src/tulip-fixed-benchmark-map.js';
import { benchmarkCalibrationFixtures } from './lib/tulip-benchmark-calibration-fixtures.mjs';

const fixture = benchmarkCalibrationFixtures();
const compiler = data => createFixedBenchmarkScoreExperiment(data);
const engine = compiler(fixture);
const decision = JSON.parse(readFileSync(new URL('../src/tulip-domain-combination-decision.json', import.meta.url)));
assert.equal(decision.policyId, 'fixed_average');
assert.deepEqual(fixture.policy.weights, decision.weights);
assert.equal(fixture.policy.combination, decision.kernelCombination);
assert.equal(engine.calculate(fixture.packet).domainCombinationDecisionVersion, decision.version);
const calculate = (humanScore, ecosystemScore) => {
  const packet = structuredClone(fixture.packet);
  packet.components.human.observationId = `human_${humanScore}`;
  packet.components.ecosystem.observationId = `ecosystem_${ecosystemScore}`;
  return engine.calculate(packet);
};
const targets = [1, 3, 5, 7, 9, 10];
let combinations = 0;
for (const human of targets) for (const ecosystem of targets) {
  const result = calculate(human, ecosystem);
  assert.equal(result.status, 'experimental_fixed_domain_composite');
  assert.equal(result.experimentalValue, roundBenchmarkDisplay((human + ecosystem) / 2));
  assert.equal(result.value, null);
  assert.equal(result.publicReady, false);
  assert.equal(result.range.kind, 'propagated_component_envelope_not_joint_confidence_interval');
  assert(result.displayRange.lower <= result.range.lower);
  assert(result.displayRange.upper >= result.range.upper);
  assert(result.displayRange.lower <= result.experimentalValue && result.experimentalValue <= result.displayRange.upper);
  combinations++;
}
assert.equal(calculate(9, 1).experimentalValue, 5);
assert.equal(calculate(1, 9).experimentalValue, 5);

const rounding = structuredClone(fixture.packet);
rounding.components.human.observationId = 'human_rounding_case';
rounding.components.ecosystem.observationId = 'ecosystem_rounding_case';
const precise = engine.calculate(rounding);
assert(Math.abs(precise.components.human.unrounded.central - 5.01) < 1e-12);
assert(Math.abs(precise.components.ecosystem.unrounded.central - 5.08) < 1e-12);
assert.equal(precise.experimentalValue, 5);
assert.deepEqual(precise.displayRange, { lower: 5, upper: 5.1,
  kind: 'propagated_component_envelope_not_joint_confidence_interval', rounding: 'outward_to_one_decimal' });
const doubleRounded = roundBenchmarkDisplay((roundBenchmarkDisplay(precise.components.human.unrounded.central)
  + roundBenchmarkDisplay(precise.components.ecosystem.unrounded.central)) / 2);
assert.equal(doubleRounded, 5.1);

let rejections = 0;
const rejectPacket = (mutate, reason) => {
  const packet = structuredClone(fixture.packet);
  mutate(packet);
  const result = engine.calculate(packet);
  assert.equal(result.status, 'needs_calibration_inputs');
  assert.equal(result.experimentalValue, null);
  assert.equal(result.value, null);
  assert(result.reasons.includes(reason), result.reasons.join(', '));
  rejections++;
};
rejectPacket(packet => { delete packet.components.ecosystem; }, 'ecosystem_registered_consequence_required');
rejectPacket(packet => { delete packet.assessmentKind; }, 'explicit_assessment_kind_required');
rejectPacket(packet => { packet.assessmentKind = 'domain_endpoint_only'; }, 'single_endpoint_scope_required');
rejectPacket(packet => { packet.components.ecosystem.observationId = 'unknown'; }, 'ecosystem_registered_observation_required');
rejectPacket(packet => { packet.policyVersion = 'retuned'; }, 'fixed_policy_version_mismatch');
rejectPacket(packet => { packet.policyDefinitionKey = 'retuned_definition'; }, 'fixed_policy_definition_changed');
rejectPacket(packet => { packet.components.human.calibrationVersion = 'retuned'; }, 'human_calibration_version_changed');
rejectPacket(packet => { packet.components.human.sourceVersion = 'superseded'; }, 'human_source_binding_changed');
rejectPacket(packet => { packet.weights = { human: 1, ecosystem: 0 }; }, 'packet_scoring_overrides_forbidden');
rejectPacket(packet => { packet.anchors = [1, 2]; }, 'packet_scoring_overrides_forbidden');
rejectPacket(packet => { packet.excludedDomains = ['ecosystem']; }, 'packet_scoring_overrides_forbidden');
rejectPacket(packet => { packet.components.human.central = 0; }, 'human_reference_cannot_override_registered_input');
rejectPacket(packet => { packet.assessmentPeriod = '2026'; }, 'human_assessmentPeriod_source_scope_mismatch');
rejectPacket(packet => { packet.geography = 'Europe'; }, 'human_geography_source_scope_mismatch');
rejectPacket(packet => { packet.counterfactualId = 'a_new_counterfactual'; }, 'human_counterfactualId_source_scope_mismatch');
rejectPacket(packet => { packet.nodeId = 'unbound_node'; }, 'human_node_outcome_binding_mismatch');
rejectPacket(packet => { packet.components.ecosystem.calibrationId = 'human_health_candidate'; }, 'ecosystem_compatible_calibration_required');
rejectPacket(packet => { packet.components.ecosystem.observationId = 'human_5'; }, 'ecosystem_duplicate_observation');

const rejectObservation = (id, mutate, reason) => {
  const variant = structuredClone(fixture);
  mutate(variant.observations[id]);
  const result = compiler(variant).calculate(variant.packet);
  assert.equal(result.experimentalValue, null);
  assert(result.reasons.includes(reason), result.reasons.join(', '));
  rejections++;
};
rejectObservation('human_5', row => { row.unit = 'deaths'; }, 'human_quantity_unit_incompatible');
rejectObservation('human_5', row => { row.central = null; }, 'human_central_quantity_invalid');
rejectObservation('human_5', row => { row.artifactSha256 = 'changed'; }, 'human_source_lineage_or_overlap_review_missing');
rejectObservation('human_5', row => { row.artifactSha256 = '1'.repeat(64); }, 'human_source_binding_changed');
rejectObservation('human_5', row => { row.lower = row.upper + 1; }, 'human_source_bounds_invalid');
rejectObservation('human_5', row => { row.reportingPeriodBasis = 'ten_year_projection'; }, 'human_reportingPeriodBasis_calibration_mismatch');
rejectObservation('human_5', row => { row.basis = 'current_catalogue_percentile'; }, 'human_quantity_basis_mismatch');
rejectObservation('human_5', row => { row.consequenceBasis = 'exposed_population'; }, 'human_current_consequence_quantity_required');
rejectObservation('human_5', row => { row.central = 0; row.lower = 0; row.upper = 0; }, 'human_verified_zero_required');
rejectObservation('ecosystem_5', row => { row.central = 2; row.lower = 2; row.upper = 2; }, 'ecosystem_fraction_outside_fixed_reference');
rejectObservation('ecosystem_5', row => { row.referenceVersion = 'recalculated_for_new_node'; }, 'ecosystem_fixed_reference_mismatch');

const unknownBounds = structuredClone(fixture);
delete unknownBounds.observations.human_5.lower;
delete unknownBounds.observations.human_5.upper;
const unknownResult = compiler(unknownBounds).calculate(unknownBounds.packet);
assert.equal(unknownResult.experimentalValue, 5);
assert.equal(unknownResult.range, null);
assert.equal(unknownResult.displayRange, null);

// Change the source unit, NOT its meaning. Conversion includes all bounds.
const units = structuredClone(fixture);
for (const id of ['human_5', 'ecosystem_5']) {
  const row = units.observations[id];
  const factor = id.startsWith('human') ? 0.001 : 100;
  row.unit = id.startsWith('human') ? 'thousand_DALYs' : 'percent';
  for (const key of ['central', 'lower', 'upper']) row[key] *= factor;
}
assert.equal(compiler(units).calculate(units.packet).unrounded, engine.calculate(fixture.packet).unrounded);

// The same fixed source bindings can support a future calibration CASE after
// scope review. Neither that case nor an unrelated source refits the ruler.
const future = structuredClone(fixture.packet);
future.nodeId = 'synthetic_future_case';
assert.equal(engine.calculate(future).unrounded, engine.calculate(fixture.packet).unrounded);
const additional = structuredClone(fixture);
additional.observations.unrelated = { ...additional.observations.human_5,
  nodeIds: ['unrelated_case'], central: 999_999_999, lower: null, upper: null };
assert.deepEqual(compiler(additional).calculate(additional.packet), engine.calculate(fixture.packet));
additional.observations = Object.fromEntries(Object.entries(additional.observations).reverse());
assert.deepEqual(compiler(additional).calculate(additional.packet), engine.calculate(fixture.packet));

const mutable = structuredClone(fixture);
const frozenEngine = compiler(mutable);
const frozenBefore = frozenEngine.calculate(mutable.packet);
mutable.policy.weights.human = 0.8;
mutable.policy.calibrations.human_health_candidate.points[2].burden *= 100;
mutable.observations.human_5.central *= 20;
assert.deepEqual(frozenEngine.calculate(mutable.packet), frozenBefore);
const copiedPolicy = frozenEngine.describePolicy();
copiedPolicy.weights.human = 0.9;
assert.equal(frozenEngine.describePolicy().weights.human, 0.5);
assert.throws(() => compiler(mutable), /equal_domain_policy_required/);
const changedDefinition = structuredClone(fixture);
changedDefinition.policy.calibrations.human_health_candidate.points[2].burden *= 2;
const staleDefinition = compiler(changedDefinition).calculate(changedDefinition.packet);
assert.equal(staleDefinition.experimentalValue, null);
assert(staleDefinition.reasons.includes('fixed_policy_definition_changed'));

// Direct map stress checks use independent magnitudes and equivalent units.
for (const calibration of Object.values(fixture.policy.calibrations)) {
  let previous = 1;
  const limit = calibration.points.at(-1).burden;
  for (let step = 0; step <= 1000; step++) {
    const quantity = limit * step / 1000;
    const value = mapFixedBenchmarkMagnitude(quantity, calibration.points, calibration.logOffset);
    assert(value >= previous);
    assert(value >= 1 && value <= 10);
    previous = value;
    const alternateUnit = mapFixedBenchmarkMagnitude(quantity * 1000,
      calibration.points.map(point => ({ ...point, burden: point.burden * 1000 })), calibration.logOffset * 1000);
    assert(Math.abs(value - alternateUnit) < 1e-11);
  }
}
assert.equal(mapFixedBenchmarkMagnitude(NaN, fixture.policy.calibrations.human_health_candidate.points), null);
assert.equal(mapFixedBenchmarkMagnitude(-1, fixture.policy.calibrations.human_health_candidate.points), null);
const response = engine.calculate({ nodeId: 'synthetic_response', nodeKind: 'response', policyVersion: fixture.policy.version,
  policyDefinitionKey: engine.policyDefinitionKey });
assert.equal(response.status, 'not_applicable_response');
assert.equal(response.experimentalValue, null);
assert.equal(response.displayRange, null);

// Verify that the real adapter is exactly the separately pinned WHO endpoint,
// not an invented nature component or a passed whole-node air-pollution score.
const whoArtifact = readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-pollution-dalys-2021-report.json', import.meta.url));
assert.equal(createHash('sha256').update(whoArtifact).digest('hex'), fixture.observations.who_joint_air_health_endpoint.artifactSha256);
const who = engine.calculate(fixture.whoPacket);
assert.equal(who.status, 'experimental_domain_endpoint');
assert.equal(who.experimentalValue, null);
assert.equal(who.experimentalEndpointValue, 9.2);
assert.equal(who.comparisonBasis, 'domain_endpoint_not_comparable_to_fixed_composite');
assert.equal(who.value, null);
assert.equal(who.publicReady, false);
assert.equal(who.components.ecosystem.status, 'registered_scope_exclusion');
assert(who.range.lower < who.unrounded && who.unrounded < who.range.upper);
const falselyComparableEndpoint = { ...fixture.whoPacket, assessmentKind: 'fixed_people_nature_composite' };
const refusedComposite = engine.calculate(falselyComparableEndpoint);
assert.equal(refusedComposite.experimentalValue, null);
assert.equal(refusedComposite.experimentalEndpointValue, null);
assert(refusedComposite.reasons.includes('ecosystem_endpoint_exclusion_cannot_fill_composite'));
const broaderNode = { ...fixture.whoPacket, nodeId: 'air_pollution_health_burden' };
const broaderResult = engine.calculate(broaderNode);
assert.equal(broaderResult.experimentalValue, null);
assert(broaderResult.reasons.includes('human_node_outcome_binding_mismatch'));
assert(broaderResult.reasons.includes('ecosystem_registered_consequence_required'));

console.log(JSON.stringify({ status: 'passed', anchorCombinations: combinations,
  rejectedPacketOrObservationVariants: rejections, monotonicAndUnitChecks: 2002,
  componentRoundingCounterexample: { correct: precise.experimentalValue, prematureRounding: doubleRounded },
  futureCaseAndUnrelatedObservationInvariant: true, compiledInputsFrozen: true,
  incompleteCoverageNotReweighted: true, unknownBoundsNotInvented: true,
  responseExcluded: true, whoHealthEndpointOnlyCandidate: who.experimentalEndpointValue,
  endpointNeverReturnedAsComparableComposite: true,
  wholeNodeScoresAssigned: 0 }, null, 2));
