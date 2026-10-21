import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = resolve(root, 'artifacts/tulip-calibration-2026-09-22');
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const optionalJson = async path => {
  try {
    return await json(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};
const [catalogue, audit, registry, percentageSemantics, emissionSourceAxisAdmission, emissionSourceHumanEndpointBridge, emissionSourceHumanEndpointPooledModel, emissionSourceHumanEndpointAttribution, emissionSourceHumanEndpointPatternScreen, emissionSourceHumanEndpointRegionalBoundaries, emissionSourceHumanEndpointLongRecordPlan, emissionSourceHumanEndpointAreaWeights, emissionSourceHumanEndpointLongRecordRetrieval, emissionSourceHumanEndpointLongRecordPatternAnalysis, emissionSourceHumanEndpointMonthlyPatternAnalysis, emissionSourceHumanEndpointExactWeekPatternAnalysis, emissionSourceHumanEndpointRegionalPatternPromotion, emissionSourceHumanEndpointMatchedSourceRemoval] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-catalogue-audit-pass-2.json'),
  json('public/tulip-assessments.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-ecosystem-percentage-semantics.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-emission-source-axis-admission-audit.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-bridge-reference-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-pooled-model-reproduction.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-attribution-reproduction.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-source-removal-pattern-screen.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-regional-boundary-crosswalk.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-long-record-retrieval-plan.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-regional-area-weights.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-long-record-retrieval.json'),
  optionalJson('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-long-record-pattern-analysis.json'),
  optionalJson('artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-independent-pattern-analysis.json'),
  optionalJson('artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-analysis.json'),
  optionalJson('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-pattern-promotion-decision.json'),
  optionalJson('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-source-removal-endpoint.json'),
]);

const auditById = new Map(audit.nodes.map(row => [row.nodeId, row]));
const percentageSemanticsById = new Map(percentageSemantics.rows.map(row => [row.nodeId, row]));
const emissionSourceAxisAdmissionById = new Map(emissionSourceAxisAdmission.rows.map(row => [row.nodeId, row]));
const emissionSourceHumanEndpointBridgeNodeIds = new Set(emissionSourceHumanEndpointBridge.affectedNodeIds);
const matchedSourceRemovalEndpointById = new Map((emissionSourceHumanEndpointMatchedSourceRemoval?.results ?? []).map(row => [row.nodeId, row]));
const axes = ['severity', 'reach', 'persistence'];
const dimensions = ['human', 'ecosystem'];
const gapAction = (dimension, axis) => {
  if (axis === 'severity') return dimension === 'human'
    ? 'Obtain a current terminal-consequence estimate: deaths, illness, injury, displacement, essential-service loss or attributable material loss.'
    : 'Obtain a current ecosystem-condition estimate against a documented collapse or functional-loss reference.';
  if (axis === 'reach') return dimension === 'human'
    ? 'Obtain a compatible affected-person count or population share; keep exposure separate from demonstrated harm.'
    : 'Obtain affected area or population as a share of the relevant ecosystem distribution, with the denominator documented.';
  return dimension === 'human'
    ? 'Obtain consequence duration or recovery time; do not substitute the observation-window length.'
    : 'Obtain ecosystem recovery time or evidence of irreversibility; do not substitute the monitoring-record length.';
};

const rows = catalogue.issues.map(row => {
  const audited = auditById.get(row.nodeId);
  const record = registry.records[row.nodeId];
  const unresolvedAxes = [];
  for (const dimension of row.candidate.applicableDomains) {
    const component = row.candidate.components[dimension];
    for (const axis of axes) {
      if (component.lower[axis] !== component.upper[axis]) {
        unresolvedAxes.push({
          dimension,
          axis,
          lower: component.lower[axis],
          central: component.central[axis],
          upper: component.upper[axis],
          action: gapAction(dimension, axis),
        });
      }
    }
  }
  const flags = audited.calibrationFlags;
  const oldEvidence = flags.includes('newest_registry_evidence_ends_before_2021');
  const nearBoundary = flags.includes('central_value_near_grade_boundary');
  const ecosystemPercentageNeedsSemanticReview = flags.includes('ecosystem_percentage_held_for_semantic_review');
  const retainedPilotTraceMissing = flags.includes('retained_pilot_axis_basis_not_recorded');
  const emissionSourceEndpointNotCalibrated = flags.includes('emission_source_candidate_not_endpoint_calibrated');
  const axisAdmissionAudit = emissionSourceAxisAdmissionById.get(row.nodeId);
  const emissionSourceAxisAdmissionAudited = flags.includes('emission_source_axis_admission_audited')
    && axisAdmissionAudit?.admittedAxes === 0
    && axisAdmissionAudit?.scoreEffect === 'none';
  const emissionSourceHumanEndpointBridgeAudited = flags.includes('emission_source_human_endpoint_bridge_audited')
    && emissionSourceHumanEndpointBridgeNodeIds.has(row.nodeId)
    && emissionSourceHumanEndpointBridge.admissionDecision.status === 'not_admitted_to_tulip_axes'
    && emissionSourceHumanEndpointBridge.counts.axesAdmitted === 0
    && emissionSourceHumanEndpointBridge.counts.scoresChanged === 0;
  const emissionSourceHumanEndpointFullDataChecksumAudited = flags.includes('emission_source_human_endpoint_full_data_checksum_audited')
    && emissionSourceHumanEndpointBridgeAudited
    && emissionSourceHumanEndpointBridge.counts.completeFileChecksums === 6
    && emissionSourceHumanEndpointBridge.fullDataChecksumAudit?.status === 'complete_public_parquet_files_checksum_pinned';
  const emissionSourceHumanEndpointCoverageAudited = flags.includes('emission_source_human_endpoint_coverage_audited')
    && emissionSourceHumanEndpointFullDataChecksumAudited
    && emissionSourceHumanEndpointBridge.coverageEnumeration?.status === 'exact_public_region_and_year_coverage_enumerated'
    && emissionSourceHumanEndpointBridge.coverage.exactRegionCounts.responsePanel === 971
    && emissionSourceHumanEndpointBridge.coverage.responseRegionsWithEveryObservedYear === 107;
  const emissionSourceHumanEndpointPooledModelReproduced = flags.includes('emission_source_human_endpoint_pooled_model_reproduced')
    && emissionSourceHumanEndpointCoverageAudited
    && emissionSourceHumanEndpointPooledModel.model.crossRuntimeValidation.status === 'passed_python_numpy_vs_base_r'
    && emissionSourceHumanEndpointPooledModel.admissionDecision.axesAdmitted === 0
    && emissionSourceHumanEndpointPooledModel.admissionDecision.scoresChanged === 0;
  const emissionSourceHumanEndpointAttributionReproduced = flags.includes('emission_source_human_endpoint_attribution_reproduced')
    && emissionSourceHumanEndpointPooledModelReproduced
    && emissionSourceHumanEndpointAttribution.status === 'pooled_factual_temperature_mortality_attribution_internally_reproduced_not_independently_validated'
    && emissionSourceHumanEndpointAttribution.inputs.pooledModelVersion === emissionSourceHumanEndpointPooledModel.version
    && emissionSourceHumanEndpointAttribution.coverage.matchedDailyTemperatureRows === 4_454_230
    && emissionSourceHumanEndpointAttribution.coverage.matchedTemperatureBinDays === 4_454_230
    && emissionSourceHumanEndpointAttribution.coverage.matchedDailyMinusBinnedDayCount === 0
    && emissionSourceHumanEndpointAttribution.validation.duplicateDailyDateRows === 0
    && emissionSourceHumanEndpointAttribution.admissionDecision.axesAdmitted === 0
    && emissionSourceHumanEndpointAttribution.admissionDecision.scoresChanged === 0;
  const emissionSourceHumanEndpointPatternScreenCompleted = flags.includes('emission_source_human_endpoint_pattern_screen_completed')
    && emissionSourceHumanEndpointAttributionReproduced
    && emissionSourceHumanEndpointPatternScreen.status === 'complete_short_record_regional_pattern_screen_not_admitted'
    && emissionSourceHumanEndpointPatternScreen.inputs.attributionVersion === emissionSourceHumanEndpointAttribution.version
    && emissionSourceHumanEndpointPatternScreen.coverage.fittedRegions === 971
    && emissionSourceHumanEndpointPatternScreen.coverage.fittedRegionYears === 22_333
    && emissionSourceHumanEndpointPatternScreen.diagnostics.negativeFullPeriodSlopes === 24
    && emissionSourceHumanEndpointPatternScreen.diagnostics.rSquaredBelowPointTwo === 76
    && emissionSourceHumanEndpointPatternScreen.diagnostics.splitHalfOppositeSigns === 22
    && emissionSourceHumanEndpointPatternScreen.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointPatternScreen.decision.scoresChanged === 0;
  const emissionSourceHumanEndpointBoundaryCrosswalkCompleted = flags.includes('emission_source_human_endpoint_boundary_crosswalk_completed')
    && emissionSourceHumanEndpointPatternScreenCompleted
    && emissionSourceHumanEndpointRegionalBoundaries.status === 'complete_all_response_regions_resolved_to_official_gisco_boundaries'
    && emissionSourceHumanEndpointRegionalBoundaries.coverage.resolvedRegions === 971
    && emissionSourceHumanEndpointRegionalBoundaries.coverage.missingRegions.length === 0
    && emissionSourceHumanEndpointRegionalBoundaries.coverage.invalidGeometries === 0
    && emissionSourceHumanEndpointRegionalBoundaries.coverage.emptyGeometries === 0
    && emissionSourceHumanEndpointRegionalBoundaries.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointRegionalBoundaries.decision.scoresChanged === 0;
  const emissionSourceHumanEndpointLongRecordRetrievalPlanned = flags.includes('emission_source_human_endpoint_long_record_retrieval_planned')
    && emissionSourceHumanEndpointBoundaryCrosswalkCompleted
    && emissionSourceHumanEndpointLongRecordPlan.status === 'complete_sparse_long_record_read_plan_execution_pending'
    && emissionSourceHumanEndpointLongRecordPlan.scope.regions === 971
    && emissionSourceHumanEndpointLongRecordPlan.sparsePlan.spatialChunkKeys === 13_970
    && emissionSourceHumanEndpointLongRecordPlan.sparsePlan.totalRangeChunks === 6_118_860
    && emissionSourceHumanEndpointLongRecordPlan.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointLongRecordPlan.decision.scoresChanged === 0;
  const emissionSourceHumanEndpointAreaWeightsCompleted = flags.includes('emission_source_human_endpoint_area_weights_completed')
    && emissionSourceHumanEndpointLongRecordRetrievalPlanned
    && emissionSourceHumanEndpointAreaWeights.status === 'complete_sparse_area_intersection_weights_for_all_response_regions'
    && emissionSourceHumanEndpointAreaWeights.coverage.regions === 971
    && emissionSourceHumanEndpointAreaWeights.coverage.regionsWithoutWeights === 0
    && emissionSourceHumanEndpointAreaWeights.coverage.weightedGridCells === 68_733
    && emissionSourceHumanEndpointAreaWeights.coverage.cellRegionIntersections === 88_155
    && emissionSourceHumanEndpointAreaWeights.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointAreaWeights.decision.scoresChanged === 0;
  const emissionSourceHumanEndpointLongRecordRetrievalStarted = flags.includes('emission_source_human_endpoint_long_record_retrieval_started')
    && emissionSourceHumanEndpointAreaWeightsCompleted
    && ['partial_resumable_long_record_retrieval', 'complete_all_70883_region_year_summer_means_execution_validation_pending'].includes(emissionSourceHumanEndpointLongRecordRetrieval.status)
    && emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount >= 1
    && emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount <= 73
    && emissionSourceHumanEndpointLongRecordRetrieval.execution.regionYearRows === emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount * 971
    && emissionSourceHumanEndpointLongRecordRetrieval.execution.remainingYears.length === 73 - emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount
    && emissionSourceHumanEndpointLongRecordRetrieval.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointLongRecordRetrieval.decision.scoresChanged === 0;
  const emissionSourceHumanEndpointLongRecordPatternAnalyzed = Boolean(emissionSourceHumanEndpointLongRecordPatternAnalysis)
    && flags.includes('emission_source_human_endpoint_long_record_pattern_analyzed')
    && emissionSourceHumanEndpointLongRecordRetrievalStarted
    && emissionSourceHumanEndpointLongRecordPatternAnalysis.status === 'complete_long_record_pattern_stability_challenge_independent_comparison_pending'
    && emissionSourceHumanEndpointLongRecordPatternAnalysis.inputs.retrievalDigest === emissionSourceHumanEndpointLongRecordRetrieval.digest
    && emissionSourceHumanEndpointLongRecordPatternAnalysis.diagnostics.responseRegions === 971
    && emissionSourceHumanEndpointLongRecordPatternAnalysis.diagnostics.responseRegionYears === 70_883
    && emissionSourceHumanEndpointLongRecordPatternAnalysis.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointLongRecordPatternAnalysis.decision.scoresChanged === 0;
  const emissionSourceHumanEndpointMonthlyPatternAnalyzed = Boolean(emissionSourceHumanEndpointMonthlyPatternAnalysis)
    && flags.includes('emission_source_human_endpoint_monthly_pattern_analysis_completed')
    && emissionSourceHumanEndpointMonthlyPatternAnalysis.status === 'complete_monthly_independent_pattern_ensemble'
    && emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.models === 22
    && emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.institutions === 17
    && emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.modelRegionFits === 42_724
    && emissionSourceHumanEndpointMonthlyPatternAnalysis.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointMonthlyPatternAnalysis.decision.scoresChanged === 0;
  const emissionSourceHumanEndpointExactWeekPatternAnalyzed = Boolean(emissionSourceHumanEndpointExactWeekPatternAnalysis)
    && flags.includes('emission_source_human_endpoint_exact_week_pattern_analysis_completed')
    && emissionSourceHumanEndpointMonthlyPatternAnalyzed
    && emissionSourceHumanEndpointExactWeekPatternAnalysis.status === 'complete_exact_week_independent_pattern_ensemble'
    && emissionSourceHumanEndpointExactWeekPatternAnalysis.inputs.monthlyAnalysisDigest === emissionSourceHumanEndpointMonthlyPatternAnalysis.digest
    && emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.models === 29
    && emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.institutions === 21
    && emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.modelRegionFits === 28_159
    && emissionSourceHumanEndpointExactWeekPatternAnalysis.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointExactWeekPatternAnalysis.decision.scoresChanged === 0;
  const emissionSourceHumanEndpointRegionalPatternPromotionDecided = Boolean(emissionSourceHumanEndpointRegionalPatternPromotion)
    && flags.includes('emission_source_human_endpoint_regional_pattern_promotion_decided')
    && emissionSourceHumanEndpointLongRecordPatternAnalyzed
    && emissionSourceHumanEndpointMonthlyPatternAnalyzed
    && emissionSourceHumanEndpointExactWeekPatternAnalyzed
    && emissionSourceHumanEndpointRegionalPatternPromotion.inputs.era5PatternDigest === emissionSourceHumanEndpointLongRecordPatternAnalysis.digest
    && emissionSourceHumanEndpointRegionalPatternPromotion.inputs.monthlyIndependentPatternDigest === emissionSourceHumanEndpointMonthlyPatternAnalysis.digest
    && emissionSourceHumanEndpointRegionalPatternPromotion.inputs.exactWeekIndependentPatternDigest === emissionSourceHumanEndpointExactWeekPatternAnalysis.digest
    && emissionSourceHumanEndpointRegionalPatternPromotion.counts.frozenTests === 30
    && emissionSourceHumanEndpointRegionalPatternPromotion.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointRegionalPatternPromotion.decision.scoresChanged === 0;
  const matchedEndpoint = matchedSourceRemovalEndpointById.get(row.nodeId);
  const emissionSourceHumanEndpointMatchedSourceRemovalCompleted = Boolean(emissionSourceHumanEndpointMatchedSourceRemoval)
    && flags.includes('emission_source_human_endpoint_matched_source_removal_completed')
    && emissionSourceHumanEndpointRegionalPatternPromotionDecided
    && emissionSourceHumanEndpointMatchedSourceRemoval.inputs.promotionDigest === emissionSourceHumanEndpointRegionalPatternPromotion.digest
    && emissionSourceHumanEndpointMatchedSourceRemoval.inputs.patternDigest === emissionSourceHumanEndpointLongRecordPatternAnalysis.digest
    && emissionSourceHumanEndpointMatchedSourceRemoval.coverage.sourceNodes === 21
    && emissionSourceHumanEndpointMatchedSourceRemoval.coverage.regions === 971
    && emissionSourceHumanEndpointMatchedSourceRemoval.coverage.bootstrapFits === 100
    && emissionSourceHumanEndpointMatchedSourceRemoval.decision.humanEndpointCompleted === true
    && emissionSourceHumanEndpointMatchedSourceRemoval.decision.ecosystemEndpointCompleted === false
    && emissionSourceHumanEndpointMatchedSourceRemoval.decision.axesAdmitted === 0
    && emissionSourceHumanEndpointMatchedSourceRemoval.decision.scoresChanged === 0
    && matchedEndpoint?.admissionDecision?.axesAdmitted === 0
    && matchedEndpoint?.admissionDecision?.scoresChanged === 0;
  const emissionSourceHistoryBoundaryAudited = flags.includes('emission_source_history_boundary_audited');
  const gradeSpan = audited.uncertaintyGrades.span;
  const detailed = row.candidate.decisionTrace?.method === 'detailed_evidence_review';
  const sourceAsOf = row.candidate.decisionTrace?.latestCompatibleEvidenceYear ?? record.evidenceAudit?.sourceAsOf ?? null;
  const sourceRefreshAction = oldEvidence
    ? `Refresh the newest compatible consequence evidence; the admitted evidence currently ends at ${sourceAsOf ?? 'an undated source'}.`
    : null;
  const fallbackAction = row.result.confidence === 'D'
    ? 'Replace family analogues with a node-specific measurement or a documented quantitative conversion.'
    : null;
  const semanticAction = ecosystemPercentageNeedsSemanticReview
    ? `Apply the completed ${percentageSemanticsById.get(row.nodeId)?.semanticClass?.replaceAll('_', ' ') ?? 'measurement'} classification: ${percentageSemanticsById.get(row.nodeId)?.scoringDisposition ?? 'route the measurement to its compatible evidence role.'}`
    : null;
  const traceAction = retainedPilotTraceMissing
    ? 'Write the authoritative source-to-axis trace for the retained pilot rating; the rejected blind comparison is not evidence for the retained number.'
    : null;
  const endpointCalibrationAction = emissionSourceEndpointNotCalibrated
    ? emissionSourceHumanEndpointMatchedSourceRemovalCompleted
      ? emissionSourceHumanEndpointMatchedSourceRemoval.decision.nextGate
      : emissionSourceHumanEndpointRegionalPatternPromotionDecided
      ? emissionSourceHumanEndpointRegionalPatternPromotion.decision.nextGate
      : emissionSourceHumanEndpointExactWeekPatternAnalyzed
        ? emissionSourceHumanEndpointExactWeekPatternAnalysis.decision.nextGate
      : emissionSourceHumanEndpointMonthlyPatternAnalyzed
        ? emissionSourceHumanEndpointMonthlyPatternAnalysis.decision.nextGate
      : emissionSourceHumanEndpointLongRecordPatternAnalyzed
      ? emissionSourceHumanEndpointLongRecordPatternAnalysis.decision.nextGate
      : emissionSourceHumanEndpointLongRecordRetrievalStarted
      ? emissionSourceHumanEndpointLongRecordRetrieval.decision.nextGate
      : emissionSourceHumanEndpointAreaWeightsCompleted
        ? emissionSourceHumanEndpointAreaWeights.decision.nextGate
      : emissionSourceHumanEndpointBoundaryCrosswalkCompleted
        ? emissionSourceHumanEndpointRegionalBoundaries.decision.nextGate
      : emissionSourceHumanEndpointPatternScreenCompleted
        ? emissionSourceHumanEndpointPatternScreen.decision.nextGate
      : emissionSourceHumanEndpointAttributionReproduced
      ? emissionSourceHumanEndpointAttribution.admissionDecision.nextGate
      : emissionSourceHumanEndpointPooledModelReproduced
        ? emissionSourceHumanEndpointPooledModel.admissionDecision.nextGate
      : emissionSourceHumanEndpointBridgeAudited
        ? emissionSourceHumanEndpointBridge.admissionDecision.nextGate
      : emissionSourceAxisAdmissionAudited
      ? emissionSourceAxisAdmission.decision.nextGate
      : 'Complete and calibrate the matched source-removal human and ecosystem endpoints; the current confidence-D family candidate is not responsive to the existing source-specific sensitivity.'
    : null;
  const historyBoundaryAction = emissionSourceHistoryBoundaryAudited
    ? row.candidate.causalAllocation.sourceHistoryFeasibility?.nextRequiredData
    : null;
  const actions = [endpointCalibrationAction, historyBoundaryAction, traceAction, semanticAction, sourceRefreshAction, fallbackAction, ...unresolvedAxes.map(gap => gap.action)].filter(Boolean);
  let priorityScore = gradeSpan * 30 + (nearBoundary ? 25 : 0) + (oldEvidence ? 20 : 0)
    + (row.result.confidence === 'D' ? 30 : row.result.confidence === 'C' ? 15 : 0)
    + (row.result.grade.letter === 'E' ? 15 : row.result.grade.letter === 'D' ? 8 : 0)
    + (ecosystemPercentageNeedsSemanticReview ? 15 : 0)
    + (retainedPilotTraceMissing ? 20 : 0)
    + (emissionSourceEndpointNotCalibrated ? 25 : 0)
    + unresolvedAxes.length * 3;
  if (detailed && gradeSpan === 0 && !oldEvidence) priorityScore = 0;
  const stage = priorityScore >= 150 ? 'P0' : priorityScore >= 120 ? 'P1' : priorityScore >= 80 ? 'P2' : 'P3';
  return {
    nodeId: row.nodeId,
    name: row.name,
    currentValue: row.result.value,
    currentGrade: row.result.grade.letter,
    confidence: row.result.confidence,
    uncertaintyLower: row.result.uncertainty.lower,
    uncertaintyUpper: row.result.uncertainty.upper,
    lowerGrade: audited.uncertaintyGrades.lower,
    upperGrade: audited.uncertaintyGrades.upper,
    gradeSpan,
    stableLetter: gradeSpan === 0,
    nearBoundary,
    ecosystemPercentageNeedsSemanticReview,
    retainedPilotTraceMissing,
    emissionSourceEndpointNotCalibrated,
    emissionSourceAxisAdmissionAudited,
    emissionSourceHumanEndpointBridgeAudited,
    emissionSourceHumanEndpointFullDataChecksumAudited,
    emissionSourceHumanEndpointCoverageAudited,
    emissionSourceHumanEndpointPooledModelReproduced,
    emissionSourceHumanEndpointAttributionReproduced,
    emissionSourceHumanEndpointPatternScreenCompleted,
    emissionSourceHumanEndpointBoundaryCrosswalkCompleted,
    emissionSourceHumanEndpointLongRecordRetrievalPlanned,
    emissionSourceHumanEndpointAreaWeightsCompleted,
    emissionSourceHumanEndpointLongRecordRetrievalStarted,
    emissionSourceHumanEndpointLongRecordPatternAnalyzed,
    emissionSourceHumanEndpointMonthlyPatternAnalyzed,
    emissionSourceHumanEndpointExactWeekPatternAnalyzed,
    emissionSourceHumanEndpointRegionalPatternPromotionDecided,
    emissionSourceHumanEndpointMatchedSourceRemovalCompleted,
    emissionSourceHistoryBoundaryAudited,
    oldEvidence,
    detailedEvidenceReview: detailed,
    assessmentMode: row.candidate.decisionTrace?.method,
    sourceAsOf,
    sourceIds: [...new Set(dimensions.flatMap(dimension => row.candidate.components?.[dimension]?.evidenceReferences ?? []))],
    unresolvedAxes,
    actions: [...new Set(actions)],
    priorityScore,
    stage,
    campaignStatus: detailed && gradeSpan === 0 && !oldEvidence
      ? 'stable_after_detailed_review'
      : 'certainty_work_queued',
  };
}).sort((left, right) => right.priorityScore - left.priorityScore
  || right.gradeSpan - left.gradeSpan || right.currentValue - left.currentValue || left.nodeId.localeCompare(right.nodeId));

const counts = {
  issues: rows.length,
  stableLetters: rows.filter(row => row.stableLetter).length,
  unstableLetters: rows.filter(row => !row.stableLetter).length,
  detailedEvidenceReviews: rows.filter(row => row.detailedEvidenceReview).length,
  stableAfterDetailedReview: rows.filter(row => row.campaignStatus === 'stable_after_detailed_review').length,
  oldEvidence: rows.filter(row => row.oldEvidence).length,
  nearBoundary: rows.filter(row => row.nearBoundary).length,
  confidenceD: rows.filter(row => row.confidence === 'D').length,
  ecosystemPercentageSemanticReviews: rows.filter(row => row.ecosystemPercentageNeedsSemanticReview).length,
  retainedPilotTraceReviews: rows.filter(row => row.retainedPilotTraceMissing).length,
  emissionSourceEndpointCalibrationReviews: rows.filter(row => row.emissionSourceEndpointNotCalibrated).length,
  emissionSourceAxisAdmissionAudits: rows.filter(row => row.emissionSourceAxisAdmissionAudited).length,
  emissionSourceHumanEndpointBridgeAudits: rows.filter(row => row.emissionSourceHumanEndpointBridgeAudited).length,
  emissionSourceHumanEndpointFullDataChecksumAudits: rows.filter(row => row.emissionSourceHumanEndpointFullDataChecksumAudited).length,
  emissionSourceHumanEndpointCoverageAudits: rows.filter(row => row.emissionSourceHumanEndpointCoverageAudited).length,
  emissionSourceHumanEndpointPooledModelReproductions: rows.filter(row => row.emissionSourceHumanEndpointPooledModelReproduced).length,
  emissionSourceHumanEndpointAttributionReproductions: rows.filter(row => row.emissionSourceHumanEndpointAttributionReproduced).length,
  emissionSourceHumanEndpointPatternScreens: rows.filter(row => row.emissionSourceHumanEndpointPatternScreenCompleted).length,
  emissionSourceHumanEndpointBoundaryCrosswalks: rows.filter(row => row.emissionSourceHumanEndpointBoundaryCrosswalkCompleted).length,
  emissionSourceHumanEndpointLongRecordRetrievalPlans: rows.filter(row => row.emissionSourceHumanEndpointLongRecordRetrievalPlanned).length,
  emissionSourceHumanEndpointAreaWeightSets: rows.filter(row => row.emissionSourceHumanEndpointAreaWeightsCompleted).length,
  emissionSourceHumanEndpointLongRecordRetrievalsStarted: rows.filter(row => row.emissionSourceHumanEndpointLongRecordRetrievalStarted).length,
  emissionSourceHumanEndpointLongRecordPatternAnalyses: rows.filter(row => row.emissionSourceHumanEndpointLongRecordPatternAnalyzed).length,
  emissionSourceHumanEndpointMonthlyPatternAnalyses: rows.filter(row => row.emissionSourceHumanEndpointMonthlyPatternAnalyzed).length,
  emissionSourceHumanEndpointExactWeekPatternAnalyses: rows.filter(row => row.emissionSourceHumanEndpointExactWeekPatternAnalyzed).length,
  emissionSourceHumanEndpointRegionalPatternPromotionDecisions: rows.filter(row => row.emissionSourceHumanEndpointRegionalPatternPromotionDecided).length,
  emissionSourceHumanEndpointMatchedSourceRemovalEndpoints: rows.filter(row => row.emissionSourceHumanEndpointMatchedSourceRemovalCompleted).length,
  emissionSourceHistoryBoundaryAudits: rows.filter(row => row.emissionSourceHistoryBoundaryAudited).length,
  stages: Object.fromEntries(['P0', 'P1', 'P2', 'P3'].map(stage => [stage, rows.filter(row => row.stage === stage).length])),
  unresolvedAxes: rows.reduce((sum, row) => sum + row.unresolvedAxes.length, 0),
};

const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csvRows = [[
  'Priority', 'Priority score', 'Node ID', 'Node', 'Value', 'Grade', 'Confidence', 'Lower', 'Upper',
  'Lower grade', 'Upper grade', 'Grade span', 'Stable letter', 'Near boundary', 'Old evidence', 'Ecosystem percentage semantic review', 'Retained pilot trace review', 'Emission source endpoint calibration review', 'Emission source axis admission audit', 'Emission source human endpoint bridge audit', 'Emission source human endpoint full-data checksum audit', 'Emission source human endpoint coverage audit', 'Emission source human endpoint pooled-model reproduction', 'Emission source human endpoint factual-attribution reproduction', 'Emission source human endpoint short-record pattern screen', 'Emission source human endpoint boundary crosswalk', 'Emission source human endpoint long-record retrieval plan', 'Emission source human endpoint regional area weights', 'Emission source human endpoint long-record retrieval started', 'Emission source human endpoint long-record pattern analysis', 'Emission source human endpoint monthly pattern analysis', 'Emission source human endpoint exact-week pattern analysis', 'Emission source human endpoint regional-pattern promotion decision', 'Emission source matched source-removal human endpoint', 'Emission source history boundary audit',
  'Review mode', 'Source as of', 'Unresolved axes', 'Required work', 'Sources',
], ...rows.map(row => [
  row.stage, row.priorityScore, row.nodeId, row.name, row.currentValue, row.currentGrade, row.confidence,
  row.uncertaintyLower, row.uncertaintyUpper, row.lowerGrade, row.upperGrade, row.gradeSpan,
  row.stableLetter, row.nearBoundary, row.oldEvidence, row.ecosystemPercentageNeedsSemanticReview, row.retainedPilotTraceMissing, row.emissionSourceEndpointNotCalibrated, row.emissionSourceAxisAdmissionAudited, row.emissionSourceHumanEndpointBridgeAudited, row.emissionSourceHumanEndpointFullDataChecksumAudited, row.emissionSourceHumanEndpointCoverageAudited, row.emissionSourceHumanEndpointPooledModelReproduced, row.emissionSourceHumanEndpointAttributionReproduced, row.emissionSourceHumanEndpointPatternScreenCompleted, row.emissionSourceHumanEndpointBoundaryCrosswalkCompleted, row.emissionSourceHumanEndpointLongRecordRetrievalPlanned, row.emissionSourceHumanEndpointAreaWeightsCompleted, row.emissionSourceHumanEndpointLongRecordRetrievalStarted, row.emissionSourceHumanEndpointLongRecordPatternAnalyzed, row.emissionSourceHumanEndpointMonthlyPatternAnalyzed, row.emissionSourceHumanEndpointExactWeekPatternAnalyzed, row.emissionSourceHumanEndpointRegionalPatternPromotionDecided, row.emissionSourceHumanEndpointMatchedSourceRemovalCompleted, row.emissionSourceHistoryBoundaryAudited, row.assessmentMode, row.sourceAsOf,
  row.unresolvedAxes.map(item => `${item.dimension}.${item.axis}:${item.lower}-${item.upper}`).join('; '),
  row.actions.join(' | '), row.sourceIds.join('; '),
])];

const top = rows.filter(row => row.campaignStatus === 'certainty_work_queued').slice(0, 40);
const report = `# TULIP rating-certainty campaign\n\nStarted 22 September 2026 and updated 27 September 2026 from the twice-audited 354-node internal catalogue. This queue targets the evidence that can change or stabilize a displayed letter. It does not reward source volume.\n\n## Current position\n\n- Stable letters within recorded bounds: ${counts.stableLetters}\n- Letters still crossing at least one band: ${counts.unstableLetters}\n- Detailed evidence adjudications completed: ${counts.detailedEvidenceReviews}\n- Detailed and stable with current evidence: ${counts.stableAfterDetailedReview}\n- Nodes using evidence ending before 2021: ${counts.oldEvidence}\n- Nodes within 0.2 score points of a threshold: ${counts.nearBoundary}\n- Family-calibrated confidence-D nodes: ${counts.confidenceD}\n- Unresolved axis bounds: ${counts.unresolvedAxes}\n- Queue: ${Object.entries(counts.stages).map(([stage, count]) => `${stage} ${count}`).join(', ')}\n\n## Admission rule\n\nA letter is stable only when the lower, central and upper calculations all remain in the same A–E band. A new source narrows a bound only when it measures the relevant terminal consequence, affected population or ecosystem denominator, or consequence/recovery duration. Observation length, source count, graph position and physical anomaly alone do not narrow harm uncertainty.\n\n## First 40 queued nodes\n\n| Priority | Node | Current | Range | Confidence | Required work |\n| --- | --- | ---: | --- | --- | --- |\n${top.map(row => `| ${row.stage} | ${row.name} | ${row.currentGrade} ${row.currentValue} | ${row.lowerGrade}–${row.upperGrade} | ${row.confidence} | ${row.actions[0] ?? 'Complete node-specific adjudication.'} |`).join('\n')}\n`;
const completeReport = report.replace(
  '\n- Unresolved axis bounds:',
  `\n- Ecosystem percentages awaiting semantic classification: ${counts.ecosystemPercentageSemanticReviews}\n- Retained pilot ratings awaiting authoritative per-axis traces: ${counts.retainedPilotTraceReviews}\n- Emission-source candidates awaiting endpoint calibration: ${counts.emissionSourceEndpointCalibrationReviews}\n- Emission-source candidates with completed fixed-axis admission audits: ${counts.emissionSourceAxisAdmissionAudits}\n- Emission-source candidates with audited independent human-endpoint bridge inputs: ${counts.emissionSourceHumanEndpointBridgeAudits}\n- Emission-source candidates with complete bridge-data checksums: ${counts.emissionSourceHumanEndpointFullDataChecksumAudits}\n- Emission-source candidates with exact bridge-panel coverage: ${counts.emissionSourceHumanEndpointCoverageAudits}\n- Emission-source candidates with cross-runtime pooled-model reproduction: ${counts.emissionSourceHumanEndpointPooledModelReproductions}\n- Emission-source candidates with reproduced factual temperature-attribution endpoints: ${counts.emissionSourceHumanEndpointAttributionReproductions}\n- Emission-source candidates with completed short-record regional-pattern screens: ${counts.emissionSourceHumanEndpointPatternScreens}\n- Emission-source candidates with complete regional-boundary crosswalks: ${counts.emissionSourceHumanEndpointBoundaryCrosswalks}\n- Emission-source candidates with sparse long-record retrieval plans: ${counts.emissionSourceHumanEndpointLongRecordRetrievalPlans}\n- Emission-source candidates with complete regional area weights: ${counts.emissionSourceHumanEndpointAreaWeightSets}\n- Emission-source candidates with resumable long-record retrieval started: ${counts.emissionSourceHumanEndpointLongRecordRetrievalsStarted}\n- Emission-source candidates with complete long-record pattern analysis: ${counts.emissionSourceHumanEndpointLongRecordPatternAnalyses}\n- Emission-source candidates with complete monthly independent-pattern analysis: ${counts.emissionSourceHumanEndpointMonthlyPatternAnalyses}\n- Emission-source candidates with complete exact-week independent-pattern analysis: ${counts.emissionSourceHumanEndpointExactWeekPatternAnalyses}\n- Emission-source candidates with a frozen regional-pattern promotion decision: ${counts.emissionSourceHumanEndpointRegionalPatternPromotionDecisions}\n- Emission-source candidates with a matched source-removal human endpoint: ${counts.emissionSourceHumanEndpointMatchedSourceRemovalEndpoints}\n- Remaining emission-source histories with completed boundary audits: ${counts.emissionSourceHistoryBoundaryAudits}\n- Unresolved axis bounds:`,
);

await Promise.all([
  writeFile(resolve(outDir, 'internal-certainty-campaign.json'), JSON.stringify({
  version: 'tulip_internal_certainty_campaign_2026_09_27_v89',
    preparedOn: '2026-09-22',
    updatedOn: '2026-09-27',
    status: 'active',
    counts,
    rows,
  }, null, 2) + '\n'),
  writeFile(resolve(outDir, 'internal-certainty-campaign.csv'), csvRows.map(row => row.map(csvCell).join(',')).join('\n') + '\n'),
  writeFile(resolve(outDir, 'internal-certainty-campaign-report.md'), completeReport),
]);

console.log(JSON.stringify(counts, null, 2));
