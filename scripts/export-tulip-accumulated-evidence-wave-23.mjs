import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/undrr-ldc-disaster-inequality-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'disaster_recovery_inequality',
  method: 'impact_fallback',
  as_of: String(a.period_end_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.ldc_direct_economic_loss_pct_gdp, [0, 0.5, 2, 5], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.ldc_mortality_multiple_global, [1, 1.5, 2, 3], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.period_years, [0, 3, 7, 10], 'higher_is_worse')),
    extent: round(a.ldc_reporting_total / a.ldc_total)
  },
  raw_inputs: {
    biophysical_burden: { ldc_direct_economic_loss_pct_gdp: a.ldc_direct_economic_loss_pct_gdp, global_direct_economic_loss_pct_gdp: a.global_direct_economic_loss_pct_gdp, ldc_multiple_global_context: a.ldc_economic_loss_multiple_global, anchors_pct_gdp: [0, 0.5, 2, 5], boundary: 'Direct disaster loss relative to group GDP; not household wealth or recovery aid.' },
    human_economic_burden: { ldc_disaster_mortality_per_100k: a.ldc_disaster_mortality_per_100k, global_disaster_mortality_per_100k_derived: a.global_disaster_mortality_per_100k_derived, ldc_mortality_multiple_global: a.ldc_mortality_multiple_global, anchors_multiple: [1, 1.5, 2, 3] },
    persistence: { period_start_year: a.period_start_year, period_end_year: a.period_end_year, complete_period_years: a.period_years, anchors_years: [0, 3, 7, 10] },
    extent: { ldc_reporting_total: a.ldc_reporting_total, ldc_total: a.ldc_total, source_reported_share_pct: a.ldc_reporting_share_pct, normalized_value: round(a.ldc_reporting_total / a.ldc_total), boundary: 'Coverage of the LDC comparison group, not all countries or households.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'relative_asset_burden', formula: 'Normalize the source-reported LDC direct-economic-loss share of GDP while retaining the global comparator separately.' },
    { type: 'mortality_disparity', formula: 'Normalize the source-reported LDC-to-global mortality multiple; do not convert rates into deaths without population denominators.' },
    { type: 'fixed_monitoring_period', formula: 'Normalize the complete 2015-2024 assessment window once; do not annualize or accumulate group rates.' },
    { type: 'reporting_group_extent', formula: 'Divide reporting LDCs by all LDCs and leave the two non-reporting countries missing.' }
  ],
  source_ids: ['undrr_disaster_risk_reduction_in_least_developed_countries'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNDRR Sendai monitoring data through ${a.period_end_year}, status as of ${a.data_as_of}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNDRR quantifies persistent cross-income disparity in direct loss relative to GDP and disaster mortality across a ten-year window with 95% LDC reporting coverage.',
    higher_priority_failures: ['No current global household recovery-time or post-disaster aid-outcome series supplies magnitude plus threshold or momentum; the operational OpenFEMA comparison is United States-only.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for disaster_recovery_inequality.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_23_undrr_ldc_disaster_inequality', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'undrr_disaster_risk_reduction_in_least_developed_countries', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-23.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-23.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
