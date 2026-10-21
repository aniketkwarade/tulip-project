// Experimental current-harm method. Versioned separately from the published v6
// assessments so a method trial cannot silently change scores in the app.
export const CONSEQUENCE_METHOD_VERSION = 'tulip_consequence_2026_09_27_v1';

export const CONSEQUENCE_AXIS_WEIGHTS = Object.freeze({
  severity: 0.5,
  reach: 0.25,
  persistence: 0.25,
});

const AXES = Object.keys(CONSEQUENCE_AXIS_WEIGHTS);
const DOMAINS = ['human', 'ecosystem'];
const ROUND_EPSILON = 1e-9;

const roundScore = value => Math.round((value + ROUND_EPSILON) * 10) / 10;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

// These knots are TULIP policy choices from the frozen 3/5/7/9 reference cases.
// Interpolation removes jumps inside broad reach and recovery bins. A number of
// people exposed to a condition is never an input to the affected-people curve.
const HUMAN_REACH_KNOTS = Object.freeze([[0, 0], [5000, 1], [100000, 2], [10000000, 3], [100000000, 4]]);
const ECO_REACH_KNOTS = Object.freeze([[0, 0], [0.5, 1], [5, 2], [20, 3], [50, 4]]);
const ECO_SEVERITY_KNOTS = Object.freeze([[0, 0], [5, 1], [20, 2], [50, 3], [80, 4]]);
const HUMAN_DURATION_KNOTS = Object.freeze([[0, 0], [14, 1], [182.625, 2], [1826.25, 3], [3652.5, 4]]);
const ECO_DURATION_KNOTS = Object.freeze([[0, 0], [91.3125, 1], [1826.25, 2], [7305, 3], [18262.5, 4]]);

function interpolate(value, knots, logarithmic = false) {
  if (!finite(value) || value < 0) return null;
  if (value >= knots.at(-1)[0]) return 4;
  for (let index = 1; index < knots.length; index++) {
    const [highInput, highLevel] = knots[index];
    if (value > highInput) continue;
    const [lowInput, lowLevel] = knots[index - 1];
    const scale = logarithmic ? x => Math.log1p(x) : x => x;
    const share = (scale(value) - scale(lowInput)) / (scale(highInput) - scale(lowInput));
    return lowLevel + share * (highLevel - lowLevel);
  }
  return null;
}

export function reachLevelFromHarmedPeople(count) {
  return interpolate(count, HUMAN_REACH_KNOTS, true);
}

export function reachLevelFromDegradedDistribution(percent) {
  return interpolate(percent, ECO_REACH_KNOTS);
}

export function severityLevelFromEcosystemCondition(percentTowardCollapse) {
  return interpolate(percentTowardCollapse, ECO_SEVERITY_KNOTS);
}

export function persistenceLevelFromDays(domain, days, irreversible = false) {
  if (!DOMAINS.includes(domain)) return null;
  if (irreversible) return 4;
  return interpolate(days, domain === 'human' ? HUMAN_DURATION_KNOTS : ECO_DURATION_KNOTS, true);
}

export function mapConsequenceIndex(index) {
  if (!finite(index) || index < 0 || index > 1) return null;
  if (index <= 0.75) return 1 + 8 * index;
  // With 50/25/25 axis weights, the frozen 9-point profile (4/3/4) lies at
  // 15/16. Keep it anchored at 9 and retain 4/4/4 as the 10-point ceiling.
  if (index <= 15 / 16) return 7 + (32 / 3) * (index - 0.75);
  return 9 + 16 * (index - 15 / 16);
}

export function consequenceIndex(axes) {
  if (!axes || AXES.some(key => !finite(axes[key]) || axes[key] < 0 || axes[key] > 4)) return null;
  if (AXES.some(key => axes[key] === 0) && AXES.some(key => axes[key] > 0)) return null;
  return AXES.reduce((total, key) => total + CONSEQUENCE_AXIS_WEIGHTS[key] * axes[key] / 4, 0);
}

export function scoreCoherentAxes(axesByDomain) {
  if (!axesByDomain || !Object.keys(axesByDomain).length
    || Object.keys(axesByDomain).some(domain => !DOMAINS.includes(domain))) return null;
  const components = {};
  for (const [domain, axes] of Object.entries(axesByDomain)) {
    const index = consequenceIndex(axes);
    if (index === null) return null;
    components[domain] = mapConsequenceIndex(index);
  }
  return {
    value: roundScore(Object.values(components).reduce((total, value) => total + value, 0) / Object.keys(components).length),
    rawValue: Object.values(components).reduce((total, value) => total + value, 0) / Object.keys(components).length,
    components: Object.fromEntries(Object.entries(components).map(([domain, value]) => [domain, roundScore(value)])),
    rawComponents: components,
  };
}

function resolveAxes(domain, estimate, issues) {
  if (!estimate || typeof estimate !== 'object') {
    issues.push(`${domain}_estimate_missing`);
    return null;
  }
  const axes = { ...estimate.axes };
  if (!['assessed_harm', 'possible_zero', 'verified_zero'].includes(estimate.status)) {
    issues.push(`${domain}_estimate_status_invalid`);
  }
  for (const [axis, level] of Object.entries(axes)) {
    if (!AXES.includes(axis) || !Number.isInteger(level) || level < 0 || level > 4) {
      issues.push(`${domain}_${axis}_ordinal_level_invalid`);
    }
  }
  if (estimate.harmedPeople !== undefined) {
    if (domain !== 'human' || !Number.isSafeInteger(estimate.harmedPeople) || estimate.harmedPeople < 0
      || estimate.reachBasis !== 'people_with_attributable_harm') issues.push(`${domain}_harmed_people_basis_invalid`);
    else axes.reach = reachLevelFromHarmedPeople(estimate.harmedPeople);
  }
  if (estimate.degradedDistributionPercent !== undefined) {
    if (domain !== 'ecosystem' || !finite(estimate.degradedDistributionPercent)
      || estimate.degradedDistributionPercent < 0 || estimate.degradedDistributionPercent > 100
      || !nonempty(estimate.distributionDenominator)) issues.push(`${domain}_distribution_basis_invalid`);
    else axes.reach = reachLevelFromDegradedDistribution(estimate.degradedDistributionPercent);
  }
  if (estimate.relativeConditionLossPercent !== undefined) {
    if (domain !== 'ecosystem' || !finite(estimate.relativeConditionLossPercent)
      || estimate.relativeConditionLossPercent < 0 || estimate.relativeConditionLossPercent > 100
      || !nonempty(estimate.conditionIndicator) || !nonempty(estimate.referenceState)
      || !nonempty(estimate.collapseThreshold)) issues.push(`${domain}_condition_basis_invalid`);
    else axes.severity = severityLevelFromEcosystemCondition(estimate.relativeConditionLossPercent);
  }
  if (estimate.durationDays !== undefined || estimate.irreversible === true) {
    if (estimate.irreversible !== true && (!finite(estimate.durationDays) || estimate.durationDays < 0)) issues.push(`${domain}_duration_invalid`);
    else if (estimate.durationBasis !== 'attributable_consequence_or_recovery') issues.push(`${domain}_duration_basis_invalid`);
    else axes.persistence = persistenceLevelFromDays(domain, estimate.durationDays ?? 0, estimate.irreversible === true);
  }
  if (AXES.some(key => !finite(axes[key]) || axes[key] < 0 || axes[key] > 4)) {
    issues.push(`${domain}_axes_invalid`);
    return null;
  }
  if (AXES.some(key => axes[key] === 0) && AXES.some(key => axes[key] > 0)) issues.push(`${domain}_axes_incoherent_zero`);
  if (estimate.status === 'verified_zero' && AXES.some(key => axes[key] !== 0)) issues.push(`${domain}_verified_zero_nonzero_axes`);
  if (estimate.status === 'possible_zero' && AXES.some(key => axes[key] !== 0)) issues.push(`${domain}_possible_zero_nonzero_axes`);
  if (AXES.every(key => axes[key] === 0) && !['verified_zero', 'possible_zero'].includes(estimate.status)) {
    issues.push(`${domain}_zero_requires_basis`);
  }
  if (estimate.status === 'possible_zero' && estimate.position !== 'lower') issues.push(`${domain}_possible_zero_only_lower_bound`);
  return axes;
}

function validateDomain(domain, component, issues) {
  if (!component) {
    issues.push(`${domain}_component_missing`);
    return null;
  }
  const basis = component.harmBasis;
  if (!basis || !['direct', 'converted', 'structured', 'family', 'verified_zero'].includes(basis.route)) issues.push(`${domain}_harm_route_missing`);
  if (!basis || !nonempty(basis.endpoint) || !nonempty(basis.counterfactual)) issues.push(`${domain}_harm_endpoint_missing`);
  // The three axes must describe one compatible consequence and population,
  // not the worst observed severity combined with everyone exposed to a hazard.
  for (const field of ['endpointId', 'affectedGroup', 'geography', 'assessmentWindow',
    'severityAggregation', 'endpointCoverage', 'overlapCheck']) {
    if (!nonempty(basis?.[field])) issues.push(`${domain}_${field}_missing`);
  }
  if (!basis || !['attributable_consequence', 'modeled_consequence', 'structured_consequence_estimate', 'verified_zero'].includes(basis.metricRole)) {
    issues.push(`${domain}_terminal_metric_required`);
  }
  if (!Array.isArray(basis?.evidenceReferences) || !basis.evidenceReferences.length
    || basis.evidenceReferences.some(reference => !nonempty(reference))) issues.push(`${domain}_evidence_missing`);
  if (basis?.route === 'family' && (!basis.analogueNodeIds?.length || !nonempty(basis.adjustmentRationale))) {
    issues.push(`${domain}_family_adjustment_missing`);
  }
  if (basis?.route === 'structured' && !nonempty(basis.estimateRationale)) issues.push(`${domain}_structured_rationale_missing`);
  if (basis?.route === 'verified_zero' && basis.metricRole !== 'verified_zero') issues.push(`${domain}_verified_zero_basis_invalid`);
  if (basis?.route !== 'verified_zero' && basis?.metricRole === 'verified_zero') issues.push(`${domain}_zero_metric_requires_verified_route`);
  if (basis?.route === 'verified_zero' && !nonempty(basis.zeroFinding)) issues.push(`${domain}_verified_zero_finding_missing`);
  if (basis?.route !== 'verified_zero') {
    const axisEvidence = basis?.axisEvidence;
    const permitted = {
      severity: domain === 'human'
        ? ['observed_human_consequence', 'modeled_human_consequence', 'bounded_human_consequence_estimate']
        : ['observed_ecosystem_condition', 'modeled_ecosystem_condition', 'bounded_ecosystem_condition_estimate'],
      reach: domain === 'human'
        ? ['count_of_harmed_people', 'modeled_count_of_harmed_people', 'bounded_harmed_people_estimate']
        : ['degraded_ecosystem_distribution', 'modeled_degraded_distribution', 'bounded_degraded_distribution_estimate'],
      persistence: ['observed_consequence_duration', 'modeled_consequence_duration', 'bounded_recovery_estimate'],
    };
    for (const axis of AXES) {
      const evidence = axisEvidence?.[axis];
      if (!permitted[axis].includes(evidence?.kind) || !nonempty(evidence?.explanation)) {
        issues.push(`${domain}_${axis}_consequence_evidence_missing`);
      }
      if (evidence?.endpointId !== basis?.endpointId || evidence?.affectedGroup !== basis?.affectedGroup) {
        issues.push(`${domain}_${axis}_endpoint_scope_mismatch`);
      }
      if (evidence?.geography !== basis?.geography || evidence?.assessmentWindow !== basis?.assessmentWindow) {
        issues.push(`${domain}_${axis}_period_or_geography_mismatch`);
      }
      if (evidence?.kind?.startsWith('bounded_') && !nonempty(evidence?.estimateRationale)) {
        issues.push(`${domain}_${axis}_bounded_estimate_rationale_missing`);
      }
    }
  }
  const estimates = {};
  for (const position of ['lower', 'central', 'upper']) {
    const input = component[position] ? { ...component[position], position } : null;
    estimates[position] = resolveAxes(domain, input, issues);
    if (position === 'central' && basis?.route === 'verified_zero' && input?.status !== 'verified_zero') {
      issues.push(`${domain}_central_zero_not_verified`);
    }
    if (basis?.route === 'verified_zero' && input?.status !== 'verified_zero') {
      issues.push(`${domain}_${position}_verified_zero_bound_invalid`);
    }
    if (position === 'central' && basis?.route !== 'verified_zero' && input?.status === 'verified_zero') {
      issues.push(`${domain}_unknown_harm_cannot_be_zero`);
    }
  }
  if (estimates.lower && estimates.central && estimates.upper) {
    for (const axis of AXES) {
      if (estimates.lower[axis] > estimates.central[axis] || estimates.central[axis] > estimates.upper[axis]) {
        issues.push(`${domain}_${axis}_bounds_out_of_order`);
      }
    }
  }
  return estimates;
}

export function validateConsequenceAssessment(assessment, expectedVersion = CONSEQUENCE_METHOD_VERSION) {
  if (assessment?.nodeKind === 'response') {
    return { status: 'not_applicable', label: 'Response', value: null, reasons: [] };
  }
  const reasons = [];
  if (assessment?.methodVersion !== expectedVersion) reasons.push('method_version_mismatch');
  if (!nonempty(assessment?.nodeId)) reasons.push('node_id_missing');
  if (!Array.isArray(assessment?.applicableDomains) || !assessment.applicableDomains.length
    || new Set(assessment.applicableDomains).size !== assessment.applicableDomains.length
    || assessment.applicableDomains.some(domain => !DOMAINS.includes(domain))) reasons.push('applicable_domains_invalid');
  if (assessment?.applicableDomains?.length === 1) {
    const excluded = DOMAINS.find(domain => !assessment.applicableDomains.includes(domain));
    if (assessment.domainApplicability?.[excluded]?.status !== 'structurally_not_applicable'
      || !nonempty(assessment.domainApplicability?.[excluded]?.reason)) reasons.push(`${excluded}_structural_exclusion_missing`);
  }
  const estimates = {};
  for (const domain of assessment?.applicableDomains ?? []) {
    if (!DOMAINS.includes(domain)) continue;
    estimates[domain] = validateDomain(domain, assessment.components?.[domain], reasons);
  }
  if (reasons.length) return { status: 'needs_consequence_assessment', value: null, reasons };
  return { status: 'valid', estimates, reasons: [] };
}

export function evaluateConsequenceAssessment(assessment) {
  const validated = validateConsequenceAssessment(assessment);
  if (validated.status !== 'valid') return validated;
  const { estimates } = validated;
  const values = Object.fromEntries(['lower', 'central', 'upper'].map(position => [position,
    scoreCoherentAxes(Object.fromEntries(assessment.applicableDomains.map(domain => [domain, estimates[domain][position]])))
  ]));
  if (Object.values(values).some(value => value === null) || values.lower.rawValue > values.central.rawValue
    || values.central.rawValue > values.upper.rawValue) return { status: 'needs_consequence_assessment', value: null, reasons: ['score_bounds_invalid'] };
  return {
    status: 'experimental_candidate',
    methodVersion: CONSEQUENCE_METHOD_VERSION,
    value: values.central.value,
    uncertainty: { lower: values.lower.value, upper: values.upper.value, kind: 'structured_bounds_not_probability' },
    components: values.central.components,
    domainWeights: Object.fromEntries(DOMAINS.map(domain => [domain, assessment.applicableDomains.includes(domain) ? 1 / assessment.applicableDomains.length : 0])),
    reasons: [],
  };
}
