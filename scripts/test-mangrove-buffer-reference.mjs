import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/mangrove-buffer-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.nodeId, 'mangrove_buffer_loss');
assert.equal(snapshot.sources.length, 4);
assert.equal(snapshot.extentReference.currentWindow.start, 2016);
assert.equal(snapshot.extentReference.currentWindow.end, 2025);
assert.equal(snapshot.extentReference.currentWindow.grossLossPctOfBaseline, 6.183745);

const byId = new Map(snapshot.sources.map(source => [source.id, source]));
assert.equal(byId.get('xu_global_mangrove_coastal_protection_index_2024').facts.globalMeanMcpiChangePct, -25.01);
assert.equal(byId.get('menendez_global_mangrove_flood_protection_2020').facts.fullLossAdditionalPeopleFloodedPerYear, 15000000);
assert.equal(byId.get('menendez_global_mangrove_flood_protection_2020').facts.fullLossCounterfactual, true);
assert.equal(byId.get('su_mangrove_restoration_outcomes_meta_analysis_2021').facts.reportedUpperRecoveryContextYears, 40);
assert.equal(byId.get('chen_coastal_wetland_carbon_nitrogen_recovery_2025').facts.plantBiomassRecoveryYears, 20);
assert.equal(byId.get('chen_coastal_wetland_carbon_nitrogen_recovery_2025').facts.soilCarbonNitrogenRecoveryYears, 40);

assert.deepEqual(snapshot.tulipUse.axisRecommendation.central.human, { severity: 2, reach: 2, persistence: 2 });
assert.deepEqual(snapshot.tulipUse.axisRecommendation.central.ecosystem, { severity: 2, reach: 2, persistence: 3 });
assert.deepEqual(snapshot.tulipUse.scoreDisposition, {
  lower: 4.8,
  central: 5.9,
  upper: 8.1,
  centralGrade: 'C',
  rangeGrades: ['C', 'D'],
  confidence: 'C',
  rationale: snapshot.tulipUse.scoreDisposition.rationale,
});
assert.match(snapshot.tulipUse.excluded.join(' '), /15 million protected people as current harmed-person reach/i);
assert.match(snapshot.tulipUse.excluded.join(' '), /25\.01% global mean MCPI decline as both ecosystem severity and reach/i);
assert.match(snapshot.evidenceSynthesis.compatibilityBoundary, /different questions/i);
assert.equal(snapshot.snapshotDigest.length, 64);

console.log('Mangrove buffer reference passed: direct extent, protection-function, human-service and recovery evidence remain in separate TULIP axes with a C–D candidate range.');
