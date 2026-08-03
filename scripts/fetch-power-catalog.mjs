import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'power-catalog.json');
const REFRESH_DAYS = 42;

const QUERY_GROUPS = [
  {
    id: 'humid_heat_water',
    label: 'Humid heat and water stress',
    location: { label: 'Dhaka, Bangladesh', latitude: 23.8103, longitude: 90.4125 },
    community: 'RE',
    parameters: ['T2M', 'RH2M', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN'],
    primary_spheres: ['atmosphere', 'agriculture', 'sociopolitical'],
    match_terms: ['heat', 'humidity', 'wet bulb', 'monsoon', 'precipitation', 'human exposure', 'disease', 'flood'],
    node_hints: ['global_temperature', 'wet_bulb_heat', 'migration', 'food']
  },
  {
    id: 'arid_drought_fire',
    label: 'Arid heat, drought, and fire weather',
    location: { label: 'Phoenix, United States', latitude: 33.4484, longitude: -112.074 },
    community: 'RE',
    parameters: ['T2M', 'RH2M', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN'],
    primary_spheres: ['agriculture', 'biosphere', 'energy', 'sociopolitical'],
    match_terms: ['drought', 'aridity', 'wildfire', 'water stress', 'crop stress', 'resource depletion', 'cooling water'],
    node_hints: ['resource_depletion', 'cooling_water_competition', 'food']
  },
  {
    id: 'cryosphere_margin',
    label: 'Cryosphere margin baseline',
    location: { label: 'Nuuk, Greenland', latitude: 64.1835, longitude: -51.7216 },
    community: 'RE',
    parameters: ['T2M', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN'],
    primary_spheres: ['cryosphere', 'oceans'],
    match_terms: ['ice', 'glacier', 'snow', 'permafrost', 'sea ice', 'thaw', 'albedo'],
    node_hints: ['permafrost_thaw', 'environ_anomalies']
  },
  {
    id: 'grid_cooling_load',
    label: 'Grid cooling and compute load baseline',
    location: { label: 'Ashburn, United States', latitude: 39.0438, longitude: -77.4874 },
    community: 'RE',
    parameters: ['T2M', 'RH2M', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN'],
    primary_spheres: ['energy', 'sociopolitical'],
    match_terms: ['data center', 'ai compute', 'electricity demand', 'cooling load', 'grid stress', 'heat exposure'],
    node_hints: ['ai_data_centers', 'data_centers', 'cooling_water_competition']
  }
];

function summarizeValue(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
}

function buildApiUrl(group) {
  const params = new URLSearchParams({
    parameters: group.parameters.join(','),
    community: group.community,
    longitude: String(group.location.longitude),
    latitude: String(group.location.latitude),
    format: 'JSON'
  });
  return `https://power.larc.nasa.gov/api/temporal/climatology/point?${params.toString()}`;
}

function buildDocsUrl() {
  return 'https://power.larc.nasa.gov/docs/services/api/';
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return response.json();
}

function getAnnual(parameterBlock, key) {
  return summarizeValue(parameterBlock?.[key]?.ANN ?? null);
}

async function fetchGroup(group) {
  const url = buildApiUrl(group);
  const payload = await fetchJson(url);
  const parameterBlock = payload?.properties?.parameter || {};
  const header = payload?.header || {};

  return {
    id: group.id,
    label: group.label,
    community: group.community,
    location: group.location,
    docs_url: buildDocsUrl(),
    api_url: url,
    source_api: 'https://power.larc.nasa.gov/api/temporal/climatology/point',
    primary_spheres: [...group.primary_spheres],
    match_terms: [...group.match_terms],
    node_hints: [...group.node_hints],
    metrics: {
      annual_air_temperature_c: getAnnual(parameterBlock, 'T2M'),
      annual_relative_humidity_pct: getAnnual(parameterBlock, 'RH2M'),
      annual_precipitation_mm_day: getAnnual(parameterBlock, 'PRECTOTCORR'),
      annual_surface_solar_kwh_m2_day: getAnnual(parameterBlock, 'ALLSKY_SFC_SW_DWN')
    },
    monthly: parameterBlock,
    api_header: {
      title: header?.title || null,
      version: header?.api?.version || null,
      fill_value: header?.fill_value ?? null,
      start: header?.start || null,
      end: header?.end || null
    }
  };
}

async function main() {
  const baselines = [];

  for (const group of QUERY_GROUPS) {
    baselines.push(await fetchGroup(group));
  }

  const catalog = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    source: {
      id: 'nasa_power_open_api',
      name: 'NASA POWER',
      docs_url: buildDocsUrl(),
      base_url: 'https://power.larc.nasa.gov/api/temporal/climatology/point',
      access: 'open_api'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'POWER climatology products are stable baseline surfaces and fit the platform refresh cadence better than day-to-day live weather feeds.'
    },
    query_groups: QUERY_GROUPS,
    baselines
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    baseline_count: baselines.length,
    updated_at: catalog.updated_at
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
