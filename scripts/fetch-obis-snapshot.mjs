import path from 'node:path';
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
  contracts.pelagic_species_redistribution?.metric_id,
  contracts.marine_food_web_simplification?.metric_id
].filter(Boolean);
const requestUrl = new URL('https://api.obis.org/v3/occurrence');
requestUrl.search = new URLSearchParams({
  size: '500',
  startdate: '2020-01-01'
}).toString();

const payload = await fetchJson(requestUrl);
const sourceRecords = payload.results || payload.data || [];
const records = sourceRecords.slice(0, 500).map(record => ({
  id: record.id || record.occurrenceid || null,
  occurrence_id: record.occurrenceID || record.occurrenceid || null,
  scientific_name: record.scientificName || record.scientificname || null,
  accepted_name: record.acceptedName || record.acceptedname || record.scientificName || null,
  aphia_id: record.aphiaID ?? record.aphiaid ?? null,
  event_date: record.eventDate || record.eventdate || null,
  year: record.date_year ?? record.year ?? null,
  decimal_latitude: record.decimalLatitude ?? record.decimallatitude ?? null,
  decimal_longitude: record.decimalLongitude ?? record.decimallongitude ?? null,
  depth_m: record.depth ?? record.minimumDepthInMeters ?? record.minimumdepthinmeters ?? null,
  sea_surface_temperature_c: record.sst ?? null,
  salinity: record.sss ?? null,
  marine_region: record.marine_region || record.waterBody || null,
  dataset_id: record.dataset_id || record.datasetid || null,
  quality_flags: record.flags || []
}));

const snapshot = snapshotEnvelope({
  jobId: 'fetch_obis_occurrences',
  source: {
    id: 'obis_api_v3',
    name: 'OBIS API v3',
    publisher: 'Ocean Biodiversity Information System',
    documentation_url: 'https://api.obis.org/',
    access: 'open_json_api'
  },
  request: {
    url: requestUrl.toString(),
    bounded_limit: 500,
    filters: {
      start_date: '2020-01-01'
    }
  },
  contractIds,
  contractBindings: [
    { node_id: 'pelagic_species_redistribution', metric_contract_id: contracts.pelagic_species_redistribution?.metric_id },
    { node_id: 'marine_food_web_simplification', metric_contract_id: contracts.marine_food_web_simplification?.metric_id }
  ],
  cadence: 'quarterly',
  provenance: 'Bounded OBIS occurrence query with dataset and environmental context retained.',
  uncertainty: 'Presence-only data and uneven sampling can mimic change.',
  records,
  sourceSummary: {
    total_matching_records: payload.total ?? payload.count ?? null,
    returned_records: records.length
  },
  caveats: [
    'Presence-only occurrence records require sampling-aware aggregation before use as a biodiversity or redistribution indicator.',
    'This snapshot preserves environmental and quality fields where supplied but does not infer absence.'
  ]
});

const output = await writeSnapshot(ROOT, 'obis-occurrence-snapshot.json', snapshot);
console.log(JSON.stringify({ output, records: records.length, contracts: contractIds }, null, 2));
