import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'gtnp-snapshot.json');
const REFRESH_DAYS = 28;

const GTNP_URL = 'https://gtnp.arcticportal.org/';
const GTNP_DATABASE_URL = 'http://gtnpdatabase.org/';
const DATA_DOWNLOAD_URL = 'https://gtnp.arcticportal.org/data/data-download';
const MAPS_URL = 'https://gtnp.arcticportal.org/resources/maps';
const GUIDELINES_URL = 'https://gtnp.arcticportal.org/data/measurement-standards-and-monitoring-guidelines';

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

function extractMetaContent(html, name) {
  const pattern = new RegExp(`<meta[^>]+name="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+content="([^"]*)"`, 'i');
  return normalizeWhitespace(html.match(pattern)?.[1] || '');
}

function extractNewsTitles(html, limit = 3) {
  return Array.from(
    html.matchAll(/<h3 class="aidanews2_title"[^>]*><a [^>]*>([^<]+)<\/a><\/h3>/gi)
  ).map(match => normalizeWhitespace(match[1])).filter(Boolean).slice(0, limit);
}

async function main() {
  const html = await fetchText(GTNP_URL);
  const newsTitles = extractNewsTitles(html);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'permafrost_monitoring_support',
    source: {
      id: 'gtnp',
      name: 'Global Terrestrial Network for Permafrost',
      url: GTNP_URL,
      publisher: 'GTN-P / Arctic Portal / AWI',
      access: 'open_site_plus_external_database'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat GTN-P as the operational discovery and standards layer for permafrost monitoring support, not as a browser-safe live sensor stream.'
    },
    use_guidance: {
      primary_role: 'Use for direct permafrost monitoring support, active-layer and ground-temperature context, data discovery, and methods support.',
      caution: 'GTN-P points to monitoring systems, downloads, and an external database. This payload should support defensible attachment and anchor-note strengthening rather than claim a unified live API.'
    },
    overview: {
      title: 'Global Terrestrial Network for Permafrost (GTN-P)',
      description: extractMetaContent(html, 'description'),
      keywords: extractMetaContent(html, 'keywords'),
      recent_news_titles: newsTitles
    },
    tools: [
      {
        id: 'gtnp_data_download',
        label: 'GTN-P Data Download',
        url: DATA_DOWNLOAD_URL,
        type: 'download_hub',
        access: 'open'
      },
      {
        id: 'gtnp_database',
        label: 'GTN-P Database',
        url: GTNP_DATABASE_URL,
        type: 'database',
        access: 'open'
      },
      {
        id: 'gtnp_maps',
        label: 'GTN-P Maps and Graphics',
        url: MAPS_URL,
        type: 'maps',
        access: 'open'
      },
      {
        id: 'gtnp_guidelines',
        label: 'Measurement Standards and Monitoring Guidelines',
        url: GUIDELINES_URL,
        type: 'guidance',
        access: 'open'
      }
    ],
    supported_questions: [
      'Which node should carry direct permafrost monitoring support instead of relying mostly on carbon-budget context?',
      'Where should GTN-P data-discovery and methods links appear in the evidence bundles?',
      'Which permafrost claims should be supported by monitoring systems versus broader cryosphere summaries?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    tool_count: snapshot.tools.length,
    recent_news_count: snapshot.overview.recent_news_titles.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
