const EPA_N2O = 'https://www.epa.gov/ghgemissions/nitrous-oxide-emissions';
const EPA_AG = 'https://www.epa.gov/ghgemissions/agriculture-sector-emissions';
const EPA_INVENTORY = 'https://www.epa.gov/system/files/documents/2024-02/us-ghg-inventory-2024-main-text.pdf';
const IPCC_SOILS = 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch11_Soils_N2O_CO2.pdf';
const NOAA_N2O = 'https://gml.noaa.gov/ccgg/trends_n2o/index.html';

const agriculturalNitrogenApplication = Object.freeze({
  id: 'agricultural_nitrogen_application', name: 'Agricultural Nitrogen Application',
  description: 'Synthetic or organic nitrogen applied to managed soils within a named crop, area, and reporting period.',
  sphere: 'agriculture', authored_node_class: 'authored_root_driver', baseValue: 45, value: 45,
  vector: { climate_forcing: .65, ecological_damage: .62, human_drivenness: .9, societal_fallout: .55 },
  source_urls: [EPA_AG, IPCC_SOILS],
  calibration: { role: 'root_driver', source_urls: [EPA_AG, IPCC_SOILS], notes: 'Bounded activity measure with crop, area, nitrogen form, timing, and reporting period retained.' },
  adjectives: [{ min: 0, max: 25, label: 'Limited' }, { min: 25, max: 50, label: 'Growing' }, { min: 50, max: 75, label: 'High' }, { min: 75, max: 100, label: 'Intensive' }]
});

export const NITROUS_OXIDE_DRIVER_NODE_IDS = Object.freeze([
  'agricultural_nitrogen_application',
  'nitrogen_fertilizer_runoff',
  'industry_farming',
  'fertilizer_production'
]);
export const NITROUS_OXIDE_DRIVER_NODES = Object.freeze([agriculturalNitrogenApplication]);
export const NITROUS_OXIDE_REHABILITATION_NODE_ID = 'nitrous_oxide';
export const NITROUS_OXIDE_NODE_SOURCES = Object.freeze([EPA_N2O, EPA_INVENTORY, NOAA_N2O]);

export const NITROUS_OXIDE_METRIC_CONTRACTS = Object.freeze({
  agricultural_nitrogen_application: {
    metric_id: 'managed_soil_nitrogen_application', metric_name: 'Managed-soil nitrogen application',
    unit: 'kilograms nitrogen per hectare per reporting period', geography: 'named crop area or managed-soil inventory',
    cadence: 'annual crop or inventory cycle', observation_time_field: 'reporting_year', source_id: 'global_nitrous_oxide_budget_1980_2020',
    transformation: 'Retain fertilizer form, organic amendment, crop, area, timing, and whether application is measured or estimated.',
    uncertainty: 'Application timing, organic inputs, crop area, and farm reporting vary.',
    threshold_provenance: 'IPCC managed-soil nitrogen accounting boundary.',
    failure_behavior: 'Do not equate fertilizer sales or production with field application.'
  },
  nitrous_oxide: {
    metric_id: 'anthropogenic_nitrous_oxide_emissions',
    metric_name: 'Anthropogenic nitrous-oxide emissions by source sector',
    unit: 'million tonnes N2O per year',
    geography: 'global, country, source sector, or inventory jurisdiction',
    cadence: 'annual with source-release revisions',
    observation_time_field: 'inventory_year',
    source_id: 'edgar_global_emissions_database',
    transformation: 'Sum disjoint source-resolved EDGAR nitrous-oxide categories under a declared country and year; retain category rows, source substance, unit conversion, inventory release, and atmospheric concentration as separate context.',
    uncertainty: 'Activity data, fertilizer and manure inputs, emission factors, soil and climate heterogeneity, industrial-process allocation, country reporting, category coverage, and inventory revisions affect totals; EDGAR source rows do not provide numeric observation-level intervals.',
    threshold_provenance: 'Use inventory source-category boundaries and IPCC managed-soil emission-factor uncertainty; NOAA atmospheric ppb remains a burden indicator and is not converted directly into source emissions.',
    failure_behavior: 'Do not infer a source contribution from atmospheric concentration, add overlapping categories, convert CO2-equivalent values into N2O mass without the declared GWP, or fill missing inventory rows with zero.'
  }
});

const loc = (url, locator, source_type = 'authoritative_assessment') => ({ url, locator, source_type });

function relationship({ source, target, verb, level = 'direct', effect = false, mechanism, scope, time, moderators, alternatives, counterevidence, locators }) {
  const urls = [...new Set(locators.map(item => item.url))];
  const dossier = {
    version: 'nitrous_oxide_rehabilitation_v2', promotion_status: 'promoted', reviewed_at: '2026-07-17',
    source, target, mechanism, geographic_scope: scope, temporal_scope: time, moderators,
    alternative_explanations: alternatives, confidence: 'high', counterevidence,
    indicator: NITROUS_OXIDE_METRIC_CONTRACTS.nitrous_oxide, source_locators: locators,
    evidence_basis: level
  };
  return {
    source, target, verb, adverb: 'within the documented process boundary', influence: effect ? .47 : .55,
    topology_rule: 'nitrous_oxide_rehabilitation', evidence: {
      source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference',
      relationship_level: level, relationship_type: effect ? 'bounded_atmospheric_effect' : 'bounded_emissions_driver',
      confidence: 'high', source_urls: urls, relationship_source_urls: urls, mechanism,
      geographic_scope: scope, temporal_scope: time,
      notes: 'The relationship is bounded to the stated process and is not a universal sector-attribution claim.', dossier
    }
  };
}

export const NITROUS_OXIDE_REHABILITATION_RELATIONSHIPS = Object.freeze([
  relationship({
    source: 'agricultural_nitrogen_application', target: NITROUS_OXIDE_REHABILITATION_NODE_ID, verb: 'can increase',
    mechanism: 'Added nitrogen can be transformed by soil nitrification and denitrification, releasing a long-lived greenhouse gas when availability exceeds plant and microbial retention.',
    scope: 'Managed agricultural soils with a stated fertilizer, crop, soil, and reporting boundary.', time: 'Days to seasons after application; aggregated in annual inventories.',
    moderators: ['soil moisture', 'temperature', 'soil carbon', 'application timing', 'crop uptake'],
    alternatives: ['nitrogen retained in biomass', 'nitrification inhibitors', 'reduced application'],
    counterevidence: 'Application is not a fixed emission rate; yield varies substantially with soil and management conditions.',
    locators: [loc(EPA_AG, 'EPA agriculture inventory: managed-soil nitrogen inputs and soil processes produce emissions.'), loc(IPCC_SOILS, 'IPCC 2019 Refinement Chapter 11: managed-soil nitrogen inputs and direct emissions.', 'independent_authoritative')]
  }),
  relationship({
    source: 'nitrogen_fertilizer_runoff', target: NITROUS_OXIDE_REHABILITATION_NODE_ID, verb: 'can increase', level: 'indirect',
    mechanism: 'Nitrogen lost through leaching and runoff can undergo nitrification and denitrification in downstream soils and waters, producing indirect emissions.',
    scope: 'Managed agricultural areas with documented nitrogen loss to groundwater or surface drainage; this is not inferred from fertilizer sales.', time: 'Days to seasons after nitrogen loss; aggregated in annual inventories.',
    moderators: ['leached nitrogen load', 'water residence time', 'oxygen conditions', 'temperature', 'microbial activity'],
    alternatives: ['nitrogen retained in biomass', 'denitrification ending as dinitrogen', 'nutrient interception'],
    counterevidence: 'Runoff volume alone is not an emission rate; the nitrogen load and receiving-environment chemistry determine yield.',
    locators: [loc(EPA_AG, 'EPA agriculture inventory: managed-soil nitrogen losses contribute to direct and indirect emissions.'), loc(IPCC_SOILS, 'IPCC 2019 Refinement Chapter 11: indirect emissions from nitrogen leaching and runoff are separately estimated.', 'independent_authoritative')]
  }),
  relationship({
    source: 'industry_farming', target: NITROUS_OXIDE_REHABILITATION_NODE_ID, verb: 'can emit',
    mechanism: 'Manure management, organic amendments, residue burning, and other nitrogen-intensive farm practices create additional microbial and combustion pathways beyond synthetic field application.',
    scope: 'Named livestock and crop-production systems; only documented nitrogen-management and residue-burning activities are included.', time: 'Event to seasonal process, aggregated in annual inventories.',
    moderators: ['manure system', 'animal class', 'residue management', 'soil aeration', 'nitrogen recovery'],
    alternatives: ['anaerobic digestion', 'nitrogen recovery', 'covered storage'],
    counterevidence: 'The sector label alone does not establish emissions; systems with strong nitrogen recovery or low inputs can have much lower yields.',
    locators: [loc(EPA_N2O, 'EPA sources: manure management, organic fertilizer, cropping practices, and agricultural-residue burning.'), loc(EPA_INVENTORY, 'US greenhouse-gas inventory: agricultural soils and manure management are separately quantified sources.', 'independent_authoritative')]
  }),
  relationship({
    source: 'fertilizer_production', target: NITROUS_OXIDE_REHABILITATION_NODE_ID, verb: 'can emit',
    mechanism: 'Nitric-acid manufacture produces the gas as a chemical byproduct; the pathway applies to the nitric-acid portion of the production chain rather than all fertilizer manufacturing.',
    scope: 'Named nitric-acid production units used in fertilizer supply chains, with abatement and production volume retained.', time: 'Continuous production to annual facility inventory.',
    moderators: ['plant technology', 'abatement catalyst', 'production rate', 'maintenance'],
    alternatives: ['abatement equipment', 'process redesign', 'fertilizer production without nitric acid'],
    counterevidence: 'Ammonia or other fertilizer production does not automatically imply this byproduct pathway.',
    locators: [loc(EPA_N2O, 'EPA industry sources: nitric-acid production used for synthetic fertilizer generates the gas as a byproduct.'), loc(EPA_INVENTORY, 'US greenhouse-gas inventory: nitric-acid production is a separately estimated industrial source.', 'independent_authoritative')]
  }),
  relationship({
    source: NITROUS_OXIDE_REHABILITATION_NODE_ID, target: 'temp', verb: 'raises', effect: true,
    mechanism: 'Its long atmospheric lifetime and strong infrared absorption add positive radiative forcing, contributing to warming alongside other greenhouse gases.',
    scope: 'Global atmosphere; this edge represents marginal forcing, not sole attribution of observed temperature change.', time: 'Decades to more than a century.',
    moderators: ['atmospheric concentration', 'lifetime', 'overlapping absorption', 'other climate forcings'],
    alternatives: ['carbon dioxide forcing', 'methane forcing', 'aerosol forcing', 'internal variability'],
    counterevidence: 'Short regional temperature changes cannot be assigned to this gas alone.',
    locators: [loc(EPA_N2O, 'EPA properties: long atmospheric lifetime and high 100-year global-warming potential.'), loc(NOAA_N2O, 'NOAA GML: global atmospheric concentration monitoring and long-term trend.', 'independent_authoritative')]
  })
]);

export function hasCompleteNitrousOxideDossier(item) {
  const d = item.evidence?.dossier;
  return Boolean(d?.promotion_status === 'promoted' && d.moderators?.length && d.alternative_explanations?.length && d.counterevidence && d.indicator?.metric_id && d.source_locators?.length >= 2);
}
