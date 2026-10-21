import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PUBLISHED_NODES } from '../src/data.js';
import { evaluateInternalTulipCandidate } from '../src/tulip-internal-calibration.js';

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
const [catalogue, registry, policy, certaintySupplements, firstPass, emissionSourceResponsiveness, emissionSourceAxisAdmission, emissionSourceHumanEndpointBridge, emissionSourceHumanEndpointChecksums, emissionSourceHumanEndpointCoverage, emissionSourceHumanEndpointPooledModel, emissionSourceHumanEndpointAttribution, emissionSourceHumanEndpointPatternScreen, emissionSourceHumanEndpointRegionalBoundaries, emissionSourceHumanEndpointLongRecordPlan, emissionSourceHumanEndpointAreaWeights, emissionSourceHumanEndpointLongRecordRetrieval, emissionSourceHumanEndpointLongRecordPatternAnalysis, emissionSourceHumanEndpointMonthlyPatternAnalysis, emissionSourceHumanEndpointExactWeekPatternAnalysis, emissionSourceHumanEndpointRegionalPatternPromotion, emissionSourceHumanEndpointMatchedSourceRemoval, emissionSourceHistoryFeasibility] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json'),
  json('public/tulip-assessments.json'),
  json('src/tulip-score-policy.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-certainty-source-supplements.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-all-node-first-pass-candidates.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-emission-source-score-responsiveness-audit.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-emission-source-axis-admission-audit.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-bridge-reference-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-full-data-checksums.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-coverage-enumeration.json'),
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
  json('artifacts/tulip-calibration-2026-09-22/internal-emission-source-history-feasibility.json'),
]);

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const close = (left, right) => Math.abs(left - right) < 1e-12;
const round1 = value => Math.round((value + 1e-9) * 10) / 10;
const axes = ['severity', 'reach', 'persistence'];
const dimensions = ['human', 'ecosystem'];
const gradeBands = [
  { letter: 'A', minimum: 0, maximumExclusive: 0.2 },
  { letter: 'B', minimum: 0.2, maximumExclusive: 0.4 },
  { letter: 'C', minimum: 0.4, maximumExclusive: 0.6 },
  { letter: 'D', minimum: 0.6, maximumExclusive: 0.8 },
  { letter: 'E', minimum: 0.8, maximumExclusive: 1.0000001 },
];
const gradeForIndex = index => gradeBands.find(band => index >= band.minimum && index < band.maximumExclusive)?.letter ?? null;
const gradeForScore = score => gradeForIndex((score - 1) / 9);
const componentIndex = values => axes.reduce((sum, axis) => sum + values[axis], 0) / 12;
const sourceIds = record => new Set((record.evidenceReferences ?? []).map(reference => reference.id));
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const titleAsEvidencePattern = /(?:node|title|name).{0,80}(?:collapse|extinction).{0,80}(?:supports|proves|establishes|therefore|level\s*4)/i;
const contextAsEvidencePattern = /(?:context[- ]only|unscored_context|excluded context).{0,100}(?:supports|proves|establishes|maps? to|level\s*[0-4])/i;
const observationAsPersistencePattern = /(?:observation|monitoring|assessment|comparison|record)[- ](?:window|period|duration).{0,100}(?:supports|proves|establishes|maps? to|persistence level)/i;
const percentageTokens = value => new Set([...String(value ?? '').matchAll(/\b\d+(?:\.\d+)?%/g)].map(match => match[0]));
const approvedConsequenceDurationPathPattern = /(?:recovery.*year|impact.*duration.*year|consequence.*duration.*year|elevated.*(?:incidence|impact|effect).*duration.*year|measured_(?:effect|geochemical_signature)_persistence_years)/;
const excludedDurationContextPattern = /observation|observed|assessment|comparison|record|monitor|window|start|end|anchor|latest|reference|count|period|context|unscored|excluded/;

function numericFacts(value, path = '', facts = []) {
  if (typeof value === 'number' && Number.isFinite(value)) facts.push({ path: path.toLowerCase(), value });
  else if (Array.isArray(value)) value.forEach((item, index) => numericFacts(item, `${path}[${index}]`, facts));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) numericFacts(item, path ? `${path}.${key}` : key, facts);
  }
  return facts;
}

function recordNumericFacts(record) {
  const excludedRoles = new Set(['peer_calibration', 'reviewed_contract_factors', 'vector_exclusion', 'operational_lineage', 'unscored_context', 'source_snapshot', 'source_snapshots']);
  return (record?.evidenceAudit?.observations ?? [])
    .filter(observation => !excludedRoles.has(observation.role))
    .flatMap(observation => numericFacts(observation.value));
}

function ambiguousPersistenceValues(record) {
  return recordNumericFacts(record).filter(fact => /persistence_years/.test(fact.path)
    && !approvedConsequenceDurationPathPattern.test(fact.path)
    && !excludedDurationContextPattern.test(fact.path))
    .map(fact => fact.value);
}

function approvedConsequenceDurationValues(record) {
  return recordNumericFacts(record).filter(fact => approvedConsequenceDurationPathPattern.test(fact.path)
    && !excludedDurationContextPattern.test(fact.path))
    .map(fact => fact.value);
}

const nodesById = new Map(PUBLISHED_NODES.map(node => [node.id, node]));
const issueRowsById = new Map(catalogue.issues.map(row => [row.nodeId, row]));
const firstPassById = new Map(firstPass.issues.map(row => [row.nodeId, row]));
const responseRowsById = new Map(catalogue.responses.map(row => [row.nodeId, row]));
const endpointResponsivenessNodeIds = new Set(emissionSourceResponsiveness.rows.map(row => row.nodeId));
const endpointAxisAdmissionById = new Map(emissionSourceAxisAdmission.rows.map(row => [row.nodeId, row]));
const endpointBridgeNodeIds = new Set(emissionSourceHumanEndpointBridge.affectedNodeIds);
const matchedSourceRemovalEndpointById = new Map((emissionSourceHumanEndpointMatchedSourceRemoval?.results ?? []).map(row => [row.nodeId, row]));
const historyBoundaryAuditNodeIds = new Set(emissionSourceHistoryFeasibility.rows.map(row => row.nodeId));
const allRows = [...catalogue.issues, ...catalogue.responses];
const globalErrors = [];
if (PUBLISHED_NODES.length !== 381) globalErrors.push(`published_node_count:${PUBLISHED_NODES.length}`);
if (catalogue.issues.length !== 354) globalErrors.push(`issue_count:${catalogue.issues.length}`);
if (catalogue.responses.length !== 27) globalErrors.push(`response_count:${catalogue.responses.length}`);
if (new Set(allRows.map(row => row.nodeId)).size !== allRows.length) globalErrors.push('duplicate_catalogue_rows');
if (emissionSourceResponsiveness.status !== 'provisional_scores_not_source_responsive') globalErrors.push('emission_source_responsiveness_status_mismatch');
if (emissionSourceResponsiveness.counts.nodes !== 21) globalErrors.push(`emission_source_responsiveness_count:${emissionSourceResponsiveness.counts.nodes}`);
if (emissionSourceAxisAdmission.status !== 'partial_endpoint_fails_axis_admission_and_literal_anchors_collapse') globalErrors.push('emission_source_axis_admission_status_mismatch');
if (emissionSourceAxisAdmission.counts.nodes !== 21) globalErrors.push(`emission_source_axis_admission_count:${emissionSourceAxisAdmission.counts.nodes}`);
if (emissionSourceAxisAdmission.counts.currentCandidatesChanged !== 0) globalErrors.push(`emission_source_axis_admission_changed_candidates:${emissionSourceAxisAdmission.counts.currentCandidatesChanged}`);
if (emissionSourceHumanEndpointBridge.status !== 'candidate_independent_human_endpoint_bridge_not_admitted') globalErrors.push('emission_source_human_endpoint_bridge_status_mismatch');
if (emissionSourceHumanEndpointBridge.counts.affectedEmissionSourceNodes !== 21) globalErrors.push(`emission_source_human_endpoint_bridge_count:${emissionSourceHumanEndpointBridge.counts.affectedEmissionSourceNodes}`);
if (emissionSourceHumanEndpointBridge.counts.scoresChanged !== 0 || emissionSourceHumanEndpointBridge.counts.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_bridge_admission_boundary_mismatch');
if (emissionSourceHumanEndpointChecksums.status !== 'complete_public_parquet_files_checksum_pinned') globalErrors.push('emission_source_human_endpoint_checksum_status_mismatch');
if (emissionSourceHumanEndpointChecksums.counts.completeSha256Checksums !== 6) globalErrors.push(`emission_source_human_endpoint_checksum_count:${emissionSourceHumanEndpointChecksums.counts.completeSha256Checksums}`);
if (emissionSourceHumanEndpointChecksums.counts.scoresChanged !== 0 || emissionSourceHumanEndpointChecksums.counts.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_checksum_admission_boundary_mismatch');
if (emissionSourceHumanEndpointCoverage.status !== 'exact_public_region_and_year_coverage_enumerated') globalErrors.push('emission_source_human_endpoint_coverage_status_mismatch');
if (emissionSourceHumanEndpointCoverage.counts.responsePanelUniqueRegions !== 971 || emissionSourceHumanEndpointCoverage.files.fullPanel.regionsWithEveryObservedYear !== 107) globalErrors.push('emission_source_human_endpoint_coverage_count_mismatch');
if (emissionSourceHumanEndpointCoverage.counts.scoresChanged !== 0 || emissionSourceHumanEndpointCoverage.counts.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_coverage_admission_boundary_mismatch');
if (emissionSourceHumanEndpointPooledModel.status !== 'central_pooled_model_internally_reproduced_not_independently_validated') globalErrors.push('emission_source_human_endpoint_pooled_model_status_mismatch');
if (emissionSourceHumanEndpointPooledModel.model.crossRuntimeValidation.status !== 'passed_python_numpy_vs_base_r') globalErrors.push('emission_source_human_endpoint_pooled_model_cross_runtime_mismatch');
if (emissionSourceHumanEndpointPooledModel.model.panel.modelRows !== 676_689 || emissionSourceHumanEndpointPooledModel.model.fit.rank !== 24) globalErrors.push('emission_source_human_endpoint_pooled_model_shape_mismatch');
if (emissionSourceHumanEndpointPooledModel.admissionDecision.scoresChanged !== 0 || emissionSourceHumanEndpointPooledModel.admissionDecision.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_pooled_model_admission_boundary_mismatch');
if (emissionSourceHumanEndpointAttribution.status !== 'pooled_factual_temperature_mortality_attribution_internally_reproduced_not_independently_validated') globalErrors.push('emission_source_human_endpoint_attribution_status_mismatch');
if (emissionSourceHumanEndpointAttribution.inputs.pooledModelVersion !== emissionSourceHumanEndpointPooledModel.version) globalErrors.push('emission_source_human_endpoint_attribution_model_version_mismatch');
if (emissionSourceHumanEndpointAttribution.coverage.matchedDailyTemperatureRows !== 4_454_230
  || emissionSourceHumanEndpointAttribution.coverage.matchedTemperatureBinDays !== 4_454_230
  || emissionSourceHumanEndpointAttribution.coverage.matchedDailyMinusBinnedDayCount !== 0) globalErrors.push('emission_source_human_endpoint_attribution_coverage_mismatch');
if (emissionSourceHumanEndpointAttribution.validation.duplicateDailyDateRows !== 0
  || emissionSourceHumanEndpointAttribution.validation.dailyDateOrderViolations !== 0) globalErrors.push('emission_source_human_endpoint_attribution_daily_data_mismatch');
if (emissionSourceHumanEndpointAttribution.admissionDecision.scoresChanged !== 0
  || emissionSourceHumanEndpointAttribution.admissionDecision.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_attribution_admission_boundary_mismatch');
if (emissionSourceHumanEndpointPatternScreen.status !== 'complete_short_record_regional_pattern_screen_not_admitted') globalErrors.push('emission_source_human_endpoint_pattern_screen_status_mismatch');
if (emissionSourceHumanEndpointPatternScreen.coverage.fittedRegions !== 971
  || emissionSourceHumanEndpointPatternScreen.coverage.fittedRegionYears !== 22_333
  || emissionSourceHumanEndpointPatternScreen.diagnostics.negativeFullPeriodSlopes !== 24
  || emissionSourceHumanEndpointPatternScreen.diagnostics.rSquaredBelowPointTwo !== 76
  || emissionSourceHumanEndpointPatternScreen.diagnostics.splitHalfOppositeSigns !== 22) globalErrors.push('emission_source_human_endpoint_pattern_screen_diagnostics_mismatch');
if (emissionSourceHumanEndpointPatternScreen.decision.scoresChanged !== 0
  || emissionSourceHumanEndpointPatternScreen.decision.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_pattern_screen_admission_boundary_mismatch');
if (emissionSourceHumanEndpointRegionalBoundaries.status !== 'complete_all_response_regions_resolved_to_official_gisco_boundaries') globalErrors.push('emission_source_human_endpoint_boundary_crosswalk_status_mismatch');
if (emissionSourceHumanEndpointRegionalBoundaries.coverage.resolvedRegions !== 971
  || emissionSourceHumanEndpointRegionalBoundaries.coverage.missingRegions.length !== 0
  || emissionSourceHumanEndpointRegionalBoundaries.coverage.invalidGeometries !== 0
  || emissionSourceHumanEndpointRegionalBoundaries.coverage.emptyGeometries !== 0) globalErrors.push('emission_source_human_endpoint_boundary_crosswalk_coverage_mismatch');
if (emissionSourceHumanEndpointRegionalBoundaries.decision.scoresChanged !== 0
  || emissionSourceHumanEndpointRegionalBoundaries.decision.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_boundary_crosswalk_admission_boundary_mismatch');
if (emissionSourceHumanEndpointLongRecordPlan.status !== 'complete_sparse_long_record_read_plan_execution_pending'
  || emissionSourceHumanEndpointLongRecordPlan.scope.regions !== 971
  || emissionSourceHumanEndpointLongRecordPlan.sparsePlan.spatialChunkKeys !== 13_970
  || emissionSourceHumanEndpointLongRecordPlan.sparsePlan.totalRangeChunks !== 6_118_860) globalErrors.push('emission_source_human_endpoint_long_record_plan_mismatch');
if (emissionSourceHumanEndpointLongRecordPlan.decision.scoresChanged !== 0
  || emissionSourceHumanEndpointLongRecordPlan.decision.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_long_record_plan_admission_boundary_mismatch');
if (emissionSourceHumanEndpointAreaWeights.status !== 'complete_sparse_area_intersection_weights_for_all_response_regions'
  || emissionSourceHumanEndpointAreaWeights.coverage.regions !== 971
  || emissionSourceHumanEndpointAreaWeights.coverage.regionsWithoutWeights !== 0
  || emissionSourceHumanEndpointAreaWeights.coverage.weightedGridCells !== 68_733
  || emissionSourceHumanEndpointAreaWeights.coverage.cellRegionIntersections !== 88_155) globalErrors.push('emission_source_human_endpoint_area_weights_mismatch');
if (emissionSourceHumanEndpointAreaWeights.decision.scoresChanged !== 0
  || emissionSourceHumanEndpointAreaWeights.decision.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_area_weights_admission_boundary_mismatch');
if (!['partial_resumable_long_record_retrieval', 'complete_all_70883_region_year_summer_means_execution_validation_pending'].includes(emissionSourceHumanEndpointLongRecordRetrieval.status)
  || emissionSourceHumanEndpointLongRecordRetrieval.inputs.retrievalPlanDigest !== emissionSourceHumanEndpointLongRecordPlan.digest
  || emissionSourceHumanEndpointLongRecordRetrieval.inputs.areaWeightsDigest !== emissionSourceHumanEndpointAreaWeights.digest
  || emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount < 1
  || emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount > 73
  || emissionSourceHumanEndpointLongRecordRetrieval.execution.regionYearRows !== emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount * 971
  || emissionSourceHumanEndpointLongRecordRetrieval.execution.remainingYears.length !== 73 - emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount) globalErrors.push('emission_source_human_endpoint_long_record_retrieval_mismatch');
if (emissionSourceHumanEndpointLongRecordRetrieval.decision.scoresChanged !== 0
  || emissionSourceHumanEndpointLongRecordRetrieval.decision.axesAdmitted !== 0) globalErrors.push('emission_source_human_endpoint_long_record_retrieval_admission_boundary_mismatch');
if (emissionSourceHumanEndpointLongRecordPatternAnalysis
  && (emissionSourceHumanEndpointLongRecordRetrieval.status !== 'complete_all_70883_region_year_summer_means_execution_validation_pending'
    || emissionSourceHumanEndpointLongRecordPatternAnalysis.status !== 'complete_long_record_pattern_stability_challenge_independent_comparison_pending'
    || emissionSourceHumanEndpointLongRecordPatternAnalysis.inputs.retrievalDigest !== emissionSourceHumanEndpointLongRecordRetrieval.digest
    || emissionSourceHumanEndpointLongRecordPatternAnalysis.diagnostics.responseRegions !== 971
    || emissionSourceHumanEndpointLongRecordPatternAnalysis.diagnostics.responseRegionYears !== 70_883
    || emissionSourceHumanEndpointLongRecordPatternAnalysis.decision.axesAdmitted !== 0
    || emissionSourceHumanEndpointLongRecordPatternAnalysis.decision.scoresChanged !== 0)) {
  globalErrors.push('emission_source_human_endpoint_long_record_pattern_analysis_mismatch');
}
if (emissionSourceHumanEndpointMonthlyPatternAnalysis
  && (emissionSourceHumanEndpointMonthlyPatternAnalysis.status !== 'complete_monthly_independent_pattern_ensemble'
    || emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.models !== 22
    || emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.institutions !== 17
    || emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.regions !== 971
    || emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.years !== 73
    || emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.seasonDefinitions !== 2
    || emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.modelRegionFits !== 42_724
    || emissionSourceHumanEndpointMonthlyPatternAnalysis.decision.axesAdmitted !== 0
    || emissionSourceHumanEndpointMonthlyPatternAnalysis.decision.scoresChanged !== 0
    || !['complete_era5_pattern_pending', 'monthly_independent_pattern_tests_complete_exact_week_challenge_pending'].includes(emissionSourceHumanEndpointMonthlyPatternAnalysis.comparison.status)
    || (emissionSourceHumanEndpointMonthlyPatternAnalysis.comparison.status === 'monthly_independent_pattern_tests_complete_exact_week_challenge_pending'
      && (!emissionSourceHumanEndpointLongRecordPatternAnalysis
        || emissionSourceHumanEndpointMonthlyPatternAnalysis.comparison.era5PatternDigest !== emissionSourceHumanEndpointLongRecordPatternAnalysis.digest
        || typeof emissionSourceHumanEndpointMonthlyPatternAnalysis.comparison.monthlyTestsPassed !== 'boolean')))) {
  globalErrors.push('emission_source_human_endpoint_monthly_pattern_analysis_mismatch');
}
if (emissionSourceHumanEndpointExactWeekPatternAnalysis
  && (!emissionSourceHumanEndpointMonthlyPatternAnalysis
    || emissionSourceHumanEndpointExactWeekPatternAnalysis.status !== 'complete_exact_week_independent_pattern_ensemble'
    || emissionSourceHumanEndpointExactWeekPatternAnalysis.inputs.monthlyAnalysisDigest !== emissionSourceHumanEndpointMonthlyPatternAnalysis.digest
    || emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.models !== 29
    || emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.institutions !== 21
    || emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.regions !== 971
    || emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.years !== 73
    || emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.modelRegionFits !== 28_159
    || emissionSourceHumanEndpointExactWeekPatternAnalysis.decision.axesAdmitted !== 0
    || emissionSourceHumanEndpointExactWeekPatternAnalysis.decision.scoresChanged !== 0
    || !['exact_week_ensemble_complete_era5_pattern_pending', 'exact_week_independent_pattern_tests_complete'].includes(emissionSourceHumanEndpointExactWeekPatternAnalysis.comparison.status)
    || (emissionSourceHumanEndpointExactWeekPatternAnalysis.comparison.status === 'exact_week_independent_pattern_tests_complete'
      && (!emissionSourceHumanEndpointLongRecordPatternAnalysis
        || emissionSourceHumanEndpointExactWeekPatternAnalysis.comparison.era5PatternDigest !== emissionSourceHumanEndpointLongRecordPatternAnalysis.digest
        || typeof emissionSourceHumanEndpointExactWeekPatternAnalysis.comparison.exactWeekTestsPassed !== 'boolean')))) {
  globalErrors.push('emission_source_human_endpoint_exact_week_pattern_analysis_mismatch');
}
if (emissionSourceHumanEndpointRegionalPatternPromotion
  && (!emissionSourceHumanEndpointLongRecordPatternAnalysis
    || !emissionSourceHumanEndpointMonthlyPatternAnalysis
    || !emissionSourceHumanEndpointExactWeekPatternAnalysis
    || emissionSourceHumanEndpointRegionalPatternPromotion.inputs.era5PatternDigest !== emissionSourceHumanEndpointLongRecordPatternAnalysis.digest
    || emissionSourceHumanEndpointRegionalPatternPromotion.inputs.monthlyIndependentPatternDigest !== emissionSourceHumanEndpointMonthlyPatternAnalysis.digest
    || emissionSourceHumanEndpointRegionalPatternPromotion.inputs.exactWeekIndependentPatternDigest !== emissionSourceHumanEndpointExactWeekPatternAnalysis.digest
    || emissionSourceHumanEndpointRegionalPatternPromotion.counts.frozenTests !== 30
    || emissionSourceHumanEndpointRegionalPatternPromotion.counts.passedTests + emissionSourceHumanEndpointRegionalPatternPromotion.counts.failedTests !== 30
    || typeof emissionSourceHumanEndpointRegionalPatternPromotion.decision.patternInputAdmittedToMatchedEndpoint !== 'boolean'
    || emissionSourceHumanEndpointRegionalPatternPromotion.decision.axesAdmitted !== 0
    || emissionSourceHumanEndpointRegionalPatternPromotion.decision.scoresChanged !== 0)) {
  globalErrors.push('emission_source_human_endpoint_regional_pattern_promotion_mismatch');
}
if (emissionSourceHumanEndpointMatchedSourceRemoval
  && (!emissionSourceHumanEndpointRegionalPatternPromotion
    || emissionSourceHumanEndpointRegionalPatternPromotion.status !== 'regional_pattern_promoted_to_matched_endpoint_input'
    || emissionSourceHumanEndpointRegionalPatternPromotion.decision.patternInputAdmittedToMatchedEndpoint !== true
    || emissionSourceHumanEndpointMatchedSourceRemoval.status !== 'complete_matched_source_removal_human_endpoint_ecosystem_endpoint_pending'
    || emissionSourceHumanEndpointMatchedSourceRemoval.inputs.promotionDigest !== emissionSourceHumanEndpointRegionalPatternPromotion.digest
    || emissionSourceHumanEndpointMatchedSourceRemoval.inputs.patternDigest !== emissionSourceHumanEndpointLongRecordPatternAnalysis?.digest
    || emissionSourceHumanEndpointMatchedSourceRemoval.coverage.sourceNodes !== 21
    || emissionSourceHumanEndpointMatchedSourceRemoval.coverage.regions !== 971
    || emissionSourceHumanEndpointMatchedSourceRemoval.coverage.bootstrapFits !== 100
    || emissionSourceHumanEndpointMatchedSourceRemoval.results.length !== 21
    || matchedSourceRemovalEndpointById.size !== 21
    || emissionSourceHumanEndpointMatchedSourceRemoval.decision.humanEndpointCompleted !== true
    || emissionSourceHumanEndpointMatchedSourceRemoval.decision.ecosystemEndpointCompleted !== false
    || emissionSourceHumanEndpointMatchedSourceRemoval.decision.axesAdmitted !== 0
    || emissionSourceHumanEndpointMatchedSourceRemoval.decision.scoresChanged !== 0)) {
  globalErrors.push('emission_source_human_endpoint_matched_source_removal_mismatch');
}
if (emissionSourceHistoryFeasibility.counts.nodesAudited !== 6) globalErrors.push(`emission_source_history_boundary_count:${emissionSourceHistoryFeasibility.counts.nodesAudited}`);
for (const node of PUBLISHED_NODES) {
  const row = node.node_kind === 'response' ? responseRowsById.get(node.id) : issueRowsById.get(node.id);
  if (!row) globalErrors.push(`missing_row:${node.id}`);
}

function independentlyCalculate(candidate) {
  const active = candidate.applicableDomains;
  const combined = estimate => active.reduce((sum, dimension) => (
    sum + componentIndex(candidate.components[dimension][estimate])
  ), 0) / active.length;
  const central = combined('central');
  return {
    value: round1(1 + 9 * central),
    grade: gradeForIndex(central),
    lower: round1(1 + 9 * combined('lower')),
    upper: round1(1 + 9 * combined('upper')),
    domainWeights: Object.fromEntries(dimensions.map(dimension => [
      dimension,
      active.includes(dimension) ? 1 / active.length : 0,
    ])),
  };
}

const pass1Nodes = catalogue.issues.map(row => {
  const errors = [];
  const node = nodesById.get(row.nodeId);
  const record = registry.records[row.nodeId];
  const candidate = row.candidate;
  if (!node || node.node_kind === 'response') errors.push('catalogue_kind_mismatch');
  if (!record || record.nodeKind !== 'issue') errors.push('registry_kind_mismatch');
  if (candidate.nodeId !== row.nodeId || row.result.nodeId !== row.nodeId) errors.push('identity_mismatch');
  if (candidate.sourceDigest !== record?.sourceDigest) errors.push('source_digest_mismatch');
  if (candidate.policyVersion !== policy.version) errors.push('policy_version_mismatch');
  if (candidate.geography !== policy.geography) errors.push('geography_mismatch');
  if (candidate.outlook?.scenario !== policy.scenario) errors.push('scenario_mismatch');
  if (JSON.stringify(candidate.outlook?.horizon) !== JSON.stringify(policy.horizon)) errors.push('horizon_mismatch');
  for (const prohibited of ['baseValue', 'impactScore', 'vector', 'graphDegree', 'sourceCount']) {
    if (candidate[prohibited] !== undefined) errors.push(`prohibited_input:${prohibited}`);
  }

  let independent = null;
  try {
    independent = independentlyCalculate(candidate);
    if (!close(independent.value, row.result.value)) errors.push('independent_value_mismatch');
    if (independent.grade !== row.result.grade?.letter) errors.push('independent_grade_mismatch');
    if (!close(independent.lower, row.result.uncertainty?.lower)) errors.push('independent_lower_bound_mismatch');
    if (!close(independent.upper, row.result.uncertainty?.upper)) errors.push('independent_upper_bound_mismatch');
    for (const dimension of dimensions) {
      if (!close(independent.domainWeights[dimension], row.result.domainWeights?.[dimension])) {
        errors.push(`independent_${dimension}_weight_mismatch`);
      }
    }
  } catch {
    errors.push('independent_calculation_failed');
  }

  const reevaluated = evaluateInternalTulipCandidate(node, candidate, { ...policy, sourceDigest: record?.sourceDigest });
  if (reevaluated.status !== 'internal_candidate') errors.push(`shared_evaluator_status:${reevaluated.status}`);
  if (reevaluated.reasons?.length) errors.push(...reevaluated.reasons.map(reason => `shared_evaluator:${reason}`));
  for (const field of ['value', 'confidence']) {
    if (reevaluated[field] !== row.result[field]) errors.push(`shared_evaluator_${field}_mismatch`);
  }
  if (reevaluated.grade?.letter !== row.result.grade?.letter) errors.push('shared_evaluator_grade_mismatch');
  if (JSON.stringify(reevaluated.uncertainty) !== JSON.stringify(row.result.uncertainty)) errors.push('shared_evaluator_uncertainty_mismatch');

  return {
    nodeId: row.nodeId,
    name: row.name,
    status: errors.length ? 'failed' : 'passed',
    errors,
    recorded: {
      value: row.result.value,
      grade: row.result.grade?.letter,
      lower: row.result.uncertainty?.lower,
      upper: row.result.uncertainty?.upper,
    },
    independent,
  };
});

const pass1Responses = catalogue.responses.map(row => {
  const errors = [];
  const node = nodesById.get(row.nodeId);
  const record = registry.records[row.nodeId];
  if (!node || node.node_kind !== 'response') errors.push('catalogue_kind_mismatch');
  if (!record || record.nodeKind !== 'response') errors.push('registry_kind_mismatch');
  if (row.result.status !== 'not_applicable') errors.push('response_status_mismatch');
  if (row.result.label !== 'Response') errors.push('response_label_mismatch');
  if (row.result.value !== null || row.result.grade !== null) errors.push('response_has_danger_rating');
  const reevaluated = evaluateInternalTulipCandidate(node, null, { ...policy, sourceDigest: record?.sourceDigest });
  if (reevaluated.status !== 'not_applicable' || reevaluated.value !== null || reevaluated.grade !== null) {
    errors.push('response_evaluator_mismatch');
  }
  return { nodeId: row.nodeId, name: row.name, status: errors.length ? 'failed' : 'passed', errors };
});

const pass1Failures = [...pass1Nodes, ...pass1Responses].filter(row => row.errors.length);
const pass1 = {
  auditVersion: 'tulip_internal_catalogue_double_audit_2026_09_27_v109',
  pass: 1,
  purpose: 'Independent arithmetic, policy, source-binding, coverage and response-exclusion reproduction.',
  auditedOn: '2026-09-24',
  status: globalErrors.length || pass1Failures.length ? 'failed' : 'passed',
  counts: {
    catalogue: allRows.length,
    issues: pass1Nodes.length,
    responses: pass1Responses.length,
    passed: [...pass1Nodes, ...pass1Responses].filter(row => !row.errors.length).length,
    failed: pass1Failures.length,
    globalErrors: globalErrors.length,
  },
  globalErrors,
  failures: pass1Failures,
  nodes: [...pass1Nodes, ...pass1Responses],
};

function traceBasis(candidate, dimension) {
  const trace = candidate.decisionTrace ?? {};
  // A blind comparison is retained for audit on authored pilot records, but it
  // was explicitly rejected during adjudication. It is not the basis of the
  // retained candidate and must not count as authoritative axis evidence.
  return trace.axisBasis?.[dimension] ?? null;
}

const pass2Nodes = catalogue.issues.map(row => {
  const candidate = row.candidate;
  const record = registry.records[row.nodeId];
  const admittedSupplements = certaintySupplements.sources.filter(source => source.admittedUses?.[row.nodeId]?.length);
  const allowedSources = new Set([...sourceIds(record), ...admittedSupplements.map(source => source.id)]);
  const criticalFindings = [];
  const calibrationFlags = [];
  const ambiguousPersistence = new Set(ambiguousPersistenceValues(record));
  const approvedDurations = new Set(approvedConsequenceDurationValues(record));
  const active = new Set(candidate.applicableDomains);
  if (candidate.decisionTrace?.method === 'pilot_evidence_adjudication'
    && !candidate.decisionTrace?.axisBasis) {
    calibrationFlags.push('retained_pilot_axis_basis_not_recorded');
  }
  const firstPassDomains = new Set(firstPassById.get(row.nodeId)?.candidate?.applicableDomains ?? []);
  const addedDomains = candidate.applicableDomains.filter(dimension => !firstPassDomains.has(dimension));
  if (addedDomains.length && !['detailed_evidence_review_override', 'explicit_direct_domain_override']
    .includes(candidate.decisionTrace?.domainScopeRule)) {
    criticalFindings.push(`unreviewed_domain_expansion:${addedDomains.join(',')}`);
  }
  const evidenceRefs = new Set([
    ...(candidate.history?.evidenceReferences ?? []),
    ...(candidate.outlook?.evidenceReferences ?? []),
    ...dimensions.flatMap(dimension => candidate.components?.[dimension]?.evidenceReferences ?? []),
  ]);

  for (const reference of evidenceRefs) {
    if (!allowedSources.has(reference)) criticalFindings.push(`unbound_evidence_reference:${reference}`);
  }
  const usedSupplementIds = [...evidenceRefs].filter(reference => admittedSupplements.some(source => source.id === reference));
  if (usedSupplementIds.length) {
    if (candidate.supplementalEvidenceDigest !== digest(admittedSupplements)) {
      criticalFindings.push('supplemental_evidence_digest_mismatch');
    }
    for (const source of admittedSupplements) {
      if (!/^https:\/\//.test(source.url) || !source.checkedOn || !Object.keys(source.facts ?? {}).length) {
        criticalFindings.push(`supplemental_evidence_incomplete:${source.id}`);
      }
    }
  } else if (candidate.supplementalEvidenceDigest) {
    criticalFindings.push('unused_supplemental_evidence_digest');
  }
  if (!candidate.reviewStatus || candidate.reviewStatus !== 'second_pass_internal_review_complete') {
    criticalFindings.push('second_pass_status_missing');
  }
  if (!candidate.decisionTrace?.blindToFirstPassDuringClassification
    || !candidate.decisionTrace?.firstPassRevealedAfterClassification) {
    criticalFindings.push('blind_review_trace_incomplete');
  }
  if (!/legacy scores|old vectors|graph degree|source count|prior candidate/i.test(candidate.decisionTrace?.evidenceRules ?? '')) {
    criticalFindings.push('prohibited_input_rule_not_recorded');
  }
  if (candidate.causalAllocation?.role === 'emission_source') {
    if (candidate.causalAllocation.inheritsAggregateScore !== false) {
      criticalFindings.push('emission_source_inherits_aggregate_score');
    }
    if (candidate.causalAllocation.attributionStatus === 'unresolved') {
      calibrationFlags.push('emission_source_allocation_unresolved');
      for (const dimension of candidate.applicableDomains) {
        if (candidate.components?.[dimension]?.confidence !== 'D') {
          criticalFindings.push(`${dimension}_unresolved_emission_source_not_confidence_d`);
        }
      }
    }
    if (endpointResponsivenessNodeIds.has(row.nodeId)) {
      calibrationFlags.push('emission_source_candidate_not_endpoint_calibrated');
      if (candidate.causalAllocation.scoreResponseStatus !== 'provisional_family_candidate_not_yet_calibrated_to_source_specific_endpoint') {
        criticalFindings.push('emission_source_score_response_status_missing');
      }
      if (candidate.causalAllocation.endpointSensitivity?.admittedToAxes !== false) {
        criticalFindings.push('emission_source_sensitivity_admission_boundary_missing');
      }
      const axisAdmission = endpointAxisAdmissionById.get(row.nodeId);
      if (!axisAdmission || axisAdmission.admittedAxes !== 0 || axisAdmission.scoreEffect !== 'none') {
        criticalFindings.push('emission_source_axis_admission_audit_mismatch');
      } else {
        calibrationFlags.push('emission_source_axis_admission_audited');
      }
      if (!endpointBridgeNodeIds.has(row.nodeId)) {
        criticalFindings.push('emission_source_human_endpoint_bridge_trace_missing');
      } else {
        calibrationFlags.push('emission_source_human_endpoint_bridge_audited');
        if (emissionSourceHumanEndpointBridge.counts.completeFileChecksums !== 6
          || emissionSourceHumanEndpointBridge.fullDataChecksumAudit?.digest !== emissionSourceHumanEndpointChecksums.digest) {
          criticalFindings.push('emission_source_human_endpoint_full_data_checksum_trace_mismatch');
        } else {
          calibrationFlags.push('emission_source_human_endpoint_full_data_checksum_audited');
        }
        if (emissionSourceHumanEndpointBridge.coverageEnumeration?.digest !== emissionSourceHumanEndpointCoverage.digest
          || emissionSourceHumanEndpointBridge.coverage.exactRegionCounts.responsePanel !== 971) {
          criticalFindings.push('emission_source_human_endpoint_coverage_trace_mismatch');
        } else {
          calibrationFlags.push('emission_source_human_endpoint_coverage_audited');
        }
        if (emissionSourceHumanEndpointPooledModel.inputs.coverageDigest !== emissionSourceHumanEndpointCoverage.digest
          || emissionSourceHumanEndpointPooledModel.model.crossRuntimeValidation.status !== 'passed_python_numpy_vs_base_r'
          || emissionSourceHumanEndpointPooledModel.admissionDecision.axesAdmitted !== 0
          || emissionSourceHumanEndpointPooledModel.admissionDecision.scoresChanged !== 0) {
          criticalFindings.push('emission_source_human_endpoint_pooled_model_trace_mismatch');
        } else {
          calibrationFlags.push('emission_source_human_endpoint_pooled_model_reproduced');
        }
        if (emissionSourceHumanEndpointAttribution.inputs.pooledModelVersion !== emissionSourceHumanEndpointPooledModel.version
          || emissionSourceHumanEndpointAttribution.coverage.matchedDailyTemperatureRows !== 4_454_230
          || emissionSourceHumanEndpointAttribution.coverage.matchedTemperatureBinDays !== 4_454_230
          || emissionSourceHumanEndpointAttribution.coverage.matchedDailyMinusBinnedDayCount !== 0
          || emissionSourceHumanEndpointAttribution.validation.duplicateDailyDateRows !== 0
          || emissionSourceHumanEndpointAttribution.admissionDecision.axesAdmitted !== 0
          || emissionSourceHumanEndpointAttribution.admissionDecision.scoresChanged !== 0) {
          criticalFindings.push('emission_source_human_endpoint_attribution_trace_mismatch');
        } else {
          calibrationFlags.push('emission_source_human_endpoint_attribution_reproduced');
        }
        if (emissionSourceHumanEndpointPatternScreen.inputs.attributionVersion !== emissionSourceHumanEndpointAttribution.version
          || emissionSourceHumanEndpointPatternScreen.coverage.fittedRegions !== 971
          || emissionSourceHumanEndpointPatternScreen.coverage.fittedRegionYears !== 22_333
          || emissionSourceHumanEndpointPatternScreen.diagnostics.negativeFullPeriodSlopes !== 24
          || emissionSourceHumanEndpointPatternScreen.diagnostics.rSquaredBelowPointTwo !== 76
          || emissionSourceHumanEndpointPatternScreen.diagnostics.splitHalfOppositeSigns !== 22
          || emissionSourceHumanEndpointPatternScreen.decision.axesAdmitted !== 0
          || emissionSourceHumanEndpointPatternScreen.decision.scoresChanged !== 0) {
          criticalFindings.push('emission_source_human_endpoint_pattern_screen_trace_mismatch');
        } else {
          calibrationFlags.push('emission_source_human_endpoint_pattern_screen_completed');
        }
        if (emissionSourceHumanEndpointRegionalBoundaries.inputs.coverageVersion !== emissionSourceHumanEndpointCoverage.version
          || emissionSourceHumanEndpointRegionalBoundaries.coverage.resolvedRegions !== 971
          || emissionSourceHumanEndpointRegionalBoundaries.coverage.missingRegions.length !== 0
          || emissionSourceHumanEndpointRegionalBoundaries.coverage.invalidGeometries !== 0
          || emissionSourceHumanEndpointRegionalBoundaries.coverage.emptyGeometries !== 0
          || emissionSourceHumanEndpointRegionalBoundaries.geometryOutput.features !== 971
          || emissionSourceHumanEndpointRegionalBoundaries.decision.axesAdmitted !== 0
          || emissionSourceHumanEndpointRegionalBoundaries.decision.scoresChanged !== 0) {
          criticalFindings.push('emission_source_human_endpoint_boundary_crosswalk_trace_mismatch');
        } else {
          calibrationFlags.push('emission_source_human_endpoint_boundary_crosswalk_completed');
        }
        if (emissionSourceHumanEndpointLongRecordPlan.inputs.regionalBoundaryCrosswalkDigest !== emissionSourceHumanEndpointRegionalBoundaries.digest
          || emissionSourceHumanEndpointLongRecordPlan.scope.regions !== 971
          || emissionSourceHumanEndpointLongRecordPlan.sparsePlan.spatialChunkKeys !== 13_970
          || emissionSourceHumanEndpointLongRecordPlan.sparsePlan.totalRangeChunks !== 6_118_860
          || emissionSourceHumanEndpointLongRecordPlan.decision.axesAdmitted !== 0
          || emissionSourceHumanEndpointLongRecordPlan.decision.scoresChanged !== 0) {
          criticalFindings.push('emission_source_human_endpoint_long_record_plan_trace_mismatch');
        } else {
          calibrationFlags.push('emission_source_human_endpoint_long_record_retrieval_planned');
        }
        if (emissionSourceHumanEndpointAreaWeights.inputs.regionalBoundaryCrosswalkDigest !== emissionSourceHumanEndpointRegionalBoundaries.digest
          || emissionSourceHumanEndpointAreaWeights.inputs.retrievalPlanDigest !== emissionSourceHumanEndpointLongRecordPlan.digest
          || emissionSourceHumanEndpointAreaWeights.coverage.regions !== 971
          || emissionSourceHumanEndpointAreaWeights.coverage.regionsWithoutWeights !== 0
          || emissionSourceHumanEndpointAreaWeights.coverage.weightedGridCells !== 68_733
          || emissionSourceHumanEndpointAreaWeights.coverage.cellRegionIntersections !== 88_155
          || emissionSourceHumanEndpointAreaWeights.decision.axesAdmitted !== 0
          || emissionSourceHumanEndpointAreaWeights.decision.scoresChanged !== 0) {
          criticalFindings.push('emission_source_human_endpoint_area_weights_trace_mismatch');
        } else {
          calibrationFlags.push('emission_source_human_endpoint_area_weights_completed');
        }
        if (emissionSourceHumanEndpointLongRecordRetrieval.inputs.retrievalPlanDigest !== emissionSourceHumanEndpointLongRecordPlan.digest
          || emissionSourceHumanEndpointLongRecordRetrieval.inputs.areaWeightsDigest !== emissionSourceHumanEndpointAreaWeights.digest
          || emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount < 1
          || emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount > 73
          || emissionSourceHumanEndpointLongRecordRetrieval.execution.regionYearRows !== emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount * 971
          || emissionSourceHumanEndpointLongRecordRetrieval.execution.remainingYears.length !== 73 - emissionSourceHumanEndpointLongRecordRetrieval.execution.completedYearCount
          || emissionSourceHumanEndpointLongRecordRetrieval.decision.axesAdmitted !== 0
          || emissionSourceHumanEndpointLongRecordRetrieval.decision.scoresChanged !== 0) {
          criticalFindings.push('emission_source_human_endpoint_long_record_retrieval_trace_mismatch');
        } else {
          calibrationFlags.push('emission_source_human_endpoint_long_record_retrieval_started');
        }
        if (emissionSourceHumanEndpointLongRecordPatternAnalysis) {
          if (emissionSourceHumanEndpointLongRecordRetrieval.status !== 'complete_all_70883_region_year_summer_means_execution_validation_pending'
            || emissionSourceHumanEndpointLongRecordPatternAnalysis.inputs.retrievalDigest !== emissionSourceHumanEndpointLongRecordRetrieval.digest
            || emissionSourceHumanEndpointLongRecordPatternAnalysis.diagnostics.responseRegions !== 971
            || emissionSourceHumanEndpointLongRecordPatternAnalysis.diagnostics.responseRegionYears !== 70_883
            || emissionSourceHumanEndpointLongRecordPatternAnalysis.decision.axesAdmitted !== 0
            || emissionSourceHumanEndpointLongRecordPatternAnalysis.decision.scoresChanged !== 0) {
            criticalFindings.push('emission_source_human_endpoint_long_record_pattern_analysis_trace_mismatch');
          } else {
            calibrationFlags.push('emission_source_human_endpoint_long_record_pattern_analyzed');
          }
        }
        if (emissionSourceHumanEndpointMonthlyPatternAnalysis) {
          const comparison = emissionSourceHumanEndpointMonthlyPatternAnalysis.comparison;
          if (emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.models !== 22
            || emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.institutions !== 17
            || emissionSourceHumanEndpointMonthlyPatternAnalysis.counts.modelRegionFits !== 42_724
            || emissionSourceHumanEndpointMonthlyPatternAnalysis.decision.axesAdmitted !== 0
            || emissionSourceHumanEndpointMonthlyPatternAnalysis.decision.scoresChanged !== 0
            || (comparison.status === 'monthly_independent_pattern_tests_complete_exact_week_challenge_pending'
              && comparison.era5PatternDigest !== emissionSourceHumanEndpointLongRecordPatternAnalysis?.digest)) {
            criticalFindings.push('emission_source_human_endpoint_monthly_pattern_analysis_trace_mismatch');
          } else {
            calibrationFlags.push('emission_source_human_endpoint_monthly_pattern_analysis_completed');
          }
        }
        if (emissionSourceHumanEndpointExactWeekPatternAnalysis) {
          const comparison = emissionSourceHumanEndpointExactWeekPatternAnalysis.comparison;
          if (!emissionSourceHumanEndpointMonthlyPatternAnalysis
            || emissionSourceHumanEndpointExactWeekPatternAnalysis.inputs.monthlyAnalysisDigest !== emissionSourceHumanEndpointMonthlyPatternAnalysis.digest
            || emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.models !== 29
            || emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.institutions !== 21
            || emissionSourceHumanEndpointExactWeekPatternAnalysis.counts.modelRegionFits !== 28_159
            || emissionSourceHumanEndpointExactWeekPatternAnalysis.decision.axesAdmitted !== 0
            || emissionSourceHumanEndpointExactWeekPatternAnalysis.decision.scoresChanged !== 0
            || (comparison.status === 'exact_week_independent_pattern_tests_complete'
              && comparison.era5PatternDigest !== emissionSourceHumanEndpointLongRecordPatternAnalysis?.digest)) {
            criticalFindings.push('emission_source_human_endpoint_exact_week_pattern_analysis_trace_mismatch');
          } else {
            calibrationFlags.push('emission_source_human_endpoint_exact_week_pattern_analysis_completed');
          }
        }
        if (emissionSourceHumanEndpointRegionalPatternPromotion) {
          if (!emissionSourceHumanEndpointLongRecordPatternAnalysis
            || !emissionSourceHumanEndpointMonthlyPatternAnalysis
            || !emissionSourceHumanEndpointExactWeekPatternAnalysis
            || emissionSourceHumanEndpointRegionalPatternPromotion.inputs.era5PatternDigest !== emissionSourceHumanEndpointLongRecordPatternAnalysis.digest
            || emissionSourceHumanEndpointRegionalPatternPromotion.inputs.monthlyIndependentPatternDigest !== emissionSourceHumanEndpointMonthlyPatternAnalysis.digest
            || emissionSourceHumanEndpointRegionalPatternPromotion.inputs.exactWeekIndependentPatternDigest !== emissionSourceHumanEndpointExactWeekPatternAnalysis.digest
            || emissionSourceHumanEndpointRegionalPatternPromotion.counts.frozenTests !== 30
            || emissionSourceHumanEndpointRegionalPatternPromotion.decision.axesAdmitted !== 0
            || emissionSourceHumanEndpointRegionalPatternPromotion.decision.scoresChanged !== 0) {
            criticalFindings.push('emission_source_human_endpoint_regional_pattern_promotion_trace_mismatch');
          } else {
            calibrationFlags.push('emission_source_human_endpoint_regional_pattern_promotion_decided');
          }
        }
        if (emissionSourceHumanEndpointMatchedSourceRemoval) {
          const matchedEndpoint = matchedSourceRemovalEndpointById.get(row.nodeId);
          if (!matchedEndpoint
            || candidate.causalAllocation?.regionalPatternEvidence?.matchedHumanEndpointCompleted !== true
            || emissionSourceHumanEndpointMatchedSourceRemoval.inputs.promotionDigest !== emissionSourceHumanEndpointRegionalPatternPromotion?.digest
            || emissionSourceHumanEndpointMatchedSourceRemoval.inputs.patternDigest !== emissionSourceHumanEndpointLongRecordPatternAnalysis?.digest
            || matchedEndpoint.admissionDecision?.axesAdmitted !== 0
            || matchedEndpoint.admissionDecision?.scoresChanged !== 0
            || emissionSourceHumanEndpointMatchedSourceRemoval.decision.axesAdmitted !== 0
            || emissionSourceHumanEndpointMatchedSourceRemoval.decision.scoresChanged !== 0) {
            criticalFindings.push('emission_source_human_endpoint_matched_source_removal_trace_mismatch');
          } else {
            calibrationFlags.push('emission_source_human_endpoint_matched_source_removal_completed');
          }
        }
      }
    }
    if (historyBoundaryAuditNodeIds.has(row.nodeId)) {
      calibrationFlags.push('emission_source_history_boundary_audited');
      const feasibility = candidate.causalAllocation.sourceHistoryFeasibility;
      if (!feasibility || feasibility.version !== emissionSourceHistoryFeasibility.version) {
        criticalFindings.push('emission_source_history_feasibility_trace_missing');
      } else {
        if (feasibility.ratingEffect !== 'none_candidate_retained_at_confidence_d') {
          criticalFindings.push('emission_source_history_feasibility_rating_boundary_missing');
        }
        if (!hasText(feasibility.nextRequiredData) || !hasText(feasibility.prohibitedUse)) {
          criticalFindings.push('emission_source_history_feasibility_next_data_missing');
        }
      }
    }
  }

  for (const dimension of dimensions) {
    const component = candidate.components?.[dimension];
    if (!component) {
      criticalFindings.push(`${dimension}_component_missing`);
      continue;
    }
    if (active.has(dimension)) {
      if (component.structuralZero) criticalFindings.push(`${dimension}_active_domain_marked_structural_zero`);
      for (const axis of axes) {
        if (!Number.isInteger(component.central?.[axis]) || component.central[axis] < 0 || component.central[axis] > 4) {
          criticalFindings.push(`${dimension}_${axis}_central_invalid`);
        }
        if (component.central?.[axis] === 0) calibrationFlags.push(`${dimension}_${axis}_active_zero_requires_specific_evidence`);
      }
      const basis = traceBasis(candidate, dimension);
      const authoredReasoning = hasText(component.attribution) && hasText(component.aggregation)
        && hasText(component.overlapReview) && hasText(component.systemEffectsNote);
      if (!basis && !authoredReasoning) criticalFindings.push(`${dimension}_axis_reasoning_missing`);
      if (basis) {
        for (const axis of axes) {
          if (!hasText(basis[axis]?.basis)) criticalFindings.push(`${dimension}_${axis}_basis_missing`);
          const basisText = basis[axis]?.basis ?? '';
          if (titleAsEvidencePattern.test(basisText)) {
            criticalFindings.push(`${dimension}_${axis}_title_used_as_evidence`);
          }
          if (contextAsEvidencePattern.test(basisText)) {
            criticalFindings.push(`${dimension}_${axis}_excluded_context_used_as_evidence`);
          }
          if (axis === 'persistence' && observationAsPersistencePattern.test(basisText)
            && !/\b(?:not|never|excluded|does not|is not|rather than)\b/i.test(basisText)) {
            criticalFindings.push(`${dimension}_${axis}_observation_window_used_as_consequence_duration`);
          }
          if (axis === 'persistence') {
            const sourceDuration = basisText.match(/source documents ([\d.]+) years/i)?.[1];
            const years = sourceDuration == null ? null : Number(sourceDuration);
            if (years != null && ambiguousPersistence.has(years) && !approvedDurations.has(years)) {
              criticalFindings.push(`${dimension}_${axis}_generic_persistence_field_used_as_consequence_duration`);
            }
          }
          if (basis[axis] && basis[axis].central !== component.central[axis]
            && candidate.decisionTrace.method !== 'pilot_evidence_adjudication') {
            criticalFindings.push(`${dimension}_${axis}_basis_value_mismatch`);
          }
        }
        if (dimension === 'ecosystem') {
          if (/generic review does not use it as severity/i.test(basis.severity?.basis ?? '')) {
            calibrationFlags.push('ecosystem_percentage_held_for_semantic_review');
          }
          if (basis.severity?.sourceAnchored === true && !hasText(candidate.decisionTrace?.measurementSemantics?.severity)) {
            calibrationFlags.push('ecosystem_exact_severity_semantics_unreviewed');
          }
          const severityPercentages = percentageTokens(basis.severity?.basis);
          const reachPercentages = percentageTokens(basis.reach?.basis);
          const repeated = [...severityPercentages].filter(value => reachPercentages.has(value));
          if (repeated.length && !hasText(candidate.decisionTrace?.measurementSemantics?.nonDoubleCounting)) {
            criticalFindings.push(`ecosystem_severity_reach_metric_reused_without_semantic_split:${repeated.join(',')}`);
          }
        }
      }
    } else {
      if (!component.structuralZero) criticalFindings.push(`${dimension}_excluded_domain_not_structural_zero`);
      if (!hasText(component.structuralZeroReason)) criticalFindings.push(`${dimension}_structural_zero_reason_missing`);
      for (const estimate of ['lower', 'central', 'upper']) {
        if (axes.some(axis => component[estimate]?.[axis] !== 0)) {
          criticalFindings.push(`${dimension}_structural_zero_has_nonzero_axis`);
          break;
        }
      }
    }
    if (component.confidence === 'D') {
      const fallback = component.familyFallback;
      if (!fallback?.familyId || !hasText(fallback?.rationale) || !fallback?.analogueNodeIds?.length) {
        criticalFindings.push(`${dimension}_family_fallback_incomplete`);
      } else {
        for (const analogueId of fallback.analogueNodeIds) {
          if (analogueId === row.nodeId || !issueRowsById.has(analogueId)) {
            criticalFindings.push(`${dimension}_invalid_analogue:${analogueId}`);
          }
        }
      }
    }
  }

  const lowerGrade = gradeForScore(row.result.uncertainty.lower);
  const centralGrade = row.result.grade.letter;
  const upperGrade = gradeForScore(row.result.uncertainty.upper);
  const lowerRank = gradeBands.findIndex(band => band.letter === lowerGrade);
  const upperRank = gradeBands.findIndex(band => band.letter === upperGrade);
  const gradeSpan = upperRank - lowerRank;
  if (gradeSpan > 1) calibrationFlags.push('uncertainty_spans_multiple_grade_boundaries');
  else if (gradeSpan === 1) calibrationFlags.push('uncertainty_crosses_one_grade_boundary');
  const thresholds = [2.8, 4.6, 6.4, 8.2];
  const nearestThresholdDistance = Math.min(...thresholds.map(threshold => Math.abs(row.result.value - threshold)));
  if (nearestThresholdDistance <= 0.2 + 1e-9) calibrationFlags.push('central_value_near_grade_boundary');
  if (['C', 'D'].includes(row.result.confidence)) calibrationFlags.push('structured_or_family_evidence');
  if (row.reviewFlags?.includes('evidence_ends_before_2021')) {
    calibrationFlags.push('newest_registry_evidence_ends_before_2021');
  }

  return {
    nodeId: row.nodeId,
    name: row.name,
    value: row.result.value,
    grade: centralGrade,
    confidence: row.result.confidence,
    uncertaintyGrades: { lower: lowerGrade, central: centralGrade, upper: upperGrade, span: gradeSpan },
    ratingStatus: criticalFindings.length
      ? 'critical_review_failure'
      : gradeSpan === 0
        ? 'method_consistent_grade_stable_within_recorded_bounds'
        : 'method_consistent_grade_sensitive_within_recorded_bounds',
    criticalFindings: [...new Set(criticalFindings)],
    calibrationFlags: [...new Set(calibrationFlags)],
  };
});

const pass2Critical = pass2Nodes.filter(row => row.criticalFindings.length);
const flagCount = flag => pass2Nodes.filter(row => row.calibrationFlags.includes(flag)).length;
const gradeStabilityCounts = {
  stable: pass2Nodes.filter(row => row.uncertaintyGrades.span === 0).length,
  crossesOneBoundary: pass2Nodes.filter(row => row.uncertaintyGrades.span === 1).length,
  crossesMultipleBoundaries: pass2Nodes.filter(row => row.uncertaintyGrades.span > 1).length,
};
const gradeCounts = Object.fromEntries(gradeBands.map(({ letter }) => [
  letter,
  pass2Nodes.filter(row => row.grade === letter).length,
]));
const pass2 = {
  auditVersion: pass1.auditVersion,
  pass: 2,
  purpose: 'Evidence trace, domain boundary, confidence fallback and displayed-grade stability challenge.',
  auditedOn: '2026-09-23',
  status: pass2Critical.length ? 'failed' : 'method_consistent_with_material_stability_findings',
  counts: {
    issues: pass2Nodes.length,
    criticalFailures: pass2Critical.length,
    gradeCounts,
    gradeStability: gradeStabilityCounts,
    structuredOrFamilyEvidence: flagCount('structured_or_family_evidence'),
    activeZeroAxes: pass2Nodes.filter(row => row.calibrationFlags.some(flag => flag.includes('active_zero'))).length,
    evidenceEndingBefore2021: flagCount('newest_registry_evidence_ends_before_2021'),
    centralValuesNearBoundary: flagCount('central_value_near_grade_boundary'),
    unresolvedEmissionSourceAllocations: flagCount('emission_source_allocation_unresolved'),
    emissionSourceCandidatesNotEndpointCalibrated: flagCount('emission_source_candidate_not_endpoint_calibrated'),
    emissionSourceAxisAdmissionAudits: flagCount('emission_source_axis_admission_audited'),
    emissionSourceHumanEndpointBridgeAudits: flagCount('emission_source_human_endpoint_bridge_audited'),
    emissionSourceHumanEndpointFullDataChecksumAudits: flagCount('emission_source_human_endpoint_full_data_checksum_audited'),
    emissionSourceHumanEndpointCoverageAudits: flagCount('emission_source_human_endpoint_coverage_audited'),
    emissionSourceHumanEndpointPooledModelReproductions: flagCount('emission_source_human_endpoint_pooled_model_reproduced'),
    emissionSourceHumanEndpointAttributionReproductions: flagCount('emission_source_human_endpoint_attribution_reproduced'),
    emissionSourceHumanEndpointPatternScreens: flagCount('emission_source_human_endpoint_pattern_screen_completed'),
    emissionSourceHumanEndpointBoundaryCrosswalks: flagCount('emission_source_human_endpoint_boundary_crosswalk_completed'),
    emissionSourceHumanEndpointLongRecordRetrievalPlans: flagCount('emission_source_human_endpoint_long_record_retrieval_planned'),
    emissionSourceHumanEndpointAreaWeightSets: flagCount('emission_source_human_endpoint_area_weights_completed'),
    emissionSourceHumanEndpointLongRecordRetrievalsStarted: flagCount('emission_source_human_endpoint_long_record_retrieval_started'),
    emissionSourceHumanEndpointLongRecordPatternAnalyses: flagCount('emission_source_human_endpoint_long_record_pattern_analyzed'),
    emissionSourceHumanEndpointMonthlyPatternAnalyses: flagCount('emission_source_human_endpoint_monthly_pattern_analysis_completed'),
    emissionSourceHumanEndpointExactWeekPatternAnalyses: flagCount('emission_source_human_endpoint_exact_week_pattern_analysis_completed'),
    emissionSourceHumanEndpointRegionalPatternPromotionDecisions: flagCount('emission_source_human_endpoint_regional_pattern_promotion_decided'),
    emissionSourceHumanEndpointMatchedSourceRemovalEndpoints: flagCount('emission_source_human_endpoint_matched_source_removal_completed'),
    emissionSourceHistoryBoundaryAudits: flagCount('emission_source_history_boundary_audited'),
    ecosystemPercentagesHeldForSemanticReview: flagCount('ecosystem_percentage_held_for_semantic_review'),
    ecosystemExactSeveritySemanticsUnreviewed: flagCount('ecosystem_exact_severity_semantics_unreviewed'),
    retainedPilotAxisBasisNotRecorded: flagCount('retained_pilot_axis_basis_not_recorded'),
  },
  interpretation: {
    passedMeans: 'The rating is reproducible and defensible under the versioned internal TULIP rules and the evidence currently bound to the node.',
    doesNotMean: 'The audit does not turn structured judgment into measured fact or establish that the grade is invariant to plausible axis choices.',
    stabilityRule: 'A grade is stable only when its recorded lower and upper bounds remain in the same A-E band.',
  },
  criticalFailures: pass2Critical,
  nodes: pass2Nodes,
};

const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csvRows = [[
  'Node ID', 'Node', 'Value', 'Grade', 'Confidence', 'Lower grade', 'Upper grade', 'Grade span',
  'Rating status', 'Critical findings', 'Calibration flags',
], ...pass2Nodes.map(row => [
  row.nodeId, row.name, row.value, row.grade, row.confidence, row.uncertaintyGrades.lower,
  row.uncertaintyGrades.upper, row.uncertaintyGrades.span, row.ratingStatus,
  row.criticalFindings.join('; '), row.calibrationFlags.join('; '),
])];

const corrections = [{
  nodeId: 'mountain_pass_avalanches',
  defect: 'A zero count was treated as proof of no exposure, then the fallback overstated reach from catalogue context and mistook the six-year observation window for consequence persistence.',
  correction: 'The reviewed record now uses the two reported injuries for reach, the material injury and damage for severity, and event-scale consequences for persistence. Monitoring duration is excluded from the persistence parser.',
  before: 'C 4.8 with human reach 0',
  after: `${issueRowsById.get('mountain_pass_avalanches').result.grade.letter} ${issueRowsById.get('mountain_pass_avalanches').result.value} with human reach ${issueRowsById.get('mountain_pass_avalanches').candidate.components.human.central.reach}`,
}, {
  nodeId: 'wetland_peat_fires',
  defect: 'The structured review classified premature death below the fixed maximum-severity anchor, used 74.7 million residents as harmed-person reach and left ecosystem axes on generic authored judgments.',
  correction: 'The detailed review now uses more than 87,000 modelled excess deaths for human reach, classifies premature death as severity and persistence level 4, keeps exposed populations outside harm reach, and uses direct peatland-function, mapped-area and recovery evidence for ecosystem axes.',
  before: 'D 7.4, human severity 3, human reach 3, range C 6.3–E 8.5, evidence ending in 2019',
  after: `${issueRowsById.get('wetland_peat_fires').result.grade.letter} ${issueRowsById.get('wetland_peat_fires').result.value}, human severity 4, human reach 2, range C 6.3–D 8.1, confidence ${issueRowsById.get('wetland_peat_fires').result.confidence}, current evidence through 2023`,
}, {
  nodeId: 'seagrass_meadow_decline',
  defect: 'The structured review assigned a human-harm component without a compatible unique-person consequence and used generic ecosystem judgments despite an available same-denominator global habitat map.',
  correction: 'The detailed review is ecosystem-only. Complete mapped habitat loss sets local severity, the four-percent loss share against the same mapped seagrass distribution sets reach, and direct recovery evidence sets persistence. Coastal population, fisheries, services, map duration and restoration-study counts remain outside the axes.',
  before: 'D 7.4, human and ecosystem, range C 5.1–E 9.6, confidence C, structured classification',
  after: `${issueRowsById.get('seagrass_meadow_decline').result.grade.letter} ${issueRowsById.get('seagrass_meadow_decline').result.value}, ecosystem only, range C 6.3–D 7.8, confidence ${issueRowsById.get('seagrass_meadow_decline').result.confidence}, mapped observations through 2024`,
}, {
  rule: 'source_anchored_axis_bounds',
  defect: 'A node-level confidence grade widened exact source-based axis values even when the measurement itself was not uncertain at that axis.',
  correction: 'Exact compatible counts, percentages, durations and irreversible outcomes retain their source-supported axis level. Overall confidence remains a separate statement about the assessment.',
}, {
  rule: 'consequence_duration_only',
  defect: 'A source observation or monitoring period could be mistaken for the length of the harm.',
  correction: 'Only an explicit consequence, recovery or elevated-impact duration can set persistence. Record length and assessment windows are excluded.',
}, {
  rule: 'node_title_not_evidence',
  defect: 'Words such as “collapse” or “extinction” in a node title could act as evidence for maximum severity or permanence.',
  correction: 'The title no longer affects an axis. A maximum level requires a source to document the terminal outcome itself.',
}, {
  rule: 'context_only_values_excluded',
  defect: 'Values retained only as context could enter the generic classifier as scoring facts.',
  correction: 'Context-only, unscored and excluded facts are filtered from all count, extent and duration parsers.',
}, {
  nodeId: 'coral_larval_mortality',
  defect: 'A Florida Keys recruitment assessment had been expanded into global human-and-nature harm without a measured larval-survival rate or global denominator.',
  correction: 'The detailed review now scores the evidenced ecosystem-recruitment condition only and carries the missing global extent, recovery time and downstream human impacts in the uncertainty record.',
  before: 'D 6.6, human and ecosystem',
  after: `${issueRowsById.get('coral_larval_mortality').result.grade.letter} ${issueRowsById.get('coral_larval_mortality').result.value}, ecosystem only`,
}, {
  nodeId: 'pyrocumulonimbus_smoke_injection',
  defect: 'An aerosol-index dataset and family analogies had been treated as evidence of global human-and-nature consequences.',
  correction: 'The detailed review now uses NOAA atmospheric-composition and chemistry observations, excludes direct human harm from this node, and does not translate plume footprint into ecosystem loss.',
  before: 'D 6.6, human and ecosystem',
  after: `${issueRowsById.get('pyrocumulonimbus_smoke_injection').result.grade.letter} ${issueRowsById.get('pyrocumulonimbus_smoke_injection').result.value}, ecosystem only`,
}, {
  nodeId: 'forest_fragmentation',
  defect: 'Forest-use designations and the 1990–2025 assessment period had been converted into human harm and consequence duration, while the first correction still lacked a direct biodiversity-condition contrast and observed recovery-duration evidence.',
  correction: 'The detailed review now reproduces fragmented-versus-continuous biodiversity results, uses a 35-year experimental consequence record for persistence, excludes unsupported human consequences and keeps edge exposure separate from demonstrated adverse reach.',
  before: 'D 6.6, human and ecosystem',
  after: `${issueRowsById.get('forest_fragmentation').result.grade.letter} ${issueRowsById.get('forest_fragmentation').result.value}, ecosystem only, range C–D, confidence B`,
}, {
  nodeId: 'coastal_property_insurance_redlines',
  defect: 'The candidate depended on family analogies even though Treasury provides national ZIP-Code-level premium and nonrenewal evidence.',
  correction: 'The detailed review uses the Treasury measurements while withholding coastal-only, displacement and discriminatory-redlining claims that the source does not establish.',
  before: 'C 4.8, confidence D',
  after: `${issueRowsById.get('coastal_property_insurance_redlines').result.grade.letter} ${issueRowsById.get('coastal_property_insurance_redlines').result.value}, confidence ${issueRowsById.get('coastal_property_insurance_redlines').result.confidence}`,
}, {
  nodeId: 'urban_water_rationing_zones',
  defect: 'The 2015–2018 Cape Town restriction event was retained without a current-status check, making a recent-decade event look continuously active.',
  correction: 'The event remains in the assessment window, while a 2026 City source records that restrictions have not been in effect since November 2020.',
  before: 'C 6.3, range B–E, confidence C',
  after: `${issueRowsById.get('urban_water_rationing_zones').result.grade.letter} ${issueRowsById.get('urban_water_rationing_zones').result.value}, range C–D, confidence ${issueRowsById.get('urban_water_rationing_zones').result.confidence}`,
}, {
  nodeId: 'tundra_shrubification_speeds',
  defect: 'A circumpolar vegetation signal and cryosphere-family analogies had been expanded into a human consequence and near-global ecosystem reach.',
  correction: 'The detailed review uses NOAA tundra evidence, scores the documented ecological reorganization only, and does not treat greenness as a direct measurement of shrub-covered area.',
  before: 'C 6.3, human and ecosystem, range B–E, confidence D',
  after: `${issueRowsById.get('tundra_shrubification_speeds').result.grade.letter} ${issueRowsById.get('tundra_shrubification_speeds').result.value}, ecosystem only, range B–D, confidence ${issueRowsById.get('tundra_shrubification_speeds').result.confidence}`,
}, {
  nodeId: 'transformer_heat_failure_risk',
  defect: 'A supported heat-degradation mechanism had been treated as if it established current outages, affected people and outage duration.',
  correction: 'The detailed review separates failure potential from realized current harm and keeps replacement lead time outside the central consequence duration.',
  before: 'C 4.8, human and ecosystem, range B–D, confidence D',
  after: `${issueRowsById.get('transformer_heat_failure_risk').result.grade.letter} ${issueRowsById.get('transformer_heat_failure_risk').result.value}, human only, range A–C, confidence ${issueRowsById.get('transformer_heat_failure_risk').result.confidence}`,
}, {
  nodeId: 'resource_depletion',
  defect: 'A material-flow record had been described as direct evidence of aquifer and topsoil depletion, while global accounting coverage and impact shares had been treated as terminal harm denominators.',
  correction: 'The detailed review matches the node to UNEP’s economy-wide resource assessment and keeps attribution shares separate from the percentage of people harmed or ecosystems collapsed.',
  before: 'D 6.6, range C–E, confidence C',
  after: `${issueRowsById.get('resource_depletion').result.grade.letter} ${issueRowsById.get('resource_depletion').result.value}, range B–D, confidence ${issueRowsById.get('resource_depletion').result.confidence}`,
}, {
  nodeId: 'extreme_precipitation_intensity',
  defect: 'A 24-location rainfall-anomaly panel had been used as if it measured representative global human and ecosystem consequences.',
  correction: 'The detailed review uses IPCC’s impact assessment and keeps the approximately 709 million people exposed to a stronger signal separate from the smaller, incompletely counted population actually harmed.',
  before: 'D 6.6, range B–E, confidence C',
  after: `${issueRowsById.get('extreme_precipitation_intensity').result.grade.letter} ${issueRowsById.get('extreme_precipitation_intensity').result.value}, range B–D, confidence ${issueRowsById.get('extreme_precipitation_intensity').result.confidence}`,
}, {
  nodeId: 'convective_instability_shift',
  defect: 'A satellite stability-index product and family analogies had allowed downstream storm impacts and global grid coverage to stand in for harm caused by the atmospheric diagnostic itself.',
  correction: 'The detailed review uses NOAA global trend research, scores only limited direct current consequences and leaves hail, wind, lightning and rainfall impacts with their own nodes.',
  before: 'C 4.8, range B–D, confidence D',
  after: `${issueRowsById.get('convective_instability_shift').result.grade.letter} ${issueRowsById.get('convective_instability_shift').result.value}, range A–C, confidence ${issueRowsById.get('convective_instability_shift').result.confidence}`,
}, {
  nodeId: 'black_carbon_deposition',
  defect: 'A generic institutional homepage and broad cryosphere map coverage had been used to assign near-global ecosystem reach.',
  correction: 'The detailed review uses IPCC’s snow-forcing assessment and measured regions, while keeping radiative forcing separate from ecosystem-collapse severity and distribution.',
  before: 'C 4.8, range B–D, confidence D',
  after: `${issueRowsById.get('black_carbon_deposition').result.grade.letter} ${issueRowsById.get('black_carbon_deposition').result.value}, ecosystem only, range B–C, confidence ${issueRowsById.get('black_carbon_deposition').result.confidence}`,
}, {
  nodeId: 'antarctic_shelf_instability',
  defect: 'Total Antarctic ice mass loss, worldwide sea-level reach and a multi-decade observation period had been combined as if they were direct consequences of shelf instability.',
  correction: 'The detailed review separates the shelf mechanism, grounded-ice sea-level pathway and local ecological reorganization, while retaining their long-lived consequences within bounded persistence.',
  before: 'D 6.6, range B–E, confidence D',
  after: `${issueRowsById.get('antarctic_shelf_instability').result.grade.letter} ${issueRowsById.get('antarctic_shelf_instability').result.value}, range B–C, confidence ${issueRowsById.get('antarctic_shelf_instability').result.confidence}`,
}, {
  nodeId: 'savannah_tree_cover_decline',
  defect: 'A regional fire-management study had been treated as proof that declining woody cover was ecological harm, even though fire can restore an overly woody savanna and the source lacked absolute field measurements.',
  correction: 'The detailed review defines harm against an ecosystem-specific tree-and-grass reference state and uses direct Sahel tree-density, mortality and species-loss evidence without expanding sampled locations into global reach.',
  before: 'C 6.3, range B–E, confidence D',
  after: `${issueRowsById.get('savannah_tree_cover_decline').result.grade.letter} ${issueRowsById.get('savannah_tree_cover_decline').result.value}, ecosystem only, range B–D, confidence ${issueRowsById.get('savannah_tree_cover_decline').result.confidence}`,
}, {
  nodeId: 'ice_algae_pigmentation',
  defect: 'A general sea-level portal and cryosphere family analogies had assigned global human harm to a regional glacier-surface mechanism.',
  correction: 'The detailed review uses two Greenland melt seasons and a 2026 mechanism study, confines the node to the ecosystem/cryosphere consequence and keeps modelled runoff separate from terminal harm.',
  before: 'D 6.6, human and ecosystem, range B–E, confidence D',
  after: `${issueRowsById.get('ice_algae_pigmentation').result.grade.letter} ${issueRowsById.get('ice_algae_pigmentation').result.value}, ecosystem only, range A–C, confidence ${issueRowsById.get('ice_algae_pigmentation').result.confidence}`,
}, {
  nodeId: 'cryoconite_hole_expansion',
  defect: 'A general sea-level portal and global reach assumption had treated cryoconite-hole expansion as established widespread harm.',
  correction: 'The detailed review uses direct Greenland transects, records the small measured coverage and ambiguous net albedo effect, and separates the holes’ microbial-habitat function from harmful expansion.',
  before: 'C 6.3, range B–E, confidence D',
  after: `${issueRowsById.get('cryoconite_hole_expansion').result.grade.letter} ${issueRowsById.get('cryoconite_hole_expansion').result.value}, ecosystem only, range A–C, confidence ${issueRowsById.get('cryoconite_hole_expansion').result.confidence}`,
}, {
  nodeId: 'high_altitude_forest_shrinkage',
  defect: 'Regional mechanism evidence and forest-family analogies had treated global treeline change as uniform contraction and ecosystem loss.',
  correction: 'The detailed review uses the 2026 global movement analysis, separates upslope, downslope and stationary treelines, and does not turn boundary movement into an unsupported claim of global forest or biodiversity collapse.',
  before: 'C 6.3, range B–E, confidence D',
  after: `${issueRowsById.get('high_altitude_forest_shrinkage').result.grade.letter} ${issueRowsById.get('high_altitude_forest_shrinkage').result.value}, ecosystem only, range B–D, confidence ${issueRowsById.get('high_altitude_forest_shrinkage').result.confidence}`,
}, {
  nodeId: 'nunatak_habitat_shrinkage',
  defect: 'A generic biodiversity-occurrence API and cryosphere-family assumptions had treated glacier retreat as uniform loss of ice-free nunatak habitat.',
  correction: 'The detailed review separates physical ice-free area from habitat suitability: deglaciation often exposes more terrain, while direct Alpine evidence supports local decline in cold-adapted specialists without establishing global ecosystem collapse.',
  before: 'C 6.3, ecosystem only, range B–E, confidence D',
  after: `${issueRowsById.get('nunatak_habitat_shrinkage').result.grade.letter} ${issueRowsById.get('nunatak_habitat_shrinkage').result.value}, ecosystem only, range A–C, confidence ${issueRowsById.get('nunatak_habitat_shrinkage').result.confidence}`,
}, {
  nodeId: 'freeze_thaw_rock_fracturing',
  defect: 'A general snow-and-ice homepage and family assumptions had converted a rock-weathering mechanism into broad, persistent human and ecosystem harm.',
  correction: 'The detailed review uses a century-long local rockfall reconstruction, laboratory crack measurements and IPCC context, while separating seasonal freeze–thaw from deeper permafrost instability and withholding unmeasured global consequences.',
  before: 'D 6.6, human and ecosystem, range B–E, confidence D',
  after: `${issueRowsById.get('freeze_thaw_rock_fracturing').result.grade.letter} ${issueRowsById.get('freeze_thaw_rock_fracturing').result.value}, human and ecosystem, range A–C, confidence ${issueRowsById.get('freeze_thaw_rock_fracturing').result.confidence}`,
}, {
  nodeId: 'arctic_pack_ice_drift',
  defect: 'Normal pack-ice motion, data coverage and broad sea-ice family impacts had been combined into a high-severity drift score.',
  correction: 'The detailed review defines the harmful construct as unusually mobile or changing drift, uses route-level incident evidence for material effects, and keeps traffic exposure, ice flux and wider sea-ice loss separate.',
  before: 'C 6.3, human and ecosystem, range B–E, confidence D',
  after: `${issueRowsById.get('arctic_pack_ice_drift').result.grade.letter} ${issueRowsById.get('arctic_pack_ice_drift').result.value}, human and ecosystem, range A–C, confidence ${issueRowsById.get('arctic_pack_ice_drift').result.confidence}`,
}, {
  nodeId: 'fjord_sedimentation_pulses',
  defect: 'A general cryosphere homepage and family analogies had treated sediment delivery as uniformly harmful to both people and ecosystems.',
  correction: 'The detailed review uses Greenland sediment budgets, observed fjord contrasts and a field-constrained productivity model, separating near-glacier light limitation from nutrient-driven production and withholding unsupported human harm.',
  before: 'C 6.3, human and ecosystem, range B–E, confidence D',
  after: `${issueRowsById.get('fjord_sedimentation_pulses').result.grade.letter} ${issueRowsById.get('fjord_sedimentation_pulses').result.value}, ecosystem only, range A–C, confidence ${issueRowsById.get('fjord_sedimentation_pulses').result.confidence}`,
}, {
  nodeId: 'glacial_siltation_streams',
  defect: 'A general glacier resource and family assumptions had treated naturally sediment-rich streams as widespread persistent harm to both people and ecosystems.',
  correction: 'The detailed review uses worldwide stream measurements and a Greenland sediment reconstruction, scores only ecological deterioration relative to each stream’s local baseline, and keeps natural turbidity, specialist biodiversity and human outcomes separate.',
  before: 'D 6.6, human and ecosystem, range B–E, confidence D',
  after: `${issueRowsById.get('glacial_siltation_streams').result.grade.letter} ${issueRowsById.get('glacial_siltation_streams').result.value}, ecosystem only, range A–C, confidence ${issueRowsById.get('glacial_siltation_streams').result.confidence}`,
}, {
  nodeId: 'talik_expansion',
  defect: 'A general cryosphere homepage, future coverage and broad permafrost-family consequences had been treated as current talik-specific harm to people and ecosystems.',
  correction: 'The detailed review uses observed Alaska and Nunavik ground records, separates talik formation from downstream methane warming and future projections, and records local expansion as reversible under some conditions.',
  before: 'C 6.3, human and ecosystem, range B–E, confidence D',
  after: `${issueRowsById.get('talik_expansion').result.grade.letter} ${issueRowsById.get('talik_expansion').result.value}, ecosystem only, range A–C, confidence ${issueRowsById.get('talik_expansion').result.confidence}`,
}, {
  nodeId: 'soil_moisture_collapse',
  defect: 'A measurement portal, the word collapse and broad drought-family effects had been combined into current worldwide human and ecosystem harm.',
  correction: 'The detailed review uses the global satellite trend, local plant-stress thresholds and observed vegetation responses, while separating dry from wet deviations and event impacts from permanent collapse.',
  before: 'C 6.3, human and ecosystem, range B–E, confidence D',
  after: `${issueRowsById.get('soil_moisture_collapse').result.grade.letter} ${issueRowsById.get('soil_moisture_collapse').result.value}, ecosystem only, range B–D, confidence ${issueRowsById.get('soil_moisture_collapse').result.confidence}`,
}, {
  rule: 'structural_domain_scope_requires_explicit_review',
  defect: 'The generic text classifier could add a human or ecosystem component to a narrowly defined node even when the added domain had no direct terminal-consequence evidence.',
  correction: 'The authored node boundary is now preserved by default. A domain can be added only through a recorded direct-domain or detailed evidence review; the audit fails unexplained expansion.',
  example: `Heat-Attributable Excess Mortality is now ${issueRowsById.get('heatwave_excess_mortality_rates').result.grade.letter} ${issueRowsById.get('heatwave_excess_mortality_rates').result.value}, human only, with the ecosystem domain recorded as structurally outside the node.`,
}, {
  rule: 'generic_persistence_years_not_consequence_duration',
  defect: 'A field named persistence_years could contain the elapsed span of a dataset or assessment rather than the time needed for harm to end or recover.',
  correction: 'Only explicitly named recovery, consequence, elevated-effect or measured-effect durations can directly anchor persistence. Generic persistence fields now fall back to bounded qualitative evidence, and the audit fails if their value is reused as source-anchored duration.',
  example: `Biodiversity Intactness Loss no longer treats the ${registry.records.biodiversity_intactness_loss.evidenceAudit.observations.find(observation => observation.value?.persistence_years)?.value.persistence_years}-year assessment span as recovery time; its persistence axis is now structured rather than source-anchored.`,
}, {
  rule: 'generic_ecosystem_percentage_requires_semantic_review',
  defect: 'A percentage labelled decline, loss, degradation or fragmentation could be mapped directly to ecosystem severity even when it measured affected share, annual trend, pressure, study coverage or a physical system state.',
  correction: 'The generic review no longer makes exact ecosystem-severity mappings from percentages. A percentage can set severity only after a source-specific review proves that its denominator measures condition loss within an affected ecosystem and records how reach and trend are kept separate.',
  example: 'The shares of rivers that are not free-flowing, ecoregions showing kelp decline and annual seagrass loss remain evidence, but they no longer determine severity automatically.',
}, {
  nodeId: 'insect_biomass_decline',
  defect: 'An unrelated threatened-species percentage and broad downstream pathways had stood in for direct insect condition, human harm and global reach.',
  correction: 'The detailed review now uses recent standardized German biomass measurements plus the broader terrestrial-insect abundance synthesis, keeps abundance and biomass separate, confines direct harm to ecosystems, and carries geographic and attribution limits in the bounds.',
  before: 'D 6.6, human and ecosystem, evidence through 2019',
  after: `${issueRowsById.get('insect_biomass_decline').result.grade.letter} ${issueRowsById.get('insect_biomass_decline').result.value}, ecosystem only, evidence through 2025`,
}, {
  nodeId: 'peatland_degradations',
  defect: 'The global drained-or-degraded share had been allowed to stand in for local severity, while dividing that share by an annual loss estimate created an unsupported 120-year persistence value.',
  correction: 'The detailed review now uses the 12% global affected share for ecosystem reach only and a controlled ten-year restoration experiment for persistence, while excluding emissions and unmeasured human-service effects.',
  before: 'D 6.6, human and ecosystem, range B–E',
  after: `${issueRowsById.get('peatland_degradations').result.grade.letter} ${issueRowsById.get('peatland_degradations').result.value}, ecosystem only, range C–E`,
}, {
  nodeId: 'cold_chain_failure_risk',
  defect: 'Food mass, potential meals, broad post-harvest farmer income loss and downstream emissions had been blended into human and ecosystem harm.',
  correction: 'The detailed review now scores the directly attributed 2017 food-production loss as a human material consequence, while keeping potential food supply, affected people, farmer income, emissions and nature effects separate.',
  before: 'C 6.3, human and ecosystem, range B–E',
  after: `${issueRowsById.get('cold_chain_failure_risk').result.grade.letter} ${issueRowsById.get('cold_chain_failure_risk').result.value}, human only, range B–D`,
}, {
  nodeId: 'dam_and_diversion_infrastructure',
  defect: 'A population supported by inland fisheries had been treated as though all 158 million people were harmed by dams, while the long-river fragmentation share was not routed to ecosystem reach.',
  correction: 'The detailed review removes service exposure from human reach and instead uses measured nearby human outcomes, species-level range connectivity, biological comparisons above and below dams, the long-river network share and post-removal response time in their matching axes.',
  before: 'C 6.3, human and ecosystem, range B–D',
  after: `${issueRowsById.get('dam_and_diversion_infrastructure').result.grade.letter} ${issueRowsById.get('dam_and_diversion_infrastructure').result.value}, human and ecosystem, range C–D`,
}, {
  nodeId: 'trophic_cascade_collapses',
  defect: 'A broad biodiversity assessment and graph-linked food-security pathway had been treated as direct global human-and-ecosystem harm, without a measured global prevalence denominator.',
  correction: 'The detailed review now uses marine, freshwater and terrestrial meta-analyses for conditional ecosystem response magnitude, keeps study coverage out of reach, excludes experiment duration from recovery time and leaves downstream human pathways with their own nodes.',
  before: 'D 6.6, human and ecosystem, range B–E, evidence through 2019',
  after: `${issueRowsById.get('trophic_cascade_collapses').result.grade.letter} ${issueRowsById.get('trophic_cascade_collapses').result.value}, ecosystem only, range B–D, evidence through 2024`,
}, {
  nodeId: 'watershed_forest_loss',
  defect: 'Study samples, countries and water intakes had not been separated from harmed-person or ecosystem reach, while generic chronicity and downstream graph effects pushed the candidate upward.',
  correction: 'The detailed review uses direct multi-country childhood-illness evidence for human severity, retains evidence coverage as coverage, uses the measured two-week outcome for human persistence and keeps projected treatment cost in the outlook.',
  before: 'D 6.6, human and ecosystem, range B–E, evidence through 2011',
  after: `${issueRowsById.get('watershed_forest_loss').result.grade.letter} ${issueRowsById.get('watershed_forest_loss').result.value}, human and ecosystem, range B–D, evidence through 2025`,
}, {
  nodeId: 'mangrove_buffer_loss',
  defect: 'Mapped cover loss had supplied qualitative severity and persistence judgments, while the people and property protected by all mangroves risked being confused with current harm from observed recent loss.',
  correction: 'The detailed review now routes the 25.01% protection-index change to ecosystem severity, 6.183745% gross cover loss to ecosystem reach and 20–40-year restoration results to ecosystem persistence. The full-loss flood counterfactual establishes material human service but remains outside current harmed-person reach.',
  before: 'D 6.6, human and ecosystem, range B–E, extent evidence through 2025',
  after: `${issueRowsById.get('mangrove_buffer_loss').result.grade.letter} ${issueRowsById.get('mangrove_buffer_loss').result.value}, human and ecosystem, range C–D, evidence through 2025`,
}, {
  nodeId: 'supply_chain_port_bottlenecks',
  defect: 'The share of global trade handled by ports had been interpreted as ecosystem reach, while a long generic persistence range replaced the measured expected downtime.',
  correction: 'The detailed review now uses the global climate-related port-risk model for human economic severity and event-scale persistence, removes the unsupported ecosystem domain, and keeps ports, countries and trade value outside harmed-person reach.',
  before: 'D 6.6, human and ecosystem, range B–E',
  after: `${issueRowsById.get('supply_chain_port_bottlenecks').result.grade.letter} ${issueRowsById.get('supply_chain_port_bottlenecks').result.value}, human only, range A–C`,
}, {
  nodeId: 'invasive_species_encroachment',
  defect: 'A broad family classification had not used the assessment’s direct extinction, economic-loss and irreversibility endpoints, while global assessment coverage and documented-impact shares could be mistaken for reach denominators.',
  correction: 'The detailed review now uses extinction for terminal ecological severity, irreversibility for ecological persistence and annual economic cost for material human severity. It keeps species counts, report shares, regions and realms outside harmed-person and affected-ecosystem reach.',
  before: 'C 6.3, human and ecosystem, range B–E, confidence C',
  after: `${issueRowsById.get('invasive_species_encroachment').result.grade.letter} ${issueRowsById.get('invasive_species_encroachment').result.value}, human and ecosystem, range C–E, confidence B`,
}, {
  nodeId: 'food',
  defect: 'A one-year commodity-demand total and broad downstream pathways had been treated as direct human-and-ecosystem harm, while the node description incorrectly implied that total global agricultural land was expanding.',
  correction: 'The detailed review uses the published global land-use biodiversity model and source workbook, confines the current endpoint to ecosystems, and records that cropland expanded while total agricultural land declined slightly. Food prices, food insecurity, water stress, labour exposure and health outcomes remain in their dedicated nodes.',
  before: 'C 4.8, human and ecosystem, range A–D, confidence C',
  after: `${issueRowsById.get('food').result.grade.letter} ${issueRowsById.get('food').result.value}, ecosystem only, range B–D, confidence B`,
}, {
  nodeId: 'managed_retreat_pressure',
  defect: 'Cumulative historical acquisitions, a broad property-pressure concept and post-acquisition open space had been treated as current human-and-ecosystem harm without a current household denominator.',
  correction: 'The detailed review uses the current Hurricane Helene acquisition pipeline as a household-scale reach proxy, the documented two-to-three-year process for persistence, and confines the adverse endpoint to people. Flood damage, governance delay, historical program totals and permanent open space remain separate.',
  before: 'B 4.4, human and ecosystem, range A–D, confidence C',
  after: `${issueRowsById.get('managed_retreat_pressure').result.grade.letter} ${issueRowsById.get('managed_retreat_pressure').result.value}, human only, range B–D, confidence B`,
}, {
  nodeId: 'food_waste',
  defect: 'A one-year global waste flow, daily recurrence and worldwide estimate coverage had been treated as chronic ecosystem harm, while the report’s direct economic loss was omitted from the human domain.',
  correction: 'The detailed review uses the annual discarded-food value as a human material-loss proxy, treats the direct waste stream as an annual flow, and retains land, water and emissions as broader pressure context rather than terminal ecosystem severity or reach.',
  before: 'C 6.3, ecosystem only, range B–E, confidence C',
  after: `${issueRowsById.get('food_waste').result.grade.letter} ${issueRowsById.get('food_waste').result.value}, human and ecosystem, range B–C, confidence B`,
}, {
  nodeId: 'ocean_heat_content',
  defect: 'A precise global physical measurement had been treated as if its geography measured global human and ecosystem harm, and downstream consequences from connected nodes had filled unsupported axes.',
  correction: 'The detailed review now keeps the NOAA heat anomaly and standard error in the physical-state record, uses IPCC impact evidence only for bounded consequences, and separates World Ocean coverage, harmed people, affected ecosystem distribution and recovery time.',
  before: 'D 6.6, human and ecosystem, range B–E, confidence B',
  after: `${issueRowsById.get('ocean_heat_content').result.grade.letter} ${issueRowsById.get('ocean_heat_content').result.value}, human and ecosystem, range B–D, confidence B`,
}, {
  nodeId: 'ocean_carbon_uptake_weakening',
  defect: 'A global budget and its long record had been treated as worldwide human and ecosystem harm, while the total observed sink was described as weakening and an unrelated airport consequence filled the human component.',
  correction: 'The detailed review now distinguishes the still-growing observed sink from the 7.1% climate-attributable reduction relative to a CO2-only counterfactual. It scores the lost ocean carbon-buffering function once, excludes unsupported direct human harm and keeps global integration, model range, latitude bands and downstream effects outside additional axes.',
  before: 'D 6.6, human and ecosystem, range B–E, confidence B',
  after: `${issueRowsById.get('ocean_carbon_uptake_weakening').result.grade.letter} ${issueRowsById.get('ocean_carbon_uptake_weakening').result.value}, ecosystem regulating function only, range B–D, confidence B`,
}, {
  nodeId: 'phytoplankton_decline',
  defect: 'An evidence record ending in 2015 had mixed global production loss, declining-area share, record length and downstream fish-supply pathways, producing an unsupported human component and an overstated D rating.',
  correction: 'The detailed review uses the current 1997–2022 global production record, routes the 7.4% cumulative functional loss to severity and the independently measured 48% declining ocean area to reach. It excludes downstream fisheries and human harm, does not turn the 25-year record into recovery time and keeps the future direction mixed.',
  before: 'D 7.4, human and ecosystem, range C–E, confidence C',
  after: `${issueRowsById.get('phytoplankton_decline').result.grade.letter} ${issueRowsById.get('phytoplankton_decline').result.value}, ecosystem production function only, range C–D, confidence B`,
}, {
  nodeId: 'riverine_habitat_fragmentation',
  defect: 'A 2019 long-river percentage was retained as evidence but not routed to reach, while severity and persistence came from generic assumptions and the seven-year source age had previously appeared as a persistence fact.',
  correction: 'The detailed review routes the 63% long-river share to reach, direct fish connectivity and biological response to severity, and one-to-eleven-year post-removal response to persistence. It keeps smaller-river and taxonomic gaps explicit and excludes human service exposure.',
  before: 'D 7.0, ecosystem only, range C–E, confidence C, evidence through 2019',
  after: `${issueRowsById.get('riverine_habitat_fragmentation').result.grade.letter} ${issueRowsById.get('riverine_habitat_fragmentation').result.value}, ecosystem only, range C–E, confidence C, evidence through 2026`,
}, {
  nodeId: 'harmful_algal_blooms',
  defect: 'Monitoring geography, a 7% event-type share and the 34-year HAEDAT observation span had been converted into human and ecosystem reach, ecological harm and consequence persistence.',
  correction: 'The detailed review now uses quantified ciguatera illness for human reach, symptom duration for human persistence and a current South Australian multi-taxon mortality event for ecosystem severity and a persistence lower bound. It keeps event reports, monitored regions, database length and connected fishery or water-service harms outside the number.',
  before: 'D 7.0, human and ecosystem, range C–E, confidence C, evidence through 2018',
  after: `${issueRowsById.get('harmful_algal_blooms').result.grade.letter} ${issueRowsById.get('harmful_algal_blooms').result.value}, human and ecosystem, range B–D, confidence C, evidence through 2026`,
}, {
  nodeId: 'hydrological_runoff_surges',
  defect: 'A single 1978 flood report and generic assumptions had been used to assign global human and ecosystem reach plus chronic persistence, producing a D despite no compatible global denominator or recovery evidence.',
  correction: 'The detailed review now uses a reproducible cause-filtered global event distribution for fatalities and annual displacement, keeps satellite exposure outside harmed reach, and uses a river meta-analysis to record that high-flow ecological responses are inconsistent and globally sparse. Event duration supplies acute context only, never recovery time.',
  before: 'D 7.0, human and ecosystem, range C–E, confidence C, evidence through 1978',
  after: `${issueRowsById.get('hydrological_runoff_surges').result.grade.letter} ${issueRowsById.get('hydrological_runoff_surges').result.value}, human and ecosystem, range B–D, confidence C, evidence through 2025`,
}, {
  nodeId: 'tundra_methane_outgassing',
  defect: 'A placeholder 2026 site-flux description and broad methane-family assumptions had been presented without a reproducible annual source history or a boundary between total Arctic-Boreal methane, wetland flux and methane newly caused by current thaw.',
  correction: 'The detailed review now reproduces a checksum-pinned 2010–2021 annual Arctic-Boreal inversion, keeps its source components separate and uses the Global Methane Budget to bound thaw attribution. Gross methane flow remains physical context and does not validate human or ecosystem harm axes without a source-removal response and matched endpoints.',
  before: 'D 6.6, range B–E, confidence D, placeholder current evidence',
  after: `${issueRowsById.get('tundra_methane_outgassing').result.grade.letter} ${issueRowsById.get('tundra_methane_outgassing').result.value}, range B–E, confidence D, reproducible evidence through 2026`,
}, {
  nodeId: 'wildfire_regime_shift',
  defect: 'A generic wildfire-family profile had combined fire occurrence, smoke exposure, downstream health nodes and broad ecosystem assumptions without separating climate-attributed terminal mortality from forest damage and recovery.',
  correction: 'The detailed review uses only climate-attributed fire-PM2.5 deaths for human severity and reach, and a separate 3,281-fire global forest study for ecosystem condition and recovery. It excludes total fire deaths, event count as affected-area reach, smoke and hospitalization scores, and naturally occurring or beneficial fire from automatic harm.',
  before: 'D 6.6, human and ecosystem, range B–E, confidence B, generic family evidence',
  after: `${issueRowsById.get('wildfire_regime_shift').result.grade.letter} ${issueRowsById.get('wildfire_regime_shift').result.value}, human and ecosystem, range C–D, confidence B, source-specific evidence through 2025`,
}, {
  nodeId: 'bridge_scour_exposure',
  defect: 'A bridge-engineering vulnerability census, daily vehicle crossings and generic infrastructure assumptions had been converted into current human severity, reach and persistence without a cause-coded failure or service-loss series.',
  correction: 'The detailed review now uses the 2025 national inventory only for engineering prevalence, keeps repeated traffic crossings outside harmed-person reach and uses two NTSB fatal collapse cases only to bound possible realized severity. Bridge count, historical fatalities, closures and flood consequences do not become current annual harm.',
  before: 'C 4.8, human only, range A–D, confidence C, structured classification',
  after: `${issueRowsById.get('bridge_scour_exposure').result.grade.letter} ${issueRowsById.get('bridge_scour_exposure').result.value}, human only, range A–C, confidence C, source-specific evidence through 2025`,
}, {
  nodeId: 'fishery_protein_dependence',
  defect: 'A worldwide count of people receiving nutrition from aquatic foods and broad fishery-system context had been converted into current human harm without a defined supply disruption or measured adverse outcome.',
  correction: 'The detailed review now treats dietary protein contribution, livelihoods supported and production tonnes as benefit, reliance or system context. None becomes harmed-person reach, severity or persistence; a separate causal record must link a defined disruption to nutrition, health or material loss.',
  before: 'C 4.8, human only, range A–D, confidence C, structured classification',
  after: `${issueRowsById.get('fishery_protein_dependence').result.grade.letter} ${issueRowsById.get('fishery_protein_dependence').result.value}, human only, range A–C, confidence C, source-specific evidence through 2026`,
}, {
  nodeId: 'basin_treaty_breakdown',
  defect: 'A basin-area cooperation-coverage gap and shared-water country counts had been converted into current human harm even though the source does not count treaty breakdown, service failure, conflict or people harmed.',
  correction: 'The detailed review now treats SDG 6.5.2 as institutional-coverage and preparedness context, records the observed improvement from 2017 to 2023, and keeps country count, basin area, monitoring span and connected drought or conflict outcomes outside the three harm axes.',
  before: 'C 4.8, human only, range A–D, confidence C, structured classification',
  after: `${issueRowsById.get('basin_treaty_breakdown').result.grade.letter} ${issueRowsById.get('basin_treaty_breakdown').result.value}, human only, range A–C, confidence C, source-specific evidence through 2024`,
}, {
  nodeId: 'migration',
  defect: 'The broad Migration node had relied on an annual disaster-movement flow without separating repeated movements, unique people, end-year displacement stock, conflict displacement, geophysical hazards, protective evacuation or climate attribution. The redistributed API also exposed all-zero 2024 and 2025 placeholder slices that could be mistaken for observations.',
  correction: 'The detailed review now uses IDMC’s end-2025 disaster-displacement stock as the current reach proxy, keeps the annual flow as recurrence context, excludes conflict and cross-border movement, and records the lack of event-level climate attribution. The ingestion rule rejects trailing all-zero placeholder years when the primary report records nonzero displacement.',
  before: 'C 4.8, human only, range A–D, confidence C, structured classification',
  after: `${issueRowsById.get('migration').result.grade.letter} ${issueRowsById.get('migration').result.value}, human only, range B–D, confidence C, source-specific evidence through 2026`,
}, {
  nodeId: 'subsea_cable_landing_chokepoint',
  defect: 'Global traffic share, cable and fault counts, bandwidth loss and repair time had been combined through a structured classification without separating infrastructure exposure from realized human consequences.',
  correction: 'The detailed review now anchors severity and persistence to documented service and material-loss cases, while keeping traffic, cables, faults, bandwidth and repair work outside unique-person reach and distinguishing a cable fault from an outage caused by route or landing concentration.',
  before: 'C 4.8, human only, range A–D, confidence C, structured classification',
  after: `${issueRowsById.get('subsea_cable_landing_chokepoint').result.grade.letter} ${issueRowsById.get('subsea_cable_landing_chokepoint').result.value}, human only, range B–C, confidence C, source-specific evidence through 2026`,
}, {
  nodeId: 'coastal_groundwater_withdrawal',
  defect: 'The generic evidence parser treated a source statement about five aquifers as a count of five people and used it to set human reach.',
  correction: 'The detailed review now joins checksum-pinned USGS physical evidence to Cape May’s April 2025 water-system record. Current reverse-osmosis dependence, the reported 5,000 permanent and 50,000 summer service populations, a salinity-specific $12.6 million equipment phase and 27 years of operation anchor human consequence. Accounts, wells, aquifers and communities remain separate quantities, and the local case is not extrapolated globally.',
  before: 'C 4.8, human and ecosystem, range B 2.9–D 6.6, confidence C, evidence through 2002 with five aquifers parsed as five people',
  after: `${issueRowsById.get('coastal_groundwater_withdrawal').result.grade.letter} ${issueRowsById.get('coastal_groundwater_withdrawal').result.value}, human and ecosystem, range C 4.8–D 7.4, confidence C, current service evidence through 2025 and modeled conditions through 2023`,
}, {
  nodeId: 'floodplain_exposure',
  defect: 'A modeled population-exposure count had been treated as a count of people currently harmed, and a human floodplain exposure dataset had been expanded into an unsupported ecosystem component.',
  correction: 'The detailed review now uses global exposure and vulnerability-adjusted risk models as risk-state evidence. It keeps approximately two billion exposed people, relative-risk quintiles and model coverage outside realized human reach, removes the unsupported nature component and does not add alternative threshold estimates.',
  before: 'C 6.3, human and ecosystem, range B–D, confidence C, evidence through 2018',
  after: `${issueRowsById.get('floodplain_exposure').result.grade.letter} ${issueRowsById.get('floodplain_exposure').result.value}, human only, range A–C, confidence C, source-specific evidence through 2024`,
}, {
  nodeId: 'urbanization',
  defect: 'A count of roughly 6.25 billion residents in urban settlement classes had been treated as a count of people currently harmed, creating a source-anchored level-4 human reach that the evidence did not measure.',
  correction: 'The detailed review now uses the 2025 UN settlement revision to separate residence from adverse human consequences and built surface from ecosystem condition. It retains the measured land-conversion stock while leaving harmed-person reach, ecosystem-condition loss and recovery duration explicitly bounded.',
  before: 'C 6.3, human and ecosystem, range B–E, confidence C, evidence through 2020 with urban residents parsed as people harmed',
  after: `${issueRowsById.get('urbanization').result.grade.letter} ${issueRowsById.get('urbanization').result.value}, human and ecosystem, range B 2.9–D 7.8, confidence C, source-specific evidence through 2025`,
}, {
  nodeId: 'groundwater_depletion_wells',
  defect: 'Countries in a global aquifer study accounted for approximately 75% of worldwide groundwater withdrawals. The generic classifier treated that study-coverage statistic as level-4 ecosystem reach and combined it with an unvalidated ecosystem-severity percentage.',
  correction: 'The detailed review reproduces the 169,717-well and 1,693-aquifer open dataset, routes the 36% sampled-aquifer decline prevalence only to a bounded physical-pressure proxy, and keeps withdrawal coverage, wells, aquifers and acceleration shares outside harmed-person and ecosystem-distribution reach. Documented recovery cases also prevent the observation span from becoming automatic permanence.',
  before: 'D 6.6, human and ecosystem, range C 4.8–E 8.5, confidence B, with 75% study-country withdrawal coverage used as ecosystem reach',
  after: `${issueRowsById.get('groundwater_depletion_wells').result.grade.letter} ${issueRowsById.get('groundwater_depletion_wells').result.value}, human and ecosystem, range B 2.9–D 7.8, confidence C, source-specific evidence published in 2024 with observations through 2022`,
}, {
  nodeId: 'desalination_dependence',
  defect: 'The generic classifier treated roughly 300 million people supplied with desalinated water as 300 million people harmed, assigning maximum human reach from a benefit and reliance statistic.',
  correction: 'The detailed review now separates the water service from adverse outcomes and adds direct ecological studies showing local benthic effects at some facilities and no detectable fish-assemblage harm at another. Plants, countries, users, production, brine and energy use stay outside harm reach.',
  before: 'C 4.8, human and ecosystem, range B 2.9–D 6.6, confidence C, with people supplied used as harmed-person reach',
  after: `${issueRowsById.get('desalination_dependence').result.grade.letter} ${issueRowsById.get('desalination_dependence').result.value}, human and ecosystem, range A 2.1–C 6.3, confidence C, source-specific ecological evidence through 2021 and current system context through 2025`,
}, {
  nodeId: 'gas_power_dependence',
  defect: 'The generic classifier treated gas-fired electricity generation share as regional human reach and added an ecosystem component from downstream emissions, although the source measured system reliance rather than people or ecosystems harmed.',
  correction: 'The detailed review now uses Ember only for current reliance and history, and the IEA 2022 crisis analysis only for a bounded affordability pathway. It removes the duplicated ecosystem domain and keeps generation share, the broad crisis population, the observation span and downstream carbon consequences outside the three human-harm axes.',
  before: 'B 4.4, human and ecosystem, range A 2.1–D 6.6, confidence B, with generation share used as harm context and ecosystem pressure duplicated',
  after: `${issueRowsById.get('gas_power_dependence').result.grade.letter} ${issueRowsById.get('gas_power_dependence').result.value}, human only, range A 1.0–C 5.5, confidence C, current generation evidence through 2025 and observed affordability evidence from 2022`,
}, {
  nodeId: 'hydropower_reliability_decline',
  defect: 'The generic classifier labelled total world hydropower generation as an availability shortfall and used that production series to support identical human and ecosystem harm components.',
  correction: 'The detailed review now uses IEA capacity factor for the global reliability state and Ecuador’s 2024 rationing and loss record for a direct human consequence. It removes the unsupported ecosystem component and keeps total TWh, country coverage, hydropower share, record length and downstream river or emissions effects outside the human axes.',
  before: 'C 4.8, human and ecosystem, range A 2.5–D 7.0, confidence B, with total generation used as reliability evidence',
  after: `${issueRowsById.get('hydropower_reliability_decline').result.grade.letter} ${issueRowsById.get('hydropower_reliability_decline').result.value}, human only, range B 3.3–D 7.0, confidence C, global reliability evidence through 2023 and direct consequence evidence from 2024`,
}, {
  nodeId: 'fish_landing_supply_disruption',
  defect: 'The generic classifier treated global marine-capture tonnage as disruption evidence and used generic regional assumptions for reach and persistence, even though aggregate production does not measure household food loss, income loss or people harmed.',
  correction: 'The detailed review now uses Peru’s official 2023–2025 industrial, direct-food and fishing-output record as a bounded disruption-and-recovery case. It keeps global tonnes, industrial anchoveta, sector percentages, the observation span and separate stock or ecosystem effects outside harmed-person reach and terminal-consequence persistence.',
  before: 'C 4.8, human only, range A 2.5–D 7.0, confidence B, with global production used as disruption context',
  after: `${issueRowsById.get('fish_landing_supply_disruption').result.grade.letter} ${issueRowsById.get('fish_landing_supply_disruption').result.value}, human only, range B 3.3–C 5.5, confidence C, source-specific evidence through 2025 published in 2026`,
}, {
  nodeId: 'marine_food_web_simplification',
  defect: 'The generic classifier used a broad threatened-species share as if it measured this node’s ecosystem reach and retained a human component from dependence and exposure rather than demonstrated terminal harm.',
  correction: 'The detailed review now uses direct Caribbean trophic-structure reconstruction and a 26–46-year, seven-sub-basin Baltic food-web analysis. It removes the unsupported human domain and keeps people near reefs, monitored regions, samples, species, record length and downstream fishery or economic effects outside the ecosystem axes.',
  before: 'D 7.4, human and ecosystem, range C 5.1–E 9.6, confidence C, with generic biodiversity and human-dependence context',
  after: `${issueRowsById.get('marine_food_web_simplification').result.grade.letter} ${issueRowsById.get('marine_food_web_simplification').result.value}, ecosystem only, range B 4.0–D 7.0, confidence C, direct regional evidence published in 2026`,
}, {
  nodeId: 'arctic_amplification_rates',
  defect: 'The generic classifier converted global physical influence into human reach and used a 0.050603% spatial-data fraction as ecosystem reach, although neither value measured terminal harm.',
  correction: 'The detailed review now pins NOAA’s 2025 Arctic temperature state and Arctic-versus-global trends, then uses IPCC only for bounded human and ecosystem consequences. It keeps the Arctic map, all residents, temperature magnitude, record length and downstream-node scores outside the axes.',
  before: 'C 6.3, human and ecosystem, range B 4.4–E 8.5, confidence B, with physical coverage and a spatial-data proxy used as harm reach',
  after: `${issueRowsById.get('arctic_amplification_rates').result.grade.letter} ${issueRowsById.get('arctic_amplification_rates').result.value}, human and ecosystem, range B 4.4–D 7.8, confidence C, source-specific evidence through 2025`,
}, {
  nodeId: 'ice_albedo_feedback_loops',
  defect: 'The generic classifier treated 700 million people exposed to broader cryosphere change as people harmed by this feedback and used physical snow-cover percentages as ecosystem harm or reach.',
  correction: 'The detailed review now uses current NOAA snow and sea-ice observations plus the IPCC surface-albedo mechanism. It keeps physical snow and ice percentages, the Arctic footprint, record length and downstream-node scores outside terminal harm, while retaining bounded human and ecosystem consequences.',
  before: 'D 7.4, human and ecosystem, range C 5.9–E 9.3, confidence C, with exposure and physical-state proxies used as harm',
  after: `${issueRowsById.get('ice_albedo_feedback_loops').result.grade.letter} ${issueRowsById.get('ice_albedo_feedback_loops').result.value}, human and ecosystem, range B 4.0–D 7.4, confidence C, source-specific evidence through 2025`,
}, {
  nodeId: 'peat_oxidation_pulse',
  defect: 'The generic classifier assigned direct human harm from a relationship path and treated a physical carbon-dioxide series as broad harm evidence, even though FAOSTAT measures agricultural drained-organic-soil area and emissions rather than harmed people or ecosystem collapse.',
  correction: 'The detailed review now pins the October 2025 FAOSTAT archive, excludes source-flagged imputed 2023–2024 values from the current state, and scores the direct loss of peat carbon-storage function. It keeps annual tonnes, intensity, record length, broader degraded-peatland reach and all downstream climate or water consequences outside the wrong axes.',
  before: 'C 6.3, human and ecosystem, range B 4.0–E 8.5, confidence B, with physical flux and relationship-derived human effects used as terminal harm',
  after: `${issueRowsById.get('peat_oxidation_pulse').result.grade.letter} ${issueRowsById.get('peat_oxidation_pulse').result.value}, ecosystem only, range C 4.8–D 7.8, confidence C, source-specific evidence through the October 2025 release`,
}, {
  nodeId: 'species_range_compression',
  defect: 'The generic classifier used a 25% broad biodiversity statistic as severity context and assigned regional reach and chronic persistence without direct range-loss, ecosystem-area or recovery evidence. It could also blur range shifts, sampled-species prevalence and contraction into the same quantity.',
  correction: 'The detailed review now pins direct range-map and warm-edge local-extinction records, includes a regional study showing both contraction and expansion, and keeps percentage range lost separate from sampled-species share, affected ecosystem area and recovery time. Observation span, publication year and downstream biodiversity or human consequences stay outside the axes.',
  before: 'D 7.0, ecosystem only, range C 4.8–E 9.3, confidence C, with a generic biodiversity proxy and structured reach and persistence',
  after: `${issueRowsById.get('species_range_compression').result.grade.letter} ${issueRowsById.get('species_range_compression').result.value}, ecosystem only, range B 3.3–D 7.8, confidence C, direct global mammal evidence through 2017 and corroborating publications through 2023`,
}, {
  nodeId: 'reservoir_storage_instability',
  defect: 'The generic classifier treated more than two billion people with threatened reservoir water supplies as two billion people already harmed, assigning human reach level 4. It also used physical storage and irrigation context as broad ecosystem harm without a compatible condition measure.',
  correction: 'The detailed review now pins the 2026 global sedimentation methods and source workbooks plus the 1999–2018 satellite storage record. It scores persistent loss of engineered storage function while keeping threatened supply, realized service interruption, irrigated-land dependence, ecosystem condition and future 2040–2100 projections separate.',
  before: 'C 5.5, human and ecosystem, range B 3.6–D 7.4, confidence C, with threatened population used as current harmed-person reach',
  after: `${issueRowsById.get('reservoir_storage_instability').result.grade.letter} ${issueRowsById.get('reservoir_storage_instability').result.value}, human and ecosystem, range B 3.6–D 7.4, confidence C, direct physical storage-function evidence published in 2026`,
}, {
  nodeId: 'old_growth_forest_logging',
  defect: 'The generic classifier used a Tongass regional area percentage to support reach for a global node and treated a long-lived forest process as broad human and ecosystem harm without a global logging-attribution denominator.',
  correction: 'The detailed review now pins FAO FRA 2025 for global primary-forest context and a 2024 multi-taxon Sabah study for direct logging severity. FAO cannot separate logging from other causes of primary-forest loss, and the single-site taxon responses cannot become global ecosystem reach. Human dependence, forest employment, carbon, fire, hunting and downstream biodiversity stay outside the axes.',
  before: 'D 7.0, human and ecosystem, range C 4.8–E 9.3, confidence C, with regional area and generic persistence used as global harm evidence',
  after: `${issueRowsById.get('old_growth_forest_logging').result.grade.letter} ${issueRowsById.get('old_growth_forest_logging').result.value}, human and ecosystem, range B 2.9–D 7.4, confidence C, global context through 2025 and direct ecological evidence published in 2024`,
}, {
  nodeId: 'ice_sheet_mass_loss',
  defect: 'The generic classifier treated global satellite coverage of the Greenland and Antarctic ice sheets as global reach of current human and ecosystem harm. It also used physical mass loss as if it directly measured terminal consequences.',
  correction: 'The detailed review now checksum-pins the September 2026 IMBIE monthly records, source data from a paired Greenland fjord study and an SSP2-4.5 Greenland projection. It keeps gigatonnes, millimetres of sea-level contribution, ice-sheet area, study coverage, downstream coastal nodes and the observation span outside the wrong axes.',
  before: 'D 7.0, human and ecosystem, range C 4.8–E 9.3, confidence C, with global physical coverage used as global harm reach',
  after: `${issueRowsById.get('ice_sheet_mass_loss').result.grade.letter} ${issueRowsById.get('ice_sheet_mass_loss').result.value}, human and ecosystem, range B 3.3–D 7.4, confidence C, reconciled mass balance through 2023 published in 2026 and direct local ecosystem evidence`,
}, {
  nodeId: 'blue_carbon_habitat_loss',
  defect: 'A broad global blue-ecosystem description had been used to assign high human reach and broad ecosystem harm without separating habitat-specific loss, degradation, gain, carbon flux, beneficiaries or source-native denominators.',
  correction: 'The detailed review checksum-pins recent global mangrove and seagrass products plus the global salt-marsh change archive. It uses mapped conversion for local ecosystem severity and each habitat’s own loss share for reach, while excluding beneficiary exposure, carbon flows, related-node scores and an unreconciled country-workbook total.',
  before: 'D 7.4, human and ecosystem, range C 5.1–E 9.6, confidence C, broad evidence through 2020',
  after: `${issueRowsById.get('blue_carbon_habitat_loss').result.grade.letter} ${issueRowsById.get('blue_carbon_habitat_loss').result.value}, human and ecosystem, range B 3.6–D 7.8, confidence B, habitat-specific global mapping published in 2026`,
}, {
  nodeId: 'coral_bleaching',
  defect: 'The initial source-specific review correctly separated heat exposure from harm but still used broad regional aggregates, leaving its lower severity, reach and persistence bounds much wider than the available detailed evidence required.',
  correction: 'The detailed review now parses 51 GCRMN subregions with mapped reef-area weights, pins the global 2014–2017 bleaching and mortality model and adds multi-year recovery evidence. It keeps the 46.9% unavailable-change share in the upper bound and does not relabel historical bleaching as current condition.',
  before: 'D 8.1, human and ecosystem, range C 5.9–E 9.6, confidence C, heat exposure used as reach',
  after: `${issueRowsById.get('coral_bleaching').result.grade.letter} ${issueRowsById.get('coral_bleaching').result.value}, ecosystem only, range C 6.3–E 8.5, confidence B, current condition through 2024 plus historical global damage calibration and recovery evidence`,
}, {
  nodeId: 'ocean_acidification',
  defect: 'The prior detailed review treated a global surface-ocean chemical signal as broad human reach and near-global ecosystem harm, although pH coverage does not count people harmed and equal biological damage is not observed everywhere.',
  correction: 'The detailed review now checksum-pins the global chemistry series, open organism-specific habitat-threshold tables, a global biotic-pattern study and a bounded commercial hatchery consequence. Chemical state, harmed people, marginal habitat, ecosystem condition and recovery stay separate.',
  before: 'D 8.1, human and ecosystem, range C 5.9–E 9.6, confidence C, global chemistry used as reach',
  after: `${issueRowsById.get('ocean_acidification').result.grade.letter} ${issueRowsById.get('ocean_acidification').result.value}, human and ecosystem, range B 4.4–D 8.1, confidence C, global chemistry through 2024 and ecosystem studies published in 2025`,
}, {
  nodeId: 'north_atlantic_oscillation',
  defect: 'The prior source-specific review recognized physical and ecosystem pathways but left human severity centered on inconvenience even after a peer-reviewed catastrophe model had quantified a direct economic-loss relationship.',
  correction: 'The detailed review now checksum-pins the author reproducibility archive, a second peer-reviewed model study, the open HANZE event file and the official daily NAO series. Its open reproduction independently retains three damaging/not-damaging region-season associations after false-discovery control, with opposite signs, while no low, medium or high class survives. It uses that bounded material-loss relationship for human severity while keeping association, proprietary outputs, absolute attributable losses, affected population, recovery time and downstream flood consequences outside unsupported axes.',
  before: 'B 4.4, human and ecosystem, range A 1.8–D 6.6, confidence C',
  after: `${issueRowsById.get('north_atlantic_oscillation').result.grade.letter} ${issueRowsById.get('north_atlantic_oscillation').result.value}, human and ecosystem, range A 2.1–D 6.6, confidence C, independently reproduced open flood-loss associations through 2020`,
}, {
  nodeId: 'cement_concrete',
  defect: 'The structured review rated Cement / Concrete from industry-transition context and authored long-lived-harm assumptions without a cement-specific terminal health endpoint. It also risked adding CO2-related health burden already represented by cement-process, kiln-fuel and downstream climate nodes.',
  correction: 'The detailed review now checksum-pins a peer-reviewed near-global cement-plant model and its open workbook. It uses the direct PM2.5 and precursor DALY total once, excludes CO2-related DALYs and facility coverage from harmed-person reach, and leaves quarry ecosystem severity, distribution and recovery explicitly uncalibrated.',
  before: 'D 6.6, human and ecosystem, range B 4.4–D 8.1, confidence C, structured industry-transition evidence',
  after: `${issueRowsById.get('cement_concrete').result.grade.letter} ${issueRowsById.get('cement_concrete').result.value}, human and ecosystem, range C 5.1–E 8.5, confidence C, near-global modeled plant-health evidence published in 2023 using a 2016 plant state`,
}, {
  nodeId: 'humanitarian_response_funding_shortfall',
  defect: 'The structured review used generic humanitarian planning context and a broad affected-population range without a direct observed service-interruption consequence. Its lower bound allowed a near-zero current impact even though current operational losses were documented.',
  correction: 'The detailed review checksum-pins an official 2026 United Nations report. It uses 3.8 million people affected by 455 funding-driven health-facility closures or suspensions once, keeps potentially overlapping nutrition users and mine-action decline separate, and leaves terminal health outcomes and interruption duration bounded.',
  before: 'C 4.8, human only, range A 2.5–D 7.0, confidence B, generic planning-funding evidence',
  after: `${issueRowsById.get('humanitarian_response_funding_shortfall').result.grade.letter} ${issueRowsById.get('humanitarian_response_funding_shortfall').result.value}, human only, range C 5.5–D 7.8, confidence B, direct 2025 essential-service interruption published in 2026`,
}, {
  nodeId: 'humanitarian_resource_gaps',
  defect: 'The structured review treated an official financial requirement gap as if it established an operational response-capacity consequence, while its reach remained a broad unsupported judgment.',
  correction: 'The detailed review now uses observed health- and nutrition-facility closures and affected people as direct operational-capacity evidence. It keeps the upstream funding shortfall, planning totals, facility counts and overlapping service populations separate, and explicitly prohibits adding this node to the funding-shortfall rating.',
  before: 'C 4.8, human only, range A 2.5–D 7.0, confidence B, financial-plan proxy without direct operational reach',
  after: `${issueRowsById.get('humanitarian_resource_gaps').result.grade.letter} ${issueRowsById.get('humanitarian_resource_gaps').result.value}, human only, range C 5.5–D 7.8, confidence B, direct 2025 operational service loss published in 2026`,
}, {
  nodeId: 'humanitarian_access_constraints',
  defect: 'The structured review rated access constraints from a generic country-level severity product without a direct operational consequence, leaving mild inconvenience in the lower bound and treating reach as a broad family judgment.',
  correction: 'The detailed review checksum-pins Myanmar’s 2026 response plan and uses documented staff relocation, activity suspension and affected essential-service continuity for severity. It retains incident and township coverage only as upper reach context and excludes people in need, funding-driven non-receipt and record length from the wrong axes.',
  before: 'C 4.8, human only, range A 2.5–D 7.0, confidence B, generic access-severity evidence',
  after: `${issueRowsById.get('humanitarian_access_constraints').result.grade.letter} ${issueRowsById.get('humanitarian_access_constraints').result.value}, human only, range B 4.0–D 7.8, confidence B, direct operational service-interruption evidence from 2025`,
}, {
  nodeId: 'staple_food_price_volatility',
  defect: 'The structured review recognized food-security pressure but relied on a commodity-price series and broad family judgment rather than a direct observed human consequence. Its lower bound still allowed mild inconvenience, and its reach was not tied to an attributable population.',
  correction: 'The detailed review checksum-pins SOFI 2025 and uses its adjusted food-insecurity and child-wasting associations for severity. It keeps country coverage, exposed residents, baseline prevalence, model observations and reporting years outside harmed-person reach and persistence, and records the national-food-price versus staple-only mismatch.',
  before: 'C 4.8, human only, range A 2.5–D 7.0, confidence B, commodity-price context without a direct consequence model',
  after: `${issueRowsById.get('staple_food_price_volatility').result.grade.letter} ${issueRowsById.get('staple_food_price_volatility').result.value}, human only, range B 4.0–D 7.8, confidence B, direct multi-country food-security and child-wasting associations published in 2025`,
}, {
  nodeId: 'humanitarian_surge_demand',
  defect: 'The structured review treated casualties and general humanitarian need as if they measured harm caused by surge demand, and assigned a month-to-year central duration without a direct overload-consequence record.',
  correction: 'The detailed review checksum-pins a 2025 WHO event account. It uses overwhelmed facilities, overburdened staff and affected routine services for severity while keeping conflict casualties, damaged facilities, displaced people, beds, supply constraints, access and funding outside overload-attributable reach. The acute record supports event-scale central persistence only.',
  before: 'C 4.8, human only, range A 2.5–D 7.0, confidence B, broad planning and need context',
  after: `${issueRowsById.get('humanitarian_surge_demand').result.grade.letter} ${issueRowsById.get('humanitarian_surge_demand').result.value}, human only, range B 4.0–D 7.8, confidence C, direct regional overload and routine-service evidence from 2025`,
}, {
  nodeId: 'cfc_saturated_layers',
  defect: 'The structured review converted a globally mixed residual ozone-depleting chemical stock into substantial, broad ecosystem condition loss and short ecological persistence without a source-removal endpoint model.',
  correction: 'The detailed review checksum-pins NOAA’s 2024 Ozone-Depleting Gas Index, UNEP’s environmental-effects update, an open ozone–UV–carbon model archive and a 2026 multi-dataset ozone-attribution study. Independent models support the causal chain but their policy and world-avoided scenarios do not measure current terminal harm. ODGI remains physical stock, UV exposure remains outside harmed reach, and the missing present source-removal endpoint remains explicit through confidence D.',
  before: 'C 6.3, ecosystem only, range B 4.0–E 8.5, confidence B, with physical chemical burden used as broad terminal ecological harm',
  after: `${issueRowsById.get('cfc_saturated_layers').result.grade.letter} ${issueRowsById.get('cfc_saturated_layers').result.value}, ecosystem only, range A 1.8–D 7.0, confidence D, independently stress-tested with the upstream stock separated from downstream ecological endpoints`,
}, {
  nodeId: 'stratospheric_chlorine_sinks',
  defect: 'The structured review treated ozone-column depletion as substantial global ecosystem condition loss and used the atmospheric state as if it measured ecological severity, affected distribution and recovery.',
  correction: 'The detailed review checksum-pins WMO’s complete 2024 ozone season, UNEP’s environmental-effects update, a current Antarctic-biota review and a 2026 multi-dataset ozone-attribution study. It keeps mass deficit, UV Index, exposed area, event timing and atmospheric recovery separate from terminal ecological condition, harmed distribution and recovery, while preserving chemistry and dynamic attribution limits.',
  before: 'C 6.3, ecosystem only, range B 4.0–E 8.5, confidence B, with atmospheric depletion used as broad terminal ecological harm',
  after: `${issueRowsById.get('stratospheric_chlorine_sinks').result.grade.letter} ${issueRowsById.get('stratospheric_chlorine_sinks').result.value}, ecosystem only, range A 1.8–D 7.0, confidence C, independently stress-tested with bounded regional ecological effects and continuing atmospheric recovery`,
}, {
  nodeId: 'reef_structural_collapse',
  defect: 'The structured review treated a parsed numeral as three people harmed, inherited global reach from heat exposure and bleaching context, and treated those pathways as direct evidence of worldwide reef structural collapse.',
  correction: 'The detailed review checksum-pins a 2026 longitudinal photogrammetry study. It uses significant change in three habitat-structure metrics for local ecosystem severity, keeps the metrics separate, uses incomplete recovery through 2019 for multi-year persistence, removes the unsupported human domain and limits central reach to the single studied reef system.',
  before: 'D 6.6, human and ecosystem, range C 4.8–E 8.5, confidence C, with false human reach and unsupported global structural reach',
  after: `${issueRowsById.get('reef_structural_collapse').result.grade.letter} ${issueRowsById.get('reef_structural_collapse').result.value}, ecosystem only, range B 4.0–D 7.8, confidence C, direct local structural-condition and recovery evidence from 2026`,
}, {
  nodeId: 'coral_reef_fragmentation',
  defect: 'The structured review treated a parsed numeral as three people harmed, expanded one generic NOAA reef source into substantial global ecosystem loss and treated a chronic label as measured recovery duration.',
  correction: 'The detailed review checksum-pins a 2025 open fragmentation study and a global reef-distribution map. It uses the measured local patch-configuration change for mild ecosystem severity, limits central reach to one bay, removes the unsupported human domain and keeps the two-year survey interval separate from recovery time.',
  before: 'D 6.6, human and ecosystem, range C 4.8–E 8.5, confidence C, with false human reach and unsupported global fragmentation extent',
  after: `${issueRowsById.get('coral_reef_fragmentation').result.grade.letter} ${issueRowsById.get('coral_reef_fragmentation').result.value}, ecosystem only, range A 1.8–D 6.3, confidence C, direct local patch-configuration evidence published in 2025`,
}, {
  nodeId: 'tidal_wetland_carbon_reversal',
  defect: 'The structured review inferred direct human harm from an upstream carbon-stock process, assigned broad ecosystem reach without an affected-distribution denominator and treated a generic chronic label as recovery evidence.',
  correction: 'The detailed review checksum-pins a 2026 global tidal-wetland soil-carbon analysis and directly processes its six full-resolution depth-by-period mean maps. On the common mapped wetland extent, 29.0% of the global union area loses at least 5% of modelled soil carbon density and 20.7% loses at least 10%. Materiality thresholds from any decline through at least 70% loss all resolve to D 7.0 under the recorded severity, reach and persistence anchors. The review keeps about 64,581 km² of period-only classification churn outside the central reach denominator, preserves the archived change-product disagreement and the missing formal change uncertainty in a B–E range, removes downstream human effects, and uses source-observed multi-decade disturbance responses for persistence bounds.',
  before: 'C 6.3, ecosystem only, range B 4.0–E 10.0, confidence B, with the affected wetland-area denominator still unresolved',
  after: `${issueRowsById.get('tidal_wetland_carbon_reversal').result.grade.letter} ${issueRowsById.get('tidal_wetland_carbon_reversal').result.value}, ecosystem only, range B 4.0–E 10.0, confidence B, with full-resolution common-extent reach and explicit classification-churn sensitivity`,
}, {
  nodeId: 'river_flow_regime_shift',
  defect: 'The structured review treated significant decreased-flow basins and residents living in those basins as evidence of broad, substantial terminal ecosystem and human harm, while using observation duration as a proxy for recovery.',
  correction: 'The detailed review checksum-pins the official UN-Water snapshot, a 2024 observation-based flow-regime analysis, a global environmental-flow-to-biodiversity test and open meta-analysis data. It separates physical flow change from ecological condition, keeps residents as exposure context, removes downstream human consequences and leaves recovery broad where direct evidence is missing.',
  before: 'D 6.6, human and ecosystem, range C 4.8–E 8.5, confidence C, with physical change and exposed residents converted into terminal harm',
  after: `${issueRowsById.get('river_flow_regime_shift').result.grade.letter} ${issueRowsById.get('river_flow_regime_shift').result.value}, ecosystem only, range A 1.8–D 7.0, confidence C, with physical flow change separated from ecological condition and human exposure`,
}, {
  nodeId: 'coastal_permafrost_erosion',
  defect: 'The prior review relied on relocation threats and an evidence record ending in 2015, leaving all three human axes bounded even though the community-level consequence had since been completed.',
  correction: 'The detailed review now checksum-pins GAO and Alaska primary reports and adds the 2025 Yukon-Kuskokwim synthesis. Newtok\'s completed fall-2024 population relocation fixes severe displacement, bounded local reach and permanent settlement loss while compound ecosystem evidence remains bounded.',
  before: 'D 7.0, human and ecosystem, range C 5.1–D 7.8, confidence B, evidence ending in 2015',
  after: `${issueRowsById.get('coastal_permafrost_erosion').result.grade.letter} ${issueRowsById.get('coastal_permafrost_erosion').result.value}, human and ecosystem, range C 5.9–D 7.4, confidence B, direct human consequence through 2024 published in 2025`,
}, {
  nodeId: 'shell_calcification_failures',
  defect: 'The structured parser treated two affected production seasons as two harmed people and converted the 50–85% share of West Coast oyster operations supplied by hatcheries into global ecosystem reach.',
  correction: 'The detailed review now checksum-pins a 2025 global biological-threshold workbook and a 2025 Pacific-industry study. It uses separate bivalve and pteropod habitat denominators, keeps habitat marginality distinct from observed organism failure and keeps respondent share distinct from harmed-person reach.',
  before: 'D 7.0, human and ecosystem, range C 5.1–E 8.9, confidence C, evidence ending in 2008',
  after: `${issueRowsById.get('shell_calcification_failures').result.grade.letter} ${issueRowsById.get('shell_calcification_failures').result.value}, human and ecosystem, range B 3.6–D 7.8, confidence C, current evidence published in 2025`,
}, {
  nodeId: 'urban_sprawl_housing',
  defect: 'The structured review relied on a 2020 physical settlement snapshot, treated authored long duration as near-irreversible ecological harm and lacked a current direction check for land-use efficiency.',
  correction: 'The detailed review now uses the checksum-pinned 2025 UN built-land stock and current Goal 11 land-consumption evidence. It keeps total built surface, city coverage and residents outside ecosystem and human reach, excludes the unsupported human domain and records the recent slowdown without treating it as restoration.',
  before: 'C 6.3, ecosystem only, range B 4.0–D 7.8, confidence B, evidence ending in 2020',
  after: `${issueRowsById.get('urban_sprawl_housing').result.grade.letter} ${issueRowsById.get('urban_sprawl_housing').result.value}, ecosystem only, range B 3.3–D 7.8, confidence C, current evidence through 2025 reported in 2026`,
}, {
  nodeId: 'aquifer_recharge_failure',
  defect: 'The structured review blurred rain-fed recharge decline, groundwater storage depletion, pumping, people living in affected basins and demonstrated downstream harm, while deriving broad consequences from physical evidence ending in 2020.',
  correction: 'The detailed review checksum-pins the global annual recharge archive and its 2025 peer-reviewed analysis. It preserves the slightly positive global mean alongside regional decline, excludes storage loss where recharge increased from recharge-failure attribution, and keeps exposed residents outside harmed-person reach.',
  before: 'C 5.9, human and ecosystem, range B 3.6–E 8.1, confidence C, physical evidence ending in 2020',
  after: `${issueRowsById.get('aquifer_recharge_failure').result.grade.letter} ${issueRowsById.get('aquifer_recharge_failure').result.value}, human and ecosystem, range A 2.1–D 7.0, confidence C, direct global recharge evidence published in 2025`,
}];
const report = `# TULIP full catalogue double audit\n\nAudited through 23 September 2026. Scope: **354 issue ratings and 27 response controls**. This audit covers the complete internally authored catalogue now exported to the shared local assessment registry. Production deployment remains a separate release step.\n\n## Result\n\n- Pass 1 — independent calculation, coverage, policy, source binding and response exclusions: **${pass1.status}** (${pass1.counts.passed}/${pass1.counts.catalogue} records passed; ${pass1.counts.failed + pass1.counts.globalErrors} errors).\n- Pass 2 — evidence trace, domain boundaries, fallback support, semantic safeguards and grade stability: **${pass2.status.replaceAll('_', ' ')}** (${pass2.counts.criticalFailures} critical failures).\n- Final issue distribution: ${Object.entries(gradeCounts).map(([grade, count]) => `${grade} ${count}`).join(', ')}.\n- Grade stable throughout recorded bounds: ${gradeStabilityCounts.stable}.\n- Crosses one grade boundary within recorded bounds: ${gradeStabilityCounts.crossesOneBoundary}.\n- Crosses two or more grade boundaries within recorded bounds: ${gradeStabilityCounts.crossesMultipleBoundaries}.\n- Newest registry evidence ends before 2021: ${pass2.counts.evidenceEndingBefore2021}.\n- Central value lies within 0.2 score points of a grade boundary: ${pass2.counts.centralValuesNearBoundary}.\n- Emissions-source candidates with unresolved source-specific allocation: ${pass2.counts.unresolvedEmissionSourceAllocations}.\n- Exact ecosystem-severity mappings still awaiting an explicit severity-versus-reach semantic review: ${pass2.counts.ecosystemExactSeveritySemanticsUnreviewed}.\n\n## Corrections made during the audit\n\n- **Mountain Pass Avalanches:** ${corrections[0].defect} ${corrections[0].correction} It changed from ${corrections[0].before} to ${corrections[0].after}.\n- **Axis uncertainty:** ${corrections[1].defect} ${corrections[1].correction}\n- **Persistence:** ${corrections[2].defect} ${corrections[2].correction}\n- **Node titles:** ${corrections[3].defect} ${corrections[3].correction}\n- **Context-only facts:** ${corrections[4].defect} ${corrections[4].correction}\n- **Emission-source allocation:** source nodes cannot inherit the Carbon Emissions or Methane score. Until a compatible source-removal counterfactual reaches non-overlapping terminal consequences, the candidate remains confidence D and explicitly excludes the aggregate and downstream scores.\n- **Coral larval survival and recruitment:** ${corrections[5].defect} ${corrections[5].correction} It changed from ${corrections[5].before} to ${corrections[5].after}.\n- **Pyrocumulonimbus smoke injection:** ${corrections[6].defect} ${corrections[6].correction} It changed from ${corrections[6].before} to ${corrections[6].after}.\n\n## What the result means\n\nEvery central rating now reproduces exactly from its six axes, the fixed people/nature weighting and the A–E thresholds. Every source ID used by a candidate remains bound to that node's registry record, every domain exclusion is an explicit structural zero, and all 27 response nodes remain outside danger scoring.\n\nThe central grades are therefore correct **under the current v6 TULIP method and its recorded evidence choices**. The stability count is a separate warning: a central grade can be calculated correctly while its lower and upper evidence bounds cross another grade. Those nodes need stronger evidence or narrower, justified conversions before the letter can be described as robust. No nodes were moved merely to populate the unused A band.\n\n## Audit boundary\n\nThis is a complete internal reproducibility and evidence-trace audit. It does not independently reproduce every external scientific study from raw data, and it does not claim the TULIP weights are scientific constants. Structured and family-calibrated judgments stay labelled through confidence and per-node flags.\n`;
const expandedReport = report.replace('\n\n## What the result means', `\n- **Forest fragmentation:** ${corrections[7].defect} ${corrections[7].correction} It changed from ${corrections[7].before} to ${corrections[7].after}.\n- **Coastal property insurance nonrenewal:** ${corrections[8].defect} ${corrections[8].correction} It changed from ${corrections[8].before} to ${corrections[8].after}.\n- **Urban water rationing:** ${corrections[9].defect} ${corrections[9].correction} It changed from ${corrections[9].before} to ${corrections[9].after}.\n- **Tundra shrub expansion:** ${corrections[10].defect} ${corrections[10].correction} It changed from ${corrections[10].before} to ${corrections[10].after}.\n- **Transformer heat-failure risk:** ${corrections[11].defect} ${corrections[11].correction} It changed from ${corrections[11].before} to ${corrections[11].after}.\n- **Resource depletion:** ${corrections[12].defect} ${corrections[12].correction} It changed from ${corrections[12].before} to ${corrections[12].after}.\n- **Extreme precipitation intensity:** ${corrections[13].defect} ${corrections[13].correction} It changed from ${corrections[13].before} to ${corrections[13].after}.\n- **Convective instability:** ${corrections[14].defect} ${corrections[14].correction} It changed from ${corrections[14].before} to ${corrections[14].after}.\n- **Black carbon deposition:** ${corrections[15].defect} ${corrections[15].correction} It changed from ${corrections[15].before} to ${corrections[15].after}.\n- **Antarctic shelf instability:** ${corrections[16].defect} ${corrections[16].correction} It changed from ${corrections[16].before} to ${corrections[16].after}.\n\n## What the result means`);
const completeExpandedReport = expandedReport.replace('\n\n## What the result means', `\n- **Savanna tree-cover decline:** ${corrections[17].defect} ${corrections[17].correction} It changed from ${corrections[17].before} to ${corrections[17].after}.\n\n## What the result means`);
const finalExpandedReport = completeExpandedReport.replace('\n\n## What the result means', `\n- **Ice-algae pigmentation:** ${corrections[18].defect} ${corrections[18].correction} It changed from ${corrections[18].before} to ${corrections[18].after}.\n- **Cryoconite-hole expansion:** ${corrections[19].defect} ${corrections[19].correction} It changed from ${corrections[19].before} to ${corrections[19].after}.\n\n## What the result means`);
const latestExpandedReport = finalExpandedReport.replace('\n\n## What the result means', `\n- **Mountain forest cover and treeline contraction:** ${corrections[20].defect} ${corrections[20].correction} It changed from ${corrections[20].before} to ${corrections[20].after}.\n\n## What the result means`);
const newestExpandedReport = latestExpandedReport.replace('\n\n## What the result means', `\n- **Nunatak habitat shrinkage:** ${corrections[21].defect} ${corrections[21].correction} It changed from ${corrections[21].before} to ${corrections[21].after}.\n\n## What the result means`);
const currentExpandedReport = newestExpandedReport.replace('\n\n## What the result means', `\n- **Freeze–thaw rock fracturing:** ${corrections[22].defect} ${corrections[22].correction} It changed from ${corrections[22].before} to ${corrections[22].after}.\n\n## What the result means`);
const presentExpandedReport = currentExpandedReport.replace('\n\n## What the result means', `\n- **Arctic pack-ice drift:** ${corrections[23].defect} ${corrections[23].correction} It changed from ${corrections[23].before} to ${corrections[23].after}.\n\n## What the result means`);
const newestReport = presentExpandedReport.replace('\n\n## What the result means', `\n- **Fjord sedimentation pulses:** ${corrections[24].defect} ${corrections[24].correction} It changed from ${corrections[24].before} to ${corrections[24].after}.\n\n## What the result means`);
const currentReport = newestReport.replace('\n\n## What the result means', `\n- **Glacial siltation in streams:** ${corrections[25].defect} ${corrections[25].correction} It changed from ${corrections[25].before} to ${corrections[25].after}.\n\n## What the result means`);
const latestReport = currentReport.replace('\n\n## What the result means', `\n- **Talik expansion:** ${corrections[26].defect} ${corrections[26].correction} It changed from ${corrections[26].before} to ${corrections[26].after}.\n\n## What the result means`);
const completedReport = latestReport.replace('\n\n## What the result means', `\n- **Soil moisture collapse:** ${corrections[27].defect} ${corrections[27].correction} It changed from ${corrections[27].before} to ${corrections[27].after}.\n\n## What the result means`);
const domainBoundaryReport = completedReport.replace('\n\n## What the result means', `\n- **Structural domain scope:** ${corrections[28].defect} ${corrections[28].correction} ${corrections[28].example}\n\n## What the result means`);
const persistenceBoundaryReport = domainBoundaryReport.replace('\n\n## What the result means', `\n- **Consequence duration:** ${corrections[29].defect} ${corrections[29].correction} ${corrections[29].example}\n\n## What the result means`);
const evidenceTraceReport = persistenceBoundaryReport.replace(
  '\n\n## Corrections made during the audit',
  `\n- Retained pilot ratings still awaiting an authoritative per-axis evidence trace: ${pass2.counts.retainedPilotAxisBasisNotRecorded}.\n\n## Corrections made during the audit`,
);
const measurementSemanticsReport = evidenceTraceReport.replace(
  '\n\n## What the result means',
  `\n- **Ecosystem measurement semantics:** ${corrections[30].defect} ${corrections[30].correction} ${corrections[30].example}\n\n## What the result means`,
);
const insectCorrection = corrections.find(correction => correction.nodeId === 'insect_biomass_decline');
const insectEvidenceReport = measurementSemanticsReport.replace(
  '\n\n## What the result means',
  `\n- **Insect biomass decline:** ${insectCorrection.defect} ${insectCorrection.correction} It changed from ${insectCorrection.before} to ${insectCorrection.after}.\n\n## What the result means`,
);
const peatlandCorrection = corrections.find(correction => correction.nodeId === 'peatland_degradations');
const peatlandEvidenceReport = insectEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Peatland degradation:** ${peatlandCorrection.defect} ${peatlandCorrection.correction} It changed from ${peatlandCorrection.before} to ${peatlandCorrection.after}.\n\n## What the result means`,
);
const coldChainCorrection = corrections.find(correction => correction.nodeId === 'cold_chain_failure_risk');
const coldChainEvidenceReport = peatlandEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Cold-chain failure risk:** ${coldChainCorrection.defect} ${coldChainCorrection.correction} It changed from ${coldChainCorrection.before} to ${coldChainCorrection.after}.\n\n## What the result means`,
);
const damDiversionCorrection = corrections.find(correction => correction.nodeId === 'dam_and_diversion_infrastructure');
const damDiversionEvidenceReport = coldChainEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Dam and diversion infrastructure:** ${damDiversionCorrection.defect} ${damDiversionCorrection.correction} It changed from ${damDiversionCorrection.before} to ${damDiversionCorrection.after}.\n\n## What the result means`,
);
const trophicCascadeCorrection = corrections.find(correction => correction.nodeId === 'trophic_cascade_collapses');
const trophicCascadeEvidenceReport = damDiversionEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Trophic cascade disruption:** ${trophicCascadeCorrection.defect} ${trophicCascadeCorrection.correction} It changed from ${trophicCascadeCorrection.before} to ${trophicCascadeCorrection.after}.\n\n## What the result means`,
);
const watershedForestLossCorrection = corrections.find(correction => correction.nodeId === 'watershed_forest_loss');
const watershedForestLossEvidenceReport = trophicCascadeEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Watershed forest loss:** ${watershedForestLossCorrection.defect} ${watershedForestLossCorrection.correction} It changed from ${watershedForestLossCorrection.before} to ${watershedForestLossCorrection.after}.\n\n## What the result means`,
);
const mangroveBufferCorrection = corrections.find(correction => correction.nodeId === 'mangrove_buffer_loss');
const mangroveBufferEvidenceReport = watershedForestLossEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Mangrove buffer loss:** ${mangroveBufferCorrection.defect} ${mangroveBufferCorrection.correction} It changed from ${mangroveBufferCorrection.before} to ${mangroveBufferCorrection.after}.\n\n## What the result means`,
);
const portBottleneckCorrection = corrections.find(correction => correction.nodeId === 'supply_chain_port_bottlenecks');
const portBottleneckEvidenceReport = mangroveBufferEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Supply-chain port bottlenecks:** ${portBottleneckCorrection.defect} ${portBottleneckCorrection.correction} It changed from ${portBottleneckCorrection.before} to ${portBottleneckCorrection.after}.\n\n## What the result means`,
);
const invasiveSpeciesCorrection = corrections.find(correction => correction.nodeId === 'invasive_species_encroachment');
const invasiveSpeciesEvidenceReport = portBottleneckEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Invasive Species Encroachment:** ${invasiveSpeciesCorrection.defect} ${invasiveSpeciesCorrection.correction} It changed from ${invasiveSpeciesCorrection.before} to ${invasiveSpeciesCorrection.after}.\n\n## What the result means`,
);
const agriculturalDemandCorrection = corrections.find(correction => correction.nodeId === 'food');
const agriculturalDemandEvidenceReport = invasiveSpeciesEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Agricultural Demand:** ${agriculturalDemandCorrection.defect} ${agriculturalDemandCorrection.correction} It changed from ${agriculturalDemandCorrection.before} to ${agriculturalDemandCorrection.after}.\n\n## What the result means`,
);
const managedRetreatCorrection = corrections.find(correction => correction.nodeId === 'managed_retreat_pressure');
const managedRetreatEvidenceReport = agriculturalDemandEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Managed-Retreat Decision Pressure:** ${managedRetreatCorrection.defect} ${managedRetreatCorrection.correction} It changed from ${managedRetreatCorrection.before} to ${managedRetreatCorrection.after}.\n\n## What the result means`,
);
const foodWasteCorrection = corrections.find(correction => correction.nodeId === 'food_waste');
const foodWasteEvidenceReport = managedRetreatEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Food Waste:** ${foodWasteCorrection.defect} ${foodWasteCorrection.correction} It changed from ${foodWasteCorrection.before} to ${foodWasteCorrection.after}.\n\n## What the result means`,
);
const oceanHeatContentCorrection = corrections.find(correction => correction.nodeId === 'ocean_heat_content');
const oceanHeatContentEvidenceReport = foodWasteEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Ocean Heat Content:** ${oceanHeatContentCorrection.defect} ${oceanHeatContentCorrection.correction} It changed from ${oceanHeatContentCorrection.before} to ${oceanHeatContentCorrection.after}.\n\n## What the result means`,
);
const oceanCarbonUptakeCorrection = corrections.find(correction => correction.nodeId === 'ocean_carbon_uptake_weakening');
const oceanCarbonUptakeEvidenceReport = oceanHeatContentEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Ocean Carbon Uptake Weakening:** ${oceanCarbonUptakeCorrection.defect} ${oceanCarbonUptakeCorrection.correction} It changed from ${oceanCarbonUptakeCorrection.before} to ${oceanCarbonUptakeCorrection.after}.\n\n## What the result means`,
);
const phytoplanktonDeclineCorrection = corrections.find(correction => correction.nodeId === 'phytoplankton_decline');
const phytoplanktonDeclineEvidenceReport = oceanCarbonUptakeEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Phytoplankton Decline:** ${phytoplanktonDeclineCorrection.defect} ${phytoplanktonDeclineCorrection.correction} It changed from ${phytoplanktonDeclineCorrection.before} to ${phytoplanktonDeclineCorrection.after}.\n\n## What the result means`,
);
const riverFragmentationCorrection = corrections.find(correction => correction.nodeId === 'riverine_habitat_fragmentation');
const riverFragmentationEvidenceReport = phytoplanktonDeclineEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **River Network Fragmentation:** ${riverFragmentationCorrection.defect} ${riverFragmentationCorrection.correction} It changed from ${riverFragmentationCorrection.before} to ${riverFragmentationCorrection.after}.\n\n## What the result means`,
);
const harmfulAlgalBloomsCorrection = corrections.find(correction => correction.nodeId === 'harmful_algal_blooms');
const harmfulAlgalBloomsEvidenceReport = riverFragmentationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Harmful Algal Blooms:** ${harmfulAlgalBloomsCorrection.defect} ${harmfulAlgalBloomsCorrection.correction} It changed from ${harmfulAlgalBloomsCorrection.before} to ${harmfulAlgalBloomsCorrection.after}.\n\n## What the result means`,
);
const rapidRunoffResponseCorrection = corrections.find(correction => correction.nodeId === 'hydrological_runoff_surges');
const rapidRunoffResponseEvidenceReport = harmfulAlgalBloomsEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Rapid Runoff Response:** ${rapidRunoffResponseCorrection.defect} ${rapidRunoffResponseCorrection.correction} It changed from ${rapidRunoffResponseCorrection.before} to ${rapidRunoffResponseCorrection.after}.\n\n## What the result means`,
);
const tundraMethaneCorrection = corrections.find(correction => correction.nodeId === 'tundra_methane_outgassing');
const tundraMethaneEvidenceReport = rapidRunoffResponseEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Tundra Methane Outgassing:** ${tundraMethaneCorrection.defect} ${tundraMethaneCorrection.correction} It changed from ${tundraMethaneCorrection.before} to ${tundraMethaneCorrection.after}.\n\n## What the result means`,
);
const wildfireRegimeShiftCorrection = corrections.find(correction => correction.nodeId === 'wildfire_regime_shift');
const wildfireRegimeShiftEvidenceReport = tundraMethaneEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Wildfire Regime Shift:** ${wildfireRegimeShiftCorrection.defect} ${wildfireRegimeShiftCorrection.correction} It changed from ${wildfireRegimeShiftCorrection.before} to ${wildfireRegimeShiftCorrection.after}.\n\n## What the result means`,
);
const bridgeScourCorrection = corrections.find(correction => correction.nodeId === 'bridge_scour_exposure');
const bridgeScourEvidenceReport = wildfireRegimeShiftEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Bridge Scour Exposure:** ${bridgeScourCorrection.defect} ${bridgeScourCorrection.correction} It changed from ${bridgeScourCorrection.before} to ${bridgeScourCorrection.after}.\n\n## What the result means`,
);
const coastalGroundwaterWithdrawalCorrection = corrections.find(correction => correction.nodeId === 'coastal_groundwater_withdrawal');
const coastalGroundwaterWithdrawalEvidenceReport = bridgeScourEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Coastal Groundwater Withdrawal:** ${coastalGroundwaterWithdrawalCorrection.defect} ${coastalGroundwaterWithdrawalCorrection.correction} It changed from ${coastalGroundwaterWithdrawalCorrection.before} to ${coastalGroundwaterWithdrawalCorrection.after}.\n\n## What the result means`,
);
const floodplainExposureCorrection = corrections.find(correction => correction.nodeId === 'floodplain_exposure');
const floodplainExposureEvidenceReport = coastalGroundwaterWithdrawalEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Population and Asset Exposure in Floodplains:** ${floodplainExposureCorrection.defect} ${floodplainExposureCorrection.correction} It changed from ${floodplainExposureCorrection.before} to ${floodplainExposureCorrection.after}.\n\n## What the result means`,
);
const urbanizationCorrection = corrections.find(correction => correction.nodeId === 'urbanization');
const urbanizationEvidenceReport = floodplainExposureEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Urbanization:** ${urbanizationCorrection.defect} ${urbanizationCorrection.correction} It changed from ${urbanizationCorrection.before} to ${urbanizationCorrection.after}.\n\n## What the result means`,
);
const groundwaterDepletionCorrection = corrections.find(correction => correction.nodeId === 'groundwater_depletion_wells');
const groundwaterDepletionEvidenceReport = urbanizationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Groundwater Depletion Wells:** ${groundwaterDepletionCorrection.defect} ${groundwaterDepletionCorrection.correction} It changed from ${groundwaterDepletionCorrection.before} to ${groundwaterDepletionCorrection.after}.\n\n## What the result means`,
);
const desalinationDependenceCorrection = corrections.find(correction => correction.nodeId === 'desalination_dependence');
const desalinationDependenceEvidenceReport = groundwaterDepletionEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Desalination Dependence:** ${desalinationDependenceCorrection.defect} ${desalinationDependenceCorrection.correction} It changed from ${desalinationDependenceCorrection.before} to ${desalinationDependenceCorrection.after}.\n\n## What the result means`,
);
const gasPowerDependenceCorrection = corrections.find(correction => correction.nodeId === 'gas_power_dependence');
const gasPowerDependenceEvidenceReport = desalinationDependenceEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Gas Power Dependence:** ${gasPowerDependenceCorrection.defect} ${gasPowerDependenceCorrection.correction} It changed from ${gasPowerDependenceCorrection.before} to ${gasPowerDependenceCorrection.after}.\n\n## What the result means`,
);
const hydropowerReliabilityCorrection = corrections.find(correction => correction.nodeId === 'hydropower_reliability_decline');
const hydropowerReliabilityEvidenceReport = gasPowerDependenceEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Hydropower Reliability Decline:** ${hydropowerReliabilityCorrection.defect} ${hydropowerReliabilityCorrection.correction} It changed from ${hydropowerReliabilityCorrection.before} to ${hydropowerReliabilityCorrection.after}.\n\n## What the result means`,
);
const fishLandingSupplyDisruptionCorrection = corrections.find(correction => correction.nodeId === 'fish_landing_supply_disruption');
const fishLandingSupplyDisruptionEvidenceReport = hydropowerReliabilityEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Fish Landing Supply Disruption:** ${fishLandingSupplyDisruptionCorrection.defect} ${fishLandingSupplyDisruptionCorrection.correction} It changed from ${fishLandingSupplyDisruptionCorrection.before} to ${fishLandingSupplyDisruptionCorrection.after}.\n\n## What the result means`,
);
const marineFoodWebReorganizationCorrection = corrections.find(correction => correction.nodeId === 'marine_food_web_simplification');
const marineFoodWebReorganizationEvidenceReport = fishLandingSupplyDisruptionEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Marine Food-Web Reorganization:** ${marineFoodWebReorganizationCorrection.defect} ${marineFoodWebReorganizationCorrection.correction} It changed from ${marineFoodWebReorganizationCorrection.before} to ${marineFoodWebReorganizationCorrection.after}.\n\n## What the result means`,
);
const arcticAmplificationCorrection = corrections.find(correction => correction.nodeId === 'arctic_amplification_rates');
const arcticAmplificationEvidenceReport = marineFoodWebReorganizationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Arctic Amplification:** ${arcticAmplificationCorrection.defect} ${arcticAmplificationCorrection.correction} It changed from ${arcticAmplificationCorrection.before} to ${arcticAmplificationCorrection.after}.\n\n## What the result means`,
);
const iceAlbedoFeedbackCorrection = corrections.find(correction => correction.nodeId === 'ice_albedo_feedback_loops');
const iceAlbedoFeedbackEvidenceReport = arcticAmplificationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Ice–Albedo Feedback Loops:** ${iceAlbedoFeedbackCorrection.defect} ${iceAlbedoFeedbackCorrection.correction} It changed from ${iceAlbedoFeedbackCorrection.before} to ${iceAlbedoFeedbackCorrection.after}.\n\n## What the result means`,
);
const peatOxidationCorrection = corrections.find(correction => correction.nodeId === 'peat_oxidation_pulse');
const peatOxidationEvidenceReport = iceAlbedoFeedbackEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Peat Oxidation Pulse:** ${peatOxidationCorrection.defect} ${peatOxidationCorrection.correction} It changed from ${peatOxidationCorrection.before} to ${peatOxidationCorrection.after}.\n\n## What the result means`,
);
const speciesRangeContractionCorrection = corrections.find(correction => correction.nodeId === 'species_range_compression');
const speciesRangeContractionEvidenceReport = peatOxidationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Species Range Contraction:** ${speciesRangeContractionCorrection.defect} ${speciesRangeContractionCorrection.correction} It changed from ${speciesRangeContractionCorrection.before} to ${speciesRangeContractionCorrection.after}.\n\n## What the result means`,
);
const reservoirStorageInstabilityCorrection = corrections.find(correction => correction.nodeId === 'reservoir_storage_instability');
const reservoirStorageInstabilityEvidenceReport = speciesRangeContractionEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Reservoir Storage Instability:** ${reservoirStorageInstabilityCorrection.defect} ${reservoirStorageInstabilityCorrection.correction} It changed from ${reservoirStorageInstabilityCorrection.before} to ${reservoirStorageInstabilityCorrection.after}.\n\n## What the result means`,
);
const oldGrowthForestLoggingCorrection = corrections.find(correction => correction.nodeId === 'old_growth_forest_logging');
const oldGrowthForestLoggingEvidenceReport = reservoirStorageInstabilityEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Old-Growth Forest Logging:** ${oldGrowthForestLoggingCorrection.defect} ${oldGrowthForestLoggingCorrection.correction} It changed from ${oldGrowthForestLoggingCorrection.before} to ${oldGrowthForestLoggingCorrection.after}.\n\n## What the result means`,
);
const iceSheetMassLossCorrection = corrections.find(correction => correction.nodeId === 'ice_sheet_mass_loss');
const iceSheetMassLossEvidenceReport = oldGrowthForestLoggingEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Ice Sheet Mass Loss:** ${iceSheetMassLossCorrection.defect} ${iceSheetMassLossCorrection.correction} It changed from ${iceSheetMassLossCorrection.before} to ${iceSheetMassLossCorrection.after}.\n\n## What the result means`,
);
const blueCarbonHabitatLossCorrection = corrections.find(correction => correction.nodeId === 'blue_carbon_habitat_loss');
const blueCarbonHabitatLossEvidenceReport = iceSheetMassLossEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Blue Carbon Habitat Loss:** ${blueCarbonHabitatLossCorrection.defect} ${blueCarbonHabitatLossCorrection.correction} It changed from ${blueCarbonHabitatLossCorrection.before} to ${blueCarbonHabitatLossCorrection.after}.\n\n## What the result means`,
);
const coralBleachingCorrection = corrections.find(correction => correction.nodeId === 'coral_bleaching');
const coralBleachingEvidenceReport = blueCarbonHabitatLossEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Coral Bleaching:** ${coralBleachingCorrection.defect} ${coralBleachingCorrection.correction} It changed from ${coralBleachingCorrection.before} to ${coralBleachingCorrection.after}.\n\n## What the result means`,
);
const oceanAcidificationCorrection = corrections.find(correction => correction.nodeId === 'ocean_acidification');
const oceanAcidificationEvidenceReport = coralBleachingEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Ocean Acidification:** ${oceanAcidificationCorrection.defect} ${oceanAcidificationCorrection.correction} It changed from ${oceanAcidificationCorrection.before} to ${oceanAcidificationCorrection.after}.\n\n## What the result means`,
);
const northAtlanticOscillationCorrection = corrections.find(correction => correction.nodeId === 'north_atlantic_oscillation');
const northAtlanticOscillationEvidenceReport = oceanAcidificationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **North Atlantic Oscillation:** ${northAtlanticOscillationCorrection.defect} ${northAtlanticOscillationCorrection.correction} It changed from ${northAtlanticOscillationCorrection.before} to ${northAtlanticOscillationCorrection.after}.\n\n## What the result means`,
);
const cementConcreteCorrection = corrections.find(correction => correction.nodeId === 'cement_concrete');
const cementConcreteEvidenceReport = northAtlanticOscillationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Cement / Concrete:** ${cementConcreteCorrection.defect} ${cementConcreteCorrection.correction} It changed from ${cementConcreteCorrection.before} to ${cementConcreteCorrection.after}.\n\n## What the result means`,
);
const humanitarianFundingShortfallCorrection = corrections.find(correction => correction.nodeId === 'humanitarian_response_funding_shortfall');
const humanitarianFundingShortfallEvidenceReport = cementConcreteEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Humanitarian Response Funding Shortfall:** ${humanitarianFundingShortfallCorrection.defect} ${humanitarianFundingShortfallCorrection.correction} It changed from ${humanitarianFundingShortfallCorrection.before} to ${humanitarianFundingShortfallCorrection.after}.\n\n## What the result means`,
);
const humanitarianResourceGapsCorrection = corrections.find(correction => correction.nodeId === 'humanitarian_resource_gaps');
const humanitarianResourceGapsEvidenceReport = humanitarianFundingShortfallEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Humanitarian Response Capacity Gap:** ${humanitarianResourceGapsCorrection.defect} ${humanitarianResourceGapsCorrection.correction} It changed from ${humanitarianResourceGapsCorrection.before} to ${humanitarianResourceGapsCorrection.after}.\n\n## What the result means`,
);
const humanitarianAccessConstraintsCorrection = corrections.find(correction => correction.nodeId === 'humanitarian_access_constraints');
const humanitarianAccessConstraintsEvidenceReport = humanitarianResourceGapsEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Humanitarian Access Constraints:** ${humanitarianAccessConstraintsCorrection.defect} ${humanitarianAccessConstraintsCorrection.correction} It changed from ${humanitarianAccessConstraintsCorrection.before} to ${humanitarianAccessConstraintsCorrection.after}.\n\n## What the result means`,
);
const stapleFoodPriceVolatilityCorrection = corrections.find(correction => correction.nodeId === 'staple_food_price_volatility');
const stapleFoodPriceVolatilityEvidenceReport = humanitarianAccessConstraintsEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Staple Food Price Volatility:** ${stapleFoodPriceVolatilityCorrection.defect} ${stapleFoodPriceVolatilityCorrection.correction} It changed from ${stapleFoodPriceVolatilityCorrection.before} to ${stapleFoodPriceVolatilityCorrection.after}.\n\n## What the result means`,
);
const humanitarianSurgeDemandCorrection = corrections.find(correction => correction.nodeId === 'humanitarian_surge_demand');
const humanitarianSurgeDemandEvidenceReport = stapleFoodPriceVolatilityEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Humanitarian Surge Demand:** ${humanitarianSurgeDemandCorrection.defect} ${humanitarianSurgeDemandCorrection.correction} It changed from ${humanitarianSurgeDemandCorrection.before} to ${humanitarianSurgeDemandCorrection.after}.\n\n## What the result means`,
);
const reefStructuralCollapseCorrection = corrections.find(correction => correction.nodeId === 'reef_structural_collapse');
const reefStructuralCollapseEvidenceReport = humanitarianSurgeDemandEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Reef Structural Collapse:** ${reefStructuralCollapseCorrection.defect} ${reefStructuralCollapseCorrection.correction} It changed from ${reefStructuralCollapseCorrection.before} to ${reefStructuralCollapseCorrection.after}.\n\n## What the result means`,
);
const ozoneDepletingSubstanceBurdenCorrection = corrections.find(correction => correction.nodeId === 'cfc_saturated_layers');
const ozoneDepletingSubstanceBurdenEvidenceReport = reefStructuralCollapseEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Atmospheric Ozone-Depleting Substance Burden:** ${ozoneDepletingSubstanceBurdenCorrection.defect} ${ozoneDepletingSubstanceBurdenCorrection.correction} It changed from ${ozoneDepletingSubstanceBurdenCorrection.before} to ${ozoneDepletingSubstanceBurdenCorrection.after}.\n\n## What the result means`,
);
const ozoneColumnDepletionCorrection = corrections.find(correction => correction.nodeId === 'stratospheric_chlorine_sinks');
const ozoneColumnDepletionEvidenceReport = ozoneDepletingSubstanceBurdenEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Stratospheric Ozone Column Depletion and Recovery:** ${ozoneColumnDepletionCorrection.defect} ${ozoneColumnDepletionCorrection.correction} It changed from ${ozoneColumnDepletionCorrection.before} to ${ozoneColumnDepletionCorrection.after}.\n\n## What the result means`,
);
const coralReefFragmentationCorrection = corrections.find(correction => correction.nodeId === 'coral_reef_fragmentation');
const coralReefFragmentationEvidenceReport = ozoneColumnDepletionEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Coral Reef Fragmentation:** ${coralReefFragmentationCorrection.defect} ${coralReefFragmentationCorrection.correction} It changed from ${coralReefFragmentationCorrection.before} to ${coralReefFragmentationCorrection.after}.\n\n## What the result means`,
);
const tidalWetlandCarbonReversalCorrection = corrections.find(correction => correction.nodeId === 'tidal_wetland_carbon_reversal');
const tidalWetlandCarbonReversalEvidenceReport = coralReefFragmentationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Tidal Wetland Carbon Reversal:** ${tidalWetlandCarbonReversalCorrection.defect} ${tidalWetlandCarbonReversalCorrection.correction} It changed from ${tidalWetlandCarbonReversalCorrection.before} to ${tidalWetlandCarbonReversalCorrection.after}.\n\n## What the result means`,
);
const riverFlowRegimeCorrection = corrections.find(correction => correction.nodeId === 'river_flow_regime_shift');
const riverFlowRegimeEvidenceReport = tidalWetlandCarbonReversalEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **River Flow Regime Shift:** ${riverFlowRegimeCorrection.defect} ${riverFlowRegimeCorrection.correction} It changed from ${riverFlowRegimeCorrection.before} to ${riverFlowRegimeCorrection.after}.\n\n## What the result means`,
);
const coastalPermafrostErosionCorrection = corrections.find(correction => correction.nodeId === 'coastal_permafrost_erosion');
const coastalPermafrostErosionEvidenceReport = riverFlowRegimeEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Coastal Permafrost Erosion:** ${coastalPermafrostErosionCorrection.defect} ${coastalPermafrostErosionCorrection.correction} It changed from ${coastalPermafrostErosionCorrection.before} to ${coastalPermafrostErosionCorrection.after}.\n\n## What the result means`,
);
const fisheryProteinDependenceCorrection = corrections.find(correction => correction.nodeId === 'fishery_protein_dependence');
const fisheryProteinDependenceEvidenceReport = coastalPermafrostErosionEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Fishery Protein Dependence:** ${fisheryProteinDependenceCorrection.defect} ${fisheryProteinDependenceCorrection.correction} It changed from ${fisheryProteinDependenceCorrection.before} to ${fisheryProteinDependenceCorrection.after}.\n\n## What the result means`,
);
const basinTreatyBreakdownCorrection = corrections.find(correction => correction.nodeId === 'basin_treaty_breakdown');
const basinTreatyBreakdownEvidenceReport = fisheryProteinDependenceEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Basin Treaty Breakdown:** ${basinTreatyBreakdownCorrection.defect} ${basinTreatyBreakdownCorrection.correction} It changed from ${basinTreatyBreakdownCorrection.before} to ${basinTreatyBreakdownCorrection.after}.\n\n## What the result means`,
);
const migrationCorrection = corrections.find(correction => correction.nodeId === 'migration');
const migrationEvidenceReport = basinTreatyBreakdownEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Migration:** ${migrationCorrection.defect} ${migrationCorrection.correction} It changed from ${migrationCorrection.before} to ${migrationCorrection.after}.\n\n## What the result means`,
);
const subseaCableLandingCorrection = corrections.find(correction => correction.nodeId === 'subsea_cable_landing_chokepoint');
const subseaCableLandingEvidenceReport = migrationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Submarine Cable Landing-Site Concentration:** ${subseaCableLandingCorrection.defect} ${subseaCableLandingCorrection.correction} It changed from ${subseaCableLandingCorrection.before} to ${subseaCableLandingCorrection.after}.\n\n## What the result means`,
);
const palmOilClearanceEvidenceReport = subseaCableLandingEvidenceReport.replace(
  '\n\n## What the result means',
  '\n- **Palm Oil-Driven Forest Clearance:** The central C 6.3 is retained, but direct ecological studies, validated 2001–2024 global mapping and recovery evidence replace the mixed-pathway classification. The range narrows from B–D to C–D, confidence rises from C to B and the unsupported human domain is removed. Local 45–52% ecological declines inform severity; they are not treated as global collapse or global reach.\n\n## What the result means',
);
const snowEvidenceReport = palmOilClearanceEvidenceReport.replace(
  '\n\n## What the result means',
  '\n- **Snow Drought:** The former D 7.4 treated roughly 700 million exposed or dependent people as harmed and the physical record as consequence persistence. Direct regional water-service and salmon consequences now support B 4.4 with an A–C range and confidence C.\n- **Shift in Snowmelt Timing:** Catchment count, days of shift and a 70-year record no longer become terminal harm. The result changes from D 7.4 to B 3.6 with an A–C range and confidence C.\n- **Alpine Snowpack Declines:** Basin population and broad physical snow loss remain context. Direct local alpine ecosystem evidence supports B 4.0 with an A–C range and confidence C, while global consequence reach and recovery stay unresolved.\n\n## What the result means',
);
const shellCalcificationCorrection = corrections.find(correction => correction.nodeId === 'shell_calcification_failures');
const shellCalcificationEvidenceReport = snowEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Shell Calcification Failures:** ${shellCalcificationCorrection.defect} ${shellCalcificationCorrection.correction} It changed from ${shellCalcificationCorrection.before} to ${shellCalcificationCorrection.after}.\n\n## What the result means`,
);
const urbanSprawlCorrection = corrections.find(correction => correction.nodeId === 'urban_sprawl_housing');
const urbanSprawlEvidenceReport = shellCalcificationEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Urban Sprawl / Housing:** ${urbanSprawlCorrection.defect} ${urbanSprawlCorrection.correction} It changed from ${urbanSprawlCorrection.before} to ${urbanSprawlCorrection.after}.\n\n## What the result means`,
);
const groundwaterRechargeCorrection = corrections.find(correction => correction.nodeId === 'aquifer_recharge_failure');
const groundwaterRechargeEvidenceReport = urbanSprawlEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Groundwater Recharge Decline:** ${groundwaterRechargeCorrection.defect} ${groundwaterRechargeCorrection.correction} It changed from ${groundwaterRechargeCorrection.before} to ${groundwaterRechargeCorrection.after}.\n\n## What the result means`,
);
const seagrassMeadowDeclineCorrection = corrections.find(correction => correction.nodeId === 'seagrass_meadow_decline');
const seagrassMeadowDeclineEvidenceReport = groundwaterRechargeEvidenceReport.replace(
  '\n\n## What the result means',
  `\n- **Seagrass Meadow Decline:** ${seagrassMeadowDeclineCorrection.defect} ${seagrassMeadowDeclineCorrection.correction} It changed from ${seagrassMeadowDeclineCorrection.before} to ${seagrassMeadowDeclineCorrection.after}.\n\n## What the result means`,
);
const clarifiedAgriculturalDemandEvidenceReport = seagrassMeadowDeclineEvidenceReport.replace(
  'Every central rating now reproduces exactly from its six axes, the fixed people/nature weighting and the A–E thresholds.',
  'Every central rating now reproduces exactly from severity, reach and persistence for every applicable domain, the declared domain weighting and the A–E thresholds.',
);
const stableRows = pass2Nodes.filter(row => row.uncertaintyGrades.span === 0);
const readerExamples = [
  'air_pollution_health_burden',
  'food_insecurity',
  'wildfire_smoke_pm25_exposure',
  'marine_fisheries_collapse',
  'coastal_permafrost_erosion',
  'mountain_pass_avalanches',
  'coral_larval_mortality',
  'pyrocumulonimbus_smoke_injection',
  'forest_fragmentation',
  'bridge_scour_exposure',
  'fishery_protein_dependence',
  'gas_power_dependence',
  'hydropower_reliability_decline',
  'species_range_compression',
  'reservoir_storage_instability',
  'old_growth_forest_logging',
  'ice_sheet_mass_loss',
  'basin_treaty_breakdown',
  'coastal_property_insurance_redlines',
  'urban_water_rationing_zones',
  'tundra_shrubification_speeds',
  'transformer_heat_failure_risk',
  'resource_depletion',
  'extreme_precipitation_intensity',
  'convective_instability_shift',
  'black_carbon_deposition',
  'antarctic_shelf_instability',
  'savannah_tree_cover_decline',
  'ice_algae_pigmentation',
  'cryoconite_hole_expansion',
  'high_altitude_forest_shrinkage',
  'nunatak_habitat_shrinkage',
  'freeze_thaw_rock_fracturing',
  'arctic_pack_ice_drift',
  'fjord_sedimentation_pulses',
  'glacial_siltation_streams',
  'talik_expansion',
  'soil_moisture_collapse',
  'atlantic_ni_o_ni_a',
  'indian_ocean_dipole',
  'north_atlantic_oscillation',
  'cement_concrete',
  'humanitarian_response_funding_shortfall',
  'humanitarian_resource_gaps',
  'humanitarian_access_constraints',
  'staple_food_price_volatility',
  'humanitarian_surge_demand',
  'reef_structural_collapse',
  'cfc_saturated_layers',
  'stratospheric_chlorine_sinks',
  'wastewater_infrastructure_overflow',
  'relocation_governance_capacity',
  'transformer_supply_bottleneck',
  'transmission_buildout_lag',
  'subsea_cables',
  'jet_stream_volatility',
  'rossby_wave_stalling',
  'peaker_plant_lock_in',
  'semiconductor_fabs',
  'amoc',
  'permafrost_thaw',
  'insect_biomass_decline',
  'peatland_degradations',
  'cold_chain_failure_risk',
  'dam_and_diversion_infrastructure',
  'trophic_cascade_collapses',
  'watershed_forest_loss',
  'mangrove_buffer_loss',
  'supply_chain_port_bottlenecks',
  'invasive_species_encroachment',
  'food',
  'managed_retreat_pressure',
  'food_waste',
  'ocean_heat_content',
  'ocean_carbon_uptake_weakening',
  'phytoplankton_decline',
  'riverine_habitat_fragmentation',
  'tundra_methane_outgassing',
  'wildfire_regime_shift',
].map(nodeId => issueRowsById.get(nodeId)).filter(Boolean);
const readerSummary = `# TULIP rating audit — plain-English view\n\n## What we checked\n\nWe recalculated every one of the **354 climate issue ratings twice**. We also checked that all **27 response nodes** stay outside danger scoring. The audited ratings are exported to the shared local registry used by the web, mobile and native iOS builds. Production deployment remains separate.\n\n## What passed\n\n- All **381 catalogue records** passed the arithmetic, coverage, source-link and response-exclusion checks.\n- Each issue rating can be reproduced from the same six questions: severity, reach and persistence for people, plus the same three for nature.\n- The shared local rating distribution is: ${Object.entries(gradeCounts).map(([grade, count]) => `**${grade}: ${count}**`).join(', ')}.\n\n## What still needs stronger evidence\n\nOnly **${gradeStabilityCounts.stable} of 354** issue letters stay the same across their recorded lower and upper evidence bounds. **${gradeStabilityCounts.crossesOneBoundary}** could move by one letter and **${gradeStabilityCounts.crossesMultipleBoundaries}** could move by two or more letters. This does not mean the math is broken. It means many source records do not yet measure the exact human or ecosystem consequence needed by the rubric.\n\nThe ${gradeStabilityCounts.stable} currently stable letters are:\n\n${stableRows.map(row => `- **${row.name}: ${row.grade} ${row.value}**`).join('\n')}\n\n## Examples you can inspect\n\n${readerExamples.map(row => `- **${row.name}: ${row.result.grade.letter} ${row.result.value}** — recorded range ${row.result.uncertainty.lower} to ${row.result.uncertainty.upper}; confidence ${row.result.confidence}.`).join('\n')}\n\n## Mistakes the audit found and fixed\n\n- A six-year monitoring period had been read as six years of harm. We now count only the duration of the consequence or recovery.\n- A zero in one source had been read as proof that nobody was exposed. A zero now needs the correct denominator and scope.\n- Words such as “collapse” and “extinction” in a title had been able to push severity or persistence upward. Titles now provide no scoring evidence.\n- Context-only numbers had been able to enter the generic classifier. They are now excluded.\n- Exact source-based axes had been widened merely because the overall node confidence was lower. Axis evidence and overall confidence are now separate.\n- A Florida Keys coral-recruitment assessment had been treated as global human-and-nature harm. The corrected candidate is **C 4.8**, ecosystem only.\n- A satellite aerosol dataset and family analogies had been treated as global harm from smoke injected into the stratosphere. New NOAA evidence supports broad, multi-year atmospheric effects, while the corrected candidate is **C 5.5**, ecosystem only.\n\n## How to read this result\n\nThe current number is TULIP’s best internally reproducible estimate from the evidence attached to that node. The range shows how far the result can move under the recorded evidence uncertainty. A letter is called stable only when the full range remains inside one A–E band.\n\nThe next research work is already ranked. We should first replace family analogues and old evidence for the nodes whose ranges cross the most letter boundaries, then rerun the same two audits.\n`;
const expandedReaderSummary = readerSummary.replace('\n\n## How to read this result', '\n- Forest-use designations had been treated as human harm and a 35-year assessment period as consequence duration. A reproducible 2025 meta-analysis now shows roughly 10–17% lower alpha or gamma diversity in fragmented forests, while long-running experiments directly document progressive effects over 35 years. Forest Fragmentation remains **C 6.3**, ecosystem only, but its range narrows to C–D and confidence improves to B. Global edge exposure remains separate from demonstrated adverse reach.\n- The property-insurance candidate now uses Treasury’s measured premiums and nonrenewals instead of family analogies. It is **C 5.5**, human only, with confidence C.\n- Cape Town’s 2015–2018 restriction event remains part of the recent-decade burden, while a 2026 status check records that restrictions ended in 2020. Urban Water Rationing remains **C 6.3**, with a narrower C–D range and confidence B.\n- A circumpolar greenness signal had been treated as direct shrub-area evidence and had acquired an unsupported human component. Tundra Shrub Expansion remains **C 6.3**, ecosystem only, with a narrower B–D range and confidence C.\n- Transformer engineering evidence showed a heat-related failure mechanism, but no current heat-attributable outage count. Transformer Heat Failure Risk is corrected to **B 3.3**, human only, with an A–C range and confidence C.\n- Material-flow totals had been described as aquifer and topsoil depletion. Resource Depletion now uses UNEP’s matching economy-wide assessment and is **C 6.3**, with a B–D range and confidence C.\n- A 24-location rainfall panel had been treated as global impact evidence. Extreme Precipitation Intensity now uses IPCC’s observed impact assessment and is **C 6.3**, with a B–D range and confidence C.\n- A storm-environment diagnostic had inherited impacts from the storms it can help support. Convective Instability is corrected to **B 3.3**, with an A–C range and confidence C; hail, wind, lightning and rainfall remain separate outcomes.\n- Broad cryosphere coverage had been treated as broad ecological harm. Black Carbon Deposition now uses IPCC’s measured forcing and is **B 4.0**, ecosystem only, with a B–C range and confidence C.\n- Total Antarctic mass loss had been assigned to shelf instability and worldwide reach. Antarctic Shelf Instability now separates the mechanism, sea-level pathway and local ecological change; it is **C 4.8**, with a B–C range and confidence C.\n\n## How to read this result');
const completeExpandedReaderSummary = expandedReaderSummary.replace('\n\n## How to read this result', '\n- Any loss of woody cover had been treated as savanna damage. Savanna Tree-Cover Decline now counts loss only when it moves the ecosystem below its natural tree-and-grass balance; it is **C 5.5**, ecosystem only, with a B–D range and confidence C.\n\n## How to read this result');
const finalExpandedReaderSummary = completeExpandedReaderSummary.replace('\n\n## How to read this result', '\n- A regional glacier-algae melt mechanism had inherited worldwide human harm. Ice-Algae Pigmentation now uses direct Greenland evidence and is **B 4.0**, ecosystem only, with an A–C range and confidence C.\n- Cryoconite holes had been assumed to be globally expanding damage. Greenland field studies show low local coverage, ambiguous net albedo effects and valuable microbial habitat; Cryoconite-Hole Expansion is **B 3.3**, ecosystem only, with an A–C range and confidence C.\n\n## How to read this result');
const latestExpandedReaderSummary = finalExpandedReaderSummary.replace('\n\n## How to read this result', '\n- Global treeline movement had been read as uniform mountain-forest contraction. Direct global evidence shows a mixed pattern—41.70% of observed treelines moved upslope, 24.48% moved downslope and 33.82% stayed stable—so Mountain Forest Cover and Treeline Contraction is **C 5.5**, ecosystem only, with a B–D range and confidence C.\n\n## How to read this result');
const newestExpandedReaderSummary = latestExpandedReaderSummary.replace('\n\n## How to read this result', '\n- Glacier retreat had been treated as if it automatically removed ice-free nunatak habitat. Direct evidence shows that retreat can expose more terrain and build new ecosystems, while some cold-adapted specialists still decline as conditions warm. Nunatak Habitat Shrinkage is therefore **B 4.0**, ecosystem only, with an A–C range and confidence C.\n\n## How to read this result');
const currentExpandedReaderSummary = newestExpandedReaderSummary.replace('\n\n## How to read this result', '\n- A rock-weathering mechanism had inherited broad harm from related mountain hazards. Direct evidence confirms local cracking and increased rockfall, but the main recent process at the measured slope shifted toward deeper permafrost instability and no global impact count exists. Freeze–Thaw Rock Fracturing is **B 3.6**, with an A–C range and confidence C.\n\n## How to read this result');
const presentExpandedReaderSummary = currentExpandedReaderSummary.replace('\n\n## How to read this result', '\n- Ordinary wind- and current-driven ice motion had been scored as if it were damage. The corrected Arctic Pack-Ice Drift rating covers unusually mobile or changing ice, including documented regional shipping incidents, while keeping traffic growth and wider sea-ice loss separate. It is **B 4.4**, with an A–C range and confidence C.\n\n## How to read this result');
const newestReaderSummary = presentExpandedReaderSummary.replace('\n\n## How to read this result', '\n- Sediment entering fjords had been treated as uniformly harmful. Direct Greenland evidence shows that it can block light near glaciers while the same discharge brings nutrients and increases wider-fjord production. Fjord Sedimentation Pulses is **B 4.0**, ecosystem only, with an A–C range and confidence C.\n\n## How to read this result');
const currentReaderSummary = newestReaderSummary.replace('\n\n## How to read this result', '\n- Glacier-ground rock in streams had been treated as automatic damage. Global evidence shows that turbidity can limit light while the same cold, sediment-rich streams support distinctive specialist life. Glacial Siltation in Streams is **B 4.0**, ecosystem only, with an A–C range and confidence C.\n\n## How to read this result');
const latestReaderSummary = currentReaderSummary.replace('\n\n## How to read this result', '\n- A permanently unfrozen ground layer had inherited the full harm of permafrost thaw and methane. Direct records confirm local expansion, subsidence and hydrologic change, but also show that some layers contract during cold, dry periods. Talik Expansion is **B 4.0**, ecosystem only, with an A–C range and confidence C.\n\n## How to read this result');
const completedReaderSummary = latestReaderSummary.replace('\n\n## How to read this result', '\n- A weak global drying trend and regional drought impacts had been labelled worldwide soil-moisture collapse. Direct evidence shows real plant stress where local thresholds are crossed, but large regional differences and event-scale recovery. Soil Moisture Collapse is **C 4.8**, ecosystem only, with a B–D range and confidence C.\n- Atlantic Niño/Niña had been treated as chronic global harm. Direct event evidence supports regional rainfall redistribution over months, while attributable terminal losses remain unquantified. It is **B 4.0**, with an A–C range and confidence C.\n- Jet Stream Volatility and Persistent Rossby Wave Patterns had inherited downstream heat, drought and flood impacts and the length of their observation records. Current source-specific reviews keep those endpoints separate; both are **B 4.4**, with B–C ranges and confidence C.\n- Peaker Plant Lock-In had mixed a measured power-plant footprint with downstream pollution and health nodes. The direct-footprint review is **B 3.6**, with a B–C range and confidence C; proximity is kept separate from exposure or illness.\n- Semiconductor Fabs had mixed facility water, chemical, waste and process-gas flows with separately scored downstream nodes. Its direct-footprint review is **B 3.6**, with a B–C range and confidence C; the sources do not quantify terminal human or ecosystem loss.\n- AMOC Slowdown had used a single February 2024 value and broad future consequences. The complete twenty-year RAPID record and 2026 multi-latitude evidence support current weakening but do not quantify terminal loss; it is **B 4.0**, with an A–C range and confidence C.\n- Permafrost Thaw had relied on evidence ending in 2016 and counted broad exposure and downstream climate effects as present harm. A 2000–2024 global field synthesis plus observed community and watershed impacts support **C 5.9**, with a B–D range and confidence C.\n- All 28 CO₂ and methane source candidates now explicitly cannot inherit the Carbon Emissions or Methane rating. Their source-specific harm allocation remains unresolved, so they retain numerical candidates at confidence D with the overlap recorded.\n\n## How to read this result');
const climateModeReaderSummary = completedReaderSummary.replace('\n\n## How to read this result', '\n- Indian Ocean Dipole had been rated as if the entire ocean-basin index and its sixty-five-year record were global, chronic harm. Official phase records show regional effects that usually develop and decay within months and can reverse by phase. It is **B 4.0**, with an A–C range and confidence C.\n- North Atlantic Oscillation had similarly converted hemispheric influence and a long index record into terminal harm. A peer-reviewed catastrophe model supplies a direct material-loss pathway, and an open-data reproduction independently finds three damaging/not-damaging links that survive false-discovery control. Their signs reverse across northern winter, northern summer and eastern spring, and no low, medium or high class survives the same check. The rating remains **C 4.8**, with an A–D range and confidence C; absolute attributable loss, affected population and recovery duration remain unresolved.\n\n## How to read this result');
const infrastructureReaderSummary = climateModeReaderSummary.replace('\n\n## How to read this result', '\n- Wastewater Infrastructure Overflow had treated seven reporting years as seven years of harm. Direct EPA events instead show material local exposure, backups, contamination and aquatic impairment, with reported events averaging about 18.8 hours where duration is available. It is **B 4.0**, with a B–C range and confidence C.\n- Relocation Governance Capacity had mixed the governance delay with ecosystem effects and the underlying disaster. Direct GAO evidence supports a material multi-year delay for applicants, making it **C 5.5**, human only, with a stable C range and confidence B.\n\n## How to read this result');
const systemsReaderSummary = infrastructureReaderSummary.replace('\n\n## How to read this result', '\n- Transformer Supply Bottleneck now uses the measured 75% five-year price increase and roughly four-year procurement delay. It is **C 5.5**, human only, with a stable C range and confidence B; the wider grid queue and downstream emissions are excluded.\n- Transmission Buildout Lag now uses the global investment gap and five-to-fifteen-year project timeline without importing curtailment, affordability or emissions scores. It is **C 5.5**, human only, with a C–D range and confidence B.\n- Subsea Cables had treated 99% traffic dependence as severe service loss and invented a nature component. ITU evidence supports recurring repair burden but not typical major outages, so it is **B 3.3**, human only, with a B–C range and confidence C.\n\n## How to read this result');
const domainBoundaryReaderSummary = systemsReaderSummary.replace('\n\n## How to read this result', `\n- The generic review had added nature impacts to human-only nodes, including Heat-Attributable Excess Mortality, without direct evidence. Domain scope is now preserved unless an explicit evidence review changes it. Heat-Attributable Excess Mortality is **${issueRowsById.get('heatwave_excess_mortality_rates').result.grade.letter} ${issueRowsById.get('heatwave_excess_mortality_rates').result.value}**, human only.\n\n## How to read this result`);
const persistenceBoundaryReaderSummary = domainBoundaryReaderSummary.replace('\n\n## How to read this result', '\n- Some fields labelled “persistence years” were actually the length of a historical dataset. Those spans no longer count as years of harm. Biodiversity Intactness Loss and seagrass decline now use bounded qualitative persistence until a source measures recovery or lasting consequences directly.\n\n## How to read this result');
const evidenceTraceReaderSummary = persistenceBoundaryReaderSummary.replace(
  '\n\n## How to read this result',
  `\n- The rejected blind comparison for ${pass2.counts.retainedPilotAxisBasisNotRecorded} retained pilot ratings is no longer counted as evidence for those ratings. These pilots remain numerical candidates, but each now has an explicit per-axis evidence-trace task before publication.\n\n## How to read this result`,
);
const measurementSemanticsReaderSummary = evidenceTraceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Twenty-four generic ecosystem ratings had treated a percentage as exact severity without first proving what its denominator meant. Those percentages are now retained as evidence context and the severity bounds stay open until each metric is classified as condition, reach, trend or pressure.\n\n## How to read this result',
);
const insectEvidenceReaderSummary = measurementSemanticsReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Insect Biomass Decline had inherited a threatened-species percentage, downstream food-system effects and assumed global reach. It now uses direct recent German biomass measurements alongside the broader abundance synthesis, keeps those measurements separate, and is **D 7.0**, ecosystem only, with a B–E range and confidence C.\n\n## How to read this result',
);
const peatlandEvidenceReaderSummary = insectEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Peatland Degradation had used one global affected-area percentage as both reach and evidence of local severity, then produced a 120-year duration by dividing unrelated statistics. The 12% share now informs reach only, and direct restoration evidence shows incomplete recovery after ten years. The rating is **D 7.8**, ecosystem only, with a C–E range and confidence C.\n\n## How to read this result',
);
const coldChainEvidenceReaderSummary = peatlandEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Cold Chain Failure Risk had treated food that could potentially feed one billion people as if one billion people were demonstrably harmed, and it added downstream emissions and nature effects. The directly attributed loss is 526 million tonnes, or 12% of 2017 global food production. The corrected rating is **C 5.5**, human only, with a B–D range and confidence C.\n\n## How to read this result',
);
const damDiversionEvidenceReaderSummary = coldChainEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Dam and Diversion Infrastructure had counted 158 million people supported by inland fisheries as if all were harmed by dams. The corrected review treats that as exposure only. Direct human outcomes and separate global river and fish evidence support **D 6.6**, with a narrower C–D range and confidence C.\n\n## How to read this result',
);
const trophicCascadeEvidenceReaderSummary = damDiversionEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Trophic Cascade Disruption had turned evidence that cascades can occur into a claim that they were globally prevalent and directly harming people. Three ecosystem meta-analyses show large effects at some studied sites, but no global affected-area or harmed-person denominator. The corrected rating is **C 5.5**, ecosystem only, with a B–D range and confidence C.\n\n## How to read this result',
);
const watershedForestLossEvidenceReaderSummary = trophicCascadeEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Watershed Forest Loss had used generic long-term assumptions and downstream graph effects to support a D. Direct evidence now shows material childhood illness and water-quality effects across multiple regions, while sample size and study coverage remain outside reach. The corrected rating is **C 5.5**, with a B–D range and confidence C.\n\n## How to read this result',
);
const mangroveBufferEvidenceReaderSummary = watershedForestLossEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Mangrove Buffer Loss had used cover loss as qualitative severity and unmeasured record length as persistence. Direct global evidence now keeps protection-function decline, gross affected area and 20–40-year ecological recovery in separate nature axes. The 15 million people protected by all current mangroves remain a service counterfactual, not current harmed-person reach. The corrected rating is **C 5.9**, with a C–D range and confidence C.\n\n## How to read this result',
);
const portBottleneckEvidenceReaderSummary = mangroveBufferEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Supply Chain Port Bottlenecks had treated the fact that ports handle about 80% of world trade as ecological reach. A global 1,320-port model instead measures 1.4 expected downtime days per port-year and US$122.1 billion of forward economic activity at risk, without a harmed-person count or ecosystem endpoint. The corrected rating is **B 4.0**, human only, with an A–C range and confidence B.\n\n## How to read this result',
);
const invasiveSpeciesEvidenceReaderSummary = portBottleneckEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Invasive Species Encroachment had a broad C based on family judgments. The approved global assessment directly documents extinction, sometimes irreversible ecosystem change and more than US$423 billion in annual costs. The corrected rating is **D 7.8**, with a C–E range and confidence B. People and ecosystem reach remain uncertain because regions, species and report shares are not harmed-population or affected-area denominators.\n\n## How to read this result',
);
const agriculturalDemandEvidenceReaderSummary = invasiveSpeciesEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Agricultural Demand had used one year of commodity demand and broad downstream claims as if they directly measured harm to people and nature. A global land-use model instead estimates 1.4% potential global species loss from 1995–2022 and attributes more than 90% of recent land-use biodiversity impact to agriculture. The corrected rating is **C 5.5**, ecosystem only, with a B–D range and confidence B. The modelled species-loss figure is used once as a severity proxy; countries, sectors and agricultural land are not reused as ecosystem reach.\n\n## How to read this result',
);
const managedRetreatEvidenceReaderSummary = agriculturalDemandEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Managed-Retreat Decision Pressure had treated cumulative historical acquisitions and permanent open space as current harm to people and nature. The current official case instead shows at least 657 properties in a voluntary acquisition pipeline and a process that usually takes at least two to three years. The corrected rating is **C 5.5**, human only, with a B–D range and confidence B. Properties remain a household-scale proxy; they are not converted into an invented person count.\n\n## How to read this result',
);
const foodWasteEvidenceReaderSummary = managedRetreatEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Food Waste had treated one year of worldwide waste estimates as chronic damage to nature. UNEP directly reports 1.052 billion tonnes of waste and more than US$1 trillion in annual discarded-food value, but tonnes, meals and country coverage do not count people or habitats harmed. The corrected rating is **B 3.6**, for people and nature, with a B–C range and confidence B. The broader land, water and emissions shares remain environmental pressure context and are not added as separate harm.\n\n## How to read this result',
);
const oceanHeatContentEvidenceReaderSummary = foodWasteEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Ocean Heat Content had treated a global physical measurement as if it directly measured worldwide harm. NOAA now anchors the 2025 heat state and measurement uncertainty, while IPCC evidence supplies bounded human and ecosystem consequences. The rating is **C 6.3**, with a B–D range and confidence B. Zettajoules, World Ocean coverage and connected-node scores do not become harm axes.\n\n## How to read this result',
);
const oceanCarbonUptakeEvidenceReaderSummary = oceanHeatContentEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Ocean Carbon Uptake Weakening had described the total observed sink as declining and had converted a global budget into worldwide harm. Global Carbon Budget 2025 instead finds no sustained decline in the observed ocean-borne fraction, while climate change made 2015–2024 uptake 7.1% weaker than in a CO2-only model experiment. The corrected rating is **C 5.5**, ecosystem regulating function only, with a B–D range and confidence B. Downstream warming and human effects stay with their own nodes.\n\n## How to read this result',
);
const phytoplanktonDeclineEvidenceReaderSummary = oceanCarbonUptakeEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Phytoplankton Decline had combined an old production trend, downstream fish-supply claims and the length of the satellite record. A current global study instead measures a 7.4% loss of ocean production and statistically significant declines across 48% of ocean area. The corrected rating is **C 5.5**, ecosystem production function only, with a C–D range and confidence B. The 25-year record is not recovery time, and future models remain mixed.\n\n## How to read this result',
);
const riverFragmentationEvidenceReaderSummary = phytoplanktonDeclineEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- River Network Fragmentation keeps its **D 7.0** central rating, but its old generic reasoning has been replaced. Sixty-three percent of long rivers not being free-flowing now informs reach, direct fish connectivity and biological comparisons inform severity, and observed one-to-eleven-year response after dam removal informs persistence. The range narrows to C–E, evidence is current through 2026, and human service exposure remains excluded.\n\n## How to read this result',
);
const harmfulAlgalBloomsEvidenceReaderSummary = riverFragmentationEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Harmful Algal Blooms had treated monitoring geography, a 7% event-type share and a 34-year record as if they measured reach, ecosystem damage and persistence. Direct illness evidence and a current regional mass-mortality study now anchor the axes separately. The corrected rating is **C 5.5**, with a B–D range and confidence C. Report counts, database length and connected fishery or water-service harms do not enter the number.\n\n## How to read this result',
);
const rapidRunoffResponseEvidenceReaderSummary = harmfulAlgalBloomsEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Rapid Runoff Response had used one 1978 flood and generic global assumptions for reach and persistence. A cause-filtered global event dataset now documents severe human consequences, including 2,652 reported deaths and a median 1.30 million annual event-person displacements during 2014–2018. Satellite exposure is kept out of harmed reach, and a river meta-analysis finds no consistent ecological effect from floods across its limited high-flow evidence. The corrected rating is **C 4.8**, with a B–D range and confidence C.\n\n## How to read this result',
);
const tundraMethaneEvidenceReaderSummary = rapidRunoffResponseEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Tundra Methane Outgassing now uses a reproducible 2010–2021 Arctic-Boreal methane series instead of a placeholder site-flux statement. The series averages 45.4 million tonnes of methane per year across all source categories, including 21.5 million tonnes from wetlands, and the total trend is not statistically significant. Those flows do not say how many people or ecosystems this source alone harms. The rating therefore remains the provisional **D 6.6**, with a B–E range and confidence D, until a non-overlapping tundra history is linked through atmospheric response to terminal outcomes.\n\n## How to read this result',
);
const wildfireRegimeShiftEvidenceReaderSummary = tundraMethaneEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Wildfire Regime Shift had combined broad wildfire occurrence, smoke and downstream health effects with assumed ecosystem damage. Direct global studies now separate **12,566 annual climate-attributed fire-PM2.5 deaths in the 2010s** from total fire mortality, and forest condition and recovery across **3,281 large fires** from event count or burned-area reach. The corrected rating is **D 7.0**, with a C–D range and confidence B. Smoke exposure, hospitalizations and naturally beneficial fire remain outside this number.\n\n## How to read this result',
);
const bridgeScourEvidenceReaderSummary = wildfireRegimeShiftEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Bridge Scour Exposure had treated 19,775 scour-critical bridges and 76.1 million daily vehicle crossings as if they measured current human harm. The inventory directly measures engineering vulnerability, while crossings are repeated movements and selected historical collapse fatalities do not establish a current annual burden. The corrected rating is **B 3.3**, human only, with an A–C range and confidence C.\n\n## How to read this result',
);
const coastalGroundwaterWithdrawalEvidenceReaderSummary = bridgeScourEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Coastal Groundwater Withdrawal had treated five aquifers as five people. The corrected review now documents a current managed consequence: Cape May relies on reverse osmosis for brackish source water, serves about 5,000 permanent residents and roughly 50,000 people in summer, and has a $12.6 million desalination-equipment phase after 27 years of operation. The rating changes to **C 6.3**, human and ecosystem, and the range narrows to **C 4.8–D 7.4** with confidence C. The local population is not extrapolated globally, and the ecosystem half remains unresolved.\n\n## How to read this result',
);
const floodplainExposureEvidenceReaderSummary = coastalGroundwaterWithdrawalEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Population and Asset Exposure in Floodplains now separates **modeled exposure** from **observed harm**. Global studies estimate roughly two billion people in modeled fluvial-flood zones, but they also show that vulnerability and coping capacity change who is actually at risk. The corrected rating is **B 3.3**, human only, with an A–C range and confidence C. Exposure still matters; it does not become two billion people already harmed.\n\n## How to read this result',
);
const desalinationDependenceEvidenceReaderSummary = floodplainExposureEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Desalination Dependence had treated roughly 300 million people receiving desalinated water as if they were already harmed. Direct studies instead show local benthic effects at some outfalls and no detectable fish-assemblage harm at another facility. The corrected rating is **B 4.0**, with an A–C range and confidence C. Water users, plant count, production, brine volume and energy demand do not become harm reach.\n\n## How to read this result',
);
const gasPowerDependenceEvidenceReaderSummary = desalinationDependenceEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Gas Power Dependence had treated the share of world electricity generated from gas as if it measured people and ecosystems already harmed. Ember reports **21.73% in 2025**, while IEA analysis shows that gas-price shocks can materially raise electricity prices. The corrected rating is **B 3.3**, human only, with an A–C range and confidence C. Generation share, the broad 2022 crisis population and downstream carbon harm do not become extra points.\n\n## How to read this result',
);
const hydropowerReliabilityEvidenceReaderSummary = gasPowerDependenceEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Hydropower Reliability Decline had treated total global hydropower generation as if it measured electricity shortages and ecosystem damage. IEA capacity-factor data directly measure the reliability state, while Ecuador’s 2024 drought produced nationwide cuts of up to **14 hours a day** and estimated industrial losses of **USD 12 million per outage hour**. The rating remains **C 4.8**, becomes human only, and carries a B–D range with confidence C.\n\n## How to read this result',
);
const fishLandingSupplyDisruptionEvidenceReaderSummary = hydropowerReliabilityEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Fish Landing Supply Disruption had used global catch tonnage as if it measured current harm. Peru’s 2023–2025 record instead shows industrial anchoveta landings, direct-food landings and fishing output moving differently: fishing GDP fell **21.2% in 2023** and rebounded **27.2% in 2024**, while direct-food landings did not follow the same pattern. The rating remains **C 4.8**, human only, with a narrower B–C range and confidence C. Tonnes and sector percentages do not become people harmed.\n\n## How to read this result',
);
const fisheryProteinDependenceEvidenceReaderSummary = fishLandingSupplyDisruptionEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Fishery Protein Dependence had treated 3.1 billion people receiving at least one-fifth of their animal protein from aquatic foods as if they were already harmed. FAO’s 2026 evidence measures nutritional benefit and reliance, while production and supported livelihoods are system context. The corrected rating is **B 3.3**, human only, with an A–C range and confidence C; a defined supply disruption and measured adverse outcome are still required.\n\n## How to read this result',
);
const basinTreatyBreakdownEvidenceReaderSummary = fisheryProteinDependenceEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Basin Treaty Breakdown had treated the share of shared basin area without an operational arrangement as if it measured treaty failure and current human harm. The official indicator instead measures cooperation coverage, which improved from 23 qualifying countries in 2017 to 43 in 2023. The corrected rating is **B 3.3**, human only, with an A–C range and confidence C. It is a low-impact governance risk-state judgment; actual breakdown and attributable consequences remain unmeasured.\n\n## How to read this result',
);
const migrationEvidenceReaderSummary = basinTreatyBreakdownEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Migration now separates the **13.6 million people** still internally displaced by disasters at the end of 2025 from the **29.9 million new or repeated movements** recorded during that year. The corrected rating is **C 6.3**, human only, with a B–D range and confidence C. It does not add flow and stock, count repeated moves as more people, import conflict displacement, or call every disaster case climate-attributed.\n\n## How to read this result',
);
const subseaCableLandingEvidenceReaderSummary = migrationEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Submarine Cable Landing-Site Concentration now uses actual outage cases instead of treating **99% of intercontinental traffic** or **150–200 cable faults a year** as people harmed. Documented consequences range from several hours of major bandwidth loss to Tonga’s **61-day near-total digital isolation** and large economic loss. The corrected rating is **B 4.0**, human only, with a B–C range and confidence C. A cable fault, repair job or traffic share adds no points by itself.\n\n## How to read this result',
);
const palmOilClearanceEvidenceReaderSummary = subseaCableLandingEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Palm Oil-Driven Forest Clearance keeps **C 6.3**, but now has a narrower **C–D range** and confidence B. Direct studies report 45–52% local ecological declines, while validated mapping links 5.858 million hectares of old-growth clearance to current oil palm, about 0.50% of a broad global primary-forest denominator. Local severity, global reach and recovery time are scored separately, and unmeasured human pathways are excluded.\n\n## How to read this result',
);
const peatOxidationEvidenceReaderSummary = palmOilClearanceEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Peat Oxidation Pulse now uses FAOSTAT’s latest non-imputed World estimate: **24.59 million hectares** of agricultural drained organic soils emitting **830.2 million tonnes of carbon dioxide in 2022**. The physical flow establishes loss of peat carbon-storage function, but it does not count harmed people or ecosystem collapse. The rating remains **C 6.3**, becomes ecosystem only, and narrows to a C–D range with confidence C.\n\n## How to read this result',
);
const speciesRangeContractionEvidenceReaderSummary = peatOxidationEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Species Range Contraction now uses direct occupied-range evidence. In a global 204-species mammal sample, **20% lost more than half their former range** and **32% lost 5–49%**; a separate 976-species synthesis recorded warm-edge local loss in 460 selected species. Those sample shares are not treated as the percentage of global ecosystem area affected, and the map-comparison interval is not treated as recovery time. The corrected rating is **C 5.5**, ecosystem only, with a B–D range and confidence C.\n\n## How to read this result',
);
const oldGrowthForestLoggingEvidenceReaderSummary = speciesRangeContractionEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Old-Growth Forest Logging had used a Tongass regional area share as if it established global reach. FAO’s 2025 assessment confirms continuing primary-forest loss but cannot separate logging from other causes, while a 2024 Sabah study directly shows that ecological change varies sharply with logging intensity. The corrected rating is **C 4.8**, with a B–D range and confidence C. Total primary-forest area, country coverage and sampled-taxon shares do not become global harm reach.\n\n## How to read this result',
);
const iceSheetMassLossEvidenceReaderSummary = oldGrowthForestLoggingEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Ice Sheet Mass Loss now uses the September 2026 IMBIE reconciliation through 2023: **11,309 ± 565 billion tonnes** of combined loss and **31.4 ± 1.6 mm** of sea-level contribution. Those numbers establish the physical state; they do not count people or ecosystems harmed. A paired Greenland fjord study supports material local ecological change, while global consequence reach remains unresolved. The corrected rating is **C 5.1**, with a B–D range and confidence C.\n\n## How to read this result',
);
const blueCarbonHabitatLossEvidenceReaderSummary = iceSheetMassLossEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Blue Carbon Habitat Loss now uses recent global mapping: **6.18% gross mangrove loss** relative to the 2016 baseline, **4% seagrass loss** and another **4.2% dense-to-sparse degradation**. Habitat-specific percentages are not added, and gains, carbon flux and beneficiaries do not become extra harm. The corrected rating is **C 5.9**, with a B–D range and confidence B.\n\n## How to read this result',
);
const coralBleachingEvidenceReaderSummary = blueCarbonHabitatLossEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Coral Bleaching now uses 51 GCRMN subregions as its mapped reef-area denominator. Subregions with modelled declines represent **37.8% of mapped global reef area** and average a **30.7% relative cover decline** when weighted by reef area. A separate global model estimated moderate-or-greater bleaching at 51% of reef locations and mortality at 15% during 2014–2017; those historical values calibrate the method and are not relabelled as current conditions. NOAA’s **84.4%** figure remains heat exposure. The corrected rating is **D 7.0**, ecosystem only, with a C–E range and confidence B.\n\n## How to read this result',
);
const oceanAcidificationEvidenceReaderSummary = coralBleachingEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Ocean Acidification now keeps global chemistry separate from demonstrated harm. Surface-ocean pH declined by **0.065624** from 1985 to 2024; organism-specific analysis estimates marginal-habitat expansion of **12.2 percentage points for coastal bivalves**, **42.8 for tropical and subtropical corals** and **60.8 for polar pteropods**. Those are separate modeled habitat denominators, not one global collapse measure. A bounded hatchery case supports material human harm but no global harmed-person count. The corrected rating is **C 6.3**, with a B–D range and confidence C.\n\n## How to read this result',
);
const northAtlanticOscillationEvidenceReaderSummary = oceanAcidificationEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- North Atlantic Oscillation now includes a direct modeled material-loss pathway. A peer-reviewed European study reports that average flood loss differed by as much as **50%** between opposite NAO states. An independent open-data reproduction finds three damaging/not-damaging associations that survive false-discovery control, with the harmful direction changing by region and season, while no low, medium or high class survives. The rating remains **C 4.8**, with an A–D range and confidence C; absolute attributable loss, affected population and recovery duration remain open.\n\n## How to read this result',
);
const cementConcreteEvidenceReaderSummary = northAtlanticOscillationEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Cement / Concrete now uses a near-global plant model and its checksum-pinned workbook. The model reports about **261,600 direct non-CO2 DALYs per year** from PM2.5, SO2, NOx and NH3 emissions. The separate **1.16 million CO2-related DALYs are excluded** because cement-process, kiln-fuel and climate pathways are scored elsewhere. The corrected rating is **D 7.0**, with a C–E range and confidence C; unique harmed people, a current plant-model update and quarry ecosystem denominators remain open.\n\n## How to read this result',
);
const humanitarianFundingShortfallEvidenceReaderSummary = cementConcreteEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Humanitarian Response Funding Shortfall now uses a direct official consequence record. During 2025, funding cuts closed or suspended **455 health facilities affecting 3.8 million people** in Afghanistan. The separate nutrition and mine-action figures are kept as corroboration and are not added. The corrected rating is **C 6.3**, human only, with a C–D range and confidence B; terminal health outcomes, cross-program deduplication and closure duration remain open.\n\n## How to read this result',
);
const humanitarianResourceGapsEvidenceReaderSummary = humanitarianFundingShortfallEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Humanitarian Response Capacity Gap now measures observed loss of operating capacity instead of treating an unfunded plan as delivered harm. The same 455 facility closures or suspensions affecting 3.8 million people support **C 6.3**, human only, with a C–D range and confidence B. This and the funding-shortfall rating are alternative views of one causal chain and must never be added.\n\n## How to read this result',
);
const humanitarianAccessConstraintsEvidenceReaderSummary = humanitarianResourceGapsEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Humanitarian Access Constraints remains **C 4.8**, human only, but its range narrows from A–D to B–D with confidence B. Myanmar’s official response plan documents more than 1,000 access incidents, 127 of 330 townships at the highest difficulty level, and direct essential-service interruption from staff relocation and suspended activities. Incidents and townships are not converted into people harmed.\n\n## How to read this result',
);
const stapleFoodPriceVolatilityEvidenceReaderSummary = humanitarianAccessConstraintsEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Staple Food Price Volatility remains **C 4.8**, human only, but its range narrows from A–D to B–D with confidence B. SOFI 2025 associates a 10% food-price increase with higher food insecurity and child-wasting prevalence. Country coverage and more than 1.5 billion exposed residents are not converted into people harmed, and the source does not supply a current attributable-person count.\n\n## How to read this result',
);
const humanitarianSurgeDemandEvidenceReaderSummary = stapleFoodPriceVolatilityEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Humanitarian Surge Demand changes from **C 4.8 to B 4.0**, human only, with a B–D range and confidence C. WHO directly records overwhelmed facilities, overburdened staff and affected routine services in eastern DRC. The 843 deaths and 3,082 injuries were caused by the triggering violence, so they are not counted as harm from response overload. Unique overload-attributable patients and duration remain unmeasured.\n\n## How to read this result',
);
const reefStructuralCollapseEvidenceReaderSummary = humanitarianSurgeDemandEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Reef Structural Collapse changes from **D 6.6 to C 4.8**, ecosystem only, with a B–D range and confidence C. A 2026 study directly measured significant loss across three reef-structure metrics and incomplete recovery through 2019. It covered 30 permanent quadrats in one central-Pacific reef system, so the review does not convert that local evidence or global heat exposure into worldwide structural collapse. The former human component was a parsing error and has been removed.\n\n## How to read this result',
);
const ozoneCausalChainEvidenceReaderSummary = reefStructuralCollapseEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Atmospheric Ozone-Depleting Substance Burden changes from **C 6.3 to B 3.3**, ecosystem only, with an A–D range and confidence D. NOAA directly measures a large but declining residual chemical stock: the 2024 ODGI is 71.6 over Antarctica and 45.3 at mid-latitudes. Those index values are not percentages of ecosystem collapse. A source-removal endpoint model is still needed.\n- Stratospheric Ozone Column Depletion and Recovery changes from **C 6.3 to B 4.0**, ecosystem only, with an A–D range and confidence C. WMO records a continuing but below-average 2024 Antarctic deficit and initial recovery. UNEP documents ecological UV-B pathways but no current global collapse-equivalent condition, affected-distribution percentage or ecological recovery distribution. The two ozone-chain ratings are alternative views and must not be added.\n\n## How to read this result',
);
const coralReefFragmentationEvidenceReaderSummary = ozoneCausalChainEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Coral Reef Fragmentation changes from **D 6.6 to B 3.3**, ecosystem only, with an A–D range and confidence C. A 2025 open study directly measured more edges, more patches and lower cohesion at 17 sites in one Papua New Guinea bay. Mean live-coral cover declined by 4.5 percentage points, while rugosity did not change and across-site coral patch metrics were not statistically significant. The review therefore records mild local condition loss and does not infer global reach, recovery duration or direct human harm.\n\n## How to read this result',
);
const tidalWetlandCarbonReversalEvidenceReaderSummary = coralReefFragmentationEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Tidal Wetland Carbon Reversal changes from the prior reviewed **C 6.3 to D 7.0**, ecosystem only, with a B–E range and confidence B. The original structured review also happened to produce D 7.0, but for unsupported human and global-reach reasons. TULIP now processes the six full-resolution mean maps from the 2026 source. On the common mapped wetland extent, 29.0% of the global union area loses at least 5% of modelled soil carbon density and 20.7% loses at least 10%. Testing thresholds from any decline through at least 70% loss yields D 7.0 each time because lower affected reach coincides with greater loss severity. About 64,581 km² appears in only one period, so that classification churn is kept out of the central reach estimate. Formal change uncertainty and disagreement among archived change products keep the B–E range. The score counts ecosystem carbon-storage-function loss once and does not add downstream warming, habitat damage or human effects.\n\n## How to read this result',
);
const riverFlowRegimeEvidenceReaderSummary = tidalWetlandCarbonReversalEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- River Flow Regime Shift changes from **D 6.6 to B 4.0**, ecosystem only, with an A–D range and confidence C. The official inventory finds significantly decreased flow in **402 of 12,572 basins**, about **3.2% by basin count**. The **107.5 million residents** in those basins are exposure context, not a count of people harmed. Global research also shows that physical flow violations do not convert reliably into one biodiversity-loss value. The score therefore records a material multi-regional river-condition risk without importing downstream water, energy, flood or human effects.\n\n## How to read this result',
);
const snowEvidenceReaderSummary = riverFlowRegimeEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Three snow ratings were corrected after direct review. Snow Drought changes from **D 7.4 to B 4.4**, Shift in Snowmelt Timing from **D 7.4 to B 3.6**, and Alpine Snowpack Declines from **D 7.0 to B 4.0**. Their ranges remain A–C with confidence C. The prior ratings treated roughly 700 million exposed or dependent people as harmed and mistook long physical records for consequence duration. New primary studies establish widespread physical change and bounded regional consequences, but still do not supply global harmed-person, ecosystem-condition or recovery denominators.\n\n## How to read this result',
);
const shellCalcificationEvidenceReaderSummary = snowEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Shell Calcification Failures changes from **D 7.0 to C 5.9**, with a B–D range and confidence C. Current global evidence reports modeled marginal habitat separately for bivalves and pteropods, and a recent Pacific-industry study reports operational effects separately from harmed people. The review corrects two parser errors: two affected production seasons are not two people, and regional hatchery supply dependence is not global ecosystem reach.\n\n## How to read this result',
);
const urbanSprawlEvidenceReaderSummary = shellCalcificationEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Urban Sprawl / Housing changes from **C 6.3 to C 5.5**, ecosystem only, with a B–D range and confidence C. The 2025 UN record shows a large growing built-land stock, while the latest 781-city sample shows land consumption slowing from 1.24% to 0.83%. Total built area is not treated as ecosystem reach, and slower consumption is not treated as ecosystem restoration. Prior habitat, affected ecosystem shares and recovery time remain unresolved.\n\n## How to read this result',
);
const groundwaterRechargeEvidenceReaderSummary = urbanSprawlEvidenceReaderSummary.replace(
  '\n\n## How to read this result',
  '\n- Groundwater Recharge Decline changes from **C 5.9 to B 4.4**, with an A–D range and confidence C. The global mean recharge trend was slightly positive, while 40% of river basins declined and 22% had both recharge and storage decline. Another 26% lost storage while recharge increased, so those storage losses cannot be assigned to recharge failure. The 1.7 billion residents in joint-decline basins are exposure context rather than a harmed-person count. Direct service loss, groundwater-dependent ecosystem condition and recovery remain unresolved.\n\n## How to read this result',
);
const clarifiedAgriculturalDemandEvidenceReaderSummary = groundwaterRechargeEvidenceReaderSummary
  .replace(
    'We recalculated every one of the **354 climate issue ratings twice**. We also checked that all **27 response nodes** stay outside danger scoring. The audited ratings are exported to the shared local registry used by the web, mobile and native iOS builds. Production deployment remains separate.',
    `We recalculated every one of the **354 climate issue ratings twice**. We also checked that all **27 response nodes** stay outside danger scoring. The audited ratings are exported to the shared local registry used by the web, mobile and native iOS builds. Production deployment remains separate.\n\nOf the 354 issue nodes, **${catalogue.catalogueReview.counts.detailedEvidenceReviews} now have source-specific detailed reviews** and **${catalogue.catalogueReview.counts.blindStructuredReclassifications} still use structured internal classifications**.`,
  )
  .replace(
    'Each issue rating can be reproduced from the same six questions: severity, reach and persistence for people, plus the same three for nature.',
    'Each issue rating can be reproduced from severity, reach and persistence for every applicable people or nature domain. An excluded domain is recorded explicitly and does not dilute the active domain.',
  );

await Promise.all([
  writeFile(resolve(outDir, 'internal-catalogue-audit-pass-1.json'), JSON.stringify(pass1, null, 2) + '\n'),
  writeFile(resolve(outDir, 'internal-catalogue-audit-pass-2.json'), JSON.stringify(pass2, null, 2) + '\n'),
  writeFile(resolve(outDir, 'internal-catalogue-audit-findings.csv'), csvRows.map(row => row.map(csvCell).join(',')).join('\n') + '\n'),
  writeFile(resolve(outDir, 'internal-catalogue-double-audit-report.md'), clarifiedAgriculturalDemandEvidenceReport.replace('Audited through 23 September 2026.', 'Audited through 27 September 2026.')),
  writeFile(resolve(outDir, 'internal-catalogue-audit-reader-summary.md'), clarifiedAgriculturalDemandEvidenceReaderSummary),
]);

console.log(JSON.stringify({
  pass1: { status: pass1.status, counts: pass1.counts },
  pass2: { status: pass2.status, counts: pass2.counts },
  corrections,
  candidateDigest: digest(catalogue.issues.map(row => ({ nodeId: row.nodeId, candidate: row.candidate, result: row.result }))),
}, null, 2));
if (pass1.status !== 'passed' || pass2Critical.length) process.exitCode = 1;
