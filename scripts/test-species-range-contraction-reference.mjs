import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/species-range-contraction-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.currentWindow.end, 2017);
assert.equal(snapshot.sources.globalMammals.file.sha256, '453920b6a38ff0f3fb1b6b024e278fffcb0403f145febed713c1254fd6f51de0');
assert.equal(snapshot.sources.localExtinctions.file.sha256, '36e6428ae3b256b7a6517b20762cd1c9b6805582c487a6cf2958626ed1c65ae7');
assert.equal(snapshot.sources.greatBritain.file.sha256, 'd4475f575158723323fc850bebc32ea6d8d46682444ed099b59923932a1cbca9');
assert.equal(snapshot.endpoints.globalMammalRangeChange.species, 204);
assert.deepEqual(snapshot.endpoints.globalMammalRangeChange.largeDecreaseOver50Percent, { species: 40, samplePercent: 20 });
assert.deepEqual(snapshot.endpoints.globalMammalRangeChange.moderateDecrease5To49Percent, { species: 65, samplePercent: 32 });
assert.equal(snapshot.endpoints.multiTaxonWarmEdgeLoss.species, 976);
assert.equal(snapshot.endpoints.multiTaxonWarmEdgeLoss.localExtinction, 460);
assert.equal(snapshot.endpoints.multiTaxonWarmEdgeLoss.localExtinctionPercent, 47.1);
assert.equal(snapshot.endpoints.greatBritainHeterogeneity.species, 1_192);
assert.equal(snapshot.endpoints.greatBritainHeterogeneity.environmentalChangeAssociatedWithLowerPersistencePercent, 12);
assert.equal(snapshot.endpoints.compatibleGlobalAffectedEcosystemAreaPercent, null);
assert.equal(snapshot.endpoints.compatibleRecoveryTimeDistribution, null);
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.domains, ['ecosystem']);
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.5');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert.match(snapshot.tulipUse.prohibited.join(' '), /sampled species/i);
assert.match(snapshot.tulipUse.prohibited.join(' '), /range shifts as contractions/i);

console.log('Species range contraction reference passed: range loss, sampled-species share, ecosystem extent and recovery remain separate.');
