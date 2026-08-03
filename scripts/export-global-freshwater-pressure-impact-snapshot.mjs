import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'global_freshwater_pressure_2026_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    { id: 'nature_global_lake_evaporation_1985_2018', name: 'Evaporative water loss of 1.42 million global lakes', publisher: 'Nature Communications', url: 'https://www.nature.com/articles/s41467-022-31125-6', doi: '10.1038/s41467-022-31125-6' },
    { id: 'journal_hydrology_global_reservoir_evaporation_1985_2016', name: 'Estimation of global reservoir evaporation losses', publisher: 'Journal of Hydrology', url: 'https://doi.org/10.1016/j.jhydrol.2022.127524', doi: '10.1016/j.jhydrol.2022.127524' },
    { id: 'iea_electricity_market_update_2023_hydropower', name: 'Electricity Market Report Update 2023', publisher: 'International Energy Agency', url: 'https://www.iea.org/reports/electricity-market-report-update-2023/executive-summary' },
    { id: 'science_global_lake_storage_1992_2020', name: 'Satellites reveal widespread decline in global lake water storage', publisher: 'Science', url: 'https://doi.org/10.1126/science.abo2812', doi: '10.1126/science.abo2812' },
    { id: 'nature_diminishing_reservoir_storage_returns_2023', name: 'Diminishing storage returns of reservoir construction', publisher: 'Nature Communications', url: 'https://doi.org/10.1038/s41467-023-38843-5', doi: '10.1038/s41467-023-38843-5' },
    { id: 'nature_global_groundwater_depletion_2002_2020', name: 'Groundwater depletion contributes to an increase in global carbon emissions', publisher: 'Nature Communications', url: 'https://www.nature.com/articles/s41467-026-73521-2', doi: '10.1038/s41467-026-73521-2' },
    { id: 'unesco_wwdr_groundwater_2022', name: 'UN World Water Development Report 2022 — Groundwater', publisher: 'UNESCO', url: 'https://www.unesco.org/en/reports/wwdr/2022' },
    { id: 'un_water_analytical_brief_2024', name: 'UN-Water Analytical Brief on Water for Climate Mitigation', publisher: 'UN-Water', url: 'https://www.unwater.org/sites/default/files/2024-11/un-water_analyticalbrief_on_water_for_climate_mitigation_unformatted_version_0.pdf' },
    { id: 'ipcc_ar6_synthesis_summary_for_policymakers', name: 'IPCC AR6 Synthesis Report Summary for Policymakers', publisher: 'Intergovernmental Panel on Climate Change', url: 'https://www.ipcc.ch/report/ar6/syr/summary-for-policymakers/' }
  ],
  assessments: {
    surface_water_evaporation: { observation_start_year: 1985, observation_end_year: 2018, lakes_assessed_million: 1.42, annual_lake_evaporation_km3: 1500, annual_lake_evaporation_uncertainty_km3: 150, annual_evaporation_increase_km3: 3.12, artificial_reservoirs_assessed: 7242, annual_reservoir_evaporation_km3: 339.8, reservoir_evaporation_as_2010_municipal_withdrawal_pct: 73, global_extent: 1 },
    reservoir_operating_shortfall: { assessment_year: 2022, historical_capacity_factor_start_year: 1990, historical_capacity_factor_end_year: 2016, historical_average_capacity_factor_pct: 38, recent_capacity_factor_start_year: 2020, recent_capacity_factor_end_year: 2022, recent_average_capacity_factor_pct: 36, annual_generation_shortfall_twh: 240, shortfall_fill: 'mostly fossil-fired generation', global_extent: 1 },
    reservoir_storage: { observation_start_year: 1992, observation_end_year: 2020, large_lakes_and_reservoirs_assessed: 1972, share_with_storage_decline_pct: 53, people_in_basin_of_drying_lake_billion: 2, existing_reservoir_storage_decline_gt_per_year: 13.19, construction_driven_capacity_increase_km3_per_year: 27.82, global_extent: 1 },
    groundwater_recharge_imbalance: { observation_start_year: 2002, observation_end_year: 2020, groundwater_depletion_km3_per_year: 550, groundwater_depletion_uncertainty_km3_per_year: 73, domestic_withdrawal_supplied_by_groundwater_pct: 50, irrigation_water_supplied_by_groundwater_pct: 25, global_groundwater_withdrawal_km3: 978, global_extent: 1 },
    surface_water_withdrawal: { assessment_year: 2024, total_global_water_withdrawal_km3_per_year: 4200, surface_water_share_pct: 73.42, calculated_surface_water_withdrawal_km3_per_year: 3083.64, global_population_experiencing_severe_water_scarcity_part_year_pct: 50, demand_growth_since_1980s_pct_per_year: 1, persistence_years: 40, global_extent: 1 }
  },
  uncertainty: 'Lake and reservoir estimates differ in inventory and method; the score retains each source boundary. Groundwater depletion measures a withdrawal-recharge imbalance rather than recharge alone. Global water-scarcity exposure has climatic and non-climatic causes and is not attributed solely to withdrawals.'
};
await fs.writeFile(path.join(ROOT, 'public/global-freshwater-pressure-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/global-freshwater-pressure-impact-snapshot.json', version: snapshot.version, assessments: Object.keys(snapshot.assessments).length }, null, 2));
