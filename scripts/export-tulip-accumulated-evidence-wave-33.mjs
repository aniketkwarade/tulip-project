import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDUSTRY_PATH = 'public/iea-global-industry-transition-impact-snapshot.json';
const MINERALS_PATH = 'public/iea-critical-minerals-pressure-impact-snapshot.json';
const [industry, minerals] = await Promise.all([INDUSTRY_PATH, MINERALS_PATH].map(async file => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))));
const s = industry.assessments.steel;
const c = industry.assessments.cement;
const h = industry.assessments.industrial_heat;
const m = minerals.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

function makeReceipt({ nodeId, asOf, components, rawInputs, transformations, sourceId, snapshot, snapshotPath, passed, failures }) {
  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(asOf),
    components,
    raw_inputs: { ...rawInputs, source_snapshot: { path: snapshotPath, version: snapshot.version, captured_at: snapshot.captured_at, excluded_from_scoring: ['announced future capacity as operating output', 'scenario projections as current observations'] } },
    transformations,
    source_ids: [sourceId],
    uncertainty: snapshot.uncertainty,
    freshness: `Reviewed IEA global assessment ${asOf}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
}

const steelCostMidpoint = (s.early_commercial_cost_premium_pct_low + s.early_commercial_cost_premium_pct_high) / 2;
const steelPersistence = s.assessment_year - s.emissions_intensity_uptick_start_year;
const steelComponents = {
  biophysical_burden: round(normalizeWithAnchors(s.conventional_bf_bof_production_share_pct, [0, 20, 50, 90], 'higher_is_worse')),
  human_economic_burden: round(normalizeWithAnchors(steelCostMidpoint, [0, 20, 60, 150], 'higher_is_worse')),
  persistence: round(normalizeWithAnchors(steelPersistence, [0, 1, 3, 8], 'higher_is_worse')),
  extent: 1
};
const steelRaw = {
  biophysical_burden: { conventional_bf_bof_global_production_share_pct: s.conventional_bf_bof_production_share_pct, anchors_pct: [0, 20, 50, 90] },
  human_economic_burden: { early_commercial_near_zero_cost_premium_pct_range: [s.early_commercial_cost_premium_pct_low, s.early_commercial_cost_premium_pct_high], midpoint_pct: steelCostMidpoint, anchors_pct: [0, 20, 60, 150], boundary: 'Cost barrier, not realized social loss.' },
  persistence: { emissions_intensity_uptick_start_year: s.emissions_intensity_uptick_start_year, assessment_year: s.assessment_year, years: steelPersistence, anchors_years: [0, 1, 3, 8] },
  extent: { geography: industry.assessments.geography_boundary, normalized_value: 1 }
};
const steelTransformations = [
  { type: 'conventional_route_share', formula: 'Normalize the IEA source-reported BF-BOF share without treating announced projects as current output.' },
  { type: 'cost_range_midpoint', formula: 'Normalize the midpoint of the IEA early-commercial cost-premium range while retaining both bounds.' },
  { type: 'observed_intensity_uptick_duration', formula: 'Use the 2021-2025 interval stated by IEA as persistence context.' },
  { type: 'global_sector_extent', formula: 'Use full extent because IEA reports a global steel-sector aggregation.' }
];

const cementCostMidpoint = (c.early_commercial_cost_premium_pct_low + c.early_commercial_cost_premium_pct_high) / 2;
const cementPersistence = c.assessment_year - c.comparison_start_year;
const criticalPersistence = m.observation_year - m.trend_start_year;
const criticalComponents = {
  biophysical_burden: round(normalizeWithAnchors(m.lithium_demand_growth_pct, [0, 5, 15, 35], 'higher_is_worse')),
  human_economic_burden: round(normalizeWithAnchors(m.lithium_top_three_mining_share_pct_lower_bound, [0, 25, 60, 90], 'higher_is_worse')),
  persistence: round(normalizeWithAnchors(criticalPersistence, [0, 1, 3, 8], 'higher_is_worse')),
  extent: 1
};
const criticalRaw = {
  biophysical_burden: { lithium_demand_growth_pct: m.lithium_demand_growth_pct, other_energy_mineral_growth_pct_range: [m.nickel_cobalt_graphite_rare_earth_demand_growth_pct_low, m.nickel_cobalt_graphite_rare_earth_demand_growth_pct_high], anchors_pct: [0, 5, 15, 35], boundary: 'Mineral-specific growth rates remain separate.' },
  human_economic_burden: { lithium_top_three_mining_share_pct_lower_bound: m.lithium_top_three_mining_share_pct_lower_bound, anchors_pct: [0, 25, 60, 90], boundary: 'Supply concentration is economic vulnerability, not realized disruption.' },
  persistence: { trend_start_year: m.trend_start_year, observation_year: m.observation_year, years: criticalPersistence, anchors_years: [0, 1, 3, 8] },
  extent: { key_mineral_count: m.key_mineral_count, geography: m.geography_boundary, normalized_value: 1 }
};
const criticalTransformations = [
  { type: 'mineral_specific_demand_growth', formula: 'Normalize 2024 lithium demand growth without adding the other mineral growth rates.' },
  { type: 'supply_concentration_exposure', formula: 'Normalize the lower bound for the top-three lithium mining share as vulnerability, not disruption.' },
  { type: 'current_growth_period', formula: 'Use the 2020-2024 current-growth interval.' },
  { type: 'global_multi_mineral_extent', formula: 'Use full extent for the IEA global six-mineral assessment.' }
];

const receipts = [
  makeReceipt({ nodeId: 'steel', asOf: s.assessment_year, components: steelComponents, rawInputs: steelRaw, transformations: steelTransformations, sourceId: 'iea_global_industry_transition_assessments', snapshot: industry, snapshotPath: INDUSTRY_PATH, passed: 'IEA quantifies the global conventional-route share, near-zero cost barrier, multi-year emissions-intensity persistence and worldwide sector extent.', failures: ['The assessment page does not provide a complete 20-year annual route-share series.', 'Announced 2030 capacity is excluded from current observations.'] }),
  makeReceipt({ nodeId: 'steel_decarbonization_gap', asOf: s.assessment_year, components: steelComponents, rawInputs: { ...steelRaw, transition_pipeline_context: { near_zero_iron_capacity_2030_mt_announced: s.near_zero_iron_capacity_2030_mt_announced, near_zero_capable_capacity_2030_mt: s.near_zero_capable_capacity_2030_mt, excluded_from_scoring: true } }, transformations: steelTransformations, sourceId: 'iea_global_industry_transition_assessments', snapshot: industry, snapshotPath: INDUSTRY_PATH, passed: 'IEA quantifies the global conventional steel share and economic barrier while retaining future near-zero capacity only as pipeline context.', failures: ['Current operating near-zero output is not published as a complete global annual series.', 'Announced and capable 2030 capacity is not counted as present deployment.'] }),
  makeReceipt({
    nodeId: 'cement_concrete', asOf: c.assessment_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(100 - c.near_zero_clinker_share_2022_pct, [0, 25, 70, 100], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(cementCostMidpoint, [0, 25, 75, 175], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(cementPersistence, [0, 2, 6, 15], 'higher_is_worse')),
      extent: 1
    },
    rawInputs: {
      biophysical_burden: { near_zero_clinker_share_2022_pct: c.near_zero_clinker_share_2022_pct, transition_gap_pct: 100 - c.near_zero_clinker_share_2022_pct, cement_production_2022_mt: c.production_2022_mt, anchors_gap_pct: [0, 25, 70, 100] },
      human_economic_burden: { early_commercial_cost_premium_pct_range: [c.early_commercial_cost_premium_pct_low, c.early_commercial_cost_premium_pct_high], midpoint_pct: cementCostMidpoint, anchors_pct: [0, 25, 75, 175] },
      persistence: { comparison_start_year: c.comparison_start_year, assessment_year: c.assessment_year, years: cementPersistence, anchors_years: [0, 2, 6, 15] },
      extent: { geography: industry.assessments.geography_boundary, normalized_value: 1 },
      pipeline_context: { near_zero_cement_capacity_2030_mt_announced: c.near_zero_cement_capacity_2030_mt_announced, excluded_from_scoring: true }
    },
    transformations: [
      { type: 'observed_near_zero_share_gap', formula: 'Subtract the IEA 2022 operating near-zero clinker share from 100 percent.' },
      { type: 'cost_range_midpoint', formula: 'Normalize the midpoint of the early-commercial cost-premium range.' },
      { type: 'emissions_persistence_interval', formula: 'Use the 2015-2025 interval over which IEA reports emissions remaining above the comparison level.' },
      { type: 'global_sector_extent', formula: 'Use full extent for the global cement and concrete assessment.' }
    ],
    sourceId: 'iea_global_industry_transition_assessments', snapshot: industry, snapshotPath: INDUSTRY_PATH,
    passed: 'IEA quantifies global cement output, the observed near-zero clinker gap, cost barrier and decade-long emissions persistence.',
    failures: ['The assessment does not supply a complete 20-year annual near-zero-share series.', 'Announced 2030 capacity and NZE milestones are excluded from current scoring.']
  }),
  makeReceipt({
    nodeId: 'industrial_heat_decarbonization_gap', asOf: h.observation_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(h.nonrenewable_share_global_industrial_heat_pct, [0, 25, 60, 100], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(h.low_temperature_industries_share_global_industrial_energy_pct, [0, 20, 50, 80], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(h.observation_year - h.comparison_start_year, [0, 2, 5, 10], 'higher_is_worse')),
      extent: 1
    },
    rawInputs: {
      biophysical_burden: { renewable_share_global_industrial_heat_pct: h.renewable_share_global_industrial_heat_pct, nonrenewable_share_pct: h.nonrenewable_share_global_industrial_heat_pct, anchors_pct: [0, 25, 60, 100] },
      human_economic_burden: { low_temperature_industries_share_global_industrial_energy_pct: h.low_temperature_industries_share_global_industrial_energy_pct, anchors_pct: [0, 20, 50, 80], boundary: 'Energy-use scope amenable to transition, not realized monetary loss.' },
      persistence: { comparison_start_year: h.comparison_start_year, observation_year: h.observation_year, years: h.observation_year - h.comparison_start_year, anchors_years: [0, 2, 5, 10] },
      extent: { geography: industry.assessments.geography_boundary, normalized_value: 1 }
    },
    transformations: [
      { type: 'renewable_heat_gap', formula: 'Subtract the IEA 2024 renewable industrial heat share from 100 percent.' },
      { type: 'transition_exposure_scope', formula: 'Normalize the global industrial-energy share in low-temperature subsectors without treating it as harm.' },
      { type: 'observed_heat_period', formula: 'Use the 2018-2024 IEA comparison interval.' },
      { type: 'global_industry_extent', formula: 'Use full extent for the global industrial heat aggregation.' }
    ],
    sourceId: 'iea_global_industry_transition_assessments', snapshot: industry, snapshotPath: INDUSTRY_PATH,
    passed: 'IEA quantifies the global renewable industrial-heat gap, exposed low-temperature industrial share, six-year persistence and global extent.',
    failures: ['The reviewed report does not expose a complete 20-year annual global industrial-heat series.', 'Forecast 2030 heat shares are excluded.']
  }),
  makeReceipt({ nodeId: 'mining_critical_minerals', asOf: m.observation_year, components: criticalComponents, rawInputs: criticalRaw, transformations: criticalTransformations, sourceId: 'iea_global_critical_minerals_outlook_2025', snapshot: minerals, snapshotPath: MINERALS_PATH, passed: 'IEA quantifies current global critical-mineral demand growth, supply concentration, multi-year persistence and six-mineral global extent.', failures: ['No single source-consistent 20-year annual panel covers all six minerals.', 'Forecast supply deficits and investment needs are excluded from current burden.'] }),
  makeReceipt({ nodeId: 'critical_mineral_extraction_pressure', asOf: m.observation_year, components: criticalComponents, rawInputs: { ...criticalRaw, boundary: 'Demand growth and concentration establish extraction pressure; site-level land, water and community impacts are not inferred.' }, transformations: criticalTransformations, sourceId: 'iea_global_critical_minerals_outlook_2025', snapshot: minerals, snapshotPath: MINERALS_PATH, passed: 'IEA quantifies current demand growth and concentrated supply expansion as a bounded global extraction-pressure indicator.', failures: ['The source does not provide globally harmonized site-level land and water impact observations.', 'Forecast deficits and project pipelines are excluded from current burden.'] })
];

for (const item of receipts) {
  const verification = verifyTulipUrgencyReceipt(item);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${item.node_id}: ${verification.errors.join('; ')}`);
}
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_33_iea_industry_transition_and_critical_minerals', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-33.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-33.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
