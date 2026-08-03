import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const SNAPSHOT_PATH = 'public/global-cross-domain-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const coastal = JSON.parse(await fs.readFile(path.join(PUBLIC, 'wmo-unep-coastal-inundation-impact-snapshot.json'), 'utf8'));
const biodiversity = JSON.parse(await fs.readFile(path.join(PUBLIC, 'ipbes-biodiversity-invasive-impact-snapshot.json'), 'utf8'));
const topsoil = JSON.parse(await fs.readFile(path.join(PUBLIC, 'fao-global-topsoil-erosion-impact-snapshot.json'), 'utf8'));
const pollinators = JSON.parse(await fs.readFile(path.join(PUBLIC, 'pollinator-service-impact-snapshot.json'), 'utf8'));
const coral = JSON.parse(await fs.readFile(path.join(PUBLIC, 'coral-reef-watch-snapshot.json'), 'utf8'));
const litigation = JSON.parse(await fs.readFile(path.join(PUBLIC, 'sabin-climate-litigation-counts-snapshot.json'), 'utf8'));

const round = (value, digits = 6) => Number(value.toFixed(digits));
const n = (value, anchors) => round(normalizeWithAnchors(value, anchors, 'higher_is_worse'));
const sourcePaths = {
  cross: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at },
  coastal: { path: 'public/wmo-unep-coastal-inundation-impact-snapshot.json', version: coastal.version, captured_at: coastal.captured_at },
  biodiversity: { path: 'public/ipbes-biodiversity-invasive-impact-snapshot.json', version: biodiversity.version, captured_at: biodiversity.captured_at },
  topsoil: { path: 'public/fao-global-topsoil-erosion-impact-snapshot.json', version: topsoil.version, captured_at: topsoil.captured_at },
  pollinators: { path: 'public/pollinator-service-impact-snapshot.json', version: pollinators.version, captured_at: pollinators.captured_at },
  coral: { path: 'public/coral-reef-watch-snapshot.json', version: coral.version, captured_at: coral.updated_at },
  litigation: { path: 'public/sabin-climate-litigation-counts-snapshot.json', version: litigation.version, captured_at: litigation.updated_at }
};

function make({ nodeId, asOf, components, rawInputs, sourceIds, sourceKey, boundary }) {
  const receipt = buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(asOf),
    components,
    raw_inputs: { ...rawInputs, evidence_boundary: boundary, source_snapshot: sourcePaths[sourceKey] },
    transformations: [
      { type: 'documented_anchor_normalization', formula: 'Map each source-reported burden to declared reference, concerning, critical and extreme anchors; clamp to [0,1].' },
      { type: 'impact_composite', formula: '0.35 × accumulated biophysical burden + 0.30 × accumulated human/economic burden + 0.20 × persistence + 0.15 × global extent.' },
      { type: 'semantic_boundary', formula: 'Use the assessment only for the named pathway; do not infer unreported event counts, local impacts, attribution shares or current threshold exceedance.' }
    ],
    source_ids: sourceIds,
    uncertainty: `${snapshot.uncertainty} ${boundary}`,
    freshness: `Latest reviewed source observation or assessment through ${asOf}.`,
    selection_reason: {
      selected_method_passed: 'A global quantitative assessment supplies all four accumulated-impact components with an explicit node-pathway boundary.',
      higher_priority_failures: ['No globally harmonized current observation supplies magnitude plus threshold or momentum at the current-data coverage gate.']
    }
  });
  const check = verifyTulipUrgencyReceipt(receipt);
  if (!check.valid) throw new Error(`Receipt verification failed for ${nodeId}: ${check.errors.join('; ')}`);
  return receipt;
}

const receipts = [];
const addProfile = (nodeIds, profile) => nodeIds.forEach(nodeId => receipts.push(make({ ...profile, nodeId, boundary: `${profile.boundary} Node binding: ${nodeId}.` })));
const a = snapshot.assessments;

addProfile(['ai_data_centers'], {
  asOf: a.data_centres.observation_year,
  components: { biophysical_burden: n(a.data_centres.electricity_twh, [0, 75, 250, 600]), human_economic_burden: n(a.data_centres.indirect_power_emissions_mt_co2, [0, 25, 100, 250]), persistence: n(5, [0, 2, 5, 10]), extent: 1 },
  rawInputs: a.data_centres, sourceIds: ['iea_energy_and_ai'], sourceKey: 'cross',
  boundary: 'Electricity, indirect emissions and investment quantify the global data-centre system; they do not isolate individual AI workloads or projected 2030 demand.'
});
addProfile(['transformer_supply_bottleneck'], {
  asOf: a.transformers.assessment_year,
  components: { biophysical_burden: n(a.transformers.power_transformer_price_increase_pct_five_years, [0, 15, 50, 100]), human_economic_burden: n(a.transformers.required_2030_grid_investment_usd_billion - a.transformers.current_grid_investment_usd_billion, [0, 25, 100, 250]), persistence: n(a.transformers.procurement_lead_time_years, [0, 1, 2, 5]), extent: 1 },
  rawInputs: a.transformers, sourceIds: ['iea_electricity_2026_grids'], sourceKey: 'cross',
  boundary: 'Global price and procurement pressure quantifies transformer supply-chain burden; stalled queues also include non-transformer constraints.'
});
addProfile(['freight_electrification_gap', 'road_freight_diesel_lock_in'], {
  asOf: a.electric_trucks.observation_year,
  components: { biophysical_burden: n(a.electric_trucks.non_electric_sales_share_pct, [0, 25, 60, 100]), human_economic_burden: n(a.electric_trucks.purchase_price_multiple_midpoint, [1, 1.25, 2, 3]), persistence: n(5, [0, 1, 3, 7]), extent: 1 },
  rawInputs: a.electric_trucks, sourceIds: ['iea_global_ev_outlook_2026'], sourceKey: 'cross',
  boundary: 'The non-electric sales share measures the freight transition gap; it is not relabeled as a census of diesel vehicles already in service.'
});
addProfile(['passenger_road_fuel_co2'], {
  asOf: a.road_transport.observation_year,
  components: { biophysical_burden: n(a.road_transport.passenger_car_van_co2_lower_bound_gt, [0, 1, 2.5, 5]), human_economic_burden: n(a.road_transport.passenger_car_van_share_lower_bound_pct, [0, 20, 45, 70]), persistence: n(9, [0, 3, 7, 15]), extent: 1 },
  rawInputs: a.road_transport, sourceIds: ['iea_breakthrough_agenda_road_transport_2025'], sourceKey: 'cross',
  boundary: 'The passenger value is a conservative lower bound derived from the source-reported greater-than-60-percent share of road CO2; it does not split fuel types.'
});
addProfile(['plastics_petrochemicals'], {
  asOf: a.plastics.observation_year,
  components: { biophysical_burden: n(a.plastics.production_mt, [0, 100, 300, 600]), human_economic_burden: n(a.plastics.lifecycle_emissions_gt_co2e, [0, 0.25, 1, 2.5]), persistence: n(19, [0, 5, 12, 25]), extent: 1 },
  rawInputs: a.plastics, sourceIds: ['oecd_global_plastics_outlook'], sourceKey: 'cross',
  boundary: 'Lifecycle production, waste, leakage and emissions quantify the plastics-petrochemicals burden; no 2060 projection enters the score.'
});
addProfile(['subsea_cables', 'telecom_backbone'], {
  asOf: a.submarine_cables.observation_year,
  components: { biophysical_burden: n(a.submarine_cables.annual_repairs, [0, 25, 100, 250]), human_economic_burden: n(a.submarine_cables.international_data_exchange_share_pct, [0, 25, 70, 100]), persistence: n(a.submarine_cables.repair_frequency_per_week_approx, [0, 1, 2.5, 5]), extent: 1 },
  rawInputs: a.submarine_cables, sourceIds: ['itu_submarine_cable_resilience'], sourceKey: 'cross',
  boundary: 'Fault and traffic quantities cover the global submarine backbone; they do not identify individual landing-station chokepoints or outage duration.'
});
addProfile(['glacial_lake_failure_risk', 'glacier_hydrologic_system_floods'], {
  asOf: a.glacial_lake_outburst_floods.observation_year,
  components: { biophysical_burden: n(a.glacial_lake_outburst_floods.glacial_lake_basins, [0, 100, 500, 1200]), human_economic_burden: n(a.glacial_lake_outburst_floods.exposed_population_million, [0, 1, 7.5, 20]), persistence: n(30, [0, 10, 20, 40]), extent: 1 },
  rawInputs: a.glacial_lake_outburst_floods, sourceIds: ['global_glof_exposure_2023'], sourceKey: 'cross',
  boundary: 'The global assessment measures potential GLOF runout exposure and vulnerability, not a forecast that every exposed person will be affected.'
});
addProfile(['pesticide_bioaccumulation_chains', 'pesticide_spray_drift_zones', 'agrochemical_water_sinks'], {
  asOf: a.pesticides.assessment_year,
  components: { biophysical_burden: n(a.pesticides.pesticide_use_intensity_growth_since_1990_pct_lower_bound, [0, 10, 35, 75]), human_economic_burden: n(a.pesticides.unintentional_poisonings_million_per_year, [0, 25, 150, 400]), persistence: n(a.pesticides.assessment_year - 1990, [0, 10, 20, 40]), extent: 1 },
  rawInputs: a.pesticides, sourceIds: ['unep_pesticides_fertilizers_global_assessment'], sourceKey: 'cross',
  boundary: 'Global pesticide use and poisoning quantify accumulated chemical pressure; they do not resolve compound-specific drift, bioaccumulation or water-residue mass.'
});

const c = coastal.assessment;
addProfile(['littoral_surge_vulnerability', 'compound_coastal_flooding', 'coastal_erosion', 'coastal_saltwater_intrusion', 'delta_salt_intrusion_fronts', 'freshwater_lens_compression', 'coastal_aquifer_degradation'], {
  asOf: c.assessment_year,
  components: { biophysical_burden: n(c.sea_level_rate_increase_pct, [0, 20, 60, 110]), human_economic_burden: n(c.low_lying_coastal_population_exposed_million, [0, 100, 500, 1000]), persistence: n(c.assessment_period_years, [0, 10, 20, 40]), extent: 1 },
  rawInputs: c, sourceIds: [coastal.source.id], sourceKey: 'coastal',
  boundary: 'Observed sea-level acceleration and global low-lying-coast exposure quantify the shared coastal burden; pathway-specific local erosion, salinity, aquifer and compound-event measurements remain heterogeneous.'
});

const b = biodiversity.assessments.biodiversity_intactness;
addProfile(['species_range_compression', 'insect_biomass_decline', 'genetic_diversity_bottlenecks', 'trophic_cascade_collapses', 'marine_food_web_simplification'], {
  asOf: b.assessment_year,
  components: { biophysical_burden: n(b.native_species_average_abundance_decline_pct_lower_bound, [0, 5, 15, 30]), human_economic_burden: n(b.annual_global_crop_output_at_risk_from_pollinator_loss_2015_usd_billion_high, [0, 50, 250, 600]), persistence: n(b.persistence_years, [0, 25, 75, 125]), extent: 1 },
  rawInputs: b, sourceIds: [biodiversity.source.id], sourceKey: 'biodiversity',
  boundary: 'IPBES quantifies global abundance loss, altered land and ocean, extinction risk and service exposure; it does not isolate a taxon-specific biomass, range, gene, cascade or food-web trend.'
});

const s = topsoil.assessment;
addProfile(['soil_humus_decline', 'soil_microbial_depletion'], {
  asOf: s.statement_year,
  components: { biophysical_burden: n(s.global_arable_soil_lost_billion_tonnes_per_year, [0, 10, 40, 90]), human_economic_burden: n(s.global_agricultural_production_lost_usd_billion_per_year, [0, 50, 200, 500]), persistence: n(1, [0, 1, 10, 25]), extent: 1 },
  rawInputs: s, sourceIds: [topsoil.source.id], sourceKey: 'topsoil',
  boundary: 'Annual global topsoil loss quantifies the soil-system burden; it does not directly measure organic-carbon concentration or microbial community composition.'
});

const p = pollinators.assessment;
addProfile(['pollinator_colony_collapse'], {
  asOf: p.publication_year,
  components: { biophysical_burden: n(p.headline_crop_production_loss_pct.midpoint, [0, 1, 3, 6]), human_economic_burden: n(p.annual_excess_deaths.midpoint, [0, 50000, 200000, 500000]), persistence: n(p.burden_period_years, [0, 1, 10, 25]), extent: 1 },
  rawInputs: p, sourceIds: [pollinators.source.id], sourceKey: 'pollinators',
  boundary: 'The global pollination-deficit burden is evidence for pollinator-service failure; it does not identify managed-colony mortality as the sole cause.'
});

const cr = coral.current_global_bleaching_event;
addProfile(['reef_structural_collapse', 'coral_reef_fragmentation'], {
  asOf: cr.observation_end.slice(0, 4),
  components: { biophysical_burden: n(cr.reef_area_with_bleaching_level_heat_stress_pct, [0, 20, 60, 90]), human_economic_burden: n(cr.jurisdictions_with_documented_mass_bleaching_lower_bound, [0, 10, 40, 90]), persistence: n(3, [0, 1, 2, 5]), extent: 1 },
  rawInputs: cr, sourceIds: [coral.source.id], sourceKey: 'coral',
  boundary: 'Satellite heat-stress extent and documented mass bleaching quantify accumulated reef stress; they are not a direct census of structural collapse, fragmentation or colony mortality.'
});

const lr = litigation.records.at(-1);
addProfile(['climate_litigation_pressure'], {
  asOf: lr.observation_year,
  components: { biophysical_burden: n(lr.cumulative_climate_related_cases, [0, 500, 1800, 3500]), human_economic_burden: n(lr.national_jurisdictions_latest_point_only + lr.international_or_regional_bodies_latest_point_only, [0, 10, 40, 90]), persistence: n(lr.observation_year - litigation.records[0].observation_year, [0, 2, 5, 10]), extent: n(lr.national_jurisdictions_latest_point_only, [0, 10, 35, 70]) },
  rawInputs: { latest: lr, history: litigation.records.map(({ observation_year, cumulative_climate_related_cases }) => ({ observation_year, cumulative_climate_related_cases })) }, sourceIds: [litigation.source.id], sourceKey: 'litigation',
  boundary: 'Cumulative cases measure documented legal-system pressure within the Sabin database methodology, not merits, outcomes, damages or all disputes.'
});

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_39_cross_domain_global_assessments', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(PUBLIC, 'tulip-accumulated-evidence-wave-39.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-39.json', promoted_node_count: receipts.length, receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
