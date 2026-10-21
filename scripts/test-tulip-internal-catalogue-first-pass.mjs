import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const [catalogue, pilot, registry] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/internal-all-node-first-pass-candidates.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-20-node-first-pass-candidates.json'),
  json('public/tulip-assessments.json'),
]);

assert.equal(catalogue.counts.catalogue, 381);
assert.equal(catalogue.counts.issues, 354);
assert.equal(catalogue.counts.responses, 27);
assert.equal(catalogue.counts.authoredPilot, 18);
assert.equal(catalogue.counts.deterministicRemaining, 336);
assert.equal(catalogue.issues.length, 354);
assert.equal(catalogue.responses.length, 27);
assert.equal(new Set([...catalogue.issues, ...catalogue.responses].map(row => row.nodeId)).size, 381);
assert.equal(catalogue.productionRatingsEnabled, 0);

for (const row of catalogue.issues) {
  assert.equal(row.result.status, 'internal_candidate', row.nodeId);
  assert(Number.isFinite(row.result.value) && row.result.value >= 1 && row.result.value <= 10, row.nodeId);
  assert(['A', 'B', 'C', 'D', 'E'].includes(row.result.grade.letter), row.nodeId);
  assert(row.result.uncertainty.lower <= row.result.value && row.result.value <= row.result.uncertainty.upper, row.nodeId);
  assert(row.candidate.currentWindow.end <= 2026, row.nodeId);
  assert.equal(row.candidate.currentWindow.isLatestAvailable, true, row.nodeId);
  assert(row.candidate.currentWindow.normalization, row.nodeId);
  assert(row.candidate.components.human.evidenceReferences.length, row.nodeId);
  assert(row.candidate.components.ecosystem.evidenceReferences.length, row.nodeId);
  assert.equal(row.candidate.sourceDigest, registry.records[row.nodeId].sourceDigest, row.nodeId);
  assert(['high', 'medium'].includes(row.reviewPriority), row.nodeId);
  assert(Array.isArray(row.reviewFlags) && row.reviewFlags.length, row.nodeId);
  if (row.candidate.referenceBasis.type === 'wmo_climatological_normal') {
    assert.deepEqual([row.candidate.referenceBasis.start, row.candidate.referenceBasis.end], [1991, 2020], row.nodeId);
  }
}
for (const row of catalogue.responses) {
  assert.equal(row.result.status, 'not_applicable', row.nodeId);
  assert.equal(row.result.value, null, row.nodeId);
}

const byId = new Map(catalogue.issues.map(row => [row.nodeId, row]));
for (const pilotRow of pilot.candidates) {
  const catalogueRow = byId.get(pilotRow.nodeId);
  if (catalogueRow) {
    assert.equal(catalogueRow.assessmentMode, 'authored_pilot_first_pass', pilotRow.nodeId);
    assert.deepEqual(catalogueRow.candidate, pilotRow.candidate, pilotRow.nodeId);
    assert.deepEqual(catalogueRow.result, pilotRow.result, pilotRow.nodeId);
  }
}

assert.equal(catalogue.gradeCounts.A, 0, 'The unused A band must remain visible as a calibration finding');
assert(catalogue.reviewCounts.high > 0);
assert(catalogue.reviewCounts.automatedExtreme > 0);
assert.equal(catalogue.reviewCounts.high + catalogue.reviewCounts.medium, 354);

console.log('Internal TULIP catalogue first pass passed: 354 issue candidates, 27 response exclusions, source binding, pilot preservation, WMO baselines, bounds and explicit review flags.');
