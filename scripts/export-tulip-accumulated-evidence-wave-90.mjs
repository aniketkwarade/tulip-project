import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/renewable-curtailment-loss-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.caiso_wind_solar_curtailed_mwh_2024, anchors.curtailed_energy_mwh),
  human_economic_burden: n(impact.gb_direct_constraint_payments_gbp_millions_derived, anchors.direct_constraint_payments_gbp_millions),
  persistence: n(impact.neso_documented_financial_year_count, anchors.documented_annual_periods),
  extent: n(impact.gb_wind_curtailment_share_of_hypothetical_outturn_percent_2024_25, anchors.wind_curtailment_share_percent)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('renewable_curtailment_losses: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'renewable_curtailment_losses', method: 'impact_fallback', as_of: '2024/25', components,
  raw_inputs: {
    biophysical_burden: { caiso_wind_solar_curtailed_mwh_2024: impact.caiso_wind_solar_curtailed_mwh_2024, caiso_solar_share_of_curtailment_percent_2024: impact.caiso_solar_share_of_curtailment_percent_2024, normalization_anchors_mwh: anchors.curtailed_energy_mwh },
    human_economic_burden: { gb_wind_turn_down_payments_gbp_millions_2024_25: impact.gb_wind_turn_down_payments_gbp_millions_2024_25, gb_replacement_gas_payments_gbp_millions_2024_25: impact.gb_replacement_gas_payments_gbp_millions_2024_25, gb_direct_constraint_payments_gbp_millions_derived: impact.gb_direct_constraint_payments_gbp_millions_derived, normalization_anchors_gbp_millions: anchors.direct_constraint_payments_gbp_millions },
    persistence: { documented_financial_year_count: impact.neso_documented_financial_year_count, series_start_financial_year: impact.neso_series_start_financial_year, series_end_financial_year: impact.neso_series_end_financial_year, normalization_anchors_annual_periods: anchors.documented_annual_periods },
    extent: { gb_wind_curtailment_share_of_hypothetical_outturn_percent_2024_25: impact.gb_wind_curtailment_share_of_hypothetical_outturn_percent_2024_25, normalization_anchors_percent: anchors.wind_curtailment_share_percent },
    unscored_context: { caiso_curtailment_increase_percent_2023_to_2024: impact.caiso_curtailment_increase_percent_2023_to_2024, caiso_curtailment_avoided_via_weim_mwh_2024: impact.caiso_curtailment_avoided_via_weim_mwh_2024_unscored, caiso_curtailment_avoided_via_weim_percent_2024: impact.caiso_curtailment_avoided_via_weim_percent_2024_unscored },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'bounded_caiso_energy_burden', formula: 'Normalize EIA-reported 3.4 million MWh of 2024 CAISO wind and solar curtailment; do not monetize it or infer global volume.' },
    { type: 'realized_gb_cost_burden', formula: 'Add only the source-reported £370 million wind turn-down and £910 million replacement-gas payments for a transparent £1.28 billion direct constraint-action burden.' },
    { type: 'bounded_persistence_and_extent', formula: 'Normalize the seven NESO financial-year observations and the 13-percent 2024/25 share of hypothetical GB wind outturn; do not treat them as a percentile threshold.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Realized calendar-year 2024 CAISO and financial-year 2024/25 Great Britain observations reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Independent grid-system evidence directly quantifies curtailed renewable energy, the share of available wind curtailed, repeated annual occurrence, realized turn-down and replacement-generation payments, and consumer cost pass-through.', higher_priority_failures: ['Neither bounded grid series is a defensible global aggregation.', 'The seven-year NESO history is below the 20-complete-annual-observation gate for historical percentile normalization, and no recognized universal curtailment threshold is applied.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`renewable_curtailment_losses: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_90_renewable_curtailment_losses', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-90.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-90.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
