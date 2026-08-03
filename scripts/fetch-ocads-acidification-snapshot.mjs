import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { File, ready as hdf5Ready } from 'h5wasm/node';

import { readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACCESSION = '0270962';
const BASE_URL = `https://www.ncei.noaa.gov/data/oceans/ncei/ocads/data/${ACCESSION}`;
const PH_URL = `${BASE_URL}/pH.nc`;
const ARAGONITE_URL = `${BASE_URL}/Aragonite.nc`;
const METADATA_URL = `https://www.ncei.noaa.gov/data/oceans/ncei/ocads/metadata/${ACCESSION}.html`;
const DATASET_DOI = 'https://doi.org/10.25921/g8pb-zy76';
const GRID_SIZE = 76 * 141;

const round = (value, digits = 6) => Number(value.toFixed(digits));

async function download(url, output) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/x-netcdf,application/octet-stream;q=0.9,*/*;q=0.5',
      'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound NOAA OCADS ingestion)'
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 1_000_000 || String.fromCharCode(...bytes.slice(1, 4)) !== 'HDF') {
    throw new Error(`NOAA OCADS ${path.basename(output)} is not the expected HDF5-backed NetCDF file`);
  }
  await fs.writeFile(output, bytes);
  return bytes.length;
}

function values(file, key) {
  const dataset = file.get(key);
  if (!dataset) throw new Error(`NOAA OCADS schema changed: missing ${key}`);
  return dataset.value;
}

function readSurface(filePath, prefix) {
  const file = new File(filePath, 'r');
  try {
    const longitude = values(file, 'longitude');
    const latitude = values(file, 'latitude');
    const depth = values(file, 'depth');
    if (longitude.length !== 141 || latitude.length !== 76 || depth.length !== 14 || depth[0] !== 0) {
      throw new Error(`NOAA OCADS coordinate schema changed for ${path.basename(filePath)}`);
    }
    const fields = Object.fromEntries(['an', 'mn', 'dd', 'sd', 'gp', 'SE'].map(suffix => {
      const array = values(file, `${prefix}_${suffix}`);
      if (array.length !== 14 * GRID_SIZE) throw new Error(`NOAA OCADS ${prefix}_${suffix} grid size changed`);
      return [suffix, array.slice(0, GRID_SIZE)];
    }));
    return {
      longitude: Array.from(longitude),
      latitude: Array.from(latitude),
      fields,
      title: file.attrs.Title?.value || null,
      created_at_source: file.attrs.Date_created?.value || null
    };
  } finally {
    file.close();
  }
}

function summary(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    minimum: round(sorted[0]),
    median: round(sorted[Math.floor(sorted.length / 2)]),
    maximum: round(sorted.at(-1)),
    mean: round(sorted.reduce((total, value) => total + value, 0) / sorted.length)
  };
}

function buildRecords(ph, aragonite, metricId) {
  if (JSON.stringify(ph.longitude) !== JSON.stringify(aragonite.longitude)
      || JSON.stringify(ph.latitude) !== JSON.stringify(aragonite.latitude)) {
    throw new Error('NOAA OCADS pH and aragonite coordinate grids do not match');
  }
  const records = [];
  for (let latitudeIndex = 0; latitudeIndex < ph.latitude.length; latitudeIndex += 1) {
    for (let longitudeIndex = 0; longitudeIndex < ph.longitude.length; longitudeIndex += 1) {
      const index = latitudeIndex * ph.longitude.length + longitudeIndex;
      const phValue = Number(ph.fields.an[index]);
      const aragoniteValue = Number(aragonite.fields.an[index]);
      if (!(phValue > 0) || !(aragoniteValue > 0)) continue;
      if (phValue < 7 || phValue > 9 || aragoniteValue > 10) {
        throw new Error(`NOAA OCADS implausible surface value at grid index ${index}`);
      }
      const phObservationCount = Number(ph.fields.dd[index]);
      const aragoniteObservationCount = Number(aragonite.fields.dd[index]);
      records.push({
        record_id: `ocads_na_surface_y${latitudeIndex}_x${longitudeIndex}`,
        metric_id: metricId,
        measurement_role: 'north_american_coastal_surface_climatology_primary',
        longitude: ph.longitude[longitudeIndex],
        latitude: ph.latitude[latitudeIndex],
        depth_m: 0,
        analysis_reference_year: 2010,
        source_observation_start: '2003-12-06',
        source_observation_end: '2018-11-22',
        ph_total_scale_objectively_analyzed_mean: round(phValue),
        aragonite_saturation_state_objectively_analyzed_mean: round(aragoniteValue),
        ph_statistical_mean_at_observed_cell: ph.fields.mn[index] > 0 ? round(Number(ph.fields.mn[index])) : null,
        aragonite_statistical_mean_at_observed_cell: aragonite.fields.mn[index] > 0 ? round(Number(aragonite.fields.mn[index])) : null,
        ph_observation_count_at_grid_cell: phObservationCount,
        aragonite_observation_count_at_grid_cell: aragoniteObservationCount,
        ph_standard_deviation_at_observed_cell: ph.fields.sd[index] > 0 ? round(Number(ph.fields.sd[index])) : null,
        aragonite_standard_deviation_at_observed_cell: aragonite.fields.sd[index] > 0 ? round(Number(aragonite.fields.sd[index])) : null,
        ph_objective_analysis_support_grid_count: Number(ph.fields.gp[index]),
        aragonite_objective_analysis_support_grid_count: Number(aragonite.fields.gp[index]),
        ph_source_standard_error_field: Number(ph.fields.SE[index]),
        aragonite_source_standard_error_field: Number(aragonite.fields.SE[index]),
        ph_scale: 'Total scale',
        aragonite_unit: 'unitless omega-aragonite',
        grid_resolution: '1 degree latitude by 1 degree longitude',
        analysis_method: 'NOAA NCEI World Ocean Atlas objective analysis after source variables were adjusted to reference year 2010',
        source_locator: METADATA_URL,
        ph_data_locator: PH_URL,
        aragonite_data_locator: ARAGONITE_URL
      });
    }
  }
  return records;
}

async function main() {
  const contracts = await readMetricContracts(ROOT);
  const contract = contracts.ocean_acidification;
  if (!contract) throw new Error('Missing node metric contract for ocean_acidification');

  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'lostplanet-ocads-'));
  const phPath = path.join(temporaryDirectory, 'pH.nc');
  const aragonitePath = path.join(temporaryDirectory, 'Aragonite.nc');
  try {
    const [phBytes, aragoniteBytes] = await Promise.all([
      download(PH_URL, phPath),
      download(ARAGONITE_URL, aragonitePath)
    ]);
    await hdf5Ready;
    const ph = readSurface(phPath, 'pHT');
    const aragonite = readSurface(aragonitePath, 'OmegaA');
    const records = buildRecords(ph, aragonite, contract.metric_id);
    if (records.length < 5_000) throw new Error(`NOAA OCADS returned only ${records.length} paired surface grid cells`);
    if (new Set(records.map(record => record.record_id)).size !== records.length) throw new Error('NOAA OCADS produced duplicate grid-cell IDs');

    const phSummary = summary(records.map(record => record.ph_total_scale_objectively_analyzed_mean));
    const aragoniteSummary = summary(records.map(record => record.aragonite_saturation_state_objectively_analyzed_mean));
    const directObservationCells = records.filter(record => record.ph_observation_count_at_grid_cell > 0 && record.aragonite_observation_count_at_grid_cell > 0).length;

    const snapshot = snapshotEnvelope({
      jobId: 'fetch_noaa_ocads_surface_acidification_climatology',
      source: {
        id: 'noaa_ocean_carbon_and_acidification_data_system',
        name: 'NOAA NCEI North American Coastal Ocean Acidification Indicator Climatologies',
        publisher: 'NOAA National Centers for Environmental Information',
        accession: ACCESSION,
        dataset_doi: DATASET_DOI,
        metadata_url: METADATA_URL,
        ph_data_url: PH_URL,
        aragonite_data_url: ARAGONITE_URL
      },
      request: {
        variables: ['pH on Total Scale', 'Aragonite saturation state'],
        depth_m: 0,
        product_field: 'objectively analyzed mean',
        spatial_domain: 'North American ocean margins',
        source_grid: '1 degree latitude by 1 degree longitude',
        source_observation_period: '2003-12-06 to 2018-11-22',
        analysis_reference_year: 2010
      },
      contractIds: [contract.metric_id],
      contractBindings: [{ node_id: 'ocean_acidification', metric_id: contract.metric_id, measurement_role: 'north_american_coastal_surface_climatology_primary' }],
      cadence: 'annual source metadata check with release-triggered full NetCDF replacement',
      provenance: 'Official NOAA NCEI OCADS accession 0270962 paired pH-total-scale and omega-aragonite NetCDF fields. Only the source surface layer and objectively analyzed mean are paired on the identical source grid; observation counts and source uncertainty-support fields are retained.',
      uncertainty: 'The product combines quality-controlled CODAP-NA and GLODAPv2 observations adjusted to 2010 and interpolated with World Ocean Atlas objective analysis. Direct observations are sparse relative to the analyzed grid. Source standard-deviation and standard-error fields are retained without converting the latter into confidence intervals because its numeric scale is not documented as a directly interpretable pH or omega interval in the NetCDF metadata.',
      records,
      sourceSummary: {
        paired_surface_grid_cells: records.length,
        paired_cells_with_direct_observations: directObservationCells,
        paired_cells_without_direct_observations: records.length - directObservationCells,
        ph_total_scale: phSummary,
        aragonite_saturation_state: aragoniteSummary,
        ph_download_bytes: phBytes,
        aragonite_download_bytes: aragoniteBytes,
        ph_product_title: ph.title,
        aragonite_product_title: aragonite.title,
        source_files_created_at: { ph: ph.created_at_source, aragonite: aragonite.created_at_source },
        measurement_boundary: 'A spatial climatology adjusted to reference year 2010. It measures surface carbonate-chemistry state across the North American ocean margins; it is not a current observation, global mean, temporal trend, causal attribution, biological impact, or universal ecological threshold.'
      },
      caveats: [
        'The source is a gridded climatology, not a live station feed or annual time series.',
        'Objectively analyzed cells can be supported by nearby observations even when the grid cell has zero direct observations.',
        'pH is retained on the Total scale; it must not be combined with another pH scale without an explicit carbonate-system conversion.',
        'Aragonite saturation state is source-calculated from DIC, total alkalinity and other variables using the documented CO2SYS constants and reference-year adjustment.',
        'No temporal trend or organism response is inferred from the spatial fields.'
      ],
      failureBehavior: 'Retain the last validated paired surface climatology and mark it stale; reject non-HDF5 files, coordinate or field schema changes, mismatched pH/aragonite grids, implausible values, duplicate cells or a truncated domain; never fill missing cells with zero or interpret the climatology as a current trend.'
    });

    const output = await writeSnapshot(ROOT, 'ocads-acidification-snapshot.json', snapshot);
    console.log(JSON.stringify({ output, records: records.length, direct_observation_cells: directObservationCells, ph: phSummary, aragonite: aragoniteSummary }, null, 2));
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
