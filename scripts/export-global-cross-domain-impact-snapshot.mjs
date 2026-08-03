import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const snapshot = {
  version: 'global_cross_domain_impact_assessments_2026_v1',
  captured_at: '2026-07-31T00:00:00.000Z',
  sources: [
    { id: 'iea_energy_and_ai', publisher: 'International Energy Agency', url: 'https://www.iea.org/reports/energy-and-ai' },
    { id: 'iea_electricity_2026_grids', publisher: 'International Energy Agency', url: 'https://www.iea.org/reports/electricity-2026/grids' },
    { id: 'iea_global_ev_outlook_2026', publisher: 'International Energy Agency', url: 'https://www.iea.org/reports/global-ev-outlook-2026/trends-in-other-ev-modes' },
    { id: 'iea_breakthrough_agenda_road_transport_2025', publisher: 'International Energy Agency', url: 'https://www.iea.org/reports/breakthrough-agenda-report-2025/road-transport' },
    { id: 'oecd_global_plastics_outlook', publisher: 'Organisation for Economic Co-operation and Development', url: 'https://www.oecd.org/en/publications/global-plastics-outlook_de747aef-en.html' },
    { id: 'itu_submarine_cable_resilience', publisher: 'International Telecommunication Union', url: 'https://www.itu.int/digital-resilience/submarine-cables/' },
    { id: 'global_glof_exposure_2023', publisher: 'Nature Communications', url: 'https://www.nature.com/articles/s41467-023-36033-x', doi: '10.1038/s41467-023-36033-x' },
    { id: 'unep_pesticides_fertilizers_global_assessment', publisher: 'United Nations Environment Programme', url: 'https://www.unep.org/resources/report/environmental-and-health-impacts-pesticides-and-fertilizers-and-ways-minimizing' }
  ],
  assessments: {
    data_centres: { observation_year: 2024, electricity_twh: 415, electricity_share_pct: 1.5, prior_five_year_growth_pct_per_year: 12, indirect_power_emissions_mt_co2: 180, investment_usd_billion: 500, global_extent: 1 },
    transformers: { assessment_year: 2026, power_transformer_price_increase_pct_five_years: 75, procurement_lead_time_years: 4, stalled_grid_queue_gw: 2500, current_grid_investment_usd_billion: 400, required_2030_grid_investment_usd_billion: 600, global_extent: 1 },
    electric_trucks: { observation_year: 2025, electric_sales_thousand_lower_bound: 400, electric_sales_share_pct: 9, non_electric_sales_share_pct: 91, purchase_price_multiple_midpoint: 2.5, assessed_regions: 5, global_extent: 1 },
    road_transport: { observation_year: 2024, road_transport_co2_gt: 6, emissions_growth_since_2015_pct: 8, passenger_car_van_share_lower_bound_pct: 60, passenger_car_van_co2_lower_bound_gt: 3.6, global_extent: 1 },
    plastics: { observation_year: 2019, production_mt: 460, waste_mt: 353, ultimately_recycled_pct: 9, leakage_mt: 22, lifecycle_emissions_gt_co2e: 1.8, global_ghg_share_pct: 3.4, global_extent: 1 },
    submarine_cables: { observation_year: 2025, international_data_exchange_share_pct: 99, active_and_planned_systems_lower_bound: 500, annual_repairs: 170, repair_frequency_per_week_approx: 4, global_extent: 1 },
    glacial_lake_outburst_floods: { observation_year: 2020, exposed_population_million: 15, exposed_countries: 30, glacial_lake_basins: 1089, high_mountain_asia_exposed_population_million: 9.3, high_mountain_asia_share_pct: 62, global_extent: 1 },
    pesticides: { assessment_year: 2022, pesticide_use_intensity_growth_since_1990_pct_lower_bound: 60, unintentional_poisonings_million_per_year: 385, deaths_per_year_approx: 11000, global_extent: 1 }
  },
  uncertainty: 'Assessment years and methods differ. Every receipt preserves its source boundary; global totals are not added across assessments, projections are excluded, missing values never become zero, and pathway-specific nodes retain explicit attribution uncertainty.'
};

await fs.writeFile(path.join(ROOT, 'public/global-cross-domain-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/global-cross-domain-impact-snapshot.json', version: snapshot.version, assessment_count: Object.keys(snapshot.assessments).length }, null, 2));
