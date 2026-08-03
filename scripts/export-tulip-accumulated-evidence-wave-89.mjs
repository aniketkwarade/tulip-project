import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/cattle-grazing-compaction-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.high_density_infiltration_loss_percent_derived, anchors.infiltration_loss_percent),
  human_economic_burden: n(impact.cattle_trampling_first_cut_grass_yield_loss_percent_up_to, anchors.grass_yield_loss_percent),
  persistence: n(impact.usda_grazing_treatment_years, anchors.treatment_duration_years),
  extent: n(impact.usda_grazed_paddock_count, anchors.grazed_paddock_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('cattle_grazing_overcompaction: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'cattle_grazing_overcompaction', method: 'impact_fallback', as_of: '2026', components,
  raw_inputs: {
    biophysical_burden: { ungrazed_infiltration_centimetres_per_day: impact.ungrazed_infiltration_centimetres_per_day, high_density_infiltration_centimetres_per_day: impact.high_density_infiltration_centimetres_per_day, high_density_infiltration_loss_percent_derived: impact.high_density_infiltration_loss_percent_derived, high_stocking_density_cows_per_hectare: impact.high_stocking_density_cows_per_hectare, measured_compaction_depth_centimetres: impact.measured_compaction_depth_centimetres, normalization_anchors_percent: anchors.infiltration_loss_percent },
    human_economic_burden: { cattle_trampling_first_cut_grass_yield_loss_percent_up_to: impact.cattle_trampling_first_cut_grass_yield_loss_percent_up_to, normalization_anchors_percent: anchors.grass_yield_loss_percent },
    persistence: { usda_grazing_treatment_years: impact.usda_grazing_treatment_years, normalization_anchors_years: anchors.treatment_duration_years },
    extent: { usda_grazed_paddock_count: impact.usda_grazed_paddock_count, usda_ungrazed_control_site_count: impact.usda_ungrazed_control_site_count, normalization_anchors_paddocks: anchors.grazed_paddock_count },
    unscored_context: { low_stocking_density_cows_per_hectare: impact.low_stocking_density_cows_per_hectare, medium_stocking_density_cows_per_hectare: impact.medium_stocking_density_cows_per_hectare, low_density_infiltration_centimetres_per_day: impact.low_density_infiltration_centimetres_per_day, medium_density_infiltration_centimetres_per_day: impact.medium_density_infiltration_centimetres_per_day, annual_grass_dry_matter_yield_loss_percent_year_three: impact.annual_grass_dry_matter_yield_loss_percent_year_three, tractor_compaction_first_cut_yield_loss_percent: impact.tractor_compaction_first_cut_yield_loss_percent_unscored },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'control_relative_infiltration_loss', formula: 'Compute (28.5 - 5) / 28.5 × 100 = 82.456140 percent loss using the ungrazed-control and high-density-treatment infiltration endpoints.' },
    { type: 'cattle_only_yield_burden', formula: 'Normalize the source-reported maximum 19-percent first-cut grass-silage yield loss from cattle trampling; exclude the 37.7-percent tractor-compaction result.' },
    { type: 'bounded_duration_and_extent', formula: 'Normalize ten treatment years and six grazed USDA paddocks; retain two adjacent ungrazed sites as control design rather than additional affected extent.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical ten-year USDA grazing experiment plus current SRUC/AHDB research summary reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Controlled field evidence directly measures cattle stocking density, soil penetration and bulk-density response, infiltration loss, treatment duration and cattle-specific grass-yield burden.', higher_priority_failures: ['The evidence consists of bounded Oklahoma and Scottish/UK experiments rather than a current global grazing-compaction observation.', 'No comparable global monthly or annual soil-compaction series meets the current-data coverage and historical-distribution gates.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`cattle_grazing_overcompaction: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_89_cattle_grazing_compaction', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-89.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-89.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
