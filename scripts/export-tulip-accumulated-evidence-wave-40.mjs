import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-final-promotion-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = value => Number(value.toFixed(6));
const n = (value, anchors) => round(normalizeWithAnchors(value, anchors, 'higher_is_worse'));

function make(nodeId, asOf, components, rawInputs, sourceIds, boundary) {
  const receipt = buildTulipUrgencyReceipt({
    node_id: nodeId, method: 'impact_fallback', as_of: String(asOf), components,
    raw_inputs: { ...rawInputs, evidence_boundary: boundary, source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at } },
    transformations: [
      { type: 'documented_anchor_normalization', formula: 'Normalize the retained global burden against declared four-point anchors and clamp to [0,1].' },
      { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' },
      { type: 'boundary_preservation', formula: 'Retain approximate values and confidence intervals as reported; do not infer missing fuel splits, cases, local exposure or causal attribution.' }
    ],
    source_ids: sourceIds, uncertainty: `${snapshot.uncertainty} ${boundary}`,
    freshness: `Latest reviewed global assessment through ${asOf}.`,
    selection_reason: { selected_method_passed: 'A global quantitative observation or assessment supplies accumulated burden, human/economic relevance, persistence and extent.', higher_priority_failures: ['The current-data gate lacks a complete global history with magnitude plus threshold or recent momentum for this exact node.'] }
  });
  const check = verifyTulipUrgencyReceipt(receipt);
  if (!check.valid) throw new Error(`${nodeId}: ${check.errors.join('; ')}`);
  return receipt;
}

const a = snapshot.assessments;
const receipts = [
  make('antarctic_bottom_water_decline', a.antarctic_bottom_water.assessment_year,
    { biophysical_burden: n(a.antarctic_bottom_water.decline_since_1990s_pct, [0, 5, 20, 40]), human_economic_burden: n(a.antarctic_bottom_water.salty_oxygen_rich_water_sinking_trillion_tonnes_per_year, [0, 50, 150, 300]), persistence: n(a.antarctic_bottom_water.years_approx, [0, 10, 20, 40]), extent: 1 },
    a.antarctic_bottom_water, ['csiro_antarctic_bottom_water_observations_2023'], 'Observation-based circumpolar transport decline; the annual sinking-water mass is system scale, not a loss amount.'),
  make('phytoplankton_decline', a.phytoplankton.end_year,
    { biophysical_burden: n(a.phytoplankton.primary_production_decline_pct_per_decade, [0, 0.5, 1.5, 3]), human_economic_burden: n(a.phytoplankton.annual_primary_production_decline_pgc, [0, 0.1, 0.5, 1]), persistence: n(a.phytoplankton.end_year - a.phytoplankton.start_year + 1, [0, 5, 12, 20]), extent: 1 },
    a.phytoplankton, ['nasa_global_ocean_primary_production_1998_2015'], 'Global assimilated ocean-colour model result; chlorophyll processing sensitivity and regional compensating changes remain explicit.'),
  make('marine_pathogen_range_expansion', a.vibrio.observation_year,
    { biophysical_burden: n(a.vibrio.suitable_coastline_km, [0, 10000, 50000, 100000]), human_economic_burden: n(a.vibrio.increase_from_previous_record_pct, [0, 0.5, 2, 4]), persistence: n(a.vibrio.observation_year - a.vibrio.assessed_history_start_year + 1, [0, 10, 25, 50]), extent: 1 },
    a.vibrio, ['lancet_countdown_vibrio_indicator_2025'], 'Environmental suitability for pathogenic Vibrio is not a count of infections or proof of transmission on every suitable coast.'),
  make('tropospheric_ozone', a.tropospheric_ozone.observation_year,
    { biophysical_burden: n(a.tropospheric_ozone.attributable_deaths, [0, 25000, 125000, 300000]), human_economic_burden: n(a.tropospheric_ozone.dalys_million, [0, 0.5, 2, 5]), persistence: n(a.tropospheric_ozone.history_years, [0, 5, 15, 30]), extent: 1 },
    a.tropospheric_ozone, ['iarc_gbd_ambient_air_pollution_2015'], 'Comparative-risk burden for ozone-attributable COPD; it is not a direct global concentration series.'),
  make('diesel_freight_co2', a.road_freight.observation_year,
    { biophysical_burden: n(a.road_freight.truck_co2_gt_approx, [0, 0.5, 1.5, 3]), human_economic_burden: n(a.road_freight.truck_share_pct_approx, [0, 10, 25, 40]), persistence: n(9, [0, 3, 7, 15]), extent: 1 },
    a.road_freight, ['iea_breakthrough_agenda_road_transport_2025'], 'Truck CO2 is the source-reported about-one-third share of global road CO2; the node label is retained but the assessment does not split diesel from other non-electric fuels.'),
  make('fossil_hydrogen_co2', a.fossil_hydrogen.observation_year,
    { biophysical_burden: n(a.fossil_hydrogen.production_emissions_mt_co2e_approx, [0, 250, 750, 1500]), human_economic_burden: n(a.fossil_hydrogen.hydrogen_production_mt_approx, [0, 20, 60, 120]), persistence: n(a.fossil_hydrogen.stable_intensity_years, [0, 1, 3, 7]), extent: 1 },
    a.fossil_hydrogen, ['iea_breakthrough_agenda_hydrogen_2025'], 'IEA global production and lifecycle emissions; low-emissions hydrogen remains separately reported and is not counted as fossil.'),
  make('construction_material_co2', a.industry.observation_year,
    { biophysical_burden: n(a.industry.heavy_industry_direct_co2_gt, [0, 1, 4, 8]), human_economic_burden: n(a.industry.heavy_industry_share_pct, [0, 20, 50, 80]), persistence: n(a.industry.assessment_span_years, [0, 2, 5, 10]), extent: 1 },
    a.industry, ['iea_global_industry_transition_assessments'], 'Heavy-industry CO2 covers steel, cement and chemicals; it is a construction-material system burden rather than a project-level embodied-carbon inventory.'),
  make('cement_kiln_fuel_co2', a.industry.observation_year,
    { biophysical_burden: n(a.industry.cement_production_mt, [0, 1000, 3000, 5000]), human_economic_burden: n(100 - a.industry.cement_low_emissions_fuel_share_pct, [0, 25, 70, 100]), persistence: n(a.industry.assessment_span_years, [0, 2, 5, 10]), extent: 1 },
    a.industry, ['iea_global_industry_transition_assessments'], 'Production and low-emissions-fuel gap quantify kiln transition burden; process and fuel CO2 are not added or falsely separated.'),
  ...['coal_industrial_heat_co2', 'gas_industrial_heat_co2'].map(nodeId => make(nodeId, a.industry.observation_year,
    { biophysical_burden: n(a.industry.industrial_heat_nonrenewable_share_pct, [0, 25, 60, 100]), human_economic_burden: n(a.industry.heat_share_energy_related_co2_pct, [0, 10, 25, 45]), persistence: n(a.industry.assessment_span_years, [0, 2, 5, 10]), extent: 1 },
    a.industry, ['iea_global_industry_transition_assessments'], `Global non-renewable industrial-heat burden supports ${nodeId}; the source does not provide a coal-gas split, so neither receipt claims a fuel-specific mass.`))
];

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_40_global_final_promotion', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-40.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-40.json', promoted_node_count: receipts.length, receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
