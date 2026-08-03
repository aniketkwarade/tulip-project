import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'finance-governance-snapshot.json');
const REFRESH_DAYS = 45;

const CPI_HOME_URL = 'https://www.climatepolicyinitiative.org/';
const NGFS_PORTAL_URL = 'https://www.ngfs.net/ngfs-scenarios-portal/';
const UNEP_ADAPTATION_GAP_URL = 'https://www.unep.org/resources/adaptation-gap-report-2025';

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

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCpiMetadata(html) {
  const title = normalizeWhitespace(html.match(/<title>([^<]+)<\/title>/i)?.[1] || '');
  const description = normalizeWhitespace(html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || '');
  const modifiedAt = normalizeWhitespace(html.match(/"dateModified":"([^"]+)"/i)?.[1] || '');
  const globalLandscapeUrl = html.match(/href="(https:\/\/www\.climatepolicyinitiative\.org\/publication\/global-landscape-of-climate-finance-[0-9]{4}\/)"/i)?.[1] || 'https://www.climatepolicyinitiative.org/publication/global-landscape-of-climate-finance-2026/';
  const adaptationFinanceUrl = html.match(/href="(https:\/\/www\.climatepolicyinitiative\.org\/publication\/quality-of-adaptation-finance\/)"/i)?.[1] || 'https://www.climatepolicyinitiative.org/publication/quality-of-adaptation-finance/';
  return {
    title,
    description,
    modified_at: modifiedAt || null,
    global_landscape_url: globalLandscapeUrl,
    adaptation_finance_url: adaptationFinanceUrl
  };
}

function extractNgfsMetadata(html) {
  const description = normalizeWhitespace(html.match(/name="description" content="([^"]+)"/i)?.[1] || '');
  const title = normalizeWhitespace(html.match(/<title>([^<]+)<\/title>/i)?.[1] || 'NGFS Scenarios Portal');
  const updatedAt = normalizeWhitespace(html.match(/property="og:updated_time" content="([^"]+)"/i)?.[1] || '');
  const shortTermUrl = html.match(/href="(https:\/\/www\.ngfs\.net\/en\/publications-and-statistics\/publications\/ngfs-short-term-climate-scenarios[^"]*)"/i)?.[1] || null;
  const longTermUrl = html.match(/href="(https:\/\/www\.ngfs\.net\/en\/publications-and-statistics\/publications\/ngfs-climate-scenarios[^"]*)"/i)?.[1] || null;
  return {
    title,
    description,
    updated_at: updatedAt || null,
    short_term_url: shortTermUrl,
    long_term_url: longTermUrl
  };
}

async function main() {
  const [cpiHtml, ngfsHtml] = await Promise.all([
    fetchText(CPI_HOME_URL),
    fetchText(NGFS_PORTAL_URL)
  ]);

  const cpi = extractCpiMetadata(cpiHtml);
  const ngfs = extractNgfsMetadata(ngfsHtml);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'finance_governance_support',
    source: {
      id: 'cpi_ngfs_unep_finance',
      name: 'CPI + NGFS + UNEP adaptation finance support',
      publisher: 'Climate Policy Initiative, Network for Greening the Financial System, United Nations Environment Programme',
      access: 'mixed_open_plus_report'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'CPI and NGFS public surfaces are refreshed as a compact finance-governance snapshot. UNEP remains a report-backed anchor link in this family rather than a scraped live source.'
    },
    use_guidance: {
      primary_role: 'Use for reinsurance withdrawal, adaptation capital shortfall, insurance retreat, and governance-pressure nodes that need finance-specific support rather than displacement spillover.',
      caution: 'CPI contributes climate-finance and adaptation-quality framing, NGFS contributes macro-financial risk and scenario infrastructure, and UNEP contributes report-backed adaptation-gap context.'
    },
    overview: {
      title: 'Finance and governance support family',
      cpi_title: cpi.title,
      cpi_modified_at: cpi.modified_at,
      cpi_description: cpi.description,
      ngfs_title: ngfs.title,
      ngfs_updated_at: ngfs.updated_at,
      ngfs_description: ngfs.description
    },
    tools: [
      {
        id: 'cpi_home',
        label: 'Climate Policy Initiative',
        url: CPI_HOME_URL,
        type: 'project_page',
        access: 'open'
      },
      {
        id: 'cpi_global_landscape',
        label: 'Global Landscape of Climate Finance 2026',
        url: cpi.global_landscape_url,
        type: 'report',
        access: 'open'
      },
      {
        id: 'cpi_adaptation_finance',
        label: 'Assessing the Quality of Adaptation Finance',
        url: cpi.adaptation_finance_url,
        type: 'report',
        access: 'open'
      },
      {
        id: 'ngfs_portal',
        label: 'NGFS Scenarios Portal',
        url: NGFS_PORTAL_URL,
        type: 'portal',
        access: 'open'
      },
      {
        id: 'ngfs_short_term',
        label: 'NGFS short-term climate scenarios',
        url: ngfs.short_term_url,
        type: 'publication',
        access: 'open'
      },
      {
        id: 'ngfs_long_term',
        label: 'NGFS long-term climate scenarios',
        url: ngfs.long_term_url,
        type: 'publication',
        access: 'open'
      },
      {
        id: 'unep_adaptation_gap',
        label: 'UNEP Adaptation Gap Report 2025',
        url: UNEP_ADAPTATION_GAP_URL,
        type: 'report',
        access: 'open'
      }
    ],
    service_caveats: [
      'CPI and NGFS are authoritative finance and scenario surfaces, but this family should still be treated as a curated support snapshot rather than a single live market feed.',
      'UNEP adaptation-gap support is carried as a report-backed anchor and should not be described as a live quantitative portal.',
      'This family is intended to reduce overuse of displacement framing on finance and governance nodes, not replace hazard evidence entirely.'
    ],
    supported_questions: [
      'Which nodes need finance and governance support instead of inheriting migration context by default?',
      'Where should adaptation-capital and insurance stress be grounded in official finance and scenario institutions?',
      'Which society nodes need macro-financial and adaptation-gap framing without implying live market telemetry?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    cpi_modified_at: cpi.modified_at,
    ngfs_updated_at: ngfs.updated_at
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
