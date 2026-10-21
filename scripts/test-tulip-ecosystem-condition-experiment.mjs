import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ECOSYSTEM_CONDITION_VERSION,
  evaluateEcosystemConditionObservation } from '../src/tulip-ecosystem-condition-experiment.js';
import { GCRMN_CORAL_CONDITION_2025_ARTIFACT_SHA256,
  REGISTERED_ECOSYSTEM_CONDITION_OBSERVATIONS } from '../src/tulip-source-observation-registry.js';

const artifactBytes = readFileSync(new URL('../artifacts/tulip-calibration-2026-09-22/coral-bleaching-reference-snapshot.json', import.meta.url));
assert.equal(createHash('sha256').update(artifactBytes).digest('hex'), GCRMN_CORAL_CONDITION_2025_ARTIFACT_SHA256);
const snapshot = JSON.parse(artifactBytes);
const row = REGISTERED_ECOSYSTEM_CONDITION_OBSERVATIONS.gcrmn_global_hard_coral_cover_2025;
assert.equal(row.referenceCoverPct, snapshot.endpoints.globalHardCoralCondition.referencePeriod.meanModelledCoverPct);
assert.equal(row.currentCoverPct, snapshot.endpoints.globalHardCoralCondition.currentPeriod.meanModelledCoverPct);
const input = {
  methodVersion: ECOSYSTEM_CONDITION_VERSION,
  nodeId: 'coral_bleaching', nodeKind: 'issue', domain: 'ecosystem', coverage: 'endpoint_only',
  attributionStatus: 'not_established_for_node',
  overlapReview: 'Do not add heat-stress exposure or count this global trend again as node-attributable loss.',
  sourceId: row.sourceId,
  geography: row.geography, ecosystemType: row.ecosystemType,
  outcomeKind: row.outcomeKind, unit: row.unit,
  reportingPeriodBasis: row.reportingPeriodBasis,
  referenceStartYear: row.referenceStartYear, referenceEndYear: row.referenceEndYear,
  currentStartYear: row.currentStartYear, currentEndYear: row.currentEndYear,
  sourceObservation: {
    sourceId: row.sourceId, sourceUrl: row.sourceUrl,
    geography: row.geography, ecosystemType: row.ecosystemType,
    outcomeKind: row.outcomeKind, unit: row.unit,
    reportingPeriodBasis: row.reportingPeriodBasis,
    referenceStartYear: row.referenceStartYear, referenceEndYear: row.referenceEndYear,
    currentStartYear: row.currentStartYear, currentEndYear: row.currentEndYear,
    referenceCoverPct: row.referenceCoverPct, currentCoverPct: row.currentCoverPct,
    periodMeanUncertaintyInterval: null,
  },
};
const result = evaluateEcosystemConditionObservation(input);
assert.equal(result.status, 'source_bound_condition_observation');
assert.equal(result.relativeCoverChangePct, -9.461816);
assert.equal(result.score, null);
assert.equal(result.attributionStatus, 'not_established_for_node');
assert.equal(result.periodMeanUncertaintyInterval, null);
assert.equal(result.source.artifactSha256, GCRMN_CORAL_CONDITION_2025_ARTIFACT_SHA256);
const reject = (mutate, reason) => {
  const variant = structuredClone(input);
  mutate(variant);
  const tested = evaluateEcosystemConditionObservation(variant);
  assert.equal(tested.status, 'needs_source_native_condition');
  assert.equal(tested.score, null);
  assert(tested.reasons.includes(reason), `${reason}: ${tested.reasons.join(', ')}`);
};
reject(item => { item.coverage = 'complete_node'; }, 'ecosystem_endpoint_only_required');
reject(item => { item.attributionStatus = 'attributed_to_coral_bleaching'; }, 'node_attribution_not_established');
reject(item => { item.geography = 'Great Barrier Reef'; }, 'geography_source_scope_mismatch');
reject(item => { item.currentStartYear = 2024; }, 'currentStartYear_source_period_mismatch');
reject(item => { item.sourceObservation.unit = 'hectares_lost'; }, 'hard_coral_condition_observation_required');
reject(item => { item.sourceObservation.outcomeKind = 'bleaching_heat_exposure'; }, 'hard_coral_condition_observation_required');
reject(item => { item.sourceObservation.currentCoverPct = 20; }, 'candidate_source_row_differs_from_registry');
reject(item => { item.sourceObservation.referenceCoverPct = 0; }, 'hard_coral_condition_observation_required');
reject(item => { item.sourceObservation.periodMeanUncertaintyInterval = { lower: 24.64, upper: 27.01 }; },
  'unsupported_period_mean_interval_claim');
reject(item => { item.sourceId = 'self_registered_coral_row';
  item.sourceObservation.sourceId = item.sourceId; }, 'registered_source_row_required');
const futureNode = structuredClone(input);
futureNode.nodeId = 'synthetic_future_reef_node';
assert.equal(evaluateEcosystemConditionObservation(futureNode).relativeCoverChangePct,
  result.relativeCoverChangePct);
assert.deepEqual(evaluateEcosystemConditionObservation(input), result);
console.log(JSON.stringify({ status: 'passed', relativeCoverChangePct: result.relativeCoverChangePct,
  rejectedMismatches: 10, unchangedWithAdditionalNode: true, scoreAssigned: false }, null, 2));
