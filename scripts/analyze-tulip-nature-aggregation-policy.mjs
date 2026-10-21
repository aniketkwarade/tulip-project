import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { NATURE_REFERENCE_VERSION, NATURE_TYPE_REFERENCES } from '../src/tulip-nature-burden-experiment.js';
import { ECOSYSTEM_SEVERITY_VERSION } from '../src/tulip-ecosystem-severity-experiment.js';
import { NATURE_AGGREGATION_VERSION, EXPERIMENTAL_NATURE_POLICIES,
  evaluateFrozenNaturePolicyChallenge } from '../src/tulip-nature-aggregation-experiment.js';

const types = Object.keys(EXPERIMENTAL_NATURE_POLICIES.equal_two_family_emphasis.weights);
function packet(caseId, typeId, affectedShare, severityFraction, policyId) {
  const nodeId = `synthetic_${caseId}`;
  const scenarioComparison = {
    methodVersion: ECOSYSTEM_SEVERITY_VERSION, nodeId, nodeKind: 'issue',
    indicatorId: `synthetic_function_indicator_${typeId}`, indicatorBehavior: 'continuous_state',
    unit: 'synthetic_indicator_unit', harmfulDirection: 'decrease',
    referenceId: 'synthetic_functioning_reference', referenceValue: 100,
    collapseThresholdId: 'synthetic_biological_failure_threshold', collapseValue: 0,
    comparisonBasis: 'matched_with_and_without_node', geography: 'synthetic_fixed_type_distribution',
    assessmentPeriod: '2025', causalModelId: 'synthetic_attribution', causalModelVersion: 'v1',
    jointScenarioSourceId: 'synthetic_joint_run', jointScenarioSourceVersion: 'v1',
  };
  const scope = Object.fromEntries(['nodeId', 'indicatorId', 'unit', 'referenceId', 'collapseThresholdId',
    'geography', 'assessmentPeriod', 'causalModelId', 'causalModelVersion'].map(field => [field, scenarioComparison[field]]));
  scenarioComparison.withNodeScenario = { ...scope, id: 'with', scenarioKind: 'with_node',
    sourceId: 'synthetic_joint_run', sourceVersion: 'v1', value: 100 * (1 - severityFraction) };
  scenarioComparison.withoutNodeScenario = { ...scope, id: 'without', scenarioKind: 'without_node',
    sourceId: 'synthetic_joint_run', sourceVersion: 'v1', value: 100 };
  return {
    methodVersion: NATURE_AGGREGATION_VERSION, referenceVersion: NATURE_REFERENCE_VERSION,
    policyId, policyVersion: EXPERIMENTAL_NATURE_POLICIES[policyId].version,
    nodeId, nodeKind: 'issue', assessmentPeriod: '2025', coverage: 'synthetic_two_family_policy_challenge',
    summaryTimebase: 'current_condition_stock',
    familyCoverage: Object.fromEntries(types.map(id => [id, {
      status: id === typeId ? 'assessed_fixed_distribution' : 'reviewed_unaffected_distribution',
      reviewEvidenceId: 'synthetic_complete_distribution_review_not_real_evidence',
      indicatorId: `synthetic_function_indicator_${id}`,
    }])),
    cohorts: [{ canonicalTypeId: typeId, spatialUnitId: 'synthetic_disjoint_area',
      disjointCohortReviewId: 'synthetic_overlap_review_not_real_evidence', areaUnit: 'km2',
      lossAggregationBasis: 'spatial_cohort_positive_loss',
      affectedArea: NATURE_TYPE_REFERENCES[typeId].mappedExtentKm2 * affectedShare,
      scenarioComparison }],
  };
}

// Judgments are stated in attributable, same-type current-condition terms
// before either policy's numerical index is calculated. No score is targeted.
const cases = [
  { id: 'small_severe_reef', type: 'mapped_coral_reef', extent: 0.01, severity: 0.9 },
  { id: 'widespread_mild_reef', type: 'mapped_coral_reef', extent: 0.30, severity: 0.10 },
  { id: 'equal_total_reef_loss', type: 'mapped_coral_reef', extent: 0.10, severity: 0.30 },
  { id: 'reef_ten_percent', type: 'mapped_coral_reef', extent: 1, severity: 0.10 },
  { id: 'mangrove_fifteen_percent', type: 'mapped_mangrove', extent: 1, severity: 0.15 },
];
const predeclaredJudgments = [
  { greater: 'widespread_mild_reef', lesser: 'small_severe_reef', basis: 'Same ecological type and current timebase: 3% versus 0.9% of its fixed condition distribution lost; no unique-patch premium declared.' },
  { equal: ['widespread_mild_reef', 'equal_total_reef_loss'], basis: 'Same type, same total attributable condition loss on the assumed linear indicator scale; local intensity is retained separately.' },
  { unresolved: ['reef_ten_percent', 'mangrove_fifteen_percent'], basis: 'Different ecosystem types: neither a 10% versus 15% type-relative comparison nor raw area supplies an accepted exchange rate.' },
];
const results = cases.map(item => ({ ...item, results: Object.fromEntries(Object.keys(EXPERIMENTAL_NATURE_POLICIES).map(policyId => {
  const result = evaluateFrozenNaturePolicyChallenge(packet(item.id, item.type, item.extent, item.severity, policyId));
  assert.equal(result.status, 'experimental_frozen_policy_index');
  assert.equal(result.publicReady, false);
  assert.equal(result.score, null);
  return [policyId, { index: result.index, byFamily: result.byFamily }];
})) }));
const byId = Object.fromEntries(results.map(item => [item.id, item]));
for (const policyId of Object.keys(EXPERIMENTAL_NATURE_POLICIES)) {
  assert(byId.widespread_mild_reef.results[policyId].index > byId.small_severe_reef.results[policyId].index);
  assert(Math.abs(byId.widespread_mild_reef.results[policyId].index - byId.equal_total_reef_loss.results[policyId].index) < 1e-12);
}
const equalPolicy = 'equal_two_family_emphasis';
const areaPolicy = 'area_two_family_emphasis';
assert(byId.reef_ten_percent.results[equalPolicy].index < byId.mangrove_fifteen_percent.results[equalPolicy].index);
assert(byId.reef_ten_percent.results[areaPolicy].index > byId.mangrove_fifteen_percent.results[areaPolicy].index);
const challenge = packet('partition_test', 'mapped_coral_reef', 0.10, 0.30, equalPolicy);
const original = evaluateFrozenNaturePolicyChallenge(challenge);
const split = structuredClone(challenge);
split.cohorts = ['new_subtype_a', 'new_subtype_b'].map(subtypeId => ({ ...structuredClone(challenge.cohorts[0]),
  subtypeId, spatialUnitId: subtypeId, affectedArea: challenge.cohorts[0].affectedArea / 2 }));
assert.equal(evaluateFrozenNaturePolicyChallenge(split).index, original.index);
const incompatible = structuredClone(challenge);
delete incompatible.familyCoverage.mapped_mangrove;
assert.equal(evaluateFrozenNaturePolicyChallenge(incompatible).index, null);

const report = {
  version: 'tulip_nature_aggregation_policy_analysis_2026_09_27_v1',
  status: 'synthetic_policy_tradeoff_test_not_nature_calibration',
  sourceExtentReferences: NATURE_TYPE_REFERENCES,
  policies: EXPERIMENTAL_NATURE_POLICIES, predeclaredJudgments, cases: results,
  findings: {
    sameTypeAggregateOrderingPreserved: true,
    equalSameTypeBurdenPreserved: true,
    harmlessSubtypePartitionPreserved: true,
    missingFamilyNotReweighted: true,
    crossTypeRankingReversal: true,
    unresolvedExchangeRate: 'The two fixed policies reverse the cross-type pair. Both are catalogue-stable, but neither has passed cross-type meaning calibration. Their stability is not evidence of ecological equivalence.',
  },
  selectedPolicy: null, score: null, publicReady: false,
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/nature-aggregation-policy-analysis.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, findings: report.findings, selectedPolicy: null }, null, 2));
