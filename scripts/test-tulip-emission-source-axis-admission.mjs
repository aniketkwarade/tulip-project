import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const audit = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/internal-emission-source-axis-admission-audit.json', import.meta.url),
  'utf8',
));

assert.equal(audit.version, 'tulip_internal_emission_source_axis_admission_audit_2026_09_25_v1');
assert.equal(audit.status, 'partial_endpoint_fails_axis_admission_and_literal_anchors_collapse');
assert.equal(audit.productionRatingsEnabled, 0);
assert.equal(audit.counts.nodes, 21);
assert.equal(audit.counts.patternCases, 84);
assert.equal(audit.counts.distinctEndpointValues, 84);
assert.equal(audit.counts.distinctLiteralHumanAxisVectors, 1);
assert.equal(audit.counts.nodesWithAnyAxisAdmitted, 0);
assert.equal(audit.counts.nodesWithCompletePeopleComponent, 0);
assert.equal(audit.counts.nodesWithCompleteNatureComponent, 0);
assert.equal(audit.counts.nodesWithCompleteTulipCandidate, 0);
assert.equal(audit.counts.currentCandidatesChanged, 0);
assert.deepEqual(audit.fixedAnchorTest.literalAxisVector, { severity: 4, reach: 1, persistence: 4 });
assert.equal(audit.fixedAnchorTest.literalPeopleComponent, 0.75);
assert.equal(audit.fixedAnchorTest.literalPeopleOnlyScaleScreen, 7.75);
assert(audit.endpointRange.dynamicRatio > 400);
assert(audit.endpointRange.minimumFractionOfFactualSampleHeatDeaths > 0);
assert(audit.endpointRange.maximumFractionOfFactualSampleHeatDeaths < 0.1);
assert.equal(audit.rows.length, 21);
assert.equal(new Set(audit.rows.map(row => row.nodeId)).size, 21);
assert.equal(audit.rows.every(row => row.patternCases.length === 4), true);
assert.equal(audit.rows.every(row => row.admittedAxes === 0 && row.scoreEffect === 'none'), true);
assert.equal(audit.rows.every(row => row.axisAdmission.humanReach.status === 'not_measured'), true);
assert.equal(audit.rows.every(row => row.axisAdmission.ecosystemSeverity.status === 'not_measured'), true);
assert.equal(audit.rows.every(row => row.literalAnchorApplication.status === 'diagnostic_only_rejected_for_score_setting'), true);
assert(audit.rejectedShortcuts.some(item => /catalogue rank/i.test(item)));
assert(audit.rejectedShortcuts.some(item => /nature structurally inapplicable/i.test(item)));
assert.match(audit.decision.nextGate, /retain the tie rather than manufacture differentiation/i);

const expectedDigest = createHash('sha256').update(JSON.stringify({
  inputs: audit.inputs,
  fixedAnchorTest: audit.fixedAnchorTest,
  counts: audit.counts,
  endpointRange: audit.endpointRange,
  principalFinding: audit.principalFinding,
  rejectedShortcuts: audit.rejectedShortcuts,
  decision: audit.decision,
  rows: audit.rows,
})).digest('hex');
assert.equal(audit.digest, expectedDigest);

console.log(`Emission-source axis-admission audit passed: ${audit.counts.patternCases} distinct cases collapse to ${audit.counts.distinctLiteralHumanAxisVectors} literal human-axis vector, with zero score changes.`);
