import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/europe-heat-oudsbergen-secondary-corroboration.json', import.meta.url), 'utf8'));
assert.equal(payload.version, 'tulip_europe_heat_oudsbergen_secondary_corroboration_2026_09_23_v1');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.sourceBoundary.publisherType, 'secondary statistical presentation');
assert.equal(payload.sourceBoundary.claimedUnderlyingSource, 'Statbel');
assert.equal(payload.sourceBoundary.claimedReferenceDate, '1 January of each year');
assert.match(payload.sourceBoundary.admissionRule, /cannot replace a directly ingested Statbel file/i);
assert.deepEqual(payload.observed2022, {
  opglabbeek: 10_444,
  oudsbergen: 23_611,
  meeuwenGruitrodeImpliedBySubtraction: 13_167,
});
assert.equal(payload.comparisonWithCurrentSensitivity.lauEditionOudsbergenPopulation, 23_641);
assert.equal(payload.comparisonWithCurrentSensitivity.totalDifference, -30);
assert.equal(payload.comparisonWithCurrentSensitivity.allocationDifference.opglabbeek, -50.386);
assert.equal(payload.comparisonWithCurrentSensitivity.allocationDifference.meeuwenGruitrode, 20.386);
assert.equal(payload.comparisonWithCurrentSensitivity.totalChange, -30);
assert.match(payload.interpretation.ratingEffect, /None/i);
assert.match(payload.interpretation.nextRequiredEvidence, /direct Statbel/i);
assert.equal(payload.sources.boundarySupplement.version, 'tulip_europe_heat_population_boundary_supplement_2026_09_23_v3');
assert.equal(payload.digest.length, 64);
console.log('Europe heat Oudsbergen secondary-corroboration checks passed.');
