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
const metric = contracts.marine_fisheries_collapse;
if (!metric?.metric_id) {
  throw new Error('Missing marine_fisheries_collapse metric contract. Run npm run export:contracts first.');
}

const requestUrl = new URL('https://unstats.un.org/SDGAPI/v1/sdg/Indicator/Data');
requestUrl.search = new URLSearchParams({
  indicator: '14.4.1',
  pageSize: '5000'
}).toString();

const payload = await fetchJson(requestUrl);
if (Number(payload.totalPages || 0) > 1) {
  throw new Error(`UNSD SDG API response exceeded the bounded request: ${payload.totalPages} pages`);
}

const records = (payload.data || [])
  .filter(record => (
    record.series === 'ER_H2O_FWTL'
    && record.dimensions?.['Reporting Type'] === 'G'
    && record.value !== 'NaN'
    && Number.isFinite(Number(record.value))
  ))
  .map(record => {
    const sustainable = Number(record.value);
    return {
      record_id: `${record.series}:${record.geoAreaCode}:${record.timePeriodStart}`,
      indicator: '14.4.1',
      series: record.series,
      series_description: record.seriesDescription,
      geo_area_code: record.geoAreaCode,
      geo_area_name: record.geoAreaName,
      observation_year: Number(record.timePeriodStart),
      sustainable_stock_share_pct_source_reported: sustainable,
      biologically_unsustainable_stock_share_pct_derived: Number((100 - sustainable).toFixed(3)),
      derivation: '100 - source-reported proportion of fish stocks within biologically sustainable levels',
      unit: record.attributes?.Units || 'PERCENT',
      nature: record.attributes?.Nature || null,
      observation_status: record.attributes?.['Observation Status'] || null,
      reporting_type: record.dimensions?.['Reporting Type'] || null,
      source_statement: record.source || null,
      lower_bound_pct: Number.isFinite(Number(record.lowerBound)) ? Number(record.lowerBound) : null,
      upper_bound_pct: Number.isFinite(Number(record.upperBound)) ? Number(record.upperBound) : null,
      footnotes: record.footnotes || [],
      source_locator: requestUrl.toString()
    };
  })
  .sort((a, b) => a.geo_area_code.localeCompare(b.geo_area_code)
    || a.observation_year - b.observation_year);

const years = records.map(record => record.observation_year);
const latestYear = Math.max(...years);
const snapshot = snapshotEnvelope({
  jobId: 'fetch_fao_sdg_14_4_1_fish_stock_status',
  source: {
    id: 'unsd_sdg_api_fao_fish_stock_status',
    name: 'UNSD SDG API, FAO indicator 14.4.1',
    publisher: 'United Nations Statistics Division; observations reported or validated through FAO',
    documentation_url: 'https://unstats.un.org/sdgapi/swagger/',
    indicator_url: 'https://www.fao.org/sustainable-development-goals-data-portal/data/indicators/1441-proportion-of-fish-stocks-within-biologically-sustainable-levels/en',
    access: 'open_json_api'
  },
  request: {
    url: requestUrl.toString(),
    bounded_limit: 5000,
    filters: {
      indicator: '14.4.1',
      series: 'ER_H2O_FWTL',
      reporting_type: 'G',
      numeric_values_only: true
    }
  },
  contractIds: [metric.metric_id],
  contractBindings: [{
    node_id: 'marine_fisheries_collapse',
    metric_contract_id: metric.metric_id,
    measurement_role: 'country_and_reported_area_stock_assessment_primary'
  }],
  cadence: metric.cadence,
  provenance: 'Official UN SDG indicator 14.4.1 observations disseminated by UNSD and reported or validated through FAO. The source sustainable-stock percentage, geography, year, status, source statement, and footnotes are retained.',
  uncertainty: 'The API does not provide observation-level numeric uncertainty bounds for this series. Stock coverage, unknown-status shares, national methods, assessment quality, reporting status, and footnotes materially affect comparability and are retained. The unsustainable share is an arithmetic complement, not an independently estimated quantity.',
  records,
  sourceSummary: {
    api_total_elements: payload.totalElements ?? null,
    api_total_pages: payload.totalPages ?? null,
    numeric_records_retained: records.length,
    earliest_observation_year: Math.min(...years),
    latest_observation_year: latestYear,
    latest_year_records: records.filter(record => record.observation_year === latestYear).length,
    explicit_nan_or_missing_records_withheld: (payload.data || []).filter(record => record.series === 'ER_H2O_FWTL').length - records.length
  },
  caveats: [
    'The source reports the share of assessed stocks within biologically sustainable levels; the platform derives the complementary unsustainable share without clamping or imputing.',
    'Country and reported-area values can cover different numbers and compositions of stocks. They are not population-weighted, catch-weighted, or directly comparable without the attached footnotes and method context.',
    'Explicit NaN records, landlocked-country placeholders, and missing values are withheld and must never be interpreted as zero unsustainable stocks.',
    'This indicator does not by itself establish fishery collapse, catch loss, food-security impact, or climate attribution.'
  ],
  failureBehavior: 'Retain the last validated complete series and mark stale; reject pagination or schema changes; never convert NaN, missing countries, unknown stock status, or absent uncertainty bounds to zero.'
});

const output = await writeSnapshot(ROOT, 'fao-fish-stock-sustainability-snapshot.json', snapshot);
console.log(JSON.stringify({
  output,
  records: records.length,
  earliest_year: Math.min(...years),
  latest_year: latestYear,
  contract: metric.metric_id
}, null, 2));
