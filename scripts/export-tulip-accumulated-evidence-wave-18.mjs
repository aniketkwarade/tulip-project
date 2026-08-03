import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/undrr-global-drought-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'drought_persistence',
  method: 'impact_fallback',
  as_of: String(a.report_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.recorded_drought_count_increase_pct_over_20_years, [0, 10, 25, 50], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.people_affected_decade_to_2017_billion_lower_bound, [0, 0.1, 0.5, 2], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.occurrence_change_period_years, [0, 5, 10, 25], 'higher_is_worse')),
    extent: a.global_region_coverage_normalized
  },
  raw_inputs: {
    biophysical_burden: { recorded_drought_count_increase_pct: a.recorded_drought_count_increase_pct_over_20_years, comparison_period_years: a.occurrence_change_period_years, anchors_pct: [0, 10, 25, 50], boundary: 'Recorded global drought occurrence change; not SPI magnitude or attributable climate trend.' },
    human_economic_burden: { people_affected_billion_lower_bound: a.people_affected_decade_to_2017_billion_lower_bound, recorded_economic_cost_usd_billion_context: a.recorded_economic_cost_decade_to_2017_usd_billion, period: 'decade ending 2017', anchors_billion_people: [0, 0.1, 0.5, 2] },
    persistence: { occurrence_change_period_years: a.occurrence_change_period_years, anchors_years: [0, 5, 10, 25] },
    extent: { geographic_scope: a.geographic_scope, normalized_value: a.global_region_coverage_normalized, boundary: 'Full global-region scope; not the fraction of global land under drought at one time.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'recorded_occurrence_change', formula: 'Normalize the source-reported 29-percent increase in recorded drought occurrence over 20 years through a fixed percentage range.' },
    { type: 'non_additive_human_burden', formula: 'Normalize the source-reported lower-bound population affected in one fixed decade; do not add annual or hotspot populations.' },
    { type: 'global_scope_without_area_inference', formula: 'Use the assessment statement that drought affects countries in every world region; do not infer concurrent land-area coverage.' }
  ],
  source_ids: ['undrr_gar_2025_global_drought_impacts'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNDRR GAR ${a.report_year} global drought assessment; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNDRR quantifies global drought occurrence growth, affected population, a two-decade persistence window and all-region scope.',
    higher_priority_failures: ['The operational Copernicus snapshot is a six-location SPI-6 panel and cannot supply a defensible current global drought-duration aggregation.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for drought_persistence.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_18_undrr_global_drought', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'undrr_gar_2025_global_drought_impacts', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-18.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-18.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
