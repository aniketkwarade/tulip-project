import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fao-global-topsoil-erosion-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'topsoil_erosion_acceleration',
  method: 'impact_fallback',
  as_of: String(a.statement_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.global_arable_soil_lost_billion_tonnes_per_year, [0, 10, 30, 75], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.global_agricultural_production_lost_usd_billion_per_year, [0, 50, 200, 500], 'higher_is_worse')),
    persistence: round(a.recurrence_days_per_year / 365),
    extent: a.global_extent_normalized
  },
  raw_inputs: {
    biophysical_burden: { global_arable_soil_lost_billion_tonnes_per_year: a.global_arable_soil_lost_billion_tonnes_per_year, anchors_billion_tonnes_per_year: [0, 10, 30, 75], boundary: a.measurement_boundary },
    human_economic_burden: { global_agricultural_production_lost_usd_billion_per_year: a.global_agricultural_production_lost_usd_billion_per_year, anchors_usd_billion_per_year: [0, 50, 200, 500], boundary: 'Source-attributed agricultural production loss; no broader land-degradation cost is added.' },
    persistence: { recurrence_days_per_year: a.recurrence_days_per_year, reference_days_per_year: 365, normalized_value: round(a.recurrence_days_per_year / 365), boundary: 'The source reports an annual recurring global burden; no multi-year trend is inferred.' },
    extent: { geographic_scope: a.geographic_scope, normalized_value: a.global_extent_normalized, boundary: 'Global arable-land aggregate, not uniform local erosion.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locator: a.source_locator, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'fixed_global_annual_soil_loss', formula: 'Normalize the FAO global annual arable-soil loss estimate through named mass ranges.' },
    { type: 'source_attributed_production_loss', formula: 'Normalize only the FAO agricultural-production-loss estimate; exclude broader land-degradation costs.' },
    { type: 'source_reported_annual_recurrence', formula: '365 recurring days / 365 calendar days; do not infer a current acceleration rate.' },
    { type: 'global_arable_extent', formula: 'Score the source-declared global arable-land scope while retaining spatial heterogeneity.' }
  ],
  source_ids: ['fao_global_topsoil_erosion_burden'],
  uncertainty: snapshot.uncertainty,
  freshness: `FAO Global Soil Partnership global burden statement ${a.statement_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'FAO quantifies a recurring global annual arable-soil burden and associated agricultural-production loss, providing biophysical, economic, recurrence and global-extent evidence.',
    higher_priority_failures: ['The existing SoilGrids snapshot estimates soil properties, not erosion flux.', 'No source-consistent current 20-year annual or 60-month global erosion-rate panel supplies magnitude plus threshold or momentum, so the annual burden is not mislabeled current data.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for topsoil_erosion_acceleration.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_25_fao_global_topsoil_erosion', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'fao_global_topsoil_erosion_burden', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-25.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-25.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
