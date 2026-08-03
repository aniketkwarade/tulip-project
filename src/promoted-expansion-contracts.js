const SOURCES = Object.freeze({
  food: [
    'https://www.fao.org/sustainable-development-goals-data-portal/data/indicators/212-prevalence-of-moderate-or-severe-food-insecurity-in-the-population-based-on-the-food-insecurity-experience-scale/en',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/'
  ],
  nutrients: [
    'https://www.epa.gov/nutrientpollution/sources-and-solutions',
    'https://www.epa.gov/nutrientpollution/effects-dead-zones-and-harmful-algal-blooms'
  ],
  seagrass: [
    'https://www.unep.org/topics/ocean-seas-and-coasts/blue-ecosystems/seagrass-meadows',
    'https://www.ipcc.ch/srocc/chapter/chapter-5/'
  ],
  heat: [
    'https://www.epa.gov/heatislands/what-are-heat-islands',
    'https://climate.discomap.eea.europa.eu/arcgis/rest/services/UAMV/Urban_Heat_Island_Intensity/MapServer'
  ]
});

const node = (id, name, sphere, description, vector, sourceUrls) => Object.freeze({
  id, name, sphere, description, vector,
  authored_node_class: 'phenomenon',
  baseValue: 40,
  value: 40,
  adjectives: [
    { min: 0, max: 25, label: 'Limited' },
    { min: 25, max: 50, label: 'Emerging' },
    { min: 50, max: 75, label: 'Severe' },
    { min: 75, max: 100, label: 'Systemic' }
  ],
  calibration: { role: 'anchor', source_urls: sourceUrls, notes: 'Approved one-by-one from the missing-phenomenon research docket.' }
});

export const PROMOTED_EXPANSION_NODES = Object.freeze([
  node('food_insecurity', 'Food Insecurity', 'health', 'Uncertain or constrained physical and economic access to sufficient, safe, nutritious food.', { climate_forcing: .24, ecological_damage: .31, human_drivenness: .72, societal_fallout: .94 }, SOURCES.food),
  node('nutrient_pollution', 'Nutrient Pollution', 'freshwater', 'Excess nitrogen and phosphorus loading that degrades fresh and coastal waters.', { climate_forcing: .35, ecological_damage: .88, human_drivenness: .92, societal_fallout: .68 }, SOURCES.nutrients),
  node('seagrass_meadow_decline', 'Seagrass Meadow Decline', 'oceans', 'Persistent loss or degradation of mapped seagrass habitat and its ecological functions.', { climate_forcing: .36, ecological_damage: .9, human_drivenness: .71, societal_fallout: .65 }, SOURCES.seagrass),
  node('urban_heat_island', 'Urban Heat Island', 'atmosphere', 'Urban areas remaining warmer than a bounded non-urban reference because of land cover, morphology, and anthropogenic heat.', { climate_forcing: .38, ecological_damage: .42, human_drivenness: .89, societal_fallout: .87 }, SOURCES.heat)
]);

export const PROMOTED_EXPANSION_NODE_IDS = Object.freeze(PROMOTED_EXPANSION_NODES.map(item => item.id));
export const PROMOTION_APPROVALS = Object.freeze([
  { id: 'food_insecurity', sequence: 1, status: 'approved_and_promoted', approved_at: '2026-07-17', boundary: 'Food insecurity only; undernutrition remains separate.' },
  { id: 'nutrient_pollution', sequence: 2, status: 'approved_and_promoted', approved_at: '2026-07-17', boundary: 'Nutrient state only; not an umbrella biogeochemical-flow score.' },
  { id: 'seagrass_meadow_decline', sequence: 3, status: 'approved_and_promoted', approved_at: '2026-07-17', boundary: 'Mapped habitat decline; occurrences are supporting evidence only.' },
  { id: 'urban_heat_island', sequence: 4, status: 'approved_and_promoted', approved_at: '2026-07-17', boundary: 'Phenomenon node; intensity is its metric.' }
]);

function dossierEdge(source, target, sources, mechanism, role = 'driver') {
  const relationshipLevel = role === 'effect' ? 'indirect' : 'direct';
  return {
    source, target,
    verb: role === 'effect' ? 'can propagate into' : 'contributes to',
    adverb: 'under bounded conditions',
    influence: role === 'effect' ? .3 : .42,
    topology_rule: 'approved_phenomenon_promotion',
    evidence: {
      source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference',
      relationship_level: relationshipLevel, relationship_type: role === 'effect' ? 'bounded_downstream_effect' : 'bounded_driver_pathway',
      confidence: 'moderate', mechanism,
      geographic_scope: 'Global mechanism with material regional variation; apply only at the geography supported by the metric.',
      temporal_scope: 'Seasonal to multi-decadal, depending on exposure and system response.',
      source_urls: sources, relationship_source_urls: sources,
      dossier: {
        promotion_status: 'promoted', mechanism,
        geographic_scope: 'Global mechanism with regional expression and explicit metric bounds.',
        temporal_scope: 'Seasonal to multi-decadal.',
        moderators: ['baseline vulnerability', 'management and policy', 'local environmental conditions'],
        alternative_explanations: ['measurement coverage change', 'co-occurring pressures'],
        counterevidence: 'Magnitude and attribution can weaken or reverse across places and periods; the edge is not deterministic.',
        indicator: { metric_id: `${target}_edge_evidence`, role },
        source_locators: sources.map((url, index) => ({ url, locator: index === 0 ? 'mechanism and definition page' : 'assessment chapter or dataset documentation', source_type: index === 0 ? 'authoritative' : 'independent_assessment' })),
        evidence_basis: relationshipLevel === 'direct' ? 'direct' : 'indirect'
      }
    }
  };
}

export const PROMOTED_EXPANSION_RELATIONSHIPS = Object.freeze([
  dossierEdge('crop_yield_volatility', 'food_insecurity', SOURCES.food, 'Yield instability can reduce local food availability and increase price and access stress.'),
  dossierEdge('food_import_exposure', 'food_insecurity', SOURCES.food, 'Import dependence transmits external supply and price shocks into household food access.'),
  dossierEdge('staple_food_price_volatility', 'food_insecurity', SOURCES.food, 'Staple price spikes reduce purchasing power for food-insecure households.'),
  dossierEdge('food_insecurity', 'migration', SOURCES.food, 'Sustained food-access loss can contribute to livelihood displacement alongside conflict and economic factors.', 'effect'),
  dossierEdge('fertilizer_production', 'nutrient_pollution', SOURCES.nutrients, 'Fertilizer production and use increase the pool of reactive nutrients available for loss.'),
  dossierEdge('nitrogen_fertilizer_runoff', 'nutrient_pollution', SOURCES.nutrients, 'Runoff transports excess applied nitrogen into surface waters.'),
  dossierEdge('wastewater_bypass_discharge', 'nutrient_pollution', SOURCES.nutrients, 'Untreated or bypassed wastewater delivers nitrogen and phosphorus to receiving waters.'),
  dossierEdge('nutrient_pollution', 'harmful_algal_blooms', SOURCES.nutrients, 'Excess nutrients can stimulate harmful algal growth under favorable light, flow, and temperature.', 'effect'),
  dossierEdge('marine_heatwaves', 'seagrass_meadow_decline', SOURCES.seagrass, 'Acute thermal stress can damage seagrass physiology and increase mortality.'),
  dossierEdge('estuary_eutrophication', 'seagrass_meadow_decline', SOURCES.seagrass, 'Eutrophication reduces light through algal and epiphyte growth, limiting seagrass survival.'),
  dossierEdge('coastal_erosion', 'seagrass_meadow_decline', SOURCES.seagrass, 'Erosion and sediment instability can remove or bury meadow habitat.'),
  dossierEdge('seagrass_meadow_decline', 'blue_carbon_habitat_loss', SOURCES.seagrass, 'Meadow loss removes living biomass and can expose stored sediment carbon.', 'effect'),
  dossierEdge('urban_tree_canopy_loss', 'urban_heat_island', SOURCES.heat, 'Canopy loss reduces shade and evapotranspirative cooling.'),
  dossierEdge('urban_sprawl_housing', 'urban_heat_island', SOURCES.heat, 'Low-density expansion can replace vegetated cover with heat-storing built surfaces.'),
  dossierEdge('asphalt_pavement_heat_absorbers', 'urban_heat_island', SOURCES.heat, 'Dark impervious materials absorb and later release solar heat.'),
  dossierEdge('urban_heat_island', 'public_health_heat_burden', SOURCES.heat, 'Added urban nighttime and daytime heat increases population heat exposure.', 'effect')
]);

export function hasCompleteExpansionDossier(edge) {
  const dossier = edge.evidence?.dossier;
  return Boolean(dossier?.promotion_status === 'promoted' && dossier.mechanism && dossier.geographic_scope && dossier.temporal_scope && dossier.moderators?.length && dossier.alternative_explanations?.length && dossier.counterevidence && dossier.indicator?.metric_id && dossier.source_locators?.length >= 2);
}
