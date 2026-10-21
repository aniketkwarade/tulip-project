import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/port-bottleneck-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'published_global_climate_port_downtime_and_economic_exposure_ingested');
assert.equal(snapshot.coverage.ports, 1_320);
assert.equal(snapshot.coverage.tradeCountries, 207);
assert.equal(snapshot.coverage.supplyChainCountries, 184);
assert.equal(snapshot.coverage.supplyChainSectors, 11);
assert.equal(snapshot.endpoint.downtime.globalMeanExpectedDaysPerPortYear, 1.4);
assert.equal(snapshot.endpoint.downtime.portsAboveFiveExpectedDaysPercent, 5);
assert.equal(snapshot.endpoint.annualRisk.maritimeTradeAtRiskUsdBillion, 81);
assert.equal(snapshot.endpoint.annualRisk.industryOutputAtRiskUsdBillion, 95.8);
assert.equal(snapshot.endpoint.annualRisk.finalConsumptionAtRiskUsdBillion, 26.3);
assert.equal(snapshot.endpoint.annualRisk.forwardEconomicActivityAtRiskUsdBillion, 122.1);
assert.equal(snapshot.source.reproducibilityArchive.sha256, '0e4f1b310365ffbbf4d20d4a4df4bfbf872b7983347bc7738fb8c2a5b3a77225');
assert.equal(snapshot.source.reproducibilityArchive.downloadedForThisSnapshot, false);
assert.deepEqual(snapshot.endpoint.methodBoundary.excludedFromClimateHazardSet, ['earthquake', 'tsunami']);
assert.match(snapshot.endpoint.interpretation, /does not report deaths/i);
assert(snapshot.tulipUse.prohibited.some(rule => /80% of global trade as ecosystem reach/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /observed cash-loss total/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'B 4.0');
const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: snapshot.source,
  coverage: snapshot.coverage,
  endpoint: snapshot.endpoint,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Port-bottleneck reference passed: global climate-related downtime and economic exposure are pinned, while trade coverage, realized loss, people reach and ecosystem harm remain separate.');
