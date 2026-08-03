import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NODES } from '../src/data.js';
import { TULIP_URGENCY_BANDS_V3 } from '../src/tulip-urgency-v3.js';
import { SCIENTIFIC_REVIEW_CHECKS, verifyTulipUrgencyReceiptV3 } from './lib/tulip-urgency-v3-receipts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const registry = JSON.parse(await fs.readFile(path.join(PUBLIC, 'tulip-urgency-v3-shadow-scores.json'), 'utf8'));
const modeledAssurance = JSON.parse(await fs.readFile(path.join(PUBLIC, 'tulip-urgency-modeled-method-assurance.json'), 'utf8'));
const issueNodes = NODES.filter(node => node.node_kind !== 'response');
const responseNodes = NODES.filter(node => node.node_kind === 'response');
const receiptIds = registry.receipts.map(receipt => receipt.node_id);
const verification = registry.receipts.map(receipt => ({
  node_id: receipt.node_id,
  ...verifyTulipUrgencyReceiptV3(receipt)
}));

const reviewCounts = Object.fromEntries([...registry.receipts.reduce((counts, receipt) => {
  const status = receipt.scientific_review.status;
  counts.set(status, (counts.get(status) ?? 0) + 1);
  return counts;
}, new Map())]);
const currentDataVerification = verification.filter(result => (
  registry.receipts.find(receipt => receipt.node_id === result.node_id)?.method === 'current_data'
));
const currentDataReceipts = registry.receipts.filter(receipt => receipt.method === 'current_data');
const impactReceipts = registry.receipts.filter(receipt => receipt.method === 'impact_fallback');
const modeledReceipts = registry.receipts.filter(receipt => receipt.method === 'modeled');
const checks = [
  { check: 'shadow_registry_is_not_production', passed: registry.status === 'shadow_review' && registry.production_scores_replaced === false },
  { check: 'all_issue_nodes_have_one_receipt', passed: registry.receipts.length === issueNodes.length && new Set(receiptIds).size === issueNodes.length },
  { check: 'response_nodes_are_excluded', passed: responseNodes.every(node => !receiptIds.includes(node.id)) },
  { check: 'all_receipts_are_computationally_valid', passed: verification.every(result => result.computationally_valid) },
  { check: 'every_receipt_has_sha256_content_hash', passed: registry.receipts.every(receipt => /^sha256:[a-f0-9]{64}$/.test(receipt.content_hash)) },
  { check: 'every_receipt_has_scientific_review_state', passed: registry.receipts.every(receipt => receipt.scientific_review && SCIENTIFIC_REVIEW_CHECKS.every(key => key in receipt.scientific_review.checks)) },
  { check: 'all_scores_use_a_v3_band', passed: registry.receipts.every(receipt => TULIP_URGENCY_BANDS_V3.some(band => band.label === receipt.band)) },
  { check: 'scientific_approval_is_not_inferred_from_computation', passed: registry.receipts.every(receipt => receipt.scientific_review.status !== 'approved' || verifyTulipUrgencyReceiptV3(receipt).scientific_review_current) },
  { check: 'all_96_current_data_reviews_are_current', passed: currentDataReceipts.length === 96 && currentDataVerification.every(result => result.scientific_review_current) },
  { check: 'all_208_impact_fallback_reviews_are_current', passed: impactReceipts.length === 208 && impactReceipts.every(receipt => verifyTulipUrgencyReceiptV3(receipt).scientific_review_current) },
  { check: 'all_50_modeled_reviews_are_current', passed: modeledReceipts.length === 50 && modeledReceipts.every(receipt => verifyTulipUrgencyReceiptV3(receipt).scientific_review_current) },
  { check: 'all_354_reviews_are_current', passed: verification.every(result => result.scientific_review_current) },
  { check: 'ai_assisted_reviewer_type_is_disclosed', passed: registry.receipts.every(receipt => receipt.scientific_review.reviewer_type === 'ai_assisted') },
  { check: 'human_entailment_review_is_not_implied', passed: registry.receipts.every(receipt => receipt.source_assertions.every(assertion => assertion.human_entailment_review_result === 'not_performed')) },
  { check: 'modeled_method_audit_is_current', passed: modeledAssurance.status === 'approved_for_declared_fallback_use' && modeledAssurance.validation_summary?.passed === 50 }
];
const failed = checks.filter(check => !check.passed);
const audit = {
  version: '1.0.0',
  audit_name: 'TULIP Urgency v3 Shadow Assurance Audit',
  generated_at: new Date().toISOString(),
  registry_generated_at: registry.generated_at,
  method_version: registry.method_version,
  calculation_version: registry.calculation_version,
  band_version: registry.band_version,
  status: failed.length ? 'failed' : 'cutover_ready',
  scope: {
    issue_nodes: issueNodes.length,
    response_nodes_excluded: responseNodes.length,
    receipts: registry.receipts.length
  },
  band_counts: registry.band_counts,
  method_counts: registry.method_counts,
  scientific_review_counts: reviewCounts,
  validation: {
    checks_passed: checks.length - failed.length,
    checks_total: checks.length,
    checks,
    computational_assessment: failed.length ? 'failed' : 'passed',
    scientific_assessment: verification.every(result => result.scientific_review_current)
      ? 'all_method_review_gates_passed'
      : 'scientific_review_gate_incomplete',
    reviewer_disclosure: 'All 354 reviews are AI-assisted reproducible reviews, not human expert sign-off. Human entailment review was not performed.',
    validity_boundary: 'Computational checks prove reproducibility. Scientific-review status records that the declared method and evidence passed the six review criteria; it does not prove an original measurement, modeled estimate, or scientific claim true.'
  }
};

if (failed.length) throw new Error(`V3 shadow audit failed: ${failed.map(item => item.check).join(', ')}`);
await fs.writeFile(path.join(PUBLIC, 'tulip-urgency-v3-shadow-audit.json'), `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-urgency-v3-shadow-audit.json', status: audit.status, checks: `${audit.validation.checks_passed}/${audit.validation.checks_total}` }, null, 2));
