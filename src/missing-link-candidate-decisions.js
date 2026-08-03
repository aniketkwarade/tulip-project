const decision = ({
  decision: disposition,
  rationale,
  evidenceBoundary,
  redirect,
  sources
}) => Object.freeze({
  decision: disposition,
  rationale,
  evidence_boundary: evidenceBoundary,
  redirect_to: redirect,
  source_locators: Object.freeze(sources.map(source => Object.freeze(source))),
  reviewed_at: '2026-07-25',
  reviewer: 'northstar_directed_claim_review_v1'
});

export const MISSING_LINK_CANDIDATE_DECISIONS = Object.freeze({
  'ocean_acidification->marine_fisheries_collapse': decision({
    decision: 'rejected_target_scope_overclaim',
    rationale: 'Acidification has documented organism, calcification, habitat, and food-web effects, but the reviewed evidence does not establish that acidification alone causes the broad endpoint “Marine Fisheries Collapse.” Stock status also depends strongly on fishing pressure, management, warming, deoxygenation, habitat, and species-specific sensitivity.',
    evidenceBoundary: 'Retain ocean-acidification effects on bounded biological or stock-productivity endpoints for later research. Do not translate heterogeneous organism responses into collapse of assessed marine fish stocks.',
    redirect: ['marine_food_web_simplification', 'reef_structural_collapse', 'fish_landing_supply_disruption'],
    sources: [
      { title: 'IPCC SROCC Chapter 5', url: 'https://www.ipcc.ch/srocc/chapter/chapter-5/', locator: 'Sections 5.2.2, 5.2.3 and 5.4.1; ocean chemistry, ecosystem risk, fisheries and interacting drivers' },
      { title: 'NOAA Ocean Acidification Impacts Review', url: 'https://oceanacidification.noaa.gov/oap_pubs/the-impacts-of-ocean-acidification-on-marine-ecosystems-and-reliant-human-communities/', locator: 'Review scope and ecosystem/community impact synthesis' },
      { title: 'Nature Communications 2024 meta-analysis', url: 'https://www.nature.com/articles/s41467-024-47563-3', locator: 'Results; heterogeneous biological responses and trophic-level effects' }
    ]
  }),
  'ai_data_centers->data_centers': decision({
    decision: 'rejected_ontology_subset_not_causal',
    rationale: 'AI data centers are a workload/facility subset of the broader data-center node. A causal edge between the subtype and its parent would double-count the same facilities and electricity demand.',
    evidenceBoundary: 'Use AI workload share, accelerated-server electricity, and rack density as attributes or metrics within the data-center system. Causal edges may run from bounded AI compute demand to grid, water, equipment, or emissions endpoints.',
    redirect: ['grid_peak_load_stress', 'carbon_emission', 'semiconductor_fabs'],
    sources: [
      { title: 'IEA Energy and AI', url: 'https://www.iea.org/reports/energy-and-ai', locator: 'Energy demand from AI; AI is analyzed within total data-centre electricity demand' },
      { title: 'LBNL 2024 United States Data Center Energy Usage Report', url: 'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report', locator: 'Data-center electricity-use scope and accelerated-server contribution' }
    ]
  }),
  'grid_peak_load_stress->wet_bulb_heat': decision({
    decision: 'rejected_endpoint_mismatch',
    rationale: 'Grid failure can remove mechanical cooling and increase indoor heat exposure, illness, and mortality. It does not raise the outdoor thermodynamic wet-bulb temperature measured by the target node.',
    evidenceBoundary: 'Redirect the outage pathway to cooling access, indoor exposure, health burden, or mortality. Keep wet-bulb temperature upstream of peak cooling demand and grid stress.',
    redirect: ['cooling_equity_gaps', 'public_health_heat_burden', 'heatwave_excess_mortality_rates'],
    sources: [
      { title: 'IPCC AR6 WGII Chapter 6', url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', locator: 'Urban heat, infrastructure interdependence, energy access and health risk' },
      { title: 'IEA The Future of Cooling', url: 'https://www.iea.org/reports/the-future-of-cooling', locator: 'Cooling demand, peak electricity load and access boundary' }
    ]
  }),
  'carbon_emission->personal_conveyance': decision({
    decision: 'rejected_policy_response_misattributed_as_physical_cause',
    rationale: 'The candidate mechanism is emissions policy changing vehicle technology and travel choices. That is a mediated governance response, not carbon emissions physically causing personal passenger travel activity.',
    evidenceBoundary: 'Keep personal conveyance upstream of transport emissions. Model carbon pricing, fuel-economy standards, transit investment, or electrification as explicit response nodes before asserting a reverse pathway.',
    redirect: ['public_transit_expansion', 'active_mobility'],
    sources: [
      { title: 'IEA Transport', url: 'https://www.iea.org/energy-system/transport', locator: 'Transport activity, energy use, emissions and policy measures' },
      { title: 'IPCC AR6 WGIII Chapter 10', url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/', locator: 'Transport demand, modal shift, vehicle technology and mitigation policy' }
    ]
  }),
  'temp->urbanization': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Warming amplifies heat exposure in already urbanized areas, but the cited mechanism does not establish annual expansion of built-up surface, which is the urbanization node’s metric.',
    evidenceBoundary: 'Retain temperature effects on urban heat, cooling demand, mortality, and displacement. A temperature-to-built-up-expansion claim needs separate migration, adaptation, and land-development evidence.',
    redirect: ['wet_bulb_heat', 'air_conditioning_refrigerants', 'heatwave_excess_mortality_rates'],
    sources: [
      { title: 'IPCC AR6 WGII Chapter 6', url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', locator: 'Cities, settlements and infrastructure; urban heat risk and adaptation' },
      { title: 'IPCC AR6 WGI Chapter 10', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-10/', locator: 'Urbanization effects on local climate versus global warming effects on cities' }
    ]
  }),
  'temp->industry_farming': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Heat affects crop yield, livestock health, labor capacity, and food-system stability, but those effects do not directly measure or cause the input-intensity farming-system profile represented by this node.',
    evidenceBoundary: 'Use the existing heat-stress, agricultural-labor, livestock-disease, and agricultural-demand endpoints. Do not treat harm to production outcomes as growth of intensive farming inputs.',
    redirect: ['farm_heat_stress', 'agricultural_labor_exposure', 'food'],
    sources: [
      { title: 'IPCC AR6 WGII Chapter 5', url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', locator: 'Food, fibre and other ecosystem products; heat effects on crops, livestock and labor' },
      { title: 'IPCC Special Report on Climate Change and Land Chapter 5', url: 'https://www.ipcc.ch/srccl/chapter/chapter-5/', locator: 'Food security, production impacts and adaptation' }
    ]
  }),
  'temp->el_nino': decision({
    decision: 'deferred_forced_enso_attribution_uncertain',
    rationale: 'Global warming changes the tropical-Pacific background state and likely intensifies ENSO-related rainfall variability, but the reviewed assessments do not support a simple directional claim that global mean temperature causes individual El Niño phase events.',
    evidenceBoundary: 'Research a bounded forced-change estimand such as ENSO rainfall variability or event amplitude under a named emissions scenario. Do not use global temperature as a deterministic trigger for the ONI warm phase.',
    redirect: ['ocean_heat_content', 'walker_circulation_shift'],
    sources: [
      { title: 'IPCC AR6 WGI Chapter 4', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-4/', locator: 'Section 4.3.3.2; projected changes in ENSO and associated uncertainty' },
      { title: 'IPCC AR6 WGI Chapter 3', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/', locator: 'ENSO evaluation and externally forced response' }
    ]
  }),
  'carbon_emission->el_nino': decision({
    decision: 'deferred_forced_enso_attribution_uncertain',
    rationale: 'Greenhouse-gas forcing affects the tropical-Pacific climate, but the evidence does not justify carbon-emission flow as a deterministic trigger of the ONI warm phase.',
    evidenceBoundary: 'Use scenario-conditioned climate-model estimands for ENSO variability or teleconnections. Keep emissions-to-temperature and ocean-heat pathways explicit rather than collapsing them into an event trigger.',
    redirect: ['temp', 'ocean_heat_content', 'walker_circulation_shift'],
    sources: [
      { title: 'IPCC AR6 WGI Chapter 4', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-4/', locator: 'Section 4.3.3.2; projected ENSO changes and confidence' },
      { title: 'IPCC AR6 WGI Chapter 3', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/', locator: 'Human influence, ocean circulation and modes of variability' }
    ]
  }),
  'carbon_emission->la_nina': decision({
    decision: 'deferred_forced_enso_attribution_uncertain',
    rationale: 'Greenhouse forcing can alter ENSO background conditions and impacts, but it does not support a simple carbon-emissions-to-La Niña event edge at the node’s ONI cool-phase metric.',
    evidenceBoundary: 'Research changes in phase duration, amplitude, rainfall variability, or teleconnections under named scenarios. Do not encode the cool phase as a deterministic emissions effect.',
    redirect: ['temp', 'ocean_heat_content', 'walker_circulation_shift'],
    sources: [
      { title: 'IPCC AR6 WGI Chapter 4', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-4/', locator: 'Section 4.3.3.2; projected ENSO changes and confidence' },
      { title: 'IPCC AR6 WGI Chapter 3', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/', locator: 'ENSO evaluation and attribution boundary' }
    ]
  }),
  'monsoon_volatility->industry_farming': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Erratic monsoon rainfall affects planting, yield, livestock and labor outcomes, but does not directly increase the target node’s agricultural input-intensity profile.',
    evidenceBoundary: 'Redirect to crop-yield volatility, farm heat or flood stress, and food-security outcomes using regional monsoon exposure.',
    redirect: ['crop_yield_volatility', 'food_insecurity', 'farm_heat_stress'],
    sources: [
      { title: 'IPCC AR6 WGII Chapter 5', url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', locator: 'Observed and projected climate impacts on crops, livestock and food security' },
      { title: 'FAOSTAT', url: 'https://www.fao.org/faostat/en/#data/GT', locator: 'Agricultural production and land-use statistical domains; not a directed monsoon-to-input-intensity study' }
    ]
  }),
  'cooling_water_competition->transformer_heat_failure_risk': decision({
    decision: 'rejected_shared_hot_weather_driver_not_direct_mechanism',
    rationale: 'Cooling-water constraints primarily affect thermal generation, while transformer heat risk is driven by ambient temperature, loading, design, age and cooling condition. Hot weather and peak load can raise both without water competition causing transformer failure.',
    evidenceBoundary: 'Keep cooling-water competition linked to thermal-generation availability and keep transformer risk linked to heat and loading.',
    redirect: ['thermal_power_cooling_constraints', 'grid_peak_load_stress'],
    sources: [
      { title: 'IEA Electricity 2026 Grids', url: 'https://www.iea.org/reports/electricity-2026/grids', locator: 'Grid investment, loading and weather resilience; no water-to-transformer mechanism' },
      { title: 'IEA Building the Future Transmission Grid', url: 'https://www.iea.org/reports/building-the-future-transmission-grid/executive-summary', locator: 'Transmission equipment, thermal limits and supply constraints' }
    ]
  }),
  'semiconductor_fabs->resource_depletion': decision({
    decision: 'deferred_composite_endpoint_requires_disaggregation',
    rationale: 'Fabs consume water, electricity, chemicals and minerals, but the Resource Depletion node measures material footprint by raw-material class. The current claim combines unlike pressures without an extraction-accounting bridge.',
    evidenceBoundary: 'Promote separate fab-water, electricity, fluorinated-gas and mineral-input relationships only with matched facility or supply-chain inventories.',
    redirect: ['water_stress', 'semiconductor_fabrication_footprint', 'carbon_emission'],
    sources: [
      { title: 'IEA Energy and AI', url: 'https://www.iea.org/reports/energy-and-ai', locator: 'AI infrastructure supply chains and data-centre equipment demand; no aggregate fab resource-depletion coefficient' },
      { title: 'WRI Aqueduct', url: 'https://www.wri.org/aqueduct', locator: 'Location-specific water-risk screening boundary' }
    ]
  }),
  'carbon_emission->resource_depletion': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Emissions-driven warming can affect water and soil conditions, but it does not directly cause the target metric of material footprint and domestic material consumption.',
    evidenceBoundary: 'Use temperature, drought, glacier, groundwater and soil endpoints; do not collapse climate impacts into material-extraction accounting.',
    redirect: ['water_stress', 'groundwater_depletion', 'soil_moisture_collapse'],
    sources: [
      { title: 'IPCC AR6 WGI', url: 'https://www.ipcc.ch/report/ar6/wg1/', locator: 'Physical climate response to emissions and regional hydroclimate change' },
      { title: 'WRI Aqueduct', url: 'https://www.wri.org/aqueduct', locator: 'Water-risk indicators and geographic screening boundary' }
    ]
  }),
  'data_centers->resource_depletion': decision({
    decision: 'deferred_composite_endpoint_requires_disaggregation',
    rationale: 'Data centers use electricity, water, land and equipment, but those flows cannot be summed into the Resource Depletion node’s material-footprint metric without class-specific accounting.',
    evidenceBoundary: 'Retain separate electricity, cooling-water, land and equipment-supply pathways with named facility and lifecycle boundaries.',
    redirect: ['cooling_water_competition', 'grid_peak_load_stress', 'semiconductor_fabrication_footprint'],
    sources: [
      { title: 'IEA Energy and AI', url: 'https://www.iea.org/reports/energy-and-ai', locator: 'Data-centre electricity, water and equipment boundaries' },
      { title: 'WRI Aqueduct', url: 'https://www.wri.org/aqueduct', locator: 'Facility-location water-risk screening rather than aggregate resource depletion' }
    ]
  }),
  'environ_anomalies->resource_depletion': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Compound hazards can disrupt water availability or contaminate supplies, but they do not directly increase material footprint or domestic material consumption.',
    evidenceBoundary: 'Route specific drought, flood or heat exposures to matching water-storage, groundwater, infrastructure or supply outcomes.',
    redirect: ['water_storage_instability', 'groundwater_depletion', 'infrastructure_fragility'],
    sources: [
      { title: 'IPCC AR6 WGII', url: 'https://www.ipcc.ch/report/ar6/wg2/', locator: 'Compound climate risks to water and infrastructure' },
      { title: 'WRI Aqueduct', url: 'https://www.wri.org/aqueduct', locator: 'Water stress, drought and flood indicators kept distinct' }
    ]
  }),
  'food->resource_depletion': decision({
    decision: 'deferred_composite_endpoint_requires_disaggregation',
    rationale: 'Agricultural demand can drive water, soil and material pressures, but the candidate combines groundwater, soil carbon and raw-material extraction into one unmeasurable effect.',
    evidenceBoundary: 'Promote commodity-specific demand pathways to irrigation withdrawals, land conversion, fertilizer use or soil outcomes.',
    redirect: ['groundwater_depletion', 'agricultural_nitrogen_application', 'deforestation'],
    sources: [
      { title: 'FAO SOFI', url: 'https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world', locator: 'Food-system demand and security context; not a material-footprint causal estimate' },
      { title: 'WRI Aqueduct', url: 'https://www.wri.org/aqueduct', locator: 'Commodity and geography-specific water-risk screening' }
    ]
  }),
  'urbanization->resource_depletion': decision({
    decision: 'deferred_composite_endpoint_requires_disaggregation',
    rationale: 'Built-up expansion can increase water and construction-material demand, but water, sand, gravel and cement cannot be treated as one causal endpoint under the current material-footprint contract.',
    evidenceBoundary: 'Research city- and material-specific built-up expansion against water withdrawal or construction-material consumption.',
    redirect: ['urban_water_demand_peak', 'cement_concrete', 'water_stress'],
    sources: [
      { title: 'IPCC AR6 WGIII Chapter 8', url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', locator: 'Urban systems, infrastructure and material demand' },
      { title: 'WRI Aqueduct', url: 'https://www.wri.org/aqueduct', locator: 'Location-specific water demand and stress boundary' }
    ]
  }),
  'urbanization->personal_conveyance': decision({
    decision: 'rejected_overgeneralized_direction',
    rationale: 'Low-density sprawl can lock in car travel, but urbanization also includes compact, transit-rich development that can reduce private-vehicle activity. Built-up expansion alone has no universal positive direction.',
    evidenceBoundary: 'Use the existing Urban Sprawl/Housing form node or a density-and-accessibility metric before linking to passenger travel by mode.',
    redirect: ['urban_sprawl_housing'],
    sources: [
      { title: 'IPCC AR6 WGIII Chapter 8', url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', locator: 'Urban form, density, accessibility and transport-demand interactions' },
      { title: 'IPCC AR6 WGIII Chapter 10', url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/', locator: 'Avoid-shift-improve transport framework and land-use effects' }
    ]
  }),
  'resource_depletion->carbon_emission': decision({
    decision: 'deferred_composite_mediated_pathways',
    rationale: 'Some scarcity responses such as desalination or deeper pumping can add emissions, but the broad depletion node does not specify which resource, intervention, energy source or counterfactual applies.',
    evidenceBoundary: 'Model pumping, desalination, recycling, substitution or fertilizer manufacture as explicit intermediate activities with matched energy data.',
    redirect: ['desalination_energy_demand', 'groundwater_pumping_energy'],
    sources: [
      { title: 'IPCC AR6 WGIII', url: 'https://www.ipcc.ch/report/ar6/wg3/', locator: 'Sector-specific mitigation and energy-system accounting; no universal resource-depletion emissions factor' },
      { title: 'IEA World Energy Outlook 2024', url: 'https://www.iea.org/reports/world-energy-outlook-2024', locator: 'Energy demand and emissions accounting by technology and sector' }
    ]
  }),
  'internet_exchange_points->telecom_backbone': decision({
    decision: 'rejected_network_component_not_causal_edge',
    rationale: 'Internet exchange points and long-haul backbone networks are interacting components of one routing system. Traffic exchange is a network topology relation, not one phenomenon causing another.',
    evidenceBoundary: 'Represent this as infrastructure composition or dependency metadata; causal edges should address outage propagation, traffic growth or energy use.',
    redirect: ['telecom_backbone_outage', 'internet_traffic_growth'],
    sources: [
      { title: 'Internet Society IXP Toolkit', url: 'https://www.internetsociety.org/issues/internet-exchange-points/', locator: 'IXPs as facilities where networks interconnect and exchange traffic' },
      { title: 'IEA Energy and AI', url: 'https://www.iea.org/reports/energy-and-ai', locator: 'Digital infrastructure energy boundary; not an IXP-to-backbone causal claim' }
    ]
  }),
  'mobile_wireless_networks->telecom_backbone': decision({
    decision: 'rejected_network_component_not_causal_edge',
    rationale: 'Radio access and backbone transport are components of the same telecommunications architecture. Backhaul traffic flow is a dependency relation, not evidence that mobile towers cause the backbone phenomenon.',
    evidenceBoundary: 'Use shared dependency metadata or link traffic growth to backbone load with measured traffic and capacity.',
    redirect: ['internet_traffic_growth', 'telecom_backbone_outage'],
    sources: [
      { title: 'IEA Energy and AI', url: 'https://www.iea.org/reports/energy-and-ai', locator: 'Networks within digital-infrastructure energy demand' },
      { title: 'IEA World Energy Outlook 2024', url: 'https://www.iea.org/reports/world-energy-outlook-2024', locator: 'Electricity-system context; no component-to-component causal estimate' }
    ]
  }),
  'fast_fashion->urbanization': decision({
    decision: 'rejected_confounded_development_claim',
    rationale: 'Garment production can cluster near cities and attract workers, but the reviewed sources do not establish fast fashion as a cause of annual built-up-surface expansion.',
    evidenceBoundary: 'Retain fashion supply-chain labor and land-use pathways only where factory location, migration and physical expansion are measured together.',
    redirect: ['textile_supply_chain_labor_exposure'],
    sources: [
      { title: 'UNEP Putting the brakes on fast fashion', url: 'https://www.unep.org/news-and-stories/story/putting-brakes-fast-fashion', locator: 'Fashion production and environmental impacts; no urbanization estimand' },
      { title: 'IPCC AR6 WGIII Chapter 8', url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', locator: 'Drivers of urban form and built-up expansion' }
    ]
  }),
  'environ_anomalies->food': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Compound hazards can reduce production, access and food security, but the Agricultural Demand node measures apparent commodity demand rather than scarcity, price or supply.',
    evidenceBoundary: 'Redirect hazard effects to crop-yield volatility, food insecurity, logistics disruption or price shocks.',
    redirect: ['crop_yield_volatility', 'food_insecurity', 'food_price_shock'],
    sources: [
      { title: 'IPCC AR6 WGII Chapter 5', url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', locator: 'Climate hazards, production and food-security outcomes' },
      { title: 'FAO SOFI', url: 'https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world', locator: 'Food availability, access and insecurity indicators' }
    ]
  }),
  'environ_anomalies->industry_farming': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Drought, flood and heat damage crops, animals and labor, but damage to production is not growth in the farming-system input-intensity profile.',
    evidenceBoundary: 'Use hazard-specific yield, livestock, labor and food-security endpoints.',
    redirect: ['crop_yield_volatility', 'farm_heat_stress', 'livestock_disease_pressure'],
    sources: [
      { title: 'IPCC AR6 WGII Chapter 5', url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', locator: 'Agricultural climate impacts and adaptation' },
      { title: 'IPCC Climate Change and Land Chapter 5', url: 'https://www.ipcc.ch/srccl/chapter/chapter-5/', locator: 'Food production, climate hazards and land-system impacts' }
    ]
  }),
  'industry_farming->food': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Intensive farming produces commodities, but the target metric is apparent demand, not agricultural output. Supply can influence price and consumption only through explicit market mediation.',
    evidenceBoundary: 'Link intensive farming to production, yield, environmental pressure or price outcomes; do not label supply as demand.',
    redirect: ['crop_yield_volatility', 'food_price_shock'],
    sources: [
      { title: 'FAOSTAT', url: 'https://www.fao.org/faostat/en/#data/GT', locator: 'Production, land-use and emissions statistical domains kept separate' },
      { title: 'FAO SOFI', url: 'https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world', locator: 'Food supply, access and demand concepts' }
    ]
  }),
  'resource_depletion->migration': decision({
    decision: 'deferred_composite_exposure_requires_disaggregation',
    rationale: 'Water or livelihood loss can contribute to migration, but a composite material-footprint node cannot identify the relevant depleted resource, population, location or migration decision.',
    evidenceBoundary: 'Research groundwater, drought, crop failure or livelihood loss separately with household or population movement data and alternatives.',
    redirect: ['groundwater_depletion', 'food_insecurity', 'drought_persistence'],
    sources: [
      { title: 'IPCC AR6 WGII Chapter 7', url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/', locator: 'Climate-related mobility, multi-causality and vulnerability' },
      { title: 'World Bank Groundswell', url: 'https://www.worldbank.org/en/news/feature/2021/09/13/millions-on-the-move-in-their-own-countries-the-human-face-of-climate-change', locator: 'Scenario-based internal climate migration and interacting socioeconomic drivers' }
    ]
  }),
  'temp->deforestation': decision({
    decision: 'rejected_forest_loss_not_deforestation_endpoint',
    rationale: 'Warming and drying can increase fire and tree mortality, but the target metric is permanent conversion of forest to another land use. Fire-driven tree-cover loss is not automatically deforestation.',
    evidenceBoundary: 'Route warming to wildfire regime, drought stress, mortality or biome-transition nodes; require documented post-disturbance land conversion for deforestation.',
    redirect: ['wildfire_regime_shift', 'forest_drought_stress_mortality', 'savannization_transition'],
    sources: [
      { title: 'IPCC AR6 WGI', url: 'https://www.ipcc.ch/report/ar6/wg1/', locator: 'Climate influence on heat, drought and fire weather' },
      { title: 'IPCC Climate Change and Land', url: 'https://www.ipcc.ch/srccl/', locator: 'Land degradation, fire, forest loss and land-use conversion distinctions' }
    ]
  }),
  'deforestation->food': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Forest clearing can temporarily increase cropland or pasture supply and later harm production, but neither mechanism directly measures apparent agricultural demand.',
    evidenceBoundary: 'Use land availability, production, yield, ecosystem service or food-security outcomes with a declared time horizon.',
    redirect: ['crop_yield_volatility', 'food_insecurity', 'soil_humus_decline'],
    sources: [
      { title: 'IPCC Climate Change and Land Chapter 5', url: 'https://www.ipcc.ch/srccl/chapter/chapter-5/', locator: 'Land-use change, food production and food-security pathways' },
      { title: 'FAOSTAT', url: 'https://www.fao.org/faostat/en/#data/GT', locator: 'Land use, production and demand accounting kept separate' }
    ]
  }),
  'deforestation->urbanization': decision({
    decision: 'rejected_confounded_sequence_not_direct_cause',
    rationale: 'Forest clearing can precede roads or settlement, but temporal sequence does not show that deforestation causes annual built-up expansion; infrastructure, tenure, policy and migration commonly drive both.',
    evidenceBoundary: 'Research road opening or settlement expansion as the exposure and distinguish clearing for agriculture from clearing for built infrastructure.',
    redirect: ['road_expansion_fragmentation', 'urban_sprawl_housing'],
    sources: [
      { title: 'IPCC Climate Change and Land', url: 'https://www.ipcc.ch/srccl/', locator: 'Land-use drivers and interacting governance factors' },
      { title: 'IPCC AR6 WGIII Chapter 8', url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', locator: 'Drivers of urban form and infrastructure expansion' }
    ]
  }),
  'environ_anomalies->urbanization': decision({
    decision: 'rejected_target_metric_mismatch',
    rationale: 'Compound hazards damage urban infrastructure and can alter migration or rebuilding, but damage is not annual expansion of built-up surface.',
    evidenceBoundary: 'Redirect to infrastructure fragility, disaster displacement, rebuilding demand or fiscal stress.',
    redirect: ['infrastructure_fragility', 'disaster_displacement', 'disaster_recovery_inequality'],
    sources: [
      { title: 'IPCC AR6 WGII Chapter 6', url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', locator: 'Urban climate risk, infrastructure damage and adaptation' },
      { title: 'IPCC AR6 WGIII Chapter 8', url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', locator: 'Built-form change and urban mitigation; not a hazard-to-expansion coefficient' }
    ]
  }),
  'sea_ice_season_loss->amoc': decision({
    decision: 'deferred_freshwater_source_and_scale_unresolved',
    rationale: 'Sea-ice melt redistributes freshwater seasonally but does not add new water to the ocean in the way land-ice melt does. The candidate does not isolate a sea-ice-season contribution to overturning transport from broader Arctic freshwater and heat fluxes.',
    evidenceBoundary: 'Research freshwater flux by source and basin against AMOC transport; do not substitute sea-ice season length for freshwater forcing.',
    redirect: ['freshwater_flux_north_atlantic', 'ocean_heat_content'],
    sources: [
      { title: 'IPCC AR6 WGI Chapter 9', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', locator: 'AMOC projections, freshwater forcing and ocean circulation uncertainty' },
      { title: 'IPCC SROCC Chapter 3', url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', locator: 'Polar ocean, sea ice and freshwater changes' }
    ]
  }),
  'urbanization->data_centers': decision({
    decision: 'rejected_location_and_demand_attribution_overclaim',
    rationale: 'Urban population and business activity use digital services, but data-center capacity can serve remote markets and is sited according to power, fibre, land, water, latency, tax and permitting conditions. Built-up expansion alone does not establish nearby data-center growth.',
    evidenceBoundary: 'Research digital-service demand, regional compute load or announced facility capacity with matched service territory and siting decisions.',
    redirect: ['internet_traffic_growth', 'grid_peak_load_stress'],
    sources: [
      { title: 'IEA Energy and AI', url: 'https://www.iea.org/reports/energy-and-ai', locator: 'Data-centre demand, location, power availability and deployment constraints' },
      { title: 'IPCC AR6 WGIII Chapter 8', url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', locator: 'Built-up expansion and urban-system boundaries' }
    ]
  }),
  'amoc->environ_anomalies': decision({
    decision: 'rejected_composite_hazard_endpoint',
    rationale: 'AMOC change affects regional temperature, precipitation, sea level and circulation, but the target metric counts concurrent threshold exceedances for named hazard pairs. A broad AMOC-to-compound-hazards edge lacks a specified pair, geography and event definition.',
    evidenceBoundary: 'Research one AMOC-conditioned regional hazard or compound event at a time with an explicit climate-model experiment and threshold.',
    redirect: ['north_atlantic_storm_track_shift', 'european_precipitation_shift', 'regional_sea_level_change'],
    sources: [
      { title: 'IPCC AR6 WGI Chapter 9', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', locator: 'AMOC change and regional ocean, heat and sea-level effects' },
      { title: 'IPCC AR6 WGI Chapter 11', url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', locator: 'Weather and climate extreme-event definitions and compound-event attribution' }
    ]
  }),
  'urbanization->migration': decision({
    decision: 'rejected_reverse_and_bidirectional_demographic_claim',
    rationale: 'Migration is often a driver of urban population growth, while cities can attract or displace people under different labor, housing and policy conditions. Annual built-up-surface expansion has no single positive effect on migration.',
    evidenceBoundary: 'Model rural-to-urban migration as a driver of urbanization, or use explicit housing-cost, employment, eviction or displacement mechanisms for outward movement.',
    redirect: ['urban_sprawl_housing', 'disaster_displacement'],
    sources: [
      { title: 'IPCC AR6 WGII Chapter 6', url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', locator: 'Section 6.2.4.3; rural migration as a driver of urbanisation and context-dependent urban mobility' },
      { title: 'IPCC AR6 WGIII Chapter 8', url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', locator: 'Urban growth, population, density and built-up form kept distinct' }
    ]
  })
});

export const CLOSED_MISSING_LINK_CANDIDATE_KEYS = Object.freeze(
  Object.keys(MISSING_LINK_CANDIDATE_DECISIONS)
);
