import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'wod-snapshot.json');
const REFRESH_DAYS = 56;

const WOD_URL = 'https://www.ncei.noaa.gov/products/world-ocean-database';
const WODSELECT_URL = 'https://www.ncei.noaa.gov/access/world-ocean-database-select/dbsearch.html';
const WOD_UPDATES_URL = 'https://www.ncei.noaa.gov/access/world-ocean-database/wod-updates.html';
const WOD_LOCATION_URL = 'https://www.ncei.noaa.gov/access/world-ocean-database/datawodgeo.html';
const WOD_YEAR_URL = 'https://www.ncei.noaa.gov/access/world-ocean-database/bin/getwodyearlydata.pl?Go=TimeSorted';
const WOD_DOC_URL = 'https://www.ncei.noaa.gov/data/oceans/woa/WOD/DOC/wod_intro.pdf';
const WOD_MANUAL_URL = 'https://www.ncei.noaa.gov/data/oceans/woa/WOD/DOC/wodreadme.pdf';

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

function extractMetaContent(html, property) {
  const pattern = new RegExp(`<meta[^>]+(?:name|property)="${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+content="([^"]*)"`, 'i');
  return normalizeWhitespace(html.match(pattern)?.[1] || '');
}

function extractCurrentVersion(html) {
  return normalizeWhitespace(html.match(/<h3>Current Version:\s*([^<]+)<\/h3>/i)?.[1] || '');
}

function extractCastCount(html) {
  const match = html.match(/includes more than ([\d.]+ million) oceanographic casts made up of ([\d.]+ billion) individual profile measurements/i);
  if (!match) return null;
  return {
    casts: match[1],
    measurements: match[2]
  };
}

async function main() {
  const html = await fetchText(WOD_URL);
  const profileScale = extractCastCount(html);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'ocean_observation_support',
    source: {
      id: 'noaa_wod',
      name: 'World Ocean Database',
      url: WOD_URL,
      publisher: 'NOAA NCEI',
      access: 'open'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat WOD as an official ocean-observation support and query layer. Refresh on major releases and quarterly update cycles rather than as a real-time feed.'
    },
    use_guidance: {
      primary_role: 'Use for oxygen-rich ocean observation support, query access, and long-run marine profile context on oxygen, fisheries, and ocean-state nodes.',
      caution: 'WOD is a powerful observational database and query system, but custom downloads are request/query driven rather than a simple browser-side live API.'
    },
    overview: {
      title: 'World Ocean Database',
      description: extractMetaContent(html, 'description'),
      current_version: extractCurrentVersion(html) || 'WOD23',
      profile_scale: profileScale
    },
    tools: [
      {
        id: 'wodselect',
        label: 'Launch WODSelect',
        url: WODSELECT_URL,
        type: 'query',
        access: 'open',
        notes: 'Search by date, geography, probe type, and measured variables, then export CSV or netCDF subsets.'
      },
      {
        id: 'wod_updates',
        label: 'WOD Updates',
        url: WOD_UPDATES_URL,
        type: 'updates',
        access: 'open'
      },
      {
        id: 'wod_data_by_location',
        label: 'Data by Location',
        url: WOD_LOCATION_URL,
        type: 'query',
        access: 'open'
      },
      {
        id: 'wod_data_by_year',
        label: 'Data by Year',
        url: WOD_YEAR_URL,
        type: 'download_index',
        access: 'open'
      },
      {
        id: 'wod_introduction',
        label: 'WOD Introduction',
        url: WOD_DOC_URL,
        type: 'documentation',
        access: 'open'
      },
      {
        id: 'wod_manual',
        label: 'WOD User Manual',
        url: WOD_MANUAL_URL,
        type: 'documentation',
        access: 'open'
      }
    ],
    observed_variables: [
      'oxygen',
      'temperature',
      'salinity',
      'nutrients'
    ],
    supported_questions: [
      'Which ocean nodes should inherit oxygen-capable observational support beyond coral heat stress and acidification portals?',
      'Where should fisheries and hypoxia-adjacent nodes point for queryable, official marine profile data?',
      'Which ocean bundles should emphasize custom query and long-run observation access rather than live-feed rhetoric?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    current_version: snapshot.overview.current_version,
    tool_count: snapshot.tools.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
