import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/noaa-coops-high-tide-flood-snapshot.json');
const SOURCE_ID = 'noaa_co_ops_derived_product_api';
const INGESTION_JOB_ID = 'fetch_noaa_coops_high_tide_flood_metrics';
const YEAR = 2025;
const START_DATE = `${YEAR}0101`;
const END_DATE = `${YEAR}1231`;
const DATUM = 'mhhw';
const STATIONS = Object.freeze([
  { id: '8638610', label: 'Sewells Point, Virginia' },
  { id: '8575512', label: 'Annapolis, Maryland' },
  { id: '8665530', label: 'Charleston, South Carolina' },
  { id: '1612340', label: 'Honolulu, Hawaii' }
]);
const DOCS_URL = 'https://api.tidesandcurrents.noaa.gov/dpapi/prod/';

const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

function dailyUrl(stationId) {
  const query = new URLSearchParams({
    station: stationId,
    start_date: START_DATE,
    end_date: END_DATE,
    units: 'metric',
    datum: DATUM
  });
  return `https://api.tidesandcurrents.noaa.gov/dpapi/prod/webapi/htf/htf_daily.json?${query}`;
}

function thresholdUrl(stationId) {
  return `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/${stationId}/floodlevels.json?units=metric`;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

async function fetchStation(station) {
  const stationDailyUrl = dailyUrl(station.id);
  const stationThresholdUrl = thresholdUrl(station.id);
  const [daily, thresholds] = await Promise.all([
    fetchJson(stationDailyUrl),
    fetchJson(stationThresholdUrl)
  ]);
  const days = Array.isArray(daily?.DailyFloodCount) ? daily.DailyFloodCount : [];
  const validDays = days.filter(day => Number(day.nanFlag) === 0 && Number.isFinite(Number(day.maxWL)));
  const minorDays = validDays.filter(day => Number(day.minFlag) === 1);
  const moderateDays = validDays.filter(day => Number(day.modFlag) === 1);
  const majorDays = validDays.filter(day => Number(day.majFlag) === 1);
  const maximumDay = validDays.reduce((best, day) => (
    !best || Number(day.maxWL) > Number(best.maxWL) ? day : best
  ), null);

  return {
    record_id: `noaa_coops_htf_${station.id}_${YEAR}`,
    station_id: station.id,
    station_name: daily?.stnName || station.label,
    latitude: Number(daily?.lat),
    longitude: Number(daily?.lon),
    observation_year: YEAR,
    datum: DATUM.toUpperCase(),
    units: daily?.units || 'meters',
    reported_days: days.length,
    valid_days: validDays.length,
    completeness_pct: round(validDays.length / 365 * 100, 1),
    minor_flood_days: minorDays.length,
    moderate_flood_days: moderateDays.length,
    major_flood_days: majorDays.length,
    minor_flood_dates: minorDays.map(day => day.day),
    moderate_flood_dates: moderateDays.map(day => day.day),
    major_flood_dates: majorDays.map(day => day.day),
    maximum_daily_water_level_m: maximumDay ? round(Number(maximumDay.maxWL)) : null,
    maximum_daily_water_level_date: maximumDay?.day || null,
    maximum_daily_water_level_hour: maximumDay?.maxTime ?? null,
    raw_flood_level_metadata: {
      units: 'meters as returned by the metadata endpoint',
      reference_basis: 'Source metadata reference is retained without conversion. The derived-product minFlag/modFlag/majFlag fields are the authoritative threshold classifications; this snapshot does not compare these raw metadata elevations with the MHHW daily series.',
      values: {
        noaa_minor: round(Number(thresholds?.nos_minor)),
        noaa_moderate: round(Number(thresholds?.nos_moderate)),
        noaa_major: round(Number(thresholds?.nos_major)),
        nws_minor: round(Number(thresholds?.nws_minor)),
        nws_moderate: round(Number(thresholds?.nws_moderate)),
        nws_major: round(Number(thresholds?.nws_major)),
        action: round(Number(thresholds?.action))
      }
    },
    source_locator: {
      daily_api_url: stationDailyUrl,
      threshold_metadata_url: stationThresholdUrl,
      docs_url: DOCS_URL
    }
  };
}

async function main() {
  const records = [];
  for (const station of STATIONS) records.push(await fetchStation(station));
  for (const record of records) {
    if (record.completeness_pct < 95) throw new Error(`${record.station_id} completeness below 95 percent`);
  }

  const snapshot = {
    version: `noaa_coops_high_tide_flood_${YEAR}_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'NOAA CO-OPS Derived Product API',
      url: DOCS_URL,
      publisher: 'NOAA Center for Operational Oceanographic Products and Services',
      access: 'open_api'
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: ['coastal_high_water_exposure_days'],
    cadence: 'annual complete-year refresh after verified daily records are available; monthly source check',
    provenance: 'Official NOAA CO-OPS High Tide Flooding daily records and station flood-level metadata for a declared four-gauge United States panel, metric units, MHHW datum, and calendar year 2025.',
    uncertainty: 'Gauge coverage is local; datum, station-specific flood thresholds, vertical land motion, verification lag, missing daily records, and coastal defenses affect interpretation. Daily flags indicate threshold exceedance at the gauge, not mapped inundation or damage.',
    failure_behavior: 'Retain the last validated complete-year snapshot and mark stale. Withhold any station below 95 percent daily completeness; never classify a missing day as non-flooding.',
    measurement_boundary: 'This snapshot measures gauge-level high-tide-flood threshold exceedance days in the United States. It does not estimate global coastal exposure, inundated area, people affected, damages, waves, rainfall flooding, or future scenario risk.',
    observation_period: { start: `${YEAR}-01-01`, end: `${YEAR}-12-31` },
    datum: DATUM.toUpperCase(),
    station_count: records.length,
    record_count: records.length,
    records
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: OUTPUT_PATH, records: records.length, metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
