import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/iea-global-industry-transition-impact-snapshot.json');
const snapshot = {
  version: 'iea_global_industry_transition_2025_snapshot_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'iea_global_industry_transition_assessments',
    name: 'IEA Global Industry Transition Assessments 2025',
    publisher: 'International Energy Agency',
    report_year: 2025,
    steel_url: 'https://www.iea.org/reports/breakthrough-agenda-report-2025/steel',
    cement_url: 'https://www.iea.org/reports/breakthrough-agenda-report-2025/cement-and-concrete',
    industrial_heat_url: 'https://www.iea.org/reports/renewables-2025/renewable-heat',
    industry_url: 'https://www.iea.org/reports/renewables-for-industry',
    heavy_industry_url: 'https://www.iea.org/reports/achieving-net-zero-heavy-industry-sectors-in-g7-members/executive-summary'
  },
  ingestion_job_id: 'export_iea_global_industry_transition_impact_snapshot',
  metric_contract_ids: ['steel_conventional_route_and_near_zero_gap', 'cement_near_zero_transition_gap', 'industrial_renewable_heat_share_gap'],
  contract_bindings: [
    { node_id: 'steel', metric_id: 'steel_conventional_route_and_near_zero_gap', measurement_role: 'global_industry_transition_assessment_primary' },
    { node_id: 'steel_decarbonization_gap', metric_id: 'steel_conventional_route_and_near_zero_gap', measurement_role: 'global_near_zero_transition_gap_primary' },
    { node_id: 'cement_concrete', metric_id: 'cement_near_zero_transition_gap', measurement_role: 'global_cement_transition_assessment_primary' },
    { node_id: 'industrial_heat_decarbonization_gap', metric_id: 'industrial_renewable_heat_share_gap', measurement_role: 'global_industrial_heat_transition_gap_primary' }
  ],
  cadence: 'Annual after IEA Breakthrough Agenda and Renewables reports are published.',
  provenance: 'Reviewed current or historical values stated by IEA. Announced 2030 capacity and scenario milestones are retained as labeled pipeline or target comparators and are never counted as operating production.',
  uncertainty: 'Route definitions, project maturity, emissions boundaries, cost assumptions, production revisions, heat accounting and renewable-bioenergy classifications vary. Announced capacity can be delayed or cancelled.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale; never treat announced capacity, targets or forecasts as current production, infer plant-level performance, or add steel, cement and heat quantities.',
  assessments: {
    industry: { direct_co2_gt_per_year: 9, heavy_industry_direct_co2_gt_per_year: 6, heavy_industry_share_industry_direct_co2_pct: 70, industry_share_global_energy_consumption_pct: 30 },
    steel: { assessment_year: 2025, conventional_bf_bof_production_share_pct: 70, near_zero_iron_capacity_2030_mt_announced: 10, near_zero_capable_capacity_2030_mt: 80, early_commercial_cost_premium_pct_low: 50, early_commercial_cost_premium_pct_high: 140, emissions_intensity_uptick_start_year: 2021 },
    cement: { assessment_year: 2025, comparison_start_year: 2015, production_2022_mt: 4160, near_zero_clinker_share_2022_pct: 0, nze_near_zero_clinker_share_2030_pct: 8, near_zero_cement_capacity_2030_mt_announced: 35, near_zero_capable_capacity_2030_mt: 7, early_commercial_cost_premium_pct_low: 75, early_commercial_cost_premium_pct_high: 150, low_emissions_fuel_share_2022_pct: 5 },
    industrial_heat: { observation_year: 2024, comparison_start_year: 2018, renewable_share_global_industrial_heat_pct: 12, nonrenewable_share_global_industrial_heat_pct: 88, electricity_share_global_industrial_heat_pct_low: 4, electricity_share_global_industrial_heat_pct_high: 5, low_temperature_industries_share_global_industrial_energy_pct: 70, heat_share_global_final_energy_pct: 50, heat_share_energy_related_co2_pct: 37 },
    geography_boundary: 'Global steel, cement and industrial heat systems',
    source_locators: [
      'IEA Breakthrough Agenda 2025: BF-BOF routes about 70% of global steel production; near-zero iron capacity about 10 Mt and capable capacity just over 80 Mt by 2030.',
      'IEA Breakthrough Agenda 2025: near-zero cement capacity pipeline about 35 Mt; conventional cost premium 75-150%.',
      'IEA Renewables 2025: renewables supplied 12% of global industrial heat in 2024; electricity supplied about 4-5%.',
      'IEA heavy-industry assessment: heavy industry accounts for about 6 Gt of the 9 Gt annual direct industrial CO2 burden.'
    ]
  }
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
