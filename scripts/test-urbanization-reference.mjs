import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/urbanization-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'population_and_built_land_separated_from_harm');
assert.equal(snapshot.currentWindow.end, 2025);
assert.equal(snapshot.endpoints.settlementPopulationContext.worldPopulation2025Approximate, 8_200_000_000);
assert.equal(snapshot.endpoints.settlementPopulationContext.cityPopulationSharePercent, 45);
assert.equal(snapshot.endpoints.settlementPopulationContext.townPopulationSharePercent, 36);
assert.equal(snapshot.endpoints.settlementPopulationContext.cityAndTownPopulationSharePercent, 81);
assert.equal(snapshot.endpoints.builtLandState.worldBuiltUpAreaKm2['2000'], 315_657.0);
assert.equal(snapshot.endpoints.builtLandState.worldBuiltUpAreaKm2['2025'], 515_803.5);
assert(Math.abs(snapshot.endpoints.builtLandState.increase2000To2025Km2 - 200_146.5) < 1e-9);
assert(Math.abs(snapshot.endpoints.builtLandState.increase2000To2025Percent - 63.406323952898234) < 1e-12);
assert.equal(snapshot.endpoints.compatibleCurrentHarmedPersonCount, null);
assert.equal(snapshot.endpoints.compatibleCurrentEcosystemConditionLossPercent, null);
assert.equal(snapshot.endpoints.compatibleCurrentEcosystemDistributionAffectedPercent, null);
assert(snapshot.tulipUse.prohibited.some(rule => /living in cities or towns.*harmed/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.1');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'human and ecosystem');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Urbanization reference passed: settlement population and built surface are pinned without converting residents into people harmed or land area into ecosystem collapse.');
