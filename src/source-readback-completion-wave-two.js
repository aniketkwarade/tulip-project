const locator = (url, section, sourceType = 'authoritative_assessment') => Object.freeze({
  url,
  section,
  source_type: sourceType
});

const record = (exactClaim, scope, counterevidence, sourceLocators) => Object.freeze({
  reviewed_at: '2026-07-25',
  reviewer: 'northstar_exact_claim_completion_wave_two_v1',
  exact_claim: exactClaim,
  geographic_temporal_scope: scope,
  moderators_and_counterevidence: counterevidence,
  source_locators: Object.freeze(sourceLocators)
});

export const SOURCE_READBACK_COMPLETION_WAVE_TWO = Object.freeze({
  'aviation_demand_growth->aviation': record(
    'Growth in passenger- and freight-transport demand is represented operationally as additional aviation activity; this edge links a demand-growth indicator to the broader aviation system and is not an independent physical causal effect.',
    'Global or route-level passenger-kilometres, freight tonne-kilometres, flights, load factors and fleet activity; monthly to multi-decadal observations or scenarios.',
    'Fleet utilization, load factors, substitution, capacity limits, prices and efficiency can decouple demand growth from flights or fuel use. The two nodes partially overlap, so analyses must not count this edge as an independent climate pathway.',
    [
      locator('https://www.icao.int/news/passenger-air-traffic-surpasses-pre-pandemic-levels', 'ICAO traffic outlook: passenger demand, freight tonne-kilometres and projected air-traffic activity.', 'authoritative_operational_statistics'),
      locator('https://www.icao.int/environmental-protection/environmental-tools/icec', 'ICAO Carbon Emissions Calculator methodology: route, aircraft, load-factor and cargo inputs connecting activity to fuel-related emissions.', 'independent_authoritative_method')
    ]
  ),
  'humidity_amplification->flash_flood_regime': record(
    'Greater atmospheric moisture can raise short-duration extreme-rainfall potential and thereby increase flash-flood hazard when storms, terrain, soils, drainage and antecedent wetness convert rainfall into rapid runoff.',
    'Named catchment and storm with humidity, precipitation intensity, antecedent moisture and discharge observations; minutes to days, with climate trends assessed over decades.',
    'Moisture alone does not create a storm or flood. Convection, storm motion, topography, impervious cover, drainage capacity, soil state and river routing can dominate.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', 'Sections 11.4 and 11.9: atmospheric moisture, heavy precipitation and regional flood uncertainty.'),
      locator('https://www.weather.gov/pub/pnsfloodsafety', 'National Weather Service flash-flood mechanism: intense rainfall, rapid runoff, terrain and drainage conditions.', 'independent_authoritative_hazard_guidance')
    ]
  ),
  'atmospheric_dryness->lightning_fire_weather': record(
    'High atmospheric dryness can dry fuels and increase ignition efficiency and fire spread during lightning events, but does not determine lightning occurrence.',
    'Named fire-prone region with vapour-pressure deficit, fuel moisture, lightning, ignition and fire observations; event to fire-season scale.',
    'Storm moisture, lightning polarity, fuel continuity, recent rain, wind, suppression and human ignitions materially alter the pathway. Dry air without lightning cannot produce a lightning ignition.',
    [
      locator('https://www.nature.com/articles/s41467-022-34966-3', 'Results and Discussion: lightning-ignited fires under changing fuel and fire-weather conditions.', 'peer_reviewed_primary_study'),
      locator('https://repository.library.noaa.gov/view/noaa/25658/noaa_25658_DS1.pdf', 'NOAA-hosted study sections on dry lightning, fuel dryness and wildfire ignition conditions.', 'independent_primary_study')
    ]
  ),
  'particulate_soot_levels->soot_deposition_on_snow': record(
    'Atmospheric black-carbon particles can deposit onto snow and ice, darkening the surface and increasing absorbed solar energy where deposited mass is sufficient.',
    'Named snow or ice surface and contributing air mass with black-carbon concentration, deposition, snow impurity and albedo observations; event to seasonal accumulation.',
    'Transport height, precipitation scavenging, particle aging, snow grain size, dust, fresh snowfall and melt concentration affect deposition and radiative impact. Ambient concentration is not deposited mass.',
    [
      locator('https://www.giss.nasa.gov/pubs/abs/do02100q.html', 'NASA GISS study abstract and results on soot deposition, snow albedo and climate response.', 'peer_reviewed_primary_model_study'),
      locator('https://ntrs.nasa.gov/citations/20130006712', 'NASA technical record on black carbon in snow and ice, source regions and radiative effects.', 'independent_authoritative_synthesis')
    ]
  ),
  'blocking_pattern_persistence->drought_persistence': record(
    'Persistent blocking can prolong regional drought by repeatedly diverting storm tracks and suppressing precipitation over the blocked region.',
    'Diagnosed blocking event and affected region with circulation, precipitation and soil-moisture observations; days to months.',
    'Blocking definitions differ, and ocean conditions, land feedbacks, water management and other circulation modes can initiate or sustain drought. Not every block is dry in every location.',
    [
      locator('https://www.nature.com/articles/s41467-026-70487-z', 'Event attribution and circulation analysis linking persistent blocking with prolonged hydroclimate anomalies.', 'peer_reviewed_primary_study'),
      locator('https://www.nature.com/articles/s41598-023-48861-4', 'Results and Discussion: blocking occurrence, storm-track displacement and regional drought persistence.', 'independent_peer_reviewed_study')
    ]
  ),
  'blocking_pattern_persistence->compound_day_night_heat_extremes': record(
    'Persistent anticyclonic blocking can prolong compound hot-day and hot-night events through subsidence, clear-sky heating and reduced ventilation.',
    'Named blocking and heat event with daily maximum and minimum temperature and circulation diagnostics; several days to weeks.',
    'Soil moisture, humidity, clouds, urban heat, advection and block position determine surface temperature. A block can occur without compound heat, particularly outside warm seasons.',
    [
      locator('https://www.nature.com/articles/s41612-022-00290-2', 'Results and Discussion: atmospheric circulation and persistence of compound daytime and nighttime heat extremes.', 'peer_reviewed_primary_study'),
      locator('https://www.nature.com/articles/s41467-026-70487-z', 'Independent circulation analysis of persistent blocking and prolonged regional extremes.', 'independent_peer_reviewed_study')
    ]
  ),
  'rossby_wave_stalling->blocking_pattern_persistence': record(
    'Slowly propagating or amplified Rossby-wave configurations can support persistent blocking when wave breaking, background flow and regional circulation align.',
    'Diagnosed midlatitude wave and blocking events; daily circulation fields over days to weeks.',
    'Wave phase speed and amplitude are not equivalent to blocking. Diagnostic choice, stratospheric coupling, topography, tropical forcing and internal variability can produce or end blocks.',
    [
      locator('https://doi.org/10.1029/2022JD038380', 'Methods and Results: Rossby-wave propagation, persistence and blocking diagnostics.', 'peer_reviewed_primary_study'),
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-10/', 'Chapter 10 circulation assessment: jets, planetary waves, blocking, diagnostic uncertainty and internal variability.', 'independent_authoritative_assessment')
    ]
  ),
  'low_cloud_deck_retreat->temp': record(
    'A reduction in reflective marine low-cloud cover can increase absorbed solar radiation and amplify warming, constituting a positive low-cloud feedback in susceptible regimes.',
    'Subtropical marine low-cloud regions in observations and model perturbations; seasonal to multi-decadal response.',
    'Cloud optical depth, circulation, inversion strength, aerosols and compensating cloud changes alter net forcing. Low-cloud feedback remains a major uncertainty and is not uniform globally.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/', 'Sections 7.4.2 and 7.4.4: low-cloud feedback, radiative mechanism and assessed uncertainty.'),
      locator('https://www.nature.com/articles/s41558-021-01039-0', 'Results and Discussion: observed or modelled low-cloud changes and radiative feedback under warming.', 'independent_peer_reviewed_study')
    ]
  ),
  'ocean_salinity_stratification->oceanic_deoxygenation': record(
    'Stronger upper-ocean stratification can reduce vertical ventilation and oxygen resupply below the mixed layer, contributing to deoxygenation.',
    'Named ocean basin or water mass with salinity, density, mixing, circulation and dissolved-oxygen profiles; seasonal to multi-decadal.',
    'Temperature-driven solubility loss, circulation change, respiration and nutrient loading also affect oxygen. Salinity stratification can weaken locally, and stratification alone does not identify the oxygen budget.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', 'Sections on ocean warming, stratification, ventilation and dissolved-oxygen change.'),
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', 'Ocean ecosystem assessment: deoxygenation mechanisms, regional variation and ecological consequences.', 'independent_authoritative_assessment')
    ]
  ),
  'oceanic_deoxygenation->marine_food_web_simplification': record(
    'Persistent low oxygen can exclude or kill oxygen-sensitive organisms and favour tolerant taxa, simplifying local marine food-web structure when exposure exceeds species thresholds.',
    'Named marine or coastal ecosystem with oxygen profiles, exposure duration and community observations; event to multi-year ecological response.',
    'Mobility, acclimation, species thresholds, temperature, acidification, fishing and nutrient loading change outcomes. Deoxygenation does not imply uniform collapse of an entire regional food web.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', 'Sections on deoxygenation, hypoxia, species redistribution, mortality and food-web effects.'),
      locator('https://oceanservice.noaa.gov/hazards/hypoxia/', 'NOAA hypoxia assessment: low-oxygen effects on mobile and benthic organisms and food-web habitat.', 'independent_authoritative_assessment')
    ]
  ),
  'pacific_decadal_oscillation->marine_heatwaves': record(
    'Pacific Decadal Oscillation phase can modulate the location, likelihood or intensity of Pacific marine heatwaves through basin-scale sea-surface-temperature and circulation anomalies.',
    'Pacific basin or named coastal region with a declared PDO index and marine-heatwave definition; monthly to decadal variability.',
    'PDO is a statistical climate mode rather than a single forcing. ENSO, atmospheric ridging, ocean advection and long-term warming can dominate individual events; results depend on index and baseline.',
    [
      locator('https://repository.library.noaa.gov/view/noaa/54477', 'NOAA-hosted analysis of Pacific climate modes and marine-heatwave occurrence.', 'peer_reviewed_primary_study'),
      locator('https://psl.noaa.gov/data/correlation/pdo.data', 'NOAA Physical Sciences Laboratory PDO index record used to bound phase and period.', 'independent_authoritative_dataset')
    ]
  ),
  'harmful_algal_blooms->fish_landing_supply_disruption': record(
    'A harmful algal bloom can disrupt fish or shellfish landings when toxins, mortality or precautionary closures make harvest unsafe or unavailable.',
    'Named bloom, fishery and management jurisdiction with toxin monitoring, closure dates, mortality and landings; days to seasons.',
    'Many blooms are non-toxic, fish can move, and closures may be precautionary. Weather, quota, effort, market demand, disease and hypoxia can independently change landings.',
    [
      locator('https://www.fisheries.noaa.gov/west-coast/science-data/effects-harmful-algal-blooms-west-coast-fishing-communities', 'NOAA Fisheries overview: toxins, fishery closures, mortality and seafood-safety monitoring.'),
      locator('https://oceanservice.noaa.gov/hazards/hab/', 'NOAA Ocean Service HAB assessment: ecological, health and fishery impacts.', 'independent_authoritative_assessment')
    ]
  ),
  'coastal_hypoxia->fish_landing_supply_disruption': record(
    'Coastal hypoxia can disrupt fishery supply by causing mortality, compressing habitat or displacing target species and fishing effort.',
    'Named coastal hypoxic event and fishery with oxygen, species distribution, effort and landings data; days to seasons.',
    'Mobile species may avoid the area, shifting rather than reducing landings. Quotas, weather, price, fleet behaviour and harmful blooms can be stronger explanations.',
    [
      locator('https://oceanservice.noaa.gov/hazards/hypoxia/', 'NOAA hypoxia assessment: mortality, habitat compression and displacement of fish and shellfish.'),
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', 'Ocean and coastal ecosystem assessment: hypoxia, fisheries exposure and interacting stressors.', 'independent_authoritative_assessment')
    ]
  ),
  'littoral_surge_vulnerability->compound_coastal_flooding': record(
    'Low-lying, surge-exposed coasts face greater compound-flood hazard when storm surge coincides with high tide, waves, sea-level anomaly or river discharge.',
    'Named coastal reach and event with elevation, defences, surge, tide, wave and river observations; hours to days, with vulnerability trends over decades.',
    'Exposure is not an event trigger. Storm track, tide phase, river flow, defences, bathymetry and forecasting alter flooding, and a vulnerable coast may not flood without coincident forcing.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', 'Coastal risk sections: compound flooding, sea-level rise, surge, waves, exposure and adaptation.'),
      locator('https://oceanservice.noaa.gov/facts/stormsurge-stormtide.html', 'NOAA distinction between storm surge and storm tide and the role of tide and coastal configuration.', 'independent_authoritative_hazard_guidance')
    ]
  ),
  'littoral_surge_vulnerability->coastal_erosion': record(
    'Surge-exposed, sediment-limited coasts can experience greater erosion during storms as elevated water levels and waves attack beaches, dunes or cliffs.',
    'Named shoreline and storm with water level, waves, sediment budget and pre/post shoreline observations; event to multi-decadal recovery.',
    'Sediment supply, geology, wave direction, vegetation, engineering and post-storm recovery govern net change. Vulnerability alone is not measured erosion.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', 'Coastal erosion, storm surge, sea-level rise, sediment supply and adaptation sections.'),
      locator('https://oceanservice.noaa.gov/facts/shoreline-stabilization.html', 'NOAA coastal erosion and shoreline response guidance, including natural and engineered modifiers.', 'independent_authoritative_assessment')
    ]
  ),
  'amoc->coastal_inundation_risk': record(
    'AMOC variability can alter regional dynamic sea level in the North Atlantic and thereby modulate coastal inundation risk when combined with tides, surge, waves and long-term sea-level rise.',
    'North Atlantic coast with AMOC or circulation diagnostics and tide-gauge or altimetry records; interannual to multi-decadal variability.',
    'AMOC is not the sole control on coastal water level. Wind, pressure, steric change, land motion, tides, storms and uncertain modelled AMOC response can dominate at a given coast.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', 'Sections 9.2.3 and 9.2.4: AMOC variability, ocean heat transport and dynamic regional sea-level change.'),
      locator('https://oceanservice.noaa.gov/facts/sealevel.html', 'NOAA sea-level guidance: regional sea level, land motion and coastal flooding boundary.', 'independent_authoritative_assessment')
    ]
  ),
  'peaker_plant_lock_in->ambient_air_quality_deficit': record(
    'Continued operation of fossil-fuel peaker plants can worsen nearby air quality during dispatch by emitting nitrogen oxides and, depending on fuel and controls, particulate matter and other pollutants.',
    'Named generating unit, dispatch interval and downwind airshed with emissions and ambient monitoring; hourly peaks to annual operations.',
    'Fuel, controls, stack height, meteorology and background pollution determine exposure. Capacity retention does not equal operation, and newer or well-controlled units may have small local increments.',
    [
      locator('https://www.epa.gov/egrid', 'EPA eGRID unit and plant emissions, generation and fuel data used to measure dispatched emissions.', 'authoritative_operational_dataset'),
      locator('https://www.eia.gov/energyexplained/natural-gas/natural-gas-and-the-environment.php', 'EIA combustion-emissions summary for natural-gas generation, including nitrogen oxides and carbon dioxide.', 'independent_authoritative_assessment')
    ]
  ),
  'semiconductor_fabs->semiconductor_fabrication_footprint': record(
    'The semiconductor-fabrication footprint is an operational aggregation of a fab fleet’s electricity, water, chemicals, waste and process-gas use; this edge is a measurement roll-up rather than an independent causal effect.',
    'Named fabrication facility or fleet with matched wafer output and resource inventories; monthly to annual reporting.',
    'Process node, wafer size, utilization, product mix, abatement and accounting boundary change intensity. The source and target partially overlap and must not be double-counted as separate physical drivers.',
    [
      locator('https://www.nist.gov/chips/implementation-strategies/national-environmental-policy-act-nepa-and-chips-act', 'Programmatic environmental assessment: fab energy, water, chemicals, air emissions and waste categories.', 'authoritative_program_assessment'),
      locator('https://www.oecd.org/en/topics/sub-issues/semiconductors.html', 'OECD semiconductor value-chain and production-system boundary.', 'independent_authoritative_context')
    ]
  ),
  'semiconductor_fabrication_footprint->cooling_water_competition': record(
    'Semiconductor fabrication can add to local water competition where ultrapure-water production and cooling withdrawals or consumption are material relative to available supply.',
    'Named fabrication facility and water-source service area with withdrawals, consumption, discharge, reuse and competing demand; daily to annual.',
    'Water intensity varies by process, cooling system, recycling and product mix. Withdrawals are not consumption, and abundant or reclaimed supply can prevent competition.',
    [
      locator('https://www.nist.gov/chips/implementation-strategies/national-environmental-policy-act-nepa-and-chips-act', 'Water resources and utility sections: semiconductor-facility process and cooling-water demand and mitigation.', 'authoritative_program_assessment'),
      locator('https://www.epa.gov/waterreuse/water-reuse-industrial-applications-resources', 'EPA industrial water-reuse guidance defining reuse options and local supply boundary.', 'independent_authoritative_guidance')
    ]
  ),
  'semiconductor_fabrication_footprint->carbon_emission': record(
    'Semiconductor fabrication contributes greenhouse-gas emissions through purchased electricity, on-site energy and fluorinated process gases after accounting for abatement.',
    'Named fab or fleet with Scope 1 and Scope 2 inventories, process-gas use, abatement efficiency and wafer output; annual reporting.',
    'Grid mix, process recipe, utilization, abatement and accounting boundary strongly alter emissions. Electricity use is not direct carbon dioxide, and gross gas purchases are not emitted mass.',
    [
      locator('https://www.epa.gov/eps-partnership/semiconductor-industry', 'EPA semiconductor fluorinated-greenhouse-gas use, emissions and abatement program.', 'authoritative_industry_assessment'),
      locator('https://www.nist.gov/chips/implementation-strategies/national-environmental-policy-act-nepa-and-chips-act', 'Air quality, greenhouse-gas and energy sections for semiconductor-facility expansion.', 'independent_authoritative_program_assessment')
    ]
  ),
  'data_centers->backup_generator_dependence': record(
    'Data centres commonly maintain on-site backup generation to meet uptime requirements during grid interruption or testing, creating a conditional dependence on generators rather than continuous generation.',
    'Named facility with installed generator capacity, fuel, test schedules and outage operation; event to annual runtime.',
    'Battery ride-through, redundant grid feeds, fuel cells, microgrids and reliability tier alter dependence. Installed capacity does not establish runtime or emissions.',
    [
      locator('https://www.iea.org/reports/energy-and-ai/ai-and-energy-security', 'Data-centre reliability, backup power and grid-interconnection sections.'),
      locator('https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report', 'United States data-centre facility systems, electricity demand and backup-power boundary.', 'independent_national_laboratory_assessment')
    ]
  ),
  'drought_persistence->soil_moisture_collapse': record(
    'Persistent precipitation deficit and evaporative demand can drive soil moisture to exceptionally low levels when storage is not replenished.',
    'Named soil layer and region with precipitation, evapotranspiration and soil-moisture observations; weeks to seasons.',
    'Irrigation, groundwater access, soil depth, vegetation and rainfall timing can buffer decline. Low soil moisture can also reinforce heat and drought, so feedback direction must be time-resolved.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', 'Drought sections: precipitation deficit, evaporative demand, soil-moisture drought and feedbacks.'),
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/', 'Water chapter: soil-moisture drought, water storage and managed buffering.', 'independent_authoritative_assessment')
    ]
  ),
  'irrigation_water_inefficiency->aquifer_overdraft': record(
    'Low irrigation application or conveyance efficiency can increase gross groundwater withdrawals and contribute to aquifer overdraft where pumping persistently exceeds recharge and return flows.',
    'Named irrigated aquifer with withdrawals, consumptive use, return flows, recharge and water-level observations; seasonal to multi-decadal.',
    'Efficiency upgrades can increase consumptive use if saved water expands irrigated area. Surface-water substitution, recharge and return flows can prevent overdraft; inefficiency alone is not a groundwater balance.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/', 'Agricultural water use, irrigation efficiency, groundwater depletion and rebound limitations.'),
      locator('https://www.usgs.gov/water-science-school/science/groundwater-decline-and-depletion', 'USGS groundwater-budget mechanism: sustained pumping above recharge causes decline and depletion.', 'independent_authoritative_assessment')
    ]
  ),
  'snowmelt_timing_shift->river_flow_regime_shift': record(
    'Earlier snowmelt can shift snow-fed river flow toward earlier seasonal runoff and reduce warm-season contribution where storage and rainfall do not compensate.',
    'Named snow-dominated basin with snow-water equivalent and daily discharge; seasonal timing and multi-decadal trends.',
    'Reservoir operations, glacier melt, rainfall, groundwater and basin elevation can offset or obscure the shift. Earlier melt does not necessarily change annual flow volume.',
    [
      locator('https://www.ipcc.ch/srocc/', 'Mountain and cryosphere chapters: snow decline, earlier melt and seasonal runoff timing.'),
      locator('https://www.usgs.gov/special-topics/water-science-school/science/snowmelt-runoff-and-water-cycle', 'USGS snowmelt-runoff process and timing in river systems.', 'independent_authoritative_hydrology_guidance')
    ]
  ),
  'glacial_lake_failure_risk->hydrological_runoff_surges': record(
    'Failure or overtopping of a glacial lake can release a rapid downstream flood wave and sediment surge.',
    'Named glacial lake and downstream valley with lake volume, dam condition and flood routing; minutes to days after failure.',
    'Hazard probability depends on dam type, lake growth, ice or rock avalanches and drainage. High susceptibility does not mean failure, and downstream attenuation can sharply reduce discharge.',
    [
      locator('https://www.ipcc.ch/srocc/', 'High Mountain Areas chapter: glacial-lake growth, outburst-flood hazard and downstream exposure.'),
      locator('https://public.wmo.int/media/news/devastating-floods-highlight-need-and-challenges-warnings', 'WMO glacial-lake outburst-flood mechanism, monitoring and warning boundary.', 'independent_authoritative_hazard_assessment')
    ]
  ),
  'marine_heatwaves->reef_structural_collapse': record(
    'Severe or repeated marine heatwaves can cause mass coral bleaching and mortality, reducing live coral cover and, with insufficient recovery, eroding reef structural complexity.',
    'Named coral reef with heat-stress exposure, bleaching, mortality, recovery and structural observations; weeks to decades.',
    'Species composition, acclimatization, local water quality, storms, disease and recovery intervals alter outcomes. A heatwave does not guarantee whole-reef structural collapse.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', 'Coral-reef sections: marine heatwaves, bleaching, mortality, recovery limits and ecosystem risk.'),
      locator('https://coralreefwatch.noaa.gov/satellite/index.php', 'NOAA Coral Reef Watch heat-stress products and bleaching-risk definitions.', 'independent_authoritative_monitoring_system')
    ]
  ),
  'topsoil_erosion_acceleration->soil_humus_decline': record(
    'Accelerated erosion can reduce topsoil organic matter and humus by physically removing carbon-rich surface soil faster than it is replenished.',
    'Named field or watershed with erosion, soil depth and organic-carbon measurements; storm to multi-decadal.',
    'Deposition zones can gain soil carbon, and management, vegetation, mineral protection and new organic inputs govern net humus. Erosion rate alone does not determine whole-profile carbon change.',
    [
      locator('https://www.fao.org/global-soil-partnership/areas-of-work/soil-erosion/en/', 'FAO soil-erosion mechanisms and loss of fertile, organic-matter-rich topsoil.'),
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', 'Agriculture chapter: erosion, soil organic matter, land degradation and conservation management.', 'independent_authoritative_assessment')
    ]
  ),
  'insurance_retreat->mortgage_market_exposure': record(
    'Reduced availability or rising cost of property insurance can increase mortgage-market exposure by weakening borrower protection, affordability, collateral value and loan performance in hazard-prone areas.',
    'United States property and mortgage markets at property, county or portfolio level; policy renewal to multi-year credit performance.',
    'Mortgage requirements, public insurers, lender-placed coverage, borrower income, disaster aid and property values mediate the effect. Insurance retreat is not itself a measured default.',
    [
      locator('https://www.fhfa.gov/blog/insights/an-overview-of-fhfas-key-initiatives-to-address-climate-related-financial-risks', 'FHFA sections on insurer withdrawal, affordability, housing finance and credit risk.', 'authoritative_financial_assessment'),
      locator('https://www.fhfa.gov/blog/insights/lessons-learned-from-assessing-exposure-to-climate-related-risks', 'FHFA climate-scenario analysis: insurance availability, mortgage default, loss severity and model uncertainty.', 'independent_authoritative_financial_assessment')
    ]
  ),
  'wetlands_drainage_scales->peat_oxidation_pulse': record(
    'Drainage of peat soils lowers the water table, exposes organic matter to oxygen and accelerates microbial oxidation.',
    'Verified peatland drainage area with water-table, peat condition and land-use observations; months to decades after drainage.',
    'Drain depth, peat type, temperature, vegetation, fire and rewetting alter rates. Drainage maps without verified peat or water-table response do not establish oxidation.',
    [
      locator('https://www.unep.org/news-and-stories/story/seven-things-you-should-know-about-peatlands', 'UNEP drainage mechanism: lower water tables expose carbon-rich peat to oxygen and accelerate decay.'),
      locator('https://www.unep.org/news-and-stories/story/peatlands-store-twice-much-carbon-all-worlds-forests', 'Independent UNEP synthesis of drained peatland degradation and carbon release.', 'independent_authoritative_assessment')
    ]
  ),
  'peat_oxidation_pulse->carbon_emission': record(
    'Aerobic oxidation of drained peat converts stored organic carbon to carbon dioxide and contributes to anthropogenic greenhouse-gas emissions.',
    'Verified drained peatland with area, land use, water table and applicable emission factors or flux observations; annual to multi-decadal.',
    'Fire emissions, methane, dissolved carbon, vegetation uptake and rewetting must be separated. A generic peat area cannot be converted to emissions without condition and land-use data.',
    [
      locator('https://www.unep.org/news-and-stories/story/seven-things-you-should-know-about-peatlands', 'UNEP description of oxygen exposure, peat decay and carbon-dioxide release from drainage.'),
      locator('https://www.ipcc.ch/publication/2013-supplement-to-the-2006-ipcc-guidelines-for-national-greenhouse-gas-inventories-wetlands/', 'IPCC Wetlands Supplement: drained organic-soil carbon-dioxide accounting by land use and climate zone.', 'independent_authoritative_method')
    ]
  ),
  'tidal_wetland_carbon_reversal->carbon_emission': record(
    'Degradation or conversion of tidal wetlands can reverse stored and accumulating blue carbon through soil oxidation, erosion or biomass loss, producing greenhouse-gas emissions.',
    'Named tidal wetland conversion or degradation event with habitat, soil carbon, elevation and flux or stock-change observations; annual to multi-decadal.',
    'Sediment burial, methane, lateral carbon export, restoration and landward migration alter the net balance. Habitat loss area alone is not an emissions estimate.',
    [
      locator('https://coast.noaa.gov/states/fast-facts/blue-carbon.html', 'NOAA blue-carbon stocks, sequestration and release when coastal habitats are degraded.'),
      locator('https://www.ipcc.ch/publication/2013-supplement-to-the-2006-ipcc-guidelines-for-national-greenhouse-gas-inventories-wetlands/', 'IPCC coastal-wetland stock-change and emissions accounting methods.', 'independent_authoritative_method')
    ]
  ),
  'urbanization->urban_sprawl_housing': record(
    'Urban population and economic growth can expand low-density housing footprints when zoning, transport, land prices and infrastructure favour outward development.',
    'Named urban area with population, housing units, built-area density and land-cover change; annual to multi-decadal.',
    'Compact infill, transit, zoning reform and declining household size can decouple population growth from outward sprawl. Urbanization is not synonymous with sprawl.',
    [
      locator('https://www.epa.gov/smartgrowth/about-smart-growth', 'EPA smart-growth framework distinguishing compact development from dispersed outward growth.'),
      locator('https://www.epa.gov/smartgrowth/smart-growth-and-housing', 'EPA housing and land-use guidance on location, density, transport and development pattern.', 'independent_authoritative_guidance')
    ]
  ),
  'urban_sprawl_housing->urban_tree_canopy_loss': record(
    'Low-density outward development can reduce urban and peri-urban tree canopy when construction clears vegetation and increases impervious cover without equivalent retention or replacement.',
    'Named development footprint with pre/post canopy and impervious-cover maps; project to multi-decadal canopy response.',
    'Tree-preservation rules, site design, planting, natural succession and prior land cover can maintain or increase canopy. Housing growth alone is not canopy loss.',
    [
      locator('https://www.epa.gov/heatislands/benefits-trees-and-vegetation', 'EPA urban vegetation assessment and the role of tree-cover extent in heat and ecosystem services.'),
      locator('https://www.epa.gov/sites/default/files/2017-01/documents/smart_growth_fixes_climate_adaptation_resilience.pdf', 'EPA smart-growth guidance on development patterns and protection of forests and sensitive lands.', 'independent_authoritative_guidance')
    ]
  ),
  'food->food_waste': record(
    'The agricultural-demand node creates an exposure base for stage-specific food loss and waste across production, storage, transport, retail, food service and households; it is not a fixed conversion of demand into waste.',
    'Named commodity and value-chain stage with mass-flow and loss or waste measurements; harvest cycle to annual accounting.',
    'Cold chains, storage, standards, forecasting, redistribution and consumer behaviour drive the waste fraction. More demand does not necessarily raise waste, and food loss and consumer waste must remain distinct.',
    [
      locator('https://www.fao.org/platform-food-loss-waste/flw-data/user-guide/en/', 'FAO Food Loss and Waste database definitions and value-chain stages.', 'authoritative_measurement_method'),
      locator('https://www.fao.org/policy-support/policy-themes/food-loss-and-food-waste/en', 'FAO policy framework distinguishing supply-chain food loss from retail, service and household food waste.', 'independent_authoritative_assessment')
    ]
  )
});
