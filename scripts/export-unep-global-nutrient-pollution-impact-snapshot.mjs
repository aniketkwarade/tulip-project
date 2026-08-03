import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/unep-global-nutrient-pollution-impact-snapshot.json');

const snapshot = {
  version: 'unep_global_nutrient_pollution_impact_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'unep_global_nutrient_pollution_impact',
    name: 'UNEP Global Nutrient Pollution Assessment',
    publisher: 'United Nations Environment Programme',
    review_year: 2024,
    nitrogen_url: 'https://www.unep.org/facts-about-nitrogen-pollution',
    nutrient_management_url: 'https://www.unep.org/explore-topics/oceans-seas/global-partnership-nutrient-management/nutrient-management-issue',
    agricultural_runoff_url: 'https://www.unep.org/news-and-stories/story/fridayfact-more-half-nitrogen-applied-cropland-now-washing-our-rivers'
  },
  ingestion_job_id: 'export_unep_global_nutrient_pollution_impact_snapshot',
  metric_contract_ids: [
    'surface_water_total_nutrient_concentration',
    'riverine_dissolved_inorganic_nitrogen_load',
    'estuary_nutrient_eutrophication_condition',
    'coastal_dissolved_oxygen',
    'continental_shelf_bottom_water_hypoxia'
  ],
  contract_bindings: [
    { node_id: 'nutrient_pollution', metric_contract_id: 'surface_water_total_nutrient_concentration', measurement_role: 'global_accumulated_reactive_nitrogen_loss_cost_persistence_and_extent' },
    { node_id: 'nitrogen_fertilizer_runoff', metric_contract_id: 'riverine_dissolved_inorganic_nitrogen_load', measurement_role: 'global_accumulated_fertilizer_nitrogen_escape_cost_persistence_and_extent' },
    { node_id: 'estuary_eutrophication', metric_contract_id: 'estuary_nutrient_eutrophication_condition', measurement_role: 'global_accumulated_coastal_eutrophication_inventory_fisheries_exposure_and_persistence' },
    { node_id: 'anoxic_dead_zones', metric_contract_id: 'coastal_dissolved_oxygen', measurement_role: 'global_accumulated_dead_zone_inventory_fisheries_exposure_and_persistence' },
    { node_id: 'shelf_sea_hypoxia', metric_contract_id: 'continental_shelf_bottom_water_hypoxia', measurement_role: 'global_accumulated_coastal_shelf_hypoxia_inventory_fisheries_exposure_and_persistence' }
  ],
  cadence: 'Annual review of UNEP nitrogen and Global Partnership on Nutrient Management assessments.',
  provenance: 'Official UNEP global nutrient-management findings. Reactive-nitrogen loss, fertilizer escape, annual resource cost, eutrophication inventory, documented dead-zone change and fisheries dependence are retained separately and never added together.',
  uncertainty: 'Reactive-nitrogen budgets combine air, soil, freshwater and marine pathways. The annual resource-cost estimate is global nitrogen loss, not an allocated water-pollution damage value. Coastal-system inventories depend on monitoring and definitions and therefore are lower bounds. Fisheries dependence is economic-system exposure, not realized attributable loss.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale. Reject changed nitrogen, cost, site, period or fisheries boundaries. Never convert affected-site counts to area, allocate the global nitrogen cost to a specific estuary, infer an unmonitored coast as unaffected, add site inventories, or fill missing values with zero.',
  assessment: {
    review_year: 2024,
    reactive_nitrogen_lost_to_environment_million_tonnes_per_year: 200,
    reactive_nitrogen_lost_share_pct: 80,
    annual_lost_nitrogen_resource_cost_usd_billion: 200,
    agricultural_nitrogen_washing_into_rivers_lower_bound_pct: 50,
    human_reactive_nitrogen_production_million_tonnes_per_year: 120,
    human_reactive_nitrogen_polluting_environment_share_approx_pct: 66.6667,
    phosphorus_mined_million_tonnes_per_year: 20,
    phosphorus_entering_oceans_share_approx_pct: 50,
    coastal_areas_impacted_by_eutrophication_lower_bound: 500,
    documented_dead_zones_1960: 10,
    documented_dead_zones_2008: 405,
    dead_zone_inventory_growth_period_years: 48,
    fisheries_dependent_on_estuarine_and_nearshore_habitat_pct: 90,
    global_extent_normalized: 1,
    geographic_scope: 'Worldwide nutrient losses to air, soil, rivers, lakes, marine and coastal systems; coastal eutrophication and dead-zone inventories are global lower bounds',
    source_locators: {
      biophysical_burden: 'UNEP nitrogen facts: 200 million tonnes of reactive nitrogen, or 80 percent, is lost to the environment each year, including leaching to soil, rivers and lakes.',
      economic_burden: 'UNEP nitrogen facts: annual cost of lost nitrogen resources is estimated at around US$200 billion.',
      agricultural_runoff: 'UNEP agricultural-runoff summary: more than half of nitrogen applied to farmland washes into rivers rather than being absorbed by crops.',
      eutrophication_extent: 'UNEP nutrient-management issue: more than 500 coastal areas worldwide are impacted by eutrophication caused by excess nutrients.',
      persistence: 'UNEP nutrient-management issue: documented ocean dead zones increased from 10 in 1960 to 405 in 2008.',
      fisheries_exposure: 'UNEP nutrient-management issue: more than 90 percent of world fisheries depend in some way on estuarine and near-shore habitats.'
    }
  },
  excluded_from_scoring: [
    'regional European nutrient-pollution cost ranges',
    'United States-only eutrophication costs',
    'dead-zone count converted to area or volume',
    'fisheries dependence treated as realized loss',
    'reactive-nitrogen pathways added across overlapping budgets',
    'unreported uncertainty as zero'
  ]
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output: OUTPUT_PATH,
  reactive_nitrogen_lost_million_tonnes: snapshot.assessment.reactive_nitrogen_lost_to_environment_million_tonnes_per_year,
  annual_resource_cost_usd_billion: snapshot.assessment.annual_lost_nitrogen_resource_cost_usd_billion,
  promoted_bindings: snapshot.contract_bindings.length
}, null, 2));
