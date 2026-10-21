import { mapFixedBenchmarkMagnitude, roundBenchmarkDisplay,
  validateFixedBenchmarkPoints } from './tulip-fixed-benchmark-map.js';
import domainCombinationDecision from './tulip-domain-combination-decision.json' with { type: 'json' };

export const BENCHMARK_SCORE_EXPERIMENT_VERSION = 'tulip_fixed_benchmark_composite_2026_09_27_v2_experimental';
const DOMAINS = Object.freeze(['human', 'ecosystem']);
const text = value => typeof value === 'string' && value.trim().length > 0;
const finiteNonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const positive = value => finiteNonnegative(value) && value > 0;
const record = value => value !== null && typeof value === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
const selectedCombination = freeze(structuredClone(domainCombinationDecision));
if (selectedCombination.policyId !== 'fixed_average'
  || selectedCombination.weights?.human !== 0.5 || selectedCombination.weights?.ecosystem !== 0.5
  || selectedCombination.status !== 'user_confirmed_combination_only') {
  throw new Error('fixed_equal_domain_combination_decision_required');
}

// A canonical definition key records exact protocol content. It is not a
// cryptographic signature or a substitute for verifying source artifacts.
export function fixedBenchmarkPolicyKey(value) {
  const canonical = item => Array.isArray(item) ? item.map(canonical)
    : record(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, canonical(item[key])])) : item;
  return JSON.stringify(canonical(value));
}

// Compile the separately maintained protocol and observations ONCE. A node
// packet supplies references, never quantities, weights or new benchmarks.
// This is an internal calibration calculator. Successful arithmetic is not a
// scientific source review, a whole-node assessment, or publication approval.
export function createFixedBenchmarkScoreExperiment({ policy, observations, exclusions = {} }) {
  const registered = freeze(structuredClone({ policy, observations, exclusions }));
  const fixed = registered.policy;
  const definitionErrors = [];
  if (fixed?.methodVersion !== BENCHMARK_SCORE_EXPERIMENT_VERSION || !text(fixed?.version)) {
    definitionErrors.push('versioned_benchmark_policy_required');
  }
  if (fixed?.construct !== 'aggregate_current_attributable_consequence') definitionErrors.push('current_consequence_construct_required');
  if (fixed?.combination !== selectedCombination.kernelCombination) definitionErrors.push('fixed_scope_combination_required');
  if (fixed?.weights?.human !== selectedCombination.weights.human || fixed?.weights?.ecosystem !== selectedCombination.weights.ecosystem
    || Object.keys(fixed?.weights ?? {}).length !== 2) definitionErrors.push('equal_domain_policy_required');
  if (!record(fixed?.calibrations) || !Object.keys(fixed.calibrations).length) definitionErrors.push('registered_calibrations_required');
  if (!record(registered.observations) || !record(registered.exclusions)) definitionErrors.push('separate_observation_registry_required');
  for (const [id, calibration] of Object.entries(fixed?.calibrations ?? {})) {
    if (!text(id) || !text(calibration?.version) || !DOMAINS.includes(calibration?.domain)
      || !text(calibration?.outcomeKind) || !text(calibration?.unit)
      || !text(calibration?.reportingPeriodBasis) || !text(calibration?.policyExplanation)
      || !['fixed_absolute_burden', 'fixed_reference_fraction'].includes(calibration?.basis)
      || calibration?.interpolation !== 'piecewise_log1p_canonical_unit'
      || !positive(calibration?.logOffset)
      || !record(calibration?.inputUnits) || calibration.inputUnits[calibration.unit] !== 1
      || Object.values(calibration.inputUnits).some(value => !positive(value))
      || validateFixedBenchmarkPoints(calibration?.points).length) {
      definitionErrors.push(`${id}_calibration_definition_invalid`);
    }
    if (calibration?.basis === 'fixed_reference_fraction'
      && (calibration?.points?.at?.(-1)?.burden !== 1
        || !text(calibration?.referenceId) || !text(calibration?.referenceVersion))) {
      definitionErrors.push(`${id}_fraction_reference_definition_invalid`);
    }
  }
  if (definitionErrors.length) throw new Error(definitionErrors.join(', '));
  const policyDefinitionKey = fixedBenchmarkPolicyKey(fixed);

  const calculate = packet => {
    const result = {
      nodeId: packet?.nodeId ?? null, methodVersion: BENCHMARK_SCORE_EXPERIMENT_VERSION,
      policyVersion: fixed.version, status: 'needs_calibration_inputs',
      domainCombinationDecisionVersion: selectedCombination.version,
      policyDefinitionKey,
      value: null, experimentalValue: null, unrounded: null, range: null, displayRange: null,
      experimentalEndpointValue: null, assessmentKind: packet?.assessmentKind ?? null,
      comparisonBasis: null,
      components: { human: null, ecosystem: null }, reasons: [], publicReady: false,
      coverage: 'calculation_only_not_whole_node_admission',
    };
    if (!text(packet?.nodeId)) result.reasons.push('node_id_required');
    if (!['issue', 'response'].includes(packet?.nodeKind)) result.reasons.push('node_kind_required');
    if (packet?.policyVersion !== fixed.version) result.reasons.push('fixed_policy_version_mismatch');
    if (packet?.policyDefinitionKey !== policyDefinitionKey) result.reasons.push('fixed_policy_definition_changed');
    if (packet?.nodeKind === 'response' && !result.reasons.length) {
      result.status = 'not_applicable_response';
      return result;
    }
    if (!['fixed_people_nature_composite', 'domain_endpoint_only'].includes(packet?.assessmentKind)) {
      result.reasons.push('explicit_assessment_kind_required');
    }
    for (const field of ['assessmentPeriod', 'geography', 'counterfactualId']) {
      if (!text(packet?.[field])) result.reasons.push(`${field}_required`);
    }
    if (!/^\d{4}$/.test(packet?.assessmentPeriod ?? '')) result.reasons.push('calendar_year_scope_required');
    if (['weights', 'anchors', 'calibrations', 'observations', 'value', 'excludedDomains']
      .some(field => Object.hasOwn(packet ?? {}, field))) result.reasons.push('packet_scoring_overrides_forbidden');
    if (!record(packet?.components) || Object.keys(packet.components).some(key => !DOMAINS.includes(key))) {
      result.reasons.push('named_domain_references_required');
    }
    const usedObservationIds = new Set();
    const selected = [];
    for (const domain of DOMAINS) {
      const exclusion = Object.hasOwn(registered.exclusions, packet?.nodeId)
        ? registered.exclusions[packet.nodeId]?.[domain] : null;
      if (exclusion) {
        if (!text(exclusion.reviewEvidenceId) || !text(exclusion.reason)) result.reasons.push(`${domain}_reviewed_exclusion_required`);
        if (exclusion.scope !== 'endpoint_only') result.reasons.push(`${domain}_explicit_endpoint_exclusion_required`);
        if (packet?.assessmentKind !== 'domain_endpoint_only') result.reasons.push(`${domain}_endpoint_exclusion_cannot_fill_composite`);
        if (packet?.components?.[domain] != null) result.reasons.push(`${domain}_excluded_component_supplied`);
        result.components[domain] = { status: 'registered_scope_exclusion', ...exclusion };
        continue;
      }
      const reference = packet?.components?.[domain];
      if (!record(reference) || !text(reference.calibrationId) || !text(reference.observationId)) {
        result.reasons.push(`${domain}_registered_consequence_required`);
        continue;
      }
      if (Object.keys(reference).some(key => !['calibrationId', 'observationId', 'calibrationVersion',
        'sourceVersion', 'sourceArtifactSha256'].includes(key))) {
        result.reasons.push(`${domain}_reference_cannot_override_registered_input`);
      }
      const calibration = Object.hasOwn(fixed.calibrations, reference.calibrationId)
        ? fixed.calibrations[reference.calibrationId] : null;
      const observation = Object.hasOwn(registered.observations, reference.observationId)
        ? registered.observations[reference.observationId] : null;
      if (!calibration || calibration.domain !== domain) {
        result.reasons.push(`${domain}_compatible_calibration_required`);
        continue;
      }
      if (!observation) {
        result.reasons.push(`${domain}_registered_observation_required`);
        continue;
      }
      const errors = [];
      if (reference.calibrationVersion !== calibration.version) errors.push('calibration_version_changed');
      if (reference.sourceVersion !== observation.sourceVersion
        || reference.sourceArtifactSha256 !== observation.artifactSha256) errors.push('source_binding_changed');
      if (usedObservationIds.has(reference.observationId)) errors.push('duplicate_observation');
      usedObservationIds.add(reference.observationId);
      if (!Array.isArray(observation.nodeIds) || !observation.nodeIds.includes(packet.nodeId)) errors.push('node_outcome_binding_mismatch');
      for (const field of ['assessmentPeriod', 'geography', 'counterfactualId']) {
        if (observation[field] !== packet?.[field]) errors.push(`${field}_source_scope_mismatch`);
      }
      for (const field of ['domain', 'outcomeKind', 'reportingPeriodBasis']) {
        if (observation[field] !== calibration[field]) errors.push(`${field}_calibration_mismatch`);
      }
      if (observation.basis !== calibration.basis) errors.push('quantity_basis_mismatch');
      if (observation.consequenceBasis !== 'current_attributable_consequence') errors.push('current_consequence_quantity_required');
      if (calibration.basis === 'fixed_reference_fraction'
        && ['referenceId', 'referenceVersion'].some(field => observation[field] !== calibration[field])) {
        errors.push('fixed_reference_mismatch');
      }
      if (!text(observation.sourceId) || !text(observation.sourceVersion) || !text(observation.locator)
        || !/^[a-f0-9]{64}$/.test(observation.artifactSha256 ?? '')
        || !/^https:\/\//.test(observation.sourceUrl ?? '') || !text(observation.overlapReviewId)) errors.push('source_lineage_or_overlap_review_missing');
      const conversion = Object.hasOwn(calibration.inputUnits, observation.unit)
        ? calibration.inputUnits[observation.unit] : null;
      if (conversion === null) errors.push('quantity_unit_incompatible');
      if (!finiteNonnegative(observation.central)) errors.push('central_quantity_invalid');
      const hasBounds = observation.lower != null || observation.upper != null;
      if (hasBounds && (!finiteNonnegative(observation.lower) || !finiteNonnegative(observation.upper)
        || observation.lower > observation.central || observation.central > observation.upper
        || !text(observation.boundsMeaning))) errors.push('source_bounds_invalid');
      if (observation.central === 0 && observation.zeroMeaning !== 'verified_zero_for_declared_endpoint') errors.push('verified_zero_required');
      const quantities = { central: observation.central * conversion,
        lower: hasBounds ? observation.lower * conversion : null,
        upper: hasBounds ? observation.upper * conversion : null };
      if (conversion !== null && (!finiteNonnegative(quantities.central)
        || (hasBounds && (!finiteNonnegative(quantities.lower) || !finiteNonnegative(quantities.upper))))) errors.push('converted_quantity_not_finite');
      if (calibration.basis === 'fixed_reference_fraction'
        && Object.values(quantities).some(value => value !== null && value > 1)) errors.push('fraction_outside_fixed_reference');
      if (errors.length) {
        result.reasons.push(...errors.map(reason => `${domain}_${reason}`));
        continue;
      }
      const scores = Object.fromEntries(Object.entries(quantities).map(([key, value]) =>
        [key, value === null ? null : mapFixedBenchmarkMagnitude(value, calibration.points, calibration.logOffset)]));
      if (scores.central === null || (hasBounds && (scores.lower === null || scores.upper === null))) {
        result.reasons.push(`${domain}_benchmark_mapping_not_resolvable`);
        continue;
      }
      const component = { status: 'experimental_mapped_endpoint', calibrationId: reference.calibrationId,
        calibrationVersion: calibration.version, observationId: reference.observationId,
        quantities, unit: calibration.unit, unrounded: scores,
        boundsMeaning: hasBounds ? observation.boundsMeaning : null,
        sourceId: observation.sourceId, sourceVersion: observation.sourceVersion,
        locator: observation.locator, artifactSha256: observation.artifactSha256 };
      result.components[domain] = component;
      selected.push(component);
    }
    if (!selected.length && !result.reasons.length) result.reasons.push('at_least_one_applicable_domain_required');
    if (packet?.assessmentKind === 'domain_endpoint_only' && selected.length !== 1) {
      result.reasons.push('single_endpoint_scope_required');
    }
    if (packet?.assessmentKind === 'fixed_people_nature_composite' && selected.length !== 2) {
      result.reasons.push('both_composite_domains_required_without_reweighting');
    }
    if (result.reasons.length) {
      result.reasons = [...new Set(result.reasons)];
      return result;
    }
    // An endpoint reading is a component diagnostic, never a comparable TULIP
    // composite. A composite always retains the fixed two-domain weights.
    // Verified zero needs its registered consequence observation; an excluded
    // or missing domain cannot stand in for that observation.
    const endpointOnly = packet.assessmentKind === 'domain_endpoint_only';
    const combine = key => endpointOnly ? selected[0].unrounded[key]
      : DOMAINS.reduce((sum, domain) => sum + fixed.weights[domain] * result.components[domain].unrounded[key], 0);
    result.unrounded = combine('central');
    const displayed = roundBenchmarkDisplay(result.unrounded);
    result.experimentalValue = endpointOnly ? null : displayed;
    result.experimentalEndpointValue = endpointOnly ? displayed : null;
    result.status = endpointOnly ? 'experimental_domain_endpoint' : 'experimental_fixed_domain_composite';
    result.comparisonBasis = endpointOnly ? 'domain_endpoint_not_comparable_to_fixed_composite' : 'fixed_people_nature_50_50';
    if (selected.every(component => component.unrounded.lower !== null && component.unrounded.upper !== null)) {
      result.range = { lower: combine('lower'), upper: combine('upper'),
        kind: endpointOnly ? 'reported_component_bounds_not_composite' : 'propagated_component_envelope_not_joint_confidence_interval',
        componentMeanings: selected.map(component => component.boundsMeaning) };
      // Outward display rounding preserves containment; ordinary nearest
      // rounding of the central point can otherwise lie outside raw bounds.
      result.displayRange = {
        lower: Math.min(Math.floor(result.range.lower * 10) / 10, displayed),
        upper: Math.max(Math.ceil(result.range.upper * 10) / 10, displayed),
        kind: result.range.kind, rounding: 'outward_to_one_decimal',
      };
    }
    return result;
  };
  return Object.freeze({ methodVersion: BENCHMARK_SCORE_EXPERIMENT_VERSION,
    policyVersion: fixed.version, policyDefinitionKey, calculate,
    describePolicy: () => structuredClone(fixed) });
}
