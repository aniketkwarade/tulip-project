export const RESEARCH_BATCH_NODE_IDS = Object.freeze([
  'antarctic_shelf_instability',
  'shell_calcification_failures',
  'ice_albedo_feedback_loops'
]);

export const RESEARCH_TRACK_UNSUPPORTED_EDGE_KEYS = new Set([
  'ocean_acidification->antarctic_shelf_instability',
  'reef_structural_collapse->shell_calcification_failures'
]);

// These legacy links are directionally defensible but lacked relationship-level evidence.
// Drop the inherited version so the dossiered replacement is the only live representation.
export const RESEARCH_TRACK_REPLACED_EDGE_KEYS = new Set([
  'cryoconite_hole_expansion->ice_albedo_feedback_loops'
]);

const IPCC_OCEAN_CRYOSPHERE = 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/';
const NASA_ICE_SHEETS = 'https://climate.nasa.gov/vital-signs/ice-sheets/';
const NOAA_SHELLFISH = 'https://oceanacidification.noaa.gov/ocean-acidification-research/ocean-acidification-biological-response/shellfish/';
const NOAA_NCCOS_SHELLFISH = 'https://coastalscience.noaa.gov/news/marine-shellfish-populations-estimated-to-be-at-risk-from-ocean-acidification/';
const NSIDC_SEA_ICE = 'https://nsidc.org/learn/parts-cryosphere/sea-ice/why-sea-ice-matters';
const NSIDC_ARCTIC_IMPACTS = 'https://nsidc.org/learn/ask-scientist/what-are-impacts-arctic-sea-ice-loss';

export const RESEARCH_BATCH_NODE_SOURCES = Object.freeze({
  antarctic_shelf_instability: [IPCC_OCEAN_CRYOSPHERE, NASA_ICE_SHEETS],
  shell_calcification_failures: [NOAA_SHELLFISH, NOAA_NCCOS_SHELLFISH],
  ice_albedo_feedback_loops: [NSIDC_SEA_ICE, NSIDC_ARCTIC_IMPACTS]
});

export const RESEARCH_BATCH_METRIC_CONTRACTS = Object.freeze({
  antarctic_shelf_instability: {
    metric_id: 'antarctic_ice_shelf_basal_melt_and_grounding_line_change', metric_name: 'Antarctic ice-shelf basal melt, grounding-line position, and ice discharge',
    unit: 'meters per year, kilometers, and gigatonnes per year', geography: 'named Antarctic ice-shelf and drainage basin', cadence: 'annual reviewed update', observation_time_field: 'observation_year',
    source_id: 'imbie_publications_and_assessments', transformation: 'Interpret repeat altimetry, gravimetry, velocity, grounding-line, and ocean-observation products by named sector; never collapse distinct shelf processes into one pan-Antarctic threshold.',
    uncertainty: 'Ocean-cavity observations are sparse and instability thresholds have deep uncertainty; mass loss does not uniquely identify the mechanism.', threshold_provenance: 'Sector-specific published observations and assessed uncertainty ranges.',
    failure_behavior: 'Retain the last reviewed sector assessment and mark stale; do not infer instability from a global sea-level trend.'
  },
  shell_calcification_failures: {
    metric_id: 'carbonate_saturation_and_shellfish_growth_impairment', metric_name: 'Carbonate saturation state and observed shellfish growth or survival impairment',
    unit: 'aragonite or calcite saturation state, millimeters, grams, or survival percentage', geography: 'bounded shellfish habitat, hatchery, or estuary', cadence: 'seasonal', observation_time_field: 'sample_date',
    source_id: 'noaa_ocean_carbon_and_acidification_data_system', transformation: 'Pair quality-controlled carbonate chemistry with species, life stage, temperature, food availability, and measured shell or survival outcomes; do not infer biological failure from pH alone.',
    uncertainty: 'Responses vary strongly by species, life stage, acclimation, co-stressors, and local water chemistry.', threshold_provenance: 'Species- and life-stage-specific experimental or field thresholds only.',
    failure_behavior: 'Label evidence insufficient when chemistry or biological-response observations are absent or incomparable.'
  },
  ice_albedo_feedback_loops: {
    metric_id: 'sea_ice_snow_albedo_and_absorbed_shortwave_feedback', metric_name: 'Sea-ice and snow albedo anomaly with absorbed shortwave radiation',
    unit: 'dimensionless albedo and watts per square meter', geography: 'bounded Arctic sea-ice or snow-covered region', cadence: 'monthly seasonal cycle', observation_time_field: 'month',
    source_id: 'nsidc_sea_ice_today', transformation: 'Compare albedo and sea-ice or snow state against a fixed seasonal baseline, retaining cloud, melt-pond, and sensor uncertainty rather than treating reflectivity change as a universal forcing.',
    uncertainty: 'Cloud cover, melt ponds, snow grain size, aerosols, and surface type alter albedo and feedback strength.', threshold_provenance: 'Seasonal regional baseline; no single global feedback threshold.',
    failure_behavior: 'Keep the prior reviewed seasonal state and surface missing satellite or reprocessing coverage.'
  }
});

function locator(url, locatorText, sourceType = 'authoritative_assessment') {
  return { url, locator: locatorText, source_type: sourceType };
}

function dossierEdge({ source, target, relationshipLevel, mechanism, geographicScope, temporalScope, moderators, alternatives, counterevidence, locators, role = 'driver', influence = .4 }) {
  const sourceUrls = [...new Set(locators.map(item => item.url))];
  const owner = RESEARCH_BATCH_NODE_IDS.includes(target) ? target : source;
  return {
    source, target, verb: role === 'effect' ? 'can propagate into' : 'contributes to', adverb: 'within the documented scope', influence,
    topology_rule: 'research_track_dossier_promotion',
    evidence: {
      source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference', relationship_level: relationshipLevel,
      relationship_type: role === 'effect' ? 'bounded_downstream_effect' : 'bounded_rehabilitation_driver', confidence: relationshipLevel === 'direct' ? 'high' : 'moderate',
      source_urls: sourceUrls, relationship_source_urls: sourceUrls, mechanism, geographic_scope: geographicScope, temporal_scope: temporalScope,
      notes: 'Research-track rehabilitation: promote only with the stated mechanism, scope, moderators, and counterevidence.',
      dossier: { version: 'research_track_edge_dossier_v1', promotion_status: 'promoted', reviewed_at: '2026-07-17', source, target, mechanism, geographic_scope: geographicScope, temporal_scope: temporalScope, moderators, alternative_explanations: alternatives, confidence: relationshipLevel === 'direct' ? 'high' : 'moderate', counterevidence, indicator: RESEARCH_BATCH_METRIC_CONTRACTS[owner], source_locators: locators, evidence_basis: relationshipLevel }
    }
  };
}

export const RESEARCH_BATCH_RELATIONSHIPS = Object.freeze([
  dossierEdge({ source: 'ocean_heat_content', target: 'antarctic_shelf_instability', relationshipLevel: 'direct', influence: .58,
    mechanism: 'Warmer subsurface Southern Ocean water entering ice-shelf cavities increases basal melting, thinning shelves that buttress grounded Antarctic ice.', geographicScope: 'Antarctic sectors where warm water can access ice-shelf cavities; strongest evidence is sector-specific.', temporalScope: 'Seasonal ocean forcing with multi-year to multi-decadal ice response.', moderators: ['ocean-cavity access', 'bathymetry', 'tides and eddies', 'ice-shelf geometry'], alternatives: ['surface melt and hydrofracture', 'internal ice dynamics'], counterevidence: 'Future cavity warming and water-mass access are uncertain, and not all Antarctic shelves experience the same ocean forcing.',
    locators: [locator(IPCC_OCEAN_CRYOSPHERE, 'Section 9.4.2: warmer ocean water drives basal ice-shelf melt and Antarctic dynamic mass loss'), locator(NASA_ICE_SHEETS, 'NASA ice-sheet vital signs: Antarctic ice loss observations', 'independent_authoritative')] }),
  dossierEdge({ source: 'temp', target: 'antarctic_shelf_instability', relationshipLevel: 'indirect', influence: .39,
    mechanism: 'Global and regional warming condition Antarctic shelf instability through Southern Ocean warming and, in some locations, enhanced surface melt and hydrofracture risk.', geographicScope: 'Antarctic ice shelves; the pathway is not spatially uniform.', temporalScope: 'Multi-decadal climate forcing with episodic shelf response.', moderators: ['regional ocean circulation', 'surface melt and firn state', 'ice-shelf geometry'], alternatives: ['natural ocean variability', 'local wind-driven circulation'], counterevidence: 'Air-temperature change alone does not determine basal melt or whether an ice shelf destabilizes.',
    locators: [locator(IPCC_OCEAN_CRYOSPHERE, 'Chapter 9: Antarctic dynamic loss, ocean warming, and ice-shelf disintegration'), locator(NASA_ICE_SHEETS, 'NASA ice-sheet vital signs: warming and observed ice-sheet mass change', 'independent_authoritative')] }),
  dossierEdge({ source: 'ice_sheet_mass_loss', target: 'antarctic_shelf_instability', relationshipLevel: 'indirect', influence: .37,
    mechanism: 'Observed sectoral ice mass loss and acceleration can signal reduced buttressing and a dynamic response associated with ice-shelf thinning or retreat, requiring mechanism-specific interpretation.', geographicScope: 'Named Antarctic drainage basin and adjoining shelf only.', temporalScope: 'Annual to decadal observation records.', moderators: ['grounding-line position', 'bed geometry', 'ice discharge', 'snow accumulation'], alternatives: ['surface mass-balance anomalies', 'observation-method differences'], counterevidence: 'Mass loss is an outcome measure and cannot by itself establish that shelf instability is the causal mechanism.',
    locators: [locator(IPCC_OCEAN_CRYOSPHERE, 'Chapter 9: observed West Antarctic outlet-glacier loss and basal shelf melt'), locator(NASA_ICE_SHEETS, 'NASA ice-sheet vital signs: satellite mass-change record', 'independent_authoritative')] }),
  dossierEdge({ source: 'antarctic_shelf_instability', target: 'sea_level_rise', relationshipLevel: 'direct', role: 'effect', influence: .54,
    mechanism: 'Loss of ice-shelf buttressing can accelerate grounded-ice discharge into the ocean, adding to global mean sea-level rise.', geographicScope: 'Grounded Antarctic drainage basins connected to destabilizing shelves.', temporalScope: 'Decadal to multi-century, with highly uncertain instability timing.', moderators: ['bed slope', 'buttressing geometry', 'ocean forcing', 'ice dynamics'], alternatives: ['thermal expansion', 'Greenland and glacier mass loss'], counterevidence: 'Ice-shelf loss itself is floating and does not directly raise sea level; the effect depends on the response of grounded ice.',
    locators: [locator(IPCC_OCEAN_CRYOSPHERE, 'Chapter 9: ice-shelf basal melt, grounded ice discharge, and sea-level contribution'), locator(NASA_ICE_SHEETS, 'NASA ice-sheet vital signs: land-ice mass loss and sea-level contribution', 'independent_authoritative')] }),
  dossierEdge({ source: 'ocean_acidification', target: 'shell_calcification_failures', relationshipLevel: 'direct', influence: .62,
    mechanism: 'Lower carbonate-ion concentration and saturation state make it harder for calcifying shellfish to build and maintain calcium-carbonate shells.', geographicScope: 'Shellfish and other calcifiers in waters with measured carbonate-chemistry change; sensitivity is species and life-stage specific.', temporalScope: 'Hours to seasons for chemistry and organism response; multi-year trend assessment.', moderators: ['species and life stage', 'carbonate saturation state', 'food availability', 'temperature'], alternatives: ['disease', 'pollution', 'harvest pressure'], counterevidence: 'Some species acclimate or tolerate local conditions; reduced pH alone does not establish shell failure.',
    locators: [locator(NOAA_SHELLFISH, 'NOAA shellfish response: carbonate-ion decline affects shell building and maintenance'), locator(NOAA_NCCOS_SHELLFISH, 'NCCOS: carbonate chemistry impairs bivalve shell development', 'independent_authoritative')] }),
  dossierEdge({ source: 'marine_heatwaves', target: 'shell_calcification_failures', relationshipLevel: 'direct', influence: .46,
    mechanism: 'Acute warming can compound carbonate-chemistry stress by hindering shellfish larval growth and shell formation, especially when temperatures exceed species-specific optima.', geographicScope: 'Measured coastal shellfish habitats and hatcheries; not a universal temperature response.', temporalScope: 'Days to seasons, with repeated events affecting cohorts.', moderators: ['species thermal tolerance', 'life stage', 'food supply', 'acidification state'], alternatives: ['pathogens', 'hypoxia', 'hatchery management'], counterevidence: 'Warming can be neutral or beneficial within an organism’s thermal window; heat effects cannot be inferred without local temperature and response data.',
    locators: [locator(NOAA_SHELLFISH, 'NOAA shellfish response: interactive warming and acidification effects on growth and shell formation'), locator(NOAA_NCCOS_SHELLFISH, 'NCCOS: local chemistry and multiple stressors affecting bivalves', 'independent_authoritative')] }),
  dossierEdge({ source: 'estuary_eutrophication', target: 'shell_calcification_failures', relationshipLevel: 'indirect', influence: .36,
    mechanism: 'Nutrient enrichment can raise respiration-driven CO2 and lower oxygen in coastal waters, worsening corrosive conditions that constrain shell development in susceptible habitats.', geographicScope: 'Nutrient-enriched estuaries with measured carbonate chemistry and shellfish exposure.', temporalScope: 'Seasonal blooms and respiration events; multi-year eutrophication trend.', moderators: ['water residence time', 'mixing', 'nutrient load', 'shellfish location'], alternatives: ['upwelling-driven corrosive water', 'freshwater alkalinity changes'], counterevidence: 'Nutrient effects can vary with management and circulation and do not necessarily create corrosive water in every estuary.',
    locators: [locator(NOAA_NCCOS_SHELLFISH, 'NCCOS: nutrient runoff can create low-oxygen, high-CO2 coastal waters'), locator(NOAA_SHELLFISH, 'NOAA shellfish response: chemistry and co-stressor context', 'independent_authoritative')] }),
  dossierEdge({ source: 'shell_calcification_failures', target: 'marine_food_web_simplification', relationshipLevel: 'indirect', role: 'effect', influence: .35,
    mechanism: 'Reduced growth or survival of calcifying shellfish and plankton can alter prey availability and habitat functions, contributing to food-web reorganization where they are ecologically important.', geographicScope: 'Food webs with material dependence on the affected calcifying taxa.', temporalScope: 'Cohort to multi-year ecosystem response.', moderators: ['functional redundancy', 'fishing pressure', 'habitat condition', 'species composition'], alternatives: ['warming-driven distribution shifts', 'overfishing', 'deoxygenation'], counterevidence: 'Local shellfish impairment may have limited ecosystem effect where other prey or habitat functions compensate.',
    locators: [locator(NOAA_SHELLFISH, 'NOAA shellfish response: impacts on food webs and economies'), locator(NOAA_NCCOS_SHELLFISH, 'NCCOS: shellfish population risk in coastal ecosystems', 'independent_authoritative')] }),
  dossierEdge({ source: 'temp', target: 'ice_albedo_feedback_loops', relationshipLevel: 'direct', influence: .58,
    mechanism: 'Warming melts reflective snow and sea ice, exposing darker surfaces that absorb more solar energy and reinforce additional melt.', geographicScope: 'Snow- and sea-ice-covered polar regions during the sunlit melt season.', temporalScope: 'Seasonal feedback expressed over years to decades.', moderators: ['solar angle', 'clouds', 'snow condition', 'melt ponds'], alternatives: ['aerosol deposition', 'cloud-radiative effects'], counterevidence: 'The feedback strength varies strongly by season and surface type and is weak or inactive in polar night.',
    locators: [locator(NSIDC_SEA_ICE, 'NSIDC: loss of reflective sea ice increases absorption and amplifies warming'), locator(NSIDC_ARCTIC_IMPACTS, 'NSIDC: dark open water absorbs far more solar radiation than sea ice', 'independent_authoritative')] }),
  dossierEdge({ source: 'sea_ice_season_loss', target: 'ice_albedo_feedback_loops', relationshipLevel: 'direct', influence: .57,
    mechanism: 'Seasonal sea-ice loss replaces high-albedo ice with dark ocean during the sunlit season, increasing absorbed shortwave energy and strengthening the ice-albedo feedback.', geographicScope: 'Arctic sea-ice regions during sunlit open-water expansion.', temporalScope: 'Seasonal with cumulative multi-decadal decline.', moderators: ['cloud cover', 'melt-pond fraction', 'ocean mixed-layer heat', 'freeze-up timing'], alternatives: ['snow-albedo change on land', 'short-term wind-driven ice export'], counterevidence: 'The sign and size of local radiative effects depend on cloud and seasonal conditions; sea-ice extent alone is not a full energy-budget measure.',
    locators: [locator(NSIDC_SEA_ICE, 'NSIDC: sea-ice reflectivity and positive feedback mechanism'), locator(NSIDC_ARCTIC_IMPACTS, 'NSIDC: exposed ocean absorption and Arctic amplification', 'independent_authoritative')] }),
  dossierEdge({ source: 'cryoconite_hole_expansion', target: 'ice_albedo_feedback_loops', relationshipLevel: 'indirect', influence: .34,
    mechanism: 'Dark debris and biological material on snow or glacier surfaces can locally lower albedo, increasing absorbed energy and melt in exposed accumulation or ablation zones.', geographicScope: 'Debris- or biologically darkened snow and glacier surfaces; not a pan-Arctic sea-ice mechanism.', temporalScope: 'Melt-season surface process.', moderators: ['debris concentration', 'surface wetness', 'solar radiation', 'snow renewal'], alternatives: ['black-carbon deposition', 'melt-pond formation'], counterevidence: 'Cryoconite effects are spatially patchy and cannot be scaled to regional albedo without measured surface coverage.',
    locators: [locator(NSIDC_SEA_ICE, 'NSIDC: albedo mechanism and surface reflectivity context'), locator(NSIDC_ARCTIC_IMPACTS, 'NSIDC: feedback depends on exposed darker surfaces', 'independent_authoritative')] }),
  dossierEdge({ source: 'ice_albedo_feedback_loops', target: 'arctic_amplification_rates', relationshipLevel: 'direct', role: 'effect', influence: .57,
    mechanism: 'Additional solar absorption after reflective ice and snow loss contributes to faster Arctic warming relative to lower latitudes, a central component of Arctic amplification.', geographicScope: 'Arctic regions with recurring seasonal snow or sea-ice loss.', temporalScope: 'Seasonal radiative forcing accumulated over decades.', moderators: ['cloud feedbacks', 'ocean heat storage', 'atmospheric transport', 'surface type'], alternatives: ['water-vapor and lapse-rate feedbacks', 'ocean heat transport'], counterevidence: 'Arctic amplification has multiple interacting mechanisms; albedo feedback is important but not sufficient by itself to explain all regional warming.',
    locators: [locator(NSIDC_ARCTIC_IMPACTS, 'NSIDC: sea-ice loss contributes to Arctic amplification'), locator(NSIDC_SEA_ICE, 'NSIDC: positive sea-ice albedo feedback and warming', 'independent_authoritative')] })
]);

export function hasCompleteResearchBatchDossier(edge) {
  const dossier = edge.evidence?.dossier;
  return Boolean(dossier?.promotion_status === 'promoted' && dossier.mechanism && dossier.geographic_scope && dossier.temporal_scope && dossier.moderators?.length && dossier.alternative_explanations?.length && dossier.counterevidence && dossier.indicator?.metric_id && dossier.source_locators?.length >= 2);
}
