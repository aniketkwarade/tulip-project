import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'ocha-humanitarian-history-snapshot.json');
const API_ROOT = 'https://api.hpc.tools/v1/public';
const DOCS_URL = 'https://api.hpc.tools/docs/v1/';
const START_YEAR = Number(process.env.OCHA_HISTORY_START_YEAR || 2000);
const END_YEAR = Number(process.env.OCHA_HISTORY_END_YEAR || new Date().getUTCFullYear() - 1);
const CONCURRENCY = 4;
const METRIC_IDS = Object.freeze([
  'humanitarian_response_funding_shortfall_operation_bound_metric',
  'humanitarian_plan_reported_resource_gap',
  'humanitarian_plan_positive_requirement_revision'
]);

if (!Number.isInteger(START_YEAR) || !Number.isInteger(END_YEAR) || START_YEAR < 2000 || END_YEAR < START_YEAR) {
  throw new Error(`Invalid OCHA history interval: ${START_YEAR}-${END_YEAR}`);
}

async function fetchJson(url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(120_000)
    });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.status === 'ok') return payload;
    }
    if (attempt === 4 || response.status < 500) {
      throw new Error(`OCHA HPC request failed: ${response.status} ${response.statusText} for ${url}`);
    }
    await new Promise(resolve => setTimeout(resolve, 500 * attempt));
  }
  throw new Error(`OCHA HPC request exhausted retries for ${url}`);
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

const round = (value, digits = 6) => Number(value.toFixed(digits));

async function fetchAnnualSummary(year) {
  const planUrl = `${API_ROOT}/plan/year/${year}`;
  const ftsUrl = `${API_ROOT}/fts/flow?year=${year}&groupby=plan`;
  const [planPayload, ftsPayload] = await Promise.all([fetchJson(planUrl), fetchJson(ftsUrl)]);
  if (!Array.isArray(planPayload.data)) throw new Error(`OCHA plan-year endpoint did not return an array for ${year}.`);

  const fundingByPlan = amountByPlanId(destinationPlanBreakdown(ftsPayload.data?.report2, 'fundingTotals'));
  const plans = planPayload.data
    .filter(plan => (plan?.years || []).some(item => Number(item?.year) === year))
    .map(plan => {
      const originalRequirement = Number(plan.origRequirements);
      const revisedRequirement = Number(plan.revisedRequirements);
      const requirement = Number.isFinite(revisedRequirement) && revisedRequirement > 0
        ? revisedRequirement
        : originalRequirement;
      if (!Number.isFinite(requirement) || requirement <= 0) return null;
      const planId = Number(plan.id);
      const hasReportedFunding = fundingByPlan.has(planId);
      const funding = hasReportedFunding ? fundingByPlan.get(planId) : null;
      const positiveRevision = Number.isFinite(originalRequirement) && originalRequirement > 0
        ? Math.max(requirement - originalRequirement, 0)
        : null;
      return {
        plan_id: planId,
        requirement,
        original_requirement: Number.isFinite(originalRequirement) && originalRequirement > 0 ? originalRequirement : null,
        funding,
        shortfall: hasReportedFunding ? Math.max(requirement - funding, 0) : null,
        positive_revision: positiveRevision,
        locations: (plan.locations || []).map(location => location?.iso3).filter(Boolean)
      };
    })
    .filter(Boolean);

  const fundingPlans = plans.filter(plan => Number.isFinite(plan.funding));
  const revisionPlans = plans.filter(plan => Number.isFinite(plan.original_requirement));
  if (!plans.length || !fundingPlans.length || !revisionPlans.length) {
    throw new Error(`OCHA ${year} lacks a usable released-plan, funding, or revision panel.`);
  }
  const requirement = fundingPlans.reduce((sum, plan) => sum + plan.requirement, 0);
  const funding = fundingPlans.reduce((sum, plan) => sum + plan.funding, 0);
  const shortfall = fundingPlans.reduce((sum, plan) => sum + plan.shortfall, 0);
  const originalRequirement = revisionPlans.reduce((sum, plan) => sum + plan.original_requirement, 0);
  const positiveRevision = revisionPlans.reduce((sum, plan) => sum + plan.positive_revision, 0);
  const allCountries = new Set(plans.flatMap(plan => plan.locations));
  const fundingCountries = new Set(fundingPlans.flatMap(plan => plan.locations));
  const surgeCountries = new Set(revisionPlans.filter(plan => plan.positive_revision > 0).flatMap(plan => plan.locations));

  return {
    record_id: `ocha_hpc_annual_global_${year}`,
    observation_year: year,
    positive_requirement_plans: plans.length,
    plans_with_grouped_reported_funding: fundingPlans.length,
    funding_plan_coverage_pct: round(fundingPlans.length / plans.length * 100),
    reported_requirement_usd_complete_panel: round(requirement, 2),
    reported_funding_usd_complete_panel: round(funding, 2),
    reported_funding_shortfall_usd_complete_panel: round(shortfall, 2),
    reported_funding_shortfall_pct_complete_panel: round(shortfall / requirement * 100),
    plans_with_original_requirement: revisionPlans.length,
    plans_with_positive_requirement_revision: revisionPlans.filter(plan => plan.positive_revision > 0).length,
    original_requirement_usd_revision_panel: round(originalRequirement, 2),
    positive_requirement_revision_usd: round(positiveRevision, 2),
    positive_requirement_revision_pct_of_original: round(positiveRevision / originalRequirement * 100),
    countries_or_territories_in_plans: allCountries.size,
    countries_or_territories_in_funding_panel: fundingCountries.size,
    countries_or_territories_with_positive_revision: surgeCountries.size,
    source_locator: {
      plan_api_url: planUrl,
      fts_api_url: ftsUrl,
      api_docs_url: DOCS_URL,
      funding_boundary: 'Only plan IDs present in the grouped FTS result enter funding and shortfall totals; an absent group remains missing and is never converted to zero.',
      revision_boundary: 'Only plans with a positive original requirement enter the revision denominator; negative revisions remain zero contribution to the bounded positive-revision measure.'
    }
  };
}

async function mapWithConcurrency(values, concurrency, callback) {
  const results = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await callback(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

async function main() {
  const years = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, index) => START_YEAR + index);
  const annual_summaries = await mapWithConcurrency(years, CONCURRENCY, fetchAnnualSummary);
  if (annual_summaries.length < 20) throw new Error(`OCHA history has only ${annual_summaries.length} complete annual summaries.`);
  if (annual_summaries.some(record => !Number.isFinite(record.reported_funding_shortfall_pct_complete_panel))) {
    throw new Error('OCHA history contains a non-finite funding shortfall percentage.');
  }

  const snapshot = {
    version: `ocha_hpc_fts_global_history_${START_YEAR}_${END_YEAR}_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: 'ocha_humanitarian_programme_cycle_public_api',
      name: 'OCHA Humanitarian Programme Cycle Public API',
      url: API_ROOT,
      docs_url: DOCS_URL,
      access: 'open_api_with_public_rate_limit'
    },
    ingestion_job_id: 'fetch_ocha_humanitarian_global_history',
    metric_contract_ids: METRIC_IDS,
    contract_bindings: [
      { node_id: 'humanitarian_response_funding_shortfall', metric_id: METRIC_IDS[0], measurement_role: 'global_annual_complete_plan_panel_shortfall_ratio' },
      { node_id: 'emergency_response_overload', metric_id: METRIC_IDS[0], measurement_role: 'global_humanitarian_response_capacity_pressure_companion' },
      { node_id: 'humanitarian_resource_gaps', metric_id: METRIC_IDS[1], measurement_role: 'global_annual_complete_plan_panel_resource_gap_ratio' },
      { node_id: 'humanitarian_surge_demand', metric_id: METRIC_IDS[2], measurement_role: 'global_annual_positive_requirement_revision_ratio' }
    ],
    cadence: 'Annual completed-plan-year refresh with monthly checks on the latest completed year.',
    provenance: 'Official OCHA plan-year requirements joined by plan ID to FTS incoming funding grouped by destination plan for every year in the retained interval. Annual ratios use only explicit reported values and preserve join coverage. Historical migrated plans are retained when the API returns a positive requirement even if the current isReleased flag is false.',
    uncertainty: 'Plan scope, needs assessment, exchange rates, requirement revisions, reporting practices, unlinked or shared flows, funding outside FTS, and changes in the humanitarian planning system affect cross-year comparison. Nominal dollars are retained as context only; scoring uses dimensionless funding-gap and positive-revision ratios.',
    failure_behavior: 'Retain the last validated history and mark stale; reject missing annual endpoints, invalid ratios, duplicate years, or fewer than 20 complete annual observations. Never convert a plan absent from grouped FTS funding into zero funding or zero shortfall.',
    measurement_boundary: 'The funding-gap measures are reported plan-linked financial gaps, not proof of aid delivery or operational sufficiency. Positive requirement revisions are bounded financial planning signals, not direct counts of people newly in need.',
    record_count: annual_summaries.length,
    annual_summaries
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    years: [START_YEAR, END_YEAR],
    records: annual_summaries.length,
    latest: annual_summaries.at(-1)
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
