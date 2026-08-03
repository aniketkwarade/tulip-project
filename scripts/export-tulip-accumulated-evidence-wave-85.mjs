import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/kerala-2018-monsoon-volatility-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.june_1_to_august_19_rainfall_percent_above_normal, anchors.seasonal_rainfall_percent_above_normal),
  human_economic_burden: n(impact.damage_and_loss_usd_billions_approx, anchors.damage_and_loss_usd_billions),
  persistence: n(impact.inclusive_event_day_count, anchors.inclusive_event_day_count),
  extent: n(impact.flooded_district_share_percent_derived, anchors.affected_district_share_percent)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('monsoon_volatility: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'monsoon_volatility', method: 'impact_fallback', as_of: impact.event_end_date, components,
  raw_inputs: {
    biophysical_burden: { june_1_to_august_19_rainfall_percent_above_normal: impact.june_1_to_august_19_rainfall_percent_above_normal, august_first_three_weeks_rainfall_percent_above_normal_unscored: impact.august_first_three_weeks_rainfall_percent_above_normal, normalization_anchors_percent: anchors.seasonal_rainfall_percent_above_normal, anchor_basis: 'IMD rainfall departure categories: normal reference, excess beginning at +20 percent and large excess beginning at +60 percent; +100 percent retained as an extreme doubling anchor.' },
    human_economic_burden: { damage_and_loss_usd_billions_approx: impact.damage_and_loss_usd_billions_approx, people_affected_unscored: impact.people_affected, people_displaced_unscored: impact.people_displaced, deaths_unscored: impact.deaths, roads_destroyed_kilometres_more_than_unscored: impact.roads_destroyed_kilometres_more_than, normalization_anchors_billions: anchors.damage_and_loss_usd_billions },
    persistence: { event_start_date: impact.event_start_date, event_end_date: impact.event_end_date, inclusive_event_day_count: impact.inclusive_event_day_count, normalization_anchors_days: anchors.inclusive_event_day_count },
    extent: { flooded_district_count: impact.flooded_district_count, kerala_district_count: impact.kerala_district_count, flooded_district_share_percent_derived: impact.flooded_district_share_percent_derived, landslide_affected_district_count_unscored: impact.landslide_affected_district_count, normalization_anchors_percent: anchors.affected_district_share_percent },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'kerala_seasonal_departure', formula: 'Normalize the statewide 42-percent above-normal June 1-August 19 rainfall against IMD departure-category anchors; retain the shorter 164-percent August anomaly without double counting.' },
    { type: 'matched_assessed_loss', formula: 'Normalize the approximately USD 3.8 billion damage-and-loss assessment; retain affected, displaced, death and road counts as corroborating burden only.' },
    { type: 'reported_monsoon_disaster_window', formula: 'Count June 1 through August 19 inclusively as 80 days, without implying continuous flooding at every location.' },
    { type: 'district_share', formula: 'Divide 13 flooded districts by Kerala’s 14 districts and normalize the resulting 92.857-percent state extent.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical Kerala monsoon disaster assessed through ${impact.event_end_date}; government, IMD and World Bank records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Kerala, IMD and World Bank records quantify a matched state monsoon anomaly, assessed loss, duration and district-wide extent.', higher_priority_failures: ['The evidence is a historical Kerala event rather than a current global monsoon aggregation.', 'The current reviewed Kerala rainfall-gate pipeline does not yet contain a complete observation season with the required panel and baseline coverage.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`monsoon_volatility: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_85_kerala_2018_monsoon_volatility', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-85.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-85.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
