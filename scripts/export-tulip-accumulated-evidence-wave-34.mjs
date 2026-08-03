import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HABITAT_PATH = 'public/global-habitat-connectivity-impact-snapshot.json';
const RIVER_PATH = 'public/global-river-connectivity-impact-snapshot.json';
const [habitat, river] = await Promise.all([HABITAT_PATH, RIVER_PATH].map(async file => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))));
const h = habitat.assessment;
const r = river.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

function makeReceipt({ nodeId, asOf, components, rawInputs, transformations, sourceIds, snapshot, snapshotPath, passed, failures }) {
  return buildTulipUrgencyReceipt({
    node_id: nodeId, method: 'impact_fallback', as_of: String(asOf), components,
    raw_inputs: { ...rawInputs, source_snapshot: { path: snapshotPath, version: snapshot.version, captured_at: snapshot.captured_at } },
    transformations, source_ids: sourceIds, uncertainty: snapshot.uncertainty,
    freshness: `Reviewed global assessment as of ${asOf}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
}

const habitatComponents = {
  biophysical_burden: round(normalizeWithAnchors(h.forests_in_fragments_with_little_or_no_connectivity_pct_lower_bound, [0, 2, 7, 15], 'higher_is_worse')),
  human_economic_burden: round(normalizeWithAnchors(h.bounded_service_scope_pct, [0, 10, 25, 50], 'higher_is_worse')),
  persistence: round(normalizeWithAnchors(h.persistence_years, [0, 5, 20, 50], 'higher_is_worse')),
  extent: 1
};
const habitatRaw = {
  biophysical_burden: { forests_in_fragments_with_little_or_no_connectivity_pct_lower_bound: h.forests_in_fragments_with_little_or_no_connectivity_pct_lower_bound, protected_area_network_connectivity_gap_pct_lower_bound: h.terrestrial_protected_area_network_connectivity_gap_pct_lower_bound, anchors_fragmented_forest_pct: [0, 2, 7, 15], boundary: 'Structural connectivity only; species-specific functional connectivity is not inferred.' },
  human_economic_burden: { forest_production_designation_pct: h.forest_production_designation_pct, forest_soil_water_protection_designation_pct: h.forest_soil_water_protection_designation_pct, bounded_service_scope_pct: h.bounded_service_scope_pct, anchors_pct: [0, 10, 25, 50], boundary: 'Non-overlap is not guaranteed; the precomputed bounded sum is service scope, not realized loss.' },
  persistence: { start_year: h.persistence_start_year, forest_assessment_year: h.forest_assessment_year, years: h.persistence_years, cumulative_deforestation_million_ha: h.cumulative_deforestation_since_1990_million_ha, anchors_years: [0, 5, 20, 50] },
  extent: { countries_and_areas_covered: h.countries_and_areas_covered, geography: h.geography_boundary, normalized_value: 1 }
};
const habitatTransformations = [
  { type: 'rounded_connectivity_lower_bound', formula: 'Normalize the UNEP-WCMC rounded lower bound for forests in poorly connected fragments.' },
  { type: 'bounded_forest_service_scope', formula: 'Normalize the stated production plus soil-and-water designation shares only as an upper-bound service scope.' },
  { type: 'forest_loss_persistence', formula: 'Use the FAO 1990-2025 global forest-loss observation interval; do not attribute every loss to fragmentation.' },
  { type: 'global_assessment_extent', formula: 'Use full extent for the 236-country-and-area FRA coverage and global connectivity assessment.' }
];

const riverComponents = {
  biophysical_burden: round(normalizeWithAnchors(r.rivers_over_1000km_not_free_flowing_pct, [0, 20, 50, 90], 'higher_is_worse')),
  human_economic_burden: round(normalizeWithAnchors(r.inland_fisheries_population_service_scope_million, [0, 25, 100, 250], 'higher_is_worse')),
  persistence: round(normalizeWithAnchors(r.persistence_years_to_2026, [0, 2, 5, 15], 'higher_is_worse')),
  extent: 1
};
const riverRaw = {
  biophysical_burden: { long_rivers_not_free_flowing_pct: r.rivers_over_1000km_not_free_flowing_pct, long_rivers_free_flowing_pct: r.rivers_over_1000km_free_flowing_pct, uninterrupted_to_ocean_pct: r.long_rivers_flowing_uninterrupted_to_ocean_pct, anchors_pct: [0, 20, 50, 90] },
  human_economic_burden: { inland_fisheries_population_service_scope_million: r.inland_fisheries_population_service_scope_million, anchors_million_people: [0, 25, 100, 250], boundary: 'Population relying on inland fisheries is service exposure, not harm attributed to every barrier.' },
  persistence: { assessment_year: r.assessment_year, receipt_year: 2026, years: r.persistence_years_to_2026, anchors_years: [0, 2, 5, 15] },
  extent: { global_river_network_million_km: r.global_river_network_million_km, geography: r.geography_boundary, normalized_value: 1 }
};
const riverTransformations = [
  { type: 'long_river_connectivity_gap', formula: 'Subtract the reported free-flowing share from 100 percent and retain the long-river boundary.' },
  { type: 'bounded_fisheries_service_scope', formula: 'Normalize the institutional-summary population estimate as exposure, not attributable harm.' },
  { type: 'minimum_persistence', formula: 'Retain the elapsed period since the 2019 global assessment as a conservative persistence floor.' },
  { type: 'global_network_extent', formula: 'Use full extent for the assessed 12-million-kilometre global river network.' }
];

const receipts = [
  ...['forest_fragmentation', 'wildlife_habitat_patches', 'biodiversity_corridors_disruption'].map(nodeId => makeReceipt({
    nodeId, asOf: h.forest_assessment_year, components: habitatComponents, rawInputs: habitatRaw, transformations: habitatTransformations,
    sourceIds: ['unep_wcmc_global_ecological_connectivity_assessment', 'fao_global_forest_resources_assessment'], snapshot: habitat, snapshotPath: HABITAT_PATH,
    passed: 'UNEP-WCMC quantifies global structural-connectivity deficits while FAO supplies accumulated forest-loss persistence and worldwide service context.',
    failures: ['No complete 20-year annual global structural-connectivity series exists under one method.', 'Species-specific movement and demographic effects are not inferred from structural connectivity.']
  })),
  ...['riverine_habitat_fragmentation', 'dam_and_diversion_infrastructure'].map(nodeId => makeReceipt({
    nodeId, asOf: r.assessment_year, components: riverComponents, rawInputs: riverRaw, transformations: riverTransformations,
    sourceIds: ['global_free_flowing_rivers_assessment_2019'], snapshot: river, snapshotPath: RIVER_PATH,
    passed: 'The primary global assessment quantifies long-river connectivity loss, assessed network extent, persistent barrier burden and bounded inland-fisheries service exposure.',
    failures: ['No method-comparable annual global connectivity panel satisfies the historical-distribution gate.', 'The assessment does not provide current focal-species passability or local barrier inventories.']
  }))
];

for (const item of receipts) {
  const verification = verifyTulipUrgencyReceipt(item);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${item.node_id}: ${verification.errors.join('; ')}`);
}
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_34_global_terrestrial_and_river_connectivity', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-34.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-34.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
