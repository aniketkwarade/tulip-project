// Reproduces IUCN's bounded, collapse-relative indicator calculation.
// This is an indicator input, not an ecosystem condition index or TULIP Score.
export const ECOSYSTEM_SEVERITY_VERSION = 'tulip_ecosystem_severity_2026_09_27_v1_experimental';

const finite = value => typeof value === 'number' && Number.isFinite(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const bounded = value => Math.max(0, Math.min(1, value));

export function calculateBoundedRelativeSeverity(input) {
  const reasons = [];
  if (input?.methodVersion !== ECOSYSTEM_SEVERITY_VERSION) reasons.push('method_version_mismatch');
  for (const field of ['indicatorId', 'unit', 'referenceId', 'collapseThresholdId']) {
    if (!text(input?.[field])) reasons.push(`${field}_required`);
  }
  for (const field of ['referenceValue', 'observedValue', 'collapseValue']) {
    if (!finite(input?.[field])) reasons.push(`${field}_finite_required`);
  }
  const direction = input?.harmfulDirection;
  if (!['increase', 'decrease'].includes(direction)) reasons.push('harmful_direction_required');
  if (input?.indicatorBehavior !== 'continuous_state') reasons.push('continuous_state_indicator_required');
  if (finite(input?.referenceValue) && finite(input?.collapseValue)
    && (direction === 'decrease' ? input.referenceValue <= input.collapseValue
      : direction === 'increase' && input.referenceValue >= input.collapseValue)) {
    reasons.push('collapse_threshold_must_follow_harmful_direction');
  }
  if (reasons.length) return { status: 'needs_compatible_indicator', score: null, reasons };
  const maximumDecline = direction === 'decrease'
    ? input.referenceValue - input.collapseValue : input.collapseValue - input.referenceValue;
  const observedDecline = direction === 'decrease'
    ? input.referenceValue - input.observedValue : input.observedValue - input.referenceValue;
  const rawFraction = observedDecline / maximumDecline;
  if (![maximumDecline, observedDecline, rawFraction].every(finite)) {
    return { status: 'needs_compatible_indicator', score: null, reasons: ['derived_decline_not_finite'] };
  }
  return {
    status: 'experimental_indicator_severity', methodVersion: ECOSYSTEM_SEVERITY_VERSION,
    indicatorId: input.indicatorId, referenceId: input.referenceId,
    collapseThresholdId: input.collapseThresholdId,
    maximumDecline, observedDecline, unit: input.unit,
    rawFraction, boundedFraction: bounded(rawFraction),
    boundary: rawFraction < 0 ? 'improved_beyond_reference'
      : rawFraction >= 1 ? 'at_or_beyond_collapse_threshold' : 'within_reference_collapse_range',
    score: null, publicReady: false,
    limitation: 'A declared threshold is not proof of ecosystem collapse. Source review must validate the indicator, reference, collapse threshold and period. This result supplies neither node attribution nor a cross-ecosystem exchange rate.',
    reasons: [],
  };
}

// A historical initial/present pair cannot establish a node's attributable
// loss. This comparison requires matched with-node and no-node cases under one
// reference/collapse scale. It remains experimental even with those records.
export function compareAttributableIndicatorScenarios(input) {
  const reasons = [];
  if (input?.nodeKind !== 'issue') reasons.push('issue_node_required');
  if (input?.comparisonBasis !== 'matched_with_and_without_node') reasons.push('matched_node_scenarios_required');
  for (const field of ['nodeId', 'geography', 'assessmentPeriod', 'causalModelId',
    'causalModelVersion', 'jointScenarioSourceId', 'jointScenarioSourceVersion']) {
    if (!text(input?.[field])) reasons.push(`${field}_required`);
  }
  const withScenario = input?.withNodeScenario;
  const withoutScenario = input?.withoutNodeScenario;
  for (const [key, scenario, kind] of [['withNode', withScenario, 'with_node'],
    ['withoutNode', withoutScenario, 'without_node']]) {
    if (!text(scenario?.id) || scenario?.scenarioKind !== kind) reasons.push(`${key}_scenario_required`);
    for (const field of ['nodeId', 'indicatorId', 'unit', 'referenceId', 'collapseThresholdId',
      'geography', 'assessmentPeriod', 'causalModelId', 'causalModelVersion']) {
      if (!text(scenario?.[field]) || scenario[field] !== input?.[field]) reasons.push(`${key}_${field}_scope_mismatch`);
    }
    if (scenario?.sourceId !== input?.jointScenarioSourceId) reasons.push(`${key}_joint_source_mismatch`);
    if (scenario?.sourceVersion !== input?.jointScenarioSourceVersion) reasons.push(`${key}_joint_source_version_mismatch`);
  }
  if (withScenario?.id === withoutScenario?.id) reasons.push('distinct_scenarios_required');
  if (Object.hasOwn(input ?? {}, 'historicalInitialValue')) reasons.push('historical_value_not_counterfactual');
  const withNode = calculateBoundedRelativeSeverity({ ...input, observedValue: withScenario?.value });
  const withoutNode = calculateBoundedRelativeSeverity({ ...input, observedValue: withoutScenario?.value });
  reasons.push(...withNode.reasons, ...withoutNode.reasons);
  if (reasons.length) return { status: 'needs_attributable_indicator_scenarios', score: null,
    publicReady: false, reasons: [...new Set(reasons)] };
  const difference = withNode.boundedFraction - withoutNode.boundedFraction;
  return {
    status: 'experimental_attributable_indicator_difference',
    methodVersion: ECOSYSTEM_SEVERITY_VERSION, nodeId: input.nodeId,
    indicatorId: input.indicatorId, geography: input.geography,
    assessmentPeriod: input.assessmentPeriod,
    withNodeSeverityFraction: withNode.boundedFraction,
    withoutNodeSeverityFraction: withoutNode.boundedFraction,
    signedDifference: difference,
    attributableDegradationFraction: Math.max(0, difference),
    score: null, publicReady: false, reasons: [],
    limitation: 'Matched scenario labels alone do not validate attribution. The difference is bounded indicator degradation, not a whole ecosystem harm score. Threshold saturation and improvement are retained for review; persistence, extent, other indicators and cross-type aggregation are not supplied.',
  };
}
