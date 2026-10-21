import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/glacial-lake-outburst-current-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_glacial_lake_outburst_current_reference_2026_09_24_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.deepEqual(snapshot.appliesToNodeIds, ['glacial_lake_failure_risk', 'glacier_hydrologic_system_floods']);
assert.equal(snapshot.evidence.currentHumanConsequences.southLhonak2023.fatalities, 24);
assert.equal(snapshot.evidence.currentHumanConsequences.southLhonak2023.impactedPeopleLowerBound, 60_000);
assert.equal(snapshot.evidence.currentHumanConsequences.thame2024.displacedPeople, 135);
assert.equal(snapshot.evidence.currentHumanConsequences.thame2024.debrisFlowDistanceKm, 80);
assert.equal(snapshot.evidence.historicalEventDistribution.reportedEvents, 3_151);
assert.equal(snapshot.evidence.historicalEventDistribution.reportedFatalitiesLowerBound, 3_636);
assert.equal(snapshot.evidence.exposureContext.potentiallyExposedPeople, 15_000_000);
assert.equal(snapshot.evidence.exposureContext.excludedFromCurrentReach, true);
assert.equal(snapshot.evidence.ecosystemAndGeomorphicConsequences.compatibleEcosystemConditionLossPercent, null);
assert.equal(snapshot.evidence.ecosystemAndGeomorphicConsequences.compatibleAffectedEcosystemDistributionPercent, null);
assert.equal(snapshot.evidence.ecosystemAndGeomorphicConsequences.compatibleRecoveryTimeDistribution, null);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 7, grade: 'D', lower: 5.1, upper: 8.9, confidence: 'C' },
  revised: { value: 6.3, grade: 'C', lower: 4.8, upper: 7.4, confidence: 'C' },
});
assert.deepEqual(snapshot.ratingDecision.axes.human, {
  severity: { lower: 4, central: 4, upper: 4 },
  reach: { lower: 1, central: 2, upper: 2 },
  persistence: { lower: 4, central: 4, upper: 4 },
});
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 0, central: 1, upper: 2 },
  reach: { lower: 0, central: 1, upper: 2 },
  persistence: { lower: 1, central: 2, upper: 3 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 6);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 4);

console.log('Glacial-lake outburst current-reference checks passed.');
