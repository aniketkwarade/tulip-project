import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchText,
  parseCsv,
  readMetricContracts,
  snapshotEnvelope,
  writeSnapshot
} from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contracts = await readMetricContracts(ROOT);
const metric = contracts.nutrient_pollution;
if (!metric?.metric_id) throw new Error('Missing nutrient_pollution metric contract. Run npm run export:contracts first.');

const startYear = Number(process.env.NUTRIENT_SAMPLE_START_YEAR || new Date().getUTCFullYear());
const stateFips = process.env.NUTRIENT_SAMPLE_STATE_FIPS || 'US:06';
const requestUrl = new URL('https://api.waterdata.usgs.gov/samples-data/results/narrow');
requestUrl.searchParams.set('mimeType', 'text/csv');
requestUrl.searchParams.set('organizationIdentifier', 'USGS');
requestUrl.searchParams.set('activityMediaName', 'Water');
requestUrl.searchParams.append('usgsPCode', '00600');
requestUrl.searchParams.append('usgsPCode', '00665');
requestUrl.searchParams.set('activityStartDateLower', `${startYear}-01-01`);
requestUrl.searchParams.set('stateFips', stateFips);

const csv = await fetchText(requestUrl);
const records = parseCsv(csv).map(row => ({
  result_id: row.Result_MeasureIdentifier || `${row.Location_Identifier}:${row.Activity_StartDate}:${row.USGSpcode}`,
  monitoring_location_id: row.Location_Identifier || null,
  monitoring_location_name: row.Location_Name || null,
  state: row.Location_State || null,
  huc8: row.Location_HUCEightDigitCode || null,
  latitude: Number.isFinite(Number(row.Location_Latitude)) ? Number(row.Location_Latitude) : null,
  longitude: Number.isFinite(Number(row.Location_Longitude)) ? Number(row.Location_Longitude) : null,
  sample_date: row.Activity_StartDate || null,
  characteristic: row.Result_Characteristic || null,
  sample_fraction: row.Result_SampleFraction || null,
  parameter_code: row.USGSpcode || null,
  value: Number.isFinite(Number(row.Result_Measure)) ? Number(row.Result_Measure) : null,
  unit: row.Result_MeasureUnit || row.DetectionLimit_MeasureUnitA || null,
  detection_condition: row.Result_ResultDetectionCondition || null,
  detection_limit: Number.isFinite(Number(row.DetectionLimit_MeasureA)) ? Number(row.DetectionLimit_MeasureA) : null,
  detection_limit_unit: row.DetectionLimit_MeasureUnitA || null,
  status: row.Result_MeasureStatusIdentifier || null,
  method_id: row.ResultAnalyticalMethod_Identifier || null,
  method_name: row.ResultAnalyticalMethod_Name || null,
  last_changed: row.LastChangeDate || null
}));

const snapshot = snapshotEnvelope({
  jobId: 'fetch_nutrient_pollution_samples',
  source: {
    id: 'usgs_samples_data_api',
    name: 'USGS Samples Data API',
    publisher: 'United States Geological Survey',
    documentation_url: 'https://api.waterdata.usgs.gov/samples-data/docs',
    access: 'open_csv_api'
  },
  request: {
    url: requestUrl.toString(),
    filters: {
      organization: 'USGS',
      medium: 'Water',
      parameter_codes: ['00600', '00665'],
      start_year: startYear,
      state_fips: stateFips
    }
  },
  contractIds: [metric.metric_id],
  contractBindings: [{ node_id: 'nutrient_pollution', metric_contract_id: metric.metric_id, measurement_role: 'bounded_regional_primary' }],
  cadence: metric.cadence,
  provenance: 'USGS Samples Data API narrow-profile results with locations, dates, parameter codes, units, detection limits, status, and methods retained.',
  uncertainty: metric.uncertainty,
  records,
  sourceSummary: {
    returned_records: records.length,
    numeric_results: records.filter(record => record.value !== null).length,
    monitoring_locations: new Set(records.map(record => record.monitoring_location_id).filter(Boolean)).size,
    parameter_codes: [...new Set(records.map(record => record.parameter_code).filter(Boolean))]
  },
  caveats: [
    'This is a California pilot and must not be extrapolated globally.',
    'Total nitrogen and total phosphorus values must remain separated by parameter, fraction, unit, and method before aggregation.',
    'Non-detects and provisional results are retained and must not be silently converted to zero.'
  ]
});

const output = await writeSnapshot(ROOT, 'nutrient-pollution-snapshot.json', snapshot);
console.log(JSON.stringify({ output, records: records.length, contracts: [metric.metric_id] }, null, 2));
