import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'soilgrids-snapshot.json');
const REFRESH_DAYS = 90;

const SOILGRIDS_URL = 'https://soilgrids.org/';
const SOILGRIDS_DOCS_URL = 'https://rest.isric.org/soilgrids/v2.0/docs';

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url, options = {}) {
  const { allowFailure = false } = options;
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)'
    },
    redirect: 'follow'
  });
  const body = await response.text();
  if (!response.ok) {
    if (allowFailure) {
      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        text: body
      };
    }
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return {
    ok: true,
    status: response.status,
    statusText: response.statusText,
    text: body
  };
}

async function main() {
  const [portal, docs] = await Promise.all([
    fetchText(SOILGRIDS_URL),
    fetchText(SOILGRIDS_DOCS_URL, { allowFailure: true })
  ]);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'soilgrids_support',
    source: {
      id: 'soilgrids',
      name: 'SoilGrids',
      publisher: 'ISRIC - World Soil Information',
      url: SOILGRIDS_URL,
      access: 'open_download'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat SoilGrids as a global soil-property baseline and API-doc snapshot rather than as a local live monitoring feed.'
    },
    use_guidance: {
      primary_role: 'Use for soil baseline support on land, agriculture, and soil-moisture stress nodes.',
      caution: 'SoilGrids is a modeled global soil-property surface and documentation family, not a real-time field sensor network.'
    },
    overview: {
      title: normalizeWhitespace(portal.text.match(/<title>([^<]+)<\/title>/i)?.[1] || 'SoilGrids250m 2.0'),
      description: normalizeWhitespace(portal.text.match(/meta name="description" content="([^"]+)"/i)?.[1] || ''),
      api_docs_title: docs.ok
        ? normalizeWhitespace(docs.text.match(/<title>([^<]+)<\/title>/i)?.[1] || 'SoilGrids API docs')
        : 'SoilGrids API docs',
      api_docs_status: docs.status,
      core_properties: ['SOC', 'pH', 'bulk density', 'sand', 'silt', 'clay', 'nitrogen', 'CEC']
    },
    tools: [
      {
        id: 'soilgrids_portal',
        label: 'SoilGrids portal',
        url: SOILGRIDS_URL,
        type: 'portal',
        access: 'open'
      },
      {
        id: 'soilgrids_api_docs',
        label: 'SoilGrids API docs',
        url: SOILGRIDS_DOCS_URL,
        type: 'api_docs',
        access: 'open'
      }
    ],
    service_caveats: [
      'SoilGrids is a global modeled soil baseline, not a local ground-truth monitoring service.',
      !docs.ok ? `The API docs endpoint returned ${docs.status} ${docs.statusText} during refresh, so docs availability should be treated as intermittent.` : null,
      'Best fit is soil-property grounding and agricultural/land-system context.',
      'Use alongside hydrology and food-system layers, not as a standalone drought or crop-loss feed.'
    ].filter(Boolean),
    supported_questions: [
      'Which land and agriculture nodes need a defensible global soil baseline?',
      'Where should TULIP use soil-property context rather than only hydrology framing?',
      'Which soil-stress nodes need official ISRIC grounding?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    api_docs_title: snapshot.overview.api_docs_title
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
