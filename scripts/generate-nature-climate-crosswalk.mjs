import { writeFileSync } from 'node:fs';
import { NODES, GRAPH_PROFILE } from '../src/data.js';

const FAMILY_SEARCH_URLS = {
  water_systems: 'https://www.nature.com/search?q=water%20security&journal=nclimate',
  cryosphere_frontiers: 'https://www.nature.com/search?q=ice%20sheet%20sea%20ice&journal=nclimate',
  ocean_regimes: 'https://www.nature.com/articles/s41558-026-02684-z',
  carbon_cycle_feedbacks: 'https://www.nature.com/articles/s41558-026-02686-x',
  atmospheric_patterns: 'https://www.nature.com/articles/s41558-026-02670-5',
  energy_systems: 'https://www.nature.com/search?q=electricity%20demand&journal=nclimate',
  transport_systems: 'https://www.nature.com/search?q=aviation%20shipping%20climate&journal=nclimate',
  biosphere_resilience: 'https://www.nature.com/search?q=wildfire%20biodiversity&journal=nclimate',
  agriculture_food: 'https://www.nature.com/search?q=agriculture%20yield&journal=nclimate',
  governance_finance: 'https://www.nature.com/search?q=insurance%20climate%20risk&journal=nclimate',
  baseline: 'https://www.nature.com/nclimate/'
};

const BASELINE_RULES = new Map([
  ['temp', ['core', 'Nature Climate is centrally organized around observed warming and its system-wide consequences.']],
  ['methane', ['core', 'Methane remains a major recurring greenhouse-gas forcing topic in the journal.']],
  ['deforestation', ['strong', 'Land-use change and forest-climate feedbacks are frequent Nature Climate topics.']],
  ['industry_farming', ['strong', 'Agricultural emissions, land use, and farming impacts are regularly covered.']],
  ['food', ['strong', 'Food-system exposure and crop impacts are recurring journal themes.']],
  ['urbanization', ['strong', 'Urban exposure, heat, and adaptation are established Nature Climate topics.']],
  ['fast_fashion', ['limited', 'This is climate-relevant but narrower and less central to Nature Climate than system-scale climate processes or sectoral transitions.']],
  ['migration', ['strong', 'Climate-linked displacement and mobility are established impact topics in the journal.']],
  ['resource_depletion', ['moderate', 'Resource stress appears in the journal, but usually through water, land, or adaptation framing rather than as a standalone generic phenomenon.']],
  ['carbon_emission', ['core', 'CO2 forcing and emissions trajectories are foundational Nature Climate topics.']],
  ['personal_conveyance', ['moderate', 'Transport emissions matter, but this label is narrower than the journal’s typical system-level framing.']],
  ['environ_anomalies', ['core', 'The journal recurrently covers extremes, anomalies, and climate-system departures from baseline conditions.']],
  ['el_nino', ['core', 'ENSO is a canonical climate-variability phenomenon in Nature Climate coverage.']],
  ['la_nina', ['core', 'La Nina is a canonical climate-variability phenomenon in Nature Climate coverage.']],
  ['amoc', ['core', 'Large-scale overturning circulation change is a core physical-climate topic in the journal.']],
  ['wet_bulb_heat', ['core', 'Heat stress and survivability thresholds are recurring Nature Climate topics.']],
  ['monsoon_volatility', ['core', 'Monsoon variability and its impacts are recurrent climate-risk subjects.']],
  ['permafrost_thaw', ['core', 'Permafrost-carbon and Arctic feedbacks are central climate-feedback topics.']],
  ['data_centers', ['limited', 'Energy demand matters, but data centers are newer and less central than broader power-system or emissions themes.']],
  ['ai_data_centers', ['limited', 'AI data centers are climate-relevant but still a niche subtopic relative to core journal coverage.']]
]);

const FAMILY_RULES = {
  water_systems: {
    tier: 'strong',
    rationale: 'Water security, drought, flood, and hydrologic disruption are frequent Nature Climate impact themes.'
  },
  cryosphere_frontiers: {
    tier: 'core',
    rationale: 'Ice-sheet loss, sea ice decline, snow drought, and cryosphere-linked risks are core physical-climate topics.'
  },
  ocean_regimes: {
    tier: 'core',
    rationale: 'Ocean circulation, deoxygenation, acidification, SST variability, and marine-system disruption are core Nature Climate themes.'
  },
  carbon_cycle_feedbacks: {
    tier: 'core',
    rationale: 'Carbon-sink weakening and climate-carbon feedbacks are foundational Nature Climate topics.'
  },
  atmospheric_patterns: {
    tier: 'core',
    rationale: 'Heat stress, teleconnections, circulation anomalies, and severe-convective hazards are core Nature Climate subjects.'
  },
  energy_systems: {
    tier: 'moderate',
    rationale: 'Power-system, industrial, and grid-transition risks appear in the journal, but many anchors here are more operational than canonical climate phenomena.'
  },
  transport_systems: {
    tier: 'moderate',
    rationale: 'Transport emissions and climate-exposed mobility infrastructure appear in the journal, but less centrally than physical climate or water-food risk.'
  },
  biosphere_resilience: {
    tier: 'strong',
    rationale: 'Wildfire, biodiversity loss, ecosystem resilience, and species redistribution are strong recurring Nature Climate themes.'
  },
  agriculture_food: {
    tier: 'strong',
    rationale: 'Crop yields, farm heat, food exposure, and agricultural adaptation are major journal themes.'
  },
  governance_finance: {
    tier: 'strong',
    rationale: 'Adaptation, health burden, relocation, insurance, and conflict-risk framing recur often in Nature Climate impacts coverage.'
  }
};

const EXCEPTIONS = new Map([
  ['semiconductor_fabrication_footprint', ['limited', 'This is climate-relevant but much narrower and more industrially specific than typical Nature Climate focal phenomena.']],
  ['backup_generator_dependence', ['limited', 'Operational backup dependence is important locally but is not a common top-level Nature Climate phenomenon.']],
  ['battery_supply_chain_pressure', ['moderate', 'Supply-chain climate implications matter, but this is still more transition-operations than canonical climate phenomenon.']],
  ['critical_mineral_extraction_pressure', ['moderate', 'Transition minerals are a meaningful climate-economy theme, but less central than physical climate hazards.']],
  ['cement_process_emissions', ['strong', 'Industrial decarbonization is a real Nature Climate transition theme even if this anchor is sector-specific.']],
  ['steel_decarbonization_gap', ['strong', 'Industrial decarbonization is a real Nature Climate transition theme even if this anchor is sector-specific.']],
  ['cooling_water_competition', ['strong', 'This sits at the intersection of water stress and power-system vulnerability, both of which are strong journal themes.']],
  ['energy_affordability_crisis', ['strong', 'Energy vulnerability and distributive climate impacts align with strong Nature Climate impacts coverage.']],
  ['aviation_demand_growth', ['moderate', 'Aviation is climate-relevant but not as central as broader emissions or heat-water-food risks.']],
  ['shipping_lane_disruption', ['moderate', 'Shipping is relevant but more sector-specific than Nature Climate’s core physical and societal phenomena.']],
  ['road_freight_diesel_lock_in', ['limited', 'Too operationally specific relative to the journal’s usual framing.']],
  ['airport_climate_exposure', ['moderate', 'Infrastructure exposure is covered, but this specific anchor is narrower than the journal’s main emphasis.']],
  ['bridge_scour_exposure', ['moderate', 'Infrastructure risk matters, though this anchor is narrower than the journal’s dominant themes.']],
  ['rail_heat_buckling', ['moderate', 'Heat-exposed infrastructure fits the journal’s impact lens, but this label is still relatively specific.']],
  ['urban_tree_canopy_loss', ['moderate', 'Urban heat and adaptation are important, but this specific adaptation asset is narrower than the journal’s core framing.']],
  ['fertilizer_price_shock', ['moderate', 'Climate-food-economic linkages matter, though price shocks are more indirect than primary physical phenomena.']],
  ['cold_chain_failure_risk', ['moderate', 'Climate-sensitive supply fragility is relevant but more operational than canonical.']],
  ['fishery_protein_dependence', ['strong', 'Food security and marine exposure align strongly with Nature Climate impact coverage.']],
  ['climate_litigation_pressure', ['moderate', 'Governance response is relevant, but litigation is less central than core climate impacts or mitigation themes.']],
  ['atlantic_ni_o_ni_a', ['core', 'Directly supported by a recent Nature Climate Change paper treating Atlantic Nino/Nina as a canonical variability mode.']],
  ['nocturnal_heat_stress', ['core', 'Directly supported by recent Nature Climate Change heat-stress research.']],
  ['compound_day_night_heat_extremes', ['core', 'Directly supported by recent Nature Climate Change heat-stress research.']],
  ['hail_hazard_shift', ['core', 'Directly supported by recent Nature Climate Change hail-risk research.']]
]);

function inferFamilyFromGeneratedNode(node) {
  const id = node.id || '';
  if (/aquifer|river|reservoir|snowmelt|soil_moisture|flash_flood|drought|freshwater|watershed|wastewater|irrigation|hydropower|desalination|water/.test(id)) return 'water_systems';
  if (/ice|glacial|glacier|sea_ice|thermokarst|polar|snow_drought|firn|cryo|permafrost|arctic/.test(id)) return 'cryosphere_frontiers';
  if (/deoxygen|acidification|pelagic|hypoxia|salinity|algal|fisheries|reef|mangrove|upwelling|gyre|oscillation|dipole|storm_surge|littoral|ocean|marine|coastal|blue_carbon/.test(id)) return 'ocean_regimes';
  if (/carbon_sink|methane|peat|wetland_carbon|calcification|hydrat|respiration/.test(id)) return 'carbon_cycle_feedbacks';
  if (/heat|humidity|lightning|dryness|soot|ozone|rossby|smoke|cloud|aerosol|hail|jet|vortex|wind|atmospheric|walker|monsoon/.test(id)) return 'atmospheric_patterns';
  if (/grid|power|transformer|gas|mineral|battery|semiconductor|cooling_water|generator|renewable|curtailment|cement|steel|energy/.test(id)) return 'energy_systems';
  if (/aviation|shipping|freight|port|diesel|airport|bridge|rail|transport/.test(id)) return 'transport_systems';
  if (/biodiversity|wildfire|forest|pollinator|species|insect|humus|ecosystem|canopy|freshwater_ecosystem|mangrove_buffer/.test(id)) return 'biosphere_resilience';
  if (/crop|farm|livestock|fertilizer|feed|food|cold_chain|protein|labor|topsoil|agric/.test(id)) return 'agriculture_food';
  if (/insurance|mortgage|health|vector|adaptation|infrastructure|recovery|relocation|litigation|conflict/.test(id)) return 'governance_finance';
  return 'procedural';
}

function inferAssessment(anchor) {
  const directNature = (anchor.calibration?.source_urls || []).find(url => url.includes('nature.com/articles/s41558'));
  if (directNature) {
    return {
      tier: 'core',
      basis: 'direct_nature_climate_paper',
      evidence_urls: [directNature],
      rationale: 'This phenomenon is directly represented by a Nature Climate Change research article already attached to the anchor.'
    };
  }

  if (EXCEPTIONS.has(anchor.id)) {
    const [tier, rationale] = EXCEPTIONS.get(anchor.id);
    return {
      tier,
      basis: 'family_inference_with_exception',
      evidence_urls: [FAMILY_SEARCH_URLS[anchor.family] || FAMILY_SEARCH_URLS.baseline],
      rationale
    };
  }

  if (BASELINE_RULES.has(anchor.id)) {
    const [tier, rationale] = BASELINE_RULES.get(anchor.id);
    return {
      tier,
      basis: 'baseline_inference',
      evidence_urls: [FAMILY_SEARCH_URLS.baseline],
      rationale
    };
  }

  const familyRule = FAMILY_RULES[anchor.family];
  return {
    tier: familyRule?.tier || 'moderate',
    basis: 'family_recurrence_inference',
    evidence_urls: [FAMILY_SEARCH_URLS[anchor.family] || FAMILY_SEARCH_URLS.baseline],
    rationale: familyRule?.rationale || 'This topic is climate-relevant but its Nature Climate importance is inferred from adjacent family coverage rather than a direct article match.'
  };
}

const anchors = NODES.filter(node => node.calibration?.role === 'anchor')
  .map(node => {
    const family = node.expansion?.family || 'baseline';
    const assessment = inferAssessment({ ...node, family });
    return {
      id: node.id,
      name: node.name,
      sphere: node.sphere,
      family,
      nature_climate_importance: assessment.tier,
      nature_climate_basis: assessment.basis,
      evidence_urls: assessment.evidence_urls,
      rationale: assessment.rationale
    };
  });

const anchorMap = new Map(anchors.map(anchor => [anchor.id, anchor]));

const nodes = NODES.map(node => {
  if (node.calibration?.role === 'anchor') {
    return {
      id: node.id,
      name: node.name,
      sphere: node.sphere,
      family: node.expansion?.family || 'baseline',
      calibration_role: 'anchor',
      inherited_from_anchor: null,
      nature_climate_importance: anchorMap.get(node.id).nature_climate_importance,
      nature_climate_basis: anchorMap.get(node.id).nature_climate_basis,
      evidence_urls: anchorMap.get(node.id).evidence_urls,
      rationale: anchorMap.get(node.id).rationale
    };
  }

  const inheritedAnchor = anchorMap.get(node.calibration?.anchor_id || '');
  const family = inferFamilyFromGeneratedNode(node);
  const familyRule = FAMILY_RULES[family];
  return {
    id: node.id,
    name: node.name,
    sphere: node.sphere,
    family,
    calibration_role: 'generated',
    inherited_from_anchor: family === 'procedural' && inheritedAnchor ? inheritedAnchor.id : null,
    nature_climate_importance: familyRule ? familyRule.tier : inheritedAnchor ? inheritedAnchor.nature_climate_importance : 'moderate',
    nature_climate_basis: familyRule ? 'family_recurrence_inference' : inheritedAnchor ? 'inherited_from_anchor' : 'family_recurrence_inference',
    evidence_urls: familyRule ? [FAMILY_SEARCH_URLS[family]] : inheritedAnchor ? inheritedAnchor.evidence_urls : [FAMILY_SEARCH_URLS.baseline],
    rationale: familyRule
      ? `Generated node grouped into ${family} and scored from family-level Nature Climate recurrence.`
      : inheritedAnchor
        ? `Generated node fell back to anchor ${inheritedAnchor.name}, which provides the closest curated Nature Climate relevance signal.`
        : 'Generated node without a clear family or anchor inheritance; scored conservatively from broad journal relevance.'
  };
});

const summary = nodes.reduce((acc, row) => {
  acc[row.nature_climate_importance] = (acc[row.nature_climate_importance] || 0) + 1;
  return acc;
}, {});

const payload = {
  audited_at: '2026-06-27',
  scope: {
    layer: 'all_nodes',
    reason: 'Anchors are directly audited. Generated nodes inherit Nature Climate importance from their nearest anchor or family, which is more defensible than hand-scoring hundreds of procedural labels individually.'
  },
  rubric: {
    core: 'Direct Nature Climate paper support or a phenomenon that sits at the center of the journal’s physical-climate or high-salience impact coverage.',
    strong: 'A recurring journal theme with clear climate-system or societal importance, even without a direct anchor-specific paper attached.',
    moderate: 'Climate-relevant and plausibly covered by the journal, but narrower, more operational, or more indirect than core themes.',
    limited: 'Important to the platform, but relatively niche, consumer-specific, or operationally specific compared with Nature Climate’s usual focal phenomena.'
  },
  graph_profile: GRAPH_PROFILE,
  counts_by_tier: summary,
  anchor_count: anchors.length,
  node_count: nodes.length,
  anchors,
  nodes
};

writeFileSync(new URL('../public/nature-climate-crosswalk.json', import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote nature-climate crosswalk for ${anchors.length} anchors and ${nodes.length} total nodes.`);
