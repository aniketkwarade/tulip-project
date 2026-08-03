import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchText, parseCsv, readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCT_URL = 'https://www.ncei.noaa.gov/products/international-best-track-archive';
const SERIES_URL = 'https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.since1980.list.v04r01.csv';
const DATASET_DOI = 'https://doi.org/10.25921/82ty-9e16';
const RI_THRESHOLD_KT_PER_24H = 30;
const HOUR_MS = 60 * 60 * 1000;

function parseTime(value) {
  const timestamp = Date.parse(`${value.replace(' ', 'T')}Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function buildStormRecords(text) {
  const rows = parseCsv(text).filter(row => /^\d{4}$/.test(row.SEASON) && row.SID && row.TRACK_TYPE === 'main');
  const storms = new Map();
  for (const row of rows) {
    if (!storms.has(row.SID)) storms.set(row.SID, []);
    storms.get(row.SID).push(row);
  }

  let stormsWithoutUsaWind = 0;
  let stormsWithoutExact24HourPairs = 0;
  const records = [];
  for (const [sid, stormRows] of storms) {
    const observations = stormRows.map(row => ({
      time: parseTime(row.ISO_TIME),
      iso_time: row.ISO_TIME,
      wind_kt: Number(row.USA_WIND),
      agency: row.USA_AGENCY || null,
      basin: row.BASIN,
      name: row.NAME,
      season: Number(row.SEASON),
      track_status: row.USA_STATUS || null,
      latitude: Number(row.USA_LAT || row.LAT),
      longitude: Number(row.USA_LON || row.LON)
    })).filter(item => Number.isFinite(item.time) && Number.isFinite(item.wind_kt)).sort((a, b) => a.time - b.time);
    if (!observations.length) {
      stormsWithoutUsaWind += 1;
      continue;
    }
    const byTime = new Map(observations.map(item => [item.time, item]));
    const windows = [];
    for (const start of observations) {
      const end = byTime.get(start.time + 24 * HOUR_MS);
      if (!end) continue;
      windows.push({ start, end, change_kt: end.wind_kt - start.wind_kt });
    }
    if (!windows.length) {
      stormsWithoutExact24HourPairs += 1;
      continue;
    }
    windows.sort((a, b) => b.change_kt - a.change_kt || a.start.time - b.start.time);
    const maximum = windows[0];
    records.push({
      record_id: `ibtracs_ri_${sid}`,
      sid,
      season: maximum.start.season,
      basin: maximum.start.basin,
      storm_name: maximum.start.name,
      maximum_24h_wind_change_kt: maximum.change_kt,
      rapid_intensification_threshold_kt_per_24h: RI_THRESHOLD_KT_PER_24H,
      rapid_intensification_observed: maximum.change_kt >= RI_THRESHOLD_KT_PER_24H,
      maximum_window_start_utc: `${maximum.start.iso_time} UTC`,
      maximum_window_end_utc: `${maximum.end.iso_time} UTC`,
      start_wind_kt: maximum.start.wind_kt,
      end_wind_kt: maximum.end.wind_kt,
      start_agency: maximum.start.agency,
      end_agency: maximum.end.agency,
      start_track_status: maximum.start.track_status,
      end_track_status: maximum.end.track_status,
      start_latitude: maximum.start.latitude,
      start_longitude: maximum.start.longitude,
      end_latitude: maximum.end.latitude,
      end_longitude: maximum.end.longitude,
      valid_exact_24h_windows: windows.length,
      wind_basis: 'IBTrACS USA_WIND one-minute sustained wind estimate in knots',
      track_type: 'main',
      source_locator: SERIES_URL
    });
  }

  records.sort((a, b) => a.season - b.season || a.sid.localeCompare(b.sid));
  return { records, totalStorms: storms.size, stormsWithoutUsaWind, stormsWithoutExact24HourPairs };
}

async function main() {
  const contracts = await readMetricContracts(ROOT);
  const contract = contracts.tropical_cyclone_rapid_intensification;
  if (!contract) throw new Error('Missing node metric contract for tropical_cyclone_rapid_intensification');
  const sourceText = await fetchText(SERIES_URL);
  const parsed = buildStormRecords(sourceText);
  if (parsed.records.length < 30) throw new Error(`IBTrACS returned only ${parsed.records.length} storms with exact 24-hour USA_WIND pairs`);
  const riRecords = parsed.records.filter(record => record.rapid_intensification_observed);
  const latestSeason = Math.max(...parsed.records.map(record => record.season));

  const snapshot = snapshotEnvelope({
    jobId: 'fetch_noaa_ibtracs_rapid_intensification',
    source: {
      id: 'noaa_ibtracs',
      name: 'NOAA International Best Track Archive for Climate Stewardship v04r01',
      publisher: 'NOAA National Centers for Environmental Information',
      product_url: PRODUCT_URL,
      series_url: SERIES_URL,
      dataset_doi: DATASET_DOI
    },
    request: {
      source_subset: 'IBTrACS since 1980',
      track_type: 'main',
      wind_field: 'USA_WIND',
      wind_averaging_period: 'one-minute maximum sustained wind',
      comparison_window_hours: 24,
      rapid_intensification_threshold_kt_per_24h: RI_THRESHOLD_KT_PER_24H,
      exact_timestamp_pairs_required: true
    },
    contractIds: [contract.metric_id],
    contractBindings: [{ node_id: 'tropical_cyclone_rapid_intensification', metric_id: contract.metric_id }],
    cadence: 'weekly complete-file replacement after the NOAA IBTrACS v04r01 update',
    provenance: 'Official NOAA NCEI IBTrACS v04r01 main-track observations. The metric uses the source USA_WIND field at exactly 24-hour-separated timestamps and retains the reporting agency and provisional track status.',
    uncertainty: 'IBTrACS merges agency best tracks, and wind estimates, observing systems, post-storm revisions, averaging periods, agency practices, provisional tracks, and missing exact 24-hour pairs affect the result. This bounded metric deliberately uses USA_WIND rather than mixing agency wind fields.',
    records: parsed.records,
    sourceSummary: {
      source_storms: parsed.totalStorms,
      storms_with_valid_exact_24h_usa_wind_pairs: parsed.records.length,
      storms_with_rapid_intensification: riRecords.length,
      storms_without_usa_wind: parsed.stormsWithoutUsaWind,
      storms_without_exact_24h_pairs: parsed.stormsWithoutExact24HourPairs,
      latest_season: latestSeason,
      maximum_observed_24h_wind_change_kt: Math.max(...parsed.records.map(record => record.maximum_24h_wind_change_kt)),
      measurement_boundary: 'Storm-level maximum USA_WIND change across exact 24-hour pairs in the since-1980 IBTrACS subset. It is not an attribution result, landfall impact, forecast, or fully homogeneous observing-system record.'
    },
    caveats: [
      'The since-1980 file supports annual historical distributions, but observing systems, agency practices and coverage change through time and prevent treating the record as perfectly homogeneous.',
      'USA_WIND is a one-minute sustained-wind estimate and must not be combined directly with agency fields using other averaging periods.',
      'Storms without USA_WIND observations or exact 24-hour timestamp pairs are counted and withheld rather than classified as non-events.',
      'Recent tracks can be provisional and may change after best-track reanalysis.',
      'The 30-knot-in-24-hours threshold is a declared operational definition; alternative agencies and studies may use different definitions.'
    ],
    failureBehavior: 'Retain the last validated complete snapshot and mark it stale; reject changed columns, an implausibly short storm panel, or missing exact-timestamp pairs; never infer zero intensification from missing wind data.'
  });

  const output = await writeSnapshot(ROOT, 'noaa-ibtracs-rapid-intensification-snapshot.json', snapshot);
  console.log(JSON.stringify({ output, records: parsed.records.length, ri_storms: riRecords.length, latest_season: latestSeason }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
