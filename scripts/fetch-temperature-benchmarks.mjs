import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'temperature-benchmarks.json');
const REFRESH_DAYS = 35;

const GISS_URL = 'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.txt';
const GISS_CSV_URL = 'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv';
const GISS_ZONAL_CSV_URL = 'https://data.giss.nasa.gov/gistemp/tabledata_v4/ZonAnn.Ts+dSST.csv';
const BERKELEY_HR_URL = 'https://storage.googleapis.com/berkeley-earth-temperature-hr/global/Global_TAVG_monthly.txt';
const WMO_STATE_OF_CLIMATE_2025_URL = 'https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025';
const NOAA_GLOBAL_CLIMATE_JUNE_2026_URL = 'https://www.ncei.noaa.gov/news/global-climate-202606';
const COPERNICUS_JUNE_2026_URL = 'https://climate.copernicus.eu/surface-air-temperature-june-2026';

const METHODOLOGY_BOUNDARIES = {
  anchor_definition: 'Observed global mean surface temperature anomaly anchored to annual surface records rather than to an inferred forcing proxy.',
  baseline_boundary: 'NASA and Berkeley Earth anomalies here are relative to 1951-1980, NOAA monthly reporting often cites the 20th-century average, and WMO/Copernicus frequently cite 1850-1900 or 1991-2020 baselines. Do not collapse those baselines into fake precision.',
  satellite_boundary: 'AIRS and related catalog surfaces add atmospheric context and discovery paths, but they are not interchangeable with the long surface-temperature record used for the anchor.',
  not_a_proxy: 'Greenhouse-gas concentrations and radiative forcing explain upstream warming pressure, but they are not themselves the observed temperature metric.'
};

const ANNUAL_SYNTHESIS = {
  latest_complete_year: {
    source_id: 'wmo_state_of_global_climate_2025',
    name: 'WMO State of the Global Climate 2025',
    url: WMO_STATE_OF_CLIMATE_2025_URL,
    access: 'open_web',
    observed_at: '2025',
    anomaly_c: 1.43,
    baseline_period: '1850-1900',
    ranking_note: 'Second or third warmest year on record in the WMO synthesis.',
    statement: 'WMO reports that 2025 remained about 1.43 C above the 1850-1900 average.'
  }
};

const MONITORING_CONTEXT = [
  {
    source_id: 'noaa_ncei_global_climate_june_2026',
    name: 'NOAA NCEI Global Climate Report, June 2026',
    url: NOAA_GLOBAL_CLIMATE_JUNE_2026_URL,
    access: 'open_web',
    cadence_note: 'Monthly climate report.',
    observed_at: '2026-06',
    anomaly_c: 1.09,
    anomaly_f: 1.96,
    baseline_period: '20th-century average',
    ranking_note: 'Second-warmest June on record globally.'
  },
  {
    source_id: 'copernicus_surface_air_temperature_june_2026',
    name: 'Copernicus Climate Change Service surface air temperature bulletin, June 2026',
    url: COPERNICUS_JUNE_2026_URL,
    access: 'open_web',
    cadence_note: 'Monthly climate bulletin.',
    observed_at: '2026-06',
    absolute_c: 16.54,
    anomaly_c_vs_1991_2020: 0.56,
    anomaly_c_vs_1850_1900: 1.39,
    trailing_12_month_anomaly_c_vs_1850_1900: 1.43,
    ranking_note: 'Second-warmest June globally in the Copernicus record.'
  }
];

const SATELLITE_CONTEXT = [
  {
    source_id: 'nasa_giss_airs_support',
    name: 'NASA GISS GISTEMP v4 supporting data, including AIRS lower-troposphere context',
    url: 'https://data.giss.nasa.gov/gistemp/data_v4.html',
    access: 'open_download',
    role: 'supporting_atmospheric_context',
    notes: 'NASA documents open AIRS anomaly tables as supporting atmospheric context alongside the surface record.'
  },
  {
    source_id: 'nasa_earthdata_cmr_airs_collections',
    name: 'NASA Earthdata CMR AIRS collection search',
    url: 'https://cmr.earthdata.nasa.gov/search/collections.json?keyword=AIRS%20temperature&page_size=5',
    access: 'open_catalog_api',
    role: 'catalog_discovery',
    notes: 'Open metadata API for finding AIRS-related temperature collections.'
  },
  {
    source_id: 'nasa_earthdata_search_airs',
    name: 'NASA Earthdata Search AIRS collections',
    url: 'https://search.earthdata.nasa.gov/search?q=AIRS%20temperature',
    access: 'mixed_or_gated',
    needs_login: true,
    login_requirement: 'Many granule downloads require Earthdata Login and accepted collection terms.',
    role: 'download_and_visual_discovery',
    notes: 'Public search surface with mixed access; download rights vary by collection.'
  }
];

const ACCESS_SURFACES = [
  {
    source_id: 'nasa_giss_gistemp_portal',
    name: 'NASA GISS GISTEMP portal',
    surface_type: 'portal',
    access: 'open_download',
    url: 'https://data.giss.nasa.gov/gistemp/',
    notes: 'Open monthly and annual surface-temperature tables and graphs.'
  },
  {
    source_id: 'berkeley_earth_data_portal',
    name: 'Berkeley Earth temperature data portal',
    surface_type: 'portal',
    access: 'open_download',
    url: 'https://berkeleyearth.org/data/',
    notes: 'Open monthly global land-ocean temperature downloads.'
  },
  {
    source_id: 'noaa_ncei_geoportal_opensearch',
    name: 'NOAA NCEI geoportal OpenSearch',
    surface_type: 'open_api',
    access: 'open_api',
    url: 'https://www.ncei.noaa.gov/metadata/granule/geoportal/opensearch?q=global%20temperature&f=json',
    notes: 'Open metadata API surface for temperature-related datasets.'
  },
  {
    source_id: 'nasa_earthdata_cmr_collections_api',
    name: 'NASA Earthdata CMR collections API',
    surface_type: 'open_catalog_api',
    access: 'open_catalog_api',
    url: 'https://cmr.earthdata.nasa.gov/search/collections.json?keyword=global%20temperature&page_size=5',
    notes: 'Open metadata search API for NASA temperature collections.'
  },
  {
    source_id: 'copernicus_cds_catalogue_api',
    name: 'Copernicus CDS catalogue API',
    surface_type: 'open_api',
    access: 'open_api',
    url: 'https://cds.climate.copernicus.eu/api/catalogue/v1/datasets?q=surface%20air%20temperature&limit=3',
    notes: 'Open dataset discovery API for Copernicus Climate Data Store listings.'
  },
  {
    source_id: 'copernicus_cds_retrieve_api',
    name: 'Copernicus CDS retrieve API',
    surface_type: 'gated_api',
    access: 'gated_api',
    needs_login: true,
    login_requirement: 'Requires a CDS account, accepted dataset terms, and a ~/.cdsapirc token.',
    url: 'https://cds.climate.copernicus.eu/how-to-api',
    notes: 'Retrieval is authenticated even though catalogue discovery is open.'
  },
  {
    source_id: 'nasa_earthdata_search_portal',
    name: 'NASA Earthdata Search portal',
    surface_type: 'mixed_download_portal',
    access: 'mixed_or_gated',
    needs_login: true,
    login_requirement: 'Many collection downloads require Earthdata Login.',
    url: 'https://search.earthdata.nasa.gov/',
    notes: 'Public portal for search and preview; collection downloads may be gated.'
  }
];

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/plain, text/csv, */*',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)',
      Referer: 'https://data.giss.nasa.gov/gistemp/'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }

  return response.text();
}

async function fetchFirstAvailable(urls) {
  let lastError = null;

  for (const url of urls) {
    try {
      return {
        url,
        text: await fetchText(url)
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

function formatMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function parseGiss(text, resolvedUrl) {
  const lines = text.split('\n').map(line => line.trimEnd());
  const baselineLine = lines.find(line => line.includes('base period:'));
  const sourceLine = lines.find(line => line.includes('sources:'));
  const dataLines = lines.filter(line => /^\d{4}\s+/.test(line));

  const rows = dataLines
    .map(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 18) return null;
      const year = Number(parts[0]);
      const monthly = parts.slice(1, 13).map(value => value === '****' ? null : Number(value) / 100);
      const annualMean = parts[13] === '****' || parts[13] === '***' ? null : Number(parts[13]) / 100;
      return { year, monthly, annualMean };
    })
    .filter(Boolean);

  const latestMonthlyRow = [...rows].reverse().find(row => row.monthly.some(value => value !== null));
  const latestMonthIndex = latestMonthlyRow ? latestMonthlyRow.monthly.map((value, index) => ({ value, index })).filter(item => item.value !== null).at(-1)?.index ?? null : null;
  const latestAnnualRow = [...rows].reverse().find(row => row.annualMean !== null);

  return {
    source_id: 'nasa_giss_gistemp_v4',
    name: 'NASA GISS Surface Temperature Analysis (GISTEMP v4)',
    url: 'https://data.giss.nasa.gov/gistemp/',
    download_url: resolvedUrl,
    access: 'open_download',
    update_cadence_note: 'NASA states the graphs and tables are updated about the 10th of every month.',
    baseline_period: baselineLine?.split('base period:')[1]?.trim() || '1951-1980',
    methodology_note: sourceLine?.replace(/\s+/g, ' ').trim() || null,
    provisional: false,
    latest_month: latestMonthlyRow && latestMonthIndex !== null ? {
      observed_at: formatMonth(latestMonthlyRow.year, latestMonthIndex + 1),
      anomaly_c: round(latestMonthlyRow.monthly[latestMonthIndex], 3)
    } : null,
    latest_complete_year: latestAnnualRow ? {
      observed_at: String(latestAnnualRow.year),
      anomaly_c: round(latestAnnualRow.annualMean, 3)
    } : null
  };
}

function parseBerkeley(text) {
  const lines = text.split('\n');
  const baselineLine = lines.find(line => line.includes('relative to the Jan 1951-Dec 1980 average'));
  const runLine = lines.find(line => line.includes('The land analysis was run on'));
  const citationLineIndex = lines.findIndex(line => line.includes('The current citation for this dataset is:'));
  const citationLine = citationLineIndex >= 0 ? lines.slice(citationLineIndex + 2, citationLineIndex + 5).map(line => line.trim()).join(' ') : null;

  const dataLines = lines.filter(line => /^\s+\d{4}\s+\d{1,2}\s+/.test(line));
  const rows = dataLines
    .map(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 6) return null;
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const anomaly = Number(parts[2]);
      const annualAnomaly = parts[4] === 'NaN' ? null : Number(parts[4]);
      return { year, month, anomaly, annualAnomaly };
    })
    .filter(Boolean);

  const latestMonthly = rows.at(-1) || null;
  const annualRows = rows.filter(row => row.month === 12 && row.annualAnomaly !== null);
  const latestAnnual = annualRows.at(-1) || null;

  return {
    source_id: 'berkeley_earth_high_resolution_global_monthly',
    name: 'Berkeley Earth High-Resolution Monthly Global Average Temperature',
    url: 'https://berkeleyearth.org/data/',
    download_url: BERKELEY_HR_URL,
    access: 'open_download',
    update_cadence_note: 'Berkeley Earth publishes this high-resolution monthly global average as an experimental preview and notes it is subject to change.',
    baseline_period: baselineLine ? '1951-1980' : null,
    methodology_note: runLine?.trim().replace(/\s+/g, ' ') || null,
    citation: citationLine?.replace(/\s+/g, ' ') || null,
    provisional: true,
    latest_month: latestMonthly ? {
      observed_at: formatMonth(latestMonthly.year, latestMonthly.month),
      anomaly_c: round(latestMonthly.anomaly, 3)
    } : null,
    latest_complete_year: latestAnnual ? {
      observed_at: String(latestAnnual.year),
      anomaly_c: round(latestAnnual.annualAnomaly, 3)
    } : null
  };
}

function parseGissZonalAnnual(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(value => value.trim());
  const globalIndex = headers.indexOf('Glob');
  const arcticIndex = headers.indexOf('64N-90N');
  if (headers[0] !== 'Year' || globalIndex < 0 || arcticIndex < 0) throw new Error('NASA GISS zonal annual table schema changed.');
  const records = lines.slice(1).map(line => line.split(',').map(value => value.trim())).map(fields => ({
    year: Number(fields[0]),
    global_anomaly_c: Number(fields[globalIndex]),
    arctic_64n_90n_anomaly_c: Number(fields[arcticIndex])
  })).filter(record => Number.isInteger(record.year)
    && Number.isFinite(record.global_anomaly_c)
    && Number.isFinite(record.arctic_64n_90n_anomaly_c));
  if (records.length < 100) throw new Error(`NASA GISS zonal annual history is unexpectedly short at ${records.length} rows.`);
  return records;
}

function buildCrossCheck(sources) {
  const annual = sources
    .map(source => ({
      source_id: source.source_id,
      observed_at: source.latest_complete_year?.observed_at || null,
      anomaly_c: source.latest_complete_year?.anomaly_c ?? null
    }))
    .filter(entry => entry.observed_at && entry.anomaly_c !== null);

  const month = sources
    .map(source => ({
      source_id: source.source_id,
      observed_at: source.latest_month?.observed_at || null,
      anomaly_c: source.latest_month?.anomaly_c ?? null
    }))
    .filter(entry => entry.observed_at && entry.anomaly_c !== null);

  const annualSpread = annual.length >= 2
    ? round(Math.max(...annual.map(entry => entry.anomaly_c)) - Math.min(...annual.map(entry => entry.anomaly_c)), 3)
    : null;
  const monthlySpread = month.length >= 2 && month.every(entry => entry.observed_at === month[0].observed_at)
    ? round(Math.max(...month.map(entry => entry.anomaly_c)) - Math.min(...month.map(entry => entry.anomaly_c)), 3)
    : null;

  return {
    annual_alignment: {
      comparable_year: annual.every(entry => entry.observed_at === annual[0]?.observed_at) ? annual[0]?.observed_at || null : null,
      spread_c: annualSpread,
      values: annual
    },
    monthly_alignment: {
      comparable_month: monthlySpread !== null ? month[0]?.observed_at || null : null,
      spread_c: monthlySpread,
      values: month
    }
  };
}

async function main() {
  const [gissPayload, berkeleyText, gissZonalText] = await Promise.all([
    fetchFirstAvailable([GISS_URL, GISS_CSV_URL]),
    fetchText(BERKELEY_HR_URL),
    fetchText(GISS_ZONAL_CSV_URL)
  ]);

  const sources = [parseGiss(gissPayload.text, gissPayload.url), parseBerkeley(berkeleyText)];
  const registry = {
    version: new Date().toISOString(),
    updated_at: new Date().toISOString().slice(0, 10),
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'These benchmark products are monthly observational updates suited to snapshot refreshes, not live real-time feeds.'
    },
    benchmark_family: 'global_surface_temperature',
    use_guidance: {
      primary_role: 'Cross-check the TULIP temperature anchor against multiple observational products while keeping annual synthesis, monthly monitoring, and satellite/catalog context distinct.',
      caution: 'Do not collapse source differences into fake precision, and do not mix anomaly baselines as though they were numerically interchangeable. Berkeley Earth high-resolution data is marked experimental by the publisher.'
    },
    methodology_boundaries: METHODOLOGY_BOUNDARIES,
    annual_synthesis: ANNUAL_SYNTHESIS,
    monitoring_context: MONITORING_CONTEXT,
    satellite_context: SATELLITE_CONTEXT,
    access_surfaces: ACCESS_SURFACES,
    sources,
    giss_zonal_annual: {
      source_id: 'nasa_giss_surface_temperature_analysis',
      download_url: GISS_ZONAL_CSV_URL,
      baseline_period: '1951-1980',
      geography: 'global and 64N-90N zonal annual surface-temperature anomalies',
      records: parseGissZonalAnnual(gissZonalText)
    },
    cross_check: buildCrossCheck(sources)
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    source_count: sources.length,
    latest_giss_month: sources[0]?.latest_month?.observed_at || null,
    latest_berkeley_month: sources[1]?.latest_month?.observed_at || null
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
