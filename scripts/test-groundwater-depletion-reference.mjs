import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/groundwater-depletion-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'aquifer_trends_reproduced_with_coverage_boundary');
assert.equal(snapshot.currentWindow.start, 2000);
assert.equal(snapshot.currentWindow.end, 2022);
assert.equal(snapshot.endpoints.studyBoundary.monitoringWells, 169_717);
assert.equal(snapshot.endpoints.studyBoundary.aquiferSystems, 1_693);
assert.equal(snapshot.endpoints.studyBoundary.studyCountryShareOfGlobalGroundwaterWithdrawalsPercentApproximate, 75);
assert.equal(snapshot.endpoints.aquiferCondition.aquiferSystemsDeeperThanPointOneMPerYear, 617);
assert.equal(snapshot.endpoints.aquiferCondition.shareDeeperThanPointOneMPerYearPercent, 36);
assert.equal(snapshot.endpoints.aquiferCondition.aquiferSystemsDeeperThanPointFiveMPerYear, 210);
assert.equal(snapshot.endpoints.aquiferCondition.shareDeeperThanPointFiveMPerYearPercent, 12);
assert.equal(snapshot.endpoints.aquiferCondition.roundedSupplementaryTableCounts.deeperThanPointOneMPerYear, 608);
assert.equal(snapshot.endpoints.aquiferCondition.roundedSupplementaryTableCounts.deeperThanPointFiveMPerYear, 209);
assert.equal(snapshot.endpoints.longTermDirection.aquiferSystemsCompared, 542);
assert.equal(snapshot.endpoints.longTermDirection.categories.reduce((sum, row) => sum + row.aquiferSystems, 0), 542);
assert.equal(snapshot.endpoints.compatibleCurrentHarmedPersonCount, null);
assert.equal(snapshot.endpoints.compatibleCurrentEcosystemConditionLossPercent, null);
assert(snapshot.tulipUse.prohibited.some(rule => /75%.*withdrawals.*75%.*ecosystems/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.1');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Groundwater-depletion reference passed: aquifer trends reproduce without converting withdrawal coverage, wells or aquifers into human or ecosystem harm.');
