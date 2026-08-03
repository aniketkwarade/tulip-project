import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'sabin-climate-litigation-counts-snapshot.json');
const SOURCE_ID = 'sabin_center_unep_global_climate_litigation_report_2025';
const INGESTION_JOB_ID = 'build_sabin_climate_litigation_counts_assessment';
const METRIC_ID = 'climate_litigation_cases';
const SOURCE_URL = 'https://climate.law.columbia.edu/news/sabin-center-climate-change-law-unep-release-new-climate-litigation-report';
const DATABASE_URL = 'https://www.climatecasechart.com/';
const METHODOLOGY_URL = 'https://www.climatecasechart.com/methodology';

const points = [
  { year: 2017, label: 'by 2017', cases: 884 },
  { year: 2020, label: 'by 2020', cases: 1550 },
  { year: 2022, label: 'by 2022', cases: 2180 },
  { year: 2025, label: 'as of 30 June 2025', cases: 3099, national_jurisdictions: 55, international_or_regional_bodies: 24 }
];

for (let index = 1; index < points.length; index += 1) {
  if (points[index].cases < points[index - 1].cases) throw new Error('Sabin cumulative case series decreases without a documented revision.');
}

const records = points.map(point => ({
  record_id: `sabin_climate_litigation_cumulative_${point.year}`,
  metric_id: METRIC_ID,
  measurement_role: 'global_database_cumulative_case_count_primary',
  observation_year: point.year,
  source_time_label: point.label,
  cumulative_climate_related_cases: point.cases,
  national_jurisdictions_latest_point_only: point.national_jurisdictions ?? null,
  international_or_regional_bodies_latest_point_only: point.international_or_regional_bodies ?? null,
  database_scope: 'Cases where climate change law, policy or science is a material issue, within the Sabin Center Climate Litigation Database methodology.',
  uncertainty_status: 'No numeric uncertainty interval. Discovery, jurisdiction coverage, retrospective additions or removals, classification and methodology revisions affect counts.',
  source_locator: {
    report_release_url: SOURCE_URL,
    database_url: DATABASE_URL,
    methodology_url: METHODOLOGY_URL,
    locator: 'Report-release paragraph beginning As of 30 June 2025 and its comparison series',
    source_time_label: point.label
  }
}));

const snapshot = {
  version: 'sabin_unep_climate_litigation_report_2025_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: SOURCE_ID,
    name: 'Sabin Center and UNEP Global Climate Litigation Report 2025',
    url: SOURCE_URL,
    access: 'open_authoritative_database_assessment'
  },
  ingestion_job_id: INGESTION_JOB_ID,
  metric_contract_ids: [METRIC_ID],
  cadence: 'Semiannual report or database-release check.',
  provenance: 'Source-reported cumulative case counts at named observation labels from the Sabin Center and UNEP 2025 climate-litigation report release.',
  uncertainty: records[0].uncertainty_status,
  failure_behavior: 'Retain the last validated report vintage; reject unexplained decreases or boundary changes; never infer outcomes, annual filings or legal effectiveness.',
  measurement_boundary: 'Cumulative database case coverage. It is not a case-win rate, damages total, annual filing flow, jurisdiction-normalized pressure score, policy effect or causal climate response.',
  record_count: records.length,
  records
};

await mkdir(PUBLIC_DIR, { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: OUTPUT_PATH, records: records.length, latest_cumulative_cases: points.at(-1).cases }, null, 2));
