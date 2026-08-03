import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'cape_may_coastal_groundwater_withdrawal_intrusion_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'usgs_circular_1262_cape_may_saltwater_intrusion',
      name: 'Ground Water in Freshwater-Saltwater Environments of the Atlantic Coast',
      publisher: 'U.S. Geological Survey',
      publication_date: '2003-01-01',
      url: 'https://pubs.usgs.gov/circ/2003/circ1262/',
      source_locators: [
        'Cape May County withdrawals lowered groundwater levels as much as 100 feet and caused saltwater to intrude each of the five freshwater aquifers used by the peninsula.',
        'Saltwater intrusion began about 1890 after deep-well pumping first lowered fresh-groundwater levels below sea level.',
        'Intrusion forced closure of at least 20 public- and industrial-supply wells and more than 100 domestic wells since the 1940s; affected communities include Cape May Point, Cape May City, Wildwood Island communities, Lower Township and Middle Township.'
      ]
    },
    {
      id: 'usgs_wrir_01_4246_cape_may_water_supply_intrusion',
      name: 'Hydrogeologic Framework, Availability of Water Supplies, and Saltwater Intrusion, Cape May County',
      publisher: 'U.S. Geological Survey',
      publication_date: '2002-01-01',
      url: 'https://pubs.usgs.gov/wri/wri014246/',
      source_locators: [
        'During 1960-1990, intrusion forced abandonment of at least 10 public-supply wells, 3 industrial-supply wells and more than 100 domestic-supply wells.',
        'In southern Cape May County about 20 percent of recharge is diverted to withdrawal wells.',
        'Chloride concentrations increased in many confined-aquifer wells along both the Atlantic and Delaware Bay coastlines.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'coastal_groundwater_withdrawal',
    metric_id: 'coastal_groundwater_withdrawal',
    unit: 'withdrawal-linked hydraulic-head decline, abandoned supply wells, elapsed intrusion duration and named affected communities',
    geography: 'Cape May County coastal aquifer system, New Jersey',
    assessment_period: '1890-01-01 to 2002-12-31',
    boundary: 'USGS directly links pumping, groundwater levels below sea level, landward saltwater movement and well abandonment in the named aquifer system. The receipt does not attribute all salinity to pumping, transfer measurements between aquifers, or extrapolate Cape May conditions to other coasts.'
  },
  accumulated_impact: {
    maximum_groundwater_level_decline_feet: 100,
    affected_freshwater_aquifer_count: 5,
    public_and_industrial_supply_wells_closed_at_least: 20,
    domestic_supply_wells_closed_more_than: 100,
    total_supply_wells_closed_conservative_lower_bound: 120,
    intrusion_start_year_about: 1890,
    assessment_end_year: 2002,
    elapsed_intrusion_years: 112,
    named_affected_communities: ['Cape May Point', 'Cape May City', 'Wildwood Island communities', 'Lower Township', 'Middle Township'],
    named_affected_community_count: 5,
    represented_county: 'Cape May County',
    represented_state: 'New Jersey',
    assessment_end_date: '2002-12-31'
  },
  reviewed_normalization_anchors: {
    groundwater_level_decline_feet: [0, 5, 25, 100],
    abandoned_supply_well_count: [0, 1, 10, 100],
    elapsed_intrusion_years: [0, 5, 25, 100],
    named_affected_community_count: [0, 1, 5, 20]
  },
  uncertainty: 'The 100-foot head decline is a maximum across the county, not a uniform aquifer departure. At least 20 public and industrial wells plus more than 100 domestic wells yields a conservative lower bound of 120 and not an exact total. The approximately 1890 start is historical, and the assessment endpoint follows the detailed 2002 report rather than implying intrusion stopped then. Storm flooding, road salt, septic systems and agriculture can also elevate chloride locally; the receipt uses only the USGS pumping-linked coastal intrusion boundary. Extent is one county and five named communities.'
};

await fs.writeFile(path.join(ROOT, 'public/cape-may-coastal-groundwater-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/cape-may-coastal-groundwater-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
