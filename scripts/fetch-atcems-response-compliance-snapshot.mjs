import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'atcems-response-compliance-snapshot.json');
const SOURCE_ID = 'austin_travis_county_ems_incidents_by_month';
const INGESTION_JOB_ID = 'fetch_atcems_response_compliance';
const METRIC_ID = 'atcems_response_goal_miss_rate';
const DATASET_ID = 'gjtj-jt2d';
const API_URL = `https://data.austintexas.gov/resource/${DATASET_ID}.json`;
const METADATA_URL = `https://data.austintexas.gov/api/views/${DATASET_ID}`;
const DATASET_URL = `https://data.austintexas.gov/Public-Safety/EMS-Incidents-by-Month/${DATASET_ID}`;
const ROLLING_MONTHS = 36;

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw new Error(`Austin Open Data request failed: ${response.status} ${response.statusText}`);
  return response.json();
}

function numberValue(row, field, { integer = false } = {}) {
  const value = Number(row[field]);
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    throw new Error(`Invalid ${field} for ATCEMS month ${row.month_key}`);
  }
  return value;
}

function priorityRecord(row, geography, priority) {
  const prefix = geography === 'city_of_austin' ? 'coa' : 'tc';
  const incidents = numberValue(row, `count_incidents_${prefix}_p${priority}`, { integer: true });
  const onTime = numberValue(row, `percent_on_time_${prefix}_p${priority}`);
  if (onTime > 100) throw new Error(`Invalid priority compliance for ${row.month_key}`);
  return {
    geography,
    priority: `Priority ${priority}`,
    incidents,
    source_reported_on_time_pct: onTime,
    derived_response_goal_miss_pct: round(100 - onTime),
    derived_missed_incidents_approx: Math.round(incidents * (100 - onTime) / 100)
  };
}

async function main() {
  const queryUrl = new URL(API_URL);
  queryUrl.searchParams.set('$limit', String(ROLLING_MONTHS));
  queryUrl.searchParams.set('$order', 'month_key desc');
  const [rows, metadata] = await Promise.all([fetchJson(queryUrl), fetchJson(METADATA_URL)]);
  if (!Array.isArray(rows) || rows.length < 24) throw new Error(`ATCEMS returned only ${rows?.length || 0} monthly rows.`);
  if (new Set(rows.map(row => row.month_key)).size !== rows.length) throw new Error('ATCEMS snapshot contains duplicate month keys.');

  const records = rows.map(row => {
    const total = numberValue(row, 'count_incidents_all', { integer: true });
    const city = numberValue(row, 'count_incidents_coa', { integer: true });
    const county = numberValue(row, 'count_incidents_tc', { integer: true });
    const other = numberValue(row, 'count_incidents_other', { integer: true });
    const overallOnTime = numberValue(row, 'percent_on_time_all');
    const cityOnTime = numberValue(row, 'percent_on_time_coa');
    const countyOnTime = numberValue(row, 'percent_on_time_tc');
    const target = numberValue(row, 'percent_on_time_target');
    if ([overallOnTime, cityOnTime, countyOnTime, target].some(value => value > 100)) throw new Error(`ATCEMS percentage above 100 for ${row.month_key}`);
    if (city + county + other !== total) throw new Error(`ATCEMS service-area counts do not sum for ${row.month_key}`);
    const priorityBreakdown = [];
    for (let priority = 1; priority <= 5; priority += 1) {
      priorityBreakdown.push(priorityRecord(row, 'city_of_austin', priority));
      priorityBreakdown.push(priorityRecord(row, 'travis_county_outside_city', priority));
    }
    return {
      record_id: `atcems_response_compliance_${row.month_key}`,
      metric_id: METRIC_ID,
      measurement_role: 'local_monthly_response_goal_miss_operational_proxy',
      month_key: Number(row.month_key),
      month_start_date: row.month_start_date,
      total_incidents: total,
      city_of_austin_incidents: city,
      travis_county_incidents: county,
      other_area_incidents: other,
      source_reported_overall_on_time_pct: overallOnTime,
      source_reported_city_on_time_pct: cityOnTime,
      source_reported_county_on_time_pct: countyOnTime,
      source_reported_target_on_time_pct: target,
      derived_overall_response_goal_miss_pct: round(100 - overallOnTime),
      derived_overall_missed_incidents_approx: Math.round(total * (100 - overallOnTime) / 100),
      derived_target_shortfall_percentage_points: round(Math.max(target - overallOnTime, 0)),
      priority_breakdown: priorityBreakdown,
      source_locator: {
        query_url: queryUrl.toString(),
        metadata_url: METADATA_URL,
        dataset_url: DATASET_URL,
        source_fields: ['count_incidents_all', 'percent_on_time_all', 'percent_on_time_target', 'service-area and priority-specific count/compliance fields']
      }
    };
  });

  const snapshot = {
    version: 'atcems_monthly_response_goal_compliance_v1',
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: metadata.name || 'EMS - Incidents by Month',
      url: DATASET_URL,
      api_url: API_URL,
      access: 'open_socrata_api'
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: [METRIC_ID],
    cadence: 'Monthly source refresh with a rolling 36-month snapshot.',
    provenance: 'Official Austin-Travis County EMS monthly CAD-derived incident counts and response-goal compliance by service area and incident priority, with the source target retained.',
    uncertainty: 'Aggregate source percentages are rounded. Priority coding, response-goal definitions, dispatch practices, mutual aid, service-area boundaries, traffic, revisions and partial periods affect values. A goal miss is not proof of capacity exceedance or patient harm.',
    failure_behavior: 'Retain the last validated snapshot and mark stale; reject duplicate months, missing targets or counts, invalid percentages or fewer than 24 months; never infer dispatch saturation, treatment capacity, causal overload or national EMS performance.',
    measurement_boundary: 'The primary measure is the source-reported on-time response percentage and its arithmetic complement. Approximate missed-incident counts are derived from rounded percentages and labeled accordingly. This is a bounded local operational proxy, not a direct capacity-exceedance count.',
    source_last_updated_epoch_seconds: metadata.rowsUpdatedAt || null,
    record_count: records.length,
    records
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    records: records.length,
    latest_month: records[0].month_key,
    latest_incidents: records[0].total_incidents,
    latest_on_time_pct: records[0].source_reported_overall_on_time_pct,
    latest_miss_pct: records[0].derived_overall_response_goal_miss_pct
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
