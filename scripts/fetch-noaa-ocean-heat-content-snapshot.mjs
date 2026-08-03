import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchText, readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERIES_URL = 'https://www.ncei.noaa.gov/data/oceans/woa/DATA_ANALYSIS/3M_HEAT_CONTENT/DATA/basin/yearly/h22-w0-2000m.dat';
const ACCESS_PAGE_URL = 'https://www.ncei.noaa.gov/access/global-ocean-heat-content/basin_heat_data.html';
const PRODUCT_URL = 'https://www.ncei.noaa.gov/products/climate-data-records/global-ocean-heat-content';
const DATASET_DOI = 'https://doi.org/10.7289/V53F4MVP';

const round = (value, digits = 3) => Number(value.toFixed(digits));

function parseSeries(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!/^\s*YEAR\s+WO\s+WOse\s+NH\s+NHse\s+SH\s+SHse\s*$/i.test(lines[0] || '')) {
    throw new Error('NOAA Ocean Heat Content schema changed: expected YEAR WO WOse NH NHse SH SHse header');
  }

  return lines.slice(1).map((line, index) => {
    const values = line.trim().split(/\s+/).map(Number);
    if (values.length !== 7 || values.some(value => !Number.isFinite(value))) {
      throw new Error(`NOAA Ocean Heat Content row ${index + 2} is malformed`);
    }
    const [decimalYear, world, worldSe, northern, northernSe, southern, southernSe] = values;
    const year = Math.floor(decimalYear);
    const toZettajoules = value => round(value * 10);
    const interval95 = (estimate, standardError) => ({
      lower: toZettajoules(estimate - 1.96 * standardError),
      upper: toZettajoules(estimate + 1.96 * standardError)
    });
    const world95 = interval95(world, worldSe);
    return {
      record_id: `noaa_ohc_world_0_2000m_${year}`,
      analysis_year: year,
      source_decimal_year: decimalYear,
      geography: 'World Ocean',
      depth_layer_m: '0-2000',
      ocean_heat_content_anomaly_zj: toZettajoules(world),
      standard_error_zj: toZettajoules(worldSe),
      derived_lower_95_interval_zj: world95.lower,
      derived_upper_95_interval_zj: world95.upper,
      northern_hemisphere_anomaly_zj: toZettajoules(northern),
      northern_hemisphere_standard_error_zj: toZettajoules(northernSe),
      southern_hemisphere_anomaly_zj: toZettajoules(southern),
      southern_hemisphere_standard_error_zj: toZettajoules(southernSe),
      source_unit: '10^22 joules',
      output_unit: 'zettajoules',
      baseline: 'World Ocean Atlas 2009 mean climatological fields for 1955-2006',
      source_locator: SERIES_URL
    };
  });
}

async function main() {
  const contracts = await readMetricContracts(ROOT);
  const contract = contracts.ocean_heat_content;
  if (!contract) throw new Error('Missing node metric contract for ocean_heat_content');

  const sourceText = await fetchText(SERIES_URL);
  const records = parseSeries(sourceText);
  if (records.length < 10) throw new Error(`NOAA Ocean Heat Content returned only ${records.length} annual rows`);
  const latest = records.at(-1);

  const snapshot = snapshotEnvelope({
    jobId: 'fetch_noaa_global_ocean_heat_content',
    source: {
      id: 'noaa_global_ocean_heat_content_cdr',
      name: 'NOAA NCEI Global Ocean Heat Content Climate Data Record',
      publisher: 'NOAA National Centers for Environmental Information',
      product_url: PRODUCT_URL,
      access_page_url: ACCESS_PAGE_URL,
      series_url: SERIES_URL,
      dataset_doi: DATASET_DOI
    },
    request: {
      geography: 'World Ocean',
      depth_layer_m: '0-2000',
      temporal_resolution: 'annual',
      expected_columns: ['YEAR', 'WO', 'WOse', 'NH', 'NHse', 'SH', 'SHse']
    },
    contractIds: [contract.metric_id],
    contractBindings: [{ node_id: 'ocean_heat_content', metric_id: contract.metric_id }],
    cadence: 'quarterly source check with annual-series replacement when NOAA updates the record',
    provenance: 'Official NOAA NCEI World Ocean annual 0-2000 m heat-content anomaly series derived from in-situ subsurface temperature observations and the documented World Ocean Atlas analysis.',
    uncertainty: 'Source standard errors are retained. The 95 percent intervals are transparently derived as estimate plus or minus 1.96 standard errors and are not relabeled as source-reported confidence intervals.',
    records,
    sourceSummary: {
      first_analysis_year: records[0].analysis_year,
      latest_analysis_year: latest.analysis_year,
      annual_records: records.length,
      latest_ocean_heat_content_anomaly_zj: latest.ocean_heat_content_anomaly_zj,
      latest_standard_error_zj: latest.standard_error_zj,
      latest_derived_95_interval_zj: [latest.derived_lower_95_interval_zj, latest.derived_upper_95_interval_zj],
      measurement_boundary: 'Measures global 0-2000 m ocean heat-content anomaly relative to the declared NOAA climatology. It is not sea-surface temperature, a full-depth ocean-energy inventory, or a causal estimate of emissions forcing.'
    },
    caveats: [
      'The source series is an anomaly relative to the NOAA analysis climatology; it is not absolute ocean heat content.',
      'The 0-2000 m layer omits heat below 2000 m.',
      'Sparse historical sampling, XBT bias correction, Argo coverage, objective mapping, and baseline choice affect the record.',
      'Do not compare this series directly with products using a different depth layer or baseline without reconciliation.'
    ],
    failureBehavior: 'Retain the last validated annual series and mark it stale; reject schema changes, nonnumeric rows, or a truncated time series; never fill a missing year with zero or extrapolate the latest anomaly.'
  });

  const output = await writeSnapshot(ROOT, 'noaa-ocean-heat-content-snapshot.json', snapshot);
  console.log(JSON.stringify({ output, records: records.length, latest_year: latest.analysis_year, latest_anomaly_zj: latest.ocean_heat_content_anomaly_zj, latest_standard_error_zj: latest.standard_error_zj }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
