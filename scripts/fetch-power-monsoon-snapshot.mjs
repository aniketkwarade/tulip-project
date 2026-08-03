import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'power-monsoon-snapshot.json');
const SOURCE_ID = 'nasa_power_monsoon_rainfall_pilot';
const INGESTION_JOB_ID = 'fetch_power_indian_monsoon_rainfall';
const METRIC_ID = 'monsoon_onset_and_seasonal_rainfall_variability';
const DOCS_URL = 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/';
const IMD_CRITERIA_URL = 'https://mausamaudit.imd.gov.in/responsive/monsooninformation_onset.php';
const BASELINE_START_YEAR = 1991;
const BASELINE_END_YEAR = 2020;
const OBSERVATION_YEAR = 2025;
const REQUEST_START = `${BASELINE_START_YEAR}0501`;
const REQUEST_END = `${OBSERVATION_YEAR}0930`;
const RAINFALL_THRESHOLD_MM_DAY = 2.5;
const PANEL_FRACTION = 0.6;

// Requested points approximate the named IMD Kerala-onset rainfall locations on
// the NASA POWER grid. They are not station observations and retain that boundary.
const REFERENCE_LOCATIONS = Object.freeze([
  { id: 'minicoy', name: 'Minicoy', latitude: 8.30, longitude: 73.05 },
  { id: 'amini', name: 'Amini', latitude: 11.12, longitude: 72.73 },
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram', latitude: 8.48, longitude: 76.95 },
  { id: 'punalur', name: 'Punalur', latitude: 9.00, longitude: 76.93 },
  { id: 'kollam', name: 'Kollam', latitude: 8.89, longitude: 76.59 },
  { id: 'alappuzha', name: 'Alappuzha', latitude: 9.49, longitude: 76.33 },
  { id: 'kottayam', name: 'Kottayam', latitude: 9.59, longitude: 76.52 },
  { id: 'kochi', name: 'Kochi', latitude: 9.93, longitude: 76.27 },
  { id: 'thrissur', name: 'Thrissur', latitude: 10.53, longitude: 76.21 },
  { id: 'kozhikode', name: 'Kozhikode', latitude: 11.25, longitude: 75.78 },
  { id: 'thalassery', name: 'Thalassery', latitude: 11.75, longitude: 75.49 },
  { id: 'kannur', name: 'Kannur', latitude: 11.87, longitude: 75.37 },
  { id: 'kudulu', name: 'Kudulu', latitude: 12.53, longitude: 74.95 },
  { id: 'mangaluru', name: 'Mangaluru', latitude: 12.91, longitude: 74.86 }
]);

const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const standardDeviation = values => {
  if (values.length < 2) return null;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
};

function apiUrl(location) {
  const query = new URLSearchParams({
    parameters: 'PRECTOTCORR',
    community: 'AG',
    longitude: String(location.longitude),
    latitude: String(location.latitude),
    start: REQUEST_START,
    end: REQUEST_END,
    format: 'JSON',
    'time-standard': 'UTC'
  });
  return `https://power.larc.nasa.gov/api/temporal/daily/point?${query}`;
}

async function fetchJson(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(120_000)
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  throw new Error(`NASA POWER request failed for ${url}: ${lastError?.message || 'unknown error'}`);
}

function validPrecipitation(payload) {
  const fill = payload?.header?.fill_value ?? -999;
  return Object.fromEntries(Object.entries(payload?.properties?.parameter?.PRECTOTCORR || {})
    .map(([date, value]) => [date, Number(value)])
    .filter(([, value]) => Number.isFinite(value) && value !== fill));
}

function dayOfYear(date) {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86_400_000) + 1;
}

function dateRange(start, end) {
  const dates = [];
  for (let cursor = new Date(`${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}T00:00:00Z`);
    cursor <= new Date(`${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6, 8)}T00:00:00Z`);
    cursor = new Date(cursor.getTime() + 86_400_000)) {
    dates.push(cursor.toISOString().slice(0, 10).replaceAll('-', ''));
  }
  return dates;
}

function rainfallGateDate(year, seriesByLocation) {
  const dates = dateRange(`${year}0511`, `${year}0731`);
  const requiredLocations = Math.ceil(REFERENCE_LOCATIONS.length * PANEL_FRACTION);
  const qualifying = new Map(dates.map(date => [
    date,
    REFERENCE_LOCATIONS.filter(location => seriesByLocation.get(location.id)?.[date] >= RAINFALL_THRESHOLD_MM_DAY).length
  ]));
  for (let index = 1; index < dates.length; index += 1) {
    if (qualifying.get(dates[index - 1]) >= requiredLocations && qualifying.get(dates[index]) >= requiredLocations) {
      return { date: dates[index], locations_required: requiredLocations };
    }
  }
  return { date: null, locations_required: requiredLocations };
}

function seasonalRainfall(year, seriesByLocation) {
  const dates = dateRange(`${year}0601`, `${year}0930`);
  const locationTotals = REFERENCE_LOCATIONS.map(location => {
    const values = dates.map(date => seriesByLocation.get(location.id)?.[date]).filter(Number.isFinite);
    return {
      location_id: location.id,
      valid_days: values.length,
      total_mm: values.length === dates.length ? values.reduce((sum, value) => sum + value, 0) : null
    };
  });
  const completeTotals = locationTotals.map(item => item.total_mm).filter(Number.isFinite);
  return {
    expected_days: dates.length,
    complete_locations: completeTotals.length,
    panel_mean_total_mm: completeTotals.length === REFERENCE_LOCATIONS.length ? mean(completeTotals) : null,
    location_totals: locationTotals
  };
}

async function main() {
  const seriesByLocation = new Map();
  const sourceLocators = [];
  for (const location of REFERENCE_LOCATIONS) {
    const url = apiUrl(location);
    const payload = await fetchJson(url);
    seriesByLocation.set(location.id, validPrecipitation(payload));
    sourceLocators.push({
      location_id: location.id,
      requested_latitude: location.latitude,
      requested_longitude: location.longitude,
      api_url: url,
      api_version: payload?.header?.api?.version || null,
      source_products: payload?.header?.sources || []
    });
  }

  const baselineYears = Array.from(
    { length: BASELINE_END_YEAR - BASELINE_START_YEAR + 1 },
    (_, index) => BASELINE_START_YEAR + index
  );
  const baseline = baselineYears.map(year => {
    const gate = rainfallGateDate(year, seriesByLocation);
    const rainfall = seasonalRainfall(year, seriesByLocation);
    return {
      year,
      rainfall_gate_date: gate.date,
      rainfall_gate_day_of_year: gate.date ? dayOfYear(gate.date) : null,
      jjas_panel_mean_total_mm: round(rainfall.panel_mean_total_mm),
      complete_locations: rainfall.complete_locations
    };
  });
  const baselineOnsets = baseline.map(item => item.rainfall_gate_day_of_year).filter(Number.isFinite);
  const baselineRainfall = baseline.map(item => item.jjas_panel_mean_total_mm).filter(Number.isFinite);
  const observedGate = rainfallGateDate(OBSERVATION_YEAR, seriesByLocation);
  const observedRainfall = seasonalRainfall(OBSERVATION_YEAR, seriesByLocation);
  const observedDay = observedGate.date ? dayOfYear(observedGate.date) : null;
  const meanOnsetDay = mean(baselineOnsets);
  const meanRainfall = mean(baselineRainfall);
  const rainfallSd = standardDeviation(baselineRainfall);

  if (baselineOnsets.length < 27 || baselineRainfall.length < 27) {
    throw new Error(`Incomplete baseline: ${baselineOnsets.length} onset years and ${baselineRainfall.length} rainfall years`);
  }
  if (!observedGate.date || observedRainfall.complete_locations !== REFERENCE_LOCATIONS.length) {
    throw new Error('Observation year lacks a rainfall-gate date or complete JJAS panel');
  }

  const record = {
    record_id: `power_indian_monsoon_rainfall_${OBSERVATION_YEAR}`,
    metric_id: METRIC_ID,
    geography: 'IMD Kerala-onset 14-location rainfall panel represented by NASA POWER grid points',
    observation_year: OBSERVATION_YEAR,
    reference_location_count: REFERENCE_LOCATIONS.length,
    complete_reference_locations: observedRainfall.complete_locations,
    rainfall_gate_threshold_mm_day: RAINFALL_THRESHOLD_MM_DAY,
    rainfall_gate_panel_fraction: PANEL_FRACTION,
    rainfall_gate_locations_required: observedGate.locations_required,
    rainfall_gate_consecutive_days: 2,
    rainfall_gate_date: observedGate.date,
    rainfall_gate_day_of_year: observedDay,
    baseline_period: `${BASELINE_START_YEAR}-${BASELINE_END_YEAR}`,
    baseline_valid_onset_years: baselineOnsets.length,
    baseline_mean_rainfall_gate_day_of_year: round(meanOnsetDay, 1),
    onset_anomaly_days: round(observedDay - meanOnsetDay, 1),
    onset_anomaly_direction: observedDay > meanOnsetDay ? 'later' : observedDay < meanOnsetDay ? 'earlier' : 'equal',
    seasonal_window: 'June-September',
    seasonal_panel_mean_rainfall_mm: round(observedRainfall.panel_mean_total_mm),
    baseline_mean_seasonal_panel_rainfall_mm: round(meanRainfall),
    seasonal_rainfall_anomaly_mm: round(observedRainfall.panel_mean_total_mm - meanRainfall),
    seasonal_rainfall_anomaly_pct: round((observedRainfall.panel_mean_total_mm - meanRainfall) / meanRainfall * 100, 1),
    seasonal_rainfall_standardized_anomaly: round((observedRainfall.panel_mean_total_mm - meanRainfall) / rainfallSd, 2),
    baseline_onset_and_rainfall: baseline,
    observation_location_totals: observedRainfall.location_totals,
    source_locator: {
      nasa_power_daily_api_docs: DOCS_URL,
      imd_onset_criteria: IMD_CRITERIA_URL,
      requests: sourceLocators
    }
  };

  const snapshot = {
    version: `power_indian_monsoon_rainfall_${OBSERVATION_YEAR}_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'NASA POWER Monsoon Rainfall Pilot',
      url: DOCS_URL,
      access: 'open_api'
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: [METRIC_ID],
    cadence: 'annual complete-season refresh after NASA POWER source replacement lag; source metadata checked monthly',
    provenance: 'NASA POWER daily PRECTOTCORR values requested at the 14 locations named in the IMD Kerala-onset rainfall criterion. The operational rainfall gate applies the published 60 percent, 2.5 mm per day, two-consecutive-day rule after 10 May. June-September station-panel mean rainfall is compared with 1991-2020.',
    uncertainty: 'NASA POWER is a gridded reanalysis-derived product, not the IMD station network. Grid assignment, precipitation bias, requested point coordinates, missing values, the station-mean aggregation, baseline, and retrospective replacement affect the result.',
    failure_behavior: 'Retain the last validated complete-season snapshot and mark stale; reject fewer than 27 complete baseline years, an incomplete observation panel, or an absent rainfall-gate date; never fill missing rainfall with zero.',
    measurement_boundary: 'This is a rainfall-gate proxy and seasonal-rainfall indicator. It is not an official IMD monsoon-onset declaration because it does not evaluate the required wind-field and outgoing-longwave-radiation criteria. It must not be compared with onset metrics using other definitions without reconciliation.',
    record_count: 1,
    records: [record]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    observation_year: OBSERVATION_YEAR,
    rainfall_gate_date: record.rainfall_gate_date,
    onset_anomaly_days: record.onset_anomaly_days,
    seasonal_rainfall_anomaly_pct: record.seasonal_rainfall_anomaly_pct,
    baseline_valid_onset_years: record.baseline_valid_onset_years
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
