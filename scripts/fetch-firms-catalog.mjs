import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'firms-catalog.json');
const REFRESH_DAYS = 14;

const FIRMS_URL = 'https://firms.modaps.eosdis.nasa.gov/api/';
const AREA_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/';
const DATA_AVAILABILITY_URL = 'https://firms.modaps.eosdis.nasa.gov/api/data_availability/';

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)'
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return response.text();
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `https://firms.modaps.eosdis.nasa.gov${url}`;
  return new URL(url, FIRMS_URL).toString();
}

function extractLink(html, keyword) {
  const pattern = new RegExp(`<a[^>]+href="([^"]+)"[^>]*>\\s*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<\\/a>`, 'i');
  const match = html.match(pattern);
  return absoluteUrl(match?.[1] || null);
}

function extractApiVersion(html) {
  const match = html.match(/API Version:\s*([0-9.]+)/i);
  return match?.[1] || null;
}

function extractSelectOptions(html, selectId) {
  const selectPattern = new RegExp(`<select[^>]+id="${selectId}"[^>]*>([\\s\\S]*?)<\\/select>`, 'i');
  const selectHtml = html.match(selectPattern)?.[1] || '';
  return Array.from(selectHtml.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/gi))
    .map(([, id, label]) => ({
      id,
      label: normalizeWhitespace(label)
    }))
    .filter(option => option.id && option.id !== 'ALL');
}

async function main() {
  const [html, areaHtml, dataAvailabilityHtml] = await Promise.all([
    fetchText(FIRMS_URL),
    fetchText(AREA_URL),
    fetchText(DATA_AVAILABILITY_URL)
  ]);

  const normalized = normalizeWhitespace(html);
  const areaNormalized = normalizeWhitespace(areaHtml);
  const dataAvailabilityNormalized = normalizeWhitespace(dataAvailabilityHtml);
  const sensorOptions = extractSelectOptions(areaHtml, 'source');
  const apiVersion = extractApiVersion(html);

  const tools = [
    {
      id: 'firms_map',
      label: 'NASA FIRMS Map',
      url: 'https://firms.modaps.eosdis.nasa.gov/map/',
      type: 'map',
      access: 'open'
    },
    {
      id: 'api_directory',
      label: 'API directory',
      url: FIRMS_URL,
      type: 'portal',
      access: 'open'
    },
    {
      id: 'area',
      label: 'Area hotspots CSV',
      url: extractLink(html, 'area') || AREA_URL,
      type: 'api',
      access: 'key_required',
      notes: 'Bounding-box or world fire hotspot query in CSV format.'
    },
    {
      id: 'data_availability',
      label: 'Data availability',
      url: extractLink(html, 'data_availability') || DATA_AVAILABILITY_URL,
      type: 'api',
      access: 'key_required',
      notes: 'Sensor-by-sensor date availability for near-real-time and standard-processing products.'
    },
    {
      id: 'kml_fire_footprints',
      label: 'KML fire footprints',
      url: extractLink(html, 'kml_fire_footprints'),
      type: 'api',
      access: 'key_required',
      notes: 'KML fire-detection footprint service.'
    },
    {
      id: 'map_key',
      label: 'MAP_KEY setup',
      url: extractLink(html, 'map_key'),
      type: 'account',
      access: 'open',
      notes: 'MAP_KEY registration/setup is required for API and mapservice access.'
    },
    {
      id: 'missing_data',
      label: 'Missing satellite data',
      url: extractLink(html, 'missing_data'),
      type: 'status',
      access: 'open',
      notes: 'Calendar of dates with missing satellite data.'
    },
    {
      id: 'code_examples',
      label: 'API code examples',
      url: absoluteUrl('/academy/'),
      type: 'documentation',
      access: 'open',
      notes: 'Official FIRMS examples and training pages.'
    }
  ].filter(item => item.url);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'active_fire_operational',
    source: {
      id: 'nasa_firms',
      name: 'NASA FIRMS',
      url: FIRMS_URL,
      publisher: 'NASA LANCE / FIRMS',
      access: 'mixed'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'FIRMS is high-frequency, but TULIP should use it as a discovery and support layer or via frozen snapshots rather than direct client polling.'
    },
    use_guidance: {
      primary_role: 'Use for wildfire, deforestation, and land-hazard context where near-real-time fire detections materially strengthen the node.',
      caution: 'Some endpoints require MAP_KEY setup, so treat FIRMS as key-required operational support rather than browser-safe open JSON.'
    },
    overview: {
      title: 'NASA FIRMS',
      subtitle: 'Near-real-time active fire monitoring and download support from NASA LANCE.',
      api_version: apiVersion,
      api_surface_count: tools.length,
      sensor_count: sensorOptions.length
    },
    access_model: {
      map_key_required: normalized.toLowerCase().includes('map_key'),
      browser_safe: false
    },
    tools,
    curated_products: [
      {
        id: 'active_fire_area_csv',
        label: 'Active fire area query',
        role: 'bbox hotspot query',
        endpoint_template: '/api/area/csv/[MAP_KEY]/[SOURCE]/[AREA_COORDINATES]/[DAY_RANGE]/[DATE]',
        notes: 'Returns fire hotspots for a bounding box or the full world extent, with up to five days per query window.'
      },
      {
        id: 'sensor_availability',
        label: 'Sensor data availability',
        role: 'operational availability check',
        endpoint_template: '/api/data_availability/csv/[MAP_KEY]/[SENSOR]',
        notes: 'Confirms which dates are currently available for standard-processing and near-real-time products.'
      },
      {
        id: 'missing_satellite_data',
        label: 'Missing satellite data calendar',
        role: 'service caveat',
        endpoint_template: '/api/missing_data/',
        notes: 'Carries missing-data status forward so nodes do not overstate coverage.'
      },
      {
        id: 'kml_fire_footprints',
        label: 'KML fire footprints',
        role: 'mapping support',
        endpoint_template: '/api/kml_fire_footprints/',
        notes: 'Provides a fire footprint surface for mapping and visual context.'
      }
    ],
    sensors: sensorOptions,
    operational_characteristics: {
      area_query_max_day_range: areaNormalized.includes('1 .. 5') ? 5 : null,
      supports_world_extent: areaHtml.includes("world <span class=\"api_item_desc\">- [-180,-90,180,90]</span>"),
      ultra_real_time_note: areaNormalized.includes('less than 60 seconds')
        ? 'FIRMS states that Ultra Real-Time data is available in less than 60 seconds after satellite flyover for much of the US and Canada.'
        : null,
      replacement_policy: areaNormalized.includes('RT and URT data are removed')
        ? 'RT and URT detections are replaced when matching NRT detections arrive or when older than 6 hours.'
        : null
    },
    service_caveats: [
      normalized.includes('Feature currently not available')
        ? 'Country and countries API routes are currently flagged as unavailable on the official API directory.'
        : null,
      dataAvailabilityNormalized.includes('request free MAP_KEY')
        ? 'Operational CSV downloads require a free MAP_KEY.'
        : null
    ].filter(Boolean),
    supported_questions: [
      'Which land-system nodes should inherit active-fire operational support by default?',
      'Where should fire-monitoring evidence stay clearly operational rather than sounding like a global truth feed?',
      'Which wildfire and deforestation nodes need explicit MAP_KEY caveats in their attached evidence?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    tool_count: snapshot.tools.length,
    sensor_count: snapshot.sensors.length,
    map_key_required: snapshot.access_model.map_key_required
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
