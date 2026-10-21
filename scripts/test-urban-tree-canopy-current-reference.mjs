import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/urban-tree-canopy-current-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_urban_tree_canopy_current_reference_2026_09_24_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.deepEqual(snapshot.appliesToNodeIds, ['urban_tree_canopy_loss']);
assert.equal(snapshot.evidence.directGlobalCanopyChange.relativeNetChangePercent, -0.749);
assert.equal(snapshot.evidence.persistenceContext.lostCanopyConvertedToImperviousPercent, 32);
assert.equal(snapshot.evidence.currentLeafAreaDiagnostic.grid.annualFiles, 23);
assert.equal(snapshot.evidence.currentLeafAreaDiagnostic.grid.commonValidGridCells, 22_323);
assert.equal(snapshot.evidence.currentLeafAreaDiagnostic.fullRecord.weightedMeanChangePercent, 12.184);
assert.equal(snapshot.evidence.currentLeafAreaDiagnostic.since2017.weightedMeanChangePercent, -2.204);
assert.equal(snapshot.evidence.currentLeafAreaDiagnostic.since2017.areaWeightedCommonGridShareWithLowerEndStatePercent, 68.32);
assert.equal(snapshot.evidence.recentRegionalContrast.relativeChangePercent, -20.652);
assert.equal(snapshot.evidence.humanBenefitBoundary.functionalUrbanAreas, 8_919);
assert.equal(snapshot.evidence.humanBenefitBoundary.completeLossCounterfactualUrbanAirTemperatureIncreaseC.estimate, 0.151);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 5.5, grade: 'C', lower: 3.3, upper: 7.8, confidence: 'C' },
  revised: { value: 4.8, grade: 'C', lower: 2.5, upper: 7, confidence: 'C' },
});
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 0, central: 1, upper: 2 },
  reach: { lower: 0, central: 1, upper: 2 },
  persistence: { lower: 2, central: 3, upper: 4 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 6);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 5);

console.log('Urban-tree-canopy current-reference checks passed.');
