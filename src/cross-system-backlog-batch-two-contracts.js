const SOURCES = Object.freeze({
  tundra: ['https://www.usgs.gov/publications/plant-traits-poorly-predict-winner-and-loser-shrub-species-a-warming-tundra-biome', 'https://pubs.usgs.gov/fs/2013/3054/pdf/fs20133054.pdf'],
  plastics: ['https://www.unep.org/plastic-pollution', 'https://www.unep.org/news-and-stories/story/environmental-costs-fast-fashion'],
  ozone: ['https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics', 'https://www.epa.gov/ground-level-ozone-pollution/ecosystem-effects-ozone-pollution'],
  pollinators: ['https://www.epa.gov/pollinator-protection/pollinator-health-concerns', 'https://www.usgs.gov/publications/recent-and-future-declines-a-historically-widespread-pollinator-linked-climate-land'],
  water_storage: ['https://www.wri.org/aqueduct', 'https://www.fao.org/aquastat/'],
  permafrost: ['https://nsidc.org/learn/ask-scientist/does-permafrost-thaw-contribute-global-warming', 'https://www.usgs.gov/news/national-news-release/usgs-projects-large-loss-alaska-permafrost-2100'],
  urban_water: ['https://www.epa.gov/natural-disasters/drought', 'https://www.usgs.gov/mission-areas/water-resources/science/public-supply-water-use'],
  wildfire_health: ['https://www.epa.gov/wildfires/wildland-fires-and-public-health-effects', 'https://stacks.cdc.gov/view/cdc/104082/cdc_104082_DS1.pdf'],
  acid_rain: ['https://www.epa.gov/acidrain/effects-acid-rain', 'https://www.epa.gov/acidrain/what-acid-rain'],
  oil_spill: ['https://oceanservice.noaa.gov/education/tutorial-coastal/oil-spills/os04.html', 'https://www.gulfspillrestoration.noaa.gov/affected-gulf-resources'],
  diesel: ['https://www.epa.gov/diesel-fuel-standards/about-diesel-fuels', 'https://www.epa.gov/dera/learn-about-impacts-diesel-exhaust-and-diesel-emissions-reduction-act'],
  semiconductor: ['https://www.nist.gov/system/files/documents/2024/06/28/Final%20PEA%20for%20Modernization%20and%20Expansion%20of%20Semiconductor%20Fabs%206-28-2024%20-%20OGC-508C.pdf', 'https://www.epa.gov/eps-partnership/semiconductor-industry'],
  steel: ['https://www.iea.org/reports/demand-and-supply-measures-for-the-steel-and-cement-transition/executive-summary', 'https://www.iea.org/reports/iron-and-steel-technology-roadmap'],
  grazing: ['https://www.nrcs.usda.gov/sites/default/files/2022-12/Rangeland_Soil_Quality_Compaction_0.pdf', 'https://www.ars.usda.gov/research/publications/publication/?seqNo115=126586'],
  data_center: ['https://www.energy.gov/cmei/femp/cooling-water-efficiency-opportunities-federal-data-centers', 'https://www.energy.gov/oe/clean-energy-resources-meet-data-center-electricity-demand'],
  data_center_emissions: ['https://www.iea.org/reports/energy-and-ai/ai-and-climate-change', 'https://energyanalysis.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report'],
  aviation: ['https://www.iea.org/energy-system/transport/aviation', 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/'],
  digital: ['https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience/resilience-services/infrastructure-dependency-primer/learn/communications', 'https://www.oecd.org/en/publications/enhancing-the-resilience-of-communication-networks_77fc57c6-en.html']
});

function relationship({ source, target, category, mechanism, verb = 'contributes to', level = 'indirect', influence = 0.45 }) {
  const urls = SOURCES[category];
  const dossier = {
    promotion_status: 'promoted', source, target, mechanism,
    geographic_scope: 'Use only within the geography, system boundary, and exposure conditions stated by the cited evidence.',
    temporal_scope: 'Observed or assessed over the source reporting interval; no instantaneous universal response is implied.',
    moderators: ['local baseline conditions', 'management and adaptation', 'exposure and system design', 'measurement uncertainty'],
    alternative_explanations: ['other environmental pressures', 'natural variability', 'local operations and governance', 'unmeasured confounders'],
    confidence: level === 'direct' ? 'high' : 'medium',
    counterevidence: 'Magnitude, timing, and even sign may differ where the stated mechanism or exposure conditions are absent.',
    indicator: {
      metric_id: `backlog_batch_two_${source}_${target}`,
      metric_name: 'Bounded relationship observation',
      unit: 'source-defined value with named geography, boundary, and interval',
      geography: 'named geography or infrastructure system',
      cadence: 'reviewed when either authoritative source changes',
      source_id: category,
      transformation: 'Preserve source definitions and do not infer local magnitude from a global assessment.',
      uncertainty: 'Assessment confidence and stated moderators apply.',
      threshold_provenance: 'No universal threshold; use the cited source definition.',
      failure_behavior: 'Keep research-track if the bounded mechanism cannot be observed or sourced.'
    },
    source_locators: urls.map((url, index) => ({
      url,
      locator: index === 0 ? 'Primary authoritative mechanism statement.' : 'Independent authoritative corroboration and boundary conditions.',
      source_type: index === 0 ? 'authoritative_mechanism' : 'independent_authoritative'
    })),
    evidence_basis: level
  };
  return {
    source, target, verb,
    adverb: level === 'direct' ? 'through the documented direct mechanism' : 'under the documented conditions and moderators',
    influence,
    topology_rule: 'cross_system_backlog_rehabilitation_batch_two',
    evidence: {
      source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference',
      relationship_level: level, relationship_type: 'bounded_cross_system_pathway',
      confidence: dossier.confidence, source_urls: urls, relationship_source_urls: urls,
      mechanism, geographic_scope: dossier.geographic_scope, temporal_scope: dossier.temporal_scope,
      notes: 'Second cross-system backlog rehabilitation batch; local attribution is not implied.', dossier
    }
  };
}

export const CROSS_SYSTEM_BACKLOG_BATCH_TWO_RELATIONSHIPS = Object.freeze([
  relationship({ source: 'temp', target: 'tundra_shrubification_speeds', category: 'tundra', mechanism: 'Arctic warming can lengthen growing conditions and favor expansion of some shrub species, although species traits, moisture, snow, herbivory, and disturbance shape the local response.' }),
  relationship({ source: 'permafrost_thaw', target: 'tundra_shrubification_speeds', category: 'tundra', mechanism: 'Ground thaw changes drainage, nutrients, and disturbance patterns that can facilitate shrub expansion in some tundra landscapes.' }),
  relationship({ source: 'wildfire_regime_shift', target: 'tundra_shrubification_speeds', category: 'tundra', mechanism: 'Tundra fire can alter vegetation, soil temperature, and permafrost conditions, changing the competitive environment for shrub establishment.' }),
  relationship({ source: 'plastics_petrochemicals', target: 'resource_depletion', category: 'plastics', mechanism: 'Virgin polymer production consumes fossil feedstocks, energy, water, and other materials; circularity and recycled content can reduce the burden.' }),
  relationship({ source: 'plastics_petrochemicals', target: 'marine_food_web_simplification', category: 'plastics', mechanism: 'Plastic leakage and associated chemicals can expose marine organisms across habitats and trophic levels, with effects governed by particle type, dose, and co-stressors.' }),
  relationship({ source: 'ozone_formation_pressure', target: 'air_pollution_health_burden', category: 'ozone', mechanism: 'Conditions that favor surface ozone formation increase the likelihood of harmful respiratory exposure where precursor emissions and exposed populations coincide.' }),
  relationship({ source: 'ozone_formation_pressure', target: 'crop_yield_volatility', category: 'ozone', mechanism: 'Elevated surface ozone can reduce photosynthesis and plant growth, increasing yield risk for sensitive crops under sufficient exposure.' }),
  relationship({ source: 'industry_farming', target: 'pollinator_colony_collapse', category: 'pollinators', mechanism: 'Pesticide exposure, habitat simplification, and reduced floral diversity can contribute to colony losses, alongside pathogens, parasites, nutrition, and weather.' }),
  relationship({ source: 'temp', target: 'pollinator_colony_collapse', category: 'pollinators', mechanism: 'Heat and climate-driven range or phenology changes can stress susceptible pollinators, but local land use, pathogens, pesticides, and forage remain important co-drivers.' }),
  relationship({ source: 'drought_persistence', target: 'surface_water_storage_instability', category: 'water_storage', mechanism: 'Persistent precipitation deficits and reduced inflow can lower or destabilize reservoir, lake, and river storage where withdrawals continue.' }),
  relationship({ source: 'temp', target: 'surface_water_storage_instability', category: 'water_storage', mechanism: 'Warming can increase evaporative demand and alter snowmelt and runoff timing, changing stored surface-water availability in susceptible basins.' }),
  relationship({ source: 'temp', target: 'talik_expansion', category: 'permafrost', mechanism: 'Sustained ground warming can enlarge zones that remain unfrozen within or beneath permafrost, with snow, water, soil, and vegetation controlling local development.' }),
  relationship({ source: 'talik_expansion', target: 'methane', category: 'permafrost', mechanism: 'Expansion of unfrozen, permeable pathways beneath thawing terrain or lakes can enable methane production and release where organic carbon and low-oxygen conditions are present.' }),
  relationship({ source: 'water_stress', target: 'urban_water_rationing_zones', category: 'urban_water', mechanism: 'Supply deficits relative to demand can trigger mandatory or voluntary restrictions when utilities cannot meet normal use reliably.' }),
  relationship({ source: 'drought_persistence', target: 'urban_water_rationing_zones', category: 'urban_water', mechanism: 'Extended drought can reduce urban source-water availability and prompt restrictions, moderated by storage, transfers, leakage, pricing, and conservation.' }),
  relationship({ source: 'wildfire_regime_shift', target: 'wildfire_smoke_hospitalization_burden', category: 'wildfire_health', mechanism: 'More frequent or severe smoke-producing fires can increase particulate exposure and related hospital use where populations are exposed.' }),
  relationship({ source: 'wildfire_smoke_hospitalization_burden', target: 'air_pollution_health_burden', category: 'wildfire_health', level: 'direct', verb: 'adds to', mechanism: 'Documented smoke-attributable admissions are a measured component of the broader health burden from polluted air.' }),
  relationship({ source: 'acid_rain_deposition', target: 'freshwater_ecosystem_collapse', category: 'acid_rain', mechanism: 'Acidification and mobilized aluminum can eliminate sensitive aquatic organisms and disrupt food webs where soils and waters have low buffering capacity.' }),
  relationship({ source: 'acid_rain_deposition', target: 'biodiversity_intactness_loss', category: 'acid_rain', mechanism: 'Chronic acidic deposition can remove sensitive species and alter aquatic and terrestrial communities in poorly buffered ecosystems.' }),
  relationship({ source: 'acid_rain_deposition', target: 'forest_dieback_areas', category: 'acid_rain', mechanism: 'Nutrient leaching and aluminum mobilization can weaken susceptible trees, increasing vulnerability to cold, pests, and other stressors rather than acting as a universal sole cause.' }),
  relationship({ source: 'deepwater_petroleum_spill_risk', target: 'marine_food_web_simplification', category: 'oil_spill', mechanism: 'Large releases can kill early life stages, contaminate prey and habitat, and alter reef and pelagic food-web structure across the spill footprint.' }),
  relationship({ source: 'deepwater_petroleum_spill_risk', target: 'marine_fisheries_collapse', category: 'oil_spill', mechanism: 'Large releases can injure commercially important fish and shellfish and close fisheries, with population outcomes depending on exposure, life stage, and recovery.' }),
  relationship({ source: 'deepwater_petroleum_spill_risk', target: 'biodiversity_intactness_loss', category: 'oil_spill', mechanism: 'Acute contamination can kill or impair many species and damage habitats from the deep sea to shorelines, reducing intactness within the affected footprint.' }),
  relationship({ source: 'road_freight_diesel_lock_in', target: 'air_pollution_health_burden', category: 'diesel', mechanism: 'Continued heavy-duty diesel combustion emits particulate matter, nitrogen oxides, and air toxics that increase respiratory and cardiovascular harm near freight corridors.' }),
  relationship({ source: 'semiconductor_fabs', target: 'carbon_emission', category: 'semiconductor', mechanism: 'Electricity-intensive fabrication and process-gas use contribute to greenhouse-gas emissions within the facility and purchased-energy boundary.' }),
  relationship({ source: 'steel', target: 'resource_depletion', category: 'steel', mechanism: 'Conventional production requires large flows of ore, reductants, energy, and other materials; efficiency, recycling, and lower-impact processes moderate demand.' }),
  relationship({ source: 'industry_farming', target: 'cattle_grazing_overcompaction', category: 'grazing', mechanism: 'High stocking pressure and repeated trampling, especially on wet soils, can compact rangeland and pasture soils.' }),
  relationship({ source: 'cattle_grazing_overcompaction', target: 'topsoil_erosion_acceleration', category: 'grazing', mechanism: 'Compaction can reduce infiltration and plant cover, increasing runoff and erosion where rainfall, slope, and soil erodibility align.' }),
  relationship({ source: 'cattle_grazing_overcompaction', target: 'soil_microbial_depletion', category: 'grazing', mechanism: 'Reduced pore space, aeration, infiltration, and root growth can degrade habitat for soil organisms under persistent heavy trampling.' }),
  relationship({ source: 'ai_data_centers', target: 'cooling_water_competition', category: 'data_center', mechanism: 'High-density computing creates continuous heat-removal demand, and evaporative cooling can consume substantial water in locations using cooling towers.' }),
  relationship({ source: 'data_centers', target: 'carbon_emission', category: 'data_center_emissions', level: 'direct', verb: 'causes indirect', mechanism: 'Electricity consumed by servers, storage, networking, cooling, and power-conditioning equipment causes indirect carbon dioxide emissions when the serving grid or contracted generation includes fossil fuels; on-site backup generation can add direct emissions and must be reported separately.' }),
  relationship({ source: 'aviation', target: 'carbon_emission', category: 'aviation', level: 'direct', verb: 'releases', mechanism: 'Jet-fuel combustion releases carbon dioxide within the flight activity and fuel-accounting boundary.' }),
  relationship({ source: 'telecom_backbone', target: 'internet_exchange_points', category: 'digital', level: 'direct', verb: 'enables', mechanism: 'Long-haul transmission routes connect network operators to interconnection facilities, making route availability a direct dependency of traffic exchange.' }),
  relationship({ source: 'telecom_backbone', target: 'mobile_wireless_networks', category: 'digital', level: 'direct', verb: 'supports', mechanism: 'Wireless access networks depend on backhaul and core transport to carry traffic beyond individual radio sites.' }),
  relationship({ source: 'internet_exchange_points', target: 'mobile_wireless_networks', category: 'digital', mechanism: 'Interconnection capacity supports routing between mobile operators, content networks, cloud services, and the wider internet; redundancy determines resilience.' }),
  relationship({ source: 'internet_exchange_points', target: 'critical_infrastructure_fragility', category: 'digital', mechanism: 'Concentrated interconnection facilities can become shared points of failure when power, cooling, physical access, or route diversity is inadequate.' }),
  relationship({ source: 'telecom_backbone', target: 'critical_infrastructure_fragility', category: 'digital', mechanism: 'Failure of long-haul routes or switching systems can disrupt communications used by energy, water, transport, finance, and emergency services.' }),
  relationship({ source: 'mobile_wireless_networks', target: 'critical_infrastructure_fragility', category: 'digital', mechanism: 'Loss of distributed radio sites, backhaul, or backup power can impair public warning, emergency response, and operational communications during disruptions.' })
]);
