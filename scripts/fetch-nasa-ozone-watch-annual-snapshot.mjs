import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/nasa-ozone-watch-annual-snapshot.json');
const DATA_URL = 'https://ozonewatch.gsfc.nasa.gov/statistics/annual_data.txt';
const PAGE_URL = 'https://ozonewatch.gsfc.nasa.gov/statistics/annual_data.html';

async function main() {
  const response = await fetch(DATA_URL, {
    headers: { 'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound snapshot ingestion)' },
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw new Error(`NASA Ozone Watch request failed: ${response.status} ${response.statusText}`);
  const text = await response.text();
  const records = text.split(/\r?\n/).map(line => {
    const match = line.trim().match(/^(19\d{2}|20\d{2})\s+([0-9.]+)\s+([0-9.]+)$/);
    if (!match) return null;
    return {
      record_id: `nasa_ozone_watch_antarctic_${match[1]}`,
      node_id: 'stratospheric_chlorine_sinks',
      metric_id: 'stratospheric_ozone_column_depletion_and_recovery',
      measurement_role: 'antarctic_fixed_window_annual_ozone_depletion_indicator',
      observation_year: Number(match[1]),
      mean_ozone_hole_area_million_km2_sep07_oct13: Number(match[2]),
      minimum_mean_ozone_du_sep21_oct16: Number(match[3]),
      ozone_hole_threshold_du: 220,
      ozone_deficit_against_threshold_du: Number((220 - Number(match[3])).toFixed(3)),
      geography: 'Southern Hemisphere Antarctic ozone-hole domain',
      source_locator: `${DATA_URL}; annual row ${match[1]}`
    };
  }).filter(Boolean).sort((left, right) => left.observation_year - right.observation_year);

  if (records.length < 20) throw new Error(`NASA Ozone Watch history has only ${records.length} annual observations.`);
  if (new Set(records.map(record => record.observation_year)).size !== records.length) throw new Error('NASA Ozone Watch history contains duplicate years.');
  if (records.some(record => record.mean_ozone_hole_area_million_km2_sep07_oct13 < 0 || record.minimum_mean_ozone_du_sep21_oct16 <= 0)) {
    throw new Error('NASA Ozone Watch history contains invalid area or ozone values.');
  }
  if (records.some(record => record.observation_year === 1995)) throw new Error('NASA Ozone Watch source declares 1995 missing but a parsed row was present.');

  const snapshot = {
    version: `nasa_ozone_watch_annual_${records[0].observation_year}_${records.at(-1).observation_year}_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: 'nasa_ozone_watch',
      name: 'NASA Ozone Watch Annual Records',
      publisher: 'NASA Goddard Space Flight Center',
      data_url: DATA_URL,
      page_url: PAGE_URL,
      source_last_modified: response.headers.get('last-modified')
    },
    ingestion_job_id: 'fetch_nasa_ozone_watch_annual_history',
    metric_contract_ids: ['stratospheric_ozone_column_depletion_and_recovery'],
    contract_bindings: [
      { node_id: 'stratospheric_chlorine_sinks', metric_id: 'stratospheric_ozone_column_depletion_and_recovery', measurement_role: 'antarctic_fixed_window_annual_ozone_depletion_indicator' }
    ],
    cadence: 'Annual refresh after NASA finalizes the Antarctic ozone-hole season.',
    provenance: 'Official NASA Ozone Watch TOMS, OMI and OMPS annual records. The mean ozone-hole area uses 7 September-13 October and minimum mean ozone uses 21 September-16 October. NASA fills missing spatial data with MERRA, MERRA-2 and GEOS FP; the missing 1995 year remains absent.',
    uncertainty: 'Polar-vortex dynamics, temperature, aerosols, sunlight, transport, sensor transitions, missing-orbit assimilation and fixed seasonal windows affect annual values. This Antarctic indicator is not a uniform global ozone-column measurement.',
    failure_behavior: 'Retain the last validated complete season and mark stale; reject schema changes, duplicates, implausible values or fewer than 20 annual observations. Never fill the missing 1995 year, count an incomplete current season or interpret a single polar season as uniform global ozone recovery.',
    measurement_boundary: 'The ozone-hole area is the Antarctic area below NASA\'s recognized 220-DU threshold. It is a polar-vortex indicator of stratospheric ozone depletion and recovery, not ground-level ozone or a global area-average column.',
    record_count: records.length,
    records
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(JSON.stringify({ output: OUTPUT_PATH, records: records.length, years: [records[0].observation_year, records.at(-1).observation_year] }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
