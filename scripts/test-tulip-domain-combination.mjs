import assert from 'node:assert/strict';
import { combineMappedDomainCandidate, DOMAIN_COMBINATION_POLICIES } from '../src/tulip-domain-combination-experiment.js';

let checks = 0;
for (const policyId of Object.keys(DOMAIN_COMBINATION_POLICIES)) {
  const combine = (human, ecosystem) => combineMappedDomainCandidate({ human, ecosystem, policyId });
  assert.equal(combine(1, 1).experimentalValue, 1);
  assert.equal(combine(10, 10).experimentalValue, 10);
  for (const human of [1, 3, 5, 7, 9, 10]) {
    let previous = 1;
    for (let step = 0; step <= 900; step++) {
      const ecosystem = 1 + step / 100;
      const result = combine(human, ecosystem);
      const reversed = combine(ecosystem, human);
      assert(Math.abs(result.unrounded - reversed.unrounded) < 1e-12);
      assert(result.unrounded + 1e-12 >= previous);
      assert(result.unrounded >= 1 && result.unrounded <= 10);
      assert.equal(result.value, null);
      assert.equal(result.publicReady, false);
      previous = result.unrounded;
      checks++;
    }
  }
  for (const invalid of [null, undefined, NaN, Infinity, 0, 10.1, '9']) {
    assert.equal(combine(invalid, 9).experimentalValue, null);
    assert.equal(combine(9, invalid).experimentalValue, null);
  }
}
const result = (policyId, human, ecosystem) => combineMappedDomainCandidate({ human, ecosystem, policyId }).experimentalValue;
assert.equal(result('fixed_average', 9, 1), 5);
assert.equal(result('worse_domain', 9, 1), 9);
assert.equal(result('bounded_accumulation', 9, 1), 9);
assert.equal(result('fixed_average', 10, 1), 5.5);
assert.equal(result('worse_domain', 5, 5), 5);
assert.equal(result('bounded_accumulation', 5, 5), 7.2);
assert.equal(result('fixed_average', 5.01, 5.08), 5);
assert.equal(result('unknown_policy', 9, 1), null);
console.log(JSON.stringify({status: 'passed', symmetryMonotonicityAndRangeChecks: checks,
  noProbabilityOrCalibrationClaim: true, missingDomainsRejected: true, publicScoresChanged: false}));
