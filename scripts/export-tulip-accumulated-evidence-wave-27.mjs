import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALINITY_SNAPSHOT_PATH = 'public/fao-global-soil-salinity-impact-snapshot.json';
const NUTRIENT_SNAPSHOT_PATH = 'public/unep-global-nutrient-pollution-impact-snapshot.json';
const [salinitySnapshot, nutrientSnapshot] = await Promise.all([
  fs.readFile(path.join(ROOT, SALINITY_SNAPSHOT_PATH), 'utf8').then(JSON.parse),
  fs.readFile(path.join(ROOT, NUTRIENT_SNAPSHOT_PATH), 'utf8').then(JSON.parse)
]);
const s = salinitySnapshot.assessment;
const n = nutrientSnapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const salinityReceipt = buildTulipUrgencyReceipt({
  node_id: 'topsoil_salinization_fields',
  method: 'impact_fallback',
  as_of: String(s.assessment_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(s.global_salt_affected_soil_million_hectares, [0, 250, 750, 1500], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(s.annual_crop_production_loss_usd_billion, [0, 5, 15, 30], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(s.annual_farmland_removed_from_production_million_hectares, [0, 0.25, 0.75, 1.5], 'higher_is_worse')),
    extent: round(normalizeWithAnchors(s.global_land_area_affected_pct, [0, 2.5, 7.5, 15], 'higher_is_worse'))
  },
  raw_inputs: {
    biophysical_burden: { global_salt_affected_soil_million_hectares: s.global_salt_affected_soil_million_hectares, anchors_million_hectares: [0, 250, 750, 1500], boundary: 'Currently mapped salt-affected soil; the additional area at risk is excluded.' },
    human_economic_burden: { annual_crop_production_loss_usd_billion: s.annual_crop_production_loss_usd_billion, anchors_usd_billion_per_year: [0, 5, 15, 30], population_context_billion: s.people_facing_food_production_challenges_billion, boundary: 'FAO estimate of lost crop production in irrigated salt-degraded areas; population context is not added.' },
    persistence: { annual_farmland_removed_from_production_million_hectares: s.annual_farmland_removed_from_production_million_hectares, anchors_million_hectares_per_year: [0, 0.25, 0.75, 1.5], boundary: 'Earlier FAO assessment synthesis of recurring annual farmland loss; not a current annual panel.' },
    extent: { global_land_area_affected_pct: s.global_land_area_affected_pct, anchors_pct_global_land: [0, 2.5, 7.5, 15], global_extent_context: s.geographic_scope },
    source_snapshot: { path: SALINITY_SNAPSHOT_PATH, version: salinitySnapshot.version, captured_at: salinitySnapshot.captured_at, source_locators: s.source_locators, excluded_from_scoring: salinitySnapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'fixed_global_salt_affected_area', formula: 'Normalize 1,381 million currently affected hectares through declared area anchors; exclude one billion hectares at risk.' },
    { type: 'source_reported_crop_loss_cost', formula: 'Normalize the FAO annual crop-production-loss estimate without adding population exposure or projected losses.' },
    { type: 'recurring_farmland_loss', formula: 'Normalize the source-reported annual farmland area taken out of production.' },
    { type: 'global_land_share_extent', formula: 'Normalize the mapped share of global land while retaining all-continent scope and spatial heterogeneity.' }
  ],
  source_ids: ['fao_global_soil_salinity_impact'],
  uncertainty: salinitySnapshot.uncertainty,
  freshness: `FAO global salt-affected-soils assessment ${s.assessment_year}; earlier annual cost and land-loss syntheses retained with caveats; snapshot captured ${salinitySnapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'FAO quantifies accumulated salt-affected area, crop-production cost, recurring annual farmland loss and global land extent under explicit boundaries.',
    higher_priority_failures: ['The assessment is not a source-consistent current global annual field-salinity panel with magnitude plus threshold or momentum.', 'The annual land-loss estimate is an assessment synthesis and is therefore retained as persistence evidence rather than relabeled current data.']
  }
});

function nutrientReceipt({ nodeId, burdenValue, burdenAnchors, burdenBoundary, humanValue, humanAnchors, humanBoundary, selectionReason }) {
  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(n.review_year),
    components: {
      biophysical_burden: round(normalizeWithAnchors(burdenValue, burdenAnchors, 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(humanValue, humanAnchors, 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(n.dead_zone_inventory_growth_period_years, [0, 10, 25, 50], 'higher_is_worse')),
      extent: n.global_extent_normalized
    },
    raw_inputs: {
      biophysical_burden: { value: burdenValue, anchors: burdenAnchors, boundary: burdenBoundary },
      human_economic_burden: { value: humanValue, anchors: humanAnchors, boundary: humanBoundary },
      persistence: { documented_dead_zones_1960: n.documented_dead_zones_1960, documented_dead_zones_2008: n.documented_dead_zones_2008, growth_period_years: n.dead_zone_inventory_growth_period_years, anchors_years: [0, 10, 25, 50], boundary: 'Duration of the documented global dead-zone inventory increase; not a continuous severity series.' },
      extent: { global_extent_normalized: n.global_extent_normalized, geographic_scope: n.geographic_scope, coastal_areas_impacted_lower_bound: n.coastal_areas_impacted_by_eutrophication_lower_bound, boundary: 'UNEP worldwide lower-bound inventory; no unmonitored area is classified.' },
      source_snapshot: { path: NUTRIENT_SNAPSHOT_PATH, version: nutrientSnapshot.version, captured_at: nutrientSnapshot.captured_at, source_locators: n.source_locators, excluded_from_scoring: nutrientSnapshot.excluded_from_scoring }
    },
    transformations: [
      { type: 'source_specific_global_burden', formula: 'Normalize only the node-matched UNEP mass, share or affected-system count through declared anchors.' },
      { type: 'bounded_human_economic_component', formula: 'Normalize the source-reported global nitrogen-resource cost or fisheries-system exposure without allocating it to a locality or treating exposure as realized loss.' },
      { type: 'documented_inventory_duration', formula: 'Normalize the 48-year interval over which UNEP reports the global dead-zone inventory rose from 10 to 405.' },
      { type: 'worldwide_lower_bound_extent', formula: 'Use the source-declared worldwide assessment scope; retain site counts as lower bounds and never convert them to area.' }
    ],
    source_ids: ['unep_global_nutrient_pollution_impact'],
    uncertainty: nutrientSnapshot.uncertainty,
    freshness: `UNEP global nutrient-management findings reviewed ${n.review_year}; underlying budgets and inventories have different assessment years; snapshot captured ${nutrientSnapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: selectionReason,
      higher_priority_failures: ['The existing USGS and EPA monitoring sources are regional and cannot establish a current global aggregation.', 'UNEP supplies global burden and inventory findings but not a 20-year complete annual or 60-month harmonized concentration panel, so the results are not labeled current data.']
    }
  });
}

const receipts = [
  salinityReceipt,
  nutrientReceipt({
    nodeId: 'nutrient_pollution',
    burdenValue: n.reactive_nitrogen_lost_to_environment_million_tonnes_per_year,
    burdenAnchors: [0, 50, 120, 200],
    burdenBoundary: 'All UNEP reactive-nitrogen losses to the environment, including leaching to soil, rivers and lakes; overlapping pathways are not added.',
    humanValue: n.annual_lost_nitrogen_resource_cost_usd_billion,
    humanAnchors: [0, 25, 100, 250],
    humanBoundary: 'Global annual lost-nitrogen resource cost; not a water-only damage estimate.',
    selectionReason: 'UNEP quantifies annual global reactive-nitrogen loss, the associated resource cost, multi-decade dead-zone accumulation and worldwide aquatic extent.'
  }),
  nutrientReceipt({
    nodeId: 'nitrogen_fertilizer_runoff',
    burdenValue: n.agricultural_nitrogen_washing_into_rivers_lower_bound_pct,
    burdenAnchors: [0, 10, 30, 60],
    burdenBoundary: 'Lower-bound share of nitrogen applied to farmland washing into rivers rather than being absorbed by crops.',
    humanValue: n.annual_lost_nitrogen_resource_cost_usd_billion,
    humanAnchors: [0, 25, 100, 250],
    humanBoundary: 'Global annual lost-nitrogen resource cost; no allocation to a crop, farm or watershed.',
    selectionReason: 'UNEP directly quantifies fertilizer nitrogen escaping to rivers, the global lost-resource cost, persistent downstream dead-zone accumulation and worldwide extent.'
  }),
  nutrientReceipt({
    nodeId: 'estuary_eutrophication',
    burdenValue: n.coastal_areas_impacted_by_eutrophication_lower_bound,
    burdenAnchors: [0, 50, 200, 500],
    burdenBoundary: 'Worldwide lower-bound count of coastal areas affected by nutrient-driven eutrophication; not area, volume or uniform condition.',
    humanValue: n.fisheries_dependent_on_estuarine_and_nearshore_habitat_pct,
    humanAnchors: [0, 25, 60, 100],
    humanBoundary: 'Share of world fisheries dependent on estuarine and near-shore habitats, used as economic-system exposure rather than realized attributable loss.',
    selectionReason: 'UNEP quantifies the worldwide eutrophication inventory, fisheries-system exposure, multi-decade accumulation of downstream dead zones and global extent.'
  }),
  nutrientReceipt({
    nodeId: 'anoxic_dead_zones',
    burdenValue: n.documented_dead_zones_2008,
    burdenAnchors: [0, 50, 200, 500],
    burdenBoundary: 'Documented global dead-zone count at the fixed 2008 inventory point; not area, volume or current unmonitored status.',
    humanValue: n.fisheries_dependent_on_estuarine_and_nearshore_habitat_pct,
    humanAnchors: [0, 25, 60, 100],
    humanBoundary: 'Share of world fisheries dependent on estuarine and near-shore habitats, retained as exposed economic-service scope and not realized loss.',
    selectionReason: 'UNEP quantifies a global dead-zone inventory, 48 years of documented accumulation, fisheries-system exposure and worldwide coastal extent.'
  })
];

for (const receipt of receipts) {
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${receipt.node_id}: ${verification.errors.join('; ')}`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_27_fao_soil_salinity_and_unep_nutrient_pollution',
  generated_at: new Date().toISOString(),
  source_snapshots: [SALINITY_SNAPSHOT_PATH, NUTRIENT_SNAPSHOT_PATH],
  source_ids: ['fao_global_soil_salinity_impact', 'unep_global_nutrient_pollution_impact'],
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-27.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-27.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components }))
}, null, 2));
