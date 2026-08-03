import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/noaa-january-2021-atmospheric-river-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.integrated_vapor_transport_kg_m_s_max, anchors.peak_integrated_vapor_transport_kg_m_s),
  human_economic_burden: n(impact.damage_usd_cpi_adjusted_billions, anchors.damage_usd_cpi_adjusted_billions),
  persistence: n(impact.inclusive_event_day_count, anchors.inclusive_event_day_count),
  extent: n(impact.counties_with_rainfall_above_15_inches, anchors.counties_with_extreme_rainfall)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('atmospheric_river_intensification: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'atmospheric_river_intensification', method: 'impact_fallback', as_of: impact.event_end_date, components,
  raw_inputs: {
    biophysical_burden: { integrated_vapor_transport_kg_m_s_min: impact.integrated_vapor_transport_kg_m_s_min, integrated_vapor_transport_kg_m_s_max: impact.integrated_vapor_transport_kg_m_s_max, integrated_vapor_transport_duration_hours_min: impact.integrated_vapor_transport_duration_hours_min, integrated_vapor_transport_duration_hours_max: impact.integrated_vapor_transport_duration_hours_max, standard_deviations_above_mean_range: [impact.integrated_vapor_transport_standard_deviations_above_mean_min, impact.integrated_vapor_transport_standard_deviations_above_mean_max], atmospheric_river_category: impact.atmospheric_river_category, normalization_anchors_kg_m_s: anchors.peak_integrated_vapor_transport_kg_m_s },
    human_economic_burden: { damage_usd_cpi_adjusted_billions: impact.damage_usd_cpi_adjusted_billions, deaths_unscored: impact.deaths, normalization_anchors_billions: anchors.damage_usd_cpi_adjusted_billions },
    persistence: { event_start_date: impact.event_start_date, event_end_date: impact.event_end_date, inclusive_event_day_count: impact.inclusive_event_day_count, high_ivt_duration_hours_range: [impact.integrated_vapor_transport_duration_hours_min, impact.integrated_vapor_transport_duration_hours_max], normalization_anchors_days: anchors.inclusive_event_day_count },
    extent: { counties_with_rainfall_above_15_inches: impact.counties_with_rainfall_above_15_inches, normalization_anchors_counties: anchors.counties_with_extreme_rainfall, boundary: 'Conservative extreme-rainfall footprint; not the full statewide disaster extent.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'corridor_peak_ivt', formula: 'Normalize 700 kg/m/s, the upper end of WPC’s observed central-coast IVT range, while retaining the 500-700 range, 24-48-hour duration, four-to-five-standard-deviation departure and category-2 label.' },
    { type: 'matched_disaster_burden', formula: 'Normalize NCEI’s USD 1.3 billion CPI-adjusted event loss; retain two deaths without adding separate urgency points.' },
    { type: 'ncei_event_window', formula: 'Count January 24-29 inclusively as six disaster-event days while keeping the shorter high-IVT interval explicit.' },
    { type: 'conservative_extreme_rainfall_extent', formula: 'Normalize the two named counties with rainfall above 15 inches rather than inferring a county count from the statewide impact narrative.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical atmospheric-river disaster assessed through ${impact.event_end_date}; NOAA records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Matched NOAA meteorological and disaster records quantify IVT intensity, named scale and duration alongside realized damage and conservative observed extent.', higher_priority_failures: ['The evidence is a historical California event rather than a current global atmospheric-river catalog aggregation.', 'A globally comparable current series with consistent detection algorithm, IVT intensity, momentum and exposed-area coverage is not available.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`atmospheric_river_intensification: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_84_noaa_january_2021_atmospheric_river', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-84.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-84.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
