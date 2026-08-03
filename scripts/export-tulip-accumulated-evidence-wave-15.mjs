import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/unep-unwater-freshwater-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const receipts = [];

receipts.push(buildTulipUrgencyReceipt({
  node_id: 'freshwater_ecosystem_collapse',
  method: 'impact_fallback',
  as_of: String(a.assessment_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.freshwater_species_population_decline_pct, [0, 20, 50, 90], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.people_in_reduced_flow_basins_million, [0, 10, 50, 250], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.freshwater_decline_persistence_years, [0, 10, 30, 60], 'higher_is_worse')),
    extent: round(a.countries_with_degradation_pct / 100)
  },
  raw_inputs: {
    biophysical_burden: { freshwater_species_population_decline_pct: a.freshwater_species_population_decline_pct, reference_year: a.freshwater_species_population_decline_reference_year, anchors_pct: [0, 20, 50, 90], boundary: 'Global average population-index decline cited by the assessment; not the share of species extinct or the condition of every water body.' },
    human_economic_burden: { people_in_reduced_flow_basins_million: a.people_in_reduced_flow_basins_million, people_in_receding_surface_water_basins_million_context_only: a.people_in_receding_surface_water_basins_million, anchors_million_people: [0, 10, 50, 250], non_addition_rule: 'Score the larger source population envelope only because the two basin populations may overlap.' },
    persistence: { reference_year: a.freshwater_species_population_decline_reference_year, assessment_year: a.assessment_year, persistence_years: a.freshwater_decline_persistence_years, anchors_years: [0, 10, 30, 60] },
    extent: { countries_reporting: a.countries_reporting, countries_with_one_or_more_degraded_types_lower_bound: a.countries_with_one_or_more_degraded_water_related_ecosystem_types_lower_bound, source_reported_degradation_pct: a.countries_with_degradation_pct, normalized_value: round(a.countries_with_degradation_pct / 100), boundary: 'Country share with at least one degraded water-related ecosystem type.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'fixed_assessment_ranges', formula: 'Normalize the source-cited global freshwater species-population decline and the larger non-additive exposed-population envelope through named ranges.' },
    { type: 'source_reported_decline_duration', formula: 'Use the 1970-2024 report interval without extrapolating the decline.' },
    { type: 'country_degradation_extent', formula: 'Use the source-reported 50 percent of countries with at least one degraded water-related ecosystem type; do not interpret this as all ecosystems in those countries.' }
  ],
  source_ids: ['unep_un_water_progress_on_water_related_ecosystems_2024'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNEP and UN-Water SDG 6.6.1 assessment ${a.assessment_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNEP and UN-Water quantify global freshwater species-population decline, human exposure in reduced-flow basins, multi-decade persistence and country-level degradation extent.',
    higher_priority_failures: ['The operational EPA survey is a bounded 2018-2019 conterminous-US river and stream estimate and cannot supply a current global freshwater aggregation or 20-year global history.']
  }
}));

receipts.push(buildTulipUrgencyReceipt({
  node_id: 'river_flow_regime_shift',
  method: 'impact_fallback',
  as_of: String(a.assessment_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.reduced_flow_basin_count_increase_multiple_vs_15_years_earlier, [1, 2, 4, 8], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.people_in_reduced_flow_basins_million, [0, 10, 50, 250], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.reduced_flow_comparison_years, [0, 5, 10, 20], 'higher_is_worse')),
    extent: round(a.river_basins_with_significantly_decreased_flow / a.total_river_basins_assessed)
  },
  raw_inputs: {
    biophysical_burden: { river_basins_with_significantly_decreased_flow: a.river_basins_with_significantly_decreased_flow, increase_multiple_vs_15_years_earlier: a.reduced_flow_basin_count_increase_multiple_vs_15_years_earlier, anchors_multiple: [1, 2, 4, 8], boundary: 'Significant decreased-flow basin inventory; no cause is assigned.' },
    human_economic_burden: { people_in_reduced_flow_basins_million: a.people_in_reduced_flow_basins_million, anchors_million_people: [0, 10, 50, 250], boundary: 'Population residing in affected basins; not a count of people experiencing a measured household impact.' },
    persistence: { reduced_flow_comparison_years: a.reduced_flow_comparison_years, anchors_years: [0, 5, 10, 20] },
    extent: { affected_basins: a.river_basins_with_significantly_decreased_flow, assessed_basins: a.total_river_basins_assessed, normalized_value: round(a.river_basins_with_significantly_decreased_flow / a.total_river_basins_assessed) },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'source_reported_basin_growth_ratio', formula: 'Normalize the source-reported fivefold increase in significantly decreased-flow basins relative to 15 years earlier.' },
    { type: 'fixed_population_range', formula: 'Normalize the source-reported population living in reduced-flow basins through a named global range.' },
    { type: 'assessed_basin_extent', formula: 'Divide significantly decreased-flow basins by all assessed river basins; never treat unassessed basins as unaffected.' }
  ],
  source_ids: ['unep_un_water_progress_on_water_related_ecosystems_2024'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNEP and UN-Water SDG 6.6.1 assessment ${a.assessment_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNEP and UN-Water quantify a fivefold increase in significantly reduced-flow basins, people living in those basins, a 15-year comparison interval and assessed global basin extent.',
    higher_priority_failures: ['The operational USGS snapshot is US-focused and station-bounded; it cannot supply a current global river-flow aggregation or 20-year globally consistent series.']
  }
}));

for (const receipt of receipts) {
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${receipt.node_id}: ${verification.errors.join('; ')}`);
}
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_15_unep_unwater_freshwater',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'unep_un_water_progress_on_water_related_ecosystems_2024',
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-15.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-15.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
