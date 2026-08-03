import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/great-london-smog-soot-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.daily_smoke_concentration_peak_ug_m3, anchors.historical_daily_smoke_concentration_ug_m3),
  human_economic_burden: n(impact.estimated_excess_deaths_at_least, anchors.excess_death_count),
  persistence: n(impact.event_duration_days, anchors.event_duration_days),
  extent: n(impact.represented_city_count, anchors.represented_city_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('particulate_soot_levels: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'particulate_soot_levels', method: 'impact_fallback', as_of: impact.event_end_date, components,
  raw_inputs: {
    biophysical_burden: { historical_daily_smoke_concentration_peak_ug_m3: impact.daily_smoke_concentration_peak_ug_m3, pre_event_daily_smoke_concentration_ug_m3: impact.daily_smoke_concentration_pre_event_1952_12_04_ug_m3, normalization_anchors_ug_m3: anchors.historical_daily_smoke_concentration_ug_m3, method_boundary: 'Historical smoke mass concentration; not relabeled as modern black carbon, elemental carbon, PM2.5 or PM10.' },
    human_economic_burden: { estimated_excess_deaths_at_least: impact.estimated_excess_deaths_at_least, registered_deaths_week_ending_1952_12_13: impact.registered_deaths_week_ending_1952_12_13, respiratory_emergency_bed_applications: impact.respiratory_emergency_bed_applications, normalization_anchors_deaths: anchors.excess_death_count, boundary: 'The conservative official excess-death estimate is scored; registrations and bed requests remain unscored context.' },
    persistence: { event_start_date: impact.event_start_date, event_end_date: impact.event_end_date, event_duration_days: impact.event_duration_days, normalization_anchors_days: anchors.event_duration_days },
    extent: { represented_city_count: impact.represented_city_count, represented_city: impact.represented_city, represented_country: impact.represented_country, normalization_anchors_cities: anchors.represented_city_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'historical_smoke_concentration', formula: 'Normalize the separately measured 4,460 micrograms per cubic metre daily smoke peak; do not add or blend the sulfur-dioxide concentration.' },
    { type: 'conservative_excess_mortality', formula: 'Normalize the official estimate of at least 4,000 excess deaths and retain later higher estimates outside the scored input.' },
    { type: 'observed_event_duration', formula: 'Count five calendar days from December 5 through December 9, 1952 inclusive.' },
    { type: 'bounded_metropolitan_extent', formula: 'Normalize one represented metropolitan city and do not extrapolate the London event nationally or globally.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical smoke episode ending ${impact.event_end_date}; official retrospective and archival records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Greater London and UK archival records quantify an ambient smoke concentration, excess mortality, five-day duration and metropolitan extent without substituting emissions for concentration.', higher_priority_failures: ['This is a historical metropolitan smoke event, not a current global black-carbon or elemental-carbon monitoring aggregation.', 'Historical smoke measurements are not method-comparable with enough modern global observations to construct the required current magnitude and threshold or momentum coverage.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`particulate_soot_levels: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_79_great_london_smog_particulate_soot', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-79.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-79.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
