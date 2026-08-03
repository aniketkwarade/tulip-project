import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/tsmc-semiconductor-fabrication-footprint-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const intensitySubcomponents = {
  energy: n(impact.energy_kwh_per_12_inch_equivalent_wafer_mask_layer_2024_derived, anchors.energy_kwh_per_wafer_layer),
  water: n(impact.water_litres_per_12_inch_equivalent_wafer_mask_layer_2024, anchors.water_litres_per_wafer_layer),
  ghg: n(impact.ghg_kg_co2e_per_12_inch_equivalent_wafer_mask_layer_2024_derived, anchors.ghg_kg_co2e_per_wafer_layer)
};
const components = {
  biophysical_burden: Number(((intensitySubcomponents.energy + intensitySubcomponents.water + intensitySubcomponents.ghg) / 3).toFixed(6)),
  human_economic_burden: n(impact.environmental_cost_billion_twd_2024_derived, anchors.environmental_cost_billion_twd),
  persistence: n(impact.environmental_accounting_span_years_derived, anchors.environmental_accounting_span_years),
  extent: n(impact.reporting_countries_or_economies_count, anchors.reporting_countries_or_economies)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('semiconductor_fabrication_footprint: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'semiconductor_fabrication_footprint', method: 'impact_fallback', as_of: '2024', components,
  raw_inputs: {
    biophysical_burden: {
      total_water_million_m3: impact.total_water_million_m3_2024,
      water_litres_per_wafer_mask_layer: impact.water_litres_per_12_inch_equivalent_wafer_mask_layer_2024,
      implied_wafer_mask_layers_derived: impact.implied_12_inch_equivalent_wafer_mask_layers_2024_derived,
      total_energy_gwh: impact.total_energy_gwh_2024,
      energy_kwh_per_wafer_mask_layer_derived: impact.energy_kwh_per_12_inch_equivalent_wafer_mask_layer_2024_derived,
      total_scope_1_2_3_ghg_tonnes_co2e: impact.total_scope_1_2_3_ghg_tonnes_co2e_2024,
      ghg_kg_co2e_per_wafer_mask_layer_derived: impact.ghg_kg_co2e_per_12_inch_equivalent_wafer_mask_layer_2024_derived,
      normalized_subcomponents: intensitySubcomponents,
      normalization_anchors: { energy: anchors.energy_kwh_per_wafer_layer, water: anchors.water_litres_per_wafer_layer, ghg: anchors.ghg_kg_co2e_per_wafer_layer }
    },
    human_economic_burden: { environmental_expense_billion_twd: impact.environmental_expense_billion_twd_2024, environmental_investment_billion_twd: impact.environmental_investment_billion_twd_2024, combined_environmental_cost_billion_twd_derived: impact.environmental_cost_billion_twd_2024_derived, normalization_anchors_billion_twd: anchors.environmental_cost_billion_twd },
    persistence: { environmental_cost_billion_twd_2014_derived: impact.environmental_cost_billion_twd_2014_derived, environmental_cost_billion_twd_2024_derived: impact.environmental_cost_billion_twd_2024_derived, accounting_span_years_derived: impact.environmental_accounting_span_years_derived, normalization_anchors_years: anchors.environmental_accounting_span_years },
    extent: { countries_or_economies: impact.reporting_countries_or_economies_count, named_entities_or_site_groups: impact.named_reporting_entities_or_site_groups_count, normalization_anchors_countries_or_economies: anchors.reporting_countries_or_economies },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'common_wafer_layer_denominator', formula: 'Derive 12-inch equivalent wafer mask layers as 129 million m3 × 1,000 litres/m3 ÷ 161 litres per wafer layer; retain the source denominator and never relabel it as wafer starts.' },
    { type: 'resource_and_emissions_intensity', formula: 'Divide 27,456 GWh and 21,006,442 tCO2e by the same derived wafer-layer denominator; normalize energy, water and GHG intensity separately and average the three normalized values.' },
    { type: 'realized_environmental_cost', formula: 'Add the 2024 Taiwan-fab environmental expense and investment accounts; do not use corporate revenue or avoided-loss estimates.' },
    { type: 'persistence_endpoint_span', formula: 'Use matching 2014 and 2024 environmental-accounting endpoints to establish a ten-year quantified span.' },
    { type: 'bounded_multinational_extent', formula: 'Normalize four disclosed countries or economies; do not assign global industry extent.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `2024 footprint and 2014–2024 environmental-accounting endpoints reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Primary corporate reports provide a common wafer-mask-layer denominator for water, energy and total GHG intensity, realized environmental expense and investment, a ten-year accounting span and a named multinational reporting boundary.', higher_priority_failures: ['The evidence covers one multinational foundry rather than a defensible current global industry aggregation.', 'The current-data method cannot assign global extent or an industry-wide threshold from this company boundary.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`semiconductor_fabrication_footprint: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_98_tsmc_semiconductor_fabrication_footprint', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-98.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-98.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
