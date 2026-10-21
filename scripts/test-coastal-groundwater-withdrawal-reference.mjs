import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/coastal-groundwater-withdrawal-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'source_specific_current_condition_ingested');
assert.equal(snapshot.currentWindow.end, 2018);
assert.equal(snapshot.endpoints.hydrologicCondition.f35ChlorideMgPerL.start, 16);
assert.equal(snapshot.endpoints.hydrologicCondition.f35ChlorideMgPerL.end, 1154);
assert.equal(snapshot.endpoints.hydrologicCondition.oysterLab4ChlorideThrough2018MgPerLMaximum, 40);
assert.equal(snapshot.endpoints.humanServiceContext.compatibleHarmedPersonCount, null);
assert.equal(snapshot.endpoints.ecosystemCondition.compatibleCurrentEndpoint, null);
assert(snapshot.tulipUse.prohibited.some(rule => /five aquifers.*five people/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 4.8');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.uncertainty, 'A 2.5 to D 7.0');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: snapshot.source,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Coastal-groundwater reference passed: measured aquifer condition is retained without converting five aquifers into five people or modeled scenarios into current harm.');
