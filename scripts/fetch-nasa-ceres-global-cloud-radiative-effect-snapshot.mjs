import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contracts = await readMetricContracts(ROOT);
const metric = contracts.cloud_albedo_shift;
if (!metric?.metric_id) throw new Error('Missing cloud_albedo_shift metric contract. Run npm run export:contracts first.');

const SOURCE_ID = 'nasa_ceres_ebaf_toa_ed4_2_1_global_monthly';
const JOB_ID = 'fetch_nasa_ceres_global_cloud_radiative_effect';
const PRODUCT_ID = 'EBAFTOA421';
const EXPECTED_VERSION = 'CERES_EBAF-TOA_Ed4.2.1';
const ENDPOINT_URL = 'https://ceres-tool.larc.nasa.gov/ord-tool/srbavg';
const SELECTION_URL = 'https://ceres-tool.larc.nasa.gov/ord-tool/jsp/EBAFTOA421Selection.jsp';
const DOCUMENTATION_URL = 'https://ceres.larc.nasa.gov/data/documentation/';
const GUEST_EMAIL = 'ceres.ot@nasa.guest';
const ALL_SKY_LABEL = 'TOA Shortwave Flux - All-Sky';
const CLEAR_SKY_LABEL = 'TOA Shortwave Flux - Clear-Sky (for cloud-free areas of region)';
const EXPECTED_VARIABLES = Object.freeze({
  [ALL_SKY_LABEL]: 'gtoa_sw_all_mon',
  [CLEAR_SKY_LABEL]: 'gtoa_sw_clr_c_mon'
});
const PARAMETERS = '|:TOA Fluxes:Shortwave Flux:All-sky|:TOA Fluxes:Shortwave Flux:Clear-sky-c';
const MINIMUM_COMPLETE_YEARS = 20;
const round = (value, digits = 6) => Number(value.toFixed(digits));

async function postForm(parameters) {
  const response = await fetch(ENDPOINT_URL, {
    method: 'POST',
    headers: {
      Accept: 'text/html,text/plain;q=0.9,*/*;q=0.5',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound snapshot ingestion)'
    },
    body: new URLSearchParams(parameters),
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${ENDPOINT_URL}`);
  return response.text();
}

function unwrapResponse(text) {
  const match = text.trim().match(/^<SRBAVG>([\s\S]*?)<\/SRBAVG>$/);
  if (!match) throw new Error(`NASA CERES response envelope changed: ${text.slice(0, 180)}`);
  return match[1].trim();
}

function parseAvailableRange(text) {
  const value = unwrapResponse(text);
  const match = value.match(/^-,(\d{4})-(\d{2})-(\d{1,2}),(\d{4})-(\d{2})-(\d{1,2})\|$/);
  if (!match) throw new Error(`NASA CERES satellite range schema changed: ${value}`);
  return {
    start: `${match[1]}-${match[2]}-${String(match[3]).padStart(2, '0')}`,
    end: `${match[4]}-${match[5]}-${String(match[6]).padStart(2, '0')}`,
    startYear: Number(match[1]),
    startMonth: Number(match[2]),
    endYear: Number(match[4]),
    endMonth: Number(match[5])
  };
}

function monthKey(startYear, startMonth, index) {
  const zeroBased = startYear * 12 + startMonth - 1 + index;
  return `${Math.floor(zeroBased / 12)}-${String((zeroBased % 12) + 1).padStart(2, '0')}`;
}

function expectedMonthCount(range) {
  return (range.endYear - range.startYear) * 12 + range.endMonth - range.startMonth + 1;
}

function parseBrowseHtml(html, expectedCount) {
  const variableNames = new Map(
    [...html.matchAll(/longNameToVariableName\['([^']+)'\]\s*=\s*'([^']+)'/g)]
      .map(match => [match[1], match[2]])
  );
  for (const [label, expectedVariable] of Object.entries(EXPECTED_VARIABLES)) {
    if (variableNames.get(label) !== expectedVariable) {
      throw new Error(`NASA CERES source-variable identity changed for ${label}: ${variableNames.get(label) || 'missing'}`);
    }
  }

  const arrays = new Map();
  for (const match of html.matchAll(/hashMap\['([^']+)'\+'([^']+)'\]\s*=\s*\[\s*([\s\S]*?)\];/g)) {
    const points = [...match[3].matchAll(/\[(\d+),\s*(-?\d+(?:\.\d+)?)\]/g)]
      .map(point => ({ index: Number(point[1]), value: Number(point[2]) }));
    arrays.set(match[1], { periodLabel: match[2], points });
  }

  const allSky = arrays.get(ALL_SKY_LABEL);
  const clearSky = arrays.get(CLEAR_SKY_LABEL);
  if (!allSky || !clearSky) throw new Error('NASA CERES browse response omitted an expected shortwave flux array.');
  for (const series of [allSky, clearSky]) {
    if (series.points.length !== expectedCount) {
      throw new Error(`NASA CERES returned ${series.points.length} monthly points; expected ${expectedCount}.`);
    }
    if (series.points.some((point, index) => point.index !== index || !Number.isFinite(point.value))) {
      throw new Error('NASA CERES monthly index or numeric-value continuity changed.');
    }
  }
  if (allSky.periodLabel !== clearSky.periodLabel) throw new Error('NASA CERES shortwave series report different time ranges.');
  return { allSky, clearSky, variableNames };
}

const [versionResponse, rangeResponse] = await Promise.all([
  postForm({ command: 'getVersions', CERESProducts: PRODUCT_ID }),
  postForm({ command: 'satRange', CERESProducts: PRODUCT_ID })
]);
const sourceVersion = unwrapResponse(versionResponse);
if (sourceVersion !== EXPECTED_VERSION) throw new Error(`NASA CERES product version changed: ${sourceVersion}`);
const availableRange = parseAvailableRange(rangeResponse);
const monthlyCount = expectedMonthCount(availableRange);

const request = {
  command: 'browse',
  CERESProducts: PRODUCT_ID,
  Project: 'CERES',
  Version: sourceVersion,
  SATELLITE: '-',
  parameters: PARAMETERS,
  TIME_RESOLUTION: 'MON',
  SPATIAL_RESOLUTION: 'GLOBAL',
  gridSize: '1',
  fromM: String(availableRange.startMonth).padStart(2, '0'),
  fromY: String(availableRange.startYear),
  toM: String(availableRange.endMonth).padStart(2, '0'),
  toY: String(availableRange.endYear),
  email: GUEST_EMAIL
};
const browseHtml = await postForm(request);
const parsed = parseBrowseHtml(browseHtml, monthlyCount);

const records = parsed.allSky.points.map((allSkyPoint, index) => {
  const clearSkyPoint = parsed.clearSky.points[index];
  const observationPeriod = monthKey(availableRange.startYear, availableRange.startMonth, index);
  const [year, month] = observationPeriod.split('-').map(Number);
  const shortwaveCre = clearSkyPoint.value - allSkyPoint.value;
  return {
    record_id: `nasa_ceres_ebaf_toa_global_shortwave_cre_${observationPeriod}`,
    node_id: 'cloud_albedo_shift',
    metric_id: metric.metric_id,
    measurement_role: 'global_monthly_top_of_atmosphere_shortwave_cloud_radiative_effect',
    observation_period: observationPeriod,
    observation_year: year,
    observation_month: month,
    geography: 'Global mean',
    toa_shortwave_all_sky_flux_w_m2: round(allSkyPoint.value),
    toa_shortwave_clear_sky_flux_w_m2: round(clearSkyPoint.value),
    toa_shortwave_cloud_radiative_effect_w_m2: round(shortwaveCre),
    cloud_radiative_effect_convention: 'clear-sky outgoing shortwave flux minus all-sky outgoing shortwave flux; negative values indicate cloud shortwave cooling',
    unit: 'watts per square metre',
    source_variables: {
      all_sky: EXPECTED_VARIABLES[ALL_SKY_LABEL],
      clear_sky_cloud_free_region: EXPECTED_VARIABLES[CLEAR_SKY_LABEL]
    },
    source_locator: {
      selection_url: SELECTION_URL,
      post_endpoint: ENDPOINT_URL,
      product_id: PRODUCT_ID,
      product_version: sourceVersion,
      spatial_resolution: 'GLOBAL',
      time_resolution: 'MON',
      source_array_index: index
    }
  };
});

const invalidRecords = records.filter(record => (
  !Number.isFinite(record.toa_shortwave_all_sky_flux_w_m2)
  || !Number.isFinite(record.toa_shortwave_clear_sky_flux_w_m2)
  || !Number.isFinite(record.toa_shortwave_cloud_radiative_effect_w_m2)
  || record.toa_shortwave_all_sky_flux_w_m2 <= 0
  || record.toa_shortwave_all_sky_flux_w_m2 >= 200
  || record.toa_shortwave_clear_sky_flux_w_m2 <= 0
  || record.toa_shortwave_clear_sky_flux_w_m2 >= 200
  || record.toa_shortwave_cloud_radiative_effect_w_m2 >= 0
  || record.toa_shortwave_cloud_radiative_effect_w_m2 <= -100
));
if (invalidRecords.length) throw new Error(`NASA CERES shortwave flux domain changed: ${JSON.stringify(invalidRecords.slice(0, 3))}`);

const annualCoverage = new Map();
for (const record of records) annualCoverage.set(record.observation_year, (annualCoverage.get(record.observation_year) || 0) + 1);
const completeCalendarYears = [...annualCoverage.entries()]
  .filter(([, count]) => count === 12)
  .map(([year]) => year)
  .sort((left, right) => left - right);
if (completeCalendarYears.length < MINIMUM_COMPLETE_YEARS) {
  throw new Error(`NASA CERES historical-distribution gate failed: ${completeCalendarYears.length} complete calendar years.`);
}
if (records.some((record, index) => index > 0 && record.observation_period !== monthKey(availableRange.startYear, availableRange.startMonth, index))) {
  throw new Error('NASA CERES retained monthly series contains a missing or duplicated month.');
}

const snapshot = snapshotEnvelope({
  jobId: JOB_ID,
  source: {
    id: SOURCE_ID,
    name: 'NASA CERES EBAF-TOA Ed4.2.1 Global Monthly',
    publisher: 'NASA Langley Research Center Atmospheric Science Data Center',
    url: SELECTION_URL,
    documentation_url: DOCUMENTATION_URL,
    post_endpoint: ENDPOINT_URL,
    product_id: PRODUCT_ID,
    product_version: sourceVersion,
    access: 'open_public_browse_endpoint'
  },
  request: { ...request, email: 'NASA-provided guest address' },
  contractIds: [metric.metric_id],
  contractBindings: [{
    node_id: 'cloud_albedo_shift',
    metric_contract_id: metric.metric_id,
    measurement_role: 'global_monthly_top_of_atmosphere_shortwave_cloud_radiative_effect'
  }],
  cadence: 'Monthly after NASA CERES extends or revises the EBAF-TOA Ed4.2.1 record; check product version and range before every refresh.',
  provenance: 'Official NASA CERES EBAF-TOA Ed4.2.1 source-native global monthly outgoing shortwave all-sky and clear-sky flux arrays. The signed shortwave cloud radiative effect is deterministically derived as clear-sky minus all-sky outgoing flux.',
  uncertainty: 'Clear-sky sampling, scene classification, cloud masking, diurnal sampling, instrument calibration, aerosol above clouds, surface albedo, product revisions and changing cloud regimes affect the inferred cloud radiative effect and its trend.',
  records,
  sourceSummary: {
    product_id: PRODUCT_ID,
    product_version: sourceVersion,
    available_start_date: availableRange.start,
    available_end_date: availableRange.end,
    first_observation_period: records[0].observation_period,
    latest_observation_period: records.at(-1).observation_period,
    monthly_observations: records.length,
    complete_calendar_years: completeCalendarYears,
    complete_calendar_year_count: completeCalendarYears.length,
    first_complete_calendar_year: completeCalendarYears[0],
    latest_complete_calendar_year: completeCalendarYears.at(-1),
    latest_shortwave_cloud_radiative_effect_w_m2: records.at(-1).toa_shortwave_cloud_radiative_effect_w_m2,
    source_period_label: parsed.allSky.periodLabel,
    source_variables: Object.fromEntries(parsed.variableNames)
  },
  caveats: [
    'The score uses only complete calendar years; partial 2000 and 2026 observations remain in the snapshot for provenance but are excluded from annual normalization.',
    'Shortwave cloud radiative effect is retained with a fixed signed convention. A less-negative value represents weaker cloud shortwave cooling, not a direct cloud-feedback attribution.',
    'The global mean does not measure marine low-cloud-deck retreat, a regional cloud regime, longwave cloud radiative effect or net cloud radiative effect.',
    'Missing months or non-finite source values are rejected and never converted to zero.'
  ],
  failureBehavior: 'Retain the last validated snapshot and mark stale; reject a changed product version, variable identity, time range, missing month, non-finite flux, sign-convention violation or fewer than 20 complete calendar years; never fill missing flux with zero or substitute total cloud fraction for radiative effect.'
});

const output = await writeSnapshot(ROOT, 'nasa-ceres-global-cloud-radiative-effect-snapshot.json', snapshot);
console.log(JSON.stringify({
  output,
  product_version: sourceVersion,
  monthly_observations: records.length,
  complete_calendar_years: completeCalendarYears.length,
  latest_observation_period: records.at(-1).observation_period,
  latest_shortwave_cloud_radiative_effect_w_m2: records.at(-1).toa_shortwave_cloud_radiative_effect_w_m2
}, null, 2));
