import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'public/tulip-evidence-hunt-baseline.json');

try {
  await fs.access(OUTPUT);
  throw new Error('Evidence-hunt baseline already exists; refusing to overwrite the fixed cohort.');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const registry = JSON.parse(await fs.readFile(path.join(ROOT, 'public/tulip-urgency-scores.json'), 'utf8'));
const modeled = registry.receipts.filter(receipt => receipt.method === 'modeled');
const baseline = {
  version: '1.0.0',
  captured_at: new Date().toISOString(),
  registry_generated_at: registry.generated_at,
  method_version: registry.method_version,
  modeled_node_count: modeled.length,
  promotion_target_share: 0.60,
  promotion_target_count: Math.ceil(modeled.length * 0.60),
  modeled_node_ids: modeled.map(receipt => receipt.node_id)
};

if (baseline.modeled_node_count !== 343 || baseline.promotion_target_count !== 206) {
  throw new Error(`Expected the reviewed 343-node baseline and 206-node target; found ${baseline.modeled_node_count} and ${baseline.promotion_target_count}.`);
}

await fs.writeFile(OUTPUT, `${JSON.stringify(baseline, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-evidence-hunt-baseline.json', modeled_nodes: 343, promotion_target: 206 }, null, 2));
