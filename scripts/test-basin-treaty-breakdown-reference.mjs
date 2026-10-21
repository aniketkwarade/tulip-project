import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/basin-treaty-breakdown-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_global_cooperation_coverage_context_ingested');
assert.equal(snapshot.sources.indicatorSnapshot.fetchedSnapshot.sha256, 'f8c64aea514c8cdcb9d5462d9f998df5f5a5777c98b3d89fae6ddd49a76d4ebb');
assert.equal(snapshot.endpoints.currentCooperationCoverage.countriesSharingTransboundaryWaters, 153);
assert.equal(snapshot.endpoints.currentCooperationCoverage.countriesReporting, 129);
assert.equal(snapshot.endpoints.currentCooperationCoverage.globalIndicatorAveragePercent, 59);
assert.equal(snapshot.endpoints.currentCooperationCoverage.globalOperationalCoverageGapPercent, 41);
assert.equal(snapshot.endpoints.currentCooperationCoverage.countriesWithAtLeast90PercentOperationalCoverage, 43);
assert.equal(snapshot.endpoints.currentCooperationCoverage.countriesWithFullOperationalCoverage, 26);
assert.equal(snapshot.endpoints.reportedProgress.baselineCountriesWithAtLeast90PercentCoverage, 23);
assert.equal(snapshot.endpoints.reportedProgress.currentCountriesWithAtLeast90PercentCoverage, 43);
assert.equal(snapshot.endpoints.climateReadinessContext.shareWithConcreteClimateStrategyPercent, 14);
assert.equal(snapshot.endpoints.climateReadinessContext.operationalRiverAndLakeArrangementsWithCoordinatedDroughtAlarmPercent, 30);
assert(snapshot.tulipUse.prohibited.some(rule => /41 percent coverage gap.*treaties that failed/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /153 shared-water countries.*harmed-person denominator/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'B 3.3');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'human only');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Basin-treaty-breakdown reference passed: cooperation coverage and climate readiness remain institutional context, not invented breakdown or harmed-person counts.');
