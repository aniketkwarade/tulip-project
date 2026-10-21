import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { mapDalyBurdenWithFixedAnchors, validateAbsoluteBurdenAnchors } from '../src/tulip-burden-scale-experiment.js';
import { SOURCE_NATIVE_BURDEN_VERSION, evaluateAttributableDalyEndpoint } from '../src/tulip-source-native-burden.js';
import { REGISTERED_DALY_OBSERVATIONS } from '../src/tulip-source-observation-registry.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const anchors = read('../docs/tulip-calibration/human-health-anchor-candidate.json');
const benchmarks = read('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-ghe2021-daly-benchmark-cases.json');
const whoAir = read('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-pollution-dalys-2021-report.json');
const registered = REGISTERED_DALY_OBSERVATIONS.who_world_health_statistics_2026_joint_air_2021;
assert.deepEqual(validateAbsoluteBurdenAnchors(anchors), []);
assert.equal(anchors.publicReady, false);
assert.equal(anchors.sourceWorkbookSha256, benchmarks.sourceWorkbookSha256);
const allCauses = benchmarks.cases.find(item => item.cause === 'All Causes');
assert.equal(anchors.points.at(-1).burden, allCauses.modeledDalys);
assert.equal(anchors.points.at(-1).sourceCell, `${allCauses.sheet}!${allCauses.cell}`);

const mapMagnitude = (value, points = anchors.points) => {
  assert(Number.isFinite(value) && value >= 0);
  if (value >= points.at(-1).burden) return 10;
  for (let index = 1; index < points.length; index++) {
    const high = points[index];
    if (value > high.burden) continue;
    const low = points[index - 1];
    return Math.round((low.score + (high.score - low.score)
      * (Math.log1p(value) - Math.log1p(low.burden))
      / (Math.log1p(high.burden) - Math.log1p(low.burden))) * 10) / 10;
  }
  throw new Error('Validated anchor interval not found');
};
for (const point of anchors.points) assert.equal(mapMagnitude(point.burden), point.score);
const mappedReferenceCases = benchmarks.cases.map(item => ({
  cause: item.cause, causeCode: item.causeCode, modeledDalys: item.modeledDalys,
  sourceCell: `${item.sheet}!${item.cell}`,
  illustrativeComponentValue: mapMagnitude(item.modeledDalys),
}));
for (let index = 1; index < mappedReferenceCases.length; index++) {
  assert(mappedReferenceCases[index].illustrativeComponentValue
    >= mappedReferenceCases[index - 1].illustrativeComponentValue);
}

// The air-pollution source row is a risk-attributable endpoint, not one of the
// GHE cause rows used as external magnitude references.
const scope = {
  endpointId: 'who_joint_air_pollution_attributable_dalys',
  affectedGroup: 'global_population_with_attributable_health_loss',
  geography: 'global', assessmentPeriod: String(whoAir.scope.year),
  includedCauses: whoAir.scope.cause,
  reportingPeriodBasis: whoAir.scope.reportingPeriodBasis,
  counterfactualId: registered.counterfactualId,
  counterfactualVersion: registered.counterfactualVersion,
  counterfactualArtifactSha256: registered.counterfactualArtifactSha256,
};
const assessment = {
  methodVersion: SOURCE_NATIVE_BURDEN_VERSION,
  nodeId: 'air_pollution_health_burden', nodeKind: 'issue', domain: 'human',
  outcomeKind: 'attributable_dalys', coverage: 'endpoint_only', ...scope,
  overlapReview: 'Use joint ambient-and-household modeled DALYs once.',
  sourceId: 'who_world_health_statistics_2026_joint_air_2021',
  sourceObservation: {
    sourceId: 'who_world_health_statistics_2026_joint_air_2021',
    sourceUrl: whoAir.sourceUrl, ...scope, outcomeKind: 'attributable_dalys',
    unit: 'DALY', normalization: 'absolute_total',
    reportedResolutionDalys: whoAir.modeledDalys.reportedResolutionDalys,
    lower: whoAir.modeledDalys.lower95, central: whoAir.modeledDalys.central,
    upper: whoAir.modeledDalys.upper95,
  },
};
const endpoint = evaluateAttributableDalyEndpoint(assessment);
assert.equal(endpoint.status, 'source_bound_endpoint');
const airCandidate = mapDalyBurdenWithFixedAnchors(endpoint, anchors);
assert.equal(airCandidate.status, 'experimental_candidate');
assert.equal(airCandidate.publicReady, false);
const newNodeSameEvidence = { ...endpoint, nodeId: 'future_node_same_annual_health_loss' };
assert.equal(mapDalyBurdenWithFixedAnchors(newNodeSameEvidence, anchors).value, airCandidate.value);
const policyAnchorSensitivity = [0.5, 2].map(multiplier => {
  const points = anchors.points.map((point, index) => ({ ...point,
    burden: index > 0 && index < anchors.points.length - 1
      ? point.burden * multiplier : point.burden }));
  assert.deepEqual(validateAbsoluteBurdenAnchors({ ...anchors, points }), []);
  const deltas = mappedReferenceCases.map(item => ({ cause: item.cause,
    scoreIfAllMiddleThresholdsScaled: mapMagnitude(item.modeledDalys, points),
    changeFromCandidate: Math.round((mapMagnitude(item.modeledDalys, points)
      - item.illustrativeComponentValue) * 10) / 10 }));
  return { multiplier, kind: 'policy_threshold_sensitivity_not_evidence_uncertainty',
    airEndpointComponent: mapMagnitude(endpoint.burden.central, points),
    largestAbsoluteReferenceCaseChange: Math.max(...deltas.map(item => Math.abs(item.changeFromCandidate))),
    referenceCases: deltas };
});
const result = {
  version: 'who_health_anchor_candidate_analysis_2026_09_27_v2',
  status: 'experimental_anchor_semantics_not_approved',
  anchorVersion: anchors.version,
  anchorPoints: anchors.points,
  sourceWorkbookSha256: benchmarks.sourceWorkbookSha256,
  mappedReferenceCases,
  policyAnchorSensitivity,
  airPollutionRiskEndpoint: {
    scope: '2021 global joint ambient-and-household particulate matter health DALYs only',
    modeledDalys: endpoint.burden,
    illustrativeHumanHealthComponent: airCandidate.value,
    illustrativeComponentInterval: airCandidate.interval,
    wholeNodeScore: null,
    sourceId: endpoint.source.id,
    counterfactual: endpoint.counterfactual,
  },
  invariants: {
    allAnchorValuesMapToNamedScores: true,
    referenceMagnitudesMonotone: true,
    unrelatedNodeAdditionPreservesValue: true,
    currentCatalogueDistributionUnused: true,
  },
  limitations: 'Reference-case mappings inspect the proposed fixed scale; they are not ratings of those diseases. The air-pollution value covers one health endpoint, not services, all air-pollution causes or the ecosystem component. WHO has not endorsed the TULIP anchors. Independent policy adjudication and held-out outcome review are still required.',
  publicReady: false,
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-health-anchor-candidate-analysis.json', import.meta.url),
  `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ status: result.status, referenceCases: mappedReferenceCases.length,
  airEndpointComponent: airCandidate.value, airEndpointInterval: airCandidate.interval,
  wholeNodeScore: null, publicReady: false }, null, 2));
