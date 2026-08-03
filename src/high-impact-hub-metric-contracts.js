const REVIEWED_AT = '2026-07-18';

function contract({ metric_id, metric_name, unit, geography, cadence, observation_time_field, source_id, transformation, uncertainty, threshold_provenance, failure_behavior }) {
  return Object.freeze({
    metric_id,
    metric_name,
    unit,
    geography,
    cadence,
    observation_time_field,
    source_id,
    transformation,
    uncertainty,
    threshold_provenance,
    failure_behavior,
    reviewed_at: REVIEWED_AT,
    contract_status: 'reviewed_live_node_metric'
  });
}

export const HIGH_IMPACT_HUB_METRIC_CONTRACTS = Object.freeze({
  temp: contract({
    metric_id: 'global_mean_surface_temperature_anomaly', metric_name: 'Global mean surface temperature anomaly above 1850-1900', unit: 'degrees Celsius', geography: 'global with land-ocean coverage diagnostics', cadence: 'monthly with annual synthesis', observation_time_field: 'observation_month', source_id: 'nasa_giss_surface_temperature_analysis',
    transformation: 'Use the published global surface-temperature anomaly; retain baseline, coverage, land-ocean method, provisional status, and ensemble or dataset spread. Do not substitute a satellite atmospheric-layer temperature.',
    uncertainty: 'Coverage, homogenization, sea-surface-temperature methods, baseline conversion, and provisional recent observations produce dataset spread.',
    threshold_provenance: 'WMO/IPCC warming levels relative to 1850-1900; thresholds are climate-state references, not single-month policy triggers.',
    failure_behavior: 'Retain the latest annual reviewed value and mark stale when the source is unavailable; never infer missing months from the TULIP score.'
  }),
  carbon_emission: contract({
    metric_id: 'territorial_fossil_and_industrial_co2_emissions', metric_name: 'Territorial fossil-fuel and industrial-process carbon dioxide emissions', unit: 'million tonnes CO2 per year', geography: 'global, country, or reporting jurisdiction with inventory boundary declared', cadence: 'annual', observation_time_field: 'inventory_year', source_id: 'edgar_global_emissions_database',
    transformation: 'Sum fossil combustion and industrial-process CO2 by declared territory and year; keep land-use change, consumption-based emissions, removals, and other greenhouse gases separate.',
    uncertainty: 'Fuel statistics, oxidation factors, process data, bunker allocation, inventory revisions, and boundary choices affect totals.',
    threshold_provenance: 'Use source-reported inventory uncertainty and pathway-specific carbon budgets; atmospheric concentration is supporting context, not an emissions unit.',
    failure_behavior: 'Freeze the last reviewed inventory release and expose the reporting lag; never convert atmospheric ppm or graph influence into tonnes emitted.'
  }),
  ocean_acidification: contract({
    metric_id: 'surface_ocean_ph_and_aragonite_state', metric_name: 'Surface-ocean pH and aragonite saturation state', unit: 'pH units and unitless omega-aragonite reported separately', geography: 'named station, transect, region, or gridded ocean product', cadence: 'monthly to annual', observation_time_field: 'sample_or_analysis_time', source_id: 'noaa_ocean_carbon_and_acidification_data_system',
    transformation: 'Apply carbonate-system quality control and retain temperature, salinity, pressure, measured variables, calculation constants, depth, and platform before estimating pH or saturation trends.',
    uncertainty: 'Sensor calibration, sparse sampling, carbonate dissociation constants, depth, seasonality, and freshwater mixing affect estimates.',
    threshold_provenance: 'Use source-reported analytical uncertainty and organism- or habitat-specific saturation thresholds; no universal global ecological cutoff.',
    failure_behavior: 'Do not interpolate across unobserved regions or combine pH scales without conversion metadata.'
  }),
  drought_persistence: contract({
    metric_id: 'drought_event_duration_spi6', metric_name: 'Duration of meteorological drought under a declared SPI-6 threshold', unit: 'consecutive qualifying months and drought-months per year', geography: 'bounded Copernicus GDO ERA5 0.25-degree grid cell represented by a named point', cadence: 'monthly with annual complete-year rollup', observation_time_field: 'drought_index_month', source_id: 'copernicus_european_and_global_drought_observatories',
    transformation: 'Use source SPI-6 values and the fixed 1991-2020 reference climatology; classify months at or below -1.0 as meteorological drought, group consecutive qualifying months, and report longest duration, total drought months, and cumulative index deficit separately.',
    uncertainty: 'ERA5 precipitation, distribution fitting, reference period, grid assignment, six-month accumulation, threshold choice, dataset revision, and annual-window truncation alter event classification.',
    threshold_provenance: 'Copernicus SPI classification identifies increasingly severe dry conditions below -1.0. This pilot uses SPI-6 only and does not mix meteorological, agricultural, hydrological, or socioeconomic drought.',
    failure_behavior: 'No event is published without all twelve finite monthly values; missing months are not treated as drought-free, and cross-year events are marked truncated.'
  }),
  critical_infrastructure_fragility: contract({
    metric_id: 'eia_oe417_reported_customer_interruption_burden', metric_name: 'Customer-hours in reported major electric disturbance events', unit: 'customer-hours per completed published reporting year, with events and customers reported separately', geography: 'United States and Puerto Rico events present in EIA Electric Power Monthly Table B.2', cadence: 'annual completed-year table with monthly source check', observation_time_field: 'event_date_time_source', source_id: 'eia_major_disturbances_and_unusual_occurrences_doe_417',
    transformation: 'For qualifying DOE-417 events with both fields, multiply source-reported customers affected by source-reported event duration; retain utility, area, disturbance type, megawatts lost, missing-duration coverage, and event records. Keep this electricity-only result separate from other infrastructure sectors.',
    uncertainty: 'Customer counts are preliminary estimates; reports cover qualifying major events rather than all outages; restoration can be staggered; overlapping events can double-count customers; missing duration, revisions, local-time conventions, and reporting thresholds affect customer-hours.',
    threshold_provenance: 'DOE-417 mandatory reporting criteria define the included major disturbances. This is not a universal fragility threshold, utility SAIDI/SAIFI, or a cross-sector composite.',
    failure_behavior: 'Reject table schema drift or empty data, withhold customer-hours when either customers or duration is missing, preserve observation year and coverage, and never infer water, transport, health, communications, or asset fragility from electricity reports.'
  }),
  environ_anomalies: contract({
    metric_id: 'compound_climate_hazard_days', metric_name: 'Days with concurrent climate-hazard threshold exceedances', unit: 'compound-hazard days per year by hazard pair or tuple', geography: 'bounded grid, city, basin, region, or country', cadence: 'daily classification with monthly and annual rollups', observation_time_field: 'hazard_day', source_id: 'nasa_power_open_api',
    transformation: 'For the operational pilot, calculate location-specific 95th-percentile thresholds for daily maximum 2 m temperature and corrected daily precipitation over 1991-2020, then count same-day exceedances in a declared observation year. Retain the pair definition, baseline, location, time standard, component values, and completeness; do not generalize this heat-plus-heavy-precipitation pair into a universal compound-risk score.',
    uncertainty: 'Station coverage, reanalysis bias, threshold selection, spatial aggregation, and event dependence affect counts.',
    threshold_provenance: 'Each component threshold must come from an authoritative hazard definition or a fixed local climatology; no universal compound index.',
    failure_behavior: 'Do not count a compound event when either component is missing or when hazards occur outside the declared simultaneity window.'
  }),
  wildfire_regime_shift: contract({
    metric_id: 'gwis_non_cropland_burned_area_and_season_span', metric_name: 'Satellite-mapped non-cropland burned area and 90-percent monthly season span', unit: 'hectares per year and calendar months reported separately', geography: 'declared country aggregated from GWIS GADM level 1 rows', cadence: 'monthly source observations with annual complete-year rollup', observation_time_field: 'burned_area_month', source_id: 'ec_jrc_global_wildfire_information_system_mcd64a1_burned_area',
    transformation: 'Aggregate source MCD64A1 forest, savanna, shrubland/grassland, and other burned-area hectares while retaining cropland separately; compare annual area with a fixed 2003-2022 baseline and calculate the shortest circular run of months containing at least 90 percent of annual non-cropland burned area.',
    uncertainty: 'MCD64A1 cloud and observation gaps, 500 m resolution, small-fire omission, land-cover classification, GADM boundaries, managed burning, fire-type attribution, dataset revisions, and monthly temporal grain affect the metric.',
    threshold_provenance: 'The 90-percent span is a declared monthly concentration statistic, not a source wildfire-severity threshold. Excluding cropland reduces agricultural-burning contamination but does not separate wildfire from prescribed fire, pasture burning, peat fire, or land clearing.',
    failure_behavior: 'Reject incomplete country-year or schema coverage, retain the last validated release, and never convert active-fire hotspot counts to hectares, label every mapped burn as wildfire, or infer ecological severity from area alone.'
  }),
  freshwater_ecosystem_collapse: contract({
    metric_id: 'epa_nrsa_poor_biological_condition', metric_name: 'River and stream miles in poor benthic-macroinvertebrate or fish-community condition', unit: 'estimated percent of river and stream miles with source 95 percent confidence interval', geography: 'conterminous United States national estimate or one declared NRSA nine-ecoregion estimate', cadence: 'NRSA survey cycle', observation_time_field: 'survey_period_end', source_id: 'u_s_epa_national_rivers_and_streams_assessment_2018_2019',
    transformation: 'Use source probability-weighted NRSA 2018-2019 biological-condition estimates; retain benthic and fish indicators separately with good, fair, poor, and not-assessed categories, sampled-site counts, estimated miles, survey geography, and source confidence bounds.',
    uncertainty: 'Survey weights, site accessibility, reference-condition thresholds, index construction, fish nonresponse, temporal sampling, ecoregional calibration, and survey-design changes affect estimates.',
    threshold_provenance: 'EPA NRSA biological multimetric-index condition categories calibrated against regional reference conditions. Poor condition is a bounded survey classification, not a universal collapse threshold.',
    failure_behavior: 'Reject missing category, confidence-bound, geography, or indicator rows; never infer local waterbody condition, lakes, unassessed waters, global freshwater condition, or ecosystem collapse from this conterminous-U.S. river and stream survey.'
  }),
  water_stress: contract({
    metric_id: 'baseline_water_withdrawal_to_supply_ratio', metric_name: 'Baseline water withdrawals relative to available renewable supply', unit: 'percent', geography: 'basin, sub-basin, country, or declared service area', cadence: 'annual with periodic model revision', observation_time_field: 'water_accounting_year', source_id: 'wri_aqueduct',
    transformation: 'Divide total consumptive and non-consumptive withdrawals, with sector accounting retained, by available renewable surface and groundwater supply under the source methodology.',
    uncertainty: 'Withdrawal reporting, return flows, environmental-flow assumptions, groundwater availability, inter-basin transfers, and model resolution affect the ratio.',
    threshold_provenance: 'Use Aqueduct category boundaries or a separately documented local standard; preserve model version.',
    failure_behavior: 'Do not treat absent withdrawal data as zero or apply basin ratios to individual households or facilities.'
  }),
  ice_sheet_mass_loss: contract({
    metric_id: 'ice_sheet_mass_balance', metric_name: 'Greenland or Antarctic ice-sheet mass balance', unit: 'gigatonnes per year with sea-level-equivalent contribution reported separately', geography: 'Greenland, Antarctica, named drainage basin, or ice-sheet sector', cadence: 'annual with multi-year trend updates', observation_time_field: 'mass_balance_period_end', source_id: 'ice_sheet_mass_balance_inter_comparison_exercise',
    transformation: 'Combine or retain gravimetry, altimetry, and input-output estimates under the published reconciliation; preserve method, basin, period, covariance, and sign convention.',
    uncertainty: 'Glacial-isostatic adjustment, firn processes, density conversion, satellite processing, sparse accumulation observations, and method covariance affect mass balance.',
    threshold_provenance: 'Use IMBIE source-reported confidence intervals; no single annual-loss threshold defines instability.',
    failure_behavior: 'Do not mix glacier and ice-sheet totals or combine incompatible periods without covariance-aware uncertainty.'
  }),
  crop_yield_volatility: contract({
    metric_id: 'crop_yield_interannual_variability', metric_name: 'Crop-specific interannual yield variability around a declared trend', unit: 'percent coefficient of variation or percent yield anomaly', geography: 'country, subnational crop region, or agroecological zone', cadence: 'annual by crop and harvest year', observation_time_field: 'harvest_year', source_id: 'faostat',
    transformation: 'Use harvested production divided by harvested area; detrend over a declared fixed window and calculate crop-specific anomalies or coefficient of variation without aggregating crops with different units.',
    uncertainty: 'Production revisions, harvested-area estimates, crop aggregation, technological trend removal, multiple seasons, and informal production affect volatility.',
    threshold_provenance: 'Use crop- and region-specific historical distributions; no universal volatility threshold.',
    failure_behavior: 'Do not infer climate causation from yield variability without weather, management, price, conflict, and pest controls.'
  }),
  grid_peak_load_stress: contract({
    metric_id: 'grid_peak_demand_and_forecast_stress', metric_name: 'Peak balancing-authority demand and day-ahead forecast error', unit: 'megawatt-hours per hourly interval and percent forecast error, reported separately', geography: 'balancing authority, control area, or interconnected system', cadence: 'hourly with rolling 30-day and seasonal assessment', observation_time_field: 'operating_hour', source_id: 'eia_hourly_electric_grid_monitor',
    transformation: 'Retain hourly observed demand and day-ahead forecast under the same balancing-authority boundary; report the peak, 95th percentile, observation completeness, and mean absolute forecast error for a declared window.',
    uncertainty: 'Balancing-area revisions, behind-the-meter resources, demand-response dispatch, interchange accounting, missing hours, and forecast revisions affect the observed stress signal.',
    threshold_provenance: 'Use the balancing authority historical distribution and declared forecast-error convention; this metric is an operating-stress indicator, not a reserve-margin estimate.',
    failure_behavior: 'Do not infer available capacity, operating reserves, or a reliability violation from demand alone; withhold the metric when hourly coverage or demand/forecast pairing is insufficient.'
  }),
  public_health_heat_burden: contract({
    metric_id: 'heat_attributable_mortality_rate', metric_name: 'Modelled heat-attributable deaths and fraction of all deaths', unit: 'deaths and percent of all deaths attributable to heat, reported separately', geography: 'global and WHO region in the current operational release; finer geography requires a separately validated source', cadence: 'annual Lancet Countdown release', observation_time_field: 'calendar_year', source_id: 'lancet_countdown_data_explorer',
    transformation: 'Retain source-reported attributable number and fraction separately under the declared three-stage heat-mortality model; preserve geography, year, exposure-response method, and minimum-mortality-temperature counterfactual.',
    uncertainty: 'The current workbook supplies modelled point estimates without observation-level intervals. Death registration, temperature exposure, lag structure, meta-prediction, adaptation, air pollution, harvesting, model choice, and population denominators affect estimates.',
    threshold_provenance: 'Use source-defined heat-attributable mortality only; a heat alert or temperature exceedance is not a mortality threshold.',
    failure_behavior: 'Retain the last validated release and mark stale; do not report heat-attributable deaths from temperature exposure alone, convert absent intervals to zero, or pool incompatible mortality definitions.'
  }),
  coastal_inundation_risk: contract({
    metric_id: 'coastal_high_water_exposure_days', metric_name: 'Days coastal water level exceeds a declared local impact threshold', unit: 'minor, moderate, and major high-tide-flood days per year reported separately', geography: 'named United States NOAA CO-OPS tide gauge', cadence: 'daily maximum with annual rollup', observation_time_field: 'water_level_day', source_id: 'noaa_co_ops_derived_product_api',
    transformation: 'Use NOAA CO-OPS High Tide Flooding daily records and source-supplied minor, moderate, and major exceedance flags for a named gauge, fixed datum, units, and calendar year. Retain maximum water level, time, daily completeness, missing-data flag, station metadata, and threshold metadata; count each severity independently and do not infer inundated area or damage.',
    uncertainty: 'Vertical datum, land motion, gauge gaps, surge and wave setup, elevation-model error, defenses, and exposure mapping affect results.',
    threshold_provenance: 'NOAA CO-OPS/NWS station-specific minor, moderate, and major flood thresholds returned by the official metadata and derived-product services.',
    failure_behavior: 'Do not translate global mean sea level directly into local inundation or count modeled exposure as observed damage.'
  }),
  resource_depletion: contract({
    metric_id: 'material_extraction_and_footprint_by_resource', metric_name: 'Material footprint and domestic material consumption by raw-material class', unit: 'tonnes per year and tonnes per person reported separately by accounting boundary and material class', geography: 'UNSD country, region, or World geography with consumption-based and domestic-use boundaries separated', cadence: 'annual', observation_time_field: 'material_flow_year', source_id: 'unsd_sdg_api_unep_material_flows',
    transformation: 'Retain UNSD SDG 12.2.1 material footprint and 12.2.2 domestic material consumption as separate accounting boundaries; preserve absolute and per-capita series for total, biomass, fossil fuels, metal ores, and non-metallic minerals. Never sum the total class with its components.',
    uncertainty: 'Multi-regional input-output allocation, raw-material-equivalent coefficients, trade attribution, informal extraction, conversion coefficients, stock changes, population denominators, modeled observations and revisions affect estimates.',
    threshold_provenance: 'Use UNEP/UNSD SDG 12.2.1 and 12.2.2 economy-wide material-flow definitions. These are material-pressure indicators; no universal depletion or scarcity threshold exists across resource classes.',
    failure_behavior: 'Do not equate material footprint or domestic material consumption with remaining reserves, scarcity, ore grade, recycled content, extraction alone, or a causal depletion score; never fill missing geographies or classes with zero.'
  }),
  wet_bulb_heat: contract({
    metric_id: 'wet_bulb_temperature_exceedance_hours', metric_name: 'Hours above a declared wet-bulb-temperature threshold', unit: 'degrees Celsius and exceedance hours per year', geography: 'bounded NASA POWER 0.5 x 0.625 degree meteorological grid cell represented by a named point', cadence: 'hourly with annual rollups', observation_time_field: 'heat_observation_time', source_id: 'nasa_power_open_api',
    transformation: 'Use NASA POWER source-native hourly T2MWET for a named point and UTC observation year; retain source resolution, fill value, completeness, maximum and 95th percentile, and count hours at or above each declared 26, 28, 30, 32, and 35 degree Celsius threshold. Keep thermodynamic wet-bulb temperature distinct from WBGT, station observations, indoor exposure, and person-level heat dose.',
    uncertainty: 'Humidity and temperature sensor bias, radiation and wind for WBGT, reanalysis resolution, indoor exposure, acclimatization, and threshold choice affect interpretation.',
    threshold_provenance: 'Use occupational or health guidance appropriate to activity and acclimatization; 35 C wet bulb is a physiological boundary, not a universal safe-work threshold.',
    failure_behavior: 'Do not derive wet bulb from non-collocated daily extrema or label air temperature as wet-bulb heat.'
  }),
  ocean_heat_content: contract({
    metric_id: 'upper_ocean_heat_content_anomaly', metric_name: 'Ocean heat-content anomaly over a declared depth layer', unit: 'zettajoules relative to a declared baseline', geography: 'global ocean, basin, or bounded grid and depth layer', cadence: 'monthly with quarterly and annual synthesis', observation_time_field: 'analysis_month', source_id: 'noaa_global_ocean_heat_content_cdr',
    transformation: 'Integrate temperature anomaly times seawater density and heat capacity over the declared area and depth; retain baseline, mapping method, platform mix, and sampling coverage.',
    uncertainty: 'Sparse deep-ocean sampling, expendable-bathythermograph bias, Argo coverage, mapping, salinity, and baseline choice affect estimates.',
    threshold_provenance: 'Use source-reported ensemble uncertainty and fixed depth layers; do not compare totals across different baselines or layers.',
    failure_behavior: 'Do not extrapolate a regional anomaly to the global ocean or fill data gaps with zero heat anomaly.'
  }),
  methane: contract({
    metric_id: 'anthropogenic_methane_emissions', metric_name: 'Anthropogenic methane emissions by source sector', unit: 'million tonnes CH4 per year', geography: 'global, country, basin, facility class, or inventory jurisdiction', cadence: 'annual with source-specific updates', observation_time_field: 'inventory_year', source_id: 'edgar_global_emissions_database',
    transformation: 'Sum source-resolved methane mass under a declared inventory boundary; retain fossil, agriculture, waste, fire, and natural sources separately and preserve top-down versus bottom-up method.',
    uncertainty: 'Emission factors, activity data, super-emitters, wetlands, source attribution, atmospheric transport, and inventory revisions affect totals.',
    threshold_provenance: 'Use source-sector inventory uncertainty and methane-budget reconciliation; atmospheric ppb is a burden indicator, not an emissions unit.',
    failure_behavior: 'Do not convert concentration growth directly to anthropogenic emissions without an atmospheric budget and sink estimate.'
  }),
  food: contract({
    metric_id: 'apparent_agricultural_commodity_demand', metric_name: 'Apparent domestic agricultural commodity demand', unit: 'tonnes per year by commodity with kilograms per person reported separately', geography: 'country or declared market region', cadence: 'annual', observation_time_field: 'commodity_balance_year', source_id: 'faostat',
    transformation: 'Calculate production plus imports minus exports and stock additions under a declared commodity balance; retain food, feed, seed, processing, and loss uses separately.',
    uncertainty: 'Informal trade, stock changes, commodity conversion, feed allocation, waste, and statistical revisions affect apparent demand.',
    threshold_provenance: 'Use FAOSTAT commodity-balance definitions; demand growth is contextual and has no universal harmful threshold.',
    failure_behavior: 'Do not add commodities with incompatible mass equivalents or equate apparent supply with consumption.'
  }),
  monsoon_volatility: contract({
    metric_id: 'monsoon_onset_and_seasonal_rainfall_variability', metric_name: 'Monsoon rainfall-gate anomaly and seasonal rainfall variability', unit: 'days from baseline rainfall-gate date and percent seasonal rainfall anomaly reported separately', geography: 'IMD Kerala-onset 14-location rainfall panel represented by declared NASA POWER grid points', cadence: 'daily source observations with annual complete-season synthesis', observation_time_field: 'rainfall_day', source_id: 'nasa_power_monsoon_rainfall_pilot',
    transformation: 'Apply only the rainfall portion of the published IMD Kerala-onset criterion: after 10 May, at least 60 percent of the named 14-location panel must reach 2.5 mm per day for two consecutive days. Compare the second day and the June-September location-mean rainfall total with 1991-2020, keeping the two anomalies separate.',
    uncertainty: 'NASA POWER is gridded and reanalysis-derived rather than the IMD station network. Grid assignment, precipitation bias, point coordinates, missing values, station-mean aggregation, baseline, intraseasonal oscillations, topography, and retrospective replacement affect results.',
    threshold_provenance: 'Rainfall threshold, panel fraction, consecutive-day rule, location list, and after-10-May boundary come from IMD onset criteria. Wind-field and outgoing-longwave-radiation criteria are not measured, so the result is a rainfall-gate proxy rather than an official onset declaration.',
    failure_behavior: 'Withhold the metric if fewer than 27 baseline years or any observation-season panel member is incomplete. Do not call the rainfall gate official onset, compare it with other onset definitions without reconciliation, or fill missing rainfall with zero.'
  }),
  urbanization: contract({
    metric_id: 'built_up_surface_expansion', metric_name: 'Annual expansion of built-up surface', unit: 'hectares per year with urban population share reported separately', geography: 'urban centre, metropolitan area, country, or declared grid', cadence: 'annual to multi-year remote-sensing update', observation_time_field: 'built_up_observation_year', source_id: 'global_human_settlement_layer',
    transformation: 'Classify built-up surface using a fixed GHSL product and boundary; compare harmonized epochs and retain population, density, redevelopment, and boundary-change diagnostics.',
    uncertainty: 'Sensor resolution, classification, settlement boundary, vertical development, informal settlements, cloud, and epoch spacing affect expansion estimates.',
    threshold_provenance: 'Use GHSL settlement definitions and local planning boundaries; built-up growth is not synonymous with population growth.',
    failure_behavior: 'Do not count administrative boundary expansion as physical urbanization or infer land conversion between incompatible product versions.'
  }),
  migration: contract({
    metric_id: 'hazard_related_internal_displacements', metric_name: 'New internal displacement movements associated with recorded hazards', unit: 'displacement movements per year with people in displacement reported separately', geography: 'country, subnational region, or recorded disaster event', cadence: 'event-based with annual rollup', observation_time_field: 'displacement_event_date', source_id: 'idmc',
    transformation: 'Retain event, hazard, location, movement estimate, stock-versus-flow distinction, reporting source, and confidence; aggregate new movements without treating repeat movements as unique people.',
    uncertainty: 'Rapid estimates, evacuation versus displacement, repeat movement, conflict overlap, cross-border flows, and incomplete reporting affect totals.',
    threshold_provenance: 'Use IDMC methodology and event confidence; hazard association does not by itself establish climate attribution.',
    failure_behavior: 'Do not label all migration as climate migration or add movement flows to displacement stocks.'
  }),
  permafrost_thaw: contract({
    metric_id: 'permafrost_active_layer_thickness', metric_name: 'Annual maximum active-layer thickness above permafrost', unit: 'centimetres with ground-temperature trend reported separately', geography: 'named borehole, CALM grid, region, or permafrost zone', cadence: 'annual maximum with continuous temperature where available', observation_time_field: 'active_layer_year', source_id: 'global_terrestrial_network_for_permafrost',
    transformation: 'Retain site, method, thaw-depth maximum, ground temperature by depth, snow, vegetation, soil, and continuity class; compare only consistent sites and methods.',
    uncertainty: 'Site heterogeneity, probing method, subsidence, snow, vegetation, soil moisture, sensor depth, and sparse Arctic coverage affect trends.',
    threshold_provenance: 'Use site-specific historical distributions and engineering or ecological thresholds; no global active-layer cutoff.',
    failure_behavior: 'Do not infer carbon release or regional area thawed from one borehole or mix active-layer thickness with talik depth.'
  }),
  food_import_exposure: contract({
    metric_id: 'food_import_dependency_ratio', metric_name: 'Food import dependency relative to apparent domestic supply', unit: 'percent by commodity or calorie-equivalent basket', geography: 'country or declared market region', cadence: 'annual', observation_time_field: 'food_balance_year', source_id: 'faostat',
    transformation: 'Calculate net imports divided by domestic supply under a declared commodity or calorie-equivalent basket; retain negative ratios, stocks, re-exports, food aid, and commodity weights.',
    uncertainty: 'Informal trade, stock changes, re-exports, conversion to calories, commodity aggregation, and reporting lag affect dependency.',
    threshold_provenance: 'Use FAO food-balance definitions and country-specific risk context; dependency alone does not imply insecurity.',
    failure_behavior: 'Do not combine commodity mass without a declared conversion or treat missing trade as zero imports.'
  }),
  marine_heatwaves: contract({
    metric_id: 'marine_heatwave_days_and_intensity', metric_name: 'Marine heatwave duration, intensity, and affected-ocean area above a seasonally varying threshold', unit: 'event-days, degree-Celsius-days, and percent ocean area reported separately', geography: 'ocean grid cell, exclusive economic zone, marine ecoregion, basin, or declared global-ocean aggregation', cadence: 'daily classification with monthly and annual rollups', observation_time_field: 'sea_surface_temperature_day_or_source_report_month', source_id: 'noaa_marine_heatwaves',
    transformation: 'Apply a fixed baseline and the published seasonally varying percentile threshold to daily sea-surface temperature; retain gap handling, event duration, maximum intensity, cumulative intensity, and area.',
    uncertainty: 'Satellite retrieval, clouds and ice, coastal pixels, baseline length, product changes, subsurface heat, and spatial aggregation affect event metrics.',
    threshold_provenance: 'Use the published marine-heatwave percentile method and declared baseline; do not mix absolute temperature and percentile categories.',
    failure_behavior: 'Do not classify events across missing-day gaps beyond the method allowance or infer ecosystem damage from thermal exposure alone.'
  })
});
