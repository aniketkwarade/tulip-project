import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { BURDEN_CONVERSION_VERSION, createModeledDalyAllocationExperiment,
  evaluateModeledDalyAllocation, modeledAllocationDefinitionKey } from '../src/tulip-burden-conversion-experiment.js';

const directory = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const sourceBytes = readFileSync(new URL('synthetic-modeled-allocation-fixture.json', directory));
const row = { ...JSON.parse(sourceBytes), artifactSha256: createHash('sha256').update(sourceBytes).digest('hex') };
const beforeBytes = readFileSync(new URL('modeled-allocation-v1-challenge.json', directory));
const before = JSON.parse(beforeBytes);
assert.equal(row.synthetic, true);
assert.equal(before.cases.length, 4);
assert(before.cases.every(item => item.result.status === 'modeled_endpoint_candidate'));
const engine = createModeledDalyAllocationExperiment({ allocations: { [row.id]: row } });
const packet = {
  methodVersion: BURDEN_CONVERSION_VERSION, nodeId: row.nodeIds[0], parentEndpointId: row.parentEndpointId,
  allocationReference: { observationId: row.id, sourceVersion: row.sourceVersion,
    artifactSha256: row.artifactSha256, modelVersion: row.modelVersion,
    definitionKey: modeledAllocationDefinitionKey(row) },
};
const corrected = engine.calculate(packet);
assert.equal(corrected.status, 'modeled_endpoint_candidate');
assert.deepEqual(corrected.burden, before.cases[0].result.burden);
const attempts = before.cases.map(item => {
  const result = engine.calculate({ ...item.input, methodVersion: BURDEN_CONVERSION_VERSION });
  assert.equal(result.status, 'needs_consequence_conversion');
  assert(result.reasons.includes('packet_allocation_or_parent_overrides_forbidden'));
  return { id: item.id, beforeCentral: item.result.burden.central,
    afterBurden: result.burden, afterStatus: result.status, reasons: result.reasons };
});
const withoutRegistry = evaluateModeledDalyAllocation(packet);
assert.equal(withoutRegistry.burden, null);
assert(withoutRegistry.reasons.includes('registered_model_allocation_required'));
const output = {
  version: 'tulip_modeled_allocation_binding_audit_2026_09_27_v1',
  status: 'input_integrity_gap_corrected_not_causal_model_approval',
  beforeModuleVersion: before.moduleVersion, afterModuleVersion: BURDEN_CONVERSION_VERSION,
  beforeArtifactSha256: createHash('sha256').update(beforeBytes).digest('hex'),
  syntheticFixtureArtifactSha256: row.artifactSha256, synthetic: true,
  parentSourceId: row.parentSourceId, parentSourceArtifactSha256: row.parentSourceArtifactSha256,
  registeredFixtureReading: corrected, rejectedCallerOverrides: attempts,
  defaultRegistryResult: withoutRegistry, realRegisteredAllocations: 0,
  scientificLimit: 'The fractions and paired cases are invented mechanical fixtures. No real source-specific causal allocation, analogue transfer or whole-node score is approved. Input integrity cannot establish causal validity.',
  publicScoresChanged: false, numericalWholeNodeAdmissions: 0,
};
writeFileSync(new URL('modeled-allocation-binding-audit.json', directory), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: output.status, rejectedCallerOverrides: attempts.length,
  unchangedSyntheticBurden: true, realRegisteredAllocations: 0,
  publicScoresChanged: false, numericalWholeNodeAdmissions: 0 }, null, 2));
