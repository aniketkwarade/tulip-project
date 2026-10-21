import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { ECOSYSTEM_EXTENT_VERSION, evaluateForestConversionExtent } from '../src/tulip-ecosystem-extent-experiment.js';
import { FAO_FOREST_EXTENT_2025_ARTIFACT_SHA256,
  REGISTERED_ECOSYSTEM_EXTENT_OBSERVATIONS } from '../src/tulip-source-observation-registry.js';

const faoArtifactBytes = readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/fao-fra-2025-global-deforestation-extent.json', import.meta.url));
assert.equal(createHash('sha256').update(faoArtifactBytes).digest('hex'), FAO_FOREST_EXTENT_2025_ARTIFACT_SHA256);
const fao = JSON.parse(faoArtifactBytes);
const input = {
  methodVersion: ECOSYSTEM_EXTENT_VERSION,
  nodeId: 'deforestation', nodeKind: 'issue', domain: 'ecosystem', coverage: 'endpoint_only',
  ...fao.scope,
  counterfactual: 'The converted area remains forest under the FRA land-use definition.',
  overlapReview: 'Do not substitute net forest loss or add the same converted area again as fragmentation or tree-cover loss.',
  sourceId: fao.sourceId,
  sourceObservation: {
    sourceId: fao.sourceId, sourceUrl: fao.sourceUrl, ...fao.scope,
    ...fao.grossDeforestationRate, reportedResolution: fao.grossDeforestationRate.reportedResolution,
    uncertaintyInterval: null,
  },
};
const result = evaluateForestConversionExtent(input);
assert.equal(result.status, 'source_bound_extent_observation');
assert.equal(result.score, null);
assert.equal(result.rate.value, 10_900_000);
assert.equal(result.period.elapsedYears, 10);
assert.equal(result.rate.uncertaintyInterval, null);
assert.equal(result.source.version, fao.version);
assert.equal(result.source.artifactSha256, FAO_FOREST_EXTENT_2025_ARTIFACT_SHA256);
assert.equal(REGISTERED_ECOSYSTEM_EXTENT_OBSERVATIONS[fao.sourceId].value, result.rate.value);
const reject = (mutate, reason) => {
  const variant = structuredClone(input);
  mutate(variant);
  const tested = evaluateForestConversionExtent(variant);
  assert.equal(tested.status, 'needs_source_native_extent');
  assert.equal(tested.score, null);
  assert(tested.reasons.includes(reason), `${reason}: ${tested.reasons.join(', ')}`);
};
reject(item => { item.sourceObservation.metricKind = 'net_forest_loss';
  item.sourceObservation.value = fao.separateContext.netForestLossRateHaPerYear; },
'gross_forest_conversion_endpoint_required');
reject(item => { item.sourceObservation.metricKind = 'tree_cover_loss'; },
  'gross_forest_conversion_endpoint_required');
reject(item => { item.periodStartYear = 2016; }, 'ten_elapsed_year_period_mismatch');
reject(item => { item.sourceObservation.unit = 'percent_of_forest'; },
  'source_rate_unit_value_or_resolution_invalid');
reject(item => { item.sourceObservation.reportedResolution = 1_000_000; },
  'source_rate_unit_value_or_resolution_invalid');
reject(item => { item.sourceObservation.uncertaintyInterval = { lower: 9_000_000, upper: 12_000_000 }; },
  'unsupported_interval_claim');
reject(item => { item.coverage = 'complete_node'; }, 'ecosystem_endpoint_only_required');
reject(item => { item.sourceObservation.value = 10_800_000; },
  'candidate_source_row_differs_from_registry');
reject(item => { item.sourceObservation.value = 10_800_000;
  item.sourceObservation.reportedResolution = 100_000; },
  'candidate_source_row_differs_from_registry');
reject(item => { item.sourceId = 'self_registered_new_row';
  item.sourceObservation.sourceId = item.sourceId; }, 'registered_source_row_required');
const futureNode = structuredClone(input);
futureNode.nodeId = 'synthetic_future_forest_conversion_node';
assert.deepEqual(evaluateForestConversionExtent(futureNode).rate, result.rate);
assert.deepEqual(evaluateForestConversionExtent(input), result);
console.log(JSON.stringify({ status: 'passed', sourceRateHaPerYear: result.rate.value,
  period: result.period, rejectedMismatches: 10, unchangedWithAdditionalNode: true,
  scoreAssigned: false }, null, 2));
