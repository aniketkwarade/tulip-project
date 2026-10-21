import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const candidatePath = 'artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json';
const ledgerPath = 'artifacts/tulip-consequence-rule-audit-2026-09-27/review-ledger.json';
const metricPath = 'public/node-metric-contracts.json';
const read = path => {
  const bytes = readFileSync(new URL(path, root));
  return { data: JSON.parse(bytes), sha256: createHash('sha256').update(bytes).digest('hex') };
};
const candidates = read(candidatePath);
const ledger = read(ledgerPath);
const metrics = read(metricPath);
const reviewById = new Map(ledger.data.nodes.map(node => [node.nodeId, node]));

const routeRequirement = {
  terminal_consequence: 'Verify a compatible attributable consequence for the node boundary, including harmed group, place, period, duration and overlap.',
  hazard_or_state: 'Model or observe terminal people and ecosystem consequences attributable to the condition; a physical anomaly or exposed population is insufficient.',
  aggregate_pressure: 'Specify a no-pressure counterfactual and trace the incremental pressure through a causal model to terminal consequences.',
  emission_source: 'Allocate source-specific emissions through atmospheric and impact models to terminal consequences; never copy an aggregate climate score.',
  unclassified: 'Resolve the node causal role before choosing a consequence model; do not infer it from the node name alone.',
};
const rows = candidates.data.issues.map(item => {
  const review = reviewById.get(item.nodeId);
  const binding = metrics.data.bindings[item.nodeId];
  const contract = metrics.data.contracts[item.nodeId];
  assert(review && binding && contract && binding.metric_id === contract.metric_id);
  const causalRole = item.candidate.causalAllocation?.role ?? 'unclassified';
  assert(routeRequirement[causalRole]);
  const domains = item.candidate.applicableDomains;
  return {
    nodeId: item.nodeId,
    name: item.name,
    causalRole,
    applicableDomains: domains,
    boundMetric: { id: binding.metric_id, name: contract.metric_name, unit: contract.unit },
    typedConsequenceEndpointsDefined: Object.values(review.domainReviews)
      .filter(domain => domain.proposedOutcome.endpointId !== null).length,
    typedConsequenceEndpointsRequired: domains.length,
    priority: review.priority,
    routeRequirement: routeRequirement[causalRole],
    existingSourceIds: [...new Set(Object.values(review.domainReviews).flatMap(domain => domain.sourceIds))],
  };
});
assert.equal(rows.length, 354);
const byCausalRole = Object.fromEntries(Object.keys(routeRequirement).map(role => [role, rows.filter(row => row.causalRole === role).length]));
const byDomain = {
  peopleAndNature: rows.filter(row => row.applicableDomains.length === 2).length,
  peopleOnly: rows.filter(row => row.applicableDomains.length === 1 && row.applicableDomains[0] === 'human').length,
  natureOnly: rows.filter(row => row.applicableDomains.length === 1 && row.applicableDomains[0] === 'ecosystem').length,
};
const summary = {
  issueNodes: rows.length,
  responseNodesOutsideDangerScoring: ledger.data.responses.length,
  existingMetricBindings: rows.filter(row => row.boundMetric.id).length,
  typedConsequenceEndpointsRequired: rows.reduce((sum, row) => sum + row.typedConsequenceEndpointsRequired, 0),
  typedConsequenceEndpointsDefined: rows.reduce((sum, row) => sum + row.typedConsequenceEndpointsDefined, 0),
  byCausalRole,
  byDomain,
};
assert.equal(summary.responseNodesOutsideDangerScoring, 27);
assert.equal(summary.existingMetricBindings, 354);
assert.equal(summary.typedConsequenceEndpointsRequired, 518);
assert.equal(summary.typedConsequenceEndpointsDefined, 0);
assert.equal(Object.values(byCausalRole).reduce((sum, count) => sum + count, 0), 354);
assert.equal(Object.values(byDomain).reduce((sum, count) => sum + count, 0), 354);
const report = {
  version: 'tulip_consequence_route_coverage_2026_09_27_v1',
  status: 'scoring_route_inventory_not_endpoint_validation',
  input: {
    [candidatePath]: candidates.sha256,
    [ledgerPath]: ledger.sha256,
    [metricPath]: metrics.sha256,
  },
  caveat: 'A metric binding is an observational/operational indicator, not necessarily a terminal harm measure. Causal-role labels are from the existing candidate registry, not newly inferred from names. Unclassified nodes remain unclassified.',
  summary,
  nodes: rows,
};
const output = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
writeFileSync(new URL('route-coverage.json', output), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
