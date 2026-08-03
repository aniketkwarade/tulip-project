import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_DATA_PATH = path.join(PUBLIC_DIR, 'owid-global-co2.json');
const OUTPUT_CATALOG_PATH = path.join(PUBLIC_DIR, 'owid-catalog.json');
const REFRESH_DAYS = 42;
const SOURCE_URL = 'https://owid-public.owid.io/data/co2/owid-co2-data.json';

const INDICATORS = [
  {
    key: 'co2',
    title: 'Annual Global CO2 (excluding Land-Use)',
    unit: 'million tonnes (Mt)',
    grapher_path: 'annual-co2-emissions-per-country',
    themes: ['climate', 'energy']
  },
  {
    key: 'total_ghg',
    title: 'Global Greenhouse Gas Emissions',
    unit: 'million tonnes CO2e',
    grapher_path: 'total-ghg-emissions',
    themes: ['climate', 'sociopolitical']
  },
  {
    key: 'methane',
    title: 'Global Methane Emissions',
    unit: 'million tonnes CO2e',
    grapher_path: 'methane-emissions',
    themes: ['climate', 'agriculture']
  },
  {
    key: 'nitrous_oxide',
    title: 'Global Nitrous Oxide Emissions',
    unit: 'million tonnes CO2e',
    grapher_path: 'nitrous-oxide-emissions',
    themes: ['agriculture', 'climate']
  },
  {
    key: 'land_use_change_co2',
    title: 'Global CO2 from Land-Use Change',
    unit: 'million tonnes (Mt)',
    grapher_path: 'annual-co2-emissions-from-land-use-change',
    themes: ['biosphere', 'climate']
  },
  {
    key: 'coal_co2',
    title: 'Global CO2 Emissions from Coal',
    unit: 'million tonnes (Mt)',
    grapher_path: 'annual-co-emissions-by-fuel-line',
    themes: ['energy', 'climate']
  },
  {
    key: 'oil_co2',
    title: 'Global CO2 Emissions from Oil',
    unit: 'million tonnes (Mt)',
    grapher_path: 'annual-co-emissions-by-fuel-line',
    themes: ['transport', 'energy']
  },
  {
    key: 'gas_co2',
    title: 'Global CO2 Emissions from Gas',
    unit: 'million tonnes (Mt)',
    grapher_path: 'annual-co-emissions-by-fuel-line',
    themes: ['energy', 'climate']
  },
  {
    key: 'cement_co2',
    title: 'Global CO2 Emissions from Cement',
    unit: 'million tonnes (Mt)',
    grapher_path: 'annual-co-emissions-by-fuel-line',
    themes: ['urbanization', 'energy']
  },
  {
    key: 'primary_energy_consumption',
    title: 'Global Primary Energy Consumption',
    unit: 'TWh',
    grapher_path: 'primary-energy-cons',
    themes: ['energy', 'economy']
  },
  {
    key: 'energy_per_capita',
    title: 'Energy Consumption per Capita',
    unit: 'kWh',
    grapher_path: 'primary-energy-cons-per-capita',
    themes: ['energy', 'society']
  },
  {
    key: 'co2_per_capita',
    title: 'Global CO2 Emissions per Capita',
    unit: 'tonnes per person',
    grapher_path: 'co-emissions-per-capita',
    themes: ['climate', 'society']
  },
  {
    key: 'temperature_change_from_ghg',
    title: 'Temperature Change Attributed to Greenhouse Gases',
    unit: 'degrees C',
    grapher_path: 'temperature-change-from-ghg',
    themes: ['climate', 'atmosphere']
  }
];

function roundValue(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return response.json();
}

function buildIndicatorSummaries(worldSeries) {
  return INDICATORS.map(indicator => {
    const timeseries = worldSeries
      .map(row => ({
        year: row.year,
        value: row[indicator.key]
      }))
      .filter(row => Number.isFinite(row.value));

    if (timeseries.length === 0) {
      return null;
    }

    const latest = timeseries[timeseries.length - 1];
    const prior = timeseries.find(row => row.year === latest.year - 10)
      || timeseries.find(row => row.year >= latest.year - 12 && row.year <= latest.year - 8)
      || timeseries[0];

    const deltaPct = prior && prior !== latest && prior.value !== 0
      ? roundValue(((latest.value - prior.value) / prior.value) * 100)
      : null;

    return {
      ...indicator,
      years: {
        start: timeseries[0].year,
        end: latest.year
      },
      latest: {
        year: latest.year,
        value: roundValue(latest.value)
      },
      ten_year_change_pct: deltaPct,
      ourworldindata_url: `https://ourworldindata.org/grapher/${indicator.grapher_path}?tab=chart&country=~OWID_WRL`
    };
  }).filter(Boolean);
}

async function main() {
  const rawData = await fetchJson(SOURCE_URL);
  const worldSeries = (rawData?.World?.data || [])
    .filter(row => Number.isFinite(row.year))
    .map(row => ({
      country: 'World',
      ...row
    }))
    .sort((a, b) => a.year - b.year);

  const indicator_summaries = buildIndicatorSummaries(worldSeries);
  const latestYear = worldSeries.at(-1)?.year ?? null;

  const catalog = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    source: {
      id: 'owid_co2_data',
      name: 'Our World in Data CO2 and Greenhouse Gas Data',
      access: 'open_dataset',
      website_url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions',
      data_repo_url: 'https://github.com/owid/co2-data',
      data_url: SOURCE_URL,
      grapher_base_url: 'https://ourworldindata.org/grapher/'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'OWID works best here as a long-run annual baseline layer. It complements NASA and NOAA operational sensing, but it is not a high-frequency hazard feed.'
    },
    learnings: [
      'OWID is strongest for long-run global comparisons and annual baselines rather than rapid operational monitoring.',
      'The World series is a reliable bridge between climate, energy, agriculture, transport, and land-use nodes because it keeps a shared temporal frame.',
      'OWID pairs well with NASA and NOAA in TULIP: OWID explains structural trend direction, while NASA and NOAA provide more physical and observational context.'
    ],
    coverage: {
      entity: 'World',
      record_count: worldSeries.length,
      start_year: worldSeries[0]?.year ?? null,
      end_year: latestYear
    },
    indicator_summaries
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_DATA_PATH, `${JSON.stringify(worldSeries, null, 2)}\n`, 'utf8');
  await writeFile(OUTPUT_CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output_data: OUTPUT_DATA_PATH,
    output_catalog: OUTPUT_CATALOG_PATH,
    record_count: worldSeries.length,
    latest_year: latestYear
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
