const PLOS_OIL_PALM_STUDY = 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0159668';
const FAO_DEFORESTATION_TOOLBOX = 'https://www.fao.org/sustainable-forest-management-toolbox/modules/reducing-deforestation/en';
const FAO_FOREST_POSITIVE_CHAINS = 'https://www.fao.org/4/i1594e/i1594e00.pdf';
const EU_ILUC_REGULATION = 'https://eur-lex.europa.eu/eli/reg_del/2019/807/oj/eng';
const GFW_PALM_MONITORING = 'https://www.globalforestwatch.org/blog/data-and-tools/companies-can-now-spot-deforestation-in-their-palm-oil-supply-chains-before-it-happens/';

export const PALM_OIL_CLEARANCE_NODE_ID = 'palm_oil_canopy_clearance';
export const PALM_OIL_CLEARANCE_NODE_SOURCES = Object.freeze([
  PLOS_OIL_PALM_STUDY,
  FAO_DEFORESTATION_TOOLBOX,
  FAO_FOREST_POSITIVE_CHAINS,
  EU_ILUC_REGULATION,
  GFW_PALM_MONITORING
]);

export const PALM_OIL_CLEARANCE_METRIC_CONTRACTS = Object.freeze({
  [PALM_OIL_CLEARANCE_NODE_ID]: {
    metric_id: 'verified_forest_conversion_within_oil_palm_expansion',
    metric_name: 'Verified forest conversion associated with oil-palm expansion',
    unit: 'hectares per year, reported with forest baseline, canopy threshold, plantation boundary, and attribution method',
    geography: 'named plantation, concession, supply shed, subnational jurisdiction, or country',
    cadence: 'annual with alert-based interim review',
    observation_time_field: 'forest_loss_or_conversion_date',
    source_id: 'global_forest_watch',
    transformation: 'Intersect reviewed oil-palm plantation or probability maps with tree-cover-loss observations, then verify prior land cover and conversion timing; do not equate every tree-cover-loss pixel with deforestation or every loss inside a boundary with oil-palm causation.',
    uncertainty: 'Plantation and concession boundaries can be incomplete; canopy thresholds, replanting, fire, prior degradation, and temporal lag can change attribution.',
    threshold_provenance: 'Use the forest definition, canopy threshold, baseline year, plantation-map vintage, and attribution window stated by the underlying study or authoritative monitoring program.',
    failure_behavior: 'Keep the record in research track and report observed tree-cover loss without causal attribution when prior forest, plantation expansion, or conversion timing cannot be verified.'
  }
});

function relationship({ source, target, verb, level, influence, mechanism, scope, locators, moderators, alternatives, counterevidence }) {
  const metric = PALM_OIL_CLEARANCE_METRIC_CONTRACTS[PALM_OIL_CLEARANCE_NODE_ID];
  const dossier = {
    version: 'palm_oil_clearance_rehabilitation_v1',
    promotion_status: 'promoted',
    reviewed_at: '2026-07-17',
    source,
    target,
    mechanism,
    geographic_scope: scope.geographic,
    temporal_scope: scope.temporal,
    moderators,
    alternative_explanations: alternatives,
    confidence: level === 'direct' ? 'high' : 'moderate',
    counterevidence,
    indicator: metric,
    source_locators: locators,
    evidence_basis: level
  };
  const sourceUrls = [...new Set(locators.map(item => item.url))];
  return {
    source,
    target,
    verb,
    adverb: 'within the documented land-use and commodity-system scope',
    influence,
    topology_rule: 'palm_oil_clearance_rehabilitation',
    evidence: {
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: level,
      relationship_type: level === 'direct' ? 'bounded_land_conversion_pathway' : 'bounded_market_mediated_pathway',
      confidence: dossier.confidence,
      source_urls: sourceUrls,
      relationship_source_urls: sourceUrls,
      mechanism,
      geographic_scope: dossier.geographic_scope,
      temporal_scope: dossier.temporal_scope,
      notes: counterevidence,
      dossier
    }
  };
}

const studyLocator = locator => ({ url: PLOS_OIL_PALM_STUDY, locator, source_type: 'primary_peer_reviewed_land_change_study' });
const faoToolboxLocator = locator => ({ url: FAO_DEFORESTATION_TOOLBOX, locator, source_type: 'independent_authoritative_mechanism_reference' });
const faoChainLocator = locator => ({ url: FAO_FOREST_POSITIVE_CHAINS, locator, source_type: 'independent_authoritative_commodity_chain_reference' });

export const PALM_OIL_CLEARANCE_RELATIONSHIPS = Object.freeze([
  relationship({
    source: 'food',
    target: PALM_OIL_CLEARANCE_NODE_ID,
    verb: 'can increase pressure for',
    level: 'indirect',
    influence: 0.58,
    mechanism: 'Demand for edible oils and palm-containing food and consumer products can increase production and land demand; forest clearance occurs only where added supply is met through plantation expansion into forest rather than yield gains, replanting, stocks, substitution, or expansion on already-cleared land.',
    scope: {
      geographic: 'Palm-oil supply chains connected to humid tropical producing regions, with conversion attribution resolved to a named plantation landscape or jurisdiction.',
      temporal: 'Commodity-demand and plantation-expansion interval, allowing for investment, planting, and land-conversion lags.'
    },
    locators: [
      studyLocator('Introduction, paragraphs 1 and 3: palm oil is used in cooking and packaged foods; growing product demand led to large land expansion, some at the expense of tropical forest.'),
      faoChainLocator('Forest-positive commodity value chains, About: demand for and production of commercial agricultural commodities including palm oil is attributed to forest loss in active deforestation fronts.')
    ],
    moderators: ['yield growth', 'replanting rates', 'commodity prices', 'traceability and no-deforestation rules', 'use of already-cleared land', 'substitution among vegetable oils'],
    alternatives: ['domestic land policy', 'speculative land acquisition', 'timber extraction before planting', 'food demand met by stocks or non-palm oils'],
    counterevidence: 'Demand growth does not imply forest conversion in every region; the primary study found substantially lower forest replacement shares in some regions, and expansion can occur on previously cleared or degraded land.'
  }),
  relationship({
    source: 'industry_farming',
    target: PALM_OIL_CLEARANCE_NODE_ID,
    verb: 'can expand through',
    level: 'direct',
    influence: 0.72,
    mechanism: 'Commercial plantation establishment directly converts prior land cover when industrial cultivation expands onto forested parcels; the pathway depends on verified pre-plantation forest and does not apply to replanting or expansion on non-forest land.',
    scope: {
      geographic: 'Mapped oil-palm plantation expansion in tropical producing landscapes, especially Southeast Asia and other regions covered by land-change studies.',
      temporal: 'Observed forest-to-plantation transition window defined by the satellite or land-cover study.'
    },
    locators: [
      studyLocator('Abstract and Results: high-resolution imagery and land-cover histories show that sampled plantations replaced forest at regionally varying rates, including 45 percent in Southeast Asia and 31 percent in South America for the study baseline.'),
      faoToolboxLocator('Principal direct drivers: commercial agriculture for food, feedstock, fibre, and biofuel, explicitly including palm oil, is identified as a direct deforestation driver.')
    ],
    moderators: ['plantation scale', 'land tenure', 'forest protection and enforcement', 'prior degradation', 'smallholder versus industrial production', 'peatland status'],
    alternatives: ['forest loss before plantation investment', 'logging or fire unrelated to later planting', 'plantation expansion onto pasture or cropland', 'replanting within an existing estate'],
    counterevidence: 'A plantation footprint alone does not prove recent deforestation; prior land cover and conversion timing must be verified, and regional studies document substantial expansion on non-forest land.'
  }),
  relationship({
    source: 'personal_conveyance',
    target: PALM_OIL_CLEARANCE_NODE_ID,
    verb: 'can add biofuel demand pressure for',
    level: 'indirect',
    influence: 0.38,
    mechanism: 'Where road-fuel systems use palm-derived biodiesel, fuel demand and renewable-energy incentives can add feedstock demand that contributes to indirect production-area expansion into high-carbon-stock land unless additional supply is demonstrably low-ILUC or comes from existing land and yield gains.',
    scope: {
      geographic: 'Transport-fuel markets and connected producing regions where palm oil is an eligible or used biodiesel feedstock.',
      temporal: 'Policy-crediting and fuel-demand period linked to subsequent feedstock production-area expansion.'
    },
    locators: [
      { url: EU_ILUC_REGULATION, locator: 'Recitals 6-8 and Articles 1-5: additional biofuel feedstock demand can cause indirect land-use change; oil crops including palm are assessed against expansion into high-carbon-stock land and low-ILUC additionality criteria.', source_type: 'primary_regulatory_mechanism_source' },
      studyLocator('Introduction, paragraph 1: palm oil is used as biodiesel; paragraph 3 links growing product demand to production and land expansion.')
    ],
    moderators: ['biodiesel blend mandate', 'feedstock eligibility', 'waste-oil substitution', 'low-ILUC certification', 'vehicle efficiency and travel demand', 'yield and replanting response'],
    alternatives: ['fuel demand met by non-palm feedstocks', 'renewable electricity replacing liquid fuel', 'additional supply from yield gains', 'expansion on abandoned or severely degraded land'],
    counterevidence: 'The pathway is absent where palm is not used in transport fuel, and indirect land-use effects vary with feedstock sourcing, policy design, yields, land protection, substitution, and certification.'
  }),
  relationship({
    source: PALM_OIL_CLEARANCE_NODE_ID,
    target: 'deforestation',
    verb: 'is a commodity-specific component of',
    level: 'direct',
    influence: 0.7,
    mechanism: 'Verified clearing of prior forest for subsequent oil-palm establishment is a direct agricultural land-use conversion and therefore a bounded component of deforestation.',
    scope: {
      geographic: 'Named forest-to-oil-palm conversion areas with verified prior forest cover.',
      temporal: 'Observed clearance and subsequent plantation-establishment interval.'
    },
    locators: [
      studyLocator('Abstract and Results: the study identifies and quantifies sampled forest conversion to oil-palm plantations across 20 countries.'),
      faoToolboxLocator('Principal direct drivers: commercial agriculture including palm oil is listed as a direct driver of deforestation.')
    ],
    moderators: ['forest definition', 'canopy threshold', 'time between clearing and planting', 'plantation boundary accuracy', 'land-use governance'],
    alternatives: ['temporary tree-cover loss', 'rotation or replanting', 'fire or logging without plantation conversion', 'conversion of non-forest land'],
    counterevidence: 'Tree-cover loss or later oil-palm presence alone is insufficient; the prior forest state and conversion sequence must be established.'
  }),
  relationship({
    source: PALM_OIL_CLEARANCE_NODE_ID,
    target: 'biodiversity_intactness_loss',
    verb: 'can reduce',
    level: 'direct',
    influence: 0.62,
    mechanism: 'Replacing tropical forest with a structurally simplified oil-palm plantation removes and fragments habitat, reducing forest-species persistence and community intactness relative to the forest baseline.',
    scope: {
      geographic: 'Verified tropical forest-to-oil-palm conversions and ecologically connected landscapes.',
      temporal: 'Conversion through plantation lifetime, with recovery assessed only against an explicit habitat baseline.'
    },
    locators: [
      studyLocator('Abstract and Discussion: expansion into tropical forest threatens biodiversity; the paper synthesizes strong negative biodiversity effects and habitat loss associated with forest conversion.'),
      { url: GFW_PALM_MONITORING, locator: 'Palm-oil supply-chain monitoring workflow: plantation-linked deforestation alerts are used to identify and manage forest-loss risk in sourcing areas.', source_type: 'independent_operational_monitoring_reference' }
    ],
    moderators: ['remaining forest cover', 'landscape connectivity', 'riparian buffers', 'plantation age and management', 'species mobility', 'restoration'],
    alternatives: ['pre-existing habitat degradation', 'hunting and extraction', 'fire', 'roads and settlement growth', 'climate-driven range change'],
    counterevidence: 'Biodiversity responses vary among taxa and landscapes, and plantation management or retained forest patches can moderate—but not equate to—the original forest community.'
  })
]);

export function hasCompletePalmOilClearanceDossier(edge) {
  const dossier = edge?.evidence?.dossier;
  return edge?.topology_rule === 'palm_oil_clearance_rehabilitation'
    && Boolean(dossier?.source && dossier?.target && dossier?.mechanism && dossier?.geographic_scope && dossier?.temporal_scope && dossier?.counterevidence)
    && ['direct', 'indirect', 'inferred', 'extrapolated'].includes(dossier?.evidence_basis)
    && Array.isArray(dossier?.moderators) && dossier.moderators.length > 0
    && Array.isArray(dossier?.alternative_explanations) && dossier.alternative_explanations.length > 0
    && Array.isArray(dossier?.source_locators) && dossier.source_locators.length >= 2
    && dossier.source_locators.every(item => item?.url && item?.locator && item?.source_type)
    && Boolean(dossier?.indicator?.metric_id);
}
