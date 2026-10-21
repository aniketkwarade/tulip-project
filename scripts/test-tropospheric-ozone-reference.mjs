import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/tropospheric-ozone-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_global_human_endpoint_ingested');
assert.equal(snapshot.nodeId, 'tropospheric_ozone');
assert.equal(snapshot.source.fetchedReport.bytes, 5_587_043);
assert.equal(snapshot.source.fetchedReport.sha256, 'cb8bfaefcf9b705c56974119703f14c0c68a92a5e0f5e5aab4480dd3d67acd77');
assert.equal(snapshot.endpoints.humanBurden2021.deaths.central, 490_000);
assert.equal(snapshot.endpoints.humanBurden2021.deaths.lower95Ui, 107_200);
assert.equal(snapshot.endpoints.humanBurden2021.deaths.upper95Ui, 837_000);
assert.equal(snapshot.endpoints.humanBurden2021.shareOfGlobalCopdDeathsPercent.central, 13);
assert.equal(snapshot.endpoints.humanBurden2021.disabilityAdjustedLifeYears, 8_700_000);
assert.deepEqual(snapshot.tulipMapping.applicableDomains, ['human']);
assert.equal(snapshot.tulipMapping.confidence, 'B');
for (const estimate of ['lower', 'central', 'upper']) {
  assert.equal(snapshot.tulipMapping.humanAxes.severity[estimate], 4);
  assert.equal(snapshot.tulipMapping.humanAxes.reach[estimate], 2);
  assert.equal(snapshot.tulipMapping.humanAxes.persistence[estimate], 4);
}
assert.equal(snapshot.tulipMapping.currentCatalogueRecommendation.rating, 'E 8.5');
assert.match(snapshot.limitations.join(' '), /not an independent replication/i);
assert.match(snapshot.admissionDecision.prohibitedUse, /do not count the uncertainty bounds as additional deaths/i);

const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: snapshot.source,
  endpoints: snapshot.endpoints,
  tulipMapping: snapshot.tulipMapping,
  limitations: snapshot.limitations,
  admissionDecision: snapshot.admissionDecision,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Tropospheric-ozone reference passed: the 2021 GBD endpoint strengthens confidence while all uncertainty bounds remain E 8.5.');
