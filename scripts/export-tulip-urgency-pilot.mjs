import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NODES } from '../src/data.js';
import {
  TULIP_URGENCY_WEIGHTS,
  buildTulipUrgencyReceipt,
  calculateComposite,
  compositeToTulipScore,
  getTulipUrgencyBand,
  normalizeWithAnchors,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';
import { buildPowerHeatCurrentReceipts } from './lib/power-heat-urgency-receipts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const PILOT_IDS = [
  'temp', 'methane', 'deforestation', 'industry_farming', 'food', 'urbanization',
  'fast_fashion', 'migration', 'resource_depletion', 'carbon_emission',
  'personal_conveyance', 'environ_anomalies'
];

async function readJson(filename) {
  return JSON.parse(await fs.readFile(path.join(PUBLIC, filename), 'utf8'));
}

function indicator(id, value, unit, source_id, anchors, direction = 'higher_is_worse', note = null) {
  if (!Number.isFinite(value)) throw new TypeError(`${id} is missing a quantitative value`);
  return {
    raw: { id, value, unit, source_id, ...(note ? { note } : {}) },
    normalized: normalizeWithAnchors(value, anchors, direction),
    transformation: { indicator_id: id, type: 'documented_anchor_interpolation', anchors, direction }
  };
}

function assemble(method, entries) {
  return {
    components: Object.fromEntries(Object.entries(entries).map(([key, entry]) => [key, Number(entry.normalized.toFixed(6))])),
    raw_inputs: Object.fromEntries(Object.entries(entries).map(([key, entry]) => [key, entry.raw])),
    transformations: Object.values(entries).map(entry => entry.transformation),
    source_ids: [...new Set(Object.values(entries).map(entry => entry.raw.source_id))],
    method
  };
}

function latestWorldDrainedPeat(fao) {
  return fao.records
    .filter(record => record.metric_id === 'drained_peat_co2_flux' && record.area === 'World')
    .sort((a, b) => b.year - a.year)[0];
}

function latestPositiveDisplacement(displacement) {
  const totals = new Map();
  for (const record of displacement.records) {
    if (!Number.isFinite(record.new_displacement_movements) || record.new_displacement_movements <= 0) continue;
    totals.set(record.observation_year, (totals.get(record.observation_year) ?? 0) + record.new_displacement_movements);
  }
  return [...totals].sort((a, b) => b[0] - a[0])[0];
}

function globalUrbanization(ghsl) {
  return ghsl.records.reduce((totals, record) => ({
    expansion_ha_per_year: totals.expansion_ha_per_year + (record.built_up_surface_expansion_hectares_per_year ?? 0),
    urban_population_2020: totals.urban_population_2020 + (record.urban_population_2020 ?? 0),
    countries: totals.countries + 1,
    weighted_change_sum: totals.weighted_change_sum
      + (record.built_up_area_per_resident_annualized_change_pct ?? 0) * (record.urban_population_2020 ?? 0)
  }), { expansion_ha_per_year: 0, urban_population_2020: 0, countries: 0, weighted_change_sum: 0 });
}

function worldMaterialRecord(material, series) {
  return material.records.find(record => record.geo_area_name === 'World'
    && record.raw_material_code === 'ALP'
    && record.series === series);
}

function sourceDate(snapshot, fallback) {
  return String(snapshot.updated_at ?? snapshot.captured_at ?? fallback).slice(0, 10);
}

const [temperature, gml, fra, fao, ghsl, displacement, material, fastFashion, personalConveyance, powerHazards, heatHealth] = await Promise.all([
  readJson('temperature-benchmarks.json'),
  readJson('noaa-gml-benchmarks.json'),
  readJson('fra-snapshot.json'),
  readJson('faostat-agriculture-snapshot.json'),
  readJson('ghsl-country-urbanization-snapshot.json'),
  readJson('disaster-displacement-snapshot.json'),
  readJson('unsd-material-pressure-snapshot.json'),
  readJson('fast-fashion-impact-snapshot.json'),
  readJson('personal-conveyance-impact-snapshot.json'),
  readJson('power-heat-hazard-snapshot.json'),
  readJson('heat-health-snapshot.json')
]);

const tempAnnual = temperature.annual_synthesis.latest_complete_year;
const tempMonitoring = temperature.monitoring_context.find(item => item.source_id === 'copernicus_surface_air_temperature_june_2026');
const methane = gml.benchmarks.ch4;
const carbon = gml.benchmarks.co2;
const aggi = gml.benchmarks.aggi;
const fraMetric = fra.derived_metrics.fao_fra_forest_conversion_rate;
const farm = latestWorldDrainedPeat(fao);
const demand = fao.derived_metrics.apparent_agricultural_commodity_demand;
const totalDemand = demand.reduce((sum, item) => sum + item.latest_apparent_demand_tonnes, 0);
const meanDemandGrowth = demand.reduce((sum, item) => sum + item.change_since_start_pct, 0) / demand.length;
const urban = globalUrbanization(ghsl);
const weightedUrbanChange = urban.weighted_change_sum / urban.urban_population_2020;
const [displacementYear, latestDisplacement] = latestPositiveDisplacement(displacement);
const displacementByYear = new Map();
for (const record of displacement.records) {
  if (record.new_displacement_movements > 0) {
    displacementByYear.set(record.observation_year, (displacementByYear.get(record.observation_year) ?? 0) + record.new_displacement_movements);
  }
}
const cumulativeFiveYearDisplacement = [...displacementByYear]
  .filter(([year]) => year >= displacementYear - 4 && year <= displacementYear)
  .reduce((sum, [, value]) => sum + value, 0);
const positiveCountriesLatest = new Set(displacement.records
  .filter(record => record.observation_year === displacementYear && record.new_displacement_movements > 0)
  .map(record => record.country_code)).size;
const materialTotal = worldMaterialRecord(material, 'EN_MAT_DOMCMPT');
const materialPerCapita = worldMaterialRecord(material, 'EN_MAT_DOMCMPC');
const materialNonrenewable = ['FOF', 'MEO', 'NMM']
  .map(code => material.records.find(record => record.geo_area_name === 'World' && record.series === 'EN_MAT_DOMCMPT' && record.raw_material_code === code))
  .reduce((sum, record) => sum + record.value, 0);
const materialNonrenewableShare = materialNonrenewable / materialTotal.value * 100;
const fast = Object.fromEntries(fastFashion.indicators.map(item => [item.id, item]));
const conveyance = Object.fromEntries(personalConveyance.indicators.map(item => [item.id, item]));
const powerCurrentReceipts = new Map(buildPowerHeatCurrentReceipts(powerHazards, heatHealth)
  .map(receipt => [receipt.node_id, receipt]));

const currentContracts = {
  temp: assemble('current_data', {
    magnitude: indicator('global_temperature_anomaly_2025', tempAnnual.anomaly_c, '°C above 1850–1900', tempAnnual.source_id, [0.5, 1, 1.5, 2]),
    threshold: indicator('global_temperature_threshold_position_2025', tempAnnual.anomaly_c, '°C above 1850–1900', tempAnnual.source_id, [0.5, 1, 1.5, 2]),
    momentum: indicator('recent_temperature_anomaly_2026_06', tempMonitoring.anomaly_c_vs_1991_2020, '°C above 1991–2020', tempMonitoring.source_id, [0, 0.2, 0.5, 1]),
    extent: indicator('global_observation_coverage', 1, 'global coverage ratio', tempMonitoring.source_id, [0, 0.5, 0.9, 1])
  }),
  methane: assemble('current_data', {
    magnitude: indicator('global_atmospheric_methane_2026_03', methane.value, methane.unit, 'noaa_gml_global_ch4', [700, 1400, 1900, 2500]),
    threshold: indicator('global_atmospheric_methane_threshold_position', methane.value, methane.unit, 'noaa_gml_global_ch4', [700, 1400, 1900, 2500]),
    momentum: indicator('aggi_forcing_increase_since_1990', aggi.forcing_increase_since_1990_pct, 'percent', 'noaa_annual_greenhouse_gas_index', [0, 20, 50, 100], 'higher_is_worse', 'Accumulated greenhouse-forcing indicator fills the non-direct momentum component.'),
    extent: indicator('global_observation_coverage', 1, 'global coverage ratio', 'noaa_gml_global_ch4', [0, 0.5, 0.9, 1])
  }),
  carbon_emission: assemble('current_data', {
    magnitude: indicator('global_atmospheric_co2_2026_06', carbon.value, carbon.unit, 'noaa_gml_global_co2', [280, 350, 425, 560]),
    threshold: indicator('global_atmospheric_co2_threshold_position', carbon.value, carbon.unit, 'noaa_gml_global_co2', [280, 350, 425, 560]),
    momentum: indicator('aggi_forcing_increase_since_1990', aggi.forcing_increase_since_1990_pct, 'percent', 'noaa_annual_greenhouse_gas_index', [0, 20, 50, 100], 'higher_is_worse', 'Accumulated greenhouse-forcing indicator fills the non-direct momentum component.'),
    extent: indicator('global_observation_coverage', 1, 'global coverage ratio', 'noaa_gml_global_co2', [0, 0.5, 0.9, 1])
  })
};

const impactContracts = {
  deforestation: assemble('impact_fallback', {
    biophysical_burden: indicator('gross_deforestation_rate_2015_2025', fraMetric.latest_gross_deforestation_million_hectares_per_year, 'million hectares/year', 'fao_fra_2025', [0, 5, 10, 15]),
    human_economic_burden: indicator('net_forest_loss_rate_2015_2025', fraMetric.current_net_forest_loss_million_hectares_per_year, 'million hectares/year', 'fao_fra_2025', [0, 2, 4, 8]),
    persistence: indicator('gross_deforestation_share_of_forest_area_per_decade', fraMetric.latest_gross_deforestation_million_hectares_per_year * 10 / (fraMetric.source_reported_forest_area_billion_hectares * 1000) * 100, 'percent per decade', 'fao_fra_2025', [0, 1, 2.5, 5]),
    extent: indicator('global_assessment_coverage', 1, 'global coverage ratio', 'fao_fra_2025', [0, 0.5, 0.9, 1])
  }),
  industry_farming: assemble('impact_fallback', {
    biophysical_burden: indicator('drained_organic_soil_co2', farm.total_co2_emissions_kt / 1000, 'million tonnes CO2/year', 'faostat_agriculture_snapshot', [0, 250, 750, 1500]),
    human_economic_burden: indicator('major_commodity_apparent_demand', totalDemand / 1e9, 'billion tonnes/year', 'faostat_agriculture_snapshot', [0, 1, 3, 6]),
    persistence: indicator('agricultural_drained_organic_soil_area', farm.drained_organic_soil_area_ha / 1e6, 'million hectares', 'faostat_agriculture_snapshot', [0, 5, 20, 40]),
    extent: indicator('faostat_geography_coverage', 250, 'geographies represented', 'faostat_agriculture_snapshot', [0, 75, 180, 250])
  }),
  food: assemble('impact_fallback', {
    biophysical_burden: indicator('major_commodity_apparent_demand', totalDemand / 1e9, 'billion tonnes/year', 'faostat_agriculture_snapshot', [0, 1, 3, 6]),
    human_economic_burden: indicator('mean_demand_growth_since_2015', meanDemandGrowth, 'percent', 'faostat_agriculture_snapshot', [0, 5, 15, 30]),
    persistence: indicator('minimum_growth_across_major_commodity_groups', Math.min(...demand.map(item => item.change_since_start_pct)), 'percent since 2015', 'faostat_agriculture_snapshot', [0, 5, 10, 20], 'higher_is_worse', 'All three major commodity groups grew by at least this amount.'),
    extent: indicator('food_balance_geography_coverage', fao.derived_metrics.food_import_dependency_ratio.geographies, 'geographies', 'faostat_agriculture_snapshot', [0, 75, 180, 230])
  }),
  urbanization: assemble('impact_fallback', {
    biophysical_burden: indicator('global_built_surface_expansion', urban.expansion_ha_per_year / 1e6, 'million hectares/year', 'global_human_settlement_layer', [0, 0.25, 0.75, 1.5]),
    human_economic_burden: indicator('represented_urban_population_2020', urban.urban_population_2020 / 1e9, 'billion people', 'global_human_settlement_layer', [0, 1, 3, 5]),
    persistence: indicator('population_weighted_built_area_change', weightedUrbanChange, 'percent/year', 'global_human_settlement_layer', [0, 0.5, 1.5, 3]),
    extent: indicator('country_or_territory_coverage', urban.countries, 'countries or territories', 'global_human_settlement_layer', [0, 75, 180, 230])
  }),
  fast_fashion: assemble('impact_fallback', {
    biophysical_burden: indicator('annual_textile_waste', fast.annual_textile_waste.value, fast.annual_textile_waste.unit, fast.annual_textile_waste.source_id, [0, 30, 75, 150]),
    human_economic_burden: indicator('industry_ghg_share_midpoint', (fast.industry_ghg_share_range.value[0] + fast.industry_ghg_share_range.value[1]) / 2, fast.industry_ghg_share_range.unit, fast.industry_ghg_share_range.source_id, [0, 2, 5, 10]),
    persistence: indicator('virgin_or_non_recycled_fiber_share', 100 - fast.fiber_recycled_share_2023.value, 'percent', fast.fiber_recycled_share_2023.source_id, [0, 25, 75, 100]),
    extent: indicator('global_report_scope', 1, 'global coverage ratio', fast.annual_textile_waste.source_id, [0, 0.5, 0.9, 1])
  }),
  migration: assemble('impact_fallback', {
    biophysical_burden: indicator('five_year_disaster_displacement_movements', cumulativeFiveYearDisplacement / 1e6, 'million movements', 'idmc_world_bank_disaster_displacement', [0, 50, 125, 250]),
    human_economic_burden: indicator('latest_positive_global_disaster_displacement', latestDisplacement / 1e6, 'million movements/year', 'idmc_world_bank_disaster_displacement', [0, 10, 25, 50]),
    persistence: indicator('consecutive_positive_global_years', 5, 'years', 'idmc_world_bank_disaster_displacement', [0, 2, 5, 10]),
    extent: indicator('countries_with_disaster_displacement', positiveCountriesLatest, 'countries', 'idmc_world_bank_disaster_displacement', [0, 25, 75, 150])
  }),
  resource_depletion: assemble('impact_fallback', {
    biophysical_burden: indicator('global_domestic_material_consumption', materialTotal.value / 1e9, 'billion tonnes/year', 'unsd_sdg_api_unep_material_flows', [0, 50, 100, 150]),
    human_economic_burden: indicator('global_material_consumption_per_capita', materialPerCapita.value, 'tonnes/person/year', 'unsd_sdg_api_unep_material_flows', [0, 5, 10, 20]),
    persistence: indicator('nonrenewable_material_share', materialNonrenewableShare, 'percent of domestic material consumption', 'unsd_sdg_api_unep_material_flows', [0, 25, 60, 90]),
    extent: indicator('world_aggregate_coverage', 1, 'global coverage ratio', 'unsd_sdg_api_unep_material_flows', [0, 0.5, 0.9, 1])
  }),
  personal_conveyance: assemble('impact_fallback', {
    biophysical_burden: indicator('passenger_vehicle_co2_lower_bound', conveyance.road_transport_co2_2024.value * conveyance.passenger_car_and_van_share.value / 100, 'gigatonnes CO2/year', conveyance.road_transport_co2_2024.source_id, [0, 1, 3, 6]),
    human_economic_burden: indicator('passenger_vehicle_road_emissions_share', conveyance.passenger_car_and_van_share.value, 'percent', conveyance.passenger_car_and_van_share.source_id, [0, 25, 50, 75]),
    persistence: indicator('road_emissions_change_since_2015', conveyance.road_transport_emissions_change_since_2015.value, 'percent', conveyance.road_transport_emissions_change_since_2015.source_id, [-10, 0, 10, 20]),
    extent: indicator('global_report_scope', 1, 'global coverage ratio', conveyance.road_transport_co2_2024.source_id, [0, 0.5, 0.9, 1])
  })
};

const pilotNodes = Object.fromEntries(NODES.filter(node => PILOT_IDS.includes(node.id)).map(node => [node.id, node]));
const missingPilotNodes = PILOT_IDS.filter(id => !pilotNodes[id]);
if (missingPilotNodes.length) throw new Error(`Missing pilot nodes: ${missingPilotNodes.join(', ')}`);

const measuredPeerComposite = ['temp', 'methane', 'carbon_emission']
  .map(id => calculateComposite('current_data', currentContracts[id].components))
  .reduce((sum, value) => sum + value, 0) / 3;
const hazardLegacyComposite = (pilotNodes.environ_anomalies.score.baseline - 1) / 9;
const hazardContractFactors = (0.9 + 1 + 0.8) / 3;
const modeledHazard = 0.5 * hazardLegacyComposite + 0.3 * measuredPeerComposite + 0.2 * hazardContractFactors;

const methodMeta = {
  temp: { as_of: tempMonitoring.observed_at + '-30', uncertainty: 'Global products agree closely, but monthly and annual values use different reference periods.', freshness: 'monthly', selected_method_passed: 'Global current magnitude and threshold position provide 60% direct component coverage; recent anomaly and global extent complete the receipt.', higher_priority_failures: [] },
  methane: { as_of: `${methane.observed_month}-31`, uncertainty: 'Atmospheric concentration is a global urgency proxy and is not identical to the node’s emissions-flow metric.', freshness: 'monthly', selected_method_passed: 'Current global atmospheric magnitude and threshold position provide 60% direct component coverage.', higher_priority_failures: [] },
  carbon_emission: { as_of: `${carbon.observed_month}-30`, uncertainty: 'Atmospheric concentration integrates natural and anthropogenic fluxes; it is used as the global condition indicator for the emissions node.', freshness: 'monthly', selected_method_passed: 'Current global atmospheric magnitude and threshold position provide 60% direct component coverage.', higher_priority_failures: [] },
  deforestation: { as_of: sourceDate(fra, '2025-12-31'), uncertainty: fraMetric.uncertainty_status, freshness: 'five-year assessment cycle', selected_method_passed: 'FRA quantifies global accumulated forest conversion, net loss, persistence and extent.', higher_priority_failures: ['Period-average observations do not provide the 20 annual observations required for historical normalization.'] },
  industry_farming: { as_of: String(farm.year) + '-12-31', uncertainty: farm.measurement_boundary, freshness: 'annual report snapshot', selected_method_passed: 'FAOSTAT quantifies global land, emissions, demand and geographic burdens.', higher_priority_failures: ['Available component series are shorter than the 20-year current-data history gate.'] },
  food: { as_of: `${demand[0].end_year}-12-31`, uncertainty: 'Apparent demand is a mass-balance measure and does not directly measure nutrition, waste or affordability.', freshness: 'annual report snapshot', selected_method_passed: 'FAOSTAT provides quantitative accumulated demand, growth and coverage evidence.', higher_priority_failures: ['Nine annual observations do not meet the 20-observation historical normalization gate.'] },
  urbanization: { as_of: '2020-12-31', uncertainty: ghsl.caveats?.join(' ') || 'Country aggregates omit within-country distribution and settlement quality.', freshness: 'five-year release', selected_method_passed: 'GHSL supplies quantitative global built-area, population and extent burdens.', higher_priority_failures: ['Two measurement epochs do not meet the current-data history gate.'] },
  fast_fashion: { as_of: fastFashion.as_of, uncertainty: fastFashion.uncertainty, freshness: 'reviewed report snapshot', selected_method_passed: 'UNEP reports quantify accumulated waste, climate burden, recycling persistence and global scope.', higher_priority_failures: ['No defensible current global fast-fashion observation series is available.'] },
  migration: { as_of: `${displacementYear}-12-31`, uncertainty: 'Movement counts can include repeat displacement; zero-valued 2024–2025 API records are treated as missing rather than zero.', freshness: 'annual snapshot with stale latest usable year', selected_method_passed: 'IDMC-derived records quantify recent and cumulative disaster-displacement burden and geographic extent.', higher_priority_failures: ['The latest API years are incomplete zero records and therefore fail the current-observation gate.'] },
  resource_depletion: { as_of: `${materialTotal.observation_year}-12-31`, uncertainty: 'Domestic material consumption does not itself measure remaining reserves or circularity.', freshness: 'annual snapshot', selected_method_passed: 'UNSD/UNEP material-flow accounts quantify global total and per-capita accumulated burden.', higher_priority_failures: ['The operational snapshot contains one annual world observation, below the 20-observation gate.'] },
  personal_conveyance: { as_of: personalConveyance.as_of, uncertainty: personalConveyance.uncertainty, freshness: 'annual report snapshot', selected_method_passed: 'IEA reporting quantifies the global passenger-road accumulated emissions burden.', higher_priority_failures: ['No multi-component current global personal-conveyance series passes the coverage gate.'] },
  environ_anomalies: { as_of: sourceDate(powerHazards, '2025-12-31'), uncertainty: powerHazards.uncertainty, freshness: 'annual complete-year snapshot', selected_method_passed: 'The fixed 24-location, six-continent panel supplies 35 complete annual compound heat-and-heavy-precipitation observations for magnitude, historical threshold position, momentum and geographic extent.', higher_priority_failures: [] }
};

const receipts = [];
for (const id of PILOT_IDS) {
  const meta = methodMeta[id];
  const contract = currentContracts[id] ?? impactContracts[id];
  const directEvidenceReceipt = powerCurrentReceipts.get(id);
  const receipt = directEvidenceReceipt ?? (contract
    ? buildTulipUrgencyReceipt({
      node_id: id,
      method: contract.method,
      as_of: meta.as_of,
      components: contract.components,
      raw_inputs: contract.raw_inputs,
      transformations: contract.transformations,
      source_ids: contract.source_ids,
      uncertainty: meta.uncertainty,
      freshness: meta.freshness,
      selection_reason: {
        selected_method_passed: meta.selected_method_passed,
        higher_priority_failures: meta.higher_priority_failures
      }
    })
    : buildTulipUrgencyReceipt({
      node_id: id,
      method: 'modeled',
      model_version: 'tulip_modeled_pilot_v1',
      as_of: meta.as_of,
      components: { modeled_estimate: Number(modeledHazard.toFixed(6)) },
      raw_inputs: {
        legacy_reviewed_composite: { value: Number(hazardLegacyComposite.toFixed(6)), weight: 0.5 },
        measured_atmosphere_peer_mean: { value: Number(measuredPeerComposite.toFixed(6)), weight: 0.3, peer_node_ids: ['temp', 'methane', 'carbon_emission'] },
        reviewed_contract_factor_mean: { value: Number(hazardContractFactors.toFixed(6)), weight: 0.2, factors: ['persistence', 'global_reach', 'causal_role'] }
      },
      transformations: [{ type: 'weighted_modeled_estimate', formula: '0.50 × legacy reviewed composite + 0.30 × measured atmosphere peer mean + 0.20 × reviewed contract-factor mean' }],
      source_ids: ['reviewed_legacy_vector_registry', 'tulip_urgency_v2_pilot_peers', 'reviewed_node_contracts'],
      uncertainty: meta.uncertainty,
      freshness: meta.freshness,
      selection_reason: {
        selected_method_passed: meta.selected_method_passed,
        higher_priority_failures: meta.higher_priority_failures
      }
    }));
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${id}`);
  receipts.push(receipt);
}

function perturbedScores(receipt) {
  if (receipt.method === 'modeled') return { minimum: receipt.value, maximum: receipt.value, max_delta: 0, rank_unstable: false, note: 'Modeled component weights are fixed by the named model version.' };
  const baseWeights = TULIP_URGENCY_WEIGHTS[receipt.method];
  const scores = [];
  for (const selected of Object.keys(baseWeights)) {
    for (const multiplier of [0.8, 1.2]) {
      const changed = { ...baseWeights, [selected]: baseWeights[selected] * multiplier };
      const total = Object.values(changed).reduce((sum, value) => sum + value, 0);
      const normalized = Object.fromEntries(Object.entries(changed).map(([key, value]) => [key, value / total]));
      scores.push(compositeToTulipScore(calculateComposite(receipt.method, receipt.components, normalized)));
    }
  }
  return {
    minimum: Math.min(...scores),
    maximum: Math.max(...scores),
    max_delta: Number(Math.max(...scores.map(score => Math.abs(score - receipt.value))).toFixed(1)),
    rank_unstable: false
  };
}

const legacyRanks = [...PILOT_IDS].sort((a, b) => pilotNodes[b].score.baseline - pilotNodes[a].score.baseline);
const v2Ranks = [...receipts].sort((a, b) => b.value - a.value).map(receipt => receipt.node_id);
const comparison = receipts.map(receipt => {
  const legacy = pilotNodes[receipt.node_id].score.baseline;
  return {
    node_id: receipt.node_id,
    node_name: pilotNodes[receipt.node_id].name,
    legacy_score: legacy,
    legacy_band: getTulipUrgencyBand(legacy),
    v2_score: receipt.value,
    v2_band: receipt.band,
    score_delta: Number((receipt.value - legacy).toFixed(1)),
    legacy_rank: legacyRanks.indexOf(receipt.node_id) + 1,
    v2_rank: v2Ranks.indexOf(receipt.node_id) + 1,
    rank_change: legacyRanks.indexOf(receipt.node_id) - v2Ranks.indexOf(receipt.node_id),
    band_change: getTulipUrgencyBand(legacy) === receipt.band ? 'unchanged' : `${getTulipUrgencyBand(legacy)} → ${receipt.band}`,
    method: receipt.method,
    sensitivity: perturbedScores(receipt)
  };
});

for (const row of comparison) {
  const competing = comparison.some(other => other.node_id !== row.node_id
    && other.v2_score >= row.sensitivity.minimum
    && other.v2_score <= row.sensitivity.maximum);
  row.sensitivity.rank_unstable = competing;
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  status: 'shadow_review',
  generated_at: new Date().toISOString(),
  production_scores_replaced: false,
  pilot_node_ids: PILOT_IDS,
  receipts
};
const report = {
  version: '1.0.0',
  method_version: registry.method_version,
  status: registry.status,
  generated_at: registry.generated_at,
  summary: {
    pilot_nodes: receipts.length,
    current_data: receipts.filter(receipt => receipt.method === 'current_data').length,
    impact_fallback: receipts.filter(receipt => receipt.method === 'impact_fallback').length,
    modeled: receipts.filter(receipt => receipt.method === 'modeled').length,
    production_scores_replaced: false
  },
  comparison
};

const markdownRows = [...comparison]
  .sort((a, b) => a.v2_rank - b.v2_rank)
  .map(row => `| ${row.v2_rank} | ${row.node_name} | ${row.legacy_score.toFixed(1)} | ${row.v2_score.toFixed(1)} | ${row.score_delta > 0 ? '+' : ''}${row.score_delta.toFixed(1)} | ${row.band_change} | ${row.rank_change > 0 ? '+' : ''}${row.rank_change} | \`${row.method}\` |`)
  .join('\n');
const markdown = `# TULIP Urgency v2 — Original 12-Node Pilot\n\nStatus: **shadow review**. Production scores have not been replaced.\n\n| V2 rank | Node | Legacy | V2 | Delta | Band change | Rank change | Method |\n|---:|---|---:|---:|---:|---|---:|---|\n${markdownRows}\n\n## Method coverage\n\n- Current data: ${report.summary.current_data}\n- Accumulated-impact fallback: ${report.summary.impact_fallback}\n- Modeled: ${report.summary.modeled}\n\nEvery receipt is reproducible from its normalized components and input hash. Full receipts remain application metadata and are not presented in the node inspector.\n`;

await Promise.all([
  fs.writeFile(path.join(PUBLIC, 'tulip-urgency-pilot-scores.json'), `${JSON.stringify(registry, null, 2)}\n`),
  fs.writeFile(path.join(PUBLIC, 'tulip-urgency-pilot-comparison.json'), `${JSON.stringify(report, null, 2)}\n`),
  fs.mkdir(path.join(ROOT, 'docs'), { recursive: true }).then(() => fs.writeFile(path.join(ROOT, 'docs', 'tulip-urgency-v2-pilot-report.md'), markdown))
]);

console.log(`Exported ${receipts.length} verified TULIP urgency v2 shadow receipts.`);
console.log(`Methods: ${report.summary.current_data} current, ${report.summary.impact_fallback} impact fallback, ${report.summary.modeled} modeled.`);
