import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/undrr-ldc-disaster-inequality-snapshot.json');
const snapshot = {
  version: 'undrr_ldc_disaster_inequality_2015_2024_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'undrr_disaster_risk_reduction_in_least_developed_countries',
    name: 'UNDRR Disaster Risk Reduction in Least Developed Countries',
    publisher: 'United Nations Office for Disaster Risk Reduction',
    url: 'https://www.undrr.org/implementing-sendai-framework/sendai-framework-action/disaster-risk-reduction-least-developed-countries'
  },
  ingestion_job_id: 'export_undrr_ldc_disaster_inequality_snapshot',
  metric_contract_ids: ['openfema_geographic_ihp_assistance_gap'],
  contract_bindings: [{ node_id: 'disaster_recovery_inequality', metric_id: 'openfema_geographic_ihp_assistance_gap', measurement_role: 'global_companion_cross_income_disaster_burden_inequality_assessment' }],
  cadence: 'Annual Sendai Framework Monitor review.',
  provenance: 'Official UNDRR least-developed-country Sendai Framework Monitor summary retaining the observation period, reporting-country denominator, mortality rates and direct-economic-loss shares for LDC and global comparison groups.',
  uncertainty: 'Sendai reporting definitions, event attribution, valuation, national capacity and completeness vary. The summary compares LDC and global groups; it does not measure household aid eligibility, awards, recovery time, wealth, protected classes or causal discrimination.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale. Reject changed periods or missing comparison denominators. Never infer non-reporting as zero loss, apply group averages to households, or combine mortality and economic ratios into a count.',
  assessment: {
    data_as_of: '2025-10',
    period_start_year: 2015,
    period_end_year: 2024,
    period_years: 10,
    ldc_total: 44,
    ldc_reporting_sendai: 38,
    ldc_reporting_desinventar: 4,
    ldc_reporting_total: 42,
    ldc_reporting_share_pct: 95,
    ldc_disaster_mortality_per_100k: 1.76,
    ldc_mortality_multiple_global: 2.35,
    global_disaster_mortality_per_100k_derived: Number((1.76 / 2.35).toFixed(6)),
    ldc_direct_economic_loss_pct_gdp: 3.22,
    global_direct_economic_loss_pct_gdp: 0.28,
    ldc_economic_loss_multiple_global: Number((3.22 / 0.28).toFixed(6)),
    geographic_scope: '42 reporting least-developed countries compared with the global Sendai monitoring aggregate',
    source_locators: [
      'UNDRR LDC status: 42 of 44 LDCs report through Sendai Framework Monitor or DesInventar.',
      'UNDRR LDC status: 2015-2024 disaster mortality was 1.76 per 100,000, 2.35 times the global average.',
      'UNDRR LDC status: direct economic loss was 3.22% of GDP versus 0.28% globally, more than eleven times higher.'
    ]
  },
  excluded_from_scoring: ['household recovery-time inference', 'protected-class attribution', 'non-reporting zeros', 'mortality-plus-economic composite count', 'older 1970-2019 EM-DAT contextual shares']
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, reporting_ldcs: snapshot.assessment.ldc_reporting_total }, null, 2));
