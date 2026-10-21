import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/river-flow-regime-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_river_flow_regime_shift_2026_09_24_v1');
assert.equal(snapshot.nodeId, 'river_flow_regime_shift');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.sources.unWater.snapshotSha256, 'e78c5f6961ab985d3583f0edc657566640df7124ed3eb18f0107b17086777d84');
assert.equal(snapshot.sources.observedRegimes.pdfSha256, '8b35ef3d650db15a7f4381160a82ddb2d32ff8515ea8e3648833fdeeb8d94272');
assert.equal(snapshot.sources.biodiversityConversion.pdfSha256, '500e5ebf0c9b500ea35b6b00575fef33e3270990fabc654bd7c1e173d1dc361d');
assert.equal(snapshot.sources.riverImpactSynthesis.files.structural.sha256, '80a41464973bf5721b2b333a3243a4255231f6894b7329f0b14f6054a0d33678');
assert.equal(snapshot.sources.riverImpactSynthesis.files.functional.sha256, 'cba6173f87c15773ab65fdfac063ed106e992bf62ecae3055b411924109e1134');
assert.equal(snapshot.evidence.currentGlobalFlowInventory.assessedBasins, 12_572);
assert.equal(snapshot.evidence.currentGlobalFlowInventory.significantlyDecreasedFlowBasins, 402);
assert.equal(snapshot.evidence.currentGlobalFlowInventory.significantlyDecreasedFlowBasinSharePercent, 3.1976);
assert.equal(snapshot.evidence.currentGlobalFlowInventory.peopleLivingInThoseBasinsMillion, 107.5);
assert.equal(snapshot.evidence.observedRegimeClasses.gauges, 3_293);
assert.equal(snapshot.evidence.observedRegimeClasses.catchmentsAssignedDirectionalClass, 2_986);
assert.equal(snapshot.evidence.biodiversityConversion.basins, 3_906);
assert.equal(snapshot.evidence.eventAndTrendSynthesis.structuralRows, 198);
assert.equal(snapshot.evidence.eventAndTrendSynthesis.functionalRows, 134);
assert.equal(snapshot.evidence.boundaries.compatibleCurrentHumanConsequence, null);
assert.deepEqual(snapshot.ratingDecision.candidate.axes.ecosystem, {
  severity: { lower: 0, central: 1, upper: 2 },
  reach: { lower: 1, central: 2, upper: 3 },
  persistence: { lower: 0, central: 1, upper: 3 },
});
assert.deepEqual(snapshot.ratingDecision.candidate.revised, { value: 4, grade: 'B', lower: 1.8, upper: 7, confidence: 'C' });
assert.equal(snapshot.ratingDecision.excludedUses.length, 6);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 5);

console.log('River-flow regime reference passed.');
