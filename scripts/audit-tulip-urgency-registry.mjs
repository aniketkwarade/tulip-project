import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NODES } from '../src/data.js';
import { getTulipUrgencyBand, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const OUTPUT = path.join(PUBLIC, 'tulip-urgency-score-audit.json');

async function readJson(filename) {
  return JSON.parse(await fs.readFile(path.join(PUBLIC, filename), 'utf8'));
}

function countBy(rows, key) {
  return Object.fromEntries([...rows.reduce((counts, row) => {
    const value = typeof key === 'function' ? key(row) : row[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  }, new Map())].sort(([left], [right]) => String(left).localeCompare(String(right))));
}

function round(value, digits = 1) {
  const scale = 10 ** digits;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(values) {
  return {
    minimum: Math.min(...values),
    median: round(median(values), 2),
    mean: round(values.reduce((sum, value) => sum + value, 0) / values.length, 2),
    maximum: Math.max(...values)
  };
}

const [registry, comparisonRegistry, sourceRegistry] = await Promise.all([
  readJson('tulip-urgency-scores.json'),
  readJson('tulip-urgency-rollout-comparison.json'),
  readJson('tulip-source-registry.json')
]);

const issueNodes = NODES.filter(node => node.node_kind !== 'response');
const responseNodes = NODES.filter(node => node.node_kind === 'response');
const nodeById = new Map(NODES.map(node => [node.id, node]));
const comparisonByNodeId = new Map(comparisonRegistry.comparison.map(row => [row.node_id, row]));
const receiptByNodeId = new Map(registry.receipts.map(receipt => [receipt.node_id, receipt]));
const graphIds = NODES.map(node => node.id);
const issueIds = issueNodes.map(node => node.id);
const responseIds = responseNodes.map(node => node.id);
const receiptIds = registry.receipts.map(receipt => receipt.node_id);
const registeredSourceIds = new Set(sourceRegistry.sources.map(source => source.id));
const unresolvedQuantitativeSourceIds = [...new Set(registry.receipts
  .filter(receipt => receipt.method !== 'modeled')
  .flatMap(receipt => receipt.source_ids ?? [])
  .filter(sourceId => !registeredSourceIds.has(sourceId)))].sort();

const duplicateGraphIds = graphIds.filter((id, index) => graphIds.indexOf(id) !== index);
const duplicateReceiptIds = receiptIds.filter((id, index) => receiptIds.indexOf(id) !== index);
const missingIssueIds = issueIds.filter(id => !receiptByNodeId.has(id));
const unexpectedReceiptIds = receiptIds.filter(id => !nodeById.has(id));
const responseReceiptIds = responseIds.filter(id => receiptByNodeId.has(id));
const excludedResponseMismatch = [
  ...responseIds.filter(id => !registry.excluded_response_node_ids.includes(id)),
  ...registry.excluded_response_node_ids.filter(id => !responseIds.includes(id))
];

const receiptVerifications = registry.receipts.map(receipt => ({
  node_id: receipt.node_id,
  ...verifyTulipUrgencyReceipt(receipt)
}));
const invalidReceiptIds = receiptVerifications.filter(result => !result.valid).map(result => result.node_id);

const methodLabels = Object.freeze({
  current_data: 'Empirical / current data',
  impact_fallback: 'Accumulated evidence',
  modeled: 'Modeled'
});

const scoreRows = issueNodes.map(node => {
  const receipt = receiptByNodeId.get(node.id);
  const comparison = comparisonByNodeId.get(node.id);
  const operationalBindings = receipt.raw_inputs?.operational_lineage ?? [];
  const sourceIds = [...new Set(receipt.source_ids ?? [])];
  return {
    node_id: node.id,
    node_name: node.name,
    sphere: node.sphere,
    evidence_class: methodLabels[receipt.method],
    method: receipt.method,
    score: receipt.value,
    band: receipt.band,
    as_of: receipt.as_of,
    model_version: receipt.model_version ?? null,
    visible_modeled_tag: receipt.method === 'modeled',
    operational_lineage: Boolean(comparison?.has_operational_lineage || operationalBindings.length),
    operational_binding_count: operationalBindings.length,
    source_metadata_count: sourceIds.length,
    source_ids: sourceIds,
    selected_method_reason: receipt.selection_reason?.selected_method_passed ?? null,
    higher_priority_failures: receipt.selection_reason?.higher_priority_failures ?? [],
    legacy_score: comparison?.legacy_score ?? null,
    score_delta: comparison?.score_delta ?? null,
    band_change: comparison?.band_change ?? null,
    v2_rank: comparison?.v2_rank ?? null,
    rank_change: comparison?.rank_change ?? null,
    sensitivity_max_delta: comparison?.sensitivity?.max_delta ?? null,
    input_hash: receipt.input_hash,
    receipt_valid: !invalidReceiptIds.includes(node.id)
  };
});

const responseRows = responseNodes.map(node => ({
  node_id: node.id,
  node_name: node.name,
  sphere: node.sphere,
  response_family: node.response_family ?? null,
  urgency_status: 'Excluded — response node',
  leverage_score: node.responseProfile?.overall ?? null,
  leverage_band: node.responseProfile?.band ?? null
}));

const methodCounts = countBy(scoreRows, 'method');
const operationalCounts = countBy(scoreRows, row => `${row.method}:${row.operational_lineage ? 'bound' : 'unbound'}`);
const bandCounts = countBy(scoreRows, 'band');
const modelVersionCounts = countBy(scoreRows.filter(row => row.method === 'modeled'), row => row.model_version ?? 'missing');
const sphereMethodCounts = [...scoreRows.reduce((groups, row) => {
  const current = groups.get(row.sphere) ?? { sphere: row.sphere, current_data: 0, impact_fallback: 0, modeled: 0, total: 0 };
  current[row.method] += 1;
  current.total += 1;
  groups.set(row.sphere, current);
  return groups;
}, new Map()).values()].sort((left, right) => right.total - left.total || left.sphere.localeCompare(right.sphere));

const methodSummary = ['current_data', 'impact_fallback', 'modeled'].map(method => {
  const rows = scoreRows.filter(row => row.method === method);
  return {
    method,
    evidence_class: methodLabels[method],
    node_count: rows.length,
    share_of_scored_issue_nodes: round(rows.length / scoreRows.length * 100, 2),
    share_of_all_graph_nodes: round(rows.length / NODES.length * 100, 2),
    score_minimum: Math.min(...rows.map(row => row.score)),
    score_median: round(median(rows.map(row => row.score)), 1),
    score_maximum: Math.max(...rows.map(row => row.score)),
    operationally_bound_nodes: rows.filter(row => row.operational_lineage).length
  };
});

const checks = [
  ['graph_node_ids_are_unique', duplicateGraphIds.length === 0, duplicateGraphIds],
  ['receipt_node_ids_are_unique', duplicateReceiptIds.length === 0, duplicateReceiptIds],
  ['every_issue_node_has_one_receipt', missingIssueIds.length === 0 && registry.receipts.length === issueNodes.length, missingIssueIds],
  ['no_unknown_nodes_have_receipts', unexpectedReceiptIds.length === 0, unexpectedReceiptIds],
  ['response_nodes_have_no_urgency_receipts', responseReceiptIds.length === 0, responseReceiptIds],
  ['response_exclusion_registry_matches_graph', excludedResponseMismatch.length === 0, excludedResponseMismatch],
  ['every_receipt_hash_and_score_reproduces', invalidReceiptIds.length === 0, invalidReceiptIds],
  ['registry_method_counts_recompute_exactly', JSON.stringify(methodCounts) === JSON.stringify(registry.method_counts), { expected: registry.method_counts, actual: methodCounts }],
  ['all_receipts_use_tulip_urgency_v2', registry.receipts.every(receipt => receipt.method_version === 'tulip_urgency_v2'), []],
  ['all_scores_map_to_their_stored_band', registry.receipts.every(receipt => getTulipUrgencyBand(receipt.value) === receipt.band), []],
  ['all_non_modeled_scores_name_quantitative_sources', registry.receipts.filter(receipt => receipt.method !== 'modeled').every(receipt => (receipt.source_ids ?? []).length > 0), []],
  ['all_non_modeled_source_ids_resolve_in_registry', unresolvedQuantitativeSourceIds.length === 0, unresolvedQuantitativeSourceIds],
  ['all_modeled_scores_require_the_visible_modeled_tag', scoreRows.filter(row => row.method === 'modeled').every(row => row.visible_modeled_tag), []],
  ['comparison_registry_covers_every_issue_node', comparisonRegistry.comparison.length === issueNodes.length && issueIds.every(id => comparisonByNodeId.has(id)), []]
].map(([check, passed, detail]) => ({ check, passed, detail }));

const failedChecks = checks.filter(check => !check.passed);
const nonModeledRows = scoreRows.filter(row => row.method !== 'modeled');
const operationalModeledRows = scoreRows.filter(row => row.method === 'modeled' && row.operational_lineage);
const sensitivityValues = scoreRows.map(row => row.sensitivity_max_delta).filter(Number.isFinite);
const generatedAt = new Date().toISOString();

const audit = {
  version: '1.0.0',
  audit_name: 'Complete TULIP Urgency Score Audit',
  generated_at: generatedAt,
  registry_generated_at: registry.generated_at,
  registry_status: registry.status,
  registry_method_version: registry.method_version,
  registry_model_version: registry.model_version,
  scope: {
    graph_nodes: NODES.length,
    scored_issue_nodes: issueNodes.length,
    excluded_response_nodes: responseNodes.length,
    accounting_check: issueNodes.length + responseNodes.length === NODES.length
  },
  definitions: {
    current_data: 'Empirical/current-data score: direct global observations pass the current-data coverage gate.',
    impact_fallback: 'Accumulated-evidence score: quantitative historical burden, inventory, assessment or administrative evidence passes the impact gate when current urgency cannot be measured reliably.',
    modeled: 'Modeled score: deterministic named fallback used only when neither higher evidence tier passes. Operational lineage may be retained as metadata without changing this classification.',
    response: 'Response nodes are not assigned TULIP urgency; they retain a separately named leverage score.'
  },
  totals: {
    method_counts: methodCounts,
    method_summary: methodSummary,
    band_counts: bandCounts,
    operational_lineage_counts: operationalCounts,
    operationally_bound_issue_nodes: scoreRows.filter(row => row.operational_lineage).length,
    modeled_with_operational_lineage: operationalModeledRows.length,
    model_version_counts: modelVersionCounts,
    score_distribution: summarize(scoreRows.map(row => row.score)),
    sensitivity_max_delta_distribution: summarize(sensitivityValues),
    band_changes_from_legacy: scoreRows.filter(row => row.band_change && row.band_change !== 'unchanged').length,
    non_modeled_quantitative_source_ids: [...new Set(nonModeledRows.flatMap(row => row.source_ids))].sort()
  },
  sphere_method_counts: sphereMethodCounts,
  validation: {
    overall_assessment: failedChecks.length ? 'Do not share' : 'Share with caveats',
    reproducibility_assessment: failedChecks.length ? 'Failed' : 'Passed',
    empirical_maturity_assessment: 'Low',
    checks_passed: checks.length - failedChecks.length,
    checks_total: checks.length,
    checks,
    caveats: [
      `${scoreRows.filter(row => row.method === 'modeled').length} of ${scoreRows.length} scored issue nodes (${round(scoreRows.filter(row => row.method === 'modeled').length / scoreRows.length * 100, 2)}%) remain modeled. The registry is complete and reproducible, but broad empirical validation is not yet complete.`,
      `${operationalModeledRows.length} modeled nodes have operational lineage. Their current bindings cover fewer than the full required scoring components, so the observations remain metadata rather than being promoted to evidence-backed urgency.`,
      `All ${scoreRows.filter(row => row.sensitivity_max_delta != null && row.sensitivity_max_delta <= 0.2).length} issue nodes with sensitivity results stay within 0.2 score points under the tested ±20% weight perturbations; dense tied scores still make rank order unstable.`,
      'A modeled score is a calibrated estimate, not an empirical observation. It must keep the visible Modeled tag until a higher tier passes its coverage gate.'
    ]
  },
  empirical_current_data_nodes: scoreRows.filter(row => row.method === 'current_data'),
  accumulated_evidence_nodes: scoreRows.filter(row => row.method === 'impact_fallback'),
  modeled_nodes: scoreRows.filter(row => row.method === 'modeled'),
  scored_issue_nodes: scoreRows,
  excluded_response_nodes: responseRows
};

if (failedChecks.length) {
  throw new Error(`TULIP urgency audit failed: ${failedChecks.map(check => check.check).join(', ')}`);
}

await fs.writeFile(OUTPUT, `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(ROOT, OUTPUT),
  graph_nodes: audit.scope.graph_nodes,
  scored_issue_nodes: audit.scope.scored_issue_nodes,
  excluded_response_nodes: audit.scope.excluded_response_nodes,
  method_counts: audit.totals.method_counts,
  operationally_bound_issue_nodes: audit.totals.operationally_bound_issue_nodes,
  modeled_with_operational_lineage: audit.totals.modeled_with_operational_lineage,
  validation: audit.validation.overall_assessment,
  checks: `${audit.validation.checks_passed}/${audit.validation.checks_total}`
}, null, 2));
