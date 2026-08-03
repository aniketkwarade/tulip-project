import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/mumbai-watershed-forest-loss-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.cumulative_forest_cover_loss_percent_linearized, anchors.cumulative_forest_cover_loss_percent),
  human_economic_burden: n(impact.deforestation_induced_cost_inr_per_year_2010_2011_prices, anchors.annual_treatment_cost_inr),
  persistence: n(impact.treatment_plant_observation_span_years, anchors.observed_system_span_years),
  extent: n(impact.watershed_monitoring_site_count, anchors.watershed_monitoring_site_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('watershed_forest_loss: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'watershed_forest_loss', method: 'impact_fallback', as_of: String(impact.treatment_plant_observation_end_year), components,
  raw_inputs: {
    biophysical_burden: { forest_cover_change_percent_per_year: impact.forest_cover_change_percent_per_year, forest_cover_observation_start_year: impact.forest_cover_observation_start_year, forest_cover_observation_end_year: impact.forest_cover_observation_end_year, cumulative_forest_cover_loss_percent_linearized: impact.cumulative_forest_cover_loss_percent_linearized, normalization_anchors_percent: anchors.cumulative_forest_cover_loss_percent, habitat_definition: snapshot.metric_contract.habitat_definition },
    human_economic_burden: { deforestation_induced_cost_inr_per_year_2010_2011_prices: impact.deforestation_induced_cost_inr_per_year_2010_2011_prices, cost_intensity_inr_per_cubic_metre_per_hectare_per_year: impact.deforestation_induced_cost_inr_per_cubic_metre_per_hectare_per_year, normalization_anchors_inr: anchors.annual_treatment_cost_inr },
    persistence: { treatment_plant_observation_start_year: impact.treatment_plant_observation_start_year, treatment_plant_observation_end_year: impact.treatment_plant_observation_end_year, treatment_plant_observation_span_years: impact.treatment_plant_observation_span_years, normalization_anchors_years: anchors.observed_system_span_years },
    extent: { watershed_monitoring_site_count: impact.watershed_monitoring_site_count, normalization_anchors_sites: anchors.watershed_monitoring_site_count },
    unscored_context: { turbidity_increase_percent_per_one_percent_forest_cover_decrease: impact.turbidity_increase_percent_per_one_percent_forest_cover_decrease_unscored, treatment_cost_increase_percent_per_one_percent_forest_cover_decrease: impact.treatment_cost_increase_percent_per_one_percent_forest_cover_decrease_unscored },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'direction_preserving_forest_loss', formula: 'Convert the source-reported -0.0088 percent annual forest-cover change to a positive 0.0088 percent annual loss magnitude; preserve the original sign in raw inputs.' },
    { type: 'linearized_observed_loss', formula: 'Multiply the 0.0088 percent annual loss magnitude by the 13-year 1994-2007 forest-cover observation span to obtain 0.1144 percent; do not claim compounding or gross-loss hectares.' },
    { type: 'bounded_economic_burden', formula: 'Normalize only the study-estimated INR 3.73 million annual Panjrapur burden in 2010-2011 prices; do not separately score elasticities or water-loss channels.' },
    { type: 'study_persistence_and_extent', formula: 'Normalize the 16-year Panjrapur operating-data span and six watershed monitoring sites without interpreting them as global coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical Mumbai watershed and Panjrapur observations ending ${impact.treatment_plant_observation_end_year}; published study and TERI summary reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'The same bounded water-supply system supplies a defined forest-cover series, six watershed monitoring sites, a 16-year treatment-operation record and a quantitative annual treatment burden.', higher_priority_failures: ['The newest forest-cover observation ends in 2007 and treatment-operation record in 2011, so this is not a current observation.', 'The study covers selected Mumbai supply watersheds and one treatment plant rather than a defensible current global aggregation.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`watershed_forest_loss: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_88_mumbai_watershed_forest_loss', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-88.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-88.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
