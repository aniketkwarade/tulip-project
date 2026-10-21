import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/migration-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_disaster_displacement_flow_and_stock_ingested');
assert.equal(snapshot.sources.primaryReport.fetchedReport.sha256, '91ce651436a1ac6f6cb2c2f396bac44b96d79eca4404bea9bf18ecacd5575f65');
assert.equal(snapshot.sources.countrySeriesSnapshot.fetchedSnapshot.sha256, '0ded4e3479ecddadd674b376efa5ee583fa2ee891c83ee0037ed9ad0451da0d5');
assert.equal(snapshot.endpoints.currentDisasterMovementFlow.newOrRepeatedInternalDisplacementMovements, 29_900_000);
assert.equal(snapshot.endpoints.currentDisasterMovementFlow.weatherRelatedMovements, 27_200_000);
assert.equal(snapshot.endpoints.currentDisasterMovementFlow.geophysicalMovements, 2_500_000);
assert.equal(snapshot.endpoints.currentDisasterMovementFlow.preEmptiveEvacuationsReported, 2_400_000);
assert.equal(snapshot.endpoints.currentDisasterDisplacementStock.peopleLivingInInternalDisplacementDueToDisasters, 13_600_000);
assert.equal(snapshot.endpoints.annualDisasterMovementSeries.values.length, 10);
assert.deepEqual(snapshot.endpoints.countrySeriesQualityControl.excludedTrailingAllZeroYears.map(row => row.year), [2025, 2024]);
assert(snapshot.tulipUse.prohibited.some(rule => /do not add the 29\.9-million.*13\.6-million/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /do not describe movement counts as unique people/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /do not treat all disaster displacement as climate-attributed/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 6.3');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'human only');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Migration reference passed: movement flow, unique-person stock, climate attribution, conflict displacement and protective evacuation remain separate.');
