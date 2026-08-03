const reviewedMetadataDecision = (decision, rationale, evidenceBoundary) => Object.freeze({
  decision,
  rationale,
  reviewed_at: '2026-07-18',
  reviewer: 'northstar_metadata_context_review_v1',
  source_locators: [],
  evidence_boundary: evidenceBoundary
});

const reviewedRejectionBatch = (keys, decision, rationale, evidenceBoundary) => Object.freeze(Object.fromEntries(
  keys.map(key => {
    const doi = key.split('::')[1];
    return [key, Object.freeze({
      ...reviewedMetadataDecision(decision, rationale, evidenceBoundary),
      source_locators: Object.freeze([{ url: `https://doi.org/${doi}`, locator: 'Bibliographic record, title, and available abstract/context used to reject endpoint entailment; not used as positive relationship evidence.' }])
    })];
  })
));

const reviewedSourceRejectionBatch = (keys, decision, rationale, evidenceBoundary, locator) => Object.freeze(Object.fromEntries(
  keys.map(key => {
    const doi = key.split('::')[1];
    return [key, Object.freeze({
      decision,
      rationale,
      reviewed_at: '2026-07-19',
      reviewer: 'northstar_source_text_adjudication_v1',
      source_locators: Object.freeze([{ url: `https://doi.org/${doi}`, locator }]),
      evidence_boundary: evidenceBoundary
    })];
  })
));

const july25ReviewedRejectionBatch = (keys, decision, rationale, evidenceBoundary, locator) => Object.freeze(Object.fromEntries(
  keys.map(key => {
    const doi = key.split('::')[1];
    return [key, Object.freeze({
      decision,
      rationale,
      reviewed_at: '2026-07-25',
      reviewer: 'northstar_corrected_crossref_adjudication_v1',
      source_locators: Object.freeze([{
        url: `https://doi.org/${doi}`,
        locator: locator || 'Bibliographic title and available publisher abstract or source context reviewed for endpoint identity and direction; rejected work is not used as positive relationship evidence.'
      }]),
      evidence_boundary: evidenceBoundary
    })];
  })
));

const CURRENT_CROSSREF_REJECTIONS = Object.freeze({
  ...reviewedRejectionBatch([
    'ice_sheet_mass_loss->glacier_calving_events::10.3390/w17030432'
  ], 'reject_mountain_glacier_loss_as_ice_sheet_calving_evidence',
  'The forty-year field study documents mass-balance, area, thickness, movement cessation and runoff change for Ice Worm Glacier, a small alpine cirque glacier in Washington. It does not study the Greenland or Antarctic ice sheets and reports glacier disappearance rather than calving-event frequency or flux.',
  'Rejected for ice_sheet_mass_loss->glacier_calving_events after full-text readback. Preserve as node-specific evidence for small-mountain-glacier mass loss and runoff decline; it cannot support an ice-sheet-to-calving directed edge.'),
  ...reviewedRejectionBatch([
    'urbanization->resource_depletion::10.2139/ssrn.5149186',
    'urbanization->resource_depletion::10.1111/nrm.70003',
    'urbanization->resource_depletion::10.3390/su18041930'
  ], 'reject_joint_predictors_or_correction_as_directed_depletion_evidence',
  'The records model urbanization and resource or mineral depletion as parallel explanatory variables for environmental quality, or are a correction notice. They do not estimate urbanization as the upstream cause of a named physical stock depletion.',
  'Rejected for urbanization->resource_depletion. A defensible edge requires a named material, water, land or ecosystem stock; an urban activity or expansion exposure; mass-flow or stock-change units; geography; period; and an identified direction rather than co-occurring regression terms.'),
  ...reviewedRejectionBatch([
    'environ_anomalies->food::10.1007/s40808-025-02347-6'
  ], 'reject_climate_model_input_and_agricultural_water_demand_as_food_endpoint',
  'The paper uses climate-model output to forecast agricultural water demand in one river basin. Agricultural water demand is not the platform Food outcome, and the broad Environmental Anomalies node is not an identified exposure.',
  'Rejected for the queued broad edge. It may inform a basin-specific climate-to-irrigation-demand relationship after exact variable, scenario, crop, water-demand, model-validation and uncertainty readback.'),
  ...reviewedRejectionBatch([
    'environ_anomalies->urbanization::10.1007/s12665-025-12780-6',
    'environ_anomalies->urbanization::10.1038/s43247-025-02048-z'
  ], 'reject_parallel_or_reverse_driver_direction_for_anomalies_to_urbanization',
  'The studies treat urbanization and climate variability as parallel drivers of groundwater dynamics or compare climate-change and urbanization effects on cyclone rainfall. Neither tests environmental anomalies as a cause of urbanization.',
  'Rejected for environ_anomalies->urbanization. Groundwater response and cyclone rainfall are different outcomes, and a migration or settlement-growth pathway would require population, land-conversion, hazard, lag and alternative economic-driver evidence.'),
  ...reviewedRejectionBatch([
    'ice_sheet_mass_loss->talik_expansion::10.55248/gengpi.06.1225.4203'
  ], 'reject_materials_science_mass_loss_and_thermal_expansion_polysemy',
  'The record concerns thermal expansion and mass-loss analysis of glauconite-based aluminosilicate composites. It does not study ice sheets, permafrost or taliks.',
  'Rejected as complete endpoint polysemy and prohibited from cryosphere evidence.'),
  ...reviewedRejectionBatch([
    'resource_depletion->pollinator_colony_collapse::10.3390/systems13090727',
    'resource_depletion->pollinator_colony_collapse::10.32473/ufjur.27.138776'
  ], 'reject_societal_collapse_or_medical_colony_polysemy',
  'One paper models societal collapse and broad resource dynamics; the other studies neutrophil depletion and granulocyte-colony stimulating factor. Neither measures pollinator colonies.',
  'Rejected as endpoint polysemy. Societal collapse and medical colony-stimulating factors cannot support a pollinator relationship.'),
  ...reviewedRejectionBatch([
    'resource_depletion->pollinator_colony_collapse::10.1111/1365-2664.70229'
  ], 'reject_resource_supplementation_intervention_as_broad_depletion_edge',
  'The bumblebee study evaluates resource supplementation later in the colony cycle. That intervention is relevant to floral-resource limitation, but does not identify the platform-wide Resource Depletion node as the exposure.',
  'Rejected only for the broad resource_depletion->pollinator_colony_collapse edge. Preserve for a narrower floral-resource-availability or supplementation-to-bumblebee-survival relationship with species, colony stage, landscape, treatment, comparator and survival interval retained.'),
  ...reviewedRejectionBatch([
    'mangrove_buffer_loss->marine_heatwaves::10.61511/mangrove.v2i1.2025.2383'
  ], 'reject_restoration_intervention_and_resilience_context_as_heatwave_causation',
  'The record concerns community mangrove restoration using marine debris as a medium for ecological and socioeconomic resilience. It does not show mangrove buffer loss causing marine heatwaves.',
  'Rejected for the queued direction. Mangrove restoration, debris reuse and resilience belong to response evidence; marine heatwaves are ocean-climate hazards not generated by loss of one local buffer.'),
  ...reviewedRejectionBatch([
    'wastewater_bypass_discharge->fracking_wastewater_lakes::10.29261/pakvetj/2026.042',
    'wastewater_bypass_discharge->fracking_wastewater_lakes::10.3390/membranes15020064',
    'wastewater_bypass_discharge->fracking_wastewater_lakes::10.32846/2306-9716/2025.eco.2-59.10'
  ], 'reject_livestock_or_treatment_technology_as_fracking_lake_formation',
  'The records concern livestock wastewater effects or zero/minimal liquid-discharge treatment technologies. They do not measure municipal bypass discharge as a driver of fracking wastewater impoundments.',
  'Rejected for both endpoint and mechanism mismatch. Livestock effluent, industrial treatment systems, municipal bypass events and oil-and-gas wastewater impoundments require separate nodes and source-native measurements.'),
  ...reviewedRejectionBatch([
    'critical_mineral_extraction_pressure->fracking_wastewater_lakes::10.3390/min15030213',
    'critical_mineral_extraction_pressure->fracking_wastewater_lakes::10.1007/s42461-026-01655-4'
  ], 'reject_mineral_recovery_or_flotation_method_as_extraction_to_impoundment_edge',
  'The papers evaluate critical-mineral recovery from energy wastewater or compare mineral-processing and wastewater-treatment flotation. They do not show critical-mineral extraction pressure creating fracking wastewater lakes.',
  'Rejected for the queued direction. Recovery from an existing waste stream is not evidence that mineral demand caused the waste impoundment; a valid supply-chain edge requires extraction activity, produced-water volume, disposal pathway, facility geography and time.'),
  ...reviewedRejectionBatch([
    'carbon_emission->nitrous_oxide::10.1016/j.biortech.2025.132127',
    'carbon_emission->nitrous_oxide::10.1088/1748-9326/ae1e92',
    'carbon_emission->nitrous_oxide::10.1016/j.biortech.2026.134332'
  ], 'reject_carbon_source_or_mitigation_process_as_carbon_emissions_to_nitrous_oxide',
  'The studies concern compost aeration, dissolved organic carbon and nitrate in lakes, or denitrification-anammox treatment intended to reduce nitrous oxide. Carbon source is a chemical substrate or process variable, not the platform Carbon Emissions node.',
  'Rejected as exposure and direction mismatch. A carbon-substrate-to-N2O process relationship must preserve reactor or lake chemistry and cannot be generalized to anthropogenic carbon emissions.'),
  ...reviewedRejectionBatch([
    'ocean_acidification->phytoplankton_decline::10.1016/j.marenvres.2025.107352'
  ], 'reject_combined_stressor_nonmonotonic_response_as_acidification_only_decline',
  'The mesocosm combines elevated pCO2 and warming. Reported community biomass initially increased under warming, acidification and the combined treatment, then fell below the control later, so the available study context does not isolate acidification as a monotonic phytoplankton-decline exposure.',
  'Rejected for the broad directed edge. Preserve as a Southern East China Sea combined-warming-and-acidification community-succession candidate with pCO2, temperature, nutrients, mesocosm duration, taxonomic composition and time-varying biomass retained.'),
  ...reviewedRejectionBatch([
    'ocean_acidification->phytoplankton_decline::10.1016/j.scitotenv.2026.181671'
  ], 'reject_chiton_life_stage_endpoint_as_phytoplankton_evidence',
  'The study endpoint is adult and larval chiton demography, not phytoplankton abundance, productivity or community structure.',
  'Rejected for target mismatch; it may support a species- and life-stage-bounded ocean-acidification-to-chiton-demography relationship.'),
  ...reviewedRejectionBatch([
    'ocean_acidification->phytoplankton_decline::10.1016/j.marenvres.2025.107419'
  ], 'reject_corrigendum_as_independent_relationship_evidence',
  'This is a corrigendum to the combined-stressor mesocosm paper and supplies no independent replication or new directed effect estimate.',
  'Rejected as an independent missing-link source. Corrections must remain attached to the original paper provenance but cannot count as corroboration.'),
  ...reviewedRejectionBatch([
    'carbon_emission->resource_depletion::10.1007/s10668-025-06859-0',
    'carbon_emission->resource_depletion::10.3390/su17062749',
    'carbon_emission->resource_depletion::10.1016/j.enpol.2026.115131',
    'resource_depletion->carbon_emission::10.1007/s10668-025-06859-0',
    'resource_depletion->carbon_emission::10.3390/su17062749',
    'resource_depletion->carbon_emission::10.1016/j.enpol.2026.115131'
  ], 'reject_resource_policy_polysemy_and_endpoint_mismatch',
  'These records concern economic resource misallocation, carbon-pricing instruments, or tax design. They do not measure the platform ecological Resource Depletion endpoint or establish either queued causal direction.',
  'Rejected for both directed pairs. Economic allocation efficiency and policy instruments must not be treated as physical material, water, soil, or ecosystem depletion.'),
  ...reviewedRejectionBatch([
    'personal_conveyance->carbon_emission::10.1007/s10668-026-07915-z',
    'personal_conveyance->carbon_emission::10.2166/wcc.2026.056',
    'carbon_emission->personal_conveyance::10.1007/s10668-026-07915-z',
    'carbon_emission->personal_conveyance::10.2166/wcc.2026.056'
  ], 'reject_conveyance_polysemy_and_endpoint_mismatch',
  'One record concerns personal carbon trading and the other water conveyance. Neither uses personal passenger transport as the exposure or outcome represented by the platform Personal Conveyance node.',
  'Rejected for both directions; carbon-market participation and desalinated-water conveyance require different ontology nodes.'),
  ...reviewedRejectionBatch([
    'temp->urbanization::10.1016/j.crsust.2025.100315',
    'temp->urbanization::10.1038/s41467-026-75457-z',
    'temp->deforestation::10.1007/s00376-024-4149-z'
  ], 'reject_reverse_mechanism_direction',
  'The study framing runs from urbanization or deforestation to temperature outcomes. It does not identify global temperature as the upstream cause of urbanization or deforestation.',
  'Rejected for the queued directions. Any reverse relationship must retain its own scale, temperature variable, mechanism, and effect estimate.'),
  ...reviewedRejectionBatch([
    'temp->industry_farming::10.64388/irev9i3-1710768-3996'
  ], 'reject_sensor_temperature_polysemy',
  'The record describes an IoT temperature-monitoring system for piggery operations; ambient sensor temperature is not the Global Temperature node and the paper does not estimate warming as a driver of industrial farming.',
  'Rejected as a sensor/application title match rather than relationship-specific evidence.'),
  ...reviewedRejectionBatch([
    'grid_peak_load_stress->wet_bulb_heat::10.1007/s00484-025-03112-1',
    'grid_peak_load_stress->wet_bulb_heat::10.34172/ehem.1541',
    'grid_peak_load_stress->wet_bulb_heat::10.1002/joc.8797'
  ], 'reject_heat_metric_endpoint_mismatch',
  'These papers measure human or regional wet-bulb heat stress. They do not test electrical grid peak-load stress as an upstream cause of wet-bulb heat.',
  'Rejected for the queued direction; co-occurring cooling demand and heat exposure do not make grid load a meteorological driver.'),
  ...reviewedRejectionBatch([
    'sea_ice_season_loss->amoc::10.1029/2025jc023767',
    'sea_ice_season_loss->amoc::10.1038/s43247-026-03811-6'
  ], 'reject_parameterization_or_predictive_association_not_exact_edge',
  'One study changes a sea-ice-enhanced model parameterization and examines AMOC simulation; the other reports prediction skill and linkage between Atlantic Arctic sea ice and AMOC variability. Neither isolates seasonal sea-ice loss as the causal exposure represented by the queued edge.',
  'Rejected for direct promotion. A future coupled-variability edge would require full methods readback, explicit lag direction, confounder treatment, and a bounded Atlantic-sector metric.'),
  ...reviewedRejectionBatch([
    'data_centers->carbon_emission::10.33425/3066-1226.1148',
    'data_centers->carbon_emission::10.1049/icp.2025.0664',
    'data_centers->carbon_emission::10.23919/ien.2025.0007'
  ], 'reject_intervention_specific_record_as_baseline_edge_evidence',
  'These records evaluate optimization, coordinated dispatch, or carbon-oriented demand response interventions. They do not independently establish the baseline fleet-level electricity-to-emissions relationship or its global magnitude.',
  'Rejected from the missing-link promotion queue. They may inform a separate data-centre demand-response or carbon-aware-computing response edge after intervention-specific readback.'),
  ...reviewedRejectionBatch([
    'data_centers->resource_depletion::10.64220/mri.v2i1.001',
    'data_centers->resource_depletion::10.2139/ssrn.5228984',
    'data_centers->resource_depletion::10.36676/jrps.v16.i4.325'
  ], 'reject_computing_resource_polysemy',
  'The word resource refers to computing capacity, workload allocation, cost, or resilience rather than measured material, water, land, or mineral depletion.',
  'Rejected as computing-resource polysemy; physical resource-pressure evidence requires explicit environmental inventories and endpoint units.'),
  ...reviewedRejectionBatch([
    'ai_data_centers->data_centers::10.66311/3068-9155.02.01.01',
    'ai_data_centers->data_centers::10.1109/mspec.2026.11427092',
    'ai_data_centers->data_centers::10.64220/amla.v2i1.002'
  ], 'reject_ontology_nesting_not_causal_relationship',
  'AI data centres are a subtype or workload class within the broader data-centre system. Characterization, architecture, or compliance papers do not turn that taxonomic containment into a causal edge.',
  'Rejected from the causal graph; subtype membership belongs in ontology metadata rather than an influence relationship.'),
  ...reviewedRejectionBatch([
    'carbon_emission->amoc::10.1029/2026eo260016',
    'carbon_emission->amoc::10.1038/s41558-026-02687-w'
  ], 'reject_reverse_carbon_cycle_response_for_emissions_to_amoc_edge',
  'These records examine how AMOC collapse or circulation slowdown changes ocean carbon storage. That is a carbon-cycle response to circulation, not evidence that anthropogenic carbon emissions directly cause a bounded AMOC change.',
  'Rejected for carbon_emission->amoc. Any warming-mediated emissions-to-AMOC pathway requires a separate dossier that measures the emissions or forcing exposure, AMOC response, lag, model or observational design, and mediator boundary.'),
  ...reviewedRejectionBatch([
    'carbon_emission->amoc::10.29173/bcelnfe734'
  ], 'reject_amoc_endpoint_absent',
  'The Brazil IPAT decomposition concerns national emissions pathways and economic activity; it does not measure or analyze AMOC.',
  'Rejected as a target-endpoint keyword failure. A national emissions decomposition cannot support an ocean-circulation relationship.'),
  ...reviewedRejectionBatch([
    'ai_data_centers->carbon_emission::10.21275/sr25328043456'
  ], 'reject_cooling_intervention_as_baseline_ai_data_center_emissions_evidence',
  'The paper frames geothermal cooling as a carbon-reduction intervention. It does not estimate the baseline causal contribution of AI-specific data-centre workloads to emissions with a defined counterfactual.',
  'Rejected for the broad ai_data_centers->carbon_emission edge; it may inform a separately reviewed geothermal-cooling response after methods and lifecycle-boundary readback.'),
  ...reviewedRejectionBatch([
    'ai_data_centers->carbon_emission::10.3390/aieng1020007'
  ], 'reject_machine_learning_method_polysemy_and_unverified_ai_exposure',
  'Machine learning is presented as the emissions-estimation method. The bibliographic record does not establish that the New York data centres are AI-specific, nor does it identify AI workload growth as the exposure.',
  'Rejected for ai_data_centers->carbon_emission. A bounded data_centers->carbon_emission measurement may be reconsidered only after resolvable full-text methods, facility population, electricity, grid-factor, scope, period, and uncertainty readback.'),
  ...reviewedRejectionBatch([
    'ai_data_centers->carbon_emission::10.1016/j.isci.2025.113705'
  ], 'reject_perspective_as_new_effect_evidence',
  'The open article is a perspective synthesizing transparency and sustainability literature; it reports no new experiment or facility-level effect estimate that isolates AI data centres.',
  'Retain as contextual governance literature only. It cannot supply a source-reported effect estimate or independently promote the proposed edge.'),
  ...reviewedRejectionBatch([
    'ai_data_centers->semiconductor_fabs::10.56028/aetr.16.1.594.2026'
  ], 'reject_component_use_as_fabrication_demand_causation',
  'Use of semiconductor lasers in data-centre equipment is a technology-component relationship. It does not demonstrate that AI data centres cause construction or output of semiconductor fabrication plants.',
  'Rejected for the causal edge. Component membership or procurement belongs in supply-chain ontology unless fab capacity, orders, attribution, geography, and time are measured.'),
  ...reviewedRejectionBatch([
    'telecom_backbone->carbon_emission::10.1111/jiec.70092'
  ], 'reject_efficiency_intervention_as_baseline_telecom_emissions_effect',
  'The study evaluates an energy-efficiency and accounting intervention in telecom operations. It does not independently estimate the baseline telecom-backbone contribution to carbon emissions.',
  'Rejected for broad promotion; retain only for a separately defined telecom energy-efficiency response with intervention, counterfactual, organizational boundary, and emissions scope preserved.'),
  ...reviewedRejectionBatch([
    'mobile_wireless_networks->telecom_backbone::10.1109/tpel.2024.3520915'
  ], 'reject_tower_charging_system_as_backbone_relationship',
  'The paper concerns wireless power transfer for UAV charging on telecom towers. It does not test mobile radio-access networks as a driver of long-haul telecom-backbone capacity or fragility.',
  'Rejected for endpoint mismatch. Tower-mounted charging equipment and backbone-network evolution are different systems.'),
  ...reviewedRejectionBatch([
    'mobile_wireless_networks->carbon_emission::10.33068/iccd.v7i1.851',
    'mobile_wireless_networks->carbon_emission::10.47852/bonviewjcce62027867',
    'mobile_wireless_networks->carbon_emission::10.1016/j.atmosenv.2025.121688'
  ], 'reject_mobile_and_carbon_keyword_polysemy',
  'The records concern a mobile software application, carbon-nanotube antennas, or mobile-source emissions from transport. None measures operational mobile-wireless-network energy use as the exposure and greenhouse-gas emissions as the outcome.',
  'Rejected as keyword polysemy. Mobile applications, carbon materials, transport sources, and telecommunications networks require distinct ontology nodes and estimands.'),
  ...reviewedRejectionBatch([
    'internet_exchange_points->telecom_backbone::10.1109/access.2025.3589653',
    'internet_exchange_points->telecom_backbone::10.58346/jisis.2025.i3.035',
    'internet_exchange_points->telecom_backbone::10.1093/restud/rdaf097'
  ], 'reject_network_ontology_or_backbone_context_as_causal_edge',
  'These records characterize routing architecture, self-healing backbone control, or backbone-market entry. They do not isolate Internet exchange points as a causal exposure producing a measured backbone outcome.',
  'Rejected from the causal graph. Interconnection topology may be represented as ontology or infrastructure context; a causal resilience edge requires measured route diversity, capacity, outage, or performance response.'),
  ...reviewedRejectionBatch([
    'ocean_acidification->marine_fisheries_collapse::10.1111/faf.70106',
    'ocean_acidification->marine_fisheries_collapse::10.1051/matecconf/202541002011',
    'ocean_acidification->marine_fisheries_collapse::10.1007/s11160-025-10005-4'
  ], 'reject_organism_response_as_fisheries_collapse_endpoint_retain_narrow_evidence',
  'The synthesis and meta-analysis records support heterogeneous physiological, reproductive, survival, growth, calcification, or aquaculture responses under ocean acidification. They do not demonstrate collapse of a bounded marine fishery, including stock abundance, recruitment, catch, effort, economics, and co-stressors.',
  'Rejected only for the broad marine_fisheries_collapse endpoint. Preserve these sources for narrower teleost early-life, calcifier, cultured-bivalve, or aquaculture-productivity relationships; species, life stage, carbonate chemistry, exposure duration, temperature, food, adaptation, and experimental design must remain explicit.'),
  ...reviewedRejectionBatch([
    'aviation->aviation_demand_growth::10.51785/jar.1677452',
    'aviation->aviation_demand_growth::10.3846/aviation.2025.25363'
  ], 'reject_spare_parts_demand_as_passenger_or_freight_aviation_growth',
  'These papers forecast or evaluate spare-parts demand. Their demand endpoint is maintenance inventory, not growth in passenger, freight, flight, or fleet demand represented by Aviation Demand Growth.',
  'Rejected for endpoint mismatch; spare-parts inventory demand must not be generalized to aviation activity growth.'),
  ...reviewedRejectionBatch([
    'aviation->aviation_demand_growth::10.7771/2159-6670.1343'
  ], 'reject_sector_identity_as_growth_driver_and_preserve_policy_direction',
  'The study frames government focus or policy as the driver of post-COVID aviation-industry growth. The broad Aviation node is not an independently identified upstream exposure.',
  'Rejected for aviation->aviation_demand_growth. A policy-support-to-aviation-growth relationship would require its own intervention, counterfactual, activity metric, geography, and period.'),
  ...reviewedRejectionBatch([
    'industry_farming->fertilizer_production::10.70609/g-tech.v9i4.8086',
    'industry_farming->fertilizer_production::10.36948/ijfmr.2025.v07i03.47119',
    'industry_farming->fertilizer_production::10.26730/1999-4125-2025-1-46-53'
  ], 'reject_local_fertilizer_process_or_program_as_aggregate_industrial_farming_driver',
  'The records describe fertilizer manufacturing from industrial or poultry waste, vermicast production, or a local organic-farming program. They do not estimate industrial farming demand as a driver of aggregate fertilizer production.',
  'Rejected for the broad edge. These sources may inform waste-to-fertilizer production or local circular-agriculture interventions after process, mass-flow, geography, and scale are bounded.'),
  ...reviewedRejectionBatch([
    'food->resource_depletion::10.55248/gengpi.07.0126.0133'
  ], 'reject_resource_management_polysemy',
  'Resource management in a cold-storage supply chain refers to operational allocation and logistics, not measured depletion of water, soil, minerals, biomass, or other physical resources.',
  'Rejected as resource polysemy; physical depletion requires a named stock, withdrawal or extraction flow, boundary, baseline, and unit.'),
  ...reviewedRejectionBatch([
    'food->resource_depletion::10.1016/j.agwat.2025.109882'
  ], 'reject_recharge_mitigation_intervention_as_agricultural_demand_depletion_effect',
  'The paper evaluates managed aquifer recharge as a groundwater-depletion mitigation intervention. It does not isolate the platform Agricultural Demand node as the causal exposure producing depletion.',
  'Rejected for food->resource_depletion. It may support a bounded managed-recharge response edge or an irrigated-withdrawal-to-groundwater-depletion edge if the correct exposure and counterfactual are read back.'),
  ...reviewedRejectionBatch([
    'food->carbon_emission::10.56669/exve7833',
    'food->carbon_emission::10.23977/agrfem.2026.090102',
    'food->carbon_emission::10.1016/j.iref.2026.105349'
  ], 'reject_policy_finance_or_service_intervention_as_agricultural_demand_emissions_effect',
  'These records study agricultural policy, inclusive finance, or socialized-service and modernization interventions intended to reduce emissions. They do not estimate Agricultural Demand itself as the emissions exposure.',
  'Rejected for food->carbon_emission. Intervention effects require separate response nodes and cannot be inverted into a baseline demand-to-emissions relationship.'),
  'resource_depletion->migration::10.1016/j.geopsy.2026.100090': Object.freeze({
    decision: 'reject_broad_source_endpoint_after_full_text_readback_retain_narrow_candidate',
    rationale: 'The open study supports a bounded coastal Bangladesh pathway from salinity exposure, perceived agricultural and freshwater loss, and livelihood disruption to migration tendency. The platform Resource Depletion node is defined by broad physical material extraction and footprint metrics, so promoting that broad endpoint would overgeneralize the study exposure.',
    reviewed_at: '2026-07-18',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([{ url: 'https://doi.org/10.1016/j.geopsy.2026.100090', locator: 'Results and regression/correlation tables: 217 coastal Bangladesh respondents; natural-resource-depletion perception OR 3.437, livelihood disruption OR 2.843, salinity-migration tendency correlation 0.735, and migration occurrence-resource depletion correlation 0.433.' }]),
    evidence_boundary: 'Rejected only for broad resource_depletion->migration. Preserve the paper for a narrower salinity-driven agricultural/freshwater livelihood-loss pathway with household survey, coastal Bangladesh, and study-period bounds; odds ratios and correlations are not interchangeable causal effects.'
  })
});

const CORRECTED_QUEUE_CROSSREF_REJECTIONS = Object.freeze({
  ...reviewedRejectionBatch([
    'monsoon_volatility->industry_farming::10.7454/jessd.v8i1.1309'
  ], 'reject_monsoon_climate_context_as_monsoon_volatility_exposure',
  'The paper compares farming practices in a tropical monsoon climate. A monsoon climate is the study setting, not a measured volatility exposure, and soil microbial or ecophysiological indices are not evidence that monsoon variability causes industrial farming.',
  'Rejected for the queued direction. A valid monsoon-volatility edge needs onset, break, rainfall-timing or seasonal-variance exposure; a bounded crop or production-system response; geography; period; comparator; and uncertainty.'),
  ...reviewedRejectionBatch([
    'monsoon_volatility->industry_farming::10.35611/jkt.2025.29.7.119',
    'monsoon_volatility->industry_farming::10.1016/j.frl.2026.109688'
  ], 'reject_finance_industry_and_volatility_polysemy',
  'The records concern steel-industry asset performance under raw-material price volatility or fund-industry style drift. Neither studies monsoon variability or agricultural production.',
  'Rejected as finance-domain polysemy and prohibited from environmental relationship evidence.'),
  ...reviewedRejectionBatch([
    'ice_sheet_mass_loss->glacier_calving_events::10.1017/jog.2025.10056'
  ], 'reject_reverse_calving_to_ice_sheet_response_direction',
  'The study models the integrated ice-sheet response to stochastic iceberg calving. Calving is the forcing or mass-loss process, not an outcome caused by prior aggregate ice-sheet mass loss.',
  'Rejected for ice_sheet_mass_loss->glacier_calving_events. A reverse, glacier- and model-bounded calving-to-dynamic-response relationship requires a separate dossier.'),
  ...reviewedRejectionBatch([
    'ice_sheet_mass_loss->glacier_calving_events::10.1038/s43247-026-03758-8'
  ], 'reject_glacier_algal_bloom_endpoint_mismatch',
  'The record models glacier algal blooms around the Greenland Ice Sheet and does not measure calving events as a response to ice-sheet mass loss.',
  'Rejected for target mismatch; algal bloom extent and glacier calving are separate outcomes.'),
  ...reviewedRejectionBatch([
    'carbon_emission->el_nino::10.1007/s11707-025-1206-6'
  ], 'reject_high_emissions_scenario_context_without_enso_response',
  'The paper evaluates precipitation during strong El Nino under high-emission scenarios. It conditions on an El Nino state and studies precipitation response; it does not estimate carbon emissions as a cause of El Nino occurrence or intensity.',
  'Rejected for carbon_emission->el_nino. Preserve only as scenario-conditioned El Nino precipitation-impact literature after full variable and model readback.'),
  ...reviewedRejectionBatch([
    'carbon_emission->el_nino::10.1038/s43247-026-03441-y'
  ], 'reject_reverse_enso_to_ocean_carbon_response',
  'The study describes the 2016 El Nino heatwave weakening ocean carbon export and respiration. The direction runs from El Nino and heatwave conditions to carbon-cycle response, not carbon emissions to El Nino.',
  'Rejected for the queued direction; any ENSO-to-ocean-carbon edge needs a separate bounded dossier.'),
  ...reviewedRejectionBatch([
    'cooling_water_competition->transformer_heat_failure_risk::10.1016/j.applthermaleng.2025.125775',
    'cooling_water_competition->transformer_heat_failure_risk::10.3390/w17172609',
    'cooling_water_competition->transformer_heat_failure_risk::10.1016/j.icheatmasstransfer.2026.110919'
  ], 'reject_internal_cooling_engineering_as_external_water_competition',
  'The records concern transformer heat pipes, a guided-bearing heat exchanger using cooling water, or microchannel evaporator flow competition. Internal thermal-management design and fluid behavior do not measure competition for external cooling-water resources as a driver of transformer failure.',
  'Rejected for source-exposure and system-boundary mismatch. A valid edge requires shared-water-basin constraints, power-system operating conditions, transformer thermal loading, failures or derating, geography, and time.'),
  ...reviewedRejectionBatch([
    'industry_farming->food::10.56578/of110202',
    'industry_farming->food::10.64026/jssf/2025013'
  ], 'reject_industry_5_0_or_precision_farming_intervention_as_food_effect',
  'The papers address cooperative supply-chain maturity during an Industry 5.0 transition or benchmark AI precision-farming models using FAOSTAT data. Neither estimates the platform Industrial Farming exposure causing a bounded Food outcome.',
  'Rejected for the broad queued edge. Technology adoption, cooperative governance and model benchmarking require separate response or methods nodes with source-native outcomes.'),
  ...reviewedRejectionBatch([
    'urbanization->migration::10.1093/geroni/igaf122.1869',
    'urbanization->migration::10.61424/issej.v3i1.197',
    'urbanization->migration::10.35674/kent.1698883'
  ], 'reject_migration_urbanization_cooccurrence_or_reverse_direction',
  'The records concern life-course migration and urban exposure in relation to late-life cognition, migration-led urbanization in Nigeria, or migration governance and smart-urbanization theory. None isolates urbanization as the upstream cause of a measured migration flow.',
  'Rejected for urbanization->migration. Descriptive co-development, migration-led city growth and governance theory cannot be promoted as a directed causal effect without a defined urban exposure, migration outcome, lag, alternatives and uncertainty.'),
});

const LATEST_CORRECTED_QUEUE_CROSSREF_REJECTIONS = Object.freeze({
  ...reviewedRejectionBatch([
    'cooling_water_competition->transformer_heat_failure_risk::10.1016/j.icheatmasstransfer.2025.109399',
    'cooling_water_competition->transformer_heat_failure_risk::10.1016/j.engfailanal.2026.110537',
    'cooling_water_competition->transformer_heat_failure_risk::10.1115/1.4068949'
  ], 'reject_internal_cooling_system_as_external_water_competition',
  'The records concern transpiration-cooling structures, internal cooling-water fault diagnosis, or heat-pipe cooling for a high-frequency transformer. None measures competition for an external water resource as a driver of transformer failure.',
  'Rejected for cooling_water_competition->transformer_heat_failure_risk. Internal component cooling and fault diagnosis are engineering design variables; a valid environmental edge requires a named water source, competing withdrawals, thermal-plant or transformer dependency, shortage or temperature exposure, asset failure outcome, geography and period.'),
  ...reviewedRejectionBatch([
    'urbanization->migration::10.62896/ijhsbm.v1.i3.04',
    'urbanization->migration::10.1186/s12985-025-02950-0',
    'urbanization->migration::10.1016/j.jue.2025.103787'
  ], 'reject_urbanization_migration_cooccurrence_parallel_drivers_or_reverse_direction',
  'The records are a broad migration-and-urbanization policy discussion, a review treating urbanization and migration as parallel infectious-disease drivers, or a rural-to-urban migration study whose exposure is migration. None isolates urbanization as the upstream cause of a measured migration flow.',
  'Rejected for urbanization->migration. A promotable edge requires a defined urban exposure, origin and destination population, migration flow or probability, lag, economic and policy alternatives, geography, period and uncertainty; migration-led city growth is the reverse direction.'),
  ...reviewedRejectionBatch([
    'industry_farming->crop_yield_volatility::10.64388/irev9i9-1715479',
    'industry_farming->crop_yield_volatility::10.61336/jiclt/26-01-68'
  ], 'reject_crop_prediction_method_as_industrial_farming_exposure',
  'The records describe artificial-intelligence or machine-learning methods for crop-yield prediction. Prediction method is not the platform Industrial Farming exposure, and model accuracy is not observed crop-yield volatility caused by a production system.',
  'Rejected for industry_farming->crop_yield_volatility. Preserve only as agricultural-modeling context; a valid relationship requires a defined farming-system contrast, observed yield distribution, geography, period, weather and management controls, and uncertainty.'),
  ...reviewedRejectionBatch([
    'industry_farming->crop_yield_volatility::10.1016/j.cropro.2020.105148'
  ], 'reject_glyphosate_management_review_as_broad_industrial_farming_edge',
  'The review evaluates yield effects associated with glyphosate use in non-GMO arable systems. A specific herbicide-management comparison does not identify Industrial Farming as the exposure, and mean yield effects are not necessarily yield volatility.',
  'Rejected for the broad queued edge. The paper may inform a narrower glyphosate-management-to-crop-yield relationship only after crop, treatment, comparator, study design, geography, period and heterogeneity are retained.'),
  ...reviewedRejectionBatch([
    'temp->migration::10.1111/gcb.14746'
  ], 'reject_bird_migration_endpoint_as_human_migration_evidence',
  'The study endpoint is autumn bird-migration phenology. The platform Migration node represents human migration and displacement, so matching the word migration does not establish the target endpoint.',
  'Rejected for temp->migration as ontology polysemy. Preserve for a separate species-migration or migration-phenology node if the ecological ontology is expanded.'),
  ...reviewedRejectionBatch([
    'temp->migration::10.35678/2539-5645.1(20).2020.69-87'
  ], 'reject_temperature_control_process_polysemy_as_human_migration_evidence',
  'The record uses migration and temperature in a technical control-model context and does not identify climate temperature as an exposure or human population movement as an outcome.',
  'Rejected as cross-domain polysemy and prohibited from human climate-migration evidence.'),
  ...reviewedRejectionBatch([
    'temp->polar_infrastructure_failure::10.33265/polar.v43.9723'
  ], 'reject_polar_vortex_temperature_response_as_infrastructure_failure',
  'The paper studies polar-vortex weakening and surface-temperature response. It contains no infrastructure asset, fragility, outage, damage or failure endpoint, and its temperature direction is atmospheric circulation to surface temperature.',
  'Rejected for temp->polar_infrastructure_failure. Polar circulation and infrastructure reliability require separate ontology and endpoint contracts.'),
  ...reviewedRejectionBatch([
    'temp->overstory_tree_mortality::10.23880/psbj-16000267'
  ], 'reject_solar_particle_and_human_mortality_topic_as_tree_mortality_evidence',
  'The record proposes solar alpha particles in relation to global temperature and human mortality. It does not measure overstory trees, drought physiology, hydraulic failure, carbon starvation or tree death.',
  'Rejected for complete target mismatch and prohibited from forest-mortality evidence.')
});

const JULY_19_FULL_TEXT_QUEUE_DECISIONS = Object.freeze({
  ...reviewedSourceRejectionBatch([
    'ocean_heat_content->sea_level_rise::10.1029/2011gl047651',
    'ocean_heat_content->sea_level_rise::10.1175/jcli-d-19-0167.1',
    'ocean_heat_content->sea_level_rise::10.3389/fmars.2016.00037'
  ], 'reject_common_driver_or_measurement_direction_not_exact_ohc_effect',
  'These studies use wind stress, the subtropical Indian Ocean Dipole, ENSO, altimetry, GRACE, and steric-sea-level closure to explain or infer co-varying upper-ocean heat content and sea level. They do not isolate ocean heat content as the upstream exposure in the queued causal estimand.',
  'Rejected as promotion evidence for the queued edge. The physical thermosteric relationship is promoted separately from IPCC AR6 Chapter 9 and NOAA, which directly define increasing ocean temperature and heat content as a cause of global mean thermosteric sea-level rise.',
  'Title, abstract, methods and available full-text results reviewed for exposure direction, sea-level component definition, common drivers, geography, period and uncertainty.'),
  ...reviewedSourceRejectionBatch([
    'temp->crop_yield_volatility::10.1016/j.geosus.2026.100430',
    'temp->crop_yield_volatility::10.1371/journal.pone.0178339',
    'temp->crop_yield_volatility::10.1504/ijw.2021.123078'
  ], 'reject_growing_season_temperature_as_global_mean_temperature_endpoint',
  'The crop studies use crop-growing-season temperature, drought, water variability, adapted growing periods, or country and subnational yield anomalies. Those exposures are not the platform Global Temperature metric, which is annual global mean surface-temperature anomaly.',
  'Rejected for the collapsed temp->crop_yield_volatility edge. The PLOS study is retained as exact corroboration for farm_heat_stress->crop_yield_volatility: during 1961-2014, hot-dry conditions were associated with global maize, soybean and wheat yield decreases of 11.6, 12.4 and 9.2 percent, respectively, with crop-specific 95 percent intervals reported in the full text.',
  'Full text where open, plus title, abstract and methods context: growing-season exposure definition, crop and country coverage, 1961-2014 period, regression interaction terms and uncertainty.'),
  ...reviewedSourceRejectionBatch([
    'temp->public_health_heat_burden::10.1016/j.puhe.2025.106008',
    'temp->public_health_heat_burden::10.1186/s12982-025-01075-7',
    'temp->heatwave_excess_mortality_rates::10.1016/j.envres.2022.114082'
  ], 'reject_local_nonoptimal_temperature_as_global_temperature_exposure',
  'The health studies estimate burden attributable to local daily non-optimal or high ambient temperature, or city-specific cold and heat exposure-response functions. They do not use annual global mean surface temperature as the exposure represented by the Global Temperature node.',
  'Rejected for the queued collapsed arrows. Preserve the studies for public-health heat indicators and narrower heat-exposure relationships, with the local TMREL or exposure-response curve, cause, population, sex, geography, lag, adaptation and 95 percent uncertainty interval retained.',
  'Available full text and source record reviewed for temperature exposure definition, health endpoint, GBD or observational design, geography, 1990-2021 or study-specific period, modifiers and uncertainty.'),
  ...reviewedSourceRejectionBatch([
    'temp->marine_food_web_simplification::10.1111/gcb.13374',
    'temp->marine_food_web_simplification::10.1111/geb.70110'
  ], 'reject_local_temperature_gradient_and_nonmonotonic_food_web_endpoint',
  'The studies examine temperature variability in a natural microbial food web or indirect water-temperature gradients in fish food-web properties. They do not use global mean surface temperature as the exposure, and community reorganization or property gradients do not necessarily entail monotonic food-web simplification.',
  'Rejected for the broad queued edge. Preserve for a water-temperature-variability or thermal-gradient relationship only if habitat, taxa, food-web metric, direct and indirect paths, geography, period and competing productivity or species-composition explanations are retained.',
  'Source record and available full text reviewed for temperature scale, ecosystem, food-web response definition, direct versus indirect effects and directional interpretation.'),
  ...reviewedSourceRejectionBatch([
    'temp->overstory_tree_mortality::10.1002/ece3.664'
  ], 'reject_temperature_per_se_and_preserve_vpd_drought_pathway',
  'The open full text explicitly finds vapor-pressure deficit more important than temperature per se for drought-induced tree-health decline. Its manipulated drought and atmospheric-demand pathway does not support annual global mean temperature as a direct tree-mortality exposure.',
  'Rejected for temp->overstory_tree_mortality and retained as relationship-specific evidence for drought_persistence->overstory_tree_mortality, with species, soil water, VPD, treatment duration, growth and health endpoints, and the non-significant temperature result preserved as counterevidence.',
  'Abstract, methods, results and discussion: greenhouse drought experiment, vapor-pressure deficit versus temperature comparison, tree-health response and stated limitations.'),
  ...reviewedSourceRejectionBatch([
    'temp->sea_level_rise::10.1016/j.gloplacha.2012.12.011',
    'temp->sea_level_rise::10.1029/2022gl101004',
    'temp->sea_level_rise::10.3390/w8110519'
  ], 'reject_ocean_temperature_or_predictive_association_as_global_surface_temperature_effect',
  'These papers use depth-dependent ocean temperature, ocean salinity and temperature, or sea-surface temperature in thermosteric reconstruction, inference, lagged association or prediction. None uses the platform annual global mean surface-temperature anomaly as the isolated exposure.',
  'Rejected for temp->sea_level_rise. The supported physical relationship is ocean_heat_content->sea_level_rise through thermosteric expansion; IPCC cautions that conversions from sea-surface or global surface-air temperature to thermosteric rise are time-scale and application dependent.',
  'Full text where open, plus source abstract and methods context: ocean-temperature variable, thermosteric or total sea-level endpoint, lag or reconstruction method, salinity and mass components, period and uncertainty.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->bark_beetle_epidemics::10.1007/s10886-022-01400-3',
    'carbon_emission->bark_beetle_epidemics::10.1029/2012eo070021',
    'carbon_emission->bark_beetle_epidemics::10.1111/j.1365-2486.2010.02226.x'
  ], 'reject_semiochemical_emission_or_reverse_carbon_cycle_direction',
  'The records concern beetle semiochemical emission or carbon-cycle consequences after bark-beetle outbreak. They do not test anthropogenic carbon emissions as the upstream exposure causing bark-beetle epidemics.',
  'Rejected for ontology polysemy or reverse direction. A valid pathway must retain climate exposure, host stress, beetle survival and reproduction, forest type, outbreak definition, geography and lag.',
  'Titles, abstracts and available source context reviewed for the meaning of emission, causal direction and outbreak endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->coral_larval_mortality::10.1016/j.engfailanal.2025.110075'
  ], 'reject_carbon_fiber_concrete_as_carbon_emission_exposure',
  'The engineering record studies carbon-fiber-reinforced coral concrete. Carbon is a material descriptor, not an atmospheric-emissions exposure, and coral concrete failure is not coral larval mortality.',
  'Rejected as complete source and target ontology mismatch.',
  'Title and abstract reviewed for material, exposure and outcome definitions.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->drinking_water_treatment_stress::10.1016/j.watres.2025.124868',
    'carbon_emission->drinking_water_treatment_stress::10.23884/mejs.2019.5.2.01',
    'carbon_emission->drinking_water_treatment_stress::10.31015/jaefs.2024.1.15'
  ], 'reject_treatment_plant_carbon_accounting_or_organic_carbon_removal',
  'The records evaluate treatment-plant emissions reduction, total organic carbon removal, or a plant carbon footprint. They do not show anthropogenic carbon emissions causing drinking-water treatment stress; two are the reverse accounting direction and one uses carbon as a water-quality constituent.',
  'Rejected for direction or carbon polysemy. Preserve only for plant-emissions accounting or organic-carbon-treatment metrics.',
  'Titles and abstracts reviewed for carbon variable, treatment endpoint and direction.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->ice_albedo_feedback_loops::10.1175/jcli-d-18-0720.1'
  ], 'reject_black_carbon_snow_forcing_as_aggregate_carbon_emission_edge',
  'The paper studies black-carbon deposition and snow or ice radiative feedback. The platform Carbon Emissions node represents aggregate greenhouse-gas and carbon-dioxide emissions, not black-carbon aerosol deposition.',
  'Rejected for the collapsed edge. Preserve for a distinct black-carbon-deposition-to-snow-albedo pathway with aerosol species, deposition, snow state, region and forcing retained.',
  'Full source context reviewed for emitted species, deposition process and albedo endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->peak_glacier_runoff_passage::10.1016/j.eng.2022.06.014',
    'carbon_emission->peak_glacier_runoff_passage::10.23977/envcp.2025.040104',
    'carbon_emission->peak_glacier_runoff_passage::10.3389/fenvs.2021.789970'
  ], 'reject_carbon_peak_policy_as_peak_glacier_runoff',
  'These records use peak to mean a carbon-emissions policy target or sectoral emissions maximum. None measures glacier mass balance, basin runoff or passage of peak water.',
  'Rejected as exact-term polysemy. A glacier-runoff edge requires a named glacierized basin, warming or mass-loss exposure, runoff trajectory, peak-water definition, period and hydrologic alternatives.',
  'Titles and abstracts reviewed for the meaning of peak and the presence of a glacier-runoff endpoint.'),
  ...reviewedSourceRejectionBatch([
    'data_centers->critical_infrastructure_fragility::10.31891/2307-5732-2020-285-3-8'
  ], 'reject_data_migration_architecture_as_infrastructure_fragility',
  'The record concerns data migration to hybrid infrastructure. It does not measure physical data-center load, interdependency, outage, recovery, cascading failure or critical-infrastructure fragility.',
  'Rejected for computing-architecture polysemy.',
  'Title and abstract reviewed for exposure, asset and failure endpoint.'),
  ...reviewedSourceRejectionBatch([
    'drought_persistence->biodiversity_intactness_loss::10.1016/j.jenvman.2025.128359'
  ], 'reject_biodiversity_loss_as_exposure_not_drought_caused_endpoint',
  'The study treats biodiversity loss as an exposure whose soil-organic-matter effect is exacerbated by drought. It does not estimate drought persistence causing biodiversity-intactness loss.',
  'Rejected for endpoint and direction mismatch; retain only for a biodiversity-loss-by-drought interaction on soil function.',
  'Title, abstract and study framing reviewed for exposure, interaction and response.'),
  ...reviewedSourceRejectionBatch([
    'temp->drinking_water_treatment_stress::10.1016/j.dwt.2024.100474',
    'temp->drinking_water_treatment_stress::10.1016/j.dwt.2024.100972',
    'temp->drinking_water_treatment_stress::10.3390/environments13010040'
  ], 'reject_storage_or_process_water_temperature_as_global_temperature',
  'The records examine bottle-storage temperature or low-temperature coagulation and flocculation. These local material and process temperatures are not annual global mean surface-temperature anomaly.',
  'Rejected for temp->drinking_water_treatment_stress. Preserve for bounded storage-temperature or treatment-process-temperature relationships only.',
  'Full text where open, plus title and abstract, reviewed for temperature variable and treatment endpoint.'),
  ...reviewedSourceRejectionBatch([
    'temp->glacial_siltation_streams::10.1029/2025gl118083',
    'temp->glacial_siltation_streams::10.1111/gcb.15862',
    'temp->glacial_siltation_streams::10.1111/geb.13886'
  ], 'reject_paleotemperature_or_stream_ecology_as_glacial_siltation',
  'The records concern Last Glacial Maximum temperature reconstruction, stream-organism body size, or freshwater refugia and biodiversity. None measures sediment production, suspended load, deposition or siltation in a glacier-fed stream.',
  'Rejected for target mismatch and, where applicable, local-temperature substitution.',
  'Titles and abstracts reviewed for temperature scale, glacier context and sediment endpoint.'),
  ...reviewedSourceRejectionBatch([
    'temp->glacier_meltwater_dependency::10.1021/acsestwater.5c01159',
    'temp->glacier_meltwater_dependency::10.1080/02626667.2016.1261295'
  ], 'reject_lake_or_river_water_temperature_as_meltwater_dependency',
  'The records study lake methane oxidation or water temperature in a glacier-fed river. They do not estimate a community, ecosystem, irrigation or power system dependency on glacier meltwater, and their temperature variables are local water conditions rather than global mean temperature.',
  'Rejected for source and target mismatch. Meltwater dependency requires a named downstream user or ecosystem, glacier contribution fraction, seasonal timing, substitutes, geography and period.',
  'Titles, abstracts and available methods context reviewed for temperature exposure and dependency endpoint.'),
  ...reviewedSourceRejectionBatch([
    'transmission_buildout_lag->carbon_emission::10.1016/j.jclepro.2020.121664',
    'transmission_buildout_lag->carbon_emission::10.1088/1748-9326/10/3/031001',
    'transmission_buildout_lag->carbon_emission::10.17775/cseejpes.2025.04180'
  ], 'reject_supply_chain_warming_lag_or_policy_transmission_polysemy',
  'The records concern low-carbon technology supply-chain lag, the emissions-to-maximum-warming lag, or a carbon-trading policy transmission mechanism. None measures delayed electric-grid transmission expansion causing carbon emissions.',
  'Rejected for exact-term polysemy. A valid grid edge requires a named interconnection or transmission constraint, delayed project or capacity, displaced generation, marginal emissions, geography and period.',
  'Titles and abstracts reviewed for the meaning of transmission and lag, grid asset, direction and emissions endpoint.'),
  ...reviewedSourceRejectionBatch([
    'wildfire_regime_shift->air_pollution_health_burden::10.1289/isesisee.2018.o03.01.07',
    'wildfire_regime_shift->air_pollution_health_burden::10.2139/ssrn.4754777'
  ], 'reject_abstract_or_preprint_as_primary_promotion_record',
  'The conference abstract and SSRN preprint are plausible topical records but are not needed as the promotion anchor after a peer-reviewed open full-text study and an independent authoritative health-mechanism source were identified.',
  'Rejected as primary promotion records, not as evidence that wildfire smoke can affect health. They may be reconsidered for a narrower occupational or population-specific edge after peer review and exact effect readback.',
  'Metadata and available abstracts reviewed for publication status, population and endpoint.'),
  'peatland_degradations->carbon_emission::10.22146/ipas.6170': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open field study measures carbon-dioxide flux across drained peatland uses in Central and West Kalimantan and reports a positive relationship with water-table depth. The relationship is independently anchored by the IPCC Wetlands Supplement, which defines persistent carbon dioxide emissions from drained organic-soil decomposition and dissolved organic carbon while treating fire separately.',
    reviewed_at: '2026-07-19',
    reviewer: 'northstar_full_text_readback_v1',
    evidence_boundary: 'Promoted only as a drained-organic-soil pathway. The Kalimantan flux range is a short, land-use-specific field comparison rather than a global degradation coefficient; climate, nutrient status, drainage depth, land use, time since drainage, fire and remaining organic matter must remain explicit.',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.22146/ipas.6170',
        locator: 'Methods, Results and Conclusion: infrared-gas-analyzer measurements across peatland uses in Central and West Kalimantan during 2006-2007; reported carbon-dioxide flux range and positive water-table-depth relationship.'
      }),
      Object.freeze({
        url: 'https://www.ipcc-nggip.iges.or.jp/public/wetlands/pdf/Wetlands_separate_files/WS_Chp2_Drained_Inland_Organic_Soils.pdf',
        locator: 'Sections 2.1-2.2 and Table 2.1: drainage definition, decomposition and dissolved-organic-carbon pathways, persistence conditions, required stratification, separate fire term, tropical drained forest emission factor and uncertainty.'
      })
    ])
  }),
  ...reviewedSourceRejectionBatch([
    'peatland_degradations->carbon_emission::10.1002/ldr.5497',
    'peatland_degradations->carbon_emission::10.19047/0136-1694-2025-125-78-110'
  ], 'reject_carbon_stock_history_or_fire_specific_record_as_broad_peat_emission_anchor',
  'The first record examines historical carbon fractions and peat carbon pools rather than a degradation-to-emissions endpoint. The second concerns pyrogenic degradation and carbon loss in a cut-over drained peatland, a narrower fire and stock-loss estimand that is not needed as the primary anchor for the broader drained-soil emission pathway.',
  'Rejected as primary promotion records, not as evidence against peat carbon loss. Preserve the pyrogenic record for a future fire-specific peat-carbon edge with combustion, stock-change, drainage history, geography and measurement method retained.',
  'Titles, abstracts and available source context reviewed for carbon endpoint, degradation mechanism, direction and estimand.'),
  ...reviewedSourceRejectionBatch([
    'forest_fragmentation->biodiversity_intactness_loss::10.24294/sf.v4i1.1600',
    'forest_fragmentation->biodiversity_intactness_loss::10.66946/guineis.v10.a5',
    'forest_fragmentation->biodiversity_intactness_loss::10.4236/nr.2014.512061'
  ], 'reject_general_biodiversity_loss_as_biodiversity_intactness_metric',
  'The records discuss habitat fragmentation and broad biodiversity loss, but none measures the platform target as compositional intactness relative to an explicit minimally disturbed reference, such as a Biodiversity Intactness Index endpoint.',
  'Rejected for the exact queued target. Preserve as qualitative fragmentation evidence only; promotion requires a named intactness metric, taxa and sampling design, reference condition, land-use contrast, geography, period and uncertainty.',
  'Titles, abstracts and available methods context reviewed for fragmentation exposure and biodiversity response definition.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->antarctic_shelf_instability::10.3390/en15217837',
    'carbon_emission->antarctic_shelf_instability::10.1016/j.ecss.2011.11.003',
    'carbon_emission->antarctic_shelf_instability::10.1007/s12597-026-01099-w'
  ], 'reject_antarctic_tourism_carbon_flow_or_inventory_shelf_polysemy',
  'The records concern Antarctic tourism emissions, ecological carbon flow in a coastal benthic community, or product shelf life in an inventory model. None measures Antarctic ice-shelf instability caused by anthropogenic carbon emissions.',
  'Rejected for source, target or shelf-term polysemy. A valid pathway must retain greenhouse forcing, ocean or atmospheric heat transfer, named ice shelf, structural or grounding-line endpoint, period and competing drivers.',
  'Titles and abstracts reviewed for carbon variable, shelf meaning, causal direction and instability endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->fisheries_range_redistribution::10.1007/s12562-025-01942-x',
    'carbon_emission->fisheries_range_redistribution::10.1016/j.aquaculture.2025.743421',
    'carbon_emission->fisheries_range_redistribution::10.3390/f13010110'
  ], 'reject_fishery_emissions_accounting_or_carbon_pool_redistribution',
  'Two records study emissions reduction by fishing fleets, reversing the queued direction. The third redistributes carbon among forest pools after fire and has neither fisheries nor species-range movement.',
  'Rejected for direction and redistribution polysemy. Fisheries range redistribution requires a species or assemblage, spatial range metric, climate or ocean exposure, fishery response, geography, period and uncertainty.',
  'Titles and abstracts reviewed for direction, fishery endpoint and meaning of redistribution.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->high_altitude_forest_shrinkage::10.5849/forsci.13-039',
    'carbon_emission->high_altitude_forest_shrinkage::10.4236/lce.2014.52009',
    'carbon_emission->high_altitude_forest_shrinkage::10.29122/jstmb.v14i1.3561'
  ], 'reject_forest_carbon_consequence_or_accounting_as_altitudinal_shrinkage',
  'The records estimate forest carbon dynamics, management-related emissions reductions, or land-cover-change emissions. None measures contraction of a high-altitude forest range as an outcome of carbon emissions.',
  'Rejected for direction or target mismatch. Promotion requires an elevationally defined forest, range or area contraction, climate exposure pathway, geography, period, land-use controls and uncertainty.',
  'Titles and abstracts reviewed for carbon direction, elevation and forest-range endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->marine_pathogen_range_expansion::10.3390/su15086331',
    'carbon_emission->marine_pathogen_range_expansion::10.1016/j.marpol.2021.104831',
    'carbon_emission->marine_pathogen_range_expansion::10.3390/jmse10091179'
  ], 'reject_marine_fishery_scale_or_emissions_accounting_as_pathogen_range',
  'All three records concern carbon-emissions efficiency, decoupling, accounting or sink capacity in marine fisheries. None identifies a pathogen, host, geographic range boundary or range expansion.',
  'Rejected for target mismatch and scale-expansion polysemy. A valid edge requires a named pathogen or syndrome, host and surveillance system, thermal or chemical mediator, baseline and expanded range, period and alternatives.',
  'Titles and abstracts reviewed for emissions direction, pathogen endpoint and meaning of expansion.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->river_flow_regime_shift::10.1111/j.1365-2486.2010.02170.x',
    'carbon_emission->river_flow_regime_shift::10.1007/s10644-024-09611-2',
    'carbon_emission->river_flow_regime_shift::10.1007/s10644-024-09786-8'
  ], 'reject_reverse_river_carbon_direction_and_retracted_economics_records',
  'The river study estimates how temperature and flow-regime alterations affect organic-carbon dynamics, reversing the queued direction. The other two records are a retracted urban carbon-efficiency article and its retraction notice and contain no river-flow endpoint.',
  'Rejected for reverse direction, target mismatch and retraction status. River-regime promotion requires discharge timing or magnitude, basin, emissions-to-climate mediator, period, management controls and hydrologic uncertainty.',
  'Full-text framing or source metadata reviewed for direction, river endpoint and publication status.'),
  ...reviewedSourceRejectionBatch([
    'building_energy_efficiency->public_health_heat_burden::10.1007/s12053-023-10146-0',
    'building_energy_efficiency->public_health_heat_burden::10.1016/j.buildenv.2018.05.024',
    'building_energy_efficiency->public_health_heat_burden::10.11648/j.ijepe.20130203.12'
  ], 'reject_heat_loss_or_indoor_resilience_as_public_health_burden',
  'The records evaluate heat-loss prediction, indoor thermal resilience during heat and outages, or envelope heat-transfer modelling. None measures illness, mortality, emergency use or another population-health heat-burden endpoint attributable to building efficiency.',
  'Rejected for the public-health target. Preserve the resilience study for a narrower building-code-to-indoor-temperature relationship; health promotion requires occupancy, vulnerability, exposure, health outcome, comparator, geography, period and uncertainty.',
  'Titles, abstracts and available methods context reviewed for efficiency intervention, indoor exposure and health endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->arctic_pack_ice_drift::10.1093/plankt/fbx030'
  ], 'reject_ice_algae_carbon_transfer_as_pack_ice_drift',
  'The paper studies trophic transfer of ice-algal carbon to amphipods in Arctic pack ice. Carbon is an ecological tracer and the paper does not estimate sea-ice motion, drift speed, trajectory or forcing by anthropogenic emissions.',
  'Rejected as carbon and drift-endpoint mismatch. Pack-ice drift requires motion observations, wind and ocean-current controls, ice concentration and thickness, region, period and an explicit emissions-to-climate mediator.',
  'Title, abstract and source context reviewed for carbon meaning and physical drift endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->atmospheric_dryness::10.1016/j.apr.2025.102608'
  ], 'reject_vehicle_evaporative_emission_as_atmospheric_dryness',
  'The study uses evaporation and purge in the vehicle-fuel-system sense. It does not measure atmospheric vapor-pressure deficit, relative humidity, evaporative demand or a climate response to anthropogenic carbon emissions.',
  'Rejected as emission and evaporation polysemy. The real climate pathway remains carbon emissions to greenhouse forcing and warming, followed by bounded land-atmosphere controls on vapor-pressure deficit; transitivity is not inferred here.',
  'Title and abstract reviewed for emitted substance, evaporation process and atmospheric endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->fish_landing_supply_disruption::10.1051/ro/2024076',
    'carbon_emission->fish_landing_supply_disruption::10.1016/j.jclepro.2018.06.246',
    'carbon_emission->fish_landing_supply_disruption::10.1016/j.energy.2024.133563'
  ], 'reject_generic_supply_chain_models_as_fish_landing_disruption',
  'The records are abstract inventory, production, electricity or allowance models in which carbon emissions are an objective or constraint. None observes a fishery, landing port, catch, cold chain or supply interruption caused by emissions.',
  'Rejected for target and causal-direction mismatch. Fish-landing disruption requires a named fishery and landing system, climate or ecosystem mediator, disruption endpoint, geography, period, fleet or market controls and uncertainty.',
  'Titles, abstracts and model framing reviewed for supply-chain domain, direction and fishery endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->smoke_exposure_burden::10.1038/s41477-024-01816-7',
    'carbon_emission->smoke_exposure_burden::10.33558/jrak.v14i2.7335',
    'carbon_emission->smoke_exposure_burden::10.30656/jak.v12i2.10955'
  ], 'reject_wildfire_smoke_tree_effect_or_media_exposure_disclosure_polysemy',
  'The first paper measures wildfire-smoke effects on tree carbon reserves and yield, making smoke the exposure rather than aggregate carbon emissions. The other two use media exposure as a predictor of corporate carbon-emissions disclosure and contain no smoke or health burden.',
  'Rejected for reverse direction and exposure polysemy. Preserve the wildfire study for a smoke-to-tree-physiology relationship and the disclosure papers for governance research only.',
  'Titles and abstracts reviewed for exposure, organism or population endpoint and direction.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->surface_water_storage_instability::10.1007/s10333-016-0541-3',
    'carbon_emission->surface_water_storage_instability::10.1515/jwld-2017-0089',
    'carbon_emission->surface_water_storage_instability::10.3390/w9030228'
  ], 'reject_ecosystem_carbon_flux_or_lake_carbon_storage_as_water_storage_instability',
  'The records examine rice-methane relations with carbon fixation and soil storage, carbon-dioxide flux after peat extraction, or carbon and metal storage in thermokarst lakes. None measures instability in reservoir, lake or surface-water storage caused by carbon emissions.',
  'Rejected for direction and storage polysemy. A valid edge requires an emissions-to-climate mediator, named water body or basin, storage-volume or persistence endpoint, management controls, period and hydrologic uncertainty.',
  'Titles, abstracts and available source context reviewed for carbon variable, meaning of storage and water-quantity endpoint.'),
  ...reviewedSourceRejectionBatch([
    'grid_scale_storage->carbon_emission::10.33140/jeee.02.03.09',
    'grid_scale_storage->carbon_emission::10.1016/j.enpol.2012.01.036',
    'grid_scale_storage->carbon_emission::10.17775/cseejpes.2023.06230'
  ], 'reject_conceptual_ev_pv_or_planning_models_as_isolated_storage_emissions_effect',
  'The records concern a conceptual vehicle-to-grid system, small photovoltaic systems, or a joint planning model with storage, transmission and quota trading. None isolates a source-reported real-world effect of grid-scale storage on emissions with charging mix, displaced generation, round-trip loss and dispatch retained.',
  'Rejected for the simple queued edge. Storage can raise or lower operational emissions depending on when and where it charges and discharges; reconsider only as a signed, scenario-bounded tradeoff relationship with lifecycle and operational accounting separated.',
  'Titles, abstracts and model scope reviewed for storage scale, comparator, co-interventions and emissions accounting boundary.'),
  ...reviewedSourceRejectionBatch([
    'temp->delta_salt_intrusion_fronts::10.1016/j.est.2025.117558'
  ], 'reject_salt_hydrate_reaction_front_as_delta_salinity_intrusion',
  'The record studies hydration fronts in packed beds of salt hydrates for thermal-energy storage. It does not measure estuarine or delta salinity, river discharge, sea level, intrusion distance or an ambient-temperature driver.',
  'Rejected as complete salt-front and storage polysemy.',
  'Title and abstract reviewed for material system, temperature variable and hydrologic endpoint.'),
  ...reviewedSourceRejectionBatch([
    'temp->hydropower_reliability_decline::10.1111/j.1365-2486.2012.02658.x',
    'temp->hydropower_reliability_decline::10.26491/mhwm/127538',
    'temp->hydropower_reliability_decline::10.3389/feart.2019.00223'
  ], 'reject_coral_decline_reverse_plant_effect_or_projection_reliability',
  'The records study coral decline, hydropower-plant effects on water temperature and ice, or the reliability of temperature projections. None measures global temperature causing a decline in hydropower generation or reliability; one reverses the plant-temperature direction.',
  'Rejected for target mismatch, reverse direction or reliability polysemy. Hydropower reliability requires basin inflow and head, plant operations, drought or glacier contribution, generation or outage endpoint, period and management controls.',
  'Titles, abstracts and available source context reviewed for temperature scale, direction and power-system endpoint.'),
  ...reviewedSourceRejectionBatch([
    'temp->insurance_retreat::10.31988/scitrends.43938'
  ], 'reject_glacier_retreat_as_insurance_market_retreat',
  'The paper concerns glacier retreat under rising air temperature. It contains no insurer, underwriting, premium, coverage withdrawal, nonrenewal or market-availability endpoint.',
  'Rejected as retreat polysemy. Preserve only for a bounded temperature-to-glacier-change relationship.',
  'Title and abstract reviewed for retreat target and institutional endpoint.'),
  ...reviewedSourceRejectionBatch([
    'temp->reservoir_storage_instability::10.13188/2327-204x.1000022',
    'temp->reservoir_storage_instability::10.1016/j.est.2026.120945',
    'temp->reservoir_storage_instability::10.3390/su10061968'
  ], 'reject_pharmaceutical_or_thermal_storage_and_reverse_pumped_operation_direction',
  'The records concern pharmaceutical suspension stability under storage temperature, cement systems for reservoir thermal-energy-storage wells, or effects of pumped-storage operations on water temperature and quality. None measures ambient or global temperature causing unstable surface-water reservoir storage; the pumped-storage study reverses the queued direction.',
  'Rejected for reservoir, storage and direction polysemy. Water-storage instability requires a named reservoir or basin, inflow, evaporation, operations, storage-volume endpoint, period and climate or demand controls.',
  'Titles, abstracts and available methods context reviewed for reservoir type, storage meaning and direction.'),
  ...reviewedSourceRejectionBatch([
    'industry_farming->freshwater_ecosystem_collapse::10.1088/1755-1315/548/2/022072',
    'industry_farming->freshwater_ecosystem_collapse::10.21275/mr22525192223',
    'industry_farming->freshwater_ecosystem_collapse::10.1029/2026eo260121'
  ], 'reject_crayfish_resource_use_biodynamic_advocacy_or_marine_mussel_outlook',
  'The records address resource use in crayfish farming, advocacy for biodynamic farming, or projected collapse of Mediterranean marine mussel farming. None estimates industrial farming causing collapse of a freshwater ecosystem.',
  'Rejected for exposure or ecosystem mismatch. A valid edge requires a specific agricultural pressure, freshwater body, ecological response metric, geography, period, comparator and alternative pollution or hydrologic explanations.',
  'Titles, abstracts and available source context reviewed for farming system, freshwater domain and collapse endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->disaster_recovery_inequality::10.3390/su17041455',
    'carbon_emission->disaster_recovery_inequality::10.1016/j.eneco.2025.108995',
    'carbon_emission->disaster_recovery_inequality::10.1007/s10668-025-07003-8'
  ], 'reject_income_or_carbon_policy_inequality_as_disaster_recovery',
  'The records examine income inequality as a predictor of emissions performance, distributional effects of carbon trading, or spatial carbon-efficiency inequality. None studies a disaster, recovery resources, reconstruction, displacement or unequal recovery outcome caused by emissions.',
  'Rejected for direction and target mismatch. Preserve the emissions-trading paper for a response-policy equity edge with household footprints and incidence retained.',
  'Titles and abstracts reviewed for inequality definition, policy exposure, disaster context and direction.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->food::10.19026/ajfst.11.2422',
    'carbon_emission->food::10.3390/agriculture13040793'
  ], 'reject_inventory_or_agricultural_technology_emissions_accounting_as_food_outcome',
  'The records model fresh-product inventory with emissions as a constraint or estimate how agricultural technology affects agricultural emissions and sinks. Neither measures food availability, nutrition, price, security or production as an outcome of carbon emissions.',
  'Rejected for direction and target underspecification. The Food node is too broad for promotion without a named food-system outcome and an explicit climate, ecosystem, price or access mediator.',
  'Titles and abstracts reviewed for direction, food endpoint and emissions accounting role.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->wastewater_infrastructure_overflow::10.1016/j.wen.2025.12.003',
    'carbon_emission->wastewater_infrastructure_overflow::10.1016/j.omega.2026.103512',
    'carbon_emission->wastewater_infrastructure_overflow::10.3390/su14138104'
  ], 'reject_wastewater_or_infrastructure_emissions_accounting_as_overflow_effect',
  'The records measure wastewater-plant emissions, carbon-capture infrastructure design, or natural-gas-infrastructure effects on emissions. None measures carbon emissions causing a wastewater overflow, surcharge, bypass or combined-sewer event.',
  'Rejected for reverse direction and infrastructure polysemy. Overflow requires precipitation or inflow, sewer capacity, storage, operations, event timing and discharge observations.',
  'Titles and abstracts reviewed for emissions direction and overflow endpoint.'),
  ...reviewedSourceRejectionBatch([
    'drought_persistence->crop_yield_volatility::10.4314/acsj.v32i2.1',
    'drought_persistence->crop_yield_volatility::10.65822/j.pcl/2025.19',
    'drought_persistence->crop_yield_volatility::10.31830/2454-1761.2019.016'
  ], 'reject_single_drought_yield_or_genetic_trait_studies_as_yield_volatility',
  'The studies address yield levels, physiology, quantitative-trait loci or heritability under drought. They do not estimate interannual or distributional crop-yield volatility under persistent drought exposure.',
  'Rejected for the exact target. Preserve for crop- and cultivar-specific drought-to-yield-level relationships with treatment, comparator and uncertainty retained.',
  'Titles, abstracts and available methods context reviewed for drought duration and yield response definition.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->alpine_snowpack_declines::10.1016/j.jhydrol.2020.124939'
  ], 'reject_snowpack_control_of_peat_emission_as_reverse_direction',
  'The study uses snowpack and soil temperature to predict carbon-dioxide emissions from cold-region peatlands. Snowpack is upstream of the emissions endpoint, not a decline caused by aggregate carbon emissions.',
  'Rejected for reverse direction; preserve for a bounded snowpack-to-peat-carbon-flux relationship.',
  'Title and abstract reviewed for exposure, outcome and direction.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->freeze_thaw_rock_fracturing::10.1007/s00603-026-05673-y',
    'carbon_emission->freeze_thaw_rock_fracturing::10.1007/s00603-025-04557-x',
    'carbon_emission->freeze_thaw_rock_fracturing::10.1007/s00603-021-02667-w'
  ], 'reject_acoustic_emission_as_atmospheric_carbon_emission',
  'All three rock-mechanics studies use acoustic emission as a fracture-monitoring signal during freeze-thaw experiments. They do not use atmospheric carbon emissions as an exposure.',
  'Rejected as emission polysemy. Preserve for freeze-thaw-cycle-to-rock-damage evidence only.',
  'Titles and abstracts reviewed for emission meaning, experiment and direction.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->shell_calcification_failures::10.1016/j.matlet.2017.11.095',
    'carbon_emission->shell_calcification_failures::10.1002/smll.202101411',
    'carbon_emission->shell_calcification_failures::10.1007/s00227-013-2279-4'
  ], 'reject_material_emission_or_calcification_respiration_as_shell_failure',
  'Two records concern optical or field emission from engineered core-shell materials. The gastropod study measures carbon emission associated with respiration and calcification, reversing the queued direction and not establishing calcification failure.',
  'Rejected for material polysemy or reverse direction. Shell-calcification impairment requires carbonate chemistry, organism and life stage, calcification endpoint, duration and uncertainty.',
  'Titles and abstracts reviewed for carbon meaning, biological endpoint and direction.'),
  'deforestation->temp::10.1016/j.gloenvcha.2018.07.004': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The primary tropical analysis connects deforestation to local temperature and perceived human well-being. It corroborates the local-exposure component of the promoted edge but is not treated as a global-mean temperature coefficient.',
    reviewed_at: '2026-07-19', reviewer: 'northstar_full_text_readback_v1',
    evidence_boundary: 'Local tropical temperature and human-exposure evidence only; retain land-cover definition, geography, observation design and local-versus-global scale.',
    source_locators: Object.freeze([
      { url: 'https://doi.org/10.1016/j.gloenvcha.2018.07.004', locator: 'Study design, local temperature analysis and well-being results for tropical deforestation; local exposure corroboration.' },
      { url: 'https://doi.org/10.1002/2016JG003653', locator: 'Independent global satellite, reanalysis and flux-tower analysis of local day-night temperature response and mechanisms.' },
      { url: 'https://doi.org/10.1029/2018GL080211', locator: 'Independent climate-model analysis of local and nonlocal contributions to global-mean biophysical temperature response.' }
    ])
  }),
  'deforestation->temp::10.1002/2016jg003653': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'Global satellite, reanalysis and flux-tower analysis directly estimates day-night surface-temperature responses to deforestation and identifies latent heat, radiation, turbulence and stored-heat mechanisms.',
    reviewed_at: '2026-07-19', reviewer: 'northstar_full_text_readback_v1',
    evidence_boundary: 'Local land-surface contrasts by latitude and time of day; tropical daytime 4.4 +/- 0.07 K and boreal nighttime -1.4 +/- 0.04 K are not annual global-mean coefficients.',
    source_locators: Object.freeze([
      { url: 'https://doi.org/10.1002/2016JG003653', locator: 'Abstract and analysis: global satellite/reanalysis/flux-tower space-for-time design, day-night asymmetry, regional estimates and physical mechanisms.' },
      { url: 'https://doi.org/10.1029/2018GL080211', locator: 'Independent model analysis bounding how nonlocal effects alter global-mean interpretation of observed local contrasts.' },
      { url: 'https://doi.org/10.1016/j.gloenvcha.2018.07.004', locator: 'Independent tropical local-temperature and human-exposure corroboration.' }
    ])
  }),
  'deforestation->temp::10.1029/2018gl080211': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The climate-model study addresses the exact global-mean biophysical temperature response and shows that nonlocal effects can dominate local effects across realistic deforestation scenarios.',
    reviewed_at: '2026-07-19', reviewer: 'northstar_full_text_readback_v1',
    evidence_boundary: 'Biophysical model response, not total carbon-cycle plus biophysical warming. The sign is model-, scenario- and scale-dependent; the edge is promoted as alters rather than raises.',
    source_locators: Object.freeze([
      { url: 'https://doi.org/10.1029/2018GL080211', locator: 'Abstract and model analysis: local versus nonlocal effects, realistic scenarios, global-mean response and model limitations.' },
      { url: 'https://doi.org/10.1002/2016JG003653', locator: 'Independent global satellite, reanalysis and flux-tower local-response analysis with day-night and latitude stratification.' },
      { url: 'https://doi.org/10.1016/j.gloenvcha.2018.07.004', locator: 'Independent tropical local-temperature and human-exposure corroboration.' }
    ])
  }),
  ...reviewedSourceRejectionBatch([
    'food->methane::10.2139/ssrn.4192470',
    'food->methane::10.1038/s43016-022-00547-2',
    'food->methane::10.70286/isu-17.09.2025.005'
  ], 'reject_broad_food_node_as_duplicate_agricultural_methane_source',
  'The records concern agricultural methane emissions or their regulation. They support narrower live agriculture, livestock, manure and rice pathways but do not define the platform Food node as a measurable source exposure.',
  'Rejected as an underspecified duplicate edge. Retain the existing industry_farming->methane and source-specific agricultural methane relationships with explicit farm-gate boundaries.',
  'Titles, abstracts and publication status reviewed for source definition and accounting boundary.'),
  'marine_heatwaves->marine_food_web_simplification::10.5194/bg-22-6583-2025': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open full text directly compares satellite-forced EcoTroph-Dyn simulations with marine heatwaves retained versus filtered and reports trophic-structure, energy-transfer and biomass changes, independently corroborated by an open Northeast Pacific food-web model study.',
    reviewed_at: '2026-07-19', reviewer: 'northstar_full_text_readback_v1',
    evidence_boundary: 'Model-derived global context with a quantified northeastern Pacific 2013-2016 event estimate of -8.7 percent +/- 1.0 standard error. Not a species-level, observed whole-ocean or universal collapse coefficient.',
    source_locators: Object.freeze([
      { url: 'https://bg.copernicus.org/articles/22/6583/2025/', locator: 'Abstract; Methods; Results Figures 3-9; Discussion and limitations: with-versus-filtered-MHW simulations, trophic biomass and energy-transfer effects, regional estimate and model uncertainty.' },
      { url: 'https://www.nature.com/articles/s41467-024-46263-2', locator: 'Independent open Northeast Pacific food-web and energy-flux model corroboration.' }
    ])
  }),
  ...reviewedSourceRejectionBatch([
    'marine_heatwaves->marine_food_web_simplification::10.1038/s41467-026-73130-z',
    'marine_heatwaves->marine_food_web_simplification::10.5376/ijms.2024.14.0018'
  ], 'reject_heatwave_teleconnection_or_general_review_as_food_web_anchor',
  'The first record studies inter-basin marine-heatwave teleconnections rather than food webs. The second is a general marine-heatwave overview and is not needed as the primary anchor after exact open full-text studies were identified.',
  'Rejected as primary promotion records, not as evidence against marine-heatwave impacts.',
  'Titles, abstracts and publication type reviewed for ecological endpoint and evidentiary role.'),
  ...reviewedSourceRejectionBatch([
    'marine_heatwaves->coral_reef_fragmentation::10.1016/j.pocean.2022.102920',
    'marine_heatwaves->coral_reef_fragmentation::10.1007/s00338-026-02824-z',
    'marine_heatwaves->coral_reef_fragmentation::10.1016/j.marpolbul.2025.119000'
  ], 'reject_coral_zone_heatwaves_culling_or_restoration_as_reef_fragmentation',
  'The records map heatwaves in reef zones, study disruption of crown-of-thorns culling, or describe restoration and conservation. None measures physical or ecological fragmentation of coral-reef habitat caused by marine heatwaves.',
  'Rejected for the exact target. Preserve for heatwave exposure, management disruption or restoration-response relationships.',
  'Titles and abstracts reviewed for fragmentation metric and direction.'),
  ...reviewedSourceRejectionBatch([
    'weatherization_retrofits->carbon_emission::10.1016/j.buildenv.2021.108683',
    'weatherization_retrofits->carbon_emission::10.1016/j.jclepro.2022.135450',
    'weatherization_retrofits->carbon_emission::10.1016/j.buildenv.2022.109311'
  ], 'retain_building_retrofit_emissions_studies_for_narrower_full_text_contract',
  'The records are relevant to retrofit emissions, but the current metadata does not establish that the interventions are weatherization rather than broader equipment, operational or industrial retrofits, nor isolate a transferable effect with dynamic electricity factors and embodied carbon retained.',
  'Rejected for the current broad promotion gate while preserving priority for a narrower building-envelope retrofit edge after full intervention, baseline, climate zone, grid pathway, lifecycle boundary and uncertainty readback.',
  'Titles, abstracts and available publisher metadata reviewed; exact intervention and effect tables were not accessible from the publisher text endpoint.'),
  ...reviewedSourceRejectionBatch([
    'fertilizer_price_shock->food_insecurity::10.1002/fes3.70012',
    'fertilizer_price_shock->food_insecurity::10.1016/j.foodpol.2013.06.007',
    'fertilizer_price_shock->food_insecurity::10.1111/j.1467-8292.2011.00433.x'
  ], 'reject_food_price_shocks_as_fertilizer_price_exposure',
  'The records study food-price shocks, coping and conflict. They do not use fertilizer prices as the exposure or identify pass-through from fertilizer costs to food prices and household food insecurity.',
  'Rejected for source mismatch. A valid edge requires fertilizer product and price, farm input use, crop or food price pass-through, household outcome, geography, period and confounders.',
  'Titles and abstracts reviewed for price exposure and food-security endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->arctic_amplification_rates::10.1038/s43247-022-00354-4',
    'carbon_emission->arctic_amplification_rates::10.1029/2020gl090301',
    'carbon_emission->arctic_amplification_rates::10.1021/acs.langmuir.9b01631'
  ], 'reject_scenario_or_co2_state_as_marginal_emissions_effect_and_nanoparticle_polysemy',
  'Two climate papers examine amplification under an emissions scenario or roles of surface state and carbon dioxide, without isolating aggregate carbon emissions as a marginal exposure. The third concerns nanoparticle aggregation-induced emission.',
  'Rejected for the collapsed edge or material polysemy. Preserve climate studies for a forcing-to-Arctic-amplification pathway with scenario, feedback decomposition and comparator retained.',
  'Titles, abstracts and available source context reviewed for exposure definition and amplification endpoint.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->hail_hazard_shift::10.1016/j.cej.2019.06.016',
    'carbon_emission->hail_hazard_shift::10.1016/j.jenvman.2025.127308',
    'carbon_emission->hail_hazard_shift::10.4155/cmt.12.65'
  ], 'reject_optical_shift_fire_emission_or_transport_modal_shift_as_hail',
  'The records concern fluorescence-emission wavelength shift, fire-governance effects on potential emissions, or transport modal-shift emissions. None measures hail frequency, size, damage or convective environment.',
  'Rejected as shift and emission polysemy.',
  'Titles and abstracts reviewed for physical endpoint and direction.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->rail_heat_buckling::10.1109/access.2024.3425911',
    'carbon_emission->rail_heat_buckling::10.1016/j.seps.2022.101308',
    'carbon_emission->rail_heat_buckling::10.17559/tv-20221011165754'
  ], 'reject_rail_emissions_accounting_as_heat_buckling',
  'The records calculate rail-system emissions or emissions efficiency. They do not measure rail temperature, neutral temperature, compressive stress, track geometry or buckling caused by carbon emissions.',
  'Rejected for reverse direction and target mismatch. Preserve for rail-transport emissions accounting only.',
  'Titles and abstracts reviewed for emissions direction and buckling endpoint.'),
  ...reviewedSourceRejectionBatch([
    'marine_heatwaves->fish_landing_supply_disruption::10.1038/d41586-023-02594-6',
    'marine_heatwaves->fish_landing_supply_disruption::10.1016/j.marenvres.2024.106567',
    'marine_heatwaves->fish_landing_supply_disruption::10.1007/s00227-025-04703-7'
  ], 'reject_fish_response_as_landing_supply_disruption_evidence',
  'The records discuss fish responses, green-crab larval supply, or reef-fish community shifts during marine heatwaves. None measures landed catch, port delivery, processing throughput, market supply, or a marine-heatwave-attributable disruption to fish landings.',
  'Rejected for the exact socioeconomic endpoint. Ecological redistribution, recruitment, or community change cannot be relabeled as a fish-landing supply disruption without fishery effort, management, catchability, landings, and market data.',
  'Titles, abstracts and available source text reviewed for fishery-supply endpoints and direction.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->rain_on_snow_flood_risk::10.1111/jfr3.12708'
  ], 'reject_flood_repair_carbon_footprint_as_emissions_to_flood_evidence',
  'The study estimates carbon emissions produced by flood-related home repairs. Flood damage is the exposure and repair emissions are the outcome, which is the reverse of the proposed carbon-emission to rain-on-snow flood-risk pathway.',
  'Rejected for reverse direction and because the source does not identify a rain-on-snow event.',
  'Title, abstract and accounting boundary reviewed.'),
  ...reviewedSourceRejectionBatch([
    'industry_farming->migration::10.1111/j.1468-2435.2012.00767.x',
    'industry_farming->migration::10.1111/imig.12298'
  ], 'reject_migration_smallholder_farming_feedback_as_industrial_farming_driver',
  'The studies examine how migration and remittances affect subsistence or smallholder farming and food security. They do not use industrial farming expansion or intensity as the migration exposure.',
  'Rejected for reverse direction and source-node mismatch. Retain only for migration-remittance-smallholder feedback research.',
  'Titles and abstracts reviewed for exposure, population and direction.'),
  ...reviewedSourceRejectionBatch([
    'industry_farming->nutrient_pollution::10.1016/j.marpolbul.2011.05.001',
    'industry_farming->nutrient_pollution::10.1016/j.marpolbul.2011.11.024',
    'industry_farming->nutrient_pollution::10.1016/j.marpolbul.2019.02.009'
  ], 'reject_shellfish_farming_nutrient_removal_or_limitation_as_industrial_agriculture_pollution',
  'These records concern mussel farming as nutrient removal, a commentary on that proposal, or phytoplankton nutrient limitation in a shellfish-farming area. They do not measure land-based industrial agriculture causing nutrient pollution.',
  'Rejected for source ontology and mechanism mismatch. Aquaculture nutrient cycling remains separate from fertilizer and manure runoff pathways.',
  'Titles and abstracts reviewed for production system, nutrient direction and receiving environment.'),
  ...reviewedSourceRejectionBatch([
    'mining_critical_minerals->biodiversity_intactness_loss::10.17159/2411-9717/2017/v117n1a1'
  ], 'reject_general_mining_biodiversity_case_as_biodiversity_intactness_metric_evidence',
  'The Richards Bay case addresses mining, people and biodiversity interfaces but does not isolate critical-mineral mining or estimate the platform Biodiversity Intactness endpoint against an explicit baseline.',
  'Rejected for the exact source and target. Preserve as contextual mining-biodiversity evidence, not as a metric-specific promotion anchor.',
  'Full article scope and endpoint definitions reviewed.'),
  ...reviewedSourceRejectionBatch([
    'deforestation->crop_yield_volatility::10.1111/ajae.12246',
    'deforestation->crop_yield_volatility::10.2139/ssrn.3383812'
  ], 'reject_crop_price_or_rotation_drivers_of_deforestation_as_reverse_yield_pathway',
  'The records study maize-price volatility or crop-rotation and biodiesel mandates as drivers of deforestation. They do not estimate deforestation causing crop-yield volatility.',
  'Rejected for reverse direction and because crop prices, rotations, or mandates are not crop-yield volatility.',
  'Titles, abstracts and causal direction reviewed.'),
  'permafrost_thaw->polar_infrastructure_failure::10.1038/s43247-024-01317-7': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open primary study predicts permafrost-thaw threat from ground ice and ground-surface temperature for three northern Canadian transportation corridors, reports existing thaw-related instability, and projects increasing threat in northern sections. IPCC SROCC independently assesses thaw-induced subsidence and infrastructure impacts across the Arctic.',
    reviewed_at: '2026-07-19', reviewer: 'northstar_full_text_readback_v1',
    evidence_boundary: 'Promoted as an asset-specific thaw-threat and failure-risk pathway on ice-bearing permafrost, not a claim that all polar infrastructure fails. Ground ice, foundation design, maintenance, drainage, snow, embankment effects, adaptation and local thermal conditions remain explicit moderators.',
    source_locators: Object.freeze([
      { url: 'https://www.nature.com/articles/s43247-024-01317-7', locator: 'Abstract; Study cases; Results Figures 3-6; Discussion; Methods: thaw index from present ground-ice distribution and predicted ground-surface temperature for Hudson Bay Railway, Mackenzie Northern Railway and Inuvik-Tuktoyaktuk Highway under RCP4.5 and RCP8.5.' },
      { url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', locator: 'Sections 3.4.1.2.2 and 3.4.3.3.4 and chapter key findings: ground-ice loss, subsidence, structural stability, functional capacity, infrastructure exposure and adaptation limits.' }
    ])
  }),
  ...reviewedSourceRejectionBatch([
    'permafrost_thaw->polar_infrastructure_failure::10.1386/jem_00125_1',
    'permafrost_thaw->polar_infrastructure_failure::10.1080/1088937x.2017.1329237'
  ], 'retain_historical_infrastructure_accounts_as_context_not_promotion_anchors',
  'The Mackenzie pipeline and Norilsk records provide historical, cultural, or urban-infrastructure context but do not supply a current bounded thaw-to-failure estimate with ground conditions, asset exposure, comparator and uncertainty.',
  'Rejected as primary promotion records after a directly applicable engineering threat study and authoritative assessment were identified.',
  'Publication type, historical scope and infrastructure endpoint reviewed.'),
  'environ_anomalies->overstory_tree_mortality::10.1016/j.scitotenv.2021.151604': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The European study uses two independent mortality datasets and directly evaluates co-occurring hot summers, elevated vapour-pressure deficit and dry years. It reports that 143 of 310 compiled mortality events coincided with rare compound events, with 34 percent of drought-defoliation cases and 27 percent of drought-mortality cases in ICP-Forest plots also coinciding.',
    reviewed_at: '2026-07-19', reviewer: 'northstar_full_text_readback_v1',
    evidence_boundary: 'Promoted as an observational compound-hot-dry hazard pathway in European forests. Coincidence proportions are not causal risk ratios, and species, stand, drought definition, VPD, pests, fire, management and prior condition remain separate.',
    source_locators: Object.freeze([
      { url: 'https://doi.org/10.1016/j.scitotenv.2021.151604', locator: 'Abstract, highlights, methods and results: compiled European mortality events plus ICP-Forest plots; hot-summer, VPD and dry-year compound-event definitions; 143/310, 34 percent and 27 percent coincidence results.' },
      { url: 'https://www.nature.com/articles/s41598-021-97762-x', locator: 'Independent open northern-Australia palaeoclimate and dieback analysis: compound antecedent and coincident conditions for 2015-2016 mangrove and 2020 inland forest dieback.' }
    ])
  }),
  'environ_anomalies->overstory_tree_mortality::10.1038/s41598-021-97762-x': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open study places two widespread northern Australian dieback events in a multi-century palaeoclimate context and identifies compound antecedent and coincident hazards, including an exceptionally long and intense drought coupled with rising temperatures for inland forests.',
    reviewed_at: '2026-07-19', reviewer: 'northstar_full_text_readback_v1',
    evidence_boundary: 'Promoted as event-based corroboration, not a universal tree-mortality coefficient. The mangrove and inland forest events have different antecedent conditions, ecosystems and attribution limits.',
    source_locators: Object.freeze([
      { url: 'https://www.nature.com/articles/s41598-021-97762-x', locator: 'Abstract; event reconstructions; palaeoclimate compilation; Discussion: 2015-2016 mangrove dieback and 2020 inland forest dieback, antecedent conditions, compound hazards and resilience thresholds.' },
      { url: 'https://doi.org/10.1016/j.scitotenv.2021.151604', locator: 'Independent European two-dataset analysis of hot-summer, elevated-VPD and dry-year compound events with defoliation and mortality outcomes.' }
    ])
  }),
  ...reviewedSourceRejectionBatch([
    'deforestation->drought_persistence::10.1029/2019eo135195',
    'deforestation->drought_persistence::10.1126/science.347.6229.1427-a',
    'deforestation->drought_persistence::10.3390/rs14225630'
  ], 'reject_news_commentary_or_cooccurrence_as_bounded_deforestation_drought_persistence_study',
  'The Eos item and Science commentary summarize concerns, while the remote-sensing study tracks deforestation, drought and fire occurrence in one park. None isolates forest loss as a cause of drought duration or persistence with moisture recycling, circulation, baseline and competing climate modes controlled.',
  'Rejected as promotion anchors. The candidate remains researchable with primary land-atmosphere moisture-recycling or intervention evidence.',
  'Publication type, study design, geography and causal estimand reviewed.'),
  ...reviewedSourceRejectionBatch([
    'building_performance_standards->carbon_emission::10.1016/j.buildenv.2025.112953',
    'building_performance_standards->carbon_emission::10.1186/s13021-025-00326-z',
    'building_performance_standards->carbon_emission::10.1016/j.conbuildmat.2025.141034'
  ], 'reject_carbon_trading_scenario_or_material_performance_as_building_standard_intervention',
  'The records study carbon trading, scenario emission standards without an identified building-performance intervention, or cementitious-material performance. None evaluates adoption or enforcement of a building performance standard against a building-emissions baseline.',
  'Rejected for intervention mismatch. A valid contract needs standard stringency, covered floor area, compliance, weather, occupancy, energy use, grid factors and embodied-operational boundaries.',
  'Titles, abstracts and intervention definitions reviewed.'),
  ...reviewedSourceRejectionBatch([
    'methane->extreme_precipitation_intensity::10.1002/2015gl065854',
    'methane->extreme_precipitation_intensity::10.1016/j.envres.2024.118907',
    'methane->extreme_precipitation_intensity::10.3390/atmos17040409'
  ], 'reject_emissions_scenario_or_precipitation_to_wetland_methane_as_methane_specific_driver',
  'The first study compares broad emissions scenarios without isolating methane. The other two estimate wetland methane responses to extreme temperature or precipitation, reversing the proposed direction.',
  'Rejected for source specificity and reverse causality. A methane-specific precipitation edge requires a forcing experiment that isolates methane from other agents and reports regional precipitation-intensity response.',
  'Titles, abstracts and modeled direction reviewed.'),
  ...reviewedSourceRejectionBatch([
    'aviation_condensation_trails->temp::10.1111/j.1365-2966.2010.16900.x'
  ], 'reject_stellar_condensation_temperature_polysemy',
  'The astronomy paper concerns elemental condensation temperature in stars and has no relationship to aviation contrails or terrestrial temperature.',
  'Rejected as complete terminology polysemy.',
  'Title and discipline reviewed.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->coastal_permafrost_erosion::10.2112/jcr-si113-090.1',
    'carbon_emission->coastal_permafrost_erosion::10.1029/2018eo093987',
    'carbon_emission->coastal_permafrost_erosion::10.1002/2017jg004166'
  ], 'reject_permafrost_erosion_carbon_release_as_reverse_emissions_pathway',
  'All three records measure carbon emissions or organic-carbon flux caused by coastal permafrost erosion. They do not estimate carbon emissions causing coastal erosion.',
  'Rejected for reverse direction. Preserve for coastal_permafrost_erosion->carbon_emission or carbon-flux evidence only.',
  'Titles, abstracts and flux direction reviewed.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->desertification_frontiers::10.2134/jeq2009.0223',
    'carbon_emission->desertification_frontiers::10.3390/agriculture14122151',
    'carbon_emission->desertification_frontiers::10.1016/j.apsoil.2025.106168'
  ], 'reject_dryland_soil_carbon_flux_as_emissions_to_desertification_evidence',
  'The studies evaluate dryland soil carbon dioxide emissions, land-conversion carbon efficiency, or soil-carbon degradation under warming. They do not estimate aggregate carbon emissions advancing a mapped desertification frontier.',
  'Rejected for reverse or mediated direction and target mismatch. A defensible edge requires an emissions-to-climate-to-aridity attribution chain and a defined land-degradation frontier metric.',
  'Titles, abstracts and outcome definitions reviewed.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->fjord_sedimentation_pulses::10.1016/j.catena.2017.03.011',
    'carbon_emission->fjord_sedimentation_pulses::10.1029/2025eo250187',
    'carbon_emission->fjord_sedimentation_pulses::10.1029/2024ef004891'
  ], 'reject_soil_fjord_carbon_or_emissions_pulse_polysemy_as_fjord_sedimentation',
  'The records concern rainfall pulses affecting soil carbon emissions, seaweed effects on fjord carbon dynamics, or positive and negative emissions pulses in net-zero pathways. None measures sediment delivery or deposition pulses in a fjord caused by carbon emissions.',
  'Rejected for endpoint and pulse polysemy. Fjord carbon cycling and fjord sedimentation are separate processes.',
  'Titles, abstracts and physical endpoints reviewed.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->inland_waterway_fuel_spills::10.1016/j.rsma.2026.105032',
    'carbon_emission->inland_waterway_fuel_spills::10.1016/j.ocecoaman.2023.106906',
    'carbon_emission->inland_waterway_fuel_spills::10.56367/oag-050-12513'
  ], 'reject_inland_shipping_emissions_as_fuel_spill_evidence',
  'The studies evaluate inland-waterway transport emissions, LNG ship economics, or zero-emission digital twins. They do not measure fuel-spill occurrence, volume, pathway or consequence.',
  'Rejected for target mismatch. Vessel emissions accounting cannot support a spill-risk relationship.',
  'Titles and abstracts reviewed for spill endpoints.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->overstory_tree_mortality::10.2139/ssrn.4040387',
    'carbon_emission->overstory_tree_mortality::10.1016/j.carbon.2010.03.022',
    'carbon_emission->overstory_tree_mortality::10.1007/s11676-024-01776-w'
  ], 'reject_wildfire_common_cause_material_emission_or_forest_carbon_storage_as_emissions_to_mortality',
  'The first record treats wildfire severity as a common cause of tree mortality and carbon emissions. The second is field emission from carbon nanotubes, and the third compares forest carbon storage. None isolates atmospheric carbon emissions as the exposure causing overstory mortality.',
  'Rejected for reverse/common-cause direction, material-science polysemy, or endpoint mismatch.',
  'Titles, abstracts and causal direction reviewed.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->rainforest_savannization::10.64096/0002001104',
    'carbon_emission->rainforest_savannization::10.1126/science.aab0336',
    'carbon_emission->rainforest_savannization::10.7176/jrdm/63-06'
  ], 'reject_forest_carbon_sink_or_stock_records_as_savannization_transition_evidence',
  'The records address enrichment planting, a declining Amazon carbon sink, or tropical-forest carbon-stock valuation. They do not measure a rainforest-to-savanna ecological transition caused by carbon emissions.',
  'Rejected for target mismatch and reverse carbon-cycle framing. A valid edge needs emissions-forcing attribution plus vegetation-state transition metrics and regional hydroclimate mechanisms.',
  'Titles, abstracts and ecosystem-state endpoints reviewed.'),
  ...reviewedSourceRejectionBatch([
    'carbon_emission->reef_structural_collapse::10.1016/j.prostr.2025.07.108',
    'carbon_emission->reef_structural_collapse::10.3389/feart.2022.1073167',
    'carbon_emission->reef_structural_collapse::10.1016/j.carbon.2014.04.002'
  ], 'reject_concrete_accounting_or_carbon_material_structure_polysemy_as_coral_reef_collapse',
  'The records concern concrete performance, urban emissions decomposition, or carbon-nanofiber structure. None studies coral reefs or carbonate-framework collapse.',
  'Rejected as complete structural and carbon terminology polysemy.',
  'Titles, disciplines and physical targets reviewed.'),
  ...reviewedSourceRejectionBatch([
    'environ_anomalies->farm_heat_stress::10.1029/2022gl100880',
    'environ_anomalies->farm_heat_stress::10.1038/s41612-024-00579-4',
    'environ_anomalies->farm_heat_stress::10.5194/nhess-21-1867-2021'
  ], 'reject_general_compound_heat_or_model_evaluation_as_farm_specific_heat_stress',
  'The studies assess lethal compound heat-hydrological drought, future compound heat-heavy-precipitation hazards, or climate-model bias evaluation. They do not measure farm workers, livestock, crops, agricultural operations or a farm-specific heat-stress outcome.',
  'Rejected for target specificity. Preserve as general compound-hazard research, not agricultural impact evidence.',
  'Full abstracts and stated endpoints reviewed.'),
  ...reviewedSourceRejectionBatch([
    'temp->dust_storm_frequency::10.1016/j.palaeo.2017.05.005',
    'temp->dust_storm_frequency::10.1007/s11069-021-04962-9',
    'temp->dust_storm_frequency::10.65599/iii4230'
  ], 'reject_proxy_reconstruction_regional_association_or_event_profile_as_global_temperature_driver',
  'The studies use sea-surface-temperature proxies to reconstruct historical dust, describe regional dust associations with temperature and precipitation, or profile temperature during dust events. None isolates Global Temperature as a causal exposure changing dust-storm frequency.',
  'Rejected for proxy, scale and direction mismatch. Dust emissions require wind, soil moisture, vegetation, land use and source-area controls.',
  'Study design, geography and causal direction reviewed.'),
  ...reviewedSourceRejectionBatch([
    'temp->shelf_sea_hypoxia::10.1016/j.csr.2016.07.011',
    'temp->shelf_sea_hypoxia::10.1016/j.csr.2010.03.003',
    'temp->shelf_sea_hypoxia::10.1016/j.csr.2012.12.003'
  ], 'reject_sea_surface_temperature_dynamics_without_hypoxia_endpoint',
  'The studies concern temperature-wind coupling, seasonal sea-surface-temperature patterns, or bottom-roughness effects on modeled temperature. None measures dissolved oxygen, hypoxic area, duration or threshold exceedance.',
  'Rejected for missing target endpoint. Temperature observations alone cannot establish shelf-sea hypoxia.',
  'Titles and abstracts reviewed for dissolved-oxygen outcomes.'),
  ...reviewedSourceRejectionBatch([
    'building_performance_standards->grid_peak_load_stress::10.1080/19401493.2022.2119601',
    'building_performance_standards->grid_peak_load_stress::10.1109/tsg.2022.3159365',
    'building_performance_standards->grid_peak_load_stress::10.1080/19401493.2018.1535624'
  ], 'reject_appliance_scheduling_or_building_control_as_performance_standard_policy',
  'The studies test appliance scheduling, predictive control or thermostatic demand response. They do not evaluate adoption, stringency, compliance or enforcement of a building performance standard.',
  'Rejected for intervention mismatch. Control strategies may support demand response but cannot be attributed to a policy standard without a policy design.',
  'Interventions, baselines and grid endpoints reviewed.'),
  ...reviewedSourceRejectionBatch([
    'deforestation->livestock_disease_pressure::10.1016/j.landusepol.2020.105195',
    'deforestation->livestock_disease_pressure::10.2139/ssrn.2575610',
    'deforestation->livestock_disease_pressure::10.1016/j.landusepol.2020.104949'
  ], 'reject_livestock_as_driver_of_deforestation_as_reverse_disease_pathway',
  'The records analyze cattle, pasture, fire or livestock intensification as drivers of deforestation. They do not measure deforestation causing livestock disease pressure.',
  'Rejected for reverse direction and absent animal-health endpoint.',
  'Titles, abstracts and outcome definitions reviewed.'),
  ...reviewedSourceRejectionBatch([
    'wet_bulb_heat->critical_infrastructure_fragility::10.1080/15732479.2025.2486291',
    'wet_bulb_heat->critical_infrastructure_fragility::10.1152/japplphysiol.00657.2022'
  ], 'reject_wet_cooling_tower_or_human_wbgt_limit_as_infrastructure_fragility',
  'The first study is a seismic fragility analysis of a wet cooling tower; wet describes cooling technology, not humid heat. The second evaluates human thermoregulatory WBGT limits. Neither measures infrastructure failure caused by wet-bulb heat.',
  'Rejected for source or target mismatch.',
  'Full abstracts and exposure definitions reviewed.'),
  ...reviewedSourceRejectionBatch([
    'wet_bulb_heat->public_health_heat_burden::10.1186/s12889-025-25655-z',
    'wet_bulb_heat->public_health_heat_burden::10.1016/j.envres.2018.09.032',
    'wet_bulb_heat->public_health_heat_burden::10.1152/physiol.2023.38.s1.5734524'
  ], 'reject_wbgt_or_conference_model_as_thermodynamic_wet_bulb_endpoint_evidence',
  'The first two studies use Wet-Bulb Globe Temperature, which includes radiation and wind terms and is not the platform source metric T2MWET. The third is a conference abstract comparing modeled fatal-heat indices. None is used as the primary thermodynamic wet-bulb exposure anchor.',
  'Rejected to preserve the explicit WBT-versus-WBGT measurement boundary. A separate 2024 Science Advances study using actual wet-bulb temperature and population mortality is retained as the promotion anchor.',
  'Exposure formulas, study designs and health endpoints reviewed.'),
  ...reviewedSourceRejectionBatch([
    'feed_crop_dependency->food_insecurity::10.20474/jabs-9.3.1',
    'feed_crop_dependency->food_insecurity::10.55248/gengpi.6.0625.23103',
    'feed_crop_dependency->food_insecurity::10.1002/sd.71452'
  ], 'reject_general_economic_import_or_crop_structure_dependency_as_livestock_feed_crop_exposure',
  'The studies address economic dependency, staple-crop import tariffs or agricultural production structure. They do not measure the share of crop supply diverted to livestock feed as the food-insecurity exposure.',
  'Rejected for source-node mismatch. Feed-crop dependency requires source-reported feed allocation, food availability, prices and household food-security outcomes.',
  'Titles, abstracts and exposure definitions reviewed.'),
});

const JULY_25_CORRECTED_QUEUE_REJECTIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'battery_supply_chain_pressure->carbon_emission::10.1016/j.clscn.2025.100248',
    'battery_supply_chain_pressure->carbon_emission::10.20517/cf.2024.51'
  ], 'reject_battery_operations_or_carbon_accounting_as_supply_pressure_exposure',
  'The studies model lead-acid battery manufacturing and recycling policy or allocate carbon responsibility across the electric-vehicle battery supply chain. They quantify emissions within battery operations, but do not use battery-material demand relative to refined supply—the platform Battery Supply Chain Pressure metric—as the exposure.',
  'Rejected for battery_supply_chain_pressure->carbon_emission. Preserve as possible process-emissions or carbon-accounting evidence only after defining production, recycling, material, facility, geography, period and system boundary; it does not establish a supply-margin-to-emissions effect.',
  'Publisher abstract and study framing reviewed: emissions policy or responsibility allocation is the modeled object; battery-material demand-to-refined-supply pressure is not the exposure.'),
  ...july25ReviewedRejectionBatch([
    'battery_supply_chain_pressure->carbon_emission::10.1016/j.clscn.2022.100037'
  ], 'reject_generic_manufacturing_supply_chain_model_as_battery_pressure_evidence',
  'The record models carbon-emission reduction, manufacturing decisions and lead time in a generic supply chain under uncertain demand. It does not study batteries, battery materials, refined supply or the platform pressure indicator.',
  'Rejected as source-node mismatch. Generic supply-chain optimization cannot support a battery-material demand-to-supply-pressure relationship.',
  'Bibliographic title and journal metadata reviewed; no battery or battery-material endpoint is identified.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->air_pollution_health_burden::10.1021/acsestair.5c00171'
  ], 'reject_air_pollutant_inventory_as_carbon_emissions_exposure',
  'The India study uses inventories of aerosols and precursor air pollutants to model PM2.5 and ozone concentrations and attributable mortality. Its health result is tied to ambient PM2.5 exposure, not territorial carbon-dioxide emissions.',
  'Rejected for carbon_emission->air_pollution_health_burden. The reported India mortality estimate and 95 percent interval may support a separately bounded PM2.5 or air-pollutant-emissions pathway, but cannot be assigned to carbon dioxide emissions.',
  'Publisher full-text Introduction, Methods 2.1 and health-impact results reviewed: AEIM-India contains aerosol and precursor species; the mortality estimate is explicitly for ambient PM2.5 exposure.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->anoxic_dead_zones::10.3390/en16196928',
    'carbon_emission->anoxic_dead_zones::10.2112/jcr-si115-126.1',
    'carbon_emission->anoxic_dead_zones::10.1016/j.ocecoaman.2022.106419'
  ], 'reject_low_emission_zone_or_coastal_emissions_accounting_as_anoxic_dead_zone_evidence',
  'The records concern urban low-emission zones, regional carbon-intensity auditing, or ship-emissions estimation in coastal control areas. The word zone or coastal describes regulation or geography; none measures dissolved oxygen, hypoxia, anoxia or dead-zone formation.',
  'Rejected as target polysemy. A valid carbon-emissions-to-anoxia study must identify the ocean-climate mechanism, receiving water, oxygen threshold, nutrient and stratification covariates, geography and period.',
  'Bibliographic titles and publication scopes reviewed; no dissolved-oxygen or hypoxia endpoint is present.')
});

const JULY_25_THROTTLE_RECOVERY_REJECTIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'carbon_emission->airport_climate_exposure::10.5465/amproc.2025.16142abstract',
    'carbon_emission->airport_climate_exposure::10.61935/acetr.4.1.2024.p158',
    'carbon_emission->airport_climate_exposure::10.21552/cclr/2016/3/7'
  ], 'reject_emissions_outsourcing_airport_inventory_or_climate_finance_as_airport_exposure',
  'The records concern generic physical-climate exposure and emissions outsourcing, carbon-emissions prediction for an airport, or climate-finance law. None measures carbon emissions as an upstream cause of physical climate exposure at airports.',
  'Rejected for carbon_emission->airport_climate_exposure. Airport operational emissions, climate-finance rules and airport exposure to heat, flood, wind or sea-level hazards require separate estimands and cannot be linked by keyword co-occurrence.',
  'Titles and available publication context reviewed; no emissions-to-airport-hazard exposure design is identified.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->coastal_erosion::10.1016/j.ecss.2019.106289',
    'carbon_emission->coastal_erosion::10.5194/bg-11-945-2014',
    'carbon_emission->coastal_erosion::10.1016/j.ecss.2015.08.001'
  ], 'reject_reverse_erosion_to_carbon_flux_or_storage_direction',
  'These studies quantify carbon export, burial, storage or emissions associated with erosion. Erosion is the exposure or physical process and carbon movement is the outcome; they do not estimate carbon emissions causing coastal erosion.',
  'Rejected for the queued direction. Preserve only for bounded coastal-erosion-to-carbon-export or sediment-carbon-accounting relationships with shoreline, sediment, carbon pool, period and mass-balance boundary retained.',
  'Titles and study direction reviewed; erosion-driven carbon dynamics are explicit.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->cooling_equity_gaps::10.1038/s41467-023-43309-9',
    'carbon_emission->cooling_equity_gaps::10.2139/ssrn.1809727',
    'carbon_emission->cooling_equity_gaps::10.2139/ssrn.2666753'
  ], 'reject_air_quality_distribution_carbon_inequality_or_financial_equity_as_cooling_access',
  'The papers concern distributional air-quality effects of zero-emission vehicles, a carbon-inequality index, or equity-market returns. Equity means population distribution or financial securities, not access to cooling or heat adaptation.',
  'Rejected as target polysemy. Cooling equity requires measured indoor heat, cooling access, affordability, outage or adaptation coverage and population vulnerability under a declared geography and period.',
  'Titles and available abstracts reviewed; no cooling-access endpoint is present.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->estuarine_nursery_loss::10.1016/j.ecss.2016.01.001',
    'carbon_emission->estuarine_nursery_loss::10.1016/j.ecss.2016.01.024',
    'carbon_emission->estuarine_nursery_loss::10.1016/j.ecss.2020.106888'
  ], 'reject_habitat_loss_to_carbon_storage_response_as_emissions_to_nursery_loss',
  'The studies measure carbon-storage change after seagrass, mangrove or biomass loss. Habitat decline is upstream of the carbon outcome, and none evaluates nursery function or carbon emissions as the exposure.',
  'Rejected for direction and target mismatch. Estuarine nursery loss requires habitat extent or condition plus juvenile-fish recruitment, survival or production evidence; blue-carbon stock loss is a different outcome.',
  'Titles and study scopes reviewed; carbon sequestration or sediment carbon responds to habitat loss.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->forest_dieback_areas::10.1186/s13021-023-00246-w',
    'carbon_emission->forest_dieback_areas::10.1016/j.forpol.2025.103541',
    'carbon_emission->forest_dieback_areas::10.1016/j.foreco.2023.121267'
  ], 'reject_dieback_to_carbon_stock_forest_policy_or_shrub_response_as_emissions_driver',
  'The records model forest carbon after drought-induced dieback, estimate emissions reductions associated with forest-city policy, or study ecosystem conditions after shrub dieback. None identifies carbon emissions as the exposure causing forest dieback.',
  'Rejected for the queued direction. A valid pathway must preserve greenhouse forcing or warming exposure, drought and hydraulic mediators, tree mortality definition, biome, geography, period and alternative disturbance causes.',
  'Titles and available abstracts reviewed; dieback is an exposure or forest condition, not an emissions-caused endpoint.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->humidity_amplification::10.5194/acp-10-6617-2010',
    'carbon_emission->humidity_amplification::10.1016/j.atmosenv.2023.119620',
    'carbon_emission->humidity_amplification::10.1016/j.atmosenv.2012.10.002'
  ], 'reject_moisture_control_of_combustion_or_pesticide_emissions_as_humidity_response',
  'The studies treat fuel or soil moisture as a control on biomass-combustion, wood-combustion or pesticide emissions. This reverses the proposed direction and does not measure atmospheric humidity amplification caused by carbon emissions.',
  'Rejected for carbon_emission->humidity_amplification. Moisture-dependent source emissions and greenhouse-forcing-driven atmospheric moisture change are different mechanisms and units.',
  'Titles and exposure directions reviewed; moisture is the predictor.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->hydrological_runoff_surges::10.1016/j.eneco.2022.106160',
    'carbon_emission->hydrological_runoff_surges::10.1061/(asce)ee.1943-7870.0000274',
    'carbon_emission->hydrological_runoff_surges::10.1016/j.carbon.2013.03.039'
  ], 'reject_carbon_market_traffic_runoff_pollution_or_material_response_as_runoff_surge',
  'The records concern carbon-permit pricing, traffic-generated pollutants entering urban runoff, or electrothermal response of carbon-nanotube films. None measures rapid hydrological runoff response caused by carbon emissions.',
  'Rejected for endpoint and domain mismatch. Hydrological runoff surges require precipitation or melt input, basin response, discharge or runoff units, event timing and catchment controls.',
  'Titles and publication domains reviewed; no runoff-discharge surge endpoint is present.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->ice_algae_pigmentation::10.1016/j.biortech.2016.03.060',
    'carbon_emission->ice_algae_pigmentation::10.1016/j.jclepro.2025.146881',
    'carbon_emission->ice_algae_pigmentation::10.1002/lno.10351'
  ], 'reject_algal_carbon_capture_wastewater_accounting_or_food_web_carbon_as_ice_pigmentation',
  'The papers concern algal CO2 capture, carbon accounting in algae-based wastewater treatment, or trophic transfer of ice-algae-produced carbon. None studies pigmentation change in ice algae or carbon emissions as its driver.',
  'Rejected for target mismatch and, where applicable, reverse carbon direction. Ice-algae pigmentation requires pigment or optical measurements, species or community, ice environment, light and nutrient context, geography and time.',
  'Titles and available abstracts reviewed; pigmentation is absent.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->ice_cap_decapitation::10.3390/su13126940',
    'carbon_emission->ice_cap_decapitation::10.3390/su10030580',
    'carbon_emission->ice_cap_decapitation::10.3390/su16167115'
  ], 'reject_cap_and_trade_policy_polysemy_as_ice_cap_loss',
  'In all three records, cap refers to an emissions cap or cap-and-trade policy. None studies an ice cap, glacier geometry, summit lowering or decapitation.',
  'Rejected as complete target polysemy. Carbon-market caps cannot support a cryosphere relationship.',
  'Titles and policy scopes reviewed; ice and glacier endpoints are absent.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->mountain_pass_avalanches::10.21275/v4i12.nov152200',
    'carbon_emission->mountain_pass_avalanches::10.1002/bse.2193',
    'carbon_emission->mountain_pass_avalanches::10.1038/s41598-025-95156-x'
  ], 'reject_acoustic_emission_financial_pass_through_or_mountain_zoning_as_avalanche_edge',
  'The records concern acoustic emissions from snow, financial pass-through of carbon cost, or land-use carbon zoning in a mountain region. None estimates atmospheric carbon emissions causing avalanches at mountain passes.',
  'Rejected for source, target or mechanism mismatch. Avalanche evidence requires snowpack, loading, temperature, precipitation, terrain, trigger and event data under a named mountain domain.',
  'Titles and domains reviewed; pass and emission are polysemous or avalanche causation is absent.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->nunatak_habitat_shrinkage::10.3390/land14050975',
    'carbon_emission->nunatak_habitat_shrinkage::10.14359/51702196'
  ], 'reject_urban_or_cement_shrinkage_polysemy_as_nunatak_habitat_loss',
  'The studies concern urban population shrinkage or autogenous shrinkage of cement nanocomposites. Neither concerns nunataks, deglaciated habitat or polar biogeography.',
  'Rejected as target polysemy and prohibited from cryosphere-habitat evidence.',
  'Titles and publication domains reviewed; no nunatak or habitat endpoint exists.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->port_heat_vulnerability::10.1016/j.envpol.2023.121000',
    'carbon_emission->port_heat_vulnerability::10.3390/buildings16050892',
    'carbon_emission->port_heat_vulnerability::10.3390/en19143373'
  ], 'reject_port_or_building_emissions_accounting_as_heat_vulnerability',
  'The records inventory port emissions, assess building operational carbon, or model port carbon-emissions drivers and decoupling. None measures heat exposure, heat-related operational disruption or vulnerability at ports.',
  'Rejected for target mismatch and possible reverse accounting direction. Port heat vulnerability requires temperature or heat index, asset or labor exposure, operational failure or delay, adaptation and named port geography and period.',
  'Titles and available abstracts reviewed; heat vulnerability is absent.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->savannah_tree_cover_decline::10.1093/aob/mcag122',
    'carbon_emission->savannah_tree_cover_decline::10.1016/j.nxsust.2025.100229',
    'carbon_emission->savannah_tree_cover_decline::10.1093/treephys/tpag024'
  ], 'reject_plant_carbon_starvation_fire_stock_or_carbon_gain_as_emissions_to_tree_cover',
  'The studies concern plant carbon starvation under tree encroachment, fire effects on tree structure and carbon stock, or tree hydraulic strategy and carbon gain. Carbon is physiological or ecosystem stock terminology, not anthropogenic carbon emissions as the exposure.',
  'Rejected for source and direction mismatch. Savanna tree-cover decline requires remote-sensing or inventory change plus fire, grazing, drought, land use and climate attribution under a declared region and period.',
  'Titles and study scopes reviewed; anthropogenic emissions are not the identified exposure.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->staple_food_price_volatility::10.21511/ee.08(4).2017.01',
    'carbon_emission->staple_food_price_volatility::10.2139/ssrn.2467366',
    'carbon_emission->staple_food_price_volatility::10.47260/jrc/1211'
  ], 'reject_carbon_allowance_price_volatility_as_staple_food_prices',
  'All three records analyze prices or volatility in carbon-emissions permits, rights or futures. They do not study staple foods, agricultural commodity markets or household food prices.',
  'Rejected as target polysemy. Carbon-market prices and staple-food prices are distinct markets and cannot be merged by the words price and volatility.',
  'Titles and financial-market scopes reviewed; no food-price endpoint is present.')
});

const JULY_25_FRESH_INTAKE_DECISIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'carbon_emission->thermokarst_expansion::10.1016/j.indic.2024.100416',
    'carbon_emission->thermokarst_expansion::10.3390/su141912090',
    'carbon_emission->thermokarst_expansion::10.1016/j.gloplacha.2026.105411',
    'carbon_emission->tundra_shrubification_speeds::10.5194/bg-22-5031-2025',
    'carbon_emission->tundra_shrubification_speeds::10.1016/j.soilbio.2018.02.002',
    'carbon_emission->tundra_shrubification_speeds::10.1088/1748-9326/aab863'
  ], 'reject_reverse_carbon_cycle_consequence_as_emissions_driver',
  'The thermokarst and tundra-shrub studies quantify carbon emissions or carbon cycling as consequences of thermokarst lakes, snow conditions, warming or shrub expansion. The other records use urban and highway expansion, not thermokarst. None isolates anthropogenic carbon emissions as the direct exposure causing the named land-surface transition.',
  'Rejected for the queued direct edges. Preserve the established mediated pathway through global temperature and permafrost or tundra processes, and retain the papers only for downstream carbon feedbacks or narrower shrub-soil-carbon relationships.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->watershed_forest_loss::10.1016/j.agrformet.2025.110861',
    'carbon_emission->watershed_forest_loss::10.1016/j.agrformet.2023.109381',
    'carbon_emission->watershed_forest_loss::10.2166/wcc.2023.208'
  ], 'reject_watershed_carbon_accounting_or_reverse_forest_loss_direction',
  'The records concern watershed carbon and nitrogen cycling, wetland-soil carbon dioxide emissions, or forest-cover change as an upstream determinant of carbon stocks, emissions and land-surface temperature. They do not show carbon emissions directly causing watershed forest loss.',
  'Rejected for carbon_emission->watershed_forest_loss. A valid pathway would require warming, drought, fire, pests or land-use pressure as an explicit mediator and cannot skip from aggregate emissions directly to local forest loss.'),
  ...july25ReviewedRejectionBatch([
    'demand_response->carbon_emission::10.3390/en19122785',
    'demand_response->carbon_emission::10.3390/su18094398'
  ], 'reject_future_or_redundant_demand_response_metadata_for_current_promotion',
  'These 2026 records are not needed to establish the promoted relationship and do not replace the bounded 2024 Fangshan full-text case. Their metadata alone is insufficient to verify dispatch boundary, counterfactual load, rebound, carbon-factor method and uncertainty.',
  'Rejected as promotion evidence for the current cycle. They may be reconsidered after exact full-text review if they contribute a distinct observed or modeled estimand with complete carbon-accounting boundaries.'),
  ...july25ReviewedRejectionBatch([
    'temp->agricultural_labor_exposure::10.1016/j.glohj.2025.11.004',
    'temp->agricultural_labor_exposure::10.2139/ssrn.5368218',
    'temp->agricultural_labor_exposure::10.22194/jgias/24.1493'
  ], 'reject_local_weather_or_nonhuman_endpoint_as_global_temperature_exposure',
  'The records concern local occupational heat and WBGT in Thailand, temperature and rainfall associations with agricultural production and income in Bangladesh, or beetle mortality. They do not estimate the platform Global Temperature node as an exposure to human agricultural-labor heat burden.',
  'Rejected for temp->agricultural_labor_exposure. Preserve the Thailand study for a narrower local heat or WBGT-to-worker-strain relationship; exclude the nonhuman beetle endpoint entirely.'),
  ...july25ReviewedRejectionBatch([
    'temp->amoc::10.1175/jcli-d-22-0331.1',
    'temp->amoc::10.3390/rs13204096',
    'temp->amoc::10.1007/s00704-018-2387-7'
  ], 'reject_remote_amoc_effect_or_slowdown_polysemy_as_temperature_to_amoc',
  'The first paper contrasts a remote AMOC influence with regional forcing for Indonesian Throughflow slowdown. The other records concern wave-height or atmospheric-temperature slowdown. None estimates global surface temperature as the upstream cause of AMOC change.',
  'Rejected for temp->amoc. AMOC response requires freshwater, buoyancy, circulation and forcing diagnostics in an Earth-system or observational attribution design; the word slowdown is not sufficient.'),
  ...july25ReviewedRejectionBatch([
    'temp->basin_treaty_breakdown::10.12652/ksce.2014.34.4.1151',
    'temp->basin_treaty_breakdown::10.1504/ijgw.2024.10059272',
    'temp->basin_treaty_breakdown::10.1504/ijgw.2024.136517'
  ], 'reject_basin_climate_record_without_treaty_governance_endpoint',
  'The papers analyze basin precipitation or temperature. They contain no treaty withdrawal, noncompliance, renegotiation, conflict-resolution failure or other governance endpoint.',
  'Rejected for temp->basin_treaty_breakdown. A defensible governance edge requires a named treaty system, hydroclimatic exposure, institutional response, period, competing political drivers and documented breakdown outcome.'),
  ...july25ReviewedRejectionBatch([
    'temp->floodplain_exposure::10.1016/j.gloplacha.2024.104427',
    'temp->floodplain_exposure::10.1038/s43247-025-03066-7',
    'temp->floodplain_exposure::10.3390/su16125007'
  ], 'reject_general_compound_hazard_population_exposure_as_floodplain_exposure',
  'The records project exposure to compound temperature-precipitation extremes or apparent-temperature whiplash. They do not measure people or assets located in floodplains, inundation depth, flood frequency or floodplain development.',
  'Rejected for temp->floodplain_exposure. Population exposure to broad compound events is not interchangeable with the platform floodplain-location and inundation-risk endpoint.'),
  ...july25ReviewedRejectionBatch([
    'temp->hydrological_runoff_surges::10.1111/gcb.70792',
    'temp->hydrological_runoff_surges::10.1029/2018gl078646',
    'temp->hydrological_runoff_surges::10.1111/gcb.70474'
  ], 'reject_runoff_mean_or_variability_and_plant_physiology_as_runoff_surge_endpoint',
  'The Geophysical Research Letters study is directly relevant to global-mean-temperature effects on long-term mean runoff and interannual runoff variability, including nonlinear basin responses, but it does not estimate event-scale runoff surges or peak-flow ratios. The other two records concern photosynthetic acclimation and its correction.',
  'Rejected only for the hydrological_runoff_surges endpoint. Preserve DOI 10.1029/2018GL078646 for a future runoff-mean or runoff-variability node with basin, warming level and nonlinear change points retained.'),
  ...july25ReviewedRejectionBatch([
    'temp->ocean_current_regime_shift::10.1038/s41598-018-28386-x',
    'temp->ocean_current_regime_shift::10.1038/s41467-026-70986-z',
    'temp->ocean_current_regime_shift::10.1016/j.gloplacha.2021.103656'
  ], 'reject_temperature_regime_or_subsurface_variability_as_ocean_current_shift',
  'The records concern warning signs of temperature regime shifts, marine-ecosystem sea-surface-temperature regimes, or Indian Ocean subsurface temperature variability associated with circulation. They do not identify global surface temperature as the driver of a named ocean-current regime shift.',
  'Rejected for temp->ocean_current_regime_shift. Preserve circulation-specific studies only when the current, forcing, direction, model or observation design and uncertainty are explicit.'),
  ...july25ReviewedRejectionBatch([
    'temp->water_stress::10.3390/w12123574',
    'temp->water_stress::10.5006/1443',
    'temp->water_stress::10.1111/gcb.13121'
  ], 'reject_water_temperature_material_stress_or_tree_water_stress_as_baseline_water_stress',
  'The records concern lake water temperature, alloy stress-corrosion, or temperature-induced physiological water stress in high-latitude forests. The platform target is baseline water withdrawals relative to renewable supply, not thermal or plant water stress.',
  'Rejected as target polysemy for temp->water_stress. Forest hydraulic stress may support a separate tree-drought pathway, while basin water stress requires withdrawals, supply, return flows and environmental-flow accounting.'),
  ...july25ReviewedRejectionBatch([
    'urbanization->carbon_emission::10.3390/su172310555'
  ], 'reject_carbon_emission_efficiency_bipolarization_as_total_emissions_effect',
  'The title concerns bipolarization of carbon-emission efficiency across cities rather than the promoted territorial carbon-emissions outcome, and metadata alone does not establish the exact urbanization exposure, sign, inventory boundary or uncertainty.',
  'Rejected for the current urbanization->carbon_emission evidence contract. It may inform a separate emissions-efficiency distribution relationship after full-text variable and model review.'),
  ...july25ReviewedRejectionBatch([
    'deforestation->extreme_precipitation_intensity::10.1016/j.ijdrr.2014.09.013'
  ], 'reject_disaster_attribution_comparing_precipitation_over_deforestation_as_directed_edge',
  'The paper evaluates extreme precipitation as the primary cause of a Himalayan disaster relative to deforestation. That comparison does not estimate deforestation causing extreme-precipitation intensity.',
  'Rejected for the queued direction. Deforestation effects on convection and rainfall require atmospheric moisture, energy, circulation, spatial-scale and upwind-land-cover evidence rather than a disaster-cause comparison.'),
  'urbanization->carbon_emission::10.1186/s42162-024-00344-0': Object.freeze({
    decision: 'retain_as_independent_corroboration_for_promoted_edge',
    rationale: 'The open Guizhou Province study evaluates the exact urbanization and carbon-emissions pair with a 2000-2020 VAR, impulse-response and variance-decomposition design. It corroborates time-varying magnitude and direction but does not replace the broader spatial-panel source or establish a global coefficient.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([Object.freeze({
      url: 'https://doi.org/10.1186/s42162-024-00344-0',
      locator: 'Abstract, data and methods, empirical results, conclusion and limitations: Guizhou Province annual urbanization and carbon-emission series for 2000-2020, VAR, impulse response, variance decomposition, time-varying direction and data-availability limits.'
    })]),
    evidence_boundary: 'Retained only as regional corroboration for a sign-changing relationship. VAR interaction is not a randomized causal effect, and Guizhou results are not transferable to other urban systems.'
  }),
  'urbanization->carbon_emission::10.5018/economics-ejournal.ja.2018-44': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open primary study uses a dynamic Spatial Durbin panel to estimate short- and long-run direct and neighboring-region effects of urbanization rate and city-size distribution on provincial carbon emissions. It reports sign reversal across time horizons and supports an alters edge rather than a universal increase.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.5018/economics-ejournal.ja.2018-44',
        locator: 'Methods Sections 3.1-3.2; Tables 8-9; Sections 4.3.5-4.3.8; Conclusions: Chinese provincial dynamic spatial panel, urbanization-rate and city-size variables, short- and long-run direct, indirect and total effects, sign reversal and spillovers.'
      }),
      Object.freeze({
        url: 'https://doi.org/10.1007/s11356-017-0662-2',
        locator: 'Independent Chinese 1980-2014 Granger, error-correction and STIRPAT study retained for dimensional and regional heterogeneity.'
      }),
      Object.freeze({
        url: 'https://doi.org/10.1186/s42162-024-00344-0',
        locator: 'Independent open Guizhou 2000-2020 VAR study retained for time-varying regional interaction and limitations.'
      })
    ]),
    evidence_boundary: 'Promoted as an indirect, sign-changing socioeconomic relationship for territorial emissions. No single elasticity is globalized; short versus long run, direct versus spillover, city structure, economic activity, industrial composition, energy intensity, technology and inventory boundary remain explicit.'
  }),
  'demand_response->carbon_emission::10.3390/su16041413': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open primary paper models carbon-aware demand response with hourly dynamic carbon factors and operational load profiles for 108 enterprises in six Fangshan industries. It supports a conditional signed reduction edge when load shifts to lower-carbon hours and total energy and rebound are reconciled.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://www.mdpi.com/2071-1050/16/4/1413',
        locator: 'Methods Sections 2-3; Figures 8-12; Discussion and Conclusions: dynamic carbon-emission factors, representative December 2022 day, 108 enterprises, six industries, 10 percent maximum load adjustment and modeled carbon-reduction potential.'
      }),
      Object.freeze({
        url: 'https://www.eia.gov/todayinenergy/detail.php?id=60482',
        locator: 'Independent authoritative context for hourly electricity demand, generation mix and operational balancing; not used as an avoided-emissions coefficient.'
      })
    ]),
    evidence_boundary: 'Promoted only as a conditional mitigation pathway. The Fangshan values are modeled potential, not randomized observed abatement; average versus marginal factors, imports, rebound, storage losses, production constraints and counterfactual load remain required.'
  })
});

const JULY_25_SECOND_FRESH_INTAKE_REJECTIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'building_energy_efficiency->heat_related_mortality_burden::10.1016/j.buildenv.2025.114094',
    'building_energy_efficiency->heat_related_mortality_burden::10.1016/j.uclim.2022.101262'
  ], 'reject_building_simulation_metric_or_common_heat_driver_as_efficiency_effect',
  'One paper proposes an indoor thermal-overload metric using building simulations without identifying energy efficiency as the exposure. The other models urban heat island as a common driver of building energy use and temperature-related mortality, not building efficiency as the upstream mortality intervention.',
  'Rejected for building_energy_efficiency->heat_related_mortality_burden. A valid study must compare a measured or simulated efficiency, retrofit, envelope, ventilation, or cooling intervention against an explicit counterfactual and retain indoor temperature, occupancy, vulnerability, adaptation and mortality estimation.',
  'Title, abstract, and bibliographic context reviewed for exposure, outcome, and direction.'),
  ...july25ReviewedRejectionBatch([
    'arctic_oscillation->drought_persistence::10.63737/jhl.25.0013'
  ], 'reject_sea_ice_to_pdo_endpoint_mismatch',
  'The paper studies Arctic sea-ice loss and persistence of the Pacific Decadal Oscillation. It does not use the Arctic Oscillation as the exposure or drought persistence as the outcome.',
  'Rejected as complete endpoint mismatch. Sea ice, PDO, Arctic Oscillation and drought remain separate variables and nodes.',
  'Bibliographic title and available source context reviewed; no positive relationship evidence used.'),
  ...july25ReviewedRejectionBatch([
    'building_performance_standards->equitable_cooling_access::10.2139/ssrn.6066308',
    'building_performance_standards->equitable_cooling_access::10.1001/amajethics.2025.815',
    'building_performance_standards->equitable_cooling_access::10.1016/s0140-6736(26)00925-6'
  ], 'reject_equitable_access_polysemy_without_building_or_cooling_endpoint',
  'These records concern open-access repositories, electronic health records, or a health-research profile. None evaluates building-performance standards or equitable access to indoor cooling.',
  'Rejected as access and building polysemy. Cooling-access evidence requires a building intervention, indoor heat or cooling service, household or occupant distribution, geography, period and equity endpoint.',
  'Bibliographic titles are sufficient to establish that the environmental endpoints are absent.'),
  ...july25ReviewedRejectionBatch([
    'industry_farming->wildfire_regime_shift::10.1016/j.iot.2019.100142',
    'industry_farming->wildfire_regime_shift::10.3390/land9040097',
    'industry_farming->wildfire_regime_shift::10.1038/531143a'
  ], 'reject_farming_transition_or_climate_context_without_wildfire_endpoint',
  'The papers address smart-farming technology, a livestock-to-game-farming social-ecological transition, or climate pressure on African farming. None measures industrial agriculture as a driver of wildfire frequency, burned area, season, severity, or fuel continuity.',
  'Rejected for industry_farming->wildfire_regime_shift. A defensible edge requires a specific land-management or burning exposure and a source-native fire-regime outcome rather than the generic words farming, shift, or climate.',
  'Bibliographic title and available abstract context reviewed for the exact directed endpoints.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->agricultural_labor_exposure::10.3390/su16145870',
    'carbon_emission->agricultural_labor_exposure::10.3390/su17177669',
    'carbon_emission->agricultural_labor_exposure::10.1016/j.envdev.2024.101004'
  ], 'reject_agricultural_labor_or_practice_as_emissions_driver_not_exposure_outcome',
  'These studies use rural labor transfer, labor productivity, machinery, digital agriculture, or agricultural practices as explanatory variables for carbon-emission efficiency. They do not estimate carbon emissions causing agricultural worker heat, pollution, injury, or labor exposure.',
  'Rejected for the queued direction. Carbon-emissions-to-worker exposure requires a mediated climate or pollution pathway with worker population, exposure variable, lag, outcome and alternative occupational conditions retained.',
  'Bibliographic title and available abstract context establish reverse direction or target absence.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->airport_operational_disruption::10.1504/ijsa.2017.085314'
  ], 'reject_airport_operations_to_engine_emissions_reverse_direction',
  'The paper studies how aircraft-engine operating conditions affect emissions and airport pollution. It does not study carbon emissions causing airport operational disruption.',
  'Rejected for reverse direction and outcome mismatch. Airport disruption requires heat, flooding, wind, visibility, pavement, runway, staffing, or capacity observations rather than an engine-emissions inventory.',
  'Bibliographic title and available abstract context reviewed for direction.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->basin_treaty_breakdown::10.4028/www.scientific.net/kem.605.544',
    'carbon_emission->basin_treaty_breakdown::10.1166/sl.2015.3408',
    'carbon_emission->basin_treaty_breakdown::10.54254/2754-1169/30/20231455'
  ], 'reject_material_breakdown_or_carbon_treaty_polysemy',
  'Two records concern microwave emission during electrical breakdown of carbon fibres. The third concerns carbon-emissions treaties and inequality. None measures breakdown of a transboundary water-basin treaty.',
  'Rejected as breakdown, carbon and treaty polysemy. Basin-governance evidence requires a named basin, agreement, hydrologic pressure, state behavior, compliance or dispute outcome, and temporal sequence.',
  'Bibliographic titles are sufficient to establish endpoint mismatch.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->coastal_saltwater_intrusion::10.1016/j.agee.2021.107416',
    'carbon_emission->coastal_saltwater_intrusion::10.1021/acs.est.4c12966'
  ], 'reject_saltwater_intrusion_to_soil_carbon_reverse_direction',
  'Both papers study how saltwater intrusion changes carbon storage or destabilizes soil carbon in coastal agricultural soils. They do not identify anthropogenic carbon emissions as the exposure causing coastal saltwater intrusion.',
  'Rejected for carbon_emission->coastal_saltwater_intrusion. Preserve as possible intrusion-to-soil-carbon-cycle evidence with salinity, hydrology, soil, land use, geography and period retained.',
  'Bibliographic title and available publisher context reviewed for direction.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->delta_salt_intrusion_fronts::10.1051/e3sconf/202452002025',
    'carbon_emission->delta_salt_intrusion_fronts::10.3390/su152115659',
    'carbon_emission->delta_salt_intrusion_fronts::10.2139/ssrn.4242793'
  ], 'reject_yangtze_river_delta_region_polysemy_without_salinity_intrusion',
  'The records analyze carbon emissions or reduction pathways in the Yangtze River Delta economic region. Delta is a regional label; none studies salinity, an intrusion front, discharge, tide, sea level, groundwater, or estuarine transport.',
  'Rejected as delta polysemy. A valid salt-intrusion edge requires a hydrodynamic or observational salinity-front outcome and a clearly mediated emissions or warming pathway.',
  'Bibliographic titles and available abstracts establish absence of the target endpoint.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->humanitarian_resource_gaps::10.3390/su15075824',
    'carbon_emission->humanitarian_resource_gaps::10.1080/17583004.2018.1537516',
    'carbon_emission->humanitarian_resource_gaps::10.1002/er.7826'
  ], 'reject_carbon_capacity_or_energy_equipment_as_humanitarian_resource_gap',
  'The records concern regional carbon contribution capacity, terrestrial negative-emissions capacity, or optimal low-carbon equipment capacity. None measures humanitarian response funding, staffing, logistics, access, or supply gaps caused by carbon emissions.',
  'Rejected as capacity and resource polysemy. Humanitarian-resource evidence requires a named crisis, appeal or operation, need denominator, delivered resources, shortfall, geography, period and causal pathway.',
  'Bibliographic titles and available abstracts establish target mismatch.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->hydropower_reliability_decline::10.1177/0958305x18802786',
    'carbon_emission->hydropower_reliability_decline::10.1016/j.jclepro.2023.139046',
    'carbon_emission->hydropower_reliability_decline::10.3389/fenrg.2020.00082'
  ], 'reject_economic_or_hydropower_capacity_effect_on_emissions_reverse_direction',
  'These papers study economic decline, renewable or installed hydropower capacity, and carbon-emission outcomes. They do not estimate carbon emissions causing hydropower reliability decline through warming, runoff, drought, sediment, or operating constraints.',
  'Rejected for reverse direction or missing reliability endpoint. Hydropower reliability requires generation shortfall, firm capacity, outage, reservoir, inflow and operating-rule evidence under a bounded climate exposure.',
  'Bibliographic title and available abstract context reviewed for direction and endpoint.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->insurance_retreat::10.3390/su17094086',
    'carbon_emission->insurance_retreat::10.1029/2018eo110081',
    'carbon_emission->insurance_retreat::10.1016/j.eap.2025.05.022'
  ], 'reject_insurance_emissions_policy_or_glacial_retreat_polysemy',
  'The records concern insurance effects on agricultural emissions, black carbon and glacial retreat, or social-insurance contribution cuts and corporate emissions. None measures insurer withdrawal, non-renewal, affordability loss, coverage contraction, or market retreat caused by carbon emissions.',
  'Rejected as reverse policy direction and retreat polysemy. Insurance-market evidence requires insurer behavior, hazard exposure, loss experience, regulation, pricing, geography and period.',
  'Bibliographic title and available abstract context reviewed for exact endpoint identity.')
});

const JULY_25_SECOND_FRESH_INTAKE_PROMOTIONS = Object.freeze({
  'building_energy_efficiency->heat_related_mortality_burden::10.1016/j.scs.2016.01.006': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The primary study compares simulated indoor heat exposure across declared Australian house-energy ratings under the Melbourne 2009 heatwave and applies empirical health functions. It supports a bounded efficiency-and-passive-resilience pathway to modeled mortality burden, not a universal retrofit effect.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.1016/j.scs.2016.01.006',
        locator: 'Abstract and modeled results: 0.9-star versus 5.4-star heat-stress duration and modeled mortality under a Melbourne 2009 heatwave counterfactual.'
      }),
      Object.freeze({
        url: 'https://doi.org/10.3389/frsc.2020.561828',
        locator: 'Independent open building simulation: light and deep retrofit scenarios reduce maximum indoor temperature; the paper explicitly separates these possible indoor-health benefits from its quantified air-pollution mortality calculation.'
      })
    ]),
    evidence_boundary: 'Promoted only as an indirect, model-supported relationship when efficiency upgrades also improve passive heat resilience. The reported 90 percent is a scenario result for a specified Melbourne stock upgrade, not an observed trial, global coefficient, confidence interval, or default edge magnitude.'
  }),
  'arctic_oscillation->drought_persistence::10.1038/s41598-021-97911-2': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open primary study reconstructs May Arctic Oscillation and July precipitation from tree-ring isotopes in the eastern Taimyr Peninsula and reports a seasonally lagged positive-AO, warming, precipitation-reduction and drought pathway. A separate Shaanxi instrumental analysis provides regional corroboration while demonstrating that geography, season and sign must remain explicit.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.1038/s41598-021-97911-2',
        locator: 'Abstract; Results; Discussion; Methods: 516-2009 CE larch-isotope reconstruction, May AO calibration and lagged warm/dry summer pathway in Central Siberia.'
      }),
      Object.freeze({
        url: 'https://doi.org/10.1016/j.atmosres.2017.10.012',
        locator: 'Independent Shaanxi 1960-2009 scPDSI, EOF and wavelet analysis retained as regional multiscale corroboration.'
      })
    ]),
    evidence_boundary: 'Promoted only as an indirect regional and seasonal teleconnection. It is not sign-stable across the Northern Hemisphere, the proxy study has a short instrumental calibration, and neither paper supplies a universal AO-to-drought coefficient.'
  }),
  'arctic_oscillation->drought_persistence::10.1016/j.atmosres.2017.10.012': Object.freeze({
    decision: 'retain_as_independent_corroboration_for_promoted_edge',
    rationale: 'The Shaanxi study uses self-calibrating PDSI, EOF and wavelet coherence over 1960-2009 and reports positive multiscale AO relations across most of the province. It corroborates a bounded regional teleconnection but does not isolate a causal effect or establish the Central Siberian seasonal mechanism by itself.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.1016/j.atmosres.2017.10.012',
        locator: 'Abstract, study design, highlights and conclusions: Shaanxi winter scPDSI and AO multiscale association, 1960-2009.'
      })
    ]),
    evidence_boundary: 'Retained as independent regional corroboration for the promoted edge. Wavelet coherence is not a randomized causal effect, and the Shaanxi sign, season and lag cannot be transferred globally.'
  })
});

const JULY_25_THIRD_FRESH_INTAKE_DECISIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'carbon_emission->relocation_governance_capacity::10.1016/j.jclepro.2018.10.166',
    'carbon_emission->relocation_governance_capacity::10.1002/ep.14332',
    'carbon_emission->relocation_governance_capacity::10.26599/trcn.2025.9550017'
  ], 'reject_relocation_or_governance_as_upstream_emissions_context',
  'The records study industrial relocation of emissions or carbon-governance regimes that change emissions. They do not estimate carbon emissions as a cause of public relocation-governance capacity.',
  'Rejected for direction and endpoint mismatch. A defensible edge requires a climate-mediated displacement pressure, a named governance-capacity outcome, geography, lag and competing institutional drivers.',
  'Titles and available abstracts establish reverse direction or absence of the relocation-governance endpoint.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->reservoir_storage_instability::10.1016/j.catena.2011.03.012',
    'carbon_emission->reservoir_storage_instability::10.1093/ijlct/ctv024',
    'carbon_emission->reservoir_storage_instability::10.1016/j.apenergy.2020.115660'
  ], 'reject_reservoir_greenhouse_flux_or_geologic_storage_polysemy',
  'One study measures reservoir greenhouse-gas emissions; the others concern engineered geologic carbon-dioxide storage. None measures climate-driven instability of water-reservoir storage.',
  'Rejected for direction and reservoir/storage polysemy. Water-storage reliability requires inflow, evaporation, sediment, operations, demand and storage observations under a bounded climate exposure.',
  'Titles and source context are sufficient to separate aquatic reservoirs from geological carbon-storage reservoirs.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->shipping_lane_disruption::10.1016/s0262-4079(11)61731-4',
    'carbon_emission->shipping_lane_disruption::10.1287/opre.2022.0361',
    'carbon_emission->shipping_lane_disruption::10.62012/mp.v4i1.43309'
  ], 'reject_shipping_emissions_policy_as_lane_disruption_effect',
  'The records concern shipping-emission standards, routing optimization and emissions-reduction strategies. They do not show carbon emissions causing closure, delay, rerouting or capacity loss on a shipping lane.',
  'Rejected for reverse intervention context and missing disruption endpoint. A valid relationship requires a mediated physical hazard, named route, disruption metric and period.',
  'Bibliographic records identify policy and optimization outcomes rather than operational disruption.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->urban_water_rationing_zones::10.3390/w16121733',
    'carbon_emission->urban_water_rationing_zones::10.3390/w15132345',
    'carbon_emission->urban_water_rationing_zones::10.1016/j.watres.2025.124876'
  ], 'reject_water_project_carbon_accounting_or_stream_flux_as_rationing',
  'The papers quantify emissions from water-supply choices, ecological reconstruction or urban headwater streams. They do not estimate carbon emissions causing municipal rationing zones.',
  'Rejected for reverse accounting direction and absent rationing endpoint. Rationing evidence requires a named utility, shortage rule, affected population or service zone, hydrologic pressure and time.',
  'Titles and available abstracts establish that rationing is not measured.'),
  ...july25ReviewedRejectionBatch([
    'methane->carbon_emission::10.1080/20430779.2015.1036752',
    'methane->carbon_emission::10.3390/rs15184547',
    'methane->carbon_emission::10.1016/j.jclepro.2020.121931'
  ], 'reject_emissions_accounting_identity_as_methane_to_carbon_dioxide_edge',
  'These studies estimate methane emission factors or inventories. Carbon is used in accounting, sensing or carbon-equivalent terminology; no paper shows atmospheric methane causing the platform fossil and industrial carbon-dioxide-emissions node.',
  'Rejected to avoid ontology conflation. Methane and carbon dioxide are distinct emitted gases; carbon-dioxide-equivalent aggregation belongs in metric metadata, not a causal edge.',
  'Titles and source context identify emission-factor and inventory studies rather than a directed atmospheric mechanism.'),
  ...july25ReviewedRejectionBatch([
    'temp->coastal_hypoxia::10.1111/j.1365-2486.2010.02343.x',
    'temp->coastal_hypoxia::10.3389/fmars.2019.00139'
  ], 'reject_organism_response_to_combined_temperature_and_hypoxia_as_hypoxia_formation',
  'These studies examine temperature-conditioned oxygen thresholds or combined temperature-and-hypoxia effects on organisms. They do not estimate warming as a driver of coastal-water oxygen loss or hypoxic-area formation.',
  'Rejected only as edge-promoting evidence. Preserve for organism- and life-stage-specific combined-stressor relationships with temperature, oxygen exposure and biological endpoint retained.',
  'Full titles and available abstracts distinguish biological response under hypoxia from physical formation of hypoxia.'),
  ...july25ReviewedRejectionBatch([
    'temp->compound_coastal_flooding::10.33552/gjes.2019.01.000513'
  ], 'reject_broad_global_warming_scenario_without_compound_flood_endpoint',
  'The record discusses coastal flooding on gravel-dominated beaches under global warming but does not establish the platform compound-flooding endpoint, which requires coincident or interacting coastal, fluvial, pluvial or groundwater drivers.',
  'Rejected for broad promotion. A beach-specific warming-to-flood study may be reconsidered only with full methods, water-level components, compound-event definition, geography, period and uncertainty.',
  'Bibliographic context does not demonstrate a compound-event endpoint.'),
  ...july25ReviewedRejectionBatch([
    'temp->freshwater_ecosystem_collapse::10.1111/fwb.13168',
    'temp->freshwater_ecosystem_collapse::10.1111/gcb.14114',
    'temp->freshwater_ecosystem_collapse::10.1086/718648'
  ], 'reject_metabolism_or_marine_coral_endpoint_as_freshwater_collapse',
  'Two papers study temperature effects on aquatic or stream metabolism without an ecosystem-collapse endpoint. The third documents collapse of a marine coral population, not a freshwater ecosystem.',
  'Rejected for target mismatch or endpoint overstatement. Freshwater collapse requires a declared freshwater system, state transition or functional loss, baseline, duration and competing stressors.',
  'Titles and available abstracts establish metabolism endpoints or a marine ecosystem.'),
  ...july25ReviewedRejectionBatch([
    'deforestation->sea_ice_season_loss::10.1175/jcli-d-23-0394.1',
    'deforestation->sea_ice_season_loss::10.1002/2013gl058951',
    'deforestation->sea_ice_season_loss::10.1175/jcli-d-19-0687.1'
  ], 'reject_sea_ice_loss_as_exposure_or_target_only_without_deforestation',
  'The papers study atmospheric responses to Arctic sea-ice loss or melt-season changes. Deforestation is not the identified exposure.',
  'Rejected for missing exposure and mostly reverse direction. Any deforestation-to-sea-ice pathway must retain greenhouse, albedo and circulation mediators rather than infer a direct edge from sea-ice literature.',
  'Bibliographic titles establish that sea-ice loss is the exposure or sole endpoint and deforestation is absent.'),
  ...july25ReviewedRejectionBatch([
    'trade_wind_weakening->walker_circulation_shift::10.1029/2022gl101020',
    'trade_wind_weakening->walker_circulation_shift::10.1007/s00382-011-1215-x',
    'trade_wind_weakening->walker_circulation_shift::10.1175/jcli-d-22-0516.1'
  ], 'reject_circulation_component_covariability_as_independent_directed_edge',
  'The records analyze Walker circulation, equatorial waves, meridional wind or ENSO variability. They do not isolate trade-wind weakening as an independent upstream cause of a distinct Walker-circulation shift rather than a component, manifestation or shared response.',
  'Rejected from the causal graph to avoid double-counting circulation state. A narrower lagged edge requires distinct variables, temporal precedence and controls for ENSO and common forcing.',
  'Titles and abstracts support circulation covariability or common-driver interpretation, not the proposed independent direction.'),
  ...july25ReviewedRejectionBatch([
    'wildfire_regime_shift->forest_dieback_areas::10.66224/jgs.26.81.11',
    'wildfire_regime_shift->forest_dieback_areas::10.3390/f15081337',
    'wildfire_regime_shift->forest_dieback_areas::10.1016/j.landusepol.2022.106372'
  ], 'reject_hazard_mapping_detection_or_ownership_without_dieback',
  'The records concern wildfire hazard mapping, image detection or protected-area ownership. None measures post-fire forest mortality, persistent canopy loss or conversion to a nonforest state.',
  'Rejected for absent dieback endpoint. A valid edge requires fire exposure or regime metric, tree mortality or persistent cover-loss outcome, recovery window, vegetation type and competing drought or pest stress.',
  'Bibliographic titles and source context establish that forest dieback is not measured.'),
  'temp->coastal_hypoxia::10.5194/bg-19-4479-2022': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open primary analysis evaluates observed coastal warming and projected sea-surface temperature, oxygen-capacity and vertical-minimum-oxygen trends along the global coast and at documented hypoxic areas. It supports a bounded warming-to-coastal-oxygen-pressure pathway while retaining nutrients, runoff, circulation, salinity, storms and model resolution as independent controls.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.5194/bg-19-4479-2022',
        locator: 'Abstract, Methods, Table 1, Results and Discussion: 1982-2021 observations and 2006-2100 projections for coastal SST, oxygen capacity and vertical-minimum oxygen, including documented hypoxic-area subsets.'
      }),
      Object.freeze({
        url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
        locator: 'Authoritative assessment corroboration for ocean warming, stratification, oxygen loss and coastal-system mechanisms; not used as a study-specific coefficient.'
      })
    ]),
    evidence_boundary: 'Promoted as an indirect coastal deoxygenation pressure, not a universal conversion from temperature to hypoxic area, event count or mortality. Coarse resolution, scenario, salinity assumptions, nutrients, runoff, circulation and storms remain explicit.'
  }),
  'deforestation->monsoon_volatility::10.1029/2022ef002863': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The primary paper compares paired idealized deforestation experiments across 11 LUMIP/CMIP6 models and reports changes in monsoon precipitation and circulation. It supports large-scale forest loss as a potential monsoon-disruption driver, while its model range, regional heterogeneity and idealized exposure prohibit a universal volatility coefficient.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.1029/2022EF002863',
        locator: 'Methods, Results and Discussion: approximately 38 percent global deforestation; 11-model paired experiment; global and land-monsoon precipitation and circulation responses with cross-model ranges.'
      }),
      Object.freeze({
        url: 'https://doi.org/10.1126/sciadv.add9973',
        locator: 'Independent South American monsoon evidence retained as regional corroboration rather than a global coefficient.'
      })
    ]),
    evidence_boundary: 'Promoted only as an indirect large-scale land-atmosphere pathway. The source measures mean precipitation and circulation response under an idealized experiment, not observed annual deforestation, monsoon-onset variance or a globally sign-stable marginal effect.'
  }),
  'deforestation->monsoon_volatility::10.1126/sciadv.add9973': Object.freeze({
    decision: 'retain_as_independent_corroboration_for_promoted_edge',
    rationale: 'The study independently evaluates a South American monsoon transition under deforestation and supports the existence of a regional land-cover-to-monsoon pathway without supplying a transferable global coefficient.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([{ url: 'https://doi.org/10.1126/sciadv.add9973', locator: 'Regional South American monsoon analysis and deforestation-response results.' }]),
    evidence_boundary: 'Retained as regional corroboration only. It does not replace the multi-model primary source or establish the same response for other monsoon systems.'
  }),
  'deforestation->monsoon_volatility::10.4172/2157-7625.1000226': Object.freeze({
    decision: 'retain_as_regional_model_corroboration_with_combined_exposure',
    rationale: 'The RegCM4 study evaluates Indian monsoon rainfall and surface-flux responses under combined desertification and deforestation sensitivity experiments. It is relevant regional context but does not isolate a clean deforestation-only effect.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([{ url: 'https://doi.org/10.4172/2157-7625.1000226', locator: 'Regional-model experiment for Indian monsoon rainfall and surface fluxes under combined desertification and deforestation.' }]),
    evidence_boundary: 'Retained only as combined-exposure regional corroboration; not counted as independent isolation of deforestation or as a source-reported global effect.'
  })
});

const JULY_25_FOURTH_FRESH_INTAKE_DECISIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'deforestation->oceanic_deoxygenation::10.5751/es-11713-250310'
  ], 'reject_oceanic_island_deforestation_context_without_deoxygenation',
  'The paper analyzes deforestation and economic-growth trends on oceanic islands. Oceanic describes island geography; dissolved oxygen or marine deoxygenation is not the outcome.',
  'Rejected as oceanic polysemy. A valid edge requires a marine oxygen metric and a physically bounded land-to-ocean nutrient, carbon or circulation pathway.',
  'Title and abstract establish that marine deoxygenation is absent.'),
  ...july25ReviewedRejectionBatch([
    'environ_anomalies->high_altitude_forest_shrinkage::10.1659/mrd-journal-d-17-00071.1',
    'environ_anomalies->high_altitude_forest_shrinkage::10.1016/j.gecco.2023.e02739',
    'environ_anomalies->high_altitude_forest_shrinkage::10.1186/s40663-018-0141-3'
  ], 'reject_broad_anomaly_exposure_or_nonforest_endpoint_for_high_altitude_shrinkage',
  'The records address treeline habitat suitability, mountain-newt range contraction or treeline dynamics under named climate variables. They do not identify the broad Environmental Anomalies node as an exposure causing a consistent high-altitude forest-area decline.',
  'Rejected for the broad queued edge. Preserve for narrower temperature, precipitation, land-cover or species-habitat relationships after direction, elevation band and area metric are retained.',
  'Titles and abstracts show either a different endpoint or a named climate exposure that should not be collapsed into the broad node.'),
  ...july25ReviewedRejectionBatch([
    'environ_anomalies->savannah_tree_cover_decline::10.9734/ijecc/2020/v10i1030243',
    'environ_anomalies->savannah_tree_cover_decline::10.3390/cli11110214'
  ], 'reject_oak_climate_association_or_countervailing_forest_projection_as_savannah_decline',
  'One record studies climate associations for Midwestern oak savanna species; the other projects little western United States forest loss despite regeneration decline. Neither measures a broad environmental-anomaly exposure causing savannah tree-cover decline.',
  'Rejected for exposure and endpoint mismatch; the second title is also counterevidence to an unbounded decline claim.',
  'Bibliographic context does not establish the proposed directed pair.'),
  ...july25ReviewedRejectionBatch([
    'building_performance_standards->public_health_heat_burden::10.1093/eurpub/ckt185.008',
    'building_performance_standards->public_health_heat_burden::10.1093/eurpub/ckab164.624',
    'building_performance_standards->public_health_heat_burden::10.3389/fpubh.2026.1812411'
  ], 'reject_capacity_building_or_workplace_environment_polysemy',
  'The records concern scenario-building skills, country-level capacity building or hospital noise. They do not evaluate building-performance standards or heat-related public-health burden.',
  'Rejected as building and environment polysemy. A valid relationship requires a building code or performance intervention, indoor heat exposure and a health endpoint.',
  'Titles establish that neither physical buildings nor heat burden are the directed endpoints.'),
  ...july25ReviewedRejectionBatch([
    'deforestation->compound_day_night_heat_extremes::10.1029/2017eo075565'
  ], 'reject_secondary_diurnal_surface_temperature_summary_as_compound_extreme_event',
  'The Eos research spotlight summarizes day-night asymmetry in land-surface-temperature response to deforestation. It does not define or estimate compound hot-day and hot-night extreme events.',
  'Rejected for the compound-extreme endpoint and because the record is secondary commentary. The underlying JGR study remains useful for a narrower diurnal land-surface-temperature response.',
  'Eos text and its linked primary DOI 10.1002/2016JG003653 were reviewed for endpoint identity.'),
  ...july25ReviewedRejectionBatch([
    'environ_anomalies->inland_waterway_fuel_spills::10.1007/s11069-012-0541-6',
    'environ_anomalies->inland_waterway_fuel_spills::10.3390/cli13070146',
    'environ_anomalies->inland_waterway_fuel_spills::10.59490/imdc.2024.826'
  ], 'reject_transport_resilience_context_without_fuel_spill_endpoint',
  'The studies discuss extreme-weather impacts, policy resilience or vessel design for inland waterways. They do not measure fuel-spill frequency, volume or probability.',
  'Rejected for absent spill endpoint. Transport disruption and hazardous-material release must remain separate outcomes.',
  'Titles and abstracts establish climate-resilience context but no fuel-spill measurement.'),
  ...july25ReviewedRejectionBatch([
    'clean_electricity->grid_peak_load_stress::10.2139/ssrn.4293006',
    'clean_electricity->grid_peak_load_stress::10.2139/ssrn.4293004',
    'clean_electricity->grid_peak_load_stress::10.1016/j.tej.2015.04.006'
  ], 'reject_distributed_resource_operation_or_policy_commentary_as_clean_supply_stress',
  'The duplicate preprints optimize distributed-resource operation and peak regulation; the policy article discusses peak electricity under the Clean Power Plan. None isolates clean-electricity penetration as a cause of grid peak-load stress.',
  'Rejected for exposure and counterfactual mismatch. A valid edge must distinguish variable generation, storage, transmission, demand shape, firm capacity and curtailment.',
  'Bibliographic records show operational mitigation or policy context rather than the queued directed effect.'),
  ...july25ReviewedRejectionBatch([
    'deforestation->nocturnal_heat_stress::10.1038/s43247-021-00275-8',
    'deforestation->nocturnal_heat_stress::10.1093/biosci/biac084',
    'deforestation->nocturnal_heat_stress::10.1007/s13592-025-01231-7'
  ], 'reject_general_wbgt_review_or_nocturnal_bee_endpoint_as_nighttime_heat_stress',
  'The primary Amazon model estimates daily maximum WBGT and combined deforestation-climate heat exposure, not a nighttime-specific heat-stress outcome. The review is not an independent estimate, and the bee study uses nocturnal as a behavioral trait rather than a heat metric.',
  'Rejected for the exact nocturnal endpoint. The Amazon paper remains valid evidence for broader deforestation-conditioned heat stress, which is already represented elsewhere in the graph.',
  'The open Nature full text, review title and bee-study title were checked for time-of-day and endpoint identity.'),
  ...july25ReviewedRejectionBatch([
    'thermal_stratification_intensification->fish_landing_supply_disruption::10.2139/ssrn.4282096',
    'thermal_stratification_intensification->fish_landing_supply_disruption::10.1016/j.buildenv.2016.11.016',
    'thermal_stratification_intensification->fish_landing_supply_disruption::10.1111/j.1095-8649.2010.02896.x'
  ], 'reject_battery_room_or_freshwater_aeration_as_fishery_landings',
  'The records concern battery cooling, room-air stratification or an aerated freshwater impoundment. None measures marine or inland fishery landings, supply, port delivery or market disruption.',
  'Rejected for thermal-stratification and fish-landing endpoint mismatch.',
  'Titles are sufficient to establish engineering polysemy or a different ecological endpoint.'),
  ...july25ReviewedRejectionBatch([
    'environ_anomalies->flash_flood_regime::10.3389/frwa.2026.1832344',
    'environ_anomalies->flash_flood_regime::10.1007/s11069-021-04887-3',
    'environ_anomalies->flash_flood_regime::10.1007/s11069-020-04405-x'
  ], 'reject_flash_flood_impact_or_warning_studies_without_named_anomaly_driver',
  'The papers address mortality, socioeconomic impacts or rainfall-threshold warning for flash floods. They do not estimate the broad Environmental Anomalies node as the upstream cause of a changed flash-flood regime.',
  'Rejected for the broad exposure and regime-change claim. A defensible edge requires a named precipitation, land-cover or hydrologic exposure and event frequency or intensity over time.',
  'Titles and abstracts do not establish the queued direction.'),
  ...july25ReviewedRejectionBatch([
    'urbanization->water_stress::10.3389/frsc.2022.790633',
    'urbanization->water_stress::10.1177/0956247819861899'
  ], 'reject_commentary_or_food_insecurity_endpoint_as_primary_water_stress_effect',
  'One record is reflective commentary about peri-urban community water systems; the other studies urban food insecurity. Neither supplies the primary quantitative urbanization-to-water-stress relationship.',
  'Rejected as promotion anchors. The commentary may provide contextual governance evidence, while food insecurity is a different endpoint.',
  'Publication type, title and abstract were reviewed.'),
  ...july25ReviewedRejectionBatch([
    'deforestation->pollen_allergen_spikes::10.1038/nature.2016.21083'
  ], 'reject_deforestation_rate_spike_news_as_pollen_endpoint',
  'The Nature news item uses spikes to describe an increase in Brazilian Amazon deforestation. It does not study pollen, allergens or respiratory exposure.',
  'Rejected as spike polysemy and absent target endpoint.',
  'Title and news context establish that pollen is absent.'),
  'urbanization->water_stress::10.1016/j.scs.2022.103686': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The primary publisher record reports a 31-province water-footprint stress analysis using spatial Durbin and threshold models, with urbanization-related surrounding-region and nonlinear effects. An independent open 30-province 2006-2020 panel study corroborates a water-quantity-and-quality pressure pathway while showing nonlinear, dimensional and regional sign heterogeneity.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.1016/j.scs.2022.103686',
        locator: 'Publisher abstract, highlights and methods summary: 31 provinces, water-footprint stress index, spatial Durbin model, panel threshold model, surrounding-region effect and industrial-structure interaction.'
      }),
      Object.freeze({
        url: 'https://doi.org/10.1016/j.scs.2024.105411',
        locator: 'Open full text, Methods, Tables 4-5, robustness analysis and Conclusions: 30 provinces, 2006-2020, composite urbanization index, grey-water footprint and nonlinear and regional-heterogeneity results.'
      })
    ]),
    evidence_boundary: 'Promoted only as a conditional Chinese provincial relationship. Urbanization dimensions, development stage, industry, water efficiency, spatial spillovers and water-quality accounting can change the sign; no index coefficient is transferred as a physical withdrawal effect.'
  })
});

const JULY_25_FIFTH_FRESH_INTAKE_DECISIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'madden_julian_oscillation->extreme_precipitation_intensity::10.3390/atmos8090180',
    'madden_julian_oscillation->extreme_precipitation_intensity::10.1016/j.atmosres.2016.10.002'
  ], 'retain_regional_mjo_precipitation_context_not_extreme_intensity_anchor',
  'The papers address seasonal precipitation outlooks or tropical African precipitation responses to the MJO. They do not supply the exact CONUS extreme-intensity and spatial-extent estimand used to promote the edge.',
  'Retained only as regional precipitation context; they do not count as independent effect estimates for the promoted extreme-precipitation relationship.',
  'Titles and available abstracts were reviewed for precipitation endpoint, extremeness and geography.'),
  ...july25ReviewedRejectionBatch([
    'ocean_current_regime_shift->fish_landing_supply_disruption::10.1007/s12601-014-0001-1'
  ], 'reject_fish_assemblage_response_without_landing_supply_endpoint',
  'The study measures fish-assemblage responses to an East Sea ocean regime shift. It does not measure fishery landings, port deliveries, market supply or disruption.',
  'Rejected for the landing-supply endpoint. Preserve only for a narrower ocean-regime-to-fish-assemblage relationship.',
  'Title and abstract establish an ecological assemblage endpoint rather than a supply-chain endpoint.'),
  ...july25ReviewedRejectionBatch([
    'ocean_current_regime_shift->fish_landing_supply_disruption::10.2139/ssrn.5531679',
    'ocean_current_regime_shift->fish_landing_supply_disruption::10.1016/j.euroecorev.2025.105077'
  ], 'reject_macroeconomic_regime_and_energy_supply_polysemy',
  'The duplicate records concern macroeconomic regimes, supply-chain disruption and energy shocks. They do not study ocean currents, fisheries or landings.',
  'Rejected as regime and supply polysemy.',
  'Titles establish complete environmental endpoint mismatch.'),
  ...july25ReviewedRejectionBatch([
    'environ_anomalies->soil_moisture_collapse::10.1038/s44304-026-00213-8',
    'environ_anomalies->soil_moisture_collapse::10.5194/nhess-25-1405-2025',
    'environ_anomalies->soil_moisture_collapse::10.1007/s11069-025-07828-6'
  ], 'reject_broad_climate_hazard_or_soil_moisture_variability_as_collapse',
  'The papers study climatic-refugia collapse, soil-moisture coupling or soil-moisture variability and cropland exposure. None defines a persistent soil-moisture collapse state caused by the broad Environmental Anomalies node.',
  'Rejected for broad exposure and endpoint overstatement. A valid relationship requires a named forcing, soil-moisture metric, threshold, duration and recovery criterion.',
  'Titles and abstracts do not establish the proposed state-collapse endpoint.'),
  ...july25ReviewedRejectionBatch([
    'north_atlantic_oscillation->wildfire_regime_shift::10.1002/joc.5835',
    'north_atlantic_oscillation->wildfire_regime_shift::10.5937/gp30-64738',
    'north_atlantic_oscillation->wildfire_regime_shift::10.5775/fg.2067-4635.2012.003.d'
  ], 'reject_nao_rainfall_temperature_or_wind_context_without_wildfire',
  'The records examine rainfall, temperature or wind regimes and NAO influence. They do not measure fire danger, ignitions, occurrence, burned area or severity.',
  'Rejected for absent wildfire endpoint. Climate-mode-to-fire evidence must directly join the index to a fire-weather or observed-fire metric.',
  'Titles and abstracts establish meteorological outcomes only.'),
  ...july25ReviewedRejectionBatch([
    'pacific_north_american_pattern->wildfire_regime_shift::10.3389/feart.2022.987349',
    'pacific_north_american_pattern->wildfire_regime_shift::10.1088/1748-9326/aade3a'
  ], 'reject_north_pacific_ocean_or_tropical_cyclone_regime_shift_as_wildfire',
  'The papers concern a North Pacific sea-surface-temperature regime shift or tropical-cyclone destructiveness. They do not measure the PNA pattern as a driver of wildfire.',
  'Rejected for exposure and target mismatch.',
  'Titles establish unrelated oceanic and cyclone outcomes.'),
  ...july25ReviewedRejectionBatch([
    'environ_anomalies->cooling_equity_gaps::10.1038/s44304-025-00110-6',
    'environ_anomalies->cooling_equity_gaps::10.1007/s11069-025-07449-z',
    'environ_anomalies->cooling_equity_gaps::10.1016/j.crm.2022.100443'
  ], 'reject_adaptation_usage_policy_or_measurement_gap_as_cooling_equity_effect',
  'The records address cooling-center use during one compound hazard, emergency-planning policy gaps or resilience-measurement gaps. They do not estimate a broad environmental-anomaly exposure causing unequal access to cooling.',
  'Rejected for broad exposure and equity-endpoint mismatch. The cooling-center paper may support a narrower adaptation-use relationship with household and outage conditions retained.',
  'Titles and abstracts were reviewed for cooling access and distributional outcomes.'),
  ...july25ReviewedRejectionBatch([
    'indian_ocean_dipole->extreme_precipitation_intensity::10.3390/cli7030038',
    'indian_ocean_dipole->extreme_precipitation_intensity::10.1016/j.atmosres.2022.106142',
    'indian_ocean_dipole->extreme_precipitation_intensity::10.3724/sp.j.1148.2009.00917'
  ], 'reject_cyclone_intensity_or_mean_precipitation_response_as_extreme_precipitation_intensity',
  'One paper studies tropical-cyclone intensity; the others study European or Tianshui precipitation response or pattern. The available records do not establish a threshold-defined extreme-precipitation intensity outcome conditioned on the IOD.',
  'Rejected for the exact extreme endpoint. Regional mean or seasonal precipitation response cannot be relabeled as extreme intensity.',
  'Titles and abstracts were checked for percentile, event-intensity or extreme-value definitions.'),
  ...july25ReviewedRejectionBatch([
    'ocean_heat_content->walker_circulation_shift::10.1175/jcli-d-19-0360.1',
    'ocean_heat_content->walker_circulation_shift::10.1029/2024jc020994',
    'ocean_heat_content->walker_circulation_shift::10.1175/2010mwr3189.1'
  ], 'reject_ocean_heat_content_budget_or_hurricane_forecasting_without_walker_endpoint',
  'The studies analyze Pacific ocean-heat-content variability or hurricane-intensity forecasting. They do not estimate ocean heat content as an upstream cause of a Walker-circulation shift.',
  'Rejected for missing target and likely coupled/common-driver direction. A valid edge needs distinct OHC and circulation variables with lag and forcing controls.',
  'Titles and abstracts do not include the proposed Walker-circulation outcome.'),
  ...july25ReviewedRejectionBatch([
    'methane->drought_persistence::10.1371/journal.pone.0166039',
    'methane->drought_persistence::10.1111/rec.70423',
    'methane->drought_persistence::10.54319/jjbs/180120'
  ], 'reject_drought_or_restoration_as_upstream_methane_control',
  'The records measure enhanced methane emissions during drought, restoration effects on soil methane, or plant methane emissions under drought and heat. Their direction runs from drought or ecosystem treatment to methane, not methane to drought persistence.',
  'Rejected for reverse direction. A radiative-forcing pathway from methane to drought would require atmospheric concentration or forcing, climate response, regional hydroclimate and lag.',
  'Titles and abstracts establish methane as the outcome.'),
  ...july25ReviewedRejectionBatch([
    'volatile_organic_compounds->crop_yield_volatility::10.1007/s44297-023-00018-5',
    'volatile_organic_compounds->crop_yield_volatility::10.1016/j.scitotenv.2023.168950',
    'volatile_organic_compounds->crop_yield_volatility::10.1016/j.cropro.2025.107114'
  ], 'reject_plant_signalling_truck_emissions_or_biocontrol_as_yield_volatility',
  'The studies concern plant volatile signaling, diesel-truck VOC characterization or bacterial volatile biocontrol. None measures interannual crop-yield volatility caused by ambient VOC exposure.',
  'Rejected for exposure scope and absent yield-volatility endpoint.',
  'Titles and abstracts do not report a multi-year yield-variance outcome.'),
  ...july25ReviewedRejectionBatch([
    'environ_anomalies->occupational_heat_exposure::10.1136/oem-2019-epi.197',
    'environ_anomalies->occupational_heat_exposure::10.1097/jom.0000000000003814',
    'environ_anomalies->occupational_heat_exposure::10.1038/s44304-025-00145-9'
  ], 'reject_broad_climate_change_or_population_hazard_context_as_measured_worker_heat',
  'The records concern projected occupational heat hazards, an exposure-matrix method or general population compound extremes. They do not estimate the broad Environmental Anomalies node as a measured upstream exposure to occupational heat.',
  'Rejected for the broad queued edge. Preserve the worker-focused records for narrower temperature, WBGT or heatwave-to-occupational-exposure relationships with job and geography retained.',
  'Titles and abstracts were reviewed for worker population, exposure variable and causal direction.'),
  ...july25ReviewedRejectionBatch([
    'industry_farming->monsoon_volatility::10.1525/gfc.2012.12.2.14'
  ], 'reject_traditional_monsoon_farming_practice_as_industrial_driver',
  'The article concerns traditional Tohono O odham monsoon-adapted foods and farming. It does not study industrial farming as a cause of monsoon variability.',
  'Rejected for exposure and direction mismatch.',
  'Title and publication context identify cultural food practice rather than industrial agriculture.'),
  ...july25ReviewedRejectionBatch([
    'industry_farming->marine_fisheries_collapse::10.1016/j.marpol.2023.105841',
    'industry_farming->marine_fisheries_collapse::10.15578/squalen.v6i1.58',
    'industry_farming->marine_fisheries_collapse::10.1016/j.aaf.2023.03.001'
  ], 'reject_aquaculture_or_fish_processing_as_industrial_agriculture_exposure',
  'The records address salmon-farming rights, salt in fish processing, or fish-farming and reserve management. Farming refers to aquaculture rather than the platform industrial terrestrial agriculture node, and collapse is not the endpoint.',
  'Rejected as farming polysemy and absent collapse outcome.',
  'Titles establish aquaculture or processing contexts.'),
  'madden_julian_oscillation->extreme_precipitation_intensity::10.1175/jcli-d-11-00278.1': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The full primary article analyzes 1979-2010 boreal-winter CONUS precipitation and reports active-MJO, phase- and ENSO-conditioned changes in the probability, area and intensity of 75th- and 90th-percentile contiguous extreme-precipitation regions.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://doi.org/10.1175/JCLI-D-11-00278.1', locator: 'Full text, Methods, Results and Conclusions: MJO-active versus inactive and phase-conditioned extreme-precipitation area and intensity probabilities across six CONUS sectors.' }),
      Object.freeze({ url: 'https://repository.library.noaa.gov/view/noaa/28716', locator: 'NOAA-hosted independent mechanism analysis of MJO teleconnections to North American precipitation.' })
    ]),
    evidence_boundary: 'Promoted as a probabilistic CONUS winter teleconnection. The MJO is not the sole driver, phase and ENSO matter, amplitude is not monotonic, and the reported 2.0-2.5 probability range is not a confidence interval or global coefficient.'
  }),
  'pacific_north_american_pattern->wildfire_regime_shift::10.1038/s41612-022-00274-2': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open full text combines 2001-2020 climate composites and lag analysis with fire-danger indices and satellite fire occurrence, identifying region- and phase-specific PNA modulation of fire weather and observed fires.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://doi.org/10.1038/s41612-022-00274-2', locator: 'Results Figs. 1-7, Methods and Discussion: PNA phase composites, 0-30 day lags, PFIv2/FWI and MODIS fire occurrence, with regional sign and index limitations.' }),
      Object.freeze({ url: 'https://www.cpc.ncep.noaa.gov/data/teledoc/pna.shtml', locator: 'NOAA Climate Prediction Center PNA definition and associated regional temperature and precipitation anomaly patterns; mechanism corroboration only, not wildfire-effect replication.' })
    ]),
    evidence_boundary: 'Promoted only as a regional short-term teleconnection to fire danger and occurrence. It is not a globally uniform phase effect, isolated causal coefficient or evidence of a secular fire-regime trend.'
  }),
  'coastal_inundation_risk->critical_infrastructure_fragility::10.1016/j.ijdrr.2024.104909': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The primary Mauritius assessment couples storm-tide inundation modeling with infrastructure and building inventories to quantify exposed area and modeled damage under current and future scenarios. It supports conditional physical exposure and damage potential, not observed service failure.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://doi.org/10.1016/j.ijdrr.2024.104909', locator: 'Abstract and reported scenario results: Mauritius inundation extent, exposed infrastructure/building assets, return periods, future sea level and critical inundation thresholds.' }),
      Object.freeze({ url: 'https://doi.org/10.1016/j.ocecoaman.2017.02.015', locator: 'Independent East Asian seaport cyclone-risk mapping retained as infrastructure-sector corroboration.' }),
      Object.freeze({ url: 'https://doi.org/10.9753/icce.v38.management.5', locator: 'Independent European critical-infrastructure coastal-flood risk assessment retained as geographic corroboration.' })
    ]),
    evidence_boundary: 'Promoted only as a depth- and asset-conditioned damage pathway. Exposure is not observed outage or fragility, and Mauritius thresholds and long-horizon scenario factors cannot be transferred to other coasts.'
  }),
  'coastal_inundation_risk->critical_infrastructure_fragility::10.1016/j.ocecoaman.2017.02.015': Object.freeze({
    decision: 'retain_as_independent_corroboration_for_promoted_edge',
    rationale: 'The seaport cyclone-risk mapping independently supports coastal-hazard exposure of critical port infrastructure but does not provide the Mauritius inundation-damage estimand.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([{ url: 'https://doi.org/10.1016/j.ocecoaman.2017.02.015', locator: 'East Asian seaport critical-infrastructure cyclone-risk mapping.' }]),
    evidence_boundary: 'Retained as sector and geography corroboration only; no coefficient is transferred.'
  }),
  'coastal_inundation_risk->critical_infrastructure_fragility::10.9753/icce.v38.management.5': Object.freeze({
    decision: 'retain_as_independent_corroboration_for_promoted_edge',
    rationale: 'The European coastal-flood risk assessment independently supports exposure of critical infrastructure but does not provide the Mauritius scenario thresholds.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([{ url: 'https://doi.org/10.9753/icce.v38.management.5', locator: 'European critical-infrastructure coastal-flood risk assessment.' }]),
    evidence_boundary: 'Retained as geographic corroboration only; no coefficient or threshold is transferred.'
  })
});

const JULY_25_SIXTH_FRESH_INTAKE_DECISIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'deforestation->bark_beetle_epidemics::10.1016/j.ecolind.2015.07.008',
    'deforestation->bark_beetle_epidemics::10.3390/rs13153042'
  ], 'reject_bark_beetle_as_upstream_cause_of_deforestation',
  'Both papers study ecological response to, or remote detection of, deforestation caused by bark beetles. They do not show prior deforestation causing bark-beetle epidemics.',
  'Rejected for reverse direction. Preserve for bark-beetle-outbreak-to-tree-loss or deadwood-community relationships.',
  'Titles and abstracts establish bark beetle as the deforestation driver.'),
  ...july25ReviewedRejectionBatch([
    'deforestation->vector_borne_disease_expansion::10.1038/s41564-023-01533-5'
  ], 'retain_as_authoritative_review_corroboration_not_independent_effect',
  'The Nature Microbiology article synthesizes climate-change and deforestation risks for vector-borne diseases. It supports mechanism and public-health context but does not provide an independent primary effect estimate.',
  'Retained as review corroboration only; promotion rests on the primary evidence synthesis and regional field-record analysis.',
  'Publication type and review scope were checked.'),
  ...july25ReviewedRejectionBatch([
    'volatile_organic_compounds->air_pollution_health_burden::10.55248/gengpi.6.0625.2261',
    'volatile_organic_compounds->air_pollution_health_burden::10.1016/j.envpol.2023.121763',
    'volatile_organic_compounds->air_pollution_health_burden::10.1111/j.1600-0668.2010.00667.x'
  ], 'reject_chemistry_review_cabin_exposure_or_ingested_dust_as_population_air_burden',
  'The records concern general atmospheric chemistry, vehicle-cabin concentrations or ingested semi-volatile compounds in house dust. They do not estimate population-level ambient-air health burden attributable to VOC exposure.',
  'Rejected for exposure route and health-burden endpoint. Concentration or hazard ranking is not attributable morbidity or mortality.',
  'Titles and abstracts were reviewed for ambient exposure and population health outcome.'),
  ...july25ReviewedRejectionBatch([
    'wildfire_regime_shift->biodiversity_intactness_loss::10.1071/wf20097',
    'wildfire_regime_shift->biodiversity_intactness_loss::10.1007/s10329-011-0251-9',
    'wildfire_regime_shift->biodiversity_intactness_loss::10.2139/ssrn.3968773'
  ], 'reject_broad_biodiversity_or_taxon_response_as_biodiversity_intactness_metric',
  'The papers address Mediterranean soil erosion and biodiversity, macaque trophic response, or bee resources after wildfire and thinning. None calculates biodiversity intactness or a comparably bounded community-baseline metric caused by a wildfire-regime shift.',
  'Rejected for the exact target metric. Taxon- or site-specific biodiversity responses may support narrower ecological edges.',
  'Titles and abstracts do not report a biodiversity-intactness outcome.'),
  ...july25ReviewedRejectionBatch([
    'aerosol_cooling_loss->extreme_precipitation_intensity::10.1029/2010gl046435',
    'aerosol_cooling_loss->extreme_precipitation_intensity::10.1088/2515-7620/adbeb8'
  ], 'reject_aerosol_loading_experiment_as_unobserved_cooling_loss_reversal',
  'The studies estimate precipitation response to aerosol forcing or loading. They do not directly test removal of aerosol cooling, and reversing the sign would require assumptions about aerosol composition, cloud response, spatial forcing and circulation.',
  'Rejected for direct promotion under aerosol_cooling_loss. The 2011 model result remains mechanistic context: aerosol-cooling and greenhouse-warming thermodynamic effects had opposite signs and precipitation extremes scaled at about 5 percent per kelvin in that model.',
  'Full 2011 article and the event-study abstract were reviewed for intervention direction and outcome.'),
  ...july25ReviewedRejectionBatch([
    'aerosol_cooling_loss->extreme_precipitation_intensity::10.2139/ssrn.1107538'
  ], 'reject_financial_extreme_loss_polysemy',
  'The record estimates financial extreme-loss probability and value at risk. It does not concern aerosols, precipitation or climate.',
  'Rejected as loss and intensity polysemy.',
  'Title establishes complete endpoint mismatch.'),
  ...july25ReviewedRejectionBatch([
    'grid_scale_storage->energy_affordability_crisis::10.1016/j.est.2024.114996',
    'grid_scale_storage->energy_affordability_crisis::10.1016/j.enpol.2017.07.044',
    'grid_scale_storage->energy_affordability_crisis::10.1002/est2.70152'
  ], 'reject_storage_review_service_model_or_small_system_without_affordability_crisis',
  'The records review storage technologies, propose cloud storage, or present a small hybrid system. They do not measure household energy burden, arrears, disconnection, price shock or affordability crisis caused or mitigated by grid-scale storage.',
  'Rejected for absent affordability endpoint. Storage cost and electricity-system value require a separate ratepayer-incidence and market-design analysis.',
  'Titles and abstracts were reviewed for household or tariff outcomes.'),
  ...july25ReviewedRejectionBatch([
    'ocean_heat_content->fjord_sedimentation_pulses::10.1016/j.pocean.2020.102287'
  ], 'reject_fjord_heat_content_sensitivity_without_sedimentation',
  'The paper studies summer upper-ocean heat content in a western Antarctic Peninsula fjord. It does not measure sediment flux, deposition or pulses.',
  'Rejected for absent target endpoint.',
  'Title and abstract establish an ocean-heat outcome only.'),
  ...july25ReviewedRejectionBatch([
    'delta_salt_intrusion_fronts->desalination_dependence::10.1007/s10668-017-0014-x'
  ], 'reject_desalination_potential_as_observed_dependence',
  'The study evaluates potential desalination of a brackish aquifer in a Red River Delta salt-intrusion context. It does not measure a transition to desalination dependence, supply share or lock-in.',
  'Rejected for target overstatement. It may support a narrower salinity-to-treatment-requirement option edge after cost, water-quality and supply-system readback.',
  'Title and abstract distinguish technical potential from observed dependence.'),
  ...july25ReviewedRejectionBatch([
    'delta_salt_intrusion_fronts->desalination_dependence::10.1016/j.desal.2026.120118',
    'delta_salt_intrusion_fronts->desalination_dependence::10.1016/j.desal.2020.114911'
  ], 'reject_salt_management_materials_as_delta_intrusion_driver',
  'The papers concern salt-excreting or restricted-crystallization solar desalination devices. They do not study delta salt-intrusion fronts or system dependence.',
  'Rejected as materials and salt polysemy.',
  'Titles establish engineering-device endpoints.'),
  ...july25ReviewedRejectionBatch([
    'industry_farming->floodplain_exposure::10.1016/j.gloenvcha.2021.102370'
  ], 'reject_farming_location_and_dependence_as_upstream_floodplain_exposure',
  'The global mapping study quantifies development and farming located on and dependent upon floodplains. It does not show industrial farming causing floodplain exposure.',
  'Rejected for direction. Preserve for floodplain-exposure-to-agricultural-production or dependence relationships.',
  'Title and abstract establish farming as exposed activity rather than causal hazard.'),
  ...july25ReviewedRejectionBatch([
    'industry_farming->floodplain_exposure::10.1111/j.1468-0416.2011.00167.x',
    'industry_farming->floodplain_exposure::10.1016/j.canep.2014.05.003'
  ], 'reject_finance_industry_or_childhood_farming_exposure_polysemy',
  'One record concerns European asset management; the other concerns childhood leukemia and farming exposure. Neither studies industrial agriculture causing floodplain exposure.',
  'Rejected as industry and exposure polysemy.',
  'Titles establish unrelated endpoints.'),
  ...july25ReviewedRejectionBatch([
    'pacific_decadal_oscillation->marine_food_web_simplification::10.1038/s43247-023-00863-w'
  ], 'reject_pdo_modulated_marine_heatwaves_without_food_web_endpoint',
  'The paper measures PDO modulation of Northeast Pacific marine heatwaves. It does not measure food-web structure or simplification.',
  'Rejected for missing target. A heatwave-mediated food-web pathway requires a separate ecological study.',
  'Title and abstract establish the marine-heatwave endpoint only.'),
  ...july25ReviewedRejectionBatch([
    'deforestation->coastal_inundation_risk::10.9753/icce.v36.risk.35'
  ], 'reject_storm_surge_loss_assessment_without_deforestation',
  'The paper assesses aggregate storm-surge inundation loss in Japanese bays. Deforestation is not the exposure.',
  'Rejected for missing source endpoint.',
  'Title establishes storm-surge risk without land-cover causation.'),
  ...july25ReviewedRejectionBatch([
    'thermal_stratification_intensification->marine_food_web_simplification::10.1002/2017gl073714',
    'thermal_stratification_intensification->marine_food_web_simplification::10.1016/j.jmarsys.2025.104065'
  ], 'reject_marine_heatwave_or_typhoon_intensification_without_food_web',
  'The papers study subsurface marine-heatwave intensification or thermal-structure effects on typhoons. They do not measure marine food-web structure.',
  'Rejected for target mismatch.',
  'Titles and abstracts establish physical hazard outcomes only.'),
  'deforestation->vector_borne_disease_expansion::10.1016/j.baae.2017.09.012': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The primary evidence synthesis directly compares mosquito-vector responses across deforested or converted and forested tropical habitats, finding that conversion can favor important vectors while emphasizing conflicting, taxon-specific and geographic responses. Independent Latin American field-record analysis corroborates land-use associations.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://doi.org/10.1016/j.baae.2017.09.012', locator: 'Abstract, synthesis methods and results: forest conversion and mosquito-vector responses, with selected-taxa and cross-system limitations.' }),
      Object.freeze({ url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10348580/', locator: 'Independent analysis of 10,244 Aedes and Anopheles records in Latin America and the Caribbean, retaining forest-loss scale and taxonomic heterogeneity.' })
    ]),
    evidence_boundary: 'Promoted only as an indirect vector-habitat and contact pathway. Vector abundance or richness is not disease incidence, some vectors decline, and pathogen, host, geography, land-use type and public-health intervention remain required.'
  }),
  'thermal_stratification_intensification->marine_food_web_simplification::10.1016/j.rsma.2023.103359': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The primary 2018 Gulf of Lions study compares mixed/high-productivity and stratified/low-productivity seasons using stable isotopes and reports contraction of total benthic niche space, especially among low trophic levels. Independent sub-Arctic evidence provides explicit counterevidence against universal simplification.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://doi.org/10.1016/j.rsma.2023.103359', locator: 'Abstract and study design: April and September 2018 campaigns, hydrographic/productivity contrast, benthic stable isotopes and total niche-space contraction.' }),
      Object.freeze({ url: 'https://doi.org/10.1016/j.ecss.2024.108982', locator: 'Independent highly stratified sub-Arctic shelf study retained as counterevidence for food-web stability and resilience.' })
    ]),
    evidence_boundary: 'Promoted only as a seasonal single-site niche-contraction pathway. Two campaigns, trawling, isotope baselines and seasonal ecology preclude interpreting the result as extinction, permanent network simplification or global food-web collapse.'
  })
});

const JULY_25_SEVENTH_FRESH_INTAKE_DECISIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'food->nitrous_oxide::10.4028/www.scientific.net/amr.641-642.197',
    'food->nitrous_oxide::10.3390/agriculture11080730',
    'food->nitrous_oxide::10.3724/sp.j.1011.2010.00007'
  ], 'reject_agricultural_soil_process_as_broad_food_node_driver',
  'The studies measure nitrous-oxide emissions from agricultural soils or soil treatments. The platform Food node is an outcome/system label, not the specific fertilizer, soil, crop or management exposure.',
  'Rejected for source-node scope. Preserve under industrial-farming, fertilizer or soil-management relationships with flux units and field conditions retained.',
  'Titles and abstracts identify agricultural-soil emissions rather than a broad food-system causal exposure.'),
  ...july25ReviewedRejectionBatch([
    'deforestation->ice_sheet_mass_loss::10.1175/jcli-d-12-00546.1',
    'deforestation->ice_sheet_mass_loss::10.1038/d41586-022-01986-4',
    'deforestation->ice_sheet_mass_loss::10.1038/s41467-022-32632-2'
  ], 'reject_ice_sheet_mass_balance_or_basal_state_without_deforestation',
  'The records study Greenland mass-balance reconstruction, trapped meltwater or Antarctic basal thermal state. Deforestation is not the identified exposure.',
  'Rejected for missing source endpoint. A forest-loss-to-ice-sheet pathway would require explicit radiative or circulation mediation rather than generic climate context.',
  'Titles and abstracts establish ice-sheet internal or climate processes only.'),
  ...july25ReviewedRejectionBatch([
    'el_nino->drought_persistence::10.1029/2016eo055707',
    'el_nino->drought_persistence::10.1029/2015eo037601'
  ], 'retain_california_opposite_sign_commentary_as_counterevidence',
  'The Eos pieces discuss why a strong El Niño might not end an existing western United States drought. They are secondary commentary and do not provide a primary regional persistence estimate.',
  'Retained only as opposite-sign and nontermination counterevidence for the promoted regional teleconnection.',
  'Eos commentary and linked scientific context were reviewed for California sign and drought-recovery limits.'),
  ...july25ReviewedRejectionBatch([
    'el_nino->drought_persistence::10.30536/j.ijreses.2016.v13.a2450'
  ], 'retain_as_regional_event_corroboration_for_promoted_edge',
  'The South Sulawesi remote-sensing study evaluates the 2015 El Niño-induced drought event. It supports Indonesian regional context but is not the primary basis for the promoted lagged persistence edge.',
  'Retained as regional event corroboration only; no universal duration or effect is taken from it.',
  'Title and source context were checked for El Niño exposure, drought endpoint and geography.'),
  ...july25ReviewedRejectionBatch([
    'marine_heatwaves->fishery_border_dispute_zones::10.3390/jmse11010161',
    'marine_heatwaves->fishery_border_dispute_zones::10.1038/s41598-020-63650-z'
  ], 'reject_fisheries_management_area_or_impact_without_border_dispute',
  'The papers map marine heatwaves in Indonesian fisheries-management areas or assess fisheries impacts in the Northeast Pacific. Neither measures interstate maritime disputes, contested borders or conflict events.',
  'Rejected for absent governance-conflict endpoint. A fish-distribution-mediated dispute pathway requires fleet movement, jurisdiction and dispute observations.',
  'Titles and abstracts establish fisheries geography and impact but no border dispute.'),
  ...july25ReviewedRejectionBatch([
    'ocean_heat_content->coral_reef_fragmentation::10.3755/jcrs.19.151',
    'ocean_heat_content->coral_reef_fragmentation::10.1093/oxfclm/kgaf006',
    'ocean_heat_content->coral_reef_fragmentation::10.1093/oxfclm/kgae005'
  ], 'reject_bleaching_mortality_or_correction_as_ocean_heat_content_to_fragmentation',
  'The records concern coral bleaching or mortality during marine heatwaves, a correction, or a likely breaching/bleaching title issue. They do not measure vertically integrated ocean heat content as the exposure or reef-habitat fragmentation as the outcome.',
  'Rejected for both endpoint scopes. Heat-stress mortality and spatial fragmentation require separate relationships and metrics.',
  'Titles and available abstracts were reviewed for OHC and fragmentation.'),
  ...july25ReviewedRejectionBatch([
    'shipping->trophic_cascade_collapses::10.1016/j.sftr.2025.101054',
    'shipping->trophic_cascade_collapses::10.2139/ssrn.4187516',
    'shipping->trophic_cascade_collapses::10.1109/access.2023.3303872'
  ], 'reject_shipping_network_disruption_as_ecological_trophic_cascade',
  'The records optimize container-shipping networks under disruption. Cascade and collapse refer to logistics, not ecological trophic cascades.',
  'Rejected as network and disruption polysemy.',
  'Titles establish logistics endpoints only.'),
  ...july25ReviewedRejectionBatch([
    'environ_anomalies->water_stress::10.3390/w14121833',
    'environ_anomalies->water_stress::10.3390/cli14050104',
    'environ_anomalies->water_stress::10.5194/nhess-24-1099-2024'
  ], 'reject_crop_index_baseline_transmission_hazard_or_vegetation_stress_as_water_stress',
  'The records concern crop water-stress-index calibration, transmission-line hazards or vegetation stress under compound events. They do not measure the platform water-supply stress outcome caused by a named environmental anomaly.',
  'Rejected for broad exposure and endpoint mismatch.',
  'Titles and abstracts distinguish plant stress and infrastructure hazards from regional water stress.'),
  ...july25ReviewedRejectionBatch([
    'ocean_heat_content->environ_anomalies::10.1007/s10236-011-0411-x',
    'ocean_heat_content->environ_anomalies::10.1016/j.ocecoaman.2025.107755',
    'ocean_heat_content->environ_anomalies::10.1007/s11069-023-06119-2'
  ], 'reject_heat_content_variability_or_compound_hazard_context_as_broad_anomaly_outcome',
  'One paper describes ocean heat content and climate variability; the others analyze compound heat-drought exposure or association with the Pacific. None defines the broad Environmental Anomalies node as a bounded downstream metric of OHC.',
  'Rejected to avoid a non-falsifiable hub-to-umbrella edge. Named circulation, temperature, storm or compound-event outcomes require their own dossiers.',
  'Titles and abstracts were reviewed for a distinct measurable target.'),
  ...july25ReviewedRejectionBatch([
    'drought_persistence->snowpack_dust_soot_coverage::10.3390/atmos15121508'
  ], 'reject_snow_drought_index_as_dust_or_soot_deposition',
  'The paper develops a snow-based hydroclimatic drought index. It does not measure dust or soot coverage of snowpack.',
  'Rejected for target mismatch.',
  'Title and abstract establish a drought-identification method only.'),
  ...july25ReviewedRejectionBatch([
    'chemical_process_co2->drought_persistence::10.1029/2019eo122733'
  ], 'reject_generic_fossil_fuel_forcing_commentary_as_chemical_process_edge',
  'The Eos item summarizes fossil-fuel-driven drought research at aggregate forcing scale. It does not isolate chemical-process CO2 emissions.',
  'Rejected as a sector-specific bypass of the existing carbon-emissions and warming pathway.',
  'Secondary source scope and exposure boundary were reviewed.'),
  ...july25ReviewedRejectionBatch([
    'chemical_process_co2->drought_persistence::10.1029/2023eo230299'
  ], 'reject_drought_to_fossil_emissions_reverse_direction',
  'The Eos item discusses drought increasing fossil-fuel emissions, not chemical-process CO2 causing drought persistence.',
  'Rejected for reverse direction and sector mismatch.',
  'Title establishes reverse direction.'),
  ...july25ReviewedRejectionBatch([
    'chemical_process_co2->drought_persistence::10.1017/s0212610926100974'
  ], 'reject_economic_persistence_of_fossil_consumption_as_meteorological_drought',
  'The paper studies long persistence of fossil-fuel consumption in Spanish industry. It does not concern hydrologic or meteorological drought.',
  'Rejected as persistence polysemy.',
  'Title establishes economic-history endpoint.'),
  ...july25ReviewedRejectionBatch([
    'coal_industrial_heat_co2->drought_persistence::10.1007/s00382-024-07397-7',
    'coal_industrial_heat_co2->drought_persistence::10.3390/agronomy12102526'
  ], 'reject_co2_concentration_or_plant_experiment_as_coal_industrial_heat_emissions',
  'One paper studies ocean heat uptake after a CO2 concentration maximum; the other studies plant physiology under drought, heat and elevated CO2. Neither isolates coal industrial-heat emissions as the upstream exposure.',
  'Rejected for source-node and causal-scale mismatch. Sector emissions should not bypass aggregate carbon and climate mediators without attribution.',
  'Titles and abstracts establish global concentration or plant-treatment contexts.'),
});

const JULY_25_EIGHTH_FRESH_INTAKE_DECISIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'deforestation_co2_release->drought_persistence::10.1016/j.ecolind.2017.09.010'
  ], 'reject_woodland_indicator_persistence_as_hydroclimatic_drought',
  'The paper studies persistence of ancient-woodland indicator species after interruptions and deforestation. It does not measure carbon release or drought.',
  'Rejected as persistence and deforestation polysemy.',
  'Title establishes ecological indicator persistence rather than hydroclimatic drought.'),
  ...july25ReviewedRejectionBatch([
    'deforestation_co2_release->drought_persistence::10.1016/j.biocon.2018.03.005'
  ], 'reject_drought_induced_deforestation_reverse_direction',
  'The Madagascar study evaluates drought-induced deforestation and biodiversity consequences. It does not show CO2 released by deforestation causing drought persistence.',
  'Rejected for reverse direction and missing emissions exposure.',
  'Title and abstract establish drought as the upstream driver.'),
  ...july25ReviewedRejectionBatch([
    'deforestation_co2_release->drought_persistence::10.1007/s40641-018-0094-1'
  ], 'reject_general_co2_warming_drought_review_as_deforestation_release_attribution',
  'The review discusses drought indices, impacts, CO2 and warming historically. It does not isolate deforestation CO2 release as a driver of persistent drought.',
  'Rejected as a sector-source attribution bypass. The aggregate carbon-emissions and warming pathways already carry this mechanism.',
  'Review scope and exposure boundary were checked.'),
  ...july25ReviewedRejectionBatch([
    'fossil_power_backup_co2->drought_persistence::10.1007/s40974-026-00425-8'
  ], 'reject_power_system_fossil_persistence_as_drought',
  'The paper develops a stock-based framework for persistence of fossil power capacity. It does not concern meteorological or hydrologic drought.',
  'Rejected as persistence polysemy.',
  'Title establishes power-system transition endpoint.'),
  ...july25ReviewedRejectionBatch([
    'land_use_fire_co2->drought_persistence::10.3390/fire3030049'
  ], 'reject_fire_drought_interrelation_without_fire_co2_as_upstream_exposure',
  'The study analyzes mutual relationships among fire regime, rainfall seasonality, soil moisture, drought persistence and biomass. It does not isolate land-use-fire CO2 emissions as the upstream drought driver.',
  'Rejected for source-node mismatch and nonisolated direction. Preserve for regional fire-weather feedback research with explicit variables.',
  'Title and abstract show coupled ecological variables rather than the proposed emissions attribution.'),
  ...july25ReviewedRejectionBatch([
    'methane->wildfire_regime_shift::10.5194/bg-16-2651-2019'
  ], 'reject_wildfire_to_peatland_methane_reverse_direction',
  'The paper measures wildfire overriding hydrological controls on peatland methane emissions. Wildfire is the exposure and methane is the outcome.',
  'Rejected for reverse direction.',
  'Title and abstract establish the direction.'),
  ...july25ReviewedRejectionBatch([
    'methane->wildfire_regime_shift::10.1038/s41598-020-78170-z'
  ], 'reject_geological_methane_covariate_as_general_wildfire_regime_driver',
  'The regional study links geological methane emissions and wildfire risk in degraded permafrost, but does not establish atmospheric methane as a general driver of wildfire-regime shift. Shared permafrost degradation, geology and ignition conditions remain plausible common causes.',
  'Rejected for broad promotion. It may support a site-specific geological seepage and ignition-risk hypothesis after mechanism and confounder readback.',
  'Title and abstract were reviewed for methane source, scale and wildfire endpoint.'),
  ...july25ReviewedRejectionBatch([
    'methane->wildfire_regime_shift::10.1029/2021eo155204'
  ], 'reject_wildfire_emissions_cloud_seeding_reverse_direction',
  'The Eos item studies wildfire emissions seeding ice clouds. It does not show methane causing wildfire.',
  'Rejected for reverse direction and absent methane exposure.',
  'Title establishes wildfire emissions as the source.'),
  ...july25ReviewedRejectionBatch([
    'oil_building_heat_co2->drought_persistence::10.3390/su18147280',
    'oil_building_heat_co2->drought_persistence::10.1016/j.buildenv.2025.113957',
    'oil_building_heat_co2->drought_persistence::10.1177/01436244251414600'
  ], 'reject_urban_heat_roof_drought_condition_or_gas_use_persistence_as_sector_co2_drought',
  'The records concern urban surface-heat persistence, roof heat transfer under drought conditions, or persistence of household gas use after heat-pump installation. None estimates oil building-heat CO2 causing drought persistence.',
  'Rejected for endpoint polysemy and sector-source mismatch.',
  'Titles establish building or transition outcomes rather than hydroclimatic drought.'),
  ...july25ReviewedRejectionBatch([
    'oil_gas_flaring_co2->drought_persistence::10.2139/ssrn.2609853'
  ], 'reject_natural_gas_market_shock_persistence_as_drought',
  'The paper studies persistence of shocks in the United States natural-gas market. It does not concern flaring emissions or drought.',
  'Rejected as economic persistence polysemy.',
  'Title establishes market endpoint.')
});

const JULY_25_NINTH_FRESH_INTAKE_DECISIONS = Object.freeze({
  ...july25ReviewedRejectionBatch([
    'peatland_drainage_co2->drought_persistence::10.5194/bg-14-2891-2017',
    'peatland_drainage_co2->drought_persistence::10.1007/s10021-026-01085-9'
  ], 'reject_drought_to_peatland_carbon_flux_reverse_direction',
  'The studies use drought as an exposure and dissolved-organic-carbon release or peatland carbon-dioxide flux as outcomes. They do not show peat-drainage CO2 causing persistent drought.',
  'Rejected for reverse direction. Preserve for drought-to-peat-carbon relationships with water table, peat condition and flux units retained.',
  'Titles and abstracts establish drought as the upstream exposure.'),
  ...july25ReviewedRejectionBatch([
    'peatland_drainage_co2->drought_persistence::10.1061/jidedh.ireng-10514'
  ], 'reject_polymer_material_persistence_as_peatland_drought',
  'The record concerns material performance under drought-like conditions and does not study peat drainage, carbon dioxide or hydroclimatic drought persistence.',
  'Rejected as endpoint and persistence polysemy.',
  'Bibliographic context establishes an unrelated engineering-material application.'),
  ...july25ReviewedRejectionBatch([
    'rail_diesel_co2->drought_persistence::10.1016/j.geobios.2026.05.001'
  ], 'reject_fossil_leaf_persistence_as_rail_emissions_drought',
  'The paper concerns fossil leaves and palaeobotanical persistence, not rail diesel emissions or hydroclimatic drought.',
  'Rejected as fossil and persistence polysemy.',
  'Title establishes a palaeontological endpoint.'),
  ...july25ReviewedRejectionBatch([
    'temp->crop_yield_volatility::10.1016/j.still.2020.104747',
    'temp->crop_yield_volatility::10.2139/ssrn.4073417',
    'temp->crop_yield_volatility::10.1007/s12892-013-0106-6'
  ], 'reject_mean_yield_or_reverse_warming_potential_as_yield_volatility_evidence',
  'The returned records concern management effects on warming potential or mean crop productivity and yield under warming. They do not quantify interannual crop-yield variability as the outcome.',
  'Rejected as promotion anchors for the volatility edge. The live bounded relationship instead uses the exact global yield-variability studies.',
  'Titles and available abstracts were checked for a variance, coefficient-of-variation or volatility endpoint.'),
  ...july25ReviewedRejectionBatch([
    'temp->biodiversity_intactness_loss::10.1063/pt.5.028845',
    'temp->biodiversity_intactness_loss::10.15373/22778179/may2013/96',
    'temp->biodiversity_intactness_loss::10.1111/jbi.14590'
  ], 'reject_broad_biodiversity_or_genetic_erosion_as_bii_metric_evidence',
  'The records discuss Arctic biodiversity, broad climate-biodiversity concerns or alpine habitat and genetic erosion. None measures the Biodiversity Intactness Index or an equivalent retained intactness metric.',
  'Rejected for target-metric mismatch. Species, habitat, genetic-diversity and BII outcomes remain separate.',
  'Titles and abstracts were checked for exact intactness measurement and did not contain it.'),
  ...july25ReviewedRejectionBatch([
    'temp->critical_infrastructure_fragility::10.9770/ird.2022.4.4(1)',
    'temp->critical_infrastructure_fragility::10.15373/22778179/feb2013/16'
  ], 'reject_finance_or_reverse_urban_infrastructure_temperature_context',
  'One record concerns financial or infrastructure protection; the other frames urban infrastructure as modifying warming. Neither estimates warming-driven physical asset deterioration.',
  'Rejected for endpoint or direction mismatch.',
  'Titles and source context were reviewed for material deterioration and causal direction.'),
  'temp->critical_infrastructure_fragility::10.14359/51744358': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The reinforced-concrete service-life study directly models climate-sensitive deterioration across the contiguous United States and reports material- and location-specific reductions under RCP scenarios. Independent NIST coastal-infrastructure projections corroborate the material-deterioration pathway.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://doi.org/10.14359/51744358', locator: 'Results and extended study record: reinforced-concrete service-life projections, material classes, CONUS geography and up-to-20/30-percent reductions at 25 degrees north under RCP8.5.' }),
      Object.freeze({ url: 'https://www.nist.gov/publications/projections-corrosion-and-deterioration-infrastructure-united-states-coasts-under', locator: 'Independent NIST concrete and steel service-life projections for 223 coastal counties, 2000-2100.' })
    ]),
    evidence_boundary: 'Promoted only as a climate-sensitive material-deterioration pathway. The reported range is a scenario and material comparison, not a confidence interval, observed outage rate or universal infrastructure coefficient.'
  }),
  ...july25ReviewedRejectionBatch([
    'temp->public_health_heat_burden::10.1080/17441692.2026.2671510',
    'temp->public_health_heat_burden::10.1080/17441692.2010.511626'
  ], 'retain_heat_vulnerability_or_review_as_context_not_primary_effect_evidence',
  'The records provide vulnerability or political-ecology context but do not supply the primary bounded temperature-to-health-burden projection used for the live edge.',
  'Retained only as contextual literature; neither is counted as independent source-reported effect evidence.',
  'Titles and abstracts were reviewed for population, exposure and quantified health outcome.'),
  'temp->public_health_heat_burden::10.1186/s12889-019-7678-0': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open study combines Tianjin daily temperature and elderly ischemic-heart-disease deaths with 19 climate models and RCP scenarios to estimate future temperature-attributable years of life lost. It retains cold effects, demographics, adaptation and projection uncertainty.',
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://doi.org/10.1186/s12889-019-7678-0', locator: 'Methods, Results and Discussion: 2006-2011 Tianjin observations; 2050s/2070s RCP projections; heat-, cold- and total temperature-related YLL; demographic and adaptation scenarios.' }),
      Object.freeze({ url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/', locator: 'Independent assessment of heat-related mortality, morbidity, vulnerability and adaptation.' })
    ]),
    evidence_boundary: 'Promoted for Tianjin elderly ischemic-heart-disease burden as a bounded primary example plus an assessed general mechanism. Scenario percentages are not a universal per-degree coefficient or all-cause global forecast.'
  }),
  ...july25ReviewedRejectionBatch([
    'temp->sea_level_rise::10.52190/2073-2589_2023_2_32',
    'temp->sea_level_rise::10.54254/2753-8818/2025.19828'
  ], 'reject_non_authoritative_or_noncomponent_record_as_primary_sea_level_evidence',
  'The records do not provide the authoritative component-resolved ocean-warming-to-sea-level assessment required for this high-impact edge.',
  'Rejected as primary promotion evidence; IPCC component assessment and NOAA mechanism corroboration support the live edge.',
  'Bibliographic context was reviewed for thermosteric component definition, period, units and uncertainty.'),
  ...july25ReviewedRejectionBatch([
    'temp->sea_level_rise::10.1029/2023ef003649'
  ], 'retain_extreme_sea_level_coevolution_as_corroboration_not_thermosteric_effect',
  'The study addresses coevolution of extreme sea levels and climate conditions but is not the component-resolved basis for the thermosteric global-mean edge.',
  'Retained as adjacent compound-extreme context only; no coefficient is imported into the live thermosteric relationship.',
  'Title and source context were reviewed for total, extreme and thermosteric sea-level distinctions.'),
  ...july25ReviewedRejectionBatch([
    'industry_farming->temp::10.1051/e3sconf/202235203024',
    'industry_farming->temp::10.18480/jjae.19.0_54',
    'industry_farming->temp::10.6090/jarq.46.7'
  ], 'reject_warming_to_agriculture_reverse_direction',
  'The records study climate or warming impacts on agricultural systems. They do not quantify industrial farming as the upstream temperature driver.',
  'Rejected for reverse direction. Agriculture-to-temperature requires emissions, land-surface or albedo mechanisms with their own accounting boundary.',
  'Titles and abstracts establish warming as the exposure.'),
  ...july25ReviewedRejectionBatch([
    'temp->el_nino::10.1175/2010jcli3635.1',
    'temp->el_nino::10.1029/2019gl082943',
    'temp->el_nino::10.1029/2021gl094366'
  ], 'reject_coupled_enso_state_or_predictor_as_global_temperature_causation',
  'The papers study warm-pool temperature, regime relationships or warm-water volume within the coupled ENSO system. They do not establish global mean temperature as a one-way cause of El Niño.',
  'Rejected for direction and variable-scope mismatch. ENSO internal-state predictors are not interchangeable with the platform Global Temperature node.',
  'Titles and abstracts were reviewed for global-mean forcing, causal direction and ENSO event endpoint.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->el_nino::10.6000/1929-7092.2012.01.1'
  ], 'reject_enso_to_emissions_or_economy_reverse_direction',
  'The paper treats ENSO variability as an influence on emissions or economic activity rather than anthropogenic carbon emissions as a cause of El Niño events.',
  'Rejected for reverse direction and attribution scale.',
  'Title and abstract establish ENSO as the exposure.'),
  ...july25ReviewedRejectionBatch([
    'carbon_emission->la_nina::10.1007/s11356-023-29675-3',
    'carbon_emission->la_nina::10.6000/1929-7092.2012.01.1',
    'carbon_emission->la_nina::10.3390/logistics9030112'
  ], 'reject_phase_change_cold_chain_or_reverse_enso_emissions_polysemy',
  'The records concern phase-change materials, cold-chain logistics or ENSO-driven emissions/economic variation. None establishes carbon emissions causing La Niña.',
  'Rejected for endpoint polysemy or reverse direction.',
  'Titles and abstracts were reviewed for the ENSO cold-phase endpoint.'),
  ...july25ReviewedRejectionBatch([
    'industry_farming->crop_yield_volatility::10.3390/su122410680',
    'industry_farming->crop_yield_volatility::10.1016/j.agwat.2026.110312',
    'industry_farming->crop_yield_volatility::10.1016/j.agwat.2024.108927'
  ], 'reject_climate_or_irrigation_yield_study_as_industrial_farming_cause',
  'The records concern climate-synchronized yield and price variation or irrigation effects on yield. They do not identify industrial farming as the upstream cause of yield volatility.',
  'Rejected for source-node scope and direction. Management-specific variability relationships require explicit treatment, comparator and variance outcome.',
  'Titles and abstracts were checked for industrial-farming exposure and volatility outcome.'),
  ...july25ReviewedRejectionBatch([
    'temp->migration::10.55908/sdgs.v13i8.4518',
    'temp->migration::10.1177/01979183251376526',
    'temp->migration::10.32474/lojms.2018.02.000139'
  ], 'reject_perspective_book_review_or_commentary_as_primary_temperature_migration_evidence',
  'The records are a perspective, book review or weak commentary and do not provide a bounded primary temperature-exposure migration estimate.',
  'Rejected as promotion anchors. A live edge requires location-specific heat or temperature exposure, migration outcome, lag, livelihood pathway and alternative economic drivers.',
  'Publication type and available context were reviewed for primary empirical design.')
});

export const LITERATURE_FULL_TEXT_DECISIONS = Object.freeze({
  ...CURRENT_CROSSREF_REJECTIONS,
  ...CORRECTED_QUEUE_CROSSREF_REJECTIONS,
  ...LATEST_CORRECTED_QUEUE_CROSSREF_REJECTIONS,
  ...JULY_25_CORRECTED_QUEUE_REJECTIONS,
  ...JULY_25_THROTTLE_RECOVERY_REJECTIONS,
  ...JULY_25_FRESH_INTAKE_DECISIONS,
  ...JULY_25_SECOND_FRESH_INTAKE_REJECTIONS,
  ...JULY_25_SECOND_FRESH_INTAKE_PROMOTIONS,
  ...JULY_25_THIRD_FRESH_INTAKE_DECISIONS,
  ...JULY_25_FOURTH_FRESH_INTAKE_DECISIONS,
  ...JULY_25_FIFTH_FRESH_INTAKE_DECISIONS,
  ...JULY_25_SIXTH_FRESH_INTAKE_DECISIONS,
  ...JULY_25_SEVENTH_FRESH_INTAKE_DECISIONS,
  ...JULY_25_EIGHTH_FRESH_INTAKE_DECISIONS,
  ...JULY_25_NINTH_FRESH_INTAKE_DECISIONS,
  ...JULY_19_FULL_TEXT_QUEUE_DECISIONS,
  'glacier_calving_events->glacial_lake_failure_risk::10.1088/2515-7620/ae1936': Object.freeze({
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open full text reports rapid glacier-front retreat, repeated calving, moraine weakening, intermittent rainfall, and breach at South Lhonak. Independent event reconstruction corroborates a combined calving-landslide-wave pathway, while a separate trigger analysis supports retaining landslide dominance as counterevidence.',
    reviewed_at: '2026-07-18',
    reviewer: 'northstar_full_text_readback_v1',
    evidence_boundary: 'Promoted only for ice-contact moraine-dammed lakes under the dossier geography, time, lake, moraine, slope, hydrologic, and wave conditions. It is not a universal claim that calving causes GLOFs.',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.1088/2515-7620/ae1936',
        locator: 'Results and Conclusions: 49.6 +/- 7.1 m retreat immediately before the event; seven large calving events since 2017; combined calving, moraine change, rainfall, and breach interpretation.'
      }),
      Object.freeze({
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13013771/',
        locator: 'Discussion and Figure 5: more than 100 m retreat, about 7 million cubic metres calved ice, about 38.31 million cubic metres landslide debris, and combined displacement waves.'
      }),
      Object.freeze({
        url: 'https://doi.org/10.1080/19475705.2026.2625407',
        locator: 'Trigger analysis used as counterevidence: debuttressing and calving are documented, but the immediate failure interpretation emphasizes lateral-moraine landslide processes.'
      })
    ])
  }),
  'temp->el_nino::10.1371/journal.pgph.0005796': Object.freeze({
    decision: 'reject_endpoint_mismatch_after_metadata_review',
    rationale: 'The study outcome is dengue dynamics in Colombia and the exposure is sea-surface temperature in El Nino regions. It does not test Global Temperature causing El Nino.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected for this directed edge; the record may be relevant to an ENSO-to-health pathway but cannot support temp->el_nino.'
  }),
  'monsoon_volatility->industry_farming::10.71279/epw.v60i3.37645': Object.freeze({
    decision: 'reject_intervention_direction_mismatch_after_metadata_review',
    rationale: 'The title concerns a pre-monsoon dry-sowing intervention and yield efficiency, not monsoon volatility causing industrial farming.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected for the proposed direction and endpoint definition; farming adaptation to monsoon timing is a different claim.'
  }),
  'monsoon_volatility->industry_farming::10.55373/mjchem.v28i1.124': Object.freeze({
    decision: 'reject_endpoint_scope_mismatch_after_metadata_review',
    rationale: 'A short-term water-quality case study at a monsoon-affected caged-fish site does not establish a relationship to the platform Industrial Farming node.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected for endpoint mismatch; it may support a bounded monsoon-to-aquaculture-water-quality claim.'
  }),
  'monsoon_volatility->industry_farming::10.1002/ijfe.70208': Object.freeze({
    decision: 'reject_polysemous_finance_match_after_metadata_review',
    rationale: 'Industry portfolio volatility is a finance-market use of volatility and is unrelated to monsoon variability or agricultural systems.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected as a polysemous bibliographic match and prohibited from environmental edge evidence.'
  }),
  'carbon_emission->el_nino::10.1038/d44148-025-00233-y': Object.freeze({
    decision: 'reject_compilation_record_after_metadata_review',
    rationale: 'This is a multi-topic research-highlights compilation whose title merely juxtaposes El Nino and carbon mitigation; it does not test the directed relationship.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected as a compilation-title coincidence; it cannot be cited for carbon_emission->el_nino.'
  }),
  'carbon_emission->el_nino::10.1051/matecconf/202541002024': Object.freeze({
    decision: 'reject_reverse_direction_after_metadata_review',
    rationale: 'The stated relationship is ENSO variability affecting the ocean carbon cycle, the reverse of carbon emissions causing El Nino.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected for carbon_emission->el_nino; any use requires a separately reviewed ENSO-to-carbon-cycle edge.'
  }),
  'carbon_emission->el_nino::10.1088/2515-7620/ade75f': Object.freeze({
    decision: 'reject_reverse_direction_after_metadata_review',
    rationale: 'The study concerns climate and terrestrial-carbon-cycle responses to El Nino types, not carbon emissions as a driver of El Nino.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected for the proposed direction; response of the carbon cycle to ENSO is a different estimand.'
  }),
  'carbon_emission->la_nina::10.1051/matecconf/202541002024': Object.freeze({
    decision: 'reject_reverse_direction_after_metadata_review',
    rationale: 'The stated relationship is ENSO variability affecting the ocean carbon cycle, not carbon emissions causing La Nina.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected for carbon_emission->la_nina; the reverse carbon-cycle response requires separate review.'
  }),
  'carbon_emission->la_nina::10.1029/2024gl112039': Object.freeze({
    decision: 'reject_reverse_direction_after_metadata_review',
    rationale: 'The title explicitly describes ocean-carbon responses to La Nina and El Nino, reversing the proposed source and target.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected for the proposed direction; it cannot support emissions causing La Nina.'
  }),
  'cooling_water_competition->transformer_heat_failure_risk::10.55677/craj/03-2025-vol02i11': Object.freeze({
    decision: 'reject_engineering_cooling_polysemy_after_metadata_review',
    rationale: 'The paper concerns internal transformer heat-flow and cooling design, not competition for external cooling-water resources.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected as cooling-system polysemy; it may inform asset thermal design but not cooling_water_competition.'
  }),
  'cooling_water_competition->transformer_heat_failure_risk::10.32604/fhmt.2026.081961': Object.freeze({
    decision: 'reject_dry_cooling_endpoint_mismatch_after_metadata_review',
    rationale: 'Failure analysis of dry cooling systems does not test water competition as a driver of transformer failure risk.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected for source-endpoint mismatch and prohibited from supporting a water-competition claim.'
  }),
  'cooling_water_competition->transformer_heat_failure_risk::10.54097/md5k7f48': Object.freeze({
    decision: 'reject_materials_processing_polysemy_after_metadata_review',
    rationale: 'The paper is about heat-treatment cooling of a titanium alloy and is unrelated to transformers or environmental cooling-water competition.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected as a materials-processing keyword collision.'
  }),
  'industry_farming->food::10.48014/tpcp.20250411002': Object.freeze({
    decision: 'reject_education_polysemy_after_metadata_review',
    rationale: 'Farming-and-reading education at an agricultural university is not evidence about industrial farming effects on food systems.',
    reviewed_at: '2026-07-18', reviewer: 'northstar_metadata_context_review_v1', source_locators: [],
    evidence_boundary: 'Rejected as an education-domain keyword collision.'
  }),
  'temp->el_nino::10.1504/ijgw.2025.146267': reviewedMetadataDecision(
    'reject_undirected_association_for_causal_edge',
    'Multiscale association between global temperature anomaly and ENSO does not establish Global Temperature as a directed cause of El Nino; the coupled variables share feedbacks and timescales.',
    'Rejected for the directed edge. A descriptive association may be retained only outside the causal graph or under a separately reviewed bidirectional climate-mode model.'
  ),
  'temp->el_nino::10.1029/2024gl113733': reviewedMetadataDecision(
    'reject_reverse_direction_after_full_text_readback',
    'The open research letter identifies El Nino and sea-surface-temperature patterns as contributors to the 2023 global mean temperature anomaly. It tests ENSO-to-GMST influence, not GMST causing El Nino.',
    'Rejected for temp->el_nino. The study can support a bounded el_nino->temp anomaly relationship but not the queued arrow.'
  ),
  'glacier_calving_events->glacial_lake_failure_risk::10.1017/jog.2025.10112': reviewedMetadataDecision(
    'reject_exact_mechanism_mismatch_after_full_text_readback',
    'The open Journal of Glaciology paper maps glacier recession, lake evolution, and GLOF susceptibility in the Bolivian Andes. It does not isolate calving as the exposure or estimate a calving-to-failure mechanism.',
    'Retained as background for deglaciation and lake susceptibility, but rejected as exact relationship evidence for glacier_calving_events->glacial_lake_failure_risk.'
  ),
  'ice_sheet_mass_loss->glacier_calving_events::10.1109/jstars.2026.3660280': reviewedMetadataDecision(
    'reject_outcome_measure_as_driver',
    'GRACE-derived glacier-scale mass change measures the mass-loss outcome. It does not show aggregate ice-sheet mass loss causing discrete calving events.',
    'Rejected for the queued direction; mass loss is an accounting outcome that can include calving, not a demonstrated calving trigger.'
  ),
  'ice_sheet_mass_loss->glacier_calving_events::10.1016/j.epsl.2026.119930': reviewedMetadataDecision(
    'reject_reverse_mechanism_direction',
    'The title and study framing concern mechanisms of dynamic mass loss at a freshwater-calving glacier, meaning calving dynamics contribute to mass loss rather than mass loss acting as the upstream trigger.',
    'Rejected for ice_sheet_mass_loss->glacier_calving_events; any reverse edge requires its own bounded freshwater-glacier dossier.'
  ),
  'ice_sheet_mass_loss->glacier_calving_events::10.1029/2024jb030862': reviewedMetadataDecision(
    'reject_missing_calving_exposure',
    'The study combines GRACE-FO and altimetry to resolve spatial changes in Greenland mass loss. It does not identify calving events as a response to prior aggregate mass loss.',
    'Rejected for the exact edge; useful mass-balance measurement does not establish the queued mechanism.'
  ),
  'industry_farming->food::10.1016/j.jdeveco.2025.103681': reviewedMetadataDecision(
    'reject_endpoint_and_direction_mismatch_after_full_text_readback',
    'The study models nutrition demand, trade costs, subsistence crop choice, and agricultural productivity in Malawi. Its subsistence-farming exposure is not the platform Industrial Farming node, and nutrition demand partly drives production choices.',
    'Rejected for industry_farming->food. The reported productivity counterfactual belongs to a separately defined trade-friction and subsistence-agriculture estimand.'
  ),
  'industry_farming->food::10.1016/j.farsys.2025.100165': reviewedMetadataDecision(
    'reject_intervention_scope_mismatch',
    'The Australian smart-farming review concerns adoption of agricultural technology for sustainability. It does not estimate industrial farming as a driver of the platform Food outcome.',
    'Rejected for the queued edge; agri-tech intervention evidence requires a distinct response node and measurable food-system outcome.'
  ),
  'food->deforestation::10.1093/ej/ueaf125': reviewedMetadataDecision(
    'reject_source_endpoint_mismatch_after_full_text_readback',
    'The study estimates effects of road expansion, transport costs, market access, and agricultural production on Brazilian deforestation. The platform Food node is not the exposure.',
    'Rejected for food->deforestation; the paper may support roads or market access driving agricultural land conversion.'
  ),
  'food->deforestation::10.2139/ssrn.6527027': reviewedMetadataDecision(
    'reject_source_endpoint_mismatch_after_full_text_readback',
    'The paper identifies extreme heat shocks to agricultural productivity, local prices, and cropland expansion as the pathway to forest loss. It does not use the platform Food node as the causal exposure.',
    'Rejected for food->deforestation; the supported chain is heat shock -> yield and price response -> cropland expansion -> forest loss.'
  ),
  'food->deforestation::10.1016/j.geoforum.2026.104558': reviewedMetadataDecision(
    'reject_source_endpoint_mismatch',
    'The study title identifies debt-driven migration and agricultural-frontier clearing, not food as the upstream exposure.',
    'Rejected for food->deforestation; migration, debt, and frontier governance require separate endpoint contracts.'
  ),
  'deforestation->food::10.1093/ej/ueaf125': reviewedMetadataDecision(
    'reject_reverse_and_endpoint_mismatch_after_full_text_readback',
    'The paper studies new roads and market access changing agricultural production and deforestation. It does not estimate deforestation causing a Food outcome.',
    'Rejected for deforestation->food; neither endpoint direction in the queued pair matches the study design.'
  ),
  'deforestation->food::10.2139/ssrn.6527027': reviewedMetadataDecision(
    'reject_reverse_direction_after_full_text_readback',
    'The documented sequence runs from heat-related agricultural productivity shocks to cropland expansion and deforestation, not from deforestation to food outcomes.',
    'Rejected for deforestation->food; the paper supports a different multi-step causal chain.'
  ),
  'deforestation->food::10.1016/j.geoforum.2026.104558': reviewedMetadataDecision(
    'reject_target_endpoint_mismatch',
    'The title and scope concern migration, debt, and forest clearing on an agricultural frontier rather than a measured Food outcome caused by deforestation.',
    'Rejected for deforestation->food.'
  ),
  'deforestation->urbanization::10.32479/ijeep.20376': reviewedMetadataDecision(
    'reject_shared_predictors_not_directed_pair',
    'The Pakistan study treats deforestation, urbanization, and economic growth as predictors of greenhouse-gas emissions. Co-inclusion in an emissions model does not establish deforestation causing urbanization.',
    'Rejected for the directed pair; shared outcome predictors must not be converted into an edge between predictors.'
  ),
  'deforestation->urbanization::10.22271/allresearch.2026.v12.i5b.13628': reviewedMetadataDecision(
    'reject_broad_topic_cooccurrence',
    'The broad review title lists climate change, biodiversity loss, pollution, deforestation, and urbanization as ecological challenges without identifying a directed deforestation-to-urbanization estimand.',
    'Rejected as topic co-occurrence rather than relationship-specific evidence.'
  ),
  'urbanization->deforestation::10.32479/ijeep.20376': reviewedMetadataDecision(
    'reject_shared_predictors_not_directed_pair',
    'The Pakistan study uses urbanization and deforestation as separate greenhouse-gas predictors and does not estimate urbanization causing forest loss.',
    'Rejected for the directed pair; a common emissions outcome does not entail an edge between predictors.'
  ),
  'urbanization->deforestation::10.22271/allresearch.2026.v12.i5b.13628': reviewedMetadataDecision(
    'reject_broad_topic_cooccurrence',
    'The review co-lists urbanization and deforestation among global ecological pressures but provides no bounded directed relationship or effect estimate.',
    'Rejected as topic co-occurrence rather than exact edge evidence.'
  ),
  'urbanization->migration::10.2139/ssrn.5351579': reviewedMetadataDecision(
    'reject_undirected_policy_topic_match',
    'A policy paper on migration, urbanization, and inclusion does not by title or metadata establish urbanization as a directed cause of migration.',
    'Rejected for the causal edge; descriptive co-development belongs outside the causal layer until an exact design is reviewed.'
  ),
  'urbanization->migration::10.64448/myresearchgo..vol.2.issue.1.09': reviewedMetadataDecision(
    'reject_reverse_direction_from_title',
    'The title explicitly describes migration-led urbanization, reversing the queued urbanization-to-migration direction.',
    'Rejected for urbanization->migration; any migration->urbanization claim needs its own evidence and scope review.'
  ),
  'urbanization->migration::10.1016/j.chieco.2025.102513': reviewedMetadataDecision(
    'reject_policy_counterfactual_not_directed_edge',
    'The China spatial-equilibrium study estimates welfare effects of reduced rural-urban migration costs during urbanization. Migration-cost change is the modeled intervention; urbanization is not isolated as a cause of migration.',
    'Rejected for the queued edge; the reported welfare estimates cannot be repurposed as an urbanization-to-migration effect.'
  ),
  ...reviewedRejectionBatch([
    'temp->el_nino::10.1504/ijgw.2025.10069728'
  ], 'reject_reverse_enso_to_temperature_direction_after_abstract_readback',
  'The published abstract assesses the influence and multiscale association of ENSO with global surface-air-temperature anomalies. It does not identify global temperature as an upstream cause of El Nino, and correlation or shared periodicity cannot establish the queued causal direction.',
  'Rejected for temp->el_nino after abstract readback. The published article record is 10.1504/IJGW.2025.146267 and may inform bounded ENSO-to-temperature association context, but it cannot support the reverse arrow.'),
  ...reviewedRejectionBatch([
    'ice_sheet_mass_loss->glacier_calving_events::10.5194/tc-8-1445-2014'
  ], 'reject_mass_balance_record_without_calving_endpoint',
  'The Union Glacier study measures surface mass balance and ice dynamics but does not use calving-event occurrence, frequency, flux, or retreat-by-calving as the response variable.',
  'Rejected for ice_sheet_mass_loss->glacier_calving_events. Mass-balance measurement without a calving endpoint cannot establish aggregate ice-sheet mass loss as a calving trigger.'),
  ...reviewedRejectionBatch([
    'ice_sheet_mass_loss->glacier_calving_events::10.1029/2017eo086471'
  ], 'reject_stability_context_without_directed_mass_loss_to_calving_estimate',
  'The Pine Island Glacier record discusses glacier and ice-sheet stability but does not estimate prior aggregate ice-sheet mass loss as a driver of discrete calving events.',
  'Rejected for the queued direction. Glacier-front instability and calving may contribute to dynamic mass loss; that does not prove mass loss is the upstream calving exposure.'),
  ...reviewedRejectionBatch([
    'ice_sheet_mass_loss->glacier_calving_events::10.1063/pt.5.027096'
  ], 'reject_reverse_or_competing_melting_mechanism',
  'The record explicitly contrasts melting with calving as explanations for Antarctic ice loss. Calving is framed as a possible contributor to mass loss, not as an event caused by prior aggregate ice-sheet mass loss.',
  'Rejected for ice_sheet_mass_loss->glacier_calving_events and retained only as counterevidence about competing components of the ice-sheet mass budget.'),
  ...reviewedRejectionBatch([
    'cooling_water_competition->transformer_heat_failure_risk::10.1016/j.applthermaleng.2018.03.019'
  ], 'reject_transformer_cooling_design_as_water_competition_evidence',
  'The numerical engineering study evaluates a hybrid internal cooling-system design for a power transformer. It does not measure competition for an external water source, water shortage, withdrawal curtailment, or a resulting transformer failure outcome.',
  'Rejected for cooling_water_competition->transformer_heat_failure_risk. Internal thermal-management design is not environmental cooling-water competition.'),
  ...reviewedRejectionBatch([
    'resource_depletion->migration::10.1080/13678868.2011.558316',
    'resource_depletion->migration::10.1080/13678868.2010.520483'
  ], 'reject_human_resource_development_polysemy',
  'Both records use resource in the organizational phrase human resource development. They study labour migration, work identity, or workforce development rather than depletion of material, water, land, soil, mineral, or ecosystem stocks.',
  'Rejected as complete source-endpoint polysemy and prohibited from supporting resource_depletion->migration.')
});

// Full-text promotions discovered outside the rotating Crossref candidate batch
// remain explicit ledger records. They are never inferred from bibliographic
// metadata and must point to a live, dossier-gated edge.
export const MANUAL_FULL_TEXT_PROMOTIONS = Object.freeze([
  Object.freeze({
    adjudication_id: 'marine_heatwaves->tropical_cyclone_rapid_intensification::10.1038/s43247-024-01578-2',
    edge_key: 'marine_heatwaves->tropical_cyclone_rapid_intensification',
    query: 'marine heatwaves tropical cyclone rapid intensification',
    title: 'Rapid intensification of tropical cyclones in the Gulf of Mexico is more likely during marine heatwaves',
    doi: '10.1038/s43247-024-01578-2',
    url: 'https://doi.org/10.1038/s43247-024-01578-2',
    published: '2024-08-09',
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open full text evaluates the exact directed pair using 1950-2022 IBTrACS storms and ERA5 marine-heatwave conditions. It reports a 1.5-fold average and up to 5-fold spatial multiplication of rapid-intensification likelihood in identified Gulf of Mexico and northwestern Caribbean hotspots, while retaining atmospheric and storm-scale co-drivers and methodological limitations.',
    source_endpoint_terms: Object.freeze(['marine', 'heatwaves']),
    target_endpoint_terms: Object.freeze(['tropical', 'cyclone', 'rapid', 'intensification']),
    source_title_hits: Object.freeze(['marine', 'heatwaves']),
    target_title_hits: Object.freeze(['tropical', 'cyclone', 'rapid', 'intensification']),
    reviewed_at: '2026-07-18',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://www.nature.com/articles/s43247-024-01578-2',
        locator: 'Abstract; Results Figures 7-8; Discussion; Methods: exact conditional-probability comparison, 1.5-fold average and up to 5-fold hotspot multiplication, 1950-2022 domain, thresholds, significance screen and limitations.'
      }),
      Object.freeze({
        url: 'https://www.aoml.noaa.gov/ocean-conditions-in-the-intensification-of-hurricane-michael-2018/',
        locator: 'NOAA AOML mechanism corroboration for upper-ocean thermal structure, air-sea exchange, storm-induced cooling and atmospheric controls on hurricane intensification.'
      })
    ]),
    evidence_boundary: 'Promoted only as a 1950-2022 Gulf of Mexico and northwestern Caribbean conditional relationship using the source marine-heatwave and rapid-intensification definitions. It is not a global causal coefficient, and marine heatwaves are neither necessary nor sufficient.'
  }),
  Object.freeze({
    adjudication_id: 'ocean_heat_content->sea_level_rise::ipcc-ar6-wgi-chapter-9',
    edge_key: 'ocean_heat_content->sea_level_rise',
    query: 'ocean heat content global mean thermosteric sea level',
    title: 'IPCC AR6 WGI Chapter 9: Ocean, Cryosphere and Sea Level Change',
    doi: null,
    url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
    published: '2021',
    decision: 'authoritative_source_confirmed_bounded_and_promoted',
    rationale: 'IPCC AR6 WGI directly states that changes in globally averaged ocean heat content cause global mean thermosteric sea-level change through density-driven thermal expansion. Section 9.2.4.1 reports an assessed conversion of 0.113 plus or minus 0.013 metres per yottajoule, corroborated by NOAA as a major global sea-level mechanism.',
    source_endpoint_terms: Object.freeze(['ocean', 'heat', 'content']),
    target_endpoint_terms: Object.freeze(['sea', 'level', 'rise']),
    source_title_hits: Object.freeze(['ocean']),
    target_title_hits: Object.freeze(['sea', 'level']),
    reviewed_at: '2026-07-19',
    reviewer: 'northstar_authoritative_source_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
        locator: 'Box 9.1 and Section 9.2.4.1: OHC causes GMTSL change; thermal expansion mechanism; assessed 0.113 plus or minus 0.013 metres per yottajoule conversion.'
      }),
      Object.freeze({
        url: 'https://oceanservice.noaa.gov/facts/sealevel.html',
        locator: 'NOAA Ocean Service corroboration that ocean-warming thermal expansion is one of the two major causes of global sea-level rise.'
      })
    ]),
    evidence_boundary: 'Promoted only for globally integrated OHC and the global mean thermosteric component. It is not a conversion from sea-surface or global surface-air temperature, total sea level, or local relative sea level; mass, circulation, salinity and vertical-land-motion terms remain separate.'
  }),
  Object.freeze({
    adjudication_id: 'wildfire_regime_shift->air_pollution_health_burden::10.1007/s11270-025-08047-2',
    edge_key: 'wildfire_regime_shift->air_pollution_health_burden',
    query: 'wildfire regime air pollution health burden',
    title: 'Air Pollution and Health Impacts of Wildfire Seasons: Insights from Northern Portugal',
    doi: '10.1007/s11270-025-08047-2',
    url: 'https://doi.org/10.1007/s11270-025-08047-2',
    published: '2025-04-30',
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open full text connects wildfire-season and burned-area observations to measured PM10, PM2.5, ozone and nitrogen dioxide, public-health surveillance and WHO AIRQ+ mortality estimates in Northern Portugal during 2019-2022. The edge is promoted as an indirect smoke-mediated pathway and retains non-significant health comparisons, missing-data limitations, meteorological confounding and ecological-design limits.',
    source_endpoint_terms: Object.freeze(['wildfire', 'regime', 'shift']),
    target_endpoint_terms: Object.freeze(['air', 'pollution', 'health', 'burden']),
    source_title_hits: Object.freeze(['wildfire', 'seasons']),
    target_title_hits: Object.freeze(['air', 'pollution', 'health', 'impacts']),
    reviewed_at: '2026-07-19',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.1007/s11270-025-08047-2',
        locator: 'Abstract; Methods Sections 2.1-2.5; Results Sections 3.1-3.4; Discussion and limitations: 2019-2022 Northern Portugal fire, pollutant and health-surveillance data with WHO AIRQ+ mortality estimation and explicit observational limitations.'
      }),
      Object.freeze({
        url: 'https://www.who.int/health-topics/wildfires',
        locator: 'Independent WHO mechanism corroboration for wildfire smoke, particulate exposure, respiratory and cardiovascular effects, mortality and vulnerable populations.'
      })
    ]),
    evidence_boundary: 'Promoted only as a smoke-mediated indirect relationship. Northern Portugal pollutant changes, visit comparisons and mortality estimates are not globalized; non-significant visit and medication-cost differences are preserved, and no effect coefficient is inferred without smoke-specific exposure and endpoint uncertainty.'
  }),
  Object.freeze({
    adjudication_id: 'peatland_degradations->carbon_emission::10.22146/ipas.6170',
    edge_key: 'peatland_degradations->carbon_emission',
    query: 'peatland degradation carbon emission',
    title: 'A Study of Carbon Dioxide Emission in Different Types of Peatland Use in Kalimantan',
    doi: '10.22146/ipas.6170',
    url: 'https://doi.org/10.22146/ipas.6170',
    published: '2009',
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The field study measures carbon-dioxide flux across drained peatland uses in Central and West Kalimantan and reports a positive water-table-depth relationship. IPCC Wetlands Supplement Chapter 2 independently supplies the authoritative drained-organic-soil mechanism, persistence conditions, stratification requirements and separate fire term.',
    source_endpoint_terms: Object.freeze(['peatland', 'degradation']),
    target_endpoint_terms: Object.freeze(['carbon', 'emission']),
    source_title_hits: Object.freeze(['peatland', 'use']),
    target_title_hits: Object.freeze(['carbon', 'dioxide', 'emission']),
    reviewed_at: '2026-07-19',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://doi.org/10.22146/ipas.6170',
        locator: 'Methods, Results and Conclusion: Central and West Kalimantan peat-use comparisons, 2006-2007 infrared-gas-analyzer measurements, reported flux range and water-table-depth relationship.'
      }),
      Object.freeze({
        url: 'https://www.ipcc-nggip.iges.or.jp/public/wetlands/pdf/Wetlands_separate_files/WS_Chp2_Drained_Inland_Organic_Soils.pdf',
        locator: 'Sections 2.1-2.2 and Table 2.1: drainage, decomposition, dissolved-organic-carbon and fire terms; persistence and stratification; tropical drained-forest emission factor and uncertainty.'
      })
    ]),
    evidence_boundary: 'Promoted only for drained organic soils with land use, climate, nutrient status, drainage depth, time since drainage, fire and remaining organic matter retained. The Kalimantan flux range is not generalized; the IPCC tropical drained forest factor is source-reported with its propagated uncertainty and is not a universal peatland coefficient.'
  }),
  Object.freeze({
    adjudication_id: 'marine_heatwaves->marine_food_web_simplification::10.5194/bg-22-6583-2025',
    edge_key: 'marine_heatwaves->marine_food_web_simplification',
    query: 'marine heatwaves marine food web simplification',
    title: 'Marine heatwaves deeply alter marine food web structure and function',
    doi: '10.5194/bg-22-6583-2025',
    url: 'https://bg.copernicus.org/articles/22/6583/2025/',
    published: '2025-12-17',
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open full text directly compares satellite-forced food-web simulations with marine heatwaves retained versus filtered and reports trophic-level, energy-transfer and biomass responses. An independent open Northeast Pacific food-web model study corroborates the mechanism.',
    source_endpoint_terms: Object.freeze(['marine', 'heatwaves']),
    target_endpoint_terms: Object.freeze(['marine', 'food', 'web']),
    source_title_hits: Object.freeze(['marine', 'heatwaves']),
    target_title_hits: Object.freeze(['marine', 'food', 'web']),
    reviewed_at: '2026-07-19',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://bg.copernicus.org/articles/22/6583/2025/', locator: 'Abstract; Methods; Results Figures 3-9; Discussion and limitations: with-versus-filtered-MHW scenarios, trophic biomass and energy-transfer changes, -8.7 percent +/- 1.0 standard error northeastern Pacific estimate and structural uncertainty.' }),
      Object.freeze({ url: 'https://www.nature.com/articles/s41467-024-46263-2', locator: 'Independent open Northeast Pacific food-web and energy-flux analysis during the Blob marine heatwave.' })
    ]),
    evidence_boundary: 'Promoted as a model-supported food-web disruption pathway. The quantified estimate is limited to the northeastern Pacific 2013-2016 event and is not an observed whole-ocean, species-level or universal collapse coefficient.'
  }),
  Object.freeze({
    adjudication_id: 'deforestation->temp::10.1029/2018gl080211',
    edge_key: 'deforestation->temp',
    query: 'deforestation global mean surface temperature response',
    title: 'Nonlocal Effects Dominate the Global Mean Surface Temperature Response to the Biogeophysical Effects of Deforestation',
    doi: '10.1029/2018GL080211',
    url: 'https://doi.org/10.1029/2018GL080211',
    published: '2019-01-16',
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The primary climate-model study addresses the global-mean biophysical temperature response, while independent global satellite and tropical observational studies establish local day-night and human-exposure responses. Together they support a direct but sign-changing edge.',
    source_endpoint_terms: Object.freeze(['deforestation']),
    target_endpoint_terms: Object.freeze(['temperature']),
    source_title_hits: Object.freeze(['deforestation']),
    target_title_hits: Object.freeze(['temperature']),
    reviewed_at: '2026-07-19',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://doi.org/10.1029/2018GL080211', locator: 'Abstract and model analysis: realistic deforestation scenarios, local/nonlocal decomposition, global-mean biophysical response and model limitations.' }),
      Object.freeze({ url: 'https://doi.org/10.1002/2016JG003653', locator: 'Global satellite, reanalysis and flux-tower analysis of day-night surface-temperature response and physical mechanisms.' }),
      Object.freeze({ url: 'https://doi.org/10.1016/j.gloenvcha.2018.07.004', locator: 'Tropical local-temperature and perceived-well-being corroboration.' })
    ]),
    evidence_boundary: 'The edge is promoted as alters, not raises. Local satellite contrasts, modelled global-mean biophysical effects and carbon-cycle warming remain separate; sign and magnitude depend on scale, latitude, time of day, season, clearing extent and carbon inclusion.'
  }),
  Object.freeze({
    adjudication_id: 'permafrost_thaw->polar_infrastructure_failure::10.1038/s43247-024-01317-7',
    edge_key: 'permafrost_thaw->polar_infrastructure_failure',
    query: 'permafrost thaw polar infrastructure failure',
    title: 'A framework to assess permafrost thaw threat for land transportation infrastructure in northern Canada',
    doi: '10.1038/s43247-024-01317-7',
    url: 'https://www.nature.com/articles/s43247-024-01317-7',
    published: '2024-03-30',
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open primary study evaluates the exact thaw-to-infrastructure threat pathway for three northern Canadian transport corridors using mapped ground ice and predicted ground-surface temperature. IPCC SROCC independently corroborates thaw-induced subsidence, structural instability, functional impacts and adaptation boundaries.',
    source_endpoint_terms: Object.freeze(['permafrost', 'thaw']),
    target_endpoint_terms: Object.freeze(['polar', 'infrastructure', 'failure']),
    source_title_hits: Object.freeze(['permafrost', 'thaw']),
    target_title_hits: Object.freeze(['infrastructure']),
    reviewed_at: '2026-07-19',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://www.nature.com/articles/s43247-024-01317-7', locator: 'Abstract; Study cases; Results Figures 3-6; Discussion; Methods: thaw index and transport-corridor threat under present, RCP4.5 and RCP8.5 conditions.' }),
      Object.freeze({ url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/', locator: 'Sections 3.4.1.2.2 and 3.4.3.3.4 and key findings: ground-ice loss, subsidence, infrastructure stability, exposure and adaptation.' })
    ]),
    evidence_boundary: 'Promoted as a conditional asset-failure-risk pathway on ice-bearing permafrost. The regional thaw index is not a universal failure probability, and asset design, drainage, maintenance, co-hazards and adaptation remain explicit.'
  }),
  Object.freeze({
    adjudication_id: 'environ_anomalies->overstory_tree_mortality::10.1016/j.scitotenv.2021.151604',
    edge_key: 'environ_anomalies->overstory_tree_mortality',
    query: 'compound climate hazards overstory tree mortality',
    title: 'Compound climate events increase tree drought mortality across European forests',
    doi: '10.1016/j.scitotenv.2021.151604',
    url: 'https://doi.org/10.1016/j.scitotenv.2021.151604',
    published: '2022-04-10',
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The European study uses two independent tree-mortality datasets and tests simultaneous hot summers, elevated VPD and dry years. An independent open northern Australian study corroborates compound antecedent and coincident hazards for widespread dieback events.',
    source_endpoint_terms: Object.freeze(['compound', 'climate', 'hazards']),
    target_endpoint_terms: Object.freeze(['overstory', 'tree', 'mortality']),
    source_title_hits: Object.freeze(['compound', 'climate', 'events']),
    target_title_hits: Object.freeze(['tree', 'mortality']),
    reviewed_at: '2026-07-19',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://doi.org/10.1016/j.scitotenv.2021.151604', locator: 'Abstract, highlights, methods and results: European mortality-event database and ICP-Forest plots, compound hot-dry/VPD definitions and event coincidence results.' }),
      Object.freeze({ url: 'https://www.nature.com/articles/s41598-021-97762-x', locator: 'Abstract; event reconstructions; palaeoclimate analysis; Discussion: compound conditions associated with northern Australian mangrove and inland forest dieback.' })
    ]),
    evidence_boundary: 'Promoted as a bounded observational compound-hazard relationship. Reported event coincidence proportions are not causal effect sizes and are not transferred across species, regions or forest types.'
  }),
  Object.freeze({
    adjudication_id: 'wet_bulb_heat->public_health_heat_burden::10.1126/sciadv.adq3367',
    edge_key: 'wet_bulb_heat->public_health_heat_burden',
    query: 'thermodynamic wet bulb temperature mortality public health',
    title: 'Heat disproportionately kills young people: Evidence from wet-bulb temperature in Mexico',
    doi: '10.1126/sciadv.adq3367',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11623271/',
    published: '2024-12-06',
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The open primary study combines station-derived thermodynamic wet-bulb temperature with 13.4 million deaths across more than 21 million Mexican municipality-days and estimates nonlinear age-specific mortality responses with distributed lags and location and time controls. WHO independently corroborates the humidity-constrained heat-balance mechanism.',
    source_endpoint_terms: Object.freeze(['wet', 'bulb', 'heat']),
    target_endpoint_terms: Object.freeze(['public', 'health', 'heat', 'burden']),
    source_title_hits: Object.freeze(['wet-bulb', 'temperature']),
    target_title_hits: Object.freeze(['mortality']),
    reviewed_at: '2026-07-19',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({ url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11623271/', locator: 'Abstract; Methods; Figure 1; supplementary Table S1: daily mean wet-bulb temperature, national vital statistics, 1998-2019 municipality-day panel, age-specific exposure-response functions, lags, controls and confidence bands.' }),
      Object.freeze({ url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', locator: 'Heat-balance mechanism, acute health impacts, vulnerable groups, cooling and adaptation boundaries.' })
    ]),
    evidence_boundary: 'Promoted for thermodynamic wet-bulb temperature, not WBGT. Mexico-specific nonlinear age-stratified response curves are not exported as a universal per-degree coefficient or survivability threshold.'
  }),
  Object.freeze({
    adjudication_id: 'temp->overstory_tree_mortality::10.1111/gcb.15927',
    edge_key: 'temp->overstory_tree_mortality',
    query: 'warming overstory tree mortality bark beetle drought',
    title: 'Warming increased bark beetle-induced tree mortality by 30% during an extreme drought in California',
    doi: '10.1111/gcb.15927',
    url: 'https://research.fs.usda.gov/treesearch/63775',
    published: '2022',
    decision: 'full_text_confirmed_bounded_and_promoted',
    rationale: 'The peer-reviewed primary study evaluates the exact warming-to-tree-mortality pathway through western-pine-beetle development and overwinter survival during severe drought. Its process model reproduces observed beetle flight timing and ponderosa-pine mortality and reports a bounded effect with a 95 percent interval. The Fifth National Climate Assessment independently corroborates the mechanism and preserves cross-species limits.',
    source_endpoint_terms: Object.freeze(['global', 'temperature', 'warming']),
    target_endpoint_terms: Object.freeze(['overstory', 'tree', 'mortality']),
    source_title_hits: Object.freeze(['warming']),
    target_title_hits: Object.freeze(['tree', 'mortality']),
    reviewed_at: '2026-07-25',
    reviewer: 'northstar_full_text_readback_v1',
    source_locators: Object.freeze([
      Object.freeze({
        url: 'https://research.fs.usda.gov/treesearch/63775',
        locator: 'Abstract and full text: Sierra Nevada ponderosa pine, California 2012-2015 drought with lagged response through 2016, coupled beetle-host process model evaluated against flight timing and mortality, 29.9 percent mortality increase and 95 percent CI 29.4-30.2 percent.'
      }),
      Object.freeze({
        url: 'https://toolkit.climate.gov/NCA5',
        locator: 'Fifth National Climate Assessment Chapter 7, Box 7.1: warming effects on beetle life cycles and overwinter survival, drought-compromised host defense and about 30 percent California tree-mortality attribution.'
      }),
      Object.freeze({
        url: 'https://eros.usgs.gov/earthshots/the-beetles-attack',
        locator: 'USGS mechanism and Landsat context: warm dry summers, mild winters, host defense, successive favorable years and observed forest-cover damage.'
      })
    ]),
    evidence_boundary: 'Promoted as an indirect, mediator-specific relationship for western pine beetle and ponderosa pine during one extreme California drought. The 29.9 percent estimate is not a universal warming coefficient, per-degree response or direct temperature-only effect, and the study suggestion of a possible 35-40 percent per-degree additive response is not used.'
  })
]);
