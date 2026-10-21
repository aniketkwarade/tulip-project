import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/coastal-groundwater-service-impact-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_coastal_groundwater_service_impact_2026_09_24_v1');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'coastal_groundwater_withdrawal');
assert(payload.sources.projectNarrative.pdfBytes > 500_000);
assert.equal(payload.sources.projectNarrative.pdfSha256.length, 64);
assert.equal(payload.sources.utilityPage.htmlSha256.length, 64);
assert.equal(payload.evidence.managedWaterService.permanentResidentsApproximate, 5_000);
assert.equal(payload.evidence.managedWaterService.summerPopulationApproximate, 50_000);
assert.equal(payload.evidence.managedWaterService.waterAccountsMoreThan, 4_300);
assert.equal(payload.evidence.managedWaterService.reverseOsmosisFacilityStartYear, 1998);
assert.deepEqual(payload.evidence.managedWaterService.reportedChlorideMgPerL, { well6: 490, well7: 380, well8: 750 });
assert.equal(payload.evidence.currentMaterialCommitment.admittedMinimumDirectSalinityTreatmentCostUsd, 12_600_000);
assert.equal(payload.evidence.historicalServiceLoss.supplyWellsClosedConservativeLowerBound, 120);

const { candidate } = payload.ratingDecision;
assert.deepEqual(candidate.previous, { value: 4.8, grade: 'C', lower: 2.5, upper: 7, confidence: 'C' });
assert.deepEqual(candidate.revised, { value: 6.3, grade: 'C', lower: 4.8, upper: 7.4, confidence: 'C' });
assert.deepEqual(candidate.axes.human.severity, { lower: 2, central: 2, upper: 2 });
assert.deepEqual(candidate.axes.human.reach, { lower: 1, central: 2, upper: 2 });
assert.deepEqual(candidate.axes.human.persistence, { lower: 4, central: 4, upper: 4 });
assert(payload.ratingDecision.excludedUses.some(item => /4,300 accounts/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /ecosystem-condition loss/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Coastal-groundwater service-impact reference passed: current treatment dependence and cost narrow human harm without extrapolating one local case globally.');
