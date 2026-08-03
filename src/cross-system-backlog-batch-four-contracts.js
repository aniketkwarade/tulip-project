const SOURCES = Object.freeze({
  groundwater: ['https://www.usgs.gov/water-science-school/science/groundwater-decline-and-depletion', 'https://www.usgs.gov/mission-areas/water-resources/science/land-subsidence'],
  agriculture: ['https://www.epa.gov/nutrientpollution/sources-and-solutions-agriculture', 'https://www.epa.gov/ghgemissions/agriculture-sector-emissions'],
  soil: ['https://www.nrcs.usda.gov/conservation-basics/soil/soil-health', 'https://www.nrcs.usda.gov/state-offices/illinois/soil-tech-note-20a-so-how-do-we-mess-it-up'],
  sulfur: ['https://www.epa.gov/acidrain/what-acid-rain', 'https://www.epa.gov/so2-pollution/sulfur-dioxide-basics'],
  humanitarian: ['https://www.wfp.org/news/wfp-requires-us169-billion-2025-respond-unrelenting-humanitarian-needs', 'https://www.wfp.org/publications/food-security-impact-reduction-wfp-funding'],
  surface_water: ['https://www.wri.org/aqueduct', 'https://www.usgs.gov/water-science-school/water-cycle'],
  urban_water: ['https://www.epa.gov/natural-disasters/drought', 'https://www.usgs.gov/mission-areas/water-resources/science/public-supply-water-use'],
  smoke: ['https://www.epa.gov/wildfires/wildland-fires-and-public-health-effects', 'https://stacks.cdc.gov/view/cdc/104082/cdc_104082_DS1.pdf']
});

function edge({ source, target, category, mechanism, verb = 'contributes to', level = 'indirect', influence = 0.44 }) {
  const urls = SOURCES[category];
  const dossier = {
    promotion_status: 'promoted', source, target, mechanism,
    geographic_scope: 'Apply only within the named basin, airshed, production system, or humanitarian response context.',
    temporal_scope: 'Observed or assessed over the source reporting interval.',
    moderators: ['local baseline and capacity', 'management practices', 'exposure duration', 'hydrology or atmospheric transport'],
    alternative_explanations: ['other sectoral pressures', 'natural variability', 'governance and infrastructure', 'measurement uncertainty'],
    confidence: level === 'direct' ? 'high' : 'medium',
    counterevidence: 'The mechanism does not establish a universal local magnitude or single-cause attribution.',
    indicator: {
      metric_id: `backlog_batch_four_${source}_${target}`, metric_name: 'Bounded mechanism observation',
      unit: 'source-defined measurement with named boundary and interval', geography: 'named basin, airshed, operation, or response context',
      cadence: 'source update or event-based', source_id: category,
      transformation: 'Preserve source units, boundary, sign, and uncertainty.', uncertainty: 'Local conditions and management can change magnitude.',
      threshold_provenance: 'Use source-defined thresholds only.', failure_behavior: 'Keep research-track when the bounded observation is absent.'
    },
    source_locators: urls.map((url, index) => ({ url, locator: index ? 'Independent authoritative corroboration.' : 'Primary authoritative mechanism statement.', source_type: index ? 'independent_authoritative' : 'authoritative_mechanism' })),
    evidence_basis: level
  };
  return { source, target, verb, adverb: 'within the documented system boundary', influence, topology_rule: 'cross_system_backlog_rehabilitation_batch_four', evidence: { source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference', relationship_level: level, relationship_type: 'bounded_cross_system_pathway', confidence: dossier.confidence, source_urls: urls, relationship_source_urls: urls, mechanism, geographic_scope: dossier.geographic_scope, temporal_scope: dossier.temporal_scope, notes: 'Fourth cross-system backlog rehabilitation batch.', dossier } };
}

const groundwaterDrivers = ['agricultural_groundwater_withdrawal', 'industrial_groundwater_withdrawal', 'municipal_groundwater_withdrawal'];
const groundwaterEdges = groundwaterDrivers.flatMap(source => [
  edge({ source, target: 'water_stress', category: 'groundwater', mechanism: 'Sustained pumping can lower aquifer levels and reduce available supply where withdrawals exceed recharge.' }),
  edge({ source, target: 'freshwater_ecosystem_collapse', category: 'groundwater', mechanism: 'Pumping can intercept groundwater discharge to streams, lakes, and wetlands, reducing baseflow and riparian habitat where hydraulic connection exists.' })
]);

export const CROSS_SYSTEM_BACKLOG_BATCH_FOUR_RELATIONSHIPS = Object.freeze([
  ...groundwaterEdges,
  edge({ source: 'coastal_groundwater_withdrawal', target: 'water_stress', category: 'groundwater', mechanism: 'Pumping lowers freshwater heads and usable coastal aquifer storage where withdrawals outpace recharge.' }),
  edge({ source: 'coastal_groundwater_withdrawal', target: 'freshwater_ecosystem_collapse', category: 'groundwater', mechanism: 'Reduced groundwater discharge can diminish connected wetlands, streams, and coastal freshwater habitats.' }),
  edge({ source: 'agricultural_nitrogen_application', target: 'nutrient_pollution', category: 'agriculture', level: 'direct', verb: 'adds to', mechanism: 'Nitrogen not taken up by crops can run off or leach into surface water and groundwater.' }),
  edge({ source: 'agricultural_nitrogen_application', target: 'anoxic_dead_zones', category: 'agriculture', mechanism: 'Excess nutrients transported downstream can stimulate algal production and oxygen depletion in susceptible receiving waters.' }),
  edge({ source: 'industry_farming', target: 'agricultural_nitrogen_application', category: 'agriculture', mechanism: 'Input-intensive crop production can increase fertilizer application, while crop choice, precision management, and soil fertility determine actual rates.' }),
  edge({ source: 'agricultural_soil_compaction', target: 'topsoil_erosion_acceleration', category: 'soil', mechanism: 'Compaction reduces infiltration and root growth, increasing runoff and erosion where rainfall and slope are sufficient.' }),
  edge({ source: 'agricultural_soil_compaction', target: 'crop_yield_volatility', category: 'soil', mechanism: 'Restricted rooting, aeration, and water movement can increase sensitivity of yields to wet and dry extremes.' }),
  edge({ source: 'industry_farming', target: 'anaerobic_manure_lagoon_operation', category: 'agriculture', mechanism: 'Concentrated livestock systems may use liquid manure storage, but system design and regional regulation determine whether lagoons are present.' }),
  edge({ source: 'anaerobic_manure_lagoon_operation', target: 'methane', category: 'agriculture', level: 'direct', verb: 'releases', mechanism: 'Anaerobic decomposition of liquid manure produces methane unless gas is captured and destroyed or used.' }),
  edge({ source: 'anaerobic_manure_lagoon_operation', target: 'nutrient_pollution', category: 'agriculture', mechanism: 'Leaks, overflows, or poorly timed land application can move nitrogen and phosphorus into surface water or groundwater.' }),
  edge({ source: 'industry_farming', target: 'cattle_stocking_density', category: 'agriculture', mechanism: 'Concentrated livestock production can raise animal density within a managed area, subject to land availability and husbandry system.' }),
  edge({ source: 'cattle_stocking_density', target: 'methane', category: 'agriculture', mechanism: 'More ruminants generally increase total enteric methane within the herd boundary, while diet and productivity alter emissions per animal and per unit product.' }),
  edge({ source: 'coal_power_sulfur_emissions', target: 'air_pollution_health_burden', category: 'sulfur', mechanism: 'Sulfur dioxide and secondary sulfate particles increase respiratory and cardiovascular exposure downwind of uncontrolled or partly controlled sources.' }),
  edge({ source: 'coal_power_sulfur_emissions', target: 'aerosol_cooling_loss', category: 'sulfur', level: 'direct', verb: 'temporarily offsets', influence: -0.27, mechanism: 'Sulfate aerosol formed from emitted sulfur scatters sunlight and provides a short-lived cooling influence, while causing severe air-quality and deposition damage.' }),
  edge({ source: 'humanitarian_access_constraints', target: 'food_insecurity', category: 'humanitarian', mechanism: 'Blocked routes, insecurity, and administrative restrictions can prevent food assistance from reaching populations in crisis.' }),
  edge({ source: 'humanitarian_access_constraints', target: 'emergency_response_overload', category: 'humanitarian', mechanism: 'Restricted access delays delivery and concentrates unmet needs, increasing operational pressure on responders that can still reach affected areas.' }),
  edge({ source: 'humanitarian_response_funding_shortfall', target: 'food_insecurity', category: 'humanitarian', mechanism: 'Funding cuts can reduce food assistance coverage and ration size, allowing acute hunger to worsen among people who depend on aid.' }),
  edge({ source: 'humanitarian_response_funding_shortfall', target: 'emergency_response_overload', category: 'humanitarian', mechanism: 'Insufficient funding constrains staffing, supplies, transport, and service capacity while needs remain high.' }),
  edge({ source: 'food_insecurity', target: 'humanitarian_surge_demand', category: 'humanitarian', mechanism: 'Rising acute hunger increases the number of people requiring emergency food, nutrition, logistics, and protection support.' }),
  edge({ source: 'migration', target: 'humanitarian_surge_demand', category: 'humanitarian', mechanism: 'Large or rapid displacement can raise demand for shelter, food, health, water, and protection services in receiving and transit areas.' }),
  edge({ source: 'surface_water_evaporative_loss', target: 'water_stress', category: 'surface_water', mechanism: 'Evaporation removes stored water before use, worsening supply-demand imbalance in hot or arid basins.' }),
  edge({ source: 'surface_water_evaporative_loss', target: 'freshwater_ecosystem_collapse', category: 'surface_water', mechanism: 'Loss of stored water can reduce downstream flows and aquatic habitat where environmental releases are not maintained.' }),
  edge({ source: 'surface_water_inflow_deficit', target: 'water_stress', category: 'surface_water', mechanism: 'Sustained low inflow reduces renewable supply available to users and ecosystems.' }),
  edge({ source: 'drought_persistence', target: 'surface_water_inflow_deficit', category: 'surface_water', mechanism: 'Prolonged precipitation and runoff deficits reduce river and reservoir inflows, with snow storage and groundwater buffering moderating timing.' }),
  edge({ source: 'surface_water_withdrawal_pressure', target: 'water_stress', category: 'surface_water', mechanism: 'High withdrawals relative to renewable flow increase competition among users and ecosystems.' }),
  edge({ source: 'surface_water_withdrawal_pressure', target: 'freshwater_ecosystem_collapse', category: 'surface_water', mechanism: 'Withdrawals can reduce environmental flows and habitat connectivity where abstraction is large relative to streamflow.' }),
  edge({ source: 'surface_water_groundwater_exchange_shift', target: 'groundwater_depletion', category: 'surface_water', mechanism: 'Changed hydraulic gradients can draw surface water into depleted aquifers or reduce groundwater discharge, redistributing storage across the connected system.' }),
  edge({ source: 'surface_water_groundwater_exchange_shift', target: 'freshwater_ecosystem_collapse', category: 'surface_water', mechanism: 'Altered exchange can change baseflow, temperature, and wetland support in hydraulically connected ecosystems.' }),
  edge({ source: 'urban_distribution_water_loss', target: 'water_stress', category: 'urban_water', mechanism: 'Leakage increases gross withdrawals needed to deliver the same useful volume, worsening stress where supply is constrained.' }),
  edge({ source: 'urban_distribution_water_loss', target: 'groundwater_depletion', category: 'urban_water', mechanism: 'Utilities supplied by aquifers may pump additional water to offset network losses, accelerating depletion where recharge is insufficient.' }),
  edge({ source: 'urban_hydrologic_supply_shortfall', target: 'water_stress', category: 'urban_water', mechanism: 'A persistent gap between reliable source yield and demand is a direct expression of urban water stress.' }),
  edge({ source: 'drought_persistence', target: 'urban_hydrologic_supply_shortfall', category: 'urban_water', mechanism: 'Extended drought can reduce reservoir inflow, river yield, and groundwater recharge available to urban systems.' }),
  edge({ source: 'urban_source_water_treatment_constraint', target: 'waterborne_pathogen_outbreaks', category: 'urban_water', mechanism: 'Treatment capacity or process failure can allow unsafe water exposure when source contamination exceeds system controls.' }),
  edge({ source: 'urban_source_water_treatment_constraint', target: 'critical_infrastructure_fragility', category: 'urban_water', mechanism: 'Insufficient treatment capacity creates a shared failure point for drinking water, health care, emergency response, and other dependent services.' }),
  edge({ source: 'urban_water_demand_peak', target: 'water_stress', category: 'urban_water', mechanism: 'Short-duration demand spikes can exceed treatment, pumping, storage, or source capacity even when annual supply appears adequate.' }),
  edge({ source: 'urbanization', target: 'urban_water_demand_peak', category: 'urban_water', mechanism: 'Population and built-area growth can increase simultaneous municipal demand, moderated by efficiency, pricing, climate, and network design.' }),
  edge({ source: 'wildfire_regime_shift', target: 'wildfire_smoke_pm25_exposure', category: 'smoke', mechanism: 'More frequent or severe smoke-producing fires increase the opportunity for population exposure to fine particles, depending on transport and behavior.' }),
  edge({ source: 'wildfire_smoke_pm25_exposure', target: 'air_pollution_health_burden', category: 'smoke', level: 'direct', verb: 'adds to', mechanism: 'Measured fine-particle exposure from smoke contributes to respiratory and cardiovascular illness within the exposed population and interval.' }),
  edge({ source: 'wildfire_regime_shift', target: 'wildfire_smoke_exposure_duration', category: 'smoke', mechanism: 'Longer fire seasons and repeated smoke events can extend exposure duration where plumes reach populated areas.' }),
  edge({ source: 'wildfire_smoke_exposure_duration', target: 'air_pollution_health_burden', category: 'smoke', mechanism: 'Longer exposure increases cumulative inhaled dose and the chance of adverse health effects, especially among susceptible groups.' })
]);
