import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/forest-fragmentation-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.endpoints.currentBiodiversity.taxa, 4_006);
assert.equal(snapshot.endpoints.currentBiodiversity.studies, 37);
assert.equal(snapshot.endpoints.currentBiodiversity.continents, 6);
assert.equal(snapshot.endpoints.longTermExperiments.maximumExperimentYears, 35);
assert.equal(snapshot.endpoints.longTermExperiments.remainingForestWithinOneKmOfEdgePercent, 70);
assert.deepEqual(snapshot.tulipUse.proposedAxes.ecosystem, {
  severity: { lower: 1, central: 2, upper: 3 },
  reach: { lower: 1, central: 2, upper: 3 },
  persistence: { lower: 3, central: 3, upper: 3 },
});
assert(snapshot.tulipUse.prohibited.some(rule => /edge-proximity share/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /13–75%/i.test(rule)));

console.log('Forest-fragmentation reference passed: direct biodiversity effects, affected reach and long-term persistence remain separate.');
