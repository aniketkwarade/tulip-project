import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/world-bank-desalination-impact-snapshot.json');
const middleEastCapacityMillionM3Day = 34.1;
const middleEastGlobalShare = 0.44;
const impliedGlobalCapacityMillionM3Day = middleEastCapacityMillionM3Day / middleEastGlobalShare;
const snapshot = {
  version: 'world_bank_desalination_2019_global_snapshot_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'world_bank_the_role_of_desalination_in_an_increasingly_water_scarce_world',
    name: 'The Role of Desalination in an Increasingly Water-Scarce World',
    publisher: 'World Bank Water Global Practice',
    report_year: 2019,
    report_page_url: 'https://documents.worldbank.org/en/publication/documents-reports/documentdetail/476041552622967264',
    report_url: 'https://documents1.worldbank.org/curated/en/476041552622967264/pdf/135312-WP-PUBLIC-14-3-2019-12-3-35-W.pdf'
  },
  ingestion_job_id: 'export_world_bank_desalination_impact_snapshot',
  metric_contract_ids: ['desalinated_water_share_of_supply'],
  contract_bindings: [
    { node_id: 'desalination_dependence', metric_id: 'desalinated_water_share_of_supply', measurement_role: 'global_assessment_accumulated_dependence_primary' }
  ],
  cadence: 'Refresh when the World Bank publishes a new global desalination assessment.',
  provenance: 'Reviewed source-reported global plant, country and population totals from the World Bank technical paper. Global installed capacity is a transparent arithmetic implication of the report statement that 34.1 million m3/day represents 44% of current capacity.',
  uncertainty: 'Plant and capacity databases change rapidly and may include announced, contracted, installed or operating capacity differently. The global capacity total is derived from a rounded regional value and rounded share. People supplied is an approximate assessment total, not a utility-level service denominator.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale; never infer municipal supply share for an individual country, treat installed capacity as production, transfer case-study energy intensity globally, or replace absent country data with zero.',
  assessment: {
    report_year: 2019,
    global_desalination_plants_lower_bound: 20000,
    countries_using_desalination_lower_bound: 150,
    people_supplied_daily_million: 300,
    middle_east_capacity_million_m3_day: middleEastCapacityMillionM3Day,
    middle_east_share_global_capacity_pct: middleEastGlobalShare * 100,
    implied_global_installed_capacity_million_m3_day: Number(impliedGlobalCapacityMillionM3Day.toFixed(6)),
    source_capacity_panel_start_year: 2010,
    source_capacity_panel_end_year: 2016,
    source_capacity_panel_year_span: 6,
    geography_boundary: 'Global assessment covering more than 150 countries',
    source_locators: [
      'World Bank report executive summary: plant, country and people totals',
      'World Bank report chapter 2: Middle East capacity and global share',
      'World Bank report figure 2.2: global installed capacity, 2010–2016'
    ]
  }
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, report_year: snapshot.assessment.report_year, metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
