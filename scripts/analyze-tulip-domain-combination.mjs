import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { combineMappedDomainCandidate, DOMAIN_COMBINATION_POLICIES, DOMAIN_COMBINATION_EXPERIMENT_VERSION } from '../src/tulip-domain-combination-experiment.js';

const decisionPath = 'src/tulip-domain-combination-decision.json';
const decisionBytes = readFileSync(decisionPath);
const decision = JSON.parse(decisionBytes);
assert.equal(decision.policyId, 'fixed_average');
assert.deepEqual(decision.weights, { human: 0.5, ecosystem: 0.5 });
assert.equal(decision.status, 'user_confirmed_combination_only');

const sourcePath = 'artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json';
const source = readFileSync(sourcePath);
const catalogue = JSON.parse(source);
const coverage = { both: 0, humanOnly: 0, natureOnly: 0 };
for (const row of catalogue.issues) {
  const domains = row.candidate.applicableDomains;
  assert(domains.length === 1 || domains.length === 2);
  if (domains.length === 2) coverage.both++;
  else if (domains[0] === 'human') coverage.humanOnly++;
  else { assert.equal(domains[0], 'ecosystem'); coverage.natureOnly++; }
}
const profiles = [[1, 1], [3, 1], [5, 1], [7, 1], [9, 1], [10, 1],
  [9, 3], [9, 5], [3, 3], [5, 5], [7, 7], [9, 9], [10, 10], [5.01, 5.08]];
const policies = Object.keys(DOMAIN_COMBINATION_POLICIES);
const cases = profiles.map(([human, ecosystem]) => ({
  kind: 'hypothetical_mapped_component_profile_not_node_rating', human, ecosystem,
  results: Object.fromEntries(policies.map(policyId => [policyId,
    combineMappedDomainCandidate({ human, ecosystem, policyId })])),
}));
const report = {
  version: DOMAIN_COMBINATION_EXPERIMENT_VERSION,
  interpretation: 'Comparison of declared policy meanings. Component readings are hypothetical, not measured node impacts.',
  inputs: [{ path: sourcePath, sha256: createHash('sha256').update(source).digest('hex') },
    { path: decisionPath, sha256: createHash('sha256').update(decisionBytes).digest('hex') }],
  currentScopeDraftCounts: coverage, policies: DOMAIN_COMBINATION_POLICIES, cases,
  scopeDecision: {
    fixedAverageSingleDomainMaximumWithVerifiedZeroOther: 5.5,
    fixedAverageNineMinimumOtherDomainWhenOneIsTen: 8,
    missingOtherDomainIsNotVerifiedZero: true,
    endpointScopeExclusionIsNotProofOfNoOtherHarm: true,
    status: 'user_decided_fixed_average',
    selectedPolicyId: decision.policyId,
    decisionVersion: decision.version,
    resolvedMeaning: decision.meaning,
    acceptedTradeOff: decision.acceptedTradeOff,
    outcomeBoundaries: decision.outcomeBoundaries,
    overlapRule: decision.overlapRule,
  },
  recommendation: 'Apply the user-confirmed fixed 50/50 average in the replacement method. Keep alternatives as historical policy comparisons. Calibration and whole-node evidence remain required before changing public ratings.',
  scientificCalibrationApproved: false, wholeNodeRatingsAdmitted: 0, publicScoresChanged: false,
};
writeFileSync('artifacts/tulip-consequence-rule-audit-2026-09-27/domain-combination-comparison.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ currentScopeDraftCounts: coverage, hypotheticalCases: cases.length,
  selectedInternalCombination: decision.policyId,
  selectedPublicPolicy: null, wholeNodeRatingsAdmitted: 0, publicScoresChanged: false }, null, 2));
