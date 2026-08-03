import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fws-four-mussel-recovery-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.median_occurrence_or_population_decline_pct, anchors.occurrence_or_population_decline_pct),
  human_economic_burden: n(impact.combined_estimated_recovery_cost_usd, anchors.estimated_recovery_cost_usd),
  persistence: n(impact.estimated_time_to_recovery_years, anchors.estimated_time_to_recovery_years),
  extent: n(impact.represented_country_count, anchors.represented_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('freshwater_mussel_depletion: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'freshwater_mussel_depletion',
  method: 'impact_fallback',
  as_of: String(snapshot.metric_contract.assessment_year),
  components,
  raw_inputs: {
    biophysical_burden: { species: impact.species, median_occurrence_or_population_decline_pct: impact.median_occurrence_or_population_decline_pct, normalization_anchors_pct: anchors.occurrence_or_population_decline_pct },
    human_economic_burden: { species_recovery_costs: impact.species.map(({ common_name, estimated_recovery_cost_usd }) => ({ common_name, estimated_recovery_cost_usd })), combined_estimated_recovery_cost_usd: impact.combined_estimated_recovery_cost_usd, normalization_anchors_usd: anchors.estimated_recovery_cost_usd, boundary: 'Recovery-action planning cost for four species; not a valuation of total ecological-service or fishery loss.' },
    persistence: { estimated_time_to_recovery_years: impact.estimated_time_to_recovery_years, normalization_anchors_years: anchors.estimated_time_to_recovery_years },
    extent: { represented_countries: impact.represented_countries, represented_country_count: impact.represented_country_count, historical_us_state_count_maximum: impact.historical_us_state_count_maximum, normalization_anchors_countries: anchors.represented_country_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, report_sha256: snapshot.sources[0].report_sha256, source_locators: snapshot.sources[0].source_locators }
  },
  transformations: [
    { type: 'species_specific_occurrence_decline', formula: 'For rayed bean, sheepnose and snuffbox, calculate percent decline from source-reported historical and current occupied units; for spectaclecase, retain the source-reported 60 percent known-population decline.' },
    { type: 'median_four_species_burden', formula: 'Sort the four decline percentages and average the middle two; do not pool unlike streams, lakes and watersheds into one count.' },
    { type: 'species_recovery_cost_sum', formula: 'Add the four Table 2 total estimated recovery-action costs; retain the source warning that some costs are undetermined and shared actions may reduce totals.' },
    { type: 'recovery_horizon_persistence', formula: 'Use the source-reported 50-year anticipated delisting horizon as persistence, not as an observed annual population series.' },
    { type: 'bounded_extent', formula: 'Normalize the two directly represented countries; do not generalize four taxa to global freshwater mussels.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Recovery plan published ${snapshot.sources[0].publication_date}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The Fish & Wildlife Service recovery plan quantifies historical-to-current occurrence or population declines, species-specific recovery costs, a 50-year recovery horizon and bounded North American extent for four named endangered mussels.',
    higher_priority_failures: ['Occurrence units differ among species and the plan is not a current global density or recruitment aggregation.', 'No method-comparable 20-year annual or 60-month global population series supports current magnitude, threshold and momentum.']
  }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`freshwater_mussel_depletion: receipt verification failed: ${verification.errors.join('; ')}`);

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_69_fws_four_mussel_recovery', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-69.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-69.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
