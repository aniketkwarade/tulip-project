import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/china-acid-deposition-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.latest_mean_acid_rain_frequency_percent, anchors.acid_rain_frequency_percent),
  human_economic_burden: n(impact.modeled_material_loss_rmb_billions_2013, anchors.modeled_material_loss_rmb_billions),
  persistence: n(impact.documented_monitoring_span_years_derived, anchors.documented_monitoring_span_years),
  extent: n(impact.latest_acid_rain_area_share_percent, anchors.affected_land_area_share_percent)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('acid_rain_deposition: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'acid_rain_deposition', method: 'impact_fallback', as_of: '2020', components,
  raw_inputs: {
    biophysical_burden: { latest_mean_acid_rain_frequency_percent: impact.latest_mean_acid_rain_frequency_percent, latest_monitored_cities_districts_counties: impact.latest_monitored_cities_districts_counties, precipitation_ph_threshold: 5.6, normalization_anchors_percent: anchors.acid_rain_frequency_percent },
    human_economic_burden: { modeled_material_loss_rmb_billions_2013: impact.modeled_material_loss_rmb_billions_2013, modeled_material_loss_gdp_share_percent_2013: impact.modeled_material_loss_gdp_share_percent_2013, modeled_material_loss_pollution_control_investment_share_percent_2013: impact.modeled_material_loss_pollution_control_investment_share_percent_2013, normalization_anchors_rmb_billions: anchors.modeled_material_loss_rmb_billions },
    persistence: { first_documented_national_monitoring_year: impact.first_documented_national_monitoring_year, latest_documented_national_monitoring_year: impact.latest_documented_national_monitoring_year, documented_monitoring_span_years_derived: impact.documented_monitoring_span_years_derived, normalization_anchors_years: anchors.documented_monitoring_span_years },
    extent: { latest_acid_rain_area_square_kilometres: impact.latest_acid_rain_area_square_kilometres, latest_acid_rain_area_share_percent: impact.latest_acid_rain_area_share_percent, latest_year_over_year_area_change_percentage_points: impact.latest_year_over_year_area_change_percentage_points, normalization_anchors_percent: anchors.affected_land_area_share_percent },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'official_acid_rain_frequency', formula: 'Normalize the official 10.3% mean acid-rain frequency across 465 monitored jurisdictions using the pH < 5.6 threshold.' },
    { type: 'modeled_material_loss', formula: 'Normalize the study-estimated RMB 32.165-billion 2013 material loss; do not treat it as audited expenditure or add GDP and pollution-control-investment shares as separate burden.' },
    { type: 'documented_monitoring_span', formula: 'Calculate 2020 - 2003 = 17 years between official national monitoring bulletins; do not assert a complete unchanged station panel.' },
    { type: 'official_affected_area', formula: 'Normalize the official 4.8% national land-area share affected by acid rain in 2020 and retain the 466,000-square-kilometre area separately.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Official 2020 deposition condition and 2013 national material-loss assessment reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Official precipitation-pH monitoring quantifies frequency, duration and affected area, while a national monitoring-network study quantifies material corrosion loss.', higher_priority_failures: ['The assessment boundary is China rather than a defensible global current aggregation.', 'The endpoint bulletins do not establish at least 20 complete annual observations for a stable national station panel, and the monetary burden refers to 2013 rather than the latest condition year.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`acid_rain_deposition: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_96_china_acid_deposition', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-96.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-96.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
