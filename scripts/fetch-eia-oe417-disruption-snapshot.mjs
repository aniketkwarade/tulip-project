import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'eia-oe417-disruption-snapshot.json');
const SOURCE_ID = 'eia_major_disturbances_and_unusual_occurrences_doe_417';
const INGESTION_JOB_ID = 'fetch_eia_oe417_disruption_metrics';
const METRIC_ID = 'eia_oe417_reported_customer_interruption_burden';
const TABLE_URL = 'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_b_2';
const EIA_FAQ_URL = 'https://www.eia.gov/tools/faqs/faq.php?id=1194';
const DOE_FORM_URL = 'https://doe417.energy.gov/files/DOE-417_Form.pdf';
const EXPECTED_HEADERS = Object.freeze([
  'Year',
  'Month',
  'Event Date and Time',
  'Restoration Date and Time',
  'Duration',
  'Utility/Power Pool',
  'NERC Region',
  'Area Affected',
  'Type of Disturbance',
  'Loss (megawatts)',
  'Number of Customers Affected'
]);

const round = (value, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

function decodeHtml(value) {
  return value
    .replaceAll(/<br\s*\/?\s*>/gi, ' ')
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function parseDurationHours(value) {
  const normalized = value.trim();
  const match = normalized.match(/^(?:(\d+)\s+Days?,\s*)?(\d+)\s+Hours?,\s*(\d+)\s+Minutes?$/i);
  if (!match) return null;
  return Number(match[1] || 0) * 24 + Number(match[2]) + Number(match[3]) / 60;
}

function parseInteger(value) {
  const normalized = value.replaceAll(',', '').trim();
  if (!normalized || /^(N\/A|NA|Unknown|Not Reported)$/i.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function fetchTableHtml() {
  const response = await fetch(TABLE_URL, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`EIA OE-417 table request failed: ${response.status} ${response.statusText}`);
  return response.text();
}

function parseTable(html) {
  const titleMatch = html.match(/Table B\.2 Major Disturbances and Unusual Occurrences,\s+(\d{4})/i);
  if (!titleMatch) throw new Error('EIA OE-417 table year was not found');
  const tableMatch = html.match(/<table[^>]+summary="Procedure Print: Data Set WORK\.TABLE_B_2"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) throw new Error('EIA OE-417 data table was not found');
  const headerSection = tableMatch[1].match(/<thead[^>]*>([\s\S]*?)<\/thead>/i)?.[1];
  const bodySection = tableMatch[1].match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1];
  if (!headerSection || !bodySection) throw new Error('EIA OE-417 table header or body is missing');
  const headers = [...headerSection.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(match => decodeHtml(match[1]));
  if (headers.join('|') !== EXPECTED_HEADERS.join('|')) throw new Error(`Unexpected EIA OE-417 schema: ${headers.join(', ')}`);
  const rows = [...bodySection.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((rowMatch, rowIndex) => {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(match => decodeHtml(match[1]));
    if (cells.length !== EXPECTED_HEADERS.length) throw new Error(`Unexpected EIA OE-417 row width at row ${rowIndex + 1}: ${cells.length}`);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
  if (!rows.length) throw new Error('EIA OE-417 table has no event rows');
  return { observationYear: Number(titleMatch[1]), rows };
}

async function main() {
  const { observationYear, rows } = parseTable(await fetchTableHtml());
  const parsed = rows.map((row, index) => {
    const year = Number(row.Year);
    const month = Number(row.Month);
    if (year !== observationYear || !Number.isInteger(month) || month < 1 || month > 12) throw new Error(`Invalid EIA OE-417 period at row ${index + 1}`);
    const durationHours = parseDurationHours(row.Duration);
    const customersAffected = parseInteger(row['Number of Customers Affected']);
    const megawattsLost = parseInteger(row['Loss (megawatts)']);
    return {
      record_id: `eia_oe417_${observationYear}_${String(index + 1).padStart(4, '0')}`,
      year,
      month,
      event_date_time_source: row['Event Date and Time'],
      restoration_date_time_source: row['Restoration Date and Time'] || null,
      duration_source: row.Duration,
      duration_hours: round(durationHours, 3),
      utility_or_power_pool: row['Utility/Power Pool'],
      nerc_region: row['NERC Region'],
      area_affected: row['Area Affected'],
      disturbance_type: row['Type of Disturbance'],
      megawatts_lost: megawattsLost,
      customers_affected: customersAffected,
      customer_hours: Number.isFinite(customersAffected) && Number.isFinite(durationHours) ? round(customersAffected * durationHours) : null
    };
  });

  const interruptionEvents = parsed.filter(event => event.customers_affected > 0);
  const customerHourEvents = interruptionEvents.filter(event => Number.isFinite(event.customer_hours));
  const customerHours = customerHourEvents.reduce((sum, event) => sum + event.customer_hours, 0);
  const observedMonths = [...new Set(parsed.map(event => event.month))].sort((a, b) => a - b);
  if (observedMonths.join(',') !== '1,2,3,4,5,6,7,8,9,10,11,12') throw new Error(`EIA OE-417 completed-year table has incomplete month coverage: ${observedMonths.join(',')}`);
  const annualRecord = {
    record_id: `eia_oe417_us_${observationYear}`,
    geography: 'United States and Puerto Rico events reported in EIA Table B.2',
    observation_year: observationYear,
    observed_months: observedMonths,
    complete_calendar_year: true,
    reporting_scope: 'major disturbances and unusual occurrences meeting DOE-417 reporting criteria',
    reported_events: parsed.length,
    events_with_customers_affected: interruptionEvents.length,
    events_with_computable_customer_hours: customerHourEvents.length,
    customer_hour_event_coverage_pct: interruptionEvents.length ? round(customerHourEvents.length / interruptionEvents.length * 100, 1) : null,
    sum_reported_customers_affected_across_events: interruptionEvents.reduce((sum, event) => sum + event.customers_affected, 0),
    reported_customer_hours: round(customerHours),
    median_event_duration_hours: round(median(customerHourEvents.map(event => event.duration_hours)), 2),
    maximum_event_duration_hours: round(Math.max(...customerHourEvents.map(event => event.duration_hours)), 2),
    maximum_customers_affected_single_event: Math.max(...interruptionEvents.map(event => event.customers_affected)),
    events_missing_duration: interruptionEvents.length - customerHourEvents.length,
    source_locator: {
      table_url: TABLE_URL,
      eia_faq_url: EIA_FAQ_URL,
      doe_form_url: DOE_FORM_URL,
      table_title: `Table B.2 Major Disturbances and Unusual Occurrences, ${observationYear}`,
      fields: EXPECTED_HEADERS
    }
  };

  if (!annualRecord.reported_events || !annualRecord.events_with_customers_affected || !Number.isFinite(annualRecord.reported_customer_hours)) {
    throw new Error('EIA OE-417 annual disruption summary is incomplete');
  }

  const snapshot = {
    version: `eia_oe417_${observationYear}_reported_disruption_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'U.S. Energy Information Administration — Major Disturbances and Unusual Occurrences (DOE-417)',
      url: TABLE_URL
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: [METRIC_ID],
    cadence: 'monthly source check with release-triggered replacement of the completed annual table',
    provenance: 'Official EIA Electric Power Monthly Table B.2 sourced from mandatory DOE-417 emergency incident and disturbance reports. Event-level source duration, customers affected, megawatts lost, utility, geography, and disturbance type are retained for all twelve source months.',
    uncertainty: 'Customer counts are preliminary estimates; reports cover qualifying major events rather than all outages; restoration can be staggered; overlapping events can double-count customers; missing duration, revisions, local time conventions, and reporting thresholds affect customer-hours.',
    failure_behavior: 'Retain the last validated completed-year table and mark its observation year; reject schema drift, missing months, or empty event data; withhold customer-hours when either customers or duration is missing; never substitute this metric for utility SAIDI/SAIFI or a cross-sector infrastructure index.',
    boundary: 'Reported customer-hours equal event-reported customers affected multiplied by event duration for qualifying major DOE-417 events with both fields. They are not customer-level restoration trajectories, do not cover every interruption, can double-count customers across events, and measure electricity disruption only.',
    record_count: 1,
    records: [annualRecord],
    event_record_count: parsed.length,
    event_records: parsed
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: OUTPUT_PATH, observation_year: observationYear, reported_events: annualRecord.reported_events, interruption_events: annualRecord.events_with_customers_affected, reported_customer_hours: annualRecord.reported_customer_hours }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
