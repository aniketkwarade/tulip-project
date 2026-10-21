import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/coastal-permafrost-erosion-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_coastal_permafrost_erosion_reference_2026_09_24_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.evidence.newtokRelocation.observedPeriod.end, 2024);
assert.equal(snapshot.evidence.newtokRelocation.compatibleReachClassification, 'fewer_than_10000_people');
assert.equal(snapshot.evidence.newtokMechanismAndLoss.reportedLandLossFeetPerYearMaximum, 72);
assert.equal(snapshot.evidence.newtokMechanismAndLoss.homesAtImmediateRiskAndDemolishedIn2019, 7);
assert.equal(snapshot.evidence.yukonKuskokwimEcosystems.observedEcotypeAreaChangedPercent, 16);
assert.equal(snapshot.evidence.yukonKuskokwimEcosystems.compatibleCurrentErosionOnlyConditionLossPercent, null);
assert.equal(snapshot.evidence.yukonKuskokwimEcosystems.compatibleCurrentErosionOnlyAffectedDistributionPercent, null);
assert.equal(snapshot.evidence.yukonKuskokwimEcosystems.compatibleRecoveryTimeDistribution, null);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 7, grade: 'D', lower: 5.1, upper: 7.8, confidence: 'B' },
  revised: { value: 7, grade: 'D', lower: 5.9, upper: 7.4, confidence: 'B' },
});
assert.deepEqual(snapshot.ratingDecision.axes.human, {
  severity: { lower: 3, central: 3, upper: 3 },
  reach: { lower: 1, central: 1, upper: 1 },
  persistence: { lower: 4, central: 4, upper: 4 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 6);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 3);

console.log('Coastal-permafrost erosion reference checks passed.');
