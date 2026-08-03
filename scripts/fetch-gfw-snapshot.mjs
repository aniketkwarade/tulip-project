import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'gfw-snapshot.json');
const REFRESH_DAYS = 14;

const GFW_HOME_URL = 'https://www.globalforestwatch.org/';
const GFW_MAP_URL = 'https://www.globalforestwatch.org/map/';
const GFW_DASHBOARD_URL = 'https://www.globalforestwatch.org/dashboards/global/';
const GFW_DATA_PORTAL_URL = 'https://data.globalforestwatch.org/';
const GFW_DATASET_API_URL = 'https://data-api.globalforestwatch.org/datasets';

const CURATED_DATASETS = [
  {
    dataset: 'gfw_integrated_alerts',
    label: 'Integrated deforestation alerts',
    role: 'daily alerts',
    notes: 'Merged GLAD-L, GLAD-S2, and RADD alert family used for near-real-time deforestation detection.'
  },
  {
    dataset: 'geostore__glad__summary',
    label: 'GLAD alert summary',
    role: 'summary',
    notes: 'Administrative summary surface for GLAD forest disturbance alerts.'
  },
  {
    dataset: 'geostore__burned_areas__daily_alerts',
    label: 'Burned areas daily alerts',
    role: 'daily fire alerts',
    notes: 'Daily burned-area alert surface for wildfire context.'
  },
  {
    dataset: 'umd_tree_cover_loss',
    label: 'UMD tree cover loss',
    role: 'annual baseline',
    notes: 'Global annual tree-cover-loss layer commonly surfaced through Global Forest Watch.'
  },
  {
    dataset: 'tsc_tree_cover_loss_drivers',
    label: 'Tree cover loss by dominant driver',
    role: 'annual attribution',
    notes: 'Attribution layer that helps distinguish commodity, forestry, wildfire, and shifting-cultivation drivers.'
  }
];

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)'
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return response.json();
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const payload = await fetchJson(GFW_DATASET_API_URL);
  const datasets = Array.isArray(payload?.data) ? payload.data : [];

  const curatedDatasets = CURATED_DATASETS.map(entry => {
    const record = datasets.find(dataset => dataset.dataset === entry.dataset);
    return {
      dataset: entry.dataset,
      label: entry.label,
      role: entry.role,
      notes: entry.notes,
      title: normalizeWhitespace(record?.metadata?.title || entry.label),
      source: normalizeWhitespace(record?.metadata?.source || 'Global Forest Watch'),
      update_frequency: normalizeWhitespace(record?.metadata?.update_frequency || ''),
      geographic_coverage: normalizeWhitespace(record?.metadata?.geographic_coverage || ''),
      is_downloadable: Boolean(record?.is_downloadable),
      landing_page: `https://data.globalforestwatch.org/datasets/gfw::${entry.dataset}`
    };
  }).filter(entry => entry.title);

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'forest_change_operational',
    source: {
      id: 'global_forest_watch',
      name: 'Global Forest Watch',
      url: GFW_HOME_URL,
      publisher: 'World Resources Institute',
      access: 'open'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat as an operational forest-change and alert snapshot. Refresh on alert and annual-loss update cycles rather than as a direct browser-side live feed.'
    },
    use_guidance: {
      primary_role: 'Use for forest-loss, deforestation-alert, and burned-area operational context on land-system nodes.',
      caution: 'This payload surfaces discovery and operational entry points; it is not a substitute for direct geospatial joins or area-specific alert queries.'
    },
    overview: {
      title: 'Global Forest Watch',
      subtitle: 'Forest monitoring, loss alerts, and land-change context from the GFW platform.',
      dataset_count: datasets.length,
      curated_dataset_count: curatedDatasets.length
    },
    tools: [
      {
        id: 'gfw_map',
        label: 'Global Forest Watch Map',
        url: GFW_MAP_URL,
        type: 'map',
        access: 'open'
      },
      {
        id: 'gfw_dashboard',
        label: 'Global Forest Watch Dashboard',
        url: GFW_DASHBOARD_URL,
        type: 'dashboard',
        access: 'open'
      },
      {
        id: 'gfw_open_data',
        label: 'Global Forest Watch Open Data Portal',
        url: GFW_DATA_PORTAL_URL,
        type: 'portal',
        access: 'open'
      },
      {
        id: 'gfw_dataset_api',
        label: 'Global Forest Watch Dataset API',
        url: GFW_DATASET_API_URL,
        type: 'api',
        access: 'open'
      }
    ],
    curated_datasets: curatedDatasets,
    supported_questions: [
      'Which nodes should inherit current deforestation and forest-loss alert coverage?',
      'Which bundle should support wildfire and canopy-loss context without pretending it is a single global truth feed?',
      'Which GFW surfaces belong in operational evidence bundles versus slower anchor-note support?'
    ]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    dataset_count: snapshot.overview.dataset_count,
    curated_dataset_count: snapshot.curated_datasets.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
