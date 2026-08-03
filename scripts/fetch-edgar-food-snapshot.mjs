import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'edgar-food-snapshot.json');
const REFRESH_DAYS = 60;

const EDGAR_FOOD_URL = 'https://edgar.jrc.ec.europa.eu/edgar_food';

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `https://edgar.jrc.ec.europa.eu${url}`;
  return new URL(url, EDGAR_FOOD_URL).toString();
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

function extractDownloadUrl(html, labelPattern) {
  const sectionPattern = new RegExp(`${labelPattern}[\\s\\S]{0,1200}?<a[^>]*href="([^"]+)"[^>]*class="[^"]*ecl-file__download[^"]*"[^>]*>[\\s\\S]{0,120}?<span[^>]*>\\s*Download\\s*<\\/span>`, 'i');
  return absoluteUrl(html.match(sectionPattern)?.[1] || '');
}

async function main() {
  const html = await fetchText(EDGAR_FOOD_URL);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'edgar_food_support',
    source: {
      id: 'edgar_food',
      name: 'EDGAR-FOOD',
      publisher: 'European Commission Joint Research Centre',
      url: EDGAR_FOOD_URL,
      access: 'open_download'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat EDGAR-FOOD as a periodic food-system emissions snapshot rather than as a live agri-emissions feed.'
    },
    use_guidance: {
      primary_role: 'Use for food-system emissions context on agriculture, fertilizer, food, and food-waste nodes.',
      caution: 'EDGAR-FOOD is a strong global food-system emissions baseline, but it follows release cycles rather than continuous monitoring.'
    },
    overview: {
      title: 'EDGAR-FOOD',
      latest_ghg_dataset: html.match(/EDGAR-FOOD_2025 GHG data \(1990-2023\)/i) ? 'EDGAR-FOOD_2025 GHG data (1990-2023)' : null,
      air_pollutant_dataset: html.match(/EDGAR-FOOD air pollutant data \(1990-2018\)/i) ? 'EDGAR-FOOD air pollutant data (1990-2018)' : null,
      framing: normalizeWhitespace(html.match(/Food system involves[\s\S]*?necessary precursor to the design and implementation of actionable and efficient mitigation measures for the system\./i)?.[0] || '')
    },
    tools: [
      {
        id: 'edgar_food_home',
        label: 'EDGAR-FOOD page',
        url: EDGAR_FOOD_URL,
        type: 'project_page',
        access: 'open'
      },
      {
        id: 'edgar_food_2025_ghg_download',
        label: 'EDGAR-FOOD 2025 GHG data',
        url: extractDownloadUrl(html, 'EDGAR-FOOD_2025 GHG data \\(1990-2023\\)'),
        type: 'download',
        access: 'open'
      },
      {
        id: 'edgar_food_air_pollutants_download',
        label: 'EDGAR-FOOD air pollutant data',
        url: extractDownloadUrl(html, 'EDGAR-FOOD air pollutant data \\(1990-2018\\)'),
        type: 'download',
        access: 'open'
      }
    ],
    service_caveats: [
      'EDGAR-FOOD is a food-system emissions baseline, not a live agricultural monitor.',
      'Best fit is emissions attribution across food-system stages rather than local crop telemetry.',
      'Use it to strengthen agriculture and food-system emissions defensibility.'
    ],
    supported_questions: [
      'Which agriculture and food nodes need a dedicated food-system emissions layer?',
      'Where should food-system emissions be grounded in EDGAR-FOOD rather than generic agriculture framing?',
      'Which nodes benefit from explicit fertilizer, waste, and food-chain emissions support?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    tool_count: snapshot.tools.filter(tool => tool.url).length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
