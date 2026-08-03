import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/northeast-1996-rain-on-snow-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.maximum_crest_above_flood_stage_feet, anchors.crest_above_flood_stage_feet),
  human_economic_burden: n(impact.road_and_bridge_damage_usd_more_than, anchors.road_and_bridge_damage_usd),
  persistence: n(impact.peak_duration_days, anchors.peak_duration_days),
  extent: n(impact.represented_major_river_basin_count, anchors.represented_major_river_basin_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('rain_on_snow_flood_risk: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'rain_on_snow_flood_risk', method: 'impact_fallback', as_of: impact.peak_end_date, components,
  raw_inputs: {
    biophysical_burden: { maximum_crest_above_flood_stage_feet: impact.maximum_crest_above_flood_stage_feet, potomac_point_of_rocks_peak_cfs: impact.potomac_point_of_rocks_peak_cfs, susquehanna_harrisburg_peak_cfs: impact.susquehanna_harrisburg_peak_cfs, rainfall_local_maximum_inches: impact.rainfall_local_maximum_inches, snowpack_water_equivalent_range_inches: [impact.snowpack_water_equivalent_min_inches, impact.snowpack_water_equivalent_max_inches], normalization_anchors_feet: anchors.crest_above_flood_stage_feet },
    human_economic_burden: { road_and_bridge_damage_usd_more_than: impact.road_and_bridge_damage_usd_more_than, deaths: impact.deaths, people_forced_from_homes_more_than: impact.people_forced_from_homes_more_than, normalization_anchors_usd: anchors.road_and_bridge_damage_usd, boundary: 'Infrastructure damage is the scored lower bound; deaths and displacement remain unscored context.' },
    persistence: { peak_start_date: impact.peak_start_date, peak_end_date: impact.peak_end_date, peak_duration_days: impact.peak_duration_days, normalization_anchors_days: anchors.peak_duration_days },
    extent: { represented_major_river_basin_count: impact.represented_major_river_basin_count, represented_country: impact.represented_country, normalization_anchors_basins: anchors.represented_major_river_basin_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'confirmed_flood_threshold', formula: 'Normalize the source-reported maximum crest of 20 feet above named flood stage; retain two measured peak-streamflow examples and the rain/snow sequence without averaging unlike gauges.' },
    { type: 'infrastructure_damage_lower_bound', formula: 'Use USD 500 million as the conservative numeric value for more-than-USD-500-million highway and bridge damage; do not label it total regional damage.' },
    { type: 'observed_peak_duration', formula: 'Count three calendar days from January 19 through January 21, when monitored stages and discharges peaked.' },
    { type: 'bounded_basin_extent', formula: 'Normalize the five named major river basins; do not interpret them as global coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical confirmed flood ending ${impact.peak_end_date}; federal reports reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'NOAA and USGS jointly document the snowpack, rain and thaw sequence, observed flood-stage exceedance and streamflow, impacts, duration and named multi-basin extent.', higher_priority_failures: ['This is a historical regional accumulated-impact event, not a current global rain-on-snow flood aggregation.', 'No method-comparable global annual or monthly series supplies current magnitude plus threshold or momentum coverage.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`rain_on_snow_flood_risk: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_76_northeast_1996_rain_on_snow_flood', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-76.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-76.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
