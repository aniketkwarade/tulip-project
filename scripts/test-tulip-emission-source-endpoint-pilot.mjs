import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/internal-emission-source-endpoint-pilot.json', import.meta.url), 'utf8'));
const optionalJson = async relativeUrl => {
  try {
    return JSON.parse(await readFile(new URL(relativeUrl, import.meta.url), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};
const longRecordPatternAnalysis = await optionalJson('../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-long-record-pattern-analysis.json');
const monthlyPatternAnalysis = await optionalJson('../artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-independent-pattern-analysis.json');
const exactWeekPatternAnalysis = await optionalJson('../artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-analysis.json');
const regionalPatternPromotion = await optionalJson('../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-pattern-promotion-decision.json');
const matchedSourceRemovalEndpoint = await optionalJson('../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-source-removal-endpoint.json');
const expectedHumanEndpointStatus = matchedSourceRemovalEndpoint
  ? 'matched_source_removal_human_endpoint_complete_axis_mapping_and_ecosystem_pending'
  : 'source_specific_nonlinear_endpoint_sensitivity_run_pattern_validation_pending';

assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.version, 'tulip_internal_emission_source_endpoint_pilot_2026_09_26_v33');
assert.equal(payload.counts.emissionSourceNodes, 28);
assert.equal(payload.counts.numericalCandidatesRetained, 28);
assert.equal(payload.counts.publishedPhysicalArithmeticValidated, 21);
assert.equal(payload.counts.annualPhysicalResponseSeries, 21);
assert.equal(payload.counts.annualPhysicalResponseRecords, 1682);
assert.equal(payload.counts.publishedHeatHazardMatricesIngested, 1);
assert.equal(payload.counts.publishedHeatHazardEvents, 213);
assert.equal(payload.counts.publishedHeatHazardEmitters, 180);
assert.equal(payload.counts.publishedHeatHazardEmitterEventPairs, 38_340);
assert.equal(payload.counts.openHeatHazardMethodIdentified, 18);
assert.equal(payload.counts.sharedHumanEndpointAlgorithmReproduced, 1);
assert.equal(payload.counts.sourceSpecificNonlinearHumanEndpointSensitivityNodes, 21);
assert.equal(payload.counts.sourceSpecificNonlinearHumanEndpointSensitivityCo2Nodes, 20);
assert.equal(payload.counts.sourceSpecificNonlinearHumanEndpointSensitivityMethaneNodes, 1);
assert.equal(payload.counts.sourceSpecificNonlinearHumanEndpointSensitivityCases, 84);
assert.equal(payload.counts.sourceSpecificNonlinearHumanEndpointPublicSampleRegions, 103);
assert.equal(payload.counts.sourceHistoryBoundaryAudits, 6);
assert.equal(payload.counts.sourceHistoriesAdmittedByBoundaryAudit, 0);
assert.equal(payload.counts.independentHumanEndpointBridgeCandidates, 21);
assert.equal(payload.counts.independentHumanEndpointBridgeAxesAdmitted, 0);
assert.equal(payload.counts.independentHumanEndpointBridgeScoreChanges, 0);
assert.equal(payload.counts.independentHumanEndpointBridgeResponseRegions, 971);
assert.equal(payload.counts.independentHumanEndpointBridgeResponseRegionsWithEveryObservedYear, 107);
assert.equal(payload.counts.independentHumanEndpointPooledModelReproductions, 1);
assert.equal(payload.counts.independentHumanEndpointPooledModelRows, 676_689);
assert.equal(payload.counts.independentHumanEndpointPooledModelAxesAdmitted, 0);
assert.equal(payload.counts.independentHumanEndpointPooledModelScoreChanges, 0);
assert.equal(payload.counts.independentHumanEndpointAttributionReproductions, 1);
assert.equal(payload.counts.independentHumanEndpointAttributionMatchedDailyRows, 4_454_230);
assert.equal(payload.counts.independentHumanEndpointAttributionMatchedBinRows, 637_399);
assert.equal(payload.counts.independentHumanEndpointAttributionAxesAdmitted, 0);
assert.equal(payload.counts.independentHumanEndpointAttributionScoreChanges, 0);
assert.equal(payload.counts.independentHumanEndpointSourceRemovalPatternScreens, 1);
assert.equal(payload.counts.independentHumanEndpointSourceRemovalPatternScreenRegions, 971);
assert.equal(payload.counts.independentHumanEndpointSourceRemovalPatternScreenAxesAdmitted, 0);
assert.equal(payload.counts.independentHumanEndpointSourceRemovalPatternScreenScoreChanges, 0);
assert.equal(payload.counts.independentHumanEndpointRegionalBoundaryCrosswalks, 1);
assert.equal(payload.counts.independentHumanEndpointRegionalBoundaryCrosswalkRegions, 971);
assert.equal(payload.counts.independentHumanEndpointRegionalBoundaryCrosswalkAxesAdmitted, 0);
assert.equal(payload.counts.independentHumanEndpointRegionalBoundaryCrosswalkScoreChanges, 0);
assert.equal(payload.counts.independentHumanEndpointLongRecordRetrievalPlans, 1);
assert(payload.counts.independentHumanEndpointLongRecordEstimatedTransferLowerBytes > 5_000_000_000);
assert(payload.counts.independentHumanEndpointLongRecordEstimatedTransferUpperBytes > payload.counts.independentHumanEndpointLongRecordEstimatedTransferLowerBytes);
assert.equal(payload.counts.independentHumanEndpointRegionalAreaWeightSets, 1);
assert.equal(payload.counts.independentHumanEndpointRegionalAreaWeightedGridCells, 68_733);
assert.equal(payload.counts.independentHumanEndpointRegionalAreaWeightIntersections, 88_155);
assert.equal(payload.counts.independentHumanEndpointRegionalAreaWeightAxesAdmitted, 0);
assert.equal(payload.counts.independentHumanEndpointRegionalAreaWeightScoreChanges, 0);
assert.equal(payload.counts.independentHumanEndpointLongRecordRetrievalExecutions, 1);
assert(payload.counts.independentHumanEndpointLongRecordCompletedYears >= 1);
assert.equal(payload.counts.independentHumanEndpointLongRecordRegionYearRows, payload.counts.independentHumanEndpointLongRecordCompletedYears * 971);
assert.equal(payload.counts.independentHumanEndpointLongRecordExecutionAxesAdmitted, 0);
assert.equal(payload.counts.independentHumanEndpointLongRecordExecutionScoreChanges, 0);
assert.equal(payload.counts.independentHumanEndpointLongRecordPatternAnalyses, longRecordPatternAnalysis ? 1 : 0);
assert.equal(payload.counts.independentHumanEndpointLongRecordPatternAnalysisRegions, longRecordPatternAnalysis?.diagnostics.responseRegions ?? 0);
assert.equal(payload.counts.independentHumanEndpointLongRecordPatternAnalysisRegionYears, longRecordPatternAnalysis?.diagnostics.responseRegionYears ?? 0);
assert.equal(payload.counts.independentHumanEndpointLongRecordPatternAnalysisAxesAdmitted, 0);
assert.equal(payload.counts.independentHumanEndpointLongRecordPatternAnalysisScoreChanges, 0);
assert.equal(payload.counts.independentHumanEndpointMonthlyPatternAnalyses, monthlyPatternAnalysis ? 1 : 0);
assert.equal(payload.counts.independentHumanEndpointMonthlyPatternModels, monthlyPatternAnalysis?.counts.models ?? 0);
assert.equal(payload.counts.independentHumanEndpointMonthlyPatternInstitutions, monthlyPatternAnalysis?.counts.institutions ?? 0);
assert.equal(payload.counts.independentHumanEndpointMonthlyPatternRegionFits, monthlyPatternAnalysis?.counts.modelRegionFits ?? 0);
assert.equal(
  payload.counts.independentHumanEndpointMonthlyPatternComparisonComplete,
  monthlyPatternAnalysis?.comparison.status === 'monthly_independent_pattern_tests_complete_exact_week_challenge_pending' ? 1 : 0,
);
assert.equal(payload.counts.independentHumanEndpointMonthlyPatternTestsPassed, monthlyPatternAnalysis?.comparison.monthlyTestsPassed ?? null);
assert.equal(payload.counts.independentHumanEndpointExactWeekPatternAnalyses, exactWeekPatternAnalysis ? 1 : 0);
assert.equal(payload.counts.independentHumanEndpointExactWeekPatternModels, exactWeekPatternAnalysis?.counts.models ?? 0);
assert.equal(payload.counts.independentHumanEndpointExactWeekPatternInstitutions, exactWeekPatternAnalysis?.counts.institutions ?? 0);
assert.equal(payload.counts.independentHumanEndpointExactWeekPatternRegionFits, exactWeekPatternAnalysis?.counts.modelRegionFits ?? 0);
assert.equal(
  payload.counts.independentHumanEndpointExactWeekPatternComparisonComplete,
  exactWeekPatternAnalysis?.comparison.status === 'exact_week_independent_pattern_tests_complete' ? 1 : 0,
);
assert.equal(payload.counts.independentHumanEndpointExactWeekPatternTestsPassed, exactWeekPatternAnalysis?.comparison.exactWeekTestsPassed ?? null);
assert.equal(payload.counts.independentHumanEndpointRegionalPatternPromotionDecisions, regionalPatternPromotion ? 1 : 0);
assert.equal(payload.counts.independentHumanEndpointRegionalPatternFrozenTests, regionalPatternPromotion?.counts.frozenTests ?? 0);
assert.equal(payload.counts.independentHumanEndpointRegionalPatternPassedTests, regionalPatternPromotion?.counts.passedTests ?? 0);
assert.equal(payload.counts.independentHumanEndpointRegionalPatternFailedTests, regionalPatternPromotion?.counts.failedTests ?? 0);
assert.equal(
  payload.counts.independentHumanEndpointRegionalPatternPromoted,
  regionalPatternPromotion?.decision.patternInputAdmittedToMatchedEndpoint ?? null,
);
assert.equal(payload.counts.independentOpenReanalysisFallbacksTested, 3);
assert.equal(payload.counts.independentOpenReanalysisFallbacksAdmitted, 1);
assert.equal(payload.counts.publishedEcosystemCounterfactualFrameworksIdentified, 1);
assert.equal(payload.counts.publishedTerrestrialBiodiversityFactualDatasets, 24);
assert.equal(payload.counts.publishedTerrestrialBiodiversityCounterfactualDatasets, 0);
assert.equal(payload.counts.publishedPairedBiomeObservedClimateDatasets, 1001);
assert.equal(payload.counts.publishedPairedBiomeCounterfactualClimateDatasets, 1001);
assert.equal(payload.counts.nodeSpecificMatchedHumanEndpoints, matchedSourceRemovalEndpoint?.coverage.sourceNodes ?? 0);
assert.equal(payload.counts.nodeSpecificMatchedEcosystemEndpoints, 0);
assert.equal(payload.counts.endpointBasedRatingChanges, 0);
assert.equal(payload.rows.length, 28);
assert.equal(new Set(payload.rows.map(row => row.nodeId)).size, 28);
assert(payload.rows.every(row => Number.isFinite(row.retainedCandidate.value)));
assert(payload.rows.every(row => row.retainedCandidate.confidence === 'D'));
assert(payload.rows.every(row => row.tulipAxisStage.scoreEffect === 'none_candidate_value_grade_and_confidence_retained'));
assert.equal(payload.stageDefinitions.length, 5);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'published endpoint equation').status, 'passed_on_authors_example');
assert.equal(
  payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').status,
  matchedSourceRemovalEndpoint
    ? 'matched_source_removal_endpoint_complete_axis_mapping_and_ecosystem_pending'
    : 'factual_attribution_reproduced_source_removal_not_passed',
);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').exactDataGap.regionLevelWarmingFactorsPublished, false);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.validationRegions, 103);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.validationRequests, 16);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.candidateFullRegionUniverse, 823);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.latestPopulationObservedRegions, 801);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.latestPopulationMissingRegions, 22);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.officialUkMidyearSensitivityRegions, 12);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.directOldBoundaryLauAggregateRegions, 8);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.lauPopulationFieldValidatedByEurostat, false);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.proportionalMergeSensitivityRegions, 2);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openArcoEra5Fallback.admissionStatus, 'rejected_for_source_removal_endpoint_attribution');
assert(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openArcoEra5Fallback.heldOutWeeklyAnomalies.medianAbsoluteErrorC > 0.15);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openAwsEra5Fallback.admissionStatus, 'rejected_for_source_removal_endpoint_attribution');
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openAwsEra5Fallback.absoluteTemperatures.matchedRows, 11_536);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openAwsEra5Fallback.methodSensitivities.area_intersection_utcplus0000.passesPredeclaredAbsoluteReconstructionCriteria, false);
assert(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openAwsEra5Fallback.heldOutWeeklyAnomalies.medianAbsoluteErrorC > 0.15);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openMeteoEra5LandMirror.admissionStatus, 'accepted_for_public_sample_temperature_pattern_validation_only');
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openMeteoEra5LandMirror.absoluteTemperatures.matchedRows, 11_536);
assert(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openMeteoEra5LandMirror.absoluteTemperatures.medianAbsoluteErrorC < 0.15);
assert(payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.openMeteoEra5LandMirror.heldOutWeeklyAnomalies.pearsonCorrelation > 0.999);
const endpointBridgePlan = payload.evidenceGates.find(gate => gate.gate === 'matched current human endpoint').reconstructionPlan.candidateIndependentEuropeanEndpointBridge;
if (monthlyPatternAnalysis) {
  assert.equal(endpointBridgePlan.monthlyIndependentPatternAnalysis.counts.modelRegionFits, 42_724);
} else {
  assert.equal('monthlyIndependentPatternAnalysis' in endpointBridgePlan, false);
}
if (exactWeekPatternAnalysis) {
  assert.equal(endpointBridgePlan.exactWeekIndependentPatternAnalysis.counts.modelRegionFits, 28_159);
} else {
  assert.equal('exactWeekIndependentPatternAnalysis' in endpointBridgePlan, false);
}
if (regionalPatternPromotion) {
  assert.equal(endpointBridgePlan.regionalPatternPromotion.counts.frozenTests, 30);
} else {
  assert.equal('regionalPatternPromotion' in endpointBridgePlan, false);
}
if (matchedSourceRemovalEndpoint) {
  assert.equal(endpointBridgePlan.matchedSourceRemovalHumanEndpoint.coverage.sourceNodes, 21);
  assert.equal(payload.inputs.europeTemperatureMortalitySourceRemovalEndpointDigest, matchedSourceRemovalEndpoint.digest);
  assert.deepEqual(payload.methodBoundary.independentHumanEndpointMatchedSourceRemoval, matchedSourceRemovalEndpoint.decision);
} else {
  assert.equal('matchedSourceRemovalHumanEndpoint' in endpointBridgePlan, false);
  assert.equal('europeTemperatureMortalitySourceRemovalEndpointDigest' in payload.inputs, false);
  assert.equal('independentHumanEndpointMatchedSourceRemoval' in payload.methodBoundary, false);
}
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched ecosystem endpoint').status, 'not_passed');
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched ecosystem endpoint').exactDataGap.biodiversityObservedClimateDatasets, 24);
assert.equal(payload.evidenceGates.find(gate => gate.gate === 'matched ecosystem endpoint').exactDataGap.biodiversityCounterfactualClimateDatasets, 0);
assert.match(payload.evidenceGates.find(gate => gate.gate === 'matched ecosystem endpoint').exactDataGap.promotionGate, /matched obsclim and counterclim/i);
assert.match(payload.formulas.validHumanEndpoint, /D\(factual temperature/i);
assert(payload.formulas.invalidShortcuts.some(operation => /heat deaths × annual emissions share/i.test(operation)));
assert.match(payload.methodBoundary.conclusion, /counterfactual chain, not a common multiplier/i);
assert.equal(payload.methodBoundary.regionalPatternFallbacks.length, 3);
assert.equal(payload.methodBoundary.independentHumanEndpointBridge.status, 'not_admitted_to_tulip_axes');
assert.equal(payload.methodBoundary.independentHumanEndpointPooledModel.axesAdmitted, 0);
assert.equal(payload.methodBoundary.independentHumanEndpointAttribution.axesAdmitted, 0);
assert.equal(payload.methodBoundary.independentHumanEndpointSourceRemovalPatternScreen.axesAdmitted, 0);
assert.equal(payload.methodBoundary.independentHumanEndpointRegionalBoundaryCrosswalk.axesAdmitted, 0);
assert.equal(payload.methodBoundary.independentHumanEndpointLongRecordRetrievalPlan.axesAdmitted, 0);
assert.equal(payload.methodBoundary.independentHumanEndpointRegionalAreaWeights.axesAdmitted, 0);
if (longRecordPatternAnalysis) {
  assert.equal(payload.inputs.europeTemperatureMortalityLongRecordPatternAnalysisDigest, longRecordPatternAnalysis.digest);
  assert.deepEqual(payload.methodBoundary.independentHumanEndpointLongRecordPatternAnalysis, longRecordPatternAnalysis.decision);
} else {
  assert.equal('europeTemperatureMortalityLongRecordPatternAnalysisDigest' in payload.inputs, false);
  assert.equal('independentHumanEndpointLongRecordPatternAnalysis' in payload.methodBoundary, false);
}
if (monthlyPatternAnalysis) {
  assert.equal(payload.inputs.pangeoIndependentPatternAnalysisDigest, monthlyPatternAnalysis.digest);
  assert.deepEqual(payload.methodBoundary.independentHumanEndpointMonthlyPatternAnalysis, monthlyPatternAnalysis.decision);
} else {
  assert.equal('pangeoIndependentPatternAnalysisDigest' in payload.inputs, false);
  assert.equal('independentHumanEndpointMonthlyPatternAnalysis' in payload.methodBoundary, false);
}
if (exactWeekPatternAnalysis) {
  assert.equal(payload.inputs.nasaExactWeekIndependentPatternAnalysisDigest, exactWeekPatternAnalysis.digest);
  assert.deepEqual(payload.methodBoundary.independentHumanEndpointExactWeekPatternAnalysis, exactWeekPatternAnalysis.decision);
} else {
  assert.equal('nasaExactWeekIndependentPatternAnalysisDigest' in payload.inputs, false);
  assert.equal('independentHumanEndpointExactWeekPatternAnalysis' in payload.methodBoundary, false);
}
if (regionalPatternPromotion) {
  assert.equal(payload.inputs.europeTemperatureMortalityPatternPromotionDigest, regionalPatternPromotion.digest);
  assert.deepEqual(payload.methodBoundary.independentHumanEndpointRegionalPatternPromotion, regionalPatternPromotion.decision);
} else {
  assert.equal('europeTemperatureMortalityPatternPromotionDigest' in payload.inputs, false);
  assert.equal('independentHumanEndpointRegionalPatternPromotion' in payload.methodBoundary, false);
}
assert.match(payload.methodBoundary.ecosystemCounterfactualAvailability.biomesBoundary, /cannot be copied/i);
assert.equal(payload.digest.length, 64);

const waveOne = payload.rows.filter(row => row.physicalStage.status === 'published_arithmetic_reproduced_partial_history');
assert.equal(waveOne.length, 20);
assert.equal(waveOne.filter(row => row.heatHazardStage.status === 'published_hazard_matrix_ingested_tulip_source_crosswalk_not_run').length, 18);
assert(waveOne.filter(row => row.heatHazardStage.evidenceCoverage).every(row => row.heatHazardStage.evidenceCoverage.emitterEventPairs === 38_340));
assert(waveOne.every(row => row.humanEndpointStage.status === expectedHumanEndpointStatus));
assert(waveOne.every(row => row.humanEndpointStage.sensitivity.patternCases.length === 4));
assert(waveOne.every(row => row.humanEndpointStage.sensitivity.publicSampleRegions === 103));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.requiredInputs.length === 3));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.regionLevelWarmingFactorsPublished === false));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.validationRequests === 16));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateFullRegionUniverse === 823));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.latestPopulationObservedRegions === 801));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.latestPopulationMissingRegions === 22));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.officialUkMidyearSensitivityRegions === 12));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.directOldBoundaryLauAggregateRegions === 8));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.lauPopulationFieldValidatedByEurostat === false));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.proportionalMergeSensitivityRegions === 2));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.openArcoEra5Fallback.admissionStatus === 'rejected_for_source_removal_endpoint_attribution'));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.openAwsEra5Fallback.admissionStatus === 'rejected_for_source_removal_endpoint_attribution'));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.openMeteoEra5LandMirror.admissionStatus === 'accepted_for_public_sample_temperature_pattern_validation_only'));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.admissionStatus === 'not_admitted_to_tulip_axes'));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.completeFileChecksums === 6));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.exactRegionCounts.responsePanel === 971));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.responseRegionsWithEveryObservedYear === 107));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.pooledModelReproduction.crossRuntimeStatus === 'passed_python_numpy_vs_base_r'));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.pooledModelReproduction.modelRows === 676_689));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.attributionReproduction.matchedDailyRows === 4_454_230));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.attributionReproduction.matchedDailyMinusBinnedDayCount === 0));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.sourceRemovalPatternScreen.fittedRegions === 971));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.sourceRemovalPatternScreen.negativeFullPeriodSlopes === 24));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.sourceRemovalPatternScreen.rSquaredBelowPointTwo === 76));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.sourceRemovalPatternScreen.splitHalfOppositeSigns === 22));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.regionalBoundaryCrosswalk.resolvedRegions === 971));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.regionalBoundaryCrosswalk.admissionDecision.axesAdmitted === 0));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.retrievalPlan.spatialChunkKeys === 13_970));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.areaWeights.weightedGridCells === 68_733));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.areaWeights.regionsWithoutWeights === 0));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.execution.completedYearCount >= 1));
assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.execution.regionYearRows === row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.execution.completedYearCount * 971));
if (longRecordPatternAnalysis) {
  assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.patternAnalysis.responseRegionYears === 70_883));
} else {
  assert(waveOne.every(row => !('patternAnalysis' in row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation)));
}
if (monthlyPatternAnalysis) {
  assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.monthlyIndependentPatternAnalysis.counts.modelRegionFits === 42_724));
} else {
  assert(waveOne.every(row => !('monthlyIndependentPatternAnalysis' in row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation)));
}
if (exactWeekPatternAnalysis) {
  assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.exactWeekIndependentPatternAnalysis.counts.modelRegionFits === 28_159));
} else {
  assert(waveOne.every(row => !('exactWeekIndependentPatternAnalysis' in row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation)));
}
if (regionalPatternPromotion) {
  assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.regionalPatternPromotion.counts.frozenTests === 30));
} else {
  assert(waveOne.every(row => !('regionalPatternPromotion' in row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation)));
}
if (matchedSourceRemovalEndpoint) {
  assert(waveOne.every(row => row.humanEndpointStage.matchedEndpoint.physicalCases.length === 3));
  assert(waveOne.every(row => row.humanEndpointStage.matchedEndpoint.axesAdmitted === 0));
  assert(waveOne.every(row => row.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.matchedSourceRemovalHumanEndpoint.coverage.sourceNodes === 21));
} else {
  assert(waveOne.every(row => row.humanEndpointStage.matchedEndpoint === null));
}
const expectedRegionalPatternNextAction = matchedSourceRemovalEndpoint?.decision.nextGate
  ?? regionalPatternPromotion?.decision.nextGate
  ?? exactWeekPatternAnalysis?.decision.nextGate
  ?? monthlyPatternAnalysis?.decision.nextGate
  ?? longRecordPatternAnalysis?.decision.nextGate
  ?? payload.methodBoundary.independentHumanEndpointLongRecordRetrieval.nextGate;
assert(waveOne.every(row => row.nextAction === expectedRegionalPatternNextAction));
assert(waveOne.every(row => row.ecosystemEndpointStage.status === 'counterfactual_framework_identified_paired_biodiversity_output_unavailable'));
assert(waveOne.every(row => row.ecosystemEndpointStage.factualDatasets === 24));
assert(waveOne.every(row => row.ecosystemEndpointStage.counterfactualDatasets === 0));
assert(waveOne.every(row => row.physicalStage.output.bestPublishedMethod > 0));
assert(waveOne.every(row => row.physicalStage.annualSeries.status === 'validated_partial_source_history_time_series'));
assert.equal(waveOne.reduce((sum, row) => sum + row.physicalStage.annualSeries.records, 0), 1649);

const peat = payload.rows.find(row => row.nodeId === 'peatland_drainage_co2');
assert.equal(peat.heatHazardStage.status, 'source_specific_heat_endpoint_sensitivity_run_non_fossil_hazard_crosswalk_not_applicable');
assert.equal(peat.humanEndpointStage.status, expectedHumanEndpointStatus);
assert.equal(peat.humanEndpointStage.sensitivity.patternCases.length, 4);

const deforestation = payload.rows.find(row => row.nodeId === 'deforestation_co2_release');
assert.equal(deforestation.heatHazardStage.status,
  'source_specific_heat_endpoint_sensitivity_run_non_fossil_hazard_crosswalk_not_applicable');
assert.equal(deforestation.humanEndpointStage.status,
  expectedHumanEndpointStatus);
assert.equal(deforestation.humanEndpointStage.sensitivity.patternCases.length, 4);
assert.match(deforestation.physicalStage.boundary, /living biomass/i);

const cementKiln = payload.rows.find(row => row.nodeId === 'cement_kiln_fuel_co2');
assert.equal(cementKiln.heatHazardStage.status,
  'published_hazard_matrix_ingested_tulip_source_crosswalk_not_run');
assert.equal(cementKiln.humanEndpointStage.status,
  expectedHumanEndpointStatus);
assert.equal(cementKiln.humanEndpointStage.sensitivity.patternCases.length, 4);
assert.match(cementKiln.physicalStage.boundary, /constant 2019 cement share/i);

const rice = payload.rows.find(row => row.nodeId === 'rice_paddy_methane_bubbles');
assert.equal(rice.physicalStage.status, 'published_gwp_star_reproduced_partial_history');
assert.equal(rice.physicalStage.annualSeries.status, 'validated_path_dependent_methane_response_series');
assert.equal(rice.physicalStage.annualSeries.records, 33);
assert(rice.physicalStage.output.best > 0.004 && rice.physicalStage.output.best < 0.0043);
assert.equal(rice.heatHazardStage.status, 'source_specific_heat_endpoint_sensitivity_run_non_fossil_hazard_crosswalk_not_applicable');
assert.equal(rice.heatHazardStage.reference, null);
assert.equal(rice.humanEndpointStage.status, expectedHumanEndpointStatus);
assert.equal(rice.humanEndpointStage.sensitivity.sourceGas, 'CH4');
assert.equal(rice.humanEndpointStage.sensitivity.physicalResponseBasis, 'path_dependent_methane_gwp_star_response_since_1991');
assert.equal(rice.humanEndpointStage.sensitivity.patternCases.length, 4);
assert.equal(rice.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.admissionStatus, 'not_admitted_to_tulip_axes');
assert.equal(rice.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.completeFileChecksums, 6);
assert.equal(rice.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.pooledModelReproduction.crossRuntimeStatus, 'passed_python_numpy_vs_base_r');
assert.equal(rice.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.attributionReproduction.minimumMortalityTemperatureC, 19);
assert.equal(rice.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.sourceRemovalPatternScreen.admissionDecision.axesAdmitted, 0);
assert.equal(rice.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.regionalBoundaryCrosswalk.geometrySha256.length, 64);
assert.equal(rice.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.areaWeights.logicalSha256.length, 64);
assert.equal(rice.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.execution.remainingYears, 73 - rice.humanEndpointStage.regionalPatternDataGap.candidateIndependentEuropeanEndpointBridge.longRecordPreparation.execution.completedYearCount);
assert.equal(rice.nextAction, expectedRegionalPatternNextAction);
assert.match(rice.heatHazardStage.limitation, /incompatible with this source boundary/i);

const boundaryAudited = payload.rows.filter(row => row.sourceHistoryStage.boundaryAudit);
assert.equal(boundaryAudited.length, 6);
assert(boundaryAudited.every(row => row.sourceHistoryStage.boundaryAudit.ratingEffect === 'none_candidate_retained_at_confidence_d'));
assert.match(payload.rows.find(row => row.nodeId === 'diesel_freight_co2').nextAction, /freight-truck CO2 series/i);

console.log('Emission-source endpoint pilot passed: all 28 candidates remain numerical, twenty-one have physical histories and nonlinear human sensitivity cases, incompatible hazard models stay excluded, and no rating changes without matched terminal endpoints.');
