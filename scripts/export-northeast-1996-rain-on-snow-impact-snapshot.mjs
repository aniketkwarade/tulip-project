import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'northeast_us_rain_on_snow_flood_january_1996_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'noaa_ncei_january_1996_blizzard_flood_report',
      name: 'January 1996 Blizzard and Floods, Technical Report 96-02',
      publisher: 'NOAA National Climatic Data Center',
      publication_date: '1996-04-01',
      url: 'https://www.ncei.noaa.gov/monitoring-content/billions/reports/19960101-19960131-winter-storm/tr9602.pdf',
      source_locators: ['Flood summary: moderate-to-heavy rain and rapid snowmelt produced serious flooding in the Delaware, Susquehanna, upper Ohio, Potomac and James basins, with crests as much as 20 feet above flood stage.', 'Impact summary: 33 deaths, more than 200,000 people forced from homes, and more than USD 500 million damage to state and local highways and bridges.', 'Hydrology examples: Potomac River flow reached 312,000 cfs at Point of Rocks and the Susquehanna reached 570,000 cfs at Harrisburg.']
    },
    {
      id: 'usgs_pennsylvania_statewide_floods_january_1996',
      name: 'Statewide Floods in Pennsylvania, January 1996',
      publisher: 'U.S. Geological Survey',
      publication_date: '1996-06-01',
      url: 'https://www.usgs.gov/publications/statewide-floods-pennsylvania-january-1996',
      source_locators: ['Meteorological sequence: rainfall locally above 3 inches combined with rapid melt of snowpack holding 3 to 5.5 inches water equivalent.', 'Event timing and observed confirmation: stream stages and discharges peaked January 19-21 at 189 monitored streamflow-gaging stations; major flooding affected all three major Pennsylvania drainage basins.', 'Impact boundary: 20 Pennsylvania deaths and about 50 localities affected by ice-jam amplification.']
    }
  ],
  metric_contract: {
    node_id: 'rain_on_snow_flood_risk',
    metric_id: 'rain_on_snow_flood_risk',
    unit: 'observed flood crest above named flood stage, peak streamflow, event duration, deaths, displaced people and infrastructure damage',
    geography: 'named northeastern United States river basins and downstream forecast reaches',
    assessment_period: '1996-01-19 to 1996-01-21',
    boundary: 'This is a confirmed observed flood following rain and rapid snowmelt over a documented snowpack. It does not classify rain-on-snow occurrence alone as a flood and does not extrapolate this regional event globally.'
  },
  accumulated_impact: {
    maximum_crest_above_flood_stage_feet: 20,
    potomac_point_of_rocks_peak_cfs: 312000,
    susquehanna_harrisburg_peak_cfs: 570000,
    rainfall_local_maximum_inches: 3,
    snowpack_water_equivalent_min_inches: 3,
    snowpack_water_equivalent_max_inches: 5.5,
    deaths: 33,
    people_forced_from_homes_more_than: 200000,
    road_and_bridge_damage_usd_more_than: 500000000,
    peak_start_date: '1996-01-19',
    peak_end_date: '1996-01-21',
    peak_duration_days: 3,
    represented_major_river_basin_count: 5,
    represented_country_count: 1,
    represented_country: 'United States'
  },
  reviewed_normalization_anchors: {
    crest_above_flood_stage_feet: [0, 1, 5, 20],
    road_and_bridge_damage_usd: [0, 10000000, 100000000, 1000000000],
    peak_duration_days: [0, 1, 3, 10],
    represented_major_river_basin_count: [0, 1, 5, 20]
  },
  uncertainty: 'The 20-foot value is the maximum among reported basin crests, not a uniform regional stage departure. The USD 500 million figure covers state and local highway and bridge damage and is a lower bound, not total flood damage. More than 200,000 displaced people is retained as context and does not add separate points. Ice jams amplified flooding in some localities, so not all observed damage is attributable to snowmelt volume alone. Coverage is one multi-basin United States event.'
};

await fs.writeFile(path.join(ROOT, 'public/northeast-1996-rain-on-snow-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/northeast-1996-rain-on-snow-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
