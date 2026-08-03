import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchJson,
  readMetricContracts,
  snapshotEnvelope,
  writeSnapshot
} from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_START = 2015;
const BASELINE_END = 2019;
const OBSERVATION_START = 2020;

const requestUrl = new URL('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/fish_ld_main');
requestUrl.search = new URLSearchParams({
  lang: 'en',
  sinceTimePeriod: String(BASELINE_START),
  pres: 'TOTAL',
  species: 'F00',
  natvessr: 'TOTAL',
  dest_use: 'TOTAL',
  unit: 'TPW'
}).toString();

const round = (value, digits = 3) => Number(value.toFixed(digits));

function orderedCategoryCodes(dimension) {
  const index = dimension?.category?.index;
  if (Array.isArray(index)) return index;
  return Object.entries(index || {})
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map(([code]) => code);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const contracts = await readMetricContracts(ROOT);
const metric = contracts.fish_landing_supply_disruption;
if (!metric?.metric_id) {
  throw new Error('Missing fish_landing_supply_disruption metric contract. Run npm run export:contracts first.');
}
if (metric.source_id !== 'eurostat_fisheries_landings') {
  throw new Error(`Unexpected fish-landings source contract: ${metric.source_id}`);
}

const payload = await fetchJson(requestUrl);
const expectedDimensions = ['freq', 'pres', 'species', 'natvessr', 'dest_use', 'unit', 'geo', 'time'];
if (JSON.stringify(payload.id) !== JSON.stringify(expectedDimensions)) {
  throw new Error(`Eurostat dimension schema changed: ${JSON.stringify(payload.id)}`);
}

const geographyCodes = orderedCategoryCodes(payload.dimension?.geo);
const timeCodes = orderedCategoryCodes(payload.dimension?.time);
const timeCount = timeCodes.length;
if (geographyCodes.length < 20 || timeCount < 6) {
  throw new Error(`Eurostat landings response is unexpectedly small: ${geographyCodes.length} geographies, ${timeCount} years`);
}

const sourceRows = Object.entries(payload.value || {}).map(([flatIndexRaw, valueRaw]) => {
  const flatIndex = Number(flatIndexRaw);
  const geographyIndex = Math.floor(flatIndex / timeCount);
  const timeIndex = flatIndex % timeCount;
  const geographyCode = geographyCodes[geographyIndex];
  const observationYear = Number(timeCodes[timeIndex]);
  const landingsTonnes = Number(valueRaw);
  if (!geographyCode || !Number.isInteger(observationYear) || !Number.isFinite(landingsTonnes) || landingsTonnes < 0) {
    throw new Error(`Invalid Eurostat landings cell at flat index ${flatIndexRaw}`);
  }
  return {
    geography_code: geographyCode,
    geography_name: payload.dimension.geo.category.label?.[geographyCode] || geographyCode,
    observation_year: observationYear,
    landings_tonnes_source_reported: landingsTonnes,
    source_status_flag: payload.status?.[flatIndexRaw] || null
  };
});

const rowsByGeography = new Map();
for (const row of sourceRows) {
  if (!rowsByGeography.has(row.geography_code)) rowsByGeography.set(row.geography_code, []);
  rowsByGeography.get(row.geography_code).push(row);
}

const records = [];
const withheld = [];
for (const [geographyCode, rows] of rowsByGeography) {
  const baselineRows = rows.filter(row => row.observation_year >= BASELINE_START && row.observation_year <= BASELINE_END);
  if (baselineRows.length < 3) {
    withheld.push({
      geography_code: geographyCode,
      reason: 'fewer_than_three_source_reported_baseline_years',
      baseline_observation_count: baselineRows.length
    });
    continue;
  }
  const baselineMean = mean(baselineRows.map(row => row.landings_tonnes_source_reported));
  if (!(baselineMean > 0)) {
    withheld.push({
      geography_code: geographyCode,
      reason: 'non_positive_baseline_mean',
      baseline_observation_count: baselineRows.length
    });
    continue;
  }

  for (const row of rows.filter(item => item.observation_year >= OBSERVATION_START)) {
    const anomalyTonnes = row.landings_tonnes_source_reported - baselineMean;
    const shortfallTonnes = Math.max(0, -anomalyTonnes);
    records.push({
      record_id: `eurostat_fish_ld_${geographyCode}_${row.observation_year}`,
      metric_id: metric.metric_id,
      measurement_role: 'annual_total_fishery_product_landings_shortfall_from_fixed_geography_baseline',
      geography_code: geographyCode,
      geography_name: row.geography_name,
      observation_year: row.observation_year,
      baseline_period_start: BASELINE_START,
      baseline_period_end: BASELINE_END,
      baseline_observation_count: baselineRows.length,
      baseline_mean_landings_tonnes: round(baselineMean),
      landings_tonnes_source_reported: round(row.landings_tonnes_source_reported),
      landings_anomaly_tonnes: round(anomalyTonnes),
      landings_anomaly_pct: round((anomalyTonnes / baselineMean) * 100),
      landings_shortfall_tonnes: round(shortfallTonnes),
      landings_shortfall_pct: round((shortfallTonnes / baselineMean) * 100),
      shortfall_observed: shortfallTonnes > 0,
      product_scope: 'TOTAL FISHERY PRODUCTS',
      presentation_scope: 'All presentation forms',
      destination_scope: 'Total',
      vessel_registration_scope: 'Total',
      unit: 'tonnes product weight',
      source_status_flag: row.source_status_flag,
      source_locator: requestUrl.toString()
    });
  }
}

records.sort((a, b) => a.geography_code.localeCompare(b.geography_code)
  || a.observation_year - b.observation_year);

if (records.length < 50) {
  throw new Error(`Eurostat landings transformation produced only ${records.length} records`);
}

const snapshot = snapshotEnvelope({
  jobId: 'fetch_eurostat_fish_landings_shortfall',
  source: {
    id: 'eurostat_fisheries_landings',
    name: 'Eurostat landings of fishery products',
    publisher: 'Eurostat',
    product: 'fish_ld_main',
    dataset_url: 'https://ec.europa.eu/eurostat/databrowser/view/fish_ld_main/default/table',
    metadata_url: 'https://ec.europa.eu/eurostat/cache/metadata/en/fish_ld_esms.htm',
    api_url: requestUrl.toString(),
    access: 'open_json_stat_api'
  },
  request: {
    url: requestUrl.toString(),
    filters: {
      since_time_period: BASELINE_START,
      presentation: 'TOTAL',
      species: 'F00',
      vessel_registration: 'TOTAL',
      destination_use: 'TOTAL',
      unit: 'TPW'
    },
    baseline_period: `${BASELINE_START}-${BASELINE_END}`,
    observation_period_start: OBSERVATION_START
  },
  contractIds: [metric.metric_id],
  contractBindings: [{
    node_id: 'fish_landing_supply_disruption',
    metric_contract_id: metric.metric_id,
    measurement_role: 'annual_total_fishery_product_landings_shortfall_from_fixed_geography_baseline'
  }],
  cadence: 'annual release check with complete 2015-forward series replacement',
  provenance: 'Official Eurostat fish_ld_main JSON-stat observations for total fishery products landed in EEA reporting geographies, all presentation forms, total vessel-registration scope, total destination use, and tonnes product weight. Shortfalls are transparent arithmetic comparisons with each geography’s fixed 2015-2019 source-reported mean.',
  uncertainty: 'Eurostat does not publish observation-level numeric uncertainty intervals in this API response. Administrative coverage, confidentiality treatment, national collection systems, revisions, product classification, landing-port geography, vessel scope and status flags affect comparison. The fixed baseline is analytical, not source-reported.',
  records,
  sourceSummary: {
    dataset_updated_at: payload.updated || null,
    source_cells_with_values: sourceRows.length,
    source_geographies_with_values: rowsByGeography.size,
    transformed_records: records.length,
    transformed_geographies: new Set(records.map(record => record.geography_code)).size,
    earliest_observation_year: Math.min(...records.map(record => record.observation_year)),
    latest_observation_year: Math.max(...records.map(record => record.observation_year)),
    records_with_shortfall: records.filter(record => record.shortfall_observed).length,
    source_status_flags_present: records.filter(record => record.source_status_flag).length,
    geographies_withheld: withheld
  },
  caveats: [
    'The metric is bounded to products landed in the reporting geography; it does not identify harvest location or establish climate, ecological, market, or governance attribution.',
    'A shortfall is a descriptive decline from a fixed geography-specific baseline, not proof of a supply-chain disruption or biological stock collapse.',
    'Country values can be confidential, provisional, estimated, revised, or structurally incomparable; source status flags are retained.',
    'Missing Eurostat cells are withheld. They are never transformed into zero landings or a 100 percent shortfall.'
  ],
  failureBehavior: 'Retain the last validated complete snapshot and mark stale; reject changed dimensions, an implausibly small panel, invalid negative landings, or insufficient baselines; never impute missing cells or infer disruption attribution from a landings decline.'
});

const output = await writeSnapshot(ROOT, 'eurostat-fish-landings-snapshot.json', snapshot);
console.log(JSON.stringify({
  output,
  records: records.length,
  geographies: new Set(records.map(record => record.geography_code)).size,
  observation_years: [...new Set(records.map(record => record.observation_year))],
  withheld_geographies: withheld.length,
  contract: metric.metric_id
}, null, 2));
