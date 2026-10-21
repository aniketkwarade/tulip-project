import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ECOSYSTEM_SEVERITY_VERSION, calculateBoundedRelativeSeverity,
  compareAttributableIndicatorScenarios } from '../src/tulip-ecosystem-severity-experiment.js';

const benchmark = JSON.parse(readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/iucn-rle-relative-severity-benchmarks.json', import.meta.url)));
const near = (a, b) => assert(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
const base = {
  methodVersion: ECOSYSTEM_SEVERITY_VERSION,
  indicatorId: 'worked_juvenile_finfish_standing_stock',
  referenceId: 'iucn_example_initial', collapseThresholdId: 'iucn_example_zero_stock',
  indicatorBehavior: 'continuous_state', unit: benchmark.cases[0].unit,
};
for (const row of benchmark.cases) {
  const result = calculateBoundedRelativeSeverity({ ...base, ...row });
  assert.equal(result.status, 'experimental_indicator_severity');
  near(result.boundedFraction, row.calculatedRelativeSeverityFraction);
  assert.equal(Math.round(result.boundedFraction * 1000) / 10, row.calculatedSeverityRoundedPercent);
  assert.equal(result.score, null);
  assert.equal(result.publicReady, false);
}
assert.equal(benchmark.cases.filter(row => !row.matchesReportedAtOneDecimal).length, 1);
assert.equal(benchmark.cases[1].site, 'B');
assert.equal(benchmark.cases[1].reportedRelativeSeverityPercent, 51.9);
assert.equal(benchmark.cases[1].calculatedSeverityRoundedPercent, 52.0);
// A change of unit that rescales all three values or adds an offset must not
// change dimensionless severity. Test also an equivalent reversed orientation.
const simple = { ...base, referenceValue: 100, observedValue: 50, collapseValue: 20, harmfulDirection: 'decrease' };
const normal = calculateBoundedRelativeSeverity(simple);
near(normal.boundedFraction, 0.625);
near(calculateBoundedRelativeSeverity({ ...simple, unit: 'synthetic_scaled_unit',
  referenceValue: 100000, observedValue: 50000, collapseValue: 20000 }).boundedFraction, normal.boundedFraction);
near(calculateBoundedRelativeSeverity({ ...simple, unit: 'synthetic_offset_unit',
  referenceValue: 212, observedValue: 122, collapseValue: 68 }).boundedFraction, normal.boundedFraction);
near(calculateBoundedRelativeSeverity({ ...simple, harmfulDirection: 'increase',
  referenceValue: -100, observedValue: -50, collapseValue: -20 }).boundedFraction, normal.boundedFraction);
assert.equal(calculateBoundedRelativeSeverity({ ...simple, observedValue: 110 }).boundedFraction, 0);
assert.equal(calculateBoundedRelativeSeverity({ ...simple, observedValue: 10 }).boundedFraction, 1);
assert.equal(calculateBoundedRelativeSeverity({ ...simple, observedValue: 10 }).boundary, 'at_or_beyond_collapse_threshold');
const reject = (change, reason) => {
  const result = calculateBoundedRelativeSeverity({ ...simple, ...change });
  assert.equal(result.status, 'needs_compatible_indicator');
  assert(result.reasons.includes(reason), result.reasons.join(', '));
};
reject({ collapseValue: 100 }, 'collapse_threshold_must_follow_harmful_direction');
reject({ collapseValue: 120 }, 'collapse_threshold_must_follow_harmful_direction');
reject({ harmfulDirection: 'increase' }, 'collapse_threshold_must_follow_harmful_direction');
reject({ observedValue: NaN }, 'observedValue_finite_required');
reject({ indicatorBehavior: 'fluctuating_time_series' }, 'continuous_state_indicator_required');
reject({ indicatorBehavior: 'categorical_state' }, 'continuous_state_indicator_required');
reject({ referenceValue: Number.MAX_VALUE, collapseValue: -Number.MAX_VALUE }, 'derived_decline_not_finite');

const scenarios = { ...simple, comparisonBasis: 'matched_with_and_without_node',
  nodeId: 'synthetic_pressure', nodeKind: 'issue', geography: 'synthetic_same_ecosystem', assessmentPeriod: '2025',
  causalModelId: 'synthetic_model_not_evidence', jointScenarioSourceId: 'synthetic_joint_run',
  causalModelVersion: 'synthetic_v1', jointScenarioSourceVersion: 'synthetic_source_v1',
};
const scenarioScope = Object.fromEntries(['nodeId', 'indicatorId', 'unit', 'referenceId', 'collapseThresholdId',
  'geography', 'assessmentPeriod', 'causalModelId', 'causalModelVersion'].map(field => [field, scenarios[field]]));
scenarios.withNodeScenario = { ...scenarioScope, id: 'with_node', scenarioKind: 'with_node',
  sourceId: scenarios.jointScenarioSourceId, sourceVersion: scenarios.jointScenarioSourceVersion, value: 50 };
scenarios.withoutNodeScenario = { ...scenarioScope, id: 'without_node', scenarioKind: 'without_node',
  sourceId: scenarios.jointScenarioSourceId, sourceVersion: scenarios.jointScenarioSourceVersion, value: 80 };
const attributable = compareAttributableIndicatorScenarios(scenarios);
assert.equal(attributable.status, 'experimental_attributable_indicator_difference');
near(attributable.attributableDegradationFraction, 0.375);
assert.equal(attributable.score, null);
assert.equal(attributable.publicReady, false);
assert(compareAttributableIndicatorScenarios({ ...scenarios,
  withNodeScenario: { ...scenarios.withNodeScenario, value: 40 } }).attributableDegradationFraction
  > attributable.attributableDegradationFraction);
near(compareAttributableIndicatorScenarios({ ...scenarios,
  withNodeScenario: { ...scenarios.withNodeScenario, value: 90 } }).attributableDegradationFraction, 0);
near(compareAttributableIndicatorScenarios({ ...scenarios,
  withNodeScenario: { ...scenarios.withNodeScenario, value: 90 } }).signedDifference, -0.125);
assert(compareAttributableIndicatorScenarios({ ...scenarios, comparisonBasis: 'historical_initial_vs_present' })
  .reasons.includes('matched_node_scenarios_required'));
assert(compareAttributableIndicatorScenarios({ ...scenarios, historicalInitialValue: 100 })
  .reasons.includes('historical_value_not_counterfactual'));
assert(compareAttributableIndicatorScenarios({ ...scenarios,
  withoutNodeScenario: { ...scenarios.withoutNodeScenario, id: 'with_node' } })
  .reasons.includes('distinct_scenarios_required'));
for (const field of Object.keys(scenarioScope)) {
  assert(compareAttributableIndicatorScenarios({ ...scenarios,
    withoutNodeScenario: { ...scenarios.withoutNodeScenario, [field]: 'mismatched_scope' } })
    .reasons.includes(`withoutNode_${field}_scope_mismatch`));
}
assert(compareAttributableIndicatorScenarios({ ...scenarios, nodeKind: 'response' }).reasons.includes('issue_node_required'));
assert(compareAttributableIndicatorScenarios({ ...scenarios,
  withoutNodeScenario: { ...scenarios.withoutNodeScenario, sourceId: 'unmatched_model_run' } })
  .reasons.includes('withoutNode_joint_source_mismatch'));
assert(compareAttributableIndicatorScenarios({ ...scenarios,
  withoutNodeScenario: { ...scenarios.withoutNodeScenario, sourceVersion: 'changed_source' } })
  .reasons.includes('withoutNode_joint_source_version_mismatch'));
assert(compareAttributableIndicatorScenarios({ ...scenarios, nodeId: 'unmatched_future_node' })
  .reasons.includes('withNode_nodeId_scope_mismatch'));
const futureCase = compareAttributableIndicatorScenarios({ ...scenarios, nodeId: 'synthetic_future_node',
  withNodeScenario: { ...scenarios.withNodeScenario, nodeId: 'synthetic_future_node' },
  withoutNodeScenario: { ...scenarios.withoutNodeScenario, nodeId: 'synthetic_future_node' } });
near(futureCase.attributableDegradationFraction, attributable.attributableDegradationFraction);
assert.deepEqual(compareAttributableIndicatorScenarios(scenarios), attributable);
console.log(JSON.stringify({ status: 'passed', sourceInputCalculationsVerified: benchmark.cases.length,
  printedArithmeticDiscrepanciesPreserved: 1,
  unitAndOrientationInvariant: true, historicalAttributionShortcutRejected: true,
  newNodeInvariant: true, scoreAssigned: false }, null, 2));
