import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/kalamazoo-inland-waterway-spill-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.reported_release_gallons, anchors.reported_release_gallons),
  human_economic_burden: n(impact.continuing_cleanup_cost_usd_lower_bound, anchors.continuing_cleanup_cost_usd),
  persistence: n(impact.cleanup_duration_years, anchors.cleanup_duration_years),
  extent: n(impact.represented_country_count, anchors.represented_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('inland_waterway_fuel_spills: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'inland_waterway_fuel_spills',
  method: 'impact_fallback',
  as_of: String(impact.cleanup_through_year),
  components,
  raw_inputs: {
    biophysical_burden: { reported_release_gallons: impact.reported_release_gallons, normalization_anchors_gallons: anchors.reported_release_gallons },
    human_economic_burden: { continuing_cleanup_cost_usd_lower_bound: impact.continuing_cleanup_cost_usd_lower_bound, people_reporting_crude_oil_exposure_consistent_symptoms: impact.people_reporting_crude_oil_exposure_consistent_symptoms, normalization_anchors_usd: anchors.continuing_cleanup_cost_usd, boundary: 'The cost value is a source-reported continuing cleanup-cost lower bound; reported symptoms are retained as context and do not add separate score points.' },
    persistence: { cleanup_start_year: impact.cleanup_start_year, cleanup_through_year: impact.cleanup_through_year, cleanup_duration_years: impact.cleanup_duration_years, normalization_anchors_years: anchors.cleanup_duration_years },
    extent: { affected_river_miles_at_least: impact.affected_river_miles_at_least, represented_countries: impact.represented_countries, represented_country_count: impact.represented_country_count, normalization_anchors_countries: anchors.represented_country_count, boundary: 'Affected river miles document the case footprint; the normalized extent component uses represented countries so a regional case is not treated as global coverage.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'actual_discharge_only', formula: 'Use the official revised 843,444-gallon release estimate; do not infer discharged volume from pipeline throughput, vessel capacity, traffic or risk.' },
    { type: 'cleanup_cost_lower_bound', formula: 'Use the NTSB continuing cleanup-cost value of more than USD 767 million as a conservative numeric lower bound; do not inflate it to a final total cost.' },
    { type: 'documented_cleanup_duration', formula: 'Calculate four years from the EPA-documented 2010 through 2014 recovery-and-dredging period; do not claim ecological recovery ended in 2014.' },
    { type: 'bounded_extent', formula: 'Normalize the one represented country while retaining the at-least-35-mile river footprint as unscored context.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Historical spill assessed through ${impact.cleanup_through_year}; federal response page reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'NTSB, PHMSA and EPA records quantify an actual inland-waterway oil discharge, continuing cleanup cost, a multi-year cleanup period, affected river length and bounded geography for the same named incident.',
    higher_priority_failures: ['The evidence is a severe regional accumulated-impact case, not a current global inland-waterway spill aggregation.', 'No method-comparable 20-year annual or 60-month global series supplies current magnitude plus threshold or momentum coverage.']
  }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`inland_waterway_fuel_spills: receipt verification failed: ${verification.errors.join('; ')}`);

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_70_kalamazoo_inland_waterway_spill', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-70.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-70.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
