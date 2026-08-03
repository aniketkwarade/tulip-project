import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'undrr-mhews-status-snapshot.json');
const SOURCE_ID = 'undrr_global_status_multi_hazard_early_warning_systems_2024';
const INGESTION_JOB_ID = 'build_undrr_mhews_status_assessment';
const SOURCE_URL = 'https://www.undrr.org/reports/global-status-MHEWS-2024';
const PUBLICATION_URL = 'https://www.undrr.org/publication/global-status-multi-hazard-early-warning-systems-2024';
const REPORTING_AS_OF = '2024-03-31';
const REPORTED_COUNTRIES = 108;
const REPORTED_COUNTRY_SHARE_PCT = 55;
const REPORTING_GAP_PCT = 100 - REPORTED_COUNTRY_SHARE_PCT;
const IMPACT_PERIOD_START_YEAR = 2005;
const IMPACT_PERIOD_END_YEAR = 2023;
const LIMITED_MODERATE_MORTALITY_PER_100000 = 3.79;
const SUBSTANTIAL_COMPREHENSIVE_MORTALITY_PER_100000 = 0.63;
const LIMITED_MODERATE_AFFECTED_PER_100000 = 3087;
const SUBSTANTIAL_COMPREHENSIVE_AFFECTED_PER_100000 = 881;

const common = {
  geography: 'global country reporting aggregate',
  reporting_as_of: REPORTING_AS_OF,
  country_reporting_status_basis: 'Sendai Framework Target G indicator G-1, composite of G-2 through G-5',
  reported_mhews_countries: REPORTED_COUNTRIES,
  reported_mhews_country_share_pct: REPORTED_COUNTRY_SHARE_PCT,
  derived_country_reporting_gap_pct: REPORTING_GAP_PCT,
  uncertainty_status: 'No numeric uncertainty interval is reported. Coverage is affected by country reporting completeness; non-reporting does not establish absence of MHEWS capability.',
  source_locator: {
    report_page_url: SOURCE_URL,
    publication_url: PUBLICATION_URL,
    locator: 'Multi-hazard early warning systems global status; lines reporting end-March-2024 country count and share',
    source_statement: '108 countries reported the existence of MHEWS, representing 55 percent of all countries.',
    derivation: 'country reporting gap percent = 100 - source-reported country share percent'
  }
};

const records = [
  {
    record_id: 'undrr_mhews_country_reporting_status_2024',
    metric_id: 'countries_reporting_multi_hazard_early_warning_systems',
    measurement_role: 'global_country_reporting_status_primary',
    value: REPORTED_COUNTRIES,
    unit: 'countries reporting MHEWS existence',
    ...common
  },
  {
    record_id: 'undrr_mhews_country_reporting_gap_2024',
    metric_id: 'countries_not_reporting_multi_hazard_early_warning_systems_pct',
    measurement_role: 'derived_complement_of_global_country_reporting_share',
    value: REPORTING_GAP_PCT,
    unit: 'percent of countries not represented in the reported MHEWS share',
    ...common
  }
];

if (REPORTING_GAP_PCT < 0 || REPORTING_GAP_PCT > 100) throw new Error('Invalid derived MHEWS reporting gap.');
if (new Set(records.map(record => record.metric_id)).size !== 2) throw new Error('MHEWS metric records are not unique.');

const snapshot = {
  version: 'undrr_mhews_global_status_2024_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: SOURCE_ID,
    name: 'UNDRR and WMO Global Status of Multi-Hazard Early Warning Systems 2024',
    url: SOURCE_URL,
    access: 'open_authoritative_assessment'
  },
  ingestion_job_id: INGESTION_JOB_ID,
  metric_contract_ids: records.map(record => record.metric_id),
  cadence: 'Annual assessment-release check.',
  provenance: 'Source-reported end-March-2024 count and share from the UNDRR and WMO global MHEWS status assessment. The reporting-gap percentage is the labeled arithmetic complement.',
  uncertainty: common.uncertainty_status,
  failure_behavior: 'Retain the last validated assessment and mark its vintage; never treat non-reporting as no capability or translate a country share into population coverage.',
  measurement_boundary: 'Country reporting of MHEWS existence under Sendai Target G. This is not population coverage, warning receipt, warning effectiveness, or a complete country capability score.',
  impact_context: {
    impact_period_start_year: IMPACT_PERIOD_START_YEAR,
    impact_period_end_year: IMPACT_PERIOD_END_YEAR,
    impact_period_years_inclusive: IMPACT_PERIOD_END_YEAR - IMPACT_PERIOD_START_YEAR + 1,
    limited_to_moderate_mhews_mortality_per_100000: LIMITED_MODERATE_MORTALITY_PER_100000,
    substantial_to_comprehensive_mhews_mortality_per_100000: SUBSTANTIAL_COMPREHENSIVE_MORTALITY_PER_100000,
    derived_mortality_ratio: Number((LIMITED_MODERATE_MORTALITY_PER_100000 / SUBSTANTIAL_COMPREHENSIVE_MORTALITY_PER_100000).toFixed(3)),
    limited_to_moderate_mhews_affected_people_per_100000: LIMITED_MODERATE_AFFECTED_PER_100000,
    substantial_to_comprehensive_mhews_affected_people_per_100000: SUBSTANTIAL_COMPREHENSIVE_AFFECTED_PER_100000,
    derived_affected_people_ratio: Number((LIMITED_MODERATE_AFFECTED_PER_100000 / SUBSTANTIAL_COMPREHENSIVE_AFFECTED_PER_100000).toFixed(3)),
    source_locator: {
      report_page_url: SOURCE_URL,
      locator: 'Global impacts by MHEWS comprehensiveness, 2005-2023',
      boundary: 'Descriptive country-group outcome ratios; not a randomized causal effect or population-coverage estimate.'
    }
  },
  record_count: records.length,
  records
};

await mkdir(PUBLIC_DIR, { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  output: OUTPUT_PATH,
  records: records.length,
  reported_countries: REPORTED_COUNTRIES,
  reported_country_share_pct: REPORTED_COUNTRY_SHARE_PCT,
  derived_reporting_gap_pct: REPORTING_GAP_PCT
}, null, 2));
