import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceWave = JSON.parse(await fs.readFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-1.json'), 'utf8'));
const base = sourceWave.receipts.find(receipt => receipt.node_id === 'public_health_heat_burden');
if (!base) throw new Error('Missing public_health_heat_burden source receipt.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'heatwave_excess_mortality_rates',
  method: 'impact_fallback',
  as_of: base.as_of,
  components: base.components,
  raw_inputs: {
    ...base.raw_inputs,
    metric_boundary: {
      metric_id: 'heat_attributable_mortality_rate',
      metric_name: 'Global and WHO-region modelled heat-attributable mortality',
      distinction: 'Uses the provider-modelled all-heat attributable mortality series. Individual declared heatwave event totals remain separate contextual evidence.'
    }
  },
  transformations: base.transformations,
  source_ids: base.source_ids,
  uncertainty: `${base.uncertainty} WHO separately summarizes approximately 489,000 heat-related deaths per year during 2000–2019; that fact-sheet estimate is corroborating context and is not added to the Lancet series.`,
  freshness: base.freshness,
  selection_reason: {
    selected_method_passed: 'The operational Lancet Countdown source supplies 32 complete global annual modeled heat-attributable death and attributable-fraction observations plus WHO-region extent; WHO current guidance independently corroborates the global mortality scale.',
    higher_priority_failures: [
      'The source labels mortality values as provider-modelled attributable estimates rather than direct current physical observations.',
      'No recognized current heatwave-mortality threshold contract supports current-data scoring.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for heatwave_excess_mortality_rates.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_10_lancet_heatwave_excess_mortality',
  generated_at: new Date().toISOString(),
  source_snapshot: 'public/heat-health-snapshot.json',
  source_id: 'lancet_countdown_data_explorer',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-10.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-10.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
