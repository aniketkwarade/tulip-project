import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'us_fema_flood_property_acquisitions_1989_2025_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'gao_26_109045_fema_flood_property_acquisitions',
      name: 'Flood Risk Mitigation: Reducing Fiscal Exposure and Improving Affordability',
      publisher: 'U.S. Government Accountability Office',
      publication_date: '2026-03-26',
      url: 'https://files.gao.gov/reports/GAO-26-109045/index.html',
      source_locators: ['Figure 2 discussion: 69,415 acquisitions, 72.5 percent of 95,762 FEMA-mitigated properties, fiscal years 1989-2025.', 'Cost discussion: average federal cost was USD 136,000 per acquisition in 2008-2014 FEMA data.', 'Acquisition definition and process discussion: willing-seller purchase and demolition; acquired land becomes open space in perpetuity; process typically takes at least two to three years.', 'Capacity discussion: as of February 2026, 82 North Carolina acquisitions for Hurricane Helene were approved and more than 575 additional acquisition applications had been submitted but not yet approved; FEMA analysis found an average 16-month state application-submission delay.']
    }
  ],
  metric_contract: {
    node_id: 'managed_retreat_pressure',
    metric_id: 'properties_under_managed_retreat_consideration',
    unit: 'completed voluntary acquisition properties, share of FEMA-mitigated properties, audited average federal cost and program years',
    geography: 'United States FEMA Hazard Mitigation Assistance programs',
    assessment_period: 'fiscal years 1989-2025',
    boundary: 'Completed FEMA acquisitions are used as a conservative realized subset of properties formally evaluated for managed retreat. Unmitigated repetitive-loss properties, general flood exposure, elevations and floodproofing are excluded because they are not evidence of retreat evaluation or acquisition.'
  },
  accumulated_impact: {
    completed_acquisitions: 69415,
    total_fema_mitigated_properties: 95762,
    acquisition_share_pct: 72.5,
    average_federal_cost_per_acquisition_usd_2008_2014: 136000,
    accumulation_start_year: 1989,
    accumulation_end_year: 2025,
    accumulation_period_years: 36,
    typical_process_duration_years_lower_bound: 2,
    permanent_open_space: true,
    represented_country_count: 1,
    represented_country: 'United States'
  },
  relocation_governance_case: {
    event: 'Hurricane Helene',
    event_month: '2024-09',
    jurisdiction: 'North Carolina',
    status_as_of: '2026-02',
    approved_acquisitions: 82,
    additional_submitted_not_yet_approved_lower_bound: 575,
    identified_caseload_lower_bound: 657,
    approval_coverage_pct_upper_bound: Number((82 / 657 * 100).toFixed(6)),
    approval_gap_pct_lower_bound: Number((575 / 657 * 100).toFixed(6)),
    average_state_application_submission_delay_months: 16,
    typical_acquisition_process_duration_years_lower_bound: 2
  },
  reviewed_normalization_anchors: {
    completed_acquisitions: [0, 1000, 10000, 100000],
    average_federal_cost_per_acquisition_usd: [0, 25000, 100000, 500000],
    accumulation_period_years: [0, 5, 20, 50],
    represented_country_count: [0, 1, 10, 100],
    relocation_identified_caseload: [0, 10, 100, 1000],
    relocation_approval_gap_pct: [0, 10, 40, 90],
    relocation_process_duration_years: [0, 0.25, 1, 3]
  },
  uncertainty: 'The 69,415 properties are completed acquisitions, not all properties considered, submitted, approved or eligible, and not all were repetitive-loss properties. The USD 136,000 average applies to FEMA data for 2008-2014 and is not multiplied by the full 1989-2025 acquisition count. The 36-year period measures accumulation of completed acquisitions, not an individual household’s relocation duration. The inventory is United States-only.'
};

await fs.writeFile(path.join(ROOT, 'public/us-fema-managed-retreat-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/us-fema-managed-retreat-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
