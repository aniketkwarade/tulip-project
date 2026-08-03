import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const auditPath = path.join(ROOT, 'tulip-source-intake-audit-2026-07-14.md');
const publicDir = path.join(ROOT, 'public');
const registryPath = path.join(publicDir, 'tulip-source-registry.json');
const operationalPath = path.join(publicDir, 'tulip-operational-sources.json');

const ACTIVE_PLATFORM_INTEGRATIONS = {
  unesco_fao_global_groundwater_irrigation_impact: {
    route: 'https://www.unesco.org/reports/wwdr/2022/en',
    public_file: 'unesco-fao-global-groundwater-irrigation-impact-snapshot.json',
    artifact_kind: 'reviewed_global_groundwater_depletion_sector_dependence_irrigation_loss_and_extent_snapshot',
    served_metric_ids: ['groundwater_storage_and_withdrawal_imbalance', 'agricultural_groundwater_withdrawal_aquifer_balance', 'municipal_groundwater_withdrawal_aquifer_balance', 'irrigation_conveyance_and_application_efficiency'],
    measurement_ready_metric_ids: ['groundwater_storage_and_withdrawal_imbalance', 'agricultural_groundwater_withdrawal_aquifer_balance', 'municipal_groundwater_withdrawal_aquifer_balance', 'irrigation_conveyance_and_application_efficiency']
  },
  fao_global_soil_salinity_impact: {
    route: 'https://www.fao.org/newsroom/detail/fao-launches-first-major-global-assessment-of-salt-affected-soils-in-50-years/',
    public_file: 'fao-global-soil-salinity-impact-snapshot.json',
    artifact_kind: 'reviewed_global_salt_affected_area_crop_loss_annual_land_loss_and_extent_snapshot',
    served_metric_ids: ['root_zone_soil_electrical_conductivity_and_salt_affected_area'],
    measurement_ready_metric_ids: ['root_zone_soil_electrical_conductivity_and_salt_affected_area']
  },
  unep_global_nutrient_pollution_impact: {
    route: 'https://www.unep.org/facts-about-nitrogen-pollution',
    public_file: 'unep-global-nutrient-pollution-impact-snapshot.json',
    artifact_kind: 'reviewed_global_reactive_nitrogen_eutrophication_dead_zone_and_fisheries_exposure_snapshot',
    served_metric_ids: ['surface_water_total_nutrient_concentration', 'riverine_dissolved_inorganic_nitrogen_load', 'estuary_nutrient_eutrophication_condition', 'coastal_dissolved_oxygen', 'continental_shelf_bottom_water_hypoxia'],
    measurement_ready_metric_ids: ['surface_water_total_nutrient_concentration', 'riverine_dissolved_inorganic_nitrogen_load', 'estuary_nutrient_eutrophication_condition', 'coastal_dissolved_oxygen', 'continental_shelf_bottom_water_hypoxia']
  },
  fao_unccd_global_dryland_degradation_impact: {
    route: 'https://www.fao.org/4/y5738e/y5738e06.htm',
    public_file: 'fao-unccd-global-dryland-degradation-impact-snapshot.json',
    artifact_kind: 'reviewed_global_accumulated_desertification_area_human_burden_and_extent_snapshot',
    served_metric_ids: ['dryland_land_degradation_extent_and_condition'],
    measurement_ready_metric_ids: ['dryland_land_degradation_extent_and_condition']
  },
  nasa_ceres_ebaf_toa_ed4_2_1_global_monthly: {
    route: 'https://ceres-tool.larc.nasa.gov/ord-tool/jsp/EBAFTOA421Selection.jsp',
    public_file: 'nasa-ceres-global-cloud-radiative-effect-snapshot.json',
    artifact_kind: 'official_global_monthly_top_of_atmosphere_shortwave_cloud_radiative_effect_snapshot',
    served_metric_ids: ['satellite_cloud_radiative_effect_change'],
    measurement_ready_metric_ids: ['satellite_cloud_radiative_effect_change']
  },
  world_bank_wdi_global_pm2_5_exposure: {
    route: 'https://api.worldbank.org/v2/country/WLD/indicator/EN.ATM.PM25.MC.M3?format=json&per_page=100',
    public_file: 'world-bank-global-air-quality-snapshot.json',
    artifact_kind: 'official_world_population_weighted_annual_pm2_5_exposure_snapshot',
    served_metric_ids: ['ambient_pm25_concentration'],
    measurement_ready_metric_ids: ['ambient_pm25_concentration']
  },
  rapid_amoc_26n_transport_time_series: {
    route: 'https://rapid.ac.uk/data/integrated-transports',
    public_file: 'rapid-amoc-snapshot.json',
    artifact_kind: 'checksum_bound_full_basin_width_26_5n_amoc_monthly_transport_snapshot',
    served_metric_ids: ['amoc_overturning_transport'],
    measurement_ready_metric_ids: ['amoc_overturning_transport']
  },
  noaa_florida_current_transport_time_series_data_products: {
    route: 'https://www.aoml.noaa.gov/phod/floridacurrent/data_access.php',
    public_file: 'noaa-florida-current-snapshot.json',
    artifact_kind: 'official_daily_florida_straits_27n_transport_snapshot',
    served_metric_ids: ['gulf_stream_section_transport_and_path_position'],
    measurement_ready_metric_ids: ['gulf_stream_section_transport_and_path_position']
  },
  faostat_world_cereal_feed_share: {
    route: 'https://www.fao.org/faostat/en/#data/FBS',
    public_file: 'fao-world-cereal-feed-share-snapshot.json',
    artifact_kind: 'checksum_bound_world_cereal_feed_mass_and_supply_share_snapshot',
    served_metric_ids: ['livestock_feed_crop_use_share'],
    measurement_ready_metric_ids: ['livestock_feed_crop_use_share']
  },
  faostat_cereal_import_dependency_and_population_2026: {
    route: 'https://www.fao.org/faostat/en/#data/FS',
    public_file: 'fao-food-import-exposure-snapshot.json',
    artifact_kind: 'checksum_bound_population_weighted_country_cereal_import_dependency_snapshot',
    served_metric_ids: ['food_import_dependency_ratio'],
    measurement_ready_metric_ids: ['food_import_dependency_ratio']
  },
  faostat_fertilizer_product_output_2026: {
    route: 'https://www.fao.org/faostat/en/#data/RFB',
    public_file: 'fao-fertilizer-product-output-snapshot.json',
    artifact_kind: 'checksum_bound_global_annual_fertilizer_product_class_output_snapshot',
    served_metric_ids: ['fertilizer_product_output'],
    measurement_ready_metric_ids: ['fertilizer_product_output']
  },
  ipcc_ar6_global_aerosol_erf_time_series: {
    route: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
    public_file: 'ipcc-aerosol-cooling-loss-snapshot.json',
    artifact_kind: 'checksum_bound_global_annual_assessment_constrained_aerosol_erf_snapshot',
    served_metric_ids: ['anthropogenic_aerosol_effective_radiative_forcing'],
    measurement_ready_metric_ids: ['anthropogenic_aerosol_effective_radiative_forcing']
  },
  global_ocean_stratification_observation_assessment: {
    route: 'https://www.nature.com/articles/s41558-020-00918-2',
    public_file: 'global-ocean-stratification-snapshot.json',
    artifact_kind: 'checksum_bound_global_annual_ocean_density_stratification_snapshot',
    served_metric_ids: ['upper_ocean_density_stratification'],
    measurement_ready_metric_ids: ['upper_ocean_density_stratification']
  },
  fao_global_topsoil_erosion_burden: {
    route: 'https://www.fao.org/newsroom/detail/Global-Soil-Partnership-endorses-guidelines-on-sustainable-soil-management/en',
    public_file: 'fao-global-topsoil-erosion-impact-snapshot.json',
    artifact_kind: 'reviewed_global_annual_arable_soil_loss_and_production_burden_snapshot',
    served_metric_ids: ['soil_erosion_rate'],
    measurement_ready_metric_ids: ['soil_erosion_rate']
  },
  global_flood_exposure_observation_and_poverty_studies: {
    route: 'https://www.nature.com/articles/s41586-021-03695-w',
    public_file: 'global-flood-exposure-impact-snapshot.json',
    artifact_kind: 'reviewed_global_observed_inundation_and_floodplain_population_exposure_snapshot',
    served_metric_ids: ['population_and_assets_in_floodplain'],
    measurement_ready_metric_ids: ['population_and_assets_in_floodplain']
  },
  undrr_disaster_risk_reduction_in_least_developed_countries: {
    route: 'https://www.undrr.org/implementing-sendai-framework/sendai-framework-action/disaster-risk-reduction-least-developed-countries',
    public_file: 'undrr-ldc-disaster-inequality-snapshot.json',
    artifact_kind: 'reviewed_cross_income_disaster_mortality_and_relative_loss_snapshot',
    served_metric_ids: ['openfema_geographic_ihp_assistance_gap'],
    measurement_ready_metric_ids: ['openfema_geographic_ihp_assistance_gap']
  },
  fao_fishstat_global_marine_capture_2026: {
    route: 'https://www.fao.org/fishery/static/FishStatJ/FAO_FI_Global_Production_2026.1.0.fws',
    public_file: 'fao-fishstat-marine-capture-snapshot.json',
    artifact_kind: 'checksum_bound_global_annual_marine_capture_production_snapshot',
    served_metric_ids: ['marine_fish_landings_shortfall'],
    measurement_ready_metric_ids: ['marine_fish_landings_shortfall']
  },
  global_in_situ_groundwater_level_trends_study: {
    route: 'https://www.nature.com/articles/s41586-023-06879-8',
    public_file: 'global-groundwater-level-trends-snapshot.json',
    artifact_kind: 'reviewed_global_in_situ_aquifer_level_trend_snapshot',
    served_metric_ids: ['usgs_groundwater_level_observation'],
    measurement_ready_metric_ids: ['usgs_groundwater_level_observation']
  },
  global_pollinator_deficits_and_health_burden_study: {
    route: 'https://pubmed.ncbi.nlm.nih.gov/36515549/',
    public_file: 'pollinator-service-impact-snapshot.json',
    artifact_kind: 'reviewed_global_pollination_deficit_crop_and_health_burden_snapshot',
    served_metric_ids: ['crop_pollination_service_deficit'],
    measurement_ready_metric_ids: ['crop_pollination_service_deficit']
  },
  undrr_sendai_midterm_critical_infrastructure_impacts: {
    route: 'https://www.undrr.org/publication/report-midterm-review-implementation-sendai-framework-disaster-risk-reduction-2015-2030',
    public_file: 'undrr-critical-infrastructure-impact-snapshot.json',
    artifact_kind: 'reviewed_multi_country_critical_infrastructure_damage_and_service_disruption_snapshot',
    served_metric_ids: ['eia_oe417_reported_customer_interruption_burden'],
    measurement_ready_metric_ids: ['eia_oe417_reported_customer_interruption_burden']
  },
  wmo_unep_global_coastal_inundation_assessments: {
    route: 'https://public.wmo.int/sites/default/files/2025-11/State%20of%20the%20Climate%202025%20Update%20COP30%20%2831%20oct%29.pdf',
    public_file: 'wmo-unep-coastal-inundation-impact-snapshot.json',
    artifact_kind: 'reviewed_global_sea_level_acceleration_and_coastal_exposure_snapshot',
    served_metric_ids: ['storm_surge_threshold_exposure'],
    measurement_ready_metric_ids: ['storm_surge_threshold_exposure']
  },
  ioc_unesco_global_ocean_oxygen_network: {
    route: 'https://www.ioc.unesco.org/en/go2ne',
    public_file: 'ioc-global-ocean-oxygen-impact-snapshot.json',
    artifact_kind: 'reviewed_global_open_ocean_deoxygenation_and_coastal_hypoxia_extent_snapshot',
    served_metric_ids: ['noaa_gulf_midsummer_hypoxic_zone_area', 'dissolved_oxygen_inventory_and_deficit'],
    measurement_ready_metric_ids: ['noaa_gulf_midsummer_hypoxic_zone_area', 'dissolved_oxygen_inventory_and_deficit']
  },
  ramsar_global_wetland_outlook_2025: {
    route: 'https://www.global-wetland-outlook.ramsar.org/',
    public_file: 'ramsar-global-wetland-impact-snapshot.json',
    artifact_kind: 'reviewed_global_wetland_loss_degradation_and_service_loss_snapshot',
    served_metric_ids: ['wetland_area_drained_or_converted'],
    measurement_ready_metric_ids: ['wetland_area_drained_or_converted']
  },
  undrr_gar_2025_global_drought_impacts: {
    route: 'https://www.undrr.org/gar/gar2025/hazard-exploration/droughts',
    public_file: 'undrr-global-drought-impact-snapshot.json',
    artifact_kind: 'reviewed_global_accumulated_drought_impact_snapshot',
    served_metric_ids: ['drought_event_duration_spi6'],
    measurement_ready_metric_ids: ['drought_event_duration_spi6']
  },
  wmo_unesco_global_glacier_water_assessments: {
    route: 'https://wmo.int/resources/publication-series/state-of-global-water-resources/state-of-global-water-resources-2024',
    public_file: 'wmo-unesco-glacier-water-impact-snapshot.json',
    artifact_kind: 'reviewed_global_glacier_mass_and_meltwater_dependence_snapshot',
    served_metric_ids: ['glacier_runoff_share_of_water_supply'],
    measurement_ready_metric_ids: ['glacier_runoff_share_of_water_supply']
  },
  copernicus_marine_global_ocean_ph: {
    route: 'https://data.marine.copernicus.eu/product/GLOBAL_OMI_HEALTH_carbon_ph_area_averaged/services',
    public_file: 'copernicus-global-ocean-ph-snapshot.json',
    artifact_kind: 'checksum_bound_global_annual_surface_ocean_ph_snapshot',
    served_metric_ids: ['surface_ocean_ph_and_aragonite_state'],
    measurement_ready_metric_ids: ['surface_ocean_ph_and_aragonite_state']
  },
  unctad_review_of_maritime_transport_2024: {
    route: 'https://unctad.org/publication/review-maritime-transport-2025',
    public_file: 'unctad-maritime-bottleneck-impact-snapshot.json',
    artifact_kind: 'reviewed_global_maritime_bottleneck_impact_snapshot',
    served_metric_ids: ['port_dwell_time_and_queue', 'seaborne_trade_and_ship_fuel_use', 'shipping_route_delay_and_diversion'],
    measurement_ready_metric_ids: ['port_dwell_time_and_queue', 'seaborne_trade_and_ship_fuel_use', 'shipping_route_delay_and_diversion']
  },
  who_global_cholera_emergency_updates: {
    route: 'https://www.who.int/emergencies/situations/cholera-upsurge/',
    public_file: 'who-cholera-emergency-snapshot.json',
    artifact_kind: 'reviewed_global_cholera_awd_emergency_comparison_snapshot',
    served_metric_ids: ['waterborne_outbreak_signal'],
    measurement_ready_metric_ids: ['waterborne_outbreak_signal']
  },
  unep_un_water_progress_on_water_related_ecosystems_2024: {
    route: 'https://www.unwater.org/publications/progress-water-related-ecosystems-2024-update',
    public_file: 'unep-unwater-freshwater-impact-snapshot.json',
    artifact_kind: 'reviewed_global_freshwater_ecosystem_river_flow_and_surface_water_impact_snapshot',
    served_metric_ids: ['epa_nrsa_poor_biological_condition', 'usgs_daily_discharge_regime', 'surface_water_inflow_deficit', 'surface_water_storage_instability'],
    measurement_ready_metric_ids: ['epa_nrsa_poor_biological_condition', 'usgs_daily_discharge_regime', 'surface_water_inflow_deficit', 'surface_water_storage_instability']
  },
  ipbes_global_biodiversity_and_invasive_species_assessments: {
    route: 'https://ict.ipbes.net/ipbes-ict-guide/data-and-knowledge-management/citations-of-ipbes-assessments',
    public_file: 'ipbes-biodiversity-invasive-impact-snapshot.json',
    artifact_kind: 'reviewed_global_biodiversity_and_invasive_species_impact_snapshot',
    served_metric_ids: ['gbif_species_occurrence_coverage', 'gbif_non_native_occurrence_expansion'],
    measurement_ready_metric_ids: ['gbif_species_occurrence_coverage', 'gbif_non_native_occurrence_expansion']
  },
  who_global_air_pollution_data_portal: {
    route: 'https://www.who.int/data/gho/data/themes/air-pollution',
    public_file: 'who-air-pollution-impact-snapshot.json',
    artifact_kind: 'reviewed_global_air_pollution_exposure_and_health_impact_snapshot',
    served_metric_ids: ['air_pollution_attributable_health_burden', 'air_quality_standard_exceedance_days'],
    measurement_ready_metric_ids: ['air_pollution_attributable_health_burden', 'air_quality_standard_exceedance_days']
  },
  unep_blue_ecosystems_global_assessments: {
    route: 'https://www.unep.org/topics/ocean-seas-and-coasts/blue-ecosystems',
    public_file: 'unep-blue-ecosystems-impact-snapshot.json',
    artifact_kind: 'reviewed_global_mangrove_and_seagrass_impact_snapshot',
    served_metric_ids: ['mangrove_extent_and_shoreline_buffer_change', 'seagrass_meadow_area_change', 'coastal_blue_carbon_habitat_area_and_stock_loss', 'estuarine_nursery_habitat_extent_and_recruitment', 'tidal_wetland_net_greenhouse_gas_balance'],
    measurement_ready_metric_ids: ['mangrove_extent_and_shoreline_buffer_change', 'seagrass_meadow_area_change', 'coastal_blue_carbon_habitat_area_and_stock_loss', 'estuarine_nursery_habitat_extent_and_recruitment', 'tidal_wetland_net_greenhouse_gas_balance']
  },
  nasa_ozone_watch: {
    route: 'https://ozonewatch.gsfc.nasa.gov/statistics/annual_data.txt',
    public_file: 'nasa-ozone-watch-annual-snapshot.json',
    artifact_kind: 'contract_bound_antarctic_ozone_hole_annual_history',
    served_metric_ids: ['stratospheric_ozone_column_depletion_and_recovery'],
    measurement_ready_metric_ids: ['stratospheric_ozone_column_depletion_and_recovery']
  },
  iea_global_critical_minerals_outlook_2025: {
    route: 'https://www.iea.org/reports/global-critical-minerals-outlook-2025/executive-summary',
    public_file: 'iea-battery-supply-chain-impact-snapshot.json',
    artifact_kind: 'reviewed_global_battery_supply_chain_impact_snapshot',
    served_metric_ids: ['battery_demand_growth_and_supply_concentration'],
    measurement_ready_metric_ids: ['battery_demand_growth_and_supply_concentration']
  },
  fao_state_of_food_security_and_nutrition_2025: {
    route: 'https://www.fao.org/publications/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world/2025/en',
    public_file: 'fao-sofi-food-insecurity-impact-snapshot.json',
    artifact_kind: 'reviewed_global_food_insecurity_impact_assessment_snapshot',
    served_metric_ids: ['food_insecurity_prevalence_fies'],
    measurement_ready_metric_ids: ['food_insecurity_prevalence_fies']
  },
  world_bank_the_role_of_desalination_in_an_increasingly_water_scarce_world: {
    route: 'https://documents.worldbank.org/en/publication/documents-reports/documentdetail/476041552622967264',
    public_file: 'world-bank-desalination-impact-snapshot.json',
    artifact_kind: 'reviewed_global_desalination_dependence_snapshot',
    served_metric_ids: ['desalinated_water_share_of_supply'],
    measurement_ready_metric_ids: ['desalinated_water_share_of_supply']
  },
  iea_energy_and_ai: {
    route: 'https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai',
    public_file: 'iea-data-centre-impact-snapshot.json',
    artifact_kind: 'reviewed_global_data_centre_impact_snapshot',
    served_metric_ids: ['data_center_electricity_consumption'],
    measurement_ready_metric_ids: ['data_center_electricity_consumption']
  },
  fao_the_state_of_world_fisheries_and_aquaculture_2024: {
    route: 'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en',
    public_file: 'fao-fishery-protein-impact-snapshot.json',
    artifact_kind: 'reviewed_global_fishery_protein_dependence_snapshot',
    served_metric_ids: ['aquatic_food_share_of_animal_protein'],
    measurement_ready_metric_ids: ['aquatic_food_share_of_animal_protein']
  },
  unep_global_cooling_watch_2025: {
    route: 'https://www.unep.org/resources/global-cooling-watch-2025',
    public_file: 'unep-cooling-equity-impact-snapshot.json',
    artifact_kind: 'reviewed_global_cooling_equity_impact_snapshot',
    served_metric_ids: ['heat_exposure_without_safe_affordable_cooling', 'cooling_system_capacity_emissions_and_refrigerant_transition'],
    measurement_ready_metric_ids: ['heat_exposure_without_safe_affordable_cooling', 'cooling_system_capacity_emissions_and_refrigerant_transition']
  },
  unece_progress_on_transboundary_water_cooperation_sdg_6_5_2: {
    route: 'https://unece.org/info/Environment-Policy/pub/395013',
    public_file: 'unece-transboundary-water-cooperation-impact-snapshot.json',
    artifact_kind: 'reviewed_global_transboundary_water_cooperation_snapshot',
    served_metric_ids: ['transboundary_water_cooperation_coverage_gap'],
    measurement_ready_metric_ids: ['transboundary_water_cooperation_coverage_gap']
  },
  icao_environmental_reports: {
    route: 'https://www.icao.int/about-icao/AnnualReport2024/world-air-transport-2024',
    public_file: 'icao-global-aviation-impact-snapshot.json',
    artifact_kind: 'reviewed_global_aviation_activity_snapshot',
    served_metric_ids: ['aviation_revenue_activity_and_fuel', 'aviation_activity_growth'],
    measurement_ready_metric_ids: ['aviation_revenue_activity_and_fuel', 'aviation_activity_growth']
  },
  iea_global_industry_transition_assessments: {
    route: 'https://www.iea.org/reports/breakthrough-agenda-report-2025',
    public_file: 'iea-global-industry-transition-impact-snapshot.json',
    artifact_kind: 'reviewed_global_industry_transition_snapshot',
    served_metric_ids: ['steel_conventional_route_and_near_zero_gap', 'cement_near_zero_transition_gap', 'industrial_renewable_heat_share_gap'],
    measurement_ready_metric_ids: ['steel_conventional_route_and_near_zero_gap', 'cement_near_zero_transition_gap', 'industrial_renewable_heat_share_gap']
  },
  iea_global_critical_minerals_outlook_2025: {
    route: 'https://www.iea.org/reports/global-critical-minerals-outlook-2025/executive-summary',
    public_file: 'iea-critical-minerals-pressure-impact-snapshot.json',
    artifact_kind: 'reviewed_global_critical_minerals_pressure_snapshot',
    served_metric_ids: ['critical_mineral_demand_growth_and_supply_concentration'],
    measurement_ready_metric_ids: ['critical_mineral_demand_growth_and_supply_concentration']
  },
  unep_wcmc_global_ecological_connectivity_assessment: {
    route: 'https://www.unep-wcmc.org/en/news/life-on-a-connected-planet',
    public_file: 'global-habitat-connectivity-impact-snapshot.json',
    artifact_kind: 'reviewed_global_terrestrial_connectivity_snapshot',
    served_metric_ids: ['global_terrestrial_habitat_connectivity_gap'],
    measurement_ready_metric_ids: ['global_terrestrial_habitat_connectivity_gap']
  },
  global_free_flowing_rivers_assessment_2019: {
    route: 'https://pubmed.ncbi.nlm.nih.gov/31068722/',
    public_file: 'global-river-connectivity-impact-snapshot.json',
    artifact_kind: 'reviewed_global_river_connectivity_snapshot',
    served_metric_ids: ['global_long_river_connectivity_loss'],
    measurement_ready_metric_ids: ['global_long_river_connectivity_loss']
  },
  who_unicef_jmp_2025: {
    route: 'https://www.who.int/publications/b/80981',
    public_file: 'global-drinking-water-service-impact-snapshot.json',
    artifact_kind: 'reviewed_global_drinking_water_service_snapshot',
    served_metric_ids: ['global_safely_managed_drinking_water_service_gap'],
    measurement_ready_metric_ids: ['global_safely_managed_drinking_water_service_gap']
  },
  world_bank_global_non_revenue_water_assessment: {
    route: 'https://blogs.worldbank.org/en/ppps/what-do-private-companies-look-performance-based-non-revenue-water-project',
    public_file: 'world-bank-global-non-revenue-water-impact-snapshot.json',
    artifact_kind: 'reviewed_global_non_revenue_water_snapshot',
    served_metric_ids: ['global_non_revenue_water_volume'],
    measurement_ready_metric_ids: ['global_non_revenue_water_volume']
  },
  unep_and_fao_sustainable_food_cold_chains: {
    route: 'https://www.unep.org/resources/report/sustainable-food-cold-chains-opportunities-challenges-and-way-forward',
    public_file: 'unep-fao-cold-chain-impact-snapshot.json',
    artifact_kind: 'reviewed_global_cold_chain_impact_assessment_snapshot',
    served_metric_ids: ['cold_chain_attributable_food_loss_burden'],
    measurement_ready_metric_ids: ['cold_chain_attributable_food_loss_burden']
  },
  unep_global_peatlands_assessment_2022: {
    route: 'https://www.unep.org/resources/global-peatlands-assessment-2022',
    public_file: 'unep-peatlands-impact-snapshot.json',
    artifact_kind: 'reviewed_global_peatland_impact_assessment_snapshot',
    served_metric_ids: ['peatland_condition_and_drained_area'],
    measurement_ready_metric_ids: ['peatland_condition_and_drained_area']
  },
  unep_food_waste_index: {
    route: 'https://www.unep.org/resources/publication/food-waste-index-report-2024',
    public_file: 'unep-food-waste-impact-snapshot.json',
    artifact_kind: 'reviewed_global_food_waste_assessment_snapshot',
    served_metric_ids: ['food_waste_mass_by_supply_stage'],
    measurement_ready_metric_ids: ['food_waste_mass_by_supply_stage']
  },
  climate_trace_global_emissions_api: {
    route: 'https://api.climatetrace.org/v7/sources/emissions',
    public_file: 'climate-trace-land-emissions-snapshot.json',
    artifact_kind: 'contract_bound_global_monthly_land_emissions_snapshot',
    served_metric_ids: ['carbon_pathway_deforestation_co2_release', 'carbon_pathway_land_use_fire_co2'],
    measurement_ready_metric_ids: ['carbon_pathway_deforestation_co2_release', 'carbon_pathway_land_use_fire_co2']
  },
  ember_global_electricity_data: {
    route: 'https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv',
    public_file: 'ember-global-power-snapshot.json',
    artifact_kind: 'contract_bound_world_fuel_specific_power_snapshot',
    served_metric_ids: ['carbon_pathway_coal_power_co2_output', 'carbon_pathway_gas_power_co2_output', 'gas_fired_generation_share', 'hydropower_availability_and_generation_shortfall'],
    measurement_ready_metric_ids: ['carbon_pathway_coal_power_co2_output', 'carbon_pathway_gas_power_co2_output', 'gas_fired_generation_share', 'hydropower_availability_and_generation_shortfall']
  },
  noaa_cpc_psl_climate_indices: {
    route: '/api/noaa/climate-indices',
    public_file: 'noaa-climate-indices-snapshot.json',
    artifact_kind: 'contract_bound_source_native_climate_index_snapshot',
    served_metric_ids: ['pacific_decadal_oscillation_index', 'pacific_north_american_index', 'north_atlantic_oscillation_index', 'arctic_oscillation_index', 'dipole_mode_index', 'noaa_psl_realtime_olr_mjo_index', 'southern_annular_mode_index', 'equatorial_stratospheric_zonal_wind', 'atlantic_multidecadal_variability_index'],
    measurement_ready_metric_ids: ['pacific_decadal_oscillation_index', 'pacific_north_american_index', 'north_atlantic_oscillation_index', 'arctic_oscillation_index', 'dipole_mode_index', 'noaa_psl_realtime_olr_mjo_index', 'southern_annular_mode_index', 'equatorial_stratospheric_zonal_wind', 'atlantic_multidecadal_variability_index']
  },
  noaa_ratpac: {
    route: '/api/noaa/ratpac',
    public_file: 'noaa-ratpac-snapshot.json',
    artifact_kind: 'contract_bound_global_radiosonde_temperature_snapshot',
    served_metric_ids: ['tropospheric_temperature_anomaly_trend', 'radiosonde_layer_temperature_anomaly', 'lower_stratospheric_temperature_anomaly'],
    measurement_ready_metric_ids: ['tropospheric_temperature_anomaly_trend', 'radiosonde_layer_temperature_anomaly', 'lower_stratospheric_temperature_anomaly']
  },
  acaps_humanitarian_access: {
    route: '/api/acaps/humanitarian-access',
    public_file: 'acaps-humanitarian-access-snapshot.json',
    artifact_kind: 'contract_bound_country_crisis_humanitarian_access_severity_snapshot',
    served_metric_ids: ['acaps_humanitarian_access_severity_distribution'],
    measurement_ready_metric_ids: ['acaps_humanitarian_access_severity_distribution']
  },
  austin_travis_county_ems_incidents_by_month: {
    route: '/api/atcems/response-compliance',
    public_file: 'atcems-response-compliance-snapshot.json',
    artifact_kind: 'contract_bound_local_monthly_ems_response_compliance_snapshot',
    served_metric_ids: ['atcems_response_goal_miss_rate'],
    measurement_ready_metric_ids: ['atcems_response_goal_miss_rate']
  },
  openfema_registration_intake_individuals_household_program_v2: {
    route: '/api/openfema/ihp-geographic-gap',
    public_file: 'openfema-ihp-geographic-gap-snapshot.json',
    artifact_kind: 'contract_bound_within_declaration_geographic_ihp_gap_snapshot',
    served_metric_ids: ['openfema_geographic_ihp_assistance_gap'],
    measurement_ready_metric_ids: ['openfema_geographic_ihp_assistance_gap']
  },
  sabin_center_unep_global_climate_litigation_report_2025: {
    route: '/api/sabin/climate-litigation-counts',
    public_file: 'sabin-climate-litigation-counts-snapshot.json',
    artifact_kind: 'contract_bound_authoritative_assessment_snapshot',
    served_metric_ids: ['climate_litigation_cases'],
    measurement_ready_metric_ids: ['climate_litigation_cases']
  },
  undrr_global_status_multi_hazard_early_warning_systems_2024: {
    route: '/api/undrr/mhews-status',
    public_file: 'undrr-mhews-status-snapshot.json',
    artifact_kind: 'contract_bound_authoritative_assessment_snapshot',
    served_metric_ids: ['countries_reporting_multi_hazard_early_warning_systems', 'countries_not_reporting_multi_hazard_early_warning_systems_pct'],
    measurement_ready_metric_ids: ['countries_reporting_multi_hazard_early_warning_systems', 'countries_not_reporting_multi_hazard_early_warning_systems_pct']
  },
  ocha_humanitarian_programme_cycle_public_api: {
    route: '/api/ocha/humanitarian-history',
    public_file: 'ocha-humanitarian-history-snapshot.json',
    artifact_kind: 'contract_bound_global_annual_humanitarian_finance_history',
    served_metric_ids: [
      'humanitarian_response_funding_shortfall_operation_bound_metric',
      'humanitarian_plan_reported_resource_gap',
      'humanitarian_plan_positive_requirement_revision'
    ],
    measurement_ready_metric_ids: [
      'humanitarian_response_funding_shortfall_operation_bound_metric',
      'humanitarian_plan_reported_resource_gap',
      'humanitarian_plan_positive_requirement_revision'
    ]
  },
  unsd_sdg_api_unep_material_flows: {
    route: '/api/unsd/material-pressure',
    public_file: 'unsd-material-pressure-snapshot.json',
    artifact_kind: 'contract_bound_country_region_material_pressure_snapshot',
    served_metric_ids: ['material_extraction_and_footprint_by_resource']
  },
  nasa_power_monsoon_rainfall_pilot: {
    route: '/api/power/monsoon-rainfall',
    public_file: 'power-monsoon-snapshot.json',
    artifact_kind: 'contract_bound_gridded_monsoon_rainfall_snapshot',
    served_metric_ids: ['monsoon_onset_and_seasonal_rainfall_variability']
  },
  our_world_in_data_energy_data: {
    route: '/api/owid/clean-electricity',
    public_file: 'owid-clean-electricity-snapshot.json',
    artifact_kind: 'contract_bound_country_global_clean_electricity_snapshot',
    served_metric_ids: ['low_emissions_electricity_generation_share']
  },
  global_human_settlement_layer: {
    route: '/api/ghsl/snapshot',
    public_file: 'ghsl-country-urbanization-snapshot.json',
    artifact_kind: 'contract_bound_country_metric_snapshot',
    served_metric_ids: ['built_up_surface_expansion', 'built_up_area_per_resident']
  },
  eia_hourly_electric_grid_monitor: {
    route: '/api/eia/grid-snapshot',
    public_file: 'eia-hourly-grid-snapshot.json',
    artifact_kind: 'contract_bound_grid_metric_snapshot',
    served_metric_ids: ['grid_peak_demand_and_forecast_stress', 'gas_fired_generation_share']
  },
  ice_sheet_mass_balance_inter_comparison_exercise: {
    route: '/api/imbie/snapshot',
    public_file: 'imbie-snapshot.json',
    artifact_kind: 'contract_bound_assessment_measurement_snapshot',
    served_metric_ids: ['ice_sheet_mass_balance']
  },
  noaa_global_ocean_heat_content_cdr: {
    route: '/api/noaa/ocean-heat-content',
    public_file: 'noaa-ocean-heat-content-snapshot.json',
    artifact_kind: 'contract_bound_global_metric_snapshot',
    served_metric_ids: ['upper_ocean_heat_content_anomaly']
  },
  noaa_laboratory_for_satellite_altimetry: {
    route: '/api/noaa/global-mean-sea-level',
    public_file: 'noaa-global-mean-sea-level-snapshot.json',
    artifact_kind: 'contract_bound_global_altimetry_metric_snapshot',
    served_metric_ids: ['global_and_regional_mean_sea_level_change']
  },
  noaa_ibtracs: {
    route: '/api/noaa/ibtracs-rapid-intensification',
    public_file: 'noaa-ibtracs-rapid-intensification-snapshot.json',
    artifact_kind: 'contract_bound_storm_rapid_intensification_snapshot',
    served_metric_ids: ['ibtracs_24h_maximum_wind_change']
  },
  gbif_occurrence_api: {
    route: '/api/gbif/snapshot',
    public_file: 'gbif-occurrence-snapshot.json',
    artifact_kind: 'bounded_occurrence_snapshot'
  },
  obis_api_v3: {
    route: '/api/obis/snapshot',
    public_file: 'obis-occurrence-snapshot.json',
    artifact_kind: 'bounded_occurrence_snapshot'
  },
  usgs_water_data_ogc_api: {
    route: '/api/usgs-water/snapshot',
    public_file: 'usgs-water-snapshot.json',
    artifact_kind: 'bounded_station_snapshot'
  },
  unsd_sdg_api: {
    route: '/api/food-security/snapshot',
    public_file: 'food-security-snapshot.json',
    artifact_kind: 'contract_bound_metric_snapshot'
  },
  unsd_sdg_api_fao_fish_stock_status: {
    route: '/api/fao/fish-stock-sustainability',
    public_file: 'fao-fish-stock-sustainability-snapshot.json',
    artifact_kind: 'contract_bound_country_stock_assessment_snapshot',
    served_metric_ids: ['marine_fish_stocks_biologically_unsustainable']
  },
  eurostat_fisheries_landings: {
    route: '/api/eurostat/fish-landings',
    public_file: 'eurostat-fish-landings-snapshot.json',
    artifact_kind: 'contract_bound_annual_fish_landings_shortfall_snapshot',
    served_metric_ids: ['marine_fish_landings_shortfall']
  },
  usgs_samples_data_api: {
    route: '/api/nutrient-pollution/snapshot',
    public_file: 'nutrient-pollution-snapshot.json',
    artifact_kind: 'bounded_water_quality_snapshot'
  },
  eea_urban_heat_island_arcgis: {
    route: '/api/urban-heat-island/snapshot',
    public_file: 'urban-heat-island-snapshot.json',
    artifact_kind: 'bounded_regional_metric_snapshot'
  },
  global_mangrove_watch: {
    route: '/api/mangrove-watch/snapshot',
    public_file: 'mangrove-watch-snapshot.json',
    artifact_kind: 'snapshot'
  },
  surface_ocean_co2_atlas: {
    route: '/api/socat/catalog',
    public_file: 'socat-catalog.json',
    artifact_kind: 'catalog_snapshot'
  },
  imbie_publications_and_assessments: {
    route: '/api/imbie/snapshot',
    public_file: 'imbie-snapshot.json',
    artifact_kind: 'assessment_snapshot'
  },
  noaa_physical_sciences_laboratory_enso: {
    route: '/api/enso/snapshot',
    public_file: 'enso-monitoring-snapshot.json',
    artifact_kind: 'contract_bound_climate_index_snapshot',
    served_metric_ids: ['noaa_oni_warm_phase', 'noaa_oni_cool_phase'],
    measurement_ready_metric_ids: ['noaa_oni_warm_phase', 'noaa_oni_cool_phase']
  },
  noaa_arctic_report_card: {
    route: 'https://arctic.noaa.gov/report-card/',
    public_file: 'noaa-arctic-report-card-assessment.json',
    artifact_kind: 'authoritative_assessment'
  },
  noaa_global_monitoring_laboratory_nitrous_oxide_trends: {
    route: '/api/noaa-gml/n2o',
    public_file: 'noaa-n2o-benchmarks.json',
    artifact_kind: 'benchmark_snapshot'
  },
  noaa_global_monitoring_laboratory: {
    route: '/api/noaa-gml/benchmarks',
    public_file: 'noaa-gml-benchmarks.json',
    artifact_kind: 'benchmark_snapshot'
  },
  nasa_giss_surface_temperature_analysis: {
    route: '/api/temperature/benchmarks',
    public_file: 'temperature-benchmarks.json',
    artifact_kind: 'benchmark_snapshot'
  },
  berkeley_earth_temperature_data: {
    route: '/api/temperature/benchmarks',
    public_file: 'temperature-benchmarks.json',
    artifact_kind: 'benchmark_snapshot'
  },
  global_carbon_budget: {
    route: '/api/gcb/snapshot',
    public_file: 'gcb-snapshot.json',
    artifact_kind: 'snapshot'
  },
  global_carbon_budget_2025: {
    route: '/api/gcb/snapshot',
    public_file: 'gcb-snapshot.json',
    artifact_kind: 'snapshot'
  },
  edgar_global_emissions_database: {
    route: '/api/edgar/snapshot',
    public_file: 'edgar-snapshot.json',
    artifact_kind: 'contract_bound_sector_country_emissions_snapshot',
    served_metric_ids: [
      'territorial_fossil_and_industrial_co2_emissions',
      'anthropogenic_methane_emissions',
      'anthropogenic_nitrous_oxide_emissions',
      'cement_calcination_co2_emissions',
      'carbon_pathway_aviation_jet_fuel_co2',
      'carbon_pathway_refinery_combustion_co2',
      'carbon_pathway_chemical_process_co2',
      'carbon_pathway_waste_incineration_co2',
      'carbon_pathway_shipping_bunker_fuel_co2',
      'carbon_pathway_rail_diesel_co2',
      'carbon_pathway_iron_steel_process_co2',
      'carbon_pathway_oil_gas_flaring_co2'
    ]
  },
  noaa_ocean_carbon_and_acidification_data_system: {
    route: '/api/ocads/acidification-snapshot',
    public_file: 'ocads-acidification-snapshot.json',
    artifact_kind: 'contract_bound_coastal_acidification_climatology_snapshot',
    served_metric_ids: ['surface_ocean_ph_and_aragonite_state']
  },
  noaa_world_ocean_database: {
    route: '/api/wod/snapshot',
    public_file: 'wod-snapshot.json',
    artifact_kind: 'snapshot'
  },
  argo_ocean_observing_network: {
    route: '/api/argo/snapshot',
    public_file: 'argo-snapshot.json',
    artifact_kind: 'snapshot'
  },
  noaa_marine_heatwaves: {
    route: '/api/marine-heatwaves/snapshot',
    public_file: 'noaa-marine-heatwave-snapshot.json',
    artifact_kind: 'contract_bound_marine_heatwave_measurement_snapshot',
    served_metric_ids: ['marine_heatwave_days_and_intensity'],
    measurement_ready_metric_ids: ['marine_heatwave_days_and_intensity']
  },
  noaa_coral_reef_watch: {
    route: '/api/coral-reef-watch/snapshot',
    public_file: 'coral-reef-watch-snapshot.json',
    artifact_kind: 'contract_bound_global_coral_bleaching_operational_snapshot',
    served_metric_ids: ['coral_bleaching_severity'],
    measurement_ready_metric_ids: ['coral_bleaching_severity']
  },
  national_snow_and_ice_data_center: {
    route: '/api/nsidc/sea-ice',
    public_file: 'nsidc-sea-ice-snapshot.json',
    artifact_kind: 'snapshot'
  },
  nsidc_sea_ice_today: {
    route: '/api/nsidc/sea-ice',
    public_file: 'nsidc-sea-ice-snapshot.json',
    artifact_kind: 'snapshot'
  },
  global_terrestrial_network_for_permafrost: {
    route: '/api/gtnp/snapshot',
    public_file: 'gtnp-snapshot.json',
    artifact_kind: 'snapshot'
  },
  fao_global_forest_resources_assessment: {
    route: '/api/fra/snapshot',
    public_file: 'fra-snapshot.json',
    artifact_kind: 'contract_bound_global_forest_conversion_snapshot',
    served_metric_ids: ['fao_fra_forest_conversion_rate'],
    measurement_ready_metric_ids: ['fao_fra_forest_conversion_rate']
  },
  global_forest_watch: {
    route: '/api/gfw/snapshot',
    public_file: 'gfw-snapshot.json',
    artifact_kind: 'snapshot'
  },
  nasa_fire_information_for_resource_management_system: {
    route: '/api/firms/snapshot',
    public_file: 'firms-catalog.json',
    artifact_kind: 'snapshot'
  },
  soilgrids: {
    route: '/api/soilgrids/snapshot',
    public_file: 'soilgrids-snapshot.json',
    artifact_kind: 'snapshot'
  },
  faostat: {
    route: '/api/faostat/agriculture-snapshot',
    public_file: 'faostat-agriculture-snapshot.json',
    artifact_kind: 'source_dataset_snapshot',
    served_metric_ids: ['faostat_input_intensity_profile', 'crop_yield_interannual_variability', 'apparent_agricultural_commodity_demand', 'food_import_dependency_ratio', 'fertilizer_product_output', 'livestock_feed_crop_use_share', 'wetland_area_drained_or_converted', 'drained_peat_co2_flux'],
    measurement_ready_metric_ids: [
      'crop_yield_interannual_variability',
      'apparent_agricultural_commodity_demand',
      'food_import_dependency_ratio',
      'fertilizer_product_output',
      'livestock_feed_crop_use_share',
      'wetland_area_drained_or_converted',
      'drained_peat_co2_flux'
    ]
  },
  nasa_power_open_api: {
    route: '/api/power/heat-hazards',
    public_file: 'power-heat-hazard-snapshot.json',
    artifact_kind: 'contract_bound_gridded_metric_snapshot',
    served_metric_ids: ['wet_bulb_temperature_exceedance_hours', 'vapour_pressure_deficit', 'column_water_vapour_anomaly', 'compound_climate_hazard_days', 'power_annual_max_daily_precipitation_anomaly', 'warm_night_threshold_exceedance', 'compound_hot_day_night_events'],
    measurement_ready_metric_ids: ['wet_bulb_temperature_exceedance_hours', 'vapour_pressure_deficit', 'column_water_vapour_anomaly', 'compound_climate_hazard_days', 'power_annual_max_daily_precipitation_anomaly', 'warm_night_threshold_exceedance', 'compound_hot_day_night_events']
  },
  noaa_co_ops_derived_product_api: {
    route: '/api/noaa-coops/high-tide-floods',
    public_file: 'noaa-coops-high-tide-flood-snapshot.json',
    artifact_kind: 'contract_bound_gauge_metric_snapshot',
    served_metric_ids: ['coastal_high_water_exposure_days']
  },
  who_gho_odata_api: {
    route: '/api/who/air-pollution-burden',
    public_file: 'who-air-pollution-burden-snapshot.json',
    artifact_kind: 'contract_bound_country_health_burden_snapshot',
    served_metric_ids: ['air_pollution_attributable_health_burden']
  },
  noaa_dynamics_and_distribution_of_natural_and_human_caused_coastal_hypoxia: {
    route: '/api/noaa/coastal-hypoxia',
    public_file: 'noaa-coastal-hypoxia-snapshot.json',
    artifact_kind: 'contract_bound_annual_shelf_hypoxia_snapshot',
    served_metric_ids: ['noaa_gulf_midsummer_hypoxic_zone_area'],
    measurement_ready_metric_ids: ['noaa_gulf_midsummer_hypoxic_zone_area']
  },
  world_bank_commodity_price_data_the_pink_sheet: {
    route: '/api/world-bank/fertilizer-prices',
    public_file: 'world-bank-fertilizer-price-snapshot.json',
    artifact_kind: 'contract_bound_monthly_global_fertilizer_price_index_snapshot',
    served_metric_ids: ['world_bank_fertilizer_price_index_change'],
    measurement_ready_metric_ids: ['world_bank_fertilizer_price_index_change']
  },
  copernicus_european_and_global_drought_observatories: {
    route: '/api/copernicus/drought-persistence',
    public_file: 'copernicus-drought-persistence-snapshot.json',
    artifact_kind: 'contract_bound_gridded_drought_metric_snapshot',
    served_metric_ids: ['drought_event_duration_spi6']
  },
  ec_jrc_global_wildfire_information_system_mcd64a1_burned_area: {
    route: '/api/gwis/wildfire-regime',
    public_file: 'gwis-wildfire-regime-snapshot.json',
    artifact_kind: 'contract_bound_country_burned_area_regime_snapshot',
    served_metric_ids: ['gwis_non_cropland_burned_area_and_season_span']
  },
  u_s_epa_national_rivers_and_streams_assessment_2018_2019: {
    route: '/api/epa/nrsa/freshwater-condition',
    public_file: 'epa-nrsa-freshwater-condition-snapshot.json',
    artifact_kind: 'contract_bound_probability_survey_biological_condition_snapshot',
    served_metric_ids: ['epa_nrsa_poor_biological_condition']
  },
  eia_major_disturbances_and_unusual_occurrences_doe_417: {
    route: '/api/eia/oe417-disruptions',
    public_file: 'eia-oe417-disruption-snapshot.json',
    artifact_kind: 'contract_bound_major_electric_disruption_snapshot',
    served_metric_ids: ['eia_oe417_reported_customer_interruption_burden']
  },
  food_systems_dashboard: {
    route: '/api/food-security/snapshot',
    public_file: 'food-security-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  edgar_food: {
    route: '/api/edgar-food/snapshot',
    public_file: 'edgar-food-snapshot.json',
    artifact_kind: 'snapshot'
  },
  wri_aqueduct: {
    route: '/api/aqueduct/snapshot',
    public_file: 'aqueduct-snapshot.json',
    artifact_kind: 'contract_bound_global_baseline_water_stress_snapshot',
    served_metric_ids: ['baseline_water_withdrawal_to_supply_ratio'],
    measurement_ready_metric_ids: ['baseline_water_withdrawal_to_supply_ratio']
  },
  water_footprint_network: {
    route: '/api/water-footprint/snapshot',
    public_file: 'water-footprint-snapshot.json',
    artifact_kind: 'snapshot'
  },
  lancet_countdown_data_explorer: {
    route: '/api/heat-health/snapshot',
    public_file: 'heat-health-snapshot.json',
    artifact_kind: 'contract_bound_multi_indicator_health_snapshot',
    served_metric_ids: [
      'heat_attributable_mortality_rate',
      'heat_attributable_deaths',
      'heat_related_working_hour_loss',
      'agricultural_potential_work_hours_lost_to_heat',
      'vbd_climate_suitability_and_transmission_season'
    ]
  },
  who_heat_and_health: {
    route: '/api/heat-health/snapshot',
    public_file: 'heat-health-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  who_climate_change_and_health: {
    route: '/api/heat-health/snapshot',
    public_file: 'heat-health-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  ilo_heat_stress_and_labour_productivity_report: {
    route: '/api/heat-health/snapshot',
    public_file: 'heat-health-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  ilo_heat_stress_and_labour_productivity: {
    route: '/api/heat-health/snapshot',
    public_file: 'heat-health-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  ilo_working_on_a_warmer_planet: {
    route: '/api/heat-health/snapshot',
    public_file: 'heat-health-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  em_dat_international_disaster_database: {
    route: '/api/disaster-displacement/snapshot',
    public_file: 'disaster-displacement-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  em_dat: {
    route: '/api/disaster-displacement/snapshot',
    public_file: 'disaster-displacement-snapshot.json',
    artifact_kind: 'support_snapshot',
    served_metric_ids: [
      'population_covered_by_multi_hazard_warning',
      'disaster_assistance_outcome_gap',
      'population_without_timely_early_warning',
      'emergency_demand_above_response_capacity'
    ]
  },
  internal_displacement_monitoring_centre: {
    route: '/api/disaster-displacement/snapshot',
    public_file: 'disaster-displacement-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  idmc: {
    route: '/api/disaster-displacement/snapshot',
    public_file: 'disaster-displacement-snapshot.json',
    artifact_kind: 'contract_bound_country_annual_disaster_displacement_snapshot',
    served_metric_ids: ['hazard_related_internal_displacements']
  },
  unhcr_climate_change_conflict_and_displacement: {
    route: '/api/disaster-displacement/snapshot',
    public_file: 'disaster-displacement-snapshot.json',
    artifact_kind: 'support_snapshot',
    served_metric_ids: [
      'humanitarian_response_funding_shortfall_operation_bound_metric',
      'humanitarian_access_constraints_operation_bound_metric',
      'humanitarian_surge_demand_operation_bound_metric',
      'humanitarian_resource_gaps_operation_bound_metric'
    ]
  },
  world_bank_groundswell_climate_migration_report: {
    route: '/api/disaster-displacement/snapshot',
    public_file: 'disaster-displacement-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  climate_policy_initiative: {
    route: '/api/finance-governance/snapshot',
    public_file: 'finance-governance-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  network_for_greening_the_financial_system_scenarios: {
    route: '/api/finance-governance/snapshot',
    public_file: 'finance-governance-snapshot.json',
    artifact_kind: 'support_snapshot'
  },
  unep_adaptation_gap_report_2025: {
    route: '/api/unep/adaptation-finance-gap',
    public_file: 'unep-adaptation-finance-gap-snapshot.json',
    artifact_kind: 'contract_bound_authoritative_assessment_snapshot',
    served_metric_ids: ['adaptation_finance_gap'],
    measurement_ready_metric_ids: ['adaptation_finance_gap']
  }
};

const SUPPLEMENTAL_PLATFORM_SURFACES = [
  {
    id: 'earthdata_catalog',
    name: 'NASA Earthdata Catalog',
    route: '/api/earthdata/catalog',
    public_file: 'earthdata-catalog.json',
    artifact_kind: 'catalog'
  },
  {
    id: 'grace_catalog',
    name: 'NASA GRACE Catalog',
    route: '/api/grace/catalog',
    public_file: 'grace-catalog.json',
    artifact_kind: 'catalog'
  },
  {
    id: 'power_catalog',
    name: 'NASA POWER Catalog',
    route: '/api/power/catalog',
    public_file: 'power-catalog.json',
    artifact_kind: 'catalog'
  },
  {
    id: 'owid_catalog',
    name: 'Our World in Data Catalog',
    route: '/api/owid/catalog',
    public_file: 'owid-catalog.json',
    artifact_kind: 'catalog'
  },
  {
    id: 'owid_global_co2',
    name: 'Our World in Data Global CO2 Dataset',
    route: '/api/owid/global-co2',
    public_file: 'owid-global-co2.json',
    artifact_kind: 'dataset'
  },
  {
    id: 'node_source_attachments',
    name: 'Node Source Attachment Registry',
    route: '/api/source-attachments',
    public_file: 'node-source-attachments.json',
    artifact_kind: 'attachment_registry'
  },
  {
    id: 'seagrass_support_snapshot',
    name: 'OBIS Seagrass Supporting Occurrences',
    route: '/api/seagrass/snapshot',
    public_file: 'seagrass-support-snapshot.json',
    artifact_kind: 'supporting_occurrence_snapshot'
  }
];

const CLASS_TO_BUCKET = {
  open_api: 'operational_open',
  open_download: 'operational_open',
  open_portal: 'catalog_or_portal',
  mixed_or_gated: 'manual_auth_needed',
  reference_only: 'evidence_only'
};

const CLASS_TO_INGESTION_MODE = {
  open_api: 'api',
  open_download: 'download',
  open_portal: 'portal',
  mixed_or_gated: 'gated_or_account_mediated',
  reference_only: 'report_or_reference'
};

const CLASS_TO_REFRESH_STYLE = {
  open_api: 'scheduled_snapshot',
  open_download: 'scheduled_snapshot',
  open_portal: 'manual_catalog_review',
  mixed_or_gated: 'manual_auth_flow',
  reference_only: 'manual_evidence_review'
};

const RECEIPT_EVIDENCE_SOURCES = [
  ['fhfa_hurricane_mortgage_performance_2024', 549, 'FHFA Hurricane Mortgage Performance 2024', 'https://www.fhfa.gov/research/papers/wp2409'],
  ['fhfa_helene_milton_mortgage_exposure_2024', 548, 'FHFA Helene and Milton Mortgage Exposure 2024', 'https://www.fhfa.gov/blog/insights/estimating-the-impact-of-hurricanes-helene-and-milton-on-single-family-mortgages'],
  ['spijkers_international_fisheries_conflict_predictors_2021', 547, 'International Fisheries Conflict Predictors 2021', 'https://onlinelibrary.wiley.com/doi/full/10.1111/faf.12554'],
  ['jcu_international_fishery_conflict_database_2020', 546, 'International Fishery Conflict Database', 'https://researchdata.jcu.edu.au/published/36a5a14a492290c5c65d8f5ee3ea8860'],
  ['fhwa_nbis_scour_plan_of_action_2023', 545, 'FHWA Scour Plan-of-Action Requirements 2023', 'https://www.fhwa.dot.gov/bridge/nbis2022/qanda/08.cfm'],
  ['fhwa_snbi_scour_code_mapping', 544, 'FHWA SNBI Scour Code Mapping', 'https://www.fhwa.dot.gov/bridge/snbi/codemapping.cfm'],
  ['fhwa_nbi_highway_bridges_2025', 543, 'FHWA National Bridge Inventory 2025', 'https://www.fhwa.dot.gov/BRIDGE/nbi/ascii2025.cfm'],
  ['us_treasury_fio_homeowners_insurance_climate_risk_2025', 542, 'U.S. Homeowners Insurance Climate-Risk Analysis 2025', 'https://home.treasury.gov/news/press-releases/jy2791'],
  ['nowak_greenfield_us_urban_tree_cover_benefit_loss_2018', 541, 'United States Urban Tree-Cover Benefit Loss 2018', 'https://research.fs.usda.gov/treesearch/55941'],
  ['nowak_greenfield_global_urban_tree_cover_change_2020', 540, 'Global Urban Tree-Cover Change 2020', 'https://research.fs.usda.gov/treesearch/59488'],
  ['wooster_indonesian_peat_fire_air_quality_health_2024', 539, 'Indonesian Peat-Fire Air Quality and Health 2024', 'https://www.nature.com/articles/s43247-024-01813-w'],
  ['yesudian_dawson_global_airport_slr_risk_2021', 538, 'Global Airport Sea-Level-Rise Risk 2021', 'https://eprints.ncl.ac.uk/272631'],
  ['springborn_amphibian_collapse_malaria_2022', 537, 'Amphibian Collapse and Malaria Incidence 2022', 'https://iopscience.iop.org/article/10.1088/1748-9326/ac8e1d'],
  ['olson_global_bd_patterns_2021', 536, 'Global Amphibian Chytrid Patterns 2021', 'https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2021.685877/full'],
  ['hallegraeff_global_hab_assessment_2021', 535, 'Global Harmful Algal Bloom Assessment 2021', 'https://www.nature.com/articles/s43247-021-00178-8'],
  ['faostat_land_use_and_livestock_stock_density', 534, 'FAOSTAT Land Use and Livestock Stock Density', 'https://www.fao.org/faostat/en/#data/RL'],
  ['ucdp_battle_related_deaths_25_1', 533, 'UCDP Battle-related Deaths Dataset 25.1', 'https://ucdp.uu.se/downloads/'],
  ['who_lead_poisoning_health_2026', 532, 'WHO Lead Poisoning and Health 2026', 'https://www.who.int/news-room/fact-sheets/detail/lead-poisoning-and-health'],
  ['unep_mercury_global_concern', 531, 'UNEP Mercury Global Concern', 'https://www.unep.org/topics/chemicals-and-pollution-action/pollution-and-health/heavy-metals/mercury/mercury-general'],
  ['unep_global_mercury_assessment_2018', 530, 'UNEP Global Mercury Assessment 2018', 'https://wedocs.unep.org/bitstream/handle/20.500.11822/27579/GMA2018.pdf?sequence=1'],
  ['unep_global_mercury_monitoring_biota', 529, 'UNEP Global Mercury Monitoring in Biota', 'https://www.unep.org/globalmercurypartnership/resources/report/global-mercury-monitoring-biota'],
  ['edgar_global_air_pollutant_emissions_v81', 528, 'EDGAR v8.1 Global Air Pollutant Emissions', 'https://edgar.jrc.ec.europa.eu/index.php/dataset_ap81'],
  ['ipcc_ar6_synthesis_summary_for_policymakers', 527, 'IPCC AR6 Synthesis Summary for Policymakers', 'https://www.ipcc.ch/report/ar6/syr/summary-for-policymakers/'],
  ['un_water_analytical_brief_2024', 526, 'UN-Water Analytical Brief 2024', 'https://www.unwater.org/sites/default/files/2024-11/un-water_analyticalbrief_on_water_for_climate_mitigation_unformatted_version_0.pdf'],
  ['unesco_wwdr_groundwater_2022', 525, 'UN World Water Development Report Groundwater 2022', 'https://www.unesco.org/en/reports/wwdr/2022'],
  ['nature_global_groundwater_depletion_2002_2020', 524, 'Global Groundwater Depletion 2002–2020', 'https://www.nature.com/articles/s41467-026-73521-2'],
  ['nature_diminishing_reservoir_storage_returns_2023', 523, 'Diminishing Reservoir Storage Returns 2023', 'https://doi.org/10.1038/s41467-023-38843-5'],
  ['science_global_lake_storage_1992_2020', 522, 'Global Lake Storage 1992–2020', 'https://doi.org/10.1126/science.abo2812'],
  ['iea_electricity_market_update_2023_hydropower', 521, 'IEA Hydropower Availability 2023', 'https://www.iea.org/reports/electricity-market-report-update-2023/executive-summary'],
  ['journal_hydrology_global_reservoir_evaporation_1985_2016', 520, 'Global Reservoir Evaporation 1985–2016', 'https://doi.org/10.1016/j.jhydrol.2022.127524'],
  ['nature_global_lake_evaporation_1985_2018', 519, 'Global Lake Evaporation 1985–2018', 'https://www.nature.com/articles/s41467-022-31125-6'],
  ['arctic_council_shipping_update_2026', 518, 'Arctic Council Shipping Update 2026', 'https://arctic-council.org/news/increase-in-arctic-shipping/'],
  ['itu_submarine_cable_resilience_summit_2025', 517, 'ITU Submarine Cable Resilience Summit 2025', 'https://www.itu.int/en/mediacentre/Pages/PR-2025-02-27-submarine-cables-summit-nigeria.aspx'],
  ['wmo_airborne_dust_bulletin_2025', 516, 'WMO Airborne Dust Bulletin 2025', 'https://wmo.int/sites/default/files/2025-07/WMO-Airborne-Dust-Bulletin_9_en.pdf'],
  ['noaa_global_tropospheric_ozone_trends_1990_2017', 515, 'NOAA Global Tropospheric Ozone Trends 1990–2017', 'https://repository.library.noaa.gov/view/noaa/58045'],
  ['cheung_global_fisheries_catch_warming_2013', 514, 'Signature of Ocean Warming in Global Fisheries Catch', 'https://www.nature.com/articles/nature12156'],
  ['eger_global_kelp_services_2023', 513, 'Global Marine Kelp Forest Ecosystem Services', 'https://www.nature.com/articles/s41467-023-37385-0'],
  ['global_urban_expansion_uhi_risk_2000_2015', 512, 'Global Urban Expansion Heat-Island Risk 2000–2015', 'https://doi.org/10.1016/j.jag.2024.104215'],
  ['ipcc_ar6_wgii_ocean_coastal_ecosystems', 511, 'IPCC AR6 WGII Ocean and Coastal Ecosystems', 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/'],
  ['krumhansl_global_kelp_change_2016', 510, 'Global Kelp Forest Change over the Past Half-Century', 'https://www.pnas.org/doi/10.1073/pnas.1606102113'],
  ['lancet_countdown_wildfire_smoke_2024', 509, 'Lancet Countdown Wildfire Smoke Exposure 2024', 'https://doi.org/10.1016/S0140-6736(24)01822-1'],
  ['lancet_landscape_fire_mortality_2000_2019', 508, 'Global Landscape-Fire Air-Pollution Mortality 2000–2019', 'https://doi.org/10.1016/S0140-6736(24)02251-7'],
  ['wildfire_hospitalization_meta_analysis_2025', 507, 'Wildfire Particulate Hospitalization Meta-Analysis 2025', 'https://doi.org/10.1016/j.envres.2025.120927'],
  ['copernicus_surface_air_temperature_june_2026', 506, 'Copernicus Surface Air Temperature June 2026', 'https://climate.copernicus.eu/'],
  ['csiro_antarctic_bottom_water_observations_2023', 505, 'CSIRO Antarctic Bottom Water Observations 2023', 'https://www.csiro.au/en/news/all/articles/2023/may/antarctic-bottom-water'],
  ['fao_fra_2025', 504, 'FAO Global Forest Resources Assessment 2025', 'https://www.fao.org/forest-resources-assessment/en/'],
  ['faostat_agriculture_snapshot', 503, 'FAOSTAT Agriculture Snapshot', 'https://www.fao.org/faostat/en/'],
  ['global_glof_exposure_2023', 502, 'Global GLOF Exposure 2023', 'https://www.nature.com/articles/s41467-023-36033-x'],
  ['iarc_gbd_ambient_air_pollution_2015', 501, 'IARC GBD Ambient Air Pollution 2015', 'https://www.iarc.who.int/reference/estimates-and-25-year-trends-of-the-global-burden-of-disease-attributable-to-ambient-air-pollution-an-analysis-of-data-from-the-global-burden-of-diseases-study-2015/'],
  ['idmc_world_bank_disaster_displacement', 500, 'IDMC World Bank Disaster Displacement', 'https://data.worldbank.org/indicator/VC.IDP.NWDS'],
  ['iea_breakthrough_agenda_hydrogen_2025', 499, 'IEA Breakthrough Agenda Hydrogen 2025', 'https://www.iea.org/reports/breakthrough-agenda-report-2025/hydrogen'],
  ['iea_breakthrough_agenda_road_transport_2025', 498, 'IEA Breakthrough Agenda Road Transport 2025', 'https://www.iea.org/reports/breakthrough-agenda-report-2025/road-transport'],
  ['iea_electricity_2026_global_grid_pressure', 497, 'IEA Electricity 2026 Global Grid Pressure', 'https://www.iea.org/reports/electricity-2026/grids'],
  ['iea_electricity_2026_grids', 496, 'IEA Electricity 2026 Grids', 'https://www.iea.org/reports/electricity-2026/grids'],
  ['iea_global_ev_outlook_2026', 495, 'IEA Global EV Outlook 2026', 'https://www.iea.org/reports/global-ev-outlook-2026/trends-in-other-ev-modes'],
  ['ipcc_srocc_ar6_global_cryosphere_assessment', 494, 'IPCC SROCC AR6 Global Cryosphere Assessment', 'https://www.ipcc.ch/srocc/chapter/chapter-2/'],
  ['itu_submarine_cable_resilience', 493, 'ITU Submarine Cable Resilience', 'https://www.itu.int/digital-resilience/submarine-cables/'],
  ['lancet_countdown_vibrio_indicator_2025', 492, 'Lancet Countdown Vibrio Indicator 2025', 'https://lancetcountdown.org/explore-our-data/'],
  ['nasa_global_ocean_primary_production_1998_2015', 491, 'NASA Global Ocean Primary Production 1998–2015', 'https://ntrs.nasa.gov/citations/20210011808'],
  ['noaa_annual_greenhouse_gas_index', 490, 'NOAA Annual Greenhouse Gas Index', 'https://gml.noaa.gov/aggi/aggi.html'],
  ['noaa_gml_global_ch4', 489, 'NOAA GML Global Methane', 'https://gml.noaa.gov/ccgg/trends_ch4/'],
  ['noaa_gml_global_co2', 488, 'NOAA GML Global Carbon Dioxide', 'https://gml.noaa.gov/ccgg/trends/'],
  ['oecd_global_plastics_outlook', 487, 'OECD Global Plastics Outlook', 'https://www.oecd.org/en/publications/global-plastics-outlook_de747aef-en.html'],
  ['unep_annual_report_2025_fashion', 486, 'UNEP Annual Report 2025 Fashion', 'https://www.unep.org/annualreport/2025'],
  ['unep_pesticides_fertilizers_global_assessment', 485, 'UNEP Pesticides and Fertilizers Global Assessment', 'https://www.unep.org/resources/report/environmental-and-health-impacts-pesticides-and-fertilizers-and-ways-minimizing'],
  ['unep_zero_waste_day_2025', 484, 'UNEP International Day of Zero Waste 2025', 'https://www.unep.org/events/un-day/international-day-zero-waste-2025'],
  ['wmo_state_of_global_climate_2025', 483, 'WMO State of the Global Climate 2025', 'https://wmo.int/publication-series/state-of-global-climate'],
  ['woah_state_of_world_animal_health_2026', 482, 'WOAH State of the World’s Animal Health 2026', 'https://www.woah.org/en/animal-health-receives-as-little-as-0-6-percent-of-global-health-spending-despite-mounting-disease-crises-new-report-warns/']
].map(([id, audit_index, name, url]) => ({
  id, audit_index, name, url, access_classification: 'reference_only',
  fit: ['tulip_urgency_v2', 'quantitative_evidence', 'global_accumulated_impact_or_current_data'],
  notes: 'Receipt-bound quantitative source. Transformations, uncertainty, period and fallback boundary are retained in the generated TULIP urgency receipt.'
}));

const NORTHSTAR_PILOT_SOURCES = [
  ...RECEIPT_EVIDENCE_SOURCES,
  {
    id: 'tsmc_sustainability_report_2024_fab_footprint', audit_index: 644,
    name: 'TSMC 2024 Sustainability Report — Fab Footprint', url: 'https://esg.tsmc.com/en-US/file/public/2024-TSMC-Sustainability-Report-e.pdf', access_classification: 'reference_only',
    fit: ['impact_evidence', 'semiconductor_fabrication_footprint', 'semiconductor_output_environmental_intensity', 'tsmc_multinational_fab_footprint'],
    notes: 'Primary company disclosure of water, energy, GHG totals, per-wafer-mask-layer water intensity, trends and named multinational reporting boundary.'
  },
  {
    id: 'tsmc_annual_report_2024_environmental_accounting', audit_index: 645,
    name: 'TSMC 2024 Annual Report — Environmental Accounting', url: 'https://investor.tsmc.com/sites/ir/annual-report/2024/2024%20Annual%20Report_E.pdf', access_classification: 'reference_only',
    fit: ['impact_evidence', 'semiconductor_fabrication_footprint', 'semiconductor_output_environmental_intensity', 'tsmc_realized_environmental_cost'],
    notes: 'Audited annual-report table of Taiwan-fab environmental expense and investment plus waste intensity; corporate revenue is excluded.'
  },
  {
    id: 'tsmc_annual_report_2014_environmental_accounting', audit_index: 646,
    name: 'TSMC 2014 Annual Report — Environmental Accounting', url: 'https://investor.tsmc.com/static/annualReports/2014/english/pdf/e_7.pdf', access_classification: 'reference_only',
    fit: ['impact_evidence', 'semiconductor_fabrication_footprint', 'semiconductor_output_environmental_intensity', 'tsmc_environmental_cost_persistence'],
    notes: 'Matching 2014 environmental accounting endpoint used with 2024 only to establish a quantified ten-year persistence span.'
  },
  {
    id: 'usfs_tongass_goshawk_conservation_assessment_1996', audit_index: 642,
    name: 'USFS Tongass Northern Goshawk Conservation Assessment 1996', url: 'https://research.fs.usda.gov/download/treesearch/3053.pdf', access_classification: 'reference_only',
    fit: ['impact_evidence', 'old_growth_forest_logging', 'old_growth_forest_harvest_area', 'tongass_accumulated_harvest'],
    notes: 'Forest Service old-growth definition, cumulative productive old-growth harvest estimate, harvest method, duration and productive-forest boundary.'
  },
  {
    id: 'gao_tongass_timber_program_transition_2016', audit_index: 643,
    name: 'GAO Tongass Timber Program Transition 2016', url: 'https://www.gao.gov/assets/680/676905.pdf', access_classification: 'reference_only',
    fit: ['impact_evidence', 'old_growth_forest_logging', 'old_growth_forest_harvest_area', 'tongass_program_fiscal_burden'],
    notes: 'GAO confirms the historical old-growth program boundary and reports FY2005–2014 expenditures and revenues; road costs are excluded.'
  },
  {
    id: 'china_mee_ecology_environment_report_2020_acid_rain', audit_index: 639,
    name: 'China MEE Ecology and Environment Report 2020 — Acid Rain', url: 'https://english.mee.gov.cn/Resources/Reports/soe/SOEE2019/202204/P020220407417638702591.pdf', access_classification: 'reference_only',
    fit: ['impact_evidence', 'acid_rain_deposition', 'acidic_wet_dry_deposition', 'china_acid_rain_condition'],
    notes: 'Official precipitation-pH thresholds, monitoring-jurisdiction count, acid-rain frequency and affected-area estimate for 2020.'
  },
  {
    id: 'zhang_china_acid_deposition_material_loss_2017', audit_index: 640,
    name: 'Zhang et al. China Acid-Deposition Material Loss 2017', url: 'https://doi.org/10.3390/su9040488', access_classification: 'reference_only',
    fit: ['impact_evidence', 'acid_rain_deposition', 'acidic_wet_dry_deposition', 'china_material_corrosion_loss'],
    notes: 'National monitoring-network and dose-response assessment of 2013 material loss; model and inventory uncertainty remains explicit.'
  },
  {
    id: 'china_mee_environment_quality_2003_acid_rain', audit_index: 641,
    name: 'China MEE Environmental Quality Status 2003 — Acid Rain', url: 'https://www.mee.gov.cn/gkml/sthjbgw/qt/200910/t20091023_179782.htm', access_classification: 'reference_only',
    fit: ['impact_evidence', 'acid_rain_deposition', 'acidic_wet_dry_deposition', 'china_monitoring_span'],
    notes: 'Official national monitoring endpoint used only to establish a documented 2003–2020 reporting span, not a complete unchanged station panel.'
  },
  {
    id: 'south_lhonak_calving_retreat_study_2026', audit_index: 636,
    name: 'South Lhonak Rapid-Retreat and Calving Study', url: 'https://doi.org/10.1088/2515-7620/ae1936', access_classification: 'reference_only',
    fit: ['impact_evidence', 'glacier_calving_events', 'satellite_calving_front_change_and_iceberg_flux', 'south_lhonak_retreat_sequence'],
    notes: 'Primary observational study reporting immediate front retreat and seven large calving events since 2017; compound-trigger limits are retained.'
  },
  {
    id: 'south_lhonak_event_sequence_reconstruction_2026', audit_index: 637,
    name: 'South Lhonak Event-Sequence Reconstruction', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13013771/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'glacier_calving_events', 'satellite_calving_front_change_and_iceberg_flux', 'south_lhonak_calved_volume'],
    notes: 'Primary reconstruction reporting more than 100 metres of retreat and approximately 7 million cubic metres of calved ice while keeping landslide debris separate.'
  },
  {
    id: 'india_mha_sikkim_flood_situation_report_2023_10_29', audit_index: 638,
    name: 'India MHA Sikkim Flood Situation Report 29 October 2023', url: 'https://ndmindia.mha.gov.in/ndmi/viewUploadedDocument?uid=NEW1665', access_classification: 'reference_only',
    fit: ['impact_evidence', 'glacier_calving_events', 'satellite_calving_front_change_and_iceberg_flux', 'south_lhonak_downstream_burden'],
    notes: 'Official event-bounded population, mortality, housing, bridge and geographic impact tally; it does not assign every downstream loss exclusively to calving.'
  },
  {
    id: 'indonesia_supreme_court_kallista_alam_651_2015', audit_index: 633,
    name: 'Indonesia Supreme Court Kallista Alam Decision 651/2015', url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/bbf15c165693d4bdda18ed636b2c40b1.html', access_classification: 'reference_only',
    fit: ['impact_evidence', 'palm_oil_canopy_clearance', 'verified_forest_conversion_within_oil_palm_expansion', 'tripa_final_judgment'],
    notes: 'Final civil appeal record preserving the named oil-palm license and adjudicated land-clearing-by-fire boundary.'
  },
  {
    id: 'indonesia_supreme_court_kallista_alam_review_1_2017', audit_index: 634,
    name: 'Indonesia Supreme Court Kallista Alam Judicial Review 1/2017', url: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/6a6b644bad35d04047a3e8b9783604e8.html', access_classification: 'reference_only',
    fit: ['impact_evidence', 'palm_oil_canopy_clearance', 'verified_forest_conversion_within_oil_palm_expansion', 'tripa_final_review'],
    notes: 'Official rejection of judicial review, retaining the finality of the bounded environmental liability.'
  },
  {
    id: 'indonesia_klhk_kallista_alam_liability_2017', audit_index: 635,
    name: 'Indonesia KLHK Kallista Alam Liability 2017', url: 'https://ksdae.menlhk.go.id/assets/publikasi/SIARAN_PERS_-_Banding_PT_WAJ_Ditolak%2C_KLHK_Menangkan_Kasus_Karhutla.pdf', access_classification: 'reference_only',
    fit: ['impact_evidence', 'palm_oil_canopy_clearance', 'verified_forest_conversion_within_oil_palm_expansion', 'tripa_environmental_liability'],
    notes: 'Environment-ministry record of the final Rp366-billion compensation and restoration burden; no carbon-price conversion is used.'
  },
  {
    id: 'chen_kissimmee_channelization_wetland_loss_2016', audit_index: 630,
    name: 'Chen et al. Kissimmee Channelization and Wetland Loss 2016', url: 'https://doi.org/10.1002/2015WR018194', access_classification: 'reference_only',
    fit: ['impact_evidence', 'levee_and_channelization_works', 'river_floodplain_connectivity_and_channel_modification', 'kissimmee_wetland_loss'],
    notes: 'Peer-reviewed reconstruction of the C-38 engineered-channel dimensions, channelization period and approximately two-thirds lower-river wetland loss.'
  },
  {
    id: 'usgs_kissimmee_restored_reach_wetlands_2011', audit_index: 631,
    name: 'USGS Kissimmee Restored-Reach Wetland Monitoring 2011', url: 'https://pubs.usgs.gov/publication/70042343', access_classification: 'reference_only',
    fit: ['impact_evidence', 'levee_and_channelization_works', 'river_floodplain_connectivity_and_channel_modification', 'kissimmee_reference_monitoring'],
    notes: 'USGS restored and unrestored reach monitoring with wetland reconnection and naturalized-channel extent retained separately.'
  },
  {
    id: 'usace_kissimmee_river_fact_sheet_2025', audit_index: 632,
    name: 'USACE Kissimmee River Construction Fact Sheet 2025', url: 'https://www.saj.usace.army.mil/About/Congressional-Fact-Sheets-2025/Kissimmee-River-FL-C/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'levee_and_channelization_works', 'river_floodplain_connectivity_and_channel_modification', 'kissimmee_restoration_cost'],
    notes: 'Official canal-backfill and restored-flow milestones plus realized federal allocation through FY2024; estimated total cost remains unscored.'
  },
  {
    id: 'quinones_peru_jellyfish_bycatch_profit_2013', audit_index: 628,
    name: 'Quiñones et al. Peru Jellyfish Bycatch and Profit 2013', url: 'https://doi.org/10.1016/j.fishres.2012.04.014', access_classification: 'reference_only',
    fit: ['impact_evidence', 'jellyfish_swarm_surges', 'jellyfish_bloom_frequency_biomass_and_duration', 'peru_fishery_burden'],
    notes: 'Observer-based relative jellyfish catch biomass, processing rejection threshold, bounded duration and realized economic loss in a named southern-Peru anchovy fishery.'
  },
  {
    id: 'pices_jellyfish_working_group_peru_bycatch_2017', audit_index: 629,
    name: 'PICES Jellyfish Working Group Peru Bycatch Synthesis', url: 'https://www.pices.int/outgoing/2018-Climate/USB-files/Rpt51_Jellyfish.pdf', access_classification: 'reference_only',
    fit: ['impact_evidence', 'jellyfish_swarm_surges', 'jellyfish_bloom_frequency_biomass_and_duration', 'peru_rejected_catch_extent'],
    notes: 'Authoritative synthesis retaining haul shares, rejection events, discarded mass and bounded loss while separating extrapolated seasonal and national estimates.'
  },
  {
    id: 'simpson_london_urban_heat_island_mortality_2022', audit_index: 625,
    name: 'Simpson et al. London Urban Heat-Island Mortality 2022', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11334115/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'nighttime_heat_retention', 'nighttime_urban_rural_air_temperature_difference', 'london_uhi_mortality'],
    notes: 'Validated one-kilometre urban-climate counterfactual retaining the population-weighted temperature increment, its nighttime concentration, study period and attributable-mortality uncertainty.'
  },
  {
    id: 'simpson_london_summer_uhi_economic_burden_2018', audit_index: 626,
    name: 'Simpson et al. London Summer UHI Economic Burden 2018', url: 'https://www.sciencedirect.com/science/article/pii/S2542519625000257', access_classification: 'reference_only',
    fit: ['impact_evidence', 'nighttime_heat_retention', 'nighttime_urban_rural_air_temperature_difference', 'london_uhi_social_cost'],
    notes: 'Peer-reviewed summer-2018 UHI-attributable mortality, years of life lost and value-of-statistical-life burden; total heat burden remains separate.'
  },
  {
    id: 'gla_london_census_population_2021', audit_index: 627,
    name: 'GLA/ONS London Census Population 2021', url: 'https://data.london.gov.uk/dataset/2021-census-first-release-2n1y8/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'nighttime_heat_retention', 'greater_london_population_extent'],
    notes: 'Official Census 2021 population boundary used to retain the affected metropolitan extent without extrapolation.'
  },
  {
    id: 'eia_caiso_wind_solar_curtailment_2024', audit_index: 622,
    name: 'EIA CAISO Wind and Solar Curtailment 2024', url: 'https://www.eia.gov/todayinenergy/detail.php?id=65364', access_classification: 'reference_only',
    fit: ['impact_evidence', 'renewable_curtailment_losses', 'renewable_generation_curtailed', 'caiso_accumulated_impact'],
    notes: 'EIA synthesis of CAISO operational data with annual curtailed MWh, year-over-year change, solar share and WEIM avoided-curtailment context.'
  },
  {
    id: 'neso_annual_balancing_costs_report_2025', audit_index: 623,
    name: 'NESO 2025 Annual Balancing Costs Report', url: 'https://www.neso.energy/document/362561/download', access_classification: 'reference_only',
    fit: ['impact_evidence', 'renewable_curtailment_losses', 'renewable_generation_curtailed', 'gb_wind_curtailment_persistence'],
    notes: 'Official seven-financial-year wind-outturn and curtailment series reporting 13 percent of hypothetical wind outturn curtailed in 2024/25.'
  },
  {
    id: 'uk_desnz_reformed_national_pricing_delivery_plan_2026', audit_index: 624,
    name: 'UK DESNZ Reformed National Pricing Delivery Plan', url: 'https://www.gov.uk/government/publications/reformed-national-pricing-rnp-delivery-plan/reformed-national-pricing-rnp-delivery-plan-accessible-webpage', access_classification: 'reference_only',
    fit: ['impact_evidence', 'renewable_curtailment_losses', 'renewable_generation_curtailed', 'gb_constraint_cost_burden'],
    notes: 'Official realized 2024/25 wind turn-down and replacement-gas payments with explicit BSUoS consumer pass-through.'
  },
  {
    id: 'usda_ars_long_term_grazing_density_soil_compaction_2002', audit_index: 620,
    name: 'USDA ARS Long-Term Grazing Density Soil Compaction 2002', url: 'https://www.ars.usda.gov/research/publications/publication/?seqNo115=126586', access_classification: 'reference_only',
    fit: ['impact_evidence', 'cattle_grazing_overcompaction', 'grazing_soil_compaction', 'oklahoma_accumulated_impact'],
    notes: 'Ten-year controlled paddock experiment retaining cattle density, treatment duration, controls, soil depth, penetration and bulk-density response, and measured infiltration endpoints.'
  },
  {
    id: 'sruc_ahdb_dairy_cattle_trampling_soil_compaction', audit_index: 621,
    name: 'SRUC/AHDB Dairy Cattle-Trampling Soil Compaction Experiment', url: 'https://www.sruc.ac.uk/research/research-facilities/dairy-research-facility/dairy-projects/soil-compaction/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'cattle_grazing_overcompaction', 'grazing_soil_compaction', 'grass_yield_burden'],
    notes: 'Field experiment reports cattle-trampling-specific first-cut and year-three dry-matter yield losses. The larger tractor-compaction result is explicitly excluded from scoring.'
  },
  {
    id: 'singh_mishra_mumbai_watershed_deforestation_costs_2014', audit_index: 618,
    name: 'Singh and Mishra Mumbai Watershed Deforestation Costs 2014', url: 'https://doi.org/10.1016/j.gloenvcha.2014.04.020', access_classification: 'reference_only',
    fit: ['impact_evidence', 'watershed_forest_loss', 'tree_cover_loss_in_water_supply_watershed', 'mumbai_accumulated_impact'],
    notes: 'Peer-reviewed bounded-watershed study with a defined forest-cover method, six monitoring sites, separate forest/turbidity/plant observation periods and an estimated Panjrapur treatment burden. The receipt does not generalize the result globally.'
  },
  {
    id: 'teri_mumbai_watershed_deforestation_costs_summary_2014', audit_index: 619,
    name: 'TERI Mumbai Watershed Deforestation Costs Summary 2014', url: 'https://www.teriin.org/research-paper/deforestation-induced-costs-drinking-water-supplies-mumbai-metropolitan-india', access_classification: 'reference_only',
    fit: ['impact_evidence', 'watershed_forest_loss', 'tree_cover_loss_in_water_supply_watershed', 'mumbai_accumulated_impact'],
    notes: 'Author-institution summary corroborating the -0.0088 percent annual forest-cover change and INR 3.73 million annual Panjrapur burden in 2010-2011 prices. Elasticities are retained as unscored context.'
  },
  {
    id: 'epa_premium_standard_farms_multimedia_settlement_2001', audit_index: 616,
    name: 'EPA Premium Standard Farms Multimedia Settlement 2001', url: 'https://www.epa.gov/archive/epapages/newsroom_archive/newsreleases/db8bd3f214a2406d85256b0a0079a7ee.html', access_classification: 'reference_only',
    fit: ['impact_evidence', 'anaerobic_manure_lagoon_operation', 'manure_lagoon_loading_and_retention', 'missouri_accumulated_impact'],
    notes: 'EPA settlement quantifies the confined-swine portfolio, 163 lagoons, farm and county extent, paid penalties and required controls. Future spending and expected reductions are not scored.'
  },
  {
    id: 'epa_premium_standard_farms_consent_decree_2001', audit_index: 617,
    name: 'EPA Premium Standard Farms Consent Decree 2001', url: 'https://www.epa.gov/sites/default/files/documents/psfcd.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'anaerobic_manure_lagoon_operation', 'manure_lagoon_loading_and_retention', 'missouri_accumulated_impact'],
    notes: 'Consent decree confirms mixed swine facility classes, site-specific lagoon systems, predominantly single-stage anaerobic treatment and the 1988 operation start. Missing retention and nutrient loads are not imputed.'
  },
  {
    id: 'alaska_dcra_newtok_erosion_history', audit_index: 613,
    name: 'Alaska DCRA Newtok Erosion History', url: 'https://www.commerce.alaska.gov/web/dcra/ResiliencePlanningLandManagement/NewtokPlanningGroup/NewtokVillageRelocationHistory/NewtokHistoryPartTwo.aspx', access_classification: 'reference_only',
    fit: ['impact_evidence', 'riparian_zone_erosion', 'riparian_bank_erosion_and_retreat', 'newtok_accumulated_impact'],
    notes: 'State history preserves the repeat-aerial-shoreline method, named Ninglick north-bank reach and 68 ft/year village-front retreat. Faster upstream rates are not transferred to the scored reach.'
  },
  {
    id: 'gao_04_142_newtok_riverbank_erosion', audit_index: 614,
    name: 'GAO-04-142 Newtok Riverbank Erosion', url: 'https://www.gao.gov/assets/a240811.html', access_classification: 'reference_only',
    fit: ['impact_evidence', 'riparian_zone_erosion', 'riparian_bank_erosion_and_retreat', 'newtok_accumulated_impact'],
    notes: 'GAO documents cumulative land loss, village population and the failed sandbag-wall expenditure. Projected relocation costs remain unscored.'
  },
  {
    id: 'alaska_dcra_newtok_environmentally_threatened_community', audit_index: 615,
    name: 'Alaska DCRA Environmentally Threatened Community Newtok', url: 'https://www.commerce.alaska.gov/web/dcra/ResiliencePlanningLandManagement/EVCs', access_classification: 'reference_only',
    fit: ['impact_evidence', 'riparian_zone_erosion', 'riparian_bank_erosion_and_retreat', 'newtok_accumulated_impact'],
    notes: 'Current state record names three infrastructure types already lost and keeps permafrost, storm surge, flooding and sediment effects as interacting context rather than extra points.'
  },
  {
    id: 'kerala_2018_post_disaster_needs_assessment', audit_index: 610,
    name: 'Kerala 2018 Post-Disaster Needs Assessment', url: 'https://sdma.kerala.gov.in/wp-content/uploads/2019/03/PDNA-report-FINAL-FEB-2019_compressed.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'monsoon_volatility', 'monsoon_onset_and_seasonal_rainfall_variability', 'kerala_accumulated_impact'],
    notes: 'Government-led assessment matching Kerala’s seasonal rainfall anomaly to flooded districts, duration, population impacts and assessed damage. Dam operations and catchment conditions remain explicit compounding factors.'
  },
  {
    id: 'world_bank_kerala_state_partnership_2018_floods', audit_index: 611,
    name: 'World Bank Kerala State Partnership 2018 Floods', url: 'https://www.worldbank.org/en/country/india/brief/world-bank-kerala-state-partnership-breaks-new-ground-in-sub-national-strategic-engagement', access_classification: 'reference_only',
    fit: ['impact_evidence', 'monsoon_volatility', 'monsoon_onset_and_seasonal_rainfall_variability', 'kerala_accumulated_impact'],
    notes: 'World Bank review confirms the approximate USD 3.8 billion loss, affected population and road destruction for the bounded Kerala event.'
  },
  {
    id: 'imd_southwest_monsoon_2018_kerala_rainfall', audit_index: 612,
    name: 'India Meteorological Department Southwest Monsoon 2018 Kerala Rainfall', url: 'https://mausam.imd.gov.in/chennai/mcdata/sw_monsoon_2018.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'monsoon_volatility', 'monsoon_onset_and_seasonal_rainfall_variability', 'kerala_accumulated_impact'],
    notes: 'IMD report supplies district-week rainfall departures and national departure categories. The receipt scores the statewide seasonal anomaly, not the largest district-week outlier.'
  },
  {
    id: 'noaa_wpc_january_2021_california_atmospheric_river_review', audit_index: 608,
    name: 'NOAA WPC January 2021 California Atmospheric River Review', url: 'https://www.wpc.ncep.noaa.gov/storm_summaries/event_reviews.php?YYYYMMDD=20210129&product=h2', access_classification: 'reference_only',
    fit: ['impact_evidence', 'atmospheric_river_intensification', 'atmospheric_river_integrated_vapor_transport_intensity_and_duration', 'california_accumulated_impact'],
    notes: 'NOAA review supplies the matched IVT range, 24-48-hour duration, standardized departure and named category-2 algorithm. The corridor maximum is not generalized statewide.'
  },
  {
    id: 'noaa_ncei_california_flooding_severe_weather_january_2021', audit_index: 609,
    name: 'NOAA NCEI California Flooding and Severe Weather January 2021', url: 'https://www.ncei.noaa.gov/access/billions/state-summary/CA', access_classification: 'reference_only',
    fit: ['impact_evidence', 'atmospheric_river_intensification', 'atmospheric_river_integrated_vapor_transport_intensity_and_duration', 'california_accumulated_impact'],
    notes: 'NCEI disaster record supplies CPI-adjusted loss, deaths, event dates and two named extreme-rainfall counties. The receipt keeps the disaster window distinct from the shorter high-IVT interval.'
  },
  {
    id: 'california_board_forestry_2020_annual_report_lightning_siege', audit_index: 605,
    name: 'California Board of Forestry 2020 Lightning Siege', url: 'https://cdnverify.bof.fire.ca.gov/media/fofgvmj3/corrected-2020-bof-annual-report.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'lightning_fire_weather', 'dry_lightning_fire_weather_events', 'california_accumulated_impact'],
    notes: 'State report defining the August 15-30 lightning siege and quantifying strikes, wildfires, burned area, structures and fatalities within its stated CAL FIRE response boundary. Approximate and lower-bound qualifiers remain explicit.'
  },
  {
    id: 'caloes_august_september_2020_wildfire_incidents', audit_index: 606,
    name: 'California OES August September 2020 Wildfire Incidents', url: 'https://www.wildfirerecovery.caloes.ca.gov/past-incidents/august-september-2020-fires/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'lightning_fire_weather', 'dry_lightning_fire_weather_events', 'california_accumulated_impact'],
    notes: 'Cal OES record ties the mid-August complexes to lightning and fire weather and bounds the August 22 major-disaster declaration to seven counties. Later September declarations are excluded.'
  },
  {
    id: 'us_census_quickfacts_california_land_area_2020', audit_index: 607,
    name: 'U.S. Census QuickFacts California Land Area 2020', url: 'https://www.census.gov/quickfacts/fact/table/CA/POP010220', access_classification: 'reference_only',
    fit: ['normalization_denominator', 'lightning_fire_weather', 'dry_lightning_fire_weather_events', 'california_land_area'],
    notes: 'Official land-area denominator used to express the agency-reported statewide siege strike count per square kilometre. The derived density remains a statewide event average, not a uniform-grid observation.'
  },
  {
    id: 'usgs_professional_paper_1244_may_1978_floods', audit_index: 604,
    name: 'USGS Professional Paper 1244 May 1978 Floods', url: 'https://pubs.usgs.gov/pp/1244/report.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'hydrological_runoff_surges', 'runoff_event_peak_to_baseline_ratio', 'montana_wyoming_accumulated_impact'],
    notes: 'USGS event hydrographs support a within-gauge 4.60-times peak-to-antecedent-flow ratio alongside the event damage, eight-day reporting window and 19-county declaration extent. The receipt does not transfer the representative gauge ratio to other basins or inflation-adjust the historical damage total.'
  },
  {
    id: 'oregon_oah_biennial_report_2018_whiskey_creek', audit_index: 601,
    name: 'Oregon OAH Biennial Report 2018 Whiskey Creek', url: 'https://www.oregon.gov/lcd/Commission/Documents/2019-11_Item_5_OAH_ATTACH_A_BIENNIAL_REPORT_2018.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'shell_calcification_failures', 'carbonate_saturation_and_shellfish_growth_impairment', 'whiskey_creek_accumulated_impact'],
    notes: 'State assessment documenting at least 75 percent larval-culture reduction and the paired acidified-upwelling boundary. The receipt remains Pacific-oyster, larval-stage and hatchery specific.'
  },
  {
    id: 'noaa_changing_ocean_chemistry_whiskey_creek', audit_index: 602,
    name: 'NOAA Changing Ocean Chemistry Whiskey Creek Assessment', url: 'https://repository.library.noaa.gov/view/noaa/40601/noaa_40601_DS1.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'shell_calcification_failures', 'carbonate_saturation_and_shellfish_growth_impairment', 'whiskey_creek_accumulated_impact'],
    notes: 'NOAA technical input documenting the 2007 duration and 2008 output at 25 percent of normal. The receipt derives a larval-output shortfall without converting it to dollars or scoring the regional industry value.'
  },
  {
    id: 'noaa_oap_pacific_northwest_shellfish_acidification_2015', audit_index: 603,
    name: 'NOAA Pacific Northwest Shellfish Acidification Assessment 2015', url: 'https://oceanacidification.noaa.gov/oap_pubs/impacts-of-coastal-acidification-on-the-pacific-northwest-shellfish-industry-and-adaptation-strategies-implemented-in-response/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'shell_calcification_failures', 'carbonate_saturation_and_shellfish_growth_impairment', 'whiskey_creek_accumulated_impact'],
    notes: 'NOAA review of paired intake aragonite saturation and larval-cohort survival plus commercial adaptation. The 1.7 threshold is retained as hatchery- and life-stage-specific and is not transferred to other shellfish.'
  },
  {
    id: 'usgs_circular_1262_cape_may_saltwater_intrusion', audit_index: 599,
    name: 'USGS Circular 1262 Cape May Saltwater Intrusion', url: 'https://pubs.usgs.gov/circ/2003/circ1262/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'coastal_groundwater_withdrawal', 'coastal_groundwater_withdrawal', 'cape_may_accumulated_impact'],
    notes: 'USGS assessment directly linking withdrawals to hydraulic-head decline, intrusion across five aquifers and supply-well abandonment in named Cape May communities. The receipt preserves the maximum-versus-uniform distinction and does not extrapolate to other coastal systems.'
  },
  {
    id: 'usgs_wrir_01_4246_cape_may_water_supply_intrusion', audit_index: 600,
    name: 'USGS WRIR 01-4246 Cape May Water Supply and Intrusion', url: 'https://pubs.usgs.gov/wri/wri014246/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'coastal_groundwater_withdrawal', 'coastal_groundwater_withdrawal', 'cape_may_accumulated_impact'],
    notes: 'Detailed county water budget and well-abandonment record confirming coastal chloride increases and the fraction of southern recharge diverted to wells. Non-pumping chloride sources remain in uncertainty and are not silently assigned to withdrawal.'
  },
  {
    id: 'greater_london_authority_great_smog_70_year_review', audit_index: 597,
    name: 'Greater London Authority 70-Year Great Smog Review', url: 'https://www.london.gov.uk/programmes-strategies/environment-and-climate-change/environment-and-climate-change-publications/70-years-great-london-smog', access_classification: 'reference_only',
    fit: ['impact_evidence', 'particulate_soot_levels', 'ambient_black_carbon_concentration', 'london_accumulated_impact'],
    notes: 'Official review reporting the historical daily smoke concentration, excess mortality and five-day duration. The receipt retains the original smoke-method label, excludes sulfur dioxide from the particulate input and does not claim equivalence with modern elemental-carbon instruments.'
  },
  {
    id: 'uk_national_archives_ministry_health_great_smog_1952', audit_index: 598,
    name: 'UK Ministry of Health Great Smog Statement 1952', url: 'https://www.nationalarchives.gov.uk/education/resources/fifties-britain/smoke-laden-fog/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'particulate_soot_levels', 'ambient_black_carbon_concentration', 'london_accumulated_impact'],
    notes: 'Contemporaneous Ministry of Health statement preserving the Metropolitan London boundary, five-day event, death registrations and respiratory bed requests while cautioning against unsupported single-pollutant attribution. Context counts do not add urgency points.'
  },
  {
    id: 'usfs_california_tree_mortality_data_network_2019', audit_index: 595,
    name: 'USFS California Tree Mortality Data Collection Network', url: 'https://research.fs.usda.gov/treesearch/58215', access_classification: 'reference_only',
    fit: ['impact_evidence', 'forest_dieback_areas', 'forest_dieback_area_and_mortality', 'california_sierra_nevada_accumulated_impact'],
    notes: 'USFS synthesis of Aerial Detection Survey results documenting more than 147 million dead Sierra Nevada trees from 2010-2018 and the drought-dominated causal boundary. The receipt treats the count as a lower bound and does not substitute generic canopy change for mortality.'
  },
  {
    id: 'cpuc_pge_tree_mortality_cost_history_2016_2021', audit_index: 596,
    name: 'CPUC PG&E Tree Mortality Cost History 2016-2021', url: 'https://docs.cpuc.ca.gov/PublishedDocs/SupDoc/A2212009/6686/520107338.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'forest_dieback_areas', 'forest_dieback_area_and_mortality', 'california_sierra_nevada_accumulated_impact'],
    notes: 'Regulator filing with annual PG&E tree-mortality program costs and work units plus the ten CAL FIRE high-priority counties. The receipt excludes routine and enhanced vegetation-management costs and does not label the utility program total statewide damage.'
  },
  {
    id: 'fcc_2017_atlantic_hurricane_communications_report', audit_index: 593,
    name: 'FCC 2017 Atlantic Hurricane Communications Impact Report', url: 'https://docs.fcc.gov/public/attachments/DOC-353805A1.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'mobile_wireless_networks', 'mobile_site_energy_and_availability', 'puerto_rico_usvi_accumulated_impact'],
    notes: 'FCC post-season report quantifying peak cell-site outages, municipios with all sites out, six-month restoration and residual site outages. The receipt scores terrestrial wireless availability only, retains a prose/chart peak discrepancy and does not combine other communications services.'
  },
  {
    id: 'fcc_hurricane_maria_status_october_22_2017', audit_index: 594,
    name: 'FCC Hurricane Maria Communications Status Report October 22 2017', url: 'https://docs.fcc.gov/public/attachments/DOC-347354A1.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'mobile_wireless_networks', 'mobile_site_energy_and_availability', 'puerto_rico_usvi_accumulated_impact'],
    notes: 'FCC status report estimating wireless population coverage in Puerto Rico and the U.S. Virgin Islands. The receipt derives a bounded Puerto Rico coverage gap, preserves voluntary DIRS reporting limitations and does not treat the estimate as an individual outage census.'
  },
  {
    id: 'noaa_ncei_january_1996_blizzard_flood_report', audit_index: 591,
    name: 'NOAA January 1996 Blizzard and Flood Technical Report', url: 'https://www.ncei.noaa.gov/monitoring-content/billions/reports/19960101-19960131-winter-storm/tr9602.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'rain_on_snow_flood_risk', 'observed_streamflow_stage_relative_to_flood_threshold', 'us_accumulated_impact'],
    notes: 'NOAA technical report tying rain and rapid snowmelt to observed multi-basin flooding, crests up to 20 feet above flood stage, deaths, displacement and a lower-bound road and bridge damage estimate. The receipt does not label the infrastructure figure total damage.'
  },
  {
    id: 'usgs_pennsylvania_statewide_floods_january_1996', audit_index: 592,
    name: 'USGS Statewide Floods in Pennsylvania January 1996', url: 'https://www.usgs.gov/publications/statewide-floods-pennsylvania-january-1996', access_classification: 'reference_only',
    fit: ['impact_evidence', 'rain_on_snow_flood_risk', 'observed_streamflow_stage_relative_to_flood_threshold', 'us_accumulated_impact'],
    notes: 'USGS report documenting snow water equivalent, rainfall, rapid melt, monitored stream stages and discharges at 189 gauges, January 19-21 peak timing and ice-jam amplification. The receipt requires confirmed flooding and does not equate rain-on-snow occurrence with flood impact.'
  },
  {
    id: 'epa_doj_summit_blacktail_produced_water_spill_2021', audit_index: 589,
    name: 'EPA/DOJ Summit Blacktail Produced-Water Spill Enforcement', url: 'https://www.epa.gov/newsreleases/north-dakota-pipeline-company-pay-35-million-criminal-fines-and-civil-penalties', access_classification: 'reference_only',
    fit: ['impact_evidence', 'fracking_wastewater_lakes', 'fracking_wastewater_risk', 'us_accumulated_impact'],
    notes: 'Federal enforcement record reporting 29 million gallons released over 143 days, more than 30 miles of contaminated Missouri River tributaries and USD 35 million in criminal fines and civil penalties. The receipt labels penalties as penalties, not total damages.'
  },
  {
    id: 'usgs_blacktail_creek_wastewater_persistence_2021', audit_index: 590,
    name: 'USGS Blacktail Creek Wastewater Persistence Study', url: 'https://www.usgs.gov/programs/environmental-health-program/science/geochemical-signatures-oil-and-gas-wastewater', access_classification: 'reference_only',
    fit: ['impact_evidence', 'fracking_wastewater_lakes', 'fracking_wastewater_risk', 'us_accumulated_impact'],
    notes: 'USGS study detecting wastewater geochemical signatures as many as 2.5 years after the Blacktail Creek spill. Its earlier approximately 11-million-litre release estimate is retained as a discrepancy with the later enforcement volume and is not blended into the scored volume.'
  },
  {
    id: 'gao_26_109045_fema_flood_property_acquisitions', audit_index: 588,
    name: 'GAO-26-109045 FEMA Flood Property Acquisitions', url: 'https://files.gao.gov/reports/GAO-26-109045/index.html', access_classification: 'reference_only',
    fit: ['impact_evidence', 'managed_retreat_pressure', 'relocation_governance_capacity', 'properties_under_managed_retreat_consideration', 'planned_relocation_capacity_and_caseload', 'us_accumulated_impact'],
    notes: 'Audited FEMA totals for completed voluntary acquisitions, a period-specific cost average, and a bounded Hurricane Helene caseload with approved and still-pending applications. Receipts exclude general exposure and non-retreat mitigation, preserve pending cases as pending, and do not multiply the historical cost average by a mismatched caseload.'
  },
  {
    id: 'city_cape_town_water_outlook_2018', audit_index: 586,
    name: 'City of Cape Town Water Outlook 2018', url: 'https://resource.capetown.gov.za/documentcentre/Documents/City%20research%20reports%20and%20review/Water%20Outlook%202018_Rev%2030_31%20December%202018.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'urban_water_demand_peak', 'urban_water_rationing_zones', 'cape_town_accumulated_impact'],
    notes: 'Municipal operational report preserving summer peak and actual demand, the restricted target, formal Level 6B stage and per-person limit, represented population, dates and anticipated water-service revenue under-recovery. The receipt does not score the unrealized Day Zero contingency or broader provincial drought losses.'
  },
  {
    id: 'city_cape_town_level_3_restrictions_2018', audit_index: 587,
    name: 'City of Cape Town Level 3 Water Restrictions 2018', url: 'https://resource.capetown.gov.za/documentcentre/Documents/Procedures%2C%20guidelines%20and%20regulations/Water%20restrictions%20FAQs.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'urban_water_rationing_zones', 'formal_restriction_transition', 'cape_town_accumulated_impact'],
    notes: 'Municipal restriction FAQ confirming the October 2018 transition from Level 6B to Level 5 and December transition to Level 3. It is used to bound the formal Level 6B duration, not to infer rationing elsewhere.'
  },
  {
    id: 'ec_jrc_esdac_soil_compaction_assessment', audit_index: 583,
    name: 'European Soil Data Centre Soil Compaction Assessment', url: 'https://esdac.jrc.ec.europa.eu/themes/soil-compaction1', access_classification: 'reference_only',
    fit: ['impact_evidence', 'agricultural_soil_compaction', 'measured_bulk_density_and_packing_density', 'eu_uk_accumulated_impact'],
    notes: 'JRC assessment tying the compaction classification to measured LUCAS bulk-density cores and reporting measured yield reductions above 35 percent and effects detected 17 years after one event. Experimental loss and persistence are not assigned to every mapped pixel.'
  },
  {
    id: 'ec_jrc_euso_state_of_soils_2026_compaction', audit_index: 584,
    name: 'EUSO State of Soils 2026 Compaction Assessment', url: 'https://esdac.jrc.ec.europa.eu/public_path/EUSO/4rd-young-soil-researchers-forum/05_EUSO-report-launch_EU_AJ.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'agricultural_soil_compaction', 'packing_density_compacted_share', 'eu_uk_accumulated_impact'],
    notes: 'European Soil Observatory reporting 3.2 percent of arable land classified as compacted by packing density. The receipt preserves packing density as a modeled proxy rather than a direct measurement at every pixel.'
  },
  {
    id: 'ec_jrc_esdac_bulk_density_europe_2024', audit_index: 585,
    name: 'European Soil Data Centre Bulk Density in Europe', url: 'https://esdac.jrc.ec.europa.eu/content/soil-bulk-density-europe', access_classification: 'reference_only',
    fit: ['impact_evidence', 'agricultural_soil_compaction', 'measured_bulk_density_and_packing_density', 'eu_uk_accumulated_impact'],
    notes: 'LUCAS 2018 dataset with 6,140 samples at 0-10 cm and 5,684 at 10-20 cm, spatialized to 100 m across the EU and UK. The receipt retains the reported model R-squared and does not infer compaction from land use alone.'
  },
  {
    id: 'ntsb_enbridge_marshall_pipeline_release_2012', audit_index: 580,
    name: 'NTSB Enbridge Marshall Pipeline Release', url: 'https://www.ntsb.gov/investigations/Pages/DCA10MP007.aspx', access_classification: 'reference_only',
    fit: ['impact_evidence', 'inland_waterway_fuel_spills', 'inland_waterway_oil_discharge', 'us_accumulated_impact'],
    notes: 'NTSB accident record reporting the revised 843,444-gallon crude-oil release, continuing cleanup costs above USD 767 million and about 320 people reporting exposure-consistent symptoms. The receipt treats the cost as a lower bound and does not infer a national spill inventory.'
  },
  {
    id: 'phmsa_enbridge_marshall_spill_record', audit_index: 581,
    name: 'PHMSA Enbridge Spill near Marshall, Michigan', url: 'https://www.phmsa.dot.gov/safety-awareness/pipeline/enbridge-spill-near-marshall-mi', access_classification: 'reference_only',
    fit: ['impact_evidence', 'inland_waterway_fuel_spills', 'inland_waterway_oil_discharge', 'us_accumulated_impact'],
    notes: 'PHMSA incident record corroborating the revised released volume and EPA-directed cleanup across more than 30 miles of the Kalamazoo River. Pipeline presence, capacity and traffic are not converted into releases.'
  },
  {
    id: 'epa_enbridge_kalamazoo_response_2010_2014', audit_index: 582,
    name: 'EPA Enbridge Kalamazoo Response 2010-2014', url: 'https://www.epa.gov/enbridge-spill-michigan', access_classification: 'reference_only',
    fit: ['impact_evidence', 'inland_waterway_fuel_spills', 'inland_waterway_oil_discharge', 'us_accumulated_impact'],
    notes: 'EPA response record documenting recovery and dredging from 2010 through 2014 and an at-least-35-mile downstream footprint. The duration is cleanup persistence, not a claim that ecological effects ended in 2014.'
  },
  {
    id: 'fws_four_imperiled_freshwater_mussel_recovery_plan_2024', audit_index: 579,
    name: 'FWS Four Imperiled Freshwater Mussels Recovery Plan 2024', url: 'https://ecos.fws.gov/docs/recovery_plan/20240911_4Mussels%20Recovery%20Plan%20FINAL.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'freshwater_mussel_depletion', 'freshwater_mussel_population_and_recruitment', 'north_american_accumulated_impact'],
    notes: 'Checksum-bound Fish & Wildlife Service plan reporting species-specific historical and current occurrence, recovery-action cost and 50-year anticipated recovery horizon. Unlike occurrence units remain separate; recovery cost is not labeled total ecological-service loss.'
  },
  {
    id: 'usgs_northern_alaska_shoreline_change_2015', audit_index: 577,
    name: 'USGS Northern Alaska Shoreline Change Assessment', url: 'https://www.usgs.gov/centers/pcmsc/news/northern-alaska-coastal-erosion-threatens-habitat-and-infrastructure', access_classification: 'reference_only',
    fit: ['impact_evidence', 'coastal_permafrost_erosion', 'coastal_permafrost_retreat', 'us_accumulated_impact'],
    notes: 'USGS assessment of more than 1,600 km of northern Alaska Arctic coast over more than half a century. The receipt scores the net 1.4 m/year regional retreat rate and retains strong spatial variability and one-country coverage.'
  },
  {
    id: 'gao_09_551_alaska_village_erosion_relocation', audit_index: 578,
    name: 'GAO-09-551 Alaska Village Erosion Relocation Assessment', url: 'https://www.gao.gov/products/gao-09-551', access_classification: 'open_download',
    fit: ['impact_evidence', 'coastal_permafrost_erosion', 'associated_relocation_burden', 'us_accumulated_impact'],
    notes: 'GAO report of Army Corps relocation-cost ranges for Kivalina, Newtok and Shishmaref. The receipt uses the three-village lower bound and labels it associated compound coastal flooding and erosion burden rather than permafrost-only attribution.'
  },
  {
    id: 'gao_02_136_fish_passage_barrier_culverts', audit_index: 576,
    name: 'GAO-02-136 Fish-Passage Barrier Culvert Assessment', url: 'https://www.gao.gov/products/gao-02-136', access_classification: 'open_download',
    fit: ['impact_evidence', 'road_stream_crossing_barriers', 'road_stream_crossing_passage_impairment', 'us_accumulated_impact'],
    notes: 'Audited federal-land inventory in Oregon and Washington preserving assessed, identified and separately estimated barrier culverts, agency restoration costs and backlog-duration estimates. Unassessed crossings remain unknown, and the bounded inventory is not expanded to national or global coverage.'
  },
  {
    id: 'cdc_atlanta_allergenic_pollen_trends_1992_2018', audit_index: 575,
    name: 'CDC Atlanta Allergenic Pollen Trends 1992-2018', url: 'https://stacks.cdc.gov/view/cdc/124827', access_classification: 'open_download',
    fit: ['impact_evidence', 'pollen_allergen_spikes', 'airborne_allergenic_pollen_exposure', 'local_accumulated_impact'],
    notes: 'Checksum-bound peer-reviewed 27-year station study reporting grains per cubic metre, seasonal peak concentration and taxon-specific trends. The receipt uses the median of significant increasing peak trends, keeps national allergic-rhinitis burden non-attributable, and does not equate season length with intensity.'
  },
  {
    id: 'usfs_ids_bark_beetle_mortality_2021_2025', audit_index: 573,
    name: 'USDA Forest Service IDS Bark-Beetle Mortality Areas 2021-2025', url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_InsectandDiseaseSurvey_01/MapServer/1', access_classification: 'open_api',
    fit: ['impact_evidence', 'bark_beetle_epidemics', 'bark_beetle_mortality_extent', 'us_accumulated_impact'],
    notes: 'Checksum-bound grouped API responses under an explicit mortality-and-beetle agent filter. Annual acres remain mapped acre-observations, mixed root-disease records are excluded, and incomplete detection or overlapping annual polygons are not converted into unique cumulative land or killed-tree counts.'
  },
  {
    id: 'usfs_bark_beetle_economic_impact_2019', audit_index: 574,
    name: 'Forest Service Bark Beetle Economic Impact Study', url: 'https://research.fs.usda.gov/treesearch/59043', access_classification: 'open_download',
    fit: ['impact_evidence', 'bark_beetle_epidemics', 'bark_beetle_mortality_extent', 'us_accumulated_impact'],
    notes: 'Checksum-bound peer-reviewed study hosted by the Forest Service, retaining the USD 1.2 billion southern-pine-beetle producer-loss estimate and 28-year period as a bounded historical subset rather than a valuation of current IDS polygons.'
  },
  {
    id: 'usgs_estimated_water_use_2015_circular_1441', audit_index: 572,
    name: 'USGS Estimated Use of Water in the United States 2015', url: 'https://www.usgs.gov/publications/estimated-use-water-united-states-2015', access_classification: 'open_download',
    fit: ['impact_evidence', 'cooling_water_competition', 'thermoelectric_cooling_water_withdrawal_and_consumption', 'us_accumulated_impact'],
    notes: 'Checksum-bound Circular 1441 quantifying thermoelectric withdrawals, consumption and freshwater-use shares. The receipt separates consumptive use from returned gross flow, excludes saline water from the freshwater-competition score and retains the 2015 endpoint.'
  },
  {
    id: 'eia112_residential_utility_disconnection_microdata_2024', audit_index: 570,
    name: 'EIA-112 Residential Utility Disconnection Microdata 2024', url: 'https://www.eia.gov/analysis/requests/residential/utility/', access_classification: 'open_download',
    fit: ['impact_evidence', 'utility_disconnection_risk', 'residential_utility_disconnections', 'us_accumulated_impact'],
    notes: 'Checksum-bound electricity and natural-gas workbooks covering 12 months and 51 state/district totals. The receipt sums State Total rows only, preserves EIA adjustments and treats results as service events rather than unique households.'
  },
  {
    id: 'eia112_residential_utility_disconnections_report_2024', audit_index: 571,
    name: 'EIA 2024 Residential Utility Disconnections Report', url: 'https://www.eia.gov/analysis/requests/residential/utility/pdf/Residential%20Utility%20Disconnections%20Report%20-%20April%202026.pdf', access_classification: 'open_download',
    fit: ['impact_evidence', 'metric_definition', 'utility_disconnection_risk', 'residential_utility_disconnections', 'us_accumulated_impact'],
    notes: 'Checksum-bound methodology report defining involuntary residential service shutoffs for bill nonpayment, response rates and imputation. One U.S. year supports impact fallback, not current global urgency.'
  },
  {
    id: 'iea_energy_efficiency_2022_energy_poverty', audit_index: 568,
    name: 'IEA Energy Efficiency 2022 Energy Poverty Assessment', url: 'https://www.iea.org/reports/energy-efficiency-2022/executive-summary', access_classification: 'open_download',
    fit: ['impact_evidence', 'energy_affordability_crisis', 'household_energy_burden', 'global_accumulated_impact'],
    notes: 'Checksum-bound official report quantifying 160 million additional households pushed into energy poverty since 2019 and more than USD 550 billion in emergency government support. The receipt excludes projected fuel switching, does not infer disconnections and retains the 2022 endpoint.'
  },
  {
    id: 'tracking_sdg7_2024_energy_access_reversal', audit_index: 569,
    name: 'Tracking SDG7 2024 Energy Access Reversal', url: 'https://www.worldbank.org/en/news/press-release/2024/06/11/progress-on-basic-energy-access-reverses-for-first-time-in-a-decade', access_classification: 'reference_only',
    fit: ['impact_evidence', 'energy_affordability_crisis', 'household_energy_burden', 'global_accumulated_impact'],
    notes: 'Official multi-agency global assessment reporting the first electricity-access reversal in more than a decade and retaining access, clean-cooking and health totals as context. Overlapping populations are not added to the scored IEA household burden.'
  },
  {
    id: 'epa_echo_national_cso_inventory_2026', audit_index: 565,
    name: 'EPA ECHO National Combined Sewer Overflow Inventory 2026', url: 'https://echo.epa.gov/tools/data-downloads/cso-inventory-summary', access_classification: 'open_download',
    fit: ['impact_evidence', 'combined_sewer_overflow', 'combined_sewer_overflow_event', 'us_accumulated_impact'],
    notes: 'Checksum-bound national outfall inventory. The receipt distinguishes active untreated/treated CSO outfalls from closed outfalls and uses the inventory as bounded context rather than event volume.'
  },
  {
    id: 'epa_echo_sewer_overflow_bypass_events_2026', audit_index: 566,
    name: 'EPA ECHO Sewer Overflow and Bypass Event Dataset 2026', url: 'https://echo.epa.gov/tools/data-downloads/sewer-overflow-download-summary', access_classification: 'open_download',
    fit: ['impact_evidence', 'combined_sewer_overflow', 'wastewater_bypass_discharge', 'wastewater_infrastructure_overflow', 'us_accumulated_impact'],
    notes: 'Checksum-bound current-version event, type and impact tables. Receipts exclude partial 2026, filter exact CSO/SSO/BYP codes, sum only reported volume, and preserve EPA’s incomplete-national-implementation caveat.'
  },
  {
    id: 'epa_cso_annual_volume_and_population_assessment', audit_index: 567,
    name: 'EPA CSO Annual Volume and Population Assessment', url: 'https://www.epa.gov/caddis/urbanization-wastewater-inputs', access_classification: 'reference_only',
    fit: ['impact_evidence', 'combined_sewer_overflow', 'wastewater_infrastructure_overflow'],
    notes: 'Official national context for estimated annual untreated CSO volume and population served. The estimate is not added to event-reported gallons, preventing double counting across unlike periods.'
  },
  {
    id: 'bts_airline_delay_cause_2025', audit_index: 563,
    name: 'BTS Airline Delay Cause Raw Data 2025', url: 'https://www.transtats.bts.gov/OT_Delay/ot_delaycause1.asp', access_classification: 'open_download',
    fit: ['impact_evidence', 'airport_operational_disruption', 'weather_attributed_airport_delay_and_cancellation', 'us_accumulated_impact'],
    notes: 'Checksum-bound carrier-airport-month raw table for all 12 months of 2025. The receipt aggregates weather-attributed prorated flight equivalents and delay minutes and excludes cancellations because their weather cause is not allocated in this table.'
  },
  {
    id: 'bts_airline_delay_cause_definitions', audit_index: 564,
    name: 'BTS Airline Delay Cause Definitions', url: 'https://transtats.bts.gov/OT_Delay/ot_delaycause1.asp?pn=1&type=21', access_classification: 'reference_only',
    fit: ['metric_definition', 'airport_operational_disruption', 'weather_attributed_airport_delay_and_cancellation'],
    notes: 'Official BTS definition of a delayed arrival and prorated assignment of multiple delay causes. It supports the metric semantics but does not turn the U.S. network into global coverage.'
  },
  {
    id: 'noaa_ncei_storm_events_bulk_csv', audit_index: 561,
    name: 'NOAA NCEI Storm Events Bulk CSV', url: 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/', access_classification: 'open_download',
    fit: ['impact_evidence', 'hail_hazard_shift', 'flash_flood_regime', 'lightning_regime_shifts', 'us_accumulated_impact'],
    notes: 'Checksum-bound annual detail files filtered to exact Hail, Flash Flood and Lightning event types for complete years 2020-2025. Reported damage suffixes are converted to nominal dollars; missing values, direct/indirect casualties and geographic limits remain explicit.'
  },
  {
    id: 'noaa_ncei_storm_events_database_documentation', audit_index: 562,
    name: 'NOAA NCEI Storm Events Database Documentation', url: 'https://www.ncei.noaa.gov/stormevents/', access_classification: 'reference_only',
    fit: ['metric_definition', 'hail_hazard_shift', 'flash_flood_regime', 'lightning_regime_shifts'],
    notes: 'Official documentation identifies the inventory as the source for Storm Data and warns that collection procedures and periods of record vary. Receipts therefore use accumulated-impact fallback rather than a global current-climatology claim.'
  },
  {
    id: 'bsee_incident_investigations_raw_data', audit_index: 555,
    name: 'BSEE Incident Investigations Raw Data', url: 'https://www.data.bsee.gov/Other/DataTables/IncidentInvestigations.aspx', access_classification: 'open_download',
    fit: ['impact_evidence', 'deepwater_petroleum_spill_risk', 'deepwater_spill_risk_signal', 'us_accumulated_impact'],
    notes: 'Checksum-bound formal-investigation inventory joined to lease water depth. The receipt excludes unmatched rows and incomplete boundary years and counts category tags without treating them as exact release volumes, casualties or dollars.'
  },
  {
    id: 'bsee_offshore_statistics_water_depth_raw_data', audit_index: 556,
    name: 'BSEE Offshore Statistics by Water Depth Raw Data', url: 'https://www.data.bsee.gov/Leasing/OffshoreStatsbyWD/Default.aspx', access_classification: 'open_download',
    fit: ['metric_ingestion', 'deepwater_petroleum_spill_risk', 'deepwater_spill_risk_signal', 'us_accumulated_impact'],
    notes: 'Checksum-bound lease table supplying maximum block water depth. It is joined by trimmed lease number and used only to identify leases at or above the BSEE deepwater convention.'
  },
  {
    id: 'bsee_offshore_spill_occurrence_rates_2016', audit_index: 557,
    name: 'BSEE 2016 Offshore Oil Spill Occurrence Rates', url: 'https://www.bsee.gov/sites/bsee.gov/files/osrr-oil-spill-response-research/1086aa.pdf', access_classification: 'reference_only',
    fit: ['impact_evidence', 'deepwater_petroleum_spill_risk', 'deepwater_spill_risk_signal'],
    notes: 'Official retrospective quantifying OCS platform spill burden and identifying Deepwater Horizon as the dominant release. The receipt does not transfer all-OCS volume to every deepwater investigation.'
  },
  {
    id: 'deepwater_horizon_trustee_council_2020_statement', audit_index: 558,
    name: 'Deepwater Horizon Trustee Council Ten-Year Statement', url: 'https://www.gulfspillrestoration.noaa.gov/2020/04/ten-years-after-deepwater-horizon-statement-natural-resource-damage-assessment-trustee', access_classification: 'reference_only',
    fit: ['impact_evidence', 'deepwater_petroleum_spill_risk', 'deepwater_spill_risk_signal'],
    notes: 'Official natural-resource trustees record deaths, injuries, the restoration settlement and its multi-year payment period for the landmark deepwater loss-of-containment event.'
  },
  {
    id: 'deepwater_horizon_trustee_council_2023_restoration', audit_index: 560,
    name: 'Deepwater Horizon Trustee Council Restoration Progress', url: 'https://www.gulfspillrestoration.noaa.gov/2023/04/thirteen-years-after-deepwater-horizon-restoration-makes-progress', access_classification: 'reference_only',
    fit: ['impact_evidence', 'deepwater_petroleum_spill_risk', 'deepwater_spill_risk_signal'],
    notes: 'Official natural-resource trustees quantify the approximately 3.2-million-barrel release and continuing restoration thirteen years after the event.'
  },
  {
    id: 'usdoj_deepwater_horizon_civil_settlement', audit_index: 559,
    name: 'U.S. DOJ Deepwater Horizon Civil Settlement', url: 'https://www.justice.gov/archives/opa/pr/us-and-five-gulf-states-reach-historic-settlement-bp-resolve-civil-lawsuit-over-deepwater', access_classification: 'reference_only',
    fit: ['impact_evidence', 'deepwater_petroleum_spill_risk', 'deepwater_spill_risk_signal'],
    notes: 'Official civil-resolution value covering Clean Water Act, natural-resource, state and local economic claims. It quantifies accumulated liability, not current global spill probability.'
  },
  {
    id: 'dot_fra_form54_rail_equipment_accidents', audit_index: 552,
    name: 'DOT FRA Form 54 Rail Equipment Accidents', url: 'https://data.transportation.gov/Railroads/Rail-Equipment-Accident-Incident-Data-Form-54-/85tf-25kj', access_classification: 'open_api',
    fit: ['impact_evidence', 'rail_heat_buckling', 'rail_heat_restriction_and_buckle_events', 'us_accumulated_impact'],
    notes: 'Current public FRA administrative API filtered to official cause code T109. The receipt removes exact duplicate selected-field rows, excludes incomplete 2026 from scored totals, retains nominal damage and casualties separately, and does not infer unreported heat restrictions.'
  },
  {
    id: 'fra_train_accident_cause_codes_t109', audit_index: 553,
    name: 'FRA Train Accident Cause Codes T109', url: 'https://railroads.dot.gov/forms-guides-publications/guides/train-accident-cause-codes', access_classification: 'reference_only',
    fit: ['metric_definition', 'rail_heat_buckling', 'rail_heat_restriction_and_buckle_events'],
    notes: 'Official FRA codebook defining T109 as track alignment irregular (buckled/sunkink). The code establishes event semantics but does not prove ambient heat was the sole cause of every record.'
  },
  {
    id: 'fra_safety_advisory_2023_07_weather_rail', audit_index: 554,
    name: 'FRA Safety Advisory 2023-07', url: 'https://www.federalregister.gov/d/2023-25924', access_classification: 'reference_only',
    fit: ['impact_evidence', 'rail_heat_buckling', 'rail_heat_restriction_and_buckle_events'],
    notes: 'Official advisory independently reporting 49 T109 incidents and 40 mainline derailments from January 2021 through July 2023, and describing severe-heat rail buckling and sun-kink risks.'
  },
  {
    id: 'ceds_v2024_04_01_release_emission_data', audit_index: 550,
    name: 'CEDS v_2024_04_01 Release Emission Data', url: 'https://zenodo.org/records/10904361', access_classification: 'open_download',
    fit: ['metric_ingestion', 'coal_power_sulfur_emissions', 'coal_egu_so2_emission', 'global_current_data'],
    notes: 'Checksum-bound CEDS aggregate archive with global annual SO2 separated by sector and fuel. The operational snapshot sums public and autoproducer electricity rows for brown coal, hard coal and coal coke from 1970-2022; heat production and non-coal fuels remain excluded.'
  },
  {
    id: 'mcduffie_ceds_sector_fuel_specific_inventory_2020', audit_index: 551,
    name: 'CEDS Sector- and Fuel-Specific Global Emission Inventory', url: 'https://doi.org/10.5194/essd-12-3413-2020', access_classification: 'reference_only',
    fit: ['methodology_evidence', 'coal_power_sulfur_emissions', 'coal_egu_so2_emission', 'global_current_data'],
    notes: 'Peer-reviewed CEDS methodology and validation for annual country, sector and fuel-specific anthropogenic air-pollutant emissions. Inventory estimates, fuel allocation and uncertainty remain explicit in the score receipt.'
  },
  {
    id: 'iea_global_industry_transition_assessments', audit_index: 481,
    name: 'IEA Global Industry Transition Assessments', url: 'https://www.iea.org/reports/breakthrough-agenda-report-2025', access_classification: 'reference_only',
    fit: ['impact_evidence', 'steel', 'cement_concrete', 'industrial_heat_decarbonization_gap', 'construction_material_co2'],
    notes: 'Reviewed IEA global steel, cement, heavy-industry and industrial-heat assessment values; scenarios and announced capacity remain separately labeled.'
  },
  {
    id: 'unep_wcmc_global_ecological_connectivity_assessment', audit_index: 480,
    name: 'UNEP WCMC Global Ecological Connectivity Assessment', url: 'https://www.unep-wcmc.org/en/news/life-on-a-connected-planet', access_classification: 'reference_only',
    fit: ['impact_evidence', 'forest_fragmentation', 'wildlife_habitat_patches', 'biodiversity_corridors_disruption'],
    notes: 'Reviewed global structural-connectivity assessment; functional movement and species-specific outcomes are not inferred.'
  },
  {
    id: 'global_free_flowing_rivers_assessment_2019', audit_index: 479,
    name: 'Global Free Flowing Rivers Assessment 2019', url: 'https://pubmed.ncbi.nlm.nih.gov/31068722/', access_classification: 'reference_only',
    fit: ['impact_evidence', 'riverine_habitat_fragmentation', 'dam_and_diversion_infrastructure'],
    notes: 'Peer-reviewed global long-river connectivity assessment with barrier and service boundaries retained.'
  },
  {
    id: 'who_unicef_jmp_2025', audit_index: 478,
    name: 'WHO UNICEF JMP 2025', url: 'https://www.who.int/publications/b/80981', access_classification: 'reference_only',
    fit: ['impact_evidence', 'drinking_water_treatment_stress', 'global_safely_managed_drinking_water_service_gap'],
    notes: 'Official global drinking-water service assessment; accessibility, availability and quality dimensions remain distinct.'
  },
  {
    id: 'world_bank_global_non_revenue_water_assessment', audit_index: 477,
    name: 'World Bank Global Non Revenue Water Assessment', url: 'https://blogs.worldbank.org/en/ppps/what-do-private-companies-look-performance-based-non-revenue-water-project', access_classification: 'reference_only',
    fit: ['impact_evidence', 'urban_distribution_water_loss', 'global_non_revenue_water_volume'],
    notes: 'Reviewed global annual non-revenue-water volume and economic-loss assessment; physical and commercial losses are not conflated.'
  },
  {
    audit_index: 476,
    name: 'UNESCO FAO Global Groundwater Irrigation Impact',
    url: 'https://www.unesco.org/reports/wwdr/2022/en',
    access_classification: 'reference_only',
    fit: ['impact_evidence', 'aquifer_overdraft', 'agricultural_groundwater_withdrawal', 'municipal_groundwater_withdrawal', 'irrigation_water_inefficiency', 'global_accumulated_impact'],
    notes: 'Official UNESCO/UN-Water and FAO synthesis retaining the 100-200 cubic-kilometre annual global depletion range, groundwater abstraction shares, domestic and irrigation dependence, irrigation-withdrawal loss lower bound and assessment-country coverage separately. Sector shares are not converted into attributed depletion, dependence is not shortage, and potentially recoverable return flow is not called destroyed water.'
  },
  {
    audit_index: 475,
    name: 'FAO Global Soil Salinity Impact',
    url: 'https://www.fao.org/newsroom/detail/fao-launches-first-major-global-assessment-of-salt-affected-soils-in-50-years/',
    access_classification: 'reference_only',
    fit: ['impact_evidence', 'topsoil_salinization_fields', 'root_zone_soil_electrical_conductivity_and_salt_affected_area', 'global_accumulated_impact'],
    notes: 'Official FAO global assessment retaining 1,381 million currently salt-affected hectares, 10.7 percent of global land, US$27.3 billion in annual crop-production loss, recurring annual farmland loss and worldwide scope separately. Additional area at risk, upper-bound country yield loss and population context are not added to the score.'
  },
  {
    audit_index: 474,
    name: 'UNEP Global Nutrient Pollution Impact',
    url: 'https://www.unep.org/facts-about-nitrogen-pollution',
    access_classification: 'reference_only',
    fit: ['impact_evidence', 'nutrient_pollution', 'nitrogen_fertilizer_runoff', 'estuary_eutrophication', 'anoxic_dead_zones', 'global_accumulated_impact'],
    notes: 'Official UNEP synthesis retaining annual reactive-nitrogen loss, the lost-resource cost, fertilizer nitrogen escape to rivers, worldwide eutrophication and dead-zone inventories, a fixed 1960-2008 accumulation interval and fisheries-system exposure. Counts are never converted to area, exposure is not realized loss and overlapping nitrogen pathways are not added.'
  },
  {
    audit_index: 473,
    name: 'FAO UNCCD Global Dryland Degradation Impact',
    url: 'https://www.fao.org/4/y5738e/y5738e06.htm',
    access_classification: 'reference_only',
    fit: ['impact_evidence', 'desertification_frontiers', 'dryland_land_degradation_extent_and_condition', 'global_accumulated_impact'],
    notes: 'Reviewed FAO and UNCCD assessment synthesis retaining 1.14 billion hectares affected by desertification, approximately 200 million people directly affected, an older desertification-only annual rate near 5.8 million hectares and more than 100 affected countries. Underlying assessment years, direct-versus-at-risk labels and newer combined desertification-and-drought context remain explicit; the artifact is impact fallback evidence and is not labeled current data.'
  },
  {
    audit_index: 472,
    name: 'NASA CERES EBAF-TOA Ed4.2.1 Global Monthly',
    url: 'https://ceres-tool.larc.nasa.gov/ord-tool/jsp/EBAFTOA421Selection.jsp',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'cloud_albedo_shift', 'satellite_cloud_radiative_effect_change', 'global_current_data'],
    notes: 'Official NASA CERES source-native global monthly EBAF-TOA Ed4.2.1 outgoing shortwave all-sky and clear-sky flux arrays from March 2000 onward. The operational snapshot retains the exact product and variable identities, derives signed shortwave cloud radiative effect as clear-sky minus all-sky flux, and excludes partial calendar years from historical normalization; it is not used as evidence for marine low-cloud-deck retreat or cloud-feedback attribution.'
  },
  {
    audit_index: 471,
    name: 'World Bank WDI Global PM2.5 Exposure',
    url: 'https://data.worldbank.org/indicator/EN.ATM.PM25.MC.M3',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'pm2_5_particulates', 'ambient_pm25_concentration', 'global_current_data'],
    notes: 'Official World Bank WDI World aggregate for population-weighted mean annual PM2.5 exposure, sourced from Global Burden of Disease 2023. The operational snapshot retains 34 consecutive annual estimates for 1990-2023, source-update metadata and WHO 2021 annual AQG/interim-target anchors; model-estimation and observation-lag caveats remain internal metadata.'
  },
  {
    audit_index: 470,
    name: 'RAPID AMOC 26N Transport Time Series',
    url: 'https://rapid.ac.uk/data/integrated-transports',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'amoc', 'amoc_overturning_transport', 'global_current_data'],
    notes: 'Official RAPID-MOCHA-WBTS full-basin-width AMOC transport at 26.5N with a current BODC DOI archive. The operational snapshot retains the source NetCDF checksum, finite half-daily moc_mar_hc10 values, coverage-qualified monthly means and the source publication lag; fill values are never converted to zero and a low month is not labeled a collapse or long-term trend.'
  },
  {
    audit_index: 469,
    name: 'FAOSTAT World Cereal Feed Share',
    url: 'https://www.fao.org/faostat/en/#data/FBS',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'feed_crop_dependency', 'livestock_feed_crop_use_share', 'global_current_data'],
    notes: 'Checksum-bound World Food Balance Sheet feed and domestic-supply rows for the exact Cereals - Excluding Beer basket. Current 2010-2023 values remain unchanged; a quantified 2010-2013 overlap crosswalk harmonizes the official 1961-2013 historical edition only for percentile normalization.'
  },
  {
    audit_index: 468,
    name: 'FAOSTAT Cereal Import Dependency and Population 2026',
    url: 'https://www.fao.org/faostat/en/#data/FS',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'food_import_exposure', 'food_import_dependency_ratio', 'global_current_data'],
    notes: 'Checksum-bound FAOSTAT Food Security and Population pair retaining 22 complete population-weighted country dependency distributions through 2021-2023. Signed net-exporter ratios remain intact, high-dependency exposure is population-weighted, and the near-zero World net-trade ratio is explicitly excluded as an exposure measure.'
  },
  {
    audit_index: 467,
    name: 'FAOSTAT Fertilizer Product Output 2026',
    url: 'https://www.fao.org/faostat/en/#data/RFB',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'fertilizer_production', 'fertilizer_product_output', 'global_current_data'],
    notes: 'Checksum-bound FAOSTAT Fertilizers by Product release retaining 15 separate product classes with 22 complete global annual reported totals through 2023. Country and territory rows are aggregated only within product and year; product masses are never summed or relabeled as nutrient content, and the incomplete 2024 panel is withheld.'
  },
  {
    audit_index: 466,
    name: 'IPCC AR6 Global Aerosol ERF Time Series',
    url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'aerosol_cooling_loss', 'anthropogenic_aerosol_effective_radiative_forcing', 'global_current_data'],
    notes: 'Checksum-bound IPCC AR6 Chapter 7 author output with 270 annual global effective-radiative-forcing values through 2019. The scoring snapshot retains exact 1990-2019 aerosol-radiation, aerosol-cloud and total-aerosol columns, historical-percentile calculations, and the published uncertainty boundary; emissions and regional aerosol trends are excluded.'
  },
  {
    audit_index: 465,
    name: 'Global Ocean Stratification Observation Assessment',
    url: 'https://www.nature.com/articles/s41558-020-00918-2',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'thermal_stratification_intensification', 'upper_ocean_density_stratification', 'global_current_data'],
    notes: 'Peer-reviewed global 0-2,000 m ocean density-stratification assessment with checksum-bound 1960-2018 annual Figure 3 source data, uncertainty bounds and a 2025 review update through 2024. Historical percentiles use the source annual series; projections are excluded.'
  },
  {
    audit_index: 464,
    name: 'FAO Global Topsoil Erosion Burden',
    url: 'https://www.fao.org/newsroom/detail/Global-Soil-Partnership-endorses-guidelines-on-sustainable-soil-management/en',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'topsoil_erosion_acceleration', 'soil_erosion_rate', 'global_accumulated_impact'],
    notes: 'Official FAO Global Soil Partnership summary retaining global annual arable-soil loss and associated agricultural-production loss. The burden snapshot does not infer a comparable current trend, remaining topsoil stock or country-level rates.'
  },
  {
    audit_index: 463,
    name: 'Global Flood Exposure Observation and Poverty Studies',
    url: 'https://www.nature.com/articles/s41586-021-03695-w',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'floodplain_exposure', 'population_and_assets_in_floodplain', 'global_accumulated_impact'],
    notes: 'Peer-reviewed global pair: satellite observations quantify 913 large floods, inundated area and directly affected population during 2000-2018; a World Bank-led 188-country assessment quantifies current population and poverty exposure inside a declared 1-in-100-year, >0.15 m flood zone. Observed impacts and modeled exposure remain separate.'
  },
  {
    audit_index: 462,
    name: 'UNDRR Disaster Risk Reduction in Least Developed Countries',
    url: 'https://www.undrr.org/implementing-sendai-framework/sendai-framework-action/disaster-risk-reduction-least-developed-countries',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'disaster_recovery_inequality', 'global_accumulated_impact', 'cross_income_disaster_burden'],
    notes: 'Official UNDRR Sendai monitoring summary retaining 2015-2024 LDC and global mortality rates, direct economic loss relative to GDP and the 42-of-44 reporting denominator; it does not infer household recovery time or protected-class outcomes.'
  },
  {
    audit_index: 461,
    name: 'FAO FishStat Global Marine Capture 2026',
    url: 'https://www.fao.org/fishery/static/FishStatJ/FAO_FI_Global_Production_2026.1.0.fws',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'fish_landing_supply_disruption', 'marine_fish_landings_shortfall', 'global_annual_history'],
    notes: 'Official FAO FishStat 2026.1.0 marine capture quantities. The checksum-bound snapshot filters tonnes live weight, marine fishing areas and the SOFIA aquatic-animal category, preserves a 34-year complete series and excludes inland capture and aquaculture.'
  },
  {
    audit_index: 460,
    name: 'Global In-Situ Groundwater Level Trends Study',
    url: 'https://www.nature.com/articles/s41586-023-06879-8',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'groundwater_depletion', 'usgs_groundwater_level_observation', 'global_current_data'],
    notes: 'Peer-reviewed primary aggregation of about 170,000 wells and 1,693 aquifer systems. The snapshot preserves published decline bins, acceleration subset, withdrawal coverage and recovery counterevidence without converting level change to storage volume.'
  },
  {
    audit_index: 459,
    name: 'Global Pollinator Deficits and Health Burden Study',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36515549/',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'pollinator_service_decline', 'crop_pollination_service_deficit', 'global_accumulated_impact'],
    notes: 'Peer-reviewed global study indexed by the US National Library of Medicine. The reviewed snapshot preserves crop-loss and annual-mortality uncertainty intervals, model boundaries and global-by-country scope; pollination-dependent production value is excluded from realized burden.'
  },
  {
    audit_index: 458,
    name: 'UNDRR Sendai Midterm Critical Infrastructure Impacts',
    url: 'https://www.undrr.org/publication/report-midterm-review-implementation-sendai-framework-disaster-risk-reduction-2015-2030',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'critical_infrastructure_fragility', 'eia_oe417_reported_customer_interruption_burden', 'accumulated_impact'],
    notes: 'Official UNDRR Target D assessment retaining annual-average damaged facilities, fixed-period basic-service disruptions and reporting-country coverage separately; modeled global losses stay context-only.'
  },
  {
    audit_index: 457,
    name: 'WMO UNEP Global Coastal Inundation Assessments',
    url: 'https://public.wmo.int/sites/default/files/2025-11/State%20of%20the%20Climate%202025%20Update%20COP30%20%2831%20oct%29.pdf',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'coastal_inundation_risk', 'storm_surge_threshold_exposure', 'global_accumulated_impact'],
    notes: 'Official WMO observed global sea-level rate and current low-lying-coast exposure paired with UNEP additional current coastal-flood exposure; future exposure and asset projections are excluded.'
  },
  {
    audit_index: 456,
    name: 'IOC UNESCO Global Ocean Oxygen Network',
    url: 'https://www.ioc.unesco.org/en/go2ne',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'coastal_hypoxia', 'oceanic_deoxygenation', 'global_accumulated_impact'],
    notes: 'Official IOC-UNESCO synthesis retaining the open-ocean low-oxygen area increase and inventoried coastal low-oxygen sites separately. Site count is never converted to global hypoxic area.'
  },
  {
    audit_index: 455,
    name: 'Ramsar Global Wetland Outlook 2025',
    url: 'https://www.global-wetland-outlook.ramsar.org/',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'wetlands_drainage_scales', 'wetland_area_drained_or_converted', 'global_accumulated_impact'],
    notes: 'Official Convention on Wetlands global assessment retaining 1970-2025 area loss, ongoing annual decline, remaining-condition share, accumulated service-value loss and worldwide assessment scope separately.'
  },
  {
    audit_index: 454,
    name: 'UNDRR GAR 2025 Global Drought Impacts',
    url: 'https://www.undrr.org/gar/gar2025/hazard-exploration/droughts',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'drought_persistence', 'drought_event_duration_spi6', 'global_accumulated_impact'],
    notes: 'Official UNDRR global drought assessment with a 20-year occurrence trend, fixed-decade affected-population and recorded-cost boundary, and explicit all-region scope. Modeled annual losses remain context only.'
  },
  {
    audit_index: 453,
    name: 'WMO UNESCO Global Glacier Water Assessments',
    url: 'https://wmo.int/resources/publication-series/state-of-global-water-resources/state-of-global-water-resources-2024',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'glacier_meltwater_dependency', 'glacier_runoff_share_of_water_supply', 'global_accumulated_impact'],
    notes: 'Official WMO glacier mass-balance and UNESCO/UN-Water dependence findings. The reviewed snapshot retains glacier mass, glacier-plus-snow human exposure, consecutive loss years and the 19-region denominator separately.'
  },
  {
    audit_index: 452,
    name: 'Copernicus Marine Global Ocean pH',
    url: 'https://data.marine.copernicus.eu/product/GLOBAL_OMI_HEALTH_carbon_ph_area_averaged/services',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'ocean_acidification', 'surface_ocean_ph_and_aragonite_state', 'global_annual_history'],
    notes: 'Official Copernicus Marine annual area-averaged global surface-seawater pH indicator. The reviewed snapshot preserves the native dataset ID, NetCDF checksum, complete 1985-2024 series and source uncertainty without inferring aragonite saturation or local exposure.'
  },
  {
    audit_index: 451,
    name: 'WHO Global Cholera Emergency Updates',
    url: 'https://www.who.int/emergencies/situations/cholera-upsurge/',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'waterborne_pathogen_outbreaks', 'waterborne_outbreak_signal'],
    notes: 'Official WHO multi-country cholera and acute-watery-diarrhoea emergency reporting with cases, deaths, reporting periods, countries, regions, case-definition cautions, case-fatality calculation and global response status.'
  },
  {
    audit_index: 450,
    name: 'UNEP UN-Water Progress on Water-related Ecosystems 2024',
    url: 'https://www.unwater.org/publications/progress-water-related-ecosystems-2024-update',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'freshwater_ecosystem_collapse', 'river_flow_regime_shift', 'surface_water_inflow_deficit', 'surface_water_storage_instability', 'sdg_6_6_1'],
    notes: 'Official global SDG 6.6.1 assessment of freshwater ecosystem degradation, reduced river-flow basins and exposed population. The reviewed snapshot preserves country and basin denominators, avoids adding overlapping populations and does not treat unreported ecosystems as zero.'
  },
  {
    audit_index: 449,
    name: 'IPBES Global Biodiversity and Invasive Species Assessments',
    url: 'https://ict.ipbes.net/ipbes-ict-guide/data-and-knowledge-management/citations-of-ipbes-assessments',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'biodiversity_intactness_loss', 'invasive_species_encroachment', 'global_accumulated_impact'],
    notes: 'Official IPBES global assessment family. The reviewed snapshot preserves assessment years, lower bounds, price years, extinction attribution language and non-additive global extents; raw occurrence volume and future projections do not enter urgency.'
  },
  {
    audit_index: 448,
    name: 'WHO Global Air Pollution Data Portal',
    url: 'https://www.who.int/data/gho/data/themes/air-pollution',
    access_classification: 'open_portal',
    fit: ['metric_ingestion', 'air_pollution_health_burden', 'global_population_exposure', 'attributable_mortality'],
    notes: 'Official WHO global exposure and comparative-risk-assessment portal. The reviewed impact snapshot keeps joint ambient-household mortality separate from ambient-only country rates, retains assessment years and avoids unweighted aggregation of age-standardized country rates.'
  },
  {
    audit_index: 447,
    name: 'UNEP Blue Ecosystems Global Assessments',
    url: 'https://www.unep.org/topics/ocean-seas-and-coasts/blue-ecosystems',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'mangrove_buffer_loss', 'seagrass_meadow_decline', 'accumulated_ecosystem_impact'],
    notes: 'Official UNEP and UNEP-WCMC assessment values for mapped mangrove change, carbon-stock loss, economic damage, seagrass historical decline, population proximity and global country distribution. Future risk and restoration scenarios are excluded from scoring.'
  },
  {
    audit_index: 445,
    name: 'NASA Ozone Watch',
    url: 'https://ozonewatch.gsfc.nasa.gov/statistics/annual_data.html',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'stratospheric_chlorine_sinks', 'antarctic_ozone_hole', 'ozone_recovery'],
    notes: 'Official NASA annual Antarctic ozone-hole record from 1979 onward. The operational snapshot retains fixed seasonal windows, the recognized 220-DU threshold, the declared 1995 gap, area and minimum ozone separately, and the NASA satellite/assimilation boundary.'
  },
  {
    audit_index: 444,
    name: 'IEA Global Critical Minerals Outlook 2025',
    url: 'https://www.iea.org/reports/global-critical-minerals-outlook-2025',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'battery_supply_chain_pressure', 'battery_demand', 'supply_concentration'],
    notes: 'Official IEA global assessment. The reviewed snapshot retains 2024 battery demand, demand growth and observed production concentration by supply-chain stage; projected demand, announced capacity and future shortfalls are excluded from current scoring.'
  },
  {
    audit_index: 443,
    name: 'FAO State of Food Security and Nutrition 2025',
    url: 'https://www.fao.org/publications/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world/2025/en',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'food_insecurity', 'global_accumulated_human_burden', 'diet_affordability'],
    notes: 'Official joint-agency SOFI 2025 assessment. The reviewed snapshot retains 2024 hunger uncertainty, moderate or severe food-insecurity prevalence, healthy-diet affordability and comparison-year persistence without adding overlapping affected populations or treating projections as current.'
  },
  {
    audit_index: 442,
    name: 'Climate TRACE Global Emissions API',
    url: 'https://climatetrace.org/data',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'deforestation_co2_release', 'land_use_fire_co2', 'global_monthly_emissions'],
    notes: 'Official global monthly emissions API beginning in 2015. The operational snapshot retains forest-land-clearing CO2 directly and sums only the four explicit land-fire subsectors for land-use fire CO2, excludes incomplete or projected years, treats null as missing rather than zero, and records Climate TRACE historical-revision and modeled-estimation uncertainty.'
  },
  {
    audit_index: 441,
    name: 'Ember Global Electricity Data',
    url: 'https://ember-energy.org/data/electricity-data-explorer/',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'coal_power_co2_output', 'gas_power_co2_output', 'gas_power_dependence', 'fuel_specific_power_emissions'],
    notes: 'Official source-native World yearly electricity CSV retaining coal and gas power-sector lifecycle emissions and gas generation share as separate variables. The operational snapshot preserves source units, revisions and methodology boundaries; Ember Other Fossil is explicitly excluded from the oil-only node because that category combines oil and petroleum products with manufactured gases and waste.'
  },
  {
    audit_index: 440,
    name: 'Eurostat Fisheries Landings',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/fish_ld_main/default/table',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'fish_landing_supply_disruption', 'marine_fish_landings_shortfall'],
    notes: 'Official annual Eurostat fish_ld_main observations for total fishery products landed in EEA reporting geographies. The operational snapshot retains source status flags and derives a bounded shortfall against each geography fixed 2015-2019 mean; it does not identify harvest location or prove ecological, climate, market or governance attribution.'
  },
  {
    audit_index: 439,
    name: 'NOAA CPC PSL Climate Indices',
    url: 'https://psl.noaa.gov/data/climateindices/list/',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'pacific_decadal_oscillation', 'pacific_north_american_pattern', 'north_atlantic_oscillation', 'arctic_oscillation'],
    notes: 'Official source-native monthly PDO and daily PNA, NAO and AO index tables from NOAA PSL and CPC. The operational snapshot retains each index definition, frequency and observation period separately, with per-index freshness disclosure; index phase is not a hazard measurement or causal attribution.'
  },
  {
    audit_index: 438,
    name: 'ACAPS Humanitarian Access',
    url: 'https://www.acaps.org/en/data',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'humanitarian_access_constraints', 'access_severity', 'country_crisis_assessment'],
    notes: 'Public ACAPS Humanitarian Access Overview using nine indicators grouped into three pillars and an overall 0-5 score. The operational snapshot retains the assessment period, source-reported country counts and shares, the 3-5 high-to-extreme threshold, and method boundary. It is not an incident count, people-reached total, country score table or causal estimate.'
  },
  {
    audit_index: 437,
    name: 'Austin Travis County EMS Incidents by Month',
    url: 'https://data.austintexas.gov/Public-Safety/EMS-Incidents-by-Month/gjtj-jt2d',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'emergency_response_overload', 'ems_response_goal_compliance', 'monthly_incident_demand'],
    notes: 'Official monthly Austin-Travis County EMS CAD-derived incident counts and on-time response-goal compliance by service area and priority. The derived miss rate is a bounded local operational proxy; late responses must not be treated as proof of capacity exceedance, dispatch saturation, patient harm or national performance.'
  },
  {
    audit_index: 436,
    name: 'OpenFEMA Registration Intake Individuals Household Program v2',
    url: 'https://www.fema.gov/openfema-data-page/registration-intake-and-individuals-household-program-ri-ihp-v2',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'disaster_recovery_inequality', 'ihp_eligibility', 'ihp_awards', 'geographic_assistance_gap'],
    notes: 'Official weekly aggregated non-PII OpenFEMA administrative records by declaration, city and ZIP. The operational snapshot retains valid registrations, eligible registrations, awards and all denominators; its within-declaration geographic range is descriptive and must not be interpreted as protected-class disparity, causal program bias, complete unmet need or household recovery.'
  },
  {
    audit_index: 435,
    name: 'Sabin Center UNEP Global Climate Litigation Report 2025',
    url: 'https://climate.law.columbia.edu/news/sabin-center-climate-change-law-unep-release-new-climate-litigation-report',
    access_classification: 'open_portal',
    fit: ['metric_ingestion', 'climate_litigation_pressure', 'climate_litigation_cases', 'legal_system_response'],
    notes: 'Sabin Center and UNEP source-reported cumulative climate-related case counts: 884 by 2017, 1,550 by 2020, 2,180 by 2022, and 3,099 as of 30 June 2025. The series measures cases captured under the database methodology, not case success, damages, policy stringency, jurisdiction-normalized legal exposure or an annual filing rate.'
  },
  {
    audit_index: 434,
    name: 'UNDRR Global Status Multi Hazard Early Warning Systems 2024',
    url: 'https://www.undrr.org/reports/global-status-MHEWS-2024',
    access_classification: 'open_portal',
    fit: ['metric_ingestion', 'multi_hazard_early_warning', 'early_warning_coverage_gaps', 'sendai_target_g'],
    notes: 'Authoritative UNDRR and WMO global assessment reporting that 108 countries, 55 percent of all countries, had reported the existence of MHEWS by the end of March 2024. The complementary 45 percent is labeled a reporting gap; non-reporting is not treated as proof that no capability exists, and neither measure is population coverage.'
  },
  {
    audit_index: 433,
    name: 'OCHA Humanitarian Programme Cycle Public API',
    url: 'https://api.hpc.tools/docs/v1/',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'humanitarian_response_funding_shortfall', 'response_plan_requirements', 'reported_funding'],
    notes: 'Official OCHA plan and Financial Tracking Service endpoints joined by plan ID. The snapshot retains revised requirements, incoming funding reported to FTS, pledges separately, uncapped coverage, and a zero-bounded arithmetic shortfall for each released positive-requirement plan; it does not measure aid delivery or operational sufficiency.'
  },
  {
    audit_index: 432,
    name: 'Nature Climate Change Vicedo-Cabrera 2021 Heat Mortality Attribution',
    url: 'https://doi.org/10.1038/s41558-021-01058-x',
    access_classification: 'open_download',
    fit: ['relationship_effect_estimate', 'global_temperature', 'heat_related_mortality_burden', 'climate_attribution'],
    notes: 'Multi-country time-series epidemiology and climate counterfactual attribution across 732 locations. The 0.58 percent warm-season mortality fraction and empirical 95 percent interval apply only to included locations and the 1991-2018 attribution period; they are not a universal per-degree coefficient or global death total.'
  },
  {
    audit_index: 431,
    name: 'Communications Earth and Environment Rantanen 2022 Arctic Amplification',
    url: 'https://doi.org/10.1038/s43247-022-00498-3',
    access_classification: 'open_download',
    fit: ['relationship_effect_estimate', 'global_temperature', 'arctic_amplification_rates', 'observed_temperature_trends'],
    notes: 'Four-dataset observational and reanalysis comparison of 1979-2021 Arctic-circle and global warming trends. The 3.8 amplification ratio and 3.7-4.1 cross-dataset range are period- and domain-specific; the range is not a confidence interval or future projection.'
  },
  {
    audit_index: 430,
    name: 'Nature Climate Change Pfleiderer 2019 Summer Weather Persistence',
    url: 'https://doi.org/10.1038/s41558-019-0555-0',
    access_classification: 'open_download',
    fit: ['relationship_effect_estimate', 'global_temperature', 'drought_persistence', 'compound_dry_warm_events'],
    notes: 'HAPPI multi-model warming-level analysis of persistent boreal-summer weather. The 20 percent eastern-North-America dry-warm persistence response and 11-42 percent full range are regional, scenario-conditioned probability changes rather than universal drought-duration coefficients.'
  },
  {
    audit_index: 429,
    name: 'Lancet Planetary Health Flouris 2018',
    url: 'https://doi.org/10.1016/S2542-5196(18)30237-7',
    access_classification: 'open_download',
    fit: ['relationship_effect_estimate', 'wet_bulb_heat', 'occupational_heat_exposure', 'occupational_heat_strain'],
    notes: 'Systematic review and random-effects meta-analysis of measured occupational heat exposure. The pooled 4.01 odds ratio and 95 percent interval apply to heat strain during or after a shift under guideline-defined heat stress, not to per-degree response, work hours lost, injury, or mortality.'
  },
  {
    audit_index: 428,
    name: 'UNSD SDG API / UNEP Material Flows',
    url: 'https://unstats.un.org/sdgapi/swagger/',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'resource_depletion', 'material_footprint', 'domestic_material_consumption'],
    notes: 'Contract-bound SDG 12.2.1 and 12.2.2 selected-year snapshot retaining consumption-based material footprint and domestic material consumption separately, in absolute and per-capita form for total and four raw-material classes. It is a material-pressure indicator, not a reserve or scarcity measure.'
  },
  {
    audit_index: 427,
    name: 'NASA POWER Monsoon Rainfall Pilot',
    url: 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'monsoon_volatility', 'rainfall_gate', 'seasonal_rainfall'],
    notes: 'Contract-bound daily PRECTOTCORR pilot for the 14-location IMD Kerala-onset rainfall panel. It reproduces the rainfall gate and a June-September anomaly but explicitly withholds official-onset status because wind and outgoing-longwave-radiation criteria are not evaluated.'
  },
  {
    audit_index: 426,
    name: 'Our World in Data Energy Data',
    url: 'https://github.com/owid/energy-data',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'clean_electricity', 'low_carbon_generation', 'electricity_mix'],
    notes: 'Contract-bound country and World clean-electricity generation and share snapshot using the public OWID energy CSV and codebook. The codebook documents Ember and Energy Institute upstream inputs; row-level upstream attribution is unavailable and is not invented.'
  },
  {
    audit_index: 424,
    name: 'NOAA Laboratory for Satellite Altimetry',
    url: 'https://www.star.nesdis.noaa.gov/socd/lsa/SeaLevelRise/LSA_SLR_timeseries_global.php',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'sea_level_rise', 'global_mean_sea_level', 'satellite_altimetry'],
    notes: 'Contract-bound same-ground-track satellite-altimetry time series with mission overlap, spatial boundary, inverted-barometer treatment, GIA omission, source trend and absent observation-level uncertainty explicitly retained.'
  },
  {
    audit_index: 423,
    name: 'EIA Major Disturbances and Unusual Occurrences (DOE-417)',
    url: 'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_b_2',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'critical_infrastructure_fragility', 'electricity_disruption', 'customer_hours'],
    notes: 'Contract-bound major electric-disturbance snapshot retaining duration, estimated customers, megawatts, utility, geography and disturbance type. Derived customer-hours cover qualifying reported events only and are not SAIDI, all-outage coverage, or a cross-sector fragility score.'
  },
  {
    audit_index: 422,
    name: 'U.S. EPA National Rivers and Streams Assessment 2018-2019',
    url: 'https://riverstreamassessment.epa.gov/webreport/',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'freshwater_ecosystem_condition', 'biological_condition', 'probability_survey'],
    notes: 'Contract-bound national and nine-ecoregion panel of benthic-macroinvertebrate and fish-community condition with sampled-site counts, estimated river miles, and source 95 percent confidence bounds. It is conterminous-U.S. river/stream evidence, not a global or local collapse measure.'
  },
  {
    audit_index: 421,
    name: 'EC JRC Global Wildfire Information System MCD64A1 Burned Area',
    url: 'https://gwis.jrc.ec.europa.eu/apps/country.profile/downloads',
    access_classification: 'open_download',
    fit: ['metric_ingestion', 'wildfire_regime_shift', 'burned_area', 'fire_season'],
    notes: 'Contract-bound 2023 country panel derived from the official 2002-2024 monthly MCD64A1 burned-area CSV. The all-zero 2024 partition is withheld. Cropland is retained separately; the non-cropland series remains a bounded regime indicator rather than a complete wildfire inventory or severity measure.'
  },
  {
    audit_index: 244,
    name: 'NOAA CO-OPS Derived Product API',
    url: 'https://api.tidesandcurrents.noaa.gov/dpapi/prod/',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'coastal_inundation_risk', 'high_tide_flooding', 'tide_gauge'],
    notes: 'Contract-bound daily high-tide-flood threshold exceedance snapshot for a declared United States gauge panel. Gauge flags remain separate from inundation area, exposure, damage, rainfall flooding, and future scenarios.'
  },
  {
    audit_index: 245,
    name: 'NASA POWER Open API',
    url: 'https://power.larc.nasa.gov/docs/services/api/',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'wet_bulb_heat', 'compound_climate_hazards', 'hourly_meteorology'],
    notes: 'Contract-bound source-native hourly wet-bulb temperature and daily heat-plus-heavy-precipitation co-occurrence snapshot. The pilot is a bounded gridded city panel, not station telemetry, WBGT, or a universal compound-risk index.'
  },
  {
    audit_index: 246,
    name: 'Global Human Settlement Layer',
    url: 'https://human-settlement.emergency.copernicus.eu/ghs_buS2023.php',
    access_classification: 'open_download',
    fit: ['metric_design', 'urbanization', 'built_up_surface', 'settlement_extent'],
    notes: 'European Commission JRC built-up surface epochs support harmonized urban expansion measurement. Product version, spatial resolution, settlement boundary, and epoch interval remain explicit.'
  },
  {
    audit_index: 207,
    name: 'GBIF Occurrence API',
    url: 'https://techdocs.gbif.org/en/openapi/v1/occurrence',
    fit: ['anchor_calibration', 'monitoring_registry', 'biodiversity_occurrence'],
    notes: 'Open occurrence-search API integrated as a bounded, quality-filtered snapshot. Complete extracts beyond search paging limits require the asynchronous download service.'
  },
  {
    audit_index: 208,
    name: 'OBIS API v3',
    url: 'https://api.obis.org/',
    fit: ['anchor_calibration', 'monitoring_registry', 'marine_biodiversity_occurrence'],
    notes: 'Open marine occurrence API integrated as a bounded snapshot with environmental and quality context retained where supplied.'
  },
  {
    audit_index: 209,
    name: 'USGS Water Data OGC API',
    url: 'https://api.waterdata.usgs.gov/docs/ogcapi/',
    fit: ['anchor_calibration', 'monitoring_registry', 'freshwater_observation'],
    notes: 'Modern OGC API integrated for bounded station observations. API keys are optional and used only for higher rate limits.'
  },
  {
    audit_index: 210,
    name: 'NASA GPM IMERG',
    url: 'https://gpm.nasa.gov/data/imerg',
    access_classification: 'mixed_or_gated',
    fit: ['anchor_calibration', 'extreme_precipitation', 'satellite_precipitation'],
    notes: 'Machine-readable precipitation products are available, but larger research datasets require a free NASA Earthdata account. This source is registered for metric design and is not yet a scoring feed.'
  },
  {
    audit_index: 211,
    name: 'NOAA IBTrACS',
    url: 'https://www.ncei.noaa.gov/products/international-best-track-archive',
    access_classification: 'open_download',
    fit: ['anchor_calibration', 'tropical_cyclone_tracks', 'rapid_intensification'],
    notes: 'Open, versioned best-track archive with CSV and NetCDF access. A dedicated ingestion job and cross-agency wind normalization remain required before scoring.'
  },
  {
    audit_index: 212,
    name: 'WHO GHO OData API',
    url: 'https://www.who.int/data/gho/info/gho-odata-api',
    access_classification: 'open_api',
    fit: ['anchor_calibration', 'health_surveillance', 'vector_borne_disease'],
    notes: 'Open OData query surface. Disease-specific indicator coverage and national reporting comparability must be profiled before any range or transmission-season metric is operationalized.'
  },
  {
    audit_index: 213,
    name: 'EEA Urban Heat Island ArcGIS',
    url: 'https://sdi.eea.europa.eu/catalogue/srv/api/records/8b6a3182-0889-4109-ad22-a021e3126b60',
    access_classification: 'open_download',
    fit: ['metric_design', 'urban_heat_island', 'regional_baseline'],
    notes: 'Public CC-BY dataset for 100 European cities. It is a bounded regional baseline, not a global live feed; broader coverage requires a separately reviewed derived Landsat workflow.'
  },
  {
    audit_index: 214,
    name: 'EPA Nutrient Pollution',
    url: 'https://www.epa.gov/nutrientpollution/basic-information-nutrient-pollution',
    access_classification: 'reference_only',
    fit: ['edge_evidence', 'nutrient_pollution', 'mechanism_reference'],
    notes: 'Authoritative mechanism and source framing for nitrogen and phosphorus pollution. Measurement remains bound to separate water-quality APIs and regional criteria.'
  },
  {
    audit_index: 215,
    name: 'UNEP Seagrass Meadows',
    url: 'https://www.unep.org/topics/ocean-seas-and-coasts/blue-ecosystems/seagrass-meadows',
    access_classification: 'reference_only',
    fit: ['edge_evidence', 'seagrass_meadow_decline', 'habitat_definition'],
    notes: 'Authoritative global status, driver, and ecosystem-function framing. Area-change scoring still requires comparable curated habitat polygons.'
  },
  {
    audit_index: 216,
    name: 'UNSD SDG API',
    url: 'https://unstats.un.org/sdgapi/swagger/',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'food_insecurity', 'sdg_2_1_2'],
    notes: 'Contract-bound annual FIES snapshot retaining uncertainty bounds and footnotes.'
  },
  {
    audit_index: 425,
    name: 'UNSD SDG API FAO Fish Stock Status',
    url: 'https://unstats.un.org/SDGAPI/v1/sdg/Indicator/Data?indicator=14.4.1',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'marine_fisheries_collapse', 'sdg_14_4_1', 'fish_stock_status'],
    notes: 'Contract-bound FAO SDG 14.4.1 series retaining source-reported sustainable-stock share, geography, year, status, source statement and footnotes. The complementary unsustainable share is arithmetic; explicit NaN values and landlocked placeholders are withheld.'
  },
  {
    audit_index: 217,
    name: 'USGS Samples Data API',
    url: 'https://api.waterdata.usgs.gov/samples-data/docs',
    access_classification: 'open_api',
    fit: ['metric_ingestion', 'nutrient_pollution', 'water_quality_samples'],
    notes: 'Contract-bound California pilot retaining methods, units, status, and detection limits.'
  },
  {
    audit_index: 218,
    name: 'FCC Submarine Cable Landing Licensing Records',
    url: 'https://www.fcc.gov/submarine-cable-landing-licenses',
    access_classification: 'open_portal',
    fit: ['metric_design', 'subsea_cables', 'system_topology', 'licensing_status'],
    notes: 'Public regulatory filings and orders support named-system topology, landing, ownership, status, and capacity review. Utilization and commercially sensitive operating data may be incomplete or delayed.'
  },
  {
    audit_index: 219,
    name: 'NASA OMPS Aerosol Index',
    url: 'https://data.nasa.gov/dataset/omps-npp-l2-nm-aerosol-index-swath-orbital-2c319',
    access_classification: 'open_download',
    fit: ['metric_design', 'aerosol_observation', 'satellite_retrieval'],
    notes: 'Official orbital aerosol-index product. It is a dimensionless radiance-derived retrieval, not aerosol mass or a stand-alone forcing estimate.'
  },
  {
    audit_index: 220,
    name: 'NOAA RATPAC',
    url: 'https://www.ncei.noaa.gov/products/weather-balloon/radiosonde-atmospheric-temperature-products',
    access_classification: 'open_download',
    fit: ['metric_design', 'tropospheric_temperature', 'climate_trend'],
    notes: 'Homogenized radiosonde temperature-anomaly time series for large-scale tropospheric and lower-stratospheric trend assessment.'
  },
  {
    audit_index: 221,
    name: 'NOAA Global Ocean Heat Content CDR',
    url: 'https://www.ncei.noaa.gov/products/global-ocean-heat-salt-content-cdr',
    access_classification: 'open_download',
    fit: ['metric_design', 'ocean_heat_content', 'depth_resolved_climate_record'],
    notes: 'Climate data record of ocean heat-content anomalies by basin, hemisphere, period, and depth range; overlapping layers must not be summed.'
  },
  {
    audit_index: 222,
    name: 'NSIDC Sea Ice Science and Data',
    url: 'https://nsidc.org/learn/parts-cryosphere/sea-ice/science-sea-ice',
    access_classification: 'open_portal',
    fit: ['metric_design', 'sea_ice_extent', 'sea_ice_thickness', 'sea_ice_age'],
    notes: 'Authoritative definitions and data guidance for extent, area, thickness, age, concentration, and motion. Each dimension retains its own method and unit.'
  },
  {
    audit_index: 223,
    name: 'PAME Arctic Ship Traffic Data',
    url: 'https://pame.is/ourwork/arctic-shipping/current-shipping-projects/astd/',
    access_classification: 'open_portal',
    fit: ['metric_design', 'arctic_shipping', 'ais_activity'],
    notes: 'Arctic Council working-group traffic system built from AIS observations. Coverage, vessel class, boundary, and reporting period must remain explicit.'
  },
  {
    audit_index: 224,
    name: 'UNEP OzonAction Refrigerant Management',
    url: 'https://www.unep.org/ozonaction/news/news/five-days-cool-intelligence-day-3-closing-loop-life-cycle-refrigerant-management',
    access_classification: 'open_portal',
    fit: ['metric_design', 'refrigerant_leakage', 'cold_chain'],
    notes: 'Authoritative lifecycle framing for leakage prevention, servicing, recovery, recycling, reclamation, and end-of-life handling across refrigeration equipment.'
  },
  {
    audit_index: 225,
    name: 'IEA Energy and AI',
    url: 'https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai',
    access_classification: 'open_portal',
    fit: ['metric_design', 'data_centers', 'backup_generation'],
    notes: 'Authoritative system boundary for data-center equipment, cooling, UPS, and backup generators. Installed backup capacity is not treated as emitted pollution.'
  },
  {
    audit_index: 226,
    name: 'ITU Internet Traffic Indicators Handbook',
    url: 'https://www.itu.int/dms_pub/itu-d/opb/ind/D-IND-ITC_IND_HBK-2011-PDF-E.pdf',
    access_classification: 'open_download',
    fit: ['metric_design', 'internet_exchange_points', 'traffic_throughput'],
    notes: 'Official indicator guidance describing traffic-volume and exchange statistics. Exchange coverage, interval, direction, and peak method remain explicit.'
  },
  {
    audit_index: 227,
    name: 'USDA NRCS Soil Carbon Stock Monitoring',
    url: 'https://www.nrcs.usda.gov/sites/default/files/2023-09/FY24_CEMA%20221_Soil%20Organic%20Carbon%20Stock%20Monitoring_10-23_0.pdf',
    access_classification: 'open_download',
    fit: ['metric_design', 'soil_organic_carbon', 'stock_change'],
    notes: 'Official field monitoring protocol for soil-organic-carbon stocks and multi-year change across land uses.'
  },
  {
    audit_index: 228,
    name: 'UNEP Global Peatlands Assessment 2022',
    url: 'https://www.unep.org/resources/global-peatlands-assessment-2022',
    access_classification: 'open_download',
    fit: ['edge_evidence', 'peatland_degradation', 'peat_fires', 'metric_design'],
    notes: 'Authoritative global assessment of peatland extent, condition, drainage, degradation, fire, carbon, and management. Metrics remain tied to mapped peat boundaries and explicit condition methods.'
  },
  {
    audit_index: 229,
    name: 'UNEP Global Cooling Watch 2025',
    url: 'https://www.unep.org/resources/global-cooling-watch-2025',
    access_classification: 'open_download',
    fit: ['edge_evidence', 'cooling_equity', 'heat_health', 'metric_design'],
    notes: 'Authoritative assessment of cooling demand, emissions, affordability, access inequality, and sustainable cooling pathways. National equipment totals are not treated as household protection.'
  },
  {
    audit_index: 230,
    name: 'NOAA Coral Reproduction and Recruitment',
    url: 'https://sanctuaries.noaa.gov/science/assessment/florida-keys/coral-reproduction.html',
    access_classification: 'open_portal',
    fit: ['edge_evidence', 'coral_recruitment', 'early_life_survival', 'metric_design'],
    notes: 'Official assessment surface separating larval production, survival, settlement, and recruitment. Adult bleaching or low cover alone is not treated as observed larval mortality.'
  },
  {
    audit_index: 231,
    name: 'ITU Smart Energy for Telecom Sites',
    url: 'https://www.itu.int/rec/T-REC-L.1380-201911-I/en',
    access_classification: 'open_download',
    fit: ['metric_design', 'mobile_wireless_networks', 'backup_power', 'site_energy'],
    notes: 'Official technical guidance for telecom-site power, storage, backup operation, and grid interaction. Installed capacity remains distinct from delivered runtime or emissions.'
  },
  {
    audit_index: 232,
    name: 'EPA Semiconductor Water Use',
    url: 'https://www.epa.gov/sustainability/lean-water-toolkit-chapter-2',
    access_classification: 'open_portal',
    fit: ['metric_design', 'semiconductor_fabs', 'water_withdrawal', 'water_reuse'],
    notes: 'Official industrial water-accounting guidance identifying semiconductor cleaning, rinsing, ultrapure-water, and facility operations. Facility boundaries and reuse remain explicit.'
  },
  {
    audit_index: 233,
    name: 'UNEP Food Waste Index',
    url: 'https://www.unep.org/indicator-1231b',
    access_classification: 'open_download',
    fit: ['metric_design', 'food_waste', 'retail_food_waste', 'sdg_12_3_1b'],
    notes: 'Official SDG measurement framework for retail, food-service, and household food waste. Retail subsectors remain a bounded measurement inside the wider system.'
  },
  {
    audit_index: 234,
    name: 'EPA Ground-Level Ozone',
    url: 'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics',
    access_classification: 'open_portal',
    fit: ['metric_design', 'tropospheric_ozone', 'air_quality', 'health_and_ecosystems'],
    notes: 'Official formation, monitoring, health, and environmental framing for ground-level ozone. Precursor emissions and heat are not substituted for measured concentration.'
  },
  {
    audit_index: 235,
    name: 'NOAA Shallow Coral Reef Habitat',
    url: 'https://www.fisheries.noaa.gov/national/habitat-conservation/shallow-coral-reef-habitat',
    access_classification: 'open_portal',
    fit: ['metric_design', 'coral_reef_fragmentation', 'physical_damage', 'reef_structure'],
    notes: 'Official habitat and threat surface distinguishing physical breakage from bleaching, mortality, pollution, and changing carbonate chemistry.'
  },
  {
    audit_index: 236,
    name: 'USGS Glacier Runoff and Sediment',
    url: 'https://www.usgs.gov/publications/glacier-runoff-and-sediment-transport-and-deposition-eklutna-lake-basin-alaska',
    access_classification: 'open_download',
    fit: ['metric_design', 'glacial_siltation_streams', 'suspended_sediment', 'sediment_deposition'],
    notes: 'Primary basin study of glacier runoff, suspended sediment, transport, and deposition. Flux requires paired discharge and sediment observations.'
  },
  {
    audit_index: 237,
    name: 'NOAA Coastal Blue Carbon',
    url: 'https://www.fisheries.noaa.gov/national/habitat-conservation/protecting-coastal-blue-carbon-through-habitat-conservation',
    access_classification: 'open_portal',
    fit: ['metric_design', 'blue_carbon_habitat_loss', 'coastal_carbon_stock', 'habitat_area'],
    notes: 'Official definition and accounting context for salt marsh, mangrove, and seagrass carbon storage, habitat loss, released stocks, and lost sequestration capacity.'
  },
  {
    audit_index: 238,
    name: 'NOAA Blue Carbon White Paper',
    url: 'https://repository.library.noaa.gov/view/noaa/40456',
    access_classification: 'open_download',
    fit: ['edge_evidence', 'blue_carbon_habitat_loss', 'inventory_methods', 'coastal_resilience'],
    notes: 'Authoritative inventory and policy synthesis for coastal blue-carbon ecosystems; habitat area is not converted to emissions without stock and disturbance methods.'
  },
  {
    audit_index: 239,
    name: 'NSIDC Ice Shelf Science',
    url: 'https://nsidc.org/learn/parts-cryosphere/ice-shelves/science-ice-shelves',
    access_classification: 'open_portal',
    fit: ['metric_design', 'glacier_calving', 'ice_shelf_retreat', 'grounding_line'],
    notes: 'Authoritative process definitions separating normal calving, sustained retreat, disintegration, surface hydrofracture, basal melt, and buttressing loss.'
  },
  {
    audit_index: 240,
    name: 'NASA Anatomy of Glacial Ice Loss',
    url: 'https://www.nasa.gov/science-research/earth-science/the-anatomy-of-glacial-ice-loss/',
    access_classification: 'open_portal',
    fit: ['edge_evidence', 'glacier_calving', 'surface_melt', 'ocean_undercutting'],
    notes: 'Official mechanism overview connecting surface meltwater, fjord circulation, terminus melt, fracture, and iceberg release.'
  },
  {
    audit_index: 241,
    name: 'EPA Ambient Air Methods',
    url: 'https://www.epa.gov/air-research/ambient-air-methods-and-measurement-development-research',
    access_classification: 'open_portal',
    fit: ['metric_design', 'volatile_organic_compounds', 'air_toxics', 'ozone_precursors'],
    notes: 'Official compound-resolved method-development surface for ambient organic gases, air toxics, and ozone precursors; unspecified total-organic signals remain invalid.'
  },
  {
    audit_index: 242,
    name: 'EPA Volatile Chemical Products',
    url: 'https://www.epa.gov/air-research/implications-volatile-chemical-products-ozone-and-particulate-matter-urban-atmospheres',
    access_classification: 'open_portal',
    fit: ['edge_evidence', 'volatile_organic_compounds', 'ozone', 'secondary_organic_aerosol'],
    notes: 'Official source and mechanism context for volatile chemical products, secondary ozone, and organic aerosol; product use is not treated as measured ambient concentration.'
  },
  {
    audit_index: 243,
    name: 'EPA Heat Island Measurement Guidance',
    url: 'https://www.epa.gov/heatislands/measuring-heat-islands',
    access_classification: 'open_portal',
    fit: ['metric_design', 'nighttime_heat_retention', 'urban_heat_island', 'air_temperature'],
    notes: 'Official framework for paired urban and reference air-temperature measurements, station siting, nighttime conditions, and separation of air and surface temperature.'
  },
  {
    audit_index: 244,
    name: 'ORNL Grid Climate Vulnerability Response',
    url: 'https://www.energy.gov/oe/articles/oak-ridge-national-laboratory-response-grid-rfi',
    access_classification: 'open_download',
    fit: ['metric_design', 'transformer_heat_failure_risk', 'ambient_temperature', 'hot_spot_temperature', 'thermal_aging'],
    notes: 'DOE-hosted national-laboratory assessment of ambient heat, transformer hot-spot temperature, electrical loading, insulation aging, derating, and failure risk.'
  },
  {
    audit_index: 245,
    name: 'DOE Large Power Transformer Resilience',
    url: 'https://www.energy.gov/oe/addressing-security-and-reliability-concerns-large-power-transformers',
    access_classification: 'open_portal',
    fit: ['edge_evidence', 'transformer_failure', 'electricity_service_disruption', 'critical_infrastructure'],
    notes: 'Official consequence boundary for critical transformer loss, service disruption, network exposure, and long replacement lead times.'
  },
  {
    audit_index: 246,
    name: 'DOE Distribution Transformer Demand',
    url: 'https://www.energy.gov/oe/articles/distribution-transformers-preparing-growth-demand',
    access_classification: 'open_portal',
    fit: ['edge_evidence', 'transformer_loading', 'asset_age', 'failure_rate'],
    notes: 'Official DOE and NREL synthesis linking aging transformer fleets and increasing loading to accelerated asset failure rates.'
  },
  {
    audit_index: 247,
    name: 'NOAA Shelf Hypoxia Indicators',
    url: 'https://www.fisheries.noaa.gov/west-coast/science-data/local-physical-indicators',
    access_classification: 'open_portal',
    fit: ['metric_design', 'shelf_sea_hypoxia', 'bottom_water_dissolved_oxygen', 'continental_shelf'],
    notes: 'Official shelf-bottom dissolved-oxygen indicator with an explicit threshold, depth context, seasonal coverage, and documented biological interpretation.'
  },
  {
    audit_index: 248,
    name: 'NOAA Ocean Deoxygenation and Hypoxia',
    url: 'https://oceanacidification.noaa.gov/oap_pubs/ocean-hypoxia-the-science-of-climate-change-in-the-sea/',
    access_classification: 'open_portal',
    fit: ['edge_evidence', 'oceanic_deoxygenation', 'shelf_sea_hypoxia', 'marine_food_web'],
    notes: 'NOAA-hosted research boundary for global oxygen decline and the intensification or expansion of already low-oxygen coastal and oceanic systems.'
  },
  {
    audit_index: 249,
    name: 'WFP Food Security Impact of Funding Reduction',
    url: 'https://www.wfp.org/publications/food-security-impact-reduction-wfp-funding',
    access_classification: 'open_download',
    fit: ['metric_design', 'humanitarian_resource_gaps', 'funding_shortfall', 'assistance_reach', 'ration_reduction'],
    notes: 'Official operation-level analysis separating projected resources, funding shortfall, people losing assistance, and possible food-security deterioration.'
  },
  {
    audit_index: 250,
    name: 'WFP at a Glance',
    url: 'https://www.wfp.org/stories/wfp-glance',
    access_classification: 'open_portal',
    fit: ['metric_design', 'humanitarian_resource_gaps', 'funding_requirements', 'people_reached', 'ration_delivery'],
    notes: 'Official global programme summary with funding requirement, voluntary resources, assistance reach, ration delivery, access limits, and the consequence of resource shortfalls.'
  },
  {
    audit_index: 251,
    name: 'UNEP Sea-Water Desalination in the Mediterranean Assessment and Guidelines',
    url: 'https://www.unep.org/resources/report/sea-water-desalination-mediterranean-assessment-and-guidelines',
    access_classification: 'open_download',
    fit: ['metric_design', 'desalination_dependence', 'brine_discharge', 'marine_outfall', 'mixing_zone'],
    notes: 'Authoritative concentrate-discharge assessment covering brine, treatment chemicals, receiving-water exposure, site conditions, and disposal guidance.'
  },
  {
    audit_index: 252,
    name: 'UNEP Towards Sustainable Desalination',
    url: 'https://www.unep.org/news-and-stories/story/towards-sustainable-desalination',
    access_classification: 'open_portal',
    fit: ['edge_evidence', 'desalination_dependence', 'brine_volume', 'salinity', 'dissolved_oxygen', 'marine_food_web'],
    notes: 'UNEP synthesis of concentrate volume, high salinity, treatment chemicals, oxygen effects, and site-dependent coastal ecosystem exposure.'
  },
  {
    audit_index: 253,
    name: 'NASA CERES Science',
    url: 'https://ceres.larc.nasa.gov/science/',
    access_classification: 'open_portal',
    fit: ['metric_design', 'cloud_radiative_effect', 'shortwave_flux', 'longwave_flux', 'cloud_properties'],
    notes: 'Official satellite measurement definition for shortwave, longwave, and net cloud radiative effects, including cloud-height dependence.'
  },
  {
    audit_index: 254,
    name: 'NOAA GFDL Cloud Radiative Effect',
    url: 'https://www.gfdl.noaa.gov/cloud-radiative-effect/',
    access_classification: 'open_portal',
    fit: ['metric_design', 'cloud_radiative_effect', 'cloud_albedo', 'energy_budget', 'cloud_feedback'],
    notes: 'Official process and interpretation boundary separating shortwave reflection, longwave trapping, present-day net effect, and feedback sign.'
  },
  {
    audit_index: 255,
    name: 'USGS Dam Flow and Sediment Operations',
    url: 'https://pubs.usgs.gov/publication/sir20225081/full',
    access_classification: 'open_download',
    fit: ['edge_evidence', 'dam_and_diversion_infrastructure', 'river_flow_regime_shift', 'sediment_flux'],
    notes: 'Primary long-term analysis of dam operating periods, downstream flow regime, sediment flux, and riverine ecosystem response.'
  },
  {
    audit_index: 256,
    name: 'USGS Culvert Connectivity Synthesis',
    url: 'https://pubs.usgs.gov/publication/sir20235132/full',
    access_classification: 'open_download',
    fit: ['edge_evidence', 'road_stream_crossing_barriers', 'riverine_habitat_fragmentation', 'freshwater_biodiversity'],
    notes: 'Primary synthesis of crossing hydraulics, passage impairment, disconnected habitat, population isolation, richness, abundance, and connectivity metrics.'
  },
  {
    audit_index: 257,
    name: 'EPA Physical Habitat Causal Assessment',
    url: 'https://www.epa.gov/caddis/physical-habitat',
    access_classification: 'open_portal',
    fit: ['edge_evidence', 'levee_and_channelization_works', 'river_flow_regime_shift', 'freshwater_ecosystem'],
    notes: 'Official causal assessment for altered discharge, hydraulics, erosion, connectivity, habitat availability, organism condition, mortality, and reproduction.'
  },
  {
    audit_index: 258,
    name: 'USGS Channelization and Floodplain Connectivity',
    url: 'https://www.usgs.gov/publications/valley-plugs-land-use-and-phytogeomorphic-response-chapter-14',
    access_classification: 'open_portal',
    fit: ['edge_evidence', 'levee_and_channelization_works', 'floodplain_connectivity', 'hydrology', 'biodiversity'],
    notes: 'Primary synthesis of channelization effects on fluvial parameters, floodplain connectivity, hydrology, sediment dynamics, productivity, and biodiversity.'
  },
  {
    audit_index: 259,
    name: 'NOAA Kelp Monitoring',
    url: 'https://sanctuaries.noaa.gov/visit/ecosystems/kelpdesc.html',
    access_classification: 'open_portal',
    fit: ['metric_design', 'kelp_forest_collapse', 'kelp_canopy_area_change'],
    notes: 'Official habitat, pressure, ecological-function, and monitoring context for seasonally matched kelp-canopy area assessment.'
  },
  {
    audit_index: 260,
    name: 'USGS Groundwater Monitoring',
    url: 'https://www.usgs.gov/programs/groundwater-and-streamflow-information-program/groundwater-monitoring',
    access_classification: 'open_portal',
    fit: ['metric_design', 'aquifer_recharge_failure', 'groundwater_recharge_rate_change'],
    notes: 'Official groundwater observation context; recharge remains a bounded water-balance estimate rather than a direct inference from water levels alone.'
  },
  {
    audit_index: 261,
    name: 'Forest Inventory and Disturbance Mapping',
    url: 'https://research.fs.usda.gov/treesearch/67038',
    access_classification: 'open_portal',
    fit: ['metric_design', 'old_growth_forest_logging', 'old_growth_forest_harvest_area'],
    notes: 'Forest Service evidence for explicit forest-type-specific old-growth definitions and inventory boundaries used before disturbance-area accounting.'
  },
  {
    audit_index: 262,
    name: 'World Bank Global Gas Flaring Data',
    url: 'https://www.worldbank.org/en/programs/gasflaringreduction/global-flaring-data',
    access_classification: 'open_portal',
    fit: ['metric_design', 'industrial_flaring_outflow', 'industrial_gas_flaring_volume_and_intensity'],
    notes: 'Annual satellite-derived flare-site, volume, production, and intensity measurements with explicit calibration and metadata limitations.'
  },
  {
    audit_index: 263,
    name: 'EPA Brake Wear Particulate Evidence',
    url: 'https://hero.epa.gov/reference/13114/',
    access_classification: 'open_portal',
    fit: ['metric_design', 'automotive_brake_dust_particulates', 'brake_wear_pm10_pm25_emission'],
    notes: 'EPA evidence record for dynamometer-measured wear mass, airborne fraction, and separate PM10 and PM2.5 emission factors.'
  },
  {
    audit_index: 264,
    name: 'EIA Hourly Electric Grid Monitor',
    url: 'https://www.eia.gov/tools/faqs/faq.php?id=100',
    access_classification: 'open_api',
    fit: ['metric_design', 'electrical_grid_load_sinks', 'balancing_authority_peak_load_concentration'],
    notes: 'Official hourly balancing-authority demand, generation, interchange, and peak-load observation surface.'
  },
  {
    audit_index: 265,
    name: 'USGS Monitoring Trends in Burn Severity',
    url: 'https://www.usgs.gov/special-topics/wildland-fire-science/mtbs-viewer-20-years-data-monitoring-trends-burn-severity-mtbs',
    access_classification: 'open_download',
    fit: ['metric_design', 'wildfire_scorched_earth', 'high_severity_burned_area'],
    notes: 'Consistent satellite mapping of fire perimeter, extent, and ecological burn-severity class with stated fire-size and imagery limitations.'
  },
  {
    audit_index: 266,
    name: 'NOAA Climate Prediction Center Jet Monitoring',
    url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensocycle/enso_circ.shtml',
    access_classification: 'open_portal',
    fit: ['metric_design', 'subtropical_jet_drag', 'subtropical_jet_position_and_strength_anomaly'],
    notes: 'Official circulation monitoring for seasonally and regionally bounded changes in jet position, extent, and strength.'
  },
  {
    audit_index: 267,
    name: 'UNESCO Transboundary Aquifer Governance',
    url: 'https://www.unesco.org/en/articles/groundwater-resources-governance-transboundary-aquifers',
    access_classification: 'open_portal',
    fit: ['metric_design', 'water_aquifer_conflict_zones', 'transboundary_aquifer_cooperation_and_stress_profile'],
    notes: 'Hydrogeological, institutional, cooperation, and data-sharing context for shared aquifers without treating water stress as proof of conflict.'
  },
  {
    audit_index: 268,
    name: 'NOAA Climate Data Records',
    url: 'https://www.ncei.noaa.gov/products/climate-data-records',
    access_classification: 'open_download',
    fit: ['metric_design', 'atmospheric_humidity', 'near_surface_atmospheric_humidity'],
    notes: 'Quality-controlled climate records for explicitly named humidity variables, observing systems, baselines, and aggregation methods.'
  },
  {
    audit_index: 269,
    name: 'EPA Nitrous Oxide Emissions',
    url: 'https://www.epa.gov/ghgemissions/nitrous-oxide-emissions',
    access_classification: 'open_portal',
    fit: ['metric_design', 'synthetic_fertilizer_n2o_outflow', 'fertilizer_related_nitrous_oxide_emission'],
    notes: 'Official source-sector and inventory context for fertilizer-related nitrous-oxide emissions, with direct and indirect pathways kept explicit.'
  },
  {
    audit_index: 270,
    name: 'FAA Aircraft Noise',
    url: 'https://www.faa.gov/noise/aircraft_noise',
    access_classification: 'open_portal',
    fit: ['metric_design', 'aero_acoustic_jet_noise_plumes', 'aircraft_noise_exposure'],
    notes: 'Official aircraft-noise source, operational-control, certification, exposure, and airport-program context.'
  },
  {
    audit_index: 271,
    name: 'NOAA Polar Vortex Monitoring',
    url: 'https://www.climate.gov/news-features/event-tracker/disrupted-polar-vortex-brings-sudden-stratospheric-warming-february',
    access_classification: 'open_portal',
    fit: ['metric_design', 'polar_vortex_instabilities', 'stratospheric_polar_vortex_state'],
    notes: 'Official event and mechanism context for stratospheric vortex disruption and sudden stratospheric warming without deterministic surface-weather attribution.'
  },
  {
    audit_index: 272,
    name: 'EPA Temperature Inversion Air Quality',
    url: 'https://www.epa.gov/pmcourse/what-particle-pollution',
    access_classification: 'open_portal',
    fit: ['metric_design', 'thermal_inversion_events', 'lower_atmosphere_temperature_inversion'],
    notes: 'Official vertical-temperature and particle-accumulation context, including nighttime cooling, terrain, persistence, and inversion breakup.'
  },
  {
    audit_index: 273,
    name: 'EPA Animal Feeding Operations',
    url: 'https://www.epa.gov/npdes/animal-feeding-operations-afos',
    access_classification: 'open_portal',
    fit: ['metric_design', 'confined_pig_farm_effluent', 'confined_swine_effluent_load'],
    notes: 'Official facility, manure, wastewater, nutrient, pathogen, contaminant, discharge-pathway, and permitting context for confined animal operations.'
  },
  {
    audit_index: 274,
    name: 'USDA NRCS Soil Risks and Hazards',
    url: 'https://www.nrcs.usda.gov/sites/default/files/2023-01/Understanding-Soil-Risks-and-Hazards.pdf',
    access_classification: 'open_download',
    fit: ['metric_design', 'agricultural_silt_runoff_plumes', 'tractor_compacted_subsoils', 'hillside_cropland_terracing_failure', 'vegetational_windbreak_removals'],
    notes: 'Official erosion, sediment, compaction, terrace, runoff, soil-condition, and windbreak measurement and conservation context.'
  },
  {
    audit_index: 275,
    name: 'EPA Agriculture and Air Quality',
    url: 'https://www.epa.gov/agriculture/agriculture-and-air-quality',
    access_classification: 'open_portal',
    fit: ['metric_design', 'cane_field_burning_smoke', 'sugarcane_burning_pm25_emission_and_exposure'],
    notes: 'Official agricultural-burning, smoke, particulate, plume, source, and health context with emissions and exposure kept separate.'
  },
  {
    audit_index: 276,
    name: 'EPA Methane Emissions',
    url: 'https://www.epa.gov/ghgemissions/methane-emissions',
    access_classification: 'open_portal',
    fit: ['metric_design', 'dairy_herd_methane_belches', 'dairy_enteric_methane_emission'],
    notes: 'Official methane source-sector and livestock enteric-fermentation context with manure emissions separated.'
  },
  {
    audit_index: 277,
    name: 'USGS Mineral Commodity Summaries 2026',
    url: 'https://www.usgs.gov/publications/mineral-commodity-summaries-2026',
    access_classification: 'open_download',
    fit: ['metric_design', 'rock_phosphate_reserves_runout', 'phosphate_rock_reserves_resources_and_production'],
    notes: 'Official production, reserve, resource, grade, trade, revision, and classification context for phosphate rock and other mineral commodities.'
  },
  {
    audit_index: 278,
    name: 'USDA NRCS Soil Bulk Density and Compaction',
    url: 'https://www.nrcs.usda.gov/sites/default/files/2022-10/Soil%20Bulk%20Density%20Moisture%20Aeration.pdf',
    access_classification: 'open_download',
    fit: ['metric_design', 'tractor_compacted_subsoils', 'subsoil_bulk_density_and_compaction'],
    notes: 'Official measurement guidance for bulk density as a compaction indicator, including depth, texture, moisture, infiltration, rooting, and aeration context.'
  },
  {
    audit_index: 279,
    name: 'USDA NRCS Terrace Conservation Practice Standard',
    url: 'https://www.nrcs.usda.gov/resources/guides-and-instructions/terrace-ft-600-conservation-practice-standard',
    access_classification: 'open_portal',
    fit: ['metric_design', 'hillside_cropland_terracing_failure', 'terrace_condition_and_breach'],
    notes: 'Official terrace definition, erosion and runoff purposes, design boundary, inspection, maintenance, and repair context.'
  },
  {
    audit_index: 280,
    name: 'FAO GLEAM Tools and Data',
    url: 'https://www.fao.org/gleam/tools-and-data/en',
    access_classification: 'open_portal',
    fit: ['metric_design', 'industrial_feedlot_feed_conveyors', 'confined_feeding_system_throughput'],
    notes: 'Official livestock-system measurement surface covering animal husbandry, feed systems, manure management, energy use, production systems, and declared model boundaries.'
  },
  {
    audit_index: 281,
    name: 'UNEP Peatland Loss and Degradation Assessment',
    url: 'https://www.unep.org/resources/publication/smoke-water-countering-global-threats-peatland-loss-and-degradation-rapid',
    access_classification: 'open_download',
    fit: ['metric_design', 'horticulture_peat_extraction', 'horticultural_peat_extraction_volume_and_area'],
    notes: 'Authoritative assessment of peatland degradation pressures including agriculture, forestry, resource extraction, and infrastructure development.'
  },
  {
    audit_index: 282,
    name: 'EPA eGRID',
    url: 'https://www.epa.gov/egrid',
    access_classification: 'open_download',
    fit: ['metric_design', 'coal_fired_power_outflow', 'coal_power_plant_emission_inventory'],
    notes: 'Official unit and plant generation, heat-input, emissions, emission-rate, fuel, and resource-mix data with documented methods.'
  },
  {
    audit_index: 283,
    name: 'EPA Coal Combustion Residuals Basics',
    url: 'https://www.epa.gov/coal-combustion-residuals/coal-combustion-residuals-ccr-basics',
    access_classification: 'open_portal',
    fit: ['metric_design', 'coal_fly_ash_lagoons', 'industrial_boiler_ash_sites', 'coal_combustion_residual_impoundment_condition'],
    notes: 'Official residual definitions, unit types, disposal, reuse, water-discharge, and regulatory-boundary context.'
  },
  {
    audit_index: 284,
    name: 'EPA AP42 Wood Residue Combustion',
    url: 'https://www.epa.gov/air-emissions-factors-and-quantification/final-revisions-ap-42-chapter-1-section-6-wood-residue',
    access_classification: 'open_download',
    fit: ['metric_design', 'biomass_incinerator_fallout', 'biomass_combustion_air_emission'],
    notes: 'Official source-test-backed emission factors for wood and bark waste combustion, including pollutant, fuel, control, and factor-quality boundaries.'
  },
  {
    audit_index: 285,
    name: 'EPA Directed Inspection Compressor Stations',
    url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1004F9I.TXT',
    access_classification: 'open_download',
    fit: ['metric_design', 'fossil_gas_compressor_output', 'natural_gas_compressor_methane_emission'],
    notes: 'Official component survey, quantification, prioritization, repair, and uncertainty context for compressor-station methane.'
  },
  {
    audit_index: 286,
    name: 'EIA Natural Gas Environment',
    url: 'https://www.eia.gov/energyexplained/natural-gas/natural-gas-and-the-environment.php',
    access_classification: 'open_portal',
    fit: ['metric_design', 'gas_pipeline_leak_points', 'natural_gas_pipeline_leak_observation'],
    notes: 'Official system-boundary context for methane leakage from wells, storage tanks, pipelines, processing, transport, distribution, and storage.'
  },
  {
    audit_index: 287,
    name: 'EPA Locomotive Emissions Regulations',
    url: 'https://www.epa.gov/regulations-emissions-vehicles-and-engines/regulations-emissions-locomotives',
    access_classification: 'open_portal',
    fit: ['metric_design', 'locomotive_diesel_exhaust', 'locomotive_diesel_pollutant_emission'],
    notes: 'Official engine-tier, certification, duty-cycle, pollutant, test-method, remanufacture, and compliance boundary.'
  },
  {
    audit_index: 288,
    name: 'EPA GHGRP Subpart N Glass',
    url: 'https://www.epa.gov/ghgreporting/subpart-n-information-sheet',
    access_classification: 'open_download',
    fit: ['metric_design', 'glass_furnace_combustion_sinks', 'glass_furnace_greenhouse_gas_emission'],
    notes: 'Official process and stationary-combustion greenhouse-gas reporting boundary for continuous glass-melting furnaces.'
  },
  {
    audit_index: 289,
    name: 'EPA Pulp Paper Effluent Guidelines',
    url: 'https://www.epa.gov/eg/pulp-paper-and-paperboard-effluent-guidelines',
    access_classification: 'open_portal',
    fit: ['metric_design', 'paper_mill_effluent_streams', 'pulp_paper_effluent_load'],
    notes: 'Official mill subcategories, pollutant lists, direct and indirect discharge definitions, limits, and permit context.'
  },
  {
    audit_index: 290,
    name: 'EPA Textile Mills Effluent Guidelines',
    url: 'https://www.epa.gov/eg/textile-mills-effluent-guidelines-documents',
    access_classification: 'open_download',
    fit: ['metric_design', 'textile_factory_toxic_dyes', 'textile_mill_wastewater_pollutant_load'],
    notes: 'Official textile-process, wastewater-characterization, pollutant-loading, treatment, subcategory, and regulatory context.'
  },
  {
    audit_index: 291,
    name: 'EPA Construction Demolition Landfills',
    url: 'https://www.epa.gov/landfills/industrial-and-construction-and-demolition-cd-landfills',
    access_classification: 'open_portal',
    fit: ['metric_design', 'construction_concrete_debris', 'construction_demolition_concrete_flow'],
    notes: 'Official construction-and-demolition material definitions, disposal boundary, material classes, reduction, reuse, and recycling context.'
  },
  {
    audit_index: 292,
    name: 'EPA Bauxite Alumina Production Wastes',
    url: 'https://www.epa.gov/radiation/tenorm-bauxite-and-alumina-production-wastes',
    access_classification: 'open_portal',
    fit: ['metric_design', 'aluminum_smelter_slurry_ponds', 'bauxite_residue_impoundment_inventory'],
    notes: 'Official Bayer-process, residue-mass, impoundment, pH, salinity, metal, radionuclide, disposal, and reuse boundaries.'
  },
  {
    audit_index: 293,
    name: 'IAEA NORM Residue Management',
    url: 'https://nucleus-apps.iaea.org/nss-oui/Content/Index?CollectionId=m_dd3bd740-594b-4fa1-90ed-6914d23840e2&type=PublishedCollection',
    access_classification: 'open_portal',
    fit: ['metric_design', 'uranium_mill_tailings', 'uranium_tailings_facility_condition'],
    notes: 'Authoritative graded framework for uranium-production residues, tailings facilities, monitoring, surveillance, closure, sampling, accuracy, and quality assurance.'
  },
  {
    audit_index: 294,
    name: 'EPA Fluorinated Gas Emissions',
    url: 'https://www.epa.gov/ghgemissions/fluorinated-gas-emissions',
    access_classification: 'open_portal',
    fit: ['metric_design', 'fluorinated_gas_exhaust', 'fluorinated_greenhouse_gas_emission'],
    notes: 'Official species, source-sector, atmospheric-lifetime, global-warming-potential, emission-trend, capture, destruction, substitution, and leakage context.'
  },
  {
    audit_index: 295,
    name: 'IMO MARPOL Annex VI Regulation 14',
    url: 'https://www.imo.org/en/ourwork/environment/pages/sulphur-oxides-%28sox%29-%E2%80%93-regulation-14.aspx',
    access_classification: 'open_portal',
    fit: ['metric_design', 'heavy_fuel_oil_combustion', 'marine_fuel_oil_combustion_emission'],
    notes: 'Official fuel-oil sulphur, combustion-equipment, emission-control-area, SOx, particulate, bunker, and compliance boundary.'
  },
  {
    audit_index: 296,
    name: 'EPA Electric Arc Furnace Slag',
    url: 'https://www.epa.gov/smm/electric-arc-furnace-eaf-slag',
    access_classification: 'open_portal',
    fit: ['metric_design', 'blast_furnace_industrial_slag', 'iron_steel_slag_material_flow'],
    notes: 'Official slag generation, route distinction, encapsulated and unencapsulated use, sampling, material-flow, and risk-context surface.'
  },
  {
    audit_index: 297,
    name: 'EIA Geothermal Energy Environment',
    url: 'https://www.eia.gov/energyexplained/geothermal/geothermal-energy-and-the-environment.php',
    access_classification: 'open_portal',
    fit: ['metric_design', 'geothermal_gas_outflow', 'geothermal_noncondensable_gas_emission'],
    notes: 'Official geothermal-technology, reservoir-gas, hydrogen-sulfide abatement, carbon-dioxide, reinjection, and lifecycle boundary.'
  },
  {
    audit_index: 298,
    name: 'NWS Heat Dome Event Analysis',
    url: 'https://www.weather.gov/media/bro/wxevents/2023/pdf/AnnualSummary.pdf',
    access_classification: 'open_portal',
    fit: ['metric_design', 'atmospheric_heat_domers', 'persistent_mid_tropospheric_high_pressure_ridge'],
    notes: 'Official event analysis connecting a persistent mid-tropospheric high-pressure ridge with heat, dryness, rainfall deficits, and event-specific impacts.'
  },
  {
    audit_index: 299,
    name: 'NOAA Climate Data Online',
    url: 'https://www.ncei.noaa.gov/cdo-web/',
    access_classification: 'open_data',
    fit: ['metric_design', 'atmospheric_heat_domers', 'thermal_air_column_shifts', 'temperature_wind_precipitation_observations'],
    notes: 'Official quality-controlled station archive for temperature, precipitation, wind, degree days, radar, and climate normals.'
  },
  {
    audit_index: 300,
    name: 'NOAA TNH Teleconnection',
    url: 'https://www.cpc.ncep.noaa.gov/data/teledoc/tnh.shtml',
    access_classification: 'open_data',
    fit: ['metric_design', 'polar_jet_stream_anchors', 'northern_hemisphere_jet_position_and_extent'],
    notes: 'Official standardized circulation index and historical series describing changes in Pacific jet location, extent, and associated height patterns.'
  },
  {
    audit_index: 301,
    name: 'IMD Climate Services',
    url: 'https://mausam.imd.gov.in/responsive/climate_services.php',
    access_classification: 'open_portal',
    fit: ['metric_design', 'monsoonal_wind_shear', 'monsoon_vertical_wind_shear'],
    notes: 'Official Indian Meteorological Department climate and monsoon monitoring surface for bounded seasonal and regional analysis.'
  },
  {
    audit_index: 302,
    name: 'EPA AQS NOx',
    url: 'https://www.epa.gov/aqs/aqs-no2-and-so2-naaqs-revisions',
    access_classification: 'open_portal',
    fit: ['metric_design', 'nitrogen_oxide_saturation', 'ambient_nox_concentration_and_ozone_precursor_context'],
    notes: 'Official Air Quality System species codes, units, reporting conventions, and monitoring context for NO, NO2, NOx, and reactive nitrogen.'
  },
  {
    audit_index: 303,
    name: 'NOAA HFC Monitoring',
    url: 'https://gml.noaa.gov/hats/gases/HFC365mfc.html',
    access_classification: 'open_data',
    fit: ['metric_design', 'hydrofluorocarbon_output', 'hydrofluorocarbon_species_emission_and_abundance'],
    notes: 'Official station, monthly mean, zonal mean, instrument, and parts-per-trillion atmospheric observations for a named HFC species.'
  },
  {
    audit_index: 304,
    name: 'EPA Chemical Speciation Network',
    url: 'https://www.epa.gov/amtic/chemical-speciation-network-csn-general-information',
    access_classification: 'open_portal',
    fit: ['metric_design', 'secondary_organic_aerosol_burden', 'pm25_organic_carbon_component'],
    notes: 'Official PM2.5 chemical-speciation network documentation, site inventory, sampling schedules, guidance, and data-quality objectives.'
  },
  {
    audit_index: 305,
    name: 'EPA Chemical Speciation Network Carbon',
    url: 'https://www.epa.gov/amtic/chemical-speciation-network-csn-special-studies',
    access_classification: 'open_portal',
    fit: ['metric_design', 'brown_carbon_loading', 'secondary_organic_aerosol_burden', 'light_absorbing_organic_aerosol_component'],
    notes: 'Official organic- and elemental-carbon measurement, quality-assurance, filter-artifact, and semi-continuous analyzer documentation.'
  },
  {
    audit_index: 306,
    name: 'ITU IP Capacity',
    url: 'https://www.itu.int/ITU-T/recommendations/rec.aspx?id=14999&lang=en',
    access_classification: 'open_portal',
    fit: ['metric_design', 'carrier_interconnection_bottleneck', 'carrier_interconnection_capacity_constraint'],
    notes: 'Official interpretation guidance for maximum Internet Protocol layer capacity measurements under ITU-T Y.1540.'
  },
  {
    audit_index: 307,
    name: 'OECD Communication Resilience',
    url: 'https://www.oecd.org/en/publications/enhancing-the-resilience-of-communication-networks_d6920477-en.html',
    access_classification: 'open_portal',
    fit: ['metric_design', 'fiber_route_outage_risk', 'network_operations_center_dependence', 'switching_node_fragility', 'communication_network_resilience'],
    notes: 'Authoritative network-resilience framework covering redundancy, diversity, outages, recovery, organizational controls, infrastructure dependencies, and metric harmonization.'
  },
  {
    audit_index: 308,
    name: 'FCC Network Outage Reporting',
    url: 'https://www3.fcc.gov/',
    access_classification: 'mixed_or_gated',
    fit: ['metric_design', 'fiber_route_outage_risk', 'network_operations_center_dependence', 'switching_node_fragility', 'telecommunication_service_disruption'],
    notes: 'Official FCC continuity surface identifying the Network Outage Reporting System and Part 4 telecommunications service-disruption reporting boundary.'
  },
  {
    audit_index: 309,
    name: 'NIST Advanced Packaging Manufacturing Program',
    url: 'https://www.nist.gov/chips/research-development-programs/national-advanced-packaging-manufacturing-program',
    access_classification: 'open_portal',
    fit: ['metric_design', 'chip_packaging_throughput', 'semiconductor_advanced_packaging_throughput'],
    notes: 'Official advanced-packaging process, manufacturing-scale, testing, reliability, substrates, materials, equipment, and domestic-capacity context.'
  },
  {
    audit_index: 310,
    name: 'DOE Data Center Water Efficiency',
    url: 'https://www.energy.gov/cmei/femp/cooling-water-efficiency-opportunities-federal-data-centers',
    access_classification: 'open_portal',
    fit: ['metric_design', 'cloud_campus_water_stress', 'data_center_water_use_and_local_scarcity_context'],
    notes: 'Official cooling-tower water balance, heat-load, water-usage-effectiveness, cycles-of-concentration, makeup, blowdown, and operational-efficiency context.'
  },
  {
    audit_index: 311,
    name: 'EPA MOVES',
    url: 'https://www.epa.gov/moves',
    access_classification: 'open_download',
    fit: ['metric_design', 'metropolitan_gridlock_emissions', 'urban_congestion_vehicle_emission', 'mobile_source_emission_inventory'],
    notes: 'Official national, county, and project-scale modeling system for mobile-source greenhouse gases, criteria pollutants, air toxics, energy, activity, fleet, and operating modes.'
  },
  {
    audit_index: 312,
    name: 'FHWA HPMS',
    url: 'https://www.fhwa.dot.gov/policyinformation/hpms.cfm',
    access_classification: 'open_data',
    fit: ['metric_design', 'e_commerce_delivery_vehicle_miles', 'metropolitan_gridlock_emissions', 'last_mile_delivery_vehicle_distance'],
    notes: 'Official national highway extent, condition, performance, use, traffic, vehicle-distance, road-class, and operating-characteristics reporting system.'
  },
  {
    audit_index: 313,
    name: 'Census Commuting',
    url: 'https://www.census.gov/topics/employment/commuting.html',
    access_classification: 'open_data',
    fit: ['metric_design', 'urban_commuting_time_traps', 'urban_journey_to_work_time_distribution'],
    notes: 'Official American Community Survey journey-to-work measures for mode, place of work, departure, travel time, vehicles available, flows, estimates, and uncertainty.'
  },
  {
    audit_index: 314,
    name: 'EPA Ragweed Pollen Indicator',
    url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1015UMW.txt',
    access_classification: 'open_portal',
    fit: ['node_evidence', 'relationship_evidence', 'pollen_allergen_spikes', 'airborne_allergenic_pollen_exposure'],
    notes: 'Official indicator describing season length, monitoring locations, warmer-season and carbon-dioxide mechanisms, airborne transport, health relevance, and bounded historical trends.'
  },
  {
    audit_index: 315,
    name: 'EPA Ragweed Pollen Technical Documentation',
    url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P101FUWR.txt',
    access_classification: 'open_portal',
    fit: ['metric_design', 'relationship_evidence', 'pollen_allergen_spikes', 'airborne_allergenic_pollen_exposure'],
    notes: 'Official station, taxon, frost-date, season-start, season-end, sampler-comparability, quality-assurance, uncertainty, variability, and geographic-limitation documentation.'
  },
  {
    audit_index: 316,
    name: 'CDC Pollen and Health',
    url: 'https://www.cdc.gov/climate-health/php/effects/pollen-health.html',
    access_classification: 'open_portal',
    fit: ['node_evidence', 'relationship_evidence', 'pollen_allergen_spikes', 'respiratory_health_effect'],
    notes: 'Official climate, rainfall, frost-free-day, temperature, carbon-dioxide, exposure, allergic-rhinitis, conjunctivitis, asthma, and public-health context.'
  },
  {
    audit_index: 317,
    name: 'EPA Asthma Triggers',
    url: 'https://www.epa.gov/asthma/asthma-triggers-gain-control',
    access_classification: 'open_portal',
    fit: ['relationship_evidence', 'pollen_allergen_spikes', 'air_pollution_health_burden', 'respiratory_health_effect'],
    notes: 'Official outdoor-pollen exposure, lung aggravation, symptom, chronic respiratory disease, asthma-trigger, and exposure-reduction context.'
  },
  {
    audit_index: 318,
    name: 'NOAA Marine Species Distribution',
    url: 'https://ecowatch.noaa.gov/thematic/marine-species-distribution',
    access_classification: 'open_data',
    fit: ['metric_design', 'node_evidence', 'fisheries_range_redistribution', 'marine_stock_distribution_centroid_and_boundary_change'],
    notes: 'Official DisMAP-based latitude, depth, centroid, preferred-temperature, survey-history, climate-indicator, and distribution-change measurement surface.'
  },
  {
    audit_index: 319,
    name: 'NOAA Fish Populations Across International Boundaries',
    url: 'https://www.fisheries.noaa.gov/feature-story/tracking-climate-driven-shifts-fish-populations-across-international-boundaries',
    access_classification: 'open_portal',
    fit: ['node_evidence', 'relationship_evidence', 'fisheries_range_redistribution', 'fishery_border_dispute_zones'],
    notes: 'Official long-term Bering Sea survey, warming, sea-ice, stock-movement, international-boundary, cross-country data collaboration, and management context.'
  },
  {
    audit_index: 320,
    name: 'NOAA Marine Heatwave Thermal Displacement',
    url: 'https://www.fisheries.noaa.gov/feature-story/ocean-heatwaves-dramatically-shift-habitats',
    access_classification: 'open_portal',
    fit: ['relationship_evidence', 'marine_heatwaves', 'fisheries_range_redistribution', 'thermal_habitat_driver'],
    notes: 'Official thermal-displacement metric, temperature-gradient, habitat-shift distance, regional variability, event, and species-movement context.'
  },
  {
    audit_index: 321,
    name: 'IPCC SROCC Ocean Chapter',
    url: 'https://www.ipcc.ch/srocc/chapter/chapter-5/',
    access_classification: 'open_portal',
    fit: ['node_evidence', 'relationship_evidence', 'fisheries_range_redistribution', 'ocean_deoxygenation', 'ocean_acidification', 'fishery_border_dispute_zones'],
    notes: 'Authoritative assessment of warming-correlated range shifts, oxygen and acidification interactions, uncertainty, survey evidence, transboundary stocks, management agreements, and conflict risk.'
  },
  {
    audit_index: 322,
    name: 'IPCC SRCCL Desertification Chapter',
    url: 'https://www.ipcc.ch/srccl/chapter/chapter-3/',
    access_classification: 'open_portal',
    fit: ['node_evidence', 'relationship_evidence', 'desertification_frontiers', 'dryland_land_degradation_extent_and_condition'],
    notes: 'Authoritative assessment of dryland degradation, warming, evapotranspiration, precipitation, drought, land management, cropland expansion, dust, ecosystem services, food security, uncertainty, and countervailing responses.'
  },
  {
    audit_index: 323,
    name: 'UNCCD Desertification Overview',
    url: 'https://www.unccd.int/land-and-life/desertification/overview',
    access_classification: 'open_portal',
    fit: ['node_evidence', 'relationship_evidence', 'desertification_frontiers', 'dryland_land_degradation_extent_and_condition'],
    notes: 'Independent authoritative overview connecting warming, intensive agriculture, excessive irrigation, soil erosion, aquifer depletion, food insecurity, biodiversity loss, water scarcity, and resilience while preserving the land-monitoring boundary.'
  },
  {
    audit_index: 324,
    name: 'EPA Pesticide Drift',
    url: 'https://www.epa.gov/reducing-pesticide-drift/introduction-pesticide-drift',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'pesticide_spray_drift_zones', 'off_target_pesticide_drift_exposure'],
    notes: 'Official definition, application-source, off-target movement, people, worker, wildlife, plant, surface-water, economic, weather, runoff, label, equipment, and mitigation boundary.'
  },
  {
    audit_index: 325,
    name: 'NPIC Pesticide Drift and Pollinator Protection',
    url: 'https://www.npic.orst.edu/reg/drift.html',
    access_classification: 'open_portal',
    fit: ['node_evidence', 'relationship_evidence', 'pesticide_spray_drift_zones', 'air_pollution_health_burden', 'pollinator_service_decline'],
    notes: 'EPA-supported independent information center describing particle and vapour drift, people, animals, plants, water, health risk, weather, equipment, label controls, and pollinator protection, with a linked pollinator-specific guidance page.'
  },
  {
    audit_index: 326,
    name: 'World Meteorological Organization Sand and Dust Storms',
    url: 'https://wmo.int/topics/sand-and-dust-storms',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'dust_storm_frequency', 'sand_and_dust_storm_event_frequency_and_exposure'],
    notes: 'Authoritative event definition, source, wind entrainment, natural-source, agriculture, poor-land-management, vegetation-cover, transport, air-quality, health, ecosystem, infrastructure, forecasting, and warning framework.'
  },
  {
    audit_index: 327,
    name: 'Atmospheric Rivers Drive Flood Damages',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6892633/',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'atmospheric_river_intensification', 'atmospheric_river_integrated_vapor_transport_intensity_and_duration'],
    notes: 'Open primary study combining a forty-year event catalog, integrated-vapor-transport intensity and duration, gridded precipitation, streamflow, flood stage, insurance claims, alternative flood mechanisms, exposure, antecedent conditions, and uncertainty.'
  },
  {
    audit_index: 328,
    name: 'Federal Aviation Administration Contrails',
    url: 'https://www.faa.gov/contrails',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'aviation_condensation_trails', 'persistent_contrail_and_aviation_induced_cloudiness_burden'],
    notes: 'Official aircraft-exhaust, ice-crystal, temperature, humidity, ice-supersaturation, persistence, cirrus-spreading, engine, fuel, routing, natural-cloud, attribution, mitigation, and uncertainty boundary.'
  },
  {
    audit_index: 329,
    name: 'Trends in Global Tropospheric Hydroxyl Radical and Methane Lifetime Since 1850 from AerChemMIP',
    url: 'https://acp.copernicus.org/articles/20/12905/2020/',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'methane_hydroxyl_sink_loss', 'tropospheric_hydroxyl_oxidation_capacity_and_methane_lifetime'],
    notes: 'Open primary multi-model study of hydroxyl-radical trends, methane chemical lifetime, carbon-monoxide and methane oxidation, nitrogen-oxide and volatile-organic chemistry, climate controls, inversion disagreement, and attribution uncertainty.'
  },
  {
    audit_index: 330,
    name: 'Forced Changes in the Pacific Walker Circulation over the Past Millennium',
    url: 'https://www.nature.com/articles/s41586-023-06447-0',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'walker_circulation_shift', 'pacific_walker_circulation_strength_and_longitude'],
    notes: 'Open primary reconstruction of Pacific zonal overturning variability, external forcing, industrial-era trend ambiguity, proxy and model disagreement, and the need to separate event-scale or decadal variability from a forced long-term response.'
  },
  {
    audit_index: 331,
    name: 'IPCC AR6 WGI Large-Scale Circulation',
    url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'walker_circulation_shift', 'pacific_walker_circulation_strength_and_longitude'],
    notes: 'Authoritative assessment of observed and projected large-scale circulation, tropical zonal overturning, ENSO coupling, pressure, wind, rainfall, internal variability, model spread, attribution, and confidence boundaries.'
  },
  {
    audit_index: 332,
    name: 'ITU Submarine Cable Resilience Recommendations',
    url: 'https://www.itu.int/digital-resilience/submarine-cables/wp-content/uploads/sites/2/2026/02/IAB-WG2-Recommendations-1.pdf',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'subsea_cable_landing_chokepoint', 'submarine_cable_landing_site_concentration_and_hazard_exposure'],
    notes: 'Authoritative international recommendations covering choke points, route congestion, clustered landings, natural and human hazards, station security, audits, stress tests, redundancy, repair readiness, decommissioning, and resilience gaps.'
  },
  {
    audit_index: 333,
    name: 'Identifying Predictors of International Fisheries Conflict',
    url: 'https://researchonline.jcu.edu.au/69248/',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'fishery_border_dispute_zones', 'international_fisheries_conflict_incidents_and_severity'],
    notes: 'Open primary global event study testing supply-induced scarcity, demand-induced scarcity, political, economic, and governance predictors against international fisheries-conflict records from 1974 to 2016.'
  },
  {
    audit_index: 334,
    name: 'NOAA GOES-R Series Advanced Baseline Imager ABI Level 2 Derived Stability Indices DSI',
    url: 'https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.ncdc%3AC01516',
    access_classification: 'open_data',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'convective_instability_shift', 'convective_available_potential_energy_and_inhibition_anomaly'],
    notes: 'Official satellite-derived CAPE, lifted-index, total-totals, K-index, temperature, moisture, atmospheric-stability, pixel, algorithm, quality, and potential-thunderstorm metadata surface.'
  },
  {
    audit_index: 335,
    name: 'NOAA GOES-R Series Geostationary Lightning Mapper',
    url: 'https://goes-r.noaa.gov/spacesegment/glm.html',
    access_classification: 'open_data',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'lightning_regime_shifts', 'lightning_flash_density_extent_and_seasonality_anomaly'],
    notes: 'Official continuous total-lightning instrument surface covering flash time, location, frequency, extent, radiant energy, field of view, spatial resolution, storm evolution, and observation boundaries.'
  },
  {
    audit_index: 336,
    name: 'Scientific Assessment of Ozone Depletion 2022 Twenty Questions and Answers About the Ozone Layer',
    url: 'https://csl.noaa.gov/assessments/ozone/2022/twentyquestions/',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'cfc_saturated_layers', 'stratospheric_chlorine_sinks', 'atmospheric_ozone_depleting_substance_burden', 'stratospheric_ozone_column_depletion_and_recovery'],
    notes: 'WMO and NOAA assessment definitions for CFC, HCFC, halon and replacement gases, species abundance, atmospheric lifetime, equivalent effective stratospheric chlorine, ozone chemistry, Montreal Protocol response, regional recovery, ultraviolet exposure, and uncertainty.'
  },
  {
    audit_index: 337,
    name: 'Scientific Assessment of Ozone Depletion 2022 Executive Summary',
    url: 'https://csl.noaa.gov/assessments/ozone/2022/executivesummary/',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'cfc_saturated_layers', 'stratospheric_chlorine_sinks', 'stratospheric_cooling'],
    notes: 'Authoritative assessment of measured chlorine and bromine source gases, EESC, total-column and profile ozone, attribution, recovery projections, ODS banks, very-short-lived substances, climate interactions, and policy counterfactuals.'
  },
  {
    audit_index: 338,
    name: 'UNEP Ozone Secretariat Montreal Protocol',
    url: 'https://ozone.unep.org/treaties/montreal-protocol/montreal-protocol-substances-deplete-ozone-layer',
    access_classification: 'open_portal',
    fit: ['node_evidence', 'relationship_evidence', 'cfc_saturated_layers', 'refrigerant_phase_down'],
    notes: 'Primary treaty source for substance-specific control measures covering CFCs, halons, HCFCs, carbon tetrachloride, methyl chloroform, methyl bromide, and related controlled substances.'
  },
  {
    audit_index: 339,
    name: 'Physical and Chemical Data for Dust Deposited on Colorado Rocky Mountain Snow Cover During Water Year 2013 Through Water Year 2016',
    url: 'https://www.usgs.gov/data/physical-and-chemical-data-dust-deposited-colorado-rocky-mountain-snow-cover-during-water-year',
    access_classification: 'open_data',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'snowpack_dust_soot_coverage', 'mineral_dust_mass_loading_and_snow_albedo', 'snowmelt_timing_shift'],
    notes: 'USGS data release with site, sample, mineral composition, particle size, mass loading, spectral reflectance, snow-surface albedo, melt-stage, and uncertainty fields for mineral dust on mountain snow.'
  },
  {
    audit_index: 340,
    name: 'Combined Impacts of Current and Future Dust Deposition and Regional Warming on Colorado River Basin Snow Dynamics and Hydrology',
    url: 'https://pubs.usgs.gov/publication/70107102',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'snowpack_dust_soot_coverage', 'snowmelt_timing_shift', 'hydrological_runoff_surges'],
    notes: 'Open primary study separating mineral-dust loading and climate scenarios, snow albedo and radiative forcing, melt timing, peak runoff, annual flow, evapotranspiration, and transfer limits in the Upper Colorado River Basin.'
  },
  {
    audit_index: 341,
    name: 'Pesticides and Water Quality',
    url: 'https://www.usgs.gov/mission-areas/water-resources/science/pesticides-and-water-quality',
    access_classification: 'open_data',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'agrochemical_water_sinks', 'surface_water_pesticide_residue_concentration_and_benchmark_ratio', 'freshwater_ecosystem_collapse'],
    notes: 'USGS monitoring and data surface for compound-resolved pesticide use, occurrence, concentration trends, degradates, water and sediment matrices, mixture toxicity screening, stream ecology, groundwater, land use, hydrology, and analytical boundaries.'
  },
  {
    audit_index: 342,
    name: 'USGS Pesticides in Stream Sediment and Aquatic Biota',
    url: 'https://water.usgs.gov/nawqa/pnsp/pubs/fs09200/',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'pesticide_bioaccumulation_chains', 'persistent_pesticide_residue_in_sediment_and_biota', 'biodiversity_intactness_loss'],
    notes: 'Authoritative synthesis of pesticide occurrence in bed sediment and aquatic organisms, hydrophobicity, persistence, sources, trends, tissue exposure, benthic and fish pathways, food-chain relevance, and biological significance.'
  },
  {
    audit_index: 343,
    name: 'EPA Aquatic Life Benchmarks and Ecological Risk Assessments for Registered Pesticides',
    url: 'https://www.epa.gov/pesticide-science-and-assessing-pesticide-risks/aquatic-life-benchmarks-and-ecological-risk',
    access_classification: 'open_data',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'agrochemical_water_sinks', 'freshwater_ecosystem_collapse'],
    notes: 'Current compound-, degradate-, taxon-, acute-, and chronic-specific freshwater and estuarine screening benchmarks linked to regulatory ecological risk assessments, methods, limitations, and update provenance.'
  },
  {
    audit_index: 344,
    name: 'EPA Ecological Risk Assessment for Pesticides Technical Overview',
    url: 'https://www.epa.gov/pesticide-science-and-assessing-pesticide-risks/ecological-risk-assessment-pesticides-technical',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'agrochemical_water_sinks', 'pesticide_bioaccumulation_chains', 'freshwater_ecosystem_collapse', 'biodiversity_intactness_loss'],
    notes: 'Official active-ingredient, degradate, environmental-fate, water, soil, air, food-residue, toxicity, non-target-species, exposure, direct-effect, indirect-effect, risk-characterization, and uncertainty framework.'
  },
  {
    audit_index: 345,
    name: 'Estimating Functional Connectivity of Wildlife Habitat and Its Relevance to Ecological Risk Assessment',
    url: 'https://www.usgs.gov/publications/estimating-functional-connectivity-wildlife-habitat-and-its-relevance-ecological-risk',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'biodiversity_corridors_disruption', 'species_specific_functional_habitat_connectivity', 'forest_fragmentation', 'biodiversity_intactness_loss'],
    notes: 'Primary organism-specific definition of functional connectivity, habitat patches, fragmentation, habitat loss, isolation distance, spatial scale, movement, exchange, dispersal, body size, ecological risk, and biodiversity boundaries.'
  },
  {
    audit_index: 346,
    name: 'USGS Evaluation of Connectivity for Wildlife in Human-Altered Landscapes',
    url: 'https://www.usgs.gov/centers/werc/science/evaluation-connectivity-wildlife-human-altered-landscapes-mule-deer-landscape',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'biodiversity_corridors_disruption', 'urbanization', 'forest_fragmentation'],
    notes: 'Species-specific urbanization, road, highway, habitat fragmentation, landscape permeability, movement, crossing, mortality, gene-flow, genetic-diversity, focal-species, and validation research surface.'
  },
  {
    audit_index: 347,
    name: 'US Forest Service Role of Landscape Connectivity in Conservation and Restoration Priorities',
    url: 'https://research.fs.usda.gov/treesearch/42229',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'biodiversity_corridors_disruption', 'biodiversity_intactness_loss', 'forest_fragmentation'],
    notes: 'Peer-reviewed synthesis of landscape connectivity, habitat loss, fragmentation, dispersal, migration, gene flow, climate adaptation, carrying capacity, population decline, genetic variation, extinction risk, conservation, and restoration limits.'
  },
  {
    audit_index: 348,
    name: 'When Timing Is Everything Migratory Bird Phenology in a Changing Climate',
    url: 'https://www.usgs.gov/news/when-timing-everything-migratory-bird-phenology-changing-climate',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'avian_migration_disruptions', 'migratory_bird_passage_timing_route_and_stopover_use', 'temp', 'biodiversity_intactness_loss'],
    notes: 'USGS synthesis of migration, breeding and nesting phenology, temperature and precipitation, plants and insect food, synchrony and overlap, stopover habitat, species differences, demographic uncertainty, connected habitat, and management boundaries.'
  },
  {
    audit_index: 349,
    name: 'Detecting Mismatches of Bird Migration Stopover and Tree Phenology in Response to Changing Climate',
    url: 'https://www.usgs.gov/index.php/publications/detecting-mismatches-bird-migration-stopover-and-tree-phenology-response-changing',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'avian_migration_disruptions', 'migratory_bird_passage_timing_route_and_stopover_use'],
    notes: 'Primary multi-habitat study with migrant abundance, tree flowering, event dates, synchrony, overlap, temperature, precipitation, snow, drought, habitat interactions, refugia, method sensitivity, and demographic interpretation limits.'
  },
  {
    audit_index: 350,
    name: 'US Fish and Wildlife Service Threats to Birds Habitat Impacts',
    url: 'https://www.fws.gov/story/threats-birds-habitat-impacts',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'avian_migration_disruptions', 'biodiversity_corridors_disruption', 'biodiversity_intactness_loss'],
    notes: 'Authoritative annual-cycle habitat, breeding, feeding, shelter, stopover, flyway, connectivity, fragmentation, development, climate, productivity, population decline, conservation, and restoration boundary.'
  },
  {
    audit_index: 351,
    name: 'Effects of Climate Change on Forest Vegetation in the Northern Rockies',
    url: 'https://www.usgs.gov/publications/effects-climate-change-forest-vegetation-northern-rockies',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'high_altitude_forest_shrinkage', 'mountain_forest_cover_and_treeline_contraction', 'temp', 'drought_persistence', 'wildfire_regime_shift'],
    notes: 'Primary regional assessment of temperature, soil moisture, drought tolerance, abundance and distribution, upper and lower treelines, wildfire, insects, disturbance, age structure, tree size, and high-elevation vulnerability.'
  },
  {
    audit_index: 352,
    name: 'USGS Effects of Disturbance and Drought on Forests and Hydrology of the Southern Rocky Mountains',
    url: 'https://www.usgs.gov/programs/ecosystems-land-change-science-program/science/effects-disturbance-and-drought-forests-and',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'high_altitude_forest_shrinkage', 'drought_persistence', 'wildfire_regime_shift', 'forest_dieback_areas'],
    notes: 'Long-term ecological, paleo, remote-sensing, drought, vapor-pressure-deficit, snowmelt, plant-water, growth, mortality, insect, high-severity-fire, ecosystem-transformation, and hydrology research surface.'
  },
  {
    audit_index: 353,
    name: 'NASA Study Examines Forest Vulnerability to Climate Change',
    url: 'https://www.jpl.nasa.gov/news/study-examines-forest-vulnerability-to-climate-change/',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'high_altitude_forest_shrinkage', 'mountain_forest_cover_and_treeline_contraction'],
    notes: 'Satellite and ground study of elevation-specific forest greenness, snow accumulation and melt, water- and energy-limited boundaries, soil and nutrient alternatives, fire, beetle mortality, and geographic transfer limits.'
  },
  {
    audit_index: 354,
    name: 'Pan-Amphibia Distribution of the Fungal Parasite Batrachochytrium dendrobatidis Varies With Species and Temperature',
    url: 'https://www.usgs.gov/publications/pan-amphibia-distribution-fungal-parasite-batrachochytrium-dendrobatidis-varies',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'amphibian_chytrid_fungus_spreads', 'amphibian_chytrid_infection_prevalence_intensity_and_mortality', 'temp'],
    notes: 'Continental primary analysis of host swabs, prevalence, infection intensity, pathogen identity, host taxon, temperature, precipitation, nonlinear response, enzootic distribution, detection, and inference limits.'
  },
  {
    audit_index: 355,
    name: 'USGS Epizootiology of Sixty-Four Amphibian Morbidity and Mortality Events',
    url: 'https://pubs.usgs.gov/publication/70024118',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'amphibian_chytrid_fungus_spreads', 'biodiversity_intactness_loss'],
    notes: 'Diagnostically bounded mortality-event review separating chytrid fungi, ranaviruses and other causes, affected life stages, morbidity, mortality severity, detection bias, and population-decline evidence.'
  },
  {
    audit_index: 356,
    name: 'USGS A Is for Amphibian',
    url: 'https://www.usgs.gov/mission-areas/ecosystems/science/amphibian',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'amphibian_chytrid_fungus_spreads', 'biodiversity_intactness_loss', 'trophic_cascade_collapses'],
    notes: 'Authoritative host taxonomy, disease surveillance, swabbing, Bd and Bsal distinction, habitat, predator and prey roles, ecosystem-health context, multiple-stressor causes, decline, management, and uncertainty surface.'
  },
  {
    audit_index: 357,
    name: 'Integrated Science for the Study of Microplastics in the Environment',
    url: 'https://pubs.usgs.gov/publication/cir1521/full',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'aerosolized_microplastics', 'microplastic_suspensions', 'plastics_petrochemicals', 'urbanization'],
    notes: 'USGS strategic science synthesis covering atmospheric lofting from roads, oceans, fields and population centres, long-range transport, wet and dry deposition, receiving environments, sampling protocols, contamination controls, size limits, polymer confirmation, and method comparability.'
  },
  {
    audit_index: 358,
    name: 'USGS It Is Raining Plastic',
    url: 'https://www.usgs.gov/publications/it-raining-plastic',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'aerosolized_microplastics', 'urbanization'],
    notes: 'Primary wet-deposition survey using National Atmospheric Deposition Program collectors across urban and remote Colorado sites, with filter occurrence, morphology, visible-identification limitations, and explicit need for improved chemical analysis.'
  },
  {
    audit_index: 359,
    name: 'NIST Airborne Microplastic Sampling and Characterization',
    url: 'https://www.nist.gov/mml/mmsd/nano-materials-research-group/airborne-microplastic-sampling-and-characterization',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'aerosolized_microplastics', 'plastics_petrochemicals'],
    notes: 'Federal measurement-science programme developing validated air sampling, microscopy, electron microscopy and Raman characterization for heterogeneous real-world particles at a recycling facility, with direct disclosure of current method gaps.'
  },
  {
    audit_index: 360,
    name: 'NOAA Microplastic Researchers Seek to Understand Atmospheric Transport',
    url: 'https://www.arl.noaa.gov/news-pubs/microplastic-transport/',
    access_classification: 'open_portal',
    fit: ['node_evidence', 'relationship_evidence', 'aerosolized_microplastics', 'microplastic_suspensions'],
    notes: 'NOAA Air Resources Laboratory overview of particle lofting, days-to-weeks atmospheric transport, HYSPLIT trajectory use, remote deposition, and atmospheric delivery to marine environments.'
  },
  {
    audit_index: 361,
    name: 'NOAA Florida Current Transport Time Series Data Products',
    url: 'https://www.aoml.noaa.gov/phod/floridacurrent/data_access.php',
    access_classification: 'operational_open',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'gulf_stream_slowdown', 'amoc'],
    notes: 'Open daily and survey transport products in Sverdrups with section, cable, pressure-gauge, altimetry, geomagnetic correction, missing-data, calibration, version, and citation metadata for the Florida Straits record.'
  },
  {
    audit_index: 362,
    name: 'NOAA AOML Meridional Overturning Circulation Monitoring',
    url: 'https://www.aoml.noaa.gov/moc/',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'gulf_stream_slowdown', 'amoc', 'coastal_inundation_risk'],
    notes: 'Authoritative observing-system overview separating upper western-boundary, deep, interior, and wind-driven components and documenting the bounded inverse relationship between Florida transport and adjacent dynamic sea level.'
  },
  {
    audit_index: 363,
    name: 'NOAA On the Nature of Temporal Variability of the Gulf Stream Path',
    url: 'https://repository.library.noaa.gov/view/noaa/64877',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'gulf_stream_slowdown', 'north_atlantic_oscillation'],
    notes: 'Primary satellite-altimetry analysis of path latitude, sea-surface-height contours, atmospheric forcing, longitude-dependent temporal bands, lags, subpolar and subtropical pathways, and causal limitations.'
  },
  {
    audit_index: 364,
    name: 'IPCC AR6 Gulf Stream and AMOC Circulation Distinction',
    url: 'https://www.ipcc.ch/report/ar6/wg1/figures/chapter-9/faq-9-3-figure-1',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'gulf_stream_slowdown', 'amoc', 'ocean_current_regime_shift'],
    notes: 'Authoritative distinction between horizontal wind-driven gyre circulation and vertical Atlantic overturning, preventing a section, path, or surface-current observation from being treated as the entire basin-scale system.'
  },
  {
    audit_index: 365,
    name: 'IPCC AR6 North Atlantic Subpolar Gyre Assessment',
    url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'subpolar_gyre_weakening', 'north_atlantic_oscillation', 'ocean_salinity_stratification', 'temp'],
    notes: 'Authoritative assessment of horizontal gyre versus overturning, strong modulation by Atlantic atmospheric and ocean variability, convective mixing, salinity transport, air-sea interaction, abrupt feedbacks, regionality, observations, and attribution limits.'
  },
  {
    audit_index: 366,
    name: 'Spin Down of the North Atlantic Subpolar Circulation',
    url: 'https://ntrs.nasa.gov/citations/20040035746',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'subpolar_gyre_weakening', 'ocean_salinity_stratification', 'temp'],
    notes: 'NASA-hosted primary altimetry, current-meter and hydrographic analysis of sea-surface height, geostrophic velocity, deep structure, freshwater history, buoyancy forcing, density surfaces, trend uncertainty, and low-frequency alternatives.'
  },
  {
    audit_index: 367,
    name: 'Northern North Atlantic Sea Surface Height and Ocean Heat Content Variability',
    url: 'https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20140010390.pdf',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'subpolar_gyre_weakening', 'atlantic_multidecadal_oscillation'],
    notes: 'NASA-hosted primary analysis connecting altimetric height, upper-ocean heat content, wind-stress gyre mode, subtropical-water advection, Atlantic multidecadal variability, spatial pattern, reference period, and proxy limitations.'
  },
  {
    audit_index: 368,
    name: 'NOAA Salinity Trends Within the Upper Layers of the Subpolar North Atlantic',
    url: 'https://repository.library.noaa.gov/view/noaa/48397',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'subpolar_gyre_weakening', 'north_atlantic_oscillation', 'ocean_salinity_stratification'],
    notes: 'Primary multi-product salinity study separating western, central and eastern mechanisms, freshwater transport, current-strength correlation, atmospheric wind-stress forcing, stratification, nutrient-flux implications, and regional uncertainty.'
  },
  {
    audit_index: 369,
    name: 'Primary Copper Smelting New Source Performance Standards',
    url: 'https://www.epa.gov/stationary-sources-air-pollution/primary-copper-smelting-new-source-performance-standards',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'copper_smelter_acid_rainfall', 'sulfur_dioxide'],
    notes: 'EPA source-category standard identifying roasters, smelting furnaces, converters, stack-gas sulfur-dioxide concentration, particulate matter, opacity, six-hour averaging, and facility-control boundaries.'
  },
  {
    audit_index: 370,
    name: 'EPA What Is Acid Rain',
    url: 'https://www.epa.gov/acidrain/what-acid-rain',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'relationship_evidence', 'copper_smelter_acid_rainfall', 'sulfur_dioxide', 'acid_rain_deposition'],
    notes: 'Authoritative separation of precursor emissions, atmospheric transport, chemical conversion, wet and dry deposition, multiple source sectors, receptor exposure, and long-range attribution boundaries.'
  },
  {
    audit_index: 371,
    name: 'FAA Wildlife Management',
    url: 'https://www.faa.gov/airports/airport_safety/wildlife/management',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'airport_runway_canopy_clearance', 'aviation'],
    notes: 'Authoritative airport habitat-management guidance that distinguishes wildlife-hazard mitigation, land-use controls, vegetation management, and safety objectives from generalized ecological loss.'
  },
  {
    audit_index: 372,
    name: 'Improving Biosecurity Through Prudent and Responsible Use of Veterinary Medicines in Aquatic Food Production',
    url: 'https://www.fao.org/4/ba0056e/ba0056e00.htm',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'aquaculture_pond_anti_parasitics', 'industry_farming'],
    notes: 'FAO technical guidance covering compound-specific veterinary use, treatment records, residues, withdrawal, biosecurity, environmental exposure, and responsible-use boundaries in aquaculture.'
  },
  {
    audit_index: 373,
    name: 'Distribution of Plant Nutrient Elements and Carbon in Particle Size Fractions of Broiler Litter Ash',
    url: 'https://www.nal.usda.gov/exhibits/ipd/frostonchickens/items/show/294',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'broiler_chicken_litter_ash', 'industry_farming'],
    notes: 'USDA-hosted peer-reviewed characterization of source material, combustion ash, particle fractions, nutrient composition, fertilizer use, landfill disposition, and leaching caveats.'
  },
  {
    audit_index: 374,
    name: 'EPA Information on Contrails From Aircraft',
    url: 'https://www.epa.gov/regulations-emissions-vehicles-and-engines/Contrails',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'aviation_sulphate_particle_layer', 'aviation'],
    notes: 'Authoritative description of aircraft exhaust constituents, sulfur oxides, particles, water vapour, cold ambient conditions, and contrail formation without asserting a persistent sulfate layer.'
  },
  {
    audit_index: 375,
    name: 'Sustainable Materials Management Basics',
    url: 'https://www.epa.gov/smm/sustainable-materials-management-basics',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'consumer_product_obsolescence', 'resource_depletion'],
    notes: 'EPA lifecycle framework covering extraction, manufacture, use, maintenance, useful life, durability, reuse, disassembly, and end-of-life material management without presuming planned obsolescence.'
  },
  {
    audit_index: 376,
    name: 'Risk Management Crop Insurance at a Glance',
    url: 'https://www.ers.usda.gov/topics/farm-practices-management/risk-management/crop-insurance-at-a-glance',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'agricultural_crop_insurance_hikes', 'insurance_retreat'],
    notes: 'USDA ERS definitions and downloadable series for insured acreage, liability, premiums, subsidies, indemnities, causes of loss, loss ratios, portfolio changes, and policy context.'
  },
  {
    audit_index: 377,
    name: 'FAO Land Degradation by Rural Land Use in Drylands',
    url: 'https://www.fao.org/4/x5308e/x5308e04.htm',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'desert_boundary_grazing', 'desertification_frontiers'],
    notes: 'FAO mechanism review separating livestock density, carrying capacity, drought, vegetation recovery, compaction, erosion, water-point concentration, and other dryland degradation drivers.'
  },
  {
    audit_index: 378,
    name: 'The Epidemic Intelligence From Open Sources Initiative',
    url: 'https://www.who.int/initiatives/eios',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'disease_surveillance_gaps', 'early_warning_coverage_gaps'],
    notes: 'WHO operational framework for near-real-time threat detection, assessment, verification, decision support, collaboration, and the time advantage of surveillance signals.'
  },
  {
    audit_index: 379,
    name: 'Electronics Basic Information Research and Initiatives',
    url: 'https://www.epa.gov/electronics-batteries-management/electronics-basic-information-research-and-initiatives',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'e_waste_lead_soil_bleeding', 'electronics_end_of_life_collection', 'consumer_product_obsolescence'],
    notes: 'EPA electronics lifecycle guidance covering sourcing, product durability, reuse, refurbishment, recycling, material recovery, unsafe handling, and source-attribution limits.'
  },
  {
    audit_index: 380,
    name: 'Highway Traffic Noise Abatement Guidance',
    url: 'https://www.fhwa.dot.gov/Environment/noise/regulations_and_guidance/analysis_and_abatement_guidance/polguide05.cfm',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'freeway_acoustic_walls_deficit', 'personal_conveyance'],
    notes: 'FHWA receptor- and project-specific guidance covering noise-barrier geometry, insertion loss, feasibility, reasonableness, limitations, openings, terrain, and expected reductions.'
  },
  {
    audit_index: 381,
    name: 'The Interaction of Climate Change and Methane Hydrates',
    url: 'https://www.usgs.gov/publications/interaction-climate-change-and-methane-hydrates',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'subsea_methane_hydrate_venting', 'methane'],
    notes: 'USGS synthesis separating hydrate stability, dissociation, sediment and water-column sinks, sea-air delivery, observational limits, and the lack of conclusive proof of present hydrate-derived atmospheric methane.'
  },
  {
    audit_index: 382,
    name: 'Functional Attributes of Ungulate Migration',
    url: 'https://www.usgs.gov/publications/functional-attributes-ungulate-migration-landscape-features-facilitate-movement-and',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'ungulate_grazing_path_corridors', 'wildlife_habitat_patches'],
    notes: 'USGS primary study distinguishing movement corridors, stopovers, forage access, topography, disturbance, herd-specific route use, and migration persistence.'
  },
  {
    audit_index: 383,
    name: 'FAO Good Environmental Practices in Bioenergy Feedstock Production',
    url: 'https://www.fao.org/docrep/015/i2596e/i2596e00.pdf',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'slash_and_burn_ash_cover', 'biofuel_crop_land_grab', 'deforestation'],
    notes: 'FAO assessment of land preparation, slash-and-burn practice, erosion, biodiversity, forest resources, feedstock production, land-use change, and management boundaries.'
  },
  {
    audit_index: 384,
    name: 'NOAA Understanding Methane Seep Formation and Prevalence',
    url: 'https://oceanexplorer.noaa.gov/news/methane-seep-formation/',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'subsea_methane_hydrate_venting', 'methane'],
    notes: 'NOAA and USGS survey evidence on seep inventories, depths, faulting, erosion, sediment transport, fluid migration, microbial consumption, habitat, and the distinction between seafloor flux and atmospheric delivery.'
  },
  {
    audit_index: 385,
    name: 'Tree Mortality From Drought Insects and Their Interactions in a Changing Climate',
    url: 'https://www.usgs.gov/publications/tree-mortality-drought-insects-and-their-interactions-a-changing-climate',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'boreal_insect_infestations', 'forest_dieback_areas'],
    notes: 'USGS-hosted primary synthesis separating bark beetles, defoliators, drought, heat, host physiology, interactions, mortality, natural outbreaks, biomes, and attribution limits.'
  },
  {
    audit_index: 386,
    name: 'Land Surface Phenology',
    url: 'https://www.usgs.gov/publications/land-surface-phenology',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'deciduous_leaf_drop_offsets', 'biodiversity_intactness_loss'],
    notes: 'USGS technical review defining sensor-derived growing and senescence timing, validation, vegetation aggregation, mixed-pixel limitations, and the distinction from individual plant phenophases.'
  },
  {
    audit_index: 387,
    name: 'Estimating Functional Connectivity of Wildlife Habitat and Its Relevance to Ecological Risk Assessment',
    url: 'https://www.usgs.gov/publications/estimating-functional-connectivity-wildlife-habitat-and-its-relevance-ecological-risk',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'edge_effect_intensifications', 'endemic_species_isolations', 'wildlife_habitat_patches'],
    notes: 'USGS organism- and scale-specific connectivity framework covering fragmentation, disjunct patches, movement, exchange, life history, dispersal, patch size, and ecological-risk interpretation.'
  },
  {
    audit_index: 388,
    name: 'EPA Hazardous Substance Release Reporting',
    url: 'https://www.epa.gov/emergency-response/what-information-needed-when-reporting-oil-spill-or-hazardous-substance-release',
    access_classification: 'open_portal',
    fit: ['metric_design', 'research_track_metric', 'chemical_factory_acid_spills'],
    notes: 'EPA incident-data contract covering named material, quantity, source, cause, affected medium, threat, injuries, evacuation, weather, responsible party, time, place, and reporting limitations.'
  },
  {
    audit_index: 389,
    name: 'EPA Surface Runoff Hydrologic Micro Services',
    url: 'https://qed.epa.gov/hms/hydrology/surfacerunoff/',
    access_classification: 'open_api',
    fit: ['metric_design', 'research_track_metric', 'flame_retardant_runoff'],
    notes: 'EPA hydrologic model surface defining runoff, precipitation, infiltration, catchment transport, chemical concentrations, erosion, and contamination pathways without identifying a compound source or effect.'
  },
  {
    audit_index: 390,
    name: 'Combating Wildlife Trafficking',
    url: 'https://www.fws.gov/our-work/combating-wildlife-trafficking',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'illegal_wildlife_poaching', 'biodiversity_intactness_loss'],
    notes: 'Fish and Wildlife Service framework separating poaching, smuggling, illegal trade, protected species, enforcement, sustainable legal trade, conservation outcomes, and broader security risks.'
  },
  {
    audit_index: 391,
    name: 'NOAA Aquatic Food Webs',
    url: 'https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'keystone_species_deficits', 'top_predator_extinctions', 'biodiversity_intactness_loss'],
    notes: 'NOAA mechanism overview separating trophic position, direct and indirect effects, predator removal, prey release, cascading responses, alternate prey, and system-specific evidence.'
  },
  {
    audit_index: 392,
    name: 'EPA Lichen Biomonitoring',
    url: 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=9100R6WG.TXT',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'lichen_layer_degradations', 'biodiversity_intactness_loss'],
    notes: 'EPA biomonitoring guidance using species presence, development, cover, frequency, and tissue condition while requiring substrate, climate, forest structure, pollutant, and reference-context controls.'
  },
  {
    audit_index: 393,
    name: 'WOAH Named Outbreak Assessment',
    url: 'https://www.woah.org/en/document/updated-joint-fao-who-woah-public-health-assessment-of-recent-high-pathogenicity-avian-influenza-ah5-virus-events-in-animals-and-people-based-on-data-as-of-1-march-2026/',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'exotic_pathogen_outbreaks', 'biodiversity_intactness_loss'],
    notes: 'Joint named-pathogen assessment separating animal circulation, spread to new species, zoonotic transmission, diagnostics, geography, surveillance, case definitions, and uncertainty.'
  },
  {
    audit_index: 394,
    name: 'NASA SAGE Stratospheric Water Vapor Science',
    url: 'https://sage.nasa.gov/science/',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'stratospheric_water_vapor', 'solar_radiation_trapping'],
    notes: 'NASA retrieval program measuring vertical profiles of stratospheric water vapour and aerosols as distinct quantities, with instrument, altitude, sampling, and retrieval context.'
  },
  {
    audit_index: 395,
    name: 'UNEP Fashion Microfiber Shedding',
    url: 'https://www.unep.org/news-and-stories/story/fashions-tiny-hidden-secret',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'textile_microfiber_shedding', 'fast_fashion'],
    notes: 'UNEP source-pathway evidence separating synthetic polymer content, fabric construction, washing, abrasion, particle release, wastewater capture, and environmental transfer.'
  },
  {
    audit_index: 396,
    name: 'EEA Destruction of Returned and Unsold Textiles',
    url: 'https://www.eea.europa.eu/en/newsroom/news/many-returned-and-unsold-textiles',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'unsold_apparel_incineration', 'fast_fashion'],
    notes: 'European Environment Agency assessment distinguishing returned and unsold stock, destruction route, reuse, recycling, incineration, landfill, data gaps, and lifecycle emissions.'
  },
  {
    audit_index: 397,
    name: 'NOAA Storm Surge and Storm Tide',
    url: 'https://oceanservice.noaa.gov/facts/stormsurge-stormtide.html',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'storm_surge_floods', 'coastal_inundation_risk'],
    notes: 'NOAA definition and measurement boundary separating storm surge, astronomical tide, storm tide, waves, coastal geometry, bathymetry, and observed inundation.'
  },
  {
    audit_index: 398,
    name: 'Winter Road Climate Risk and Vulnerability 2020-2025 Research Summary',
    url: 'https://nrc-publications.canada.ca/eng/view/object/?id=811fed70-eb56-4f3b-b795-201695feb6ae',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'winter_ice_road_collapses', 'critical_infrastructure_fragility'],
    notes: 'National Research Council Canada synthesis defining winter-road season, freeze depth, safe load, cold-day requirements, climate vulnerability, standards, and maintenance controls.'
  },
  {
    audit_index: 399,
    name: 'EPA Health Effects of Ozone Pollution',
    url: 'https://www.epa.gov/ground-level-ozone-pollution/health-effects-ozone-pollution',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'urban_smog_health_expenses', 'air_pollution_health_burden'],
    notes: 'EPA health evidence separating monitored exposure, respiratory outcomes, health-care use, susceptibility, concentration, duration, and economic valuation.'
  },
  {
    audit_index: 400,
    name: 'USGS Glacier-Related Outburst Floods',
    url: 'https://www.usgs.gov/publications/glacier-related-outburst-floods',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'subglacial_lake_drainages', 'ice_sheet_mass_loss'],
    notes: 'USGS process synthesis separating lake position, impounded volume, drainage route, tunnel geometry, peak discharge, duration, recurrence, glacier thinning, and downstream consequences.'
  },
  {
    audit_index: 401,
    name: 'FRA Buckling-Prone Conditions in Continuous Welded Rail Track',
    url: 'https://railroads.fra.dot.gov/regulations/federal-register-documents/2012-17343',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'railroad_chemical_car_derailments', 'critical_infrastructure_fragility'],
    notes: 'Federal Railroad Administration advisory linking extreme heat, track buckling, maintenance and inspection controls, derailment risk, and accident-specific evidence without treating every derailment as heat-caused.'
  },
  {
    audit_index: 402,
    name: 'USGS Glacial Meltwater Stream Chemistry',
    url: 'https://www.usgs.gov/publications/weathering-reactions-and-hyporheic-exchange-controls-stream-water-chemistry-a-glacial',
    access_classification: 'open_download',
    fit: ['metric_design', 'research_track_metric', 'glacial_meltwater_acidification'],
    notes: 'USGS field research measuring meltwater solutes, weathering, hyporheic exchange, stream length, flow season, geology, and chemical controls without imposing a universal acidification direction.'
  },
  {
    audit_index: 403,
    name: 'FTA Transit Asset Management Performance Restrictions',
    url: 'https://www.transit.dot.gov/PerformanceManagement',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'commuter_rail_transit_gaps', 'critical_infrastructure_fragility'],
    notes: 'Federal Transit Administration performance contract for rail guideway segments under speed restriction, track miles, cause, observation timing, asset condition, and annual reporting.'
  },
  {
    audit_index: 404,
    name: 'UNHCR Settlement Planning Standards',
    url: 'https://emergency.unhcr.org/emergency-assistance/shelter-camp-and-settlement/settlements/principles-standards-settlement-planning',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'climate_refugee_camp_densities', 'migration'],
    notes: 'UNHCR planning standard defining people, settlement area, square metres per person, services, expansion, topography, drainage, fire safety, and the limits of a density-only interpretation.'
  },
  {
    audit_index: 405,
    name: 'World Bank Lifelines Resilient Infrastructure Costs',
    url: 'https://www.worldbank.org/en/news/press-release/2019/06/19/42-trillion-can-be-saved-by-investing-in-more-resilient-infrastructure-new-world-bank-report-finds',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'extreme_weather_infrastructure_costs', 'critical_infrastructure_fragility'],
    notes: 'World Bank framework separating direct asset damage, service disruption, household and firm losses, hazard attribution, sector, resilience investment, and avoided cost.'
  },
  {
    audit_index: 406,
    name: 'IDMC Displacement Database Methodology',
    url: 'https://www.internal-displacement.org/database/methodology/',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'climate_refugee_camp_densities', 'migration'],
    notes: 'Event-level methodology distinguishing new displacement, stock, disaster and conflict triggers, sources, uncertainty, geography, and the difference between displacement counts and settlement occupancy.'
  },
  {
    audit_index: 407,
    name: 'EPA Smart Growth',
    url: 'https://www.epa.gov/smartgrowth/smart-growth-and-transportation',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'urban_parking_lot_sprawls', 'urbanization'],
    notes: 'Authoritative land-use and transportation framing for bounded urban form, travel, impervious cover, and access measurements; parking footprint alone does not establish sprawl or transport emissions.'
  },
  {
    audit_index: 408,
    name: 'ACLED Codebook',
    url: 'https://acleddata.com/methodology/acled-codebook',
    access_classification: 'open_portal',
    fit: ['metric_design', 'research_track_metric', 'fossil_fuel_pipeline_protests'],
    notes: 'Event-level political violence and protest coding with explicit dates, locations, actors, event types, sources, coverage, and uncertainty; a coded protest does not establish environmental causation or public consensus.'
  },
  {
    audit_index: 409,
    name: 'USDA APHIS Biotechnology Gene Flow',
    url: 'https://www.aphis.usda.gov/biotechnology/regulations/340_proposedrule_draftEIS_2019',
    access_classification: 'open_download',
    fit: ['metric_design', 'research_track_metric', 'genetically_modified_pollen_drift'],
    notes: 'Authoritative assessment distinguishing gene flow through pollen, seed, and vegetative propagules and the biological and management conditions required for reproduction, persistence, and exposure.'
  },
  {
    audit_index: 410,
    name: 'US Forest Service Fungal Decomposition and Nutrient Cycling',
    url: 'https://research.fs.usda.gov/treesearch/47341',
    access_classification: 'open_download',
    fit: ['metric_design', 'metric_alias', 'macrofungal_mycelium_decay', 'soil_microbial_depletion'],
    notes: 'Forest Service synthesis of soil fungi, decomposition, nutrient recycling, soil fertility, land conversion, and restoration; it supports bounded fungal-function measurements rather than the generated decay label.'
  },
  {
    audit_index: 411,
    name: 'NOAA Caulerpa Species on the West Coast',
    url: 'https://www.fisheries.noaa.gov/west-coast/habitat-conservation/caulerpa-species-west-coast',
    access_classification: 'open_portal',
    fit: ['metric_design', 'metric_alias', 'invasive_seaweed_blooms', 'invasive_species_encroachment'],
    notes: 'NOAA taxon-specific evidence for verified Caulerpa occurrence, rapid fragment-mediated spread, dense mat formation, habitat displacement, eradication status, and the distinction between an invasive record and native seasonal growth.'
  },
  {
    audit_index: 412,
    name: 'NOAA Aquatic Food Webs',
    url: 'https://www.noaa.gov/education/resource-collections/marine-life/aquatic-food-webs',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'trophic_cascade_collapses'],
    notes: 'NOAA definition of direct and indirect food-web effects and the multi-level observations required to identify a trophic cascade.'
  },
  {
    audit_index: 413,
    name: 'USGS Deep Sea Nodule Mining Midwater Plumes',
    url: 'https://www.usgs.gov/publications/extent-impact-deep-sea-nodule-mining-midwater-plumes-influenced-sediment-loading',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'deep_sea_mining_dust'],
    notes: 'Primary field and modeling evidence for sediment loading, turbulence, concentration thresholds, plume tracking, and commercial-scale scenario uncertainty.'
  },
  {
    audit_index: 414,
    name: 'USGS Red Cockaded Woodpecker Genetic Bottleneck',
    url: 'https://www.usgs.gov/news/effects-red-cockaded-woodpecker-bottleneck-and-current-management-genetic-diversity',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'genetic_diversity_bottlenecks'],
    notes: 'Temporal population-genetic evidence separating census decline, bottleneck history, diversity, structure, isolation, translocation, and management response.'
  },
  {
    audit_index: 415,
    name: 'NOAA NCCOS Jellyfish Bloom Research',
    url: 'https://coastalscience.noaa.gov/news/why-do-some-jellyfish-bloom-a-new-theory-emerges/',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'jellyfish_swarm_surges'],
    notes: 'NOAA-supported observational and experimental evidence for polyp settlement, artificial coastal structures, local bloom production, water quality, and operational impacts.'
  },
  {
    audit_index: 416,
    name: 'US Forest Service Savanna Fire and Woody Cover',
    url: 'https://research.fs.usda.gov/download/treesearch/26193.pdf',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'savannah_tree_cover_decline'],
    notes: 'Field research on fire frequency and woody canopy cover, paired with explicit limits on transferring a site relationship across savanna states and management histories.'
  },
  {
    audit_index: 417,
    name: 'EPA Toxics in the Food Web',
    url: 'https://www.epa.gov/salish-sea/toxics-food-web',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'heavy_metal_bioaccumulation'],
    notes: 'EPA definitions and bounded evidence requirements for uptake, persistence, tissue concentration, biomagnification, metal sources, toxicity, and population effects.'
  },
  {
    audit_index: 418,
    name: 'USGS Riparian Ecology',
    url: 'https://www.usgs.gov/centers/fort-collins-science-center/science/riparian-ecology',
    access_classification: 'open_portal',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'riparian_zone_erosion'],
    notes: 'USGS reach-scale research on flow, channel change, vegetation, dams, invasive-species management, erosion, restoration, and high-flow response.'
  },
  {
    audit_index: 419,
    name: 'US Forest Service Tree Mortality Drought Insects',
    url: 'https://research.fs.usda.gov/treesearch/49632',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'overstory_tree_mortality'],
    notes: 'Peer-reviewed framework separating drought, heat, bark beetles, defoliators, host selection, interactions, attribution, and ecosystem consequences.'
  },
  {
    audit_index: 420,
    name: 'USGS Native Freshwater Mussel Science Vision',
    url: 'https://pubs.usgs.gov/publication/cir1511/full',
    access_classification: 'open_download',
    fit: ['metric_design', 'node_evidence', 'relationship_evidence', 'freshwater_mussel_depletion'],
    notes: 'USGS synthesis of mussel abundance, recruitment, host fish, habitat fragmentation, altered flow, contaminants, disease, non-native species, climate, unexplained mortality, and ecosystem function.'
  },
  {
    audit_index: 421,
    name: 'World Bank Commodity Price Data The Pink Sheet',
    url: 'https://thedocs.worldbank.org/en/doc/18675f1d1639c7a34d463f59263ba0a2-0050012025/worldbank-commodities-price-data-the-pink-sheet',
    access_classification: 'open_download',
    fit: ['metric_design', 'fertilizer_price_shock', 'world_bank_fertilizer_price_index_change'],
    notes: 'Official monthly global commodity index workbook with a fertilizer group, nominal US-dollar basis, 2010 index base, component definitions, revisions and source notes.'
  },
  {
    audit_index: 422,
    name: 'PNAS Anthropogenic Climate Change and North American Pollen Seasons',
    url: 'https://doi.org/10.1073/pnas.2013284118',
    access_classification: 'open_download',
    fit: ['relationship_evidence', 'global_temperature', 'pollen_allergen_spikes', 'effect_estimate'],
    notes: 'Peer-reviewed 60-station, 821-station-year observational and Earth-system-model attribution study. The 19-35 percent interquartile range applies to the anthropogenic temperature-signal contribution to the 1990-2018 pollen-season-length trend, not pollen concentration or a universal days-per-degree response.'
  },
  {
    audit_index: 423,
    name: 'PNAS Air Quality Related Health Damages of Food',
    url: 'https://doi.org/10.1073/pnas.2013637118',
    access_classification: 'open_download',
    fit: ['relationship_evidence', 'industry_farming', 'air_pollution_health_burden', 'effect_estimate'],
    notes: 'Peer-reviewed United States source-resolved agricultural emissions, atmospheric modeling, and health-impact assessment reporting 17,900 annual PM2.5-attributable deaths with a 15,600-20,300 range across models under the declared 2014 inventory boundary.'
  }
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseFit(raw) {
  return [...raw.matchAll(/`([^`]+)`/g)].map(match => match[1]);
}

function parseTrailingParts(raw) {
  const flags = [];
  const notes = [];

  for (const part of raw.split(' — ').map(item => item.trim()).filter(Boolean)) {
    const flagged = part.match(/^`([^`]+)`(?:\s+(.*))?$/);
    if (flagged) {
      flags.push(flagged[1]);
      if (flagged[2]) {
        notes.push(flagged[2].trim());
      }
      continue;
    }
    notes.push(part);
  }

  const normalizedNotes = notes.reduce((acc, note) => {
    if (!acc) return note;
    return /[.?!:]$/.test(acc) ? `${acc} ${note}` : `${acc}. ${note}`;
  }, '');

  return {
    flags,
    notes: normalizedNotes.trim()
  };
}

async function readPublicJsonMeta(filename) {
  try {
    const filePath = path.join(publicDir, filename);
    const parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
    return {
      updated_at: parsed.updated_at || null,
      generated_at: parsed.generated_at || null,
      captured_at: parsed.captured_at || null,
      version: parsed.version || null,
      metric_contract_ids: parsed.metric_contract_ids || null,
      record_count: Number.isFinite(parsed.record_count) ? parsed.record_count : null
    };
  } catch {
    return null;
  }
}

const integrationMetaEntries = await Promise.all(
  Object.entries(ACTIVE_PLATFORM_INTEGRATIONS).map(async ([sourceId, config]) => {
    const meta = await readPublicJsonMeta(config.public_file);
    return [sourceId, meta ? { ...config, ...meta } : null];
  })
);
const integrationMeta = Object.fromEntries(integrationMetaEntries.filter(([, meta]) => meta));

const supplementalPlatformSurfaces = (
  await Promise.all(
    SUPPLEMENTAL_PLATFORM_SURFACES.map(async surface => {
      const meta = await readPublicJsonMeta(surface.public_file);
      return meta ? { ...surface, ...meta } : null;
    })
  )
).filter(Boolean);

const input = await fs.readFile(auditPath, 'utf8');
const lines = input.split('\n');
const entries = [];

for (const line of lines) {
  const match = line.match(/^(\d+)\.\s+(.*?)\s+—\s+(https?:\/\/\S+)\s+—\s+`([^`]+)`\s+—\s+fit:\s+(.+?)\s+—\s+(.+)$/);
  if (!match) continue;

  const [, indexRaw, name, url, classification, fitRaw, trailingRaw] = match;
  const fit = parseFit(fitRaw);
  const trailing = parseTrailingParts(trailingRaw);
  const integrationBucket = CLASS_TO_BUCKET[classification] || 'unclassified';
  const ingestionMode = CLASS_TO_INGESTION_MODE[classification] || 'unknown';
  const refreshStyle = CLASS_TO_REFRESH_STYLE[classification] || 'manual_review';
  const operationalOpen = integrationBucket === 'operational_open';

  const sourceId = slugify(name);
  const platformIntegration = sourceId === 'global_mangrove_watch' && !operationalOpen
    ? null
    : integrationMeta[sourceId] || null;

  entries.push({
    id: sourceId,
    audit_index: Number(indexRaw),
    name,
    url,
    access_classification: classification,
    integration_bucket: integrationBucket,
    operational_open: operationalOpen,
    ingestion_mode: ingestionMode,
    refresh_style: refreshStyle,
    fit,
    flags: trailing.flags,
    verified_now: trailing.flags.includes('verified_now'),
    repo_known: trailing.flags.includes('repo_known'),
    needs_login: classification === 'mixed_or_gated',
    can_be_treated_as_live_feed: false,
    platform_use: operationalOpen
      ? 'Eligible for scheduled snapshot integration.'
      : integrationBucket === 'evidence_only'
        ? 'Use for anchor notes, reasoning, and curated edge evidence only.'
        : integrationBucket === 'manual_auth_needed'
          ? 'Useful, but requires explicit auth or workflow validation before integration.'
          : 'Useful as a discovery or QA surface before a formal ingestion path exists.',
    notes: trailing.notes,
    platform_integration: platformIntegration
      ? {
          active: true,
          route: platformIntegration.route,
          public_file: platformIntegration.public_file,
          artifact_kind: platformIntegration.artifact_kind,
          updated_at: platformIntegration.updated_at,
          generated_at: platformIntegration.generated_at,
          captured_at: platformIntegration.captured_at,
          artifact_version: platformIntegration.version,
          served_metric_ids: platformIntegration.served_metric_ids || platformIntegration.metric_contract_ids || null,
          measurement_ready_metric_ids: platformIntegration.measurement_ready_metric_ids || null,
          record_count: platformIntegration.record_count
        }
      : null
  });
}

for (const source of NORTHSTAR_PILOT_SOURCES) {
  const id = source.id || slugify(source.name);
  const platformIntegration = integrationMeta[id] || null;
  const classification = source.access_classification || 'open_api';
  const integrationBucket = CLASS_TO_BUCKET[classification] || 'unclassified';
  const operationalOpen = integrationBucket === 'operational_open';
  entries.push({
    id,
    audit_index: source.audit_index,
    name: source.name,
    url: source.url,
    access_classification: classification,
    integration_bucket: integrationBucket,
    operational_open: operationalOpen,
    ingestion_mode: CLASS_TO_INGESTION_MODE[classification] || 'unknown',
    refresh_style: CLASS_TO_REFRESH_STYLE[classification] || 'manual_review',
    fit: source.fit,
    flags: ['verified_now', 'northstar_contract_bound'],
    verified_now: true,
    repo_known: true,
    needs_login: classification === 'mixed_or_gated',
    can_be_treated_as_live_feed: false,
    platform_use: platformIntegration
      ? 'Active scheduled snapshot integration bound to explicit node metric contracts.'
      : operationalOpen
        ? 'Eligible for a contract-bound ingestion job; not yet connected to graph scoring.'
        : 'Registered for metric design and evidence review; authentication must be resolved before ingestion.',
    notes: source.notes,
    platform_integration: platformIntegration
      ? {
          active: true,
          route: platformIntegration.route,
          public_file: platformIntegration.public_file,
          artifact_kind: platformIntegration.artifact_kind,
          updated_at: platformIntegration.updated_at,
          generated_at: platformIntegration.generated_at,
          captured_at: platformIntegration.captured_at,
          artifact_version: platformIntegration.version,
          served_metric_ids: platformIntegration.served_metric_ids || platformIntegration.metric_contract_ids || null,
          measurement_ready_metric_ids: platformIntegration.measurement_ready_metric_ids || null,
          record_count: platformIntegration.record_count
        }
      : null
  });
}

entries.sort((a, b) => a.audit_index - b.audit_index);

const registry = {
  version: '2026-07-14',
  generated_at: new Date().toISOString(),
  generated_from: 'tulip-source-intake-audit-2026-07-14.md',
  intake_policy: {
    definitions: {
      operational_open: 'Open API or download source that can be integrated through scheduled server-side snapshots without private credentials.',
      catalog_or_portal: 'Open browseable source that is valuable for discovery or QA but not yet a clean ingestion endpoint.',
      manual_auth_needed: 'Source with meaningful access friction, account requirements, or token-gated workflows.',
      evidence_only: 'Report-heavy or reference-heavy source used to support anchor notes and curated edge evidence, not live feeds.'
    },
    live_feed_policy: 'Even operational_open sources should be represented as scheduled snapshots or catalogs unless an explicit live-monitoring path is implemented.'
  },
  summary: {
    total_sources: entries.length,
    operational_open: entries.filter(entry => entry.integration_bucket === 'operational_open').length,
    catalog_or_portal: entries.filter(entry => entry.integration_bucket === 'catalog_or_portal').length,
    manual_auth_needed: entries.filter(entry => entry.integration_bucket === 'manual_auth_needed').length,
    evidence_only: entries.filter(entry => entry.integration_bucket === 'evidence_only').length,
    active_platform_integrations: entries.filter(entry => entry.platform_integration?.active).length,
    supplemental_platform_surfaces: supplementalPlatformSurfaces.length
  },
  platform_pull_inventory: entries
    .filter(entry => entry.platform_integration?.active)
    .map(entry => ({
      source_id: entry.id,
      name: entry.name,
      route: entry.platform_integration.route,
      public_file: entry.platform_integration.public_file,
      artifact_kind: entry.platform_integration.artifact_kind,
      updated_at: entry.platform_integration.updated_at,
      generated_at: entry.platform_integration.generated_at,
      captured_at: entry.platform_integration.captured_at
    })),
  supplemental_platform_surfaces: supplementalPlatformSurfaces,
  sources: entries
};

const operationalRegistry = {
  version: registry.version,
  generated_at: registry.generated_at,
  generated_from: registry.generated_from,
  notes: 'Operational-open sources are the first integration tier. They remain snapshot candidates, not implied live feeds.',
  sources: entries.filter(entry => entry.operational_open)
};

await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
await fs.writeFile(operationalPath, `${JSON.stringify(operationalRegistry, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  registry: path.relative(ROOT, registryPath),
  operational_registry: path.relative(ROOT, operationalPath),
  total_sources: registry.summary.total_sources,
  operational_open: registry.summary.operational_open
}, null, 2));
