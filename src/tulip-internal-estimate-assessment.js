import authoredDecision from './tulip-estimate-policy-decision.json' with { type: 'json' };
import benchmarkPolicy from './tulip-consequence-policy-v1.json' with { type: 'json' };
import { mapFixedBenchmarkMagnitude, roundBenchmarkDisplay } from './tulip-fixed-benchmark-map.js';

const text = value => typeof value === 'string' && value.trim().length > 0;
const amount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const validSource = source => {
  try {
    const url = new URL(source?.url);
    return text(source.id) && text(source.label) && text(source.relevance)
      && ['context', 'endpoint', 'method'].includes(source.supports)
      && url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
};
const uniqueSources = sources => Array.isArray(sources) && sources.length > 0
  && sources.every(validSource)
  && new Set(sources.map(source => source.id)).size === sources.length
  && new Set(sources.map(source => `${new URL(source.url).href}|${source.locator ?? ''}`)).size === sources.length;

// The preference adjustment is one bounded term, regardless of how many
// articles describe the loss. Keep requested and applied amounts separate near 10.
export function applyIrreplaceabilityAdjustment(baseNature, lossFraction, maximumNatureBonus = 1) {
  if (!amount(baseNature) || baseNature < 1 || baseNature > 10
    || !amount(lossFraction) || lossFraction > 1
    || !amount(maximumNatureBonus) || maximumNatureBonus > 1) return null;
  const requestedBonus = maximumNatureBonus * lossFraction;
  const appliedBonus = Math.min(requestedBonus, 10 - baseNature);
  const adjustedValue = Math.min(10, baseNature + appliedBonus);
  return { requestedBonus, appliedBonus, adjustedValue, overallIncrease: 0.5 * appliedBonus };
}

// This branch admits documented authored estimates under the user's selected
// evidence standard. It does not change the strict source-consequence experiment
// or turn an assumed quantity into a registered source observation.
export function createInternalEstimateEvaluator({ decision = authoredDecision } = {}) {
  const policy = freeze(structuredClone(decision));
  if (policy.internalEstimates?.allowed !== true
    || policy.weights?.human !== 0.5 || policy.weights?.ecosystem !== 0.5) {
    throw new Error('confirmed_internal_estimate_policy_required');
  }
  if (policy.irreplaceability?.capStatus === 'confirmed'
    && (!amount(policy.irreplaceability.maximumNatureBonus)
      || policy.irreplaceability.maximumNatureBonus > 1)) {
    throw new Error('confirmed_irreplaceability_cap_exceeded');
  }
  const evaluate = record => {
    const reasons = [];
    const result = { nodeId: record?.nodeId ?? null, nodeKind: record?.nodeKind === 'response' ? 'response' : 'issue', methodVersion: policy.version,
      valueKind: 'internal_estimate', label: 'TULIP Score', valueLabel: 'Internal estimate',
      status: 'estimate_record_incomplete', value: null, components: {}, uncertainty: null,
      scientificCalibrationApproved: false, measuredHarmClaim: false, reasons };
    if (record?.nodeKind === 'response') return { ...result, status: 'not_applicable',
      label: 'Response', valueLabel: null, valueKind: null };
    if (!text(record?.nodeId) || !text(record?.name) || record.nodeKind !== 'issue') reasons.push('node_identity_required');
    if (record?.policyVersion !== policy.version) reasons.push('estimate_policy_binding_required');
    if (record?.valueKind !== 'internal_estimate') reasons.push('explicit_internal_estimate_kind_required');
    if (Object.hasOwn(record ?? {}, 'value') || Object.hasOwn(record ?? {}, 'previousValue')
      || Object.hasOwn(record ?? {}, 'legacyValue')) reasons.push('entered_or_retained_final_number_forbidden');
    if (!text(record?.geography) || !/^\d{4}$/.test(record?.assessmentPeriod ?? '')) reasons.push('estimate_scope_required');
    if (!text(record?.assessmentId) || !text(record?.authoredOn) || !text(record?.missingEvidence)) reasons.push('estimate_authorship_and_gap_required');
    if (Object.hasOwn(record ?? {}, 'uncertainty')) reasons.push('unsupported_estimate_interval_forbidden');
    for (const domain of ['human', 'ecosystem']) {
      const component = record?.components?.[domain];
      if (!component) { reasons.push(`${domain}_estimate_required`); continue; }
      if (!amount(component.quantityEstimate) || component.unit !== benchmarkPolicy[domain].unit) reasons.push(`${domain}_canonical_estimate_required`);
      if (component.kind !== 'internal_estimate' || component.coverage !== 'whole_domain_estimate') reasons.push(`${domain}_authored_coverage_required`);
      if (component.geography !== record.geography || component.assessmentPeriod !== record.assessmentPeriod) reasons.push(`${domain}_scope_mismatch`);
      for (const field of ['outcomeDefinition', 'estimationMethod', 'attribution', 'overlapReview', 'limitations']) {
        if (!text(component[field])) reasons.push(`${domain}_${field}_required`);
      }
      if (!Array.isArray(component.assumptions) || !component.assumptions.length
        || component.assumptions.some(item => !text(item.id) || !text(item.statement)
          || item.kind !== 'authored_assumption')) reasons.push(`${domain}_explicit_assumptions_required`);
      if (!uniqueSources(component.evidenceReferences)) reasons.push(`${domain}_relevant_source_context_required`);
      if (component.quantityEstimate === 0 && !text(component.estimatedAbsenceReason)) reasons.push(`${domain}_estimated_zero_reason_required`);
      const mapped = mapFixedBenchmarkMagnitude(component.quantityEstimate, benchmarkPolicy[domain].points, benchmarkPolicy[domain].logOffset);
      if (!Number.isFinite(mapped)) reasons.push(`${domain}_benchmark_mapping_invalid`);
      result.components[domain] = { quantityEstimate: component.quantityEstimate,
        unit: component.unit, baseValue: mapped, kind: 'internal_estimate',
        outcomeDefinition: component.outcomeDefinition, estimationMethod: component.estimationMethod,
        attribution: component.attribution, overlapReview: component.overlapReview,
        limitations: component.limitations, assumptions: structuredClone(component.assumptions ?? []),
        evidenceReferences: structuredClone(component.evidenceReferences ?? []),
        ...(component.estimatedAbsenceReason ? { estimatedAbsenceReason: component.estimatedAbsenceReason } : {}) };
    }
    const priority = record?.irreplaceability;
    let fraction = 0;
    if (priority?.status === 'not_assigned' && text(priority.reason)) {
      result.priorityExplanation = priority.reason;
    } else if (priority?.status === 'eligible') {
      if (!amount(priority.irreversibleLossFractionEstimate) || priority.irreversibleLossFractionEstimate > 1
        || !['source_based', 'internal_judgment'].includes(priority.basis)) reasons.push('bounded_irreversible_loss_estimate_required');
      for (const field of ['rareAssetDefinition', 'rarityBasis', 'irreversibilityBasis', 'attribution', 'limitations']) {
        if (!text(priority[field])) reasons.push(`priority_${field}_required`);
      }
      if (!uniqueSources(priority.evidenceReferences)) reasons.push('priority_source_context_required');
      if (priority.basis === 'internal_judgment' && !text(priority.assumption)) reasons.push('priority_assumption_required');
      if (!(record.components?.ecosystem?.quantityEstimate > 0)) reasons.push('positive_ecological_loss_required_for_bonus');
      fraction = priority.irreversibleLossFractionEstimate;
      result.priorityExplanation = priority.irreversibilityBasis;
    } else reasons.push('explicit_priority_review_required');
    if (reasons.length) return result;
    if (policy.irreplaceability?.capStatus !== 'confirmed') {
      return { ...result, status: 'priority_cap_choice_pending' };
    }
    const adjustment = applyIrreplaceabilityAdjustment(result.components.ecosystem.baseValue,
      fraction, policy.irreplaceability.maximumNatureBonus);
    const raw = 0.5 * result.components.human.baseValue + 0.5 * adjustment.adjustedValue;
    result.components.ecosystem.priorityBonus = adjustment.appliedBonus;
    result.components.ecosystem.requestedPriorityBonus = adjustment.requestedBonus;
    result.components.ecosystem.adjustedValue = adjustment.adjustedValue;
    result.irreplaceability = { ...structuredClone(priority), maximumNatureBonus: policy.irreplaceability.maximumNatureBonus,
      overallIncreaseBeforeRounding: adjustment.overallIncrease };
    result.value = roundBenchmarkDisplay(raw);
    result.unrounded = raw;
    result.status = 'internal_estimate';
    result.explanation = `Internal estimate of current impact for ${record.name}. `
      + 'TULIP gives equal emphasis to people and nature. '
      + (adjustment.appliedBonus > 0
        ? `A documented adjustment for rare, irreversible ecological loss adds ${adjustment.appliedBonus.toFixed(2)} to nature before averaging (at most 1 point on nature or 0.5 overall). `
        : `No ecological priority adjustment increases this score. ${result.priorityExplanation} `)
      + `Missing evidence: ${record.missingEvidence} `
      + 'Authored assumptions inform this assessment; it is not a measured or scientifically calibrated harm total.';
    result.accessibilityLabel = `TULIP Score ${result.value.toFixed(1)} out of 10. Internal estimate.`;
    return result;
  };
  return { evaluate };
}

export const evaluateInternalEstimateAssessment = createInternalEstimateEvaluator().evaluate;
