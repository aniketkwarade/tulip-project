import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/tundra-methane-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'gross_flux_and_attribution_boundary_ingested_endpoint_model_pending');
assert.equal(snapshot.sources.inverseModel.dataset.sha256, 'ce0dced353c95c39425403e5a6caddcee7040f16f54783f2f951c7985393f5af');
assert.equal(snapshot.sources.inverseModel.dataset.license, 'cc-by-4.0');
assert.equal(snapshot.endpoints.arcticBorealFlux.observationPeriod.start, 2010);
assert.equal(snapshot.endpoints.arcticBorealFlux.observationPeriod.end, 2021);
assert.equal(snapshot.endpoints.arcticBorealFlux.monthlyRecords, 144);
assert.equal(snapshot.endpoints.arcticBorealFlux.annualSeries.total_post.annual.length, 12);
assert.equal(snapshot.endpoints.arcticBorealFlux.annualSeries.total_post.meanTgCH4PerYear, 45.384995);
assert.equal(snapshot.endpoints.arcticBorealFlux.annualSeries.wetland_post.meanTgCH4PerYear, 21.489571);
assert.equal(snapshot.endpoints.arcticBorealFlux.articleTrend.statisticallySignificant, false);
assert.deepEqual(snapshot.endpoints.permafrostThawAttribution.thawAlteredLandCoverFluxTgCH4PerYearRange, [20, 30]);
assert.deepEqual(snapshot.endpoints.permafrostThawAttribution.directCurrentThawEmissionTgCH4PerYearRange, [0, 1]);
assert.equal(snapshot.endpoints.borealArcticWetlandsAndLakes.outlook.scenario, 'SSP2-4.5');
assert.equal(snapshot.endpoints.borealArcticWetlandsAndLakes.outlook.estimatedChangePercent, 31);
assert(snapshot.tulipUse.prohibited.some(rule => /45\.4 Tg CH4.*present-day tundra thaw/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /aggregate Methane TULIP score/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'D 6.6 retained provisionally');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.confidence, 'D');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Tundra-methane reference passed: gross flux, thaw attribution, source overlap, outlook and terminal-harm gaps remain separate.');
