import {
  CASCADE_ANCHOR_IDS,
  CASCADE_ANCHOR_METRIC_CONTRACTS,
  CASCADE_ANCHOR_RELATIONSHIPS,
  CASCADE_SUPPORT_NODE_OVERRIDES,
  CASCADE_UNSUPPORTED_EDGE_KEYS,
  hasCompletePromotedDossier
} from './cascade-anchor-contracts.js';
import {
  IMPLEMENTED_EXPANSION_METRIC_CONTRACTS,
  PHENOMENON_EXPANSION_DECISIONS
} from './phenomenon-expansion-decisions.js';
import {
  PROMOTED_EXPANSION_NODE_IDS,
  PROMOTED_EXPANSION_RELATIONSHIPS,
  hasCompleteExpansionDossier
} from './promoted-expansion-contracts.js';
import {
  PRIORITY_ANCHOR_IDS,
  PRIORITY_ANCHOR_METRIC_CONTRACTS,
  PRIORITY_ANCHOR_RELATIONSHIPS,
  hasCompletePriorityAnchorDossier
} from './priority-anchor-contracts.js';
import {
  RESEARCH_BATCH_METRIC_CONTRACTS,
  RESEARCH_BATCH_NODE_IDS,
  RESEARCH_BATCH_NODE_SOURCES,
  RESEARCH_BATCH_RELATIONSHIPS,
  RESEARCH_TRACK_REPLACED_EDGE_KEYS,
  RESEARCH_TRACK_UNSUPPORTED_EDGE_KEYS,
  hasCompleteResearchBatchDossier
} from './research-track-batch-contracts.js';
import {
  RESEARCH_BATCH_TWO_METRIC_CONTRACTS,
  RESEARCH_BATCH_TWO_NODE_IDS,
  RESEARCH_BATCH_TWO_NODE_SOURCES,
  RESEARCH_BATCH_TWO_RELATIONSHIPS,
  hasCompleteResearchBatchTwoDossier
} from './research-track-batch-two-contracts.js';
import {
  JET_REHABILITATION_METRIC_CONTRACT,
  JET_REHABILITATION_NODE_ID,
  JET_REHABILITATION_NODE_SOURCES,
  JET_REHABILITATION_RELATIONSHIPS,
  hasCompleteJetDossier
} from './research-track-jet-contracts.js';
import {
  RIVER_BARRIER_METRIC_CONTRACTS,
  RIVER_BARRIER_NODE_IDS,
  RIVER_BARRIER_NODE_SOURCES,
  RIVER_BARRIER_RELATIONSHIPS,
  hasCompleteRiverBarrierDossier
} from './river-barrier-expansion-contracts.js';
import { HUMANITARIAN_METRIC_CONTRACTS, HUMANITARIAN_RELATIONSHIPS, hasCompleteHumanitarianDossier } from './humanitarian-expansion-contracts.js';
import { GROUNDWATER_WITHDRAWAL_METRIC_CONTRACTS, GROUNDWATER_WITHDRAWAL_RELATIONSHIPS, hasCompleteGroundwaterWithdrawalDossier } from './groundwater-withdrawal-expansion-contracts.js';
import { OPERATIONAL_INDICATOR_METRIC_CONTRACTS, OPERATIONAL_INDICATOR_REHABILITATION_IDS, OPERATIONAL_INDICATOR_REHABILITATION_RELATIONSHIPS, hasCompleteOperationalIndicatorDossier } from './operational-indicator-rehabilitation-contracts.js';
import { NITROUS_OXIDE_DRIVER_NODE_IDS, NITROUS_OXIDE_METRIC_CONTRACTS, NITROUS_OXIDE_NODE_SOURCES, NITROUS_OXIDE_REHABILITATION_NODE_ID, NITROUS_OXIDE_REHABILITATION_RELATIONSHIPS, hasCompleteNitrousOxideDossier } from './nitrous-oxide-rehabilitation-contracts.js';
import { SULFUR_DIOXIDE_METRIC_CONTRACTS, SULFUR_DIOXIDE_NODE_SOURCES, SULFUR_DIOXIDE_REHABILITATION_NODE_ID, SULFUR_DIOXIDE_REHABILITATION_RELATIONSHIPS, hasCompleteSulfurDioxideDossier } from './sulfur-dioxide-rehabilitation-contracts.js';
import { COAL_POWER_METRIC_CONTRACTS, COAL_POWER_NODE_SOURCES, COAL_POWER_INDICATOR_ID, COAL_POWER_RELATIONSHIPS, hasCompleteCoalPowerDossier } from './coal-power-expansion-contracts.js';
import { ELECTRONICS_EOL_METRIC_CONTRACTS, ELECTRONICS_EOL_NODE_SOURCES, ELECTRONICS_EOL_INDICATOR_ID, ELECTRONICS_EOL_RELATIONSHIPS, hasCompleteElectronicsEolDossier } from './electronics-end-of-life-expansion-contracts.js';
import { CARBON_MONOXIDE_METRIC_CONTRACTS, CARBON_MONOXIDE_NODE_SOURCES, CARBON_MONOXIDE_INDICATOR_ID, CARBON_MONOXIDE_RELATIONSHIPS, hasCompleteCarbonMonoxideDossier } from './carbon-monoxide-rehabilitation-contracts.js';
import { LANDFILL_METHANE_METRIC_CONTRACTS, LANDFILL_METHANE_NODE_SOURCES, LANDFILL_METHANE_INDICATOR_ID, LANDFILL_METHANE_RELATIONSHIPS, hasCompleteLandfillMethaneDossier } from './landfill-methane-rehabilitation-contracts.js';
import { RICE_METHANE_METRIC_CONTRACTS, RICE_METHANE_NODE_SOURCES, RICE_METHANE_INDICATOR_ID, RICE_METHANE_RELATIONSHIPS, RICE_METHANE_REJECTED_EDGE_KEYS, hasCompleteRiceMethaneDossier } from './rice-methane-rehabilitation-contracts.js';
import { LOCOMOTIVE_EMISSIONS_METRIC_CONTRACTS, LOCOMOTIVE_EMISSIONS_NODE_SOURCES, LOCOMOTIVE_EMISSIONS_INDICATOR_ID, LOCOMOTIVE_EMISSIONS_RELATIONSHIPS, hasCompleteLocomotiveEmissionsDossier } from './locomotive-emissions-expansion-contracts.js';
import { CEMENT_CALCINATION_METRIC_CONTRACTS, CEMENT_CALCINATION_NODE_SOURCES, CEMENT_CALCINATION_INDICATOR_ID, CEMENT_CALCINATION_RELATIONSHIPS, hasCompleteCementCalcinationDossier } from './cement-calcination-rehabilitation-contracts.js';
import { REFRIGERANT_LEAKAGE_METRIC_CONTRACTS, REFRIGERANT_LEAKAGE_NODE_SOURCES, REFRIGERANT_LEAKAGE_INDICATOR_ID, REFRIGERANT_LEAKAGE_RELATIONSHIPS, hasCompleteRefrigerantLeakageDossier } from './refrigerant-leakage-rehabilitation-contracts.js';
import { TIRE_WEAR_METRIC_CONTRACTS, TIRE_WEAR_NODE_SOURCES, TIRE_WEAR_INDICATOR_ID, TIRE_WEAR_RELATIONSHIPS, hasCompleteTireWearDossier } from './tire-wear-rehabilitation-contracts.js';
import { COMBINED_SEWER_OVERFLOW_METRIC_CONTRACTS, COMBINED_SEWER_OVERFLOW_NODE_SOURCES, COMBINED_SEWER_OVERFLOW_NODE_ID, COMBINED_SEWER_OVERFLOW_RELATIONSHIPS, hasCompleteCombinedSewerOverflowDossier } from './combined-sewer-overflow-repair-contracts.js';
import { CORAL_BLEACHING_METRIC_CONTRACTS, CORAL_BLEACHING_NODE_SOURCES, CORAL_BLEACHING_NODE_ID, CORAL_BLEACHING_RELATIONSHIPS, hasCompleteCoralBleachingDossier } from './coral-bleaching-repair-contracts.js';
import { SEMICONDUCTOR_FGAS_METRIC_CONTRACTS, SEMICONDUCTOR_FGAS_NODE_SOURCES, SEMICONDUCTOR_FGAS_INDICATOR_ID, SEMICONDUCTOR_FGAS_RELATIONSHIPS, hasCompleteSemiconductorFgasDossier } from './semiconductor-fgas-rehabilitation-contracts.js';
import { BLAST_FURNACE_SLAG_METRIC_CONTRACTS, BLAST_FURNACE_SLAG_NODE_SOURCES, BLAST_FURNACE_SLAG_INDICATOR_ID, BLAST_FURNACE_SLAG_RELATIONSHIPS, hasCompleteBlastFurnaceSlagDossier } from './blast-furnace-slag-rehabilitation-contracts.js';
import { ALPINE_SNOWPACK_METRIC_CONTRACTS, ALPINE_SNOWPACK_NODE_SOURCES, ALPINE_SNOWPACK_NODE_ID, ALPINE_SNOWPACK_RELATIONSHIPS, hasCompleteAlpineSnowpackDossier } from './alpine-snowpack-repair-contracts.js';
import { MANURE_LAGOON_METRIC_CONTRACTS, MANURE_LAGOON_NODE_SOURCES, MANURE_LAGOON_INDICATOR_ID, MANURE_LAGOON_RELATIONSHIPS, hasCompleteManureLagoonDossier } from './manure-lagoon-rehabilitation-contracts.js';
import { LITHIUM_BRINE_METRIC_CONTRACTS, LITHIUM_BRINE_NODE_SOURCES, LITHIUM_BRINE_INDICATOR_ID, LITHIUM_BRINE_RELATIONSHIPS, hasCompleteLithiumBrineDossier } from './lithium-brine-rehabilitation-contracts.js';
import { CATTLE_COMPACTION_METRIC_CONTRACTS, CATTLE_COMPACTION_NODE_SOURCES, CATTLE_COMPACTION_NODE_ID, CATTLE_COMPACTION_RELATIONSHIPS, hasCompleteCattleCompactionDossier } from './cattle-compaction-repair-contracts.js';
import { WATERBORNE_OUTBREAK_METRIC_CONTRACTS, WATERBORNE_OUTBREAK_NODE_SOURCES, WATERBORNE_OUTBREAK_NODE_ID, WATERBORNE_OUTBREAK_RELATIONSHIPS, hasCompleteWaterborneOutbreakDossier } from './waterborne-outbreak-repair-contracts.js';
import { POLLINATOR_COLLAPSE_METRIC_CONTRACTS, POLLINATOR_COLLAPSE_NODE_SOURCES, POLLINATOR_COLLAPSE_NODE_ID, POLLINATOR_COLLAPSE_RELATIONSHIPS, hasCompletePollinatorCollapseDossier } from './pollinator-collapse-repair-contracts.js';
import { ACID_DEPOSITION_METRIC_CONTRACTS, ACID_DEPOSITION_NODE_SOURCES, ACID_DEPOSITION_NODE_ID, ACID_DEPOSITION_RELATIONSHIPS, hasCompleteAcidDepositionDossier } from './acid-deposition-repair-contracts.js';
import { FOREST_DIEBACK_METRIC_CONTRACTS, FOREST_DIEBACK_NODE_SOURCES, FOREST_DIEBACK_NODE_ID, FOREST_DIEBACK_RELATIONSHIPS, hasCompleteForestDiebackDossier } from './forest-dieback-repair-contracts.js';
import { SOIL_MICROBIAL_METRIC_CONTRACTS, SOIL_MICROBIAL_NODE_SOURCES, SOIL_MICROBIAL_NODE_ID, SOIL_MICROBIAL_RELATIONSHIPS, hasCompleteSoilMicrobialDossier } from './soil-microbial-repair-contracts.js';
import { URBAN_WATER_RATIONING_METRIC_CONTRACTS, URBAN_WATER_RATIONING_NODE_SOURCES, URBAN_WATER_RATIONING_NODE_ID, URBAN_WATER_RATIONING_RELATIONSHIPS, hasCompleteUrbanWaterRationingDossier } from './urban-water-rationing-repair-contracts.js';
import { DEEPWATER_SPILL_METRIC_CONTRACTS, DEEPWATER_SPILL_NODE_SOURCES, DEEPWATER_SPILL_NODE_ID, DEEPWATER_SPILL_RELATIONSHIPS, hasCompleteDeepwaterSpillDossier } from './deepwater-spill-repair-contracts.js';
import { WILDFIRE_SMOKE_HEALTH_METRIC_CONTRACTS, WILDFIRE_SMOKE_HEALTH_NODE_SOURCES, WILDFIRE_SMOKE_HEALTH_NODE_ID, WILDFIRE_SMOKE_HEALTH_RELATIONSHIPS, hasCompleteWildfireSmokeHealthDossier } from './wildfire-smoke-health-repair-contracts.js';
import { RESERVOIR_STORAGE_METRIC_CONTRACTS, RESERVOIR_STORAGE_NODE_SOURCES, RESERVOIR_STORAGE_NODE_ID, RESERVOIR_STORAGE_RELATIONSHIPS, hasCompleteReservoirStorageDossier } from './reservoir-storage-repair-contracts.js';
import { AIR_POLLUTION_HEALTH_METRIC_CONTRACTS, AIR_POLLUTION_HEALTH_NODE_SOURCES, AIR_POLLUTION_HEALTH_NODE_ID, AIR_POLLUTION_HEALTH_RELATIONSHIPS, hasCompleteAirPollutionHealthDossier } from './air-pollution-health-repair-contracts.js';
import { RAIN_ON_SNOW_METRIC_CONTRACTS, RAIN_ON_SNOW_NODE_SOURCES, RAIN_ON_SNOW_NODE_ID, RAIN_ON_SNOW_RELATIONSHIPS, hasCompleteRainOnSnowDossier } from './rain-on-snow-repair-contracts.js';
import { SURFACE_STORAGE_METRIC_CONTRACTS, SURFACE_STORAGE_NODE_ID, SURFACE_STORAGE_RELATIONSHIPS, hasCompleteSurfaceStorageDossier } from './surface-water-storage-repair-contracts.js';
import { TALIK_EXPANSION_METRIC_CONTRACTS, TALIK_EXPANSION_NODE_ID, TALIK_EXPANSION_RELATIONSHIPS, hasCompleteTalikExpansionDossier } from './talik-expansion-repair-contracts.js';
import { COASTAL_PERMAFROST_METRIC_CONTRACTS, COASTAL_PERMAFROST_NODE_SOURCES, COASTAL_PERMAFROST_NODE_ID, COASTAL_PERMAFROST_RELATIONSHIPS, hasCompleteCoastalPermafrostDossier } from './coastal-permafrost-repair-contracts.js';
import { FRACKING_WASTEWATER_METRIC_CONTRACTS, FRACKING_WASTEWATER_NODE_SOURCES, FRACKING_WASTEWATER_NODE_ID, FRACKING_WASTEWATER_RELATIONSHIPS, hasCompleteFrackingWastewaterDossier } from './fracking-wastewater-repair-contracts.js';
import { COASTAL_HYPOXIA_METRIC_CONTRACTS, COASTAL_HYPOXIA_NODE_SOURCES, COASTAL_HYPOXIA_NODE_ID, COASTAL_HYPOXIA_RELATIONSHIPS, hasCompleteCoastalHypoxiaDossier } from './coastal-hypoxia-repair-contracts.js';
import { TUNDRA_SHRUBIFICATION_METRIC_CONTRACTS, TUNDRA_SHRUBIFICATION_NODE_SOURCES, TUNDRA_SHRUBIFICATION_NODE_ID, TUNDRA_SHRUBIFICATION_RELATIONSHIPS, hasCompleteTundraShrubificationDossier } from './tundra-shrubification-repair-contracts.js';
import { FREEZE_THAW_ROCK_METRIC_CONTRACTS, FREEZE_THAW_ROCK_NODE_ID, FREEZE_THAW_ROCK_NODE_SOURCES, FREEZE_THAW_ROCK_RELATIONSHIPS, hasCompleteFreezeThawRockDossier } from './freeze-thaw-rock-repair-contracts.js';
import { FJORD_SEDIMENTATION_METRIC_CONTRACTS, FJORD_SEDIMENTATION_NODE_ID, FJORD_SEDIMENTATION_NODE_SOURCES, FJORD_SEDIMENTATION_RELATIONSHIPS, hasCompleteFjordSedimentationDossier } from './fjord-sedimentation-repair-contracts.js';
import { INLAND_WATERWAY_SPILL_METRIC_CONTRACTS, INLAND_WATERWAY_SPILL_NODE_ID, INLAND_WATERWAY_SPILL_NODE_SOURCES, INLAND_WATERWAY_SPILL_RELATIONSHIPS, hasCompleteInlandWaterwaySpillDossier } from './inland-waterway-spill-repair-contracts.js';
import { COASTAL_SALTWATER_INTRUSION_METRIC_CONTRACTS, COASTAL_SALTWATER_INTRUSION_RELATIONSHIPS } from './coastal-saltwater-intrusion-repair-contracts.js';
import { ARCTIC_ICE_RETREAT_METRIC_CONTRACTS, ARCTIC_ICE_RETREAT_RELATIONSHIPS } from './arctic-ice-retreat-repair-contracts.js';
import { FINAL_DENSITY_BATCH_METRIC_CONTRACTS, FINAL_DENSITY_BATCH_RELATIONSHIPS } from './final-density-batch-contracts.js';
import { EXTENSION_DENSITY_BATCH_METRIC_CONTRACTS, EXTENSION_DENSITY_BATCH_RELATIONSHIPS } from './extension-density-batch-contracts.js';
import { CARBON_EMISSION_EXPANSION_METRIC_CONTRACTS, CARBON_EMISSION_EXPANSION_RELATIONSHIPS } from './carbon-emission-expansion-contracts.js';
import { ANCHOR_STRUCTURAL_EXPANSION_RELATIONSHIPS } from './anchor-structural-expansion-contracts.js';
import { CROSS_SYSTEM_BACKLOG_RELATIONSHIPS } from './cross-system-backlog-contracts.js';
import { CROSS_SYSTEM_BACKLOG_BATCH_TWO_RELATIONSHIPS } from './cross-system-backlog-batch-two-contracts.js';
import { CROSS_SYSTEM_BACKLOG_BATCH_THREE_RELATIONSHIPS } from './cross-system-backlog-batch-three-contracts.js';
import { CROSS_SYSTEM_BACKLOG_BATCH_FOUR_RELATIONSHIPS } from './cross-system-backlog-batch-four-contracts.js';
import { LEGACY_SOURCE_REPAIR_RELATIONSHIPS } from './legacy-source-repairs.js';
import { RELATIONSHIP_DIRECTION_REPAIR_RELATIONSHIPS } from './relationship-direction-repair-contracts.js';
import { SEMANTIC_DRIVER_GATE_REPAIR_RELATIONSHIPS, SEMANTIC_DRIVER_GATE_REJECTED_EDGE_KEYS } from './semantic-driver-gate-repair-contracts.js';
import { SUBSEA_CABLE_METRIC_CONTRACTS, SUBSEA_CABLE_RELATIONSHIPS } from './subsea-cable-rehabilitation-contracts.js';
import { PALM_OIL_CLEARANCE_METRIC_CONTRACTS, PALM_OIL_CLEARANCE_NODE_ID, PALM_OIL_CLEARANCE_NODE_SOURCES, PALM_OIL_CLEARANCE_RELATIONSHIPS, hasCompletePalmOilClearanceDossier } from './palm-oil-clearance-rehabilitation-contracts.js';
import { ONTOLOGY_METRIC_CONTRACTS } from './ontology-metric-bindings.js';
import { ONTOLOGY_PROMOTION_METRIC_CONTRACTS, ONTOLOGY_PROMOTION_NODE_IDS, ONTOLOGY_PROMOTION_NODE_SOURCES, ONTOLOGY_PROMOTION_RELATIONSHIPS, hasCompleteOntologyPromotionDossier } from './ontology-promotion-batch-contracts.js';
import { ONTOLOGY_PROMOTION_BATCH_TWO_METRIC_CONTRACTS, ONTOLOGY_PROMOTION_BATCH_TWO_NODE_IDS, ONTOLOGY_PROMOTION_BATCH_TWO_NODE_SOURCES, ONTOLOGY_PROMOTION_BATCH_TWO_RELATIONSHIPS, ONTOLOGY_PROMOTION_BATCH_TWO_REJECTED_EDGE_KEYS, hasCompleteOntologyPromotionBatchTwoDossier } from './ontology-promotion-batch-two-contracts.js';
import { DEGREE_TWO_OPERATIONAL_INDICATOR_IDS, DEGREE_TWO_PROMOTION_METRIC_CONTRACTS, DEGREE_TWO_PROMOTION_NODE_IDS, DEGREE_TWO_PROMOTION_NODE_SOURCES, DEGREE_TWO_PROMOTION_RELATIONSHIPS, DEGREE_TWO_PROMOTION_REJECTED_EDGE_KEYS, hasCompleteDegreeTwoPromotionDossier } from './degree-two-promotion-contracts.js';
import { INVASIVE_SPECIES_NODE_ID, INVASIVE_SPECIES_NODE_SOURCES, INVASIVE_SPECIES_RELATIONSHIPS, hasCompleteInvasiveSpeciesDossier } from './invasive-species-repair-contracts.js';
import { OPEN_BACKLOG_WAVE_ONE_METRIC_CONTRACTS, OPEN_BACKLOG_WAVE_ONE_NAME_OVERRIDES, OPEN_BACKLOG_WAVE_ONE_NODE_IDS, OPEN_BACKLOG_WAVE_ONE_NODE_SOURCES, OPEN_BACKLOG_WAVE_ONE_OPERATIONAL_INDICATOR_IDS, OPEN_BACKLOG_WAVE_ONE_REJECTED_EDGE_KEYS, OPEN_BACKLOG_WAVE_ONE_ROOT_DRIVER_IDS, OPEN_BACKLOG_WAVE_ONE_RELATIONSHIPS, hasCompleteOpenBacklogWaveOneDossier } from './open-backlog-wave-one-contracts.js';
import { FULL_BACKLOG_METRIC_CONTRACTS, FULL_BACKLOG_NAME_OVERRIDES, FULL_BACKLOG_NODE_SOURCES, FULL_BACKLOG_OPERATIONAL_INDICATOR_IDS, FULL_BACKLOG_PROMOTION_NODE_IDS, FULL_BACKLOG_RELATIONSHIPS, hasCompleteFullBacklogDossier } from './full-backlog-promotion-contracts.js';
import { GREENHOUSE_FORCING_METRIC_CONTRACTS, GREENHOUSE_FORCING_NODE_ID, GREENHOUSE_FORCING_NODE_SOURCES, GREENHOUSE_FORCING_RELATIONSHIPS } from './greenhouse-forcing-repair-contracts.js';
import { BARK_BEETLE_RELATIONSHIPS } from './bark-beetle-repair-contracts.js';
import { ZOONOTIC_OUTBREAK_RELATIONSHIPS } from './zoonotic-outbreak-repair-contracts.js';
import { classifyLowDegreeGovernance } from './low-degree-governance.js';
import { HIGH_IMPACT_HUB_METRIC_CONTRACTS } from './high-impact-hub-metric-contracts.js';
import { REMAINING_LIVE_NODE_METRIC_CONTRACTS } from './remaining-live-node-metric-contracts.js';

export const NODE_CLASSES = Object.freeze({
  PHENOMENON: 'phenomenon',
  OPERATIONAL_INDICATOR: 'operational_indicator',
  RESPONSE: 'response',
  AUTHORED_ROOT_DRIVER: 'authored_root_driver'
});

export const AUTHORED_ROOT_DRIVER_IDS = new Set([
  'mining_critical_minerals',
  'plastics_petrochemicals',
  'steel',
  'cement_concrete',
  'aviation',
  'aviation_demand_growth',
  'shipping',
  'road_freight_diesel_lock_in',
  'fast_fashion',
  'urbanization',
  'industrial_heat_decarbonization_gap',
  'gas_power_dependence',
  'transmission_buildout_lag',
  'semiconductor_fabs',
  'telecom_backbone',
  'subsea_cables',
  'mobile_wireless_networks',
  'internet_exchange_points',
  'ai_data_centers',
  'data_centers',
  // Primary human activities or land-use practices can legitimately begin a
  // causal trail. Requiring three upstream causes here would manufacture
  // parents for an activity that the graph is intended to treat as an input.
  'personal_conveyance',
  'urban_sprawl_housing',
  'fracking_wastewater_lakes',
  'wetlands_drainage_scales',
  'deepwater_petroleum_spill_risk',
  ...OPEN_BACKLOG_WAVE_ONE_ROOT_DRIVER_IDS
]);

// Institutional actions and market responses are governed by response
// contracts, not by the phenomenon three-driver gate.
const SEMANTIC_RESPONSE_IDS = new Set([
  'coastal_property_insurance_redlines'
]);

const CLIMATE_MODE_OPERATIONAL_INDICATOR_IDS = Object.freeze([
  'atlantic_multidecadal_oscillation',
  'pacific_decadal_oscillation',
  'indian_ocean_dipole',
  'arctic_oscillation',
  'north_atlantic_oscillation',
  'pacific_north_american_pattern',
  'quasi_biennial_oscillation',
  'southern_annular_mode',
  'madden_julian_oscillation',
  'rossby_wave_stalling',
  'humidity_amplification'
  ,'atlantic_ni_o_ni_a'
  ,'fertilizer_production'
  ,'snow_drought'
  ,'irrigation_water_inefficiency'
  ,'semiconductor_fabrication_footprint'
  ,'port_heat_vulnerability'
  ,'rail_heat_buckling'
  ,'ice_algae_pigmentation'
]);

export const OPERATIONAL_INDICATOR_IDS = new Set([
  ...OPERATIONAL_INDICATOR_REHABILITATION_IDS,
  ...DEGREE_TWO_OPERATIONAL_INDICATOR_IDS,
  ...OPEN_BACKLOG_WAVE_ONE_OPERATIONAL_INDICATOR_IDS,
  ...FULL_BACKLOG_OPERATIONAL_INDICATOR_IDS,
  ...CLIMATE_MODE_OPERATIONAL_INDICATOR_IDS,
  COAL_POWER_INDICATOR_ID,
  ELECTRONICS_EOL_INDICATOR_ID,
  CARBON_MONOXIDE_INDICATOR_ID,
  LANDFILL_METHANE_INDICATOR_ID,
  RICE_METHANE_INDICATOR_ID,
  LOCOMOTIVE_EMISSIONS_INDICATOR_ID,
  CEMENT_CALCINATION_INDICATOR_ID,
  REFRIGERANT_LEAKAGE_INDICATOR_ID,
  TIRE_WEAR_INDICATOR_ID,
  SEMICONDUCTOR_FGAS_INDICATOR_ID,
  BLAST_FURNACE_SLAG_INDICATOR_ID,
  MANURE_LAGOON_INDICATOR_ID,
  LITHIUM_BRINE_INDICATOR_ID,
  GREENHOUSE_FORCING_NODE_ID,
  'arctic_shipping_expansion',
  // Observed concentrations, inventories, state indices, and event counts are
  // measurements of a system. They need a valid upstream condition where
  // appropriate, but not three invented causal parents.
  'wastewater_bypass_discharge',
  'soot_deposition_on_snow',
  'nitrogen_fertilizer_runoff',
  'cattle_grazing_overcompaction',
  'wildlife_habitat_patches',
  'pm2_5_particulates',
  'ocean_heat_content',
  'wetlands_drainage_scales',
  'acid_rain_deposition',
  'particulate_soot_levels',
  'trade_wind_weakening',
  'thermal_stratification_intensification',
  'pyrocumulonimbus_smoke_injection',
  'tidal_wetland_carbon_reversal',
  'talik_expansion',
  'asphalt_pavement_heat_absorbers',
  'stratospheric_cooling'
  ,'reservoir_storage_instability'
]);

// These indices are descriptive states of coupled circulation rather than
// causal phenomena that need an invented upstream parent. They remain fully
// measurable and must retain at least three incident graph relationships, but
// their incoming-driver gate is semantically exempt.
const EXOGENOUS_CLIMATE_MODE_INDICATOR_IDS = new Set([
  'arctic_oscillation',
  'atlantic_multidecadal_oscillation',
  'atlantic_ni_o_ni_a',
  'indian_ocean_dipole',
  'madden_julian_oscillation',
  'north_atlantic_oscillation',
  'pacific_decadal_oscillation',
  'pacific_north_american_pattern',
  'quasi_biennial_oscillation',
  'rossby_wave_stalling',
  'southern_annular_mode'
  ,'trade_wind_weakening'
]);

// Legacy generated arrows rejected on causal-direction review. They are removed
// rather than cosmetically sourced; each would require a different, bounded claim.
export const REJECTED_LEGACY_EDGE_KEYS = new Set([
  ...SEMANTIC_DRIVER_GATE_REJECTED_EDGE_KEYS,
  'carbon_emission->coal_fired_power_outflow',
  'biodiversity_intactness_loss->genetic_diversity_bottlenecks',
  'biodiversity_intactness_loss->riparian_zone_erosion',
  'biodiversity_intactness_loss->savannah_tree_cover_decline',
  'biodiversity_intactness_loss->trophic_cascade_collapses',
  'ocean_acidification->deep_sea_mining_dust',
  'ocean_acidification->heavy_metal_bioaccumulation',
  'ocean_acidification->jellyfish_swarm_surges',
  'resource_depletion->freshwater_mussel_depletion',
  'wet_bulb_heat->overstory_tree_mortality',
  'methane->nitrous_oxide',
  'ocean_acidification->sea_level_rise',
  'marine_fisheries_collapse->marine_heatwaves',
  'marine_fisheries_collapse->phytoplankton_decline',
  'biodiversity_intactness_loss->wildfire_scorched_earth'
  // Evidence-rehabilitation removals: the source mechanism does not map to
  // the target metric, or the authored direction contradicts the mechanism.
  ,'wet_bulb_heat->resource_depletion'
  ,'la_nina->resource_depletion'
  ,'monsoon_volatility->resource_depletion'
  ,'permafrost_thaw->resource_depletion'
  ,'relocation_governance_capacity->managed_retreat_pressure'
  ,'cooling_water_competition->resource_depletion'
  ,'ice_sheet_mass_loss->firn_layer_depletion'
  ,'coastal_inundation_risk->littoral_surge_vulnerability'
  ,'biodiversity_intactness_loss->species_range_compression'
  ,'migration->managed_retreat_pressure'
  ,'biodiversity_intactness_loss->freshwater_ecosystem_collapse'
  ,'pollinator_service_decline->insect_biomass_decline'
  ,'pollinator_service_decline->pollinator_colony_collapse'
  ,'biodiversity_intactness_loss->wildlife_habitat_patches'
  ,'reef_structural_collapse->coral_bleaching'
  ,'aerosol_cooling_loss->pm2_5_particulates'
  ,'aerosol_cooling_loss->particulate_soot_levels'
  // Exact source-readback removals: IPCC AR6 WGI Chapter 9 does not entail
  // these authored directions. Several reverse the assessed mechanism,
  // conflate a state/index with its driver, or use aggregate ocean heat as a
  // causal proxy for a regional oscillation.
  ,'ice_sheet_mass_loss->glacial_lake_failure_risk'
  ,'ice_sheet_mass_loss->glacier_calving_events'
  ,'ocean_heat_content->atlantic_multidecadal_oscillation'
  ,'ocean_salinity_stratification->atlantic_multidecadal_oscillation'
  ,'ocean_heat_content->pacific_decadal_oscillation'
  ,'ocean_heat_content->indian_ocean_dipole'
  ,'monsoon_volatility->indian_ocean_dipole'
  ,'rossby_wave_stalling->north_atlantic_oscillation'
  ,'rossby_wave_stalling->pacific_north_american_pattern'
  ,'temp->quasi_biennial_oscillation'
  ,'madden_julian_oscillation->quasi_biennial_oscillation'
  ,'blocking_pattern_persistence->rossby_wave_stalling'
  ,'extreme_precipitation_intensity->snow_drought'
  ,'ocean_carbon_uptake_weakening->ocean_acidification'
  ,'particulate_soot_levels->aerosol_cooling_loss'
  ,'extreme_precipitation_intensity->humidity_amplification'
  ,'drought_persistence->irrigation_water_inefficiency'
  ,'water_stress->irrigation_water_inefficiency'
  ,'resource_depletion->desalination_dependence'
  ,'methane_leak_detection->carbon_emission'
  ,'cooling_water_competition->semiconductor_fabrication_footprint'
  ,'airport_operational_disruption->supply_chain_port_bottlenecks'
  ,'sea_level_rise->port_heat_vulnerability'
  ,'extreme_precipitation_intensity->rail_heat_buckling'
  ,'personal_conveyance->aviation_demand_growth'
  ,'refrigerant_phase_down->carbon_emission'
  // Cryosphere direction and endpoint repairs. These legacy arrows use an
  // aggregate outcome as a driver, reverse the physical sequence, or conflate
  // a co-occurring ecosystem state with the mechanism that produces it.
  ,'ice_sheet_mass_loss->glacier_meltwater_dependency'
  ,'soil_moisture_collapse->thermokarst_expansion'
  ,'ice_sheet_mass_loss->ice_cap_decapitation'
  ,'ocean_heat_content->ice_cap_decapitation'
  ,'ice_sheet_mass_loss->ice_shelf_grounding_line_retreat'
  ,'ice_sheet_mass_loss->nunatak_habitat_shrinkage'
  ,'snow_drought->nunatak_habitat_shrinkage'
  ,'freshwater_ecosystem_collapse->harmful_algal_blooms'
  // Final exact-readback adjudication: these arrows conflate coupled climate
  // modes, reverse an outcome and driver, or lack source support for the named
  // endpoint. They are removed instead of being promoted by chapter proximity.
  ,'aerosol_cooling_loss->low_cloud_deck_retreat'
  ,'arctic_amplification_rates->rossby_wave_stalling'
  ,'arctic_oscillation->north_atlantic_oscillation'
  ,'atlantic_multidecadal_oscillation->atlantic_ni_o_ni_a'
  ,'atlantic_multidecadal_oscillation->north_atlantic_oscillation'
  ,'ocean_heat_content->low_cloud_deck_retreat'
  ,'ocean_heat_content->southern_annular_mode'
  ,'stratospheric_cooling->quasi_biennial_oscillation'
  ,'temp->atlantic_ni_o_ni_a'
  ,'temp->rossby_wave_stalling'
  ,'temp->southern_annular_mode'
  ,'crop_yield_volatility->feed_crop_dependency'
  ,'fertilizer_price_shock->fertilizer_production'
  ,'food_import_exposure->feed_crop_dependency'
  ,'gas_power_dependence->fertilizer_production'
  ,'atmospheric_dryness->snow_drought'
  ,'snow_drought->permafrost_thaw'
  ,'ocean_acidification->ice_algae_pigmentation'
  ,'aerosol_cooling_loss->stratospheric_aerosols'
  ,'aerosol_cooling_loss->acid_rain_deposition'
  ,'aerosol_cooling_loss->aerosolized_microplastics'
  ,'aerosol_cooling_loss->automotive_brake_dust_particulates'
  ,'aerosol_cooling_loss->aviation_sulphate_particle_layer'
  ,'aerosol_cooling_loss->black_carbon_deposition'
  ,'aerosol_cooling_loss->copper_smelter_acid_rainfall'
  ,'aerosol_cooling_loss->stratospheric_cooling'
  ,'aerosol_cooling_loss->stratospheric_water_vapor'
  ,'ai_data_centers->cloud_compute_grid_bottlenecks'
  ,'ai_data_centers->edge_compute_load_pocket'
  ,'ai_data_centers->gpu_training_cluster'
  ,'air_conditioning_refrigerants->cold_chain_refrigerant_leaks'
  ,'air_conditioning_refrigerants->commercial_refrigeration_freon_leaks'
  ,'air_conditioning_refrigerants->hydrofluorocarbon_output'
  ,'amoc->subpolar_gyre_weakening'
  ,'amoc->thermohaline_disruption'
  ,'aquifer_overdraft->aquifer_recharge_failure'
  ,'aquifer_overdraft->water_aquifer_conflict_zones'
  ,'aviation_demand_growth->airport_runway_canopy_clearance'
  ,'aviation->airport_climate_exposure'
  ,'biodiversity_intactness_loss->avian_migration_disruptions'
  ,'biodiversity_intactness_loss->bark_beetle_epidemics'
  ,'biodiversity_intactness_loss->biodiversity_corridors_disruption'
  ,'biodiversity_intactness_loss->illegal_wildlife_poaching'
  ,'biodiversity_intactness_loss->invasive_species_encroachment'
  ,'biodiversity_intactness_loss->monoculture_encroachments'
  ,'biodiversity_intactness_loss->peatland_degradations'
  ,'biodiversity_intactness_loss->wetlands_drainage_scales'
  ,'biodiversity_intactness_loss->boreal_insect_infestations'
  ,'biodiversity_intactness_loss->deciduous_leaf_drop_offsets'
  ,'biodiversity_intactness_loss->edge_effect_intensifications'
  ,'biodiversity_intactness_loss->endemic_species_isolations'
  ,'biodiversity_intactness_loss->invertebrate_biomass_crash'
  ,'biodiversity_intactness_loss->keystone_species_deficits'
  ,'biodiversity_intactness_loss->lichen_layer_degradations'
  ,'biodiversity_intactness_loss->migratory_bird_flyway_losses'
  ,'biodiversity_intactness_loss->red_list_extinction_rates'
  ,'biodiversity_intactness_loss->top_predator_extinctions'
  ,'carbon_emission->coal_fly_ash_lagoons'
  ,'carbon_emission->carbon_monoxide'
  ,'river_flow_regime_shift->flame_retardant_runoff'
  ,'river_flow_regime_shift->nitrogen_fertilizer_runoff'
  ,'road_freight_diesel_lock_in->freeway_acoustic_walls_deficit'
  ,'shipping_lane_disruption->heavy_fuel_oil_combustion'
  ,'telecom_backbone->telecom_corridor_congestion'
  ,'urbanization->urban_smog_health_expenses'
  ,'water_stress->floodplain_exposure'
  ,'carbon_emission->aluminum_smelter_slurry_ponds'
  ,'carbon_emission->deepwater_petroleum_spill_risk'
  ,'carbon_emission->e_waste_lead_soil_bleeding'
  ,'carbon_emission->electrical_grid_load_sinks'
  ,'resource_depletion->chemical_factory_acid_spills'
  ,'resource_depletion->consumer_product_obsolescence'
  ,'subsea_cables->subsea_methane_hydrate_venting'
  ,'subsea_cables->subsea_permafrost_decay'
  ,'resource_depletion->e_waste_processing_scrap'
  ,'migration->climate_refugee_migrant_flows'
  ,'environ_anomalies->sulfur_dioxide'
  ,'environ_anomalies->volatile_organic_compounds'
  ,'environ_anomalies->solar_radiation_trapping'
  ,'environ_anomalies->atmospheric_humidity'
  ,'environ_anomalies->cloud_albedo_shift'
  ,'environ_anomalies->halon_gas_concentrations'
  ,'environ_anomalies->ambient_air_quality_deficit'
  ,'environ_anomalies->smog_density_peak'
  ,'environ_anomalies->fluorinated_gas_exhaust'
  ,'environ_anomalies->nitrogen_oxide_saturation'
  ,'environ_anomalies->atmospheric_heat_domers'
  ,'environ_anomalies->tropospheric_warming_speeds'
  ,'environ_anomalies->haze_density_index'
  ,'environ_anomalies->thermal_air_column_shifts'
  ,'environ_anomalies->global_dimming_factor'
  ,'environ_anomalies->nighttime_heat_retention'
  ,'environ_anomalies->walker_circulation_shift'
  ,'environ_anomalies->polar_vortex_instabilities'
  ,'environ_anomalies->subtropical_jet_drag'
  ,'environ_anomalies->land_ocean_warming_contrast'
  ,'environ_anomalies->trade_wind_weakening'
  ,'environ_anomalies->tropospheric_gas_oxidation'
  ,'environ_anomalies->industrial_flaring_outflow'
  ,'environ_anomalies->wildfire_smoke_columns'
  ,'environ_anomalies->fugitive_dust_plumes'
  ,'environ_anomalies->cloud_feedback_hotspots'
]);

const SOURCES = Object.freeze({
  climate_dynamics: [
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-3/',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
    'https://psl.noaa.gov/data/climateindices/'
  ],
  extremes: [
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-16/'
  ],
  cryosphere: [
    'https://www.ipcc.ch/srocc/chapter/chapter-2/',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
  ],
  oceans: [
    'https://www.ipcc.ch/srocc/chapter/chapter-5/',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
  ],
  food: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/',
    'https://www.fao.org/climate-change/en'
  ],
  water: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/',
    'https://www.wri.org/aqueduct'
  ],
  infrastructure: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/'
  ],
  health: [
    'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/'
  ],
  biodiversity: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/',
    'https://www.ipbes.net/global-assessment'
  ],
  energy: [
    'https://www.iea.org/reports/world-energy-outlook-2025',
    'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-6/'
  ]
});

function relationship(source, target, group, mechanism, options = {}) {
  const sourceUrls = options.source_urls || SOURCES[group];
  return {
    source,
    target,
    verb: options.verb || 'contributes to',
    adverb: options.adverb || 'under bounded conditions',
    influence: options.influence ?? 0.34,
    topology_rule: options.topology_rule || 'northstar_contract_repair',
    evidence: {
      source_status: options.direct ? 'curated_edge_reference' : 'curated_local_reference',
      evidence_mode: options.direct ? 'curated_edge_reference' : 'curated_local_reference',
      relationship_level: options.direct ? 'direct' : 'indirect',
      source_urls: sourceUrls,
      relationship_source_urls: sourceUrls,
      relationship_type: options.relationship_type || 'bounded_multi_driver_pathway',
      confidence: options.confidence || (options.direct ? 'high' : 'moderate'),
      mechanism,
      geographic_scope: options.geographic_scope || 'system dependent; global evidence with regional expression',
      temporal_scope: options.temporal_scope || 'seasonal to multi-decadal, depending on the pathway',
      notes: `Contract repair: ${mechanism} This edge is bounded by the attached geographic and temporal scope and should not be read as universal deterministic causation.`
    }
  };
}

const REPAIR_SPECS = [
  ['atlantic_ni_o_ni_a', 'climate_dynamics', ['atlantic_multidecadal_oscillation', 'ocean_salinity_stratification', 'temp']],
  ['atlantic_multidecadal_oscillation', 'climate_dynamics', ['ocean_current_regime_shift', 'ocean_heat_content', 'ocean_salinity_stratification']],
  ['pacific_decadal_oscillation', 'climate_dynamics', ['el_nino', 'la_nina', 'ocean_heat_content']],
  ['indian_ocean_dipole', 'climate_dynamics', ['el_nino', 'ocean_heat_content', 'monsoon_volatility']],
  ['north_atlantic_oscillation', 'climate_dynamics', ['arctic_oscillation', 'atlantic_multidecadal_oscillation', 'rossby_wave_stalling']],
  ['air_pollution_health_burden', 'health', ['pm2_5_particulates', 'tropospheric_ozone', 'wildfire_smoke_pm25_exposure']],
  ['pacific_north_american_pattern', 'climate_dynamics', ['el_nino', 'pacific_decadal_oscillation', 'rossby_wave_stalling']],
  ['southern_annular_mode', 'climate_dynamics', ['stratospheric_cooling', 'ocean_heat_content', 'temp']],
  ['quasi_biennial_oscillation', 'climate_dynamics', ['temp', 'stratospheric_cooling', 'madden_julian_oscillation']],
  ['rossby_wave_stalling', 'climate_dynamics', ['arctic_amplification_rates', 'blocking_pattern_persistence', 'temp']],
  ['amoc', 'oceans', ['ocean_heat_content', 'ice_sheet_mass_loss', 'ocean_salinity_stratification']],
  ['livestock_disease_pressure', 'food', ['wet_bulb_heat', 'water_stress']],
  ['farm_heat_stress', 'food', ['wet_bulb_heat', 'drought_persistence']],
  ['feed_crop_dependency', 'food', ['crop_yield_volatility', 'food_import_exposure']],
  ['irrigation_water_inefficiency', 'water', ['drought_persistence', 'water_stress']],
  ['soil_moisture_collapse', 'water', ['temp', 'atmospheric_dryness']],
  ['semiconductor_fabrication_footprint', 'energy', ['data_centers', 'cooling_water_competition']],
  ['mangrove_buffer_loss', 'biodiversity', ['sea_level_rise', 'coastal_erosion']],
  ['fertilizer_production', 'food', ['gas_power_dependence', 'fertilizer_price_shock', 'food']],
  ['wildfire_regime_shift', 'extremes', ['atmospheric_dryness', 'drought_persistence']],
  ['insurance_retreat', 'infrastructure', ['coastal_inundation_risk', 'wildfire_regime_shift']],
  ['watershed_forest_loss', 'biodiversity', ['deforestation', 'wildfire_regime_shift']],
  ['adaptation_capital_shortfall', 'infrastructure', ['disaster_recovery_inequality', 'insurance_retreat']],
  ['arctic_shipping_expansion', 'cryosphere', ['temp', 'sea_ice_season_loss']],
  ['shipping_lane_disruption', 'infrastructure', ['tropical_cyclone_rapid_intensification', 'coastal_inundation_risk']],
  ['airport_operational_disruption', 'infrastructure', ['extreme_precipitation_intensity', 'wet_bulb_heat']],
  ['snowmelt_timing_shift', 'cryosphere', ['temp', 'snow_drought']],
  ['sea_ice_season_loss', 'cryosphere', ['ocean_heat_content', 'arctic_amplification_rates']],
  ['thermokarst_expansion', 'cryosphere', ['temp', 'soil_moisture_collapse']],
  ['ocean_salinity_stratification', 'oceans', ['ice_sheet_mass_loss', 'extreme_precipitation_intensity']],
  ['aviation_demand_growth', 'infrastructure', ['urbanization', 'personal_conveyance']],
  ['freight_electrification_gap', 'energy', ['transmission_buildout_lag', 'battery_supply_chain_pressure']],
  ['port_heat_vulnerability', 'infrastructure', ['wet_bulb_heat', 'sea_level_rise']],
  ['rail_heat_buckling', 'infrastructure', ['extreme_precipitation_intensity', 'wildfire_regime_shift']],
  ['glacial_lake_failure_risk', 'cryosphere', ['temp', 'ice_sheet_mass_loss']],
  ['snow_drought', 'cryosphere', ['extreme_precipitation_intensity', 'atmospheric_dryness']],
  ['ocean_acidification', 'oceans', ['ocean_carbon_uptake_weakening', 'ocean_heat_content']],
  ['ice_sheet_mass_loss', 'cryosphere', ['temp', 'ocean_heat_content']],
  ['ozone_formation_pressure', 'health', ['volatile_organic_compounds', 'temp', 'road_freight_diesel_lock_in']],
  ['permafrost_thaw', 'cryosphere', ['snow_drought', 'arctic_amplification_rates']],
  ['groundwater_depletion', 'water', ['drought_persistence', 'irrigation_water_inefficiency']],
  ['food_waste', 'food', ['urbanization', 'cold_chain_failure_risk']],
  ['low_cloud_deck_retreat', 'climate_dynamics', ['ocean_heat_content', 'aerosol_cooling_loss']],
  ['aerosol_cooling_loss', 'climate_dynamics', ['particulate_soot_levels', 'pyrocumulonimbus_smoke_injection']],
  ['water_stress', 'water', ['drought_persistence', 'groundwater_depletion']],
  ['hail_hazard_shift', 'extremes', ['humidity_amplification', 'extreme_precipitation_intensity']],
  ['madden_julian_oscillation', 'climate_dynamics', ['indian_ocean_dipole', 'el_nino']],
  ['humidity_amplification', 'climate_dynamics', ['ocean_heat_content', 'extreme_precipitation_intensity']],
  ['atmospheric_dryness', 'extremes', ['drought_persistence', 'soil_moisture_collapse']],
  ['air_conditioning_refrigerants', 'health', ['wet_bulb_heat', 'urbanization']]
];

export const FIRST_50_ANCHOR_REPAIR_IDS = REPAIR_SPECS.map(([target]) => target);
export const ANCHOR_REPAIR_RELATIONSHIPS = REPAIR_SPECS.flatMap(([target, group, drivers]) => (
  drivers.map(source => relationship(
    source,
    target,
    group,
    `${source.replaceAll('_', ' ')} can condition ${target.replaceAll('_', ' ')} through the reviewed ${group.replaceAll('_', ' ')} mechanism.`
  ))
));

const REHABILITATION_SPECS = [
  ['tundra_methane_outgassing', 'cryosphere', ['temp', 'permafrost_thaw', 'thermokarst_expansion'], 'methane'],
  ['mountain_pass_avalanches', 'cryosphere', ['temp', 'rain_on_snow_flood_risk', 'snowmelt_timing_shift'], 'critical_infrastructure_fragility'],
  ['ice_shelf_grounding_line_retreat', 'cryosphere', ['temp', 'ocean_heat_content', 'ice_sheet_mass_loss'], 'sea_level_rise'],
  ['arctic_pack_ice_drift', 'cryosphere', ['sea_ice_season_loss', 'ocean_current_regime_shift', 'temp'], 'shipping_lane_disruption'],
  ['cryoconite_hole_expansion', 'cryosphere', ['temp', 'particulate_soot_levels', 'soot_deposition_on_snow'], 'ice_albedo_feedback_loops'],
  ['ice_algae_pigmentation', 'cryosphere', ['temp', 'sea_ice_season_loss', 'ocean_acidification'], 'marine_food_web_simplification'],
  ['glacier_hydrologic_system_floods', 'cryosphere', ['temp', 'snowmelt_timing_shift', 'glacial_lake_failure_risk'], 'river_flow_regime_shift'],
  ['ice_cap_decapitation', 'cryosphere', ['temp', 'ocean_heat_content', 'ice_sheet_mass_loss'], 'sea_level_rise'],
  ['nunatak_habitat_shrinkage', 'biodiversity', ['temp', 'ice_sheet_mass_loss', 'snow_drought'], 'biodiversity_intactness_loss']
];

export const REHABILITATION_NODE_SOURCES = Object.freeze({
  tundra_methane_outgassing: ['https://www.ipcc.ch/srocc/chapter/chapter-3-2/', 'https://arctic.noaa.gov/report-card/report-card-2024/arctic-terrestrial-carbon-cycling/'],
  mountain_pass_avalanches: ['https://www.ipcc.ch/srocc/chapter/chapter-2/', 'https://www.slf.ch/fileadmin/user_upload/SLF/Lawinen/Unfaelle_Schadenlawinen/Unfallberichte_Publikationen/Englisch/1997_Laternser.pdf'],
  ice_shelf_grounding_line_retreat: ['https://www.ipcc.ch/srocc/chapter/chapter-3-2/', 'https://earthobservatory.nasa.gov/images/148561/antarcticas-retreating-ice-shelves'],
  arctic_pack_ice_drift: ['https://nsidc.org/learn/parts-cryosphere/sea-ice', 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/'],
  cryoconite_hole_expansion: ['https://earthobservatory.nasa.gov/images/145249/soot-speeds-up-snowmelt', 'https://doi.org/10.3389/feart.2019.00360'],
  ice_algae_pigmentation: ['https://arctic.noaa.gov/report-card/report-card-2024/arctic-ocean-primary-productivity/', 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/'],
  glacier_hydrologic_system_floods: ['https://www.ipcc.ch/srocc/chapter/chapter-2/', 'https://www.usgs.gov/water-science-school/science/glaciers-and-icecaps'],
  ice_cap_decapitation: ['https://www.ipcc.ch/srocc/chapter/chapter-2/', 'https://climate.nasa.gov/vital-signs/ice-sheets/'],
  nunatak_habitat_shrinkage: ['https://www.ipcc.ch/srocc/chapter/chapter-2/', 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/']
});

export const REHABILITATED_GENERATED_NODE_IDS = new Set(REHABILITATION_SPECS.map(([id]) => id));
export const GENERATED_REHABILITATION_RELATIONSHIPS = REHABILITATION_SPECS.flatMap(([target, group, drivers, effect]) => [
  ...drivers.map(source => relationship(
    source,
    target,
    group,
    `${source.replaceAll('_', ' ')} is a documented driver or conditioning factor for ${target.replaceAll('_', ' ')}.`,
    { topology_rule: 'generated_node_rehabilitation', source_urls: REHABILITATION_NODE_SOURCES[target] }
  )),
  relationship(
    target,
    effect,
    group,
    `${target.replaceAll('_', ' ')} can propagate into ${effect.replaceAll('_', ' ')} through the documented system pathway.`,
    { topology_rule: 'generated_node_rehabilitation', relationship_type: 'bounded_downstream_effect', source_urls: REHABILITATION_NODE_SOURCES[target] }
  )
]);

export const NODE_METRIC_CONTRACTS = Object.freeze({
  biodiversity_intactness_loss: {
    metric_id: 'gbif_species_occurrence_coverage',
    metric_name: 'Quality-controlled species occurrence coverage',
    unit: 'occurrence records and occupied grid cells',
    geography: 'global, country, or bounded region',
    cadence: 'monthly',
    observation_time_field: 'eventDate',
    source_id: 'gbif_occurrence_api',
    transformation: 'Deduplicate occurrence keys; exclude invalid coordinates; aggregate by taxon, period, and equal-area cell; retain sampling volume.',
    uncertainty: 'Occurrence density reflects observer effort and data mobilization as well as ecology.',
    threshold_provenance: 'No universal ecological threshold; compare against a fixed baseline and sampling-adjusted trend.',
    failure_behavior: 'Retain the previous reviewed snapshot and mark stale; never convert missing API data to zero.'
  },
  invasive_species_encroachment: {
    metric_id: 'gbif_non_native_occurrence_expansion',
    metric_name: 'Non-native occurrence range expansion',
    unit: 'new occupied grid cells per period',
    geography: 'bounded region',
    cadence: 'monthly',
    observation_time_field: 'eventDate',
    source_id: 'gbif_occurrence_api',
    transformation: 'Join an approved non-native taxon list to cleaned GBIF occurrences and compare occupied-cell extent with a fixed baseline.',
    uncertainty: 'Sensitive to taxonomic revisions, reporting effort, and uneven surveillance.',
    threshold_provenance: 'Region-specific baseline; no global score update without a reviewed taxon and geography contract.',
    failure_behavior: 'Freeze the prior value and surface source freshness and coverage loss.'
  },
  pelagic_species_redistribution: {
    metric_id: 'obis_marine_occurrence_centroid_shift',
    metric_name: 'Marine species occurrence centroid shift',
    unit: 'kilometers per decade',
    geography: 'marine ecoregion or bounded taxon range',
    cadence: 'quarterly',
    observation_time_field: 'eventdate',
    source_id: 'obis_api_v3',
    transformation: 'Apply QC flags, retain sampling context, and estimate taxon-specific spatial centroids over comparable multi-year windows.',
    uncertainty: 'Presence-only data and uneven cruise effort can mimic redistribution.',
    threshold_provenance: 'Taxon-specific confidence intervals and minimum observation counts required.',
    failure_behavior: 'Do not publish a trend when minimum temporal or spatial coverage fails.'
  },
  marine_food_web_simplification: {
    metric_id: 'obis_taxonomic_richness_balance',
    metric_name: 'Quality-controlled marine taxonomic richness balance',
    unit: 'taxa per sampled grid-period',
    geography: 'marine ecoregion',
    cadence: 'quarterly',
    observation_time_field: 'eventdate',
    source_id: 'obis_api_v3',
    transformation: 'Aggregate validated occurrences by comparable grid, depth, season, and sampling window; preserve record count and dataset mix.',
    uncertainty: 'Not a direct food-web index; use as a monitored supporting indicator only.',
    threshold_provenance: 'Requires an authored ecological baseline before affecting TULIP scores.',
    failure_behavior: 'Mark insufficient coverage rather than imputing richness.'
  },
  river_flow_regime_shift: {
    metric_id: 'usgs_daily_discharge_regime',
    metric_name: 'Daily mean stream discharge anomaly',
    unit: 'percent anomaly from station seasonal baseline',
    geography: 'USGS monitoring station and basin',
    cadence: 'daily snapshot',
    observation_time_field: 'time',
    source_id: 'usgs_water_data_ogc_api',
    transformation: 'Use parameter 00060 and statistic 00003; parse numeric strings; compare with station-specific day-of-year baseline.',
    uncertainty: 'Station coverage is US-focused and provisional values may be revised.',
    threshold_provenance: 'Station and basin baselines; no global extrapolation.',
    failure_behavior: 'Preserve prior approved station values and expose provisional, missing, or rate-limited status.'
  },
  groundwater_depletion: {
    metric_id: 'usgs_groundwater_level_observation',
    metric_name: 'Groundwater-level departure from station baseline',
    unit: 'feet or meters from station datum',
    geography: 'USGS well and aquifer',
    cadence: 'weekly',
    observation_time_field: 'time',
    source_id: 'usgs_water_data_ogc_api',
    transformation: 'Normalize station units and datum metadata before calculating departures from a reviewed station baseline.',
    uncertainty: 'Well networks are spatially uneven and local pumping can dominate individual observations.',
    threshold_provenance: 'Aquifer-specific baseline and minimum network coverage required.',
    failure_behavior: 'Never treat absent wells or observations as stable groundwater.'
  },
  ...HIGH_IMPACT_HUB_METRIC_CONTRACTS,
  ...REMAINING_LIVE_NODE_METRIC_CONTRACTS,
  ...IMPLEMENTED_EXPANSION_METRIC_CONTRACTS,
  ...CASCADE_ANCHOR_METRIC_CONTRACTS,
  ...PRIORITY_ANCHOR_METRIC_CONTRACTS,
  ...RESEARCH_BATCH_METRIC_CONTRACTS,
  ...RESEARCH_BATCH_TWO_METRIC_CONTRACTS,
  [JET_REHABILITATION_NODE_ID]: JET_REHABILITATION_METRIC_CONTRACT,
  ...RIVER_BARRIER_METRIC_CONTRACTS,
  ...HUMANITARIAN_METRIC_CONTRACTS,
  ...GROUNDWATER_WITHDRAWAL_METRIC_CONTRACTS,
  ...OPERATIONAL_INDICATOR_METRIC_CONTRACTS,
  ...NITROUS_OXIDE_METRIC_CONTRACTS,
  ...SULFUR_DIOXIDE_METRIC_CONTRACTS,
  ...COAL_POWER_METRIC_CONTRACTS,
  ...ELECTRONICS_EOL_METRIC_CONTRACTS,
  ...CARBON_MONOXIDE_METRIC_CONTRACTS,
  ...LANDFILL_METHANE_METRIC_CONTRACTS,
  ...RICE_METHANE_METRIC_CONTRACTS,
  ...LOCOMOTIVE_EMISSIONS_METRIC_CONTRACTS,
  ...CEMENT_CALCINATION_METRIC_CONTRACTS,
  ...REFRIGERANT_LEAKAGE_METRIC_CONTRACTS,
  ...TIRE_WEAR_METRIC_CONTRACTS,
  ...COMBINED_SEWER_OVERFLOW_METRIC_CONTRACTS,
  ...CORAL_BLEACHING_METRIC_CONTRACTS,
  ...SEMICONDUCTOR_FGAS_METRIC_CONTRACTS,
  ...BLAST_FURNACE_SLAG_METRIC_CONTRACTS,
  ...ALPINE_SNOWPACK_METRIC_CONTRACTS,
  ...MANURE_LAGOON_METRIC_CONTRACTS,
  ...LITHIUM_BRINE_METRIC_CONTRACTS,
  ...CATTLE_COMPACTION_METRIC_CONTRACTS,
  ...WATERBORNE_OUTBREAK_METRIC_CONTRACTS,
  ...POLLINATOR_COLLAPSE_METRIC_CONTRACTS,
  ...ACID_DEPOSITION_METRIC_CONTRACTS,
  ...FOREST_DIEBACK_METRIC_CONTRACTS,
  ...SOIL_MICROBIAL_METRIC_CONTRACTS,
  ...URBAN_WATER_RATIONING_METRIC_CONTRACTS,
  ...DEEPWATER_SPILL_METRIC_CONTRACTS,
  ...WILDFIRE_SMOKE_HEALTH_METRIC_CONTRACTS,
  ...RESERVOIR_STORAGE_METRIC_CONTRACTS,
  ...AIR_POLLUTION_HEALTH_METRIC_CONTRACTS,
  ...RAIN_ON_SNOW_METRIC_CONTRACTS
  ,...SURFACE_STORAGE_METRIC_CONTRACTS
  ,...TALIK_EXPANSION_METRIC_CONTRACTS
  ,...COASTAL_PERMAFROST_METRIC_CONTRACTS
  ,...FRACKING_WASTEWATER_METRIC_CONTRACTS
  ,...COASTAL_HYPOXIA_METRIC_CONTRACTS
  ,...TUNDRA_SHRUBIFICATION_METRIC_CONTRACTS
  ,...FREEZE_THAW_ROCK_METRIC_CONTRACTS
  ,...FJORD_SEDIMENTATION_METRIC_CONTRACTS
  ,...INLAND_WATERWAY_SPILL_METRIC_CONTRACTS
  ,...COASTAL_SALTWATER_INTRUSION_METRIC_CONTRACTS
  ,...ARCTIC_ICE_RETREAT_METRIC_CONTRACTS
  ,...FINAL_DENSITY_BATCH_METRIC_CONTRACTS
  ,...EXTENSION_DENSITY_BATCH_METRIC_CONTRACTS
  ,...CARBON_EMISSION_EXPANSION_METRIC_CONTRACTS
  ,...SUBSEA_CABLE_METRIC_CONTRACTS
  ,...PALM_OIL_CLEARANCE_METRIC_CONTRACTS
  ,...ONTOLOGY_METRIC_CONTRACTS
  ,...ONTOLOGY_PROMOTION_METRIC_CONTRACTS
  ,...ONTOLOGY_PROMOTION_BATCH_TWO_METRIC_CONTRACTS
  ,...DEGREE_TWO_PROMOTION_METRIC_CONTRACTS
  ,...OPEN_BACKLOG_WAVE_ONE_METRIC_CONTRACTS
  ,...FULL_BACKLOG_METRIC_CONTRACTS
  ,...GREENHOUSE_FORCING_METRIC_CONTRACTS
});

export const PHENOMENON_PROMOTION_CANDIDATES = Object.freeze(PHENOMENON_EXPANSION_DECISIONS.map(item => ({
  ...item,
  id: item.canonical_id || item.original_id,
  name: item.canonical_name || item.original_name,
  status: PROMOTED_EXPANSION_NODE_IDS.includes(item.canonical_id)
    ? 'approved_and_promoted'
    : item.decision_type.startsWith('stage_new')
      ? 'staged_awaiting_explicit_promotion_approval'
    : item.decision_type === 'merge_metric_into_existing'
      ? 'merged_metric_only'
      : item.decision_type === 'reject_composite'
        ? 'rejected_ontology'
        : 'deferred_research_track',
  promotion_requirements: [
    'node-specific primary or official sources',
    'at least three bounded incoming relationship contracts unless classified as an authored root',
    'at least one meaningful downstream effect where appropriate',
    'a complete metric contract or an explicit non-measurable rationale',
    'manual duplicate and overlap review'
  ]
})));

function classifyNode(node) {
  if (node.id?.startsWith('evidence_') || node.id?.startsWith('extension_')) return NODE_CLASSES.OPERATIONAL_INDICATOR;
  if (node.authored_node_class && Object.values(NODE_CLASSES).includes(node.authored_node_class)) return node.authored_node_class;
  if (node.node_kind === 'response') return NODE_CLASSES.RESPONSE;
  if (SEMANTIC_RESPONSE_IDS.has(node.id)) return NODE_CLASSES.RESPONSE;
  if (AUTHORED_ROOT_DRIVER_IDS.has(node.id)) return NODE_CLASSES.AUTHORED_ROOT_DRIVER;
  if (OPERATIONAL_INDICATOR_IDS.has(node.id) || node.authenticity?.status?.includes('operational_indicator')) return NODE_CLASSES.OPERATIONAL_INDICATOR;
  return NODE_CLASSES.PHENOMENON;
}

function hasCompleteGateEvidence(edge) {
  const evidence = edge?.evidence || {};
  const dossier = evidence.dossier;
  const readback = evidence.source_readback;
  const completeDossier = dossier?.promotion_status === 'promoted'
    && Boolean(dossier.mechanism)
    && Boolean(dossier.geographic_scope)
    && Boolean(dossier.temporal_scope)
    && Array.isArray(dossier.moderators) && dossier.moderators.length > 0
    && Boolean(dossier.counterevidence)
    && Boolean(dossier.indicator?.metric_id)
    && Array.isArray(dossier.source_locators) && dossier.source_locators.length >= 2;
  const completeReadback = readback?.status === 'confirmed_bounded'
    && Boolean(readback.exact_claim)
    && Boolean(readback.geographic_temporal_scope)
    && Boolean(readback.moderators_and_counterevidence)
    && Array.isArray(readback.source_locators) && readback.source_locators.length >= 2;
  return completeDossier || completeReadback;
}

function addContractEdges(nodes, edges, contracts) {
  const nodeIds = new Set(nodes.map(node => node.id));
  const cascadeAnchorIds = new Set(CASCADE_ANCHOR_IDS);
  const contractByKey = new Map(contracts.map(edge => [`${edge.source}->${edge.target}`, edge]));
  const cleanedEdges = edges.filter(edge => {
    const key = `${edge.source}->${edge.target}`;
    if (CASCADE_UNSUPPORTED_EDGE_KEYS.has(key) || RESEARCH_TRACK_UNSUPPORTED_EDGE_KEYS.has(key) || RESEARCH_TRACK_REPLACED_EDGE_KEYS.has(key) || REJECTED_LEGACY_EDGE_KEYS.has(key) || OPEN_BACKLOG_WAVE_ONE_REJECTED_EDGE_KEYS.has(key) || ONTOLOGY_PROMOTION_BATCH_TWO_REJECTED_EDGE_KEYS.has(key) || DEGREE_TWO_PROMOTION_REJECTED_EDGE_KEYS.has(key) || RICE_METHANE_REJECTED_EDGE_KEYS.has(key)) return false;
    const touchesCascadeAnchor = cascadeAnchorIds.has(edge.source) || cascadeAnchorIds.has(edge.target);
    const hasRelationshipSources = (edge.evidence?.relationship_source_urls || []).length > 0;
    return !touchesCascadeAnchor || hasRelationshipSources || contractByKey.has(key);
  });
  const seen = new Set();
  const merged = cleanedEdges.map(edge => {
    const key = `${edge.source}->${edge.target}`;
    seen.add(key);
    const contract = contractByKey.get(key);
    if (!contract) return edge;
    return {
      ...edge,
      ...contract,
      evidence: {
        ...(edge.evidence || {}),
        ...(contract.evidence || {})
      }
    };
  });
  const additions = [];
  for (const edge of contracts) {
    const key = `${edge.source}->${edge.target}`;
    if (REJECTED_LEGACY_EDGE_KEYS.has(key) || ONTOLOGY_PROMOTION_BATCH_TWO_REJECTED_EDGE_KEYS.has(key) || DEGREE_TWO_PROMOTION_REJECTED_EDGE_KEYS.has(key) || RICE_METHANE_REJECTED_EDGE_KEYS.has(key)) continue;
    // A later, more specific dossier supersedes an earlier generic repair for the same edge.
    if (contractByKey.get(key) !== edge) continue;
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || seen.has(key)) continue;
    seen.add(key);
    additions.push(edge);
  }
  return [...merged, ...additions];
}

export function applyNorthstarGraphContracts(nodes, inputEdges) {
  const edges = addContractEdges(
    nodes,
    inputEdges,
    [
      ...ANCHOR_REPAIR_RELATIONSHIPS,
      ...GENERATED_REHABILITATION_RELATIONSHIPS,
      ...CASCADE_ANCHOR_RELATIONSHIPS,
      ...PROMOTED_EXPANSION_RELATIONSHIPS,
      ...PRIORITY_ANCHOR_RELATIONSHIPS,
      ...RESEARCH_BATCH_RELATIONSHIPS,
      ...RESEARCH_BATCH_TWO_RELATIONSHIPS,
      ...JET_REHABILITATION_RELATIONSHIPS,
      ...RIVER_BARRIER_RELATIONSHIPS,
      ...HUMANITARIAN_RELATIONSHIPS,
      ...GROUNDWATER_WITHDRAWAL_RELATIONSHIPS,
      ...OPERATIONAL_INDICATOR_REHABILITATION_RELATIONSHIPS,
      ...NITROUS_OXIDE_REHABILITATION_RELATIONSHIPS,
      ...SULFUR_DIOXIDE_REHABILITATION_RELATIONSHIPS,
      ...COAL_POWER_RELATIONSHIPS,
      ...ELECTRONICS_EOL_RELATIONSHIPS,
      ...CARBON_MONOXIDE_RELATIONSHIPS,
      ...LANDFILL_METHANE_RELATIONSHIPS,
      ...RICE_METHANE_RELATIONSHIPS,
      ...LOCOMOTIVE_EMISSIONS_RELATIONSHIPS,
      ...CEMENT_CALCINATION_RELATIONSHIPS,
      ...REFRIGERANT_LEAKAGE_RELATIONSHIPS,
      ...TIRE_WEAR_RELATIONSHIPS,
      ...COMBINED_SEWER_OVERFLOW_RELATIONSHIPS,
      ...CORAL_BLEACHING_RELATIONSHIPS,
      ...SEMICONDUCTOR_FGAS_RELATIONSHIPS,
      ...BLAST_FURNACE_SLAG_RELATIONSHIPS,
      ...ALPINE_SNOWPACK_RELATIONSHIPS,
      ...MANURE_LAGOON_RELATIONSHIPS,
      ...LITHIUM_BRINE_RELATIONSHIPS,
      ...CATTLE_COMPACTION_RELATIONSHIPS,
      ...WATERBORNE_OUTBREAK_RELATIONSHIPS,
      ...POLLINATOR_COLLAPSE_RELATIONSHIPS,
      ...ACID_DEPOSITION_RELATIONSHIPS,
      ...FOREST_DIEBACK_RELATIONSHIPS,
      ...SOIL_MICROBIAL_RELATIONSHIPS,
      ...URBAN_WATER_RATIONING_RELATIONSHIPS,
      ...DEEPWATER_SPILL_RELATIONSHIPS,
      ...WILDFIRE_SMOKE_HEALTH_RELATIONSHIPS,
      ...RESERVOIR_STORAGE_RELATIONSHIPS,
      ...AIR_POLLUTION_HEALTH_RELATIONSHIPS,
      ...RAIN_ON_SNOW_RELATIONSHIPS,
      ...SURFACE_STORAGE_RELATIONSHIPS,
      ...TALIK_EXPANSION_RELATIONSHIPS,
      ...COASTAL_PERMAFROST_RELATIONSHIPS,
      ...FRACKING_WASTEWATER_RELATIONSHIPS,
      ...COASTAL_HYPOXIA_RELATIONSHIPS,
      ...TUNDRA_SHRUBIFICATION_RELATIONSHIPS,
      ...FREEZE_THAW_ROCK_RELATIONSHIPS,
      ...FJORD_SEDIMENTATION_RELATIONSHIPS,
      ...INLAND_WATERWAY_SPILL_RELATIONSHIPS,
      ...COASTAL_SALTWATER_INTRUSION_RELATIONSHIPS,
      ...ARCTIC_ICE_RETREAT_RELATIONSHIPS,
      ...FINAL_DENSITY_BATCH_RELATIONSHIPS,
      ...EXTENSION_DENSITY_BATCH_RELATIONSHIPS,
      ...CARBON_EMISSION_EXPANSION_RELATIONSHIPS,
      ...SUBSEA_CABLE_RELATIONSHIPS,
      ...PALM_OIL_CLEARANCE_RELATIONSHIPS,
      ...ONTOLOGY_PROMOTION_RELATIONSHIPS,
      ...ONTOLOGY_PROMOTION_BATCH_TWO_RELATIONSHIPS,
      ...DEGREE_TWO_PROMOTION_RELATIONSHIPS,
      ...INVASIVE_SPECIES_RELATIONSHIPS,
      ...OPEN_BACKLOG_WAVE_ONE_RELATIONSHIPS,
      ...FULL_BACKLOG_RELATIONSHIPS,
      ...GREENHOUSE_FORCING_RELATIONSHIPS,
      ...BARK_BEETLE_RELATIONSHIPS,
      ...ZOONOTIC_OUTBREAK_RELATIONSHIPS,
      ...ANCHOR_STRUCTURAL_EXPANSION_RELATIONSHIPS,
      ...CROSS_SYSTEM_BACKLOG_RELATIONSHIPS,
      ...CROSS_SYSTEM_BACKLOG_BATCH_TWO_RELATIONSHIPS,
      ...CROSS_SYSTEM_BACKLOG_BATCH_THREE_RELATIONSHIPS,
      ...CROSS_SYSTEM_BACKLOG_BATCH_FOUR_RELATIONSHIPS,
      ...LEGACY_SOURCE_REPAIR_RELATIONSHIPS,
      ...RELATIONSHIP_DIRECTION_REPAIR_RELATIONSHIPS
      ,...SEMANTIC_DRIVER_GATE_REPAIR_RELATIONSHIPS
    ]
  );
  const incoming = new Map(nodes.map(node => [node.id, 0]));
  const qualifiedIncoming = new Map(nodes.map(node => [node.id, 0]));
  const outgoing = new Map(nodes.map(node => [node.id, 0]));
  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    if (hasCompleteGateEvidence(edge) || hasCompleteFullBacklogDossier(edge) || hasCompletePromotedDossier(edge) || hasCompleteExpansionDossier(edge) || hasCompletePriorityAnchorDossier(edge) || hasCompleteResearchBatchDossier(edge) || hasCompleteResearchBatchTwoDossier(edge) || hasCompleteJetDossier(edge) || hasCompleteRiverBarrierDossier(edge) || hasCompleteHumanitarianDossier(edge) || hasCompleteGroundwaterWithdrawalDossier(edge) || hasCompleteOperationalIndicatorDossier(edge) || hasCompleteNitrousOxideDossier(edge) || hasCompleteSulfurDioxideDossier(edge) || hasCompleteCoalPowerDossier(edge) || hasCompleteElectronicsEolDossier(edge) || hasCompleteCarbonMonoxideDossier(edge) || hasCompleteLandfillMethaneDossier(edge) || hasCompleteRiceMethaneDossier(edge) || hasCompleteLocomotiveEmissionsDossier(edge) || hasCompleteCementCalcinationDossier(edge) || hasCompleteRefrigerantLeakageDossier(edge) || hasCompleteTireWearDossier(edge) || hasCompleteCombinedSewerOverflowDossier(edge) || hasCompleteCoralBleachingDossier(edge) || hasCompleteSemiconductorFgasDossier(edge) || hasCompleteBlastFurnaceSlagDossier(edge) || hasCompleteAlpineSnowpackDossier(edge) || hasCompleteManureLagoonDossier(edge) || hasCompleteCattleCompactionDossier(edge) || hasCompleteWaterborneOutbreakDossier(edge) || hasCompletePollinatorCollapseDossier(edge) || hasCompleteAcidDepositionDossier(edge) || hasCompleteForestDiebackDossier(edge) || hasCompleteSoilMicrobialDossier(edge) || hasCompleteUrbanWaterRationingDossier(edge) || hasCompleteDeepwaterSpillDossier(edge) || hasCompleteWildfireSmokeHealthDossier(edge) || hasCompleteReservoirStorageDossier(edge) || hasCompleteAirPollutionHealthDossier(edge) || hasCompleteRainOnSnowDossier(edge) || hasCompleteSurfaceStorageDossier(edge) || hasCompleteTalikExpansionDossier(edge) || hasCompleteCoastalPermafrostDossier(edge) || hasCompleteFrackingWastewaterDossier(edge) || hasCompleteCoastalHypoxiaDossier(edge) || hasCompleteTundraShrubificationDossier(edge) || hasCompleteFreezeThawRockDossier(edge) || hasCompleteFjordSedimentationDossier(edge) || hasCompleteInlandWaterwaySpillDossier(edge) || hasCompletePalmOilClearanceDossier(edge) || hasCompleteOntologyPromotionDossier(edge) || hasCompleteOntologyPromotionBatchTwoDossier(edge) || hasCompleteDegreeTwoPromotionDossier(edge) || hasCompleteInvasiveSpeciesDossier(edge) || hasCompleteOpenBacklogWaveOneDossier(edge)) {
      qualifiedIncoming.set(edge.target, (qualifiedIncoming.get(edge.target) || 0) + 1);
    }
    outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1);
  }
  const contractedNodes = nodes.map(node => {
    const supportOverride = CASCADE_SUPPORT_NODE_OVERRIDES[node.id] || null;
    const contractedNode = supportOverride ? {
      ...node,
      ...supportOverride,
      source_urls: [...new Set([...(node.source_urls || []), ...(supportOverride.source_urls || [])])],
      calibration: {
        ...(node.calibration || {}),
        source_status: 'relationship_dossier_readback',
        source_urls: [...new Set([
          ...(node.calibration?.source_urls || []),
          ...(supportOverride.source_urls || [])
        ])],
        notes: supportOverride.authenticity?.note || node.calibration?.notes
      }
    } : node;
    const rehabSources = FULL_BACKLOG_NODE_SOURCES[node.id] || OPEN_BACKLOG_WAVE_ONE_NODE_SOURCES[node.id] || DEGREE_TWO_PROMOTION_NODE_SOURCES[node.id] || ONTOLOGY_PROMOTION_BATCH_TWO_NODE_SOURCES[node.id] || ONTOLOGY_PROMOTION_NODE_SOURCES[node.id] || REHABILITATION_NODE_SOURCES[node.id] || RESEARCH_BATCH_NODE_SOURCES[node.id] || RESEARCH_BATCH_TWO_NODE_SOURCES[node.id] || (node.id === INVASIVE_SPECIES_NODE_ID ? INVASIVE_SPECIES_NODE_SOURCES : null) || (node.id === JET_REHABILITATION_NODE_ID ? JET_REHABILITATION_NODE_SOURCES : null) || (node.id === NITROUS_OXIDE_REHABILITATION_NODE_ID ? NITROUS_OXIDE_NODE_SOURCES : null) || (node.id === SULFUR_DIOXIDE_REHABILITATION_NODE_ID ? SULFUR_DIOXIDE_NODE_SOURCES : null) || (node.id === COAL_POWER_INDICATOR_ID ? COAL_POWER_NODE_SOURCES : null) || (node.id === ELECTRONICS_EOL_INDICATOR_ID ? ELECTRONICS_EOL_NODE_SOURCES : null) || (node.id === CARBON_MONOXIDE_INDICATOR_ID ? CARBON_MONOXIDE_NODE_SOURCES : null) || (node.id === LANDFILL_METHANE_INDICATOR_ID ? LANDFILL_METHANE_NODE_SOURCES : null) || (node.id === RICE_METHANE_INDICATOR_ID ? RICE_METHANE_NODE_SOURCES : null) || (node.id === LOCOMOTIVE_EMISSIONS_INDICATOR_ID ? LOCOMOTIVE_EMISSIONS_NODE_SOURCES : null) || (node.id === CEMENT_CALCINATION_INDICATOR_ID ? CEMENT_CALCINATION_NODE_SOURCES : null) || (node.id === REFRIGERANT_LEAKAGE_INDICATOR_ID ? REFRIGERANT_LEAKAGE_NODE_SOURCES : null) || (node.id === TIRE_WEAR_INDICATOR_ID ? TIRE_WEAR_NODE_SOURCES : null) || (node.id === COMBINED_SEWER_OVERFLOW_NODE_ID ? COMBINED_SEWER_OVERFLOW_NODE_SOURCES : null) || (node.id === CORAL_BLEACHING_NODE_ID ? CORAL_BLEACHING_NODE_SOURCES : null) || (node.id === SEMICONDUCTOR_FGAS_INDICATOR_ID ? SEMICONDUCTOR_FGAS_NODE_SOURCES : null) || (node.id === BLAST_FURNACE_SLAG_INDICATOR_ID ? BLAST_FURNACE_SLAG_NODE_SOURCES : null) || (node.id === ALPINE_SNOWPACK_NODE_ID ? ALPINE_SNOWPACK_NODE_SOURCES : null) || (node.id === MANURE_LAGOON_INDICATOR_ID ? MANURE_LAGOON_NODE_SOURCES : null) || (node.id === CATTLE_COMPACTION_NODE_ID ? CATTLE_COMPACTION_NODE_SOURCES : null) || (node.id === WATERBORNE_OUTBREAK_NODE_ID ? WATERBORNE_OUTBREAK_NODE_SOURCES : null) || (node.id === POLLINATOR_COLLAPSE_NODE_ID ? POLLINATOR_COLLAPSE_NODE_SOURCES : null) || (node.id === ACID_DEPOSITION_NODE_ID ? ACID_DEPOSITION_NODE_SOURCES : null) || (node.id === FOREST_DIEBACK_NODE_ID ? FOREST_DIEBACK_NODE_SOURCES : null) || (node.id === SOIL_MICROBIAL_NODE_ID ? SOIL_MICROBIAL_NODE_SOURCES : null) || (node.id === URBAN_WATER_RATIONING_NODE_ID ? URBAN_WATER_RATIONING_NODE_SOURCES : null) || (node.id === DEEPWATER_SPILL_NODE_ID ? DEEPWATER_SPILL_NODE_SOURCES : null) || (node.id === WILDFIRE_SMOKE_HEALTH_NODE_ID ? WILDFIRE_SMOKE_HEALTH_NODE_SOURCES : null) || (node.id === RESERVOIR_STORAGE_NODE_ID ? RESERVOIR_STORAGE_NODE_SOURCES : null) || (node.id === AIR_POLLUTION_HEALTH_NODE_ID ? AIR_POLLUTION_HEALTH_NODE_SOURCES : null) || (node.id === COASTAL_PERMAFROST_NODE_ID ? COASTAL_PERMAFROST_NODE_SOURCES : null) || (node.id === FRACKING_WASTEWATER_NODE_ID ? FRACKING_WASTEWATER_NODE_SOURCES : null) || (node.id === COASTAL_HYPOXIA_NODE_ID ? COASTAL_HYPOXIA_NODE_SOURCES : null) || (node.id === FREEZE_THAW_ROCK_NODE_ID ? FREEZE_THAW_ROCK_NODE_SOURCES : null) || (node.id === FJORD_SEDIMENTATION_NODE_ID ? FJORD_SEDIMENTATION_NODE_SOURCES : null) || (node.id === INLAND_WATERWAY_SPILL_NODE_ID ? INLAND_WATERWAY_SPILL_NODE_SOURCES : null) || (node.id === PALM_OIL_CLEARANCE_NODE_ID ? PALM_OIL_CLEARANCE_NODE_SOURCES : null) || RIVER_BARRIER_NODE_SOURCES[node.id] || null;
    const contractedNodeWithEvidence = rehabSources ? {
      ...contractedNode,
      source_urls: [...new Set([...(contractedNode.source_urls || []), ...rehabSources])],
      calibration: {
        ...(contractedNode.calibration || {}),
        source_status: 'node_specific_rehabilitation',
        source_urls: rehabSources,
        notes: 'Reviewed generated-node rehabilitation with node-specific assessment or primary sources.'
      }
    } : contractedNode;
    const nodeClass = classifyNode(contractedNodeWithEvidence);
    const requiredDrivers = nodeClass === NODE_CLASSES.PHENOMENON ? 3
      : nodeClass === NODE_CLASSES.OPERATIONAL_INDICATOR && EXOGENOUS_CLIMATE_MODE_INDICATOR_IDS.has(node.id) ? 0
        : nodeClass === NODE_CLASSES.OPERATIONAL_INDICATOR ? 1
        : 0;
    const driverCount = incoming.get(node.id) || 0;
    const qualifiedDriverCount = qualifiedIncoming.get(node.id) || 0;
    const dossierGateApplies = FULL_BACKLOG_PROMOTION_NODE_IDS.includes(node.id) || OPEN_BACKLOG_WAVE_ONE_NODE_IDS.includes(node.id) || DEGREE_TWO_PROMOTION_NODE_IDS.includes(node.id) || ONTOLOGY_PROMOTION_BATCH_TWO_NODE_IDS.includes(node.id) || ONTOLOGY_PROMOTION_NODE_IDS.includes(node.id) || CASCADE_ANCHOR_IDS.includes(node.id) || PROMOTED_EXPANSION_NODE_IDS.includes(node.id) || PRIORITY_ANCHOR_IDS.includes(node.id) || RESEARCH_BATCH_NODE_IDS.includes(node.id) || RESEARCH_BATCH_TWO_NODE_IDS.includes(node.id) || node.id === CARBON_MONOXIDE_INDICATOR_ID || node.id === INVASIVE_SPECIES_NODE_ID || node.id === JET_REHABILITATION_NODE_ID || node.id === NITROUS_OXIDE_REHABILITATION_NODE_ID || node.id === SULFUR_DIOXIDE_REHABILITATION_NODE_ID || node.id === RICE_METHANE_INDICATOR_ID || node.id === 'riverine_habitat_fragmentation' || node.id === 'humanitarian_resource_gaps' || node.id === COMBINED_SEWER_OVERFLOW_NODE_ID || node.id === CORAL_BLEACHING_NODE_ID || node.id === ALPINE_SNOWPACK_NODE_ID || node.id === CATTLE_COMPACTION_NODE_ID || node.id === WATERBORNE_OUTBREAK_NODE_ID || node.id === POLLINATOR_COLLAPSE_NODE_ID || node.id === ACID_DEPOSITION_NODE_ID || node.id === FOREST_DIEBACK_NODE_ID || node.id === SOIL_MICROBIAL_NODE_ID || node.id === URBAN_WATER_RATIONING_NODE_ID || node.id === DEEPWATER_SPILL_NODE_ID || node.id === WILDFIRE_SMOKE_HEALTH_NODE_ID || node.id === RESERVOIR_STORAGE_NODE_ID || node.id === AIR_POLLUTION_HEALTH_NODE_ID || node.id === RAIN_ON_SNOW_NODE_ID || node.id === SURFACE_STORAGE_NODE_ID || node.id === TALIK_EXPANSION_NODE_ID || node.id === COASTAL_PERMAFROST_NODE_ID || node.id === FRACKING_WASTEWATER_NODE_ID || node.id === COASTAL_HYPOXIA_NODE_ID || node.id === TUNDRA_SHRUBIFICATION_NODE_ID || node.id === FREEZE_THAW_ROCK_NODE_ID || node.id === FJORD_SEDIMENTATION_NODE_ID || node.id === INLAND_WATERWAY_SPILL_NODE_ID || node.id === PALM_OIL_CLEARANCE_NODE_ID;
    const gateDriverCount = dossierGateApplies ? qualifiedDriverCount : driverCount;
    const metricContract = NODE_METRIC_CONTRACTS[node.id] || null;
    const rehabilitated = FULL_BACKLOG_PROMOTION_NODE_IDS.includes(node.id) || OPEN_BACKLOG_WAVE_ONE_NODE_IDS.includes(node.id) || DEGREE_TWO_PROMOTION_NODE_IDS.includes(node.id) || ONTOLOGY_PROMOTION_BATCH_TWO_NODE_IDS.includes(node.id) || ONTOLOGY_PROMOTION_NODE_IDS.includes(node.id) || REHABILITATED_GENERATED_NODE_IDS.has(node.id) || RESEARCH_BATCH_NODE_IDS.includes(node.id) || RESEARCH_BATCH_TWO_NODE_IDS.includes(node.id) || node.id === CARBON_MONOXIDE_INDICATOR_ID || node.id === INVASIVE_SPECIES_NODE_ID || node.id === JET_REHABILITATION_NODE_ID || node.id === NITROUS_OXIDE_REHABILITATION_NODE_ID || node.id === SULFUR_DIOXIDE_REHABILITATION_NODE_ID || node.id === RICE_METHANE_INDICATOR_ID || node.id === COMBINED_SEWER_OVERFLOW_NODE_ID || node.id === CORAL_BLEACHING_NODE_ID || node.id === ALPINE_SNOWPACK_NODE_ID || node.id === CATTLE_COMPACTION_NODE_ID || node.id === WATERBORNE_OUTBREAK_NODE_ID || node.id === POLLINATOR_COLLAPSE_NODE_ID || node.id === ACID_DEPOSITION_NODE_ID || node.id === FOREST_DIEBACK_NODE_ID || node.id === SOIL_MICROBIAL_NODE_ID || node.id === URBAN_WATER_RATIONING_NODE_ID || node.id === DEEPWATER_SPILL_NODE_ID || node.id === WILDFIRE_SMOKE_HEALTH_NODE_ID || node.id === RESERVOIR_STORAGE_NODE_ID || node.id === AIR_POLLUTION_HEALTH_NODE_ID || node.id === RAIN_ON_SNOW_NODE_ID || node.id === SURFACE_STORAGE_NODE_ID || node.id === TALIK_EXPANSION_NODE_ID || node.id === COASTAL_PERMAFROST_NODE_ID || node.id === FRACKING_WASTEWATER_NODE_ID || node.id === COASTAL_HYPOXIA_NODE_ID || node.id === TUNDRA_SHRUBIFICATION_NODE_ID || node.id === FREEZE_THAW_ROCK_NODE_ID || node.id === FJORD_SEDIMENTATION_NODE_ID || node.id === INLAND_WATERWAY_SPILL_NODE_ID || node.id === PALM_OIL_CLEARANCE_NODE_ID;
    const rehabilitatedIndicator = rehabilitated && nodeClass === NODE_CLASSES.OPERATIONAL_INDICATOR;
    const governance = classifyLowDegreeGovernance({
      ...contractedNodeWithEvidence,
      ...(rehabilitated ? { authenticity: { ...(contractedNodeWithEvidence.authenticity || {}), status: 'rehabilitated_source_backed_phenomenon', exact_label_validated: true } } : {}),
      graph_contract: { ...(contractedNodeWithEvidence.graph_contract || {}), node_class: nodeClass }
    }, driverCount + (outgoing.get(node.id) || 0));
    return {
      ...contractedNodeWithEvidence,
      ...(OPEN_BACKLOG_WAVE_ONE_NAME_OVERRIDES[node.id] ? { name: OPEN_BACKLOG_WAVE_ONE_NAME_OVERRIDES[node.id] } : {}),
      ...(FULL_BACKLOG_NAME_OVERRIDES[node.id] ? { name: FULL_BACKLOG_NAME_OVERRIDES[node.id] } : {}),
      ...(metricContract ? { metric_contract: metricContract } : {}),
      ...(rehabilitated ? {
        authenticity: {
          status: rehabilitatedIndicator ? 'rehabilitated_source_backed_indicator' : 'rehabilitated_source_backed_phenomenon',
          label: rehabilitatedIndicator ? 'Rehabilitated source-backed indicator' : 'Rehabilitated source-backed phenomenon',
          exact_label_validated: true,
          source_scope: 'node_specific',
          anchor_id: null,
          note: rehabilitatedIndicator
            ? 'This previously generated indicator now has a reviewed measurement contract, at least three bounded relationships, and node-specific authoritative sources.'
            : 'This previously generated node now has a reviewed multi-driver contract, a bounded downstream effect, and node-specific assessment sources.'
        }
      } : {}),
      graph_contract: {
        version: 'northstar_graph_contract_v1',
        node_class: nodeClass,
        driver_gate: {
          applicable: requiredDrivers > 0,
          required_incoming_drivers: requiredDrivers,
          observed_incoming_drivers: driverCount,
          qualified_incoming_drivers: qualifiedDriverCount,
          qualification_basis: dossierGateApplies
            ? 'complete_promoted_edge_dossiers'
            : 'topology_with_relationship_contract',
          status: requiredDrivers === 0 ? 'exempt' : gateDriverCount >= requiredDrivers ? 'pass' : 'research_track'
        },
        observed_outgoing_effects: outgoing.get(node.id) || 0,
        metric_contract_status: metricContract ? 'defined' : 'missing',
        ...governance
      }
    };
  });
  return { nodes: contractedNodes, edges };
}
