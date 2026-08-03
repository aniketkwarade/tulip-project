import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'exiobase-snapshot.json');
const REFRESH_DAYS = 120;

const EXIOBASE_URL = 'https://exiobase.eu/';
const EXIOBASE_ZENODO_URL = 'https://zenodo.org/records/15689391';
const EXIOBASE_ZENODO_API_URL = 'https://zenodo.org/api/records/15689391';

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)'
    },
    redirect: 'follow'
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)'
    },
    redirect: 'follow'
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return response.json();
}

async function main() {
  const [homeHtml, zenodo] = await Promise.all([
    fetchText(EXIOBASE_URL),
    fetchJson(EXIOBASE_ZENODO_API_URL)
  ]);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'exiobase_support',
    source: {
      id: 'exiobase',
      name: 'EXIOBASE',
      publisher: 'EXIOBASE Consortium',
      url: EXIOBASE_URL,
      access: 'open_download'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat EXIOBASE as a supply-chain and footprint accounting snapshot rather than as an operational live dataset.'
    },
    use_guidance: {
      primary_role: 'Use for supply-chain, embodied-resource, and traded-footprint support on industry and materials nodes.',
      caution: 'EXIOBASE is a powerful MRIO baseline for embodied impacts, but it is not a high-frequency monitoring feed.'
    },
    overview: {
      title: normalizeWhitespace(homeHtml.match(/<title>([^<]+)<\/title>/i)?.[1] || 'EXIOBASE'),
      description: normalizeWhitespace(homeHtml.match(/EXIOBASE is a global, detailed[\s\S]*?final consumption of product groups\./i)?.[0] || ''),
      zenodo_updated_at: zenodo.updated || null,
      zenodo_title: zenodo.metadata?.title || null
    },
    tools: [
      {
        id: 'exiobase_home',
        label: 'EXIOBASE home',
        url: EXIOBASE_URL,
        type: 'project_page',
        access: 'open'
      },
      {
        id: 'exiobase_zenodo_record',
        label: 'EXIOBASE Zenodo record',
        url: EXIOBASE_ZENODO_URL,
        type: 'download_record',
        access: 'open'
      }
    ],
    service_caveats: [
      'EXIOBASE is a supply-chain accounting system, not a direct operational monitor.',
      'Best fit is embodied carbon, materials, water, and trade-footprint context across industry and consumption nodes.',
      'Use for structural footprint grounding rather than current-event monitoring.'
    ],
    supported_questions: [
      'Which materials and industry nodes need embodied-impact and traded-footprint support?',
      'Where should TULIP use MRIO-style supply-chain evidence rather than only direct emissions framing?',
      'Which digital and industrial nodes benefit from a structural footprint support layer?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    zenodo_updated_at: snapshot.overview.zenodo_updated_at
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
