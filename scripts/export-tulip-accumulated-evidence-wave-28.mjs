import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/unesco-fao-global-groundwater-irrigation-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const assessmentDurationYears = a.depletion_assessment_year - a.depletion_period_start_year;
const agricultureDurationYears = a.depletion_assessment_year - a.agricultural_groundwater_use_acceleration_start_year;
const demandDurationYears = a.assessment_year - a.global_freshwater_demand_growth_start_year;

function receipt({ nodeId, asOf, components, rawInputs, transformations, selectedMethodPassed, higherPriorityFailures }) {
  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(asOf),
    components,
    raw_inputs: {
      ...rawInputs,
      source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
    },
    transformations,
    source_ids: ['unesco_fao_global_groundwater_irrigation_impact'],
    uncertainty: snapshot.uncertainty,
    freshness: `UN World Water Development Reports 2022 and 2024 with FAO AQUASTAT assessment context; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: selectedMethodPassed, higher_priority_failures: higherPriorityFailures }
  });
}

const receipts = [
  receipt({
    nodeId: 'aquifer_overdraft',
    asOf: a.depletion_assessment_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(a.global_groundwater_depletion_midpoint_km3_per_year, [0, 25, 100, 200], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(a.domestic_water_withdrawal_supplied_by_groundwater_pct, [0, 10, 30, 60], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(assessmentDurationYears, [0, 5, 15, 25], 'higher_is_worse')),
      extent: a.global_extent_normalized
    },
    rawInputs: {
      biophysical_burden: { global_groundwater_depletion_range_km3_per_year: a.global_groundwater_depletion_range_km3_per_year, midpoint_km3_per_year: a.global_groundwater_depletion_midpoint_km3_per_year, anchors_km3_per_year: [0, 25, 100, 200], boundary: 'Midpoint of the source-reported global range; uncertainty range retained and no sector allocation made.' },
      human_economic_burden: { domestic_water_withdrawal_supplied_by_groundwater_pct: a.domestic_water_withdrawal_supplied_by_groundwater_pct, anchors_pct: [0, 10, 30, 60], boundary: 'Global domestic-water dependence used as exposed human-service scope, not realized shortage.' },
      persistence: { assessment_period_start_year: a.depletion_period_start_year, assessment_year: a.depletion_assessment_year, duration_years: assessmentDurationYears, anchors_years: [0, 5, 15, 25], boundary: 'Duration of the source-described beginning-of-century global depletion assessment.' },
      extent: { global_extent_normalized: a.global_extent_normalized, geographic_scope: a.geographic_scope }
    },
    transformations: [
      { type: 'range_midpoint_with_bounds_retained', formula: 'Normalize the midpoint of the UNESCO 100-200 km3/year depletion range while retaining both bounds.' },
      { type: 'domestic_service_exposure', formula: 'Normalize the global domestic-water share supplied by groundwater without relabeling dependence as shortage.' },
      { type: 'fixed_assessment_duration', formula: 'Normalize the 2000-2022 assessment interval without inferring annual observations.' },
      { type: 'global_assessment_extent', formula: 'Use the source-declared global aggregation and retain regional heterogeneity.' }
    ],
    selectedMethodPassed: 'UNESCO quantifies a global depletion-rate range, domestic-water dependence, a fixed multi-decade assessment interval and global extent.',
    higherPriorityFailures: ['The assessment supplies a global rate range rather than a complete 20-year annual observation panel with a source-recognized threshold.', 'No missing year is filled or reconstructed, so the evidence remains accumulated impact rather than current data.']
  }),
  receipt({
    nodeId: 'agricultural_groundwater_withdrawal',
    asOf: a.depletion_assessment_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(a.groundwater_abstraction_by_sector_pct.agriculture, [0, 20, 50, 80], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(a.irrigated_land_serviced_by_groundwater_pct, [0, 10, 25, 50], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(agricultureDurationYears, [0, 10, 30, 50], 'higher_is_worse')),
      extent: a.global_extent_normalized
    },
    rawInputs: {
      biophysical_burden: { agriculture_share_of_groundwater_abstractions_pct: a.groundwater_abstraction_by_sector_pct.agriculture, anchors_pct: [0, 20, 50, 80], boundary: 'Global sector share of groundwater abstractions; not sector-attributed depletion volume.' },
      human_economic_burden: { irrigated_land_serviced_by_groundwater_pct: a.irrigated_land_serviced_by_groundwater_pct, anchors_pct: [0, 10, 25, 50], irrigation_water_supplied_by_groundwater_pct: a.irrigation_water_supplied_by_groundwater_pct, boundary: 'Global irrigated-land dependence used as food-production exposure, not observed crop loss.' },
      persistence: { acceleration_start_year: a.agricultural_groundwater_use_acceleration_start_year, assessment_year: a.depletion_assessment_year, duration_years: agricultureDurationYears, anchors_years: [0, 10, 30, 50], boundary: 'Duration since the source-described acceleration of groundwater-supported food production.' },
      extent: { global_extent_normalized: a.global_extent_normalized, geographic_scope: a.geographic_scope }
    },
    transformations: [
      { type: 'global_sector_abstraction_share', formula: 'Normalize agriculture share of groundwater abstractions without assigning the total depletion range to agriculture.' },
      { type: 'irrigated_land_dependency', formula: 'Normalize the share of irrigated land served by groundwater as exposed food-system scope.' },
      { type: 'documented_multi_decade_use', formula: 'Normalize the fixed period since the 1970s acceleration described by UNESCO.' },
      { type: 'global_assessment_extent', formula: 'Use global coverage while retaining regional groundwater-use variation.' }
    ],
    selectedMethodPassed: 'UNESCO quantifies agriculture share of groundwater abstractions, irrigated-land dependence, multi-decade use and global extent under explicit non-attribution boundaries.',
    higherPriorityFailures: ['No complete current global annual agriculture-withdrawal-to-recharge panel supplies magnitude plus threshold or momentum.', 'Sector abstraction share is not silently converted into sector-attributed aquifer depletion.']
  }),
  receipt({
    nodeId: 'municipal_groundwater_withdrawal',
    asOf: a.assessment_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(a.groundwater_abstraction_by_sector_pct.domestic, [0, 5, 15, 30], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(a.global_urban_population_supplied_by_groundwater_pct, [0, 10, 30, 60], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(demandDurationYears, [0, 10, 25, 50], 'higher_is_worse')),
      extent: a.global_extent_normalized
    },
    rawInputs: {
      biophysical_burden: { domestic_share_of_groundwater_abstractions_pct: a.groundwater_abstraction_by_sector_pct.domestic, anchors_pct: [0, 5, 15, 30], boundary: 'Global domestic sector share; no allocation of aggregate depletion.' },
      human_economic_burden: { global_urban_population_supplied_by_groundwater_pct: a.global_urban_population_supplied_by_groundwater_pct, anchors_pct: [0, 10, 30, 60], domestic_water_withdrawal_supplied_by_groundwater_pct: a.domestic_water_withdrawal_supplied_by_groundwater_pct, boundary: 'Urban population and domestic-service dependence are exposure, not observed shortage.' },
      persistence: { freshwater_demand_growth_start_year: a.global_freshwater_demand_growth_start_year, assessment_year: a.assessment_year, duration_years: demandDurationYears, growth_pct_per_year_context: a.global_freshwater_demand_growth_pct_per_year, anchors_years: [0, 10, 25, 50], boundary: 'Duration of documented global freshwater-demand growth; not a municipal groundwater-only trend.' },
      extent: { global_extent_normalized: a.global_extent_normalized, geographic_scope: a.geographic_scope }
    },
    transformations: [
      { type: 'global_domestic_abstraction_share', formula: 'Normalize the domestic share of global groundwater abstractions without allocating depletion.' },
      { type: 'urban_groundwater_dependency', formula: 'Normalize the urban-population share supplied by groundwater as human-service exposure.' },
      { type: 'documented_demand_duration', formula: 'Normalize the duration since documented global freshwater-demand growth began; retain its broader boundary.' },
      { type: 'global_assessment_extent', formula: 'Use the global service assessment while retaining regional variation.' }
    ],
    selectedMethodPassed: 'UNESCO quantifies domestic abstraction share, urban and domestic groundwater dependence, decades of water-demand pressure and global extent.',
    higherPriorityFailures: ['No complete current global annual municipal-groundwater withdrawal panel provides magnitude plus threshold or source-consistent momentum.', 'The broader demand trend is retained as persistence context and is not relabeled a municipal groundwater observation.']
  }),
  receipt({
    nodeId: 'irrigation_water_inefficiency',
    asOf: a.assessment_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(a.irrigation_withdrawal_loss_lower_bound_pct, [0, 10, 25, 50], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(a.irrigated_agriculture_share_of_global_food_production_pct, [0, 10, 25, 50], 'higher_is_worse')),
      persistence: 1,
      extent: a.irrigation_assessment_country_share_normalized
    },
    rawInputs: {
      biophysical_burden: { irrigation_withdrawal_loss_lower_bound_pct: a.irrigation_withdrawal_loss_lower_bound_pct, anchors_pct: [0, 10, 25, 50], boundary: 'Global lower-bound conveyance, deep-percolation and runoff share; recoverable flows remain explicitly caveated.' },
      human_economic_burden: { irrigated_agriculture_share_of_global_food_production_pct: a.irrigated_agriculture_share_of_global_food_production_pct, irrigated_land_share_of_cultivated_land_pct: a.irrigated_land_share_of_cultivated_land_pct, anchors_pct_food_production: [0, 10, 25, 50], boundary: 'Food-production dependence is exposed economic-system scope, not food lost to inefficiency.' },
      persistence: { recurrence_days_per_year: 365, reference_days_per_year: 365, normalized_value: 1, boundary: 'The source reports a recurring annual global withdrawal burden; no trend is inferred.' },
      extent: { assessed_countries_and_territories: a.irrigation_assessment_countries, reference_country_count: a.reference_country_count, normalized_value: a.irrigation_assessment_country_share_normalized, nationally_sourced_country_values: a.irrigation_country_values_from_national_sources }
    },
    transformations: [
      { type: 'bounded_irrigation_loss_share', formula: 'Normalize the FAO global lower-bound withdrawal loss while retaining recoverable-flow caveats.' },
      { type: 'food_system_exposure', formula: 'Normalize irrigated agriculture share of global food production without treating it as realized loss.' },
      { type: 'annual_recurrence', formula: 'Normalize annual recurrence as 365/365; do not infer a historical trend.' },
      { type: 'country_coverage_extent', formula: 'Divide the 167-country and territory assessment by 193 UN member states without filling absent countries.' }
    ],
    selectedMethodPassed: 'FAO quantifies a global irrigation-withdrawal loss lower bound, food-system dependence, annual recurrence and a 167-country assessment extent.',
    higherPriorityFailures: ['FAO cautions that apparent losses may be recoverable downstream, preventing a simple current efficiency threshold.', 'The assessment does not provide a complete comparable annual global efficiency history, so it remains accumulated impact.']
  })
];

for (const item of receipts) {
  const verification = verifyTulipUrgencyReceipt(item);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${item.node_id}: ${verification.errors.join('; ')}`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_28_unesco_fao_global_groundwater_and_irrigation',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'unesco_fao_global_groundwater_irrigation_impact',
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-28.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-28.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(item => ({ node_id: item.node_id, value: item.value, band: item.band, method: item.method, components: item.components }))
}, null, 2));
