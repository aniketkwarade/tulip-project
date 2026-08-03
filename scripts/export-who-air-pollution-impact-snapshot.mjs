import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/who-air-pollution-impact-snapshot.json');
const snapshot = {
  version: 'who_global_air_pollution_impact_2025_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'who_global_air_pollution_data_portal',
    name: 'WHO Air Pollution Data Portal and Global Air Quality Guidelines',
    publisher: 'World Health Organization',
    portal_url: 'https://www.who.int/data/gho/data/themes/air-pollution',
    guidelines_url: 'https://www.who.int/news-room/questions-and-answers/item/who-global-air-quality-guidelines',
    assembly_update_url: 'https://www.who.int/news/item/26-05-2025-seventy-eighth-world-health-assembly---daily-update--26-may-2025'
  },
  ingestion_job_id: 'export_who_air_pollution_impact_snapshot',
  metric_contract_ids: ['air_pollution_attributable_health_burden', 'air_quality_standard_exceedance_days'],
  contract_bindings: [
    { node_id: 'air_pollution_health_burden', metric_id: 'air_pollution_attributable_health_burden', measurement_role: 'global_assessment_accumulated_exposure_and_mortality_primary' },
    { node_id: 'ambient_air_quality_deficit', metric_id: 'air_quality_standard_exceedance_days', measurement_role: 'global_assessment_population_above_who_guidelines_mortality_persistence_and_extent' }
  ],
  cadence: 'Refresh when WHO updates its global comparative-risk assessment, exposure estimate or air-quality guideline.',
  provenance: 'Reviewed WHO global exposure and attributable-burden statements. Ambient-only country rate estimates remain in the separate operational GHO snapshot and are not summed without population weights.',
  uncertainty: 'WHO comparative-risk estimates combine modeled population exposure, integrated exposure-response functions, background disease burden and population data. Ambient and household exposure overlap; global totals are statistically adjusted to avoid double counting.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale; reject incompatible exposure or mortality boundaries; never sum ambient and household deaths, population-average country rates or uncertainty bounds, and never replace missing country values with zero.',
  assessment: {
    latest_portal_burden_year: 2021,
    latest_portal_update_year: 2025,
    persistence_reference_start_year: 2019,
    persistence_years: 6,
    global_population_above_who_guideline_pct: 99,
    joint_ambient_and_household_air_pollution_deaths_million: 6.6,
    people_relying_on_polluting_cooking_fuels_billion_2024: 2,
    ambient_air_pollution_deaths_million_2019: 4.2,
    low_and_middle_income_share_ambient_deaths_pct: 89,
    source_locators: [
      'WHO Air Pollution Data Portal: 6.6 million deaths in 2021 from ambient and household air-pollution exposure.',
      'WHO Air Pollution Data Portal and 2025 World Health Assembly update: 99 percent of the global population is exposed above WHO air-quality guideline levels.',
      'WHO Air Pollution Data Portal: two billion people primarily relied on polluting cooking fuels and technologies in 2024.',
      'WHO ambient air-pollution fact sheet: 4.2 million premature deaths in 2019, 89 percent in low- and middle-income countries.'
    ]
  }
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, burden_year: snapshot.assessment.latest_portal_burden_year, metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
