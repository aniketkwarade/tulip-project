import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-flood-exposure-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const observed = a.observational_study;
const exposure = a.probability_zone_study;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'floodplain_exposure',
  method: 'impact_fallback',
  as_of: String(observed.observation_end_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(observed.total_observed_inundation_area_million_km2, [0, 0.5, 2, 5], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(observed.directly_affected_population_midpoint_million, [0, 100, 300, 1000], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(observed.observation_period_years, [0, 5, 10, 20], 'higher_is_worse')),
    extent: a.global_extent_normalized
  },
  raw_inputs: {
    biophysical_burden: { total_observed_inundation_area_million_km2: observed.total_observed_inundation_area_million_km2, quality_controlled_large_flood_events: observed.quality_controlled_large_flood_events, anchors_million_km2: [0, 0.5, 2, 5], boundary: 'Accumulated satellite-observed inundation across catalogued large events; overlapping event footprints are not interpreted as unique land area.' },
    human_economic_burden: { directly_affected_population_lower_million: observed.directly_affected_population_lower_million, directly_affected_population_upper_million: observed.directly_affected_population_upper_million, range_midpoint_million: observed.directly_affected_population_midpoint_million, anchors_million_people: [0, 100, 300, 1000], boundary: 'Source-estimated people directly affected by observed events, not the modeled population living in probability zones.' },
    persistence: { observation_start_year: observed.observation_start_year, observation_end_year: observed.observation_end_year, observation_period_years: observed.observation_period_years, anchors_years: [0, 5, 10, 20] },
    extent: { geographic_scope: a.geographic_scope, normalized_value: a.global_extent_normalized, quality_control_boundary: snapshot.uncertainty },
    current_exposure_context_excluded_from_scoring: { countries: exposure.countries, covered_population_billion: exposure.covered_population_billion, return_period_years: exposure.return_period_years, minimum_inundation_depth_m: exposure.minimum_inundation_depth_m, exposed_population_billion: exposure.exposed_population_billion, exposed_world_population_pct: exposure.exposed_world_population_pct, exposed_below_5_50_usd_population_million: exposure.exposed_below_5_50_usd_population_million, evidence_class: exposure.evidence_class },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_separation_rule: a.source_separation_rule, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'observed_accumulated_inundation', formula: 'Normalize the source-reported 2.23 million km2 accumulated inundation across 913 quality-controlled large events; do not deduplicate or reinterpret it as current floodplain area.' },
    { type: 'observed_affected_population_midpoint', formula: 'Use the midpoint of the source-reported 255-290 million affected-population range while retaining both bounds.' },
    { type: 'fixed_observation_period', formula: 'Normalize the 2000-2018 observation span once; no annual trend or projection is inferred.' },
    { type: 'global_study_extent', formula: 'Use global scope while retaining the event-selection and quality-control omissions; missing floods never become zero.' }
  ],
  source_ids: ['global_flood_exposure_observation_and_poverty_studies'],
  uncertainty: snapshot.uncertainty,
  freshness: `Satellite event observations through ${observed.observation_end_year}; ${exposure.population_reference_year} population exposure assessment published ${exposure.publication_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The global satellite study quantifies accumulated inundation area, directly affected population, an 18-year observation window and global event extent. The 188-country assessment independently confirms that the metric is population inside a declared flood-probability and depth zone.',
    higher_priority_failures: ['The operational Aqueduct snapshot serves baseline water stress, not flood-zone exposure.', 'The observational event record ends in 2018 and is not a current 20-year annual or 60-month global panel; the 2020 probability-zone exposure is modeled and is retained as context rather than silently scored as current observation.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for floodplain_exposure.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_24_global_flood_exposure', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'global_flood_exposure_observation_and_poverty_studies', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-24.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-24.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
