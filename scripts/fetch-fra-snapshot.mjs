import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'fra-snapshot.json');
const REFRESH_DAYS = 90;

const FRA_URL = 'https://www.fao.org/forest-resources-assessment/';
const FRA_NEWS_URL = 'https://www.fao.org/newsroom/detail/global-deforestation-slows--but-forests-remain-under-pressure--fao-report-shows/en';
const METRIC_ID = 'fao_fra_forest_conversion_rate';
const INGESTION_JOB_ID = 'fetch_fao_fra_global_deforestation_rate';

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
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `https://www.fao.org${url}`;
  return new URL(url, FRA_URL).toString();
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

function extractAnchors(html) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(match => ({
      href: absoluteUrl(match[1]),
      label: normalizeWhitespace(match[2])
    }))
    .filter(item => item.href && item.label);
}

function matchAnchor(anchors, pattern) {
  return anchors.find(anchor => pattern.test(anchor.label))?.href || null;
}

function requireNumber(text, pattern, label) {
  const value = Number(text.match(pattern)?.[1]);
  if (!Number.isFinite(value)) throw new Error(`Could not extract ${label} from the FRA 2025 source statement.`);
  return value;
}

async function main() {
  const [html, newsHtml] = await Promise.all([
    fetchText(FRA_URL),
    fetchText(FRA_NEWS_URL)
  ]);
  const anchors = extractAnchors(html);
  const newsText = normalizeWhitespace(newsHtml);
  const currentDeforestationMillionHaYr = requireNumber(
    newsText,
    /Deforestation slowed to ([\d.]+) million hectares per year in 2015.{0,3}2025/i,
    '2015-2025 deforestation rate'
  );
  const historicalDeforestationMillionHaYr = requireNumber(
    newsText,
    /down from ([\d.]+) million in 1990.{0,3}2000/i,
    '1990-2000 deforestation rate'
  );
  const currentNetForestLossMillionHaYr = requireNumber(
    newsText,
    /annual rate of net forest loss fell from [\d.]+ million hectares in the 1990s to ([\d.]+) million hectares in 2015.{0,3}2025/i,
    '2015-2025 net forest loss rate'
  );
  const sourceReportedForestAreaBillionHa = requireNumber(
    newsText,
    /Forests cover ([\d.]+) billion hectares/i,
    '2025 forest area'
  );
  const derivedDeforestationDeclinePct = (
    (currentDeforestationMillionHaYr - historicalDeforestationMillionHaYr)
    / historicalDeforestationMillionHaYr
  ) * 100;
  const records = [
    {
      record_id: 'fao-fra-global-deforestation-rate-1990-2000',
      metric_id: METRIC_ID,
      measurement_role: 'source_reported_gross_deforestation_rate_historical_comparator',
      geography: 'World',
      period_start_year: 1990,
      period_end_year: 2000,
      forest_change_measure: 'deforestation',
      value_million_hectares_per_year: historicalDeforestationMillionHaYr,
      unit: 'million hectares per year',
      uncertainty_status: 'No statistical uncertainty interval is reported in the source summary; FRA is based on official national reporting.',
      source_locator: `${FRA_NEWS_URL}#key-findings`
    },
    {
      record_id: 'fao-fra-global-deforestation-rate-2015-2025',
      metric_id: METRIC_ID,
      measurement_role: 'source_reported_gross_deforestation_rate_current_period',
      geography: 'World',
      period_start_year: 2015,
      period_end_year: 2025,
      forest_change_measure: 'deforestation',
      value_million_hectares_per_year: currentDeforestationMillionHaYr,
      unit: 'million hectares per year',
      uncertainty_status: 'No statistical uncertainty interval is reported in the source summary; FRA is based on official national reporting.',
      source_locator: `${FRA_NEWS_URL}#key-findings`
    },
    {
      record_id: 'fao-fra-global-net-forest-loss-rate-2015-2025',
      metric_id: METRIC_ID,
      measurement_role: 'source_reported_net_forest_area_loss_context',
      geography: 'World',
      period_start_year: 2015,
      period_end_year: 2025,
      forest_change_measure: 'net forest area loss',
      value_million_hectares_per_year: currentNetForestLossMillionHaYr,
      unit: 'million hectares per year',
      uncertainty_status: 'No statistical uncertainty interval is reported in the source summary; gains and losses are combined in this net measure.',
      source_locator: `${FRA_NEWS_URL}#key-findings`
    }
  ];

  const snapshot = {
    captured_at: new Date().toISOString(),
    updated_at: new Date().toISOString().slice(0, 10),
    version: 'fao_fra_global_forest_conversion_measurement_v1',
    snapshot_family: 'contract_bound_global_forest_conversion_snapshot',
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: [METRIC_ID],
    cadence: 'five-year FRA assessment release with annual source-page monitoring',
    provenance: 'FAO Global Forest Resources Assessment 2025 source-reported global gross deforestation and net forest-area loss rates. The historical percentage change is derived only from the two reported gross-deforestation rates.',
    uncertainty: 'FRA is compiled from official national data for 236 countries and areas. Definitions, national inventories, reporting capacity, revisions, forest thresholds, plantation treatment and gross-versus-net accounting affect comparison; the source summary provides no statistical interval.',
    failure_behavior: 'Retain the last validated FRA assessment and mark stale; reject missing periods, changed units, non-positive rates or a source statement that no longer reconciles gross deforestation with net forest loss. Never treat net loss as gross deforestation or interpolate annual values within an assessment period.',
    record_count: records.length,
    records,
    derived_metrics: {
      [METRIC_ID]: {
        latest_period: '2015-2025',
        latest_gross_deforestation_million_hectares_per_year: currentDeforestationMillionHaYr,
        historical_period: '1990-2000',
        historical_gross_deforestation_million_hectares_per_year: historicalDeforestationMillionHaYr,
        derived_change_pct: derivedDeforestationDeclinePct,
        current_net_forest_loss_million_hectares_per_year: currentNetForestLossMillionHaYr,
        source_reported_forest_area_billion_hectares: sourceReportedForestAreaBillionHa,
        derivation: '(current gross deforestation rate - historical gross deforestation rate) / historical gross deforestation rate * 100',
        uncertainty_status: 'Derived percentage from source-reported period averages; not a confidence interval or annual trend.'
      }
    },
    measurement_boundary: 'Gross deforestation is permanent conversion of forest to another land use. Net forest-area loss subtracts forest expansion and is therefore not interchangeable. These global period averages do not identify countries, commodities, causes, annual variability, degradation within remaining forest, or tree-cover loss that does not meet the FRA deforestation definition.',
    source: {
      id: 'fao_global_forest_resources_assessment',
      name: 'FAO Global Forest Resources Assessment',
      publisher: 'Food and Agriculture Organization of the United Nations',
      url: FRA_URL,
      statement_url: FRA_NEWS_URL,
      access: 'open official assessment and data platform'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat FRA as an official periodic forest-baseline snapshot rather than as a high-frequency alert surface.'
    },
    use_guidance: {
      primary_role: 'Use the source-reported global period rate as the primary operational measurement for the Deforestation node and as bounded endpoint context for edge estimands.',
      caution: 'FRA is a periodic official assessment, not near-real-time alerting. Keep gross deforestation, net forest-area loss, degradation and remote-sensing tree-cover loss separate.'
    },
    overview: {
      title: 'Global Forest Resources Assessment 2025',
      description: normalizeWhitespace(html.match(/FAO Global Forest Resources Assessment \(FRA\) provides essential information[^"]+/i)?.[0] || ''),
      modified_time: normalizeWhitespace(html.match(/meta name="last-modified" content="([^"]+)"/i)?.[1] || ''),
      authority_note: html.match(/only worldwide assessment based on official national data/i) ? 'official national data baseline' : null
    },
    tools: [
      {
        id: 'fra_home',
        label: 'FRA home',
        url: FRA_URL,
        type: 'project_page',
        access: 'open'
      },
      {
        id: 'fra_2025_report',
        label: 'Global Forest Resources Assessment 2025',
        url: matchAnchor(anchors, /^Global Forest Resources Assessment 2025$/i),
        type: 'report',
        access: 'open'
      },
      {
        id: 'fra_digital_report',
        label: 'Digital report',
        url: matchAnchor(anchors, /^Digital report$/i),
        type: 'report',
        access: 'open'
      },
      {
        id: 'fra_data_portal',
        label: 'Explore FRA data',
        url: matchAnchor(anchors, /^Explore FRA data$/i),
        type: 'data_portal',
        access: 'open'
      },
      {
        id: 'fra_reports',
        label: 'FRA 2025 reports',
        url: matchAnchor(anchors, /Reports$/i),
        type: 'report_collection',
        access: 'open'
      }
    ],
    service_caveats: [
      'The current value is a 2015-2025 period average rather than an annual observation.',
      'Gross deforestation and net forest-area loss have different accounting boundaries.',
      'Use country or commodity attribution only when a separate compatible dataset is joined explicitly.'
    ],
    supported_questions: [
      'Which forest and land-system nodes need an official global baseline alongside GFW alerts?',
      'Where should forest claims be grounded in authoritative national reporting rather than only operational monitoring?',
      'Which land-system bundles need stronger institutional baseline support?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    records: snapshot.record_count,
    current_deforestation_million_hectares_per_year: currentDeforestationMillionHaYr,
    derived_change_pct: derivedDeforestationDeclinePct
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
