import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/urban-sprawl-current-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_urban_sprawl_current_reference_2026_09_24_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.deepEqual(snapshot.appliesToNodeIds, ['urban_sprawl_housing']);
assert.equal(snapshot.evidence.globalBuiltLandState.worldBuiltUpAreaKm2['2025'], 515_803.5);
assert.equal(snapshot.evidence.globalBuiltLandState.builtAreaIncreasePercent, 63.406323952898234);
assert.equal(snapshot.evidence.globalBuiltLandState.builtAreaPerPersonIncreasePercent, 23.529);
assert.equal(snapshot.evidence.recentLandUseEfficiency.cities, 781);
assert.equal(snapshot.evidence.recentLandUseEfficiency.countries, 123);
assert.equal(snapshot.evidence.recentLandUseEfficiency.landConsumptionRatePercent['2015-2020'], 1.24);
assert.equal(snapshot.evidence.recentLandUseEfficiency.landConsumptionRatePercent['2020-2025'], 0.83);
assert.equal(snapshot.evidence.recentLandUseEfficiency.relativeRateChangePercent, -33.065);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 6.3, grade: 'C', lower: 4, upper: 7.8, confidence: 'B' },
  revised: { value: 5.5, grade: 'C', lower: 3.3, upper: 7.8, confidence: 'C' },
});
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 1, central: 2, upper: 3 },
  reach: { lower: 0, central: 1, upper: 2 },
  persistence: { lower: 2, central: 3, upper: 4 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 7);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 5);

console.log('Urban-sprawl current-reference checks passed.');
