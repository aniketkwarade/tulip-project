const CBD_PATHWAYS = 'https://www.cbd.int/invasive/toolkit/doc/pathways-training-en.pdf';
const CBD_GUIDING_PRINCIPLES = 'https://www.cbd.int/recommendation/sbstta?id=7035';
const USGS_CLIMATE = 'https://www.usgs.gov/faqs/how-does-climate-change-affect-challenge-invasive-species';
const USGS_INVASIVE_SPECIES = 'https://www.usgs.gov/science/science-explorer/biology/invasive-species';
const IPBES_ASSESSMENT = 'https://ict.ipbes.net/ipbes-ict-guide/data-and-knowledge-management/citations-of-ipbes-assessments/invasive-alien-species-assessment';

export const INVASIVE_SPECIES_NODE_ID = 'invasive_species_encroachment';
export const INVASIVE_SPECIES_NODE_SOURCES = Object.freeze([
  CBD_PATHWAYS,
  USGS_CLIMATE,
  IPBES_ASSESSMENT
]);

const indicator = Object.freeze({
  metric_id: 'gbif_non_native_occurrence_expansion',
  metric_name: 'Non-native occurrence range expansion',
  unit: 'new occupied grid cells per period',
  geography: 'named taxon and bounded region with an approved native-range baseline',
  cadence: 'monthly observation refresh with annual ecological review',
  observation_time_field: 'eventDate',
  source_id: 'gbif_occurrence_api',
  transformation: 'Join an approved non-native taxon list to quality-controlled occurrences; retain sampling effort, taxonomic revisions, establishment status, and the fixed native-range baseline.',
  uncertainty: 'Occurrence expansion can reflect surveillance effort or reporting change rather than establishment or ecological impact.',
  threshold_provenance: 'Taxon- and region-specific baseline; no global invasion threshold is inferred from raw occurrences.',
  failure_behavior: 'Freeze the prior reviewed value when taxon status, geographic baseline, or observation coverage fails.'
});

const locator = (url, text, source_type = 'authoritative_assessment') => Object.freeze({ url, locator: text, source_type });

function relationship({ source, target, verb, adverb, influence, type, level = 'direct', mechanism, geography, time, moderators, alternatives, counterevidence, locators }) {
  const sourceUrls = [...new Set(locators.map(item => item.url))];
  return Object.freeze({
    source,
    target,
    verb,
    adverb,
    influence,
    topology_rule: 'invasive_species_rehabilitation',
    evidence: {
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: level,
      relationship_type: type,
      confidence: level === 'direct' ? 'high' : 'moderate',
      source_urls: sourceUrls,
      relationship_source_urls: sourceUrls,
      mechanism,
      geographic_scope: geography,
      temporal_scope: time,
      notes: counterevidence,
      dossier: {
        version: 'invasive_species_rehabilitation_v1',
        promotion_status: 'promoted',
        reviewed_at: '2026-07-17',
        source,
        target,
        mechanism,
        geographic_scope: geography,
        temporal_scope: time,
        moderators,
        alternative_explanations: alternatives,
        confidence: level === 'direct' ? 'high' : 'moderate',
        counterevidence,
        indicator,
        source_locators: locators,
        evidence_basis: level
      }
    }
  });
}

export const INVASIVE_SPECIES_RELATIONSHIPS = Object.freeze([
  relationship({
    source: 'shipping',
    target: INVASIVE_SPECIES_NODE_ID,
    verb: 'can introduce',
    adverb: 'through ballast water, hull fouling, cargo, and ship-borne stowaways',
    influence: 0.58,
    type: 'transport_pathway',
    mechanism: 'Marine transport can carry organisms beyond their native range in ballast water, on hulls, and with cargo; introduction becomes invasion only when the organism establishes, spreads, and causes harm.',
    geography: 'Named shipping route, port network, recipient ecosystem, taxon, and native-range boundary.',
    time: 'Individual voyages through multi-year establishment and spread.',
    moderators: ['ballast treatment', 'biofouling management', 'propagule pressure', 'recipient habitat suitability', 'port surveillance'],
    alternatives: ['intentional release', 'aquaculture escape', 'natural range movement', 'land-transport introduction'],
    counterevidence: 'A transport record or non-native detection alone does not establish an invasive population or ecological impact.',
    locators: [
      locator(CBD_PATHWAYS, 'CBD pathway guidance identifies ships, ballast water, hull fouling, cargo, and shipping as introduction vectors.'),
      locator(CBD_GUIDING_PRINCIPLES, 'CBD guiding principles identify shipping and ballast discharge as common unintentional introduction pathways.', 'independent_authoritative')
    ]
  }),
  relationship({
    source: 'aviation',
    target: INVASIVE_SPECIES_NODE_ID,
    verb: 'can introduce',
    adverb: 'through air cargo, aircraft surfaces, baggage, and passenger-associated material',
    influence: 0.42,
    type: 'transport_pathway',
    mechanism: 'Air transport can move organisms or propagules across biogeographic barriers in cargo, aircraft, baggage, or associated material, creating a pathway for introduction into a receptive ecosystem.',
    geography: 'Named origin-destination air route, airport entry point, recipient ecosystem, and taxon.',
    time: 'Individual flights through multi-year establishment and spread.',
    moderators: ['inspection and quarantine', 'cargo type', 'propagule viability', 'arrival climate', 'early detection'],
    alternatives: ['sea freight', 'postal trade', 'intentional import', 'natural dispersal'],
    counterevidence: 'Air traffic volume is not an invasion count; most transported organisms do not establish or become harmful.',
    locators: [
      locator(CBD_PATHWAYS, 'CBD defines aircraft as vectors and air transportation as an unintentional introduction pathway.'),
      locator('https://www.cbd.int/invasive/IALGmembers', 'CBD reports that ICAO recognizes civil aviation as a pathway for introductions outside natural ranges.', 'independent_authoritative')
    ]
  }),
  relationship({
    source: 'temp',
    target: INVASIVE_SPECIES_NODE_ID,
    verb: 'can expand suitable range for',
    adverb: 'when warmer conditions remove prior climatic constraints',
    influence: 0.46,
    type: 'climate_conditioning_pathway',
    level: 'indirect',
    mechanism: 'Warming can make formerly unsuitable habitat climatically accessible, alter seasonal survival, and change the effectiveness of controls, allowing some established non-native populations to expand.',
    geography: 'Named taxon and recipient region where temperature is a demonstrated range constraint.',
    time: 'Seasonal survival changes through multi-decadal range shifts.',
    moderators: ['taxon thermal tolerance', 'precipitation', 'disturbance', 'biotic resistance', 'management response'],
    alternatives: ['increased surveillance', 'land-use disturbance', 'new introduction events', 'taxonomic reclassification'],
    counterevidence: 'Warming can reduce suitability for some invaders; the direction and magnitude are taxon- and region-specific.',
    locators: [
      locator(USGS_CLIMATE, 'USGS explains that warmer temperatures can allow established invasive species to expand into habitat that was previously too cool.'),
      locator('https://www.usgs.gov/publications/shifting-hotspots-climate-change-projected-drive-contractions-and-expansions-invasive', 'USGS reports both projected expansion and contraction of invasive-plant suitability under warming.', 'primary_research')
    ]
  }),
  relationship({
    source: INVASIVE_SPECIES_NODE_ID,
    target: 'biodiversity_intactness_loss',
    verb: 'can reduce',
    adverb: 'through competition, predation, disease, habitat alteration, and food-web change',
    influence: 0.62,
    type: 'bounded_ecological_effect',
    mechanism: 'Established harmful non-native species can displace native species, alter habitat and ecological interactions, and contribute to population decline or extinction risk.',
    geography: 'Named invasive taxon, affected native taxa, ecosystem, and assessment boundary.',
    time: 'Years to decades after establishment, with some rapid outbreak effects.',
    moderators: ['invader abundance', 'native community vulnerability', 'disturbance history', 'management', 'isolation'],
    alternatives: ['land conversion', 'pollution', 'overexploitation', 'climate-driven native range shift'],
    counterevidence: 'Non-native status alone does not imply harm, and biodiversity response must be attributed at a specified taxon and ecosystem boundary.',
    locators: [
      locator(IPBES_ASSESSMENT, 'IPBES provides the global assessment framework for invasive alien species trends and impacts.'),
      locator(USGS_INVASIVE_SPECIES, 'USGS identifies invasive species as a major cause of biodiversity loss and documents effects on native species and ecosystems.', 'independent_authoritative')
    ]
  })
]);

export function hasCompleteInvasiveSpeciesDossier(item) {
  const dossier = item?.evidence?.dossier;
  return Boolean(
    dossier?.promotion_status === 'promoted'
    && dossier?.mechanism
    && dossier?.geographic_scope
    && dossier?.temporal_scope
    && dossier?.moderators?.length
    && dossier?.alternative_explanations?.length
    && dossier?.counterevidence
    && dossier?.indicator?.metric_id
    && dossier?.source_locators?.length >= 2
    && dossier?.evidence_basis
  );
}
