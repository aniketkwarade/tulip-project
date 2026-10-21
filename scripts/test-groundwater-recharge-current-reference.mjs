import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/groundwater-recharge-current-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_groundwater_recharge_current_reference_2026_09_24_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.deepEqual(snapshot.appliesToNodeIds, ['aquifer_recharge_failure']);
assert.equal(snapshot.sources.globalRechargeStudy2025.doi, '10.1016/j.jhydrol.2024.132490');
assert.equal(snapshot.sources.globalRechargeData2024.archive.bytes, 30_122_290);
assert.equal(snapshot.sources.globalRechargeData2024.archive.md5, '33e602cf67981316ebb6b872de59f51c');
assert.deepEqual(snapshot.evidence.globalRainFedRecharge.observationPeriod, { start: 2001, end: 2020 });
assert.equal(snapshot.evidence.globalRainFedRecharge.globalAverageRechargeMmPerYear, 176);
assert.equal(snapshot.evidence.globalRainFedRecharge.globalTrendMmPerYear, 0.2);
assert.equal(snapshot.evidence.globalRainFedRecharge.riverBasinsWithDecliningRechargePercent, 40);
assert.equal(snapshot.evidence.globalRainFedRecharge.basinsWithPersistentOrNewDeclinePercent, 50);
assert.equal(snapshot.evidence.storageAttributionBoundary.storageDecliningRechargeIncreasingBasinsPercent, 26);
assert.equal(snapshot.evidence.storageAttributionBoundary.rechargeAndStorageDecliningBasinsPercent, 22);
assert.equal(snapshot.evidence.storageAttributionBoundary.residentsInJointDeclineBasinsBillions, 1.7);
assert.equal(snapshot.evidence.sensitivityMechanism.rechargeLocations, 5_237);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 5.9, grade: 'C', lower: 3.6, upper: 8.1, confidence: 'C' },
  revised: { value: 4.4, grade: 'B', lower: 2.1, upper: 7, confidence: 'C' },
});
assert.deepEqual(snapshot.ratingDecision.axes.human, {
  severity: { lower: 0, central: 1, upper: 2 },
  reach: { lower: 0, central: 1, upper: 3 },
  persistence: { lower: 1, central: 2, upper: 3 },
});
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 0, central: 1, upper: 2 },
  reach: { lower: 1, central: 2, upper: 3 },
  persistence: { lower: 1, central: 2, upper: 3 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 7);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 5);

console.log('Groundwater-recharge current-reference checks passed.');
