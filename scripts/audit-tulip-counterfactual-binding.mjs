import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { SOURCE_NATIVE_BURDEN_VERSION, evaluateAttributableDalyEndpoint } from '../src/tulip-source-native-burden.js';
import { REGISTERED_DALY_OBSERVATIONS, REGISTERED_COUNTERFACTUAL_DEFINITIONS,
  WHO_JOINT_AIR_COUNTERFACTUAL_ARTIFACT_SHA256 } from '../src/tulip-source-observation-registry.js';

const directory = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const beforeBytes = readFileSync(new URL('counterfactual-binding-v3-challenge.json', directory));
const before = JSON.parse(beforeBytes);
assert.equal(before.readings.length, 3);
assert(before.readings.every(row => row.result.status === 'source_bound_endpoint'));
const definitionBytes = readFileSync(new URL('who-joint-air-counterfactual-definition.json', directory));
assert.equal(createHash('sha256').update(definitionBytes).digest('hex'), WHO_JOINT_AIR_COUNTERFACTUAL_ARTIFACT_SHA256);
const sourceId = 'who_world_health_statistics_2026_joint_air_2021';
const source = REGISTERED_DALY_OBSERVATIONS[sourceId];
const scopeKeys = ['endpointId', 'affectedGroup', 'geography', 'assessmentPeriod', 'includedCauses',
  'reportingPeriodBasis', 'counterfactualId', 'counterfactualVersion', 'counterfactualArtifactSha256'];
const packet = {
  methodVersion: SOURCE_NATIVE_BURDEN_VERSION, nodeId: 'air_pollution_health_burden',
  nodeKind: 'issue', domain: 'human', outcomeKind: source.outcomeKind, coverage: 'endpoint_only',
  ...Object.fromEntries(scopeKeys.map(key => [key, source[key]])), sourceId,
  sourceObservation: structuredClone(source),
  overlapReview: 'Joint endpoint once; do not add its fatal or constituent pollutant estimates.',
};
const corrected = evaluateAttributableDalyEndpoint(packet);
assert.equal(corrected.status, 'source_bound_endpoint');
assert.deepEqual(corrected.burden, before.readings[0].result.burden);
assert.equal(corrected.counterfactual.definition, REGISTERED_COUNTERFACTUAL_DEFINITIONS[source.counterfactualId].definition);
const challenges = before.readings.map(row => {
  const result = evaluateAttributableDalyEndpoint({ ...packet, counterfactual: row.counterfactual });
  assert.equal(result.status, 'needs_source_native_endpoint');
  assert(result.reasons.includes('packet_counterfactual_description_forbidden'));
  return { attemptedDescription: row.counterfactual, status: result.status, reasons: result.reasons };
});
const newIdentity = structuredClone(packet);
newIdentity.counterfactualId = newIdentity.sourceObservation.counterfactualId = 'preindustrial_conditions';
const changedIdentity = evaluateAttributableDalyEndpoint(newIdentity);
assert.equal(changedIdentity.status, 'needs_source_native_endpoint');
assert(changedIdentity.reasons.includes('candidate_source_row_differs_from_registry'));
const audit = {
  version: 'tulip_counterfactual_binding_audit_2026_09_27_v1',
  status: 'source_identity_gap_corrected_not_whole_method_approval',
  beforeModuleVersion: before.moduleVersion, afterModuleVersion: SOURCE_NATIVE_BURDEN_VERSION,
  beforeArtifactSha256: createHash('sha256').update(beforeBytes).digest('hex'),
  sourceDefinition: corrected.counterfactual,
  sourceDefinitionArtifactSha256: WHO_JOINT_AIR_COUNTERFACTUAL_ARTIFACT_SHA256,
  burdenBefore: before.readings[0].result.burden, burdenAfter: corrected.burden,
  rejectedDescriptions: challenges,
  simultaneouslyChangedPacketAndCopiedSource: { status: changedIdentity.status, reasons: changedIdentity.reasons },
  remainingLimit: 'The source comparison identity is preserved. Numeric reference-exposure parameters and the full WHO model have not been reproduced; calibration and complete node admission remain unfinished.',
  publicScoresChanged: false, replacementAdmitted: false,
};
writeFileSync(new URL('counterfactual-binding-audit.json', directory), JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify({ status: audit.status, preservedBurden: true,
  rejectedDescriptionOverrides: challenges.length, rejectedSimultaneousRelabeling: true,
  publicScoresChanged: false, replacementAdmitted: false }, null, 2));
