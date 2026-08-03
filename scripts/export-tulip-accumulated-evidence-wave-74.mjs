import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/us-fema-managed-retreat-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const governance = snapshot.relocation_governance_case;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(governance.approval_gap_pct_lower_bound, anchors.relocation_approval_gap_pct),
  human_economic_burden: n(impact.average_federal_cost_per_acquisition_usd_2008_2014, anchors.average_federal_cost_per_acquisition_usd),
  persistence: n(governance.typical_acquisition_process_duration_years_lower_bound, anchors.relocation_process_duration_years),
  extent: n(governance.identified_caseload_lower_bound, anchors.relocation_identified_caseload)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('relocation_governance_capacity: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'relocation_governance_capacity',
  method: 'impact_fallback',
  as_of: governance.status_as_of,
  components,
  raw_inputs: {
    biophysical_burden: { approved_acquisitions: governance.approved_acquisitions, additional_submitted_not_yet_approved_lower_bound: governance.additional_submitted_not_yet_approved_lower_bound, approval_coverage_pct_upper_bound: governance.approval_coverage_pct_upper_bound, approval_gap_pct_lower_bound: governance.approval_gap_pct_lower_bound, normalization_anchors_gap_pct: anchors.relocation_approval_gap_pct },
    human_economic_burden: { average_federal_cost_per_acquisition_usd_2008_2014: impact.average_federal_cost_per_acquisition_usd_2008_2014, normalization_anchors_usd: anchors.average_federal_cost_per_acquisition_usd, boundary: 'Historical audited average cost provides program burden context and is not multiplied by the Helene caseload.' },
    persistence: { average_state_application_submission_delay_months: governance.average_state_application_submission_delay_months, typical_acquisition_process_duration_years_lower_bound: governance.typical_acquisition_process_duration_years_lower_bound, normalization_anchors_years: anchors.relocation_process_duration_years },
    extent: { event: governance.event, jurisdiction: governance.jurisdiction, identified_caseload_lower_bound: governance.identified_caseload_lower_bound, normalization_anchors_properties: anchors.relocation_identified_caseload },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources[0].source_locators }
  },
  transformations: [
    { type: 'minimum_identified_caseload', formula: 'Add 82 approved acquisitions to the source statement of more than 575 additional submitted applications using 575 as a conservative numeric lower bound, producing a minimum caseload of 657.' },
    { type: 'bounded_approval_gap', formula: 'Calculate approval coverage as at most 82/657 and the unapproved gap as at least 575/657; do not classify pending applications as rejected.' },
    { type: 'period_matched_cost_context', formula: 'Normalize the audited USD 136,000 average federal acquisition cost from 2008-2014 without multiplying it by the Helene caseload.' },
    { type: 'documented_process_duration', formula: 'Use the lower bound of the GAO statement that acquisition typically takes at least two to three years; retain the separate 16-month average application-submission delay.' },
    { type: 'bounded_event_extent', formula: 'Normalize the minimum identified North Carolina Helene caseload; do not generalize it to other disasters or countries.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: 'The more-than-575 pending figure is converted to a conservative lower bound of 575, so the 657-property caseload is a minimum, approval coverage is an upper bound, and the approval gap is a lower bound. Pending applications are not treated as rejected. The USD 136,000 average cost is from 2008-2014 FEMA data and is context rather than a Helene cost estimate. The case covers North Carolina after one disaster, not national or global relocation governance.',
  freshness: `Helene acquisition status as of ${governance.status_as_of}; GAO report published ${snapshot.sources[0].publication_date}.`,
  selection_reason: {
    selected_method_passed: 'GAO quantifies the disaster-specific submitted caseload, approved acquisitions, lower-bound gap, average application delay, typical acquisition duration and audited program cost within a named jurisdiction.',
    higher_priority_failures: ['The case is a regional administrative snapshot, not a current global planned-relocation capacity aggregation.', 'No global denominator or method-comparable annual series supports current global magnitude, threshold and momentum components.']
  }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`relocation_governance_capacity: receipt verification failed: ${verification.errors.join('; ')}`);

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_74_helene_relocation_governance', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-74.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-74.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
