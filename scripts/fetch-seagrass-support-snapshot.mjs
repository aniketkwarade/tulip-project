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
const metric = contracts.seagrass_meadow_decline;
if (!metric?.metric_id) throw new Error('Missing seagrass_meadow_decline metric contract. Run npm run export:contracts first.');

const taxa = ['Zostera marina', 'Posidonia oceanica', 'Thalassia testudinum'];
const queries = taxa.map(name => {
  const url = new URL('https://api.obis.org/v3/occurrence');
  url.search = new URLSearchParams({ scientificname: name, size: '150', startdate: '2020-01-01' }).toString();
  return { name, url };
});
const payloads = await Promise.all(queries.map(async query => ({
  ...query,
  payload: await fetchJson(query.url)
})));

const records = payloads.flatMap(({ name, payload }) => (payload.results || []).map(record => ({
  id: record.id || record.occurrenceID || null,
  requested_taxon: name,
  scientific_name: record.scientificName || null,
  accepted_name: record.acceptedName || record.scientificName || null,
  aphia_id: record.aphiaID ?? null,
  event_date: record.eventDate || null,
  year: record.date_year ?? record.year ?? null,
  decimal_latitude: record.decimalLatitude ?? null,
  decimal_longitude: record.decimalLongitude ?? null,
  depth_m: record.depth ?? record.minimumDepthInMeters ?? null,
  country_code: record.countryCode || null,
  dataset_id: record.dataset_id || record.datasetID || null,
  dataset_name: record.datasetName || null,
  occurrence_status: record.occurrenceStatus || null,
  quality_flags: record.flags || []
})));

const snapshot = snapshotEnvelope({
  jobId: 'fetch_seagrass_support',
  source: {
    id: 'obis_api_v3',
    name: 'OBIS API v3',
    publisher: 'Ocean Biodiversity Information System',
    documentation_url: 'https://api.obis.org/',
    access: 'open_json_api'
  },
  request: {
    urls: queries.map(query => query.url.toString()),
    bounded_limit_per_taxon: 150,
    filters: { taxa, start_date: '2020-01-01' }
  },
  contractIds: [metric.metric_id],
  contractBindings: [{ node_id: 'seagrass_meadow_decline', metric_contract_id: metric.metric_id, measurement_role: 'supporting_occurrence_evidence_only' }],
  cadence: metric.cadence,
  provenance: 'Taxon-bounded OBIS occurrence support with observation, dataset, coordinate, depth, and quality fields retained.',
  uncertainty: metric.uncertainty,
  records,
  sourceSummary: {
    returned_records: records.length,
    requested_taxa: taxa,
    total_matching_by_taxon: Object.fromEntries(payloads.map(item => [item.name, item.payload.total ?? null]))
  },
  caveats: [
    'This snapshot is supporting occurrence evidence only and cannot measure seagrass meadow area, absence, or decline.',
    'Primary scoring requires comparable curated habitat polygons from at least two mapping periods.',
    'Observer effort, dataset mobilization, and taxonomic coverage vary across regions and years.'
  ]
});

const output = await writeSnapshot(ROOT, 'seagrass-support-snapshot.json', snapshot);
console.log(JSON.stringify({ output, records: records.length, contracts: [metric.metric_id] }, null, 2));
