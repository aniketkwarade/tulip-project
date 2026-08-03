import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assessedVillages = [
  { name: 'Kivalina', relocation_cost_lower_bound_usd: 80000000, relocation_cost_upper_bound_usd: 200000000 },
  { name: 'Newtok', relocation_cost_lower_bound_usd: 80000000, relocation_cost_upper_bound_usd: 200000000 },
  { name: 'Shishmaref', relocation_cost_lower_bound_usd: 80000000, relocation_cost_upper_bound_usd: 200000000 }
];
const snapshot = {
  version: 'usgs_gao_alaska_coastal_permafrost_erosion_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'usgs_northern_alaska_shoreline_change_2015',
      name: 'Northern Alaska Coastal Erosion Threatens Habitat and Infrastructure',
      publisher: 'U.S. Geological Survey',
      publication_date: '2015-09-01',
      url: 'https://www.usgs.gov/centers/pcmsc/news/northern-alaska-coastal-erosion-threatens-habitat-and-infrastructure',
      source_locator: 'USGS reports analysis of more than 1,600 km of northern Alaska coast over more than half a century, with most coast retreating faster than 1 m/year and net average shoreline loss of 1.4 m/year.'
    },
    {
      id: 'gao_09_551_alaska_village_erosion_relocation',
      name: 'Alaska Native Villages: Limited Progress Has Been Made on Relocating Villages Threatened by Flooding and Erosion',
      publisher: 'U.S. Government Accountability Office',
      report_number: 'GAO-09-551',
      publication_date: '2009-06-03',
      product_url: 'https://www.gao.gov/products/gao-09-551',
      accessible_text_url: 'https://www.gao.gov/assets/a290474.html',
      source_locator: 'GAO reports Army Corps estimates that Kivalina, Newtok and Shishmaref each faced $80 million-$200 million relocation costs and 10-15 years before existing locations were lost to erosion.'
    }
  ],
  metric_contract: {
    node_id: 'coastal_permafrost_erosion',
    metric_id: 'coastal_permafrost_retreat',
    unit: 'metres of shoreline retreat per year with separately bounded associated relocation cost',
    geography: 'named northern Alaska Arctic coastline and three named Alaska Native villages',
    period: 'more than half a century through the 2015 USGS assessment; 2006 Army Corps cost assessment reported by GAO in 2009',
    boundary: 'USGS shoreline retreat is directly scored as the permafrost-coast burden. Village relocation costs are associated with compound flooding and erosion in the same Arctic setting and are not attributed wholly to permafrost thaw.'
  },
  accumulated_impact: {
    studied_coastline_km_lower_bound: 1600,
    net_average_shoreline_retreat_m_per_year: 1.4,
    observed_record_years_lower_bound: 50,
    most_coast_retreat_rate_m_per_year_lower_bound: 1,
    assessed_villages: assessedVillages,
    assessed_village_count: assessedVillages.length,
    combined_relocation_cost_lower_bound_usd: assessedVillages.reduce((sum, village) => sum + village.relocation_cost_lower_bound_usd, 0),
    combined_relocation_cost_upper_bound_usd: assessedVillages.reduce((sum, village) => sum + village.relocation_cost_upper_bound_usd, 0),
    corps_estimated_location_loss_years_lower_bound: 10,
    corps_estimated_location_loss_years_upper_bound: 15,
    directly_assessed_country_count: 1
  },
  reviewed_normalization_anchors: {
    shoreline_retreat_m_per_year: [0, 0.25, 1, 5],
    associated_relocation_cost_usd: [0, 25000000, 100000000, 600000000],
    observation_record_years: [0, 5, 20, 50],
    directly_assessed_countries: [0, 1, 10, 100]
  },
  uncertainty: 'Shoreline response varies strongly by bluff type, exposure, sea ice, storms and interval, and the 1.4 m/year figure is a net regional average that includes erosion and accretion. The human/economic component uses the lower bound of three historical relocation-cost ranges; flooding, storms and erosion act together, so the cost is associated burden rather than a permafrost-only attribution. The assessment covers one country and is not a pan-Arctic census.'
};

await fs.writeFile(path.join(ROOT, 'public/alaska-coastal-permafrost-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/alaska-coastal-permafrost-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
