import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchText, parseCsv, readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_URL = 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv';
const CODEBOOK_URL = 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-codebook.csv';
const REPOSITORY_URL = 'https://github.com/owid/energy-data';
const EMBER_DATASET_URL = 'https://ember-energy.org/data/yearly-electricity-data/';
const METRIC_ID = 'low_emissions_electricity_generation_share';

const finite = value => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value, digits = 6) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

async function main() {
  const contracts = await readMetricContracts(ROOT);
  const contract = contracts.clean_electricity;
  if (!contract || contract.metric_id !== METRIC_ID) {
    throw new Error(`Missing or mismatched clean_electricity contract: ${contract?.metric_id || 'absent'}`);
  }

  const [dataText, codebookText] = await Promise.all([fetchText(DATA_URL), fetchText(CODEBOOK_URL)]);
  const sourceRows = parseCsv(dataText);
  const codebook = parseCsv(codebookText);
  const requiredIndicators = ['low_carbon_electricity', 'low_carbon_share_elec', 'electricity_generation'];
  const codebookRows = codebook.filter(row => requiredIndicators.includes(row.column || row.variable || row.indicator));
  if (codebookRows.length !== requiredIndicators.length) {
    throw new Error(`OWID energy codebook is missing required clean-electricity indicators: found ${codebookRows.length}`);
  }

  const records = sourceRows.flatMap(row => {
    const isCountry = /^[A-Z]{3}$/.test(String(row.iso_code || ''));
    const isWorld = row.country === 'World';
    if (!isCountry && !isWorld) return [];
    const year = finite(row.year);
    const generationTwh = finite(row.low_carbon_electricity);
    const sharePct = finite(row.low_carbon_share_elec);
    const totalGenerationTwh = finite(row.electricity_generation);
    if (!Number.isInteger(year) || generationTwh === null || sharePct === null || totalGenerationTwh === null) return [];
    if (sharePct < 0 || sharePct > 100 || generationTwh < 0 || totalGenerationTwh < 0) return [];
    return [{
      record_id: `owid_clean_electricity_${row.iso_code || 'OWID_WRL'}_${year}`,
      metric_id: METRIC_ID,
      measurement_role: isWorld ? 'global_harmonized_primary' : 'country_harmonized_primary',
      country_code: row.iso_code || 'OWID_WRL',
      country_name: row.country,
      observation_year: year,
      low_carbon_generation_gwh: round(generationTwh * 1000, 3),
      low_carbon_generation_source_twh: round(generationTwh),
      low_carbon_generation_share_pct: round(sharePct),
      total_electricity_generation_gwh: round(totalGenerationTwh * 1000, 3),
      source_unit_generation: 'terawatt-hours',
      output_unit_generation: 'gigawatt-hours',
      share_unit: 'percent of total electricity generation',
      low_carbon_boundary: 'renewables plus nuclear electricity as defined by the OWID energy dataset',
      source_reported_uncertainty: null,
      uncertainty_status: 'not_reported_at_observation_level',
      source_locator: `${DATA_URL}; row country=${row.country}; iso_code=${row.iso_code || 'blank'}; year=${year}; columns low_carbon_electricity, low_carbon_share_elec, electricity_generation`
    }];
  }).sort((a, b) => a.country_code.localeCompare(b.country_code) || a.observation_year - b.observation_year);

  if (records.length < 3000) throw new Error(`Implausibly small OWID clean-electricity panel: ${records.length}`);
  const latestYear = Math.max(...records.map(record => record.observation_year));
  const latestRecords = records.filter(record => record.observation_year === latestYear);
  if (!latestRecords.some(record => record.country_code === 'OWID_WRL')) {
    throw new Error(`World clean-electricity record is missing for latest year ${latestYear}`);
  }

  const snapshot = snapshotEnvelope({
    jobId: 'fetch_owid_ember_clean_electricity',
    source: {
      id: 'our_world_in_data_energy_data',
      name: 'Our World in Data Energy Data',
      publisher: 'Our World in Data',
      upstream_publishers: ['Ember', 'Energy Institute'],
      product: 'OWID Energy Data clean-electricity variables with Ember yearly electricity data among the documented upstream sources',
      dataset_url: DATA_URL,
      codebook_url: CODEBOOK_URL,
      repository_url: REPOSITORY_URL,
      upstream_dataset_url: EMBER_DATASET_URL,
      license: 'CC BY 4.0 unless an upstream source specifies otherwise'
    },
    request: {
      selected_columns: ['country', 'iso_code', 'year', 'low_carbon_electricity', 'low_carbon_share_elec', 'electricity_generation'],
      geography_boundary: 'ISO-3 country rows plus the source World aggregate; non-country aggregates excluded',
      temporal_boundary: 'all source years with complete clean-electricity generation, share, and total-generation values'
    },
    contractIds: [METRIC_ID],
    contractBindings: [{
      node_id: 'clean_electricity',
      metric_id: METRIC_ID,
      measurement_role: 'country_and_global_harmonized_clean_electricity_generation_and_share'
    }],
    cadence: 'monthly source check with full-series replacement when OWID updates the Ember-derived yearly electricity data',
    provenance: 'OWID public energy CSV and codebook. The selected low-carbon generation and share fields are harmonized variables whose codebook cites Ember Yearly Electricity Data and the Energy Institute. The CSV does not expose row-level upstream attribution, so the snapshot preserves this mixed-source boundary.',
    uncertainty: 'No observation-level confidence interval is published in the CSV. National reporting, source harmonization, estimates for incomplete recent data, gross-versus-net generation, off-grid and captive generation, imports, revisions, and the renewables-plus-nuclear boundary affect comparison.',
    records,
    sourceSummary: {
      source_row_count: sourceRows.length,
      retained_record_count: records.length,
      country_or_world_entities: new Set(records.map(record => record.country_code)).size,
      first_year: Math.min(...records.map(record => record.observation_year)),
      latest_year: latestYear,
      latest_year_record_count: latestRecords.length,
      codebook_indicators_verified: requiredIndicators,
      source_reported_uncertainty_available: false
    },
    caveats: [
      'Low-carbon electricity is renewables plus nuclear; it is not identical to renewable electricity or zero lifecycle emissions.',
      'Generation is converted exactly from source terawatt-hours to gigawatt-hours by multiplying by 1000; the source value is retained.',
      'Do not attribute every country-year solely to Ember because the harmonized OWID series can also use Energy Institute data.'
    ],
    failureBehavior: 'Retain the last validated full-series snapshot and mark stale; reject missing codebook indicators, implausibly small panels, invalid shares, or a missing latest-year World record; never fill missing country-years with zero.'
  });

  const output = await writeSnapshot(ROOT, 'owid-clean-electricity-snapshot.json', snapshot);
  console.log(JSON.stringify({
    output,
    records: records.length,
    entities: snapshot.source_summary.country_or_world_entities,
    first_year: snapshot.source_summary.first_year,
    latest_year: snapshot.source_summary.latest_year,
    latest_year_records: snapshot.source_summary.latest_year_record_count
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
