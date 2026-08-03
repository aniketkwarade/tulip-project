import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'argo-snapshot.json');
const REFRESH_DAYS = 35;

const ARGO_HOME_URL = 'https://argo.ucsd.edu/';
const ARGO_GDACS_URL = 'https://argo.ucsd.edu/data/data-from-gdacs/';
const ARGO_PRODUCTS_URL = 'https://argo.ucsd.edu/data/argo-data-products/';
const ARGO_VISUALIZATIONS_URL = 'https://argo.ucsd.edu/data/argo-data-visualizations/';
const BGC_ARGO_URL = 'https://argo.ucsd.edu/expansion/biogeochemical-argo-mission/';
const DEEP_ARGO_URL = 'https://argo.ucsd.edu/expansion/deep-argo-mission/';
const POLAR_ARGO_URL = 'https://argo.ucsd.edu/expansion/polar-argo/';

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

function extractMetaDescription(html) {
  return normalizeWhitespace(
    html.match(/<meta[^>]+(?:name|property)="description"[^>]+content="([^"]*)"/i)?.[1] || ''
  );
}

function extractBgcVariables(html) {
  const match = html.match(/pH,\s*oxygen,\s*nitrate,\s*chlorophyll,\s*suspended particles,\s*and downwelling irradiance/i);
  if (!match) return ['oxygen', 'pH'];
  return match[0]
    .split(/\s*,\s*|\s+and\s+/i)
    .map(item => normalizeWhitespace(item))
    .filter(Boolean)
    .map(item => item.replace(/^and\s+/i, ''))
    .map(item => item.replace(/\band\s+/i, ''));
}

function extractGdacSummary(html) {
  const match = html.match(/The complete Argo data collection[\s\S]{0,600}?selection tools\./i);
  return normalizeWhitespace(match?.[0] || '') || 'Official GDAC access covers float metadata, trajectory, profile, and technical data through mirrored HTTP, FTP, web-service, and selection-tool routes.';
}

function extractBgcSummary(html) {
  const match = html.match(/array of about 1000 BGC profiling floats[\s\S]{0,500}?carbon dioxide\./i);
  return normalizeWhitespace(match?.[0] || '') || 'BGC Argo extends the network with pH, oxygen, nitrate, chlorophyll, particle, and irradiance sensors to support ocean acidification, hypoxia, and carbon-uptake observation.';
}

async function main() {
  const [homeHtml, gdacsHtml, bgcHtml] = await Promise.all([
    fetchText(ARGO_HOME_URL),
    fetchText(ARGO_GDACS_URL),
    fetchText(BGC_ARGO_URL)
  ]);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'ocean_observing_network_support',
    source: {
      id: 'argo_ocean_observing_network',
      name: 'Argo Ocean Observing Network',
      url: ARGO_HOME_URL,
      publisher: 'Argo / UC San Diego',
      access: 'open'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat Argo as an operational ocean-observing network snapshot with open access routes and mission expansion pages, not as a single lightweight browser-side feed.'
    },
    use_guidance: {
      primary_role: 'Use for oxygen, pH, ocean-state, and marine-profile support on hypoxia, deoxygenation, fisheries, and ocean carbon uptake nodes.',
      caution: 'Argo data access is distributed across GDAC mirrors and network tools. This bundle should steer users toward official network access points rather than imply one universal JSON endpoint.'
    },
    overview: {
      title: 'Argo ocean observing support',
      description: extractMetaDescription(homeHtml),
      gdac_summary: extractGdacSummary(gdacsHtml),
      bgc_summary: extractBgcSummary(bgcHtml)
    },
    tools: [
      {
        id: 'argo_gdac',
        label: 'Data from GDACs',
        url: ARGO_GDACS_URL,
        type: 'data_access',
        access: 'open'
      },
      {
        id: 'argo_data_products',
        label: 'Argo Data Products',
        url: ARGO_PRODUCTS_URL,
        type: 'products',
        access: 'open'
      },
      {
        id: 'argo_data_visualizations',
        label: 'Argo Data Visualizations',
        url: ARGO_VISUALIZATIONS_URL,
        type: 'visualization',
        access: 'open'
      },
      {
        id: 'bgc_argo_mission',
        label: 'BGC Argo Mission',
        url: BGC_ARGO_URL,
        type: 'mission',
        access: 'open'
      }
    ],
    data_access_routes: [
      {
        label: 'Argo Data Access overview',
        url: 'https://www.argodatamgt.org/DataAccess.html',
        notes: 'Official route to GDAC access, web services, DOI snapshots, and selection tools.'
      },
      {
        label: 'GDAC HTTP / FTP / S3 services',
        url: 'https://www.argodatamgt.org/DataAccess.html#ftp-https-s3-data-services',
        notes: 'Primary machine-access entry point for official NetCDF files and mirrors.'
      },
      {
        label: 'Argo DOI snapshots',
        url: 'https://www.argodatamgt.org/DataAccess.html#argo-doi-digital-object-identifier',
        notes: 'Versioned snapshots for citable, stable dataset pulls.'
      },
      {
        label: 'Euro-Argo data selection tool',
        url: 'https://dataselection.euro-argo.eu/',
        notes: 'Interactive subset selection for floats, profiles, and variables.'
      },
      {
        label: 'US GDAC data browser',
        url: 'https://nrlgodae1.nrlmry.navy.mil/cgi-bin/argo_select.pl',
        notes: 'Legacy query route surfaced from the official Argo GDAC guidance.'
      }
    ],
    expansion_missions: [
      {
        label: 'BGC Argo Mission',
        url: BGC_ARGO_URL
      },
      {
        label: 'Deep Argo Mission',
        url: DEEP_ARGO_URL
      },
      {
        label: 'Polar Argo',
        url: POLAR_ARGO_URL
      }
    ],
    bgc_variables: extractBgcVariables(bgcHtml),
    supported_questions: [
      'Which marine-state nodes should inherit an official observing-network bundle rather than only a catalog or report card?',
      'Where should oxygen-capable and pH-capable ocean observations appear for hypoxia, deoxygenation, and fisheries support?',
      'Which ocean bundles should point to GDAC access and BGC Argo mission context without claiming a single live feed?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    tool_count: snapshot.tools.length,
    data_access_route_count: snapshot.data_access_routes.length,
    bgc_variable_count: snapshot.bgc_variables.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
