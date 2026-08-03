function normalizeSentence(text) {
  const compact = String(text || '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
  if (!compact) return '';
  const capitalized = compact.charAt(0).toUpperCase() + compact.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function limitToTwoSentences(text) {
  return String(text).split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2).join(' ');
}

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function descriptionTokens(text) {
  const ignored = new Set([
    'about', 'after', 'again', 'against', 'along', 'also', 'among', 'because',
    'been', 'being', 'between', 'could', 'does', 'from', 'have', 'into', 'more',
    'other', 'over', 'such', 'than', 'that', 'their', 'there', 'these', 'they',
    'this', 'through', 'under', 'when', 'where', 'which', 'while', 'with', 'would'
  ]);
  return new Set(
    String(text || '')
      .toLocaleLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 3 && !ignored.has(token))
  );
}

function isComplementaryDescription(primary, candidate) {
  if (!primary || !candidate) return false;
  const normalizedPrimary = normalizeSentence(primary).toLocaleLowerCase();
  const normalizedCandidate = normalizeSentence(candidate).toLocaleLowerCase();
  if (normalizedPrimary === normalizedCandidate) return false;

  const primaryTokens = descriptionTokens(primary);
  const candidateTokens = descriptionTokens(candidate);
  if (!primaryTokens.size || !candidateTokens.size) return false;
  const shared = [...candidateTokens].filter(token => primaryTokens.has(token)).length;
  return shared / Math.min(primaryTokens.size, candidateTokens.size) < 0.72;
}

function isMaintenanceSentence(sentence) {
  return /(?:Contract repair|Priority-anchor promotion|Research-track rehabilitation|backlog rehabilitation|Exact-term promotion|Promoted from exact-term ontology|promoted to anchor status|treated as (?:a|the) .*anchor|kept as (?:a|the) .*anchor|used here as (?:a|the) anchor|This anchor\b|documented system pathway|local attribution is not implied|scope, moderators, and counterevidence|bounded by the attached|relationship is limited to the stated|effect is bounded to surveyed|display\/salience weight|graph influence|forcing proxy|downstream attribution)/i.test(sentence);
}

function cleanEvidenceText(text) {
  return String(text || '')
    .replace(/^Research supports this (?:bounded|direct) pathway:\s*/i, '')
    .replace(/;\s*this edge[^.]*\.?/gi, '.')
    .replace(/;\s*the edge is bounded[^.]*\.?/gi, '.')
    .replace(/;\s*local attribution is not implied[^.]*\.?/gi, '.')
    .replace(/\bthe edge does not assign a universal causal direction\b/gi, 'the association does not establish a universal causal direction')
    .replace(/\bThe edge represents a groundwater-budget condition, not a claim that every reported withdrawal causes depletion\b/gi, 'Depletion occurs only where sustained withdrawals exceed recharge; a reported withdrawal alone does not establish aquifer decline')
    .replace(/\s*The signed (?:positive|negative) influence[^.]*\.?/gi, '')
    .replace(/\ba defensible upstream\b/gi, 'an upstream')
    .replace(/\ba upstream\b/gi, 'an upstream')
    .replace(/\bdefensible\s+/gi, '')
    .replace(/\bgrounded\s+(?=(?:upstream|downstream|neighboring|local|transition))/gi, '')
    .replace(/\ba upstream\b/gi, 'an upstream')
    .replace(/\bbounded pathway\b/gi, 'specific pathway')
    .replace(/\bbounded component\b/gi, 'defined component')
    .replace(/\bbounded current-regime pathway\b/gi, 'specific current-regime pathway')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => !isMaintenanceSentence(sentence))
    .join(' ')
    .trim();
}

function isReaderFacingDescription(text) {
  const normalized = cleanEvidenceText(text);
  if (countWords(normalized) < 10) return false;
  return !(
    /^This edge\b/i.test(normalized)
    || /can condition .+ through the reviewed .+ mechanism/i.test(normalized)
    || /through adjacent systems|Priority-anchor promotion|Contract repair/i.test(normalized)
    || /loads instability into|loads heat into|warms into/i.test(normalized)
    || /^(?:Can|Constrains|Coordinates|Creates|Improves|Reduces|Increases|Raises|Amplifies|Supports|Enables|Adds|Shifts|Lowers|Limits|Protects|Avoids|Cuts|Builds|Warms)\b/i.test(normalized)
    || /\b(?:pressure from through|pressure on through|exposure to by|performance of by|demand for when|relief from when)\b/i.test(normalized)
  );
}

const RELATIONSHIP_DESCRIPTION_OVERRIDES = Object.freeze({
  'peat_oxidation_pulse->carbon_emission': 'Aerobic decomposition of drained peat releases stored carbon as carbon dioxide, while peat fires add a faster pulse of greenhouse-gas emissions. Both pathways move long-stored soil carbon into the atmosphere and increase the peatland’s contribution to climate warming.',
  'wastewater_bypass_discharge->kelp_forest_collapse': 'Sewage and related contaminants from wastewater bypass discharge reduce water and sediment quality, impairing kelp growth and reproduction in exposed nearshore habitat. Repeated or sustained exposure can shrink canopy area and prevent recovery, contributing to kelp forest collapse when plume transport, concentration, duration and biological observations confirm contact.',
  'tundra_methane_outgassing->methane': 'Methane produced in thawing tundra soils, wetlands and lakes can escape into the atmosphere when microbial production exceeds oxidation. The added methane strengthens near-term warming, although fluxes vary sharply with soil moisture, temperature and transport pathways.',
  'mountain_pass_avalanches->critical_infrastructure_fragility': 'Avalanches can bury or damage mountain roads, rail lines, power equipment and communications routes, forcing closures and emergency repairs. Repeated disruption weakens the reliability of infrastructure networks that depend on a small number of exposed mountain corridors.',
  'ice_shelf_grounding_line_retreat->sea_level_rise': 'When an ice shelf grounding line retreats inland, the loss of basal contact can reduce resistance to glacier flow. Faster discharge of grounded ice transfers more land ice into the ocean and raises sea level.',
  'arctic_pack_ice_drift->shipping_lane_disruption': 'Drifting Arctic pack ice can move into planned vessel routes, narrow safe passages and force icebreaker assistance or rerouting. Rapid changes in ice position can delay transits even during seasons with relatively low total ice cover.',
  'ice_algae_pigmentation->marine_food_web_simplification': 'Changes in ice-algae biomass and pigmentation alter the timing and amount of food available at the base of polar marine food webs. A weaker or mistimed algal pulse can reduce energy transfer to zooplankton and the fish, seabirds and mammals that feed above them.',
  'glacier_hydrologic_system_floods->river_flow_regime_shift': 'Glacier outburst floods release stored meltwater abruptly, producing discharge peaks far above normal seasonal flow. Repeated drainage events can shift the timing, magnitude and sediment load of downstream river flow.',
  'ice_cap_decapitation->sea_level_rise': 'Loss of an ice cap’s high-elevation summit removes long-lived land ice and can expose darker terrain that accelerates remaining melt. Water released from that shrinking ice mass ultimately contributes to global sea-level rise.',
  'nunatak_habitat_shrinkage->biodiversity_intactness_loss': 'Shrinking ice-free nunatak habitat reduces the area and connectivity available to cold-adapted plants, invertebrates and nesting species. Small isolated populations then face greater local-extinction risk, lowering biodiversity intactness across the exposed landscape.',
  'carbon_emission->extreme_precipitation_intensity': 'Carbon-dioxide emissions warm the atmosphere, increasing the amount of water vapor it can hold. When storms have sufficient lift and moisture supply, that higher ceiling allows heavier precipitation.',
  'carbon_emission->tropical_cyclone_rapid_intensification': 'Carbon-dioxide emissions add ocean and atmospheric heat that can provide more energy for tropical cyclones. In otherwise favorable conditions, warmer upper-ocean water increases the potential for rapid intensification.',
  'carbon_emission->heat_related_mortality_burden': 'Carbon-dioxide emissions raise baseline temperatures and make dangerous heat more frequent and intense. Longer exposure increases dehydration, cardiovascular strain and mortality, especially where cooling and health care are limited.',
  'carbon_emission->occupational_heat_exposure': 'Carbon-dioxide emissions intensify heat and humidity, reducing the time people can safely perform strenuous outdoor or uncooled work. Workers face greater heat illness and productivity loss as safe work-rest limits are exceeded.',
  'carbon_emission->soil_moisture_collapse': 'Carbon-dioxide-driven warming increases evaporation and plant water demand, drawing moisture from the root zone faster. Soil moisture can fall sharply when rainfall and irrigation do not replace those losses.',
  'carbon_emission->drought_persistence': 'Carbon-dioxide emissions warm land and increase atmospheric demand for moisture. Where precipitation remains deficient, faster drying can deepen soil and vegetation stress and allow drought conditions to persist.',
  'carbon_emission->snow_drought': 'Carbon-dioxide-driven warming causes more winter precipitation to fall as rain and accelerates melt from the snowpack. Mountain basins can enter snow drought when seasonal snow-water storage falls well below its expected level.',
  'carbon_emission->oceanic_deoxygenation': 'Carbon-dioxide-driven warming reduces oxygen solubility and strengthens ocean stratification, limiting ventilation of deeper water. Those changes contribute to long-term oxygen decline across open-ocean and abyssal layers.',
  'carbon_emission->coastal_hypoxia': 'Carbon-dioxide-driven warming reduces oxygen solubility and can strengthen coastal stratification. In nutrient-rich waters, weaker mixing and faster biological respiration increase the risk of low-oxygen events.',
  'carbon_emission->marine_food_web_simplification': 'Carbon emissions alter ocean temperature, acidity, oxygen and circulation, shifting which species can survive and where prey remains available. Repeated losses of sensitive or specialized species can simplify marine food-web structure.',
  'carbon_emission->littoral_surge_vulnerability': 'Carbon-dioxide emissions raise sea level through ocean expansion and land-ice loss. A higher coastal baseline lets storm surge reach farther inland and increases exposure along low-lying shores.',
  'carbon_emission->ocean_carbon_uptake_weakening': 'Carbon-dioxide emissions warm and stratify the ocean while increasing the carbon it must absorb. These changes can slow the transfer of carbon into deeper water and weaken the ocean sink relative to an unchanged climate.',
  'carbon_emission->ocean_heat_content': 'Carbon-dioxide emissions trap additional heat in the climate system, and the ocean absorbs most of that energy imbalance. Continued uptake raises heat content from the surface into deeper layers.',
  'carbon_emission->nocturnal_heat_stress': 'Carbon-dioxide-driven warming raises nighttime temperatures and can reduce the relief normally available after hot days. Repeated warm nights prevent physiological recovery and increase cumulative heat stress.',
  'carbon_emission->compound_day_night_heat_extremes': 'Carbon-dioxide emissions shift both daytime highs and nighttime lows upward. The chance of consecutive hot days and nights rises when persistent weather patterns suppress cooling.',
  'carbon_emission->lightning_fire_weather': 'Carbon-dioxide-driven warming can dry vegetation and deepen hot, unstable fire-weather conditions. When dry thunderstorms produce lightning without enough rain to wet fuels, ignition risk increases.',
  'carbon_emission->crop_yield_volatility': 'Carbon-dioxide emissions intensify heat, drought and heavy-rainfall hazards that affect flowering, grain filling, soil moisture and harvest timing. Uneven exposure across seasons and regions makes crop yields less reliable.',
  'carbon_emission->farm_heat_stress': 'Carbon-dioxide emissions raise growing-season temperatures and increase dangerous heat exposure for crops, livestock and farm workers. Heat can reduce reproduction, safe labor time and on-farm productivity.',
  'carbon_emission->food_insecurity': 'Carbon-dioxide-driven heat, drought and flooding can reduce harvests, disrupt transport and raise food prices. Households with limited income or reserves then face greater difficulty obtaining adequate food.',
  'carbon_emission->migration': 'Carbon-dioxide emissions intensify climate hazards that damage homes, water supplies, harvests and livelihoods. Repeated losses can increase temporary displacement or longer-term migration when local recovery options are exhausted.',
  'carbon_emission->public_health_heat_burden': 'Carbon-dioxide emissions increase the frequency and severity of extreme heat. Wider exposure raises heat illness, emergency demand and chronic health strain, particularly in neighborhoods with limited cooling access.',
  'carbon_emission->critical_infrastructure_fragility': 'Carbon-dioxide emissions intensify heat, flooding, wildfire and coastal hazards that damage power, transport, water and communications assets. Repeated shocks can shorten asset life and increase service failures across connected systems.',
  'carbon_emission->coral_bleaching': 'Carbon-dioxide emissions warm the ocean, increasing the frequency of temperatures that disrupt the partnership between corals and their symbiotic algae. Prolonged thermal stress causes bleaching and can lead to colony death.',
  'carbon_emission->waterborne_pathogen_outbreaks': 'Carbon-dioxide-driven warming and heavier rainfall can favor pathogen growth, overwhelm sanitation systems and wash contamination into drinking or recreational water. Outbreak risk rises where treatment and surveillance cannot contain that exposure.',
  'temp->tundra_methane_outgassing': 'Higher air and ground temperatures lengthen the thaw season and accelerate microbial activity in tundra soils. Waterlogged, oxygen-poor areas can then release more methane to the atmosphere.',
  'permafrost_thaw->tundra_methane_outgassing': 'Permafrost thaw exposes previously frozen organic carbon to microbial decomposition. Where thawed tundra remains saturated, oxygen-poor decomposition produces methane that can escape through soil, water or vegetation.',
  'thermokarst_expansion->tundra_methane_outgassing': 'Thermokarst subsidence creates ponds and saturated soils where thawed organic matter decomposes without much oxygen. Those conditions can turn collapsing tundra terrain into localized methane sources.',
  'temp->mountain_pass_avalanches': 'Warming changes snow accumulation, layering and the frequency of rain or meltwater entering the snowpack. These shifts can weaken mountain snow stability and alter avalanche timing near transport passes.',
  'rain_on_snow_flood_risk->mountain_pass_avalanches': 'Rain falling onto an existing snowpack adds weight and liquid water while weakening bonds between snow layers. On steep pass terrain, that rapid destabilization can trigger wet-snow avalanches.',
  'snowmelt_timing_shift->mountain_pass_avalanches': 'Earlier or faster snowmelt increases liquid water within the mountain snowpack and weakens its internal structure. Wet-snow avalanche risk can rise when saturated layers lose cohesion above exposed passes.',
  'temp->ice_shelf_grounding_line_retreat': 'Atmospheric and ocean warming increase surface and basal melt around Antarctic outlet glaciers. Thinning near the grounding zone can move the point where grounded ice begins to float farther inland.',
  'ocean_heat_content->ice_shelf_grounding_line_retreat': 'Warm subsurface water entering ice-shelf cavities melts ice from below and thins the grounding zone. Reduced thickness allows the grounding line to retreat into deeper inland basins.',
  'sea_ice_season_loss->arctic_pack_ice_drift': 'A shorter sea-ice season leaves a thinner, less consolidated Arctic ice cover. Wind and currents can move that mobile pack more quickly and unpredictably across navigation areas.',
  'ocean_current_regime_shift->arctic_pack_ice_drift': 'Changes in Arctic surface currents alter the speed and direction at which pack ice is transported. The resulting drift can redistribute ice into new coastal and shipping areas.',
  'temp->arctic_pack_ice_drift': 'Warming thins Arctic sea ice and reduces the mechanical resistance of the pack. Thinner, more fragmented ice responds more readily to winds and currents, changing drift speed and direction.',
  'temp->cryoconite_hole_expansion': 'Warmer glacier surfaces increase melt around dark cryoconite sediment. Localized absorption deepens and widens melt holes when debris remains concentrated and sunlight is available.',
  'particulate_soot_levels->cryoconite_hole_expansion': 'Airborne soot settling on glacier ice darkens debris-rich patches and increases solar absorption. Concentrated dark material can accelerate local melting and enlarge cryoconite holes.',
  'soot_deposition_on_snow->cryoconite_hole_expansion': 'Soot deposited on snow and ice lowers surface reflectivity and supplies dark particles to cryoconite deposits. Greater solar absorption can deepen localized melt features around that material.',
  'temp->ice_algae_pigmentation': 'Temperature controls meltwater availability, brine structure and light conditions within snow and sea ice. Warming can shift the timing, habitat and visible pigment concentration of ice-algae blooms.',
  'sea_ice_season_loss->ice_algae_pigmentation': 'A shorter sea-ice season reduces the stable habitat available for ice algae and changes when light reaches them. Earlier melt can shift bloom timing and reduce pigment biomass retained within the ice.',
  'temp->glacier_hydrologic_system_floods': 'Warming increases glacier melt and can enlarge or destabilize water stored within and beside glaciers. Sudden drainage from those reservoirs produces high-volume outburst floods.',
  'snowmelt_timing_shift->glacier_hydrologic_system_floods': 'Earlier snowmelt delivers water to glacier drainage systems sooner and can raise pressure before channels are fully developed. Rapid reorganization or blockage can release stored water as a flood.',
  'glacial_lake_failure_risk->glacier_hydrologic_system_floods': 'Failure of an ice- or moraine-dammed glacial lake releases stored water into the glacier-fed drainage network. The resulting outburst creates an abrupt downstream flood with high discharge and sediment load.',
  'temp->ice_cap_decapitation': 'Sustained warming raises the equilibrium snowline and increases melt across an ice cap’s summit. Once the highest accumulation area disappears, the remaining cap loses its long-term refuge from net melt.',
  'temp->nunatak_habitat_shrinkage': 'Warming can expand surrounding ice-free terrain in some places but also removes persistent snow and cold microclimates used by nunatak specialists. Habitat shrinks where heat, exposure and competing species exceed their tolerances.',
  'multi_hazard_early_warning->early_warning_coverage_gaps': 'Multi-hazard warning systems close coverage gaps when monitoring, communication and response plans reach exposed communities. Trust, accessible alerts and the ability to act determine whether formal coverage becomes practical protection.',
  'planned_relocation->relocation_governance_capacity': 'Planned relocation requires institutions that can coordinate land, housing, finance, services and community participation. Repeated implementation can strengthen that capacity when decision rights and long-term funding remain durable.',
  'el_nino->environ_anomalies': 'El Niño shifts tropical ocean temperatures and atmospheric circulation, which can align heat, drought, heavy rainfall and fire hazards across affected regions.',
  'la_nina->environ_anomalies': 'La Niña reorganizes tropical rainfall and circulation, producing a different regional mix of floods, droughts and temperature extremes.',
  'wet_bulb_heat->migration': 'Repeated episodes of dangerous heat and humidity can make work and daily life unsafe, increasing pressure for temporary or permanent migration.',
  'permafrost_thaw->methane': 'When thawed permafrost becomes waterlogged and oxygen-poor, microbes convert stored carbon into methane that can escape into the atmosphere.',
  'el_nino->monsoon_volatility': 'El Niño warming in the tropical Pacific shifts monsoon circulation and rainfall timing, raising the likelihood of weak, delayed or uneven rainy seasons in affected basins.',
  'el_nino->food': 'El Niño-related heat, drought and flooding can reduce harvests and interrupt food supplies in exposed production regions.',
  'el_nino->migration': 'El Niño can damage harvests, water supplies and livelihoods through regional drought or flooding, increasing displacement pressure where households have limited capacity to recover.',
  'la_nina->monsoon_volatility': 'La Niña shifts tropical circulation and moisture transport, changing monsoon timing and concentrating unusually wet or dry conditions across affected basins.',
  'monsoon_volatility->migration': 'Repeated monsoon failure or destructive rainfall can erode crops, income and housing, increasing migration when local recovery options are exhausted.',
  'resource_depletion->aquifer_overdraft': 'Sustained groundwater withdrawals that exceed natural or managed recharge turn wider resource pressure into measurable aquifer overdraft.',
  'deforestation->insect_biomass_decline': 'Forest clearing and fragmentation remove food, shelter and stable microclimates for insects, reducing biomass where remaining habitat cannot support viable populations.',
  'deforestation->soil_humus_decline': 'Removing forest cover exposes soil to erosion, heat and faster organic-matter breakdown, gradually reducing the humus that supports fertility and water retention.',
  'industry_farming->fertilizer_price_shock': 'Dependence on synthetic fertilizer exposes industrial farming to natural-gas prices, trade restrictions and supply disruptions that can rapidly raise input costs.',
  'industry_farming->feed_crop_dependency': 'Concentrated livestock production creates sustained demand for maize, soy and other feed crops, tying animal output to cropland, fertilizer, water and trade.',
  'migration->disaster_recovery_inequality': 'Displaced households enter recovery with unequal access to housing, insurance, savings, documentation and public aid, allowing migration shocks to widen existing recovery gaps.',
  'migration->relocation_governance_capacity': 'Large or repeated displacement can overwhelm the institutions responsible for housing, land, services and public participation during planned or emergency relocation.',
  'semiconductor_fabs->cooling_water_competition': 'Semiconductor fabrication requires large volumes of highly treated water, which can intensify competition with households, ecosystems and other industries in water-stressed regions.',
  'temp->ocean_salinity_stratification': 'Ocean warming and added freshwater from land-ice loss strengthen density differences between surface and deeper water, limiting vertical mixing and reinforcing salinity-driven stratification.',
  'industrial_heat_decarbonization_gap->carbon_emission': 'Continued reliance on fossil-fuel boilers and high-temperature process equipment sustains industrial carbon-dioxide emissions when cleaner heat technologies are unavailable or slow to replace them.',
  'monsoon_volatility->food': 'Unreliable monsoon timing and rainfall disrupt planting, irrigation and harvests, reducing agricultural output where food production depends heavily on the seasonal rains.',
  'fast_fashion->resource_depletion': 'Rapid clothing turnover increases demand for fibres, water, energy and chemical processing, accelerating resource use before garments reach the end of their practical life.',
  'permafrost_thaw->carbon_emission': 'Thaw exposes long-frozen organic matter to microbial decomposition, releasing carbon dioxide and, in waterlogged ground, methane into the atmosphere.',
  'nitrogen_fertilizer_runoff->nutrient_pollution': 'Nitrogen fertilizer that crops do not absorb can wash or drain into waterways, feeding algal growth, oxygen loss and wider nutrient pollution.',
  'urban_tree_canopy_loss->urban_heat_island': 'Losing urban tree canopy removes shade and evaporative cooling, allowing streets, buildings and surrounding air to become hotter during warm weather.',
  'asphalt_pavement_heat_absorbers->urban_heat_island': 'Dark asphalt absorbs solar energy during the day and releases it later as heat, raising surface and nighttime temperatures across paved urban areas.',
  'agricultural_groundwater_withdrawal->water_stress': 'Large irrigation withdrawals intensify water stress when farm pumping draws from an aquifer faster than rainfall, river leakage or managed recharge can replace it.',
  'agricultural_groundwater_withdrawal->freshwater_ecosystem_collapse': 'Irrigation pumping can lower groundwater levels and reduce the baseflow that sustains springs, wetlands and streams, degrading freshwater habitat during dry periods.',
  'industrial_groundwater_withdrawal->water_stress': 'High-volume industrial pumping adds to water stress when withdrawals compete with households, agriculture and ecosystems for a slowly replenished aquifer.',
  'industrial_groundwater_withdrawal->freshwater_ecosystem_collapse': 'Industrial groundwater withdrawals can reduce spring discharge and stream baseflow, depriving connected freshwater ecosystems of water needed to maintain habitat and water quality.',
  'municipal_groundwater_withdrawal->water_stress': 'Municipal pumping increases water stress when growing public demand repeatedly exceeds local aquifer recharge and alternative supplies cannot cover the shortfall.',
  'municipal_groundwater_withdrawal->freshwater_ecosystem_collapse': 'Heavy municipal pumping can lower groundwater tables and weaken flows to wetlands, springs and streams, placing groundwater-dependent ecosystems at risk.',
  'la_nina->food': 'La Niña can bring destructive rainfall to some farming regions and drought to others, disrupting harvests, fisheries and the reliability of regional food supplies.',
  'methane->environ_anomalies': 'Methane traps substantially more heat per molecule than carbon dioxide over the near term, adding warming that can intensify heat, rainfall and other climate extremes.',
  'wet_bulb_heat->food': 'Extreme heat and humidity reduce safe working hours for farm labor and can stress crops and livestock, lowering food production in exposed regions.',
  'ocean_current_regime_shift->pelagic_species_redistribution': 'Changes in ocean currents redistribute heat, nutrients and drifting organisms, shifting the suitable habitat and seasonal location of open-ocean species.',
  'carbon_emission->monsoon_volatility': 'Carbon-dioxide emissions raise radiative forcing and global temperature, altering atmospheric moisture and land-ocean temperature contrasts that help govern monsoon timing and rainfall intensity.',
  'methane->monsoon_volatility': 'Methane emissions add strong near-term warming, changing atmospheric moisture and circulation in ways that can alter monsoon timing and rainfall variability.',
  'carbon_emission->snowmelt_timing_shift': 'Carbon-dioxide emissions warm snow-dominated basins, causing winter precipitation to fall more often as rain and advancing the seasonal timing of snowmelt.',
  'sea_ice_season_loss->arctic_shipping_expansion': 'A longer ice-free season can extend Arctic navigation windows, although mobile ice, severe weather, port access, insurance and regulation still determine whether shipping expands.',
  'temp->ice_sheet_mass_loss': 'Higher air temperatures increase surface melting, while ocean warming can erode floating ice shelves and speed the discharge of grounded ice into the ocean.',
  'carbon_emission->wet_bulb_heat': 'Carbon-dioxide emissions warm the atmosphere, raising the baseline from which dangerous combinations of heat and humidity develop.',
  'ocean_salinity_stratification->atlantic_ni_o_ni_a': 'Salinity-driven stratification changes mixed-layer depth and sea-surface temperature, influencing the Atlantic Niño/Niña pattern without acting as a single independent cause.',
  'ocean_current_regime_shift->atlantic_multidecadal_oscillation': 'Changes in Atlantic circulation redistribute ocean heat and can shape multidecadal sea-surface-temperature variability measured by the Atlantic Multidecadal Oscillation.',
  'el_nino->pacific_decadal_oscillation': 'El Niño can leave a multi-year imprint on North Pacific temperature and circulation, contributing to Pacific Decadal Oscillation variability alongside internal ocean dynamics.',
  'la_nina->pacific_decadal_oscillation': 'La Niña can reinforce cool North Pacific temperature patterns that resemble part of the Pacific Decadal Oscillation, although the longer-lived mode also has internal drivers.',
  'el_nino->indian_ocean_dipole': 'El Niño alters tropical winds and the Walker circulation, changing the east-west Indian Ocean temperature gradient that defines the Indian Ocean Dipole.',
  'el_nino->pacific_north_american_pattern': 'El Niño shifts tropical Pacific convection, launching atmospheric wave trains that favor characteristic phases of the Pacific-North American pressure pattern.',
  'pacific_decadal_oscillation->pacific_north_american_pattern': 'North Pacific temperature patterns associated with the Pacific Decadal Oscillation can alter atmospheric wave propagation and the likelihood of particular Pacific-North American pattern phases.',
  'stratospheric_cooling->southern_annular_mode': 'Cooling over Antarctica can strengthen the stratospheric polar vortex and shift Southern Hemisphere westerly winds, favoring changes in the Southern Annular Mode.',
  'ocean_heat_content->amoc': 'Added ocean heat changes seawater density and buoyancy, which can weaken the deep-water formation that helps sustain the Atlantic overturning circulation.',
  'ice_sheet_mass_loss->amoc': 'Fresh meltwater from Greenland lowers North Atlantic surface salinity and density, making deep-water formation less efficient and potentially weakening Atlantic overturning.',
  'ocean_salinity_stratification->amoc': 'A fresher, more strongly stratified North Atlantic surface layer suppresses vertical mixing and deep-water formation, weakening a central process that drives Atlantic overturning.',
  'wet_bulb_heat->livestock_disease_pressure': 'Extreme heat and humidity stress livestock, weaken immune defenses and can improve conditions for some pathogens and vectors, increasing disease pressure in exposed herds.',
  'water_stress->livestock_disease_pressure': 'Water scarcity can concentrate animals around limited supplies, reduce hygiene and worsen water quality, increasing exposure to infectious disease.',
  'wet_bulb_heat->farm_heat_stress': 'High heat combined with humidity reduces safe working time and impairs livestock cooling, intensifying heat stress across farms.',
  'drought_persistence->farm_heat_stress': 'Persistent drought dries soils and reduces evaporative cooling, leaving crops, livestock and farm workers exposed to hotter local conditions.',
  'atmospheric_dryness->soil_moisture_collapse': 'High atmospheric evaporative demand pulls water from soils and plants faster, accelerating root-zone drying when rainfall cannot replace the loss.',
  'data_centers->semiconductor_fabrication_footprint': 'Growth in data-center computing increases demand for advanced chips, expanding the energy, water, chemical and material footprint associated with semiconductor fabrication.',
  'sea_level_rise->mangrove_buffer_loss': 'Rising seas can drown mangroves where sediment buildup cannot keep pace and shoreward migration is blocked by development or steep terrain.',
  'coastal_erosion->mangrove_buffer_loss': 'Erosion removes the sediment and stable shoreline needed by mangrove roots, weakening or eliminating the storm buffer formed by mature stands.',
  'food->fertilizer_production': 'Demand for high crop yields drives production of nitrogen, phosphate and potash fertilizers used to replenish nutrients removed during harvest.',
  'atmospheric_dryness->wildfire_regime_shift': 'Dry air draws moisture from vegetation and dead fuels, making ignition and rapid fire spread more likely when wind and continuous fuel are present.',
  'drought_persistence->wildfire_regime_shift': 'Persistent drought dries live and dead vegetation across seasons, increasing the amount of burnable fuel and lengthening the period of elevated fire risk.',
  'coastal_inundation_risk->insurance_retreat': 'Repeated coastal flooding raises expected claims and reinsurance costs, encouraging insurers to increase prices, restrict coverage or leave exposed markets.',
  'wildfire_regime_shift->insurance_retreat': 'More frequent or destructive wildfire losses can overwhelm risk models and reinsurance capacity, leading insurers to raise premiums, limit renewals or withdraw.',
  'deforestation->watershed_forest_loss': 'Clearing forest within a watershed removes canopy and root structure, reducing forest cover while increasing erosion and rapid runoff into streams.',
  'wildfire_regime_shift->watershed_forest_loss': 'Repeated severe fires can convert forested watersheds to lower-cover vegetation when tree mortality outpaces regeneration.',
  'disaster_recovery_inequality->adaptation_capital_shortfall': 'Unequal recovery directs scarce household and public funds toward rebuilding basic losses, leaving less capital available for adaptation before the next hazard.',
  'insurance_retreat->adaptation_capital_shortfall': 'When insurance becomes unavailable or unaffordable, households and governments absorb more disaster risk directly, reducing their capacity to finance preventive adaptation.',
  'temp->arctic_shipping_expansion': 'Warming reduces seasonal sea-ice coverage and extends navigable periods in parts of the Arctic, enabling more shipping where infrastructure, economics and safety allow.',
  'tropical_cyclone_rapid_intensification->shipping_lane_disruption': 'A cyclone that strengthens rapidly leaves less time to reroute vessels or secure ports, increasing closures, delays and cargo disruption.',
  'coastal_inundation_risk->shipping_lane_disruption': 'Coastal flooding can close ports, damage access roads and interrupt cargo handling, disrupting shipping even when offshore lanes remain open.',
  'extreme_precipitation_intensity->airport_operational_disruption': 'Intense rainfall can overwhelm runway drainage, reduce visibility and force ground stops, producing airport delays and cancellations.',
  'wet_bulb_heat->airport_operational_disruption': 'Extreme heat and humidity reduce aircraft takeoff performance and safe outdoor working time, constraining airport schedules and ground operations.',
  'snow_drought->snowmelt_timing_shift': 'A smaller or warmer seasonal snowpack often melts earlier and produces a weaker spring pulse, shifting the timing of runoff.',
  'ocean_heat_content->sea_ice_season_loss': 'Ocean heat melts sea ice from below and delays autumn freeze-up, shortening the period of seasonal ice cover.',
  'arctic_amplification_rates->sea_ice_season_loss': 'Rapid Arctic warming accelerates spring melt and delays autumn freeze-up, shortening the annual sea-ice season.',
  'temp->thermokarst_expansion': 'Warming thaws ice-rich permafrost, causing the ground to subside and expanding thermokarst pits, lakes and unstable terrain.',
  'ice_sheet_mass_loss->ocean_salinity_stratification': 'Fresh meltwater from ice sheets lightens the ocean surface, strengthening the density barrier between surface and deeper water.',
  'extreme_precipitation_intensity->ocean_salinity_stratification': 'Heavy rainfall and runoff can freshen the ocean surface locally, strengthening short-lived stratification when winds and mixing remain weak.',
  'urbanization->aviation_demand_growth': 'Urban population, income and business activity can increase demand for air travel, provided fares, airport capacity and alternatives do not offset that growth.',
  'transmission_buildout_lag->freight_electrification_gap': 'Delayed transmission and distribution upgrades can limit depot charging capacity, slowing the replacement of diesel freight fleets with electric vehicles.',
  'battery_supply_chain_pressure->freight_electrification_gap': 'High battery costs or limited cell and mineral supplies can delay electric-truck purchases and widen the freight electrification gap.',
  'wet_bulb_heat->port_heat_vulnerability': 'Extreme heat and humidity reduce safe dockworker hours, strain refrigerated cargo systems and lower equipment reliability at exposed ports.',
  'wildfire_regime_shift->rail_heat_buckling': 'Intense wildfire heat can deform exposed rails and damage track components, although ordinary wildfire smoke or nearby closures do not by themselves cause buckling.',
  'temp->glacial_lake_failure_risk': 'Warming retreats glaciers and can enlarge unstable meltwater lakes, increasing outburst-flood risk where moraine or ice dams are weak.',
  'ocean_heat_content->ocean_acidification': 'Ocean warming changes carbon-dioxide solubility, circulation and stratification, modifying where acidification is expressed even though absorbed carbon dioxide remains its primary cause.',
  'ocean_heat_content->ice_sheet_mass_loss': 'Warm subsurface ocean water increases basal melting beneath floating ice shelves, weakening their support for grounded ice and accelerating ice-sheet loss.',
  'arctic_amplification_rates->permafrost_thaw': 'Faster Arctic warming deepens the seasonally thawed active layer and raises ground temperatures, accelerating permafrost loss.',
  'drought_persistence->groundwater_depletion': 'Persistent drought reduces aquifer recharge while often increasing pumping demand, accelerating groundwater depletion where withdrawals already approach sustainable limits.',
  'irrigation_water_inefficiency->groundwater_depletion': 'Inefficient irrigation requires more pumping for each unit of crop production, depleting aquifers when the additional withdrawal is not returned as usable recharge.',
  'urbanization->food_waste': 'Urban growth concentrates food retail, restaurants and households, increasing potential waste volumes while logistics and collection systems determine how much is actually discarded.',
  'cold_chain_failure_risk->food_waste': 'Breakdowns in refrigeration expose perishable food to unsafe temperatures, causing spoilage before it can be sold or eaten.',
  'drought_persistence->water_stress': 'Persistent drought reduces surface supply and groundwater recharge, increasing water stress when demand remains high.',
  'groundwater_depletion->water_stress': 'Falling aquifer levels reduce accessible reserves and raise pumping costs, worsening water stress for users that depend on groundwater.',
  'humidity_amplification->hail_hazard_shift': 'Greater atmospheric moisture can supply more condensate to strong thunderstorms, affecting hail growth when powerful updrafts and a suitable freezing layer are present.',
  'extreme_precipitation_intensity->hail_hazard_shift': 'Storm environments capable of intense precipitation can also support damaging hail, but hail size and frequency depend on updraft strength, freezing level and wind shear.',
  'indian_ocean_dipole->madden_julian_oscillation': 'Indian Ocean temperature gradients alter tropical convection and low-level winds, changing the environment through which Madden-Julian Oscillation events develop and propagate.',
  'el_nino->madden_julian_oscillation': 'El Niño shifts tropical Pacific convection and background winds, modulating the strength, location and propagation of Madden-Julian Oscillation events.',
  'ocean_heat_content->humidity_amplification': 'Warmer upper-ocean conditions support greater evaporation, adding moisture to the atmosphere when winds and surface humidity allow.',
  'drought_persistence->atmospheric_dryness': 'Persistent drought reduces soil moisture and evapotranspiration, increasing sensible heating and atmospheric demand for water.',
  'soil_moisture_collapse->atmospheric_dryness': 'Severely dry soil suppresses evaporative cooling and shifts surface energy into heat, reinforcing atmospheric dryness above the land.',
  'wet_bulb_heat->air_conditioning_refrigerants': 'More frequent dangerous heat and humidity increases cooling demand, expanding air-conditioner use and the potential for refrigerant leakage.',
  'urbanization->air_conditioning_refrigerants': 'Urban growth adds cooled floor area and heat-retaining surfaces, increasing demand for air conditioning and its associated refrigerant stock.',
  'building_performance_standards->passive_cooling_design': 'Building standards that reward measured cooling-demand reduction encourage shade, ventilation, thermal mass and other passive design strategies.',
  'urban_heat_action_plans->heat_related_mortality_burden': 'Heat-action plans reduce mortality when forecasts trigger funded outreach, cooling access, clinical response and protections for outdoor workers.'
});

function directDescription(edge, sourceName, targetName) {
  const override = RELATIONSHIP_DESCRIPTION_OVERRIDES[`${edge.source}->${edge.target}`];
  if (override) return override;

  const verb = edge.verb || 'affects';
  const adverb = String(edge.adverb || '').trim();
  const lowInformationLink = /^(?:under bounded conditions|systemically|seasonally|persistently)$/i.test(adverb)
    || /^(?:loads instability into|loads heat into|warms into)$/i.test(verb);
  if (lowInformationLink) {
    return `${sourceName || 'The source condition'} can contribute to ${targetName || 'the downstream outcome'}`;
  }
  const prefixedCondition = adverb.match(/^(through|by|when|where|during|after|under|as|across|via)\s+(.+)$/i);
  if (prefixedCondition) {
    const [, connector, detail] = prefixedCondition;
    return `${connector.charAt(0).toUpperCase() + connector.slice(1).toLowerCase()} ${detail}, ${sourceName || 'the source condition'} ${verb} ${targetName || 'the downstream outcome'}`;
  }
  return `${sourceName || 'The source condition'} ${verb} ${targetName || 'the downstream outcome'}${adverb ? ` ${adverb}` : ''}`;
}

function cleanEvidenceNotes(notes) {
  return cleanEvidenceText(String(notes || '')
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => !(
      /Contract repair|Priority-anchor promotion|evidence-factor|This relationship is promoted only/i.test(sentence)
      || /bounded by the attached|should not be read as universal|graph influence|display\/salience weight/i.test(sentence)
      || /^This edge\b/i.test(sentence)
    ))
    .join(' '));
}

function targetConsequenceDescription(node) {
  const firstSentence = normalizeSentence(
    String(node?.description || '').split(/(?<=[.!?])\s+/).filter(Boolean)[0]
  );
  if (
    !isReaderFacingDescription(firstSentence)
    || /^(?:Tracks|Links|Ties|Maps|Measures|Represents|Monitors|Details|Quantifies|Describes|Provides|Uses|Maintains|Active tracking)\b/i.test(firstSentence)
    || /\bis represented here through\b/i.test(firstSentence)
    || /\b(?:forcing proxy|downstream attribution|the edge represents|graph influence)\b/i.test(firstSentence)
  ) {
    return '';
  }
  return firstSentence;
}

function evidenceDescriptions(edge) {
  const mechanism = cleanEvidenceText(edge.evidence?.mechanism || edge.evidence?.dossier?.mechanism);
  const notes = cleanEvidenceNotes(edge.evidence?.notes);
  const readbackClaim = cleanEvidenceText(edge.evidence?.source_readback?.exact_claim);
  return {
    mechanism: isReaderFacingDescription(mechanism) ? mechanism : '',
    notes: isReaderFacingDescription(notes) ? notes : '',
    readback: isReaderFacingDescription(readbackClaim) ? readbackClaim : ''
  };
}

export function attachRelationshipDescriptions(nodes, edges) {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const evidenceCounts = {
    mechanism: new Map(),
    notes: new Map(),
    readback: new Map()
  };
  for (const edge of edges) {
    for (const [field, value] of Object.entries(evidenceDescriptions(edge))) {
      const description = normalizeSentence(value).toLocaleLowerCase();
      if (description) {
        evidenceCounts[field].set(description, (evidenceCounts[field].get(description) || 0) + 1);
      }
    }
  }

  return edges.map(edge => {
    const sourceName = nodeById.get(edge.source)?.name || '';
    const targetNode = nodeById.get(edge.target);
    const targetName = targetNode?.name || '';
    const override = RELATIONSHIP_DESCRIPTION_OVERRIDES[`${edge.source}->${edge.target}`];
    const evidence = evidenceDescriptions(edge);
    const rankedEvidence = ['mechanism', 'notes', 'readback']
      .map(field => ({ field, description: normalizeSentence(evidence[field]) }))
      .filter(({ description }) => description)
      .sort((a, b) => (
        Number(evidenceCounts[a.field].get(a.description.toLocaleLowerCase()) === 1)
        - Number(evidenceCounts[b.field].get(b.description.toLocaleLowerCase()) === 1)
      ) * -1);
    const primaryEvidence = rankedEvidence.find(({ field, description }) => (
      evidenceCounts[field].get(description.toLocaleLowerCase()) === 1
    ))?.description;
    const primary = normalizeSentence(
      override || primaryEvidence || directDescription(edge, sourceName, targetName)
    );
    const secondary = [
      ...rankedEvidence.map(({ description }) => description),
      targetConsequenceDescription(targetNode)
    ]
      .find(description => isComplementaryDescription(primary, description));
    const description = limitToTwoSentences(
      `${primary}${secondary && countWords(primary) < 55 ? ` ${secondary}` : ''}`
    );
    return { ...edge, relationship_description: description };
  });
}
