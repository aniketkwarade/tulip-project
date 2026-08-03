import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'water-footprint-snapshot.json');
const REFRESH_DAYS = 120;

const ROOT_URL = 'https://www.waterfootprint.org/';
const LEGACY_WATERSTAT_URL = 'https://www.waterfootprint.org/resources/waterstat/';

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url, accept404 = false) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)'
    },
    redirect: 'follow'
  });
  const text = await response.text();
  if (!response.ok && !accept404) {
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${text.slice(0, 400)}`);
  }
  return { status: response.status, text };
}

async function main() {
  const [home, waterstat] = await Promise.all([
    fetchText(ROOT_URL),
    fetchText(LEGACY_WATERSTAT_URL, true)
  ]);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'water_footprint_support',
    source: {
      id: 'water_footprint_network',
      name: 'Water Footprint Network',
      publisher: 'Water Footprint Network',
      url: ROOT_URL,
      access: 'open_web'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat Water Footprint Network as a lighter water-demand and footprint context layer. The intake-listed WaterStat path currently requires caution because the legacy URL is not stable.'
    },
    use_guidance: {
      primary_role: 'Use for food and water-demand framing on resource, cooling-water, and food-system nodes.',
      caution: 'This is a lighter support family than Aqueduct or GRACE and should be used as footprint context rather than as a high-frequency water-risk feed.'
    },
    overview: {
      title: normalizeWhitespace(home.text.match(/<title>([^<]+)<\/title>/i)?.[1] || 'Water Footprint Network'),
      legacy_waterstat_status: waterstat.status,
      legacy_waterstat_note: waterstat.status >= 400 ? 'legacy WaterStat path returned an error during verification' : 'legacy WaterStat path responded successfully'
    },
    tools: [
      {
        id: 'water_footprint_home',
        label: 'Water Footprint Network',
        url: ROOT_URL,
        type: 'project_page',
        access: 'open'
      }
    ],
    service_caveats: [
      'The intake-listed WaterStat URL currently returned an error during verification, so this family should be carried as cautious support rather than as a clean dataset feed.',
      'Best fit is contextual water-demand and footprint framing, not operational basin telemetry.',
      'Use alongside Aqueduct and GRACE, not instead of them.'
    ],
    supported_questions: [
      'Which nodes need water-demand and footprint context beyond basin stress and storage anomalies?',
      'Where should food and cooling-water pressure be grounded in footprint language without overstating feed quality?',
      'Which water-intensive nodes benefit from an explicit demand-side support layer?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    legacy_waterstat_status: snapshot.overview.legacy_waterstat_status
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
