import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/fishery-protein-dependence-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_global_dietary_dependence_and_supply_context_ingested');
assert.equal(snapshot.source.fetchedReport.sha256, 'ef343073e620cf0fe872cf6732e57fb5d4b83faaba0d15a7d23d1824637e708d');
assert.equal(snapshot.endpoints.dietaryDependence.peopleReceivingAtLeastOneFifthAnimalProteinFromAquaticFoods, 3_100_000_000);
assert.equal(snapshot.endpoints.dietaryDependence.minimumAnimalProteinSharePercent, 20);
assert.equal(snapshot.endpoints.livelihoodsContext.supportedLivelihoods, 600_000_000);
assert.equal(snapshot.endpoints.currentSupplyContext.aquaticAnimalProductionMillionTonnes, 195);
assert.equal(snapshot.endpoints.currentSupplyContext.shareOfAquaticAnimalProductionForHumanConsumptionPercent, 89);
assert(snapshot.tulipUse.prohibited.some(rule => /3\.1 billion people as harmed/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /600 million.*livelihoods lost/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'B 3.3');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'human only');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: snapshot.source,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Fishery-protein-dependence reference passed: global dietary reliance is pinned without converting nutritional benefit, production or livelihoods supported into current harm.');
