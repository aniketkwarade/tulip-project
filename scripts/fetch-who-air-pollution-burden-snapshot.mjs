import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'who-air-pollution-burden-snapshot.json');
const SOURCE_ID = 'who_gho_odata_api';
const INGESTION_JOB_ID = 'fetch_who_air_pollution_health_burden';
const INDICATOR_CODE = 'AIR_42';
const INDICATOR_NAME = 'Ambient air pollution attributable death rate (per 100 000 population, age-standardized)';
const OBSERVATION_YEAR = 2021;
const API_ROOT = 'https://ghoapi.azureedge.net/api';
const DOCS_URL = 'https://www.who.int/data/gho/info/gho-odata-api';
const METADATA_URL = 'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/ambient-air-pollution-attributable-death-rate-%28per-100-000-population-age-standardized%29';

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw new Error(`WHO GHO request failed: ${response.status} ${response.statusText}`);
  return response.json();
}

function indicatorUrl() {
  const query = new URLSearchParams({
    '$filter': `Dim1 eq 'SEX_BTSX' and Dim2 eq 'GHECAUSE_GHE000000' and TimeDim eq ${OBSERVATION_YEAR}`,
    '$format': 'json'
  });
  return `${API_ROOT}/${INDICATOR_CODE}?${query}`;
}

async function main() {
  const dataUrl = indicatorUrl();
  const countryUrl = `${API_ROOT}/Dimension/COUNTRY/DimensionValues?%24format=json`;
  const [indicatorPayload, countryPayload] = await Promise.all([
    fetchJson(dataUrl),
    fetchJson(countryUrl)
  ]);
  const countryByCode = new Map((countryPayload.value || []).map(country => [country.Code, country]));
  const rows = (indicatorPayload.value || [])
    .filter(row => Number.isFinite(Number(row.NumericValue)))
    .filter(row => Number.isFinite(Number(row.Low)) && Number.isFinite(Number(row.High)))
    .map(row => {
      const country = countryByCode.get(row.SpatialDim);
      return {
        record_id: `who_${INDICATOR_CODE.toLowerCase()}_${row.SpatialDim.toLowerCase()}_${row.TimeDim}`,
        indicator_code: row.IndicatorCode,
        indicator_name: INDICATOR_NAME,
        country_code: row.SpatialDim,
        country_name: country?.Title || row.SpatialDim,
        who_region_code: row.ParentLocationCode || country?.ParentCode || null,
        who_region_name: row.ParentLocation || country?.ParentTitle || null,
        observation_year: row.TimeDim,
        sex: 'both sexes',
        cause_scope: 'all WHO causes included in the ambient-air-pollution comparative risk assessment',
        attributable_death_rate_per_100000_age_standardized: Number(row.NumericValue),
        lower_95_interval_per_100000: Number(row.Low),
        upper_95_interval_per_100000: Number(row.High),
        source_display_value: row.Value,
        source_updated_at: row.Date,
        source_locator: {
          api_url: dataUrl,
          api_docs_url: DOCS_URL,
          indicator_metadata_url: METADATA_URL,
          odata_dimensions: {
            sex: row.Dim1,
            cause: row.Dim2,
            geography: row.SpatialDimType,
            time: row.TimeDimType
          }
        }
      };
    })
    .sort((a, b) => b.attributable_death_rate_per_100000_age_standardized - a.attributable_death_rate_per_100000_age_standardized || a.country_code.localeCompare(b.country_code));

  if (!rows.length) throw new Error('WHO GHO returned no complete AIR_42 both-sex, all-cause country records.');
  if (rows.some(row => row.lower_95_interval_per_100000 > row.attributable_death_rate_per_100000_age_standardized
    || row.upper_95_interval_per_100000 < row.attributable_death_rate_per_100000_age_standardized)) {
    throw new Error('WHO GHO returned an estimate outside its uncertainty interval.');
  }

  const snapshot = {
    version: `who_air_pollution_burden_${OBSERVATION_YEAR}_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'WHO Global Health Observatory OData API',
      url: API_ROOT,
      docs_url: DOCS_URL,
      indicator_metadata_url: METADATA_URL,
      access: 'open_api'
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: ['air_pollution_attributable_health_burden'],
    indicator: {
      code: INDICATOR_CODE,
      name: INDICATOR_NAME,
      unit: 'attributable deaths per 100,000 population, age-standardized',
      observation_year: OBSERVATION_YEAR,
      disaggregation: 'country, both sexes, all included causes'
    },
    cadence: 'Source check monthly; refresh when WHO publishes a new comparative-risk-assessment release, expected every two to four years.',
    provenance: 'WHO Global Health Observatory AIR_42 country estimates for both sexes and the all-cause aggregate in 2021, with source-reported lower and upper uncertainty bounds retained.',
    uncertainty: 'WHO estimates combine population exposure, integrated exposure-response functions, background disease burden, and population data. Epidemiological evidence, exposure modeling, background burden, and household-energy inputs can change across releases.',
    failure_behavior: 'Retain the last validated WHO release, mark stale, expose missing countries or schema changes, and never replace a missing estimate or interval with zero.',
    measurement_boundary: 'These are population-level comparative-risk-assessment estimates attributable to ambient air pollution, not registered death-certificate counts and not proof that air pollution caused an individual death. Household-only burden, joint household-and-ambient burden, pollutant concentration, admissions, and DALYs remain separate metrics.',
    record_count: rows.length,
    countries_with_complete_interval: rows.length,
    records: rows
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    records: rows.length,
    indicator_code: INDICATOR_CODE,
    observation_year: OBSERVATION_YEAR
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
