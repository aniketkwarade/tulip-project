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
const metric = contracts.urban_heat_island;
if (!metric?.metric_id) throw new Error('Missing urban_heat_island metric contract. Run npm run export:contracts first.');

const requestUrl = new URL('https://climate.discomap.eea.europa.eu/arcgis/rest/services/UAMV/Urban_Heat_Island_Intensity/MapServer/0/query');
requestUrl.search = new URLSearchParams({
  where: '1=1',
  outFields: '*',
  returnGeometry: 'true',
  outSR: '4326',
  f: 'geojson'
}).toString();

const payload = await fetchJson(requestUrl);
const records = (payload.features || []).map(feature => ({
  feature_id: String(feature.id ?? feature.properties?.OBJECTID_1 ?? ''),
  provider_object_id: feature.properties?.OBJECTID_1 ?? null,
  uhi_intensity_c: Number.isFinite(Number(feature.properties?.Column3)) ? Number(feature.properties.Column3) : null,
  longitude: feature.geometry?.coordinates?.[0] ?? null,
  latitude: feature.geometry?.coordinates?.[1] ?? null,
  geometry_type: feature.geometry?.type || null,
  model_period: '2008-2017',
  statistic: 'spatial P90 urban-minus-rural P10 height-corrected air temperature'
}));

const snapshot = snapshotEnvelope({
  jobId: 'fetch_urban_heat_island_eea',
  source: {
    id: 'eea_urban_heat_island_arcgis',
    name: 'EEA Urban Heat Island Intensity ArcGIS layer',
    publisher: 'European Environment Agency; Copernicus Climate Change Service; VITO',
    documentation_url: 'https://climate.discomap.eea.europa.eu/arcgis/rest/services/UAMV/Urban_Heat_Island_Intensity/MapServer',
    metadata_url: 'https://sdi.eea.europa.eu/catalogue/srv/api/records/8b6a3182-0889-4109-ad22-a021e3126b60',
    access: 'open_arcgis_rest'
  },
  request: {
    url: requestUrl.toString(),
    bounded_limit: 1000,
    filters: { layer: 0, where: '1=1', spatial_reference: 4326 }
  },
  contractIds: [metric.metric_id],
  contractBindings: [{ node_id: 'urban_heat_island', metric_contract_id: metric.metric_id, measurement_role: 'bounded_regional_primary' }],
  cadence: metric.cadence,
  provenance: 'EEA modeled P90 urban heat-island intensity layer with provider object ID and point geometry retained.',
  uncertainty: metric.uncertainty,
  records,
  sourceSummary: {
    returned_features: records.length,
    numeric_intensity_features: records.filter(record => record.uhi_intensity_c !== null).length,
    geographic_scope: '100 European city features',
    model_period: '2008-2017'
  },
  caveats: [
    'This product covers 100 European city features and must not be treated as a global urban series.',
    'The provider layer exposes object IDs and coordinates but not a stable city-name field; downstream joins require reviewed spatial matching.',
    'Surface and canopy-layer UHI products must remain separate; this layer is a modeled air-temperature intensity product.'
  ]
});

const output = await writeSnapshot(ROOT, 'urban-heat-island-snapshot.json', snapshot);
console.log(JSON.stringify({ output, records: records.length, contracts: [metric.metric_id] }, null, 2));
