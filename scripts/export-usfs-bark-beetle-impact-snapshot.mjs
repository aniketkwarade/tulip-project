import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const annual = [
  { year: 2021, mapped_acre_observations: 2414187.4, records: 28018, unweighted_mean_reported_percent_mid: 12.153 },
  { year: 2022, mapped_acre_observations: 2559563.27, records: 35174, unweighted_mean_reported_percent_mid: 12.671 },
  { year: 2023, mapped_acre_observations: 2641116.98, records: 31963, unweighted_mean_reported_percent_mid: 11.987 },
  { year: 2024, mapped_acre_observations: 1628770.23, records: 32530, unweighted_mean_reported_percent_mid: 11.116 },
  { year: 2025, mapped_acre_observations: 1110374.436, records: 18942, unweighted_mean_reported_percent_mid: 18.217 }
];

const snapshot = {
  version: 'usfs_ids_bark_beetle_mortality_2021_2025_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'usfs_ids_bark_beetle_mortality_2021_2025',
      name: 'USDA Forest Service Insect and Disease Survey — Bark-Beetle Mortality Areas',
      publisher: 'USDA Forest Service, Forest Health Protection and partners',
      url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_InsectandDiseaseSurvey_01/MapServer/1',
      annual_statistics_response_sha256: '59c661dfd8db1a89c5f161a7bcbd26047d179851e440e2b3298f76eb0b9b6ea1',
      agent_names_response_sha256: '103147979c22d26950588b9a999a816912e913a395326d305b4875f160680407',
      queried_at: '2026-08-01'
    },
    {
      id: 'usfs_bark_beetle_economic_impact_2019',
      name: 'Bark Beetle Epidemics, Life Satisfaction, and Economic Well-Being',
      publisher: 'USDA Forest Service Research and Development / Forests',
      url: 'https://research.fs.usda.gov/treesearch/59043',
      download_url: 'https://www.srs.fs.usda.gov/pubs/ja/2019/ja_2019_holmes_003.pdf',
      report_sha256: '3b8eced17d26230f18c30564cb2b5fab349e08e8faa6da289b40351eb314a2c8',
      doi: '10.3390/f10080696',
      publication_year: 2019
    }
  ],
  metric_contract: {
    node_id: 'bark_beetle_epidemics',
    metric_id: 'bark_beetle_mortality_extent',
    unit: 'annual mapped acre-observations and dollars of documented producer loss',
    geography: 'conterminous United States and Alaska for mapped mortality; U.S. South for the economic-loss subset',
    period: '2021-2025 survey observations with a separate 28-year economic-impact estimate',
    boundary: 'Annual mapped acres are observation-area totals, not deduplicated land or a complete forest inventory. The query retains mortality damage types whose agent name contains beetle and excludes the mixed root disease and beetle complex. The historical southern-pine-beetle loss is a bounded subset and is not attributed to the 2021-2025 polygons.'
  },
  extraction: {
    layer: 'IDS AREAS (1)',
    where: "damage_type LIKE 'Mortality%' AND dca_common_name LIKE '%beetle%' AND dca_common_name <> 'root disease and beetle complex'",
    group_by: 'survey_year',
    statistics: ['sum(acres)', 'count(objectid)', 'avg(percent_mid)'],
    represented_us_areas: ['Alaska', 'CONUS'],
    annual
  },
  accumulated_impact: {
    start_year: 2021,
    end_year: 2025,
    years_with_records: annual.length,
    mapped_acre_observations: Number(annual.reduce((sum, row) => sum + row.mapped_acre_observations, 0).toFixed(6)),
    observation_records: annual.reduce((sum, row) => sum + row.records, 0),
    documented_southern_pine_beetle_timber_producer_loss_usd: 1200000000,
    documented_economic_loss_period_years: 28,
    directly_assessed_countries: ['United States'],
    directly_assessed_country_count: 1
  },
  reviewed_normalization_anchors: {
    mapped_acre_observations: [0, 100000, 5000000, 25000000],
    documented_loss_usd: [0, 10000000, 250000000, 2000000000],
    documented_economic_loss_period_years: [0, 1, 10, 30],
    directly_assessed_country_count: [0, 1, 5, 25]
  },
  uncertainty: 'Aerial detection surveys are reconnaissance data rather than a complete damage inventory, can omit or misclassify damage, and have no national accuracy assessment. Acres can overlap across years and are therefore retained as annual mapped acre-observations rather than unique cumulative land. Percent-affected classes are not converted into killed-tree counts. The economic estimate covers southern pine beetle timber-producer losses over a different historical period and geography; it is a bounded accumulated-impact component, not a valuation of the current mapped records.'
};

await fs.writeFile(path.join(ROOT, 'public/usfs-bark-beetle-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/usfs-bark-beetle-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
