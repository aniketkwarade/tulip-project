import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/south-lhonak-glacier-calving-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.calved_ice_volume_million_cubic_metres_derived, anchors.calved_ice_volume_million_cubic_metres),
  human_economic_burden: n(impact.affected_population, anchors.affected_population),
  persistence: n(impact.large_calving_events_since_2017, anchors.repeated_large_calving_events),
  extent: n(impact.affected_districts, anchors.affected_districts)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('glacier_calving_events: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'glacier_calving_events', method: 'impact_fallback', as_of: '2023-10-29', components,
  raw_inputs: {
    biophysical_burden: { calved_ice_volume_cubic_metres_approximate: impact.calved_ice_volume_cubic_metres_approximate, calved_ice_volume_million_cubic_metres_derived: impact.calved_ice_volume_million_cubic_metres_derived, immediate_front_retreat_metres: impact.immediate_front_retreat_metres, immediate_front_retreat_uncertainty_metres: impact.immediate_front_retreat_uncertainty_metres, event_sequence_retreat_metres_minimum: impact.event_sequence_retreat_metres_minimum, normalization_anchors_million_cubic_metres: anchors.calved_ice_volume_million_cubic_metres },
    human_economic_burden: { affected_population: impact.affected_population, confirmed_deaths_in_sikkim: impact.confirmed_deaths_in_sikkim, missing_people: impact.missing_people, damaged_houses: impact.damaged_houses, damaged_bridges: impact.damaged_bridges, normalization_anchors_people: anchors.affected_population },
    persistence: { first_event_year: 2017, final_event_year: 2023, large_calving_events_since_2017: impact.large_calving_events_since_2017, normalization_anchors_events: anchors.repeated_large_calving_events },
    extent: { affected_districts: impact.affected_districts, affected_villages_or_wards: impact.affected_villages_or_wards, normalization_anchors_districts: anchors.affected_districts },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'event_bounded_calved_ice_volume', formula: 'Convert approximately 7,000,000 cubic metres of study-reported calved ice to 7 million cubic metres and normalize without adding the separately reported landslide-debris volume.' },
    { type: 'official_downstream_burden', formula: 'Normalize the official 88,400-person affected tally; retain deaths, missing people, houses and bridges as corroborating burden fields rather than summing unlike quantities.' },
    { type: 'repeated_event_persistence', formula: 'Normalize seven large calving events documented since 2017; do not infer a global calving-frequency trend.' },
    { type: 'event_extent', formula: 'Normalize four officially affected Sikkim districts and retain 100 villages or wards as a separate boundary field.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `October 2023 event observations and official 29 October 2023 impact tally reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Primary event reconstructions quantify front retreat, calved-ice volume and repeated calving, while the official disaster report quantifies the bounded downstream population and infrastructure burden.', higher_priority_failures: ['The evidence is a named glacier and disaster boundary, not a defensible global current aggregation.', 'The glacier-specific record does not provide at least 20 complete annual or 60 monthly global observations for historical-percentile normalization.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`glacier_calving_events: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_95_south_lhonak_glacier_calving', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-95.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-95.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
