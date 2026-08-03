import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'power-heat-hazard-snapshot.json');
const SOURCE_ID = 'nasa_power_open_api';
const INGESTION_JOB_ID = 'fetch_power_heat_hazard_metrics';
const DOCS_URL = 'https://power.larc.nasa.gov/docs/services/api/';
const BASELINE_START = '19910101';
const BASELINE_END = '20201231';
const OBSERVATION_YEAR = 2025;
const OBSERVATION_START = `${OBSERVATION_YEAR}0101`;
const OBSERVATION_END = `${OBSERVATION_YEAR}1231`;
const WET_BULB_THRESHOLDS_C = [26, 28, 30, 32, 35];
const VPD_THRESHOLDS_KPA = [1, 2, 3];
const LOCATIONS = Object.freeze([
  { id: 'vancouver', name: 'Vancouver, Canada', continent: 'North America', latitude: 49.2827, longitude: -123.1207 },
  { id: 'chicago', name: 'Chicago, United States', continent: 'North America', latitude: 41.8781, longitude: -87.6298 },
  { id: 'kolkata', name: 'Kolkata, India', continent: 'Asia', latitude: 22.5726, longitude: 88.3639 },
  { id: 'lagos', name: 'Lagos, Nigeria', continent: 'Africa', latitude: 6.5244, longitude: 3.3792 },
  { id: 'singapore', name: 'Singapore', continent: 'Asia', latitude: 1.3521, longitude: 103.8198 },
  { id: 'houston', name: 'Houston, United States', continent: 'North America', latitude: 29.7604, longitude: -95.3698 },
  { id: 'mexico_city', name: 'Mexico City, Mexico', continent: 'North America', latitude: 19.4326, longitude: -99.1332 },
  { id: 'manaus', name: 'Manaus, Brazil', continent: 'South America', latitude: -3.119, longitude: -60.0217 },
  { id: 'brasilia', name: 'Brasilia, Brazil', continent: 'South America', latitude: -15.7939, longitude: -47.8828 },
  { id: 'lima', name: 'Lima, Peru', continent: 'South America', latitude: -12.0464, longitude: -77.0428 },
  { id: 'buenos_aires', name: 'Buenos Aires, Argentina', continent: 'South America', latitude: -34.6037, longitude: -58.3816 },
  { id: 'london', name: 'London, United Kingdom', continent: 'Europe', latitude: 51.5072, longitude: -0.1276 },
  { id: 'madrid', name: 'Madrid, Spain', continent: 'Europe', latitude: 40.4168, longitude: -3.7038 },
  { id: 'moscow', name: 'Moscow, Russia', continent: 'Europe', latitude: 55.7558, longitude: 37.6173 },
  { id: 'cairo', name: 'Cairo, Egypt', continent: 'Africa', latitude: 30.0444, longitude: 31.2357 },
  { id: 'dakar', name: 'Dakar, Senegal', continent: 'Africa', latitude: 14.7167, longitude: -17.4677 },
  { id: 'nairobi', name: 'Nairobi, Kenya', continent: 'Africa', latitude: -1.2921, longitude: 36.8219 },
  { id: 'johannesburg', name: 'Johannesburg, South Africa', continent: 'Africa', latitude: -26.2041, longitude: 28.0473 },
  { id: 'delhi', name: 'Delhi, India', continent: 'Asia', latitude: 28.6139, longitude: 77.209 },
  { id: 'bangkok', name: 'Bangkok, Thailand', continent: 'Asia', latitude: 13.7563, longitude: 100.5018 },
  { id: 'beijing', name: 'Beijing, China', continent: 'Asia', latitude: 39.9042, longitude: 116.4074 },
  { id: 'tokyo', name: 'Tokyo, Japan', continent: 'Asia', latitude: 35.6762, longitude: 139.6503 },
  { id: 'jakarta', name: 'Jakarta, Indonesia', continent: 'Asia', latitude: -6.2088, longitude: 106.8456 },
  { id: 'sydney', name: 'Sydney, Australia', continent: 'Oceania', latitude: -33.8688, longitude: 151.2093 }
]);

const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

function quantile(values, probability) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function apiUrl(temporal, location, parameters, start, end) {
  const query = new URLSearchParams({
    parameters: parameters.join(','),
    community: 'RE',
    longitude: String(location.longitude),
    latitude: String(location.latitude),
    start,
    end,
    format: 'JSON',
    'time-standard': 'UTC'
  });
  return `https://power.larc.nasa.gov/api/temporal/${temporal}/point?${query}`;
}

async function fetchJson(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(120_000) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error(`NASA POWER request failed for ${url}: ${lastError?.message || 'unknown error'}`);
}

function validSeries(payload, parameter) {
  const fill = payload?.header?.fill_value ?? -999;
  return Object.entries(payload?.properties?.parameter?.[parameter] || {})
    .map(([time, value]) => ({ time, value: Number(value) }))
    .filter(item => Number.isFinite(item.value) && item.value !== fill);
}

function byTime(series) {
  return new Map(series.map(item => [item.time, item.value]));
}

function saturationVapourPressureKpa(temperatureC) {
  return 0.6108 * Math.exp((17.27 * temperatureC) / (temperatureC + 237.3));
}

function consecutiveRunSummary(days, minimumRunLength = 2) {
  const sorted = [...days].sort();
  const runs = [];
  let current = [];
  for (const day of sorted) {
    if (!current.length) {
      current = [day];
      continue;
    }
    const previous = current.at(-1);
    const previousDate = new Date(`${previous.slice(0, 4)}-${previous.slice(4, 6)}-${previous.slice(6, 8)}T00:00:00Z`);
    const currentDate = new Date(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}T00:00:00Z`);
    if ((currentDate - previousDate) / 86_400_000 === 1) current.push(day);
    else {
      if (current.length >= minimumRunLength) runs.push(current);
      current = [day];
    }
  }
  if (current.length >= minimumRunLength) runs.push(current);
  return { events: runs.length, days: runs.reduce((sum, run) => sum + run.length, 0) };
}

async function fetchLocation(location) {
  const hourlyUrl = apiUrl('hourly', location, ['T2MWET', 'T2M', 'RH2M'], OBSERVATION_START, OBSERVATION_END);
  const dailyUrl = apiUrl('daily', location, ['T2M_MAX', 'T2M_MIN', 'T2M', 'RH2M', 'PRECTOTCORR', 'PW'], BASELINE_START, OBSERVATION_END);
  const hourly = await fetchJson(hourlyUrl);
  const daily = await fetchJson(dailyUrl);

  const hourlyWetBulb = validSeries(hourly, 'T2MWET');
  const hourlyTemperature = byTime(validSeries(hourly, 'T2M'));
  const hourlyRelativeHumidity = byTime(validSeries(hourly, 'RH2M'));
  const hourlyVpd = [...hourlyTemperature.entries()]
    .filter(([time, temperature]) => Number.isFinite(temperature) && hourlyRelativeHumidity.has(time))
    .map(([time, temperature]) => {
      const relativeHumidity = hourlyRelativeHumidity.get(time);
      const saturation = saturationVapourPressureKpa(temperature);
      return { time, value: Math.max(0, saturation * (1 - relativeHumidity / 100)) };
    })
    .filter(item => Number.isFinite(item.value));
  const expectedHours = 365 * 24;
  const allTemperature = validSeries(daily, 'T2M_MAX');
  const allMinimumTemperature = validSeries(daily, 'T2M_MIN');
  const allMeanTemperatureByTime = byTime(validSeries(daily, 'T2M'));
  const allDailyRelativeHumidityByTime = byTime(validSeries(daily, 'RH2M'));
  const allDailyVpd = [...allMeanTemperatureByTime.entries()]
    .filter(([time, temperature]) => Number.isFinite(temperature) && allDailyRelativeHumidityByTime.has(time))
    .map(([time, temperature]) => ({
      time,
      value: Math.max(0, saturationVapourPressureKpa(temperature) * (1 - allDailyRelativeHumidityByTime.get(time) / 100))
    }));
  const allPrecipitation = validSeries(daily, 'PRECTOTCORR');
  const allPrecipitableWater = validSeries(daily, 'PW');
  const baselineTemperature = allTemperature
    .filter(item => item.time >= BASELINE_START && item.time <= BASELINE_END);
  const baselinePrecipitation = allPrecipitation
    .filter(item => item.time >= BASELINE_START && item.time <= BASELINE_END);
  const baselinePrecipitableWater = allPrecipitableWater
    .filter(item => item.time >= BASELINE_START && item.time <= BASELINE_END);
  const currentTemperature = byTime(allTemperature
    .filter(item => item.time >= OBSERVATION_START && item.time <= OBSERVATION_END));
  const currentPrecipitationSeries = allPrecipitation
    .filter(item => item.time >= OBSERVATION_START && item.time <= OBSERVATION_END);
  const currentPrecipitation = byTime(currentPrecipitationSeries);
  const currentPrecipitableWater = allPrecipitableWater
    .filter(item => item.time >= OBSERVATION_START && item.time <= OBSERVATION_END);
  const temperatureThreshold = quantile(baselineTemperature.map(item => item.value), 0.95);
  const minimumTemperatureThreshold = quantile(allMinimumTemperature
    .filter(item => item.time >= BASELINE_START && item.time <= BASELINE_END)
    .map(item => item.value), 0.95);
  const precipitationThreshold = quantile(baselinePrecipitation.map(item => item.value), 0.95);
  const baselineAnnualPrecipitationMaxima = [...baselinePrecipitation.reduce((groups, item) => {
    const year = item.time.slice(0, 4);
    const previous = groups.get(year);
    if (!previous || item.value > previous) groups.set(year, item.value);
    return groups;
  }, new Map()).entries()].map(([year, value]) => ({ year: Number(year), value }));
  const baselineMeanAnnualMaximum = mean(baselineAnnualPrecipitationMaxima.map(item => item.value));
  const baselineAnnualMeanPrecipitableWater = [...baselinePrecipitableWater.reduce((groups, item) => {
    const year = item.time.slice(0, 4);
    const values = groups.get(year) || [];
    values.push(item.value * 10);
    groups.set(year, values);
    return groups;
  }, new Map()).entries()].map(([year, values]) => ({ year: Number(year), value: mean(values) }));
  const annualMeanPrecipitableWater = [...allPrecipitableWater.reduce((groups, item) => {
    const year = item.time.slice(0, 4);
    const values = groups.get(year) || [];
    values.push(item.value * 10);
    groups.set(year, values);
    return groups;
  }, new Map()).entries()].map(([year, values]) => ({ year: Number(year), value: mean(values) }));
  const annualMaximumPrecipitation = [...allPrecipitation.reduce((groups, item) => {
    const year = item.time.slice(0, 4);
    const previous = groups.get(year);
    if (!previous || item.value > previous) groups.set(year, item.value);
    return groups;
  }, new Map()).entries()].map(([year, value]) => ({ year: Number(year), value }));
  const annualMeanDailyVpd = [...allDailyVpd.reduce((groups, item) => {
    const year = item.time.slice(0, 4);
    const values = groups.get(year) || [];
    values.push(item.value);
    groups.set(year, values);
    return groups;
  }, new Map()).entries()].map(([year, values]) => ({ year: Number(year), value: mean(values) }));
  const baselineMeanColumnWaterVapour = mean(baselineAnnualMeanPrecipitableWater.map(item => item.value));
  const observationMeanColumnWaterVapour = mean(currentPrecipitableWater.map(item => item.value * 10));
  const currentMaximumPrecipitation = currentPrecipitationSeries.reduce((maximum, item) => (
    !maximum || item.value > maximum.value ? item : maximum
  ), null);
  const heavyPrecipitationDays = currentPrecipitationSeries.filter(item => item.value >= precipitationThreshold);
  const completeCurrentDays = [...currentTemperature.keys()].filter(day => currentPrecipitation.has(day));
  const compoundDays = completeCurrentDays.filter(day => (
    currentTemperature.get(day) >= temperatureThreshold
    && currentPrecipitation.get(day) >= precipitationThreshold
  ));
  const allTemperatureByTime = byTime(allTemperature);
  const allPrecipitationByTime = byTime(allPrecipitation);
  const compoundAnnualCounts = [...allTemperatureByTime.keys()].reduce((groups, day) => {
    if (!allPrecipitationByTime.has(day)) return groups;
    const year = Number(day.slice(0, 4));
    const previous = groups.get(year) || 0;
    if (allTemperatureByTime.get(day) >= temperatureThreshold && allPrecipitationByTime.get(day) >= precipitationThreshold) {
      groups.set(year, previous + 1);
    } else if (!groups.has(year)) {
      groups.set(year, 0);
    }
    return groups;
  }, new Map());
  const allMinimumTemperatureByTime = byTime(allMinimumTemperature);
  const warmNightAnnualDays = new Map();
  const compoundDayNightDatesByYear = new Map();
  for (const [day, minimumTemperature] of allMinimumTemperatureByTime) {
    const year = Number(day.slice(0, 4));
    if (minimumTemperature >= minimumTemperatureThreshold) {
      warmNightAnnualDays.set(year, (warmNightAnnualDays.get(year) || 0) + 1);
      if (allTemperatureByTime.get(day) >= temperatureThreshold) {
        const days = compoundDayNightDatesByYear.get(year) || [];
        days.push(day);
        compoundDayNightDatesByYear.set(year, days);
      }
    } else if (!warmNightAnnualDays.has(year)) {
      warmNightAnnualDays.set(year, 0);
    }
  }
  const compoundDayNightAnnualSeries = [...warmNightAnnualDays.keys()].map(year => ({
    year,
    ...consecutiveRunSummary(compoundDayNightDatesByYear.get(year) || [])
  }));

  const wetBulbValues = hourlyWetBulb.map(item => item.value);
  const thresholdHours = Object.fromEntries(WET_BULB_THRESHOLDS_C.map(threshold => [
    `hours_ge_${threshold}c`,
    wetBulbValues.filter(value => value >= threshold).length
  ]));
  const vpdValues = hourlyVpd.map(item => item.value);
  const vpdThresholdHours = Object.fromEntries(VPD_THRESHOLDS_KPA.map(threshold => [
    `vpd_hours_ge_${threshold}kpa`,
    vpdValues.filter(value => value >= threshold).length
  ]));

  return {
    record_id: `power_heat_hazard_${location.id}_${OBSERVATION_YEAR}`,
    location_id: location.id,
    location_name: location.name,
    continent: location.continent,
    latitude: location.latitude,
    longitude: location.longitude,
    observation_year: OBSERVATION_YEAR,
    time_standard: hourly?.header?.time_standard || 'UTC',
    meteorology_resolution: '0.5 x 0.625 degree source-native meteorology grid',
    wet_bulb_parameter: 'T2MWET',
    valid_wet_bulb_hours: hourlyWetBulb.length,
    hourly_completeness_pct: round(hourlyWetBulb.length / expectedHours * 100, 1),
    maximum_wet_bulb_c: round(Math.max(...wetBulbValues)),
    wet_bulb_p95_c: round(quantile(wetBulbValues, 0.95)),
    ...thresholdHours,
    vpd_parameter_inputs: ['T2M', 'RH2M'],
    vpd_formula: '0.6108 * exp(17.27*T/(T+237.3)) * (1-RH/100)',
    valid_vpd_hours: hourlyVpd.length,
    vpd_hourly_completeness_pct: round(hourlyVpd.length / expectedHours * 100, 1),
    mean_vapour_pressure_deficit_kpa: round(mean(vpdValues), 3),
    vapour_pressure_deficit_p95_kpa: round(quantile(vpdValues, 0.95), 3),
    maximum_vapour_pressure_deficit_kpa: round(Math.max(...vpdValues), 3),
    ...vpdThresholdHours,
    annual_mean_daily_vapour_pressure_deficit_series: annualMeanDailyVpd.map(item => ({
      year: item.year,
      value_kpa: round(item.value, 4)
    })),
    precipitable_water_parameter: 'PW',
    precipitable_water_source_unit: 'centimetres water equivalent',
    column_water_vapour_output_unit: 'kilograms per square metre',
    valid_column_water_vapour_days: currentPrecipitableWater.length,
    column_water_vapour_daily_completeness_pct: round(currentPrecipitableWater.length / 365 * 100, 1),
    baseline_annual_mean_column_water_vapour_years: baselineAnnualMeanPrecipitableWater.length,
    baseline_annual_mean_column_water_vapour_series: baselineAnnualMeanPrecipitableWater.map(item => ({
      year: item.year,
      value_kg_m2: round(item.value, 3)
    })),
    annual_mean_column_water_vapour_series: annualMeanPrecipitableWater.map(item => ({
      year: item.year,
      value_kg_m2: round(item.value, 3)
    })),
    baseline_mean_column_water_vapour_kg_m2: round(baselineMeanColumnWaterVapour, 3),
    baseline_p05_annual_mean_column_water_vapour_kg_m2: round(quantile(baselineAnnualMeanPrecipitableWater.map(item => item.value), 0.05), 3),
    baseline_p95_annual_mean_column_water_vapour_kg_m2: round(quantile(baselineAnnualMeanPrecipitableWater.map(item => item.value), 0.95), 3),
    observation_mean_column_water_vapour_kg_m2: round(observationMeanColumnWaterVapour, 3),
    column_water_vapour_anomaly_kg_m2: round(observationMeanColumnWaterVapour - baselineMeanColumnWaterVapour, 3),
    column_water_vapour_anomaly_pct: round((observationMeanColumnWaterVapour - baselineMeanColumnWaterVapour) / baselineMeanColumnWaterVapour * 100, 2),
    compound_hazard_pair: 'daily maximum 2 m temperature plus corrected daily precipitation',
    compound_baseline_start: '1991-01-01',
    compound_baseline_end: '2020-12-31',
    threshold_percentile: 95,
    temperature_threshold_c: round(temperatureThreshold),
    minimum_temperature_threshold_c: round(minimumTemperatureThreshold),
    precipitation_threshold_mm_day: round(precipitationThreshold),
    extreme_precipitation_metric: 'annual maximum corrected daily precipitation anomaly relative to the mean annual maximum over 1991-2020',
    baseline_annual_maximum_years: baselineAnnualPrecipitationMaxima.length,
    baseline_annual_maximum_precipitation_series: baselineAnnualPrecipitationMaxima.map(item => ({
      year: item.year,
      value_mm_day: round(item.value, 2)
    })),
    annual_maximum_precipitation_series: annualMaximumPrecipitation.map(item => ({
      year: item.year,
      value_mm_day: round(item.value, 2)
    })),
    baseline_mean_annual_maximum_precipitation_mm_day: round(baselineMeanAnnualMaximum),
    baseline_p05_annual_maximum_precipitation_mm_day: round(quantile(baselineAnnualPrecipitationMaxima.map(item => item.value), 0.05)),
    baseline_p95_annual_maximum_precipitation_mm_day: round(quantile(baselineAnnualPrecipitationMaxima.map(item => item.value), 0.95)),
    observation_annual_maximum_precipitation_mm_day: round(currentMaximumPrecipitation?.value),
    observation_annual_maximum_precipitation_date: currentMaximumPrecipitation?.time || null,
    annual_maximum_precipitation_anomaly_mm_day: round(currentMaximumPrecipitation?.value - baselineMeanAnnualMaximum),
    annual_maximum_precipitation_anomaly_pct: round((currentMaximumPrecipitation?.value - baselineMeanAnnualMaximum) / baselineMeanAnnualMaximum * 100, 1),
    heavy_precipitation_days_ge_baseline_p95: heavyPrecipitationDays.length,
    heavy_precipitation_day_dates: heavyPrecipitationDays.map(item => item.time),
    valid_compound_hazard_days: completeCurrentDays.length,
    daily_completeness_pct: round(completeCurrentDays.length / 365 * 100, 1),
    compound_hot_heavy_precip_days: compoundDays.length,
    compound_day_dates: compoundDays,
    compound_hot_heavy_precip_annual_series: [...compoundAnnualCounts.entries()].map(([year, days]) => ({ year, days })),
    warm_night_annual_series: [...warmNightAnnualDays.entries()].map(([year, nights]) => ({ year, nights })),
    compound_hot_day_night_annual_series: compoundDayNightAnnualSeries,
    source_locator: {
      hourly_api_url: hourlyUrl,
      daily_api_url: dailyUrl,
      docs_url: DOCS_URL,
      hourly_api_version: hourly?.header?.api?.version || null,
      daily_api_version: daily?.header?.api?.version || null,
      sources: [...new Set([...(hourly?.header?.sources || []), ...(daily?.header?.sources || [])])]
    }
  };
}

async function main() {
  const records = [];
  const concurrency = 4;
  for (let index = 0; index < LOCATIONS.length; index += concurrency) {
    records.push(...await Promise.all(LOCATIONS.slice(index, index + concurrency).map(fetchLocation)));
  }

  const snapshot = {
    version: `power_heat_hazard_${OBSERVATION_YEAR}_global_sentinel_v5`,
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'NASA POWER Open API',
      url: 'https://power.larc.nasa.gov/',
      docs_url: DOCS_URL,
      access: 'open_api'
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: ['wet_bulb_temperature_exceedance_hours', 'vapour_pressure_deficit', 'column_water_vapour_anomaly', 'compound_climate_hazard_days', 'power_annual_max_daily_precipitation_anomaly', 'warm_night_threshold_exceedance', 'compound_hot_day_night_events'],
    cadence: 'annual refresh after NASA POWER climate-quality replacement lag; source metadata checked monthly',
    provenance: 'NASA POWER source-native hourly T2MWET, T2M and RH2M plus daily T2M_MAX, T2M_MIN, T2M, RH2M, PRECTOTCORR and PW point products, UTC, using a fixed 1991-2020 baseline and the complete 2025 observation year at a fixed 24-location sentinel panel spanning six inhabited continents. Vapour-pressure deficit is derived only from co-timed temperature and relative humidity with the declared saturation-vapour-pressure formula. Source PW in centimetres water equivalent is converted by the physical identity 1 centimetre water equals 10 kilograms per square metre, then compared with annual baseline means. Extreme precipitation is represented by annual maximum corrected daily precipitation relative to the mean of baseline annual maxima, with daily-P95 exceedance counts retained separately. Warm nights count daily minima above the local baseline P95; compound day-night heat counts only days belonging to runs of at least two consecutive days with both daily maximum and minimum above their local baseline P95 thresholds.',
    uncertainty: 'NASA POWER is gridded reanalysis-derived data rather than a station or personal exposure measure. The fixed sentinel panel is geographically distributed but is not an area- or population-weighted global mean. Meteorological resolution, source replacement within two to three months of near-real-time, point-to-grid assignment, percentile choice, and the selected hazard pair affect interpretation.',
    failure_behavior: 'Retain the last validated complete-year snapshot and mark stale. Withhold a location when hourly or daily completeness is below 95 percent; never treat missing hours or days as non-events.',
    measurement_boundary: 'Wet-bulb records are source-native thermodynamic T2MWET, not WBGT. Vapour-pressure deficit is a gridded near-surface atmospheric-demand indicator derived from T2M and RH2M, not plant water stress, drought impact, leaf-level deficit or a universal hazard threshold. Precipitable water is total-column water vapour above a grid cell, not relative humidity, near-surface humidity, realized precipitation, moisture convergence, or proof of anthropogenic amplification. Compound-hazard records count only same-day local 95th-percentile heat and precipitation co-occurrence. Extreme-precipitation records are a bounded daily gridded pilot, not sub-daily rainfall intensity, gauge extremes, flood impact, or a universal risk index.',
    baseline_period: { start: '1991-01-01', end: '2020-12-31' },
    observation_period: { start: `${OBSERVATION_YEAR}-01-01`, end: `${OBSERVATION_YEAR}-12-31` },
    location_count: LOCATIONS.length,
    aggregation_boundary: 'Fixed 24-location sentinel panel spanning North America, South America, Europe, Africa, Asia and Oceania; equal-location summaries only.',
    record_count: records.length,
    records
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    records: records.length,
    metric_contract_ids: snapshot.metric_contract_ids,
    observation_year: OBSERVATION_YEAR
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
