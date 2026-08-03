import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/california-2020-lightning-fire-weather-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.lightning_strikes_per_square_kilometre_derived, anchors.lightning_strikes_per_square_kilometre_per_event),
  human_economic_burden: n(impact.structures_destroyed_more_than, anchors.structures_destroyed),
  persistence: n(impact.inclusive_event_day_count, anchors.inclusive_event_day_count),
  extent: n(impact.presidential_major_disaster_declared_counties, anchors.major_disaster_declared_counties)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('lightning_fire_weather: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'lightning_fire_weather', method: 'impact_fallback', as_of: impact.event_end_date, components,
  raw_inputs: {
    biophysical_burden: { lightning_strikes_approx: impact.lightning_strikes_approx, california_land_area_square_miles: impact.california_land_area_square_miles, california_land_area_square_kilometres_derived: impact.california_land_area_square_kilometres_derived, lightning_strikes_per_square_kilometre_derived: impact.lightning_strikes_per_square_kilometre_derived, wildfires_more_than: impact.wildfires_more_than, acres_burned_approx: impact.acres_burned_approx, normalization_anchors_density: anchors.lightning_strikes_per_square_kilometre_per_event },
    human_economic_burden: { structures_destroyed_more_than: impact.structures_destroyed_more_than, fatalities_unscored: impact.fatalities, normalization_anchors_structures: anchors.structures_destroyed, boundary: 'Structures use the CAL FIRE response boundary; fatalities are retained but not independently scored.' },
    persistence: { event_start_date: impact.event_start_date, event_end_date: impact.event_end_date, inclusive_event_day_count: impact.inclusive_event_day_count, normalization_anchors_days: anchors.inclusive_event_day_count },
    extent: { presidential_major_disaster_declared_counties: impact.presidential_major_disaster_declared_counties, normalization_anchors_counties: anchors.major_disaster_declared_counties },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'statewide_event_strike_density', formula: 'Convert 155,858.33 square miles to square kilometres and divide the approximately 14,000 agency-reported siege strikes by that declared state land area; retain the result as a spatial average.' },
    { type: 'bounded_realized_burden', formula: 'Normalize the more-than-6,900 structures destroyed within the CAL FIRE response boundary; retain 26 fatalities as unscored corroborating burden.' },
    { type: 'agency_defined_siege_duration', formula: 'Count the Board of Forestry-defined August 15-30 siege period inclusively as 16 days.' },
    { type: 'conservative_declared_extent', formula: 'Normalize the seven counties in the August 22 presidential major-disaster declaration, excluding later September declarations.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical lightning siege assessed through ${impact.event_end_date}; agency records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'State fire records quantify an agency-defined dry-lightning siege, strike density, ignitions, realized structure loss, duration and a conservative declared-county extent.', higher_priority_failures: ['The evidence is a historical California event rather than a current global dry-lightning aggregation.', 'No globally comparable current series pairs declared fire-weather conditions with observed lightning density, impacts and exposure at the required coverage.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`lightning_fire_weather: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_83_california_2020_lightning_siege', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-83.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-83.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
