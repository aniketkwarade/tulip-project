import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'epa-nrsa-freshwater-condition-snapshot.json');
const SOURCE_ID = 'u_s_epa_national_rivers_and_streams_assessment_2018_2019';
const INGESTION_JOB_ID = 'fetch_epa_nrsa_freshwater_condition';
const METRIC_ID = 'epa_nrsa_poor_biological_condition';
const DATA_URL = 'https://riverstreamassessment.epa.gov/webreport/data/NRSA1819_Condition_StatusChange_T1T3_20221110.csv.json';
const REPORT_URL = 'https://riverstreamassessment.epa.gov/webreport/';
const PROGRAM_URL = 'https://www.epa.gov/national-aquatic-resource-surveys/nrsa';
const METHODS_URL = 'https://www.epa.gov/national-aquatic-resource-surveys/national-rivers-and-streams-assessment-2018-19-technical-support';
const SURVEY_PERIOD = '2018-2019';
const INCLUDED_TYPES = new Set(['NATIONAL', 'AG_ECO9']);
const INCLUDED_INDICATORS = new Set(['BENT_MMI_COND', 'FISH_MMI_COND']);
const REQUIRED_CATEGORIES = new Set(['Good', 'Fair', 'Poor', 'Not Assessed']);

const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

function finite(value, field, row) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`NRSA ${field} is not finite for ${row.Type}/${row.Subpopulation}/${row.Indicator}/${row.Category}`);
  return parsed;
}

function nullableNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchRows() {
  const response = await fetch(DATA_URL, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`EPA NRSA data request failed: ${response.status} ${response.statusText}`);
  const rows = await response.json();
  if (!Array.isArray(rows) || !rows.length) throw new Error('EPA NRSA payload is not a non-empty array');
  return rows;
}

function categoryRecord(row) {
  return {
    category: row.Category,
    category_display: row.CatCondPL,
    sampled_sites: finite(row['Count.NResp.T3.Cond'], 'Count.NResp.T3.Cond', row),
    estimated_river_stream_miles_pct: round(finite(row['Est.P.T3.Cond'], 'Est.P.T3.Cond', row)),
    lower_95_interval_pct: round(nullableNumber(row['LCB.P.T3.Cond'])),
    upper_95_interval_pct: round(nullableNumber(row['UCB.P.T3.Cond'])),
    estimated_river_stream_miles: round(finite(row['Est.U.T3.Cond'], 'Est.U.T3.Cond', row)),
    lower_95_interval_miles: round(nullableNumber(row['LCB.U.T3.Cond'])),
    upper_95_interval_miles: round(nullableNumber(row['UCB.U.T3.Cond'])),
    change_from_2013_2014_percentage_points: round(nullableNumber(row['Est.P.T3-T2.Cond'])),
    change_lower_95_interval_percentage_points: round(nullableNumber(row['LCB.P.T3-T2.Cond'])),
    change_upper_95_interval_percentage_points: round(nullableNumber(row['UCB.P.T3-T2.Cond'])),
    change_statistically_significant_95pct: row['Sig.P.T3-T2.Cond'] === 'Y'
  };
}

async function main() {
  const sourceRows = await fetchRows();
  const selectedRows = sourceRows.filter(row =>
    row.MetricCat === 'Biological'
    && INCLUDED_TYPES.has(row.Type)
    && INCLUDED_INDICATORS.has(row.Indicator)
    && row.CatCondBreakout === 'Displayed'
    && REQUIRED_CATEGORIES.has(row.Category)
  );
  const groups = new Map();
  for (const row of selectedRows) {
    const key = `${row.Type}|${row.Subpopulation}|${row.Indicator}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  if (groups.size !== 20) throw new Error(`Expected 20 NRSA national/ecoregion indicator groups, received ${groups.size}`);

  const records = [...groups.entries()].map(([key, rows]) => {
    if (rows.length !== REQUIRED_CATEGORIES.size || new Set(rows.map(row => row.Category)).size !== REQUIRED_CATEGORIES.size) {
      throw new Error(`NRSA category coverage failed for ${key}`);
    }
    const first = rows[0];
    const categories = Object.fromEntries(rows.map(row => [row.Category.toLowerCase().replaceAll(' ', '_'), categoryRecord(row)]));
    const poor = categories.poor;
    if (![poor.estimated_river_stream_miles_pct, poor.lower_95_interval_pct, poor.upper_95_interval_pct, poor.estimated_river_stream_miles].every(Number.isFinite)) {
      throw new Error(`NRSA poor-condition estimate is incomplete for ${key}`);
    }
    const assessedShare = categories.good.estimated_river_stream_miles_pct + categories.fair.estimated_river_stream_miles_pct + categories.poor.estimated_river_stream_miles_pct;
    return {
      record_id: `epa_nrsa_${first.Type.toLowerCase()}_${first.Subpopulation.toLowerCase().replaceAll(/[^a-z0-9]+/g, '_')}_${first.Indicator.toLowerCase()}`,
      geography_type: first.Type,
      geography_type_name: first.TypePL,
      subpopulation_code: first.Subpopulation,
      subpopulation_name: first.SubpopPL,
      survey_period: SURVEY_PERIOD,
      indicator_code: first.Indicator,
      indicator_name: first.IndicatorPL,
      poor_condition_river_stream_miles_pct: poor.estimated_river_stream_miles_pct,
      poor_condition_lower_95_interval_pct: poor.lower_95_interval_pct,
      poor_condition_upper_95_interval_pct: poor.upper_95_interval_pct,
      poor_condition_estimated_river_stream_miles: poor.estimated_river_stream_miles,
      sampled_sites_with_poor_condition: poor.sampled_sites,
      assessed_river_stream_miles_pct: round(assessedShare),
      not_assessed_river_stream_miles_pct: categories.not_assessed.estimated_river_stream_miles_pct,
      change_from_2013_2014_percentage_points: poor.change_from_2013_2014_percentage_points,
      change_lower_95_interval_percentage_points: poor.change_lower_95_interval_percentage_points,
      change_upper_95_interval_percentage_points: poor.change_upper_95_interval_percentage_points,
      change_statistically_significant_95pct: poor.change_statistically_significant_95pct,
      condition_categories: categories,
      source_locator: {
        data_url: DATA_URL,
        report_url: REPORT_URL,
        program_url: PROGRAM_URL,
        methods_url: METHODS_URL,
        source_filters: {
          MetricCat: 'Biological',
          Type: first.Type,
          Subpopulation: first.Subpopulation,
          Indicator: first.Indicator,
          CatCondBreakout: 'Displayed'
        },
        estimate_fields: ['Est.P.T3.Cond', 'LCB.P.T3.Cond', 'UCB.P.T3.Cond', 'Est.U.T3.Cond', 'Count.NResp.T3.Cond']
      }
    };
  }).sort((a, b) => a.geography_type.localeCompare(b.geography_type) || a.subpopulation_name.localeCompare(b.subpopulation_name) || a.indicator_code.localeCompare(b.indicator_code));

  const snapshot = {
    version: 'epa_nrsa_2018_2019_biological_condition_v1',
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'U.S. EPA National Rivers and Streams Assessment 2018-2019',
      url: REPORT_URL,
      data_url: DATA_URL
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: [METRIC_ID],
    cadence: 'release-triggered refresh for each completed NRSA survey cycle',
    provenance: 'Official EPA probability-based NRSA condition estimates used by the published 2018-2019 web report, retaining national and nine-ecoregion benthic-macroinvertebrate and fish-community categories, sampled-site counts, estimated river miles, and source 95 percent confidence bounds.',
    uncertainty: 'Survey weights, site accessibility, reference-condition thresholds, index construction, fish nonresponse, temporal sampling, ecoregional calibration, and changes in survey design affect estimates and comparisons.',
    failure_behavior: 'Retain the last validated survey release and mark its period; reject missing category, confidence-bound, geography, or indicator rows; never infer local waterbody condition, unassessed waters, lakes, global freshwater condition, or ecosystem collapse from this survey.',
    boundary: 'This metric estimates biological condition for perennial rivers and streams in the conterminous United States. Poor benthic or fish condition is a bounded ecosystem-condition indicator, not proof that a freshwater ecosystem has collapsed. National and ecoregional records are separate survey estimates and must not be summed.',
    source_row_count: sourceRows.length,
    selected_source_row_count: selectedRows.length,
    record_count: records.length,
    records
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: OUTPUT_PATH, records: records.length, national_records: records.filter(record => record.geography_type === 'NATIONAL').length, ecoregion_records: records.filter(record => record.geography_type === 'AG_ECO9').length }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
