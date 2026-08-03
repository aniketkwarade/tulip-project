import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/ioc-global-ocean-oxygen-impact-snapshot.json');
const snapshot = {
  version: 'ioc_unesco_go2ne_global_ocean_oxygen_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'ioc_unesco_global_ocean_oxygen_network',
    name: 'IOC-UNESCO Global Ocean Oxygen Network',
    publisher: 'Intergovernmental Oceanographic Commission of UNESCO',
    url: 'https://www.ioc.unesco.org/en/go2ne',
    state_of_ocean_report_url: 'https://unesdoc.unesco.org/ark:/48223/pf0000381921',
    ocean_livelihood_context_url: 'https://www.unesco.org/en/ocean-decade/about'
  },
  ingestion_job_id: 'export_ioc_global_ocean_oxygen_impact_snapshot',
  metric_contract_ids: ['noaa_gulf_midsummer_hypoxic_zone_area', 'dissolved_oxygen_inventory_and_deficit'],
  contract_bindings: [
    { node_id: 'coastal_hypoxia', metric_id: 'noaa_gulf_midsummer_hypoxic_zone_area', measurement_role: 'global_accumulated_coastal_hypoxia_extent_companion' },
    { node_id: 'oceanic_deoxygenation', metric_id: 'dissolved_oxygen_inventory_and_deficit', measurement_role: 'global_ocean_deoxygenation_assessment_context' }
  ],
  cadence: 'IOC-UNESCO GO2NE assessment release review.',
  provenance: 'Official IOC-UNESCO synthesis retaining open-ocean low-oxygen area growth and inventoried coastal low-oxygen sites as separate assessment findings.',
  uncertainty: 'Coastal monitoring is geographically uneven and underreporting is likely, especially in the tropics. Site inventories do not provide consistent area, duration, severity or observation cadence and cannot be summed into a global hypoxic area.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale; reject changed start dates, area units or site definitions. Never convert site count to area, infer unmonitored coasts as oxygenated, or combine open-ocean and coastal extents.',
  assessment: {
    assessment_year: 2025,
    comparison_start_decade: 1960,
    low_oxygen_open_ocean_area_increase_million_km2: 4.5,
    coastal_low_oxygen_sites_lower_bound: 500,
    ocean_dependent_livelihoods_million_lower_bound: 500,
    geographic_scope: 'global open ocean, estuaries and other coastal water bodies',
    global_extent_normalized: 1,
    source_locators: [
      'IOC-UNESCO GO2NE: since the 1960s, low-oxygen open-ocean area increased by 4.5 million square kilometres.',
      'IOC-UNESCO GO2NE: over 500 low-oxygen sites identified in estuaries and other coastal water bodies.',
      'UNESCO Ocean Decade: the ocean directly supports the livelihoods of about 500 million people, retained as exposed ocean-service scope rather than attributable harm.'
    ]
  },
  excluded_from_scoring: ['site-count-to-area conversion', 'uniform global oxygen decline', 'unmonitored coast classification', 'open-ocean area added to coastal area']
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, coastal_sites_lower_bound: snapshot.assessment.coastal_low_oxygen_sites_lower_bound }, null, 2));
