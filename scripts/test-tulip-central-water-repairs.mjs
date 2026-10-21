import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { NODE_METRIC_CONTRACTS } from '../src/northstar-contracts.js';

const report = JSON.parse(readFileSync('artifacts/tulip-consequence-rule-audit-2026-09-27/central-water-source-repairs.json'));
for (const input of report.inputs) {
  assert.equal(createHash('sha256').update(readFileSync(input.path)).digest('hex'), input.sha256);
}
const sources = JSON.parse(readFileSync('public/tulip-source-registry.json'));
const operational = JSON.parse(readFileSync('public/tulip-operational-sources.json'));
const glacier = sources.sources.find(source => source.id === 'wmo_unesco_global_glacier_water_assessments');
assert.deepEqual(glacier, operational.sources.find(source => source.id === glacier.id));
const contract = NODE_METRIC_CONTRACTS.glacier_meltwater_dependency;
assert.equal(contract.source_id, glacier.id);
assert.equal(contract.observation_status, 'reference_context_only');
assert.deepEqual(glacier.platform_integration.measurement_ready_metric_ids, []);
assert(glacier.platform_integration.reference_only_metric_ids.includes(contract.metric_id));
const priorities = JSON.parse(readFileSync('public/priority-metric-operationalization-registry.json'));
assert.equal(new Set(priorities.bindings.map(binding => binding.metric_id)).size, priorities.bindings.length);
const binding = priorities.bindings.find(binding => binding.metric_id === contract.metric_id);
assert(binding);
assert.equal(binding.measurement_readiness, 'support_or_catalog_only');
const publicScores = JSON.parse(readFileSync('public/tulip-assessments.json'));
const ledger = JSON.parse(readFileSync('artifacts/tulip-consequence-rule-audit-2026-09-27/review-ledger.json'));
assert.equal(report.records.length, 2);
for (const record of report.records) {
  assert.equal(record.publicValueUnchanged, publicScores.records[record.nodeId].value);
  assert.equal(record.repair.central, null);
  assert.equal(record.repair.lower, null);
  assert.equal(record.repair.upper, null);
  assert.equal(record.repair.quantity, null);
  assert.equal(record.repair.zeroSubstitutionAllowed, false);
  assert.equal(record.publicReady, false);
  assert.equal(record.wholeNodeAdmitted, false);
  const entry = ledger.nodes.find(node => node.nodeId === record.nodeId);
  assert.equal(entry.conditionalGeometricValue, null);
  assert.deepEqual(entry.centralSourceRepairReview.repair, record.repair);
}
assert.equal(ledger.summary.explicitCentralSourceRepairReviews, 2);
assert.equal(report.sourceDataReproduction.actualCatchmentReclassification, false);
assert.equal(report.numericalReplacementNodesAdmitted, 0);
console.log('Passed: source/contract parity, reference-only readiness, unique ingestion metrics, both central rejection records and unchanged public ratings.');
