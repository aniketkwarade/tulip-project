import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  fetchJson,
  readMetricContracts,
  snapshotEnvelope,
  writeSnapshot
} from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contracts = await readMetricContracts(ROOT);
const contractIds = [
  contracts.river_flow_regime_shift?.metric_id,
  contracts.groundwater_depletion?.metric_id
].filter(Boolean);
const requestUrl = new URL('https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-daily/items');
requestUrl.search = new URLSearchParams({
  f: 'json',
  limit: '500',
  parameter_code: '00060',
  statistic_id: '00003'
}).toString();
const apiKey = process.env.USGS_WATER_API_KEY;

const payload = await fetchJson(requestUrl, {
  headers: apiKey ? { 'X-Api-Key': apiKey } : {}
});
const records = (payload.features || []).slice(0, 500).map(feature => ({
  feature_id: feature.id,
  monitoring_location_id: feature.properties?.monitoring_location_id || null,
  time_series_id: feature.properties?.timeseries_id || feature.properties?.time_series_id || null,
  parameter_code: feature.properties?.parameter_code || null,
  statistic_id: feature.properties?.statistic_id || null,
  time: feature.properties?.time || null,
  value: Number.isFinite(Number(feature.properties?.value)) ? Number(feature.properties.value) : null,
  raw_value: feature.properties?.value ?? null,
  unit: feature.properties?.unit_of_measure || null,
  approval_status: feature.properties?.approval_status || feature.properties?.approvals_status || [],
  qualifier: feature.properties?.qualifier || null,
  last_modified: feature.properties?.last_modified || null,
  longitude: feature.geometry?.coordinates?.[0] ?? null,
  latitude: feature.geometry?.coordinates?.[1] ?? null
}));

const snapshot = snapshotEnvelope({
  jobId: 'fetch_usgs_water_observations',
  source: {
    id: 'usgs_water_data_ogc_api',
    name: 'USGS Water Data OGC API',
    publisher: 'United States Geological Survey',
    documentation_url: 'https://api.waterdata.usgs.gov/docs/ogcapi/',
    access: apiKey ? 'api_key_higher_rate_limit' : 'open_default_rate_limit'
  },
  request: {
    url: requestUrl.toString(),
    bounded_limit: 500,
    filters: {
      parameter_code: '00060',
      statistic_id: '00003',
      collection: 'latest-daily'
    }
  },
  contractIds,
  contractBindings: [
    { node_id: 'river_flow_regime_shift', metric_contract_id: contracts.river_flow_regime_shift?.metric_id },
    { node_id: 'groundwater_depletion', metric_contract_id: contracts.groundwater_depletion?.metric_id }
  ],
  cadence: 'daily',
  provenance: 'Bounded USGS OGC daily station observations with provisional status retained.',
  uncertainty: 'United States coverage and provisional revisions.',
  records,
  sourceSummary: {
    number_matched: payload.numberMatched ?? null,
    number_returned: payload.numberReturned ?? records.length,
    returned_records: records.length,
    response_timestamp: payload.timeStamp || null
  },
  caveats: [
    'This bounded snapshot is United States station evidence and must not be extrapolated as a global hydrologic indicator.',
    'Provisional observations can be revised; approval status and last-modified metadata are retained.',
    'The API represents many numeric values as strings, so the normalized value and raw source value are both preserved.'
  ]
});

const output = await writeSnapshot(ROOT, 'usgs-water-snapshot.json', snapshot);
console.log(JSON.stringify({ output, records: records.length, contracts: contractIds }, null, 2));
