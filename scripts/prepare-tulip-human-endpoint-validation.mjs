import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calibrationDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const heatHealth = JSON.parse(await readFile(path.join(root, 'public', 'heat-health-snapshot.json'), 'utf8'));
const reviewed = JSON.parse(await readFile(path.join(calibrationDir, 'internal-reviewed-catalogue-candidates.json'), 'utf8'));
const methodReference = JSON.parse(await readFile(path.join(calibrationDir, 'heat-mortality-attribution-reference-snapshot.json'), 'utf8'));
const europeEndpointReference = JSON.parse(await readFile(path.join(calibrationDir, 'europe-heat-mortality-reference-snapshot.json'), 'utf8'));
const regionalPatternPlan = JSON.parse(await readFile(path.join(calibrationDir, 'internal-europe-heat-regional-pattern-ingestion.json'), 'utf8'));
const outputJson = path.join(calibrationDir, 'internal-human-endpoint-validation.json');
const outputReport = path.join(calibrationDir, 'internal-human-endpoint-validation-report.md');
const round = (value, digits = 3) => Number(value.toFixed(digits));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

const nodeId = 'heat_related_mortality_burden';
const globalSeries = heatHealth.records.filter(record => record.node_id === nodeId
  && record.geography_type === 'global'
  && record.indicator_component === 'heat_attributable_mortality')
  .sort((left, right) => left.observation_year - right.observation_year);
assert.equal(globalSeries.length, 32);
assert.equal(globalSeries[0].observation_year, 1990);
assert.equal(globalSeries.at(-1).observation_year, 2021);
const currentWindow = globalSeries.filter(record => record.observation_year >= 2012 && record.observation_year <= 2021);
assert.equal(currentWindow.length, 10);
const meanDeaths2012to2021 = currentWindow.reduce((sum, record) => sum + record.heat_attributable_deaths, 0) / currentWindow.length;
const latest = currentWindow.at(-1);
const reportRoundedMean = 546000;
const reproductionDifferencePct = Math.abs(meanDeaths2012to2021 - reportRoundedMean) / reportRoundedMean * 100;
assert(reproductionDifferencePct < 0.2);

const currentCandidate = reviewed.issues.find(row => row.nodeId === nodeId);
assert(currentCandidate);
assert.equal(currentCandidate.candidate.applicableDomains.length, 1);
assert.equal(currentCandidate.candidate.applicableDomains[0], 'human');

const directAttributionNodeId = 'heatwave_excess_mortality_rates';
const directAttributionCandidate = reviewed.issues.find(row => row.nodeId === directAttributionNodeId);
assert(directAttributionCandidate);
assert.equal(directAttributionCandidate.result.value, 8.5);
assert.equal(directAttributionCandidate.result.grade.letter, 'E');
assert.equal(directAttributionCandidate.result.confidence, 'B');
assert.equal(europeEndpointReference.productionRatingsEnabled, 0);
assert.equal(europeEndpointReference.endpoint2024.summary.anthropogenicHeatDeaths2022.estimate, 38_154);
assert.equal(regionalPatternPlan.productionRatingsEnabled, 0);
assert.equal(regionalPatternPlan.inputAudit.regionJoin.effectiveCoverageAfterAggregate, 103);
assert.equal(regionalPatternPlan.populationPanel.latestYearObservedRegions, 801);
assert.equal(regionalPatternPlan.populationPanel.latestYearMissingRegions, 22);
assert.equal(regionalPatternPlan.populationPanel.boundarySupplement.officialUkMidyearSensitivityRegions, 12);
assert.equal(regionalPatternPlan.populationPanel.boundarySupplement.directLauAggregateRegions, 8);
assert.equal(regionalPatternPlan.populationPanel.boundarySupplement.lauPopulationField.validatedByEurostat, false);
assert.equal(regionalPatternPlan.populationPanel.boundarySupplement.proportionalMergeSensitivityRegions, 2);
assert.equal(regionalPatternPlan.populationPanel.nationalBenchmark.latestNationalPopulation, 538_272_629);
assert.equal(regionalPatternPlan.populationPanel.nationalBenchmark.publishedStatementMinusLatestNational, 4_727_371);

const attributionReference = {
  id: 'vicedo_cabrera_heat_mortality_attribution_2021',
  title: 'The burden of heat-related mortality attributable to recent human-induced climate change',
  url: 'https://www.nature.com/articles/s41558-021-01058-x',
  doi: '10.1038/s41558-021-01058-x',
  studyPeriod: { start: 1991, end: 2018 },
  coverage: { locations: 732, countries: 43 },
  result: {
    centralPctOfWarmSeasonHeatDeaths: 37.0,
    reportedRangePct: { lower: 20.5, upper: 76.3 },
    rangeInterpretation: 'reported cross-model result range, not a TULIP probability distribution',
  },
  codeAndExampleData: 'https://github.com/anavica/mcc_ccattr_NCC',
  availabilityBoundary: 'The public repository contains a simplified ten-city example. The complete mortality database used for the 732-location analysis is not supplied there as an unrestricted production dataset.',
};
assert.equal(methodReference.source.id, attributionReference.id);
assert.equal(methodReference.reproduction.inputs.cities, 10);
assert.equal(methodReference.reproduction.monteCarloIterations, 1000);

const compatibilityChecks = [
  {
    field: 'estimand',
    lancet: 'All heat-attributable deaths and percent of all deaths attributable to heat.',
    attributionStudy: 'Fraction of warm-season heat-related deaths attributable to anthropogenic climate change.',
    compatible: false,
    reason: 'The quantities answer different questions; one is an endpoint total and the other is a causal fraction.',
  },
  {
    field: 'period',
    lancet: 'Current TULIP window uses 2012-2021; latest point is 2021.',
    attributionStudy: '1991-2018.',
    compatible: false,
    reason: 'The climate, population, adaptation and mortality baselines differ.',
  },
  {
    field: 'geographic_population_coverage',
    lancet: 'Global modelled series with the source report describing 120 countries.',
    attributionStudy: '732 locations in 43 countries.',
    compatible: false,
    reason: 'The represented populations and spatial weighting are not the same.',
  },
  {
    field: 'model_chain',
    lancet: 'Lancet Countdown three-stage heat-mortality model and meta-predicted exposure-response functions.',
    attributionStudy: 'Location-specific exposure-response models combined with factual and natural-forcing-only climate simulations.',
    compatible: false,
    reason: 'A causal fraction must be produced inside a matched endpoint model rather than transferred between model vintages.',
  },
];
assert(compatibilityChecks.every(check => check.compatible === false));

const payload = {
  version: 'tulip_internal_human_endpoint_validation_2026_09_23_v11',
  preparedOn: '2026-09-23',
  status: 'heat_mortality_series_direct_endpoint_and_published_algorithm_validated_source_allocation_not_yet_compatible',
  purpose: 'Test whether a measured human terminal endpoint can be connected to TULIP source-removal warming without combining incompatible denominators.',
  endpoint: {
    nodeId,
    source: heatHealth.source,
    recordPeriod: { start: globalSeries[0].observation_year, end: globalSeries.at(-1).observation_year },
    currentWindow: { start: 2012, end: 2021, completeYears: currentWindow.length },
    reproducedMeanHeatAttributableDeathsPerYear: round(meanDeaths2012to2021, 1),
    sourceReportRoundedMeanDeathsPerYear: reportRoundedMean,
    reproductionDifferencePct: round(reproductionDifferencePct, 4),
    latest: {
      year: latest.observation_year,
      heatAttributableDeaths: latest.heat_attributable_deaths,
      heatAttributableFractionPctOfAllDeaths: latest.heat_attributable_fraction_pct,
    },
    uncertaintyBoundary: latest.uncertainty_status,
    currentTulipCandidate: {
      value: currentCandidate.result.value,
      grade: currentCandidate.result.grade.letter,
      confidence: currentCandidate.result.confidence,
      scoreEffectFromThisValidation: 'none',
    },
  },
  directCurrentAttribution: {
    referenceVersion: europeEndpointReference.version,
    referenceDigest: europeEndpointReference.snapshotDigest,
    status: europeEndpointReference.status,
    endpointId: europeEndpointReference.endpoint2024.id,
    articleUrl: europeEndpointReference.endpoint2024.articleUrl,
    geography: europeEndpointReference.endpoint2024.geography,
    observationPeriod: {
      start: europeEndpointReference.endpoint2024.inputMortalityRecord.start,
      end: europeEndpointReference.endpoint2024.inputMortalityRecord.end,
    },
    anthropogenicHeatDeaths2022: europeEndpointReference.endpoint2024.summary.anthropogenicHeatDeaths2022,
    anthropogenicShare2022Percent: europeEndpointReference.endpoint2024.summary.anthropogenicShare2022Percent,
    annualAnthropogenicDeaths2015To2021: europeEndpointReference.endpoint2024.summary.anthropogenicAnnualDeaths2015To2021,
    method: europeEndpointReference.endpoint2024.method,
    regionalPatternAvailability: europeEndpointReference.endpoint2024.reproducibility.regionalPatternAvailability,
    regionalPatternReconstruction: {
      version: regionalPatternPlan.version,
      status: regionalPatternPlan.status,
      validationRegions: regionalPatternPlan.inputAudit.publicSample.regions,
      directRegionMatches: regionalPatternPlan.inputAudit.regionJoin.directMatches,
      declaredAggregate: regionalPatternPlan.inputAudit.regionJoin.documentedAggregate,
      validationRequests: regionalPatternPlan.era5LandRetrieval.stage1ValidationRequests.length,
      historicalRequests: regionalPatternPlan.era5LandRetrieval.stage2HistoricalRequests.length,
      acceptanceCriteria: regionalPatternPlan.acceptanceCriteria.publicSampleComparison,
      candidateFullRegionUniverse: regionalPatternPlan.fullRegionUniverse,
      candidatePopulationPanel: regionalPatternPlan.populationPanel,
      promotionBoundary: regionalPatternPlan.acceptanceCriteria.promotion,
    },
    candidateEffect: {
      nodeId: directAttributionNodeId,
      value: directAttributionCandidate.result.value,
      grade: directAttributionCandidate.result.grade.letter,
      confidence: directAttributionCandidate.result.confidence,
      scoreEffect: 'value_and_grade_unchanged_confidence_upgraded_C_to_B',
    },
    boundary: 'This is a direct current human endpoint for Europe. It is not extrapolated into a global death total and is not allocated proportionally to any emissions source.',
  },
  attributionReference,
  methodReproduction: {
    referenceVersion: methodReference.version,
    referenceDigest: methodReference.snapshotDigest,
    status: methodReference.status,
    scope: methodReference.reproduction.scope,
    cities: methodReference.reproduction.inputs.cities,
    observedDailyRows: methodReference.reproduction.inputs.observed_daily_rows,
    factualModelledDailyRows: methodReference.reproduction.inputs.factual_modelled_daily_rows,
    counterfactualModelledDailyRows: methodReference.reproduction.inputs.counterfactual_modelled_daily_rows,
    climateModels: methodReference.reproduction.climateModels.length,
    monteCarloIterations: methodReference.reproduction.monteCarloIterations,
    reproducedAnthropogenicHeatDeaths: round(methodReference.reproduction.total.anthropogenic_heat_deaths, 1),
    reproducedAnthropogenicHeatDeathsInterval: [
      round(methodReference.reproduction.total.anthropogenic_heat_deaths_ci_low, 1),
      round(methodReference.reproduction.total.anthropogenic_heat_deaths_ci_high, 1),
    ],
    reproducedAnthropogenicShareOfHeatDeathsPct: round(methodReference.reproduction.total.anthropogenic_share_of_heat_deaths_percent, 4),
    interpretation: methodReference.reproduction.resultInterpretation,
    matchedSourceEndpointEquation: methodReference.tulipUse.matchedSourceEndpointEquation,
    ratingEffect: 'none_method_reproduction_does_not_supply_a_node_specific_source_removal_endpoint',
  },
  compatibilityChecks,
  prohibitedCombination: {
    operation: 'Do not multiply the Lancet Countdown 2021 deaths or 2012-2021 mean by 37%.',
    reason: 'That would combine different periods, populations, counterfactuals and exposure-response models and would create a source-allocation number that neither study reports.',
  },
  nextRequiredData: [
    'A matched location-year mortality and temperature panel with an allowed reproducible use path.',
    'The same exposure-response function evaluated under factual climate and each source-removal counterfactual.',
    'Complete the checksum-pinned ERA5-Land reconstruction plan, pass the 103-region public-sample tolerances, then calculate the reconstructed 823-region pattern and compare it with source-provided metadata or slopes if they become available.',
    'Obtain date-defined national-statistics values for the ten changed Belgian and Estonian regions, replace the proportional Oudsbergen split between BE221 and BE222, and document date alignment before using the twelve official UK mid-year values in a 1 January population panel.',
    'Reconcile the article’s over-543-million coverage statement with the authors’ population-panel vintage; current Eurostat national totals for the same 35 countries remain below that statement throughout 2015-2022.',
    'Population, age, adaptation and mortality baselines aligned to the current TULIP assessment window.',
    'Model and sampling uncertainty retained without manufacturing a probability distribution from the reported range.',
  ],
};
payload.digest = digest({ endpoint: payload.endpoint, directCurrentAttribution: payload.directCurrentAttribution, attributionReference, methodReproduction: payload.methodReproduction, compatibilityChecks, prohibitedCombination: payload.prohibitedCombination, nextRequiredData: payload.nextRequiredData });

const report = `# TULIP human-endpoint validation\n\nStatus: **a direct current European heat-mortality endpoint is ingested, the global series is reproduced, and the published attribution algorithm is reproduced; emission-source allocation is not yet compatible.** The numerical E 8.5 rating is unchanged. Evidence confidence for Heat-Attributable Excess Mortality improves from C to B.\n\n## What is now verified\n\n- The retained Lancet Countdown global series contains ${globalSeries.length} annual observations from ${globalSeries[0].observation_year} through ${globalSeries.at(-1).observation_year}.\n- The mean for 2012-2021 is ${round(meanDeaths2012to2021, 1).toLocaleString('en-US')} heat-attributable deaths per year, within ${round(reproductionDifferencePct, 4)}% of the source report's rounded 546,000 figure.\n- The latest retained point is ${latest.heat_attributable_deaths.toLocaleString('en-US')} deaths in ${latest.observation_year}, or ${latest.heat_attributable_fraction_pct}% of all deaths in the source model.\n- A separate matched factual-versus-counterfactual study attributes ${payload.directCurrentAttribution.anthropogenicHeatDeaths2022.estimate.toLocaleString('en-US')} European deaths in 2022 to anthropogenic warming, with a reported 95% interval of ${payload.directCurrentAttribution.anthropogenicHeatDeaths2022.lower95.toLocaleString('en-US')} to ${payload.directCurrentAttribution.anthropogenicHeatDeaths2022.upper95.toLocaleString('en-US')}. It covers ${payload.directCurrentAttribution.geography.countries} countries and ${payload.directCurrentAttribution.geography.contiguousRegions} regions.\n- The direct central estimate is non-zero in every year from 2015 through 2022. Each death remains a terminal consequence; annual values are not added together as a second severity measure.\n- The regional-pattern reconstruction now has ${payload.directCurrentAttribution.regionalPatternReconstruction.validationRequests} fixed validation requests, ${payload.directCurrentAttribution.regionalPatternReconstruction.historicalRequests} historical requests and predeclared error tolerances. The 103 public Italian regions resolve through 102 direct joins and one declared Sardinia aggregate. A separate candidate universe now reproduces all 823 published regional slots across 35 countries and matches non-null Eurostat 2019 records for every identifier. The official population panel is complete for 2017-2019. Official mid-2022 values now cover ${payload.directCurrentAttribution.regionalPatternReconstruction.candidatePopulationPanel.boundarySupplement.officialUkMidyearSensitivityRegions} missing UK slots as a date-shifted sensitivity input. Eight Belgian and Estonian study-era regions have direct old-boundary aggregates of the LAU 2022 edition population field, but that voluntary field is not validated by Eurostat and its exact reference date is not stated; BE221 and BE222 also retain one declared proportional split for the later Oudsbergen merger. A new official national benchmark shows that current Eurostat totals for the same 35 countries remain below the article’s over-543-million statement in every study year, so the regional panel must not be rescaled to force agreement. The ERA5-Land retrieval remains account-gated.\n- The authors’ ten-city example runs end to end with ${payload.methodReproduction.observedDailyRows.toLocaleString('en-US')} observed daily rows, ${payload.methodReproduction.climateModels} climate models and ${payload.methodReproduction.monteCarloIterations.toLocaleString('en-US')} Monte Carlo iterations. It produces ${payload.methodReproduction.reproducedAnthropogenicHeatDeaths.toLocaleString('en-US')} factual-minus-counterfactual heat deaths, with an interval of ${payload.methodReproduction.reproducedAnthropogenicHeatDeathsInterval[0].toLocaleString('en-US')} to ${payload.methodReproduction.reproducedAnthropogenicHeatDeathsInterval[1].toLocaleString('en-US')}.\n- The example cities are hypothetical. Its ${payload.methodReproduction.reproducedAnthropogenicShareOfHeatDeathsPct}% result is a method check, not a global estimate or TULIP input.\n- The endpoint is human-only. Nature effects remain in their own nodes and do not enter this mortality rating.\n\n## What changed in TULIP\n\nHeat-Attributable Excess Mortality remains **E 8.5**. Its evidence confidence improves from **C to B** because a recent direct endpoint now supplies deaths, a matched counterfactual and a published interval. It does not become A because the direct attribution is European while the TULIP node is global, and the public attribution-code trail is incomplete.\n\n## Why this cannot yet allocate deaths to an emissions source\n\nThe attribution study reports that 37.0% of warm-season heat-related deaths across 732 locations in 43 countries during 1991-2018 were attributable to anthropogenic climate change, with a reported range of 20.5-76.3%. The TULIP endpoint series uses a different period, coverage and model. Multiplying the current death count by 37% would combine incompatible denominators and create a result neither source reports. The newer European endpoint also cannot be divided among emissions sources using each source's emissions or warming share.\n\nThe accepted source calculation is: **${payload.methodReproduction.matchedSourceEndpointEquation}**.\n\n| Compatibility test | Lancet endpoint | Attribution study | Result |\n| --- | --- | --- | --- |\n${compatibilityChecks.map(check => `| ${check.field.replaceAll('_', ' ')} | ${check.lancet} | ${check.attributionStudy} | Not compatible: ${check.reason} |`).join('\n')}\n\n## Exact next requirement\n\n${payload.nextRequiredData.map(item => `- ${item}`).join('\n')}\n\n## Sources\n\n- [Lancet Countdown Data Explorer](${heatHealth.source.explorer_url}) and the retained 2025 indicator snapshot.\n- [Beck et al. 2024 European heat-mortality attribution](${payload.directCurrentAttribution.articleUrl}).\n- [Vicedo-Cabrera et al. heat-mortality attribution study](${attributionReference.url}).\n- [Published example code and ten-city data](${attributionReference.codeAndExampleData}).\n`;

await Promise.all([
  writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(outputReport, report),
]);
console.log(JSON.stringify({ outputJson, outputReport, status: payload.status, endpoint: payload.endpoint, digest: payload.digest }, null, 2));
