import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/unep-blue-ecosystems-impact-snapshot.json');
const snapshot = {
  version: 'unep_blue_ecosystems_mangrove_seagrass_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'unep_blue_ecosystems_global_assessments',
    name: 'UNEP global mangrove and seagrass assessments',
    publisher: 'United Nations Environment Programme',
    mangrove_url: 'https://www.unep.org/topics/ocean-seas-and-coasts/blue-ecosystems/mangrove-forests',
    mangrove_report_url: 'https://www.unep.org/resources/report/decades-mangrove-forest-change-what-does-it-mean-nature-people-and-climate',
    blue_carbon_url: 'https://www.unep.org/explore-topics/oceans-seas/what-we-do/protecting-restoring-blue-carbon-ecosystems/why-protecting'
  },
  ingestion_job_id: 'export_unep_blue_ecosystems_impact_snapshot',
  metric_contract_ids: ['mangrove_extent_and_shoreline_buffer_change', 'seagrass_meadow_area_change', 'coastal_blue_carbon_habitat_area_and_stock_loss', 'estuarine_nursery_habitat_extent_and_recruitment', 'tidal_wetland_net_greenhouse_gas_balance'],
  contract_bindings: [
    { node_id: 'mangrove_buffer_loss', metric_id: 'mangrove_extent_and_shoreline_buffer_change', measurement_role: 'global_assessment_accumulated_extent_carbon_and_human_exposure_primary' },
    { node_id: 'seagrass_meadow_decline', metric_id: 'seagrass_meadow_area_change', measurement_role: 'global_assessment_accumulated_extent_and_human_dependence_primary' },
    { node_id: 'blue_carbon_habitat_loss', metric_id: 'coastal_blue_carbon_habitat_area_and_stock_loss', measurement_role: 'global_assessment_mangrove_subset_area_carbon_damage_persistence_and_extent' },
    { node_id: 'estuarine_nursery_loss', metric_id: 'estuarine_nursery_habitat_extent_and_recruitment', measurement_role: 'global_assessment_seagrass_nursery_subset_area_fisheries_dependence_persistence_and_extent' },
    { node_id: 'tidal_wetland_carbon_reversal', metric_id: 'tidal_wetland_net_greenhouse_gas_balance', measurement_role: 'global_assessment_mangrove_subset_carbon_stock_reduction_damage_persistence_and_extent' }
  ],
  cadence: 'Refresh when UNEP or UNEP-WCMC publishes a harmonized global blue-ecosystem assessment.',
  provenance: 'Reviewed UNEP global status values. Mangrove 1996-2020 change comes from Global Mangrove Watch analysis; seagrass historical loss and distribution are assessment syntheses rather than a live occurrence-derived trend.',
  uncertainty: 'Historical baselines, habitat definitions, remote-sensing classification, unmapped small patches, natural gains and losses, carbon-stock methods, service valuation and proximity-based population exposure affect estimates. Proximity does not establish individual dependence.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale; reject changed habitat classes or dates; never derive area loss from occurrence records, add mangrove and seagrass areas, equate proximity with household dependence or score future risk as observed loss.',
  assessments: {
    mangrove: {
      latest_extent_year: 2020,
      baseline_year: 1996,
      persistence_years: 24,
      global_extent_km2: 147359,
      net_area_loss_km2: 5245,
      net_area_loss_pct: 3.4,
      carbon_stock_reduction_megatonnes_carbon: 139,
      countries_with_mangroves: 123,
      global_country_denominator: 195,
      people_within_10km_mangrove_million: 100,
      estimated_annual_economic_damage_usd_billion_low: 6,
      estimated_annual_economic_damage_usd_billion_high: 42,
      source_locators: [
        'UNEP Mangrove forests, ecological status: 147,359 square kilometres in 2020 and net loss of 5,245 square kilometres, or 3.4 percent, since 1996.',
        'UNEP blue ecosystems assessment: mangroves occur in 123 countries and about 100 million people live within 10 kilometres of significant mangrove areas.',
        'UNEP interactive blue-ecosystem synthesis: 1996-2020 mangrove loss reduced carbon stocks by 139 megatonnes of carbon.',
        'UNEP mangrove assessment: emissions resulting from mangrove losses are associated with estimated annual economic damages of 6-42 billion US dollars.'
      ]
    },
    seagrass: {
      assessment_year: 2025,
      observed_decline_start_year: 1930,
      persistence_years: 95,
      global_extent_million_ha_lower_bound: 30,
      historical_area_lost_pct_approx: 30,
      recent_global_habitat_loss_rate_pct_per_year_estimate: 7,
      countries_with_seagrass: 159,
      global_country_denominator: 195,
      people_within_100km_billion_lower_bound: 1,
      largest_fisheries_with_nursery_dependence_pct: 20,
      ocean_floor_share_pct: 0.1,
      greenhouse_gas_release_from_destruction_and_degradation_gtco2e_per_year_upper_bound: 0.65,
      source_locators: [
        'UNEP blue ecosystems assessment: seagrasses occur in 159 countries and cover more than 30 million hectares.',
        'UNEP seagrass status assessment: seagrasses have declined globally since the 1930s and the latest cited census estimates annual global habitat loss at 7 percent.',
        'UNEP blue ecosystems assessment: more than one billion people live within 100 kilometres of seagrass meadows.',
        'UNEP blue ecosystems assessment: seagrass nursery habitat supports one fifth of the world’s largest fisheries.',
        'UNEP blue ecosystems synthesis: destruction and degradation potentially release up to 0.65 gigatonnes of greenhouse gases per year.'
      ]
    }
  },
  excluded_from_scoring: [
    '2050 ecosystem-collapse risk',
    'future restoration targets and restorable area',
    'future-loss continuation scenarios',
    'raw OBIS occurrence counts as habitat-area evidence'
  ]
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, assessments: Object.keys(snapshot.assessments), metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
