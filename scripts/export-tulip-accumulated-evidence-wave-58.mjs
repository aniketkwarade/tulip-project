import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/noaa-transport-avalanche-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact_through_2025;
const anchors = snapshot.shared_storm_inventory_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.qualifying_event_records, anchors.accumulated_event_count),
  human_economic_burden: n(impact.total_reported_damage_usd, anchors.total_reported_damage_usd),
  persistence: n(impact.years_with_qualifying_records, anchors.years_with_qualifying_records),
  extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('mountain_pass_avalanches: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'mountain_pass_avalanches',
  method: 'impact_fallback',
  as_of: String(impact.end_year),
  components,
  raw_inputs: {
    biophysical_burden: { qualifying_event_records: impact.qualifying_event_records, event_ids: impact.event_ids, normalization_anchors_events: anchors.accumulated_event_count },
    human_economic_burden: { injuries: impact.injuries, deaths: impact.deaths, total_reported_damage_usd: impact.total_reported_damage_usd, normalization_anchors_usd: anchors.total_reported_damage_usd },
    persistence: { start_year: impact.start_year, end_year: impact.end_year, observation_window_years: impact.observation_window_years, years_with_qualifying_records: impact.years_with_qualifying_records, normalization_anchors_years: anchors.years_with_qualifying_records },
    extent: { states_with_qualifying_records: impact.states_with_qualifying_records, directly_assessed_countries: impact.directly_assessed_countries, directly_assessed_country_count: impact.directly_assessed_country_count, normalization_anchors_countries: anchors.directly_assessed_country_count },
    annual_observations: snapshot.annual,
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, file_hashes: snapshot.sources[0].file_hashes }
  },
  transformations: [
    { type: 'exact_event_type_filter', formula: 'Select NOAA Storm Events rows whose EVENT_TYPE exactly equals Avalanche.' },
    { type: 'bounded_transport_text_filter', formula: 'Require explicit avalanche language, a road/highway/interstate/route/lane identifier, and an impact term in the combined location and event narrative.' },
    { type: 'complete_year_boundary', formula: 'Aggregate complete calendar years 2020-2025 and retain 2020 as a zero-event observation, not missing source data.' },
    { type: 'shared_inventory_anchors', formula: 'Use the same event, damage, persistence and country anchors as the broader NOAA storm-event wave so a small text-derived subset cannot self-saturate.' },
    { type: 'bounded_country_extent', formula: 'Normalize the one directly assessed country; ten states do not become global coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `NOAA bulk files revised through 2026-07-28; scored period ends with complete calendar year ${impact.end_year}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'A deterministic NOAA event/narrative filter quantifies accumulated avalanche intersections with named U.S. transport corridors, injuries, reported damage, five-year persistence and one-country extent.',
    higher_priority_failures: ['The source is restricted to the United States rather than a defensible current global transport-corridor aggregation.', 'Administrative narratives do not provide a global current avalanche frequency, closure-hours threshold and momentum series.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('mountain_pass_avalanches: receipt verification failed.');

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_58_noaa_transport_avalanche', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-58.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-58.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
