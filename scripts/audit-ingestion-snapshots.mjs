import fs from 'node:fs/promises';
import path from 'node:path';

const contractsRegistry = JSON.parse(
  await fs.readFile(path.resolve('public/node-metric-contracts.json'), 'utf8')
);
const knownMetricIds = new Set(
  Object.values(contractsRegistry.contracts || {}).map(contract => contract.metric_id)
);
const sourceRegistry = JSON.parse(
  await fs.readFile(path.resolve('public/tulip-source-registry.json'), 'utf8')
);
const knownSourceIds = new Set((sourceRegistry.sources || []).map(source => source.id));
const jobRegistry = JSON.parse(
  await fs.readFile(path.resolve('public/ingestion-job-registry.json'), 'utf8')
);
const jobsById = new Map((jobRegistry.jobs || []).map(job => [job.ingestion_job_id, job]));
const snapshots = [
  {
    file: 'public/nasa-ceres-global-cloud-radiative-effect-snapshot.json',
    job: 'fetch_nasa_ceres_global_cloud_radiative_effect',
    minimumRecords: 240,
    required: ['record_id', 'node_id', 'metric_id', 'measurement_role', 'observation_period', 'observation_year', 'observation_month', 'geography', 'toa_shortwave_all_sky_flux_w_m2', 'toa_shortwave_clear_sky_flux_w_m2', 'toa_shortwave_cloud_radiative_effect_w_m2', 'cloud_radiative_effect_convention', 'unit', 'source_variables', 'source_locator']
  },
  {
    file: 'public/world-bank-global-air-quality-snapshot.json',
    job: 'fetch_world_bank_wdi_global_pm2_5_exposure',
    minimumRecords: 20,
    required: ['record_id', 'node_id', 'metric_id', 'measurement_role', 'geography_code', 'geography_name', 'observation_year', 'mean_annual_pm2_5_exposure_ug_m3', 'unit', 'source_indicator_id', 'source_indicator_name', 'source_locator']
  },
  {
    file: 'public/fra-snapshot.json',
    job: 'fetch_fao_fra_global_deforestation_rate',
    minimumRecords: 3,
    required: ['record_id', 'metric_id', 'measurement_role', 'geography', 'period_start_year', 'period_end_year', 'forest_change_measure', 'value_million_hectares_per_year', 'unit', 'uncertainty_status', 'source_locator']
  },
  {
    file: 'public/noaa-marine-heatwave-snapshot.json',
    job: 'fetch_noaa_psl_marine_heatwave_coverage',
    minimumRecords: 2,
    required: ['record_id', 'metric_id', 'component', 'treatment', 'observation_period', 'unit', 'value', 'historical_rank', 'ranking_start_year', 'source_locator']
  },
  {
    file: 'public/enso-monitoring-snapshot.json',
    job: 'fetch_noaa_cpc_oni',
    minimumRecords: 1200,
    required: ['record_id', 'metric_id', 'observation_period', 'season', 'year', 'oni_anomaly_degC', 'total_nino34_sst_degC', 'threshold_met_this_season', 'consecutive_qualifying_overlapping_seasons', 'episode_criterion_met', 'episode_criterion', 'source_locator']
  },
  {
    file: 'public/acaps-humanitarian-access-snapshot.json',
    job: 'fetch_acaps_humanitarian_access',
    required: ['record_id', 'metric_id', 'measurement_role', 'geography', 'observation_period_start', 'observation_period_end', 'observation_date', 'assessed_country_count_derived_from_trend_categories', 'source_reported_high_to_extreme_country_count', 'source_reported_high_to_extreme_country_share_pct', 'high_to_extreme_threshold', 'source_reported_deteriorated_country_count', 'source_reported_deteriorated_country_share_pct', 'source_reported_improved_country_count', 'source_reported_improved_country_share_pct', 'source_reported_stable_country_count', 'source_reported_stable_country_share_pct', 'methodology_indicator_count', 'methodology_pillar_count', 'source_score_scale_min', 'source_score_scale_max', 'source_locator']
  },
  {
    file: 'public/atcems-response-compliance-snapshot.json',
    job: 'fetch_atcems_response_compliance',
    required: ['record_id', 'metric_id', 'measurement_role', 'month_key', 'month_start_date', 'total_incidents', 'city_of_austin_incidents', 'travis_county_incidents', 'other_area_incidents', 'source_reported_overall_on_time_pct', 'source_reported_city_on_time_pct', 'source_reported_county_on_time_pct', 'source_reported_target_on_time_pct', 'derived_overall_response_goal_miss_pct', 'derived_overall_missed_incidents_approx', 'derived_target_shortfall_percentage_points', 'priority_breakdown', 'source_locator']
  },
  {
    file: 'public/openfema-ihp-geographic-gap-snapshot.json',
    job: 'fetch_openfema_geographic_ihp_assistance_gap',
    required: ['record_id', 'metric_id', 'measurement_role', 'disaster_number', 'declaration_title', 'state', 'declaration_type', 'incident_type', 'declaration_date', 'incident_begin_date', 'incident_end_date', 'qualifying_geography_count', 'total_valid_registrations', 'total_ihp_eligible', 'total_ihp_amount_usd', 'weighted_ihp_eligibility_rate_pct', 'geographic_ihp_eligibility_rate_gap_percentage_points', 'geographic_ihp_award_per_eligible_gap_usd', 'minimum_eligibility_group', 'maximum_eligibility_group', 'minimum_award_per_eligible_group', 'maximum_award_per_eligible_group', 'geography_comparisons', 'source_locator']
  },
  {
    file: 'public/sabin-climate-litigation-counts-snapshot.json',
    job: 'build_sabin_climate_litigation_counts_assessment',
    required: ['record_id', 'metric_id', 'observation_year', 'source_time_label', 'cumulative_climate_related_cases', 'database_scope', 'uncertainty_status', 'source_locator']
  },
  {
    file: 'public/unep-adaptation-finance-gap-snapshot.json',
    job: 'build_unep_adaptation_finance_gap_assessment',
    required: ['record_id', 'metric_id', 'geography', 'need_horizon_year', 'flow_observation_year', 'price_year', 'modelled_need_billion_usd_per_year', 'ndc_nap_extrapolated_need_billion_usd_per_year', 'international_public_flow_billion_usd_per_year', 'finance_gap_lower_billion_usd_per_year', 'finance_gap_upper_billion_usd_per_year', 'range_interpretation', 'source_locator']
  },
  {
    file: 'public/undrr-mhews-status-snapshot.json',
    job: 'build_undrr_mhews_status_assessment',
    required: ['record_id', 'metric_id', 'geography', 'reporting_as_of', 'country_reporting_status_basis', 'reported_mhews_countries', 'reported_mhews_country_share_pct', 'derived_country_reporting_gap_pct', 'uncertainty_status', 'source_locator']
  },
  {
    file: 'public/ocha-humanitarian-funding-shortfall-snapshot.json',
    job: 'fetch_ocha_humanitarian_funding_shortfall',
    required: ['record_id', 'metric_id', 'metric_roles', 'plan_id', 'plan_code', 'plan_name', 'plan_year', 'plan_start_date', 'plan_end_date', 'plan_type', 'locations', 'original_requirement_usd', 'revised_requirement_usd', 'fts_reported_funding_usd', 'fts_reported_pledges_usd', 'reported_funding_shortfall_usd', 'reported_funding_coverage_pct', 'reported_shortfall_pct', 'reported_financial_resource_gap_usd', 'reported_financial_resource_gap_pct', 'positive_requirement_revision_usd', 'positive_requirement_revision_pct', 'positive_requirement_revision_reported', 'funding_status', 'source_locator']
  },
  {
    file: 'public/ocads-acidification-snapshot.json',
    job: 'fetch_noaa_ocads_surface_acidification_climatology',
    required: ['record_id', 'metric_id', 'measurement_role', 'longitude', 'latitude', 'depth_m', 'analysis_reference_year', 'source_observation_start', 'source_observation_end', 'ph_total_scale_objectively_analyzed_mean', 'aragonite_saturation_state_objectively_analyzed_mean', 'ph_observation_count_at_grid_cell', 'aragonite_observation_count_at_grid_cell', 'ph_scale', 'aragonite_unit', 'grid_resolution', 'analysis_method', 'source_locator', 'ph_data_locator', 'aragonite_data_locator']
  },
  {
    file: 'public/unsd-material-pressure-snapshot.json',
    job: 'fetch_unsd_unep_material_pressure',
    required: ['record_id', 'metric_id', 'indicator', 'series', 'series_description', 'accounting_boundary', 'normalization', 'geo_area_code', 'geo_area_name', 'observation_year', 'raw_material_code', 'raw_material_name', 'value', 'unit_code', 'nature', 'observation_status', 'source_statement', 'source_locator']
  },
  {
    file: 'public/power-monsoon-snapshot.json',
    job: 'fetch_power_indian_monsoon_rainfall',
    required: ['record_id', 'metric_id', 'geography', 'observation_year', 'reference_location_count', 'complete_reference_locations', 'rainfall_gate_threshold_mm_day', 'rainfall_gate_panel_fraction', 'rainfall_gate_locations_required', 'rainfall_gate_consecutive_days', 'rainfall_gate_date', 'rainfall_gate_day_of_year', 'baseline_period', 'baseline_valid_onset_years', 'baseline_mean_rainfall_gate_day_of_year', 'onset_anomaly_days', 'onset_anomaly_direction', 'seasonal_window', 'seasonal_panel_mean_rainfall_mm', 'baseline_mean_seasonal_panel_rainfall_mm', 'seasonal_rainfall_anomaly_mm', 'seasonal_rainfall_anomaly_pct', 'seasonal_rainfall_standardized_anomaly', 'source_locator']
  },
  {
    file: 'public/owid-clean-electricity-snapshot.json',
    job: 'fetch_owid_ember_clean_electricity',
    required: ['record_id', 'metric_id', 'measurement_role', 'country_code', 'country_name', 'observation_year', 'low_carbon_generation_gwh', 'low_carbon_generation_source_twh', 'low_carbon_generation_share_pct', 'total_electricity_generation_gwh', 'source_unit_generation', 'output_unit_generation', 'share_unit', 'low_carbon_boundary', 'uncertainty_status', 'source_locator']
  },
  {
    file: 'public/edgar-snapshot.json',
    job: 'fetch_edgar_2025_sector_country_ghg',
    required: ['record_id', 'metric_id', 'measurement_role', 'country_code', 'country_name', 'category_code', 'category_name', 'observation_year', 'emission_gg_substance', 'source_unit', 'substance', 'fossil_bio', 'uncertainty_status', 'source_locator']
  },
  {
    file: 'public/fao-fish-stock-sustainability-snapshot.json',
    job: 'fetch_fao_sdg_14_4_1_fish_stock_status',
    required: ['record_id', 'indicator', 'series', 'geo_area_code', 'geo_area_name', 'observation_year', 'sustainable_stock_share_pct_source_reported', 'biologically_unsustainable_stock_share_pct_derived', 'derivation', 'unit', 'reporting_type', 'source_locator']
  },
  {
    file: 'public/eurostat-fish-landings-snapshot.json',
    job: 'fetch_eurostat_fish_landings_shortfall',
    required: ['record_id', 'metric_id', 'measurement_role', 'geography_code', 'geography_name', 'observation_year', 'baseline_period_start', 'baseline_period_end', 'baseline_observation_count', 'baseline_mean_landings_tonnes', 'landings_tonnes_source_reported', 'landings_anomaly_tonnes', 'landings_anomaly_pct', 'landings_shortfall_tonnes', 'landings_shortfall_pct', 'shortfall_observed', 'product_scope', 'presentation_scope', 'destination_scope', 'vessel_registration_scope', 'unit', 'source_locator']
  },
  {
    file: 'public/noaa-global-mean-sea-level-snapshot.json',
    job: 'fetch_noaa_global_mean_sea_level',
    required: ['record_id', 'decimal_year', 'calendar_year', 'geography', 'mean_sea_level_anomaly_mm', 'contributing_missions', 'contributing_mission_count', 'source_reported_trend_mm_per_year', 'glacial_isostatic_adjustment_applied', 'inverted_barometer_applied', 'source_locator']
  },
  {
    file: 'public/noaa-ibtracs-rapid-intensification-snapshot.json',
    job: 'fetch_noaa_ibtracs_rapid_intensification',
    required: ['record_id', 'sid', 'season', 'basin', 'storm_name', 'maximum_24h_wind_change_kt', 'rapid_intensification_threshold_kt_per_24h', 'rapid_intensification_observed', 'maximum_window_start_utc', 'maximum_window_end_utc', 'start_wind_kt', 'end_wind_kt', 'valid_exact_24h_windows', 'wind_basis', 'track_type', 'source_locator']
  },
  {
    file: 'public/noaa-ocean-heat-content-snapshot.json',
    job: 'fetch_noaa_global_ocean_heat_content',
    required: ['record_id', 'analysis_year', 'geography', 'depth_layer_m', 'ocean_heat_content_anomaly_zj', 'standard_error_zj', 'derived_lower_95_interval_zj', 'derived_upper_95_interval_zj', 'source_unit', 'output_unit', 'baseline', 'source_locator']
  },
  {
    file: 'public/imbie-snapshot.json',
    job: 'fetch_imbie_mass_balance_assessment',
    required: ['record_id', 'region', 'period_start', 'period_end', 'mass_balance_rate_gtyr', 'mass_balance_rate_lower_gtyr', 'mass_balance_rate_upper_gtyr', 'rate_basis', 'source_locator']
  },
  {
    file: 'public/eia-hourly-grid-snapshot.json',
    job: 'fetch_eia_hourly_grid_metrics',
    required: ['record_id', 'respondent_id', 'window_start_utc', 'window_end_utc', 'observed_demand_intervals', 'demand_completeness_pct', 'peak_demand_mwh_per_hour', 'gas_generation_share_pct']
  },
  {
    file: 'public/noaa-climate-indices-snapshot.json',
    job: 'fetch_noaa_climate_indices',
    required: ['record_id', 'node_id', 'metric_id', 'measurement_role', 'index_id', 'frequency', 'observation_period', 'observation_date', 'observation_month', 'observation_year', 'observation_month_number', 'index_value', 'unit', 'publisher', 'source_locator']
  },
  {
    file: 'public/noaa-florida-current-snapshot.json',
    job: 'fetch_noaa_florida_current_transport',
    minimumRecords: 7000,
    required: ['record_id', 'node_id', 'metric_id', 'measurement_role', 'observation_date', 'observation_year', 'section', 'transport_sverdrups', 'quality_flag', 'quality_flag_meaning', 'geomagnetic_correction', 'unit', 'source_locator']
  },
  {
    file: 'public/rapid-amoc-snapshot.json',
    job: 'fetch_rapid_amoc_26n_transport',
    minimumRecords: 230,
    required: ['record_id', 'node_id', 'metric_id', 'measurement_role', 'observation_period', 'observation_year', 'observation_month', 'section', 'mean_transport_sverdrups', 'minimum_transport_sverdrups', 'maximum_transport_sverdrups', 'valid_half_daily_observations', 'expected_half_daily_observations', 'coverage_fraction', 'complete_for_scoring', 'unit', 'source_variable', 'source_locator', 'source_doi']
  },
  {
    file: 'public/noaa-ratpac-snapshot.json',
    job: 'fetch_noaa_ratpac_temperature_metrics',
    required: ['record_id', 'metric_id', 'measurement_role', 'geography', 'source_product', 'source_locator']
  },
  {
    file: 'public/ghsl-country-urbanization-snapshot.json',
    job: 'fetch_ghsl_country_urbanization_metrics',
    required: ['record_id', 'iso3', 'country_name', 'start_epoch', 'end_epoch', 'built_up_surface_2015_km2', 'built_up_surface_2020_km2', 'built_up_surface_expansion_hectares_per_year', 'built_up_area_per_resident_2020_m2']
  },
  {
    file: 'public/gbif-occurrence-snapshot.json',
    job: 'fetch_gbif_occurrences',
    required: ['key', 'scientific_name', 'event_date', 'decimal_latitude', 'decimal_longitude']
  },
  {
    file: 'public/obis-occurrence-snapshot.json',
    job: 'fetch_obis_occurrences',
    required: ['id', 'scientific_name', 'event_date', 'decimal_latitude', 'decimal_longitude']
  },
  {
    file: 'public/usgs-water-snapshot.json',
    job: 'fetch_usgs_water_observations',
    required: ['feature_id', 'monitoring_location_id', 'time', 'value', 'unit']
  },
  {
    file: 'public/food-security-snapshot.json',
    job: 'fetch_food_insecurity_fies',
    required: ['record_id', 'geo_area_code', 'year', 'value_percent']
  },
  {
    file: 'public/disaster-displacement-snapshot.json',
    job: 'fetch_world_bank_idmc_disaster_displacement',
    required: ['record_id', 'country_code', 'country_name', 'observation_year', 'new_displacement_movements', 'unit', 'indicator_code', 'indicator_name', 'source_note', 'source_locator']
  },
  {
    file: 'public/faostat-agriculture-snapshot.json',
    job: 'fetch_faostat_agriculture_metrics',
    required: ['record_id', 'metric_id', 'component', 'area', 'item', 'element', 'year', 'unit', 'value', 'source_flag', 'source_locator']
  },
  {
    file: 'public/power-heat-hazard-snapshot.json',
    job: 'fetch_power_heat_hazard_metrics',
    required: ['record_id', 'location_id', 'location_name', 'latitude', 'longitude', 'observation_year', 'valid_wet_bulb_hours', 'hourly_completeness_pct', 'maximum_wet_bulb_c', 'wet_bulb_p95_c', 'valid_vpd_hours', 'vpd_hourly_completeness_pct', 'mean_vapour_pressure_deficit_kpa', 'vapour_pressure_deficit_p95_kpa', 'maximum_vapour_pressure_deficit_kpa', 'valid_column_water_vapour_days', 'column_water_vapour_daily_completeness_pct', 'baseline_mean_column_water_vapour_kg_m2', 'observation_mean_column_water_vapour_kg_m2', 'column_water_vapour_anomaly_kg_m2', 'column_water_vapour_anomaly_pct', 'temperature_threshold_c', 'precipitation_threshold_mm_day', 'baseline_mean_annual_maximum_precipitation_mm_day', 'observation_annual_maximum_precipitation_mm_day', 'observation_annual_maximum_precipitation_date', 'annual_maximum_precipitation_anomaly_mm_day', 'annual_maximum_precipitation_anomaly_pct', 'heavy_precipitation_days_ge_baseline_p95', 'valid_compound_hazard_days', 'daily_completeness_pct', 'compound_hot_heavy_precip_days', 'source_locator']
  },
  {
    file: 'public/noaa-coops-high-tide-flood-snapshot.json',
    job: 'fetch_noaa_coops_high_tide_flood_metrics',
    required: ['record_id', 'station_id', 'station_name', 'latitude', 'longitude', 'observation_year', 'datum', 'units', 'reported_days', 'valid_days', 'completeness_pct', 'minor_flood_days', 'moderate_flood_days', 'major_flood_days', 'maximum_daily_water_level_m', 'maximum_daily_water_level_date', 'source_locator']
  },
  {
    file: 'public/who-air-pollution-burden-snapshot.json',
    job: 'fetch_who_air_pollution_health_burden',
    required: ['record_id', 'indicator_code', 'indicator_name', 'country_code', 'country_name', 'who_region_code', 'who_region_name', 'observation_year', 'sex', 'cause_scope', 'attributable_death_rate_per_100000_age_standardized', 'lower_95_interval_per_100000', 'upper_95_interval_per_100000', 'source_display_value', 'source_updated_at', 'source_locator']
  },
  {
    file: 'public/noaa-coastal-hypoxia-snapshot.json',
    job: 'fetch_noaa_gulf_coastal_hypoxia',
    required: ['record_id', 'metric_id', 'measurement_role', 'geography', 'observation_year', 'survey_start_date_label', 'survey_end_date_label', 'source_reported_hypoxic_area_square_miles', 'converted_hypoxic_area_square_kilometres', 'dissolved_oxygen_threshold_mg_l', 'threshold_operator', 'source_reported_record_rank', 'source_reported_rank_direction', 'source_reported_record_length_years', 'source_locator']
  },
  {
    file: 'public/world-bank-fertilizer-price-snapshot.json',
    job: 'fetch_world_bank_fertilizer_price_index',
    required: ['record_id', 'metric_id', 'measurement_role', 'observation_month', 'observation_year', 'observation_month_number', 'fertilizer_price_index_2010_100', 'month_over_month_change_pct', 'three_month_change_pct', 'year_over_year_change_pct', 'index_base', 'price_basis', 'geography', 'source_locator']
  },
  {
    file: 'public/heat-health-snapshot.json',
    job: 'fetch_lancet_countdown_heat_health_metrics',
    required: ['record_id', 'metric_id', 'node_id', 'indicator_component', 'geography_type', 'geography_name', 'observation_year', 'value', 'unit', 'evidence_design', 'method_boundary', 'uncertainty_status', 'source_locator', 'source_table_locator', 'source_indicator']
  },
  {
    file: 'public/copernicus-drought-persistence-snapshot.json',
    job: 'fetch_copernicus_drought_persistence',
    required: ['record_id', 'location_id', 'location_name', 'requested_latitude', 'requested_longitude', 'grid_latitude', 'grid_longitude', 'observation_year', 'index', 'accumulation_months', 'drought_threshold_spi', 'valid_months', 'completeness_pct', 'drought_months', 'longest_consecutive_drought_months', 'cumulative_spi_deficit_below_threshold', 'minimum_spi6', 'minimum_spi6_month', 'monthly_values', 'source_locator']
  },
  {
    file: 'public/gwis-wildfire-regime-snapshot.json',
    job: 'fetch_gwis_wildfire_regime_metrics',
    required: ['record_id', 'country_code', 'country_name', 'observation_year', 'observation_non_cropland_burned_area_ha', 'observation_cropland_burned_area_ha', 'observation_all_landcover_burned_area_ha', 'baseline_period', 'baseline_mean_non_cropland_burned_area_ha', 'baseline_p05_non_cropland_burned_area_ha', 'baseline_p95_non_cropland_burned_area_ha', 'burned_area_anomaly_ha', 'burned_area_anomaly_pct', 'season_definition', 'observation_season_span_months', 'baseline_mean_season_span_months', 'season_span_anomaly_months', 'monthly_values', 'source_locator']
  },
  {
    file: 'public/epa-nrsa-freshwater-condition-snapshot.json',
    job: 'fetch_epa_nrsa_freshwater_condition',
    required: ['record_id', 'geography_type', 'geography_type_name', 'subpopulation_code', 'subpopulation_name', 'survey_period', 'indicator_code', 'indicator_name', 'poor_condition_river_stream_miles_pct', 'poor_condition_lower_95_interval_pct', 'poor_condition_upper_95_interval_pct', 'poor_condition_estimated_river_stream_miles', 'sampled_sites_with_poor_condition', 'assessed_river_stream_miles_pct', 'not_assessed_river_stream_miles_pct', 'change_from_2013_2014_percentage_points', 'change_lower_95_interval_percentage_points', 'change_upper_95_interval_percentage_points', 'change_statistically_significant_95pct', 'condition_categories', 'source_locator']
  },
  {
    file: 'public/eia-oe417-disruption-snapshot.json',
    job: 'fetch_eia_oe417_disruption_metrics',
    required: ['record_id', 'geography', 'observation_year', 'observed_months', 'complete_calendar_year', 'reporting_scope', 'reported_events', 'events_with_customers_affected', 'events_with_computable_customer_hours', 'customer_hour_event_coverage_pct', 'sum_reported_customers_affected_across_events', 'reported_customer_hours', 'median_event_duration_hours', 'maximum_event_duration_hours', 'maximum_customers_affected_single_event', 'events_missing_duration', 'source_locator']
  },
  {
    file: 'public/nutrient-pollution-snapshot.json',
    job: 'fetch_nutrient_pollution_samples',
    required: ['result_id', 'monitoring_location_id', 'sample_date', 'characteristic', 'parameter_code', 'unit']
  },
  {
    file: 'public/seagrass-support-snapshot.json',
    job: 'fetch_seagrass_support',
    required: ['id', 'scientific_name', 'event_date', 'decimal_latitude', 'decimal_longitude']
  },
  {
    file: 'public/urban-heat-island-snapshot.json',
    job: 'fetch_urban_heat_island_eea',
    required: ['feature_id', 'uhi_intensity_c', 'latitude', 'longitude']
  }
];
const failures = [];
const summaries = [];

for (const specification of snapshots) {
  let snapshot;
  try {
    snapshot = JSON.parse(await fs.readFile(path.resolve(specification.file), 'utf8'));
  } catch (error) {
    failures.push({ code: 'snapshot_unreadable', file: specification.file, detail: error.message });
    continue;
  }
  const records = snapshot.records || [];
  const recordCountMatches = snapshot.record_count === records.length;
  const unresolvedContracts = (snapshot.metric_contract_ids || [])
    .filter(metricId => !knownMetricIds.has(metricId));
  const sourceId = snapshot.source?.id || null;
  const ingestionJobId = snapshot.ingestion_job_id || null;
  const job = jobsById.get(ingestionJobId);
  const completeness = Object.fromEntries(specification.required.map(field => [
    field,
    records.length
      ? records.filter(record => record[field] !== null && record[field] !== undefined && record[field] !== '').length / records.length
      : 0
  ]));
  const duplicateIds = records.length - new Set(
    records.map(record => record.key || record.id || record.feature_id || record.record_id || record.result_id)
  ).size;

  if (!records.length) failures.push({ code: 'snapshot_empty', file: specification.file });
  if (specification.minimumRecords && records.length < specification.minimumRecords) {
    failures.push({ code: 'snapshot_below_minimum_records', file: specification.file, expected: specification.minimumRecords, observed: records.length });
  }
  if (!recordCountMatches) failures.push({ code: 'snapshot_count_mismatch', file: specification.file });
  if (unresolvedContracts.length) {
    failures.push({ code: 'snapshot_contract_unresolved', file: specification.file, unresolvedContracts });
  }
  if (!sourceId || !knownSourceIds.has(sourceId)) {
    failures.push({
      code: 'snapshot_source_unregistered',
      file: specification.file,
      source_id: sourceId
    });
  }
  if (!job || ingestionJobId !== specification.job) {
    failures.push({ code: 'snapshot_ingestion_job_unresolved', file: specification.file, expected: specification.job, observed: ingestionJobId });
  } else {
    if (job.source_id !== sourceId) failures.push({ code: 'snapshot_job_source_mismatch', file: specification.file, expected: job.source_id, observed: sourceId });
    if (!specification.file.endsWith(job.snapshot_file)) failures.push({ code: 'snapshot_job_file_mismatch', file: specification.file, expected: job.snapshot_file });
    const snapshotContracts = new Set(snapshot.metric_contract_ids || []);
    for (const binding of job.contract_bindings || []) {
      if (!snapshotContracts.has(binding.metric_contract_id)) failures.push({ code: 'snapshot_job_binding_missing', file: specification.file, binding });
    }
    for (const field of ['cadence', 'provenance', 'uncertainty', 'failure_behavior']) {
      if (!snapshot[field] || !String(snapshot[field]).trim()) failures.push({ code: 'snapshot_contract_metadata_missing', file: specification.file, field });
    }
  }
  if (duplicateIds > 0) {
    failures.push({ code: 'snapshot_duplicate_record_ids', file: specification.file, duplicateIds });
  }
  if (specification.file === 'public/edgar-snapshot.json') {
    const substances = new Set(records.map(record => record.substance));
    const methaneTotals = records.filter(record => record.metric_id === 'anthropogenic_methane_emissions');
    const nitrousOxideTotals = records.filter(record => record.metric_id === 'anthropogenic_nitrous_oxide_emissions');
    if (!substances.has('CO2') || !substances.has('CH4') || !substances.has('N2O')) {
      failures.push({ code: 'edgar_required_substance_missing', file: specification.file, observed: [...substances] });
    }
    if (!methaneTotals.length || methaneTotals.some(record => !Number.isFinite(record.emission_mt_ch4))) {
      failures.push({ code: 'edgar_methane_total_missing_or_invalid', file: specification.file, records: methaneTotals.length });
    }
    if (!nitrousOxideTotals.length || nitrousOxideTotals.some(record => !Number.isFinite(record.emission_mt_n2o))) {
      failures.push({ code: 'edgar_nitrous_oxide_total_missing_or_invalid', file: specification.file, records: nitrousOxideTotals.length });
    }
  }
  if (specification.file === 'public/fra-snapshot.json') {
    const currentGross = records.find(record => record.measurement_role === 'source_reported_gross_deforestation_rate_current_period');
    const historicalGross = records.find(record => record.measurement_role === 'source_reported_gross_deforestation_rate_historical_comparator');
    const currentNet = records.find(record => record.measurement_role === 'source_reported_net_forest_area_loss_context');
    const derived = snapshot.derived_metrics?.fao_fra_forest_conversion_rate;
    if (
      !currentGross
      || !historicalGross
      || !currentNet
      || ![currentGross, historicalGross, currentNet].every(record => (
        Number.isFinite(record.value_million_hectares_per_year)
        && record.value_million_hectares_per_year > 0
        && record.unit === 'million hectares per year'
      ))
      || currentNet.value_million_hectares_per_year >= currentGross.value_million_hectares_per_year
      || !Number.isFinite(derived?.derived_change_pct)
      || derived.derived_change_pct >= 0
    ) {
      failures.push({
        code: 'fao_fra_global_deforestation_measurement_invalid',
        file: specification.file
      });
    }
  }
  if (specification.file === 'public/noaa-climate-indices-snapshot.json') {
    const freshness = snapshot.source_summary?.freshness_by_index || {};
    for (const indexId of ['pdo', 'pna', 'nao', 'ao', 'romi', 'aao', 'qbo', 'amo']) {
      const state = freshness[indexId];
      if (!state || !state.latest_observation_period || !Number.isFinite(state.age_days_at_capture) || !Number.isFinite(state.maximum_age_days)) {
        failures.push({ code: 'noaa_climate_index_freshness_metadata_missing', file: specification.file, index_id: indexId });
        continue;
      }
      if (indexId !== 'pdo' && state.age_days_at_capture > state.maximum_age_days) {
        failures.push({ code: 'noaa_daily_climate_index_stale', file: specification.file, index_id: indexId, age_days: state.age_days_at_capture, maximum_age_days: state.maximum_age_days });
      }
    }
  }
  if (specification.file === 'public/noaa-florida-current-snapshot.json') {
    const summary = snapshot.source_summary || {};
    const annual = summary.annual_means || [];
    if (
      summary.latest_complete_year !== new Date().getUTCFullYear() - 1
      || annual.length < 20
      || annual.some(point => point.valid_daily_observations < 300 || !Number.isFinite(point.mean_transport_sverdrups))
    ) {
      failures.push({ code: 'noaa_florida_current_complete_year_invalid', file: specification.file, observed: summary });
    }
  }
  if (specification.file === 'public/rapid-amoc-snapshot.json') {
    const summary = snapshot.source_summary || {};
    const complete = records.filter(record => record.complete_for_scoring);
    const partial = records.filter(record => !record.complete_for_scoring);
    if (
      complete.length < 60
      || summary.complete_monthly_observations !== complete.length
      || summary.latest_complete_month !== complete.at(-1)?.observation_period
      || !/^[a-f0-9]{64}$/.test(summary.source_sha256 || '')
      || complete.some(record => record.coverage_fraction < 0.8 || !Number.isFinite(record.mean_transport_sverdrups))
      || partial.some(record => record.complete_for_scoring || !Number.isFinite(record.coverage_fraction))
      || records.some(record => record.mean_transport_sverdrups === 0 && record.valid_half_daily_observations === 0)
    ) {
      failures.push({ code: 'rapid_amoc_monthly_observation_contract_invalid', file: specification.file, observed: summary });
    }
  }
  if (specification.file === 'public/world-bank-global-air-quality-snapshot.json') {
    const summary = snapshot.source_summary || {};
    const years = records.map(record => record.observation_year);
    if (
      records.length < 20
      || summary.complete_annual_observations !== records.length
      || summary.latest_complete_year !== records.at(-1)?.observation_year
      || summary.indicator_id !== 'EN.ATM.PM25.MC.M3'
      || records.some((record, index) => (
        record.geography_code !== 'WLD'
        || record.source_indicator_id !== 'EN.ATM.PM25.MC.M3'
        || !Number.isFinite(record.mean_annual_pm2_5_exposure_ug_m3)
        || record.mean_annual_pm2_5_exposure_ug_m3 <= 0
        || (index > 0 && record.observation_year !== years[index - 1] + 1)
      ))
    ) {
      failures.push({ code: 'world_bank_global_pm2_5_annual_contract_invalid', file: specification.file, observed: summary });
    }
  }
  if (specification.file === 'public/nasa-ceres-global-cloud-radiative-effect-snapshot.json') {
    const summary = snapshot.source_summary || {};
    const completeYearCounts = new Map();
    for (const record of records) completeYearCounts.set(record.observation_year, (completeYearCounts.get(record.observation_year) || 0) + 1);
    const completeYears = [...completeYearCounts.values()].filter(count => count === 12).length;
    const sequential = records.every((record, index) => {
      if (index === 0) return true;
      const previous = records[index - 1];
      const previousDate = new Date(`${previous.observation_period}-01T00:00:00Z`);
      previousDate.setUTCMonth(previousDate.getUTCMonth() + 1);
      return record.observation_period === previousDate.toISOString().slice(0, 7);
    });
    if (
      summary.product_id !== 'EBAFTOA421'
      || summary.product_version !== 'CERES_EBAF-TOA_Ed4.2.1'
      || summary.monthly_observations !== records.length
      || summary.latest_observation_period !== records.at(-1)?.observation_period
      || summary.complete_calendar_year_count !== completeYears
      || completeYears < 20
      || !sequential
      || records.some(record => (
        record.node_id !== 'cloud_albedo_shift'
        || record.metric_id !== 'satellite_cloud_radiative_effect_change'
        || record.geography !== 'Global mean'
        || record.source_variables?.all_sky !== 'gtoa_sw_all_mon'
        || record.source_variables?.clear_sky_cloud_free_region !== 'gtoa_sw_clr_c_mon'
        || !Number.isFinite(record.toa_shortwave_all_sky_flux_w_m2)
        || !Number.isFinite(record.toa_shortwave_clear_sky_flux_w_m2)
        || !Number.isFinite(record.toa_shortwave_cloud_radiative_effect_w_m2)
        || record.toa_shortwave_cloud_radiative_effect_w_m2 >= 0
        || Math.abs(record.toa_shortwave_clear_sky_flux_w_m2 - record.toa_shortwave_all_sky_flux_w_m2 - record.toa_shortwave_cloud_radiative_effect_w_m2) > 0.00001
      ))
    ) {
      failures.push({ code: 'nasa_ceres_global_shortwave_cloud_radiative_effect_contract_invalid', file: specification.file, observed: summary });
    }
  }
  if (specification.file === 'public/noaa-ratpac-snapshot.json') {
    const summary = snapshot.source_summary || {};
    const expectedLatestYear = new Date().getUTCFullYear() - 1;
    if (
      summary.latest_complete_year !== expectedLatestYear
      || summary.global_pressure_level_records < 800
      || summary.global_annual_troposphere_records < 60
    ) {
      failures.push({
        code: 'noaa_ratpac_complete_record_invalid',
        file: specification.file,
        expected_latest_year: expectedLatestYear,
        observed: summary
      });
    }
  }
  if (specification.file === 'public/faostat-agriculture-snapshot.json') {
    const cropYield = snapshot.derived_metrics?.crop_yield_interannual_variability;
    const demand = snapshot.derived_metrics?.apparent_agricultural_commodity_demand;
    const importDependency = snapshot.derived_metrics?.food_import_dependency_ratio;
    const importRecords = records.filter(record => record.metric_id === 'food_import_dependency_ratio');
    if (
      !Array.isArray(cropYield)
      || cropYield.length < 3
      || cropYield.some(record => (
        !record.item
        || record.observations < 8
        || !Number.isFinite(record.detrended_residual_cv_pct)
        || !Number.isFinite(record.latest_anomaly_from_trend_pct)
      ))
    ) {
      failures.push({
        code: 'faostat_crop_yield_derivation_invalid',
        file: specification.file
      });
    }
    if (
      !Array.isArray(demand)
      || demand.length < 3
      || demand.some(record => (
        !record.item
        || record.observations < 8
        || !Number.isFinite(record.latest_apparent_demand_tonnes)
        || !Number.isFinite(record.change_since_start_pct)
      ))
    ) {
      failures.push({
        code: 'faostat_apparent_demand_derivation_invalid',
        file: specification.file
      });
    }
    if (
      !importDependency
      || importDependency.records !== importRecords.length
      || importDependency.geographies < 200
      || importRecords.length < 5000
      || importRecords.some(record => (
        !Number.isFinite(record.food_import_dependency_ratio_pct)
        || !Number.isFinite(record.imports_tonnes)
        || !Number.isFinite(record.exports_tonnes)
        || !Number.isFinite(record.domestic_supply_tonnes)
        || !record.calculation_boundary
      ))
    ) {
      failures.push({
        code: 'faostat_import_dependency_derivation_invalid',
        file: specification.file,
        records: importRecords.length,
        geographies: importDependency?.geographies || 0
      });
    }
  }
  for (const [field, rate] of Object.entries(completeness)) {
    if (rate < 0.95) {
      failures.push({
        code: 'snapshot_required_field_below_95pct',
        file: specification.file,
        field,
        observed_pct: Number((rate * 100).toFixed(1))
      });
    }
  }
  summaries.push({
    file: specification.file,
    source_id: sourceId,
    ingestion_job_id: ingestionJobId,
    captured_at: snapshot.captured_at || null,
    records: records.length,
    metric_contracts: snapshot.metric_contract_ids || [],
    duplicate_ids: duplicateIds,
    required_field_completeness_pct: Object.fromEntries(
      Object.entries(completeness).map(([field, rate]) => [field, Number((rate * 100).toFixed(1))])
    )
  });
}

const result = {
  ok: failures.length === 0,
  generated_at: new Date().toISOString(),
  snapshots: summaries,
  failures
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
