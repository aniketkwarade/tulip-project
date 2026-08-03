import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COOLING_PATH = 'public/unep-cooling-equity-impact-snapshot.json';
const WATER_PATH = 'public/unece-transboundary-water-cooperation-impact-snapshot.json';
const AVIATION_PATH = 'public/icao-global-aviation-impact-snapshot.json';
const EDGAR_PATH = 'public/edgar-snapshot.json';
const [cooling, water, aviation, edgar] = await Promise.all([COOLING_PATH, WATER_PATH, AVIATION_PATH, EDGAR_PATH].map(async file => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))));
const c = cooling.assessment;
const w = water.assessment;
const a = aviation.assessment;
const aviationSeries = edgar.global_time_series.filter(row => row.metric_id === 'carbon_pathway_aviation_jet_fuel_co2').sort((left, right) => left.observation_year - right.observation_year);
const latestCo2 = aviationSeries.at(-1);
const priorCo2 = aviationSeries.at(-2);
if (!latestCo2 || !priorCo2 || latestCo2.observation_year !== 2024) throw new Error('EDGAR aviation series is missing the 2024 global observation.');
const aviationCo2IncreaseMt = (latestCo2.emission_gg_substance - priorCo2.emission_gg_substance) / 1000;
const round = (value, digits = 6) => Number(value.toFixed(digits));

function receipt({ nodeId, asOf, components, rawInputs, transformations, sourceIds, snapshots, passed, failures, uncertainty, freshness }) {
  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(asOf),
    components,
    raw_inputs: { ...rawInputs, source_snapshots: snapshots },
    transformations,
    source_ids: sourceIds,
    uncertainty,
    freshness,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
}

const receipts = [
  receipt({
    nodeId: 'air_conditioning_refrigerants', asOf: c.baseline_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(c.current_cooling_emissions_gt_co2e, [0, 1, 3, 6], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(c.people_lacking_adequate_cooling_lower_bound_billion, [0, 0.1, 0.5, 1.5], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(cooling.source.report_year - c.baseline_year, [0, 1, 3, 10], 'higher_is_worse')),
      extent: round(c.countries_referencing_cooling_in_climate_or_energy_plans / 193)
    },
    rawInputs: {
      biophysical_burden: { current_cooling_emissions_gt_co2e: c.current_cooling_emissions_gt_co2e, current_cooling_capacity_tw: c.current_cooling_capacity_tw, anchors_gt_co2e: [0, 1, 3, 6] },
      human_economic_burden: { people_lacking_adequate_cooling_lower_bound_billion: c.people_lacking_adequate_cooling_lower_bound_billion, anchors_billion_people: [0, 0.1, 0.5, 1.5], boundary: 'Access gap is retained as exposed need, not mortality attributed to cooling.' },
      persistence: { baseline_year: c.baseline_year, assessment_year: cooling.source.report_year, years: cooling.source.report_year - c.baseline_year, anchors_years: [0, 1, 3, 10] },
      extent: { countries_referencing_cooling_in_plans: c.countries_referencing_cooling_in_climate_or_energy_plans, denominator: 193 }
    },
    transformations: [
      { type: 'source_reported_cooling_emissions', formula: 'Normalize the UNEP 2022 global cooling-emissions estimate without adding projected 2050 emissions.' },
      { type: 'bounded_access_gap', formula: 'Normalize UNEP lower-bound population lacking adequate cooling as exposure, not realized harm.' },
      { type: 'assessment_span', formula: 'Retain the elapsed interval between the 2022 baseline and 2025 report.' },
      { type: 'country_policy_extent', formula: 'Divide countries referencing cooling in climate or energy plans by 193 UN Member States.' }
    ],
    sourceIds: ['unep_global_cooling_watch_2025'],
    snapshots: [{ path: COOLING_PATH, version: cooling.version, captured_at: cooling.captured_at }],
    passed: 'UNEP quantifies global cooling emissions, capacity, unmet cooling need, assessment persistence and country-policy extent.',
    failures: ['No complete annual global equipment-and-refrigerant-bank series supplies the current-data magnitude and trend gate.', 'Projected 2050 demand and emissions are excluded from current scoring.'],
    uncertainty: cooling.uncertainty,
    freshness: `UNEP Global Cooling Watch 2025 baseline year ${c.baseline_year}; snapshot captured ${cooling.captured_at}.`
  }),
  receipt({
    nodeId: 'basin_treaty_breakdown', asOf: w.monitoring_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(w.global_operational_coverage_gap_pct, [0, 10, 25, 50], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(w.global_freshwater_crossing_borders_pct, [0, 15, 40, 70], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(w.persistence_years, [0, 2, 4, 8], 'higher_is_worse')),
      extent: round(w.countries_sharing_transboundary_waters / w.un_member_state_denominator)
    },
    rawInputs: {
      biophysical_burden: { global_indicator_average_pct: w.global_indicator_average_pct, operational_coverage_gap_pct: w.global_operational_coverage_gap_pct, anchors_gap_pct: [0, 10, 25, 50], boundary: 'Cooperation coverage gap, not treaty breach or conflict incidence.' },
      human_economic_burden: { global_freshwater_crossing_borders_pct: w.global_freshwater_crossing_borders_pct, anchors_pct: [0, 15, 40, 70], boundary: 'Shared-water exposure scope, not a population or monetary loss estimate.' },
      persistence: { baseline_reporting_year: w.baseline_reporting_year, monitoring_year: w.monitoring_year, years: w.persistence_years, anchors_years: [0, 2, 4, 8] },
      extent: { countries_sharing_transboundary_waters: w.countries_sharing_transboundary_waters, denominator: w.un_member_state_denominator, countries_with_full_coverage: w.countries_with_full_operational_coverage }
    },
    transformations: [
      { type: 'operational_arrangement_gap', formula: 'Subtract the official global SDG 6.5.2 average from 100 percent.' },
      { type: 'shared_freshwater_scope', formula: 'Retain the report-wide share of freshwater crossing borders as exposed governance scope.' },
      { type: 'reporting_cycle_duration', formula: 'Use the 2017 baseline to 2023 monitoring interval.' },
      { type: 'country_extent', formula: 'Divide countries sharing transboundary waters by 193 UN Member States.' }
    ],
    sourceIds: ['unece_progress_on_transboundary_water_cooperation_sdg_6_5_2'],
    snapshots: [{ path: WATER_PATH, version: water.version, captured_at: water.captured_at }],
    passed: 'UNECE-UNESCO quantifies the global operational-cooperation gap, shared-water scope, repeated monitoring span and worldwide country extent.',
    failures: ['The three global monitoring cycles do not meet the 20-annual-observation historical-percentile gate.', 'The assessment does not provide a current global treaty-breach incident series.'],
    uncertainty: water.uncertainty,
    freshness: `UNECE-UNESCO 2023 monitoring cycle published ${w.publication_year}; snapshot captured ${water.captured_at}.`
  }),
  receipt({
    nodeId: 'aviation_demand_growth', asOf: a.observation_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(aviationCo2IncreaseMt, [0, 10, 40, 100], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(a.scheduled_rpk_growth_pct, [0, 2, 6, 12], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(4, [0, 1, 3, 8], 'higher_is_worse')),
      extent: round(a.reported_global_coverage_pct / 100)
    },
    rawInputs: {
      biophysical_burden: { edgar_aviation_co2_2023_mt: round(priorCo2.emission_gg_substance / 1000), edgar_aviation_co2_2024_mt: round(latestCo2.emission_gg_substance / 1000), annual_increase_mt: round(aviationCo2IncreaseMt), anchors_mt: [0, 10, 40, 100], boundary: 'Observed aviation-category CO2 increase; no direct conversion from ICAO activity.' },
      human_economic_burden: { scheduled_rpk_billion: a.scheduled_rpk_billion, scheduled_rpk_growth_pct: a.scheduled_rpk_growth_pct, freight_tonnes_million: a.freight_tonnes_million, scheduled_freight_tonne_km_growth_pct: a.scheduled_freight_tonne_km_growth_pct, anchors_rpk_growth_pct: [0, 2, 6, 12] },
      persistence: { rebound_start_year: 2020, observation_year: a.observation_year, years: 4, anchors_years: [0, 1, 3, 8] },
      extent: { icao_reported_global_coverage_pct: a.reported_global_coverage_pct, normalized_value: round(a.reported_global_coverage_pct / 100) }
    },
    transformations: [
      { type: 'observed_co2_increment', formula: 'Subtract EDGAR 2023 global civil-aviation fossil CO2 from the 2024 value; keep ICAO activity separate.' },
      { type: 'source_reported_activity_growth', formula: 'Normalize ICAO scheduled RPK growth without adding freight growth or projected traffic.' },
      { type: 'post_2020_rebound_duration', formula: 'Retain the four-year observed recovery interval as persistence context.' },
      { type: 'reporting_coverage_extent', formula: 'Use ICAO reported global statistical coverage directly.' }
    ],
    sourceIds: ['icao_environmental_reports', 'edgar_global_emissions_database'],
    snapshots: [{ path: AVIATION_PATH, version: aviation.version, captured_at: aviation.captured_at }, { path: EDGAR_PATH, version: edgar.version, captured_at: edgar.captured_at }],
    passed: 'ICAO quantifies global passenger and freight growth while EDGAR independently quantifies the corresponding aviation-category CO2 increase and long-lived global pressure.',
    failures: ['ICAO activity histories are not yet ingested as a complete 20-year global annual panel.', 'Activity growth is not converted to emissions; the independently observed EDGAR increment makes this an impact fallback.'],
    uncertainty: `${aviation.uncertainty} ${edgar.uncertainty}`,
    freshness: `ICAO and EDGAR 2024 global observations; snapshots captured ${aviation.captured_at} and ${edgar.captured_at}.`
  })
];

for (const item of receipts) {
  const verification = verifyTulipUrgencyReceipt(item);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${item.node_id}: ${verification.errors.join('; ')}`);
}
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_32_cooling_water_governance_aviation_growth', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-32.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-32.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
