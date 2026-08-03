import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as h5wasm from 'h5wasm/node';

import { readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contracts = await readMetricContracts(ROOT);
const metric = contracts.amoc;
if (!metric?.metric_id) throw new Error('Missing amoc metric contract. Run npm run export:contracts first.');

const SOURCE_URL = 'https://rapid.ac.uk/sites/default/files/rapid_data/moc_transports.nc';
const DOCUMENTATION_URL = 'https://rapid.ac.uk/data/integrated-transports';
const ARCHIVE_URL = 'https://www.bodc.ac.uk/data/published_data_library/catalogue/10.5285/48d0bf43-0598-ceb2-e063-7086abc062f1';
const SOURCE_DOI = '10.5285/48d0bf43-0598-ceb2-e063-7086abc062f1';
const SOURCE_PUBLICATION_DATE = '2026-01-27';
const SOURCE_END_DATE = '2024-03-27';
const DOCUMENTED_LONG_TERM_MEAN_SV = 16.9;
const MINIMUM_MONTHLY_COVERAGE = 0.8;
const MS_PER_DAY = 86_400_000;
const SOURCE_EPOCH_MS = Date.UTC(2004, 3, 1);

const response = await fetch(SOURCE_URL, {
  headers: {
    Accept: 'application/x-netcdf,application/octet-stream;q=0.9,*/*;q=0.5',
    'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound snapshot ingestion)'
  },
  signal: AbortSignal.timeout(60_000)
});
if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${SOURCE_URL}`);
const sourceBytes = Buffer.from(await response.arrayBuffer());
if (sourceBytes.length < 100_000 || !sourceBytes.subarray(0, 8).equals(Buffer.from([0x89, 0x48, 0x44, 0x46, 0x0d, 0x0a, 0x1a, 0x0a]))) {
  throw new Error('RAPID transport download is not the expected HDF5-backed NetCDF file.');
}
const sourceSha256 = crypto.createHash('sha256').update(sourceBytes).digest('hex');

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lostplanet-rapid-amoc-'));
const tempPath = path.join(tempDir, 'moc_transports.nc');
await fs.writeFile(tempPath, sourceBytes);

let sourceTime;
let sourceTransport;
let fillValue;
let timeUnits;
let transportUnits;
try {
  await h5wasm.ready;
  const file = new h5wasm.File(tempPath, 'r');
  const timeDataset = file.get('time');
  const transportDataset = file.get('moc_mar_hc10');
  if (!timeDataset || !transportDataset || timeDataset.shape?.[0] !== transportDataset.shape?.[0]) {
    throw new Error('RAPID NetCDF schema drift: time and moc_mar_hc10 are missing or misaligned.');
  }
  sourceTime = Array.from(timeDataset.value);
  sourceTransport = Array.from(transportDataset.value);
  fillValue = Number(transportDataset.attrs._FillValue?.value?.[0]);
  timeUnits = String(timeDataset.attrs.units?.value || '');
  transportUnits = String(transportDataset.attrs.units?.value || '');
  file.close();
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

if (timeUnits !== 'days since 2004-4-1 00:00:00' || transportUnits !== 'Sv' || !Number.isFinite(fillValue)) {
  throw new Error(`RAPID NetCDF metadata drift: time=${timeUnits}, transport=${transportUnits}, fill=${fillValue}.`);
}

const byMonth = new Map();
let validObservationCount = 0;
for (let index = 0; index < sourceTime.length; index += 1) {
  const sourceDay = sourceTime[index];
  const transport = sourceTransport[index];
  if (!Number.isFinite(sourceDay) || !Number.isFinite(transport) || transport === fillValue) continue;
  const timestamp = new Date(SOURCE_EPOCH_MS + sourceDay * MS_PER_DAY);
  if (Number.isNaN(timestamp.valueOf())) continue;
  const observationPeriod = timestamp.toISOString().slice(0, 7);
  const values = byMonth.get(observationPeriod) || [];
  values.push(transport);
  byMonth.set(observationPeriod, values);
  validObservationCount += 1;
}

const round = (value, digits = 6) => Number(value.toFixed(digits));
const records = [...byMonth.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([observationPeriod, values]) => {
  const [year, month] = observationPeriod.split('-').map(Number);
  const expectedObservations = new Date(Date.UTC(year, month, 0)).getUTCDate() * 2;
  const coverage = values.length / expectedObservations;
  return {
    record_id: `rapid_amoc_26n_${observationPeriod}`,
    node_id: 'amoc',
    metric_id: metric.metric_id,
    measurement_role: 'monthly_mean_full_basin_width_26_5n_overturning_transport',
    observation_period: observationPeriod,
    observation_year: year,
    observation_month: month,
    section: 'North Atlantic full-basin-width array at 26.5 degrees north',
    mean_transport_sverdrups: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    minimum_transport_sverdrups: round(Math.min(...values)),
    maximum_transport_sverdrups: round(Math.max(...values)),
    valid_half_daily_observations: values.length,
    expected_half_daily_observations: expectedObservations,
    coverage_fraction: round(coverage),
    complete_for_scoring: coverage >= MINIMUM_MONTHLY_COVERAGE,
    unit: 'Sverdrups',
    source_variable: 'moc_mar_hc10',
    source_locator: SOURCE_URL,
    source_doi: SOURCE_DOI
  };
});
const completeMonths = records.filter(record => record.complete_for_scoring);
if (completeMonths.length < 60) throw new Error(`RAPID monthly historical-distribution gate failed: ${completeMonths.length} complete months.`);

const snapshot = snapshotEnvelope({
  jobId: 'fetch_rapid_amoc_26n_transport',
  source: {
    id: 'rapid_amoc_26n_transport_time_series',
    name: 'RAPID-MOCHA-WBTS AMOC Transport Time Series at 26.5N',
    publisher: 'National Oceanography Centre with BODC, NOAA AOML and University of Miami partners',
    documentation_url: DOCUMENTATION_URL,
    archive_url: ARCHIVE_URL,
    doi: SOURCE_DOI,
    licence: 'UK Open Government Licence 3.0',
    access: 'open_netcdf_download'
  },
  request: {
    url: SOURCE_URL,
    source_variable: 'moc_mar_hc10',
    source_time_variable: 'time',
    source_sha256: sourceSha256,
    source_bytes: sourceBytes.length,
    minimum_monthly_coverage_fraction: MINIMUM_MONTHLY_COVERAGE
  },
  contractIds: [metric.metric_id],
  contractBindings: [{ node_id: 'amoc', metric_contract_id: metric.metric_id, measurement_role: 'monthly_mean_full_basin_width_26_5n_overturning_transport' }],
  cadence: 'Refresh whenever RAPID publishes a quality-controlled mooring-array release; check the source and BODC DOI metadata monthly.',
  provenance: 'Official RAPID-MOCHA-WBTS half-daily, 10-day-low-pass-filtered AMOC transport at 26.5N. Monthly means are derived only from finite moc_mar_hc10 values and are accepted for scoring at 80 percent or greater half-daily coverage.',
  uncertainty: metric.uncertainty,
  records,
  sourceSummary: {
    source_publication_date: SOURCE_PUBLICATION_DATE,
    source_end_date: SOURCE_END_DATE,
    first_complete_month: completeMonths[0].observation_period,
    latest_complete_month: completeMonths.at(-1).observation_period,
    complete_monthly_observations: completeMonths.length,
    partial_months: records.filter(record => !record.complete_for_scoring).map(record => ({ observation_period: record.observation_period, valid_half_daily_observations: record.valid_half_daily_observations, coverage_fraction: record.coverage_fraction })),
    source_time_steps: sourceTime.length,
    valid_overturning_observations: validObservationCount,
    missing_overturning_observations: sourceTime.length - validObservationCount,
    documented_long_term_mean_transport_sverdrups: DOCUMENTED_LONG_TERM_MEAN_SV,
    source_sha256: sourceSha256,
    source_variable: 'moc_mar_hc10',
    section: 'North Atlantic at 26.5 degrees north'
  },
  caveats: [
    'The array is a full-basin-width observation at one declared Atlantic latitude, not a direct measurement at every latitude or of every global overturning cell.',
    'Sub-annual AMOC variability is large; monthly means and monthly changes must not be interpreted as a long-term trend or imminent collapse.',
    'The latest source release is delayed by mooring recovery, processing and quality control; the observation lag is retained in receipt freshness metadata.',
    'The March 2024 partial month is retained with its coverage but excluded from normalization; fill values and missing observations are never converted to zero.'
  ],
  failureBehavior: 'Retain the last checksum-validated snapshot and mark stale; reject changed variables, units, epoch, fill value, fewer than 60 complete months or a latest-month coverage below 80 percent; never fill missing transports with zero or infer AMOC collapse from a single month.'
});

const output = await writeSnapshot(ROOT, 'rapid-amoc-snapshot.json', snapshot);
console.log(JSON.stringify({ output, source_sha256: sourceSha256, records: records.length, complete_months: completeMonths.length, latest_complete_month: completeMonths.at(-1) }, null, 2));
