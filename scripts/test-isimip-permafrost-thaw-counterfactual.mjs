import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/permafrost-thaw-counterfactual-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_isimip_permafrost_thaw_counterfactual_2026_09_24_v1');
assert.equal(payload.status, 'physical_counterfactual_validated_not_terminal_harm');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'permafrost_thaw');
assert.equal(payload.source.model, 'LPJmL5-7-10-fire');
assert.equal(payload.source.climateForcing, '20CRv3-ERA5');
assert.equal(payload.method.currentNormal.start, 1991);
assert.equal(payload.method.currentNormal.end, 2020);
assert.match(payload.method.equation, /counterclim 1991–2020/);
assert.equal(payload.primaryResult.latitudeFloorDegreesNorth, 45);
assert.deepEqual(payload.primaryResult.comparisonPeriod, { start: 1991, end: 2020 });
assert.equal(payload.primaryResult.representedSoilBottomM, 13);
assert.equal(payload.primaryResult.representedGridCells, 21_806);
assert(payload.primaryResult.areaWeightedAdditionalThawDepthM.median > 0.10);
assert(payload.primaryResult.areaWeightedAdditionalThawDepthM.median < 0.11);
assert(payload.primaryResult.areaWeightedAdditionalThawDepthM.p05 >= 0);
assert(payload.primaryResult.areaWeightedAdditionalThawDepthM.p95 > 6);
assert(payload.primaryResult.areaWeightedShare.positive > 0.96);
assert(payload.primaryResult.areaWeightedShare.above010m > 0.51);
assert(payload.primaryResult.areaWeightedShare.above010m < 0.52);
assert.equal(payload.latitudeSensitivity.length, 2);
assert.deepEqual(payload.latitudeSensitivity.map(row => row.latitudeFloorDegreesNorth), [50, 60]);
assert(payload.latitudeSensitivity.every(row => row.areaWeightedAdditionalThawDepthM.median > 0));
assert.deepEqual(payload.modelSensitivity1981To2010.comparisonNormal, { start: 1981, end: 2010 });
assert.equal(payload.modelSensitivity1981To2010.models.length, 2);
const lpjml = payload.modelSensitivity1981To2010.models.find(row => row.model === 'LPJmL5-7-10-fire');
const classic = payload.modelSensitivity1981To2010.models.find(row => row.model === 'CLASSIC');
assert(lpjml.result.areaWeightedAdditionalThawDepthM.median > 0.07);
assert(lpjml.result.areaWeightedAdditionalThawDepthM.median < 0.09);
assert(classic.result.areaWeightedAdditionalThawDepthM.median > 0.23);
assert(classic.result.areaWeightedAdditionalThawDepthM.median < 0.24);
assert(lpjml.result.areaWeightedShare.positive > 0.95);
assert(classic.result.areaWeightedShare.positive > 0.88);
assert.match(payload.modelSensitivity1981To2010.interpretation, /magnitude is model dependent/i);
assert.equal(payload.ratingDecision.candidate.value, 5.9);
assert.equal(payload.ratingDecision.candidate.grade, 'C');
assert.equal(payload.ratingDecision.candidate.confidence, 'C');
assert.equal(payload.ratingDecision.change, 'none');
assert.match(payload.ratingDecision.reason, /six terminal human and ecosystem consequence axes/i);
assert(payload.limitations.some(item => /not thermokarst area/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('ISIMIP permafrost counterfactual passed: the 1991–2020 physical attribution is reproduced, latitude sensitivity is explicit, and no physical metric is promoted into a terminal-harm score.');
