import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/eia112-utility-disconnection-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact_2024;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.combined.disconnections, anchors.disconnection_events),
  human_economic_burden: n(impact.combined.disconnections_per_1000_service_accounts, anchors.disconnections_per_1000_service_accounts),
  persistence: n(impact.complete_calendar_years, anchors.complete_calendar_years),
  extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('utility_disconnection_risk: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'utility_disconnection_risk',
  method: 'impact_fallback',
  as_of: String(impact.year),
  components,
  raw_inputs: {
    biophysical_burden: { electricity_disconnections: impact.electricity.disconnections, natural_gas_disconnections: impact.natural_gas.disconnections, combined_disconnections: impact.combined.disconnections, normalization_anchors_events: anchors.disconnection_events },
    human_economic_burden: { combined_average_monthly_service_accounts: impact.combined.average_monthly_service_accounts, disconnections_per_1000_service_accounts: impact.combined.disconnections_per_1000_service_accounts, normalization_anchors_per_1000: anchors.disconnections_per_1000_service_accounts },
    persistence: { complete_calendar_years: impact.complete_calendar_years, normalization_anchors_years: anchors.complete_calendar_years },
    extent: { directly_assessed_countries: impact.directly_assessed_countries, directly_assessed_country_count: impact.directly_assessed_country_count, normalization_anchors_countries: anchors.directly_assessed_country_count },
    unscored_context: { combined_final_notices: impact.combined.final_notices, combined_reconnections: impact.combined.reconnections, repeated_account_events_possible: true, electricity_and_gas_household_overlap_possible: true },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, electricity_workbook_sha256: snapshot.sources[0].electricity_workbook_sha256, natural_gas_workbook_sha256: snapshot.sources[0].natural_gas_workbook_sha256, report_sha256: snapshot.sources[1].report_sha256 }
  },
  transformations: [
    { type: 'state_total_extraction', formula: 'For each fuel, sum the 51 State Total rows across all 12 months; do not add utility rows to state totals.' },
    { type: 'exact_nonpayment_filter', formula: 'Use only EIA-112 involuntary residential service disconnections due to bill nonpayment; voluntary terminations are outside the source definition.' },
    { type: 'service_account_rate', formula: 'Divide combined electricity-plus-gas disconnection events by combined average monthly electricity-plus-gas service accounts and multiply by 1,000.' },
    { type: 'deduplication_boundary', formula: 'Do not treat service events as unique households or people and do not subtract reconnections to infer accounts remaining disconnected.' },
    { type: 'bounded_country_extent', formula: 'Normalize the one directly assessed country; 51 state and district totals do not become global coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Complete calendar year ${impact.year}; EIA report released ${snapshot.sources[1].released_at}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'EIA-112 directly quantifies residential electricity and natural-gas disconnections for nonpayment, service-account exposure, a complete calendar year and one-country extent under the exact node contract.',
    higher_priority_failures: ['The survey supplies one U.S. calendar year rather than a defensible current global aggregation.', 'One year cannot meet the 20-annual- or 60-month-observation historical-distribution gate for current_data.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('utility_disconnection_risk: receipt verification failed.');

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_62_eia112_utility_disconnections', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-62.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-62.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
