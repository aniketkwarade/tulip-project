import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'grace-catalog.json');
const REFRESH_DAYS = 42;

const QUERY_GROUPS = [
  {
    id: 'mascon_core',
    label: 'JPL Mascon core',
    keyword: 'grace mascon',
    limit: 8,
    primary_spheres: ['cryosphere', 'oceans', 'agriculture', 'sociopolitical'],
    match_terms: ['grace mascon', 'mass anomaly', 'equivalent water height'],
    node_hints: ['resource_depletion', 'permafrost_thaw', 'ocean_acidification', 'marine_fisheries_collapse', 'cooling_water_competition']
  },
  {
    id: 'groundwater_storage',
    label: 'Groundwater and soil moisture',
    keyword: 'grace groundwater',
    limit: 6,
    primary_spheres: ['agriculture', 'sociopolitical'],
    match_terms: ['groundwater', 'soil moisture', 'water storage', 'drought'],
    node_hints: ['resource_depletion', 'industry_farming', 'food', 'crop_yield_volatility', 'cooling_water_competition']
  },
  {
    id: 'land_water_storage',
    label: 'Land water storage',
    keyword: 'grace land water equivalent thickness',
    limit: 6,
    primary_spheres: ['agriculture', 'sociopolitical', 'biosphere'],
    match_terms: ['land water storage', 'water equivalent thickness', 'hydrology'],
    node_hints: ['resource_depletion', 'food', 'deforestation', 'crop_yield_volatility']
  },
  {
    id: 'greenland_mass',
    label: 'Greenland mass anomaly',
    keyword: 'greenland mass tellus mascon grace',
    limit: 4,
    primary_spheres: ['cryosphere'],
    match_terms: ['greenland ice sheet', 'greenland mass', 'mascon'],
    node_hints: ['permafrost_thaw', 'temp', 'environ_anomalies']
  },
  {
    id: 'antarctica_mass',
    label: 'Antarctica mass anomaly',
    keyword: 'antarctica mass tellus mascon grace',
    limit: 4,
    primary_spheres: ['cryosphere', 'oceans'],
    match_terms: ['antarctica mass', 'ice sheet mass', 'sea level'],
    node_hints: ['permafrost_thaw', 'temp', 'environ_anomalies']
  },
  {
    id: 'ocean_mass',
    label: 'Ocean mass anomaly',
    keyword: 'ocean mass tellus mascon grace',
    limit: 4,
    primary_spheres: ['oceans', 'sociopolitical'],
    match_terms: ['ocean mass', 'sea level', 'ocean bottom pressure'],
    node_hints: ['ocean_acidification', 'marine_fisheries_collapse', 'environ_anomalies']
  }
];

function summarize(value, max = 260) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function buildSearchUrl(entry) {
  const shortName = entry.short_name || entry.dataset_id || entry.id || '';
  return `https://search.earthdata.nasa.gov/search?q=${encodeURIComponent(shortName)}`;
}

function preferredLink(entry) {
  const links = Array.isArray(entry.links) ? entry.links : [];
  const ranked = links.find(link => String(link?.href || '').startsWith('https://search.earthdata.nasa.gov'))
    || links.find(link => String(link?.href || '').startsWith('https://'))
    || null;
  return ranked?.href || buildSearchUrl(entry);
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

async function fetchQueryGroup(group) {
  const params = new URLSearchParams({
    keyword: group.keyword,
    page_size: String(group.limit)
  });
  const url = `https://cmr.earthdata.nasa.gov/search/collections.json?${params.toString()}`;
  const payload = await fetchJson(url);
  const entries = payload?.feed?.entry || [];

  return entries.map(entry => ({
    id: entry.id,
    short_name: entry.short_name || null,
    version_id: entry.version_id || null,
    title: entry.title || entry.dataset_id || entry.short_name || 'Untitled GRACE collection',
    summary: summarize(entry.summary || entry.abstract || entry.dataset_id || ''),
    archive_center: entry.archive_center || null,
    time_start: entry.time_start || null,
    time_end: entry.time_end || null,
    updated: entry.updated || null,
    search_url: buildSearchUrl(entry),
    access_url: preferredLink(entry),
    source_api: 'https://cmr.earthdata.nasa.gov/search/collections.json',
    query_group_id: group.id,
    query_label: group.label,
    query_keyword: group.keyword,
    primary_spheres: [...group.primary_spheres],
    match_terms: [...group.match_terms],
    node_hints: [...group.node_hints]
  }));
}

function mergeCollections(rows) {
  const byId = new Map();

  rows.forEach(row => {
    const existing = byId.get(row.id);
    if (!existing) {
      byId.set(row.id, {
        ...row,
        primary_spheres: [...row.primary_spheres],
        match_terms: [...row.match_terms],
        node_hints: [...row.node_hints],
        query_groups: [row.query_group_id]
      });
      return;
    }

    existing.primary_spheres = Array.from(new Set([...existing.primary_spheres, ...row.primary_spheres]));
    existing.match_terms = Array.from(new Set([...existing.match_terms, ...row.match_terms]));
    existing.node_hints = Array.from(new Set([...existing.node_hints, ...row.node_hints]));
    existing.query_groups = Array.from(new Set([...(existing.query_groups || []), row.query_group_id]));

    if (!existing.summary && row.summary) existing.summary = row.summary;
    if (!existing.access_url && row.access_url) existing.access_url = row.access_url;
    if (!existing.archive_center && row.archive_center) existing.archive_center = row.archive_center;
    if (!existing.time_start && row.time_start) existing.time_start = row.time_start;
    if (!existing.time_end && row.time_end) existing.time_end = row.time_end;
  });

  return Array.from(byId.values()).sort((a, b) => {
    const hintDiff = (b.node_hints?.length || 0) - (a.node_hints?.length || 0);
    if (hintDiff !== 0) return hintDiff;
    return String(a.title).localeCompare(String(b.title));
  });
}

async function main() {
  const results = [];

  for (const group of QUERY_GROUPS) {
    const rows = await fetchQueryGroup(group);
    results.push(...rows);
  }

  const collections = mergeCollections(results);
  const catalog = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    source: {
      id: 'nasa_grace_cmr',
      name: 'NASA GRACE / GRACE-FO Open Catalog via CMR',
      project_url: 'https://grace.jpl.nasa.gov/',
      base_url: 'https://cmr.earthdata.nasa.gov/search/collections.json',
      search_portal: 'https://search.earthdata.nasa.gov/',
      access: 'open_catalog_api'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'GRACE collection metadata and product families should refresh on roughly a 6-8 week cadence unless JPL or PO.DAAC publishes a major release update.'
    },
    query_groups: QUERY_GROUPS,
    collections
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    collection_count: collections.length,
    updated_at: catalog.updated_at
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
