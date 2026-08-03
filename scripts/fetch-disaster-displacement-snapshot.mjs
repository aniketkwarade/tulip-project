import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'disaster-displacement-snapshot.json');
const REFRESH_DAYS = 30;

const HDX_ORG_URL = 'https://data.humdata.org/organization/cred';
const HDX_API_URL = 'https://data.humdata.org/api/3/action/package_search?fq=organization:cred&rows=6';
const EMDAT_DOCS_URL = 'https://doc.emdat.be/';
const EMDAT_PROJECT_URL = 'https://www.emdat.be/';
const EMDAT_PUBLIC_PORTAL_URL = 'https://public.emdat.be/';
const IDMC_HOME_URL = 'https://www.internal-displacement.org/';
const IDMC_API_URL = 'https://api.internal-displacement.org/';
const UNHCR_URL = 'https://www.unhcr.org/what-we-do/build-better-futures/climate-change-and-displacement';
const GROUNDSWELL_URL = 'https://openknowledge.worldbank.org/entities/publication/2c9150df-52c3-58ed-9075-d78ea56c3267';
const WORLD_BANK_DISASTER_DISPLACEMENT_URL = 'https://api.worldbank.org/v2/country/all/indicator/VC.IDP.NWDS?format=json&per_page=20000';
const WORLD_BANK_COUNTRIES_URL = 'https://api.worldbank.org/v2/country?format=json&per_page=400';

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
      Accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
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

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarize(text, limit = 220) {
  const clean = normalizeWhitespace(text);
  if (!clean) return '';
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 1).trimEnd()}…`;
}

function extractDatasetCount(hdxApiPayload) {
  return Number(hdxApiPayload?.result?.count) || null;
}

function extractHdxDescription(hdxApiPayload) {
  const firstDescription = hdxApiPayload?.result?.results?.find(result => result.notes)?.notes;
  return summarize(firstDescription || 'Public HDX catalog surface for EM-DAT aggregate and country-profile datasets published by CRED.');
}

function extractOrganizationId(hdxApiPayload) {
  const firstOrg = hdxApiPayload?.result?.results?.[0]?.organization;
  return firstOrg?.id || null;
}

function extractSampleDatasets(hdxApiPayload, limit = 6) {
  return (hdxApiPayload?.result?.results || [])
    .map(result => ({
      title: normalizeWhitespace(result.title || ''),
      url: result.name ? new URL(`/dataset/${result.name}`, 'https://data.humdata.org').toString() : null,
      last_modified: result.metadata_modified || result.last_modified || null
    }))
    .filter(entry => entry.title && entry.url)
    .slice(0, limit);
}

function extractHdxApiNote(emdatDocsHtml) {
  const match = emdatDocsHtml.match(/Aggregated Data[\s\S]{0,500}?publicly accessible via the HDX API\./i);
  return summarize(match?.[0] || 'Aggregated EM-DAT datasets are publicly accessible through HDX and its API.');
}

function extractRecordCount(emdatDocsHtml) {
  const match = emdatDocsHtml.match(/Over\s+([0-9,]+)\s+records of disasters from 1900 to the present day/i);
  return match?.[1] ? `${match[1]} records since 1900` : null;
}

function extractIdmcFlagship(idmcHomeHtml) {
  const title = normalizeWhitespace(
    idmcHomeHtml.match(/Out now:\s*Global Report on Internal Displacement\s*([0-9]{4})/i)?.[0] || ''
  );
  const date = normalizeWhitespace(idmcHomeHtml.match(/([0-9]{1,2}\s+[A-Za-z]+\s+20[0-9]{2})[\s\S]{0,120}?Global Report on Internal Displacement 2026/i)?.[1] || '');
  return {
    title: title || 'Global Report on Internal Displacement 2026',
    published_at: date || null
  };
}

function detectIdmcApiLogin(idmcApiHtml) {
  return /<title>\s*Log in/i.test(idmcApiHtml) || />\s*Log in\s*</i.test(idmcApiHtml);
}

function extractWorldBankDisplacementRecords(indicatorPayload, countriesPayload) {
  const countryCodes = new Set((countriesPayload?.[1] || [])
    .filter(country => country?.region?.id && country.region.id !== 'NA')
    .map(country => country.id));
  return (indicatorPayload?.[1] || [])
    .filter(row => countryCodes.has(row.countryiso3code))
    .filter(row => Number.isFinite(Number(row.value)) && Number.isFinite(Number(row.date)))
    .map(row => ({
      record_id: `world_bank_idmc_disaster_displacement_${row.countryiso3code}_${row.date}`,
      country_code: row.countryiso3code,
      country_name: row.country?.value || null,
      observation_year: Number(row.date),
      new_displacement_movements: Number(row.value),
      unit: 'new internal displacement movements associated with disasters',
      indicator_code: row.indicator?.id || 'VC.IDP.NWDS',
      indicator_name: row.indicator?.value || 'Internally displaced persons, new displacement associated with disasters (number of cases)',
      source_note: 'IDMC annual disaster-displacement flow redistributed through the World Bank Indicators API; repeat movements can count more than once.',
      source_locator: `${WORLD_BANK_DISASTER_DISPLACEMENT_URL}&date=${row.date}`
    }))
    .sort((a, b) => b.observation_year - a.observation_year || a.country_code.localeCompare(b.country_code));
}

async function main() {
  const [hdxApiPayload, emdatDocsHtml, idmcHomeHtml, idmcApiHtml, worldBankIndicatorPayload, worldBankCountriesPayload] = await Promise.all([
    fetchJson(HDX_API_URL),
    fetchText(EMDAT_DOCS_URL),
    fetchText(IDMC_HOME_URL),
    fetchText(IDMC_API_URL),
    fetchJson(WORLD_BANK_DISASTER_DISPLACEMENT_URL),
    fetchJson(WORLD_BANK_COUNTRIES_URL)
  ]);

  const datasetCount = extractDatasetCount(hdxApiPayload);
  const hdxDescription = extractHdxDescription(hdxApiPayload);
  const sampleDatasets = extractSampleDatasets(hdxApiPayload);
  const flagship = extractIdmcFlagship(idmcHomeHtml);
  const idmcApiIsLogin = detectIdmcApiLogin(idmcApiHtml);
  const records = extractWorldBankDisplacementRecords(worldBankIndicatorPayload, worldBankCountriesPayload);
  if (!records.length) throw new Error('World Bank VC.IDP.NWDS returned no country-year disaster displacement records.');
  const latestObservationYear = Math.max(...records.map(record => record.observation_year));
  const latestRecords = records.filter(record => record.observation_year === latestObservationYear);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    captured_at: new Date().toISOString(),
    ingestion_job_id: 'fetch_world_bank_idmc_disaster_displacement',
    metric_contract_ids: ['hazard_related_internal_displacements'],
    record_count: records.length,
    cadence: 'annual World Bank indicator release check with release-triggered refresh',
    provenance: 'IDMC annual new-displacement estimates for disasters redistributed through the World Bank Indicators API VC.IDP.NWDS, limited to recognized country records.',
    uncertainty: 'Figures count displacement movements rather than unique people; rapid estimates, repeat displacement, event coverage, revisions, evacuation classification, and reporting access affect totals. The country-year API omits event-level confidence and hazard details.',
    failure_behavior: 'Retain the last validated country-year snapshot and mark stale; reject an empty or structurally changed response; never replace missing country-years with zero or label the figures as climate-attributed migration.',
    snapshot_family: 'disaster_displacement_measurement_and_support',
    source: {
      id: 'idmc',
      name: 'IDMC disaster displacement via World Bank Indicators',
      publisher: 'Internal Displacement Monitoring Centre, redistributed by World Bank',
      access: 'open_api_redistribution_plus_gated_primary_api'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'EM-DAT and HDX are used as public disaster-registry surfaces. IDMC remains public for report pages and analysis, but its direct API surface is treated as gated unless the login requirement disappears.'
    },
    use_guidance: {
      primary_role: 'Use for migration, relocation-governance, insurance retreat, and disaster-recovery nodes that need real registry and displacement support rather than generic climate notes.',
      caution: 'Use EM-DAT and HDX for public disaster-registry context, IDMC for flagship displacement framing, and UNHCR/Groundswell for report-grade protection and internal migration evidence.'
    },
    overview: {
      title: 'Disaster and displacement support family',
      description: hdxDescription || 'Mixed operational and report-grade support family for climate-linked disaster losses, internal displacement, protection needs, and managed relocation pressure.',
      hdx_dataset_count: datasetCount,
      hdx_organization_id: extractOrganizationId(hdxApiPayload),
      emdat_record_note: extractRecordCount(emdatDocsHtml),
      emdat_hdx_api_note: extractHdxApiNote(emdatDocsHtml),
      idmc_flagship_title: flagship.title,
      idmc_flagship_published_at: flagship.published_at,
      displacement_indicator_code: 'VC.IDP.NWDS',
      displacement_record_count: records.length,
      displacement_latest_observation_year: latestObservationYear,
      displacement_latest_country_count: latestRecords.length,
      displacement_latest_reported_movements: latestRecords.reduce((sum, record) => sum + record.new_displacement_movements, 0)
    },
    tools: [
      {
        id: 'emdat_project',
        label: 'EM-DAT project',
        url: EMDAT_PROJECT_URL,
        type: 'project_page',
        access: 'open'
      },
      {
        id: 'emdat_public_portal',
        label: 'Public EM-DAT portal',
        url: EMDAT_PUBLIC_PORTAL_URL,
        type: 'portal',
        access: 'mixed'
      },
      {
        id: 'emdat_documentation',
        label: 'EM-DAT documentation',
        url: EMDAT_DOCS_URL,
        type: 'documentation',
        access: 'open'
      },
      {
        id: 'emdat_hdx',
        label: 'EM-DAT HDX aggregation',
        url: HDX_ORG_URL,
        type: 'data_portal',
        access: 'open'
      },
      {
        id: 'idmc_home',
        label: 'IDMC home',
        url: IDMC_HOME_URL,
        type: 'project_page',
        access: 'open'
      },
      {
        id: 'idmc_api',
        label: 'IDMC data surface',
        url: IDMC_API_URL,
        type: 'api',
        access: idmcApiIsLogin ? 'login_required' : 'open',
        notes: idmcApiIsLogin ? 'Fetch check found a login screen at the API entrypoint.' : 'Public API entrypoint responded without a login wall during the last snapshot refresh.'
      },
      {
        id: 'unhcr_climate_displacement',
        label: 'UNHCR climate change and displacement',
        url: UNHCR_URL,
        type: 'guidance',
        access: 'open'
      },
      {
        id: 'groundswell_part2',
        label: 'World Bank Groundswell Part 2',
        url: GROUNDSWELL_URL,
        type: 'report',
        access: 'open'
      },
      {
        id: 'world_bank_idmc_disaster_displacement_indicator',
        label: 'World Bank indicator VC.IDP.NWDS sourced from IDMC',
        url: WORLD_BANK_DISASTER_DISPLACEMENT_URL,
        type: 'api',
        access: 'open',
        notes: 'Annual country-level new displacement movements associated with disasters; movement flows are not unique people and are not climate-attribution estimates.'
      }
    ],
    records,
    public_hdx_samples: sampleDatasets,
    service_caveats: [
      idmcApiIsLogin
        ? 'IDMC api.internal-displacement.org currently resolves to a login page and is not treated as an anonymous live feed.'
        : 'IDMC api.internal-displacement.org did not present a login wall during the latest snapshot refresh.',
      'HDX and EM-DAT are used here as public registry and download surfaces, but the portal experience should still be treated as curated access rather than browser-live event telemetry.'
    ],
    supported_questions: [
      'Which governance and migration nodes need hard disaster-registry support rather than soft report-only evidence?',
      'Where should displacement evidence stay report-backed instead of sounding like a real-time monitoring feed?',
      'Which node bundles need explicit login-gated caveats carried into the UI?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    hdx_dataset_count: datasetCount,
    sample_dataset_count: sampleDatasets.length,
    idmc_api_access: snapshot.tools.find(tool => tool.id === 'idmc_api')?.access,
    displacement_records: records.length,
    latest_observation_year: latestObservationYear,
    latest_country_count: latestRecords.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
