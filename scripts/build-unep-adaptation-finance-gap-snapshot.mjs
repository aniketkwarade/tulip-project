import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'unep-adaptation-finance-gap-snapshot.json');
const SOURCE_ID = 'unep_adaptation_gap_report_2025';
const INGESTION_JOB_ID = 'build_unep_adaptation_finance_gap_assessment';
const METRIC_ID = 'adaptation_finance_gap';
const SOURCE_URL = 'https://www.unep.org/resources/adaptation-gap-report-2025';
const PRESS_RELEASE_URL = 'https://www.unep.org/news-and-stories/press-release/slow-climate-adaptation-threatening-lives-and-economies';
const MODELLED_NEED = 310;
const NDC_NAP_NEED = 365;
const INTERNATIONAL_PUBLIC_FLOW = 26;
const PREVIOUS_YEAR_INTERNATIONAL_PUBLIC_FLOW = 28;
const GAP_LOWER = MODELLED_NEED - INTERNATIONAL_PUBLIC_FLOW;
const GAP_UPPER = NDC_NAP_NEED - INTERNATIONAL_PUBLIC_FLOW;

if (GAP_LOWER !== 284 || GAP_UPPER !== 339) throw new Error('UNEP adaptation finance gap arithmetic changed unexpectedly.');

const records = [{
  record_id: 'unep_agr_2025_adaptation_finance_gap_developing_countries',
  metric_id: METRIC_ID,
  measurement_role: 'developing_country_annual_assessment_range_primary',
  geography: 'developing countries, aggregate assessment boundary',
  need_horizon_year: 2035,
  flow_observation_year: 2023,
  price_year: 2023,
  modelled_need_billion_usd_per_year: MODELLED_NEED,
  ndc_nap_extrapolated_need_billion_usd_per_year: NDC_NAP_NEED,
  international_public_flow_billion_usd_per_year: INTERNATIONAL_PUBLIC_FLOW,
  previous_flow_observation_year: 2022,
  previous_international_public_flow_billion_usd_per_year: PREVIOUS_YEAR_INTERNATIONAL_PUBLIC_FLOW,
  observed_flow_change_pct: Number((((INTERNATIONAL_PUBLIC_FLOW / PREVIOUS_YEAR_INTERNATIONAL_PUBLIC_FLOW) - 1) * 100).toFixed(6)),
  finance_gap_lower_billion_usd_per_year: GAP_LOWER,
  finance_gap_upper_billion_usd_per_year: GAP_UPPER,
  flow_boundary: 'international public adaptation finance from developed to developing countries',
  range_interpretation: 'Methodological range between modelled adaptation costs and extrapolated NDC/NAP needs; not a statistical confidence interval.',
  inflation_boundary: '2023 US dollar values, not adjusted forward for inflation',
  source_locator: {
    report_page_url: SOURCE_URL,
    press_release_url: PRESS_RELEASE_URL,
    locator: 'What is new in this report and press-release section A worrying gap',
    source_reported_gap_range: 'US$284-339 billion per year',
    source_reported_flow_comparison: 'US$26 billion in 2023, down from US$28 billion in 2022',
    source_reported_need_multiple: 'adaptation finance needs are 12-14 times current international public flows',
    target_status: 'UNEP states the Glasgow Climate Pact doubling goal will not be achieved if current trends continue',
    derivation_check: '310 - 26 = 284; 365 - 26 = 339, all in billion 2023 USD per year'
  }
}];

const snapshot = {
  version: 'unep_adaptation_gap_report_2025_finance_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: SOURCE_ID,
    name: 'UNEP Adaptation Gap Report 2025: Running on Empty',
    url: SOURCE_URL,
    access: 'open_authoritative_assessment'
  },
  ingestion_job_id: INGESTION_JOB_ID,
  metric_contract_ids: [METRIC_ID],
  cadence: 'Annual report-release check.',
  provenance: 'UNEP source-reported developing-country adaptation needs and international public adaptation-finance flows, with need horizon, flow year, price year and method boundary retained.',
  uncertainty: records[0].range_interpretation,
  failure_behavior: 'Retain the last validated report vintage; never combine mismatched years or boundaries, label the range as a confidence interval, or infer project-level capital availability.',
  measurement_boundary: 'Aggregate developing-country adaptation-finance assessment. It is not a country allocation, investment pipeline, total global adaptation spend, delivered adaptation outcome, or estimate of private and domestic resources.',
  record_count: records.length,
  records
};

await mkdir(PUBLIC_DIR, { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  output: OUTPUT_PATH,
  records: records.length,
  gap_lower_billion_usd_per_year: GAP_LOWER,
  gap_upper_billion_usd_per_year: GAP_UPPER
}, null, 2));
