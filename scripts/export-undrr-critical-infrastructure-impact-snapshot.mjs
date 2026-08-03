import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/undrr-critical-infrastructure-impact-snapshot.json');
const snapshot = {
  version: 'undrr_sendai_midterm_critical_infrastructure_impact_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'undrr_sendai_midterm_critical_infrastructure_impacts',
    name: 'UNDRR Midterm Review of the Sendai Framework — Target D',
    publisher: 'United Nations Office for Disaster Risk Reduction',
    url: 'https://www.undrr.org/publication/report-midterm-review-implementation-sendai-framework-disaster-risk-reduction-2015-2030',
    resilient_infrastructure_url: 'https://www.undrr.org/news/focus-resilient-infrastructure'
  },
  ingestion_job_id: 'export_undrr_critical_infrastructure_impact_snapshot',
  metric_contract_ids: ['eia_oe417_reported_customer_interruption_burden'],
  contract_bindings: [{ node_id: 'critical_infrastructure_fragility', metric_id: 'eia_oe417_reported_customer_interruption_burden', measurement_role: 'multi_country_accumulated_facility_damage_and_basic_service_disruption_assessment' }],
  cadence: 'Sendai Framework Monitor and Target D assessment release review.',
  provenance: 'Official UNDRR Target D assessment counts retaining annual-average damaged facilities, fixed-period service disruptions, reporting-country denominator and modelled infrastructure losses separately.',
  uncertainty: 'Country reporting is incomplete and definitions of facility, damage and service disruption differ. The 2020-2021 service total includes pandemic-related disruptions and cannot be attributed only to physical asset damage. Global annual infrastructure loss is modeled.',
  failure_behavior: 'Retain the last reviewed Target D assessment and mark stale; reject missing reporting-country or period denominators. Never infer unreported countries as zero, add facility and service counts, attribute every disruption to physical damage or score modeled annual loss as an observed ledger.',
  assessment: {
    report_year: 2023,
    facility_damage_period_start_year: 2015,
    facility_damage_period_end_year: 2021,
    facility_damage_period_years: 7,
    average_critical_infrastructure_units_damaged_or_destroyed_per_year: 142852,
    service_disruption_period_start_year: 2020,
    service_disruption_period_end_year: 2021,
    basic_service_disruptions_lower_bound: 363184,
    service_disruption_reporting_countries: 44,
    un_member_state_denominator: 193,
    reporting_country_extent_normalized: Number((44 / 193).toFixed(6)),
    modeled_global_annual_infrastructure_loss_usd_billion_context_only: 700,
    geographic_scope: '44 reporting countries within the global Sendai Framework Monitor',
    source_locators: [
      'UNDRR Sendai midterm review Target D: average 142,852 critical infrastructure units and facilities destroyed or damaged per year between 2015 and 2021.',
      'UNDRR Sendai midterm review Target D: over 363,184 basic-service disruptions in 44 reporting countries during 2020 and 2021.',
      'UNDRR resilient infrastructure focus: modeled global annual infrastructure losses exceed US$700 billion (context only).'
    ]
  },
  excluded_from_scoring: ['modeled global annual infrastructure loss', 'unreported-country zeros', 'facility-plus-service count addition', 'physical-damage attribution for all pandemic-period disruptions']
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, annual_average_facilities: snapshot.assessment.average_critical_infrastructure_units_damaged_or_destroyed_per_year }, null, 2));
