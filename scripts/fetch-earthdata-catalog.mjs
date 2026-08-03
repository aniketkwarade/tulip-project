import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'earthdata-catalog.json');
const REFRESH_DAYS = 42;

const QUERY_GROUPS = [
  { sphere: 'atmosphere', keyword: 'global temperature', limit: 8 },
  { sphere: 'atmosphere', keyword: 'greenhouse gases', limit: 8 },
  { sphere: 'atmosphere', keyword: 'atmospheric composition', limit: 8 },
  { sphere: 'atmosphere', keyword: 'aerosols', limit: 8 },
  { sphere: 'oceans', keyword: 'sea surface temperature', limit: 8 },
  { sphere: 'oceans', keyword: 'sea level', limit: 8 },
  { sphere: 'oceans', keyword: 'ocean salinity', limit: 8 },
  { sphere: 'oceans', keyword: 'ocean color', limit: 8 },
  { sphere: 'cryosphere', keyword: 'sea ice', limit: 8 },
  { sphere: 'cryosphere', keyword: 'glacier', limit: 8 },
  { sphere: 'cryosphere', keyword: 'ice sheet', limit: 8 },
  { sphere: 'cryosphere', keyword: 'snow cover', limit: 8 },
  { sphere: 'biosphere', keyword: 'vegetation', limit: 8 },
  { sphere: 'biosphere', keyword: 'forest cover', limit: 8 },
  { sphere: 'biosphere', keyword: 'wildfire', limit: 8 },
  { sphere: 'biosphere', keyword: 'land cover', limit: 8 },
  { sphere: 'agriculture', keyword: 'soil moisture', limit: 8 },
  { sphere: 'agriculture', keyword: 'drought', limit: 8 },
  { sphere: 'agriculture', keyword: 'evapotranspiration', limit: 8 },
  { sphere: 'agriculture', keyword: 'precipitation', limit: 8 },
  { sphere: 'energy', keyword: 'methane emissions', limit: 8 },
  { sphere: 'energy', keyword: 'air quality', limit: 8 },
  { sphere: 'sociopolitical', keyword: 'flood hazards', limit: 8 },
  { sphere: 'sociopolitical', keyword: 'heat exposure', limit: 8 }
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

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
    title: entry.title || entry.dataset_id || entry.short_name || 'Untitled Earthdata collection',
    summary: summarize(entry.summary || entry.abstract || entry.dataset_id || ''),
    archive_center: entry.archive_center || null,
    time_start: entry.time_start || null,
    time_end: entry.time_end || null,
    updated: entry.updated || null,
    orbit_parameters: entry.orbit_parameters || null,
    search_url: buildSearchUrl(entry),
    access_url: preferredLink(entry),
    source_api: 'https://cmr.earthdata.nasa.gov/search/collections.json',
    query_keyword: group.keyword,
    primary_spheres: [group.sphere],
    match_terms: [group.keyword]
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
        match_terms: [...row.match_terms]
      });
      return;
    }

    existing.primary_spheres = Array.from(new Set([...existing.primary_spheres, ...row.primary_spheres]));
    existing.match_terms = Array.from(new Set([...existing.match_terms, ...row.match_terms]));

    if (!existing.summary && row.summary) existing.summary = row.summary;
    if (!existing.access_url && row.access_url) existing.access_url = row.access_url;
    if (!existing.archive_center && row.archive_center) existing.archive_center = row.archive_center;
    if (!existing.time_start && row.time_start) existing.time_start = row.time_start;
    if (!existing.time_end && row.time_end) existing.time_end = row.time_end;
  });

  return Array.from(byId.values()).sort((a, b) => {
    const sphereDiff = (b.primary_spheres?.length || 0) - (a.primary_spheres?.length || 0);
    if (sphereDiff !== 0) return sphereDiff;
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
      id: 'nasa_earthdata_cmr',
      name: 'NASA Earthdata Common Metadata Repository',
      base_url: 'https://cmr.earthdata.nasa.gov/search/collections.json',
      search_portal: 'https://search.earthdata.nasa.gov/',
      access: 'open_catalog_api'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Earthdata collection metadata is catalog-grade and should refresh on roughly a 6-8 week cadence unless a NASA collection migration justifies an earlier refresh.'
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
