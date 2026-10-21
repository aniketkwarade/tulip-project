import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/urban-heat-island-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'direct_global_human_endpoint_ingested_with_dual_effect_and_reproducibility_boundaries');
assert.equal(snapshot.source.files.archive.md5, '1ff0d4eefa47b4a3996fc3e027a17cba');
assert.equal(snapshot.source.files.table.sha256, 'e537eee00f12003075e1d5f8c0c1936c7c978a5f1d69b65e56ba37af2c2833c5');
assert.equal(snapshot.endpoint.studyBoundary.selectedCities, 3_280);
assert.equal(snapshot.endpoint.studyBoundary.validOpenTableMortalityRows, 3_276);
assert.equal(snapshot.endpoint.studyBoundary.incompleteOpenTableMortalityRows, 4);
assert.equal(snapshot.endpoint.openTableSummary.minimumMortalityPercentile.mean, 77.983315018);
assert.equal(snapshot.endpoint.openTableSummary.uhiHeatMortalityChangePercent.mean, 11.818175296);
assert.equal(snapshot.endpoint.openTableSummary.uhiColdMortalityChangePercent.mean, -54.747524688);
assert.equal(snapshot.endpoint.openTableSummary.uhiAnnualNetMortalityChangePercent.mean, -42.929349391);
assert.equal(snapshot.endpoint.openTableSummary.citiesWithHigherHeatMortality, 2_911);
assert.equal(snapshot.endpoint.openTableSummary.citiesWithAdverseAnnualNetMortality, 680);
assert.equal(snapshot.endpoint.openTableSummary.citiesWithProtectiveAnnualNetMortality, 2_596);
assert.equal(snapshot.endpoint.publishedArticleSummary.meanHeatRelatedMortalityIncreasePercent, 11.7);
assert.equal(snapshot.endpoint.publishedArticleSummary.meanColdRelatedMortalityReductionPercent, 51.5);
assert.equal(snapshot.endpoint.outlook.sourceScenario, 'SSP2-4.5');
assert.equal(snapshot.endpoint.outlook.sourceYear, 2050);
assert(snapshot.tulipUse.prohibited.some(rule => /3,280 cities.*count of people harmed/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /ecosystem-condition loss/i.test(rule)));
assert.match(snapshot.endpoint.reproducibilityBoundary.aggregationDifference, /remain separate/i);

const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: snapshot.source,
  endpoint: snapshot.endpoint,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Urban-heat-island reference passed: direct mortality, city coverage, dual hot/cold effects and reproducibility limits remain separate.');
