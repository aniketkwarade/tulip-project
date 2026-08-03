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
  contracts.biodiversity_intactness_loss?.metric_id,
  contracts.invasive_species_encroachment?.metric_id
].filter(Boolean);
const requestUrl = new URL('https://api.gbif.org/v1/occurrence/search');
requestUrl.search = new URLSearchParams({
  limit: '300',
  offset: '0',
  hasCoordinate: 'true',
  hasGeospatialIssue: 'false',
  occurrenceStatus: 'PRESENT',
  year: '2020,2026'
}).toString();

const payload = await fetchJson(requestUrl);
const records = (payload.results || []).map(record => ({
  key: record.key,
  scientific_name: record.scientificName || null,
  accepted_scientific_name: record.acceptedScientificName || null,
  taxon_key: record.taxonKey || null,
  kingdom: record.kingdom || null,
  basis_of_record: record.basisOfRecord || null,
  event_date: record.eventDate || null,
  year: record.year || null,
  country_code: record.countryCode || null,
  decimal_latitude: record.decimalLatitude ?? null,
  decimal_longitude: record.decimalLongitude ?? null,
  coordinate_uncertainty_m: record.coordinateUncertaintyInMeters ?? null,
  dataset_key: record.datasetKey || null,
  occurrence_status: record.occurrenceStatus || null,
  issues: record.issues || []
}));

const snapshot = snapshotEnvelope({
  jobId: 'fetch_gbif_occurrences',
  source: {
    id: 'gbif_occurrence_api',
    name: 'GBIF Occurrence API',
    publisher: 'Global Biodiversity Information Facility',
    documentation_url: 'https://techdocs.gbif.org/en/openapi/v1/occurrence',
    access: 'open_search_api'
  },
  request: {
    url: requestUrl.toString(),
    bounded_limit: 300,
    filters: {
      has_coordinate: true,
      has_geospatial_issue: false,
      occurrence_status: 'PRESENT',
      year: '2020-2026'
    }
  },
  contractIds,
  contractBindings: [
    { node_id: 'biodiversity_intactness_loss', metric_contract_id: contracts.biodiversity_intactness_loss?.metric_id },
    { node_id: 'invasive_species_encroachment', metric_contract_id: contracts.invasive_species_encroachment?.metric_id }
  ],
  cadence: 'monthly',
  provenance: 'Bounded GBIF occurrence search with quality and coordinate filters retained.',
  uncertainty: 'Presence-only coverage and observer effort vary.',
  records,
  sourceSummary: {
    total_matching_records: payload.count ?? null,
    end_of_records: payload.endOfRecords ?? null,
    returned_records: records.length
  },
  caveats: [
    'This is a bounded evidence snapshot, not a global biodiversity trend by itself.',
    'Occurrence density reflects observation effort and data mobilization as well as ecological state.',
    'GBIF requires asynchronous downloads for complete extracts beyond occurrence-search paging limits.'
  ]
});

const output = await writeSnapshot(ROOT, 'gbif-occurrence-snapshot.json', snapshot);
console.log(JSON.stringify({ output, records: records.length, contracts: contractIds }, null, 2));
