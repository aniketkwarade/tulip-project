import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/fao-food-import-exposure-snapshot.json');
const series = [
  ['2000-2002',2001,160,0.973150274,5.687342,0.197584294,0.086956333,0.046327711],
  ['2001-2003',2002,160,0.972812788,5.140359,0.184459748,0.086472411,0.038181345],
  ['2002-2004',2003,160,0.972486487,5.135426,0.174914131,0.084798917,0.045387692],
  ['2003-2005',2004,160,0.972135755,5.226703,0.169861347,0.083198786,0.047194918],
  ['2004-2006',2005,160,0.971755278,5.729497,0.17220779,0.087730714,0.041865274],
  ['2005-2007',2006,162,0.972526693,5.674308,0.168693491,0.087437429,0.053726265],
  ['2006-2008',2007,162,0.97197162,5.728417,0.169775751,0.087296044,0.051913382],
  ['2007-2009',2008,162,0.971473174,5.48921,0.192852898,0.088711704,0.041604284],
  ['2008-2010',2009,154,0.945625109,4.210223,0.178396756,0.080242138,0.025458068],
  ['2009-2011',2010,154,0.945306938,4.4864,0.187643309,0.081719182,0.025979389],
  ['2010-2012',2011,161,0.961183172,2.468538,0.191769914,0.087305855,0.035982665],
  ['2011-2013',2012,161,0.96118841,2.39368,0.21650298,0.077757237,0.033095682],
  ['2012-2014',2013,158,0.956169325,1.810806,0.192310937,0.077422363,0.035849913],
  ['2013-2015',2014,156,0.955685068,3.911272,0.187152931,0.073802976,0.030180818],
  ['2014-2016',2015,157,0.955623046,4.079,0.20580241,0.078874421,0.035042898],
  ['2015-2017',2016,154,0.953458254,4.579926,0.207921008,0.087216483,0.030864914],
  ['2016-2018',2017,156,0.958608177,5.028509,0.212921937,0.107118798,0.026795931],
  ['2017-2019',2018,154,0.955038924,5.379448,0.229113646,0.101371905,0.038895531],
  ['2018-2020',2019,154,0.955304742,4.873735,0.236233342,0.0876097,0.039301477],
  ['2019-2021',2020,157,0.955647397,5.632103,0.238350268,0.089256079,0.044862296],
  ['2020-2022',2021,161,0.955704424,5.687322,0.242716533,0.092510417,0.044926118],
  ['2021-2023',2022,160,0.955819803,3.718192,0.235164422,0.095829583,0.047920111]
].map(([period, population_year, reporting_countries, population_coverage, population_weighted_signed_dependency_pct, population_share_dependency_ge_25, population_share_dependency_ge_50, population_share_dependency_ge_75]) => ({ period, population_year, reporting_countries, population_coverage, population_weighted_signed_dependency_pct, population_share_dependency_ge_25, population_share_dependency_ge_50, population_share_dependency_ge_75 }));

const snapshot = {
  version: 'faostat_food_import_exposure_2026_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'faostat_cereal_import_dependency_and_population_2026',
    name: 'FAOSTAT Suite of Food Security Indicators and Population',
    publisher: 'Food and Agriculture Organization of the United Nations',
    food_security_url: 'https://www.fao.org/faostat/en/#data/FS',
    food_security_bulk_url: 'https://bulks-faostat.fao.org/production/Food_Security_Data_E_All_Data_(Normalized).zip',
    food_security_bulk_sha256: '1ccced40d8e228693c6fcc5d172de9bcaa3a1c6a1581ebde345d71c1dfa9b692',
    food_security_release_file_timestamp: '2026-07-10T16:53:00Z',
    population_bulk_url: 'https://bulks-faostat.fao.org/production/Population_E_All_Data_(Normalized).zip',
    population_bulk_sha256: 'e2781a554d4efb36f17999d031acc99f0a7d8bb25a1b4d55cc5d403ccfb6b694',
    population_release_file_timestamp: '2026-03-04T15:56:00Z'
  },
  ingestion_job_id: 'export_fao_food_import_exposure_snapshot',
  metric_contract_ids: ['food_import_dependency_ratio'],
  contract_bindings: [{ node_id: 'food_import_exposure', metric_id: 'food_import_dependency_ratio', measurement_role: 'population_weighted_global_distribution_of_country_cereal_import_dependency' }],
  cadence: 'Annual FAOSTAT Food Security and Population release.',
  provenance: 'Exact FAOSTAT item 21035 country and territory ratios were joined by FAOSTAT area code to total population for the middle year of each source three-year period. Signed ratios, including net-exporter negatives, are retained. World coverage uses the FAOSTAT World population denominator; country values are not replaced by the near-zero World trade-balance ratio.',
  uncertainty: 'The dependency ratio inherits food-balance uncertainty from informal trade, stocks, re-exports, food aid, production and reporting lag. Population weighting measures people living in country-level dependency contexts, not household diet, supplier concentration, affordability, insecurity or realized disruption. Three-year overlapping periods are not independent annual observations.',
  failure_behavior: 'Retain the last checksum-validated complete pair and mark stale. Reject changed item, population element, unit, period, area-code or checksum definitions. Never clip net exporters to zero, treat missing countries as zero dependency, use the World trade-balance ratio as exposure or infer insecurity from dependency alone.',
  assessment: {
    dependency_item_code: 21035,
    dependency_item: 'Cereal import dependency ratio (percent) (3-year average)',
    dependency_formula: '(cereal imports - cereal exports) / (cereal production + cereal imports - cereal exports) * 100',
    population_item_code: 3010,
    population_element: 'Total Population - Both sexes',
    high_dependency_boundary_pct: 50,
    high_dependency_boundary_meaning: 'Net cereal imports supply at least half of apparent domestic cereal supply; this is an arithmetic exposure boundary, not a universal food-security danger threshold.',
    complete_period_observations: series.length,
    geographic_scope: 'Countries and territories covering approximately 95-97% of FAOSTAT World population',
    values: series
  },
  excluded_from_scoring: ['FAOSTAT World ratio, which nets international trade to approximately zero', 'household food insecurity inference', 'supplier concentration', 'commodity or calorie baskets other than cereals', 'missing country ratios as zero']
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, period_observations: series.length, latest_period: series.at(-1).period, latest_population_coverage: series.at(-1).population_coverage }, null, 2));
