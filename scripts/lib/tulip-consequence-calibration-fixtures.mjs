import { CONSEQUENCE_CALIBRATION_VERSION, CONSEQUENCE_CALIBRATION_POLICY_KEY } from '../../src/tulip-consequence-calibration-v1.js';
import { fixedBenchmarkPolicyKey } from '../../src/tulip-benchmark-score-experiment.js';

// All records here are invented test controls. IDs and review labels are not
// evidence that a real outcome, causal model or scientific review exists.
export function consequenceCalibrationFixture({health = 1000000, functioning = 100000,
  overlap = 50000, areas = [50000], losses = [0.2], displacementPersonDays = null} = {}) {
  const nodeIds = ['synthetic_calibration_case', 'synthetic_future_case'];
  const functionProfile = {
    kind:'source_specific_function_loss_years', version:'synthetic_function_profile_v1',
    outputUnit:'function_loss_year',timebase:'loss_assigned_to_reporting_year',
    functionDefinition:'Invented full-function loss-year endpoint for arithmetic tests only.',
    sourceUrl:'https://example.org/synthetic-function-profile',artifactSha256:'4'.repeat(64),
  };
  const context = {
    nodeIds, geography: 'synthetic_scope', assessmentPeriod: '2021',
    counterfactualId: 'synthetic_without_node', counterfactualVersion: 'synthetic_cf_v1',
    counterfactualArtifactSha256: '1'.repeat(64), sourceVersion: 'synthetic_source_v1',
    sourceUrl: 'https://example.org/synthetic-calibration-fixture', artifactSha256: '0'.repeat(64),
    locator: 'Invented test inputs; not source measurements',
    quantityRole: 'current_attributable_consequence', caseSetId: 'synthetic_joint_central_only',
  };
  const common = { ...context, timebase: 'loss_assigned_to_reporting_year' };
  const observations = {
    health: {...common, id: 'health', kind: 'health_daly', unit: 'DALY', cases: {central: health},
      ...(health === 0 ? {zeroMeaning:'reviewed_zero_for_declared_outcome'} : {})},
    functioning: {...common, id: 'functioning', kind: 'function_loss_years', unit: 'function_loss_year',
      cases: {central: functioning}, functionProfileReviewId: 'synthetic_function_profile_only',
      profileId:'synthetic_function_profile',profileVersion:functionProfile.version,
      profileKey:fixedBenchmarkPolicyKey(functionProfile),
      overlapBoundary: 'synthetic_joint_overlap_control',
      ...(functioning === 0 ? {zeroMeaning:'reviewed_zero_for_declared_outcome'} : {})},
    overlap: {...common, id: 'overlap', kind: 'human_overlap_loss_years', unit: 'TULIP_human_loss_year',
      overlapModelReviewId: 'synthetic_overlap_only', cases: {central: overlap},
      ...(overlap === 0 ? {zeroMeaning:'reviewed_zero_for_declared_outcome'} : {})},
  };
  if (displacementPersonDays !== null) observations.functioning = {...common,
    id: 'functioning', kind: 'displacement_person_days', unit: 'person_day',
    cases: {central: displacementPersonDays}, profileId: 'idmc_disaster_displacement_proxy_0042',
    populationBasis: 'unique_person_time_no_repeat_spell_overlap', personTimeReviewId: 'synthetic_unique_person_time_only',
    ...(displacementPersonDays === 0 ? {zeroMeaning:'reviewed_zero_for_declared_outcome'} : {})};
  const classIds = ['physical','chemical','composition','structure','function','connectivity'];
  const profile = {
    version: 'synthetic_ecological_profile_v1', outcomeCoverageReviewId: 'synthetic_coverage_only',
    overlapReviewId: 'synthetic_nonduplicate_features_only',
    sourceUrl: 'https://example.org/synthetic-calibration-profile', artifactSha256: '2'.repeat(64),
    classes: Object.fromEntries(classIds.map(id => [id, [{id, weight:1, overlapGroup:id,
      role:'terminal_ecological_condition', unit:'fraction', inputUnits:{fraction:1,percent:0.01},
      intact:1, degraded:0}]])),
  };
  const partition = { version:'synthetic_spatial_partition_v1', nonOverlapReviewId:'synthetic_disjoint_slices_only',
    geometryArtifactSha256:'3'.repeat(64), allocations:{} };
  areas.forEach((areaKm2, i) => {
    partition.allocations[`allocation_${i}`] = {footprintId:`footprint_${i}`, areaKm2, share:1};
    const loss = losses[i] ?? losses[0];
    observations[`nature_${i}`] = {...context, id:`nature_${i}`, kind:'ecosystem_condition_cohort',
      timebase:'current_condition_stock', profileId:'synthetic_ecological_profile', profileVersion:profile.version,
      profileKey:fixedBenchmarkPolicyKey(profile), allocationId:`allocation_${i}`,
      cases:{central:Object.fromEntries(classIds.map(id => [id,
        {unit:'fraction',withoutNode:1,withNode:1-loss}]))},
      ...(loss === 0 ? {zeroMeaning:'reviewed_zero_for_declared_outcome'} : {})};
  });
  const counterfactuals = {synthetic_without_node:{version:'synthetic_cf_v1', artifactSha256:'1'.repeat(64),
    definition:'Invented matched without-node scenario, for mechanical tests only.', observationIds:Object.keys(observations)}};
  for (const row of Object.values(observations)) row.counterfactualDefinitionKey=fixedBenchmarkPolicyKey(counterfactuals.synthetic_without_node);
  const registry = {observations,profiles:{synthetic_ecological_profile:profile,synthetic_function_profile:functionProfile},
    partitions:{synthetic_partition:partition},counterfactuals};
  const makePacket = calculator => ({nodeId:nodeIds[0],nodeKind:'issue',
    policyVersion:CONSEQUENCE_CALIBRATION_VERSION,policyKey:CONSEQUENCE_CALIBRATION_POLICY_KEY,
    geography:context.geography,assessmentPeriod:context.assessmentPeriod,counterfactualId:context.counterfactualId,
    human:{health:[calculator.reference('health')],function:[calculator.reference('functioning')],
      overlap:calculator.reference('overlap'),coverageReviewId:'synthetic_human_coverage_only'},
    ecosystem:{cohorts:areas.map((_,i)=>calculator.reference(`nature_${i}`)),
      partitionId:'synthetic_partition',partitionKey:fixedBenchmarkPolicyKey(partition),
      coverageReviewId:'synthetic_nature_coverage_only'}});
  return {registry,makePacket};
}
