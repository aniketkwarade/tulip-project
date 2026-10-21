import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/bridge-scour-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_us_inventory_and_historical_terminal_cases_ingested');
assert.equal(snapshot.sources.inventory.fetchedSnapshot.sha256, '167eafa976fb37c76edf29d4654e12b3961217e5dc96167aef15294c7d97c142');
assert.equal(snapshot.endpoints.currentEngineeringState.assessedHighwayBridges, 624_193);
assert.equal(snapshot.endpoints.currentEngineeringState.scourCriticalBridges, 19_775);
assert.equal(snapshot.endpoints.currentEngineeringState.scourCriticalSharePercent, 3.168091);
assert.equal(snapshot.endpoints.currentExposureContext.dailyVehicleCrossingsOnOpenScourCriticalBridges, 76_075_755);
assert.deepEqual(snapshot.endpoints.historicalTerminalCases.map(item => item.fatalities), [10, 8]);
assert(snapshot.tulipUse.prohibited.some(rule => /daily vehicle crossings.*unique people/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /1987 and 1989 fatalities.*current annual harm/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'B 3.3');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'human only');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Bridge-scour reference passed: current engineering vulnerability is pinned without converting traffic, bridge counts or historical fatal cases into current harmed-person reach.');
