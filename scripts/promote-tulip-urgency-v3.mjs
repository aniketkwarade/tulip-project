import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyTulipUrgencyReceiptV3 } from './lib/tulip-urgency-v3-receipts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DOCS = path.join(ROOT, 'docs');
const now = new Date();

async function readJson(filename) {
  return JSON.parse(await fs.readFile(path.join(PUBLIC, filename), 'utf8'));
}

const [shadow, audit] = await Promise.all([
  readJson('tulip-urgency-v3-shadow-scores.json'),
  readJson('tulip-urgency-v3-shadow-audit.json')
]);
const currentDataReceipts = shadow.receipts.filter(receipt => receipt.method === 'current_data');
const impactReceipts = shadow.receipts.filter(receipt => receipt.method === 'impact_fallback');
const modeledReceipts = shadow.receipts.filter(receipt => receipt.method === 'modeled');
const incomplete = shadow.receipts.filter(receipt => !verifyTulipUrgencyReceiptV3(receipt, now).scientific_review_current);

if (shadow.status !== 'shadow_review' || shadow.production_scores_replaced !== false) {
  throw new Error('Promotion requires an intact v3 shadow registry.');
}
if (audit.status !== 'cutover_ready') throw new Error(`V3 audit is not cutover-ready: ${audit.status}.`);
if (currentDataReceipts.length !== 96) throw new Error(`Expected 96 current-data receipts; found ${currentDataReceipts.length}.`);
if (impactReceipts.length !== 208) throw new Error(`Expected 208 impact-fallback receipts; found ${impactReceipts.length}.`);
if (modeledReceipts.length !== 50) throw new Error(`Expected 50 modeled receipts; found ${modeledReceipts.length}.`);
if (incomplete.length) throw new Error(`All-method scientific review gate failed for: ${incomplete.map(receipt => receipt.node_id).join(', ')}.`);

const promotedAt = now.toISOString();
const publicRegistry = {
  ...shadow,
  version: '3.2.0',
  status: 'approved',
  generated_at: promotedAt,
  promoted_at: promotedAt,
  production_scores_replaced: true,
  rollout: {
    public_default: true,
    historical_v2_preserved: true,
    current_data_scientific_review_gate: '96_of_96_current',
    impact_fallback_scientific_review_gate: '208_of_208_current',
    modeled_scientific_review_gate: '50_of_50_current',
    all_methods_scientific_review_gate: '354_of_354_current',
    modeled_method_assurance: 'approved_for_declared_fallback_use',
    reviewer_disclosure: 'AI-assisted reproducible scientific review; not human expert sign-off. Human entailment review was not performed.'
  }
};
const report = `# TULIP Urgency v3 - Public Rollout\n\nStatus: **public default**.\n\n- Promoted: ${promotedAt}\n- Numerical scores changed from v2: 0\n- Current-data scientific reviews current: 96 of 96\n- Impact-fallback scientific reviews current: 208 of 208\n- Modeled scientific reviews current: 50 of 50\n- All-method scientific reviews current: 354 of 354\n- Historical v2 receipts preserved: yes\n- Calculation version: \`${publicRegistry.calculation_version}\`\n- Band version: \`${publicRegistry.band_version}\`\n- Receipt schema: \`${publicRegistry.receipt_schema_version}\`\n\nAll review gates are AI-assisted and reproducible, not human expert sign-off. Human entailment review was not performed. Approval means the declared method and evidence passed the six recorded criteria; it does not prove scientific truth or independently validate modeled estimates.\n`;

await Promise.all([
  fs.writeFile(path.join(PUBLIC, 'tulip-urgency-v3-scores.json'), `${JSON.stringify(publicRegistry, null, 2)}\n`),
  fs.writeFile(path.join(DOCS, 'tulip-urgency-v3-public-rollout.md'), report)
]);

console.log(JSON.stringify({
  output: 'public/tulip-urgency-v3-scores.json',
  status: publicRegistry.status,
  receipts: publicRegistry.receipts.length,
  current_data_reviews_current: currentDataReceipts.length,
  impact_fallback_reviews_current: impactReceipts.length,
  modeled_reviews_current: modeledReceipts.length,
  all_reviews_current: shadow.receipts.length,
  historical_v2_preserved: true
}, null, 2));
