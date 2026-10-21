import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/food-waste-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_global_food_waste_flow_and_environmental_context_ingested');
assert.equal(snapshot.sources.unep.fetchedOfficialFindingsPage.claimSha256, '0a3a63d9b93538150036b5a0328826040459b88b1cf29d3a72858e0727e39eaf');
assert.equal(snapshot.sources.fao.fetchedDocument.sha256, 'c104e2e61f3cf29fd8c34c6ca4e8642ffb8e45162f7a7c564a0068359fd90af8');
assert.equal(snapshot.endpoints.currentWasteFlow.globalFoodWasteMillionTonnes, 1_052);
assert.equal(snapshot.endpoints.currentWasteFlow.shareOfFoodAvailableToConsumersPercent, 19);
assert.equal(snapshot.endpoints.directHumanMaterialProxy.annualFoodValueLostUsdTrillionLowerBound, 1);
assert.deepEqual(snapshot.endpoints.environmentalPressureContext.foodLossAndWasteGlobalGhgSharePercentRange, [8, 10]);
assert(snapshot.tulipUse.prohibited.some(rule => /one billion meals.*people harmed/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /28% of agricultural land.*ecosystem distribution/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'B 3.6');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'human and ecosystem');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Food-waste reference passed: current waste mass and economic value are pinned while meals, resource shares and broader food-loss impacts remain outside terminal harm axes.');
