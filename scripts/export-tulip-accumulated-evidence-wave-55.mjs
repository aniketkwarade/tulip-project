import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fra-rail-heat-buckling-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact_through_2025;
const anchors = snapshot.source_backed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(impact.t109_report_count, anchors.t109_reports),
  human_economic_burden: n(impact.nominal_reported_damage_usd, anchors.nominal_damage_usd),
  persistence: n(impact.complete_calendar_years, anchors.observed_duration_years),
  extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('rail_heat_buckling: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'rail_heat_buckling',
  method: 'impact_fallback',
  as_of: String(impact.end_year),
  components,
  raw_inputs: {
    biophysical_burden: { cause_code: snapshot.metric_contract.cause_code, cause_definition: snapshot.metric_contract.cause_definition, t109_report_count: impact.t109_report_count, normalization_anchors_reports: anchors.t109_reports },
    human_economic_burden: { nominal_reported_damage_usd: impact.nominal_reported_damage_usd, total_persons_killed: impact.total_persons_killed, total_persons_injured: impact.total_persons_injured, normalization_anchors_nominal_usd: anchors.nominal_damage_usd },
    persistence: { start_year: impact.start_year, end_year: impact.end_year, complete_calendar_years: impact.complete_calendar_years, normalization_anchors_years: anchors.observed_duration_years },
    extent: { states_with_records: impact.states_with_records, directly_assessed_countries: impact.directly_assessed_countries, directly_assessed_country_count: impact.directly_assessed_country_count, normalization_anchors_countries: anchors.directly_assessed_country_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, query_result_sha256: snapshot.sources[0].query_result_sha256, raw_api_rows: snapshot.extraction.raw_api_rows, exact_duplicate_rows_removed: snapshot.extraction.exact_duplicate_rows_removed }
  },
  transformations: [
    { type: 'official_cause_code_filter', formula: 'Select FRA Form 54 rows whose Accident Cause Code is T109, the official buckled/sun-kink alignment code.' },
    { type: 'exact_row_deduplication', formula: 'Remove only exact duplicate selected-field API rows; retain distinct events even when a railroad reused an accident number.' },
    { type: 'complete_year_boundary', formula: 'Aggregate 1975-2025 and exclude the four incomplete 2026 records from all scored totals.' },
    { type: 'nominal_damage_and_casualty_burden', formula: 'Sum reported nominal damage, deaths and injuries without inflation conversion or monetizing casualties.' },
    { type: 'bounded_country_extent', formula: 'Normalize the one directly assessed country; records in all 50 states do not become global coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `FRA API updated ${snapshot.sources[0].data_last_updated}; scored accumulated record ends with complete calendar year ${impact.end_year}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'FRA administrative records quantify buckled/sun-kink accidents, nominal damage, casualties, a 51-year persistence interval and one-country extent under an exact official cause code.',
    higher_priority_failures: ['The source covers the United States rather than a defensible current global aggregation.', 'The node contract includes heat restrictions as well as buckles, while Form 54 contains only reportable accidents above annual thresholds; current-data coverage is therefore incomplete.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('rail_heat_buckling receipt verification failed.');

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_55_fra_rail_heat_buckling', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-55.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-55.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
