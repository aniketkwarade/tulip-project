import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/global-ocean-stratification-snapshot.json');
const annualValues = [-3.5, -4.72, -4.22, -1.96, -4.06, -4.37, -4.17, -4.05, -3.98, -2.19, -3.86, -5.53, -3.45, -3.81, -5.48, -6.15, -5.55, -3.11, -2.67, -1.89, -2.26, -3.22, -3.36, -1.18, -2.86, -3.37, -2.28, -0.06, -1.35, -1.33, 0.1, 0.51, -1.01, -0.78, -0.96, 1.04, 0.65, 2.22, 3.04, 0.34, 0.47, 1.37, 2.37, 2.55, 1.73, 1.53, 2.31, 0.9, 0.72, 2.36, 1.62, 0.58, 1.25, 1.98, 3.27, 5.14, 4.77, 4.03, 3.61];
const annualSeries = annualValues.map((value, index) => ({ year: 1960 + index, n2_anomaly_1e_minus_7_s_minus_2: value }));
const snapshot = {
  version: 'global_ocean_stratification_observation_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'global_ocean_stratification_observation_assessment',
    name: 'Increasing ocean stratification over the past half-century; Ocean stratification in a warming climate',
    publishers: ['Nature Climate Change', 'Nature Reviews Earth & Environment'],
    urls: ['https://www.nature.com/articles/s41558-020-00918-2', 'https://www.nature.com/articles/s43017-025-00715-5'],
    dois: ['10.1038/s41558-020-00918-2', '10.1038/s43017-025-00715-5']
  },
  ingestion_job_id: 'export_global_ocean_stratification_snapshot',
  metric_contract_ids: ['upper_ocean_density_stratification'],
  contract_bindings: [{ node_id: 'thermal_stratification_intensification', metric_id: 'upper_ocean_density_stratification', measurement_role: 'global_annual_observed_0_2000m_density_stratification_and_upper_ocean_update' }],
  cadence: 'Annual primary-study and assessment-update review.',
  provenance: 'The IAP global annual 0-2,000 m N-squared anomaly series is transcribed from the official Figure 3 source-data workbook. The original XLS checksum, units, uncertainty endpoints and sheet are retained. A 2025 peer-reviewed review supplies a separate three-dataset 0-200 m update through 2024.',
  uncertainty: 'Historical profile density, vertical resolution, interpolation, horizontal sampling, XBT and MBT biases, salinity coverage, gridding, dataset construction and depth-layer selection affect estimates. The source annual panel ends in 2018; the 2024 update is a trend summary, not an annual replacement series.',
  failure_behavior: 'Retain the last checksum-validated annual panel and mark stale. Reject changed checksums, columns, units, years or depth definitions. Never fill missing profiles with zero, splice projections into observations, compare incompatible depth layers as one series or infer local conditions from the global mean.',
  assessment: {
    annual_series: {
      workbook_url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41558-020-00918-2/MediaObjects/41558_2020_918_MOESM3_ESM.xls',
      workbook_sha256: '63e40c563255a6304ba57d30f57261a2a35568766408f2c5a09a567aefdaa43b',
      workbook_sheet: 'Fig.3a',
      source_column: 'Yearly N2 Timeseries(*1e-7) from 1960 to 2018',
      depth_layer_m: [0, 2000],
      unit: '1e-7 s^-2 anomaly',
      baseline: 'Source anomaly convention; do not rebase without the full gridded inputs.',
      start_year: 1960,
      end_year: 2018,
      complete_annual_observations: annualSeries.length,
      latest_p5_uncertainty: 3.45,
      latest_p95_uncertainty: 3.78,
      values: annualSeries
    },
    updated_review: {
      publication_year: 2025,
      observation_start_year: 1960,
      observation_end_year: 2024,
      upper_ocean_depth_layer_m: [0, 200],
      absolute_increase_1e_minus_6_s_minus_2: 6.9,
      absolute_increase_uncertainty_1e_minus_6_s_minus_2: 1.5,
      increase_pct_per_decade: 1.1,
      increase_pct_per_decade_uncertainty: 0.2,
      full_depth_layer_m: [0, 2000],
      full_depth_increase_pct_per_decade: 0.8,
      full_depth_increase_pct_per_decade_uncertainty: 0.1,
      dataset_count: 3,
      source_locator: 'Nature Reviews Earth & Environment 2025, Table 1 and observed-changes text.'
    },
    geographic_scope: 'Global ocean',
    global_extent_normalized: 1
  },
  excluded_from_scoring: ['future SSP projections', 'local or basin inference', '0-200 m absolute increase mixed into the 0-2,000 m annual anomaly series', 'missing observations as zero']
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, annual_observations: annualSeries.length, latest_year: annualSeries.at(-1).year }, null, 2));
