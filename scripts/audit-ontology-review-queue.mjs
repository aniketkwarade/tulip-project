import fs from 'node:fs/promises';

import { NODES, NONCAUSAL_GENERATED_METRIC_BINDINGS } from '../src/data.js';
import { ONTOLOGY_REVIEW_DECISIONS } from '../src/ontology-review-decisions.js';

const backlog = JSON.parse(await fs.readFile('public/research-backlog.json', 'utf8'));
const registry = JSON.parse(await fs.readFile('public/ontology-review-queue.json', 'utf8'));
const expectedIds = new Set(backlog.nodes
  .filter(node => node.status === 'open' && node.action === 'normalize_or_merge_generated_label')
  .map(node => node.id));
const actualIds = new Set(registry.nodes.map(node => node.id));
const liveIds = new Set(NODES.map(node => node.id));
const failures = [];
if (registry.candidate_scope?.mode !== 'all_threshold_matches') failures.push({ code: 'ontology_candidate_scope_not_exhaustive' });
if (registry.candidate_scope?.maximum_candidates_per_record !== null) failures.push({ code: 'ontology_candidate_limit_present' });

for (const id of expectedIds) if (!actualIds.has(id)) failures.push({ code: 'ontology_record_missing', id });
for (const id of actualIds) if (!expectedIds.has(id)) failures.push({ code: 'unexpected_ontology_record', id });
if (actualIds.size !== registry.nodes.length) failures.push({ code: 'duplicate_ontology_record' });
for (const node of registry.nodes) {
  if (node.review_status !== 'pending_manual_evidence_review') failures.push({ code: 'invalid_review_status', id: node.id });
  if (!node.review_path || !Array.isArray(node.required_decision_fields) || node.required_decision_fields.length !== 6) failures.push({ code: 'incomplete_review_contract', id: node.id });
  if (node.canonical_overlap_decision) {
    const decision = node.canonical_overlap_decision;
    if (decision.disposition !== 'distinct_scope_keep_exact_term_research' || node.review_path !== 'exact_term_research_before_relationship_work') failures.push({ code: 'invalid_distinct_scope_decision', id: node.id });
    if (!decision.rationale || !decision.reviewed_at || !Array.isArray(decision.source_locators) || decision.source_locators.length < 2 || decision.source_locators.some(item => !item.url || !item.locator)) failures.push({ code: 'incomplete_distinct_scope_evidence', id: node.id });
  }
  for (const candidate of node.candidates || []) {
    if (candidate.id === node.id) failures.push({ code: 'self_merge_candidate', id: node.id });
    if (!liveIds.has(candidate.id)) failures.push({ code: 'missing_merge_candidate', id: node.id, candidate_id: candidate.id });
    if (!(candidate.similarity_score >= 0 && candidate.similarity_score <= 1)) failures.push({ code: 'invalid_similarity_score', id: node.id, candidate_id: candidate.id });
  }
}
const reviewedDistinctDecisions = Object.entries(ONTOLOGY_REVIEW_DECISIONS).filter(([, decision]) => decision.disposition === 'distinct_scope_keep_exact_term_research');
const reviewedMergeDecisions = Object.entries(ONTOLOGY_REVIEW_DECISIONS).filter(([, decision]) => decision.disposition === 'merge_preserve_search_alias');
for (const [id] of reviewedDistinctDecisions) {
  const record = registry.nodes.find(node => node.id === id);
  if (!record?.canonical_overlap_decision) failures.push({ code: 'reviewed_ontology_decision_missing', id });
}
for (const [id, decision] of reviewedMergeDecisions) {
  const record = (registry.resolved_merges || []).find(item => item.alias_id === id);
  if (!record) failures.push({ code: 'reviewed_merge_decision_missing', id });
  if (liveIds.has(id)) failures.push({ code: 'reviewed_merge_alias_retained_as_node', id });
  if (record?.reviewed_decision?.disposition !== decision.disposition || !record?.reviewed_decision?.rationale || !record?.reviewed_decision?.reviewed_at || !Array.isArray(record?.reviewed_decision?.source_locators) || record.reviewed_decision.source_locators.length < 2) failures.push({ code: 'incomplete_reviewed_merge_evidence', id });
  if (!NODES.some(node => node.id === record?.canonical_id && node.semanticAliases?.some(alias => alias.id === id))) failures.push({ code: 'reviewed_merge_alias_not_searchable', id, canonical_id: record?.canonical_id });
}
if (registry.summary?.reviewed_distinct_scope_decisions !== reviewedDistinctDecisions.length) failures.push({ code: 'reviewed_distinct_scope_summary_mismatch' });
if (registry.summary?.reviewed_merge_decisions !== reviewedMergeDecisions.length) failures.push({ code: 'reviewed_merge_summary_mismatch' });
if (registry.summary?.pending_label_reviews !== expectedIds.size) failures.push({ code: 'ontology_summary_mismatch' });
const resolvedMetricIds = new Set(Object.keys(registry.resolved_metric_aliases || {}));
for (const [id, binding] of Object.entries(NONCAUSAL_GENERATED_METRIC_BINDINGS)) {
  if (!resolvedMetricIds.has(id)) failures.push({ code: 'resolved_metric_alias_missing', id });
  if (liveIds.has(id)) failures.push({ code: 'resolved_metric_alias_retained_as_node', id });
  const researchOnly = binding.binding_type === 'research_track_metric_without_canonical_node';
  const canonical = NODES.find(node => node.id === binding.canonical_node_id);
  if (researchOnly && binding.canonical_node_id !== null) failures.push({ code: 'research_track_metric_has_canonical_node', id, canonical_id: binding.canonical_node_id });
  if (!researchOnly && (!canonical || !canonical.metricAliases?.some(alias => alias.id === id))) failures.push({ code: 'resolved_metric_alias_not_searchable', id, canonical_id: binding.canonical_node_id });
}
if (resolvedMetricIds.size !== Object.keys(NONCAUSAL_GENERATED_METRIC_BINDINGS).length) failures.push({ code: 'resolved_metric_alias_summary_mismatch' });

console.log(JSON.stringify({ expected_records: expectedIds.size, registered_records: actualIds.size, failures }, null, 2));
if (failures.length) process.exitCode = 1;
