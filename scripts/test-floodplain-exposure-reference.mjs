import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/floodplain-exposure-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'global_exposure_and_vulnerability_boundary_ingested');
assert.equal(snapshot.currentWindow.end, 2020);
assert.equal(snapshot.endpoints.modeledExposure.populationExposedApproximate, 2_000_000_000);
assert.equal(snapshot.endpoints.modeledExposure.globalPopulationCoveragePercent, 98.6);
assert.equal(snapshot.endpoints.significantFloodRiskCrossCheck.populationExposed, 1_810_000_000);
assert.equal(snapshot.endpoints.significantFloodRiskCrossCheck.worldPopulationSharePercent, 23);
assert.equal(snapshot.endpoints.vulnerabilityAdjustment.populationInTopTwoExpectedExposureQuintiles, 1_230_000_000);
assert.equal(snapshot.endpoints.vulnerabilityAdjustment.populationInTopTwoVulnerabilityAdjustedQuintiles, 866_000_000);
assert.equal(snapshot.endpoints.compatibleCurrentHarmedPersonCount, null);
assert.equal(snapshot.endpoints.compatibleCurrentEcosystemEndpoint, null);
assert(snapshot.tulipUse.prohibited.some(rule => /two billion exposed people.*currently harmed/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'B 3.3');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'human only');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Floodplain-exposure reference passed: global exposure and vulnerability are pinned without converting them into observed current harm.');
