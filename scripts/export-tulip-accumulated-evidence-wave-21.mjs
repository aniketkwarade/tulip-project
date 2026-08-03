import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/undrr-critical-infrastructure-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'critical_infrastructure_fragility',
  method: 'impact_fallback',
  as_of: String(a.report_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.average_critical_infrastructure_units_damaged_or_destroyed_per_year, [0, 10000, 100000, 250000], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.basic_service_disruptions_lower_bound, [0, 10000, 100000, 500000], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.facility_damage_period_years, [0, 2, 5, 10], 'higher_is_worse')),
    extent: a.reporting_country_extent_normalized
  },
  raw_inputs: {
    biophysical_burden: { average_critical_infrastructure_units_damaged_or_destroyed_per_year: a.average_critical_infrastructure_units_damaged_or_destroyed_per_year, period: [a.facility_damage_period_start_year, a.facility_damage_period_end_year], anchors_units_per_year: [0, 10000, 100000, 250000] },
    human_economic_burden: { basic_service_disruptions_lower_bound: a.basic_service_disruptions_lower_bound, period: [a.service_disruption_period_start_year, a.service_disruption_period_end_year], reporting_countries: a.service_disruption_reporting_countries, anchors_disruptions: [0, 10000, 100000, 500000], boundary: 'Reported service disruption events, not people or service-hours lost; includes pandemic-period disruptions.' },
    persistence: { facility_damage_period_years: a.facility_damage_period_years, anchors_years: [0, 2, 5, 10] },
    extent: { reporting_countries: a.service_disruption_reporting_countries, denominator_un_member_states: a.un_member_state_denominator, normalized_value: a.reporting_country_extent_normalized, boundary: 'Reporting coverage only; unreported countries are missing, not zero.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'annual_average_facility_damage', formula: 'Normalize the source-reported annual-average damaged-or-destroyed critical-infrastructure unit count; do not multiply by seven without annual records.' },
    { type: 'fixed_period_service_disruption', formula: 'Normalize the lower-bound two-year service-disruption count without converting events to people, duration or physical damage.' },
    { type: 'reported_country_extent', formula: 'Divide reporting countries by the UN Member State denominator; leave unreported countries missing.' }
  ],
  source_ids: ['undrr_sendai_midterm_critical_infrastructure_impacts'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNDRR Sendai midterm Target D assessment, ${a.report_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNDRR quantifies recurring critical-infrastructure damage, basic-service disruptions, a seven-year observation window and an explicit reporting-country denominator.',
    higher_priority_failures: ['The operational US DOE OE-417 snapshot is a national electricity-disturbance feed and cannot supply a current global multi-infrastructure aggregation.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for critical_infrastructure_fragility.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_21_undrr_critical_infrastructure', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'undrr_sendai_midterm_critical_infrastructure_impacts', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-21.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-21.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
