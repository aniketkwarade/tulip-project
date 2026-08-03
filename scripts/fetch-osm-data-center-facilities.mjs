import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'data-center-facilities-osm.json');
const OVERPASS_API_URL = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';

const QUERY = `[out:json][timeout:180];
(
  nwr["telecom"="data_center"];
  nwr["building"="data_center"];
  nwr["industrial"="data_centre"];
  nwr["proposed:telecom"="data_center"];
  nwr["construction:telecom"="data_center"];
);
out center tags;`;

const RETAINED_TAGS = [
  'name',
  'operator',
  'operator:wikidata',
  'owner',
  'owner:wikidata',
  'brand',
  'brand:wikidata',
  'ref',
  'website',
  'contact:website',
  'telecom',
  'building',
  'industrial',
  'landuse',
  'start_date',
  'opening_date',
  'proposed:telecom',
  'construction:telecom',
  'construction',
  'addr:housenumber',
  'addr:street',
  'addr:city',
  'addr:state',
  'addr:postcode',
  'addr:country'
];

function coordinatesFor(element) {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return {
    latitude,
    longitude,
    basis: element.type === 'node' ? 'mapped_node' : 'overpass_geometry_center'
  };
}

function lifecycleFor(tags) {
  if (tags['construction:telecom'] === 'data_center' || tags.construction === 'data_center') {
    return 'under_construction';
  }
  if (tags['proposed:telecom'] === 'data_center') return 'planned';
  return 'mapped_current_or_unspecified';
}

function facilityClassesFor(tags) {
  const classes = [];
  if (tags.telecom === 'data_center') classes.push('telecom_data_center');
  if (tags.building === 'data_center') classes.push('purpose_built_data_center');
  if (tags.industrial === 'data_centre') classes.push('industrial_data_center_site');
  if (tags['proposed:telecom'] === 'data_center') classes.push('proposed_data_center');
  if (tags['construction:telecom'] === 'data_center' || tags.construction === 'data_center') {
    classes.push('data_center_under_construction');
  }
  return classes;
}

function retainedTags(tags) {
  return Object.fromEntries(RETAINED_TAGS.filter(key => tags[key] !== undefined).map(key => [key, tags[key]]));
}

function normalizeElement(element) {
  const tags = element.tags || {};
  const coordinates = coordinatesFor(element);
  if (!coordinates) return null;

  return {
    record_id: `osm_${element.type}_${element.id}`,
    source_record: {
      osm_element_type: element.type,
      osm_element_id: element.id,
      osm_url: `https://www.openstreetmap.org/${element.type}/${element.id}`
    },
    name: tags.name || null,
    operator: tags.operator || tags.brand || null,
    owner: tags.owner || null,
    reference: tags.ref || null,
    website: tags.website || tags['contact:website'] || null,
    lifecycle: lifecycleFor(tags),
    facility_classes: facilityClassesFor(tags),
    coordinates,
    address: {
      housenumber: tags['addr:housenumber'] || null,
      street: tags['addr:street'] || null,
      city: tags['addr:city'] || null,
      state: tags['addr:state'] || null,
      postcode: tags['addr:postcode'] || null,
      country: tags['addr:country'] || null
    },
    source_tags: retainedTags(tags)
  };
}

function countBy(records, accessor) {
  return Object.fromEntries(
    [...records.reduce((counts, record) => {
      const key = accessor(record);
      counts.set(key, (counts.get(key) || 0) + 1);
      return counts;
    }, new Map())].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

async function main() {
  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'LostPlanet data-center research (facility inventory; contact via repository owner)'
    },
    body: new URLSearchParams({ data: QUERY })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Overpass request failed: ${response.status} ${response.statusText}\n${body.slice(0, 500)}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.elements)) throw new Error('Overpass response does not contain an elements array');

  const normalizedRecords = payload.elements
    .map(normalizeElement)
    .filter(Boolean);
  const records = [...new Map(normalizedRecords.map(record => [record.record_id, record])).values()]
    .sort((a, b) => a.record_id.localeCompare(b.record_id));

  if (records.length < 10) throw new Error(`Implausibly small OpenStreetMap data-center inventory: ${records.length}`);

  const snapshot = {
    version: 'osm_data_center_facilities_v1',
    captured_at: new Date().toISOString(),
    source: {
      id: 'openstreetmap_data_center_facilities',
      name: 'OpenStreetMap data-center features via Overpass API',
      database_url: 'https://www.openstreetmap.org/',
      api_url: OVERPASS_API_URL,
      tagging_documentation_url: 'https://wiki.openstreetmap.org/wiki/Tag:telecom%3Ddata_center',
      copyright_url: 'https://www.openstreetmap.org/copyright',
      attribution: '© OpenStreetMap contributors',
      license: 'Open Database License (ODbL) 1.0',
      license_url: 'https://opendatacommons.org/licenses/odbl/1-0/'
    },
    query: QUERY,
    summary: {
      record_count: records.length,
      element_types: countBy(records, record => record.source_record.osm_element_type),
      lifecycle: countBy(records, record => record.lifecycle),
      records_with_name: records.filter(record => record.name).length,
      records_with_operator: records.filter(record => record.operator).length,
      records_with_country_tag: records.filter(record => record.address.country).length
    },
    methodology: {
      scope: 'Global OSM elements explicitly tagged as current, proposed, or under-construction data centers using the documented telecom, building, or industrial tags.',
      coordinates: 'Node coordinates are retained directly; way and relation coordinates are Overpass-computed geometry centers and are not parcel centroids.',
      deduplication: 'One record per unique OSM element. Different elements at one campus remain separate because a site, building, and operator facility may each be independently mapped.',
      lifecycle_boundary: 'Only explicit proposed or construction tags are classified as planned or under construction. All other records are current-or-unspecified, not verified operational facilities.',
      capacity_boundary: 'No power, IT load, PUE, water use, emissions, or facility capacity is inferred from presence, geometry, name, operator, or building area.',
      downstream_join_guidance: 'Use coordinates for spatial joins to grid, water-stress, heat, flood, and administrative layers. Preserve source IDs, coordinate basis, lifecycle, and ODbL attribution in derived outputs.'
    },
    caveats: [
      'OpenStreetMap is community-maintained and incomplete; absence is not evidence that no data center exists.',
      'One physical campus may appear as a site relation plus several buildings, while some facilities appear only as a point.',
      'Operator, owner, lifecycle, address, and name fields are voluntary and may be missing or stale.',
      'Sensitive or deliberately undisclosed facilities will be underrepresented.',
      'This snapshot is an ODbL-derived database. Public redistribution and substantial derived databases must preserve the applicable attribution and share-alike obligations.'
    ],
    records
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${records.length} OpenStreetMap data-center records to ${OUTPUT_PATH}`);
}

await main();
