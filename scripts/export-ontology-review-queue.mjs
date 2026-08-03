import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES, PUBLISHED_NODES, NONCAUSAL_GENERATED_METRIC_BINDINGS } from '../src/data.js';
import { ONTOLOGY_REVIEW_DECISIONS } from '../src/ontology-review-decisions.js';

const backlog = JSON.parse(await fs.readFile('public/research-backlog.json', 'utf8'));
const targetRecords = backlog.nodes.filter(node => node.status === 'open' && node.action === 'normalize_or_merge_generated_label');
const nodeById = new Map(NODES.map(node => [node.id, node]));
const publishedIds = new Set(PUBLISHED_NODES.map(node => node.id));
const neighbors = new Map(NODES.map(node => [node.id, new Set()]));
for (const edge of EDGES) {
  neighbors.get(edge.source)?.add(edge.target);
  neighbors.get(edge.target)?.add(edge.source);
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'the', 'to', 'with',
  'area', 'areas', 'factor', 'hotspot', 'hotspots', 'index', 'layer', 'layers', 'rate', 'rates',
  'zone', 'zones'
]);

function stem(token) {
  return token
    .replace(/(izations|ization|ations|ation|ments|ment|ities|ity)$/u, '')
    .replace(/(ings|ing|ers|er|ies|es|s)$/u, '');
}

function tokens(value) {
  return new Set(String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim()
    .split(/\s+/u)
    .filter(token => token && !STOPWORDS.has(token))
    .map(stem)
    .filter(token => token.length > 2));
}

function overlapScore(left, right) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / Math.max(left.size, right.size);
}

function sourceSet(node) {
  return new Set(node?.calibration?.source_urls || []);
}

function sharedCount(left, right) {
  let count = 0;
  for (const value of left) if (right.has(value)) count += 1;
  return count;
}

function candidateScore(record, sourceNode, candidate) {
  const nameScore = overlapScore(tokens(record.display_name), tokens(candidate.name));
  const sourceOverlap = sharedCount(sourceSet(sourceNode), sourceSet(candidate));
  const neighborOverlap = sharedCount(neighbors.get(record.id) || new Set(), neighbors.get(candidate.id) || new Set());
  const sameSphere = record.sphere === candidate.sphere;
  const sharedAnchor = sourceNode?.calibration?.anchor_id && sourceNode.calibration.anchor_id === candidate.calibration?.anchor_id;
  const normalizedLeft = record.display_name.toLowerCase().replace(/[^a-z0-9]/gu, '');
  const normalizedRight = candidate.name.toLowerCase().replace(/[^a-z0-9]/gu, '');
  const containment = normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
  const score = Math.min(1,
    nameScore * 0.68
    + (sameSphere ? 0.07 : 0)
    + (sharedAnchor ? 0.12 : 0)
    + Math.min(0.08, sourceOverlap * 0.02)
    + Math.min(0.05, neighborOverlap * 0.025)
    + (containment ? 0.1 : 0)
  );
  const reasons = [];
  if (nameScore >= 0.5) reasons.push(`lexical_overlap:${nameScore.toFixed(2)}`);
  if (sameSphere) reasons.push('same_sphere');
  if (sharedAnchor) reasons.push('shared_inherited_anchor');
  if (sourceOverlap) reasons.push(`shared_sources:${sourceOverlap}`);
  if (neighborOverlap) reasons.push(`shared_neighbors:${neighborOverlap}`);
  if (containment) reasons.push('normalized_name_containment');
  return { score, reasons };
}

const reviewQueue = targetRecords.map(record => {
  const sourceNode = nodeById.get(record.id);
  const candidates = NODES
    .filter(candidate => candidate.id !== record.id)
    .filter(candidate => !candidate.id.startsWith('evidence_') && !candidate.id.startsWith('extension_'))
    .map(candidate => ({ candidate, ...candidateScore(record, sourceNode, candidate) }))
    .filter(item => item.score >= 0.24)
    .sort((left, right) => right.score - left.score
      || Number(publishedIds.has(right.candidate.id)) - Number(publishedIds.has(left.candidate.id))
      || left.candidate.name.localeCompare(right.candidate.name))
    .map(item => ({
      id: item.candidate.id,
      display_name: item.candidate.name,
      sphere: item.candidate.sphere,
      published: publishedIds.has(item.candidate.id),
      exact_label_validated: item.candidate.authenticity?.exact_label_validated === true,
      evidence_scope: item.candidate.authenticity?.source_scope || 'missing',
      similarity_score: Number(item.score.toFixed(3)),
      reasons: item.reasons
    }));
  const strongest = candidates[0] || null;
  const reviewedDecision = ONTOLOGY_REVIEW_DECISIONS[record.id] || null;
  const reviewPath = reviewedDecision?.disposition === 'distinct_scope_keep_exact_term_research'
    ? 'exact_term_research_before_relationship_work'
    : strongest?.similarity_score >= 0.7 && strongest.exact_label_validated
    ? 'priority_canonical_merge_review'
    : strongest?.similarity_score >= 0.5
      ? 'canonical_overlap_review'
      : 'exact_term_research_before_relationship_work';
  return {
    id: record.id,
    display_name: record.display_name,
    sphere: record.sphere,
    total_degree: record.total_degree,
    inherited_anchor_id: sourceNode?.calibration?.anchor_id || null,
    source_urls: sourceNode?.calibration?.source_urls || [],
    review_status: 'pending_manual_evidence_review',
    review_path: reviewPath,
    canonical_overlap_decision: reviewedDecision,
    candidates,
    required_decision_fields: [
      'exact_term_source_locator',
      'canonical_scope_comparison',
      'merge_keep_or_retire_decision',
      'alias_preservation',
      'edge_retargeting_review',
      'reviewer_and_review_date'
    ]
  };
});

const resolvedMerges = NODES.flatMap(node => (node.semanticAliases || []).map(alias => {
  const reviewedDecision = ONTOLOGY_REVIEW_DECISIONS[alias.id] || null;
  return {
    alias_id: alias.id,
    alias_name: alias.name,
    canonical_id: node.id,
    canonical_name: node.name,
    disposition: 'merged_preserve_alias',
    reviewed_decision: reviewedDecision
  };
}));

const countBy = (items, key) => Object.fromEntries([...items.reduce((counts, item) => {
  const value = item[key] ?? 'missing';
  counts.set(String(value), (counts.get(String(value)) || 0) + 1);
  return counts;
}, new Map())].sort(([left], [right]) => left.localeCompare(right)));

const registry = {
  version: 'exhaustive_ontology_review_v1',
  generated_at: new Date().toISOString(),
  policy: 'Similarity creates a review lead, never an automatic merge. A generated label leaves this queue only after exact-term and canonical-scope evidence is reviewed; retained aliases preserve search without preserving duplicate causal nodes.',
  candidate_scope: {
    mode: 'all_threshold_matches',
    minimum_similarity_score: 0.24,
    maximum_candidates_per_record: null,
    policy: 'Keep every candidate meeting the declared threshold. Ranking organizes manual review but never truncates the candidate set.'
  },
  summary: {
    pending_label_reviews: reviewQueue.length,
    records_with_ranked_candidates: reviewQueue.filter(item => item.candidates.length).length,
    records_without_ranked_candidates: reviewQueue.filter(item => !item.candidates.length).length,
    resolved_semantic_aliases: resolvedMerges.length,
    resolved_metric_aliases: Object.keys(NONCAUSAL_GENERATED_METRIC_BINDINGS).length,
    reviewed_distinct_scope_decisions: reviewQueue.filter(item => item.canonical_overlap_decision?.disposition === 'distinct_scope_keep_exact_term_research').length,
    reviewed_merge_decisions: resolvedMerges.filter(item => item.reviewed_decision?.disposition === 'merge_preserve_search_alias').length,
    total_label_records_accounted_for: reviewQueue.length + resolvedMerges.length + Object.keys(NONCAUSAL_GENERATED_METRIC_BINDINGS).length,
    by_review_path: countBy(reviewQueue, 'review_path')
  },
  resolved_merges: resolvedMerges,
  resolved_metric_aliases: NONCAUSAL_GENERATED_METRIC_BINDINGS,
  nodes: reviewQueue
};

const csvFields = ['id', 'display_name', 'sphere', 'total_degree', 'inherited_anchor_id', 'review_status', 'review_path', 'candidate_ids', 'candidate_names', 'candidate_scores'];
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csv = [
  csvFields.join(','),
  ...reviewQueue.map(item => {
    const row = {
      ...item,
      candidate_ids: item.candidates.map(candidate => candidate.id).join('|'),
      candidate_names: item.candidates.map(candidate => candidate.display_name).join('|'),
      candidate_scores: item.candidates.map(candidate => candidate.similarity_score).join('|')
    };
    return csvFields.map(field => csvCell(row[field])).join(',');
  })
].join('\n');

await Promise.all([
  fs.writeFile(path.resolve('public/ontology-review-queue.json'), `${JSON.stringify(registry, null, 2)}\n`),
  fs.writeFile(path.resolve('public/ontology-review-queue.csv'), `${csv}\n`)
]);

console.log(JSON.stringify({ outputs: ['public/ontology-review-queue.json', 'public/ontology-review-queue.csv'], summary: registry.summary }, null, 2));
