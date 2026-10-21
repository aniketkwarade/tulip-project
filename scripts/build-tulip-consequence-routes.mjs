import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { PUBLISHED_NODES } from '../src/data.js';
import { digestRouteDefinition, requireCatalogueConsequenceRoutes } from './lib/tulip-consequence-route-contract.mjs';

const root = new URL('../', import.meta.url);
const paths = {
  prior: 'artifacts/tulip-consequence-rule-audit-2026-09-27/route-coverage.json',
  decisions: 'docs/tulip-calibration/consequence-route-decisions-2026-09-28.json',
};
const read = path => JSON.parse(readFileSync(new URL(path, root)));
const hash = path => createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
const prior = read(paths.prior), decisions = read(paths.decisions);
const previous = new Map(prior.nodes.map(row => [row.nodeId, row]));
const authored = new Map(decisions.decisions.map(([nodeId, causalRole, indicatorRole, reason]) =>
  [nodeId, { causalRole, indicatorRole, reason }]));
assert.equal(authored.size, decisions.decisions.length, 'Duplicate authored node route.');
assert.deepEqual([...authored.keys()].sort(), prior.nodes.filter(row => row.causalRole === 'unclassified').map(row => row.nodeId).sort());
// This preparation intentionally cannot invent a route for a new node. Future
// authors must add a reviewed record and update the relevant evidence inventory.
assert.equal(PUBLISHED_NODES.length, 381);
let interpreted = 0, carried = 0, responses = 0;
const records = Object.fromEntries(PUBLISHED_NODES.map(node => {
  const response = node.node_kind === 'response';
  const existing = previous.get(node.id), decision = authored.get(node.id);
  assert(response || existing, `New node needs an authored research route: ${node.id}`);
  const role = response ? 'response_excluded' : decision?.causalRole ?? existing.causalRole;
  assert.notEqual(role, 'unclassified');
  if (response) responses++;
  else if (decision) interpreted++;
  else carried++;
  const provenance = response ? 'explicit_response_exclusion' : decision
    ? 'definition_and_metric_semantic_interpretation_2026_09_28'
    : 'prior_candidate_classification_carried_forward_not_new_scientific_review';
  return [node.id, {
    nodeId: node.id, name: node.name, nodeKind: response ? 'response' : 'issue',
    definitionDigest: digestRouteDefinition(node),
    definition: node.readerMeaning ?? node.description,
    boundMetric: { id: node.metric_contract.metric_id, name: node.metric_contract.metric_name,
      unit: node.metric_contract.unit, geography: node.metric_contract.geography,
      sourceId: node.metric_contract.source_id },
    causalRole: role, indicatorRole: response ? 'response_progress' : decision?.indicatorRole
      ?? 'existing_indicator_requires_typed_outcome_review',
    provenance, reason: response ? 'An intervention is excluded from danger scoring.'
      : decision?.reason ?? existing.routeRequirement,
    metricFailureRule: node.metric_contract.failure_behavior,
    requiredDomains: response ? [] : ['human', 'ecosystem'],
    requiredOutcomeInputs: response ? {} : {
      human: {
        health: 'Use attributable annual DALYs directly when accounting and node coverage are compatible. A death count requires supported years lost; an age-standardized rate is not an absolute total.',
        nonHealth: 'Use supported affected person-time and a fixed source-specific function-loss profile for material non-health losses, or justify their absence. Remove overlap with health.',
        doNotRequireForDalyMagnitude: ['a separate harmed-person count', 'an extra persistence multiplier', 'a fatal/nonfatal split solely for mapping a supported combined DALY total'],
      },
      ecosystem: {
        condition: 'Use a fixed ecosystem-specific profile with references and all six classes, matched attributable present-condition loss and non-overlapping allocated area.',
        notSubstitutes: ['physical anomaly', 'occurrence coverage', 'exposed area', 'historic conversion flow', 'unweighted stock counts'],
      },
      common: ['declared node boundary', 'compatible latest reporting period and geography', 'supported with/without-node causal comparison', 'source-bound units and observations', 'overlap accounting', 'source-supported uncertainty or an explicit absence of reported bounds'],
    },
    numericalAdmission: false,
  }];
}));
const report = {
  version: 'tulip_consequence_research_routes_2026_09_28_v1',
  status: 'explicit_research_routes_not_completed_consequence_assessments',
  inputs: Object.fromEntries(Object.values(paths).map(path => [path, hash(path)])),
  summary: { catalogueNodes: 381, issueNodes: 354, responseExclusions: responses,
    newlyInterpretedRoutes: interpreted, priorClassificationsCarriedForward: carried,
    unclassifiedRoutes: 0, completedReplacementRatings: 0 },
  records,
};
assert.equal(interpreted, 69); assert.equal(carried, 285); assert.equal(responses, 27);
requireCatalogueConsequenceRoutes(PUBLISHED_NODES, report);
writeFileSync(new URL('src/tulip-consequence-routes-v1.json', root), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
