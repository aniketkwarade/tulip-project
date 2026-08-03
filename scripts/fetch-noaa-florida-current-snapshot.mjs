import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contracts = await readMetricContracts(ROOT);
const metric = contracts.gulf_stream_slowdown;
if (!metric?.metric_id) throw new Error('Missing gulf_stream_slowdown metric contract. Run npm run export:contracts first.');

const FIRST_OPERATIONAL_YEAR = 2000;
const LAST_COMPLETE_YEAR = new Date().getUTCFullYear() - 1;
const PRODUCT_VERSION = year => year < 2008 ? 'v2' : 'v3';
const DATA_URL = year => `https://www.aoml.noaa.gov/ftp/phod/WBTS/cable/FC_cable_transport_${year}_${PRODUCT_VERSION(year)}.dat`;
const execFileAsync = promisify(execFile);

async function fetchNoaaText(url) {
  const { stdout } = await execFileAsync('curl', [
    '-4', '--fail', '--location', '--silent', '--show-error',
    '--connect-timeout', '15', '--max-time', '45',
    '--retry', '4', '--retry-delay', '1', '--retry-all-errors',
    url
  ], { maxBuffer: 4 * 1024 * 1024 });
  return stdout;
}

function parseDailyTransport(text, year, sourceUrl) {
  const records = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!/^\s*\d{4}\s+\d{1,2}\s+\d{1,2}\s+/.test(line)) continue;
    const [recordYear, month, day, transport, qualityFlag] = line.trim().split(/\s+/).map(Number);
    if (recordYear !== year || !Number.isFinite(transport) || !Number.isInteger(qualityFlag) || ![0, 1, 3].includes(qualityFlag)) continue;
    const observationDate = `${recordYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const parsed = new Date(`${observationDate}T00:00:00Z`);
    if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== observationDate || seen.has(observationDate)) continue;
    seen.add(observationDate);
    records.push({
      record_id: `noaa_florida_current_${observationDate}`,
      node_id: 'gulf_stream_slowdown',
      metric_id: metric.metric_id,
      measurement_role: 'florida_straits_27n_daily_transport_primary',
      observation_date: observationDate,
      observation_year: recordYear,
      section: 'Florida Straits at 27 degrees north',
      transport_sverdrups: transport,
      quality_flag: qualityFlag,
      quality_flag_meaning: qualityFlag === 0
        ? 'cable data good'
        : qualityFlag === 1
          ? 'cable estimate without filter'
          : 'pressure-gauge-derived transport during cable outage',
      geomagnetic_correction: 'NOAA v3 secular geomagnetic-field correction applied',
      unit: 'Sverdrups',
      source_locator: sourceUrl
    });
  }
  return records.sort((left, right) => left.observation_date.localeCompare(right.observation_date));
}

const yearly = [];
for (const year of Array.from({ length: LAST_COMPLETE_YEAR - FIRST_OPERATIONAL_YEAR + 1 }, (_, index) => FIRST_OPERATIONAL_YEAR + index)) {
  const sourceUrl = DATA_URL(year);
  yearly.push({ year, sourceUrl, records: parseDailyTransport(await fetchNoaaText(sourceUrl), year, sourceUrl) });
}

const incompleteYears = yearly.filter(item => item.records.length < 300);
const records = yearly.flatMap(item => item.records);
const annualMeans = yearly.filter(item => item.records.length >= 300).map(item => ({
  observation_year: item.year,
  valid_daily_observations: item.records.length,
  mean_transport_sverdrups: Number((item.records.reduce((sum, record) => sum + record.transport_sverdrups, 0) / item.records.length).toFixed(6)),
  minimum_transport_sverdrups: Math.min(...item.records.map(record => record.transport_sverdrups)),
  maximum_transport_sverdrups: Math.max(...item.records.map(record => record.transport_sverdrups)),
  source_locator: item.sourceUrl
}));
if (annualMeans.length < 20 || annualMeans.at(-1)?.observation_year !== LAST_COMPLETE_YEAR) {
  throw new Error(`NOAA Florida Current historical-distribution gate failed: ${annualMeans.length} complete years through ${annualMeans.at(-1)?.observation_year ?? 'none'}.`);
}

const snapshot = snapshotEnvelope({
  jobId: 'fetch_noaa_florida_current_transport',
  source: {
    id: 'noaa_florida_current_transport_time_series_data_products',
    name: 'NOAA Florida Current Transport Time Series Data Products',
    publisher: 'NOAA Atlantic Oceanographic and Meteorological Laboratory, Western Boundary Time Series project',
    documentation_url: 'https://www.aoml.noaa.gov/phod/floridacurrent/data_access.php',
    access: 'open_annual_text_downloads'
  },
  request: {
    url_template: DATA_URL('{year}'),
    first_year: FIRST_OPERATIONAL_YEAR,
    last_complete_year: LAST_COMPLETE_YEAR,
    product_versions: { '2000-2007': 'v2', '2008-present': 'v3' }
  },
  contractIds: [metric.metric_id],
  contractBindings: [{ node_id: 'gulf_stream_slowdown', metric_contract_id: metric.metric_id, measurement_role: 'florida_straits_27n_daily_transport_primary' }],
  cadence: 'Annual complete-year refresh from NOAA daily transport files.',
  provenance: 'Official NOAA/AOML v3 daily Florida Current transport at 27N, retaining valid cable and pressure-gauge replacement flags and the secular geomagnetic-field correction.',
  uncertainty: metric.uncertainty,
  records,
  sourceSummary: {
    first_complete_year: annualMeans[0].observation_year,
    latest_complete_year: annualMeans.at(-1).observation_year,
    complete_annual_observations: annualMeans.length,
    excluded_incomplete_years: incompleteYears.map(item => ({ observation_year: item.year, valid_daily_observations: item.records.length, exclusion_threshold_days: 300 })),
    valid_daily_observations: records.length,
    long_term_reference_transport_sverdrups: 32,
    section: 'Florida Straits at 27 degrees north',
    annual_means: annualMeans
  },
  caveats: [
    'The 27N Florida Current section is a bounded upper-ocean transport indicator, not the full Gulf Stream downstream and not the basin-wide AMOC.',
    'Pressure-gauge-derived values replace cable outages beginning in 2008 and retain quality flag 3; missing values are excluded rather than converted to zero.',
    'Years with fewer than 300 valid daily observations are retained as raw records but excluded from annual normalization and scoring.',
    'Annual means suppress seasonal and short-lived daily variability; path position is not combined with volume transport in this receipt.'
  ],
  failureBehavior: 'Retain the last validated complete-year snapshot and mark stale; reject missing annual files, fewer than 300 valid days, schema drift or invalid quality flags; never fill missing days with zero or infer AMOC collapse from this section.'
});

const output = await writeSnapshot(ROOT, 'noaa-florida-current-snapshot.json', snapshot);
console.log(JSON.stringify({ output, records: records.length, annual_means: annualMeans.length, latest: annualMeans.at(-1) }, null, 2));
