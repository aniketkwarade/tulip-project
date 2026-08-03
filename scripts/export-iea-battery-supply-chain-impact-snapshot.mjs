import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/iea-battery-supply-chain-impact-snapshot.json');
const snapshot = {
  version: 'iea_battery_supply_chain_2024_assessment_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'iea_global_critical_minerals_outlook_2025',
    name: 'IEA Global Critical Minerals Outlook 2025 and Global EV Outlook 2025',
    publisher: 'International Energy Agency',
    assessment_year: 2025,
    observation_year: 2024,
    critical_minerals_url: 'https://www.iea.org/reports/global-critical-minerals-outlook-2025/executive-summary',
    battery_supply_chain_url: 'https://www.iea.org/reports/global-critical-minerals-outlook-2025/beyond-nmc-batteries-supply-chain-issues-for-emerging-battery-technologies',
    ev_battery_url: 'https://www.iea.org/reports/global-ev-outlook-2025/electric-vehicle-batteries'
  },
  ingestion_job_id: 'export_iea_battery_supply_chain_impact_snapshot',
  metric_contract_ids: ['battery_demand_growth_and_supply_concentration'],
  contract_bindings: [
    { node_id: 'battery_supply_chain_pressure', metric_id: 'battery_demand_growth_and_supply_concentration', measurement_role: 'global_assessment_accumulated_supply_pressure_primary' }
  ],
  cadence: 'Refresh with each annual IEA Global Critical Minerals Outlook and Global EV Outlook after reconciling observation boundaries.',
  provenance: 'Reviewed IEA current-period values for global battery demand, demand growth, manufacturing capacity and geographic concentration. Scenario values are retained outside scoring and are not represented as current observations.',
  uncertainty: 'IEA battery demand combines estimated installed battery sizes with vehicle sales and storage applications. Capacity is not production; supply-chain shares vary by chemistry and stage; proprietary market inputs, stockpiling exclusions, ownership, trade, technology change and revisions affect estimates.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale; reject mixed demand and capacity units or changed market boundaries; never count announced capacity as operating supply, treat projections as current, equate concentration with a realized disruption or infer mine-level impacts from global market shares.',
  assessment: {
    observation_year: 2024,
    global_energy_sector_battery_demand_twh: 1,
    global_ev_battery_demand_gwh_lower_bound: 950,
    global_ev_battery_demand_annual_growth_pct: 25,
    electric_car_share_of_ev_battery_demand_pct_lower_bound: 85,
    lithium_demand_multiple_vs_2015: 6,
    lithium_demand_comparison_start_year: 2015,
    lithium_demand_comparison_years: 9,
    global_battery_cell_manufacturing_capacity_twh_lower_bound: 3,
    manufacturing_capacity_to_energy_sector_demand_multiple_lower_bound: 3,
    china_share_global_battery_cell_production_pct: 80,
    china_share_global_battery_manufacturing_capacity_pct: 85,
    china_share_lfp_cathode_material_and_cell_production_pct_lower_bound: 98,
    drc_share_global_cobalt_mining_pct_approx: 66.7,
    china_share_global_cobalt_refining_pct: 75,
    china_share_global_graphite_mining_pct: 80,
    china_share_global_graphite_refining_pct_lower_bound: 90,
    energy_sector_share_battery_metal_demand_growth_2021_2024_pct: 85,
    source_locators: [
      'IEA Global EV Outlook 2025, Electric vehicle batteries: global energy-sector battery demand reached 1 TWh in 2024 and EV battery demand exceeded 950 GWh, 25 percent above 2023.',
      'IEA Global EV Outlook 2025: lithium demand in 2024 was about six times its 2015 level; China produced 80 percent of global battery cells and held 85 percent of manufacturing capacity.',
      'IEA Global Critical Minerals Outlook 2025: the energy sector accounted for 85 percent of 2021-2024 demand growth for lithium, nickel, cobalt and graphite.',
      'IEA Global Critical Minerals Outlook 2025: over 98 percent of LFP cathode material and LFP cells were produced in China.'
    ],
    excluded_from_scoring: [
      '2030 and 2035 demand, supply and capacity scenarios',
      'announced but not operating projects',
      'projected recycling contribution and projected supply shortfalls'
    ]
  }
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, observation_year: snapshot.assessment.observation_year, metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
