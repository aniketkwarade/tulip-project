const PLAIN_LANGUAGE_OVERRIDES = Object.freeze({
  'industry_farming->nitrous_oxide': 'Industrial farming can release nitrous oxide when manure and crop residues add nitrogen to soil or are burned. Soil microbes convert some of that nitrogen into this powerful greenhouse gas.',
  'agricultural_nitrogen_application->nitrous_oxide': 'When farms add more nitrogen than plants can absorb, soil microbes can convert some of the excess into nitrous oxide, a powerful and long-lived greenhouse gas.',
  'methane->temp': 'Methane traps heat very effectively, so releasing more of it raises global temperatures, especially over the next few decades. Cutting methane emissions can therefore slow near-term warming faster than reductions in longer-lived gases alone.',
  'carbon_emission->temp': 'Carbon dioxide traps heat that would otherwise escape to space. As emissions accumulate in the atmosphere, global temperatures rise.',
  'nitrous_oxide->temp': 'Nitrous oxide absorbs heat in the atmosphere and remains there for a long time, adding to global warming alongside carbon dioxide and methane.',
  'rice_paddy_methane_bubbles->methane': 'Flooded rice fields create oxygen-poor soil where microbes produce methane. The gas then escapes through rice plants, bubbles, and the water surface.',
  'temp->sea_ice_season_loss': 'Higher global temperatures melt Arctic sea ice earlier and delay its return in autumn, shortening the annual sea-ice season.',
  'temp->soil_moisture_collapse': 'Higher temperatures draw more water from soil and plants. When rain cannot replace that loss, large areas can enter severe soil-moisture drought.',
  'temp->snowmelt_timing_shift': 'Warmer air causes snow to melt earlier, shifting the spring runoff peak and changing when rivers receive water from the seasonal snowpack.',
  'carbon_emission->sea_ice_season_loss': 'Carbon dioxide emissions warm the Arctic, causing sea ice to melt earlier and form later. This shortens the season when the ocean remains ice-covered.',
  'carbon_emission->marine_fisheries_collapse': 'Carbon emissions warm and alter the ocean, shifting habitats and reducing the productivity of some fish populations. Fisheries can decline when species cannot adapt or move fast enough.',
  'carbon_emission->marine_heatwaves': 'Carbon emissions add heat to the ocean, making unusually warm water more frequent, longer-lasting, and more intense.',
  'gas_power_dependence->carbon_emission': 'Gas-fired power plants release carbon dioxide when they burn natural gas to generate electricity. Greater dependence on those plants increases cumulative emissions.',
  'pm2_5_particulates->air_pollution_health_burden': 'Long-term exposure to fine particle pollution raises the risk of heart and lung disease and is linked with earlier death.',
  'cement_concrete->cement_process_emissions': 'Cement production releases carbon dioxide when fuel heats the kiln. Heating limestone into clinker releases additional carbon through the chemical process itself.',
  'temp->tropical_cyclone_rapid_intensification': 'Warmer upper-ocean water supplies more heat and moisture to an organized tropical cyclone, creating conditions that can help it strengthen very quickly. If winds and storm structure are favorable, that extra energy can support rapid intensification before landfall.',
  'industrial_heat_decarbonization_gap->cement_process_emissions': 'Cement kilns need extremely high temperatures, and fossil fuels often provide that heat. When cleaner heat is unavailable, fuel emissions add to the carbon released by limestone processing.',
  'cement_process_emissions->carbon_emission': 'Heating limestone into clinker releases carbon dioxide through the chemical reaction itself. Fuel burned to run the kiln adds another source of emissions.',
  'glacial_lake_failure_risk->hydrological_runoff_surges': 'When a glacial lake dam fails, stored meltwater can drain suddenly and send a powerful surge into downstream rivers. The sudden pulse can overwhelm river channels and threaten communities, roads, and bridges downstream.',
  'cement_concrete->carbon_emission': 'Making conventional cement releases carbon dioxide when limestone is heated and when fuel is burned to power the kiln.',
  'pacific_north_american_pattern->blocking_pattern_persistence': 'The negative phase of the Pacific-North American pattern is associated with persistent high-pressure blocking over the North Pacific and a split jet stream.',
  'particulate_soot_levels->soot_deposition_on_snow': 'More soot in the air means more can land on snow. Winds and rain determine where it falls.',
  'marine_heatwaves->marine_food_web_simplification': 'Ocean heatwaves can kill or weaken species at different levels of the food web. This disrupts how energy moves through the ecosystem and can reduce larger animals more severely.',
  'methane->methane_hydroxyl_sink_loss': 'More methane uses up chemicals in the air that normally help remove it. With less of this natural cleaning capacity available, methane can remain in the atmosphere longer.',
  'madden_julian_oscillation->environ_anomalies': 'The Madden-Julian Oscillation helps shape where rain falls and how winds move across the tropics over the following weeks. Those week-to-week shifts can raise or lower the chance of heavy rain and dry spells across affected regions.',
  'industry_farming->desertification_frontiers': 'Expanding or poorly managed farmland can strip away plant cover, erode soil, drain groundwater, and leave salt behind. Over time, the land becomes less able to support crops and ecosystems.',
  'indian_ocean_dipole->environ_anomalies': 'The Indian Ocean Dipole shifts rain and temperature patterns across East Africa, South Asia, Australia, and other connected regions.',
  'temp->drought_persistence': 'Warmer air pulls more water from soil and plants. Where rain does not replace that loss, drought can become more severe and last longer.',
  'temp->atmospheric_river_intensification': 'Warmer air can hold more water. This allows atmospheric rivers to carry more moisture and produce heavier rain when their wind pattern remains similar.',
  'marine_heatwaves->phytoplankton_decline': 'Ocean heatwaves can reduce the nutrients reaching sunlit surface water. With less food available, phytoplankton can decline and the mix of species can change.',
  'shipping->black_carbon_deposition': 'Ships that burn fuel can release black carbon. Winds may carry these dark particles to snow and ice, where they settle and absorb more sunlight.',
  'ocean_current_regime_shift->atlantic_multidecadal_oscillation': 'Changes in Atlantic currents move heat around the ocean and can help shape the decades-long temperature pattern measured by the Atlantic Multidecadal Oscillation.',
  'madden_julian_oscillation->extreme_precipitation_intensity': 'The Madden-Julian Oscillation changes tropical winds and moisture. In some places and seasons, those shifts can make heavy rain more likely or more intense.',
  'atlantic_multidecadal_oscillation->ocean_current_regime_shift': 'The Atlantic Multidecadal Oscillation changes alongside broad shifts in North Atlantic currents and ocean temperatures. The two patterns are related, but one does not always directly cause the other.',
  'pacific_decadal_oscillation->marine_heatwaves': 'The phase of the Pacific Decadal Oscillation can make ocean heatwaves in the northeast Pacific more or less frequent, long-lasting, and intense.',
  'temp->marine_pathogen_range_expansion': 'Warmer coastal water allows some disease-causing microbes, including Vibrio bacteria, to survive in more places and for longer periods.',
  'ocean_acidification->marine_food_web_simplification': 'More acidic ocean water stresses sensitive species and changes who eats whom. These disruptions can simplify the food web and reduce energy available to larger animals.',
  'aerosol_cooling_loss->monsoon_volatility': 'Air pollution particles can change winds and rainfall. As particle levels rise or fall, monsoon timing and strength can shift, although the result varies widely by region.',
  'amoc->ocean_current_regime_shift': 'Changes in the Atlantic overturning circulation alter how heat and salt move through the Atlantic, contributing to wider shifts in ocean-current patterns. A weaker circulation can redistribute warming, rainfall, and regional sea-level change around the Atlantic.',
  'temp->environ_anomalies': 'A warmer atmosphere and ocean hold more heat and moisture. This makes extreme heat, heavy rain, drought, and several hazards happening together more likely.',
  'pacific_decadal_oscillation->environ_anomalies': 'The Pacific Decadal Oscillation shifts ocean temperatures and weather patterns across the North Pacific and nearby continents over many years.',
  'pacific_decadal_oscillation->pelagic_species_redistribution': 'Changes linked to the Pacific Decadal Oscillation can make parts of the ocean more or less suitable for a species, causing fish and other open-ocean animals to move.',
  'atlantic_multidecadal_oscillation->environ_anomalies': 'Decades-long swings in North Atlantic temperatures occur alongside changes in regional weather. This link does not mean people control the timing of the natural cycle.',
  'atlantic_ni_o_ni_a->pelagic_species_redistribution': 'Temperature changes in the tropical Atlantic can make animals in the open ocean move to more suitable water. The response differs by species and region.',
  'indian_ocean_dipole->food': 'The Indian Ocean Dipole can bring drought to some farming regions and heavy rain to others. Harvest impacts depend on where crops are grown and how farms prepare.',
  'north_atlantic_oscillation->environ_anomalies': 'The phase of the North Atlantic Oscillation shifts winter temperatures, rain, storms, and the jet stream across the North Atlantic region.',
  'arctic_oscillation->environ_anomalies': 'The phase of the Arctic Oscillation shifts winter air pressure, temperatures, and winds across much of the Northern Hemisphere.',
  'pacific_north_american_pattern->environ_anomalies': 'The Pacific-North American pattern is linked with recurring shifts in temperature and rain across North America.',
  'pacific_north_american_pattern->drought_persistence': 'The Pacific-North American pattern can steer rain away from a region for a season, helping drought persist. The result depends on the pattern phase and time of year.',
  'southern_annular_mode->environ_anomalies': 'The Southern Annular Mode describes shifts in air pressure and westerly winds around Antarctica. Its phase changes weather across the Southern Hemisphere.',
  'southern_annular_mode->ocean_current_regime_shift': 'Changes in Southern Annular Mode winds can alter currents around Antarctica. The response depends on the pattern phase, location, and length of time involved.',
  'el_nino->la_nina': 'The winds and ocean-heat changes left after an El Niño can create Pacific conditions that favor a later La Niña event.',
  'snow_drought->alpine_snowpack_declines': 'A snow drought leaves mountain snowpacks smaller because less snow falls, more rain falls instead, or warm weather melts the snow early.',
  'north_atlantic_oscillation->gulf_stream_slowdown': 'Long-lasting changes in North Atlantic winds and air pressure can alter the forces that help drive the Gulf Stream and nearby currents.',
  'ocean_salinity_stratification->subpolar_gyre_weakening': 'Changes in ocean salt levels alter water density and reduce mixing. In some places, this can weaken the currents that form the subpolar gyre.',
  'carbon_emission->solar_radiation_trapping': 'As carbon dioxide builds up in the atmosphere, less heat escapes to space. This changes Earth’s energy balance and warms the climate.',
  'ocean_current_regime_shift->ice_shelf_grounding_line_retreat': 'Changing ocean currents can carry more warm water beneath an ice shelf. Faster melting weakens the shelf and can move the point where the ice meets the seafloor farther inland.',
  'coastal_hypoxia->estuarine_nursery_loss': 'Low oxygen in an estuary makes nursery habitat less suitable for young fish and shellfish. Fewer survive to adulthood and support nearby fisheries.',
  'estuarine_nursery_loss->marine_fisheries_collapse': 'When estuary nursery habitat declines, fewer young fish and shellfish survive to replenish coastal fisheries. Stocks can then become more vulnerable to collapse.',
  'deforestation->carbon_emission': 'Forest clearance releases carbon stored in trees and soils while removing a living carbon sink. Emissions rise further when vegetation is burned or decomposes, and future carbon uptake falls when forest becomes pasture or cropland.',
});

const PLAIN_LANGUAGE_SECONDARY_OVERRIDES = Object.freeze({
  'temp->river_flow_regime_shift': 'That can move peak flows earlier, deepen low-flow periods, and make water supplies less predictable.',
  'river_flow_regime_shift->reservoir_storage_instability': 'Reservoirs may then refill at the wrong time or fail to hold enough water for dry-season demand.',
  'drought_persistence->reservoir_storage_instability': 'As inflows remain low, reservoirs may not refill enough to meet water, power, and ecological needs.',
  'river_flow_regime_shift->basin_treaty_breakdown': 'Allocation rules based on historical flows can become harder to honor, increasing conflict between upstream and downstream users.',
  'desalination_dependence->carbon_emission': 'The emissions depend on how much water is produced and whether the electricity comes from fossil or low-carbon sources.',
  'river_flow_regime_shift->reservoir_operating_shortfall': 'Operators may then miss flood-control, hydropower, water-supply, or environmental-flow targets.',
  'flash_flood_regime->drinking_water_treatment_stress': 'Treatment plants may need to slow intake or add filtration and disinfection while contamination remains elevated.',
  'drought_persistence->drinking_water_treatment_stress': 'Utilities may need more intensive treatment as pollutants and salts become concentrated in smaller water volumes.',
  'watershed_forest_loss->riverine_habitat_fragmentation': 'Sediment, warmer water, and damaged streambanks can isolate habitat and disrupt fish movement.',
  'temp->wildfire_regime_shift': 'Fires can then ignite more easily, spread faster, and burn across a longer season.',
  'wildlife_habitat_patches->biodiversity_intactness_loss': 'Small, isolated populations lose access to mates and resources, raising the risk of local extinction.',
  'coastal_inundation_risk->airport_climate_exposure': 'Flooded runways and access roads can delay flights, damage equipment, and interrupt regional transport.',
  'bridge_scour_exposure->supply_chain_port_bottlenecks': 'When key crossings close, trucks and rail cargo can no longer reach terminals on schedule, worsening congestion.',
  'shipping_lane_disruption->supply_chain_port_bottlenecks': 'Delayed and rerouted vessels can arrive in clusters, overwhelming berths, yards, and landside connections.',
  'farm_heat_stress->crop_yield_volatility': 'Heat during flowering or grain filling can sharply reduce yields, making harvests less reliable between seasons.',
  'feed_crop_dependency->crop_yield_volatility': 'Poor harvests can then raise feed costs and expose livestock production to shortages.',
  'grid_peak_load_stress->cold_chain_failure_risk': 'Even brief outages can spoil food and medicine when backup power or thermal storage is insufficient.',
  'topsoil_erosion_acceleration->crop_yield_volatility': 'Thinner soils hold less water and nutrients, so crops become more sensitive to drought and heavy rain.',
  'cold_chain_failure_risk->food_import_exposure': 'Losses in domestic supply can force greater reliance on imported food and expose prices to trade disruptions.',
  'snow_drought->river_flow_regime_shift': 'Rivers then receive a smaller, earlier spring pulse and less water during the warm season.',
  'snow_drought->reservoir_storage_instability': 'Reservoirs may refill earlier but still enter summer with less stored water for farms, cities, and ecosystems.',
  'vector_borne_disease_expansion->disaster_recovery_inequality': 'Illness and treatment costs can delay recovery most for households with limited health care, savings, or insurance.',
  'early_warning_coverage_gaps->disaster_recovery_inequality': 'People who receive late or inaccessible warnings have less time to protect themselves and their property, widening recovery gaps.',
});

const PLAIN_LANGUAGE_REPLACEMENTS = Object.freeze([
  [/\b(?:the\s+)?IPCC\b/g, 'the Intergovernmental Panel on Climate Change'],
  [/\bWHO\b/g, 'the World Health Organization'],
  [/\bFAO\b/g, 'the United Nations Food and Agriculture Organization'],
  [/\bWRI\b/g, 'the World Resources Institute'],
  [/\bNOAA\b/g, 'the United States ocean and atmosphere agency'],
  [/\bNASA\b/g, 'the United States space agency'],
  [/\bENSO\b/g, 'El Niño–Southern Oscillation'],
  [/\bGHG\b/g, 'greenhouse-gas'],
  [/\bGtC\b/g, 'gigatonnes of carbon'],
  [/\bN2O\b/g, 'nitrous oxide'],
  [/\bCH4\b/g, 'methane'],
  [/\bpCO2\b/g, 'surface-ocean carbon dioxide pressure'],
  [/\bPM2\.5\b/g, 'fine-particle pollution'],
  [/\bPM10\b/g, 'coarse-particle pollution'],
  [/\bSO2\b/g, 'sulfur dioxide'],
  [/\bCO2\b/g, 'carbon dioxide'],
  [/\bPDO\b/g, 'Pacific Decadal Oscillation'],
  [/\bSST\b/g, 'sea-surface temperature'],
  [/\bIOD\b/g, 'Indian Ocean Dipole'],
  [/\bAMOC\b/g, 'Atlantic overturning circulation'],
  [/\bMJO\b/g, 'Madden-Julian Oscillation'],
  [/\bNAO\b/g, 'North Atlantic Oscillation'],
  [/\bAO\b/g, 'Arctic Oscillation'],
  [/\bPNA\b/g, 'Pacific-North American pattern'],
  [/\bSAM\b/g, 'Southern Annular Mode'],
  [/\bQBO\b/g, 'Quasi-Biennial Oscillation'],
  [/\bAI\b/g, 'artificial intelligence'],
  [/\blow-ILUC\b/gi, 'low risk of indirect land-use change'],
  [/\banthropogenic\b/gi, 'human-caused'],
  [/\bpositive radiative forcing\b/gi, 'a warming influence'],
  [/\bnegative radiative forcing\b/gi, 'a cooling influence'],
  [/\beffective radiative forcing\b/gi, 'heat-trapping influence'],
  [/\bradiative forcing\b/gi, 'heat trapped in the climate system'],
  [/\bnitrification and denitrification\b/gi, 'microbial nitrogen conversion'],
  [/\bbiogeochemical\b/gi, 'physical, chemical, and biological'],
  [/\bevapotranspiration\b/gi, 'water loss from soil and plants'],
  [/\bstratification\b/gi, 'layering that limits mixing'],
  [/\brecruitment disruption\b/gi, 'fewer young animals surviving to adulthood'],
  [/\brecruitment\b/gi, 'survival of young animals into adulthood'],
  [/\balbedo\b/gi, 'surface reflectivity'],
  [/\bhypoxic\b/gi, 'low-oxygen'],
  [/\banoxic\b/gi, 'oxygen-free'],
  [/\bteleconnection\b/gi, 'long-distance climate connection'],
  [/\bcryosphere\b/gi, 'frozen-water system'],
  [/\beutrophication\b/gi, 'nutrient pollution'],
  [/\benthalpy flux\b/gi, 'heat and moisture transfer'],
  [/\benthalpy flows\b/gi, 'heat and moisture transfer'],
  [/\bcalcination\b/gi, 'limestone heating'],
  [/\bmeteorological\b/gi, 'weather'],
  [/\boperationally monitored\b/gi, 'tracked'],
  [/\bsubseasonal\b/gi, 'week-to-week'],
  [/\bTier 1\b/gi, 'standard'],
  [/\bhydrological runoff\b/gi, 'runoff'],
  [/\bhydrological\b/gi, 'water-related'],
  [/\bevapotranspiration\b/gi, 'water loss from soil and plants'],
  [/\bcarbon sequestration\b/gi, 'carbon storage'],
  [/\bsequestration\b/gi, 'long-term storage'],
  [/\bsolubility\b/gi, 'ability to remain dissolved'],
  [/\bfluxes\b/gi, 'flows'],
  [/\bflux\b/gi, 'flow'],
  [/\bpathways\b/gi, 'processes'],
  [/\bpathway\b/gi, 'process'],
]);

function rewriteKnownTemplate(value = '') {
  const compact = String(value).replace(/\s+/g, ' ').trim();
  const genericCarbonRelease = compact.match(/^(.+?) (?:Fossil )?(?:CO2|carbon dioxide) (?:Output|Release) releases fossil or land-use-change carbon to the atmosphere within the reported sector, geography, and accounting boundary\.?$/i);
  if (genericCarbonRelease) {
    const activity = genericCarbonRelease[1]
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase();
    const label = activity.charAt(0).toUpperCase() + activity.slice(1);
    return `${label} releases carbon dioxide into the atmosphere within its reported sector and geography. Those emissions accumulate and add to global warming.`;
  }
  const carbonOutput = compact.match(/^(.+?) Fossil (?:CO2|carbon dioxide) Output contributes to cumulative atmospheric (?:CO2|carbon dioxide) forcing and therefore to global warming within the inventory boundary and over multi-year accumulation\.?$/i)
    || compact.match(/^(.+?) (?:CO2|carbon dioxide) (?:Output|Release) contributes to cumulative atmospheric (?:CO2|carbon dioxide) forcing and therefore to global warming within the inventory boundary and over multi-year accumulation\.?$/i);
  if (carbonOutput) {
    const activity = carbonOutput[1]
      .replace(/-/g, ' ')
      .replace(/\bSector\b/gi, '')
      .replace(/\bIndustry\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase();
    return `${activity.charAt(0).toUpperCase()}${activity.slice(1)} releases carbon dioxide within its reported sector and geography. As the gas builds up in the atmosphere, it raises global temperatures.`;
  }
  return compact;
}

function normalizeSentence(value = '') {
  const compact = String(value).replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  if (!compact) return '';
  const capitalized = compact.charAt(0).toUpperCase() + compact.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

function sentences(value = '') {
  return String(value).split(/(?<=[.!?])\s+/).map(normalizeSentence).filter(Boolean);
}

function wordCount(value = '') {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

function stripTechnicalTail(value = '') {
  const [lead, ...tail] = String(value).split(';');
  if (!tail.length) return value;
  if (wordCount(lead) < 10) {
    return normalizeSentence(String(value).replace(/;\s*/g, '. '))
      .replace(/([.!?]\s+)([a-z])/g, (_, boundary, letter) => `${boundary}${letter.toUpperCase()}`);
  }
  return normalizeSentence(lead);
}

function replaceSpecialistLanguage(value = '') {
  return PLAIN_LANGUAGE_REPLACEMENTS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    String(value)
  );
}

function summaryTokens(value = '') {
  const ignored = new Set([
    'about', 'after', 'again', 'against', 'along', 'also', 'among', 'because',
    'been', 'being', 'between', 'could', 'does', 'from', 'have', 'into', 'more',
    'other', 'over', 'such', 'than', 'that', 'their', 'there', 'these', 'they',
    'this', 'through', 'under', 'when', 'where', 'which', 'while', 'with', 'would'
  ]);
  return new Set(
    String(value)
      .toLocaleLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 3 && !ignored.has(token))
  );
}

function isDistinctSummarySentence(existing, candidate) {
  const normalizedCandidate = normalizeSentence(candidate).toLocaleLowerCase();
  if (!normalizedCandidate) return false;
  return existing.every(sentence => {
    const normalizedSentence = normalizeSentence(sentence).toLocaleLowerCase();
    if (
      normalizedSentence === normalizedCandidate
      || normalizedSentence.includes(normalizedCandidate)
      || normalizedCandidate.includes(normalizedSentence)
    ) return false;
    const existingTokens = summaryTokens(sentence);
    const candidateTokens = summaryTokens(candidate);
    if (!existingTokens.size || !candidateTokens.size) return true;
    const shared = [...candidateTokens].filter(token => existingTokens.has(token)).length;
    return shared / Math.min(existingTokens.size, candidateTokens.size) < 0.55;
  });
}

function isReaderFacingSummarySentence(value = '') {
  const sentence = String(value).trim();
  const words = wordCount(sentence);
  return words >= 7
    && words <= 44
    && !/\b(?:the edge|anchor|promotion|contract repair|rehabilitation|graph influence|forcing proxy|source readback|bounded pathway|local attribution|scope and counterevidence|local emissions-flow meter)\b/i.test(sentence)
    && !/\b[A-Z][A-Z0-9.-]{1,}\b/.test(sentence);
}

function summarySentenceCandidates(value = '') {
  return String(value)
    .replace(/;\s*/g, '. ')
    .split(/(?<=[.!?])\s+/)
    .flatMap(sentence => sentences(replaceSpecialistLanguage(rewriteKnownTemplate(sentence))))
    .filter(isReaderFacingSummarySentence);
}

function plainNodePhrase(value = '') {
  return replaceSpecialistLanguage(String(value)
    .replace(/_/g, ' ')
    .replace(/^Global Temperature$/i, 'warming')
    .replace(/^Temp$/i, 'warming')
    .replace(/^Steel$/i, 'steel production')
    .replace(/^Shipping$/i, 'shipping activity')
    .replace(/^PM2 5 Particulates$/i, 'fine-particle pollution')
    .replace(/^AI Data Centers$/i, 'artificial intelligence data centers'))
    .trim()
    .toLocaleLowerCase();
}

function normalizeSummaryShorthand(sentence) {
  const pluralVerb = Object.freeze({
    adds: 'add',
    accelerates: 'accelerate',
    amplifies: 'amplify',
    causes: 'cause',
    changes: 'change',
    contributes: 'contribute',
    drives: 'drive',
    enables: 'enable',
    increases: 'increase',
    intensifies: 'intensify',
    raises: 'raise',
    reduces: 'reduce',
    shifts: 'shift',
    weakens: 'weaken'
  });
  return normalizeSentence(String(sentence)
    .replace(/^Temp changes river flow regime shift\b/i, 'Higher global temperatures change river-flow timing and volume')
    .replace(/^Temp intensifies wildfire regime shift\b/i, 'Higher global temperatures intensify wildfire risk and behavior')
    .replace(/^Temp\b/i, 'Higher global temperatures')
    .replace(/^Higher global temperatures (adds|accelerates|amplifies|causes|changes|contributes|drives|enables|increases|intensifies|raises|reduces|shifts|weakens)\b/i, (_, verb) => `Higher global temperatures ${pluralVerb[verb.toLocaleLowerCase()] || verb}`)
    .replace(/\bpm2 5 particulates\b/gi, 'fine-particle pollution')
    .replace(/\bai data centers\b/gi, 'artificial intelligence data centers')
    .replace(/oxygen ability to remain dissolved/gi, 'the amount of oxygen water can hold')
    .replace(/strengthens layering that limits mixing and ventilation changes/gi, 'strengthens ocean layering and reduces ventilation'));
}

function completeSummarySubject(edge, sentence, sourceName) {
  if (
    /^Changes in\b/i.test(sentence)
    || !/^(?:Alters|Amplifies|Causes|Changes|Contributes|Creates|Drives|Enables|Increases|Intensifies|Reduces|Raises|Shifts|Weakens)\b/i.test(sentence)
  ) {
    return normalizeSummaryShorthand(sentence);
  }
  const label = String(sourceName || edge.source || 'the source condition')
    .replace(/_/g, ' ')
    .replace(/^./, letter => letter.toUpperCase());
  return normalizeSummaryShorthand(`${label} ${sentence.charAt(0).toLocaleLowerCase()}${sentence.slice(1)}`);
}

function readableList(items = []) {
  const values = items
    .map(item => replaceSpecialistLanguage(String(item).replace(/[_-]+/g, ' ').trim().toLocaleLowerCase()))
    .filter(Boolean)
    .slice(0, 3);
  if (values.length <= 1) return values[0] || '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values[0]}, ${values[1]}, and ${values[2]}`;
}

function relationshipContextSentence(edge, sourceName) {
  const moderators = edge.evidence?.moderators || edge.evidence?.dossier?.moderators || [];
  const moderatorList = readableList(Array.isArray(moderators) ? moderators : []);
  if (moderatorList) {
    const lead = ['reduces', 'constrains'].includes(edge.semantic_role)
      ? 'How much protection this provides depends on'
      : 'How strongly this effect develops depends on';
    return normalizeSentence(`${lead} ${moderatorList}`);
  }

  const sourcePhrase = plainNodePhrase(sourceName || edge.source || 'the source condition');
  const key = `${edge.source}->${edge.target}`;
  const variant = [...key].reduce((total, character) => total + character.charCodeAt(0), 0) % 3;
  if (['reduces', 'constrains'].includes(edge.semantic_role)) {
    return [
      `The size of the reduction depends on the reach and persistence of ${sourcePhrase}.`,
      `The protective effect depends on the geographic reach and persistence of ${sourcePhrase}.`,
      `The reduction grows as the reach or duration of ${sourcePhrase} increases.`
    ][variant];
  }
  return [
    `The size of the change depends on the intensity and duration of ${sourcePhrase}.`,
    `The downstream effect depends on the geographic reach and persistence of ${sourcePhrase}.`,
    `The relationship grows stronger as the reach or duration of ${sourcePhrase} increases.`
  ][variant];
}

function plainLanguageSummary(edge, sourceName) {
  const key = `${edge.source}->${edge.target}`;
  const preferred = PLAIN_LANGUAGE_OVERRIDES[key];
  const secondaryOverride = PLAIN_LANGUAGE_SECONDARY_OVERRIDES[key];
  const sources = [
    preferred,
    edge.relationship_description,
    secondaryOverride,
    edge.evidence?.mechanism,
    edge.evidence?.dossier?.mechanism,
    edge.evidence?.source_readback?.exact_claim,
    edge.evidence?.counterevidence,
    edge.evidence?.notes,
    edge.evidence?.geography,
    edge.evidence?.geographic_scope
  ].filter(Boolean);
  const selected = [];
  let selectedWords = 0;

  for (const source of sources) {
    for (const rawCandidate of summarySentenceCandidates(source)) {
      const candidate = completeSummarySubject(edge, rawCandidate, sourceName);
      const candidateWords = wordCount(candidate);
      if (!isDistinctSummarySentence(selected, candidate)) continue;
      if (selected.length && selectedWords + candidateWords > 82) continue;
      selected.push(candidate);
      selectedWords += candidateWords;
      if (selected.length === 2) return selected.join(' ');
    }
  }

  const fallback = relationshipContextSentence(edge, sourceName);
  if (isDistinctSummarySentence(selected, fallback)) {
    selected.push(fallback);
  } else if (selected.length === 1) {
    const alternate = ['reduces', 'constrains'].includes(edge.semantic_role)
      ? 'The benefit grows when the response is sustained and reaches the places most exposed to the problem.'
      : 'The downstream outcome becomes more likely when the pressure persists and local safeguards are weak.';
    selected.push(alternate);
  }
  return selected.slice(0, 2).join(' ') || normalizeSentence(
    replaceSpecialistLanguage(stripTechnicalTail(rewriteKnownTemplate(edge.relationship_description)))
  );
}

function confidenceContent(edge) {
  const level = edge.evidence?.confidence || edge.confidence || 'moderate';
  const relationshipLevel = edge.evidence?.relationship_level || 'indirect';
  const explanation = level === 'high' && relationshipLevel === 'direct'
    ? 'Supported by direct, relationship-specific evidence within the stated conditions.'
    : level === 'high'
      ? 'Supported by strong relationship-specific evidence, although the effect may operate through intermediate steps.'
      : relationshipLevel === 'direct'
        ? 'Supported by direct reviewed evidence, but the strength or size of the effect depends on context.'
        : 'Supported by reviewed evidence, but the relationship is indirect and depends on context and intermediate steps.';
  return { level, relationship_level: relationshipLevel, explanation };
}

function relationshipSources(edge) {
  const readbackLocators = edge.evidence?.source_readback?.source_locators || [];
  const estimateLocator = edge.evidence?.quantitative_evidence
    ?.relationship_quantification?.scientific_effect_estimate?.source_locator;
  const locatorByUrl = new Map();
  for (const locator of [...readbackLocators, ...(estimateLocator ? [estimateLocator] : [])]) {
    if (!locator?.url || locatorByUrl.has(locator.url)) continue;
    locatorByUrl.set(locator.url, {
      url: locator.url,
      section: locator.section || locator.locator || '',
      source_type: locator.source_type || 'relationship_evidence',
    });
  }
  for (const url of edge.evidence?.relationship_source_urls || edge.evidence?.source_urls || []) {
    if (!url || locatorByUrl.has(url)) continue;
    locatorByUrl.set(url, { url, section: '', source_type: 'relationship_evidence' });
  }
  return [...locatorByUrl.values()];
}

function technicalDetail(edge, plainLanguage) {
  const exactClaim = normalizeSentence(edge.evidence?.source_readback?.exact_claim);
  const reviewedDescription = normalizeSentence(edge.relationship_description);
  if (exactClaim && exactClaim.toLocaleLowerCase() !== plainLanguage.toLocaleLowerCase()) return exactClaim;
  if (reviewedDescription && reviewedDescription.toLocaleLowerCase() !== plainLanguage.toLocaleLowerCase()) return reviewedDescription;
  const mechanism = normalizeSentence(edge.evidence?.mechanism);
  if (mechanism && mechanism.toLocaleLowerCase() !== plainLanguage.toLocaleLowerCase()) return mechanism;
  return exactClaim || reviewedDescription || mechanism || plainLanguage;
}

export function attachRelationshipContent(nodes, edges) {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  return edges.map(edge => {
    const plainLanguage = plainLanguageSummary(edge, nodeById.get(edge.source)?.name);
    return {
      ...edge,
      relationship_content: {
        plain_language: plainLanguage,
        technical_detail: technicalDetail(edge, plainLanguage),
        confidence: confidenceContent(edge),
        sources: relationshipSources(edge),
      },
    };
  });
}
