import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'ocads-catalog.json');
const REFRESH_DAYS = 56;

const OCADS_URL = 'https://www.ncei.noaa.gov/products/ocean-carbon-acidification-data-system';
const PORTAL_URL = 'https://www.ncei.noaa.gov/access/oads/';

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
  const pattern = new RegExp(`<meta[^>]+(?:name|property)="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+content="([^"]*)"`, 'i');
  return normalizeWhitespace(html.match(pattern)?.[1] || '');
}

function extractMetadataLinks(html, limit = 8) {
  const matches = Array.from(
    html.matchAll(/https:\/\/www\.ncei\.noaa\.gov\/data\/oceans\/ncei\/ocads\/metadata\/\d+\.html/g)
  ).map(match => match[0]);
  return Array.from(new Set(matches)).slice(0, limit);
}

async function main() {
  const html = await fetchText(OCADS_URL);
  const metadataLinks = extractMetadataLinks(html);

  const catalog = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    catalog_family: 'ocean_acidification_anchor_support',
    source: {
      id: 'noaa_ocads',
      name: 'NOAA Ocean Carbon and Acidification Data System',
      url: OCADS_URL,
      publisher: 'NOAA National Centers for Environmental Information',
      access: 'open_portal_plus_metadata'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'OCADS should be treated as a portal and metadata catalog for anchor support, not as a single real-time feed.'
    },
    use_guidance: {
      primary_role: 'Support ocean acidification anchors with official portal discovery, metadata records, and NOAA stewardship context.',
      caution: 'Use representative metadata records and collection portals for evidence. Do not present this as a unified live numerical API.'
    },
    overview: {
      title: 'Ocean Carbon and Acidification Data System (OCADS)',
      description: extractMetaContent(html, 'description'),
      modified_time: extractMetaContent(html, 'og:updated_time') || null,
      contact_email: 'noaa.ocads@noaa.gov'
    },
    portals: [
      {
        id: 'ocads_data_portal',
        label: 'Ocean Carbon and Acidification Data Portal',
        url: PORTAL_URL,
        type: 'portal',
        access: 'open',
        notes: 'Search, explore, and download collection-level data records archived at OCADS.'
      },
      {
        id: 'ocads_home',
        label: 'OCADS product page',
        url: OCADS_URL,
        type: 'product_page',
        access: 'open',
        notes: 'Canonical NOAA overview for OCADS mission, resources, and access routes.'
      }
    ],
    sample_metadata_records: metadataLinks.map(url => ({
      url,
      type: 'metadata_record',
      access: 'open'
    })),
    stewardship_scope: [
      'ocean carbon',
      'ocean acidification',
      'GOOS biogeochemistry EOVs',
      'oxygen and nutrients',
      'marine carbon dioxide removal research'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    metadata_record_count: catalog.sample_metadata_records.length,
    modified_time: catalog.overview.modified_time
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
