// Experimental conversion of a source-bound parent health burden into a
// source-specific endpoint. An emissions share is never a harm allocation.
import { REGISTERED_DALY_OBSERVATIONS, REGISTERED_COUNTERFACTUAL_DEFINITIONS } from './tulip-source-observation-registry.js';

export const BURDEN_CONVERSION_VERSION = 'tulip_burden_conversion_2026_09_27_v2';

const finiteFraction = value => typeof value === 'number' && Number.isFinite(value)
  && value >= 0 && value <= 1;
const finiteNonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const record = value => value !== null && typeof value === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
const refusal = reasons => ({ status: 'needs_consequence_conversion', burden: null,
  score: null, publicReady: false, reasons: [...new Set(reasons)] });

// Exact derivation content, not a cryptographic source signature. Node binding
// is checked separately so authorizing another equivalent case cannot refit
// the model or change existing arithmetic.
export function modeledAllocationDefinitionKey(value) {
  const canonical = item => Array.isArray(item) ? item.map(canonical)
    : record(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, canonical(item[key])])) : item;
  const { nodeIds, ...derivation } = value;
  return JSON.stringify(canonical(derivation));
}

// Register source/model outputs separately from node packets. Registration is
// an input-integrity boundary, not verification of the causal model. No real
// allocation is registered by default; fixtures are supplied only by tests.
export function createModeledDalyAllocationExperiment({ allocations = {} } = {}) {
  if (!record(allocations)) throw new Error('separate_allocation_registry_required');
  const registered = freeze(structuredClone(allocations));
  for (const [id, row] of Object.entries(registered)) {
    if (!nonempty(id) || !record(row) || !nonempty(row.sourceVersion)
      || !nonempty(row.modelVersion) || !nonempty(row.locator)
      || !/^[a-f0-9]{64}$/.test(row.artifactSha256 ?? '')
      || !Array.isArray(row.nodeIds) || !row.nodeIds.length || row.nodeIds.some(value => !nonempty(value))
      || !nonempty(row.counterfactualId) || !nonempty(row.counterfactualDefinition)
      || !nonempty(row.overlapReviewId) || !nonempty(row.boundsMeaning)) {
      throw new Error(`${id}_registered_allocation_definition_invalid`);
    }
  }
  const calculate = packet => {
    const reasons = [];
    if (packet?.methodVersion !== BURDEN_CONVERSION_VERSION) reasons.push('method_version_mismatch');
    if (!nonempty(packet?.nodeId) || !nonempty(packet?.parentEndpointId)) reasons.push('node_or_parent_id_missing');
    if (!record(packet) || Object.keys(packet).some(key =>
      !['methodVersion', 'nodeId', 'parentEndpointId', 'allocationReference'].includes(key))) {
      reasons.push('packet_allocation_or_parent_overrides_forbidden');
    }
    const reference = packet?.allocationReference;
    if (!record(reference) || !nonempty(reference.observationId)
      || Object.keys(reference).some(key => !['observationId', 'sourceVersion', 'artifactSha256', 'modelVersion', 'definitionKey'].includes(key))) {
      reasons.push('registered_allocation_reference_required');
    }
    const allocation = Object.hasOwn(registered, reference?.observationId)
      ? registered[reference.observationId] : null;
    if (!allocation) reasons.push('registered_model_allocation_required');
    if (reasons.length) return refusal(reasons);
    if (reference.sourceVersion !== allocation.sourceVersion || reference.modelVersion !== allocation.modelVersion
      || reference.artifactSha256 !== allocation.artifactSha256) reasons.push('allocation_source_binding_changed');
    if (reference.definitionKey !== modeledAllocationDefinitionKey(allocation)) reasons.push('registered_allocation_definition_changed');
    if (!allocation.nodeIds.includes(packet.nodeId)) reasons.push('allocation_node_binding_mismatch');
    const source = Object.hasOwn(REGISTERED_DALY_OBSERVATIONS, allocation.parentSourceId)
      ? REGISTERED_DALY_OBSERVATIONS[allocation.parentSourceId] : null;
    if (!source) return refusal([...reasons, 'registered_parent_dalys_required']);
    if (allocation.parentSourceVersion !== source.sourceVersion
      || allocation.parentSourceArtifactSha256 !== source.sourceArtifactSha256) reasons.push('parent_source_binding_changed');
    if (allocation.reportingPeriodBasis !== source.reportingPeriodBasis) reasons.push('allocation_reporting_period_basis_mismatch');
    for (const [modelField, sourceField] of [['parentCounterfactualId', 'counterfactualId'],
      ['parentCounterfactualVersion', 'counterfactualVersion'],
      ['parentCounterfactualArtifactSha256', 'counterfactualArtifactSha256']]) {
      if (allocation[modelField] !== source[sourceField]) reasons.push('parent_counterfactual_binding_changed');
    }
    const counterfactual = REGISTERED_COUNTERFACTUAL_DEFINITIONS[source.counterfactualId];
    if (!counterfactual || counterfactual.version !== source.counterfactualVersion
      || counterfactual.artifactSha256 !== source.counterfactualArtifactSha256
      || !counterfactual.appliesToSourceIds.includes(source.sourceId)) reasons.push('registered_parent_counterfactual_required');
    if (reasons.length) return refusal(reasons);
    // Reconstruct the parent from its registry. A status string on a mutable
    // caller-supplied endpoint cannot establish source-bound quantities.
    const parentEndpoint = {
      status: 'source_bound_endpoint', domain: 'human', outcomeKind: source.outcomeKind,
      unit: source.unit, endpointId: source.endpointId, geography: source.geography,
      period: source.assessmentPeriod, reportingPeriodBasis: source.reportingPeriodBasis,
      burden: { lower: source.lower, central: source.central, upper: source.upper },
      source: { id: source.sourceId, url: source.sourceUrl, version: source.sourceVersion,
        artifactSha256: source.sourceArtifactSha256, locator: source.sourceLocator },
    };
    const result = evaluateRegisteredAllocation({ ...packet, parentEndpoint,
      allocationObservation: { ...allocation, nodeId: packet.nodeId,
        counterfactual: allocation.counterfactualDefinition, overlapReview: allocation.overlapReviewId } });
    if (result.status !== 'modeled_endpoint_candidate') return refusal(result.reasons);
    return { ...result,
      allocationObservationId: reference.observationId,
      counterfactual: { id: allocation.counterfactualId, definition: allocation.counterfactualDefinition,
        modelVersion: allocation.modelVersion, parentCounterfactualId: source.counterfactualId },
      boundsMeaning: allocation.boundsMeaning,
      rangeKind: 'registered_joint_model_cases_not_inferred_probability_interval',
      evidenceStatus: allocation.synthetic === true ? 'synthetic_mechanics_fixture'
        : 'registered_model_pending_source_and_causal_review',
      sources: [parentEndpoint.source, { id: allocation.sourceId, url: allocation.sourceUrl,
        version: allocation.sourceVersion, modelVersion: allocation.modelVersion,
        artifactSha256: allocation.artifactSha256, locator: allocation.locator }],
    };
  };
  return Object.freeze({ methodVersion: BURDEN_CONVERSION_VERSION, calculate,
    describeAllocationRegistry: () => structuredClone(registered) });
}

const defaultExperiment = createModeledDalyAllocationExperiment();
export const evaluateModeledDalyAllocation = input => defaultExperiment.calculate(input);

function evaluateRegisteredAllocation(input) {
  const reasons = [];
  const parent = input?.parentEndpoint;
  const allocation = input?.allocationObservation;
  if (input?.methodVersion !== BURDEN_CONVERSION_VERSION) reasons.push('method_version_mismatch');
  if (!nonempty(input?.nodeId) || !nonempty(input?.parentEndpointId)) reasons.push('node_or_parent_id_missing');
  if (parent?.status !== 'source_bound_endpoint' || parent?.domain !== 'human'
    || parent?.outcomeKind !== 'attributable_dalys' || parent?.unit !== 'DALY') {
    reasons.push('source_bound_parent_dalys_required');
  }
  if (!nonempty(parent?.endpointId) || !nonempty(parent?.geography)
    || !nonempty(parent?.period) || !nonempty(parent?.source?.id)
    || !nonempty(parent?.source?.url) || !parent.source.url.startsWith('https://')) {
    reasons.push('parent_source_scope_missing');
  }
  if (!parent?.burden || !finiteNonnegative(parent.burden.lower)
    || !finiteNonnegative(parent.burden.central) || !finiteNonnegative(parent.burden.upper)
    || parent.burden.lower > parent.burden.central
    || parent.burden.central > parent.burden.upper) {
    reasons.push('parent_burden_interval_invalid');
  }
  if (!allocation || allocation.kind !== 'modeled_fraction_of_parent_attributable_dalys'
    || allocation.unit !== 'fraction_of_attributable_dalys'
    || allocation.evidenceRole !== 'causal_burden_allocation') {
    reasons.push('modeled_harm_fraction_required');
  }
  if (!nonempty(allocation?.sourceId) || !nonempty(allocation?.sourceUrl)
    || !allocation.sourceUrl.startsWith('https://') || !nonempty(allocation?.modelVersion)
    || !nonempty(allocation?.counterfactual) || !nonempty(allocation?.overlapReview)) {
    reasons.push('allocation_source_or_model_missing');
  }
  if (input?.parentEndpointId !== parent?.endpointId
    || allocation?.nodeId !== input?.nodeId || allocation?.parentEndpointId !== input?.parentEndpointId
    || allocation?.geography !== parent?.geography
    || allocation?.assessmentPeriod !== parent?.period) {
    reasons.push('allocation_scope_mismatch');
  }
  const positions = ['lower', 'central', 'upper'];
  const cases = allocation?.jointCases;
  if (!cases || positions.some(position => {
    const item = cases[position];
    return !item || !finiteNonnegative(item.parentDalys) || !finiteFraction(item.burdenFraction)
      || !nonempty(item.modelRunId) || !nonempty(item.explanation)
      || !Array.isArray(item.evidenceReferences)
      || !item.evidenceReferences.includes(allocation?.sourceId)
      || !item.evidenceReferences.includes(parent?.source?.id);
  })) reasons.push('joint_model_cases_missing_or_invalid');
  if (cases && parent?.burden && positions.some(position => {
    const item = cases[position];
    return item && (item.parentDalys !== parent.burden[position]);
  })) reasons.push('parent_burden_not_source_bound');
  if (reasons.length) return { status: 'needs_consequence_conversion', burden: null, score: null, reasons };
  const amounts = Object.fromEntries(positions.map(position =>
    [position, cases[position].parentDalys * cases[position].burdenFraction]));
  if (amounts.lower > amounts.central || amounts.central > amounts.upper) {
    return { status: 'needs_consequence_conversion', burden: null, score: null,
      reasons: ['joint_burden_interval_out_of_order'] };
  }
  return {
    status: 'modeled_endpoint_candidate', methodVersion: BURDEN_CONVERSION_VERSION,
    nodeId: input.nodeId, parentEndpointId: input.parentEndpointId,
    domain: 'human', outcomeKind: 'attributable_dalys', unit: 'DALY',
    period: parent.period, geography: parent.geography,
    burden: amounts,
    sources: [parent.source, { id: allocation.sourceId, url: allocation.sourceUrl }],
    score: null,
    publicReady: false,
    reviewStatus: 'model_outputs_require_independent_source_review',
    scoreReason: 'Source-specific modeled burden is an endpoint input, not a calibrated whole-node rating.',
    reasons: [],
  };
}
