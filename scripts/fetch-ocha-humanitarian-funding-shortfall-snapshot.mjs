import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'ocha-humanitarian-funding-shortfall-snapshot.json');
const SOURCE_ID = 'ocha_humanitarian_programme_cycle_public_api';
const INGESTION_JOB_ID = 'fetch_ocha_humanitarian_funding_shortfall';
const METRIC_IDS = Object.freeze([
  'humanitarian_response_funding_shortfall_operation_bound_metric',
  'humanitarian_plan_reported_resource_gap',
  'humanitarian_plan_positive_requirement_revision'
]);
const API_ROOT = 'https://api.hpc.tools/v1/public';
const DOCS_URL = 'https://api.hpc.tools/docs/v1/';
const DEFAULT_PLAN_YEAR = new Date().getUTCFullYear() - 1;
const PLAN_YEAR = Number(process.env.OCHA_FTS_YEAR || DEFAULT_PLAN_YEAR);

if (!Number.isInteger(PLAN_YEAR) || PLAN_YEAR < 2000 || PLAN_YEAR > new Date().getUTCFullYear()) {
  throw new Error(`Invalid OCHA_FTS_YEAR: ${process.env.OCHA_FTS_YEAR}`);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw new Error(`OCHA HPC request failed: ${response.status} ${response.statusText}`);
  const payload = await response.json();
  if (payload?.status !== 'ok') throw new Error(`OCHA HPC response was not ok for ${url}`);
  return payload;
}

function destinationPlanBreakdown(report, valueKey) {
  const groups = report?.[valueKey]?.objects;
  if (!Array.isArray(groups)) return [];
  const destinationPlans = groups.find(group => group?.type === 'Plan' && group?.direction === 'destination');
  return Array.isArray(destinationPlans?.objectsBreakdown) ? destinationPlans.objectsBreakdown : [];
}

function amountByPlanId(rows) {
  const values = new Map();
  for (const row of rows) {
    const id = Number(row?.id);
    const value = Number(row?.totalFunding);
    if (!Number.isInteger(id) || !Number.isFinite(value) || value < 0) continue;
    if (values.has(id)) throw new Error(`Duplicate OCHA FTS plan funding group: ${id}`);
    values.set(id, value);
  }
  return values;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

async function main() {
  const planUrl = `${API_ROOT}/plan/year/${PLAN_YEAR}`;
  const ftsUrl = `${API_ROOT}/fts/flow?year=${PLAN_YEAR}&groupby=plan`;
  const [planPayload, ftsPayload] = await Promise.all([fetchJson(planUrl), fetchJson(ftsUrl)]);
  if (!Array.isArray(planPayload.data)) throw new Error('OCHA plan-year endpoint did not return an array.');

  const fundingByPlan = amountByPlanId(destinationPlanBreakdown(ftsPayload.data?.report2, 'fundingTotals'));
  const pledgesByPlan = amountByPlanId(destinationPlanBreakdown(ftsPayload.data?.report2, 'pledgeTotals'));
  const records = planPayload.data
    .filter(plan => plan?.isReleased === true)
    .filter(plan => (plan?.years || []).some(item => Number(item?.year) === PLAN_YEAR))
    .map(plan => {
      const originalRequirement = Number(plan.origRequirements);
      const revisedRequirement = Number(plan.revisedRequirements);
      const requirement = Number.isFinite(revisedRequirement) && revisedRequirement > 0
        ? revisedRequirement
        : originalRequirement;
      if (!Number.isFinite(requirement) || requirement <= 0) return null;

      const funding = fundingByPlan.get(Number(plan.id)) || 0;
      const pledges = pledgesByPlan.get(Number(plan.id)) || 0;
      const shortfall = Math.max(requirement - funding, 0);
      const coverage = funding / requirement * 100;
      const positiveRequirementRevision = Number.isFinite(originalRequirement) && originalRequirement > 0
        ? Math.max(requirement - originalRequirement, 0)
        : 0;
      const requirementRevisionPct = Number.isFinite(originalRequirement) && originalRequirement > 0
        ? positiveRequirementRevision / originalRequirement * 100
        : 0;
      const planVersion = plan.planVersion || {};
      const planTypes = (plan.categories || []).filter(item => item?.group === 'planType').map(item => item.name);
      return {
        record_id: `ocha_fts_plan_${plan.id}_${PLAN_YEAR}`,
        metric_id: METRIC_IDS[0],
        metric_roles: [
          'named_released_plan_reported_funding_gap_primary',
          'named_released_plan_reported_financial_resource_gap_primary',
          'named_released_plan_positive_financial_requirement_revision_proxy'
        ],
        plan_id: Number(plan.id),
        plan_code: planVersion.code || null,
        plan_name: planVersion.name || planVersion.shortName || `OCHA plan ${plan.id}`,
        plan_year: PLAN_YEAR,
        plan_start_date: planVersion.startDate || null,
        plan_end_date: planVersion.endDate || null,
        plan_type: planTypes.length ? planTypes : ['not specified'],
        locations: (plan.locations || []).map(location => ({
          location_id: Number(location.id),
          name: location.name,
          iso3: location.iso3 || null,
          admin_level: Number.isFinite(Number(location.adminLevel)) ? Number(location.adminLevel) : null
        })),
        original_requirement_usd: Number.isFinite(originalRequirement) ? originalRequirement : null,
        revised_requirement_usd: requirement,
        requirement_basis: Number.isFinite(revisedRequirement) && revisedRequirement > 0 ? 'current revised requirement' : 'original requirement because no positive revised requirement was reported',
        fts_reported_funding_usd: funding,
        fts_reported_pledges_usd: pledges,
        reported_funding_shortfall_usd: shortfall,
        reported_funding_coverage_pct: round(coverage),
        reported_shortfall_pct: round(Math.max(100 - coverage, 0)),
        reported_financial_resource_gap_usd: shortfall,
        reported_financial_resource_gap_pct: round(Math.max(100 - coverage, 0)),
        positive_requirement_revision_usd: positiveRequirementRevision,
        positive_requirement_revision_pct: round(requirementRevisionPct),
        positive_requirement_revision_reported: positiveRequirementRevision > 0,
        funding_status: funding === 0 ? 'no_plan_linked_funding_reported_to_fts' : shortfall > 0 ? 'underfunded_against_current_requirement' : 'reported_funding_meets_or_exceeds_requirement',
        funding_present_in_grouped_fts_result: fundingByPlan.has(Number(plan.id)),
        source_locator: {
          plan_api_url: planUrl,
          fts_api_url: ftsUrl,
          api_docs_url: DOCS_URL,
          join_key: `plan.id=${plan.id}`,
          funding_report: 'report2 incoming funding grouped by destination Plan',
          pledge_treatment: 'retained separately and excluded from fts_reported_funding_usd'
        }
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.reported_funding_shortfall_usd - a.reported_funding_shortfall_usd || a.plan_id - b.plan_id);

  if (records.length < 10) throw new Error(`OCHA returned only ${records.length} released positive-requirement plans for ${PLAN_YEAR}.`);
  if (new Set(records.map(record => record.plan_id)).size !== records.length) throw new Error('OCHA snapshot contains duplicate plan IDs.');
  if (!records.some(record => record.funding_present_in_grouped_fts_result)) throw new Error('OCHA plan-to-FTS join produced no reported funding matches.');
  if (records.some(record => record.reported_funding_shortfall_usd < 0 || record.reported_funding_coverage_pct < 0)) throw new Error('OCHA snapshot contains invalid derived funding values.');

  const snapshot = {
    version: `ocha_hpc_fts_plan_funding_${PLAN_YEAR}_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'OCHA Humanitarian Programme Cycle Public API',
      url: API_ROOT,
      docs_url: DOCS_URL,
      access: 'open_api_with_public_rate_limit'
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: METRIC_IDS,
    plan_year: PLAN_YEAR,
    cadence: 'Monthly during the plan year with completed-year revision checks.',
    provenance: 'Official OCHA released plan requirements joined by plan ID to Financial Tracking Service incoming funding grouped by destination plan.',
    uncertainty: 'FTS captures reported plan-linked financial flows, not all resources available or aid delivered. Reporting delays, revisions, exchange rates, unlinked or shared flows, requirement revisions, and funding outside FTS affect the gap.',
    failure_behavior: 'Retain the last validated snapshot and mark stale; reject missing reports, duplicate IDs, invalid values, or a materially empty join; never count pledges as funding or infer operational sufficiency.',
    measurement_boundary: 'Reported current requirement minus reported incoming plan-linked FTS funding supplies the financial shortfall and resource-gap measures. A positive current-versus-original requirement revision supplies only a bounded financial surge-demand proxy. None of these measures establishes people reached, timely disbursement, equitable allocation, physical access, service delivery, or sufficient response capacity.',
    record_count: records.length,
    plans_with_reported_funding: records.filter(record => record.funding_present_in_grouped_fts_result).length,
    plans_without_grouped_reported_funding: records.filter(record => !record.funding_present_in_grouped_fts_result).length,
    total_revised_requirement_usd: records.reduce((sum, record) => sum + record.revised_requirement_usd, 0),
    total_fts_reported_funding_usd: records.reduce((sum, record) => sum + record.fts_reported_funding_usd, 0),
    total_reported_funding_shortfall_usd: records.reduce((sum, record) => sum + record.reported_funding_shortfall_usd, 0),
    plans_with_positive_requirement_revision: records.filter(record => record.positive_requirement_revision_reported).length,
    total_positive_requirement_revision_usd: records.reduce((sum, record) => sum + record.positive_requirement_revision_usd, 0),
    records
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    plan_year: PLAN_YEAR,
    records: records.length,
    plans_with_reported_funding: snapshot.plans_with_reported_funding,
    total_requirement_usd: snapshot.total_revised_requirement_usd,
    total_reported_funding_usd: snapshot.total_fts_reported_funding_usd,
    total_shortfall_usd: snapshot.total_reported_funding_shortfall_usd
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
