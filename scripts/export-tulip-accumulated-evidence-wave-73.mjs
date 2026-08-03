import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/us-fema-managed-retreat-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.completed_acquisitions, anchors.completed_acquisitions),
  human_economic_burden: n(impact.average_federal_cost_per_acquisition_usd_2008_2014, anchors.average_federal_cost_per_acquisition_usd),
  persistence: n(impact.accumulation_period_years, anchors.accumulation_period_years),
  extent: n(impact.represented_country_count, anchors.represented_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('managed_retreat_pressure: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'managed_retreat_pressure',
  method: 'impact_fallback',
  as_of: String(impact.accumulation_end_year),
  components,
  raw_inputs: {
    biophysical_burden: { completed_acquisitions: impact.completed_acquisitions, total_fema_mitigated_properties: impact.total_fema_mitigated_properties, acquisition_share_pct: impact.acquisition_share_pct, normalization_anchors_properties: anchors.completed_acquisitions },
    human_economic_burden: { average_federal_cost_per_acquisition_usd_2008_2014: impact.average_federal_cost_per_acquisition_usd_2008_2014, typical_process_duration_years_lower_bound: impact.typical_process_duration_years_lower_bound, normalization_anchors_usd: anchors.average_federal_cost_per_acquisition_usd, boundary: 'The audited period-specific average is not multiplied by acquisitions outside 2008-2014.' },
    persistence: { accumulation_start_year: impact.accumulation_start_year, accumulation_end_year: impact.accumulation_end_year, accumulation_period_years: impact.accumulation_period_years, permanent_open_space: impact.permanent_open_space, normalization_anchors_years: anchors.accumulation_period_years },
    extent: { represented_country: impact.represented_country, represented_country_count: impact.represented_country_count, normalization_anchors_countries: anchors.represented_country_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources[0].source_locators }
  },
  transformations: [
    { type: 'completed_acquisition_lower_bound', formula: 'Use only GAO-reported completed FEMA acquisitions as the realized lower bound of formal managed-retreat evaluation; exclude general exposure, unmitigated repetitive-loss properties and non-retreat mitigation.' },
    { type: 'period_matched_average_cost', formula: 'Normalize the audited USD 136,000 average federal acquisition cost for 2008-2014 without multiplying it by the full 1989-2025 count.' },
    { type: 'accumulation_window', formula: 'Use 36 completed fiscal years from 1989 through 2025 as the accumulated administrative record; retain the permanent open-space requirement as unscored context.' },
    { type: 'bounded_extent', formula: 'Normalize the one represented country; do not generalize the FEMA program globally.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `FEMA acquisition totals through fiscal year ${impact.accumulation_end_year}; GAO report published ${snapshot.sources[0].publication_date}.`,
  selection_reason: {
    selected_method_passed: 'GAO’s audited FEMA totals quantify completed voluntary acquisitions, their share of mitigated properties, an average federal acquisition cost, a 36-year accumulation window and bounded national coverage.',
    higher_priority_failures: ['Completed United States acquisitions are not a current global aggregation of properties under retreat consideration.', 'The report does not provide method-comparable global annual magnitude, threshold and momentum components.']
  }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`managed_retreat_pressure: receipt verification failed: ${verification.errors.join('; ')}`);

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_73_us_fema_managed_retreat', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-73.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-73.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
