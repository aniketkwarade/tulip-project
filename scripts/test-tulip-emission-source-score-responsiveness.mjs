import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const audit = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/internal-emission-source-score-responsiveness-audit.json', import.meta.url),
  'utf8',
));

assert.equal(audit.version, 'tulip_internal_emission_source_score_responsiveness_audit_2026_09_25_v2');
assert.equal(audit.status, 'provisional_scores_not_source_responsive');
assert.equal(audit.productionRatingsEnabled, 0);
assert.equal(audit.counts.nodes, 21);
assert.equal(audit.counts.uniqueEndpointValues, 21);
assert.equal(audit.counts.uniqueScores, 3);
assert.equal(audit.counts.largestEqualScoreGroup, 19);
assert.equal(audit.counts.endpointAdmittedToAxes, 0);
assert(audit.counts.tiedPairsAcrossDistinctEndpoints > 100);
assert(audit.counts.scoreInversions > 0);
assert(audit.principalFinding.endpointDynamicRatio > 100);
assert.equal(audit.rows.every(row => row.confidence === 'D'), true);
assert.equal(audit.rows.every(row => row.endpointAdmittedToAxes === false), true);
assert.equal(audit.rows.find(row => row.nodeId === 'rice_paddy_methane_bubbles').sourceGas, 'CH4');
assert.match(audit.methodBoundary.prohibitedUse, /not a global harm estimate/i);
assert.match(audit.decision.requiredNextGate, /human and ecosystem endpoints/i);

const expectedDigest = createHash('sha256').update(JSON.stringify({
  methodBoundary: audit.methodBoundary,
  counts: audit.counts,
  principalFinding: audit.principalFinding,
  decision: audit.decision,
  scoreGroups: audit.scoreGroups,
  inversions: audit.inversions,
  rows: audit.rows,
})).digest('hex');
assert.equal(audit.digest, expectedDigest);

console.log(`Emission-source score responsiveness audit passed: ${audit.counts.largestEqualScoreGroup} nodes share one candidate across a ${audit.principalFinding.endpointDynamicRatio}× endpoint range, retained at confidence D.`);
