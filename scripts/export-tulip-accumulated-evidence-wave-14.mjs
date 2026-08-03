import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/ipbes-biodiversity-invasive-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const receipts = [];

const biodiversity = snapshot.assessments.biodiversity_intactness;
receipts.push(buildTulipUrgencyReceipt({
  node_id: 'biodiversity_intactness_loss',
  method: 'impact_fallback',
  as_of: String(biodiversity.assessment_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(biodiversity.native_species_average_abundance_decline_pct_lower_bound, [0, 10, 25, 50], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(biodiversity.annual_global_crop_output_at_risk_from_pollinator_loss_2015_usd_billion_low, [0, 50, 250, 750], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(biodiversity.persistence_years, [0, 25, 75, 150], 'higher_is_worse')),
    extent: round(biodiversity.land_surface_significantly_altered_pct / 100)
  },
  raw_inputs: {
    biophysical_burden: { native_species_average_abundance_decline_pct_lower_bound: biodiversity.native_species_average_abundance_decline_pct_lower_bound, species_threatened_with_extinction_million_approx_context_only: biodiversity.species_threatened_with_extinction_million_approx, anchors_pct: [0, 10, 25, 50] },
    human_economic_burden: { annual_global_crop_output_at_risk_2015_usd_billion_range: [biodiversity.annual_global_crop_output_at_risk_from_pollinator_loss_2015_usd_billion_low, biodiversity.annual_global_crop_output_at_risk_from_pollinator_loss_2015_usd_billion_high], scored_lower_bound_2015_usd_billion: biodiversity.annual_global_crop_output_at_risk_from_pollinator_loss_2015_usd_billion_low, anchors_2015_usd_billion: [0, 50, 250, 750], boundary: 'A source-reported ecosystem-service risk from pollinator loss; not a realized loss or a valuation of all biodiversity.' },
    persistence: { decline_reference_start_year: biodiversity.decline_reference_start_year, assessment_year: biodiversity.assessment_year, persistence_years: biodiversity.persistence_years, anchors_years: [0, 25, 75, 150] },
    extent: { land_surface_significantly_altered_pct: biodiversity.land_surface_significantly_altered_pct, marine_environment_cumulative_impacts_pct_context_only: biodiversity.marine_environment_cumulative_impacts_pct, normalized_value: round(biodiversity.land_surface_significantly_altered_pct / 100), boundary: 'Terrestrial extent is scored; marine cumulative-impact extent remains separate context and is not added.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: biodiversity.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'fixed_assessment_ranges', formula: 'Normalize the source lower-bound native-abundance decline and lower end of the crop-output-at-risk range through named ranges.' },
    { type: 'source_reported_decline_duration', formula: 'Use the explicit IPBES statement that most native-abundance decline occurred since 1900 through the 2019 assessment.' },
    { type: 'non_additive_extent', formula: 'Use the source-reported altered terrestrial share as extent; do not add the overlapping marine cumulative-impact share.' }
  ],
  source_ids: ['ipbes_global_biodiversity_and_invasive_species_assessments'],
  uncertainty: snapshot.uncertainty,
  freshness: `IPBES Global Assessment ${biodiversity.assessment_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'IPBES quantifies accumulated native-species abundance loss, economic output at risk from lost pollination, century-scale persistence and global terrestrial extent.',
    higher_priority_failures: ['The operational GBIF occurrence snapshot is presence-only and effort-sensitive; it cannot produce a source-consistent global abundance or intactness series that passes the current-data gate.']
  }
}));

const invasive = snapshot.assessments.invasive_alien_species;
receipts.push(buildTulipUrgencyReceipt({
  node_id: 'invasive_species_encroachment',
  method: 'impact_fallback',
  as_of: String(invasive.assessment_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(invasive.global_recorded_extinctions_with_invasive_alien_species_as_contributor_pct, [0, 10, 30, 75], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(invasive.annual_global_economic_cost_2019_usd_billion_lower_bound, [0, 50, 250, 750], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(invasive.persistence_years, [0, 10, 30, 60], 'higher_is_worse')),
    extent: invasive.global_region_coverage_share
  },
  raw_inputs: {
    biophysical_burden: { recorded_global_extinctions_with_invasive_species_as_contributor_pct: invasive.global_recorded_extinctions_with_invasive_alien_species_as_contributor_pct, sole_driver_pct_context_only: invasive.global_recorded_extinctions_with_invasive_alien_species_as_sole_driver_pct, anchors_pct: [0, 10, 30, 75], boundary: 'Contributor share is not re-labeled as sole causation.' },
    human_economic_burden: { annual_global_economic_cost_2019_usd_billion_lower_bound: invasive.annual_global_economic_cost_2019_usd_billion_lower_bound, cost_price_year: invasive.economic_cost_year, anchors_2019_usd_billion: [0, 50, 250, 750], boundary: 'Source lower bound retained in 2019 US dollars without inflation adjustment.' },
    persistence: { cost_growth_reference_start_year: invasive.cost_growth_reference_start_year, economic_cost_year: invasive.economic_cost_year, persistence_years: invasive.persistence_years, economic_cost_quadrupling_period_years_context_only: invasive.economic_cost_quadrupling_period_years, anchors_years: [0, 10, 30, 60] },
    extent: { source_statement: 'People and nature are threatened in all regions of Earth.', normalized_value: invasive.global_region_coverage_share, established_alien_species_recorded_worldwide_lower_bound_context_only: invasive.established_alien_species_recorded_worldwide_lower_bound },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: invasive.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'fixed_assessment_ranges', formula: 'Normalize source-reported extinction contribution and the lower-bound 2019 economic cost through named ranges.' },
    { type: 'source_cost_record_duration', formula: 'Use the 1970-2019 assessment interval over which IPBES reports cost growth; do not project another decade.' },
    { type: 'all_region_extent', formula: 'Map the explicit source statement that impacts occur in all Earth regions to full global-region extent; do not infer equal severity.' }
  ],
  source_ids: ['ipbes_global_biodiversity_and_invasive_species_assessments'],
  uncertainty: snapshot.uncertainty,
  freshness: `IPBES Invasive Alien Species Assessment ${invasive.assessment_year}, economic-cost year ${invasive.economic_cost_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'IPBES quantifies extinction contribution, a lower-bound annual economic cost, multi-decade persistence and impacts in all regions of Earth.',
    higher_priority_failures: ['The operational GBIF occurrence snapshot is presence-only and effort-sensitive; it cannot distinguish introduction, establishment, invasiveness or impact in a current global trend.']
  }
}));

for (const receipt of receipts) {
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${receipt.node_id}: ${verification.errors.join('; ')}`);
}
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_14_ipbes_biodiversity_and_invasive_species',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'ipbes_global_biodiversity_and_invasive_species_assessments',
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-14.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-14.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
