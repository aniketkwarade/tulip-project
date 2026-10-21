import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/gas-power-dependence-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'generation_share_separated_from_realized_harm_with_observed_affordability_shock');
assert.equal(snapshot.endpoints.electricitySystemDependence.firstPercent, 17.97);
assert.equal(snapshot.endpoints.electricitySystemDependence.latestYear, 2025);
assert.equal(snapshot.endpoints.electricitySystemDependence.latestPercent, 21.73);
assert.equal(snapshot.endpoints.electricitySystemDependence.peakYear, 2020);
assert.equal(snapshot.endpoints.electricitySystemDependence.peakPercent, 23.89);
assert.equal(snapshot.endpoints.observedAffordabilityShock.naturalGasShareOfEuWholesaleElectricityPriceIncreaseApproximatePercent, 50);
assert.equal(snapshot.endpoints.observedAffordabilityShock.broadEnergyCrisisPeopleAtRiskOfLosingAbilityToPayForElectricityApproximate, 75_000_000);
assert.equal(snapshot.endpoints.humanConsequences.compatibleCurrentHarmedPersonCount, null);
assert.equal(snapshot.endpoints.ecosystemConsequences.compatibleDirectEcosystemConditionLossPercent, null);
assert(snapshot.tulipUse.prohibited.some(rule => /generation share.*people harmed/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /75 million.*solely/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'B 3.3');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.domains, ['human']);

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Gas-power-dependence reference passed: electricity generation share remains separate from human harm, the 2022 affordability episode stays bounded, and downstream emissions are not double counted.');
