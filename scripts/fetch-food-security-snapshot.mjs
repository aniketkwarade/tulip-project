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
const metric = contracts.food_insecurity;
if (!metric?.metric_id) throw new Error('Missing food_insecurity metric contract. Run npm run export:contracts first.');

const observationYear = Number(process.env.FIES_OBSERVATION_YEAR || new Date().getUTCFullYear() - 2);
const requestUrl = new URL('https://unstats.un.org/SDGAPI/v1/sdg/Indicator/Data');
requestUrl.search = new URLSearchParams({
  indicator: '2.1.2',
  timePeriod: String(observationYear),
  pageSize: '5000'
}).toString();

const payload = await fetchJson(requestUrl);
const records = (payload.data || [])
  .filter(record => (
    record.series === 'AG_PRD_FIESMS'
    && record.dimensions?.Age === 'ALLAGE'
    && record.dimensions?.Location === 'ALLAREA'
    && record.dimensions?.Sex === 'BOTHSEX'
    && record.dimensions?.['Reporting Type'] === 'G'
    && Number.isFinite(Number(record.value))
  ))
  .map(record => ({
    record_id: `${record.series}:${record.geoAreaCode}:${record.timePeriodStart}`,
    series: record.series,
    series_description: record.seriesDescription,
    geo_area_code: record.geoAreaCode,
    geo_area_name: record.geoAreaName,
    year: Number(record.timePeriodStart),
    value_percent: Number(record.value),
    lower_bound_percent: Number.isFinite(Number(record.lowerBound)) ? Number(record.lowerBound) : null,
    upper_bound_percent: Number.isFinite(Number(record.upperBound)) ? Number(record.upperBound) : null,
    nature: record.attributes?.Nature || null,
    observation_status: record.attributes?.['Observation Status'] || null,
    source: record.source || null,
    footnotes: record.footnotes || []
  }));

const snapshot = snapshotEnvelope({
  jobId: 'fetch_food_insecurity_fies',
  source: {
    id: 'unsd_sdg_api',
    name: 'UNSD SDG API, indicator 2.1.2',
    publisher: 'United Nations Statistics Division; observations reported by FAO',
    documentation_url: 'https://unstats.un.org/sdgapi/swagger/',
    indicator_url: 'https://www.fao.org/sustainable-development-goals-data-portal/data/indicators/212-prevalence-of-moderate-or-severe-food-insecurity-in-the-population-based-on-the-food-insecurity-experience-scale/en',
    access: 'open_json_api'
  },
  request: {
    url: requestUrl.toString(),
    bounded_limit: 5000,
    filters: {
      indicator: '2.1.2',
      series: 'AG_PRD_FIESMS',
      observation_year: observationYear,
      age: 'ALLAGE',
      location: 'ALLAREA',
      sex: 'BOTHSEX',
      reporting_type: 'G'
    }
  },
  contractIds: [metric.metric_id],
  contractBindings: [{ node_id: 'food_insecurity', metric_contract_id: metric.metric_id, measurement_role: 'primary' }],
  cadence: metric.cadence,
  provenance: 'Official SDG observations disseminated by UNSD and reported by FAO; country, year, uncertainty bounds, dimensions, status, and footnotes are retained.',
  uncertainty: metric.uncertainty,
  records,
  sourceSummary: {
    api_total_elements: payload.totalElements ?? null,
    api_total_pages: payload.totalPages ?? null,
    requested_year: observationYear,
    retained_all_age_all_area_both_sex_records: records.length
  },
  caveats: [
    'The selected series is FAO-reported prevalence of moderate or severe food insecurity, not undernutrition prevalence.',
    'Many values are modeled three-year averages; uncertainty bounds and footnotes must remain attached.',
    'NaN and missing observations are excluded and must never be interpreted as zero.'
  ]
});

const output = await writeSnapshot(ROOT, 'food-security-snapshot.json', snapshot);
console.log(JSON.stringify({ output, records: records.length, contracts: [metric.metric_id] }, null, 2));
