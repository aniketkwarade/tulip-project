import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/shell-calcification-current-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_shell_calcification_current_reference_2026_09_24_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.deepEqual(snapshot.appliesToNodeIds, ['shell_calcification_failures']);
assert.equal(snapshot.evidence.biologicalHabitatThresholds.globalCoastalBivalves.year2020Percent, 18.6);
assert.equal(snapshot.evidence.biologicalHabitatThresholds.globalCoastalBivalves.expansionPercentagePoints, 12.2);
assert.equal(snapshot.evidence.biologicalHabitatThresholds.polarPteropodsMildDissolution.year2020Percent, 79.5);
assert.equal(snapshot.evidence.biologicalHabitatThresholds.polarPteropodsSevereDissolution.year2020Percent, 15.5);
assert.equal(snapshot.evidence.biologicalHabitatThresholds.californiaCurrentPteropodsMildDissolution.year2020Percent, 42);
assert.equal(snapshot.evidence.biologicalHabitatThresholds.californiaCurrentPteropodsSevereDissolution.year2020Percent, 4);
assert.equal(snapshot.evidence.currentPacificIndustryConsequences.respondentsReportingNegativeEffectsPercent, 54);
assert.equal(snapshot.evidence.historicalHatcheryCalibration.affectedProductionSeasons, 2);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 7, grade: 'D', lower: 5.1, upper: 8.9, confidence: 'C' },
  revised: { value: 5.9, grade: 'C', lower: 3.6, upper: 7.8, confidence: 'C' },
});
assert.deepEqual(snapshot.ratingDecision.axes.human, {
  severity: { lower: 1, central: 2, upper: 2 },
  reach: { lower: 0, central: 1, upper: 2 },
  persistence: { lower: 1, central: 2, upper: 3 },
});
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 1, central: 2, upper: 3 },
  reach: { lower: 2, central: 3, upper: 4 },
  persistence: { lower: 2, central: 3, upper: 4 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 7);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 5);

console.log('Shell-calcification current-reference checks passed.');
