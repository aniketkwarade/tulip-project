import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchJson,
  readMetricContracts,
  snapshotEnvelope,
  writeSnapshot
} from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contracts = await readMetricContracts(ROOT);
const metric = contracts.resource_depletion;
if (!metric?.metric_id) throw new Error('Missing resource_depletion metric contract. Run npm run export:contracts first.');

const OBSERVATION_YEAR = Number(process.env.MATERIAL_PRESSURE_YEAR || 2022);
const SOURCE_ID = 'unsd_sdg_api_unep_material_flows';
const JOB_ID = 'fetch_unsd_unep_material_pressure';
const SERIES = new Set([
  'EN_MAT_FTPRTN',
  'EN_MAT_FTPRPC',
  'EN_MAT_DOMCMPT',
  'EN_MAT_DOMCMPC'
]);
const MATERIALS = new Map([
  ['ALP', 'Total or no breakdown'],
  ['BIM', 'Biomass'],
  ['MEO', 'Metal ores'],
  ['FOF', 'Fossil fuels'],
  ['NMM', 'Non-metallic minerals']
]);
const INDICATORS = ['12.2.1', '12.2.2'];

function requestUrl(indicator, page = 1) {
  const url = new URL('https://unstats.un.org/SDGAPI/v1/sdg/Indicator/Data');
  url.search = new URLSearchParams({
    indicator,
    timePeriod: String(OBSERVATION_YEAR),
    pageSize: '5000',
    page: String(page)
  }).toString();
  return url;
}

const payloads = [];
for (const indicator of INDICATORS) {
  const firstUrl = requestUrl(indicator);
  const firstPayload = await fetchJson(firstUrl, { signal: AbortSignal.timeout(120_000) });
  const totalPages = Number(firstPayload.totalPages || 1);
  if (!Number.isInteger(totalPages) || totalPages < 1 || totalPages > 10) {
    throw new Error(`Implausible UNSD page count for ${indicator}: ${firstPayload.totalPages}`);
  }
  const pages = [{ url: firstUrl.toString(), payload: firstPayload }];
  for (let page = 2; page <= totalPages; page += 1) {
    const url = requestUrl(indicator, page);
    pages.push({ url: url.toString(), payload: await fetchJson(url, { signal: AbortSignal.timeout(120_000) }) });
  }
  const data = pages.flatMap(item => item.payload.data || []);
  if (Number(firstPayload.totalElements) !== data.length) {
    throw new Error(`UNSD pagination mismatch for ${indicator}: expected ${firstPayload.totalElements}, received ${data.length}`);
  }
  payloads.push({
    indicator,
    urls: pages.map(item => item.url),
    totalElements: Number(firstPayload.totalElements),
    totalPages,
    data
  });
}

const records = payloads
  .flatMap(({ indicator, data }) => data.map(record => ({ indicator, record })))
  .filter(({ record }) => (
    SERIES.has(record.series)
    && MATERIALS.has(record.dimensions?.['Type of product'])
    && record.dimensions?.['Reporting Type'] === 'G'
    && Number.isFinite(Number(record.value))
  ))
  .map(({ indicator, record }) => {
    const materialCode = record.dimensions['Type of product'];
    return {
      record_id: `${record.series}:${record.geoAreaCode}:${record.timePeriodStart}:${materialCode}`,
      metric_id: metric.metric_id,
      indicator,
      series: record.series,
      series_description: record.seriesDescription,
      accounting_boundary: record.series.includes('FTPR') ? 'consumption_based_material_footprint' : 'domestic_material_consumption',
      normalization: record.series.endsWith('PC') ? 'per_capita' : 'absolute_total',
      geo_area_code: String(record.geoAreaCode),
      geo_area_name: record.geoAreaName,
      observation_year: Number(record.timePeriodStart),
      raw_material_code: materialCode,
      raw_material_name: MATERIALS.get(materialCode),
      value: Number(record.value),
      unit_code: record.attributes?.Units || null,
      nature: record.attributes?.Nature || null,
      observation_status: record.attributes?.['Observation Status'] || null,
      source_statement: record.source || null,
      footnotes: record.footnotes || [],
      source_locator: {
        api_url: requestUrl(indicator).toString(),
        metadata_url: indicator === '12.2.1'
          ? 'https://unstats.un.org/sdgs/metadata/files/Metadata-12-02-01.pdf'
          : 'https://unstats.un.org/sdgs/metadata/files/Metadata-12-02-02.pdf',
        series_url: `https://unstats.un.org/SDGAPI/v1/sdg/Series/${record.series}`
      }
    };
  })
  .sort((a, b) => a.geo_area_code.localeCompare(b.geo_area_code)
    || a.series.localeCompare(b.series)
    || a.raw_material_code.localeCompare(b.raw_material_code));

const duplicateIds = records.length - new Set(records.map(record => record.record_id)).size;
const seriesCounts = Object.fromEntries([...SERIES].map(series => [
  series,
  records.filter(record => record.series === series).length
]));
const materialCounts = Object.fromEntries([...MATERIALS.keys()].map(code => [
  code,
  records.filter(record => record.raw_material_code === code).length
]));
const worldRecords = records.filter(record => record.geo_area_code === '1');

if (duplicateIds) throw new Error(`Duplicate material-pressure record IDs: ${duplicateIds}`);
if (records.length < 900) throw new Error(`Implausibly small material-pressure panel: ${records.length} records`);
if ([...SERIES].some(series => !seriesCounts[series])) throw new Error(`Missing required series: ${JSON.stringify(seriesCounts)}`);
if ([...MATERIALS.keys()].some(code => !materialCounts[code])) throw new Error(`Missing required material class: ${JSON.stringify(materialCounts)}`);
if (worldRecords.length !== SERIES.size * MATERIALS.size) {
  throw new Error(`Expected ${SERIES.size * MATERIALS.size} World records, observed ${worldRecords.length}`);
}

const snapshot = snapshotEnvelope({
  jobId: JOB_ID,
  source: {
    id: SOURCE_ID,
    name: 'UNSD SDG API / UNEP Global Material Flows',
    publisher: 'United Nations Statistics Division; UNEP custodian data from WESR / Global Material Flows Database',
    documentation_url: 'https://unstats.un.org/sdgapi/swagger/',
    metadata_url: 'https://unstats.un.org/sdgs/metadata/?Goal=12',
    access: 'open_json_api'
  },
  request: {
    urls: payloads.flatMap(item => item.urls),
    indicators: INDICATORS,
    observation_year: OBSERVATION_YEAR,
    retained_series: [...SERIES],
    retained_material_classes: [...MATERIALS.entries()].map(([code, name]) => ({ code, name })),
    reporting_type: 'G'
  },
  contractIds: [metric.metric_id],
  contractBindings: [{
    node_id: 'resource_depletion',
    metric_contract_id: metric.metric_id,
    measurement_role: 'country_and_region_material_pressure_indicator'
  }],
  cadence: 'annual release check with full selected-year replacement',
  provenance: 'Official SDG 12.2.1 and 12.2.2 observations disseminated by UNSD from UNEP WESR / Global Material Flows Database. Material footprint and domestic material consumption remain separate, with absolute and per-capita values retained by raw-material class.',
  uncertainty: metric.uncertainty,
  records,
  sourceSummary: {
    api_total_elements: Object.fromEntries(payloads.map(item => [item.indicator, item.totalElements])),
    api_total_pages: Object.fromEntries(payloads.map(item => [item.indicator, item.totalPages])),
    retained_records: records.length,
    world_records: worldRecords.length,
    duplicate_ids: duplicateIds,
    series_counts: seriesCounts,
    material_counts: materialCounts
  },
  caveats: [
    'Material footprint is a consumption-based raw-material-equivalent estimate; domestic material consumption is extraction plus imports minus exports. They are not interchangeable.',
    'These pressure indicators do not measure remaining geological or biological reserves, scarcity, economic availability, recycled inputs, ore grade, or a depletion threshold.',
    'The total class and its four component classes are overlapping representations and must never be summed together.',
    'Modeled and estimated observations retain nature, status, source statement, and footnotes; missing values are never zero.'
  ],
  failureBehavior: 'Retain the last validated selected-year snapshot and mark stale; reject pagination, missing series, material classes, World records, duplicates, or an implausibly small panel; never fill absent countries or materials with zero.'
});

const output = await writeSnapshot(ROOT, 'unsd-material-pressure-snapshot.json', snapshot);
console.log(JSON.stringify({
  output,
  observation_year: OBSERVATION_YEAR,
  records: records.length,
  world_records: worldRecords.length,
  series_counts: seriesCounts,
  material_counts: materialCounts
}, null, 2));
