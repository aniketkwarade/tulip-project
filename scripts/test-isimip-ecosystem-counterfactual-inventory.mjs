import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/isimip-ecosystem-counterfactual-inventory.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_isimip_ecosystem_counterfactual_inventory_2026_09_24_v1');
assert.equal(payload.status, 'paired_biodiversity_counterfactual_outputs_not_published');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.counts.terrestrialBiodiversityDatasets, 24);
assert.equal(payload.counts.terrestrialBiodiversityObservedClimateDatasets, 24);
assert.equal(payload.counts.terrestrialBiodiversityCounterfactualClimateDatasets, 0);
assert.equal(payload.counts.terrestrialBiodiversityImpactModels, 3);
assert.equal(payload.counts.terrestrialBiodiversityVariables, 4);
assert.equal(payload.counts.terrestrialBiodiversitySocialForcingCases, 2);
assert.equal(payload.counts.biomesObservedClimateDatasets, 1001);
assert.equal(payload.counts.biomesCounterfactualClimateDatasets, 1001);
assert.equal(payload.counts.sourceSpecificEcosystemEndpoints, 0);
assert.deepEqual(payload.dimensions.impactModels, ['sdm-gam', 'sdm-glm', 'sdm-randomforest']);
assert.deepEqual(payload.dimensions.variables, ['amphibianpbuffer', 'birdpbuffer', 'mammalpbuffer', 'reptilepbuffer']);
assert.deepEqual(payload.dimensions.socialForcingCases, ['histsoc', 'nat']);
assert.deepEqual(payload.dimensions.climateScenarios, ['obsclim']);
assert.deepEqual(payload.dimensions.regions, ['global']);
assert.deepEqual(payload.dimensions.timeSteps, ['30year-mean']);
assert.deepEqual(payload.dimensions.versions, ['20260825']);
assert.equal(payload.datasets.length, 24);
assert(payload.datasets.every(dataset => dataset.public === true && dataset.restricted === false));
assert(payload.datasets.every(dataset => dataset.rights === 'CC0 1.0'));
assert(payload.datasets.every(dataset => dataset.files.length === 1));
assert(payload.datasets.every(dataset => dataset.files[0].checksumType === 'sha512'));
assert(payload.datasets.every(dataset => dataset.files[0].checksum.length === 128));
assert(payload.datasets.every(dataset => dataset.specifiers.climate_scenario === 'obsclim'));
assert(payload.datasets.every(dataset => dataset.resources.some(resource => resource.doi === '10.48364/ISIMIP.390777')));
assert.match(payload.evidenceDecision.reason, /no published counterclim partners/i);
assert.match(payload.evidenceDecision.biomesBoundary, /cannot be copied/i);
assert.equal(payload.digest.length, 64);

console.log('ISIMIP ecosystem inventory passed: 24 factual biodiversity datasets are pinned, zero paired biodiversity counterfactuals are public, and the 1,001 paired biome runs stay outside source-specific TULIP scores.');
