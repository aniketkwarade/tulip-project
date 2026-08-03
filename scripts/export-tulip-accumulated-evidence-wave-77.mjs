import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fcc-hurricane-maria-mobile-network-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.puerto_rico_peak_cell_sites_out_percent, anchors.peak_cell_sites_out_percent),
  human_economic_burden: n(impact.puerto_rico_population_without_reported_wireless_coverage_percent_2017_10_22, anchors.population_without_reported_wireless_coverage_percent),
  persistence: n(impact.six_month_restoration_duration_months, anchors.restoration_duration_months),
  extent: n(impact.represented_territory_count, anchors.represented_territory_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('mobile_wireless_networks: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'mobile_wireless_networks', method: 'impact_fallback', as_of: impact.six_month_review_date, components,
  raw_inputs: {
    biophysical_burden: { puerto_rico_peak_cell_sites_out_percent: impact.puerto_rico_peak_cell_sites_out_percent, puerto_rico_peak_cell_sites_out_chart_percent: impact.puerto_rico_peak_cell_sites_out_chart_percent, us_virgin_islands_peak_cell_sites_out_percent: impact.us_virgin_islands_peak_cell_sites_out_percent, puerto_rico_municipios_all_cell_sites_out: impact.puerto_rico_municipios_all_cell_sites_out, puerto_rico_total_municipios: impact.puerto_rico_total_municipios, normalization_anchors_percent: anchors.peak_cell_sites_out_percent },
    human_economic_burden: { puerto_rico_population_with_reported_wireless_coverage_percent: impact.puerto_rico_population_with_reported_wireless_coverage_percent_2017_10_22, puerto_rico_population_without_reported_wireless_coverage_percent: impact.puerto_rico_population_without_reported_wireless_coverage_percent_2017_10_22, us_virgin_islands_population_with_reported_wireless_coverage_percent: impact.us_virgin_islands_population_with_reported_wireless_coverage_percent_2017_10_22, normalization_anchors_percent: anchors.population_without_reported_wireless_coverage_percent, boundary: 'Population without reported coverage is 100 minus the FCC Puerto Rico coverage estimate; it is not an individual-level outage census.' },
    persistence: { event_start_date: impact.event_start_date, six_month_review_date: impact.six_month_review_date, restoration_duration_months: impact.six_month_restoration_duration_months, puerto_rico_cell_sites_still_out_percent: impact.puerto_rico_cell_sites_still_out_after_six_months_percent, us_virgin_islands_cell_sites_still_out_percent: impact.us_virgin_islands_cell_sites_still_out_after_six_months_percent, normalization_anchors_months: anchors.restoration_duration_months },
    extent: { represented_territory_count: impact.represented_territory_count, normalization_anchors_territories: anchors.represented_territory_count },
    service_context_unscored: { st_croix_911_call_center_complete_outage_at_least_days: impact.st_croix_911_call_center_complete_outage_at_least_days },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'peak_wireless_site_outage', formula: 'Normalize the FCC report prose value of 95.6 percent of Puerto Rico cell sites out at peak; retain the 95.2 percent chart value as a source discrepancy and do not average territories.' },
    { type: 'reported_population_coverage_gap', formula: 'Derive Puerto Rico population without reported wireless coverage as 100 - 63 = 37 percent from the October 22 FCC estimate; do not treat this as a subscriber outage census.' },
    { type: 'restoration_persistence', formula: 'Normalize the six-month restoration interval documented by the FCC report; retain residual site outages after six months without scoring them twice.' },
    { type: 'bounded_territorial_extent', formula: 'Normalize two represented territories and do not extrapolate this hurricane impact globally.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical Hurricane Maria communications impact through ${impact.six_month_review_date}; FCC records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'FCC administrative reports quantify terrestrial wireless cell-site outages, a population coverage gap, a six-month restoration interval and the bounded territorial footprint.', higher_priority_failures: ['This is a historical two-territory disaster-impact assessment, not a current global mobile-network availability aggregation.', 'No method-comparable global series supplies current site availability plus a recognized threshold or momentum with at least 60 percent current-data coverage.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`mobile_wireless_networks: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_77_fcc_hurricane_maria_mobile_networks', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-77.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-77.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
