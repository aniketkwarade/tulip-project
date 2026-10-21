import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/wetland-peat-fire-current-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.version, 'tulip_wetland_peat_fire_current_reference_2026_09_25_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.deepEqual(snapshot.appliesToNodeIds, ['wetland_peat_fires']);
assert.equal(Object.keys(snapshot.sources).length, 6);
assert.equal(snapshot.evidence.terminalHumanConsequence2019.modelledExcessDeathsIndonesiaMoreThan, 87_000);
assert.equal(snapshot.evidence.terminalHumanConsequence2019.sumatraAndKalimantanPopulationContextOnly, 74_700_000);
assert.equal(snapshot.evidence.currentExposureUpdate2023.peopleExposedToUnhealthyOrWorseAir, 1_620_000);
assert.equal(snapshot.evidence.ecosystemFunction.wildfireReductionInPristinePeatlandCarbonUptakePercent, 35);
assert.equal(snapshot.evidence.postFireRecovery.recentlyBurnedSiteNetCarbonSourceYears, 4);
assert.equal(snapshot.evidence.postFireRecovery.estimatedTotalCarbonLossKgPerM2Over20Years, 2.9);
assert.equal(snapshot.evidence.mappedCurrentExtent.canadaPeatlandBurnedAreaMillionHa, 5.1);
assert.equal(snapshot.evidence.mappedCurrentExtent.canadianEventShareOfApproximateGlobalPeatlandAreaPercent, 1.05);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 7.4, grade: 'D', lower: 6.3, upper: 8.5, confidence: 'C', domains: ['human', 'ecosystem'] },
  revised: { value: 7.4, grade: 'D', lower: 6.3, upper: 8.1, confidence: 'C', domains: ['human', 'ecosystem'] },
});
assert.deepEqual(snapshot.ratingDecision.axes.human, {
  severity: { lower: 4, central: 4, upper: 4 },
  reach: { lower: 2, central: 2, upper: 2 },
  persistence: { lower: 4, central: 4, upper: 4 },
});
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 1, central: 2, upper: 3 },
  reach: { lower: 1, central: 2, upper: 2 },
  persistence: { lower: 2, central: 3, upper: 4 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 6);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 6);
console.log('Wetland-peat-fire current-reference checks passed.');
