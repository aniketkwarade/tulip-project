import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'ember-global-power-snapshot.json');
const DATA_URL = 'https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv';
const METHODOLOGY_URL = 'https://files.ember-energy.org/public-downloads/ember_electricity_data_methodology.pdf';
const SOURCE_PAGE_URL = 'https://ember-energy.org/data/electricity-data-explorer/';

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

async function main() {
  const response = await fetch(DATA_URL, {
    headers: { Accept: 'text/csv', 'User-Agent': 'LostPlanet-Northstar/1.0 (+source-backed urgency snapshot)' },
    signal: AbortSignal.timeout(180_000)
  });
  if (!response.ok) throw new Error(`Ember yearly data request failed: ${response.status} ${response.statusText}`);
  const text = await response.text();
  const lines = text.split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const expected = ['Area', 'Year', 'Category', 'Subcategory', 'Variable', 'Unit', 'Value'];
  for (const header of expected) if (!headers.includes(header)) throw new Error(`Ember CSV is missing ${header}.`);
  const column = Object.fromEntries(headers.map((header, index) => [header, index]));
  const records = [];
  for (const line of lines.slice(1)) {
    if (!line.startsWith('World,')) continue;
    const cells = parseCsvLine(line);
    const year = Number(cells[column.Year]);
    const value = Number(cells[column.Value]);
    const category = cells[column.Category];
    const subcategory = cells[column.Subcategory];
    const variable = cells[column.Variable];
    const unit = cells[column.Unit];
    if (!Number.isInteger(year) || !Number.isFinite(value)) continue;

    let nodeId = null;
    let metricId = null;
    let metricRole = null;
    if (category === 'Power sector emissions' && subcategory === 'Fuel' && unit === 'mtCO2') {
      if (variable === 'Coal') {
        nodeId = 'coal_power_co2_output';
        metricId = 'carbon_pathway_coal_power_co2_output';
        metricRole = 'source_reported_world_coal_power_lifecycle_emissions';
      } else if (variable === 'Gas') {
        nodeId = 'gas_power_co2_output';
        metricId = 'carbon_pathway_gas_power_co2_output';
        metricRole = 'source_reported_world_gas_power_lifecycle_emissions';
      }
    } else if (category === 'Electricity generation' && subcategory === 'Fuel' && variable === 'Gas' && unit === '%') {
      nodeId = 'gas_power_dependence';
      metricId = 'gas_fired_generation_share';
      metricRole = 'source_reported_world_gas_generation_share';
    } else if (category === 'Electricity generation' && subcategory === 'Fuel' && variable === 'Hydro' && unit === 'TWh') {
      nodeId = 'hydropower_reliability_decline';
      metricId = 'hydropower_availability_and_generation_shortfall';
      metricRole = 'source_reported_world_hydropower_generation_for_transparent_trend_shortfall';
    }
    if (!nodeId) continue;
    records.push({
      record_id: `ember_world_${nodeId}_${year}`,
      node_id: nodeId,
      metric_id: metricId,
      measurement_role: metricRole,
      geography: 'World',
      observation_year: year,
      category,
      subcategory,
      variable,
      value,
      unit,
      source_locator: `${DATA_URL}; Area=World; Category=${category}; Subcategory=${subcategory}; Variable=${variable}; Unit=${unit}; Year=${year}`
    });
  }

  const counts = Object.fromEntries([...new Set(records.map(record => record.node_id))].map(nodeId => [
    nodeId,
    records.filter(record => record.node_id === nodeId).length
  ]));
  for (const [nodeId, count] of Object.entries(counts)) {
    if (count < 20) throw new Error(`Ember retained history for ${nodeId} has only ${count} years.`);
  }
  if (Object.keys(counts).length !== 4) throw new Error(`Expected four exact Ember node bindings; found ${Object.keys(counts).length}.`);

  const sourceLastModified = response.headers.get('last-modified');
  const snapshot = {
    version: `ember_yearly_global_power_${sourceLastModified ? new Date(sourceLastModified).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: 'ember_global_electricity_data',
      name: 'Ember Yearly Electricity Data',
      publisher: 'Ember',
      data_url: DATA_URL,
      methodology_url: METHODOLOGY_URL,
      source_page_url: SOURCE_PAGE_URL,
      license: 'CC BY 4.0',
      source_last_modified: sourceLastModified,
      source_etag: response.headers.get('etag')
    },
    ingestion_job_id: 'fetch_ember_global_power_snapshot',
    metric_contract_ids: [
      'carbon_pathway_coal_power_co2_output',
      'carbon_pathway_gas_power_co2_output',
      'gas_fired_generation_share',
      'hydropower_availability_and_generation_shortfall'
    ],
    contract_bindings: [
      { node_id: 'coal_power_co2_output', metric_id: 'carbon_pathway_coal_power_co2_output', measurement_role: 'source_reported_world_coal_power_lifecycle_emissions' },
      { node_id: 'gas_power_co2_output', metric_id: 'carbon_pathway_gas_power_co2_output', measurement_role: 'source_reported_world_gas_power_lifecycle_emissions' },
      { node_id: 'gas_power_dependence', metric_id: 'gas_fired_generation_share', measurement_role: 'source_reported_world_gas_generation_share' },
      { node_id: 'hydropower_reliability_decline', metric_id: 'hydropower_availability_and_generation_shortfall', measurement_role: 'source_reported_world_hydropower_generation_for_transparent_trend_shortfall' }
    ],
    cadence: 'Annual complete-release refresh after Ember updates the Yearly Electricity Data file.',
    provenance: 'Source-native Ember World rows retained without country reaggregation. Coal and gas power-sector lifecycle emissions, gas generation share, and hydropower generation remain separate source-reported variables with their source units.',
    uncertainty: 'Ember reconciles national and multi-country generation sources, estimates some latest-year values from monthly data, and calculates fuel-specific lifecycle power emissions using documented IPCC and technology factors. Country coverage, thermal disaggregation, imports, captive power and revised upstream statistics affect the World series.',
    failure_behavior: 'Retain the last validated snapshot and mark stale; reject missing World rows, changed category/unit definitions, duplicate node-year rows or a history below 20 complete years; never treat missing values as zero or relabel Ember Other Fossil as oil-only.',
    exclusions: [
      {
        node_id: 'oil_power_co2_output',
        reason: 'Ember Other Fossil combines oil and petroleum products with manufactured gases and waste, so it is not an exact oil-only measurement.'
      }
    ],
    record_count: records.length,
    record_counts_by_node: counts,
    records: records.sort((left, right) => left.node_id.localeCompare(right.node_id) || left.observation_year - right.observation_year)
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: OUTPUT_PATH, records: records.length, record_counts_by_node: counts }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
