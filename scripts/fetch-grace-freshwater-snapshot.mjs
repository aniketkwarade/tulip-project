import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'grace-freshwater-snapshot.json');
const GRACE_CATALOG_PATH = path.join(PUBLIC_DIR, 'grace-catalog.json');
const REFRESH_DAYS = 42;

const GRACE_HOME_URL = 'https://gracefo.jpl.nasa.gov/';
const EARTHDATA_SEARCH_URL = 'https://search.earthdata.nasa.gov/search';
const GRACE_TELLUS_URL = 'https://grace.jpl.nasa.gov/';

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
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarize(text, limit = 220) {
  const clean = normalizeWhitespace(text);
  if (!clean) return '';
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 1).trimEnd()}…`;
}

function extractHeroSummary(html) {
  const match = html.match(/GRACE-FO[\s\S]{0,1200}?provides a unique view of Earth(?:'|’)s climate and has far-reaching benefits for its people\./i);
  const extracted = summarize((match?.[0] || '').replace(/^\)?\s*/, ''));
  if (extracted) return extracted;
  return 'GRACE-FO continues GRACE’s tracking of Earth’s water movement, including groundwater, land water storage, lakes, rivers, ice sheets, and glaciers.';
}

function extractHighlightArticles(html, limit = 3) {
  return Array.from(html.matchAll(/<h3[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/h3>/gi))
    .map(match => ({
      title: normalizeWhitespace(match[2]),
      url: new URL(match[1], GRACE_HOME_URL).toString()
    }))
    .filter(entry => entry.title && /water|freshwater|dry|lakes|rivers/i.test(entry.title))
    .slice(0, limit);
}

function collectFreshwaterCollections(graceCatalog) {
  const collections = Array.isArray(graceCatalog?.collections) ? graceCatalog.collections : [];
  const scored = collections.map(collection => {
    const haystack = normalizeWhitespace([
      collection.short_name,
      collection.title,
      collection.summary,
      ...(collection.match_terms || [])
    ].join(' ')).toLowerCase();
    const keywords = [
      'groundwater',
      'soil moisture',
      'water storage',
      'land water',
      'water-equivalent-thickness',
      'equivalent water thickness',
      'drought',
      'hydrology'
    ];
    const score = keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0);
    const queryGroups = Array.isArray(collection.query_groups) ? collection.query_groups : [];
    const groupPriority = queryGroups.includes('groundwater_storage')
      ? 3
      : queryGroups.includes('land_water_storage')
        ? 2
        : queryGroups.includes('mascon_core')
          ? 1
          : 0;
    return { collection, score, groupPriority };
  });

  return scored
    .filter(entry => entry.score > 0)
    .sort((left, right) => {
      if (right.groupPriority !== left.groupPriority) return right.groupPriority - left.groupPriority;
      return right.score - left.score;
    })
    .slice(0, 4)
    .map(({ collection, groupPriority }) => ({
      short_name: collection.short_name,
      title: collection.title,
      access_url: collection.access_url,
      search_url: collection.search_url,
      time_start: collection.time_start,
      time_end: collection.time_end,
      node_hints: collection.node_hints || [],
      signal_family: groupPriority >= 3
        ? 'groundwater_and_soil_moisture'
        : groupPriority === 2
          ? 'land_water_storage'
          : 'mascon_context'
    }));
}

async function main() {
  const [html, graceCatalogRaw] = await Promise.all([
    fetchText(GRACE_HOME_URL),
    readFile(GRACE_CATALOG_PATH, 'utf8')
  ]);
  const graceCatalog = JSON.parse(graceCatalogRaw);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'freshwater_storage_support',
    source: {
      id: 'nasa_grace_fo',
      name: 'NASA GRACE-FO Freshwater Support Snapshot',
      url: GRACE_HOME_URL,
      publisher: 'NASA JPL',
      access: 'open_site_plus_open_catalog'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat GRACE-FO as a scheduled freshwater and basin-storage support snapshot. Pair the official mission surface with the existing Earthdata catalog instead of implying a direct browser-live basin API.'
    },
    use_guidance: {
      primary_role: 'Use for freshwater storage, groundwater, drought, and basin-stress support on hydrology-heavy nodes.',
      caution: 'Several deeper mission subpages were unstable during QA, so this snapshot intentionally leans on the working mission homepage and the already-curated Earthdata collection catalog.'
    },
    overview: {
      title: 'GRACE-FO freshwater and water-storage support',
      summary: extractHeroSummary(html),
      highlight_article_count: extractHighlightArticles(html).length,
      curated_collection_count: collectFreshwaterCollections(graceCatalog).length,
      focus_families: [
        'groundwater and soil moisture',
        'land water storage',
        'freshwater drought context'
      ]
    },
    tools: [
      {
        id: 'grace_home',
        label: 'GRACE-FO mission home',
        url: GRACE_HOME_URL,
        type: 'mission',
        access: 'open'
      },
      {
        id: 'grace_tellus',
        label: 'GRACE Tellus mission portal',
        url: GRACE_TELLUS_URL,
        type: 'portal',
        access: 'open'
      },
      {
        id: 'earthdata_search',
        label: 'Earthdata Search',
        url: EARTHDATA_SEARCH_URL,
        type: 'catalog_search',
        access: 'open'
      }
    ],
    observed_systems: [
      'groundwater storage',
      'soil moisture',
      'land water storage',
      'large lakes and rivers',
      'ice sheets and glaciers'
    ],
    curated_collections: collectFreshwaterCollections(graceCatalog),
    highlight_articles: extractHighlightArticles(html),
    supported_questions: [
      'Which basin-stress and hydrology nodes should inherit freshwater storage support beyond Aqueduct?',
      'Where should groundwater and land-water anomaly datasets appear without pretending the mission site exposes a simple live feed?',
      'Which node bundles should point users toward official GRACE-FO mission context plus Earthdata discovery routes?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    tool_count: snapshot.tools.length,
    curated_collection_count: snapshot.curated_collections.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
