import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calibrationDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const json = async filename => JSON.parse(await readFile(path.join(calibrationDir, filename), 'utf8'));
const optionalJson = async filename => {
  try {
    return await json(filename);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};
const [allocation, warming, methaneWarming, mortality, europeMortality, carbonHazard, heatSensitivity, regionalPatternPlan, arcoEra5Crosscheck, awsEra5Crosscheck, openMeteoEra5LandCrosscheck, ecosystemCounterfactualInventory, sourceHistoryFeasibility, europeTemperatureMortalityBridge, europeTemperatureMortalityPooledModel, europeTemperatureMortalityAttribution, europeTemperatureMortalityPatternScreen, europeTemperatureMortalityRegionalBoundaries, europeTemperatureMortalityLongRecordPlan, europeTemperatureMortalityAreaWeights, europeTemperatureMortalityLongRecordRetrieval, europeTemperatureMortalityLongRecordPatternAnalysis, pangeoIndependentPatternAnalysis, nasaExactWeekIndependentPatternAnalysis, europeTemperatureMortalityPatternPromotion, europeTemperatureMortalitySourceRemovalEndpoint] = await Promise.all([
  json('internal-emission-source-allocation.json'),
  json('internal-emissions-to-warming-validation.json'),
  json('internal-methane-to-warming-validation.json'),
  json('heat-mortality-attribution-reference-snapshot.json'),
  json('europe-heat-mortality-reference-snapshot.json'),
  json('carbon-majors-heatwave-reference-snapshot.json'),
  json('internal-emission-source-heat-endpoint-sensitivity.json'),
  json('internal-europe-heat-regional-pattern-ingestion.json'),
  json('internal-europe-heat-arco-era5-crosscheck.json'),
  json('internal-europe-heat-aws-era5-crosscheck.json'),
  json('internal-europe-heat-openmeteo-era5land-crosscheck.json'),
  json('isimip-ecosystem-counterfactual-inventory.json'),
  json('internal-emission-source-history-feasibility.json'),
  json('europe-temperature-mortality-bridge-reference-snapshot.json'),
  json('europe-temperature-mortality-pooled-model-reproduction.json'),
  json('europe-temperature-mortality-attribution-reproduction.json'),
  json('europe-temperature-mortality-source-removal-pattern-screen.json'),
  json('europe-temperature-mortality-regional-boundary-crosswalk.json'),
  json('europe-temperature-mortality-long-record-retrieval-plan.json'),
  json('europe-temperature-mortality-regional-area-weights.json'),
  json('europe-temperature-mortality-long-record-retrieval.json'),
  optionalJson('europe-temperature-mortality-long-record-pattern-analysis.json'),
  optionalJson('pangeo-cmip6-independent-pattern-analysis.json'),
  optionalJson('nasa-nex-gddp-cmip6-independent-pattern-analysis.json'),
  optionalJson('europe-temperature-mortality-pattern-promotion-decision.json'),
  optionalJson('europe-temperature-mortality-source-removal-endpoint.json'),
]);

const outputJson = path.join(calibrationDir, 'internal-emission-source-endpoint-pilot.json');
const outputCsv = path.join(calibrationDir, 'internal-emission-source-endpoint-pilot.csv');
const outputReport = path.join(calibrationDir, 'internal-emission-source-endpoint-pilot-report.md');
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

assert.equal(allocation.rows.length, 28);
assert.equal(warming.results.length, 20);
assert.equal(mortality.productionRatingsEnabled, 0);
assert.equal(mortality.reproduction.inputs.cities, 10);
assert.equal(europeMortality.endpoint2024.reproducibility.regionalPatternAvailability.regionLevelWarmingFactorsPublished, false);
assert.equal(carbonHazard.productionRatingsEnabled, 0);
assert.equal(carbonHazard.coverage.events, 213);
assert.equal(carbonHazard.coverage.carbonMajors, 180);
assert.equal(carbonHazard.coverage.emitterEventPairs, 38_340);
assert.equal(heatSensitivity.status, 'source_specific_nonlinear_human_endpoint_sensitivity_not_calibrated_attribution');
assert.equal(heatSensitivity.results.length, 21);
assert.equal(heatSensitivity.inputCounts.co2_source_nodes, 20);
assert.equal(heatSensitivity.inputCounts.methane_source_nodes, 1);
assert.equal(heatSensitivity.inputCounts.regions, 103);
assert.equal(regionalPatternPlan.inputAudit.regionJoin.effectiveCoverageAfterAggregate, 103);
assert.equal(regionalPatternPlan.populationPanel.latestYearMissingRegions, 22);
assert.equal(regionalPatternPlan.populationPanel.boundarySupplement.officialUkMidyearSensitivityRegions, 12);
assert.equal(regionalPatternPlan.populationPanel.boundarySupplement.directLauAggregateRegions, 8);
assert.equal(regionalPatternPlan.populationPanel.boundarySupplement.proportionalMergeSensitivityRegions, 2);
assert.equal(arcoEra5Crosscheck.status, 'fallback_not_admitted_resolution_and_agreement_insufficient');
assert.equal(arcoEra5Crosscheck.results.passesPredeclaredAbsoluteReconstructionCriteria, false);
assert.equal(arcoEra5Crosscheck.decision.admissionStatus, 'rejected_for_source_removal_endpoint_attribution');
assert.equal(awsEra5Crosscheck.status, 'fallback_not_admitted_agreement_insufficient');
assert.equal(awsEra5Crosscheck.results.passesPredeclaredAbsoluteReconstructionCriteria, false);
assert.equal(awsEra5Crosscheck.decision.admissionStatus, 'rejected_for_source_removal_endpoint_attribution');
assert.equal(openMeteoEra5LandCrosscheck.status, 'public_sample_temperature_pattern_validated_full_endpoint_still_pending');
assert.equal(openMeteoEra5LandCrosscheck.results.passesPredeclaredAbsoluteReconstructionCriteria, true);
assert.equal(openMeteoEra5LandCrosscheck.decision.admissionStatus, 'accepted_for_public_sample_temperature_pattern_validation_only');
assert.equal(ecosystemCounterfactualInventory.status, 'paired_biodiversity_counterfactual_outputs_not_published');
assert.equal(ecosystemCounterfactualInventory.counts.terrestrialBiodiversityObservedClimateDatasets, 24);
assert.equal(ecosystemCounterfactualInventory.counts.terrestrialBiodiversityCounterfactualClimateDatasets, 0);
assert.equal(sourceHistoryFeasibility.counts.nodesAudited, 6);
assert.equal(sourceHistoryFeasibility.counts.nodeSpecificHistoriesAdmitted, 0);
assert.equal(europeTemperatureMortalityBridge.status, 'candidate_independent_human_endpoint_bridge_not_admitted');
assert.equal(europeTemperatureMortalityBridge.counts.affectedEmissionSourceNodes, 21);
assert.equal(europeTemperatureMortalityBridge.counts.axesAdmitted, 0);
assert.equal(europeTemperatureMortalityBridge.counts.scoresChanged, 0);
assert.equal(europeTemperatureMortalityPooledModel.status, 'central_pooled_model_internally_reproduced_not_independently_validated');
assert.equal(europeTemperatureMortalityPooledModel.model.crossRuntimeValidation.status, 'passed_python_numpy_vs_base_r');
assert.equal(europeTemperatureMortalityPooledModel.admissionDecision.axesAdmitted, 0);
assert.equal(europeTemperatureMortalityPooledModel.admissionDecision.scoresChanged, 0);
assert.equal(europeTemperatureMortalityAttribution.status, 'pooled_factual_temperature_mortality_attribution_internally_reproduced_not_independently_validated');
assert.equal(europeTemperatureMortalityAttribution.coverage.matchedDailyMinusBinnedDayCount, 0);
assert.equal(europeTemperatureMortalityAttribution.validation.duplicateDailyDateRows, 0);
assert.equal(europeTemperatureMortalityAttribution.admissionDecision.axesAdmitted, 0);
assert.equal(europeTemperatureMortalityAttribution.admissionDecision.scoresChanged, 0);
assert.equal(europeTemperatureMortalityPatternScreen.status, 'complete_short_record_regional_pattern_screen_not_admitted');
assert.equal(europeTemperatureMortalityPatternScreen.coverage.fittedRegions, 971);
assert.equal(europeTemperatureMortalityPatternScreen.coverage.fittedRegionYears, 22_333);
assert.equal(europeTemperatureMortalityPatternScreen.decision.axesAdmitted, 0);
assert.equal(europeTemperatureMortalityPatternScreen.decision.scoresChanged, 0);
assert.equal(europeTemperatureMortalityRegionalBoundaries.status, 'complete_all_response_regions_resolved_to_official_gisco_boundaries');
assert.equal(europeTemperatureMortalityRegionalBoundaries.coverage.resolvedRegions, 971);
assert.equal(europeTemperatureMortalityRegionalBoundaries.coverage.missingRegions.length, 0);
assert.equal(europeTemperatureMortalityRegionalBoundaries.decision.axesAdmitted, 0);
assert.equal(europeTemperatureMortalityRegionalBoundaries.decision.scoresChanged, 0);
assert.equal(europeTemperatureMortalityLongRecordPlan.status, 'complete_sparse_long_record_read_plan_execution_pending');
assert.equal(europeTemperatureMortalityLongRecordPlan.scope.regions, 971);
assert.equal(europeTemperatureMortalityLongRecordPlan.decision.axesAdmitted, 0);
assert.equal(europeTemperatureMortalityLongRecordPlan.decision.scoresChanged, 0);
assert.equal(europeTemperatureMortalityAreaWeights.status, 'complete_sparse_area_intersection_weights_for_all_response_regions');
assert.equal(europeTemperatureMortalityAreaWeights.coverage.regions, 971);
assert.equal(europeTemperatureMortalityAreaWeights.coverage.regionsWithoutWeights, 0);
assert.equal(europeTemperatureMortalityAreaWeights.decision.axesAdmitted, 0);
assert.equal(europeTemperatureMortalityAreaWeights.decision.scoresChanged, 0);
assert(['partial_resumable_long_record_retrieval', 'complete_all_70883_region_year_summer_means_execution_validation_pending'].includes(europeTemperatureMortalityLongRecordRetrieval.status));
assert.equal(europeTemperatureMortalityLongRecordRetrieval.inputs.retrievalPlanDigest, europeTemperatureMortalityLongRecordPlan.digest);
assert.equal(europeTemperatureMortalityLongRecordRetrieval.inputs.areaWeightsDigest, europeTemperatureMortalityAreaWeights.digest);
assert(europeTemperatureMortalityLongRecordRetrieval.execution.completedYearCount >= 1);
assert(europeTemperatureMortalityLongRecordRetrieval.execution.completedYearCount <= 73);
assert.equal(europeTemperatureMortalityLongRecordRetrieval.execution.regionYearRows, europeTemperatureMortalityLongRecordRetrieval.execution.completedYearCount * 971);
assert.equal(europeTemperatureMortalityLongRecordRetrieval.execution.remainingYears.length, 73 - europeTemperatureMortalityLongRecordRetrieval.execution.completedYearCount);
assert.equal(europeTemperatureMortalityLongRecordRetrieval.decision.axesAdmitted, 0);
assert.equal(europeTemperatureMortalityLongRecordRetrieval.decision.scoresChanged, 0);
if (europeTemperatureMortalityLongRecordPatternAnalysis) {
  assert.equal(europeTemperatureMortalityLongRecordRetrieval.status, 'complete_all_70883_region_year_summer_means_execution_validation_pending');
  assert.equal(europeTemperatureMortalityLongRecordPatternAnalysis.status, 'complete_long_record_pattern_stability_challenge_independent_comparison_pending');
  assert.equal(europeTemperatureMortalityLongRecordPatternAnalysis.inputs.retrievalDigest, europeTemperatureMortalityLongRecordRetrieval.digest);
  assert.equal(europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.responseRegions, 971);
  assert.equal(europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.responseRegionYears, 70_883);
  assert.equal(europeTemperatureMortalityLongRecordPatternAnalysis.decision.axesAdmitted, 0);
  assert.equal(europeTemperatureMortalityLongRecordPatternAnalysis.decision.scoresChanged, 0);
}
if (pangeoIndependentPatternAnalysis) {
  assert.equal(pangeoIndependentPatternAnalysis.status, 'complete_monthly_independent_pattern_ensemble');
  assert.deepEqual(pangeoIndependentPatternAnalysis.counts, {
    models: 22,
    institutions: 17,
    regions: 971,
    years: 73,
    seasonDefinitions: 2,
    modelRegionFits: 42_724,
  });
  assert.equal(pangeoIndependentPatternAnalysis.productionRatingsEnabled, 0);
  assert.equal(pangeoIndependentPatternAnalysis.decision.axesAdmitted, 0);
  assert.equal(pangeoIndependentPatternAnalysis.decision.scoresChanged, 0);
  assert([
    'complete_era5_pattern_pending',
    'monthly_independent_pattern_tests_complete_exact_week_challenge_pending',
  ].includes(pangeoIndependentPatternAnalysis.comparison.status));
  if (pangeoIndependentPatternAnalysis.comparison.status === 'monthly_independent_pattern_tests_complete_exact_week_challenge_pending') {
    assert(europeTemperatureMortalityLongRecordPatternAnalysis);
    assert.equal(pangeoIndependentPatternAnalysis.comparison.era5PatternDigest, europeTemperatureMortalityLongRecordPatternAnalysis.digest);
    assert.equal(typeof pangeoIndependentPatternAnalysis.comparison.monthlyTestsPassed, 'boolean');
    assert.equal(typeof pangeoIndependentPatternAnalysis.comparison.views, 'object');
  }
}
if (nasaExactWeekIndependentPatternAnalysis) {
  assert(pangeoIndependentPatternAnalysis);
  assert.equal(nasaExactWeekIndependentPatternAnalysis.status, 'complete_exact_week_independent_pattern_ensemble');
  assert.deepEqual(nasaExactWeekIndependentPatternAnalysis.counts, {
    models: 29,
    institutions: 21,
    regions: 971,
    years: 73,
    modelRegionFits: 28_159,
  });
  assert.equal(nasaExactWeekIndependentPatternAnalysis.inputs.monthlyAnalysisDigest, pangeoIndependentPatternAnalysis.digest);
  assert.equal(nasaExactWeekIndependentPatternAnalysis.productionRatingsEnabled, 0);
  assert.equal(nasaExactWeekIndependentPatternAnalysis.decision.axesAdmitted, 0);
  assert.equal(nasaExactWeekIndependentPatternAnalysis.decision.scoresChanged, 0);
  assert([
    'exact_week_ensemble_complete_era5_pattern_pending',
    'exact_week_independent_pattern_tests_complete',
  ].includes(nasaExactWeekIndependentPatternAnalysis.comparison.status));
  if (nasaExactWeekIndependentPatternAnalysis.comparison.status === 'exact_week_independent_pattern_tests_complete') {
    assert(europeTemperatureMortalityLongRecordPatternAnalysis);
    assert.equal(nasaExactWeekIndependentPatternAnalysis.comparison.era5PatternDigest, europeTemperatureMortalityLongRecordPatternAnalysis.digest);
    assert.equal(typeof nasaExactWeekIndependentPatternAnalysis.comparison.exactWeekTestsPassed, 'boolean');
    assert.equal(typeof nasaExactWeekIndependentPatternAnalysis.comparison.views, 'object');
  }
}
if (europeTemperatureMortalityPatternPromotion) {
  assert(europeTemperatureMortalityLongRecordPatternAnalysis);
  assert(pangeoIndependentPatternAnalysis);
  assert(nasaExactWeekIndependentPatternAnalysis);
  assert.equal(europeTemperatureMortalityPatternPromotion.inputs.era5PatternDigest, europeTemperatureMortalityLongRecordPatternAnalysis.digest);
  assert.equal(europeTemperatureMortalityPatternPromotion.inputs.monthlyIndependentPatternDigest, pangeoIndependentPatternAnalysis.digest);
  assert.equal(europeTemperatureMortalityPatternPromotion.inputs.exactWeekIndependentPatternDigest, nasaExactWeekIndependentPatternAnalysis.digest);
  assert.equal(europeTemperatureMortalityPatternPromotion.counts.regions, 971);
  assert.equal(europeTemperatureMortalityPatternPromotion.counts.monthlyModels, 22);
  assert.equal(europeTemperatureMortalityPatternPromotion.counts.monthlyInstitutions, 17);
  assert.equal(europeTemperatureMortalityPatternPromotion.counts.exactWeekModels, 29);
  assert.equal(europeTemperatureMortalityPatternPromotion.counts.exactWeekInstitutions, 21);
  assert.equal(europeTemperatureMortalityPatternPromotion.counts.frozenTests, 30);
  assert.equal(
    europeTemperatureMortalityPatternPromotion.counts.passedTests + europeTemperatureMortalityPatternPromotion.counts.failedTests,
    30,
  );
  assert.equal(typeof europeTemperatureMortalityPatternPromotion.decision.patternInputAdmittedToMatchedEndpoint, 'boolean');
  assert.equal(europeTemperatureMortalityPatternPromotion.decision.axesAdmitted, 0);
  assert.equal(europeTemperatureMortalityPatternPromotion.decision.scoresChanged, 0);
  assert.equal(
    europeTemperatureMortalityPatternPromotion.status,
    europeTemperatureMortalityPatternPromotion.decision.patternInputAdmittedToMatchedEndpoint
      ? 'regional_pattern_promoted_to_matched_endpoint_input'
      : 'regional_pattern_rejected_for_source_removal_endpoint',
  );
}
if (europeTemperatureMortalitySourceRemovalEndpoint) {
  assert(europeTemperatureMortalityPatternPromotion);
  assert.equal(europeTemperatureMortalityPatternPromotion.decision.patternInputAdmittedToMatchedEndpoint, true);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.status, 'complete_matched_source_removal_human_endpoint_ecosystem_endpoint_pending');
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.inputs.promotionDigest, europeTemperatureMortalityPatternPromotion.digest);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.inputs.patternDigest, europeTemperatureMortalityLongRecordPatternAnalysis.digest);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.coverage.regions, 971);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.coverage.sourceNodes, 21);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.coverage.bootstrapFits, 100);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.results.length, 21);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.decision.humanEndpointCompleted, true);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.decision.ecosystemEndpointCompleted, false);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.decision.axesAdmitted, 0);
  assert.equal(europeTemperatureMortalitySourceRemovalEndpoint.decision.scoresChanged, 0);
}
const europeTemperatureMortalityLongRecordNextGate = europeTemperatureMortalitySourceRemovalEndpoint?.decision.nextGate
  ?? europeTemperatureMortalityPatternPromotion?.decision.nextGate
  ?? nasaExactWeekIndependentPatternAnalysis?.decision.nextGate
  ?? pangeoIndependentPatternAnalysis?.decision.nextGate
  ?? europeTemperatureMortalityLongRecordPatternAnalysis?.decision.nextGate
  ?? europeTemperatureMortalityLongRecordRetrieval.decision.nextGate;
const monthlyIndependentPatternSummary = pangeoIndependentPatternAnalysis ? {
  version: pangeoIndependentPatternAnalysis.version,
  status: pangeoIndependentPatternAnalysis.status,
  counts: pangeoIndependentPatternAnalysis.counts,
  comparison: pangeoIndependentPatternAnalysis.comparison,
  admissionDecision: pangeoIndependentPatternAnalysis.decision,
} : null;
const exactWeekIndependentPatternSummary = nasaExactWeekIndependentPatternAnalysis ? {
  version: nasaExactWeekIndependentPatternAnalysis.version,
  status: nasaExactWeekIndependentPatternAnalysis.status,
  counts: nasaExactWeekIndependentPatternAnalysis.counts,
  monthlyResolutionComparison: nasaExactWeekIndependentPatternAnalysis.monthlyResolutionComparison,
  comparison: nasaExactWeekIndependentPatternAnalysis.comparison,
  admissionDecision: nasaExactWeekIndependentPatternAnalysis.decision,
} : null;
const regionalPatternPromotionSummary = europeTemperatureMortalityPatternPromotion ? {
  version: europeTemperatureMortalityPatternPromotion.version,
  status: europeTemperatureMortalityPatternPromotion.status,
  counts: europeTemperatureMortalityPatternPromotion.counts,
  failedTests: europeTemperatureMortalityPatternPromotion.failedTests,
  admissionDecision: europeTemperatureMortalityPatternPromotion.decision,
} : null;
const sourceRemovalEndpointByNode = new Map(
  (europeTemperatureMortalitySourceRemovalEndpoint?.results ?? []).map(row => [row.nodeId, row]),
);
const warmingByNode = new Map(warming.results.map(row => [row.nodeId, row]));
const heatSensitivityByNode = new Map(heatSensitivity.results.map(row => [row.node_id, row]));
const methaneWarmingByNode = new Map(methaneWarming.results
  .filter(row => row.calculation)
  .map(row => [row.nodeId, row]));
const sourceHistoryFeasibilityByNode = new Map(sourceHistoryFeasibility.rows.map(row => [row.nodeId, row]));
const europeTemperatureMortalityBridgeNodeIds = new Set(europeTemperatureMortalityBridge.affectedNodeIds);

const stageDefinitions = [
  {
    stage: 'source_emissions_history',
    question: 'What is this source’s non-overlapping emissions history?',
    acceptedEvidence: 'Gas-specific annual values with a documented source boundary, geography, period and relationship to overlapping aggregate nodes.',
    output: 'A time series and uncertainty or quality record; annual shares remain accounting facts only.',
  },
  {
    stage: 'source_removal_climate_response',
    question: 'How does climate change when this source history is removed?',
    acceptedEvidence: 'A time-dependent, source-removal climate-model result or a validated physical approximation whose limits are carried forward.',
    output: 'A climate-response time series, not a harm score.',
  },
  {
    stage: 'matched_hazard_response',
    question: 'How does a specific hazard change under the same source-removal counterfactual?',
    acceptedEvidence: 'The same hazard model evaluated under factual and source-removal climate, with event, geography and period held compatible.',
    output: 'A source-attributable change in hazard intensity or likelihood; still not a terminal consequence.',
  },
  {
    stage: 'matched_terminal_endpoint',
    question: 'How does measured harm change when the source is removed?',
    acceptedEvidence: 'The same exposure-response, population or ecosystem baseline evaluated under factual and source-removal hazard, retaining non-linearity and uncertainty.',
    output: 'Attributable terminal human or ecosystem harm with an explicit denominator.',
  },
  {
    stage: 'tulip_axis_calibration',
    question: 'What do the terminal outcomes imply for severity, reach and persistence?',
    acceptedEvidence: 'Predefined conversion thresholds, compatible denominators and a documented recovery interpretation, reviewed independently from the central estimate.',
    output: 'Bounded TULIP axes, rating and confidence with all double-counting exclusions recorded.',
  },
];

const prohibitedOperations = [
  'global heat deaths × annual emissions share',
  'global heat deaths × source-attributable GMST / total GMST',
  'reported disaster deaths × heatwave probability ratio',
  'aggregate Carbon Emissions TULIP score × source inventory share',
  'one endpoint’s human result copied into nature axes or another hazard family',
];

const rows = allocation.rows.map(row => {
  const co2Physical = warmingByNode.get(row.nodeId) ?? null;
  const methanePhysical = methaneWarmingByNode.get(row.nodeId) ?? null;
  const sourceHeatSensitivity = heatSensitivityByNode.get(row.nodeId) ?? null;
  const matchedHumanEndpoint = sourceRemovalEndpointByNode.get(row.nodeId) ?? null;
  const historyBoundaryAudit = sourceHistoryFeasibilityByNode.get(row.nodeId) ?? null;
  const humanEndpointBridgeEligible = europeTemperatureMortalityBridgeNodeIds.has(row.nodeId);
  const physicalStage = co2Physical
    ? {
        status: 'published_arithmetic_reproduced_partial_history',
        output: co2Physical.attributableGmstScreenC,
        annualSeries: {
          status: co2Physical.annualGmstScreen.status,
          firstYear: co2Physical.annualGmstScreen.firstYear,
          lastYear: co2Physical.annualGmstScreen.lastYear,
          records: co2Physical.annualGmstScreen.records.length,
          interpretation: co2Physical.annualGmstScreen.interpretation,
        },
        boundary: co2Physical.history.boundaryNote,
      }
    : methanePhysical
      ? {
          status: 'published_gwp_star_reproduced_partial_history',
          output: methanePhysical.latestPhysicalIntermediate.gmstResponseC,
          annualSeries: {
            status: 'validated_path_dependent_methane_response_series',
            firstYear: methanePhysical.calculation.outputPeriod.start,
            lastYear: methanePhysical.calculation.outputPeriod.end,
            records: methanePhysical.calculation.records.length,
            interpretation: methanePhysical.referenceBasis.interpretation,
          },
          boundary: methanePhysical.sourceBoundary,
        }
    : {
        status: 'not_yet_validated_for_source_removal',
        output: null,
        boundary: row.requiredNextEvidence[0],
      };
  const physicalReady = co2Physical != null || methanePhysical != null;
  const canEnterCarbonMajorsHazardPilot = co2Physical != null
    && !['peatland_drainage_co2', 'deforestation_co2_release'].includes(row.nodeId);
  return {
    nodeId: row.nodeId,
    name: row.name,
    retainedCandidate: row.currentCandidate,
    sourceHistoryStage: {
      status: row.allocationReadiness,
      latestMeasurement: row.measurement,
      cumulativeCo2Screen: row.physicalScreening?.cumulativeGtCO2 ?? null,
      methaneGwpStarScreen: row.methanePhysicalScreening?.latest?.gmstResponseC ?? null,
      boundaryAudit: historyBoundaryAudit ? {
        version: sourceHistoryFeasibility.version,
        status: historyBoundaryAudit.status,
        finding: historyBoundaryAudit.finding,
        admittedUse: historyBoundaryAudit.admittedUse,
        prohibitedUse: historyBoundaryAudit.prohibitedUse,
        nextRequiredData: historyBoundaryAudit.nextRequiredData,
        ratingEffect: historyBoundaryAudit.ratingEffect,
      } : null,
    },
    physicalStage,
    heatHazardStage: {
      status: canEnterCarbonMajorsHazardPilot
        ? 'published_hazard_matrix_ingested_tulip_source_crosswalk_not_run'
        : sourceHeatSensitivity
          ? 'source_specific_heat_endpoint_sensitivity_run_non_fossil_hazard_crosswalk_not_applicable'
        : methanePhysical
          ? 'physical_ready_compatible_methane_hazard_model_not_selected'
          : 'blocked_by_source_history_or_physical_stage',
      reference: canEnterCarbonMajorsHazardPilot ? carbonHazard.source.id : null,
      evidenceCoverage: canEnterCarbonMajorsHazardPilot ? {
        events: carbonHazard.coverage.events,
        carbonMajors: carbonHazard.coverage.carbonMajors,
        emitterEventPairs: carbonHazard.coverage.emitterEventPairs,
        eventPeriod: carbonHazard.source.reportedEventPeriod,
      } : null,
      limitation: canEnterCarbonMajorsHazardPilot
        ? 'The published matrix is actor-based. TULIP sector boundaries have not been crosswalked to its 180 emitters, and its heatwave hazard values are not terminal harm outcomes.'
        : sourceHeatSensitivity
          ? 'The Carbon Majors fossil-producer matrix is incompatible with this source boundary. Its nonlinear mortality sensitivity uses the separate global-to-local temperature-pattern assumption, which remains unvalidated.'
        : methanePhysical
          ? 'The Carbon Majors matrix covers fossil producers rather than rice cultivation. A compatible model must translate the rice GWP* global response into local daily hazards before any endpoint can run.'
          : 'A compatible source-removal climate response is required first.',
    },
    humanEndpointStage: {
      status: matchedHumanEndpoint
        ? 'matched_source_removal_human_endpoint_complete_axis_mapping_and_ecosystem_pending'
        : sourceHeatSensitivity
          ? 'source_specific_nonlinear_endpoint_sensitivity_run_pattern_validation_pending'
        : 'blocked_by_prior_stage',
      reference: matchedHumanEndpoint
        ? europeTemperatureMortalitySourceRemovalEndpoint.version
        : sourceHeatSensitivity ? heatSensitivity.version : null,
      equation: sourceHeatSensitivity ? mortality.tulipUse.matchedSourceEndpointEquation : null,
      sensitivity: sourceHeatSensitivity ? {
        sourceGas: sourceHeatSensitivity.source_gas,
        physicalResponseBasis: sourceHeatSensitivity.response_basis,
        cumulativeGmstScreenC2022: sourceHeatSensitivity.cumulative_gmst_screen_c_2022,
        publicSampleRegions: heatSensitivity.inputCounts.regions,
        patternCases: sourceHeatSensitivity.sensitivity.map(item => ({
          patternScale: item.pattern_scale,
          localUniformShiftC: item.local_uniform_shift_c,
          sourceAttributableHeatDeaths: item.source_attributable_heat_deaths,
        })),
      } : null,
      matchedEndpoint: matchedHumanEndpoint ? {
        status: matchedHumanEndpoint.admissionDecision.status,
        sourceGas: matchedHumanEndpoint.gas,
        physicalResponseBasis: matchedHumanEndpoint.physicalResponseBasis,
        sourceHistoryPeriod: matchedHumanEndpoint.sourceHistoryPeriod,
        pattern: matchedHumanEndpoint.pattern,
        physicalCases: matchedHumanEndpoint.physicalCases.map(physicalCase => ({
          physicalCase: physicalCase.physicalCase,
          interpretation: physicalCase.interpretation,
          windows: physicalCase.windows,
        })),
        axesAdmitted: matchedHumanEndpoint.admissionDecision.axesAdmitted,
        scoresChanged: matchedHumanEndpoint.admissionDecision.scoresChanged,
      } : null,
      limitation: matchedHumanEndpoint
        ? 'The matched source-removal human endpoint covers all 971 response regions, 2000–2022, three separate physical-response cases and all 100 fixed epidemiological bootstrap fits. It still requires reviewed mapping to the human axes and a compatible ecosystem endpoint or structural exclusion before a rating can change.'
        : sourceHeatSensitivity
          ? 'The node-specific nonlinear endpoint has run, but the uniform local temperature shifts are unvalidated sensitivity assumptions. The public model contains 103 sample regions rather than the paper’s full 823-region dataset and no uncertainty has been propagated.'
        : 'The endpoint cannot run until the source-removal climate and hazard stages exist.',
      regionalPatternDataGap: sourceHeatSensitivity ? {
        requiredInputs: europeMortality.endpoint2024.reproducibility.regionalPatternAvailability.requiredForSourceRemoval,
        regionLevelWarmingFactorsPublished: europeMortality.endpoint2024.reproducibility.regionalPatternAvailability.regionLevelWarmingFactorsPublished,
        regionLevelWarmingConfidenceBoundsPublished: europeMortality.endpoint2024.reproducibility.regionalPatternAvailability.regionLevelWarmingConfidenceBoundsPublished,
        implication: europeMortality.endpoint2024.reproducibility.regionalPatternAvailability.implication,
        reconstructionStatus: regionalPatternPlan.status,
        validationRequests: regionalPatternPlan.era5LandRetrieval.stage1ValidationRequests.length,
        historicalRequests: regionalPatternPlan.era5LandRetrieval.stage2HistoricalRequests.length,
        candidateFullRegionUniverse: regionalPatternPlan.fullRegionUniverse.regions,
        latestPopulationObservedRegions: regionalPatternPlan.populationPanel.latestYearObservedRegions,
        latestPopulationMissingRegions: regionalPatternPlan.populationPanel.latestYearMissingRegions,
        officialUkMidyearSensitivityRegions: regionalPatternPlan.populationPanel.boundarySupplement.officialUkMidyearSensitivityRegions,
        directOldBoundaryLauAggregateRegions: regionalPatternPlan.populationPanel.boundarySupplement.directLauAggregateRegions,
        lauPopulationFieldValidatedByEurostat: regionalPatternPlan.populationPanel.boundarySupplement.lauPopulationField.validatedByEurostat,
        proportionalMergeSensitivityRegions: regionalPatternPlan.populationPanel.boundarySupplement.proportionalMergeSensitivityRegions,
        promotionBoundary: regionalPatternPlan.acceptanceCriteria.promotion,
        openArcoEra5Fallback: {
          version: arcoEra5Crosscheck.version,
          status: arcoEra5Crosscheck.status,
          matchedRegions: arcoEra5Crosscheck.results.heldOutWeeklyAnomalies.matchedRegions,
          medianAbsoluteErrorC: arcoEra5Crosscheck.results.heldOutWeeklyAnomalies.medianAbsoluteErrorC,
          p95AbsoluteErrorC: arcoEra5Crosscheck.results.heldOutWeeklyAnomalies.p95AbsoluteErrorC,
          pearsonCorrelation: arcoEra5Crosscheck.results.heldOutWeeklyAnomalies.pearsonCorrelation,
          admissionStatus: arcoEra5Crosscheck.decision.admissionStatus,
        },
        openAwsEra5Fallback: {
          version: awsEra5Crosscheck.version,
          status: awsEra5Crosscheck.status,
          matchedRegions: awsEra5Crosscheck.results.heldOutWeeklyAnomalies.matchedRegions,
          medianAbsoluteErrorC: awsEra5Crosscheck.results.heldOutWeeklyAnomalies.medianAbsoluteErrorC,
          p95AbsoluteErrorC: awsEra5Crosscheck.results.heldOutWeeklyAnomalies.p95AbsoluteErrorC,
          pearsonCorrelation: awsEra5Crosscheck.results.heldOutWeeklyAnomalies.pearsonCorrelation,
          methodSensitivities: awsEra5Crosscheck.results.methodSensitivities,
          admissionStatus: awsEra5Crosscheck.decision.admissionStatus,
        },
        openMeteoEra5LandMirror: {
          version: openMeteoEra5LandCrosscheck.version,
          status: openMeteoEra5LandCrosscheck.status,
          selectedConfiguration: openMeteoEra5LandCrosscheck.method.selectedConfiguration,
          matchedRegions: openMeteoEra5LandCrosscheck.results.absoluteTemperatures.matchedRegions,
          absoluteTemperatures: openMeteoEra5LandCrosscheck.results.absoluteTemperatures,
          heldOutWeeklyAnomalies: openMeteoEra5LandCrosscheck.results.heldOutWeeklyAnomalies,
          admissionStatus: openMeteoEra5LandCrosscheck.decision.admissionStatus,
          nextGate: openMeteoEra5LandCrosscheck.decision.nextGate,
        },
        candidateIndependentEuropeanEndpointBridge: humanEndpointBridgeEligible ? {
          version: europeTemperatureMortalityBridge.version,
          status: europeTemperatureMortalityBridge.status,
          responsePanelYears: europeTemperatureMortalityBridge.coverage.responsePanelYears,
          dailyTemperatureYears: europeTemperatureMortalityBridge.coverage.dailyTemperatureYears,
          fullPanelRows: europeTemperatureMortalityBridge.counts.fullPanelRows,
          dailyTemperatureRows: europeTemperatureMortalityBridge.counts.dailyTemperatureRows,
          parquetFilesAudited: europeTemperatureMortalityBridge.counts.parquetFilesAudited,
          completeFileChecksums: europeTemperatureMortalityBridge.counts.completeFileChecksums,
          fullDataChecksumAudit: europeTemperatureMortalityBridge.fullDataChecksumAudit,
          coverageEnumeration: europeTemperatureMortalityBridge.coverageEnumeration,
          exactRegionCounts: europeTemperatureMortalityBridge.coverage.exactRegionCounts,
          responseRegionsWithEveryObservedYear: europeTemperatureMortalityBridge.coverage.responseRegionsWithEveryObservedYear,
          integrityBoundary: europeTemperatureMortalityBridge.finding.integrityBoundary,
          pooledModelReproduction: {
            version: europeTemperatureMortalityPooledModel.version,
            status: europeTemperatureMortalityPooledModel.status,
            modelRows: europeTemperatureMortalityPooledModel.model.panel.modelRows,
            modelRank: europeTemperatureMortalityPooledModel.model.fit.rank,
            minimumMortalityTemperatureC: europeTemperatureMortalityPooledModel.model.fit.minimumMortalityTemperatureOnIntegerMinus50To50Grid,
            crossRuntimeStatus: europeTemperatureMortalityPooledModel.model.crossRuntimeValidation.status,
            maximumCoefficientRelativeDifference: europeTemperatureMortalityPooledModel.model.crossRuntimeValidation.maximumCoefficientRelativeDifference,
            admissionDecision: europeTemperatureMortalityPooledModel.admissionDecision,
          },
          attributionReproduction: {
            version: europeTemperatureMortalityAttribution.version,
            status: europeTemperatureMortalityAttribution.status,
            minimumMortalityTemperatureC: europeTemperatureMortalityAttribution.observedTemperature.minimumMortalityTemperatureC,
            matchedDailyRows: europeTemperatureMortalityAttribution.coverage.matchedDailyTemperatureRows,
            matchedTemperatureBinRows: europeTemperatureMortalityAttribution.coverage.matchedTemperatureBinRows,
            matchedDailyMinusBinnedDayCount: europeTemperatureMortalityAttribution.coverage.matchedDailyMinusBinnedDayCount,
            averageAnnualFactualTemperatureDeaths: europeTemperatureMortalityAttribution.attribution.averageAnnualTotal,
            personDayBinApproximation: europeTemperatureMortalityAttribution.attribution.personDayTotal,
            authorOutputsCompared: europeTemperatureMortalityAttribution.validation.authorOutputsCompared,
            admissionDecision: europeTemperatureMortalityAttribution.admissionDecision,
          },
          sourceRemovalPatternScreen: {
            version: europeTemperatureMortalityPatternScreen.version,
            status: europeTemperatureMortalityPatternScreen.status,
            fittedRegions: europeTemperatureMortalityPatternScreen.coverage.fittedRegions,
            fittedRegionYears: europeTemperatureMortalityPatternScreen.coverage.fittedRegionYears,
            negativeFullPeriodSlopes: europeTemperatureMortalityPatternScreen.diagnostics.negativeFullPeriodSlopes,
            rSquaredBelowPointTwo: europeTemperatureMortalityPatternScreen.diagnostics.rSquaredBelowPointTwo,
            splitHalfOppositeSigns: europeTemperatureMortalityPatternScreen.diagnostics.splitHalfOppositeSigns,
            medianSplitHalfAbsoluteSlopeDifference: europeTemperatureMortalityPatternScreen.diagnostics.splitHalfAbsoluteSlopeDifference.median,
            admissionDecision: europeTemperatureMortalityPatternScreen.decision,
          },
          regionalBoundaryCrosswalk: {
            version: europeTemperatureMortalityRegionalBoundaries.version,
            status: europeTemperatureMortalityRegionalBoundaries.status,
            resolvedRegions: europeTemperatureMortalityRegionalBoundaries.coverage.resolvedRegions,
            sourceReleaseCounts: europeTemperatureMortalityRegionalBoundaries.coverage.sourceReleaseCounts,
            topologyRepairs: europeTemperatureMortalityRegionalBoundaries.coverage.topologyRepairs,
            geometrySha256: europeTemperatureMortalityRegionalBoundaries.geometryOutput.sha256,
            admissionDecision: europeTemperatureMortalityRegionalBoundaries.decision,
          },
          longRecordPreparation: {
            retrievalPlan: {
              version: europeTemperatureMortalityLongRecordPlan.version,
              status: europeTemperatureMortalityLongRecordPlan.status,
              spatialChunkKeys: europeTemperatureMortalityLongRecordPlan.sparsePlan.spatialChunkKeys,
              totalRangeChunks: europeTemperatureMortalityLongRecordPlan.sparsePlan.totalRangeChunks,
              estimatedTransferBytes: europeTemperatureMortalityLongRecordPlan.sparsePlan.estimatedTransferBytes,
              avoidedBoundingBoxFraction: europeTemperatureMortalityLongRecordPlan.sparsePlan.fullBoundingBox.avoidedFraction,
              admissionDecision: europeTemperatureMortalityLongRecordPlan.decision,
            },
            areaWeights: {
              version: europeTemperatureMortalityAreaWeights.version,
              status: europeTemperatureMortalityAreaWeights.status,
              candidateGridCells: europeTemperatureMortalityAreaWeights.coverage.candidateGridCells,
              weightedGridCells: europeTemperatureMortalityAreaWeights.coverage.weightedGridCells,
              cellRegionIntersections: europeTemperatureMortalityAreaWeights.coverage.cellRegionIntersections,
              regionsWithoutWeights: europeTemperatureMortalityAreaWeights.coverage.regionsWithoutWeights,
              logicalSha256: europeTemperatureMortalityAreaWeights.weightsOutput.logicalSha256,
              admissionDecision: europeTemperatureMortalityAreaWeights.decision,
            },
            execution: {
              version: europeTemperatureMortalityLongRecordRetrieval.version,
              status: europeTemperatureMortalityLongRecordRetrieval.status,
              completedYears: europeTemperatureMortalityLongRecordRetrieval.execution.completedYears,
              completedYearCount: europeTemperatureMortalityLongRecordRetrieval.execution.completedYearCount,
              regionYearRows: europeTemperatureMortalityLongRecordRetrieval.execution.regionYearRows,
              remainingYears: europeTemperatureMortalityLongRecordRetrieval.execution.remainingYears.length,
              cacheAllocatedBytesObserved: europeTemperatureMortalityLongRecordRetrieval.execution.cacheAllocatedBytesObserved,
              admissionDecision: europeTemperatureMortalityLongRecordRetrieval.decision,
            },
            ...(europeTemperatureMortalityLongRecordPatternAnalysis ? {
              patternAnalysis: {
                version: europeTemperatureMortalityLongRecordPatternAnalysis.version,
                status: europeTemperatureMortalityLongRecordPatternAnalysis.status,
                responseRegions: europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.responseRegions,
                responseRegionYears: europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.responseRegionYears,
                negativeFullPeriodSlopes: europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.negativeFullPeriodSlopes,
                rSquaredBelowPointTwo: europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.rSquaredBelowPointTwo,
                splitOppositeSigns: europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.splitOppositeSigns,
                admissionDecision: europeTemperatureMortalityLongRecordPatternAnalysis.decision,
              },
            } : {}),
            ...(monthlyIndependentPatternSummary ? {
              monthlyIndependentPatternAnalysis: monthlyIndependentPatternSummary,
            } : {}),
            ...(exactWeekIndependentPatternSummary ? {
              exactWeekIndependentPatternAnalysis: exactWeekIndependentPatternSummary,
            } : {}),
            ...(regionalPatternPromotionSummary ? {
              regionalPatternPromotion: regionalPatternPromotionSummary,
            } : {}),
            ...(matchedHumanEndpoint ? {
              matchedSourceRemovalHumanEndpoint: {
                version: europeTemperatureMortalitySourceRemovalEndpoint.version,
                status: europeTemperatureMortalitySourceRemovalEndpoint.status,
                coverage: europeTemperatureMortalitySourceRemovalEndpoint.coverage,
                humanEndpointCompleted: true,
                admissionDecision: matchedHumanEndpoint.admissionDecision,
              },
            } : {}),
          },
          admissionStatus: europeTemperatureMortalityBridge.admissionDecision.status,
          nextGate: europeTemperatureMortalityLongRecordNextGate,
        } : null,
      } : null,
    },
    ecosystemEndpointStage: {
      status: 'counterfactual_framework_identified_paired_biodiversity_output_unavailable',
      reference: ecosystemCounterfactualInventory.source.biodiversityDoi?.doi ?? null,
      inventoryVersion: ecosystemCounterfactualInventory.version,
      factualDatasets: ecosystemCounterfactualInventory.counts.terrestrialBiodiversityObservedClimateDatasets,
      counterfactualDatasets: ecosystemCounterfactualInventory.counts.terrestrialBiodiversityCounterfactualClimateDatasets,
      limitation: 'ISIMIP3a supplies factual terrestrial-biodiversity simulations but no matched counterclim biodiversity outputs. Heat mortality and paired biome-process runs cannot substitute for biodiversity condition, extent or recovery, and no result can be allocated to this source by emissions share.',
    },
    tulipAxisStage: {
      status: 'no_endpoint_based_axis_change',
      scoreEffect: 'none_candidate_value_grade_and_confidence_retained',
      reason: 'No TULIP source has yet completed both a matched human endpoint and a matched ecosystem endpoint, or a reviewed structural exclusion.',
    },
    nextAction: sourceHeatSensitivity
      ? humanEndpointBridgeEligible
        ? europeTemperatureMortalityLongRecordNextGate
        : 'Obtain or recreate the full regional inputs, validate source-removal weekly temperature patterns for the same regions, propagate physical and epidemiological uncertainty, and reproduce the calculation independently.'
      : historyBoundaryAudit
        ? historyBoundaryAudit.nextRequiredData
      : physicalReady
        ? row.requiredNextEvidence[0]
      : row.requiredNextEvidence[0],
  };
}).sort((left, right) => left.nodeId.localeCompare(right.nodeId));

assert.equal(rows.length, 28);
assert.equal(new Set(rows.map(row => row.nodeId)).size, 28);
assert.equal(rows.filter(row => ['published_arithmetic_reproduced_partial_history', 'published_gwp_star_reproduced_partial_history'].includes(row.physicalStage.status)).length, 21);
assert.equal(
  rows.filter(row => row.humanEndpointStage.status === 'matched_source_removal_human_endpoint_complete_axis_mapping_and_ecosystem_pending').length,
  europeTemperatureMortalitySourceRemovalEndpoint ? 21 : 0,
);
assert.equal(
  rows.filter(row => row.humanEndpointStage.status === 'source_specific_nonlinear_endpoint_sensitivity_run_pattern_validation_pending').length,
  europeTemperatureMortalitySourceRemovalEndpoint ? 0 : 21,
);
assert(rows.every(row => row.tulipAxisStage.status === 'no_endpoint_based_axis_change'));
assert(rows.every(row => row.retainedCandidate.confidence === 'D'));

const counts = {
  emissionSourceNodes: rows.length,
  numericalCandidatesRetained: rows.filter(row => Number.isFinite(row.retainedCandidate.value)).length,
  sourceSpecificAnnualMassFlows: allocation.counts.sourceSpecificAnnualMassFlows,
  cumulativeCo2PhysicalScreens: allocation.counts.cumulativeCo2PhysicalScreens,
  publishedPhysicalArithmeticValidated: rows.filter(row => ['published_arithmetic_reproduced_partial_history', 'published_gwp_star_reproduced_partial_history'].includes(row.physicalStage.status)).length,
  annualPhysicalResponseSeries: rows.filter(row => row.physicalStage.annualSeries?.status?.startsWith('validated_')).length,
  annualPhysicalResponseRecords: rows.reduce((sum, row) => sum + (row.physicalStage.annualSeries?.records ?? 0), 0),
  publishedHeatHazardMatricesIngested: 1,
  publishedHeatHazardEvents: carbonHazard.coverage.events,
  publishedHeatHazardEmitters: carbonHazard.coverage.carbonMajors,
  publishedHeatHazardEmitterEventPairs: carbonHazard.coverage.emitterEventPairs,
  openHeatHazardMethodIdentified: rows.filter(row => row.heatHazardStage.status === 'published_hazard_matrix_ingested_tulip_source_crosswalk_not_run').length,
  sharedHumanEndpointAlgorithmReproduced: 1,
  sourceSpecificNonlinearHumanEndpointSensitivityNodes: heatSensitivity.results.length,
  sourceSpecificNonlinearHumanEndpointSensitivityCo2Nodes: heatSensitivity.inputCounts.co2_source_nodes,
  sourceSpecificNonlinearHumanEndpointSensitivityMethaneNodes: heatSensitivity.inputCounts.methane_source_nodes,
  sourceSpecificNonlinearHumanEndpointSensitivityCases: heatSensitivity.results.reduce((sum, row) => sum + row.sensitivity.length, 0),
  sourceSpecificNonlinearHumanEndpointPublicSampleRegions: heatSensitivity.inputCounts.regions,
  sourceHistoryBoundaryAudits: sourceHistoryFeasibility.rows.length,
  sourceHistoriesAdmittedByBoundaryAudit: sourceHistoryFeasibility.counts.nodeSpecificHistoriesAdmitted,
  independentHumanEndpointBridgeCandidates: europeTemperatureMortalityBridge.counts.affectedEmissionSourceNodes,
  independentHumanEndpointBridgeAxesAdmitted: europeTemperatureMortalityBridge.counts.axesAdmitted,
  independentHumanEndpointBridgeScoreChanges: europeTemperatureMortalityBridge.counts.scoresChanged,
  independentHumanEndpointBridgeResponseRegions: europeTemperatureMortalityBridge.coverage.exactRegionCounts.responsePanel,
  independentHumanEndpointBridgeResponseRegionsWithEveryObservedYear: europeTemperatureMortalityBridge.coverage.responseRegionsWithEveryObservedYear,
  independentHumanEndpointPooledModelReproductions: europeTemperatureMortalityPooledModel.model.crossRuntimeValidation.status === 'passed_python_numpy_vs_base_r' ? 1 : 0,
  independentHumanEndpointPooledModelRows: europeTemperatureMortalityPooledModel.model.panel.modelRows,
  independentHumanEndpointPooledModelAxesAdmitted: europeTemperatureMortalityPooledModel.admissionDecision.axesAdmitted,
  independentHumanEndpointPooledModelScoreChanges: europeTemperatureMortalityPooledModel.admissionDecision.scoresChanged,
  independentHumanEndpointAttributionReproductions: europeTemperatureMortalityAttribution.status === 'pooled_factual_temperature_mortality_attribution_internally_reproduced_not_independently_validated' ? 1 : 0,
  independentHumanEndpointAttributionMatchedDailyRows: europeTemperatureMortalityAttribution.coverage.matchedDailyTemperatureRows,
  independentHumanEndpointAttributionMatchedBinRows: europeTemperatureMortalityAttribution.coverage.matchedTemperatureBinRows,
  independentHumanEndpointAttributionAxesAdmitted: europeTemperatureMortalityAttribution.admissionDecision.axesAdmitted,
  independentHumanEndpointAttributionScoreChanges: europeTemperatureMortalityAttribution.admissionDecision.scoresChanged,
  independentHumanEndpointSourceRemovalPatternScreens: 1,
  independentHumanEndpointSourceRemovalPatternScreenRegions: europeTemperatureMortalityPatternScreen.coverage.fittedRegions,
  independentHumanEndpointSourceRemovalPatternScreenAxesAdmitted: europeTemperatureMortalityPatternScreen.decision.axesAdmitted,
  independentHumanEndpointSourceRemovalPatternScreenScoreChanges: europeTemperatureMortalityPatternScreen.decision.scoresChanged,
  independentHumanEndpointRegionalBoundaryCrosswalks: 1,
  independentHumanEndpointRegionalBoundaryCrosswalkRegions: europeTemperatureMortalityRegionalBoundaries.coverage.resolvedRegions,
  independentHumanEndpointRegionalBoundaryCrosswalkAxesAdmitted: europeTemperatureMortalityRegionalBoundaries.decision.axesAdmitted,
  independentHumanEndpointRegionalBoundaryCrosswalkScoreChanges: europeTemperatureMortalityRegionalBoundaries.decision.scoresChanged,
  independentHumanEndpointLongRecordRetrievalPlans: 1,
  independentHumanEndpointLongRecordEstimatedTransferLowerBytes: europeTemperatureMortalityLongRecordPlan.sparsePlan.estimatedTransferBytes.lowerAtOneKiBPerChunk,
  independentHumanEndpointLongRecordEstimatedTransferUpperBytes: europeTemperatureMortalityLongRecordPlan.sparsePlan.estimatedTransferBytes.upperAtFourKiBPerChunk,
  independentHumanEndpointRegionalAreaWeightSets: 1,
  independentHumanEndpointRegionalAreaWeightedGridCells: europeTemperatureMortalityAreaWeights.coverage.weightedGridCells,
  independentHumanEndpointRegionalAreaWeightIntersections: europeTemperatureMortalityAreaWeights.coverage.cellRegionIntersections,
  independentHumanEndpointRegionalAreaWeightAxesAdmitted: europeTemperatureMortalityAreaWeights.decision.axesAdmitted,
  independentHumanEndpointRegionalAreaWeightScoreChanges: europeTemperatureMortalityAreaWeights.decision.scoresChanged,
  independentHumanEndpointLongRecordRetrievalExecutions: 1,
  independentHumanEndpointLongRecordCompletedYears: europeTemperatureMortalityLongRecordRetrieval.execution.completedYearCount,
  independentHumanEndpointLongRecordRegionYearRows: europeTemperatureMortalityLongRecordRetrieval.execution.regionYearRows,
  independentHumanEndpointLongRecordExecutionAxesAdmitted: europeTemperatureMortalityLongRecordRetrieval.decision.axesAdmitted,
  independentHumanEndpointLongRecordExecutionScoreChanges: europeTemperatureMortalityLongRecordRetrieval.decision.scoresChanged,
  independentHumanEndpointLongRecordPatternAnalyses: europeTemperatureMortalityLongRecordPatternAnalysis ? 1 : 0,
  independentHumanEndpointLongRecordPatternAnalysisRegions: europeTemperatureMortalityLongRecordPatternAnalysis?.diagnostics.responseRegions ?? 0,
  independentHumanEndpointLongRecordPatternAnalysisRegionYears: europeTemperatureMortalityLongRecordPatternAnalysis?.diagnostics.responseRegionYears ?? 0,
  independentHumanEndpointLongRecordPatternAnalysisAxesAdmitted: europeTemperatureMortalityLongRecordPatternAnalysis?.decision.axesAdmitted ?? 0,
  independentHumanEndpointLongRecordPatternAnalysisScoreChanges: europeTemperatureMortalityLongRecordPatternAnalysis?.decision.scoresChanged ?? 0,
  independentHumanEndpointMonthlyPatternAnalyses: pangeoIndependentPatternAnalysis ? 1 : 0,
  independentHumanEndpointMonthlyPatternModels: pangeoIndependentPatternAnalysis?.counts.models ?? 0,
  independentHumanEndpointMonthlyPatternInstitutions: pangeoIndependentPatternAnalysis?.counts.institutions ?? 0,
  independentHumanEndpointMonthlyPatternRegionFits: pangeoIndependentPatternAnalysis?.counts.modelRegionFits ?? 0,
  independentHumanEndpointMonthlyPatternComparisonComplete:
    pangeoIndependentPatternAnalysis?.comparison.status === 'monthly_independent_pattern_tests_complete_exact_week_challenge_pending' ? 1 : 0,
  independentHumanEndpointMonthlyPatternTestsPassed: pangeoIndependentPatternAnalysis?.comparison.monthlyTestsPassed ?? null,
  independentHumanEndpointExactWeekPatternAnalyses: nasaExactWeekIndependentPatternAnalysis ? 1 : 0,
  independentHumanEndpointExactWeekPatternModels: nasaExactWeekIndependentPatternAnalysis?.counts.models ?? 0,
  independentHumanEndpointExactWeekPatternInstitutions: nasaExactWeekIndependentPatternAnalysis?.counts.institutions ?? 0,
  independentHumanEndpointExactWeekPatternRegionFits: nasaExactWeekIndependentPatternAnalysis?.counts.modelRegionFits ?? 0,
  independentHumanEndpointExactWeekPatternComparisonComplete:
    nasaExactWeekIndependentPatternAnalysis?.comparison.status === 'exact_week_independent_pattern_tests_complete' ? 1 : 0,
  independentHumanEndpointExactWeekPatternTestsPassed: nasaExactWeekIndependentPatternAnalysis?.comparison.exactWeekTestsPassed ?? null,
  independentHumanEndpointRegionalPatternPromotionDecisions: europeTemperatureMortalityPatternPromotion ? 1 : 0,
  independentHumanEndpointRegionalPatternFrozenTests: europeTemperatureMortalityPatternPromotion?.counts.frozenTests ?? 0,
  independentHumanEndpointRegionalPatternPassedTests: europeTemperatureMortalityPatternPromotion?.counts.passedTests ?? 0,
  independentHumanEndpointRegionalPatternFailedTests: europeTemperatureMortalityPatternPromotion?.counts.failedTests ?? 0,
  independentHumanEndpointRegionalPatternPromoted:
    europeTemperatureMortalityPatternPromotion?.decision.patternInputAdmittedToMatchedEndpoint ?? null,
  independentOpenReanalysisFallbacksTested: 3,
  independentOpenReanalysisFallbacksAdmitted: 1,
  publishedEcosystemCounterfactualFrameworksIdentified: 1,
  publishedTerrestrialBiodiversityFactualDatasets: ecosystemCounterfactualInventory.counts.terrestrialBiodiversityObservedClimateDatasets,
  publishedTerrestrialBiodiversityCounterfactualDatasets: ecosystemCounterfactualInventory.counts.terrestrialBiodiversityCounterfactualClimateDatasets,
  publishedPairedBiomeObservedClimateDatasets: ecosystemCounterfactualInventory.counts.biomesObservedClimateDatasets,
  publishedPairedBiomeCounterfactualClimateDatasets: ecosystemCounterfactualInventory.counts.biomesCounterfactualClimateDatasets,
  nodeSpecificMatchedHumanEndpoints: europeTemperatureMortalitySourceRemovalEndpoint?.coverage.sourceNodes ?? 0,
  nodeSpecificMatchedEcosystemEndpoints: 0,
  endpointBasedRatingChanges: 0,
};

const regionalPatternEvidenceState = europeTemperatureMortalitySourceRemovalEndpoint
  ? `The independently admitted ERA5-Land pattern has been propagated through all ${europeTemperatureMortalitySourceRemovalEndpoint.coverage.sourceNodes} compatible source histories, ${europeTemperatureMortalitySourceRemovalEndpoint.coverage.regions} regions, ${europeTemperatureMortalitySourceRemovalEndpoint.coverage.observedYears.length} observed years, three separate physical-response cases and all ${europeTemperatureMortalitySourceRemovalEndpoint.coverage.bootstrapFits} fixed epidemiological bootstrap fits. The matched human endpoint is complete; axis mapping and a compatible ecosystem endpoint remain.`
  : europeTemperatureMortalityPatternPromotion
  ? europeTemperatureMortalityPatternPromotion.decision.patternInputAdmittedToMatchedEndpoint
    ? `All ${europeTemperatureMortalityPatternPromotion.counts.frozenTests} independent monthly and exact-week comparison tests passed, so the ERA5-Land regional slopes may enter the matched endpoint. They have not yet been propagated through every compatible source history and all 100 mortality bootstrap fits.`
    : `${europeTemperatureMortalityPatternPromotion.counts.failedTests} of ${europeTemperatureMortalityPatternPromotion.counts.frozenTests} independent monthly and exact-week comparison tests failed, so the ERA5-Land regional slopes remain excluded from source attribution and the family-calibrated candidates are retained.`
  : nasaExactWeekIndependentPatternAnalysis
    ? `The ${nasaExactWeekIndependentPatternAnalysis.counts.models}-model exact-week ensemble is complete. The route remains outside source calibration until its ERA5-Land comparison and the frozen promotion decision are complete.`
    : pangeoIndependentPatternAnalysis
      ? `The ${pangeoIndependentPatternAnalysis.counts.models}-model, ${pangeoIndependentPatternAnalysis.counts.institutions}-institution monthly ensemble is complete. The route remains outside source calibration until ERA5-Land and the exact-week challenge complete the frozen comparison gate.`
      : 'The route remains outside source calibration until the predeclared 1950–2022 regional pattern is reconstructed and compared independently.';

const evidenceGates = [
  {
    gate: 'published endpoint equation',
    status: 'passed_on_authors_example',
    evidence: `${mortality.reproduction.inputs.cities} hypothetical cities, ${mortality.reproduction.monteCarloIterations} Monte Carlo iterations and ${mortality.reproduction.climateModels.length} climate models reproduced from the pinned repository.`,
  },
  {
    gate: 'source-specific climate response',
    status: 'partial_for_21_nodes',
    evidence: 'Twenty CO2 nodes reproduce 1,649 annual emissions-to-GMST records across their declared source periods. Rice methane adds 33 path-dependent GWP* response records from 1992–2024. All are global physical screens; local daily source-removal temperatures are still missing.',
  },
  {
    gate: 'source-to-heat-hazard crosswalk',
    status: 'published_matrix_ingested_crosswalk_pending',
    evidence: `The official supplementary workbook is checksum pinned and contains ${carbonHazard.coverage.emitterEventPairs.toLocaleString('en-US')} intensity and probability records across ${carbonHazard.coverage.events} heatwave events and ${carbonHazard.coverage.carbonMajors} carbon majors. Its actor boundaries do not directly match TULIP sectors.`,
  },
  {
    gate: 'matched current human endpoint',
    status: europeTemperatureMortalitySourceRemovalEndpoint
      ? 'matched_source_removal_endpoint_complete_axis_mapping_and_ecosystem_pending'
      : 'factual_attribution_reproduced_source_removal_not_passed',
    evidence: `Twenty CO2 histories and the rice-methane GWP* response run through a nonlinear current-period heat-mortality sensitivity under four declared temperature-pattern cases. A 0.1-degree ERA5-Land mirror reproduces the full 103-region public Italian factual-temperature sample within every predeclared tolerance. The broader ${europeTemperatureMortalityPooledModel.model.panel.modelRows.toLocaleString('en-US')}-row European pooled model is reproduced independently in Python and base R, including all ${europeTemperatureMortalityPooledModel.model.bootstrap.iterations} seed-${europeTemperatureMortalityPooledModel.model.bootstrap.seed} spatial bootstrap fits. Its factual-temperature endpoint now reconciles ${europeTemperatureMortalityAttribution.coverage.matchedDailyTemperatureRows.toLocaleString('en-US')} matched daily rows exactly with the person-day bin file and reproduces hot/cold mortality attribution at a ${europeTemperatureMortalityAttribution.observedTemperature.minimumMortalityTemperatureC} °C minimum-mortality temperature. A short-record source-removal pattern screen fitted all ${europeTemperatureMortalityPatternScreen.coverage.fittedRegions.toLocaleString('en-US')} response regions but was rejected: ${europeTemperatureMortalityPatternScreen.diagnostics.negativeFullPeriodSlopes} slopes were negative, ${europeTemperatureMortalityPatternScreen.diagnostics.rSquaredBelowPointTwo} fits had R² below 0.2 and ${europeTemperatureMortalityPatternScreen.diagnostics.splitHalfOppositeSigns} reversed sign between half-periods. ${regionalPatternEvidenceState} Author-output comparison and a separate ecosystem endpoint also remain.`,
    exactDataGap: europeMortality.endpoint2024.reproducibility.regionalPatternAvailability,
    reconstructionPlan: {
      version: regionalPatternPlan.version,
      status: regionalPatternPlan.status,
      validationRegions: regionalPatternPlan.inputAudit.publicSample.regions,
      validationRequests: regionalPatternPlan.era5LandRetrieval.stage1ValidationRequests.length,
      historicalRequests: regionalPatternPlan.era5LandRetrieval.stage2HistoricalRequests.length,
      candidateFullRegionUniverse: regionalPatternPlan.fullRegionUniverse.regions,
      latestPopulationObservedRegions: regionalPatternPlan.populationPanel.latestYearObservedRegions,
      latestPopulationMissingRegions: regionalPatternPlan.populationPanel.latestYearMissingRegions,
      officialUkMidyearSensitivityRegions: regionalPatternPlan.populationPanel.boundarySupplement.officialUkMidyearSensitivityRegions,
      directOldBoundaryLauAggregateRegions: regionalPatternPlan.populationPanel.boundarySupplement.directLauAggregateRegions,
      lauPopulationFieldValidatedByEurostat: regionalPatternPlan.populationPanel.boundarySupplement.lauPopulationField.validatedByEurostat,
      proportionalMergeSensitivityRegions: regionalPatternPlan.populationPanel.boundarySupplement.proportionalMergeSensitivityRegions,
      promotionBoundary: regionalPatternPlan.acceptanceCriteria.promotion,
      openArcoEra5Fallback: {
        version: arcoEra5Crosscheck.version,
        status: arcoEra5Crosscheck.status,
        absoluteTemperatures: arcoEra5Crosscheck.results.absoluteTemperatures,
        heldOutWeeklyAnomalies: arcoEra5Crosscheck.results.heldOutWeeklyAnomalies,
        admissionStatus: arcoEra5Crosscheck.decision.admissionStatus,
      },
      openAwsEra5Fallback: {
        version: awsEra5Crosscheck.version,
        status: awsEra5Crosscheck.status,
        absoluteTemperatures: awsEra5Crosscheck.results.absoluteTemperatures,
        heldOutWeeklyAnomalies: awsEra5Crosscheck.results.heldOutWeeklyAnomalies,
        methodSensitivities: awsEra5Crosscheck.results.methodSensitivities,
        admissionStatus: awsEra5Crosscheck.decision.admissionStatus,
      },
      openMeteoEra5LandMirror: {
        version: openMeteoEra5LandCrosscheck.version,
        status: openMeteoEra5LandCrosscheck.status,
        selectedConfiguration: openMeteoEra5LandCrosscheck.method.selectedConfiguration,
        absoluteTemperatures: openMeteoEra5LandCrosscheck.results.absoluteTemperatures,
        heldOutWeeklyAnomalies: openMeteoEra5LandCrosscheck.results.heldOutWeeklyAnomalies,
        admissionStatus: openMeteoEra5LandCrosscheck.decision.admissionStatus,
        nextGate: openMeteoEra5LandCrosscheck.decision.nextGate,
      },
      candidateIndependentEuropeanEndpointBridge: {
        version: europeTemperatureMortalityBridge.version,
        status: europeTemperatureMortalityBridge.status,
        affectedEmissionSourceNodes: europeTemperatureMortalityBridge.counts.affectedEmissionSourceNodes,
        parquetFilesAudited: europeTemperatureMortalityBridge.counts.parquetFilesAudited,
        completeFileChecksums: europeTemperatureMortalityBridge.counts.completeFileChecksums,
        fullDataChecksumAudit: europeTemperatureMortalityBridge.fullDataChecksumAudit,
        coverageEnumeration: europeTemperatureMortalityBridge.coverageEnumeration,
        exactRegionCounts: europeTemperatureMortalityBridge.coverage.exactRegionCounts,
        responseRegionsWithEveryObservedYear: europeTemperatureMortalityBridge.coverage.responseRegionsWithEveryObservedYear,
        responsePanelYears: europeTemperatureMortalityBridge.coverage.responsePanelYears,
        dailyTemperatureYears: europeTemperatureMortalityBridge.coverage.dailyTemperatureYears,
        boundary: europeTemperatureMortalityBridge.finding.boundary,
        integrityBoundary: europeTemperatureMortalityBridge.finding.integrityBoundary,
        pooledModelReproduction: {
          version: europeTemperatureMortalityPooledModel.version,
          status: europeTemperatureMortalityPooledModel.status,
          model: europeTemperatureMortalityPooledModel.model,
          admissionDecision: europeTemperatureMortalityPooledModel.admissionDecision,
        },
        attributionReproduction: {
          version: europeTemperatureMortalityAttribution.version,
          status: europeTemperatureMortalityAttribution.status,
          observedTemperature: europeTemperatureMortalityAttribution.observedTemperature,
          coverage: europeTemperatureMortalityAttribution.coverage,
          averageAnnualTotal: europeTemperatureMortalityAttribution.attribution.averageAnnualTotal,
          personDayTotal: europeTemperatureMortalityAttribution.attribution.personDayTotal,
          validation: europeTemperatureMortalityAttribution.validation,
          admissionDecision: europeTemperatureMortalityAttribution.admissionDecision,
        },
        sourceRemovalPatternScreen: {
          version: europeTemperatureMortalityPatternScreen.version,
          status: europeTemperatureMortalityPatternScreen.status,
          coverage: europeTemperatureMortalityPatternScreen.coverage,
          diagnostics: europeTemperatureMortalityPatternScreen.diagnostics,
          admissionDecision: europeTemperatureMortalityPatternScreen.decision,
        },
        regionalBoundaryCrosswalk: {
          version: europeTemperatureMortalityRegionalBoundaries.version,
          status: europeTemperatureMortalityRegionalBoundaries.status,
          coverage: europeTemperatureMortalityRegionalBoundaries.coverage,
          geometryOutput: europeTemperatureMortalityRegionalBoundaries.geometryOutput,
          admissionDecision: europeTemperatureMortalityRegionalBoundaries.decision,
        },
        longRecordRetrievalPlan: {
          version: europeTemperatureMortalityLongRecordPlan.version,
          status: europeTemperatureMortalityLongRecordPlan.status,
          scope: europeTemperatureMortalityLongRecordPlan.scope,
          sparsePlan: europeTemperatureMortalityLongRecordPlan.sparsePlan,
          admissionDecision: europeTemperatureMortalityLongRecordPlan.decision,
        },
        regionalAreaWeights: {
          version: europeTemperatureMortalityAreaWeights.version,
          status: europeTemperatureMortalityAreaWeights.status,
          method: europeTemperatureMortalityAreaWeights.method,
          coverage: europeTemperatureMortalityAreaWeights.coverage,
          weightsOutput: europeTemperatureMortalityAreaWeights.weightsOutput,
          admissionDecision: europeTemperatureMortalityAreaWeights.decision,
        },
        longRecordRetrieval: {
          version: europeTemperatureMortalityLongRecordRetrieval.version,
          status: europeTemperatureMortalityLongRecordRetrieval.status,
          execution: europeTemperatureMortalityLongRecordRetrieval.execution,
          output: europeTemperatureMortalityLongRecordRetrieval.output,
          admissionDecision: europeTemperatureMortalityLongRecordRetrieval.decision,
        },
        ...(europeTemperatureMortalityLongRecordPatternAnalysis ? {
          longRecordPatternAnalysis: {
            version: europeTemperatureMortalityLongRecordPatternAnalysis.version,
            status: europeTemperatureMortalityLongRecordPatternAnalysis.status,
            method: europeTemperatureMortalityLongRecordPatternAnalysis.method,
            diagnostics: europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics,
            admissionDecision: europeTemperatureMortalityLongRecordPatternAnalysis.decision,
          },
        } : {}),
        ...(monthlyIndependentPatternSummary ? {
          monthlyIndependentPatternAnalysis: monthlyIndependentPatternSummary,
        } : {}),
        ...(exactWeekIndependentPatternSummary ? {
          exactWeekIndependentPatternAnalysis: exactWeekIndependentPatternSummary,
        } : {}),
        ...(regionalPatternPromotionSummary ? {
          regionalPatternPromotion: regionalPatternPromotionSummary,
        } : {}),
        ...(europeTemperatureMortalitySourceRemovalEndpoint ? {
          matchedSourceRemovalHumanEndpoint: {
            version: europeTemperatureMortalitySourceRemovalEndpoint.version,
            status: europeTemperatureMortalitySourceRemovalEndpoint.status,
            coverage: europeTemperatureMortalitySourceRemovalEndpoint.coverage,
            admissionDecision: europeTemperatureMortalitySourceRemovalEndpoint.decision,
          },
        } : {}),
        admissionDecision: europeTemperatureMortalityBridge.admissionDecision,
      },
    },
  },
  {
    gate: 'matched ecosystem endpoint',
    status: 'not_passed',
    evidence: `The official ISIMIP3a repository supplies ${ecosystemCounterfactualInventory.counts.terrestrialBiodiversityObservedClimateDatasets} factual terrestrial-biodiversity datasets across ${ecosystemCounterfactualInventory.counts.terrestrialBiodiversityImpactModels} impact models and ${ecosystemCounterfactualInventory.counts.terrestrialBiodiversityVariables} taxon variables, but ${ecosystemCounterfactualInventory.counts.terrestrialBiodiversityCounterfactualClimateDatasets} matched counterclim biodiversity datasets. The ${ecosystemCounterfactualInventory.counts.biomesObservedClimateDatasets.toLocaleString('en-US')} obsclim and ${ecosystemCounterfactualInventory.counts.biomesCounterfactualClimateDatasets.toLocaleString('en-US')} counterclim biome datasets are ecosystem-process states, not interchangeable biodiversity endpoints or source-specific harm.`,
    exactDataGap: {
      inventoryVersion: ecosystemCounterfactualInventory.version,
      inventoryDigest: ecosystemCounterfactualInventory.digest,
      biodiversityObservedClimateDatasets: ecosystemCounterfactualInventory.counts.terrestrialBiodiversityObservedClimateDatasets,
      biodiversityCounterfactualClimateDatasets: ecosystemCounterfactualInventory.counts.terrestrialBiodiversityCounterfactualClimateDatasets,
      promotionGate: ecosystemCounterfactualInventory.evidenceDecision.promotionGate,
    },
  },
  {
    gate: 'rating calibration',
    status: 'not_changed',
    evidence: 'All 28 numerical candidates remain available at a glance and confidence D; no endpoint-free proportional shortcut changes a rating.',
  },
];

const payload = {
  version: 'tulip_internal_emission_source_endpoint_pilot_2026_09_26_v33',
  preparedOn: '2026-09-26',
  status: europeTemperatureMortalitySourceRemovalEndpoint
    ? 'twenty_co2_and_one_methane_matched_human_endpoints_complete_axis_mapping_and_ecosystem_endpoints_pending'
    : 'twenty_co2_and_one_methane_nonlinear_human_endpoint_sensitivities_complete_validation_and_ecosystem_endpoints_pending',
  productionRatingsEnabled: 0,
  purpose: 'Turn the 28 emission-source candidates into a staged, testable endpoint programme while preserving numerical ratings and preventing false source allocation.',
  inputs: {
    allocationVersion: allocation.version,
    allocationDigest: allocation.digest,
    warmingVersion: warming.version,
    warmingDigest: warming.digest,
    heatMortalityReferenceVersion: mortality.version,
    heatMortalityReferenceDigest: mortality.snapshotDigest,
    europeHeatMortalityReferenceVersion: europeMortality.version,
    europeHeatMortalityReferenceDigest: europeMortality.snapshotDigest,
    carbonMajorsHeatwaveReferenceVersion: carbonHazard.version,
    carbonMajorsHeatwaveReferenceDigest: carbonHazard.snapshotDigest,
    heatEndpointSensitivityVersion: heatSensitivity.version,
    heatEndpointSensitivityDigest: heatSensitivity.digest,
    regionalPatternPlanVersion: regionalPatternPlan.version,
    arcoEra5CrosscheckVersion: arcoEra5Crosscheck.version,
    arcoEra5CrosscheckDigest: arcoEra5Crosscheck.digest,
    awsEra5CrosscheckVersion: awsEra5Crosscheck.version,
    awsEra5CrosscheckDigest: awsEra5Crosscheck.digest,
    openMeteoEra5LandCrosscheckVersion: openMeteoEra5LandCrosscheck.version,
    openMeteoEra5LandCrosscheckDigest: openMeteoEra5LandCrosscheck.digest,
    ecosystemCounterfactualInventoryVersion: ecosystemCounterfactualInventory.version,
    ecosystemCounterfactualInventoryDigest: ecosystemCounterfactualInventory.digest,
    sourceHistoryFeasibilityVersion: sourceHistoryFeasibility.version,
    sourceHistoryFeasibilityDigest: sourceHistoryFeasibility.digest,
    europeTemperatureMortalityBridgeVersion: europeTemperatureMortalityBridge.version,
    europeTemperatureMortalityBridgeDigest: europeTemperatureMortalityBridge.digest,
    europeTemperatureMortalityPooledModelVersion: europeTemperatureMortalityPooledModel.version,
    europeTemperatureMortalityPooledModelDigest: europeTemperatureMortalityPooledModel.digest,
    europeTemperatureMortalityAttributionVersion: europeTemperatureMortalityAttribution.version,
    europeTemperatureMortalityAttributionDigest: europeTemperatureMortalityAttribution.digest,
    europeTemperatureMortalityPatternScreenVersion: europeTemperatureMortalityPatternScreen.version,
    europeTemperatureMortalityPatternScreenDigest: europeTemperatureMortalityPatternScreen.digest,
    europeTemperatureMortalityRegionalBoundariesVersion: europeTemperatureMortalityRegionalBoundaries.version,
    europeTemperatureMortalityRegionalBoundariesDigest: europeTemperatureMortalityRegionalBoundaries.digest,
    europeTemperatureMortalityLongRecordPlanVersion: europeTemperatureMortalityLongRecordPlan.version,
    europeTemperatureMortalityLongRecordPlanDigest: europeTemperatureMortalityLongRecordPlan.digest,
    europeTemperatureMortalityAreaWeightsVersion: europeTemperatureMortalityAreaWeights.version,
    europeTemperatureMortalityAreaWeightsDigest: europeTemperatureMortalityAreaWeights.digest,
    europeTemperatureMortalityLongRecordRetrievalVersion: europeTemperatureMortalityLongRecordRetrieval.version,
    europeTemperatureMortalityLongRecordRetrievalDigest: europeTemperatureMortalityLongRecordRetrieval.digest,
    ...(europeTemperatureMortalityLongRecordPatternAnalysis ? {
      europeTemperatureMortalityLongRecordPatternAnalysisVersion: europeTemperatureMortalityLongRecordPatternAnalysis.version,
      europeTemperatureMortalityLongRecordPatternAnalysisDigest: europeTemperatureMortalityLongRecordPatternAnalysis.digest,
    } : {}),
    ...(pangeoIndependentPatternAnalysis ? {
      pangeoIndependentPatternAnalysisVersion: pangeoIndependentPatternAnalysis.version,
      pangeoIndependentPatternAnalysisDigest: pangeoIndependentPatternAnalysis.digest,
    } : {}),
    ...(nasaExactWeekIndependentPatternAnalysis ? {
      nasaExactWeekIndependentPatternAnalysisVersion: nasaExactWeekIndependentPatternAnalysis.version,
      nasaExactWeekIndependentPatternAnalysisDigest: nasaExactWeekIndependentPatternAnalysis.digest,
    } : {}),
    ...(europeTemperatureMortalityPatternPromotion ? {
      europeTemperatureMortalityPatternPromotionVersion: europeTemperatureMortalityPatternPromotion.version,
      europeTemperatureMortalityPatternPromotionDigest: europeTemperatureMortalityPatternPromotion.digest,
    } : {}),
    ...(europeTemperatureMortalitySourceRemovalEndpoint ? {
      europeTemperatureMortalitySourceRemovalEndpointVersion: europeTemperatureMortalitySourceRemovalEndpoint.version,
      europeTemperatureMortalitySourceRemovalEndpointDigest: europeTemperatureMortalitySourceRemovalEndpoint.digest,
    } : {}),
  },
  counts,
  stageDefinitions,
  evidenceGates,
  formulas: {
    validHumanEndpoint: mortality.tulipUse.matchedSourceEndpointEquation,
    invalidShortcuts: prohibitedOperations,
    tulipRule: 'Only matched terminal outcomes may inform severity and reach; persistence requires endpoint duration or recovery evidence rather than the age of the emissions record.',
  },
  methodBoundary: {
    conclusion: 'The common method is a counterfactual chain, not a common multiplier. The chain can be shared across sources, while hazard and endpoint models remain outcome-specific.',
    tenCityMeaning: mortality.reproduction.resultInterpretation,
    carbonMajorsMeaning: carbonHazard.fields.interpretation,
    carbonMajorsWorkbookBoundary: carbonHazard.source.workbookDescriptionBoundary,
    numericalRatings: 'All 28 internal candidates remain present. This pilot improves provenance and identifies exact missing links; it does not replace a candidate with an empty state.',
    heatEndpointSensitivity: heatSensitivity.admissionDecision,
    regionalPatternFallbacks: [
      arcoEra5Crosscheck.decision,
      awsEra5Crosscheck.decision,
      openMeteoEra5LandCrosscheck.decision,
    ],
    independentHumanEndpointBridge: europeTemperatureMortalityBridge.admissionDecision,
    independentHumanEndpointPooledModel: europeTemperatureMortalityPooledModel.admissionDecision,
    independentHumanEndpointAttribution: europeTemperatureMortalityAttribution.admissionDecision,
    independentHumanEndpointSourceRemovalPatternScreen: europeTemperatureMortalityPatternScreen.decision,
    independentHumanEndpointRegionalBoundaryCrosswalk: europeTemperatureMortalityRegionalBoundaries.decision,
    independentHumanEndpointLongRecordRetrievalPlan: europeTemperatureMortalityLongRecordPlan.decision,
    independentHumanEndpointRegionalAreaWeights: europeTemperatureMortalityAreaWeights.decision,
    independentHumanEndpointLongRecordRetrieval: europeTemperatureMortalityLongRecordRetrieval.decision,
    ...(europeTemperatureMortalityLongRecordPatternAnalysis ? {
      independentHumanEndpointLongRecordPatternAnalysis: europeTemperatureMortalityLongRecordPatternAnalysis.decision,
    } : {}),
    ...(pangeoIndependentPatternAnalysis ? {
      independentHumanEndpointMonthlyPatternAnalysis: pangeoIndependentPatternAnalysis.decision,
    } : {}),
    ...(nasaExactWeekIndependentPatternAnalysis ? {
      independentHumanEndpointExactWeekPatternAnalysis: nasaExactWeekIndependentPatternAnalysis.decision,
    } : {}),
    ...(europeTemperatureMortalityPatternPromotion ? {
      independentHumanEndpointRegionalPatternPromotion: europeTemperatureMortalityPatternPromotion.decision,
    } : {}),
    ...(europeTemperatureMortalitySourceRemovalEndpoint ? {
      independentHumanEndpointMatchedSourceRemoval: europeTemperatureMortalitySourceRemovalEndpoint.decision,
    } : {}),
    ecosystemCounterfactualAvailability: ecosystemCounterfactualInventory.evidenceDecision,
  },
  rows,
};
payload.digest = digest({
  inputs: payload.inputs,
  counts,
  stageDefinitions,
  evidenceGates,
  formulas: payload.formulas,
  methodBoundary: payload.methodBoundary,
  rows,
});

const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csv = [[
  'Node ID', 'Node', 'Candidate', 'Grade', 'Confidence', 'Source history', 'Physical stage',
  'Heat hazard stage', 'Human endpoint stage', 'Ecosystem endpoint stage', 'Axis effect', 'Next action',
], ...rows.map(row => [
  row.nodeId,
  row.name,
  row.retainedCandidate.value,
  row.retainedCandidate.grade,
  row.retainedCandidate.confidence,
  row.sourceHistoryStage.status,
  row.physicalStage.status,
  row.heatHazardStage.status,
  row.humanEndpointStage.status,
  row.ecosystemEndpointStage.status,
  row.tulipAxisStage.scoreEffect,
  row.nextAction,
])].map(line => line.map(csvCell).join(',')).join('\n') + '\n';

const independentPatternReportSummary = europeTemperatureMortalityPatternPromotion
  ? europeTemperatureMortalityPatternPromotion.decision.patternInputAdmittedToMatchedEndpoint
    ? `All ${counts.independentHumanEndpointRegionalPatternFrozenTests} frozen monthly and exact-week tests passed. The regional pattern is admitted only as an input to the next matched-endpoint calculation; it changes no axis or score by itself.`
    : `${counts.independentHumanEndpointRegionalPatternFailedTests} of ${counts.independentHumanEndpointRegionalPatternFrozenTests} frozen monthly and exact-week tests failed. The regional pattern is excluded from the matched endpoint and the existing family-calibrated candidates remain in place.`
  : nasaExactWeekIndependentPatternAnalysis
    ? `The exact-week comparison contains ${counts.independentHumanEndpointExactWeekPatternRegionFits.toLocaleString('en-US')} fits across ${counts.independentHumanEndpointExactWeekPatternModels} models and ${counts.independentHumanEndpointExactWeekPatternInstitutions} institutions; its comparison status is ${nasaExactWeekIndependentPatternAnalysis.comparison.status.replaceAll('_', ' ')}.`
    : pangeoIndependentPatternAnalysis
      ? `The monthly independent ensemble contains ${counts.independentHumanEndpointMonthlyPatternRegionFits.toLocaleString('en-US')} model-region-season fits across ${counts.independentHumanEndpointMonthlyPatternModels} models and ${counts.independentHumanEndpointMonthlyPatternInstitutions} institutions; its comparison status is ${pangeoIndependentPatternAnalysis.comparison.status.replaceAll('_', ' ')}.`
      : 'No independent-pattern ensemble has been completed yet.';
const longRecordReportSummary = europeTemperatureMortalityLongRecordPatternAnalysis
  ? `The complete execution contains ${counts.independentHumanEndpointLongRecordPatternAnalysisRegionYears.toLocaleString('en-US')} region-year means across ${counts.independentHumanEndpointLongRecordPatternAnalysisRegions.toLocaleString('en-US')} regions. The fixed 1950–2022 and split-period diagnostics are complete: ${europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.negativeFullPeriodSlopes} full-period slopes are negative, ${europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.rSquaredBelowPointTwo} fits have R² below 0.2 and ${europeTemperatureMortalityLongRecordPatternAnalysis.diagnostics.splitOppositeSigns} regions reverse slope sign across the fixed split. ${independentPatternReportSummary}`
  : `The resumable execution has completed ${counts.independentHumanEndpointLongRecordCompletedYears} of 73 summers and ${counts.independentHumanEndpointLongRecordRegionYearRows.toLocaleString('en-US')} of 70,883 region-year means. Every completed year covers all 971 regions, and its sparse cache is deleted after checkpointing. Partial coverage changes no axes or scores. ${independentPatternReportSummary}`;
const longRecordReportBullet = europeTemperatureMortalityLongRecordPatternAnalysis
  ? `The long-record plan and its ${counts.independentHumanEndpointRegionalAreaWeightSets} sparse area-weight set have produced a complete ${counts.independentHumanEndpointLongRecordPatternAnalysisRegionYears.toLocaleString('en-US')}-row analysis across ${counts.independentHumanEndpointLongRecordPatternAnalysisRegions.toLocaleString('en-US')} regions. The fixed stability challenge admits ${counts.independentHumanEndpointLongRecordPatternAnalysisAxesAdmitted} axes and changes ${counts.independentHumanEndpointLongRecordPatternAnalysisScoreChanges} scores. ${independentPatternReportSummary}`
  : `The long-record plan and its ${counts.independentHumanEndpointRegionalAreaWeightSets} sparse area-weight set are ready across ${counts.independentHumanEndpointRegionalAreaWeightedGridCells.toLocaleString('en-US')} ERA5-Land cells. Retrieval has started with ${counts.independentHumanEndpointLongRecordCompletedYears} complete summers and ${counts.independentHumanEndpointLongRecordRegionYearRows.toLocaleString('en-US')} regional means; ${counts.independentHumanEndpointLongRecordExecutionAxesAdmitted} axes and ${counts.independentHumanEndpointLongRecordExecutionScoreChanges} scores are admitted from partial coverage. ${independentPatternReportSummary}`;

const report = `# TULIP emission-source endpoint pilot

Status: **twenty-one source-specific nonlinear heat-mortality sensitivities are complete; none is admitted to TULIP calibration yet**.

## What changed

The authors’ factual-versus-counterfactual heat-mortality calculation now runs end to end on their published ten-city example. It compares deaths under two temperature histories while holding the location-specific exposure-response function and mortality baseline constant. The example contains hypothetical cities, so its ${mortality.reproduction.total.anthropogenic_share_of_heat_deaths_percent.toFixed(3)}% result is a method check, not a global percentage and not a TULIP input.

The official Carbon Majors supplementary workbook is also checksum pinned and machine-checked. It contains ${counts.publishedHeatHazardEmitterEventPairs.toLocaleString('en-US')} source-to-hazard records covering ${counts.publishedHeatHazardEvents} heatwaves and ${counts.publishedHeatHazardEmitters} emitters. These records measure changes in heat intensity and likelihood; they do not directly measure human or ecosystem harm.

Twenty CO₂ histories and the rice-methane GWP* response now run through the authors’ open 103-region European sample model. Each source response is removed from the factual temperatures and the nonlinear mortality endpoint is recomputed under four explicit local-to-global temperature-pattern cases. This is stronger than multiplying aggregate deaths by an emissions share, but it remains a sensitivity exercise. The public factual-temperature sample can now be reconstructed accurately, while the source-removal patterns for the paper’s full 823 regions and their uncertainty have not yet been produced. The article and checksum-pinned supplement were checked directly: they publish the method, Europe-wide uncertainty and country mortality results, but not the 823 regional temperature-to-GMST slopes or their bounds.

An anonymous open ARCO ERA5 rendering was tested as a fallback across all 103 Italian regions. It was rejected: held-out 2019–2021 weekly anomalies had a median absolute error of ${arcoEra5Crosscheck.results.heldOutWeeklyAnomalies.medianAbsoluteErrorC.toFixed(3)} °C, a 95th-percentile error of ${arcoEra5Crosscheck.results.heldOutWeeklyAnomalies.p95AbsoluteErrorC.toFixed(3)} °C and correlation ${arcoEra5Crosscheck.results.heldOutWeeklyAnomalies.pearsonCorrelation.toFixed(3)}. The coarse rendering therefore cannot validate source-removal regional patterns. The preferred ERA5-Land route remains blocked until the configured Copernicus account accepts the dataset licence.

A second anonymous AWS Open Data rendering supplied native 0.25° ERA5 time-series chunks and matched all ${awsEra5Crosscheck.results.absoluteTemperatures.matchedRows.toLocaleString('en-US')} Italian region-weeks from 2015–2022. It reduced the coarse route's absolute median error by ${awsEra5Crosscheck.results.improvementVersusCoarseOpenFallback.absoluteMedianErrorReductionC.toFixed(3)} °C and its 95th-percentile error by ${awsEra5Crosscheck.results.improvementVersusCoarseOpenFallback.absoluteP95ErrorReductionC.toFixed(3)} °C. It was still rejected under the unchanged tolerances: held-out anomalies had a median absolute error of ${awsEra5Crosscheck.results.heldOutWeeklyAnomalies.medianAbsoluteErrorC.toFixed(3)} °C, a 95th-percentile error of ${awsEra5Crosscheck.results.heldOutWeeklyAnomalies.p95AbsoluteErrorC.toFixed(3)} °C and correlation ${awsEra5Crosscheck.results.heldOutWeeklyAnomalies.pearsonCorrelation.toFixed(3)}. UTC+1 day boundaries changed little, and land-fraction weighting improved errors only slightly.

The 0.1° ERA5-Land route was then reproduced from the Open-Meteo AWS Open Data mirror using cloud range reads. Its selected area-intersection UTC configuration matched all ${openMeteoEra5LandCrosscheck.results.absoluteTemperatures.matchedRows.toLocaleString('en-US')} region-weeks, with ${Math.abs(openMeteoEra5LandCrosscheck.results.absoluteTemperatures.overallBiasC).toFixed(3)} °C absolute bias, ${openMeteoEra5LandCrosscheck.results.absoluteTemperatures.medianAbsoluteErrorC.toFixed(3)} °C median absolute error, ${openMeteoEra5LandCrosscheck.results.absoluteTemperatures.p95AbsoluteErrorC.toFixed(3)} °C 95th-percentile error and correlation ${openMeteoEra5LandCrosscheck.results.absoluteTemperatures.pearsonCorrelation.toFixed(5)}. Held-out 2019–2022 anomalies had ${openMeteoEra5LandCrosscheck.results.heldOutWeeklyAnomalies.medianAbsoluteErrorC.toFixed(3)} °C median error and correlation ${openMeteoEra5LandCrosscheck.results.heldOutWeeklyAnomalies.pearsonCorrelation.toFixed(5)}. This passes the predeclared public-sample gate. The mirror is a redistribution of ERA5-Land rather than an independent climate model, and the full 823-region source-removal endpoint and uncertainty propagation remain pending.

A distinct public European temperature–mortality model now supplies a broader candidate human-endpoint route. Its pinned repository exposes ${europeTemperatureMortalityBridge.counts.fullPanelRows.toLocaleString('en-US')} weekly response-panel rows and ${europeTemperatureMortalityBridge.counts.dailyTemperatureRows.toLocaleString('en-US')} daily temperature rows. TULIP has checksum-pinned every byte of all ${europeTemperatureMortalityBridge.counts.parquetFilesAudited} files and decoded their exact coverage: ${counts.independentHumanEndpointBridgeResponseRegions.toLocaleString('en-US')} unique response regions, of which only ${counts.independentHumanEndpointBridgeResponseRegionsWithEveryObservedYear.toLocaleString('en-US')} appear in every response year. The central pooled model reproduces on ${counts.independentHumanEndpointPooledModelRows.toLocaleString('en-US')} usable rows in two separate local implementations, Python/NumPy and dependency-free base R. They agree on every structural count, the 99th-percentile cutoff, all 24 coefficients and the 19 °C integer-grid minimum-mortality temperature. Both runtimes also reproduce all ${europeTemperatureMortalityPooledModel.model.bootstrap.iterations} seed-${europeTemperatureMortalityPooledModel.model.bootstrap.seed} spatial bootstrap fits with full rank. The factual endpoint now applies those fits to ${counts.independentHumanEndpointAttributionMatchedDailyRows.toLocaleString('en-US')} matched daily rows and reconciles them exactly with ${counts.independentHumanEndpointAttributionMatchedBinRows.toLocaleString('en-US')} person-day-bin rows. It estimates ${europeTemperatureMortalityAttribution.attribution.averageAnnualTotal.mean.toLocaleString('en-US', { maximumFractionDigits: 0 })} average annual hot-plus-cold temperature-associated deaths in the covered panel. That is a factual-temperature endpoint, not a source-attributable one. The authors publish no reference outputs at the pinned commit, and matched local source-removal climate remains unfinished. It therefore remains a research route for ${counts.independentHumanEndpointBridgeCandidates} source candidates, not an admitted endpoint, independent review or score input.

The public 2000–2022 annual-temperature summaries were also tested as a faster source-removal pattern route across all ${counts.independentHumanEndpointSourceRemovalPatternScreenRegions.toLocaleString('en-US')} response regions. The shortcut was rejected: ${europeTemperatureMortalityPatternScreen.diagnostics.negativeFullPeriodSlopes} full-period slopes were negative, ${europeTemperatureMortalityPatternScreen.diagnostics.rSquaredBelowPointTwo} fits had R² below 0.2, ${europeTemperatureMortalityPatternScreen.diagnostics.splitHalfOppositeSigns} reversed sign between the two half-periods, and the median absolute split-half slope difference was ${europeTemperatureMortalityPatternScreen.diagnostics.splitHalfAbsoluteSlopeDifference.median.toFixed(3)}. These diagnostics show that the 23-year observational fit is too unstable to represent a forced regional response. The geometry gate for the stronger route is complete: ${counts.independentHumanEndpointRegionalBoundaryCrosswalkRegions.toLocaleString('en-US')} exact panel identifiers resolve to fixed official GISCO polygons, with ${europeTemperatureMortalityRegionalBoundaries.coverage.sourceReleaseCounts['2024']} from NUTS 2024 and ${europeTemperatureMortalityRegionalBoundaries.coverage.sourceReleaseCounts['2021']} retained UK identifiers from NUTS 2021. A component-aware read plan avoids ${(europeTemperatureMortalityLongRecordPlan.sparsePlan.fullBoundingBox.avoidedFraction * 100).toFixed(1)}% of the naive bounding-box chunks while declaring the remaining ${europeTemperatureMortalityLongRecordPlan.sparsePlan.estimatedTransferBytes.lowerHuman}–${europeTemperatureMortalityLongRecordPlan.sparsePlan.estimatedTransferBytes.upperHuman} planning range. Its exact aggregation matrix contains ${counts.independentHumanEndpointRegionalAreaWeightedGridCells.toLocaleString('en-US')} ERA5-Land cells and ${counts.independentHumanEndpointRegionalAreaWeightIntersections.toLocaleString('en-US')} cell-region weights with no uncovered regions. ${longRecordReportSummary}

The official ISIMIP3a repository was also audited for a shared ecosystem counterfactual. It contains ${counts.publishedTerrestrialBiodiversityFactualDatasets} public factual terrestrial-biodiversity datasets from three impact models, four taxon variables and two social-forcing cases, but ${counts.publishedTerrestrialBiodiversityCounterfactualDatasets} matched counterclim biodiversity datasets. The broader biome sector contains ${counts.publishedPairedBiomeObservedClimateDatasets.toLocaleString('en-US')} obsclim and ${counts.publishedPairedBiomeCounterfactualClimateDatasets.toLocaleString('en-US')} counterclim datasets. Those runs can support variable-specific aggregate climate attribution after review, but they cannot be copied into biodiversity loss or divided among TULIP sources by emissions share. The biodiversity evidence gate therefore remains open with an exact, monitored publication dependency rather than a generic research gap.

For the 28 emission-source nodes:

- ${counts.sourceSpecificAnnualMassFlows} have a source-specific annual mass flow.
- ${counts.cumulativeCo2PhysicalScreens} have a cumulative CO2 physical screen.
- ${counts.sourceHistoryBoundaryAudits} remaining source histories have checksum-backed boundary audits; ${counts.sourceHistoriesAdmittedByBoundaryAudit} can yet be assigned to their node without an invented split.
- ${counts.publishedPhysicalArithmeticValidated} reproduce published emissions-to-warming arithmetic for a partial source history, comprising ${counts.annualPhysicalResponseRecords} annual records. The twenty CO₂ histories retain their EDGAR, CEDS, Ember or FAOSTAT periods and boundaries; the cement-kiln series is explicitly reconstructed, and the rice-methane response covers 1992–2024.
- ${counts.sourceSpecificNonlinearHumanEndpointSensitivityNodes} nodes (${counts.sourceSpecificNonlinearHumanEndpointSensitivityCo2Nodes} CO₂ and ${counts.sourceSpecificNonlinearHumanEndpointSensitivityMethaneNodes} methane) have ${counts.sourceSpecificNonlinearHumanEndpointSensitivityCases} source-specific nonlinear endpoint sensitivity cases across the ${counts.sourceSpecificNonlinearHumanEndpointPublicSampleRegions}-region public sample.
- ${counts.independentHumanEndpointBridgeCandidates} nodes have a broader candidate European human-endpoint route. Its central pooled model has ${counts.independentHumanEndpointPooledModelReproductions} cross-runtime reproduction across ${counts.independentHumanEndpointPooledModelRows.toLocaleString('en-US')} rows, and its factual daily/person-day attribution has ${counts.independentHumanEndpointAttributionReproductions} reproducible implementation; ${counts.independentHumanEndpointAttributionAxesAdmitted} axes and ${counts.independentHumanEndpointAttributionScoreChanges} scores are admitted from it.
- The ${counts.independentHumanEndpointSourceRemovalPatternScreens} short-record regional-pattern screen covers ${counts.independentHumanEndpointSourceRemovalPatternScreenRegions.toLocaleString('en-US')} regions; ${counts.independentHumanEndpointSourceRemovalPatternScreenAxesAdmitted} axes and ${counts.independentHumanEndpointSourceRemovalPatternScreenScoreChanges} scores are admitted from it.
- The ${counts.independentHumanEndpointRegionalBoundaryCrosswalks} long-record geometry crosswalk resolves all ${counts.independentHumanEndpointRegionalBoundaryCrosswalkRegions.toLocaleString('en-US')} panel regions; ${counts.independentHumanEndpointRegionalBoundaryCrosswalkAxesAdmitted} axes and ${counts.independentHumanEndpointRegionalBoundaryCrosswalkScoreChanges} scores are admitted from geometry alone.
- ${longRecordReportBullet}
- ${counts.nodeSpecificMatchedHumanEndpoints} have completed a matched source-removal human endpoint.
- ${counts.nodeSpecificMatchedEcosystemEndpoints} have completed a matched source-removal ecosystem endpoint.
- ${counts.endpointBasedRatingChanges} ratings changed from this endpoint pilot.

Every numerical candidate remains visible internally at confidence D. The new sensitivities do not change rating axes or confidence. Production ratings remain disabled.

## The calculation we will accept

**Source-attributable deaths = deaths under factual temperature − deaths under the source-removal temperature**, using the same local exposure-response function and the same mortality baseline.

The same causal structure applies to other outcomes, but each outcome needs its own model. Heat mortality cannot stand in for livelihoods, floods, ecosystem condition or recovery.

## Calculations we reject

${prohibitedOperations.map(operation => `- ${operation}`).join('\n')}

These shortcuts assume harm changes proportionally with emissions or global temperature. The published heatwave paper explicitly warns that direct hazard fractions omit non-linear exposure and vulnerability.

## Evidence gates

| Gate | Status | Evidence |
| --- | --- | --- |
${evidenceGates.map(gate => `| ${gate.gate} | ${gate.status.replaceAll('_', ' ')} | ${gate.evidence} |`).join('\n')}

## Physical-response wave

| Node | Annual response | Latest partial GMST screen | Current endpoint state | Next action |
| --- | ---: | ---: | --- | --- |
${rows.filter(row => row.physicalStage.output).map(row => `| ${row.name} | ${row.physicalStage.annualSeries.records} points | ${row.physicalStage.output.bestPublishedMethod ?? row.physicalStage.output.best} °C | ${row.humanEndpointStage.status.replaceAll('_', ' ')} | ${row.nextAction} |`).join('\n')}

## Why the ratings do not change yet

The physical step answers how much warming is associated with a partial source history. The hazard step asks how a heatwave changes. The endpoint step asks how many people are harmed under the matched factual and source-removal worlds. Only the endpoint can inform human severity or reach. A separate ecosystem endpoint is still required for the nature half of TULIP unless a node has a reviewed structural exclusion.

## Sources and availability

- [Vicedo-Cabrera et al. heat-mortality attribution](${mortality.source.articleUrl}) and [pinned example repository](${mortality.source.repository}): the endpoint algorithm and ten-city hypothetical data are reproducible.
- [Understanding and Addressing Temperature Impacts on Mortality](${europeTemperatureMortalityBridge.paper.paperUrl}) and [pinned public repository](${europeTemperatureMortalityBridge.repository.url}): the central pooled European model, all 100 spatial bootstrap fits, observed-temperature trimming, daily attribution and person-day-bin attribution are reproduced. Matched source-removal climate and author-output comparison still remain before admission.
- [Quilcaille et al. Carbon Majors heatwave attribution](${carbonHazard.source.articleUrl}) and [official supplementary workbook](${carbonHazard.source.supplementaryUrl}): the source-to-hazard matrix is ingested and checksum pinned. Its actor boundaries still require a non-overlapping TULIP crosswalk, and its hazard values cannot substitute for terminal harm.
`;

await Promise.all([
  writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(outputCsv, csv),
  writeFile(outputReport, report),
]);

console.log(JSON.stringify({ outputJson, outputCsv, outputReport, counts, digest: payload.digest }, null, 2));
