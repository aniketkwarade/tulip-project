const reviewedAt = '2026-07-18';

const ipcc = chapter => `https://www.ipcc.ch/report/ar6/${chapter}`;
const profile = (scale, appliesWhere, weakensWhere, evidenceAbsentWhere, temporalContext, sourceLocators) => Object.freeze({
  scale,
  applies_where: Object.freeze(appliesWhere),
  weakens_where: Object.freeze(weakensWhere),
  evidence_absent_or_limited_where: Object.freeze(evidenceAbsentWhere),
  temporal_context: temporalContext,
  source_locators: Object.freeze(sourceLocators.map(item => Object.freeze(item))),
  reviewed_at: reviewedAt,
  interpretation_boundary: 'This profile bounds where incident relationships are generally plausible. It does not make every edge universally valid within the listed regions.'
});

export const REGIONAL_HUB_PROFILES = Object.freeze({
  temp: profile('global_with_regional_expression', ['All regions; strongest amplification over Arctic land and high northern latitudes', 'Land areas and continental interiors during many heat extremes'], ['Ocean regions with strong heat uptake', 'Regions and seasons dominated by circulation variability'], ['Sparse-observation polar, mountain, and conflict-affected regions'], 'Multi-decadal forced trend with seasonal, annual, and decadal variability.', [
    { url: ipcc('wg1/chapter/chapter-2/'), locator: 'Observed global and regional climate change' }, { url: 'https://data.giss.nasa.gov/gistemp/', locator: 'NASA global surface-temperature analysis' }
  ]),
  carbon_emission: profile('global_sources_with_local_inventories', ['Fossil-fuel, industrial, land-use, and agricultural source regions worldwide', 'Consumption-linked supply chains across borders'], ['Low-carbon electricity systems and low-emission production routes', 'Sectors with mature abatement, efficiency, and circularity'], ['Informal activity, conflict zones, small sources, and poorly inventoried land-use change'], 'Annual inventories; near-real-time proxies require later reconciliation.', [
    { url: ipcc('wg3/chapter/chapter-2/'), locator: 'Emission trends and drivers' }, { url: 'https://edgar.jrc.ec.europa.eu/', locator: 'EDGAR spatial emissions inventories' }
  ]),
  industry_farming: profile('regional_production_systems_with_global_markets', ['Intensive crop and livestock regions', 'Irrigated, fertilizer-intensive, and export-oriented systems'], ['Low-input, diversified, agroecological, or predominantly pastoral systems'], ['Smallholder and informal production with weak statistics', 'Regions lacking field-scale soil, water, and input data'], 'Seasonal production cycles embedded in multi-year land, soil, and market change.', [
    { url: ipcc('wg2/chapter/chapter-5/'), locator: 'Food and agricultural climate risks' }, { url: 'https://www.fao.org/faostat/', locator: 'FAOSTAT production and input statistics' }
  ]),
  ocean_acidification: profile('global_ocean_with_regional_chemistry', ['Surface oceans absorbing anthropogenic carbon', 'High-latitude and upwelling systems with naturally lower carbonate saturation'], ['Highly buffered waters and areas with lower anthropogenic carbon penetration'], ['Coastal waters lacking sustained carbonate-system observations', 'Depths and regions with sparse sampling'], 'Long-term trend with seasonal, event-scale, depth, and circulation variability.', [
    { url: ipcc('wg1/chapter/chapter-9/'), locator: 'Ocean biogeochemistry and acidification' }, { url: 'https://www.ncei.noaa.gov/products/ocean-carbon-acidification-data-system', locator: 'NOAA OCADS observations' }
  ]),
  drought_persistence: profile('regional_hydroclimate', ['Drylands, Mediterranean-type climates, continental interiors, and rainfall-sensitive basins', 'Regions with persistent precipitation deficits and high evaporative demand'], ['Humid regions with reliable precipitation and substantial storage', 'Managed basins where imports or reservoirs temporarily buffer deficits'], ['Basins with sparse soil-moisture, groundwater, and withdrawal observations'], 'Weeks to multi-year events; trends depend on drought definition and baseline.', [
    { url: ipcc('wg1/chapter/chapter-11/'), locator: 'Weather and climate extreme events' }, { url: ipcc('wg2/chapter/chapter-4/'), locator: 'Water scarcity and drought impacts' }
  ]),
  biodiversity_intactness_loss: profile('local_to_global_ecosystems', ['Land- and sea-use conversion fronts', 'Highly fragmented, polluted, overexploited, or rapidly warming ecosystems'], ['Protected and connected landscapes with low pressure', 'Restored systems where recovery is established'], ['Taxa and regions with low monitoring effort, especially in tropics and deep ocean'], 'Often multi-decadal; abrupt losses and delayed ecological responses coexist.', [
    { url: 'https://ipbes.net/global-assessment', locator: 'IPBES global biodiversity assessment' }, { url: 'https://www.gbif.org/', locator: 'GBIF biodiversity occurrence evidence' }
  ]),
  critical_infrastructure_fragility: profile('asset_and_network_specific', ['Hazard-exposed, aging, interdependent, and capacity-constrained networks', 'Rapidly growing settlements with infrastructure deficits'], ['Redundant, maintained, climate-adapted networks with spare capacity'], ['Informal systems, proprietary networks, and locations without asset or outage inventories'], 'Event-scale failures interact with decades-long maintenance and investment cycles.', [
    { url: ipcc('wg2/chapter/chapter-6/'), locator: 'Cities, settlements, and key infrastructure' }, { url: 'https://www.undrr.org/', locator: 'Disaster-risk and infrastructure resilience evidence' }
  ]),
  environ_anomalies: profile('observation_dependent_global_screen', ['Regions with stable baselines and dense monitoring', 'Areas experiencing rapid climate or land-use change'], ['Naturally high-variability systems where anomaly attribution is weak'], ['Data-sparse regions, changing instruments, and short or discontinuous records'], 'Depends on the declared baseline; event, seasonal, and long-term anomalies must remain separate.', [
    { url: 'https://www.ncei.noaa.gov/access/monitoring/', locator: 'NOAA environmental monitoring products' }, { url: 'https://earthdata.nasa.gov/', locator: 'NASA Earth observation catalog' }
  ]),
  wildfire_regime_shift: profile('regional_fire_ecology', ['Fire-prone forests, shrublands, peatlands, and wildland-urban interfaces', 'Regions with increasing fuel aridity or altered ignition and fuel regimes'], ['Fuel-limited deserts, wet forests in persistently moist periods, and intensively suppressed local systems'], ['Regions lacking fire-history, severity, fuel, and ignition attribution data'], 'Fire weather is event-scale; regime shifts require multi-decadal records.', [
    { url: ipcc('wg1/chapter/chapter-11/'), locator: 'Fire weather extremes' }, { url: 'https://firms.modaps.eosdis.nasa.gov/', locator: 'NASA FIRMS active-fire observations' }
  ]),
  freshwater_ecosystem_collapse: profile('basin_and_ecosystem_specific', ['Overallocated, fragmented, polluted, warming, or flow-altered rivers, lakes, and wetlands'], ['Connected systems with environmental flows, good water quality, and intact refugia'], ['Ungauged basins and systems lacking biological time series'], 'Can be abrupt after thresholds; recovery and community turnover may take years to decades.', [
    { url: ipcc('wg2/chapter/chapter-4/'), locator: 'Freshwater ecosystems and water risks' }, { url: 'https://www.usgs.gov/mission-areas/water-resources', locator: 'USGS freshwater observations' }
  ]),
  extreme_precipitation_intensity: profile('global_hazard_with_regional_dynamics', ['Moisture-rich storm tracks, monsoon regions, tropical cyclones, and convective environments'], ['Moisture-limited regions or seasons', 'Locations where circulation changes offset thermodynamic intensification'], ['Radar- and gauge-sparse regions, mountains, and short sub-daily records'], 'Minutes to days for events; climate statistics require multi-decadal baselines.', [
    { url: ipcc('wg1/chapter/chapter-11/'), locator: 'Heavy precipitation assessment' }, { url: 'https://gpm.nasa.gov/data', locator: 'NASA GPM precipitation observations' }
  ]),
  water_stress: profile('basin_and_use_specific', ['Basins where withdrawals approach available renewable supply', 'Arid, densely populated, heavily irrigated, or rapidly growing regions'], ['Water-abundant basins with low withdrawals and strong storage or reuse'], ['Basins with unreported withdrawals, groundwater depletion, transfers, or environmental-flow needs'], 'Seasonal to multi-decadal; annual ratios can hide acute seasonal scarcity.', [
    { url: 'https://www.wri.org/aqueduct', locator: 'Aqueduct baseline water stress' }, { url: 'https://www.fao.org/aquastat/', locator: 'FAO water resources and withdrawals' }
  ]),
  ice_sheet_mass_loss: profile('greenland_and_antarctica', ['Greenland and Antarctic ice sheets and their outlet glaciers'], ['Interior accumulation zones in periods or scenarios where snowfall offsets some dynamic loss'], ['Subglacial processes, ice-shelf cavities, and regions with short or uncertain mass-balance records'], 'Seasonal surface balance embedded in multi-decadal to centennial dynamic response.', [
    { url: ipcc('wg1/chapter/chapter-9/'), locator: 'Ice sheets and sea-level contribution' }, { url: 'https://gracefo.jpl.nasa.gov/science/ice-sheets-and-glaciers/', locator: 'GRACE-FO ice-mass observations' }
  ]),
  deforestation: profile('regional_land_change_with_global_effects', ['Tropical and boreal forest-loss fronts', 'Regions with agricultural expansion, logging, mining, roads, or fire conversion'], ['Stable forest landscapes with strong protection and low conversion pressure'], ['Degradation below canopy-loss detection, informal clearing, and cloudy or poorly validated regions'], 'Event to annual detection; carbon and ecological effects persist for decades or longer.', [
    { url: 'https://www.fao.org/forest-resources-assessment/', locator: 'FAO Global Forest Resources Assessment' }, { url: 'https://www.globalforestwatch.org/', locator: 'Global Forest Watch tree-cover change' }
  ]),
  crop_yield_volatility: profile('crop_and_region_specific', ['Rainfed and heat-sensitive production regions', 'Areas exposed to compound weather, pest, input, and market shocks'], ['Irrigated or controlled systems with diverse crops, storage, and insurance'], ['Smallholder systems and crops with weak subnational yield and management data'], 'Seasonal harvest outcomes; robust volatility estimates need long, consistent series.', [
    { url: ipcc('wg2/chapter/chapter-5/'), locator: 'Crop impacts and adaptation' }, { url: 'https://www.fao.org/faostat/', locator: 'FAOSTAT crop production series' }
  ]),
  grid_peak_load_stress: profile('power_system_and_hour_specific', ['Hot or cold weather systems with electrified heating/cooling', 'Capacity-constrained grids with inflexible demand and low reserve margins'], ['Systems with demand response, storage, interconnection, efficiency, and ample firm capacity'], ['Utilities without transparent interval load, capacity, and outage data'], 'Minutes to seasonal peaks; planning adequacy spans years to decades.', [
    { url: ipcc('wg3/chapter/chapter-6/'), locator: 'Power-system flexibility and demand response' }, { url: 'https://www.eia.gov/opendata/', locator: 'EIA electricity operational data' }
  ]),
  public_health_heat_burden: profile('population_and_place_specific', ['Urban heat islands, hot climates, aging populations, outdoor workers, and low-cooling-access communities'], ['Acclimatized populations with effective housing, warnings, healthcare, and cooling access'], ['Places without cause-specific mortality, morbidity, exposure, or vulnerability data'], 'Hourly to seasonal exposure; adaptation and demographic change alter long-term baselines.', [
    { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', locator: 'WHO heat and health risk' }, { url: 'https://www.who.int/europe/publications/i/item/9789289062930', locator: 'WHO heat-health action plans' }
  ]),
  coastal_inundation_risk: profile('coastal_local_to_regional', ['Low-lying coasts, deltas, small islands, subsiding cities, and storm-surge zones'], ['Elevated or accreting coasts with low exposure and effective protection'], ['Coasts lacking elevation, subsidence, wave, defense-condition, and exposure data'], 'Tidal and storm events superimposed on multi-decadal sea-level rise.', [
    { url: 'https://sealevel.nasa.gov/', locator: 'NASA sea-level observations' }, { url: ipcc('wg2/chapter/ccp2/'), locator: 'IPCC coastal settlements and sea-level risk' }
  ]),
  air_pollution_health_burden: profile('pollutant_population_and_airshed_specific', ['Densely populated urban and industrial airsheds', 'Households and workers exposed to combustion, wildfire smoke, dust, ozone, or fine particles'], ['Low-emission regions with effective controls and low background pollution'], ['Regions lacking calibrated monitors, emissions inventories, cause-specific health data, or exposure models'], 'Hourly and daily pollution episodes accumulate into annual and chronic health burdens.', [
    { url: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health', locator: 'WHO ambient air pollution and health assessment' }, { url: 'https://www.epa.gov/outdoor-air-quality-data', locator: 'EPA ambient air monitoring data' }
  ]),
  wet_bulb_heat: profile('regional_heat_humidity_hazard', ['Humid tropics, monsoon regions, irrigated zones, and coastal heat environments'], ['Dry regions where humidity is low, although dry-bulb heat can remain dangerous'], ['Regions without reliable co-located temperature and humidity observations or exposure data'], 'Hourly events and seasonal climatology; thresholds depend on activity, acclimatization, and exposure.', [
    { url: ipcc('wg2/chapter/chapter-7/'), locator: 'Heat stress and human health' }, { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', locator: 'WHO heat exposure context' }
  ]),
  marine_heatwaves: profile('event_and_region_specific_ocean_hazard', ['Named marine heatwave regions with declared climatology, duration, intensity, depth, and ecosystem observations', 'Eastern-boundary upwelling systems, coral reefs, kelp forests, seagrass meadows, and fisheries exposed to persistent anomalous heat'], ['Regions where circulation, nutrient inputs, acclimatization, refugia, or seasonal timing offset heat effects', 'Short warm anomalies that do not meet the declared marine-heatwave definition'], ['Subsurface and coastal regions lacking sustained temperature, nutrient, biomass, habitat, or species observations'], 'Events last days to months; recurrence and ecological recovery require multi-year records, and event attribution must remain separate from long-term warming.', [
    { url: ipcc('wg2/chapter/chapter-3/'), locator: 'Marine heatwaves, compound ocean change, ecosystem impacts, and regional heterogeneity' }, { url: 'https://www.nature.com/articles/s43247-024-01805-w', locator: 'Primary satellite and model study of phytoplankton biomass and size changes during eastern-boundary marine heatwaves' }
  ]),
  methane: profile('global_atmosphere_with_regional_sources', ['Fossil fuel, agriculture, waste, wetlands, and fire source regions'], ['Regions with low emissions or strong oxidation relative to source strength'], ['Diffuse sources, tropical wetlands, abandoned infrastructure, and regions lacking atmospheric inversions'], 'Atmospheric response over roughly a decade; emissions vary seasonally and interannually.', [
    { url: 'https://gml.noaa.gov/ccgg/trends_ch4/', locator: 'NOAA atmospheric methane trend' }, { url: ipcc('wg1/chapter/chapter-7/'), locator: 'Methane radiative forcing and lifetime' }
  ]),
  marine_food_web_simplification: profile('ecosystem_and_trophic_network_specific', ['Heavily fished, warming, acidifying, deoxygenating, or habitat-degraded marine systems'], ['Diverse, connected, lightly exploited systems with intact habitat and refugia'], ['Deep sea, polar systems, microbial networks, and regions lacking repeated trophic observations'], 'Seasonal to multi-decadal; trophic reorganization may lag physical forcing.', [
    { url: ipcc('wg2/chapter/chapter-3/'), locator: 'Ocean and coastal ecosystem risks' }, { url: 'https://obis.org/', locator: 'OBIS marine biodiversity observations' }
  ]),
  food: profile('global_supply_with_household_outcomes', ['Import-dependent, conflict-affected, climate-exposed, and low-income populations', 'Regions with high food-price and livelihood sensitivity'], ['Diversified supply chains, social protection, storage, and resilient local production'], ['Informal markets and places lacking timely price, diet, access, and household survey data'], 'Daily access and seasonal production embedded in multi-year economic and climate trends.', [
    { url: 'https://www.fao.org/publications/sofi/', locator: 'FAO State of Food Security and Nutrition' }, { url: ipcc('wg2/chapter/chapter-5/'), locator: 'Food-system climate risks' }
  ]),
  urbanization: profile('city_and_region_specific_socioeconomic_transition', ['Rapidly growing cities and metropolitan regions where settlement, infrastructure, household, transport, industry, land and energy systems are changing together', 'Urban regions with spatially resolved population, built-area, energy, emissions, mobility, housing and economic observations'], ['Compact, transit-rich, efficient or low-carbon urban systems where agglomeration and technology offset added activity', 'Regions where urban population growth is slow or urban and rural production emissions are weakly distinguished'], ['Informal settlements and rapidly changing peri-urban areas with weak population, building, transport, energy or emissions inventories', 'Regions where territorial accounts omit large embodied interregional emissions or administrative boundaries change through time'], 'Annual to multi-decadal transition; short-run agglomeration and efficiency effects must remain separate from long-run infrastructure, income, consumption and land-use effects.', [
    { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', locator: 'Urban systems, settlement form, infrastructure, energy use, emissions pathways, mitigation options and regional heterogeneity' }, { url: 'https://population.un.org/wup/', locator: 'United Nations World Urbanization Prospects definitions and urban population series' }
  ])
});

export function attachRegionalHubProfiles(nodes) {
  return nodes.map(node => REGIONAL_HUB_PROFILES[node.id]
    ? { ...node, regional_profile: REGIONAL_HUB_PROFILES[node.id] }
    : node);
}
