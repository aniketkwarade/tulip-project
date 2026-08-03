import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'openfema-ihp-geographic-gap-snapshot.json');
const SOURCE_ID = 'openfema_registration_intake_individuals_household_program_v2';
const INGESTION_JOB_ID = 'fetch_openfema_geographic_ihp_assistance_gap';
const METRIC_ID = 'openfema_geographic_ihp_assistance_gap';
const IHP_API = 'https://www.fema.gov/api/open/v2/RegistrationIntakeIndividualsHouseholdPrograms';
const DECLARATION_API = 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries';
const DATASET_PAGE = 'https://www.fema.gov/openfema-data-page/registration-intake-and-individuals-household-program-ri-ihp-v2';
const MIN_VALID_REGISTRATIONS = 20;
const MIN_GROUPS_PER_DECLARATION = 3;
const MIN_POSITIVE_ELIGIBLE_GROUPS = 2;
const DECLARATION_LIMIT = 12;
const QUERY_LIMIT = 10000;

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw new Error(`OpenFEMA request failed: ${response.status} ${response.statusText}`);
  return response.json();
}

function numeric(value, field, rowId) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid ${field} for OpenFEMA row ${rowId}`);
  return parsed;
}

function groupDescriptor(row) {
  return {
    source_record_id: row.id,
    county: row.county || 'not reported',
    city: row.city || 'not reported',
    zip_code: row.zipCode || 'not reported',
    valid_registrations: row.totalValidRegistrations,
    ihp_eligible: row.ihpEligible,
    ihp_amount_usd: row.ihpAmount,
    ihp_eligibility_rate_pct: round(row.ihpEligible / row.totalValidRegistrations * 100),
    ihp_award_per_eligible_usd: row.ihpEligible > 0 ? round(row.ihpAmount / row.ihpEligible) : null
  };
}

async function declarationMetadata(disasterNumber) {
  const url = new URL(DECLARATION_API);
  url.searchParams.set('$top', '1');
  url.searchParams.set('$filter', `disasterNumber eq ${disasterNumber}`);
  url.searchParams.set('$select', 'disasterNumber,state,declarationType,declarationDate,incidentType,declarationTitle,incidentBeginDate,incidentEndDate,id');
  const payload = await fetchJson(url);
  const record = payload.DisasterDeclarationsSummaries?.[0];
  return record ? { record, url: url.toString() } : null;
}

async function main() {
  const url = new URL(IHP_API);
  url.searchParams.set('$top', String(QUERY_LIMIT));
  url.searchParams.set('$filter', `totalValidRegistrations ge ${MIN_VALID_REGISTRATIONS}`);
  url.searchParams.set('$orderby', 'disasterNumber desc');
  url.searchParams.set('$select', 'disasterNumber,state,county,city,zipCode,totalValidRegistrations,ihpEligible,ihpAmount,haEligible,haAmount,onaEligible,onaAmount,id');
  const payload = await fetchJson(url);
  const rawRows = payload.RegistrationIntakeIndividualsHouseholdPrograms;
  if (!Array.isArray(rawRows) || rawRows.length < 100) throw new Error(`OpenFEMA returned only ${rawRows?.length || 0} qualifying rows.`);
  if (new Set(rawRows.map(row => row.id)).size !== rawRows.length) throw new Error('OpenFEMA response contains duplicate source record IDs.');

  const rows = rawRows.map(row => ({
    ...row,
    disasterNumber: numeric(row.disasterNumber, 'disasterNumber', row.id),
    totalValidRegistrations: numeric(row.totalValidRegistrations, 'totalValidRegistrations', row.id),
    ihpEligible: numeric(row.ihpEligible, 'ihpEligible', row.id),
    ihpAmount: numeric(row.ihpAmount, 'ihpAmount', row.id),
    haEligible: numeric(row.haEligible, 'haEligible', row.id),
    haAmount: numeric(row.haAmount, 'haAmount', row.id),
    onaEligible: numeric(row.onaEligible, 'onaEligible', row.id),
    onaAmount: numeric(row.onaAmount, 'onaAmount', row.id)
  }));
  if (rows.some(row => row.ihpEligible > row.totalValidRegistrations)) throw new Error('OpenFEMA eligible count exceeds valid registrations.');

  const byDisaster = new Map();
  for (const row of rows) {
    if (!byDisaster.has(row.disasterNumber)) byDisaster.set(row.disasterNumber, []);
    byDisaster.get(row.disasterNumber).push(row);
  }
  const candidates = [...byDisaster.entries()]
    .filter(([, groupRows]) => groupRows.length >= MIN_GROUPS_PER_DECLARATION)
    .filter(([, groupRows]) => groupRows.filter(row => row.ihpEligible > 0).length >= MIN_POSITIVE_ELIGIBLE_GROUPS)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 40);

  const metadata = new Map((await Promise.all(candidates.map(async ([disasterNumber]) => {
    const result = await declarationMetadata(disasterNumber);
    return [disasterNumber, result];
  }))).filter(([, result]) => result));
  const selected = candidates
    .filter(([disasterNumber]) => metadata.has(disasterNumber))
    .slice(0, DECLARATION_LIMIT);
  if (selected.length < 6) throw new Error(`Only ${selected.length} OpenFEMA declarations passed comparison and declaration-metadata gates.`);

  const records = selected.map(([disasterNumber, groupRows]) => {
    const comparisons = groupRows.map(groupDescriptor)
      .sort((a, b) => a.ihp_eligibility_rate_pct - b.ihp_eligibility_rate_pct || a.source_record_id.localeCompare(b.source_record_id));
    const positiveAwardGroups = comparisons.filter(group => group.ihp_award_per_eligible_usd !== null)
      .sort((a, b) => a.ihp_award_per_eligible_usd - b.ihp_award_per_eligible_usd || a.source_record_id.localeCompare(b.source_record_id));
    const minimumEligibility = comparisons[0];
    const maximumEligibility = comparisons.at(-1);
    const minimumAward = positiveAwardGroups[0];
    const maximumAward = positiveAwardGroups.at(-1);
    const totalValid = groupRows.reduce((sum, row) => sum + row.totalValidRegistrations, 0);
    const totalEligible = groupRows.reduce((sum, row) => sum + row.ihpEligible, 0);
    const totalAmount = groupRows.reduce((sum, row) => sum + row.ihpAmount, 0);
    const declaration = metadata.get(disasterNumber);
    const declarationRecord = declaration.record;
    return {
      record_id: `openfema_ihp_gap_${disasterNumber}`,
      metric_id: METRIC_ID,
      measurement_role: 'within_declaration_geographic_administrative_outcome_gap',
      disaster_number: disasterNumber,
      declaration_title: declarationRecord.declarationTitle,
      state: declarationRecord.state || groupRows[0].state,
      declaration_type: declarationRecord.declarationType,
      incident_type: declarationRecord.incidentType,
      declaration_date: declarationRecord.declarationDate,
      incident_begin_date: declarationRecord.incidentBeginDate,
      incident_end_date: declarationRecord.incidentEndDate || declarationRecord.incidentBeginDate,
      qualifying_geography_count: comparisons.length,
      total_valid_registrations: totalValid,
      total_ihp_eligible: totalEligible,
      total_ihp_amount_usd: round(totalAmount),
      weighted_ihp_eligibility_rate_pct: round(totalEligible / totalValid * 100),
      geographic_ihp_eligibility_rate_gap_percentage_points: round(maximumEligibility.ihp_eligibility_rate_pct - minimumEligibility.ihp_eligibility_rate_pct),
      geographic_ihp_award_per_eligible_gap_usd: round(maximumAward.ihp_award_per_eligible_usd - minimumAward.ihp_award_per_eligible_usd),
      minimum_eligibility_group: minimumEligibility,
      maximum_eligibility_group: maximumEligibility,
      minimum_award_per_eligible_group: minimumAward,
      maximum_award_per_eligible_group: maximumAward,
      geography_comparisons: comparisons,
      source_locator: {
        ihp_query_url: url.toString(),
        declaration_query_url: declaration.url,
        dataset_page_url: DATASET_PAGE,
        comparison_gate: `city-ZIP groups with at least ${MIN_VALID_REGISTRATIONS} valid registrations; at least ${MIN_GROUPS_PER_DECLARATION} groups and ${MIN_POSITIVE_ELIGIBLE_GROUPS} positive-eligible groups per declaration`
      }
    };
  });

  const snapshot = {
    version: 'openfema_ri_ihp_geographic_gap_v1',
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'OpenFEMA Registration Intake and Individuals Household Program v2',
      url: DATASET_PAGE,
      api_url: IHP_API,
      access: 'open_api_no_registration'
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: [METRIC_ID],
    cadence: 'Weekly source refresh with complete snapshot replacement.',
    provenance: 'Official aggregated non-PII FEMA NEMIS Registration Intake and IHP records by declaration, city and ZIP, joined to official OpenFEMA disaster declaration summaries.',
    uncertainty: 'Raw NEMIS administrative records can contain human error. Damage, eligibility, application, documentation, housing, timing, local prices and reporting affect geographic differences. Financial fields are not official federal financial reporting.',
    failure_behavior: 'Retain the last validated snapshot and mark stale; reject schema changes, duplicate IDs, invalid counts or amounts, fewer than six qualifying declarations, or missing declaration metadata; never infer demographic disparity, household recovery, unmet need or zero incidence from missing rows.',
    measurement_boundary: 'Descriptive maximum-minus-minimum ranges in IHP eligibility rate and award per eligible registration across qualifying city-ZIP groups within the same declaration. This is geographic administrative variation, not a protected-class disparity estimate or causal evaluation.',
    screening: {
      source_query_limit: QUERY_LIMIT,
      minimum_valid_registrations_per_group: MIN_VALID_REGISTRATIONS,
      minimum_groups_per_declaration: MIN_GROUPS_PER_DECLARATION,
      minimum_positive_eligible_groups_per_declaration: MIN_POSITIVE_ELIGIBLE_GROUPS,
      selected_declaration_limit: DECLARATION_LIMIT
    },
    source_row_count: rows.length,
    record_count: records.length,
    records
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    source_rows: rows.length,
    declarations: records.length,
    latest_disaster_number: records[0]?.disaster_number,
    earliest_selected_disaster_number: records.at(-1)?.disaster_number
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
