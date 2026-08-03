import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const snapshot = {
  version: 'global_remaining_cohort_impact_2026_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'ipcc_ar6_wgii_ocean_coastal_ecosystems',
      name: 'IPCC AR6 WGII Chapter 3 — Ocean and Coastal Ecosystems',
      publisher: 'Intergovernmental Panel on Climate Change',
      url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/'
    },
    {
      id: 'cheung_global_fisheries_catch_warming_2013',
      name: 'Signature of ocean warming in global fisheries catch',
      publisher: 'Nature',
      url: 'https://www.nature.com/articles/nature12156',
      doi: '10.1038/nature12156'
    },
    {
      id: 'krumhansl_global_kelp_change_2016',
      name: 'Global patterns of kelp forest change over the past half-century',
      publisher: 'Proceedings of the National Academy of Sciences',
      url: 'https://www.pnas.org/doi/10.1073/pnas.1606102113',
      doi: '10.1073/pnas.1606102113'
    },
    {
      id: 'eger_global_kelp_services_2023',
      name: 'The value of ecosystem services in global marine kelp forests',
      publisher: 'Nature Communications',
      url: 'https://www.nature.com/articles/s41467-023-37385-0',
      doi: '10.1038/s41467-023-37385-0'
    },
    {
      id: 'lancet_landscape_fire_mortality_2000_2019',
      name: 'Global mortality burden attributable to air pollution from landscape fires',
      publisher: 'The Lancet',
      url: 'https://doi.org/10.1016/S0140-6736(24)02251-7',
      doi: '10.1016/S0140-6736(24)02251-7'
    },
    {
      id: 'lancet_countdown_wildfire_smoke_2024',
      name: '2024 report of the Lancet Countdown on health and climate change',
      publisher: 'The Lancet',
      url: 'https://doi.org/10.1016/S0140-6736(24)01822-1',
      doi: '10.1016/S0140-6736(24)01822-1'
    },
    {
      id: 'wildfire_hospitalization_meta_analysis_2025',
      name: 'Wildfire particulate matter, hospitalization, emergency visits and mortality meta-analysis',
      publisher: 'Environmental Research',
      url: 'https://doi.org/10.1016/j.envres.2025.120927',
      doi: '10.1016/j.envres.2025.120927'
    },
    {
      id: 'global_urban_expansion_uhi_risk_2000_2015',
      name: 'Quantifying heat-related risks from urban heat island effects',
      publisher: 'International Journal of Applied Earth Observation and Geoinformation',
      url: 'https://doi.org/10.1016/j.jag.2024.104215',
      doi: '10.1016/j.jag.2024.104215'
    }
  ],
  assessments: {
    marine_redistribution: {
      assessment_year: 2022,
      observed_distribution_shift_km_per_decade: 72,
      fisheries_catch_temperature_change_c_per_decade: 0.19,
      large_marine_ecosystems_assessed: 52,
      people_receiving_at_least_20pct_animal_protein_billion: 3.2,
      observed_change_window_years: 50,
      global_extent: 0.9
    },
    kelp_forest_change: {
      assessment_year: 2023,
      ecoregions_with_declines_pct: 38,
      ecoregions_with_increases_pct: 27,
      ecoregions_with_no_detectable_change_pct: 35,
      mean_decline_rate_per_year: 0.018,
      assessed_change_window_years: 50,
      annual_ecosystem_service_value_usd_billion: 500,
      twenty_year_net_present_value_usd_trillion: 7.44,
      global_extent: 0.8
    },
    landscape_fire_smoke: {
      assessment_year: 2019,
      observation_start_year: 2000,
      observation_end_year: 2019,
      annual_all_cause_deaths_million: 1.53,
      annual_cardiovascular_deaths_million: 0.45,
      annual_respiratory_deaths_million: 0.22,
      people_exposed_annually_billion: 2.18,
      pm25_share_of_attributable_deaths_pct: 77.6,
      global_extent: 1
    },
    wildfire_smoke_duration: {
      assessment_year: 2023,
      comparison_current_period: '2014-2023',
      comparison_baseline_period: '2003-2012',
      current_average_days_above_who_15ug_m3: 1.33,
      decrease_from_baseline_days: 0.07,
      decrease_from_baseline_pct: 5,
      who_daily_pm25_threshold_ug_m3: 15,
      global_extent: 1
    },
    wildfire_hospitalization: {
      assessment_year: 2024,
      literature_start_year: 2000,
      literature_end_year: 2024,
      patients_in_meta_analysis_million: 124,
      respiratory_hospital_admission_relative_risk_per_10ug_m3_pm25: 1.04,
      respiratory_hospital_admission_lower_95_ci: 1.02,
      respiratory_hospital_admission_upper_95_ci: 1.05,
      all_cause_mortality_relative_risk_per_10ug_m3_pm25: 1.02,
      global_extent: 0.8
    },
    abrupt_permafrost_thaw: {
      assessment_year: 2019,
      arctic_land_permafrost_vulnerable_to_abrupt_thaw_pct: 20,
      projected_small_lake_area_increase_pct: 50,
      projection_horizon_year: 2100,
      arctic_infrastructure_in_thaw_risk_regions_by_2050_pct: 70,
      adaptation_cost_reduction_potential_pct: 50,
      global_extent: 0.8
    },
    urban_heat_island: {
      assessment_year: 2015,
      observation_start_year: 2000,
      observation_end_year: 2015,
      urban_patches_assessed: 7554,
      global_population_facing_over_10pct_heat_risk_increase_pct: 2.3,
      heat_risk_increase_threshold_pct: 10,
      global_extent: 0.9
    }
  },
  uncertainty: 'Values preserve the assessment period, confidence interval, geographic boundary and reported statistic. Global or multicountry studies are not converted into local incidence, and system exposure is not relabeled as a realized outcome.'
};

await fs.writeFile(
  path.join(ROOT, 'public/global-remaining-cohort-impact-snapshot.json'),
  `${JSON.stringify(snapshot, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/global-remaining-cohort-impact-snapshot.json',
  version: snapshot.version,
  sources: snapshot.sources.length,
  assessments: Object.keys(snapshot.assessments).length
}, null, 2));
