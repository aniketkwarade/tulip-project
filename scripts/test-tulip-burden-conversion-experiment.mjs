import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { BURDEN_CONVERSION_VERSION, createModeledDalyAllocationExperiment,
  evaluateModeledDalyAllocation, modeledAllocationDefinitionKey } from '../src/tulip-burden-conversion-experiment.js';
import { REGISTERED_DALY_OBSERVATIONS } from '../src/tulip-source-observation-registry.js';

const bytes = readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/synthetic-modeled-allocation-fixture.json', import.meta.url));
const source = JSON.parse(bytes);
assert.equal(source.synthetic, true);
assert.equal(source.publicReady, false);
const allocation = { ...source, artifactSha256: createHash('sha256').update(bytes).digest('hex') };
const allocations = { [allocation.id]: allocation };
const engine = createModeledDalyAllocationExperiment({ allocations });
const parent = REGISTERED_DALY_OBSERVATIONS[allocation.parentSourceId];
const packet = {
  methodVersion: BURDEN_CONVERSION_VERSION, nodeId: allocation.nodeIds[0],
  parentEndpointId: allocation.parentEndpointId,
  allocationReference: { observationId: allocation.id, sourceVersion: allocation.sourceVersion,
    modelVersion: allocation.modelVersion, artifactSha256: allocation.artifactSha256,
    definitionKey: modeledAllocationDefinitionKey(allocation) },
};
const result = engine.calculate(packet);
assert.equal(result.status, 'modeled_endpoint_candidate');
assert.equal(result.score, null);
assert.equal(result.publicReady, false);
assert.equal(result.burden.central, parent.central * 0.02);
assert.deepEqual(result.burden, { lower: parent.lower * 0.01,
  central: parent.central * 0.02, upper: parent.upper * 0.03 });
assert.equal(result.counterfactual.id, allocation.counterfactualId);
assert.equal(result.counterfactual.parentCounterfactualId, parent.counterfactualId);
assert.equal(result.boundsMeaning, allocation.boundsMeaning);
assert.equal(result.rangeKind, 'registered_joint_model_cases_not_inferred_probability_interval');
assert.equal(result.evidenceStatus, 'synthetic_mechanics_fixture');
assert.equal(result.sources[1].artifactSha256, allocation.artifactSha256);
assert.equal(result.sources[0].artifactSha256, parent.sourceArtifactSha256);

let rejections = 0;
const rejectPacket = (mutate, reason) => {
  const variant = structuredClone(packet);
  mutate(variant);
  const tested = engine.calculate(variant);
  assert.equal(tested.status, 'needs_consequence_conversion');
  assert.equal(tested.burden, null);
  assert.equal(tested.score, null);
  assert.equal(tested.publicReady, false);
  assert(tested.reasons.includes(reason), `${reason}: ${tested.reasons.join(', ')}`);
  rejections++;
};
for (const field of ['allocationObservation', 'parentEndpoint', 'burden', 'counterfactual', 'weights']) {
  rejectPacket(item => { item[field] = {}; }, 'packet_allocation_or_parent_overrides_forbidden');
}
rejectPacket(item => { item.allocationReference.burdenFraction = 0.9; }, 'registered_allocation_reference_required');
rejectPacket(item => { item.allocationReference.sourceVersion = 'changed'; }, 'allocation_source_binding_changed');
rejectPacket(item => { item.allocationReference.artifactSha256 = '0'.repeat(64); }, 'allocation_source_binding_changed');
rejectPacket(item => { item.allocationReference.modelVersion = 'changed'; }, 'allocation_source_binding_changed');
rejectPacket(item => { item.allocationReference.definitionKey = 'changed'; }, 'registered_allocation_definition_changed');
rejectPacket(item => { item.allocationReference.observationId = 'unknown'; }, 'registered_model_allocation_required');
rejectPacket(item => { item.parentEndpointId = 'other_endpoint'; }, 'allocation_scope_mismatch');
rejectPacket(item => { item.nodeId = 'unreviewed_future_source'; }, 'allocation_node_binding_mismatch');
rejectPacket(item => { item.methodVersion = 'old'; }, 'method_version_mismatch');

const rejectRegistry = (mutate, reason) => {
  const changed = structuredClone(allocations);
  mutate(changed[allocation.id]);
  const variant = structuredClone(packet);
  variant.allocationReference.definitionKey = modeledAllocationDefinitionKey(changed[allocation.id]);
  const tested = createModeledDalyAllocationExperiment({ allocations: changed }).calculate(variant);
  assert.equal(tested.status, 'needs_consequence_conversion');
  assert(tested.reasons.includes(reason), `${reason}: ${tested.reasons.join(', ')}`);
  rejections++;
};
rejectRegistry(row => { row.kind = 'emissions_share'; }, 'modeled_harm_fraction_required');
rejectRegistry(row => { row.unit = 'fraction_of_emissions'; }, 'modeled_harm_fraction_required');
rejectRegistry(row => { row.assessmentPeriod = '2026'; }, 'allocation_scope_mismatch');
rejectRegistry(row => { row.reportingPeriodBasis = 'ten_year_cumulative'; }, 'allocation_reporting_period_basis_mismatch');
rejectRegistry(row => { row.geography = 'Europe'; }, 'allocation_scope_mismatch');
rejectRegistry(row => { row.jointCases.central.parentDalys += 1; }, 'parent_burden_not_source_bound');
rejectRegistry(row => { row.jointCases.central.burdenFraction = 1.01; }, 'joint_model_cases_missing_or_invalid');
rejectRegistry(row => { row.jointCases.central.evidenceReferences = [allocation.id]; }, 'joint_model_cases_missing_or_invalid');
rejectRegistry(row => { row.jointCases.lower.burdenFraction = 0.5; }, 'joint_burden_interval_out_of_order');
rejectRegistry(row => { row.parentSourceVersion = 'changed'; }, 'parent_source_binding_changed');
rejectRegistry(row => { row.parentSourceArtifactSha256 = '0'.repeat(64); }, 'parent_source_binding_changed');
for (const field of ['parentCounterfactualId', 'parentCounterfactualVersion', 'parentCounterfactualArtifactSha256']) {
  rejectRegistry(row => { row[field] = 'changed'; }, 'parent_counterfactual_binding_changed');
}
rejectRegistry(row => { row.parentSourceId = 'unknown'; }, 'registered_parent_dalys_required');
const staleDerivation = structuredClone(allocations);
for (const row of Object.values(staleDerivation[allocation.id].jointCases)) row.burdenFraction = 0.9;
const stale = createModeledDalyAllocationExperiment({ allocations: staleDerivation }).calculate(packet);
assert(stale.reasons.includes('registered_allocation_definition_changed'));
rejections++;

const futureNode = { ...packet, nodeId: allocation.nodeIds[1] };
assert.deepEqual(engine.calculate(futureNode).burden, result.burden);
const additional = { ...allocations, unrelated: { ...allocation, id: 'unrelated',
  nodeIds: ['unrelated_node'], sourceId: 'unrelated_source' } };
assert.deepEqual(createModeledDalyAllocationExperiment({ allocations: additional }).calculate(packet), result);
assert.deepEqual(createModeledDalyAllocationExperiment({ allocations: Object.fromEntries(Object.entries(additional).reverse()) }).calculate(packet), result);
const newBinding = structuredClone(allocations);
newBinding[allocation.id].nodeIds.push('new_equivalent_scope_case');
assert.deepEqual(createModeledDalyAllocationExperiment({ allocations: newBinding }).calculate(packet), result);
assert.deepEqual(engine.calculate(packet), result);
// A compiled source revision cannot change behind an existing calculation.
allocations[allocation.id].jointCases.central.burdenFraction = 0.9;
assert.deepEqual(engine.calculate(packet), result);
const copied = engine.describeAllocationRegistry();
copied[allocation.id].jointCases.central.burdenFraction = 0.9;
assert.deepEqual(engine.calculate(packet), result);
// Production/default registry has no validated source-specific model yet.
const defaultResult = evaluateModeledDalyAllocation(packet);
assert(defaultResult.reasons.includes('registered_model_allocation_required'));
assert.equal(defaultResult.burden, null);
const before = JSON.parse(readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/modeled-allocation-v1-challenge.json', import.meta.url)));
assert.equal(before.cases.length, 4);
assert(before.cases.every(row => row.result.status === 'modeled_endpoint_candidate'));
for (const row of before.cases) {
  const tested = engine.calculate({ ...row.input, methodVersion: BURDEN_CONVERSION_VERSION });
  assert.equal(tested.status, 'needs_consequence_conversion');
  assert(tested.reasons.includes('packet_allocation_or_parent_overrides_forbidden'));
  rejections++;
}
console.log(JSON.stringify({ status: 'passed', sourceSpecificBurdenIsSynthetic: true,
  rejectedMismatches: rejections, parentReconstructedFromRegistry: true,
  packetCannotChangeFractionsParentOrCounterfactual: true,
  catalogueAdditionPreservesResult: true, registeredDerivationCannotChangeSilently: true,
  defaultRegistryCannotManufactureModeledBurden: true, compiledInputsFrozen: true,
  publicReady: false, scoreAssigned: false }, null, 2));
