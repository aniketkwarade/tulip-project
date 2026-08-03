import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'nsidc-sea-ice-snapshot.json');
const REFRESH_DAYS = 7;

const SEA_ICE_URL = 'https://nsidc.org/sea-ice-today';
const SEPTEMBER_EXTENT_URL = 'https://noaadata.apps.nsidc.org/NOAA/G02135/north/monthly/data/N_09_extent_v4.0.csv';

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

function absoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('https://')) return url;
  if (url.startsWith('http://')) return `https://${url.slice('http://'.length)}`;
  if (url.startsWith('/')) return `https://nsidc.org${url}`;
  return new URL(url, SEA_ICE_URL).toString();
}

function extractLinkByLabel(html, label) {
  const pattern = new RegExp(`<a[^>]+href="([^"]+)"[^>]*>\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<\\/a>`, 'i');
  const match = html.match(pattern);
  return absoluteUrl(match?.[1] || null);
}

function parseSeptemberExtent(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(',').map(value => value.trim().toLowerCase());
  const index = name => headers.indexOf(name);
  const yearIndex = index('year');
  const monthIndex = index('mo');
  const extentIndex = index('extent');
  const areaIndex = index('area');
  const sourceIndex = index('data_type') >= 0 ? index('data_type') : index('source_dataset');
  if ([yearIndex, monthIndex, extentIndex, areaIndex].some(value => value < 0)) throw new Error('NSIDC September extent CSV schema changed.');
  const records = lines.slice(1).map(line => line.split(',').map(value => value.trim())).map(fields => ({
    year: Number(fields[yearIndex]),
    month: Number(fields[monthIndex]),
    source_dataset: sourceIndex >= 0 ? fields[sourceIndex] : null,
    region: 'Northern Hemisphere',
    monthly_mean_extent_million_km2: Number(fields[extentIndex]),
    monthly_mean_area_million_km2: Number(fields[areaIndex]),
    source_locator: SEPTEMBER_EXTENT_URL
  })).filter(record => Number.isInteger(record.year)
    && record.month === 9
    && Number.isFinite(record.monthly_mean_extent_million_km2)
    && Number.isFinite(record.monthly_mean_area_million_km2));
  if (records.length < 20) throw new Error(`NSIDC September extent history is unexpectedly short at ${records.length} rows.`);
  return records.sort((left, right) => left.year - right.year);
}

async function main() {
  const [html, septemberExtentText] = await Promise.all([
    fetchText(SEA_ICE_URL),
    fetchText(SEPTEMBER_EXTENT_URL)
  ]);
  const normalized = normalizeWhitespace(html);

  const serviceReductionMatch = normalized.match(/Due to non-renewed funding, several Sea Ice Today tools and services are now suspended or reduced\./i);
  const updateCadenceMatch = normalized.match(/Sea ice data is updated daily, with a one-day lag\./i);
  const featuredDateMatch = normalized.match(/Featured Sea Ice Analysis\s+Analysis - Sea Ice Today\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'sea_ice_status_support',
    source: {
      id: 'nsidc_sea_ice_today',
      name: 'NSIDC Sea Ice Today',
      url: SEA_ICE_URL,
      publisher: 'National Snow and Ice Data Center',
      access: 'open'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Sea ice imagery and daily data context can refresh weekly for TULIP, but should remain a frozen support snapshot rather than a live chart embed.'
    },
    use_guidance: {
      primary_role: 'Cryosphere support layer for sea-ice season loss, Arctic change, and related anchor notes.',
      caution: 'The page currently operates under reduced service conditions; keep it as a support snapshot rather than assuming full historical tooling remains active.'
    },
    service_status: {
      reduced_services: Boolean(serviceReductionMatch),
      update_cadence_note: updateCadenceMatch ? 'Sea ice data is updated daily, with a one-day lag.' : null,
      featured_notice_date: featuredDateMatch?.[1] || 'October 15, 2025'
    },
    links: [
      {
        label: 'Sea Ice Today',
        url: SEA_ICE_URL,
        type: 'overview'
      },
      {
        label: 'ChArctic interactive sea ice graph',
        url: extractLinkByLabel(html, 'ChArctic interactive sea ice graph') || 'https://nsidc.org/charctic-interactive-sea-ice-graph',
        type: 'tool'
      },
      {
        label: 'Sea ice analysis data spreadsheets',
        url: extractLinkByLabel(html, 'Sea ice analysis data spreadsheets') || 'https://nsidc.org/data/seaice_index/',
        type: 'download_index'
      },
      {
        label: 'NOAA/NSIDC Sea Ice Index Version 4 September extent',
        url: SEPTEMBER_EXTENT_URL,
        type: 'official_csv'
      }
    ],
    metric_contract_ids: ['arctic_sea_ice_retreat'],
    measurement_boundary: 'Northern Hemisphere September monthly mean sea-ice extent and area in million square kilometres from NOAA/NSIDC Sea Ice Index Version 4. Extent uses the product 15-percent concentration threshold; September extent is not identical to annual minimum extent, ice thickness, age or season length.',
    uncertainty: 'Passive-microwave retrieval, sensor transitions, melt ponds, coastal masks, concentration threshold, near-real-time replacement and weather-driven annual variability affect extent and area.',
    record_count: parseSeptemberExtent(septemberExtentText).length,
    records: parseSeptemberExtent(septemberExtentText)
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    reduced_services: snapshot.service_status.reduced_services,
    link_count: snapshot.links.length,
    september_extent_records: snapshot.record_count,
    september_extent_end_year: snapshot.records.at(-1).year
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
