import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/europe-heat-mortality-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'published_current_heat_mortality_endpoint_ingested_with_regional_boundary');
assert.equal(snapshot.endpoint2024.geography.countries, 35);
assert.equal(snapshot.endpoint2024.geography.contiguousRegions, 823);
assert.equal(snapshot.endpoint2024.inputMortalityRecord.totalDeathCounts, 45_184_044);
assert.equal(snapshot.endpoint2024.annualResults['2022'].factualHeatDeaths.estimate, 68_593);
assert.equal(snapshot.endpoint2024.annualResults['2022'].counterfactualHeatDeaths.estimate, 30_439);
assert.equal(snapshot.endpoint2024.annualResults['2022'].anthropogenicHeatDeaths.estimate, 38_154);
assert.equal(snapshot.endpoint2024.annualResults['2022'].anthropogenicHeatDeaths.lower95, 21_722);
assert.equal(snapshot.endpoint2024.annualResults['2022'].anthropogenicHeatDeaths.upper95, 58_571);
assert.equal(snapshot.endpoint2024.annualResults['2022'].anthropogenicSharePercent.estimate, 56);
assert.equal(snapshot.endpoint2024.summary.anthropogenicAnnualDeaths2015To2021.minimum, 19_146);
assert.equal(snapshot.endpoint2024.summary.anthropogenicAnnualDeaths2015To2021.maximum, 27_776);
assert.equal(snapshot.endpoint2024.summary.anthropogenicAnnualDeaths2015To2021.count, 7);
assert.equal(snapshot.endpoint2024.summary.southernEuropeAnthropogenicDeaths2022, 26_813);
assert.equal(snapshot.endpoint2024.summary.womenAnthropogenicDeaths2022.estimate, 22_501);
assert.equal(snapshot.endpoint2024.summary.menAnthropogenicDeaths2022.estimate, 14_026);
assert.equal(snapshot.endpoint2024.summary.age80PlusAnthropogenicDeaths2022.estimate, 23_881);
assert.match(snapshot.endpoint2024.method.adaptationBoundary, /excludes the potential role of adaptation/i);
assert.equal(snapshot.endpoint2024.reproducibility.heatMortalityRepository.commit, '5c628ca7b8498ca71531e8e7e05168f8bc3a8619');
assert.equal(snapshot.endpoint2024.reproducibility.heatMortalityRepository.publicSample.regions, 103);
assert.equal(snapshot.endpoint2024.reproducibility.heatMortalityRepository.publicSample.weeklyRows, 42_642);
assert.match(snapshot.endpoint2024.reproducibility.heatMortalityRepository.scope, /sample inputs for 103 regions/i);
assert.match(snapshot.endpoint2024.reproducibility.heatMortalityRepository.scope, /not the full 823-region study dataset/i);
assert.equal(snapshot.endpoint2024.reproducibility.attributionRepository.commit, '5a783659914881c8c8c76ed4e6ffedfd00450837');
assert.match(snapshot.endpoint2024.reproducibility.attributionRepository.scope, /only a GPL-3\.0 license and a one-line README/i);
assert.equal(snapshot.endpoint2024.fetchedDocuments.supplementaryPdf.sha256, '8938fa85eba984ad1204163239c7cbd2592651ca78bf3517760a8a9d2690065f');
assert.equal(snapshot.endpoint2024.reproducibility.regionalPatternAvailability.regionLevelWarmingFactorsPublished, false);
assert.equal(snapshot.endpoint2024.reproducibility.regionalPatternAvailability.regionLevelWarmingConfidenceBoundsPublished, false);
assert.equal(snapshot.endpoint2024.reproducibility.regionalPatternAvailability.attributionCodePubliclyReproducible, false);
assert.match(snapshot.endpoint2024.reproducibility.regionalPatternAvailability.implication, /cannot validate a regional emissions-source removal run/i);
assert.equal(snapshot.endpointAttribution2026.workbook.sha256, '1cae471516c71df9da11fb53d799f5d3df212121fc3ff3c44aae0ff3f5e39515');
assert.equal(snapshot.endpointAttribution2026.workbook.bytes, 173_483);
assert.equal(snapshot.endpointAttribution2026.workbook.sheets, 14);
assert.equal(snapshot.endpointAttribution2026.publishedScope.countries, 34);
assert.equal(snapshot.endpointAttribution2026.publishedScope.regionsInSourceWorkbook, 232);
assert.equal(snapshot.endpointAttribution2026.sourceData.regionalMortalityProbabilityRatio2022.count, 232);
assert(Math.abs(snapshot.endpointAttribution2026.sourceData.regionalMortalityProbabilityRatio2022.median - 3.3633798331718143) < 1e-12);
assert.equal(snapshot.endpointAttribution2026.sourceData.regionalMortalityProbabilityRatio2018.count, 232);
assert.equal(snapshot.endpointAttribution2026.codeAvailability.httpStatus, 404);
assert.match(snapshot.endpointAttribution2026.interpretation, /not a death count or a TULIP reach denominator/i);
assert(snapshot.tulipUse.prohibited.some(rule => /56% anthropogenic share/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /source-removal counterfactual/i.test(rule)));
assert(snapshot.unresolvedForTulip.some(rule => /823 regional warming slopes/i.test(rule)));
assert.match(snapshot.tulipUse.currentCatalogueRecommendation.heatAttributableExcessMortality, /confidence from C to B/i);
assert.equal(snapshot.snapshotDigest.length, 64);
const expectedDigest = createHash('sha256').update(JSON.stringify({
  endpoint2024: snapshot.endpoint2024,
  endpointAttribution2026: snapshot.endpointAttribution2026,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Europe heat-mortality reference passed: current factual-minus-counterfactual death endpoints are ingested with geographic, adaptation and source-allocation boundaries intact.');
