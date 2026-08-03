import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PATHS = {
  blue: 'public/unep-blue-ecosystems-impact-snapshot.json',
  air: 'public/who-air-pollution-impact-snapshot.json',
  warning: 'public/undrr-mhews-status-snapshot.json'
};
const [blue, air, warning] = await Promise.all(Object.values(PATHS).map(file => fs.readFile(path.join(ROOT, file), 'utf8').then(JSON.parse)));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const receipts = [];

const mangrove = blue.assessments.mangrove;
receipts.push(buildTulipUrgencyReceipt({
  node_id: 'mangrove_buffer_loss',
  method: 'impact_fallback',
  as_of: String(mangrove.latest_extent_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(mangrove.carbon_stock_reduction_megatonnes_carbon, [0, 25, 100, 250], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(mangrove.estimated_annual_economic_damage_usd_billion_low, [0, 5, 20, 50], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(mangrove.persistence_years, [0, 5, 15, 30], 'higher_is_worse')),
    extent: round(mangrove.countries_with_mangroves / mangrove.global_country_denominator)
  },
  raw_inputs: {
    biophysical_burden: { carbon_stock_reduction_megatonnes_carbon: mangrove.carbon_stock_reduction_megatonnes_carbon, net_area_loss_km2: mangrove.net_area_loss_km2, net_area_loss_pct: mangrove.net_area_loss_pct, anchors_megatonnes_carbon: [0, 25, 100, 250] },
    human_economic_burden: { annual_economic_damage_usd_billion_range: [mangrove.estimated_annual_economic_damage_usd_billion_low, mangrove.estimated_annual_economic_damage_usd_billion_high], scored_lower_bound_usd_billion: mangrove.estimated_annual_economic_damage_usd_billion_low, people_within_10km_mangrove_million_context_only: mangrove.people_within_10km_mangrove_million, anchors_usd_billion: [0, 5, 20, 50], conservative_scoring_rule: 'Normalize the lower end of the source-reported damage range while retaining the full range and its assessment uncertainty.' },
    persistence: { baseline_year: mangrove.baseline_year, latest_extent_year: mangrove.latest_extent_year, persistence_years: mangrove.persistence_years, anchors_years: [0, 5, 15, 30] },
    extent: { countries_with_mangroves: mangrove.countries_with_mangroves, global_country_denominator: mangrove.global_country_denominator, normalized_value: round(mangrove.countries_with_mangroves / mangrove.global_country_denominator), boundary: 'Share of the fixed 195-country denominator with mapped mangrove habitat; not share of coast or people currently unprotected.' },
    source_snapshot: { path: PATHS.blue, version: blue.version, captured_at: blue.captured_at, source_locators: mangrove.source_locators, excluded_from_scoring: blue.excluded_from_scoring }
  },
  transformations: [
    { type: 'fixed_assessment_ranges', formula: 'Normalize source-reported carbon-stock reduction and annual economic-damage range through named global assessment anchors.' },
    { type: 'observed_persistence_interval', formula: 'Use the fixed 1996-2020 Global Mangrove Watch comparison interval; do not extrapolate the loss rate.' },
    { type: 'mapped_country_extent', formula: 'Divide source-reported countries with mangroves by the fixed 195-country denominator.' }
  ],
  source_ids: ['unep_blue_ecosystems_global_assessments'],
  uncertainty: blue.uncertainty,
  freshness: `UNEP assessment using Global Mangrove Watch extent through ${mangrove.latest_extent_year}; snapshot captured ${blue.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNEP quantifies accumulated mangrove area and carbon-stock loss, an annual economic-damage range, a 24-year observed comparison interval and mapped country extent.',
    higher_priority_failures: ['Global Mangrove Watch v4 supplies fewer than 20 complete annual observations because extent maps are published at selected epochs, so the historical-percentile current-data gate is not met.']
  }
}));

const seagrass = blue.assessments.seagrass;
receipts.push(buildTulipUrgencyReceipt({
  node_id: 'seagrass_meadow_decline',
  method: 'impact_fallback',
  as_of: String(seagrass.assessment_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(seagrass.recent_global_habitat_loss_rate_pct_per_year_estimate, [0, 1, 3, 10], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(seagrass.largest_fisheries_with_nursery_dependence_pct, [0, 5, 15, 30], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(seagrass.persistence_years, [0, 25, 75, 150], 'higher_is_worse')),
    extent: round(seagrass.countries_with_seagrass / seagrass.global_country_denominator)
  },
  raw_inputs: {
    biophysical_burden: { recent_global_habitat_loss_rate_pct_per_year_estimate: seagrass.recent_global_habitat_loss_rate_pct_per_year_estimate, historical_area_lost_pct_approx_context_only: seagrass.historical_area_lost_pct_approx, greenhouse_gas_release_gtco2e_per_year_upper_bound_context_only: seagrass.greenhouse_gas_release_from_destruction_and_degradation_gtco2e_per_year_upper_bound, anchors_pct_per_year: [0, 1, 3, 10] },
    human_economic_burden: { largest_fisheries_with_nursery_dependence_pct: seagrass.largest_fisheries_with_nursery_dependence_pct, people_within_100km_billion_lower_bound_context_only: seagrass.people_within_100km_billion_lower_bound, anchors_pct: [0, 5, 15, 30], boundary: 'Share of the world’s largest fisheries for which UNEP identifies seagrass nursery dependence; not a realized revenue-loss estimate.' },
    persistence: { observed_decline_start_year: seagrass.observed_decline_start_year, assessment_year: seagrass.assessment_year, persistence_years: seagrass.persistence_years, anchors_years: [0, 25, 75, 150] },
    extent: { countries_with_seagrass: seagrass.countries_with_seagrass, global_country_denominator: seagrass.global_country_denominator, normalized_value: round(seagrass.countries_with_seagrass / seagrass.global_country_denominator) },
    source_snapshot: { path: PATHS.blue, version: blue.version, captured_at: blue.captured_at, source_locators: seagrass.source_locators, excluded_from_scoring: blue.excluded_from_scoring }
  },
  transformations: [
    { type: 'fixed_assessment_ranges', formula: 'Normalize the source-reported global habitat-loss rate and share of major fisheries with nursery dependence through named ranges.' },
    { type: 'source_reported_decline_duration', formula: 'Use the explicit UNEP statement that seagrasses have declined globally since the 1930s through the 2025 assessment year.' },
    { type: 'mapped_country_extent', formula: 'Divide source-reported countries with seagrass by the fixed 195-country denominator.' }
  ],
  source_ids: ['unep_blue_ecosystems_global_assessments'],
  uncertainty: blue.uncertainty,
  freshness: `UNEP global blue-ecosystem assessment reviewed in ${seagrass.assessment_year}; snapshot captured ${blue.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNEP quantifies a global habitat-loss rate, major-fishery nursery dependence, multi-decadal persistence and distribution across 159 countries.',
    higher_priority_failures: ['The operational OBIS occurrence snapshot is supporting presence-only evidence and cannot measure habitat area or a source-consistent global trend.']
  }
}));

const airAssessment = air.assessment;
receipts.push(buildTulipUrgencyReceipt({
  node_id: 'air_pollution_health_burden',
  method: 'impact_fallback',
  as_of: String(airAssessment.latest_portal_update_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(airAssessment.global_population_above_who_guideline_pct, [0, 25, 50, 100], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(airAssessment.joint_ambient_and_household_air_pollution_deaths_million, [0, 1, 3, 10], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(airAssessment.persistence_years, [0, 1, 5, 10], 'higher_is_worse')),
    extent: round(airAssessment.global_population_above_who_guideline_pct / 100)
  },
  raw_inputs: {
    biophysical_burden: { global_population_above_who_guideline_pct: airAssessment.global_population_above_who_guideline_pct, guideline_basis: 'WHO global air-quality guideline levels', anchors_pct: [0, 25, 50, 100] },
    human_economic_burden: { joint_ambient_and_household_air_pollution_deaths_million: airAssessment.joint_ambient_and_household_air_pollution_deaths_million, burden_year: airAssessment.latest_portal_burden_year, anchors_million_deaths: [0, 1, 3, 10], boundary: 'WHO joint estimate already adjusts ambient-household overlap; ambient-only deaths are context and are not added.' },
    persistence: { persistence_reference_start_year: airAssessment.persistence_reference_start_year, latest_portal_update_year: airAssessment.latest_portal_update_year, persistence_years: airAssessment.persistence_years, anchors_years: [0, 1, 5, 10], boundary: 'Repeated WHO global exposure assessments, not an individual exposure-duration estimate.' },
    extent: { global_population_above_who_guideline_pct: airAssessment.global_population_above_who_guideline_pct, normalized_value: round(airAssessment.global_population_above_who_guideline_pct / 100) },
    source_snapshot: { path: PATHS.air, version: air.version, captured_at: air.captured_at, source_locators: airAssessment.source_locators }
  },
  transformations: [
    { type: 'recognized_guideline_exposure', formula: 'Normalize the WHO-reported population share above WHO guideline levels; do not average unweighted country mortality rates.' },
    { type: 'joint_burden_boundary', formula: 'Use only the WHO joint ambient-and-household mortality estimate, which adjusts overlap, and retain the assessment year.' },
    { type: 'repeated_assessment_persistence', formula: 'Use the declared 2019-2025 interval over which WHO continued to report near-universal guideline exceedance.' }
  ],
  source_ids: ['who_global_air_pollution_data_portal', 'who_gho_odata_api'],
  uncertainty: air.uncertainty,
  freshness: `WHO portal burden year ${airAssessment.latest_portal_burden_year}, exposure statement reviewed ${airAssessment.latest_portal_update_year}; snapshot captured ${air.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'WHO quantifies global guideline exceedance, joint attributable mortality, repeated global persistence and population extent.',
    higher_priority_failures: ['The operational country snapshot contains one assessment year and age-standardized rates without population weights; it cannot produce a defensible current global aggregate or a 20-year historical distribution.']
  }
}));

const warningImpact = warning.impact_context;
const reportingGap = warning.records.find(record => record.metric_id === 'countries_not_reporting_multi_hazard_early_warning_systems_pct');
if (!reportingGap || !warningImpact) throw new Error('UNDRR MHEWS snapshot lacks reporting-gap or impact context.');
receipts.push(buildTulipUrgencyReceipt({
  node_id: 'early_warning_coverage_gaps',
  method: 'impact_fallback',
  as_of: String(reportingGap.reporting_as_of),
  components: {
    biophysical_burden: round(normalizeWithAnchors(reportingGap.derived_country_reporting_gap_pct, [0, 10, 25, 50], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(warningImpact.derived_mortality_ratio, [1, 2, 4, 8], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(warningImpact.impact_period_years_inclusive, [0, 5, 10, 20], 'higher_is_worse')),
    extent: round(reportingGap.derived_country_reporting_gap_pct / 100)
  },
  raw_inputs: {
    biophysical_burden: { reported_mhews_country_share_pct: reportingGap.reported_mhews_country_share_pct, derived_country_reporting_gap_pct: reportingGap.derived_country_reporting_gap_pct, anchors_pct: [0, 10, 25, 50], boundary: 'A country reporting gap, not proof that every non-reporting country lacks any capability.' },
    human_economic_burden: { limited_to_moderate_mhews_mortality_per_100000: warningImpact.limited_to_moderate_mhews_mortality_per_100000, substantial_to_comprehensive_mhews_mortality_per_100000: warningImpact.substantial_to_comprehensive_mhews_mortality_per_100000, derived_mortality_ratio: warningImpact.derived_mortality_ratio, derived_affected_people_ratio_context_only: warningImpact.derived_affected_people_ratio, anchors_ratio: [1, 2, 4, 8], boundary: warningImpact.source_locator.boundary },
    persistence: { impact_period_start_year: warningImpact.impact_period_start_year, impact_period_end_year: warningImpact.impact_period_end_year, impact_period_years_inclusive: warningImpact.impact_period_years_inclusive, anchors_years: [0, 5, 10, 20] },
    extent: { derived_country_reporting_gap_pct: reportingGap.derived_country_reporting_gap_pct, normalized_value: round(reportingGap.derived_country_reporting_gap_pct / 100), boundary: 'Country-share extent; not population coverage.' },
    source_snapshot: { path: PATHS.warning, version: warning.version, captured_at: warning.captured_at, source_locator: warningImpact.source_locator }
  },
  transformations: [
    { type: 'source_share_complement', formula: 'Country reporting gap = 100 minus the source-reported share of countries reporting MHEWS existence.' },
    { type: 'descriptive_outcome_ratio', formula: 'Divide the source-reported 2005-2023 disaster mortality rate for limited-to-moderate MHEWS countries by the rate for substantial-to-comprehensive countries.' },
    { type: 'fixed_assessment_period', formula: 'Count the source outcome interval 2005-2023 inclusively; do not extrapolate beyond the report.' }
  ],
  source_ids: ['undrr_global_status_multi_hazard_early_warning_systems_2024'],
  uncertainty: `${warning.uncertainty} The outcome ratios are descriptive country-group comparisons and do not isolate causal effects of warning systems.`,
  freshness: `UNDRR/WMO 2024 status assessment with outcomes through ${warningImpact.impact_period_end_year}; snapshot captured ${warning.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNDRR/WMO quantifies the global country reporting gap, disaster mortality and affected-people ratios by system comprehensiveness, a 19-year outcome interval and worldwide country extent.',
    higher_priority_failures: ['Annual global status editions do not yet provide at least 20 complete annual observations under a stable reporting method, so the current-data historical-distribution gate is not met.']
  }
}));

for (const receipt of receipts) {
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${receipt.node_id}: ${verification.errors.join('; ')}`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_13_global_health_warning_and_blue_ecosystems',
  generated_at: new Date().toISOString(),
  source_snapshots: Object.values(PATHS),
  source_ids: ['unep_blue_ecosystems_global_assessments', 'who_global_air_pollution_data_portal', 'who_gho_odata_api', 'undrr_global_status_multi_hazard_early_warning_systems_2024'],
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-13.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-13.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
