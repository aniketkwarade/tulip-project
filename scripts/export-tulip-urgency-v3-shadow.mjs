import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NODES } from '../src/data.js';
import {
  TULIP_URGENCY_BANDS_V3,
  TULIP_URGENCY_BAND_VERSION,
  TULIP_URGENCY_CALCULATION_VERSION,
  TULIP_URGENCY_METHOD_VERSION_V3
} from '../src/tulip-urgency-v3.js';
import {
  SCIENTIFIC_REVIEW_CHECKS,
  TULIP_URGENCY_RECEIPT_SCHEMA_VERSION,
  upgradeTulipUrgencyReceiptV3,
  verifyTulipUrgencyReceiptV3
} from './lib/tulip-urgency-v3-receipts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DOCS = path.join(ROOT, 'docs');
const now = new Date();

async function readJson(filename) {
  return JSON.parse(await fs.readFile(path.join(PUBLIC, filename), 'utf8'));
}

function countBy(rows, selector) {
  return Object.fromEntries([...rows.reduce((counts, row) => {
    const key = typeof selector === 'function' ? selector(row) : row[selector];
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map())]);
}

const [v2Registry, v2Comparison, reviewRegistry] = await Promise.all([
  readJson('tulip-urgency-scores.json'),
  readJson('tulip-urgency-rollout-comparison.json'),
  readJson('tulip-urgency-scientific-review-registry.json')
]);

const reviewsByNodeId = new Map((reviewRegistry.reviews ?? []).map(review => [review.node_id, review]));
const receipts = v2Registry.receipts.map(receipt => upgradeTulipUrgencyReceiptV3(
  receipt,
  reviewsByNodeId.get(receipt.node_id) ?? null,
  now
));
const receiptIds = receipts.map(receipt => receipt.node_id);
const issueNodes = NODES.filter(node => node.node_kind !== 'response');
const responseNodes = NODES.filter(node => node.node_kind === 'response');

if (new Set(receiptIds).size !== receipts.length) throw new Error('V3 shadow contains duplicate receipt node IDs.');
if (receipts.length !== issueNodes.length) throw new Error(`Expected ${issueNodes.length} v3 receipts; received ${receipts.length}.`);
if (responseNodes.some(node => receiptIds.includes(node.id))) throw new Error('A response node received a v3 urgency receipt.');

const v2ByNodeId = new Map(v2Registry.receipts.map(receipt => [receipt.node_id, receipt]));
for (const receipt of receipts) {
  const verification = verifyTulipUrgencyReceiptV3(receipt, now);
  if (!verification.computationally_valid) {
    throw new Error(`V3 computational verification failed for ${receipt.node_id}.`);
  }
  if (v2ByNodeId.get(receipt.node_id)?.value !== receipt.value) {
    throw new Error(`V3 score parity failed for ${receipt.node_id}.`);
  }
}

const methodCounts = countBy(receipts, 'method');
const bandCounts = Object.fromEntries(TULIP_URGENCY_BANDS_V3.map(({ label }) => [
  label,
  receipts.filter(receipt => receipt.band === label).length
]));
const expectedBandCounts = {
  'Low Concern': 32,
  Elevated: 31,
  Concerning: 26,
  'High Risk': 74,
  Severe: 62,
  Critical: 80,
  Extreme: 49
};
if (JSON.stringify(bandCounts) !== JSON.stringify(expectedBandCounts)) {
  throw new Error(`Unexpected v3 band distribution: ${JSON.stringify(bandCounts)}`);
}

const reviewCounts = countBy(receipts, receipt => receipt.scientific_review.status);
const v2ComparisonByNodeId = new Map(v2Comparison.comparison.map(row => [row.node_id, row]));
const comparison = receipts.map(receipt => {
  const v2 = v2ByNodeId.get(receipt.node_id);
  const prior = v2ComparisonByNodeId.get(receipt.node_id);
  return {
    node_id: receipt.node_id,
    node_name: prior?.node_name ?? receipt.node_id,
    sphere: prior?.sphere ?? null,
    score: receipt.value,
    v2_band: v2.band,
    v3_band: receipt.band,
    band_changed: v2.band !== receipt.band,
    method: receipt.method,
    model_version: receipt.model_version ?? null,
    content_hash: receipt.content_hash,
    computationally_valid: verifyTulipUrgencyReceiptV3(receipt, now).computationally_valid,
    scientific_review_status: receipt.scientific_review.status
  };
});

const methodOrder = new Map(reviewRegistry.review_policy.backfill_order.map((method, index) => [method, index]));
const reviewQueue = [...receipts]
  .sort((left, right) => (
    (methodOrder.get(left.method) ?? 99) - (methodOrder.get(right.method) ?? 99)
    || right.value - left.value
    || left.node_id.localeCompare(right.node_id)
  ))
  .map((receipt, index) => ({
    queue_position: index + 1,
    node_id: receipt.node_id,
    method: receipt.method,
    score: receipt.value,
    band: receipt.band,
    content_hash: receipt.content_hash,
    scientific_review_status: receipt.scientific_review.status,
    required_checks: SCIENTIFIC_REVIEW_CHECKS
  }));

const generatedAt = now.toISOString();
const registry = {
  version: '3.0.0-shadow',
  receipt_schema_version: TULIP_URGENCY_RECEIPT_SCHEMA_VERSION,
  method_version: TULIP_URGENCY_METHOD_VERSION_V3,
  calculation_version: TULIP_URGENCY_CALCULATION_VERSION,
  band_version: TULIP_URGENCY_BAND_VERSION,
  status: 'shadow_review',
  generated_at: generatedAt,
  production_scores_replaced: false,
  scope: 'all_issue_nodes',
  issue_node_count: issueNodes.length,
  excluded_response_node_ids: responseNodes.map(node => node.id),
  method_counts: methodCounts,
  band_counts: bandCounts,
  assurance_summary: {
    computationally_valid: receipts.length,
    scientific_review_counts: reviewCounts,
    review_backfill_order: reviewRegistry.review_policy.backfill_order,
    validity_boundary: 'Computational verification does not prove scientific correctness or continuing source support.'
  },
  bands: TULIP_URGENCY_BANDS_V3,
  receipts
};

const comparisonRegistry = {
  version: '3.0.0-shadow',
  method_version: TULIP_URGENCY_METHOD_VERSION_V3,
  calculation_version: TULIP_URGENCY_CALCULATION_VERSION,
  band_version: TULIP_URGENCY_BAND_VERSION,
  status: 'shadow_review',
  generated_at: generatedAt,
  summary: {
    scored_issue_nodes: receipts.length,
    excluded_response_nodes: responseNodes.length,
    scores_changed_from_v2: comparison.filter(row => row.score !== v2ByNodeId.get(row.node_id)?.value).length,
    bands_changed_from_v2: comparison.filter(row => row.band_changed).length,
    method_counts: methodCounts,
    band_counts: bandCounts,
    scientific_review_counts: reviewCounts
  },
  comparison
};

const queueRegistry = {
  version: '1.0.0',
  method_version: TULIP_URGENCY_METHOD_VERSION_V3,
  generated_at: generatedAt,
  policy: reviewRegistry.review_policy,
  queue: reviewQueue
};

const bandRows = TULIP_URGENCY_BANDS_V3
  .map(({ label, min, max }) => `| ${min.toFixed(1)}-${max.toFixed(1)} | ${label} | ${bandCounts[label]} |`)
  .join('\n');
const markdown = `# TULIP Urgency v3 - Shadow Rollout\n\nStatus: **shadow review**. Numerical scores remain identical to the approved v2 registry. V3 changes the canonical bands and adds an assurance schema.\n\n## Version boundary\n\n- Method: \`${TULIP_URGENCY_METHOD_VERSION_V3}\`\n- Calculation: \`${TULIP_URGENCY_CALCULATION_VERSION}\`\n- Bands: \`${TULIP_URGENCY_BAND_VERSION}\`\n- Receipt schema: \`${TULIP_URGENCY_RECEIPT_SCHEMA_VERSION}\`\n- Scores changed from v2: 0\n\n## V3 band distribution\n\n| Score | Band | Nodes |\n|---:|---|---:|\n${bandRows}\n\n## Assurance boundary\n\nAll ${receipts.length} receipts pass computational verification. Scientific reviews are tracked separately and are currently ${JSON.stringify(reviewCounts)}. A computationally valid receipt does not prove that its measurement, anchors, transformation, method route, or cited source is scientifically appropriate.\n`;

await Promise.all([
  fs.writeFile(path.join(PUBLIC, 'tulip-urgency-v3-shadow-scores.json'), `${JSON.stringify(registry, null, 2)}\n`),
  fs.writeFile(path.join(PUBLIC, 'tulip-urgency-v3-shadow-comparison.json'), `${JSON.stringify(comparisonRegistry, null, 2)}\n`),
  fs.writeFile(path.join(PUBLIC, 'tulip-urgency-v3-review-queue.json'), `${JSON.stringify(queueRegistry, null, 2)}\n`),
  fs.writeFile(path.join(DOCS, 'tulip-urgency-v3-shadow-report.md'), markdown)
]);

console.log(JSON.stringify({
  output: 'public/tulip-urgency-v3-shadow-scores.json',
  receipts: receipts.length,
  excluded_response_nodes: responseNodes.length,
  band_counts: bandCounts,
  scientific_review_counts: reviewCounts
}, null, 2));
