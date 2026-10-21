import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  mapDalyBurdenWithFixedAnchors,
  validateAbsoluteBurdenAnchors,
} from '../src/tulip-burden-scale-experiment.js';
import {
  SOURCE_NATIVE_BURDEN_VERSION,
  evaluateAttributableDalyEndpoint,
} from '../src/tulip-source-native-burden.js';
import { REGISTERED_DALY_OBSERVATIONS } from '../src/tulip-source-observation-registry.js';

const who = JSON.parse(readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-pollution-dalys-2021-report.json', import.meta.url)));
const registered = REGISTERED_DALY_OBSERVATIONS.who_world_health_statistics_2026_joint_air_2021;
const scope = {
  endpointId: 'who_joint_air_pollution_attributable_dalys',
  affectedGroup: 'global_population_with_attributable_health_loss',
  geography: 'global', assessmentPeriod: String(who.scope.year), includedCauses: who.scope.cause,
  reportingPeriodBasis: who.scope.reportingPeriodBasis,
  counterfactualId: registered.counterfactualId,
  counterfactualVersion: registered.counterfactualVersion,
  counterfactualArtifactSha256: registered.counterfactualArtifactSha256,
};
const assessment = {
  methodVersion: SOURCE_NATIVE_BURDEN_VERSION,
  nodeId: 'air_pollution_health_burden', nodeKind: 'issue', domain: 'human',
  outcomeKind: 'attributable_dalys', coverage: 'endpoint_only', ...scope,
  overlapReview: 'Use joint ambient-and-household DALYs once.', sourceId: 'who_world_health_statistics_2026_joint_air_2021',
  sourceObservation: { sourceId: 'who_world_health_statistics_2026_joint_air_2021', sourceUrl: who.sourceUrl,
    ...scope, outcomeKind: 'attributable_dalys', unit: 'DALY', normalization: 'absolute_total',
    reportedResolutionDalys: who.modeledDalys.reportedResolutionDalys,
    lower: who.modeledDalys.lower95, central: who.modeledDalys.central, upper: who.modeledDalys.upper95 },
};
const endpoint = evaluateAttributableDalyEndpoint(assessment);
assert.equal(endpoint.status, 'source_bound_endpoint');
const illustrativeAnchors = {
  version: 'synthetic_daly_anchors_test_only', domain: 'human', outcomeKind: 'attributable_dalys',
  reportingPeriodBasis: 'single_calendar_year_estimate',
  unit: 'DALY', basis: 'fixed_absolute_burden',
  points: [[1, 0], [3, 100], [5, 10_000], [7, 1_000_000], [9, 100_000_000], [10, 10_000_000_000]]
    .map(([score, burden]) => ({ score, burden })),
};
assert.deepEqual(validateAbsoluteBurdenAnchors(illustrativeAnchors), []);
const result = mapDalyBurdenWithFixedAnchors(endpoint, illustrativeAnchors);
assert.equal(result.status, 'experimental_candidate');
assert.equal(result.publicReady, false);
assert(result.interval.lower <= result.value && result.value <= result.interval.upper);
const futureNode = structuredClone(endpoint);
futureNode.nodeId = 'synthetic_future_health_node';
const futureResult = mapDalyBurdenWithFixedAnchors(futureNode, illustrativeAnchors);
assert.equal(futureResult.value, result.value);
assert.deepEqual(futureResult.interval, result.interval);
assert.deepEqual(mapDalyBurdenWithFixedAnchors(endpoint, illustrativeAnchors), result);
const stress = dalys => mapDalyBurdenWithFixedAnchors({ ...endpoint,
  burden: { lower: dalys, central: dalys, upper: dalys } }, illustrativeAnchors).value;
assert(stress(1_000_000_000) > stress(100_000_000));
assert(stress(40_000_000) > stress(10_000_000));
assert(stress(0) < stress(100));
const percentileAnchors = { ...illustrativeAnchors, basis: 'current_catalogue_percentiles' };
assert(validateAbsoluteBurdenAnchors(percentileAnchors).includes('catalogue_relative_anchors_forbidden'));
const wrongUnit = { ...illustrativeAnchors, unit: 'deaths' };
assert(mapDalyBurdenWithFixedAnchors(endpoint, wrongUnit).reasons.includes('anchor_outcome_or_unit_mismatch'));
const wrongPeriodBasis = { ...illustrativeAnchors, reportingPeriodBasis: 'ten_year_cumulative' };
assert(mapDalyBurdenWithFixedAnchors(endpoint, wrongPeriodBasis).reasons.includes('anchor_reporting_period_basis_mismatch'));
const unordered = structuredClone(illustrativeAnchors);
unordered.points[4].burden = unordered.points[3].burden;
assert(validateAbsoluteBurdenAnchors(unordered).includes('anchor_order_or_values_invalid'));
console.log(JSON.stringify({ status: 'passed', mapIsExperimental: true,
  catalogueAdditionPreservesScore: true, magnitudeStressSeparates: true,
  sourceIntervalMonotone: true, cataloguePercentilesRejected: true }, null, 2));
