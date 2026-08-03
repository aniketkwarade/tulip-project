import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/global-drinking-water-service-impact-snapshot.json');
const snapshot = {
  version: 'who_unicef_jmp_2025_drinking_water_snapshot_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'who_unicef_jmp_2025',
    name: 'WHO/UNICEF JMP Progress on Household Drinking Water, Sanitation and Hygiene 2000-2024',
    publishers: ['World Health Organization', 'UNICEF'],
    publication_year: 2025,
    observation_year: 2024,
    who_url: 'https://www.who.int/publications/b/80981',
    unicef_url: 'https://data.unicef.org/resources/jmp-report-2025/',
    drinking_water_url: 'https://data.unicef.org/topic/water-and-sanitation/drinking-water/'
  },
  ingestion_job_id: 'export_global_drinking_water_service_impact_snapshot',
  metric_contract_ids: ['global_safely_managed_drinking_water_service_gap'],
  contract_bindings: [
    { node_id: 'urban_hydrologic_supply_shortfall', metric_id: 'global_safely_managed_drinking_water_service_gap', measurement_role: 'global_service_gap_primary' },
    { node_id: 'drinking_water_treatment_stress', metric_id: 'global_safely_managed_drinking_water_service_gap', measurement_role: 'global_service_gap_primary' },
    { node_id: 'urban_source_water_treatment_constraint', metric_id: 'global_safely_managed_drinking_water_service_gap', measurement_role: 'global_service_gap_primary' }
  ],
  cadence: 'Annual after WHO/UNICEF JMP release.',
  provenance: 'Reviewed JMP global 2024 service estimates and 2000-2024 trend interval. Service ladder categories are retained separately and are not summed.',
  uncertainty: 'Safely managed service requires accessibility, availability and freedom from contamination; national monitoring coverage and modeled estimates vary. The gap does not isolate hydrologic supply, treatment plant capacity or raw-water quality.',
  failure_behavior: 'Retain the last reviewed JMP release and mark stale; never add mutually nested service categories, infer utility rationing or treatment failure, or replace missing countries with zero.',
  assessment: {
    observation_year: 2024,
    trend_start_year: 2000,
    persistence_years: 24,
    global_population_billion: 8.2,
    people_lacking_safely_managed_drinking_water_billion: 2.1,
    safely_managed_drinking_water_coverage_pct: 74,
    safely_managed_service_gap_pct: 26,
    people_with_basic_service_billion: 1.5,
    people_with_limited_service_million: 287,
    people_using_unimproved_sources_million: 302,
    people_drinking_surface_water_million: 106,
    people_gaining_safely_managed_service_2015_2024_million: 961,
    countries_with_safely_managed_estimates: 160,
    countries_areas_territories_covered: 235,
    geography_boundary: 'Global household drinking-water service ladder',
    source_locators: [
      'WHO/UNICEF JMP 2025: 2.1 billion people lacked safely managed drinking water in 2024.',
      'UNICEF drinking-water update: global safely managed coverage rose from 68% in 2015 to 74% in 2024.',
      'WHO report: global trend series spans 2000-2024 and population grew from 6.2 to 8.2 billion.'
    ]
  }
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
