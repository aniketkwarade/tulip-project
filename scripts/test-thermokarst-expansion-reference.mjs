import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/thermokarst-expansion-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_thermokarst_expansion_reference_2026_09_24_v1');
assert.equal(payload.status, 'direct_human_and_ecosystem_consequences_pinned_global_reach_denominators_missing');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'thermokarst_expansion');
assert.equal(Object.keys(payload.sources).length, 4);

assert.equal(payload.sources.circumpolarExpansion.files.length, 5);
assert.equal(payload.sources.circumpolarExpansion.files.find(file => file.fileName === 'workspace.zip').checksum, '98cc23935838273f06cf246cf3f0f844');
assert.equal(payload.sources.circumpolarExpansion.files.find(file => file.fileName === 'final_products.zip').size, 7_142_285_512);
assert.equal(payload.sources.pointLayInfrastructure.openAccessPdf.sha256, '565ee7a063a103517a916dbb7ff80e0d8919f45c0fe8b00736d0646ee157d912');
assert.match(payload.sources.pointLayInfrastructure.openAccessPdf.verification, /bot_protection/i);

assert.equal(payload.evidence.circumpolarPhysicalInventory.surveyAreas, 27);
assert.equal(payload.evidence.circumpolarPhysicalInventory.totalMappedAreaSquareKm, 400);
assert.equal(payload.evidence.circumpolarPhysicalInventory.rapidExpansionSurveyAreaPercent, 44);
assert.equal(payload.evidence.circumpolarPhysicalInventory.reportedUncertaintyPercentagePoints, 15);
assert.match(payload.evidence.circumpolarPhysicalInventory.boundary, /not a probability sample/i);

assert.equal(payload.evidence.directHumanConsequence.approximateBoreholes, 60);
assert.equal(payload.evidence.directHumanConsequence.interviews, 8);
assert.equal(payload.evidence.directHumanConsequence.thermokarstShare.developedVillageBlocks2019PercentLowerBound, 60);
assert.match(payload.evidence.directHumanConsequence.attribution, /interacting drivers/i);
assert.match(payload.evidence.directHumanConsequence.boundary, /not a circumpolar harmed-person total/i);

assert.equal(payload.evidence.ecosystemTransformation.advancedOpenWaterSharePercent, 0.7);
assert.equal(payload.evidence.ecosystemTransformation.oldestTerrainAdvancedOpenWaterSharePercent, 1.6);
assert.equal(payload.evidence.ecosystemTransformation.hotspotAllDegradationStagesPercent[1950], 2);
assert.equal(payload.evidence.ecosystemTransformation.hotspotAllDegradationStagesPercent[2018], 19);
assert.match(payload.evidence.ecosystemTransformation.communityChange, /shifted completely/i);
assert.match(payload.evidence.ecosystemTransformation.recoveryFinding, /unlikely/i);
assert.match(payload.evidence.recoveryContrast.finding, /within two years/i);

const { candidate } = payload.ratingDecision;
assert.equal(payload.ratingDecision.change, 'revised');
assert.deepEqual(candidate.previous, { value: 7, grade: 'D', lower: 4.8, upper: 9.3, confidence: 'C' });
assert.deepEqual(candidate.revised, { value: 6.3, grade: 'C', lower: 4, upper: 8.1, confidence: 'C' });
assert.deepEqual(candidate.axes.human.reach, { lower: 0, central: 1, upper: 2 });
assert.deepEqual(candidate.axes.ecosystem.reach, { lower: 1, central: 1, upper: 2 });
assert(payload.ratingDecision.excludedUses.some(item => /44% of selected survey areas/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /circumpolar count/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Thermokarst expansion reference passed: direct severe consequences replace authored global reach, with heterogeneous recovery and missing circumpolar denominators preserved in the bounds.');
