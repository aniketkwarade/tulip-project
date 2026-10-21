import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/rain-on-snow-current-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_rain_on_snow_current_reference_2026_09_24_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.evidence.eventMechanism.eventPeriod.start, '2022-06-10');
assert.equal(snapshot.evidence.eventMechanism.rainAndSnowmeltTwentyFourHourInches.lower, 7.5);
assert.equal(snapshot.evidence.eventMechanism.rainAndSnowmeltTwentyFourHourInches.upper, 9.5);
assert.equal(snapshot.evidence.humanConsequences.compatibleUniqueEvacuatedPeopleApproximate, 12_200);
assert.equal(snapshot.evidence.humanConsequences.mammothPowerLossHoursLowerBound, 24);
assert.equal(snapshot.evidence.humanConsequences.southLoopClosureDays, 9);
assert.equal(snapshot.evidence.humanConsequences.lastConcessionFacilityClosureDurationMonthsApproximate, 14);
assert.equal(snapshot.evidence.ecosystemAndPhysicalConsequences.compatibleBiologicalConditionLossPercent, null);
assert.equal(snapshot.evidence.ecosystemAndPhysicalConsequences.compatibleAffectedEcosystemDistributionPercent, null);
assert.equal(snapshot.evidence.ecosystemAndPhysicalConsequences.compatibleRecoveryTimeDistribution, null);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 7, grade: 'D', lower: 5.9, upper: 8.5, confidence: 'C' },
  revised: { value: 5.5, grade: 'C', lower: 3.6, upper: 6.6, confidence: 'C' },
});
assert.deepEqual(snapshot.ratingDecision.axes.human, {
  severity: { lower: 2, central: 3, upper: 3 },
  reach: { lower: 2, central: 2, upper: 2 },
  persistence: { lower: 2, central: 3, upper: 3 },
});
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 0, central: 1, upper: 2 },
  reach: { lower: 0, central: 1, upper: 2 },
  persistence: { lower: 1, central: 2, upper: 3 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 7);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 4);

console.log('Rain-on-snow current-reference checks passed.');
