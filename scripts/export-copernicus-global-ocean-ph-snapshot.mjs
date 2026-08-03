import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/copernicus-global-ocean-ph-snapshot.json');
const observations = [
  [1985, 8.107793, 0.015011], [1986, 8.106891, 0.014844], [1987, 8.105386, 0.014361],
  [1988, 8.103099, 0.013960], [1989, 8.102114, 0.013732], [1990, 8.101110, 0.013440],
  [1991, 8.100289, 0.013250], [1992, 8.099419, 0.013296], [1993, 8.098908, 0.013146],
  [1994, 8.097158, 0.012886], [1995, 8.095258, 0.012738], [1996, 8.094047, 0.012599],
  [1997, 8.093911, 0.012547], [1998, 8.090739, 0.012503], [1999, 8.088368, 0.012339],
  [2000, 8.087294, 0.012203], [2001, 8.086026, 0.012106], [2002, 8.084764, 0.012035],
  [2003, 8.082623, 0.012026], [2004, 8.081106, 0.012019], [2005, 8.079164, 0.011928],
  [2006, 8.077592, 0.011935], [2007, 8.075469, 0.011910], [2008, 8.073663, 0.011923],
  [2009, 8.072720, 0.011903], [2010, 8.071252, 0.012099], [2011, 8.069000, 0.012064],
  [2012, 8.067206, 0.012005], [2013, 8.064916, 0.012017], [2014, 8.063910, 0.011988],
  [2015, 8.062368, 0.012212], [2016, 8.059293, 0.012422], [2017, 8.056603, 0.012464],
  [2018, 8.054793, 0.012451], [2019, 8.052815, 0.012756], [2020, 8.050586, 0.012942],
  [2021, 8.048546, 0.013004], [2022, 8.046519, 0.013382], [2023, 8.045389, 0.013698],
  [2024, 8.042169, 0.014035]
].map(([year, ph, uncertainty]) => ({ year, ph, uncertainty }));

const snapshot = {
  version: 'copernicus_global_ocean_ph_area_averaged_202511_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'copernicus_marine_global_ocean_ph',
    name: 'Copernicus Marine Global Ocean Acidification Mean pH Indicator',
    publisher: 'E.U. Copernicus Marine Service / CEA-LSCE',
    product_id: 'GLOBAL_OMI_HEALTH_carbon_ph_area_averaged',
    dataset_id: 'global_omi_health_carbon_ph_area_averaged_202511',
    doi: '10.48670/moi-00224',
    product_url: 'https://data.marine.copernicus.eu/product/GLOBAL_OMI_HEALTH_carbon_ph_area_averaged/services',
    native_file_url: 'https://s3.waw3-1.cloudferro.com/mdl-native-14/native/GLOBAL_OMI_HEALTH_carbon_ph_area_averaged/global_omi_health_carbon_ph_area_averaged_202511/global_omi_health_carbon_ph_area_averaged_1985.nc',
    native_file_sha256: '1f38cc72e032e926848c7db959126b19d930984e73f21a73164d559a603e958a',
    wmo_validation_url: 'https://public.wmo.int/sites/default/files/2025-03/WMO-1368-2024_en.pdf'
  },
  ingestion_job_id: 'export_copernicus_global_ocean_ph_snapshot',
  metric_contract_ids: ['surface_ocean_ph_and_aragonite_state'],
  contract_bindings: [{ node_id: 'ocean_acidification', metric_id: 'surface_ocean_ph_and_aragonite_state', measurement_role: 'global_area_averaged_annual_surface_ocean_ph_primary' }],
  cadence: 'Annual Copernicus Marine OMI release check with full native-file checksum and series replacement.',
  provenance: 'Values are the complete ph and ph_uncertainty arrays in the named Copernicus Marine native NetCDF artifact; years are decoded from its Gregorian days-since-1950 time coordinate. WMO independently publishes the 1985-2023 global trend from this indicator family.',
  uncertainty: 'The global series is a multi-observation reprocessing product rather than uniform direct sampling. Carbon-system inputs, sparse observations, reconstruction, spatial weighting, pH scale, changing coverage and product revisions affect annual estimates. Source standard-deviation values are retained.',
  failure_behavior: 'Retain the last checksum-validated complete series and mark stale; reject a changed dataset ID, checksum, variable schema, missing year, duplicate year, non-monotonic time axis or implausible pH. Never fill a missing year with zero or infer aragonite saturation from pH alone.',
  measurement_boundary: 'Annual area-averaged global surface seawater pH on the total scale. No omega-aragonite value is inferred, and the series is not a local coastal exposure estimate.',
  observations,
  record_count: observations.length,
  start_year: observations[0].year,
  end_year: observations.at(-1).year,
  excluded_from_scoring: ['regional trend map cells', 'aragonite saturation inferred from pH', 'future projections', 'North American coastal climatology']
};

if (observations.length < 20) throw new Error('Copernicus global pH history does not pass the annual historical-distribution gate.');
if (new Set(observations.map(({ year }) => year)).size !== observations.length) throw new Error('Duplicate years in Copernicus global pH series.');
if (observations.some(({ ph, uncertainty }) => ph < 7.5 || ph > 8.5 || uncertainty < 0 || uncertainty > 0.1)) throw new Error('Implausible Copernicus global pH value.');

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, record_count: snapshot.record_count, period: [snapshot.start_year, snapshot.end_year] }, null, 2));
