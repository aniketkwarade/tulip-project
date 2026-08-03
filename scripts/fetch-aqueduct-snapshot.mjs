import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'aqueduct-snapshot.json');
const REFRESH_DAYS = 56;

const AQUEDUCT_URL = 'https://www.wri.org/aqueduct';
const GLOBAL_WATER_STRESS_URL = 'https://www.wri.org/insights/highest-water-stressed-countries';
const GEE_URL = 'https://developers.google.com/earth-engine/datasets/catalog/WRI_Aqueduct_Water_Risk_V4_baseline_monthly';
const TOOLS = [
  {
    id: 'water_risk_atlas',
    label: 'Aqueduct Water Risk Atlas',
    url: 'https://www.wri.org/applications/aqueduct/water-risk-atlas/',
    type: 'atlas',
    access: 'open'
  },
  {
    id: 'country_rankings',
    label: 'Aqueduct Country Rankings',
    url: 'https://www.wri.org/applications/aqueduct/country-rankings/',
    type: 'atlas',
    access: 'open'
  },
  {
    id: 'floods',
    label: 'Aqueduct Floods',
    url: 'https://www.wri.org/applications/aqueduct/floods/',
    type: 'atlas',
    access: 'open'
  },
  {
    id: 'food',
    label: 'Aqueduct Food',
    url: 'https://www.wri.org/applications/aqueduct/food/#/',
    type: 'atlas',
    access: 'open'
  }
];

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

function extractAvailability(html) {
  const match = html.match(/Dataset Availability\s*<\/[^>]+>\s*([^<]+)/i) || html.match(/Dataset Availability\s*([\dTZ:\-–]+)/i);
  return normalizeWhitespace(match?.[1] || '');
}

async function main() {
  const [aqueductHtml, geeHtml, globalStressHtml] = await Promise.all([
    fetchText(AQUEDUCT_URL),
    fetchText(GEE_URL),
    fetchText(GLOBAL_WATER_STRESS_URL)
  ]);
  const globalStressText = normalizeWhitespace(globalStressHtml);
  const requiredClaims = [
    /25 countries[^.]*one-quarter of the global population/i,
    /at least 50% of the world.?s population[^.]*around 4 billion people/i,
    /demand has more than doubled since 1960/i,
    /extreme water stress[^.]*using at least 80% of its available supply/i,
    /high water stress[^.]*withdrawing 40% of its supply/i,
    /60% of the world.?s irrigated agriculture faces extremely high water stress/i
  ];
  if (requiredClaims.some(pattern => !pattern.test(globalStressText))) throw new Error('WRI global water-stress claims changed or could not be validated.');

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'water_risk_registry',
    source: {
      id: 'wri_aqueduct',
      name: 'WRI Aqueduct',
      url: AQUEDUCT_URL,
      publisher: 'World Resources Institute',
      access: 'open'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Aqueduct is best treated as a registry and baseline-surface snapshot. Refresh on tool and model iteration cycles, not as a live basin telemetry feed.'
    },
    use_guidance: {
      primary_role: 'Use for water-risk registry coverage, basin-stress context, and curated edge evidence.',
      caution: 'This registry payload does not itself contain basin geometry. The data-center context pipeline separately joins the official Aqueduct 4.0 baseline-annual File Geodatabase to facility points and preserves source attribution, indicator missingness, and join provenance.'
    },
    overview: {
      title: 'Aqueduct',
      subtitle: 'A suite of four tools using cutting-edge data to identify and evaluate water risks around the world.',
      description: extractMetaContent(aqueductHtml, 'description'),
      latest_iteration: 'Aqueduct 4.0',
      open_data_license_url: 'https://creativecommons.org/licenses/by/4.0/',
      open_data_note: 'WRI states the code, data, and methodology behind Aqueduct are documented and available for download under CC BY 4.0.'
    },
    global_water_stress_assessment: {
      assessment_year: 2023,
      countries_with_extremely_high_annual_water_stress: 25,
      global_population_share_in_those_countries_pct: 25,
      global_population_with_high_water_stress_at_least_one_month_billion: 4,
      global_population_share_with_high_water_stress_at_least_one_month_pct: 50,
      global_water_demand_reference_year: 1960,
      global_water_demand_increase_multiple_lower_bound: 2,
      extreme_water_stress_withdrawal_to_renewable_supply_threshold_pct: 80,
      high_water_stress_withdrawal_to_renewable_supply_threshold_pct: 40,
      irrigated_agriculture_facing_extremely_high_water_stress_pct: 60,
      source_url: GLOBAL_WATER_STRESS_URL,
      measurement_boundary: 'Aqueduct baseline water stress is modeled long-term demand divided by renewable supply. Population and agriculture figures are exposure estimates, not observed household shortages or basin depletion volumes.'
    },
    tools: TOOLS,
    machine_access: [
      {
        id: 'wri_aqueduct_v4_official_download',
        label: 'Aqueduct 4.0 Current and Future Global Maps Data',
        url: 'https://files.wri.org/aqueduct/aqueduct-4-0-water-risk-data.zip',
        type: 'file_geodatabase_and_csv_download',
        access: 'open_cc_by_4_0',
        browser_safe: false,
        notes: 'Used by the backend data-center point-in-polygon join. The source archive remains external; only attributed joined context is published in the platform snapshot.'
      },
      {
        id: 'wri_aqueduct_v4_gee',
        label: 'WRI Aqueduct Baseline Monthly Version 4.0',
        url: GEE_URL,
        type: 'earth_engine_catalog',
        access: 'earth_engine',
        browser_safe: false,
        dataset_availability: extractAvailability(geeHtml) || '2010-01-01T00:00:00Z–2080-12-31T23:59:59Z',
        producer: 'World Resources Institute',
        notes: 'Preferred machine-readable route when a backend export or spatial join pipeline is available.'
      }
    ],
    supported_questions: [
      'Where is baseline water stress already high or seasonally concentrated?',
      'Which basin-level water risks should be attached to infrastructure or agriculture nodes?',
      'Which Aqueduct surfaces should be cited as registry evidence rather than live monitoring?',
      'Which mapped data-center records fall within each Aqueduct 4.0 baseline-annual water-risk polygon?'
    ],
    provenance: 'WRI Aqueduct 4.0 source pages and official global baseline-water-stress assessment, retaining threshold definitions, country counts, population exposure, demand-change baseline and irrigated-agriculture exposure separately.',
    uncertainty: 'Aqueduct combines modeled renewable supply, sectoral withdrawals, population and spatial allocation. Country aggregation can hide basin variation; exposure is not realized shortage, and global demand more than doubled is an endpoint statement rather than a complete annual series.',
    failure_behavior: 'Retain the last validated assessment and mark stale; reject changed thresholds, missing denominators or unreconciled country and population claims. Never classify unassessed places as zero stress, treat exposure as observed shortage, or score future projections as current.'
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    tool_count: snapshot.tools.length,
    machine_access_count: snapshot.machine_access.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
