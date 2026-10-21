import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/seagrass-meadow-decline-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.deepEqual(snapshot.appliesToNodeIds, ['seagrass_meadow_decline']);
assert.equal(Object.keys(snapshot.sources).length, 3);
assert.equal(snapshot.evidence.globalMappedChange.mappedExtentKm2, 148_506);
assert.equal(snapshot.evidence.globalMappedChange.completeLossKm2, 5_969);
assert.equal(snapshot.evidence.globalMappedChange.completeLossPercentOfMappedExtent, 4);
assert.equal(snapshot.evidence.globalMappedChange.denseToSparseDegradationPercentOfMappedExtent, 4.2);
assert.equal(snapshot.evidence.globalRestorationEvidence.marineInterventions, 764);
assert.equal(snapshot.evidence.directRecoveryCase.monitoringYears, 7);
assert.equal(snapshot.evidence.directRecoveryCase.statisticallyRecoveredSites, 3);
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 3, central: 4, upper: 4 },
  reach: { lower: 2, central: 2, upper: 2 },
  persistence: { lower: 2, central: 2, upper: 3 },
});
assert.deepEqual(snapshot.ratingDecision.candidate.revised, {
  value: 7,
  grade: 'D',
  lower: 6.3,
  upper: 7.8,
  confidence: 'B',
  domains: ['ecosystem'],
});
assert.match(snapshot.snapshotDigest, /^[a-f0-9]{64}$/);
console.log('Seagrass-meadow-decline reference checks passed.');
