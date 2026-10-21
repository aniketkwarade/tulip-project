import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/coastal-groundwater-current-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_regional_physical_condition_ingested_terminal_endpoints_still_missing');
assert.equal(snapshot.currentWindow.start, 2010);
assert.equal(snapshot.currentWindow.end, 2023);
assert.equal(snapshot.source.fetchedReport.bytes, 6_616_534);
assert.equal(snapshot.source.fetchedReport.sha256, '0283737b02eab5be37e602ba3283eb2443711b4f75693ca48186697d9d667ae4');
assert.equal(snapshot.endpoints.physicalCondition.virginiaEasternShore.confinedAquiferStorageLossShareOfWithdrawalsPercent, 'slightly under 7');
assert.equal(snapshot.endpoints.humanConsequence.compatibleCurrentEndpoint, null);
assert.equal(snapshot.endpoints.ecosystemCondition.compatibleCurrentEndpoint, null);
assert.match(snapshot.endpoints.attributionBoundary.salinity, /does not measure saltwater intrusion/i);
assert(snapshot.tulipUse.prohibited.some(rule => /7 percent.*ecosystem-condition loss.*people harmed/i.test(rule)));
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

console.log('Current coastal-groundwater reference passed: the 2023 storage evidence refreshes physical condition without converting modeled storage or salinity concern into terminal harm.');
