import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'noaa-marine-heatwave-snapshot.json');
const REFRESH_DAYS = 14;

const HOME_URL = 'https://psl.noaa.gov/marine-heatwaves/';

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

function extractTitle(html) {
  return normalizeWhitespace(html.match(/<title>([^<]+)<\/title>/i)?.[1] || '');
}

function extractDatasetLinks(html) {
  return Array.from(
    html.matchAll(/<li><a href="(https:\/\/downloads\.psl\.noaa\.gov\/Datasets\/marinehw\/[^"]+)">\s*([^<]+)\s*<\/a>/gi)
  )
    .map(match => ({
      url: match[1],
      label: normalizeWhitespace(match[2])
    }))
    .slice(0, 9);
}

function extractNewsLinks(html) {
  return Array.from(
    html.matchAll(/<li><strong>([^<]+)<\/strong>:\s*<a href="([^"]+)">([^<]+)<\/a>/gi)
  )
    .map(match => ({
      date: normalizeWhitespace(match[1]),
      url: match[2],
      title: normalizeWhitespace(match[3])
    }))
    .slice(0, 4);
}

function extractCurrentGlobalCoverage(html) {
  const text = normalizeWhitespace(html);
  const match = text.match(/In ([A-Z][a-z]+) (\d{4}), ([\d.]+)% \[([\d.]+)%\] of the global ocean experienced marine heatwaves[^,]*, which ranked (\d+)(?:st|nd|rd|th) \[(\d+)(?:st|nd|rd|th)\] among all months since (\d{4})/i);
  if (!match) throw new Error('Could not locate the current NOAA global marine-heatwave coverage statement.');
  return {
    month: match[1],
    year: Number(match[2]),
    trend_retained_pct: Number(match[3]),
    detrended_pct: Number(match[4]),
    trend_retained_rank: Number(match[5]),
    detrended_rank: Number(match[6]),
    ranking_start_year: Number(match[7])
  };
}

async function main() {
  const html = await fetchText(HOME_URL);
  const datasetLinks = extractDatasetLinks(html);
  const currentCoverage = extractCurrentGlobalCoverage(html);
  const records = [
    {
      record_id: `global-ocean-area-trend-retained-${currentCoverage.year}-${currentCoverage.month.toLowerCase()}`,
      metric_id: 'marine_heatwave_days_and_intensity',
      component: 'global_ocean_area_coverage',
      treatment: 'long_term_sst_trend_retained',
      observation_period: `${currentCoverage.month} ${currentCoverage.year}`,
      unit: 'percent of global ocean area',
      value: currentCoverage.trend_retained_pct,
      historical_rank: currentCoverage.trend_retained_rank,
      ranking_start_year: currentCoverage.ranking_start_year,
      source_locator: `${HOME_URL}#status`
    },
    {
      record_id: `global-ocean-area-detrended-${currentCoverage.year}-${currentCoverage.month.toLowerCase()}`,
      metric_id: 'marine_heatwave_days_and_intensity',
      component: 'global_ocean_area_coverage',
      treatment: 'linear_1991_2020_sst_trend_removed',
      observation_period: `${currentCoverage.month} ${currentCoverage.year}`,
      unit: 'percent of global ocean area',
      value: currentCoverage.detrended_pct,
      historical_rank: currentCoverage.detrended_rank,
      ranking_start_year: currentCoverage.ranking_start_year,
      source_locator: `${HOME_URL}#status`
    }
  ];

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    captured_at: new Date().toISOString(),
    version: 'noaa_psl_marine_heatwave_measurement_snapshot_v1',
    snapshot_family: 'marine_heatwave_operational_measurement',
    ingestion_job_id: 'fetch_noaa_psl_marine_heatwave_coverage',
    metric_contract_ids: ['marine_heatwave_days_and_intensity'],
    cadence: 'monthly NOAA PSL forecast-discussion refresh with daily portal monitoring',
    provenance: 'NOAA PSL source-reported monthly share of global ocean experiencing marine heatwaves, retaining trend-preserved and detrended values and their historical ranks separately.',
    uncertainty: 'The source does not report a statistical interval. OISST retrieval, interpolation, 1991-2020 baseline, percentile threshold, trend treatment, ocean mask and monthly aggregation affect coverage.',
    failure_behavior: 'Retain the last validated observation and mark stale; reject missing paired trend treatments, invalid percentages or a report older than the previous calendar year; never infer ecosystem damage from thermal coverage.',
    source: {
      id: 'noaa_marine_heatwaves',
      name: 'NOAA PSL Marine Heatwaves',
      url: HOME_URL,
      publisher: 'NOAA Physical Sciences Laboratory',
      access: 'open'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat as an operational marine-heatwave and SST anomaly snapshot. Refresh on forecast-cycle updates and product changes rather than as a browser-live feed.'
    },
    use_guidance: {
      primary_role: 'Use for marine heatwave observation, threshold, and forecast support on ocean-state nodes where thermal anomalies are central.',
      caution: 'This layer is strongest for marine heatwave diagnostics and forecasting. It complements Argo, WOD, and coral products rather than replacing broader marine chemistry or oxygen support.'
    },
    overview: {
      title: extractTitle(html) || 'Marine Heatwaves : NOAA Physical Sciences Laboratory',
      dataset_count: datasetLinks.length,
      forecast_emphasis: 'Observed OISST anomalies, quantile thresholds, and NMME marine heatwave forecast probability files are exposed directly from the NOAA PSL page.'
    },
    measurement_boundary: 'This snapshot measures the source-reported monthly global-ocean area share in marine-heatwave conditions. It does not yet provide grid-cell event-days or cumulative degree-Celsius-days and must not substitute for those components.',
    record_count: records.length,
    records,
    tools: [
      {
        id: 'psl_mhw_home',
        label: 'NOAA PSL Marine Heatwaves',
        url: HOME_URL,
        type: 'portal',
        access: 'open'
      },
      {
        id: 'writ_ocean_maps',
        label: 'WRIT Ocean Maps and Vertical Cross-sections',
        url: 'https://psl.noaa.gov/data/oceanwrit/map/',
        type: 'analysis_tool',
        access: 'open'
      },
      {
        id: 'writ_ocean_timeseries',
        label: 'WRIT Ocean Time-series Extraction and Analysis',
        url: 'https://psl.noaa.gov/data/atmoswrit/timeseries/',
        type: 'analysis_tool',
        access: 'open'
      },
      {
        id: 'cpc_mhw_monitoring',
        label: 'Marine Heatwave Monitoring and Forecast',
        url: 'https://origin.cpc.ncep.noaa.gov/products/GODAS/MarineHeatWave.html',
        type: 'monitoring',
        access: 'open'
      }
    ],
    operational_datasets: datasetLinks.map(entry => ({
      label: entry.label,
      url: entry.url,
      type: entry.label.toLowerCase().includes('forecast') ? 'forecast_download' : 'observational_download'
    })),
    supporting_links: [
      {
        label: 'NOAA high-resolution OISST daily dataset',
        url: 'https://psl.noaa.gov/data/gridded/data.noaa.oisst.v2.highres.html'
      },
      {
        label: 'NOAA ERSST V5 monthly dataset',
        url: 'https://psl.noaa.gov/data/gridded/data.noaa.ersst.v5.html'
      },
      {
        label: 'NOAA Global Ocean Monitoring and Observing Program ocean heat',
        url: 'https://globalocean.noaa.gov/the-ocean/ocean-heat/'
      }
    ],
    recent_news: extractNewsLinks(html),
    supported_questions: [
      'Which ocean nodes should inherit direct marine heatwave observation and forecast support beyond coral-specific thermal stress layers?',
      'Where should observed SST anomalies, marine heatwave thresholds, and forecast probability downloads appear as attached evidence bundles?',
      'Which ocean nodes need a thermal-anomaly support family that is stronger than report-style narrative evidence but narrower than general ocean observation catalogs?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    tool_count: snapshot.tools.length,
    dataset_count: snapshot.operational_datasets.length,
    record_count: snapshot.record_count,
    observation_period: records[0].observation_period
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
