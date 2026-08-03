const SOURCES = Object.freeze({
  protests: Object.freeze(['https://acleddata.com/methodology/acled-codebook', 'https://acleddata.com/knowledge-base/how-are-acled-data-coded/']),
  geneFlow: Object.freeze(['https://www.aphis.usda.gov/biotechnology/regulations/340_proposedrule_draftEIS_2019', 'https://www.aphis.usda.gov/biotechnology']),
  fungi: Object.freeze(['https://research.fs.usda.gov/treesearch/47341', 'https://research.fs.usda.gov/download/treesearch/6032.pdf'])
  ,seaweed: Object.freeze(['https://www.fisheries.noaa.gov/west-coast/habitat-conservation/caulerpa-species-west-coast', 'https://www.eddmaps.org/'])
});

const metric = (metric_id, metric_name, unit, geography, source_id, transformation, failure_behavior) => Object.freeze({
  metric_id,
  metric_name,
  unit,
  geography,
  cadence: 'event, seasonal, or annual update with a fixed review boundary',
  observation_time_field: 'observation_or_event_period',
  source_id,
  transformation,
  uncertainty: 'Coverage, detection, reporting, method, boundary, attribution, and natural variability affect comparison and interpretation.',
  threshold_provenance: 'Use the named authoritative method and a declared geographic, temporal, biological, or event boundary; no universal threshold is implied.',
  failure_behavior
});

export const REMAINING_BACKLOG_FOUR_METRIC_CONTRACTS = Object.freeze({
  fossil_fuel_pipeline_protests: metric(
    'pipeline_related_protest_event_record',
    'Pipeline-related protest event record',
    'event count, participants where reported, actors, event type, fatalities, and geographic coordinates reported separately',
    'named event site, administrative area, country, reporting period, and source set',
    'acled_codebook',
    'Retain event date, location, actors, event type, issue coding, source count, source quality, participant estimate, fatalities, notes, coverage period, and coding uncertainty.',
    'Do not infer a causal environmental condition, public consensus, project impact, or protest trend from an isolated event, media volume, or a pipeline mention alone.'
  ),
  genetically_modified_pollen_drift: metric(
    'engineered_trait_gene_flow_observation',
    'Engineered-trait gene-flow observation',
    'pollen concentration, outcrossing frequency, hybrid occurrence, or trait detection by taxon, distance, and sampling method',
    'named crop, engineered event, receptor population, field layout, sampling transect, flowering window, and season',
    'usda_aphis_biotechnology_gene_flow',
    'Retain donor and receptor taxa, engineered event, compatibility, flowering overlap, distance, wind and pollinator context, seed movement, volunteer plants, assay, detection limit, and uncertainty.',
    'Do not infer ecological harm, persistent introgression, or pollinator decline from pollen movement or a single trait detection without compatible reproduction, persistence, exposure, and effect evidence.'
  ),
  macrofungal_mycelium_decay: metric(
    'soil_fungal_biomass_and_decomposition_function',
    'Soil-fungal biomass and decomposition function',
    'fungal biomass, hyphal length, community composition, litter-mass loss, respiration, or nutrient-mineralization rate with method stated',
    'named soil plot, forest type, horizon, substrate, treatment, season, and sampling design',
    'us_forest_service_fungal_decomposition_and_nutrient_cycling',
    'Retain fungal guild, taxonomic method, soil depth, substrate, moisture, temperature, disturbance, land-use history, decomposition protocol, nutrient flux, replication, and uncertainty.',
    'Do not call lower fruiting-body counts or one decomposition measurement mycelial decay, and do not attribute a change without comparable soil, substrate, climate, and disturbance observations.'
  ),
  invasive_seaweed_blooms: metric(
    'invasive_marine_macroalgae_extent_and_abundance',
    'Invasive marine-macroalgae extent and abundance',
    'occupied hectares, percent cover, biomass, patch density, or new verified occurrences by named taxon and method',
    'named taxon, coastline, lagoon, estuary, habitat, depth range, survey footprint, and observation period',
    'noaa_caulerpa_species_on_the_west_coast',
    'Retain taxon verification, native status, introduction history, survey effort, occupied area, cover or biomass, fragmentation and vector context, habitat overlap, eradication status, and uncertainty.',
    'Do not call native seasonal seaweed growth an invasion, combine taxa, infer a bloom from one occurrence, or infer impact without comparable native-community and habitat observations.'
  )
});

const decisions = Object.freeze({
  fossil_fuel_pipeline_protests: Object.freeze({
    binding_type: 'research_track_metric_without_canonical_node',
    canonical_node_id: null,
    source_urls: SOURCES.protests,
    decision: 'A protest is a coded sociopolitical event, not an environmental phenomenon or a deterministic effect of emissions. Preserve event-level evidence as a bounded research metric without forcing it into the causal sphere.'
  }),
  genetically_modified_pollen_drift: Object.freeze({
    binding_type: 'research_track_metric_without_canonical_node',
    canonical_node_id: null,
    source_urls: SOURCES.geneFlow,
    decision: 'Pollen-mediated gene flow is crop-, trait-, receptor-, distance-, and season-specific. Preserve the observation contract without implying that movement alone is ecological harm or a cause of pollinator decline.'
  }),
  macrofungal_mycelium_decay: Object.freeze({
    binding_type: 'canonical_node_metric_alias',
    canonical_node_id: 'soil_microbial_depletion',
    source_urls: SOURCES.fungi,
    decision: 'The generated phrase does not distinguish fungal biomass, community composition, fruiting, decomposition, or nutrient cycling. Preserve those bounded measurements on the canonical soil-microbial system.'
  }),
  invasive_seaweed_blooms: Object.freeze({
    binding_type: 'canonical_node_metric_alias',
    canonical_node_id: 'invasive_species_encroachment',
    source_urls: SOURCES.seaweed,
    decision: 'This is a taxon- and habitat-specific observation within the canonical biological-invasion system. Preserve verified occurrence, cover, spread, vector, and community impact without treating every seasonal seaweed increase as an invasive bloom.'
  })
});

export const REMAINING_BACKLOG_FOUR_METRIC_BINDINGS = Object.freeze(Object.fromEntries(
  Object.entries(decisions).map(([id, decision]) => [id, Object.freeze({
    ...decision,
    metric_id: REMAINING_BACKLOG_FOUR_METRIC_CONTRACTS[id].metric_id,
    metric_name: REMAINING_BACKLOG_FOUR_METRIC_CONTRACTS[id].metric_name,
    reviewed_at: '2026-07-18'
  })])
));
