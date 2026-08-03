import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/eu-agricultural-soil-compaction-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.compacted_arable_land_pct, anchors.compacted_arable_land_pct),
  human_economic_burden: n(impact.measured_crop_yield_reduction_pct_lower_bound, anchors.measured_crop_yield_reduction_pct),
  persistence: n(impact.measured_effect_persistence_years, anchors.measured_effect_persistence_years),
  extent: n(impact.represented_country_count, anchors.represented_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('agricultural_soil_compaction: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'agricultural_soil_compaction',
  method: 'impact_fallback',
  as_of: String(snapshot.metric_contract.assessment_year),
  components,
  raw_inputs: {
    biophysical_burden: { compacted_arable_land_pct: impact.compacted_arable_land_pct, lucas_bulk_density_samples_0_10_cm: impact.lucas_bulk_density_samples_0_10_cm, lucas_bulk_density_samples_10_20_cm: impact.lucas_bulk_density_samples_10_20_cm, normalization_anchors_pct: anchors.compacted_arable_land_pct },
    human_economic_burden: { measured_crop_yield_reduction_pct_lower_bound: impact.measured_crop_yield_reduction_pct_lower_bound, normalization_anchors_pct: anchors.measured_crop_yield_reduction_pct, boundary: 'A source-reported measured lower bound; it is not multiplied across the mapped compacted share and is not assigned a monetary value.' },
    persistence: { measured_effect_persistence_years: impact.measured_effect_persistence_years, normalization_anchors_years: anchors.measured_effect_persistence_years },
    extent: { represented_geography: impact.represented_geography, represented_country_count: impact.represented_country_count, normalization_anchors_countries: anchors.represented_country_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'measured_and_modeled_compaction_share', formula: 'Use the EUSO-reported 3.2 percent arable-land compacted class derived from the LUCAS bulk-density measurements and packing-density model; do not infer compaction from agricultural activity alone.' },
    { type: 'yield_loss_lower_bound', formula: 'Use 35 percent as the conservative numeric value for the source statement that measured crop-yield reductions exceeded 35 percent; do not multiply it by area.' },
    { type: 'observed_persistence', formula: 'Use the source-reported 17 years for detected yield and nitrogen effects after a single compaction event.' },
    { type: 'bounded_extent', formula: 'Normalize the 28 directly represented EU and UK countries; do not generalize the regional assessment globally.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `LUCAS samples collected ${snapshot.metric_contract.assessment_year}; EUSO assessment reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The European Soil Data Centre assessment combines thousands of measured bulk-density cores with a documented packing-density model and quantifies compacted arable-land share, measured yield loss, persistence and bounded continental coverage.',
    higher_priority_failures: ['The 2018 regional survey does not supply a current global field-level aggregation.', 'No method-comparable 20-year annual or 60-month global series supplies current magnitude plus threshold or momentum coverage.']
  }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`agricultural_soil_compaction: receipt verification failed: ${verification.errors.join('; ')}`);

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_71_eu_agricultural_soil_compaction', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-71.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-71.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
