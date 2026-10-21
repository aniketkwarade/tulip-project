import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/snow-harm-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_snow_harm_reference_2026_09_24_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.evidence.northernHemisphereSnowpack.majorRiverBasins, 169);
assert.equal(snapshot.evidence.northernHemisphereSnowpack.basinsWithRobustSnowTrendsReported, 82);
assert.equal(snapshot.evidence.northernHemisphereSnowpack.basinsWithTrendsConfidentlyAttributedToHumanInfluenceReported, 31);
assert.equal(snapshot.evidence.canadianSnowDrought.compatibleUniqueHarmedPersonCount, null);
assert.equal(snapshot.evidence.canadianSnowDrought.compatibleAffectedEcosystemDistributionPercent, null);
assert.equal(snapshot.evidence.snowmeltTiming.snowAffectedCatchments, 2_339);
assert.equal(snapshot.evidence.snowmeltTiming.catchmentsWithDelayedSnowmeltFloodsApproximatePercent, 30);
assert.equal(snapshot.evidence.alpineSnowCoverLegacy.direction, 'mixed_by_topography_and_snow_duration');
assert.deepEqual(snapshot.ratingDecision.changes, {
  snow_drought: { prior: { value: 7.4, grade: 'D' }, revised: { value: 4.4, grade: 'B', lower: 2.1, upper: 6.3, confidence: 'C' } },
  snowmelt_timing_shift: { prior: { value: 7.4, grade: 'D' }, revised: { value: 3.6, grade: 'B', lower: 1.8, upper: 5.9, confidence: 'C' } },
  alpine_snowpack_declines: { prior: { value: 7, grade: 'D' }, revised: { value: 4, grade: 'B', lower: 1.8, upper: 6.3, confidence: 'C' } },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 5);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 4);

console.log('Snow-harm reference checks passed.');
