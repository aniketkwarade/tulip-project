import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { strFromU8, unzipSync } from 'fflate';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'gwis-wildfire-regime-snapshot.json');
const SOURCE_ID = 'ec_jrc_global_wildfire_information_system_mcd64a1_burned_area';
const INGESTION_JOB_ID = 'fetch_gwis_wildfire_regime_metrics';
const METRIC_ID = 'gwis_non_cropland_burned_area_and_season_span';
const OBSERVATION_YEAR = 2023;
const BASELINE_START_YEAR = 2003;
const BASELINE_END_YEAR = 2022;
const SEASON_AREA_SHARE = 0.9;
const DATASET_URL = 'https://effis-gwis-cms.s3.eu-west-1.amazonaws.com/apps/country.profile/MCD64A1_burned_area_full_dataset_2002_2024.zip';
const DOWNLOAD_PAGE_URL = 'https://gwis.jrc.ec.europa.eu/apps/country.profile/downloads';
const TECHNICAL_BACKGROUND_URL = 'https://gwis.jrc.ec.europa.eu/about-gwis/technical-background/statistics';
const MCD64A1_USER_GUIDE_URL = 'https://www.earthdata.nasa.gov/s3fs-public/2025-04/MCD64_User_Guide_V61.pdf';
const CSV_FILENAME = 'MCD64A1_burned_area_full_dataset_2002_2024.csv';
const COUNTRIES = new Set(['AUS', 'BRA', 'CAN', 'COD', 'IDN', 'RUS', 'USA', 'ZAF']);
const MONTH_NAMES = Object.freeze(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);

const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

function quantile(values, probability) {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function shortestCircularSeason(monthlyValues, share = SEASON_AREA_SHARE) {
  const total = monthlyValues.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) return null;
  const target = total * share;
  let best = null;
  for (let start = 0; start < 12; start += 1) {
    let accumulated = 0;
    for (let length = 1; length <= 12; length += 1) {
      accumulated += monthlyValues[(start + length - 1) % 12];
      if (accumulated < target) continue;
      const candidate = { start, length, captured: accumulated };
      if (!best || candidate.length < best.length || (candidate.length === best.length && candidate.captured > best.captured)) best = candidate;
      break;
    }
  }
  const end = (best.start + best.length - 1) % 12;
  return {
    span_months: best.length,
    start_month: best.start + 1,
    start_month_name: MONTH_NAMES[best.start],
    end_month: end + 1,
    end_month_name: MONTH_NAMES[end],
    crosses_calendar_year: end < best.start,
    captured_area_share_pct: round(best.captured / total * 100, 1)
  };
}

function emptyMonth() {
  return { forest: 0, savannas: 0, shrublands_grasslands: 0, croplands: 0, other: 0 };
}

async function fetchArchive() {
  const response = await fetch(DATASET_URL, { signal: AbortSignal.timeout(180_000) });
  if (!response.ok) throw new Error(`GWIS burned-area download failed: ${response.status} ${response.statusText}`);
  return new Uint8Array(await response.arrayBuffer());
}

function parseAndAggregate(csvText) {
  const lines = csvText.split(/\r?\n/);
  const header = lines.shift()?.replaceAll('"', '').split(';') || [];
  const expectedHeader = ['year', 'month', 'gid_0', 'country', 'gid_1', 'region', 'forest', 'savannas', 'shrublands_grasslands', 'croplands', 'other'];
  if (header.join('|') !== expectedHeader.join('|')) throw new Error(`Unexpected GWIS schema: ${header.join(', ')}`);

  const countries = new Map();
  const worldYears = new Map();
  const worldCountryCodesByYear = new Map();
  const worldMonthsByYear = new Map();
  let parsedRows = 0;
  let selectedRows = 0;
  for (const line of lines) {
    if (!line) continue;
    parsedRows += 1;
    const columns = line.split(';');
    if (columns.length !== expectedHeader.length) throw new Error(`Unexpected GWIS row width at source row ${parsedRows + 1}`);
    const [yearRaw, monthRaw, iso3, countryName, , , ...areaRaw] = columns;
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const areas = areaRaw.map(Number);
    if (!Number.isInteger(year) || month < 1 || month > 12 || areas.some(value => !Number.isFinite(value) || value < 0)) {
      throw new Error(`Invalid GWIS value for ${iso3}, ${yearRaw}-${monthRaw}`);
    }
    if (!worldYears.has(year)) worldYears.set(year, Array.from({ length: 12 }, emptyMonth));
    const worldAggregate = worldYears.get(year)[month - 1];
    expectedHeader.slice(6).forEach((field, index) => { worldAggregate[field] += areas[index]; });
    if (!worldCountryCodesByYear.has(year)) worldCountryCodesByYear.set(year, new Set());
    worldCountryCodesByYear.get(year).add(iso3);
    if (!worldMonthsByYear.has(year)) worldMonthsByYear.set(year, new Set());
    worldMonthsByYear.get(year).add(month);

    if (!COUNTRIES.has(iso3)) continue;
    selectedRows += 1;
    if (!countries.has(iso3)) countries.set(iso3, { country_name: countryName, years: new Map() });
    const country = countries.get(iso3);
    if (!country.years.has(year)) country.years.set(year, Array.from({ length: 12 }, emptyMonth));
    const aggregate = country.years.get(year)[month - 1];
    expectedHeader.slice(6).forEach((field, index) => { aggregate[field] += areas[index]; });
  }
  if (countries.size !== COUNTRIES.size) throw new Error(`Expected ${COUNTRIES.size} countries, received ${countries.size}`);
  return { countries, worldYears, worldCountryCodesByYear, worldMonthsByYear, parsedRows, selectedRows };
}

function summarizeYear(months) {
  const monthly = months.map((values, index) => {
    const nonCropland = values.forest + values.savannas + values.shrublands_grasslands + values.other;
    const allLandcover = nonCropland + values.croplands;
    return {
      month: index + 1,
      month_name: MONTH_NAMES[index],
      forest_burned_area_ha: round(values.forest),
      savanna_burned_area_ha: round(values.savannas),
      shrubland_grassland_burned_area_ha: round(values.shrublands_grasslands),
      cropland_burned_area_ha: round(values.croplands),
      other_burned_area_ha: round(values.other),
      non_cropland_burned_area_ha: round(nonCropland),
      all_landcover_burned_area_ha: round(allLandcover)
    };
  });
  const nonCroplandValues = monthly.map(item => item.non_cropland_burned_area_ha);
  return {
    non_cropland_burned_area_ha: round(nonCroplandValues.reduce((sum, value) => sum + value, 0)),
    cropland_burned_area_ha: round(monthly.reduce((sum, item) => sum + item.cropland_burned_area_ha, 0)),
    all_landcover_burned_area_ha: round(monthly.reduce((sum, item) => sum + item.all_landcover_burned_area_ha, 0)),
    season: shortestCircularSeason(nonCroplandValues),
    monthly
  };
}

async function main() {
  const archive = unzipSync(await fetchArchive());
  const csvBytes = archive[CSV_FILENAME];
  if (!csvBytes) throw new Error(`GWIS archive does not contain ${CSV_FILENAME}`);
  const { countries, worldYears, worldCountryCodesByYear, worldMonthsByYear, parsedRows, selectedRows } = parseAndAggregate(strFromU8(csvBytes));

  const globalAnnualTimeSeries = [...worldYears.entries()]
    .filter(([year]) => year <= OBSERVATION_YEAR)
    .map(([year, months]) => {
      if (worldMonthsByYear.get(year)?.size !== 12) throw new Error(`GWIS global series is missing months in ${year}.`);
      const summary = summarizeYear(months);
      return {
        record_id: `gwis_mcd64a1_WORLD_${year}`,
        node_id: 'wildfire_regime_shift',
        metric_id: METRIC_ID,
        geography: 'World aggregate derived from all source GADM level 1 rows',
        observation_year: year,
        non_cropland_burned_area_ha: summary.non_cropland_burned_area_ha,
        cropland_burned_area_ha: summary.cropland_burned_area_ha,
        all_landcover_burned_area_ha: summary.all_landcover_burned_area_ha,
        season_span_months: summary.season?.span_months ?? null,
        season_start_month: summary.season?.start_month ?? null,
        season_end_month: summary.season?.end_month ?? null,
        countries_or_territories_reporting: worldCountryCodesByYear.get(year)?.size ?? 0,
        source_locator: `${DATASET_URL}; ${CSV_FILENAME}; all GADM level 1 rows summed for ${year}`
      };
    })
    .sort((left, right) => left.observation_year - right.observation_year);
  if (globalAnnualTimeSeries.length < 20) throw new Error(`GWIS global history has only ${globalAnnualTimeSeries.length} complete years.`);

  const records = [...countries.entries()].map(([iso3, country]) => {
    const observationMonths = country.years.get(OBSERVATION_YEAR);
    if (!observationMonths) throw new Error(`GWIS has no ${OBSERVATION_YEAR} data for ${iso3}`);
    const observation = summarizeYear(observationMonths);
    const baseline = [];
    for (let year = BASELINE_START_YEAR; year <= BASELINE_END_YEAR; year += 1) {
      const months = country.years.get(year);
      if (!months) throw new Error(`GWIS baseline is missing ${iso3} ${year}`);
      baseline.push({ year, ...summarizeYear(months) });
    }
    const baselineAreas = baseline.map(item => item.non_cropland_burned_area_ha);
    const baselineSpans = baseline.map(item => item.season?.span_months).filter(Number.isFinite);
    const baselineMeanArea = baselineAreas.reduce((sum, value) => sum + value, 0) / baselineAreas.length;
    const baselineMeanSpan = baselineSpans.reduce((sum, value) => sum + value, 0) / baselineSpans.length;
    return {
      record_id: `gwis_mcd64a1_${iso3}_${OBSERVATION_YEAR}`,
      country_code: iso3,
      country_name: country.country_name,
      observation_year: OBSERVATION_YEAR,
      source_spatial_grain: 'GADM level 1 rows aggregated to GADM level 0 country',
      observation_non_cropland_burned_area_ha: observation.non_cropland_burned_area_ha,
      observation_cropland_burned_area_ha: observation.cropland_burned_area_ha,
      observation_all_landcover_burned_area_ha: observation.all_landcover_burned_area_ha,
      baseline_period: `${BASELINE_START_YEAR}-${BASELINE_END_YEAR}`,
      baseline_mean_non_cropland_burned_area_ha: round(baselineMeanArea),
      baseline_p05_non_cropland_burned_area_ha: round(quantile(baselineAreas, 0.05)),
      baseline_p95_non_cropland_burned_area_ha: round(quantile(baselineAreas, 0.95)),
      burned_area_anomaly_ha: round(observation.non_cropland_burned_area_ha - baselineMeanArea),
      burned_area_anomaly_pct: baselineMeanArea > 0 ? round((observation.non_cropland_burned_area_ha - baselineMeanArea) / baselineMeanArea * 100, 1) : null,
      season_definition: `shortest circular run of calendar months containing at least ${SEASON_AREA_SHARE * 100}% of annual non-cropland burned area`,
      observation_season_span_months: observation.season.span_months,
      observation_season_start_month: observation.season.start_month,
      observation_season_end_month: observation.season.end_month,
      observation_season_crosses_calendar_year: observation.season.crosses_calendar_year,
      baseline_mean_season_span_months: round(baselineMeanSpan, 1),
      season_span_anomaly_months: round(observation.season.span_months - baselineMeanSpan, 1),
      monthly_values: observation.monthly,
      source_locator: {
        dataset_url: DATASET_URL,
        download_page_url: DOWNLOAD_PAGE_URL,
        technical_background_url: TECHNICAL_BACKGROUND_URL,
        mcd64a1_user_guide_url: MCD64A1_USER_GUIDE_URL,
        archive_member: CSV_FILENAME,
        source_columns: ['year', 'month', 'gid_0', 'country', 'gid_1', 'region', 'forest', 'savannas', 'shrublands_grasslands', 'croplands', 'other']
      }
    };
  }).sort((a, b) => a.country_code.localeCompare(b.country_code));

  const snapshot = {
    version: 'gwis_mcd64a1_country_and_global_wildfire_regime_v2',
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'European Commission JRC Global Wildfire Information System — MCD64A1 Burned Area',
      url: DOWNLOAD_PAGE_URL,
      dataset_url: DATASET_URL,
      product: 'MODIS/Terra+Aqua MCD64A1 Collection 6.1 monthly burned area, aggregated by GWIS'
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: [METRIC_ID],
    cadence: 'annual complete-year refresh after the GWIS dataset release',
    provenance: `Official GWIS country-profile CSV derived from NASA MCD64A1 monthly 500 m burned-area pixels; ${OBSERVATION_YEAR} country totals are aggregated from source GADM level 1 rows and compared with a fixed ${BASELINE_START_YEAR}-${BASELINE_END_YEAR} baseline. The archive's 2024 partition is excluded because all 43,320 source rows contain zero area.`,
    uncertainty: 'MCD64A1 cloud and observation gaps, 500 m resolution, small-fire omission, land-cover classification, GADM boundaries, fire-type attribution, managed burning, dataset revisions, and monthly temporal grain affect the metric.',
    failure_behavior: 'Retain the last validated complete-year snapshot and mark stale; reject schema or country/month coverage changes; never convert active-fire hotspot counts to hectares or label all mapped burning as wildfire.',
    boundary: 'This is satellite-mapped non-cropland burned area, not a complete wildfire inventory. Excluding cropland reduces agricultural-burning contamination but does not remove prescribed fire, pasture burning, land clearing, peat fire, or classification error. The 90-percent season span is a transparent monthly concentration proxy, not observed active-fire days or ecological severity.',
    excluded_source_partitions: [
      { year: 2024, source_rows: 43320, reason: 'all source land-cover burned-area fields are zero; withheld as an incomplete or placeholder partition rather than interpreted as no fire' }
    ],
    source_rows_parsed: parsedRows,
    selected_source_rows: selectedRows,
    global_time_series: globalAnnualTimeSeries,
    record_count: records.length,
    records
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    records: records.length,
    countries: records.map(record => record.country_code),
    global_history_years: globalAnnualTimeSeries.length,
    global_history_end: globalAnnualTimeSeries.at(-1).observation_year
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
