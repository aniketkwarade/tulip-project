import {
  agreeRelationshipVerbPhrase,
  getRelationshipSubjectPronoun
} from './relationship-semantics.js';

const HUMAN_SPHERES = new Set([
  'health',
  'sociopolitical',
  'economy',
  'agriculture',
  'freshwater',
  'energy',
  'transport',
  'digital'
]);

const PLANET_SPHERES = new Set([
  'atmosphere',
  'biosphere',
  'cryosphere',
  'freshwater',
  'oceans',
  'agriculture'
]);
const PLANET_ENDPOINT_SPHERES = new Set([
  'atmosphere',
  'biosphere',
  'cryosphere',
  'freshwater',
  'oceans'
]);

const NATURAL_VARIABILITY_PATTERN = /(?:el_nino|la_nina|oscillation|annular_mode|madden_julian|pacific_north_american|indian_ocean_dipole|atlantic_ni_o_ni_a|walker_circulation|trade_wind|rossby_wave)/;
const HUMAN_OUTCOME_PATTERN = /(?:health|mortality|exposure|disease|pathogen|food|water_stress|treatment_stress|disconnection|affordability|migration|disruption|fragility|failure|shortfall|inequality|conflict|insurance|mortgage|price_volatility|humanitarian|rationing|dependency|overload|livelihood|reliability|labor|yield|supply|demand)/;
const HUMAN_NATURAL_SELF_PATTERN = /(?:smoke_exposure|air_quality|particulate_soot|pm2_5|pollen_allergen|coastal_erosion|pathogen)/;
const PLANET_SELF_PATTERN = /(?:spill|pollution|emission|runoff|wastewater|pesticide|microplastic|heavy_metal|soot|particulate|eutroph|hypoxia)/;
const ECONOMIC_CONTEXT_RELEVANCE_OVERRIDES = Object.freeze({
  amoc: 'Continued greenhouse-gas emissions, ocean warming, and freshwater input increase the risk of further AMOC weakening while infrastructure and food systems remain planned around historical circulation patterns.',
  wet_bulb_heat: 'Greenhouse-gas warming raises the heat baseline, while unequal shade, housing quality, cooling access, and worker protection determine who is exposed to dangerous humid heat.',
  monsoon_volatility: 'Greenhouse-gas forcing and regional land-ocean changes destabilize monsoon behavior while farming, reservoirs, and cities remain organized around historical rainfall timing.',
  permafrost_thaw: 'Rapid Arctic warming thaws frozen ground while infrastructure standards, carbon accounting, and adaptation finance lag behind the resulting physical damage and emissions feedback.',
  ocean_acidification: 'Continued carbon-dioxide emissions raise atmospheric CO2 and ocean uptake, while fisheries and coastal planning remain poorly prepared for persistent carbonate-chemistry change.',
  aviation: 'Growing passenger and freight demand, fossil jet-fuel dependence, long aircraft lifetimes, and weak substitutes for long-distance travel sustain aviation’s climate impact.',
  shipping: 'Trade growth, slow fleet turnover, fossil bunker fuels, and limited zero-emission port infrastructure keep maritime transport dependent on high-emission propulsion.',
  mining_critical_minerals: 'Rapid mineral demand, low recovery and recycling rates, weak site governance, and prices that omit water, waste, habitat, and community costs drive new extraction pressure.',
  oceanic_deoxygenation: 'Greenhouse-gas warming lowers oxygen solubility and strengthens stratification, while nutrient loading and weak ocean monitoring compound oxygen loss in vulnerable waters.',
  compound_day_night_heat_extremes: 'Greenhouse-gas warming raises daytime and nighttime temperatures, while heat-storing urban form and inadequate cooling prevent recovery between consecutive hot periods.',
  marine_heatwaves: 'Greenhouse-gas warming raises ocean heat content and makes extreme marine temperatures more likely, while fisheries and conservation rules remain tied to historical temperature ranges.',
  sea_level_rise: 'Continued greenhouse-gas emissions drive ocean expansion and land-ice loss, while new coastal development locks more people and assets into the rising exposure zone.',
  personal_conveyance: 'Car-dependent land use, subsidized road capacity, limited public transit, and fossil-fuel vehicle fleets keep daily travel centered on private motor vehicles.'
});

const CURATED_READER_MEANINGS = Object.freeze({
  temp: 'Rising long-term temperature changes the baseline that weather now operates on, making heat extremes, heavy rainfall, and stress on ice, crops, and ecosystems more likely.',
  methane: 'Methane is a powerful heat-trapping gas, so leaks from fossil systems and emissions from agriculture can speed up near-term warming.',
  deforestation: 'Forest loss removes carbon storage, dries out landscapes, weakens rainfall cycles, and leaves soils and species more exposed.',
  industry_farming: 'Industrial farming drives up fertilizer use, water demand, and land stress, which can increase emissions, pollute waterways, and weaken soil health.',
  food: 'Diet compares familiar foods directly, so users can see how beef, dairy, poultry, grains, and plant proteins differ on the same food-footprint scale.',
  urbanization: 'Urban expansion replaces vegetated land with heat-absorbing surfaces, raising heat exposure, runoff, and flood risk.',
  fast_fashion: 'Fast fashion combines high water use, petrochemical inputs, dye pollution, and waste, so its impact goes far beyond the store.',
  migration: 'Climate-linked displacement does not directly warm the planet, but it can push people into places where housing, water, health systems, and infrastructure are already under stress.',
  resource_depletion: 'Resource depletion matters when extraction outpaces recovery, lowering groundwater reserves, degrading soils, and weakening the buffers communities rely on.',
  carbon_emission: 'Carbon dioxide from fossil fuels and land-use change stays in the atmosphere for a long time, driving warming, ocean acidification, and long-lived climate pressure.',
  personal_conveyance: 'Heavy dependence on private vehicles raises oil demand and combustion emissions, adding both climate pollution and harmful local air pollution.',
  environ_anomalies: 'Climate anomalies matter because they shift familiar seasonal patterns out of range, making floods, droughts, marine heat, and wildfire behavior harder to manage with historical expectations alone.',
  el_nino: 'El Nino redistributes tropical Pacific heat and shifts atmospheric circulation, which can change storm tracks, suppress rainfall in some regions, and increase flood risk or heat risk in others.',
  la_nina: 'La Nina cools the tropical Pacific surface while reorganizing circulation patterns, often strengthening rainfall in some basins, deepening drought in others, and changing the odds of seasonal extremes worldwide.',
  amoc: 'The Atlantic Meridional Overturning Circulation helps move heat, salt, and nutrients through the ocean, so a slowdown can reshape rainfall belts, sea level patterns, and marine ecosystem conditions around the Atlantic basin.',
  wet_bulb_heat: 'Wet-bulb heat is dangerous because high humidity makes it harder for the body to cool itself through sweat.',
  monsoon_volatility: 'Monsoon volatility is about more than total rainfall. Shifts in timing and intensity can disrupt planting, reservoirs, flood control, and livelihoods.',
  permafrost_thaw: 'Permafrost thaw destabilizes frozen ground and can release stored carbon and methane, linking local damage with larger climate feedbacks.',
  glacier_calving_events: 'Glacier calving releases icebergs from a glacier front, moving land ice toward the ocean and sometimes adding to local lake or slope hazards where surrounding conditions are already unstable.',
  data_centers: 'Data centers matter when electricity demand, cooling loads, backup generation, and water use are concentrated in one place.',
  ai_data_centers: 'AI compute can intensify data-center pressures because training and inference workloads often run at higher power density and for longer periods.',
  semiconductor_fabs: 'Chip fabrication requires large amounts of electricity, ultrapure water, process chemicals, and fluorinated gases before the hardware ever reaches a server.',
  telecom_backbone: 'Telecom backbone networks are the long-haul digital arteries that move traffic between cities, regions, and countries, tying physical connectivity to ongoing electricity demand and infrastructure fragility.',
  mobile_wireless_networks: 'Mobile towers and wireless backhaul extend energy demand, backup-power dependence, and outage exposure across large geographies.',
  internet_exchange_points: 'Internet exchange points are physical hubs where networks meet and exchange traffic, making these compact facilities critical points of resilience and concentration risk.',
  subsea_cables: 'Subsea cables carry most international internet traffic through a limited number of routes and landing stations, creating chokepoints for communication and trade.'
});

const READER_MEANING_OPENING_OVERRIDES = Object.freeze({
  fast_fashion: 'High water use, petrochemical inputs, dye pollution, and waste give low-cost, short-lived clothing an impact that extends far beyond the store.',
  resource_depletion: 'When extraction outpaces recovery, groundwater reserves fall, soils degrade, and the natural buffers communities rely on become weaker.',
  wet_bulb_heat: 'High humidity makes extreme heat especially dangerous by limiting the body’s ability to cool itself through sweat.',
  monsoon_volatility: 'Shifts in monsoon timing and intensity can disrupt planting, reservoirs, flood control, and livelihoods even when total seasonal rainfall appears normal.',
  permafrost_thaw: 'As formerly frozen ground warms, it can subside, damage infrastructure, and release stored carbon and methane into larger climate feedbacks.',
  data_centers: 'Concentrated electricity demand, cooling loads, backup generation, and water use make the location and operation of server campuses environmentally consequential.',
  telecom_backbone: 'Long-haul fiber, switching hubs, and transmission corridors move data between regions while concentrating electricity demand and network fragility.',
  internet_exchange_points: 'Physical hubs where networks exchange traffic are compact but critical points of resilience, dependency, and concentration risk.',
  subsea_cables: 'Most international internet traffic travels through a limited number of undersea routes and coastal landing stations, creating chokepoints for communication and trade.',
  steel: 'Ore extraction, blast-furnace coal use, high-temperature heat, and construction demand combine into a concentrated industrial footprint.',
  demand_response: 'Flexible electricity use can be paid or automated to shift demand away from stressed hours instead of requiring another fossil peaker plant.',
  carbon_dioxide_removal: 'Removing carbon dioxide can counter residual emissions, but it remains a limited complement to rapid emissions cuts rather than a substitute for them.',
  planned_relocation: 'A rights-based path out of places that cannot be protected safely can preserve housing, livelihoods, culture, services, and community choice.',
  oceanic_deoxygenation: 'Declining dissolved oxygen across the open ocean and deep waters compresses habitable space and weakens marine ecosystem resilience.',
  antarctic_bottom_water_decline: 'Reduced formation and renewal of dense Antarctic Bottom Water weakens abyssal overturning, ventilation, and oxygen delivery to the deep ocean.',
  ocean_acidification: 'Absorbed carbon dioxide changes seawater chemistry, lowers pH, and reduces the carbonate conditions many shell-forming organisms need.',
  pacific_decadal_oscillation: 'A long-lived pattern of North Pacific temperature variability shifts regional rainfall, marine conditions, and background climate over years to decades.',
  indian_ocean_dipole: 'Contrasting sea-surface temperatures across the tropical Indian Ocean reorganize winds and rainfall around the basin and beyond.',
  tidal_wetland_carbon_reversal: 'Disturbance or loss can turn carbon-storing salt marshes, mangroves, and seagrass systems into sources of previously stored greenhouse gases.',
  nocturnal_heat_stress: 'Persistently hot nights prevent bodies, buildings, and power systems from recovering after daytime heat.',
  compound_day_night_heat_extremes: 'Heat that remains dangerous through both day and night creates continuous exposure without a safe recovery period.',
  hail_hazard_shift: 'Changing convective environments can redistribute where, when, and how severely damaging hail occurs.',
  southern_annular_mode: 'A north-south shift in the belt of Southern Hemisphere westerly winds changes storms, rainfall, ocean circulation, and Antarctic conditions.'
});

const STANDALONE_DEFINITION_OVERRIDES = Object.freeze({
  snowmelt_timing_shift: 'a shift in when seasonal snow begins melting and when its runoff reaches downstream rivers and reservoirs',
  flash_flood_regime: 'the recurring pattern, timing, and severity of fast-rising floods after intense rain or sudden water release',
  freshwater_lens_compression: 'the thinning of the floating freshwater reserve beneath a small island as pumping, drought, or saltwater intrusion reduces its usable depth',
  irrigation_water_inefficiency: 'the loss of irrigation water before it benefits crops through evaporation, leakage, runoff, or poorly matched application',
  snow_drought: 'an unusually small snowpack, or an early loss of stored snow, that reduces dependable cold-season water storage',
  firn_layer_depletion: 'the loss of porous compacted snow that can temporarily store meltwater before it drains or refreezes',
  atlantic_multidecadal_oscillation: 'multi-decade variability in North Atlantic sea-surface temperature patterns and the circulation connected to them',
  ocean_current_regime_shift: 'persistent reorganizations in the direction, strength, depth, or seasonality of ocean circulation',
  marine_food_web_simplification: 'a reorganization of marine feeding relationships that leaves fewer functional groups, pathways, or resilient species',
  ocean_salinity_stratification: 'the layering of ocean water by salt content in ways that restrict vertical mixing',
  harmful_algal_blooms: 'episodes of rapid algae or cyanobacteria growth that can produce toxins, block light, or consume oxygen as the bloom decays',
  pelagic_species_redistribution: 'the movement of open-ocean species into different depths, latitudes, or seasonal ranges as habitat conditions change',
  arctic_oscillation: 'a recurring pattern of atmospheric pressure variability that changes how Arctic air and storms move into lower latitudes',
  blocking_pattern_persistence: 'a long-lived atmospheric pressure pattern that stalls normal west-to-east weather movement',
  lightning_fire_weather: 'a lightning strike occurring when dry fuels and fire weather make ignition and sustained burning more likely',
  atmospheric_dryness: 'the atmosphere’s demand for moisture from soil, vegetation, and surface water under a given combination of heat, humidity, wind, and radiation',
  soot_deposition_on_snow: 'the darkening of snow by black-carbon particles that increases absorbed sunlight and accelerates melting',
  ozone_formation_pressure: 'the tendency for warmer, sunnier, stagnant conditions to increase surface-ozone formation even when precursor emissions do not rise',
  rossby_wave_stalling: 'persistent large-scale atmospheric wave patterns that can hold heat, cold, drought, or rain over one region',
  peaker_plant_lock_in: 'continued dependence on fast-start fossil power plants to meet short periods of high electricity demand',
  transmission_buildout_lag: 'the delay between the need for new power lines and the planning, permitting, financing, and construction needed to deliver them',
  transformer_supply_bottleneck: 'a shortage or delivery constraint in the transformers needed to connect, expand, or repair electric grids',
  industrial_heat_decarbonization_gap: 'the remaining gap between fossil-fueled industrial heat and the low-emissions equipment, fuels, and infrastructure needed to replace it',
  steel_decarbonization_gap: 'the remaining gap between conventional high-emissions steelmaking and commercially deployed low-emissions production',
  critical_mineral_extraction_pressure: 'the land, water, waste, energy, and community pressure created as demand for transition minerals drives additional mining',
  battery_supply_chain_pressure: 'the combined extraction, refining, manufacturing, logistics, and labor pressure created by growing battery demand',
  semiconductor_fabrication_footprint: 'the electricity, ultrapure water, chemicals, land, and process-gas burden associated with manufacturing computer chips',
  energy_affordability_crisis: 'a condition in which households or essential services cannot reliably pay for the energy needed for health, safety, and daily life',
  renewable_curtailment_losses: 'usable wind or solar generation that is deliberately reduced because the grid cannot absorb, transmit, or store it at that time',
  aviation_demand_growth: 'an increase in passenger or freight flying that raises aircraft activity, fuel demand, and supporting infrastructure use',
  freight_electrification_gap: 'the gap between current fossil-fueled freight activity and the vehicles, charging, power supply, and operations needed for electrification',
  road_freight_diesel_lock_in: 'continued dependence of trucks and freight networks on diesel vehicles, fueling systems, and long-lived operating practices',
  rail_heat_buckling: 'the deformation of rail caused when high temperatures create compressive stress beyond the track’s safe tolerance',
  livestock_disease_pressure: 'the combined pathogen, vector, heat, crowding, and management conditions that increase illness in farm animals',
  fertilizer_price_shock: 'a rapid fertilizer-cost increase that disrupts farm budgets, application decisions, and expected crop production',
  feed_crop_dependency: 'reliance on dedicated crops and land to supply animal feed rather than direct human food or ecosystem functions',
  topsoil_erosion_acceleration: 'a rising rate of fertile surface-soil loss by water, wind, tillage, or vegetation removal',
  disaster_recovery_inequality: 'unequal access to insurance, aid, credit, housing, infrastructure, and political power during recovery from a disaster',
  relocation_governance_capacity: 'the institutional ability to plan, fund, and carry out voluntary relocation while protecting rights, services, livelihoods, and culture',
  climate_litigation_pressure: 'legal and financial pressure created by lawsuits over climate harms, disclosure, adaptation duties, or emissions responsibility',
  marine_heatwaves: 'prolonged periods of unusually warm ocean temperature relative to the local season and historical range',
  fracking_wastewater_lakes: 'surface impoundments or ponds used to hold wastewater from hydraulic fracturing and related oil-and-gas operations',
  cattle_grazing_overcompaction: 'soil compression caused when repeated livestock traffic exceeds the soil’s ability to retain pore space and recover',
  topsoil_salinization_fields: 'the buildup of soluble salts in cultivated topsoil to levels that impair crops, soil structure, or water uptake',
  coral_bleaching: 'the loss of symbiotic algae or pigments from stressed coral, leaving colonies pale and short of their main energy source',
  deepwater_petroleum_spill_risk: 'offshore oil-and-gas activity conducted in deep water, where high pressure, remoteness, and difficult access complicate accident prevention and response',
  volatile_organic_compounds: 'carbon-containing gases that evaporate readily and can contribute to ozone, aerosols, toxicity, and indoor or outdoor air pollution',
  sea_level_rise: 'the long-term increase in average ocean height caused mainly by warming-driven expansion and land-ice loss',
  tundra_methane_outgassing: 'the release of methane from tundra soils, wetlands, thaw features, and shallow subsurface pathways',
  pesticide_bioaccumulation_chains: 'persistent pesticide material remaining in sediment or living tissue and accumulating through exposure and food webs',
  anoxic_dead_zones: 'coastal waters with oxygen levels too low to support many fish, shellfish, and bottom-dwelling organisms',
  ice_albedo_feedback_loops: 'a reinforcing cycle in which ice loss darkens the surface, increases absorbed sunlight, and promotes additional warming and melt',
  forest_dieback_areas: 'landscapes where a substantial share of trees are dying because stress exceeds their capacity to survive and recover',
  humanitarian_resource_gaps: 'the shortfall between humanitarian needs and the personnel, funding, supplies, access, and logistics available to meet them',
  carbon_monoxide: 'a toxic, colorless gas produced by incomplete combustion that also influences atmospheric chemistry',
  gulf_stream_slowdown: 'the speed, volume transport, and geographic path of the Gulf Stream as it carries warm water through the North Atlantic',
  hydrological_runoff_surges: 'a rapid increase in water moving from snow, soil, or land surfaces into streams and rivers',
  floodplain_exposure: 'the people, buildings, infrastructure, and economic assets located where rivers are expected to overflow',
  groundwater_depletion_wells: 'wells affected by falling groundwater levels as pumping removes stored water faster than recharge replaces it',
  ocean_heat_content: 'the total thermal energy stored in the ocean across a specified depth range',
  waterborne_pathogen_outbreaks: 'clusters of illness caused by pathogens transmitted through contaminated drinking, recreational, flood, or wastewater',
  emergency_response_overload: 'a condition in which emergency demand exceeds available staff, equipment, transport, communications, beds, or response time',
  zoonotic_disease_outbreaks: 'clusters of human or animal illness caused by pathogens that move between wildlife, livestock, and people',
  alpine_snowpack_declines: 'sustained reductions in mountain snow depth, water content, duration, or seasonal coverage',
  wetlands_drainage_scales: 'the removal or diversion of water from wetlands, lowering water tables and changing habitat, carbon storage, and flood buffering',
  managed_retreat_pressure: 'the growing need to decide whether people and assets should relocate from places that can no longer be protected safely or affordably',
  cooling_equity_gaps: 'unequal access to safe indoor temperatures, efficient cooling, affordable electricity, shade, and heat-resilient housing',
  supply_chain_port_bottlenecks: 'capacity constraints at ports that delay ships, cargo handling, storage, customs, or inland freight movement',
  coastal_property_insurance_redlines: 'the nonrenewal or withdrawal of property insurance where coastal hazards make coverage unavailable or unaffordable',
  deep_sea_mining_dust: 'clouds of disturbed seafloor sediment created by deep-sea mining equipment, material lifting, or waste discharge',
  agrochemical_water_sinks: 'pesticide compounds or breakdown products remaining in rivers, lakes, wetlands, or other surface waters',
  acid_rain_deposition: 'the transfer of sulfur- and nitrogen-derived acids from the atmosphere to land and water through rain, snow, particles, or gases',
  rainforest_savannization: 'a shift from closed, humid rainforest toward a drier, more open, fire-prone landscape',
  urban_water_rationing_zones: 'restrictions on when, where, or how much water households and businesses may use during shortage',
  asphalt_pavement_heat_absorbers: 'heat stored and re-radiated by dark paved surfaces that absorb more sunlight than vegetated or reflective ground',
  ambient_air_quality_deficit: 'outdoor pollutant levels above a health-based air-quality standard or guideline',
  genetic_diversity_bottlenecks: 'sharp reductions in population size that remove genetic variation and increase inbreeding risk',
  fishery_border_dispute_zones: 'conflict between jurisdictions or fleets over access to fish stocks that cross political boundaries',
  inland_waterway_fuel_spills: 'accidental releases of petroleum fuel into rivers, canals, lakes, or connected shorelines',
  mountain_pass_avalanches: 'rapid downslope movement of snow and ice through mountain corridors used by roads, rail, utilities, or travelers',
  dust_storm_frequency: 'how often strong winds lift enough loose soil or sediment to produce a dust storm',
  pollen_allergen_spikes: 'short periods when airborne allergenic pollen rises far above its normal seasonal level',
  estuary_eutrophication: 'nutrient enrichment in an estuary that stimulates excessive plant or algal growth and can deplete oxygen',
  shell_calcification_failures: 'the inability of shell-forming organisms to build or maintain calcium-carbonate structures at a healthy rate',
  arctic_pack_ice_drift: 'the wind- and current-driven movement of floating Arctic sea ice',
  early_warning_coverage_gaps: 'places or populations that lack timely hazard detection, communication, trusted alerts, or the ability to act on warnings',
  black_carbon_deposition: 'the transfer of light-absorbing soot particles from the atmosphere onto land, water, snow, ice, or vegetation',
  glacial_siltation_streams: 'meltwater streams carrying high loads of fine rock flour produced by glacier erosion',
  jellyfish_swarm_surges: 'changes in how often large jellyfish blooms occur and how much jellyfish biomass they contain',
  bark_beetle_epidemics: 'large, sustained outbreaks of bark beetles that overwhelm tree defenses and cause widespread forest mortality',
  old_growth_forest_logging: 'the harvest of long-lived, structurally complex forests that have developed over many decades or centuries',
  particulate_soot_levels: 'the amount of fine combustion-derived black and organic carbon particles present in the air',
  pesticide_spray_drift_zones: 'areas reached by pesticide droplets or vapors that move away from the intended application site',
  ice_algae_pigmentation: 'the darkening of snow or ice by pigmented algae growing on or near the frozen surface',
  snowpack_dust_soot_coverage: 'mineral dust deposited on snow, where darker particles reduce reflectivity and hasten melt',
  heavy_metal_bioaccumulation: 'the buildup of persistent metals in organisms when uptake exceeds elimination',
  glacier_hydrologic_system_floods: 'floods produced when water stored within, beneath, beside, or in front of a glacier is released rapidly',
  wetland_peat_fires: 'fires that burn carbon-rich peat soils in drained or drought-stressed wetlands, often smouldering below ground',
  ice_cap_decapitation: 'the separation or loss of an ice cap’s higher accumulation area, leaving lower ice unable to sustain itself',
  nighttime_heat_retention: 'the persistence of high temperatures overnight when surfaces, buildings, and humid air release stored heat slowly',
  nunatak_habitat_shrinkage: 'the loss of ice-free mountain habitat protruding above glaciers or ice sheets as surrounding conditions change',
  walker_circulation_shift: 'variability in the tropical Pacific east-west circulation that links trade winds, rising air, rainfall, and ocean temperature',
  fjord_sedimentation_pulses: 'short periods of unusually rapid sediment delivery and accumulation in a fjord',
  freeze_thaw_rock_fracturing: 'the cracking and weakening of rock as water freezes, expands, and thaws repeatedly in joints and pores',
  aerosolized_microplastics: 'small plastic fibres and fragments suspended in air or deposited from the atmosphere',
  coastal_saltwater_intrusion: 'the inland or upward movement of seawater into coastal rivers, soils, aquifers, or water-supply intakes',
  subpolar_gyre_weakening: 'the strength and reach of the cyclonic ocean circulation in the North Atlantic subpolar region',
  shelf_sea_hypoxia: 'low dissolved oxygen in shallow continental-shelf seas, often intensified by stratification and nutrient-driven respiration',
  methane_hydroxyl_sink_loss: 'a reduction in the atmosphere’s hydroxyl-radical capacity to remove methane and other reactive gases',
  stratospheric_chlorine_sinks: 'the depletion and subsequent recovery of the protective ozone column in the stratosphere',
  aviation_condensation_trails: 'line-shaped ice clouds formed when aircraft exhaust mixes with cold, humid air at cruising altitude',
  compound_coastal_flooding: 'coastal flooding produced by two or more coincident drivers such as surge, tide, waves, rainfall, river flow, and sea-level rise',
  fisheries_range_redistribution: 'the movement of harvested fish populations into different latitudes, depths, seasons, or jurisdictions',
  coastal_aquifer_degradation: 'the contamination of a coastal aquifer by saltwater, making groundwater less suitable for drinking or irrigation',
  urban_water_demand_peak: 'the highest short-period water demand placed on an urban supply, treatment, and distribution system',
  pm2_5_particulates: 'airborne particles no wider than 2.5 micrometres that can penetrate deep into the lungs and enter the bloodstream',
  reservoir_operating_shortfall: 'insufficient usable storage or release flexibility to meet a reservoir’s expected water-supply, flood-control, or power obligations',
  watershed_forest_loss: 'the removal or death of forest cover within a drainage basin',
  wastewater_infrastructure_overflow: 'wastewater escaping from sewers, pumps, treatment plants, or storage after their capacity is exceeded',
  wastewater_bypass_discharge: 'untreated or partly treated wastewater released around a normal treatment step during overload, failure, or maintenance',
  sea_ice_season_loss: 'a shortening of the part of the year when a region remains covered by sea ice',
  marine_fisheries_collapse: 'a severe loss of fish abundance or reproductive capacity that prevents a fishery from sustaining normal harvest and ecosystem roles',
  fish_landing_supply_disruption: 'an interruption in the flow of harvested seafood from vessels to ports, processors, markets, and consumers',
  littoral_surge_vulnerability: 'the exposure of coastal people, ecosystems, and assets to damaging storm-driven rises in water level',
  humidity_amplification: 'an increase in atmospheric water vapour that can intensify humid heat and heavy precipitation',
  smoke_exposure_burden: 'the accumulated illness, mortality, disruption, and unequal risk caused by breathing wildfire or combustion smoke',
  low_cloud_deck_retreat: 'a sustained reduction in the area or persistence of reflective low marine clouds',
  grid_peak_load_stress: 'strain on an electric grid when short-period demand approaches or exceeds available generation and network capacity',
  cement_process_emissions: 'carbon dioxide released by the chemical conversion of limestone during cement production, separate from kiln-fuel combustion',
  backup_generator_dependence: 'reliance on onsite generators for electricity during grid outages or where grid service is insufficient',
  shipping_lane_disruption: 'an interruption or constraint affecting the routes used by commercial vessels and maritime trade',
  port_heat_vulnerability: 'the susceptibility of port workers, equipment, storage, and operations to extreme heat',
  airport_climate_exposure: 'the degree to which airport runways, terminals, workers, access routes, and operations encounter climate hazards',
  airport_operational_disruption: 'an interruption to airport arrivals, departures, ground handling, passenger movement, or emergency access',
  food_import_exposure: 'dependence on imported food that leaves consumers vulnerable to foreign crop losses, price shocks, export restrictions, or transport delays',
  agricultural_labor_exposure: 'farm workers’ contact with heat, smoke, chemicals, disease, and other hazards during outdoor or manual work',
  mortgage_market_exposure: 'the vulnerability of mortgage lenders, borrowers, and property values to climate damage, insurance withdrawal, and repeated loss',
  public_health_heat_burden: 'the accumulated illness, death, service demand, and unequal exposure created by dangerous heat',
  antarctic_shelf_instability: 'the weakening, retreat, fracture, or loss of floating Antarctic ice shelves that normally restrain inland ice flow',
  soil_microbial_depletion: 'a sustained loss of the abundance, diversity, or activity of microorganisms that maintain soil function',
  combined_sewer_overflow: 'a release of untreated stormwater and sewage when a combined sewer exceeds its conveyance or treatment capacity',
  coastal_erosion: 'the landward wearing away of beaches, dunes, cliffs, wetlands, and shorelines by waves, currents, storms, and rising water levels',
  subsea_cable_landing_chokepoint: 'the concentration of submarine cable landings, power, stations, and inland connections at a small number of exposed coastal sites',
  jet_stream_volatility: 'larger or less predictable changes in the position, speed, and waviness of the jet stream',
  wildfire_smoke_hospitalization_burden: 'hospital admissions and acute-care demand associated with exposure to wildfire smoke',
  kelp_forest_collapse: 'a severe loss of kelp canopy, recruitment, and ecological function that prevents normal forest recovery',
  trophic_cascade_collapses: 'a disruption that travels through a food web after predators, prey, or other influential species change sharply',
  cfc_saturated_layers: 'the atmospheric abundance of long-lived chlorine- and bromine-containing gases capable of depleting stratospheric ozone',
  arctic_amplification_rates: 'the faster warming of the Arctic relative to the global average',
  heatwave_excess_mortality_rates: 'deaths occurring above the expected baseline that are attributable to extreme heat',
  stratospheric_cooling: 'a sustained reduction in temperature in the atmospheric layer above the troposphere',
  coral_reef_fragmentation: 'the division of connected reef habitat into smaller, more isolated patches',
  ice_shelf_grounding_line_retreat: 'the inland movement of the boundary where an ice sheet stops resting on bedrock and begins to float',
  avian_migration_disruptions: 'changes in bird migration timing, routes, stopovers, or food synchronization that reduce successful movement and breeding',
  amphibian_chytrid_fungus_spreads: 'the prevalence, severity, and population mortality associated with chytrid fungal infection in amphibians',
  cryoconite_hole_expansion: 'the widening or multiplication of melt holes formed around dark sediment and microbes on glacier ice',
  savannah_tree_cover_decline: 'a sustained reduction in woody vegetation across savanna landscapes',
  estuarine_nursery_loss: 'the degradation or disappearance of sheltered estuary habitat used by juvenile fish and invertebrates',
  riparian_zone_erosion: 'the wearing away of vegetated riverbanks and streamside soils',
  overstory_tree_mortality: 'the death of mature canopy trees that form the upper layer of a forest',
  tundra_shrubification_speeds: 'the spread and increasing dominance of shrubs across formerly low-growing tundra',
  freshwater_mussel_depletion: 'a sustained reduction in the abundance, diversity, or distribution of freshwater mussels',
  coral_larval_mortality: 'failure of coral larvae to survive, settle, and recruit into the next generation of reef-building colonies',
  riverine_habitat_fragmentation: 'the division of connected river habitat by dams, culverts, withdrawals, degraded reaches, or other barriers',
  atmospheric_river_intensification: 'an increase in the moisture transport, precipitation rate, or persistence of atmospheric rivers',
  blue_carbon_habitat_loss: 'the removal or degradation of mangroves, salt marshes, seagrasses, and other coastal ecosystems that store carbon'
});

const READER_METHODOLOGY_PATTERN = /\bis represented here through\b|\bmeasured in\b|\bdeclared geography\b|\bobserving network\b|\bcalculation stated\b|\bcalibration scale\b|\bcomparisons? must preserve\b|\bmetric contract\b|\breported separately with\b/i;
const WEAK_RELATIONSHIP_MEANING_PATTERN = /\bis a documented driver or conditioning factor\b|\bthrough the reviewed [a-z -]+ mechanism\b|\bthrough the documented system pathway\b|\bcan propagate into\b|\badds pressure to\b/i;

function normalizeSentence(text) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  const sentence = compact.charAt(0).toUpperCase() + compact.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function firstSentence(text) {
  return normalizeSentence(String(text || '').split(/(?<=[.!?])\s+/).filter(Boolean)[0]);
}

function narrativeNodeDescription(node) {
  const description = firstSentence(node?.description);
  if (
    !description
    || READER_METHODOLOGY_PATTERN.test(description)
    || /\bis represented here through\b/i.test(description)
    || /^(?:Tracks|Links|Details|Measures|Represents)\b/i.test(description)
    || /requires node-specific editorial review|modelled separately|kept as a monitored|interpreted at the geography|^Measured or inventory-estimated|^Measured peak demand/i.test(description)
  ) {
    return '';
  }
  return description;
}

function meaningEdgeText(edge) {
  const mechanism = firstSentence(edge?.evidence?.mechanism);
  if (
    mechanism
    && !READER_METHODOLOGY_PATTERN.test(mechanism)
    && !WEAK_RELATIONSHIP_MEANING_PATTERN.test(mechanism)
  ) return mechanism;
  const relationship = firstSentence(edge?.relationship_description);
  return READER_METHODOLOGY_PATTERN.test(relationship) || WEAK_RELATIONSHIP_MEANING_PATTERN.test(relationship)
    ? ''
    : relationship;
}

function pickMeaningEdge(node, graph) {
  const candidates = [
    ...(graph.outgoing.get(node.id) || []).map(edge => ({ edge, direction: 'outgoing' })),
    ...(graph.incoming.get(node.id) || []).map(edge => ({ edge, direction: 'incoming' }))
  ];
  return candidates
    .map(candidate => {
      const text = meaningEdgeText(candidate.edge);
      const adjacentId = candidate.direction === 'outgoing' ? candidate.edge.target : candidate.edge.source;
      const adjacentNode = graph.nodeById.get(adjacentId);
      const namesAdjacentNode = adjacentNode?.name
        && text.toLocaleLowerCase().includes(adjacentNode.name.toLocaleLowerCase());
      const score = (
        (candidate.direction === 'outgoing' ? 12 : 0)
        + (candidate.edge.evidence?.mechanism ? 6 : 0)
        + (adjacentNode?.node_kind === 'response' ? -8 : 0)
        + (candidate.edge.evidence?.source_status === 'curated' ? 2 : 0)
      );
      return { ...candidate, adjacentNode, text: namesAdjacentNode ? '' : text, score };
    })
    .filter(candidate => candidate.text && candidate.adjacentNode)
    .sort((a, b) => b.score - a.score)[0] || null;
}

function lowerPhrase(text) {
  const compact = String(text || '').trim();
  return compact.toLocaleLowerCase();
}

function definitionCopula(name) {
  return /(?:Blooms|Heatwaves|Lakes|Compounds|Losses|Areas|Wells|Outbreaks|Declines|Gaps|Bottlenecks|Spills|Avalanches|Spikes|Failures|Trails|Floods|Fires|Patterns|Pulses|Shifts|Emissions|Particulates)$/i.test(name)
    ? 'are'
    : 'is';
}

function standaloneNodeDefinition(node) {
  const name = String(node.name || '').trim();
  const lowerName = lowerPhrase(name);
  const copula = definitionCopula(name);
  const authoredDefinition = STANDALONE_DEFINITION_OVERRIDES[node.id];
  if (authoredDefinition) return `${name} ${copula} ${authoredDefinition}.`;
  const exactDefinitions = {
    'Greenhouse Gas Effective Radiative Forcing': 'the change in Earth’s energy balance caused by long-lived greenhouse gases trapping additional heat',
    'Aquifer Overdraft': 'groundwater withdrawal that exceeds the rate at which an aquifer can recharge',
    'El Niño': 'the recurring warming phase of the tropical Pacific Ocean that reorganizes atmospheric circulation',
    'La Niña': 'the recurring cooling phase of the tropical Pacific Ocean that reorganizes atmospheric circulation',
    'Atlantic Meridional Overturning Circulation': 'a large Atlantic current system that moves heat, salt, carbon, and nutrients between the tropics and high latitudes',
    'Wet-Bulb Heat': 'the combination of high temperature and humidity that limits the body’s ability to cool itself through sweat',
    'Permafrost Thaw': 'the transition of formerly frozen ground into seasonally or persistently unfrozen soil',
    'Tropospheric Ozone': 'ozone in the lower atmosphere, where it acts as both a greenhouse gas and a harmful air pollutant',
    'Nitrous Oxide': 'a long-lived greenhouse gas produced by natural processes and human activities, especially fertilized soils and manure management',
    'Sulfur Dioxide': 'a reactive gas released mainly by sulfur-containing fuel combustion, metal processing, and volcanic activity',
    'Methane Emissions': 'the release of methane from fossil systems, agriculture, waste, wetlands, and other sources into the atmosphere'
  };
  if (exactDefinitions[name]) return `${name} ${copula} ${exactDefinitions[name]}.`;

  const suffixRules = [
    { pattern: /^(.+?)\s+CO2\s+(?:Output|Release)$/i, build: base => `carbon dioxide released by ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Risk$/i, build: base => `the likelihood or potential severity of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Vulnerability$/i, build: base => `susceptibility to damage or disruption from ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Exposure$/i, build: base => `contact with, or vulnerability to, ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Burden$/i, build: base => `the accumulated human, ecological, or operational harm associated with ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Instability$/i, build: base => `greater variability and reduced reliability in ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Volatility$/i, build: base => `larger or less predictable swings in ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Shortfall$/i, build: base => `a gap between the required and available ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Deficit$/i, build: base => `a sustained shortage of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Stress$/i, build: base => `pressure on ${lowerPhrase(base)} severe enough to impair normal function or recovery` },
    { pattern: /^(.+?)\s+Failure$/i, build: base => `the point at which ${lowerPhrase(base)} can no longer perform its expected function` },
    { pattern: /^(.+?)\s+Collapse$/i, build: base => `a loss of normal function, abundance, or persistence in ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Decline$/i, build: base => `a sustained reduction in ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Loss$/i, build: base => `the reduction or disappearance of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Depletion$/i, build: base => `the removal or consumption of ${lowerPhrase(base)} faster than it can recover` },
    { pattern: /^(.+?)\s+Contraction$/i, build: base => `a sustained shrinking of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Retreat$/i, build: base => `the sustained withdrawal or shrinking of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Expansion$/i, build: base => `the spread or growth of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Encroachment$/i, build: base => `the spread of ${lowerPhrase(base)} into places where it was previously limited or absent` },
    { pattern: /^(.+?)\s+Disruption$/i, build: base => `an interruption or breakdown in ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Dependence$/i, build: base => `reliance on ${lowerPhrase(base)} when alternatives are limited` },
    { pattern: /^(.+?)\s+Change$/i, build: base => `a persistent departure in ${lowerPhrase(base)} from its earlier pattern or state` },
    { pattern: /^(.+?)\s+Shift$/i, build: base => `a persistent movement in ${lowerPhrase(base)} away from its earlier pattern or state` },
    { pattern: /^(.+?)\s+Anomaly$/i, build: base => `a departure in ${lowerPhrase(base)} from an established reference condition` },
    { pattern: /^(.+?)\s+Increase$/i, build: base => `a sustained rise in ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Amplification$/i, build: base => `a strengthening of ${lowerPhrase(base)} beyond its earlier range` },
    { pattern: /^(.+?)\s+Intensification$/i, build: base => `an increase in the strength, rate, or severity of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Warming$/i, build: base => `a sustained increase in the temperature of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Cooling$/i, build: base => `a sustained decrease in the temperature of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Thinning$/i, build: base => `a reduction in the thickness or stored volume of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Thaw$/i, build: base => `the transition of ${lowerPhrase(base)} from frozen to unfrozen conditions` },
    { pattern: /^(.+?)\s+Erosion$/i, build: base => `the wearing away and transport of ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Overflow$/i, build: base => `the release of ${lowerPhrase(base)} after its storage or conveyance capacity is exceeded` },
    { pattern: /^(.+?)\s+Discharge$/i, build: base => `the release of ${lowerPhrase(base)} into the surrounding environment` },
    { pattern: /^(.+?)\s+Runoff$/i, build: base => `the movement of ${lowerPhrase(base)} across land and into drains, rivers, lakes, or coastal waters` },
    { pattern: /^(.+?)\s+Leakage$/i, build: base => `the unintended escape of ${lowerPhrase(base)} from equipment, storage, or infrastructure` },
    { pattern: /^(.+?)\s+(?:Emissions|Outflow|Output|Release)$/i, build: base => `the release of ${lowerPhrase(base)} into the atmosphere or surrounding environment` },
    { pattern: /^(.+?)\s+Concentration$/i, build: base => `the amount of ${lowerPhrase(base)} present in a defined part of the environment` },
    { pattern: /^(.+?)\s+Mortality$/i, build: base => `deaths associated with ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Migration$/i, build: base => `the movement of ${lowerPhrase(base)} between habitats, regions, or communities` },
    { pattern: /^(.+?)\s+Fragmentation$/i, build: base => `the division of ${lowerPhrase(base)} into smaller, more isolated parts` },
    { pattern: /^(.+?)\s+Degradation$/i, build: base => `the loss of quality, function, or resilience in ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Pollution$/i, build: base => `harmful contamination associated with ${lowerPhrase(base)}` },
    { pattern: /^(.+?)\s+Scarcity$/i, build: base => `a condition in which available ${lowerPhrase(base)} cannot reliably meet human and ecological needs` }
  ];
  for (const rule of suffixRules) {
    const match = name.match(rule.pattern);
    if (match) return `${name} ${copula} ${rule.build(match[1])}.`;
  }

  const sphereDefinitions = {
    atmosphere: `an atmospheric process or condition involving ${lowerName}`,
    oceans: `an ocean process or condition involving ${lowerName}`,
    cryosphere: `a change in snow, ice, or frozen ground involving ${lowerName}`,
    biosphere: `an ecological process or condition involving ${lowerName}`,
    freshwater: `a freshwater process or condition involving ${lowerName}`,
    agriculture: `an agricultural process or condition involving ${lowerName}`,
    health: `a public-health condition involving ${lowerName}`,
    energy: `an energy-system process or condition involving ${lowerName}`,
    digital: `a digital-infrastructure process or condition involving ${lowerName}`,
    transport: `a transport-system process or condition involving ${lowerName}`,
    economy: `an economic process or condition involving ${lowerName}`,
    sociopolitical: `a social or governance process or condition involving ${lowerName}`
  };
  return `${name} ${copula} ${sphereDefinitions[node.sphere] || `a system condition involving ${lowerName}`}.`;
}

function standaloneImportance(node) {
  const importanceBySphere = {
    atmosphere: 'It matters because atmospheric composition and circulation shape heat, moisture, air quality, and weather.',
    oceans: 'It matters because ocean heat, chemistry, circulation, and food webs regulate climate and support coastal livelihoods.',
    cryosphere: 'It matters because snow, ice, and frozen ground regulate reflectivity, freshwater timing, sea level, and cold-region stability.',
    biosphere: 'It matters because ecosystem function supports biodiversity, carbon storage, water cycling, food, and protection from hazards.',
    freshwater: 'It matters because freshwater timing, quantity, and quality support households, ecosystems, farming, energy, and industry.',
    agriculture: 'It matters because farming connects food security with soil, water, climate, labor, and biodiversity.',
    health: 'It matters because the condition changes exposure, illness, mortality, or the capacity of health systems to protect people.',
    energy: 'It matters because energy systems shape emissions, affordability, air quality, water use, and infrastructure reliability.',
    digital: 'It matters because digital infrastructure concentrates electricity, cooling, water, materials, and network reliability demands.',
    transport: 'It matters because transport systems connect mobility and trade with fuel use, pollution, land, and infrastructure risk.',
    economy: 'It matters because prices, finance, insurance, and supply chains determine how environmental costs and risks are distributed.',
    sociopolitical: 'It matters because governance, inequality, displacement, and public capacity determine who is protected and who bears the loss.'
  };
  return importanceBySphere[node.sphere] || 'It matters because the condition can alter connected human and Earth systems.';
}

function removeRepeatedHeading(node, text) {
  const compact = normalizeSentence(text);
  if (!compact.toLocaleLowerCase().startsWith(node.name.toLocaleLowerCase())) return compact;
  let remainder = compact.slice(node.name.length).trim();
  remainder = remainder.replace(/^(?:is|are)\s+/i, '');
  return normalizeSentence(remainder);
}

function buildReaderMeaning(node, graph) {
  const existingMeaning = normalizeSentence(node.readerMeaning);
  if (existingMeaning && !READER_METHODOLOGY_PATTERN.test(existingMeaning)) {
    return {
      text: existingMeaning,
      basis: node.readerMeaningBasis || 'authored_node_meaning_v1',
      supportingEdgeKey: node.readerMeaningSupportingEdgeKey || null
    };
  }

  const curatedMeaning = normalizeSentence(CURATED_READER_MEANINGS[node.id]);
  if (curatedMeaning) {
    return {
      text: curatedMeaning,
      basis: 'curated_reader_meaning_v1',
      supportingEdgeKey: null
    };
  }

  if (node.node_kind === 'response') {
    return {
      text: normalizeSentence(node.responseProfile?.summary || node.description),
      basis: 'curated_response_meaning_v1',
      supportingEdgeKey: null
    };
  }

  const narrativeDescription = narrativeNodeDescription(node);
  if (narrativeDescription) {
    return {
      text: narrativeDescription,
      basis: 'authored_description_meaning_v1',
      supportingEdgeKey: null
    };
  }

  const meaningEdge = pickMeaningEdge(node, graph);
  if (meaningEdge) {
    return {
      text: `${standaloneNodeDefinition(node)} ${meaningEdge.text}`,
      basis: 'standalone_relationship_meaning_v2',
      supportingEdgeKey: edgeKey(meaningEdge.edge)
    };
  }

  return {
    text: `${standaloneNodeDefinition(node)} ${standaloneImportance(node)}`,
    basis: 'standalone_definition_meaning_v2',
    supportingEdgeKey: null
  };
}

function naturalList(items) {
  const unique = [...new Set(items.filter(Boolean))];
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(', ')}, and ${unique.at(-1)}`;
}

function sourceLocators(edge) {
  const readback = edge?.evidence?.source_readback;
  const estimate = edge?.evidence?.quantitative_evidence
    ?.relationship_quantification?.scientific_effect_estimate;
  const candidates = [
    ...(readback?.source_locators || []),
    ...(edge?.evidence?.relationship_source_urls || []).map(url => ({ url })),
    ...(edge?.evidence?.source_urls || []).map(url => ({ url })),
    ...(estimate?.source_locator ? [estimate.source_locator] : [])
  ];
  return candidates
    .map(locator => typeof locator === 'string' ? locator : locator?.url)
    .filter(url => /^https?:\/\//.test(url || ''));
}

function edgeKey(edge) {
  return `${edge.source}->${edge.target}`;
}

function buildGraph(nodes, edges) {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const outgoing = new Map(nodes.map(node => [node.id, []]));
  const incoming = new Map(nodes.map(node => [node.id, []]));
  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge);
    incoming.get(edge.target)?.push(edge);
  }
  return { nodeById, outgoing, incoming };
}

function findPaths(startId, graph, endpointTest, maxDepth = 3, limit = 24) {
  const paths = [];
  const queue = [{ id: startId, edges: [], visited: new Set([startId]) }];
  while (queue.length && paths.length < limit) {
    const state = queue.shift();
    if (state.edges.length >= maxDepth) continue;
    for (const edge of graph.outgoing.get(state.id) || []) {
      if (state.visited.has(edge.target)) continue;
      const target = graph.nodeById.get(edge.target);
      if (!target) continue;
      const nextEdges = [...state.edges, edge];
      if (endpointTest(target)) {
        paths.push(nextEdges);
        if (paths.length >= limit) break;
      }
      queue.push({
        id: edge.target,
        edges: nextEdges,
        visited: new Set([...state.visited, edge.target])
      });
    }
  }
  return paths;
}

function humanDomain(node) {
  const text = `${node?.id || ''} ${node?.name || ''}`.toLowerCase();
  if (/(mortality|health|disease|pathogen|smoke|pm2|pollution|heat|ozone|toxic|pollen)/.test(text)) return 'health and safety';
  if (/(food|crop|farm|fish|livestock|fertilizer|pollinator|agricultur)/.test(text)) return 'food security and livelihoods';
  if (/(water|aquifer|reservoir|drought|flood|sewer|wastewater|salin)/.test(text)) return 'water security and sanitation';
  if (/(grid|power|energy|airport|shipping|transport|bridge|rail|infrastructure|telecom|cable|data_center)/.test(text)) return 'essential services and infrastructure';
  if (/(insurance|mortgage|price|afford|capital|supply_chain|mining|fashion|petrochemical)/.test(text)) return 'household costs and economic security';
  if (/(migration|relocation|conflict|humanitarian|governance|litigation)/.test(text)) return 'housing, displacement, and public services';
  return 'health, livelihoods, and essential services';
}

function planetDomain(node) {
  const sphere = node?.sphere;
  if (sphere === 'atmosphere') return 'atmospheric chemistry and climate stability';
  if (sphere === 'biosphere') return 'biodiversity, habitat, and ecosystem resilience';
  if (sphere === 'cryosphere') return 'ice, snow, frozen ground, and albedo';
  if (sphere === 'freshwater') return 'freshwater timing, quality, and aquatic habitat';
  if (sphere === 'oceans') return 'ocean chemistry, circulation, and marine food webs';
  if (sphere === 'agriculture') return 'soil, water, nutrient cycles, and working landscapes';
  return 'climate, ecological, and resource systems';
}

function indirectHumanSummary(node) {
  if (node.sphere === 'atmosphere') {
    return `${node.name} can affect health, agriculture, and infrastructure when atmospheric conditions change exposure or hazard severity.`;
  }
  if (node.sphere === 'biosphere') {
    return `${node.name} can affect food, water, income, and cultural well-being where communities depend on functioning ecosystems.`;
  }
  if (node.sphere === 'cryosphere') {
    return `${node.name} can affect water supply, transport, settlements, and safety where people depend on stable snow, ice, or frozen ground.`;
  }
  if (node.sphere === 'oceans') {
    return `${node.name} can affect fisheries, coastal protection, food supply, and livelihoods where communities depend on marine systems.`;
  }
  return `${node.name} can affect human well-being when the measured condition reaches exposed communities, livelihoods, or essential services.`;
}

function impactConsequence(node, path, graph, mode) {
  const firstEdge = path[0];
  const firstMechanism = firstSentence(firstEdge.relationship_description);
  const endpoint = graph.nodeById.get(path.at(-1).target);
  if (path.length === 1) return firstMechanism;
  const intermediates = path
    .slice(0, -1)
    .map(edge => graph.nodeById.get(edge.target)?.name)
    .filter(Boolean);
  const domain = mode === 'human' ? humanDomain(endpoint) : planetDomain(endpoint);
  return `${firstMechanism} Downstream changes in ${naturalList(intermediates)} can then affect ${domain} through ${endpoint.name}.`;
}

function buildImpactProfile(node, graph, mode) {
  const isHuman = mode === 'human';
  const nodeIsEndpoint = isHuman
    ? ['health', 'sociopolitical'].includes(node.sphere)
      || (HUMAN_SPHERES.has(node.sphere) && HUMAN_OUTCOME_PATTERN.test(node.id))
      || HUMAN_NATURAL_SELF_PATTERN.test(node.id)
    : PLANET_SPHERES.has(node.sphere) || PLANET_SELF_PATTERN.test(node.id);
  const endpointTest = candidate => (
    candidate.id !== node.id
    && candidate.node_kind !== 'response'
    && (isHuman
      ? HUMAN_SPHERES.has(candidate.sphere) && HUMAN_OUTCOME_PATTERN.test(candidate.id)
      : PLANET_ENDPOINT_SPHERES.has(candidate.sphere))
  );
  const candidatePaths = nodeIsEndpoint
    ? (graph.outgoing.get(node.id) || [])
      .filter(edge => endpointTest(graph.nodeById.get(edge.target)))
      .map(edge => [edge])
    : findPaths(node.id, graph, endpointTest);
  const paths = [];
  const firstEdgeKeys = new Set();
  for (const path of candidatePaths) {
    const firstKey = edgeKey(path[0]);
    if (firstEdgeKeys.has(firstKey)) continue;
    firstEdgeKeys.add(firstKey);
    paths.push(path);
    if (paths.length === 3) break;
  }

  const endpoints = paths
    .map(path => graph.nodeById.get(path.at(-1).target))
    .filter(Boolean);
  const domains = isHuman
    ? endpoints.map(humanDomain)
    : endpoints.map(planetDomain);
  let consequences = [...new Set(paths
    .map(path => impactConsequence(node, path, graph, mode))
    .filter(Boolean))]
    .slice(0, 3);
  const endpointNames = [...new Set(endpoints.map(endpoint => endpoint.name))].slice(0, 3);
  if (!consequences.length && nodeIsEndpoint) {
    consequences = [
      `${isHuman ? 'Human exposure' : 'Planetary change'} is assessed through ${node.metric_contract?.metric_name || node.name}; comparisons must preserve the declared geography, period, and uncertainty.`
    ];
  } else if (!consequences.length && isHuman) {
    consequences = [
      narrativeNodeDescription(node)
      || `Human relevance is assessed through ${node.metric_contract?.metric_name || node.name}; comparisons must preserve the declared geography, period, and uncertainty.`
    ];
  }

  const summary = nodeIsEndpoint
    ? narrativeNodeDescription(node)
      || (isHuman
        ? `${node.name} directly represents pressure on ${humanDomain(node)}, measured through ${node.metric_contract?.metric_name || 'its declared indicator'}.`
        : `${node.name} directly changes ${planetDomain(node)}, measured through ${node.metric_contract?.metric_name || 'its declared indicator'}.`)
    : endpointNames.length
    ? `${node.name} can affect ${naturalList([...new Set(domains)])} through ${naturalList(endpointNames)}.`
    : isHuman
      ? indirectHumanSummary(node)
      : `${node.name} has no direct Earth-system outcome established in the current graph; its relevance is limited to the measured condition until a downstream ecological effect is verified.`;

  return {
    summary,
    domains: domains.length
      ? [...new Set(domains)].slice(0, 4)
      : [isHuman ? 'No direct human outcome established' : 'No direct Earth-system outcome established'],
    ...(isHuman
      ? { affectedPopulations: endpointNames.length ? endpointNames : [humanDomain(node)] }
      : { affectedSystems: endpointNames.length ? endpointNames : [planetDomain(node)] }),
    consequences: consequences.length
      ? consequences
      : [isHuman
        ? `No direct human consequence is inferred beyond the current evidence boundary for ${node.name}.`
        : `No direct planetary consequence is inferred beyond the current evidence boundary for ${node.name}.`],
    timeHorizon: node.context?.time || 'varies_by_relationship',
    confidence: 'evidence_derived',
    basis: 'evidence_derived_node_v1',
    derivationMode: paths.length
      ? 'relationship_path'
      : nodeIsEndpoint || isHuman
        ? 'node_definition'
        : 'explicit_no_direct_outcome',
    supportingEdgeKeys: [...new Set(paths.flat().map(edgeKey))]
  };
}

function actionFamily(node) {
  const text = `${node.id} ${node.name}`.toLowerCase();
  if (node.node_kind === 'response') return 'response';
  if (NATURAL_VARIABILITY_PATTERN.test(node.id)) return 'variability';
  if (node.sphere === 'health') return 'health';
  if (/(spill|wastewater|incineration|flaring|pesticide|pollution)/.test(text)) return 'pollution';
  if (node.sphere === 'transport') return 'transport';
  if (/(food_waste|waste incineration|open-burning)/.test(text)) return 'waste';
  if (node.sphere === 'cryosphere') return 'cryosphere';
  if (node.sphere === 'oceans' && /(habitat|biodiversity|species|mangrove|reef|kelp|seagrass|ecosystem|coral|nursery)/.test(text)) return 'ecosystem';
  if (node.sphere === 'oceans') return 'ocean';
  if (node.sphere === 'freshwater' || /(water|aquifer|reservoir|drought|flood|sewer|salin|inundation|hypoxia|eutroph|algal|runoff)/.test(text)) return 'water';
  if (node.sphere === 'agriculture' || /(food|crop|farm|livestock|fertilizer|agricultur|fishery)/.test(text)) return 'food';
  if (/(emission|pollution|pesticide|spill|soot|particulate|sulfur|ozone|microplastic|heavy_metal|nitrous|methane|wastewater|incineration|flaring)/.test(text)) return 'pollution';
  if (/(forest|habitat|biodiversity|species|pollinator|wetland|peat|mangrove|reef|kelp|seagrass|ecosystem|soil|erosion|desert|savanna|mussel)/.test(text)) return 'ecosystem';
  if (/(grid|power|energy|electric|transformer|transmission|cement|steel|industrial|data_center|semiconductor|cooling|refrigerant)/.test(text)) return 'infrastructure';
  if (/(insurance|mortgage|afford|migration|relocation|conflict|humanitarian|governance|price|capital|supply_chain)/.test(text)) return 'social';
  if (/(heat|temperature|cyclone|precipitation|storm|lightning|wildfire|atmospheric|cloud|humidity)/.test(text)) return 'climate_hazard';
  return 'system';
}

function buildSystemLevers(node, family) {
  const metric = node.metric_contract?.metric_name || node.name;
  if (family === 'variability') {
    return [
      `Use forecasts and observations of ${metric} to prepare exposed regions before ${node.name} changes seasonal conditions.`,
      `Update water, food, health, and emergency plans for the specific regional hazards associated with ${node.name}.`,
      `Avoid treating ${node.name} as controllable; reduce exposure and improve readiness for its documented effects.`
    ];
  }
  if (family === 'pollution') {
    return [
      `Prevent ${node.name} at its source through enforceable emissions, discharge, product, or process standards.`,
      `Measure ${metric} at the facilities and places where exposure or ecological damage can occur.`,
      `Require cleanup, repair, or safer substitution when monitoring shows ${node.name} exceeds the declared threshold.`
    ];
  }
  if (family === 'waste') {
    return [
      `Prevent ${node.name} before disposal through better purchasing, storage, product design, recovery, and reuse.`,
      `For ${node.name}, separate unavoidable organic or material waste from landfill and open burning, and capture residual emissions where treatment is required.`,
      `Track ${node.metric_contract?.metric_name || node.name} by source and stage so prevention targets the largest avoidable losses.`
    ];
  }
  if (family === 'health') {
    return [
      `Reduce the hazardous exposure that produces ${node.name}, using source controls and protections suited to the affected population.`,
      `Use ${node.metric_contract?.metric_name || node.name} to trigger public-health warnings, outreach, clinical capacity, and worker safeguards for ${node.name}.`,
      `Prioritize people affected by ${node.name} who have limited access to cooling, clean air, care, safe work, food, or water.`
    ];
  }
  if (family === 'transport') {
    return [
      `Reduce the emissions, land use, fuel dependence, and disruption associated with ${node.name} through cleaner modes and better network planning.`,
      `Use ${node.metric_contract?.metric_name || node.name} to identify where efficiency, maintenance, redundancy, or demand alternatives have the greatest effect.`,
      `While addressing ${node.name}, protect access and affordability so transport changes do not shift costs or isolation onto people with the fewest alternatives.`
    ];
  }
  if (family === 'ecosystem') {
    return [
      `Protect intact habitat and remove the direct pressures driving ${node.name} before restoration becomes the only option.`,
      `Restore connectivity, hydrology, water quality, habitat structure, or native species where those mechanisms limit recovery from ${node.name}.`,
      `Track ${metric} against a fixed ecological baseline so apparent recovery is not confused with a shifting reference.`
    ];
  }
  if (family === 'water') {
    return [
      `Manage withdrawals, runoff, storage, and treatment around the local mechanism driving ${node.name}.`,
      `Use ${metric} to trigger conservation, infrastructure, or water-quality action before service or ecosystem failure.`,
      `Protect environmental flows and prioritize safe household supply when ${node.name} creates competing water demands.`
    ];
  }
  if (family === 'infrastructure') {
    return [
      `Include ${node.name} in infrastructure planning, procurement, reliability standards, and long-lived investment decisions.`,
      `Use ${metric} to identify capacity, cooling, supply-chain, or resilience gaps before assets fail or lock in higher emissions.`,
      `When addressing ${node.name}, pair efficiency and demand management with cleaner supply, redundancy, and protection for affected communities.`
    ];
  }
  if (family === 'food') {
    return [
      `Reduce the soil, water, chemical, heat, and supply-chain pressures that drive ${node.name} in the affected production system.`,
      `Diversify crops, inputs, suppliers, and livelihoods so one shock does not turn ${node.name} into a wider food-security failure.`,
      `Track ${metric} by crop, region, and season and direct support toward producers and households with the least capacity to absorb losses.`
    ];
  }
  if (family === 'social') {
    return [
      `Change the finance, protection, and governance rules that allow ${node.name} to concentrate losses on exposed households.`,
      `Fund early intervention using ${metric} rather than waiting for a crisis to become a permanent social or fiscal burden.`,
      `When responding to ${node.name}, give affected communities decision-making power and protect access to housing, services, income, and recovery support.`
    ];
  }
  if (family === 'ocean') {
    return [
      `Reduce the greenhouse-gas forcing and, where relevant, local pollution or physical disturbance that intensifies ${node.name}.`,
      `Monitor ${metric} consistently so fisheries, conservation, and coastal decisions follow the observed location, depth, and season of change.`,
      `Protect marine habitat and exposed coastal communities while avoiding claims that ${node.name} can be reversed through one local intervention.`
    ];
  }
  if (family === 'cryosphere' || family === 'climate_hazard') {
    return [
      `Cut the greenhouse-gas emissions that intensify ${node.name} while distinguishing global forcing from local attribution.`,
      `Monitor ${metric} consistently so adaptation decisions follow the observed rate, location, and season of change.`,
      `Protect exposed communities and ecosystems through hazard-specific planning rather than assuming ${node.name} can be reversed locally.`
    ];
  }
  return [
    `Address the verified upstream pressures that increase ${node.name} rather than treating the observed outcome in isolation.`,
    `Use ${metric} to test whether policy or operational changes are reducing the condition.`,
    `Direct protection and investment toward the people, infrastructure, and ecosystems most exposed to ${node.name}.`
  ];
}

function fallbackDefaultDriver(node, family) {
  if (/(?:co2 output|co2 release)/i.test(node.name)) {
    const text = `${node.id} ${node.name}`.toLowerCase();
    if (/deforestation/.test(text)) return 'Forest clearing releases carbon stored in vegetation and soils when conversion outpaces regrowth and long-term restoration.';
    if (/peatland/.test(text)) return 'Drainage exposes peat to oxygen, sustaining carbon-dioxide release until the water table and peat-forming vegetation are restored.';
    if (/land.use.fire/.test(text)) return 'Burning forests, peat, grassland, or cleared biomass transfers land carbon to the atmosphere and can recur where fire follows conversion or degradation.';
    if (/waste/.test(text)) return 'Incineration and open burning release fossil carbon contained in plastics and other waste where prevention, reuse, and material recovery remain limited.';
    if (/flaring/.test(text)) return 'Routine and emergency flaring oxidize oil-and-gas carbon to carbon dioxide where gas capture, utilization, or shutdown requirements are absent.';
    if (/aviation/.test(text)) return 'Aircraft continue burning fossil jet fuel where flight demand grows faster than efficiency, sustainable fuels, and practical alternatives.';
    if (/shipping|navigation/.test(text)) return 'Marine engines continue burning fossil bunker fuels while fleet turnover and zero-emission fuel and port infrastructure remain slow.';
    if (/passenger.road/.test(text)) return 'Private cars and light vehicles continue burning gasoline and diesel where travel demand, vehicle fleets, and land use remain car-dependent.';
    if (/freight/.test(text)) return 'Heavy road freight continues burning diesel where logistics demand, charging networks, vehicle cost, and fleet turnover delay cleaner trucks.';
    if (/rail/.test(text)) return 'Diesel locomotives continue emitting carbon dioxide on routes where traffic, infrastructure, and procurement have not justified electrification or lower-emission traction.';
    if (/residential/.test(text)) return 'Homes continue burning fossil gas for heat where building envelopes, equipment turnover, electricity capacity, and retrofit finance delay cleaner systems.';
    if (/commercial/.test(text)) return 'Commercial buildings continue burning fossil gas where equipment replacement, efficiency upgrades, and clean-heating requirements lag.';
    if (/oil.building/.test(text)) return 'Buildings continue burning heating oil where old boilers, fuel delivery systems, and retrofit barriers slow conversion to efficient clean heat.';
    if (/backup/.test(text)) return 'Backup generators continue burning fossil fuel where critical loads lack cleaner storage, resilient grids, or low-emission standby alternatives.';
    if (/coal.power/.test(text)) return 'Coal-fired power plants release carbon dioxide as coal is oxidized, sustained by electricity demand, existing assets, fuel supply, and delayed retirement.';
    if (/gas.power/.test(text)) return 'Gas-fired power plants release carbon dioxide during combustion, sustained by electricity demand, existing assets, fuel supply, and reliability rules.';
    if (/oil.power/.test(text)) return 'Oil-fired power plants release carbon dioxide during combustion where liquid-fuel generation remains part of the electricity supply.';
    if (/coal.industrial.heat/.test(text)) return 'Industrial boilers and furnaces release carbon dioxide while high-temperature heat remains dependent on coal and coal-derived fuels.';
    if (/gas.industrial.heat/.test(text)) return 'Industrial boilers and furnaces release carbon dioxide while high-temperature heat remains dependent on fossil gas.';
    if (/cement.kiln/.test(text)) return 'Cement kilns release combustion carbon dioxide while coal, petroleum coke, gas, or other fossil fuels provide process heat.';
    if (/iron.steel|metal industry/.test(text)) return 'Steel and metal production release fossil carbon through coke, reducing agents, process heat, and electricity where lower-emission routes remain limited.';
    if (/chemical/.test(text)) return 'Chemical production releases fossil carbon through feedstocks, process heat, and reactions where material demand and lower-emission substitutes remain limited.';
    if (/refinery/.test(text)) return 'Refineries release carbon dioxide from process heaters, hydrogen production, utilities, and fuel combustion while petroleum throughput remains high.';
    if (/construction/.test(text)) return 'Construction-material production releases carbon dioxide through fuel use and process chemistry while material demand and low-carbon procurement remain unchanged.';
    if (/hydrogen/.test(text)) return 'Fossil hydrogen production releases carbon dioxide when natural gas or coal is converted without high capture rates and durable storage.';
  }
  if (family === 'variability') {
    return `${node.name} arises from internal atmosphere-ocean dynamics; the practical default is continued exposure where forecasts and regional planning do not account for its changing phase.`;
  }
  if (family === 'pollution' || family === 'waste') {
    return `${node.name} persists where prevention, containment, treatment, monitoring, and liability rules remain weaker or more expensive than releasing the waste or pollutant.`;
  }
  if (family === 'ecosystem') {
    return `${node.name} continues where land conversion, extraction, fragmentation, altered hydrology, or weak habitat protection prevents ecological recovery.`;
  }
  if (family === 'infrastructure' || family === 'transport') {
    return `${node.name} persists where long-lived assets, procurement, market rules, and network planning continue to favor the incumbent system over cleaner or more resilient alternatives.`;
  }
  if (family === 'water') {
    return `${node.name} persists where withdrawals, drainage, runoff, storage, treatment, and land-use decisions exceed the capacity of the local water system.`;
  }
  return `${node.name} persists when upstream pressures remain unmanaged and institutions do not respond to its declared indicator.`;
}

function buildEconomicContext(node, graph) {
  const incoming = graph.incoming.get(node.id) || [];
  const outgoing = graph.outgoing.get(node.id) || [];
  const supportEdges = [...incoming, ...outgoing].slice(0, 6);
  const primaryDriver = incoming.find(edge => (
    edge.influence >= 0
    && edge.evidence?.quantitative_evidence?.effect_direction !== 'decreases_or_constrains_target'
    && graph.nodeById.get(edge.source)?.node_kind !== 'response'
  ));
  const family = actionFamily(node);
  const defaultDriver = ECONOMIC_CONTEXT_RELEVANCE_OVERRIDES[node.id]
    || narrativeNodeDescription(node)
    || (primaryDriver
      ? firstSentence(primaryDriver.relationship_description)
      : fallbackDefaultDriver(node, family));
  return {
    hiddenCost: `The costs created by ${node.name} are not fully reflected when decisions omit its effects on ${humanDomain(node)} and on ${planetDomain(node)}.`,
    whoPays: `People and ecosystems exposed to ${node.name} bear the greatest burden where protection, alternatives, monitoring, or recovery capacity are limited.`,
    physicalLimit: `The relevant constraint is ${node.metric_contract?.metric_name || node.name}, measured within its declared geography, period, and uncertainty rather than assumed from the label alone.`,
    defaultDriver,
    systemLevers: buildSystemLevers(node, family),
    sourceUrls: [...new Set(supportEdges.flatMap(sourceLocators))].slice(0, 5),
    evidenceBoundary: `This node-level guidance is derived from the reviewed relationships incident to ${node.name}. It does not establish that every listed intervention works in every geography or time period.`,
    verdict: 'evidence_derived',
    confidence: 'evidence_derived',
    basis: 'evidence_derived_node_v1',
    supportingEdgeKeys: supportEdges.map(edgeKey)
  };
}

export function attachCompleteNodeInspectorProfiles(nodes, edges) {
  const graph = buildGraph(nodes, edges);
  return nodes.map(node => {
    const readerMeaning = buildReaderMeaning(node, graph);
    const finalReaderMeaning = normalizeSentence(
      READER_MEANING_OPENING_OVERRIDES[node.id]
      || (readerMeaning.basis === 'standalone_relationship_meaning_v2'
        ? removeRepeatedHeading(node, readerMeaning.text)
        : readerMeaning.text)
    );
    const existingEconomic = node.economicContext;
    const incidentEdges = [
      ...(graph.incoming.get(node.id) || []),
      ...(graph.outgoing.get(node.id) || [])
    ].slice(0, 6);
    const completeEconomicEvidence = context => context ? {
      ...context,
      sourceUrls: Array.isArray(context.sourceUrls) && context.sourceUrls.length
        ? context.sourceUrls
        : [...new Set(incidentEdges.flatMap(sourceLocators))].slice(0, 5),
      evidenceBoundary: context.evidenceBoundary
        || `This guidance is bounded to the reviewed relationships and measurement contract for ${node.name}.`,
      supportingEdgeKeys: Array.isArray(context.supportingEdgeKeys) && context.supportingEdgeKeys.length
        ? context.supportingEdgeKeys
        : incidentEdges.map(edgeKey)
    } : null;
    const responseBarrier = String(existingEconomic?.hiddenCost || 'upfront cost, delivery capacity, and uneven access')
      .replace(/[.!?]+$/, '')
      .replace(/^(?:requires?|needs?)\s+/i, '')
      .replace(/^./, character => character.toLocaleLowerCase());
    const responseEconomic = node.node_kind === 'response' && existingEconomic
      ? {
        ...existingEconomic,
        defaultDriver: `The main barriers to ${node.name} are ${responseBarrier}.`
      }
      : existingEconomic;
    const responsePlanetImpact = node.node_kind === 'response'
      && node.planetImpact
      && /^This response reduces pressure on climate and ecological systems/i.test(node.planetImpact.summary || '')
      ? {
        ...node.planetImpact,
        summary: `${node.name} ${agreeRelationshipVerbPhrase(node, 'benefits')} the planet because ${getRelationshipSubjectPronoun(node)} ${agreeRelationshipVerbPhrase(node, String(node.planetImpact.consequences?.[0] || 'reduces climate and ecological pressure').replace(/[.!?]+$/, '').replace(/^./, character => character.toLocaleLowerCase()))}.`
      }
      : node.planetImpact;
    const relevantEconomic = responseEconomic && ECONOMIC_CONTEXT_RELEVANCE_OVERRIDES[node.id]
      ? {
        ...responseEconomic,
        defaultDriver: ECONOMIC_CONTEXT_RELEVANCE_OVERRIDES[node.id]
      }
      : responseEconomic;
    return {
      ...node,
      readerMeaning: finalReaderMeaning,
      readerMeaningBasis: readerMeaning.basis,
      readerMeaningSupportingEdgeKey: readerMeaning.supportingEdgeKey,
      humanImpact: node.humanImpact || buildImpactProfile(node, graph, 'human'),
      planetImpact: responsePlanetImpact || buildImpactProfile(node, graph, 'planet'),
      economicContext: completeEconomicEvidence(relevantEconomic || buildEconomicContext(node, graph))
    };
  });
}
