const SOURCES = Object.freeze({
  forest: ['https://www.ipcc.ch/report/ar6/wg1/downloads/factsheets/IPCC_AR6_WGI_Sectoral_Fact_Sheet_Forestry.pdf', 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/'],
  hypoxia: ['https://www.epa.gov/ms-htf/hypoxia-101', 'https://www.epa.gov/nutrientpollution/effects-dead-zones-and-harmful-algal-blooms'],
  saltwater: ['https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion', 'https://www.usgs.gov/publications/beyond-wedge-impact-tidal-streams-salinization-groundwater-a-coastal-aquifer-stressed'],
  waterborne: ['https://www.who.int/news-room/questions-and-answers/item/how-do-i-protect-my-health-in-a-flood', 'https://www.who.int/en/news-room/fact-sheets/detail/climate-change-and-health'],
  rain_on_snow: ['https://www.usgs.gov/programs/climate-adaptation-science-centers/science/future-aquatic-flows-exploring-changes-rain', 'https://repository.library.noaa.gov/view/noaa/14544'],
  soil: ['https://www.fao.org/interactive/soil-biodiversity/en/', 'https://www.fao.org/land-water/water/drought/en'],
  textiles: ['https://www.unep.org/news-and-stories/story/environmental-costs-fast-fashion', 'https://www.unep.org/topics/chemicals-and-pollution-action/circularity-sectors/sustainable-and-circular-textiles'],
  shipping: ['https://www.imo.org/en/ourwork/environment/pages/imo-strategy-on-reduction-of-ghg-emissions-from-ships.aspx', 'https://unctad.org/system/files/official-document/rmt2024_en.pdf'],
  materials: ['https://www.iea.org/reports/demand-and-supply-measures-for-the-steel-and-cement-transition/executive-summary', 'https://www.iea.org/reports/cement'],
  minerals: ['https://www.iea.org/reports/sustainable-and-responsible-critical-mineral-supply-chains', 'https://www.iea.org/reports/the-role-of-critical-minerals-in-clean-energy-transitions/sustainable-and-responsible-development-of-minerals'],
  humanitarian: ['https://www.wfp.org/news/wfp-requires-us169-billion-2025-respond-unrelenting-humanitarian-needs', 'https://www.wfp.org/publications/food-security-impact-reduction-wfp-funding']
});

const relationship = ({ source, target, category, mechanism, verb = 'contributes to', level = 'indirect', influence = 0.46, scope = 'Global assessment; magnitude and timing require a named regional observation.' }) => {
  const urls = SOURCES[category];
  const dossier = {
    promotion_status: 'promoted', source, target, mechanism,
    geographic_scope: scope,
    temporal_scope: 'Observed or assessed over the reporting interval stated by the cited source.',
    moderators: ['local baseline conditions', 'management and adaptation', 'exposure duration', 'measurement uncertainty'],
    alternative_explanations: ['other sectoral pressures', 'natural variability', 'local infrastructure and governance', 'unmeasured confounding stressors'],
    confidence: level === 'direct' ? 'high' : 'medium',
    counterevidence: 'The pathway does not establish a universal local magnitude, timing, or single-cause attribution.',
    indicator: {
      metric_id: `backlog_pathway_${source}_${target}`,
      metric_name: 'Bounded pathway evidence',
      unit: 'source-defined observation with named geography and interval',
      geography: 'named geography or assessed global domain',
      cadence: 'reviewed when either source is updated',
      source_id: category,
      transformation: 'Retain source scope and do not convert assessment language into local attribution.',
      uncertainty: 'Source confidence and local moderators apply.',
      threshold_provenance: 'No universal threshold; use the cited source definition.',
      failure_behavior: 'Keep the edge indirect or research-track if its bounded conditions are unavailable.'
    },
    source_locators: urls.map((url, index) => ({
      url,
      locator: index === 0 ? 'Primary authoritative statement of the bounded mechanism.' : 'Independent authoritative corroboration and scope limitation.',
      source_type: index === 0 ? 'authoritative_mechanism' : 'independent_authoritative'
    })),
    evidence_basis: level
  };
  return {
    source, target, verb,
    adverb: level === 'direct' ? 'through the documented direct mechanism' : 'under the documented conditions and moderators',
    influence,
    topology_rule: 'cross_system_backlog_rehabilitation',
    evidence: {
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: level,
      relationship_type: 'bounded_cross_system_pathway',
      confidence: dossier.confidence,
      source_urls: urls,
      relationship_source_urls: urls,
      mechanism,
      geographic_scope: dossier.geographic_scope,
      temporal_scope: dossier.temporal_scope,
      notes: 'Cross-system backlog rehabilitation; no local attribution is implied.',
      dossier
    }
  };
};

export const CROSS_SYSTEM_BACKLOG_RELATIONSHIPS = Object.freeze([
  relationship({ source: 'sea_level_rise', target: 'coastal_saltwater_intrusion', category: 'saltwater', mechanism: 'Higher coastal water levels can increase saline pressure on freshwater aquifers; pumping, recharge, geology, canals, and surface-water pathways control the local response.' }),
  relationship({ source: 'nutrient_pollution', target: 'anoxic_dead_zones', category: 'hypoxia', level: 'direct', verb: 'can create', mechanism: 'Excess nitrogen and phosphorus can stimulate algal growth whose decomposition consumes dissolved oxygen and can create persistent low-oxygen zones in susceptible receiving waters.' }),
  relationship({ source: 'temp', target: 'anoxic_dead_zones', category: 'hypoxia', mechanism: 'Warmer water holds less oxygen and can strengthen stratification, increasing hypoxia risk where nutrient loading and weak mixing are already present.' }),
  relationship({ source: 'temp', target: 'forest_dieback_areas', category: 'forest', mechanism: 'Warming raises heat, aridity, and drought stress and increases the probability of crossing uncertain regional dieback thresholds.' }),
  relationship({ source: 'drought_persistence', target: 'forest_dieback_areas', category: 'forest', mechanism: 'Sustained moisture deficits can impair hydraulic function and tree survival, especially where heat, pests, fire injury, or stand condition add stress.' }),
  relationship({ source: 'wastewater_infrastructure_overflow', target: 'waterborne_pathogen_outbreaks', category: 'waterborne', mechanism: 'Loss of safe water and sanitation controls can expose people to pathogen-contaminated water and raise outbreak risk after flooding or system failure.' }),
  relationship({ source: 'flash_flood_regime', target: 'waterborne_pathogen_outbreaks', category: 'waterborne', mechanism: 'Floodwater can contaminate drinking-water facilities and increase exposure to water-borne pathogens where treatment and hygiene controls fail.' }),
  relationship({ source: 'extreme_precipitation_intensity', target: 'rain_on_snow_flood_risk', category: 'rain_on_snow', mechanism: 'Heavy warm rainfall onto an existing snowpack can combine rainfall runoff with rapid snowmelt, producing enhanced flood risk in snow-covered basins.' }),
  relationship({ source: 'drought_persistence', target: 'soil_microbial_depletion', category: 'soil', mechanism: 'Prolonged drying can degrade vegetation cover, soil condition, and fertility, placing soil biological communities and their functions under stress.' }),
  relationship({ source: 'fast_fashion', target: 'nutrient_pollution', category: 'textiles', mechanism: 'High-volume textile production and short product lifetimes increase wastewater, dye, chemical, and waste burdens; the receiving-water effect depends on treatment and disposal controls.' }),
  relationship({ source: 'shipping', target: 'carbon_emission', category: 'shipping', level: 'direct', verb: 'releases', mechanism: 'Combustion of marine fuels releases carbon dioxide within the vessel activity and fuel-accounting boundary.' }),
  relationship({ source: 'cement_concrete', target: 'carbon_emission', category: 'materials', level: 'direct', verb: 'releases', mechanism: 'Conventional cement production releases carbon dioxide from calcination and fuel use within the production boundary.' }),
  relationship({ source: 'urbanization', target: 'cement_concrete', category: 'materials', mechanism: 'Growth in buildings and infrastructure can increase demand for conventional cement and concrete, moderated by material efficiency, reuse, and construction standards.' }),
  relationship({ source: 'steel', target: 'carbon_emission', category: 'materials', level: 'direct', verb: 'releases', mechanism: 'Conventional iron and steel production releases carbon dioxide from fuel, reductant, and process energy use within the production boundary.' }),
  relationship({ source: 'mining_critical_minerals', target: 'resource_depletion', category: 'minerals', mechanism: 'Expanded extraction and declining ore quality can increase material throughput, energy use, waste, water pressure, and depletion of accessible high-grade resources.' }),
  relationship({ source: 'food_insecurity', target: 'humanitarian_resource_gaps', category: 'humanitarian', mechanism: 'Rising acute hunger increases demand for food assistance while access constraints and funding shortfalls can leave humanitarian needs unmet.' })
]);
