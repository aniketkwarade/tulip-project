import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/noaa-storm-events-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const anchors = snapshot.shared_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));

const receipts = Object.values(snapshot.assessments).map(impact => {
  const components = {
    biophysical_burden: n(impact.event_count, anchors.accumulated_event_count),
    human_economic_burden: n(impact.total_reported_damage_usd, anchors.total_reported_damage_usd),
    persistence: n(impact.observed_years, anchors.observed_years),
    extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_country_count)
  };
  if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error(`${impact.node_id}: accumulated-impact gate failed.`);

  const receipt = buildTulipUrgencyReceipt({
    node_id: impact.node_id,
    method: 'impact_fallback',
    as_of: String(impact.end_year),
    components,
    raw_inputs: {
      biophysical_burden: { event_type: impact.event_type, event_count: impact.event_count, normalization_anchors_events: anchors.accumulated_event_count },
      human_economic_burden: { injuries: impact.injuries, deaths: impact.deaths, property_damage_usd: impact.property_damage_usd, crop_damage_usd: impact.crop_damage_usd, total_reported_damage_usd: impact.total_reported_damage_usd, normalization_anchors_usd: anchors.total_reported_damage_usd },
      persistence: { start_year: impact.start_year, end_year: impact.end_year, observed_years: impact.observed_years, normalization_anchors_years: anchors.observed_years },
      extent: { reporting_areas: impact.reporting_areas, directly_assessed_countries: impact.directly_assessed_countries, directly_assessed_country_count: impact.directly_assessed_country_count, normalization_anchors_countries: anchors.directly_assessed_country_count },
      annual_observations: impact.annual,
      source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, file_hashes: snapshot.sources[0].files.map(file => ({ year: file.year, sha256: file.sha256 })) }
    },
    transformations: [
      { type: 'official_event_type_filter', formula: `Select NOAA Storm Events detail rows whose EVENT_TYPE exactly equals ${impact.event_type}.` },
      { type: 'complete_year_boundary', formula: 'Aggregate complete calendar years 2020-2025; do not include partial 2026 records.' },
      { type: 'damage_suffix_conversion', formula: 'Convert reported K, M, B and T property/crop damage suffixes to nominal U.S. dollars; preserve missing reports as missing evidence.' },
      { type: 'casualty_accounting', formula: 'Sum direct and indirect injuries and deaths separately; do not monetize casualties.' },
      { type: 'shared_inventory_anchors', formula: 'Apply the same event-count, reported-damage, persistence and country anchors across all three event types; source count and reporting volume do not add urgency points.' },
      { type: 'bounded_country_extent', formula: 'Normalize the one directly assessed country; states and territories remain reporting areas rather than independent countries.' },
      { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
    ],
    source_ids: snapshot.sources.map(source => source.id),
    uncertainty: snapshot.uncertainty,
    freshness: `NOAA bulk files revised through ${snapshot.sources[0].files.at(-1).filename}; scored period ends with complete calendar year ${impact.end_year}; snapshot reviewed ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `NOAA administrative records quantify accumulated ${impact.event_type.toLowerCase()} events, casualties, nominal property and crop damage, six-year persistence and one-country extent.`,
      higher_priority_failures: [`The records cover the United States and territories rather than a defensible current global aggregation for ${impact.metric_id}.`, 'Administrative event reports do not provide the global sensor-derived magnitude, threshold and momentum series required for current-data scoring.']
    }
  });
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`${impact.node_id}: receipt verification failed.`);
  return receipt;
});

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_57_noaa_storm_events', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-57.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-57.json', promoted_node_count: receipts.length, receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
