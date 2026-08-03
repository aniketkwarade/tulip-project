import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchJson, readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contracts = await readMetricContracts(ROOT);
const metric = contracts.pm2_5_particulates;
if (!metric?.metric_id) throw new Error('Missing pm2_5_particulates metric contract. Run npm run export:contracts first.');

const SOURCE_ID = 'world_bank_wdi_global_pm2_5_exposure';
const JOB_ID = 'fetch_world_bank_wdi_global_pm2_5_exposure';
const INDICATOR_ID = 'EN.ATM.PM25.MC.M3';
const COUNTRY_CODE = 'WLD';
const API_URL = `https://api.worldbank.org/v2/country/${COUNTRY_CODE}/indicator/${INDICATOR_ID}?format=json&per_page=100`;
const INDICATOR_URL = `https://data.worldbank.org/indicator/${INDICATOR_ID}`;
const WHO_GUIDELINE_URL = 'https://www.who.int/publications/i/item/9789240034228';
const EXPECTED_INDICATOR_NAME_PATTERN = /^PM2\.5 air pollution, mean annual exposure \(micrograms per cubic met(?:er|re)\)$/i;
const MINIMUM_COMPLETE_YEARS = 20;
const round = (value, digits = 9) => Number(value.toFixed(digits));

const payload = await fetchJson(API_URL, { signal: AbortSignal.timeout(60_000) });
if (!Array.isArray(payload) || payload.length !== 2 || !Array.isArray(payload[1])) {
  throw new Error('World Bank API schema drift: expected [metadata, observations].');
}
const [metadata, observations] = payload;
const records = observations
  .filter(row => row?.countryiso3code === COUNTRY_CODE && row?.indicator?.id === INDICATOR_ID)
  .filter(row => Number.isInteger(Number(row.date)) && row.value !== null && row.value !== '' && Number.isFinite(Number(row.value)))
  .map(row => ({
    record_id: `world_bank_wdi_pm25_world_${row.date}`,
    node_id: 'pm2_5_particulates',
    metric_id: metric.metric_id,
    measurement_role: 'global_population_weighted_mean_annual_pm2_5_exposure',
    geography_code: row.countryiso3code,
    geography_name: row.country?.value,
    observation_year: Number(row.date),
    mean_annual_pm2_5_exposure_ug_m3: round(Number(row.value)),
    unit: 'micrograms per cubic metre',
    source_indicator_id: row.indicator.id,
    source_indicator_name: row.indicator.value,
    source_locator: {
      api_url: API_URL,
      indicator_url: INDICATOR_URL,
      geography: COUNTRY_CODE,
      indicator: INDICATOR_ID
    }
  }))
  .sort((left, right) => left.observation_year - right.observation_year);

if (records.length < MINIMUM_COMPLETE_YEARS) {
  throw new Error(`World Bank PM2.5 historical-distribution gate failed: ${records.length} complete annual observations.`);
}
if (records.some((record, index) => index > 0 && record.observation_year !== records[index - 1].observation_year + 1)) {
  throw new Error('World Bank PM2.5 series contains a missing year inside the retained complete interval.');
}
const invalidRecords = records.filter(record => record.mean_annual_pm2_5_exposure_ug_m3 <= 0 || !EXPECTED_INDICATOR_NAME_PATTERN.test(record.source_indicator_name));
if (invalidRecords.length) throw new Error(`World Bank PM2.5 indicator identity or value domain changed: ${JSON.stringify(invalidRecords.slice(0, 3))}`);

const latest = records.at(-1);
const sourceLastUpdated = metadata?.lastupdated;
if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceLastUpdated || '')) throw new Error('World Bank API did not provide a valid lastupdated date.');

const snapshot = snapshotEnvelope({
  jobId: JOB_ID,
  source: {
    id: SOURCE_ID,
    name: 'World Bank WDI Global PM2.5 Exposure',
    publisher: 'World Bank, sourced from Global Burden of Disease 2023',
    url: INDICATOR_URL,
    api_url: API_URL,
    licence: 'Creative Commons Attribution 4.0',
    access: 'open_api'
  },
  request: {
    url: API_URL,
    country_code: COUNTRY_CODE,
    indicator_id: INDICATOR_ID,
    format: 'json',
    per_page: 100
  },
  contractIds: [metric.metric_id],
  contractBindings: [{ node_id: 'pm2_5_particulates', metric_contract_id: metric.metric_id, measurement_role: 'global_population_weighted_mean_annual_pm2_5_exposure' }],
  cadence: 'Annual after the World Bank updates the World Development Indicators PM2.5 exposure series; check source metadata monthly.',
  provenance: 'Official World Bank API World aggregate for EN.ATM.PM25.MC.M3. The retained annual values are population-weighted mean ambient PM2.5 exposure estimates sourced from Global Burden of Disease 2023; no country rows are manually reaggregated.',
  uncertainty: 'The indicator is a model-based population-exposure estimate informed by satellite retrievals, chemical transport models and monitoring data rather than a direct worldwide instrument average. Exposure surfaces, population weights, calibration, source revisions and the GBD estimation framework affect comparisons.',
  records,
  sourceSummary: {
    source_last_updated: sourceLastUpdated,
    source_id: String(metadata?.sourceid || ''),
    complete_annual_observations: records.length,
    first_complete_year: records[0].observation_year,
    latest_complete_year: latest.observation_year,
    latest_world_population_weighted_mean_pm2_5_ug_m3: latest.mean_annual_pm2_5_exposure_ug_m3,
    indicator_id: INDICATOR_ID,
    indicator_name: latest.source_indicator_name,
    geography_code: COUNTRY_CODE,
    who_2021_annual_pm2_5_anchor_ug_m3: {
      reference_aqg: 5,
      concerning_interim_target_3: 15,
      critical_interim_target_2: 25,
      extreme_interim_target_1: 35
    },
    who_guideline_url: WHO_GUIDELINE_URL
  },
  caveats: [
    'The World aggregate is population-weighted exposure, not a land-area mean, a city-monitor mean or an unweighted country average.',
    'The source values are model estimates and may be revised across GBD and World Bank releases; this is retained as internal uncertainty, not treated as missing current evidence.',
    'WHO interim targets are health-protection milestones and the AQG is the recommended level; the four TULIP anchors omit interim target 4 solely to preserve the required four-anchor normalization.',
    'Missing World Bank years and null values are excluded and never converted to zero.'
  ],
  failureBehavior: 'Retain the last validated snapshot and mark stale; reject changed indicator, geography, units, non-positive values, internal missing years, fewer than 20 complete annual observations or absent update metadata; never fill missing exposure with zero or substitute country values for the World aggregate.'
});

const output = await writeSnapshot(ROOT, 'world-bank-global-air-quality-snapshot.json', snapshot);
console.log(JSON.stringify({ output, records: records.length, first_year: records[0].observation_year, latest_year: latest.observation_year, latest_value_ug_m3: latest.mean_annual_pm2_5_exposure_ug_m3, source_last_updated: sourceLastUpdated }, null, 2));
