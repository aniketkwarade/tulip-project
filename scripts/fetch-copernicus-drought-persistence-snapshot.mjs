import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'copernicus-drought-persistence-snapshot.json');
const SOURCE_ID = 'copernicus_european_and_global_drought_observatories';
const INGESTION_JOB_ID = 'fetch_copernicus_drought_persistence';
const OBSERVATION_YEAR = 2025;
const SPI_TIMESCALE_MONTHS = 6;
const DROUGHT_THRESHOLD = -1;
const DATASET_VERSION = '2-0-0';
const DATASET_URL = `https://drought.emergency.copernicus.eu/data/Drought_Observatories_datasets/GDO_ERA5_Standardized_Precipitation_Index_SPI6/ver${DATASET_VERSION}/spa06_m_gdo_${OBSERVATION_YEAR}0101_${OBSERVATION_YEAR}1201_m.nc`;
const DOCS_URL = 'https://joint-research-centre.ec.europa.eu/european-and-global-drought-observatories/drought-indicators_en';
const WCS_URL = 'https://drought.emergency.copernicus.eu/data/wcs-service';
const FACTSHEET_URL = 'https://drought.emergency.copernicus.eu/data/factsheets/factsheet_spi.pdf';
const LOCATIONS = Object.freeze([
  { id: 'kolkata', name: 'Kolkata, India', latitude: 22.5726, longitude: 88.3639 },
  { id: 'lagos', name: 'Lagos, Nigeria', latitude: 6.5244, longitude: 3.3792 },
  { id: 'singapore', name: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { id: 'houston', name: 'Houston, United States', latitude: 29.7604, longitude: -95.3698 },
  { id: 'madrid', name: 'Madrid, Spain', latitude: 40.4168, longitude: -3.7038 },
  { id: 'cape_town', name: 'Cape Town, South Africa', latitude: -33.9249, longitude: 18.4241 }
]);

const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

function nearestIndex(values, target) {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < values.length; index += 1) {
    const distance = Math.abs(values[index] - target);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  }
  return bestIndex;
}

function longestConsecutiveRun(items) {
  let longest = [];
  let current = [];
  for (const item of items) {
    if (item.qualifies) current.push(item);
    else current = [];
    if (current.length > longest.length) longest = [...current];
  }
  return longest;
}

function dateFromDayOffset(dayOffset) {
  const date = new Date(Date.UTC(OBSERVATION_YEAR, 0, 1));
  date.setUTCDate(date.getUTCDate() + Number(dayOffset));
  return date.toISOString().slice(0, 10);
}

async function fetchDataset(destination) {
  const response = await fetch(DATASET_URL, { signal: AbortSignal.timeout(180_000) });
  if (!response.ok) throw new Error(`Copernicus drought download failed: ${response.status} ${response.statusText}`);
  await writeFile(destination, new Uint8Array(await response.arrayBuffer()));
}

async function main() {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'lostplanet-copernicus-drought-'));
  const datasetPath = path.join(temporaryDirectory, `spi6-${OBSERVATION_YEAR}.nc`);
  let file;
  try {
    await fetchDataset(datasetPath);
    const h5wasm = await import('h5wasm/node');
    await h5wasm.ready;
    file = new h5wasm.File(datasetPath, 'r');
    const spiDataset = file.get('spa06');
    const latitudes = Array.from(file.get('lat').value);
    const longitudes = Array.from(file.get('lon').value);
    const timeOffsets = Array.from(file.get('time').value, Number);
    const observationDates = timeOffsets.map(dateFromDayOffset);
    if (spiDataset.shape.join(',') !== `12,1,720,1440`) throw new Error(`Unexpected Copernicus SPI-6 shape: ${spiDataset.shape.join(',')}`);

    const records = LOCATIONS.map(location => {
      const latitudeIndex = nearestIndex(latitudes, location.latitude);
      const longitudeIndex = nearestIndex(longitudes, location.longitude);
      const values = Array.from(spiDataset.slice([[0, 12], [0, 1], [latitudeIndex, latitudeIndex + 1], [longitudeIndex, longitudeIndex + 1]]), Number);
      if (values.length !== 12 || values.some(value => !Number.isFinite(value) || Math.abs(value) > 10)) {
        throw new Error(`Invalid SPI-6 series for ${location.name}`);
      }
      const monthly = values.map((value, index) => ({
        month: observationDates[index],
        spi6: round(value),
        qualifies: value <= DROUGHT_THRESHOLD
      }));
      const droughtMonths = monthly.filter(item => item.qualifies);
      const longestRun = longestConsecutiveRun(monthly);
      return {
        record_id: `copernicus_spi6_${location.id}_${OBSERVATION_YEAR}`,
        location_id: location.id,
        location_name: location.name,
        requested_latitude: location.latitude,
        requested_longitude: location.longitude,
        grid_latitude: latitudes[latitudeIndex],
        grid_longitude: longitudes[longitudeIndex],
        observation_year: OBSERVATION_YEAR,
        index: 'SPI-6',
        accumulation_months: SPI_TIMESCALE_MONTHS,
        drought_threshold_spi: DROUGHT_THRESHOLD,
        valid_months: monthly.length,
        completeness_pct: round(monthly.length / 12 * 100, 1),
        drought_months: droughtMonths.length,
        longest_consecutive_drought_months: longestRun.length,
        longest_drought_run_start: longestRun[0]?.month || null,
        longest_drought_run_end: longestRun.at(-1)?.month || null,
        cumulative_spi_deficit_below_threshold: round(droughtMonths.reduce((sum, item) => sum + Math.abs(item.spi6), 0)),
        minimum_spi6: round(Math.min(...values)),
        minimum_spi6_month: monthly[values.indexOf(Math.min(...values))].month,
        monthly_values: monthly,
        source_locator: {
          dataset_url: DATASET_URL,
          documentation_url: DOCS_URL,
          factsheet_url: FACTSHEET_URL,
          wcs_documentation_url: WCS_URL,
          variable: 'spa06',
          source_grid_shape: spiDataset.shape,
          nearest_grid_indices: { latitude: latitudeIndex, longitude: longitudeIndex }
        }
      };
    });

    const snapshot = {
      version: `copernicus_gdo_era5_spi6_${OBSERVATION_YEAR}_v1`,
      captured_at: new Date().toISOString(),
      source: {
        id: SOURCE_ID,
        name: 'Copernicus Global Drought Observatory ERA5 SPI-6',
        url: DATASET_URL,
        documentation_url: DOCS_URL,
        access: 'open_download'
      },
      ingestion_job_id: INGESTION_JOB_ID,
      metric_contract_ids: ['drought_event_duration_spi6'],
      cadence: 'Monthly source check with annual finalized-file refresh; consolidated ERA5-derived data may lag real time by several months.',
      provenance: 'Copernicus Global Drought Observatory ERA5 Standardized Precipitation Index at a six-month accumulation window, Version 2.0.0, monthly 2025 values extracted from the source NetCDF at the nearest 0.25-degree grid cell.',
      uncertainty: 'SPI measures precipitation anomaly, not soil moisture, streamflow, groundwater, agricultural damage, or water shortage. ERA5 inputs, distribution fitting, 1991-2020 reference climatology, grid resolution, accumulation window, threshold choice, and dataset revisions affect event classification.',
      failure_behavior: 'Retain the last validated complete-year snapshot and mark stale. Withhold a location unless all twelve source months are finite; never treat a missing month as drought-free or interpolate across a missing interval.',
      measurement_boundary: 'A drought month is declared only when source SPI-6 is at or below -1.0. Persistence is the longest consecutive qualifying run within the observation year. Runs crossing year boundaries are truncated by this annual pilot and must not be interpreted as full event duration without adjacent-year data.',
      observation_period: { start: `${OBSERVATION_YEAR}-01-01`, end: `${OBSERVATION_YEAR}-12-01` },
      location_count: records.length,
      record_count: records.length,
      records
    };
    await mkdir(PUBLIC_DIR, { recursive: true });
    await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ output: OUTPUT_PATH, records: records.length, observation_year: OBSERVATION_YEAR }, null, 2));
  } finally {
    file?.close();
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
