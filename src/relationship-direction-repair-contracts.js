const IPCC_CRYOSPHERE = 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/';
const NASA_FIRN = 'https://science.nasa.gov/science-research/earth-science/nasa-study-identifies-new-pathway-for-greenland-meltwater-to-reach-ocean/';
const IPCC_COASTS = 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp2/';
const IPCC_ADAPTATION = 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/';
const IPBES_POLLINATORS = 'https://www.ipbes.net/assessment-reports/pollinators';
const EPA_POLLINATORS = 'https://www.epa.gov/pollinator-protection/pollinator-health-concerns';

const locator = (url, section, source_type = 'authoritative_assessment') => ({ url, section, source_type });

function repair({ source, target, verb, adverb, influence, level, mechanism, geography, time, moderators, alternatives, counterevidence, locators }) {
  const relationship_source_urls = [...new Set(locators.map(item => item.url))];
  return {
    source,
    target,
    verb,
    adverb,
    influence,
    topology_rule: 'causal_direction_repair',
    evidence: {
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: level,
      relationship_type: 'bounded_direction_repair',
      relationship_source_urls,
      source_urls: relationship_source_urls,
      mechanism,
      geographic_scope: geography,
      temporal_scope: time,
      notes: mechanism,
      dossier: {
        version: 'causal_direction_repair_v1',
        promotion_status: 'promoted',
        reviewed_at: '2026-07-18',
        source,
        target,
        mechanism,
        geographic_scope: geography,
        temporal_scope: time,
        moderators,
        alternative_explanations: alternatives,
        counterevidence,
        confidence: level === 'direct' ? 'high' : 'moderate',
        source_locators: locators,
        evidence_basis: level
      }
    }
  };
}

export const RELATIONSHIP_DIRECTION_REPAIR_RELATIONSHIPS = Object.freeze([
  repair({
    source: 'firn_layer_depletion', target: 'ice_sheet_mass_loss',
    verb: 'can increase runoff contribution to', adverb: 'when ice layers and reduced pore space limit meltwater retention', influence: 0.48, level: 'direct',
    mechanism: 'Loss of firn pore space and formation of impermeable ice layers reduce refreezing and retention capacity, allowing a larger share of surface meltwater to run off and contribute to ice-sheet mass loss.',
    geography: 'Measured firn zones of Greenland or Antarctica with co-located accumulation, melt, density, refreezing, and runoff estimates.',
    time: 'Seasonal melt years to multi-decadal firn-air-content and mass-balance trends.',
    moderators: ['snow accumulation', 'firn temperature', 'melt intensity', 'ice-layer permeability', 'surface elevation', 'meltwater routing'],
    alternatives: ['dynamic ice discharge', 'basal melt', 'calving', 'surface sublimation', 'accumulation anomalies'],
    counterevidence: 'Cold or high-accumulation firn can retain and refreeze substantial meltwater; firn depletion does not explain dynamic discharge or every component of total ice-sheet mass balance.',
    locators: [locator(IPCC_CRYOSPHERE, 'Section 9.4.1: ice-sheet surface mass balance, firn processes, meltwater retention, runoff, and uncertainty'), locator(NASA_FIRN, 'Greenland firn observations: ice layers and lower-than-expected meltwater trapping', 'independent_authoritative')]
  }),
  repair({
    source: 'coastal_inundation_risk', target: 'managed_retreat_pressure',
    verb: 'can increase pressure for', adverb: 'where repeated or projected inundation exceeds feasible protection and accommodation', influence: 0.5, level: 'indirect',
    mechanism: 'Repeated or projected coastal inundation can make continued protection, rebuilding, or accommodation infeasible, increasing the need to evaluate rights-based managed retreat or planned relocation.',
    geography: 'Named coastal settlement or asset class with mapped inundation, exposure, protection standard, residual risk, tenure, and relocation options.',
    time: 'Repeated events and planning horizons of years to decades; not a single-event automatic trigger.',
    moderators: ['protection feasibility', 'adaptation finance', 'land tenure', 'community consent', 'cultural attachment', 'receiving-area capacity', 'insurance and recovery policy'],
    alternatives: ['protect in place', 'accommodate through elevation or floodproofing', 'ecosystem-based protection', 'temporary displacement', 'unmanaged market retreat'],
    counterevidence: 'Inundation risk does not inevitably produce retreat: protection, accommodation, finance, political choices, risk tolerance, and community preference can delay or avoid relocation.',
    locators: [locator(IPCC_COASTS, 'CCP2.3 and CCP2.4: coastal risk, limits to protect and accommodate strategies, retreat, migration, and planned relocation'), locator(IPCC_ADAPTATION, 'Sections 17.2 and 17.5: adaptation portfolios, protection, retreat, governance, finance, equity, and decision-making', 'independent_authoritative')]
  }),
  repair({
    source: 'deforestation', target: 'pollinator_colony_collapse',
    verb: 'can contribute to', adverb: 'when forest loss removes forage, nesting habitat, and connectivity for a monitored pollinator population', influence: 0.46, level: 'indirect',
    mechanism: 'Forest and semi-natural habitat loss can reduce floral resources, nesting sites, refugia, and connectivity, contributing to pollinator population or colony loss alongside pesticides, pathogens, climate, and management.',
    geography: 'Named pollinator population or managed colony system within a mapped forest and semi-natural-habitat landscape.',
    time: 'Seasonal resource availability through multi-year occupancy, abundance, survival, or colony-loss monitoring.',
    moderators: ['pollinator species', 'remaining habitat quality', 'floral continuity', 'nesting substrate', 'landscape connectivity', 'pesticide exposure', 'pathogens and parasites'],
    alternatives: ['pesticide toxicity', 'pathogen or parasite pressure', 'drought or heat', 'colony management', 'survey detectability', 'seasonal movement'],
    counterevidence: 'Tree-cover loss alone does not establish pollinator decline; some open-habitat species can benefit from particular disturbances, and restored or alternative forage can partly offset forest-habitat loss.',
    locators: [locator(IPBES_POLLINATORS, 'Pollinators assessment: land-use change, habitat loss and fragmentation, forage and nesting resources, and interacting drivers'), locator(EPA_POLLINATORS, 'Pollinator health concerns: poor nutrition and habitat loss among interacting bee-health stressors', 'independent_authoritative')]
  }),
  repair({
    source: 'sea_level_rise', target: 'coastal_inundation_risk',
    verb: 'raises the frequency of', adverb: 'by elevating the baseline on which tides, surge, waves, and local land motion act', influence: 0.66, level: 'direct',
    mechanism: 'Rising regional mean sea level elevates the baseline coastal water level, causing historically rare extreme still-water levels to be exceeded more frequently where tides, surge, waves, vertical land motion, and exposure align.',
    geography: 'Named tide gauge or coastal segment with regional relative sea-level projections, vertical land motion, extreme-water-level statistics, and mapped exposure.',
    time: 'Observed twentieth-century change and projections to 2050 or 2100 relative to an explicitly declared recent baseline.',
    moderators: ['vertical land motion', 'tides', 'storm surge', 'wave climate', 'coastal morphology', 'defences', 'drainage', 'exposure change'],
    alternatives: ['storm-climate change without mean sea-level change', 'subsidence', 'river or pluvial flooding', 'coastal engineering or nourishment', 'changes in tide-gauge coverage'],
    counterevidence: 'Local inundation frequency can depart substantially from global mean projections because of land motion, circulation, tides, storms, morphology, defences, drainage, and exposure; the assessed amplification assumes other extreme-sea-level contributors remain stationary.',
    locators: [locator(IPCC_CRYOSPHERE, 'Section 9.6.4 and Executive Summary: regional sea level as a driver of extreme still-water levels and projected frequency amplification'), locator('https://oceanservice.noaa.gov/hazards/sealevelrise/sealevelrise-tech-report.html', 'NOAA 2022 sea-level technical report: regional relative sea level and coastal high-tide flooding', 'independent_authoritative')]
  }),
  repair({
    source: 'methane_leak_detection', target: 'ozone_formation_pressure',
    verb: 'can reduce', adverb: 'when measured fossil-system leaks trigger verified repair and lower methane and co-emitted ozone precursors', influence: -0.34, level: 'indirect',
    mechanism: 'Leak detection followed by verified repair can reduce methane, a global tropospheric-ozone precursor, and may reduce co-emitted volatile organic compounds in some oil and gas systems, lowering ozone-formation pressure over appropriate regional and atmospheric timescales.',
    geography: 'Named oil or gas asset, repair program and downwind airshed with measured methane, co-emitted precursor and ozone response or a validated atmospheric model.',
    time: 'Leak detection and repair cycle through seasonal to multi-year methane and ozone response; local co-pollutant effects are kept separate from global methane chemistry.',
    moderators: ['repair completion and persistence', 'leak recurrence', 'co-emitted VOC composition', 'NOx regime', 'meteorology', 'background methane', 'atmospheric lifetime and transport'],
    alternatives: ['biogenic VOCs', 'transport and industrial NOx', 'wildfire smoke', 'upwind ozone transport', 'unrepaired or newly emerging leaks'],
    counterevidence: 'Detection without repair has no emissions effect; not every methane leak has material local VOC co-emissions, and local ozone can be NOx- or VOC-limited. The global methane-ozone benefit cannot be assigned to one facility without an atmospheric model.',
    locators: [locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/', 'Methane as a short-lived climate forcer and ozone precursor; atmospheric chemistry, lifetime and regional air-quality effects'), locator('https://www.unep.org/resources/report/global-methane-assessment-benefits-and-costs-mitigating-methane-emissions', 'Methane mitigation, tropospheric ozone, health and crop co-benefits, sector measures and uncertainty', 'independent_authoritative')]
  }),
  repair({
    source: 'rail_heat_buckling', target: 'critical_infrastructure_fragility',
    verb: 'can increase', adverb: 'when thermal track deformation forces slow orders, closures, derailments, or loss of rail-network redundancy', influence: 0.5, level: 'direct',
    mechanism: 'Thermal expansion of constrained continuous welded rail can cause lateral buckling; inspection, slow orders, closures, or derailments can interrupt passenger, freight and emergency rail service and expose network dependencies.',
    geography: 'Named rail segment with rail-neutral temperature, track condition, ambient and rail temperature, maintenance history, operating restriction and network redundancy.',
    time: 'Hours to days during an extreme-heat event, with seasonal maintenance and multi-year climate baselines retained.',
    moderators: ['rail neutral temperature', 'track restraint and curvature', 'maintenance history', 'solar exposure', 'forecasting and inspection', 'speed restrictions', 'route redundancy'],
    alternatives: ['signal or power failure', 'flood or scour', 'wildfire closure without track deformation', 'rolling-stock failure', 'labor disruption'],
    counterevidence: 'Well-maintained and correctly stressed track, inspection, white rail coatings, speed restrictions and redundant routes can prevent high rail temperature from becoming a buckle or system-level service failure.',
    locators: [locator('https://railroads.fra.dot.gov/regulations/federal-register-documents/2012-17343', 'FRA Safety Advisory 2012-03: extreme heat, continuous-welded-rail buckling, derailments, inspection and operating controls'), locator('https://www.networkrail.co.uk/campaigns/hot-weather-and-the-railway/', 'Network Rail: steel expansion, rail temperature, buckling risk, inspection and speed restrictions', 'independent_authoritative')]
  }),
  repair({
    source: 'refrigerant_phase_down', target: 'solar_radiation_trapping',
    verb: 'reduces', adverb: 'when high-global-warming-potential refrigerant production, consumption and leakage are replaced with lower-forcing alternatives', influence: -0.48, level: 'direct',
    mechanism: 'Phasing down hydrofluorocarbons and preventing refrigerant leakage reduces emissions of high-radiative-efficiency gases, lowering their contribution to effective radiative forcing relative to an unabated refrigerant pathway.',
    geography: 'Declared jurisdiction, refrigerant bank, equipment cohort and atmospheric accounting boundary with gas-specific production, consumption, charge, leakage, recovery and destruction data.',
    time: 'Annual refrigerant flows and equipment-bank turnover over years to decades, with atmospheric lifetime and policy baseline retained.',
    moderators: ['gas species and GWP', 'equipment leakage', 'bank size and lifetime', 'recovery and destruction', 'alternative refrigerant efficiency', 'electricity emissions', 'policy enforcement'],
    alternatives: ['unreported bank leakage', 'illegal production or trade', 'poor servicing', 'substitution with another high-forcing gas', 'electricity-demand rebound'],
    counterevidence: 'A nominal phase-down does not reduce forcing if leakage, banks, illegal supply or high-GWP substitutes persist; energy-efficiency changes can add or subtract indirect power-sector effects that must remain separate from refrigerant forcing.',
    locators: [locator('https://ozone.unep.org/treaties/montreal-protocol/amendments/kigali-amendment-2016-amendment-montreal-protocol-agreed', 'Kigali Amendment: HFC production and consumption phase-down schedules and climate rationale'), locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/', 'Gas-specific effective radiative forcing, atmospheric lifetime and climate response', 'independent_authoritative')]
  }),
  repair({
    source: 'snow_drought', target: 'ice_cap_decapitation',
    verb: 'can accelerate thinning and fragmentation of', adverb: 'when persistently low accumulation is not offset by reduced melt', influence: 0.43, level: 'indirect',
    mechanism: 'Persistent snow-accumulation deficits reduce mass input to small ice caps; where ablation remains high, negative surface mass balance can thin summit and connecting ice until formerly continuous cap geometry fragments.',
    geography: 'Named small ice cap with accumulation, surface mass balance, elevation and area or connectivity mapped over time.',
    time: 'Repeated accumulation seasons to multi-decadal ice-cap thinning and fragmentation.',
    moderators: ['summer melt', 'wind redistribution', 'surface albedo', 'elevation', 'hypsometry', 'debris cover', 'short-lived accumulation recovery'],
    alternatives: ['exceptional melt without snow drought', 'volcanic or geothermal effects', 'dynamic flow change', 'measurement or classification change'],
    counterevidence: 'A single low-snow year does not establish fragmentation, and reduced snowfall can coincide with reduced melt in cold settings. Promotion requires a sustained negative mass balance and observed geometry change.',
    locators: [locator('https://www.ipcc.ch/srocc/chapter/chapter-2/', 'High-mountain snow and ice mass balance, accumulation, glacier and ice-cap retreat, fragmentation and disappearance'), locator('https://www.usgs.gov/water-science-school/science/glaciers-and-icecaps', 'Glacier and ice-cap accumulation, ablation, storage and long-term change', 'independent_authoritative')]
  }),
  repair({
    source: 'soot_deposition_on_snow', target: 'ice_cap_decapitation',
    verb: 'can accelerate thinning of', adverb: 'where deposited black carbon materially lowers snow and ice albedo', influence: 0.41, level: 'indirect',
    mechanism: 'Dark particles deposited on snow or exposed ice lower surface albedo, increase absorbed solar energy and can accelerate melt; sustained additional ablation can contribute to thinning and fragmentation of a vulnerable small ice cap.',
    geography: 'Named ice cap with measured black-carbon or light-absorbing-particle deposition, albedo, surface energy balance and mass balance.',
    time: 'Seasonal deposition and melt through multi-year geometry change; not an instantaneous fragmentation claim.',
    moderators: ['particle concentration and optical properties', 'fresh snow burial', 'cloud and solar conditions', 'meltwater flushing', 'snow grain size', 'debris cover', 'ice-cap hypsometry'],
    alternatives: ['air-temperature-driven melt', 'low accumulation', 'dust rather than soot', 'dynamic flow', 'surface ponding'],
    counterevidence: 'Fresh snowfall can restore albedo and measured soot effects may be small relative to temperature or dust. Deposition supports this edge only where radiative forcing and incremental melt are quantified for the same cap.',
    locators: [locator('https://earthobservatory.nasa.gov/images/145249/soot-speeds-up-snowmelt', 'NASA Earth Observatory: soot and black carbon darken snow, increase absorbed sunlight and accelerate melt'), locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/', 'Surface-albedo effective radiative forcing from light-absorbing particles on snow and ice', 'independent_authoritative')]
  }),
  repair({
    source: 'permafrost_thaw', target: 'nunatak_habitat_shrinkage',
    verb: 'can degrade cold-adapted habitat on', adverb: 'where thaw destabilises substrate and eliminates persistent frozen microrefugia', influence: 0.39, level: 'indirect',
    mechanism: 'Thaw of mountain or polar permafrost can alter moisture, substrate stability and cold microclimates on exposed nunataks, reducing the suitable area or persistence of specialised cold-adapted biotic habitat even where total ice-free rock area expands.',
    geography: 'Named polar or alpine nunatak with ground temperature, active-layer depth, substrate stability, snow persistence and species occupancy measured together.',
    time: 'Seasonal active-layer change through multi-decadal habitat-suitability and occupancy trends.',
    moderators: ['lithology and slope', 'snow insulation', 'aspect and elevation', 'moisture', 'species dispersal', 'newly exposed terrain', 'microrefugia'],
    alternatives: ['direct atmospheric warming', 'competition or invasion', 'glacier retreat expanding terrain', 'disturbance', 'survey effort'],
    counterevidence: 'Glacier retreat can create new ice-free habitat and thaw does not uniformly reduce physical nunatak area. The edge is limited to measured loss of cold-adapted habitat suitability or occupancy associated with local ground thaw.',
    locators: [locator('https://www.ipcc.ch/srocc/chapter/chapter-2/', 'High-mountain permafrost thaw, slope and habitat change, range compression and cold-adapted biodiversity'), locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/', 'Observed and projected loss of cold-adapted mountain and polar habitat under warming and cryosphere change', 'independent_authoritative')]
  }),
  repair({
    source: 'wildfire_regime_shift', target: 'thermokarst_expansion',
    verb: 'can accelerate', adverb: 'where severe fire removes insulating vegetation and organic soil above ice-rich permafrost', influence: 0.45, level: 'indirect',
    mechanism: 'Severe or recurrent tundra and boreal fire can remove canopy, moss and organic insulation, darken the surface and deepen the active layer; in ice-rich terrain, subsequent ground-ice melt and subsidence can expand thermokarst.',
    geography: 'Named fire scar in mapped ice-rich permafrost with burn severity, organic-layer loss, ground temperature, active-layer depth and subsidence or thermokarst area monitored together.',
    time: 'Fire event through seasonal to multi-year thaw and subsidence response.',
    moderators: ['ground-ice content', 'burn severity', 'organic-layer thickness', 'post-fire vegetation recovery', 'snow accumulation', 'soil moisture and drainage', 'topography'],
    alternatives: ['background climate warming', 'surface-water impoundment', 'infrastructure disturbance', 'erosion', 'pre-existing thaw settlement'],
    counterevidence: 'Low-severity fire or ice-poor ground may not create thermokarst, and vegetation recovery can restore insulation. Expansion must be observed relative to an unburned or pre-fire baseline rather than inferred from fire occurrence alone.',
    locators: [locator('https://www.ipcc.ch/srocc/chapter/chapter-3-2/', 'Permafrost disturbance, wildfire, active-layer deepening, abrupt thaw and thermokarst'), locator('https://arctic.noaa.gov/report-card/report-card-2024/arctic-terrestrial-carbon-cycling/', 'Fire, permafrost thaw, hydrology, landscape change and carbon-cycle response', 'independent_authoritative')]
  }),
  repair({
    source: 'ocean_current_regime_shift', target: 'ice_shelf_grounding_line_retreat',
    verb: 'can accelerate', adverb: 'when circulation delivers anomalously warm water to an ice-shelf cavity and grounding zone', influence: 0.48, level: 'direct',
    mechanism: 'Changes in shelf-sea and cavity circulation can increase delivery of warm water to the underside of a floating ice shelf, raising basal melt, reducing buttressing and promoting grounding-line retreat on a retrograde or otherwise vulnerable bed.',
    geography: 'Named marine-terminating ice-sheet sector with ocean temperature and circulation, cavity access, basal melt, ice thickness, bed geometry and grounding-line position observed or modelled together.',
    time: 'Seasonal ocean anomalies through multi-year to decadal grounding-line change.',
    moderators: ['continental-shelf winds', 'cavity geometry', 'ocean heat content and salinity', 'bed slope', 'ice-shelf buttressing', 'subglacial hydrology', 'sea-floor bathymetry'],
    alternatives: ['atmospheric surface melt', 'changes in ice discharge upstream', 'calving-front retreat', 'tides', 'bed and model uncertainty'],
    counterevidence: 'A broad current index does not establish warm-water access to a particular cavity. The edge requires local circulation or water-mass evidence; cold-water shifts or protective bathymetry can slow basal melt despite regional ocean change.',
    locators: [locator(IPCC_CRYOSPHERE, 'Sections 9.4.2-9.4.3: ocean forcing, ice-shelf basal melt, buttressing, grounding-line retreat and marine ice-sheet instability'), locator('https://earthobservatory.nasa.gov/images/148561/antarcticas-retreating-ice-shelves', 'Observed Antarctic ocean-driven ice-shelf and grounding-zone retreat', 'independent_authoritative')]
  }),
  repair({
    source: 'snowmelt_timing_shift', target: 'nunatak_habitat_shrinkage',
    verb: 'can reduce cold snowbed habitat on', adverb: 'where earlier melt lengthens exposure and removes persistent moisture refugia', influence: 0.37, level: 'indirect',
    mechanism: 'Earlier loss of seasonal snow can reduce the duration and extent of cool, moist snowbed microhabitat on alpine or polar nunataks, exposing specialised biota to longer growing-season heat and desiccation.',
    geography: 'Named nunatak or alpine snowbed with snow disappearance date, soil moisture and temperature, mapped microhabitat and species occupancy measured together.',
    time: 'Annual melt season through multi-year habitat and occupancy trends.',
    moderators: ['aspect and shading', 'wind redistribution', 'snow depth', 'summer precipitation', 'substrate water retention', 'species plasticity', 'newly exposed terrain'],
    alternatives: ['direct air warming', 'permafrost thaw', 'competition and invasion', 'disturbance', 'survey timing'],
    counterevidence: 'Earlier snowmelt can lengthen the growing season for some plants and physical ice-free area can expand as glaciers retreat. This edge is confined to observed loss of persistent snowbed microhabitat or associated cold-adapted occupancy.',
    locators: [locator('https://www.ipcc.ch/srocc/chapter/chapter-2/', 'High-mountain snow-cover duration, earlier melt, alpine habitat and cold-adapted species'), locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/', 'Snow-dependent habitat change, range compression and mountain biodiversity impacts', 'independent_authoritative')]
  }),
  repair({
    source: 'arctic_oscillation', target: 'blocking_pattern_persistence',
    verb: 'co-varies with', adverb: 'within phase-, season-, and region-specific Northern Hemisphere circulation regimes', influence: 0.34, level: 'indirect',
    mechanism: 'The Arctic Oscillation index describes shifts in the annular pressure and wind field that alter jet latitude and the probability and location of persistent blocking; the relationship is statistical and phase dependent rather than a one-way universal cause.',
    geography: 'Named Northern Hemisphere sector and cold season with a declared AO index and objective blocking frequency or duration metric.',
    time: 'Daily to seasonal circulation anomalies; multi-decadal trends remain separate from individual events.',
    moderators: ['AO phase', 'season', 'longitude sector', 'stratospheric polar vortex', 'ENSO', 'sea-surface temperature', 'blocking definition'],
    alternatives: ['North Atlantic Oscillation', 'Pacific teleconnections', 'stratospheric sudden warming', 'internal synoptic variability'],
    counterevidence: 'AO and blocking metrics overlap in atmospheric circulation information and association can change by region or sign. This edge must not be interpreted as deterministic causation or proof that the AO trend controls a particular block.',
    locators: [locator('https://www.cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/ao.shtml', 'NOAA CPC Arctic Oscillation index, phase and Northern Hemisphere circulation anomalies'), locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/', 'Large-scale circulation modes, blocking variability, attribution and uncertainty', 'independent_authoritative')]
  }),
  repair({
    source: 'quasi_biennial_oscillation', target: 'jet_stream_volatility',
    verb: 'can modulate', adverb: 'through phase-dependent stratosphere-troposphere coupling', influence: 0.32, level: 'indirect',
    mechanism: 'Alternating equatorial stratospheric QBO winds and temperatures can alter wave propagation and polar-vortex behaviour, probabilistically modulating extratropical jet position or variability in particular seasons.',
    geography: 'Declared QBO pressure-level index and Northern Hemisphere or Southern Hemisphere jet metric for a named season and latitude band.',
    time: 'Monthly to seasonal QBO phase composites; not an event-scale deterministic prediction.',
    moderators: ['QBO phase and vertical structure', 'season', 'polar vortex', 'ENSO', 'solar cycle', 'MJO', 'jet metric'],
    alternatives: ['tropospheric eddy forcing', 'ENSO teleconnections', 'sudden stratospheric warming', 'ocean variability'],
    counterevidence: 'Observed coupling is probabilistic, sample-sensitive and not stationary in every dataset. The QBO does not by itself establish unusual jet behaviour and the edge remains indirect.',
    locators: [locator('https://acd-ext.gsfc.nasa.gov/Data_services/met/qbo/qbo.html', 'NASA QBO wind index and stratospheric structure'), locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/', 'Stratosphere-troposphere coupling, modes of variability and jet-stream uncertainty', 'independent_authoritative')]
  }),
  repair({
    source: 'temp', target: 'carbon_emission',
    verb: 'can amplify natural net carbon release', adverb: 'where heat, drought, fire, respiration, or thaw weaken land and wetland carbon storage', influence: 0.4, level: 'indirect',
    mechanism: 'Warming can increase ecosystem respiration, drought and fire losses and thaw frozen carbon, raising natural net carbon release or weakening uptake; this is a carbon-climate feedback, not the original anthropogenic emissions driver.',
    geography: 'Global carbon budget or named ecosystem with temperature, disturbance, gross fluxes and net carbon dioxide-equivalent release measured over the same period.',
    time: 'Seasonal anomalies through multi-decadal carbon-climate feedback and projection periods.',
    moderators: ['CO2 fertilisation', 'water and nutrient limitation', 'fire', 'land management', 'permafrost', 'vegetation recovery', 'baseline emissions definition'],
    alternatives: ['fossil-fuel combustion', 'land-use change', 'harvest', 'internal climate variability', 'inventory revisions'],
    counterevidence: 'Warming is not the source of most current anthropogenic emissions, and enhanced plant growth can offset some release. The edge is limited to measured natural feedback fluxes and must not double-count sink weakening and gross emissions.',
    locators: [locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', 'Sections 5.1-5.4: carbon-climate feedbacks, respiration, drought, fire, permafrost and atmospheric carbon accumulation'), locator('https://gml.noaa.gov/aggi/aggi.html', 'NOAA greenhouse-gas forcing observations; distinguishes atmospheric burden from source attribution', 'independent_authoritative')]
  }),
  repair({
    source: 'temp', target: 'methane',
    verb: 'can increase natural methane release', adverb: 'where warming aligns with wetland production, permafrost thaw, or other methane-generating conditions', influence: 0.39, level: 'indirect',
    mechanism: 'Warming can enhance microbial methane production in waterlogged wetlands and can expose thawed permafrost carbon; the net atmospheric response depends on hydrology, oxidation, transport and concurrent anthropogenic emissions.',
    geography: 'Named wetland or permafrost region, or a global methane budget, with temperature, hydrology, methane production, oxidation and flux measured over a declared period.',
    time: 'Seasonal to multi-decadal methane-climate feedback periods.',
    moderators: ['water table and anaerobic conditions', 'substrate carbon', 'methane oxidation', 'vegetation transport', 'permafrost thaw mode', 'fire', 'hydroxyl sink'],
    alternatives: ['fossil-fuel leaks', 'livestock and waste', 'rice cultivation', 'biomass burning', 'changes in atmospheric methane lifetime'],
    counterevidence: 'Drying can suppress wetland methane and favour carbon dioxide, while most recent methane growth cannot be assigned to warming alone. Promotion requires flux or budget attribution rather than atmospheric concentration correlation.',
    locators: [locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', 'Wetland and permafrost methane feedbacks, hydrology, atmospheric lifetime and uncertainty'), locator('https://gml.noaa.gov/ccgg/trends_ch4/', 'NOAA atmospheric methane observations and trend; concentration is not treated as source attribution', 'independent_authoritative')]
  }),
  repair({
    source: 'wildfire_regime_shift', target: 'permafrost_thaw',
    verb: 'can accelerate', adverb: 'where severe or recurrent fire removes insulating vegetation and organic soil', influence: 0.46, level: 'direct',
    mechanism: 'Severe tundra or boreal fire can remove insulating moss, vegetation and organic soil, lower surface albedo and deepen the active layer, accelerating thaw of underlying permafrost relative to comparable unburned terrain.',
    geography: 'Named burn scar in mapped permafrost with fire severity, organic-layer loss, ground temperature, active-layer depth and thaw settlement monitored against a pre-fire or unburned baseline.',
    time: 'Fire event through seasonal and multi-year ground-thermal response.',
    moderators: ['burn severity', 'organic-layer thickness', 'ground-ice content', 'post-fire vegetation recovery', 'snow insulation', 'soil moisture and drainage', 'background warming'],
    alternatives: ['regional climate warming', 'surface-water change', 'infrastructure disturbance', 'erosion', 'pre-existing thermokarst'],
    counterevidence: 'Low-severity fire or rapid vegetation recovery may produce little persistent thaw, and ice-poor ground can warm without major subsidence. The edge requires measured post-fire ground response rather than fire occurrence alone.',
    locators: [locator('https://www.ipcc.ch/srocc/chapter/chapter-3-2/', 'Wildfire disturbance, active-layer deepening, permafrost thaw and abrupt landscape response'), locator('https://arctic.noaa.gov/report-card/report-card-2024/arctic-terrestrial-carbon-cycling/', 'Fire, ground warming, thaw, hydrology and permafrost carbon feedbacks', 'independent_authoritative')]
  })
]);
