import fs, { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'gcb-snapshot.json');
const REFRESH_DAYS = 56;

const GCB_URL = 'https://globalcarbonbudget.org/datahub/the-latest-gcb-data-2025/';
const DATA_BROWSER_URL = 'https://mdosullivan.github.io/GraphicalCarbonBudget/';
const TITLE = 'The Latest GCB Data (2025)';
const ADVERTISED_ASSETS = [
  { label: 'Dataset descriptions v2025', format: 'pdf', direct_download_expected: true },
  { label: 'Global Carbon Budget v2025', format: 'xlsx', direct_download_expected: true },
  { label: 'National fossil carbon emissions v2025', format: 'xlsx', direct_download_expected: true },
  { label: 'National land use change carbon emissions v2025', format: 'xlsx', direct_download_expected: true },
  { label: 'Fossil CO2 emissions', format: 'netcdf', direct_download_expected: false },
  { label: 'Land use change carbon emissions', format: 'netcdf', direct_download_expected: false },
  { label: 'Ocean carbon flux and response to drivers: atmospheric CO2 and changes to climate', format: 'netcdf', direct_download_expected: false },
  { label: 'Ocean carbon flux', format: 'netcdf', direct_download_expected: false },
  { label: 'Land carbon flux', format: 'netcdf', direct_download_expected: false },
  { label: 'Land carbon flux response to drivers: rising atmospheric CO2 and changes to climate', format: 'netcdf', direct_download_expected: false },
  { label: 'Surface fCO2 and air-sea CO2 3D flux data (longitude, latitude, time)', format: 'zenodo', direct_download_expected: false }
];

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
  if (url.startsWith('http://')) return `https://${url.slice('http://'.length)}`;
  if (url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `https://globalcarbonbudget.org${url}`;
  return new URL(url, GCB_URL).toString();
}

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

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)' },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function unzipText(archive, member, optional = false) {
  try {
    const { stdout } = await execFileAsync('unzip', ['-p', archive, member], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
    return stdout;
  } catch (error) {
    if (optional && (error?.code === 11 || String(error?.stderr || '').includes('filename not matched'))) return '';
    throw error;
  }
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(match =>
    [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(part => decodeXml(part[1])).join('')
  );
}

function columnIndex(reference) {
  const letters = reference.match(/^[A-Z]+/)?.[0] || '';
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseWorksheet(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)) {
    const values = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\s+([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const reference = attributes.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1] || null;
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1]
        ?? body.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/)?.[1]
        ?? '';
      let value = decodeXml(raw);
      if (type === 's') value = sharedStrings[Number(value)] ?? null;
      else if (type !== 'inlineStr' && value !== '') {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) value = numeric;
      }
      values[columnIndex(reference)] = value;
    }
    rows.push(values);
  }
  return rows;
}

function relationshipMap(xml) {
  return new Map([...xml.matchAll(/<Relationship\s+([^>]+)\/?>(?:<\/Relationship>)?/g)].map(match => {
    const attributes = match[1];
    return [attributes.match(/\bId="([^"]+)"/)?.[1], attributes.match(/\bTarget="([^"]+)"/)?.[1]];
  }).filter(([id, target]) => id && target));
}

function sheetTarget(workbookXml, relationshipsXml, sheetName) {
  const relationships = relationshipMap(relationshipsXml);
  for (const match of workbookXml.matchAll(/<sheet\s+([^>]+)\/?>(?:<\/sheet>)?/g)) {
    const attributes = match[1];
    if (decodeXml(attributes.match(/\bname="([^"]+)"/)?.[1]) !== sheetName) continue;
    const target = relationships.get(attributes.match(/\br:id="([^"]+)"/)?.[1]);
    if (!target) return null;
    return target.startsWith('/') ? target.slice(1) : `xl/${target}`;
  }
  return null;
}

async function parseGlobalBudgetWorkbook(buffer) {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'tulip-gcb-'));
  const workbookPath = path.join(temporaryDirectory, 'Global_Carbon_Budget_2025.xlsx');
  try {
    await fs.writeFile(workbookPath, buffer);
    const [workbookXml, relationshipsXml, sharedStringsXml] = await Promise.all([
      unzipText(workbookPath, 'xl/workbook.xml'),
      unzipText(workbookPath, 'xl/_rels/workbook.xml.rels'),
      unzipText(workbookPath, 'xl/sharedStrings.xml', true)
    ]);
    const target = sheetTarget(workbookXml, relationshipsXml, 'Global Carbon Budget');
    if (!target) throw new Error('Global Carbon Budget worksheet missing from official workbook.');
    const rows = parseWorksheet(await unzipText(workbookPath, target), parseSharedStrings(sharedStringsXml));
    const headerIndex = rows.findIndex(row => row[0] === 'Year' && row[4] === 'ocean sink' && row[5] === 'land sink');
    if (headerIndex < 0) throw new Error('Global Carbon Budget data header missing from official workbook.');
    const records = rows.slice(headerIndex + 1)
      .filter(row => Number.isInteger(row[0]) && row.slice(1, 8).every(Number.isFinite))
      .map(row => ({
        year: row[0],
        fossil_emissions_excluding_carbonation_gtc_yr: row[1],
        land_use_change_emissions_gtc_yr: row[2],
        atmospheric_growth_gtc_yr: row[3],
        ocean_sink_gtc_yr: row[4],
        land_sink_gtc_yr: row[5],
        cement_carbonation_sink_gtc_yr: row[6],
        budget_imbalance_gtc_yr: row[7]
      }))
      .sort((left, right) => left.year - right.year);
    if (records.length < 20) throw new Error(`Only ${records.length} complete annual global carbon-budget rows were parsed.`);
    return records;
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

function extractReleaseYear(html) {
  const titleMatch = html.match(/The Latest GCB Data \((\d{4})\)/i);
  return titleMatch?.[1] || '2025';
}

function extractDownloads(html, releaseYear) {
  const anchorPattern = /<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gsi;
  const matches = [];

  for (const match of html.matchAll(anchorPattern)) {
    const href = absoluteUrl(match[1]);
    const label = normalizeWhitespace(match[2]);
    if (!href?.includes('/download/')) continue;
    if (!label || label === 'download') continue;
    matches.push({ href, label });
  }

  const unique = [];
  const seen = new Set();
  for (const item of matches) {
    const key = `${item.href}::${item.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  const formatByLabel = new Map(ADVERTISED_ASSETS.map(asset => [asset.label, asset.format]));

  return unique
    .filter(item => formatByLabel.has(item.label))
    .map(item => ({
      label: item.label,
      url: item.href,
      format: formatByLabel.get(item.label),
      access: 'open_download'
    }));
}

async function main() {
  const html = await fetchText(GCB_URL);
  const releaseYear = extractReleaseYear(html);
  const downloads = extractDownloads(html, releaseYear);
  const workbookDownload = downloads.find(download => download.label === 'Global Carbon Budget v2025');
  if (!workbookDownload) throw new Error('Official Global Carbon Budget workbook download was not resolved.');
  const annualGlobalBudget = await parseGlobalBudgetWorkbook(await fetchBuffer(workbookDownload.url));
  const advertisedAssets = ADVERTISED_ASSETS.map(asset => {
    const resolved = downloads.find(download => download.label === asset.label) || null;
    return {
      label: asset.label,
      format: asset.format,
      status: resolved ? 'resolved_download_url' : 'advertised_on_release_page',
      url: resolved?.url || null
    };
  });

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'global_carbon_budget',
    source: {
      id: 'global_carbon_budget_data_hub',
      name: 'Global Carbon Budget Data Hub',
      title: TITLE,
      url: GCB_URL,
      publisher: 'Global Carbon Project',
      access: 'open_download'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat Global Carbon Budget as a periodic scientific snapshot. Refresh when a new budget release is published rather than presenting it as a live feed.'
    },
    use_guidance: {
      primary_role: 'Use as a defensible carbon-budget snapshot and download registry for TULIP anchors and curated evidence.',
      caution: 'This payload inventories the current official release assets. It does not invent a pseudo-live remaining-budget metric.'
    },
    release: {
      release_year: releaseYear,
      landing_page: GCB_URL,
      data_browser_url: DATA_BROWSER_URL,
      citation_note: `Cite Global Carbon Budget ${releaseYear} (Friedlingstein et al., ${releaseYear}, ESSD) for all data.`,
      fair_use_note: 'The data and model output are described by the publisher as freely available and subject to source-specific acknowledgement and citation guidance.',
      download_resolution_note: 'The static release page exposed direct download URLs for the core spreadsheet package and dataset descriptions PDF. Additional netCDF and linked assets are advertised on the release page but were not all exposed as direct download links in the fetched HTML.'
    },
    downloads,
    advertised_assets: advertisedAssets,
    record_count: annualGlobalBudget.length,
    annual_global_budget: annualGlobalBudget,
    annual_global_budget_boundary: {
      unit: 'billion tonnes of carbon per year (GtC/yr)',
      start_year: annualGlobalBudget[0].year,
      end_year: annualGlobalBudget.at(-1).year,
      source_sheet: 'Global Carbon Budget',
      uncertainty: 'The workbook states average ±1σ uncertainty of ±0.4 GtC/yr for the ocean sink and ±0.5 GtC/yr for the land sink; year-specific model and product spread is retained in the source workbook.'
    }
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    release_year: releaseYear,
    download_count: downloads.length,
    annual_global_budget_records: annualGlobalBudget.length,
    annual_global_budget_end_year: annualGlobalBudget.at(-1).year
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
