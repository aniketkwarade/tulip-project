import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'climate-trace-land-emissions-snapshot.json');
const API_ROOT = 'https://api.climatetrace.org/v7';
const SOURCE_PAGE_URL = 'https://climatetrace.org/data';
const API_DOCS_URL = `${API_ROOT}/docs/index.html`;
const DATA_GUIDE_URL = 'https://media.climatetrace.org/about_the_data_latest_b6e7b8d419.pdf';
const COMPLETE_YEARS = Array.from({ length: 10 }, (_, index) => 2015 + index);
const SUBSECTORS = [
  'forest-land-clearing',
  'forest-land-fires',
  'shrubgrass-fires',
  'wetland-fires',
  'cropland-fires'
];
const FIRE_SUBSECTORS = new Set(SUBSECTORS.slice(1));

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'LostPlanet-Northstar/1.0 (+source-backed urgency snapshot)' },
    signal: AbortSignal.timeout(90_000)
  });
  if (!response.ok) throw new Error(`Climate TRACE request failed: ${response.status} ${response.statusText} (${url})`);
  return { json: await response.json(), headers: response.headers };
}

function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

async function main() {
  const definitionsUrl = `${API_ROOT}/definitions/subsectors`;
  const definitionsResponse = await fetchJson(definitionsUrl);
  const definitions = Array.isArray(definitionsResponse.json) ? definitionsResponse.json : [];
  const definitionIds = new Set(definitions.map(definition => typeof definition === 'string'
    ? definition
    : definition.id ?? definition.slug ?? definition.name));
  for (const subsector of SUBSECTORS) {
    if (!definitionIds.has(subsector)) throw new Error(`Climate TRACE no longer recognizes required subsector ${subsector}.`);
  }

  const rawByYear = [];
  let lastModified = null;
  let etag = null;
  for (const year of COMPLETE_YEARS) {
    const url = `${API_ROOT}/sources/emissions?year=${year}&gas=co2&subsectors=${SUBSECTORS.join(',')}`;
    const response = await fetchJson(url);
    lastModified = response.headers.get('last-modified') ?? lastModified;
    etag = response.headers.get('etag') ?? etag;
    if (response.json.location?.name !== 'Global') throw new Error(`Expected Global location for ${year}.`);
    const rows = response.json.subsectors?.timeseries;
    if (!Array.isArray(rows)) throw new Error(`Missing subsector timeseries for ${year}.`);
    rawByYear.push({ year, url, rows });
  }

  const records = [];
  for (const { year, url, rows } of rawByYear) {
    const expectedKeys = new Set(SUBSECTORS.flatMap(subsector => Array.from({ length: 12 }, (_, index) => `${subsector}:${index + 1}`)));
    const retained = rows.filter(row => row.gas === 'co2' && SUBSECTORS.includes(row.subsector));
    for (const row of retained) {
      if (row.year !== year || !Number.isInteger(row.month) || row.month < 1 || row.month > 12) throw new Error(`Invalid time key in ${year}.`);
      if (!Number.isFinite(row.emissionsQuantity)) throw new Error(`Missing emissionsQuantity for ${row.subsector} ${year}-${row.month}; missing data is never converted to zero.`);
      const key = `${row.subsector}:${row.month}`;
      if (!expectedKeys.delete(key)) throw new Error(`Duplicate or unexpected Climate TRACE row ${key} for ${year}.`);
    }
    if (expectedKeys.size) throw new Error(`Climate TRACE ${year} is missing ${[...expectedKeys].slice(0, 5).join(', ')}.`);

    for (let month = 1; month <= 12; month += 1) {
      const monthRows = retained.filter(row => row.month === month);
      const clearing = monthRows.find(row => row.subsector === 'forest-land-clearing');
      const fireRows = monthRows.filter(row => FIRE_SUBSECTORS.has(row.subsector));
      const fireTotal = fireRows.reduce((sum, row) => sum + row.emissionsQuantity, 0);
      records.push({
        record_id: `climate_trace_deforestation_co2_release_${monthKey(year, month)}`,
        node_id: 'deforestation_co2_release',
        metric_id: 'carbon_pathway_deforestation_co2_release',
        measurement_role: 'source_reported_global_forest_land_clearing_co2',
        geography: 'Global',
        observation_month: monthKey(year, month),
        value: clearing.emissionsQuantity,
        unit: 'metric tonnes CO2/month',
        source_subsectors: ['forest-land-clearing'],
        source_locator: `${url}; response=subsectors.timeseries; subsector=forest-land-clearing; year=${year}; month=${month}`
      });
      records.push({
        record_id: `climate_trace_land_use_fire_co2_${monthKey(year, month)}`,
        node_id: 'land_use_fire_co2',
        metric_id: 'carbon_pathway_land_use_fire_co2',
        measurement_role: 'derived_global_land_fire_co2_sum',
        geography: 'Global',
        observation_month: monthKey(year, month),
        value: fireTotal,
        unit: 'metric tonnes CO2/month',
        source_subsectors: [...FIRE_SUBSECTORS],
        component_values: Object.fromEntries(fireRows.map(row => [row.subsector, row.emissionsQuantity])),
        source_locator: `${url}; response=subsectors.timeseries; subsectors=${[...FIRE_SUBSECTORS].join('+')}; year=${year}; month=${month}`
      });
    }
  }

  const counts = Object.fromEntries(['deforestation_co2_release', 'land_use_fire_co2'].map(nodeId => [
    nodeId,
    records.filter(record => record.node_id === nodeId).length
  ]));
  for (const [nodeId, count] of Object.entries(counts)) if (count < 60) throw new Error(`${nodeId} has only ${count} complete monthly observations.`);

  const snapshot = {
    version: `climate_trace_global_land_co2_${COMPLETE_YEARS[0]}_${COMPLETE_YEARS.at(-1)}_${new Date().toISOString().slice(0, 10)}_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: 'climate_trace_global_emissions_api',
      name: 'Climate TRACE Global Emissions API',
      publisher: 'Climate TRACE',
      api_root: API_ROOT,
      api_docs_url: API_DOCS_URL,
      source_page_url: SOURCE_PAGE_URL,
      data_guide_url: DATA_GUIDE_URL,
      definitions_url: definitionsUrl,
      license: 'CC BY 4.0',
      response_last_modified: lastModified,
      response_etag: etag
    },
    ingestion_job_id: 'fetch_climate_trace_land_emissions_snapshot',
    metric_contract_ids: ['carbon_pathway_deforestation_co2_release', 'carbon_pathway_land_use_fire_co2'],
    contract_bindings: [
      { node_id: 'deforestation_co2_release', metric_id: 'carbon_pathway_deforestation_co2_release', measurement_role: 'source_reported_global_forest_land_clearing_co2' },
      { node_id: 'land_use_fire_co2', metric_id: 'carbon_pathway_land_use_fire_co2', measurement_role: 'derived_global_land_fire_co2_sum' }
    ],
    cadence: 'Monthly source release; refresh only after the latest calendar year is complete, or extend the scoring transform to a declared complete trailing period.',
    provenance: 'Climate TRACE source-reported Global monthly CO2 estimates. Deforestation retains forest-land-clearing directly. Land-use fire is the deterministic sum of forest-land, shrubgrass, wetland and cropland fire subsectors for the same month.',
    uncertainty: 'Climate TRACE combines remote sensing, inventories and modeled estimation, and explicitly revises historical values as methods and inputs improve. Forestry and fire estimates have material classification, burned-area, carbon-stock and emissions-factor uncertainty. API aggregate responses do not include uncertainty intervals; the source guide says intervals are available on request.',
    failure_behavior: 'Retain the last validated snapshot and mark stale. Reject unsupported subsectors, non-global responses, duplicate node-month rows, null quantities or any incomplete 12-month year. Official numeric zeros remain observations; missing values are never converted to zero.',
    temporal_boundary: `Complete calendar years ${COMPLETE_YEARS[0]}–${COMPLETE_YEARS.at(-1)} only; current partial or projected years are excluded.`,
    record_count: records.length,
    record_counts_by_node: counts,
    records: records.sort((left, right) => left.node_id.localeCompare(right.node_id) || left.observation_month.localeCompare(right.observation_month))
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: OUTPUT_PATH, records: records.length, record_counts_by_node: counts }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
