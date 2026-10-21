// TULIP's internally authored scoring rubric. Research use only until the
// catalogue calibration has completed its internal checks and later challenge.
export const INTERNAL_CALIBRATION_VERSION = 'tulip_internal_rubric_2026_09_23_v6';

export const INTERNAL_HISTORY_STANDARD = Object.freeze({
  target: Object.freeze({ start: 1976, end: 2025, label: 'fifty_complete_years' }),
  earlyComparison: Object.freeze({ start: 1976, end: 1995 }),
  recentComparison: Object.freeze({ start: 2006, end: 2025 }),
  currentAssessment: Object.freeze({
    evidenceCutoff: '2026-09-22',
    latestEndYear: 2026,
    label: 'latest_reliable_evidence',
  }),
  climateNormal: Object.freeze({ start: 1991, end: 2020, authority: 'WMO' }),
  longTermClimateChangeReference: Object.freeze({ start: 1961, end: 1990, authority: 'WMO' }),
  outlook: Object.freeze({ start: 2027, end: 2036 }),
});

export const INTERNAL_AXIS_WEIGHTS = Object.freeze({
  severity: 1 / 3,
  reach: 1 / 3,
  persistence: 1 / 3,
});

export const INTERNAL_CONFIDENCE = Object.freeze({
  A: 'Direct quantitative evidence matches the node, current period and geography.',
  B: 'Quantitative evidence needs a documented conversion, proxy or geographic aggregation.',
  C: 'Structured internal judgment is supported by relevant evidence but lacks a complete compatible estimate.',
  D: 'A family-calibrated estimate is used because node-specific current evidence is incomplete.',
});

export const INTERNAL_GRADE_BANDS = Object.freeze([
  Object.freeze({ letter: 'A', label: 'Limited Impact', minimum: 0, maximumExclusive: 0.2 }),
  Object.freeze({ letter: 'B', label: 'Moderate Impact', minimum: 0.2, maximumExclusive: 0.4 }),
  Object.freeze({ letter: 'C', label: 'Significant Impact', minimum: 0.4, maximumExclusive: 0.6 }),
  Object.freeze({ letter: 'D', label: 'High Impact', minimum: 0.6, maximumExclusive: 0.8 }),
  Object.freeze({ letter: 'E', label: 'Extreme Impact', minimum: 0.8, maximumExclusive: 1.0000001 }),
]);

const AXES = Object.keys(INTERNAL_AXIS_WEIGHTS);
const CONFIDENCE_ORDER = Object.freeze({ A: 3, B: 2, C: 1, D: 0 });

function validAxes(axes) {
  return axes && Object.keys(axes).length === AXES.length
    && AXES.every(key => Number.isInteger(axes[key]) && axes[key] >= 0 && axes[key] <= 4);
}

function componentValue(axes) {
  return AXES.reduce((total, key) => total + INTERNAL_AXIS_WEIGHTS[key] * axes[key] / 4, 0);
}

function roundToOneDecimal(value) {
  return Math.round((value + 1e-9) * 10) / 10;
}

function gradeForIndex(index) {
  return INTERNAL_GRADE_BANDS.find(band => index >= band.minimum && index < band.maximumExclusive);
}

function validateHistory(history) {
  const reasons = [];
  if (!history) return ['historical_context_missing'];
  if (!['direct_record', 'reconstructed_record', 'published_hindcast'].includes(history.mode)) reasons.push('historical_mode_invalid');
  if (!Number.isInteger(history.recordStartYear) || !Number.isInteger(history.recordEndYear)
    || history.recordStartYear > history.recordEndYear || history.recordEndYear > 2025) reasons.push('historical_period_invalid');
  if (history.completeCalendarPeriods !== true) reasons.push('historical_periods_incomplete');
  if (history.recordStartYear > INTERNAL_HISTORY_STANDARD.target.start && !history.coverageExceptionReason) reasons.push('historical_short_record_unexplained');
  if (history.recordEndYear < INTERNAL_HISTORY_STANDARD.target.end && !history.coverageExceptionReason) reasons.push('historical_lag_unexplained');
  for (const key of ['metric', 'earlyBaseline', 'recentState', 'currentState', 'fullRecordTrend', 'observedImpact', 'attribution', 'limitations']) {
    if (!history[key]) reasons.push(`historical_${key}_missing`);
  }
  if (!Array.isArray(history.evidenceReferences) || !history.evidenceReferences.length
    || history.evidenceReferences.some(ref => typeof ref !== 'string' || !ref.trim())) reasons.push('historical_evidence_missing');
  return reasons;
}

function validateOutlook(outlook, policy) {
  const reasons = [];
  if (!outlook) return ['outlook_missing'];
  if (JSON.stringify(outlook.horizon) !== JSON.stringify(policy?.horizon)) reasons.push('outlook_horizon_mismatch');
  if (outlook.scenario !== policy?.scenario) reasons.push('outlook_scenario_mismatch');
  if (!['improving', 'stable', 'worsening', 'mixed'].includes(outlook.direction)) reasons.push('outlook_direction_invalid');
  if (!['A', 'B', 'C', 'D'].includes(outlook.confidence)) reasons.push('outlook_confidence_invalid');
  if (!outlook.basis || !Array.isArray(outlook.evidenceReferences) || !outlook.evidenceReferences.length
    || outlook.evidenceReferences.some(ref => typeof ref !== 'string' || !ref.trim())) reasons.push('outlook_evidence_missing');
  return reasons;
}

function validateCurrentWindow(window) {
  const reasons = [];
  if (!window) return ['current_window_missing'];
  const { latestEndYear } = INTERNAL_HISTORY_STANDARD.currentAssessment;
  if (!Number.isInteger(window.start) || !Number.isInteger(window.end) || window.start > window.end) {
    return ['current_window_period_invalid'];
  }
  if (window.end > latestEndYear) reasons.push('current_window_after_assessment_cutoff');
  if (window.isLatestAvailable !== true || !window.recencyCheckedOn || !window.recencyRationale) {
    reasons.push('current_window_recency_unverified');
  }
  if (!['complete', 'partial', 'provisional'].includes(window.coverageStatus)) reasons.push('current_window_coverage_invalid');
  if (['partial', 'provisional'].includes(window.coverageStatus) && !window.coverageNote) reasons.push('current_window_coverage_note_missing');
  if (!['annualized_flow', 'end_state_stock', 'period_prevalence', 'event_distribution'].includes(window.summaryMethod)) {
    reasons.push('current_window_summary_method_invalid');
  }
  if (!window.normalization) reasons.push('current_window_normalization_missing');
  return reasons;
}

function validateComponent(component, dimension) {
  const reasons = [];
  if (!component) return [`${dimension}_component_missing`];
  if (!['A', 'B', 'C', 'D'].includes(component.confidence)) reasons.push(`${dimension}_confidence_invalid`);
  if (!Array.isArray(component.evidenceReferences) || !component.evidenceReferences.length
    || component.evidenceReferences.some(ref => typeof ref !== 'string' || !ref.trim())) reasons.push(`${dimension}_evidence_missing`);
  for (const estimate of ['lower', 'central', 'upper']) {
    if (!validAxes(component[estimate])) reasons.push(`${dimension}_${estimate}_axes_invalid`);
  }
  if (!component.attribution || !component.aggregation || !component.overlapReview || !component.systemEffectsNote) reasons.push(`${dimension}_reasoning_missing`);
  if (component.confidence === 'D' && (!component.familyFallback?.familyId
    || !Array.isArray(component.familyFallback.analogueNodeIds) || !component.familyFallback.analogueNodeIds.length
    || !component.familyFallback.rationale)) reasons.push(`${dimension}_family_fallback_missing`);
  if (component.structuralZero) {
    if (!component.structuralZeroReason) reasons.push(`${dimension}_structural_zero_reason_missing`);
    for (const estimate of ['lower', 'central', 'upper']) {
      if (validAxes(component[estimate]) && AXES.some(key => component[estimate][key] !== 0)) reasons.push(`${dimension}_structural_zero_nonzero`);
    }
  }
  if (validAxes(component.lower) && validAxes(component.central) && validAxes(component.upper)) {
    for (const key of AXES) {
      if (component.lower[key] > component.central[key] || component.central[key] > component.upper[key]) {
        reasons.push(`${dimension}_${key}_bounds_invalid`);
      }
    }
  }
  return reasons;
}

function validateCausalAllocation(allocation, candidate) {
  const reasons = [];
  if (!allocation) return reasons;
  if (!['terminal_consequence', 'hazard_or_state', 'aggregate_pressure', 'emission_source'].includes(allocation.role)) {
    reasons.push('causal_allocation_role_invalid');
    return reasons;
  }
  if (!allocation.counterfactual || !allocation.aggregationDenominator || !allocation.limitations) {
    reasons.push('causal_allocation_reasoning_missing');
  }
  if (!Array.isArray(allocation.overlapExclusions) || !allocation.overlapExclusions.length
    || allocation.overlapExclusions.some(value => typeof value !== 'string' || !value.trim())) {
    reasons.push('causal_allocation_overlap_exclusions_missing');
  }
  if (allocation.role !== 'emission_source') return reasons;
  if (!Array.isArray(allocation.aggregateNodeIds) || !allocation.aggregateNodeIds.length
    || allocation.aggregateNodeIds.some(value => typeof value !== 'string' || !value.trim())) {
    reasons.push('emission_source_aggregate_nodes_missing');
  }
  if (!['direct_measured', 'bounded_proxy', 'unresolved'].includes(allocation.attributionStatus)) {
    reasons.push('emission_source_attribution_status_invalid');
  }
  if (allocation.inheritsAggregateScore !== false) reasons.push('emission_source_cannot_inherit_aggregate_score');
  if (allocation.attributionStatus === 'unresolved') {
    const activeConfidences = (candidate?.applicableDomains ?? []).map(dimension => candidate?.components?.[dimension]?.confidence);
    if (activeConfidences.some(confidence => confidence !== 'D')) reasons.push('unresolved_emission_source_requires_confidence_d');
  }
  return reasons;
}

export function evaluateInternalTulipCandidate(node, candidate, policy) {
  const response = node?.node_kind === 'response';
  if (response) return { nodeId: node.id, status: 'not_applicable', label: 'Response', value: null, grade: null, reasons: [] };
  const result = {
    nodeId: node?.id ?? null,
    status: 'not_ready',
    label: 'Internal calibration pending',
    version: INTERNAL_CALIBRATION_VERSION,
    value: null,
    grade: null,
    uncertainty: null,
    components: { human: null, ecosystem: null },
    confidence: null,
    reasons: [],
  };
  if (!node?.id || !candidate) {
    result.reasons.push('candidate_missing');
    return result;
  }
  if (candidate.nodeId !== node.id) result.reasons.push('identity_mismatch');
  if (candidate.policyVersion !== policy?.version) result.reasons.push('policy_version_mismatch');
  if (candidate.calibrationVersion !== INTERNAL_CALIBRATION_VERSION) result.reasons.push('calibration_version_mismatch');
  if (candidate.geography !== policy?.geography) result.reasons.push('geography_mismatch');
  result.reasons.push(...validateCurrentWindow(candidate.currentWindow));
  if (candidate.sourceDigest !== policy?.sourceDigest) result.reasons.push('source_digest_mismatch');
  result.reasons.push(...validateCausalAllocation(candidate.causalAllocation, candidate));
  result.reasons.push(...validateHistory(candidate.history));
  result.reasons.push(...validateOutlook(candidate.outlook, policy));
  const applicableDomains = candidate.applicableDomains;
  if (!Array.isArray(applicableDomains) || !applicableDomains.length
    || new Set(applicableDomains).size !== applicableDomains.length
    || applicableDomains.some(dimension => !['human', 'ecosystem'].includes(dimension))) {
    result.reasons.push('domain_applicability_invalid');
  }
  for (const dimension of ['human', 'ecosystem']) {
    const component = candidate.components?.[dimension];
    result.reasons.push(...validateComponent(component, dimension));
    if (!component || !validAxes(component.lower) || !validAxes(component.central) || !validAxes(component.upper)) continue;
    result.components[dimension] = {
      lower: componentValue(component.lower),
      central: componentValue(component.central),
      upper: componentValue(component.upper),
      axes: component.central,
      confidence: component.confidence,
      structuralZero: component.structuralZero === true,
    };
    if (Array.isArray(applicableDomains) && !applicableDomains.includes(dimension) && !component.structuralZero) {
      result.reasons.push(`${dimension}_not_applicable_requires_structural_zero`);
    }
  }
  if (result.reasons.length) return result;
  const active = applicableDomains.map(dimension => result.components[dimension]);
  const combine = key => 1 + 9 * active.reduce((sum, component) => sum + component[key], 0) / active.length;
  result.domainWeights = Object.fromEntries(['human', 'ecosystem'].map(dimension => [dimension,
    applicableDomains.includes(dimension) ? 1 / applicableDomains.length : 0]));
  result.currentWindow = candidate.currentWindow;
  result.outlook = candidate.outlook;
  result.causalAllocation = candidate.causalAllocation ?? null;
  const centralIndex = active.reduce((sum, component) => sum + component.central, 0) / active.length;
  const grade = gradeForIndex(centralIndex);
  result.value = roundToOneDecimal(combine('central'));
  result.grade = { letter: grade.letter, label: grade.label };
  result.uncertainty = {
    lower: roundToOneDecimal(combine('lower')),
    upper: roundToOneDecimal(combine('upper')),
    kind: 'structured_axis_bounds_not_probability',
  };
  result.confidence = [candidate.components.human.confidence, candidate.components.ecosystem.confidence]
    .sort((a, b) => CONFIDENCE_ORDER[a] - CONFIDENCE_ORDER[b])[0];
  result.status = 'internal_candidate';
  result.label = 'Internal TULIP candidate';
  return result;
}
