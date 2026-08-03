import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchJson, readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = path.join(ROOT, '.env.local');
const RESPONDENTS = ['PJM', 'MISO', 'ERCO', 'CISO', 'NYIS', 'ISNE', 'SWPP'];
const WINDOW_DAYS = 30;
const PAGE_SIZE = 5000;

async function loadEnvFile() {
  try {
    const text = await fs.readFile(ENV_FILE, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function dateWindow() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  end.setUTCHours(23, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1));
  start.setUTCHours(0, 0, 0, 0);
  return {
    start: start.toISOString().slice(0, 13),
    end: end.toISOString().slice(0, 13)
  };
}

function buildUrl(endpoint, apiKey, window, facets = {}) {
  const params = new URLSearchParams({
    api_key: apiKey,
    frequency: 'hourly',
    start: window.start,
    end: window.end,
    offset: '0',
    length: String(PAGE_SIZE)
  });
  params.append('data[0]', 'value');
  params.append('sort[0][column]', 'period');
  params.append('sort[0][direction]', 'asc');
  for (const respondent of RESPONDENTS) params.append('facets[respondent][]', respondent);
  for (const [facet, values] of Object.entries(facets)) {
    for (const value of values) params.append(`facets[${facet}][]`, value);
  }
  return `https://api.eia.gov/v2/electricity/rto/${endpoint}/data/?${params.toString()}`;
}

async function fetchAll(url) {
  const records = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const pageUrl = new URL(url);
    pageUrl.searchParams.set('offset', String(offset));
    const payload = await fetchJson(pageUrl.toString());
    const rows = payload.response?.data || [];
    total = Number(payload.response?.total || rows.length);
    records.push(...rows);
    if (!rows.length) break;
    offset += rows.length;
  }
  return records;
}

const numeric = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

function percentile(values, probability) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function mean(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function summarizeRespondent(respondent, regionRows, fuelRows, window) {
  const rows = regionRows.filter(row => row.respondent === respondent);
  const name = rows[0]?.['respondent-name'] || fuelRows.find(row => row.respondent === respondent)?.['respondent-name'] || respondent;
  const byPeriod = new Map();
  for (const row of rows) {
    if (!byPeriod.has(row.period)) byPeriod.set(row.period, {});
    byPeriod.get(row.period)[row.type] = numeric(row.value);
  }
  const paired = [...byPeriod.entries()]
    .map(([period, values]) => ({ period, demand: values.D, forecast: values.DF }))
    .filter(item => Number.isFinite(item.demand));
  const pairedForecasts = paired.filter(item => Number.isFinite(item.forecast) && item.demand !== 0);
  const demandValues = paired.map(item => item.demand);
  const peak = paired.reduce((best, item) => !best || item.demand > best.demand ? item : best, null);
  const expectedHours = WINDOW_DAYS * 24;

  const respondentFuel = fuelRows.filter(row => row.respondent === respondent);
  const gasGeneration = respondentFuel
    .filter(row => row.fueltype === 'NG')
    .map(row => numeric(row.value))
    .filter(Number.isFinite)
    .reduce((sum, value) => sum + Math.max(0, value), 0);
  const positiveGeneration = respondentFuel
    .map(row => numeric(row.value))
    .filter(Number.isFinite)
    .reduce((sum, value) => sum + Math.max(0, value), 0);

  return {
    record_id: `eia930_${respondent}_${window.start}_${window.end}`,
    respondent_id: respondent,
    respondent_name: name,
    window_start_utc: window.start,
    window_end_utc: window.end,
    expected_hourly_intervals: expectedHours,
    observed_demand_intervals: paired.length,
    paired_demand_forecast_intervals: pairedForecasts.length,
    demand_completeness_pct: round((paired.length / expectedHours) * 100, 1),
    peak_demand_mwh_per_hour: round(peak?.demand),
    peak_demand_period_utc: peak?.period || null,
    p95_demand_mwh_per_hour: round(percentile(demandValues, 0.95)),
    mean_demand_mwh_per_hour: round(mean(demandValues)),
    mean_absolute_forecast_error_pct: round(mean(pairedForecasts.map(item => Math.abs(item.demand - item.forecast) / Math.abs(item.demand) * 100))),
    gas_generation_mwh: round(gasGeneration),
    total_positive_generation_mwh: round(positiveGeneration),
    gas_generation_share_pct: positiveGeneration > 0 ? round((gasGeneration / positiveGeneration) * 100) : null,
    fuel_observation_count: respondentFuel.length,
    source_unit: rows[0]?.['value-units'] || 'megawatthours'
  };
}

async function main() {
  await loadEnvFile();
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) throw new Error('Missing EIA_API_KEY in .env.local');

  const contracts = await readMetricContracts(ROOT);
  const required = ['grid_peak_load_stress', 'gas_power_dependence'];
  for (const nodeId of required) {
    if (!contracts[nodeId]) throw new Error(`Missing node metric contract for ${nodeId}`);
  }

  const window = dateWindow();
  const regionUrl = buildUrl('region-data', apiKey, window, { type: ['D', 'DF'] });
  const fuelUrl = buildUrl('fuel-type-data', apiKey, window);
  const [regionRows, fuelRows] = await Promise.all([fetchAll(regionUrl), fetchAll(fuelUrl)]);
  const records = RESPONDENTS.map(id => summarizeRespondent(id, regionRows, fuelRows, window));

  const snapshot = snapshotEnvelope({
    jobId: 'fetch_eia_hourly_grid_metrics',
    source: {
      id: 'eia_hourly_electric_grid_monitor',
      name: 'EIA Hourly Electric Grid Monitor',
      publisher: 'U.S. Energy Information Administration',
      product: 'Form EIA-930',
      docs_url: 'https://www.eia.gov/opendata/browser/electricity/rto',
      api_base_url: 'https://api.eia.gov/v2/electricity/rto/'
    },
    request: {
      window,
      respondents: RESPONDENTS,
      region_metrics: ['Demand', 'Day-ahead demand forecast'],
      fuel_metric: 'Hourly net generation by energy source',
      api_key_used_server_side: true
    },
    contractIds: required.map(nodeId => contracts[nodeId].metric_id),
    contractBindings: required.map(nodeId => ({ node_id: nodeId, metric_id: contracts[nodeId].metric_id })),
    cadence: 'daily refresh of a rolling 30-day hourly window',
    provenance: 'Official EIA API v2 Form EIA-930 hourly balancing-authority demand, day-ahead forecast, and generation-by-fuel observations.',
    uncertainty: 'EIA revisions, balancing-area accounting, missing intervals, behind-the-meter resources, interchange, storage sign conventions, and the rolling-window boundary affect the summaries.',
    records,
    sourceSummary: {
      region_source_rows: regionRows.length,
      fuel_source_rows: fuelRows.length,
      balancing_authorities: records.length,
      minimum_demand_completeness_pct: Math.min(...records.map(record => record.demand_completeness_pct ?? 0)),
      measurement_boundary: 'Peak demand and forecast error are operating-stress indicators. They do not measure available capacity or reserve margin. Gas share uses positive reported generation by fuel in the same bounded window.'
    },
    caveats: [
      'The selected balancing authorities are a high-load operational panel, not a complete national census.',
      'Negative storage or pumped-storage values are excluded from the positive-generation denominator and remain a source of accounting uncertainty.',
      'This artifact does not serve demand response, curtailment, peaker starts, transmission congestion, capacity, or reserve-margin contracts.'
    ],
    failureBehavior: 'Retain the last validated snapshot, mark it stale, expose the failed EIA endpoint and affected balancing authorities, and never impute missing hours or convert them to zero.'
  });

  const output = await writeSnapshot(ROOT, 'eia-hourly-grid-snapshot.json', snapshot);
  console.log(JSON.stringify({ output, records: records.length, source_rows: regionRows.length + fuelRows.length, window }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
