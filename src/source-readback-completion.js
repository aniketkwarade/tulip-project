const record = (exactClaim, scope, counterevidence, locators) => Object.freeze({
  reviewed_at: '2026-07-25',
  reviewer: 'northstar_exact_claim_completion_v1',
  exact_claim: exactClaim,
  geographic_temporal_scope: scope,
  moderators_and_counterevidence: counterevidence,
  source_locators: Object.freeze(locators.map(locator => Object.freeze(locator)))
});

const locator = (url, section, sourceType = 'authoritative_assessment') => ({
  url,
  section,
  source_type: sourceType
});

export const SOURCE_READBACK_COMPLETION = Object.freeze({
  'temp->rain_on_snow_flood_risk': record(
    'Warming can increase rain-on-snow flood risk in snow-covered basins by raising freezing levels, shifting winter precipitation toward rain, and accelerating melt when rain, snow-water equivalent, soil saturation, and basin routing align.',
    'Named snow-covered watershed and storm event; historical or projected winter warming, with event-scale rain, snow, soil and streamflow observations.',
    'Warming can reduce snowpack and therefore reduce rain-on-snow water availability in some regions or seasons. Flooding also requires sufficient rainfall, antecedent snow-water equivalent, soil saturation, runoff routing and channel response.',
    [
      locator('https://www.ipcc.ch/srocc/', 'Chapters 2 and 3: warming, declining snow cover, rain-snow partition changes and rain-on-snow flood risk in mountain and polar regions.'),
      locator('https://labs.waterdata.usgs.gov/visualizations/snow-to-flow/index.html', 'USGS Snow-to-Flow: rain on snow accelerates melt and can lead to flooding, with snow and basin conditions retained.', 'independent_authoritative_mechanism')
    ]
  ),
  'temp->lightning_fire_weather': record(
    'Warming can worsen the conditions under which lightning ignites and sustains wildfire by increasing heat and atmospheric drying, but it does not determine lightning occurrence or ignition by itself.',
    'Fire-prone land regions under observed or projected warming; daily weather-to-fire-season scale, with lightning, fuel moisture, ignition and burned-area observations.',
    'Lightning frequency, storm moisture, ignition efficiency, fuel continuity, human suppression and non-lightning ignitions can dominate. Warmer conditions do not guarantee dry lightning or successful ignition.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', 'Sections 11.6 and 11.7: warming, drought and fire-weather changes, with regional confidence and ignition limitations.'),
      locator('https://www.nature.com/articles/s41467-022-34966-3', 'Results and Discussion: lightning-ignited fire occurrence under changing fire-weather and fuel conditions.', 'peer_reviewed_primary_study')
    ]
  ),
  'temp->smoke_exposure_burden': record(
    'Warming can increase wildfire-smoke exposure where it lengthens or intensifies fire seasons and smoke reaches populated areas.',
    'Named fire region and downwind population; event to seasonal exposure under observed or projected warming.',
    'Fire management, ignition, fuels, wind, plume transport, indoor filtration and population location strongly moderate exposure. Warming is not a direct inhaled dose and some regions can experience less burning.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', 'Sections 11.6-11.7: regional changes in heat, drought and fire weather.'),
      locator('https://www.who.int/health-topics/wildfires', 'WHO wildfire-smoke exposure and respiratory and cardiovascular health pathways.', 'independent_authoritative_health_assessment')
    ]
  ),
  'temp->low_cloud_deck_retreat': record(
    'Global warming can reduce marine low-cloud amount in susceptible subtropical regimes through boundary-layer, inversion, moisture and circulation responses.',
    'Subtropical marine low-cloud regions in observed records and climate-model warming experiments; multi-decadal to scenario timescales.',
    'Low-cloud response is one of the largest climate-feedback uncertainties and varies by regime, circulation, inversion strength, aerosol forcing and model representation. The claim is not a universal global cloud-cover decline.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/', 'Sections 7.4.2 and 7.4.4: assessed low-cloud feedback mechanisms, evidence and uncertainty.'),
      locator('https://repository.library.noaa.gov/view/noaa/31044', 'NOAA-hosted low-cloud response analysis and marine boundary-layer mechanism.', 'independent_primary_or_authoritative_record')
    ]
  ),
  'temp->hail_hazard_shift': record(
    'Global warming redistributes hail-prone conditions poleward through competing changes in instability, melting level, moisture and wind shear; the direction is region- and season-specific.',
    'Global land areas represented by eight CMIP6 models and three hail proxies, comparing historical conditions with 2 and 3 degrees Celsius global-warming levels.',
    'Proxy projections diverge, especially in the tropics. Hail-prone conditions are not observed hailstones, and the study cannot resolve hailstone size or storm severity. Some regions decrease while colder poleward regions increase.',
    [
      locator('https://www.nature.com/articles/s41558-026-02660-7', 'Abstract, Results, Figures 2-6 and Discussion: poleward shifts under 2 and 3 degrees Celsius warming, model/proxy disagreement and crop-risk sensitivity.', 'peer_reviewed_primary_model_ensemble'),
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', 'Severe convective storms and hail: low-confidence regional changes and process uncertainty.', 'independent_authoritative_assessment')
    ]
  ),
  'atmospheric_dryness->crop_yield_volatility': record(
    'Higher vapour-pressure deficit can reduce and destabilize plant productivity by increasing atmospheric water demand and inducing stomatal closure, with crop response depending on soil moisture, species and management.',
    'Crop or managed-grassland system with collocated vapour-pressure deficit, soil moisture, crop stage and productivity or yield observations; growing-season to interannual scale.',
    'The strongest cited quantitative result concerns United States grassland productivity, not global crop yield. Irrigation, crop physiology, soil moisture, temperature, carbon dioxide fertilization and management can offset or amplify the response.',
    [
      locator('https://www.nature.com/articles/ngeo2903', 'Abstract and Figures 1-3: United States grassland productivity sensitivity to vapour-pressure deficit and plant hydraulic strategy.', 'peer_reviewed_primary_remote_sensing_study'),
      locator('https://www.nature.com/articles/s41467-024-51305-w', 'Introduction and Results: ecosystem and crop relevance of extreme summer VPD, with historical and future event definitions.', 'independent_peer_reviewed_climate_study')
    ]
  ),
  'hail_hazard_shift->crop_yield_volatility': record(
    'Changes in hail-prone conditions can change crop-damage and yield risk by crop, region and growth stage; projected risk generally rises for some winter crops and falls for many summer crops.',
    'Twenty-six fixed crop calendars over global land in eight CMIP6 models and three hail proxies at historical, 2 degree and 3 degree warming levels.',
    'The source explicitly treats crop results as a sensitivity analysis, not projected crop damage or yield. Exposure and vulnerability were held fixed; hailstone size, crop adaptation, shifting seasons and growth-stage vulnerability remain unresolved.',
    [
      locator('https://www.nature.com/articles/s41558-026-02660-7', 'Abstract; Changes in hail-prone cropping periods; Discussion and Methods: 26 crops, fixed exposure and vulnerability, and explicit sensitivity-study boundary.', 'peer_reviewed_primary_model_ensemble'),
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', 'Severe convective storm and hail uncertainty under warming.', 'independent_authoritative_assessment')
    ]
  ),
  'data_centers->grid_peak_load_stress': record(
    'Large, concentrated data-center electricity loads can increase local and regional peak-load and interconnection stress where grid capacity, generation and transmission do not expand or load is inflexible.',
    'Named balancing area, utility territory or interconnection queue; hourly load and peak periods, with observed 2024 demand and scenarios through 2030 kept separate.',
    'Data centers can locate in unconstrained regions, procure additional supply, operate flexibly or improve efficiency. IEA reports that grid constraints could delay capacity, not a universal load-to-reliability coefficient.',
    [
      locator('https://www.iea.org/reports/energy-and-ai/ai-and-energy-security', 'Connecting data centres to electricity grids: concentrated demand growth, connection queues, load management and about 20 percent of planned 2030 capacity at risk of delay.'),
      locator('https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report', 'Executive summary and demand scenarios: United States data-center electricity, accelerated-server growth and regional system implications.', 'independent_national_laboratory_assessment')
    ]
  ),
  'ai_data_centers->grid_peak_load_stress': record(
    'Growth in AI-driven accelerated-server load can increase concentrated electricity demand and interconnection pressure when deployment outpaces grid capacity or flexibility.',
    'Named AI data-center fleet, utility territory or balancing area; hourly load and interconnection period, with IEA scenarios through 2030 and LBNL United States scenarios through 2028.',
    'AI is only part of total data-center load. Hardware efficiency, utilization, workload scheduling, location, on-site supply and grid expansion materially change the effect; scenario demand is not a confidence interval.',
    [
      locator('https://www.iea.org/reports/energy-and-ai/ai-and-energy-security', 'AI data-centre expansion, power-equipment constraints, grid connection delays and load-management need.'),
      locator('https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report', 'Accelerated-server demand, GPU utilization, cooling and United States electricity scenarios.', 'independent_national_laboratory_assessment')
    ]
  ),
  'transmission_buildout_lag->grid_peak_load_stress': record(
    'Delayed transmission expansion can increase peak-load stress by limiting transfer capacity and access to generation during high-demand periods.',
    'Named transmission system or balancing area with planned and commissioned capacity, congestion and peak-demand observations; project-delay to multi-year planning horizon.',
    'Local generation, storage, demand response, distribution constraints and permitting can independently determine reliability. Added transmission is not always the binding solution.',
    [
      locator('https://www.iea.org/reports/electricity-2026/grids', 'Grid capacity, congestion, demand growth and reliability requirements.'),
      locator('https://www.iea.org/reports/building-the-future-transmission-grid/executive-summary', 'Transmission buildout needs, component lead times and supply-chain delays.', 'independent_authoritative_grid_assessment')
    ]
  ),
  'transformer_supply_bottleneck->critical_infrastructure_fragility': record(
    'Transformer supply bottlenecks can extend infrastructure vulnerability by delaying replacement of failed units and slowing grid expansion.',
    'Named utility or transmission project with transformer specification, order, failure, delivery and restoration dates; months-to-years equipment lead-time horizon.',
    'Utilities can hold spares, standardize designs, repair units or reroute power. A long order backlog does not prove a service outage without an asset failure or capacity need.',
    [
      locator('https://www.energy.gov/policy/articles/supply-chain-crisis-facing-nations-electric-grid', 'DOE assessment of transformer supply-chain constraints, lead times and grid consequences.'),
      locator('https://www.iea.org/reports/building-the-future-transmission-grid/executive-summary', 'Transformer and transmission-equipment supply constraints, procurement and delivery risks.', 'independent_authoritative_grid_assessment')
    ]
  ),
  'deforestation->forest_fragmentation': record(
    'Forest clearing fragments habitat when it divides previously contiguous forest into smaller or more isolated patches and increases edge exposure.',
    'Named forest landscape with a fixed forest definition and matched pre- and post-clearing land-cover maps; event to multi-decadal landscape response.',
    'Clearing can remove an entire patch without increasing a chosen fragmentation index, and roads, agriculture, fire or natural disturbance can fragment forest independently. Results depend on scale and metric.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/', 'Terrestrial ecosystem fragmentation, land-use change, edge effects and biodiversity risk.'),
      locator('https://www.fao.org/forest-resources-assessment/remote-sensing/remote-sensing-survey/en', 'FAO forest-conversion mapping and fixed land-use transition definitions.', 'independent_authoritative_land_cover_assessment')
    ]
  ),
  'deforestation->land_carbon_sink_weakening': record(
    'Deforestation weakens the land carbon sink by removing biomass, transferring stored carbon to the atmosphere or products, and altering future ecosystem uptake.',
    'Named forest-conversion event or jurisdictional land-use inventory; annual to multi-decadal carbon-stock and flux accounting.',
    'Harvested wood products, regrowth, displacement, fire, soil carbon and baseline forest productivity alter net flux. Gross clearing area cannot be converted to sink loss without biomass and fate data.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', 'Land carbon-cycle fluxes, land-use change and anthropogenic carbon-budget accounting.'),
      locator('https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/', 'Global Carbon Budget land-use emissions, terrestrial sink and bookkeeping boundaries.', 'independent_global_carbon_budget_synthesis')
    ]
  ),
  'industry_farming->topsoil_erosion_acceleration': record(
    'Intensive tillage, residue removal and periods of bare soil can accelerate topsoil erosion under erosive wind or rainfall.',
    'Named agricultural field or watershed with management, ground cover, slope, soil and erosion observations; storm to multi-year soil-loss period.',
    'No-till, cover crops, terraces, residue retention and low-erosivity conditions can prevent or reverse the effect. Industrial scale alone is not an erosion measurement.',
    [
      locator('https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', 'Agricultural land degradation, erosion, management and adaptation.'),
      locator('https://www.fao.org/global-soil-partnership/areas-of-work/soil-erosion/en/', 'FAO soil-erosion mechanisms, agricultural drivers and conservation practices.', 'independent_authoritative_soil_assessment')
    ]
  )
});
