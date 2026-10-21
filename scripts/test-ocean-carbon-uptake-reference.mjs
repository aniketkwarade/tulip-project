import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/ocean-carbon-uptake-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'counterfactual_ocean_sink_weakening_ingested');
assert.equal(snapshot.sources.gcb.sourceSnapshot.sha256, '5d988c24c6f8eaf9e557cbb6fe13e6e440d72b890b858d7bccfb979b815c542e');
assert.equal(snapshot.sources.gcb.observedSinkClaim.sha256, 'ce0756db25c85c3e5e0fa1300d42f180de1173058eb422ca2381aa7352280f60');
assert.equal(snapshot.sources.gcb.climateCounterfactualClaim.sha256, '86b287f7f2032444ef28fb76c17bc2ec730e21f769527beb14b0ef03986304da');
assert.equal(snapshot.sources.ipcc.observedSinkClaim.sha256, '9eaac0b3f9af95cec50901c9287603eba7142189f10f5478cc1a95735a2e5082');
assert.equal(snapshot.sources.ipcc.futureFeedbackClaim.sha256, 'aa90845d328fa8f361b5089794468ef48cf78bd788b547f32d3da58a782391b1');
assert.equal(snapshot.endpoints.observedTotalSink.latestYear, 2024);
assert.equal(snapshot.endpoints.observedTotalSink.latestOceanSinkGtCPerYear, 3.388947);
assert.equal(snapshot.endpoints.climateAttributableWeakening.relativeToCo2OnlyPercent, 7.1);
assert.deepEqual(snapshot.endpoints.climateAttributableWeakening.modelRangePercent, { lower: 4.2, upper: 10.7 });
assert.match(snapshot.endpoints.observedTotalSink.assessedFinding, /no sustained decrease/i);
assert.match(snapshot.endpoints.climateAttributableWeakening.measurementBoundary, /not a 7\.1% decline in the observed total sink/i);
assert(snapshot.tulipUse.prohibited.some(rule => /downstream warming/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.5');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.confidence, 'B');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Ocean-carbon-uptake reference passed: observed sink, climate counterfactual and downstream harms remain separate.');
