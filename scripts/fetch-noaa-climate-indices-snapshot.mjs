import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const SERIES = Object.freeze([
  {
    index_id: 'pdo',
    node_id: 'pacific_decadal_oscillation',
    metric_id: 'pacific_decadal_oscillation_index',
    name: 'Pacific Decadal Oscillation index',
    url: 'https://psl.noaa.gov/data/correlation/pdo.data',
    publisher: 'NOAA Physical Sciences Laboratory',
    frequency: 'monthly',
    parser: 'monthly_year_rows',
    missing_values: [-9.9, -99.9, -999, -9999]
  },
  {
    index_id: 'pna',
    node_id: 'pacific_north_american_pattern',
    metric_id: 'pacific_north_american_index',
    name: 'Pacific-North American teleconnection index',
    url: 'https://ftp.cpc.ncep.noaa.gov/cwlinks/norm.daily.pna.cdas.z500.19500101_current.csv',
    publisher: 'NOAA Climate Prediction Center',
    frequency: 'daily',
    parser: 'daily_csv',
    missing_values: [-99.9, -99.99, -999, -9999]
  },
  {
    index_id: 'nao',
    node_id: 'north_atlantic_oscillation',
    metric_id: 'north_atlantic_oscillation_index',
    name: 'North Atlantic Oscillation index',
    url: 'https://ftp.cpc.ncep.noaa.gov/cwlinks/norm.daily.nao.cdas.z500.19500101_current.csv',
    publisher: 'NOAA Climate Prediction Center',
    frequency: 'daily',
    parser: 'daily_csv',
    missing_values: [-99.9, -99.99, -999, -9999]
  },
  {
    index_id: 'ao',
    node_id: 'arctic_oscillation',
    metric_id: 'arctic_oscillation_index',
    name: 'Arctic Oscillation index',
    url: 'https://ftp.cpc.ncep.noaa.gov/cwlinks/norm.daily.ao.cdas.z1000.19500101_current.csv',
    publisher: 'NOAA Climate Prediction Center',
    frequency: 'daily',
    parser: 'daily_csv',
    missing_values: [-99.9, -99.99, -999, -9999]
  },
  {
    index_id: 'dmi',
    node_id: 'indian_ocean_dipole',
    metric_id: 'dipole_mode_index',
    name: 'Indian Ocean Dipole Mode Index',
    url: 'https://psl.noaa.gov/data/timeseries/month/data/dmi.had.long.data',
    publisher: 'NOAA Physical Sciences Laboratory',
    frequency: 'monthly',
    parser: 'monthly_year_rows',
    unit: 'degrees Celsius SST-gradient anomaly',
    maximum_age_days: 550,
    missing_values: [-9.9, -99.9, -999, -9999]
  },
  {
    index_id: 'romi',
    node_id: 'madden_julian_oscillation',
    metric_id: 'noaa_psl_realtime_olr_mjo_index',
    name: 'NOAA PSL Real-time OLR Madden-Julian Oscillation Index',
    url: 'https://psl.noaa.gov/mjo/mjoindex/romi.cpcolr.1x.txt',
    publisher: 'NOAA Physical Sciences Laboratory',
    frequency: 'daily',
    parser: 'daily_whitespace_principal_components',
    missing_values: [-9.9, -99.9, -999, -9999]
  },
  {
    index_id: 'aao',
    node_id: 'southern_annular_mode',
    metric_id: 'southern_annular_mode_index',
    name: 'Southern Annular Mode / Antarctic Oscillation index',
    url: 'https://psl.noaa.gov/data/correlation/aao.csv',
    publisher: 'NOAA Climate Prediction Center via NOAA Physical Sciences Laboratory',
    frequency: 'monthly',
    parser: 'monthly_csv',
    missing_values: [-9.9, -99.9, -999, -9999]
  },
  {
    index_id: 'qbo',
    node_id: 'quasi_biennial_oscillation',
    metric_id: 'equatorial_stratospheric_zonal_wind',
    name: 'Quasi-Biennial Oscillation 30 hPa equatorial zonal wind',
    url: 'https://psl.noaa.gov/data/correlation/qbo.csv',
    publisher: 'NOAA Physical Sciences Laboratory',
    frequency: 'monthly',
    parser: 'monthly_csv',
    unit: 'metres per second',
    missing_values: [-9.9, -99.9, -999, -9999]
  },
  {
    index_id: 'amo',
    node_id: 'atlantic_multidecadal_oscillation',
    metric_id: 'atlantic_multidecadal_variability_index',
    name: 'Atlantic Multidecadal Oscillation / Variability index',
    url: 'https://www.ncei.noaa.gov/pub/data/cmb/ersst/v5/index/ersst.v5.amo.dat',
    publisher: 'NOAA National Centers for Environmental Information',
    frequency: 'monthly',
    parser: 'year_month_value_rows',
    unit: 'degrees Celsius North Atlantic SST anomaly',
    missing_values: [-9.9, -99.9, -999, -9999]
  }
]);

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'LostPlanet-Northstar/1.0 climate-index snapshot' },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

function parseMonthlyTable(text, series) {
  const rows = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    const tokens = line.trim().split(/\s+/);
    if (!/^\d{4}$/.test(tokens[0] || '') || tokens.length < 13) continue;
    const year = Number(tokens[0]);
    if (year < 1800 || year > new Date().getUTCFullYear() + 1) continue;
    for (let index = 0; index < 12; index += 1) {
      const value = Number(tokens[index + 1]);
      if (!Number.isFinite(value) || series.missing_values.includes(value) || value <= -90) continue;
      const observationMonth = `${year}-${MONTHS[index]}`;
      const recordKey = `${series.index_id}:${observationMonth}`;
      if (seen.has(recordKey)) throw new Error(`Duplicate ${recordKey} in ${series.url}`);
      seen.add(recordKey);
      rows.push({
        record_id: `noaa_${series.index_id}_${observationMonth}`,
        node_id: series.node_id,
        metric_id: series.metric_id,
        measurement_role: 'source_native_climate_index_primary',
        index_id: series.index_id,
        index_name: series.name,
        frequency: series.frequency,
        observation_period: observationMonth,
        observation_date: `${observationMonth}-01`,
        observation_month: observationMonth,
        observation_year: year,
        observation_month_number: index + 1,
        index_value: value,
        unit: series.unit || 'source-native standardized index units',
        publisher: series.publisher,
        source_locator: series.url
      });
    }
  }
  if (rows.length < 120) throw new Error(`${series.index_id} source produced only ${rows.length} valid monthly records`);
  return rows.sort((a, b) => a.observation_month.localeCompare(b.observation_month));
}

function parseDailyCsv(text, series) {
  const rows = [];
  const seen = new Set();
  const retentionStartYear = new Date().getUTCFullYear() - 10;
  for (const line of text.split(/\r?\n/)) {
    const tokens = line.trim().split(',').map(token => token.trim());
    if (tokens.length < 4 || !/^\d{4}$/.test(tokens[0] || '')) continue;
    const [year, month, day, value] = tokens.map(Number);
    if (year < retentionStartYear || year > new Date().getUTCFullYear() + 1) continue;
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) continue;
    if (!Number.isFinite(value) || series.missing_values.includes(value) || value <= -90 || Math.abs(value) > 20) continue;
    const observationDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const parsedDate = new Date(`${observationDate}T00:00:00Z`);
    if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== observationDate) continue;
    const recordKey = `${series.index_id}:${observationDate}`;
    if (seen.has(recordKey)) throw new Error(`Duplicate ${recordKey} in ${series.url}`);
    seen.add(recordKey);
    rows.push({
      record_id: `noaa_${series.index_id}_${observationDate}`,
      node_id: series.node_id,
      metric_id: series.metric_id,
      measurement_role: 'source_native_climate_index_primary',
      index_id: series.index_id,
      index_name: series.name,
      frequency: series.frequency,
      observation_period: observationDate,
      observation_date: observationDate,
      observation_month: observationDate.slice(0, 7),
      observation_year: year,
      observation_month_number: month,
      index_value: value,
      unit: 'source-native standardized index units',
      publisher: series.publisher,
      source_locator: series.url
    });
  }
  if (rows.length < 3000) throw new Error(`${series.index_id} source produced only ${rows.length} valid retained daily records`);
  return rows.sort((a, b) => a.observation_date.localeCompare(b.observation_date));
}

function parseMonthlyCsv(text, series) {
  const rows = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    const [dateToken, valueToken] = line.split(',').map(token => token?.trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateToken || '')) continue;
    const value = Number(valueToken);
    if (!Number.isFinite(value) || series.missing_values.includes(value) || value <= -90 || Math.abs(value) > 100) continue;
    const observationDate = new Date(`${dateToken}T00:00:00Z`);
    if (Number.isNaN(observationDate.valueOf()) || observationDate.toISOString().slice(0, 10) !== dateToken) continue;
    const observationMonth = dateToken.slice(0, 7);
    const recordKey = `${series.index_id}:${observationMonth}`;
    if (seen.has(recordKey)) throw new Error(`Duplicate ${recordKey} in ${series.url}`);
    seen.add(recordKey);
    rows.push({
      record_id: `noaa_${series.index_id}_${observationMonth}`,
      node_id: series.node_id,
      metric_id: series.metric_id,
      measurement_role: 'source_native_climate_index_primary',
      index_id: series.index_id,
      index_name: series.name,
      frequency: series.frequency,
      observation_period: observationMonth,
      observation_date: dateToken,
      observation_month: observationMonth,
      observation_year: observationDate.getUTCFullYear(),
      observation_month_number: observationDate.getUTCMonth() + 1,
      index_value: value,
      unit: series.unit || 'source-native standardized index units',
      publisher: series.publisher,
      source_locator: series.url
    });
  }
  if (rows.length < 60) throw new Error(`${series.index_id} source produced only ${rows.length} valid monthly CSV records`);
  return rows.sort((a, b) => a.observation_month.localeCompare(b.observation_month));
}

function parseYearMonthValueRows(text, series) {
  const rows = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    const tokens = line.trim().split(/\s+/).map(Number);
    if (tokens.length < 3) continue;
    const [year, month, value] = tokens;
    if (!Number.isInteger(year) || year < 1800 || year > new Date().getUTCFullYear() + 1) continue;
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isFinite(value) || series.missing_values.includes(value) || Math.abs(value) > 20) continue;
    const observationMonth = `${year}-${String(month).padStart(2, '0')}`;
    const recordKey = `${series.index_id}:${observationMonth}`;
    if (seen.has(recordKey)) throw new Error(`Duplicate ${recordKey} in ${series.url}`);
    seen.add(recordKey);
    rows.push({
      record_id: `noaa_${series.index_id}_${observationMonth}`,
      node_id: series.node_id,
      metric_id: series.metric_id,
      measurement_role: 'source_native_climate_index_primary',
      index_id: series.index_id,
      index_name: series.name,
      frequency: series.frequency,
      observation_period: observationMonth,
      observation_date: `${observationMonth}-01`,
      observation_month: observationMonth,
      observation_year: year,
      observation_month_number: month,
      index_value: value,
      unit: series.unit,
      publisher: series.publisher,
      source_locator: series.url
    });
  }
  if (rows.length < 60) throw new Error(`${series.index_id} source produced only ${rows.length} valid year-month records`);
  return rows.sort((a, b) => a.observation_month.localeCompare(b.observation_month));
}

function parseDailyPrincipalComponents(text, series) {
  const rows = [];
  const seen = new Set();
  const retentionStartYear = new Date().getUTCFullYear() - 10;
  for (const line of text.split(/\r?\n/)) {
    const tokens = line.trim().split(/\s+/).map(Number);
    if (tokens.length < 7) continue;
    const [year, month, day, , pc1, pc2, reportedAmplitude] = tokens;
    if (!Number.isInteger(year) || year < retentionStartYear || year > new Date().getUTCFullYear() + 1) continue;
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) continue;
    if (![pc1, pc2, reportedAmplitude].every(Number.isFinite)) continue;
    if ([pc1, pc2, reportedAmplitude].some(value => series.missing_values.includes(value) || Math.abs(value) > 20)) continue;
    const observationDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const parsedDate = new Date(`${observationDate}T00:00:00Z`);
    if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== observationDate) continue;
    const calculatedAmplitude = Math.sqrt(pc1 ** 2 + pc2 ** 2);
    if (Math.abs(calculatedAmplitude - reportedAmplitude) > 0.002) throw new Error(`ROMI amplitude mismatch on ${observationDate}`);
    const recordKey = `${series.index_id}:${observationDate}`;
    if (seen.has(recordKey)) throw new Error(`Duplicate ${recordKey} in ${series.url}`);
    seen.add(recordKey);
    rows.push({
      record_id: `noaa_${series.index_id}_${observationDate}`,
      node_id: series.node_id,
      metric_id: series.metric_id,
      measurement_role: 'source_native_daily_mjo_index_primary',
      index_id: series.index_id,
      index_name: series.name,
      frequency: series.frequency,
      observation_period: observationDate,
      observation_date: observationDate,
      observation_month: observationDate.slice(0, 7),
      observation_year: year,
      observation_month_number: month,
      index_value: reportedAmplitude,
      pc1,
      pc2,
      amplitude: reportedAmplitude,
      unit: 'source-native standardized principal-component and amplitude units',
      publisher: series.publisher,
      source_locator: series.url
    });
  }
  if (rows.length < 3000) throw new Error(`${series.index_id} source produced only ${rows.length} valid retained daily records`);
  return rows.sort((a, b) => a.observation_date.localeCompare(b.observation_date));
}

function parseSeries(text, series) {
  if (series.parser === 'monthly_year_rows') return parseMonthlyTable(text, series);
  if (series.parser === 'monthly_csv') return parseMonthlyCsv(text, series);
  if (series.parser === 'year_month_value_rows') return parseYearMonthValueRows(text, series);
  if (series.parser === 'daily_csv') return parseDailyCsv(text, series);
  if (series.parser === 'daily_whitespace_principal_components') return parseDailyPrincipalComponents(text, series);
  throw new Error(`Unsupported parser ${series.parser} for ${series.index_id}`);
}

async function main() {
  const contracts = await readMetricContracts(ROOT);
  for (const series of SERIES) {
    const contract = contracts[series.node_id];
    if (!contract || contract.metric_id !== series.metric_id) {
      throw new Error(`Missing or mismatched metric contract for ${series.node_id}: expected ${series.metric_id}`);
    }
  }

  const texts = await Promise.all(SERIES.map(series => fetchText(series.url)));
  const records = SERIES.flatMap((series, index) => parseSeries(texts[index], series));
  const latestByIndex = Object.fromEntries(SERIES.map(series => {
    const seriesRows = records.filter(record => record.index_id === series.index_id);
    return [series.index_id, seriesRows.at(-1)?.observation_period || null];
  }));
  const capturedDate = new Date().toISOString().slice(0, 10);
  const freshnessByIndex = Object.fromEntries(SERIES.map(series => {
    const latest = latestByIndex[series.index_id];
    const normalizedLatest = latest?.length === 7 ? `${latest}-01` : latest;
    const ageDays = normalizedLatest
      ? Math.floor((new Date(`${capturedDate}T00:00:00Z`) - new Date(`${normalizedLatest}T00:00:00Z`)) / 86400000)
      : null;
    const maximumAgeDays = series.maximum_age_days || (series.frequency === 'daily' ? 10 : 400);
    return [series.index_id, {
      frequency: series.frequency,
      latest_observation_period: latest,
      age_days_at_capture: ageDays,
      maximum_age_days: maximumAgeDays,
      status: Number.isFinite(ageDays) && ageDays <= maximumAgeDays ? 'within_source_cadence' : 'source_lagging'
    }];
  }));

  const snapshot = snapshotEnvelope({
    jobId: 'fetch_noaa_climate_indices',
    source: {
      id: 'noaa_cpc_psl_climate_indices',
      name: 'NOAA CPC and PSL Climate Indices',
      publisher: 'National Oceanic and Atmospheric Administration',
      landing_page: 'https://psl.noaa.gov/data/climateindices/list/',
      endpoints: SERIES.map(series => ({ index_id: series.index_id, url: series.url, publisher: series.publisher, frequency: series.frequency }))
    },
    request: { indices: SERIES.map(series => series.index_id), source_native_frequencies: true, daily_retention_years: 10, missing_values_removed: true },
    contractIds: SERIES.map(series => series.metric_id),
    contractBindings: SERIES.map(series => ({ node_id: series.node_id, metric_id: series.metric_id, measurement_role: 'source_native_climate_index_primary' })),
    cadence: 'daily source check for CPC PNA, NAO and AO and PSL ROMI; monthly source check for PSL/NCEI PDO, DMI, AAO, QBO and AMO; complete validated snapshot replacement',
    provenance: 'Official NOAA PSL and NCEI monthly Pacific Decadal Oscillation, Dipole Mode, Antarctic Oscillation, Quasi-Biennial Oscillation and ERSSTv5 Atlantic Multidecadal Oscillation tables, NOAA PSL daily Real-time OLR MJO Index, and NOAA CPC daily PNA, NAO and AO tables, parsed without interpolation and retaining source-native values, units, components and frequencies.',
    uncertainty: 'Index construction, base period, spatial loading, input datasets, source revisions and provisional recent months affect comparison. The indices are dimensionless state descriptors rather than direct hazard magnitudes.',
    records,
    sourceSummary: {
      series_count: SERIES.length,
      records_by_index: Object.fromEntries(SERIES.map(series => [series.index_id, records.filter(record => record.index_id === series.index_id).length])),
      latest_observation_period_by_index: latestByIndex,
      freshness_by_index: freshnessByIndex,
      measurement_boundary: 'Each source-native climate index is retained separately. Phase and amplitude do not by themselves measure a regional hazard, impact, or causal contribution.'
    },
    caveats: [
      'NOAA PSL, CPC and NCEI indices use different construction methods, base periods, units and input fields and must not be averaged together; DMI and AMO are SST anomalies, QBO is a 30 hPa zonal wind in metres per second, and ROMI is not interchangeable with RMM.',
      'Recent values can be revised; daily CPC records retain a rolling ten-year operational window while the monthly PDO source history is retained in full.',
      'A lagging source is disclosed per index and is never replaced with an inferred or carried-forward value.',
      'Missing-value sentinels are removed and never converted to zero.'
    ],
    failureBehavior: 'Retain the last validated complete snapshot and mark stale; reject truncation, duplicate index-periods, invalid dates, daily CPC observations older than ten days or missing freshness metadata; never fill a missing period with zero.'
  });

  const output = await writeSnapshot(ROOT, 'noaa-climate-indices-snapshot.json', snapshot);
  console.log(JSON.stringify({ output, records: records.length, latest_by_index: latestByIndex }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
