// Synthetic consequence quantities test the calculator, not ecological
// calibration. The WHO adapter at the end retains a real endpoint-only input.
import { readFileSync } from 'node:fs';
import { BENCHMARK_SCORE_EXPERIMENT_VERSION, fixedBenchmarkPolicyKey } from '../../src/tulip-benchmark-score-experiment.js';
import { REGISTERED_DALY_OBSERVATIONS } from '../../src/tulip-source-observation-registry.js';

export function benchmarkCalibrationFixtures() {
  const health = JSON.parse(readFileSync(new URL('../../docs/tulip-calibration/human-health-anchor-candidate.json', import.meta.url)));
  const policy = {
    methodVersion: BENCHMARK_SCORE_EXPERIMENT_VERSION,
    version: 'tulip_benchmark_mechanics_fixture_2026_09_27_v2',
    construct: 'aggregate_current_attributable_consequence',
    combination: 'fixed_people_nature_50_50_without_scope_reweighting',
    weights: { human: 0.5, ecosystem: 0.5 },
    calibrations: {
      human_health_candidate: { ...health, logOffset: 1,
        interpolation: 'piecewise_log1p_canonical_unit', inputUnits: { DALY: 1, thousand_DALYs: 1000 } },
      synthetic_nature_only: {
        version: 'synthetic_nature_anchors_mechanics_only_v1', domain: 'ecosystem',
        outcomeKind: 'synthetic_fixed_distribution_condition_loss', unit: 'fraction',
        reportingPeriodBasis: 'current_condition_stock', basis: 'fixed_reference_fraction',
        referenceId: 'synthetic_fixed_ecosystem_universe', referenceVersion: 'synthetic_reference_v1',
        interpolation: 'piecewise_log1p_canonical_unit', logOffset: 0.000001,
        inputUnits: { fraction: 1, percent: 0.01 },
        policyExplanation: 'Invented fractions for testing arithmetic only; no real nature scale is calibrated.',
        points: [[1, 0], [3, 0.0001], [5, 0.001], [7, 0.01], [9, 0.1], [10, 1]]
          .map(([score, burden]) => ({ score, burden })),
      },
    },
  };
  const nodeIds = ['synthetic_benchmark_case', 'synthetic_future_case'];
  const base = {
    nodeIds, sourceId: 'synthetic_benchmark_fixture', sourceVersion: 'test_only_v1',
    sourceUrl: 'https://example.org/tulip-calibration-fixture',
    locator: 'Synthetic test inputs; no source measurement claimed',
    artifactSha256: '0'.repeat(64), overlapReviewId: 'synthetic_nonoverlap_fixture',
    assessmentPeriod: '2021', geography: 'synthetic_scope', counterfactualId: 'synthetic_without_node',
    boundsMeaning: 'invented_test_bounds_not_probability',
    consequenceBasis: 'current_attributable_consequence',
  };
  const observations = {};
  const add = (id, domain, quantity, extra = {}) => {
    const calibration = policy.calibrations[domain === 'human' ? 'human_health_candidate' : 'synthetic_nature_only'];
    observations[id] = { ...base, domain, outcomeKind: calibration.outcomeKind,
      reportingPeriodBasis: calibration.reportingPeriodBasis, basis: calibration.basis,
      ...(calibration.basis === 'fixed_reference_fraction'
        ? { referenceId: calibration.referenceId, referenceVersion: calibration.referenceVersion } : {}),
      unit: calibration.unit, central: quantity, lower: quantity, upper: quantity,
      ...(quantity === 0 ? { zeroMeaning: 'verified_zero_for_declared_endpoint' } : {}), ...extra };
  };
  for (const point of health.points) add(`human_${point.score}`, 'human', point.burden);
  for (const point of policy.calibrations.synthetic_nature_only.points) add(`ecosystem_${point.score}`, 'ecosystem', point.burden);
  const inverse = (score, calibration) => {
    const highIndex = calibration.points.findIndex(point => point.score >= score);
    if (highIndex === 0) return 0;
    const high = calibration.points[highIndex], low = calibration.points[highIndex - 1];
    const share = (score - low.score) / (high.score - low.score);
    return calibration.logOffset * Math.expm1(Math.log1p(low.burden / calibration.logOffset)
      + share * (Math.log1p(high.burden / calibration.logOffset) - Math.log1p(low.burden / calibration.logOffset)));
  };
  add('human_rounding_case', 'human', inverse(5.01, policy.calibrations.human_health_candidate));
  add('ecosystem_rounding_case', 'ecosystem', inverse(5.08, policy.calibrations.synthetic_nature_only));
  const who = REGISTERED_DALY_OBSERVATIONS.who_world_health_statistics_2026_joint_air_2021;
  observations.who_joint_air_health_endpoint = {
    ...who, nodeIds: ['who_joint_air_health_endpoint_only'], domain: 'human',
    sourceVersion: who.sourceVersion, locator: who.sourceLocator, artifactSha256: who.sourceArtifactSha256,
    basis: 'fixed_absolute_burden', counterfactualId: who.counterfactualId,
    overlapReviewId: 'joint_ambient_household_endpoint_used_once',
    boundsMeaning: 'WHO_reported_95_percent_endpoint_interval',
    consequenceBasis: 'current_attributable_consequence',
  };
  const exclusions = {
    who_joint_air_health_endpoint_only: {
      ecosystem: { scope: 'endpoint_only', reviewEvidenceId: 'health_endpoint_only_scope_definition',
        reason: 'This diagnostic measures a health endpoint only; it does not assess the complete Air Pollution Health Burden node.' },
    },
  };
  const packet = {
    nodeId: nodeIds[0], nodeKind: 'issue', policyVersion: policy.version,
    assessmentKind: 'fixed_people_nature_composite',
    policyDefinitionKey: fixedBenchmarkPolicyKey(policy),
    assessmentPeriod: '2021', geography: base.geography, counterfactualId: base.counterfactualId,
    components: {
      human: { calibrationId: 'human_health_candidate', calibrationVersion: policy.calibrations.human_health_candidate.version,
        observationId: 'human_5', sourceVersion: base.sourceVersion, sourceArtifactSha256: base.artifactSha256 },
      ecosystem: { calibrationId: 'synthetic_nature_only', calibrationVersion: policy.calibrations.synthetic_nature_only.version,
        observationId: 'ecosystem_5', sourceVersion: base.sourceVersion, sourceArtifactSha256: base.artifactSha256 },
    },
  };
  const whoPacket = {
    ...packet, nodeId: 'who_joint_air_health_endpoint_only', geography: who.geography,
    assessmentKind: 'domain_endpoint_only',
    assessmentPeriod: who.assessmentPeriod, counterfactualId: who.counterfactualId,
    components: { human: { calibrationId: 'human_health_candidate', calibrationVersion: policy.calibrations.human_health_candidate.version,
      observationId: 'who_joint_air_health_endpoint', sourceVersion: who.sourceVersion, sourceArtifactSha256: who.sourceArtifactSha256 } },
  };
  return { policy, observations, exclusions, packet, whoPacket };
}
