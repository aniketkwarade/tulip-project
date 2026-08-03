# TULIP Evidence Hunt — Full 343-Node Promotion Target

Generated 2026-08-01T16:36:20.305Z. The baseline contains 343 modeled nodes; the hard target is at least 343 promotions to current data or accumulated impact.

## Baseline and target

| Measure | Count |
|---|---:|
| Modeled baseline | 343 |
| Minimum promotions | 343 |
| Modeled with operational bindings | 149 |
| Modeled with an active platform source | 227 |
| Complete metric contracts | 343 |

## Promotion waves

| Wave | Nodes | Purpose |
|---|---:|---|
| complete_evidence_backed | 263 | complete evidence backed |
| wave_2_operational_impact | 1 | wave 2 operational impact |
| wave_3_existing_platform_source | 21 | wave 3 existing platform source |
| wave_4_source_repair | 14 | wave 4 source repair |
| wave_5_new_ingestion | 44 | wave 5 new ingestion |

## Largest source campaigns in the 343-node cohort

| Source | Target nodes | Promoted | Bound | Current candidates | Impact candidates | Source repair |
|---|---:|---:|---:|---:|---:|---:|
| edgar_global_emissions_database | 38 | 33 | 15 | 0 | 0 | 4 |
| usgs_water_data_ogc_api | 18 | 8 | 2 | 0 | 0 | 10 |
| wri_aqueduct | 10 | 9 | 3 | 0 | 0 | 0 |
| copernicus_climate_change_service | 9 | 5 | 2 | 0 | 0 | 0 |
| nasa_sea_level_change_portal | 9 | 6 | 1 | 0 | 0 | 0 |
| faostat | 8 | 8 | 6 | 0 | 0 | 0 |
| nasa_power_open_api | 7 | 7 | 7 | 0 | 0 | 0 |
| lancet_countdown_data_explorer | 6 | 6 | 6 | 0 | 0 | 0 |
| national_snow_and_ice_data_center | 6 | 2 | 0 | 0 | 0 | 0 |
| noaa_cpc_psl_climate_indices | 6 | 6 | 6 | 0 | 0 | 0 |
| copernicus_marine_service | 5 | 2 | 0 | 0 | 0 | 0 |
| unep_global_nutrient_pollution_impact | 5 | 5 | 5 | 0 | 0 | 0 |
| eia_hourly_electric_grid_monitor | 4 | 2 | 2 | 0 | 0 | 0 |
| gbif_occurrence_api | 4 | 3 | 2 | 0 | 0 | 0 |
| global_terrestrial_network_for_permafrost | 4 | 3 | 0 | 0 | 0 | 0 |
| iea_global_industry_transition_assessments | 4 | 4 | 4 | 0 | 0 | 0 |
| unctad_review_of_maritime_transport_2024 | 4 | 3 | 3 | 0 | 0 | 0 |
| unesco_fao_global_groundwater_irrigation_impact | 4 | 4 | 4 | 0 | 0 | 0 |
| global_forest_watch | 3 | 0 | 0 | 0 | 0 | 0 |
| ice_sheet_mass_balance_inter_comparison_exercise | 3 | 1 | 1 | 0 | 0 | 0 |
| iea_global_critical_minerals_outlook_2025 | 3 | 3 | 3 | 0 | 0 | 0 |
| noaa_climate_data_online | 3 | 2 | 1 | 0 | 0 | 0 |
| noaa_physical_sciences_laboratory_enso | 3 | 2 | 2 | 0 | 0 | 0 |
| obis_api_v3 | 3 | 3 | 3 | 0 | 0 | 0 |
| ocha_humanitarian_programme_cycle_public_api | 3 | 3 | 3 | 0 | 0 | 0 |
| unep_blue_ecosystems_global_assessments | 3 | 3 | 3 | 0 | 0 | 0 |
| unep_wcmc_global_ecological_connectivity_assessment | 3 | 3 | 3 | 0 | 0 | 0 |
| who_air_quality_database | 3 | 3 | 0 | 0 | 0 | 0 |
| who_unicef_jmp_2025 | 3 | 3 | 3 | 0 | 0 | 0 |
| copernicus_atmosphere_monitoring_service | 2 | 2 | 0 | 0 | 0 | 0 |

## Evidence-quality guardrails

- A source link, source count, metric contract, or operational binding is not a promotion by itself.
- Current-data promotion still requires magnitude plus threshold or momentum and at least 60% component weight.
- Historical-percentile normalization still requires 20 complete annual or 60 monthly observations.
- Accumulated-impact promotion still requires quantitative biophysical burden, human/economic burden, persistence, and extent.
- U.S.-only observations cannot silently become a global score.
- Source-family mismatches must be repaired before evidence is used.

## Reviewed source boundaries

- EDGAR: global emissions by gas, country, sector, and grid. It is valid for emissions metrics, not unrelated soil, ecological, spill, or infrastructure metrics.
- USGS Water Data OGC API: U.S. monitoring locations and water observations. It needs a global companion source for a global TULIP score.

The complete 206-node target cohort, evidence requirements, source campaigns, source-entitlement flags, pipeline bindings, and reserve list are in `public/tulip-evidence-hunt-registry.json`.
