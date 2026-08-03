import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/fao-world-cereal-feed-share-snapshot.json');
const historicSupply = [802836,838637,860654,897718,948255,970684,996643,1028379,1071445,1114780,1141194,1175184,1219272,1196459,1225983,1257597,1310383,1374715,1406731,1424034,1446125,1489792,1521218,1564427,1576409,1617625,1646565,1629106,1679623,1710957,1704686,1727700,1728077,1754266,1763908,1815613,1823562,1833561,1847916,1878205,1914466,1918685,1942169,2008645,2025602,2046267,2107877,2207228,2196861,2231395,2295173,2291574,2407008];
const historicFeed = [289169,302537,310569,324437,360874,376605,390737,412502,439890,456030,484065,503643,515910,489711,497769,517365,548903,579852,600680,594020,601061,616256,607157,636623,631350,658580,655469,617466,635839,654603,642564,661221,650463,664244,645462,674382,681465,676135,676883,698891,723054,713899,716065,757630,752183,736850,754416,811819,764443,758551,801903,795698,873548];
const currentSupply = [2532771,2585939,2593582,2683553,2713355,2805230,2899135,2942693,2934619,3001137,3056866,3117304,3131399,3171519];
const currentFeed = [803709,824149,832010,870560,889635,931301,958917,995444,1001859,1054678,1074100,1112306,1134954,1122217];
const historic = historicSupply.map((supply_1000_t, index) => ({ year: 1961 + index, supply_1000_t, feed_1000_t: historicFeed[index], feed_share_pct: 100 * historicFeed[index] / supply_1000_t }));
const current = currentSupply.map((supply_1000_t, index) => ({ year: 2010 + index, supply_1000_t, feed_1000_t: currentFeed[index], feed_share_pct: 100 * currentFeed[index] / supply_1000_t }));
const overlap = current.slice(0, 4).map(point => {
  const comparison = historic.find(candidate => candidate.year === point.year);
  return { year: point.year, feed_share_offset_percentage_points: point.feed_share_pct - comparison.feed_share_pct, feed_mass_ratio: point.feed_1000_t / comparison.feed_1000_t };
});
const meanShareOffset = overlap.reduce((sum, point) => sum + point.feed_share_offset_percentage_points, 0) / overlap.length;
const meanFeedRatio = overlap.reduce((sum, point) => sum + point.feed_mass_ratio, 0) / overlap.length;
const harmonized = [
  ...historic.filter(point => point.year < 2010).map(point => ({ year: point.year, feed_share_pct: point.feed_share_pct + meanShareOffset, feed_1000_t: point.feed_1000_t * meanFeedRatio, basis: 'historic_overlap_crosswalk' })),
  ...current.map(point => ({ ...point, basis: 'current_food_balance_sheet' }))
];

if (historic.length !== 53 || current.length !== 14 || harmonized.length !== 63 || harmonized.at(-1).year !== 2023) throw new Error('FAOSTAT cereal-feed panel gate failed.');

const snapshot = {
  version: 'faostat_world_cereal_feed_share_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'faostat_world_cereal_feed_share',
    name: 'FAOSTAT Food Balance Sheets: World cereals excluding beer',
    publisher: 'Food and Agriculture Organization of the United Nations',
    landing_url: 'https://www.fao.org/faostat/en/#data/FBS',
    current_bulk_url: 'https://bulks-faostat.fao.org/production/FoodBalanceSheets_E_All_Data_(Normalized).zip',
    current_bulk_sha256: '26200855ed5da3d0805e34219124e241d0e0bc6959d0995ebc77a10dd84cbaf1',
    current_release_file_timestamp: '2025-10-14T12:03:00Z',
    historic_bulk_url: 'https://bulks-faostat.fao.org/production/FoodBalanceSheetsHistoric_E_All_Data_(Normalized).zip',
    historic_bulk_sha256: '925bac969ea3904eca1a33f0b3d7ea4416bbac79d14db50b0db43cd2a77a3adb',
    historic_release_file_timestamp: '2024-02-05T11:00:00Z'
  },
  ingestion_job_id: 'export_fao_world_cereal_feed_share_snapshot',
  metric_contract_ids: ['livestock_feed_crop_use_share'],
  contract_bindings: [{ node_id: 'feed_crop_dependency', metric_id: 'livestock_feed_crop_use_share', measurement_role: 'global_cereal_feed_mass_and_share_of_domestic_supply' }],
  cadence: 'Annual FAOSTAT Food Balance Sheets release.',
  provenance: 'Exact World aggregate rows for item 2905, Cereals - Excluding Beer, retain source elements Feed and Domestic supply quantity in 1,000 tonnes. Current-basis 2010-2023 values are primary. The 1961-2013 historical edition is crosswalked only for historical normalization using the mean share offset and mean feed-mass ratio observed across the four overlapping years 2010-2013.',
  uncertainty: 'Food balance sheets synthesize production, trade, stocks and utilization estimates. Commodity moisture and composition differ, feed can include processing by-products, and revisions or methodological editions change values. The overlap crosswalk assumes a stable mean edition difference and is used only for historical normalization, not to alter current observations.',
  failure_behavior: 'Retain the last checksum-validated current series and mark stale. Reject changed World, item, element, unit, year or checksum definitions. Never combine commodity masses outside the declared Cereals - Excluding Beer basket, fill missing utilization with zero, call feed use livestock intake or splice editions without an overlap crosswalk.',
  assessment: {
    geography: 'World',
    item_code: 2905,
    item: 'Cereals - Excluding Beer',
    feed_element_code: 5521,
    supply_element_code: 5301,
    unit: '1,000 tonnes',
    overlap_calibration: { years: [2010, 2011, 2012, 2013], mean_feed_share_offset_percentage_points: meanShareOffset, mean_feed_mass_ratio: meanFeedRatio, comparisons: overlap },
    historic_raw: historic,
    current_raw: current,
    harmonized_values: harmonized,
    global_extent_normalized: 1
  },
  excluded_from_scoring: ['non-cereal crops', 'beer', 'feed conversion efficiency', 'animal intake or waste inference', 'food-security outcome inference', 'commodity aggregation outside the source-defined basket', 'missing observations as zero']
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, harmonized_annual_observations: harmonized.length, latest_year: current.at(-1).year, latest_feed_share_pct: current.at(-1).feed_share_pct }, null, 2));
