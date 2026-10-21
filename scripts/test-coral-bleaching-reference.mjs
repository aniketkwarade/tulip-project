import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/coral-bleaching-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.version, 'tulip_coral_bleaching_reference_2026_09_24_v2');
assert.equal(snapshot.sources.gcrmn2025.supplementVersionDoi, 'https://doi.org/10.5281/zenodo.22654613');
assert.equal(snapshot.sources.gcrmn2025.repositoryCommit, '7ef705f7009f51102582bbb15a88026fce140ed2');
assert.equal(snapshot.sources.gcrmn2025.files.gcrmnModelledData.sha256, '92c47be596ffbf9cf6e08305daaa8360c643f0a07ca16e349185874f25c990af');
assert.equal(snapshot.endpoints.globalHardCoralCondition.series.length, 45);
assert.equal(snapshot.endpoints.globalHardCoralCondition.latestYear.year, 2024);
assert.equal(snapshot.endpoints.globalHardCoralCondition.latestYear.medianCoverPct, 25.77);
assert(Math.abs(snapshot.endpoints.globalHardCoralCondition.referencePeriod.meanModelledCoverPct - 30.212667) < 0.000001);
assert(Math.abs(snapshot.endpoints.globalHardCoralCondition.currentPeriod.meanModelledCoverPct - 27.354) < 0.000001);
assert(Math.abs(snapshot.endpoints.globalHardCoralCondition.relativeChangeCurrentPeriodVsReferencePct - (-9.461815)) < 0.000001);
assert(Math.abs(snapshot.endpoints.globalHardCoralCondition.latestYear.relativeChangeVsReferencePct - (-14.704649)) < 0.000001);
assert(Math.abs(snapshot.endpoints.globalHardCoralCondition.largestSingleYearDecline2023To2024Pct - (-8.907741)) < 0.000001);
assert(Math.abs(snapshot.endpoints.globalHardCoralCondition.partialRecovery2017To2019Pct - 6.077796) < 0.000001);
assert.equal(snapshot.endpoints.regionalConditionContext.reportClassifiedDecliningRegions.length, 4);
assert(Math.abs(snapshot.endpoints.regionalConditionContext.decliningRegionsShareOfMappedGlobalReefAreaPct - 54.225384) < 0.000001);
assert.equal(snapshot.endpoints.subregionConditionDistribution.subregionCount, 51);
assert.equal(snapshot.endpoints.subregionConditionDistribution.mappedGlobalReefAreaM2, 260_433_737_660);
assert.equal(snapshot.endpoints.subregionConditionDistribution.decliningSubregionCount, 18);
assert(Math.abs(snapshot.endpoints.subregionConditionDistribution.decliningSubregionsShareOfMappedGlobalReefAreaPct - 37.79789) < 0.000001);
assert(Math.abs(snapshot.endpoints.subregionConditionDistribution.strongEvidenceDecliningSubregionsShareOfMappedGlobalReefAreaPct - 33.673673) < 0.000001);
assert(Math.abs(snapshot.endpoints.subregionConditionDistribution.maximumEvidenceDecliningSubregionsShareOfMappedGlobalReefAreaPct - 28.933008) < 0.000001);
assert(Math.abs(snapshot.endpoints.subregionConditionDistribution.unavailableChangeShareOfMappedGlobalReefAreaPct - 46.915398) < 0.000001);
assert(Math.abs(snapshot.endpoints.subregionConditionDistribution.areaWeightedRelativeCoverDeclineWithinDecliningSubregionsPct - 30.740795) < 0.000001);
assert.deepEqual(snapshot.endpoints.subregionConditionDistribution.declineBands, [
  { id: 'under_10_pct', subregionCount: 0, shareOfMappedGlobalReefAreaPct: 0 },
  { id: '10_to_under_30_pct', subregionCount: 7, shareOfMappedGlobalReefAreaPct: 19.722064 },
  { id: '30_to_under_70_pct', subregionCount: 11, shareOfMappedGlobalReefAreaPct: 18.075825 },
  { id: '70_pct_or_more', subregionCount: 0, shareOfMappedGlobalReefAreaPct: 0 },
]);
assert.equal(snapshot.sources.globalBleachingDamage2026.files.articleXml.sha256, 'e2b2c392558e868a9d35a60f98de0c1da236a7dfaab77133fc2268da91b5ca6b');
assert.equal(snapshot.sources.globalBleachingDamage2026.files.surveyDatabase.sha256, '7e1db98b6aba96c06b9d56c1ee3cdca2a679a9dbea1579ff8d7cf4715833684e');
assert.equal(snapshot.endpoints.globalBleachingAndMortality2014To2017.inWaterAndAerialSurveysAfterExclusions, 15_066);
assert.equal(snapshot.endpoints.globalBleachingAndMortality2014To2017.modeledGlobalReefLocationsWithModerateOrGreaterBleachingPct, 51);
assert.equal(snapshot.endpoints.globalBleachingAndMortality2014To2017.modeledGlobalReefLocationsWithModerateOrGreaterMortalityPct, 15);
assert.equal(snapshot.endpoints.recoveryEvidence.greatBarrierReefRecoveryRateDecline1992To2010Pct, 84);
assert.equal(snapshot.endpoints.operationalBleachingEvent.reefAreaWithBleachingLevelHeatStressPct, 84.4);
assert.equal(snapshot.endpoints.compatibleCurrentGlobalFractionOfReefAreaWithMeasuredBleachingOrMortality, null);
assert.equal(snapshot.endpoints.compatibleCurrentHarmedPersonCount, null);
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'D 7.0');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.uncertainty, 'C 6.3 to E 8.5');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.applicableDomains, ['ecosystem']);
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.lower, { severity: 2, reach: 3, persistence: 2 });
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.central, { severity: 3, reach: 3, persistence: 2 });
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.upper, { severity: 3, reach: 4, persistence: 3 });
assert.match(snapshot.tulipUse.prohibited.join(' '), /84\.4% heat-stress exposure.*fraction of reef area bleached/i);
assert.match(snapshot.tulipUse.prohibited.join(' '), /benefiting from reefs.*current human harm/i);
assert.match(snapshot.tulipUse.prohibited.join(' '), /unweighted row percentages/i);

console.log('Coral-bleaching reference passed: subregion area, damage models, heat exposure, mortality, recovery and human dependence remain separate.');
