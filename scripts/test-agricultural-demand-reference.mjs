import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/agricultural-demand-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'direct_global_land_use_biodiversity_endpoint_ingested');
assert.equal(snapshot.sources.biodiversity.fetchedArticle.sha256, 'edfdb7ca1eacaea87ef985408b0415573af6f234412c6f24f353a9aeed52cd65');
assert.equal(snapshot.sources.biodiversity.fetchedSourceData.sha256, 'fe9cc5ed2da40c3609ec592d4bbe4c0479e26854b6b18d2cdc0f017ed06bf413');
assert.equal(snapshot.sources.land.fetchedDocument.sha256, '7e09d78c02e0e027e2e509d5fee0b7aad020042321cc340a0e0caa5ce8180ab9');
assert.equal(snapshot.endpoints.biodiversity.netExactFractionFromSourceWorkbook, 0.013896174054540059);
assert.equal(snapshot.endpoints.biodiversity.netRoundedPercentReportedInArticle, 1.4);
assert.equal(snapshot.endpoints.biodiversity.agricultureShareOfGlobalLandUseChangeImpactPercentLowerBound, 90);
assert.equal(snapshot.endpoints.landContext.agriculturalLand2023MillionHa, 4799);
assert.equal(snapshot.endpoints.landContext.agriculturalLandChangeMillionHa, -75);
assert.equal(snapshot.endpoints.landContext.croplandChangeMillionHa, 78);
assert(snapshot.tulipUse.prohibited.some(rule => /model coverage.*not the percentage/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /not itself an adverse human outcome/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.5');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'ecosystem only');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Agricultural-demand reference passed: direct biodiversity and land-use evidence is pinned without turning model coverage, land footprint or downstream human nodes into extra harm.');
