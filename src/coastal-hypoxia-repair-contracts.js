const EPA_HYPOXIA = 'https://www.epa.gov/ms-htf/hypoxia-101';
const NOAA_DEAD_ZONE = 'https://oceanservice.noaa.gov/facts/deadzone.html';
const EPA_NUTRIENTS = 'https://www.epa.gov/nutrientpollution/effects-dead-zones-and-harmful-algal-blooms';
const NOAA_HYPOXIA = 'https://oceanservice.noaa.gov/hazards/hypoxia/';
const source_urls = [EPA_HYPOXIA, NOAA_DEAD_ZONE, EPA_NUTRIENTS, NOAA_HYPOXIA];

export const COASTAL_HYPOXIA_NODE_SOURCES = Object.freeze(source_urls);
export const COASTAL_HYPOXIA_NODE_ID = 'anoxic_dead_zones';

const n = (id, name, description) => ({
  id, name, description, sphere: 'oceans', authored_node_class: 'authored_root_driver',
  baseValue: 52, value: 52,
  vector: { climate_forcing: 0.18, ecological_damage: 0.83, human_drivenness: 0.72, societal_fallout: 0.68 },
  source_urls,
  calibration: { role: 'root_driver', source_urls, notes: 'Bound to a named estuary, coastal shelf, or marine basin and an observed seasonal oxygen interval.' },
  adjectives: [{ min: 0, max: 25, label: 'Low' }, { min: 25, max: 50, label: 'Elevated' }, { min: 50, max: 75, label: 'High' }, { min: 75, max: 100, label: 'Severe' }]
});

export const COASTAL_HYPOXIA_NODES = Object.freeze([
  n('coastal_nutrient_loading', 'Coastal Nutrient Loading', 'Measured nitrogen or phosphorus delivery to a named coastal water body.'),
  n('coastal_algal_biomass_pulse', 'Coastal Algal Biomass Pulse', 'Observed phytoplankton or algal biomass increase in a named coastal water body.'),
  n('coastal_organic_matter_respiration', 'Coastal Organic-Matter Respiration', 'Measured or modeled oxygen demand from decomposing organic matter in a named coastal water body.'),
  n('coastal_water_column_stratification', 'Coastal Water-Column Stratification', 'Observed density layering that restricts oxygen replenishment in a named coastal water body.')
]);
export const COASTAL_HYPOXIA_NODE_IDS = Object.freeze(COASTAL_HYPOXIA_NODES.map(node => node.id));

const metric = (id, name, source_id = 'usgs_water_data_ogc_api') => ({
  metric_id: id, metric_name: name,
  unit: 'site-specific concentration, biomass, oxygen demand, density gradient, or dissolved oxygen value',
  geography: 'named estuary, coastal shelf, or marine basin', cadence: 'event to seasonal', observation_time_field: 'observation_date',
  source_id,
  transformation: 'Keep station, depth, sampling method, tidal state, season, and uncertainty.',
  uncertainty: 'Hypoxia has natural and site-specific drivers; measurements must retain depth and timing.',
  threshold_provenance: 'EPA and NOAA coastal-hypoxia assessments.',
  failure_behavior: 'Do not infer persistent hypoxia from nutrients, an algal bloom, or stratification alone.'
});

export const COASTAL_HYPOXIA_METRIC_CONTRACTS = Object.freeze(Object.fromEntries([
  ...COASTAL_HYPOXIA_NODES.map(node => [node.id, metric(node.id, node.name)]),
  [COASTAL_HYPOXIA_NODE_ID, metric('coastal_dissolved_oxygen', 'Coastal dissolved oxygen', 'unep_global_nutrient_pollution_impact')]
]));

const locator = (url, text) => ({ url, locator: text, source_type: 'authoritative_assessment' });
const edge = (source, mechanism, moderators, alternatives, counterevidence, source_locators) => ({
  source, target: COASTAL_HYPOXIA_NODE_ID, verb: 'can increase',
  adverb: 'in a measured, seasonally stratified coastal water body', influence: 0.55,
  topology_rule: 'coastal_hypoxia_repair',
  evidence: {
    source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference', relationship_level: 'direct',
    relationship_type: 'bounded_coastal_hypoxia_mechanism', confidence: 'high', source_urls, relationship_source_urls: source_urls,
    mechanism, geographic_scope: 'Named estuary, coastal shelf, or marine basin.', temporal_scope: 'Bloom, respiration, mixing, and seasonal dissolved-oxygen interval.',
    dossier: { promotion_status: 'promoted', source, target: COASTAL_HYPOXIA_NODE_ID, mechanism,
      geographic_scope: 'Named estuary, coastal shelf, or marine basin.', temporal_scope: 'Bloom, respiration, mixing, and seasonal dissolved-oxygen interval.',
      moderators, alternative_explanations: alternatives, confidence: 'high', counterevidence,
      indicator: COASTAL_HYPOXIA_METRIC_CONTRACTS[COASTAL_HYPOXIA_NODE_ID], source_locators, evidence_basis: 'direct' }
  }
});

export const COASTAL_HYPOXIA_RELATIONSHIPS = Object.freeze([
  edge('coastal_nutrient_loading', 'Excess nitrogen and phosphorus can stimulate algal production and raise the organic-matter load whose decomposition consumes dissolved oxygen.', ['nutrient form', 'residence time', 'light', 'mixing'], ['low nutrient delivery', 'rapid flushing'], 'Nutrient enrichment does not establish hypoxia without a site-specific oxygen response.', [locator(EPA_HYPOXIA, 'EPA identifies excess nutrients as a major human driver of coastal hypoxia.'), locator(NOAA_DEAD_ZONE, 'NOAA identifies nutrient pollution as the primary cause of human-induced dead zones.')]),
  edge('coastal_algal_biomass_pulse', 'An algal biomass pulse supplies organic matter that can be decomposed after sinking or dying, consuming oxygen.', ['species composition', 'sinking', 'grazing', 'mixing'], ['low biomass persistence', 'rapid grazing'], 'A bloom may dissipate without creating oxygen depletion.', [locator(EPA_NUTRIENTS, 'EPA explains that dead algae decomposition consumes oxygen.'), locator(NOAA_HYPOXIA, 'NOAA describes algal growth and decomposition as an oxygen-depletion pathway.')]),
  edge('coastal_organic_matter_respiration', 'Microbial respiration during organic-matter decomposition directly consumes dissolved oxygen in the affected water layer.', ['organic-carbon load', 'temperature', 'depth', 'mixing'], ['low respiration', 'oxygenated mixing'], 'Respiration must exceed oxygen replenishment to produce hypoxia.', [locator(NOAA_DEAD_ZONE, 'NOAA explains oxygen removal through decomposition of organic material.'), locator(EPA_HYPOXIA, 'EPA describes oxygen consumption from decomposition in hypoxic waters.')]),
  edge('coastal_water_column_stratification', 'Density stratification restricts vertical mixing and can prevent oxygenated surface water from replenishing bottom water.', ['freshwater inflow', 'wind mixing', 'tide', 'basin depth'], ['well-mixed water column', 'strong wind mixing'], 'Stratification alone does not establish oxygen depletion when organic demand is low.', [locator(EPA_HYPOXIA, 'EPA identifies stratification as a condition that limits oxygen replenishment.'), locator(NOAA_HYPOXIA, 'NOAA describes stratification and limited mixing in coastal hypoxia.')])
]);

export function hasCompleteCoastalHypoxiaDossier(item) {
  const dossier = item.evidence?.dossier;
  return Boolean(dossier?.promotion_status === 'promoted' && dossier.moderators?.length && dossier.alternative_explanations?.length && dossier.counterevidence && dossier.indicator?.metric_id && dossier.source_locators?.length >= 2);
}
