import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/california-forest-dieback-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.aerially_detected_dead_trees_more_than, anchors.dead_tree_count),
  human_economic_burden: n(impact.pge_tree_mortality_cost_usd_2016_2021, anchors.bounded_tree_mortality_program_cost_usd),
  persistence: n(impact.mortality_accumulation_years_inclusive, anchors.mortality_accumulation_years),
  extent: n(impact.represented_high_priority_county_count, anchors.represented_high_priority_county_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('forest_dieback_areas: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'forest_dieback_areas', method: 'impact_fallback', as_of: impact.cost_record_end_date, components,
  raw_inputs: {
    biophysical_burden: { aerially_detected_dead_trees_more_than: impact.aerially_detected_dead_trees_more_than, mortality_inventory_start_year: impact.mortality_inventory_start_year, mortality_inventory_end_year: impact.mortality_inventory_end_year, normalization_anchors_trees: anchors.dead_tree_count },
    human_economic_burden: { pge_tree_mortality_cost_usd_by_year: impact.pge_tree_mortality_cost_usd_by_year, pge_tree_mortality_cost_usd_2016_2021: impact.pge_tree_mortality_cost_usd_2016_2021, normalization_anchors_usd: anchors.bounded_tree_mortality_program_cost_usd, boundary: 'Regulator-filed PG&E tree-mortality program cost, not total statewide damage or ecosystem-service loss.' },
    persistence: { mortality_accumulation_years_inclusive: impact.mortality_accumulation_years_inclusive, normalization_anchors_years: anchors.mortality_accumulation_years },
    extent: { represented_high_priority_county_count: impact.represented_high_priority_county_count, represented_state: impact.represented_state, normalization_anchors_counties: anchors.represented_high_priority_county_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'aerially_detected_mortality_lower_bound', formula: 'Normalize 147 million as the conservative numeric value for the USFS more-than-147-million Sierra Nevada dead-tree inventory; do not substitute generic canopy loss.' },
    { type: 'bounded_program_cost_sum', formula: 'Sum the six separately reported PG&E tree-mortality program costs from 2016 through 2021 to USD 700.8 million; exclude routine and enhanced vegetation-management costs.' },
    { type: 'inclusive_inventory_duration', formula: 'Count nine calendar years from 2010 through 2018 inclusive for the mortality accumulation window.' },
    { type: 'operational_county_extent', formula: 'Normalize the ten CAL FIRE high-priority counties identified in the CPUC record; do not treat them as the full statewide or global footprint.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical mortality inventory through 2018 with bounded mitigation costs through ${impact.cost_record_end_date}; records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'USFS and CPUC records jointly quantify verified tree mortality, a directly bounded mitigation cost, multi-year accumulation and the declared operational county footprint.', higher_priority_failures: ['The evidence spans a historical California/Sierra Nevada event and mitigation record, not a current global forest-dieback aggregation.', 'No globally consistent current series supplies verified dieback magnitude plus threshold or momentum coverage under the node contract.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`forest_dieback_areas: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_78_california_forest_dieback', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-78.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-78.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
