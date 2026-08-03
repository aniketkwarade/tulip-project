import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/usgs-1978-runoff-surge-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.derived_peak_to_antecedent_flow_ratio, anchors.peak_to_antecedent_flow_ratio),
  human_economic_burden: n(impact.documented_damage_usd_nominal_1978_more_than, anchors.documented_damage_usd_nominal),
  persistence: n(impact.inclusive_event_day_count, anchors.inclusive_event_day_count),
  extent: n(impact.disaster_declared_counties, anchors.disaster_declared_counties)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('hydrological_runoff_surges: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'hydrological_runoff_surges', method: 'impact_fallback', as_of: impact.event_end_date, components,
  raw_inputs: {
    biophysical_burden: { antecedent_discharge_cubic_feet_per_second: impact.antecedent_discharge_cubic_feet_per_second, peak_discharge_cubic_feet_per_second: impact.peak_discharge_cubic_feet_per_second, derived_peak_to_antecedent_flow_ratio: impact.derived_peak_to_antecedent_flow_ratio, normalization_anchors_ratio: anchors.peak_to_antecedent_flow_ratio, boundary: 'Paired values from Goose Creek below Sheridan site 50 only.' },
    human_economic_burden: { documented_damage_usd_nominal_1978_more_than: impact.documented_damage_usd_nominal_1978_more_than, normalization_anchors_nominal_usd: anchors.documented_damage_usd_nominal, boundary: 'Two-state event lower bound in nominal 1978 dollars; not assigned to the representative gauge.' },
    persistence: { event_start_date: impact.event_start_date, event_end_date: impact.event_end_date, inclusive_event_day_count: impact.inclusive_event_day_count, normalization_anchors_days: anchors.inclusive_event_day_count },
    extent: { disaster_declared_counties: impact.disaster_declared_counties, affected_state_count: impact.affected_state_count, normalization_anchors_counties: anchors.disaster_declared_counties },
    unscored_context: { named_major_drainage_count: impact.named_major_drainage_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'within_gauge_peak_to_antecedent_ratio', formula: 'Divide the Goose Creek site-50 peak discharge of 5,430 ft3/s by its pre-rise antecedent observation of 1,180 ft3/s; do not transfer the resulting ratio to other gauges or basins.' },
    { type: 'historical_damage_lower_bound', formula: 'Normalize the documented more-than-USD-33-million nominal 1978 event damage without inflation adjustment or allocation to the representative gauge.' },
    { type: 'inclusive_event_window', formula: 'Count May 16 through May 23 inclusively as eight documented event-reporting days; do not imply continuous flooding at each site.' },
    { type: 'administrative_extent', formula: 'Normalize the 19 federally declared major-disaster counties while retaining two states and four named drainages as unscored context.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical flood assessed through ${impact.event_end_date}; USGS record reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'A USGS event report pairs pre-rise and peak discharge at one gauge with quantitative two-state damage, duration and declared-county extent.', higher_priority_failures: ['The evidence is a historical regional flood event, not a current global aggregation of runoff-surge magnitude, threshold, momentum and exposure.', 'No globally comparable current observation series provides the required peak-to-antecedent-flow coverage across basins.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`hydrological_runoff_surges: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_82_usgs_1978_runoff_surge', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-82.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-82.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
