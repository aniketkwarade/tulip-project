import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPowerHeatCurrentReceipts } from './lib/power-heat-urgency-receipts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POWER_PATH = 'public/power-heat-hazard-snapshot.json';
const HEAT_HEALTH_PATH = 'public/heat-health-snapshot.json';
const [power, heatHealth] = await Promise.all([POWER_PATH, HEAT_HEALTH_PATH].map(async file => (
  JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))
)));
const receipts = buildPowerHeatCurrentReceipts(power, heatHealth);
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_46_nasa_power_global_sentinel_heat_moisture_and_precipitation',
  generated_at: new Date().toISOString(),
  source_snapshots: [POWER_PATH, HEAT_HEALTH_PATH],
  source_ids: ['nasa_power_open_api', 'lancet_countdown_data_explorer'],
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-46.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-46.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({
    node_id: receipt.node_id,
    value: receipt.value,
    band: receipt.band,
    method: receipt.method,
    components: receipt.components
  }))
}, null, 2));
