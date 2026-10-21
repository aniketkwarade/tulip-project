import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/anaerobic-manure-lagoon-current-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.version, 'tulip_anaerobic_manure_lagoon_current_reference_2026_09_25_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.deepEqual(snapshot.appliesToNodeIds, ['anaerobic_manure_lagoon_operation']);
assert.equal(Object.keys(snapshot.sources).length, 4);
assert.equal(snapshot.evidence.directSurfaceWaterCase.observedDischargeDays, 3);
assert.equal(snapshot.evidence.directSurfaceWaterCase.annualWastewaterPreventedBySettlementGallons, 4_500_000);
assert.equal(snapshot.evidence.directSurfaceWaterCase.annualPollutantReductionPounds, 137_000);
assert.deepEqual(snapshot.evidence.longTermGroundwaterCase.initialGroundwaterContaminants, ['ammonium', 'nitrate']);
assert.equal(snapshot.evidence.longTermGroundwaterCase.continuedSurfaceWaterEutrophicationRiskAfterYears, 10);
assert.equal(snapshot.evidence.currentMappingBoundary.detectionAccuracyPercentAbove, 98);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 5.1, grade: 'C', lower: 2.9, upper: 7.4, confidence: 'C', domains: ['human', 'ecosystem'] },
  revised: { value: 4, grade: 'B', lower: 2.1, upper: 6.3, confidence: 'C', domains: ['human', 'ecosystem'] },
});
assert.deepEqual(snapshot.ratingDecision.axes.human, {
  severity: { lower: 0, central: 1, upper: 2 },
  reach: { lower: 0, central: 1, upper: 2 },
  persistence: { lower: 0, central: 1, upper: 2 },
});
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 1, central: 1, upper: 2 },
  reach: { lower: 0, central: 1, upper: 2 },
  persistence: { lower: 2, central: 3, upper: 4 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 6);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 6);
console.log('Anaerobic-manure-lagoon current-reference checks passed.');
