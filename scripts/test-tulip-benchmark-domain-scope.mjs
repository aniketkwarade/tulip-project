import assert from 'node:assert/strict';
import { benchmarkCalibrationFixtures } from './lib/tulip-benchmark-calibration-fixtures.mjs';
import { createFixedBenchmarkScoreExperiment } from '../src/tulip-benchmark-score-experiment.js';

const fixture = benchmarkCalibrationFixtures();
const endpointId = 'synthetic_health_endpoint_only';
const broadId = 'synthetic_broader_consequence_case';
for (const row of Object.values(fixture.observations)) row.nodeIds.push(endpointId, broadId);
fixture.exclusions[endpointId] = { ecosystem: {
  scope: 'endpoint_only', reviewEvidenceId: 'synthetic_scope_review',
  reason: 'Invented health endpoint scope, not proof of zero nature harm for a whole phenomenon.',
} };
const engine = createFixedBenchmarkScoreExperiment(fixture);
const packet = (human, nature) => ({
  ...structuredClone(fixture.packet), nodeId: broadId,
  components: {
    human: { ...fixture.packet.components.human, observationId: `human_${human}` },
    ecosystem: { ...fixture.packet.components.ecosystem, observationId: `ecosystem_${nature}` },
  },
});
let fixedCompositeChecks = 0;
for (const human of [1, 3, 5, 7, 9, 10]) {
  const reference = packet(human, 1);
  const baseline = engine.calculate(reference);
  assert.equal(baseline.experimentalValue, (human + 1) / 2);
  for (const nature of [1, 3, 5, 7, 9, 10]) {
    const broader = engine.calculate(packet(human, nature));
    assert(broader.unrounded >= baseline.unrounded);
    assert.equal(broader.experimentalEndpointValue, null);
    const endpointPacket = { ...structuredClone(reference), nodeId: endpointId,
      assessmentKind: 'domain_endpoint_only', components: { human: reference.components.human } };
    const endpoint = engine.calculate(endpointPacket);
    assert.equal(endpoint.experimentalEndpointValue, human);
    assert.equal(endpoint.experimentalValue, null);
    assert.notEqual(endpoint.comparisonBasis, broader.comparisonBasis);
    const mislabeled = engine.calculate({ ...endpointPacket, assessmentKind: 'fixed_people_nature_composite' });
    assert.equal(mislabeled.experimentalValue, null);
    assert.equal(mislabeled.experimentalEndpointValue, null);
    assert(mislabeled.reasons.includes('ecosystem_endpoint_exclusion_cannot_fill_composite'));
    fixedCompositeChecks++;
  }
}
const missing = packet(9, 1);
delete missing.components.ecosystem;
assert.equal(engine.calculate(missing).experimentalValue, null);
const inventedZero = structuredClone(fixture);
delete inventedZero.observations.ecosystem_1.zeroMeaning;
assert.equal(createFixedBenchmarkScoreExperiment(inventedZero).calculate(packet(9, 1)).experimentalValue, null);
const unknownScope = structuredClone(fixture);
delete unknownScope.exclusions[endpointId].ecosystem.scope;
const endpointPacket = { ...packet(9, 1), nodeId: endpointId, assessmentKind: 'domain_endpoint_only',
  components: { human: fixture.packet.components.human } };
assert.equal(createFixedBenchmarkScoreExperiment(unknownScope).calculate(endpointPacket).experimentalEndpointValue, null);
console.log(JSON.stringify({status: 'passed', fixedCompositeChecks,
  addingNatureHarmNeverReducesSameFixedComposite: true,
  endpointNeverReturnedAsComparableComposite: true,
  missingOrExcludedNatureNotConvertedToZero: true, publicScoresChanged: false }));
