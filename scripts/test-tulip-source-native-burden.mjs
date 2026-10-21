import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  SOURCE_NATIVE_BURDEN_VERSION,
  evaluateAttributableDalyEndpoint,
} from '../src/tulip-source-native-burden.js';
import { REGISTERED_DALY_OBSERVATIONS,
  REGISTERED_COUNTERFACTUAL_DEFINITIONS, WHO_JOINT_AIR_COUNTERFACTUAL_ARTIFACT_SHA256,
  WHO_JOINT_AIR_2021_ARTIFACT_SHA256 } from '../src/tulip-source-observation-registry.js';

const whoArtifactBytes = readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-pollution-dalys-2021-report.json', import.meta.url));
assert.equal(createHash('sha256').update(whoArtifactBytes).digest('hex'), WHO_JOINT_AIR_2021_ARTIFACT_SHA256);
const who = JSON.parse(whoArtifactBytes);
const registered = REGISTERED_DALY_OBSERVATIONS.who_world_health_statistics_2026_joint_air_2021;
const counterfactualBytes = readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-counterfactual-definition.json', import.meta.url));
assert.equal(createHash('sha256').update(counterfactualBytes).digest('hex'), WHO_JOINT_AIR_COUNTERFACTUAL_ARTIFACT_SHA256);
const counterfactual = JSON.parse(counterfactualBytes);
assert.equal(registered.counterfactualId, counterfactual.id);
assert.equal(REGISTERED_COUNTERFACTUAL_DEFINITIONS[counterfactual.id].definition, counterfactual.definition);
const scope = {
  endpointId: 'who_joint_air_pollution_attributable_dalys',
  affectedGroup: 'global_population_with_attributable_health_loss',
  geography: who.scope.geography,
  assessmentPeriod: String(who.scope.year),
  includedCauses: who.scope.cause,
  counterfactualId: registered.counterfactualId,
  counterfactualVersion: registered.counterfactualVersion,
  counterfactualArtifactSha256: registered.counterfactualArtifactSha256,
};
const assessment = {
  methodVersion: SOURCE_NATIVE_BURDEN_VERSION,
  nodeId: 'air_pollution_health_burden',
  nodeKind: 'issue',
  domain: 'human',
  outcomeKind: 'attributable_dalys',
  coverage: 'endpoint_only',
  reportingPeriodBasis: who.scope.reportingPeriodBasis,
  ...scope,
  overlapReview: 'Use the joint ambient-and-household endpoint once; do not add the separate death, ambient-only or household-only estimates.',
  sourceId: 'who_world_health_statistics_2026_joint_air_2021',
  sourceObservation: {
    sourceId: 'who_world_health_statistics_2026_joint_air_2021', sourceUrl: who.sourceUrl,
    ...scope, reportingPeriodBasis: who.scope.reportingPeriodBasis,
    reportedResolutionDalys: who.modeledDalys.reportedResolutionDalys,
    outcomeKind: 'attributable_dalys', unit: 'DALY',
    normalization: 'absolute_total',
    lower: who.modeledDalys.lower95, central: who.modeledDalys.central, upper: who.modeledDalys.upper95,
  },
};
const result = evaluateAttributableDalyEndpoint(assessment);
assert.equal(result.status, 'source_bound_endpoint');
assert.equal(result.score, null);
assert.deepEqual(result.burden, {
  lower: 142_000_000, central: 184_000_000, upper: 228_000_000,
});
assert.equal(result.period, '2021');
assert.equal(result.coverage, 'endpoint_only');
assert.equal(result.reportingPeriodBasis, 'single_calendar_year_estimate');
assert.equal(result.source.reportedResolutionDalys, 1_000_000);
const reject = (mutate, reason) => {
  const variant = structuredClone(assessment);
  mutate(variant);
  const tested = evaluateAttributableDalyEndpoint(variant);
  assert.equal(tested.status, 'needs_source_native_endpoint');
  assert.equal(tested.score, null);
  assert(tested.reasons.includes(reason), `${reason}: ${tested.reasons.join(', ')}`);
};
let counterfactualRejections = 0;
for (const description of ['Historical preindustrial atmospheric conditions.',
  'Complete elimination of every pollutant from the atmosphere.',
  'WHO comparative-risk-assessment reference exposure at minimum risk.']) {
  reject(item => { item.counterfactual = description; }, 'packet_counterfactual_description_forbidden');
  counterfactualRejections++;
}
for (const field of ['counterfactualId', 'counterfactualVersion', 'counterfactualArtifactSha256']) {
  reject(item => { item[field] = 'invented'; }, `${field}_source_scope_mismatch`);
  reject(item => { item.sourceObservation[field] = 'invented'; }, 'candidate_source_row_differs_from_registry');
  reject(item => { item[field] = 'invented'; item.sourceObservation[field] = 'invented'; }, 'candidate_source_row_differs_from_registry');
  reject(item => { delete item[field]; delete item.sourceObservation[field]; }, `${field}_missing`);
  counterfactualRejections += 4;
}
reject(item => { item.sourceObservation.counterfactual = 'A future scenario'; }, 'copied_counterfactual_description_forbidden');
counterfactualRejections++;
assert.deepEqual(result.counterfactual, {
  id: counterfactual.id, version: counterfactual.version, definition: counterfactual.definition,
  sourceUrl: counterfactual.sourceUrl, locator: counterfactual.locator,
  artifactSha256: WHO_JOINT_AIR_COUNTERFACTUAL_ARTIFACT_SHA256, identityReview: counterfactual.identityReview,
});
reject(item => { item.assessmentPeriod = '2026'; }, 'assessmentPeriod_source_scope_mismatch');
reject(item => { item.geography = 'Europe'; }, 'geography_source_scope_mismatch');
reject(item => { item.sourceObservation.unit = 'deaths'; }, 'source_outcome_or_unit_mismatch');
reject(item => { item.sourceObservation.normalization = 'age_standardized_rate'; }, 'source_outcome_or_unit_mismatch');
reject(item => { item.sourceObservation.lower = item.sourceObservation.central + 1; }, 'source_interval_invalid');
reject(item => { item.sourceObservation.sourceId = 'unrelated_source'; }, 'source_reference_missing_or_mismatched');
reject(item => { item.includedCauses = 'every possible cause'; }, 'includedCauses_source_scope_mismatch');
reject(item => { item.overlapReview = ''; }, 'overlap_review_missing');
reject(item => { item.coverage = 'complete_node'; }, 'endpoint_only_coverage_required');
reject(item => { item.reportingPeriodBasis = 'ten_year_cumulative'; }, 'single_year_reporting_basis_required');
reject(item => { item.sourceObservation.reportingPeriodBasis = 'ten_year_cumulative'; }, 'reporting_period_basis_source_scope_mismatch');
reject(item => { item.sourceObservation.reportedResolutionDalys = 0; }, 'source_value_resolution_missing');
reject(item => { item.sourceObservation.central = 184_500_000; }, 'source_value_resolution_mismatch');
reject(item => { item.assessmentPeriod = 'latest'; item.sourceObservation.assessmentPeriod = 'latest'; }, 'assessment_period_calendar_year_required');
reject(item => { item.sourceObservation.central = 185_000_000; }, 'candidate_source_row_differs_from_registry');
reject(item => { item.sourceId = 'self_registered_new_row'; item.sourceObservation.sourceId = item.sourceId; }, 'registered_source_row_required');
assert.equal(REGISTERED_DALY_OBSERVATIONS[assessment.sourceId].central, who.modeledDalys.central);
assert.equal(result.source.version, who.version);
assert.equal(result.source.locator, who.locator);
assert.equal(result.source.artifactSha256, WHO_JOINT_AIR_2021_ARTIFACT_SHA256);
assert.equal(result.publicReady, false);
const olderApi = JSON.parse(readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-pollution-dalys-row.json', import.meta.url)));
assert(olderApi.scope.year < Number(result.period));
const futureNode = structuredClone(assessment);
futureNode.nodeId = 'synthetic_future_joint_air_pollution_health_node';
assert.deepEqual(evaluateAttributableDalyEndpoint(futureNode).burden, result.burden);
assert.deepEqual(evaluateAttributableDalyEndpoint(assessment), result);
console.log(JSON.stringify({ status: 'passed', sourceYear: result.period, burden: result.burden,
  rejectedMismatches: 17 + counterfactualRejections, counterfactualRejections,
  sourceComparisonCaseRetained: true, newerThanMatchingApiRow: true,
  unchangedWithAdditionalNode: true, scoreAssigned: false }, null, 2));
