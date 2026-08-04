import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NODES } from '../src/data.js';
import {
  TULIP_URGENCY_BANDS_V3,
  calculateTulipSensitivity,
  getTulipUrgencyBandV3
} from '../src/tulip-urgency-v3.js';
import { compositeToTulipScore } from '../src/tulip-urgency-v2.js';
import {
  hashTulipUrgencyV3Content,
  verifyTulipUrgencyReceiptV3
} from './lib/tulip-urgency-v3-receipts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = filename => JSON.parse(fs.readFileSync(path.join(ROOT, 'public', filename), 'utf8'));

const boundaries = [
  [1, 'Low Concern'], [4.9, 'Low Concern'],
  [5, 'Elevated'], [6.9, 'Elevated'],
  [7, 'Concerning'], [7.5, 'Concerning'],
  [7.6, 'High Risk'], [8.1, 'High Risk'],
  [8.2, 'Severe'], [8.6, 'Severe'],
  [8.7, 'Critical'], [9.2, 'Critical'],
  [9.3, 'Extreme'], [10, 'Extreme']
];
for (const [score, label] of boundaries) assert.equal(getTulipUrgencyBandV3(score), label);
for (const boundary of [5, 7, 7.6, 8.2, 8.7, 9.3]) {
  const roundsBelow = compositeToTulipScore((boundary - 0.051 - 1) / 9);
  const roundsAtBoundary = compositeToTulipScore((boundary - 0.049 - 1) / 9);
  assert.equal(roundsBelow, Number((boundary - 0.1).toFixed(1)));
  assert.equal(roundsAtBoundary, boundary);
  assert.notEqual(getTulipUrgencyBandV3(roundsBelow), getTulipUrgencyBandV3(roundsAtBoundary));
}
assert.throws(() => getTulipUrgencyBandV3(0.9), /between 1 and 10/);
assert.throws(() => getTulipUrgencyBandV3(10.1), /between 1 and 10/);
assert.equal(TULIP_URGENCY_BANDS_V3.length, 7);

execFileSync(process.execPath, ['scripts/review-tulip-current-data-v3.mjs'], { cwd: ROOT, stdio: 'pipe' });
execFileSync(process.execPath, ['scripts/review-tulip-remaining-v3.mjs'], { cwd: ROOT, stdio: 'pipe' });
execFileSync(process.execPath, ['scripts/export-tulip-urgency-v3-shadow.mjs'], { cwd: ROOT, stdio: 'pipe' });
execFileSync(process.execPath, ['scripts/audit-tulip-urgency-v3-shadow.mjs'], { cwd: ROOT, stdio: 'pipe' });
execFileSync(process.execPath, ['scripts/promote-tulip-urgency-v3.mjs'], { cwd: ROOT, stdio: 'pipe' });
const v2 = readJson('tulip-urgency-scores.json');
const v3 = readJson('tulip-urgency-v3-shadow-scores.json');
const publicV3 = readJson('tulip-urgency-v3-scores.json');
const queue = readJson('tulip-urgency-v3-review-queue.json');
const modelAssurance = readJson('tulip-urgency-modeled-method-assurance.json');
const shadowAudit = readJson('tulip-urgency-v3-shadow-audit.json');
const v2ById = new Map(v2.receipts.map(receipt => [receipt.node_id, receipt]));
const issueNodes = NODES.filter(node => node.node_kind !== 'response');
const responseNodes = NODES.filter(node => node.node_kind === 'response');

assert.equal(v3.status, 'shadow_review');
assert.equal(v3.method_version, 'tulip_urgency_v3');
assert.equal(v3.calculation_version, 'tulip_urgency_v2');
assert.equal(v3.receipt_schema_version, '3.2.0');
assert.equal(v3.receipts.length, 354);
assert.equal(v3.receipts.length, issueNodes.length);
assert.equal(v3.excluded_response_node_ids.length, responseNodes.length);
assert.ok(responseNodes.every(node => !v3.receipts.some(receipt => receipt.node_id === node.id)));
assert.deepEqual(v3.band_counts, {
  'Low Concern': 32, Elevated: 31, Concerning: 26, 'High Risk': 74,
  Severe: 62, Critical: 80, Extreme: 49
});
assert.ok(v3.receipts.every(receipt => receipt.value === v2ById.get(receipt.node_id).value));
assert.ok(v3.receipts.every(receipt => receipt.legacy_input_hash === v2ById.get(receipt.node_id).input_hash));
assert.ok(v3.receipts.every(receipt => verifyTulipUrgencyReceiptV3(receipt).computationally_valid));
const reviewedCurrentReceipts = v3.receipts.filter(receipt => receipt.method === 'current_data');
const reviewedImpactReceipts = v3.receipts.filter(receipt => receipt.method === 'impact_fallback');
const reviewedModeledReceipts = v3.receipts.filter(receipt => receipt.method === 'modeled');
assert.equal(reviewedCurrentReceipts.length, 96);
assert.equal(reviewedImpactReceipts.length, 208);
assert.equal(reviewedModeledReceipts.length, 50);
assert.ok(v3.receipts.every(receipt => receipt.scientific_review.reviewer_type === 'ai_assisted'));
assert.ok(v3.receipts.every(receipt => verifyTulipUrgencyReceiptV3(receipt).scientific_review_current));
assert.ok(v3.receipts.every(receipt => receipt.transformation_assurance.every(item => (
  item.applies_to_components.length > 0
  && item.units.length > 0
  && item.direction
  && item.rationale
  && item.citations.length > 0
  && item.source_locators.length > 0
  && item.test_fixtures.length > 0
  && item.approval.status === 'approved'
))));
assert.ok([...reviewedImpactReceipts, ...reviewedModeledReceipts].every(receipt => (
  receipt.transformation_assurance.every(item => item.review_evidence)
)));
assert.ok(v3.receipts.every(receipt => receipt.source_assertions.every(assertion => (
  assertion.claim && assertion.locator
  && ['supported', 'supported_as_contextual_evidence'].includes(assertion.entailment_status)
  && assertion.source_currency_status === 'current_as_latest_reviewed_release'
  && assertion.human_entailment_review_result === 'not_performed'
  && ['supported', 'supported_as_contextual_evidence'].includes(assertion.ai_assisted_entailment_review_result)
))));
assert.equal(modelAssurance.status, 'approved_for_declared_fallback_use');
assert.equal(modelAssurance.validation_summary.receipts, 50);
assert.equal(modelAssurance.validation_summary.passed, 50);
assert.equal(modelAssurance.validation_summary.failed, 0);
assert.equal(modelAssurance.pilot_calibration_shift.reproduces, true);
assert.equal(shadowAudit.status, 'cutover_ready');
assert.equal(shadowAudit.validation.checks_passed, shadowAudit.validation.checks_total);
assert.equal(shadowAudit.validation.scientific_assessment, 'all_method_review_gates_passed');
assert.equal(publicV3.status, 'approved');
assert.equal(publicV3.production_scores_replaced, true);
assert.equal(publicV3.rollout.current_data_scientific_review_gate, '96_of_96_current');
assert.equal(publicV3.rollout.impact_fallback_scientific_review_gate, '208_of_208_current');
assert.equal(publicV3.rollout.modeled_scientific_review_gate, '50_of_50_current');
assert.equal(publicV3.rollout.all_methods_scientific_review_gate, '354_of_354_current');
assert.equal(publicV3.receipts.length, 354);
assert.ok(publicV3.receipts.every(receipt => receipt.value === v2ById.get(receipt.node_id).value));
assert.ok(publicV3.receipts.every(receipt => verifyTulipUrgencyReceiptV3(receipt).scientific_review_current));

const currentReceipt = v3.receipts.find(receipt => receipt.method === 'current_data');
const unchangedCurrent = calculateTulipSensitivity(currentReceipt, currentReceipt.components);
assert.equal(unchangedCurrent.value, currentReceipt.value);
assert.deepEqual(Object.keys(unchangedCurrent.components), ['magnitude', 'threshold', 'momentum', 'extent']);
assert.throws(() => calculateTulipSensitivity(currentReceipt, { ...currentReceipt.components, legacy_vector: 0.5 }), /Unexpected/);
assert.throws(() => calculateTulipSensitivity(currentReceipt, { magnitude: 0.5 }), /Missing/);
assert.throws(() => calculateTulipSensitivity(currentReceipt, { ...currentReceipt.components, magnitude: 1.01 }), /between 0 and 1/);

const modeledReceipt = v3.receipts.find(receipt => receipt.method === 'modeled');
const unchangedModeled = calculateTulipSensitivity(modeledReceipt, modeledReceipt.components);
assert.equal(unchangedModeled.value, modeledReceipt.value);
assert.deepEqual(Object.keys(unchangedModeled.components), ['modeled_estimate']);

const tampered = structuredClone(currentReceipt);
tampered.node_id = `${tampered.node_id}_tampered`;
assert.notEqual(hashTulipUrgencyV3Content(tampered), currentReceipt.content_hash);
assert.equal(verifyTulipUrgencyReceiptV3(tampered).computationally_valid, false);
const hashedFieldMutations = [
  receipt => { receipt.calculation_version = 'tampered_calculation'; },
  receipt => { receipt.components.magnitude += 0.001; },
  receipt => { receipt.raw_inputs.__tampered = true; },
  receipt => { receipt.transformations.push({ operation: 'tampered' }); },
  receipt => { receipt.source_ids.push('tampered_source'); },
  receipt => { receipt.uncertainty = `${receipt.uncertainty} tampered`; },
  receipt => { receipt.freshness = { ...receipt.freshness, __tampered: true }; },
  receipt => { receipt.method_selection.decision_summary += ' tampered'; },
  receipt => { receipt.source_assertions[0].claim += ' tampered'; }
];
for (const mutate of hashedFieldMutations) {
  const changed = structuredClone(currentReceipt);
  mutate(changed);
  assert.notEqual(hashTulipUrgencyV3Content(changed), currentReceipt.content_hash);
}

const approved = structuredClone(currentReceipt);
approved.scientific_review = {
  status: 'approved',
  reviewed_content_hash: approved.content_hash,
  reviewed_by: ['test_reviewer'],
  reviewed_at: '2026-08-01T00:00:00.000Z',
  next_review_at: '2027-08-01T00:00:00.000Z',
  checks: {
    measurement_suitability: 'pass', anchor_provenance: 'pass', transformation_correctness: 'pass',
    method_eligibility: 'pass', source_entailment: 'pass', source_currency: 'pass'
  },
  notes: 'Test fixture.'
};
assert.equal(verifyTulipUrgencyReceiptV3(approved, new Date('2026-08-02T00:00:00.000Z')).scientific_review_current, true);
assert.equal(verifyTulipUrgencyReceiptV3(approved, new Date('2027-08-02T00:00:00.000Z')).scientific_review_current, false);
approved.components.magnitude = Math.min(1, approved.components.magnitude + 0.01);
assert.equal(verifyTulipUrgencyReceiptV3(approved, new Date('2026-08-02T00:00:00.000Z')).scientific_review_current, false);

assert.equal(queue.queue.length, 354);
assert.ok(queue.queue.slice(0, 96).every(item => item.method === 'current_data'));
assert.ok(queue.queue.slice(96, 304).every(item => item.method === 'impact_fallback'));
assert.ok(queue.queue.slice(304).every(item => item.method === 'modeled'));
assert.ok(queue.queue.every(item => item.scientific_review_status === 'approved'));

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8');
const server = fs.readFileSync(path.join(ROOT, 'server', 'index.mjs'), 'utf8');
assert.doesNotMatch(html, /urgency-sensitivity/);
assert.doesNotMatch(html, /Hypothetical sensitivity score|Evidence sensitivity/);
assert.doesNotMatch(main, /slider-forcing|slider-damage|slider-drivenness|slider-fallout/);
assert.doesNotMatch(main, /climate_forcing:\s*cf/);
assert.doesNotMatch(main, /calculateTulipSensitivity|renderTulipSensitivityExplorer|urgencySensitivityState/);
assert.match(main, /urgency-band-tooltip/);
assert.match(main, /label\.tabIndex = 0/);
assert.match(html, /aria-label="TULIP urgency bands"/);
assert.match(html, /TULIP Urgency summarizes how immediate and severe an issue is on a 1–10 scale\./);
assert.doesNotMatch(html, /urgency-band-range-table/);
assert.doesNotMatch(main, /urgency-band-range-table/);
assert.match(main, /tulipUrgencyHistoricalV2Preview[\s\S]*tulip-urgency-v3-scores\.json/);
assert.match(server, /'\/api\/tulip\/urgency-scores': 'tulip-urgency-v3-scores\.json'/);
assert.match(server, /'\/api\/tulip\/urgency-v2-scores': 'tulip-urgency-scores\.json'/);

console.log('TULIP urgency v3 tests passed: bands, parity, assurance integrity, review staleness, queue order, and sensitivity UI removal.');
