import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/who-cholera-emergency-snapshot.json');
const snapshot = {
  version: 'who_cholera_emergency_complete_year_comparison_2025_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'who_global_cholera_emergency_updates',
    name: 'WHO multi-country cholera outbreak epidemiological updates',
    publisher: 'World Health Organization',
    latest_report_url: 'https://www.who.int/publications/m/item/multi-country-outbreak-of-cholera--epidemiological-update--33--27-january-2026',
    comparator_report_url: 'https://www.who.int/publications/m/item/multi-country-cholera-outbreak--external-situation-report--22---24-january-2025',
    cfr_standard_url: 'https://www.who.int/publications/m/item/vaccine-preventable-diseases-surveillance-standards-cholera'
  },
  ingestion_job_id: 'export_who_cholera_emergency_snapshot',
  metric_contract_ids: ['waterborne_outbreak_signal'],
  contract_bindings: [{ node_id: 'waterborne_pathogen_outbreaks', metric_id: 'waterborne_outbreak_signal', measurement_role: 'global_cholera_awd_complete_reporting_period_primary' }],
  cadence: 'Monthly WHO emergency-update check with complete-year comparison replacement after the final epidemiological period.',
  provenance: 'Official WHO multi-country cholera emergency updates for near-complete 2024 and 2025 reporting periods, plus the WHO surveillance standard for the under-one-percent case-fatality benchmark.',
  uncertainty: 'Reports combine cholera and acute watery diarrhoea under country-specific case definitions and surveillance systems. Underreporting, verification, reporting delays, laboratory confirmation, community deaths and differing observation cutoffs affect comparison.',
  failure_behavior: 'Retain the last reconciled complete-period pair and mark stale; reject incompatible case definitions, missing dates, invalid counts or a shorter partial-year comparison. Never infer absence from missing reports, relabel cholera/AWD as all waterborne disease or compare incomplete periods as full years.',
  measurement_boundary: 'Reported cholera and acute watery diarrhoea in WHO multi-country emergency updates; not modeled total cholera burden, all waterborne pathogens, laboratory-confirmed cases only or a population incidence rate.',
  records: [
    {
      observation_year: 2024,
      observation_start: '2024-01-01',
      observation_end: '2024-12-29',
      cases_reported: 804721,
      deaths_reported: 5805,
      countries_reporting: 33,
      who_regions_reporting: 5,
      source_report_number: 22,
      source_locator: 'WHO external situation report 22 overview.'
    },
    {
      observation_year: 2025,
      observation_start: '2025-01-01',
      observation_end: '2025-12-28',
      cases_reported: 614828,
      deaths_reported: 7598,
      countries_reporting: 33,
      who_regions_reporting: 5,
      source_report_number: 33,
      source_locator: 'WHO epidemiological update 33 overview.'
    }
  ],
  recognized_case_fatality_benchmark_pct: 1,
  who_region_count: 6,
  excluded_from_scoring: ['partial 2026 reports', 'oral-cholera-vaccine stockpile', 'modeled true global burden', 'future roadmap targets other than the contemporaneous case-fatality benchmark']
};

for (const record of snapshot.records) {
  record.case_fatality_rate_pct = Number((100 * record.deaths_reported / record.cases_reported).toFixed(6));
}
await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, years: snapshot.records.map(record => record.observation_year), latest_cases: snapshot.records.at(-1).cases_reported, latest_deaths: snapshot.records.at(-1).deaths_reported }, null, 2));
