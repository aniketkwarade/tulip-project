import { SOURCE_READBACK_COMPLETION } from './source-readback-completion.js';
import { SOURCE_READBACK_COMPLETION_WAVE_TWO } from './source-readback-completion-wave-two.js';

const REVIEWED_AT = '2026-07-18';

const SECTORAL_CO2_TEMPERATURE_EDGE_KEYS = Object.freeze([
  'coal_power_co2_output->temp',
  'gas_power_co2_output->temp',
  'oil_power_co2_output->temp',
  'coal_industrial_heat_co2->temp',
  'gas_industrial_heat_co2->temp',
  'cement_kiln_fuel_co2->temp',
  'iron_steel_process_co2->temp',
  'chemical_process_co2->temp',
  'refinery_combustion_co2->temp',
  'aviation_jet_fuel_co2->temp',
  'shipping_bunker_fuel_co2->temp',
  'passenger_road_fuel_co2->temp',
  'diesel_freight_co2->temp',
  'rail_diesel_co2->temp',
  'residential_gas_heat_co2->temp',
  'commercial_gas_heat_co2->temp',
  'oil_building_heat_co2->temp',
  'fossil_power_backup_co2->temp',
  'waste_incineration_co2->temp',
  'oil_gas_flaring_co2->temp',
  'deforestation_co2_release->temp',
  'peatland_drainage_co2->temp',
  'land_use_fire_co2->temp',
  'construction_material_co2->temp',
  'fossil_hydrogen_co2->temp'
]);

function sectoralCo2TemperatureEstimate(edgeKey) {
  const sourceNodeId = edgeKey.split('->')[0];
  return Object.freeze({
    estimand: `Global-surface-temperature response to 1000 gigatonnes of cumulative anthropogenic carbon-dioxide emissions attributed to ${sourceNodeId}, holding the assessment boundary to carbon dioxide.`,
    estimate: 0.45,
    lower_bound: 0.27,
    upper_bound: 0.63,
    uncertainty_interval: 'IPCC AR6 assessed likely range for the transient climate response to cumulative carbon-dioxide emissions; the bounds are not a statistical confidence interval',
    unit: 'degrees Celsius global surface temperature increase per 1000 gigatonnes cumulative anthropogenic CO2 emitted',
    exposure_metric: `Cumulative anthropogenic carbon-dioxide emissions attributed to ${sourceNodeId} over the declared accounting period`,
    exposure_unit: '1000 gigatonnes cumulative CO2 emitted',
    source_id: 'ipcc_ar6_wgi_transient_climate_response_to_cumulative_co2_emissions',
    outcome_metric: 'Increase in global surface temperature caused by cumulative anthropogenic carbon-dioxide emissions',
    outcome_unit: 'degrees Celsius',
    geography: 'Global climate response; sector attribution may be global or an explicitly bounded inventory whose emissions are accumulated into the global total',
    period: 'Near-linear response assessed over the course of this century for warming levels up to at least 2 degrees Celsius relative to 1850-1900',
    evidence_design: 'ipcc_authoritative_assessment_integrating_observations_process_understanding_and_earth_system_model_evidence',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/',
      section: 'Summary for Policymakers D.1.1 and Figure SPM.10: each 1000 GtCO2 of cumulative anthropogenic CO2 emissions likely causes 0.27-0.63 degrees Celsius of global surface warming, best estimate 0.45 degrees Celsius'
    },
    moderators: [
      'cumulative rather than annual carbon-dioxide emissions',
      'non-CO2 greenhouse gases',
      'co-emitted cooling aerosols',
      'Earth-system feedbacks including permafrost emissions',
      'warming level and century-scale assessment horizon',
      'net-negative emissions and path dependence',
      'sector inventory boundary',
      'land-use flux accounting'
    ],
    boundary: 'TCRE is source-independent for a tonne of well-mixed anthropogenic CO2, but this does not make sectors climate-equivalent: methane, nitrous oxide, aerosols, contrails, ozone precursors, albedo effects, lifecycle emissions and avoided-dispatch effects remain outside this CO2-only coefficient. The estimate applies to cumulative emissions, not one year of sector output, and must not be presented as a sector-specific observational coefficient or a temperature forecast.'
  });
}

const SOURCE_REPORTED_ESTIMATES = Object.freeze({
  ...Object.fromEntries(
    SECTORAL_CO2_TEMPERATURE_EDGE_KEYS.map(edgeKey => [edgeKey, sectoralCo2TemperatureEstimate(edgeKey)])
  ),
  'deforestation->monsoon_volatility': Object.freeze({
    estimand: 'Change in global monsoon-domain annual precipitation under the paired idealized global-deforestation experiment across the LUMIP/CMIP6 model ensemble.',
    estimate: -15.01,
    lower_bound: -42.08,
    upper_bound: 13.31,
    uncertainty_interval: 'Source-reported minimum-to-maximum model range, not a statistical confidence interval',
    unit: 'millimetres per year change in global monsoon-domain annual precipitation',
    exposure_metric: 'Idealized global forest removal in the paired LUMIP land-use experiment',
    exposure_unit: 'approximately 38 percent of global forest area removed relative to each model control',
    source_id: 'earths_future_deforestation_drives_desiccation_global_monsoon_region',
    outcome_metric: 'Global monsoon-domain annual precipitation response',
    outcome_unit: 'millimetres per year relative to paired control',
    geography: 'Global monsoon domain across 11 LUMIP/CMIP6 models',
    period: 'Study-native idealized paired experiment rather than an observed calendar-period trend',
    evidence_design: 'paired_multi_model_idealized_land_use_experiment',
    source_locator: {
      url: 'https://doi.org/10.1029/2022EF002863',
      section: 'Results and Discussion: multi-model mean global monsoon precipitation response of -15.01 mm/year, with individual-model range -42.08 to +13.31 mm/year, under approximately 38 percent global deforestation'
    },
    moderators: ['deforestation geography and fraction', 'land-surface albedo and roughness', 'evapotranspiration and moisture recycling', 'hemispheric thermal contrast', 'ITCZ displacement', 'background ocean state', 'monsoon region', 'model parameterization'],
    boundary: 'This is a cross-model response to a large idealized forest-removal experiment, not an observed marginal effect of annual deforestation, a statistical confidence interval, or a universal coefficient for monsoon onset or rainfall variance. The model range crosses zero and regional responses differ.'
  }),
  'madden_julian_oscillation->extreme_precipitation_intensity': Object.freeze({
    estimand: 'Ratio of the joint probability of CONUS extreme-precipitation spatial-extent or intensity exceedance on active-MJO days relative to inactive-MJO days.',
    estimate: 2.25,
    lower_bound: 2,
    upper_bound: 2.5,
    point_estimate_status: 'derived_midpoint_of_source_reported_range',
    uncertainty_interval: 'Source-reported range across CONUS sectors and the 75th and 90th percentile contiguous-region definitions, not a statistical confidence interval',
    unit: 'probability ratio for extreme-precipitation area or intensity exceedance on active versus inactive MJO days',
    exposure_metric: 'Active versus inactive Madden-Julian Oscillation state, with phase and ENSO stratification',
    exposure_unit: 'study-native MJO activity classification',
    source_id: 'journal_of_climate_mjo_conus_extreme_precipitation',
    outcome_metric: 'Fractional area and intensity of contiguous CONUS regions exceeding seasonal 75th or 90th precipitation percentiles',
    outcome_unit: 'conditional joint-probability ratio',
    geography: 'Six sectors of the contiguous United States',
    period: 'Boreal winters, November-March, 1979-2010',
    evidence_design: 'daily_gridded_observational_composite_and_conditional_probability_analysis',
    source_locator: {
      url: 'https://doi.org/10.1175/JCLI-D-11-00278.1',
      section: 'Abstract and Results: joint probabilities of fractional area and intensity during active MJO are reported as 2.0-2.5 times inactive-day probabilities for the 75th and 90th percentile contiguous extreme-precipitation regions'
    },
    moderators: ['MJO phase', 'ENSO phase', 'CONUS sector', 'precipitation percentile', 'spatial-extent versus intensity outcome', 'season', 'MJO activity definition'],
    boundary: 'The 2.25 registry value is only the arithmetic midpoint of a source-reported 2.0-2.5 cross-sector and cross-definition range. The range is not a confidence interval, the result applies to CONUS boreal winter, and the source explicitly states that the MJO is not the sole driver and that probabilities do not vary monotonically with MJO amplitude.'
  }),
  'temp->sea_level_rise': Object.freeze({
    estimand: 'Assessed rate of the thermosteric component of global mean sea-level rise during 2006-2015.',
    estimate: 1.4,
    lower_bound: 1,
    upper_bound: 1.8,
    uncertainty_interval: 'IPCC source-reported plus or minus 0.40 millimetres per year; represented as the reported assessment range and not relabelled as a statistical confidence interval',
    unit: 'millimetres per year of global mean thermosteric sea-level rise',
    exposure_metric: 'Vertically integrated ocean warming expressed through ocean heat uptake and density change',
    exposure_unit: 'ocean temperature and heat-content observations used in the IPCC steric reconstruction',
    source_id: 'ipcc_ar6_wgi_thermosteric_sea_level_assessment',
    outcome_metric: 'Global mean thermosteric sea-level change',
    outcome_unit: 'millimetres per year',
    geography: 'Global mean thermosteric component, not local relative or total sea level',
    period: '2006-2015',
    evidence_design: 'authoritative_assessment_of_observational_steric_sea_level_reconstructions',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      section: 'Section 9.2.4.1 assessment of global mean thermosteric sea-level rates, including 1.40 plus or minus 0.40 millimetres per year for 2006-2015'
    },
    moderators: ['ocean depth and basin', 'temperature and salinity profile coverage', 'historical bias correction', 'ocean circulation', 'assessment period', 'steric component definition'],
    boundary: 'This estimate covers only the thermosteric component associated with ocean density change. It excludes glacier and ice-sheet mass loss, land-water storage, ocean dynamics and vertical land motion, and it is not a universal millimetres-per-degree surface-air-temperature coefficient.'
  }),
  'temp->critical_infrastructure_fragility': Object.freeze({
    estimand: 'Projected reduction in reinforced-concrete infrastructure service life at 25 degrees north in the contiguous United States under RCP8.5 during the twenty-first century.',
    estimate: 25,
    lower_bound: 20,
    upper_bound: 30,
    point_estimate_status: 'derived_midpoint_of_source_reported_material_range',
    uncertainty_interval: 'Source-reported range across high-strength and normal-strength concrete cases, not a statistical confidence interval',
    unit: 'percent reduction in modeled reinforced-concrete service life relative to the study baseline',
    exposure_metric: 'Climate-sensitive temperature and moisture exposure under RCP8.5',
    exposure_unit: 'study-native climate scenario applied to reinforced-concrete deterioration models',
    source_id: 'aci_lifetime_reduction_concrete_infrastructure_global_warming',
    outcome_metric: 'Modeled reinforced-concrete service life',
    outcome_unit: 'percent change relative to baseline service life',
    geography: 'Specified 25-degree-north cases in the contiguous United States analysis',
    period: 'Twenty-first-century RCP8.5 projection horizon used by the study',
    evidence_design: 'scenario_driven_reinforced_concrete_deterioration_and_service_life_model',
    source_locator: {
      url: 'https://doi.org/10.14359/51744358',
      section: 'Results: service-life reductions up to 20 percent for high-strength and 30 percent for normal-strength concrete at 25 degrees north under RCP8.5'
    },
    moderators: ['concrete strength', 'cover depth', 'temperature and humidity', 'chloride or carbonation exposure', 'latitude', 'emissions scenario', 'construction quality', 'maintenance and adaptation'],
    boundary: 'The 25 percent registry value is only the arithmetic midpoint of a material-specific 20-30 percent source range. It is not source reported as a point estimate, confidence interval, observed failure rate, outage probability or result for all materials, locations and scenarios.'
  }),
  'temp->pollen_allergen_spikes': Object.freeze({
    estimand: 'Share of the observed North American pollen-season-length trend attributed to the modeled anthropogenic climate-change temperature signal.',
    estimate: 27,
    lower_bound: 19,
    upper_bound: 35,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    uncertainty_interval: 'Source-reported interquartile range across the Earth-system-model attribution ensemble; 27 percent is only the arithmetic midpoint of the reported 19-35 percent range',
    unit: 'percent of the observed 1990-2018 pollen-season-length trend attributable to the anthropogenic climate-change temperature signal',
    exposure_metric: 'Modeled anthropogenic contribution to the local temperature anomaly, represented by a 50-year moving-average signal from historical and RCP simulations',
    exposure_unit: 'factual anthropogenic-temperature signal versus the counterfactual without that signal',
    source_id: 'pnas_anthropogenic_climate_change_and_north_american_pollen_seasons',
    outcome_metric: 'Station-level annual pollen-season length aggregated across the North American monitoring network',
    outcome_unit: 'attributable share of the observed season-length trend',
    geography: 'Sixty pollen-monitoring stations in the United States and Canada',
    period: '1990-2018, spanning 821 station-years',
    evidence_design: 'multistation_observational_trend_analysis_combined_with_earth_system_model_detection_and_attribution',
    source_locator: {
      url: 'https://doi.org/10.1073/pnas.2013284118',
      section: 'Results and Fig. 4: anthropogenic forcing contributed 19-35 percent, interquartile range, of the observed 1990-2018 pollen-season-length trend across the model ensemble'
    },
    moderators: ['plant taxon', 'station geography', 'sampler and counting method', 'local land cover and vegetation', 'precipitation', 'frost timing', 'wind transport', 'carbon-dioxide fertilization outside the temperature-only attribution signal'],
    boundary: 'This is an attribution share for the observed multi-taxon North American season-length trend, not a universal days-per-degree coefficient, pollen concentration effect, allergen-potency estimate, or forecast for an individual station. The source reports an interquartile model range rather than a statistical confidence interval, and the 27 percent registry point is not source reported.'
  }),
  'industry_farming->air_pollution_health_burden': Object.freeze({
    estimand: 'Annual premature mortality attributable to increased ambient fine-particle exposure from United States agricultural emissions.',
    estimate: 17900,
    lower_bound: 15600,
    upper_bound: 20300,
    uncertainty_interval: 'Source-reported range across the study air-quality and health-impact model configurations',
    unit: 'premature deaths per year attributable to PM2.5 formed from or emitted by United States agriculture',
    exposure_metric: 'Agricultural primary PM2.5 and precursor emissions from livestock waste, fertilizer application, tillage, field burning, livestock dust, and machinery',
    exposure_unit: '2014 United States agricultural emissions inventory propagated through the study atmospheric model',
    source_id: 'pnas_air_quality_related_health_damages_of_food',
    outcome_metric: 'Annual premature mortality attributable to chronic exposure to agriculture-related ambient PM2.5',
    outcome_unit: 'premature deaths per year',
    geography: 'Contiguous United States agricultural production and exposed United States population',
    period: '2014 emissions, production, population, and baseline mortality conditions used by the study',
    evidence_design: 'source_resolved_emissions_inventory_atmospheric_reduced_complexity_model_and_concentration_response_health_impact_assessment',
    source_locator: {
      url: 'https://doi.org/10.1073/pnas.2013637118',
      section: 'Results and Fig. 1: United States agriculture causes 17,900 annual air-quality-related deaths, with a 15,600-20,300 range across models; 12,400 are attributed to ammonia and 4,800 to primary PM2.5'
    },
    moderators: ['ammonia chemistry and meteorology', 'location of farms and exposed populations', 'livestock waste and fertilizer management', 'tillage, burning, dust and machinery emissions', 'baseline mortality and population', 'atmospheric-model choice', 'concentration-response function', 'diet and production mix'],
    boundary: 'This is a modeled United States annual burden for the declared 2014 inventory, not an observed death count, global coefficient, farm-level risk, per-unit production factor, or estimate of greenhouse-gas damages. It covers PM2.5-related mortality from the agricultural emissions inventory; food production accounts for 15,900 of the 17,900 estimate, and the range represents model variation rather than a sampling confidence interval.'
  }),
  'carbon_emission->sea_ice_season_loss': Object.freeze({
    estimand: 'Observed September Arctic sea-ice-area response to one additional metric tonne of cumulative anthropogenic carbon-dioxide emissions.',
    estimate: -3,
    lower_bound: -3.3,
    upper_bound: -2.7,
    uncertainty_interval: 'Source-reported plus or minus 0.3 square metres per metric tonne, represented here as the reported sensitivity range rather than a statistical confidence interval',
    unit: 'square metres of September Arctic sea-ice area per additional metric tonne of cumulative anthropogenic CO2 emissions',
    exposure_metric: 'Cumulative anthropogenic carbon-dioxide emissions',
    exposure_unit: 'metric tonnes CO2',
    source_id: 'notz_stroeve_2016_observed_arctic_sea_ice_loss',
    outcome_metric: 'Monthly-mean September Arctic sea-ice area',
    outcome_unit: 'square metres',
    geography: 'Pan-Arctic September sea-ice area reconstructed from observations since 1953',
    period: 'Observed cumulative-emissions and September sea-ice record assessed through the source publication period in 2016',
    evidence_design: 'observational_time_series_sensitivity_analysis_compared_with_climate_model_ensembles',
    source_locator: {
      url: 'https://doi.org/10.1126/science.aag2345',
      section: 'Abstract and main results: sustained observed sensitivity of 3 plus or minus 0.3 square metres of September sea-ice-area loss per metric tonne of cumulative anthropogenic CO2 emissions'
    },
    moderators: [
      'internal climate variability',
      'September rather than annual or winter sea-ice state',
      'sea-ice area rather than extent, thickness, age or melt-season duration',
      'observational reconstruction and emissions-inventory uncertainty',
      'aerosols and non-CO2 forcing',
      'ocean and atmospheric heat transport',
      'regional winds and circulation',
      'approach to a seasonally ice-free state'
    ],
    boundary: 'The coefficient is an observed pan-Arctic September-area sensitivity to cumulative anthropogenic CO2, not a local-sector coefficient, annual-emissions multiplier, prediction for Antarctic sea ice, or estimate of melt-season length. The target node can display this estimate only when its endpoint is explicitly September Arctic sea-ice area; other sea-ice metrics retain an unquantified relationship.'
  }),
  'wetlands_drainage_scales->carbon_emission': Object.freeze({
    estimand: 'Annual on-site soil carbon emitted after drainage of temperate forest land on organic soil under the IPCC Tier 1 land-use and climate-class boundary.',
    estimate: 2.6,
    lower_bound: 2,
    upper_bound: 3.3,
    uncertainty_interval: 'IPCC Wetlands Supplement source-reported 95 percent confidence interval based on eight temperate drained-forest sites',
    unit: 'tonnes CO2-C emitted per hectare of drained temperate forest organic soil per year',
    exposure_metric: 'Area of temperate forest land on organic soil maintained under drained conditions',
    exposure_unit: 'hectares drained organic soil',
    source_id: 'ipcc_2013_wetlands_supplement_drained_inland_organic_soils',
    outcome_metric: 'Annual on-site soil carbon emitted as carbon dioxide carbon',
    outcome_unit: 'tonnes CO2-C per year',
    geography: 'Temperate drained forest land on organic soils represented by the eight sites in the IPCC Tier 1 synthesis',
    period: 'Annual steady inventory factor while the land remains in the declared drained forest-organic-soil class',
    evidence_design: 'ipcc_inventory_methodology_synthesis_of_site_level_flux_studies',
    source_locator: {
      url: 'https://www.ipcc-nggip.iges.or.jp/public/wetlands/pdf/Wetlands_separate_files/WS_Chp2_Drained_Inland_Organic_Soils.pdf',
      section: 'Chapter 2, Table 2.1, Tier 1 CO2 emission/removal factors for drained organic soils: Forest Land, drained, Temperate; mean 2.6, 95 percent confidence interval 2.0-3.3 tonnes CO2-C per hectare per year, eight sites'
    },
    moderators: [
      'land-use class',
      'climate and vegetation zone',
      'organic-soil nutrient status',
      'drainage depth and water table',
      'vegetation carbon uptake',
      'soil carbon export',
      'fire',
      'time since drainage',
      'site representation'
    ],
    boundary: 'This is the source-native Tier 1 on-site soil CO2-C factor for temperate drained forest organic soils. It is not a global wetland average, not total ecosystem net greenhouse-gas balance, and excludes biomass change, fire, dissolved organic carbon, methane, nitrous oxide and downstream oxidation unless those terms are inventoried separately. Convert carbon mass to carbon-dioxide mass only with the declared 44/12 molecular-weight factor.'
  }),
  'tropospheric_ozone->air_pollution_health_burden': Object.freeze({
    estimand: 'Pooled short-term all-cause mortality response to a 10 microgram per cubic metre increase in outdoor ozone concentration.',
    estimate: 1.0043,
    lower_bound: 1.0034,
    upper_bound: 1.0052,
    uncertainty_interval: 'Source-reported 95 percent confidence interval from the random-effects systematic review and meta-analysis',
    unit: 'relative risk of all-cause mortality per 10 micrograms ozone per cubic metre higher short-term outdoor exposure',
    exposure_metric: 'Short-term outdoor ozone concentration using the source study averaging and lag definitions',
    exposure_unit: '10 micrograms ozone per cubic metre',
    source_id: 'who_orellano_2020_short_term_ozone_mortality_meta_analysis',
    outcome_metric: 'Daily all-cause mortality',
    outcome_unit: 'relative risk',
    geography: 'Human populations represented by the international time-series and case-crossover literature in the WHO-commissioned review',
    period: 'Short-term exposure windows from one hour to several days in studies published through the review search period ending in 2018',
    evidence_design: 'who_commissioned_systematic_review_and_random_effects_meta_analysis_of_short_term_air_pollution_mortality_studies',
    source_locator: {
      url: 'https://doi.org/10.1016/j.envint.2020.105876',
      section: 'Abstract and WHO Global Air Quality Guidelines Annex 3 Section A3.3: ozone pooled RR 1.0043, 95 percent CI 1.0034-1.0052, per 10 micrograms per cubic metre for all-cause mortality; 196 articles included across pollutant-outcome analyses'
    },
    moderators: ['ozone averaging time and lag', 'temperature and season', 'co-pollutants', 'baseline mortality and population age', 'regional exposure range', 'monitor placement and exposure error', 'single-city versus multicity design', 'concentration-response shape'],
    boundary: 'This is a pooled short-term observational association, not an individual probability, long-term coefficient, source-specific ozone effect, or proof that every 10-microgram increment has the same response. The model assumes a linear increment, while ozone formation, exposure and vulnerability vary by place and season.'
  }),
  'carbon_monoxide->air_pollution_health_burden': Object.freeze({
    estimand: 'Pooled myocardial-infarction risk response to a 1 milligram per cubic metre increase in short-term ambient carbon-monoxide concentration.',
    estimate: 1.052,
    lower_bound: 1.017,
    upper_bound: 1.089,
    uncertainty_interval: 'Source-reported 95 percent confidence interval from the random-effects systematic review and meta-analysis',
    unit: 'relative risk of myocardial infarction per 1 milligram carbon monoxide per cubic metre higher short-term ambient exposure',
    exposure_metric: 'Short-term ambient carbon-monoxide concentration with study lags up to seven days',
    exposure_unit: '1 milligram carbon monoxide per cubic metre',
    source_id: 'who_lee_2020_carbon_monoxide_myocardial_infarction_meta_analysis',
    outcome_metric: 'Emergency visit, hospital admission or mortality due to myocardial infarction',
    outcome_unit: 'relative risk',
    geography: 'Populations represented by 26 studies in the WHO-commissioned review; low- and middle-income countries were sparsely represented',
    period: 'Studies published through 30 September 2018 with exposure lags up to seven days',
    evidence_design: 'who_commissioned_systematic_review_and_random_effects_meta_analysis_of_short_term_carbon_monoxide_and_myocardial_infarction_studies',
    source_locator: {
      url: 'https://doi.org/10.1016/j.envint.2020.105901',
      section: 'Abstract, Results and WHO Global Air Quality Guidelines Annex 3 Section A3.6: pooled RR 1.052, 95 percent CI 1.017-1.089, per 1 mg/m3 ambient CO; 26 included studies and moderate-certainty GRADE assessment'
    },
    moderators: ['ambient concentration and exposure range', 'lag selection', 'co-pollutants and traffic mixtures', 'baseline cardiovascular risk', 'age and socioeconomic conditions', 'monitor representativeness', 'outcome definition', 'confounder adjustment'],
    boundary: 'This is a pooled observational association for myocardial-infarction events, not all-cause mortality, poisoning at high indoor concentrations, a source-specific coefficient, or an individual causal probability. One third of included studies had high risk of bias from inadequate confounding adjustment, the 80 percent prediction interval was wider than the confidence interval, and low- and middle-income settings were underrepresented.'
  }),
  'pollen_allergen_spikes->air_pollution_health_burden': Object.freeze({
    estimand: 'Adjusted cumulative non-accidental mortality-rate ratio during abundant alder-pollen exposure compared with low alder-pollen exposure in the Helsinki Metropolitan Area.',
    estimate: 1.095,
    lower_bound: 1.008,
    upper_bound: 1.189,
    uncertainty_interval: 'Source-reported 95 percent confidence interval from the quasi-Poisson distributed-lag model',
    unit: 'adjusted cumulative mortality rate ratio for abundant versus low daily alder-pollen concentration',
    exposure_metric: 'Daily alder-pollen concentration categorized as abundant above 100 grains per cubic metre versus low below 10 grains per cubic metre',
    exposure_unit: 'source-defined categorical daily alder-pollen exposure',
    source_id: 'european_journal_public_health_ryti_2021_pollen_mortality_helsinki',
    outcome_metric: 'Daily non-accidental deaths',
    outcome_unit: 'adjusted cumulative mortality rate ratio',
    geography: 'Helsinki Metropolitan Area, Finland',
    period: 'March-August pollen seasons during 1994-2014; cumulative seven-day lag for non-accidental mortality',
    evidence_design: 'single_region_time_series_quasi_poisson_distributed_lag_model_with_air_pollution_temperature_and_temporal_adjustment',
    source_locator: {
      url: 'https://doi.org/10.1093/eurpub/ckab034',
      section: 'Methods and Table 1: abundant alder pollen above 100 grains/m3 versus low exposure below 10 grains/m3 associated with non-accidental mortality acMRR 1.095, 95 percent CI 1.008-1.189, using a seven-day lag during 1994-2014'
    },
    moderators: ['pollen taxon and cross-reactivity', 'season and lag definition', 'sensitization prevalence', 'temperature', 'PM2.5, sulfur dioxide and ozone', 'rainfall and wind transport', 'medication and avoidance behavior', 'monitor representativeness'],
    boundary: 'This is one regional observational association for abundant alder pollen, not a universal pollen coefficient or evidence for every pollen taxon. Birch estimates were inconsistent, several grass and mugwort intervals crossed the null, biological mechanisms were not measured, and the authors call for replication across climatic zones.'
  }),
  'dust_storm_frequency->air_pollution_health_burden': Object.freeze({
    estimand: 'Pooled same-day cardiovascular-mortality response to a 10 microgram per cubic metre increase in PM10 attributed to desert dust episodes.',
    estimate: 1.018,
    lower_bound: 1.008,
    upper_bound: 1.027,
    uncertainty_interval: 'Source-reported 95 percent confidence interval from the inverse-variance random-effects meta-analysis',
    unit: 'incidence rate ratio for cardiovascular mortality per 10 micrograms desert-dust PM10 per cubic metre higher same-day exposure',
    exposure_metric: 'Daily PM10 concentration attributed to identified desert-dust episodes',
    exposure_unit: '10 micrograms desert-dust PM10 per cubic metre',
    source_id: 'journal_clinical_medicine_dominguez_rodriguez_2021_desert_dust_cardiovascular_meta_analysis',
    outcome_metric: 'Daily cardiovascular mortality',
    outcome_unit: 'incidence rate ratio',
    geography: 'Populations represented by eight mortality studies within a 15-study systematic review of desert-dust cardiovascular outcomes',
    period: 'Same-day exposure response in studies published before March 2020; 477,771 cardiovascular-mortality events in the pooled lag-zero analysis',
    evidence_design: 'systematic_review_and_inverse_variance_random_effects_meta_analysis_of_daily_desert_dust_cardiovascular_event_studies',
    source_locator: {
      url: 'https://doi.org/10.3390/jcm10040727',
      section: 'Abstract and Results Section 3.2/Figure 3: lag-zero cardiovascular mortality IRR 1.018, 95 percent CI 1.008-1.027, per 10 micrograms per cubic metre PM10-dust; eight studies, 477771 events and I-squared 49.54 percent'
    },
    moderators: ['dust-source mineralogy and transported pollutants', 'PM10 attribution method', 'storm definition and duration', 'lag selection', 'baseline cardiovascular disease', 'age', 'weather and co-pollutants', 'regional healthcare and warning behavior'],
    boundary: 'This is a same-day pooled association for cardiovascular mortality per dust-attributed PM10 increment, not an effect of storm count alone, an all-cause mortality coefficient, or a universal response to every mineral-dust plume. Between-study heterogeneity was moderate, dust composition and attribution differ by region, and lag-one and combined-lag estimates were smaller.'
  }),
  'compound_day_night_heat_extremes->heatwave_excess_mortality_rates': Object.freeze({
    estimand: 'Pooled percentage change in non-accidental mortality during source-defined compound daytime-nighttime heat waves compared with non-event days across Chinese communities.',
    estimate: 8.86,
    lower_bound: 6.82,
    upper_bound: 10.94,
    uncertainty_interval: 'Source-reported 95 percent confidence interval from the random-effects meta-analysis of community-specific quasi-Poisson estimates',
    unit: 'percent change in non-accidental mortality over lag days 0-1 during a compound daytime-nighttime heat-wave event',
    exposure_metric: 'Community-specific compound event in which both daytime maximum and preceding nighttime minimum temperatures meet the selected heat-wave threshold and duration',
    exposure_unit: 'binary source-defined compound heat-wave event day',
    source_id: 'communications_medicine_yang_2024_compound_temperature_mortality_china',
    outcome_metric: 'Daily non-accidental mortality count',
    outcome_unit: 'percent change in mortality rate relative to non-event days',
    geography: '161 districts and counties across six climate zones in China, covering about 73 million people',
    period: 'hot seasons, May-September, during 2007-2013; cumulative lag 0-1 days',
    evidence_design: 'multi_site_time_series_quasi_poisson_models_pooled_with_random_effects_meta_analysis',
    source_locator: {
      url: 'https://www.nature.com/articles/s43856-024-00557-0',
      section: 'Methods and Results, Effect modification by relative humidity: compound daytime-nighttime heat wave associated with 8.86 percent higher non-accidental mortality, 95 percent CI 6.82-10.94, across lag 0-1 days'
    },
    moderators: ['local heat-wave threshold and duration', 'relative humidity', 'age and underlying disease', 'education', 'urbanization', 'PM2.5', 'climate zone', 'adaptation and cooling access', 'lag specification'],
    boundary: 'This is a pooled observational association under community-specific heat-wave definitions in China, not a universal causal coefficient, per-degree response, individual probability, future projection or estimate for all causes and countries. The model adjusts for seasonality, long-term trend, day of week, holidays, pressure and humidity; residual confounding and spatial heterogeneity remain.'
  }),
  'nocturnal_heat_stress->heatwave_excess_mortality_rates': Object.freeze({
    estimand: 'Pooled percentage change in non-accidental mortality during source-defined nighttime-only heat waves compared with non-event days across Chinese communities.',
    estimate: 1.16,
    lower_bound: -0.75,
    upper_bound: 3.1,
    uncertainty_interval: 'Source-reported 95 percent confidence interval from the random-effects meta-analysis; the interval crosses zero and the estimate is not statistically distinguishable from no association at the 95 percent level',
    unit: 'percent change in non-accidental mortality over lag days 0-1 during a nighttime-only heat-wave event',
    exposure_metric: 'Community-specific nighttime-only event in which nighttime minimum temperature meets the selected heat-wave threshold and the following daytime does not',
    exposure_unit: 'binary source-defined nighttime-only heat-wave event day',
    source_id: 'communications_medicine_yang_2024_compound_temperature_mortality_china',
    outcome_metric: 'Daily non-accidental mortality count',
    outcome_unit: 'percent change in mortality rate relative to non-event days',
    geography: '161 districts and counties across six climate zones in China, covering about 73 million people',
    period: 'hot seasons, May-September, during 2007-2013; cumulative lag 0-1 days',
    evidence_design: 'multi_site_time_series_quasi_poisson_models_pooled_with_random_effects_meta_analysis',
    source_locator: {
      url: 'https://www.nature.com/articles/s43856-024-00557-0',
      section: 'Results, Effect modification by relative humidity: nighttime-only heat wave associated with 1.16 percent change in non-accidental mortality, 95 percent CI -0.75 to 3.10, across lag 0-1 days'
    },
    moderators: ['local nighttime threshold and duration', 'following daytime temperature', 'relative humidity', 'age and underlying disease', 'sleep and housing conditions', 'cooling access', 'climate zone', 'lag specification'],
    boundary: 'The confidence interval includes zero, so this estimate must not be presented as a confirmed positive effect. It is a pooled observational association under community-specific Chinese heat-wave definitions, not a universal causal coefficient, per-degree response, individual risk or future burden estimate. Compound day-night events produced a substantially larger estimate and remain a separate exposure.'
  }),
  'cement_process_emissions->carbon_emission': Object.freeze({
    estimand: 'Global annual direct greenhouse-gas emissions from cement production, including process heating and limestone-calcination emissions, in 2019.',
    estimate: 2.3,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    lower_bound: 2.1,
    upper_bound: 2.5,
    uncertainty_interval: 'IPCC source-reported assessment range; 2.3 GtCO2-equivalent per year is only the arithmetic midpoint retained for registry summarization',
    unit: 'gigatonnes CO2-equivalent per year of global direct cement-production emissions',
    exposure_metric: 'Global cement production using the 2019 technology and fuel mix',
    exposure_unit: 'annual global production system rather than one tonne of cement or a marginal intervention',
    source_id: 'ipcc_ar6_wg3_chapter_11_industry',
    outcome_metric: 'Direct cement-production greenhouse-gas emissions from energy and process chemistry',
    outcome_unit: 'gigatonnes CO2-equivalent per year',
    geography: 'global cement sector',
    period: 'calendar year 2019 assessment',
    evidence_design: 'ipcc_authoritative_synthesis_of_global_industrial_emissions_inventories_and_sector_studies',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/',
      section: 'Section 11.4.1.2, lines 1547-1551: direct cement-production emissions 2.1-2.5 GtCO2-eq in 2019; typically about 40 percent process heating and 60 percent limestone-decomposition process CO2'
    },
    moderators: ['clinker-to-cement ratio', 'kiln thermal efficiency', 'fuel carbon intensity', 'electricity mix', 'cement chemistry', 'calcined kiln dust', 'carbon capture', 'concrete carbonation and accounting boundary'],
    boundary: 'The 2.1-2.5 range covers global direct cement production and combines energy and process emissions; it is not a statistical confidence interval, a per-tonne factor, cement-process-only total, lifecycle footprint or current-year estimate. The 2.3 point is a transparent midpoint, not an IPCC best estimate.'
  }),
  'steel->carbon_emission': Object.freeze({
    estimand: 'Global annual greenhouse-gas emissions attributable to crude-steel production under the source assessment boundary in 2019.',
    estimate: 3.9,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    lower_bound: 3.7,
    upper_bound: 4.1,
    uncertainty_interval: 'IPCC source-reported cross-boundary assessment range; 3.9 GtCO2-equivalent per year is only the arithmetic midpoint retained for registry summarization',
    unit: 'gigatonnes CO2-equivalent per year attributable to global steel production',
    exposure_metric: 'Global crude-steel production using the 2019 route mix and the source study accounting boundaries',
    exposure_unit: 'annual global steel-production system rather than one tonne of steel or a marginal intervention',
    source_id: 'ipcc_ar6_wg3_chapter_11_steel',
    outcome_metric: 'Greenhouse-gas emissions attributable to steel production',
    outcome_unit: 'gigatonnes CO2-equivalent per year',
    geography: 'global steel sector',
    period: 'calendar year 2019 assessment',
    evidence_design: 'ipcc_authoritative_synthesis_of_global_industrial_emissions_inventories_and_sector_studies',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/',
      section: 'Section 11.4.1.1 Steel: global steel-production greenhouse-gas emissions are assessed at 3.7-4.1 GtCO2-equivalent depending on scope; steel represented about 20 percent of global direct industrial emissions in 2019'
    },
    moderators: ['blast-furnace versus electric-arc route share', 'scrap availability and quality', 'ore grade', 'coke and reductant use', 'electricity and fuel carbon intensity', 'plant efficiency', 'process-gas accounting', 'indirect-electricity allocation', 'hydrogen, biomass and carbon capture'],
    boundary: 'The 3.7-4.1 range varies with the accounting scope and is not a statistical confidence interval, a per-tonne intensity, a marginal intervention effect or a current-year estimate. The 3.9 point is a transparent arithmetic midpoint, not an IPCC best estimate. Direct, indirect, process-gas and lifecycle boundaries must not be mixed.'
  }),
  'temp->overstory_tree_mortality': Object.freeze({
    estimand: 'Increase in ponderosa-pine mortality during the 2012-2015 California drought attributable to contemporary warming acting through western-pine-beetle development and overwinter survival.',
    estimate: 29.9,
    lower_bound: 29.4,
    upper_bound: 30.2,
    uncertainty_interval: 'Source-reported 95 percent confidence interval from the coupled western-pine-beetle and host-tree model evaluated against field observations',
    unit: 'percent increase in ponderosa-pine mortality during the drought attributable to the warming-sensitive western-pine-beetle pathway',
    exposure_metric: 'Contemporary versus counterfactual cooler temperature forcing in the source western-pine-beetle and host-tree model',
    exposure_unit: 'source historical-warming contrast rather than a universal one-degree increment',
    source_id: 'global_change_biology_robbins_2022_warming_beetle_tree_mortality',
    outcome_metric: 'Ponderosa-pine mortality during drought attributable to western-pine-beetle voltinism and overwinter survival',
    outcome_unit: 'percent change in mortality',
    geography: 'ponderosa-pine forests of the Sierra Nevada, California, United States',
    period: 'meteorological drought during 2012-2015 with lagged ponderosa-pine response observations extending through 2016',
    evidence_design: 'process_based_western_pine_beetle_host_tree_model_evaluated_against_observed_flight_timing_and_tree_mortality',
    source_locator: {
      url: 'https://research.fs.usda.gov/treesearch/63775',
      section: 'Abstract and source full text: warming increased western-pine-beetle development, reduced larval overwinter mortality and produced a 29.9 percent increase in ponderosa-pine mortality during drought, with a 95 percent confidence interval of 29.4-30.2 percent'
    },
    moderators: ['extreme drought and host water stress', 'ponderosa-pine defense', 'western-pine-beetle species and voltinism', 'summer development temperature', 'winter larval survival', 'stand structure and density', 'other bark-beetle species', 'geographic and climatic transferability'],
    boundary: 'This is a modeled, field-evaluated mediator-specific attribution for ponderosa pine and western pine beetle during one severe California drought. It is not a universal warming-to-tree-mortality coefficient, not a direct temperature-only effect, not an estimate for every forest or beetle species, and not interchangeable with the study suggestion that mortality might rise 35-40 percent per degree if separate host-defense and beetle-population effects were additive.'
  }),
  'coal_power_co2_output->carbon_emission': Object.freeze({
    estimand: 'Direct generation-stage greenhouse-gas emissions intensity of commercially available pulverized-coal electricity in the IPCC technology synthesis.',
    estimate: 760,
    lower_bound: 670,
    upper_bound: 870,
    uncertainty_interval: 'IPCC Annex III reported minimum, median and maximum across the assessed technology literature; not a statistical confidence interval',
    unit: 'grams CO2-equivalent direct emissions per kilowatt-hour of pulverized-coal electricity',
    exposure_metric: 'Electricity generated by a commercially available pulverized-coal plant',
    exposure_unit: 'kilowatt-hour generated',
    source_id: 'ipcc_ar5_wg3_annex_iii_electricity_emissions',
    outcome_metric: 'Direct power-plant greenhouse-gas emissions',
    outcome_unit: 'grams CO2-equivalent per kilowatt-hour',
    geography: 'technology literature synthesized globally by IPCC; not a balancing-area or plant-specific rate',
    period: 'commercially available technology literature assessed for IPCC AR5',
    evidence_design: 'ipcc_authoritative_harmonized_literature_synthesis_of_electricity_supply_technology_emissions',
    source_locator: {
      url: 'https://www.ipcc.ch/site/assets/uploads/2018/02/ipcc_wg3_ar5_annex-iii.pdf',
      section: 'Table A.III.2, Coal - Pulverized Coal row: direct emissions minimum 670, median 760 and maximum 870 gCO2eq per kWh; lifecycle emissions are separately reported as 740, 820 and 910'
    },
    moderators: ['plant thermal efficiency', 'coal rank and carbon content', 'load factor and cycling', 'plant age and pollution controls', 'ambient conditions', 'system boundary', 'upstream methane excluded from the direct row', 'carbon capture not represented in this row'],
    boundary: 'This is the direct generation-stage intensity for commercially available pulverized coal, not a plant-specific measurement, system-wide effect of coal dependence, or lifecycle coefficient. Mining methane, transport, infrastructure, dispatch displacement and carbon capture require separate accounting.'
  }),
  'rice_paddy_methane_bubbles->methane': Object.freeze({
    estimand: 'Default daily methane emission factor for continuously flooded rice cultivation with less than 180 days of pre-season flooding and no organic amendments.',
    estimate: 1.19,
    lower_bound: 0.8,
    upper_bound: 1.76,
    uncertainty_interval: 'IPCC 2019 Refinement Table 5.11 source-reported 95 percent confidence interval from the updated statistical-model database',
    unit: 'kilograms CH4 per hectare per day during rice cultivation',
    exposure_metric: 'Continuously flooded rice field under the IPCC Tier 1 baseline management boundary',
    exposure_unit: 'one hectare-day of rice cultivation',
    source_id: 'ipcc_2019_refinement_volume_4_chapter_5_cropland',
    outcome_metric: 'Daily field methane emissions from rice cultivation',
    outcome_unit: 'kilograms CH4 per hectare per day',
    geography: 'global Tier 1 default; regional defaults are reported separately by IPCC',
    period: 'cultivation period under the source-defined baseline water and organic-amendment conditions',
    evidence_design: 'ipcc_inventory_guideline_statistical_model_of_updated_rice_field_emission_factor_database',
    source_locator: {
      url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch05_Cropland.pdf',
      section: 'Section 5.5 and Table 5.11, page 5.53: global baseline factor 1.19 kg CH4 ha-1 day-1 with 0.80-1.76 95 percent confidence interval'
    },
    moderators: ['water regime during cultivation', 'pre-season flooding duration', 'organic-amendment type and amount', 'soil type', 'rice cultivar', 'climate region', 'cultivation period', 'measurement and inventory tier'],
    boundary: 'This is a Tier 1 baseline emission factor for a precisely defined field-management condition, not total annual rice emissions, a bubble-only flux measurement, a universal field value, or the marginal effect of flooding. IPCC requires water-regime, pre-season, amendment and regional scaling factors where applicable.'
  }),
  'industry_farming->methane': Object.freeze({
    estimand: 'Global annual farm-gate methane emissions from crop and livestock activities during the IPCC assessment period.',
    estimate: 142,
    lower_bound: 100,
    upper_bound: 184,
    uncertainty_interval: 'IPCC source-reported central estimate plus or minus 42 Mt CH4 per year; retained as 100-184 Mt CH4 per year and not relabelled as a confidence interval',
    unit: 'million tonnes CH4 per year from global crop and livestock activities within the farm gate',
    exposure_metric: 'Global crop and livestock production activities within the farm-gate accounting boundary',
    exposure_unit: 'assessed global production system over 2007-2016 rather than a one-unit intervention contrast',
    source_id: 'ipcc_srccl_chapter_5_food_security',
    outcome_metric: 'Methane emissions from crop and livestock activities',
    outcome_unit: 'million tonnes CH4 per year',
    geography: 'global farm-gate crop and livestock activities',
    period: 'mean annual emissions during 2007-2016',
    evidence_design: 'ipcc_authoritative_inventory_synthesis_using_faostat_and_us_epa_estimates',
    source_locator: {
      url: 'https://www.ipcc.ch/srccl/chapter/chapter-5/',
      section: 'Section 5.4.2 and Table 5.4 discussion: crop and livestock farm-gate methane emissions 142 plus or minus 42 Mt CH4 per year during 2007-2016'
    },
    moderators: ['livestock population and species', 'enteric-fermentation intensity', 'manure management', 'rice cultivation', 'production-system boundary', 'inventory emission factors', 'country reporting and model estimates', 'global-warming-potential choice when expressed as CO2-equivalent'],
    boundary: 'This is an assessed global annual source contribution, not a per-animal coefficient, marginal effect of industrialization, complete food-system footprint, fossil methane estimate, or causal response to one management change. It excludes post-farm-gate emissions and must remain in mass CH4 unless the declared GWP convention is retained.'
  }),
  'deforestation->carbon_emission': Object.freeze({
    estimand: 'Annual global carbon emissions attributed to tropical deforestation and forest degradation across the literature synthesized by the IPCC land assessment.',
    estimate: 2,
    lower_bound: 0.5,
    upper_bound: 3.5,
    uncertainty_interval: 'Source-reported literature range; 2.0 GtC per year is only the arithmetic midpoint retained for registry summarization',
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    unit: 'gigatonnes carbon per year from tropical deforestation and forest degradation',
    exposure_metric: 'Tropical deforestation and forest degradation represented in the underlying land-carbon estimates',
    exposure_unit: 'annual global process contribution rather than hectares cleared or a marginal intervention',
    source_id: 'ipcc_srccl_chapter_4_land_degradation',
    outcome_metric: 'Carbon transferred to the atmosphere from tropical deforestation and forest degradation',
    outcome_unit: 'gigatonnes carbon per year',
    geography: 'global tropical forests represented in the assessed literature',
    period: 'annual estimates synthesized in the 2019 IPCC Special Report; underlying study periods and methods vary',
    evidence_design: 'ipcc_authoritative_synthesis_of_bookkeeping_remote_sensing_and_land_carbon_estimates',
    source_locator: {
      url: 'https://www.ipcc.ch/srccl/chapter/chapter-4/',
      section: 'Section 4.4.3: annual emissions estimates from tropical deforestation and forest degradation range from 0.5 to 3.5 GtC per year'
    },
    moderators: ['forest carbon density', 'deforestation versus degradation definition', 'peat and soil-carbon inclusion', 'post-clearance land use', 'fire', 'regrowth and legacy fluxes', 'remote-sensing coverage', 'bookkeeping-model method'],
    boundary: 'The IPCC reports a wide literature range rather than a best estimate; the midpoint is not source-reported. This is not a per-hectare emission factor, not net AFOLU emissions, not all forest loss, and not a current-year inventory. Carbon units must not be silently relabelled as carbon dioxide; conversion requires an explicit 44/12 factor.'
  }),
  'peatland_degradations->carbon_emission': Object.freeze({
    estimand: 'IPCC Tier 1 annual on-site carbon-dioxide carbon emission factor for long-term drained tropical forest land and cleared forest land on organic soil.',
    estimate: 5.3,
    lower_bound: -0.7,
    upper_bound: 9.5,
    uncertainty_interval: 'IPCC Table 2.1 source-reported 95 percent confidence interval. The lower bound is mathematically negative from propagated uncertainty; IPCC states that every underlying CO2 flux was positive.',
    unit: 'tonnes CO2-C per hectare per year from drained tropical forest land and cleared forest land organic soil',
    exposure_metric: 'Long-term drained tropical organic soil under forest land or cleared forest land, stratified according to the IPCC land-use and climate definition',
    exposure_unit: 'one hectare-year of matching drained tropical organic soil',
    source_id: 'ipcc_2013_wetlands_supplement_chapter_2',
    outcome_metric: 'Annual on-site soil carbon emitted as carbon dioxide carbon, excluding separately accounted fire, dissolved organic carbon, biomass and non-CO2 terms',
    outcome_unit: 'tonnes CO2-C per hectare per year',
    geography: 'IPCC tropical climate-domain default for drained forest and cleared forest organic soils; underlying studies include tropical peat systems and are not a global unstratified average',
    period: 'Long-term drained land represented by source studies; tropical Tier 1 factors use land drained for more than six years and do not capture the initial transition after drainage.',
    evidence_design: 'ipcc_authoritative_inventory_synthesis_of_flux_and_subsidence_measurements',
    source_locator: {
      url: 'https://www.ipcc-nggip.iges.or.jp/public/wetlands/pdf/Wetlands_separate_files/WS_Chp2_Drained_Inland_Organic_Soils.pdf',
      section: 'Chapter 2 Section 2.2.1.1 and Table 2.1, pages 2.9-2.14: drained tropical forest and cleared forest factor 5.3 tonnes CO2-C ha-1 yr-1, 95 percent CI -0.7 to 9.5, 21 sites; transition and stratification limitations in preceding text and table notes'
    },
    moderators: ['land-use category', 'climate domain', 'water-table depth and drainage class', 'peat nutrient status', 'time since drainage', 'management intensity', 'peat type and depth', 'fire and dissolved-carbon losses accounted separately'],
    boundary: 'This is one IPCC Tier 1 stratum, not a universal peatland-degradation coefficient, total ecosystem greenhouse-gas balance, carbon-dioxide mass, fire factor or estimate for undrained or rewetted peat. Conversion from CO2-C to CO2 requires an explicit 44/12 multiplier, and activity area must match the source stratum.'
  }),
  'gas_power_dependence->carbon_emission': Object.freeze({
    estimand: 'Direct generation-stage emissions intensity of commercially available natural-gas combined-cycle electricity in the IPCC technology synthesis.',
    estimate: 370,
    lower_bound: 350,
    upper_bound: 490,
    uncertainty_interval: 'IPCC Annex III reported minimum, median, and maximum across the assessed technology literature; not a statistical confidence interval',
    unit: 'grams CO2-equivalent direct emissions per kilowatt-hour of natural-gas combined-cycle electricity',
    exposure_metric: 'Electricity generated by a commercially available natural-gas combined-cycle plant',
    exposure_unit: 'kilowatt-hour generated',
    source_id: 'ipcc_ar5_wg3_annex_iii_electricity_emissions',
    outcome_metric: 'Direct power-plant greenhouse-gas emissions',
    outcome_unit: 'grams CO2-equivalent per kilowatt-hour',
    geography: 'technology literature synthesized globally by IPCC; not a balancing-area or plant-specific rate',
    period: 'commercially available technology literature assessed for IPCC AR5',
    evidence_design: 'ipcc_authoritative_harmonized_literature_synthesis_of_electricity_supply_technology_emissions',
    source_locator: {
      url: 'https://www.ipcc.ch/site/assets/uploads/2018/02/ipcc_wg3_ar5_annex-iii.pdf',
      section: 'Table A.III.2, Gas - Combined Cycle row: direct emissions minimum 350, median 370, maximum 490 gCO2eq per kWh; lifecycle emissions are separately reported as 410, 490, and 650'
    },
    moderators: ['plant thermal efficiency', 'load factor and cycling', 'fuel carbon content', 'plant age and technology', 'ambient conditions', 'system boundary', 'upstream methane excluded from the direct row', 'carbon capture not represented in this row'],
    boundary: 'This is the direct generation-stage intensity for combined-cycle gas, not a system-wide effect of gas share, not a plant-specific measured rate, and not the lifecycle value. Upstream methane, infrastructure, dispatch displacement, leakage, and the emissions intensity of displaced generation require separate accounting.'
  }),
  'industry_farming->carbon_emission': Object.freeze({
    estimand: 'Global annual farm-gate non-carbon-dioxide greenhouse-gas emissions from crop and livestock activities during the IPCC assessment period.',
    estimate: 6.2,
    lower_bound: 4.8,
    upper_bound: 7.6,
    uncertainty_interval: 'IPCC source-reported central estimate plus or minus 1.4 GtCO2-equivalent per year; retained as 4.8-7.6 GtCO2-equivalent per year and not relabelled as a confidence interval',
    unit: 'gigatonnes CO2-equivalent per year of non-CO2 farm-gate crop and livestock emissions',
    exposure_metric: 'Global crop and livestock activity within the farm-gate accounting boundary',
    exposure_unit: 'assessed global production system during 2007-2016 rather than a one-unit intervention contrast',
    source_id: 'ipcc_srccl_chapter_5_food_security',
    outcome_metric: 'Farm-gate methane and nitrous-oxide emissions expressed as carbon-dioxide equivalent',
    outcome_unit: 'gigatonnes CO2-equivalent per year',
    geography: 'global crop and livestock activities within the farm gate',
    period: 'mean annual emissions during 2007-2016',
    evidence_design: 'ipcc_authoritative_inventory_synthesis_using_faostat_and_us_epa_estimates',
    source_locator: {
      url: 'https://www.ipcc.ch/srccl/chapter/chapter-5/',
      section: 'Section 5.4.2: global agricultural non-CO2 emissions from crop and livestock activities within the farm gate were 6.2 plus or minus 1.4 GtCO2-equivalent per year during 2007-2016'
    },
    moderators: ['livestock population and species', 'rice area and water regime', 'fertilizer and manure inputs', 'inventory emission factors', 'production-system boundary', 'global-warming-potential convention', 'country reporting and model estimates'],
    boundary: 'This is a global annual farm-gate non-CO2 source contribution, not a marginal effect of industrialization, a fossil or industrial-process CO2 estimate, a complete food-system footprint, or a per-unit production coefficient. Methane and nitrous oxide are aggregated using the assessment global-warming-potential convention; the value must not be relabelled as mass CO2.'
  }),
  'shipping->carbon_emission': Object.freeze({
    estimand: 'Annual carbon-dioxide emissions from total shipping under the Fourth IMO Greenhouse Gas Study inventory boundary.',
    estimate: 1056,
    lower_bound: 962,
    upper_bound: 1056,
    uncertainty_interval: 'Source-reported observed 2012-to-2018 endpoint range, not a statistical uncertainty interval; the source reports 962 MtCO2 in 2012 and 1,056 MtCO2 in 2018',
    unit: 'million tonnes CO2 per year from total shipping',
    exposure_metric: 'Total shipping activity covering international, domestic, and fishing vessels under the IMO study boundary',
    exposure_unit: 'annual global shipping system rather than a tonne-mile intervention contrast',
    source_id: 'imo_fourth_greenhouse_gas_study_2020',
    outcome_metric: 'Annual carbon-dioxide emissions from total shipping',
    outcome_unit: 'million tonnes CO2 per year',
    geography: 'global total shipping; international voyage-based shipping is reported separately as 740 MtCO2 in 2018',
    period: '2018 estimate with the 2012 inventory endpoint retained as the reported comparison',
    evidence_design: 'authoritative_global_shipping_emissions_inventory',
    source_locator: {
      url: 'https://www.imo.org/en/ourwork/environment/pages/decarbonization%20of%20shipping.aspx',
      section: 'Fourth IMO GHG Study 2020 inventory summary: total shipping emitted 1,056 million tonnes CO2 in 2018 versus 962 million tonnes in 2012; 2018 represented 2.89 percent of global anthropogenic CO2 emissions'
    },
    moderators: ['voyage-based versus vessel-based allocation', 'international versus domestic and fishing scope', 'fuel consumption and carbon factors', 'fleet activity', 'ship efficiency', 'cargo and distance', 'inventory method revisions'],
    boundary: 'The 962-1,056 span is an observed two-year endpoint range, not an uncertainty interval. The 1,056 MtCO2 estimate covers total shipping and must not be substituted for the separately reported 740 MtCO2 voyage-based international-shipping value. This is a sector inventory contribution, not emissions per tonne-mile or the marginal effect of one additional voyage.'
  }),
  'marine_heatwaves->tropical_cyclone_rapid_intensification': Object.freeze({
    estimand: 'Ratio of the conditional probability of tropical-cyclone rapid intensification with versus without a qualifying marine heatwave in the Gulf of Mexico and northwestern Caribbean Sea.',
    estimate: 1.5,
    lower_bound: 1.5,
    upper_bound: 5,
    uncertainty_interval: 'Source-reported average-to-maximum spatial multiplication span across identified hotspot regions; not a statistical confidence interval',
    unit: 'fold change in rapid-intensification likelihood during qualifying marine heatwaves versus their absence',
    exposure_metric: 'Marine heatwave within 10 days and 125 miles of rapid-intensification onset, defined using at least five days above a seasonally varying 80th-percentile SST threshold',
    exposure_unit: 'binary qualifying marine-heatwave condition',
    source_id: 'communications_earth_environment_radfar_2024',
    outcome_metric: 'Conditional probability of a source-defined rapid-intensification event',
    outcome_unit: 'probability ratio with versus without marine-heatwave exposure',
    geography: 'Gulf of Mexico and northwestern Caribbean Sea',
    period: '1950-2022 IBTrACS tropical-cyclone records paired with ERA5 sea-surface temperature',
    evidence_design: 'regional_observational_conditional_probability_analysis_with_gridded_significance_screening',
    source_locator: {
      url: 'https://www.nature.com/articles/s43247-024-01578-2',
      section: 'Abstract; Results Figures 7-8; Discussion; Methods: RI likelihood was on average 1.5-fold and up to 5-fold higher in identified hotspot regions during qualifying marine heatwaves; 75 unique cyclones had a heatwave within the impact area'
    },
    moderators: ['vertical wind shear', 'mid-level humidity', 'storm structure and initial intensity', 'translation speed and direction', 'upper-ocean heat content and mixed-layer depth', 'marine-heatwave definition and baseline', 'spatial and temporal matching thresholds', 'SST product uncertainty'],
    boundary: 'This is a regional observational conditional-probability ratio, not a randomized causal effect, global coefficient, storm-intensity increase, or per-degree response. The 1.5-to-5 span is average-to-maximum spatial heterogeneity rather than a confidence interval; marine heatwaves are neither necessary nor sufficient and several atmospheric and storm-scale controls were not included.'
  }),
  'marine_heatwaves->marine_food_web_simplification': Object.freeze({
    estimand: 'Modeled percentage difference in total marine food-web biomass attributable to retaining versus filtering marine-heatwave temperature anomalies during the 2013-2016 northeastern Pacific event.',
    estimate: -8.7,
    lower_bound: -9.7,
    upper_bound: -7.7,
    uncertainty_interval: 'Source-reported estimate plus or minus 1.0 percentage point standard error; bounds are the estimate plus or minus one standard error and are not a 95 percent confidence interval',
    unit: 'percent change in modeled total food-web biomass attributable to marine-heatwave conditions',
    exposure_metric: 'Daily sea-surface-temperature series retaining source-defined marine heatwaves during the warmest month, contrasted with a matched series in which marine-heatwave anomalies are filtered out',
    exposure_unit: 'with-versus-without modeled marine-heatwave scenario',
    source_id: 'biogeosciences_ecotroph_dyn_mhw_2025',
    outcome_metric: 'Total modeled biomass across trophic levels in affected northeastern Pacific biogeochemical provinces',
    outcome_unit: 'percent difference in biomass relative to the no-marine-heatwave simulation',
    geography: 'northeastern Pacific Ocean biogeochemical provinces affected by the 2013-2016 marine heatwave',
    period: '2013-2016 event within the 1998-2021 satellite-forced hindcast',
    evidence_design: 'satellite_forced_dynamic_trophic_ecosystem_model_with_counterfactual_marine_heatwave_filtering',
    source_locator: {
      url: 'https://bg.copernicus.org/articles/22/6583/2025/',
      section: 'Abstract; Results Figures 8-9; Discussion and limitations: modeled northeastern Pacific marine-heatwave-attributable biomass decline 8.7 percent plus or minus 1.0 standard error during 2013-2016, with trophic-level and recovery differences'
    },
    moderators: ['marine-heatwave intensity and duration', 'biogeochemical province', 'trophic level', 'net primary production series and algorithm', 'ecosystem transfer efficiency', 'model resistance parameter', 'background fishing and disturbance', 'recovery horizon'],
    boundary: 'This is a model-derived regional event contrast, not an observed whole-ocean biomass census, universal causal coefficient, per-degree response, species-level effect or permanent collapse estimate. The plus-or-minus value is one standard error, not a 95 percent interval. EcoTroph-Dyn aggregates species by trophic level, uses an assumed resistance parameter and does not separately simulate marine-heatwave effects on net primary production.'
  }),
  'temp->carbon_emission': Object.freeze({
    estimand: 'Cumulative carbon released from thawing terrestrial permafrost by 2100 per degree Celsius of global warming in the IPCC model ensemble.',
    estimate: 22,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    lower_bound: 3,
    upper_bound: 41,
    uncertainty_interval: 'IPCC source-reported 5th-to-95th-percentile model range; 22 PgC per degree Celsius is only the arithmetic midpoint retained for registry summarization',
    unit: 'petagrams carbon released from terrestrial permafrost by 2100 per 1 degree Celsius global warming',
    exposure_metric: 'Global mean surface warming relative to the model baseline',
    exposure_unit: 'degrees Celsius',
    source_id: 'ipcc_ar6_wg1_chapter_5_permafrost_carbon_feedback',
    outcome_metric: 'Cumulative carbon release from thawing terrestrial permafrost',
    outcome_unit: 'petagrams carbon by 2100',
    geography: 'terrestrial permafrost regions represented by the assessed model ensemble',
    period: 'projected cumulative release through 2100',
    evidence_design: 'ipcc_authoritative_assessment_of_multi_model_permafrost_carbon_feedback',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/',
      section: 'Executive Summary and Section 5.4.9/Figure 5.29: terrestrial permafrost CO2 release projected at 3-41 PgC per 1 degree Celsius global warming by 2100; low confidence in magnitude, gas partition and linearity'
    },
    moderators: ['gradual versus abrupt thaw', 'below-ground combustion and wildfire', 'soil-carbon inventory', 'soil moisture and oxygen state', 'microbial decomposition', 'CO2 versus CH4 partition', 'warming pathway and overshoot', 'model process representation'],
    boundary: 'This estimate covers cumulative terrestrial-permafrost carbon release only. It is not total natural carbon-cycle feedback, annual emissions, anthropogenic emissions, a universal linear coefficient, or mass CO2. Abrupt thaw, fire and other under-represented processes can increase the response, and IPCC assigns low confidence to magnitude and linearity. The 22 PgC point is a transparent midpoint, not a source-reported best estimate.'
  }),
  'solar_radiation_trapping->temp': Object.freeze({
    estimand: 'Long-term equilibrium global surface warming after atmospheric carbon dioxide doubles above its pre-industrial concentration.',
    estimate: 3,
    lower_bound: 2.5,
    upper_bound: 4,
    uncertainty_interval: 'IPCC assessed likely range for equilibrium climate sensitivity',
    unit: 'degrees Celsius equilibrium global surface warming per doubling of atmospheric CO2',
    exposure_metric: 'Effective radiative forcing caused by a doubling of atmospheric carbon dioxide',
    exposure_unit: 'doubling of atmospheric CO2, assessed forcing 3.93 plus or minus 0.47 watts per square metre',
    source_id: 'ipcc_ar6_wg1_chapter_7_climate_sensitivity',
    outcome_metric: 'Equilibrium global surface air temperature response',
    outcome_unit: 'degrees Celsius',
    geography: 'global mean equilibrium response',
    period: 'long-term equilibrium after a sustained CO2 doubling; not a near-term transient response',
    evidence_design: 'ipcc_multi_line_assessment_combining_process_understanding_instrumental_warming_paleoclimate_and_emergent_constraints',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
      section: 'Section 7.5.5, Table 7.13 and FAQ 7.3: ECS best estimate 3 degrees Celsius, likely range 2.5-4 degrees Celsius, for long-term warming after CO2 doubling; Section 7.3.2.1 assesses forcing from doubled CO2 at 3.93 plus or minus 0.47 W m-2'
    },
    moderators: ['cloud feedback', 'water-vapour and lapse-rate feedback', 'surface-albedo feedback', 'ocean heat uptake', 'climate-state and pattern effects', 'equilibrium versus transient response', 'forcing-agent efficacy'],
    boundary: 'Equilibrium climate sensitivity is the long-term response to sustained CO2 doubling, not warming per calendar year, per tonne emitted, or from an arbitrary mixture of forcing agents. Regional warming and transient-century response differ, and the result must not be used as a local temperature coefficient.'
  }),
  'temp->drought_persistence': Object.freeze({
    estimand: 'Change in the probability of persistent compound dry-warm boreal-summer conditions in eastern North America in a 2 degrees Celsius world relative to present-day climate.',
    estimate: 20,
    lower_bound: 11,
    upper_bound: 42,
    uncertainty_interval: 'Source-reported full multi-model uncertainty range',
    unit: 'percent relative increase in the probability of persistent compound dry-warm summer conditions',
    exposure_metric: 'Global mean warming level above pre-industrial conditions',
    exposure_unit: '2 degrees Celsius warming level compared with present-day climate; the study also evaluates 1.5 degrees Celsius',
    source_id: 'nature_climate_change_pfleiderer_2019_summer_weather_persistence',
    outcome_metric: 'Probability of source-defined persistent compound dry-warm boreal-summer conditions',
    outcome_unit: 'percent relative probability change',
    geography: 'Eastern North America within the study Northern Hemisphere mid-latitude land domain',
    period: 'HAPPI 2 degrees Celsius stabilized-climate experiment compared with the 2006-2015 present-day reference climate; boreal summer',
    evidence_design: 'multi_model_happi_stabilized_warming_level_projection_with_dynamical_diagnostics',
    source_locator: {
      url: 'https://doi.org/10.1038/s41558-019-0555-0',
      section: 'Abstract and Figures 3-5: regional compound dry-warm persistence increase up to 20 percent in eastern North America with an 11-42 percent full uncertainty range in a 2 degrees Celsius world'
    },
    moderators: ['persistence and drought threshold', 'warming-level definition', 'boreal-summer circulation', 'storm-track response', 'soil-moisture feedback', 'regional model response', 'internal variability'],
    boundary: 'This is a scenario-conditioned regional probability response for source-defined compound dry-warm persistence. It is not a universal drought-duration coefficient, not a global mean response, not a per-degree linear estimate, and not a projection of hydrological or socioeconomic drought. The 20 percent value is the reported regional upper response, not the Northern Hemisphere mean.'
  }),
  'temp->snowmelt_timing_shift': Object.freeze({
    estimand: 'Cross-catchment sensitivity of annual maximum snowmelt-flood timing to annual mean air-temperature change in snow-affected, minimally impaired Northern Hemisphere catchments.',
    estimate: -4.7,
    lower_bound: -9.7,
    upper_bound: 0.3,
    uncertainty_interval: 'Source-reported mean plus or minus one cross-catchment standard deviation; the bounds are a heterogeneity range, not a confidence interval',
    unit: 'days change in annual maximum snowmelt-flood peak date per 1 degree Celsius increase in catchment annual mean air temperature',
    exposure_metric: 'Catchment annual mean near-surface air temperature',
    exposure_unit: 'degrees Celsius',
    source_id: 'nature_communications_liu_2025_snowmelt_flood_timing',
    outcome_metric: 'Day of year of the annual maximum process-classified snowmelt flood peak',
    outcome_unit: 'days change in peak date; negative values indicate earlier timing',
    geography: '2,339 snow-affected, minimally impaired catchments across the Northern Hemisphere',
    period: '1950-2020 annual water-year observations, with at least 30 continuous years per catchment',
    evidence_design: 'multi_catchment_observational_sensitivity_analysis_with_process_based_flood_classification',
    source_locator: {
      url: 'https://doi.org/10.1038/s41467-025-58832-0',
      section: 'Results, Figure 2 and Discussion: mean sensitivity of -4.7 days per 1 degree Celsius with a 5.0-day cross-catchment standard deviation across 2,339 catchments; about 30 percent of catchments shifted later'
    },
    moderators: ['catchment mean annual temperature', 'onset of seasonal warming', 'maximum snow-water equivalent', 'snowmelt rate', 'snowfall fraction', 'elevation and latitude', 'flood-classification threshold', 'ERA5-Land forcing uncertainty'],
    boundary: 'This is an observational cross-catchment association for the date of the annual maximum process-classified snowmelt flood. It is not a global-mean-temperature coefficient, not a causal intervention estimate, not the timing of all runoff, not a flood-magnitude response, and not evidence that every catchment shifts earlier. The reported standard deviation captures strong spatial heterogeneity and allows later timing within the stated range.'
  }),
  'temp->soil_moisture_collapse': Object.freeze({
    estimand: 'Projected change in the European land area under soil-moisture drought at 3 degrees Celsius global mean warming compared with 1.5 degrees Celsius warming.',
    estimate: 40,
    lower_bound: 16,
    upper_bound: 64,
    uncertainty_interval: 'Source-reported plus-or-minus 24 percentage-point model-ensemble spread; the accessible source does not identify this spread as a confidence interval',
    unit: 'percent relative increase in European soil-moisture drought area at 3 degrees Celsius versus 1.5 degrees Celsius global warming',
    exposure_metric: 'Global mean temperature warming level above pre-industrial conditions',
    exposure_unit: '3 degrees Celsius warming compared with 1.5 degrees Celsius warming',
    source_id: 'nature_climate_change_samaniego_2018_european_soil_moisture_drought',
    outcome_metric: 'European land area under source-defined soil-moisture drought',
    outcome_unit: 'percent relative change in drought-affected area',
    geography: 'Europe, with Atlantic, Continental, Boreal, Mediterranean, Alpine North and Alpine South regions evaluated separately',
    period: 'Warming-level climate samples evaluated relative to the 1971-2000 reference period',
    evidence_design: 'multi_model_hydrological_and_land_surface_projection_forced_by_bias_corrected_downscaled_general_circulation_models',
    source_locator: {
      url: 'https://doi.org/10.1038/s41558-018-0138-5',
      section: 'Abstract and Figures 1-3: 3 degrees Celsius warming versus 1.5 degrees Celsius increases European soil-moisture drought area by 40 percent plus or minus 24 percent'
    },
    moderators: ['regional precipitation response', 'hydrological and land-surface model structure', 'bias-corrected GCM forcing', 'soil layer and drought definition', 'season', 'evapotranspiration formulation', 'vegetation and carbon-dioxide response', 'water withdrawals and land management'],
    boundary: 'This is a scenario-conditioned European model-ensemble contrast between two global warming levels. It is not a per-degree linear coefficient, an observed global effect, a prediction for every European grid cell, a groundwater-depletion estimate, or a measure of socioeconomic water scarcity. The reported plus-or-minus spread is retained without upgrading it to a confidence interval.'
  }),
  'temp->arctic_amplification_rates': Object.freeze({
    estimand: 'Observed ratio of Arctic-circle annual-mean near-surface warming to global annual-mean warming over the satellite era.',
    estimate: 3.8,
    lower_bound: 3.7,
    upper_bound: 4.1,
    uncertainty_interval: 'Source-reported range across four observational and reanalysis datasets; not a confidence interval',
    unit: 'ratio of Arctic warming trend to global warming trend',
    exposure_metric: 'Global annual-mean near-surface temperature trend',
    exposure_unit: 'degrees Celsius per decade',
    source_id: 'communications_earth_and_environment_rantanen_2022_arctic_amplification',
    outcome_metric: 'Arctic-circle annual-mean near-surface temperature trend relative to the global trend',
    outcome_unit: 'unitless amplification ratio',
    geography: 'Arctic Circle, 66.5-90 degrees North, relative to the globe',
    period: '1979-2021 annual means',
    evidence_design: 'multi_dataset_observational_and_reanalysis_trend_comparison_with_station_validation',
    source_locator: {
      url: 'https://doi.org/10.1038/s43247-022-00498-3',
      section: 'Results, Table 1 and Discussion: multi-dataset Arctic trend 0.73 degrees Celsius per decade, global trend 0.19 degrees Celsius per decade, amplification ratio 3.8, individual-dataset ratios 3.7-4.1 over 1979-2021'
    },
    moderators: ['Arctic southern boundary', 'trend start and end year', 'season', 'sea-ice loss', 'internal variability', 'observational coverage and interpolation', 'dataset choice'],
    boundary: 'This is a bounded observed trend ratio, not a causal coefficient for a local temperature increment, a future projection, or evidence that every Arctic location warms at 3.8 times the global rate. The 3.7-4.1 bounds describe cross-dataset spread, not statistical confidence, and the ratio is sensitive to period and Arctic-domain definition.'
  }),
  'temp->humidity_amplification': Object.freeze({
    estimand: 'Global-mean thermodynamic response of low-altitude specific humidity to surface warming under approximately constant relative humidity.',
    estimate: 7,
    lower_bound: 6.4,
    upper_bound: 9.8,
    uncertainty_interval: 'IPCC-reported cross-forcing range of global precipitable-water response point estimates; individual forcing estimates are 6.4 plus or minus 1.5 and 9.8 plus or minus 3.3 percent per degree Celsius',
    unit: 'percent increase in atmospheric moisture per 1 degree Celsius global-mean surface warming',
    exposure_metric: 'Global-mean surface temperature change',
    exposure_unit: 'degrees Celsius',
    source_id: 'ipcc_ar6_wg1_chapter_8_water_cycle_changes',
    outcome_metric: 'Low-altitude specific humidity and global atmospheric water-vapour content',
    outcome_unit: 'percent relative change',
    geography: 'global mean lower atmosphere; regional and land responses can differ substantially',
    period: 'Thermodynamic relationship assessed from observations and idealized climate-model experiments; not tied to a single historical interval',
    evidence_design: 'ipcc_authoritative_assessment_of_thermodynamics_observations_and_idealized_forcing_experiments',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/',
      section: 'Section 8.2.1 Global Water Cycle Constraints: about 7 percent per degree Celsius low-altitude specific-humidity response under approximately constant global relative humidity; global precipitable-water responses from 6.4 plus or minus 1.5 to 9.8 plus or minus 3.3 percent per degree across forcing experiments'
    },
    moderators: ['relative-humidity response', 'land-ocean warming contrast', 'moisture transport', 'forcing agent', 'circulation and weather regime', 'altitude', 'regional evaporation and soil moisture'],
    boundary: 'The 7 percent value is a global thermodynamic approximation for specific humidity and water-vapour capacity, not a universal local relative-humidity increase, precipitation response, or health-exposure coefficient. The 6.4-9.8 bounds are a cross-forcing range of point estimates rather than a confidence interval.'
  }),
  'wet_bulb_heat->occupational_heat_exposure': Object.freeze({
    estimand: 'Odds of occupational heat strain during or at the end of a work shift under guideline-defined occupational heat stress compared with thermoneutral working conditions.',
    estimate: 4.01,
    lower_bound: 2.45,
    upper_bound: 6.58,
    uncertainty_interval: 'Source-reported 95 percent confidence interval from the random-effects meta-analysis',
    unit: 'odds ratio for occupational heat strain under heat-stress versus thermoneutral work-shift conditions',
    exposure_metric: 'Occupational heat stress defined using international health and safety guidelines and standards',
    exposure_unit: 'heat-stress condition; the review reports WBGT thresholds beyond 22.0 or 24.8 degrees Celsius depending on work intensity',
    source_id: 'lancet_planetary_health_flouris_2018',
    outcome_metric: 'Occupational heat strain during or at the end of a work shift',
    outcome_unit: 'binary heat-strain outcome summarized as an odds ratio',
    geography: 'Nine measured-worker studies with 11,582 workers represented in the pooled odds ratio; the abstract does not enumerate the geography of this subset, while the full review covered 30 countries and more than 40 occupations',
    period: 'Database inception through 5 February 2018; work-shift exposure periods in the included studies',
    evidence_design: 'systematic_review_and_random_effects_meta_analysis_of_measured_occupational_exposure_studies',
    source_locator: {
      url: 'https://doi.org/10.1016/S2542-5196(18)30237-7',
      section: 'Abstract Findings: odds ratio 4.01, 95 percent CI 2.45-6.58, nine studies and 11,582 workers; Methods: measured heat-strain studies, simulations and statistical-model-only studies excluded'
    },
    moderators: ['work intensity', 'WBGT threshold', 'acclimatization', 'hydration', 'shade and solar load', 'work-rest cycles', 'clothing and personal protective equipment', 'self-pacing', 'worker health and age', 'indoor versus outdoor setting'],
    boundary: 'This pooled odds ratio concerns occupational heat strain during or after a shift. It is not a per-degree temperature coefficient, not the percent of work hours lost, not an injury or mortality risk ratio, not proof of individual causation, and not directly interchangeable with the Lancet Countdown modeled potential-work-hour-loss series. The included studies and thresholds were heterogeneous.'
  }),
  'temp->vector_borne_disease_expansion': Object.freeze({
    estimand: 'Association between national annual mean temperature and age-standardised malaria incidence across malaria-affected countries and territories.',
    estimate: 2.01,
    lower_bound: 2,
    upper_bound: 2.02,
    uncertainty_interval: 'Source-reported 95 percent confidence interval',
    unit: 'percent increase in malaria age-standardised incidence rate per 1 degree Celsius increase in national annual average temperature',
    exposure_metric: 'National annual average air temperature',
    exposure_unit: 'degrees Celsius',
    source_id: 'journal_global_health_liu_2024_temperature_malaria',
    outcome_metric: 'Age-standardised malaria incidence rate',
    outcome_unit: 'percent relative change',
    geography: '57 malaria-affected countries and territories represented in the study',
    period: '2000-2019 annual observational panel',
    evidence_design: 'multi_country_observational_quasi_poisson_regression_with_covariate_control',
    source_locator: {
      url: 'https://doi.org/10.7189/jogh.14.04021',
      section: 'Abstract, Results and Discussion: 2.01 percent increase in malaria ASIR per 1 degree Celsius national annual mean temperature increase, 95 percent CI 2.00-2.02'
    },
    moderators: ['baseline thermal suitability', 'precipitation', 'vector-control coverage', 'health-system access', 'land use', 'urbanization', 'malaria parasite and vector species', 'regional subgroup', 'population immunity and socioeconomic conditions'],
    boundary: 'This is an adjusted ecological association for malaria incidence, not experimental causal attribution, range expansion, a universal response for all vector-borne diseases, an individual risk ratio, or evidence that additional warming increases transmission above every local thermal optimum. National annual averages can obscure nonlinear and seasonal responses.'
  }),
  'carbon_emission->nocturnal_heat_stress': Object.freeze({
    estimand: 'Greenhouse-gas-forcing-attributable change in the annual frequency of humid-heat nights across eastern China over the historical study period.',
    estimate: 4.2,
    lower_bound: 1.6,
    upper_bound: 6.9,
    uncertainty_interval: 'Source-reported 90 percent attribution range (5th-95th percentiles)',
    unit: 'days increase in annual humid-heat-night frequency over the 1961-2014 study period',
    exposure_metric: 'CMIP6 historical greenhouse-gas forcing signal separated from other anthropogenic and natural forcing',
    exposure_unit: 'optimal-fingerprint forcing response rather than tonnes of annual emissions',
    source_id: 'earths_future_he_chen_2024_humid_heat_nights',
    outcome_metric: 'Annual frequency of source-defined humid-heat nights',
    outcome_unit: 'days per year',
    geography: 'eastern China study domain',
    period: '1961-2014 historical attribution analysis',
    evidence_design: 'peer_reviewed_cmip6_optimal_fingerprint_detection_and_attribution',
    source_locator: {
      url: 'https://doi.org/10.1029/2023EF004406',
      section: 'Results and Figure 4: greenhouse-gas forcing attributable frequency increase of 4.2 days with a 90 percent range of 1.6-6.9 days'
    },
    moderators: ['humid-heat-night threshold', 'regional humidity', 'urbanization', 'aerosol and other anthropogenic forcing', 'internal variability', 'CMIP6 model response and scaling factor'],
    boundary: 'This is a regional historical forcing-attribution result. It is not a per-tonne emissions coefficient, not a per-degree global-temperature response, not a global estimate, and not a projection of future nighttime heat or person-level health burden.'
  }),
  'nocturnal_heat_stress->public_health_heat_burden': Object.freeze({
    estimand: 'Cumulative odds of an acute stroke admission after extreme nighttime heat compared with a non-hot night during the warm season in the Augsburg study population in 2013-2020.',
    estimate: 1.33,
    lower_bound: 1.18,
    upper_bound: 1.5,
    uncertainty_interval: 'Source-reported 95 percent confidence interval',
    unit: 'odds ratio for all recorded stroke cases at the 97.5th percentile of hot-night excess relative to a non-hot night',
    exposure_metric: 'Hot-night excess, the cumulative hourly nighttime temperature above the study 95th-percentile daily-minimum-temperature threshold',
    exposure_unit: '97.5th percentile of the study hot-night-excess distribution compared with 0 degrees Celsius hot-night excess',
    source_id: 'european_heart_journal_alahmad_2024_nocturnal_heat_stroke',
    outcome_metric: 'Daily hospital-recorded stroke occurrence across all stroke types',
    outcome_unit: 'conditional odds of a stroke admission',
    geography: 'Augsburg region, Germany, served by University Hospital Augsburg',
    period: 'May-October warm seasons, 2013-2020, with cumulative lag response evaluated by the source study',
    evidence_design: 'individual_level_time_stratified_case_crossover_with_distributed_lag_non_linear_model',
    source_locator: {
      url: 'https://doi.org/10.1093/eurheartj/ehae277',
      section: 'Table 3 and Statistical analyses: all-stroke cumulative odds ratio 1.33, 95 percent CI 1.18-1.50, for the 97.5th percentile of hot-night excess in 2013-2020 relative to non-hot nights; models control daily maximum temperature, humidity, pressure and holidays'
    },
    moderators: ['local 14.6 degrees Celsius nighttime threshold', 'hot-night-excess percentile', 'stroke subtype', 'age', 'sex', 'stroke severity', 'acclimatization', 'housing and cooling', 'air pollution', 'lag specification'],
    boundary: 'This is a period-specific acute association in one German hospital catchment, not a global heat-morbidity coefficient, mortality estimate, per-degree temperature response, annual population risk, or proof of individual causation. The source reports materially weaker and non-significant all-stroke association in 2006-2012, and the published abstract reports a different full-period summary estimate; this record therefore uses the explicitly located 2013-2020 Table 3 contrast only.'
  }),
  'antarctic_bottom_water_decline->oceanic_deoxygenation': Object.freeze({
    estimand: 'Basin-mean abyssal oxygen-concentration decline associated with contraction of the Antarctic Bottom Water layer over the full Australian Antarctic Basin observing period.',
    estimate: -3,
    lower_bound: -5,
    upper_bound: -1,
    uncertainty_interval: 'Source-reported estimate plus or minus 2 micromoles per kilogram per decade; retained as the study uncertainty rather than relabelled as a confidence interval',
    unit: 'micromoles of dissolved oxygen per kilogram per decade',
    exposure_metric: 'Contraction of the well-ventilated Antarctic Bottom Water layer associated with reduced bottom-water transport',
    exposure_unit: 'observed basin-mean isopycnal descent and transport change over the study interval',
    source_id: 'nature_climate_change_gunn_2023_antarctic_bottom_water_ventilation',
    outcome_metric: 'Dissolved-oxygen concentration in abyssal Australian Antarctic Basin waters',
    outcome_unit: 'micromoles per kilogram per decade',
    geography: 'Australian Antarctic Basin below approximately 3,500 metres, supplied by Ross Sea Bottom Water and Adelie Land Bottom Water',
    period: '1994-2017 repeat-hydrography observing interval',
    evidence_design: 'repeat_hydrography_and_transport_synthesis_with_basin_volume_and_vertical_oxygen_gradient_attribution',
    source_locator: {
      url: 'https://doi.org/10.1038/s41558-023-01667-8',
      section: 'Abstract, Reduced ventilation of the abyss, Discussion and Methods: 1994-2017 overturning slowdown of -0.8 plus or minus 0.5 Sv per decade, 60 plus or minus 35 metres per decade mean isopycnal descent, and contraction-driven oxygen decline of 3 plus or minus 2 micromoles per kilogram per decade'
    },
    moderators: ['shelf-water salinity and density', 'Ross Sea Bottom Water recovery after 2014', 'Adelie Land Bottom Water export', 'sea-ice formation and brine rejection', 'glacial meltwater', 'wind and transient climate variability', 'basin geometry', 'vertical oxygen gradient'],
    boundary: 'This is a diagnosed basin-scale oxygen response to Antarctic Bottom Water contraction, not a global-ocean deoxygenation rate, a per-degree warming coefficient, or a universal response for every Antarctic basin. The transport-only oxygen trend over 1994-2017 was not significant; the retained estimate is specifically the larger contraction-and-water-mass-replacement pathway reported by the study.'
  }),
  'carbon_emission->solar_radiation_trapping': Object.freeze({
    estimand: 'Contribution of historical primary carbon-dioxide emissions to global mean effective radiative forcing in 2019 relative to 1750.',
    estimate: 2.06,
    lower_bound: 1.81,
    upper_bound: 2.3,
    uncertainty_interval: 'IPCC dataset 5th-95th uncertainty range, calculated from the reported central value 2.0576 W m-2 plus or minus the 95th-minus-50th uncertainty 0.2469 W m-2',
    unit: 'watts per square metre of global mean effective radiative forcing',
    exposure_metric: 'Historical primary carbon-dioxide emissions represented by the IPCC component-emissions experiment',
    exposure_unit: 'cumulative 1750-2019 emissions history rather than a one-year mass increment',
    source_id: 'ipcc_ar6_wgi_ts15_emissions_based_erf_dataset',
    outcome_metric: 'Global mean effective radiative forcing attributed to the carbon-dioxide emissions experiment',
    outcome_unit: 'watts per square metre',
    geography: 'global mean',
    period: '2019 relative to 1750',
    evidence_design: 'ipcc_assessed_emissions_based_effective_radiative_forcing_synthesis',
    source_locator: {
      url: 'https://doi.org/10.5285/1f359da21c4041b4ab0977d05c7d38f0',
      section: 'Figure TS.15 files fig_em_based_ERF_GSAT_period_1750-2019_values_ERF.csv and uncertainty.csv: CO2 emissions experiment central ERF 2.057554 W m-2 and 5th-95th half-range 0.246907 W m-2'
    },
    moderators: ['cumulative emissions history', 'airborne fraction', 'ocean and land carbon uptake', 'radiative efficiency', 'rapid atmospheric adjustments', 'baseline year', 'carbon-cycle uncertainty'],
    boundary: 'This is the forcing contribution of the complete historical primary-CO2 emissions trajectory, not a per-tonne forcing coefficient, annual-emissions response, atmospheric concentration measurement, or local energy flux. It must not be scaled linearly from a single-year inventory value.'
  }),
  'methane->solar_radiation_trapping': Object.freeze({
    estimand: 'Contribution of historical methane emissions to global mean effective radiative forcing in 2019 relative to 1750, including assessed indirect atmospheric effects.',
    estimate: 1.19,
    lower_bound: 0.81,
    upper_bound: 1.58,
    uncertainty_interval: 'IPCC dataset 5th-95th uncertainty range, calculated from the summed methane-emissions-experiment components 1.1945 W m-2 plus or minus 0.3891 W m-2',
    unit: 'watts per square metre of global mean effective radiative forcing',
    exposure_metric: 'Historical methane emissions represented by the IPCC component-emissions experiment',
    exposure_unit: 'cumulative 1750-2019 emissions history rather than one-year megatonnes of methane',
    source_id: 'ipcc_ar6_wgi_ts15_emissions_based_erf_dataset',
    outcome_metric: 'Global mean effective radiative forcing attributed to methane emissions, including methane burden, ozone, stratospheric water vapour, carbon dioxide and aerosol-cloud adjustments',
    outcome_unit: 'watts per square metre',
    geography: 'global mean',
    period: '2019 relative to 1750',
    evidence_design: 'ipcc_assessed_emissions_based_effective_radiative_forcing_synthesis',
    source_locator: {
      url: 'https://doi.org/10.5285/1f359da21c4041b4ab0977d05c7d38f0',
      section: 'Figure TS.15 files fig_em_based_ERF_GSAT_period_1750-2019_values_ERF.csv and uncertainty.csv: sum of the CH4 emissions-experiment CO2, CH4 lifetime, ozone, stratospheric-water-vapour, aerosol and cloud components is 1.194509 W m-2; reported 5th-95th half-range 0.389105 W m-2'
    },
    moderators: ['methane source type', 'methane lifetime', 'hydroxyl-radical chemistry', 'tropospheric ozone', 'stratospheric water vapour', 'fossil methane oxidation to carbon dioxide', 'aerosol and cloud adjustments'],
    boundary: 'This is the forcing contribution of the complete historical methane-emissions trajectory with indirect effects. It is not the concentration-only methane forcing, a GWP value, a per-tonne coefficient, a one-year inventory response, or a local forcing estimate.'
  }),
  'nitrous_oxide->solar_radiation_trapping': Object.freeze({
    estimand: 'Contribution of historical nitrous-oxide emissions to global mean effective radiative forcing in 2019 relative to 1750, including assessed atmospheric adjustments.',
    estimate: 0.24,
    lower_bound: 0.14,
    upper_bound: 0.34,
    uncertainty_interval: 'IPCC dataset 5th-95th uncertainty range, calculated from the summed nitrous-oxide-emissions-experiment components 0.2406 W m-2 plus or minus 0.1016 W m-2',
    unit: 'watts per square metre of global mean effective radiative forcing',
    exposure_metric: 'Historical nitrous-oxide emissions represented by the IPCC component-emissions experiment',
    exposure_unit: 'cumulative 1750-2019 emissions history rather than one-year megatonnes of nitrous oxide',
    source_id: 'ipcc_ar6_wgi_ts15_emissions_based_erf_dataset',
    outcome_metric: 'Global mean effective radiative forcing attributed to nitrous-oxide emissions, including methane-lifetime, ozone, aerosol and cloud adjustments',
    outcome_unit: 'watts per square metre',
    geography: 'global mean',
    period: '2019 relative to 1750',
    evidence_design: 'ipcc_assessed_emissions_based_effective_radiative_forcing_synthesis',
    source_locator: {
      url: 'https://doi.org/10.5285/1f359da21c4041b4ab0977d05c7d38f0',
      section: 'Figure TS.15 files fig_em_based_ERF_GSAT_period_1750-2019_values_ERF.csv and uncertainty.csv: sum of the N2O emissions-experiment N2O, methane-lifetime, ozone, aerosol and cloud components is 0.240569 W m-2; reported 5th-95th half-range 0.101555 W m-2'
    },
    moderators: ['nitrous-oxide atmospheric lifetime', 'stratospheric chemistry', 'methane-lifetime interaction', 'ozone adjustment', 'aerosol and cloud adjustment', 'radiative efficiency', 'baseline year'],
    boundary: 'This is the forcing contribution of the complete historical nitrous-oxide-emissions trajectory with assessed adjustments. It is not a GWP value, per-tonne coefficient, fertilizer-specific effect, one-year inventory response, concentration-only forcing, or local energy flux.'
  }),
  'aviation_condensation_trails->cloud_albedo_shift': Object.freeze({
    estimand: 'Global net effective radiative forcing from aviation contrail cirrus in 2018.',
    estimate: 57.4,
    lower_bound: 17,
    upper_bound: 98,
    uncertainty_interval: 'Source-reported 5th-95th percentile likelihood range',
    unit: 'milliwatts per square metre of global net effective radiative forcing',
    exposure_metric: 'Aviation contrail-cirrus cloud perturbation from the historical flight fleet',
    exposure_unit: 'global 2018 aviation activity and atmosphere represented by the source synthesis',
    source_id: 'atmospheric_environment_lee_2021_aviation_climate_forcing',
    outcome_metric: 'Net global effective radiative forcing from contrail cirrus',
    outcome_unit: 'milliwatts per square metre',
    geography: 'global mean, with forcing concentrated along ice-supersaturated flight corridors',
    period: 'calendar year 2018',
    evidence_design: 'peer_reviewed_global_aviation_emissions_and_cloud_forcing_synthesis',
    source_locator: {
      url: 'https://doi.org/10.1016/j.atmosenv.2020.117834',
      section: '2018 effective-radiative-forcing synthesis and uncertainty table: contrail-cirrus ERF 57.4 mW m-2 with 5th-95th likelihood range 17-98 mW m-2'
    },
    moderators: ['ice-supersaturated-region occurrence', 'flight altitude and routing', 'time of day', 'background cirrus and cloud overlap', 'contrail optical depth and lifetime', 'aircraft soot emissions', 'meteorological year', 'radiative efficacy'],
    boundary: 'This is a global 2018 net forcing estimate for contrail cirrus, not a local cloud-albedo coefficient, forcing per flight, forcing per kilometre, carbon-dioxide effect, or temperature response. Shortwave cooling and longwave warming are combined in the reported net ERF, and the wide interval reflects substantial cloud and meteorological uncertainty.'
  }),
  'agricultural_nitrogen_application->nitrous_oxide': Object.freeze({
    estimand: 'IPCC Tier 1 direct managed-soil nitrous-oxide emission factor for nitrogen added through synthetic fertilizer, organic amendments and crop residues, plus nitrogen mineralized after soil-carbon loss.',
    estimate: 0.01,
    lower_bound: 0.002,
    upper_bound: 0.018,
    uncertainty_interval: 'IPCC 2019 Refinement Table 11.1 corrected default uncertainty range',
    unit: 'kilograms N2O-N emitted per kilogram nitrogen input',
    exposure_metric: 'Nitrogen input to managed soil within the IPCC EF1 accounting boundary',
    exposure_unit: 'kilograms nitrogen applied or mineralized',
    source_id: 'ipcc_2019_refinement_managed_soils_n2o_ef1',
    outcome_metric: 'Direct soil nitrous-oxide nitrogen emission',
    outcome_unit: 'kilograms N2O-N; multiply by 44/28 only when converting N2O-N to total N2O mass',
    geography: 'Tier 1 global default for managed soils; disaggregated wet- and dry-climate factors should replace it where applicable data exist',
    period: 'annual national-inventory accounting period applied to nitrogen inputs during that reporting year',
    evidence_design: 'ipcc_inventory_guideline_meta_analysis_and_expert_assessment_default_emission_factor',
    source_locator: {
      url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch11_Soils_N2O_CO2.pdf',
      section: 'Table 11.1 updated and Fourth Corrigenda: aggregated EF1 default 0.010 kg N2O-N per kg N input, corrected uncertainty range 0.002-0.018; wet synthetic fertilizer, other wet inputs and dry-climate factors are separately reported'
    },
    moderators: ['wet versus dry climate', 'synthetic versus organic nitrogen', 'soil moisture and temperature', 'fertilizer form and placement', 'application timing', 'crop uptake', 'soil carbon', 'nitrification inhibitors', 'irrigation and drainage'],
    boundary: 'This is an inventory default emission factor, not a universal measured farm response or atmospheric-concentration coefficient. It estimates direct managed-soil N2O-N; indirect volatilization, deposition, leaching and runoff emissions are separate, and site-specific Tier 2 or Tier 3 factors should replace the aggregate default when defensible.'
  }),
  'nitrous_oxide->temp': Object.freeze({
    estimand: 'Contribution of historical nitrous-oxide emissions to global surface-air-temperature warming in 2010-2019 relative to 1850-1900.',
    estimate: 0.09,
    lower_bound: 0.05,
    upper_bound: 0.16,
    uncertainty_interval: 'IPCC assessed very likely range (5th-95th percentiles)',
    unit: 'degrees Celsius contribution to 2010-2019 global surface-air-temperature warming relative to 1850-1900',
    exposure_metric: 'Historical global nitrous-oxide emissions, including their assessed effects on other climate drivers',
    exposure_unit: 'emissions history rather than a one-year mass or concentration contrast',
    outcome_metric: 'Nitrous-oxide-emissions contribution to global surface air temperature change',
    outcome_unit: 'degrees Celsius',
    geography: 'global',
    period: '2010-2019 relative to 1850-1900',
    evidence_design: 'ipcc_authoritative_radiative_forcing_and_climate_sensitivity_assessment',
    source_locator: {
      url: 'https://catalogue.ceda.ac.uk/uuid/c1eb6dad1598427f8f9f3eae346ece2f/',
      section: 'IPCC AR6 WGI Figure SPM.2 panel c dataset, SPM2c_data.csv, Nitrous oxide (N2O) row: total GSAT effect 0.091730576 degrees Celsius; 5th-95th very-likely limits 0.045556739-0.155208999 degrees Celsius'
    },
    moderators: ['nitrous-oxide atmospheric lifetime', 'stratospheric chemistry', 'ozone interactions', 'radiative efficiency', 'climate sensitivity'],
    boundary: 'This is an assessed historical global warming contribution from the full nitrous-oxide-emissions history. It is not a per-tonne coefficient, GWP conversion, one-year concentration response, fertilizer-specific attribution, or local temperature estimate.'
  }),
  'methane->temp': Object.freeze({
    estimand: 'Contribution of historical methane emissions to global surface-air-temperature warming in 2010-2019 relative to 1850-1900.',
    estimate: 0.51,
    lower_bound: 0.29,
    upper_bound: 0.84,
    uncertainty_interval: 'IPCC assessed very likely range (5th-95th percentiles)',
    unit: 'degrees Celsius contribution to 2010-2019 global surface-air-temperature warming relative to 1850-1900',
    exposure_metric: 'Historical global methane emissions, including their assessed effects on other climate drivers',
    exposure_unit: 'emissions history rather than a one-year mass or concentration contrast',
    outcome_metric: 'Methane-emissions contribution to global surface air temperature change',
    outcome_unit: 'degrees Celsius',
    geography: 'global',
    period: '2010-2019 relative to 1850-1900',
    evidence_design: 'ipcc_authoritative_radiative_forcing_and_climate_sensitivity_assessment',
    source_locator: {
      url: 'https://catalogue.ceda.ac.uk/uuid/c1eb6dad1598427f8f9f3eae346ece2f/',
      section: 'IPCC AR6 WGI Figure SPM.2 panel c dataset, SPM2c_data.csv, Methane (CH4) row: total GSAT effect 0.513236937 degrees Celsius; 5th-95th very-likely limits 0.294718019-0.840575458 degrees Celsius'
    },
    moderators: ['methane atmospheric lifetime', 'hydroxyl-radical chemistry', 'ozone response', 'stratospheric water vapour', 'aerosol and other forcing interactions', 'climate sensitivity'],
    boundary: 'This is an assessed historical global warming contribution from the full methane-emissions history, including indirect effects on other climate drivers. It is not a per-tonne coefficient, a GWP value, a one-year concentration response, or a local temperature estimate.'
  }),
  'carbon_emission->temp': Object.freeze({
    estimand: 'Transient global surface-temperature response to cumulative anthropogenic carbon dioxide emissions (TCRE).',
    estimate: 0.45,
    lower_bound: 0.27,
    upper_bound: 0.63,
    uncertainty_interval: 'IPCC assessed likely range',
    unit: 'degrees Celsius per 1000 GtCO2 cumulative emissions',
    exposure_metric: 'Cumulative anthropogenic CO2 emissions',
    outcome_metric: 'CO2-caused increase in global surface temperature',
    geography: 'global',
    period: 'Over this century for warming levels up to at least 2 degrees Celsius relative to pre-industrial',
    evidence_design: 'authoritative_assessment_synthesis_across_observations_models_and_process_evidence',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/',
      section: '5.5.1 Transient Climate Response to Cumulative Emissions of Carbon Dioxide; assessed range and best estimate'
    },
    moderators: ['non-CO2 forcing', 'carbon-cycle uptake', 'ocean heat uptake', 'Earth-system feedbacks', 'net-negative emissions and path dependence'],
    boundary: 'The estimate applies to cumulative global anthropogenic CO2, not one year of territorial emissions. Confidence declines beyond this century and for very low or net-negative emission pathways.'
  }),
  'temp->extreme_precipitation_intensity': Object.freeze({
    estimand: 'Global-scale response of heavy-precipitation intensity to global surface-temperature warming.',
    estimate: 6.5,
    lower_bound: 6,
    upper_bound: 7,
    uncertainty_interval: 'IPCC assessed approximate response range; high confidence',
    unit: 'percent change in heavy-precipitation intensity per degree Celsius GSAT warming',
    exposure_metric: 'Global surface air temperature change relative to a fixed pre-industrial baseline',
    outcome_metric: 'Heavy-precipitation intensity at the global scale',
    geography: 'global; regional responses can depart materially from this scaling',
    period: 'Projected response across assessed global warming levels relative to the 1850-1900 baseline',
    evidence_design: 'authoritative_assessment_synthesis_of_observations_and_climate_model_ensembles',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-12/',
      section: 'Table 12.12 synthesis row for heavy precipitation; Sections 11.4, 11.7, and 12.4'
    },
    moderators: ['regional circulation', 'storm type', 'event rarity', 'convective-process representation', 'aerosol forcing', 'orography'],
    boundary: 'The 6-7 percent scaling is a global assessed approximation for intensity, not a universal local response, not a frequency estimate, and not an estimate for mean precipitation.'
  }),
  'temp->monsoon_volatility': Object.freeze({
    estimand: 'Scenario-conditioned change in June-September mean precipitation over the IPCC South and South East Asian monsoon domain under SSP2-4.5 late-century warming.',
    estimate: 0.66,
    lower_bound: 0.16,
    upper_bound: 1.1,
    uncertainty_interval: 'IPCC Table 8.2 CMIP6 90 percent model range',
    unit: 'millimetres per day change in June-September mean precipitation',
    exposure_metric: 'SSP2-4.5 coupled climate-forcing pathway and associated warming',
    exposure_unit: 'scenario pathway rather than a per-degree temperature coefficient',
    source_id: 'ipcc_ar6_wg1_south_southeast_asian_monsoon_projection',
    outcome_metric: 'South and South East Asian monsoon-domain June-September mean precipitation',
    outcome_unit: 'millimetres per day',
    geography: 'IPCC South and South East Asian monsoon domain',
    period: '2081-2100 relative to 1995-2014 under SSP2-4.5',
    evidence_design: 'ipcc_authoritative_assessment_of_cmip6_regional_monsoon_ensemble',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/',
      section: 'Table 8.2, South and South East Asian Monsoon precipitation row: long-term SSP2-4.5 change 0.66 [0.16 to 1.10] mm per day; Sections 8.4.2.4 and 8.4.2.4.1'
    },
    moderators: ['emissions and aerosol pathway', 'internal variability', 'Indian Ocean Dipole and ENSO', 'land-sea warming contrast', 'monsoon circulation response', 'CMIP6 model spread', 'regional-domain definition'],
    boundary: 'This is a late-century scenario-conditioned domain-mean projection, not a per-degree temperature response, onset-date estimate, rainfall-gate estimate, local precipitation forecast, extreme-rainfall response, or statement that every part of the monsoon region becomes wetter.'
  }),
  'temp->wet_bulb_heat': Object.freeze({
    estimand: 'Projected increase in regional annual-maximum extreme wet-bulb temperature in tropical land regions under 1.5 degrees Celsius of tropical-mean warming.',
    estimate: 1.41,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    lower_bound: 1.33,
    upper_bound: 1.49,
    uncertainty_interval: 'Source-reported probable 66 percent interval; 1.41 degrees Celsius is the arithmetic midpoint retained only as a registry summary',
    unit: 'degrees Celsius increase in regional extreme wet-bulb temperature per 1.5 degrees Celsius tropical-mean warming',
    exposure_metric: 'Tropical-mean surface warming',
    exposure_unit: 'degrees Celsius relative to the study climate baseline',
    source_id: 'nature_geoscience_zhang_held_fueglistaler_2021',
    outcome_metric: 'Regional annual maximum of daily-mean or 3-hourly wet-bulb temperature',
    outcome_unit: 'degrees Celsius',
    geography: 'tropical land between 20 degrees South and 20 degrees North; regional extremes, not global mean wet-bulb temperature',
    period: 'CMIP5 warming response assessed for a 1.5 degrees Celsius warmer tropical climate, checked against approximately 40 years of observations',
    evidence_design: 'climate_model_ensemble_projection_constrained_by_tropical_atmospheric_dynamics_and_observational_reanalysis_checks',
    source_locator: {
      url: 'https://doi.org/10.1038/s41561-021-00695-3',
      section: 'Abstract and Figure 4: probable 66 percent interval of 1.33-1.49 degrees Celsius for the increase in regional extreme wet-bulb temperature in a 1.5 degrees Celsius warmer world'
    },
    moderators: ['regional atmospheric circulation', 'land-sea contrast', 'moisture availability', 'choice of daily-mean versus 3-hourly annual maximum', 'model ensemble and forcing pathway', 'baseline definition'],
    boundary: 'The source reports a 1.33-1.49 degrees Celsius interval rather than a single central estimate; 1.41 is a transparent arithmetic midpoint, not a separately source-reported best estimate. The result applies to tropical regional annual extremes and must not be transferred to extratropical locations, mean wet-bulb temperature, WBGT, person-level exposure, or an hourly threshold count without a separate model.'
  }),
  'ice_sheet_mass_loss->sea_level_rise': Object.freeze({
    estimand: 'Observed global-mean sea-level contribution associated with assessed Greenland Ice Sheet mass loss.',
    estimate: 13.5,
    lower_bound: 11.4,
    upper_bound: 15.6,
    uncertainty_interval: 'IPCC assessed very-likely mass-loss-equivalent range',
    unit: 'millimetres global mean sea-level contribution over 1992-2020',
    exposure_metric: 'Greenland Ice Sheet cumulative mass loss of 4890 Gt over 1992-2020',
    outcome_metric: 'Equivalent contribution to global mean sea-level rise',
    geography: 'Greenland Ice Sheet exposure; global mean sea-level outcome',
    period: '1992-2020',
    evidence_design: 'authoritative_assessment_of_reconciled_satellite_altimetry_gravimetry_and_input_output_estimates',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      section: 'Section 9.4.1 and Figure 9.17: Greenland lost 4890 [4140-5640] Gt, equivalent to 13.5 [11.4-15.6] mm GMSL'
    },
    moderators: ['regional sea-level fingerprints', 'glacial isostatic adjustment', 'firn correction', 'ocean dynamics', 'vertical land motion'],
    boundary: 'This is a bounded observed Greenland contribution to global mean sea level. It is not a local coastal water-level estimate, not an Antarctic estimate, and not a projection of future ice-sheet dynamics.'
  }),
  'permafrost_thaw->methane': Object.freeze({
    estimand: 'Projected additional methane emissions associated with widespread Arctic near-surface permafrost loss.',
    estimate: 0.035,
    lower_bound: 0.01,
    upper_bound: 0.06,
    uncertainty_interval: 'IPCC SROCC assessed projected range',
    unit: 'gigatonnes CH4 per year by 2100',
    exposure_metric: 'Projected Arctic near-surface permafrost area loss under RCP2.6 to RCP8.5',
    outcome_metric: 'Additional methane emissions from thawing permafrost carbon',
    geography: 'northern circumpolar permafrost region',
    period: 'projection to 2100',
    evidence_design: 'authoritative_assessment_synthesis_of_process_studies_observations_and_permafrost_carbon_models',
    source_locator: {
      url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/',
      section: 'Section 3.4.3 carbon feedback assessment and headline finding on projected permafrost carbon and methane release'
    },
    moderators: ['abrupt versus gradual thaw', 'soil moisture and anaerobic conditions', 'fire', 'vegetation carbon uptake', 'microbial decomposition', 'cold-season emissions', 'scenario and model structure'],
    boundary: 'The midpoint is reported only to summarize the IPCC 0.01-0.06 Gt CH4 per year range. It is not an observed present-day flux, not a per-unit-area causal coefficient, and does not include all carbon dioxide emissions from thaw.'
  }),
  'carbon_emission->marine_heatwaves': Object.freeze({
    estimand: 'Projected global marine-heatwave frequency under the high-emissions SSP5-8.5 pathway relative to the 1995-2014 baseline.',
    estimate: 8,
    lower_bound: 3,
    upper_bound: 15,
    uncertainty_interval: 'IPCC assessed likely range',
    unit: 'frequency ratio relative to 1995-2014 under SSP5-8.5',
    exposure_metric: 'SSP5-8.5 high-emissions pathway',
    exposure_unit: 'scenario category',
    outcome_metric: 'Global marine-heatwave frequency ratio',
    outcome_unit: 'ratio',
    geography: 'global ocean; largest assessed changes occur in the tropical ocean and Arctic',
    period: '2081-2100 relative to 1995-2014',
    evidence_design: 'authoritative_assessment_of_coupled_climate_model_projections_and_observed_event_trends',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      section: 'Executive Summary, Ocean Heat and Salinity: marine heatwaves projected eight [3-15] times more frequent under SSP5-8.5'
    },
    moderators: ['emissions pathway', 'ocean basin', 'event threshold definition', 'internal variability', 'circulation', 'baseline period'],
    boundary: 'This is a scenario-conditioned global frequency ratio, not a per-tonne emissions coefficient, not an intensity estimate, and not a universal local projection.'
  }),
  'sea_level_rise->coastal_inundation_risk': Object.freeze({
    estimand: 'Projected amplification of extreme still-water-level frequency from regional sea-level rise by 2050 relative to the recent past.',
    estimate: 25,
    lower_bound: 20,
    upper_bound: 30,
    uncertainty_interval: 'IPCC assessed median amplification range across SSP1-2.6, SSP2-4.5, and SSP5-8.5',
    unit: 'times recent-past extreme still-water-level frequency by 2050',
    exposure_metric: 'Projected regional relative sea-level rise',
    exposure_unit: 'metres relative to 1995-2014',
    outcome_metric: 'Extreme still-water-level occurrence frequency',
    outcome_unit: 'frequency ratio',
    geography: 'quasi-global assessed tide-gauge locations',
    period: '2050 relative to the recent-past baseline used by IPCC AR6',
    evidence_design: 'authoritative_assessment_of_tide_gauge_observations_regional_sea_level_projections_and_extreme_value_models',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      section: 'Executive Summary and Section 9.6.4: extreme sea levels occur about 20-30 times more frequently by 2050'
    },
    moderators: ['vertical land motion', 'regional ocean dynamics', 'tides', 'storm surge', 'wave climate', 'coastal protection', 'drainage and exposure'],
    boundary: 'The midpoint summarizes the assessed 20-30 times range. The estimate assumes other contributors to extreme sea levels remain stationary and does not predict inundated area, damage, or any single coastline.'
  }),
  'active_mobility->carbon_emission': Object.freeze({
    estimand: 'Case-study reduction in urban transport greenhouse-gas emissions associated with investment in walking and cycling infrastructure.',
    estimate: 6,
    lower_bound: 2,
    upper_bound: 10,
    uncertainty_interval: 'IPCC-reported range across assessed case studies; outcome depends on setting',
    unit: 'percent reduction in urban transport greenhouse-gas emissions',
    exposure_metric: 'Investment in infrastructure supporting active transport modes that reduces car travel',
    exposure_unit: 'policy and infrastructure intervention',
    outcome_metric: 'Urban transport greenhouse-gas emissions relative to the study baseline',
    outcome_unit: 'percent change',
    geography: 'urban case-study settings assessed in IPCC AR6 WGIII Chapter 10',
    period: 'study-specific intervention and scenario periods reported in the assessed literature',
    evidence_design: 'authoritative_assessment_synthesis_of_urban_transport_case_studies',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/',
      section: 'Section 10.2 and Table 10.3, Investments in transit and active transport infrastructure: active mobility could reduce urban transport emissions by 2-10% depending on setting'
    },
    moderators: ['baseline mode share', 'network completeness and safety', 'trip substitution rather than induced travel', 'urban density and land-use mix', 'public-transit integration', 'electricity and vehicle fleet mix'],
    boundary: 'The midpoint only summarizes the IPCC-reported 2-10% case-study range. It is not a universal causal coefficient, does not apply to all cities, and requires actual substitution of motorized trips rather than merely adding infrastructure.'
  }),
  'low_carbon_cement->carbon_emission': Object.freeze({
    estimand: 'Assessed cement-and-concrete emissions reduction potential from basic material-efficiency measures that lower demand for clinker.',
    estimate: 37,
    lower_bound: 24,
    upper_bound: 50,
    uncertainty_interval: 'IPCC-reported potential range across assessed material-efficiency strategies',
    unit: 'percent reduction in cement and concrete greenhouse-gas emissions',
    exposure_metric: 'Basic material-efficiency intervention using well-made, right-sized or prefabricated concrete only where needed',
    exposure_unit: 'intervention package',
    outcome_metric: 'Cement and concrete greenhouse-gas emissions relative to the assessed baseline',
    outcome_unit: 'percent change',
    geography: 'global industry evidence base assessed in IPCC AR6 WGIII Chapter 11; implementation is project and market specific',
    period: 'mitigation potential through the industrial transition period assessed to mid-century',
    evidence_design: 'authoritative_assessment_synthesis_of_industrial_material_efficiency_studies',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/',
      section: 'Executive Summary and Sections 11.3.2, 11.3.6 and 11.4.1.2: basic material efficiency could reduce cement and concrete emissions 24-50% through lower clinker demand'
    },
    moderators: ['structural design and safety requirements', 'baseline material intensity', 'clinker ratio', 'cement substitution availability', 'construction practice', 'rebound in total construction demand'],
    boundary: 'The midpoint summarizes an assessed technical-potential range for a specified material-efficiency package. It is not the effect of every product labelled low-carbon cement, does not include a guaranteed project-level reduction, and is not additive to overlapping clinker substitution or carbon-capture estimates.'
  }),
  'temp->heat_related_mortality_burden': Object.freeze({
    estimand: 'Warm-season mortality fraction attributable to human-induced warming across the study locations under factual versus natural-forcing-only climate simulations.',
    estimate: 0.58,
    lower_bound: 0.24,
    upper_bound: 1.14,
    uncertainty_interval: 'Source-reported empirical 95 percent confidence interval across exposure-response uncertainty and climate-model variability',
    unit: 'percent of all warm-season deaths attributable to human-induced climate change',
    exposure_metric: 'Difference in daily mean warm-season temperature between factual all-forcing and counterfactual natural-forcing-only climate simulations',
    exposure_unit: 'degrees Celsius by location and day, propagated through location-specific exposure-response functions',
    source_id: 'nature_climate_change_vicedo_cabrera_2021_heat_mortality_attribution',
    outcome_metric: 'All-cause or non-external warm-season mortality attributable to human-induced warming',
    outcome_unit: 'percent of all warm-season deaths; corresponding source estimate 9,702 deaths with 95 percent CI 4,005-19,135 across included locations',
    geography: '732 locations in 43 countries on every inhabited continent, with important gaps including much of Africa and South Asia',
    period: 'Location-specific mortality records overlapping 1991-2015; attribution burden evaluated for 1991-2018 warm seasons',
    evidence_design: 'multi_country_two_stage_time_series_epidemiology_combined_with_detection_and_attribution_climate_counterfactuals',
    source_locator: {
      url: 'https://doi.org/10.1038/s41558-021-01058-x',
      section: 'Results, Heat-mortality impacts attributed to climate change: 0.58 percent of all warm-season deaths, 95 percent CI 0.24-1.14, corresponding to 9,702 deaths, 95 percent CI 4,005-19,135, across 732 locations'
    },
    moderators: ['local exposure-response curve', 'minimum-mortality temperature', 'population age and baseline health', 'acclimatization and adaptation', 'housing and cooling access', 'urban form', 'healthcare access', 'climate-model temperature series'],
    boundary: 'This is an attribution estimate for the included locations and warm seasons, not a global population total, a per-degree universal mortality coefficient, an individual causal risk, or an estimate of future deaths. It attributes the temperature difference between all-forcing and natural-forcing-only climates and does not isolate carbon dioxide from other anthropogenic forcings.'
  }),
  'data_centers->carbon_emission': Object.freeze({
    estimand: 'Scenario-conditioned indirect carbon dioxide emissions from electricity consumed by the global data-centre fleet.',
    estimate: 300,
    lower_bound: 300,
    upper_bound: 500,
    uncertainty_interval: 'IEA 2035 Base Case to Lift-Off Case scenario span, not a statistical confidence interval',
    unit: 'million tonnes indirect CO2 emissions from data-centre electricity use in 2035',
    exposure_metric: 'Global data-centre electricity demand and serving generation mix under the IEA Energy and AI scenarios',
    exposure_unit: 'terawatt-hours per year with generation mix retained',
    source_id: 'iea_energy_and_ai_2025',
    outcome_metric: 'Indirect carbon dioxide emissions from purchased electricity',
    outcome_unit: 'million tonnes CO2 per year',
    geography: 'global data-centre fleet; local and company-specific intensity can differ substantially',
    period: '2035 scenario year, compared with about 180 Mt indirect CO2 in 2024',
    evidence_design: 'iea_global_energy_system_scenario_model_with_data_centre_stock_electricity_demand_and_generation_mix',
    source_locator: {
      url: 'https://www.iea.org/reports/energy-and-ai/ai-and-climate-change',
      section: 'AI and climate change: data centres account for about 180 Mt indirect CO2 today; emissions reach 300 Mt in the 2035 Base Case and up to 500 Mt in the Lift-Off Case'
    },
    moderators: ['grid carbon intensity', 'clean-energy procurement additionality and temporal matching', 'server utilization and hardware efficiency', 'power usage effectiveness', 'workload growth and rebound', 'on-site backup generation'],
    boundary: 'The estimate covers indirect emissions from electricity consumption and excludes backup-generator emissions. The 300-500 Mt bounds are scenario outcomes, not statistical uncertainty, and must not be applied as a facility-level coefficient without time- and location-matched electricity data.'
  }),
  'industry_farming->nitrous_oxide': Object.freeze({
    estimand: 'Tier 1 direct nitrous-oxide nitrogen emissions from anthropogenic nitrogen inputs to managed mineral soils.',
    estimate: 0.01,
    lower_bound: 0.002,
    upper_bound: 0.018,
    uncertainty_interval: 'IPCC 2019 Refinement corrected 95 percent uncertainty range for aggregated EF1',
    unit: 'kg N2O-N emitted per kg nitrogen input to managed mineral soils',
    exposure_metric: 'Annual synthetic and organic fertilizer nitrogen, crop-residue nitrogen, and other included anthropogenic nitrogen inputs to managed mineral soils',
    exposure_unit: 'kg nitrogen input per inventory year',
    source_id: 'ipcc_2019_refinement_managed_soils_n2o',
    outcome_metric: 'Direct managed-soil nitrous-oxide nitrogen emissions',
    outcome_unit: 'kg N2O-N per inventory year',
    geography: 'Tier 1 national or subnational managed-mineral-soil inventory where a country-specific Tier 2 or Tier 3 factor is unavailable',
    period: 'Annual inventory period; nitrogen inputs are allocated under the IPCC inventory convention',
    evidence_design: 'ipcc_inventory_default_derived_from_balanced_bootstrap_of_disaggregated_emission_factor_distributions',
    source_locator: {
      url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/corrigenda4.html',
      section: 'Volume 4 Chapter 11 corrigenda for Table 11.1: aggregated EF1 estimate 0.01 with corrected uncertainty range 0.002-0.018; distribution balanced across disaggregated EF1 values and interval from the 2.5th to 97.5th percentiles'
    },
    moderators: ['wet versus dry climate', 'synthetic versus organic fertilizer form', 'soil moisture and aeration', 'crop and residue management', 'nitrification inhibitors', 'country-specific Tier 2 or Tier 3 evidence'],
    boundary: 'This is an inventory default for direct N2O-N emissions from included nitrogen inputs to managed mineral soils. It is not a farm-specific measured response, excludes indirect volatilization and leaching pathways, must be converted by 44/28 for N2O mass, and should be replaced by justified country-specific higher-tier factors.'
  }),
  'temp->wildfire_regime_shift': Object.freeze({
    estimand: 'Additional western United States forest area burned attributed to anthropogenic warming-driven increases in fuel aridity.',
    estimate: 4.2,
    lower_bound: 2.7,
    upper_bound: 6.5,
    uncertainty_interval: 'Source-reported 95 percent confidence interval across the study attribution models',
    unit: 'million hectares of additional cumulative forest area burned',
    exposure_metric: 'Anthropogenic warming contribution to observed fuel aridity',
    exposure_unit: 'historical factual-versus-no-anthropogenic-climate-change contrast',
    source_id: 'pnas_abatzoglou_williams_2016_western_us_wildfire_attribution',
    outcome_metric: 'Cumulative western United States forest area burned attributable to anthropogenic fuel-aridity change',
    outcome_unit: 'million hectares',
    geography: 'forested lands of the western continental United States',
    period: '1984-2015 burned-area attribution using observed climate and fire records, with anthropogenic fuel-aridity changes assessed from 1979 onward',
    evidence_design: 'detection_and_attribution_analysis_linking_observed_burned_area_to_eight_fuel_aridity_metrics_and_anthropogenic_climate_model_signals',
    source_locator: {
      url: 'https://doi.org/10.1073/pnas.1607171113',
      section: 'Abstract, Results, Figure 2 and Supporting Information: 4.2 million ha additional forest fire area, 95 percent confidence interval 2.7-6.5 million ha, during 1984-2015'
    },
    moderators: ['fuel abundance and continuity', 'ignition sources', 'fire suppression and prescribed burning', 'land-management history', 'vegetation type', 'wind and episodic weather', 'choice of fuel-aridity metric'],
    boundary: 'This historical attribution is not a universal per-degree burned-area coefficient. It applies to western US forests during 1984-2015, not grasslands or all global fire, and the study explicitly notes that suppression, settlement, natural variability and fuel conditions also affect burned area.'
  }),
  'wildfire_smoke_pm25_exposure->wildfire_smoke_hospitalization_burden': Object.freeze({
    estimand: 'Change in daily unscheduled respiratory hospitalizations associated with an eight-day smoke-specific PM2.5 exposure contrast from 0 to 40 micrograms per cubic metre.',
    estimate: 2.4,
    lower_bound: 0.17,
    upper_bound: 4.63,
    uncertainty_interval: 'Source-reported 95 percent confidence interval using cluster-robust standard errors',
    unit: 'additional daily respiratory hospitalizations per 100000 older adults for a 0-to-40 micrograms per cubic metre smoke-PM2.5 contrast',
    exposure_metric: 'Same-day and preceding seven-day county-level smoke-specific PM2.5 concentration profile',
    exposure_unit: 'micrograms per cubic metre, contrasted from 0 to 40',
    source_id: 'jama_network_open_vega_2025_wildfire_smoke_hospitalization',
    outcome_metric: 'Daily unscheduled respiratory hospitalizations among Medicare beneficiaries',
    outcome_unit: 'hospitalizations per 100000 beneficiaries per day',
    geography: 'Arizona, California, Colorado, Idaho, Montana, Nevada, New Mexico, Oregon, Utah, Washington and Wyoming, United States',
    period: 'wildfire seasons from 2006 through 2016; analysis conducted 2023-2025',
    evidence_design: 'retrospective_medicare_cohort_with_machine_learning_smoke_pm25_exposure_and_distributed_lag_nonlinear_models',
    source_locator: {
      url: 'https://doi.org/10.1001/jamanetworkopen.2025.7956',
      section: 'Abstract Results and Figure 4: respiratory hospitalizations increased 2.40 per 100000, 95 percent CI 0.17-4.63, for the modeled 0-to-40 micrograms per cubic metre eight-day smoke-PM2.5 contrast'
    },
    moderators: ['age and Medicare eligibility', 'baseline respiratory health', 'exposure measurement error', 'indoor infiltration and filtration', 'protective behavior and evacuation', 'county-level socioeconomic conditions', 'nonlinear concentration-response above approximately 25 micrograms per cubic metre'],
    boundary: 'This is an observational association in adults aged 65 years or older in eleven western US states, not a population-wide universal causal coefficient. The response was nonlinear, cardiovascular estimates crossed the null, and the result must not be linearly extrapolated below or above the modeled 0-to-40 micrograms per cubic metre contrast.'
  }),
  'carbon_emission->ice_sheet_mass_loss': Object.freeze({
    estimand: 'Scenario-conditioned Greenland Ice Sheet contribution to global mean sea-level rise under the very-high greenhouse-gas emissions pathway SSP5-8.5.',
    estimate: 0.13,
    lower_bound: 0.09,
    upper_bound: 0.18,
    uncertainty_interval: 'IPCC assessed likely range around the source-reported central estimate',
    unit: 'metres global mean sea-level equivalent from Greenland Ice Sheet mass loss',
    exposure_metric: 'SSP5-8.5 very-high greenhouse-gas emissions pathway and associated cumulative emissions',
    exposure_unit: 'scenario category',
    source_id: 'ipcc_ar6_wgi_greenland_ice_sheet_projection',
    outcome_metric: 'Greenland Ice Sheet mass loss expressed as global mean sea-level equivalent',
    outcome_unit: 'metres global mean sea-level equivalent',
    geography: 'Greenland Ice Sheet exposure; global mean sea-level-equivalent outcome',
    period: '2100 relative to 1995-2014',
    evidence_design: 'authoritative_assessment_of_emulated_ismip6_multi_model_ice_sheet_projections_with_historical_dynamic_response',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      section: 'Section 9.4.1.3 and Executive Summary: Greenland Ice Sheet contribution of 0.13 m, likely range 0.09-0.18 m, by 2100 under SSP5-8.5 relative to 1995-2014'
    },
    moderators: ['cumulative emissions pathway', 'surface mass balance and meltwater runoff', 'firn refreezing capacity', 'ice discharge and calving', 'ocean forcing', 'ice-sheet model structure', 'historical dynamic-response correction'],
    boundary: 'This is a scenario-conditioned Greenland projection expressed as sea-level equivalent, not a per-tonne emissions coefficient, not an Antarctic estimate, and not a local coastal water-level projection. The likely range does not encompass every low-likelihood high-impact ice-sheet response, and local sea level differs because of gravitational fingerprints, ocean dynamics and vertical land motion.'
  }),
  'carbon_emission->sea_level_rise': Object.freeze({
    estimand: 'Scenario-conditioned global mean sea-level rise under the very-high greenhouse-gas emissions pathway SSP5-8.5.',
    estimate: 0.82,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    lower_bound: 0.63,
    upper_bound: 1.01,
    uncertainty_interval: 'IPCC assessed likely range; 0.82 metres is the arithmetic midpoint retained only as a registry summary',
    unit: 'metres global mean sea-level rise',
    exposure_metric: 'SSP5-8.5 very-high greenhouse-gas emissions pathway',
    exposure_unit: 'scenario category',
    source_id: 'ipcc_ar6_synthesis_report_sea_level_projection',
    outcome_metric: 'Global mean sea-level change relative to 1995-2014',
    outcome_unit: 'metres',
    geography: 'global mean sea level; local relative sea level can differ substantially',
    period: '2100 relative to 1995-2014',
    evidence_design: 'authoritative_assessment_of_emulated_cmip_ice_sheet_glacier_and_land_water_projections_with_observational_constraints',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/syr/figures/figure-3-4/',
      section: 'Figure 3.4 caption: likely global mean sea-level rise of 0.63-1.01 m by 2100 under SSP5-8.5 relative to 1995-2014'
    },
    moderators: ['emissions pathway after mid-century', 'ocean thermal expansion', 'glacier mass loss', 'ice-sheet surface mass balance and dynamics', 'land-water storage', 'regional sea-level fingerprints and vertical land motion'],
    boundary: 'The midpoint summarizes a scenario-conditioned assessed range and is not a per-tonne emissions coefficient. Low-likelihood high-impact ice-sheet outcomes can exceed the likely range, and this global mean must not be used as a local inundation depth without regional relative-sea-level, tide, surge, wave, subsidence and adaptation information.'
  }),
  'carbon_emission->ocean_acidification': Object.freeze({
    estimand: 'Projected global mean surface-ocean pH change under the very-high greenhouse-gas emissions pathway SSP5-8.5.',
    estimate: -0.44,
    lower_bound: -0.445,
    upper_bound: -0.435,
    uncertainty_interval: 'IPCC-reported model-ensemble central response plus or minus 0.005 pH units',
    unit: 'pH units change in global mean surface ocean',
    exposure_metric: 'SSP5-8.5 very-high greenhouse-gas emissions pathway and associated atmospheric carbon-dioxide concentration',
    exposure_unit: 'scenario category',
    source_id: 'ipcc_ar6_wgi_surface_ocean_ph_projection',
    outcome_metric: 'Global mean surface-ocean pH anomaly',
    outcome_unit: 'pH units',
    geography: 'global surface ocean; basin and coastal responses vary',
    period: '2080-2099 relative to 1870-1899',
    evidence_design: 'authoritative_assessment_of_cmip6_concentration_driven_ocean_biogeochemical_model_ensembles',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-12/',
      section: 'Section 12.4 ocean acidification synthesis: surface-ocean pH decline of -0.44 plus or minus 0.005 under SSP5-8.5 from 1870-1899 to 2080-2099'
    },
    moderators: ['atmospheric carbon-dioxide pathway', 'ocean circulation and mixing', 'temperature and alkalinity', 'biological carbon cycling', 'freshwater input', 'coastal eutrophication and upwelling'],
    boundary: 'This is a concentration-driven scenario projection for global mean surface-ocean pH, not a per-tonne emissions coefficient and not a local coastal-water forecast. The narrow model-ensemble interval does not encompass every structural, scenario or regional uncertainty, and pH is logarithmic.'
  }),
  'carbon_emission->ocean_heat_content': Object.freeze({
    estimand: 'Scenario-conditioned increase in full-depth global ocean heat content under SSP5-8.5 relative to the observed 1971-2018 heat-content increase.',
    estimate: 6,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    lower_bound: 4,
    upper_bound: 8,
    uncertainty_interval: 'IPCC assessed likely factor range; 6 is the arithmetic midpoint retained only as a registry summary',
    unit: 'times the observed 1971-2018 global ocean heat-content increase by 2100',
    exposure_metric: 'SSP5-8.5 very-high greenhouse-gas emissions pathway',
    exposure_unit: 'scenario category',
    source_id: 'ipcc_ar6_wgi_global_ocean_heat_content_projection',
    outcome_metric: 'Full-depth global ocean heat-content increase',
    outcome_unit: 'ratio to the assessed 1971-2018 increase of 0.28-0.55 yottajoules',
    geography: 'global full-depth ocean; vertical and basin-scale warming patterns differ',
    period: 'increase through 2100 under SSP5-8.5, normalized to the observed 1971-2018 increase',
    evidence_design: 'authoritative_assessment_of_observational_ocean_heat_reconstructions_cmip6_ensembles_and_two_layer_energy_budget_emulation',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      section: 'Executive Summary and Section 9.2.2.1: ocean heat content increased 0.28-0.55 YJ during 1971-2018 and will likely increase by 4-8 times that amount by 2100 under SSP5-8.5'
    },
    moderators: ['emissions pathway', 'climate sensitivity and radiative forcing', 'ocean circulation and vertical mixing', 'aerosol and non-CO2 forcing', 'internal variability', 'choice of CMIP6 ensemble or two-layer emulator'],
    boundary: 'The midpoint is a summary of a ratio range, not a per-tonne emissions coefficient and not a local ocean-temperature change. The denominator is itself an assessed interval, warming is vertically and spatially heterogeneous, and deep-ocean heat uptake continues after surface temperatures stabilize.'
  }),
  'carbon_emission->oceanic_deoxygenation': Object.freeze({
    estimand: 'Projected change in global mean subsurface-ocean dissolved-oxygen concentration under SSP5-8.5.',
    estimate: -13.27,
    lower_bound: -18.55,
    upper_bound: -7.99,
    uncertainty_interval: 'IPCC-reported model-ensemble response plus or minus 5.28 millimoles per cubic metre',
    unit: 'millimoles dissolved oxygen per cubic metre change',
    exposure_metric: 'SSP5-8.5 very-high greenhouse-gas emissions pathway',
    exposure_unit: 'scenario category',
    source_id: 'ipcc_ar6_wgi_subsurface_ocean_oxygen_projection',
    outcome_metric: 'Global mean dissolved-oxygen concentration in the 100-600 metre ocean layer',
    outcome_unit: 'millimoles per cubic metre',
    geography: 'global subsurface ocean at 100-600 metres; regional oxygen-minimum-zone responses differ',
    period: '2080-2099 relative to 1870-1899',
    evidence_design: 'authoritative_assessment_of_cmip6_ocean_biogeochemical_model_ensembles',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-12/',
      section: 'Section 12.4 dissolved oxygen synthesis: global mean 100-600 m oxygen change of -13.27 plus or minus 5.28 mmol m-3 under SSP5-8.5 by 2080-2099 relative to 1870-1899'
    },
    moderators: ['ocean warming and oxygen solubility', 'stratification and ventilation', 'circulation and mixing', 'export production and remineralization', 'nutrient supply', 'regional upwelling and coastal eutrophication'],
    boundary: 'This is a global model-ensemble projection for the 100-600 metre layer, not a per-tonne emissions coefficient, local hypoxia forecast or direct estimate of ecosystem damage. Coastal oxygen can be dominated by nutrient loading and circulation, while benthic and surface layers have different projected responses.'
  }),
  'temp->sea_ice_season_loss': Object.freeze({
    estimand: 'Annual probability of a practically sea-ice-free Arctic September at a stabilized global warming level of 2 degrees Celsius.',
    estimate: 22.5,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    lower_bound: 10,
    upper_bound: 35,
    uncertainty_interval: 'IPCC assessed probability range; 22.5 percent is the arithmetic midpoint retained only as a registry summary',
    unit: 'percent annual probability of a practically sea-ice-free September at 2 degrees Celsius stabilized global warming',
    exposure_metric: 'Stabilized global surface warming relative to pre-industrial conditions',
    exposure_unit: 'degrees Celsius',
    source_id: 'ipcc_srocc_arctic_sea_ice_warming_level',
    outcome_metric: 'Annual occurrence of a practically sea-ice-free Arctic September',
    outcome_unit: 'percent probability per year',
    geography: 'Arctic Ocean September mean sea-ice extent',
    period: 'End-of-century stabilized warming comparison; source contrasts 1.5 and 2 degrees Celsius',
    evidence_design: 'authoritative_assessment_of_coupled_climate_model_ensembles_conditioned_on_stabilized_warming_levels',
    source_locator: {
      url: 'https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/',
      section: 'B.1.7: annual probability of a sea-ice-free September is approximately 1 percent at 1.5 degrees Celsius and 10-35 percent at 2 degrees Celsius stabilized warming'
    },
    moderators: ['sea-ice-free threshold definition', 'internal Arctic variability', 'aerosol forcing', 'ocean heat transport', 'model sea-ice sensitivity', 'whether warming stabilizes'],
    boundary: 'The midpoint is not a source-reported best estimate. This is an end-of-century annual probability at a stabilized warming level, not a forecast for a particular year, not Antarctic sea ice, and not a linear per-degree response.'
  }),
  'temp->permafrost_thaw': Object.freeze({
    estimand: 'Scenario-conditioned reduction in northern near-surface permafrost area by 2100 under RCP8.5.',
    estimate: 69,
    lower_bound: 49,
    upper_bound: 89,
    uncertainty_interval: 'IPCC assessed likely range represented by the source-reported 69 plus or minus 20 percent response',
    unit: 'percent decrease in near-surface permafrost area by 2100 under RCP8.5',
    exposure_metric: 'High greenhouse-gas forcing and associated warming under RCP8.5',
    exposure_unit: 'scenario category',
    source_id: 'ipcc_srocc_permafrost_area_projection',
    outcome_metric: 'Area underlain by near-surface permafrost within the upper 3-4 metres',
    outcome_unit: 'percent change from the model reference area',
    geography: 'northern circumpolar near-surface permafrost domain',
    period: '2100 under RCP8.5',
    evidence_design: 'authoritative_assessment_of_permafrost_model_ensembles_and_process_evidence',
    source_locator: {
      url: 'https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/',
      section: 'B.1.4: near-surface permafrost area decrease of 69 plus or minus 20 percent by 2100 under RCP8.5; 24 plus or minus 16 percent under RCP2.6'
    },
    moderators: ['forcing pathway', 'ground-ice content', 'snow insulation', 'soil moisture', 'vegetation and fire', 'model soil depth and permafrost definition'],
    boundary: 'This is a scenario-conditioned circumpolar area response, not a per-degree coefficient, active-layer-thickness forecast, local thermokarst prediction, or direct estimate of carbon release. Abrupt thaw and deep permafrost are incompletely represented.'
  }),
  'temp->oceanic_deoxygenation': Object.freeze({
    estimand: 'Projected global ocean oxygen-content decline under the high-warming RCP8.5 pathway.',
    estimate: -3.5,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    lower_bound: -4,
    upper_bound: -3,
    uncertainty_interval: 'IPCC assessed very-likely response range; -3.5 percent is the arithmetic midpoint retained only as a registry summary',
    unit: 'percent change in global ocean oxygen content',
    exposure_metric: 'Ocean warming and circulation response under RCP8.5',
    exposure_unit: 'scenario category',
    source_id: 'ipcc_srocc_global_ocean_oxygen_projection',
    outcome_metric: 'Global ocean oxygen content',
    outcome_unit: 'percent change',
    geography: 'global ocean; coastal and depth-resolved responses can differ substantially',
    period: '2081-2100 relative to 2006-2015',
    evidence_design: 'authoritative_assessment_of_coupled_ocean_biogeochemical_model_ensembles',
    source_locator: {
      url: 'https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/',
      section: 'B.2.2: global ocean oxygen content projected to decline by a very-likely range of 3-4 percent under RCP8.5 by 2081-2100 relative to 2006-2015'
    },
    moderators: ['oxygen solubility', 'stratification', 'ventilation and overturning', 'biological production and remineralization', 'regional upwelling', 'coastal nutrient loading'],
    boundary: 'The midpoint summarizes a scenario-conditioned assessed range and is not a per-degree coefficient. It does not predict local hypoxia, individual depth layers, organism exposure, or oxygen changes caused by coastal eutrophication.'
  }),
  'carbon_emission->marine_fisheries_collapse': Object.freeze({
    estimand: 'Projected change in global maximum fisheries catch potential under the high-emissions RCP8.5 pathway.',
    estimate: -22.3,
    point_estimate_status: 'derived_midpoint_of_source_reported_interval',
    lower_bound: -24.1,
    upper_bound: -20.5,
    uncertainty_interval: 'IPCC-assessed projection range with medium confidence; -22.3 percent is the arithmetic midpoint retained only as a registry summary',
    unit: 'percent change in maximum fisheries catch potential',
    exposure_metric: 'RCP8.5 high greenhouse-gas emissions pathway and associated ocean physical and biogeochemical change',
    exposure_unit: 'scenario category',
    source_id: 'ipcc_srocc_fisheries_catch_potential_projection',
    outcome_metric: 'Global maximum fisheries catch potential in shelf seas',
    outcome_unit: 'percent change relative to 1986-2005',
    geography: 'global shelf seas; Arctic and Antarctic projections have low confidence and regional outcomes vary in sign and magnitude',
    period: '2081-2100 relative to 1986-2005 under RCP8.5',
    evidence_design: 'authoritative_assessment_of_cmip5_earth_system_forcing_and_two_fisheries_and_marine_ecosystem_models',
    source_locator: {
      url: 'https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/',
      section: 'B.5 and B.5.1 plus Figure SPM.3: maximum fisheries catch potential projected to decrease 20.5-24.1 percent by 2081-2100 relative to 1986-2005 under RCP8.5; assessment confidence is medium'
    },
    moderators: ['emissions pathway', 'regional ocean warming', 'net primary production', 'oxygen loss', 'ocean acidification', 'stock mobility', 'fishing pressure', 'management and rebuilding', 'model disagreement'],
    boundary: 'The midpoint is not a source-reported best estimate. This is a scenario-conditioned projection of maximum catch potential, not a per-tonne emissions coefficient, realized catch, assessed-stock unsustainable share, local fishery collapse probability, or food-security outcome. Projections use two fisheries and marine ecosystem models, and polar confidence is low.'
  }),
  'pm2_5_particulates->air_pollution_health_burden': Object.freeze({
    estimand: 'Relative risk of natural-cause mortality associated with a 10 microgram per cubic metre increase in long-term ambient PM2.5 exposure in the cohort literature synthesized for the WHO air-quality guidelines.',
    estimate: 1.08,
    lower_bound: 1.06,
    upper_bound: 1.09,
    uncertainty_interval: 'Source-reported 95 percent confidence interval from the systematic-review random-effects meta-analysis',
    unit: 'relative risk of natural-cause mortality per 10 micrograms PM2.5 per cubic metre higher long-term exposure',
    exposure_metric: 'Long-term ambient fine-particulate-matter concentration',
    exposure_unit: '10 micrograms PM2.5 per cubic metre',
    source_id: 'who_air_quality_guideline_pm25_mortality_meta_analysis',
    outcome_metric: 'Natural-cause mortality',
    outcome_unit: 'relative risk',
    geography: 'Populations represented by 25 long-term cohort studies in the WHO-commissioned systematic review; study coverage, baseline exposure and population composition vary',
    period: 'Long-term exposure and cohort follow-up periods represented by studies published through the 2020 systematic review',
    evidence_design: 'who_commissioned_systematic_review_and_random_effects_meta_analysis_of_long_term_cohort_studies',
    source_locator: {
      url: 'https://www.sciencedirect.com/science/article/pii/S0160412020319292',
      section: 'Abstract and natural-cause mortality meta-analysis: combined risk ratio 1.08 with 95 percent confidence interval 1.06-1.09 per 10 micrograms per cubic metre PM2.5; summarized in the 2021 WHO Global Air Quality Guidelines, PM2.5 recommendation evidence review'
    },
    moderators: ['baseline PM2.5 concentration and nonlinear concentration-response shape', 'particle composition and source mixture', 'age and baseline disease', 'socioeconomic conditions', 'co-pollutants', 'exposure-assessment error', 'regional cohort coverage', 'confounder adjustment'],
    boundary: 'This is a pooled association from long-term observational cohorts, not an individual probability, a short-term smoke-event coefficient, a causal effect for every particle source, or an attributable-death count. The review notes evidence of a supralinear response, so the linear per-10-microgram increment must not be extrapolated without preserving the exposure range and concentration-response model.'
  }),
  'tropospheric_ozone->crop_yield_volatility': Object.freeze({
    estimand: 'Average United States maize-yield reduction attributed to ambient ozone exposure across the 1980-2019 county-year study period.',
    estimate: -8.69,
    lower_bound: -9.18,
    upper_bound: -8.11,
    uncertainty_interval: 'Source-reported 80 percent confidence interval; signs are expressed here as yield change relative to the modeled no-ozone-damage counterfactual',
    unit: 'percent change in United States maize yield attributed to ambient ozone exposure',
    exposure_metric: 'Growing-season ambient ozone exposure represented in the study statistical crop model',
    exposure_unit: 'Study-modeled ozone exposure contrast relative to a no-ozone-damage counterfactual',
    source_id: 'earths_future_liu_2021_us_air_pollution_crop_yields',
    outcome_metric: 'County-level maize yield',
    outcome_unit: 'percent change',
    geography: 'Contiguous United States maize-growing counties represented by the study',
    period: '1980-2019 county-year observations',
    evidence_design: 'county_panel_statistical_crop_model_with_weather_air_pollution_controls_and_uncertainty_propagation',
    source_locator: {
      url: 'https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2021EF002000',
      section: 'Results, Figure 3 and accompanying text: ozone reduced United States maize yields by 8.69 percent with an 80 percent confidence interval of 8.11-9.18 percent across the full 1980-2019 study period'
    },
    moderators: ['maize cultivar and management', 'ozone exposure metric and crop uptake', 'temperature and vapor-pressure deficit', 'precipitation and soil moisture', 'co-occurring aerosols', 'irrigation', 'county crop geography', 'model specification and counterfactual'],
    boundary: 'This is a model-attributed national-period average for United States maize, not a universal crop coefficient, a per-ppb response, a direct measure of year-to-year volatility, or evidence for rice, wheat, soybean or non-US systems. The confidence interval is 80 percent, not 95 percent, and the magnitude depends on the modeled no-damage counterfactual and joint treatment of heat and aerosols.'
  }),
  'ocean_acidification->shell_calcification_failures': Object.freeze({
    estimand: 'Mean coral-calcification response per unit decrease in seawater aragonite saturation state across experiments with initial aragonite saturation between 2 and 4.',
    estimate: -15,
    lower_bound: -23,
    upper_bound: -7,
    uncertainty_interval: 'Source reports a mean response of about 15 percent reduction and an among-study standard deviation of 8 percentage points; bounds are the transparent mean plus or minus one reported among-study standard deviation, not a confidence interval',
    unit: 'percent change in coral calcification per one-unit decrease in aragonite saturation state',
    exposure_metric: 'Decrease in seawater aragonite saturation state',
    exposure_unit: 'one unit of aragonite saturation state within the assessed range 2 to 4',
    source_id: 'global_change_biology_chan_connolly_2013_coral_calcification_meta_analysis',
    outcome_metric: 'Coral calcification rate',
    outcome_unit: 'percent change',
    geography: 'Coral species and laboratory or mesocosm settings represented by the experimental literature meta-analysis',
    period: 'Experimental durations and publication record synthesized in the 2013 meta-analysis; not an annual field trend',
    evidence_design: 'random_effects_meta_analysis_of_experimental_coral_calcification_responses',
    source_locator: {
      url: 'https://pubmed.ncbi.nlm.nih.gov/23504739/',
      section: 'Abstract: overall mean coral-calcification response about 15 percent reduction per unit decrease in aragonite saturation over 2 less than aragonite saturation less than 4, with among-study standard deviation of 8 percent per unit'
    },
    moderators: ['coral species and acclimation', 'carbonate-chemistry manipulation method', 'calcification measurement method', 'light and dark integration', 'irradiance', 'food availability', 'temperature', 'study duration', 'initial aragonite saturation'],
    boundary: 'This estimate applies to coral calcification within the studied aragonite-saturation range, not all shell-building organisms, dissolution, recruitment, reef accretion or ecosystem collapse. The 7-23 percentage-point span is derived from the source-reported among-study standard deviation and must not be labelled a confidence interval; methodological subgroups differed materially.'
  }),
  'ocean_heat_content->sea_level_rise': Object.freeze({
    estimand: 'Assessed global mean thermosteric sea-level response per unit increase in globally averaged ocean heat content.',
    estimate: 0.113,
    lower_bound: 0.1,
    upper_bound: 0.126,
    uncertainty_interval: 'IPCC source-reported mean plus or minus one standard deviation for the assessed OHC-to-GMTSL expansion-efficiency coefficient',
    unit: 'metres of global mean thermosteric sea-level change per yottajoule of globally averaged ocean heat-content change',
    exposure_metric: 'Globally integrated ocean heat-content change with the assessed depth and baseline retained',
    exposure_unit: 'yottajoule',
    source_id: 'ipcc_ar6_wgi_chapter_9_thermosteric_conversion',
    outcome_metric: 'Global mean thermosteric sea-level change',
    outcome_unit: 'metres',
    geography: 'Global mean ocean heat content and global mean thermosteric sea-level component',
    period: 'Conversion assessed from two-layer emulators, CMIP6, modern observations and palaeoclimate evidence in IPCC AR6; observed historical context includes 1971-2018',
    evidence_design: 'ipcc_authoritative_assessment_of_physical_conversion_using_emulators_models_modern_observations_and_palaeoclimate_evidence',
    source_locator: {
      url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      section: 'Section 9.2.4.1, Global Mean Thermosteric Sea Level Change: expansion-efficiency coefficient mean and standard deviation 0.113 plus or minus 0.013 metres per yottajoule; consistent OHC-to-GMTSL relationships across two-layer emulators, CMIP6, modern and palaeo observations'
    },
    moderators: ['vertical distribution of ocean heat uptake', 'temperature-dependent seawater expansion coefficient', 'ocean basin and depth coverage', 'salinity and regional steric redistribution', 'circulation and mixing', 'baseline period', 'separate land-ice and land-water mass contributions'],
    boundary: 'The 0.100-0.126 range is mean plus or minus one source-reported standard deviation, not a 95 percent confidence interval. It applies to globally averaged OHC and global mean thermosteric sea level, not total or local relative sea level, sea-surface temperature, global surface-air temperature, or incomplete regional heat-content products.'
  }),
  'farm_heat_stress->crop_yield_volatility': Object.freeze({
    estimand: 'Field-data-constrained global maize-yield response to a one-kelvin warmer temperature exposure, excluding carbon-dioxide fertilization and adaptation.',
    estimate: -7.1,
    lower_bound: -9.9,
    upper_bound: -4.3,
    uncertainty_interval: 'Source-reported estimate plus or minus 2.8 percentage points; retained as the reported uncertainty spread and not relabelled as a 95 percent confidence interval',
    unit: 'percent change in global maize yield per 1 kelvin warmer temperature exposure',
    exposure_metric: 'Warmer crop-growing temperature constrained by field-warming experiments',
    exposure_unit: '1 kelvin temperature increase',
    source_id: 'nature_sustainability_wang_2020_field_constrained_crop_temperature_response',
    outcome_metric: 'Global maize yield response',
    outcome_unit: 'percent change per kelvin',
    geography: 'Global maize-growing systems represented by 48 field-warming sites and gridded crop models',
    period: 'Field experiments and model ensembles synthesized in the 2020 study; response is temperature sensitivity rather than a single forecast year',
    evidence_design: 'emergent_constraint_combining_global_field_warming_experiments_with_gridded_crop_models',
    source_locator: {
      url: 'https://www.nature.com/articles/s41893-020-0569-7',
      section: 'Abstract and results: field-data-constrained maize yield response of -7.1 plus or minus 2.8 percent per kelvin, with greater than 95 percent probability that warming reduces maize yield'
    },
    moderators: ['crop species and cultivar', 'phenological stage', 'water and nutrient status', 'temperature distribution and extreme heat', 'carbon-dioxide fertilization excluded from the response', 'adaptation and management excluded', 'field-site coverage', 'crop-model structure'],
    boundary: 'This is a global maize temperature sensitivity constrained by field experiments and crop models, not a universal crop response, a local heatwave coefficient, or a direct estimate of observed yield volatility. Carbon-dioxide fertilization, precipitation change, adaptation, irrigation, cultivar shifts, pests and economic responses are outside the reported response and can alter realized yields.'
  })
});

const READBACK_FAMILIES = {
  demand_response_to_carbon_emissions_signed_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['demand_response->carbon_emission'],
    locators: [
      {
        url: 'https://www.mdpi.com/2071-1050/16/4/1413',
        section: 'Methods Sections 2-3; Figures 8-12; Discussion; Conclusions: Fangshan hourly dynamic carbon accounting, 108 enterprise load profiles, maximum 10 percent adjustment, modeled before-versus-after emissions, and industry and grid-mix moderators'
      },
      {
        url: 'https://www.eia.gov/todayinenergy/detail.php?id=60482',
        section: 'Hourly operational electricity-demand and generation context retained for measurement design; it does not supply an avoided-emissions coefficient'
      }
    ],
    exact_claim: 'Carbon-aware demand response can reduce electricity-attributable carbon emissions when flexible load is moved from higher- to lower-carbon supply intervals without increasing total energy demand or creating larger rebound emissions.',
    scope: 'Fangshan District, Beijing, for the modeled 108-enterprise case using representative December 2022 hourly power-flow and load data. Any operational estimate elsewhere requires a declared balancing area, counterfactual load baseline, marginal or consumption-based carbon intensity, shifted energy, rebound and imports.',
    counterevidence: 'Peak reduction and cost reduction do not guarantee emissions reduction. Average carbon factors can misstate marginal dispatch effects, low-price hours can be more carbon intensive, and catch-up load, storage loss, imports or production changes can erase the modeled benefit. The Fangshan estimates are modeled potential under a 10 percent flexibility constraint rather than randomized observed abatement.'
  },
  urbanization_to_carbon_emissions_sign_changing_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['urbanization->carbon_emission'],
    locators: [
      {
        url: 'https://doi.org/10.5018/economics-ejournal.ja.2018-44',
        section: 'Methods Sections 3.1-3.2; Tables 8-9; Sections 4.3.5-4.3.8; Conclusions: dynamic Spatial Durbin panel, short- and long-run direct and spillover effects, sign reversal and city-size-distribution effects'
      },
      {
        url: 'https://doi.org/10.1007/s11356-017-0662-2',
        section: 'Abstract and methods summary: Chinese 1980-2014 series, Granger and error-correction analysis, and STIRPAT decomposition across 29 provinces'
      },
      {
        url: 'https://doi.org/10.1186/s42162-024-00344-0',
        section: 'Open full text, Abstract, Methods and Conclusion: Guizhou 2000-2020 VAR, impulse-response and variance-decomposition evidence with time-varying magnitude and direction'
      }
    ],
    exact_claim: 'Urbanization alters territorial carbon emissions through opposing demographic, household, building, transport, industrial, income, technology, land and energy-intensity pathways. The net sign changes by urbanization dimension, place, spatial spillover and time horizon.',
    scope: 'Twenty-nine Chinese provinces in the primary 2000-2013 dynamic spatial-panel study, with independent China-wide evidence through 2014 and Guizhou evidence through 2020. The relationship is not a global urban-population-share elasticity.',
    counterevidence: 'Economic growth, industrialization, energy policy and technology can jointly drive urbanization and emissions. The primary study reports negative short-run but positive long-run urbanization-rate effects, positive city-size-distribution effects and spatial spillovers; other regional analyses also show nonlinear and heterogeneous signs. Territorial inventories omit embodied interregional emissions, and observational panel methods do not identify a randomized causal effect.'
  },
  sectoral_co2_output_to_global_temperature_tcre_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: SECTORAL_CO2_TEMPERATURE_EDGE_KEYS,
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/',
        section: 'D.1.1 and Figure SPM.10: high-confidence near-linear relationship between cumulative anthropogenic CO2 emissions and CO2-caused global warming; assessed 0.45 degrees Celsius best estimate and 0.27-0.63 degrees Celsius likely range per 1000 GtCO2'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/technical-summary/',
        section: 'TS.3.3.1 and Figure TS.18: TCRE definition, multiple-lines-of-evidence assessment, conversion from 1.0-2.3 degrees Celsius per 1000 PgC to 0.27-0.63 degrees Celsius per 1000 GtCO2, and limits beyond this century or under very low and net-negative emissions'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/syr/summary-for-policymakers/',
        section: 'B.5.2: synthesis-report restatement of 0.45 degrees Celsius best estimate and 0.27-0.63 degrees Celsius likely range per 1000 GtCO2, with non-CO2 emissions and Earth-system feedbacks retained as carbon-budget uncertainties'
      }
    ],
    exact_claim: 'Carbon dioxide emitted by the named sector adds to cumulative anthropogenic CO2 and therefore contributes to global surface warming. IPCC AR6 assesses a best-estimate transient response of 0.45 degrees Celsius per 1000 GtCO2, with a likely range of 0.27-0.63 degrees Celsius, for the CO2-only cumulative-emissions relationship.',
    scope: 'Global surface temperature response to cumulative anthropogenic carbon-dioxide emissions over the course of this century and for warming levels up to at least 2 degrees Celsius relative to 1850-1900. Each sectoral edge requires an explicit CO2 inventory boundary and accumulation period before applying the global coefficient.',
    counterevidence: 'The near-linear TCRE relationship does not quantify annual-flow warming, local temperature, or the full climate footprint of a sector. Co-emitted methane, nitrous oxide, ozone precursors, cooling aerosols, aviation contrails, land-surface albedo, upstream emissions, displaced generation and lifecycle effects can change near-term or net sector influence. Beyond this century and under very low or net-negative CO2 emissions, path dependence and uncertain Earth-system feedbacks reduce confidence in TCRE as a standalone predictor.'
  },
  compound_and_nocturnal_heat_mortality_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['compound_day_night_heat_extremes->heatwave_excess_mortality_rates', 'nocturnal_heat_stress->heatwave_excess_mortality_rates'],
    locators: [
      { url: 'https://www.nature.com/articles/s43856-024-00557-0', section: 'Methods and Results: 161 Chinese communities, 2007-2013, community-specific daytime-only, nighttime-only and compound heat-wave definitions, quasi-Poisson models and random-effects pooling; non-accidental mortality changes and 95 percent intervals over lag 0-1 days' },
      { url: 'https://www.sciencedirect.com/science/article/pii/S2542519622001395', section: 'Twenty-eight-city East Asian time-series and scenario study: hot-night mortality association and projected attributable fractions under SSP126 and SSP245, retained as corroboration rather than substituted for the China event coefficients' }
    ],
    exact_claim: 'Sustained compound daytime-nighttime heat was associated with a substantially larger short-lag non-accidental mortality increase than nighttime-only heat in the assessed Chinese communities; the nighttime-only estimate was positive but its 95 percent confidence interval included zero.',
    scope: 'Community-specific hot-season heat-wave event days in 161 Chinese districts and counties during 2007-2013, with daytime-only, nighttime-only and compound exposures kept separate and cumulative mortality response evaluated over lag 0-1 days.',
    counterevidence: 'The nighttime-only pooled interval crosses zero. Threshold selection, duration, humidity, air pollution, acclimatization, housing, cooling, age, disease and local climate modify the associations. The estimates are not per-degree effects, future projections, individual probabilities or transferable global coefficients, and compound exposure cannot be inferred by adding daytime-only and nighttime-only estimates.'
  },
  wildfire_pm25_exposure_burden_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['pm2_5_particulates->smoke_exposure_burden'],
    locators: [
      { url: 'https://www.who.int/health-topics/wildfires', section: 'Wildfire Impact, lines 218-227: smoke pollutant mixture, particulate matter as the principal public-health threat, PM2.5-associated premature mortality and multi-organ morbidity, with exposure and population boundaries' },
      { url: 'https://www.epa.gov/wildfire-smoke-course/health-effects-attributed-wildfire-smoke-0', section: 'Health Effects from Smoke and Scientific Evidence, lines 80-91: short-term wildfire-smoke PM2.5 evidence, respiratory and cardiovascular emergency visits, morbidity and premature mortality, co-pollutants and vulnerable groups' }
    ],
    exact_claim: 'Fine particulate matter is the principal measured public-health hazard in wildfire smoke and is a defensible exposure metric for smoke burden, while health outcomes depend on concentration, duration, composition, population and co-exposures.',
    scope: 'Named wildfire-smoke episode and exposed population with smoke-attributed PM2.5 concentration, duration, spatial coverage, infiltration or personal exposure and relevant respiratory, cardiovascular or mortality outcome measured over an explicit lag.',
    counterevidence: 'PM2.5 is not the whole smoke mixture: ozone, gases and toxic compounds contribute, while indoor filtration, behavior and evacuation change personal exposure. Ambient concentration does not equal inhaled dose, smoke-source attribution can be uncertain, and a PM2.5 exposure metric is not itself a health-effect coefficient or case count.'
  },
  humidity_wet_bulb_heat_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['humidity_amplification->wet_bulb_heat'],
    locators: [
      { url: 'https://repository.library.noaa.gov/view/noaa/59273/noaa_59273_DS1.pdf', section: 'Abstract and Introduction: wet-bulb temperature jointly represents heat and humidity, high humidity limits sweat-based latent cooling, extreme humid heat observations and spatial and measurement uncertainty' },
      { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', section: 'How heat impacts health, lines 237-246: high temperature and high humidity impede elimination of metabolic heat and raise heat-exhaustion, heatstroke, cardiovascular and kidney risk' }
    ],
    exact_claim: 'At a given dry-bulb temperature and pressure, increasing atmospheric moisture raises wet-bulb temperature and reduces the evaporative-cooling gradient available to people; the resulting hazard depends on the full temperature-humidity state, not humidity alone.',
    scope: 'Named station or gridded cell and subdaily period with co-located dry-bulb temperature, humidity or dew point, pressure and a declared psychrometric wet-bulb method, with exposure duration and human activity considered separately.',
    counterevidence: 'Higher humidity at lower air temperature need not create dangerous wet-bulb heat, and dry extreme heat can still be lethal through other heat-balance pathways. Wind, radiation, clothing, activity, acclimatization and cooling access alter physiological strain. Station coverage and gridded reanalysis can miss highly localized extremes, so humidity is neither a standalone hazard coefficient nor proof of human exposure.'
  },
  cement_direct_emissions_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['cement_process_emissions->carbon_emission'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/', section: 'Section 11.4.1.2, lines 1547-1564: 2019 global direct cement emissions, energy-versus-process shares, clinker chemistry, carbonation, clinker substitution and capture boundaries' },
      { url: 'https://edgar.jrc.ec.europa.eu/dataset_ghg2025', section: 'Country-sector annual greenhouse-gas inventory categories used by the platform to operationalize cement and other industrial-process emissions without converting sector totals into marginal coefficients' }
    ],
    exact_claim: 'Cement production directly releases carbon dioxide through high-temperature process heat and limestone calcination; IPCC assesses global direct cement emissions at 2.1-2.5 GtCO2-equivalent in 2019, typically about 40 percent process heating and 60 percent process chemistry.',
    scope: 'Global cement sector in 2019 for the assessment range; plant or country application requires clinker production, clinker ratio, kiln fuel and efficiency, process-carbonate chemistry, capture and inventory boundary on a matched period.',
    counterevidence: 'The range combines energy and process emissions and is not a per-tonne coefficient or confidence interval. Clinker substitution, lower-carbon heat, efficiency, alternative chemistry, carbonation and carbon capture change net emissions. Concrete lifecycle and indirect electricity emissions must not be mixed into the direct-sector estimate without explicit accounting.'
  },
  steel_direct_emissions_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['steel->carbon_emission'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/',
        section: 'Section 11.4.1.1 Steel: global crude-steel production, route mix, 3.7-4.1 GtCO2-equivalent emissions range depending on scope, and about 20 percent share of global direct industrial emissions in 2019'
      },
      {
        url: 'https://www.iea.org/reports/demand-and-supply-measures-for-the-steel-and-cement-transition/executive-summary',
        section: 'Independent sector-transition assessment of conventional steel routes, material demand, production technologies and emissions-reduction boundaries'
      }
    ],
    exact_claim: 'Conventional iron and steel production releases greenhouse gases through coke and reductant use, fuel combustion, process gases and electricity. IPCC assesses global steel-production emissions at 3.7-4.1 GtCO2-equivalent in 2019, depending on the accounting scope.',
    scope: 'Global steel sector in 2019 for the assessment range. Plant, product or country application requires crude-steel output, blast-furnace, direct-reduced-iron and electric-arc route shares, scrap, ore, fuel, electricity, process-gas reuse, capture and direct-versus-indirect accounting boundaries on a matched period.',
    counterevidence: 'The range reflects different source boundaries rather than a statistical confidence interval. Scrap-based electric-arc production, low-carbon electricity, hydrogen reduction, biomass, efficiency, material demand, product longevity and carbon capture can materially change emissions. The global annual total is not a per-tonne factor or marginal effect.'
  },
  warming_compound_hazards_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['temp->environ_anomalies'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
        section: 'Executive Summary and Sections 11.3-11.8: observed and projected changes in heat, heavy precipitation, drought, fire weather, tropical cyclones and compound events across warming levels, with regional confidence and attribution boundaries'
      },
      {
        url: 'https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025',
        section: 'Observed global climate state and major concurrent heat, precipitation, drought, wildfire and tropical-cyclone extremes during 2025; retained as event context rather than a causal coefficient'
      }
    ],
    exact_claim: 'Higher global temperature shifts the probability, intensity or spatial footprint of multiple climate extremes and increases the possibility of compound hazards, but the response differs by hazard type and region.',
    scope: 'A declared global-warming level connected to a separately defined heat, heavy-precipitation, drought, fire-weather, tropical-cyclone or compound-event metric for a named region and period. Individual 2025 events remain observational context and are not attributed solely from the global mean.',
    counterevidence: 'Internal variability, circulation modes, aerosols, land use and regional forcing can amplify or suppress individual hazards. Drought direction depends on region and definition, tropical-cyclone frequency and intensity are distinct, and compound events require joint-variable and dependence analysis. A global-temperature anomaly cannot be converted into a universal local hazard multiplier.'
  },
  aerosol_masking_loss_temperature_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['aerosol_cooling_loss->temp'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
        section: 'Sections 7.3.3.4 and 7.3.5, Figure 7.5 and Table 7.8: total anthropogenic aerosol effective radiative forcing, aerosol-cloud and aerosol-radiation components, 1750-2014 and 1750-2019 assessed ranges, and temperature-response context'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/',
        section: 'Short-lived climate-forcer emissions, chemistry, regional heterogeneity and climate-response boundaries for aerosols and precursors'
      }
    ],
    exact_claim: 'Anthropogenic aerosols exert a net negative effective radiative forcing, so reducing that negative forcing can add near-term warming unless greenhouse-gas forcing falls sufficiently at the same time. IPCC assesses total aerosol forcing at -1.3 [-2.0 to -0.6] W m-2 for 1750-2014 and -1.1 [-1.7 to -0.4] W m-2 for 1750-2019.',
    scope: 'Global-mean aerosol effective radiative forcing relative to the stated preindustrial baseline. Any emissions-policy or regional application requires aerosol species, precursor, location, atmospheric chemistry, cloud regime, co-emitted greenhouse gases, time horizon and air-quality pathway.',
    counterevidence: 'The assessed forcing ranges are not direct temperature coefficients. Aerosol composition and location matter, black carbon can warm, cloud adjustments dominate uncertainty, and co-emitted greenhouse-gas reductions can offset masking loss. Cleaner air does not imply a fixed warming pulse, and health benefits remain a separate endpoint.'
  },
  warming_surface_ozone_penalty_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['temp->ozone_formation_pressure'],
    locators: [
      {
        url: 'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics',
        section: 'How ground-level ozone forms: nitrogen oxides and volatile organic compounds react in sunlight; unhealthy concentrations are most likely on hot sunny urban days, with transport and colder-season exceptions'
      },
      {
        url: 'https://www.epa.gov/ozone-pollution-and-your-patients-health/what-ozone',
        section: 'Meteorology, precursor chemistry, exposure and health context for ground-level ozone episodes'
      }
    ],
    exact_claim: 'Warmer sunny conditions can increase the photochemical pressure for ground-level ozone formation where nitrogen-oxide and reactive-organic precursors are available, while transport and chemical regime determine the realized concentration.',
    scope: 'Named airshed and ozone season with temperature, sunlight, stagnation or mixing, nitrogen oxides, compound-resolved volatile organic compounds, transported background ozone and monitored eight-hour or source-defined ozone concentration measured on compatible time scales.',
    counterevidence: 'Temperature alone cannot create ozone without precursors and sunlight. Ozone can be transported, colder-season episodes occur, and precursor reductions can dominate the meteorological response. In nitrogen-oxide-saturated regimes, chemistry is nonlinear and some local emission changes can initially raise ozone, so no universal per-degree concentration coefficient is implied.'
  },
  warming_dryland_degradation_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['temp->desertification_frontiers'],
    locators: [
      {
        url: 'https://www.ipcc.ch/srccl/chapter/chapter-3/',
        section: 'Executive Summary and Sections 3.4-3.7: climate-change contribution to dryland water scarcity, vegetation and soil change, attribution limits, socioeconomic drivers, regional projections and response options'
      },
      {
        url: 'https://www.unccd.int/land-and-life/desertification/overview',
        section: 'UNCCD definition and human-climate driver framing for land degradation in arid, semi-arid and dry sub-humid areas'
      }
    ],
    exact_claim: 'Warming can increase evaporative demand and, where precipitation, soil moisture and land management do not compensate, contribute to dryland vegetation loss, soil degradation and desertification risk.',
    scope: 'Named arid, semi-arid or dry sub-humid region with temperature, precipitation, atmospheric demand, soil moisture, vegetation or productivity, erosion, grazing or cultivation pressure and land-degradation outcome measured over a declared multi-year period.',
    counterevidence: 'Desertification is land degradation in drylands, not simple climatic desert expansion. Precipitation change can offset warming, carbon-dioxide effects can alter water-use efficiency, and grazing, cultivation, fire, groundwater use, governance and restoration often dominate local outcomes. A global-temperature increase does not prove degradation at a particular site.'
  },
  warming_bark_beetle_tree_mortality_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['temp->bark_beetle_epidemics', 'temp->overstory_tree_mortality'],
    locators: [
      {
        url: 'https://research.fs.usda.gov/treesearch/63775',
        section: 'Abstract and full text: coupled western-pine-beetle and host-tree model evaluated against field observations; warming effects on development and overwinter survival; 29.9 percent mortality increase with 95 percent CI 29.4-30.2 during the California drought'
      },
      {
        url: 'https://toolkit.climate.gov/NCA5',
        section: 'Box 7.1 Bark Beetles and Climate Change: warming-sensitive life cycles and overwinter survival, drought-compromised host defense, California mortality attribution and limits across beetle-host systems'
      },
      {
        url: 'https://eros.usgs.gov/earthshots/the-beetles-attack',
        section: 'Warm dry summers, mild winters, host defense and successive favorable years as conditional outbreak controls, with Landsat-observed forest-cover damage'
      }
    ],
    exact_claim: 'Warming can intensify some bark-beetle impacts by accelerating development and reducing larval overwinter mortality, especially when severe drought compromises host defense. In the modeled California western-pine-beetle pathway, contemporary warming was attributed 29.9 percent more ponderosa-pine mortality during drought.',
    scope: 'The numerical estimate applies to western pine beetle and ponderosa pine in the Sierra Nevada during the 2012-2015 meteorological drought and lagged tree response through 2016. The broader mechanism applies only to named beetle-host systems with observed temperature, drought, life cycle, winter survival, host defense and mortality.',
    counterevidence: 'Responses differ by beetle species, host, latitude, temperature range, season and stand condition; heat can exceed beetle tolerance, precipitation can restore host defense, and other insects and mortality agents contribute. The 29.9 percent estimate is process-model attribution evaluated against observations, not a universal per-degree coefficient or a direct temperature-only effect.'
  },
  carbon_emissions_water_cycle_outcomes_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: [
      'carbon_emission->freshwater_ecosystem_collapse',
      'carbon_emission->flash_flood_regime',
      'carbon_emission->snowmelt_timing_shift',
      'carbon_emission->snow_drought'
    ],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/syr/summary-for-policymakers/',
        section: 'A.1 and Figure SPM.1: greenhouse-gas emissions unequivocally caused global warming; the synthesis separates emissions, warming, climate hazards, exposure and impacts'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/',
        section: 'Executive Summary and Sections 4.2.1-4.3.5: human influence through increased greenhouse-gas concentrations, hydrological-cycle intensification, heavy precipitation, floods, drought, snow and glacier change, and freshwater-ecosystem impacts'
      }
    ],
    exact_claim: 'Cumulative greenhouse-gas emissions alter radiative forcing and climate, which can change snow accumulation and melt timing, drought and heavy-precipitation conditions, flood-generating processes, water quality and freshwater ecosystems. These graph edges represent mediated emissions-to-impact pathways, not direct event attribution.',
    scope: 'A declared emissions inventory and period linked through an assessed forcing or warming pathway to a named watershed, snow region or freshwater ecosystem with precipitation, temperature, snow, antecedent state, flow, water quality and ecological response measured on compatible temporal scales.',
    counterevidence: 'Emissions are globally mixed and do not determine a particular local event. Internal variability, circulation, elevation, precipitation phase, land cover, dams, drainage, abstractions, pollution, invasive species and ecosystem management can dominate local outcomes. Flood exposure and damage are not flood hazard, snow drought can be temperature- or precipitation-driven, and freshwater collapse requires ecological evidence beyond a climate anomaly.'
  },
  carbon_emissions_ocean_system_outcomes_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: [
      'carbon_emission->marine_food_web_simplification',
      'carbon_emission->coastal_hypoxia',
      'carbon_emission->ocean_salinity_stratification',
      'carbon_emission->ocean_current_regime_shift',
      'carbon_emission->coral_bleaching'
    ],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/syr/summary-for-policymakers/',
        section: 'A.1-A.2: greenhouse-gas emissions, observed warming and widespread changes and impacts in the atmosphere, ocean, cryosphere and biosphere'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
        section: 'Executive Summary and Sections 9.2-9.3: anthropogenic ocean warming, upper-ocean stratification and salinity-pattern change, circulation and cryosphere responses with regional and model uncertainty'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
        section: 'Executive Summary and Sections 3.2-3.5: emissions-scenario dependence of warming, acidification, deoxygenation and sea-level rise; coral bleaching, species redistribution, food-web and connectivity impacts'
      }
    ],
    exact_claim: 'Greenhouse-gas emissions drive warming and carbon-cycle changes that can alter ocean heat, salinity, stratification, oxygen, circulation and acidity; those physical and chemical changes can in turn disrupt coral reefs and marine food webs. Each displayed edge is therefore a multi-step emissions-to-ocean outcome pathway.',
    scope: 'A stated emissions pathway and period linked through measured or modelled ocean heat, dissolved inorganic carbon, salinity, density, oxygen or circulation to a named basin, coastal water body, reef or food web. Physical intermediates and biological endpoints must be retained separately.',
    counterevidence: 'Regional winds, freshwater fluxes, internal variability, nutrient loading, sewage, fishing, habitat loss, disease and local adaptation can dominate the observed endpoint. Coastal hypoxia is often nutrient-driven; circulation and salinity responses vary by basin; food webs can reorganize without simply losing complexity; coral bleaching depends on local thermal exposure and recovery. No universal emissions-to-local-outcome coefficient is implied.'
  },
  carbon_emissions_arctic_sea_ice_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['carbon_emission->sea_ice_season_loss'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
        section: 'Section 9.3.1 and Figure 9.14: satellite-observed Arctic sea-ice-area decline is approximately linear in global surface temperature and cumulative anthropogenic CO2 emissions, with superimposed internal variability'
      },
      {
        url: 'https://doi.org/10.1126/science.aag2345',
        section: 'Abstract and main results: observed September Arctic sea-ice sensitivity of 3 plus or minus 0.3 square metres lost per metric tonne of cumulative anthropogenic CO2 emissions'
      },
      {
        url: 'https://nsidc.org/sea-ice-today/analyses/sea-ice-hits-record-lows',
        section: 'Independent NSIDC explanation of the observed cumulative-CO2 relationship, satellite record and model-versus-observation sensitivity boundary'
      }
    ],
    exact_claim: 'Observed pan-Arctic September sea-ice area declines approximately linearly with cumulative anthropogenic carbon-dioxide emissions over the assessed record; the primary study reports 3 plus or minus 0.3 square metres of September area lost per additional metric tonne of CO2.',
    scope: 'Pan-Arctic monthly-mean September sea-ice area and cumulative anthropogenic CO2 over the observational reconstruction used by Notz and Stroeve. Other months, sea-ice extent, thickness, age, melt onset, regional sectors and Antarctic sea ice require separate metrics and estimates.',
    counterevidence: 'Internal variability and winds create year-to-year and regional departures, observational products differ, and climate models generally simulate a lower sensitivity. The relationship cannot continue below zero ice area, does not quantify local melt-season duration, and does not make one emitter observationally attributable to a particular patch of ice.'
  },
  carbon_emissions_human_system_outcomes_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: [
      'carbon_emission->compound_day_night_heat_extremes',
      'carbon_emission->food_insecurity',
      'carbon_emission->migration'
    ],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/syr/summary-for-policymakers/',
        section: 'A.1-C.2: emissions caused warming; every increment of warming intensifies multiple hazards and losses, while impacts depend on exposure, vulnerability and adaptation'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
        section: 'Executive Summary and heat-extreme assessment: human influence has increased hot extremes and further warming increases their frequency and intensity, with regional and event-definition boundaries'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/technical-summary/',
        section: 'TS.B.6, TS.C.3 and TS.C.7: climate hazards affect food security, livelihoods, displacement and migration; migration direction and magnitude remain highly context-specific and socioeconomic conditions can enable movement or trap exposed populations'
      }
    ],
    exact_claim: 'Greenhouse-gas emissions increase warming and climate-hazard exposure, which can raise compound heat risk, stress food production and access, and contribute to displacement or migration through damage and livelihood pathways. Emissions are an upstream driver; the social outcomes require explicit hazard, exposure and vulnerability mediators.',
    scope: 'A declared emissions or warming scenario linked to a named regional heat metric, food system or population over a stated period, with socioeconomic pathway, adaptation, exposure, prices, income, conflict, governance and migration definition retained.',
    counterevidence: 'Food insecurity and migration are multicausal. Trade, prices, poverty, conflict, policy, land tenure, labour demand, household assets and social protection can dominate or reverse the response; climate shocks can increase mobility or create involuntary immobility. Compound day-night heat requires separate daytime and nighttime thresholds. These edges must not be rendered as direct per-tonne social-effect coefficients.'
  },
  carbon_emissions_compound_hazards_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['carbon_emission->environ_anomalies'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/',
        section: 'A.1.3, A.3.1-A.3.5 and Figure SPM.3: human influence has warmed the atmosphere, ocean and land and has increased multiple classes of hot, heavy-precipitation, drought and compound extreme events'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/technical-summary/',
        section: 'TS.B.2-TS.B.6: observed impacts and risks from concurrent and repeated climate hazards, with exposure, vulnerability, adaptation and non-climatic drivers retained'
      }
    ],
    exact_claim: 'Anthropogenic greenhouse-gas emissions increase radiative forcing and warming, which can increase the frequency or intensity of multiple climate hazards and compound events. The relationship runs from emissions to compound hazards, not from a hazard count to fossil-fuel emissions.',
    scope: 'A declared cumulative greenhouse-gas emissions or forcing pathway linked to a source-defined compound-hazard pair or tuple, fixed thresholds, named geography, baseline and analysis period. Individual-event attribution and local impact require separate evidence.',
    counterevidence: 'Natural variability, circulation, aerosols, land-use change, event definition, spatial dependence and threshold choice affect compound-event trends. Emissions do not determine the timing or magnitude of a particular local event, and compound-hazard days are not an emissions inventory.'
  },
  warming_natural_methane_feedback_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['temp->methane'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/',
        section: 'Executive Summary, paragraphs on Future Projections of Carbon Feedbacks: the net response of natural methane and nitrous-oxide sources to warming is increased emissions at medium confidence; individual-process magnitudes and linearity have low confidence'
      },
      {
        url: 'https://gml.noaa.gov/ccgg/trends_ch4/',
        section: 'NOAA globally averaged atmospheric methane trend and growth-rate record; atmospheric concentration is retained as an observation of burden, not as source attribution'
      }
    ],
    exact_claim: 'Warming is expected to increase net natural methane emissions through processes including wetland methane production and permafrost thaw, but IPCC assesses low confidence in the magnitude and linear proportionality of the individual methane response.',
    scope: 'Named wetland or permafrost region, or a reconciled global methane budget, with global or local temperature, water table, substrate, methane production, oxidation, transport and flux measured over a declared seasonal to multi-decadal period.',
    counterevidence: 'Drying can suppress wetland methane; oxidation can prevent produced methane from reaching the atmosphere; permafrost carbon can be emitted as carbon dioxide rather than methane; anthropogenic sources and atmospheric-lifetime changes dominate or confound many observed methane trends. The IPCC combined methane-plus-nitrous-oxide feedback range cannot be assigned to methane alone.',
    measurement_contracts: {
      exposure: {
        metric_id: 'global_mean_surface_temperature_anomaly',
        metric_name: 'Global mean surface temperature anomaly above 1850-1900',
        unit: 'degrees Celsius',
        geography: 'global, with any regional transfer declared separately',
        cadence: 'monthly with annual synthesis',
        source_id: 'nasa_giss_surface_temperature_analysis',
        uncertainty: 'Coverage, homogenization, sea-surface-temperature methods, baseline conversion and internal variability affect the warming estimate.'
      },
      outcome: {
        metric_id: 'natural_methane_emission_flux',
        metric_name: 'Natural methane emissions attributed to wetlands, permafrost or another declared process',
        unit: 'teragrams CH4 per year',
        geography: 'named wetland or permafrost domain, or reconciled global methane budget',
        cadence: 'seasonal to annual with multi-year synthesis',
        source_id: 'global_methane_budget_with_process_attribution',
        uncertainty: 'Wetland extent, water table, substrate, oxidation, transport, inversion priors, atmospheric sinks and source partitioning create large uncertainty.'
      }
    }
  },
  drained_temperate_forest_organic_soil_emissions_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['wetlands_drainage_scales->carbon_emission'],
    locators: [
      {
        url: 'https://www.ipcc-nggip.iges.or.jp/public/wetlands/pdf/Wetlands_separate_files/WS_Chp2_Drained_Inland_Organic_Soils.pdf',
        section: 'Chapter 2, Equation 2.3 and Table 2.1: drained-organic-soil area multiplied by a land-use-, climate- and nutrient-class-specific emission factor; temperate drained forest mean 2.6 with 95 percent confidence interval 2.0-3.3 tonnes CO2-C per hectare per year'
      },
      {
        url: 'https://www.fao.org/4/i3013e/i3013e.pdf',
        section: 'FAO peatland mitigation guidance: drainage lowers water tables, admits oxygen and sustains peat oxidation and carbon-dioxide emissions while peat remains drained'
      },
      {
        url: 'https://www.unep.org/news-and-stories/story/seven-things-you-should-know-about-peatlands',
        section: 'UNEP mechanism corroboration and accounting boundary: drainage exposes carbon-rich peat to oxygen, accelerating organic-matter decay; mapped estimates use drained-area data and IPCC emission factors and exclude fire'
      }
    ],
    exact_claim: 'Drainage of organic soil can create sustained on-site carbon-dioxide emissions through aerobic decomposition. For temperate drained forest organic soils, the IPCC Tier 1 synthesis reports 2.6 tonnes CO2-C per hectare per year with a 95 percent confidence interval of 2.0-3.3.',
    scope: 'Temperate forest land remaining on drained organic soil under the IPCC Wetlands Supplement classification. Area, climate zone, land use, nutrient status and drainage state must be declared; other classes use their own source-reported factors.',
    counterevidence: 'Flux varies strongly by land use, climate, nutrient status, water table, vegetation and time since drainage. Some drained forest organic soils can approach neutral or net sink conditions, and total ecosystem balance also includes vegetation, dissolved carbon, methane, nitrous oxide and fire. The selected factor must not be generalized to all wetlands or added to fossil-and-industrial emissions without a compatible inventory boundary.'
  },
  fossil_operation_and_decarbonization_gap_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: [
      'peaker_plant_lock_in->carbon_emission',
      'road_freight_diesel_lock_in->carbon_emission',
      'freight_electrification_gap->carbon_emission',
      'steel_decarbonization_gap->carbon_emission',
      'industrial_heat_decarbonization_gap->carbon_emission',
      'backup_generator_dependence->carbon_emission'
    ],
    locators: [
      {
        url: 'https://www.epa.gov/transportation-air-pollution-and-climate-change/carbon-pollution-transportation',
        section: 'Transportation and Climate Change and EPA Programs: gasoline and diesel combustion releases carbon dioxide; heavy-duty standards, freight efficiency and fuel use define the relevant road-freight boundary'
      },
      {
        url: 'https://www.epa.gov/regulations-emissions-vehicles-and-engines/regulations-greenhouse-gas-emissions-commercial-trucks',
        section: 'Phase 3 heavy-duty greenhouse-gas standards: covered vocational vehicles and tractors, model years, test and compliance boundary, and explicit distinction between standards and realized fleet emissions'
      },
      {
        url: 'https://www.epa.gov/egrid',
        section: 'Plant, generator, fuel, generation and emissions inventory fields used to measure operating fossil-electricity emissions rather than infer them from capacity or lock-in labels'
      },
      {
        url: 'https://www.eia.gov/energyexplained/natural-gas/natural-gas-and-the-environment.php',
        section: 'Natural-gas combustion carbon-dioxide emissions and separate upstream methane boundary'
      },
      {
        url: 'https://www.iea.org/reports/iron-and-steel-technology-roadmap',
        section: 'Executive Summary: coal-intensive steel energy use, direct emissions, young blast-furnace fleet, cumulative asset-lock-in risk, scrap constraints and near-zero production pathways'
      },
      {
        url: 'https://www.energy.gov/cmei/ito/process-heat-basics',
        section: 'Industrial process-heat definition, equipment and temperature range; source energy and process route must be retained before assigning emissions'
      }
    ],
    exact_claim: 'Continued operation of fossil-fuel peakers, backup generators, diesel freight vehicles, coal-intensive steel capacity, and unabated industrial heat equipment sustains carbon-dioxide emissions. A decarbonization or electrification gap is therefore a persistence condition for emissions, not itself a fuel-specific emissions factor.',
    scope: 'Named plant, generator, vehicle fleet, steel route or industrial process with fuel or electricity source, activity, load or duty cycle, efficiency, controls, operating period and direct-versus-lifecycle accounting boundary declared. Technology-gap claims additionally require the available alternative, replacement timing and counterfactual operation.',
    counterevidence: 'Installed capacity, equipment age or a policy gap does not prove operation or emissions. Low utilization, retirement, fuel switching, efficiency, zero-carbon electricity, hydrogen, scrap-based production, carbon capture and operational changes can reduce the pathway. Upstream methane, embodied infrastructure, displaced grid generation and policy-projected avoided emissions are separate estimands; no universal marginal coefficient is assigned.'
  },
  warming_rail_heat_buckling_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['temp->rail_heat_buckling'],
    locators: [
      {
        url: 'https://www.networkrail.co.uk/rail-travel/delays-explained/buckled-rail-and-summer-heat/',
        section: 'Why rails buckle and prevention: sunlit rail can be up to 20 degrees Celsius hotter than air; most of the network can operate to about 46 degrees Celsius track temperature; stressing, maintenance, speed restrictions, white paint and track form moderate failure risk'
      },
      {
        url: 'https://safety.networkrail.co.uk/wp-content/uploads/2023/12/Climate-Change-Adaptation-Report-2021.pdf',
        section: 'Network Rail climate-adaptation assessment: rail temperature, continuous-welded and jointed track, thermal stress, monitoring and asset-management boundary'
      }
    ],
    exact_claim: 'Higher air temperature and solar heating raise steel-rail temperature and compressive stress, increasing buckling risk when track temperature exceeds the range supported by rail stressing, track form and maintenance condition.',
    scope: 'Great Britain rail infrastructure for the reported operating examples, with local air and rail temperature, solar exposure, stress-free temperature, track construction, ballast or slab condition, maintenance, speed restriction and buckling event retained at the route and event level.',
    counterevidence: 'Air temperature is not rail temperature and heat does not make every rail buckle. Rail stressing, continuous welding, expansion gaps, concrete slab track, ballast condition, white paint, monitoring and speed restrictions materially change risk. The reported 20-degree rail-air difference and 46-degree operating reference are engineering context, not a global-temperature effect coefficient.'
  },
  warming_ragweed_pollen_season_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['temp->pollen_allergen_spikes'],
    locators: [
      {
        url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P101FUWR.txt',
        section: 'EPA Ragweed Pollen Season technical documentation: 11 North American sites, 1995-2015 start and end definitions, regression method, seven statistically significant site trends, frost and temperature mechanism, comparability and uncertainty'
      },
      {
        url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1018XLM.TXT',
        section: 'EPA indicator: ragweed season lengthened at 10 of 11 studied sites; warmer spring and fall conditions and carbon dioxide can affect timing and pollen production, with site-specific rather than universal changes'
      }
    ],
    exact_claim: 'Warmer seasonal temperatures and more frost-free days can lengthen ragweed pollen season by shifting flowering and the first fall frost; EPA reports a longer 1995-2015 season at 10 of 11 studied central North American sites, with statistically significant trends at seven.',
    scope: 'Eleven central United States and Canadian pollen-monitoring sites from 1995 through 2015, using the EPA one-percent to 99-percent cumulative-count season definition and site-specific regression. Other species, regions, total pollen load and allergen potency require separate evidence.',
    counterevidence: 'The indicator is not a temperature-only experiment. Wind, rain, transported pollen, plant distribution, pests, disease, station method and carbon dioxide affect observed timing or pollen production. Absolute counts are not comparable across different station methods, and one site did not lengthen; no universal days-per-degree coefficient is implied.'
  },
  warming_alpine_snowpack_exact_readback: {
    reviewed_at: '2026-07-25',
    keys: ['temp->alpine_snowpack_declines'],
    locators: [
      {
        url: 'https://pubs.usgs.gov/publication/70045945',
        section: 'Abstract: Rocky Mountain observations and snow model; spring warming since the 1980s drove most recent synchronous low- to mid-elevation snowpack decline while precipitation and decadal variability remained important'
      },
      {
        url: 'https://www.usgs.gov/publications/sensitivity-a-high-elevation-rocky-mountain-watershed-altered-climate-and-co2',
        section: 'Abstract: Loch Vale watershed model scenarios; 4 degrees Celsius warming reduced modeled snowpack 50 percent and advanced runoff and soil-water timing by four to five weeks'
      },
      {
        url: 'https://snow.nasa.gov/science',
        section: 'NASA snow science and observation context for snow water equivalent, extent, timing and remote-sensing limitations'
      }
    ],
    exact_claim: 'Warming can reduce mountain snowpack and advance melt and runoff timing, especially where winter precipitation falls near the rain-snow transition. In one Loch Vale watershed model experiment, a four-degree Celsius warming scenario reduced snowpack by 50 percent and advanced runoff and soil-water timing by four to five weeks.',
    scope: 'The numerical scenario applies to the modeled high-elevation Loch Vale watershed and its stated climate and carbon-dioxide experiment. The observational attribution applies to the twentieth-century Rocky Mountains, especially low and middle elevations since the 1980s. Snow water equivalent, precipitation, elevation, season and basin must remain explicit.',
    counterevidence: 'Precipitation amount and phase, elevation, aspect, storms, wind redistribution, dust, vegetation, decadal variability and model structure all affect snowpack. Cold high-elevation basins can respond differently, and warming can coincide with greater snow where precipitation increases sufficiently. The 50-percent response is a scenario result without a reported uncertainty interval, not a universal per-degree estimate.'
  },
  gas_power_direct_emissions_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['gas_power_dependence->carbon_emission'],
    locators: [
      { url: 'https://www.ipcc.ch/site/assets/uploads/2018/02/ipcc_wg3_ar5_annex-iii.pdf', section: 'Table A.III.2, Gas - Combined Cycle row: commercially available natural-gas combined-cycle direct emissions minimum 350, median 370 and maximum 490 gCO2eq/kWh; lifecycle values are reported separately' },
      { url: 'https://www.eia.gov/environment/emissions/co2_vol_mass.php', section: 'Energy-related carbon-dioxide emission coefficients by fuel, retained as independent corroboration that combusting natural gas releases carbon dioxide while plant heat rate and operating conditions determine electricity intensity' }
    ],
    exact_claim: 'Generating electricity in a commercially available natural-gas combined-cycle plant directly emits carbon dioxide; the IPCC technology synthesis reports a median direct intensity of 370 gCO2-equivalent per kWh, with an assessed 350-490 minimum-to-maximum span.',
    scope: 'Natural-gas combined-cycle electricity within the IPCC direct generation-stage boundary. Application to a plant, fleet or balancing area requires matched heat rate, fuel composition, load, cycling, period and dispatch boundary.',
    counterevidence: 'The span is literature heterogeneity, not a confidence interval. Efficient plants can be lower and inefficient or cycling plants higher. Upstream methane leakage, fuel processing, infrastructure and displaced grid generation are outside the direct row; gas dependence is therefore not itself a universal marginal emissions coefficient.'
  },
  farm_gate_methane_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['industry_farming->methane'],
    locators: [
      { url: 'https://www.ipcc.ch/srccl/chapter/chapter-5/', section: 'Section 5.4.2 and Table 5.4 discussion: global crop and livestock activities within the farm gate emitted 142 plus or minus 42 MtCH4 per year during 2007-2016, with sources including enteric fermentation, manure and rice cultivation' },
      { url: 'https://www.fao.org/faostat/en/#data/GT', section: 'FAOSTAT emissions totals by agricultural source category, country and year, retained for operational disaggregation rather than treating the global assessment as a farm-level coefficient' }
    ],
    exact_claim: 'Crop and livestock production within the farm-gate boundary is a major methane source; the IPCC assessment reports 142 plus or minus 42 million tonnes CH4 per year globally during 2007-2016.',
    scope: 'Global annual crop and livestock activities inside the farm gate for 2007-2016. Regional or production-system use requires separate activity data and source-specific factors for enteric fermentation, manure, rice and other included categories.',
    counterevidence: 'The estimate is an annual source contribution, not the marginal effect of industrialization, a per-animal or per-tonne coefficient, or a complete food-system footprint. Feed, species, productivity, manure treatment, rice-water regime and inventory methods materially change emissions, and post-farm-gate and fossil methane are excluded.'
  },
  tropical_deforestation_carbon_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['deforestation->carbon_emission'],
    locators: [
      { url: 'https://www.ipcc.ch/srccl/chapter/chapter-4/', section: 'Section 4.4.3: assessed annual carbon-emission estimates from tropical deforestation and forest degradation span 0.5-3.5 GtC per year across bookkeeping, remote-sensing and land-carbon methods' },
      { url: 'https://www.fao.org/forest-resources-assessment/en/', section: 'FAO Global Forest Resources Assessment definitions and country-reported forest-area change, retained to bound forest loss and avoid equating every tree-cover change observation with deforestation emissions' }
    ],
    exact_claim: 'Tropical deforestation and forest degradation transfer stored ecosystem carbon to the atmosphere; the IPCC land assessment reports a broad literature range of 0.5-3.5 GtC per year.',
    scope: 'Global tropical deforestation and forest degradation represented by the assessed studies. Country, event or hectare-level application requires forest definition, carbon density, peat and soil boundary, disturbance type, post-clearance land use, regrowth and period.',
    counterevidence: 'The source reports a wide literature range rather than a best estimate. Tree-cover loss is not always deforestation, degradation differs from conversion, and regrowth or legacy fluxes alter net exchange. The value is mass carbon, not carbon dioxide, and is neither a per-hectare factor nor current-year inventory.'
  },
  deforestation_temperature_scale_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['deforestation->temp'],
    locators: [
      { url: 'https://doi.org/10.1029/2018GL080211', section: 'Abstract and climate-model analysis: local and nonlocal biophysical temperature responses; realistic deforestation scenarios across models; nonlocal effects dominate the global mean and MPI-ESM nonlocal cooling exceeds local warming by a factor of three' },
      { url: 'https://doi.org/10.1002/2016JG003653', section: 'Abstract and global satellite, reanalysis and flux-tower analysis: daytime warming and nighttime cooling after deforestation, with tropical daytime and boreal nighttime source-reported contrasts and physical mechanisms' },
      { url: 'https://doi.org/10.1016/j.gloenvcha.2018.07.004', section: 'Tropical local-temperature and human well-being analysis retained as local exposure corroboration rather than a global mean temperature coefficient' }
    ],
    exact_claim: 'Deforestation alters temperature through local surface-energy and turbulence changes, nonlocal atmospheric and oceanic adjustment, and a separate carbon-cycle pathway. The sign and magnitude differ between local and global scales, day and night, latitude, season and whether carbon effects are included.',
    scope: 'Declared forest-loss contrast or model experiment with forest type, latitude, cleared fraction, day-night and seasonal aggregation, local versus global mean response, nonlocal adjustment and carbon-cycle inclusion explicitly retained.',
    counterevidence: 'There is no universal signed coefficient. Satellite contrasts show daytime warming and nighttime cooling, while models can show global-mean biophysical cooling dominated by nonlocal effects. Space-for-time observations can retain land-management differences, and carbon-cycle warming occurs on a different boundary and timescale. The edge therefore says alters, not raises.'
  },
  emissions_warming_impact_chain_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: [
      'carbon_emission->drought_persistence',
      'carbon_emission->extreme_precipitation_intensity',
      'carbon_emission->wildfire_regime_shift',
      'carbon_emission->water_stress',
      'carbon_emission->crop_yield_volatility',
      'carbon_emission->biodiversity_intactness_loss',
      'carbon_emission->critical_infrastructure_fragility'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/', section: 'Figure SPM.10 and Sections B.2-B.3: near-linear cumulative CO2-to-warming relationship; with additional warming, heavy precipitation intensifies globally, drought increases in some regions, fire weather increases in some regions, and wet and dry extremes become more severe, with explicit regional heterogeneity' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/technical-summary/', section: 'TS.B, especially ecosystem, water, food and settlement findings: observed climate change has altered ecosystems, increased wildfire in assessed regions, affected water availability and harvest stability, and damaged human systems; vulnerability and non-climate pressures modify outcomes' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/summary-for-policymakers/', section: 'B.3-B.5: risks to biodiversity, water, food and infrastructure escalate with warming but depend on exposure, vulnerability, adaptation and interacting non-climate drivers; Sections B.5.1-B.5.3 describe cascading and compound pathways' }
    ],
    exact_claim: 'Cumulative carbon-dioxide emissions contribute to warming, and warming changes climate hazards that can propagate into drought, heavy precipitation, fire, water, crop, biodiversity and infrastructure outcomes. These graph links are bounded mediated pathways, not direct one-step or per-tonne damage coefficients.',
    scope: 'A declared emissions pathway and accounting boundary connected to a specified warming response, then to a named region, hazard definition, exposure, vulnerability, adaptation state and outcome period. Global physical responses and regional impact estimates must remain separate stages.',
    counterevidence: 'Internal variability, aerosols and other forcings affect near-term and regional climate; drought and precipitation changes vary by region and drought definition. Land management, ignition and suppression modify fire; water systems, crop management, species exposure, infrastructure design, socioeconomic vulnerability and adaptation can weaken, amplify or reverse local outcomes. None of these edges establishes a universal direct marginal effect of one tonne of carbon dioxide.'
  },
  coal_power_direct_emissions_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['coal_power_co2_output->carbon_emission'],
    locators: [
      { url: 'https://www.ipcc.ch/site/assets/uploads/2018/02/ipcc_wg3_ar5_annex-iii.pdf', section: 'Table A.III.2: commercially available pulverized-coal direct emissions minimum 670, median 760 and maximum 870 gCO2eq/kWh; lifecycle values and upstream methane are tabulated separately' },
      { url: 'https://www.eia.gov/energyexplained/coal/coal-and-the-environment.php', section: 'Coal combustion for electricity and source-specific carbon-dioxide and air-pollutant releases, with plant efficiency and control context' }
    ],
    exact_claim: 'Generating electricity in a commercially available pulverized-coal plant directly emits carbon dioxide and other greenhouse gases; the IPCC technology synthesis reports a median direct intensity of 760 gCO2-equivalent per kWh, bounded by an assessed 670-870 minimum-to-maximum range.',
    scope: 'Pulverized-coal electricity generation within the IPCC direct plant-emissions boundary. Plant, coal rank, efficiency, load, control and period must be declared before applying the synthesis to an operating fleet.',
    counterevidence: 'The range is technology-literature heterogeneity, not a confidence interval. High-efficiency plants can fall lower, inefficient or older plants higher, and carbon capture can materially change direct emissions. Upstream mining methane, transport and infrastructure are excluded from the direct row, while the graph node must not be read as a marginal grid-displacement coefficient.'
  },
  heavy_precipitation_flash_flood_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['extreme_precipitation_intensity->flash_flood_regime'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', section: 'Executive Summary, Heavy Precipitation and Pluvial Floods, lines 183-195: projected extreme-precipitation intensification increases pluvial and flash-flood frequency and magnitude when precipitation intensity exceeds natural or artificial drainage capacity' },
      { url: 'https://www.weather.gov/pub/pnsfloodsafety', section: 'National Weather Service flash-flood safety and mechanism overview: rapid flooding follows excessive rainfall and is conditioned by terrain, soils, drainage and prior wetness' }
    ],
    exact_claim: 'More intense short-duration precipitation can increase the frequency or magnitude of pluvial and flash flooding when rainfall rates exceed local infiltration, channel, storage or artificial-drainage capacity.',
    scope: 'Named catchment or urban drainage area, storm duration and antecedent condition with precipitation intensity, infiltration, storage, drainage and observed inundation measured on compatible event boundaries.',
    counterevidence: 'Heavy precipitation does not necessarily produce a flash flood. Dry soils, high infiltration, available storage, effective drainage, storm motion and spatial mismatch can prevent flooding, while dam failure, snowmelt or debris blockage can generate rapid flooding without an extreme-rainfall driver. River-flood responses remain more uncertain and are not pooled with pluvial flooding.'
  },
  wastewater_overflow_cso_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['wastewater_infrastructure_overflow->combined_sewer_overflow'],
    locators: [
      { url: 'https://www.epa.gov/npdes/combined-sewer-overflow-frequent-questions', section: 'What are CSOs and why are they important, lines 81-94: rainfall or snowmelt can make combined wastewater volume exceed sewer or treatment-plant capacity, producing discharge through designed overflow points' },
      { url: 'https://www.epa.gov/npdes/combined-sewer-overflow-basics', section: 'Combined Sewer System wet-weather mechanism: stormwater and wastewater flow can overwhelm the system and discharge untreated or partially treated flow at permitted relief outfalls' }
    ],
    exact_claim: 'In a combined sewer system, wet-weather wastewater and stormwater volume that exceeds conveyance or treatment capacity is operationally realized as a combined sewer overflow through a relief outfall.',
    scope: 'Named combined sewer catchment and event with rainfall or snowmelt, inflow, conveyance and treatment capacity, storage, control operations, outfall activation, discharge volume and receiving water identified.',
    counterevidence: 'Overflow is not inevitable during wet weather: storage, green infrastructure, real-time control, sewer separation, treatment expansion and maintenance can keep flows within capacity. Sanitary-sewer overflows, treatment bypasses and storm-sewer discharges are different events and must not be relabelled as CSOs.'
  },
  rice_cultivation_methane_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['rice_paddy_methane_bubbles->methane'],
    locators: [
      { url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch05_Cropland.pdf', section: 'Section 5.5, Equation 5.1, Box 5.2 and Tables 5.11-5.14: methane emissions from rice cultivation, global and regional emission factors, 95 percent intervals, cultivation period and scaling for water regimes and organic amendments' },
      { url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/vol4.html', section: 'Official 2019 Refinement Volume 4 publication and Chapter 5 Cropland provenance' }
    ],
    exact_claim: 'Rice cultivation emits methane, with daily field flux strongly conditioned by flooding regime, pre-season water status, organic amendments, soil, cultivar, climate region and cultivation period; the source-reported global baseline factor is 1.19 kg CH4 per hectare-day with a 0.80-1.76 95 percent confidence interval under the precisely defined Tier 1 baseline.',
    scope: 'Continuously flooded rice cultivation with less than 180 days of pre-season flooding and no organic amendments for the quantified global default; country, region, water regime, amendment and cultivation-period activity data are required for an inventory total.',
    counterevidence: 'Intermittent drainage, rainfed or upland cultivation, pre-season water status and amendment practices can sharply reduce or increase methane. The default is not a bubble-only flux, a universal paddy coefficient or an annual total, and regional or country-specific factors should replace it when well-supported measurements exist.'
  },
  stratification_shelf_hypoxia_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['thermal_stratification_intensification->shelf_sea_hypoxia'],
    locators: [
      { url: 'https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/', section: 'Description, lines 62-69: minimal ventilation, stratification, carbon export and oxygen demand promote hypoxia; strengthened thermal stratification can worsen existing hypoxia or facilitate formation, while storms and nutrient reductions can counter it' },
      { url: 'https://doi.org/10.1126/science.aam7240', section: 'Global synthesis of declining ocean and coastal-water oxygen, mechanisms, ecological effects and the interacting roles of warming, stratification, ventilation and nutrient loading' }
    ],
    exact_claim: 'Stronger thermal stratification can increase shelf-sea hypoxia risk by suppressing exchange and oxygen ventilation below the mixed layer, especially where organic-carbon production and respiratory demand are already high.',
    scope: 'Named shelf or coastal water body and stratified season with temperature and salinity density structure, mixing or exchange, dissolved oxygen, residence time, organic-carbon production and nutrient loading measured through the same water-column period.',
    counterevidence: 'Stratification alone is not sufficient: low organic-matter demand may prevent hypoxia, while nutrient loading and long residence time can dominate. Storm mixing, current shifts and ventilation can temporarily disrupt low oxygen, and persistent nutrient reduction can reverse eutrophication-driven hypoxia. Natural oxygen-minimum settings must be separated from human-amplified events.'
  },
  sulfur_aerosol_masking_loss_exact_readback: {
    reviewed_at: '2026-07-19',
    keys: ['sulfur_dioxide->aerosol_cooling_loss'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/', section: 'Sections 6.3.3.5 and 6.7.2-6.7.3: sulfur dioxide produces sulfate aerosols; aerosol reductions create positive forcing and additional warming, with strong regional, chemical and model dependence' },
      { url: 'https://www.epa.gov/so2-pollution/sulfur-dioxide-basics', section: 'Sulfur dioxide atmospheric reactions and formation of additional sulfur compounds and fine sulfate particles' }
    ],
    exact_claim: 'Sulfur dioxide is a precursor of sulfate aerosol; reducing sulfur dioxide and associated sulfate burden removes part of the negative aerosol forcing that had masked greenhouse-gas warming, producing a conditional warming contribution rather than a new greenhouse-gas source.',
    scope: 'Declared emissions region and control scenario with sulfur-dioxide emissions, sulfate burden, co-emitted aerosol and ozone precursors, atmospheric chemistry, aerosol-cloud response and comparison period retained separately.',
    counterevidence: 'The magnitude and even regional pattern depend on where and when emissions occur, oxidants, ammonia, humidity, clouds, transport, particle size and co-emitted warming agents. Air-pollution controls yield major health benefits, and methane or greenhouse-gas reductions can offset warming from aerosol removal. A total-aerosol scenario response is not an SO2-only coefficient.'
  },
  ozone_crop_yield_exact_readback: {
    keys: ['tropospheric_ozone->crop_yield_volatility'],
    locators: [
      { url: 'https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2021EF002000', section: 'Methods, Results and Figure 3: county-level United States maize and soybean yield models with ozone, aerosol, temperature and precipitation controls; national-period ozone-attributed maize yield loss and confidence interval' },
      { url: 'https://www.nature.com/articles/s43016-021-00422-6', section: 'Ozone-elevation experiments and monitoring across China, Japan and Korea: crop- and region-specific wheat, rice and maize relative-yield loss, illustrating heterogeneity outside the United States' }
    ],
    exact_claim: 'Ambient tropospheric ozone can reduce crop yield through plant uptake and oxidative injury, but the magnitude is crop-, exposure-metric-, region- and model-specific; the quantified United States maize estimate is not generalized to other crops or geographies.',
    scope: 'United States maize-growing counties during 1980-2019 for the quantified estimate, with crop-specific Asian experimental and monitoring evidence retained only as independent mechanism corroboration. Ozone exposure, heat, aerosols, precipitation and the no-damage counterfactual remain separate.',
    counterevidence: 'Crop responses differ by species, cultivar, stomatal uptake, water stress, management and ozone metric. Co-occurring temperature, drought and aerosols are correlated with ozone, and statistical attribution depends on model specification. Some crop-region coefficients are small or non-significant, so a national maize estimate does not establish universal yield loss or volatility.'
  },
  acidification_coral_calcification_exact_readback: {
    keys: ['ocean_acidification->shell_calcification_failures'],
    locators: [
      { url: 'https://pubmed.ncbi.nlm.nih.gov/23504739/', section: 'Meta-analysis abstract: coral calcification response per unit decrease in aragonite saturation over the assessed 2-4 range, among-study variation, measurement-method subgroup differences and end-century interpretation' },
      { url: 'https://pubmed.ncbi.nlm.nih.gov/23505245/', section: 'Comprehensive 228-study meta-analysis: taxon-, life-stage- and response-specific survival, calcification, growth, development and abundance responses to ocean acidification' }
    ],
    exact_claim: 'Lower aragonite saturation can reduce coral calcification, with a meta-analytic mean response of about 15 percent per unit decrease in aragonite saturation within the studied range, but responses vary substantially across studies, taxa and methods.',
    scope: 'Coral experimental studies with aragonite saturation initially between 2 and 4 for the quantified coefficient. Other marine calcifiers, natural reef accretion, shell dissolution, recruitment and ecosystem outcomes require separate taxon- and setting-specific estimates.',
    counterevidence: 'Among-study variation is large and calcification method changes the estimated magnitude. Species physiology, acclimation, food, light, temperature and local carbonate chemistry can weaken, offset or reverse individual responses. A coral calcification coefficient does not establish failure of every shell-building organism or net reef collapse.'
  },
  sulfur_emissions_transformation_and_deposition_exact_readback: {
    keys: [
      'coal_power_sulfur_emissions->sulfur_dioxide',
      'shipping->sulfur_dioxide',
      'steel->sulfur_dioxide',
      'sulfur_dioxide->acid_rain_deposition',
      'sulfur_dioxide->pm2_5_particulates'
    ],
    locators: [
      { url: 'https://www.epa.gov/so2-pollution/sulfur-dioxide-basics', section: 'Major combustion and industrial sulfur-dioxide sources; atmospheric reactions that form additional sulfur compounds and fine particles; health and environmental effects' },
      { url: 'https://www.epa.gov/acidrain/what-acid-rain', section: 'Sulfur-dioxide and nitrogen-oxide oxidation, atmospheric transport, sulfuric and nitric acid formation, and wet and dry deposition' },
      { url: 'https://www.imo.org/en/ourwork/environment/pages/sulphur-oxides-%28sox%29-%E2%80%93-regulation-14.aspx', section: 'Marine-fuel sulfur combustion, sulfur-oxide emissions, fuel sulfur limits, emission-control areas and equivalent exhaust-gas cleaning methods' },
      { url: 'https://www.epa.gov/system/files/documents/2025-07/so2_2024.pdf', section: 'United States sulfur-dioxide emissions sources, controls, monitored concentrations and national trend boundary' }
    ],
    exact_claim: 'Combustion or high-temperature processing of sulfur-bearing fuels and feedstocks can emit sulfur dioxide; atmospheric oxidation then converts a portion to sulfuric acid and sulfate-containing fine particles that are transported and deposited.',
    scope: 'Named facility, vessel, fuel or process with sulfur content, combustion activity and control status for emissions; named downwind airshed and event or annual period for chemical transformation, particulate formation and wet or dry deposition.',
    counterevidence: 'Low-sulfur fuel, scrubbers and stack controls can sharply reduce releases, and production routes differ. Atmospheric conversion depends on oxidants, ammonia, humidity, transport and residence time; not every sulfur-dioxide molecule becomes PM2.5 or deposits locally. Acid deposition also includes nitrogen compounds and natural sources.'
  },
  groundwater_withdrawal_depletion_exact_readback: {
    keys: [
      'agricultural_groundwater_withdrawal->groundwater_depletion',
      'municipal_groundwater_withdrawal->groundwater_depletion',
      'industrial_groundwater_withdrawal->groundwater_depletion'
    ],
    locators: [
      { url: 'https://www.usgs.gov/water-science-school/science/groundwater-decline-and-depletion', section: 'Groundwater pumping, water-level decline, storage depletion, recharge balance, land subsidence, streamflow and well impacts' },
      { url: 'https://www.usgs.gov/publications/estimated-groundwater-withdrawals-principal-aquifers-united-states-2015', section: 'Withdrawal estimates by principal aquifer and use category, including public supply, irrigation, industry, mining and thermoelectric power' },
      { url: 'https://www.usgs.gov/publications/aquifer-depletion-and-potential-impacts-long-term-irrigated-agricultural-productivity', section: 'Irrigation pumping, aquifer depletion and consequences for long-term agricultural production' }
    ],
    exact_claim: 'Sustained agricultural, public-supply or industrial groundwater withdrawals can lower water levels and deplete aquifer storage when extraction exceeds replenishment within the assessed aquifer and period.',
    scope: 'Named aquifer or well field with withdrawals separated by use category, recharge, groundwater levels, storage change, surface-water exchange and transfers measured on compatible annual to multi-year boundaries.',
    counterevidence: 'A withdrawal is not automatically depletion: recharge, managed aquifer recharge, reduced pumping, return flows, imported water and hydraulic connection can offset storage loss. Local well decline can reflect short-term drawdown rather than aquifer-scale depletion, and mixed-use pumping requires source apportionment.'
  },
  river_barrier_fragmentation_and_flow_exact_readback: {
    keys: [
      'dam_and_diversion_infrastructure->riverine_habitat_fragmentation',
      'road_stream_crossing_barriers->riverine_habitat_fragmentation',
      'levee_and_channelization_works->riverine_habitat_fragmentation',
      'dam_and_diversion_infrastructure->river_flow_regime_shift',
      'road_stream_crossing_barriers->river_flow_regime_shift',
      'levee_and_channelization_works->river_flow_regime_shift'
    ],
    locators: [
      { url: 'https://www.usgs.gov/publications/fish-guidance-and-passage-barriers', section: 'Dams, culverts and other passage barriers, hydraulic conditions, fish behavior and passage assessment' },
      { url: 'https://www.usgs.gov/publications/restoring-aquatic-habitats-through-dam-removal', section: 'Dam removal, longitudinal connectivity, sediment, channel and aquatic-habitat response' },
      { url: 'https://pubs.usgs.gov/publication/sir20225081/full', section: 'Regulated-river flow alteration, storage and operating effects on downstream hydrology' },
      { url: 'https://www.epa.gov/caddis/physical-habitat', section: 'Channel alteration, flow, sediment, habitat simplification and biological-response pathways' }
    ],
    exact_claim: 'Dams, diversions, poorly designed road-stream crossings, levees and channelization can impede aquatic passage, disconnect floodplains or stream reaches, and alter the timing, magnitude, velocity or local distribution of river flow.',
    scope: 'Named structure and river reach with geometry, operations, passability, discharge, sediment, channel and species context measured against an unimpeded, pre-project or otherwise declared reference.',
    counterevidence: 'Passage facilities, permeable crossings, environmental-flow operations and reconnecting floodplains can reduce impacts. Some road crossings have only local hydraulic effects and do not change basin-scale flow. Barrier effects are species-, discharge- and season-specific, while dam removal can temporarily mobilize sediment and create short-term disturbance.'
  },
  operational_climate_mode_anomalies_exact_readback: {
    keys: [
      'madden_julian_oscillation->environ_anomalies',
      'north_atlantic_oscillation->environ_anomalies',
      'arctic_oscillation->environ_anomalies',
      'pacific_north_american_pattern->environ_anomalies',
      'southern_annular_mode->environ_anomalies',
      'indian_ocean_dipole->environ_anomalies',
      'pacific_north_american_pattern->blocking_pattern_persistence'
    ],
    locators: [
      { url: 'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/MJO/mjo.shtml', section: 'Operational Madden-Julian Oscillation monitoring and associated subseasonal tropical convection and circulation anomalies' },
      { url: 'https://www.cpc.ncep.noaa.gov/data/teledoc/teleintro.shtml', section: 'NOAA teleconnection indices and canonical Northern Hemisphere circulation, temperature and precipitation anomaly patterns' },
      { url: 'https://www.cpc.ncep.noaa.gov/data/teledoc/pna.shtml', section: 'Pacific-North American pattern phases, North Pacific blocking and North American circulation, temperature and precipitation associations' },
      { url: 'https://cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/ao.shtml', section: 'Operational Arctic Oscillation index and phase-dependent circulation patterns' },
      { url: 'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/aao/aao.shtml', section: 'Operational Antarctic Oscillation or Southern Annular Mode index' },
      { url: 'https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/IODMI/DMI.html', section: 'Operational Indian Ocean Dipole Mode Index and sea-surface-temperature anomaly definition' }
    ],
    exact_claim: 'Operationally defined climate modes organize recurrent, phase-dependent circulation, temperature and precipitation anomaly patterns; the PNA negative phase is also associated with North Pacific blocking, but none of these indices uniquely causes every regional anomaly.',
    scope: 'The source-defined index domain, phase and season with same-period circulation and regional anomaly fields. MJO subseasonal events, annular modes, PNA and IOD are not pooled into a single coefficient or treated as interchangeable.',
    counterevidence: 'Teleconnections vary by season, event amplitude, background climate, interactions among modes and internal variability. Associations can reverse or be weak in individual regions and years, and index correlation does not prove that one mode independently caused a specific hazard or persistent block.'
  },
  arctic_surface_feedback_and_coastal_thaw_exact_readback: {
    keys: [
      'permafrost_thaw->coastal_permafrost_erosion',
      'sea_ice_season_loss->ice_albedo_feedback_loops',
      'ice_albedo_feedback_loops->arctic_amplification_rates'
    ],
    locators: [
      { url: 'https://arctic.noaa.gov/report-card/report-card-2020/coastal-permafrost-erosion/', section: 'Arctic coastal permafrost erosion, ground ice, warming, storms, sea ice and observed spatial variability' },
      { url: 'https://www.usgs.gov/publications/carbon-release-through-abrupt-permafrost-thaw', section: 'Permafrost thaw, ground-ice loss, landscape change, erosion and infrastructure consequences' },
      { url: 'https://nsidc.org/learn/parts-cryosphere/sea-ice/why-sea-ice-matters', section: 'Sea-ice reflectivity, open-ocean solar absorption, ocean-atmosphere heat exchange and climate feedback' },
      { url: 'https://nsidc.org/learn/ask-scientist/what-are-impacts-arctic-sea-ice-loss', section: 'Arctic sea-ice loss, albedo feedback and contribution to amplified Arctic warming' }
    ],
    exact_claim: 'Thaw weakens ice-rich Arctic coastal ground and increases susceptibility to erosion, while seasonal sea-ice loss exposes darker ocean that absorbs more solar energy and contributes to the positive albedo feedback and amplified Arctic warming.',
    scope: 'Ice-rich Arctic permafrost coasts for erosion and sunlit Arctic sea-ice regions for albedo feedback, with seasonal forcing and multi-year to multi-decadal response retained separately.',
    counterevidence: 'Coastal erosion also depends on waves, storms, sea level, sediment, geology and remaining sea-ice protection; thaw alone does not set the rate. Arctic amplification also involves lapse-rate, water-vapour, cloud, ocean-heat-transport and atmospheric-circulation feedbacks, so albedo loss is one contributor rather than a complete explanation.'
  },
  ozone_precursor_photochemistry_exact_readback: {
    keys: [
      'ozone_formation_pressure->tropospheric_ozone',
      'volatile_organic_compounds->tropospheric_ozone'
    ],
    locators: [
      { url: 'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics', section: 'Ground-level ozone as a secondary pollutant formed from nitrogen oxides and volatile organic compounds reacting in sunlight' },
      { url: 'https://www.epa.gov/air-research/implications-volatile-chemical-products-ozone-and-particulate-matter-urban-atmospheres', section: 'Volatile chemical products, reactive organic gases and urban ozone and particulate-matter formation' },
      { url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P10112PA.TXT', section: 'Photochemical ozone formation, precursor sensitivity and airshed context' }
    ],
    exact_claim: 'Tropospheric ozone is formed photochemically rather than emitted directly: reactive volatile organic compounds and nitrogen oxides interact with sunlight and atmospheric radicals, with the net response depending on precursor balance and airshed chemistry.',
    scope: 'Named urban, industrial, oil-and-gas or downwind airshed with hourly precursor concentrations, sunlight, meteorology and ozone measured during a declared episode or season.',
    counterevidence: 'Ozone chemistry is nonlinear and can be VOC-limited or NOx-limited; reducing one precursor can initially raise ozone in some regimes. Transport, wildfire smoke, biogenic VOCs, stratospheric intrusion, clouds and temperature also affect concentrations, so generic precursor presence does not determine a local ozone increment.'
  },
  climate_feedback_and_sensitivity_exact_readback: {
    keys: [
      'temp->carbon_emission',
      'solar_radiation_trapping->temp'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', section: 'Executive Summary and Sections 5.4.5-5.4.10: land, ocean, wetland and permafrost carbon-climate feedbacks; 3-41 PgC per degree Celsius permafrost range; process omissions and low-confidence linearity boundary' },
      { url: 'https://www.nature.com/articles/s43247-026-03189-5', section: 'Results Figures 1-2: updated gradual-thaw and total permafrost-plus-wildfire carbon feedbacks across SSPs, including interquartile ranges and under-represented-process comparison' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/', section: 'Sections 7.3-7.5, Table 7.13 and FAQ 7.3: effective radiative forcing, energy-budget response, equilibrium climate sensitivity definition, best estimate and likely range' },
      { url: 'https://gml.noaa.gov/aggi/aggi.html', section: 'NOAA Annual Greenhouse Gas Index: radiative forcing from long-lived greenhouse gases, gas-specific contributions, baseline and observational boundary' }
    ],
    exact_claim: 'Global warming can release carbon from thawing terrestrial permafrost, producing a positive carbon-climate feedback, while a sustained positive radiative forcing changes the global energy balance and raises equilibrium global surface temperature; each quantified response requires its own forcing, process, time-horizon and gas boundary.',
    scope: 'Global and terrestrial-permafrost model domains through 2100 for the permafrost feedback; global long-term equilibrium response to atmospheric CO2 doubling for climate sensitivity. Keep cumulative carbon, annual flux, forcing and equilibrium temperature distinct.',
    counterevidence: 'Permafrost response is uncertain and may be nonlinear; abrupt thaw and wildfire are incompletely represented, while some high-latitude land carbon can accumulate. Equilibrium sensitivity is not transient warming or a regional coefficient, and temperature response depends on feedbacks, ocean heat uptake, forcing efficacy and climate state.'
  },
  agricultural_and_shipping_emissions_exact_readback: {
    keys: [
      'industry_farming->carbon_emission',
      'shipping->carbon_emission'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/srccl/chapter/chapter-5/', section: 'Section 5.4.2: 2007-2016 global farm-gate crop and livestock non-CO2 emissions, methane and nitrous-oxide components, land-use additions, accounting boundary, and reported uncertainty' },
      { url: 'https://www.fao.org/3/cb3808en/cb3808en.pdf', section: 'FAOSTAT analytical brief on agrifood-system greenhouse-gas emissions: farm-gate, land-use-change and pre/post-production components and boundary differences' },
      { url: 'https://www.imo.org/en/ourwork/environment/pages/decarbonization%20of%20shipping.aspx', section: 'Fourth IMO GHG Study inventory summary: 2018 total and voyage-based international shipping CO2, share of global anthropogenic emissions, and future scenario boundary' },
      { url: 'https://unctad.org/system/files/official-document/rmt2024_en.pdf', section: 'Review of Maritime Transport 2024: shipping activity, fleet efficiency, fuel transition and maritime emissions context' }
    ],
    exact_claim: 'Crop and livestock activity within a declared farm-gate boundary emits methane and nitrous oxide, while marine-fuel combustion emits carbon dioxide within declared total- or international-shipping boundaries; source-reported totals depend on gas, allocation, inventory and system boundaries.',
    scope: 'Global 2007-2016 farm-gate agricultural non-CO2 emissions and global 2012/2018 shipping CO2 inventories. Keep CO2, CH4, N2O, CO2-equivalent, farm-gate, land-use, total shipping and international voyage-based allocations separate.',
    counterevidence: 'Production efficiency, herd composition, rice and manure management, fertilizer practice, ship efficiency, routing, speed, fuel choice and demand alter emissions. Farm-gate non-CO2 totals are not fossil CO2, and total shipping emissions are not international-shipping or marginal tonne-mile coefficients.'
  },
  marine_heatwave_rapid_intensification_exact_readback: {
    keys: ['marine_heatwaves->tropical_cyclone_rapid_intensification'],
    locators: [
      { url: 'https://www.nature.com/articles/s43247-024-01578-2', section: 'Abstract; Results Figures 7-8; Discussion; Methods: 1950-2022 IBTrACS and ERA5 conditional-probability analysis, source definitions, 1.5-fold average and up to 5-fold hotspot multiplication, significance screen and limitations' },
      { url: 'https://www.aoml.noaa.gov/ocean-conditions-in-the-intensification-of-hurricane-michael-2018/', section: 'NOAA AOML overview of upper-ocean thermal structure, ocean heat content, storm-induced cooling and atmospheric controls on hurricane intensification' }
    ],
    exact_claim: 'Within the Gulf of Mexico and northwestern Caribbean study domain, qualifying marine heatwaves were associated with a higher conditional probability of tropical-cyclone rapid intensification, averaging 1.5-fold and reaching up to 5-fold in identified hotspot regions.',
    scope: '1950-2022 Gulf of Mexico and northwestern Caribbean tropical cyclones; IBTrACS rapid-intensification events and ERA5 marine heatwaves defined by the source, paired within 10 days and 125 miles of intensification onset.',
    counterevidence: 'Marine heatwaves are neither necessary nor sufficient. Vertical wind shear, humidity, storm structure, motion and upper-ocean state also matter; results vary spatially, some grids lack sufficient information, the heatwave baseline and percentile definition affect detection, and the observational design does not establish a universal causal coefficient.'
  },
  primary_material_demand_and_resource_pressure_exact_readback: {
    keys: [
      'critical_mineral_extraction_pressure->resource_depletion',
      'mining_critical_minerals->resource_depletion',
      'plastics_petrochemicals->resource_depletion',
      'steel->resource_depletion'
    ],
    locators: [
      { url: 'https://www.iea.org/reports/global-critical-minerals-outlook-2025/overview-of-outlook-for-key-minerals', section: 'Demand, announced mine and refinery projects, primary supply requirements, ore quality, recycling, projected copper and lithium gaps, and scenario boundary' },
      { url: 'https://www.oecd.org/en/publications/global-plastics-outlook_de747aef-en/full-report/component-7.html', section: 'Primary and secondary plastics, fossil and biobased feedstocks, production-stage energy demand, material use, recycling and land-use trade-offs' },
      { url: 'https://worldsteel.org/wp-content/uploads/Fact-sheet-raw-materials-2023-1.pdf', section: 'Iron ore, metallurgical coal, limestone, scrap and other raw-material inputs to steelmaking, including recycling and process-route differences' },
      { url: 'https://unstats.un.org/sdgs/metadata/?Goal=12', section: 'SDG 12.2.1 material footprint and 12.2.2 domestic material consumption definitions, production-versus-consumption boundary and raw-material classes' }
    ],
    exact_claim: 'Primary mining, fossil-based plastics production and steelmaking increase demand for named raw materials and can raise economy-wide material footprint or domestic material consumption; the magnitude depends on technology, recycled input, trade allocation and the material accounting boundary.',
    scope: 'Named mineral, polymer or steel product; producing and consuming geography; year or scenario; primary and secondary material share; ore grade, process route, imports, exports and raw-material-equivalent accounting retained separately. Material pressure is measured rather than inferred scarcity.',
    counterevidence: 'Recycling, scrap-based electric-arc steel, substitution, material efficiency, longer product life, secondary plastics and alternative chemistries can reduce primary demand. Higher material use does not prove physical reserve exhaustion or economic scarcity, and consumption-based footprint differs from domestic extraction and domestic material consumption.'
  },
  tropical_modes_and_monsoon_exact_readback: {
    keys: [
      'indian_ocean_dipole->monsoon_volatility',
      'madden_julian_oscillation->monsoon_volatility',
      'walker_circulation_shift->monsoon_volatility'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/', section: 'Sections 8.3.2.3, 8.3.2.4 and 8.4.2.4: Walker circulation, IOD and ENSO interactions, South and South East Asian monsoon rainfall, regional teleconnections, internal variability and model uncertainty' },
      { url: 'https://www.psl.noaa.gov/mjo/MJOprimer/', section: 'NOAA PSL MJO primer: eastward-moving active and suppressed convection changes the location and strength of tropical precipitation and produces precipitation anomalies' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/atlas/', section: 'Small-island regional synthesis: intraseasonal rainfall is influenced by the MJO and interannual Indian- and Pacific-Ocean rainfall by IOD, ENSO and regional monsoon systems' }
    ],
    exact_claim: 'Indian Ocean Dipole state, Madden-Julian Oscillation phase and Walker-circulation displacement can redistribute tropical convection and moisture convergence, thereby modulating rainfall within named monsoon regions; none supplies a globally uniform or time-invariant monsoon response.',
    scope: 'Named monsoon domain and season with a declared IOD index, MJO phase or Walker-circulation diagnostic paired to rainfall, onset, active-break spells or moisture convergence on compatible daily-to-seasonal time scales; ENSO and Indian Ocean state are retained jointly where relevant.',
    counterevidence: 'Teleconnection sign and strength vary by basin, season, MJO phase, ENSO-IOD concurrence, background sea-surface temperature, land-sea contrast, aerosols and decadal variability. The MJO is intraseasonal rather than a trend driver, and circulation diagnostics can share precipitation inputs with the outcome. A mode index alone does not prove a local rainfall response.'
  },
  warming_hydroclimate_and_persistent_heat_exact_readback: {
    keys: [
      'temp->drought_persistence',
      'temp->monsoon_volatility',
      'temp->humidity_amplification',
      'temp->compound_day_night_heat_extremes',
      'temp->nocturnal_heat_stress',
      'carbon_emission->nocturnal_heat_stress'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/', section: 'Sections 8.2-8.4 and 8.5.2: water-cycle intensification, regional precipitation and monsoon change, evapotranspiration and drought with regional sign and confidence retained' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', section: 'Sections 11.3, 11.6 and 11.7: hot extremes, agricultural and ecological drought, compound events and regional attribution' },
      { url: 'https://doi.org/10.1038/s41558-019-0555-0', section: 'Abstract and Figures 3-5: warming-level-conditioned dry-warm summer persistence, regional response, storm-track mechanism and full uncertainty ranges' },
      { url: 'https://doi.org/10.1029/2023EF004406', section: 'Results and Figures 3-4: optimal-fingerprint attribution of humid-heat-night intensity and frequency in eastern China, including GHG-forcing estimates and 90 percent ranges' },
      { url: 'https://mausam.imd.gov.in/responsive/climate_services.php', section: 'India Meteorological Department monsoon monitoring products, dates, rainfall departures and regional operational boundary' }
    ],
    exact_claim: 'Warming and greenhouse-gas forcing can intensify persistent hot-night exposure and alter drought or monsoon characteristics, but the sign, magnitude and event definition remain region-, season- and mechanism-specific.',
    scope: 'Declared global-temperature or forcing contrast paired with a named monsoon region, drought definition, or day-night heat threshold; precipitation, evaporative demand, daily minima and maxima, humidity, circulation and land conditions must use compatible geography and time periods.',
    counterevidence: 'Monsoon rainfall can increase or decrease regionally and internal variability can dominate short records. Drought depends on precipitation, evapotranspiration, soil moisture and water use. Hot nights vary with humidity, cloud, advection and urbanization; a global temperature anomaly does not determine a local event count.'
  },
  warming_ocean_cryosphere_exact_readback: {
    keys: [
      'temp->peak_glacier_runoff_passage',
      'temp->ocean_salinity_stratification',
      'temp->ocean_carbon_uptake_weakening',
      'temp->ice_albedo_feedback_loops',
      'temp->arctic_amplification_rates',
      'temp->glacier_calving_events'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', section: 'Sections 5.2-5.4 and 5.5: ocean carbon uptake, sink efficiency, climate-carbon feedbacks and pathway dependence' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Sections 9.2-9.5: ocean salinity and stratification, Arctic amplification, glacier mass balance, ice dynamics and calving' },
      { url: 'https://www.ipcc.ch/srocc/about/faq/final-faq-chapter-2/', section: 'FAQ 2.1-2.2: glacier shrinkage, changing seasonal runoff and peak-water passage in glacier-fed basins' },
      { url: 'https://nsidc.org/learn/parts-cryosphere/sea-ice/why-sea-ice-matters', section: 'Sea-ice albedo, absorbed solar energy and amplification feedback boundary' },
      { url: 'https://www.nasa.gov/science-research/earth-science/the-anatomy-of-glacial-ice-loss/', section: 'Surface melt, ocean undercutting, fracture, terminus retreat and iceberg-calving mechanisms' }
    ],
    exact_claim: 'Warming alters glacier and sea-ice energy balance, ocean heat and freshwater structure, and carbon uptake; realized runoff, calving, stratification and feedback strength depend on the named basin, geometry, circulation and time horizon.',
    scope: 'Named glacier-fed basin, sea-ice domain, ocean basin or ice terminus with temperature, mass balance, runoff, albedo, salinity, density, carbon flux, ocean heat and calving observations or projections evaluated over a declared baseline and response period.',
    counterevidence: 'Glacier runoff can rise before peak water and decline afterward; calving also depends on terminus geometry, ocean access and fracture. Local salinity and stratification may weaken where mixing dominates. Ocean carbon uptake can remain positive while sink efficiency changes. Ice-albedo feedback strength varies with season, clouds, snow and geography.'
  },
  warming_ecosystem_ozone_and_hypoxia_exact_readback: {
    keys: [
      'temp->invasive_species_encroachment',
      'temp->forest_dieback_areas',
      'temp->tropospheric_ozone',
      'temp->anoxic_dead_zones'
    ],
    locators: [
      { url: 'https://www.usgs.gov/faqs/how-does-climate-change-affect-challenge-invasive-species', section: 'Climate suitability, establishment, range expansion and management interactions for invasive species' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/', section: 'Sections 2.4-2.6: terrestrial species redistribution, forest mortality and dieback under interacting heat, drought, fire and biotic stress' },
      { url: 'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics', section: 'Ground-level ozone formation from nitrogen oxides and volatile organic compounds in sunlight, with hot sunny conditions increasing episode potential' },
      { url: 'https://www.epa.gov/ms-htf/hypoxia-101', section: 'Nutrient loading, algal production, decomposition, stratification, warm-water oxygen solubility and Gulf hypoxia boundary' },
      { url: 'https://www.epa.gov/nutrientpollution/effects-dead-zones-and-harmful-algal-blooms', section: 'Nutrient-driven algal blooms, decomposition, oxygen depletion and aquatic effects' }
    ],
    exact_claim: 'Warming can modify habitat suitability, forest stress, ozone-forming conditions and aquatic oxygen loss, but each outcome requires additional biological, chemical or land-management conditions and must not be inferred from temperature alone.',
    scope: 'Named species and region, forest type, airshed or water body with temperature plus invasion records, tree mortality, ozone and precursor observations, or dissolved oxygen, nutrient loading and stratification measured over the same declared season or trend.',
    counterevidence: 'Climate suitability does not guarantee invasion without introduction and establishment. Forest mortality may be driven by pests, fire or land use. Ozone requires precursor emissions and sunlight and can fall when chemistry is precursor-limited. Most coastal dead zones require nutrient loading and stratification; warming is usually a co-driver rather than a sufficient cause.'
  },
  buildings: {
    keys: [
      'building_performance_standards->building_energy_efficiency',
      'building_performance_standards->heat_pump_electrification',
      'building_performance_standards->passive_cooling_design',
      'building_performance_standards->refrigerant_phase_down',
      'building_performance_standards->weatherization_retrofits',
      'heat_pump_electrification->grid_peak_load_stress'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-9/', section: '9.5.2.1 and 9.6.4' },
      { url: 'https://www.iea.org/energy-system/buildings', section: 'Buildings sector tracking and policy assessment' }
    ],
    scope: 'Building-policy and retrofit pathways; strength depends on code coverage, enforcement, climate, building stock, electricity mix, and equipment standards.',
    counterevidence: 'Weak enforcement, rebound, split incentives, high-carbon electricity, and standards that omit refrigerants can weaken or reverse the expected system effect.'
  },
  power: {
    keys: [
      'carbon_dioxide_removal->resource_depletion',
      'grid_peak_load_stress->demand_response',
      'grid_scale_storage->battery_supply_chain_pressure',
      'renewable_energy_deployment->critical_mineral_extraction_pressure',
      'renewable_energy_deployment->renewable_curtailment_losses',
      'transmission_buildout_lag->clean_electricity'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-6/', section: '6.4.3.2, 6.4.4, and 6.6.2.2' },
      { url: 'https://www.iea.org/reports/net-zero-by-2050', section: 'Energy-system transition pathway and enabling infrastructure' }
    ],
    scope: 'Electricity-system and net-zero pathways; outcomes vary with grid topology, resource mix, technology choice, siting, recycling, and demand flexibility.',
    counterevidence: 'Alternative chemistries, recycling, non-battery storage, coordinated transmission, flexible demand, and low-impact removal pathways can materially reduce the stated trade-offs.'
  },
  adaptation: {
    keys: [
      'coastal_inundation_risk->flood_resilient_infrastructure',
      'equitable_cooling_access->grid_peak_load_stress',
      'managed_retreat_pressure->planned_relocation',
      'planned_relocation->migration',
      'public_health_heat_burden->urban_heat_action_plans',
      'utility_disconnection_risk->equitable_cooling_access'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/', section: 'Adaptation options including coastal infrastructure and strategic retreat' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp2/', section: 'Coastal adaptation, managed retreat, migration, and planned relocation' },
      { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', section: 'WHO response: heat action plans and cooling access' }
    ],
    scope: 'Hazard-response relationships at household, city, and coastal-settlement scales; implementation and distributional outcomes are strongly context dependent.',
    counterevidence: 'Poorly planned protection or relocation can transfer risk, cooling can raise peak demand, and nominal access does not ensure affordability, reliability, or equitable protection.'
  },
  water_food: {
    keys: [
      'crop_yield_volatility->climate_resilient_agriculture',
      'water_reuse->carbon_emission',
      'water_stress->water_reuse'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/', section: '4.7 water adaptation, non-conventional water, and wastewater reuse' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', section: '5.4 crop impacts, adaptation, and regional variability' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', section: '6.3.4.6 energy requirements of water reuse' }
    ],
    scope: 'Water-stressed and climate-exposed agricultural or urban systems; effects vary with treatment level, electricity mix, crop, climate, water quality, and governance.',
    counterevidence: 'Low-carbon electricity and fit-for-purpose treatment reduce emissions; reuse can be constrained by contaminants and acceptance; crop responses can be positive in some cooler regions.'
  },
  transport: {
    keys: [
      'electric_vehicle_transition->battery_supply_chain_pressure',
      'electric_vehicle_transition->grid_peak_load_stress'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/', section: '10.3 electromobility, charging infrastructure, and Box 10.6 critical materials' },
      { url: 'https://www.iea.org/energy-system/transport', section: 'Transport technology and infrastructure tracking' }
    ],
    scope: 'Road-transport electrification; mineral and peak-load effects vary with vehicle size, battery chemistry, recycling, charging timing, grid mix, and modal shift.',
    counterevidence: 'Managed charging, vehicle-to-grid, smaller batteries, recycling, public transport, and alternative chemistries can substantially weaken both pressures.'
  },
  industry: {
    keys: [
      'green_steel->critical_mineral_extraction_pressure',
      'steel_decarbonization_gap->green_steel'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/', section: '11.4 industry mitigation, electrification, hydrogen, and material efficiency' },
      { url: 'https://www.iea.org/energy-system/industry', section: 'Industry transition tracking' }
    ],
    scope: 'Primary steel transition pathways; the mechanism depends on route choice, electricity and hydrogen supply, scrap availability, equipment, and regional industrial policy.',
    counterevidence: 'Scrap-based production and material efficiency can reduce primary inputs; the critical-mineral trade-off is indirect and remains low confidence without route-specific inventories.'
  },
  warnings: {
    keys: ['early_warning_coverage_gaps->multi_hazard_early_warning'],
    locators: [
      { url: 'https://wmo.int/media/magazine-article/overview-of-early-warnings-all-executive-action-plan-2023-2027', section: 'Observations gaps, warning dissemination, and last-mile communication' },
      { url: 'https://public.wmo.int/news/campaigns/call-action-wmo-secretary-general-accelerating-implementation-of-early-warnings-all-initiative', section: 'Communication gaps between warning generation and community action' }
    ],
    scope: 'National to local multi-hazard warning chains, with special relevance where observations, communications, governance, or response capacity are incomplete.',
    counterevidence: 'Nominal system coverage does not establish message receipt, trust, accessibility, preparedness, or protective action.'
  },
  affordability: {
    keys: ['demand_response->utility_disconnection_risk'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-6/', section: '6.4.3.2 demand-side response and energy-system flexibility' },
      { url: 'https://www.energy.gov/scep/low-income-energy-affordability-data-lead-tool-and-community-energy-solutions', section: 'Energy burden and affordability context' }
    ],
    scope: 'Conditional household affordability co-benefit where participation is accessible and compensation reaches customers at risk of disconnection.',
    counterevidence: 'The cited assessments do not establish a general causal reduction in disconnections; exclusion, automation barriers, penalties, and low compensation can erase the benefit.'
  },
  nutrient_hypoxia: {
    keys: [
      'industry_farming->nitrogen_fertilizer_runoff',
      'nitrogen_fertilizer_runoff->coastal_hypoxia',
      'thermal_stratification_intensification->coastal_hypoxia',
      'wastewater_bypass_discharge->harmful_algal_blooms',
      'wastewater_bypass_discharge->coastal_hypoxia',
      'harmful_algal_blooms->coastal_hypoxia'
    ],
    locators: [
      { url: 'https://www.epa.gov/nutrientpollution/sources-and-solutions-agriculture', section: 'Agricultural nutrient loss, runoff, eutrophication, harmful algal blooms, and hypoxia mechanism' },
      { url: 'https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/', section: 'Nutrient loading, carbon production, water-column stratification, ventilation, and coastal hypoxia synthesis' },
      { url: 'https://www.epa.gov/npdes/combined-sewer-overflow-basics', section: 'Wet-weather untreated discharge, algae growth, and reduced dissolved oxygen impacts' },
      { url: 'https://www.epa.gov/habs/what-are-effects-habs', section: 'High-biomass bloom decomposition, hypoxia or anoxia, and ecosystem effects' }
    ],
    scope: 'Agricultural watersheds, wastewater-affected receiving waters, estuaries, and coastal shelves where nutrient delivery, primary production, residence time, and stratification are jointly observed; event to seasonal time scales, with the northern Gulf as a strongly documented but non-universal example.',
    counterevidence: 'Natural upwelling and restricted basins can generate hypoxia without anthropogenic nutrient loading; storms and mixing can temporarily ventilate bottom waters; nutrient retention, treatment, timing, residence time, and food-web grazing can weaken the pathway; a bloom does not always become hypoxic or toxic.'
  },
  coastal_salinity_and_supply: {
    keys: [
      'sea_level_rise->freshwater_lens_compression',
      'aquifer_overdraft->freshwater_lens_compression',
      'aquifer_overdraft->groundwater_depletion_wells',
      'aquifer_overdraft->coastal_aquifer_degradation',
      'coastal_inundation_risk->delta_salt_intrusion_fronts',
      'coastal_inundation_risk->coastal_aquifer_degradation',
      'river_flow_regime_shift->delta_salt_intrusion_fronts',
      'drought_persistence->delta_salt_intrusion_fronts',
      'delta_salt_intrusion_fronts->drinking_water_treatment_stress',
      'delta_salt_intrusion_fronts->freshwater_lens_compression',
      'delta_salt_intrusion_fronts->coastal_aquifer_degradation',
      'coastal_aquifer_degradation->drinking_water_treatment_stress',
      'coastal_inundation_risk->drinking_water_treatment_stress',
      'freshwater_lens_compression->desalination_dependence',
      'coastal_aquifer_degradation->desalination_dependence',
      'drinking_water_treatment_stress->desalination_dependence',
      'resource_depletion->aquifer_overdraft'
    ],
    locators: [
      { url: 'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion', section: 'Freshwater-saltwater interface; groundwater pumping, sea-level rise, freshwater storage loss, and well abandonment mechanisms' },
      { url: 'https://www.usgs.gov/programs/cmhrp/science/coastal-aquifers', section: 'Groundwater extraction and rising sea levels as joint drivers of coastal-aquifer freshwater quality and quantity loss' },
      { url: 'https://www.usgs.gov/publications/changes-freshwater-lens-thickness-basaltic-island-aquifers-overlain-thick-coastal', section: 'Observed freshwater-lens midpoint rise and thinning associated with long-term withdrawal and reduced recharge' },
      { url: 'https://19january2017snapshot.epa.gov/arc-x/climate-adaptation-and-saltwater-intrusion_.html', section: 'Sea level, drought, pumping, salt-front movement, drinking-water treatment cost, intake relocation, and alternative supply responses' },
      { url: 'https://documents1.worldbank.org/curated/en/476041552622967264/pdf/135312-WP-PUBLIC-14-3-2019-12-3-35-W.pdf', section: 'Desalination as a conditional alternative supply under increasing water scarcity' }
    ],
    scope: 'Named coastal aquifers, island freshwater lenses, estuaries, and drinking-water utilities with monitored head, recharge, pumping, chloride or salinity, salt-front position, and source-water operations; multi-year groundwater response and event-to-seasonal surface-water intrusion are kept distinct.',
    counterevidence: 'Aquifer geology, tidal streams, canals, confining units, recharge, pumping location, stream boundaries, and management can dominate or even reverse a simple inland-wedge response; some sea-level-rise cases raise water tables without a proportional inland salt front; treatment, intake relocation, reuse, demand management, and additional freshwater supply can avoid desalination.'
  },
  permafrost_and_arctic_infrastructure: {
    keys: [
      'permafrost_thaw->methane',
      'permafrost_thaw->carbon_emission',
      'permafrost_thaw->thermokarst_expansion',
      'permafrost_thaw->talik_expansion',
      'thermokarst_expansion->polar_infrastructure_failure',
      'polar_infrastructure_failure->critical_infrastructure_fragility',
      'sea_ice_season_loss->arctic_amplification_rates'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Sections 3.2, 3.4.2, 3.4.3, and 3.5.2 on sea-ice feedback, permafrost carbon, abrupt thaw, thermokarst, and infrastructure' },
      { url: 'https://www.usgs.gov/publications/a-review-abrupt-permafrost-thaw-definitions-usage-and-a-proposed-conceptual-framework', section: 'Standardized abrupt-thaw definition and consequences for greenhouse-gas budgets, hydrology, infrastructure, and communities' },
      { url: 'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/why-frozen-ground-matters', section: 'Frozen-carbon decomposition and carbon dioxide or methane release following thaw' },
      { url: 'https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/', section: 'B.7.2 permafrost-thaw subsidence impacts on Arctic and high-mountain infrastructure' }
    ],
    scope: 'Northern circumpolar and high-mountain permafrost regions, distinguishing gradual active-layer deepening, talik formation, abrupt ice-rich thermokarst, and infrastructure founded on frozen ground; observed recent change and projections to 2100 are not pooled.',
    counterevidence: 'Methane is a small fraction of total projected permafrost carbon release and current regional flux trends remain heterogeneous; vegetation uptake can offset part of carbon loss; coarse, ice-poor ground may not subside materially; engineering adaptation can reduce damage; the strength and sign of sea-ice links to regional weather remain scale and season dependent.'
  },
  heat_health_power_and_labor: {
    keys: [
      'wet_bulb_heat->grid_peak_load_stress',
      'grid_peak_load_stress->energy_affordability_crisis',
      'energy_affordability_crisis->utility_disconnection_risk',
      'utility_disconnection_risk->public_health_heat_burden',
      'utility_disconnection_risk->heat_related_mortality_burden',
      'wet_bulb_heat->heatwave_excess_mortality_rates',
      'temp->heat_related_mortality_burden',
      'temp->occupational_heat_exposure',
      'wet_bulb_heat->agricultural_labor_exposure',
      'critical_infrastructure_fragility->heat_related_mortality_burden'
    ],
    locators: [
      { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', section: 'Heat exposure, mortality and illness, occupational exposure, cooling access, power shortages, and health-service disruption' },
      { url: 'https://www.who.int/health-topics/heatwaves', section: 'Heatwave health burden and strain on energy, water, transport, emergency, and health services' },
      { url: 'https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf', section: 'Resource adequacy under above-normal demand, extreme temperature, low-resource availability, loss-of-load hours, and unserved energy' },
      { url: 'https://researchrepository.ilo.org/esploro/outputs/report/Working-on-a-warmer-planet/995219567102676', section: 'Heat-stress exposure and projected working-hour loss, including outdoor and agricultural labor' },
      { url: 'https://www.energy.gov/scep/low-income-energy-affordability-data-lead-tool-and-community-energy-solutions', section: 'Household energy burden and affordability definitions' }
    ],
    scope: 'Declared heat events and warm seasons in named cities, occupational populations, health-surveillance areas, and balancing authorities; same-day to multi-day health lags, seasonal grid peaks, and annual affordability outcomes are modeled separately.',
    counterevidence: 'Heat vulnerability depends on acclimatization, age, health, housing, work intensity, access to cooling, warning systems, and local exposure-response curves; grid stress also depends on supply outages, reserve margins, demand response, and transmission; high energy burden does not automatically cause disconnection, and assistance or moratoria can interrupt the pathway.'
  },
  heat_exposure_and_protective_cooling_exact_readback: {
    keys: [
      'temp->heat_related_mortality_burden',
      'humidity_amplification->public_health_heat_burden',
      'compound_day_night_heat_extremes->public_health_heat_burden',
      'nocturnal_heat_stress->public_health_heat_burden',
      'energy_affordability_crisis->public_health_heat_burden',
      'wet_bulb_heat->occupational_heat_exposure',
      'urban_heat_island->public_health_heat_burden',
      'cooling_equity_gaps->public_health_heat_burden'
    ],
    locators: [
      { url: 'https://doi.org/10.1038/s41558-021-01058-x', section: 'Results and Methods: factual versus natural-forcing-only temperature counterfactual, distributed-lag heat-mortality functions, 732 locations, attributable mortality and empirical 95 percent confidence intervals' },
      { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', section: 'Mechanisms and risk factors: humidity, hot nights, urban heat, occupational exposure, housing, cooling access, power loss, acclimatization, vulnerability, illness and mortality' },
      { url: 'https://lancetcountdown.org/wp-content/uploads/2025/10/Indicator-1.1.5_Data-Download_2025-Lancet-Countdown-Report-1.xlsx', section: 'DATA GUIDANCE and global/WHO-region tables: heat-attributable mortality model, counterfactual, attributable deaths and fraction, geography, period and caveats' },
      { url: 'https://lancetcountdown.org/wp-content/uploads/2025/10/Indicator-1.1.3_PWHL_Data-Download_2025-Lancet-Countdown-Report_v2-1.xlsx', section: 'DATA GUIDANCE and country/global tables: WBGT, metabolic rate, sector employment, sun/shade assumptions, potential work hours lost and coverage caveats' },
      { url: 'https://doi.org/10.1093/eurheartj/ehae277', section: 'Table 3 and Statistical analyses: time-stratified case-crossover estimates for extreme hot-night excess and acute stroke admissions in Augsburg, including period-specific odds ratios, 95 percent confidence intervals, lag structure and daytime-temperature adjustment' },
      { url: 'https://www.epa.gov/green-infrastructure/reduce-heat-islands', section: 'Urban heat islands, higher daytime and nighttime temperatures, energy demand, heat exposure and health outcomes' },
      { url: 'https://www.unep.org/resources/report/global-cooling-watch-2025', section: 'Cooling access, passive cooling, efficiency, refrigerants, energy demand and unequal heat protection' }
    ],
    scope: 'Named population, city, occupational group or heat event with coincident temperature, humidity, nighttime minimum, urban-reference contrast, indoor conditions, cooling affordability and use, work intensity, health outcome or modeled capacity loss measured over a declared day, season or annual indicator period.',
    counterevidence: 'Humidity and hot nights can intensify heat strain but responses are nonlinear and population-specific. Urban form, acclimatization, age, baseline health, work-rest schedules, shade, ventilation, passive design, efficient cooling, power reliability, warnings, healthcare and energy assistance can weaken or interrupt these pathways. Modeled attributable mortality and work-hour loss are not observed individual outcomes.'
  },
  short_term_ozone_mortality_exact_readback: {
    keys: ['tropospheric_ozone->air_pollution_health_burden'],
    locators: [
      { url: 'https://doi.org/10.1016/j.envint.2020.105876', section: 'Abstract and meta-analysis: 196 articles across pollutant-outcome analyses; pooled all-cause mortality RR 1.0043, 95 percent CI 1.0034-1.0052, per 10 micrograms per cubic metre short-term ozone exposure' },
      { url: 'https://www.ncbi.nlm.nih.gov/books/NBK574588/#ch3.s3', section: 'WHO Global Air Quality Guidelines Annex 3 Section A3.3: review protocol, exposure window, risk-of-bias assessment, heterogeneity, GRADE certainty and pooled ozone mortality estimate' }
    ],
    exact_claim: 'Short-term increases in outdoor ground-level ozone are associated with a small increase in daily all-cause mortality across the international time-series and case-crossover literature synthesized for the WHO air-quality guidelines.',
    scope: 'Human populations represented by studies in the WHO-commissioned review, with outdoor ozone averaging period, lag, monitor or model exposure, mortality definition, temperature, season, co-pollutants and geographic exposure range retained.',
    counterevidence: 'The pooled response is observational and small, and heterogeneous exposure definitions, temperature, season, co-pollutants, monitor placement, baseline mortality and vulnerability can alter it. It is not evidence for a linear response at every concentration, a long-term coefficient, an individual probability or health burden from stratospheric ozone.'
  },
  short_term_carbon_monoxide_myocardial_infarction_exact_readback: {
    keys: ['carbon_monoxide->air_pollution_health_burden'],
    locators: [
      { url: 'https://doi.org/10.1016/j.envint.2020.105901', section: 'Abstract, Results and sensitivity analyses: 26-study pooled myocardial-infarction RR 1.052, 95 percent CI 1.017-1.089, per 1 mg/m3 short-term ambient carbon monoxide exposure' },
      { url: 'https://www.ncbi.nlm.nih.gov/books/NBK574588/#ch3.s6', section: 'WHO Global Air Quality Guidelines Annex 3 Section A3.6: review methods, GRADE assessment, prediction interval, confounding limitations and low- and middle-income-country evidence gap' }
    ],
    exact_claim: 'Short-term increases in ambient carbon-monoxide concentration are associated with increased risk of myocardial-infarction emergency visits, admissions or mortality in the WHO-commissioned systematic review.',
    scope: 'Populations and ambient monitoring contexts represented by 26 studies published through September 2018, with up to seven-day lag, carbon-monoxide concentration, co-pollutants, myocardial-infarction definition and healthcare endpoint retained.',
    counterevidence: 'One third of studies had high risk of confounding bias, the prediction interval was wider than the pooled confidence interval, and low- and middle-income settings were sparsely represented. Ambient low-level exposure must remain separate from acute indoor poisoning, and the pooled estimate is not an individual causal probability or all-cause mortality coefficient.'
  },
  alder_pollen_mortality_exact_readback: {
    keys: ['pollen_allergen_spikes->air_pollution_health_burden'],
    locators: [
      { url: 'https://doi.org/10.1093/eurpub/ckab034', section: 'Methods and Table 1: Helsinki 1994-2014 quasi-Poisson distributed-lag analysis; abundant alder pollen above 100 grains/m3 versus low below 10 grains/m3 associated with non-accidental mortality acMRR 1.095, 95 percent CI 1.008-1.189' },
      { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7045159/', section: 'Independent systematic review and meta-analysis: taxon and outcome heterogeneity, short-term pollen exposure and allergic or asthmatic manifestations, with pooled effects and uncertainty intervals' }
    ],
    exact_claim: 'Abundant alder-pollen exposure was associated with increased non-accidental mortality in a Helsinki time-series study, while the wider pollen literature supports allergic and asthmatic morbidity but remains heterogeneous by taxon and outcome.',
    scope: 'Helsinki Metropolitan Area alder-pollen seasons during 1994-2014 for the mortality estimate, with daily grains per cubic metre, source-defined category, seven-day lag, non-accidental deaths, temperature and co-pollutants retained; other taxa and regions remain separate.',
    counterevidence: 'The mortality estimate is a single-region observational result without direct mechanistic measurement. Birch results were inconsistent, several grass and mugwort estimates crossed the null, pollen samplers and taxa differ, and sensitization, medication, avoidance, weather, pollution, vegetation and transport alter exposure and response. It must not be generalized to all pollen.'
  },
  desert_dust_cardiovascular_mortality_exact_readback: {
    keys: ['dust_storm_frequency->air_pollution_health_burden'],
    locators: [
      { url: 'https://doi.org/10.3390/jcm10040727', section: 'Abstract and Results Section 3.2/Figure 3: eight-study lag-zero cardiovascular mortality meta-analysis, 477771 events, IRR 1.018, 95 percent CI 1.008-1.027, per 10 micrograms per cubic metre PM10-dust' },
      { url: 'https://www.who.int/health-topics/air-pollution', section: 'Authoritative particulate-pollution health mechanism and cardiovascular and respiratory disease context; mineral-dust source attribution and event-specific exposure remain required' }
    ],
    exact_claim: 'Higher PM10 attributed to desert-dust episodes is associated with increased same-day cardiovascular mortality in the pooled daily-event literature.',
    scope: 'Populations represented by eight mortality studies published before March 2020, with dust-event definition, source attribution, PM10 increment, same-day lag, cardiovascular mortality definition, weather and co-pollutants retained.',
    counterevidence: 'Dust mineralogy, transported anthropogenic pollution, event definition, plume attribution, monitor coverage, exposure error, weather, age and baseline disease vary by study. Heterogeneity was moderate, lagged estimates differed, and the result is not an effect of annual storm count, every dust plume or non-desert particulate matter.'
  },
  farm_heat_yield_and_labor_exact_readback: {
    keys: [
      'farm_heat_stress->crop_yield_volatility'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', section: 'Sections 5.4-5.5: crop heat stress, phenology, reproductive damage, yield variability, labor capacity, irrigation, management and adaptation limits' },
      { url: 'https://www.nature.com/articles/s41558-017-0014-9', section: 'Multi-method global synthesis of temperature effects on wheat, rice, maize and soybean yields, with crop-specific responses and uncertainty' },
      { url: 'https://doi.org/10.1371/journal.pone.0178339', section: 'Abstract and Results, Figures 1-4: 1961-2014 growing-season temperature and SPEI interaction models; hot-dry conditions associated with global maize, soybean and wheat yield decreases of 11.6 percent (95 percent CI 8.9-14.3), 12.4 percent (7.4-17.1) and 9.2 percent (5.9-12.4), respectively' },
      { url: 'https://lancetcountdown.org/wp-content/uploads/2025/10/Indicator-1.1.3_PWHL_Data-Download_2025-Lancet-Countdown-Report_v2-1.xlsx', section: 'DATA GUIDANCE: agricultural potential work-hour loss, WBGT, employment, metabolic-rate and sun-exposure assumptions; labor capacity is retained separately from crop physiology' }
    ],
    scope: 'Named crop, production region and growing season with crop-stage temperature exposure, yield and harvested-area observations, management and water conditions; agricultural worker capacity is measured separately and can act as an additional production constraint rather than proof of physiological yield loss.',
    counterevidence: 'Crop heat response varies by species, cultivar, phenological stage, humidity, water and nutrient status, CO2, pests, soils, management and adaptation. Irrigation, altered planting dates, tolerant cultivars and protected production can reduce losses. Yield volatility cannot be attributed to farm heat without separating drought, flood, pests, conflict, prices, inputs and reporting change.'
  },
  ocean_heat_content_thermosteric_sea_level_exact_readback: {
    keys: ['ocean_heat_content->sea_level_rise'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Box 9.1 and Section 9.2.4.1: increasing ocean temperature lowers density and expands volume; globally averaged OHC change causes GMTSL change; assessed conversion 0.113 plus or minus 0.013 metres per yottajoule' },
      { url: 'https://oceanservice.noaa.gov/facts/sealevel.html', section: 'NOAA Ocean Service mechanism corroboration: thermal expansion caused by ocean warming is one of the two major causes of global sea-level rise' }
    ],
    exact_claim: 'Increasing globally averaged ocean heat content causes global mean thermosteric sea-level rise through seawater thermal expansion; IPCC assesses an OHC-to-GMTSL conversion of 0.113 plus or minus 0.013 metres per yottajoule.',
    scope: 'Globally integrated ocean heat-content change and the global mean thermosteric sea-level component, with historical context for 1971-2018 and source-defined depth and baseline retained.',
    counterevidence: 'Total sea-level rise also includes land-ice and land-water mass changes. Regional relative sea level additionally depends on ocean dynamics, salinity redistribution, gravity, rotation, deformation and vertical land motion. IPCC states that conversions from sea-surface or global surface-air temperature are time-scale and application dependent; they cannot substitute for global OHC.'
  },
  drought_vpd_tree_mortality_exact_readback: {
    keys: ['drought_persistence->overstory_tree_mortality'],
    locators: [
      { url: 'https://doi.org/10.1002/ece3.664', section: 'Abstract, Methods, Results and Discussion: greenhouse drought experiment comparing temperature and vapor-pressure deficit; VPD was more important than temperature per se for drought-induced decline in tree health' },
      { url: 'https://www.usgs.gov/centers/fort-collins-science-center/science/tree-mortality-patterns-and-processes', section: 'USGS tree-mortality mechanisms and interacting drought, heat, hydraulic, carbon and biotic controls' }
    ],
    exact_claim: 'Persistent water limitation can increase overstory tree mortality risk through hydraulic stress and atmospheric moisture demand, but temperature alone is not an adequate exposure proxy and vapor-pressure deficit can dominate the response.',
    scope: 'Species, stand and drought-treatment or field-observation context with soil water, vapor-pressure deficit, temperature, duration, growth or health response, mortality definition and biotic disturbance measured separately.',
    counterevidence: 'The experimental study identifies VPD as more important than temperature per se. Species traits, rooting depth, prior drought, carbon reserves, stand density, insects, pathogens, fire, acclimation and recovery can strengthen, weaken or reverse observed health responses; decline in health is not automatically death.'
  },
  permafrost_thaw_polar_infrastructure_exact_readback: {
    keys: ['permafrost_thaw->polar_infrastructure_failure'],
    locators: [
      { url: 'https://www.nature.com/articles/s43247-024-01317-7', section: 'Abstract; Study cases; Results Figures 3-6; Discussion; Methods: ground-ice and predicted-ground-temperature thaw index for the Hudson Bay Railway, Mackenzie Northern Railway and Inuvik-Tuktoyaktuk Highway under RCP4.5 and RCP8.5' },
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Sections 3.4.1.2.2 and 3.4.3.3.4 and key findings: ground-ice loss, subsidence, infrastructure stability, functional capacity, exposure and adaptation benefits' }
    ],
    exact_claim: 'Thaw of ice-bearing permafrost can cause settlement and subsidence that increase instability and functional-failure risk for exposed infrastructure; the primary model identifies spatially varying present and future thaw threat along three northern Canadian transport corridors.',
    scope: 'Declared transport, building, pipeline, communication or utility asset intersected with measured or modeled ground-ice and ground-temperature conditions, with present, 2050 or 2100 period and climate scenario retained. Modeled thaw threat, observed deformation and confirmed functional failure remain separate endpoints.',
    counterevidence: 'Warming does not imply failure where susceptible ground ice or asset exposure is absent. Construction quality, drainage, flooding, erosion, snow, embankment effects, maintenance and adaptation alter risk. The primary thaw index is a regional screening framework rather than an asset fragility or observed failure-rate model, and IPCC assigns medium confidence to broad projected infrastructure impacts.'
  },
  compound_climate_tree_mortality_exact_readback: {
    keys: ['environ_anomalies->overstory_tree_mortality'],
    locators: [
      { url: 'https://doi.org/10.1016/j.scitotenv.2021.151604', section: 'Abstract, highlights, methods and results: two independent European datasets; simultaneous hot summers, elevated VPD and dry years; 143 of 310 compiled mortality events, 34 percent of drought-defoliation cases and 27 percent of drought-mortality cases coincident with rare compound events' },
      { url: 'https://www.nature.com/articles/s41598-021-97762-x', section: 'Abstract; event reconstructions; palaeoclimate compilation; Discussion: compound antecedent and coincident conditions for 2015-2016 mangrove dieback and 2020 inland forest dieback in northern Australia' }
    ],
    exact_claim: 'Coincident hot, dry and high-atmospheric-demand conditions can increase tree defoliation, dieback and mortality risk, with European monitoring and northern Australian event reconstructions independently documenting compound-hazard associations.',
    scope: 'Named forest ecosystem, plot, mortality-event footprint or monitoring network with temperature, VPD, precipitation or drought exposure matched to mortality timing and denominator. European event coincidence and northern Australian mangrove and inland-forest reconstructions remain stratified and are not pooled into one coefficient.',
    counterevidence: 'The reported European percentages are coincidence proportions rather than causal risk ratios, and many mortality events fall outside the rare-compound-event definition. Species traits, rooting depth, antecedent condition, pests, pathogens, fire, salinity, land management, reporting bias and recovery conditions can strengthen, weaken or replace the climate pathway.'
  },
  thermodynamic_wet_bulb_public_health_exact_readback: {
    keys: ['wet_bulb_heat->public_health_heat_burden'],
    locators: [
      { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11623271/', section: 'Abstract; Methods; Figure 1; supplementary Table S1: station-derived daily mean thermodynamic wet-bulb temperature, 13.4 million deaths over more than 21 million municipality-days in Mexico during 1998-2019, age-specific exposure-response functions, distributed lags, controls and confidence bands' },
      { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', section: 'Heat-balance mechanism, acute health effects, vulnerable populations, cooling and adaptation: high temperature and humidity constrain heat elimination and increase physiological strain' }
    ],
    exact_claim: 'Higher thermodynamic wet-bulb temperature can increase public-health mortality burden by reducing evaporative cooling and increasing body heat storage; the Mexico population study estimates nonlinear, age-specific daily wet-bulb-temperature mortality responses rather than a universal threshold.',
    scope: 'Named municipality or comparable population with thermodynamic wet-bulb temperature matched to daily age-specific mortality and a declared lag, minimum-mortality temperature, model and observation period. The primary evidence covers Mexico during 1998-2019.',
    counterevidence: 'Wet-bulb temperature omits radiation, wind, clothing, metabolic load and indoor conditions and is not interchangeable with WBGT. Age, acclimatization, health, occupation, housing, cooling access, pollution, precipitation, behavioral adaptation and exposure assignment alter the response. The Mexico functions must not be exported as universal coefficients.'
  },
  heat_mortality_and_emergency_capacity_exact_readback: {
    keys: [
      'heat_related_mortality_burden->emergency_response_overload'
    ],
    locators: [
      { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', section: 'Heatwaves as public-health emergencies; acute illness, admissions, health-service pressure, response planning and mortality' },
      { url: 'https://www.who.int/europe/news/item/30-06-2026-statement---get-prepared--current-european-region-heatwaves-are-a-dress-rehearsal', section: 'Documented event evidence on emergency calls, ambulance demand, emergency departments, hospitals and health-system strain during extreme heat' },
      { url: 'https://lancetcountdown.org/wp-content/uploads/2025/10/Indicator-1.1.5_Data-Download_2025-Lancet-Countdown-Report-1.xlsx', section: 'DATA GUIDANCE: modeled heat-attributable mortality and caveats; mortality is not itself an emergency-service utilization measure' }
    ],
    scope: 'Named heat event and health-service catchment with time-aligned mortality, emergency calls, ambulance dispatch, emergency visits, admissions, staffing, bed or surge capacity and service disruption measured over the event and lag period.',
    counterevidence: 'Mortality can occur outside the care system, and high mortality does not prove emergency capacity was exceeded. Preparedness, warnings, cooling centers, staffing, surge plans, care-seeking behavior, coding and concurrent outbreaks or pollution can change service demand independently; overload requires direct capacity and utilization evidence.'
  },
  carbon_forcing_heat_labor_and_vector_exact_readback: {
    keys: [
      'carbon_emission->heat_related_mortality_burden',
      'carbon_emission->occupational_heat_exposure',
      'carbon_emission->farm_heat_stress',
      'carbon_emission->public_health_heat_burden',
      'carbon_emission->vector_borne_disease_expansion'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', section: 'Section 5.5.1: cumulative anthropogenic CO2 emissions, TCRE and global warming; emissions-to-impact pathways operate through climate-system response rather than local annual emissions alone' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/', section: 'Sections 7.2-7.3: heat health, occupational exposure, vector-borne disease, vulnerability, adaptation and attribution boundaries' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', section: 'Sections 5.4-5.5: agricultural heat, crop and livestock systems, outdoor labor, food security, regional exposure and adaptation' },
      { url: 'https://www.who.int/tools/compendium-on-health-and-environment/climate-change', section: 'Climate-change health pathways, extreme heat, vector-borne disease, occupational exposure, vulnerability and health-system response' }
    ],
    scope: 'Cumulative global anthropogenic CO2 emissions linked through assessed global and regional warming to a named heat, agricultural-labor or vector-pathogen exposure over a declared historical or scenario period; local annual emissions, local temperature and local outcomes are not treated as a directly observed chain.',
    counterevidence: 'Non-CO2 forcing, aerosols, internal variability, circulation, land use, urban form, adaptation, cooling, work practices, crop management, vector control, housing, sanitation, mobility, immunity and healthcare can substantially modify the downstream outcome. Vector suitability can fall above thermal optima, and no local health or labor outcome can be assigned to a local emissions inventory without formal attribution.'
  },
  ocean_productivity_fisheries: {
    keys: [
      'ocean_salinity_stratification->ocean_current_regime_shift',
      'ocean_current_regime_shift->pelagic_species_redistribution',
      'pelagic_species_redistribution->marine_food_web_simplification',
      'ocean_salinity_stratification->marine_food_web_simplification',
      'marine_fisheries_collapse->fish_landing_supply_disruption',
      'marine_food_web_simplification->fish_landing_supply_disruption',
      'pelagic_species_redistribution->fish_landing_supply_disruption',
      'fish_landing_supply_disruption->fishery_protein_dependence',
      'fishery_protein_dependence->food_import_exposure',
      'coastal_hypoxia->estuarine_nursery_loss',
      'thermal_stratification_intensification->estuarine_nursery_loss',
      'ocean_current_regime_shift->oceanic_upwelling_disruptions',
      'oceanic_upwelling_disruptions->phytoplankton_decline',
      'oceanic_upwelling_disruptions->fish_landing_supply_disruption',
      'phytoplankton_decline->fish_landing_supply_disruption',
      'estuarine_nursery_loss->marine_fisheries_collapse',
      'estuarine_nursery_loss->fish_landing_supply_disruption',
      'phytoplankton_decline->marine_food_web_simplification',
      'marine_heatwaves->marine_fisheries_collapse'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-5/', section: 'Sections 5.2.2.6, 5.2.3, Box 5.3, and fisheries synthesis on circulation, upwelling, primary production, redistribution, catch potential, and regional variability' },
      { url: 'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en', section: 'Assessed stock status, capture production, aquatic-food supply, livelihoods, and food-security dependence' },
      { url: 'https://coastalscience.noaa.gov/crp/hypoxia/', section: 'Hypoxic habitat loss, organism stress or mortality, and effects on commercial and recreational fisheries' },
      { url: 'https://www.fisheries.noaa.gov/national/habitat-conservation/estuary-habitat', section: 'Estuaries as nursery habitat for fish and shellfish' },
      { url: 'https://repository.library.noaa.gov/view/noaa/59602', section: 'Observed movement response of juvenile fish during intermittently hypoxic estuarine conditions' }
    ],
    scope: 'Named large marine ecosystems, eastern-boundary upwelling systems, stock-assessment units, estuaries, and coastal fishing communities; physical observations, biological surveys, stock assessments, landings, trade, and protein supply retain their distinct spatial and temporal boundaries.',
    counterevidence: 'Fishing pressure, management, fleet behavior, market substitution, aquaculture, recruitment variability, prey quality, oxygen, temperature, salinity, and primary production can dominate or reverse regional outcomes; species redistribution can create gains in receiving regions; upwelling projections remain highly regionally variable; landings are not identical to stock abundance or food availability.'
  },
  water_storage_runoff_and_utility_service: {
    keys: [
      'snowmelt_timing_shift->hydrological_runoff_surges',
      'hydrological_runoff_surges->bridge_scour_exposure',
      'temp->snow_drought',
      'reservoir_storage_instability->reservoir_operating_shortfall',
      'reservoir_operating_shortfall->hydropower_reliability_decline',
      'flash_flood_regime->wastewater_infrastructure_overflow',
      'coastal_inundation_risk->wastewater_infrastructure_overflow',
      'wastewater_infrastructure_overflow->wastewater_bypass_discharge',
      'wastewater_bypass_discharge->drinking_water_treatment_stress',
      'extreme_precipitation_intensity->wastewater_infrastructure_overflow',
      'river_flow_regime_shift->hydropower_reliability_decline',
      'temp->flash_flood_regime',
      'tropical_cyclone_rapid_intensification->compound_coastal_flooding'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/', section: 'Snow, runoff timing, precipitation, streamflow, and water-cycle changes' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/', section: 'Water infrastructure, reservoir operations, hydropower, drought, floods, and adaptation limits' },
      { url: 'https://www.epa.gov/npdes/combined-sewer-overflow-basics', section: 'Wet-weather capacity exceedance and untreated or partially treated overflow discharge' },
      { url: 'https://www.iea.org/reports/hydropower-special-market-report', section: 'Hydropower generation, hydrologic variability, storage, and operational flexibility' },
      { url: 'https://oceanservice.noaa.gov/facts/stormsurge-stormtide.html', section: 'Storm surge, tide, wave, and coastal-water-level components of compound flooding' }
    ],
    scope: 'Named snow-fed basins, gauges, reservoirs, hydropower systems, wastewater utilities, bridges, and coastal floodplains with matched event or operating records; event peaks, seasonal storage, annual generation, and infrastructure failures retain separate time scales.',
    counterevidence: 'Reservoir rules, antecedent storage, basin geometry, rain-on-snow fraction, soil saturation, drainage capacity, green infrastructure, bridge design, protective works, tide phase, storm track, and emergency operations can interrupt or reverse the expected response; warming does not produce flash floods without precipitation and catchment conditions.'
  },
  watershed_and_critical_service_dependencies: {
    keys: [
      'watershed_forest_loss->freshwater_ecosystem_collapse',
      'watershed_forest_loss->drinking_water_treatment_stress',
      'watershed_forest_loss->hydropower_reliability_decline',
      'temp->watershed_forest_loss',
      'grid_peak_load_stress->critical_infrastructure_fragility',
      'cooling_water_competition->critical_infrastructure_fragility',
      'backup_generator_dependence->critical_infrastructure_fragility',
      'critical_infrastructure_fragility->early_warning_coverage_gaps'
    ],
    locators: [
      { url: 'https://www.globalforestwatch.org/topics/biodiversity/', section: 'Watershed tree-cover and biodiversity monitoring context' },
      { url: 'https://www.wri.org/aqueduct', section: 'Basin water stress, drought, flood, and water-supply exposure indicators' },
      { url: 'https://www.epa.gov/sites/default/files/2015-04/documents/adaptive_response_framework_for_drinking_water_and_wastewater_utilities.pdf', section: 'Water-utility climate risk, treatment, emergency response, and resilience' },
      { url: 'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b', section: 'Lifeline infrastructure interdependencies, service disruption, and resilience' },
      { url: 'https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf', section: 'Loss-of-load, unserved energy, demand, and resource adequacy under extreme conditions' }
    ],
    scope: 'Mapped water-supply watersheds and named electricity, water, communications, transport, health, or warning-service areas with explicit dependency and outage records; forest condition, raw-water quality, power availability, cooling water, backup runtime, and service delivery are not collapsed into one index.',
    counterevidence: 'Treatment upgrades, redundant intakes, storage, diversified generation, islanding, fuel resupply, mutual aid, communications redundancy, and watershed management can preserve service; forest loss is not the only driver of water quality; backup generation can improve short-duration resilience even when dependence creates longer-duration risk.'
  },
  industry_transport_energy_supply_chains: {
    keys: [
      'personal_conveyance->air_pollution_health_burden',
      'semiconductor_fabs->cooling_water_competition',
      'aviation_demand_growth->carbon_emission',
      'road_freight_diesel_lock_in->freight_electrification_gap',
      'temp->airport_climate_exposure',
      'airport_climate_exposure->airport_operational_disruption',
      'shipping->supply_chain_port_bottlenecks',
      'air_conditioning_refrigerants->public_health_heat_burden',
      'cement_concrete->cement_process_emissions',
      'steel->steel_decarbonization_gap',
      'gas_power_dependence->peaker_plant_lock_in',
      'transmission_buildout_lag->transformer_supply_bottleneck',
      'transmission_buildout_lag->renewable_curtailment_losses',
      'critical_mineral_extraction_pressure->battery_supply_chain_pressure',
      'food_waste->methane',
      'plastics_petrochemicals->carbon_emission',
      'mining_critical_minerals->critical_mineral_extraction_pressure',
      'urban_sprawl_housing->asphalt_pavement_heat_absorbers',
      'battery_supply_chain_pressure->resource_depletion',
      'fast_fashion->carbon_emission',
      'fast_fashion->resource_depletion',
      'industrial_heat_decarbonization_gap->resource_depletion'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/', section: 'Transport activity, modal structure, electrification, energy use, emissions, and infrastructure' },
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/', section: 'Industry production routes, process emissions, materials, circularity, and decarbonization' },
      { url: 'https://hero.epa.gov/reference/4525447/', section: 'Semiconductor fabrication processes, ultrapure water, wastewater, and environmental controls' },
      { url: 'https://www.iea.org/reports/global-critical-minerals-outlook-2025', section: 'Mineral demand, supply concentration, project pipeline, processing, recycling, and technology uncertainty' },
      { url: 'https://unctad.org/system/files/official-document/rmt2024_en.pdf', section: 'Maritime trade, port performance, chokepoints, fleet activity, and disruption' },
      { url: 'https://www.unep.org/resources/report/unep-food-waste-index-report-2024', section: 'Food-waste generation and disposal context' },
      { url: 'https://www.iea.org/reports/the-future-of-petrochemicals', section: 'Petrochemical feedstock, plastics demand, energy use, and emissions' },
      { url: 'https://www.epa.gov/heatislands/using-cool-pavements-reduce-heat-islands', section: 'Pavement solar reflectance, surface temperature, and urban heat context' }
    ],
    scope: 'Declared facilities, production routes, fleets, ports, airports, power systems, urban land-cover areas, and supply-chain boundaries with matched activity, energy, emissions, water, material, delay, and health records; national activity is not assigned to a local impact without spatial allocation.',
    counterevidence: 'Technology, fuel and electricity mix, load factor, trade, recycling, process route, water source, cooling design, managed charging, transmission topology, inventory boundary, waste treatment, and urban materials can substantially change the pathway; sector activity does not prove local exposure, and supply pressure does not prove physical reserve depletion.'
  },
  climate_forcing_teleconnections_and_compound_hazards: {
    keys: [
      'methane->temp',
      'el_nino->environ_anomalies',
      'la_nina->environ_anomalies',
      'temp->urban_tree_canopy_loss',
      'urban_tree_canopy_loss->nocturnal_heat_stress',
      'temp->humidity_amplification',
      'temp->atmospheric_dryness',
      'soot_deposition_on_snow->snowmelt_timing_shift',
      'temp->thermal_stratification_intensification',
      'wildfire_regime_shift->pyrocumulonimbus_smoke_injection',
      'el_nino->monsoon_volatility',
      'el_nino->food',
      'el_nino->migration',
      'la_nina->monsoon_volatility',
      'la_nina->food',
      'carbon_emission->wet_bulb_heat',
      'wet_bulb_heat->food',
      'carbon_emission->monsoon_volatility',
      'monsoon_volatility->food',
      'monsoon_volatility->migration',
      'methane->environ_anomalies',
      'methane->wet_bulb_heat',
      'methane->monsoon_volatility',
      'temp->coastal_inundation_risk',
      'carbon_emission->coastal_inundation_risk',
      'temp->lightning_regime_shifts'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/', section: 'Radiative forcing, methane, climate sensitivity, and the distinction between emissions, concentration, forcing, and temperature response' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/', section: 'Atmospheric moisture, monsoons, circulation, runoff, and water-cycle responses' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Ocean stratification, cryosphere, and sea-level response' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', section: 'Heat, drought, heavy precipitation, fire weather, and compound extreme-event attribution' },
      { url: 'https://www.climate.gov/enso', section: 'ENSO monitoring, physical mechanism, event diversity, and documented regional teleconnections' },
      { url: 'https://www.fao.org/climate-change/en/', section: 'Climate variability, agriculture, food production, and food-security pathways' },
      { url: 'https://ntrs.nasa.gov/citations/20190025336', section: 'Wildfire-driven convection and upper-atmosphere smoke injection mechanism' }
    ],
    scope: 'Declared global forcing, named ENSO events, monsoon domains, ocean regions, cities, watersheds, and exposed populations with explicit mediators and lags; emissions-to-hazard links are treated as mediated through concentration, forcing, warming, circulation, and local exposure rather than instantaneous direct effects.',
    counterevidence: 'Internal variability, aerosol forcing, land management, irrigation, adaptation, trade, conflict, market policy, ocean circulation, vegetation management, storm dynamics, and event diversity can dominate regional outcomes; ENSO teleconnections can change sign by region and season; methane and carbon-dioxide emissions cannot be mapped to a local event without an attribution model.'
  },
  agricultural_water_and_input_dependence: {
    keys: [
      'industry_farming->water_stress',
      'industry_farming->groundwater_depletion',
      'industry_farming->fertilizer_price_shock',
      'industry_farming->feed_crop_dependency'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/', section: 'FAQ 4.4 and Sections 4.3-4.7: agriculture as the largest water user, consumptive irrigation, water stress, groundwater depletion, adaptation, and limits' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', section: 'Food-system exposure to water, input, market, feed, and climate shocks; regional production and adaptation limits' },
      { url: 'https://www.fao.org/markets-and-trade/do-not-touch/all-widgets/fertilizer-market-developments/en', section: 'Fertilizer market, input availability, prices, trade, and food-production exposure' }
    ],
    scope: 'Named irrigated production region, aquifer, commodity system, or livestock-feed supply chain with measured withdrawals, recharge, crop water consumption, fertilizer use and prices, feed shares, trade, and production; basin stress, physical depletion, and market shocks remain separate outcomes.',
    counterevidence: 'Rain-fed production, efficient irrigation, managed aquifer recharge, crop switching, lower input intensity, manure or nutrient recycling, diversified feed, pasture-based systems, inventory buffers, and trade substitution can weaken these pathways; agricultural demand does not by itself prove basin stress, aquifer depletion, or a fertilizer price shock.'
  },
  displacement_finance_and_recovery_capacity: {
    keys: [
      'wet_bulb_heat->migration',
      'food_import_exposure->cold_chain_failure_risk',
      'food_import_exposure->humanitarian_resource_gaps',
      'food_import_exposure->disaster_recovery_inequality',
      'insurance_retreat->coastal_property_insurance_redlines',
      'coastal_property_insurance_redlines->mortgage_market_exposure',
      'mortgage_market_exposure->relocation_governance_capacity',
      'insurance_retreat->climate_litigation_pressure',
      'public_health_heat_burden->disaster_recovery_inequality',
      'climate_litigation_pressure->adaptation_capital_shortfall',
      'permafrost_thaw->migration',
      'adaptation_capital_shortfall->cold_chain_failure_risk',
      'public_health_heat_burden->relocation_governance_capacity',
      'adaptation_capital_shortfall->early_warning_coverage_gaps',
      'migration->disaster_recovery_inequality',
      'disaster_recovery_inequality->relocation_governance_capacity',
      'migration->relocation_governance_capacity'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/technical-summary/', section: 'TS.B.6 and TS.D.8: climate-related migration and displacement, livelihood mediation, context dependence, finance, health adaptation, and planned relocation' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/', section: 'Sections 17.2-17.6: insurance, finance, governance, retreat, recovery, equity, and adaptation decision-making' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp2/', section: 'Coastal settlements: displacement, migration, planned relocation, protection limits, governance, and distributional outcomes' },
      { url: 'https://www.federalreserve.gov/econres/notes/feds-notes/climate-change-and-financial-stability-20210319.html', section: 'Physical-risk transmission through coastal real estate, insurance supply and pricing, mortgages, asset repricing, and public finance' },
      { url: 'https://www.gao.gov/products/gao-26-107867', section: 'Homeowners-insurance availability and affordability in disaster-prone and coastal areas, 2019-2024' },
      { url: 'https://www.unep.org/resources/adaptation-gap-report', section: 'Adaptation planning, implementation, and finance gaps' }
    ],
    scope: 'Named hazard event or exposure zone, migration or displacement cohort, insurance market, mortgage portfolio, recovery jurisdiction, humanitarian operation, or relocation program with explicit dates, affected population, policy regime, and financial boundary; household movement, market repricing, governance capacity, and service failure are not collapsed into one causal estimate.',
    counterevidence: 'Migration can be adaptive, constrained, delayed, circular, or unrelated to climate; conflict, labor markets, housing, kinship, policy, wealth, and agency frequently dominate. Insurance withdrawal is not universal and regulation or public residual markets can preserve coverage. Mortgage losses require exposure, inadequate insurance, borrower stress, collateral repricing, and lender concentration. Litigation can mobilize rather than reduce adaptation finance. Strong institutions, social protection, redundant logistics, public health capacity, and equitable recovery funding can interrupt the proposed cascades.'
  },
  biodiversity_insects_and_soil_condition: {
    keys: [
      'deforestation->insect_biomass_decline',
      'forest_fragmentation->insect_biomass_decline',
      'deforestation->soil_humus_decline',
      'temp->soil_humus_decline'
    ],
    locators: [
      { url: 'https://www.ipbes.net/global-assessment', section: 'Global assessment of land-use change, habitat loss and fragmentation, biodiversity condition, and interacting direct drivers' },
      { url: 'https://www.ipbes.net/assessment-reports/pollinators', section: 'Pollinator assessment: habitat loss and fragmentation, land management, climate, pesticides, pathogens, and resource continuity' },
      { url: 'https://www.ipcc.ch/srccl/chapter/chapter-4/', section: 'Land degradation: soil organic matter, erosion, land-cover change, warming, moisture, management, and restoration' },
      { url: 'https://www.fao.org/global-soil-partnership/areas-of-work/soil-organic-carbon/en/', section: 'Soil organic carbon stocks, measurement, land management, degradation, and restoration context' }
    ],
    scope: 'Named forest conversion or fragmentation footprint, insect assemblage and survey method, or soil layer and land-management unit with matched pre/post or reference observations; biomass, occupancy, diversity, humus, and soil organic carbon remain distinct metrics over seasonal to multi-decadal periods.',
    counterevidence: 'Responses differ by insect taxon, forest type, fragment quality, matrix habitat, edge configuration, survey effort, disturbance, and recovery. Some open-habitat insects increase after clearing. Soil organic matter depends on litter inputs, mineral association, moisture, texture, fire, erosion, tillage, grazing, and restoration; warming alone does not determine local humus loss and vegetation feedbacks can partly offset decomposition.'
  },
  hypoxia_and_coral_recruitment_feedbacks: {
    keys: [
      'coastal_hypoxia->anoxic_dead_zones',
      'reef_structural_collapse->coral_reef_fragmentation',
      'reef_structural_collapse->coral_larval_mortality'
    ],
    locators: [
      { url: 'https://oceanservice.noaa.gov/facts/deadzone.html', section: 'Dissolved-oxygen depletion, hypoxia, anoxia, nutrient loading, stratification, and dead-zone definition' },
      { url: 'https://www.ncei.noaa.gov/products/gulf-america-hypoxia-watch', section: 'Observed Gulf hypoxia extent, dissolved oxygen, monitoring period, and event variability' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', section: 'Coral bleaching, mortality, habitat degradation, structural loss, recruitment, recovery, and interacting local stressors' },
      { url: 'https://www.fisheries.noaa.gov/national/habitat-conservation/shallow-coral-reef-habitat', section: 'Coral-reef habitat structure, ecological function, threats, damage, and restoration' }
    ],
    scope: 'Named coastal water body with depth-resolved dissolved-oxygen observations, or named reef with repeated structural-complexity, fragmentation, spawning, larval survival, settlement, and recruitment observations; acute events and multi-year recovery trajectories are analyzed separately.',
    counterevidence: 'Hypoxia need not reach anoxia and mixing can rapidly restore oxygen. Reef structural decline is often an outcome of bleaching, storms, disease, bioerosion, pollution, or destructive use rather than an independent first cause. Larval mortality also depends on parental condition, heat, chemistry, food, predation, dispersal, and experimental design; degraded structure may reduce settlement habitat without directly killing larvae in the water column, so both coral links remain conditional and low confidence.'
  },
  cryosphere_chapter9_exact_readback: {
    keys: [
      'temp->ice_sheet_mass_loss',
      'carbon_emission->ice_sheet_mass_loss',
      'temp->firn_layer_depletion',
      'sea_ice_season_loss->polar_infrastructure_failure',
      'temp->snowmelt_timing_shift',
      'snow_drought->snowmelt_timing_shift',
      'ocean_heat_content->sea_ice_season_loss',
      'arctic_amplification_rates->sea_ice_season_loss',
      'temp->thermokarst_expansion',
      'ice_sheet_mass_loss->ocean_salinity_stratification',
      'ocean_heat_content->ice_sheet_mass_loss',
      'arctic_amplification_rates->permafrost_thaw'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Sections 9.3-9.5 and Executive Summary: sea-ice response, ice-sheet surface and ocean-driven mass loss, firn and meltwater retention, snow, permafrost, thermokarst, and freshening' },
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Sections 3.2-3.5: polar amplification, sea ice, permafrost and abrupt thaw, snow and ice, infrastructure, hydrology, and bounded regional impacts' }
    ],
    scope: 'Observed or modeled Greenland, Antarctic, Arctic, or Northern Hemisphere snow and permafrost domains with the assessed forcing, surface or ocean process, baseline, and response period retained; seasonal processes are not converted into universal annual coefficients.',
    counterevidence: 'Accumulation, firn refreezing, ice dynamics, basal melt, calving, ocean circulation, snow insulation, vegetation, soil ice content, internal variability, and regional atmospheric forcing can weaken, delay, or reverse a local response. Global warming or ocean heat does not uniquely attribute an individual ice, snow, or permafrost event.'
  },
  ocean_circulation_chapter9_exact_readback: {
    keys: [
      'temp->antarctic_bottom_water_decline',
      'ice_sheet_mass_loss->antarctic_bottom_water_decline',
      'amoc->ocean_current_regime_shift',
      'southern_annular_mode->ocean_current_regime_shift',
      'southern_annular_mode->antarctic_bottom_water_decline',
      'ocean_heat_content->amoc',
      'ice_sheet_mass_loss->amoc',
      'ocean_salinity_stratification->amoc'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Sections 9.2.3-9.2.4 and Executive Summary: AMOC, Southern Ocean circulation, winds, heat, meltwater freshening, density and stratification, and regional sea-level consequences' },
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Southern Ocean and Antarctic assessment: winds, warming, freshening, ice-shelf melt, dense-water formation, circulation, and uncertainty' }
    ],
    scope: 'Named Atlantic or Southern Ocean circulation diagnostic, water mass, depth range, model ensemble or observing period; AMOC strength, gyre or boundary-current change, Southern Annular Mode, shelf-water properties, and Antarctic Bottom Water formation remain separate measured states.',
    counterevidence: 'Internal variability, wind stress, buoyancy flux, eddies, model drift, sparse deep-ocean observations, bathymetry, sea-ice processes, and freshwater source location materially affect magnitude and sometimes regional sign. Aggregate ocean heat or ice loss does not by itself determine a circulation response without density, location, and timescale.'
  },
  antarctic_bottom_water_ventilation_exact_readback: {
    keys: ['antarctic_bottom_water_decline->oceanic_deoxygenation'],
    locators: [
      { url: 'https://doi.org/10.1038/s41558-023-01667-8', section: 'Abstract, Reduced ventilation of the abyss, Discussion and Methods: repeat-hydrography transport synthesis, 1994-2017 overturning change, isopycnal descent, oxygen-transport decline and contraction-driven dissolved-oxygen trend with reported uncertainty' },
      { url: 'https://www.nature.com/articles/s41558-023-01667-8#Sec5', section: 'Reduced ventilation of the abyss: transport and water-mass contraction contributions are calculated separately; the full-period transport-only oxygen trend is not significant while contraction produces the larger reported oxygen decline' }
    ],
    exact_claim: 'In the Australian Antarctic Basin over 1994-2017, reduced Antarctic Bottom Water transport and contraction of the well-ventilated layer were associated with a basin-mean contraction-driven dissolved-oxygen decline of 3 plus or minus 2 micromoles per kilogram per decade.',
    scope: 'Australian Antarctic Basin waters below approximately 3,500 metres over the repeat-hydrography interval, with Ross Sea and Adelie Land source waters, transport, density surfaces, basin volume, vertical oxygen gradient and post-2014 partial recovery retained.',
    counterevidence: 'The response is not a global-ocean rate. Ross Sea Bottom Water partially recovered after 2014, the full-period transport-only oxygen decline was not statistically significant, observational coverage is sparse, and salinity, sea ice, winds, bathymetry, source-water properties and internal variability alter transport and ventilation.'
  },
  emissions_based_radiative_forcing_exact_readback: {
    keys: [
      'carbon_emission->solar_radiation_trapping',
      'methane->solar_radiation_trapping',
      'nitrous_oxide->solar_radiation_trapping'
    ],
    locators: [
      { url: 'https://doi.org/10.5285/1f359da21c4041b4ab0977d05c7d38f0', section: 'IPCC AR6 WGI Technical Summary Figure TS.15 emissions-based ERF data and uncertainty CSV files: component-emissions experiments, 1750-2019 period, global W m-2 units, and 5th-95th uncertainty bars' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/figures/technical-summary/figure-ts-15/', section: 'Figure TS.15 panel a caption and methods boundary: effective radiative forcing from component emissions, indirect atmospheric components, CMIP6 model synthesis and uncertainty interpretation' }
    ],
    exact_claim: 'The IPCC AR6 emissions-based forcing synthesis attributes bounded 1750-2019 global mean effective radiative forcing contributions to the historical carbon-dioxide, methane and nitrous-oxide emissions experiments, retaining direct and assessed indirect atmospheric components and 5th-95th uncertainty ranges.',
    scope: 'Global mean 2019 effective radiative forcing relative to 1750 from the complete historical component-emissions trajectories; individual gas burden, ozone, stratospheric water vapour, aerosol, cloud and secondary carbon-dioxide components are retained before summation.',
    counterevidence: 'These historical trajectory totals are not per-tonne coefficients and cannot be scaled from one annual inventory. Methane and nitrous-oxide forcing includes indirect atmospheric effects, while carbon-cycle uptake, atmospheric chemistry, radiative efficiency, rapid adjustments and baseline choice affect magnitude.'
  },
  aviation_contrail_cirrus_forcing_exact_readback: {
    keys: ['aviation_condensation_trails->cloud_albedo_shift'],
    locators: [
      { url: 'https://doi.org/10.1016/j.atmosenv.2020.117834', section: 'Global aviation climate-forcing synthesis for 2000-2018: 2018 contrail-cirrus net effective radiative forcing, 5th-95th likelihood range, component comparison and uncertainty assessment' },
      { url: 'https://doi.org/10.1038/s43247-021-00174-y', section: 'Independent experimental and modelling context for aviation-induced cirrus, soot reduction and the cited 57 mW m-2 global forcing with 17-98 mW m-2 likelihood range' }
    ],
    exact_claim: 'The global aviation forcing synthesis estimated 2018 contrail-cirrus net effective radiative forcing at 57.4 milliwatts per square metre with a 5th-95th likelihood range of 17-98 milliwatts per square metre.',
    scope: 'Global 2018 aviation-induced contrail cirrus, combining shortwave and longwave effects into net ERF; local flight corridors, individual meteorological situations and single-flight attribution remain outside the estimate.',
    counterevidence: 'Contrails form only in sufficiently cold ice-supersaturated air, many dissipate quickly, shortwave and longwave effects oppose one another, background clouds and time of day alter net forcing, and soot, routing, altitude and meteorological year materially affect magnitude. The estimate is not transferable to a single flight or location.'
  },
  managed_soil_nitrogen_n2o_factor_exact_readback: {
    keys: ['agricultural_nitrogen_application->nitrous_oxide'],
    locators: [
      { url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch11_Soils_N2O_CO2.pdf', section: 'Table 11.1 updated: aggregated and climate-disaggregated EF1 direct managed-soil N2O-N emission factors, nitrogen-input boundaries, units and uncertainty ranges' },
      { url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/corrigenda4.html', section: 'Fourth Corrigenda, Volume 4 Chapter 11: corrected EF1 uncertainty range 0.002-0.018 and related table corrections' }
    ],
    exact_claim: 'The corrected IPCC Tier 1 aggregate EF1 estimates direct managed-soil emissions of 0.010 kilograms N2O-N per kilogram of qualifying nitrogen input, with a default uncertainty range of 0.002-0.018.',
    scope: 'Annual managed-soil inventory accounting for synthetic fertilizer, organic amendments, crop residues and nitrogen mineralized after mineral-soil carbon loss; input mass, fertilizer class, climate, crop and direct-versus-indirect pathway remain explicit.',
    counterevidence: 'Measured emission factors vary strongly with climate, soil, moisture, nitrogen form, timing, placement, crop uptake and inhibitors. Wet-climate synthetic fertilizer, other wet inputs and dry-climate inputs have different IPCC defaults, and Tier 2 or Tier 3 evidence should supersede the aggregate factor where available.'
  },
  landscape_fragmentation_and_freshwater_exact_readback: {
    keys: [
      'forest_fragmentation->wildlife_habitat_patches',
      'forest_fragmentation->species_range_compression',
      'insect_biomass_decline->pollinator_service_decline',
      'pollinator_service_decline->crop_yield_volatility',
      'freshwater_ecosystem_collapse->biodiversity_intactness_loss',
      'watershed_forest_loss->riverine_habitat_fragmentation',
      'riverine_habitat_fragmentation->freshwater_ecosystem_collapse',
      'wetlands_drainage_scales->biodiversity_intactness_loss',
      'wetlands_drainage_scales->freshwater_ecosystem_collapse',
      'species_range_compression->biodiversity_intactness_loss',
      'wildlife_habitat_patches->species_range_compression',
      'wildlife_habitat_patches->biodiversity_intactness_loss'
    ],
    locators: [
      { url: 'https://www.ipbes.net/global-assessment', section: 'Global assessment: land-use change, habitat loss and fragmentation, freshwater and wetland degradation, species range and population change, ecosystem function, and biodiversity indicators' },
      { url: 'https://www.ipbes.net/assessment-reports/pollinators', section: 'Pollinators assessment: insect abundance and diversity, pollination service, crop dependence, habitat, land use, pesticides, pathogens, and interacting stressors' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/', section: 'Terrestrial and freshwater ecosystems: range shifts, fragmentation, wetlands, freshwater connectivity, fire, and compound drivers' }
    ],
    scope: 'Named landscape, watershed, wetland, river network, species or pollinator assemblage with mapped habitat configuration and repeated biological surveys; habitat area, patch isolation, range occupancy, biomass, service delivery, and aggregate intactness remain separate endpoints.',
    counterevidence: 'Species traits, matrix permeability, dispersal, restoration, water quality, flow regime, barriers, harvest, invasive species, pesticides, pathogens, climate, and survey detectability can dominate outcomes. A patch map does not prove demographic isolation, aggregate biodiversity loss is not a single-species causal variable, and pollination dependence varies strongly among crops.'
  },
  coastal_buffers_and_reef_structure_exact_readback: {
    keys: [
      'mangrove_buffer_loss->littoral_surge_vulnerability',
      'mangrove_buffer_loss->coastal_erosion',
      'ocean_acidification->reef_structural_collapse',
      'reef_structural_collapse->marine_fisheries_collapse'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', section: 'Coastal and ocean ecosystems: mangrove attenuation and sediment retention, coral calcification and structural degradation, reef habitat, fisheries, and adaptation limits' },
      { url: 'https://www.fisheries.noaa.gov/national/habitat-conservation/shallow-coral-reef-habitat', section: 'Coral-reef habitat structure, ecological function, fisheries habitat, threats, damage, and restoration' },
      { url: 'https://www.fisheries.noaa.gov/national/habitat-conservation/coastal-wetland-habitat', section: 'Mangrove roots, shoreline stabilization, wave and storm protection, nursery habitat, and site-specific limits' }
    ],
    scope: 'Named coastline, storm or wave climate, mangrove stand, reef tract, fishery stock, or habitat survey with measured vegetation width and condition, bathymetry, carbonate chemistry, reef accretion or rugosity, and biological response.',
    counterevidence: 'Mangrove protection depends on width, density, health, bathymetry, surge depth, waves, sediment and storm track; it does not eliminate extreme flooding. Reef response varies with species, thermal stress, nutrients, disease, bioerosion, storms and recovery. Structural degradation can reduce habitat without by itself establishing stock collapse where fishing pressure and management dominate.'
  },
  soil_condition_and_crop_stability_exact_readback: {
    keys: [
      'soil_humus_decline->crop_yield_volatility',
      'industry_farming->soil_humus_decline',
      'topsoil_erosion_acceleration->crop_yield_volatility',
      'temp->insect_biomass_decline',
      'industry_farming->insect_biomass_decline'
    ],
    locators: [
      { url: 'https://www.fao.org/global-soil-partnership/areas-of-work/soil-erosion/en/', section: 'Soil erosion drivers, loss of fertile topsoil, agricultural productivity, land management, monitoring, and prevention' },
      { url: 'https://www.ipcc.ch/srccl/chapter/chapter-4/', section: 'Land degradation: soil organic matter, erosion, intensive land use, warming and moisture, crop impacts, and restoration' },
      { url: 'https://www.ipbes.net/assessment-reports/pollinators', section: 'Insect and pollinator responses to land-use intensity, habitat simplification, climate, chemicals, and interacting stressors' }
    ],
    scope: 'Named field, soil mapping unit, depth interval, management system, crop and insect survey with explicit baseline, sampling method, weather and management period; erosion, humus or soil organic carbon, yield variance, insect biomass, abundance and diversity are not interchangeable.',
    counterevidence: 'Soil texture, mineral association, rainfall, slope, cover, tillage, residue return, amendments, irrigation, crop choice, pests and measurement error affect the response. Some intensive systems maintain soil carbon or yields with effective management; insect responses vary by taxon and some disturbance-adapted species increase.'
  },
  farm_heat_livestock_and_input_exact_readback: {
    keys: [
      'temp->farm_heat_stress',
      'farm_heat_stress->agricultural_labor_exposure',
      'temp->livestock_disease_pressure',
      'livestock_disease_pressure->food',
      'livestock_disease_pressure->food_import_exposure',
      'fertilizer_price_shock->crop_yield_volatility',
      'fertilizer_price_shock->food',
      'feed_crop_dependency->crop_yield_volatility',
      'feed_crop_dependency->food_import_exposure',
      'agricultural_labor_exposure->crop_yield_volatility',
      'agricultural_labor_exposure->food',
      'feed_crop_dependency->food',
      'resource_depletion->fertilizer_price_shock',
      'fertilizer_price_shock->food_import_exposure'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', section: 'Sections 5.4-5.5 and 5.12: heat and outdoor labour, livestock health and disease, feed, inputs, production, prices, trade, and the four food-security pillars' },
      { url: 'https://www.ilo.org/publications/major-publications/working-warmer-planet-effect-heat-stress-productivity-and-decent-work', section: 'Occupational heat exposure, agricultural work-hour loss, productivity, regional projections, and adaptation' },
      { url: 'https://www.fao.org/markets-and-trade/do-not-touch/all-widgets/fertilizer-market-developments/en', section: 'Fertilizer availability, prices, energy and mineral inputs, trade, and food-production exposure' }
    ],
    scope: 'Named crop or livestock system, worker population, production season, fertilizer or feed market, and trade boundary with measured heat exposure, work capacity, animal health, input quantity and price, yield, production and import response.',
    counterevidence: 'Mechanization, work-rest schedules, cooling, husbandry, vaccination, biosecurity, tolerant breeds, diversified feed, soil nutrient stocks, manure recycling, subsidies, inventories, crop switching and trade substitution can weaken the pathways. Input price or feed dependence does not automatically reduce yield or increase imports, and disease outbreaks require pathogen, host and transmission evidence.'
  },
  power_cold_chain_and_food_loss_exact_readback: {
    keys: [
      'grid_peak_load_stress->cold_chain_failure_risk',
      'cold_chain_failure_risk->food',
      'cold_chain_failure_risk->food_import_exposure'
    ],
    locators: [
      { url: 'https://www.who.int/publications/i/item/WPR-2024-DSE-001', section: 'Power outages and food-safety risks for households, suppliers, vendors, inspectors, and workers' },
      { url: 'https://www.fao.org/energy/news-and-events/news/news-details/cooling-the-chain--cutting-the-waste/en', section: 'Refrigeration gaps, food loss and waste, cold-chain energy and infrastructure, and supply-chain consequences' },
      { url: 'https://www.fao.org/flw-in-fish-value-chains/value-chain/transport/refrigerated-road-transport/services-infrastructure/en/', section: 'Electricity and supporting infrastructure requirements for refrigerated transport and cold-chain continuity' }
    ],
    scope: 'Named outage event, grid service area, storage or transport facility, commodity and temperature-control record with outage duration, backup capability, time-temperature exposure, spoilage or safety outcome, and domestic or imported replacement supply.',
    counterevidence: 'Peak load does not guarantee an outage; reserve margins, demand response, network topology, backup power, thermal storage, packaging, inventory turnover and food type affect failure. Spoilage may reduce total supply without increasing imports where substitutes, stocks, rationing or local replenishment are available.'
  },
  wildfire_smoke_and_fragmentation_exact_readback: {
    keys: [
      'temp->wildfire_regime_shift',
      'wildfire_regime_shift->forest_fragmentation',
      'wildfire_regime_shift->smoke_exposure_burden',
      'wildfire_regime_shift->air_pollution_health_burden',
      'wildfire_smoke_pm25_exposure->wildfire_smoke_hospitalization_burden'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', section: 'Heat, drought and fire-weather changes, attribution, regional variation, and limits on translating fire weather into burned area' },
      { url: 'https://doi.org/10.1073/pnas.1607171113', section: 'Observed western-US forest burned-area attribution to anthropogenic fuel-aridity change, including the 4.2 [2.7-6.5] million ha estimate and non-climate moderators' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/', section: 'Wildfire impacts on terrestrial ecosystems, forest structure and fragmentation, recovery, and interacting land-management drivers' },
      { url: 'https://www.who.int/health-topics/wildfires', section: 'Wildfire smoke, particulate exposure, affected populations, health burden, and protective actions' },
      { url: 'https://doi.org/10.1007/s11270-025-08047-2', section: 'Northern Portugal 2019-2022 burned area, measured PM10, PM2.5, ozone and nitrogen dioxide, health-surveillance comparisons, WHO AIRQ+ mortality estimates, statistical significance and ecological-study limitations' },
      { url: 'https://doi.org/10.1001/jamanetworkopen.2025.7956', section: 'Smoke-specific PM2.5 concentration-response, distributed lag window, respiratory hospitalization estimate, 95 percent confidence interval and population boundaries' }
    ],
    scope: 'Named fire-weather region, fire event or regime period, forest landscape and smoke-exposed population with measured fuel, ignition, burned area or severity, land-cover pattern, smoke concentration, exposure duration and health surveillance.',
    counterevidence: 'Fuel continuity, ignition, suppression, prescribed fire, prior disturbance, vegetation type, wind and land management determine whether hotter or drier conditions become fire. Low-severity fire can maintain mosaics rather than fragment habitat, and smoke exposure depends on plume transport, indoor infiltration and protective behavior.'
  },
  emissions_ocean_response_exact_readback: {
    keys: [
      'carbon_emission->sea_level_rise',
      'carbon_emission->ocean_acidification',
      'carbon_emission->ocean_heat_content',
      'carbon_emission->oceanic_deoxygenation'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/syr/figures/figure-3-4/', section: 'Scenario-conditioned global mean sea-level projections, likely ranges, baselines, time horizons and low-likelihood high-impact caveat' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Observed and projected full-depth ocean heat content, SSP-specific factor ranges, ocean mixing and long-term irreversibility' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-12/', section: 'Global surface-ocean pH and subsurface dissolved-oxygen projections by SSP, model-ensemble intervals, baselines and regional limits' }
    ],
    scope: 'Global SSP pathway and declared baseline with atmospheric carbon dioxide, ocean heat uptake, ice-sheet and glacier contributions, global mean sea level or surface-ocean pH retained separately from regional and local outcomes.',
    counterevidence: 'These are pathway-conditioned projections rather than per-tonne causal coefficients. Aerosols and non-CO2 forcing, carbon-cycle response, ocean mixing, ice-sheet dynamics and land-water storage affect the projections; local relative sea level additionally depends on vertical land motion and ocean dynamics, while coastal pH also responds to alkalinity, freshwater, upwelling, eutrophication and biological processes.'
  },
  hydrology_storage_and_water_quality_exact_readback: {
    keys: [
      'temp->river_flow_regime_shift',
      'river_flow_regime_shift->reservoir_storage_instability',
      'drought_persistence->reservoir_storage_instability',
      'soil_moisture_collapse->crop_yield_volatility',
      'soil_moisture_collapse->groundwater_depletion_wells',
      'freshwater_lens_compression->drinking_water_treatment_stress',
      'industry_farming->irrigation_water_inefficiency',
      'irrigation_water_inefficiency->groundwater_depletion_wells',
      'river_flow_regime_shift->reservoir_operating_shortfall',
      'flash_flood_regime->drinking_water_treatment_stress',
      'drought_persistence->drinking_water_treatment_stress',
      'drought_persistence->hydropower_reliability_decline',
      'wastewater_bypass_discharge->freshwater_ecosystem_collapse',
      'glacial_lake_failure_risk->bridge_scour_exposure',
      'temp->soil_moisture_collapse',
      'atmospheric_dryness->soil_moisture_collapse',
      'drought_persistence->groundwater_depletion',
      'irrigation_water_inefficiency->groundwater_depletion',
      'drought_persistence->water_stress',
      'groundwater_depletion->water_stress'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/', section: 'Sections 4.2-4.7 and FAQs 4.1-4.4: water cycle, soil moisture, drought, groundwater, irrigation, reservoirs, hydropower, water quality, floods, treatment and adaptation' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/', section: 'Observed and projected precipitation, evapotranspiration, soil moisture, snow, runoff, streamflow, drought, groundwater and water-cycle change' },
      { url: 'https://www.usgs.gov/water-science-school/science/groundwater-decline-and-depletion', section: 'Pumping, recharge, groundwater-level decline, streamflow capture, wells, and water-supply consequences' },
      { url: 'https://www.epa.gov/dwcapacity/drinking-water-system-infrastructure-resilience-and-sustainability', section: 'Source-water hazards, treatment and infrastructure stress, emergency response, and resilience' }
    ],
    scope: 'Named basin, soil layer, aquifer, well network, reservoir, hydropower facility, drinking-water utility, flood event or bridge crossing with matched weather, flow, storage, withdrawal, quality, operations and outcome records; event, seasonal and multi-year responses remain separate.',
    counterevidence: 'Precipitation, snow fraction, vegetation, soils, withdrawals, return flows, reservoir rules, interbasin transfers, treatment upgrades, emergency operations, aquifer properties and infrastructure design can interrupt or reverse local outcomes. Drought does not uniquely identify pumping, contamination, hydropower loss or treatment failure, and a glacial-lake hazard does not imply bridge scour without a routed flood and exposed foundation.'
  },
  transboundary_water_and_desalination_exact_readback: {
    keys: [
      'river_flow_regime_shift->basin_treaty_breakdown',
      'drought_persistence->basin_treaty_breakdown',
      'basin_treaty_breakdown->conflict_risk_escalation',
      'desalination_dependence->energy_affordability_crisis',
      'desalination_dependence->carbon_emission'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/', section: 'Transboundary water risk, allocation, drought, conflict and cooperation; desalination, energy demand, cost, emissions and adaptation trade-offs' },
      { url: 'https://www.unwater.org/water-facts/transboundary-waters', section: 'Transboundary dependence, cooperation agreements, data exchange, institutions, and conflict prevention' },
      { url: 'https://documents1.worldbank.org/curated/en/476041552622967264/pdf/135312-WP-PUBLIC-14-3-2019-12-3-35-W.pdf', section: 'Desalination energy intensity, cost, electricity source, emissions, affordability, technology and regional conditions' }
    ],
    scope: 'Named shared basin and agreement, drought or flow-change period, party behavior and conflict indicator; or named desalination plant and service area with technology, electricity use and mix, water tariff, household burden and emissions boundary.',
    counterevidence: 'Flow change does not automatically break treaties or cause conflict: flexible allocation rules, joint institutions, storage, data sharing, diplomacy and benefit sharing can sustain cooperation. Efficient reverse osmosis, energy recovery, renewable electricity, subsidies and tariff design can reduce desalination emissions and affordability impacts.'
  },
  water_reuse_and_resilient_agriculture_exact_readback: {
    keys: [
      'water_reuse->aquifer_overdraft',
      'water_reuse->desalination_dependence',
      'water_reuse->wastewater_bypass_discharge',
      'climate_resilient_agriculture->crop_yield_volatility',
      'climate_resilient_agriculture->topsoil_erosion_acceleration',
      'climate_resilient_agriculture->aquifer_overdraft',
      'climate_resilient_agriculture->food_import_exposure'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/', section: 'Water reuse, irrigation efficiency, groundwater demand, non-conventional water, adaptation effectiveness, rebound and implementation limits' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', section: 'Agricultural diversification, soil and water management, climate services, yield stability, food-system resilience, trade, and adaptation limits' },
      { url: 'https://www.epa.gov/waterreuse/basic-information-about-water-reuse', section: 'Fit-for-purpose reuse, treatment, local supply, discharge reduction, risk management and implementation context' }
    ],
    scope: 'Named reuse scheme, aquifer, utility, farm system, crop portfolio and production or trade period with measured substitution, withdrawals, discharge, soil cover, yield distribution and imports; an intervention is compared with a declared counterfactual.',
    counterevidence: 'Reuse may not displace groundwater or desalination, can require energy and treatment, and does not by itself repair collection systems. Irrigation efficiency can increase total consumption through rebound unless withdrawals are capped. Climate-resilient practices are context-specific and may shift rather than reduce production or import risk.'
  },
  clean_power_flexibility_and_retirement_exact_readback: {
    keys: [
      'renewable_energy_deployment->clean_electricity',
      'grid_scale_storage->clean_electricity',
      'demand_response->clean_electricity',
      'coal_retirement->clean_electricity',
      'clean_electricity->carbon_emission',
      'clean_electricity->ambient_air_quality_deficit',
      'clean_electricity->heat_pump_electrification',
      'clean_electricity->electric_vehicle_transition',
      'clean_electricity->green_steel',
      'clean_electricity->low_carbon_cement',
      'clean_electricity->carbon_dioxide_removal',
      'coal_retirement->carbon_emission',
      'coal_retirement->ambient_air_quality_deficit',
      'coal_retirement->public_health_heat_burden',
      'renewable_energy_deployment->carbon_emission',
      'grid_scale_storage->renewable_curtailment_losses',
      'grid_scale_storage->grid_peak_load_stress',
      'grid_scale_storage->peaker_plant_lock_in',
      'demand_response->grid_peak_load_stress',
      'demand_response->peaker_plant_lock_in'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-6/', section: 'Sections 6.4-6.7: low-carbon electricity, coal phase-out, renewable integration, storage, demand response, electrification, air quality, emissions, and system trade-offs' },
      { url: 'https://www.iea.org/reports/net-zero-by-2050', section: 'Power-sector decarbonization, unabated coal phase-out, renewables, grids, flexibility, storage, electrification and enabling infrastructure' },
      { url: 'https://www.iea.org/energy-system/electricity', section: 'Electricity generation, emissions, flexibility, reliability, storage, demand response and sector electrification tracking' }
    ],
    scope: 'Named balancing area, generation fleet, plant-retirement decision, storage or demand-response program, electrification load and hourly dispatch period with marginal rather than average displacement where possible; capacity, generation, curtailment, peak load, emissions and health outcomes remain distinct.',
    counterevidence: 'Renewables do not guarantee clean or reliable supply without connection and dispatch; storage can charge from fossil generation and is energy-limited; demand response may be unavailable or rebound; coal retirement can be replaced by gas; transmission and firm capacity constraints matter. Electrification and removal benefits depend on electricity emissions, timing, technology, leakage, material supply and durable operation.'
  },
  methane_detection_and_removal_exact_readback: {
    keys: [
      'methane_leak_detection->methane',
      'methane_leak_detection->ambient_air_quality_deficit',
      'carbon_dioxide_removal->carbon_emission',
      'ecosystem_restoration->carbon_dioxide_removal'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-6/', section: 'Fossil methane mitigation, leak detection and repair, carbon dioxide removal in energy pathways, additionality, storage, energy and land trade-offs' },
      { url: 'https://www.iea.org/reports/global-methane-tracker-2025', section: 'Measured fossil methane, detection and repair, abatement options, implementation and uncertainty' },
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-12/', section: 'Carbon dioxide removal methods, ecosystem restoration, durability, additionality, monitoring, reversal, land and energy requirements' }
    ],
    scope: 'Named fossil asset and verified leak-repair cycle, or named carbon-removal project and accounting boundary with baseline, additionality, gross and net removal, storage duration, reversal and leakage; methane, co-pollutants, CO2 emissions and removals remain separate ledgers.',
    counterevidence: 'Detection without durable repair has no mitigation effect; intermittent surveys miss super-emitters and local co-pollutants vary. Removal does not erase gross emissions unless additional, quantified and durably stored, and ecosystem carbon can reverse through fire, drought, harvest or land-use change.'
  },
  freight_electrification_constraints_exact_readback: {
    keys: [
      'transmission_buildout_lag->freight_electrification_gap',
      'battery_supply_chain_pressure->freight_electrification_gap'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/', section: 'Freight electrification, charging infrastructure, grid connection, batteries, critical materials, vehicle use and modal alternatives' },
      { url: 'https://www.iea.org/energy-system/transport', section: 'Heavy-duty vehicle electrification, charging, grids, batteries, supply chains and deployment constraints' }
    ],
    scope: 'Named freight corridor, fleet duty cycle, depot or charging site, grid-connection queue and battery technology with vehicle availability, charging power, connection date, mineral or cell supply and fleet turnover.',
    counterevidence: 'Distribution upgrades rather than bulk transmission may be the binding constraint; managed charging, smaller batteries, alternative chemistries, overhead or hydrogen systems, rail and logistics changes can reduce grid or battery pressure. A supply-chain concern does not prove delayed fleet deployment without project-level evidence.'
  },
  ports_airports_bridges_and_shipping_exact_readback: {
    keys: [
      'temp->port_heat_vulnerability',
      'port_heat_vulnerability->supply_chain_port_bottlenecks',
      'port_heat_vulnerability->critical_infrastructure_fragility',
      'coastal_inundation_risk->airport_climate_exposure',
      'airport_operational_disruption->critical_infrastructure_fragility',
      'bridge_scour_exposure->critical_infrastructure_fragility',
      'bridge_scour_exposure->supply_chain_port_bottlenecks',
      'arctic_shipping_expansion->shipping_lane_disruption',
      'arctic_shipping_expansion->carbon_emission',
      'shipping_lane_disruption->supply_chain_port_bottlenecks',
      'shipping_lane_disruption->food_import_exposure',
      'shipping_lane_disruption->critical_infrastructure_fragility',
      'tropical_cyclone_rapid_intensification->shipping_lane_disruption',
      'coastal_inundation_risk->shipping_lane_disruption',
      'extreme_precipitation_intensity->airport_operational_disruption',
      'wet_bulb_heat->airport_operational_disruption',
      'wet_bulb_heat->port_heat_vulnerability'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', section: 'Cities, settlements and infrastructure: heat, flood and coastal exposure, transport, ports, airports, cascading service disruption, interdependencies, adaptation and equity' },
      { url: 'https://unctad.org/system/files/official-document/rmt2024_en.pdf', section: 'Review of Maritime Transport 2024: chokepoints, rerouting, delay, ports, trade exposure, shipping emissions and disruption' },
      { url: 'https://www.faa.gov/air_traffic/flight_info/hurricane_season', section: 'FAA hurricane operations, airport and airspace disruption, rerouting and recovery' },
      { url: 'https://www.fhwa.dot.gov/engineering/hydraulics/library_arc.cfm?id=179&pub_number=16', section: 'FHWA bridge scour mechanisms, foundation risk, inspection and closure context' }
    ],
    scope: 'Named port, airport, bridge, maritime route, chokepoint, freight corridor or service network with event timing, worker exposure, asset condition, throughput, delay, closure, rerouting, emissions and dependency records; local asset disruption is not automatically treated as global supply failure.',
    counterevidence: 'Redundant gateways, rerouting, inventory, protection, cooling, drainage, bridge design, inspection, ice-class vessels, forecasting and emergency operations can preserve service. Port heat exposure does not prove a bottleneck, bridge scour affects ports only where the crossing is a material access dependency, and coastal inundation affects shipping mainly through ports, approaches and coastal infrastructure rather than every offshore route.'
  },
  insurance_retreat_and_adaptation_finance_exact_readback: {
    keys: [
      'coastal_inundation_risk->insurance_retreat',
      'wildfire_regime_shift->insurance_retreat',
      'disaster_recovery_inequality->adaptation_capital_shortfall',
      'insurance_retreat->adaptation_capital_shortfall'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', section: 'Urban and settlement risk, insurance, finance, inequality, recovery, adaptation capacity and limits' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/', section: 'Risk financing, insurance, retreat, adaptation finance gaps, governance, equity and portfolio decisions' },
      { url: 'https://www.federalreserve.gov/econres/notes/feds-notes/climate-change-and-financial-stability-20210319.html', section: 'Physical climate risk transmission through insurance supply, real estate, finance and public-sector capacity' },
      { url: 'https://www.gao.gov/products/gao-26-107867', section: 'Homeowners-insurance availability and affordability in disaster-prone areas' }
    ],
    scope: 'Named hazard zone, insurer market, policy cohort, recovery jurisdiction and adaptation budget over a declared regulatory and loss-history period; premium, non-renewal, market exit, uninsured loss, recovery allocation and adaptation investment remain separate measures.',
    counterevidence: 'Insurance regulation, residual markets, reinsurance, risk reduction, public finance and cross-subsidy can maintain coverage. Insurance retreat may reveal risk without directly reducing public adaptation capital, and unequal recovery depends on pre-existing wealth, tenure, eligibility, governance and aid design.'
  },
  aviation_demand_exact_readback: {
    keys: ['urbanization->aviation_demand_growth'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/', section: 'Transport demand, urban form, income, aviation activity, infrastructure, modal alternatives and mitigation' },
      { url: 'https://www.faa.gov/data_research/aviation/aerospace_forecasts', section: 'FAA aerospace forecasts: population, economic activity, fares, capacity and other drivers used for aviation-demand projections' }
    ],
    scope: 'Named metropolitan system and multi-year aviation-demand model retaining income, population, airport capacity, fares, business and leisure travel, surface alternatives and policy.',
    counterevidence: 'Urbanization alone does not determine aviation demand; income, fares, business travel, rail alternatives, airport capacity, technology, remote substitution and policy can dominate or reverse a simple association.'
  },
  wildfire_rail_heat_exact_readback: {
    keys: ['wildfire_regime_shift->rail_heat_buckling'],
    locators: [
      { url: 'https://rosap.ntl.bts.gov/view/dot/79699', section: 'FRA Climate and Sustainability: Rail Resiliency report record and downloadable report; wildfire heat can warp rails, damage track components, and disrupt passenger and freight operations' },
      { url: 'https://railroads.fra.dot.gov/regulations/federal-register-documents/2012-17343', section: 'FRA Safety Advisory: thermal track buckling, extreme heat, track condition, derailment risk and controls' }
    ],
    scope: 'Named wildfire-exposed track segment with fire intensity, rail temperature, track construction and condition, component damage, deformation and operating response.',
    counterevidence: 'Wildfire may close a railway through smoke or nearby danger without buckling rail; direct thermal deformation requires sufficiently intense heat, exposed track and inadequate protection, while inspection and maintenance can prevent a system failure.'
  },
  building_efficiency_cooling_and_refrigerants_exact_readback: {
    keys: [
      'refrigerant_phase_down->air_conditioning_refrigerants',
      'refrigerant_phase_down->equitable_cooling_access',
      'building_energy_efficiency->carbon_emission',
      'building_energy_efficiency->grid_peak_load_stress',
      'building_energy_efficiency->utility_disconnection_risk',
      'building_energy_efficiency->equitable_cooling_access',
      'weatherization_retrofits->building_energy_efficiency',
      'weatherization_retrofits->heat_pump_electrification',
      'weatherization_retrofits->public_health_heat_burden',
      'weatherization_retrofits->utility_disconnection_risk',
      'heat_pump_electrification->carbon_emission',
      'heat_pump_electrification->public_health_heat_burden',
      'passive_cooling_design->public_health_heat_burden',
      'passive_cooling_design->grid_peak_load_stress',
      'passive_cooling_design->nighttime_heat_retention',
      'passive_cooling_design->equitable_cooling_access'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-9/', section: 'Building envelopes, retrofit, passive design, efficient equipment, heat pumps, refrigerants, energy demand, emissions, peak load, affordability and mitigation trade-offs' },
      { url: 'https://www.iea.org/energy-system/buildings', section: 'Building energy demand, efficiency, heat pumps, cooling, retrofit, refrigerants, grids and policy tracking' },
      { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', section: 'Indoor heat exposure, cooling access, power reliability, heat action and health vulnerability' },
      { url: 'https://www.energy.gov/scep/low-income-energy-affordability-data-lead-tool-and-community-energy-solutions', section: 'Household energy burden, affordability, efficiency and community energy context' }
    ],
    scope: 'Named building archetype, climate zone, retrofit or equipment cohort, refrigerant and household group with measured energy, hourly load, indoor temperature, bill burden, disconnection, emissions and health outcomes; direct refrigerant and indirect electricity effects remain separate.',
    counterevidence: 'Poor installation, ventilation or moisture control can harm health; weatherization without cooling may trap heat; heat pumps can raise peak demand or emissions on constrained high-carbon grids; rebound and split incentives reduce savings. Efficiency does not guarantee affordability or prevent disconnection, and refrigerant transition can raise equipment cost without policy and technician capacity.'
  },
  active_public_and_electric_transport_exact_readback: {
    keys: [
      'active_mobility->ambient_air_quality_deficit',
      'active_mobility->carbon_emission',
      'active_mobility->personal_conveyance',
      'electric_vehicle_transition->ambient_air_quality_deficit',
      'electric_vehicle_transition->carbon_emission',
      'public_transit_expansion->active_mobility',
      'public_transit_expansion->ambient_air_quality_deficit',
      'public_transit_expansion->carbon_emission',
      'public_transit_expansion->personal_conveyance',
      'public_transit_expansion->urban_sprawl_housing'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/', section: 'Sections 10.2-10.4 and Table 10.3: urban form, mode choice, public and active transport, car-travel substitution, electromobility, air pollution, emissions and setting-dependent outcomes' },
      { url: 'https://www.iea.org/energy-system/transport', section: 'Transport electrification, modal shift, public transport, active mobility, efficiency and lifecycle emissions tracking' }
    ],
    scope: 'Named urban area and intervention period with mode share, vehicle-kilometres, ridership, walking and cycling trips, fleet and grid emissions, non-exhaust particles, land use and accessibility measured separately; the claim requires substitution of higher-emitting car travel.',
    counterevidence: 'Sparse or unsafe networks, low service frequency, high fares, displacement of walking rather than car trips, induced travel, low-carbon incumbent fleets, high-carbon electricity, non-exhaust particles and transit-oriented displacement can weaken or reverse parts of the pathway. Electric vehicles remove tailpipe exhaust but do not eliminate tire, brake, road-dust or upstream pollution.'
  },
  ecosystem_restoration_and_nature_based_adaptation_exact_readback: {
    keys: [
      'ecosystem_restoration->biodiversity_intactness_loss',
      'ecosystem_restoration->floodplain_exposure',
      'ecosystem_restoration->land_carbon_sink_weakening',
      'ecosystem_restoration->nature_based_adaptation',
      'ecosystem_restoration->topsoil_erosion_acceleration',
      'nature_based_adaptation->biodiversity_intactness_loss',
      'nature_based_adaptation->coastal_inundation_risk',
      'nature_based_adaptation->ecosystem_restoration',
      'nature_based_adaptation->floodplain_exposure',
      'nature_based_adaptation->nighttime_heat_retention'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-7/', section: 'Sections 7.4 and 7.6: restoration and land-based mitigation effects on carbon storage, biodiversity, soil erosion, water and flood regulation, with context-specific trade-offs' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', section: 'Sections 6.3.3-6.3.4: urban nature-based solutions, local cooling, floodplain and wetland storage, coastal protection, biodiversity and maladaptation limits' },
      { url: 'https://www.decadeonrestoration.org/', section: 'UN Decade definition and implementation framing for preventing, halting and reversing ecosystem degradation' }
    ],
    scope: 'Named ecosystem, watershed, floodplain, coastline or urban intervention with baseline degradation drivers, native habitat, carbon stocks, soil loss, hydrology, hazard intensity, temperature and affected population measured over a declared restoration and maintenance period.',
    counterevidence: 'Outcomes are highly site- and design-specific. Monocultures, non-native planting, inadequate area, water scarcity, poor maintenance, displaced land pressure, leakage, green gentrification and extreme hazards beyond ecosystem tolerance can weaken benefits or create harm. Vegetation cooling varies by species, water availability, scale, climate and time of day; nature-based measures complement rather than replace emissions cuts or protection needed for extreme events.'
  },
  flood_relocation_and_heat_action_exact_readback: {
    keys: [
      'equitable_cooling_access->heat_related_mortality_burden',
      'equitable_cooling_access->public_health_heat_burden',
      'flood_resilient_infrastructure->critical_infrastructure_fragility',
      'flood_resilient_infrastructure->emergency_response_overload',
      'flood_resilient_infrastructure->floodplain_exposure',
      'flood_resilient_infrastructure->wastewater_infrastructure_overflow',
      'planned_relocation->disaster_recovery_inequality',
      'planned_relocation->relocation_governance_capacity',
      'urban_heat_action_plans->equitable_cooling_access',
      'urban_heat_action_plans->heat_related_mortality_burden',
      'urban_heat_action_plans->occupational_heat_exposure',
      'urban_heat_action_plans->public_health_heat_burden'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', section: 'Sections 6.3.2-6.3.5: resilient infrastructure, drainage, flood management, cooling access, heat action, health systems, equity and maladaptation' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/', section: 'Sections 17.2-17.5: resilient infrastructure, heat action plans, exposure reduction, managed retreat, planned relocation, institutions, finance and inequitable outcomes' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp2/', section: 'Coastal settlements, planned relocation, managed retreat, rights, livelihoods, services, governance and adaptation limits' },
      { url: 'https://www.unep.org/resources/adaptation-gap-report-2025', section: 'Implementation, finance, planning and capacity gaps that condition adaptation delivery' }
    ],
    scope: 'Named settlement, floodplain, infrastructure system, heat-exposed population or relocation programme with hazard baseline, design standard, service continuity, drainage and overflow, warning and cooling access, health outcomes, worker protections, tenure, compensation, livelihoods and governance measured over a declared implementation period.',
    counterevidence: 'Protection can transfer risk or fail beyond its design standard; infrastructure does not itself remove people or assets from floodplains. Cooling access depends on affordability, reliability and outreach and can increase peak demand. Heat plans without triggers, funding, worker enforcement or last-mile delivery may not reduce illness. Poorly governed relocation can deepen dispossession, cultural loss and inequality, while in-situ adaptation or voluntary mobility may be preferable where risk remains manageable.'
  },
  industrial_material_transition_exact_readback: {
    keys: [
      'green_steel->carbon_emission',
      'green_steel->steel_decarbonization_gap',
      'low_carbon_cement->carbon_emission',
      'low_carbon_cement->cement_process_emissions',
      'low_carbon_cement->resource_depletion'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/', section: 'Sections 11.3-11.4: steel and cement material efficiency, recycling, electrification, hydrogen, clinker substitution, process emissions and carbon capture' },
      { url: 'https://www.iea.org/energy-system/industry', section: 'Industry transition tracking for near-zero steel, cement, material efficiency, energy carriers and infrastructure' }
    ],
    scope: 'Named steel or cement production route, product cohort and market over a declared period with material demand, recycled content, clinker ratio, process and energy emissions, electricity and hydrogen mix, capture rate and virgin-resource inputs measured separately.',
    counterevidence: 'High-carbon electricity or hydrogen, low scrap quality, insufficient substitute materials, rebound in construction demand, carbon-capture underperformance and shifting extraction into new supply chains can weaken reductions. Material efficiency reduces virgin inputs only when total demand and quality requirements do not offset savings; route-specific lifecycle accounting is required.'
  },
  people_centered_early_warning_exact_readback: {
    keys: [
      'multi_hazard_early_warning->disaster_recovery_inequality',
      'multi_hazard_early_warning->early_warning_coverage_gaps',
      'multi_hazard_early_warning->emergency_response_overload',
      'multi_hazard_early_warning->heat_related_mortality_burden'
    ],
    locators: [
      { url: 'https://wmo.int/activities/early-warnings-all', section: 'People-centred end-to-end warning pillars: risk knowledge, observation and forecasting, dissemination and communication, preparedness and response; universal coverage and protection of vulnerable groups' },
      { url: 'https://www.undrr.org/early-warning-for-all', section: 'Multi-hazard early-warning coverage, last-mile communication, preparedness, anticipatory action and inclusive disaster-risk reduction' }
    ],
    scope: 'Named hazard, jurisdiction and exposed population with forecast skill, warning lead time, message receipt, accessibility, trust, protective options, preparedness, evacuation or health action and event outcomes measured over a declared warning season or event set.',
    counterevidence: 'A forecast or nominal system does not prove that warnings reached people or triggered protective action. False alarms, insufficient lead time, communication failures, inaccessible messages, distrust, lack of transport or cooling, and hazards exceeding response capacity can erase benefits; inequality falls only when last-mile systems serve vulnerable groups.'
  },
  marine_food_web_and_fisheries_exact_readback: {
    keys: [
      'marine_heatwaves->marine_food_web_simplification',
      'marine_food_web_simplification->marine_fisheries_collapse',
      'ocean_acidification->marine_food_web_simplification',
      'oceanic_deoxygenation->marine_fisheries_collapse'
    ],
    locators: [
      { url: 'https://bg.copernicus.org/articles/22/6583/2025/', section: 'Abstract; Methods; Results Figures 3-9; Discussion and limitations: satellite-forced EcoTroph-Dyn with-versus-filtered-MHW scenarios, trophic biomass and energy-transfer response, northeastern Pacific estimate and structural uncertainty' },
      { url: 'https://www.nature.com/articles/s41467-024-46263-2', section: 'Independent open Northeast Pacific food-web and energy-flux model corroboration for ecosystem-structure and function disruption during the Blob marine heatwave' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', section: 'Sections 3.4-3.5: warming, acidification and deoxygenation, habitat loss, food-web rearrangement, population declines and regional fisheries disruption' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', section: 'Ocean carbon chemistry, acidification and deoxygenation as physical and biogeochemical impact drivers' }
    ],
    scope: 'Named marine ecosystem or fishery with pH or aragonite saturation, dissolved oxygen, temperature, prey and predator biomass, habitat extent, fishing pressure, recruitment, catch and management measured over a declared observation or projection period.',
    counterevidence: 'Responses vary strongly by species, life stage, acclimation, food-web structure and region. Overfishing, pollution and habitat degradation can dominate climate drivers, while mobility, adaptive management and harvest reduction can preserve stocks. Food-web change or low oxygen raises risk but does not by itself establish irreversible fishery collapse.'
  },
  carbon_sink_feedback_exact_readback: {
    keys: [
      'land_carbon_sink_weakening->temp',
      'ocean_carbon_uptake_weakening->temp',
      'temp->land_carbon_sink_weakening'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', section: 'Sections 5.1, 5.2 and 5.4: anthropogenic carbon partitioning, land and ocean sink dynamics, airborne fraction and carbon-climate feedbacks that amplify or suppress warming' },
      { url: 'https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/', section: 'Global carbon partitioning among atmosphere, ocean and land, sink variability and annual budget uncertainty' }
    ],
    scope: 'Global or explicitly regional carbon-budget period with anthropogenic emissions, atmospheric growth, land and ocean uptake, temperature, drought and disturbance measured consistently; sink flux change and accumulated atmospheric carbon remain distinct.',
    counterevidence: 'CO2 fertilisation, nutrient availability, regrowth and regional circulation can strengthen sinks temporarily; internal variability can dominate short periods. Anthropogenic emissions remain the primary driver of atmospheric CO2, and a weaker sink amplifies warming only by leaving more emitted carbon airborne rather than creating the original emissions.'
  },
  mangrove_and_watershed_buffer_loss_exact_readback: {
    keys: [
      'coastal_erosion->mangrove_buffer_loss',
      'deforestation->watershed_forest_loss',
      'sea_level_rise->mangrove_buffer_loss',
      'wildfire_regime_shift->watershed_forest_loss'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/', section: 'Sections 2.4-2.5: wildfire and land-use effects on forest integrity, water supplies, erosion and ecosystem services' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', section: 'Coastal erosion, sea-level rise, mangrove and coastal-wetland habitat loss, migration limits and protective ecosystem services' },
      { url: 'https://www.ipbes.net/global-assessment', section: 'Land-use change, direct exploitation, habitat loss and degradation as direct drivers of biodiversity and ecosystem-service loss' }
    ],
    scope: 'Named mangrove coast or forested watershed with shoreline position, relative sea-level rise, sediment supply, accommodation space, fire severity, forest cover, erosion, water quality and protective service measured over a declared event or trend period.',
    counterevidence: 'Mangroves can accrete or migrate where sediment and landward space permit; coastal engineering can alter erosion. Fire-adapted forests may recover, and deforestation effects depend on location, intensity and riparian retention. Buffer loss is not inferred from hazard exposure alone without measured habitat or service decline.'
  },
  pm25_long_term_mortality_exact_readback: {
    keys: [
      'pm2_5_particulates->air_pollution_health_burden'
    ],
    exact_claim: 'Higher long-term ambient PM2.5 exposure is associated with higher natural-cause mortality risk in the cohort literature synthesized for the WHO air-quality guidelines.',
    locators: [
      { url: 'https://www.sciencedirect.com/science/article/pii/S0160412020319292', section: 'Abstract and natural-cause mortality meta-analysis: pooled risk ratio 1.08 with 95 percent confidence interval 1.06-1.09 per 10 micrograms per cubic metre higher long-term PM2.5 exposure' },
      { url: 'https://www.who.int/publications/i/item/9789240034228', section: 'WHO Global Air Quality Guidelines, PM2.5 recommendation and systematic-review evidence for long-term mortality effects' },
      { url: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health', section: 'Ambient PM2.5 exposure and cardiovascular, respiratory and mortality burden' }
    ],
    scope: 'Populations represented by 25 long-term cohort studies in the WHO-commissioned systematic review, using study-specific ambient PM2.5 exposure estimates and natural-cause mortality follow-up through the evidence published for the 2021 WHO guideline.',
    counterevidence: 'The pooled estimate is observational and varies with baseline concentration, particle composition, source mixture, age, baseline disease, socioeconomic conditions, co-pollutants, exposure-assessment error, regional cohort coverage and confounder adjustment. It is not an individual probability, short-term smoke-event coefficient, source-specific causal effect or attributable-death count, and the reported supralinear concentration-response limits linear extrapolation.'
  },
  heat_cooling_and_air_quality_exact_readback: {
    keys: [
      'urbanization->air_conditioning_refrigerants',
      'wet_bulb_heat->air_conditioning_refrigerants',
      'grid_peak_load_stress->public_health_heat_burden'
    ],
    locators: [
      { url: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health', section: 'PM2.5 exposure and cardiovascular, respiratory and mortality burden' },
      { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', section: 'Heat, humidity, urban exposure, cooling access, power shortages, health-service disruption, illness and mortality' },
      { url: 'https://www.iea.org/reports/the-future-of-cooling', section: 'Urbanisation, rising heat, air-conditioner demand, electricity load, efficiency and refrigerant implications' }
    ],
    scope: 'Named population, city, heat event or cooling-equipment cohort with PM2.5 exposure, temperature and humidity, cooling ownership and use, refrigerant charge and leakage, hourly grid load, outage duration and health outcomes measured separately.',
    counterevidence: 'PM2.5 burden depends on dose, composition, baseline health and co-pollutants. Urbanisation and humid heat increase cooling demand but do not determine technology or refrigerant choice; passive cooling, efficiency and low-GWP refrigerants can break the link. Peak stress harms health chiefly where outages or affordability failures interrupt protective cooling or medical services.'
  },
  industrial_process_heat_gap_exact_readback: {
    keys: [
      'industrial_heat_decarbonization_gap->cement_process_emissions',
      'industrial_heat_decarbonization_gap->steel_decarbonization_gap'
    ],
    locators: [
      { url: 'https://www.iea.org/reports/demand-and-supply-measures-for-the-steel-and-cement-transition/executive-summary', section: 'Steel and cement transition pathways, demand measures, low-emissions production and remaining technology and infrastructure gaps' },
      { url: 'https://www.energy.gov/cmei/ito/process-heat-basics', section: 'Industrial process heat, steel electric-arc furnaces, cement temperatures above 1000 degrees Celsius, energy supply and equipment requirements' },
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/', section: 'Sections 11.3-11.4: high-temperature heat, calcination, electrification, hydrogen and capture in steel and cement' }
    ],
    scope: 'Named steel or cement route with process temperature, heat source, electricity or fuel emissions, calcination, feedstock, product output and capture measured over a declared plant and production period.',
    counterevidence: 'Cement calcination emissions persist even when kiln heat is decarbonised, while some steel routes can electrify or use hydrogen. A generic heat gap is therefore not the entire sectoral gap; route-specific process, feedstock and capture accounting is required.'
  },
  vector_suitability_and_urban_services_exact_readback: {
    keys: [
      'temp->vector_borne_disease_expansion',
      'urbanization->vector_borne_disease_expansion'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/', section: 'Sections 7.2-7.3: temperature, humidity, rainfall, urbanisation, population mobility and changing malaria, dengue and other vector-borne disease risk' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-16/', section: 'Cross-regional climate-sensitive disease risks, exposure, vulnerability, health systems and adaptation' }
    ],
    scope: 'Named vector-pathogen pair and population with temperature, humidity and rainfall within species-specific bounds, vector abundance, pathogen transmission, mobility, housing, water and sanitation, surveillance, control and confirmed disease incidence measured over a declared season or trend.',
    counterevidence: 'Thermal suitability is nonlinear and can decline above upper thresholds. Vector control, housing, sanitation, immunity, mobility, health care and socioeconomic development can dominate climate effects; urbanisation can reduce or increase risk depending on services and vector ecology.'
  },
  marine_heatwave_harmful_algal_bloom_exact_readback: {
    keys: ['marine_heatwaves->harmful_algal_blooms'],
    locators: [
      { url: 'https://research.noaa.gov/in-hot-water-exploring-marine-heatwaves/', section: 'Marine heatwaves, ecosystem disruption and biological responses' },
      { url: 'https://www.fisheries.noaa.gov/feature-story/scientists-confirm-link-between-red-tides-and-low-oxygen-areas', section: 'Seasonal red tide, hypoxia, event severity, marine mortality and climate-conditioned future risk' },
      { url: 'https://oceanservice.noaa.gov/hazards/hypoxia/', section: 'Temperature, nutrients, stratification, algal production, decomposition and oxygen depletion' }
    ],
    scope: 'Named coastal bloom species and water body with temperature anomaly, marine-heatwave duration, nutrient availability, stratification, circulation, bloom abundance or toxin and dissolved oxygen measured over the same event period.',
    counterevidence: 'Warm anomalies alone do not cause every bloom. Nutrients, light, species ecology, seed populations, circulation and grazing can dominate, and some harmful species decline at high temperatures; promotion requires event-specific temporal and ecological alignment.'
  },
  glacier_runoff_and_snow_storage_exact_readback: {
    keys: [
      'firn_layer_depletion->glacier_meltwater_dependency',
      'glacier_meltwater_dependency->hydropower_reliability_decline',
      'snow_drought->reservoir_storage_instability',
      'snow_drought->river_flow_regime_shift',
      'thermokarst_expansion->methane'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Sections 9.4-9.5: firn retention, glacier mass balance, snow storage, runoff timing, peak water and cryosphere hydrology' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp5/', section: 'Mountain water, reservoir, hydropower and downstream livelihood dependence under changing snow and glacier runoff' },
      { url: 'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground', section: 'Permafrost thaw, ground ice, thermokarst, carbon decomposition and greenhouse-gas release' }
    ],
    scope: 'Named glacier, snow-fed basin, reservoir, hydropower system or thermokarst landscape with accumulation, firn storage, melt, runoff timing, reservoir inflow, generation, thaw area, soil moisture and methane flux measured over a declared season or trend.',
    counterevidence: 'High accumulation can offset firn loss; glacier runoff can rise before peak water and decline afterward. Reservoir operation, precipitation, demand and market dispatch can dominate hydropower. Snow drought may reflect low precipitation, warmth or both, with different runoff effects. Thermokarst methane requires thawed carbon and sufficiently anaerobic conditions; dry thaw can favour carbon dioxide instead.'
  },
  warming_shipping_and_glacial_lake_risk_exact_readback: {
    keys: [
      'sea_ice_season_loss->arctic_shipping_expansion',
      'temp->arctic_shipping_expansion',
      'temp->glacial_lake_failure_risk'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-2/', section: 'High-mountain warming, glacier retreat, glacial-lake growth and outburst risk' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Sections 9.3-9.4: Arctic sea-ice decline, seasonal accessibility and cryosphere change' },
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Polar sea-ice change, accessibility, shipping opportunities and environmental and operational hazards' }
    ],
    scope: 'Named Arctic route or high-mountain glacial lake with observed temperature, sea-ice season, vessel activity, glacier retreat, lake area, dam type and condition, triggering event and downstream exposure measured over a declared navigation season or lake-monitoring period.',
    counterevidence: 'Reduced ice does not guarantee shipping growth: economics, regulation, ports, insurance, geopolitics, remaining mobile ice and weather matter. Warming and retreat can create or enlarge lakes, but lake failure additionally requires unstable dams, displacement waves, intense runoff, ice or slope failure, or another trigger.'
  },
  arctic_pack_ice_drift_exact_readback: {
    keys: [
      'arctic_pack_ice_drift->shipping_lane_disruption',
      'ocean_current_regime_shift->arctic_pack_ice_drift',
      'sea_ice_season_loss->arctic_pack_ice_drift',
      'temp->arctic_pack_ice_drift'
    ],
    locators: [
      { url: 'https://nsidc.org/learn/parts-cryosphere/sea-ice', section: 'Sea-ice motion under winds and ocean currents, seasonal growth and melt, concentration and hazards' },
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Arctic sea-ice extent, thickness, mobility, wind and ocean forcing, navigation and compound hazards' }
    ],
    scope: 'Named Arctic route and ice-analysis domain with concentration, thickness, floe motion, wind, current, temperature, vessel class and delay or closure measured over the same navigation period.',
    counterevidence: 'Drift is primarily event-scale wind and current driven; long-term warming and season loss alter the ice pack but do not determine each drift event. Better routing, ice-class vessels, escorts and forecasts can prevent mobile ice from disrupting a lane.'
  },
  glacier_hydrologic_flood_exact_readback: {
    keys: [
      'glacial_lake_failure_risk->glacier_hydrologic_system_floods',
      'glacier_hydrologic_system_floods->river_flow_regime_shift',
      'snowmelt_timing_shift->glacier_hydrologic_system_floods',
      'temp->glacier_hydrologic_system_floods'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-2/', section: 'High-mountain glacier and snow hydrology, glacial-lake outburst floods, changing runoff timing and downstream hazards' },
      { url: 'https://www.usgs.gov/water-science-school/science/glaciers-and-icecaps', section: 'Glacier storage, meltwater, streamflow and downstream hydrologic effects' }
    ],
    scope: 'Named glacier-fed catchment with temperature, snow and glacier melt timing, lake and subglacial storage, drainage event, discharge hydrograph and downstream river regime measured over a declared event and baseline period.',
    counterevidence: 'Earlier snowmelt or warming does not itself establish an outburst; drainage geometry, storage, dam stability and triggering events are essential. A single flood alters a hydrograph but constitutes a regime shift only when timing, magnitude or frequency changes persist relative to a baseline.'
  },
  polar_ice_algae_food_web_exact_readback: {
    keys: [
      'ice_algae_pigmentation->marine_food_web_simplification',
      'sea_ice_season_loss->ice_algae_pigmentation',
      'temp->ice_algae_pigmentation'
    ],
    locators: [
      { url: 'https://arctic.noaa.gov/report-card/report-card-2024/arctic-ocean-primary-productivity/', section: 'Sea-ice algae, light, seasonal ice cover, primary production and Arctic marine food-web support' },
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Sea-ice habitats, ice algae, phenology, productivity and cascading polar food-web effects' }
    ],
    scope: 'Named polar shelf or sea-ice domain with ice season, temperature, light, nutrients, algal pigment or biomass, primary production and consumer response measured over the same seasonal cycle.',
    counterevidence: 'Pigment concentration is an indicator rather than the entire production pathway; thinner ice can increase light and productivity in some settings, while nutrient limitation, stratification and species turnover can offset gains. Food-web simplification requires measured trophic change, not pigment change alone.'
  },
  ice_cap_and_grounding_line_exact_readback: {
    keys: [
      'ice_cap_decapitation->sea_level_rise',
      'temp->ice_cap_decapitation',
      'ice_shelf_grounding_line_retreat->sea_level_rise',
      'ocean_heat_content->ice_shelf_grounding_line_retreat',
      'temp->ice_shelf_grounding_line_retreat'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-2/', section: 'Mountain glacier and ice-cap thinning, fragmentation, disappearance and sea-level contribution' },
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Ice-shelf basal melt, grounding-line retreat, marine ice-sheet instability and sea-level contribution' },
      { url: 'https://earthobservatory.nasa.gov/images/148561/antarcticas-retreating-ice-shelves', section: 'Observed Antarctic ice-shelf and grounding-line retreat under ocean and atmospheric forcing' },
      { url: 'https://climate.nasa.gov/vital-signs/ice-sheets/', section: 'Satellite-observed land-ice mass change and contribution to global mean sea level' }
    ],
    scope: 'Named ice cap or marine-terminating ice-sheet sector with air and ocean temperature, surface and basal mass balance, ice thickness, grounding-line position, discharge and sea-level-equivalent mass change measured over a declared observation or projection period.',
    counterevidence: 'Ice-cap geometry and accumulation can delay fragmentation, and local air temperature does not determine every cap response. Grounding-line retreat depends strongly on bed geometry, ocean access, basal melt and buttressing; sea-level contribution requires land-ice discharge or melt and cannot be inferred from floating-shelf loss alone.'
  },
  nunatak_and_mountain_avalanche_exact_readback: {
    keys: [
      'nunatak_habitat_shrinkage->biodiversity_intactness_loss',
      'temp->nunatak_habitat_shrinkage',
      'mountain_pass_avalanches->critical_infrastructure_fragility',
      'rain_on_snow_flood_risk->mountain_pass_avalanches',
      'snowmelt_timing_shift->mountain_pass_avalanches',
      'temp->mountain_pass_avalanches'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-2/', section: 'High-mountain habitat compression, snow and glacier change, rain-on-snow, avalanche regimes and infrastructure risk' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/', section: 'Mountain biodiversity, range contraction, isolated cold-adapted habitat and warming impacts' },
      { url: 'https://www.slf.ch/fileadmin/user_upload/SLF/Lawinen/Unfaelle_Schadenlawinen/Unfallberichte_Publikationen/Englisch/1997_Laternser.pdf', section: 'Temperature, rain-snow transition, wet-snow avalanches, elevation and season-specific countervailing trends' }
    ],
    scope: 'Named polar or alpine nunatak biota or mountain transport corridor with temperature, snow cover, species occupancy, avalanche type and frequency, rain-on-snow, infrastructure exposure and disruption measured over a declared season or trend.',
    counterevidence: 'Glacier retreat can expose additional ice-free terrain even while cold-adapted habitat quality declines, so physical area and biotic suitability must not be conflated. Warming can reduce dry-snow avalanches at lower elevations while increasing wet-snow activity; pass disruption depends on exposure, protection, forecasting and closure policy.'
  },
  permafrost_tundra_methane_exact_readback: {
    keys: [
      'permafrost_thaw->tundra_methane_outgassing',
      'temp->tundra_methane_outgassing',
      'thermokarst_expansion->tundra_methane_outgassing',
      'tundra_methane_outgassing->methane'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Permafrost warming and thaw, thermokarst, carbon decomposition and carbon dioxide and methane emissions' },
      { url: 'https://arctic.noaa.gov/report-card/report-card-2024/arctic-terrestrial-carbon-cycling/', section: 'Observed permafrost carbon fluxes, thaw, hydrology, tundra sources and uncertainty' }
    ],
    scope: 'Named tundra or thermokarst monitoring domain with ground temperature, active-layer depth, thaw area, water table, soil carbon and chamber, tower or inversion methane flux measured over a declared season and multi-year baseline.',
    counterevidence: 'Methane requires anaerobic decomposition and can be oxidised before reaching the atmosphere; dry thaw often favours carbon dioxide. Vegetation uptake, lake drainage, fire, snow and microbial processes alter net flux, and regional outgassing must not be inferred from one chamber or lake.'
  },
  atmospheric_dryness_wildfire_and_hail_exact_readback: {
    keys: [
      'atmospheric_dryness->wildfire_regime_shift',
      'drought_persistence->atmospheric_dryness',
      'drought_persistence->wildfire_regime_shift',
      'extreme_precipitation_intensity->hail_hazard_shift',
      'humidity_amplification->hail_hazard_shift',
      'soil_moisture_collapse->atmospheric_dryness'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', section: 'Sections 11.3-11.7: soil-moisture-atmosphere feedbacks, evaporative demand, drought, fire weather, severe convection, heavy precipitation and hail' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-16/', section: 'Cross-regional compound extremes, drought and wildfire risk, uncertainty and interacting exposure' }
    ],
    scope: 'Named region and season with soil moisture, vapour-pressure deficit or evaporative demand, drought duration, fuel moisture, fire activity, convective environment, hail observations and precipitation intensity measured on compatible scales.',
    counterevidence: 'Ignition, wind and fuel continuity are required for wildfire; drought and atmospheric dryness share drivers and neither proves fire. Hail depends on convective updrafts, freezing level and microphysics, and warming can reduce hail at the surface in some regions even as moisture or severe-storm potential rises.'
  },
  peat_and_tidal_wetland_carbon_exact_readback: {
    keys: [
      'coastal_inundation_risk->tidal_wetland_carbon_reversal',
      'drought_persistence->peat_oxidation_pulse',
      'peatland_degradations->carbon_emission',
      'wetlands_drainage_scales->tidal_wetland_carbon_reversal'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', section: 'Peat and wetland carbon, drying, drainage, oxidation, disturbance and carbon-cycle feedbacks' },
      { url: 'https://www.ipcc-nggip.iges.or.jp/public/wetlands/pdf/Wetlands_separate_files/WS_Chp2_Drained_Inland_Organic_Soils.pdf', section: 'Chapter 2 Sections 2.1-2.2 and Table 2.1: drainage, persistent CO2, DOC and fire loss terms, land-use and climate stratification, Tier 1 factors, confidence intervals and transition limitations' },
      { url: 'https://doi.org/10.22146/ipas.6170', section: 'Central and West Kalimantan 2006-2007 land-use-specific peat CO2 chamber fluxes, water-table relationships, crop carbon balance and short-campaign limitations' },
      { url: 'https://coast.noaa.gov/states/fast-facts/blue-carbon.html', section: 'Coastal wetland carbon storage, drainage and disturbance emissions, sea-level and landward-migration constraints' },
      { url: 'https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/', section: 'Land-use and ecosystem carbon fluxes, sink and source accounting and uncertainty' }
    ],
    scope: 'Named peatland or tidal wetland with water table, drought or drainage, salinity and inundation, sediment accretion, migration space, soil carbon and carbon dioxide or methane flux measured over a declared event and recovery period.',
    counterevidence: 'Wet conditions can suppress oxidation while raising methane; some wetlands accrete or migrate under sea-level rise. Inundation risk does not prove carbon reversal unless vegetation, erosion, soil loss or net greenhouse-gas flux changes are measured, and drainage effects depend on depth, duration and management.'
  },
  nao_pna_drought_and_blocking_exact_readback: {
    keys: [
      'north_atlantic_oscillation->blocking_pattern_persistence',
      'north_atlantic_oscillation->drought_persistence',
      'pacific_north_american_pattern->drought_persistence'
    ],
    locators: [
      { url: 'https://www.cpc.ncep.noaa.gov/data/teledoc/teleintro.shtml', section: 'NOAA CPC teleconnection patterns, circulation anomalies and associated regional temperature and precipitation departures' },
      { url: 'https://www.cpc.ncep.noaa.gov/data/teledoc/pna.shtml', section: 'PNA phase, North Pacific and North American circulation, temperature and precipitation anomalies' }
    ],
    scope: 'Declared NAO or PNA index definition, phase and season with blocking metric, storm-track or precipitation anomaly and drought indicator evaluated over a named North Atlantic-European or North American region.',
    counterevidence: 'These are modes and statistical covariation, not deterministic one-way causes. Effects reverse by phase and region, internal variability is large, and persistent drought additionally depends on land feedbacks, other modes and weather sequences; relationship level remains indirect.'
  },
  cryoconite_hole_expansion_exact_readback: {
    keys: [
      'particulate_soot_levels->cryoconite_hole_expansion',
      'soot_deposition_on_snow->cryoconite_hole_expansion',
      'temp->cryoconite_hole_expansion'
    ],
    locators: [
      { url: 'https://earthobservatory.nasa.gov/images/145249/soot-speeds-up-snowmelt', section: 'Light-absorbing particles, snow and ice albedo, absorbed solar energy and accelerated melt' },
      { url: 'https://doi.org/10.3389/feart.2019.00360', section: 'Cryoconite formation and hole dynamics under debris optical properties, solar radiation, melt and meteorology' }
    ],
    scope: 'Named glacier surface with deposited light-absorbing particle mass and composition, albedo, shortwave radiation, melt rate, air temperature and cryoconite-hole area or depth measured over the same ablation season.',
    counterevidence: 'Mineral dust and local biological material may dominate over combustion soot; wind redistribution, snowfall, flushing and hole collapse can reverse short-term changes. Air temperature influences melt but solar absorption and debris properties are central to cryoconite-hole development.'
  },
  pacific_decadal_variability_exact_readback: {
    keys: [
      'pacific_decadal_oscillation->environ_anomalies',
      'pacific_decadal_oscillation->pelagic_species_redistribution'
    ],
    locators: [
      { url: 'https://repository.library.noaa.gov/view/noaa/54477', section: 'PDO definition, index interpretation, basin temperature patterns and climate variability' },
      { url: 'https://psl.noaa.gov/data/correlation/pdo.data', section: 'NOAA PSL PDO monthly index and metadata' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', section: 'Ocean temperature anomalies, habitat shifts and marine species redistribution under climate variability and change' }
    ],
    scope: 'Declared PDO index and phase with regional sea-surface temperature anomaly, habitat envelope and observed pelagic distribution evaluated for a named North Pacific region and season or multi-year period.',
    counterevidence: 'PDO is a descriptive mode with multiple underlying processes and is not independent of ENSO. Species distributions also respond to fishing, prey, oxygen and long-term warming; the edge is a bounded association or modulation, not a universal causal effect.'
  },
  qbo_stratosphere_troposphere_exact_readback: {
    keys: [
      'quasi_biennial_oscillation->madden_julian_oscillation',
      'quasi_biennial_oscillation->stratospheric_cooling'
    ],
    locators: [
      { url: 'https://acd-ext.gsfc.nasa.gov/Data_services/met/qbo/qbo.html', section: 'NASA QBO wind index, alternating equatorial stratospheric wind regimes and associated temperature structure' },
      { url: 'https://www.giss.nasa.gov/pubs/abs/sa09400x.html', section: 'Observed QBO modulation of tropical convection and Madden-Julian Oscillation activity' }
    ],
    scope: 'Declared QBO wind index, phase and pressure level with equatorial stratospheric temperature and MJO activity measured over a named season and tropical domain.',
    counterevidence: 'The QBO is an oscillatory state, not a monotonic driver; temperature anomalies reverse by phase and altitude. QBO-MJO coupling is probabilistic and conditioned by season, ENSO, ocean state and sampling, so the relationship remains indirect.'
  },
  persistent_rossby_heat_and_drought_exact_readback: {
    keys: [
      'rossby_wave_stalling->compound_day_night_heat_extremes',
      'rossby_wave_stalling->drought_persistence'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', section: 'Persistent atmospheric circulation, blocking, compound heat and drought, and regional attribution uncertainty' },
      { url: 'https://www.nature.com/articles/s41467-026-70487-z', section: 'Persistent planetary-wave configurations, compound day-night heat and event duration' }
    ],
    scope: 'Named mid-latitude event or region with an explicit wave-persistence or blocking metric, temperature minima and maxima, precipitation, soil moisture and event duration measured on compatible daily scales.',
    counterevidence: 'Rossby waves continuously propagate and a visually slow pattern is not necessarily dynamically stalled. Land-atmosphere feedbacks, advection, radiative conditions and other circulation modes can dominate; the edge is retained only for events with objectively measured persistence.'
  },
  energy_supply_chain_and_reliability_exact_readback: {
    keys: [
      'battery_supply_chain_pressure->renewable_curtailment_losses',
      'data_centers->semiconductor_fabrication_footprint',
      'data_centers->transformer_supply_bottleneck',
      'freight_electrification_gap->ambient_air_quality_deficit',
      'gas_power_dependence->energy_affordability_crisis',
      'transformer_supply_bottleneck->grid_peak_load_stress',
      'utility_disconnection_risk->backup_generator_dependence'
    ],
    locators: [
      { url: 'https://www.iea.org/reports/global-critical-minerals-outlook-2025', section: 'Battery-material supply, manufacturing concentration, deployment constraints and diversification' },
      { url: 'https://www.iea.org/reports/energy-and-ai/ai-and-energy-security', section: 'Data-centre electricity, chips, large-load interconnection, grids and supply chains' },
      { url: 'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report', section: 'US data-centre load growth, equipment and grid implications' },
      { url: 'https://www.epa.gov/regulations-emissions-vehicles-and-engines/regulations-greenhouse-gas-emissions-commercial-trucks', section: 'Commercial-truck combustion emissions and transition standards' },
      { url: 'https://www.eia.gov/energyexplained/natural-gas/natural-gas-and-the-environment.php', section: 'Natural-gas fuel use, supply and price exposure in electricity systems' },
      { url: 'https://www.energy.gov/policy/articles/supply-chain-crisis-facing-nations-electric-grid', section: 'Transformer lead times, substation expansion and grid-reliability constraints' },
      { url: 'https://www.iea.org/reports/the-future-of-cooling', section: 'Cooling reliability, electricity access, backup power and household vulnerability' }
    ],
    scope: 'Named grid, supply chain, freight fleet, data-centre market or affected customer cohort with equipment demand and delivery, interconnection timing, storage or curtailment, fuel prices, diesel emissions, outage or disconnection and backup generation measured over a declared period.',
    counterevidence: 'Supply pressure does not prove deployment failure where inventories, substitution, recycling or alternative technologies exist. Data centres are not the sole driver of chip or transformer demand. Gas can lower costs in some periods; affordability depends on market design. Backup generation depends on critical-load needs, ownership and outage duration and is not an automatic result of every disconnection risk.'
  },
  food_water_and_livelihood_dependency_exact_readback: {
    keys: [
      'food->industry_farming',
      'glacier_meltwater_dependency->basin_treaty_breakdown',
      'indian_ocean_dipole->food',
      'marine_fisheries_collapse->fishery_protein_dependence'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-7/', section: 'Food demand, production expansion and intensification, land and input pressures and mitigation trade-offs' },
      { url: 'https://www.fao.org/interactive/2025/how-to-sustainable-agriculture/en/', section: 'Demand, agricultural production systems, intensification and sustainability' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp5/', section: 'Shared mountain water, changing glacier runoff, downstream sectors, institutions and transboundary cooperation' },
      { url: 'https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/IODMI/DMI.html', section: 'Indian Ocean Dipole index and associated regional climate anomalies' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', section: 'Regional fishery disruption and nutritional and livelihood dependence on marine ecosystems' },
      { url: 'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture', section: 'Fisheries production, food security, nutrition and livelihood dependence' }
    ],
    scope: 'Named food system, shared glacier-fed basin, IOD-sensitive production region or fishery-dependent population with demand, production route, runoff, treaty performance, rainfall, yield, catch, dietary fish share and substitution measured over a declared season or trend.',
    counterevidence: 'Demand can be met through waste reduction, dietary change or low-input productivity rather than industrial intensification. Hydrologic stress does not inevitably break treaties; institutions can adapt. IOD effects reverse by phase and region. Fishery decline raises exposure only where diets and livelihoods lack affordable substitutes or adaptive management.'
  },
  forecast_and_hazard_cascade_exact_readback: {
    keys: [
      'flash_flood_regime->vector_borne_disease_expansion',
      'hail_hazard_shift->insurance_retreat',
      'lightning_fire_weather->smoke_exposure_burden',
      'madden_julian_oscillation->flash_flood_regime',
      'monsoon_volatility->extreme_precipitation_intensity',
      'multi_hazard_early_warning->urban_heat_action_plans'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/', section: 'Flood aftermath, standing water, vector exposure and disease risk' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/', section: 'Monsoon, MJO, severe convection, heavy precipitation, hail and compound-event mechanisms' },
      { url: 'https://www.who.int/health-topics/wildfires', section: 'Wildfire smoke exposure and health burden' },
      { url: 'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/MJO/mjo.shtml', section: 'MJO active convection and regional tropical rainfall modulation' },
      { url: 'https://www.nesdis.noaa.gov/about/k-12-education/severe-weather/what-monsoon', section: 'Monsoon circulation, seasonal rainfall and heavy-rain hazards' },
      { url: 'https://wmo.int/activities/early-warnings-all', section: 'Forecast dissemination, preparedness and response triggers' },
      { url: 'https://www.undrr.org/early-warning-for-all', section: 'People-centred end-to-end warning and anticipatory action' }
    ],
    scope: 'Named event, region or programme with flood timing and vector ecology, hail losses and insurance response, lightning ignition and smoke exposure, MJO or monsoon index and rainfall, or heat forecast and action-plan activation measured over compatible periods.',
    counterevidence: 'Floods can flush breeding sites and disease depends on pathogen and services. Hail loss does not guarantee insurer exit. Lightning requires dry receptive fuels to produce smoke. MJO and monsoon phases modulate rather than determine local extremes. Warning systems enable heat plans only when forecasts are linked to funded triggers and last-mile action.'
  },
  coupled_ocean_atmosphere_transition_exact_readback: {
    keys: [
      'aerosol_cooling_loss->monsoon_volatility',
      'el_nino->la_nina',
      'madden_julian_oscillation->el_nino',
      'ocean_current_regime_shift->marine_food_web_simplification',
      'temp->tropical_cyclone_rapid_intensification'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/', section: 'Aerosol forcing, circulation and regional monsoon precipitation response' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Ocean circulation, heat and nutrient transport, ENSO and marine ecosystem implications' },
      { url: 'https://www.climate.gov/news-features/blogs/enso/double-dipping-why-does-la-ni%C3%B1a-often-occur-consecutive-winters', section: 'ENSO recharge-discharge dynamics and transition into La Nina conditions' },
      { url: 'https://repository.library.noaa.gov/view/noaa/64700', section: 'MJO-related westerly wind bursts and ENSO initiation evidence' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', section: 'Circulation-driven heat, nutrients, habitat and food-web change' },
      { url: 'https://www.aoml.noaa.gov/ocean-conditions-in-the-intensification-of-hurricane-michael-2018/', section: 'Tropical cyclone heat, moisture, wind shear and ocean-atmosphere preconditions' },
      { url: 'https://www.aoml.noaa.gov/atlantic-coast-hurricanes-intensifying-faster/', section: 'Observed rapid-intensification trends and environmental conditions' }
    ],
    scope: 'Named monsoon, ENSO event, ocean ecosystem or tropical-cyclone basin with forcing or mode indices, circulation, heat and nutrient transport, wind bursts, sea-surface and subsurface temperature, shear and event response measured over a declared season or trend.',
    counterevidence: 'Aerosol removal has region- and season-specific monsoon effects. El Nino does not always transition to La Nina, and MJO wind bursts do not guarantee El Nino. Currents can redistribute rather than simplify food webs. Warming raises potential intensity and rapid-intensification odds only when ocean heat, moisture, low shear and storm structure align.'
  },
  adaptation_capacity_relocation_governance_exact_readback: {
    keys: ['adaptation_capital_shortfall->relocation_governance_capacity'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/', section: 'Adaptation finance gaps, institutional capacity, transformational adaptation, managed retreat and planned relocation' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/technical-summary/', section: 'Finance, governance and capacity constraints on adaptation implementation' }
    ],
    scope: 'Named relocation or managed-retreat programme with budget need and flow, staffing, land and housing capacity, participation, compensation, service delivery and implementation milestones measured over a declared planning period.',
    counterevidence: 'Finance is necessary but not sufficient: rights, legitimacy, land availability and institutional design can dominate. Some capable institutions operate under limited capital, while poorly governed programmes can fail despite funding; the edge is a capacity constraint rather than a deterministic outcome.'
  },
  coupled_climate_mode_exact_readback: {
    keys: [
      'el_nino->indian_ocean_dipole',
      'el_nino->madden_julian_oscillation',
      'el_nino->pacific_decadal_oscillation',
      'el_nino->pacific_north_american_pattern',
      'indian_ocean_dipole->madden_julian_oscillation',
      'la_nina->pacific_decadal_oscillation',
      'ocean_current_regime_shift->atlantic_multidecadal_oscillation',
      'ocean_heat_content->humidity_amplification',
      'ocean_salinity_stratification->atlantic_ni_o_ni_a',
      'pacific_decadal_oscillation->pacific_north_american_pattern',
      'stratospheric_cooling->southern_annular_mode'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/', section: 'Sections 3.3-3.7: observed modes of variability, ENSO teleconnections, coupled ocean-atmosphere interactions, stratosphere-troposphere coupling and attribution limits' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Ocean heat, salinity and circulation, tropical basin coupling, ENSO, IOD and Atlantic variability' },
      { url: 'https://psl.noaa.gov/data/climateindices/', section: 'NOAA PSL definitions and time series for monitored climate indices and modes' }
    ],
    scope: 'Declared climate-index definitions, phase, season and basin with lagged circulation, temperature, salinity, humidity or teleconnection response evaluated over a named historical or model period.',
    counterevidence: 'These are coupled modes and conditional statistical dependencies, not independent one-way forcings. Direction, sign and lag change by season, phase and model; shared variability and index overlap must be tested, and the relationships remain indirect rather than deterministic.'
  },
  food_system_exposure_exact_readback: {
    keys: [
      'cold_chain_failure_risk->food_waste',
      'drought_persistence->farm_heat_stress',
      'food->fertilizer_production',
      'urbanization->food_waste',
      'water_stress->livestock_disease_pressure',
      'wet_bulb_heat->farm_heat_stress',
      'wet_bulb_heat->livestock_disease_pressure'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/', section: 'Food-system climate risk, agricultural labour and livestock heat, water stress, input demand, storage, cold chains and food loss' },
      { url: 'https://www.fao.org/climate-change/en', section: 'FAO climate impacts and adaptation across crop, livestock, storage and food supply chains' },
      { url: 'https://www.fao.org/energy/news-and-events/news/news-details/cooling-the-chain--cutting-the-waste/en', section: 'Cold-chain interruption and perishable food loss' }
    ],
    scope: 'Named commodity, farm workforce, livestock system or urban food chain with cold-chain temperature, loss, drought and wet-bulb exposure, safe work capacity, water quantity and quality, disease outcomes, food demand and fertilizer output measured over a declared season or market period.',
    counterevidence: 'Cold-chain failure does not spoil shelf-stable food, and urbanisation can improve logistics while changing waste patterns. Drought and wet-bulb heat share weather drivers but affect workers and animals through distinct pathways. Water stress does not itself establish infectious disease, and demand can be met with nutrient efficiency or recycling rather than additional fertilizer production.'
  },
  atlantic_mode_and_ecosystem_exact_readback: {
    keys: [
      'atlantic_multidecadal_oscillation->environ_anomalies',
      'atlantic_multidecadal_oscillation->marine_heatwaves',
      'atlantic_multidecadal_oscillation->ocean_current_regime_shift',
      'atlantic_ni_o_ni_a->environ_anomalies',
      'atlantic_ni_o_ni_a->monsoon_volatility',
      'atlantic_ni_o_ni_a->pelagic_species_redistribution'
    ],
    locators: [
      { url: 'https://psl.noaa.gov/data/correlation/amon.us.data', section: 'NOAA Atlantic multidecadal sea-surface-temperature index and metadata' },
      { url: 'https://www.nature.com/articles/s41558-026-02684-z', section: 'Atlantic Nino/Nina variability, tropical Atlantic sea-surface temperature and greenhouse-warming response' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/', section: 'Atlantic modes, circulation and rainfall teleconnections' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', section: 'Marine heat, habitat anomalies and species redistribution' }
    ],
    scope: 'Declared Atlantic multidecadal or Atlantic Nino index, phase and region with sea-surface temperature, circulation, rainfall, marine-heatwave and species-distribution observations evaluated over a compatible season or multi-decadal period.',
    counterevidence: 'The multidecadal index mixes forced warming and internal variability, and Atlantic Nino effects are seasonal and regional. Associations do not prove one-way causation; circulation, ENSO, fishing, oxygen and long-term warming can independently produce the named outcomes.'
  },
  inequality_conflict_insurance_and_litigation_exact_readback: {
    keys: [
      'coastal_inundation_risk->coastal_property_insurance_redlines',
      'critical_infrastructure_fragility->climate_litigation_pressure',
      'early_warning_coverage_gaps->disaster_recovery_inequality',
      'food_import_exposure->conflict_risk_escalation',
      'resource_depletion->conflict_risk_escalation',
      'vector_borne_disease_expansion->disaster_recovery_inequality'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/', section: 'Risk finance, insurance, governance, litigation, inequality, conflict pathways, warning and adaptation capacity' },
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/technical-summary/', section: 'Compound climate risk, vulnerability, inequitable outcomes, conflict and governance limits' },
      { url: 'https://wmo.int/activities/early-warnings-all', section: 'Warning coverage and protection of vulnerable and at-risk populations' }
    ],
    scope: 'Named insurance market, legal jurisdiction, disaster recovery cohort, import-dependent food system, resource-conflict setting or disease-affected population with loss, pricing or non-renewal, legal claims, warning receipt, recovery allocation, prices, violence and care access measured over a declared period.',
    counterevidence: 'Hazards do not automatically cause insurer exit, litigation, conflict or inequality. Regulation, public insurance, disclosure law, governance, trade substitution, social protection, health systems and pre-existing fragility mediate outcomes; each pathway remains conditional and indirect.'
  },
  grid_peak_curtailment_and_affordability_exact_readback: {
    keys: [
      'cooling_water_competition->grid_peak_load_stress',
      'grid_peak_load_stress->peaker_plant_lock_in',
      'peaker_plant_lock_in->energy_affordability_crisis',
      'renewable_curtailment_losses->carbon_emission',
      'renewable_curtailment_losses->energy_affordability_crisis'
    ],
    locators: [
      { url: 'https://www.iea.org/reports/electricity-2026/grids', section: 'Grid adequacy, peak demand, thermal constraints, curtailment, flexibility and reliability' },
      { url: 'https://www.iea.org/reports/building-the-future-transmission-grid/executive-summary', section: 'Transmission delay, congestion, curtailment, investment and consumer-cost implications' },
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-6/', section: 'Power-system flexibility, peaking generation, curtailment, emissions and transition lock-in' }
    ],
    scope: 'Named power system and dispatch period with cooling-water availability, hourly demand and capacity, peaker dispatch and investment, renewable availability and curtailment, replacement generation, wholesale cost and household bill burden measured separately.',
    counterevidence: 'Alternative cooling, storage, demand response, interconnection and non-fossil firm capacity can prevent peak stress or fossil lock-in. Curtailment has no emissions effect if it reflects oversupply without fossil replacement, and low marginal-cost renewables do not guarantee lower retail bills where network or capital costs dominate.'
  },
  freshwater_stratification_and_thermal_acidification_exact_readback: {
    keys: [
      'extreme_precipitation_intensity->ocean_salinity_stratification',
      'ocean_heat_content->ocean_acidification'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-5/', section: 'Coastal and upper-ocean freshwater forcing, stratification, warming, carbonate chemistry and ecosystem response' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Ocean heat and salinity, upper-ocean stratification and regional freshwater inputs' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', section: 'Ocean carbon uptake, temperature-dependent solubility and carbonate chemistry; atmospheric CO2 remains the primary acidification driver' }
    ],
    scope: 'Named coastal plume or ocean region with precipitation-derived freshwater flux, salinity profile and stratification, or temperature, dissolved inorganic carbon, alkalinity and pH measured over the same event or trend period.',
    counterevidence: 'Mixing, winds, river discharge and evaporation can dominate local stratification. Ocean warming has a bounded thermodynamic pH and solubility effect but is not the primary cause of anthropogenic ocean acidification, which is rising atmospheric carbon dioxide; carbon chemistry must be measured explicitly.'
  },
  data_center_electricity_emissions_exact_readback: {
    keys: [
      'data_centers->carbon_emission'
    ],
    locators: [
      {
        url: 'https://www.iea.org/reports/energy-and-ai/ai-and-climate-change',
        section: 'AI and climate change: data centres account for about 180 Mt indirect CO2 in 2024; the 2035 Base Case reaches about 300 Mt and the Lift-Off Case up to 500 Mt'
      },
      {
        url: 'https://energyanalysis.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
        section: '2024 United States Data Center Energy Usage Report: measured and modelled electricity-use boundary, facility stock, demand growth, and uncertainty in data-centre load estimates'
      }
    ],
    scope: 'Global data-centre electricity consumption and its serving generation mix for the IEA 2024 observation and 2035 scenarios; the LBNL source independently bounds the electricity-demand mechanism for the United States rather than supplying the global emissions estimate.',
    counterevidence: 'Time- and location-matched clean electricity, lower-carbon grids, improved hardware and cooling efficiency, higher utilization, workload shifting, and genuinely additional clean generation can reduce indirect emissions. The relationship excludes backup-generator emissions and does not support applying the global scenario total to an individual facility.'
  },
  managed_soil_nitrous_oxide_exact_readback: {
    keys: [
      'industry_farming->nitrous_oxide'
    ],
    locators: [
      {
        url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch11_Soils_N2O_CO2.pdf',
        section: 'Chapter 11 Sections 11.1-11.2.1 and Table 11.1: nitrification and denitrification mechanism, included anthropogenic nitrogen inputs, direct managed-soil equation, and Tier 1 emission factors'
      },
      {
        url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/corrigenda4.html',
        section: 'Volume 4 Chapter 11 corrigenda: corrected EF1 uncertainty range 0.002-0.018 and bootstrap method for the aggregated factor'
      },
      {
        url: 'https://www.epa.gov/system/files/documents/2024-02/us-ghg-inventory-2024-main-text.pdf',
        section: 'Agriculture chapter: agricultural-soil and manure-management N2O are quantified separately under inventory methods; used as implementation corroboration, not as an independent global emission-factor estimate'
      }
    ],
    exact_claim: 'Included anthropogenic nitrogen inputs to managed mineral soils increase direct N2O-N emissions through nitrification and denitrification; the IPCC aggregated Tier 1 EF1 is 0.01 kg N2O-N per kg N input with a corrected 0.002-0.018 uncertainty range.',
    scope: 'Annual inventory of included anthropogenic nitrogen inputs to managed mineral soils in a named jurisdiction; direct soil emissions remain separate from manure-management emissions, residue burning, indirect volatilization, leaching, and atmospheric concentration change.',
    counterevidence: 'The Tier 1 factor intentionally omits local soil, climate, crop, inhibitor, timing, and management detail. Wet and dry climates and fertilizer forms have different disaggregated factors, and justified Tier 2 or Tier 3 country-specific estimates supersede the global default.'
  },
  tropical_wet_bulb_warming_exact_readback: {
    keys: [
      'temp->wet_bulb_heat'
    ],
    locators: [
      {
        url: 'https://doi.org/10.1038/s41561-021-00695-3',
        section: 'Abstract and Figure 4: extreme wet-bulb temperature increases about one degree Celsius per degree of tropical-mean warming; at 1.5 degrees Celsius warming the reported probable 66 percent regional increase is 1.33-1.49 degrees Celsius'
      },
      {
        url: 'https://doi.org/10.1029/2023GL106617',
        section: 'Abstract and model-observation analysis: land mean wet-bulb temperature increases 17 percent faster than sea-surface temperature, corroborating a warming-driven humid-heat response while using a different mean-state estimand'
      }
    ],
    exact_claim: 'Within tropical land regions between 20 degrees South and 20 degrees North, climate models constrained by atmospheric dynamics project regional extreme wet-bulb temperature to rise with tropical-mean warming; for 1.5 degrees Celsius warming the primary study reports a probable 66 percent increase interval of 1.33-1.49 degrees Celsius.',
    scope: 'Tropical regional annual maximum of daily-mean or 3-hourly wet-bulb temperature under a 1.5 degrees Celsius tropical-mean warming contrast; the observational record is used as a consistency check rather than as the source of the future interval.',
    counterevidence: 'Regional moisture limitation, circulation, land-sea contrast, and metric definition can change the response outside the tropics. The corroborating land-mean study has a different estimand, and neither source supports treating a gridded annual projection as WBGT, an individual exposure dose, or a universal hourly threshold response.'
  },
  global_heavy_precipitation_scaling_exact_readback: {
    keys: ['temp->extreme_precipitation_intensity'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/',
        section: 'SPM B.2.4: at the global scale, extreme daily precipitation events are projected to intensify by about 7 percent for each 1 degree Celsius of global warming, with high confidence'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
        section: 'Chapter 11 assessment of observed and projected heavy-precipitation intensity and frequency, including regional and event-definition dependence'
      }
    ],
    exact_claim: 'At the global scale, additional global warming increases the intensity of extreme daily precipitation by about 7 percent per degree Celsius; the assessment is a global approximation rather than a universal local coefficient.',
    scope: 'Global-scale extreme daily precipitation response across assessed warming levels relative to 1850-1900; regional circulation, storm type, event rarity and precipitation metric remain explicit modifiers.',
    counterevidence: 'Local changes can be weaker, stronger or opposite because of circulation, moisture transport, aerosol forcing, orography and convective representation. The estimate applies to intensity, not event frequency, mean precipitation, flood damage or any single storm.'
  },
  historical_methane_temperature_contribution_exact_readback: {
    keys: ['methane->temp'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/figures/summary-for-policymakers/figure-spm-2/',
        section: 'Figure SPM.2 panel c: assessed temperature changes from individual emissions components, accounting for direct emissions and their effects on other climate drivers; whiskers are very likely ranges'
      },
      {
        url: 'https://catalogue.ceda.ac.uk/uuid/c1eb6dad1598427f8f9f3eae346ece2f/',
        section: 'Panel-c CSV Methane row: 0.513236937 degrees Celsius total GSAT effect with 0.294718019 and 0.840575458 degrees Celsius 5th and 95th very-likely limits'
      }
    ],
    exact_claim: 'IPCC assesses that historical methane emissions contributed about 0.51 degrees Celsius to 2010-2019 global surface-air-temperature warming relative to 1850-1900, with a very likely range of about 0.29-0.84 degrees Celsius.',
    scope: 'Global historical methane-emissions contribution to 2010-2019 GSAT relative to 1850-1900, including assessed indirect effects on other climate drivers.',
    counterevidence: 'The estimate is not a per-tonne coefficient or local response. Methane lifetime, chemistry, ozone, stratospheric water vapour, forcing interactions and climate sensitivity contribute to the range, and the emissions-based attribution must not be substituted with atmospheric concentration or GWP.'
  },
  historical_nitrous_oxide_temperature_contribution_exact_readback: {
    keys: ['nitrous_oxide->temp'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/figures/summary-for-policymakers/figure-spm-2/',
        section: 'Figure SPM.2 panel c: assessed temperature changes from individual emissions components, accounting for direct emissions and their effects on other climate drivers; whiskers are very likely ranges'
      },
      {
        url: 'https://catalogue.ceda.ac.uk/uuid/c1eb6dad1598427f8f9f3eae346ece2f/',
        section: 'Panel-c CSV Nitrous oxide row: 0.091730576 degrees Celsius total GSAT effect with 0.045556739 and 0.155208999 degrees Celsius 5th and 95th very-likely limits'
      }
    ],
    exact_claim: 'IPCC assesses that historical nitrous-oxide emissions contributed about 0.09 degrees Celsius to 2010-2019 global surface-air-temperature warming relative to 1850-1900, with a very likely range of about 0.05-0.16 degrees Celsius.',
    scope: 'Global historical nitrous-oxide-emissions contribution to 2010-2019 GSAT relative to 1850-1900, including assessed indirect effects on other climate drivers.',
    counterevidence: 'The estimate is not a per-tonne coefficient or local response. Atmospheric lifetime, chemistry, ozone interactions, radiative efficiency and climate sensitivity contribute to the range, and the emissions-based attribution must not be substituted with fertilizer-specific emissions or GWP.'
  },
  cumulative_co2_temperature_response_exact_readback: {
    keys: ['carbon_emission->temp'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/',
        section: 'SPM D.1.1: each 1000 GtCO2 of cumulative anthropogenic CO2 emissions is assessed to likely cause 0.27-0.63 degrees Celsius global surface warming, best estimate 0.45 degrees Celsius'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/',
        section: 'Section 5.5.1 Transient Climate Response to Cumulative Emissions of Carbon Dioxide'
      }
    ],
    exact_claim: 'Cumulative anthropogenic carbon-dioxide emissions have a near-linear relationship with the global surface warming they cause; the IPCC best estimate is 0.45 degrees Celsius per 1000 GtCO2 with a likely range of 0.27-0.63 degrees Celsius.',
    scope: 'Global cumulative anthropogenic CO2 and global surface temperature over this century for assessed warming levels up to at least 2 degrees Celsius; annual territorial emissions and non-CO2 forcing are not interchangeable with this exposure.',
    counterevidence: 'Carbon-cycle uptake, ocean heat uptake, non-CO2 forcing, Earth-system feedbacks, net-negative emissions and pathway dependence alter realized warming. The coefficient is not a forecast for one emitter, one year or one location.'
  },
  emissions_marine_heatwave_projection_exact_readback: {
    keys: ['carbon_emission->marine_heatwaves'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
        section: 'Executive Summary, Ocean Heat and Salinity: marine heatwaves projected eight times more frequent, likely range 3-15, by 2081-2100 under SSP5-8.5 relative to 1995-2014'
      },
      {
        url: 'https://www.ipcc.ch/srocc/chapter/chapter-6/',
        section: 'Section 6.4.1 and Figure 6.4: assessed increases in marine-heatwave frequency, duration, spatial extent and intensity under continued ocean warming, with strong scenario dependence'
      }
    ],
    exact_claim: 'Under SSP5-8.5, global marine-heatwave frequency is projected to be eight times the 1995-2014 baseline by 2081-2100, with an assessed likely range of three to fifteen times.',
    scope: 'Scenario-conditioned global marine-heatwave frequency during 2081-2100 relative to 1995-2014; event threshold and basin remain source-defined.',
    counterevidence: 'The response depends on emissions pathway, event definition, ocean basin, circulation and internal variability. It is not a per-tonne coefficient, local forecast or intensity estimate.'
  },
  greenland_mass_loss_sea_level_equivalence_exact_readback: {
    keys: ['ice_sheet_mass_loss->sea_level_rise'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
        section: 'Section 9.4.1 and Figure 9.17: Greenland lost 4890 Gt, very-likely range 4140-5640 Gt, during 1992-2020, equivalent to 13.5 mm global mean sea level, range 11.4-15.6 mm'
      },
      {
        url: 'https://doi.org/10.5194/essd-15-1597-2023',
        section: 'Results and Figure 4: satellite-observation synthesis of Greenland Ice Sheet cumulative mass change and rate; corroborates the observed mass-loss magnitude while the IPCC assessment supplies the sea-level-equivalent conversion'
      }
    ],
    exact_claim: 'Observed Greenland Ice Sheet mass loss during 1992-2020 is equivalent to a 13.5 mm contribution to global mean sea level, with an assessed 11.4-15.6 mm range.',
    scope: 'Greenland Ice Sheet cumulative mass loss and global mean sea-level equivalent during 1992-2020; local relative sea level is outside this estimand.',
    counterevidence: 'Regional gravitational fingerprints, glacial isostatic adjustment, firn corrections, ocean dynamics and vertical land motion change local sea-level expression. The estimate is not Antarctic mass loss or a future projection.'
  },
  sea_level_extreme_frequency_amplification_exact_readback: {
    keys: ['sea_level_rise->coastal_inundation_risk'],
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
        section: 'Executive Summary and Section 9.6.4: regional sea-level rise makes recent-past extreme still-water levels occur about 20-30 times more frequently by 2050 across assessed tide-gauge locations'
      },
      {
        url: 'https://www.ipcc.ch/srocc/chapter/chapter-4-sea-level-rise-and-implications-for-low-lying-islands-coasts-and-communities/',
        section: 'Sections 4.2.3.4 and 4.3.3: relative sea-level rise increases the frequency of historically rare extreme sea-level events and associated coastal flooding, with strong regional variation'
      }
    ],
    exact_claim: 'Regional relative sea-level rise is assessed to amplify the occurrence frequency of recent-past extreme still-water levels by roughly 20-30 times by 2050 across quasi-global tide-gauge locations.',
    scope: 'Extreme still-water-level frequency at assessed tide-gauge locations by 2050 relative to the IPCC recent-past baseline, with scenario and regional sea-level projection retained.',
    counterevidence: 'Vertical land motion, tides, storm surge, waves, coastal defenses, drainage and exposure alter realized inundation. The estimate assumes other extreme-level contributors remain stationary and does not measure flooded area, depth, damage or any one coastline.'
  },
  warming_sea_ice_probability_exact_readback: {
    keys: ['temp->sea_ice_season_loss'],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/', section: 'B.1.7: sea-ice-free September probability at stabilized 1.5 and 2 degrees Celsius warming' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Section 9.3.1: observed and projected Arctic sea-ice extent, sensitivity to global warming, and practically ice-free September timing' }
    ],
    exact_claim: 'At stabilized global warming of 2 degrees Celsius, the assessed annual probability of a practically sea-ice-free Arctic September by the end of the century is 10-35 percent, compared with approximately 1 percent at 1.5 degrees Celsius.',
    scope: 'Arctic Ocean September mean sea-ice conditions at stabilized end-of-century warming levels; the source-defined practically ice-free threshold and probability framing are retained.',
    counterevidence: 'Large internal variability, threshold definition, aerosol forcing, ocean heat transport and model sea-ice sensitivity affect event timing. This is not a particular-year forecast, Antarctic sea-ice result, or linear per-degree response.'
  },
  warming_permafrost_area_exact_readback: {
    keys: ['temp->permafrost_thaw'],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/', section: 'B.1.4: 24 plus or minus 16 percent near-surface permafrost-area decline under RCP2.6 and 69 plus or minus 20 percent under RCP8.5 by 2100' },
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', section: 'Sections 3.4.2 and 3.4.3: near-surface permafrost projections, abrupt thaw, carbon release, vegetation uptake and infrastructure boundaries' }
    ],
    exact_claim: 'The assessed decrease in northern near-surface permafrost area by 2100 is 69 plus or minus 20 percent under RCP8.5, compared with 24 plus or minus 16 percent under RCP2.6.',
    scope: 'Northern circumpolar near-surface permafrost within the upper 3-4 metres through 2100 under named forcing pathways; active-layer depth, abrupt thaw and deep permafrost remain separate outcomes.',
    counterevidence: 'Ground ice, snow, soil moisture, vegetation, fire and local topography control local thaw, while abrupt thaw is incompletely represented. Area decline is not interchangeable with local subsidence or carbon release.'
  },
  warming_global_ocean_oxygen_exact_readback: {
    keys: ['temp->oceanic_deoxygenation'],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/', section: 'B.2.2: global ocean oxygen-content decline of 3-4 percent under RCP8.5 by 2081-2100 relative to 2006-2015' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Sections 9.2.3 and 9.2.4: observed and projected ocean oxygen change through solubility, stratification, circulation and biogeochemical processes' }
    ],
    exact_claim: 'Under RCP8.5, global ocean oxygen content is projected to decline by a very-likely range of 3-4 percent in 2081-2100 relative to 2006-2015.',
    scope: 'Global ocean oxygen inventory under a named high-forcing scenario and fixed comparison periods; regional, coastal and depth-resolved hypoxia are not inferred.',
    counterevidence: 'Ventilation, overturning, biological export, remineralization, upwelling and coastal nutrient loading produce large regional and depth differences; a global inventory change is not a local ecological exposure estimate.'
  },
  tropical_cyclone_rapid_intensification_remaining_readback: {
    keys: [
      'ocean_heat_content->tropical_cyclone_rapid_intensification',
      'humidity_amplification->tropical_cyclone_rapid_intensification',
      'carbon_emission->tropical_cyclone_rapid_intensification',
      'tropical_cyclone_rapid_intensification->coral_reef_fragmentation',
      'environ_anomalies->tropical_cyclone_rapid_intensification'
    ],
    locators: [
      { url: 'https://repository.library.noaa.gov/view/noaa/69273/noaa_69273_DS1.pdf', section: 'State of the Climate tropical-cyclone heat-potential assessment: upper-ocean heat above 50 kJ cm-2 is statistically linked to intensification, including 30-knot-in-24-hour rapid intensification when atmospheric conditions are favorable' },
      { url: 'https://www.aoml.noaa.gov/impact-of-wind-shear-on-tropical-cyclone-intensity/', section: 'NOAA AOML assessment of moisture, wind shear, storm structure and ocean conditions as interacting intensity controls' },
      { url: 'https://www.ipcc.ch/srocc/chapter/technical-summary/', section: 'Projected increase in average tropical-cyclone intensity, Category 4-5 proportion and precipitation at 2 degrees Celsius warming, with confidence and attribution boundaries' },
      { url: 'https://www.fisheries.noaa.gov/national/habitat-conservation/shallow-coral-reef-habitat', section: 'NOAA coral-habitat assessment of physical storm damage, fragmentation and compounding thermal and water-quality pressures' }
    ],
    scope: 'Named tropical-cyclone basins and storms with source-consistent one-minute sustained wind, exact 24-hour comparison windows, upper-ocean heat, moisture, vertical wind shear and storm structure retained; climate-scale forcing is treated as an indirect background pathway.',
    counterevidence: 'High ocean heat or humidity does not guarantee rapid intensification. Wind shear, dry-air entrainment, storm structure, translation speed, ocean cooling, internal dynamics and forecast uncertainty can prevent or reverse intensification. Reef damage depends on track, wave field, depth, geomorphology and prior condition.'
  },
  remaining_sea_level_process_readback: {
    keys: [
      'antarctic_shelf_instability->sea_level_rise',
      'glacier_calving_events->sea_level_rise',
      'sea_level_rise->coastal_saltwater_intrusion'
    ],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Sections 9.4 and 9.6: grounded-ice mass loss, Antarctic shelf buttressing and instability, glacier contribution, sea-level projections and deep uncertainty' },
      { url: 'https://nsidc.org/learn/parts-cryosphere/ice-shelves/science-ice-shelves', section: 'Floating ice-shelf calving versus buttressing loss and acceleration of grounded ice discharge' },
      { url: 'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion', section: 'Sea-level rise, pumping, recharge and coastal boundary controls on saltwater intrusion' },
      { url: 'https://www.usgs.gov/publications/beyond-wedge-impact-tidal-streams-salinization-groundwater-a-coastal-aquifer-stressed', section: 'Observed tidal-stream and aquifer-geometry controls that complicate a simple inland salt-wedge response' }
    ],
    scope: 'Grounded Antarctic and glacier ice mass transferred to the ocean, floating-shelf buttressing pathways, and named coastal aquifers with monitored head, recharge, pumping and salinity; global mean and local relative sea-level responses remain distinct.',
    counterevidence: 'Calving of already-floating ice does not directly raise sea level, although shelf loss can accelerate grounded discharge. Antarctic instability has deep uncertainty. Coastal saltwater intrusion can be dominated by pumping, recharge, geology, tidal streams and management rather than sea-level rise alone.'
  },
  coastal_hypoxia_fisheries_exact_readback: {
    keys: ['coastal_hypoxia->marine_fisheries_collapse'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/', section: 'Sections 3.4.2 and 3.5: coastal deoxygenation and hypoxia alter habitat, mortality, food webs, fisheries production and ecosystem services, with regional exposure and confidence boundaries' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/', section: 'Sections 5.4 and 5.5: oxygen decline mechanisms, coastal eutrophication interaction and limits on attributing local hypoxia to climate forcing alone' }
    ],
    exact_claim: 'Persistent or recurrent coastal hypoxia can compress usable habitat, increase mortality and disrupt recruitment, raising the risk of regional fish-stock and fishery decline when exposure overlaps sensitive species and life stages.',
    scope: 'Named coastal shelf, estuary or oxygen-minimum zone with a declared dissolved-oxygen threshold, depth, hypoxic area and duration, stock definition, recruitment and catch or biomass observations over matched seasons and years.',
    counterevidence: 'Nutrient loading, stratification, circulation, upwelling, temperature, fishing pressure and management can dominate local outcomes. Mobile species can avoid low oxygen, and a hypoxic event does not establish collapse of an assessed stock or national fishery.'
  },
  emissions_fisheries_catch_potential_exact_readback: {
    keys: ['carbon_emission->marine_fisheries_collapse'],
    locators: [
      { url: 'https://www.ipcc.ch/srocc/chapter/summary-for-policymakers/', section: 'B.5, B.5.1 and Figure SPM.3: maximum fisheries catch potential projected to decrease 20.5-24.1 percent by 2081-2100 relative to 1986-2005 under RCP8.5, with medium confidence' },
      { url: 'https://www.fao.org/climate-change/en/', section: 'FAO assessment of climate effects on fisheries and aquatic food systems, with adaptation, management and food-security context' }
    ],
    exact_claim: 'Under the high-emissions RCP8.5 pathway, IPCC projects global maximum fisheries catch potential to decline 20.5-24.1 percent by 2081-2100 relative to 1986-2005 as ocean physical and biogeochemical conditions change.',
    scope: 'Global shelf-sea maximum catch potential under RCP8.5, using CMIP5 physical and biogeochemical forcing and two fisheries and marine ecosystem models; the result is scenario-conditioned and does not assign a per-tonne emissions coefficient.',
    counterevidence: 'Regional outcomes vary and can increase in some high-latitude settings. Fishing pressure, stock rebuilding, governance, fleet adaptation, species movement, oxygen, acidification and primary production alter realized catch. Polar projections have low confidence, and catch potential is not the same as realized catch, stock status or collapse probability.'
  },
  fisheries_scarcity_conflict_exact_readback: {
    keys: ['marine_fisheries_collapse->fishery_border_dispute_zones'],
    locators: [
      { url: 'https://researchonline.jcu.edu.au/69248/', section: 'Primary global fisheries-conflict event analysis testing supply-induced scarcity against political, economic and governance predictors' },
      { url: 'https://www.sciencedirect.com/science/article/pii/S0308597X23002737', section: 'Review of fisheries-conflict drivers, including overexploitation, illegal fishing, territorial claims, food insecurity, fleet pressure and governance' }
    ],
    exact_claim: 'Declining accessible fish supply can intensify competition where fleets or states share stocks and access claims, but global evidence does not support scarcity as a sufficient or universal cause of fisheries conflict.',
    scope: 'Named shared stock, fishing ground or jurisdiction with stock status, catch, effort, access claims, actor pairs, incident taxonomy and governance institutions observed across several seasons to decades.',
    counterevidence: 'Territorial sovereignty, illegal fishing, subsidized overcapacity, nationalism, enforcement practices and reporting bias can explain incidents independently. Cooperative agreements, rebuilding plans, compensation, alternative livelihoods and legitimate enforcement can prevent scarcity from producing conflict.'
  },
  fisheries_trophic_cascade_exact_readback: {
    keys: ['marine_fisheries_collapse->trophic_cascade_collapses'],
    locators: [
      { url: 'https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs', section: 'NOAA definition of aquatic food-web interactions and trophic cascades following changes in predators, prey and lower trophic levels' },
      { url: 'https://www.usgs.gov/publications/species-invasion-progressively-disrupts-trophic-structure-native-food-webs', section: 'Measured consumer-community change and progressive disruption of native food-web trophic structure; mechanism corroboration rather than a fisheries-specific effect estimate' },
      { url: 'https://www.usgs.gov/publications/top-predator-recovery-abates-geomorphic-decline-a-coastal-ecosystem', section: 'Observed top-predator recovery and downstream coastal-ecosystem response; corroborates multi-level response and context dependence' }
    ],
    exact_claim: 'Selective depletion of harvested predators or consumers can propagate through prey and lower trophic levels, but a trophic cascade requires measured intermediate and downstream responses rather than one declining taxon alone.',
    scope: 'Named marine food web with fishing pressure, focal harvested taxa, prey, lower trophic levels and downstream abundance, biomass, diet or habitat response observed over compatible seasons and years.',
    counterevidence: 'Food-web redundancy, omnivory, diet switching, compensatory consumers, habitat change, pollution and temperature can weaken, redirect or mimic a cascade. Fishery decline and trophic-cascade collapse are not interchangeable labels.'
  },
  deepwater_spill_fisheries_exact_readback: {
    keys: ['deepwater_petroleum_spill_risk->marine_fisheries_collapse'],
    locators: [
      { url: 'https://oceanservice.noaa.gov/education/tutorial-coastal/oil-spills/os04.html', section: 'NOAA assessment of oil-spill effects on fish, shellfish, habitats, fisheries closures and recovery pathways' },
      { url: 'https://www.gulfspillrestoration.noaa.gov/affected-gulf-resources', section: 'Deepwater Horizon injury assessment and restoration context for affected Gulf fish, shellfish, habitats and ecosystem services' }
    ],
    exact_claim: 'A realized large petroleum release can injure fish and shellfish, damage supporting habitat and close fisheries; population and fishery outcomes depend on exposure, life stage, duration, response and recovery.',
    scope: 'Named realized spill and affected water body with released material, exposure footprint, species and life stage, fishery closures, stock or population observations and recovery period; a pre-incident risk signal remains distinct from an actual release.',
    counterevidence: 'Risk is not occurrence, and occurrence is not automatically stock collapse. Weathering, dilution, response, unaffected refugia, recruitment, fishing pressure, baseline variability and restoration alter outcomes; closures can reduce catch without demonstrating biological stock collapse.'
  },
  deforestation_zoonotic_outbreak_exact_readback: {
    keys: ['deforestation->zoonotic_disease_outbreaks'],
    locators: [
      { url: 'https://www.who.int/teams/environment-climate-change-and-health/climate-change-and-health/biodiversity', section: 'WHO biodiversity and health assessment linking ecosystem disruption, deforestation, land-use change, habitat loss and altered wildlife-livestock-human contact to infectious-disease risk' },
      { url: 'https://www.who.int/europe/news/item/01-07-2022-new-report-highlights-the-impact-of-changes-in-environment-on-one-health', section: 'WHO One Health assessment of fragmentation, habitat degradation, contact opportunity and interacting emergence drivers' }
    ],
    exact_claim: 'Forest conversion and fragmentation can alter host communities and increase contact opportunities among wildlife, livestock and people, creating conditions for spillover and subsequent transmission, but land conversion is not sufficient evidence of an outbreak.',
    scope: 'Named land-conversion frontier, host community, exposed human or livestock population and pathogen investigation from years of land-use change through a documented spillover and outbreak period.',
    counterevidence: 'Most deforestation does not produce an outbreak. Wildlife trade, foodborne exposure, travel importation and surveillance artefacts can explain events, and causal attribution requires pathogen, host, exposure and transmission evidence rather than spatial coincidence.'
  },
  industrial_farming_zoonotic_outbreak_exact_readback: {
    keys: ['industry_farming->zoonotic_disease_outbreaks'],
    locators: [
      { url: 'https://www.unep.org/resources/report/preventing-future-zoonotic-disease-outbreaks-protecting-environment-animals-and', section: 'UNEP-ILRI assessment of animal-protein demand, unsustainable intensive production, husbandry, biosecurity and zoonotic emergence drivers' },
      { url: 'https://www.fao.org/animal-health/areas-of-work/veterinary-public-health/en', section: 'FAO veterinary public-health assessment of livestock production, foodborne zoonoses, processing contamination and coordinated animal-human health control' }
    ],
    exact_claim: 'High animal density, repeated worker and animal contact, production-chain movement and inadequate biosecurity can increase pathogen maintenance or exposure, but the direction and magnitude depend on pathogen, species, production design and controls.',
    scope: 'Named farm system, animal species, pathogen, workforce or consumer exposure route and surveillance boundary from the production cycle through outbreak detection and control.',
    counterevidence: 'Effective biosecurity, vaccination, housing, surveillance, worker protection and processing hygiene can reduce risk. Wild reservoirs, imported infection, feed contamination or community transmission can explain an outbreak independently.'
  },
  urbanization_zoonotic_outbreak_exact_readback: {
    keys: ['urbanization->zoonotic_disease_outbreaks'],
    locators: [
      { url: 'https://www.who.int/news-room/fact-sheets/detail/one-health', section: 'WHO One Health framing of urbanization, agriculture, animal trade, habitat fragmentation and encroachment as interacting animal-human-environment stressors' },
      { url: 'https://www.unep.org/topics/food-systems/sustainable-diets-health/zoonotic-disease-risk-reduction', section: 'UNEP assessment of infrastructure, industrial development, agricultural expansion, animal practices, poverty, inequality and health systems as interacting emergence factors' }
    ],
    exact_claim: 'Urban and peri-urban expansion can alter animal-human contact, waste and food systems, animal movement and onward transmission networks after introduction, but urban growth alone does not identify a reservoir or outbreak source.',
    scope: 'Named urban or peri-urban expansion area, animal interface, pathogen, exposure setting and affected population across years of settlement change and a bounded outbreak period.',
    counterevidence: 'Improved sanitation, housing, veterinary control and health access can lower risk. Rural exposure, travel importation, vector expansion and healthcare transmission can produce the observed event without an urbanization pathway.'
  },
  zoonotic_outbreak_response_capacity_exact_readback: {
    keys: ['zoonotic_disease_outbreaks->humanitarian_resource_gaps'],
    locators: [
      { url: 'https://www.who.int/news-room/fact-sheets/detail/zoonoses', section: 'WHO description of recurrent zoonotic outbreaks and pathogen-specific surveillance, prevention, clinical and animal-health response requirements' },
      { url: 'https://www.unep.org/resources/report/preventing-future-zoonotic-disease-outbreaks-protecting-environment-animals-and', section: 'UNEP-ILRI recommendations for monitoring, governance, animal health and response capacity across sectors' }
    ],
    exact_claim: 'A growing zoonotic outbreak can create simultaneous demand for diagnostics, surveillance, clinical care, veterinary response, risk communication and containment, producing a resource gap only when that demand exceeds documented available capacity.',
    scope: 'Named outbreak response and health, veterinary or humanitarian service area from onset through emergency response and recovery, with demand, staffing, funding, diagnostics, supplies and assistance measured separately.',
    counterevidence: 'Well-resourced systems can absorb contained events. Pre-existing underfunding, conflict access constraints, supply-chain disruption and concurrent emergencies can create the observed resource gap independently of the outbreak.'
  },
  farming_and_heat_pollinator_loss_exact_readback: {
    keys: ['industry_farming->pollinator_colony_collapse', 'temp->pollinator_colony_collapse'],
    locators: [
      { url: 'https://www.epa.gov/pollinator-protection/pollinator-health-concerns', section: 'EPA assessment of interacting bee-health stressors including pesticide exposure, poor nutrition, forage loss, pests, pathogens and management' },
      { url: 'https://www.usgs.gov/publications/recent-and-future-declines-a-historically-widespread-pollinator-linked-climate-land', section: 'USGS study of western bumble-bee occupancy relationships with temperature, drought, land cover and neonicotinoid use' }
    ],
    exact_claim: 'Agricultural pesticide and habitat pressures or climate stress can contribute to pollinator population or colony loss, but each pathway must be tied to a named pollinator, exposure window and demographic outcome within a multistressor system.',
    scope: 'Named pollinator population or managed colony, monitored landscape, active ingredient or habitat condition, species-relevant temperature or drought window and seasonal-to-multi-year occupancy, abundance, survival or colony-loss record.',
    counterevidence: 'Exposure does not prove population decline, and a weather anomaly does not prove demographic stress. Pathogens, parasites, nutrition, management, migration, detection and refugia can dominate or offset observed changes.'
  },
  habitat_loss_pollinator_decline_exact_readback: {
    keys: ['deforestation->pollinator_colony_collapse'],
    locators: [
      { url: 'https://www.ipbes.net/assessment-reports/pollinators', section: 'IPBES pollinators assessment of land-use change, habitat loss and fragmentation, forage and nesting resources and interacting decline drivers' },
      { url: 'https://www.epa.gov/pollinator-protection/pollinator-health-concerns', section: 'EPA pollinator-health assessment identifying poor nutrition and forage-habitat loss among interacting bee-health stressors' }
    ],
    exact_claim: 'Loss of forest and semi-natural habitat can reduce forage continuity, nesting sites, refugia and connectivity, contributing to decline in susceptible pollinator populations or managed colonies.',
    scope: 'Named pollinator population or colony within a mapped forest and semi-natural-habitat landscape, followed from seasonal resource availability through multi-year occupancy, abundance, survival or colony-loss monitoring.',
    counterevidence: 'Tree-cover loss alone does not establish pollinator decline. Some open-habitat species can benefit from disturbance, while restored forage, alternative nesting resources, connectivity and management can partly offset habitat loss; pesticides, pathogens, drought and detectability remain competing explanations.'
  },
  edgar_sector_fossil_co2_aggregation_exact_readback: {
    keys: [
      'aviation_jet_fuel_co2->carbon_emission',
      'refinery_combustion_co2->carbon_emission',
      'chemical_process_co2->carbon_emission',
      'waste_incineration_co2->carbon_emission',
      'shipping_bunker_fuel_co2->carbon_emission',
      'rail_diesel_co2->carbon_emission',
      'iron_steel_process_co2->carbon_emission',
      'oil_gas_flaring_co2->carbon_emission'
    ],
    locators: [
      {
        url: 'https://edgar.jrc.ec.europa.eu/dataset_ghg2025',
        section: 'Annual totals by sector and country, IEA-EDGAR CO2 workbook, IPCC 2006 categories 1.A.3.a, 1.A.1.bc, 2.B, 4.C, 1.A.3.d, 1.A.3.c, 2.C and 1.B.2'
      },
      {
        url: 'https://unfccc.int/process-and-meetings/transparency-and-reporting/reporting-and-review/transparency-data-and-tools/greenhouse-gas-data/data-interface-help',
        section: 'Detailed data by Party and sector or sub-sector inventory categories, units and reporting boundaries'
      }
    ],
    exact_claim: 'Source-reported fossil carbon-dioxide emissions from a named EDGAR IPCC sector-country category are components of the corresponding territorial fossil and industrial CO2 inventory total for the same geography and year.',
    scope: 'EDGAR_2025_GHG IEA-EDGAR CO2 country or territory rows for 2024, with category code, category name, fossil-versus-bio flag and Gg CO2 per year retained. Stable legacy node IDs remain for compatibility, while display labels follow the source category names.',
    counterevidence: 'The relationship is an inventory aggregation identity, not an estimated causal coefficient. Category allocation, international bunker treatment, activity data, emission factors and revisions affect totals. The workbook excludes bio CO2, large-scale biomass burning, forest fires and LULUCF, and supplies no observation-level numeric uncertainty.'
  },
  northern_hemisphere_snowmelt_flood_timing_exact_readback: {
    keys: ['temp->snowmelt_timing_shift'],
    locators: [
      {
        url: 'https://doi.org/10.1038/s41467-025-58832-0',
        section: 'Results, Figure 2 and Discussion: 2,339 snow-affected catchments over 1950-2020; mean timing sensitivity -4.7 days per degree Celsius with 5.0-day cross-catchment standard deviation; approximately 30 percent of catchments shifted later'
      },
      {
        url: 'https://www.nature.com/articles/s41467-025-58832-0#Sec2',
        section: 'Methods: daily streamflow and ERA5-Land forcing, minimally impaired catchment filters, peaks-over-threshold event detection, process-based separation of snowmelt, rainfall and rain-on-snow floods, and sensitivity checks'
      }
    ],
    exact_claim: 'Across 2,339 snow-affected, minimally impaired Northern Hemisphere catchments, a 1 degree Celsius increase in catchment annual mean air temperature was associated on average with a 4.7-day advance in the annual maximum snowmelt-flood peak date, with a 5.0-day cross-catchment standard deviation.',
    scope: 'Northern Hemisphere catchments with at least 30 continuous years of daily streamflow during 1950-2020, snowfall fraction and snow-cover thresholds above 10 percent, irrigation and urban area below 5 percent, and reservoir capacity below 5 percent of mean annual discharge.',
    counterevidence: 'The response is not spatially uniform: nearly 30 percent of catchments shifted later, the mean plus or minus one-standard-deviation range crosses zero, warmer and colder catchments have different sensitivities, and slower snowmelt can delay the flood peak despite an earlier onset of seasonal warming. The estimate concerns process-classified annual maximum snowmelt floods, not all runoff or all snow disappearance.'
  },
  european_warming_level_soil_moisture_drought_exact_readback: {
    keys: ['temp->soil_moisture_collapse'],
    locators: [
      {
        url: 'https://doi.org/10.1038/s41558-018-0138-5',
        section: 'Abstract and Figures 1-3: multi-model impacts of 1-3 degrees Celsius global mean warming; 40 percent plus or minus 24 percent increase in drought area at 3 degrees Celsius relative to 1.5 degrees Celsius'
      },
      {
        url: 'https://eprints.soton.ac.uk/420571/',
        section: 'Accepted-manuscript repository record and abstract: ensemble of hydrological and land-surface models forced by bias-corrected downscaled GCM output; European soil-moisture drought area and population exposure'
      }
    ],
    exact_claim: 'In the assessed European model ensemble, a 3 degrees Celsius global mean warming level increased soil-moisture drought area by 40 percent plus or minus 24 percent relative to the 1.5 degrees Celsius warming level.',
    scope: 'Europe and its assessed Atlantic, Continental, Boreal, Mediterranean, Alpine North and Alpine South regions under warming-level climate samples, using 1971-2000 as the reference period and source-defined soil-moisture drought thresholds.',
    counterevidence: 'Regional precipitation can offset warming-driven drying, northern winter drought may become less frequent, hydrological and land-surface models differ, and the result depends on bias correction, drought definition, soil depth, evapotranspiration, vegetation and scenario sampling. Water withdrawals, groundwater pumping and local management are not represented by the warming-level coefficient.'
  },
  personal_conveyance_fossil_co2_exact_readback: {
    keys: ['personal_conveyance->carbon_emission'],
    locators: [
      {
        url: 'https://www.iea.org/reports/breakthrough-agenda-report-2025/road-transport',
        section: 'Road transport, State of the transition, Emissions: road-sector emissions were just over 6 Gt CO2 in 2024 and more than 60 percent came from passenger cars or vans'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/',
        section: 'Figure 10.1 and Sections 10.1 and 10.4: road passenger transport emissions, gasoline and diesel light-duty vehicles, and direct, electricity and lifecycle accounting boundaries'
      }
    ],
    exact_claim: 'Fossil-fuel combustion in private passenger cars and vans directly emits carbon dioxide. IEA reports that passenger cars and vans produced more than 60 percent of the road sector total of just over 6 Gt CO2 in 2024.',
    scope: 'Global direct road-transport carbon-dioxide inventory for 2024. Country, city, household or vehicle estimates require matched local vehicle activity, occupancy, fuel economy, fuel carbon and fleet data; electricity and lifecycle emissions are reported separately.',
    counterevidence: 'Personal conveyance does not include all road transport, and the IEA share groups cars with vans. Electric vehicles have no tailpipe CO2, while their electricity and manufacturing emissions depend on system conditions. The greater-than-60-percent inventory share is not a causal coefficient and has no source-reported confidence interval.'
  },
  ai_data_centers_indirect_grid_co2_exact_readback: {
    keys: ['ai_data_centers->carbon_emission'],
    locators: [
      {
        url: 'https://www.iea.org/reports/energy-and-ai/ai-and-climate-change',
        section: 'AI and climate change: 180 Mt indirect CO2 from electricity used by all data centres in 2024, with AI explicitly retained as a subset and backup generation excluded'
      },
      {
        url: 'https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai',
        section: 'Energy demand from AI: 415 TWh total data-centre electricity in 2024; accelerated servers mainly driven by AI account for almost half of projected net electricity growth to 2030'
      },
      {
        url: 'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
        section: 'Executive summary and scenario methods: accelerated-server growth, GPU shipments, utilisation and cooling assumptions underlying the 325-580 TWh United States data-centre electricity range in 2028'
      }
    ],
    exact_claim: 'Growth in AI-driven accelerated-server deployment can increase data-centre electricity demand and thereby increase indirect carbon-dioxide emissions where the physically supplied electricity mix contains fossil generation.',
    scope: 'Global data-centre system for the 2024 IEA observed totals and scenarios through 2035, with United States demand scenarios through 2028 from LBNL. AI load, non-AI load, electricity and indirect CO2 must remain separate fields.',
    counterevidence: 'The 415 TWh and 180 Mt CO2 observations cover all data-centre workloads, not AI alone. Efficiency, utilisation, load flexibility, low-emissions supply and deployment bottlenecks materially change the pathway. No source supplies a universal AI-task-to-CO2 coefficient or a confidence interval for the scenario range.'
  },
  agricultural_demand_permanent_forest_conversion_exact_readback: {
    keys: ['food->deforestation'],
    locators: [
      {
        url: 'https://www.fao.org/newsroom/detail/cop26-agricultural-expansion-drives-almost-90-percent-of-global-deforestation/',
        section: 'FAO Global Remote Sensing Survey: agricultural expansion accounts for almost 90 percent of global deforestation; cropland conversion contributes more than half and livestock grazing almost 40 percent'
      },
      {
        url: 'https://gfr.wri.org/forest-extent-indicators/deforestation-agriculture',
        section: 'Commodity-linked forest replacement for 2001-2015, commodity and geographic breakdowns, data and methods, and explicit direct-attribution and indirect-displacement limitations'
      }
    ],
    exact_claim: 'Agricultural commodity demand can increase deforestation when production expands cropland or pasture into forest. FAO attributes almost 90 percent of assessed global deforestation to agricultural expansion, while WRI identifies commodity- and geography-specific forest replacement.',
    scope: 'FAO global forest-conversion assessment for 2000-2018 and WRI commodity-linked replacement analysis for 2001-2015. Consumer, company and local attribution requires traceable commodity origin and matched production-expansion and forest-conversion observations.',
    counterevidence: 'Demand can be met without deforestation through yield gains, existing cleared land, dietary shifts, lower waste and forest protection. The near-90-percent FAO attribution is not an elasticity or confidence interval. Gross tree-cover loss is not equivalent to permanent deforestation, and spatial commodity replacement does not prove every current producer caused the earlier clearing.'
  },
  ai_advanced_semiconductor_demand_exact_readback: {
    keys: ['ai_data_centers->semiconductor_fabs'],
    locators: [
      { url: 'https://www.commerce.gov/news/speeches/2024/02/remarks-us-secretary-commerce-gina-raimondo-investing-leading-edge-technology', section: 'AI demand for leading-edge logic and memory and the fabrication-to-packaging capacity chain' },
      { url: 'https://investor.tsmc.com/static/annualReports/2025/english/index.html', section: '2025 annual report: robust AI-related demand, planned advanced fab phases and observed annual wafer capacity' }
    ],
    exact_claim: 'AI training and inference demand can increase demand for advanced accelerators, memory, wafer fabrication and advanced packaging capacity.',
    scope: 'Global advanced-semiconductor supply chain with United States policy and TSMC company evidence from 2024-2025; company plans and capacity are not global observed output.',
    counterevidence: 'AI is one of several semiconductor demand sources, planned fabs are not production, and no universal AI-compute-to-wafer coefficient is reported.'
  },
  mobile_network_operational_co2_exact_readback: {
    keys: ['mobile_wireless_networks->carbon_emission'],
    locators: [
      { url: 'https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks', section: '2022 global network electricity, mobile share and electricity-supply emissions boundary' },
      { url: 'https://view.gsma.com/mobile-net-zero-2026', section: '2024 operator electricity, network share, Scope 2 emissions and 2019-2024 trend' }
    ],
    exact_claim: 'Mobile radio-access and supporting network equipment consume electricity and fuel whose fossil-supplied share emits carbon dioxide.',
    scope: 'Global operator and network inventory context; site emissions require matched mobile-only electricity, fuel and physical grid supply.',
    counterevidence: 'Operational emissions fell while traffic rose, so traffic is not an emissions coefficient; operator totals can include fixed networks and data centers.'
  },
  telecom_backbone_operational_co2_exact_readback: {
    keys: ['telecom_backbone->carbon_emission'],
    locators: [
      { url: 'https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks', section: 'Global data-transmission network electricity and indirect-emissions boundary' },
      { url: 'https://www.itu.int/dms_pub/itu-d/md/22/egti.gem.2025/r/D22-EGTI.GEM.2025-R-0001%21%21PDF-E.pdf', section: 'Telecom energy indicators separating fixed/mobile and access/backhaul/core networks' }
    ],
    exact_claim: 'Core routers, optical transport and backbone facilities consume electricity whose fossil-supplied share causes indirect carbon dioxide emissions.',
    scope: 'Backbone-specific operator boundary; the IEA all-network total cannot be assigned to core or backbone equipment.',
    counterevidence: 'Access networks can dominate energy, efficiency offsets traffic growth, and shared facilities make core allocation uncertain.'
  },
  agricultural_demand_fossil_food_chain_co2_exact_readback: {
    keys: ['food->carbon_emission'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-12/', section: 'Sections 12.4.1-12.4.2: food-system energy, manufacturing and transport emissions, almost entirely CO2' },
      { url: 'https://doi.org/10.1038/s43016-021-00225-9', section: 'EDGAR-FOOD methods and global 1990-2015 inventory from production through consumption' }
    ],
    exact_claim: 'Agricultural commodity demand induces production and supply-chain activity whose fossil energy use in machinery, manufacture, processing, transport, refrigeration and retail emits carbon dioxide.',
    scope: 'Global food-system inventory; the target retains territorial fossil and industrial CO2 separately from land-use CO2 and non-CO2 gases.',
    counterevidence: 'Total food-system CO2-equivalent is not fossil CO2, trade separates demand from territorial production, and source totals are inventory shares rather than demand elasticities.'
  },
  greenhouse_forcing_amoc_decline_exact_readback: {
    keys: ['carbon_emission->amoc'],
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', section: 'Section 9.2.3 and Figure 9.10: AMOC decline across SSPs, subpolar warming and hydrological-cycle freshening mechanism' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/technical-summary/', section: 'Ocean circulation: 21st-century AMOC decline very likely for all SSP scenarios' }
    ],
    exact_claim: 'Cumulative greenhouse forcing can weaken AMOC through subpolar North Atlantic warming, freshening, buoyancy increase and reduced deep-water formation.',
    scope: 'Global forcing and Atlantic overturning projections through 2100; historical quantitative trend confidence remains low.',
    counterevidence: 'Projected magnitude and timing are uncertain, internal variability is substantial, and SSP ranges are not annual-emissions coefficients or confidence intervals.'
  },
  urban_expansion_forest_conversion_exact_readback: {
    keys: ['urbanization->deforestation'],
    locators: [
      { url: 'https://www.fao.org/interactive/forests-2020-remotesensing-forestwater/remotesensing/en/', section: 'FRA 2020 Remote Sensing Survey: urban and infrastructure development account for 6 percent of global deforestation, 2000-2018' },
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', section: 'Urban land: outward expansion can replace cropland or forests; vertical and infill growth have different land effects' }
    ],
    exact_claim: 'Outward expansion of settlements and infrastructure can permanently convert forest to built land and therefore cause a bounded share of deforestation.',
    scope: 'Global FAO attribution with regional variation; local attribution requires matched built-up expansion and forest-to-built transition maps.',
    counterevidence: 'Urban and infrastructure development account for about 6 percent, not most global deforestation; many cities grow vertically or over nonforest land.'
  }
};

const READBACK_BY_KEY = new Map();
for (const [family, record] of Object.entries(READBACK_FAMILIES)) {
  for (const key of record.keys) READBACK_BY_KEY.set(key, { family, ...record });
}

function readbackFromCuratedDossier(edgeKey, evidence) {
  const dossier = evidence?.dossier || {};
  const locators = dossier.source_locators || [];
  const geographicScope = dossier.geographic_scope || evidence?.geographic_scope;
  const temporalScope = dossier.temporal_scope || evidence?.temporal_scope;
  const moderators = dossier.moderators || evidence?.moderators || [];
  const counterevidence = dossier.counterevidence || evidence?.counterevidence;
  if (locators.length < 2
    || !geographicScope
    || !temporalScope
    || !moderators.length
    || !counterevidence) return null;
  return {
    family: 'curated_edge_dossier_exact_readback_v1',
    reviewed_at: dossier.reviewed_at || evidence.reviewed_at || REVIEWED_AT,
    exact_claim: dossier.direction
      ? `${dossier.direction}. ${dossier.mechanism || evidence.mechanism || ''}`.trim()
      : evidence.mechanism,
    locators: locators.map(locator => ({
      url: locator.url,
      section: locator.section || locator.locator,
      source_type: locator.source_type || 'relationship_specific_source'
    })),
    scope: `${geographicScope} Temporal boundary: ${temporalScope}`,
    counterevidence: `${counterevidence} Moderators: ${moderators.join('; ')}.`,
    derivation: `Structured directly from the already curated relationship dossier for ${edgeKey}; no new claim or confidence upgrade was inferred.`
  };
}

const BOUNDED_CONFIDENCE_REPAIRS = Object.freeze({
  'demand_response->utility_disconnection_risk': Object.freeze({
    confidence: 'moderate',
    temporal_scope: 'Named utility demand-response program evaluated across at least one complete billing year, with pre-program or matched-comparison disconnection outcomes and event-period compensation retained separately.',
    evidence_design: 'authoritative_energy_system_assessment_with_program_level_quasi_experimental_follow_up_required_for_local_effect_estimation'
  }),
  'building_performance_standards->refrigerant_phase_down': Object.freeze({
    confidence: 'moderate',
    temporal_scope: 'Named building-performance policy from enactment through at least one full compliance and equipment-replacement cycle; typically three to ten years, with refrigerant provisions and leakage reporting identified explicitly.',
    evidence_design: 'authoritative_buildings_policy_assessment_with_jurisdiction_specific_compliance_and_refrigerant_inventory_follow_up'
  }),
  'green_steel->critical_mineral_extraction_pressure': Object.freeze({
    confidence: 'moderate',
    temporal_scope: 'Technology-route-specific steel transition over the assessed plant-investment and equipment-supply period, with 2020-2050 scenario demand kept separate from observed annual extraction.',
    evidence_design: 'authoritative_industrial_transition_assessment_requiring_route_specific_lifecycle_and_material_inventory'
  }),
  'planned_relocation->migration': Object.freeze({
    confidence: 'moderate',
    temporal_scope: 'Named planned-relocation program from pre-move baseline through implementation and at least one to ten years of post-move residence, livelihood, return, and onward-migration observation.',
    evidence_design: 'authoritative_adaptation_assessment_with_longitudinal_household_or_community_program_evaluation_required_for_local_effect_estimation'
  }),
  'temp->lightning_regime_shifts': Object.freeze({
    confidence: 'moderate',
    temporal_scope: 'Multi-decadal historical or scenario climate response using a fixed lightning definition and observation or model system; individual storms, seasons, and isolated hot years are excluded from trend inference.',
    evidence_design: 'peer_reviewed_cloud_resolving_and_global_climate_model_comparison_with_competing_lightning_parameterizations'
  })
});

function normalizeAuthoredConfidence(edge) {
  const raw = edge.evidence?.confidence ?? edge.confidence;
  if (raw === 'medium') return { value: 'moderate', basis: 'normalized_from_medium' };
  if (['low', 'moderate', 'high'].includes(raw)) return { value: raw, basis: 'authored_relationship_assessment' };
  return null;
}

function effectDirection(edge) {
  if (typeof edge.influence !== 'number' || edge.influence === 0) return 'context_dependent';
  return edge.influence > 0 ? 'increases_or_enables_target' : 'decreases_or_constrains_target';
}

function evidenceDesign(evidence) {
  const urls = evidence.relationship_source_urls || [];
  if (urls.some(url => /ipcc\.ch|who\.int|wmo\.int|unep\.org|iea\.org/.test(url))) return 'authoritative_assessment_synthesis';
  if (urls.some(url => /doi\.org/.test(url))) return 'peer_reviewed_study_or_synthesis';
  if (urls.some(url => /api|dataset|data\./i.test(url))) return 'observational_dataset';
  return 'not_reported';
}

function sourceDomains(urls) {
  return [...new Set(urls.map(url => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
  }).filter(Boolean))];
}

function relationshipSupportAssessment(edge, readback) {
  const evidence = edge.evidence || {};
  const dossier = evidence.dossier || {};
  const urls = [...new Set(evidence.relationship_source_urls || [])];
  const domains = sourceDomains(urls);
  const level = evidence.relationship_level || dossier.evidence_basis || 'not_reported';
  const design = dossier.evidence_design || evidenceDesign(evidence);
  const hasMechanism = Boolean(evidence.mechanism || dossier.mechanism || evidence.notes || edge.verb);
  const hasGeography = Boolean(dossier.geographic_scope || evidence.geographic_scope || readback?.scope);
  const hasTime = Boolean(dossier.temporal_scope || evidence.temporal_scope);
  const hasModerators = Boolean(dossier.moderators?.length || readback?.counterevidence);
  const hasCounterevidence = Boolean(dossier.counterevidence || readback?.counterevidence);
  const components = {
    relationship_level: ({ direct: 25, indirect: 20, inferred: 12, extrapolated: 4 })[level] || 0,
    relationship_sources: Math.min(15, urls.length * 7.5),
    independent_source_domains: Math.min(10, domains.length * 5),
    evidence_design: design === 'not_reported' ? 0 : 15,
    mechanism: hasMechanism ? 10 : 0,
    bounded_scope: (hasGeography ? 5 : 0) + (hasTime ? 5 : 0),
    moderators: hasModerators ? 5 : 0,
    counterevidence: hasCounterevidence ? 5 : 0,
    source_readback: readback ? 5 : 0
  };
  const score = Math.round(Object.values(components).reduce((sum, value) => sum + value, 0));
  const boundedEvidenceGaps = [!hasGeography, !hasTime, !hasModerators, !hasCounterevidence].filter(Boolean).length;
  const confidence = level === 'extrapolated' || boundedEvidenceGaps >= 3 ? 'low'
    : level === 'indirect' ? (score >= 55 ? 'moderate' : 'low')
      : score >= 80 ? 'high'
        : score >= 55 ? 'moderate'
          : 'low';
  const missing = [
    !hasGeography && 'geographic scope',
    !hasTime && 'temporal scope',
    !hasModerators && 'moderators',
    !hasCounterevidence && 'counterevidence',
    design === 'not_reported' && 'evidence design'
  ].filter(Boolean);
  return {
    score,
    score_scale: '0-100 evidence-support completeness; not a causal effect size or probability',
    components,
    relationship_level: level,
    evidence_design: design,
    relationship_source_count: urls.length,
    independent_source_domains: domains,
    missing_evidence_dimensions: missing,
    reassessed_confidence: confidence,
    rationale: `Evidence-factor reassessment: ${level} relationship; ${urls.length} relationship-specific source(s) across ${domains.length} domain(s); ${design}; support score ${score}/100${missing.length ? `; still missing ${missing.join(', ')}` : '; all bounded-evidence dimensions present'}.`
  };
}

function metricDescriptor(node, role, relationshipContract = null) {
  if (relationshipContract) return {
    status: 'relationship_metric_contract_available',
    metric_id: relationshipContract.metric_id,
    metric_name: relationshipContract.metric_name,
    unit: relationshipContract.unit,
    geography: relationshipContract.geography,
    cadence: relationshipContract.cadence,
    source_id: relationshipContract.source_id,
    uncertainty: relationshipContract.uncertainty
  };
  const contract = node?.metric_contract;
  if (contract) return {
    status: 'node_metric_contract_available',
    metric_id: contract.metric_id,
    metric_name: contract.metric_name,
    unit: contract.unit,
    geography: contract.geography,
    cadence: contract.cadence,
    source_id: contract.source_id,
    uncertainty: contract.uncertainty
  };
  return {
    status: 'measurement_definition_required',
    metric_id: null,
    metric_name: `${node?.name || role} ${role === 'exposure' ? 'exposure or intensity measure' : 'outcome measure'}`,
    unit: null,
    geography: 'must be declared for each estimate',
    cadence: null,
    source_id: null,
    uncertainty: 'No node metric contract is available. A source-native measure and unit must be reviewed before estimating this relationship.'
  };
}

function relationshipQuantification(edge, sourceNode, targetNode, assessment, readback, sourceReportedEstimate) {
  const evidence = edge.evidence || {};
  const dossier = evidence.dossier || {};
  const exposure = metricDescriptor(sourceNode, 'exposure', readback?.measurement_contracts?.exposure);
  const outcome = metricDescriptor(targetNode, 'outcome', readback?.measurement_contracts?.outcome);
  const metricReadyStatuses = new Set(['node_metric_contract_available', 'relationship_metric_contract_available']);
  const estimable = metricReadyStatuses.has(exposure.status) && metricReadyStatuses.has(outcome.status);
  const reportedEstimand = sourceReportedEstimate ? {
    question: sourceReportedEstimate.estimand,
    exposure: {
      status: 'source_reported_exposure_definition',
      metric_id: null,
      metric_name: sourceReportedEstimate.exposure_metric,
      unit: sourceReportedEstimate.exposure_unit || sourceReportedEstimate.unit.split(' per ')[1] || null,
      geography: sourceReportedEstimate.geography,
      cadence: null,
      source_id: sourceReportedEstimate.source_id || 'ipcc_ar6_wgi',
      uncertainty: sourceReportedEstimate.boundary
    },
    outcome: {
      status: 'source_reported_outcome_definition',
      metric_id: targetNode?.metric_contract?.metric_id || null,
      metric_name: sourceReportedEstimate.outcome_metric,
      unit: sourceReportedEstimate.outcome_unit || targetNode?.metric_contract?.unit || null,
      geography: sourceReportedEstimate.geography,
      cadence: null,
      source_id: sourceReportedEstimate.source_id || 'ipcc_ar6_wgi',
      uncertainty: sourceReportedEstimate.boundary
    },
    direction: effectDirection(edge),
    minimum_method: sourceReportedEstimate.evidence_design,
    geographic_scope: sourceReportedEstimate.geography,
    temporal_scope: sourceReportedEstimate.period
  } : null;
  return {
    status: sourceReportedEstimate ? 'source_reported_effect_estimate'
      : estimable ? 'estimand_defined_measurement_pending'
        : 'estimand_blocked_by_missing_node_metric',
    estimand: {
      ...(reportedEstimand || {}),
      ...(!reportedEstimand ? {
      question: `Within the declared geography and period, how does ${outcome.metric_name} change across a documented contrast in ${exposure.metric_name}?`,
      exposure,
      outcome,
      direction: effectDirection(edge),
      minimum_method: assessment.relationship_level === 'direct'
        ? 'Estimate a source-to-target response using comparable observations, a declared baseline, and uncertainty bounds.'
        : 'Estimate the conditional source-to-target association with mediators, confounders, and alternative explanations declared; do not label it a direct causal effect.',
      geographic_scope: dossier.geographic_scope || evidence.geographic_scope || readback?.scope || 'must be declared before estimation',
      temporal_scope: dossier.temporal_scope || evidence.temporal_scope || 'must be declared before estimation'
      } : {})
    },
    scientific_effect_estimate: {
      status: sourceReportedEstimate ? 'source_reported_estimate' : 'not_estimated_from_current_structured_evidence',
      estimate: sourceReportedEstimate?.estimate ?? null,
      lower_bound: sourceReportedEstimate?.lower_bound ?? null,
      upper_bound: sourceReportedEstimate?.upper_bound ?? null,
      uncertainty_interval: sourceReportedEstimate?.uncertainty_interval || null,
      unit: sourceReportedEstimate?.unit || (estimable ? `${outcome.unit} per declared contrast in ${exposure.unit}` : null),
      source_locator: sourceReportedEstimate?.source_locator || null,
      evidence_design: sourceReportedEstimate?.evidence_design || null,
      moderators: sourceReportedEstimate?.moderators || [],
      boundary: sourceReportedEstimate?.boundary || null,
      reason: sourceReportedEstimate
        ? sourceReportedEstimate.point_estimate_status === 'derived_midpoint_of_source_reported_interval'
          ? 'The cited source reports the bounded interval for the exact estimand. The registry point is only the transparent arithmetic midpoint of that interval and is not represented as a separately source-reported best estimate.'
          : 'The estimate and accompanying bounds are reported by the cited source for the exact bounded estimand; the interval label states whether those bounds are uncertainty, assessed range, or cross-setting heterogeneity.'
        : estimable
        ? 'The exposure and outcome measures are defined, but the current relationship dossier does not contain a source-reported estimate and uncertainty interval.'
        : 'At least one endpoint lacks a reviewed metric contract; assigning a numerical effect would create false precision.'
    },
    evidence_support_quantification: {
      score: assessment.score,
      scale: assessment.score_scale,
      components: assessment.components
    },
    promotion_requirements: sourceReportedEstimate ? [] : [
      ...(!estimable ? ['Approve metric contracts for both endpoints.'] : []),
      'Read the relationship-specific source at the exact estimate locator.',
      'Record estimate, unit, uncertainty interval, geography, period, design, and adjustment set.',
      'Keep observational association, model response, and causal effect labels distinct.'
    ]
  };
}

export function applyRelationshipEvidenceGovernance(edges, nodes = []) {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  return edges.map(edge => {
    const key = `${edge.source}->${edge.target}`;
    const boundedRepair = BOUNDED_CONFIDENCE_REPAIRS[key];
    const governedInputEdge = boundedRepair ? {
      ...edge,
      confidence: boundedRepair.confidence,
      evidence: {
        ...(edge.evidence || {}),
        confidence: boundedRepair.confidence,
        temporal_scope: boundedRepair.temporal_scope,
        dossier: {
          ...(edge.evidence?.dossier || {}),
          temporal_scope: boundedRepair.temporal_scope,
          evidence_design: boundedRepair.evidence_design
        }
      }
    } : edge;
    const evidence = governedInputEdge.evidence || {};
    const dossier = evidence.dossier || {};
    const urls = [...new Set(evidence.relationship_source_urls || [])];
    const completionReadback = SOURCE_READBACK_COMPLETION[key] || SOURCE_READBACK_COMPLETION_WAVE_TWO[key];
    const readback = READBACK_BY_KEY.get(key)
      || readbackFromCuratedDossier(key, evidence)
      || (completionReadback ? {
        family: 'exact_claim_completion_v1',
        reviewed_at: completionReadback.reviewed_at,
        exact_claim: completionReadback.exact_claim,
        locators: completionReadback.source_locators,
        scope: completionReadback.geographic_temporal_scope,
        counterevidence: completionReadback.moderators_and_counterevidence
      } : null);
    const sourceReportedEstimate = SOURCE_REPORTED_ESTIMATES[key];
    const authoredConfidence = normalizeAuthoredConfidence(governedInputEdge);
    const assessment = relationshipSupportAssessment(governedInputEdge, readback);
    const confidence = authoredConfidence || {
      value: assessment.reassessed_confidence,
      basis: 'evidence_factor_reassessment_v1',
      rationale: assessment.rationale
    };
    const relationshipQuant = relationshipQuantification(
      governedInputEdge,
      nodeById.get(edge.source),
      nodeById.get(edge.target),
      assessment,
      readback,
      sourceReportedEstimate
    );
    const quantitativeEvidence = {
      effect_direction: effectDirection(governedInputEdge),
      effect_magnitude: {
        status: relationshipQuant.scientific_effect_estimate.status,
        estimate: relationshipQuant.scientific_effect_estimate.estimate,
        unit: relationshipQuant.scientific_effect_estimate.unit,
        note: `${relationshipQuant.scientific_effect_estimate.reason} The graph influence value remains a display/salience weight and is not treated as a real-world effect size.`
      },
      uncertainty: {
        status: sourceReportedEstimate ? 'quantified'
          : dossier.uncertainty_bounds ? 'reported_qualitatively'
            : 'method_required_not_estimated',
        bounds: sourceReportedEstimate ? {
          lower: sourceReportedEstimate.lower_bound,
          upper: sourceReportedEstimate.upper_bound,
          interval: sourceReportedEstimate.uncertainty_interval,
          unit: sourceReportedEstimate.unit
        } : dossier.uncertainty_bounds || null,
        moderators: sourceReportedEstimate?.moderators || dossier.moderators || readback?.counterevidence || 'not_reported'
      },
      evidence_design: dossier.evidence_design || evidenceDesign(evidence),
      population: dossier.geographic_scope || readback?.scope || 'not_reported',
      sample_period: dossier.temporal_scope || 'not_reported',
      replication: {
        relationship_source_count: urls.length,
        independently_corroborated: urls.length >= 2,
        study_replication: 'not_reported'
      },
      relationship_quantification: relationshipQuant,
      evidence_support_assessment: assessment
    };

    const sourceReadback = readback ? {
      status: 'confirmed_bounded',
      reviewed_at: readback.reviewed_at || REVIEWED_AT,
      reviewer: 'northstar_evidence_campaign',
      family: readback.family,
      exact_claim: readback.exact_claim || evidence.mechanism || `${governedInputEdge.verb}${governedInputEdge.adverb ? ` ${governedInputEdge.adverb}` : ''}`,
      source_locators: readback.locators,
      geographic_temporal_scope: readback.scope,
      moderators_and_counterevidence: readback.counterevidence,
      qualification: confidence.value === 'low'
        ? 'The mechanism is retained as a conditional, low-confidence pathway; confirmation applies to plausibility and bounded framing, not a universal effect.'
        : 'The source assessment supports the bounded mechanism under the stated conditions; it is not a universal project-level effect.'
    } : evidence.source_readback;

    return {
      ...governedInputEdge,
      confidence: confidence.value,
      evidence: {
        ...evidence,
        confidence: confidence.value,
        confidence_basis: confidence.basis,
        confidence_rationale: confidence.rationale || evidence.confidence_rationale || null,
        confidence_reassessment: authoredConfidence ? null : {
          reviewed_at: REVIEWED_AT,
          method: 'evidence_factor_reassessment_v1',
          prior_state: 'conservative_default_pending_reassessment',
          decision: confidence.value,
          ...assessment
        },
        quantitative_evidence: quantitativeEvidence,
        ...(sourceReadback ? { source_readback: sourceReadback } : {})
      }
    };
  });
}

export const MANUAL_READBACK_EDGE_KEYS = new Set(READBACK_BY_KEY.keys());
