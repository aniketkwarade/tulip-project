const METRIC_FIELDS = Object.freeze({
  food_insecurity: {
    metric_id: 'food_insecurity_prevalence_fies',
    metric_name: 'Prevalence of moderate or severe food insecurity',
    unit: 'percent of population',
    geography: 'country, region, and global',
    cadence: 'annual',
    observation_time_field: 'year',
    source_id: 'unsd_sdg_api',
    ingestion_job_id: 'fetch_food_insecurity_fies',
    snapshot_file: 'food-security-snapshot.json',
    transformation: 'Retain provider estimates and uncertainty; do not combine food insecurity with biological undernutrition outcomes.',
    uncertainty: 'Survey and model uncertainty varies by country and release; the provider may revise historical estimates.',
    threshold_provenance: 'FAO SDG 2.1.2 reporting and SDG target framing; no ad hoc percentile threshold.',
    failure_behavior: 'Freeze the last reviewed release, mark stale, and never interpret a missing country-year as zero.'
  },
  nutrient_pollution: {
    metric_id: 'surface_water_total_nutrient_concentration',
    metric_name: 'Surface-water total nitrogen or total phosphorus concentration',
    unit: 'milligrams per liter, tonnes per year, annual resource cost, and affected-system count reported separately',
    geography: 'monitoring site or watershed for concentrations; worldwide UNEP assessment boundary for accumulated impact',
    cadence: 'monthly monitoring snapshot with annual summaries and global assessment reviews',
    observation_time_field: 'sampleDate',
    source_id: 'unep_global_nutrient_pollution_impact',
    ingestion_job_id: 'fetch_nutrient_pollution_samples',
    snapshot_file: 'nutrient-pollution-snapshot.json',
    transformation: 'Normalize analyte, fraction, method, units, and QA flags before watershed aggregation; for global impact retain reactive-nitrogen loss, cost, eutrophication inventories and time boundaries separately.',
    uncertainty: 'Site coverage, method changes, detection limits and sampling frequency affect concentration trends; global nitrogen budgets combine multiple pathways and coastal inventories are monitoring-dependent lower bounds.',
    threshold_provenance: 'Jurisdiction-specific nutrient criteria for local observations and UNEP Global Partnership on Nutrient Management assessments for global accumulated impact.',
    failure_behavior: 'Withhold local aggregation when method or site coverage is insufficient; retain the last reviewed global assessment and never extrapolate a US concentration, convert site count to area, or allocate a global cost to one watershed.'
  },
  seagrass_meadow_decline: {
    metric_id: 'seagrass_meadow_area_change',
    metric_name: 'Mapped seagrass meadow area change from baseline',
    unit: 'square kilometers or percent change',
    geography: 'mapped meadow, coast, or country',
    cadence: 'episodic authoritative snapshot',
    observation_time_field: 'mapping_period_end',
    source_id: 'obis_api_v3',
    ingestion_job_id: 'fetch_seagrass_support',
    snapshot_file: 'seagrass-support-snapshot.json',
    measurement_role: 'supporting_occurrence_evidence_only',
    transformation: 'Use curated habitat polygons for area change; use OBIS occurrences only for supporting QA and never as evidence of absence.',
    uncertainty: 'Mapping era, classification method, seasonal cover, and incomplete remapping limit comparability.',
    threshold_provenance: 'Persistent decline across at least two comparable mapping periods; no occurrence-only threshold.',
    failure_behavior: 'Do not update area change from raw occurrences; retain the prior polygon snapshot with its mapping uncertainty.'
  },
  urban_heat_island: {
    metric_id: 'urban_heat_island_intensity_degC',
    metric_name: 'Urban heat island intensity',
    unit: 'degrees Celsius urban-minus-reference temperature',
    geography: 'city or harmonized raster footprint',
    cadence: 'seasonal or annual derived snapshot',
    observation_time_field: 'observation_period_end',
    source_id: 'eea_urban_heat_island_arcgis',
    ingestion_job_id: 'fetch_urban_heat_island_eea',
    snapshot_file: 'urban-heat-island-snapshot.json',
    transformation: 'Keep surface and canopy-layer UHI separate; retain urban footprint, rural reference, day/night, season, and sensor or model version.',
    uncertainty: 'Urban-boundary choice, elevation, morphology, weather, land-cover change, and retrieval method affect comparability.',
    threshold_provenance: 'Provider-defined urban-minus-reference method and health-relevance literature; no arbitrary global percentile.',
    failure_behavior: 'Freeze the prior value when footprint or processing changes cannot be back-cast.'
  },
  occupational_heat_exposure: {
    metric_id: 'heat_related_working_hour_loss',
    metric_name: 'Potential working hours lost due to heat exposure',
    unit: 'hours or percent of potential working hours',
    geography: 'country',
    cadence: 'annual',
    observation_time_field: 'year',
    source_id: 'lancet_countdown_data_explorer',
    transformation: 'Retain modeled meteorology, labor-sector composition, work intensity, and revision version; do not treat modeled capacity loss as observed absence from work.',
    uncertainty: 'Highly dependent on exposure assumptions, sector mix, work-rest behavior, acclimatization, and model version.',
    threshold_provenance: 'Provider method and ILO occupational-heat framing; descriptive trend only until a universal threshold is justified.',
    failure_behavior: 'Keep the last reviewed series and mark a methodology break instead of silently recalculating graph history.'
  }
});

const decision = ({
  original_id,
  original_name,
  canonical_id,
  canonical_name,
  decision_type,
  priority,
  sphere,
  evidence_strength,
  ontology_reason,
  repository_readback,
  drivers = [],
  effects = [],
  sources = [],
  largest_uncertainty,
  metric = null,
  follow_up = null
}) => Object.freeze({
  original_id,
  original_name,
  canonical_id,
  canonical_name,
  decision_type,
  priority,
  sphere,
  evidence_strength,
  ontology_reason,
  repository_readback,
  proposed_driver_ids: Object.freeze(drivers),
  proposed_effect_ids: Object.freeze(effects),
  official_sources: Object.freeze(sources),
  largest_uncertainty,
  staged_metric_contract: metric,
  follow_up,
  research_artifact: 'deep-research-report (12).md',
  research_access_date: '2026-07-17'
});

export const PHENOMENON_EXPANSION_DECISIONS = Object.freeze([
  decision({
    original_id: 'food_insecurity_undernutrition',
    original_name: 'Food Insecurity and Undernutrition',
    canonical_id: 'food_insecurity',
    canonical_name: 'Food Insecurity',
    decision_type: 'stage_new_after_split',
    priority: 1,
    sphere: 'health',
    evidence_strength: 'verified_bounded',
    ontology_reason: 'Food insecurity is an access-and-experience construct; undernutrition is a separate biological health outcome and must not be collapsed into the same node.',
    repository_readback: 'Neither food_insecurity nor undernutrition_burden exists in the live export. The report assumption that food_insecurity already exists was rejected after live readback.',
    drivers: ['crop_yield_volatility', 'food_import_exposure', 'staple_food_price_volatility', 'conflict_risk_escalation', 'drought_persistence'],
    effects: ['migration', 'public_health_heat_burden', 'agricultural_labor_exposure'],
    sources: [
      'https://www.fao.org/sustainable-development-goals-data-portal/data/indicators/212-prevalence-of-moderate-or-severe-food-insecurity-in-the-population-based-on-the-food-insecurity-experience-scale/en',
      'https://www.who.int/teams/nutrition-and-food-safety/monitoring-nutritional-status-and-food-safety-and-events/joint-child-malnutrition-estimates'
    ],
    largest_uncertainty: 'Conflict, affordability, climate hazards, public support, and household vulnerability make attribution strongly context dependent.',
    metric: METRIC_FIELDS.food_insecurity,
    follow_up: 'Stage food_insecurity only. Keep undernutrition_burden deferred until its distinct health-state edges and double-counting rules are approved.'
  }),
  decision({
    original_id: 'climate_mental_health_burden',
    original_name: 'Climate-Related Mental Health Burden',
    canonical_id: 'climate_related_mental_health_burden',
    canonical_name: 'Climate-Related Mental Health Burden',
    decision_type: 'defer_measurement_gap',
    priority: 6,
    sphere: 'health',
    evidence_strength: 'supported_but_bounded',
    ontology_reason: 'The phenomenon is credible, but a broad global node blends acute disaster outcomes, chronic stress, displacement, and policy-capacity indicators.',
    repository_readback: 'No exact live node exists; overlap remains with disaster, displacement, heat-health, and health-system pathways.',
    drivers: ['migration', 'disaster_recovery_inequality', 'heat_related_mortality_burden', 'wildfire_regime_shift', 'insurance_retreat'],
    effects: ['health_system_climate_resilience_gap'],
    sources: [
      'https://www.who.int/news/item/03-06-2022-why-mental-health-is-a-priority-for-action-on-climate-change',
      'https://www.who.int/news-room/fact-sheets/detail/mental-health-and-climate-change-policy-brief'
    ],
    largest_uncertainty: 'No standardized global climate-attributable mental-health burden series or production-grade observation API.',
    follow_up: 'Revisit narrower disaster-related or heat-related mental-health outcome nodes.'
  }),
  decision({
    original_id: 'heat_labor_productivity_loss',
    original_name: 'Heat-Related Labor Productivity Loss',
    canonical_id: 'occupational_heat_exposure',
    canonical_name: 'Occupational Heat Exposure',
    decision_type: 'merge_metric_into_existing',
    priority: 2,
    sphere: 'health',
    evidence_strength: 'verified_bounded',
    ontology_reason: 'Working-hour and earnings loss are operational consequences of occupational heat exposure, not a distinct phenomenon anchor.',
    repository_readback: 'occupational_heat_exposure exists in the live export and already represents reduced safe work capacity.',
    drivers: ['wet_bulb_heat', 'compound_day_night_heat_extremes', 'cooling_equity_gaps'],
    effects: ['food_import_exposure', 'adaptation_capital_shortfall', 'disaster_recovery_inequality'],
    sources: [
      'https://www.ilo.org/publications/heat-work-implications-safety-and-health',
      'https://lancetcountdown.org/explore-our-data/'
    ],
    largest_uncertainty: 'The strongest global series is modeled and sensitive to labor-sector and work-rest assumptions.',
    metric: METRIC_FIELDS.occupational_heat_exposure,
    follow_up: 'Implement the metric contract on occupational_heat_exposure without adding a second node.'
  }),
  decision({
    original_id: 'nutrient_pollution_biogeochemical_disruption',
    original_name: 'Nutrient Pollution and Biogeochemical Flow Disruption',
    canonical_id: 'nutrient_pollution',
    canonical_name: 'Nutrient Pollution',
    decision_type: 'stage_new_after_narrowing',
    priority: 3,
    sphere: 'freshwater',
    evidence_strength: 'supported_but_bounded',
    ontology_reason: 'Nutrient pollution is a measurable environmental state; biogeochemical-flow disruption is an umbrella framework spanning pressures, transport, state, and boundary exceedance.',
    repository_readback: 'No exact live node exists. Runoff, wastewater, eutrophication, algal-bloom, and hypoxia endpoints already provide a clean graph neighborhood.',
    drivers: ['fertilizer_production', 'nitrogen_fertilizer_runoff', 'wastewater_bypass_discharge', 'industry_farming'],
    effects: ['estuary_eutrophication', 'harmful_algal_blooms', 'coastal_hypoxia', 'freshwater_ecosystem_collapse'],
    sources: [
      'https://www.epa.gov/nutrientpollution/basic-information-nutrient-pollution',
      'https://www.epa.gov/nutrientpollution/sources-and-solutions',
      'https://api.waterdata.usgs.gov/docs/'
    ],
    largest_uncertainty: 'No single globally harmonized nutrient-observation API; methods and site coverage vary strongly.',
    metric: METRIC_FIELDS.nutrient_pollution,
    follow_up: 'Stage with US-only measurement scope first; require separate relationship dossiers before live promotion.'
  }),
  decision({
    original_id: 'toxic_chemical_novel_entity_pressure',
    original_name: 'Toxic Chemical Pressure and Novel Entities',
    canonical_id: null,
    canonical_name: null,
    decision_type: 'reject_composite',
    priority: 10,
    sphere: 'biosphere',
    evidence_strength: 'data_limited',
    ontology_reason: 'The label combines releases, occurrence, exposure, hazard, persistence, and regulatory status without a defensible common unit or weighting rule.',
    repository_readback: 'Several narrower chemical, plastics, pesticide, and contamination nodes exist; the umbrella would obscure rather than repair those pathways.',
    drivers: ['plastics_petrochemicals', 'pesticide_bioaccumulation_chains', 'e_waste_lead_soil_bleeding', 'industrial_solvent_vapors'],
    effects: ['freshwater_ecosystem_collapse', 'marine_food_web_simplification', 'air_pollution_health_burden', 'biodiversity_intactness_loss'],
    sources: [
      'https://www.epa.gov/comptox-tools/computational-toxicology-and-exposure-apis',
      'https://www.stockholmresilience.org/research/planetary-boundaries.html'
    ],
    largest_uncertainty: 'No scientifically stable aggregate metric across heterogeneous substances and hazard dimensions.',
    follow_up: 'Research narrower daughters such as toxic_chemical_releases, PFAS contamination, or plastic pollution.'
  }),
  decision({
    original_id: 'seagrass_meadow_decline',
    original_name: 'Seagrass Meadow Decline',
    canonical_id: 'seagrass_meadow_decline',
    canonical_name: 'Seagrass Meadow Decline',
    decision_type: 'stage_new',
    priority: 4,
    sphere: 'oceans',
    evidence_strength: 'supported_but_bounded',
    ontology_reason: 'Seagrass is a distinct habitat state with specific carbon, nursery, water-quality, and shoreline functions.',
    repository_readback: 'No exact live node exists. It is distinct from coral, mangrove, saltmarsh, kelp, and generic blue-carbon loss nodes.',
    drivers: ['marine_heatwaves', 'estuary_eutrophication', 'coastal_erosion', 'ocean_acidification'],
    effects: ['blue_carbon_habitat_loss', 'marine_food_web_simplification', 'fish_landing_supply_disruption', 'coastal_hypoxia'],
    sources: [
      'https://www.unep.org/topics/ocean-seas-and-coasts/blue-ecosystems/seagrass-meadows',
      'https://www.unep.org/news-and-stories/press-release/protection-seagrasses-key-building-resilience-climate-change',
      'https://api.obis.org/'
    ],
    largest_uncertainty: 'Comparable global area-change baselines are episodic and sensitive to mapping era and method.',
    metric: METRIC_FIELDS.seagrass_meadow_decline,
    follow_up: 'Stage snapshot-first. OBIS may support QA but must not drive area-loss scoring from presence-only records.'
  }),
  decision({
    original_id: 'freshwater_biodiversity_decline',
    original_name: 'Freshwater Biodiversity Decline',
    canonical_id: 'freshwater_biodiversity_decline',
    canonical_name: 'Freshwater Biodiversity Decline',
    decision_type: 'defer_measurement_gap',
    priority: 7,
    sphere: 'freshwater',
    evidence_strength: 'supported_but_bounded',
    ontology_reason: 'The state is distinct and important, but occurrence records alone cannot establish absence or decline.',
    repository_readback: 'No exact live node exists; the graph already contains several drivers and broader biodiversity outcomes.',
    drivers: ['river_flow_regime_shift', 'riverine_habitat_fragmentation', 'water_stress', 'invasive_species_encroachment', 'wastewater_bypass_discharge'],
    effects: ['freshwater_ecosystem_collapse', 'fishery_protein_dependence', 'biodiversity_intactness_loss'],
    sources: ['https://www.gbif.org/developer/occurrence', 'https://www.iucnredlist.org/assessment/freshwater'],
    largest_uncertainty: 'No stable, open, freshwater-specific global decline metric with adequate historical and taxonomic coverage.',
    follow_up: 'Require a population, occupancy, or extinction-risk backbone rather than raw presence records.'
  }),
  decision({
    original_id: 'urban_heat_island_intensity',
    original_name: 'Urban Heat Island Intensity',
    canonical_id: 'urban_heat_island',
    canonical_name: 'Urban Heat Island',
    decision_type: 'stage_new_after_metric_normalization',
    priority: 5,
    sphere: 'atmosphere',
    evidence_strength: 'verified_bounded',
    ontology_reason: 'Urban heat island is the phenomenon; intensity in degrees Celsius is its primary metric, not a second node.',
    repository_readback: 'urban_heat_island does not exist in the live export. urban_heat_dome_stagnation is not an ontology duplicate, so the report merge assumption was rejected.',
    drivers: ['urban_tree_canopy_loss', 'urban_sprawl_housing', 'asphalt_pavement_heat_absorbers', 'urbanization'],
    effects: ['public_health_heat_burden', 'heat_related_mortality_burden', 'grid_peak_load_stress', 'cooling_equity_gaps'],
    sources: [
      'https://sdi.eea.europa.eu/catalogue/srv/api/records/8b6a3182-0889-4109-ad22-a021e3126b60',
      'https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature'
    ],
    largest_uncertainty: 'A globally comparable series requires a fixed urban footprint, rural reference, retrieval method, and day/night definition.',
    metric: METRIC_FIELDS.urban_heat_island,
    follow_up: 'Stage the phenomenon with intensity as its metric; do not conflate it with urban heat dome stagnation.'
  }),
  decision({
    original_id: 'crop_nutrient_density_decline',
    original_name: 'Crop Nutrient-Density Decline',
    canonical_id: 'co2_related_crop_nutrient_dilution',
    canonical_name: 'CO2-Related Crop Nutrient Dilution',
    decision_type: 'defer_and_narrow',
    priority: 9,
    sphere: 'agriculture',
    evidence_strength: 'supported_but_bounded',
    ontology_reason: 'The strongest evidence is specific to elevated-CO2 effects on particular nutrients and crop groups, not a universal historical crop-quality decline.',
    repository_readback: 'No exact live node exists; broader food, soil, yield, and nutrition pathways would create double-counting risk.',
    drivers: ['carbon_emission', 'soil_humus_decline'],
    effects: ['food_import_exposure'],
    sources: ['https://fdc.nal.usda.gov/api-guide', 'https://pubmed.ncbi.nlm.nih.gov/24805231/'],
    largest_uncertainty: 'Cultivar, soil, management, assay method, and food-composition database structure confound historical trend inference.',
    follow_up: 'Keep research-only until a crop-specific, method-harmonized observation contract exists.'
  }),
  decision({
    original_id: 'climate_aeroallergen_burden',
    original_name: 'Climate-Sensitive Aeroallergen Burden',
    canonical_id: 'climate_sensitive_aeroallergen_burden',
    canonical_name: 'Climate-Sensitive Aeroallergen Burden',
    decision_type: 'defer_regional_monitoring_only',
    priority: 8,
    sphere: 'health',
    evidence_strength: 'supported_but_bounded',
    ontology_reason: 'The phenomenon is real, but current open machine-readable coverage supports selected regional monitoring rather than a global burden anchor.',
    repository_readback: 'No exact live node exists; overlap with pollen exposure, asthma, and air-pollution burden requires a narrower boundary.',
    drivers: ['temp', 'carbon_emission', 'humidity_amplification'],
    effects: ['air_pollution_health_burden', 'health_system_climate_resilience_gap'],
    sources: ['https://www.epa.gov/climate-indicators/climate-change-indicators-ragweed-pollen-season', 'https://ads.atmosphere.copernicus.eu/'],
    largest_uncertainty: 'Global observation coverage, taxon comparability, and open station access remain weak.',
    follow_up: 'Allow bounded regional monitoring contracts but no global graph score.'
  })
]);

export const IMPLEMENTED_EXPANSION_METRIC_CONTRACTS = Object.freeze({
  occupational_heat_exposure: METRIC_FIELDS.occupational_heat_exposure,
  food_insecurity: METRIC_FIELDS.food_insecurity,
  nutrient_pollution: METRIC_FIELDS.nutrient_pollution,
  seagrass_meadow_decline: METRIC_FIELDS.seagrass_meadow_decline,
  urban_heat_island: METRIC_FIELDS.urban_heat_island
});

export const STAGED_EXPANSION_CANDIDATES = Object.freeze(
  PHENOMENON_EXPANSION_DECISIONS.filter(item => item.decision_type.startsWith('stage_new'))
);

export const REJECTED_COMPOSITE_CANDIDATE_IDS = new Set(
  PHENOMENON_EXPANSION_DECISIONS
    .filter(item => item.decision_type === 'reject_composite')
    .map(item => item.original_id)
);
