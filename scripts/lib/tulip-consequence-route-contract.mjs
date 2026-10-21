import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const ROUTE_ROLES = Object.freeze([
  'terminal_consequence', 'hazard_or_state', 'aggregate_pressure',
  'emission_source', 'response_excluded',
]);

export const digestRouteDefinition = node => createHash('sha256').update(JSON.stringify({
  nodeId: node.id,
  nodeKind: node.node_kind === 'response' ? 'response' : 'issue',
  definition: node.readerMeaning ?? node.description,
  metricContract: node.metric_contract,
})).digest('hex');

export function requireConsequenceRoute(node, registry) {
  assert(registry?.records && Object.hasOwn(registry.records, node.id),
    `Author an explicit consequence research route for published node ${node.id}; no generic route is supplied.`);
  const record = registry.records[node.id];
  assert.equal(record.nodeId, node.id);
  const kind = node.node_kind === 'response' ? 'response' : 'issue';
  assert.equal(record.nodeKind, kind, `Node kind changed: ${node.id}`);
  assert.equal(record.definitionDigest, digestRouteDefinition(node),
    `Review the changed definition or metric contract for ${node.id}; the previous research route is stale.`);
  assert(ROUTE_ROLES.includes(record.causalRole), `Unresolved research route: ${node.id}`);
  assert(record.provenance && record.reason && record.boundMetric?.id && record.boundMetric?.unit);
  assert.equal(record.numericalAdmission, false, 'Research-route coverage is not numerical calibration approval.');
  if (kind === 'response') {
    assert.equal(record.causalRole, 'response_excluded');
    assert.deepEqual(record.requiredDomains, []);
  } else {
    assert.notEqual(record.causalRole, 'response_excluded');
    assert.deepEqual(record.requiredDomains, ['human', 'ecosystem']);
    assert(record.requiredOutcomeInputs.human && record.requiredOutcomeInputs.ecosystem);
  }
  return record;
}

export function requireCatalogueConsequenceRoutes(nodes, registry) {
  assert.equal(new Set(nodes.map(node => node.id)).size, nodes.length, 'Duplicate published node ID.');
  assert.deepEqual(Object.keys(registry.records).sort(), nodes.map(node => node.id).sort(),
    'Published nodes and explicit research routes must have identical coverage.');
  return nodes.map(node => requireConsequenceRoute(node, registry));
}
