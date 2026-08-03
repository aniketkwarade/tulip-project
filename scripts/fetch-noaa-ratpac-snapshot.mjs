import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { strFromU8, unzipSync } from 'fflate';

import {
  readMetricContracts,
  snapshotEnvelope,
  writeSnapshot
} from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANNUAL_URL = 'https://www.ncei.noaa.gov/pub/data/ratpac/ratpac-a/RATPAC-A-annual-levels.txt.zip';
const SEASONAL_URL = 'https://www.ncei.noaa.gov/pub/data/ratpac/ratpac-a/RATPAC-A-seasonal-layers.txt.zip';
const README_URL = 'https://www.ncei.noaa.gov/pub/data/ratpac/readme.txt';
const COMPLETE_YEAR_CUTOFF = new Date().getUTCFullYear() - 1;
const PRESSURE_LEVELS = ['surface', '850', '700', '500', '400', '300', '250', '200', '150', '100', '70', '50', '30'];
const REGION_LABELS = Object.freeze({
  NH: 'Northern Hemisphere',
  SH: 'Southern Hemisphere',
  GLOBE: 'Globe',
  'TROPICS (30S- 30N)': 'Tropics 30S-30N',
  'NH Extratropics': 'Northern Hemisphere extratropics',
  'SH Extratropics': 'Southern Hemisphere extratropics',
  'TROPICS (20S-20N)': 'Tropics 20S-20N'
});

const round = (value, digits = 4) => Number(value.toFixed(digits));

async function fetchArchive(url, expectedFilename) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/zip,application/octet-stream',
      'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound NOAA RATPAC ingestion)'
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const entry = archive[expectedFilename];
  if (!entry) throw new Error(`NOAA RATPAC archive did not contain ${expectedFilename}`);
  return strFromU8(entry);
}

function parseAnnualLevels(text) {
  const records = [];
  let region = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (REGION_LABELS[line]) {
      region = REGION_LABELS[line];
      continue;
    }
    if (line.startsWith('year ')) continue;
    if (!region || !/^\d{4}\s/.test(line)) continue;
    const values = line.split(/\s+/);
    const year = Number(values[0]);
    if (!Number.isInteger(year) || values.length !== 14) {
      throw new Error(`Unexpected RATPAC annual-level row: ${line}`);
    }
    for (let index = 0; index < PRESSURE_LEVELS.length; index += 1) {
      const anomaly = Number(values[index + 1]);
      if (!Number.isFinite(anomaly) || anomaly === 999) continue;
      records.push({
        region,
        observation_year: year,
        pressure_level_hpa: PRESSURE_LEVELS[index] === 'surface' ? null : Number(PRESSURE_LEVELS[index]),
        atmospheric_level: PRESSURE_LEVELS[index],
        temperature_anomaly_k: anomaly
      });
    }
  }
  return records;
}

function parseSeasonalLayers(text) {
  const records = [];
  let layer = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^\d+-\d+ mb$/.test(line)) {
      layer = line.replace(' mb', '');
      continue;
    }
    if (line.startsWith('year ')) continue;
    if (!layer || !/^\d{4}\s/.test(line)) continue;
    const rowMatch = line.match(/^(\d{4})\s+(\d)\s*(.*)$/);
    const anomalyValues = rowMatch?.[3]?.match(/-?\d+\.\d{3}/g) ?? [];
    if (!rowMatch || anomalyValues.length !== 7) {
      throw new Error(`Unexpected RATPAC seasonal-layer row: ${line}`);
    }
    const year = Number(rowMatch[1]);
    const season = Number(rowMatch[2]);
    const [nhRaw, shRaw, globeRaw, tropicsRaw, nhExRaw, shExRaw, tropics20Raw] = anomalyValues;
    const anomalies = {
      'Northern Hemisphere': Number(nhRaw),
      'Southern Hemisphere': Number(shRaw),
      Globe: Number(globeRaw),
      'Tropics 30S-30N': Number(tropicsRaw),
      'Northern Hemisphere extratropics': Number(nhExRaw),
      'Southern Hemisphere extratropics': Number(shExRaw),
      'Tropics 20S-20N': Number(tropics20Raw)
    };
    for (const [region, anomaly] of Object.entries(anomalies)) {
      if (!Number.isFinite(anomaly) || anomaly === 999) continue;
      records.push({
        layer_hpa: layer,
        region,
        observation_year: year,
        season,
        temperature_anomaly_k: anomaly
      });
    }
  }
  return records;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function approximateT975(degreesFreedom) {
  const z = 1.959963984540054;
  const inverseDf = 1 / degreesFreedom;
  return z
    + ((z ** 3 + z) / 4) * inverseDf
    + ((5 * z ** 5 + 16 * z ** 3 + 3 * z) / 96) * inverseDf ** 2;
}

function linearTrend(points) {
  const n = points.length;
  if (n < 10) throw new Error(`Trend requires at least 10 annual observations; received ${n}`);
  const meanYear = mean(points.map(point => point.year));
  const meanValue = mean(points.map(point => point.value));
  const sxx = points.reduce((sum, point) => sum + (point.year - meanYear) ** 2, 0);
  const slopePerYear = points.reduce(
    (sum, point) => sum + (point.year - meanYear) * (point.value - meanValue),
    0
  ) / sxx;
  const intercept = meanValue - slopePerYear * meanYear;
  const residualSumSquares = points.reduce(
    (sum, point) => sum + (point.value - (intercept + slopePerYear * point.year)) ** 2,
    0
  );
  const slopeStandardError = Math.sqrt((residualSumSquares / (n - 2)) / sxx);
  const critical = approximateT975(n - 2);
  return {
    observations: n,
    slope_k_per_decade: slopePerYear * 10,
    lower_95_ci_k_per_decade: (slopePerYear - critical * slopeStandardError) * 10,
    upper_95_ci_k_per_decade: (slopePerYear + critical * slopeStandardError) * 10,
    slope_standard_error_k_per_decade: slopeStandardError * 10,
    uncertainty_method: 'derived ordinary-least-squares 95 percent confidence interval using an approximate two-sided Student-t critical value; no autocorrelation adjustment'
  };
}

const contracts = await readMetricContracts(ROOT);
const trendContract = contracts.tropospheric_warming_speeds;
const layerContract = contracts.thermal_air_column_shifts;
const stratosphereContract = contracts.stratospheric_cooling;
if (trendContract?.metric_id !== 'tropospheric_temperature_anomaly_trend') {
  throw new Error('Missing or changed tropospheric_warming_speeds metric contract');
}
if (layerContract?.metric_id !== 'radiosonde_layer_temperature_anomaly') {
  throw new Error('Missing or changed thermal_air_column_shifts metric contract');
}
if (stratosphereContract?.metric_id !== 'lower_stratospheric_temperature_anomaly') {
  throw new Error('Missing or changed stratospheric_cooling metric contract');
}
if (trendContract.source_id !== 'noaa_ratpac' || layerContract.source_id !== 'noaa_ratpac' || stratosphereContract.source_id !== 'noaa_ratpac') {
  throw new Error('RATPAC metric contracts no longer share the noaa_ratpac source');
}

const [annualText, seasonalText] = await Promise.all([
  fetchArchive(ANNUAL_URL, 'RATPAC-A-annual-levels.txt'),
  fetchArchive(SEASONAL_URL, 'RATPAC-A-seasonal-layers.txt')
]);
const annualLevels = parseAnnualLevels(annualText)
  .filter(record => record.observation_year <= COMPLETE_YEAR_CUTOFF);
const seasonalLayers = parseSeasonalLayers(seasonalText)
  .filter(record => record.observation_year <= COMPLETE_YEAR_CUTOFF);

const globalAnnualLevels = annualLevels.filter(record => record.region === 'Globe');
const lowerStratosphereLevels = new Set([100, 70, 50]);
const lowerStratosphereByYear = new Map();
for (const record of globalAnnualLevels.filter(record => lowerStratosphereLevels.has(record.pressure_level_hpa))) {
  const rows = lowerStratosphereByYear.get(record.observation_year) ?? [];
  rows.push(record);
  lowerStratosphereByYear.set(record.observation_year, rows);
}
const annualLowerStratosphere = [...lowerStratosphereByYear]
  .filter(([, rows]) => rows.length === lowerStratosphereLevels.size)
  .map(([year, rows]) => ({ year, value: mean(rows.map(record => record.temperature_anomaly_k)), pressure_levels_hpa: rows.map(record => record.pressure_level_hpa).sort((a, b) => b - a) }))
  .sort((a, b) => a.year - b.year);
const globalTroposphereSeasons = seasonalLayers.filter(
  record => record.region === 'Globe' && record.layer_hpa === '850-300'
);
const seasonsByYear = new Map();
for (const record of globalTroposphereSeasons) {
  if (!seasonsByYear.has(record.observation_year)) seasonsByYear.set(record.observation_year, []);
  seasonsByYear.get(record.observation_year).push(record);
}
const annualTroposphere = [...seasonsByYear.entries()]
  .filter(([, records]) => records.length === 4 && new Set(records.map(record => record.season)).size === 4)
  .map(([year, records]) => ({
    year,
    value: mean(records.map(record => record.temperature_anomaly_k)),
    seasons: records.map(record => record.season).sort()
  }))
  .sort((a, b) => a.year - b.year);

if (globalAnnualLevels.length < 800 || annualTroposphere.length < 60 || annualLowerStratosphere.length < 60) {
  throw new Error(`RATPAC transformation is unexpectedly small: ${globalAnnualLevels.length} level-years and ${annualTroposphere.length} troposphere years`);
}

const fullTrend = linearTrend(annualTroposphere);
const recentStart = 1996;
const recentTrendPoints = annualTroposphere.filter(point => point.year >= recentStart);
const recentTrend = linearTrend(recentTrendPoints);
const records = [
  ...globalAnnualLevels.map(record => ({
    record_id: `ratpac_a_global_${record.observation_year}_${record.atmospheric_level}`,
    metric_id: layerContract.metric_id,
    measurement_role: 'source_native_global_annual_pressure_level_anomaly',
    geography: 'Globe',
    observation_year: record.observation_year,
    atmospheric_level: record.atmospheric_level,
    pressure_level_hpa: record.pressure_level_hpa,
    temperature_anomaly_k: record.temperature_anomaly_k,
    temperature_anomaly_deg_c: record.temperature_anomaly_k,
    source_baseline: 'RATPAC source-native anomaly baseline retained; NOAA readme does not restate the baseline in the file schema',
    source_product: 'RATPAC-A annual levels',
    source_locator: ANNUAL_URL
  })),
  ...annualTroposphere.map(point => ({
    record_id: `ratpac_a_global_850_300_${point.year}`,
    metric_id: trendContract.metric_id,
    measurement_role: 'derived_global_annual_850_300_hpa_layer_anomaly_from_four_source_seasons',
    geography: 'Globe',
    observation_year: point.year,
    atmospheric_layer_hpa: '850-300',
    complete_source_seasons: point.seasons,
    temperature_anomaly_k: round(point.value),
    temperature_anomaly_deg_c: round(point.value),
    source_baseline: 'RATPAC source-native anomaly baseline retained',
    source_product: 'RATPAC-A seasonal layers',
    source_locator: SEASONAL_URL
  })),
  ...annualLowerStratosphere.map(point => ({
    record_id: `ratpac_a_global_lower_stratosphere_${point.year}`,
    metric_id: stratosphereContract.metric_id,
    measurement_role: 'derived_global_annual_100_70_50_hpa_mean_anomaly',
    geography: 'Globe',
    observation_year: point.year,
    atmospheric_layer_hpa: '100-50',
    component_pressure_levels_hpa: point.pressure_levels_hpa,
    temperature_anomaly_k: round(point.value),
    temperature_anomaly_deg_c: round(point.value),
    source_baseline: 'RATPAC source-native anomaly baseline retained',
    source_product: 'RATPAC-A annual levels',
    source_locator: ANNUAL_URL
  })),
  ...[
    {
      label: 'full_complete_record',
      start: annualTroposphere[0].year,
      end: annualTroposphere.at(-1).year,
      trend: fullTrend
    },
    {
      label: 'post_1995_sensitivity',
      start: recentStart,
      end: annualTroposphere.at(-1).year,
      trend: recentTrend
    }
  ].map(item => ({
    record_id: `ratpac_a_global_850_300_trend_${item.start}_${item.end}`,
    metric_id: trendContract.metric_id,
    measurement_role: item.label,
    geography: 'Globe',
    atmospheric_layer_hpa: '850-300',
    trend_start_year: item.start,
    trend_end_year: item.end,
    observations: item.trend.observations,
    trend_k_per_decade: round(item.trend.slope_k_per_decade),
    lower_95_ci_k_per_decade: round(item.trend.lower_95_ci_k_per_decade),
    upper_95_ci_k_per_decade: round(item.trend.upper_95_ci_k_per_decade),
    slope_standard_error_k_per_decade: round(item.trend.slope_standard_error_k_per_decade),
    uncertainty_method: item.trend.uncertainty_method,
    source_product: 'RATPAC-A seasonal layers',
    source_locator: SEASONAL_URL
  }))
];

const latestCompleteYear = Math.max(...annualTroposphere.map(point => point.year));
if (latestCompleteYear !== COMPLETE_YEAR_CUTOFF) {
  throw new Error(`RATPAC latest complete year ${latestCompleteYear} does not match expected cutoff ${COMPLETE_YEAR_CUTOFF}`);
}

const snapshot = snapshotEnvelope({
  jobId: 'fetch_noaa_ratpac_temperature_metrics',
  source: {
    id: 'noaa_ratpac',
    name: 'Radiosonde Atmospheric Temperature Products for Assessing Climate',
    publisher: 'NOAA National Centers for Environmental Information',
    product: 'RATPAC-A annual levels and seasonal layers',
    dataset_url: 'https://www.ncei.noaa.gov/products/weather-balloon/radiosonde-atmospheric-temperature-products',
    readme_url: README_URL,
    annual_levels_url: ANNUAL_URL,
    seasonal_layers_url: SEASONAL_URL,
    access: 'open_https_ascii_in_zip'
  },
  request: {
    files: [ANNUAL_URL, SEASONAL_URL],
    geography: 'Globe',
    complete_year_cutoff: COMPLETE_YEAR_CUTOFF,
    trend_windows: [
      `${annualTroposphere[0].year}-${latestCompleteYear}`,
      `${recentStart}-${latestCompleteYear}`
    ]
  },
  contractIds: [trendContract.metric_id, layerContract.metric_id, stratosphereContract.metric_id],
  contractBindings: [
    {
      node_id: 'tropospheric_warming_speeds',
      metric_contract_id: trendContract.metric_id,
      measurement_role: 'global_850_300_hpa_layer_anomaly_and_derived_trend'
    },
    {
      node_id: 'thermal_air_column_shifts',
      metric_contract_id: layerContract.metric_id,
      measurement_role: 'source_native_global_annual_pressure_level_anomaly'
    },
    {
      node_id: 'stratospheric_cooling',
      metric_contract_id: stratosphereContract.metric_id,
      measurement_role: 'derived_global_annual_100_70_50_hpa_mean_anomaly'
    }
  ],
  cadence: 'monthly source check with complete-year trend replacement after all four seasons are available',
  provenance: 'Official NOAA NCEI RATPAC-A adjusted large-area radiosonde temperature anomalies. Pressure-level anomalies are retained source-native. Global 850-300 hPa annual anomalies are arithmetic means of four source seasons; the global lower-stratosphere indicator is the arithmetic mean of source-native 100, 70 and 50 hPa annual anomalies; trends and intervals are transparent derived OLS summaries.',
  uncertainty: 'NOAA RATPAC reduces temporal inhomogeneities from instrument and observing-practice changes, but radiosonde coverage, homogenization, pressure-level and layer weighting, baseline, missingness, current-year incompleteness, trend window and residual autocorrelation affect estimates. OLS intervals are derived by this job and are not NOAA-reported uncertainty.',
  records,
  sourceSummary: {
    earliest_complete_year: annualTroposphere[0].year,
    latest_complete_year: latestCompleteYear,
    excluded_partial_years: [...new Set(parseAnnualLevels(annualText).map(record => record.observation_year))]
      .filter(year => year > COMPLETE_YEAR_CUTOFF),
    global_pressure_level_records: globalAnnualLevels.length,
    global_annual_troposphere_records: annualTroposphere.length,
    global_annual_lower_stratosphere_records: annualLowerStratosphere.length,
    pressure_levels: PRESSURE_LEVELS,
    full_record_trend_k_per_decade: round(fullTrend.slope_k_per_decade),
    full_record_lower_95_ci_k_per_decade: round(fullTrend.lower_95_ci_k_per_decade),
    full_record_upper_95_ci_k_per_decade: round(fullTrend.upper_95_ci_k_per_decade),
    post_1995_trend_k_per_decade: round(recentTrend.slope_k_per_decade),
    post_1995_lower_95_ci_k_per_decade: round(recentTrend.lower_95_ci_k_per_decade),
    post_1995_upper_95_ci_k_per_decade: round(recentTrend.upper_95_ci_k_per_decade)
  },
  caveats: [
    'The annual file can contain a current partial-year value. This snapshot excludes every year after the latest completed calendar year.',
    'Kelvin anomalies and degrees-Celsius anomalies have identical increments; both fields are retained for contract clarity.',
    'The 850-300 hPa annual anomaly is derived from four source seasonal anomalies and is withheld when any season is missing.',
    'OLS confidence intervals do not adjust for temporal autocorrelation or structural observing-system uncertainty and must not be represented as NOAA-published bounds.',
    'Upper-air temperature is not interchangeable with surface temperature and does not by itself identify circulation, moisture, cloud or forcing mechanisms.'
  ],
  failureBehavior: 'Retain the last validated complete snapshot and mark stale; reject changed archive filenames or row widths, fewer than sixty complete years, missing seasons, an incomplete latest expected year or missing metric contracts; never treat 999.00 as a measurement or include a partial current year in the trend.'
});

const output = await writeSnapshot(ROOT, 'noaa-ratpac-snapshot.json', snapshot);
console.log(JSON.stringify({
  output,
  records: records.length,
  latest_complete_year: latestCompleteYear,
  pressure_level_records: globalAnnualLevels.length,
  annual_troposphere_records: annualTroposphere.length,
  full_trend_k_per_decade: round(fullTrend.slope_k_per_decade),
  full_trend_95_ci: [
    round(fullTrend.lower_95_ci_k_per_decade),
    round(fullTrend.upper_95_ci_k_per_decade)
  ],
  post_1995_trend_k_per_decade: round(recentTrend.slope_k_per_decade),
  post_1995_trend_95_ci: [
    round(recentTrend.lower_95_ci_k_per_decade),
    round(recentTrend.upper_95_ci_k_per_decade)
  ],
  contracts: [trendContract.metric_id, layerContract.metric_id, stratosphereContract.metric_id]
}, null, 2));
