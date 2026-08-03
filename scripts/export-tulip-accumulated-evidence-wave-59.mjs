import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/bts-airport-weather-disruption-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact_2025;
const anchors = snapshot.source_backed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.weather_attributed_delayed_flight_equivalents, anchors.weather_attributed_delayed_flight_equivalents),
  human_economic_burden: n(impact.weather_delay_minutes, anchors.weather_delay_minutes),
  persistence: n(impact.complete_calendar_years, anchors.complete_calendar_years),
  extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('airport_operational_disruption: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'airport_operational_disruption',
  method: 'impact_fallback',
  as_of: String(impact.year),
  components,
  raw_inputs: {
    biophysical_burden: { weather_attributed_delayed_flight_equivalents: impact.weather_attributed_delayed_flight_equivalents, normalization_anchors_flight_equivalents: anchors.weather_attributed_delayed_flight_equivalents },
    human_economic_burden: { weather_delay_minutes: impact.weather_delay_minutes, normalization_anchors_delay_minutes: anchors.weather_delay_minutes },
    persistence: { complete_calendar_years: impact.complete_calendar_years, normalization_anchors_years: anchors.complete_calendar_years },
    extent: { distinct_airports: impact.distinct_airports, distinct_reporting_carriers: impact.distinct_reporting_carriers, directly_assessed_countries: impact.directly_assessed_countries, directly_assessed_country_count: impact.directly_assessed_country_count, normalization_anchors_countries: anchors.directly_assessed_country_count },
    unscored_context: { arrival_flights: impact.arrival_flights, arrivals_delayed_at_least_15_minutes: impact.arrivals_delayed_at_least_15_minutes, cancellations_excluded_because_weather_cause_not_allocated: true },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, archive_sha256: snapshot.sources[0].archive_sha256, extracted_csv_sha256: snapshot.sources[0].extracted_csv_sha256, csv_rows: snapshot.extraction.csv_rows }
  },
  transformations: [
    { type: 'complete_year_filter', formula: 'Retain carrier-airport-month rows for all 12 months of calendar year 2025.' },
    { type: 'weather_cause_aggregation', formula: 'Sum BTS weather_ct prorated delayed-flight equivalents and weather_delay minutes across all reporting carrier-airport rows.' },
    { type: 'cancellation_exclusion', formula: 'Do not score arr_cancelled because the downloaded table does not allocate each cancellation to weather.' },
    { type: 'bounded_network_extent', formula: 'Retain 364 airports and 21 carriers as U.S. network coverage; normalize only the one directly assessed country.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Complete calendar year ${impact.year}; raw table downloaded ${snapshot.sources[0].downloaded_at}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'BTS administrative records quantify weather-attributed delayed-flight equivalents, delay minutes, one complete year of burden and one-country network extent without inferring cancellation cause.',
    higher_priority_failures: ['The dataset covers the United States scheduled airline network rather than a defensible current global airport aggregation.', 'One year of U.S. carrier-airport data does not provide the global historical distribution required for a current magnitude, threshold and momentum score.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('airport_operational_disruption: receipt verification failed.');

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_59_bts_airport_weather_disruption', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-59.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-59.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
