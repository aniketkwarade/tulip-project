/**
 * THE TULIP PROJECT - Ecological Impact Vector Data
 * Contains base core nodes and a procedural generator to scale to 500+ nodes.
 */

import { applyNorthstarGraphContracts } from './northstar-contracts.js';
import { ONTOLOGY_METRIC_BINDINGS as REVIEWED_ONTOLOGY_METRIC_BINDINGS } from './ontology-metric-bindings.js';
import { PROMOTED_EXPANSION_NODES } from './promoted-expansion-contracts.js';
import { RIVER_BARRIER_NODES } from './river-barrier-expansion-contracts.js';
import { HUMANITARIAN_EXPANSION_NODES } from './humanitarian-expansion-contracts.js';
import { GROUNDWATER_WITHDRAWAL_NODES } from './groundwater-withdrawal-expansion-contracts.js';
import { NITROUS_OXIDE_DRIVER_NODES } from './nitrous-oxide-rehabilitation-contracts.js';
import { SULFUR_DIOXIDE_DRIVER_NODES } from './sulfur-dioxide-rehabilitation-contracts.js';
import { COAL_POWER_EXPANSION_NODES } from './coal-power-expansion-contracts.js';
import { ELECTRONICS_EOL_EXPANSION_NODES } from './electronics-end-of-life-expansion-contracts.js';
import { CARBON_MONOXIDE_DRIVER_NODES } from './carbon-monoxide-rehabilitation-contracts.js';
import { LANDFILL_METHANE_DRIVER_NODES } from './landfill-methane-rehabilitation-contracts.js';
import { RICE_METHANE_DRIVER_NODES } from './rice-methane-rehabilitation-contracts.js';
import { LOCOMOTIVE_EMISSIONS_NODES } from './locomotive-emissions-expansion-contracts.js';
import { CEMENT_CALCINATION_NODES } from './cement-calcination-rehabilitation-contracts.js';
import { REFRIGERANT_LEAKAGE_NODES } from './refrigerant-leakage-rehabilitation-contracts.js';
import { TIRE_WEAR_NODES } from './tire-wear-rehabilitation-contracts.js';
import { SEMICONDUCTOR_FGAS_NODES } from './semiconductor-fgas-rehabilitation-contracts.js';
import { BLAST_FURNACE_SLAG_NODES } from './blast-furnace-slag-rehabilitation-contracts.js';
import { MANURE_LAGOON_NODES } from './manure-lagoon-rehabilitation-contracts.js';
import { LITHIUM_BRINE_NODES } from './lithium-brine-rehabilitation-contracts.js';
import { CATTLE_COMPACTION_NODES } from './cattle-compaction-repair-contracts.js';
import { WATERBORNE_OUTBREAK_NODES } from './waterborne-outbreak-repair-contracts.js';
import { POLLINATOR_COLLAPSE_NODES } from './pollinator-collapse-repair-contracts.js';
import { ACID_DEPOSITION_NODES } from './acid-deposition-repair-contracts.js';
import { FOREST_DIEBACK_NODES } from './forest-dieback-repair-contracts.js';
import { SOIL_MICROBIAL_NODES } from './soil-microbial-repair-contracts.js';
import { URBAN_WATER_RATIONING_NODES } from './urban-water-rationing-repair-contracts.js';
import { DEEPWATER_SPILL_NODES } from './deepwater-spill-repair-contracts.js';
import { WILDFIRE_SMOKE_HEALTH_NODES } from './wildfire-smoke-health-repair-contracts.js';
import { RESERVOIR_STORAGE_NODES } from './reservoir-storage-repair-contracts.js';
import { AIR_POLLUTION_HEALTH_NODES } from './air-pollution-health-repair-contracts.js';
import { RAIN_ON_SNOW_NODES } from './rain-on-snow-repair-contracts.js';
import { SURFACE_STORAGE_NODES } from './surface-water-storage-repair-contracts.js';
import { TALIK_EXPANSION_NODES } from './talik-expansion-repair-contracts.js';
import { FRACKING_WASTEWATER_NODES } from './fracking-wastewater-repair-contracts.js';
import { COASTAL_PERMAFROST_NODES } from './coastal-permafrost-repair-contracts.js';
import { COASTAL_HYPOXIA_NODES } from './coastal-hypoxia-repair-contracts.js';
import { TUNDRA_SHRUBIFICATION_NODES } from './tundra-shrubification-repair-contracts.js';
import { COASTAL_SALTWATER_INTRUSION_NODES } from './coastal-saltwater-intrusion-repair-contracts.js';
import { ARCTIC_ICE_RETREAT_NODES } from './arctic-ice-retreat-repair-contracts.js';
import { FINAL_DENSITY_BATCH_NODES } from './final-density-batch-contracts.js';
import { EXTENSION_DENSITY_BATCH_NODES } from './extension-density-batch-contracts.js';
import { CARBON_EFFECT_METRIC_BINDINGS, CARBON_EMISSION_EXPANSION_METRIC_CONTRACTS, CARBON_EMISSION_EXPANSION_NODES } from './carbon-emission-expansion-contracts.js';
import { attachRelationshipDescriptions } from './relationship-descriptions.js';
import { agreeRelationshipVerbPhrase, attachRelationshipSemantics } from './relationship-semantics.js';
import { attachCompleteNodeInspectorProfiles } from './node-inspector-profiles.js';
import { applyRelationshipEvidenceGovernance } from './relationship-evidence-governance.js';
import { applyAnalyticalLabelReview } from './analytical-label-review.js';
import { attachRegionalHubProfiles } from './regional-hub-profiles.js';
import { UNSUPPORTED_FAMILY_RELATIONSHIP_EDGE_KEYS } from './relationship-rejection-decisions.js';
import { MISSING_LINK_RESEARCH_PROMOTION_EDGES } from './missing-link-research-promotions.js';
import { MISSING_LINK_RESEARCH_PROMOTION_EDGES_BATCH_TWO } from './missing-link-research-promotions-batch-two.js';
import { MISSING_LINK_RESEARCH_PROMOTION_EDGES_BATCH_THREE } from './missing-link-research-promotions-batch-three.js';

export const DIMENSIONS = [
  { name: 'Climate Forcing', key: 'climate_forcing', description: 'Contribution to warming, greenhouse pressure, heat trapping' },
  { name: 'Ecological Damage', key: 'ecological_damage', description: 'Harm to ecosystems, habitats, biodiversity, resilience' },
  { name: 'Human Drivenness', key: 'human_drivenness', description: 'How directly human systems create, scale, or control it' },
  { name: 'Societal Fallout', key: 'societal_fallout', description: 'Harm to food, water, health, migration, infrastructure, economy' }
];

export function getScoreBand(score) {
  if (score >= 8.5) return 'Systemic';
  if (score >= 7.0) return 'Critical';
  if (score >= 5.0) return 'Significant';
  if (score >= 3.0) return 'Elevated';
  return 'Low';
}

export function getNodeContext(sphere, name) {
  let speed = 'medium';
  if (['atmosphere', 'energy', 'digital', 'transport'].includes(sphere)) {
    speed = 'fast';
  } else if (['oceans', 'cryosphere', 'biosphere'].includes(sphere)) {
    speed = 'slow';
  }

  let reach = 'regional';
  if (['atmosphere', 'oceans', 'cryosphere'].includes(sphere)) {
    reach = 'global';
  } else if (['transport', 'digital', 'sociopolitical'].includes(sphere)) {
    reach = 'local';
  }

  let confidence = 'high';
  if (name.includes('Siberian') || name.includes('Sub-Saharan') || name.includes('Indo-Pacific')) {
    confidence = 'medium';
  }

  return { speed, reach, confidence };
}

export function calculateBaselineScore(vector) {
  const raw = (vector.climate_forcing * 0.30) +
              (vector.ecological_damage * 0.30) +
              (vector.human_drivenness * 0.20) +
              (vector.societal_fallout * 0.20);
  return parseFloat((1 + raw * 9).toFixed(1));
}

function clamp01(value) {
  return Math.max(0.0, Math.min(1.0, value));
}

function lerp(min, max, ratio) {
  return min + (max - min) * ratio;
}

function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed, salt = '') {
  const mixed = hashString(`${seed}:${salt}`);
  return mixed / 4294967295;
}

function seededRange(seed, min, max, salt = '') {
  return min + (max - min) * seededUnit(seed, salt);
}

function seededChoice(items, seed, salt = '') {
  if (!items || items.length === 0) return null;
  const idx = Math.floor(seededUnit(seed, salt) * items.length) % items.length;
  return items[idx];
}

function normalizeNodeKey(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

const HUMAN_IMPACT_PROFILES = {
  temp: {
    summary: 'Global warming raises baseline heat exposure, shrinks safe outdoor work hours, worsens drought and flood losses, and steadily makes more neighborhoods expensive to cool or protect.',
    domains: ['Health', 'Food', 'Water', 'Habitability'],
    affectedPopulations: ['Outdoor workers', 'Older adults', 'Low-income households', 'Residents of hot cities'],
    primaryPathways: ['Heat exposure', 'Crop stress', 'Water scarcity', 'Urban overheating'],
    consequences: [
      'Heat illness, kidney stress, and excess mortality rise during longer hot seasons.',
      'Crop yields and livestock productivity fall as heat stress compounds drought.',
      'Cooling demand and utility bills climb fastest in already heat-exposed cities.'
    ],
    timeHorizon: 'acute_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  methane: {
    summary: 'Methane intensifies near-term warming quickly, making heat, crop losses, and ozone-related respiratory harm arrive sooner than CO2 alone would.',
    domains: ['Heat', 'Food', 'Air Quality', 'Livelihoods'],
    affectedPopulations: ['Farm workers', 'Children with asthma', 'Low-income households', 'Heat-exposed regions'],
    primaryPathways: ['Rapid warming', 'Ozone formation', 'Harvest stress', 'Food price pressure'],
    consequences: [
      'Extra warming amplifies dangerous heat seasons within policy and infrastructure timescales.',
      'Methane-driven ozone damages crops and worsens breathing conditions in polluted regions.',
      'Food-price volatility rises when heat and ozone reduce agricultural output together.'
    ],
    timeHorizon: 'near_term',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  deforestation: {
    summary: 'Forest loss removes rainfall buffering, destabilizes water supplies, and undermines food, income, and safety for communities that depend on intact landscapes.',
    domains: ['Water', 'Food', 'Livelihoods', 'Displacement'],
    affectedPopulations: ['Indigenous communities', 'Rainfed farmers', 'Forest-fringe settlements', 'Downstream cities'],
    primaryPathways: ['Rainfall disruption', 'Fire exposure', 'Soil erosion', 'Watershed loss'],
    consequences: [
      'Dry-season fires and smoke raise respiratory illness and destroy homes and assets.',
      'Rainfall becomes less reliable as forest moisture recycling weakens.',
      'Loss of forest income, fuelwood, and flood buffering pushes households into deeper insecurity.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  industry_farming: {
    summary: 'Industrial farming concentrates food output, pollution, labor exposure, and animal disease risk into a single system that can fail expensively for both producers and consumers.',
    domains: ['Food', 'Water', 'Health', 'Livelihoods'],
    affectedPopulations: ['Farm workers', 'Rural households', 'Consumers facing price spikes', 'Communities near runoff zones'],
    primaryPathways: ['Water contamination', 'Labor heat stress', 'Animal disease', 'Input dependence'],
    consequences: [
      'Nutrient runoff contaminates rivers and raises drinking-water treatment burdens.',
      'Workers and livestock face heat stress that cuts productivity and raises mortality risk.',
      'Fertilizer, feed, and disease shocks translate quickly into food-price increases.'
    ],
    timeHorizon: 'seasonal_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  steel: {
    summary: 'Steel underpins buildings, transport, and energy infrastructure, but conventional production concentrates occupational hazards, hazardous air pollutants, and a large climate burden around long-lived industrial facilities.',
    domains: ['Worker Safety', 'Air Quality', 'Climate', 'Industrial Transition'],
    affectedPopulations: ['Steelworkers', 'Communities near integrated mills', 'Construction supply chains', 'Regions dependent on steel employment'],
    primaryPathways: ['Furnace and process hazards', 'Hazardous air emissions', 'Coal-intensive production', 'Capital-stock transition'],
    consequences: [
      'Coke ovens, blast furnaces, foundries, rolling mills, and recycling operations require operation-specific worker protection and exposure control.',
      'Integrated mills emit regulated metal and organic hazardous air pollutants that require source-specific controls.',
      'The cost and timing of replacing long-lived blast-furnace assets shape how workers and industrial regions experience decarbonization.'
    ],
    timeHorizon: 'acute_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1',
    sourceUrls: [
      'https://www.ilo.org/resource/other/safety-and-health-iron-and-steel-industry',
      'https://www.epa.gov/stationary-sources-air-pollution/integrated-iron-and-steel-manufacturing-national-emission',
      'https://www.iea.org/reports/iron-and-steel-technology-roadmap'
    ]
  },
  food: {
    summary: 'Agricultural demand matters to people when food systems overdraw land and water, making diets more expensive and supply chains less resilient to shocks.',
    domains: ['Food', 'Water', 'Affordability', 'Land Pressure'],
    affectedPopulations: ['Low-income households', 'Import-dependent countries', 'Farm regions', 'Children vulnerable to malnutrition'],
    primaryPathways: ['Price transmission', 'Land expansion', 'Water competition', 'Dietary dependence'],
    consequences: [
      'Staple and protein prices rise when demand growth outruns climate-stressed supply.',
      'Cropland and grazing expansion intensify land clearing and water withdrawals.',
      'Import-dependent populations face sharper food-security shocks during harvest failures.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  urbanization: {
    summary: 'Urban expansion can trap people in hotter, flood-prone, and infrastructure-hungry environments when housing, drainage, trees, and transit lag behind population growth.',
    domains: ['Heat', 'Housing', 'Water', 'Infrastructure'],
    affectedPopulations: ['Informal-settlement residents', 'Rent-burdened households', 'Commuters', 'Heat-exposed city neighborhoods'],
    primaryPathways: ['Urban heat island', 'Impervious runoff', 'Service overload', 'Housing pressure'],
    consequences: [
      'Neighborhood heat and flood exposure rise when paving outpaces cooling and drainage.',
      'Water, sanitation, and transport systems are strained by dense growth without resilience upgrades.',
      'Housing costs and displacement pressures increase around rapidly expanding urban cores.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  fast_fashion: {
    summary: 'Fast fashion externalizes water pollution, waste, and labor harm onto communities far from the checkout counter.',
    domains: ['Labor', 'Water', 'Pollution', 'Health'],
    affectedPopulations: ['Garment workers', 'Communities near dyeing plants', 'Waste-picking communities', 'Water-stressed cotton regions'],
    primaryPathways: ['Industrial wastewater', 'Labor exploitation', 'Textile waste', 'Water-intensive supply chains'],
    consequences: [
      'Untreated textile effluent contaminates local rivers used for drinking and irrigation.',
      'Low-wage supply chains concentrate occupational exposure and wage vulnerability.',
      'Disposable clothing volumes overwhelm waste systems and increase toxic burning and dumping.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  migration: {
    summary: 'Climate-linked migration becomes a human crisis when housing, jobs, schools, and health systems in receiving regions cannot absorb displaced people safely.',
    domains: ['Housing', 'Displacement', 'Public Services', 'Conflict Risk'],
    affectedPopulations: ['Displaced households', 'Border communities', 'Informal-settlement residents', 'Children out of school'],
    primaryPathways: ['Loss of habitability', 'Service overload', 'Income disruption', 'Governance stress'],
    consequences: [
      'Families lose stable housing, schooling continuity, and local support networks.',
      'Receiving cities face pressure on clinics, water systems, and affordable housing.',
      'Competition over land, work, and public aid can sharpen local political tensions.'
    ],
    timeHorizon: 'acute_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  resource_depletion: {
    summary: 'Resource depletion hits people when aquifers, soils, and local reserves no longer support drinking water, farming, or stable household incomes.',
    domains: ['Water', 'Food', 'Livelihoods', 'Conflict Risk'],
    affectedPopulations: ['Smallholder farmers', 'Rural households', 'Water-poor towns', 'Pastoral communities'],
    primaryPathways: ['Groundwater decline', 'Topsoil loss', 'Crop failure', 'Allocation conflict'],
    consequences: [
      'Groundwater depletion raises pumping costs and can leave towns with unreliable water access.',
      'Topsoil loss lowers farm productivity and increases dependence on costly inputs.',
      'Competition intensifies between agriculture, cities, and ecosystems as local reserves shrink.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  carbon_emission: {
    summary: 'Carbon emissions matter to people because they load the climate system with long-lived warming that multiplies heat, flood, food, and infrastructure losses across decades.',
    domains: ['Heat', 'Food', 'Water', 'Infrastructure'],
    affectedPopulations: ['Children living through long warming horizons', 'Coastal communities', 'Farm-dependent households', 'Heat-exposed workers'],
    primaryPathways: ['Long-lived warming', 'Sea-level rise', 'Hydrologic disruption', 'Extreme-event amplification'],
    consequences: [
      'Long-term warming locks in more intense heat, wildfire, flood, and sea-level damage.',
      'Public budgets face escalating adaptation and disaster-recovery costs.',
      'Communities with fewer resources pay more for cooling, insurance, relocation, and repairs.'
    ],
    timeHorizon: 'long_term',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  personal_conveyance: {
    summary: 'Private vehicle dependence harms people through air pollution, fuel-cost exposure, unsafe urban design, and high household transport burdens.',
    domains: ['Air Quality', 'Household Costs', 'Health', 'Infrastructure'],
    affectedPopulations: ['Commuters', 'Children near major roads', 'Low-income drivers', 'Urban neighborhoods with poor transit'],
    primaryPathways: ['Tailpipe pollution', 'Fuel-price exposure', 'Road congestion', 'Car-dependent land use'],
    consequences: [
      'Traffic pollution increases asthma, cardiovascular stress, and chronic exposure near roads.',
      'Households become more vulnerable to fuel-price spikes when daily life requires driving.',
      'Car-dependent growth crowds out safer, cooler, and more walkable public space.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  environ_anomalies: {
    summary: 'Extreme weather turns climate risk into visible human loss through damaged homes, interrupted services, food shocks, and emergency displacement.',
    domains: ['Homes', 'Health', 'Food', 'Infrastructure'],
    affectedPopulations: ['Disaster-exposed households', 'Emergency responders', 'Uninsured homeowners', 'Rural communities'],
    primaryPathways: ['Storm damage', 'Wildfire smoke', 'Flooding', 'Harvest disruption'],
    consequences: [
      'Homes, roads, and power systems fail during storms, fires, and flood events.',
      'Acute disasters interrupt schooling, medical care, and local employment.',
      'Repeated shocks reduce insurance access and slow community recovery.'
    ],
    timeHorizon: 'acute',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  el_nino: {
    summary: 'El Nino redistributes rainfall and ocean heat in ways that quickly hit food prices, fisheries, drought risk, and disease exposure across multiple continents.',
    domains: ['Food', 'Water', 'Fisheries', 'Health'],
    affectedPopulations: ['Rainfed farmers', 'Fishing communities', 'Import-dependent households', 'Children in drought regions'],
    primaryPathways: ['Rainfall shifts', 'Drought', 'Marine disruption', 'Disease-favorable conditions'],
    consequences: [
      'Harvests weaken in drought-hit regions while floods damage crops elsewhere.',
      'Fisheries can be disrupted as marine temperatures and nutrient patterns shift.',
      'Food and water insecurity can worsen within a single season of teleconnected extremes.'
    ],
    timeHorizon: 'seasonal',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  la_nina: {
    summary: 'La Nina sharpens drought-flood contrasts, making some regions much drier while others face repeated flood and storm losses in the same season.',
    domains: ['Water', 'Food', 'Flood Risk', 'Infrastructure'],
    affectedPopulations: ['Rainfed farmers', 'Floodplain communities', 'Hydropower-dependent regions', 'Low-income households'],
    primaryPathways: ['Rain belt shifts', 'Drought persistence', 'Flood amplification', 'Storm-track changes'],
    consequences: [
      'Water availability becomes less predictable as rainfall patterns swing harder.',
      'Flood damage rises in exposed basins while drought losses mount elsewhere.',
      'Food production and hydropower reliability can deteriorate in the same La Nina cycle.'
    ],
    timeHorizon: 'seasonal',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  amoc: {
    summary: 'AMOC slowdown matters to people because it can rearrange rainfall, marine productivity, and coastal climate risks over regions that support hundreds of millions of livelihoods.',
    domains: ['Food', 'Water', 'Coastal Risk', 'Energy'],
    affectedPopulations: ['European households', 'West African farmers', 'Atlantic fishing communities', 'Coastal infrastructure managers'],
    primaryPathways: ['Rainfall reorganization', 'Marine productivity shifts', 'Storm-track change', 'Regional cooling-warming contrasts'],
    consequences: [
      'Rainfall shifts can destabilize food and water systems across the North Atlantic region and tropics.',
      'Marine food webs and fisheries may be disrupted as circulation patterns weaken.',
      'Regional climate surprises increase planning risks for energy, agriculture, and coastal protection.'
    ],
    timeHorizon: 'chronic_with_abrupt_risk',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  wet_bulb_heat: {
    summary: 'Wet-bulb heat directly threatens human survivability when humidity is high enough that sweat no longer cools the body effectively.',
    domains: ['Health', 'Labor', 'Power', 'Habitability'],
    affectedPopulations: ['Outdoor workers', 'Older adults', 'People without air conditioning', 'Residents of humid megacities'],
    primaryPathways: ['Heat illness', 'Nighttime non-recovery', 'Labor loss', 'Cooling-system dependence'],
    consequences: [
      'Heat stroke and organ stress can occur after ordinary outdoor exposure during extreme humid heat.',
      'Construction, farm, and delivery work become unsafe for longer parts of the day.',
      'Power failures during humid heat become life-threatening rather than merely uncomfortable.'
    ],
    timeHorizon: 'acute',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  monsoon_volatility: {
    summary: 'Monsoon volatility hits people through failed planting calendars, flood losses, reservoir instability, and food-price shocks across densely populated regions.',
    domains: ['Food', 'Water', 'Infrastructure', 'Livelihoods'],
    affectedPopulations: ['Smallholder farmers', 'Delta cities', 'Hydropower users', 'Low-income food buyers'],
    primaryPathways: ['Delayed onset', 'Break rainfall', 'Flood damage', 'Storage instability'],
    consequences: [
      'Planting and harvest windows become harder to time, increasing farm losses.',
      'Floods and drought breaks can strike the same basin within a single monsoon season.',
      'Reservoir and power management become less reliable as rainfall timing destabilizes.'
    ],
    timeHorizon: 'seasonal',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  permafrost_thaw: {
    summary: 'Permafrost thaw becomes a human problem when ground failure breaks homes, roads, pipelines, and water systems in Arctic settlements while adding more warming pressure.',
    domains: ['Housing', 'Infrastructure', 'Water Quality', 'Food'],
    affectedPopulations: ['Arctic communities', 'Indigenous villages', 'Remote utility operators', 'Subsistence hunters'],
    primaryPathways: ['Ground subsidence', 'Infrastructure fracture', 'Water contamination', 'Landscape instability'],
    consequences: [
      'Buildings, roads, and storage tanks fail as frozen ground softens and collapses.',
      'Damaged sewage and water systems raise contamination risks in remote settlements.',
      'Travel routes and subsistence access become less reliable across thawing landscapes.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  data_centers: {
    summary: 'Data centers affect people when local power, water, and land systems are asked to absorb large continuous loads faster than communities can adapt.',
    domains: ['Grid Reliability', 'Water', 'Household Costs', 'Local Pollution'],
    affectedPopulations: ['Ratepayers', 'Water-stressed communities', 'Neighbors near backup generation', 'Local planners'],
    primaryPathways: ['Peak electricity demand', 'Cooling water withdrawals', 'Backup diesel use', 'Land-use concentration'],
    consequences: [
      'Large new loads can tighten grid margins and raise pressure for costly network upgrades.',
      'Cooling withdrawals can compete with municipal, agricultural, or ecological water needs.',
      'Backup generators and construction traffic can worsen local air and noise burdens.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  ai_data_centers: {
    summary: 'AI data centers matter to people when compute growth drives abrupt spikes in electricity demand, cooling-water competition, and local infrastructure strain.',
    domains: ['Grid Reliability', 'Water', 'Household Costs', 'Infrastructure'],
    affectedPopulations: ['Ratepayers', 'Communities in utility expansion zones', 'Water-stressed municipalities', 'Local workers facing outage risk'],
    primaryPathways: ['Power-demand growth', 'Cooling-water competition', 'Grid congestion', 'Supply-chain concentration'],
    consequences: [
      'Utilities may need fast capacity additions or network upgrades that flow through to customer bills.',
      'Water-intensive cooling can become politically contentious in already stressed basins.',
      'Grid congestion can crowd other local loads and heighten reliability concerns during heat.'
    ],
    timeHorizon: 'near_term',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  semiconductor_fabs: {
    summary: 'Semiconductor fabs affect people when chip production concentrates huge electricity, ultrapure water, chemical, and backup-power demands in industrial corridors with little margin for failure.',
    domains: ['Water', 'Infrastructure', 'Household Costs', 'Local Pollution'],
    affectedPopulations: ['Communities near fabs', 'Ratepayers', 'Industrial workers', 'Water-stressed municipalities'],
    primaryPathways: ['Ultrapure-water demand', 'Process energy use', 'Fluorinated-gas emissions', 'Supply-chain concentration'],
    consequences: [
      'Large fabs can intensify competition for reliable power and high-quality water.',
      'Chemical-intensive production raises local scrutiny around air, wastewater, and safety burdens.',
      'Concentrated chip capacity makes downstream industries more fragile when a few sites are disrupted.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  telecom_backbone: {
    summary: 'Telecom backbone systems matter to people when the infrastructure carrying digital traffic becomes energy-intensive, outage-prone, or too concentrated to fail safely.',
    domains: ['Infrastructure', 'Connectivity', 'Grid Reliability', 'Economic Continuity'],
    affectedPopulations: ['Cities dependent on backbone routes', 'Businesses needing uptime', 'Remote communities', 'Emergency services'],
    primaryPathways: ['Backbone power demand', 'Switching-node concentration', 'Outage fragility', 'Route disruption'],
    consequences: [
      'Failures in core routes or switching systems can disable communications across wide regions.',
      'Growing network capacity still carries a real operational electricity burden.',
      'Connectivity shocks can ripple into commerce, logistics, and emergency coordination.'
    ],
    timeHorizon: 'near_term_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  mobile_wireless_networks: {
    summary: 'Mobile and wireless networks matter when towers, radios, and backhaul systems extend power demand and outage exposure across large, populated geographies.',
    domains: ['Infrastructure', 'Connectivity', 'Resilience', 'Access'],
    affectedPopulations: ['Mobile-first households', 'Rural communities', 'Emergency responders', 'Tower-host communities'],
    primaryPathways: ['Tower electricity demand', 'Backup-power dependence', 'Weather exposure', 'Last-mile reliability'],
    consequences: [
      'Wireless systems can fail quickly when grid outages outlast local backup capacity.',
      'The last mile remains essential for household access even when backbone routes stay up.',
      'Dense network upgrades expand the material and operational footprint of connectivity.'
    ],
    timeHorizon: 'near_term',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  internet_exchange_points: {
    summary: 'Internet exchange points matter because a small number of physical interconnection hubs keep large volumes of traffic flowing between networks, clouds, and carriers.',
    domains: ['Infrastructure', 'Connectivity', 'Resilience', 'Economic Continuity'],
    affectedPopulations: ['Cities with core exchange hubs', 'Domestic hosting markets', 'Telecom operators', 'Businesses needing low-latency service'],
    primaryPathways: ['Interconnection concentration', 'Local outage risk', 'Carrier dependence', 'Physical chokepoints'],
    consequences: [
      'A small number of exchange sites can become outsized chokepoints for regional connectivity.',
      'Domestic hosting and lower-latency traffic depend on reliable interconnection hubs.',
      'Concentrated routing makes resilience planning more important than raw site size alone.'
    ],
    timeHorizon: 'near_term_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  subsea_cables: {
    summary: 'Subsea cables matter when global digital traffic depends on a limited set of undersea routes and landing stations vulnerable to concentrated disruption.',
    domains: ['Infrastructure', 'Connectivity', 'Trade', 'Geopolitical Risk'],
    affectedPopulations: ['Island and coastal economies', 'Financial centers', 'Cloud-dependent businesses', 'International communications systems'],
    primaryPathways: ['Landing-station concentration', 'Route chokepoints', 'Repair dependence', 'Cross-border fragility'],
    consequences: [
      'A small number of damaged routes can create outsized communications and trade disruption.',
      'Repair cycles and route concentration make resilience a geopolitical as well as technical issue.',
      'International digital dependence is more physically fragile than the idea of “the cloud” suggests.'
    ],
    timeHorizon: 'near_term_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  ocean_acidification: {
    summary: 'Ocean acidification hurts people by weakening shell-building marine life, eroding fisheries productivity, and undermining coastal food and income systems.',
    domains: ['Fisheries', 'Food', 'Coastal Livelihoods', 'Nutrition'],
    affectedPopulations: ['Shellfish growers', 'Coastal fishing communities', 'Protein-dependent households', 'Reef-tourism workers'],
    primaryPathways: ['Shell formation stress', 'Food-web disruption', 'Fishery decline', 'Reef degradation'],
    consequences: [
      'Shellfish hatcheries and reef ecosystems become less productive as carbonate chemistry worsens.',
      'Coastal communities dependent on seafood face income and nutrition losses.',
      'Tourism and reef protection value decline as marine ecosystems lose structural resilience.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  nocturnal_heat_stress: {
    summary: 'Nocturnal heat stress is dangerous because people cannot physiologically recover at night when indoor and outdoor temperatures stay too high.',
    domains: ['Health', 'Sleep', 'Labor', 'Power'],
    affectedPopulations: ['Older adults', 'Infants', 'People without cooling', 'Night-shift and next-day outdoor workers'],
    primaryPathways: ['Sleep disruption', 'Nighttime non-recovery', 'Cardiovascular stress', 'Cooling dependence'],
    consequences: [
      'Hot nights raise next-day heat illness risk because the body never fully cools down.',
      'Poor sleep degrades labor productivity, learning, and mental resilience during heat waves.',
      'Nighttime cooling demand rises in households that can least afford it.'
    ],
    timeHorizon: 'acute',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  compound_day_night_heat_extremes: {
    summary: 'Compound day-night heat extremes create continuous heat exposure with little recovery time, pushing mortality and power-system risk beyond typical daytime heat events.',
    domains: ['Health', 'Power', 'Labor', 'Housing'],
    affectedPopulations: ['Older adults', 'Outdoor workers', 'Apartment dwellers without cooling', 'Patients with chronic illness'],
    primaryPathways: ['Continuous heat load', 'Recovery failure', 'Cooling-system stress', 'Indoor overheating'],
    consequences: [
      'Hospitals and emergency services face higher demand when heat exposure continues through the night.',
      'Indoor spaces remain unsafe for people without efficient cooling or insulation.',
      'Extended cooling demand can coincide with higher outage risk during regional heat events.'
    ],
    timeHorizon: 'acute',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  marine_fisheries_collapse: {
    summary: 'Marine fisheries collapse harms people through lost protein, lost income, and destabilized coastal economies that cannot quickly replace marine harvests.',
    domains: ['Food', 'Livelihoods', 'Coastal Stability', 'Prices'],
    affectedPopulations: ['Artisanal fishers', 'Seafood workers', 'Protein-dependent coastal households', 'Port towns'],
    primaryPathways: ['Catch decline', 'Income loss', 'Protein shortage', 'Market disruption'],
    consequences: [
      'Fishing households lose income quickly when stocks crash or move beyond reach.',
      'Seafood prices rise where marine protein is a major part of local diets.',
      'Coastal economies can contract as processing, transport, and trade volumes fall.'
    ],
    timeHorizon: 'seasonal_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  cooling_water_competition: {
    summary: 'Cooling water competition becomes visible to people when power and compute facilities compete with cities, farms, and ecosystems for limited water supplies.',
    domains: ['Water', 'Grid Reliability', 'Municipal Services', 'Agriculture'],
    affectedPopulations: ['Residents in water-stressed basins', 'Farmers downstream of withdrawals', 'Utility customers', 'Local ecosystem stewards'],
    primaryPathways: ['Shared withdrawals', 'Thermal discharge', 'Drought competition', 'Operational curtailment'],
    consequences: [
      'Water conflicts intensify during drought when industrial cooling and public needs overlap.',
      'Facilities may face curtailment or expensive retrofits when intake water runs too warm or scarce.',
      'Municipal trust erodes when local residents perceive industry being prioritized over households.'
    ],
    timeHorizon: 'seasonal_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  vector_borne_disease_expansion: {
    summary: 'Vector-borne disease expansion matters to people when warming and rainfall shifts expand the geography and season length of mosquito- and tick-borne infections.',
    domains: ['Health', 'Work', 'Public Health', 'Children'],
    affectedPopulations: ['Children', 'Outdoor workers', 'Rural clinics', 'Low-capacity health systems'],
    primaryPathways: ['Expanded transmission zones', 'Longer seasons', 'Surveillance gaps', 'Clinical burden'],
    consequences: [
      'Malaria, dengue, and other vector risks can appear in places with limited preparedness.',
      'Health systems face more seasonal surveillance and treatment burden.',
      'Households lose income and schooling time when illness risk becomes more persistent.'
    ],
    timeHorizon: 'seasonal_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  insurance_retreat: {
    summary: 'Insurance retreat turns climate risk into a household balance-sheet crisis when coverage disappears or becomes unaffordable in exposed regions.',
    domains: ['Housing', 'Household Costs', 'Adaptation Inequality', 'Recovery'],
    affectedPopulations: ['Homeowners in high-risk zones', 'Renters facing pass-through costs', 'Small businesses', 'Local tax bases'],
    primaryPathways: ['Premium spikes', 'Coverage withdrawal', 'Mortgage stress', 'Recovery gaps'],
    consequences: [
      'Households can lose insurability before they physically lose their homes.',
      'Mortgage markets tighten when lenders question long-term asset viability.',
      'Recovery becomes more unequal as only wealthier households can self-insure or relocate.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  crop_yield_volatility: {
    summary: 'Crop yield volatility is a direct human issue because it moves quickly from field losses into food prices, farmer debt, and import dependence.',
    domains: ['Food', 'Farmer Income', 'Prices', 'Humanitarian Risk'],
    affectedPopulations: ['Smallholder farmers', 'Low-income consumers', 'Import-dependent countries', 'Food-aid systems'],
    primaryPathways: ['Heat stress', 'Rainfall variability', 'Pest pressure', 'Market shock'],
    consequences: [
      'Farmers face unstable income and higher debt when harvest outcomes swing wildly between seasons.',
      'Food prices rise fastest for households already spending a high share of income on staples.',
      'Governments and aid systems face larger emergency procurement needs after widespread harvest failures.'
    ],
    timeHorizon: 'seasonal',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  energy_affordability_crisis: {
    summary: 'Energy affordability becomes a climate harm when families cannot pay for safe cooling, heating, mobility, or backup during increasingly volatile conditions.',
    domains: ['Household Costs', 'Health', 'Energy Access', 'Economic Stability'],
    affectedPopulations: ['Low-income households', 'Renters', 'Elderly residents', 'Small businesses'],
    primaryPathways: ['Utility bill spikes', 'Cooling poverty', 'Disconnection risk', 'Cost pass-through'],
    consequences: [
      'People underuse cooling or heating even when conditions are medically dangerous.',
      'Bill stress increases shutoff risk and forces tradeoffs with food, rent, and medicine.',
      'Businesses and public services face higher operating costs during already difficult climate conditions.'
    ],
    timeHorizon: 'near_term_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  utility_disconnection_risk: {
    summary: 'Utility disconnection risk is where energy affordability becomes an immediate service failure rather than just a budget stress.',
    domains: ['Electricity Access', 'Health', 'Household Stability', 'Recovery'],
    affectedPopulations: ['Low-income households', 'Medically vulnerable residents', 'Renters', 'Small businesses'],
    primaryPathways: ['Bill arrears', 'Shutoff notices', 'Cooling loss', 'Unsafe indoor conditions'],
    consequences: [
      'Households can lose access to cooling, refrigeration, communications, or medical equipment during dangerous weather.',
      'Payment stress becomes a direct health and safety risk when utilities disconnect service during extreme heat or cold.',
      'Public systems absorb higher emergency and recovery burdens when routine affordability turns into service interruption.'
    ],
    timeHorizon: 'acute_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  thermal_stratification_intensification: {
    summary: 'Stronger thermal layering in coastal waters can quietly reduce oxygen renewal, weaken nursery habitat, and make fisheries and shellfish safety less reliable.',
    domains: ['Food', 'Livelihoods', 'Coastal Health', 'Water Quality'],
    affectedPopulations: ['Artisanal fishers', 'Shellfish harvesters', 'Coastal households', 'Nearshore tourism and seafood workers'],
    primaryPathways: ['Oxygen stress', 'Nursery degradation', 'Habitat compression', 'Food-web instability'],
    consequences: [
      'Low-mixing coastal waters raise the odds of hypoxia, bloom conditions, and abrupt habitat quality loss.',
      'Juvenile fish and shellfish habitat becomes less reliable when warm layered water narrows oxygenated zones.',
      'Coastal livelihoods feel the damage through less predictable catch, closures, and seafood-quality risk.'
    ],
    timeHorizon: 'seasonal_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  delta_salt_intrusion_fronts: {
    summary: 'Salt fronts moving inland turn sea-level rise and low-flow conditions into a direct household and utility water problem long before retreat becomes the headline.',
    domains: ['Water', 'Affordability', 'Infrastructure', 'Food'],
    affectedPopulations: ['Delta households', 'Coastal utilities', 'Irrigated farmers', 'Low-income communities on shallow supplies'],
    primaryPathways: ['Salinity intrusion', 'Intake stress', 'Groundwater degradation', 'Crop-water loss'],
    consequences: [
      'Utilities face salinity spikes that make treatment, blending, and intake switching more expensive.',
      'Farmers lose reliable freshwater for irrigation as estuarine salinity penetrates farther inland.',
      'Households on shallow wells or local intakes experience water that becomes brackish before it becomes unavailable.'
    ],
    timeHorizon: 'seasonal_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  oceanic_upwelling_disruptions: {
    summary: 'Upwelling disruption matters to people when nutrient-rich coastal waters stop arriving on time, making catches, incomes, and local protein supply less dependable.',
    domains: ['Food', 'Livelihoods', 'Prices', 'Coastal Economies'],
    affectedPopulations: ['Small-scale fishers', 'Processing workers', 'Protein-dependent coastal consumers', 'Port towns tied to seasonal catch'],
    primaryPathways: ['Nutrient delivery loss', 'Productivity decline', 'Landing volatility', 'Income instability'],
    consequences: [
      'Primary productivity weakens when nutrient-bearing waters fail to surface reliably.',
      'Landing volumes and timing become harder to predict in fisheries tied to seasonal upwelling pulses.',
      'Communities that depend on short, intense harvest windows face sharper income and food-security shocks.'
    ],
    timeHorizon: 'seasonal_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  estuarine_nursery_loss: {
    summary: 'When estuarine nursery habitat degrades, the human effect shows up later as weaker recruitment, less stable coastal catch, and a quieter erosion of food and income security.',
    domains: ['Food', 'Livelihoods', 'Coastal Economies', 'Biodiversity Dependence'],
    affectedPopulations: ['Juvenile-fish dependent fisheries', 'Small-port communities', 'Seafood processors', 'Protein-dependent coastal households'],
    primaryPathways: ['Juvenile habitat loss', 'Recruitment failure', 'Landing instability', 'Income decline'],
    consequences: [
      'Fishery declines can appear with a delay because the failure begins in juvenile habitat rather than visible adult mortality.',
      'Coastal communities lose future catch stability when estuarine spawning and nursery functions erode.',
      'Protein and income insecurity rise when fewer juveniles survive into harvestable stocks.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  freshwater_lens_compression: {
    summary: 'Thin coastal freshwater reserves become a human crisis when shallow groundwater turns brackish, forcing households and utilities toward more expensive and fragile water supply options.',
    domains: ['Water', 'Affordability', 'Health', 'Infrastructure'],
    affectedPopulations: ['Small-island households', 'Shallow-well users', 'Coastal farmers', 'Utilities serving saline-prone communities'],
    primaryPathways: ['Groundwater salinization', 'Supply unreliability', 'Treatment burden', 'Desalination dependence'],
    consequences: [
      'Water that still exists physically can become too saline or unreliable to use without expensive treatment.',
      'Utilities and households spend more on storage, imported water, or desalination when shallow lenses fail.',
      'Agriculture and daily water access become more fragile where communities depend on thin freshwater bodies.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  drinking_water_treatment_stress: {
    summary: 'Drinking-water treatment stress is where climate and contamination risks become operational: the water is still there, but it gets harder, costlier, and less reliable to make safe.',
    domains: ['Water', 'Public Health', 'Infrastructure', 'Affordability'],
    affectedPopulations: ['Utility customers', 'Low-income households', 'Small water systems', 'Communities downstream of contamination pulses'],
    primaryPathways: ['Salinity spikes', 'Turbidity', 'Contamination loads', 'Operational overload'],
    consequences: [
      'Utilities face rising treatment costs, intake complexity, and greater failure risk during shocks.',
      'Households feel the burden through higher rates, boil notices, or degraded service reliability.',
      'Small and underfunded systems are hit first when source water becomes more saline, dirty, or variable.'
    ],
    timeHorizon: 'acute_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  coastal_aquifer_degradation: {
    summary: 'Coastal aquifer degradation turns hidden groundwater salinity into a daily risk for wells, utilities, and farms that appear secure until the water becomes too poor to use.',
    domains: ['Water', 'Food', 'Infrastructure', 'Affordability'],
    affectedPopulations: ['Groundwater-dependent coastal towns', 'Shallow-well users', 'Irrigated farmers', 'Utilities with limited backup supplies'],
    primaryPathways: ['Salinization', 'Overdraw', 'Treatment burden', 'Supply substitution'],
    consequences: [
      'Brackish groundwater reduces the reliability of local wells before a full supply failure is visible.',
      'Utilities and farms lose flexibility when aquifers can no longer provide usable freshwater at prior quality.',
      'Water systems become more dependent on imported water or desalination when aquifer quality keeps degrading.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  },
  fish_landing_supply_disruption: {
    summary: 'Fish landing disruption is how marine ecological stress becomes visible to people: boats return with less, later, or in the wrong mix for local food and income systems.',
    domains: ['Food', 'Livelihoods', 'Prices', 'Infrastructure'],
    affectedPopulations: ['Small-scale fishing households', 'Seafood processors', 'Market buyers', 'Protein-dependent coastal communities'],
    primaryPathways: ['Catch volatility', 'Access shifts', 'Spoilage risk', 'Protein exposure'],
    consequences: [
      'Landing volatility breaks the link between marine productivity and dependable local food supply.',
      'Processing, cold-chain, and market systems become less efficient when catch timing and composition swing unpredictably.',
      'Income and protein security weaken together where local diets depend heavily on fish landings.'
    ],
    timeHorizon: 'seasonal_and_chronic',
    confidence: 'curated',
    basis: 'curated_anchor_v1'
  }
};

const PLANET_IMPACT_PROFILES = {
  temp: {
    summary: 'Global temperature rise destabilizes multiple Earth systems at once, accelerating ice loss, ocean heat stress, biodiversity decline, and hydrologic disruption.',
    domains: ['Atmosphere', 'Cryosphere', 'Biodiversity', 'Freshwater'],
    affectedSystems: ['Glaciers and ice sheets', 'Coral reefs', 'Heat-sensitive species ranges', 'Mountain snowpack'],
    primaryPathways: ['Background warming', 'Thermal stress', 'Hydrologic intensification', 'Ice-albedo loss'],
    consequences: [
      'Heat stress pushes species beyond historical thermal niches and compresses viable habitat.',
      'Snow, glacier, and sea-ice loss alter reflectivity and freshwater timing across regions.',
      'Ocean and land systems both experience more frequent threshold-like stress events.'
    ],
    timeHorizon: 'acute_and_chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  methane: {
    summary: 'Methane accelerates near-term planetary heating, amplifying ozone damage, feedback risk, and ecosystem stress on timescales short enough to outrun slow adaptation.',
    domains: ['Atmosphere', 'Vegetation', 'Climate Feedbacks', 'Air Chemistry'],
    affectedSystems: ['Tropospheric ozone chemistry', 'Heat-stressed crops', 'Wetland-climate feedbacks', 'Polar cryosphere'],
    primaryPathways: ['Rapid forcing', 'Ozone formation', 'Heat amplification', 'Feedback acceleration'],
    consequences: [
      'Fast warming raises the chance of crossing ecological thresholds before recovery buffers can respond.',
      'Ozone damages plant tissue and suppresses photosynthesis in crops and wild vegetation.',
      'Methane growth compounds cryosphere and permafrost feedback risks.'
    ],
    timeHorizon: 'near_term',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  deforestation: {
    summary: 'Deforestation fragments habitat, weakens carbon sinks, alters rainfall recycling, and reduces whole-biome resilience.',
    domains: ['Biodiversity', 'Forests', 'Rainfall Systems', 'Carbon Sinks'],
    affectedSystems: ['Tropical forests', 'Watershed forests', 'Pollinator networks', 'Fire-sensitive biomes'],
    primaryPathways: ['Habitat fragmentation', 'Moisture recycling loss', 'Carbon release', 'Fire exposure'],
    consequences: [
      'Species lose connected habitat and face rising extinction risk as landscapes are fragmented.',
      'Forest-rainfall feedbacks weaken, making dry seasons longer and ecosystems more fire-prone.',
      'Carbon sink capacity declines as mature canopy is replaced by degraded or cleared land.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  industry_farming: {
    summary: 'Industrial farming drives nutrient overload, soil degradation, biodiversity simplification, and freshwater ecosystem stress.',
    domains: ['Soils', 'Freshwater', 'Biodiversity', 'Biogeochemical Cycles'],
    affectedSystems: ['Topsoil', 'Rivers and lakes', 'Pollinator communities', 'Nitrogen and phosphorus cycles'],
    primaryPathways: ['Runoff', 'Monoculture pressure', 'Soil depletion', 'Habitat simplification'],
    consequences: [
      'Nutrient runoff fuels algal blooms and oxygen depletion in downstream waters.',
      'Monoculture landscapes reduce pollinator diversity and ecological redundancy.',
      'Repeated extraction lowers soil organic matter and long-term land resilience.'
    ],
    timeHorizon: 'seasonal_and_chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  steel: {
    summary: 'Conventional steel production links coal-intensive iron reduction, high-temperature energy demand, mining inputs, and process emissions to a large global industrial footprint.',
    domains: ['Atmosphere', 'Energy', 'Material Cycles', 'Extraction'],
    affectedSystems: ['Global carbon budget', 'Electricity and hydrogen systems', 'Iron-ore and coal supply chains', 'Scrap and recycling systems'],
    primaryPathways: ['Fuel combustion', 'Reductant carbon', 'Primary-material demand', 'Long-lived plant lock-in'],
    consequences: [
      'Steel contributes several gigatonnes of greenhouse-gas emissions annually, with totals depending on the accounting boundary.',
      'Blast-furnace production locks coal-intensive process routes into multi-decade investment cycles.',
      'Scrap-based electric furnaces reduce energy demand, but scrap availability and quality constrain how far secondary production can substitute for primary steel.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1',
    sourceUrls: [
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/',
      'https://www.iea.org/reports/iron-and-steel-technology-roadmap'
    ]
  },
  resource_depletion: {
    summary: 'Resource depletion weakens the ecological carrying capacity of land and water systems by exhausting the physical stocks they depend on.',
    domains: ['Freshwater', 'Soils', 'Land Resilience', 'Ecosystem Stability'],
    affectedSystems: ['Aquifers', 'Arable soils', 'Dryland ecosystems', 'River basins'],
    primaryPathways: ['Overdraw', 'Erosion', 'Salinization', 'Ecological allocation stress'],
    consequences: [
      'Aquifer depletion reduces environmental flows and destabilizes freshwater ecosystems.',
      'Soil exhaustion lowers biological productivity and makes landscapes less drought-resilient.',
      'Overdrawn resource systems recover more slowly from climate shocks.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  carbon_emission: {
    summary: 'Carbon emissions are the core long-lived forcing that raises baseline planetary heat and shifts multiple Earth systems toward persistent destabilization.',
    domains: ['Atmosphere', 'Oceans', 'Cryosphere', 'Earth-System Resilience'],
    affectedSystems: ['Global heat budget', 'Ocean heat content', 'Ice sheets', 'Carbon sinks'],
    primaryPathways: ['Long-lived forcing', 'Heat accumulation', 'Ocean uptake', 'Feedback activation'],
    consequences: [
      'Persistent CO2 loading commits the planet to longer-lived warming and slower recovery.',
      'Ocean heat and carbon uptake intensify marine stress and acidification pressure.',
      'Cryosphere loss and sink weakening reinforce additional Earth-system instability.'
    ],
    timeHorizon: 'long_term',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  environ_anomalies: {
    summary: 'Extreme anomalies reshape ecosystems through repeated disturbance, forcing species turnover and degrading habitat structure.',
    domains: ['Disturbance Regimes', 'Biodiversity', 'Forests', 'Freshwater'],
    affectedSystems: ['Wildfire-prone landscapes', 'Floodplains', 'Coastal ecosystems', 'Coral and kelp systems'],
    primaryPathways: ['Fire', 'Flooding', 'Heat extremes', 'Storm disturbance'],
    consequences: [
      'Repeated disturbance can prevent ecosystems from returning to prior stable states.',
      'Species composition shifts as heat, fire, and flood-tolerant organisms replace others.',
      'Habitat complexity declines when storms, fires, or bleaching events recur too frequently.'
    ],
    timeHorizon: 'acute_and_chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  el_nino: {
    summary: 'El Nino reorganizes ocean-atmosphere coupling, disrupting marine productivity, rainfall regimes, and ecosystem timing across continents.',
    domains: ['Oceans', 'Rainfall Systems', 'Marine Food Webs', 'Disturbance Regimes'],
    affectedSystems: ['Eastern Pacific upwelling', 'Coral reefs', 'Tropical rainfall belts', 'Drought-sensitive forests'],
    primaryPathways: ['Sea-surface warming', 'Upwelling suppression', 'Teleconnected rainfall shifts', 'Thermal marine stress'],
    consequences: [
      'Weakened upwelling reduces nutrient delivery and marine productivity.',
      'Coral bleaching risk rises as surface waters remain unusually warm.',
      'Teleconnected drought and flood stress ripple through terrestrial ecosystems.'
    ],
    timeHorizon: 'seasonal',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  la_nina: {
    summary: 'La Nina intensifies drought-flood contrasts and reorganizes ocean and rainfall conditions that many ecosystems depend on seasonally.',
    domains: ['Rainfall Systems', 'Freshwater', 'Marine Variability', 'Disturbance Regimes'],
    affectedSystems: ['Monsoon systems', 'Floodplain ecosystems', 'Drought-sensitive forests', 'Pacific marine zones'],
    primaryPathways: ['Rain-belt shifts', 'Hydrologic swings', 'Storm-track changes', 'Ocean productivity shifts'],
    consequences: [
      'Hydrologic extremes stress both flood-adapted and drought-sensitive ecosystems.',
      'Seasonal productivity and breeding cycles are disrupted when rainfall timing shifts abruptly.',
      'Fire and flood disturbance regimes can intensify in different regions simultaneously.'
    ],
    timeHorizon: 'seasonal',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  amoc: {
    summary: 'AMOC slowdown threatens large-scale ocean and climate regulation by shifting heat transport, rainfall patterns, and marine ecosystem structure.',
    domains: ['Ocean Circulation', 'Marine Food Webs', 'Rainfall Systems', 'Climate Stability'],
    affectedSystems: ['North Atlantic circulation', 'European rainfall regimes', 'Atlantic fisheries', 'Tropical precipitation belts'],
    primaryPathways: ['Circulation weakening', 'Heat redistribution', 'Rainfall reorganization', 'Marine habitat shift'],
    consequences: [
      'Marine ecosystems can reorganize as nutrient, temperature, and current patterns change.',
      'Regional rainfall stability weakens as ocean circulation no longer distributes heat the same way.',
      'Abrupt-shift risk rises when a core planetary circulation system loses resilience.'
    ],
    timeHorizon: 'chronic_with_abrupt_risk',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  permafrost_thaw: {
    summary: 'Permafrost thaw destabilizes Arctic landscapes and releases stored carbon, weakening one of the planet’s largest long-term frozen reservoirs.',
    domains: ['Cryosphere', 'Carbon Feedbacks', 'Freshwater', 'Arctic Landscapes'],
    affectedSystems: ['Permafrost soils', 'Thermokarst terrain', 'Arctic wetlands', 'Boreal infrastructure corridors'],
    primaryPathways: ['Ground thaw', 'Carbon release', 'Landscape collapse', 'Hydrologic re-routing'],
    consequences: [
      'Stored carbon becomes more vulnerable to release as soils thaw and decompose.',
      'Arctic landforms collapse into thermokarst, altering drainage and habitat structure.',
      'Thaw weakens the cryosphere’s role as a long-term climate stabilizer.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  data_centers: {
    summary: 'Data centers affect the planet indirectly through electricity demand, cooling-water pressure, land concentration, and slower decarbonization of local grids.',
    domains: ['Energy Systems', 'Freshwater', 'Land Use', 'Indirect Emissions'],
    affectedSystems: ['Regional grids', 'Cooling-water basins', 'Industrial land corridors', 'Backup generation footprints'],
    primaryPathways: ['Electric load growth', 'Water withdrawals', 'Land concentration', 'Fossil fallback'],
    consequences: [
      'Large continuous loads can prolong fossil generation or peaker dependence in stressed grids.',
      'Cooling needs increase competition for water in already constrained basins.',
      'Concentrated industrial buildout adds localized land and infrastructure pressure.'
    ],
    timeHorizon: 'near_term_and_chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  ai_data_centers: {
    summary: 'AI data centers raise planetary strain when rapid compute growth drives power expansion, water stress, and slower energy-system decarbonization.',
    domains: ['Energy Systems', 'Freshwater', 'Supply Chains', 'Indirect Emissions'],
    affectedSystems: ['Regional power mixes', 'Water-stressed basins', 'Semiconductor supply chains', 'Mineral-intensive infrastructure'],
    primaryPathways: ['Compute-driven load growth', 'Cooling demand', 'Infrastructure lock-in', 'Supply-chain footprint'],
    consequences: [
      'Rapid power demand growth can lock in higher-emitting generation where clean buildout lags.',
      'Water-intensive cooling extends stress on ecosystems and competing withdrawals.',
      'Hardware scaling expands upstream material and manufacturing footprint.'
    ],
    timeHorizon: 'near_term_and_chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  semiconductor_fabs: {
    summary: 'Semiconductor fabs stress the planet through heavy electricity and water use, process-gas emissions, chemical intensity, and concentrated industrial buildout.',
    domains: ['Energy Systems', 'Freshwater', 'Industrial Emissions', 'Supply Chains'],
    affectedSystems: ['Industrial grids', 'Water-stressed basins', 'Advanced manufacturing clusters', 'Chip supply chains'],
    primaryPathways: ['Process energy demand', 'Ultrapure-water use', 'Fluorinated-gas emissions', 'Chemical throughput'],
    consequences: [
      'Chip production raises water and energy dependence in already concentrated industrial regions.',
      'Fluorinated gases and specialty chemicals add climate and local pollution burdens beyond normal grid use.',
      'A small number of fabs anchor large shares of global advanced-chip supply.'
    ],
    timeHorizon: 'near_term_and_chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  telecom_backbone: {
    summary: 'Telecom backbone systems raise planetary strain through distributed electricity demand, infrastructure concentration, and dependence on fragile switching and transport routes.',
    domains: ['Energy Systems', 'Infrastructure', 'Resilience', 'Connectivity'],
    affectedSystems: ['Transmission corridors', 'Backbone nodes', 'National network routes', 'Core switching systems'],
    primaryPathways: ['Operational electricity use', 'Route concentration', 'Outage risk', 'Critical-node dependence'],
    consequences: [
      'Backbone outages can cascade across large geographies even when local access infrastructure remains intact.',
      'Growing digital traffic still depends on a material physical network with real power and maintenance needs.',
      'Core transmission and switching points can become systemic weak spots.'
    ],
    timeHorizon: 'chronic_with_acute_failures',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  mobile_wireless_networks: {
    summary: 'Wireless access networks extend the physical footprint of digital systems across landscapes through towers, radios, backhaul, and backup power dependence.',
    domains: ['Infrastructure', 'Energy Systems', 'Resilience', 'Land Use'],
    affectedSystems: ['Tower networks', 'Radio access systems', 'Distributed backup power', 'Last-mile connectivity'],
    primaryPathways: ['Distributed power demand', 'Hardware density', 'Weather exposure', 'Access-network fragility'],
    consequences: [
      'Distributed towers increase the material and operational burden of connectivity at scale.',
      'Outage-prone access networks can sever communication even when core routes stay available.',
      'Network densification expands physical equipment across already contested landscapes.'
    ],
    timeHorizon: 'near_term_and_chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  internet_exchange_points: {
    summary: 'Internet exchange points concentrate routing power into a small number of physical hubs, making digital continuity more dependent on local resilience than the internet’s abstract image suggests.',
    domains: ['Infrastructure', 'Resilience', 'Connectivity', 'Urban Systems'],
    affectedSystems: ['Core exchange hubs', 'Carrier hotels', 'Urban network districts', 'Domestic hosting systems'],
    primaryPathways: ['Interconnection concentration', 'Site failure risk', 'Routing chokepoints', 'Urban infrastructure dependence'],
    consequences: [
      'A few facilities can become disproportionately important to national or regional connectivity.',
      'Interconnection hubs depend on resilient local power, cooling, and building systems.',
      'Connectivity resilience is often more centralized than users realize.'
    ],
    timeHorizon: 'near_term',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  subsea_cables: {
    summary: 'Subsea cables create a global digital backbone whose environmental and systemic importance comes less from everyday emissions than from concentration, repair dependence, and geopolitical chokepoints.',
    domains: ['Oceans', 'Infrastructure', 'Geopolitical Risk', 'Connectivity'],
    affectedSystems: ['Cable routes', 'Landing stations', 'Cross-border communications', 'Ocean-linked digital trade'],
    primaryPathways: ['Route concentration', 'Landing-station dependence', 'Repair bottlenecks', 'Cross-border fragility'],
    consequences: [
      'A limited number of routes and landing points can carry outsized global communications dependence.',
      'Cable disruptions can spill quickly into finance, trade, and cloud-dependent operations.',
      'The digital economy inherits real physical chokepoints across ocean geographies.'
    ],
    timeHorizon: 'near_term_and_chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  ocean_acidification: {
    summary: 'Ocean acidification undermines marine calcifiers, weakens reef structure, and propagates stress through ocean food webs.',
    domains: ['Oceans', 'Marine Food Webs', 'Biodiversity', 'Reef Integrity'],
    affectedSystems: ['Coral reefs', 'Shell-forming plankton', 'Shellfish systems', 'Coastal marine food webs'],
    primaryPathways: ['Carbonate chemistry shift', 'Calcification stress', 'Food-web disruption', 'Habitat weakening'],
    consequences: [
      'Shell-building organisms face greater energetic stress and reduced growth or survival.',
      'Reef ecosystems lose structural resilience as acidification compounds thermal stress.',
      'Marine food webs can simplify as foundational calcifiers weaken.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  oceanic_deoxygenation: {
    summary: 'Ocean deoxygenation strips dissolved oxygen from marine waters, compressing habitat and weakening ocean productivity.',
    domains: ['Oceans', 'Marine Habitat', 'Biogeochemistry', 'Food Webs'],
    affectedSystems: ['Midwater oxygen minimum zones', 'Coastal marine habitats', 'Fish migration corridors', 'Nutrient cycles'],
    primaryPathways: ['Oxygen loss', 'Thermal stratification', 'Habitat compression', 'Species redistribution'],
    consequences: [
      'Low-oxygen waters shrink viable habitat for fish and invertebrates.',
      'Stratified warming reduces mixing and reinforces further oxygen stress.',
      'Marine species are pushed into narrower bands of survivable water.'
    ],
    timeHorizon: 'chronic',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  },
  monsoon_volatility: {
    summary: 'Monsoon volatility destabilizes the seasonal freshwater pulse that many terrestrial ecosystems rely on for reproduction, growth, and recovery.',
    domains: ['Freshwater', 'Rainfall Systems', 'Soils', 'Ecosystem Timing'],
    affectedSystems: ['River basins', 'Seasonal wetlands', 'Monsoon-fed cropland mosaics', 'Delta ecosystems'],
    primaryPathways: ['Erratic onset', 'Rainfall breaks', 'Flood-drought cycling', 'Soil saturation swings'],
    consequences: [
      'Ecosystems adapted to predictable wet-dry timing lose seasonal stability.',
      'Flood and drought swings erode soils and freshwater habitat quality.',
      'Wetland and riverine productivity becomes more erratic as seasonal pulses destabilize.'
    ],
    timeHorizon: 'seasonal',
    confidence: 'curated',
    basis: 'curated_planet_v1'
  }
};

const ECONOMIC_CONTEXT_PROFILES =  {
  temp: {
    hiddenCost: 'Each increment of global warming increases losses and damages across health, food, water, infrastructure, and ecosystems; those costs are not contained in the price of the emissions that cause them.',
    whoPays: 'People and regions with the least adaptive capacity, including low-income communities and climate-sensitive livelihoods, experience disproportionate losses despite contributing less to cumulative emissions.',
    physicalLimit: 'There is no single global economic cliff at one temperature. The physical constraint is a finite cumulative carbon budget: stabilizing human-caused warming requires net-zero anthropogenic carbon dioxide emissions.',
    defaultDriver: 'Continued net greenhouse-gas emissions from fossil energy, land-use change, infrastructure lock-in, and delayed investment keep adding warming and future adaptation costs.',
    systemLevers: [
      'Cutting greenhouse-gas emissions rapidly across energy, land, transport, buildings, and industry.',
      'Reaching net-zero carbon dioxide while reducing non-CO2 forcing to stabilize warming.',
      'Directing adaptation finance and resilient infrastructure toward populations with the highest exposure and lowest adaptive capacity.'
    ],
    sourceUrls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/',
      'https://www.ipcc.ch/report/ar6/syr/'
    ],
    evidenceBoundary: 'Global assessment. Do not interpret a named temperature threshold as a universal point of irreversible economic collapse.',
    verdict: 'unique'
  },
  carbon_emission: {
    hiddenCost: 'Carbon dioxide from fossil fuel use and industrial processes accumulates in the atmosphere and creates climate damages that are largely outside the transaction price of the emitting activity.',
    whoPays: 'Climate-exposed households, workers, public budgets, and future generations bear damages and adaptation costs unevenly across regions and income groups.',
    physicalLimit: 'Cumulative carbon dioxide emissions and warming are approximately proportional over relevant policy ranges, so a chosen warming limit implies a finite remaining carbon budget.',
    defaultDriver: 'Fossil infrastructure, production and consumption subsidies, and investment lock-in sustain emissions even where lower-emission technologies are available.',
    systemLevers: [
      'Replacing unabated fossil energy with low-emission electricity and fuels while improving efficiency and reducing avoidable demand.',
      'Ending investment patterns and subsidies that extend unabated fossil infrastructure beyond climate-compatible lifetimes.',
      'Using standards, carbon pricing, public investment, and just-transition policy as a coordinated portfolio rather than a single instrument.'
    ],
    sourceUrls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/technical-summary/',
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-6/'
    ],
    evidenceBoundary: 'Global cumulative-emissions framing. Marginal damages and feasible policy mixes vary by gas, sector, geography, time, and discounting assumptions.',
    verdict: 'unique'
  },
  deforestation: {
    hiddenCost: 'Forest conversion removes biodiversity, carbon storage, water regulation, and livelihood services whose losses are only partly reflected in agricultural, timber, mining, or infrastructure revenues.',
    whoPays: 'Indigenous Peoples, forest-dependent communities, downstream water users, and climate-exposed populations bear losses in livelihoods, cultural systems, water regulation, and resilience.',
    physicalLimit: 'There is no universal hectare threshold for forest-system collapse. Recovery depends on biome, fragmentation, fire, soil condition, climate, and whether ecological connectivity and regeneration capacity remain.',
    defaultDriver: 'Agricultural expansion is the dominant global direct driver, interacting with commodity demand, infrastructure, mining, weak land governance, insecure tenure, and enforcement gaps.',
    systemLevers: [
      'Decoupling agricultural commodity production from forest conversion through traceable supply chains and enforceable land-use rules.',
      'Securing Indigenous and community land rights and strengthening monitoring and enforcement where conversion pressure is high.',
      'Protecting intact forests while restoring degraded land without treating plantations as equivalent to natural forest ecosystems.'
    ],
    sourceUrls: [
      'https://www.fao.org/sustainable-forest-management-toolbox/modules/reducing-deforestation/en',
      'https://www.fao.org/interactive/state-of-forests/2020/en/',
      'https://www.fao.org/newsroom/detail/cop26-agricultural-expansion-drives-almost-90-percent-of-global-deforestation/'
    ],
    evidenceBoundary: 'Global driver synthesis. Driver shares and effective interventions vary substantially by region, forest type, tenure, and commodity.',
    verdict: 'unique'
  },
  industry_farming: {
    hiddenCost: 'Greenhouse-gas and nitrogen emissions, land-use change, water withdrawals, pollution, unhealthy diets, and social vulnerability create agrifood-system costs that market food prices do not fully represent.',
    whoPays: 'Farm workers, small producers, low-income consumers, downstream water users, and low-income countries carry disproportionate health, livelihood, pollution, and price-shock burdens.',
    physicalLimit: 'There is no single global intensity threshold. Production is constrained by locally finite soil, freshwater, nutrient-loading, biodiversity, and heat limits, with strong crop and regional variation.',
    defaultDriver: 'Input subsidies, procurement and commodity incentives, concentrated supply chains, dietary demand, and prices that omit environmental and health costs reward throughput over resilience.',
    systemLevers: [
      'Reducing nitrous oxide from fertilizer, methane from livestock and rice, and carbon losses from soils with measured, place-specific management.',
      'Reforming support and procurement so soil, water, health, and biodiversity outcomes affect production incentives.',
      'Reducing food loss and waste and shifting demand where doing so lowers land, water, and emissions pressure without worsening nutrition or livelihoods.'
    ],
    sourceUrls: [
      'https://www.fao.org/agrifood-economics/publications/detail/en/c/1661522/',
      'https://www.ipcc.ch/srccl/chapter/chapter-5/'
    ],
    evidenceBoundary: 'Agrifood-system evidence, not a claim that all farms or production systems have the same impacts or mitigation potential.',
    verdict: 'unique'
  },
  steel: {
    hiddenCost: 'Conventional steel prices do not fully represent climate damages, hazardous emissions, or the transition risk embedded in long-lived coal-based production assets.',
    whoPays: 'Steelworkers and nearby communities face production hazards and air pollution, while industrial regions, consumers, and public budgets share the cost of replacing or retrofitting high-emission capacity.',
    physicalLimit: 'Steel has no universal thermodynamic emissions floor across all routes. The binding constraints differ by route and include scrap quantity and quality, low-emission electricity and hydrogen, carbon storage, ore quality, and plant investment cycles.',
    defaultDriver: 'Young blast-furnace fleets, long relining cycles, sunk capital, coal-based reduction, and weak demand for near-zero-emission steel reinforce incumbent production routes.',
    systemLevers: [
      'Increasing material efficiency, reuse, high-quality scrap recovery, and electric-arc-furnace production where system boundaries support real reductions.',
      'Scaling hydrogen direct-reduced iron, low-emission electricity, and other near-zero primary-steel routes with the infrastructure they require.',
      'Creating credible demand for near-zero-emission steel through standards, procurement, product definitions, and investment timed to plant replacement cycles.'
    ],
    sourceUrls: [
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/',
      'https://www.iea.org/reports/iron-and-steel-technology-roadmap',
      'https://www.ilo.org/resource/other/safety-and-health-iron-and-steel-industry',
      'https://www.epa.gov/stationary-sources-air-pollution/integrated-iron-and-steel-manufacturing-national-emission'
    ],
    evidenceBoundary: 'Global sector framing. Emissions intensity, health burden, feasible technology, and transition cost depend on production route, energy source, asset age, regulation, and region.',
    verdict: 'unique'
  },
  amoc: {
    hiddenCost: "A slowdown in ocean currents causes unpredictable shifts in global rainfall patterns, devaluing farmland over decades.",
    whoPays: "Small farmers reliant on seasonal rains and national disaster response agencies bear the rising costs.",
    physicalLimit: "Crossing a warming threshold of 1.5°C can trigger permanent changes in ocean circulation.",
    defaultDriver: "Macroeconomic models and supply chains assume a stable climate, ignoring non-linear ocean tipping points.",
    systemLevers: [
      "Integrating non-linear tipping risk into sovereign debt and real estate pricing models.",
      "Deploying adaptive agricultural irrigation systems in areas vulnerable to rainfall shifts.",
      "Developing regional food and economic buffer funds to hedge against sudden crop volatility."
    ]
  },
  wet_bulb_heat: {
    hiddenCost: "Extreme humid heat limits human labor capacity and drives chronic kidney damage that rarely gets recorded in official heatwave deaths.",
    whoPays: "Outdoor workers, manual laborers, and families without access to cooling pay with their health and lives.",
    physicalLimit: "At a wet-bulb temperature of 31°C, the human body can no longer shed heat, risking fatal organ failure.",
    defaultDriver: "Obsolete building codes and unequal urban shade lock in high exposure for low-income neighborhoods.",
    systemLevers: [
      "Enacting mandatory, legally enforceable rest-and-cooling breaks for outdoor workers.",
      "Providing public subsidies for energy-efficient heat pumps and cooling access in vulnerable homes.",
      "Redesigning urban corridors with high-albedo materials and dense tree canopies to lower local temperatures."
    ]
  },
  permafrost_thaw: {
    hiddenCost: "Thawing permafrost releases massive amounts of unbudgeted carbon, taking up to 40% of the remaining global carbon budget.",
    whoPays: "Arctic towns face crumbling infrastructure, while the global public pays for the cost of extra carbon removal.",
    physicalLimit: "Ground temperature rising above 0°C triggers ice melting, leading to soil collapse and the release of ancient stored carbon.",
    defaultDriver: "Standard climate policies omit permafrost thaw emissions from carbon accounting, delaying adaptation funding.",
    systemLevers: [
      "Integrating permafrost feedback emissions directly into global carbon budgets and climate targets.",
      "Upgrading Arctic infrastructure design codes to use thermal siphons and deeper piles that bypass active thaw layers.",
      "Enacting regional land-use zoning that restricts heavy industrial activity on high-risk ice soils."
    ]
  },
  ocean_acidification: {
    hiddenCost: "High acidity destroys coral and shellfish habitats, weakening the ocean's natural capacity to absorb carbon dioxide.",
    whoPays: "Benthic fisheries, coastal seafood farms, and consumers pay through higher seafood prices and lost livelihoods.",
    physicalLimit: "When ocean aragonite levels drop below critical thresholds, shell-building marine life begins to dissolve.",
    defaultDriver: "Fossil fuel combustion policies ignore chemical marine feedback limits, and deep-ocean monitoring remains sparse.",
    systemLevers: [
      "Establishing localized ocean alkalinity enhancement projects near high-value aquaculture facilities.",
      "Implementing strict regional runoff limits to prevent secondary chemical acidification in coastal zones.",
      "Expanding high-resolution sensor networks to track real-time aragonite saturation in sensitive fisheries."
    ]
  },
  aquifer_overdraft: {
    hiddenCost: "Excessive groundwater pumping permanently collapses underground aquifers, ruining soil storage capacity even if heavy rains return.",
    whoPays: "Small farmers are ruined as water tables drop below shallow wells, leaving them with no water.",
    physicalLimit: "Aquifers collapse physically when empty, permanently losing their ability to store fresh water.",
    defaultDriver: "Groundwater is treated as an unregulated, free resource where agricultural users pay only the energy cost to pump it.",
    systemLevers: [
      "Enforcing strict pumping caps based on scientifically verified aquifer recharge rates.",
      "Eliminating power subsidies that lower the cost of extraction for deep industrial wells.",
      "Implementing groundwater replenishment zones to capture and direct surface runoff back into aquifers."
    ]
  },
  cement_process_emissions: {
    hiddenCost: "The chemical reaction needed to make cement releases carbon dioxide inherently, making construction cleanups expensive.",
    whoPays: "Homebuyers and taxpayers funding public works absorb the higher cost of green building materials.",
    physicalLimit: "Baking limestone into lime chemically requires releasing a fixed amount of carbon dioxide per ton.",
    defaultDriver: "Portland cement is extremely cheap and locked in by rigid building codes and structural liability standards.",
    systemLevers: [
      "Updating national building codes to permit low-clinker LC3 cements and alternative binders.",
      "Subsidizing commercial-scale carbon capture retrofits for existing cement kilns.",
      "Incentivizing the development of electrochemical cement reactors that bypass limestone calcination entirely."
    ]
  },
  energy_affordability_crisis: {
    hiddenCost: "Unpriced fossil fuel emissions act as a hidden $6.7 trillion subsidy that keeps dirty energy looking artificially cheap.",
    whoPays: "Energy bills spike for low-income households, and local communities pay with their health near fossil power plants.",
    physicalLimit: "Burn limits are capped by the atmosphere's capacity to absorb greenhouse gases without triggering catastrophic warming.",
    defaultDriver: "Governments subsidize consumer fuel prices to avoid immediate political backlash and macroeconomic shocks.",
    systemLevers: [
      "Implementing progressive carbon taxes that distribute revenue back to low-income households as direct dividends.",
      "Phasing out explicit fossil fuel consumption subsidies while expanding clean energy access grants.",
      "Directing state utility regulators to prioritize clean-energy reserve capacity over legacy coal and gas peakers."
    ]
  },
  utility_disconnection_risk: {
    hiddenCost: "A household can appear connected on paper while arrears, shutoff policy, and extreme weather combine to make energy service unreliable in practice.",
    whoPays: "Low-income households, medically vulnerable residents, and small businesses absorb the health and safety burden first when service is interrupted.",
    physicalLimit: "Without active power, homes lose cooling, refrigeration, communications, and the ability to run many essential devices during climate stress.",
    defaultDriver: "Retail tariffs, fuel volatility, and weak consumer protection can turn climate-era energy demand into recurring shutoff risk.",
    systemLevers: [
      "Expanding utility arrears relief and disconnection moratoria during extreme weather periods.",
      "Targeting weatherization and efficient cooling upgrades to high-burden households first.",
      "Requiring regulators to track and reduce shutoff exposure as part of climate resilience planning."
    ]
  },
  wildfire_regime_shift: {
    hiddenCost: "High-intensity fires destroy soil ecosystems, causing post-fire erosion that clogs municipal water treatment facilities.",
    whoPays: "Local homeowners face property destruction and high premiums, while taxpayers fund expensive firefighting budgets.",
    physicalLimit: "High temperatures and low humidity dry out forests to a point where any spark triggers uncontrollable canopy fires.",
    defaultDriver: "Decades of total fire suppression have stockpiled dry fuel, while zoning allows housing growth in high-risk zones.",
    systemLevers: [
      "Expanding permits and funding for prescribed burns to safely reduce accumulated dry understory fuel.",
      "Enforcing strict building zoning limits that restrict new residential construction in wildland-urban interface areas.",
      "Upgrading municipal water intakes with advanced sediment barriers to handle post-fire runoff events."
    ]
  },
  desalination_dependence: {
    hiddenCost: "Purifying sea water requires massive constant energy, locking coastal cities into high electricity dependency.",
    whoPays: "City residents and farmers pay higher utility rates to fund the power and maintenance of desalination plants.",
    physicalLimit: "The chemical pressure of seawater sets a hard thermodynamic minimum energy limit required for reverse osmosis.",
    defaultDriver: "Desalination is treated as an infinite water supply, allowing planners to avoid politically difficult conservation rules.",
    systemLevers: [
      "Implementing tiered pricing that matches desalination tariffs to the real marginal energy cost of reverse osmosis.",
      "Mandating the integration of wastewater recycling to reduce reliance on seawater intakes.",
      "Linking regional agricultural zoning to natural groundwater limits rather than artificial desalination capacity."
    ]
  },
  drinking_water_treatment_stress: {
    hiddenCost: "A water system can remain nominally online while salinity, turbidity, and contamination spikes quietly drive up treatment cost, failure risk, and customer exposure.",
    whoPays: "Utility customers, underfunded small systems, and low-income households pay first through higher rates, degraded reliability, and emergency water costs.",
    physicalLimit: "Treatment plants have hard operational limits for salinity, contaminant load, intake conditions, and how quickly they can switch processes during shocks.",
    defaultDriver: "Utilities are often built around historically stable source-water assumptions even as floods, droughts, and salinity intrusion make raw water more variable.",
    systemLevers: [
      "Hardening intake, blending, and pretreatment capacity for salinity and contamination spikes.",
      "Prioritizing backup raw-water sources and interties for utilities exposed to estuarine or flood-driven quality shocks.",
      "Targeting capital support first to small and under-resourced systems with low treatment redundancy."
    ]
  },
  thermal_stratification_intensification: {
    hiddenCost: "Layered warm coastal water can quietly shrink oxygenated habitat and nursery function before there is an obvious crash visible from shore.",
    whoPays: "Small fishing fleets, shellfish harvesters, and coastal communities dependent on predictable nearshore productivity absorb the earliest losses.",
    physicalLimit: "Once density layering prevents enough vertical mixing, oxygen renewal and nutrient exchange fall below what many coastal ecosystems need to remain stable.",
    defaultDriver: "Ocean planning and fisheries management still often assume more stationary mixing and habitat conditions than warming coastal waters now provide.",
    systemLevers: [
      "Expanding coastal oxygen, temperature, and stratification monitoring in shelf and estuarine systems.",
      "Reducing nutrient loads in basins where warming and stratification already increase low-oxygen risk.",
      "Using seasonal fishery and shellfish management that responds to real-time habitat compression signals."
    ]
  },
  delta_salt_intrusion_fronts: {
    hiddenCost: "Salt intrusion can make water expensive and unreliable before outright scarcity appears, forcing earlier spending on treatment, storage, or alternate supply.",
    whoPays: "Delta households, irrigators, and utilities on estuarine intakes pay first when salinity moves inland faster than infrastructure can adapt.",
    physicalLimit: "Once river discharge and freshwater head fall too low, estuarine salinity can migrate inland in ways conventional intakes and shallow wells cannot resist.",
    defaultDriver: "Coastal planning often treats salinity intrusion as an episodic hazard rather than a chronic low-flow and sea-level management problem.",
    systemLevers: [
      "Tracking salinity fronts operationally and tying intake management to low-flow and drought triggers.",
      "Protecting upstream freshwater releases where estuarine salinity control is a water-security objective.",
      "Relocating or redesigning exposed intakes and irrigation infrastructure in recurrent intrusion corridors."
    ]
  },
  oceanic_upwelling_disruptions: {
    hiddenCost: "A productive coastline can look intact while nutrient timing shifts quietly undermine catch reliability, port income, and local protein supply.",
    whoPays: "Fishing households, processors, and coastal buyers in upwelling-dependent regions absorb the losses before wider food systems notice.",
    physicalLimit: "If nutrient-rich deep water does not surface at the right place or time, the food-web productivity that supports intense fisheries cannot be maintained.",
    defaultDriver: "Fisheries systems and coastal economies are often organized around historical upwelling seasonality and catch windows that are no longer stable.",
    systemLevers: [
      "Expanding seasonal ocean monitoring that links upwelling conditions to fisheries management decisions.",
      "Diversifying coastal processing and income systems where harvest windows are becoming less predictable.",
      "Building adaptive port and market planning around catch volatility rather than historical peak-season assumptions."
    ]
  },
  estuarine_nursery_loss: {
    hiddenCost: "Juvenile habitat failure often shows up later as weaker recruitment and poorer landings, which makes the real economic damage easy to miss at first.",
    whoPays: "Coastal fishing communities and small seafood businesses pay first when nursery degradation reduces future stock replenishment.",
    physicalLimit: "If estuarine nurseries lose enough oxygen, cover, or salinity stability, juvenile fish and shellfish survival drops before adult stocks visibly collapse.",
    defaultDriver: "Estuarine development and water-quality management often undervalue nursery habitat because the damage appears upstream of the final catch statistic.",
    systemLevers: [
      "Protecting and restoring estuarine habitat where juvenile survival is a known bottleneck for coastal fisheries.",
      "Linking fishery management to recruitment and nursery-condition indicators rather than adult stock alone.",
      "Reducing nutrient, salinity, and dredging pressures in estuaries with high nursery dependence."
    ]
  },
  topsoil_erosion_acceleration: {
    hiddenCost: "Rapid loss of agricultural topsoil strips the land of natural nutrients, forcing farmers to buy expensive chemical fertilizers.",
    whoPays: "Farmers bleed capital to maintain crop yields, while consumers face food price inflation.",
    physicalLimit: "Tillage removes soil far faster than the natural geological rate of new soil formation.",
    defaultDriver: "Commodity markets reward short-term crop yields, ignoring natural soil capital depreciation.",
    systemLevers: [
      "Redirecting agricultural subsidies to reward cover cropping, no-till planting, and soil carbon retention.",
      "Implementing land-use mandates that penalize bare-soil fallow periods in active watersheds.",
      "Enforcing strict crop rotation and organic soil management standards in commercial farming leases."
    ]
  },
  plastics_petrochemicals: {
    hiddenCost: "Advanced chemical recycling of plastics is highly energy-intensive, creating massive secondary emissions instead of clean solutions.",
    whoPays: "Chemical firms pay for expensive reactor upgrades, while consumers absorb the higher price of recycled packaging.",
    physicalLimit: "Steam cracking of plastic inputs requires extremely high heat, setting a strict thermodynamic floor on energy efficiency.",
    defaultDriver: "Massive sunk capital in fossil-based steam crackers makes low-carbon alternatives economically unviable.",
    systemLevers: [
      "Imposing carbon levies on virgin plastics to make circular, bio-based alternatives cost-competitive.",
      "Enforcing extended producer responsibility (EPR) laws that mandate plastic packaging collection and reuse.",
      "Incentivizing the electrification of petrochemical reactors using renewable energy sources."
    ]
  },
  transformer_supply_bottleneck: {
    hiddenCost: "Sourcing large grid transformers takes up to four years, delaying green energy connections and keeping fossil fuels online.",
    whoPays: "Ratepayers pay higher electric bills because of grid congestion and delayed connection of cheaper wind or solar farms.",
    physicalLimit: "Heavy transformer factories require specialized components and raw materials that cannot scale rapidly.",
    defaultDriver: "Fragmented procurement across thousands of utilities prevents manufacturers from expanding factory capacity.",
    systemLevers: [
      "Standardizing component designs across utilities to allow bulk manufacturing and pooled purchasing.",
      "Deploying digital sensors like dynamic line rating to maximize energy throughput on existing grid hardware.",
      "Providing federal guarantees for long-term manufacturing contracts to incentivize factory expansions."
    ]
  },
  transmission_buildout_lag: {
    hiddenCost: "Delaying the construction of power lines forces wind and solar farms to shut down during peak production.",
    whoPays: "Green energy developers lose critical revenue, while ratepayers pay for more expensive local fossil generators.",
    physicalLimit: "High-voltage lines require vast physical corridors of land, which are difficult to secure in populated areas.",
    defaultDriver: "Energy plans isolate generation targets from transmission planning, leading to a multi-year construction mismatch.",
    systemLevers: [
      "Mandating integrated resource planning where generation permits require concurrent transmission corridor approvals.",
      "Deploying underground cabling along existing highway and rail routes to bypass land disputes.",
      "Upgrading existing lines with advanced conductors that carry twice the current using current towers."
    ]
  },
  grid_permitting_delays: {
    hiddenCost: "Lengthy environmental reviews force capital to sit idle, driving up the cost of grid connections.",
    whoPays: "Clean energy developers burn pre-construction capital, while consumers pay for delayed grid upgrades.",
    physicalLimit: "Local regulatory agencies have a limited number of staff to evaluate hundreds of complex grid proposals.",
    defaultDriver: "Grid rules prioritize localized, fragmented veto power over national-level energy security.",
    systemLevers: [
      "Establishing centralized, digitized fast-track permitting authorities at the federal level.",
      "Setting strict maximum timeline thresholds for reviews, granting automatic approvals if regulators miss deadlines.",
      "Standardizing zoning laws for clean energy corridors to bypass municipal veto points."
    ]
  },
  peaker_plant_lock_in: {
    hiddenCost: "Grid rules pay fossil peaker plants just for existing, guaranteeing revenue to outdated facilities.",
    whoPays: "Everyday ratepayers face soaring bills to fund reserve capacity, while massive data centers escape these costs.",
    physicalLimit: "Instant load balancing requires gas turbines until battery storage matches them in volume and discharge duration.",
    defaultDriver: "Grid managers prioritize absolute reliability, using capacity markets to subsidize legacy fossil plants.",
    systemLevers: [
      "Structuring tariff rules so that hyperscale data centers directly finance new clean capacity instead of socializing costs.",
      "Expanding demand response and virtual power plant participation in reserve energy markets.",
      "Bypassing grid operator capacity auctions by allowing states to directly procure clean energy reserves."
    ]
  },
  subsea_cables: {
    hiddenCost: "Unburied deep-sea cables are vulnerable to anchor damage and sabotage, risking up to $1.5 million per hour in digital trade losses.",
    whoPays: "Telecom networks pay for high repair costs, while the digital economy absorbs connection delay shocks.",
    physicalLimit: "Splicing severed deep-sea cables requires rare specialized ships, dragging out repair times to weeks.",
    defaultDriver: "Geopolitical tensions and lack of maritime policing leave deep-sea cables exposed on the ocean floor.",
    systemLevers: [
      "Expanding the global cable-laying and repair ship fleet to reduce average restoration times.",
      "Mandating geographic routing redundancy for all critical trans-oceanic digital and power links.",
      "Enhancing joint public-private satellite and marine surveillance near critical cable corridors."
    ]
  },
  reinsurance_withdrawal: {
    hiddenCost: "Reinsurers exiting risky zones forces local insurers to stop offering policies, making homes uninsurable.",
    whoPays: "Property owners lose their generational wealth, while governments step in as socialized insurers of last resort.",
    physicalLimit: "Reinsurance capital is capped; it cannot absorb concurrent catastrophe losses exceeding $100 billion annually.",
    defaultDriver: "Insurers rely on short-term risk models and exit exposed zones the moment risk outpaces annual returns.",
    systemLevers: [
      "Developing public-private risk pooling mechanisms that guarantee long-term coverage in exchange for adaptation steps.",
      "Integrating dynamic climate projections into regulatory insurance pricing models.",
      "Enforcing strict building zoning limits that restrict new development in fire and flood zones."
    ]
  },
  coastal_property_insurance_redlines: {
    hiddenCost: "Insurance cancellation triggers mortgage defaults, devaluing properties and shrinking the city's tax revenue.",
    whoPays: "Beachfront homeowners lose equity, and regional banks absorb toxic, uninsured mortgage debt.",
    physicalLimit: "Fixed coastal buildings cannot move away from rising sea levels and storm surge forces.",
    defaultDriver: "Real estate and mortgage models assume thirty-year stability while insurance contracts are renewed annually.",
    systemLevers: [
      "Mandating public disclosure of long-term insurance availability risks in coastal property sales.",
      "Restructuring municipal tax bases to decrease reliance on vulnerable coastal real estate values.",
      "Funding local coastal adaptation plans through targeted, long-term catastrophe bonds."
    ]
  },
  adaptation_financing_gap: {
    hiddenCost: "The lack of global adaptation funding forces poor nations into debt traps just to build basic survival defenses.",
    whoPays: "Developing countries pay with high-interest debt, while the global economy loses potential trade and supply chain stability.",
    physicalLimit: "Seawalls and electrical grids require physical raw materials that must be built before climate impacts strike.",
    defaultDriver: "Financial markets reward projects with immediate cash flows, while public adaptation projects only offer avoided losses.",
    systemLevers: [
      "Expanding concessional and grant-based international adaptation funding for vulnerable nations.",
      "Developing standardized accounting frameworks that place avoided climate losses as assets on balance sheets.",
      "Issuing state-backed resilience bonds designed specifically for public adaptation infrastructure."
    ]
  },
  adaptation_capital_shortfall: {
    hiddenCost: "Scarce adaptation funds go to protect wealthy commercial districts, leaving low-income neighborhoods unprotected.",
    whoPays: "Vulnerable populations absorb the physical damage, and businesses lose production when local workers are displaced.",
    physicalLimit: "Building massive flood defenses takes decades; money cannot construct them faster than extreme weather accelerates.",
    defaultDriver: "Federal and local budgets use short-term horizons that count adaptation as a high immediate cost rather than investment.",
    systemLevers: [
      "Mandating equity-based criteria in public infrastructure funding to ensure exposed communities get protected first.",
      "Expanding municipal green bonds that pair public resilience funding with community labor contracts.",
      "Implementing dynamic adaptation pathways that allow infrastructure to be built up incrementally."
    ]
  },
  fast_fashion: {
    hiddenCost: "Cheap polyester clothes release microplastics into our water systems that cannot be captured by standard filters.",
    whoPays: "Water companies pay more to filter municipal supplies, while communities near textile dumps absorb toxic waste fumes.",
    physicalLimit: "Synthetic fibers do not biodegrade, and mechanical recycling degrades them into smaller microplastics that shed faster.",
    defaultDriver: "Fast fashion profit models rely on rapid turnover and low-cost petroleum-derived synthetic fabrics.",
    systemLevers: [
      "Imposing extended producer responsibility (EPR) fees at the point of sale to finance textile recycling.",
      "Enforcing strict microplastic filtration standards on industrial and household washing machines.",
      "Mandating durability and chemical labeling standards on all imported apparel."
    ]
  },
  air_conditioning_refrigerants: {
    hiddenCost: "Cooling gases are super-pollutants that trap heat up to 14,000 times more effectively than carbon dioxide.",
    whoPays: "Businesses and households pay for expensive next-generation refrigerants and stricter leak detection systems.",
    physicalLimit: "Cooling systems require specific chemical phase changes, leaving a very narrow window for safe, clean alternatives.",
    defaultDriver: "Fast-growing global cooling demand drives mass production of cheap, high-emission legacy AC units.",
    systemLevers: [
      "Enforcing the Kigali Amendment phasedown schedule through strict national import allocations.",
      "Subsidizing the commercialization of natural refrigerants like propane and carbon dioxide.",
      "Establishing national deposit-return programs for the recovery and destruction of retired AC cooling gases."
    ]
  },
  desalination_intake_disruptions: {
    hiddenCost: "Open-ocean desalination intakes destroy marine larvae and generate high-salinity brine that creates seafloor dead zones.",
    whoPays: "Commercial fisheries lose stock, while water consumers face sudden shutdowns and higher treatment costs.",
    physicalLimit: "Extreme salinity levels shock marine life, and membrane filters fail when organic silt loads are too high.",
    defaultDriver: "Siting desalination intakes in shallow coastal areas is cheap, ignoring long-term water and ecological costs.",
    systemLevers: [
      "Mandating the transition from open-ocean water intakes to subsurface sand filters.",
      "Enforcing strict regional brine dilution and diffusion standards for wastewater discharge.",
      "Deploying real-time sensor arrays to monitor biological silt loads ahead of intake systems."
    ]
  },
  oceanic_deoxygenation: {
    hiddenCost: "Expanding low-oxygen zones stress marine species, reducing fish reproduction without showing immediate visible die-offs.",
    whoPays: "Local fishing fleets pay first as fish are squeezed into narrow surface layers, and fish markets face eventual collapses.",
    physicalLimit: "Marine life suffocates below an oxygen threshold of 2 mg/L, and ocean warming stops critical ventilation mixing.",
    defaultDriver: "Runoff from farms loaded with nitrogen and phosphorus fuels massive coastal algae blooms that consume oxygen.",
    systemLevers: [
      "Restricting synthetic fertilizer application and animal manure runoff in major river basins.",
      "Expanding marine protected areas to allow hypoxic ecosystems to regenerate.",
      "Upgrading global ocean telemetry arrays to monitor subsurface oxygen levels in real time."
    ]
  },
  sea_level_rise: {
    hiddenCost: "Creeping sea levels corrode underground power grids and sewage lines long before catastrophic storms arrive.",
    whoPays: "Cities pay constant repair bills, while homeowners face uninsurable property values and mortgage failures.",
    physicalLimit: "Passive gravity drainage fails when sea level breaches the elevation of stormwater outfalls.",
    defaultDriver: "Cities permit continued coastal real estate development to sustain local property tax revenues.",
    systemLevers: [
      "Replacing passive gravity-drain stormwater outfalls with active pump stations.",
      "Restricting new housing development in low-lying coastal zones through updated zoning laws.",
      "Integrating sea level rise and land subsidence forecasts directly into municipal planning codes."
    ]
  },
  marine_heatwaves: {
    hiddenCost: "Underwater heatwaves wipe out kelp forests and benthic habitats, destroying key nurseries for commercial fish.",
    whoPays: "Artisanal fishers and coastal tourism companies lose business first, followed by commercial fleets as fish stocks collapse.",
    physicalLimit: "High ocean temperatures denature vital marine proteins, triggering mass biological mortality.",
    defaultDriver: "Commercial fishing quotas are set using stable historical baselines, ignoring sudden ocean warming shocks.",
    systemLevers: [
      "Implementing dynamic fishing closures that automatically trigger when regional heatwaves exceed safety limits.",
      "Scaling kelp restoration projects using heat-tolerant genetic strains.",
      "Developing sub-surface thermal forecasting arrays to give advanced warnings to fisheries."
    ]
  },
  talik_expansion: {
    hiddenCost: "Unfrozen soil layers inside permafrost act as subterranean chimneys, releasing carbon year-round.",
    whoPays: "Arctic communities face severe land sinkage under roads and homes, while the global public pays for extra warming.",
    physicalLimit: "Active soil layers permanently decouple from frozen ground when soil stays above 0°C year-round.",
    defaultDriver: "Infrastructure earthworks trap heat and alter hydrology, actively inducing talik formation beneath buildings.",
    systemLevers: [
      "Upgrading high-latitude geotechnical engineering to include passive thermosyphon cooling loops.",
      "Expanding deep-soil electrical resistivity telemetry to monitor talik boundaries.",
      "Restricting heavy industrial grading on permafrost zones with high ice content."
    ]
  },
  firn_layer_depletion: {
    hiddenCost: "When firn loses meltwater storage capacity, more surface melt runs off directly instead of being temporarily retained within the snowpack.",
    whoPays: "Coastal planners and exposed communities absorb the cost when faster runoff contributes to higher sea-level risk and tighter adaptation timelines.",
    physicalLimit: "Repeated melt and refreezing can form dense ice layers that block water from percolating downward into firn.",
    defaultDriver: "Warming surface conditions and repeated melt seasons reduce firn porosity and storage capacity on ice sheets.",
    systemLevers: [
      "Incorporating dynamic firn permeability models into national sea-level projections.",
      "Accelerating municipal coastal retreat planning and seawall infrastructure timelines.",
      "Expanding satellite radar monitoring of glacial surface refreezing and ice lens formation."
    ]
  },
  winter_ice_road_collapses: {
    hiddenCost: "Shorter freezing seasons isolate remote northern towns, causing food and fuel prices to skyrocket.",
    whoPays: "Sub-arctic Indigenous communities pay through astronomical food costs, while mining firms pay for air freight.",
    physicalLimit: "Heavy cargo transport requires ice to be at least one meter thick to prevent catastrophic load breakages.",
    defaultDriver: "Remote northern supply chains depend entirely on climate-sensitive frozen winter infrastructure.",
    systemLevers: [
      "Funding all-weather gravel road replacements to connect remote high-latitude communities.",
      "Structuring state logistics subsidies to offset seasonal food and fuel price shocks.",
      "Deploying ground-penetrating radar systems to track ice thickness and bearing capacity."
    ]
  },
  polar_infrastructure_failure: {
    hiddenCost: "Ground sinking causes industrial pipeline leaks, risking toxic oil spills across fragile northern lands.",
    whoPays: "Resource extraction firms face massive pipeline cleanups, and local hunting communities lose clean water.",
    physicalLimit: "Permafrost loses its mechanical strength near 0°C, causing heavy foundations to collapse.",
    defaultDriver: "High-latitude building design codes use historical temperature data that ignores rapid Arctic warming.",
    systemLevers: [
      "Mandating the retrofitting of high-risk pipelines with active soil refrigeration arrays.",
      "Updating polar building codes to require deeper pilings anchored in bedrock.",
      "Deploying satellite-based radar to monitor real-time ground displacement near pipelines."
    ]
  },
  nocturnal_heat_stress: {
    hiddenCost: "Warm nights block the human body from resting and cooling down, increasing heart attacks and strokes.",
    whoPays: "Households without air conditioning face severe health wear, and grids face blackout risks from night cooling demand.",
    physicalLimit: "Evaporative sweat cooling is blocked when ambient night temperatures remain above 25°C.",
    defaultDriver: "Urban asphalt and concrete absorb solar heat by day and aggressively re-radiate it at night.",
    systemLevers: [
      "Establishing public heat alerts that focus on nighttime minimum temperatures rather than daytime peaks.",
      "Funding cool-roof retrofits and urban forest plantings in high-density residential blocks.",
      "Providing utility bill relief for low-income families to run fans and cooling systems overnight."
    ]
  },
  compound_day_night_heat_extremes: {
    hiddenCost: "Continuous day-and-night heat prevents grid transformers from cooling, triggering blackouts when cooling is needed most.",
    whoPays: "Power companies face expensive transformer burnouts, and medically vulnerable residents pay with their lives.",
    physicalLimit: "Grid transformers degrade structurally when ambient heat remains elevated for 48 hours.",
    defaultDriver: "Grid designs assume distinct night cooling cycles that allow electrical components to shed heat.",
    systemLevers: [
      "Enforcing strict connection rules that mandate data centers run on co-located backup generation during peaks.",
      "Upgrading substation grid transformers with active liquid cooling and thermal alarms.",
      "Decentralizing municipal grids into solar-and-storage microgrids that can operate independently."
    ]
  },
  soil_moisture_collapse: {
    hiddenCost: "Dry soils flip from absorbing carbon to venting it, destroying underground microbes that keep fields fertile.",
    whoPays: "Farmers face total crop failure and erosion, while global markets absorb staple food price spikes.",
    physicalLimit: "Plants wilt permanently when soil water tension drops below their physical absorption capacity.",
    defaultDriver: "Tillage and intensive chemical inputs deplete organic matter, lowering the soil's water holding capacity.",
    systemLevers: [
      "Transitioning to conservation agriculture practices that maintain continuous organic soil cover.",
      "Expanding root-zone soil moisture monitoring arrays to manage early water conservation.",
      "Restructuring agricultural water rights to incentivize seasonal cover cropping."
    ]
  },
  monsoon_volatility: {
    hiddenCost: "Unpredictable monsoon patterns trap rural families in debt cycles and force mass distress migration.",
    whoPays: "Small farmers pay with crop failures, while national import budgets absorb emergency food costs.",
    physicalLimit: "Seeds fail to germinate if planting windows are missed, regardless of subsequent rainfall.",
    defaultDriver: "Agrarian systems depend on rigid historical calendars that cannot adapt to erratic rainfall shifts.",
    systemLevers: [
      "Establishing state-backed seed banks containing drought- and flood-tolerant crop varieties.",
      "Deploying hyper-local, real-time weather forecasting services directly to farmers.",
      "Upgrading rural credit systems to prevent predatory debt cycles during delayed planting seasons."
    ]
  },
  reservoir_storage_instability: {
    hiddenCost: "Trapped sediment displaces reservoir volume, reducing clean hydropower generation and water supply reliability.",
    whoPays: "Utility operators lose power revenue, while taxpayers pay to dredge sludge or decommission dams.",
    physicalLimit: "Once sediment fills a dam's low-level capacity, water can no longer be routed to power turbines.",
    defaultDriver: "Upstream deforestation and soil erosion accelerate silt buildup, and old dams lack flushing gates.",
    systemLevers: [
      "Enacting strict forest protection rules in upstream catchments to reduce topsoil erosion.",
      "Retrofitting existing dams with sediment bypass tunnels to allow natural sediment flow.",
      "Installing hydro-suction dredging systems to dynamically remove sludge without shutting down reservoirs."
    ]
  },
  reservoir_operating_shortfall: {
    hiddenCost: "A reservoir can still exist on a map while no longer delivering the storage, flood control, or generation it was built to provide.",
    whoPays: "Water utilities, hydropower operators, irrigation districts, and downstream users absorb the shortfall through rationing, outages, or emergency operating changes.",
    physicalLimit: "Low storage, sediment loss, or poorly timed inflows can leave too little usable water at the wrong time for power generation or controlled release.",
    defaultDriver: "Reservoir operations were often designed around historical inflow timing and storage assumptions that are no longer stable.",
    systemLevers: [
      "Updating reservoir rule curves to reflect altered runoff timing and drought carryover risk.",
      "Investing in sediment management and forecasting to preserve usable storage volume.",
      "Coordinating basin operations so hydropower, irrigation, and flood-control demands are not planned in isolation."
    ]
  },
  wastewater_bypass_discharge: {
    hiddenCost: "Overflow events can force untreated or partially treated wastewater directly into rivers, estuaries, or nearshore waters during storms.",
    whoPays: "Downstream communities, utilities, and fisheries absorb the water-quality and cleanup burden when overflow systems bypass treatment.",
    physicalLimit: "Collection systems and treatment plants have hydraulic limits beyond which water must be stored, diverted, or released.",
    defaultDriver: "Aging sewer networks and storm-intense runoff can exceed plant capacity faster than utilities can safely treat incoming flows.",
    systemLevers: [
      "Separating combined sewer systems and expanding retention storage in overflow-prone districts.",
      "Upgrading treatment and pumping capacity where flood-driven bypass is recurrent.",
      "Deploying real-time stormwater and plant-load controls to reduce emergency discharge frequency."
    ]
  },
  freshwater_lens_compression: {
    hiddenCost: "Thin freshwater lenses on small islands can become brackish or unreliable, pushing communities toward costly imported water or desalination.",
    whoPays: "Island households, farmers, and utilities pay first when salinity intrusion reduces the amount of usable groundwater.",
    physicalLimit: "Small drops in freshwater head can allow saltwater intrusion to move upward or inland through shallow coastal aquifers.",
    defaultDriver: "Sea-level rise and overpumping combine to reduce freshwater thickness and increase saltwater intrusion pressure.",
    systemLevers: [
      "Installing automated smart meters on water wells to enforce sustainable extraction limits.",
      "Constructing rainwater harvesting and storage systems to reduce groundwater pumping.",
      "Deploying shallow groundwater monitoring networks to track aquifer salinity gradients."
    ]
  },
  coastal_aquifer_degradation: {
    hiddenCost: "Groundwater can remain physically present while becoming too saline to use cheaply, forcing a quiet shift into higher-cost treatment, imports, or desalination.",
    whoPays: "Well users, coastal utilities, and irrigators pay first when local aquifers lose quality faster than alternative supply can be built.",
    physicalLimit: "Once saline intrusion and overdraw alter groundwater quality beyond usable thresholds, local aquifers cannot reliably serve prior drinking or irrigation demand.",
    defaultDriver: "Coastal groundwater is often managed around extraction volume rather than salt-front movement, intake vulnerability, and declining raw-water quality.",
    systemLevers: [
      "Monitoring salinity movement within exposed coastal aquifers rather than only tracking groundwater levels.",
      "Restricting overpumping in intrusion-prone zones before aquifer quality loss becomes effectively irreversible.",
      "Pairing groundwater management with alternative supply planning in communities already nearing salinity thresholds."
    ]
  },
  pollinator_service_decline: {
    hiddenCost: "A drop in wild bees reduces the nutritional value and micronutrients of crops without showing total harvest failure.",
    whoPays: "Farmers face lower yields or pay for manual hand pollination, while consumers face higher prices for fresh food.",
    physicalLimit: "Bees cannot survive neurological disruption when pesticide concentrations breach safe toxicological thresholds.",
    defaultDriver: "Massive agricultural monocultures wipe out wildflower habitats, and neurotoxic pesticides are sprayed widely.",
    systemLevers: [
      "Enacting federal bans on neonicotinoid and other neurotoxic agricultural pesticides.",
      "Mandating the integration of wildflower buffer strips within commercial crop fields.",
      "Funding national wild pollinator population monitoring networks."
    ]
  },
  biodiversity_intactness_loss: {
    hiddenCost: "Habitat fragmentation erodes nature's natural barriers, increasing the risk of diseases jumping from animals to humans.",
    whoPays: "Rural communities face wildlife conflicts, while the global public pays the price of new pandemics.",
    physicalLimit: "Ecosystems lose their self-regulating capacity when the biodiversity intactness index drops below 90%.",
    defaultDriver: "Zoning codes carve up large forests for roads and mining, isolating wildlife populations.",
    systemLevers: [
      "Enforcing legally binding transboundary ecological corridors to connect fragmented habitats.",
      "Integrating biodiversity integrity values directly into national economic development metrics.",
      "Restricting new road and infrastructure development in remaining old-growth forests."
    ]
  },
  pm2_5_particulates: {
    hiddenCost: "Fine soot particles cross the blood-brain barrier, causing chronic vascular damage and pediatric asthma.",
    whoPays: "Families living near heavy highways pay with their long-term health, and public systems pay for chronic diseases.",
    physicalLimit: "Soot levels exceeding 15 micrograms per cubic meter trigger systemic body inflammation.",
    defaultDriver: "High-emission factories and diesel freight corridors are built close to low-income residential zones.",
    systemLevers: [
      "Updating municipal zoning to prohibit heavy truck routes and factories near residential blocks.",
      "Mandating high-efficiency particulate air (HEPA) filters in schools near high-traffic highways.",
      "Expanding neighborhood-level particulate telemetry to enforce local clean air standards."
    ]
  },
  tropospheric_ozone: {
    hiddenCost: "Ground-level ozone causes chemical necrosis in plant tissues, silently suppressing crop yields and forest carbon sinks.",
    whoPays: "Farmers pay through stunted harvests, while global carbon budgets suffer as ozone-damaged trees absorb less CO2.",
    physicalLimit: "Ozone concentrations above 40 parts per billion chemically destroy plant stomatal functions.",
    defaultDriver: "Urban vehicle and power plant emissions mix with sunlight, forming ozone that drifts into rural farms.",
    systemLevers: [
      "Mandating strict nitrogen oxide (NOx) emission limits on power plants and heavy vehicles.",
      "Deploying ozone-resistant crop varieties in regions exposed to high summer smog.",
      "Establishing regional ozone early-warning systems to coordinate agricultural watering schedules."
    ]
  },
  food: {
    hiddenCost: "Global food demand externalizes health costs through diet-related diseases and the destruction of carbon-rich forests.",
    whoPays: "Taxpayers fund government health budgets, while rural communities pay with degraded local water and air.",
    physicalLimit: "Converting natural land to crops triggers regional dryland desertification as local moisture loops break.",
    defaultDriver: "Global supply chains prioritize low-cost animal proteins and processed grains, locking consumers into high-footprint defaults.",
    systemLevers: [
      "Restructuring agricultural subsidies to disincentivize intensive livestock feed crops and reward low-footprint protein diversification.",
      "Implementing land-protection mandates that block supply chain financing for commodities grown on deforested or conversion-exposed soils.",
      "Diverting institutional procurement budgets toward local, regeneratively grown, plant-centric foods."
    ]
  },
  aviation: {
    hiddenCost: "Warmed-air density declines reduce lift, requiring longer takeoff runways and forcing airlines to restrict payload weights.",
    whoPays: "Commercial airlines face payload penalties (offloading passengers or cargo), while airport operators absorb layout constraint bottlenecks.",
    physicalLimit: "Maximum Takeoff Weight (MTOW) is bound by available runway length and tire speed limits; runways cannot be expanded in dense areas.",
    defaultDriver: "Flight schedule planning and airport layouts assume a stationary Holocene climate and constant air densities.",
    systemLevers: [
      "Extending runway lengths or shifting heavy takeoff schedules to cooler nighttime and early morning hours.",
      "Deploying lighter, next-generation composite aircraft with higher lift-to-drag ratios.",
      "Adapting airport operational plans to dynamic local air density and temperature forecast models."
    ]
  },
  shipping: {
    hiddenCost: "Black carbon emissions from Heavy Fuel Oil settle on Arctic ice, destroying albedo reflectivity and accelerating regional melt.",
    whoPays: "Shipping companies absorb the premium of shifting to polar distillates, while global populations bear the accelerated warming feedback loop.",
    physicalLimit: "The ice-albedo threshold is a hard boundary; darkened ice absorbs 7 to 10 times more solar radiation than clean ice.",
    defaultDriver: "Supply-chain shipping routes seek shorter transit times via the Arctic using cheap, high-sulfur Heavy Fuel Oil.",
    systemLevers: [
      "Enforcing strict International Maritime Organization (IMO) bans on Heavy Fuel Oil in polar waters.",
      "Mandating transition to low-sulfur marine distillates and installing active particulate collection filters on vessels.",
      "Restricting commercial transit speeds and routes in highly vulnerable sea-ice seasonal zones."
    ]
  },
  mining_critical_minerals: {
    hiddenCost: "Evaporative lithium extraction consumes vast volumes of local freshwater, causing severe water table drops in arid salars.",
    whoPays: "Indigenous communities face acute drinking water depletion, while battery manufacturers suffer inelastic supply-chain bottlenecks.",
    physicalLimit: "Solar radiation and local humidity place a hard biophysical limit on the velocity of traditional brine evaporation.",
    defaultDriver: "Commodity markets prioritize low-cost, land-intensive evaporative extraction over more circular and water-neutral mining methods.",
    systemLevers: [
      "Transitioning to Direct Lithium Extraction (DLE) technologies to selectively filter lithium in hours instead of months.",
      "Mandating the reinjection of lithium-depleted brine to maintain the hydrostatic pressure of fragile aquifers.",
      "Developing closed-loop mineral recycling standards to reduce reliance on raw high-altitude salar extraction."
    ]
  },
  airport_climate_exposure: {
    hiddenCost: "Heat, flooding, and weather extremes can reduce airport operating margins long before a facility is physically damaged.",
    whoPays: "Airlines absorb payload or schedule penalties, while airport operators face rising resilience and adaptation costs.",
    physicalLimit: "High temperatures lower air density and tighten takeoff performance margins, especially at already constrained runways.",
    defaultDriver: "Airport planning and operations often rely on historical temperature, drainage, and disruption assumptions that are now shifting.",
    systemLevers: [
      "Lengthening airport runways where land use permits to restore takeoff margins.",
      "Shifting aircraft departures to cooler early morning and late evening blocks.",
      "Deploying lightened carbon-composite aircraft frames to preserve payload capacity."
    ],
    verdict: "unique"
  },
  bridge_scour_exposure: {
    hiddenCost: "High-flow events can erode supporting sediment around bridge foundations even when the main visible problem is not overtopping.",
    whoPays: "Transport agencies and the communities they serve pay through inspection costs, emergency repairs, and detour disruption.",
    physicalLimit: "Once protective streambed material is removed from around a foundation, structural stability can degrade quickly.",
    defaultDriver: "Bridge inventories and hydraulic design assumptions do not always keep pace with changing runoff intensity and flood behavior.",
    systemLevers: [
      "Installing protective riprap armoring and heavy A-Jacks around vulnerable bridge piers.",
      "Transitioning to deep foundation shafts driven deep into stable subsurface bedrock.",
      "Deploying real-time acoustic sensors to monitor bed elevation and sediment loss."
    ],
    verdict: "unique"
  },
  lithium_extraction_brine_pools: {
    hiddenCost: "Hypersaline brine evaporation consumes vast volumes of local water resources, depleting surrounding freshwater aquifers in arid regions.",
    whoPays: "Indigenous salar populations suffer acute water scarcity, while battery supply chains absorb extreme production lag times.",
    physicalLimit: "Evaporation rate limits are bounded by local solar radiation and humidity, creating a hard physical bottleneck on supply velocity.",
    defaultDriver: "Traditional mining lease terms prioritize cheap evaporation ponds over water-efficient extraction technologies.",
    systemLevers: [
      "Implementing Direct Lithium Extraction (DLE) technologies to bypass evaporation ponds.",
      "Reinjecting lithium-depleted brine to maintain salar aquifer hydrostatic pressure.",
      "Enforcing water-neutral extraction certificates and aquifer monitoring mandates."
    ],
    verdict: "unique"
  },
  deepwater_methane_hydrate_drilling: {
    hiddenCost: "Subsea clathrate dissociation releases highly concentrated greenhouse gas feedbacks and threatens submarine slope stability.",
    whoPays: "Coastal populations bear the risk of tsunamis from undersea landslides, while the global public pays for unmitigated methane feedbacks.",
    physicalLimit: "Breaching high-pressure, low-temperature equilibrium zone triggers rapid dissociation and 160x volume expansion of methane gas.",
    defaultDriver: "National energy expansion targets prioritize marine clathrate exploration without accounting for geomechanical slip risks.",
    systemLevers: [
      "Enforcing strict geomechanical stabilization protocols and depressurization rate limits.",
      "Deploying real-time undersea acoustic arrays to monitor slope deformation.",
      "Restricting clathrate exploration in active seismic zones and unstable continental slopes."
    ],
    verdict: "unique"
  },
  tire_microplastic_abrasion: {
    hiddenCost: "Tire antioxidant 6PPD-quinone washes into municipal watersheds, causing acute, low-concentration toxicity to sensitive salmonids.",
    whoPays: "Commercial fisheries lose salmon populations, and municipal utility systems absorb stormwater filtration infrastructure costs.",
    physicalLimit: "Biological toxicity thresholds are breached at extremely low concentrations, disrupting species' blood-brain barriers.",
    defaultDriver: "Vehicle tire compound regulations focus on durability and road grip, ignoring chemical breakdown toxicity.",
    systemLevers: [
      "Phasing out toxic 6PPD in tires in favor of benign chemical anti-degradants.",
      "Installing specialized bioretention swales and green infrastructure along major highways.",
      "Deploying advanced polymer filters at stormwater outlets to catch microplastic particles."
    ],
    verdict: "unique"
  },
  uranium_mill_tailings: {
    hiddenCost: "Low-level radioactive waste lagoons leach heavy metals and uranium decay products into drinking water aquifers.",
    whoPays: "Disenfranchised indigenous populations absorb chronic kidney damage, auto-immune disease, and cancer burdens.",
    physicalLimit: "Heavy metal solubility allows radioactive daughter products to move through unlined aquifer geologic layers.",
    defaultDriver: "Legacy defense mining operations leave waste ponds unlined, externalizing long-term remediation liabilities.",
    systemLevers: [
      "Excavating contaminated topsoils and sealing tailings in composite-lined waste cells.",
      "Constructing piped municipal water lines to bypass contaminated rural groundwater wells.",
      "Enforcing federal cleanup standards backed by sovereign cleanup superfunds."
    ],
    verdict: "unique"
  },
  tar_sands_tailings_ponds: {
    hiddenCost: "Hypersaline fluid fine tailings seep toxic naphthenic acids and heavy metals into adjacent river watersheds.",
    whoPays: "Downstream indigenous communities absorb clean water deficits, while public budgets inherit long-term reclamation costs.",
    physicalLimit: "Earthen dikes must permit controlled seepage to prevent build-up of catastrophic hydrostatic failure pressure.",
    defaultDriver: "Mining regulations permit long-term wet storage of bitumen waste to defer high mechanical dewatering costs.",
    systemLevers: [
      "Mandating active mechanical centrifuge dewatering and polymer flocculation of fluid tailings.",
      "Imposing progressive bonding surcharges to secure full private funding for mine cleanup.",
      "Banning the expansion of wet tailings impoundments in ecological buffer zones."
    ],
    verdict: "unique"
  },
  coal_fly_ash_lagoons: {
    hiddenCost: "Unlined coal ash impoundments relentlessly leach toxic arsenic, selenium, and boron into shallow groundwater reservoirs.",
    whoPays: "Adjacent residential well-water users absorb heavy metal toxicity, while utility rate-payers fund deferred cleanup costs.",
    physicalLimit: "Unlined earth dams allow gravity-driven infiltration of dissolved metal ions into local aquifers.",
    defaultDriver: "Coal-fired power plants utilize wet slurry handling to minimize ash handling and storage costs.",
    systemLevers: [
      "Enforcing federal rules mandating closure and clean excavating of all unlined ash ponds.",
      "Upgrading to dry ash handling systems paired with composite clay and membrane liners.",
      "Recycling dry coal ash into cement mixtures to permanently mineralize heavy metals."
    ],
    verdict: "unique"
  },
  grid_substation_thermal_strain: {
    hiddenCost: "Extreme ambient heat degrades grid transformer capacity, forcing power de-rating during peak air-conditioning demand.",
    whoPays: "Electricity consumers experience brownouts, and utility companies pay for premature transformer degradation.",
    physicalLimit: "Synthetic insulating oils and copper windings degrade structurally when operated past internal thermal ratings.",
    defaultDriver: "Grid utility asset management rules assume static, historical summer heat peaks for transformer ratings.",
    systemLevers: [
      "Installing active liquid cooling systems and radiator fans at critical grid substations.",
      "Implementing dynamic line rating systems based on real-time ambient temperatures.",
      "Deploying decentralized community microgrids to island peak thermal loads."
    ],
    verdict: "unique"
  },
  overhead_transmission_line_fires: {
    hiddenCost: "High-voltage transmission lines spark catastrophic wildfires in dry vegetation during extreme wind events.",
    whoPays: "Homeowners in high-risk zones face home loss, while utilities face bankruptcy and rate-payers absorb securitization surcharges.",
    physicalLimit: "Air insulation gaps break down when conductors sag or make contact with vegetation under thermal load.",
    defaultDriver: "Utility operators rely on overhead bare-wire lines to minimize capital grid construction costs.",
    systemLevers: [
      "Preemptively de-energizing high-risk grid corridors during extreme fire weather.",
      "Undergrounding high-voltage lines in designated high fire threat zones.",
      "Replacing bare conductors with covered wires and installing non-expulsion current fuses."
    ],
    verdict: "unique"
  },
  subsea_cable_landing_chokepoint: {
    hiddenCost: "Extreme geographic concentration of transoceanic fiber-optic cables in shallow shipping lanes risks massive connectivity outages.",
    whoPays: "Global financial institutions and digital businesses absorb systemic downtime losses during cable cuts.",
    physicalLimit: "Scarcity of specialized subsea cable repair vessels restricts recovery velocity during multiple cable breaks.",
    defaultDriver: "Telecom operators route cables along the shortest, cheapest marine paths to minimize installation costs.",
    systemLevers: [
      "Hardening landing stations with zero-trust cyber-physical security controls.",
      "Burial of subsea cables deep in seafloor sediment across shallow coastal waters.",
      "Diversifying transoceanic cable routing across alternative geopolitical corridors."
    ],
    verdict: "unique"
  },
  arctic_shipping_expansion: {
    hiddenCost: "Longer Arctic navigation windows can increase local shipping pressure, black-carbon deposition, and accident-management challenges in sensitive regions.",
    whoPays: "Arctic communities and ecosystems absorb localized disruption first, while global systems absorb the added climate and governance risk.",
    physicalLimit: "Even with longer open-water seasons, Arctic operations remain constrained by ice, remoteness, search-and-rescue limits, and fragile marine conditions.",
    defaultDriver: "Shipping firms are incentivized to test shorter northern routes when sea-ice seasons contract and conventional chokepoints stay costly.",
    systemLevers: [
      "Enforcing International Maritime Organization bans on heavy fuel oil in Arctic waters.",
      "Mandating transition to low-sulfur polar distillates and clean marine fuels.",
      "Installing particulate soot filters on all vessels operating in the Polar Code zone."
    ],
    verdict: "unique"
  },
  airport_operational_disruption: {
    hiddenCost: "Airports can stay structurally intact while heat, smoke, flooding, or runway constraints still disrupt schedules and cargo flow.",
    whoPays: "Airlines, freight operators, travelers, and airport authorities absorb delay, cancellation, and recovery costs first.",
    physicalLimit: "Runway throughput and safe takeoff performance are constrained by weather, visibility, air density, and operating margins.",
    defaultDriver: "Airport operations often depend on tightly optimized schedules with limited slack for repeated climate disruptions.",
    systemLevers: [
      "Building heat, smoke, and flood contingencies into runway and departure planning.",
      "Hardening drainage, backup power, and critical ground systems at exposed airports.",
      "Using resilience screening to prioritize operational upgrades at climate-exposed hubs."
    ],
    verdict: "unique"
  },
  fish_landing_supply_disruption: {
    hiddenCost: "Fishing pressure can remain high while local landings become more erratic, making protein availability and incomes less reliable.",
    whoPays: "Small-scale fishing households, processors, and coastal consumers pay first when landings or access become unstable.",
    physicalLimit: "Marine food supply depends on fish actually reaching landing sites in usable volumes and within narrow spoilage windows.",
    defaultDriver: "Shifting stocks, variable access, and climate-disrupted port or landing conditions can sever the link between ocean productivity and local food supply.",
    systemLevers: [
      "Expanding cold-chain, landing-site, and small-port resilience in climate-exposed fisheries.",
      "Improving adaptive fisheries management where stock locations and seasonal access are shifting.",
      "Monitoring landing volatility so food-security planning reflects real fisheries dependence."
    ]
  },
  rice_paddy_methane_bubbles: {
    hiddenCost: "Continuous flooding of agricultural fields creates anaerobic soil environments that emit vast volumes of methane gas.",
    whoPays: "Smallholder rice farmers face regional water shortages, while the public absorbs the climate forcing of methane.",
    physicalLimit: "Water-saturated soils trigger obligate anaerobic methanogenic bacteria activity in the root zone.",
    defaultDriver: "Traditional rice cultivation models assume continuous ponding is required to control weeds.",
    systemLevers: [
      "Implementing alternate wetting and drying (AWD) irrigation to aerate soil.",
      "Breeding low-methane, high-yield rice cultivars that exude less root carbon.",
      "Upgrading agricultural water infrastructure to allow controlled field drainage."
    ],
    verdict: "unique"
  },
  beekeeping_colony_loss_rates: {
    hiddenCost: "Demographic collapse of commercial honeybee hives threatens pollination security for high-value specialty crops.",
    whoPays: "Apiary operators absorb colony replacement costs, while food consumers pay higher contract-driven food prices.",
    physicalLimit: "Compounding toxic chemical, parasite, and nutritional stressors overwhelm honeybee immune resilience.",
    defaultDriver: "Monoculture farming scales field sizes while relying on intensive systemic pesticide spray schedules.",
    systemLevers: [
      "Enacting restrictions on neonicotinoid pesticide applications during bloom periods.",
      "Integrating diverse floral forage strips and hedgerows into commercial fields.",
      "Breeding varroa-mite resistant honeybee genetics and enhancing viral research."
    ],
    verdict: "unique"
  },
  rock_phosphate_reserves_runout: {
    hiddenCost: "Finite geological rock phosphate reserves are mined and lost to marine runoff in a linear nutrient drawdown cycle.",
    whoPays: "Food consumers absorb fertilizer price spikes, and agricultural systems face input supply extortion risks.",
    physicalLimit: "Highly concentrated reserves mean phosphorus extraction is bound to narrow geopolitical chokepoints.",
    defaultDriver: "Commodity fertilizer markets treat mineral phosphorus as an cheap, unlimited disposable input.",
    systemLevers: [
      "Recycling municipal wastewater and organic farm manure to recover soil phosphorus.",
      "Deploying precision variable-rate fertilizer applicators to minimize field runoff.",
      "Breeding crop varieties with high phosphorus uptake efficiency."
    ],
    verdict: "unique"
  },
  horticulture_peat_extraction: {
    hiddenCost: "Industrial peat extraction for retail compost destroys ancient bogs, venting sequestered carbon into the atmosphere.",
    whoPays: "Future generations pay for lost carbon sinks, while the public loses critical bog biodiversity.",
    physicalLimit: "Peat bogs form at a rate of 1mm per year, making extraction an irreversible geological depletion.",
    defaultDriver: "Consumer gardening supply companies package cheap peat due to weak carbon extraction regulation.",
    systemLevers: [
      "Implementing retail bans on peat-containing composts for home gardeners.",
      "Subsidizing the production of sustainable alternative compost media.",
      "Restoring degraded peatlands by raising local water tables to re-wet bogs."
    ],
    verdict: "unique"
  },
  automotive_brake_dust_particulates: {
    hiddenCost: "Mechanical brake pad abrasion releases ultra-fine particulate matter that bypasses exhaust emission filters.",
    whoPays: "Urban populations suffer respiratory and vascular diseases, and health systems absorb treatment costs.",
    physicalLimit: "Friction deceleration requires pad-rotor contact, generating microscopic dust down to nanoparticle scales.",
    defaultDriver: "Auto emission standards historically target tailpipe gases, ignoring heavy non-exhaust friction dust.",
    systemLevers: [
      "Imposing Euro 7 non-exhaust brake particulate limits on all passenger cars.",
      "Maximizing vehicle regenerative braking systems to limit rotor friction contact.",
      "Applying hard-wearing coatings to brake rotors via laser metal deposition."
    ],
    verdict: "unique"
  },
  hydroelectric_reservoir_silt: {
    hiddenCost: "Natural river silt accumulation behind hydroelectric dams displaces water storage volume over decades.",
    whoPays: "Grid operators lose dispatchable baseload storage capacity, and agricultural regions lose irrigation reserves.",
    physicalLimit: "Dams act as absolute physical barriers, trapping sediment until reservoir volume is erased.",
    defaultDriver: "Hydroelectric project financing models assume permanent reservoir storage capacity across multi-decade amortization.",
    systemLevers: [
      "Installing sediment bypass tunnels to route silt around dam structures.",
      "Conducting active hydro-suction dredging to clean reservoir basins.",
      "Accelerating upstream reforestation to control soil erosion rates."
    ],
    verdict: "unique"
  },
  cement_clinker_kiln_calcination: {
    verdict: "minimal",
    inheritsFrom: "cement_process_emissions"
  }
};

function cloneHumanImpactProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    domains: [...(profile.domains || [])],
    affectedPopulations: [...(profile.affectedPopulations || [])],
    primaryPathways: [...(profile.primaryPathways || [])],
    consequences: [...(profile.consequences || [])]
  };
}

function clonePlanetImpactProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    domains: [...(profile.domains || [])],
    affectedSystems: [...(profile.affectedSystems || [])],
    primaryPathways: [...(profile.primaryPathways || [])],
    consequences: [...(profile.consequences || [])]
  };
}

function lowerFirstToken(text) {
  if (!text) return '';
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function joinWithAnd(items) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}, and ${filtered[filtered.length - 1]}`;
}

function getHumanImpactProfileForNode(node, anchorNode = null) {
  const curated = HUMAN_IMPACT_PROFILES[node.id];
  if (curated) {
    return cloneHumanImpactProfile(curated);
  }

  // Anchor similarity is useful for discovery and layout, but it does not
  // establish a node-specific human-impact claim.
  return null;
}

function getPlanetImpactProfileForNode(node, anchorNode = null) {
  const curated = PLANET_IMPACT_PROFILES[node.id];
  if (curated) {
    return clonePlanetImpactProfile(curated);
  }

  // Do not convert a calibration anchor into ecological evidence. The UI
  // renders a disclosed node-text heuristic until a curated profile exists.
  return null;
}

function getEconomicContextForNode(node, anchorNode = null) {
  const curated = ECONOMIC_CONTEXT_PROFILES[node.id];
  if (curated && curated.verdict !== 'minimal') {
    return {
      ...curated,
      verdict: 'unique',
      confidence: 'curated',
      basis: 'curated_anchor_v1'
    };
  }

  if (curated && curated.verdict === 'minimal') {
    const sourceId = curated.inheritsFrom || anchorNode?.id;
    const sourceProfile = ECONOMIC_CONTEXT_PROFILES[sourceId] || anchorNode?.economicContext;
    const sourceName = sourceId === anchorNode?.id ? anchorNode?.name : (sourceId ? sourceId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Anchor');
    if (sourceProfile) {
      return {
        ...sourceProfile,
        verdict: 'minimal',
        inheritsFrom: sourceId,
        confidence: 'inherited',
        basis: `inherited_from:${sourceId}`,
        inheritedFrom: sourceName
      };
    }
  }

  // Do not silently reuse an anchor or sphere-wide template as node-specific
  // economic evidence. A missing profile is rendered as an explicit research
  // boundary until this node has a curated profile or an authored inheritance
  // declaration in ECONOMIC_CONTEXT_PROFILES.
  return null;
}

function attachImpactProfiles(node, anchorNode = null) {
  return {
    ...node,
    humanImpact: node.humanImpact || getHumanImpactProfileForNode(node, anchorNode),
    planetImpact: node.planetImpact || getPlanetImpactProfileForNode(node, anchorNode),
    economicContext: node.economicContext || getEconomicContextForNode(node, anchorNode)
  };
}

const ANCHOR_ROUTING_RULES = [
  { anchorId: 'ai_data_centers', keywords: ['ai_data', 'training_cluster', 'gpu', 'llm', 'inference', 'compute'] },
  { anchorId: 'data_centers', keywords: ['data_center', 'server', 'cloud_region', 'hyperscale', 'cooling_water', 'backup_diesel', 'substation_thermal'] },
  { anchorId: 'semiconductor_fabs', keywords: ['semiconductor', 'chip_fab', 'foundry', 'ultrapure_water', 'f_gas', 'advanced_packaging'] },
  { anchorId: 'telecom_backbone', keywords: ['telecom', 'backbone', 'fiber_route', 'switching_node', 'network_core'] },
  { anchorId: 'mobile_wireless_networks', keywords: ['tower', 'wireless', 'cellular', 'radio_access', 'backhaul'] },
  { anchorId: 'internet_exchange_points', keywords: ['internet_exchange', 'ixp', 'carrier_hotel', 'interconnection'] },
  { anchorId: 'subsea_cables', keywords: ['subsea', 'submarine_cable', 'landing_station'] },
  { anchorId: 'ozone_formation_pressure', keywords: ['tropospheric_ozone', 'ground_ozone', 'ozone'] },
  { anchorId: 'aerosol_cooling_loss', keywords: ['aerosol', 'particulate', 'pm2_5', 'sulphate', 'sulfate', 'soot', 'black_carbon', 'stratospheric', 'cfc', 'acid_rain'] },
  { anchorId: 'pollinator_service_decline', keywords: ['pollinator', 'pollen'] },
  { anchorId: 'coastal_hypoxia', keywords: ['anoxic', 'hypoxia', 'dead_zone', 'dead_zones', 'algal_bloom'] },
  { anchorId: 'marine_fisheries_collapse', keywords: ['fishery', 'fisheries', 'phytoplankton', 'benthic', 'pelagic', 'marine_heatwave'] },
  { anchorId: 'mangrove_buffer_loss', keywords: ['mangrove'] },
  { anchorId: 'reef_structural_collapse', keywords: ['reef', 'coral', 'calcification'] },
  { anchorId: 'ice_sheet_mass_loss', keywords: ['ice_sheet', 'ice_shelf', 'shelf_instability', 'glacial', 'glacier', 'ice_sheet_thinning'] },
  { anchorId: 'sea_ice_season_loss', keywords: ['sea_ice', 'arctic_ice'] },
  { anchorId: 'permafrost_thaw', keywords: ['permafrost', 'talik', 'thermokarst', 'ice_road'] },
  { anchorId: 'glacial_lake_failure_risk', keywords: ['glacial_lake', 'outburst_flood', 'glof'] },
  { anchorId: 'river_flow_regime_shift', keywords: ['runoff', 'river_flow', 'snowmelt_timing', 'hydrological'] },
  { anchorId: 'reservoir_operating_shortfall', keywords: ['reservoir', 'storage_shortfall', 'dam_operation'] },
  { anchorId: 'wastewater_bypass_discharge', keywords: ['wastewater', 'sewer_overflow', 'combined_sewer', 'outfall'] },
  { anchorId: 'aquifer_overdraft', keywords: ['aquifer', 'groundwater', 'well', 'salinization', 'water_table'] },
  { anchorId: 'vector_borne_disease_expansion', keywords: ['zoonotic', 'pathogen', 'vector_borne', 'disease', 'chytrid', 'outbreak'] },
  { anchorId: 'critical_infrastructure_fragility', keywords: ['infrastructure_cost', 'early_warning', 'recovery', 'warning_coverage', 'treatment_stress'] },
  { anchorId: 'shipping', keywords: ['cargo_ship', 'supertanker', 'bulk_ore_carrier', 'inland_waterway'] },
  { anchorId: 'shipping_lane_disruption', keywords: ['shipping', 'cargo_ship', 'heavy_fuel_oil'] },
  { anchorId: 'aviation_demand_growth', keywords: ['aviation', 'jet_fuel', 'airport'] },
  { anchorId: 'airport_operational_disruption', keywords: ['airport_delay', 'runway_disruption', 'flight_disruption'] },
  { anchorId: 'road_freight_diesel_lock_in', keywords: ['delivery_vehicle', 'diesel_lock_in', 'freeway', 'road_freight'] },
  { anchorId: 'rail_heat_buckling', keywords: ['rail'] },
  { anchorId: 'port_heat_vulnerability', keywords: ['port'] },
  { anchorId: 'food_waste', keywords: ['food_waste', 'supermarket_food_waste'] },
  { anchorId: 'plastics_petrochemicals', keywords: ['plastic', 'styrofoam', 'petrochemical'] },
  { anchorId: 'mining_critical_minerals', keywords: ['lithium', 'uranium', 'critical_mineral', 'mineral_extraction'] },
  { anchorId: 'cement_concrete', keywords: ['cement', 'clinker', 'concrete'] },
  { anchorId: 'steel', keywords: ['steel', 'blast_furnace'] },
  { anchorId: 'fertilizer_production', keywords: ['synthetic_fertilizer', 'ammonia_gas', 'nitrogen_fertilizer'] },
  { anchorId: 'air_conditioning_refrigerants', keywords: ['refrigerant', 'freon', 'hydrofluorocarbon', 'cooling_tower'] },
  { anchorId: 'industry_farming', keywords: ['fertilizer', 'pig_farm', 'broiler', 'grazing', 'irrigation', 'livestock', 'crop', 'agricultural', 'soil_carbon', 'topsoil'] },
  { anchorId: 'fish_landing_supply_disruption', keywords: ['fish_landing', 'landing_site', 'fish_supply', 'small_scale_fishery'] },
  { anchorId: 'utility_disconnection_risk', keywords: ['utility_shutoff', 'disconnection', 'arrears', 'energy_burden'] },
  { anchorId: 'fast_fashion', keywords: ['fashion', 'textile', 'apparel'] },
  { anchorId: 'deforestation', keywords: ['forest', 'canopy', 'logging', 'savannization', 'grassland'] },
  { anchorId: 'carbon_emission', keywords: ['carbon', 'co2', 'combustion', 'coal', 'oil', 'fuel', 'smelter', 'steel', 'cement', 'incinerator', 'fly_ash', 'vent', 'refrigerant'] },
  { anchorId: 'methane', keywords: ['methane', 'nitrous_oxide'] },
  { anchorId: 'wet_bulb_heat', keywords: ['wet_bulb', 'heatwave', 'heat_stress', 'nocturnal_heat', 'mortality'] },
  { anchorId: 'monsoon_volatility', keywords: ['monsoon', 'jet_stream', 'dust_storm', 'atmospheric_river'] },
  { anchorId: 'el_nino', keywords: ['nino'] },
  { anchorId: 'la_nina', keywords: ['nina', 'enso'] },
  { anchorId: 'amoc', keywords: ['amoc', 'thermohaline', 'overturning', 'gulf_stream', 'gyre', 'dipole', 'oscillation'] },
  { anchorId: 'resource_depletion', keywords: ['scarcity', 'depletion', 'desertification', 'water_conflict'] },
  { anchorId: 'migration', keywords: ['refugee', 'migrant', 'camp', 'displacement', 'retreat'] },
  { anchorId: 'urbanization', keywords: ['urban', 'suburban', 'city', 'metropolitan'] }
];

const SPHERE_FALLBACK_ANCHOR_IDS = {
  atmosphere: ['carbon_emission', 'methane', 'aerosol_cooling_loss', 'wet_bulb_heat', 'monsoon_volatility', 'tropical_cyclone_rapid_intensification', 'environ_anomalies', 'temp'],
  oceans: ['amoc', 'ocean_acidification', 'marine_fisheries_collapse', 'coastal_hypoxia', 'thermal_stratification_intensification', 'delta_salt_intrusion_fronts', 'oceanic_upwelling_disruptions', 'el_nino', 'la_nina'],
  cryosphere: ['permafrost_thaw', 'ice_sheet_mass_loss', 'sea_ice_season_loss', 'glacial_lake_failure_risk', 'rain_on_snow_flood_risk', 'peak_glacier_runoff_passage', 'coastal_permafrost_erosion', 'temp'],
  biosphere: ['deforestation', 'forest_fragmentation', 'pollinator_service_decline', 'biodiversity_intactness_loss', 'resource_depletion'],
  freshwater: ['water_stress', 'groundwater_depletion', 'river_flow_regime_shift', 'aquifer_overdraft', 'glacier_meltwater_dependency'],
  health: ['heat_related_mortality_burden', 'air_pollution_health_burden', 'occupational_heat_exposure', 'vector_borne_disease_expansion', 'public_health_heat_burden'],
  energy: ['carbon_emission', 'data_centers', 'ai_data_centers', 'cooling_water_competition', 'grid_peak_load_stress'],
  digital: ['data_centers', 'ai_data_centers', 'semiconductor_fabs', 'telecom_backbone', 'mobile_wireless_networks', 'internet_exchange_points', 'subsea_cables'],
  agriculture: ['industry_farming', 'crop_yield_volatility', 'resource_depletion', 'food', 'methane'],
  transport: ['personal_conveyance', 'road_freight_diesel_lock_in', 'aviation_demand_growth', 'shipping_lane_disruption', 'carbon_emission'],
  economy: ['carbon_emission', 'fast_fashion', 'resource_depletion', 'insurance_retreat', 'adaptation_capital_shortfall'],
  sociopolitical: ['migration', 'critical_infrastructure_fragility', 'food', 'resource_depletion', 'environ_anomalies']
};

const PROCEDURAL_FAMILY_BY_SPHERE = {
  atmosphere: 'atmospheric_patterns',
  oceans: 'ocean_regimes',
  cryosphere: 'cryosphere_frontiers',
  biosphere: 'biosphere_resilience',
  freshwater: 'freshwater_systems',
  health: 'public_health_systems',
  energy: 'energy_systems',
  digital: 'digital_infrastructure',
  agriculture: 'agriculture_food',
  transport: 'transport_systems',
  economy: 'materials_economy',
  sociopolitical: 'governance_finance'
};

const PROCEDURAL_FAMILY_DEFAULT_ANCHORS = {
  atmosphere: 'environ_anomalies',
  oceans: 'ocean_acidification',
  cryosphere: 'temp',
  biosphere: 'biodiversity_intactness_loss',
  freshwater: 'water_stress',
  health: 'heat_related_mortality_burden',
  energy: 'carbon_emission',
  digital: 'data_centers',
  agriculture: 'industry_farming',
  transport: 'personal_conveyance',
  economy: 'resource_depletion',
  sociopolitical: 'critical_infrastructure_fragility'
};

const PROCEDURAL_FAMILY_ANCHOR_POOLS = {
  atmosphere: ['environ_anomalies', 'aerosol_cooling_loss', 'monsoon_volatility', 'wet_bulb_heat', 'tropical_cyclone_rapid_intensification', 'carbon_emission'],
  oceans: ['ocean_acidification', 'marine_fisheries_collapse', 'coastal_hypoxia', 'marine_pathogen_range_expansion', 'thermal_stratification_intensification', 'delta_salt_intrusion_fronts', 'oceanic_upwelling_disruptions', 'amoc', 'mangrove_buffer_loss'],
  cryosphere: ['temp', 'permafrost_thaw', 'ice_sheet_mass_loss', 'sea_ice_season_loss', 'glacial_lake_failure_risk', 'rain_on_snow_flood_risk', 'peak_glacier_runoff_passage', 'coastal_permafrost_erosion'],
  biosphere: ['biodiversity_intactness_loss', 'deforestation', 'forest_fragmentation', 'pollinator_service_decline', 'resource_depletion'],
  freshwater: ['water_stress', 'groundwater_depletion', 'river_flow_regime_shift', 'aquifer_overdraft', 'glacier_meltwater_dependency', 'reservoir_storage_instability'],
  health: ['heat_related_mortality_burden', 'air_pollution_health_burden', 'occupational_heat_exposure', 'vector_borne_disease_expansion', 'public_health_heat_burden'],
  energy: ['carbon_emission', 'grid_peak_load_stress', 'cooling_water_competition', 'data_centers', 'critical_mineral_extraction_pressure'],
  digital: ['data_centers', 'ai_data_centers', 'semiconductor_fabs', 'telecom_backbone', 'internet_exchange_points', 'subsea_cables'],
  agriculture: ['industry_farming', 'crop_yield_volatility', 'aquifer_overdraft', 'methane', 'food'],
  transport: ['personal_conveyance', 'road_freight_diesel_lock_in', 'aviation_demand_growth', 'shipping_lane_disruption', 'rail_heat_buckling', 'port_heat_vulnerability'],
  economy: ['resource_depletion', 'fast_fashion', 'insurance_retreat', 'adaptation_capital_shortfall', 'mining_critical_minerals'],
  sociopolitical: ['critical_infrastructure_fragility', 'migration', 'public_health_heat_burden', 'disaster_recovery_inequality', 'relocation_governance_capacity', 'food_import_exposure']
};

function findNodeById(baseNodes, nodeId) {
  return baseNodes.find(node => node.id === nodeId) || null;
}

function selectAnchorByKeywordRules(baseNodes, idStr, excludedIds = []) {
  for (const rule of ANCHOR_ROUTING_RULES) {
    if (rule.keywords.some(keyword => idStr.includes(keyword))) {
      const match = findNodeById(baseNodes, rule.anchorId);
      if (match && !excludedIds.includes(match.id)) {
        return match;
      }
    }
  }
  return null;
}

function selectSphereFallbackAnchor(baseNodes, sphereKey, seed, excludedIds = []) {
  const preferredIds = (SPHERE_FALLBACK_ANCHOR_IDS[sphereKey] || []).filter(id => !excludedIds.includes(id));
  const preferredNodes = preferredIds.map(id => findNodeById(baseNodes, id)).filter(Boolean);
  if (preferredNodes.length > 0) {
    return seededChoice(preferredNodes, seed, `sphere-fallback:${sphereKey}:${excludedIds.join(',')}`);
  }

  const sameSphereNodes = baseNodes.filter(node => node.sphere === sphereKey && !excludedIds.includes(node.id));
  if (sameSphereNodes.length > 0) {
    return seededChoice(sameSphereNodes, seed, `sphere-any:${sphereKey}:${excludedIds.join(',')}`);
  }

  return seededChoice(baseNodes.filter(node => !excludedIds.includes(node.id)), seed, `fallback-any:${excludedIds.join(',')}`);
}

function selectAnchorNode(baseNodes, idStr) {
  return selectAnchorByKeywordRules(baseNodes, idStr);
}

function selectProceduralFamilyAnchor(baseNodes, node) {
  const semanticAnchor = selectAnchorByKeywordRules(baseNodes, node.id);
  if (semanticAnchor && semanticAnchor.id !== node.id) return semanticAnchor;

  const defaultAnchorId = PROCEDURAL_FAMILY_DEFAULT_ANCHORS[node.sphere];
  return findNodeById(baseNodes, defaultAnchorId) || null;
}

function selectSecondaryProceduralFamilyAnchor(baseNodes, node, primaryAnchorId) {
  return (PROCEDURAL_FAMILY_ANCHOR_POOLS[node.sphere] || [])
    .map(anchorId => findNodeById(baseNodes, anchorId))
    .filter(Boolean)
    .filter(anchor => anchor.id !== primaryAnchorId && anchor.id !== node.id)
    .sort((a, b) => {
      const aRank = seededUnit(`${node.id}:${a.id}`, 'secondary-family-anchor');
      const bRank = seededUnit(`${node.id}:${b.id}`, 'secondary-family-anchor');
      if (aRank !== bRank) return bRank - aRank;
      return a.id.localeCompare(b.id);
    })[0] || null;
}

function scoreToBaseValue(score) {
  return Math.round(Math.max(20, Math.min(65, 18 + score * 4.6)));
}

function calibrateGeneratedNode(id, name, sphereKey, sphere, anchorNode) {
  const sphereVector = sphere.baseVector;
  const anchorVector = anchorNode ? anchorNode.vector : sphereVector;
  const sameSphereBoost = anchorNode && anchorNode.sphere === sphereKey ? 0.06 : -0.04;
  const anchorWeight = Math.max(0.52, Math.min(0.84, 0.68 + sameSphereBoost + seededRange(id, -0.05, 0.05, 'anchor-weight')));
  const jitterScale = 0.018;

  const vector = {
    climate_forcing: parseFloat(clamp01(
      sphereVector.climate_forcing * (1 - anchorWeight) +
      anchorVector.climate_forcing * anchorWeight +
      seededRange(id, -jitterScale, jitterScale, 'cf')
    ).toFixed(2)),
    ecological_damage: parseFloat(clamp01(
      sphereVector.ecological_damage * (1 - anchorWeight) +
      anchorVector.ecological_damage * anchorWeight +
      seededRange(id, -jitterScale, jitterScale, 'ed')
    ).toFixed(2)),
    human_drivenness: parseFloat(clamp01(
      sphereVector.human_drivenness * (1 - anchorWeight) +
      anchorVector.human_drivenness * anchorWeight +
      seededRange(id, -jitterScale, jitterScale, 'hd')
    ).toFixed(2)),
    societal_fallout: parseFloat(clamp01(
      sphereVector.societal_fallout * (1 - anchorWeight) +
      anchorVector.societal_fallout * anchorWeight +
      seededRange(id, -jitterScale, jitterScale, 'sf')
    ).toFixed(2))
  };

  const sphereBaseValue = scoreToBaseValue(calculateBaselineScore(sphereVector));
  const anchorBaseValue = anchorNode ? anchorNode.baseValue : sphereBaseValue;
  const baseValue = Math.round(Math.max(20, Math.min(
    65,
    anchorBaseValue * 0.7 +
    sphereBaseValue * 0.3 +
    seededRange(id, -4, 4, 'baseValue')
  )));

  const lineage = anchorNode ? `${anchorNode.name} anchor` : `${sphereKey} sphere profile`;
  const description = `Earth system parameter calibrated from the ${lineage} and ${sphereKey} domain profile. Weighted to preserve comparable climate forcing, ecological damage, human drivenness, and societal fallout relationships across the procedural network.`;

  return { vector, baseValue, description, anchorWeight };
}

const RESPONSE_SOURCE_PROFILES = {
  energy: {
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-6/',
      'https://www.iea.org/reports/net-zero-by-2050'
    ],
    notes: 'Energy-system response pathways are grounded in IPCC AR6 WGIII Chapter 6 and the IEA net-zero transition assessment.'
  },
  buildings: {
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-9/',
      'https://www.iea.org/energy-system/buildings'
    ],
    notes: 'Building response pathways are grounded in IPCC AR6 WGIII Chapter 9 and IEA buildings analysis.'
  },
  transport: {
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/',
      'https://www.iea.org/energy-system/transport'
    ],
    notes: 'Transport response pathways are grounded in IPCC AR6 WGIII Chapter 10 and IEA transport analysis.'
  },
  industry: {
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-11/',
      'https://www.iea.org/energy-system/industry'
    ],
    notes: 'Industry response pathways are grounded in IPCC AR6 WGIII Chapter 11 and IEA industry transition analysis.'
  },
  land: {
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-7/',
      'https://www.decadeonrestoration.org/'
    ],
    notes: 'Land and ecosystem responses are grounded in IPCC AR6 WGIII Chapter 7 and the UN Decade on Ecosystem Restoration.'
  },
  adaptation: {
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg2/',
      'https://www.unep.org/resources/adaptation-gap-report-2025'
    ],
    notes: 'Adaptation responses are grounded in IPCC AR6 WGII and the UNEP Adaptation Gap Report.'
  },
  warning: {
    source_urls: [
      'https://wmo.int/activities/early-warnings-all',
      'https://www.undrr.org/early-warning-for-all'
    ],
    notes: 'Early-warning responses are grounded in the WMO and UNDRR Early Warnings for All programme.'
  },
  food_water: {
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/',
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/',
      'https://www.fao.org/climate-change/en'
    ],
    notes: 'Food and water adaptation pathways are grounded in IPCC AR6 WGII Chapters 4 and 5 and FAO climate guidance.'
  }
};

const RESPONSE_NODE_ADJECTIVES = [
  { min: 0, max: 25, label: 'Supporting' },
  { min: 25, max: 50, label: 'Enabling' },
  { min: 50, max: 75, label: 'High-Leverage' },
  { min: 75, max: 100, label: 'Transformative' }
];

function getResponseLeverageLabel(score) {
  if (score >= 8.5) return 'Transformative';
  if (score >= 7) return 'High leverage';
  if (score >= 5) return 'Enabling';
  return 'Supporting';
}

function createResponseNode(spec) {
  const sources = RESPONSE_SOURCE_PROFILES[spec.source_family];
  const overall = spec.overall;
  const baseValue = Math.round(18 + overall * 4.6);
  const benefits = spec.benefits || [];
  const planetBenefits = spec.planet_benefits || benefits;
  const tradeoffs = spec.tradeoffs || [];
  const systemLevers = spec.system_levers || [];
  const firstBenefit = benefits[0] || 'reduce climate exposure and system stress.';
  const humanSummary = spec.human_summary
    || `For people, this response ${firstBenefit.charAt(0).toLowerCase()}${firstBenefit.slice(1)}`;

  return {
    id: spec.id,
    name: spec.name,
    node_kind: 'response',
    response_family: spec.source_family,
    vector: {
      climate_forcing: spec.residual_forcing ?? 0.12,
      ecological_damage: spec.residual_ecological_risk ?? 0.16,
      human_drivenness: spec.feasibility / 10,
      societal_fallout: spec.delivery_risk ?? 0.18
    },
    baseValue,
    value: baseValue,
    sphere: spec.sphere,
    description: spec.description,
    adjectives: RESPONSE_NODE_ADJECTIVES,
    responseProfile: {
      overall,
      band: getResponseLeverageLabel(overall),
      mitigation: spec.mitigation,
      adaptation: spec.adaptation,
      feasibility: spec.feasibility,
      co_benefits: spec.co_benefits,
      summary: spec.description,
      tradeoffs,
      source_urls: sources.source_urls,
      api_keys: [],
      notes: sources.notes
    },
    humanImpact: {
      summary: humanSummary,
      domains: spec.human_domains || ['Health', 'Affordability', 'Resilience'],
      affectedPopulations: spec.beneficiaries || ['Climate-exposed communities', 'Low-income households', 'Workers'],
      consequences: benefits,
      timeHorizon: spec.time_horizon || 'near_and_long_term',
      confidence: 'curated',
      basis: 'curated_response_pathway_v1'
    },
    planetImpact: {
      summary: spec.planet_summary || `This response reduces pressure on climate and ecological systems when it is deployed with its trade-offs managed.`,
      domains: spec.planet_domains || ['Atmosphere', 'Resilience', 'Ecosystems'],
      affectedSystems: spec.affected_systems || ['Climate system', 'Built environment', 'Local ecosystems'],
      consequences: planetBenefits,
      timeHorizon: spec.time_horizon || 'near_and_long_term',
      confidence: 'curated',
      basis: 'curated_response_pathway_v1'
    },
    economicContext: {
      hiddenCost: tradeoffs[0] || 'Upfront investment, permitting, supply-chain capacity, and equitable delivery can constrain deployment.',
      whoPays: spec.who_pays || 'Costs and benefits depend on how public finance, utility rates, private capital, and household support are designed.',
      physicalLimit: spec.physical_limit || 'Deployment is constrained by infrastructure, skilled labor, materials, land, and institutional capacity.',
      defaultDriver: spec.default_driver || 'Existing markets and rules often reward incumbent systems and underprice long-term climate benefits.',
      systemLevers,
      verdict: 'response',
      confidence: 'curated',
      basis: 'curated_response_pathway_v1'
    }
  };
}

const RESPONSE_SYSTEM_NODES = [
  createResponseNode({ id: 'clean_electricity', name: 'Clean Electricity', sphere: 'energy', source_family: 'energy', overall: 9.4, mitigation: 9.8, adaptation: 4.5, feasibility: 8.2, co_benefits: 8.8, description: 'Low-emissions power is the backbone response that lets buildings, vehicles, and parts of industry cut fossil-fuel use without shifting emissions back to the grid.', benefits: ['Cuts harmful combustion pollution when fossil generation retires.', 'Reduces exposure to volatile fossil-fuel prices.', 'Enables cleaner heating, transport, and industrial processes.'], planet_benefits: ['Lowers long-lived greenhouse-gas emissions.', 'Reduces fossil extraction and combustion pressure.', 'Creates a platform for wider electrification.'], tradeoffs: ['Requires fast grid expansion, storage, permitting, and careful siting to limit land and mineral impacts.'], system_levers: ['Build low-emissions generation and transmission together.', 'Retire high-emitting generation as clean capacity becomes reliable.', 'Use planning rules that protect communities and ecosystems.'] }),
  createResponseNode({ id: 'coal_retirement', name: 'Coal Power Retirement', sphere: 'energy', source_family: 'energy', overall: 9.1, mitigation: 9.6, adaptation: 3.0, feasibility: 7.1, co_benefits: 9.1, description: 'Planned coal-plant retirement removes one of the most carbon-intensive power sources while avoiding abrupt closures that abandon workers and communities.', benefits: ['Reduces particulate and sulfur pollution near power plants.', 'Avoids major health burdens from coal combustion.', 'Creates a planned transition window for workers and regions.'], planet_benefits: ['Cuts carbon dioxide emissions rapidly.', 'Reduces coal mining and ash-disposal damage.', 'Makes room for lower-emissions generation.'], tradeoffs: ['Poorly planned closures can strand workers, local tax bases, and grid capacity.'], system_levers: ['Set dated retirement schedules tied to replacement capacity.', 'Fund worker, pension, and regional transition plans.', 'Prevent life-extension subsidies for uneconomic plants.'] }),
  createResponseNode({ id: 'renewable_energy_deployment', name: 'Renewable Energy Deployment', sphere: 'energy', source_family: 'energy', overall: 9.2, mitigation: 9.6, adaptation: 4.0, feasibility: 8.5, co_benefits: 8.2, description: 'Scaling wind, solar, geothermal, and sustainable hydro displaces fossil generation when it is paired with grids, flexibility, and responsible siting.', benefits: ['Reduces air pollution from fuel combustion.', 'Can stabilize operating costs because wind and sunlight have no fuel price.', 'Expands domestic energy options.'], planet_benefits: ['Cuts power-sector greenhouse-gas emissions.', 'Reduces continued fossil extraction.', 'Can lower water use compared with thermal power.'], tradeoffs: ['Land, transmission, mineral demand, wildlife impacts, and local consent must be managed rather than ignored.'], system_levers: ['Coordinate generation with transmission and storage.', 'Use biodiversity-sensitive siting and community benefit agreements.', 'Speed permitting without removing environmental safeguards.'] }),
  createResponseNode({ id: 'grid_scale_storage', name: 'Grid-Scale Energy Storage', sphere: 'energy', source_family: 'energy', overall: 8.3, mitigation: 8.3, adaptation: 5.5, feasibility: 7.8, co_benefits: 7.3, description: 'Storage shifts electricity across hours and seasons, helping variable clean power meet demand and reducing reliance on high-emitting peaker plants.', benefits: ['Improves reliability during short supply-demand gaps.', 'Reduces use of expensive and polluting peaker plants.', 'Can support critical services during outages.'], planet_benefits: ['Reduces renewable-energy curtailment.', 'Supports deeper displacement of fossil generation.', 'Creates flexibility for electrified buildings and transport.'], tradeoffs: ['Battery supply chains can increase mining, water, fire-safety, and recycling pressures.'], system_levers: ['Value flexibility and reliability in electricity markets.', 'Require battery recycling and responsible mineral sourcing.', 'Deploy a mix of short- and long-duration technologies.'] }),
  createResponseNode({ id: 'demand_response', name: 'Demand Response', sphere: 'energy', source_family: 'energy', overall: 7.8, mitigation: 7.4, adaptation: 6.2, feasibility: 8.3, co_benefits: 7.2, description: 'Demand response pays or automates flexible electricity use so demand shifts away from stressed hours instead of requiring another fossil peaker plant.', benefits: ['Can lower peak electricity costs.', 'Reduces outage risk when the grid is strained.', 'Lets households and businesses participate in grid flexibility when protections are fair.'], planet_benefits: ['Reduces peaker-plant operation.', 'Makes better use of available clean generation.', 'Limits unnecessary grid and generation buildout.'], tradeoffs: ['Badly designed programs can shift discomfort or risk onto households that have the least flexibility.'], system_levers: ['Guarantee opt-outs and consumer protections.', 'Reward verified flexibility rather than simple curtailment.', 'Pair automation with bill support and efficient appliances.'] }),
  createResponseNode({ id: 'methane_leak_detection', name: 'Methane Leak Detection and Repair', sphere: 'atmosphere', source_family: 'energy', overall: 8.8, mitigation: 9.3, adaptation: 2.5, feasibility: 8.5, co_benefits: 7.4, description: 'Satellites, aircraft, ground sensors, and routine inspections can find large methane leaks quickly enough for operators and regulators to stop avoidable emissions.', benefits: ['Reduces hazardous co-pollutants around oil and gas facilities.', 'Prevents saleable gas from being wasted.', 'Makes invisible leaks visible to regulators and the public.'], planet_benefits: ['Cuts a powerful near-term warming pollutant.', 'Improves accountability for fossil-system emissions.', 'Supports faster repair of super-emitting events.'], tradeoffs: ['Detection only works when reporting rules, repair deadlines, and enforcement turn observations into action.'], system_levers: ['Use open satellite and aerial observations to target inspections.', 'Require rapid repair and public disclosure of large leaks.', 'Measure outcomes rather than relying only on self-reported inventories.'] }),
  createResponseNode({ id: 'refrigerant_phase_down', name: 'Refrigerant Phase-Down', sphere: 'atmosphere', source_family: 'buildings', overall: 8.4, mitigation: 8.8, adaptation: 5.8, feasibility: 8.0, co_benefits: 7.0, description: 'Replacing high-warming refrigerants, preventing leaks, and recovering gases at end of life cuts climate pollution while preserving access to cooling.', benefits: ['Keeps cooling available with lower climate impact.', 'Improves maintenance and technician safety.', 'Reduces household losses from leaking equipment.'], planet_benefits: ['Cuts high-global-warming-potential gas emissions.', 'Reduces avoidable leakage across equipment lifecycles.', 'Supports efficient cooling as heat risk rises.'], tradeoffs: ['New refrigerants require safe equipment standards, trained technicians, and responsible recovery systems.'], system_levers: ['Enforce leak checks and end-of-life recovery.', 'Train technicians for lower-impact refrigerants.', 'Pair refrigerant rules with energy-efficiency standards.'] }),
  createResponseNode({ id: 'carbon_dioxide_removal', name: 'Carbon Dioxide Removal', sphere: 'atmosphere', source_family: 'energy', overall: 7.2, mitigation: 8.0, adaptation: 2.5, feasibility: 4.8, co_benefits: 4.5, description: 'Carbon dioxide removal can counter residual emissions, but it is a limited complement to rapid emissions cuts—not a substitute for delaying them.', benefits: ['Can address hard-to-eliminate residual emissions.', 'Creates monitoring and stewardship work when projects are durable.', 'May support ecosystem recovery for carefully designed land-based approaches.'], planet_benefits: ['Removes carbon dioxide from the atmosphere when storage is durable.', 'Can restore soils or ecosystems in some land-based pathways.', 'Provides a tool for balancing residual emissions.'], tradeoffs: ['Energy, land, water, permanence, cost, and moral-hazard risks vary sharply across removal methods.'], system_levers: ['Separate emissions reductions from removals in targets.', 'Require durable storage and transparent monitoring.', 'Limit credits that delay direct fossil-emissions cuts.'] }),

  createResponseNode({ id: 'building_energy_efficiency', name: 'Building Energy Efficiency', sphere: 'energy', source_family: 'buildings', overall: 8.9, mitigation: 8.8, adaptation: 7.0, feasibility: 8.6, co_benefits: 9.1, description: 'Better insulation, windows, lighting, controls, and appliances reduce the energy needed to keep buildings safe and comfortable.', benefits: ['Lowers energy bills and exposure to price spikes.', 'Keeps indoor temperatures safer during heat and cold.', 'Improves comfort and can reduce indoor pollution.'], planet_benefits: ['Cuts electricity and fuel demand.', 'Reduces peak-load pressure on the grid.', 'Shrinks the generation and infrastructure needed for energy services.'], tradeoffs: ['Upfront costs, landlord-tenant incentives, and poor retrofit quality can block benefits or leave renters behind.'], system_levers: ['Set strong appliance and building standards.', 'Fund deep retrofits for low-income housing.', 'Measure real energy performance after work is complete.'] }),
  createResponseNode({ id: 'heat_pump_electrification', name: 'Heat Pump Electrification', sphere: 'energy', source_family: 'buildings', overall: 8.6, mitigation: 8.8, adaptation: 6.8, feasibility: 8.0, co_benefits: 8.4, description: 'Heat pumps move heat rather than creating it through combustion, providing efficient heating and cooling as electricity gets cleaner.', benefits: ['Can reduce heating costs in efficient buildings.', 'Removes indoor combustion pollution from furnaces.', 'Provides cooling during dangerous heat.'], planet_benefits: ['Reduces direct fossil-fuel use in buildings.', 'Uses electricity efficiently for heating and cooling.', 'Links building decarbonization to cleaner grids.'], tradeoffs: ['Peak electricity demand, refrigerants, equipment cost, and poor building envelopes can weaken results.'], system_levers: ['Pair installations with weatherization and panel upgrades.', 'Use performance standards suited to local climates.', 'Protect renters and low-income households from upgrade costs.'] }),
  createResponseNode({ id: 'weatherization_retrofits', name: 'Weatherization Retrofits', sphere: 'energy', source_family: 'buildings', overall: 8.0, mitigation: 7.7, adaptation: 7.8, feasibility: 8.4, co_benefits: 9.0, description: 'Air sealing, insulation, shading, and moisture control make existing homes cheaper to run and safer during heat, cold, smoke, and outages.', benefits: ['Reduces household energy bills.', 'Improves thermal safety during outages.', 'Can reduce drafts, moisture, mold, and outdoor smoke infiltration.'], planet_benefits: ['Reduces heating and cooling demand.', 'Lowers peak grid stress.', 'Extends the useful life of existing buildings.'], tradeoffs: ['Unsafe materials, poor ventilation, and weak quality control can create indoor-air or moisture problems.'], system_levers: ['Prioritize high-burden households and rental housing.', 'Require health, ventilation, and quality checks.', 'Coordinate weatherization with electrification upgrades.'] }),
  createResponseNode({ id: 'passive_cooling_design', name: 'Passive Cooling Design', sphere: 'sociopolitical', source_family: 'buildings', overall: 7.7, mitigation: 6.8, adaptation: 8.5, feasibility: 8.1, co_benefits: 8.6, description: 'Shade, ventilation, reflective surfaces, thermal mass, trees, and building form can keep spaces cooler before mechanical air conditioning is needed.', benefits: ['Reduces dangerous indoor heat.', 'Lowers cooling bills and outage vulnerability.', 'Improves public space and neighborhood comfort.'], planet_benefits: ['Reduces cooling-energy demand.', 'Lowers peak electricity stress.', 'Can add vegetation and habitat when green infrastructure is used.'], tradeoffs: ['Designs must fit local humidity, smoke, security, water, and maintenance conditions.'], system_levers: ['Put passive cooling into building codes and public procurement.', 'Expand shade and cool-roof programs in heat-vulnerable areas.', 'Preserve safe ventilation and indoor-air-quality controls.'] }),
  createResponseNode({ id: 'building_performance_standards', name: 'Building Performance Standards', sphere: 'sociopolitical', source_family: 'buildings', overall: 8.2, mitigation: 8.3, adaptation: 6.7, feasibility: 7.4, co_benefits: 8.1, description: 'Measured building-performance standards require large buildings to improve actual energy or emissions outcomes over time instead of relying only on design intent.', benefits: ['Creates predictable retrofit demand and skilled jobs.', 'Can lower operating costs and improve comfort.', 'Makes inefficient buildings visible to owners and regulators.'], planet_benefits: ['Cuts operational energy use and emissions.', 'Accelerates efficiency and electrification upgrades.', 'Provides measured accountability for building decarbonization.'], tradeoffs: ['Compliance costs can be passed to tenants unless affordability and financing protections are built in.'], system_levers: ['Set phased targets using measured performance.', 'Provide finance and technical support for difficult buildings.', 'Protect tenants from displacement and cost pass-through.'] }),

  createResponseNode({ id: 'public_transit_expansion', name: 'Public Transit Expansion', sphere: 'transport', source_family: 'transport', overall: 8.3, mitigation: 8.0, adaptation: 6.3, feasibility: 7.1, co_benefits: 9.2, description: 'Frequent, reliable transit reduces the need for private car trips while expanding access to work, school, health care, and essential services.', benefits: ['Lowers household transport costs.', 'Improves access for people who cannot drive.', 'Reduces traffic injuries and roadside pollution when service replaces car travel.'], planet_benefits: ['Cuts vehicle travel and fuel use.', 'Supports compact, lower-carbon urban form.', 'Reduces land demand for roads and parking.'], tradeoffs: ['Benefits depend on reliable service, safe access, equitable fares, and land-use policy that prevents displacement.'], system_levers: ['Fund frequent service before prestige projects.', 'Integrate transit with housing and safe walking routes.', 'Use affordable fares and anti-displacement protections.'] }),
  createResponseNode({ id: 'active_mobility', name: 'Walking and Cycling Networks', sphere: 'transport', source_family: 'transport', overall: 7.6, mitigation: 6.8, adaptation: 5.8, feasibility: 8.0, co_benefits: 9.4, description: 'Safe walking, cycling, and wheelchair networks replace short car trips while improving health and access to daily needs.', benefits: ['Increases routine physical activity.', 'Reduces household transport costs.', 'Creates safer, quieter neighborhood streets.'], planet_benefits: ['Cuts fuel use for short trips.', 'Reduces road and parking demand.', 'Supports compact land use.'], tradeoffs: ['Networks fail when routes are fragmented, unsafe, inaccessible, or exposed to extreme heat and pollution.'], system_levers: ['Build continuous protected networks.', 'Connect homes to transit, schools, shops, and jobs.', 'Add shade, accessibility, safe crossings, and maintenance.'] }),
  createResponseNode({ id: 'electric_vehicle_transition', name: 'Electric Vehicle Transition', sphere: 'transport', source_family: 'transport', overall: 7.9, mitigation: 8.1, adaptation: 3.8, feasibility: 8.0, co_benefits: 7.6, description: 'Electric vehicles can cut oil use and urban tailpipe pollution, especially as grids get cleaner, but they do not solve congestion, road danger, or car-dependent land use.', benefits: ['Removes tailpipe pollution from streets.', 'Reduces exposure to oil-price shocks.', 'Can lower operating and maintenance costs.'], planet_benefits: ['Cuts lifecycle emissions as electricity gets cleaner.', 'Reduces petroleum demand.', 'Can provide flexible charging to the grid.'], tradeoffs: ['Battery minerals, vehicle size, tire pollution, charging access, and continued car dependence remain material impacts.'], system_levers: ['Clean the grid and manage charging.', 'Set battery durability, repair, and recycling rules.', 'Prioritize transit and smaller vehicles alongside electrification.'] }),
  createResponseNode({ id: 'low_carbon_cement', name: 'Low-Carbon Cement and Concrete', sphere: 'economy', source_family: 'industry', overall: 7.8, mitigation: 8.3, adaptation: 4.0, feasibility: 6.9, co_benefits: 6.2, description: 'Material efficiency, lower-clinker blends, alternative binders, clean heat, and carbon capture can reduce the process and fuel emissions built into concrete.', benefits: ['Can reduce construction emissions without eliminating essential infrastructure.', 'Creates markets for lower-carbon materials and skilled industrial work.', 'Improves material efficiency when designs use less concrete.'], planet_benefits: ['Cuts calcination and fuel emissions.', 'Reduces demand for limestone, fuel, and raw materials.', 'Can incorporate suitable industrial by-products with strong safeguards.'], tradeoffs: ['Standards, performance verification, feedstock availability, cost, and capture infrastructure limit which options work where.'], system_levers: ['Use low-carbon public procurement.', 'Update codes to permit verified lower-clinker materials.', 'Require transparent product-level emissions data.'] }),
  createResponseNode({ id: 'green_steel', name: 'Near-Zero Emissions Steel', sphere: 'economy', source_family: 'industry', overall: 7.9, mitigation: 8.6, adaptation: 3.5, feasibility: 6.5, co_benefits: 6.5, description: 'Material efficiency, scrap recycling, clean-electric furnaces, hydrogen-based reduction, and carbon capture can sharply reduce steel emissions.', benefits: ['Preserves essential industrial capacity while reducing pollution.', 'Creates demand for clean power, recycling, and new industrial skills.', 'Can reduce exposure to future carbon costs.'], planet_benefits: ['Cuts coal use and industrial carbon emissions.', 'Raises the value of high-quality recycled steel.', 'Reduces primary material demand when paired with efficiency.'], tradeoffs: ['Clean electricity, hydrogen, scrap quality, capital turnover, and infrastructure determine real-world feasibility.'], system_levers: ['Create demand through public procurement and product standards.', 'Build clean power and hydrogen infrastructure with industrial plans.', 'Protect workers and regions during plant conversion.'] }),
  createResponseNode({ id: 'ecosystem_restoration', name: 'Ecosystem Restoration', sphere: 'biosphere', source_family: 'land', overall: 8.2, mitigation: 7.2, adaptation: 8.6, feasibility: 7.5, co_benefits: 9.4, description: 'Restoring forests, wetlands, grasslands, rivers, reefs, and soils can rebuild carbon storage, biodiversity, water regulation, and local protection when the original drivers of loss are removed.', benefits: ['Supports livelihoods tied to healthy land and water.', 'Can reduce flood, heat, erosion, and water-quality risks.', 'Restores cultural and recreational value.'], planet_benefits: ['Rebuilds habitat and ecological connectivity.', 'Restores carbon storage and water regulation.', 'Strengthens ecosystem resilience to climate stress.'], tradeoffs: ['Poorly designed projects can displace communities, create monocultures, fail under future climate, or overclaim carbon benefits.'], system_levers: ['Protect intact ecosystems before restoring degraded ones.', 'Use native diversity and long-term stewardship.', 'Secure community and Indigenous rights and remove the original damage driver.'] }),

  createResponseNode({ id: 'multi_hazard_early_warning', name: 'Multi-Hazard Early Warning', sphere: 'sociopolitical', source_family: 'warning', overall: 8.8, mitigation: 1.5, adaptation: 9.5, feasibility: 8.2, co_benefits: 9.0, description: 'Forecasts save lives only when observations, communications, trusted messengers, evacuation options, and response plans deliver an understandable warning to everyone at risk.', benefits: ['Reduces deaths and injuries from fast-moving hazards.', 'Gives households and services time to protect people and assets.', 'Improves coordination across weather, health, emergency, and community systems.'], planet_benefits: ['Reduces secondary environmental damage from unmanaged emergencies.', 'Supports earlier protective action for ecosystems and infrastructure.', 'Improves monitoring of compound hazards.'], tradeoffs: ['A technically accurate forecast can still fail people who lack connectivity, trust, transport, shelter, or authority to act.'], system_levers: ['Close observation and last-mile communication gaps.', 'Design warnings with exposed communities and local languages.', 'Connect alerts to funded evacuation, shelter, health, and continuity plans.'] }),
  createResponseNode({ id: 'urban_heat_action_plans', name: 'Urban Heat Action Plans', sphere: 'sociopolitical', source_family: 'adaptation', overall: 8.3, mitigation: 3.5, adaptation: 9.1, feasibility: 8.4, co_benefits: 9.0, description: 'Heat action plans combine forecasts, public-health triggers, worker protections, outreach, cooling sites, shade, and building measures before dangerous heat arrives.', benefits: ['Reduces preventable heat illness and death.', 'Protects workers, older adults, children, and people without safe cooling.', 'Coordinates public health, utilities, employers, housing, and emergency services.'], planet_benefits: ['Can reduce emergency cooling peaks when paired with passive measures.', 'Expands urban shade and heat-resilient public space.', 'Creates data for targeted long-term heat reduction.'], tradeoffs: ['Plans without budgets, outreach, transport, worker rules, or safe housing can become paper exercises.'], system_levers: ['Set local heat-health thresholds and named responsibilities.', 'Protect workers and prevent utility shutoffs during heat emergencies.', 'Invest in shade, cool buildings, outreach, and accessible cooling.'] }),
  createResponseNode({ id: 'equitable_cooling_access', name: 'Equitable Cooling Access', sphere: 'sociopolitical', source_family: 'adaptation', overall: 8.0, mitigation: 3.5, adaptation: 9.0, feasibility: 7.7, co_benefits: 8.7, description: 'Safe cooling access combines efficient equipment, affordable electricity, weatherized housing, public cooling spaces, and outage protection for people most exposed to heat.', benefits: ['Prevents heat illness and death.', 'Protects medically vulnerable people during extreme heat.', 'Reduces the choice between paying energy bills and staying safe.'], planet_benefits: ['Efficient cooling reduces peak electricity and refrigerant pressure.', 'Weatherization limits unnecessary energy demand.', 'Passive measures reduce reliance on mechanical cooling.'], tradeoffs: ['Unmanaged cooling expansion can increase peak power demand, emissions, refrigerant leakage, and household debt.'], system_levers: ['Guarantee heat-season utility protections and targeted bill support.', 'Pair efficient cooling with weatherization and passive design.', 'Plan for outages, public access, and medically vulnerable residents.'] }),
  createResponseNode({ id: 'flood_resilient_infrastructure', name: 'Flood-Resilient Infrastructure', sphere: 'sociopolitical', source_family: 'adaptation', overall: 8.1, mitigation: 2.0, adaptation: 9.0, feasibility: 6.8, co_benefits: 7.8, description: 'Upgraded drainage, bridges, utilities, buildings, floodplains, and protective infrastructure reduce damage when rainfall, rivers, or seas exceed historical design conditions.', benefits: ['Keeps water, power, transport, hospitals, and communications operating.', 'Reduces repeated household losses and service outages.', 'Can lower disaster-recovery costs.'], planet_benefits: ['Nature-based designs can restore floodplains and wetlands.', 'Reduces sewage and hazardous-material releases during floods.', 'Protects freshwater and coastal ecosystems from infrastructure failures.'], tradeoffs: ['Hard defenses can transfer risk downstream, encourage unsafe development, damage ecosystems, or fail beyond their design level.'], system_levers: ['Use future climate conditions in design standards.', 'Combine gray infrastructure with floodplain and wetland restoration.', 'Avoid new development that relies on ever-higher defenses.'] }),
  createResponseNode({ id: 'water_reuse', name: 'Water Reuse and Recycling', sphere: 'freshwater', source_family: 'food_water', overall: 7.7, mitigation: 4.5, adaptation: 8.3, feasibility: 7.4, co_benefits: 7.8, description: 'Treating and reusing wastewater for industry, irrigation, recharge, or potable supply can reduce pressure on rivers and aquifers when health and energy safeguards are strong.', benefits: ['Creates a more reliable local water supply.', 'Reduces vulnerability to drought and import dependence.', 'Can improve wastewater treatment and pollution control.'], planet_benefits: ['Reduces freshwater withdrawals.', 'Limits polluted discharges when treatment is effective.', 'Can support environmental flows in stressed basins.'], tradeoffs: ['Treatment energy, contaminants, brine, public trust, and unequal pricing must be managed transparently.'], system_levers: ['Match treatment quality to end use and monitor contaminants.', 'Use clean energy and efficient treatment.', 'Protect affordability and environmental flows.'] }),
  createResponseNode({ id: 'climate_resilient_agriculture', name: 'Climate-Resilient Agriculture', sphere: 'agriculture', source_family: 'food_water', overall: 8.0, mitigation: 6.4, adaptation: 9.0, feasibility: 7.5, co_benefits: 8.8, description: 'Diversified crops, healthier soils, efficient water use, agroforestry, climate information, and risk protection help farms withstand heat, drought, flood, pests, and market shocks.', benefits: ['Stabilizes food production and farm income.', 'Improves soil water retention and reduces input exposure.', 'Protects farm workers and rural livelihoods.'], planet_benefits: ['Reduces erosion and nutrient loss.', 'Can rebuild soil carbon and on-farm biodiversity.', 'Uses water more efficiently when rebound demand is controlled.'], tradeoffs: ['No single practice is climate-resilient everywhere, and labels can hide continued water overuse, chemical dependence, or land expansion.'], system_levers: ['Fund locally tested practices and extension services.', 'Reward soil, water, biodiversity, and livelihood outcomes.', 'Pair adaptation with emissions cuts and worker protection.'] }),
  createResponseNode({ id: 'planned_relocation', name: 'Planned Relocation', sphere: 'sociopolitical', source_family: 'adaptation', overall: 7.2, mitigation: 1.0, adaptation: 8.7, feasibility: 4.8, co_benefits: 5.8, description: 'Planned relocation creates a rights-based path out of places that cannot be protected safely, while preserving housing, livelihoods, culture, services, and community choice.', benefits: ['Reduces repeated exposure to lethal or unaffordable hazards.', 'Creates time to secure housing, land, schools, and livelihoods.', 'Can preserve community cohesion better than emergency displacement.'], planet_benefits: ['Allows floodplains, shorelines, or fire-prone land to recover.', 'Reduces repeated rebuilding in high-risk ecosystems.', 'Can create space for wetlands and other protective systems.'], tradeoffs: ['Relocation can become coercive, culturally destructive, unequal, or financially devastating when communities do not control the process.'], system_levers: ['Establish voluntary, rights-based governance before crisis.', 'Guarantee fair compensation, land, services, and livelihood continuity.', 'Fund receiving communities and long-term cultural stewardship.'] }),
  createResponseNode({ id: 'nature_based_adaptation', name: 'Nature-Based Adaptation', sphere: 'biosphere', source_family: 'land', overall: 8.1, mitigation: 6.5, adaptation: 9.0, feasibility: 7.2, co_benefits: 9.3, description: 'Wetlands, mangroves, urban trees, healthy soils, dunes, reefs, and connected habitats can reduce flood, heat, erosion, and water risks while supporting biodiversity.', benefits: ['Reduces exposure to heat, flood, waves, and erosion.', 'Creates accessible green space and local livelihoods.', 'Improves water quality and neighborhood comfort.'], planet_benefits: ['Restores habitat and ecological function.', 'Stores carbon in vegetation and soils.', 'Reconnects fragmented landscapes and waterways.'], tradeoffs: ['Nature-based measures have physical limits and can fail if used to justify continued high-risk development or carbon emissions.'], system_levers: ['Protect existing ecosystems first.', 'Use future climate ranges and ecological monitoring in design.', 'Combine natural defenses with land-use limits and engineered protection where needed.'] })
];

// Curated anchor nodes that ground the larger procedural ecosystem
const BASE_NODES = [
  {
    id: 'temp',
    name: 'Global Temperature',
    vector: { climate_forcing: 0.9, ecological_damage: 0.8, human_drivenness: 0.4, societal_fallout: 0.9 },
    baseValue: 55,
    value: 55,
    sphere: 'atmosphere',
    description: 'Observed global mean surface temperature remained near 1.43 C above the 1850-1900 average in 2025, with WMO synthesis and the NASA GISTEMP, NOAA NCEI, and Berkeley Earth records used here as the anchor. Satellite products such as AIRS are treated as supporting atmospheric context rather than replacements for the surface temperature record.',
    adjectives: [
      { min: 0, max: 25, label: 'Stable' },
      { min: 25, max: 50, label: 'Elevated' },
      { min: 50, max: 75, label: 'Critical' },
      { min: 75, max: 100, label: 'Runaway' }
    ]
  },
  {
    id: 'methane',
    name: 'Methane Emissions',
    vector: { climate_forcing: 1.0, ecological_damage: 0.5, human_drivenness: 0.8, societal_fallout: 0.6 },
    baseValue: 45,
    value: 45,
    sphere: 'atmosphere',
    description: 'Atmospheric methane remains a high-leverage warming gas. NOAA reported a globally averaged marine-surface monthly mean of 1,940.46 ppb for February 2026, reflecting continued growth from agriculture, wetlands, waste, and fossil-system leaks.',
    adjectives: [
      { min: 0, max: 30, label: 'Controlled' },
      { min: 30, max: 55, label: 'Rising' },
      { min: 55, max: 80, label: 'Saturated' },
      { min: 80, max: 100, label: 'Hazardous' }
    ]
  },
  {
    id: 'deforestation',
    name: 'Deforestation',
    vector: { climate_forcing: 0.7, ecological_damage: 1.0, human_drivenness: 0.9, societal_fallout: 0.8 },
    baseValue: 50,
    value: 50,
    sphere: 'biosphere',
    description: 'Clearance of forest canopy. Tracked by Landsat and MODIS land-cover data products (available via NASA Earthdata LP DAAC), Global Forest Watch registers a net loss of 10 million hectares annually, leading to carbon sink degradation.',
    adjectives: [
      { min: 0, max: 30, label: 'Sustained' },
      { min: 30, max: 55, label: 'Expanding' },
      { min: 55, max: 80, label: 'Severe' },
      { min: 80, max: 100, label: 'Irreversible' }
    ]
  },
  {
    id: 'industry_farming',
    name: 'Industry Farming',
    vector: { climate_forcing: 0.8, ecological_damage: 0.9, human_drivenness: 1.0, societal_fallout: 0.7 },
    baseValue: 50,
    value: 50,
    sphere: 'agriculture',
    description: 'Monoculture farming and intensive livestock rearing. MODIS vegetation indices (EVI/NDVI) and SMAP soil moisture data track associated land degradation. Fertilizers release ~150 Tg of nitrogen annually, exceeding biogeochemical flows.',
    adjectives: [
      { min: 0, max: 30, label: 'Regenerative' },
      { min: 30, max: 55, label: 'Intensive' },
      { min: 55, max: 80, label: 'Exploitative' },
      { min: 80, max: 100, label: 'Degraded' }
    ]
  },
  {
    id: 'food',
    name: 'Agricultural Demand',
    vector: { climate_forcing: 0.5, ecological_damage: 0.6, human_drivenness: 0.8, societal_fallout: 0.9 },
    baseValue: 50,
    value: 50,
    sphere: 'agriculture',
    description: 'Global agricultural demand for food, particularly meat and dairy. MODIS and Landsat agricultural land-use mapping monitor this demand as it drives deforestation and cropland expansion.',
    adjectives: [
      { min: 0, max: 30, label: 'Sustainable' },
      { min: 30, max: 55, label: 'High' },
      { min: 55, max: 80, label: 'Excessive' },
      { min: 80, max: 100, label: 'Unstable' }
    ]
  },
  {
    id: 'urbanization',
    name: 'Urbanization',
    vector: { climate_forcing: 0.5, ecological_damage: 0.6, human_drivenness: 0.9, societal_fallout: 0.8 },
    baseValue: 45,
    value: 45,
    sphere: 'sociopolitical',
    description: 'The conversion of rural landscapes into dense urban settlements. VIIRS Nighttime Lights and MODIS land cover change products monitor this expansion, which drives infrastructure demand, localized warming, and migration.',
    adjectives: [
      { min: 0, max: 30, label: 'Contained' },
      { min: 30, max: 55, label: 'Expanding' },
      { min: 55, max: 80, label: 'Congested' },
      { min: 80, max: 100, label: 'Hyper-Dense' }
    ]
  },
  {
    id: 'fast_fashion',
    name: 'Fast Fashion',
    vector: { climate_forcing: 0.6, ecological_damage: 0.7, human_drivenness: 1.0, societal_fallout: 0.5 },
    baseValue: 40,
    value: 40,
    sphere: 'economy',
    description: 'Rapid production of low-cost clothing, leading to massive textile waste. Supply chain impacts are monitored via OCO-2 (industrial emissions) and Landsat (cotton irrigation water depletion) data products.',
    adjectives: [
      { min: 0, max: 30, label: 'Circular' },
      { min: 30, max: 55, label: 'Linear' },
      { min: 55, max: 80, label: 'Excessive' },
      { min: 80, max: 100, label: 'Wasteful' }
    ]
  },
  {
    id: 'migration',
    name: 'Migration',
    vector: { climate_forcing: 0.2, ecological_damage: 0.3, human_drivenness: 0.5, societal_fallout: 1.0 },
    baseValue: 30,
    value: 30,
    sphere: 'sociopolitical',
    description: 'Displacement of populations driven by rising sea levels (monitored by Sentinel-6 and Jason altimetry) and severe drought indices derived from GRACE gravity mass changes.',
    adjectives: [
      { min: 0, max: 25, label: 'Localized' },
      { min: 25, max: 55, label: 'Rising' },
      { min: 55, max: 80, label: 'Massive' },
      { min: 80, max: 100, label: 'Catastrophic' }
    ]
  },
  {
    id: 'resource_depletion',
    name: 'Resource Depletion',
    vector: { climate_forcing: 0.4, ecological_damage: 0.8, human_drivenness: 0.7, societal_fallout: 0.9 },
    baseValue: 47,
    value: 47,
    sphere: 'biosphere',
    description: 'Rapid depletion of fresh water aquifers and arable topsoil. GRACE and GRACE-FO gravity mass change data show critical groundwater aquifer depletion globally, crossing local freshwater boundaries.',
    adjectives: [
      { min: 0, max: 25, label: 'Stable' },
      { min: 25, max: 50, label: 'Strained' },
      { min: 50, max: 75, label: 'Severe' },
      { min: 75, max: 100, label: 'Exhausted' }
    ]
  },
  {
    id: 'carbon_emission',
    name: 'Carbon Emission',
    vector: { climate_forcing: 1.0, ecological_damage: 0.6, human_drivenness: 0.9, societal_fallout: 0.8 },
    baseValue: 55,
    value: 55,
    sphere: 'atmosphere',
    description: 'This anchor uses atmospheric CO2 burden as the forcing proxy for carbon emissions. NOAA reported a Mauna Loa monthly average of 432.34 ppm for May 2026, capturing the cumulative warming pressure created by fossil combustion and land-use change.',
    adjectives: [
      { min: 0, max: 30, label: 'Neutralizing' },
      { min: 30, max: 55, label: 'High' },
      { min: 55, max: 80, label: 'Critical' },
      { min: 80, max: 100, label: 'Overwhelming' }
    ]
  },
  {
    id: 'personal_conveyance',
    name: 'Personal Conveyance',
    vector: { climate_forcing: 0.7, ecological_damage: 0.3, human_drivenness: 1.0, societal_fallout: 0.6 },
    baseValue: 45,
    value: 45,
    sphere: 'transport',
    description: 'Reliance on private fossil-fueled vehicles. Associated urban NOx emissions are tracked by the TEMPO (Tropospheric Emissions: Monitoring of Pollution) satellite instrument.',
    adjectives: [
      { min: 0, max: 30, label: 'Transit-Centric' },
      { min: 30, max: 55, label: 'Car-Dependent' },
      { min: 55, max: 80, label: 'Congested' },
      { min: 80, max: 100, label: 'Stifling' }
    ]
  },
  {
    id: 'environ_anomalies',
    name: 'Compound Climate Hazards',
    vector: { climate_forcing: 0.6, ecological_damage: 0.9, human_drivenness: 0.3, societal_fallout: 0.9 },
    baseValue: 40,
    value: 40,
    sphere: 'atmosphere',
    description: 'Co-occurring or sequential heat, heavy-rainfall, drought, wildfire, cyclone, and flood hazards. This is a bounded hazard-regime concept, not a catch-all for atmospheric anomalies.',
    adjectives: [
      { min: 0, max: 30, label: 'Seasonal' },
      { min: 30, max: 55, label: 'Frequent' },
      { min: 55, max: 80, label: 'Severe' },
      { min: 80, max: 100, label: 'Destructive' }
    ]
  },
  {
    id: 'el_nino',
    name: 'El Niño',
    vector: { climate_forcing: 0.2, ecological_damage: 0.6, human_drivenness: 0.28, societal_fallout: 0.7 },
    baseValue: 40,
    value: 40,
    sphere: 'oceans',
    description: 'The warming phase of the ENSO pattern. Monitored via sea surface temperature anomalies from MODIS and sea surface height variations from Sentinel-6 and Jason satellites.',
    adjectives: [
      { min: 0, max: 30, label: 'Neutral' },
      { min: 30, max: 55, label: 'Active' },
      { min: 55, max: 80, label: 'Intense' },
      { min: 80, max: 100, label: 'Extreme' }
    ]
  },
  {
    id: 'la_nina',
    name: 'La Niña',
    vector: { climate_forcing: 0.15, ecological_damage: 0.55, human_drivenness: 0.05, societal_fallout: 0.75 },
    baseValue: 38,
    value: 38,
    sphere: 'oceans',
    description: 'The cooling phase of the ENSO pattern. It reorganizes tropical rainfall, sharpens drought-flood contrasts, and shifts storm tracks across the Pacific, the Americas, Africa, and Asia.',
    adjectives: [
      { min: 0, max: 30, label: 'Neutral' },
      { min: 30, max: 55, label: 'Active' },
      { min: 55, max: 80, label: 'Intense' },
      { min: 80, max: 100, label: 'Extreme' }
    ]
  },
  {
    id: 'amoc',
    name: 'AMOC Slowdown',
    vector: { climate_forcing: 0.45, ecological_damage: 0.8, human_drivenness: 0.2, societal_fallout: 0.95 },
    baseValue: 42,
    value: 42,
    sphere: 'oceans',
    description: 'Weakening Atlantic overturning circulation can redistribute heat, alter European and tropical rainfall, and increase the risk of abrupt regional climate disruptions.',
    adjectives: [
      { min: 0, max: 25, label: 'Stable' },
      { min: 25, max: 50, label: 'Slowing' },
      { min: 50, max: 75, label: 'Disrupted' },
      { min: 75, max: 100, label: 'Unstable' }
    ]
  },
  {
    id: 'wet_bulb_heat',
    name: 'Wet-Bulb Heat',
    vector: { climate_forcing: 0.45, ecological_damage: 0.5, human_drivenness: 0.55, societal_fallout: 1.0 },
    baseValue: 48,
    value: 48,
    sphere: 'atmosphere',
    description: 'Combined heat and humidity extremes push human survivability limits, reduce labor capacity, and strain power, health, and cooling systems during prolonged heat events.',
    adjectives: [
      { min: 0, max: 25, label: 'Tolerable' },
      { min: 25, max: 50, label: 'Stressful' },
      { min: 50, max: 75, label: 'Dangerous' },
      { min: 75, max: 100, label: 'Lethal' }
    ]
  },
  {
    id: 'monsoon_volatility',
    name: 'Monsoon Volatility',
    vector: { climate_forcing: 0.35, ecological_damage: 0.7, human_drivenness: 0.54, societal_fallout: 0.95 },
    baseValue: 44,
    value: 44,
    sphere: 'atmosphere',
    description: 'Erratic monsoon onset, breaks, and retreat intensify flood-drought swings, destabilizing food production, water storage, and hydro-dependent economies.',
    adjectives: [
      { min: 0, max: 25, label: 'Seasonal' },
      { min: 25, max: 50, label: 'Erratic' },
      { min: 50, max: 75, label: 'Disruptive' },
      { min: 75, max: 100, label: 'Chaotic' }
    ]
  },
  {
    id: 'permafrost_thaw',
    name: 'Permafrost Thaw',
    vector: { climate_forcing: 0.85, ecological_damage: 0.75, human_drivenness: 0.15, societal_fallout: 0.8 },
    baseValue: 46,
    value: 46,
    sphere: 'cryosphere',
    description: 'Frozen northern soils are thawing, releasing greenhouse gases, destabilizing roads and settlements, and amplifying Arctic carbon feedback loops.',
    adjectives: [
      { min: 0, max: 25, label: 'Locked' },
      { min: 25, max: 50, label: 'Softening' },
      { min: 50, max: 75, label: 'Thawing' },
      { min: 75, max: 100, label: 'Collapsing' }
    ]
  },
  {
    id: 'rain_on_snow_flood_risk',
    name: 'Rain-on-Snow Flood Risk',
    vector: { climate_forcing: 0.44, ecological_damage: 0.52, human_drivenness: 0.26, societal_fallout: 0.92 },
    baseValue: 38,
    value: 38,
    sphere: 'cryosphere',
    description: 'Warming shifts cold-season storms toward rain falling onto existing snowpack, producing rapid runoff pulses, flood surges, and operational stress for mountain basins.',
    adjectives: [
      { min: 0, max: 25, label: 'Rare' },
      { min: 25, max: 50, label: 'Emerging' },
      { min: 50, max: 75, label: 'Damaging' },
      { min: 75, max: 100, label: 'Flashy' }
    ]
  },
  {
    id: 'peak_glacier_runoff_passage',
    name: 'Peak Glacier Runoff Passage',
    vector: { climate_forcing: 0.38, ecological_damage: 0.48, human_drivenness: 0.18, societal_fallout: 0.9 },
    baseValue: 37,
    value: 37,
    sphere: 'cryosphere',
    description: 'Some glacier-fed basins are moving past the stage of rising meltwater supply and into long-term decline, changing the reliability of downstream seasonal water systems.',
    adjectives: [
      { min: 0, max: 25, label: 'Distant' },
      { min: 25, max: 50, label: 'Approaching' },
      { min: 50, max: 75, label: 'Passing' },
      { min: 75, max: 100, label: 'After-Peak' }
    ]
  },
  {
    id: 'marine_pathogen_range_expansion',
    name: 'Marine Pathogen Range Expansion',
    vector: { climate_forcing: 0.2, ecological_damage: 0.7, human_drivenness: 0.22, societal_fallout: 0.78 },
    baseValue: 35,
    value: 35,
    sphere: 'oceans',
    description: 'Warmer water and changing coastal conditions expand the range or seasonality of marine pathogens that threaten shellfish safety, fisheries, and coastal health systems.',
    adjectives: [
      { min: 0, max: 25, label: 'Contained' },
      { min: 25, max: 50, label: 'Shifting' },
      { min: 50, max: 75, label: 'Expanding' },
      { min: 75, max: 100, label: 'Widespread' }
    ]
  },
  {
    id: 'thermal_stratification_intensification',
    name: 'Thermal Stratification Intensification',
    vector: { climate_forcing: 0.3, ecological_damage: 0.74, human_drivenness: 0.2, societal_fallout: 0.72 },
    baseValue: 36,
    value: 36,
    sphere: 'oceans',
    description: 'Warming and freshening strengthen density layering in coastal and shelf waters, reducing vertical mixing, oxygen renewal, and resilience against low-oxygen events.',
    adjectives: [
      { min: 0, max: 25, label: 'Weak' },
      { min: 25, max: 50, label: 'Building' },
      { min: 50, max: 75, label: 'Layered' },
      { min: 75, max: 100, label: 'Stagnant' }
    ]
  },
  {
    id: 'delta_salt_intrusion_fronts',
    name: 'Delta Salt Intrusion Fronts',
    vector: { climate_forcing: 0.22, ecological_damage: 0.56, human_drivenness: 0.34, societal_fallout: 0.9 },
    baseValue: 37,
    value: 37,
    sphere: 'oceans',
    description: 'Salt fronts can push farther inland in deltas and estuaries as sea level rises, river discharge weakens, and storm-driven water levels press saline water into farms and intakes.',
    adjectives: [
      { min: 0, max: 25, label: 'Marginal' },
      { min: 25, max: 50, label: 'Creeping' },
      { min: 50, max: 75, label: 'Encroaching' },
      { min: 75, max: 100, label: 'Intruding' }
    ]
  },
  {
    id: 'oceanic_upwelling_disruptions',
    name: 'Oceanic Upwelling Disruptions',
    vector: { climate_forcing: 0.24, ecological_damage: 0.82, human_drivenness: 0.16, societal_fallout: 0.68 },
    baseValue: 34,
    value: 34,
    sphere: 'oceans',
    description: 'Changes in winds, circulation, and stratification can disrupt coastal and eastern-boundary upwelling, reducing nutrient delivery and destabilizing highly productive marine food systems.',
    adjectives: [
      { min: 0, max: 25, label: 'Stable' },
      { min: 25, max: 50, label: 'Variable' },
      { min: 50, max: 75, label: 'Disrupted' },
      { min: 75, max: 100, label: 'Suppressed' }
    ]
  },
  {
    id: 'extreme_precipitation_intensity',
    name: 'Extreme Precipitation Intensity',
    vector: { climate_forcing: 0.55, ecological_damage: 0.46, human_drivenness: 0.34, societal_fallout: 0.93 },
    baseValue: 41,
    value: 41,
    sphere: 'atmosphere',
    description: 'A warmer atmosphere can dump more water in short bursts, increasing the intensity of rainfall events that overwhelm drainage, utilities, and river management systems.',
    adjectives: [
      { min: 0, max: 25, label: 'Background' },
      { min: 25, max: 50, label: 'Stronger' },
      { min: 50, max: 75, label: 'Intense' },
      { min: 75, max: 100, label: 'Torrential' }
    ]
  },
  {
    id: 'tropical_cyclone_rapid_intensification',
    name: 'Tropical Cyclone Rapid Intensification',
    vector: { climate_forcing: 0.44, ecological_damage: 0.38, human_drivenness: 0.22, societal_fallout: 0.95 },
    baseValue: 40,
    value: 40,
    sphere: 'atmosphere',
    description: 'Warmer ocean conditions and favorable atmospheric setups can increase the likelihood that tropical cyclones intensify quickly before landfall, compressing preparation time and raising surge risk.',
    adjectives: [
      { min: 0, max: 25, label: 'Watchful' },
      { min: 25, max: 50, label: 'Accelerating' },
      { min: 50, max: 75, label: 'Rapid' },
      { min: 75, max: 100, label: 'Explosive' }
    ]
  },
  {
    id: 'pyrocumulonimbus_smoke_injection',
    name: 'Pyrocumulonimbus Smoke Injection',
    vector: { climate_forcing: 0.34, ecological_damage: 0.36, human_drivenness: 0.32, societal_fallout: 0.68 },
    baseValue: 32,
    value: 32,
    sphere: 'atmosphere',
    description: 'Extreme fires can generate pyrocumulonimbus storms that loft smoke into the upper atmosphere, altering transport pathways and extending the lifetime of fire-emitted aerosols.',
    adjectives: [
      { min: 0, max: 25, label: 'Localized' },
      { min: 25, max: 50, label: 'Episodic' },
      { min: 50, max: 75, label: 'Lofted' },
      { min: 75, max: 100, label: 'Stratospheric' }
    ]
  },
  {
    id: 'coastal_permafrost_erosion',
    name: 'Coastal Permafrost Erosion',
    vector: { climate_forcing: 0.3, ecological_damage: 0.54, human_drivenness: 0.16, societal_fallout: 0.84 },
    baseValue: 35,
    value: 35,
    sphere: 'cryosphere',
    description: 'Arctic coasts underlain by thawing permafrost can erode rapidly as warmer ground, sea-ice loss, and wave attack destabilize bluffs, roads, settlements, and shore infrastructure.',
    adjectives: [
      { min: 0, max: 25, label: 'Frozen' },
      { min: 25, max: 50, label: 'Undercut' },
      { min: 50, max: 75, label: 'Eroding' },
      { min: 75, max: 100, label: 'Retreating' }
    ]
  },
  {
    id: 'water_stress',
    name: 'Baseline Water Stress',
    vector: { climate_forcing: 0.35, ecological_damage: 0.62, human_drivenness: 0.9, societal_fallout: 0.95 },
    baseValue: 46,
    value: 46,
    sphere: 'freshwater',
    description: 'Persistent imbalance between water demand and available supply raises the baseline fragility of cities, farms, power systems, and river ecosystems.',
    adjectives: [
      { min: 0, max: 25, label: 'Buffered' },
      { min: 25, max: 50, label: 'Stressed' },
      { min: 50, max: 75, label: 'Scarce' },
      { min: 75, max: 100, label: 'Overdrawn' }
    ]
  },
  {
    id: 'groundwater_depletion',
    name: 'Groundwater Depletion',
    vector: { climate_forcing: 0.28, ecological_damage: 0.72, human_drivenness: 0.92, societal_fallout: 0.94 },
    baseValue: 45,
    value: 45,
    sphere: 'freshwater',
    description: 'Aquifers are being drawn down faster than they recharge, turning hidden water reserves into a long-lived constraint on farming, drinking water, and ecosystem resilience.',
    adjectives: [
      { min: 0, max: 25, label: 'Recharged' },
      { min: 25, max: 50, label: 'Drawn Down' },
      { min: 50, max: 75, label: 'Declining' },
      { min: 75, max: 100, label: 'Exhaustive' }
    ]
  },
  {
    id: 'heat_related_mortality_burden',
    name: 'Heat-Related Mortality Burden',
    vector: { climate_forcing: 0.18, ecological_damage: 0.2, human_drivenness: 0.42, societal_fallout: 1.0 },
    baseValue: 43,
    value: 43,
    sphere: 'health',
    description: 'Extreme heat becomes a mortality burden when exposure, age, chronic illness, housing, and care-system access combine beyond safe recovery limits.',
    adjectives: [
      { min: 0, max: 25, label: 'Contained' },
      { min: 25, max: 50, label: 'Rising' },
      { min: 50, max: 75, label: 'Severe' },
      { min: 75, max: 100, label: 'Lethal' }
    ]
  },
  {
    id: 'air_pollution_health_burden',
    name: 'Air Pollution Health Burden',
    vector: { climate_forcing: 0.24, ecological_damage: 0.34, human_drivenness: 0.78, societal_fallout: 0.98 },
    baseValue: 42,
    value: 42,
    sphere: 'health',
    description: 'Ambient ozone, particulates, and combustion by-products translate transport and industrial activity into chronic respiratory, cardiovascular, and mortality risk.',
    adjectives: [
      { min: 0, max: 25, label: 'Cleaner' },
      { min: 25, max: 50, label: 'Polluted' },
      { min: 50, max: 75, label: 'Hazardous' },
      { min: 75, max: 100, label: 'Toxic' }
    ]
  },
  {
    id: 'occupational_heat_exposure',
    name: 'Occupational Heat Exposure',
    vector: { climate_forcing: 0.15, ecological_damage: 0.16, human_drivenness: 0.64, societal_fallout: 0.97 },
    baseValue: 40,
    value: 40,
    sphere: 'health',
    description: 'Rising heat and humidity reduce safe work capacity, increase injury risk, and push labor-intensive sectors into direct climate-health loss.',
    adjectives: [
      { min: 0, max: 25, label: 'Managed' },
      { min: 25, max: 50, label: 'Exposed' },
      { min: 50, max: 75, label: 'Dangerous' },
      { min: 75, max: 100, label: 'Unsafe' }
    ]
  },
  {
    id: 'data_centers',
    name: 'Data Centers',
    vector: { climate_forcing: 0.72, ecological_damage: 0.4, human_drivenness: 0.98, societal_fallout: 0.62 },
    baseValue: 36,
    value: 36,
    sphere: 'digital',
    description: 'Server campuses concentrate electricity demand, cooling water needs, backup generation, and land-use pressures in already stressed urban and industrial corridors.',
    adjectives: [
      { min: 0, max: 25, label: 'Efficient' },
      { min: 25, max: 50, label: 'Scaling' },
      { min: 50, max: 75, label: 'Power-Hungry' },
      { min: 75, max: 100, label: 'Grid-Straining' }
    ]
  },
  {
    id: 'ai_data_centers',
    name: 'AI Data Centers',
    vector: { climate_forcing: 0.8, ecological_damage: 0.45, human_drivenness: 1.0, societal_fallout: 0.68 },
    baseValue: 46,
    value: 46,
    sphere: 'digital',
    description: 'Rapid buildout of compute-heavy AI facilities drives outsized electricity growth, cooling demand, semiconductor supply-chain impacts, and local grid congestion.',
    adjectives: [
      { min: 0, max: 25, label: 'Pilot-Scale' },
      { min: 25, max: 50, label: 'Accelerating' },
      { min: 50, max: 75, label: 'Hyper-Scale' },
      { min: 75, max: 100, label: 'Systemic Load' }
    ]
  },
  {
    id: 'semiconductor_fabs',
    name: 'Semiconductor Fabs',
    vector: { climate_forcing: 0.76, ecological_damage: 0.44, human_drivenness: 0.99, societal_fallout: 0.61 },
    baseValue: 38,
    value: 38,
    sphere: 'digital',
    description: 'Advanced chip fabrication ties compute growth to ultrapure water demand, process energy, fluorinated gases, and highly concentrated industrial supply chains.',
    adjectives: [
      { min: 0, max: 25, label: 'Contained' },
      { min: 25, max: 50, label: 'Scaling' },
      { min: 50, max: 75, label: 'Fab-Intensive' },
      { min: 75, max: 100, label: 'Chokepoint-Critical' }
    ]
  },
  {
    id: 'telecom_backbone',
    name: 'Telecom Backbone',
    vector: { climate_forcing: 0.56, ecological_damage: 0.24, human_drivenness: 0.95, societal_fallout: 0.72 },
    baseValue: 33,
    value: 33,
    sphere: 'digital',
    description: 'Long-haul fiber, switching nodes, and transmission corridors keep digital traffic moving between cities, regions, and countries while concentrating network fragility.',
    adjectives: [
      { min: 0, max: 25, label: 'Redundant' },
      { min: 25, max: 50, label: 'Busy' },
      { min: 50, max: 75, label: 'Critical' },
      { min: 75, max: 100, label: 'Chokepointed' }
    ]
  },
  {
    id: 'mobile_wireless_networks',
    name: 'Mobile Towers / Wireless',
    vector: { climate_forcing: 0.48, ecological_damage: 0.22, human_drivenness: 0.94, societal_fallout: 0.69 },
    baseValue: 31,
    value: 31,
    sphere: 'digital',
    description: 'Distributed towers, radio access equipment, and wireless backhaul extend the digital footprint across cities, highways, and rural corridors.',
    adjectives: [
      { min: 0, max: 25, label: 'Sparse' },
      { min: 25, max: 50, label: 'Connected' },
      { min: 50, max: 75, label: 'Dense' },
      { min: 75, max: 100, label: 'Always-On' }
    ]
  },
  {
    id: 'internet_exchange_points',
    name: 'Internet Exchange Points',
    vector: { climate_forcing: 0.44, ecological_damage: 0.18, human_drivenness: 0.93, societal_fallout: 0.76 },
    baseValue: 29,
    value: 29,
    sphere: 'digital',
    description: 'Carrier hotels and exchange points are compact but high-leverage hubs where networks physically interconnect and route large volumes of traffic.',
    adjectives: [
      { min: 0, max: 25, label: 'Local' },
      { min: 25, max: 50, label: 'Interconnected' },
      { min: 50, max: 75, label: 'Strategic' },
      { min: 75, max: 100, label: 'System-Critical' }
    ]
  },
  {
    id: 'subsea_cables',
    name: 'Subsea Cables',
    vector: { climate_forcing: 0.38, ecological_damage: 0.28, human_drivenness: 0.91, societal_fallout: 0.82 },
    baseValue: 30,
    value: 30,
    sphere: 'digital',
    description: 'Undersea cables and landing stations carry most international data traffic, making digital connectivity depend on a small number of coastal routes and repair pathways.',
    adjectives: [
      { min: 0, max: 25, label: 'Regional' },
      { min: 25, max: 50, label: 'Ocean-Linked' },
      { min: 50, max: 75, label: 'Chokepoint-Exposed' },
      { min: 75, max: 100, label: 'Global Lifeline' }
    ]
  },
  {
    id: 'food_waste',
    name: 'Food Waste',
    vector: { climate_forcing: 0.62, ecological_damage: 0.6, human_drivenness: 0.95, societal_fallout: 0.58 },
    baseValue: 34,
    value: 34,
    sphere: 'agriculture',
    description: 'Loss and disposal across farms, retailers, kitchens, and landfills turn food systems into avoidable methane, water, and land-use pressure.',
    adjectives: [
      { min: 0, max: 25, label: 'Prevented' },
      { min: 25, max: 50, label: 'Leaky' },
      { min: 50, max: 75, label: 'Wasteful' },
      { min: 75, max: 100, label: 'Discard-Heavy' }
    ]
  },
  {
    id: 'aviation',
    name: 'Aviation',
    vector: { climate_forcing: 0.78, ecological_damage: 0.32, human_drivenness: 0.93, societal_fallout: 0.52 },
    baseValue: 38,
    value: 38,
    sphere: 'transport',
    description: 'Aircraft operations combine jet-fuel combustion, contrails, airport infrastructure, and high-altitude climate forcing in a fast-growing mobility system.',
    adjectives: [
      { min: 0, max: 25, label: 'Constrained' },
      { min: 25, max: 50, label: 'Expanding' },
      { min: 50, max: 75, label: 'High-Impact' },
      { min: 75, max: 100, label: 'Altitude-Loaded' }
    ]
  },
  {
    id: 'shipping',
    name: 'Shipping',
    vector: { climate_forcing: 0.66, ecological_damage: 0.46, human_drivenness: 0.92, societal_fallout: 0.49 },
    baseValue: 37,
    value: 37,
    sphere: 'transport',
    description: 'Global shipping links freight demand to bunker fuel combustion, port congestion, marine pollution, and persistent trade-route emissions.',
    adjectives: [
      { min: 0, max: 25, label: 'Efficient' },
      { min: 25, max: 50, label: 'Heavy-Traffic' },
      { min: 50, max: 75, label: 'Fuel-Intensive' },
      { min: 75, max: 100, label: 'Ocean-Straining' }
    ]
  },
  {
    id: 'cement_concrete',
    name: 'Cement / Concrete',
    vector: { climate_forcing: 0.82, ecological_damage: 0.41, human_drivenness: 0.97, societal_fallout: 0.55 },
    baseValue: 41,
    value: 41,
    sphere: 'energy',
    description: 'Cement and concrete lock construction demand into kiln heat, calcination emissions, quarrying, and long-lived material throughput.',
    adjectives: [
      { min: 0, max: 25, label: 'Low-Carbon' },
      { min: 25, max: 50, label: 'Material-Heavy' },
      { min: 50, max: 75, label: 'Kiln-Driven' },
      { min: 75, max: 100, label: 'Concrete-Locked' }
    ]
  },
  {
    id: 'steel',
    name: 'Steel',
    vector: { climate_forcing: 0.8, ecological_damage: 0.47, human_drivenness: 0.96, societal_fallout: 0.57 },
    baseValue: 40,
    value: 40,
    sphere: 'energy',
    description: 'Steel production ties ore extraction, blast-furnace coal use, heat demand, and construction supply chains into a concentrated industrial footprint.',
    adjectives: [
      { min: 0, max: 25, label: 'Recycled' },
      { min: 25, max: 50, label: 'Industrial' },
      { min: 50, max: 75, label: 'Furnace-Heavy' },
      { min: 75, max: 100, label: 'Smelter-Locked' }
    ]
  },
  {
    id: 'plastics_petrochemicals',
    name: 'Plastics / Petrochemicals',
    vector: { climate_forcing: 0.74, ecological_damage: 0.72, human_drivenness: 1.0, societal_fallout: 0.54 },
    baseValue: 39,
    value: 39,
    sphere: 'economy',
    description: 'Petrochemical production connects fossil feedstocks to plastics, solvents, fertilizers, and pervasive waste leakage across land and ocean systems.',
    adjectives: [
      { min: 0, max: 25, label: 'Contained' },
      { min: 25, max: 50, label: 'Synthetic' },
      { min: 50, max: 75, label: 'Leak-Prone' },
      { min: 75, max: 100, label: 'Polymer-Saturated' }
    ]
  },
  {
    id: 'air_conditioning_refrigerants',
    name: 'Air Conditioning / Refrigerants',
    vector: { climate_forcing: 0.76, ecological_damage: 0.29, human_drivenness: 0.9, societal_fallout: 0.63 },
    baseValue: 36,
    value: 36,
    sphere: 'energy',
    description: 'Cooling systems combine growing electricity demand with potent refrigerant leakage, making heat adaptation itself part of the climate story.',
    adjectives: [
      { min: 0, max: 25, label: 'Efficient' },
      { min: 25, max: 50, label: 'Cooling-Dependent' },
      { min: 50, max: 75, label: 'Leak-Risky' },
      { min: 75, max: 100, label: 'Heat-Locked' }
    ]
  },
  {
    id: 'fertilizer_production',
    name: 'Fertilizer Production',
    vector: { climate_forcing: 0.77, ecological_damage: 0.68, human_drivenness: 0.98, societal_fallout: 0.59 },
    baseValue: 38,
    value: 38,
    sphere: 'agriculture',
    description: 'Industrial fertilizer production ties fossil gas, ammonia synthesis, nitrous oxide risk, and runoff-intensive farming systems together.',
    adjectives: [
      { min: 0, max: 25, label: 'Balanced' },
      { min: 25, max: 50, label: 'Input-Heavy' },
      { min: 50, max: 75, label: 'Nitrogen-Loaded' },
      { min: 75, max: 100, label: 'Runoff-Driving' }
    ]
  },
  {
    id: 'mining_critical_minerals',
    name: 'Mining / Critical Minerals',
    vector: { climate_forcing: 0.58, ecological_damage: 0.83, human_drivenness: 0.96, societal_fallout: 0.62 },
    baseValue: 37,
    value: 37,
    sphere: 'economy',
    description: 'Critical-mineral extraction expands pits, tailings, water draw, and energy use as battery, grid, and electronics demand accelerates.',
    adjectives: [
      { min: 0, max: 25, label: 'Managed' },
      { min: 25, max: 50, label: 'Extractive' },
      { min: 50, max: 75, label: 'Landscape-Intensive' },
      { min: 75, max: 100, label: 'Frontier-Expanding' }
    ]
  },
  {
    id: 'urban_sprawl_housing',
    name: 'Urban Sprawl / Housing',
    vector: { climate_forcing: 0.63, ecological_damage: 0.57, human_drivenness: 0.97, societal_fallout: 0.72 },
    baseValue: 39,
    value: 39,
    sphere: 'sociopolitical',
    description: 'Low-density housing expansion turns land conversion, road building, construction materials, and household energy demand into long-lived urban pressure.',
    adjectives: [
      { min: 0, max: 25, label: 'Compact' },
      { min: 25, max: 50, label: 'Expanding' },
      { min: 50, max: 75, label: 'Sprawling' },
      { min: 75, max: 100, label: 'Land-Hungry' }
    ]
  },
  ...RESPONSE_SYSTEM_NODES
].map(node => attachImpactProfiles(node));

const BASE_EDGES = [
  { source: 'industry_farming', target: 'methane', verb: 'releases', adverb: 'substantially', influence: 0.8 },
  { source: 'food', target: 'industry_farming', verb: 'drives', adverb: 'continuously', influence: 0.75 },
  { source: 'industry_farming', target: 'food', verb: 'supplies', adverb: 'intensively', influence: 0.2 },
  { source: 'industry_farming', target: 'water_stress', verb: 'intensifies', adverb: 'through irrigation withdrawals and basin demand', influence: 0.63 },
  { source: 'industry_farming', target: 'groundwater_depletion', verb: 'accelerates', adverb: 'where pumping exceeds recharge', influence: 0.61 },
  { source: 'food', target: 'deforestation', verb: 'necessitates', adverb: 'drastically', influence: 0.7 },
  { source: 'deforestation', target: 'food', verb: 'yields', adverb: 'temporarily', influence: 0.3 },
  { source: 'deforestation', target: 'urbanization', verb: 'clears way for', adverb: 'gradually', influence: 0.4 },
  { source: 'urbanization', target: 'deforestation', verb: 'triggers', adverb: 'peripherally', influence: 0.5 },
  { source: 'fast_fashion', target: 'urbanization', verb: 'concentrates in', adverb: 'rapidly', influence: 0.4 },
  { source: 'urbanization', target: 'migration', verb: 'compels', adverb: 'eventually', influence: 0.5 },
  { source: 'migration', target: 'resource_depletion', verb: 'strains', adverb: 'locally', influence: 0.55 },
  { source: 'resource_depletion', target: 'migration', verb: 'forces', adverb: 'acutely', influence: 0.75 },
  { source: 'carbon_emission', target: 'resource_depletion', verb: 'degrades', adverb: 'persistently', influence: 0.5 },
  { source: 'resource_depletion', target: 'carbon_emission', verb: 'exacerbates', adverb: 'indirectly', influence: 0.3 },
  { source: 'personal_conveyance', target: 'carbon_emission', verb: 'fuels', adverb: 'directly', influence: 0.8 },
  { source: 'carbon_emission', target: 'personal_conveyance', verb: 'reinforces', adverb: 'systemically', influence: 0.2 },
  { source: 'personal_conveyance', target: 'air_pollution_health_burden', verb: 'raises', adverb: 'through combustion exhaust and urban exposure', influence: 0.58 },
  { source: 'pm2_5_particulates', target: 'air_pollution_health_burden', verb: 'drives', adverb: 'through cardiopulmonary and systemic fine-particle exposure', influence: 0.69 },
  { source: 'temp', target: 'urbanization', verb: 'heats', adverb: 'unbearably', influence: 0.3 },
  { source: 'temp', target: 'extreme_precipitation_intensity', verb: 'raises', adverb: 'through a wetter and more energetic atmosphere', influence: 0.63 },
  { source: 'extreme_precipitation_intensity', target: 'flash_flood_regime', verb: 'intensifies', adverb: 'when rainfall rates exceed drainage and infiltration capacity', influence: 0.61 },
  { source: 'temp', target: 'carbon_emission', verb: 'triggers feedbacks in', adverb: 'unpredictably', influence: 0.45 },
  { source: 'temp', target: 'deforestation', verb: 'drives wildfires in', adverb: 'severely', influence: 0.6 },
  { source: 'temp', target: 'methane', verb: 'releases polar', adverb: 'alarmingly', influence: 0.5 },
  { source: 'temp', target: 'industry_farming', verb: 'strains', adverb: 'heavily', influence: 0.5 },
  { source: 'temp', target: 'environ_anomalies', verb: 'supercharges', adverb: 'frequently', influence: 0.85 },
  { source: 'carbon_emission', target: 'temp', verb: 'heats', adverb: 'continuously', influence: 0.8 },
  { source: 'methane', target: 'temp', verb: 'warms', adverb: 'acutely', influence: 0.85 },
  { source: 'temp', target: 'el_nino', verb: 'intensifies', adverb: 'seasonally', influence: 0.5 },
  { source: 'el_nino', target: 'environ_anomalies', verb: 'amplifies', adverb: 'wildly', influence: 0.7 },
  { source: 'la_nina', target: 'environ_anomalies', verb: 'reorganizes', adverb: 'globally', influence: 0.72 },
  { source: 'temp', target: 'wet_bulb_heat', verb: 'pushes', adverb: 'dangerously', influence: 0.76 },
  { source: 'wet_bulb_heat', target: 'migration', verb: 'displaces', adverb: 'progressively', influence: 0.58 },
  { source: 'wet_bulb_heat', target: 'grid_peak_load_stress', verb: 'spikes', adverb: 'through cooling demand surges', influence: 0.57 },
  { source: 'grid_peak_load_stress', target: 'wet_bulb_heat', verb: 'worsens exposure to', adverb: 'through outage risk', influence: 0.53 },
  { source: 'temp', target: 'monsoon_volatility', verb: 'destabilizes', adverb: 'seasonally', influence: 0.62 },
  { source: 'monsoon_volatility', target: 'industry_farming', verb: 'disrupts', adverb: 'repeatedly', influence: 0.67 },
  { source: 'temp', target: 'permafrost_thaw', verb: 'thaws', adverb: 'rapidly', influence: 0.74 },
  { source: 'temp', target: 'rain_on_snow_flood_risk', verb: 'raises', adverb: 'when winter storms shift from snow toward rain', influence: 0.54 },
  { source: 'temp', target: 'peak_glacier_runoff_passage', verb: 'pushes toward', adverb: 'as warming accelerates glacier mass loss', influence: 0.51 },
  { source: 'permafrost_thaw', target: 'coastal_permafrost_erosion', verb: 'destabilizes', adverb: 'where thawing ice-rich coasts lose structural cohesion', influence: 0.57 },
  { source: 'permafrost_thaw', target: 'methane', verb: 'releases', adverb: 'abruptly', influence: 0.79 },
  { source: 'carbon_emission', target: 'amoc', verb: 'stresses', adverb: 'persistently', influence: 0.48 },
  { source: 'sea_ice_season_loss', target: 'amoc', verb: 'freshens and disrupts', adverb: 'through Arctic meltwater', influence: 0.6 },
  { source: 'amoc', target: 'environ_anomalies', verb: 'reshapes', adverb: 'regionally', influence: 0.64 },
  { source: 'data_centers', target: 'carbon_emission', verb: 'draws', adverb: 'continuously', influence: 0.56 },
  { source: 'data_centers', target: 'resource_depletion', verb: 'withdraws', adverb: 'locally', influence: 0.45 },
  { source: 'ai_data_centers', target: 'data_centers', verb: 'scales', adverb: 'aggressively', influence: 0.78 },
  { source: 'ai_data_centers', target: 'carbon_emission', verb: 'intensifies', adverb: 'indirectly', influence: 0.62 },
  { source: 'ai_data_centers', target: 'semiconductor_fabs', verb: 'pulls harder on', adverb: 'through chip demand', influence: 0.66 },
  { source: 'semiconductor_fabs', target: 'resource_depletion', verb: 'draw on', adverb: 'through water and materials', influence: 0.53 },
  { source: 'semiconductor_fabs', target: 'cooling_water_competition', verb: 'competes for', adverb: 'through ultrapure water demand', influence: 0.58 },
  { source: 'semiconductor_fabs', target: 'carbon_emission', verb: 'embeds', adverb: 'through fabrication energy', influence: 0.49 },
  { source: 'telecom_backbone', target: 'carbon_emission', verb: 'depends on', adverb: 'through always-on power', influence: 0.37 },
  { source: 'telecom_backbone', target: 'critical_infrastructure_fragility', verb: 'concentrates', adverb: 'at core routes', influence: 0.58 },
  { source: 'mobile_wireless_networks', target: 'telecom_backbone', verb: 'feed into', adverb: 'through access traffic', influence: 0.54 },
  { source: 'mobile_wireless_networks', target: 'carbon_emission', verb: 'extends', adverb: 'through distributed loads', influence: 0.29 },
  { source: 'internet_exchange_points', target: 'telecom_backbone', verb: 'stabilize and route', adverb: 'through interconnection', influence: 0.56 },
  { source: 'internet_exchange_points', target: 'critical_infrastructure_fragility', verb: 'compress', adverb: 'into core hubs', influence: 0.47 },
  { source: 'subsea_cables', target: 'telecom_backbone', verb: 'land into', adverb: 'through coastal chokepoints', influence: 0.63 },
  { source: 'subsea_cables', target: 'critical_infrastructure_fragility', verb: 'expose', adverb: 'across transoceanic routes', influence: 0.51 },
  { source: 'ocean_acidification', target: 'marine_fisheries_collapse', verb: 'undermines', adverb: 'through food-web and shell-formation stress', influence: 0.52 },
  { source: 'aviation_demand_growth', target: 'carbon_emission', verb: 'adds to', adverb: 'through expanding jet-fuel demand', influence: 0.48 },
  { source: 'environ_anomalies', target: 'industry_farming', verb: 'devastates', adverb: 'disastrously', influence: 0.65 },
  { source: 'environ_anomalies', target: 'resource_depletion', verb: 'contaminates', adverb: 'widely', influence: 0.6 },
  { source: 'snowmelt_timing_shift', target: 'hydrological_runoff_surges', verb: 'reshapes', adverb: 'through earlier melt pulses', influence: 0.54 },
  { source: 'hydrological_runoff_surges', target: 'bridge_scour_exposure', verb: 'raises risk for', adverb: 'during high flows', influence: 0.58 },
  { source: 'permafrost_thaw', target: 'thermokarst_expansion', verb: 'expands into', adverb: 'across ice-rich terrain', influence: 0.64 },
  { source: 'temp', target: 'snow_drought', verb: 'pushes', adverb: 'through warmer winters', influence: 0.52 },
  { source: 'ice_sheet_mass_loss', target: 'firn_layer_depletion', verb: 'accelerates', adverb: 'through reduced retention', influence: 0.47 },
  { source: 'glacier_calving_events', target: 'glacial_lake_failure_risk', verb: 'increases', adverb: 'through retreat and lake growth', influence: 0.49 },
  { source: 'sea_level_rise', target: 'freshwater_lens_compression', verb: 'thins', adverb: 'through saltwater intrusion', influence: 0.55 },
  { source: 'aquifer_overdraft', target: 'freshwater_lens_compression', verb: 'worsens', adverb: 'through overpumping', influence: 0.51 },
  { source: 'sea_ice_season_loss', target: 'arctic_shipping_expansion', verb: 'opens space for', adverb: 'through longer navigation windows', influence: 0.57 },
  { source: 'road_freight_diesel_lock_in', target: 'freight_electrification_gap', verb: 'deepens', adverb: 'through fleet inertia', influence: 0.56 },
  { source: 'temp', target: 'airport_climate_exposure', verb: 'raises', adverb: 'through heat and performance stress', influence: 0.46 },
  { source: 'ocean_salinity_stratification', target: 'ocean_current_regime_shift', verb: 'reorganizes', adverb: 'through density structure', influence: 0.45 },
  { source: 'ocean_current_regime_shift', target: 'pelagic_species_redistribution', verb: 'redistributes', adverb: 'through habitat shifts', influence: 0.57 },
  { source: 'pelagic_species_redistribution', target: 'marine_food_web_simplification', verb: 'reorganizes', adverb: 'through trophic shifts', influence: 0.51 },
  { source: 'ocean_salinity_stratification', target: 'marine_food_web_simplification', verb: 'reshapes', adverb: 'through mixing and nutrient change', influence: 0.43 },
  { source: 'coastal_inundation_risk', target: 'littoral_surge_vulnerability', verb: 'raises exposure to', adverb: 'through higher baseline water levels', influence: 0.56 },
  { source: 'biodiversity_intactness_loss', target: 'species_range_compression', verb: 'compresses', adverb: 'through habitat decline', influence: 0.48 },
  { source: 'reservoir_storage_instability', target: 'reservoir_operating_shortfall', verb: 'creates', adverb: 'through unstable usable storage', influence: 0.59 },
  { source: 'reservoir_operating_shortfall', target: 'hydropower_reliability_decline', verb: 'reduces', adverb: 'through constrained releases', influence: 0.57 },
  { source: 'flash_flood_regime', target: 'wastewater_infrastructure_overflow', verb: 'overloads', adverb: 'during intense runoff events', influence: 0.58 },
  { source: 'coastal_inundation_risk', target: 'wastewater_infrastructure_overflow', verb: 'backs up', adverb: 'through higher baseline water levels', influence: 0.47 },
  { source: 'wastewater_infrastructure_overflow', target: 'wastewater_bypass_discharge', verb: 'forces', adverb: 'when treatment capacity is exceeded', influence: 0.64 },
  { source: 'wastewater_infrastructure_overflow', target: 'combined_sewer_overflow', verb: 'manifests as', adverb: 'where combined sewer systems discharge during hydraulic overload', influence: 0.62 },
  { source: 'wastewater_bypass_discharge', target: 'drinking_water_treatment_stress', verb: 'intensifies', adverb: 'through contamination and turbidity', influence: 0.56 },
  { source: 'thermokarst_expansion', target: 'polar_infrastructure_failure', verb: 'destabilizes', adverb: 'through ground subsidence', influence: 0.62 },
  { source: 'polar_infrastructure_failure', target: 'critical_infrastructure_fragility', verb: 'amplifies', adverb: 'through remote asset failure', influence: 0.53 },
  { source: 'grid_peak_load_stress', target: 'energy_affordability_crisis', verb: 'worsens', adverb: 'through peak-cost and reliability pressure', influence: 0.52 },
  { source: 'energy_affordability_crisis', target: 'utility_disconnection_risk', verb: 'raises', adverb: 'through arrears and shutoff exposure', influence: 0.66 },
  { source: 'utility_disconnection_risk', target: 'public_health_heat_burden', verb: 'amplifies', adverb: 'when cooling and medical devices fail', influence: 0.58 },
  { source: 'utility_disconnection_risk', target: 'heat_related_mortality_burden', verb: 'raises', adverb: 'when cooling, hydration, and medical support fail together', influence: 0.56 },
  { source: 'temp', target: 'urban_tree_canopy_loss', verb: 'raises pressure on', adverb: 'through heat and drought stress', influence: 0.46 },
  { source: 'urban_tree_canopy_loss', target: 'nocturnal_heat_stress', verb: 'intensifies', adverb: 'by reducing nighttime cooling', influence: 0.55 },
  { source: 'airport_climate_exposure', target: 'airport_operational_disruption', verb: 'translates into', adverb: 'through runway and schedule constraints', influence: 0.6 },
  { source: 'marine_fisheries_collapse', target: 'fish_landing_supply_disruption', verb: 'shrinks', adverb: 'through lower and less reliable catch', influence: 0.57 },
  { source: 'marine_food_web_simplification', target: 'fish_landing_supply_disruption', verb: 'destabilizes', adverb: 'when altered trophic structure reduces predictable catch composition and timing', influence: 0.52 },
  { source: 'pelagic_species_redistribution', target: 'fish_landing_supply_disruption', verb: 'reorganizes', adverb: 'through shifting access and seasonality', influence: 0.5 },
  { source: 'fish_landing_supply_disruption', target: 'fishery_protein_dependence', verb: 'exposes', adverb: 'when local protein supply narrows', influence: 0.61 },
  { source: 'fishery_protein_dependence', target: 'food_import_exposure', verb: 'raises', adverb: 'when domestic fish supply becomes unreliable', influence: 0.49 },
  { source: 'food_import_exposure', target: 'cold_chain_failure_risk', verb: 'amplifies', adverb: 'through import and storage dependence', influence: 0.48 },
  { source: 'food_import_exposure', target: 'humanitarian_resource_gaps', verb: 'widens', adverb: 'when supply buffers fail', influence: 0.44 },
  { source: 'food_import_exposure', target: 'disaster_recovery_inequality', verb: 'deepens', adverb: 'through uneven price and access shocks', influence: 0.43 },
  { source: 'watershed_forest_loss', target: 'freshwater_ecosystem_collapse', verb: 'degrades toward', adverb: 'through erosion and runoff change', influence: 0.51 },
  { source: 'watershed_forest_loss', target: 'drinking_water_treatment_stress', verb: 'loads', adverb: 'through turbidity and source-water stress', influence: 0.54 },
  { source: 'watershed_forest_loss', target: 'hydropower_reliability_decline', verb: 'destabilizes', adverb: 'through runoff and sediment shifts', influence: 0.46 },
  { source: 'insurance_retreat', target: 'coastal_property_insurance_redlines', verb: 'hardens into', adverb: 'through nonrenewals and repricing', influence: 0.58 },
  { source: 'coastal_property_insurance_redlines', target: 'mortgage_market_exposure', verb: 'feeds into', adverb: 'through lending and valuation stress', influence: 0.56 },
  { source: 'mortgage_market_exposure', target: 'relocation_governance_capacity', verb: 'pressures', adverb: 'when retreat becomes a housing-finance problem', influence: 0.47 },
  { source: 'insurance_retreat', target: 'climate_litigation_pressure', verb: 'feeds', adverb: 'through liability and disclosure disputes', influence: 0.43 },
  { source: 'public_health_heat_burden', target: 'disaster_recovery_inequality', verb: 'widens', adverb: 'when illness and care burdens recover unevenly', influence: 0.45 },
  { source: 'relocation_governance_capacity', target: 'managed_retreat_pressure', verb: 'hardens into', adverb: 'when institutions cannot absorb movement smoothly', influence: 0.41 },
  { source: 'climate_litigation_pressure', target: 'adaptation_capital_shortfall', verb: 'redirects pressure onto', adverb: 'through contested responsibility and delay', influence: 0.38 },

  // Explicit replacements for legacy procedural links. Each relationship is reviewed and source-backed.
  { source: 'shipping', target: 'supply_chain_port_bottlenecks', verb: 'concentrates disruption at', adverb: 'through cargo delays and rerouting', influence: 0.58 },
  { source: 'aviation', target: 'aviation_jet_fuel_emissions', verb: 'produces', adverb: 'through fuel combustion', influence: 0.68 },
  { source: 'air_conditioning_refrigerants', target: 'public_health_heat_burden', verb: 'shapes exposure to', adverb: 'through cooling access and reliability', influence: 0.46 },
  { source: 'cement_concrete', target: 'cement_process_emissions', verb: 'produces', adverb: 'through clinker calcination and fuel use', influence: 0.76 },
  { source: 'steel', target: 'steel_decarbonization_gap', verb: 'faces', adverb: 'through coal-intensive production routes', influence: 0.61 },
  { source: 'gas_power_dependence', target: 'peaker_plant_lock_in', verb: 'reinforces', adverb: 'through dispatchable capacity dependence', influence: 0.57 },
  { source: 'transmission_buildout_lag', target: 'transformer_supply_bottleneck', verb: 'compounds', adverb: 'through shared equipment constraints', influence: 0.59 },
  { source: 'transmission_buildout_lag', target: 'renewable_curtailment_losses', verb: 'increases', adverb: 'when generation outpaces grid capacity', influence: 0.56 },
  { source: 'critical_mineral_extraction_pressure', target: 'battery_supply_chain_pressure', verb: 'feeds into', adverb: 'through constrained mining and processing', influence: 0.6 },
  { source: 'food_waste', target: 'methane', verb: 'produces', adverb: 'when landfilled anaerobically', influence: 0.62 },
  { source: 'plastics_petrochemicals', target: 'carbon_emission', verb: 'adds', adverb: 'through fossil feedstocks and process energy', influence: 0.58 },
  { source: 'fertilizer_production', target: 'synthetic_fertilizer_n2o_outflow', verb: 'feeds', adverb: 'through nitrogen fertilizer supply and use', influence: 0.63 },
  { source: 'mining_critical_minerals', target: 'critical_mineral_extraction_pressure', verb: 'creates', adverb: 'through land, water, and processing demand', influence: 0.67 },
  { source: 'urban_sprawl_housing', target: 'asphalt_pavement_heat_absorbers', verb: 'expands', adverb: 'through paved low-density development', influence: 0.51 },
  { source: 'permafrost_thaw', target: 'talik_expansion', verb: 'expands', adverb: 'through persistent ground thaw', influence: 0.63 },
  { source: 'permafrost_thaw', target: 'tundra_thermokarst_development', verb: 'causes', adverb: 'through ice-rich ground subsidence', influence: 0.7 },
  { source: 'permafrost_thaw', target: 'winter_ice_road_collapses', verb: 'shortens access for', adverb: 'through weaker seasonal freezing', influence: 0.55 },
  { source: 'ice_sheet_mass_loss', target: 'ice_shelf_grounding_line_retreat', verb: 'advances with', adverb: 'through marine ice instability', influence: 0.64 },
  { source: 'sea_ice_season_loss', target: 'arctic_amplification_rates', verb: 'amplifies warming through', adverb: 'via lower surface reflectivity', influence: 0.61 },
  { source: 'temp', target: 'greenland_glacier_melting', verb: 'increases', adverb: 'through atmospheric and ocean heat', influence: 0.7 },
  { source: 'temp', target: 'arctic_sea_ice_thinning', verb: 'accelerates', adverb: 'through reduced ice growth and survival', influence: 0.71 },
  { source: 'aquifer_overdraft', target: 'groundwater_depletion_wells', verb: 'lowers water availability in', adverb: 'when pumping exceeds recharge', influence: 0.72 },
  { source: 'aquifer_overdraft', target: 'deep_well_water_table_drops', verb: 'lowers', adverb: 'through sustained extraction', influence: 0.7 },
  { source: 'aquifer_overdraft', target: 'coastal_aquifer_degradation', verb: 'worsens', adverb: 'through drawdown and intrusion pressure', influence: 0.6 },
  { source: 'deforestation', target: 'canopy_cover_losses', verb: 'removes', adverb: 'through direct tree-cover loss', influence: 0.78 },
  { source: 'wet_bulb_heat', target: 'heatwave_excess_mortality_rates', verb: 'raises', adverb: 'through dangerous heat exposure', influence: 0.72 },
  { source: 'data_centers', target: 'data_center_heat_rejection', verb: 'requires', adverb: 'to dissipate computing waste heat', influence: 0.68 },
  { source: 'data_centers', target: 'dense_rack_power_demand', verb: 'concentrates', adverb: 'in high-density computing racks', influence: 0.64 },
  { source: 'semiconductor_fabs', target: 'semiconductor_fab_water_demand', verb: 'require', adverb: 'for ultrapure processing and cooling', influence: 0.72 },
  { source: 'semiconductor_fabs', target: 'semiconductor_f_gas_emissions', verb: 'emit', adverb: 'through etching and chamber cleaning', influence: 0.68 },
  { source: 'coastal_hypoxia', target: 'anoxic_dead_zones', verb: 'can deepen into', adverb: 'when oxygen is severely depleted', influence: 0.67 },
  { source: 'carbon_emission', target: 'oceanic_carbon_sink_saturation', verb: 'loads', adverb: 'while uptake efficiency changes', influence: 0.54 },
  { source: 'aviation_demand_growth', target: 'aero_acoustic_jet_noise_plumes', verb: 'increases', adverb: 'through additional aircraft activity', influence: 0.54 },
  { source: 'urbanization', target: 'metropolitan_gridlock_emissions', verb: 'increases', adverb: 'through car-dependent travel and congestion', influence: 0.59 },
  { source: 'fast_fashion', target: 'textile_factory_toxic_dyes', verb: 'drives', adverb: 'through high-throughput textile production', influence: 0.62 },
  { source: 'fast_fashion', target: 'unsold_apparel_incineration', verb: 'creates', adverb: 'through overproduction and short product cycles', influence: 0.58 },
  { source: 'fast_fashion', target: 'textile_microfiber_shedding', verb: 'increases', adverb: 'through synthetic textile production and use', influence: 0.59 },
  { source: 'mangrove_destruction', target: 'mangrove_buffer_loss', verb: 'removes', adverb: 'through direct habitat loss', influence: 0.78 },
  { source: 'industry_farming', target: 'nitrogen_fertilizer_runoff', verb: 'releases', adverb: 'through excess fertilizer application', influence: 0.67 },
  { source: 'nitrogen_fertilizer_runoff', target: 'coastal_hypoxia', verb: 'contributes to', adverb: 'through eutrophication and oxygen drawdown', influence: 0.69 },
  { source: 'rice_paddy_methane_bubbles', target: 'methane', verb: 'release', adverb: 'from anaerobic flooded soils', influence: 0.66 },
  { source: 'landfill_methane_outflows', target: 'methane', verb: 'release', adverb: 'from anaerobic waste decomposition', influence: 0.74 },
  { source: 'palm_oil_canopy_clearance', target: 'deforestation', verb: 'contributes to', adverb: 'through plantation land conversion', influence: 0.67 },
  { source: 'shipping', target: 'inland_waterway_fuel_spills', verb: 'creates risk of', adverb: 'through vessel and fuel-handling incidents', influence: 0.43 },
  { source: 'personal_conveyance', target: 'automotive_brake_dust_particulates', verb: 'produces', adverb: 'through brake wear', influence: 0.52 },
  { source: 'road_freight_diesel_lock_in', target: 'fugitive_dust_from_dirt_roads', verb: 'raises', adverb: 'through heavy-vehicle traffic on unpaved routes', influence: 0.42 },
  { source: 'aviation_demand_growth', target: 'aviation_jet_fuel_emissions', verb: 'increases', adverb: 'through additional jet-fuel demand', influence: 0.66 },
  { source: 'aviation_demand_growth', target: 'aviation_condensation_trails', verb: 'increases', adverb: 'through additional high-altitude flights', influence: 0.54 },
  { source: 'ozone_formation_pressure', target: 'tropospheric_ozone', verb: 'raises', adverb: 'when precursor chemistry and sunlight align', influence: 0.61 },
  { source: 'migration', target: 'managed_retreat_pressure', verb: 'adds pressure for', adverb: 'where repeated hazards make settlement untenable', influence: 0.49 },
  { source: 'ice_sheet_mass_loss', target: 'glacier_calving_events', verb: 'advances with', adverb: 'through dynamic ice-front retreat', influence: 0.57 },
  { source: 'rail_heat_buckling', target: 'commuter_rail_transit_gaps', verb: 'widens', adverb: 'through heat-related slowdowns and cancellations', influence: 0.58 },
  { source: 'rail_heat_buckling', target: 'railroad_chemical_car_derailments', verb: 'raises risk of', adverb: 'when track geometry degrades', influence: 0.49 },
  { source: 'critical_infrastructure_fragility', target: 'extreme_weather_infrastructure_costs', verb: 'raises', adverb: 'through repeated damage and service failure', influence: 0.59 },
  { source: 'coastal_hypoxia', target: 'estuarine_nursery_loss', verb: 'degrades', adverb: 'through persistent low-oxygen exposure', influence: 0.64 },
  { source: 'thermal_stratification_intensification', target: 'shelf_sea_hypoxia', verb: 'pushes toward', adverb: 'by strengthening low-mixing shelf-water conditions', influence: 0.56 },
  { source: 'thermal_stratification_intensification', target: 'estuarine_nursery_loss', verb: 'narrows resilience in', adverb: 'when layered warm waters reduce oxygen and habitat quality', influence: 0.44 },
  { source: 'ocean_current_regime_shift', target: 'oceanic_upwelling_disruptions', verb: 'reorganizes', adverb: 'through altered wind-driven and coastal circulation patterns', influence: 0.52 },
  { source: 'oceanic_upwelling_disruptions', target: 'phytoplankton_decline', verb: 'reduces productivity in', adverb: 'when nutrient delivery weakens', influence: 0.61 },
  { source: 'oceanic_upwelling_disruptions', target: 'fish_landing_supply_disruption', verb: 'destabilizes', adverb: 'where catch depends on nutrient-fueled coastal productivity', influence: 0.5 },
  { source: 'phytoplankton_decline', target: 'fish_landing_supply_disruption', verb: 'erodes reliability of', adverb: 'when food-web productivity falls at the base of marine harvest systems', influence: 0.46 },
  { source: 'estuarine_nursery_loss', target: 'marine_fisheries_collapse', verb: 'raises risk of', adverb: 'when juvenile habitat degradation weakens future recruitment', influence: 0.48 },
  { source: 'estuarine_nursery_loss', target: 'fish_landing_supply_disruption', verb: 'reduces stability of', adverb: 'when weaker juvenile recruitment narrows future coastal catches', influence: 0.53 },
  { source: 'ice_sheet_mass_loss', target: 'nunatak_habitat_shrinkage', verb: 'changes exposure of', adverb: 'as surrounding ice geometry shifts', influence: 0.43 },
  { source: 'coal_fired_power_outflow', target: 'carbon_emission', verb: 'releases', adverb: 'through coal combustion', influence: 0.82 },
  { source: 'sulfur_dioxide', target: 'aerosol_cooling_loss', verb: 'contributes to masking', adverb: 'through sulfate aerosol formation', influence: 0.58 },
  { source: 'hyperscale_server_hall', target: 'data_center_heat_rejection', verb: 'requires', adverb: 'to dissipate dense computing heat', influence: 0.68 },
  { source: 'topsoil_salinization_fields', target: 'crop_yield_volatility', verb: 'increases', adverb: 'through salt stress on crops', influence: 0.62 },
  { source: 'canopy_cover_losses', target: 'pollinator_service_decline', verb: 'contributes to', adverb: 'through habitat and forage loss', influence: 0.54 },
  { source: 'phytoplankton_decline', target: 'marine_food_web_simplification', verb: 'reorganizes', adverb: 'through changes at the food-web base', influence: 0.58 },
  { source: 'marine_heatwaves', target: 'marine_fisheries_collapse', verb: 'raises risk of', adverb: 'through mortality and stock disruption', influence: 0.63 },
  { source: 'volatile_organic_compounds', target: 'tropospheric_ozone', verb: 'forms', adverb: 'with nitrogen oxides and sunlight', influence: 0.67 },
  { source: 'urban_heat_dome_stagnation', target: 'public_health_heat_burden', verb: 'increases', adverb: 'through persistent urban heat exposure', influence: 0.61 },
  { source: 'migration', target: 'climate_refugee_camp_densities', verb: 'raises pressure on', adverb: 'when durable relocation capacity lags', influence: 0.48 },
  { source: 'data_centers', target: 'cloud_campus_water_stress', verb: 'concentrates', adverb: 'through local cooling-water demand', influence: 0.57 },
  { source: 'temp', target: 'humidity_amplification', verb: 'increases', adverb: 'as warmer air supports more atmospheric moisture', influence: 0.58 },
  { source: 'humidity_amplification', target: 'wet_bulb_heat', verb: 'intensifies', adverb: 'by limiting evaporative cooling', influence: 0.64 },
  { source: 'humidity_amplification', target: 'public_health_heat_burden', verb: 'raises', adverb: 'through more dangerous humid-heat exposure', influence: 0.58 },
  { source: 'humidity_amplification', target: 'flash_flood_regime', verb: 'contributes to', adverb: 'through heavier short-duration rainfall potential', influence: 0.43 },
  { source: 'temp', target: 'atmospheric_dryness', verb: 'increases', adverb: 'through higher atmospheric evaporative demand', influence: 0.61 },
  { source: 'atmospheric_dryness', target: 'crop_yield_volatility', verb: 'increases', adverb: 'through plant water stress and reduced productivity', influence: 0.56 },
  { source: 'atmospheric_dryness', target: 'lightning_fire_weather', verb: 'raises ignition success under', adverb: 'by drying receptive vegetation fuels', influence: 0.52 },
  { source: 'temp', target: 'lightning_fire_weather', verb: 'worsens', adverb: 'through hotter and drier fire-weather conditions', influence: 0.48 },
  { source: 'lightning_fire_weather', target: 'smoke_exposure_burden', verb: 'increases', adverb: 'when lightning ignites dry, flammable fuels', influence: 0.52 },
  { source: 'temp', target: 'smoke_exposure_burden', verb: 'raises risk of', adverb: 'through longer and more severe fire seasons', influence: 0.44 },
  { source: 'pm2_5_particulates', target: 'smoke_exposure_burden', verb: 'drives', adverb: 'because fine particles are the principal smoke exposure hazard', influence: 0.68 },
  { source: 'black_carbon_deposition', target: 'soot_deposition_on_snow', verb: 'darkens', adverb: 'when deposited onto snow and ice', influence: 0.72 },
  { source: 'particulate_soot_levels', target: 'soot_deposition_on_snow', verb: 'increase deposition onto', adverb: 'after atmospheric transport and fallout', influence: 0.46 },
  { source: 'soot_deposition_on_snow', target: 'snowmelt_timing_shift', verb: 'advances', adverb: 'by lowering snow albedo and accelerating melt', influence: 0.66 },
  { source: 'temp', target: 'ozone_formation_pressure', verb: 'increases', adverb: 'as hot sunny conditions accelerate ozone chemistry', influence: 0.52 },
  { source: 'ozone_formation_pressure', target: 'ground_level_ozone_triggers', verb: 'manifests through', adverb: 'nitrogen oxides, volatile organics, heat, and sunlight', influence: 0.61 },
  { source: 'tropospheric_ozone', target: 'crop_yield_volatility', verb: 'increases', adverb: 'through damage to sensitive crops and vegetation', influence: 0.56 },
  { source: 'tropospheric_ozone', target: 'urban_smog_health_expenses', verb: 'raises', adverb: 'through respiratory illness and care demand', influence: 0.46 },
  { source: 'temp', target: 'compound_day_night_heat_extremes', verb: 'increases', adverb: 'by shifting both daytime highs and nighttime lows', influence: 0.66 },
  { source: 'compound_day_night_heat_extremes', target: 'public_health_heat_burden', verb: 'raises', adverb: 'by removing overnight physiological recovery', influence: 0.67 },
  { source: 'compound_day_night_heat_extremes', target: 'heatwave_excess_mortality_rates', verb: 'increases', adverb: 'through sustained day-and-night heat exposure', influence: 0.69 },
  { source: 'temp', target: 'nocturnal_heat_stress', verb: 'increases', adverb: 'as nighttime minimum temperatures rise', influence: 0.61 },
  { source: 'nocturnal_heat_stress', target: 'public_health_heat_burden', verb: 'raises', adverb: 'by limiting overnight cooling and recovery', influence: 0.62 },
  { source: 'nocturnal_heat_stress', target: 'heatwave_excess_mortality_rates', verb: 'increases', adverb: 'through independent hot-night health risk', influence: 0.64 },
  { source: 'blocking_pattern_persistence', target: 'drought_persistence', verb: 'sustains', adverb: 'by suppressing rainfall under persistent circulation', influence: 0.56 },
  { source: 'blocking_pattern_persistence', target: 'compound_day_night_heat_extremes', verb: 'prolongs', adverb: 'through persistent anticyclonic heat conditions', influence: 0.55 },
  { source: 'rossby_wave_stalling', target: 'blocking_pattern_persistence', verb: 'supports', adverb: 'through slowly propagating planetary-wave patterns', influence: 0.43 },
  { source: 'temp', target: 'low_cloud_deck_retreat', verb: 'contributes to', adverb: 'through warming-sensitive marine low-cloud processes', influence: 0.42 },
  { source: 'low_cloud_deck_retreat', target: 'temp', verb: 'amplifies', adverb: 'by reducing reflected sunlight in low-cloud regimes', influence: 0.47 },

  // Ocean batch 02: replace broad family expansion with bounded physical and operational chains.
  { source: 'temp', target: 'oceanic_deoxygenation', verb: 'drives', adverb: 'through lower oxygen solubility, stratification, and ventilation change', influence: 0.64 },
  { source: 'ocean_salinity_stratification', target: 'oceanic_deoxygenation', verb: 'intensifies', adverb: 'by restricting vertical ventilation and oxygen renewal', influence: 0.58 },
  { source: 'oceanic_deoxygenation', target: 'marine_food_web_simplification', verb: 'compresses habitat within', adverb: 'as low-oxygen waters exclude sensitive species', influence: 0.59 },
  { source: 'oceanic_deoxygenation', target: 'marine_fisheries_collapse', verb: 'raises risk of', adverb: 'through habitat loss, mortality, and stock redistribution', influence: 0.55 },
  { source: 'temp', target: 'ocean_salinity_stratification', verb: 'strengthens', adverb: 'through upper-ocean warming and density separation', influence: 0.6 },
  { source: 'carbon_emission', target: 'ocean_acidification', verb: 'causes', adverb: 'as absorbed carbon dioxide changes seawater carbonate chemistry', influence: 0.78 },
  { source: 'ocean_acidification', target: 'shell_calcification_failures', verb: 'increases', adverb: 'by reducing carbonate availability for shell formation', influence: 0.7 },
  { source: 'ocean_acidification', target: 'marine_food_web_simplification', verb: 'contributes to', adverb: 'through species-specific physiological and trophic stress', influence: 0.52 },
  { source: 'temp', target: 'antarctic_bottom_water_decline', verb: 'contributes to', adverb: 'through Southern Ocean warming and freshening', influence: 0.47 },
  { source: 'ice_sheet_mass_loss', target: 'antarctic_bottom_water_decline', verb: 'weakens formation of', adverb: 'as meltwater freshens Antarctic shelf waters', influence: 0.56 },
  { source: 'antarctic_bottom_water_decline', target: 'oceanic_deoxygenation', verb: 'reduces renewal against', adverb: 'by weakening abyssal ventilation', influence: 0.59 },
  { source: 'antarctic_bottom_water_decline', target: 'deep_ocean_heat_sinks', verb: 'alters', adverb: 'through reduced abyssal overturning and ventilation', influence: 0.48 },
  { source: 'pacific_decadal_oscillation', target: 'marine_heatwaves', verb: 'modulates', adverb: 'through basin-scale sea-surface temperature variability', influence: 0.5 },
  { source: 'pacific_decadal_oscillation', target: 'environ_anomalies', verb: 'organizes', adverb: 'as a monitored mode of Pacific climate variability', influence: 0.42 },
  { source: 'pacific_decadal_oscillation', target: 'pelagic_species_redistribution', verb: 'shapes', adverb: 'through regional temperature and habitat anomalies', influence: 0.4 },
  { source: 'atlantic_multidecadal_oscillation', target: 'environ_anomalies', verb: 'tracks', adverb: 'through multidecadal North Atlantic temperature variability', influence: 0.39 },
  { source: 'atlantic_multidecadal_oscillation', target: 'marine_heatwaves', verb: 'modulates', adverb: 'within North Atlantic temperature regimes', influence: 0.38 },
  { source: 'atlantic_multidecadal_oscillation', target: 'ocean_current_regime_shift', verb: 'co-varies with', adverb: 'within North Atlantic circulation variability', influence: 0.34 },
  { source: 'atlantic_ni_o_ni_a', target: 'environ_anomalies', verb: 'redistributes', adverb: 'through tropical Atlantic rainfall and circulation teleconnections', influence: 0.43 },
  { source: 'atlantic_ni_o_ni_a', target: 'monsoon_volatility', verb: 'modulates', adverb: 'through tropical Atlantic rainfall teleconnections', influence: 0.4 },
  { source: 'atlantic_ni_o_ni_a', target: 'pelagic_species_redistribution', verb: 'shapes', adverb: 'through tropical Atlantic habitat anomalies', influence: 0.35 },
  { source: 'indian_ocean_dipole', target: 'monsoon_volatility', verb: 'modulates', adverb: 'through Indian Ocean rainfall and circulation anomalies', influence: 0.5 },
  { source: 'indian_ocean_dipole', target: 'environ_anomalies', verb: 'redistributes', adverb: 'across Indian Ocean climate teleconnections', influence: 0.46 },
  { source: 'indian_ocean_dipole', target: 'food', verb: 'affects reliability of', adverb: 'through regional rainfall and drought anomalies', influence: 0.38 },
  { source: 'freshwater_ecosystem_collapse', target: 'harmful_algal_blooms', verb: 'creates conditions favoring', adverb: 'through nutrient, flow, and temperature imbalance', influence: 0.48 },
  { source: 'marine_heatwaves', target: 'harmful_algal_blooms', verb: 'can trigger', adverb: 'when warm conditions align with nutrients and bloom ecology', influence: 0.51 },
  { source: 'marine_heatwaves', target: 'marine_pathogen_range_expansion', verb: 'extends', adverb: 'through warmer coastal and shelf waters', influence: 0.47 },
  { source: 'temp', target: 'thermal_stratification_intensification', verb: 'strengthens', adverb: 'through upper-ocean warming and density layering', influence: 0.56 },
  { source: 'thermal_stratification_intensification', target: 'coastal_hypoxia', verb: 'raises risk of', adverb: 'by restricting oxygen renewal in coastal and shelf waters', influence: 0.58 },
  { source: 'harmful_algal_blooms', target: 'fish_landing_supply_disruption', verb: 'disrupts', adverb: 'through fish kills, toxins, and harvest closures', influence: 0.6 },
  { source: 'ocean_current_regime_shift', target: 'marine_food_web_simplification', verb: 'reorganizes', adverb: 'through altered heat, nutrient, and habitat transport', influence: 0.51 },
  { source: 'marine_food_web_simplification', target: 'marine_fisheries_collapse', verb: 'weakens', adverb: 'by narrowing prey, habitat, and recruitment pathways', influence: 0.56 },
  { source: 'coastal_hypoxia', target: 'marine_fisheries_collapse', verb: 'raises risk of', adverb: 'through habitat compression, mortality, and recruitment loss', influence: 0.61 },
  { source: 'coastal_hypoxia', target: 'fish_landing_supply_disruption', verb: 'reduces reliability of', adverb: 'through stock displacement and low-oxygen mortality', influence: 0.55 },
  { source: 'littoral_surge_vulnerability', target: 'compound_coastal_flooding', verb: 'amplifies', adverb: 'when surge coincides with elevated coastal water levels', influence: 0.6 },
  { source: 'littoral_surge_vulnerability', target: 'storm_surge_floods', verb: 'translates into', adverb: 'where exposed shorelines lack sufficient buffers', influence: 0.62 },
  { source: 'littoral_surge_vulnerability', target: 'coastal_erosion', verb: 'accelerates', adverb: 'through repeated wave and surge attack', influence: 0.53 },
  { source: 'coastal_inundation_risk', target: 'delta_salt_intrusion_fronts', verb: 'pushes inland', adverb: 'through higher baseline water levels in deltas and estuaries', influence: 0.54 },
  { source: 'coastal_inundation_risk', target: 'coastal_aquifer_degradation', verb: 'pressures', adverb: 'when saline flooding and tidal intrusion degrade connected groundwater', influence: 0.46 },
  { source: 'river_flow_regime_shift', target: 'delta_salt_intrusion_fronts', verb: 'reshapes', adverb: 'when weaker or mistimed river discharge reduces freshwater resistance to salinity intrusion', influence: 0.51 },
  { source: 'drought_persistence', target: 'delta_salt_intrusion_fronts', verb: 'extends', adverb: 'when prolonged low-flow conditions allow saline fronts to move farther inland', influence: 0.53 },
  { source: 'delta_salt_intrusion_fronts', target: 'drinking_water_treatment_stress', verb: 'threatens', adverb: 'when saline water intrudes into source intakes and treatment systems', influence: 0.59 },
  { source: 'delta_salt_intrusion_fronts', target: 'freshwater_lens_compression', verb: 'extends pressure on', adverb: 'when saline fronts intensify intrusion into shallow coastal freshwater bodies', influence: 0.47 },
  { source: 'delta_salt_intrusion_fronts', target: 'coastal_aquifer_degradation', verb: 'accelerates', adverb: 'by increasing salinization pressure in connected coastal groundwater', influence: 0.56 },
  { source: 'amoc', target: 'ocean_current_regime_shift', verb: 'is a major component of', adverb: 'within Atlantic overturning and heat transport', influence: 0.5 },

  // Atmosphere batch 02: natural modes remain associative; forcing claims stay bounded.
  { source: 'temp', target: 'hail_hazard_shift', verb: 'redistributes', adverb: 'through changing freezing levels and convective environments', influence: 0.46 },
  { source: 'hail_hazard_shift', target: 'crop_yield_volatility', verb: 'increases', adverb: 'through damaging hail exposure during growing seasons', influence: 0.58 },
  { source: 'hail_hazard_shift', target: 'insurance_retreat', verb: 'adds pressure to', adverb: 'through repeated property and crop losses', influence: 0.4 },
  { source: 'madden_julian_oscillation', target: 'monsoon_volatility', verb: 'modulates', adverb: 'through eastward-moving tropical convection', influence: 0.58 },
  { source: 'madden_julian_oscillation', target: 'environ_anomalies', verb: 'organizes', adverb: 'through subseasonal rainfall and circulation anomalies', influence: 0.5 },
  { source: 'madden_julian_oscillation', target: 'flash_flood_regime', verb: 'can intensify', adverb: 'when its active convection raises heavy-rainfall potential', influence: 0.4 },
  { source: 'extreme_precipitation_intensity', target: 'wastewater_infrastructure_overflow', verb: 'overwhelms', adverb: 'through short-duration runoff surges', influence: 0.64 },
  { source: 'temp', target: 'tropical_cyclone_rapid_intensification', verb: 'raises odds of', adverb: 'when warmer ocean conditions support faster storm strengthening', influence: 0.49 },
  { source: 'tropical_cyclone_rapid_intensification', target: 'compound_coastal_flooding', verb: 'compresses adaptation time for', adverb: 'when stronger storms approach with less warning', influence: 0.51 },
  { source: 'tropical_cyclone_rapid_intensification', target: 'storm_surge_floods', verb: 'elevates risk of', adverb: 'when storms intensify close to shore', influence: 0.57 },
  { source: 'north_atlantic_oscillation', target: 'environ_anomalies', verb: 'organizes', adverb: 'through North Atlantic temperature, rainfall, and storm-track patterns', influence: 0.51 },
  { source: 'north_atlantic_oscillation', target: 'drought_persistence', verb: 'modulates', adverb: 'through regional precipitation and storm-track anomalies', influence: 0.41 },
  { source: 'north_atlantic_oscillation', target: 'blocking_pattern_persistence', verb: 'co-varies with', adverb: 'within persistent North Atlantic circulation regimes', influence: 0.36 },
  { source: 'arctic_oscillation', target: 'environ_anomalies', verb: 'organizes', adverb: 'through cold-season pressure and circulation anomalies', influence: 0.47 },
  { source: 'arctic_oscillation', target: 'polar_vortex_instabilities', verb: 'tracks', adverb: 'through linked polar-cap circulation variability', influence: 0.42 },
  { source: 'arctic_oscillation', target: 'jet_stream_volatility', verb: 'co-varies with', adverb: 'through Northern Hemisphere circulation structure', influence: 0.37 },
  { source: 'pacific_north_american_pattern', target: 'environ_anomalies', verb: 'organizes', adverb: 'through North American temperature and precipitation patterns', influence: 0.52 },
  { source: 'pacific_north_american_pattern', target: 'drought_persistence', verb: 'modulates', adverb: 'through regional precipitation anomalies', influence: 0.43 },
  { source: 'pacific_north_american_pattern', target: 'blocking_pattern_persistence', verb: 'tracks', adverb: 'through Pacific jet and blocking configurations', influence: 0.4 },
  { source: 'southern_annular_mode', target: 'environ_anomalies', verb: 'organizes', adverb: 'through Southern Hemisphere wind and pressure anomalies', influence: 0.48 },
  { source: 'southern_annular_mode', target: 'ocean_current_regime_shift', verb: 'modulates', adverb: 'through Southern Ocean wind forcing', influence: 0.41 },
  { source: 'southern_annular_mode', target: 'antarctic_bottom_water_decline', verb: 'shapes conditions for', adverb: 'through Antarctic winds and shelf-ocean exchange', influence: 0.36 },
  { source: 'quasi_biennial_oscillation', target: 'stratospheric_water_vapor', verb: 'controls variability in', adverb: 'through descending tropical stratospheric wind phases', influence: 0.52 },
  { source: 'quasi_biennial_oscillation', target: 'stratospheric_cooling', verb: 'organizes temperature variability within', adverb: 'through alternating easterly and westerly wind regimes', influence: 0.4 },
  { source: 'quasi_biennial_oscillation', target: 'madden_julian_oscillation', verb: 'modulates activity of', adverb: 'through observed stratosphere-troposphere coupling', influence: 0.39 },
  { source: 'rossby_wave_stalling', target: 'drought_persistence', verb: 'can prolong', adverb: 'when slow planetary-wave patterns suppress rainfall', influence: 0.45 },
  { source: 'rossby_wave_stalling', target: 'compound_day_night_heat_extremes', verb: 'can prolong', adverb: 'through persistent heat-bearing circulation', influence: 0.44 },
  { source: 'low_cloud_deck_retreat', target: 'cloud_albedo_shift', verb: 'reduces', adverb: 'as less low-cloud cover reflects incoming sunlight', influence: 0.56 },
  { source: 'aerosol_cooling_loss', target: 'temp', verb: 'reveals additional warming in', adverb: 'as reflective aerosol masking declines', influence: 0.58 },
  { source: 'aerosol_cooling_loss', target: 'cloud_albedo_shift', verb: 'changes', adverb: 'through weaker aerosol-cloud interactions', influence: 0.45 },
  { source: 'aerosol_cooling_loss', target: 'monsoon_volatility', verb: 'shifts', adverb: 'through aerosol-driven circulation and rainfall changes', influence: 0.4 },
  { source: 'thermal_inversion_events', target: 'particulate_soot_levels', verb: 'concentrates', adverb: 'by trapping soot and fine particles near the surface', influence: 0.54 },
  { source: 'wildfire_regime_shift', target: 'pyrocumulonimbus_smoke_injection', verb: 'raises risk of', adverb: 'during extreme fire behavior', influence: 0.49 },
  { source: 'pyrocumulonimbus_smoke_injection', target: 'stratospheric_aerosols', verb: 'injects smoke into', adverb: 'through fire-driven convective lofting', influence: 0.46 },
  { source: 'pyrocumulonimbus_smoke_injection', target: 'aerosol_scattering_index', verb: 'elevates', adverb: 'when lofted smoke increases upper-atmosphere aerosol loading', influence: 0.43 },

  // Energy batch 02: physical equipment, emissions, and service consequences replace hub reroutes.
  { source: 'data_centers', target: 'grid_peak_load_stress', verb: 'adds to', adverb: 'through large, concentrated electricity demand', influence: 0.62 },
  { source: 'ai_data_centers', target: 'grid_peak_load_stress', verb: 'accelerates', adverb: 'through rapidly growing high-density computing load', influence: 0.66 },
  { source: 'grid_peak_load_stress', target: 'public_health_heat_burden', verb: 'raises', adverb: 'when outages interrupt cooling and medical equipment', influence: 0.57 },
  { source: 'grid_peak_load_stress', target: 'peaker_plant_lock_in', verb: 'sustains', adverb: 'when peak reliability is met with dispatchable fossil capacity', influence: 0.5 },
  { source: 'peaker_plant_lock_in', target: 'carbon_emission', verb: 'adds', adverb: 'through continued fossil generation during peak demand', influence: 0.61 },
  { source: 'peaker_plant_lock_in', target: 'ambient_air_quality_deficit', verb: 'worsens', adverb: 'through concentrated combustion pollution near peaker facilities', influence: 0.52 },
  { source: 'peaker_plant_lock_in', target: 'energy_affordability_crisis', verb: 'adds pressure to', adverb: 'through high-cost peak generation and capacity dependence', influence: 0.4 },
  { source: 'transmission_buildout_lag', target: 'grid_peak_load_stress', verb: 'worsens', adverb: 'by limiting transfer capacity during high demand', influence: 0.54 },
  { source: 'transformer_supply_bottleneck', target: 'critical_infrastructure_fragility', verb: 'extends', adverb: 'by delaying grid expansion and replacement', influence: 0.58 },
  { source: 'transformer_supply_bottleneck', target: 'grid_peak_load_stress', verb: 'constrains relief from', adverb: 'when substations cannot be expanded on schedule', influence: 0.49 },
  { source: 'data_centers', target: 'transformer_supply_bottleneck', verb: 'adds demand pressure to', adverb: 'through large-load interconnection and substation needs', influence: 0.46 },
  { source: 'gas_power_dependence', target: 'carbon_emission', verb: 'sustains', adverb: 'through continued natural-gas combustion', influence: 0.66 },
  { source: 'gas_power_dependence', target: 'energy_affordability_crisis', verb: 'exposes consumers to', adverb: 'through fuel-price and wholesale-power volatility', influence: 0.45 },
  { source: 'industrial_heat_decarbonization_gap', target: 'carbon_emission', verb: 'sustains', adverb: 'through fossil process heat in industry', influence: 0.68 },
  { source: 'industrial_heat_decarbonization_gap', target: 'cement_process_emissions', verb: 'compounds', adverb: 'where kiln heat and calcination remain hard to abate', influence: 0.48 },
  { source: 'industrial_heat_decarbonization_gap', target: 'steel_decarbonization_gap', verb: 'compounds', adverb: 'where high-temperature production remains fossil-intensive', influence: 0.52 },
  { source: 'cement_process_emissions', target: 'carbon_emission', verb: 'adds directly to', adverb: 'through clinker calcination and kiln fuel use', influence: 0.76 },
  { source: 'steel_decarbonization_gap', target: 'carbon_emission', verb: 'sustains', adverb: 'through coal- and gas-intensive production routes', influence: 0.69 },
  { source: 'critical_mineral_extraction_pressure', target: 'resource_depletion', verb: 'intensifies', adverb: 'through concentrated land, water, mining, and processing demand', influence: 0.58 },
  { source: 'battery_supply_chain_pressure', target: 'resource_depletion', verb: 'deepens', adverb: 'where extraction, refining, and waste burdens concentrate', influence: 0.5 },
  { source: 'battery_supply_chain_pressure', target: 'renewable_curtailment_losses', verb: 'limits relief from', adverb: 'when storage deployment is constrained', influence: 0.41 },
  { source: 'semiconductor_fabs', target: 'semiconductor_fabrication_footprint', verb: 'creates', adverb: 'through fabrication energy, water, chemicals, and process gases', influence: 0.7 },
  { source: 'semiconductor_fabrication_footprint', target: 'cooling_water_competition', verb: 'adds to', adverb: 'through ultrapure-water and cooling demand', influence: 0.59 },
  { source: 'semiconductor_fabrication_footprint', target: 'carbon_emission', verb: 'adds', adverb: 'through electricity use and fluorinated process gases', influence: 0.57 },
  { source: 'cooling_water_competition', target: 'transformer_heat_failure_risk', verb: 'compounds', adverb: 'when generation constraints and peak heat stress coincide', influence: 0.44 },
  { source: 'cooling_water_competition', target: 'grid_peak_load_stress', verb: 'worsens', adverb: 'when thermal generation is constrained during hot periods', influence: 0.48 },
  { source: 'backup_generator_dependence', target: 'carbon_emission', verb: 'adds', adverb: 'through diesel and gas combustion during outages', influence: 0.57 },
  { source: 'utility_disconnection_risk', target: 'backup_generator_dependence', verb: 'increases reliance on', adverb: 'where essential services need temporary power', influence: 0.4 },
  { source: 'data_centers', target: 'backup_generator_dependence', verb: 'maintains', adverb: 'through uptime requirements during grid outages', influence: 0.5 },
  { source: 'energy_affordability_crisis', target: 'public_health_heat_burden', verb: 'raises', adverb: 'when households cannot afford adequate cooling', influence: 0.56 },
  { source: 'renewable_curtailment_losses', target: 'energy_affordability_crisis', verb: 'adds pressure to', adverb: 'when usable low-marginal-cost generation is discarded', influence: 0.39 },
  { source: 'renewable_curtailment_losses', target: 'carbon_emission', verb: 'can sustain', adverb: 'when curtailed clean generation is replaced by fossil output', influence: 0.42 },

  // Water batch 03: hydrology, infrastructure, and allocation chains.
  { source: 'temp', target: 'river_flow_regime_shift', verb: 'changes', adverb: 'through evaporation, precipitation, snowmelt, and runoff timing', influence: 0.6 },
  { source: 'temp', target: 'heat_related_mortality_burden', verb: 'raises', adverb: 'through more frequent and intense dangerous heat exposure', influence: 0.66 },
  { source: 'temp', target: 'occupational_heat_exposure', verb: 'raises', adverb: 'through higher heat and humidity during working hours', influence: 0.61 },
  { source: 'wet_bulb_heat', target: 'occupational_heat_exposure', verb: 'intensifies', adverb: 'when humidity sharply reduces safe labor capacity', influence: 0.68 },
  { source: 'river_flow_regime_shift', target: 'reservoir_storage_instability', verb: 'destabilizes', adverb: 'when inflow timing and volume depart from operating assumptions', influence: 0.58 },
  { source: 'drought_persistence', target: 'reservoir_storage_instability', verb: 'deepens', adverb: 'through prolonged inflow deficits', influence: 0.62 },
  { source: 'drought_persistence', target: 'soil_moisture_collapse', verb: 'drives', adverb: 'when root-zone moisture cannot recover seasonally', influence: 0.68 },
  { source: 'soil_moisture_collapse', target: 'crop_yield_volatility', verb: 'increases', adverb: 'through persistent root-zone water stress', influence: 0.65 },
  { source: 'soil_moisture_collapse', target: 'groundwater_depletion_wells', verb: 'raises pressure on', adverb: 'when irrigation shifts toward pumping', influence: 0.51 },
  { source: 'freshwater_lens_compression', target: 'drinking_water_treatment_stress', verb: 'increases', adverb: 'through salinity and reduced potable-water availability', influence: 0.57 },
  { source: 'coastal_aquifer_degradation', target: 'drinking_water_treatment_stress', verb: 'raises', adverb: 'when salinized groundwater reduces raw-water quality and supply flexibility', influence: 0.55 },
  { source: 'coastal_inundation_risk', target: 'drinking_water_treatment_stress', verb: 'raises stress on', adverb: 'when saline flooding and intake exposure degrade source-water quality', influence: 0.45 },
  { source: 'freshwater_lens_compression', target: 'desalination_dependence', verb: 'pushes toward', adverb: 'when thin coastal freshwater reserves can no longer meet reliable demand', influence: 0.52 },
  { source: 'coastal_aquifer_degradation', target: 'desalination_dependence', verb: 'increases reliance on', adverb: 'when salinized groundwater leaves fewer usable local supply options', influence: 0.54 },
  { source: 'drinking_water_treatment_stress', target: 'desalination_dependence', verb: 'can harden into', adverb: 'when utilities need more salinity-resilient supply infrastructure', influence: 0.4 },
  { source: 'industry_farming', target: 'irrigation_water_inefficiency', verb: 'can embed', adverb: 'through poorly matched application and conveyance losses', influence: 0.48 },
  { source: 'irrigation_water_inefficiency', target: 'aquifer_overdraft', verb: 'intensifies', adverb: 'when avoidable losses are replaced through pumping', influence: 0.59 },
  { source: 'irrigation_water_inefficiency', target: 'groundwater_depletion_wells', verb: 'deepens', adverb: 'through higher withdrawals per unit of crop output', influence: 0.55 },
  { source: 'river_flow_regime_shift', target: 'basin_treaty_breakdown', verb: 'pressures', adverb: 'when historical allocation rules no longer match available flow', influence: 0.45 },
  { source: 'drought_persistence', target: 'basin_treaty_breakdown', verb: 'raises pressure on', adverb: 'through repeated cross-border allocation shortfalls', influence: 0.42 },
  { source: 'basin_treaty_breakdown', target: 'conflict_risk_escalation', verb: 'can escalate into', adverb: 'when allocation disputes outpace cooperative institutions', influence: 0.38 },
  { source: 'resource_depletion', target: 'desalination_dependence', verb: 'increases reliance on', adverb: 'where conventional freshwater supplies become insufficient', influence: 0.5 },
  { source: 'desalination_dependence', target: 'brine_discharge_siltation', verb: 'can intensify', adverb: 'where concentrated discharge burdens enclosed or poorly flushed coastal waters', influence: 0.44 },
  { source: 'desalination_dependence', target: 'energy_affordability_crisis', verb: 'adds pressure to', adverb: 'through electricity-intensive water supply', influence: 0.41 },
  { source: 'desalination_dependence', target: 'carbon_emission', verb: 'can add to', adverb: 'where desalination electricity remains fossil-intensive', influence: 0.37 },
  { source: 'river_flow_regime_shift', target: 'reservoir_operating_shortfall', verb: 'creates', adverb: 'when release rules cannot match altered inflow timing', influence: 0.57 },
  { source: 'snowmelt_timing_shift', target: 'river_flow_regime_shift', verb: 'advances', adverb: 'by moving runoff away from historical seasonal timing', influence: 0.62 },
  { source: 'flash_flood_regime', target: 'drinking_water_treatment_stress', verb: 'overloads', adverb: 'through turbidity, contamination, and intake disruption', influence: 0.6 },
  { source: 'drought_persistence', target: 'drinking_water_treatment_stress', verb: 'intensifies', adverb: 'through lower source volume and concentrated contaminants', influence: 0.54 },
  { source: 'wastewater_bypass_discharge', target: 'harmful_algal_blooms', verb: 'can trigger', adverb: 'through nutrient-rich discharge into warm and stagnant receiving waters', influence: 0.47 },
  { source: 'wastewater_bypass_discharge', target: 'coastal_hypoxia', verb: 'contributes to', adverb: 'through oxygen-demanding organic and nutrient loads in estuaries and nearshore waters', influence: 0.49 },
  { source: 'drought_persistence', target: 'hydropower_reliability_decline', verb: 'increases risk of', adverb: 'through sustained inflow and head deficits', influence: 0.63 },
  { source: 'wastewater_bypass_discharge', target: 'freshwater_ecosystem_collapse', verb: 'contributes to', adverb: 'through pathogen, nutrient, and contaminant loading', influence: 0.58 },
  { source: 'glacial_lake_failure_risk', target: 'hydrological_runoff_surges', verb: 'can release', adverb: 'through sudden drainage of impounded meltwater', influence: 0.67 },
  { source: 'glacial_lake_failure_risk', target: 'bridge_scour_exposure', verb: 'raises', adverb: 'through abrupt high-energy flood flows', influence: 0.61 },
  { source: 'critical_infrastructure_fragility', target: 'heat_related_mortality_burden', verb: 'amplifies', adverb: 'when transport, water, and care access fail during heat events', influence: 0.48 },

  // Biosphere batch 03: habitat structure, ecosystem services, and operational consequences.
  { source: 'deforestation', target: 'forest_fragmentation', verb: 'creates', adverb: 'when clearing divides contiguous habitat', influence: 0.72 },
  { source: 'forest_fragmentation', target: 'wildlife_habitat_patches', verb: 'isolates', adverb: 'by breaking continuous habitat into smaller remnants', influence: 0.67 },
  { source: 'forest_fragmentation', target: 'species_range_compression', verb: 'constrains movement under', adverb: 'by reducing connected climate refugia', influence: 0.58 },
  { source: 'insect_biomass_decline', target: 'pollinator_service_decline', verb: 'contributes to', adverb: 'where pollinating insects lose abundance and diversity', influence: 0.57 },
  { source: 'pollinator_service_decline', target: 'crop_yield_volatility', verb: 'increases', adverb: 'for crops dependent on animal pollination', influence: 0.58 },
  { source: 'urban_tree_canopy_loss', target: 'public_health_heat_burden', verb: 'raises', adverb: 'by reducing shade and evaporative cooling', influence: 0.61 },
  { source: 'mangrove_buffer_loss', target: 'littoral_surge_vulnerability', verb: 'increases', adverb: 'by removing wave attenuation and shoreline friction', influence: 0.64 },
  { source: 'mangrove_buffer_loss', target: 'coastal_erosion', verb: 'accelerates', adverb: 'by removing root structure and sediment retention', influence: 0.59 },
  { source: 'marine_heatwaves', target: 'reef_structural_collapse', verb: 'accelerates', adverb: 'through recurrent bleaching and coral mortality', influence: 0.68 },
  { source: 'ocean_acidification', target: 'reef_structural_collapse', verb: 'contributes to', adverb: 'through calcification stress and slower framework recovery', influence: 0.56 },
  { source: 'reef_structural_collapse', target: 'marine_fisheries_collapse', verb: 'raises risk of', adverb: 'through loss of nursery, shelter, and feeding habitat', influence: 0.57 },
  { source: 'topsoil_erosion_acceleration', target: 'soil_humus_decline', verb: 'removes', adverb: 'with organic-rich surface soil', influence: 0.63 },
  { source: 'soil_humus_decline', target: 'crop_yield_volatility', verb: 'increases', adverb: 'through weaker water retention and nutrient buffering', influence: 0.57 },
  { source: 'industry_farming', target: 'soil_humus_decline', verb: 'can accelerate', adverb: 'through intensive disturbance and low organic-matter return', influence: 0.44 },
  { source: 'freshwater_ecosystem_collapse', target: 'biodiversity_intactness_loss', verb: 'contributes to', adverb: 'through species loss and degraded ecological function', influence: 0.6 },
  { source: 'watershed_forest_loss', target: 'riverine_habitat_fragmentation', verb: 'intensifies', adverb: 'through erosion, channel alteration, and riparian loss', influence: 0.54 },
  { source: 'riverine_habitat_fragmentation', target: 'freshwater_ecosystem_collapse', verb: 'raises risk of', adverb: 'by isolating populations and disrupting migration pathways', influence: 0.57 },
  { source: 'temp', target: 'wildfire_regime_shift', verb: 'intensifies', adverb: 'through hotter, drier, and longer fire-weather conditions', influence: 0.62 },
  { source: 'wildfire_regime_shift', target: 'forest_fragmentation', verb: 'increases', adverb: 'through repeated high-severity burn mosaics', influence: 0.49 },
  { source: 'wildfire_regime_shift', target: 'smoke_exposure_burden', verb: 'raises', adverb: 'through larger and more persistent smoke-producing fires', influence: 0.64 },
  { source: 'wetlands_drainage_scales', target: 'biodiversity_intactness_loss', verb: 'increases', adverb: 'through wetland habitat and function loss', influence: 0.62 },
  { source: 'wetlands_drainage_scales', target: 'freshwater_ecosystem_collapse', verb: 'contributes to', adverb: 'through altered storage, filtration, and habitat', influence: 0.58 },
  { source: 'wetlands_drainage_scales', target: 'carbon_emission', verb: 'adds to', adverb: 'when drained organic soils oxidize', influence: 0.6 },
  { source: 'species_range_compression', target: 'biodiversity_intactness_loss', verb: 'deepens', adverb: 'as species lose viable and connected habitat', influence: 0.58 },
  { source: 'wildlife_habitat_patches', target: 'species_range_compression', verb: 'reinforces', adverb: 'when isolated patches cannot support movement', influence: 0.49 },
  { source: 'wildlife_habitat_patches', target: 'biodiversity_intactness_loss', verb: 'contributes to', adverb: 'through smaller and more isolated populations', influence: 0.52 },
  { source: 'marine_fisheries_collapse', target: 'fishery_protein_dependence', verb: 'raises exposure for', adverb: 'where diets and livelihoods depend heavily on fish', influence: 0.57 },

  // Transport and agriculture batch 03: asset failure and food-system operating chains.
  { source: 'freight_electrification_gap', target: 'carbon_emission', verb: 'sustains', adverb: 'through continued diesel freight activity', influence: 0.62 },
  { source: 'freight_electrification_gap', target: 'ambient_air_quality_deficit', verb: 'worsens', adverb: 'through continued diesel exhaust exposure', influence: 0.57 },
  { source: 'temp', target: 'port_heat_vulnerability', verb: 'raises', adverb: 'through worker, equipment, and pavement heat stress', influence: 0.54 },
  { source: 'port_heat_vulnerability', target: 'supply_chain_port_bottlenecks', verb: 'contributes to', adverb: 'through reduced labor and equipment performance', influence: 0.52 },
  { source: 'port_heat_vulnerability', target: 'critical_infrastructure_fragility', verb: 'increases', adverb: 'where heat-sensitive port assets lack redundancy', influence: 0.46 },
  { source: 'coastal_inundation_risk', target: 'airport_climate_exposure', verb: 'raises', adverb: 'for low-lying coastal airports', influence: 0.52 },
  { source: 'airport_operational_disruption', target: 'supply_chain_port_bottlenecks', verb: 'compounds', adverb: 'when time-sensitive cargo shifts across constrained gateways', influence: 0.39 },
  { source: 'airport_operational_disruption', target: 'critical_infrastructure_fragility', verb: 'exposes', adverb: 'through loss of transport redundancy and emergency access', influence: 0.48 },
  { source: 'bridge_scour_exposure', target: 'critical_infrastructure_fragility', verb: 'raises', adverb: 'through foundation instability and closure risk', influence: 0.61 },
  { source: 'bridge_scour_exposure', target: 'supply_chain_port_bottlenecks', verb: 'can compound', adverb: 'when damaged crossings interrupt freight access', influence: 0.39 },
  { source: 'temp', target: 'rail_heat_buckling', verb: 'raises risk of', adverb: 'through rail thermal expansion', influence: 0.65 },
  { source: 'arctic_shipping_expansion', target: 'shipping_lane_disruption', verb: 'adds exposure to', adverb: 'through ice variability, remoteness, and limited response capacity', influence: 0.42 },
  { source: 'arctic_shipping_expansion', target: 'carbon_emission', verb: 'adds to', adverb: 'through increased vessel activity and fuel use', influence: 0.49 },
  { source: 'shipping_lane_disruption', target: 'supply_chain_port_bottlenecks', verb: 'concentrates at', adverb: 'through rerouting, delay, and vessel bunching', influence: 0.61 },
  { source: 'shipping_lane_disruption', target: 'food_import_exposure', verb: 'worsens', adverb: 'where food systems depend on maritime imports', influence: 0.52 },
  { source: 'shipping_lane_disruption', target: 'critical_infrastructure_fragility', verb: 'reveals', adverb: 'through dependence on a small number of maritime chokepoints', influence: 0.42 },
  { source: 'road_freight_diesel_lock_in', target: 'carbon_emission', verb: 'sustains', adverb: 'through continued diesel combustion', influence: 0.68 },
  { source: 'temp', target: 'farm_heat_stress', verb: 'increases', adverb: 'through hotter growing-season conditions', influence: 0.64 },
  { source: 'farm_heat_stress', target: 'crop_yield_volatility', verb: 'increases', adverb: 'through reproductive and photosynthetic heat damage', influence: 0.63 },
  { source: 'farm_heat_stress', target: 'agricultural_labor_exposure', verb: 'raises', adverb: 'when field work occurs during dangerous heat', influence: 0.59 },
  { source: 'temp', target: 'livestock_disease_pressure', verb: 'shifts', adverb: 'through heat stress and changing pathogen and vector ranges', influence: 0.48 },
  { source: 'livestock_disease_pressure', target: 'food', verb: 'disrupts', adverb: 'through mortality, reduced productivity, and movement controls', influence: 0.57 },
  { source: 'livestock_disease_pressure', target: 'food_import_exposure', verb: 'raises', adverb: 'when domestic animal production becomes unreliable', influence: 0.45 },
  { source: 'fertilizer_price_shock', target: 'crop_yield_volatility', verb: 'increases', adverb: 'when farmers reduce or mistime nutrient application', influence: 0.51 },
  { source: 'fertilizer_price_shock', target: 'food', verb: 'raises pressure on', adverb: 'through higher input costs and constrained production', influence: 0.48 },
  { source: 'feed_crop_dependency', target: 'crop_yield_volatility', verb: 'transmits', adverb: 'into livestock systems through feed availability', influence: 0.48 },
  { source: 'feed_crop_dependency', target: 'food_import_exposure', verb: 'raises', adverb: 'where domestic livestock relies on imported feed', influence: 0.46 },
  { source: 'grid_peak_load_stress', target: 'cold_chain_failure_risk', verb: 'raises', adverb: 'when outages interrupt refrigeration', influence: 0.58 },
  { source: 'agricultural_labor_exposure', target: 'crop_yield_volatility', verb: 'increases', adverb: 'through lost safe working hours during critical farm operations', influence: 0.55 },
  { source: 'agricultural_labor_exposure', target: 'food', verb: 'reduces reliability of', adverb: 'through heat-related labor capacity loss', influence: 0.5 },
  { source: 'industry_farming', target: 'topsoil_erosion_acceleration', verb: 'can accelerate', adverb: 'through intensive tillage and exposed soil', influence: 0.58 },
  { source: 'topsoil_erosion_acceleration', target: 'crop_yield_volatility', verb: 'increases', adverb: 'through loss of fertile and water-retaining topsoil', influence: 0.61 },
  { source: 'temp', target: 'insect_biomass_decline', verb: 'adds pressure toward', adverb: 'through heat extremes and climate-driven habitat disruption', influence: 0.47 },
  { source: 'industry_farming', target: 'insect_biomass_decline', verb: 'can contribute to', adverb: 'through habitat simplification and intensive chemical exposure', influence: 0.48 },
  { source: 'feed_crop_dependency', target: 'food', verb: 'transmits risk into', adverb: 'when feed shortages constrain livestock production', influence: 0.5 },
  { source: 'resource_depletion', target: 'fertilizer_price_shock', verb: 'can intensify', adverb: 'through energy and mineral input constraints', influence: 0.4 },
  { source: 'fertilizer_price_shock', target: 'food_import_exposure', verb: 'can raise', adverb: 'when domestic production becomes more costly or constrained', influence: 0.43 },
  { source: 'cold_chain_failure_risk', target: 'food', verb: 'reduces usable supply of', adverb: 'through spoilage and unsafe storage', influence: 0.61 },
  { source: 'cold_chain_failure_risk', target: 'food_import_exposure', verb: 'can raise', adverb: 'when domestic perishables cannot be stored or distributed reliably', influence: 0.42 },

  // Cryosphere, governance, and carbon-cycle batch 03.
  { source: 'carbon_emission', target: 'ice_sheet_mass_loss', verb: 'drives pressure toward', adverb: 'through cumulative greenhouse warming', influence: 0.58 },
  { source: 'temp', target: 'sea_ice_season_loss', verb: 'accelerates', adverb: 'through reduced freeze-up and earlier melt', influence: 0.72 },
  { source: 'snow_drought', target: 'river_flow_regime_shift', verb: 'intensifies', adverb: 'through reduced and earlier snowmelt runoff', influence: 0.58 },
  { source: 'snow_drought', target: 'reservoir_storage_instability', verb: 'raises', adverb: 'through diminished seasonal snowpack storage', influence: 0.54 },
  { source: 'thermokarst_expansion', target: 'methane', verb: 'can increase', adverb: 'through thawed, waterlogged carbon decomposition', influence: 0.5 },
  { source: 'temp', target: 'firn_layer_depletion', verb: 'accelerates', adverb: 'through greater surface melt and reduced refreezing capacity', influence: 0.61 },
  { source: 'firn_layer_depletion', target: 'glacier_meltwater_dependency', verb: 'destabilizes', adverb: 'by reducing seasonal meltwater buffering', influence: 0.46 },
  { source: 'ice_sheet_mass_loss', target: 'glacier_meltwater_dependency', verb: 'changes reliability for', adverb: 'as peak water passes and long-term ice storage declines', influence: 0.49 },
  { source: 'glacier_meltwater_dependency', target: 'hydropower_reliability_decline', verb: 'raises risk for', adverb: 'through altered seasonal water supply', influence: 0.5 },
  { source: 'glacier_meltwater_dependency', target: 'basin_treaty_breakdown', verb: 'pressures', adverb: 'when shared seasonal flows become less reliable', influence: 0.42 },
  { source: 'sea_ice_season_loss', target: 'polar_infrastructure_failure', verb: 'raises exposure to', adverb: 'through coastal erosion, waves, and shorter stable access seasons', influence: 0.49 },
  { source: 'temp', target: 'vector_borne_disease_expansion', verb: 'shifts risk for', adverb: 'through vector survival, development, and range change', influence: 0.52 },
  { source: 'flash_flood_regime', target: 'vector_borne_disease_expansion', verb: 'can increase', adverb: 'where standing water and service disruption favor vectors', influence: 0.37 },
  { source: 'vector_borne_disease_expansion', target: 'disaster_recovery_inequality', verb: 'deepens', adverb: 'where prevention and treatment access are uneven', influence: 0.42 },
  { source: 'food_import_exposure', target: 'conflict_risk_escalation', verb: 'can raise', adverb: 'when price and access shocks interact with existing fragility', influence: 0.36 },
  { source: 'resource_depletion', target: 'conflict_risk_escalation', verb: 'can raise', adverb: 'where scarcity interacts with weak institutions and inequality', influence: 0.36 },
  { source: 'insurance_retreat', target: 'mortgage_market_exposure', verb: 'increases', adverb: 'when properties lose affordable coverage', influence: 0.57 },
  { source: 'early_warning_coverage_gaps', target: 'disaster_recovery_inequality', verb: 'deepens', adverb: 'when vulnerable groups receive less actionable warning', influence: 0.52 },
  { source: 'critical_infrastructure_fragility', target: 'climate_litigation_pressure', verb: 'can raise', adverb: 'through disputes over foreseeable risk, disclosure, and duty of care', influence: 0.36 },
  { source: 'coastal_inundation_risk', target: 'coastal_property_insurance_redlines', verb: 'increases pressure for', adverb: 'through repeated flood loss and repricing', influence: 0.54 },
  { source: 'temp', target: 'land_carbon_sink_weakening', verb: 'contributes to', adverb: 'through heat, drought, fire, and respiration effects', influence: 0.55 },
  { source: 'deforestation', target: 'land_carbon_sink_weakening', verb: 'directly weakens', adverb: 'by removing biomass and degrading soils', influence: 0.7 },
  { source: 'land_carbon_sink_weakening', target: 'temp', verb: 'amplifies', adverb: 'by leaving more emitted carbon dioxide in the atmosphere', influence: 0.47 },
  { source: 'temp', target: 'ocean_carbon_uptake_weakening', verb: 'contributes to', adverb: 'through warming, stratification, and circulation change', influence: 0.54 },
  { source: 'ocean_salinity_stratification', target: 'ocean_carbon_uptake_weakening', verb: 'can contribute to', adverb: 'by limiting vertical exchange and carbon transport', influence: 0.43 },
  { source: 'ocean_carbon_uptake_weakening', target: 'temp', verb: 'amplifies', adverb: 'by increasing the airborne fraction of carbon emissions', influence: 0.46 },
  { source: 'drought_persistence', target: 'peat_oxidation_pulse', verb: 'raises risk of', adverb: 'through peat drying and oxygen exposure', influence: 0.59 },
  { source: 'wetlands_drainage_scales', target: 'peat_oxidation_pulse', verb: 'drives', adverb: 'by lowering water tables in organic soils', influence: 0.68 },
  { source: 'peat_oxidation_pulse', target: 'carbon_emission', verb: 'releases', adverb: 'through aerobic decomposition and fire', influence: 0.72 },
  { source: 'coastal_inundation_risk', target: 'tidal_wetland_carbon_reversal', verb: 'raises risk of', adverb: 'where wetlands cannot migrate or accrete fast enough', influence: 0.46 },
  { source: 'wetlands_drainage_scales', target: 'tidal_wetland_carbon_reversal', verb: 'can trigger', adverb: 'through hydrologic disconnection and soil oxidation', influence: 0.55 },
  { source: 'tidal_wetland_carbon_reversal', target: 'carbon_emission', verb: 'adds to', adverb: 'when stored blue carbon is oxidized or lost', influence: 0.61 },
  { source: 'aviation', target: 'aviation_demand_growth', verb: 'provides evidence context for', adverb: 'within the transport systems family', influence: 0.18, topology_rule: 'family_reference', expansion_family: 'transport_systems' },
  { source: 'aviation', target: 'airport_climate_exposure', verb: 'provides evidence context for', adverb: 'within the transport systems family', influence: 0.18, topology_rule: 'family_reference', expansion_family: 'transport_systems' },
  { source: 'urbanization', target: 'urban_sprawl_housing', verb: 'provides evidence context for', adverb: 'within the governance finance family', influence: 0.18, topology_rule: 'family_reference', expansion_family: 'governance_finance' },
  { source: 'urban_sprawl_housing', target: 'urban_tree_canopy_loss', verb: 'provides evidence context for', adverb: 'within the biosphere resilience family', influence: 0.18, topology_rule: 'family_reference', expansion_family: 'biosphere_resilience' },
  { source: 'food', target: 'food_waste', verb: 'provides evidence context for', adverb: 'within the agriculture food family', influence: 0.18, topology_rule: 'family_reference', expansion_family: 'agriculture_food' },
  { source: 'industry_farming', target: 'fertilizer_production', verb: 'provides evidence context for', adverb: 'within the agriculture food family', influence: 0.18, topology_rule: 'family_reference', expansion_family: 'agriculture_food' }
];

function responseEdge(source, target, verb, adverb, influence, relationshipType, confidence = 'medium') {
  return {
    source,
    target,
    verb,
    adverb,
    influence,
    relationship_type: relationshipType,
    confidence,
    topology_rule: 'response_system'
  };
}

const RESPONSE_ENERGY_BUILDINGS_EDGES = [
  // Clean-power backbone, enabling conditions, and material trade-offs.
  responseEdge('renewable_energy_deployment', 'clean_electricity', 'expands', 'when new supply is connected and operated reliably', 0.84, 'enabling_pathway', 'high'),
  responseEdge('grid_scale_storage', 'clean_electricity', 'makes more dependable', 'by shifting supply across constrained hours', 0.68, 'enabling_pathway'),
  responseEdge('demand_response', 'clean_electricity', 'makes easier to integrate', 'by shifting flexible loads toward cleaner hours', 0.57, 'enabling_pathway'),
  responseEdge('coal_retirement', 'clean_electricity', 'creates room for', 'when replacement capacity and reliability are planned together', 0.72, 'transition_pathway'),
  responseEdge('transmission_buildout_lag', 'clean_electricity', 'constrains', 'when new low-emissions supply cannot reach demand', -0.7, 'constraint', 'high'),
  responseEdge('clean_electricity', 'carbon_emission', 'reduces', 'by displacing fossil generation and enabling electrification', -0.86, 'mitigation_pathway', 'high'),
  responseEdge('clean_electricity', 'ambient_air_quality_deficit', 'reduces', 'when local combustion generation is retired', -0.64, 'co_benefit_pathway', 'high'),
  responseEdge('clean_electricity', 'heat_pump_electrification', 'strengthens the climate value of', 'as power-sector emissions fall', 0.72, 'enabling_pathway', 'high'),
  responseEdge('clean_electricity', 'electric_vehicle_transition', 'strengthens the climate value of', 'as charging draws from lower-emissions generation', 0.71, 'enabling_pathway', 'high'),
  responseEdge('clean_electricity', 'green_steel', 'enables', 'through electric furnaces, hydrogen, and low-emissions process power', 0.69, 'enabling_pathway'),
  responseEdge('clean_electricity', 'low_carbon_cement', 'supports', 'through electrified process heat and capture systems', 0.48, 'enabling_pathway'),
  responseEdge('clean_electricity', 'carbon_dioxide_removal', 'can power', 'where engineered removal has a large energy requirement', 0.44, 'enabling_pathway'),
  responseEdge('coal_retirement', 'carbon_emission', 'reduces', 'by ending high-carbon electricity generation', -0.86, 'mitigation_pathway', 'high'),
  responseEdge('coal_retirement', 'ambient_air_quality_deficit', 'reduces', 'by eliminating coal-combustion pollution at retired plants', -0.76, 'co_benefit_pathway', 'high'),
  responseEdge('coal_retirement', 'public_health_heat_burden', 'reduces long-term pressure on', 'through avoided warming and combustion pollution', -0.35, 'co_benefit_pathway'),
  responseEdge('renewable_energy_deployment', 'carbon_emission', 'reduces', 'when renewable output displaces fossil generation', -0.78, 'mitigation_pathway', 'high'),
  responseEdge('renewable_energy_deployment', 'renewable_curtailment_losses', 'can increase', 'when grids, storage, and flexible demand lag behind new supply', 0.39, 'tradeoff', 'high'),
  responseEdge('renewable_energy_deployment', 'critical_mineral_extraction_pressure', 'can increase', 'through equipment, wiring, and storage supply chains', 0.32, 'tradeoff'),
  responseEdge('grid_scale_storage', 'renewable_curtailment_losses', 'reduces', 'by shifting otherwise-unused generation into later hours', -0.66, 'mitigation_pathway', 'high'),
  responseEdge('grid_scale_storage', 'grid_peak_load_stress', 'reduces', 'by discharging during constrained hours', -0.61, 'resilience_pathway', 'high'),
  responseEdge('grid_scale_storage', 'peaker_plant_lock_in', 'reduces', 'when storage provides dependable peak capacity', -0.55, 'mitigation_pathway'),
  responseEdge('grid_scale_storage', 'battery_supply_chain_pressure', 'can increase', 'through demand for battery minerals and manufacturing', 0.46, 'tradeoff', 'high'),
  responseEdge('grid_peak_load_stress', 'demand_response', 'increases the value of', 'when flexible demand can prevent emergency peaks', 0.46, 'response_trigger'),
  responseEdge('demand_response', 'grid_peak_load_stress', 'reduces', 'by shifting or trimming flexible loads during peak hours', -0.64, 'resilience_pathway', 'high'),
  responseEdge('demand_response', 'peaker_plant_lock_in', 'reduces', 'when verified flexibility replaces peak-generation capacity', -0.49, 'mitigation_pathway'),
  responseEdge('demand_response', 'utility_disconnection_risk', 'can reduce', 'when customers are paid fairly for flexible use', -0.25, 'co_benefit_pathway', 'low'),
  // Fast methane and refrigerant mitigation, with bounded carbon removal.
  responseEdge('methane_leak_detection', 'methane', 'reduces', 'when observations trigger verified repair', -0.78, 'mitigation_pathway', 'high'),
  responseEdge('methane_leak_detection', 'ambient_air_quality_deficit', 'can reduce', 'by finding leaks and associated hazardous co-pollutants', -0.38, 'co_benefit_pathway'),
  responseEdge('methane_leak_detection', 'carbon_emission', 'improves accountability for', 'by exposing unreported fossil-system losses', -0.22, 'monitoring_pathway'),
  responseEdge('refrigerant_phase_down', 'air_conditioning_refrigerants', 'reduces pressure from', 'through lower-impact gases, leak prevention, and recovery', -0.78, 'mitigation_pathway', 'high'),
  responseEdge('refrigerant_phase_down', 'carbon_emission', 'reduces climate-equivalent pressure on', 'by avoiding high-warming refrigerant emissions', -0.45, 'mitigation_pathway', 'high'),
  responseEdge('refrigerant_phase_down', 'equitable_cooling_access', 'makes more climate-safe', 'when efficient equipment and technician capacity scale together', 0.53, 'enabling_pathway'),
  responseEdge('carbon_dioxide_removal', 'carbon_emission', 'counterbalances a limited share of', 'only when removal is additional, measured, and durably stored', -0.46, 'mitigation_pathway'),
  responseEdge('carbon_dioxide_removal', 'resource_depletion', 'can increase', 'through land, water, energy, and material requirements', 0.32, 'tradeoff'),
  responseEdge('ecosystem_restoration', 'carbon_dioxide_removal', 'can provide', 'through durable recovery of vegetation and soils', 0.39, 'enabling_pathway'),
  // Buildings: policy, fabric, electrification, passive design, and access.
  responseEdge('building_performance_standards', 'building_energy_efficiency', 'accelerates', 'through measured performance targets and retrofit schedules', 0.73, 'policy_enabler', 'high'),
  responseEdge('building_performance_standards', 'heat_pump_electrification', 'accelerates', 'when compliance supports efficient fuel switching', 0.55, 'policy_enabler'),
  responseEdge('building_performance_standards', 'weatherization_retrofits', 'creates demand for', 'when owners must improve measured building performance', 0.59, 'policy_enabler'),
  responseEdge('building_performance_standards', 'passive_cooling_design', 'rewards', 'when standards value real cooling demand reduction', 0.42, 'policy_enabler'),
  responseEdge('building_performance_standards', 'refrigerant_phase_down', 'can reinforce', 'when whole-building emissions include refrigerant leakage', 0.33, 'policy_enabler', 'low'),
  responseEdge('building_energy_efficiency', 'carbon_emission', 'reduces', 'by lowering the energy required for building services', -0.69, 'mitigation_pathway', 'high'),
  responseEdge('building_energy_efficiency', 'grid_peak_load_stress', 'reduces', 'by lowering heating and cooling demand during extreme hours', -0.62, 'resilience_pathway', 'high'),
  responseEdge('building_energy_efficiency', 'utility_disconnection_risk', 'can reduce', 'by lowering household energy bills', -0.47, 'co_benefit_pathway'),
  responseEdge('building_energy_efficiency', 'equitable_cooling_access', 'makes more affordable', 'by reducing the energy needed for safe indoor temperatures', 0.58, 'enabling_pathway', 'high'),
  responseEdge('weatherization_retrofits', 'building_energy_efficiency', 'delivers', 'through insulation, air sealing, shading, and moisture control', 0.75, 'implementation_pathway', 'high'),
  responseEdge('weatherization_retrofits', 'heat_pump_electrification', 'improves performance of', 'by reducing peak heating and cooling loads', 0.63, 'enabling_pathway', 'high'),
  responseEdge('weatherization_retrofits', 'public_health_heat_burden', 'reduces exposure to', 'by keeping indoor temperatures safer for longer', -0.52, 'adaptation_pathway'),
  responseEdge('weatherization_retrofits', 'utility_disconnection_risk', 'can reduce', 'through lower household energy use and bills', -0.46, 'co_benefit_pathway'),
  responseEdge('heat_pump_electrification', 'carbon_emission', 'reduces', 'when efficient equipment replaces fossil heating on a cleaner grid', -0.63, 'mitigation_pathway', 'high'),
  responseEdge('heat_pump_electrification', 'public_health_heat_burden', 'reduces exposure to', 'by providing efficient cooling as well as heating', -0.47, 'adaptation_pathway'),
  responseEdge('heat_pump_electrification', 'grid_peak_load_stress', 'can increase', 'when deployment outpaces building efficiency and grid planning', 0.34, 'tradeoff', 'high'),
  responseEdge('passive_cooling_design', 'public_health_heat_burden', 'reduces exposure to', 'through shade, ventilation, reflective surfaces, and lower indoor heat gain', -0.61, 'adaptation_pathway', 'high'),
  responseEdge('passive_cooling_design', 'grid_peak_load_stress', 'reduces', 'by lowering mechanical cooling demand during hot hours', -0.52, 'resilience_pathway'),
  responseEdge('passive_cooling_design', 'nighttime_heat_retention', 'reduces', 'when urban form, materials, and ventilation release stored heat', -0.43, 'adaptation_pathway'),
  responseEdge('passive_cooling_design', 'equitable_cooling_access', 'broadens', 'by reducing dependence on continuous paid electricity', 0.52, 'enabling_pathway')
];

const RESPONSE_TRANSPORT_LAND_EDGES = [
  // Transport and industrial transition.
  responseEdge('public_transit_expansion', 'personal_conveyance', 'reduces dependence on', 'when service is frequent, affordable, and connected to destinations', -0.67, 'mitigation_pathway', 'high'),
  responseEdge('public_transit_expansion', 'carbon_emission', 'reduces', 'when transit replaces higher-emitting car travel', -0.57, 'mitigation_pathway', 'high'),
  responseEdge('public_transit_expansion', 'ambient_air_quality_deficit', 'reduces', 'when cleaner shared transport replaces combustion traffic', -0.49, 'co_benefit_pathway'),
  responseEdge('public_transit_expansion', 'urban_sprawl_housing', 'can reduce pressure from', 'when transit and housing policy support compact growth', -0.38, 'land_use_pathway'),
  responseEdge('active_mobility', 'personal_conveyance', 'reduces dependence on', 'for short trips connected by safe routes', -0.55, 'mitigation_pathway', 'high'),
  responseEdge('active_mobility', 'carbon_emission', 'reduces', 'when walking and cycling replace motorized trips', -0.34, 'mitigation_pathway', 'high'),
  responseEdge('active_mobility', 'ambient_air_quality_deficit', 'can reduce', 'when vehicle traffic falls across a complete network', -0.32, 'co_benefit_pathway'),
  responseEdge('public_transit_expansion', 'active_mobility', 'amplifies', 'because most transit trips begin and end on foot or wheels', 0.53, 'complementary_pathway', 'high'),
  responseEdge('electric_vehicle_transition', 'carbon_emission', 'reduces', 'as electric drivetrains replace oil and the grid gets cleaner', -0.61, 'mitigation_pathway', 'high'),
  responseEdge('electric_vehicle_transition', 'ambient_air_quality_deficit', 'reduces tailpipe pressure on', 'while leaving tire, brake, and upstream pollution to manage', -0.49, 'co_benefit_pathway', 'high'),
  responseEdge('electric_vehicle_transition', 'battery_supply_chain_pressure', 'can increase', 'through battery mineral, processing, and manufacturing demand', 0.54, 'tradeoff', 'high'),
  responseEdge('electric_vehicle_transition', 'grid_peak_load_stress', 'can increase', 'when charging is unmanaged during constrained hours', 0.31, 'tradeoff', 'high'),
  responseEdge('low_carbon_cement', 'cement_process_emissions', 'reduces', 'through material efficiency, lower-clinker binders, clean heat, and capture', -0.73, 'mitigation_pathway', 'high'),
  responseEdge('low_carbon_cement', 'carbon_emission', 'reduces', 'across cement process and fuel emissions', -0.61, 'mitigation_pathway', 'high'),
  responseEdge('low_carbon_cement', 'resource_depletion', 'can reduce', 'when material-efficient design lowers virgin input demand', -0.28, 'co_benefit_pathway'),
  responseEdge('steel_decarbonization_gap', 'green_steel', 'increases the need for', 'where coal-based capacity lacks a transition pathway', 0.43, 'response_trigger'),
  responseEdge('green_steel', 'steel_decarbonization_gap', 'closes', 'through efficiency, recycling, clean power, hydrogen, and capture', -0.74, 'mitigation_pathway', 'high'),
  responseEdge('green_steel', 'carbon_emission', 'reduces', 'when near-zero production displaces coal-based steelmaking', -0.62, 'mitigation_pathway', 'high'),
  responseEdge('green_steel', 'critical_mineral_extraction_pressure', 'can shift pressure toward', 'through electricity, hydrogen, and new equipment supply chains', 0.2, 'tradeoff', 'low'),
  // Ecosystem recovery and nature-based protection.
  responseEdge('ecosystem_restoration', 'biodiversity_intactness_loss', 'reduces', 'when original damage drivers are removed and diverse habitat recovers', -0.68, 'restoration_pathway', 'high'),
  responseEdge('ecosystem_restoration', 'land_carbon_sink_weakening', 'reduces', 'by rebuilding vegetation, soils, and ecological function', -0.56, 'mitigation_pathway'),
  responseEdge('ecosystem_restoration', 'topsoil_erosion_acceleration', 'reduces', 'through vegetative cover, roots, and healthier soil structure', -0.51, 'restoration_pathway', 'high'),
  responseEdge('ecosystem_restoration', 'floodplain_exposure', 'can reduce', 'when wetlands, floodplains, forests, and rivers regain storage space', -0.43, 'adaptation_pathway'),
  responseEdge('ecosystem_restoration', 'nature_based_adaptation', 'provides the ecological foundation for', 'through healthy, connected, and maintained systems', 0.61, 'enabling_pathway', 'high'),
  responseEdge('nature_based_adaptation', 'ecosystem_restoration', 'can finance and sustain', 'when protective benefits are tied to long-term stewardship', 0.41, 'complementary_pathway'),
  responseEdge('nature_based_adaptation', 'floodplain_exposure', 'reduces', 'through wetlands, floodplain reconnection, and upstream water retention', -0.55, 'adaptation_pathway', 'high'),
  responseEdge('nature_based_adaptation', 'coastal_inundation_risk', 'can reduce exposure to', 'through mangroves, marshes, dunes, and reefs within their physical limits', -0.46, 'adaptation_pathway'),
  responseEdge('nature_based_adaptation', 'nighttime_heat_retention', 'reduces', 'through shade, evapotranspiration, and less heat-absorbing surface', -0.42, 'adaptation_pathway'),
  responseEdge('nature_based_adaptation', 'biodiversity_intactness_loss', 'can reduce', 'when projects restore native, connected habitat', -0.49, 'restoration_pathway')
];

const RESPONSE_ADAPTATION_EDGES = [
  // Warning systems and urban heat protection.
  responseEdge('early_warning_coverage_gaps', 'multi_hazard_early_warning', 'increases the need for', 'where observations or last-mile communication do not reach exposed people', 0.55, 'response_trigger', 'high'),
  responseEdge('multi_hazard_early_warning', 'early_warning_coverage_gaps', 'closes', 'when observation, communication, trust, and response capacity reach the last mile', -0.78, 'adaptation_pathway', 'high'),
  responseEdge('multi_hazard_early_warning', 'emergency_response_overload', 'reduces', 'by creating time for staged preparation and evacuation', -0.56, 'adaptation_pathway', 'high'),
  responseEdge('multi_hazard_early_warning', 'heat_related_mortality_burden', 'reduces', 'when warnings trigger outreach, cooling, and health action', -0.49, 'adaptation_pathway', 'high'),
  responseEdge('multi_hazard_early_warning', 'disaster_recovery_inequality', 'can reduce', 'when alerts and response options reach vulnerable groups', -0.39, 'equity_pathway'),
  responseEdge('public_health_heat_burden', 'urban_heat_action_plans', 'increases the need for', 'as dangerous heat becomes more frequent and unequal', 0.52, 'response_trigger', 'high'),
  responseEdge('multi_hazard_early_warning', 'urban_heat_action_plans', 'enables', 'through forecast triggers and coordinated communication', 0.62, 'enabling_pathway', 'high'),
  responseEdge('urban_heat_action_plans', 'heat_related_mortality_burden', 'reduces', 'when plans connect forecasts to funded health protection', -0.68, 'adaptation_pathway', 'high'),
  responseEdge('urban_heat_action_plans', 'public_health_heat_burden', 'reduces', 'through outreach, cooling, health surveillance, and service coordination', -0.61, 'adaptation_pathway', 'high'),
  responseEdge('urban_heat_action_plans', 'occupational_heat_exposure', 'reduces', 'when worker protections and enforcement are included', -0.52, 'adaptation_pathway', 'high'),
  responseEdge('urban_heat_action_plans', 'equitable_cooling_access', 'coordinates', 'through targeted outreach, transport, public sites, and utility protection', 0.58, 'enabling_pathway', 'high'),
  responseEdge('equitable_cooling_access', 'heat_related_mortality_burden', 'reduces', 'by making safe temperatures available to people at highest risk', -0.66, 'adaptation_pathway', 'high'),
  responseEdge('equitable_cooling_access', 'public_health_heat_burden', 'reduces', 'when efficient cooling, affordability, and outreach work together', -0.59, 'adaptation_pathway', 'high'),
  responseEdge('utility_disconnection_risk', 'equitable_cooling_access', 'constrains', 'when households lose electricity during dangerous heat', -0.64, 'constraint', 'high'),
  responseEdge('equitable_cooling_access', 'grid_peak_load_stress', 'can increase', 'when mechanical cooling expands without efficiency, passive design, or load management', 0.36, 'tradeoff', 'high'),
  // Floods, water, food, and rights-based relocation.
  responseEdge('coastal_inundation_risk', 'flood_resilient_infrastructure', 'increases the need for', 'where essential services face recurring coastal flooding', 0.51, 'response_trigger', 'high'),
  responseEdge('flood_resilient_infrastructure', 'floodplain_exposure', 'reduces', 'through safer siting, drainage, storage, protection, and maintained access', -0.59, 'adaptation_pathway', 'high'),
  responseEdge('flood_resilient_infrastructure', 'wastewater_infrastructure_overflow', 'reduces', 'through separated flows, added capacity, storage, and floodproofing', -0.61, 'adaptation_pathway', 'high'),
  responseEdge('flood_resilient_infrastructure', 'critical_infrastructure_fragility', 'reduces', 'when future flood conditions shape design, redundancy, and maintenance', -0.6, 'adaptation_pathway', 'high'),
  responseEdge('flood_resilient_infrastructure', 'emergency_response_overload', 'reduces', 'by keeping access routes and essential services functioning', -0.43, 'adaptation_pathway'),
  responseEdge('water_stress', 'water_reuse', 'increases the value of', 'where reliable treated supply can offset withdrawals', 0.45, 'response_trigger'),
  responseEdge('water_reuse', 'aquifer_overdraft', 'reduces pressure on', 'when reuse displaces groundwater withdrawals', -0.54, 'adaptation_pathway', 'high'),
  responseEdge('water_reuse', 'desalination_dependence', 'can reduce', 'by supplying treated local water before seawater desalination is needed', -0.4, 'adaptation_pathway'),
  responseEdge('water_reuse', 'wastewater_bypass_discharge', 'can reduce', 'when reuse investment also improves collection and treatment', -0.42, 'co_benefit_pathway'),
  responseEdge('water_reuse', 'carbon_emission', 'can add to', 'when advanced treatment relies on carbon-intensive electricity', 0.17, 'tradeoff'),
  responseEdge('crop_yield_volatility', 'climate_resilient_agriculture', 'increases the need for', 'as heat, water, pest, and market shocks become harder to absorb', 0.48, 'response_trigger', 'high'),
  responseEdge('climate_resilient_agriculture', 'crop_yield_volatility', 'reduces', 'through diversification, soil health, water management, and climate information', -0.6, 'adaptation_pathway', 'high'),
  responseEdge('climate_resilient_agriculture', 'topsoil_erosion_acceleration', 'reduces', 'through cover, roots, reduced disturbance, and water retention', -0.61, 'restoration_pathway', 'high'),
  responseEdge('climate_resilient_agriculture', 'aquifer_overdraft', 'can reduce', 'when water efficiency is paired with basin withdrawal limits', -0.38, 'adaptation_pathway'),
  responseEdge('climate_resilient_agriculture', 'food_import_exposure', 'can reduce', 'by making domestic production more reliable across shocks', -0.41, 'adaptation_pathway'),
  responseEdge('managed_retreat_pressure', 'planned_relocation', 'increases the need for', 'when protection and repeated rebuilding no longer provide safety', 0.57, 'response_trigger', 'high'),
  responseEdge('planned_relocation', 'managed_retreat_pressure', 'reduces unmanaged', 'by creating a funded, rights-based pathway before crisis displacement', -0.55, 'adaptation_pathway'),
  responseEdge('planned_relocation', 'disaster_recovery_inequality', 'can reduce', 'when compensation, housing, services, and livelihoods are guaranteed', -0.39, 'equity_pathway'),
  responseEdge('planned_relocation', 'relocation_governance_capacity', 'requires and can build', 'through durable institutions, finance, and community decision rights', 0.61, 'governance_pathway', 'high'),
  responseEdge('planned_relocation', 'migration', 'can reduce emergency displacement within', 'by moving before repeated disasters destroy housing and services', -0.31, 'adaptation_pathway', 'low')
];

const RESPONSE_SYSTEM_EDGES = [
  ...RESPONSE_ENERGY_BUILDINGS_EDGES,
  ...RESPONSE_TRANSPORT_LAND_EDGES,
  ...RESPONSE_ADAPTATION_EDGES
];

const CORE_ANCHOR_REPAIR_EDGES = [
  { source: 'carbon_emission', target: 'el_nino', verb: 'loads heat into', adverb: 'background-wise', influence: 0.36 },
  { source: 'el_nino', target: 'monsoon_volatility', verb: 'reorganizes', adverb: 'seasonally', influence: 0.63 },
  { source: 'el_nino', target: 'food', verb: 'disrupts', adverb: 'across harvests', influence: 0.46 },
  { source: 'el_nino', target: 'migration', verb: 'pressures', adverb: 'regionally', influence: 0.34 },

  { source: 'carbon_emission', target: 'la_nina', verb: 'sharpens teleconnections in', adverb: 'indirectly', influence: 0.3 },
  { source: 'la_nina', target: 'monsoon_volatility', verb: 'intensifies', adverb: 'across basins', influence: 0.61 },
  { source: 'la_nina', target: 'resource_depletion', verb: 'deepens', adverb: 'through drought-flood swings', influence: 0.42 },
  { source: 'la_nina', target: 'food', verb: 'destabilizes', adverb: 'across staple regions', influence: 0.39 },

  { source: 'carbon_emission', target: 'wet_bulb_heat', verb: 'raises the baseline for', adverb: 'persistently', influence: 0.52 },
  { source: 'wet_bulb_heat', target: 'food', verb: 'cuts labor capacity in', adverb: 'during extremes', influence: 0.41 },
  { source: 'wet_bulb_heat', target: 'resource_depletion', verb: 'spikes cooling and water demand in', adverb: 'during emergencies', influence: 0.46 },

  { source: 'carbon_emission', target: 'monsoon_volatility', verb: 'loads instability into', adverb: 'seasonally', influence: 0.41 },
  { source: 'monsoon_volatility', target: 'resource_depletion', verb: 'destabilizes', adverb: 'through storage swings', influence: 0.63 },
  { source: 'monsoon_volatility', target: 'food', verb: 'reduces reliability of', adverb: 'across harvest cycles', influence: 0.59 },
  { source: 'monsoon_volatility', target: 'migration', verb: 'displaces', adverb: 'after repeated shocks', influence: 0.46 },

  { source: 'fast_fashion', target: 'carbon_emission', verb: 'embeds demand into', adverb: 'across supply chains', influence: 0.53 },
  { source: 'fast_fashion', target: 'resource_depletion', verb: 'pollutes and drains', adverb: 'through production hubs', influence: 0.57 },

  { source: 'methane', target: 'environ_anomalies', verb: 'intensifies', adverb: 'through rapid warming', influence: 0.54 },
  { source: 'methane', target: 'wet_bulb_heat', verb: 'raises exposure to', adverb: 'in the near term', influence: 0.48 },
  { source: 'methane', target: 'monsoon_volatility', verb: 'amplifies instability in', adverb: 'through heat loading', influence: 0.35 },

  { source: 'permafrost_thaw', target: 'carbon_emission', verb: 'releases long-lived carbon into', adverb: 'progressively', influence: 0.58 },
  { source: 'permafrost_thaw', target: 'migration', verb: 'undermines settlement stability for', adverb: 'across Arctic communities', influence: 0.47 },
  { source: 'permafrost_thaw', target: 'resource_depletion', verb: 'damages infrastructure around', adverb: 'through ground failure', influence: 0.43 },

  { source: 'food', target: 'resource_depletion', verb: 'pulls harder on', adverb: 'through land and water demand', influence: 0.52 },
  { source: 'food', target: 'carbon_emission', verb: 'induces emissions across', adverb: 'through conversion and inputs', influence: 0.49 },

  { source: 'urbanization', target: 'personal_conveyance', verb: 'extends dependence on', adverb: 'through built form', influence: 0.55 },
  { source: 'urbanization', target: 'data_centers', verb: 'concentrates demand for', adverb: 'in dense corridors', influence: 0.41 },
  { source: 'urbanization', target: 'resource_depletion', verb: 'raises draw on', adverb: 'through concentrated demand', influence: 0.38 },

  { source: 'environ_anomalies', target: 'migration', verb: 'displaces', adverb: 'through repeated disasters', influence: 0.66 },
  { source: 'environ_anomalies', target: 'food', verb: 'interrupts supply and yields in', adverb: 'during extremes', influence: 0.58 },
  { source: 'environ_anomalies', target: 'urbanization', verb: 'stresses infrastructure in', adverb: 'through repeated damage', influence: 0.44 }
];

const NODE_EXPANSION_GROUPS = [
  {
    key: 'water_systems',
    parent: 'resource_depletion',
    target: 'migration',
    inboundVerb: 'depletes into',
    outboundVerb: 'destabilizes',
    inboundInfluence: 0.52,
    outboundInfluence: 0.58,
    secondary_sources: [
      { id: 'temp', verb: 'dries and destabilizes', adverb: 'across basins', influence: 0.41 }
    ],
    targets: [
      { id: 'migration', verb: 'destabilizes', adverb: 'across systems', influence: 0.58 },
      { id: 'industry_farming', verb: 'constrains', adverb: 'through water stress', influence: 0.49 },
      { id: 'food', verb: 'undermines', adverb: 'through supply unreliability', influence: 0.45 }
    ],
    baseValue: 43,
    vector: { climate_forcing: 0.52, ecological_damage: 0.74, human_drivenness: 0.58, societal_fallout: 0.92 },
    description: 'hydrologic stress, allocation instability, and treatment pressure across ecological and human water systems',
    anchors: [
      { name: 'Aquifer Overdraft', sphere: 'biosphere' },
      { name: 'River Flow Regime Shift', sphere: 'biosphere' },
      { name: 'Reservoir Storage Instability', sphere: 'energy' },
      { name: 'Reservoir Operating Shortfall', sphere: 'energy' },
      { name: 'Snowmelt Timing Shift', sphere: 'cryosphere' },
      { name: 'Soil Moisture Collapse', sphere: 'agriculture' },
      { name: 'Flash Flood Regime', sphere: 'atmosphere' },
      { name: 'Drought Persistence', sphere: 'atmosphere' },
      { name: 'Freshwater Lens Compression', sphere: 'oceans' },
      { name: 'Drinking Water Treatment Stress', sphere: 'sociopolitical' },
      { name: 'Watershed Forest Loss', sphere: 'biosphere' },
      { name: 'Wastewater Infrastructure Overflow', sphere: 'sociopolitical' },
      { name: 'Wastewater Bypass Discharge', sphere: 'sociopolitical' },
      { name: 'Irrigation Water Inefficiency', sphere: 'agriculture' },
      { name: 'Hydropower Reliability Decline', sphere: 'energy' },
      { name: 'Basin Treaty Breakdown', sphere: 'sociopolitical' },
      { name: 'Desalination Dependence', sphere: 'energy' }
    ]
  },
  {
    key: 'cryosphere_frontiers',
    parent: 'temp',
    target: 'migration',
    inboundVerb: 'warms into',
    outboundVerb: 'pressures',
    inboundInfluence: 0.6,
    outboundInfluence: 0.56,
    secondary_sources: [
      { id: 'carbon_emission', verb: 'loads heat into', adverb: 'persistently', influence: 0.47 }
    ],
    targets: [
      { id: 'migration', verb: 'pressures', adverb: 'through habitability loss', influence: 0.56 },
      { id: 'resource_depletion', verb: 'disrupts', adverb: 'through melt and thaw', influence: 0.44 },
      { id: 'environ_anomalies', verb: 'amplifies', adverb: 'through ice-loss feedbacks', influence: 0.39 }
    ],
    baseValue: 46,
    vector: { climate_forcing: 0.78, ecological_damage: 0.72, human_drivenness: 0.22, societal_fallout: 0.9 },
    description: 'land-ice decline, thaw instability, and cryosphere-linked habitability stress beyond the original permafrost-only family',
    anchors: [
      { name: 'Ice Sheet Mass Loss', sphere: 'cryosphere' },
      { name: 'Glacial Lake Failure Risk', sphere: 'cryosphere' },
      { name: 'Sea Ice Season Loss', sphere: 'cryosphere' },
      { name: 'Coastal Inundation Risk', sphere: 'oceans' },
      { name: 'Thermokarst Expansion', sphere: 'cryosphere' },
      { name: 'Arctic Shipping Expansion', sphere: 'transport' },
      { name: 'Polar Infrastructure Failure', sphere: 'cryosphere' },
      { name: 'Snow Drought', sphere: 'cryosphere' },
      { name: 'Firn Layer Depletion', sphere: 'cryosphere' },
      { name: 'Glacier Meltwater Dependency', sphere: 'sociopolitical' }
    ]
  },
  {
    key: 'ocean_regimes',
    parent: 'amoc',
    target: 'food',
    inboundVerb: 'reshapes',
    outboundVerb: 'disrupts',
    inboundInfluence: 0.57,
    outboundInfluence: 0.6,
    secondary_sources: [
      { id: 'carbon_emission', verb: 'warms and acidifies around', adverb: 'across basins', influence: 0.43 }
    ],
    targets: [
      { id: 'food', verb: 'disrupts', adverb: 'through fisheries and rainfall shifts', influence: 0.6 },
      { id: 'environ_anomalies', verb: 'reorganizes', adverb: 'through basin teleconnections', influence: 0.42 },
      { id: 'resource_depletion', verb: 'weakens', adverb: 'through coastal and marine stress', influence: 0.38 }
    ],
    baseValue: 44,
    vector: { climate_forcing: 0.58, ecological_damage: 0.84, human_drivenness: 0.28, societal_fallout: 0.83 },
    description: 'marine productivity loss, coastal oxygen stress, and ocean carbon-cycle weakening',
    anchors: [
      { name: 'Oceanic Deoxygenation', sphere: 'oceans' },
      { name: 'Antarctic Bottom Water Decline', sphere: 'oceans' },
      { name: 'Ocean Acidification', sphere: 'oceans' },
      { name: 'Pacific Decadal Oscillation', sphere: 'oceans' },
      { name: 'Atlantic Multidecadal Oscillation', sphere: 'oceans' },
      { name: 'Atlantic Niño/Niña', sphere: 'oceans' },
      { name: 'Indian Ocean Dipole', sphere: 'oceans' },
      { name: 'Marine Fisheries Collapse', sphere: 'oceans' },
      { name: 'Fish Landing Supply Disruption', sphere: 'sociopolitical' },
      { name: 'Ocean Current Regime Shift', sphere: 'oceans' },
      { name: 'Coastal Hypoxia', sphere: 'oceans' },
      { name: 'Marine Food Web Simplification', sphere: 'oceans' },
      { name: 'Ocean Salinity Stratification', sphere: 'oceans' },
      { name: 'Harmful Algal Blooms', sphere: 'oceans' },
      { name: 'Pelagic Species Redistribution', sphere: 'oceans' },
      { name: 'Littoral Surge Vulnerability', sphere: 'oceans' }
    ]
  },
  {
    key: 'carbon_cycle_feedbacks',
    parent: 'carbon_emission',
    target: 'temp',
    inboundVerb: 'loads into',
    outboundVerb: 'amplifies',
    inboundInfluence: 0.64,
    outboundInfluence: 0.68,
    secondary_sources: [
      { id: 'temp', verb: 'destabilizes sinks behind', adverb: 'through warming', influence: 0.46 }
    ],
    targets: [
      { id: 'temp', verb: 'amplifies', adverb: 'through feedback release', influence: 0.68 },
      { id: 'methane', verb: 'unlocks additional forcing in', adverb: 'for some feedbacks', influence: 0.37 },
      { id: 'environ_anomalies', verb: 'raises pressure on', adverb: 'through heat loading', influence: 0.34 }
    ],
    baseValue: 47,
    vector: { climate_forcing: 0.92, ecological_damage: 0.88, human_drivenness: 0.46, societal_fallout: 0.78 },
    description: 'observed weakening of natural carbon sinks and release feedbacks across land, coasts, peat systems, and the global ocean',
    anchors: [
      { name: 'Land Carbon Sink Weakening', sphere: 'biosphere' },
      { name: 'Peat Oxidation Pulse', sphere: 'biosphere' },
      { name: 'Tidal Wetland Carbon Reversal', sphere: 'oceans' },
      { name: 'Ocean Carbon Uptake Weakening', sphere: 'oceans' }
    ]
  },
  {
    key: 'atmospheric_patterns',
    parent: 'temp',
    target: 'environ_anomalies',
    inboundVerb: 'locks in',
    outboundVerb: 'amplifies',
    inboundInfluence: 0.55,
    outboundInfluence: 0.64,
    secondary_sources: [
      { id: 'carbon_emission', verb: 'loads energy into', adverb: 'background circulation', influence: 0.42 }
    ],
    targets: [
      { id: 'environ_anomalies', verb: 'amplifies', adverb: 'through circulation persistence', influence: 0.64 },
      { id: 'industry_farming', verb: 'destabilizes', adverb: 'through rainfall and heat shifts', influence: 0.46 },
      { id: 'migration', verb: 'raises exposure for', adverb: 'through repeated extremes', influence: 0.32 }
    ],
    baseValue: 45,
    vector: { climate_forcing: 0.82, ecological_damage: 0.52, human_drivenness: 0.32, societal_fallout: 0.88 },
    description: 'persistent circulation anomalies, atmospheric drying, aerosol changes, and smoke exposure pathways',
    anchors: [
      { name: 'Nocturnal Heat Stress', sphere: 'atmosphere' },
      { name: 'Compound Day-Night Heat Extremes', sphere: 'atmosphere' },
      { name: 'Hail Hazard Shift', sphere: 'atmosphere' },
      { name: 'Madden-Julian Oscillation', sphere: 'atmosphere' },
      { name: 'North Atlantic Oscillation', sphere: 'atmosphere' },
      { name: 'Arctic Oscillation', sphere: 'atmosphere' },
      { name: 'Pacific-North American Pattern', sphere: 'atmosphere' },
      { name: 'Southern Annular Mode', sphere: 'atmosphere' },
      { name: 'Quasi-Biennial Oscillation', sphere: 'atmosphere' },
      { name: 'Blocking Pattern Persistence', sphere: 'atmosphere' },
      { name: 'Humidity Amplification', sphere: 'atmosphere' },
      { name: 'Lightning Fire Weather', sphere: 'atmosphere' },
      { name: 'Atmospheric Dryness', sphere: 'atmosphere' },
      { name: 'Soot Deposition on Snow', sphere: 'atmosphere' },
      { name: 'Ozone Formation Pressure', sphere: 'atmosphere' },
      { name: 'Rossby Wave Stalling', sphere: 'atmosphere' },
      { name: 'Smoke Exposure Burden', sphere: 'atmosphere' },
      { name: 'Low-Cloud Deck Retreat', sphere: 'atmosphere' },
      { name: 'Aerosol Cooling Loss', sphere: 'atmosphere', baseValue: 35 }
    ]
  },
  {
    key: 'energy_systems',
    parent: 'data_centers',
    target: 'carbon_emission',
    inboundVerb: 'scales into',
    outboundVerb: 'intensifies',
    inboundInfluence: 0.61,
    outboundInfluence: 0.62,
    secondary_sources: [
      { id: 'ai_data_centers', verb: 'accelerates buildout of', adverb: 'across regions', influence: 0.54 }
    ],
    targets: [
      { id: 'carbon_emission', verb: 'intensifies', adverb: 'through fossil fallback', influence: 0.62 },
      { id: 'resource_depletion', verb: 'raises pressure on', adverb: 'through water and material demand', influence: 0.44 },
      { id: 'urbanization', verb: 'stresses infrastructure in', adverb: 'through concentrated load', influence: 0.31 }
    ],
    baseValue: 44,
    vector: { climate_forcing: 0.9, ecological_damage: 0.56, human_drivenness: 0.94, societal_fallout: 0.72 },
    description: 'grid chokepoints, fossil fallback, industrial process emissions, and energy-system lock-in',
    anchors: [
      { name: 'Grid Peak Load Stress', sphere: 'energy' },
      { name: 'Peaker Plant Lock-In', sphere: 'energy' },
      { name: 'Transmission Buildout Lag', sphere: 'energy' },
      { name: 'Transformer Supply Bottleneck', sphere: 'energy' },
      { name: 'Gas Power Dependence', sphere: 'energy' },
      { name: 'Industrial Heat Decarbonization Gap', sphere: 'energy' },
      { name: 'Cement Process Emissions', sphere: 'economy' },
      { name: 'Steel Decarbonization Gap', sphere: 'economy' },
      { name: 'Critical Mineral Extraction Pressure', sphere: 'energy' },
      { name: 'Battery Supply Chain Pressure', sphere: 'energy' },
      { name: 'Semiconductor Fabrication Footprint', sphere: 'energy' },
      { name: 'Cooling Water Competition', sphere: 'energy' },
      { name: 'Backup Generator Dependence', sphere: 'energy' },
      { name: 'Energy Affordability Crisis', sphere: 'sociopolitical' },
      { name: 'Utility Disconnection Risk', sphere: 'sociopolitical' },
      { name: 'Renewable Curtailment Losses', sphere: 'energy' }
    ]
  },
  {
    key: 'transport_systems',
    parent: 'personal_conveyance',
    target: 'carbon_emission',
    inboundVerb: 'extends',
    outboundVerb: 'fuels',
    inboundInfluence: 0.56,
    outboundInfluence: 0.6,
    secondary_sources: [
      { id: 'urbanization', verb: 'concentrates mobility demand around', adverb: 'through built form', influence: 0.39 }
    ],
    targets: [
      { id: 'carbon_emission', verb: 'fuels', adverb: 'through transport lock-in', influence: 0.6 },
      { id: 'environ_anomalies', verb: 'adds exposure to', adverb: 'through disruption sensitivity', influence: 0.29 },
      { id: 'urbanization', verb: 'reconfigures pressure in', adverb: 'through freight and access stress', influence: 0.24 }
    ],
    baseValue: 42,
    vector: { climate_forcing: 0.78, ecological_damage: 0.46, human_drivenness: 0.9, societal_fallout: 0.73 },
    description: 'aviation, shipping, freight, and climate-exposed mobility infrastructure beyond private vehicle dependence',
    anchors: [
      { name: 'Aviation Demand Growth', sphere: 'transport' },
      { name: 'Shipping Lane Disruption', sphere: 'transport' },
      { name: 'Freight Electrification Gap', sphere: 'transport' },
      { name: 'Port Heat Vulnerability', sphere: 'transport' },
      { name: 'Road Freight Diesel Lock-In', sphere: 'transport' },
      { name: 'Airport Climate Exposure', sphere: 'transport' },
      { name: 'Airport Operational Disruption', sphere: 'transport' },
      { name: 'Bridge Scour Exposure', sphere: 'transport' },
      { name: 'Rail Heat Buckling', sphere: 'transport' }
    ]
  },
  {
    key: 'biosphere_resilience',
    parent: 'deforestation',
    target: 'resource_depletion',
    inboundVerb: 'fragments into',
    outboundVerb: 'erodes',
    inboundInfluence: 0.58,
    outboundInfluence: 0.6,
    secondary_sources: [
      { id: 'temp', verb: 'dries and stresses', adverb: 'across ecosystems', influence: 0.38 }
    ],
    targets: [
      { id: 'resource_depletion', verb: 'erodes', adverb: 'through ecological loss', influence: 0.6 },
      { id: 'food', verb: 'reduces resilience of', adverb: 'through pollinator and habitat loss', influence: 0.41 },
      { id: 'migration', verb: 'weakens habitability for', adverb: 'through ecosystem collapse', influence: 0.28 }
    ],
    baseValue: 45,
    vector: { climate_forcing: 0.5, ecological_damage: 0.97, human_drivenness: 0.45, societal_fallout: 0.9 },
    description: 'ecosystem integrity loss, fire-regime shifts, habitat simplification, and biodiversity compression',
    anchors: [
      { name: 'Biodiversity Intactness Loss', sphere: 'biosphere' },
      { name: 'Wildfire Regime Shift', sphere: 'biosphere' },
      { name: 'Forest Fragmentation', sphere: 'biosphere' },
      { name: 'Mangrove Buffer Loss', sphere: 'biosphere' },
      { name: 'Reef Structural Collapse', sphere: 'oceans' },
      { name: 'Pollinator Service Decline', sphere: 'biosphere' },
      { name: 'Freshwater Ecosystem Collapse', sphere: 'biosphere' },
      { name: 'Species Range Compression', sphere: 'biosphere' },
      { name: 'Insect Biomass Decline', sphere: 'biosphere' },
      { name: 'Soil Humus Decline', sphere: 'biosphere' },
      { name: 'Urban Tree Canopy Loss', sphere: 'sociopolitical' }
    ]
  },
  {
    key: 'agriculture_food',
    parent: 'industry_farming',
    target: 'food',
    inboundVerb: 'pushes',
    outboundVerb: 'destabilizes',
    inboundInfluence: 0.6,
    outboundInfluence: 0.58,
    secondary_sources: [
      { id: 'temp', verb: 'stresses', adverb: 'through heat and rainfall shifts', influence: 0.43 }
    ],
    targets: [
      { id: 'food', verb: 'destabilizes', adverb: 'through yield and labor losses', influence: 0.58 },
      { id: 'migration', verb: 'raises displacement risk for', adverb: 'after repeated harvest shocks', influence: 0.34 },
      { id: 'resource_depletion', verb: 'amplifies draw on', adverb: 'through input intensity', influence: 0.41 }
    ],
    baseValue: 44,
    vector: { climate_forcing: 0.68, ecological_damage: 0.84, human_drivenness: 0.92, societal_fallout: 0.84 },
    description: 'yield volatility, labor exposure, disease pressure, and supply fragility across food systems',
    anchors: [
      { name: 'Crop Yield Volatility', sphere: 'agriculture' },
      { name: 'Farm Heat Stress', sphere: 'agriculture' },
      { name: 'Livestock Disease Pressure', sphere: 'agriculture' },
      { name: 'Fertilizer Price Shock', sphere: 'agriculture' },
      { name: 'Feed Crop Dependency', sphere: 'agriculture' },
      { name: 'Food Import Exposure', sphere: 'sociopolitical' },
      { name: 'Cold Chain Failure Risk', sphere: 'economy' },
      { name: 'Fishery Protein Dependence', sphere: 'sociopolitical' },
      { name: 'Agricultural Labor Exposure', sphere: 'agriculture' },
      { name: 'Topsoil Erosion Acceleration', sphere: 'agriculture' }
    ]
  },
  {
    key: 'governance_finance',
    parent: 'migration',
    target: 'urbanization',
    inboundVerb: 'concentrates into',
    outboundVerb: 'reconfigures',
    inboundInfluence: 0.52,
    outboundInfluence: 0.47,
    secondary_sources: [
      { id: 'environ_anomalies', verb: 'burdens recovery systems behind', adverb: 'after repeated disasters', influence: 0.4 }
    ],
    targets: [
      { id: 'urbanization', verb: 'reconfigures', adverb: 'through settlement pressure', influence: 0.47 },
      { id: 'resource_depletion', verb: 'strains', adverb: 'through fiscal and service limits', influence: 0.28 },
      { id: 'food', verb: 'reduces access to', adverb: 'through affordability and disruption', influence: 0.24 }
    ],
    baseValue: 41,
    vector: { climate_forcing: 0.42, ecological_damage: 0.38, human_drivenness: 0.62, societal_fallout: 0.98 },
    description: 'insurance retreat, health exposure, adaptation shortfalls, and governance stress in climate-vulnerable societies',
    anchors: [
      { name: 'Insurance Retreat', sphere: 'economy' },
      { name: 'Mortgage Market Exposure', sphere: 'economy' },
      { name: 'Public Health Heat Burden', sphere: 'sociopolitical' },
      { name: 'Vector-Borne Disease Expansion', sphere: 'sociopolitical' },
      { name: 'Adaptation Capital Shortfall', sphere: 'economy' },
      { name: 'Critical Infrastructure Fragility', sphere: 'sociopolitical' },
      { name: 'Disaster Recovery Inequality', sphere: 'sociopolitical' },
      { name: 'Relocation Governance Capacity', sphere: 'sociopolitical' },
      { name: 'Climate Litigation Pressure', sphere: 'sociopolitical' },
      { name: 'Conflict Risk Escalation', sphere: 'sociopolitical' }
    ]
  }
];

const EXPANSION_GROUP_SOURCE_PROFILES = {
  water_systems: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.wri.org/aqueduct',
      'https://gracefo.jpl.nasa.gov/',
      'https://climateserv.servirglobal.net/'
    ],
    api_keys: [],
    notes: 'Water-systems expansion anchors inherit basin-stress, groundwater, and hydrologic-variability references until node-specific source attachments are added.'
  },
  freshwater_systems: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.wri.org/aqueduct',
      'https://www.fao.org/aquastat/',
      'https://gracefo.jpl.nasa.gov/',
      'https://wmo.int/publication-series/state-of-global-water-resources-2024'
    ],
    api_keys: [],
    notes: 'Freshwater-system anchors inherit basin-stress, groundwater-depletion, and flow-regime references until node-specific source attachments are added.'
  },
  public_health_systems: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.who.int/health-topics/climate-change',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
      'https://www.ilo.org/publications/working-warmer-planet-impact-heat-stress-labour-productivity-and-decent-work'
    ],
    api_keys: [],
    notes: 'Public-health anchors inherit bounded references for heat, air pollution, occupational exposure, and climate-sensitive disease burden.'
  },
  cryosphere_frontiers: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://sealevel.nasa.gov/',
      'https://wmo.int/',
      'https://www.usgs.gov/special-topics/water-science-school/science/rain-snow-events',
      'https://www.unesco.org/reports/wwdr/en/2025'
    ],
    api_keys: [],
    notes: 'Cryosphere-frontier anchors inherit references covering permafrost, land ice, sea ice, and sea-level-linked habitability stress.'
  },
  ocean_regimes: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.metoffice.gov.uk/research/climate/climate-physics/long-term-ocean-change',
      'https://www.pmel.noaa.gov/co2/story/Ocean+Acidification',
      'https://www.science.org/doi/10.1126/science.aam7240',
      'https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/IODMI/DMI.html',
      'https://www.who.int/news-room/fact-sheets/detail/vector-borne-diseases'
    ],
    api_keys: [],
    notes: 'Ocean-regime anchors inherit references for circulation change, acidification, oxygen loss, and basin-scale climate modes.'
  },
  carbon_cycle_feedbacks: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/',
      'https://www.earthdata.nasa.gov/learn/find-data/peatlands',
      'https://oceanservice.noaa.gov/ecosystems/coasts/blue-carbon/'
    ],
    api_keys: [],
    notes: 'Carbon-cycle feedback anchors inherit references for weakening land and ocean sinks plus peatland and blue-carbon reversal pathways.'
  },
  atmospheric_patterns: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/MJO/mjo.shtml',
      'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/pna/nao.shtml',
      'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/ao.shtml',
      'https://www.nature.com/articles/s41558-026-02670-5',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
    ],
    api_keys: [],
    notes: 'Atmospheric-pattern anchors inherit references for monitored teleconnections, circulation persistence, and compound heat-pattern hazards.'
  },
  energy_systems: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.eia.gov/opendata/',
      'https://www.epa.gov/egrid',
      'https://www.iea.org/reports/energy-and-ai',
      'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
      'https://www.wri.org/aqueduct'
    ],
    api_keys: ['eia_api_key', 'electricity_maps_api_key'],
    notes: 'Energy-system anchors inherit references for grid mix, emissions factors, AI electricity demand, and cooling-water competition.'
  },
  digital_infrastructure: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.iea.org/reports/energy-and-ai',
      'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
      'https://www.itu.int/hub/publication/d-pref-ef-ict-2024/',
      'https://www.oecd.org/en/publications/enhancing-the-resilience-of-communication-networks_77fc57c6-en.html',
      'https://www.nist.gov/chips/implementation-strategies/national-environmental-policy-act-nepa-and-chips-act'
    ],
    api_keys: [],
    notes: 'Digital-infrastructure anchors inherit references for data-center electricity and water, telecom energy, communications resilience, and semiconductor manufacturing burden.'
  },
  transport_systems: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.iea.org/topics/transport',
      'https://www.ncei.noaa.gov/access/monitoring/monthly-report/global'
    ],
    api_keys: [],
    notes: 'Transport-system anchors inherit references for transport emissions, freight exposure, and climate disruption sensitivity.'
  },
  materials_economy: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.unep.org/resources/global-resources-outlook-2024',
      'https://www.iea.org/reports/the-future-of-petrochemicals',
      'https://www.iea.org/reports/global-critical-minerals-outlook-2025',
      'https://www.unep.org/resources/publication/sustainability-and-circularity-textile-value-chain-global-roadmap'
    ],
    api_keys: [],
    notes: 'Materials-economy nodes inherit references for extraction, industrial processing, plastics, textiles, waste, and circularity pressures.'
  },
  biosphere_resilience: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.globalforestwatch.org/',
      'https://www.gbif.org/',
      'https://iconicspecies.iucnredlist.org/',
      'https://www.pmel.noaa.gov/co2/story/Ocean+Acidification'
    ],
    api_keys: [],
    notes: 'Biosphere-resilience anchors inherit references for habitat loss, species occurrence, extinction risk, and reef-system degradation.'
  },
  agriculture_food: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.fao.org/faostat/',
      'https://mausam.imd.gov.in/responsive/climate_services.php',
      'https://www.sahf.info/'
    ],
    api_keys: [],
    notes: 'Agriculture-food anchors inherit references for yields, food-system dependence, climate-service outlooks, and seasonal production shocks.'
  },
  governance_finance: {
    source_status: 'family_calibrated_reference',
    source_urls: [
      'https://www.unhcr.org/climate-change-and-disasters.html',
      'https://www.iom.int/',
      'https://www.undrr.org/',
      'https://www.emdat.be/'
    ],
    api_keys: [],
    notes: 'Governance-finance anchors inherit references for displacement, disaster impacts, adaptation strain, and recovery inequality.'
  }
};

const GRAPH_PROFILE_SETTINGS = {
  active: 'northstar',
  baseline: {
    id: 'baseline',
    targetNodeCount: 512
  },
  northstar: {
    id: 'northstar',
    targetNodeCount: 768
  }
};

const CALIBRATION_RUBRIC = {
  reviewed_at: '2026-06-27',
  vector_dimensions: {
    climate_forcing: 'Direct contribution to radiative forcing, heat retention, or major positive climate feedback.',
    ecological_damage: 'Breadth and intensity of ecosystem disruption, habitat loss, and resilience erosion.',
    human_drivenness: 'Degree to which human infrastructure, policy, consumption, or industry directly controls the phenomenon.',
    societal_fallout: 'Impacts on health, water, food, migration, infrastructure, and economic stability.'
  },
  scoring_note: 'Anchor vectors remain expert-weighted, but are now documented against official source portals and used as the deterministic basis for generated node calibration.',
  api_dependency_note: 'Anchor weights are source-backed but not computed from live API responses. Only EIA and Electricity Maps are active core server-side keys; ECMWF/CDS and OpenAQ are optional exploratory keys and do not drive scoring.',
  greenhouse_note: 'CO2 and CH4 concentrations are registered as long-lived greenhouse forcing signals. They can support a forcing proxy, but they are not sufficient by themselves to compute observed global temperature.'
};

const ANCHOR_CALIBRATION_PROFILES = {
  temp: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025',
      'https://data.giss.nasa.gov/gistemp/',
      'https://berkeleyearth.org/data/',
      'https://www.ncei.noaa.gov/news/global-climate-202606',
      'https://climate.copernicus.eu/surface-air-temperature-june-2026'
    ],
    api_keys: [],
    notes: 'Global temperature remains a directly observed climate-system integrator. The anchor is tied to annual surface-temperature syntheses and cross-checked against NASA, NOAA, and Berkeley Earth observational products; satellite and reanalysis feeds are supporting context rather than interchangeable substitutes for the surface record.'
  },
  methane: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://gml.noaa.gov/ccgg/trends_ch4/'
    ],
    api_keys: [],
    notes: 'Methane retains maximum forcing weight because NOAA trend records continue to show rapid atmospheric growth and strong short-term warming potency.'
  },
  deforestation: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://www.globalforestwatch.org/',
      'https://www.earthdata.nasa.gov/'
    ],
    api_keys: [],
    notes: 'Deforestation remains near-max ecological damage because forest loss simultaneously reduces carbon sinks, fragments habitat, and alters rainfall feedbacks.'
  },
  industry_farming: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://www.fao.org/faostat/',
      'https://www.fao.org/home/en'
    ],
    api_keys: [],
    notes: 'Industrial agriculture retains very high human drivenness and ecological pressure due to direct land, methane, nitrogen, and water-system impacts.'
  },
  food: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://www.fao.org/faostat/',
      'https://www.fao.org/home/en'
    ],
    api_keys: [],
    notes: 'Agricultural demand is calibrated as a high societal-fallout demand driver with indirect but significant land and resource effects.'
  },
  urbanization: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://ghsl.jrc.ec.europa.eu/',
      'https://modis.gsfc.nasa.gov/'
    ],
    api_keys: [],
    notes: 'Urbanization remains a high human-driven amplifier of heat exposure, impervious runoff, and infrastructure concentration.'
  },
  fast_fashion: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://www.unep.org/',
      'https://www.climaterealityproject.org/'
    ],
    api_keys: [],
    notes: 'Fast fashion is modelled as a human-controlled industrial consumption system with strong waste, water, and emissions externalities.'
  },
  migration: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://www.unhcr.org/climate-change-and-disasters.html',
      'https://www.iom.int/'
    ],
    api_keys: [],
    notes: 'Migration remains low forcing but maximum societal fallout because it is primarily a downstream response to climate stress rather than a generic cause of other harms.'
  },
  resource_depletion: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://gracefo.jpl.nasa.gov/',
      'https://podaac.jpl.nasa.gov/GRACE'
    ],
    api_keys: [],
    notes: 'Resource depletion is calibrated with high ecological damage and societal fallout based on groundwater and land-capital exhaustion dynamics.'
  },
  carbon_emission: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://gml.noaa.gov/ccgg/trends/',
      'https://gml.noaa.gov/aggi/aggi.html'
    ],
    api_keys: [],
    notes: 'This anchor is calibrated from atmospheric CO2 abundance as a forcing proxy. It should not be interpreted as a live emissions-flow meter, but as the cumulative long-lived warming pressure created by carbon emissions.'
  },
  personal_conveyance: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://www.iea.org/topics/transport',
      'https://tempo.si.edu/'
    ],
    api_keys: [],
    notes: 'Personal conveyance stays highly human-driven with moderate ecological damage and substantial emissions linkage through direct fossil combustion.'
  },
  environ_anomalies: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.ncei.noaa.gov/access/monitoring/monthly-report/global'
    ],
    api_keys: [],
    notes: 'Environmental anomalies are kept high in ecological and societal disruption because they aggregate extreme-event pathways rather than direct forcing alone.'
  },
  el_nino: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://clik.apcc21.org/',
      'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php'
    ],
    api_keys: [],
    notes: 'El Nino is calibrated as a major ocean-climate redistributor with modest direct human drivenness and strong event-level societal impacts.'
  },
  la_nina: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://clik.apcc21.org/',
      'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php'
    ],
    api_keys: [],
    notes: 'La Nina mirrors ENSO teleconnection strength with very low human drivenness and strong downstream drought-flood effects.'
  },
  amoc: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://www.metoffice.gov.uk/research/climate/climate-physics/long-term-ocean-change',
      'https://wmo.int/'
    ],
    api_keys: [],
    notes: 'AMOC slowdown remains high in ecological damage and societal fallout because circulation change can trigger broad rainfall and marine-system reorganization.'
  },
  ocean_acidification: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.pmel.noaa.gov/co2/story/Ocean+Acidification'
    ],
    api_keys: [],
    notes: 'Ocean acidification is promoted to anchor status because NOAA PMEL documents multi-decadal observations showing CO2 uptake is measurably changing seawater chemistry, pH, and carbonate conditions across the global ocean.'
  },
  oceanic_deoxygenation: {
    source_status: 'primary_research_link',
    source_urls: [
      'https://www.science.org/doi/10.1126/science.aam7240'
    ],
    api_keys: [],
    notes: 'Oceanic deoxygenation is distinct from coastal hypoxia because it describes the measured decline of dissolved oxygen across the open ocean and abyssal waters, documented globally in the primary Science synthesis on oxygen loss in open-ocean and coastal systems.'
  },
  antarctic_bottom_water_decline: {
    source_status: 'primary_research_link',
    source_urls: [
      'https://www.nature.com/articles/s41558-023-01667-8'
    ],
    api_keys: [],
    notes: 'Antarctic Bottom Water decline is treated as a separate deep-ocean anchor because primary observations show reduced abyssal overturning and ventilation in the Australian Antarctic Basin, thinning oxygenated bottom layers and weakening deep ocean renewal.'
  },
  land_carbon_sink_weakening: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/'
    ],
    api_keys: [],
    notes: 'This anchor is inferred from the Global Carbon Budget 2025 FAQ reporting that climate change and variability are weakening natural land and ocean sinks, with the land sink substantially smaller than it would be without climate change over the recent decade.'
  },
  peat_oxidation_pulse: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://www.earthdata.nasa.gov/learn/find-data/peatlands'
    ],
    api_keys: [],
    notes: 'Peat oxidation is treated as a carbon-cycle feedback because NASA Earthdata maintains peatland data access and monitoring pathways relevant to peat carbon storage, drainage, fire, and release risk.'
  },
  tidal_wetland_carbon_reversal: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://oceanservice.noaa.gov/ecosystems/coasts/blue-carbon/'
    ],
    api_keys: [],
    notes: 'Tidal wetland carbon reversal is modelled as a distinct coastal carbon feedback using NOAA blue-carbon program material on carbon storage in salt marsh, mangrove, and seagrass systems and the risk of reversal under disturbance and loss.'
  },
  ocean_carbon_uptake_weakening: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/'
    ],
    api_keys: [],
    notes: 'This anchor is inferred from the Global Carbon Budget 2025 FAQ reporting that climate change has already weakened the ocean carbon sink relative to a no-climate-change baseline, reducing the climate-buffering role of ocean uptake.'
  },
  pacific_decadal_oscillation: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://psl.noaa.gov/data/correlation/pdo.data'
    ],
    api_keys: [],
    notes: 'Pacific Decadal Oscillation is retained as a canonical basin-scale climate mode because NOAA PSL maintains a long-running monthly PDO index time series, supporting direct empirical monitoring rather than inferential labeling.'
  },
  atlantic_multidecadal_oscillation: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://psl.noaa.gov/data/correlation/amon.us.data'
    ],
    api_keys: [],
    notes: 'Atlantic Multidecadal Oscillation is kept as a monitored North Atlantic variability signal because NOAA PSL publishes a long monthly AMO index record, making it a cleaner anchor than a vague Atlantic regime placeholder.'
  },
  atlantic_ni_o_ni_a: {
    source_status: 'primary_research_link',
    source_urls: [
      'https://www.nature.com/articles/s41558-026-02684-z'
    ],
    api_keys: [],
    notes: 'Atlantic Nino/Nina is modelled as a distinct tropical Atlantic SST variability mode because the Nature Climate Change study identifies it as a canonical variability phenomenon with climate teleconnections separate from ENSO and the Indian Ocean Dipole.'
  },
  indian_ocean_dipole: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/IODMI/DMI.html'
    ],
    api_keys: [],
    notes: 'Indian Ocean Dipole is promoted to anchor status because NOAA CPC updates the Dipole Mode Index monthly and explicitly tracks positive and negative IOD phases as an observed climate phenomenon.'
  },
  wet_bulb_heat: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://wmo.int/',
      'https://www.nasa.gov/'
    ],
    api_keys: [],
    notes: 'Wet-bulb heat is treated as a medium forcing but maximum societal fallout hazard because it is primarily a human survivability and infrastructure stress metric.'
  },
  nocturnal_heat_stress: {
    source_status: 'primary_research_link',
    source_urls: [
      'https://www.nature.com/articles/s41558-026-02670-5'
    ],
    api_keys: [],
    notes: 'Nocturnal heat stress is treated as distinct from generic wet-bulb or daytime heat because the Nature Climate Change analysis isolates nighttime heat exposure as a separate human-recovery and survivability hazard.'
  },
  compound_day_night_heat_extremes: {
    source_status: 'primary_research_link',
    source_urls: [
      'https://www.nature.com/articles/s41558-026-02670-5'
    ],
    api_keys: [],
    notes: 'Compound day-night heat extremes are modelled as a separate compound hazard because the same Nature Climate Change study distinguishes persistent 24-hour heat exposure from isolated daytime or nighttime heat stress.'
  },
  hail_hazard_shift: {
    source_status: 'primary_research_link',
    source_urls: [
      'https://www.nature.com/articles/s41558-026-02660-7'
    ],
    api_keys: [],
    notes: 'Hail hazard shift is included as a distinct severe-convective climate signal because the Nature Climate Change study links warming to a redistribution of hail-prone environments and associated crop risk.'
  },
  monsoon_volatility: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://clik.apcc21.org/',
      'https://mausam.imd.gov.in/responsive/climate_services.php'
    ],
    api_keys: [],
    notes: 'Monsoon volatility carries high societal fallout due to direct exposure of food, water storage, and flood control systems.'
  },
  permafrost_thaw: {
    source_status: 'official_registry_link',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://wmo.int/'
    ],
    api_keys: [],
    notes: 'Permafrost thaw remains a strong positive feedback with relatively low direct human control but large climate and infrastructure consequences.'
  },
  data_centers: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.iea.org/reports/energy-and-ai',
      'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report'
    ],
    api_keys: [],
    notes: 'Data centers are calibrated as highly human-driven energy-demand infrastructure with moderate direct ecological damage and meaningful carbon and water implications.'
  },
  ai_data_centers: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.iea.org/reports/energy-and-ai',
      'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report'
    ],
    api_keys: [],
    notes: 'AI data centers receive a higher forcing and societal stress profile than generic data centers because IEA identifies AI as a major accelerator of electricity demand growth.'
  },
  semiconductor_fabs: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.nist.gov/chips/implementation-strategies/national-environmental-policy-act-nepa-and-chips-act',
      'https://www.oecd.org/en/topics/sub-issues/semiconductors.html'
    ],
    api_keys: [],
    notes: 'Semiconductor fabs are treated as digital-infrastructure upstream anchors because chip production carries heavy electricity, ultrapure-water, fluorinated-gas, and chokepoint burdens.'
  },
  telecom_backbone: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.itu.int/hub/publication/d-pref-ef-ict-2024/',
      'https://www.worldbank.org/en/topic/digitaldevelopment/brief/resilient-telecommunications-infrastructure'
    ],
    api_keys: [],
    notes: 'Telecom backbone infrastructure is calibrated as a distributed but critical digital load and resilience system spanning long-haul routes and switching hubs.'
  },
  mobile_wireless_networks: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.itu.int/hub/publication/d-pref-ef-ict-2024/',
      'https://openknowledge.worldbank.org/entities/publication/5e0f030e-8a32-5094-9702-22f0e9f17d02'
    ],
    api_keys: [],
    notes: 'Mobile and wireless networks are retained as access-layer digital infrastructure because their distributed towers and radios extend energy use and backup-power dependence across large geographies.'
  },
  internet_exchange_points: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.oecd.org/en/publications/enhancing-the-resilience-of-communication-networks_77fc57c6-en.html',
      'https://www.itu.int/hub/publication/D-TND-01-2018/'
    ],
    api_keys: [],
    notes: 'Internet exchange points are treated as compact but system-critical interconnection hubs that concentrate resilience value far beyond their physical size.'
  },
  subsea_cables: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.oecd.org/en/publications/enhancing-the-resilience-of-communication-networks_77fc57c6-en.html',
      'https://www.itu.int/itu-d/sites/submarine-cables/'
    ],
    api_keys: [],
    notes: 'Subsea cables anchor the global communications backbone and are modelled primarily as concentration and resilience chokepoints rather than as high direct-emissions assets.'
  },
  madden_julian_oscillation: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/MJO/mjo.shtml'
    ],
    api_keys: [],
    notes: 'The Madden-Julian Oscillation is kept as a canonical intraseasonal tropical variability mode because NOAA CPC operationally tracks its wind, OLR, and forecast diagnostics and it materially modulates global rainfall and temperature anomaly pathways.'
  },
  north_atlantic_oscillation: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/pna/nao.shtml'
    ],
    api_keys: [],
    notes: 'The North Atlantic Oscillation is retained as a canonical teleconnection because NOAA CPC maintains standardized daily and monthly index products dating back to 1950, making it an empirically monitored circulation mode rather than a speculative regional label.'
  },
  arctic_oscillation: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/ao.shtml'
    ],
    api_keys: [],
    notes: 'The Arctic Oscillation is modelled separately from generic jet variability because NOAA CPC provides a standardized AO index tied to polar-cap height anomalies and cold-season circulation structure.'
  },
  pacific_north_american_pattern: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/pna/pna.shtml'
    ],
    api_keys: [],
    notes: 'The Pacific-North American pattern is included as a distinct teleconnection because NOAA CPC tracks it as a standardized monthly-varying circulation mode with direct North American weather relevance.'
  },
  southern_annular_mode: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/aao/aao.shtml'
    ],
    api_keys: [],
    notes: 'Southern Annular Mode is sourced from NOAA CPC Antarctic Oscillation monitoring and treated as the canonical Southern Hemisphere annular circulation mode rather than duplicating AAO and SAM as separate nodes.'
  },
  quasi_biennial_oscillation: {
    source_status: 'web_verified_official',
    source_urls: [
      'https://acd-ext.gsfc.nasa.gov/Data_services/met/qbo/qbo.html'
    ],
    api_keys: [],
    notes: 'The Quasi-Biennial Oscillation is included because NASA maintains near-real-time and historical QBO observations from radiosondes, reanalysis, and satellite data, supporting its role as a measured stratospheric variability mode.'
  }
};

const CURATED_EDGE_EVIDENCE_PROFILES = {
  'temp->urbanization': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.epa.gov/heatislands',
      'https://www.ipcc.ch/report/ar6/wg2/'
    ],
    relationship_type: 'hazard_amplifier',
    confidence: 'medium',
    notes: 'Background warming compounds heat exposure in dense built environments and raises cooling and habitability stress in cities; this edge is about amplified urban hazard, not temperature causing urban growth.'
  },
  'temp->carbon_emission': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/',
      'https://gml.noaa.gov/aggi/aggi.html'
    ],
    relationship_type: 'feedback',
    confidence: 'medium',
    notes: 'Higher temperatures can weaken natural sinks and increase wildfire and soil-carbon losses, creating an observed warming feedback into carbon release; this is not the primary origin of anthropogenic CO2 emissions.'
  },
  'temp->deforestation': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.ipcc.ch/srccl/',
      'https://firms.modaps.eosdis.nasa.gov/'
    ],
    relationship_type: 'climate_stress_pathway',
    confidence: 'medium',
    notes: 'Warming raises drought stress, vapor-pressure deficit, and fire risk in forests, increasing climate-driven canopy loss and dieback; this edge is bounded to climate-amplified forest loss, not planned land clearing.'
  },
  'temp->methane': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/',
      'https://gml.noaa.gov/ccgg/trends_ch4/'
    ],
    relationship_type: 'feedback',
    confidence: 'medium',
    notes: 'Warming can accelerate methane release from wetlands and thawing permafrost, making this a bounded climate feedback rather than a claim that temperature explains the full methane trend by itself.'
  },
  'temp->industry_farming': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg2/',
      'https://www.fao.org/climate-change/en/'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Higher temperatures directly reduce crop and livestock performance, shorten safe field-work windows, and increase agricultural stress, making warming a defensible upstream pressure on industrial farming outcomes.'
  },
  'temp->environ_anomalies': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
      'https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Observed warming loads the atmosphere and oceans with more heat and moisture, increasing the likelihood and intensity of heat extremes, heavy rainfall, drought, and compound climate anomalies.'
  },
  'carbon_emission->temp': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
      'https://gml.noaa.gov/aggi/aggi.html'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Carbon dioxide emissions increase radiative forcing by trapping outgoing longwave radiation, making CO2 the principal long-lived driver of observed human-caused global warming.'
  },
  'temp->wet_bulb_heat': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
      'https://repository.library.noaa.gov/view/noaa/59273/noaa_59273_DS1.pdf'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'A warmer baseline raises both heat and atmospheric moisture capacity, making dangerous heat-humidity combinations more likely and pushing wet-bulb exposure closer to physiological limits.'
  },
  'temp->monsoon_volatility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/',
      'https://mausam.imd.gov.in/responsive/climate_services.php'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Rising temperatures alter land-ocean thermal contrast and moisture loading, which can destabilize monsoon timing and rainfall intensity even though regional circulation details still matter.'
  },
  'temp->permafrost_thaw': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gtnp.arcticportal.org/',
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Rising surface temperatures increase active-layer depth and thaw frozen ground, making permafrost thaw one of the clearest direct cryosphere responses to planetary warming.'
  },
  'temp->rain_on_snow_flood_risk': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/srocc/',
      'https://nsidc.org/learn/parts-cryosphere/snow'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Warming shifts winter precipitation from snow toward rain and increases midwinter melt, raising the chance of rain-on-snow runoff and flood damage in cold regions.'
  },
  'temp->peak_glacier_runoff_passage': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/srocc/',
      'https://sealevel.nasa.gov/'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Higher temperatures accelerate glacier melt and move glacier-fed basins toward or past peak runoff, after which water supply reliability typically declines.'
  },
  'permafrost_thaw->coastal_permafrost_erosion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/climate-research-and-development/science/permafrost',
      'https://www.arctic.noaa.gov/report-card/'
    ],
    relationship_type: 'direct',
    confidence: 'medium',
    notes: 'Thaw weakens ice-rich coastal ground and, together with longer open-water seasons, makes Arctic permafrost shorelines more vulnerable to rapid erosion.'
  },
  'temp->tundra_methane_outgassing': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://gtnp.arcticportal.org/',
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'feedback',
    confidence: 'medium',
    notes: 'Arctic warming can thaw tundra soils and wetlands enough to increase methane outgassing; this is a bounded permafrost-carbon feedback rather than a claim about all methane sources.'
  },
  'temp->ice_albedo_feedback_loops': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/sea-ice',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/'
    ],
    relationship_type: 'feedback',
    confidence: 'high',
    notes: 'Warming reduces snow and ice cover, exposing darker surfaces that absorb more solar energy and amplify additional warming through the ice-albedo feedback.'
  },
  'temp->alpine_snowpack_declines': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/snow',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Higher temperatures reduce snow accumulation and shift melt earlier, making alpine snowpack decline a direct and well-observed cryosphere response to warming.'
  },
  'temp->pingo_explosions': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://gtnp.arcticportal.org/',
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground'
    ],
    relationship_type: 'indirect_mechanism',
    confidence: 'medium',
    notes: 'Permafrost warming can destabilize ice-cored ground and pressurized frozen features, making pingo failure a bounded local response within thawing Arctic terrain.'
  },
  'temp->arctic_amplification_rates': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/sea-ice',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Global warming is expressed faster in the Arctic because sea ice, snow, clouds, and heat transport feedbacks amplify regional temperature change above the global mean.'
  },
  'temp->mountain_pass_avalanches': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/snow',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'hazard_amplifier',
    confidence: 'medium',
    notes: 'Warming alters snowpack structure, wet-snow conditions, and freeze-thaw stability in mountain terrain, increasing avalanche hazard in some high-elevation corridors.'
  },
  'temp->ice_shelf_grounding_line_retreat': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://sealevel.nasa.gov/',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Ocean and air warming contribute to ice thinning and grounding-line retreat, making grounded ice more vulnerable to marine instability and accelerated mass loss.'
  },
  'temp->tundra_thermokarst_development': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gtnp.arcticportal.org/',
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Rising temperatures thaw ice-rich permafrost and trigger ground subsidence, making thermokarst development a direct permafrost response to warming.'
  },
  'temp->arctic_pack_ice_drift': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/sea-ice',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
    ],
    relationship_type: 'cryosphere_response',
    confidence: 'medium',
    notes: 'Warming thins and weakens pack ice, which changes how readily Arctic sea ice deforms and drifts under winds and currents.'
  },
  'temp->cryoconite_hole_expansion': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://sealevel.nasa.gov/',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'cryosphere_response',
    confidence: 'medium',
    notes: 'Warmer melt conditions on glacier surfaces can lengthen the season and habitat for cryoconite development, increasing the expression of dark, biologically active melt features.'
  },
  'temp->boreal_peat_defrosting': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://gtnp.arcticportal.org/',
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'climate_stress_pathway',
    confidence: 'medium',
    notes: 'Warming deepens seasonal thaw and destabilizes frozen peat soils, increasing the risk of boreal peat defrosting and later carbon loss.'
  },
  'temp->ice_algae_pigmentation': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://sealevel.nasa.gov/',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'cryosphere_response',
    confidence: 'medium',
    notes: 'Longer and warmer melt seasons can support more pigmented glacier and ice-surface biology, darkening ice locally and strengthening melt-season absorption.'
  },
  'temp->glacier_hydrologic_system_floods': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.ipcc.ch/srocc/',
      'https://sealevel.nasa.gov/'
    ],
    relationship_type: 'hydrological_chain',
    confidence: 'medium',
    notes: 'Warming accelerates glacier meltwater release and destabilizes glacier-fed drainage systems, increasing the risk of flood pulses in downstream hydrologic networks.'
  },
  'temp->ice_cap_decapitation': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://sealevel.nasa.gov/',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'cryosphere_response',
    confidence: 'medium',
    notes: 'Persistent warming can strip smaller ice caps from their high-elevation cold core, making ice-cap decapitation a bounded but defensible glacier-loss response.'
  },
  'temp->nunatak_habitat_shrinkage': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://sealevel.nasa.gov/',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'habitat_exposure',
    confidence: 'medium',
    notes: 'As surrounding ice geometry and snow cover shift under warming, the exposed habitat and isolation dynamics around nunataks can change in ways that shrink specialized refugia.'
  },
  'temp->fjord_sedimentation_pulses': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://sealevel.nasa.gov/',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'sediment_flux_pathway',
    confidence: 'medium',
    notes: 'Higher melt and glacier retreat can increase sediment delivery into fjords, making sedimentation pulses a plausible downstream cryosphere response to warming.'
  },
  'temp->freeze_thaw_rock_fracturing': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/snow',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'frost_process_shift',
    confidence: 'medium',
    notes: 'Warming changes how often rock faces cross the freezing point and can intensify freeze-thaw instability in cold mountain terrain even as permanently frozen conditions retreat.'
  },
  'temp->tundra_shrubification_speeds': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://gtnp.arcticportal.org/',
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://www.ipcc.ch/srocc/'
    ],
    relationship_type: 'ecological_response',
    confidence: 'medium',
    notes: 'Warmer tundra growing seasons and thawing soils can accelerate shrub expansion across Arctic landscapes, making shrubification a defensible biosphere response to warming.'
  },
  'temp->el_nino': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php',
      'https://www.climate.gov/news-features/blogs/enso'
    ],
    notes: 'Background warming does not create ENSO events outright, but it is used here to represent the observed warming context in which El Nino impacts are expressed.'
  },
  'carbon_emission->el_nino': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gml.noaa.gov/ccgg/trends/',
      'https://www.climate.gov/news-features/blogs/enso'
    ],
    notes: 'This edge captures heat-loading context rather than a simple one-step causal claim that carbon emissions directly trigger ENSO phase onset.'
  },
  'el_nino->environ_anomalies': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.climate.gov/enso',
      'https://www.noaa.gov/education/resource-collections/weather-atmosphere/el-nino'
    ],
    notes: 'El Nino is a canonical teleconnection driver of global weather and climate anomalies.'
  },
  'el_nino->monsoon_volatility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.climate.gov/enso',
      'https://mausam.imd.gov.in/responsive/climate_services.php'
    ],
    notes: 'El Nino is linked to monsoon timing and rainfall disruptions across multiple regions, including South Asia.'
  },
  'el_nino->food': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/faostat/',
      'https://www.climate.gov/enso'
    ],
    notes: 'This edge represents ENSO-related crop and fishery disruption pathways into food-system stress.'
  },
  'el_nino->migration': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iom.int/',
      'https://www.climate.gov/enso'
    ],
    notes: 'This edge is used for displacement pressure under ENSO-linked drought, flood, and livelihood shocks.'
  },
  'carbon_emission->la_nina': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gml.noaa.gov/ccgg/trends/',
      'https://www.climate.gov/enso'
    ],
    notes: 'As with El Nino, this captures warming-context modulation of La Nina teleconnection impacts rather than direct event creation.'
  },
  'la_nina->environ_anomalies': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.climate.gov/enso',
      'https://www.noaa.gov/education/resource-collections/weather-atmosphere/la-nina'
    ],
    notes: 'La Nina is a canonical redistributor of drought, flood, and storm-track anomalies.'
  },
  'la_nina->monsoon_volatility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.climate.gov/enso',
      'https://mausam.imd.gov.in/responsive/climate_services.php'
    ],
    notes: 'La Nina is linked to altered monsoon strength and rainfall distribution across several basins.'
  },
  'la_nina->resource_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.wri.org/aqueduct',
      'https://www.climate.gov/enso'
    ],
    notes: 'This edge captures La Nina drought-flood swings that intensify basin and groundwater stress.'
  },
  'la_nina->food': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/faostat/',
      'https://www.climate.gov/enso'
    ],
    notes: 'This edge captures ENSO-linked agricultural and fishery stress pathways into food volatility.'
  },
  'carbon_emission->wet_bulb_heat': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gml.noaa.gov/ccgg/trends/',
      'https://wmo.int/'
    ],
    notes: 'This edge represents carbon-driven background warming that raises wet-bulb exposure risk.'
  },
  'wet_bulb_heat->migration': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iom.int/',
      'https://wmo.int/'
    ],
    notes: 'Wet-bulb heat can make work and outdoor survival conditions untenable, increasing displacement pressure.'
  },
  'wet_bulb_heat->food': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/faostat/',
      'https://wmo.int/'
    ],
    notes: 'This edge captures labor productivity loss and crop stress under combined heat-humidity extremes.'
  },
  'wet_bulb_heat->resource_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.wri.org/aqueduct',
      'https://wmo.int/'
    ],
    notes: 'Wet-bulb heat increases cooling and water demand stress during extreme events.'
  },
  'carbon_emission->monsoon_volatility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gml.noaa.gov/ccgg/trends/',
      'https://mausam.imd.gov.in/responsive/climate_services.php'
    ],
    notes: 'This edge captures warming-driven monsoon destabilization rather than a single deterministic trigger mechanism.'
  },
  'monsoon_volatility->industry_farming': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://mausam.imd.gov.in/responsive/climate_services.php',
      'https://www.sahf.info/'
    ],
    notes: 'Monsoon instability directly affects planting, irrigation, and crop outcomes.'
  },
  'monsoon_volatility->resource_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.wri.org/aqueduct',
      'https://www.sahf.info/'
    ],
    notes: 'Monsoon swings destabilize storage, runoff, and groundwater recharge patterns.'
  },
  'monsoon_volatility->food': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/faostat/',
      'https://www.sahf.info/'
    ],
    notes: 'Monsoon volatility is a direct pathway into food-production disruption.'
  },
  'monsoon_volatility->migration': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iom.int/',
      'https://www.sahf.info/'
    ],
    notes: 'Repeated monsoon failure or flood shocks raise displacement pressure.'
  },
  'fast_fashion->carbon_emission': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unep.org/',
      'https://www.climaterealityproject.org/'
    ],
    notes: 'Fast fashion is linked to emissions through energy-intensive manufacturing and logistics.'
  },
  'fast_fashion->resource_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unep.org/',
      'https://www.wri.org/aqueduct'
    ],
    notes: 'This edge captures textile water demand and pollution pressure.'
  },
  'fast_fashion->deforestation': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unep.org/',
      'https://www.globalforestwatch.org/'
    ],
    notes: 'This edge captures land and fiber supply-chain pressure associated with pulp, cellulosics, and expanded materials demand.'
  },
  'methane->temp': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gml.noaa.gov/ccgg/trends_ch4/',
      'https://gml.noaa.gov/aggi/aggi.html'
    ],
    notes: 'Methane remains a major short-term warming driver.'
  },
  'methane->environ_anomalies': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gml.noaa.gov/aggi/aggi.html',
      'https://www.ncei.noaa.gov/access/monitoring/monthly-report/global'
    ],
    notes: 'This edge captures methane-driven near-term warming pressure on extreme-event conditions.'
  },
  'methane->wet_bulb_heat': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gml.noaa.gov/aggi/aggi.html',
      'https://wmo.int/'
    ],
    notes: 'Methane adds to the near-term warming burden that raises humid heat exposure.'
  },
  'methane->monsoon_volatility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://gml.noaa.gov/aggi/aggi.html',
      'https://mausam.imd.gov.in/responsive/climate_services.php'
    ],
    notes: 'This edge captures rapid-warming effects on rainfall variability and heat-loaded monsoon behaviour.'
  },
  'permafrost_thaw->methane': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://wmo.int/'
    ],
    notes: 'Permafrost thaw is a well-established methane-release feedback.'
  },
  'permafrost_thaw->carbon_emission': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://gml.noaa.gov/ccgg/trends/'
    ],
    notes: 'This edge captures thaw-driven carbon release beyond methane alone.'
  },
  'permafrost_thaw->migration': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://www.iom.int/'
    ],
    notes: 'Ground failure and infrastructure instability make permafrost thaw a direct habitability and relocation stressor.'
  },
  'permafrost_thaw->resource_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://gracefo.jpl.nasa.gov/'
    ],
    notes: 'Permafrost thaw destabilizes water, soils, and built systems that underpin resource security.'
  },
  'reef_structural_collapse->coral_bleaching': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://coralreefwatch.noaa.gov/',
      'https://doi.org/10.1038/s41586-018-0194-z'
    ],
    notes: 'Reef structural decline is closely tied to recurrent thermal bleaching stress and reduced coral recovery capacity.'
  },
  'reef_structural_collapse->coral_larval_mortality': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://coralreefwatch.noaa.gov/',
      'https://doi.org/10.1038/s41586-018-0194-z'
    ],
    notes: 'Heat-stressed reef systems impair coral recruitment and larval survival, especially when bleaching and calcification stress compound.'
  },
  'reef_structural_collapse->coral_reef_fragmentation': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://coralreefwatch.noaa.gov/',
      'https://doi.org/10.1038/s41586-018-0194-z'
    ],
    notes: 'As reef framework growth fails and repeated bleaching accumulates, reef habitat becomes more fragmented and structurally unstable.'
  },
  'coastal_hypoxia->shelf_sea_hypoxia': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/',
      'https://doi.org/10.1126/science.aam7240'
    ],
    notes: 'Shelf-sea hypoxia is a coastal low-oxygen expression driven by the same warming, stratification, and nutrient-loading pressures tracked in the parent hypoxia node.'
  },
  'coastal_hypoxia->estuarine_nursery_loss': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/',
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en'
    ],
    notes: 'Low-oxygen estuarine conditions erode nursery habitat quality for juvenile fish and shellfish, weakening recruitment into nearby fisheries.'
  },
  'sea_ice_season_loss->arctic_sea_ice_thinning': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/sea-ice-today',
      'https://arctic.noaa.gov/report-card/'
    ],
    notes: 'Shorter sea-ice seasons and thinner Arctic sea ice are part of the same observed decline in ice persistence and thickness.'
  },
  'sea_ice_season_loss->sea_ice_extent_deficits': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/sea-ice-today',
      'https://arctic.noaa.gov/report-card/'
    ],
    notes: 'Extent deficits are a direct monitored expression of seasonal sea-ice loss rather than a separate speculative mechanism.'
  },
  'sea_ice_season_loss->arctic_ice_retreat': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/sea-ice-today',
      'https://arctic.noaa.gov/report-card/'
    ],
    notes: 'Arctic ice retreat is the spatial retreat pattern associated with the same observed loss of sea-ice duration and coverage.'
  },
  'ice_sheet_mass_loss->greenland_glacier_melting': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://imbie.org/publications/',
      'https://doi.org/10.5194/essd-15-1597-2023'
    ],
    notes: 'Greenland glacier melt is one of the core observed contributors inside the broader ice-sheet mass-loss record.'
  },
  'ice_sheet_mass_loss->glacier_calving_events': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://imbie.org/publications/',
      'https://doi.org/10.5194/essd-15-1597-2023'
    ],
    notes: 'Rejected as a directed edge after exact-claim review: calving is a component of ice discharge and mass loss, not a downstream event caused by the aggregate mass-loss metric. Preserve calving-to-sea-level and glacier-specific dynamics rather than reversing the ice-sheet mass budget.'
  },
  'ice_sheet_mass_loss->ice_sheet_thinning_speeds': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://imbie.org/publications/',
      'https://doi.org/10.5194/essd-15-1597-2023'
    ],
    notes: 'Thinning rates are a direct measurement surface within ice-sheet mass-balance assessment, not a separate unsupported branch.'
  },
  'ice_sheet_mass_loss->subglacial_lake_drainages': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://imbie.org/publications/',
      'https://doi.org/10.5194/essd-15-1597-2023'
    ],
    notes: 'Subglacial drainage dynamics sit within the same ice-sheet melt and basal-hydrology regime used to interpret mass-loss change.'
  },
  'ice_sheet_mass_loss->glacial_lake_outburst_floods': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://imbie.org/publications/',
      'https://doi.org/10.5194/essd-15-1597-2023'
    ],
    notes: 'Mass loss and retreat increase the conditions under which glacial lakes expand and outburst-flood risk rises.'
  },
  'ice_sheet_mass_loss->nunatak_habitat_shrinkage': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/srocc/chapter/chapter-3-2/',
      'https://imbie.org/publications/'
    ],
    notes: 'As surrounding ice fields thin and retreat, isolated nunatak habitats face compression, exposure shifts, and ecological squeeze.'
  },
  'wet_bulb_heat->grid_peak_load_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    notes: 'Dangerous humid heat drives cooling-demand spikes that can push already stressed grids toward reliability limits.'
  },
  'grid_peak_load_stress->critical_infrastructure_fragility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf',
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b'
    ],
    notes: 'Peak-load failures propagate into wider infrastructure fragility when power loss degrades transport, communications, water, and emergency response.'
  },
  'grid_peak_load_stress->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    notes: 'When peak demand drives outages during extreme heat, clinics, cooling access, and heat survival all worsen together.'
  },
  'semiconductor_fabs->cooling_water_competition': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://hero.epa.gov/reference/4525447/',
      'https://www.nist.gov/chips/implementation-strategies/national-environmental-policy-act-nepa-and-chips-act'
    ],
    notes: 'Advanced fabrication requires substantial ultrapure process water and facility cooling. Competition is only asserted where fab withdrawals are material relative to the same basin and period; national semiconductor output is not treated as local water stress.'
  },
  'cooling_water_competition->resource_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.energy.gov/sites/prod/files/2014/07/f17/Water%20Energy%20Nexus%20Full%20Report%20July%202014.pdf',
      'https://www.wri.org/aqueduct'
    ],
    notes: 'Cooling demand accelerates basin stress by drawing scarce freshwater into energy and industrial uses that compete with households, farming, and ecosystems.'
  },
  'cooling_water_competition->critical_infrastructure_fragility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.energy.gov/sites/prod/files/2014/07/f17/Water%20Energy%20Nexus%20Full%20Report%20July%202014.pdf',
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b'
    ],
    notes: 'Water competition can become an infrastructure risk when cooling-dependent facilities lose reliable water or intensify conflict over shared systems.'
  },
  'insurance_retreat->mortgage_market_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://home.treasury.gov/system/files/311/Final%20FIO%202025%20Annual%20Report.pdf',
      'https://www.fhfa.gov/blog/statistics/the-need-to-address-climate-risk'
    ],
    notes: 'As insurance becomes costlier or unavailable, mortgage underwriting, refinancing, and property-value assumptions become more fragile.'
  },
  'insurance_retreat->coastal_property_insurance_redlines': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://home.treasury.gov/system/files/311/Final%20FIO%202025%20Annual%20Report.pdf',
      'https://home.treasury.gov/news/press-releases/jy2791'
    ],
    notes: 'Insurance retreat often becomes operationally visible through nonrenewals, pricing, or coverage pullback concentrated in exposed coastal property markets.'
  },
  'coastal_property_insurance_redlines->mortgage_market_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://home.treasury.gov/system/files/311/Final%20FIO%202025%20Annual%20Report.pdf',
      'https://www.fhfa.gov/blog/statistics/the-need-to-address-climate-risk'
    ],
    notes: 'When coverage redlines emerge in exposed housing markets, they feed directly into mortgage qualification, refinancing, and property-valuation risk.'
  },
  'mortgage_market_exposure->relocation_governance_capacity': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fhfa.gov/blog/insights/an-overview-of-fhfas-key-initiatives-to-address-climate-related-financial-risks',
      'https://environmentalmigration.iom.int/planned-relocation'
    ],
    notes: 'Mortgage stress and stranded-property risk can turn climate exposure into a managed-retreat and relocation-governance problem for households and local governments.'
  },
  'crop_yield_volatility->food_import_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/',
      'https://www.fao.org/3/CA2370EN/ca2370en.pdf'
    ],
    notes: 'Climate-driven yield swings increase the vulnerability of import-dependent regions by tightening supply and raising price shocks.'
  },
  'food_import_exposure->migration': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/3/CA2370EN/ca2370en.pdf',
      'https://www.iom.int/'
    ],
    notes: 'When imported food becomes scarce or unaffordable, migration pressure rises through household stress, instability, and declining habitability.'
  },
  'food_import_exposure->critical_infrastructure_fragility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/3/CA2370EN/ca2370en.pdf',
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b'
    ],
    notes: 'Food import dependence amplifies infrastructure fragility when ports, cold chains, logistics, and public services absorb repeated supply shocks.'
  },
  'food_import_exposure->cold_chain_failure_risk': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/3/CA2370EN/ca2370en.pdf',
      'https://www.fao.org/3/I9542EN/i9542en.pdf'
    ],
    notes: 'Import-dependent food systems become especially fragile when refrigeration, warehousing, and transit delays interrupt temperature-sensitive supply chains.'
  },
  'food_import_exposure->humanitarian_resource_gaps': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/3/CA2370EN/ca2370en.pdf',
      'https://www.iom.int/'
    ],
    notes: 'Import dependence can turn supply and price shocks into humanitarian shortfalls when local buffers, aid systems, and household purchasing power are weak.'
  },
  'food_import_exposure->disaster_recovery_inequality': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/3/CA2370EN/ca2370en.pdf',
      'https://www.gao.gov/assets/720/718175.pdf'
    ],
    notes: 'Food import shocks are absorbed unevenly, widening recovery gaps between households and regions with very different fiscal and supply-chain buffers.'
  },
  'soil_moisture_collapse->crop_yield_volatility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://smap.jpl.nasa.gov/data/',
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/'
    ],
    notes: 'Persistent soil moisture loss is a direct pathway into yield instability because crops lose root-zone water even before visible drought declarations catch up.'
  },
  'drought_persistence->soil_moisture_collapse': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://drought.emergency.copernicus.eu/',
      'https://smap.jpl.nasa.gov/data/'
    ],
    notes: 'Long-lived drought deepens and extends soil moisture collapse by preventing seasonal recovery in the root zone and shallow storage.'
  },
  'freshwater_ecosystem_collapse->food_import_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/',
      'https://www.fao.org/3/CA2370EN/ca2370en.pdf'
    ],
    notes: 'Freshwater ecosystem decline undermines inland fisheries, water reliability, and local production, increasing dependence on imported food and external supply chains.'
  },
  'critical_infrastructure_fragility->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    notes: 'Health burdens rise quickly when fragile infrastructure interrupts cooling, transport, water access, and clinical operations during heat stress.'
  },
  'critical_infrastructure_fragility->early_warning_coverage_gaps': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b',
      'https://wmo.int/early-warnings-all'
    ],
    notes: 'Infrastructure fragility often shows up operationally through warning-system blind spots, communications failure, and degraded last-mile alert coverage.'
  },
  'critical_infrastructure_fragility->extreme_weather_infrastructure_costs': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b',
      'https://www.gao.gov/products/gao-24-106965'
    ],
    notes: 'Once infrastructure is fragile, repeated hazard exposure turns quickly into escalating maintenance, repair, and replacement costs.'
  },
  'adaptation_capital_shortfall->early_warning_coverage_gaps': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unep.org/resources/adaptation-gap-report-2025',
      'https://wmo.int/early-warnings-all'
    ],
    notes: 'Adaptation finance gaps often show up operationally as incomplete early-warning coverage, weaker hazard communication, and underbuilt preparedness systems.'
  },
  'adaptation_capital_shortfall->cold_chain_failure_risk': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unep.org/resources/adaptation-gap-report-2025',
      'https://www.fao.org/3/CA2370EN/ca2370en.pdf'
    ],
    notes: 'Where adaptation investment lags, food and medicine cold chains are less able to absorb heat, outage, and logistics stress.'
  },
  'migration->relocation_governance_capacity': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iom.int/',
      'https://documents1.worldbank.org/curated/en/540941631203608570/pdf/Overview.pdf'
    ],
    notes: 'Migration pressure becomes an institutional issue when governments must plan housing, services, land access, and legal pathways for relocation.'
  },
  'migration->disaster_recovery_inequality': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iom.int/',
      'https://www.gao.gov/assets/720/718175.pdf'
    ],
    notes: 'Displacement can widen recovery inequality when receiving regions and low-income households face very different capacity to absorb shocks and rebuild.'
  },
  'migration->managed_retreat_pressure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://environmentalmigration.iom.int/planned-relocation',
      'https://documents1.worldbank.org/curated/en/540941631203608570/pdf/Overview.pdf'
    ],
    notes: 'Persistent migration from exposed places can evolve into managed-retreat pressure once informal movement outpaces local adaptation capacity.'
  },
  'public_health_heat_burden->disaster_recovery_inequality': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
      'https://www.gao.gov/assets/gao-22-104452.pdf'
    ],
    notes: 'Heat illness and medical disruption compound recovery inequality because vulnerable households and under-resourced systems recover more slowly from the same event.'
  },
  'public_health_heat_burden->relocation_governance_capacity': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
      'https://environmentalmigration.iom.int/planned-relocation'
    ],
    notes: 'Severe recurring health burdens can push places toward relocation planning when clinics, cooling access, and household survival become too hard to stabilize locally.'
  },
  'disaster_recovery_inequality->relocation_governance_capacity': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.gao.gov/assets/720/718175.pdf',
      'https://environmentalmigration.iom.int/planned-relocation'
    ],
    notes: 'Unequal recovery can force relocation decisions onto communities that cannot rebuild in place, turning a funding gap into a governance challenge.'
  },
  'relocation_governance_capacity->managed_retreat_pressure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://environmentalmigration.iom.int/planned-relocation',
      'https://documents1.worldbank.org/curated/en/540941631203608570/pdf/Overview.pdf'
    ],
    notes: 'When local institutions cannot absorb repeated movement safely, relocation governance stress becomes direct managed-retreat pressure.'
  },
  'aerosol_cooling_loss->aerosol_scattering_index': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/'
    ],
    notes: 'Loss of aerosol masking is directly expressed through changing scattering conditions, making aerosol scattering a defensible neighboring indicator for cooling-loss dynamics.'
  },
  'aerosol_cooling_loss->secondary_organic_aerosol_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/',
      'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics'
    ],
    notes: 'Secondary organic aerosols contribute to the broader fine-particle burden that shapes aerosol masking and atmospheric chemistry.'
  },
  'aerosol_cooling_loss->particulate_soot_levels': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/',
      'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics'
    ],
    notes: 'Soot and black-carbon levels sit next to aerosol cooling loss because they alter particle forcing, atmospheric heating, and air-pollution load.'
  },
  'aerosol_cooling_loss->pm2_5_particulates': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/'
    ],
    notes: 'Fine-particle concentrations are a grounded neighboring metric for aerosol-system stress because many masking aerosols and co-pollutants manifest as PM2.5 burden.'
  },
  'particulate_soot_levels->thermal_inversion_events': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics',
      'https://www.noaa.gov/jetstream/atmosphere/temperature-inversions'
    ],
    notes: 'Thermal inversions trap soot and fine particles near the surface, turning elevated particulate loading into more severe local exposure events.'
  },
  'temp->flash_flood_regime': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.weather.gov/pub/pnsfloodsafety',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
    ],
    notes: 'A warmer atmosphere can intensify short-duration rainfall extremes, making temperature a defensible upstream driver of flash-flood regime change.'
  },
  'temp->humidity_amplification': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://power.larc.nasa.gov/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
    ],
    notes: 'As air warms it can hold more water vapor, so rising temperature is a direct upstream driver of humidity amplification and compound heat stress.'
  },
  'temp->lightning_fire_weather': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://firms.modaps.eosdis.nasa.gov/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
      'https://www.nature.com/articles/s41467-022-34966-3'
    ],
    relationship_type: 'indirect_mechanism',
    confidence: 'medium',
    notes: 'Hotter, drier, more unstable conditions can raise ignition-prone fire weather and help align lightning with receptive fuels.'
  },
  'temp->atmospheric_dryness': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://power.larc.nasa.gov/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
    ],
    notes: 'Warming increases evaporative demand and can deepen atmospheric dryness even before rainfall deficits fully emerge at the surface.'
  },
  'temp->smoke_exposure_burden': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.airnow.gov/wildfire-smoke-and-air-quality-resources/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
      'https://www.who.int/health-topics/wildfires'
    ],
    relationship_type: 'indirect_mechanism',
    confidence: 'medium',
    notes: 'Higher temperatures can intensify wildfire conditions and extend smoke seasons, increasing the burden of smoke exposure.'
  },
  'temp->ozone_formation_pressure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/'
    ],
    notes: 'Heat and strong sunlight help accelerate the photochemical reactions that produce ground-level ozone, making temperature a direct upstream pressure.'
  },
  'ozone_formation_pressure->tropospheric_ozone': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics',
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health'
    ],
    notes: 'Ozone-formation pressure becomes visible in the atmosphere through elevated tropospheric ozone, making this a direct local pathway rather than a generic generated seed.'
  },
  'ozone_formation_pressure->ground_level_ozone_triggers': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics',
      'https://www.airnow.gov/'
    ],
    notes: 'Ground-level ozone triggers are the practical precursor conditions and pollution mix through which ozone-formation pressure manifests on the ground.'
  },
  'humidity_amplification->wet_bulb_heat': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
      'https://repository.library.noaa.gov/view/noaa/59273/noaa_59273_DS1.pdf'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Higher humidity directly limits evaporative cooling, increasing wet-bulb heat stress at a given air temperature.'
  },
  'humidity_amplification->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
      'https://www.epa.gov/climatechange-science/extreme-heat'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Humid heat impedes sweating and heat loss, directly increasing heat illness and compounding cardiovascular, respiratory, and kidney risks.'
  },
  'humidity_amplification->flash_flood_regime': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
      'https://www.weather.gov/pub/pnsfloodsafety'
    ],
    relationship_type: 'indirect_mechanism',
    confidence: 'medium',
    notes: 'Greater atmospheric moisture can intensify short-duration rainfall, but flash flooding also depends on storm dynamics, terrain, drainage, and antecedent conditions.'
  },
  'atmospheric_dryness->crop_yield_volatility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nature.com/articles/s41467-024-51305-w',
      'https://www.nature.com/articles/ngeo2903'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'High vapor-pressure deficit increases plant water stress and suppresses productivity, increasing the risk of volatile crop outcomes.'
  },
  'atmospheric_dryness->lightning_fire_weather': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.nature.com/articles/s41467-022-34966-3',
      'https://repository.library.noaa.gov/view/noaa/25658/noaa_25658_DS1.pdf'
    ],
    relationship_type: 'indirect_mechanism',
    confidence: 'medium',
    notes: 'Atmospheric evaporative demand dries live and dead fuels, increasing the chance that a lightning ignition becomes a spreading fire; it does not itself create lightning.'
  },
  'lightning_fire_weather->smoke_exposure_burden': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://repository.library.noaa.gov/view/noaa/25658/noaa_25658_DS1.pdf',
      'https://www.who.int/health-topics/wildfires'
    ],
    relationship_type: 'operational_chain',
    confidence: 'medium',
    notes: 'Dry-lightning ignitions can produce wildfire smoke exposure when receptive fuels burn; suppression, fuel continuity, and wind determine the realized burden.'
  },
  'pm2_5_particulates->smoke_exposure_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/health-topics/wildfires',
      'https://www.epa.gov/wildfire-smoke-course/health-effects-attributed-wildfire-smoke-0'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Fine particulate matter is the principal public-health hazard in wildfire smoke and directly determines much of the exposure burden.'
  },
  'black_carbon_deposition->soot_deposition_on_snow': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://ntrs.nasa.gov/citations/20120003525',
      'https://www.giss.nasa.gov/research/news/20031222/'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Black carbon deposited onto snow and ice darkens the surface and lowers its reflectivity.'
  },
  'particulate_soot_levels->soot_deposition_on_snow': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.giss.nasa.gov/pubs/abs/do02100q.html',
      'https://ntrs.nasa.gov/citations/20130006712'
    ],
    relationship_type: 'transport_and_deposition',
    confidence: 'medium',
    notes: 'Atmospheric soot provides the material available for transport and deposition onto snow, while the realized deposition pattern depends on circulation and precipitation.'
  },
  'tropospheric_ozone->crop_yield_volatility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics',
      'https://www.epa.gov/sites/production/files/2015-10/documents/20151001ozone_agriculture.pdf'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Ground-level ozone damages sensitive vegetation during the growing season and can reduce yields for important crops.'
  },
  'tropospheric_ozone->urban_smog_health_expenses': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.epa.gov/ozone-pollution-and-your-patients-health/health-effects-ozone-general-population',
      'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics'
    ],
    relationship_type: 'operational_consequence',
    confidence: 'medium',
    notes: 'Ozone causes respiratory symptoms, reduced lung function, airway inflammation, and measurable mortality risk; healthcare spending is the downstream operational consequence.'
  },
  'temp->compound_day_night_heat_extremes': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
      'https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2023EF004406'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Anthropogenic warming shifts daytime maxima and nighttime minima upward, increasing compound day-night heat extremes.'
  },
  'compound_day_night_heat_extremes->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nature.com/articles/s43856-024-00557-0',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Sustained heat across both day and night prevents physiological recovery and produces a larger health burden than daytime-only heat in observed studies.'
  },
  'compound_day_night_heat_extremes->heatwave_excess_mortality_rates': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nature.com/articles/s43856-024-00557-0',
      'https://www.nature.com/articles/s41467-025-62871-y'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Compound daytime-nighttime heat is associated with higher excess mortality than heat confined to one part of the daily cycle.'
  },
  'temp->nocturnal_heat_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2023EF004406',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Anthropogenic warming has increased nighttime heat stress risk by raising minimum temperatures and humid-heat exposure.'
  },
  'nocturnal_heat_stress->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://ehp.niehs.nih.gov/doi/10.1289/EHP11444',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Hot nights prevent overnight recovery and increase acute heat-health risk beyond what daily mean temperature alone captures.'
  },
  'nocturnal_heat_stress->heatwave_excess_mortality_rates': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nature.com/articles/s43856-024-00557-0',
      'https://ehp.niehs.nih.gov/doi/10.1289/EHP11444',
      'https://www.sciencedirect.com/science/article/pii/S2542519622001395'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Epidemiological and modelling studies find an independent mortality contribution from hot nights and project a growing burden under warming.'
  },
  'blocking_pattern_persistence->drought_persistence': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nature.com/articles/s41467-026-70487-z',
      'https://www.nature.com/articles/s41598-023-48861-4'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Persistent blocking suppresses storm passage and precipitation beneath the block, sustaining regional drought conditions.'
  },
  'blocking_pattern_persistence->compound_day_night_heat_extremes': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nature.com/articles/s41612-022-00290-2',
      'https://www.nature.com/articles/s41467-026-70487-z'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Persistent anticyclonic blocking can prolong surface heat and suppress nighttime relief, strengthening compound heat episodes.'
  },
  'rossby_wave_stalling->blocking_pattern_persistence': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nature.com/articles/s41467-026-70487-z',
      'https://doi.org/10.1029/2022JD038380'
    ],
    relationship_type: 'dynamical_mechanism',
    confidence: 'medium',
    notes: 'Slowly propagating or breaking Rossby-wave packets can support persistent blocking, but the relationship depends on wave geometry and background flow.'
  },
  'temp->low_cloud_deck_retreat': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
      'https://repository.library.noaa.gov/view/noaa/31044'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Surface warming changes marine low-cloud controlling factors and is assessed to produce a positive subtropical low-cloud feedback.'
  },
  'low_cloud_deck_retreat->temp': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
      'https://www.nature.com/articles/s41558-021-01039-0'
    ],
    relationship_type: 'feedback',
    confidence: 'high',
    notes: 'Reduced marine low-cloud cover reflects less sunlight and amplifies warming; IPCC assesses the subtropical marine low-cloud feedback as positive with high confidence.'
  },
  'soot_deposition_on_snow->snowmelt_timing_shift': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/snow-today/about-snow-today',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
    ],
    notes: 'Darkening snow with black carbon lowers reflectivity and can accelerate earlier melt, making this a defensible local cryosphere pathway.'
  },
  'snowmelt_timing_shift->hydrological_runoff_surges': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://global-flood.emergency.copernicus.eu/react/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/'
    ],
    notes: 'Earlier or faster snowmelt can shift runoff timing and intensify melt-season flow pulses, especially where storage is limited.'
  },
  'hydrological_runoff_surges->bridge_scour_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://global-flood.emergency.copernicus.eu/react/',
      'https://infobridge.fhwa.dot.gov/data'
    ],
    notes: 'Runoff surges can increase high-flow scour around bridge foundations, making bridge-scour exposure a grounded downstream infrastructure risk.'
  },
  'permafrost_thaw->thermokarst_expansion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://data.gtn-p.org/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
    ],
    notes: 'Thermokarst expansion is a direct landscape expression of thawing ice-rich permafrost and collapsing ground structure.'
  },
  'temp->snow_drought': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/snow-today/about-snow-today',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/'
    ],
    notes: 'Warming shifts precipitation phase and accelerates snow loss, making higher temperature a defensible upstream driver of snow-drought risk.'
  },
  'ice_sheet_mass_loss->firn_layer_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://imbie.org/publications/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
    ],
    notes: 'Firn storage loss is part of the broader land-ice mass-balance problem because reduced meltwater retention speeds runoff from ice-sheet surfaces.'
  },
  'temp->firn_layer_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://imbie.org/publications/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
    ],
    notes: 'Warmer surface conditions promote firn densification, ice-layer formation, and lower meltwater storage capacity on ice sheets.'
  },
  'glacier_calving_events->glacial_lake_failure_risk': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://rds.icimod.org/metadata/8881454b-6f7c-461b-95c2-eaf7618230d9',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
    ],
    notes: 'Retreating and destabilizing glacier systems help expand and reconfigure glacial lakes, raising the likelihood of outburst-flood hazards downstream.'
  },
  'sea_level_rise->freshwater_lens_compression': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers',
      'https://sealevel.nasa.gov/'
    ],
    notes: 'Rising sea level can thin and salinize shallow freshwater lenses on small islands by increasing saltwater intrusion pressure from below and the coast.'
  },
  'aquifer_overdraft->freshwater_lens_compression': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/groundwater-depletion',
      'https://www.fao.org/aquastat/en/'
    ],
    notes: 'Overpumping lowers freshwater heads and makes small-island lenses more vulnerable to saltwater intrusion and usable-storage loss.'
  },
  'sea_ice_season_loss->arctic_shipping_expansion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/sea-ice-today',
      'https://pame.is/ourwork/arctic-shipping/current-shipping-projects/astd/'
    ],
    notes: 'Shorter sea-ice seasons open longer navigable periods across northern routes, making sea-ice loss a direct upstream driver of Arctic shipping expansion.'
  },
  'road_freight_diesel_lock_in->freight_electrification_gap': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/global-ev-outlook-2025',
      'https://theicct.org/heavy-duty-vehicles/'
    ],
    notes: 'Persistent diesel truck dependence is the practical expression of a freight electrification gap, so this is a grounded local transition bottleneck.'
  },
  'temp->airport_climate_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.faa.gov/data',
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-16/'
    ],
    notes: 'Higher temperatures can reduce takeoff performance and amplify runway and operations stress, making warming a defensible upstream pressure on airport climate exposure.'
  },
  'ocean_salinity_stratification->ocean_current_regime_shift': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://argo.ucsd.edu/',
      'https://www.ncei.noaa.gov/products/world-ocean-database'
    ],
    notes: 'Changing salinity structure alters density gradients and circulation behavior, making stratification a defensible neighboring driver of broader circulation-regime shifts.'
  },
  'ocean_current_regime_shift->pelagic_species_redistribution': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://argo.ucsd.edu/',
      'https://www.fisheries.noaa.gov/'
    ],
    notes: 'Shifts in large-scale circulation reorganize habitat, temperature exposure, and prey fields, which can redistribute pelagic species across basins and margins.'
  },
  'pelagic_species_redistribution->marine_food_web_simplification': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fisheries.noaa.gov/',
      'https://www.ncei.noaa.gov/products/world-ocean-database'
    ],
    notes: 'Redistributed pelagic species can reorganize trophic relationships and access to prey, making food-web reorganization a defensible downstream effect.'
  },
  'ocean_salinity_stratification->marine_food_web_simplification': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://argo.ucsd.edu/',
      'https://www.ncei.noaa.gov/products/world-ocean-database'
    ],
    notes: 'Salinity-driven stratification can reshape vertical mixing and nutrient availability, which in turn changes marine productivity and food-web structure.'
  },
  'coastal_inundation_risk->littoral_surge_vulnerability': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://coast.noaa.gov/floodexposure/',
      'https://oceanservice.noaa.gov/facts/sealevel.html'
    ],
    notes: 'Higher baseline coastal water levels increase the area and assets exposed to surge, making coastal inundation risk a direct upstream driver of storm-surge exposure.'
  },
  'biodiversity_intactness_loss->species_range_compression': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nhm.ac.uk/our-science/services/data/biodiversity-intactness-index.html',
      'https://www.iucnredlist.org/'
    ],
    notes: 'As ecosystems lose intactness and habitat quality, more species experience contraction of viable range and occupancy.'
  },
  'biodiversity_intactness_loss->freshwater_ecosystem_collapse': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nhm.ac.uk/our-science/services/data/biodiversity-intactness-index.html',
      'https://wedocs.unep.org/bitstream/handle/20.500.11822/36691/PFE6.6.1.pdf'
    ],
    notes: 'Loss of ecological intactness can propagate into river, lake, and wetland decline where habitat simplification and land-pressure erode freshwater ecosystem function.'
  },
  'reservoir_storage_instability->reservoir_operating_shortfall': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usbr.gov/',
      'https://www.iea.org/reports/hydropower-special-market-report'
    ],
    notes: 'Reservoir-storage instability becomes operationally visible when managers can no longer count on expected usable storage, release timing, or generation support.'
  },
  'rain_on_snow_flood_risk->reservoir_operating_shortfall': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/special-topics/water-science-school/science/rain-snow-events',
      'https://www.usbr.gov/'
    ],
    notes: 'Rain-on-snow events can force abrupt runoff and release-management stress that make reservoir operations harder to stabilize.'
  },
  'river_flow_regime_shift->reservoir_storage_instability': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://wmo.int/publication-series/state-of-global-water-resources-2024',
      'https://www.usbr.gov/'
    ],
    notes: 'Changed river timing and volume destabilize reservoir storage because operating assumptions depend on historically reliable inflow patterns.'
  },
  'reservoir_operating_shortfall->hydropower_reliability_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/hydropower-special-market-report',
      'https://www.energy.gov/water-power-technologies-office/hydropower-basics'
    ],
    notes: 'Operating shortfalls are a direct pathway into hydropower reliability decline because constrained storage and release flexibility reduce dependable generation.'
  },
  'peak_glacier_runoff_passage->glacier_meltwater_dependency': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unesco.org/reports/wwdr/en/2025',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
    ],
    notes: 'Crossing peak glacier runoff changes the reliability of glacier-fed systems by turning short-term meltwater abundance into long-term decline risk.'
  },
  'flash_flood_regime->wastewater_infrastructure_overflow': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.weather.gov/pub/pnsfloodsafety',
      'https://www.epa.gov/npdes/combined-sewer-overflows-csos'
    ],
    notes: 'Short-duration flood pulses can exceed sewer and treatment capacity, making flash-flood regime change a grounded upstream driver of overflow risk.'
  },
  'coastal_inundation_risk->wastewater_infrastructure_overflow': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/sealevel.html',
      'https://www.epa.gov/waterutilityresponse/water-sector-climate-resilience-evaluation-and-awareness-tool-creat'
    ],
    notes: 'Higher baseline coastal water levels can impair drainage and push wastewater systems toward backup and overflow during storms or high tides.'
  },
  'wastewater_infrastructure_overflow->wastewater_bypass_discharge': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/npdes/combined-sewer-overflows-csos',
      'https://www.epa.gov/cwsrf'
    ],
    notes: 'Overflow conditions often manifest operationally as bypass or emergency discharge events when plants and sewers exceed safe handling limits.'
  },
  'wastewater_infrastructure_overflow->combined_sewer_overflow': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/npdes/combined-sewer-overflows-csos',
      'https://www.epa.gov/cwsrf'
    ],
    relationship_type: 'operational_chain',
    confidence: 'high',
    notes: 'When a combined sewer system exceeds hydraulic capacity during storms, wastewater infrastructure overflow is realized as a combined sewer overflow discharge event.'
  },
  'wastewater_bypass_discharge->drinking_water_treatment_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/crwu',
      'https://www.epa.gov/npdes/combined-sewer-overflows-csos'
    ],
    notes: 'Bypass discharge can raise contaminant and turbidity loads in receiving waters, increasing treatment difficulty and cost for downstream utilities.'
  },
  'marine_heatwaves->marine_pathogen_range_expansion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fisheries.noaa.gov/',
      'https://www.who.int/news-room/fact-sheets/detail/vector-borne-diseases'
    ],
    notes: 'Warmer coastal waters can expand the range and seasonality of marine pathogens, especially where heat stress alters ecological controls and exposure windows.'
  },
  'temp->thermal_stratification_intensification': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      'https://www.ncei.noaa.gov/products/world-ocean-database'
    ],
    notes: 'Upper-ocean warming strengthens density stratification and can reduce vertical mixing, especially in coastal and shelf systems already sensitive to ventilation loss.'
  },
  'thermal_stratification_intensification->coastal_hypoxia': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.science.org/doi/10.1126/science.aam7240',
      'https://oceanservice.noaa.gov/facts/hypoxia.html'
    ],
    notes: 'Stronger stratification limits oxygen renewal from surface waters and is a well-established contributor to hypoxia risk in nutrient-loaded coastal waters.'
  },
  'thermal_stratification_intensification->shelf_sea_hypoxia': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/',
      'https://doi.org/10.1126/science.aam7240'
    ],
    notes: 'Shelf waters are especially vulnerable to low-oxygen development when stronger stratification suppresses ventilation and keeps oxygen demand concentrated below the mixed layer.'
  },
  'thermal_stratification_intensification->estuarine_nursery_loss': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/',
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en'
    ],
    notes: 'Layered warm estuarine waters can worsen oxygen stress and habitat quality for juvenile fish and shellfish, narrowing nursery resilience.'
  },
  'ocean_current_regime_shift->oceanic_upwelling_disruptions': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ncei.noaa.gov/products/world-ocean-database',
      'https://www.ipcc.ch/srocc/chapter/chapter-5/'
    ],
    notes: 'Changes in coastal and basin-scale circulation are a defensible upstream driver of altered upwelling timing, strength, and nutrient delivery.'
  },
  'oceanic_upwelling_disruptions->phytoplankton_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fisheries.noaa.gov/',
      'https://www.ipcc.ch/srocc/chapter/chapter-5/'
    ],
    notes: 'When upwelling weakens or shifts out of season, nutrient supply to productive surface waters can fall, reducing phytoplankton productivity at the base of the food web.'
  },
  'oceanic_upwelling_disruptions->fish_landing_supply_disruption': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en',
      'https://www.ipcc.ch/srocc/chapter/chapter-5/'
    ],
    notes: 'Many fisheries depend on predictable upwelling-supported productivity, so disrupted upwelling can quickly reduce catch reliability and landing stability.'
  },
  'coastal_inundation_risk->delta_salt_intrusion_fronts': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/sealevel.html',
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers'
    ],
    notes: 'Higher coastal water levels allow saline water to penetrate farther inland through estuaries, deltas, and connected coastal aquifers, especially during low-flow periods.'
  },
  'coastal_inundation_risk->coastal_aquifer_degradation': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/sealevel.html',
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers'
    ],
    notes: 'Repeated coastal flooding and higher saline water tables can degrade connected coastal groundwater, especially where aquifers are shallow and hydraulically exposed.'
  },
  'river_flow_regime_shift->delta_salt_intrusion_fronts': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://wmo.int/publication-series/state-of-global-water-resources-2024',
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers'
    ],
    notes: 'When river discharge weakens or shifts seasonally, freshwater resistance to estuarine salinity intrusion drops and inland salt fronts can move farther upstream.'
  },
  'drought_persistence->delta_salt_intrusion_fronts': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://drought.emergency.copernicus.eu/',
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers'
    ],
    notes: 'Prolonged drought reduces river flow and estuarine flushing, allowing saline fronts to penetrate farther inland and persist longer.'
  },
  'delta_salt_intrusion_fronts->drinking_water_treatment_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers',
      'https://www.epa.gov/crwu'
    ],
    notes: 'Salt intrusion can threaten freshwater intakes and raise treatment difficulty, forcing utilities to manage salinity spikes, blending limits, and intake shifts.'
  },
  'delta_salt_intrusion_fronts->freshwater_lens_compression': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers',
      'https://www.unesco.org/en/ihp'
    ],
    notes: 'Advancing saline fronts and tidal pressure can intensify intrusion into shallow coastal freshwater bodies, thinning already vulnerable freshwater lenses.'
  },
  'delta_salt_intrusion_fronts->coastal_aquifer_degradation': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers',
      'https://www.wri.org/aqueduct'
    ],
    notes: 'Salt-front migration is a practical pathway into coastal aquifer degradation because it increases salinization pressure in connected estuarine and delta groundwater systems.'
  },
  'coastal_inundation_risk->drinking_water_treatment_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/sealevel.html',
      'https://www.epa.gov/crwu'
    ],
    notes: 'Coastal flooding and saline inundation can degrade raw-water quality, impair intake operations, and raise treatment stress for exposed drinking-water systems.'
  },
  'flash_flood_regime->drinking_water_treatment_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.weather.gov/pub/pnsfloodsafety',
      'https://www.epa.gov/crwu'
    ],
    notes: 'Flash-flood-driven sediment, contamination, and intake disruption can quickly raise drinking-water treatment stress for exposed utilities.'
  },
  'drought_persistence->drinking_water_treatment_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://drought.emergency.copernicus.eu/',
      'https://www.epa.gov/crwu'
    ],
    notes: 'Persistent drought concentrates contaminants and reduces source-water quality and volume, increasing the burden on drinking-water treatment systems.'
  },
  'wastewater_bypass_discharge->harmful_algal_blooms': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/cyanohabs',
      'https://www.epa.gov/npdes/combined-sewer-overflows-csos'
    ],
    notes: 'Nutrient-rich bypass discharge can help trigger harmful algal blooms where warm temperatures, low flushing, and bloom-prone waters already exist.'
  },
  'wastewater_bypass_discharge->coastal_hypoxia': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/hypoxia.html',
      'https://www.epa.gov/npdes/combined-sewer-overflows-csos'
    ],
    notes: 'Organic and nutrient loads from untreated or partially treated wastewater can increase oxygen demand and contribute to estuarine and nearshore hypoxia.'
  },
  'freshwater_lens_compression->drinking_water_treatment_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers',
      'https://www.epa.gov/crwu'
    ],
    notes: 'Thinning and salinization of shallow freshwater lenses directly increase treatment difficulty and potable-water stress for small-island systems.'
  },
  'coastal_aquifer_degradation->drinking_water_treatment_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers',
      'https://www.epa.gov/crwu'
    ],
    notes: 'As coastal groundwater becomes more saline or degraded, utilities and users lose raw-water flexibility and face higher treatment and substitution burdens.'
  },
  'freshwater_lens_compression->desalination_dependence': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers',
      'https://www.unesco.org/en/ihp'
    ],
    notes: 'When thin freshwater lenses can no longer supply reliable potable water, communities often become more dependent on desalination or imported water.'
  },
  'coastal_aquifer_degradation->desalination_dependence': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers',
      'https://documents1.worldbank.org/curated/en/476041552622967264/pdf/135312-WP-PUBLIC-14-3-2019-12-3-35-W.pdf'
    ],
    notes: 'As coastal aquifers become more saline and less usable, utilities and households can be pushed toward greater desalination reliance.'
  },
  'drinking_water_treatment_stress->desalination_dependence': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/crwu',
      'https://documents1.worldbank.org/curated/en/476041552622967264/pdf/135312-WP-PUBLIC-14-3-2019-12-3-35-W.pdf'
    ],
    notes: 'Persistent treatment stress from salinity and source-water degradation can harden into a shift toward desalination where utilities need a more salt-tolerant supply option.'
  },
  'desalination_dependence->brine_discharge_siltation': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://documents1.worldbank.org/curated/en/476041552622967264/pdf/135312-WP-PUBLIC-14-3-2019-12-3-35-W.pdf',
      'https://doi.org/10.1016/j.scitotenv.2018.12.076'
    ],
    notes: 'More desalination can increase concentrated brine discharge burdens in enclosed or weakly flushed coastal waters, raising localized disposal and water-quality stress.'
  },
  'thermokarst_expansion->polar_infrastructure_failure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://data.gtn-p.org/',
      'https://www.usgs.gov/mission-areas/climate-research-and-development/science/permafrost'
    ],
    notes: 'Thermokarst-driven subsidence and ponding are a direct operational hazard for roads, pads, pipelines, and foundations in thawing high-latitude terrain.'
  },
  'polar_infrastructure_failure->critical_infrastructure_fragility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/climate-research-and-development/science/permafrost',
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/'
    ],
    notes: 'Failures in remote polar assets, transport links, and utility structures are a concrete local form of broader infrastructure fragility.'
  },
  'grid_peak_load_stress->energy_affordability_crisis': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf',
      'https://www.eia.gov/electricity/monthly/'
    ],
    notes: 'Peak-load stress raises the likelihood of expensive emergency generation, price spikes, and service pressure that show up directly in household energy affordability.'
  },
  'energy_affordability_crisis->utility_disconnection_risk': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.energy.gov/scep/low-income-energy-affordability-data-lead-tool-and-community-energy-solutions',
      'https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap'
    ],
    notes: 'Energy affordability becomes a direct service-risk problem when unpaid bills, arrears, or weak protections expose households to shutoff.'
  },
  'utility_disconnection_risk->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
      'https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap'
    ],
    notes: 'Loss of electricity or cooling access turns heat from an exposure problem into a direct medical and household survival risk.'
  },
  'wastewater_infrastructure_overflow->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/npdes/combined-sewer-overflows-csos',
      'https://www.who.int/health-topics/climate-change'
    ],
    notes: 'Wastewater overflow can amplify heat-health burden when sanitation failures, exposure, and service disruption compound during extreme-weather periods.'
  },
  'temp->urban_tree_canopy_loss': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fs.usda.gov/managing-land/urban-forests/ucf',
      'https://www.epa.gov/heatislands'
    ],
    notes: 'Urban tree canopy can decline under rising heat, drought stress, and compounding urban pressures, especially where maintenance and water access lag.'
  },
  'urban_tree_canopy_loss->nocturnal_heat_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/heatislands',
      'https://www.fs.usda.gov/managing-land/urban-forests/ucf'
    ],
    notes: 'Losing tree canopy reduces shade and nighttime cooling, making warm nights and persistent residential heat exposure more severe.'
  },
  'urban_tree_canopy_loss->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/heatislands',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    notes: 'Urban tree-canopy loss increases local heat exposure and weakens cooling protection, making it a defensible amplifier of public-health heat burden.'
  },
  'airport_climate_exposure->airport_operational_disruption': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.faa.gov/data',
      'https://www.faa.gov/airports/planning_capacity/sustainability/resilience'
    ],
    notes: 'Airport climate exposure becomes operationally meaningful through delay, cancellation, runway, ground-system, and throughput disruption.'
  },
  'marine_fisheries_collapse->fish_landing_supply_disruption': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en',
      'https://www.fisheries.noaa.gov/'
    ],
    notes: 'Fishery collapse or sustained stock decline reduces reliable landings, making supply disruption a direct operational expression of marine food-system stress.'
  },
  'marine_food_web_simplification->marine_fisheries_collapse': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fisheries.noaa.gov/feature-story/understanding-ocean-changes-and-climate-just-got-harder',
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en'
    ],
    notes: 'Marine food-web reorganization can reduce productivity, shift trophic support, and weaken stock stability in ways that raise fishery-collapse risk.'
  },
  'marine_food_web_simplification->fish_landing_supply_disruption': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fisheries.noaa.gov/feature-story/understanding-ocean-changes-and-climate-just-got-harder',
      'https://www.fao.org/fishery/en'
    ],
    notes: 'Food-web reorganization becomes socially visible when altered species composition and timing make local fish landings less reliable.'
  },
  'estuarine_nursery_loss->marine_fisheries_collapse': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en',
      'https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/'
    ],
    notes: 'Loss of estuarine juvenile habitat can weaken recruitment into coastal fisheries, increasing collapse risk where nursery function is a key life-stage bottleneck.'
  },
  'estuarine_nursery_loss->fish_landing_supply_disruption': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en',
      'https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/'
    ],
    notes: 'Nursery-habitat degradation can reduce future recruitment and make small-scale and coastal fish landings less stable over time.'
  },
  'pelagic_species_redistribution->fish_landing_supply_disruption': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fisheries.noaa.gov/',
      'https://www.gbif.org/'
    ],
    notes: 'When pelagic species shift away from established grounds or seasons, local landing volumes and access can become more erratic even without outright collapse.'
  },
  'fish_landing_supply_disruption->fishery_protein_dependence': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/fishery/en',
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en'
    ],
    notes: 'Landing disruption matters most where communities rely on fish as a major protein source, making dependence the exposed downstream condition.'
  },
  'fishery_protein_dependence->food_import_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/fishery/en',
      'https://www.fao.org/3/I9542EN/i9542en.pdf'
    ],
    notes: 'Where local fish supply is a major nutrition pillar, disrupted domestic landings can push communities or countries toward more fragile import dependence.'
  },
  'watershed_forest_loss->freshwater_ecosystem_collapse': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.globalforestwatch.org/topics/biodiversity/',
      'https://wedocs.unep.org/bitstream/handle/20.500.11822/36691/PFE6.6.1.pdf'
    ],
    notes: 'Loss of forest cover in key watersheds can degrade stream habitat, sediment conditions, and ecological buffering, pushing freshwater ecosystems toward collapse.'
  },
  'watershed_forest_loss->drinking_water_treatment_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.wri.org/aqueduct',
      'https://www.epa.gov/crwu'
    ],
    notes: 'Forest loss in source watersheds can raise erosion, turbidity, and runoff volatility, increasing treatment strain for downstream drinking-water systems.'
  },
  'watershed_forest_loss->hydropower_reliability_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.wri.org/aqueduct',
      'https://www.iea.org/reports/hydropower-special-market-report'
    ],
    notes: 'Watershed forest degradation can destabilize runoff timing and sediment conditions that matter for dependable hydropower operations.'
  },
  'insurance_retreat->climate_litigation_pressure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://home.treasury.gov/system/files/311/Final%20FIO%202025%20Annual%20Report.pdf',
      'https://www.unep.org/resources/report/global-climate-litigation-report-2023-status-review'
    ],
    notes: 'As coverage retreats and climate losses are repriced, liability, disclosure, and adaptation disputes are more likely to move into litigation and legal pressure.'
  },
  'climate_litigation_pressure->adaptation_capital_shortfall': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unep.org/resources/report/global-climate-litigation-report-2023-status-review',
      'https://www.unep.org/resources/adaptation-gap-report-2025'
    ],
    notes: 'Litigation pressure can surface unresolved responsibility and funding gaps, sharpening attention on adaptation shortfalls even when it does not directly close them.'
  },
  'pollinator_service_decline->pollinator_colony_collapse': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipbes.net/assessment-reports/pollinators',
      'https://www.fao.org/pollination/en/'
    ],
    notes: 'Pollinator service decline becomes visible on the ground through colony collapse and acute pollinator losses that disrupt crop and ecosystem function.'
  },
  'biodiversity_intactness_loss->wildlife_habitat_patches': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://doi.org/10.1126/sciadv.1500052',
      'https://www.globalforestwatch.org/topics/biodiversity/'
    ],
    notes: 'Falling biodiversity intactness is closely tied to shrinking and isolating habitat patches, which reduce species movement and trophic resilience.'
  },
  'temp->watershed_forest_loss': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.globalforestwatch.org/topics/biodiversity/',
      'https://www.wri.org/aqueduct'
    ],
    notes: 'Warming and drying pressure raise watershed forest stress by increasing fire exposure, evapotranspiration pressure, and hydrologic instability across forested basins.'
  },
  'deforestation->insect_biomass_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.globalforestwatch.org/topics/biodiversity/',
      'https://www.ipbes.net/assessment-reports/pollinators'
    ],
    notes: 'Deforestation removes forage, nesting space, and microclimate stability, making it a defensible upstream driver of insect biomass decline.'
  },
  'forest_fragmentation->insect_biomass_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://doi.org/10.1126/sciadv.1500052',
      'https://www.ipbes.net/assessment-reports/pollinators'
    ],
    notes: 'Fragmented habitats support smaller, more isolated insect populations, so forest fragmentation is a grounded neighboring driver of falling insect biomass.'
  },
  'pollinator_service_decline->insect_biomass_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipbes.net/assessment-reports/pollinators',
      'https://www.fao.org/pollination/en/'
    ],
    notes: 'Pollination-service decline often reflects broader insect decline, making insect biomass loss a defensible local manifestation of weakened pollinator systems.'
  },
  'deforestation->soil_humus_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/soils-portal/soil-management/soil-organic-carbon/en/',
      'https://soilgrids.org/'
    ],
    notes: 'Deforestation strips litter inputs, canopy protection, and root structure from soils, accelerating the loss of humus and other organic matter.'
  },
  'temp->soil_humus_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/soils-portal/soil-management/soil-organic-carbon/en/',
      'https://soilgrids.org/'
    ],
    notes: 'Hotter conditions speed soil organic matter breakdown and weaken moisture retention, making warming a defensible upstream pressure on humus decline.'
  },
  'port_heat_vulnerability->supply_chain_port_bottlenecks': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-16/',
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b'
    ],
    notes: 'Heat-stressed ports become freight chokepoints when labor safety limits, equipment strain, and shoreline disruption slow cargo throughput.'
  },
  'aviation_demand_growth->aviation_condensation_trails': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/',
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/'
    ],
    notes: 'More flight activity expands contrail-producing traffic corridors, making aviation demand growth a defensible upstream driver of condensation-trail burden.'
  },
  'aviation_demand_growth->aviation_jet_fuel_emissions': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/energy-system/transport/aviation',
      'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/'
    ],
    notes: 'Growing aviation demand translates directly into more jet-fuel combustion unless activity is displaced or deeply decarbonized, so this is a core local pathway.'
  },
  'aviation_demand_growth->carbon_emission': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/energy-system/transport/aviation',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/'
    ],
    notes: 'Aviation demand growth is a direct upstream pressure on carbon emissions because most flights still rely on fossil jet fuel and high-altitude combustion.'
  },
  'cooling_water_competition->transformer_heat_failure_risk': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b',
      'https://www.energy.gov/oe/downloads/climate-change-and-electric-grid'
    ],
    notes: 'Cooling-water competition compounds heat-era grid stress, raising transformer failure risk as generation constraints and peak-load pressure hit the same system.'
  },
  'industry_farming->fertilizer_price_shock': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/markets-and-trade/en/',
      'https://www.worldbank.org/en/research/commodity-markets'
    ],
    notes: 'Input-intensive industrial farming is directly exposed to fertilizer price shocks because nutrient costs feed quickly into planting decisions and food-system margins.'
  },
  'wet_bulb_heat->agricultural_labor_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ilo.org/global/topics/safety-and-health-at-work/resources-library/publications/WCMS_711919/lang--en/index.htm',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    notes: 'Humid heat becomes agricultural labor exposure when field work can no longer be sustained safely through the hottest parts of the day.'
  },
  'industry_farming->nitrogen_fertilizer_runoff': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/nutrientpollution',
      'https://www.fao.org/soils-portal/en/'
    ],
    notes: 'Industrial farming increases nutrient runoff risk because concentrated fertilizer use often outruns field uptake and enters waterways.'
  },
  'temp->coastal_inundation_risk': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/sealevel.html',
      'https://sealevel.nasa.gov/'
    ],
    notes: 'Higher global temperature raises sea level by expanding ocean water and accelerating land-ice melt, making warming a direct upstream driver of coastal inundation risk.'
  },
  'carbon_emission->coastal_inundation_risk': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/sealevel.html',
      'https://sealevel.nasa.gov/'
    ],
    notes: 'Carbon emissions load the climate system with warming that contributes to sea-level rise, strengthening the baseline flood and erosion risk facing coasts.'
  },
  'soil_moisture_collapse->groundwater_depletion_wells': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/groundwater-depletion',
      'https://www.fao.org/aquastat/en/'
    ],
    notes: 'When root-zone moisture collapses, groundwater pumping often intensifies, deepening well depletion and delaying aquifer recovery.'
  },
  'resource_depletion->aquifer_overdraft': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/groundwater-depletion',
      'https://www.wri.org/aqueduct'
    ],
    notes: 'Aquifer overdraft is a direct resource-depletion pathway where extraction continues past recharge for years or decades.'
  },
  'soil_moisture_collapse->groundwater_depletion_wells': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://smap.jpl.nasa.gov/data/',
      'https://gracefo.jpl.nasa.gov/'
    ],
    notes: 'When soil moisture collapses, irrigation pressure often shifts harder onto wells, making groundwater depletion a direct compensatory pathway.'
  },
  'industry_farming->water_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/aquastat/',
      'https://www.wri.org/aqueduct'
    ],
    notes: 'Irrigated agriculture is a major basin-scale withdrawal pressure, so intensive farming is a defensible upstream contributor to baseline water stress.'
  },
  'industry_farming->groundwater_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/aquastat/',
      'https://gracefo.jpl.nasa.gov/'
    ],
    notes: 'Groundwater depletion is a direct pathway where irrigation and farm withdrawals outpace recharge over years to decades.'
  },
  'river_flow_regime_shift->hydropower_reliability_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/hydropower-special-market-report',
      'https://www.energy.gov/water-power-technologies-office/hydropower-basics'
    ],
    notes: 'Hydropower reliability falls when river timing and seasonal flow patterns no longer match reservoir and turbine expectations.'
  },
  'temp->heat_related_mortality_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
      'https://www.who.int/health-topics/climate-change'
    ],
    notes: 'Higher temperatures and more intense heat events increase heat-related mortality risk, especially when exposure and vulnerability are already high.'
  },
  'temp->extreme_precipitation_intensity': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
      'https://www.climate.gov/news-features/understanding-climate/climate-change-heavy-rainfall'
    ],
    notes: 'A warmer atmosphere can hold and release more water, increasing the intensity of the heaviest precipitation events.'
  },
  'extreme_precipitation_intensity->flash_flood_regime': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.weather.gov/pub/pnsfloodsafety',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
    ],
    relationship_type: 'hazard_amplifier',
    confidence: 'high',
    notes: 'Heavier short-duration rainfall increases flash-flood risk when rainfall rates overwhelm local drainage, infiltration, and channel capacity.'
  },
  'temp->occupational_heat_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ilo.org/publications/working-warmer-planet-impact-heat-stress-labour-productivity-and-decent-work',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    notes: 'Rising heat and humidity reduce safe labor capacity and increase work-related heat strain across exposed sectors.'
  },
  'wet_bulb_heat->occupational_heat_exposure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ilo.org/publications/working-warmer-planet-impact-heat-stress-labour-productivity-and-decent-work',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'Wet-bulb heat directly intensifies occupational heat exposure because high humidity limits evaporative cooling and lowers safe labor capacity.'
  },
  'extreme_precipitation_intensity->wastewater_infrastructure_overflow': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/npdes/combined-sewer-overflows-csos',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
    ],
    notes: 'More intense short-duration precipitation can exceed sewer conveyance and treatment-system design capacity, increasing overflow risk.'
  },
  'temp->tropical_cyclone_rapid_intensification': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
    ],
    notes: 'Warmer ocean temperatures and higher ocean heat content support conditions under which tropical cyclones are more likely to intensify rapidly, even if basin-wide frequency signals remain more uncertain.'
  },
  'tropical_cyclone_rapid_intensification->compound_coastal_flooding': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/stormsurge-stormtide.html',
      'https://www.gfdl.noaa.gov/global-warming-and-hurricanes/'
    ],
    notes: 'Rapidly intensifying coastal storms can compress warning time and increase the likelihood that surge, rainfall, and elevated coastal water levels combine into compound flooding.'
  },
  'tropical_cyclone_rapid_intensification->storm_surge_floods': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/stormsurge-stormtide.html',
      'https://www.nhc.noaa.gov/'
    ],
    notes: 'Storms that strengthen quickly near shore can arrive with higher wind and surge potential than communities had time to prepare for, raising storm-surge flood risk.'
  },
  'personal_conveyance->air_pollution_health_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
      'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics'
    ],
    notes: 'Road traffic is a defensible transport source of outdoor air pollution exposure that contributes to respiratory and cardiovascular burden.'
  },
  'pm2_5_particulates->air_pollution_health_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics',
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health'
    ],
    relationship_type: 'direct',
    confidence: 'high',
    notes: 'PM2.5 directly drives a large share of outdoor air-pollution burden because fine particles penetrate deep into the lungs and contribute to cardiovascular and respiratory harm.'
  },
  'wildfire_regime_shift->pyrocumulonimbus_smoke_injection': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://ntrs.nasa.gov/citations/20190025336',
      'https://www.nifc.gov/fire-information/statistics/wildfires'
    ],
    notes: 'Extreme wildfire behavior increases the likelihood of pyrocumulonimbus development, which can loft smoke much higher than ordinary plume transport.'
  },
  'pyrocumulonimbus_smoke_injection->stratospheric_aerosols': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://ntrs.nasa.gov/citations/20190025336',
      'https://gml.noaa.gov/'
    ],
    notes: 'Pyrocumulonimbus events can inject smoke aerosols into the upper atmosphere, extending transport range and lifetime beyond lower-troposphere plume behavior.'
  },
  'pyrocumulonimbus_smoke_injection->aerosol_scattering_index': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://ntrs.nasa.gov/citations/20190025336',
      'https://www.copernicus.eu/en/news/news/record-breaking-pyrocumulonimbus-events-caused-australian-bushfires'
    ],
    relationship_type: 'observed_indicator',
    confidence: 'medium',
    notes: 'Pyrocumulonimbus smoke injection raises detectable upper-atmosphere aerosol loading, making aerosol-scattering signals a defensible observational neighbor for these events.'
  },
  'utility_disconnection_risk->heat_related_mortality_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
      'https://www.energy.gov/scep/low-income-home-energy-assistance-program-liheap'
    ],
    notes: 'Heat mortality risk rises when electricity disconnection interrupts cooling, hydration support, and use of essential home medical equipment.'
  },
  'critical_infrastructure_fragility->heat_related_mortality_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    notes: 'Heat mortality rises when transport, water, and care systems fail together during extreme-heat periods.'
  },
  'freshwater_ecosystem_collapse->harmful_algal_blooms': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/cyanohabs',
      'https://oceanservice.noaa.gov/hazards/hab/'
    ],
    notes: 'Collapsed freshwater ecosystems often reflect nutrient, flow, and temperature imbalances that also favor harmful algal bloom conditions in lakes, estuaries, and brackish waters.'
  },
  'harmful_algal_blooms->coastal_hypoxia': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/hazards/hab/',
      'https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/'
    ],
    notes: 'Dense bloom growth and decay can intensify oxygen drawdown, making harmful algal blooms a defensible local contributor to coastal hypoxia.'
  },
  'industry_farming->feed_crop_dependency': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/faostat/',
      'https://www.fao.org/animal-production/en/'
    ],
    notes: 'Industrial livestock systems deepen dependence on feed-crop supply chains that transmit land, water, and fertilizer stress through animal production.'
  },
  'shipping->supply_chain_port_bottlenecks': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://unctad.org/system/files/official-document/rmt2024_en.pdf',
      'https://unctad.org/system/files/official-document/osginf2024d2_en.pdf'
    ],
    notes: 'Shipping disruption translates directly into port bottlenecks because canal delays, rerouting, and fleet congestion accumulate at cargo nodes.'
  },
  'aviation->aviation_jet_fuel_emissions': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/topics/transport',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/'
    ],
    notes: 'Jet-fuel emissions are the core direct-combustion pathway inside the broader aviation sector.'
  },
  'air_conditioning_refrigerants->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/the-future-of-cooling',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    notes: 'Cooling access and refrigerant-dependent systems shape how much heat exposure becomes actual health burden during extreme events.'
  },
  'cement_concrete->cement_process_emissions': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/cement',
      'https://www.iea.org/reports/demand-and-supply-measures-for-the-steel-and-cement-transition'
    ],
    notes: 'Process emissions are the core climate burden inside cement and concrete because clinker production releases carbon dioxide through both fuel use and calcination chemistry.'
  },
  'steel->steel_decarbonization_gap': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/iron-and-steel-technology-roadmap',
      'https://www.iea.org/reports/demand-and-supply-measures-for-the-steel-and-cement-transition'
    ],
    notes: 'The steel transition gap reflects the difficulty of moving an energy- and coal-intensive material system onto lower-emissions production routes fast enough.'
  },
  'gas_power_dependence->peaker_plant_lock_in': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf',
      'https://www.eia.gov/energyexplained/natural-gas/use-of-natural-gas.php'
    ],
    notes: 'Gas-dependent power systems are more likely to preserve peaker dependence because short-run reliability markets continue to favor dispatchable fossil capacity.'
  },
  'transmission_buildout_lag->transformer_supply_bottleneck': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://eta-publications.lbl.gov/sites/default/files/2025-12/queued_up_2025_edition_12.15.2025.pdf',
      'https://www.energy.gov/sites/default/files/2023-10/National_Transmission_Needs_Study_2023.pdf'
    ],
    notes: 'Transmission expansion delays compound transformer bottlenecks because interconnection and substation buildouts depend on the same slow-moving grid equipment pipeline.'
  },
  'transmission_buildout_lag->renewable_curtailment_losses': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://eta-publications.lbl.gov/sites/default/files/2025-12/queued_up_2025_edition_12.15.2025.pdf',
      'https://www.energy.gov/sites/default/files/2023-10/National_Transmission_Needs_Study_2023.pdf'
    ],
    notes: 'When grid expansion lags, renewable output is more likely to be curtailed because generation arrives before wires, substations, and regional transfer capacity do.'
  },
  'critical_mineral_extraction_pressure->battery_supply_chain_pressure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/global-critical-minerals-outlook-2025',
      'https://www.iea.org/reports/global-ev-outlook-2025'
    ],
    notes: 'Battery supply chains inherit mining pressure directly because scaling cells, storage, and electrified transport depends on constrained mineral extraction and processing.'
  },
  'battery_supply_chain_pressure->resource_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/global-critical-minerals-outlook-2025',
      'https://www.worldbank.org/en/topic/extractiveindustries'
    ],
    notes: 'Battery supply pressure can deepen water and land depletion where extraction, refining, and waste burdens concentrate in mining regions.'
  },
  'backup_generator_dependence->critical_infrastructure_fragility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
      'https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b'
    ],
    notes: 'Heavy reliance on backup generators is a fragility signal because services remain dependent on diesel fallback instead of resilient primary power and grid redundancy.'
  },
  'rail_heat_buckling->commuter_rail_transit_gaps': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://railroads.dot.gov/',
      'https://www.transportation.gov/climate-and-sustainability'
    ],
    notes: 'Heat-related track instability degrades service reliability and can widen commuter rail gaps when agencies have to slow, cancel, or reroute trains during extreme heat.'
  },
  'rail_heat_buckling->railroad_chemical_car_derailments': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://railroads.dot.gov/',
      'https://www.epa.gov/emergency-response'
    ],
    notes: 'When track geometry degrades under heat stress, derailment risk rises, including for freight cars carrying hazardous chemicals.'
  },
  'food_waste->methane': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/land-research/food-waste-research',
      'https://www.unep.org/resources/report/unep-food-waste-index-report-2024'
    ],
    notes: 'Food waste disposed in landfills decomposes anaerobically and produces methane, making this a direct waste-management emissions pathway.'
  },
  'plastics_petrochemicals->carbon_emission': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/the-future-of-petrochemicals',
      'https://www.unep.org/plastic-pollution'
    ],
    notes: 'Plastics and petrochemicals carry direct fossil-feedstock and process-energy emissions across production and end-of-life treatment.'
  },
  'fertilizer_production->synthetic_fertilizer_n2o_outflow': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/ammonia-technology-roadmap',
      'https://www.epa.gov/ghgemissions/overview-greenhouse-gases#nitrous-oxide'
    ],
    notes: 'Synthetic nitrogen fertilizer production and use create a documented nitrous-oxide pathway through industrial supply and fertilized soils.'
  },
  'mining_critical_minerals->critical_mineral_extraction_pressure': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.iea.org/reports/global-critical-minerals-outlook-2025',
      'https://www.worldbank.org/en/topic/extractiveindustries'
    ],
    notes: 'Critical-mineral mining is the direct activity represented by extraction pressure across land, water, processing, and supply systems.'
  },
  'urban_sprawl_housing->asphalt_pavement_heat_absorbers': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/heatislands/using-cool-pavements-reduce-heat-islands',
      'https://www.unhabitat.org/'
    ],
    notes: 'Low-density urban expansion increases paved surface area, while conventional asphalt absorbs and transfers heat into the urban environment.'
  },
  'permafrost_thaw->talik_expansion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://www.ipcc.ch/srocc/chapter/chapter-3-2/'
    ],
    notes: 'Persistent thaw enlarges unfrozen talik layers within permafrost, changing groundwater flow and ground stability.'
  },
  'permafrost_thaw->tundra_thermokarst_development': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground',
      'https://www.usgs.gov/mission-areas/climate-research-and-development/science/permafrost'
    ],
    notes: 'Thaw of ice-rich permafrost causes ground subsidence and thermokarst development across tundra landscapes.'
  },
  'permafrost_thaw->winter_ice_road_collapses': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/srocc/chapter/chapter-3-2/',
      'https://www.usgs.gov/mission-areas/climate-research-and-development/science/permafrost'
    ],
    notes: 'Warmer ground and shorter freeze seasons reduce the stability and operating window of winter roads built on frozen terrain.'
  },
  'ice_sheet_mass_loss->ice_shelf_grounding_line_retreat': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      'https://sealevel.nasa.gov/'
    ],
    notes: 'Grounding-line retreat is a measured component and accelerator of marine ice-sheet mass loss.'
  },
  'sea_ice_season_loss->arctic_amplification_rates': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/sea-ice-today',
      'https://arctic.noaa.gov/report-card/'
    ],
    notes: 'Loss of reflective sea ice increases absorbed solar energy and contributes to amplified Arctic warming.'
  },
  'temp->greenland_glacier_melting': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      'https://sealevel.nasa.gov/'
    ],
    notes: 'Atmospheric and ocean warming increase surface melt and dynamic ice loss across the Greenland ice sheet.'
  },
  'temp->arctic_sea_ice_thinning': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://nsidc.org/sea-ice-today',
      'https://arctic.noaa.gov/report-card/'
    ],
    notes: 'Rising Arctic temperatures reduce sea-ice growth and survival, contributing directly to thinner seasonal ice cover.'
  },
  'aquifer_overdraft->groundwater_depletion_wells': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/groundwater-depletion',
      'https://gracefo.jpl.nasa.gov/'
    ],
    notes: 'Pumping above recharge depletes groundwater storage and lowers water availability in monitored wells.'
  },
  'aquifer_overdraft->deep_well_water_table_drops': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/groundwater-depletion',
      'https://www.fao.org/aquastat/en/'
    ],
    notes: 'Sustained aquifer overdraft lowers water tables and forces deeper well access.'
  },
  'deforestation->canopy_cover_losses': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.globalforestwatch.org/',
      'https://www.fao.org/forest-resources-assessment/en/'
    ],
    notes: 'Tree-cover and canopy loss are direct observed expressions of deforestation.'
  },
  'wet_bulb_heat->heatwave_excess_mortality_rates': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
      'https://www.cdc.gov/heat-health/'
    ],
    notes: 'Extreme heat exposure raises heat-related illness and excess mortality, especially when humidity limits evaporative cooling.'
  },
  'data_centers->data_center_heat_rejection': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
      'https://www.iea.org/reports/energy-and-ai'
    ],
    notes: 'Data-center computing load becomes waste heat that cooling systems must reject to air or water.'
  },
  'data_centers->dense_rack_power_demand': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
      'https://www.iea.org/reports/energy-and-ai'
    ],
    notes: 'Higher rack density directly increases concentrated facility power and cooling demand.'
  },
  'semiconductor_fabs->semiconductor_fab_water_demand': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nist.gov/chips/implementation-strategies/national-environmental-policy-act-nepa-and-chips-act',
      'https://www.oecd.org/en/topics/sub-issues/semiconductors.html'
    ],
    notes: 'Semiconductor fabrication directly requires substantial ultrapure-water supply and wastewater handling.'
  },
  'semiconductor_fabs->semiconductor_f_gas_emissions': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.nist.gov/chips/implementation-strategies/national-environmental-policy-act-nepa-and-chips-act',
      'https://www.epa.gov/eps-partnership/semiconductor-industry'
    ],
    notes: 'Semiconductor manufacturing uses fluorinated gases in etching and chamber cleaning, creating a direct emissions pathway.'
  },
  'coastal_hypoxia->anoxic_dead_zones': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://oceanservice.noaa.gov/facts/deadzone.html',
      'https://www.ncei.noaa.gov/products/gulf-america-hypoxia-watch'
    ],
    notes: 'Persistent severe hypoxia can cross into anoxia and form low-oxygen dead zones unable to support most marine life.'
  },
  'carbon_emission->oceanic_carbon_sink_saturation': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/',
      'https://www.socat.info/'
    ],
    notes: 'Rising anthropogenic carbon loads the ocean carbon sink and changes its uptake efficiency; this edge does not imply a uniform global saturation threshold.'
  },
  'aquifer_overdraft->coastal_aquifer_degradation': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.usgs.gov/mission-areas/water-resources/science/groundwater-depletion',
      'https://www.wri.org/aqueduct'
    ],
    notes: 'Overpumping coastal aquifers lowers freshwater heads and increases depletion and saltwater-intrusion pressure.'
  },
  'aviation_demand_growth->aero_acoustic_jet_noise_plumes': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.faa.gov/noise',
      'https://www.iea.org/energy-system/transport/aviation'
    ],
    notes: 'More aviation activity increases aggregate aircraft-noise exposure around airports and flight corridors.'
  },
  'urbanization->metropolitan_gridlock_emissions': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/greenvehicles/fast-facts-transportation-greenhouse-gas-emissions',
      'https://ghsl.jrc.ec.europa.eu/'
    ],
    notes: 'Car-dependent urban growth increases vehicle activity and congestion-related transport emissions.'
  },
  'fast_fashion->textile_factory_toxic_dyes': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unep.org/resources/publication/sustainability-and-circularity-textile-value-chain-global-roadmap',
      'https://doi.org/10.1038/s43017-020-0039-9'
    ],
    notes: 'High-throughput textile production creates direct dye and wastewater burdens in manufacturing regions.'
  },
  'fast_fashion->unsold_apparel_incineration': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unep.org/resources/publication/sustainability-and-circularity-textile-value-chain-global-roadmap',
      'https://doi.org/10.1038/s43017-020-0039-9'
    ],
    notes: 'Overproduction and short product cycles create unsold textile waste that can enter incineration and disposal streams.'
  },
  'fast_fashion->textile_microfiber_shedding': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unep.org/resources/publication/sustainability-and-circularity-textile-value-chain-global-roadmap',
      'https://doi.org/10.1038/s43017-020-0039-9'
    ],
    notes: 'Synthetic textile production and use release microfibers across manufacturing, washing, and waste pathways.'
  },
  'mangrove_destruction->mangrove_buffer_loss': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.globalmangrovewatch.org/',
      'https://www.unep.org/explore-topics/oceans-seas/what-we-do/protecting-and-restoring-blue-carbon-ecosystems'
    ],
    notes: 'Mangrove destruction directly removes wave attenuation, nursery habitat, erosion control, and blue-carbon buffering.'
  },
  'nitrogen_fertilizer_runoff->coastal_hypoxia': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/nutrientpollution',
      'https://oceanservice.noaa.gov/facts/deadzone.html'
    ],
    notes: 'Excess fertilizer nitrogen carried into coastal waters stimulates eutrophication and oxygen drawdown, contributing directly to coastal hypoxia.'
  },
  'rice_paddy_methane_bubbles->methane': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc-nggip.iges.or.jp/public/2019rf/vol4.html',
      'https://www.fao.org/faostat/en/#data/GT'
    ],
    notes: 'Anaerobic decomposition in flooded rice fields produces methane that escapes through plants, ebullition, and diffusion.'
  },
  'landfill_methane_outflows->methane': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/lmop/basic-information-about-landfill-gas',
      'https://www.epa.gov/ghgemissions/overview-greenhouse-gases#methane'
    ],
    notes: 'Anaerobic decomposition of organic waste in landfills is a direct anthropogenic methane source.'
  },
  'palm_oil_canopy_clearance->deforestation': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.globalforestwatch.org/',
      'https://www.fao.org/forest-resources-assessment/en/'
    ],
    notes: 'Expansion of oil-palm plantations through canopy clearance is a direct land-use conversion pathway into deforestation.'
  },
  'coal_fired_power_outflow->carbon_emission': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/egrid',
      'https://www.eia.gov/energyexplained/coal/coal-and-the-environment.php'
    ],
    notes: 'Coal-fired electricity directly emits carbon dioxide through fuel combustion, alongside other regulated air pollutants.'
  },
  'sulfur_dioxide->aerosol_cooling_loss': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/',
      'https://www.epa.gov/so2-pollution'
    ],
    notes: 'Sulfur dioxide forms sulfate aerosols that exert a cooling influence; reducing sulfur pollution removes part of that masking effect.'
  },
  'hyperscale_server_hall->data_center_heat_rejection': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
      'https://www.iea.org/reports/energy-and-ai'
    ],
    notes: 'Dense hyperscale computing converts electrical load into waste heat that facility cooling systems must reject.'
  },
  'topsoil_salinization_fields->crop_yield_volatility': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.fao.org/soils-portal/soil-management/management-of-some-problem-soils/salt-affected-soils/more-information-on-salt-affected-soils/en/',
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/'
    ],
    notes: 'Salt accumulation reduces crop performance and increases yield instability in affected fields.'
  },
  'canopy_cover_losses->pollinator_service_decline': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipbes.net/assessment-reports/pollinators',
      'https://www.fao.org/pollination/en/'
    ],
    notes: 'Canopy and habitat loss remove forage, nesting, and movement conditions needed to sustain pollinator services.'
  },
  'phytoplankton_decline->marine_food_web_simplification': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/srocc/chapter/chapter-5/',
      'https://www.fisheries.noaa.gov/feature-story/understanding-ocean-changes-and-climate-just-got-harder'
    ],
    notes: 'Changes in phytoplankton productivity and composition reorganize the food-web base available to higher marine trophic levels.'
  },
  'phytoplankton_decline->fish_landing_supply_disruption': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/srocc/chapter/chapter-5/',
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en'
    ],
    notes: 'Reduced phytoplankton productivity can propagate up marine food webs and lower the reliability of fish landings in systems dependent on strong primary productivity.'
  },
  'marine_heatwaves->marine_fisheries_collapse': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/srocc/chapter/chapter-5/',
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en'
    ],
    notes: 'Marine heatwaves can cause acute mortality, habitat disruption, and stock redistribution that reduce fishery reliability.'
  },
  'volatile_organic_compounds->tropospheric_ozone': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/'
    ],
    notes: 'Volatile organic compounds participate with nitrogen oxides and sunlight in the photochemical formation of ground-level ozone.'
  },
  'urban_heat_dome_stagnation->public_health_heat_burden': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.epa.gov/heatislands',
      'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
    ],
    notes: 'Persistent urban heat raises exposure and health burden where built surfaces, limited nighttime cooling, and vulnerable populations coincide.'
  },
  'migration->climate_refugee_camp_densities': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.unhcr.org/climate-change-and-disasters.html',
      'https://www.iom.int/environmental-migration-and-disaster-displacement'
    ],
    notes: 'Large displacement flows can increase pressure on temporary settlements and camps when durable housing and relocation capacity lag.'
  },
  'data_centers->cloud_campus_water_stress': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
      'https://www.iea.org/reports/energy-and-ai',
      'https://www.wri.org/aqueduct'
    ],
    notes: 'Large data-center campuses can concentrate cooling-water demand in already stressed local watersheds.'
  },
  'industrial_heat_decarbonization_gap->resource_depletion': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.energy.gov/cmei/ito/process-heat-basics',
      'https://www.iea.org/reports/the-future-of-heat-pumps'
    ],
    notes: 'Industrial heat that remains hard to decarbonize prolongs fuel, cooling, and materials demand across high-temperature manufacturing systems.'
  }
};

const RESEARCHED_EDGE_SOURCE_BUNDLES = {
  ocean_system: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/'
  ],
  ocean_circulation: [
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/'
  ],
  ocean_acidification: [
    'https://oceanacidification.noaa.gov/what-is-ocean-acidification/',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/'
  ],
  antarctic_bottom_water: [
    'https://www.nature.com/articles/s41558-023-01667-8',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
  ],
  pacific_decadal: [
    'https://repository.library.noaa.gov/view/noaa/54477',
    'https://psl.noaa.gov/data/correlation/pdo.data'
  ],
  atlantic_modes: [
    'https://psl.noaa.gov/data/correlation/amon.us.data',
    'https://www.nature.com/articles/s41558-026-02684-z'
  ],
  indian_ocean_dipole: [
    'https://www.cpc.ncep.noaa.gov/products/international/ocean_monitoring/IODMI/DMI.html',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
  ],
  harmful_algal_blooms: [
    'https://oceanservice.noaa.gov/hazards/hypoxia/',
    'https://www.fisheries.noaa.gov/feature-story/scientists-confirm-link-between-red-tides-and-low-oxygen-areas',
    'https://research.noaa.gov/in-hot-water-exploring-marine-heatwaves/'
  ],
  coastal_impacts: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
    'https://oceanservice.noaa.gov/facts/sealevel.html'
  ],
  hail: [
    'https://www.nature.com/articles/s41558-026-02660-7',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
  ],
  mjo: [
    'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/MJO/mjo.shtml',
    'https://www.cpc.ncep.noaa.gov/products/assessments/assess_97/mjo.html'
  ],
  northern_teleconnections: [
    'https://www.cpc.ncep.noaa.gov/data/teledoc/teleintro.shtml',
    'https://www.cpc.ncep.noaa.gov/data/teledoc/pna.shtml'
  ],
  arctic_oscillation: [
    'https://cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/ao.shtml',
    'https://www.cpc.ncep.noaa.gov/data/teledoc/teleintro.shtml'
  ],
  southern_annular_mode: [
    'https://www.cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/aao/aao.shtml',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/'
  ],
  qbo: [
    'https://acd-ext.gsfc.nasa.gov/Data_services/met/qbo/qbo.html',
    'https://www.giss.nasa.gov/pubs/abs/sa09400x.html'
  ],
  atmospheric_persistence: [
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/',
    'https://www.nature.com/articles/s41467-026-70487-z'
  ],
  aerosol_forcing: [
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/'
  ],
  grid_buildout: [
    'https://www.iea.org/reports/electricity-2026/grids',
    'https://www.iea.org/reports/building-the-future-transmission-grid/executive-summary'
  ],
  transformers: [
    'https://www.energy.gov/policy/articles/supply-chain-crisis-facing-nations-electric-grid',
    'https://www.iea.org/reports/building-the-future-transmission-grid/executive-summary'
  ],
  energy_ai: [
    'https://www.iea.org/reports/energy-and-ai/ai-and-energy-security',
    'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report'
  ],
  industrial_transition: [
    'https://www.iea.org/reports/demand-and-supply-measures-for-the-steel-and-cement-transition/executive-summary',
    'https://www.energy.gov/cmei/ito/process-heat-basics'
  ],
  energy_emissions: [
    'https://www.epa.gov/egrid',
    'https://www.eia.gov/energyexplained/natural-gas/natural-gas-and-the-environment.php'
  ],
  critical_minerals: [
    'https://www.iea.org/reports/global-critical-minerals-outlook-2025',
    'https://www.worldbank.org/en/topic/extractiveindustries'
  ],
  semiconductor_footprint: [
    'https://www.nist.gov/chips/implementation-strategies/national-environmental-policy-act-nepa-and-chips-act',
    'https://www.oecd.org/en/topics/sub-issues/semiconductors.html'
  ],
  heat_health: [
    'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
    'https://www.iea.org/reports/the-future-of-cooling'
  ],
  water_system: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/',
    'https://www.usgs.gov/water-science-school/science/groundwater-decline-and-depletion',
    'https://www.epa.gov/dwcapacity/drinking-water-system-infrastructure-resilience-and-sustainability'
  ],
  biosphere_system: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
    'https://www.fao.org/global-soil-partnership/areas-of-work/soil-erosion/en/'
  ],
  transport_resilience: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/',
    'https://www.fhwa.dot.gov/engineering/hydraulics/library_arc.cfm?id=179&pub_number=16',
    'https://www.fhwa.dot.gov/asset/pilot/',
    'https://www.faa.gov/air_traffic/flight_info/hurricane_season'
  ],
  agriculture_food: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/',
    'https://www.fao.org/global-soil-partnership/areas-of-work/soil-erosion/en/',
    'https://www.ilo.org/global/topics/safety-and-health-at-work/resources-library/publications/WCMS_711919/lang--en/index.htm'
  ],
  cryosphere_system: [
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp5/',
    'https://nsidc.org/learn/parts-cryosphere/frozen-ground-permafrost/science-frozen-ground'
  ],
  governance_risk: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/technical-summary/',
    'https://wmo.int/early-warnings-all'
  ],
  carbon_cycle: [
    'https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/',
    'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/',
    'https://coast.noaa.gov/states/fast-facts/blue-carbon.html'
  ]
};

const RESEARCHED_FAMILY_EDGE_EVIDENCE_PROFILES = Object.fromEntries([
  // key, level, source bundle, evidence note, relationship type, confidence
  ['temp->oceanic_deoxygenation', 'direct', 'ocean_system', 'Ocean warming lowers oxygen solubility and strengthens stratification and ventilation changes that drive deoxygenation.', 'causal_mechanism', 'high'],
  ['ocean_salinity_stratification->oceanic_deoxygenation', 'direct', 'ocean_system', 'Stratification restricts vertical ventilation and oxygen renewal in subsurface waters.', 'causal_mechanism', 'high'],
  ['oceanic_deoxygenation->marine_food_web_simplification', 'direct', 'ocean_system', 'Low oxygen compresses viable habitat and excludes oxygen-sensitive organisms, reorganizing marine communities.', 'ecological_mechanism', 'high'],
  ['oceanic_deoxygenation->marine_fisheries_collapse', 'local', 'ocean_system', 'Deoxygenation contributes to fishery risk through habitat compression, mortality, and stock redistribution; outcomes remain regional and multi-driver.', 'bounded_impact_chain', 'moderate'],
  ['temp->ocean_salinity_stratification', 'direct', 'ocean_circulation', 'Upper-ocean warming increases density separation and strengthens stratification.', 'causal_mechanism', 'high'],
  ['carbon_emission->ocean_acidification', 'direct', 'ocean_acidification', 'Anthropogenic carbon dioxide absorbed by seawater changes carbonate chemistry and lowers pH.', 'causal_mechanism', 'high'],
  ['ocean_acidification->shell_calcification_failures', 'direct', 'ocean_acidification', 'Acidification reduces carbonate availability and raises calcification stress for shell-forming organisms.', 'causal_mechanism', 'high'],
  ['ocean_acidification->marine_food_web_simplification', 'local', 'ocean_system', 'Acidification affects organisms unevenly and can reorganize trophic interactions; the edge is bounded as an ecosystem pathway.', 'bounded_ecological_chain', 'moderate'],
  ['temp->antarctic_bottom_water_decline', 'local', 'antarctic_bottom_water', 'Southern Ocean warming and freshening contribute to weaker dense-water formation, with regional variability and multiple controls.', 'bounded_physical_chain', 'moderate'],
  ['ice_sheet_mass_loss->antarctic_bottom_water_decline', 'local', 'antarctic_bottom_water', 'Antarctic meltwater freshens shelf waters and can inhibit formation of dense bottom water.', 'bounded_physical_chain', 'moderate'],
  ['antarctic_bottom_water_decline->oceanic_deoxygenation', 'direct', 'antarctic_bottom_water', 'Weaker abyssal overturning reduces ventilation and renewal of oxygenated deep water.', 'causal_mechanism', 'high'],
  ['antarctic_bottom_water_decline->deep_ocean_heat_sinks', 'local', 'antarctic_bottom_water', 'Abyssal overturning changes alter deep-ocean heat and ventilation pathways rather than producing a uniform global response.', 'bounded_physical_chain', 'moderate'],
  ['pacific_decadal_oscillation->marine_heatwaves', 'direct', 'pacific_decadal', 'Observed PDO phase modulates Northeast Pacific marine-heatwave frequency, duration, and intensity.', 'observed_modulation', 'high'],
  ['pacific_decadal_oscillation->environ_anomalies', 'local', 'pacific_decadal', 'PDO is a monitored natural mode that organizes regional sea-surface temperature and climate anomalies.', 'observed_teleconnection', 'moderate'],
  ['pacific_decadal_oscillation->pelagic_species_redistribution', 'local', 'pacific_decadal', 'PDO-linked habitat anomalies can shift species availability and distribution; the response is regional and taxon-specific.', 'bounded_ecological_chain', 'moderate'],
  ['atlantic_multidecadal_oscillation->environ_anomalies', 'local', 'atlantic_modes', 'The monitored Atlantic multidecadal signal co-varies with North Atlantic climate anomalies without implying anthropogenic phase control.', 'observed_covariability', 'moderate'],
  ['atlantic_multidecadal_oscillation->marine_heatwaves', 'local', 'atlantic_modes', 'Multidecadal Atlantic temperature variability conditions regional marine-heatwave baselines, but individual events remain multi-driver.', 'observed_modulation', 'moderate'],
  ['atlantic_multidecadal_oscillation->ocean_current_regime_shift', 'local', 'atlantic_modes', 'Atlantic temperature variability and circulation changes co-vary; this edge is explicitly associative rather than one-step causal.', 'observed_covariability', 'moderate'],
  ['atlantic_ni_o_ni_a->environ_anomalies', 'local', 'atlantic_modes', 'Atlantic Nino and Nina phases are observed tropical Atlantic variability modes with rainfall and circulation teleconnections.', 'observed_teleconnection', 'moderate'],
  ['atlantic_ni_o_ni_a->monsoon_volatility', 'local', 'atlantic_modes', 'Tropical Atlantic SST phases can modulate regional monsoon rainfall; strength and sign depend on season and basin.', 'observed_teleconnection', 'moderate'],
  ['atlantic_ni_o_ni_a->pelagic_species_redistribution', 'local', 'atlantic_modes', 'Tropical Atlantic habitat anomalies can redistribute pelagic species, with regional and species-specific responses.', 'bounded_ecological_chain', 'moderate'],
  ['indian_ocean_dipole->monsoon_volatility', 'direct', 'indian_ocean_dipole', 'IOD phases alter Indian Ocean convection and rainfall patterns that modulate monsoon behavior.', 'observed_teleconnection', 'high'],
  ['indian_ocean_dipole->environ_anomalies', 'direct', 'indian_ocean_dipole', 'The operationally monitored IOD redistributes rainfall and temperature anomalies across connected regions.', 'observed_teleconnection', 'high'],
  ['indian_ocean_dipole->food', 'local', 'indian_ocean_dipole', 'IOD-linked drought and rainfall anomalies can affect harvests, but food outcomes depend on exposure and management.', 'bounded_impact_chain', 'moderate'],
  ['freshwater_ecosystem_collapse->harmful_algal_blooms', 'local', 'harmful_algal_blooms', 'Nutrient, flow, and temperature imbalances that degrade freshwater ecosystems also favor bloom conditions.', 'bounded_ecological_chain', 'moderate'],
  ['marine_heatwaves->harmful_algal_blooms', 'local', 'harmful_algal_blooms', 'Marine heatwaves can favor harmful blooms where nutrients and species ecology align; warming alone is not sufficient.', 'conditional_causal_mechanism', 'moderate'],
  ['harmful_algal_blooms->fish_landing_supply_disruption', 'direct', 'harmful_algal_blooms', 'Harmful blooms disrupt landings through fish kills, toxin accumulation, and precautionary harvest closures.', 'operational_consequence', 'high'],
  ['ocean_current_regime_shift->marine_food_web_simplification', 'local', 'ocean_circulation', 'Circulation shifts alter heat and nutrient transport, creating a bounded pathway to food-web reorganization.', 'bounded_ecological_chain', 'moderate'],
  ['marine_food_web_simplification->marine_fisheries_collapse', 'local', 'ocean_system', 'Loss of trophic diversity weakens recruitment and fishery resilience, while harvest outcomes remain management-dependent.', 'bounded_ecological_chain', 'moderate'],
  ['coastal_hypoxia->marine_fisheries_collapse', 'direct', 'ocean_system', 'Coastal hypoxia causes habitat compression, mortality, and recruitment disruption that can collapse regional fisheries.', 'ecological_mechanism', 'high'],
  ['coastal_hypoxia->fish_landing_supply_disruption', 'direct', 'ocean_system', 'Low-oxygen events displace or kill stocks and directly disrupt the reliability of landings.', 'operational_consequence', 'high'],
  ['littoral_surge_vulnerability->compound_coastal_flooding', 'direct', 'coastal_impacts', 'Surge exposure compounds coastal flooding when elevated sea levels, waves, rainfall, or river flow coincide.', 'hazard_mechanism', 'high'],
  ['littoral_surge_vulnerability->storm_surge_floods', 'direct', 'coastal_impacts', 'Exposed littoral zones translate storm surge into inundation where shoreline elevation and buffers are insufficient.', 'hazard_mechanism', 'high'],
  ['littoral_surge_vulnerability->coastal_erosion', 'direct', 'coastal_impacts', 'Repeated surge and wave attack removes sediment and accelerates shoreline erosion.', 'hazard_mechanism', 'high'],
  ['amoc->ocean_current_regime_shift', 'local', 'ocean_circulation', 'AMOC is a major Atlantic circulation component, so observed or projected AMOC change is a bounded current-regime pathway.', 'taxonomic_mechanism', 'moderate'],

  ['temp->hail_hazard_shift', 'direct', 'hail', 'Warming changes freezing levels and convective environments, redistributing hail hazard rather than uniformly increasing it everywhere.', 'causal_mechanism', 'high'],
  ['hail_hazard_shift->crop_yield_volatility', 'direct', 'hail', 'Damaging hail directly injures crops and increases growing-season yield variability.', 'operational_consequence', 'high'],
  ['hail_hazard_shift->insurance_retreat', 'local', 'hail', 'Repeated hail losses can contribute to repricing and withdrawal, while market outcomes also depend on regulation and portfolios.', 'bounded_financial_chain', 'moderate'],
  ['madden_julian_oscillation->monsoon_volatility', 'direct', 'mjo', 'MJO convection modulates active and break phases of multiple monsoon systems.', 'observed_teleconnection', 'high'],
  ['madden_julian_oscillation->environ_anomalies', 'direct', 'mjo', 'MJO is an operationally monitored source of subseasonal rainfall and circulation anomalies.', 'observed_teleconnection', 'high'],
  ['madden_julian_oscillation->flash_flood_regime', 'local', 'mjo', 'Active MJO convection can raise heavy-rainfall and flash-flood potential, conditional on regional moisture and terrain.', 'conditional_hazard_chain', 'moderate'],
  ['north_atlantic_oscillation->environ_anomalies', 'direct', 'northern_teleconnections', 'NAO phases organize observed temperature, rainfall, storm-track, and jet-stream anomalies across the North Atlantic sector.', 'observed_teleconnection', 'high'],
  ['north_atlantic_oscillation->drought_persistence', 'local', 'northern_teleconnections', 'Persistent NAO phases can sustain regional precipitation deficits, but drought outcomes depend on season and location.', 'observed_modulation', 'moderate'],
  ['north_atlantic_oscillation->blocking_pattern_persistence', 'local', 'northern_teleconnections', 'NAO and North Atlantic blocking co-vary within persistent circulation regimes; the edge does not assign a universal causal direction.', 'observed_covariability', 'moderate'],
  ['arctic_oscillation->environ_anomalies', 'direct', 'arctic_oscillation', 'AO phases organize cold-season pressure, temperature, and circulation anomalies across the Northern Hemisphere.', 'observed_teleconnection', 'high'],
  ['arctic_oscillation->polar_vortex_instabilities', 'local', 'arctic_oscillation', 'AO and polar-vortex variability are linked parts of polar-cap circulation, but not interchangeable one-step causes.', 'observed_covariability', 'moderate'],
  ['arctic_oscillation->jet_stream_volatility', 'local', 'arctic_oscillation', 'AO phase co-varies with the strength and position of Northern Hemisphere circulation and jet patterns.', 'observed_covariability', 'moderate'],
  ['pacific_north_american_pattern->environ_anomalies', 'direct', 'northern_teleconnections', 'PNA phase is associated with documented North American temperature and precipitation anomaly patterns.', 'observed_teleconnection', 'high'],
  ['pacific_north_american_pattern->drought_persistence', 'local', 'northern_teleconnections', 'PNA-linked precipitation anomalies can sustain regional drought conditions, depending on season and phase.', 'observed_modulation', 'moderate'],
  ['pacific_north_american_pattern->blocking_pattern_persistence', 'direct', 'northern_teleconnections', 'NOAA describes the negative PNA phase as associated with high-latitude North Pacific blocking and split flow.', 'observed_teleconnection', 'high'],
  ['southern_annular_mode->environ_anomalies', 'direct', 'southern_annular_mode', 'SAM is an operationally monitored mode of Southern Hemisphere pressure and wind variability.', 'observed_teleconnection', 'high'],
  ['southern_annular_mode->ocean_current_regime_shift', 'local', 'southern_annular_mode', 'SAM wind anomalies modulate Southern Ocean circulation; responses vary by phase, region, and timescale.', 'observed_modulation', 'moderate'],
  ['southern_annular_mode->antarctic_bottom_water_decline', 'local', 'southern_annular_mode', 'Antarctic wind and shelf-ocean exchange conditions shape dense-water formation alongside warming and freshening.', 'bounded_physical_chain', 'moderate'],
  ['quasi_biennial_oscillation->stratospheric_water_vapor', 'direct', 'qbo', 'NASA identifies QBO control of tropical stratospheric water-vapor variability.', 'observed_mechanism', 'high'],
  ['quasi_biennial_oscillation->stratospheric_cooling', 'local', 'qbo', 'QBO phases organize lower-stratospheric temperature variability; this is not a long-term cooling attribution claim.', 'observed_covariability', 'moderate'],
  ['quasi_biennial_oscillation->madden_julian_oscillation', 'local', 'qbo', 'Observations show QBO phase modulates MJO activity, while the underlying coupling remains an active research area.', 'observed_modulation', 'moderate'],
  ['rossby_wave_stalling->drought_persistence', 'local', 'atmospheric_persistence', 'Slow planetary-wave patterns can sustain rainfall suppression and drought, but attribution varies by event.', 'conditional_hazard_chain', 'moderate'],
  ['rossby_wave_stalling->compound_day_night_heat_extremes', 'local', 'atmospheric_persistence', 'Persistent circulation can prolong compound heat without implying that every heat event is caused by wave stalling.', 'conditional_hazard_chain', 'moderate'],
  ['low_cloud_deck_retreat->cloud_albedo_shift', 'direct', 'aerosol_forcing', 'Loss of reflective low-cloud cover reduces cloud albedo and increases absorbed solar energy.', 'causal_mechanism', 'high'],
  ['aerosol_cooling_loss->temp', 'direct', 'aerosol_forcing', 'Declining reflective aerosol forcing removes part of the historical masking of greenhouse-gas warming.', 'causal_mechanism', 'high'],
  ['aerosol_cooling_loss->cloud_albedo_shift', 'direct', 'aerosol_forcing', 'Changing aerosol abundance alters aerosol-cloud interactions and cloud reflectivity.', 'causal_mechanism', 'high'],
  ['aerosol_cooling_loss->monsoon_volatility', 'local', 'aerosol_forcing', 'Aerosol forcing alters large-scale circulation and precipitation, including monsoons, with substantial regional uncertainty.', 'bounded_climate_chain', 'moderate'],
  ['thermal_inversion_events->particulate_soot_levels', 'direct', 'aerosol_forcing', 'Temperature inversions trap soot and fine particles near the surface instead of soot causing the inversion.', 'causal_mechanism', 'high'],

  ['data_centers->grid_peak_load_stress', 'direct', 'energy_ai', 'Large concentrated data-center loads add materially to local and regional electricity demand.', 'operational_mechanism', 'high'],
  ['ai_data_centers->grid_peak_load_stress', 'direct', 'energy_ai', 'Rapid AI-compute growth accelerates concentrated electricity demand and interconnection pressure.', 'operational_mechanism', 'high'],
  ['grid_peak_load_stress->public_health_heat_burden', 'local', 'heat_health', 'Peak-load failures raise heat-health burden when outages interrupt cooling and medical equipment.', 'bounded_operational_chain', 'moderate'],
  ['grid_peak_load_stress->peaker_plant_lock_in', 'local', 'grid_buildout', 'Systems short on flexibility may retain peaker capacity for peak reliability; market design and storage can alter the outcome.', 'bounded_operational_chain', 'moderate'],
  ['peaker_plant_lock_in->carbon_emission', 'direct', 'energy_emissions', 'Continued operation of fossil peaker plants directly emits carbon dioxide during peak generation.', 'causal_mechanism', 'high'],
  ['peaker_plant_lock_in->ambient_air_quality_deficit', 'direct', 'energy_emissions', 'Combustion at peaker plants emits local air pollutants, often during high-demand conditions.', 'operational_consequence', 'high'],
  ['peaker_plant_lock_in->energy_affordability_crisis', 'local', 'grid_buildout', 'High-cost peak generation and capacity dependence can add to customer costs, subject to tariff and market structure.', 'bounded_financial_chain', 'moderate'],
  ['transmission_buildout_lag->grid_peak_load_stress', 'direct', 'grid_buildout', 'Insufficient transfer capacity limits the ability to move power into constrained regions during peaks.', 'operational_mechanism', 'high'],
  ['transformer_supply_bottleneck->critical_infrastructure_fragility', 'direct', 'transformers', 'Transformer shortages delay replacement, recovery, and grid expansion, extending infrastructure vulnerability.', 'operational_mechanism', 'high'],
  ['transformer_supply_bottleneck->grid_peak_load_stress', 'local', 'transformers', 'Delayed substation expansion can leave peak-load constraints unresolved.', 'bounded_operational_chain', 'moderate'],
  ['data_centers->transformer_supply_bottleneck', 'local', 'energy_ai', 'Large-load interconnections add transformer and substation demand to an already constrained equipment pipeline.', 'bounded_supply_chain', 'moderate'],
  ['gas_power_dependence->carbon_emission', 'direct', 'energy_emissions', 'Natural-gas combustion in power plants directly emits carbon dioxide.', 'causal_mechanism', 'high'],
  ['gas_power_dependence->energy_affordability_crisis', 'local', 'energy_emissions', 'Gas-dependent power systems transmit fuel-price volatility into wholesale and retail costs, with market-specific effects.', 'bounded_financial_chain', 'moderate'],
  ['industrial_heat_decarbonization_gap->carbon_emission', 'direct', 'industrial_transition', 'Fossil process heat directly sustains industrial carbon emissions.', 'causal_mechanism', 'high'],
  ['industrial_heat_decarbonization_gap->cement_process_emissions', 'local', 'industrial_transition', 'Hard-to-decarbonize kiln heat compounds cement emissions alongside unavoidable calcination chemistry.', 'bounded_industrial_chain', 'moderate'],
  ['industrial_heat_decarbonization_gap->steel_decarbonization_gap', 'local', 'industrial_transition', 'High-temperature heat and reducing-energy needs are core constraints in low-emissions steel production.', 'bounded_industrial_chain', 'moderate'],
  ['cement_process_emissions->carbon_emission', 'direct', 'industrial_transition', 'Clinker calcination and kiln fuel use directly release carbon dioxide.', 'causal_mechanism', 'high'],
  ['steel_decarbonization_gap->carbon_emission', 'direct', 'industrial_transition', 'Continued coal- and gas-intensive steel routes directly sustain carbon emissions.', 'causal_mechanism', 'high'],
  ['critical_mineral_extraction_pressure->resource_depletion', 'direct', 'critical_minerals', 'Mining and processing concentrate land, water, waste, and material depletion pressures.', 'causal_mechanism', 'high'],
  ['battery_supply_chain_pressure->renewable_curtailment_losses', 'local', 'critical_minerals', 'Storage supply constraints can limit one route for absorbing surplus renewable output; grid flexibility has multiple alternatives.', 'bounded_operational_chain', 'moderate'],
  ['semiconductor_fabs->semiconductor_fabrication_footprint', 'direct', 'semiconductor_footprint', 'Fabrication facilities create the energy, water, chemical, and process-gas footprint represented by this node.', 'taxonomic_mechanism', 'high'],
  ['semiconductor_fabrication_footprint->cooling_water_competition', 'direct', 'semiconductor_footprint', 'Semiconductor production requires substantial ultrapure water and cooling, creating local competition where supplies are constrained.', 'operational_mechanism', 'high'],
  ['semiconductor_fabrication_footprint->carbon_emission', 'direct', 'semiconductor_footprint', 'Fabrication electricity and fluorinated process gases contribute directly and indirectly to greenhouse-gas emissions.', 'causal_mechanism', 'high'],
  ['cooling_water_competition->transformer_heat_failure_risk', 'local', 'grid_buildout', 'Cooling-water constraints and transformer heat risk coincide through hot-weather generation and peak-load stress rather than a direct water-to-transformer mechanism.', 'bounded_operational_chain', 'moderate'],
  ['cooling_water_competition->grid_peak_load_stress', 'local', 'grid_buildout', 'Thermal-generation cooling constraints can tighten supply during hot, high-demand periods.', 'bounded_operational_chain', 'moderate'],
  ['backup_generator_dependence->carbon_emission', 'direct', 'energy_emissions', 'Diesel and gas backup generators emit carbon dioxide when operated.', 'causal_mechanism', 'high'],
  ['utility_disconnection_risk->backup_generator_dependence', 'local', 'heat_health', 'Essential services may rely more on temporary generation when reliable utility service is unavailable; households often lack that option.', 'bounded_operational_chain', 'moderate'],
  ['data_centers->backup_generator_dependence', 'direct', 'energy_ai', 'Data-center uptime requirements commonly rely on on-site backup generation during grid interruptions.', 'operational_mechanism', 'high'],
  ['energy_affordability_crisis->public_health_heat_burden', 'direct', 'heat_health', 'Unaffordable cooling increases dangerous indoor heat exposure and health risk.', 'operational_consequence', 'high'],
  ['renewable_curtailment_losses->energy_affordability_crisis', 'local', 'grid_buildout', 'Discarding available low-marginal-cost generation can add system costs, though tariff impacts depend on market design.', 'bounded_financial_chain', 'moderate'],
  ['renewable_curtailment_losses->carbon_emission', 'local', 'grid_buildout', 'Curtailment can sustain fossil generation when clean output cannot reach demand; the effect depends on dispatch and storage.', 'bounded_operational_chain', 'moderate']
].map(([key, level, bundle, notes, relationshipType, confidence]) => [key, {
  source_status: level === 'direct' ? 'curated_edge_reference' : 'curated_local_reference',
  source_urls: RESEARCHED_EDGE_SOURCE_BUNDLES[bundle],
  notes,
  relationship_type: relationshipType,
  confidence
}]));

const RESEARCHED_FAMILY_BATCH_03_GROUPS = [
  {
    bundle: 'water_system',
    relationshipType: 'bounded_water_system_pathway',
    keys: [
      'temp->river_flow_regime_shift',
      'river_flow_regime_shift->reservoir_storage_instability',
      'drought_persistence->reservoir_storage_instability',
      'drought_persistence->soil_moisture_collapse',
      'soil_moisture_collapse->crop_yield_volatility',
      'soil_moisture_collapse->groundwater_depletion_wells',
      'freshwater_lens_compression->drinking_water_treatment_stress',
      'industry_farming->irrigation_water_inefficiency',
      'irrigation_water_inefficiency->aquifer_overdraft',
      'irrigation_water_inefficiency->groundwater_depletion_wells',
      'river_flow_regime_shift->basin_treaty_breakdown',
      'drought_persistence->basin_treaty_breakdown',
      'basin_treaty_breakdown->conflict_risk_escalation',
      'resource_depletion->desalination_dependence',
      'desalination_dependence->energy_affordability_crisis',
      'desalination_dependence->carbon_emission',
      'river_flow_regime_shift->reservoir_operating_shortfall',
      'snowmelt_timing_shift->river_flow_regime_shift',
      'flash_flood_regime->drinking_water_treatment_stress',
      'drought_persistence->drinking_water_treatment_stress',
      'drought_persistence->hydropower_reliability_decline',
      'wastewater_bypass_discharge->freshwater_ecosystem_collapse',
      'glacial_lake_failure_risk->hydrological_runoff_surges',
      'glacial_lake_failure_risk->bridge_scour_exposure'
    ]
  },
  {
    bundle: 'biosphere_system',
    relationshipType: 'bounded_ecosystem_pathway',
    keys: [
      'deforestation->forest_fragmentation',
      'forest_fragmentation->wildlife_habitat_patches',
      'forest_fragmentation->species_range_compression',
      'insect_biomass_decline->pollinator_service_decline',
      'pollinator_service_decline->crop_yield_volatility',
      'urban_tree_canopy_loss->public_health_heat_burden',
      'mangrove_buffer_loss->littoral_surge_vulnerability',
      'mangrove_buffer_loss->coastal_erosion',
      'marine_heatwaves->reef_structural_collapse',
      'ocean_acidification->reef_structural_collapse',
      'reef_structural_collapse->marine_fisheries_collapse',
      'topsoil_erosion_acceleration->soil_humus_decline',
      'soil_humus_decline->crop_yield_volatility',
      'industry_farming->soil_humus_decline',
      'freshwater_ecosystem_collapse->biodiversity_intactness_loss',
      'watershed_forest_loss->riverine_habitat_fragmentation',
      'riverine_habitat_fragmentation->freshwater_ecosystem_collapse',
      'temp->wildfire_regime_shift',
      'wildfire_regime_shift->forest_fragmentation',
      'wildfire_regime_shift->smoke_exposure_burden',
      'wetlands_drainage_scales->biodiversity_intactness_loss',
      'wetlands_drainage_scales->freshwater_ecosystem_collapse',
      'wetlands_drainage_scales->carbon_emission',
      'species_range_compression->biodiversity_intactness_loss',
      'wildlife_habitat_patches->species_range_compression',
      'wildlife_habitat_patches->biodiversity_intactness_loss'
    ]
  },
  {
    bundle: 'transport_resilience',
    relationshipType: 'bounded_transport_operational_pathway',
    keys: [
      'freight_electrification_gap->carbon_emission',
      'freight_electrification_gap->ambient_air_quality_deficit',
      'temp->port_heat_vulnerability',
      'port_heat_vulnerability->supply_chain_port_bottlenecks',
      'port_heat_vulnerability->critical_infrastructure_fragility',
      'coastal_inundation_risk->airport_climate_exposure',
      'airport_operational_disruption->supply_chain_port_bottlenecks',
      'airport_operational_disruption->critical_infrastructure_fragility',
      'bridge_scour_exposure->critical_infrastructure_fragility',
      'bridge_scour_exposure->supply_chain_port_bottlenecks',
      'temp->rail_heat_buckling',
      'arctic_shipping_expansion->shipping_lane_disruption',
      'arctic_shipping_expansion->carbon_emission',
      'shipping_lane_disruption->supply_chain_port_bottlenecks',
      'shipping_lane_disruption->food_import_exposure',
      'shipping_lane_disruption->critical_infrastructure_fragility',
      'road_freight_diesel_lock_in->carbon_emission'
    ]
  },
  {
    bundle: 'agriculture_food',
    relationshipType: 'bounded_food_system_pathway',
    keys: [
      'temp->farm_heat_stress',
      'farm_heat_stress->crop_yield_volatility',
      'farm_heat_stress->agricultural_labor_exposure',
      'temp->livestock_disease_pressure',
      'livestock_disease_pressure->food',
      'livestock_disease_pressure->food_import_exposure',
      'fertilizer_price_shock->crop_yield_volatility',
      'fertilizer_price_shock->food',
      'feed_crop_dependency->crop_yield_volatility',
      'feed_crop_dependency->food_import_exposure',
      'grid_peak_load_stress->cold_chain_failure_risk',
      'agricultural_labor_exposure->crop_yield_volatility',
      'agricultural_labor_exposure->food',
      'industry_farming->topsoil_erosion_acceleration',
      'topsoil_erosion_acceleration->crop_yield_volatility',
      'temp->insect_biomass_decline',
      'industry_farming->insect_biomass_decline',
      'feed_crop_dependency->food',
      'resource_depletion->fertilizer_price_shock',
      'fertilizer_price_shock->food_import_exposure',
      'cold_chain_failure_risk->food',
      'cold_chain_failure_risk->food_import_exposure'
    ]
  },
  {
    bundle: 'cryosphere_system',
    relationshipType: 'bounded_cryosphere_pathway',
    keys: [
      'carbon_emission->ice_sheet_mass_loss',
      'temp->sea_ice_season_loss',
      'snow_drought->river_flow_regime_shift',
      'snow_drought->reservoir_storage_instability',
      'thermokarst_expansion->methane',
      'temp->firn_layer_depletion',
      'firn_layer_depletion->glacier_meltwater_dependency',
      'ice_sheet_mass_loss->glacier_meltwater_dependency',
      'glacier_meltwater_dependency->hydropower_reliability_decline',
      'glacier_meltwater_dependency->basin_treaty_breakdown',
      'sea_ice_season_loss->polar_infrastructure_failure'
    ]
  },
  {
    bundle: 'governance_risk',
    relationshipType: 'bounded_governance_risk_pathway',
    keys: [
      'temp->vector_borne_disease_expansion',
      'flash_flood_regime->vector_borne_disease_expansion',
      'vector_borne_disease_expansion->disaster_recovery_inequality',
      'food_import_exposure->conflict_risk_escalation',
      'resource_depletion->conflict_risk_escalation',
      'insurance_retreat->mortgage_market_exposure',
      'early_warning_coverage_gaps->disaster_recovery_inequality',
      'critical_infrastructure_fragility->climate_litigation_pressure',
      'coastal_inundation_risk->coastal_property_insurance_redlines'
    ]
  },
  {
    bundle: 'carbon_cycle',
    relationshipType: 'bounded_carbon_cycle_feedback',
    keys: [
      'temp->land_carbon_sink_weakening',
      'deforestation->land_carbon_sink_weakening',
      'land_carbon_sink_weakening->temp',
      'temp->ocean_carbon_uptake_weakening',
      'ocean_salinity_stratification->ocean_carbon_uptake_weakening',
      'ocean_carbon_uptake_weakening->temp',
      'drought_persistence->peat_oxidation_pulse',
      'wetlands_drainage_scales->peat_oxidation_pulse',
      'peat_oxidation_pulse->carbon_emission',
      'coastal_inundation_risk->tidal_wetland_carbon_reversal',
      'wetlands_drainage_scales->tidal_wetland_carbon_reversal',
      'tidal_wetland_carbon_reversal->carbon_emission'
    ]
  }
];

const RESEARCHED_FAMILY_BATCH_03_DIRECT_EDGE_KEYS = new Set([
  'drought_persistence->soil_moisture_collapse',
  'irrigation_water_inefficiency->aquifer_overdraft',
  'snowmelt_timing_shift->river_flow_regime_shift',
  'glacial_lake_failure_risk->hydrological_runoff_surges',
  'deforestation->forest_fragmentation',
  'marine_heatwaves->reef_structural_collapse',
  'topsoil_erosion_acceleration->soil_humus_decline',
  'wetlands_drainage_scales->carbon_emission',
  'freight_electrification_gap->carbon_emission',
  'temp->rail_heat_buckling',
  'road_freight_diesel_lock_in->carbon_emission',
  'farm_heat_stress->crop_yield_volatility',
  'industry_farming->topsoil_erosion_acceleration',
  'temp->sea_ice_season_loss',
  'insurance_retreat->mortgage_market_exposure',
  'deforestation->land_carbon_sink_weakening',
  'wetlands_drainage_scales->peat_oxidation_pulse',
  'peat_oxidation_pulse->carbon_emission',
  'tidal_wetland_carbon_reversal->carbon_emission'
]);

const RESEARCHED_FAMILY_BATCH_03_EDGE_SOURCE_OVERRIDES = {
  'wetlands_drainage_scales->carbon_emission': [
    'https://www.ipcc-nggip.iges.or.jp/public/wetlands/pdf/Wetlands_separate_files/WS_Chp2_Drained_Inland_Organic_Soils.pdf',
    'https://www.fao.org/4/i3013e/i3013e.pdf',
    'https://www.unep.org/news-and-stories/story/seven-things-you-should-know-about-peatlands'
  ],
  'temp->rail_heat_buckling': [
    'https://www.networkrail.co.uk/rail-travel/delays-explained/buckled-rail-and-summer-heat/'
  ],
  'freight_electrification_gap->carbon_emission': [
    'https://www.epa.gov/regulations-emissions-vehicles-and-engines/regulations-greenhouse-gas-emissions-commercial-trucks'
  ],
  'freight_electrification_gap->ambient_air_quality_deficit': [
    'https://www.epa.gov/regulations-emissions-vehicles-and-engines/regulations-greenhouse-gas-emissions-commercial-trucks'
  ],
  'road_freight_diesel_lock_in->carbon_emission': [
    'https://www.epa.gov/transportation-air-pollution-and-climate-change/carbon-pollution-transportation'
  ]
};

const RESEARCHED_FAMILY_BATCH_03_EDGE_EVIDENCE_PROFILES = Object.fromEntries(
  RESEARCHED_FAMILY_BATCH_03_GROUPS.flatMap(group => group.keys.map(key => {
    const edge = BASE_EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
    if (!edge) throw new Error(`Missing researched batch 03 edge: ${key}`);
    const isDirect = RESEARCHED_FAMILY_BATCH_03_DIRECT_EDGE_KEYS.has(key);
    return [key, {
      source_status: isDirect ? 'curated_edge_reference' : 'curated_local_reference',
      source_urls: RESEARCHED_FAMILY_BATCH_03_EDGE_SOURCE_OVERRIDES[key]
        || RESEARCHED_EDGE_SOURCE_BUNDLES[group.bundle],
      notes: `Research supports this ${isDirect ? 'direct' : 'bounded'} pathway: ${edge.source} ${edge.verb} ${edge.target} ${edge.adverb}.`,
      relationship_type: group.relationshipType,
      confidence: isDirect ? 'high' : 'moderate'
    }];
  }))
);

const RESIDUAL_EXPANSION_EDGE_EVIDENCE_PROFILES = {
  ['temp->tundra_methane_outgassing']: CURATED_EDGE_EVIDENCE_PROFILES['temp->tundra_methane_outgassing'],
  ['temp->ice_albedo_feedback_loops']: CURATED_EDGE_EVIDENCE_PROFILES['temp->ice_albedo_feedback_loops'],
  ['temp->alpine_snowpack_declines']: CURATED_EDGE_EVIDENCE_PROFILES['temp->alpine_snowpack_declines'],
  ['temp->pingo_explosions']: CURATED_EDGE_EVIDENCE_PROFILES['temp->pingo_explosions'],
  ['temp->arctic_amplification_rates']: CURATED_EDGE_EVIDENCE_PROFILES['temp->arctic_amplification_rates'],
  ['temp->mountain_pass_avalanches']: CURATED_EDGE_EVIDENCE_PROFILES['temp->mountain_pass_avalanches'],
  ['temp->ice_shelf_grounding_line_retreat']: CURATED_EDGE_EVIDENCE_PROFILES['temp->ice_shelf_grounding_line_retreat'],
  ['temp->tundra_thermokarst_development']: CURATED_EDGE_EVIDENCE_PROFILES['temp->tundra_thermokarst_development'],
  ['temp->arctic_pack_ice_drift']: CURATED_EDGE_EVIDENCE_PROFILES['temp->arctic_pack_ice_drift'],
  ['temp->cryoconite_hole_expansion']: CURATED_EDGE_EVIDENCE_PROFILES['temp->cryoconite_hole_expansion'],
  ['temp->boreal_peat_defrosting']: CURATED_EDGE_EVIDENCE_PROFILES['temp->boreal_peat_defrosting'],
  ['temp->ice_algae_pigmentation']: CURATED_EDGE_EVIDENCE_PROFILES['temp->ice_algae_pigmentation'],
  ['temp->glacier_hydrologic_system_floods']: CURATED_EDGE_EVIDENCE_PROFILES['temp->glacier_hydrologic_system_floods'],
  ['temp->ice_cap_decapitation']: CURATED_EDGE_EVIDENCE_PROFILES['temp->ice_cap_decapitation'],
  ['temp->nunatak_habitat_shrinkage']: CURATED_EDGE_EVIDENCE_PROFILES['temp->nunatak_habitat_shrinkage'],
  ['temp->fjord_sedimentation_pulses']: CURATED_EDGE_EVIDENCE_PROFILES['temp->fjord_sedimentation_pulses'],
  ['temp->freeze_thaw_rock_fracturing']: CURATED_EDGE_EVIDENCE_PROFILES['temp->freeze_thaw_rock_fracturing'],
  ['temp->tundra_shrubification_speeds']: CURATED_EDGE_EVIDENCE_PROFILES['temp->tundra_shrubification_speeds'],
  'temp->drought_persistence': {
    source_status: 'curated_edge_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/',
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/'
    ],
    notes: 'Warming increases atmospheric evaporative demand and can intensify or prolong agricultural and ecological drought where precipitation does not compensate.',
    relationship_type: 'conditional_climate_mechanism',
    confidence: 'high'
  },
  'adaptation_capital_shortfall->relocation_governance_capacity': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/',
      'https://www.ipcc.ch/report/ar6/wg2/chapter/technical-summary/'
    ],
    notes: 'Insufficient adaptation finance constrains planning, compensation, infrastructure, and institutional capacity for equitable relocation; outcomes remain governance-dependent.',
    relationship_type: 'bounded_governance_capacity_pathway',
    confidence: 'moderate'
  },
  'amoc->coastal_inundation_risk': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
      'https://oceanservice.noaa.gov/facts/sealevel.html'
    ],
    notes: 'AMOC variability can alter regional dynamic sea level along parts of the North Atlantic coast, changing inundation risk without determining global coastal outcomes.',
    relationship_type: 'bounded_regional_sea_level_pathway',
    confidence: 'moderate'
  },
  'marine_fisheries_collapse->fishery_protein_dependence': {
    source_status: 'curated_local_reference',
    source_urls: [
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
      'https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture'
    ],
    notes: 'Declining fishery availability raises food-security exposure where fish supplies a large share of dietary protein or household income; effects depend on substitution and trade.',
    relationship_type: 'bounded_food_security_pathway',
    confidence: 'moderate'
  }
};

const OCEAN_REHABILITATION_NODE_IDS = new Set([
  'harmful_algal_blooms',
  'marine_heatwaves',
  'coral_bleaching',
  'coral_larval_mortality',
  'coral_reef_fragmentation',
  'fisheries_range_redistribution',
  'phytoplankton_decline',
  'shelf_sea_hypoxia',
  'estuarine_nursery_loss',
  'mangrove_destruction',
  'ocean_current_regime_shift',
  'marine_food_web_simplification',
  'ocean_salinity_stratification',
  'pelagic_species_redistribution',
  'littoral_surge_vulnerability',
  'fish_landing_supply_disruption'
]);

const CRYOSPHERE_REHABILITATION_NODE_IDS = new Set([
  'coastal_inundation_risk',
  'arctic_sea_ice_thinning',
  'sea_ice_extent_deficits',
  'arctic_ice_retreat',
  'greenland_glacier_melting',
  'glacier_calving_events',
  'ice_sheet_thinning_speeds',
  'subglacial_lake_drainages',
  'glacial_lake_outburst_floods',
  'nunatak_habitat_shrinkage',
  'snowmelt_timing_shift',
  'snow_drought',
  'thermokarst_expansion',
  'firn_layer_depletion',
  'glacial_lake_failure_risk',
  'freshwater_lens_compression',
  'glacier_meltwater_dependency'
]);

const ATMOSPHERIC_REHABILITATION_NODE_IDS = new Set([
  'flash_flood_regime',
  'blocking_pattern_persistence',
  'humidity_amplification',
  'lightning_fire_weather',
  'atmospheric_dryness',
  'soot_deposition_on_snow',
  'ozone_formation_pressure',
  'rossby_wave_stalling',
  'smoke_exposure_burden',
  'low_cloud_deck_retreat',
  'tropospheric_ozone',
  'ground_level_ozone_triggers',
  'aerosol_scattering_index',
  'secondary_organic_aerosol_burden',
  'particulate_soot_levels',
  'pm2_5_particulates',
  'stratospheric_water_vapor',
  'stratospheric_cooling',
  'acid_rain_deposition',
  'aerosolized_microplastics'
]);

const BIODIVERSITY_REHABILITATION_NODE_IDS = new Set([
  'soil_humus_decline',
  'insect_biomass_decline',
  'watershed_forest_loss',
  'pollinator_colony_collapse',
  'seed_germination_drops',
  'wildlife_habitat_patches',
  'biodiversity_corridors_disruption',
  'invasive_species_encroachment',
  'monoculture_encroachments',
  'macrofungal_mycelium_decay',
  'lichen_layer_degradations',
  'top_predator_extinctions'
]);

const INFRASTRUCTURE_REHABILITATION_NODE_IDS = new Set([
  'rail_heat_buckling',
  'aviation_demand_growth',
  'supply_chain_port_bottlenecks',
  'commuter_rail_transit_gaps',
  'railroad_chemical_car_derailments',
  'aviation_condensation_trails',
  'aviation_jet_fuel_emissions',
  'transformer_heat_failure_risk',
  'gas_pipeline_leak_points',
  'freight_electrification_gap',
  'port_heat_vulnerability',
  'airport_climate_exposure',
  'airport_operational_disruption',
  'bridge_scour_exposure',
  'arctic_shipping_expansion'
]);

const ENERGY_INDUSTRIAL_REHABILITATION_NODE_IDS = new Set([
  'cement_process_emissions',
  'industrial_heat_decarbonization_gap',
  'steel_decarbonization_gap',
  'peaker_plant_lock_in',
  'transformer_supply_bottleneck',
  'gas_power_dependence',
  'energy_affordability_crisis',
  'utility_disconnection_risk',
  'backup_generator_dependence',
  'critical_mineral_extraction_pressure',
  'renewable_curtailment_losses',
  'battery_supply_chain_pressure'
]);

function getRehabilitationCluster(edge) {
  if (!edge) return '';
  if (OCEAN_REHABILITATION_NODE_IDS.has(edge.source) || OCEAN_REHABILITATION_NODE_IDS.has(edge.target)) {
    return 'ocean';
  }
  if (CRYOSPHERE_REHABILITATION_NODE_IDS.has(edge.source) || CRYOSPHERE_REHABILITATION_NODE_IDS.has(edge.target)) {
    return 'cryosphere';
  }
  if (ATMOSPHERIC_REHABILITATION_NODE_IDS.has(edge.source) || ATMOSPHERIC_REHABILITATION_NODE_IDS.has(edge.target)) {
    return 'atmosphere';
  }
  if (BIODIVERSITY_REHABILITATION_NODE_IDS.has(edge.source) || BIODIVERSITY_REHABILITATION_NODE_IDS.has(edge.target)) {
    return 'biodiversity';
  }
  if (INFRASTRUCTURE_REHABILITATION_NODE_IDS.has(edge.source) || INFRASTRUCTURE_REHABILITATION_NODE_IDS.has(edge.target)) {
    return 'infrastructure';
  }
  if (ENERGY_INDUSTRIAL_REHABILITATION_NODE_IDS.has(edge.source) || ENERGY_INDUSTRIAL_REHABILITATION_NODE_IDS.has(edge.target)) {
    return 'energy_industry';
  }
  return '';
}

const REVIEWED_EXPANSION_NODE_IDS = new Set([
  // Ocean nodes with researched physical, ecological, or operational neighborhoods.
  'oceanic_deoxygenation',
  'antarctic_bottom_water_decline',
  'ocean_acidification',
  'pacific_decadal_oscillation',
  'atlantic_multidecadal_oscillation',
  'atlantic_ni_o_ni_a',
  'indian_ocean_dipole',
  'marine_fisheries_collapse',
  'fish_landing_supply_disruption',
  'ocean_current_regime_shift',
  'coastal_hypoxia',
  'marine_food_web_simplification',
  'ocean_salinity_stratification',
  'harmful_algal_blooms',
  'pelagic_species_redistribution',
  'littoral_surge_vulnerability',

  // Atmosphere nodes with researched forcing or explicitly associative teleconnection links.
  'humidity_amplification',
  'atmospheric_dryness',
  'lightning_fire_weather',
  'soot_deposition_on_snow',
  'ozone_formation_pressure',
  'smoke_exposure_burden',
  'compound_day_night_heat_extremes',
  'nocturnal_heat_stress',
  'blocking_pattern_persistence',
  'hail_hazard_shift',
  'madden_julian_oscillation',
  'north_atlantic_oscillation',
  'arctic_oscillation',
  'pacific_north_american_pattern',
  'southern_annular_mode',
  'quasi_biennial_oscillation',
  'rossby_wave_stalling',
  'low_cloud_deck_retreat',
  'aerosol_cooling_loss',

  // Energy nodes with equipment, emissions, supply-chain, or service-consequence links.
  'grid_peak_load_stress',
  'peaker_plant_lock_in',
  'transmission_buildout_lag',
  'transformer_supply_bottleneck',
  'gas_power_dependence',
  'industrial_heat_decarbonization_gap',
  'cement_process_emissions',
  'steel_decarbonization_gap',
  'critical_mineral_extraction_pressure',
  'battery_supply_chain_pressure',
  'semiconductor_fabrication_footprint',
  'cooling_water_competition',
  'backup_generator_dependence',
  'energy_affordability_crisis',
  'utility_disconnection_risk',
  'renewable_curtailment_losses',

  // Water, biosphere, transport, agriculture, cryosphere, governance, and carbon batch 03.
  'river_flow_regime_shift', 'reservoir_storage_instability', 'soil_moisture_collapse',
  'freshwater_lens_compression', 'irrigation_water_inefficiency', 'basin_treaty_breakdown',
  'desalination_dependence', 'reservoir_operating_shortfall', 'snowmelt_timing_shift',
  'glacial_lake_failure_risk', 'aquifer_overdraft', 'hydropower_reliability_decline',
  'drinking_water_treatment_stress', 'wastewater_bypass_discharge',
  'freshwater_ecosystem_collapse', 'forest_fragmentation', 'pollinator_service_decline',
  'urban_tree_canopy_loss', 'mangrove_buffer_loss', 'reef_structural_collapse',
  'insect_biomass_decline', 'soil_humus_decline', 'riverine_habitat_fragmentation',
  'wildfire_regime_shift', 'wetlands_drainage_scales', 'biodiversity_intactness_loss',
  'wildlife_habitat_patches', 'species_range_compression',
  'shipping_lane_disruption', 'road_freight_diesel_lock_in', 'airport_operational_disruption',
  'bridge_scour_exposure', 'rail_heat_buckling', 'freight_electrification_gap',
  'airport_climate_exposure', 'aviation_demand_growth', 'supply_chain_port_bottlenecks',
  'port_heat_vulnerability', 'arctic_shipping_expansion',
  'crop_yield_volatility', 'farm_heat_stress', 'livestock_disease_pressure',
  'fertilizer_price_shock', 'feed_crop_dependency', 'cold_chain_failure_risk',
  'agricultural_labor_exposure', 'topsoil_erosion_acceleration', 'food_import_exposure',
  'sea_ice_season_loss', 'ice_sheet_mass_loss', 'thermokarst_expansion',
  'polar_infrastructure_failure', 'firn_layer_depletion', 'glacier_meltwater_dependency',
  'critical_infrastructure_fragility', 'vector_borne_disease_expansion',
  'conflict_risk_escalation', 'mortgage_market_exposure', 'early_warning_coverage_gaps',
  'climate_litigation_pressure', 'insurance_retreat', 'coastal_property_insurance_redlines',
  'disaster_recovery_inequality', 'tidal_wetland_carbon_reversal', 'peat_oxidation_pulse',
  'ocean_carbon_uptake_weakening', 'land_carbon_sink_weakening'
]);

function isReviewedExpansionResidue(edge) {
  if (!['expansion_inbound', 'expansion_inbound_semantic', 'expansion_outbound'].includes(edge?.topology_rule)) {
    return false;
  }
  return REVIEWED_EXPANSION_NODE_IDS.has(edge.source)
    || REVIEWED_EXPANSION_NODE_IDS.has(edge.target);
}

const SUPPRESSED_EDGE_KEYS = new Set([
  // Residual expansion claims that skip a necessary physical, operational, or governance mechanism.
  'resource_depletion->flash_flood_regime',
  'carbon_emission->flash_flood_regime',
  'flash_flood_regime->migration',
  'flash_flood_regime->industry_farming',
  'flash_flood_regime->food',
  'resource_depletion->drought_persistence',
  'environ_anomalies->drought_persistence',
  'drought_persistence->migration',
  'drought_persistence->industry_farming',
  'drought_persistence->food',
  'resource_depletion->watershed_forest_loss',
  'industry_farming->watershed_forest_loss',
  'watershed_forest_loss->food',
  'resource_depletion->wastewater_infrastructure_overflow',
  'temp->wastewater_infrastructure_overflow',
  'wastewater_infrastructure_overflow->migration',
  'wastewater_infrastructure_overflow->food',
  'permafrost_thaw->coastal_inundation_risk',
  'coastal_inundation_risk->migration',
  'coastal_inundation_risk->resource_depletion',
  'coastal_inundation_risk->food',
  'thermal_stratification_intensification->mangrove_destruction',
  'thermal_stratification_intensification->marine_biodeposits_loss',
  'thermal_stratification_intensification->oceanic_thermal_expansion',
  'thermal_stratification_intensification->coastal_overfishing_scars',
  'thermal_stratification_intensification->oceanic_carbon_sink_saturation',
  'thermal_stratification_intensification->invasive_seaweed_blooms',
  'thermal_stratification_intensification->marine_mammal_migration_drifts',
  'thermal_stratification_intensification->phytoplankton_photosynthesis_block',
  'delta_salt_intrusion_fronts->shell_calcification_failures',
  'delta_salt_intrusion_fronts->marine_biome_displacement',
  'delta_salt_intrusion_fronts->brine_discharge_siltation',
  'delta_salt_intrusion_fronts->compound_coastal_flooding',
  'delta_salt_intrusion_fronts->fisheries_range_redistribution',
  'oceanic_upwelling_disruptions->deep_sea_mining_dust',
  'oceanic_upwelling_disruptions->storm_surge_floods',
  'wastewater_bypass_discharge->fracking_wastewater_lakes',
  'wastewater_bypass_discharge->combined_sewer_overflow',
  'carbon_emission->snow_drought',
  'permafrost_thaw->snow_drought',
  'snow_drought->migration',
  'snow_drought->resource_depletion',
  'snow_drought->environ_anomalies',
  'snow_drought->food',
  'environ_anomalies->fishery_protein_dependence',
  'food->fishery_protein_dependence',
  'environ_anomalies->public_health_heat_burden',
  'urbanization->public_health_heat_burden',
  'resource_depletion->public_health_heat_burden',
  'environ_anomalies->adaptation_capital_shortfall',
  'resource_depletion->adaptation_capital_shortfall',
  'environ_anomalies->relocation_governance_capacity',
  'urbanization->relocation_governance_capacity',
  'coral_bleaching->asphalt_pavement_heat_absorbers',
  'coral_larval_mortality->drip_irrigation_siltation',
  'coral_reef_fragmentation->hydro_hegemony_river_tensions',
  'arctic_sea_ice_thinning->la_nina',
  'greenland_glacier_melting->el_nino',
  'glacier_calving_events->road_freight_diesel_lock_in',
  'nunatak_habitat_shrinkage->temp',
  'mangrove_destruction->amoc',
  'aerosol_scattering_index->geothermal_gas_outflow',
  'particulate_soot_levels->rail_heat_buckling',
  'pm2_5_particulates->port_heat_vulnerability',
  'supply_chain_port_bottlenecks->dense_rack_power_demand',
  'aviation_condensation_trails->rail_heat_buckling',
  'transformer_heat_failure_risk->urban_parking_lot_sprawls',
  'peaker_plant_lock_in->aviation_demand_growth',
  'gas_power_dependence->aviation_demand_growth',
  'critical_mineral_extraction_pressure->aviation_demand_growth',
  'steel_decarbonization_gap->road_freight_diesel_lock_in',
  'desalination_dependence->transformer_supply_bottleneck',
  'adaptation_capital_shortfall->cement_process_emissions',
  'basin_treaty_breakdown->cement_process_emissions',
  'freshwater_ecosystem_collapse->gas_power_dependence',
  'grid_peak_load_stress->flash_flood_regime',
  'flash_flood_regime->conflict_risk_escalation',
  'flash_flood_regime->fishery_protein_dependence',
  'flash_flood_regime->relocation_governance_capacity',
  'rail_heat_buckling->lightning_fire_weather',
  'tropospheric_ozone->thermal_inversion_events',
  'tropospheric_ozone->methane',
  'ground_level_ozone_triggers->desalination_intake_disruptions',
  'ground_level_ozone_triggers->road_freight_diesel_lock_in',
  'watershed_forest_loss->conflict_risk_escalation',
  'watershed_forest_loss->farm_heat_stress',
  'watershed_forest_loss->food_import_exposure',
  'coastal_inundation_risk->basin_treaty_breakdown',
  'coastal_inundation_risk->environ_anomalies',
  'coastal_inundation_risk->food_import_exposure',
  'harmful_algal_blooms->aquifer_overdraft',
  'harmful_algal_blooms->migration',
  'aviation_demand_growth->semiconductor_fabrication_footprint',
  'aviation_demand_growth->heavy_truck_diesel_exhaust',
  'aviation_demand_growth->shipping_lane_disruption',
  'solar_panel_refining_waste->aviation_demand_growth',
  'asphalt_pavement_heat_absorbers->aviation_demand_growth',
  'palm_oil_canopy_clearance->aviation_demand_growth',
  'inland_waterway_fuel_spills->aviation_demand_growth',
  'urban_parking_lot_sprawls->aviation_demand_growth',
  'automotive_brake_dust_particulates->aviation_demand_growth',
  'black_carbon_deposition->aviation_demand_growth',
  'fugitive_dust_from_dirt_roads->aviation_demand_growth',
  'biofuel_crop_land_grab->aviation_demand_growth',
  'data_center_backup_diesel_emissions->aviation_demand_growth',
  'monsoonal_wind_shear->aviation_demand_growth',
  'agricultural_crop_insurance_hikes->rail_heat_buckling',
  'managed_retreat_pressure->rail_heat_buckling',
  'cooling_equity_gaps->rail_heat_buckling',
  'hydrofluorocarbon_output->rail_heat_buckling',
  'snowmelt_timing_shift->relocation_governance_capacity',
  'snowmelt_timing_shift->industry_farming',
  'snowmelt_timing_shift->cold_chain_failure_risk',
  'snowmelt_timing_shift->urbanization',
  'snowmelt_timing_shift->food_import_exposure',
  'snowmelt_timing_shift->public_health_heat_burden',
  'glacial_lake_failure_risk->conflict_risk_escalation',
  'glacial_lake_failure_risk->freshwater_ecosystem_collapse',
  'glacial_lake_failure_risk->environ_anomalies',
  'glacial_lake_failure_risk->farm_heat_stress',
  'glacial_lake_failure_risk->shipping_lane_disruption',
  'glacial_lake_failure_risk->food',
  'freshwater_lens_compression->vector_borne_disease_expansion',
  'freshwater_lens_compression->urbanization',
  'freshwater_lens_compression->conflict_risk_escalation',
  'freshwater_lens_compression->public_health_heat_burden',
  'snow_drought->glacier_meltwater_dependency',
  'firn_layer_depletion->migration',
  'firn_layer_depletion->basin_treaty_breakdown',
  'firn_layer_depletion->environ_anomalies',
  'glacier_meltwater_dependency->migration',
  'glacier_meltwater_dependency->crop_yield_volatility',
  'glacier_meltwater_dependency->environ_anomalies',
  'glacier_meltwater_dependency->critical_infrastructure_fragility',
  'glacier_meltwater_dependency->shipping_lane_disruption',
  'glacier_meltwater_dependency->food',
  'port_heat_vulnerability->drought_persistence',
  'port_heat_vulnerability->basin_treaty_breakdown',
  'port_heat_vulnerability->aviation_demand_growth',
  'port_heat_vulnerability->environ_anomalies',
  'port_heat_vulnerability->urbanization',
  'port_heat_vulnerability->food',
  'port_heat_vulnerability->migration',
  'carbon_emission->ocean_current_regime_shift',
  'la_nina->ocean_current_regime_shift',
  'marine_food_web_simplification->food',
  'marine_food_web_simplification->environ_anomalies',
  'marine_food_web_simplification->resource_depletion',
  'marine_food_web_simplification->coastal_hypoxia',
  'marine_food_web_simplification->shipping_lane_disruption',
  'marine_food_web_simplification->migration',
  'species_range_compression->resource_depletion',
  'species_range_compression->food',
  'species_range_compression->migration',
  'species_range_compression->public_health_heat_burden',
  'species_range_compression->environ_anomalies',
  'species_range_compression->critical_infrastructure_fragility',
  'reservoir_storage_instability->disaster_recovery_inequality',
  'reservoir_storage_instability->vector_borne_disease_expansion',
  'reservoir_storage_instability->urbanization',
  'reservoir_storage_instability->farm_heat_stress',
  'reservoir_storage_instability->public_health_heat_burden',
  'wastewater_infrastructure_overflow->disaster_recovery_inequality',
  'wastewater_infrastructure_overflow->industry_farming',
  'wastewater_infrastructure_overflow->fishery_protein_dependence',
  'wastewater_infrastructure_overflow->urbanization',
  'wastewater_infrastructure_overflow->farm_heat_stress',
  'wastewater_infrastructure_overflow->public_health_heat_burden',
  'polar_infrastructure_failure->conflict_risk_escalation',
  'polar_infrastructure_failure->freshwater_ecosystem_collapse',
  'polar_infrastructure_failure->environ_anomalies',
  'polar_infrastructure_failure->food',
  'energy_affordability_crisis->cooling_water_competition',
  'energy_affordability_crisis->resource_depletion',
  'energy_affordability_crisis->urbanization',
  'energy_affordability_crisis->critical_infrastructure_fragility',
  'energy_affordability_crisis->insurance_retreat',
  'urban_tree_canopy_loss->resource_depletion',
  'urban_tree_canopy_loss->food',
  'urban_tree_canopy_loss->migration',
  'urban_tree_canopy_loss->public_health_heat_burden',
  'urban_tree_canopy_loss->environ_anomalies',
  'urban_tree_canopy_loss->critical_infrastructure_fragility',
  'aquifer_overdraft->fishery_protein_dependence',
  'glacial_lake_failure_risk->fishery_protein_dependence',
  'industry_farming->fishery_protein_dependence',
  'temp->fishery_protein_dependence',
  'port_heat_vulnerability->fishery_protein_dependence',
  'farm_heat_stress->fishery_protein_dependence',
  'fishery_protein_dependence->food',
  'fishery_protein_dependence->migration',
  'fishery_protein_dependence->resource_depletion',
  'fishery_protein_dependence->urbanization',
  'fishery_protein_dependence->critical_infrastructure_fragility',
  'fishery_protein_dependence->public_health_heat_burden',
  'fishery_protein_dependence->agricultural_labor_exposure',
  'insurance_retreat->urbanization',
  'insurance_retreat->resource_depletion',
  'insurance_retreat->food',
  'insurance_retreat->adaptation_capital_shortfall',
  'insurance_retreat->critical_infrastructure_fragility',
  'mortgage_market_exposure->urbanization',
  'mortgage_market_exposure->resource_depletion',
  'mortgage_market_exposure->food',
  'mortgage_market_exposure->adaptation_capital_shortfall',
  'mortgage_market_exposure->critical_infrastructure_fragility',
  'mortgage_market_exposure->insurance_retreat',
  'mortgage_market_exposure->vector_borne_disease_expansion',
  'mortgage_market_exposure->climate_litigation_pressure',
  'adaptation_capital_shortfall->urbanization',
  'adaptation_capital_shortfall->resource_depletion',
  'adaptation_capital_shortfall->food',
  'adaptation_capital_shortfall->critical_infrastructure_fragility',
  'adaptation_capital_shortfall->insurance_retreat',
  'adaptation_capital_shortfall->construction_concrete_debris',
  'critical_infrastructure_fragility->urbanization',
  'critical_infrastructure_fragility->resource_depletion',
  'critical_infrastructure_fragility->food',
  'biodiversity_intactness_loss->resource_depletion',
  'biodiversity_intactness_loss->food',
  'biodiversity_intactness_loss->migration',
  'biodiversity_intactness_loss->public_health_heat_burden',
  'biodiversity_intactness_loss->environ_anomalies',
  'watershed_forest_loss->migration',
  'watershed_forest_loss->industry_farming',
  'watershed_forest_loss->fishery_protein_dependence',
  'watershed_forest_loss->disaster_recovery_inequality',
  'watershed_forest_loss->critical_infrastructure_fragility',
  'coastal_property_insurance_redlines->urban_water_rationing_zones',
  'coastal_property_insurance_redlines->cold_chain_failure_risk',
  'marine_food_web_simplification->crop_yield_volatility',
  'food_import_exposure->food',
  'food_import_exposure->migration',
  'food_import_exposure->resource_depletion',
  'food_import_exposure->urbanization',
  'food_import_exposure->critical_infrastructure_fragility',
  'food_import_exposure->public_health_heat_burden',
  'migration->resource_depletion',
  'migration->insurance_retreat',
  'migration->mortgage_market_exposure',
  'migration->public_health_heat_burden',
  'migration->vector_borne_disease_expansion',
  'migration->adaptation_capital_shortfall',
  'migration->critical_infrastructure_fragility',
  'migration->conflict_risk_escalation',
  'migration->coastal_property_insurance_redlines',
  'migration->hydro_hegemony_river_tensions',
  'migration->cloud_campus_water_stress',
  'migration->adaptation_financing_gap',
  'public_health_heat_burden->urbanization',
  'public_health_heat_burden->resource_depletion',
  'public_health_heat_burden->food',
  'public_health_heat_burden->coastal_property_insurance_redlines',
  'public_health_heat_burden->adaptation_capital_shortfall',
  'public_health_heat_burden->mortgage_market_exposure',
  'public_health_heat_burden->insurance_retreat',
  'disaster_recovery_inequality->vector_borne_disease_expansion',
  'disaster_recovery_inequality->urbanization',
  'disaster_recovery_inequality->resource_depletion',
  'disaster_recovery_inequality->food',
  'disaster_recovery_inequality->coastal_property_insurance_redlines',
  'disaster_recovery_inequality->adaptation_capital_shortfall',
  'disaster_recovery_inequality->mortgage_market_exposure',
  'disaster_recovery_inequality->insurance_retreat',
  'disaster_recovery_inequality->climate_litigation_pressure',
  'relocation_governance_capacity->urbanization',
  'relocation_governance_capacity->resource_depletion',
  'relocation_governance_capacity->food',
  'relocation_governance_capacity->coastal_property_insurance_redlines',
  'relocation_governance_capacity->adaptation_capital_shortfall',
  'relocation_governance_capacity->mortgage_market_exposure',
  'relocation_governance_capacity->insurance_retreat',
  'relocation_governance_capacity->climate_litigation_pressure',
  'migration->climate_litigation_pressure',
  'environ_anomalies->climate_litigation_pressure',
  'conflict_risk_escalation->climate_litigation_pressure',
  'freshwater_ecosystem_collapse->climate_litigation_pressure',
  'climate_litigation_pressure->urbanization',
  'climate_litigation_pressure->resource_depletion',
  'climate_litigation_pressure->food',
  'climate_litigation_pressure->critical_infrastructure_fragility',

  // Low-confidence anchor-context hypotheses kept out of the live graph until they receive direct relationship evidence.
  'industry_farming->methane',
  'food->industry_farming',
  'industry_farming->food',
  'food->deforestation',
  'deforestation->food',
  'deforestation->urbanization',
  'urbanization->deforestation',
  'fast_fashion->urbanization',
  'urbanization->migration',
  'resource_depletion->migration',
  'carbon_emission->resource_depletion',
  'resource_depletion->carbon_emission',
  'personal_conveyance->carbon_emission',
  'carbon_emission->personal_conveyance',
  'grid_peak_load_stress->wet_bulb_heat',
  'carbon_emission->amoc',
  'sea_ice_season_loss->amoc',
  'amoc->environ_anomalies',
  'data_centers->carbon_emission',
  'data_centers->resource_depletion',
  'ai_data_centers->data_centers',
  'ai_data_centers->carbon_emission',
  'ai_data_centers->semiconductor_fabs',
  'semiconductor_fabs->resource_depletion',
  'semiconductor_fabs->carbon_emission',
  'telecom_backbone->carbon_emission',
  'telecom_backbone->critical_infrastructure_fragility',
  'mobile_wireless_networks->telecom_backbone',
  'mobile_wireless_networks->carbon_emission',
  'internet_exchange_points->telecom_backbone',
  'internet_exchange_points->critical_infrastructure_fragility',
  'subsea_cables->telecom_backbone',
  'subsea_cables->critical_infrastructure_fragility',
  'ocean_acidification->marine_fisheries_collapse',
  'environ_anomalies->industry_farming',
  'environ_anomalies->resource_depletion',
  'shipping->inland_waterway_fuel_spills',
  'personal_conveyance->automotive_brake_dust_particulates',
  'road_freight_diesel_lock_in->fugitive_dust_from_dirt_roads',
  'food->resource_depletion',
  'food->carbon_emission',
  'urbanization->personal_conveyance',
  'urbanization->data_centers',
  'urbanization->resource_depletion',
  'environ_anomalies->migration',
  'environ_anomalies->food',
  'environ_anomalies->urbanization',

  // Curated-local relationships that still need manual source readback before they should count as explainable live links.
  'temp->arctic_pack_ice_drift',
  'temp->cryoconite_hole_expansion',
  'temp->deforestation',
  'temp->fjord_sedimentation_pulses',
  'temp->freeze_thaw_rock_fracturing',
  'temp->glacier_hydrologic_system_floods',
  'temp->ice_algae_pigmentation',
  'temp->ice_cap_decapitation',
  'temp->mountain_pass_avalanches',
  'temp->nunatak_habitat_shrinkage',
  'temp->tundra_shrubification_speeds',
  'temp->urbanization'
]);

function getClusterModeledEdgeNote(edge, sourceNode, targetNode) {
  const cluster = getRehabilitationCluster(edge);
  if (cluster === 'ocean') {
    return `Modelled ocean-stress link aligned to the attached reef, heat, oxygen, fisheries, or mangrove evidence bundles around ${sourceNode?.name || edge.source} and ${targetNode?.name || edge.target}. Treat this as a cluster-supported pathway rather than a stand-alone edge citation.`;
  }
  if (cluster === 'cryosphere') {
    return `Modelled cryosphere link aligned to the attached sea-ice, ice-sheet, or glacier evidence bundles around ${sourceNode?.name || edge.source} and ${targetNode?.name || edge.target}. Treat this as a cluster-supported pathway rather than a stand-alone edge citation.`;
  }
  if (cluster === 'atmosphere') {
    return `Modelled atmospheric link aligned to the attached aerosol, air-pollution, and upper-atmosphere evidence around ${sourceNode?.name || edge.source} and ${targetNode?.name || edge.target}. Treat this as a cluster-supported pathway rather than a stand-alone edge citation.`;
  }
  if (cluster === 'biodiversity') {
    return `Modelled biodiversity link aligned to the attached habitat, pollinator, and ecosystem-fragmentation evidence around ${sourceNode?.name || edge.source} and ${targetNode?.name || edge.target}. Treat this as a cluster-supported pathway rather than a stand-alone edge citation.`;
  }
  if (cluster === 'infrastructure') {
    return `Modelled infrastructure link aligned to the attached transport, grid, and logistics evidence around ${sourceNode?.name || edge.source} and ${targetNode?.name || edge.target}. Treat this as a cluster-supported pathway rather than a stand-alone edge citation.`;
  }
  if (cluster === 'energy_industry') {
    return `Modelled energy-and-industry link aligned to the attached cement, steel, grid-equipment, industrial-heat, or power-transition evidence around ${sourceNode?.name || edge.source} and ${targetNode?.name || edge.target}. Treat this as a cluster-supported pathway rather than a stand-alone edge citation.`;
  }
  return '';
}

function uniqueValues(values) {
  return [...new Set((values || []).filter(Boolean))];
}

export function getRelationshipLevelFromEvidence(evidence = {}) {
  const mode = evidence?.evidence_mode || evidence?.source_status || '';
  const confidence = evidence?.confidence || '';

  if (mode === 'curated_anchor_inference') return 'inferred';

  if (
    mode === 'anchor_context_reference'
    || mode === 'family_reference'
    || mode === 'family_peer_reference'
    || mode === 'family_calibrated_reference'
    || mode === 'generated_anchor_bridge'
    || mode === 'generated_bridge'
    || mode === 'hub_rebalanced'
    || String(mode).startsWith('generated_')
  ) {
    return 'extrapolated';
  }

  if (mode === 'curated_local_reference') return 'indirect';

  if (mode === 'curated_edge_reference') {
    return confidence === 'high' ? 'direct' : 'indirect';
  }

  return 'extrapolated';
}

function getAnchorCalibrationProfile(node) {
  const overrideProfile = NODE_SOURCE_PACK_OVERRIDES[node.id]?.calibration;
  const directProfile = ANCHOR_CALIBRATION_PROFILES[node.id];

  let baseProfile = directProfile;
  if (!baseProfile && node.node_kind === 'response' && node.responseProfile) {
    baseProfile = {
      source_status: 'curated_response_reference',
      source_urls: node.responseProfile.source_urls || [],
      api_keys: node.responseProfile.api_keys || [],
      notes: `${node.name} is an authored climate-response pathway. ${node.responseProfile.notes || ''}`.trim()
    };
  }
  if (!baseProfile) {
    const family = node.expansion?.family;
    const familyProfile = family ? EXPANSION_GROUP_SOURCE_PROFILES[family] : null;
    if (familyProfile) {
      baseProfile = {
        source_status: familyProfile.source_status,
        source_urls: familyProfile.source_urls,
        api_keys: familyProfile.api_keys,
        notes: `${node.name} inherits the ${family.replace(/_/g, ' ')} evidence stack until node-specific references are attached. ${familyProfile.notes}`
      };
    } else {
      baseProfile = {
        source_status: 'undocumented',
        source_urls: [],
        api_keys: [],
        notes: 'No calibration profile attached.'
      };
    }
  }

  if (overrideProfile) {
    return {
      ...baseProfile,
      ...overrideProfile,
      source_urls: uniqueValues([
        ...(baseProfile.source_urls || []),
        ...(overrideProfile.source_urls || [])
      ]),
      api_keys: uniqueValues([
        ...(baseProfile.api_keys || []),
        ...(overrideProfile.api_keys || [])
      ])
    };
  }
  return baseProfile;
}

function buildEdgeEvidenceFromNodes(sourceNode, targetNode, status, notes, extra = {}) {
  const evidenceMode = extra.evidence_mode || status;
  const relationshipLevel = getRelationshipLevelFromEvidence({
    source_status: status,
    evidence_mode: evidenceMode,
    relationship_type: extra.relationship_type,
    confidence: extra.confidence
  });
  const relationshipSourceUrls = ['curated_edge_reference', 'curated_local_reference'].includes(status)
    ? uniqueValues(extra.source_urls || [])
    : [];
  const familySourceUrls = status === 'family_calibrated_reference'
    && ['family_reference', 'family_peer_reference'].includes(evidenceMode)
    ? uniqueValues(extra.source_urls || [])
    : [];
  return {
    source_status: status,
    evidence_mode: evidenceMode,
    relationship_level: relationshipLevel,
    source_urls: uniqueValues([
      ...(sourceNode?.calibration?.source_urls || []),
      ...(targetNode?.calibration?.source_urls || []),
      ...(extra.source_urls || [])
    ]),
    api_keys: uniqueValues([
      ...(sourceNode?.calibration?.api_keys || []),
      ...(targetNode?.calibration?.api_keys || []),
      ...(extra.api_keys || [])
    ]),
    ...(relationshipSourceUrls.length ? { relationship_source_urls: relationshipSourceUrls } : {}),
    ...(familySourceUrls.length ? { family_source_urls: familySourceUrls } : {}),
    ...(extra.relationship_type ? { relationship_type: extra.relationship_type } : {}),
    ...(extra.confidence ? { confidence: extra.confidence } : {}),
    ...(extra.mechanism ? { mechanism: extra.mechanism } : {}),
    notes
  };
}

function attachEdgeEvidence(edge, nodeMap) {
  const sourceNode = nodeMap.get(edge.source);
  const targetNode = nodeMap.get(edge.target);
  const edgeKey = `${edge.source}->${edge.target}`;
  const curatedProfile = RESIDUAL_EXPANSION_EDGE_EVIDENCE_PROFILES[edgeKey]
    || RESEARCHED_FAMILY_BATCH_03_EDGE_EVIDENCE_PROFILES[edgeKey]
    || RESEARCHED_FAMILY_EDGE_EVIDENCE_PROFILES[edgeKey]
    || CURATED_EDGE_EVIDENCE_PROFILES[edgeKey];

  if (curatedProfile) {
    return {
      ...edge,
      ...(['expansion_inbound', 'expansion_inbound_semantic', 'expansion_outbound'].includes(edge.topology_rule)
        ? { topology_rule: 'curated_base', expansion_family: undefined }
        : {}),
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        curatedProfile.source_status,
        curatedProfile.notes,
        curatedProfile
      )
    };
  }

  if (edge.topology_rule === 'response_system') {
    const responseSources = uniqueValues([
      ...(sourceNode?.responseProfile?.source_urls || []),
      ...(targetNode?.responseProfile?.source_urls || [])
    ]);
    const directionNote = edge.influence < 0
      ? 'The signed negative influence denotes a response that reduces or constrains the target pressure.'
      : 'The signed positive influence denotes an enabling, triggering, complementary, or trade-off pathway.';
    const responseVerb = agreeRelationshipVerbPhrase(sourceNode, edge.verb);
    return {
      ...edge,
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        'curated_local_reference',
        `${sourceNode?.name || edge.source} ${responseVerb} ${targetNode?.name || edge.target} ${edge.adverb || ''}. ${directionNote} This is a reviewed system-response pathway supported by the attached sector assessment, not a claim of a universal project-level effect.`.trim(),
        {
          source_urls: responseSources,
          relationship_type: edge.relationship_type || 'response_pathway',
          confidence: edge.confidence || 'medium',
          mechanism: `${edge.verb}${edge.adverb ? ` ${edge.adverb}` : ''}`
        }
      )
    };
  }

  if (edge.topology_rule === 'expansion_inbound' || edge.topology_rule === 'expansion_outbound') {
    const familyProfile = EXPANSION_GROUP_SOURCE_PROFILES[edge.expansion_family];
    return {
      ...edge,
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        familyProfile?.source_status || 'family_calibrated_reference',
        `${targetNode?.name || edge.target} is connected through the ${edge.expansion_family?.replace(/_/g, ' ')} family topology. ${familyProfile?.notes || ''}`.trim(),
        familyProfile || {}
      )
    };
  }

  if (edge.topology_rule === 'anchor_inference') {
    const familyProfile = EXPANSION_GROUP_SOURCE_PROFILES[edge.expansion_family];
    const familyLabel = edge.expansion_family?.replace(/_/g, ' ') || 'domain';
    return {
      ...edge,
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        'curated_anchor_inference',
        `${sourceNode?.name || edge.source} is used as the nearest reviewed anchor for ${targetNode?.name || edge.target} within the ${familyLabel} family. Treat this as an anchor-supported inference rather than a direct or source-entailing causal claim. ${familyProfile?.notes || ''}`.trim(),
        {
          ...(familyProfile || {}),
          evidence_mode: 'curated_anchor_inference',
          relationship_type: 'anchor_supported_inference',
          confidence: 'medium'
        }
      )
    };
  }

  if (edge.topology_rule === 'family_reference' || edge.topology_rule === 'family_peer_reference') {
    const familyProfile = EXPANSION_GROUP_SOURCE_PROFILES[edge.expansion_family];
    const familyLabel = edge.expansion_family?.replace(/_/g, ' ') || 'domain';
    const isPeerReference = edge.topology_rule === 'family_peer_reference';
    return {
      ...edge,
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        familyProfile?.source_status || 'family_calibrated_reference',
        isPeerReference
          ? `${sourceNode?.name || edge.source} and ${targetNode?.name || edge.target} share non-causal evidence context within the ${familyLabel} family. ${familyProfile?.notes || ''}`.trim()
          : `${sourceNode?.name || edge.source} provides non-causal evidence context for ${targetNode?.name || edge.target} within the ${familyLabel} family. ${familyProfile?.notes || ''}`.trim(),
        {
          ...(familyProfile || {}),
          evidence_mode: edge.topology_rule,
          relationship_type: 'family_context',
          confidence: 'medium'
        }
      )
    };
  }

  if (edge.topology_rule === 'generated_intra_sphere') {
    const clusterNote = getClusterModeledEdgeNote(edge, sourceNode, targetNode);
    return {
      ...edge,
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        'generated_topology_inference',
        clusterNote || 'Procedural intra-sphere edge inferred from shared domain calibration and anchor blending. Treat as modelled topology, not a standalone direct empirical claim.',
        { evidence_mode: 'generated_intra_sphere' }
      )
    };
  }

  if (edge.topology_rule === 'generated_inter_sphere') {
    const clusterNote = getClusterModeledEdgeNote(edge, sourceNode, targetNode);
    return {
      ...edge,
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        'generated_topology_inference',
        clusterNote || 'Procedural inter-sphere edge inferred from calibrated cross-domain coupling. Treat as modelled topology, not a standalone direct empirical claim.',
        { evidence_mode: 'generated_inter_sphere' }
      )
    };
  }

  if (edge.topology_rule === 'generated_seed') {
    const clusterNote = getClusterModeledEdgeNote(edge, sourceNode, targetNode);
    return {
      ...edge,
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        'generated_topology_inference',
        clusterNote || `Procedural seed edge connects ${targetNode?.name || edge.target} to the upstream anchor ${sourceNode?.name || edge.source} using semantic keyword routing and sphere-constrained fallback logic. Treat as modelled but plausibility-constrained topology.`,
        { evidence_mode: 'generated_seed' }
      )
    };
  }

  if (edge.topology_rule === 'generated_bridge') {
    const clusterNote = getClusterModeledEdgeNote(edge, sourceNode, targetNode);
    return {
      ...edge,
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        'generated_anchor_bridge',
        clusterNote || `Procedural bridge edge retargeted to the node's calibration anchor (${targetNode?.name || edge.target}) to keep generated topology semantically aligned with its inherited evidence stack.`,
        { evidence_mode: 'generated_bridge' }
      )
    };
  }

  if (edge.topology_rule === 'hub_rebalanced') {
    const clusterNote = getClusterModeledEdgeNote(edge, sourceNode, targetNode);
    return {
      ...edge,
      evidence: buildEdgeEvidenceFromNodes(
        sourceNode,
        targetNode,
        'generated_topology_inference',
        clusterNote || `Procedural edge rerouted during hub decongestion from its original ${edge.original_topology_rule || 'modelled'} path to reduce catch-basin overload while preserving a nearby evidence-compatible anchor relationship.`,
        { evidence_mode: 'hub_rebalanced' }
      )
    };
  }

  return {
    ...edge,
    evidence: buildEdgeEvidenceFromNodes(
      sourceNode,
      targetNode,
      'anchor_context_reference',
      'Low-confidence relationship hypothesis derived from the source and target anchor context. The connected topics remain discoverable, but this direction and mechanism are not asserted as source-entailing until dedicated relationship evidence is attached.',
      {
        evidence_mode: 'anchor_context_reference',
        relationship_type: 'undemonstrated_hypothesis',
        confidence: 'low'
      }
    )
  };
}

const ANCHOR_METRIC_PROFILES = {
  temp: {
    metric_name: 'Global mean temperature anomaly above 1850-1900',
    current_value: 1.43,
    unit: 'degC',
    observed_at: '2025 annual',
    derivation_mode: 'observed_directly',
    thresholds: {
      elevated: 1.0,
      critical: 1.5,
      extreme: 2.0
    }
  },
  methane: {
    metric_name: 'Globally averaged atmospheric methane abundance',
    current_value: 1940.46,
    unit: 'ppb',
    observed_at: '2026-02 monthly mean',
    derivation_mode: 'forcing_proxy',
    thresholds: {
      elevated: 1850,
      critical: 1900,
      extreme: 2000
    }
  },
  carbon_emission: {
    metric_name: 'Mauna Loa monthly average atmospheric CO2 concentration',
    current_value: 432.34,
    unit: 'ppm',
    observed_at: '2026-05 monthly mean',
    derivation_mode: 'forcing_proxy',
    thresholds: {
      elevated: 400,
      critical: 420,
      extreme: 450
    }
  },
  data_centers: {
    metric_name: 'Global data centre electricity consumption',
    current_value: 415,
    unit: 'TWh',
    observed_at: '2024 annual estimate',
    thresholds: {
      elevated: 300,
      critical: 415,
      extreme: 945
    },
    share_of_global_electricity: 1.5
  },
  ai_data_centers: {
    metric_name: 'Estimated AI-related share of total data centre electricity demand',
    current_value: 15,
    unit: 'percent',
    observed_at: '2024 proxy estimate',
    thresholds: {
      elevated: 10,
      critical: 15,
      extreme: 30
    }
  }
};

function calibrateAnchorFromMetrics(node) {
  const profile = ANCHOR_METRIC_PROFILES[node.id];
  if (!profile) return node;

  let vector = node.vector;
  let baseValue = node.baseValue;

  if (node.id === 'temp') {
    const ratio = clamp01(profile.current_value / profile.thresholds.extreme);
    vector = {
      climate_forcing: parseFloat(lerp(0.62, 0.98, ratio).toFixed(2)),
      ecological_damage: parseFloat(lerp(0.50, 0.88, ratio).toFixed(2)),
      human_drivenness: parseFloat(lerp(0.24, 0.45, ratio).toFixed(2)),
      societal_fallout: parseFloat(lerp(0.62, 0.95, ratio).toFixed(2))
    };
    baseValue = Math.round(lerp(34, 60, ratio));
  } else if (node.id === 'methane') {
    const ratio = clamp01((profile.current_value - profile.thresholds.elevated) / (profile.thresholds.extreme - profile.thresholds.elevated));
    vector = {
      climate_forcing: parseFloat(lerp(0.84, 1.0, ratio).toFixed(2)),
      ecological_damage: parseFloat(lerp(0.38, 0.58, ratio).toFixed(2)),
      human_drivenness: parseFloat(lerp(0.68, 0.86, ratio).toFixed(2)),
      societal_fallout: parseFloat(lerp(0.48, 0.68, ratio).toFixed(2))
    };
    baseValue = Math.round(lerp(34, 50, ratio));
  } else if (node.id === 'carbon_emission') {
    const ratio = clamp01((profile.current_value - profile.thresholds.elevated) / (profile.thresholds.extreme - profile.thresholds.elevated));
    vector = {
      climate_forcing: parseFloat(lerp(0.88, 1.0, ratio).toFixed(2)),
      ecological_damage: parseFloat(lerp(0.48, 0.65, ratio).toFixed(2)),
      human_drivenness: parseFloat(lerp(0.80, 0.95, ratio).toFixed(2)),
      societal_fallout: parseFloat(lerp(0.58, 0.84, ratio).toFixed(2))
    };
    baseValue = Math.round(lerp(40, 58, ratio));
  } else if (node.id === 'data_centers') {
    const demandRatio = clamp01(profile.current_value / profile.thresholds.extreme);
    const shareRatio = clamp01((profile.share_of_global_electricity || 0) / 3);
    const composite = (demandRatio * 0.6) + (shareRatio * 0.4);
    vector = {
      climate_forcing: parseFloat(lerp(0.54, 0.78, composite).toFixed(2)),
      ecological_damage: parseFloat(lerp(0.22, 0.46, composite).toFixed(2)),
      human_drivenness: parseFloat(lerp(0.94, 1.0, composite).toFixed(2)),
      societal_fallout: parseFloat(lerp(0.42, 0.66, composite).toFixed(2))
    };
    baseValue = Math.round(lerp(28, 44, composite));
  } else if (node.id === 'ai_data_centers') {
    const ratio = clamp01(profile.current_value / profile.thresholds.extreme);
    vector = {
      climate_forcing: parseFloat(lerp(0.62, 0.84, ratio).toFixed(2)),
      ecological_damage: parseFloat(lerp(0.28, 0.48, ratio).toFixed(2)),
      human_drivenness: parseFloat(lerp(0.97, 1.0, ratio).toFixed(2)),
      societal_fallout: parseFloat(lerp(0.50, 0.72, ratio).toFixed(2))
    };
    baseValue = Math.round(lerp(30, 42, ratio));
  }

  return {
    ...node,
    vector,
    baseValue,
    value: baseValue,
    calibration_metric: profile
  };
}

// --- ECO-SPHERES NOMENCLATURE TEMPLATES ---
const ECO_SPHERES = {
  atmosphere: {
    baseVector: { climate_forcing: 0.95, ecological_damage: 0.45, human_drivenness: 0.45, societal_fallout: 0.85 },
    names: [
      'Stratospheric Aerosols', 'Tropospheric Ozone', 'Nitrous Oxide', 'Sulfur Dioxide',
      'Volatile Organic Compounds', 'PM2.5 Particulates', 'Carbon Monoxide', 'Solar Radiation Trapping',
      'Atmospheric Humidity', 'Jet Stream Volatility', 'Thermal Inversion Events', 'Cloud Albedo Shift',
      'Acid Rain Deposition', 'CFC Saturated Layers', 'Halon Gas Concentrations', 'Ambient Air Quality Deficit',
      'Stratospheric Cooling', 'Smog Density Peak', 'Dust Storm Frequency', 'Pollen Allergen Spikes',
      'Fluorinated Gas Exhaust', 'Hydrofluorocarbon Output', 'Black Carbon Deposition', 'Nitrogen Oxide Saturation',
      'Atmospheric Heat Domers', 'Tropospheric Warming Speeds', 'Haze Density Index', 'Particulate Soot Levels',
      'Aerosol Scattering Index', 'Thermal Air Column Shifts', 'Global Dimming Factor', 'Stratospheric Water Vapor',
      'Convective Instability Shift', 'Nighttime Heat Retention', 'Walker Circulation Shift',
      'Polar Vortex Instabilities', 'Subtropical Jet Drag', 'Monsoonal Wind Shear', 'Aerosolized Microplastics',
      'Brown Carbon Loading', 'Secondary Organic Aerosol Burden', 'Land-Ocean Warming Contrast', 'Lightning Regime Shifts',
      'Urban Heat Dome Stagnation', 'Atmospheric River Intensification', 'Trade Wind Weakening', 'Tropospheric Gas Oxidation',
      'Methane Hydroxyl Sink Loss', 'Stratospheric Chlorine Sinks', 'Ground-Level Ozone Triggers', 'Aviation Condensation Trails',
      'Industrial Flaring Outflow', 'Wildfire Smoke Columns', 'Fugitive Dust Plumes', 'Cloud Feedback Hotspots',
      'Extreme Precipitation Intensity', 'Pyrocumulonimbus Smoke Injection', 'Tropical Cyclone Rapid Intensification'
    ]
  },
  oceans: {
    baseVector: { climate_forcing: 0.65, ecological_damage: 0.95, human_drivenness: 0.35, societal_fallout: 0.88 },
    names: [
      'Ocean Acidification', 'Marine Heatwaves', 'Phytoplankton Decline', 'Coral Bleaching',
      'Sea Level Rise', 'Anoxic Dead Zones', 'Gulf Stream Slowdown', 'Ocean Heat Content',
      'Coastal Erosion', 'Mangrove Destruction', 'Kelp Forest Collapse', 'Deep Sea Mining Dust',
      'Microplastic Suspensions', 'Marine Biodeposits Loss', 'Oceanic Thermal Expansion', 'Salinity Declines',
      'Thermohaline Disruption', 'Coral Reef Fragmentation', 'Coastal Overfishing Scars', 'Estuary Eutrophication',
      'Oceanic Deoxygenation', 'Shell Calcification Failures', 'Marine Biome Displacement', 'Jellyfish Swarm Surges',
      'Oceanic Carbon Sink Saturation', 'Benthic Layer Warming', 'Deep Ocean Heat Sinks', 'Arctic Sea Ice Thinning',
      'Antarctic Shelf Fragmentation', 'Estuarine Nursery Loss', 'Invasive Seaweed Blooms', 'Heavy Metal Bioaccumulation',
      'Pacific Decadal Oscillation', 'Atlantic Multidecadal Oscillation', 'Indian Ocean Dipole', 'Subsea Methane Hydrate Venting',
      'Atlantic Salinity Contrast Shift', 'Storm Surge Floods', 'Coastal Saltwater Intrusion', 'Pelagic Zone Depletion',
      'Subpolar Gyre Weakening', 'Shelf-Sea Hypoxia', 'Coral Larval Mortality', 'Oceanic Upwelling Disruptions',
      'Marine Mammal Migration Drifts', 'Phytoplankton Photosynthesis Block', 'Blue Carbon Habitat Loss',
      'Seaweed Aquaculture Stresses', 'Brine Discharge Siltation', 'Desalination Intake Disruptions',
      'Compound Coastal Flooding', 'Fisheries Range Redistribution', 'Marine Sanctuary Encroachments', 'Coastal Aquifer Degradation',
      'Marine Pathogen Range Expansion', 'Thermal Stratification Intensification', 'Delta Salt Intrusion Fronts'
    ]
  },
  cryosphere: {
    baseVector: { climate_forcing: 0.85, ecological_damage: 0.75, human_drivenness: 0.15, societal_fallout: 0.92 },
    names: [
      'Talik Expansion', 'Arctic Ice Retreat', 'Antarctic Shelf Instability', 'Greenland Glacier Melting',
      'Tundra Methane Outgassing', 'Ice Albedo Feedback Loops', 'Hydrological Runoff Surges', 'Subglacial Lake Drainages',
      'Alpine Snowpack Declines', 'Glacier Calving Events', 'Permafrost Cave-ins', 'Pingo Explosions',
      'Ice Sheet Thinning Speeds', 'Arctic Amplification Rates', 'Frost Heave Soil Anomalies', 'Sea Ice Extent Deficits',
      'Glacial Lake Outburst Floods', 'Mountain Pass Avalanches', 'Ice Shelf Grounding Line Retreat', 'Tundra Thermokarst Development',
      'Subsea Permafrost Decay', 'Arctic Pack Ice Drift', 'Glacial Siltation Streams', 'Cryoconite Hole Expansion',
      'Permafrost Carbon Leaching', 'Winter Ice Road Collapses', 'Sub-polar Soil Instability', 'Boreal Peat Defrosting',
      'Glacial Meltwater Acidification', 'Ice Algae Pigmentation', 'Snowpack Dust Soot Coverage', 'Glacier Hydrologic System Floods',
      'Ice Cap Decapitation', 'Nunatak Habitat Shrinkage', 'Fjord Sedimentation Pulses', 'High-Latitude Runoff Influx',
      'Polar Jet Stream Anchors', 'Freeze-Thaw Rock Fracturing', 'Siberian Permafrost Sinkholes', 'Tundra Shrubification Speeds',
      'Rain-on-Snow Flood Risk', 'Peak Glacier Runoff Passage', 'Coastal Permafrost Erosion'
    ]
  },
  biosphere: {
    baseVector: { climate_forcing: 0.55, ecological_damage: 1.0, human_drivenness: 0.55, societal_fallout: 0.95 },
    names: [
      'Pollinator Colony Collapse', 'Canopy Cover Losses', 'Wildlife Habitat Patches', 'Invasive Species Encroachment',
      'Soil Microbial Depletion', 'Forest Dieback Areas', 'Wildfire Scorched Earth', 'Peatland Degradations',
      'Wetlands Drainage Scales', 'Red List Extinction Rates', 'Trophic Cascade Collapses', 'Seed Germination Drops',
      'Desertification Frontiers', 'Rainforest Savannization', 'Monoculture Encroachments', 'Genetic Diversity Bottlenecks',
      'Understory Moisture Losses', 'Edge Effect Intensifications', 'Illegal Wildlife Poaching', 'Macrofungal Mycelium Decay',
      'Avian Migration Disruptions', 'Amphibian Chytrid Fungus Spreads', 'Boreal Insect Infestations', 'Bark Beetle Epidemics',
      'Old-Growth Forest Logging', 'Grassland Soil Carbon Losses', 'Savannah Tree Cover Decline', 'Dryland Salinization Cracks',
      'Keystone Species Deficits', 'Top Predator Extinctions', 'Ungulate Grazing Path Corridors', 'Wetland Peat Fires',
      'Riparian Zone Erosion', 'Biodiversity Corridors Disruption', 'Lichen Layer Degradations', 'Endemic Species Isolations',
      'Deciduous Leaf Drop Offsets', 'Overstory Tree Mortality', 'Exotic Pathogen Outbreaks', 'Invertebrate Biomass Crash',
      'Migratory Bird Flyway Losses', 'Freshwater Mussel Depletion', 'Riverine Habitat Fragmentation', 'High-Altitude Forest Shrinkage'
    ]
  },
  freshwater: {
    baseVector: { climate_forcing: 0.4, ecological_damage: 0.7, human_drivenness: 0.82, societal_fallout: 0.96 },
    names: [
      'Baseline Water Stress', 'Groundwater Depletion', 'River Flow Regime Change', 'Glacier-Fed Water Dependence',
      'Surface Water Storage Instability', 'Combined Sewer Overflow', 'Floodplain Exposure', 'Waterborne Pathogen Outbreaks',
      'Irrigation Water Efficiency Gaps', 'Drinking Water Treatment Stress', 'Aquifer Recharge Failure', 'Reservoir Storage Volatility'
    ]
  },
  health: {
    baseVector: { climate_forcing: 0.2, ecological_damage: 0.24, human_drivenness: 0.58, societal_fallout: 1.0 },
    names: [
      'Heat-Related Mortality Burden', 'Air Pollution Health Burden', 'Occupational Heat Exposure', 'Vector-Borne Disease Expansion',
      'Health System Climate Resilience Gap', 'Waterborne Disease Risk', 'Clinical Outage Risk', 'Emergency Response Overload',
      'Maternal Heat Risk', 'Wildfire Smoke Hospitalization Burden', 'Healthcare Cooling Dependence', 'Disease Surveillance Gaps'
    ]
  },
  energy: {
    baseVector: { climate_forcing: 0.95, ecological_damage: 0.55, human_drivenness: 0.95, societal_fallout: 0.65 },
    names: [
      'Coal-Fired Power Outflow', 'Fracking Wastewater Lakes', 'Petroleum Drilling Footprints', 'Deepwater Petroleum Spill Risk',
      'Solar Panel Refining Waste', 'Wind Farm Ecosystem Siting', 'Lithium Extraction Brine Pools', 'Uranium Mill Tailings',
      'Electrical Grid Load Sinks', 'Hydroelectric Reservoir Silt', 'Biomass Incinerator Fallout', 'Tar Sands Tailings Ponds',
      'Refinery Waste Flaring', 'Geothermal Gas Outflow', 'Coal Fly Ash Lagoons', 'Gas Pipeline Leak Points',
      'AI Data Center Load Growth', 'Data Center Cooling Water Demand', 'Grid Substation Thermal Strain', 'Fossil Gas Compressor Output',
      'Heavy Fuel Oil Combustion', 'Deepwater Methane Hydrate Drilling', 'Semiconductor Fab Water Demand', 'Semiconductor F-Gas Emissions',
      'Petrochemical Refinery Sludge', 'Biofuel Crop Land Grab', 'Tidal Turbine Marine Hazard', 'Overhead Transmission Line Fires',
      'Transmission Congestion Hotspots', 'Cloud Compute Grid Bottlenecks', 'Nuclear Power Cooling Water Discharge',
      'Data Center Backup Diesel Emissions', 'Pumped Hydro Land Inundations', 'Hydrogen Extraction Coal Reform',
      'Transformer Heat Failure Risk', 'Natural Gas Flaring Stacks', 'Offshore Wind Turbine Noise Vibrations'
    ]
  },
  digital: {
    baseVector: { climate_forcing: 0.72, ecological_damage: 0.36, human_drivenness: 0.98, societal_fallout: 0.72 },
    names: [
      'Hyperscale Server Hall', 'AI Accelerator Cluster', 'Cloud Region Expansion', 'Semiconductor Fab Water Demand',
      'Semiconductor F-Gas Emissions', 'Carrier Hotel Concentration', 'Internet Exchange Load', 'Long-Haul Fiber Backbone',
      'Subsea Cable Landing Chokepoint', 'Mobile Tower Backup Power', 'Radio Access Network Density', 'Data Center Heat Rejection',
      'Cooling Tower Evaporation', 'UPS Battery Hall', 'Switching Node Fragility', 'Edge Compute Load Pocket',
      'Network Operations Center Dependence', 'Dense Rack Power Demand', 'GPU Training Cluster', 'Fiber Route Outage Risk',
      'Carrier Interconnection Bottleneck', 'Cloud Campus Water Stress', 'Chip Packaging Throughput', 'Substation Upgrade Delay',
      'Digital Hardware Refresh Cycle', 'Server Hall Airflow Loss', 'Liquid Cooling Loop Demand', 'Telecom Corridor Congestion'
    ]
  },
  agriculture: {
    baseVector: { climate_forcing: 0.82, ecological_damage: 0.88, human_drivenness: 0.98, societal_fallout: 0.82 },
    names: [
      'Nitrogen Fertilizer Runoff', 'Cattle Grazing Overcompaction', 'Topsoil Salinization Fields', 'Industrial Maize Monocultures',
      'Pesticide Bioaccumulation Chains', 'Manure Lagoon Odors', 'Groundwater Depletion Wells', 'Soy Plantation Encroachments',
      'Rice Paddy Methane Bubbles', 'Confined Pig Farm Effluent', 'Tractor Compacted Subsoils', 'Agrochemical Water Sinks',
      'Genetically Modified Pollen Drift', 'Flood Irrigation Evaporation', 'Slash-and-Burn Ash Cover', 'Palm Oil Canopy Clearance',
      'Rock Phosphate Reserves Runout', 'Ammonia Gas Animal Stalls', 'Industrial Feedlot Feed Conveyors', 'Horticulture Peat Extraction',
      'Cane Field Burning Smoke', 'Agricultural Soil Carbon Venting', 'Orchard Fungicide Drenching', 'Dairy Herd Methane Belches',
      'Broiler Chicken Litter Ash', 'Aquaculture Pond Anti-Parasitics', 'Deep Well Water Table Drops', 'Pesticide Spray Drift Zones',
      'Synthetic Fertilizer N2O Outflow', 'Agricultural Silt Runoff Plumes', 'Beekeeping Colony Loss Rates', 'Desert Boundary Grazing',
      'Vegetational Windbreak Removals', 'Soil Organic Matter Depletion', 'Hillside Cropland Terracing Failure', 'Drip Irrigation Siltation'
    ]
  },
  transport: {
    baseVector: { climate_forcing: 0.85, ecological_damage: 0.42, human_drivenness: 0.92, societal_fallout: 0.72 },
    names: [
      'Aviation Jet Fuel Emissions', 'Cargo Ship Fuel Combustion', 'Heavy Truck Diesel exhaust', 'Metropolitan Gridlock Emissions',
      'EV Battery Metal Chains', 'Airport Runway Canopy Clearance', 'Highway Wildlife Crossings Deficit', 'Tire Microplastic Abrasion',
      'Locomotive Diesel Exhaust', 'Commuter Rail Transit Gaps', 'Supply Chain Port Bottlenecks', 'E-Commerce Delivery Vehicle Miles',
      'Navigational River Channel Dredge', 'Aero-acoustic Jet Noise Plumes', 'Asphalt Pavement Heat Absorbers', 'Freeway Acoustic Walls Deficit',
      'Inland Waterway Fuel Spills', 'Railroad Chemical Car Derailments', 'Urban Parking Lot Sprawls', 'Recreational Boating Fuel Leakage',
      'Automotive Brake Dust Particulates', 'Bulk Ore Carrier Cargo Spills', 'Fugitive Dust From Dirt Roads', 'Cold-Chain Refrigerant Leaks',
      'Aviation Sulphate Particle Layer', 'Supertanker Sound Waves', 'Urban Commuting Time Traps', 'Expressway Land Encroachments'
    ]
  },
  economy: {
    baseVector: { climate_forcing: 0.88, ecological_damage: 0.78, human_drivenness: 0.96, societal_fallout: 0.76 },
    names: [
      'E-Waste Processing Scrap', 'Single-Use Plastic Volume', 'Steel Furnace Carbon Vent', 'Cement Clinker Kiln Calcination',
      'Landfill Methane Outflows', 'Textile Factory Toxic Dyes', 'Blast Furnace Industrial Slag', 'Chemical Factory Acid Spills',
      'Paper Mill Effluent Streams', 'Consumer Product Obsolescence', 'Commercial Refrigeration Freon Leaks', 'Aluminum Smelter Slurry Ponds',
      'Flame Retardant Runoff', 'Petrochemical Plastics Synthesis', 'Industrial Leather Tanning Acids', 'Glass Furnace Combustion Sinks',
      'Electronics Solvents Leachate', 'Copper Smelter Acid Rainfall', 'Supermarket Food Waste Dump', 'Unsold Apparel Incineration',
      'Industrial Boiler Ash Sites', 'E-Waste Lead Soil Bleeding', 'Landfill Heavy Metal Leachate', 'Paint Factory Solvent Smog',
      'Construction Concrete Debris', 'Packaging Styrofoam Oceans', 'Textile Microfiber Shedding', 'Industrial Solvent Vapors'
    ]
  },
  sociopolitical: {
    baseVector: { climate_forcing: 0.48, ecological_damage: 0.38, human_drivenness: 0.65, societal_fallout: 0.98 },
    names: [
      'Climate Refugee Migrant Flows', 'Water Aquifer Conflict Zones', 'Staple Food Price Volatility', 'Suburban Slum Expansion Areas',
      'Agricultural Crop Insurance Hikes', 'Humanitarian Resource Gaps', 'Fossil Fuel Pipeline Protests', 'Zoonotic Disease Outbreaks',
      'Managed Retreat Pressure', 'Cooling Equity Gaps', 'Coastal Property Insurance Redlines', 'Famine Relief Resource Strains',
      'Hydro-hegemony River Tensions', 'Urban Water Rationing Zones', 'Heatwave Excess Mortality Rates', 'Fishery Border Dispute Zones',
      'Climate Refugee Camp Densities', 'Extreme Weather Infrastructure Costs', 'Reinsurance Withdrawal', 'Urban Smog Health Expenses',
      'Water Borne Pathogen Outbreaks', 'Early Warning Coverage Gaps', 'Adaptation Financing Gap', 'Grid Permitting Delays'
    ]
  }
};

function buildNodeExpansionAnchor(group, entry) {
  const seed = normalizeNodeKey(entry.name);
  const sphereProfile = ECO_SPHERES[entry.sphere].baseVector;
  const adjsTemplate = [
    { min: 0, max: 25, label: 'Latched' },
    { min: 25, max: 50, label: 'Accelerating' },
    { min: 50, max: 75, label: 'Entrenched' },
    { min: 75, max: 100, label: 'Systemic' }
  ];

  const vector = {
    climate_forcing: parseFloat(clamp01(sphereProfile.climate_forcing * 0.58 + group.vector.climate_forcing * 0.42 + seededRange(seed, -0.02, 0.02, 'cf')).toFixed(2)),
    ecological_damage: parseFloat(clamp01(sphereProfile.ecological_damage * 0.58 + group.vector.ecological_damage * 0.42 + seededRange(seed, -0.02, 0.02, 'ed')).toFixed(2)),
    human_drivenness: parseFloat(clamp01(sphereProfile.human_drivenness * 0.58 + group.vector.human_drivenness * 0.42 + seededRange(seed, -0.02, 0.02, 'hd')).toFixed(2)),
    societal_fallout: parseFloat(clamp01(sphereProfile.societal_fallout * 0.58 + group.vector.societal_fallout * 0.42 + seededRange(seed, -0.02, 0.02, 'sf')).toFixed(2))
  };

  const baseValue = entry.baseValue !== undefined ? entry.baseValue : Math.round(Math.max(30, Math.min(62, group.baseValue + seededRange(seed, -3, 3, 'baseValue'))));
  const parentAnchor = BASE_NODES.find(node => node.id === group.parent) || selectAnchorNode(BASE_NODES, seed);

  return attachImpactProfiles({
    id: seed,
    name: entry.name,
    vector,
    baseValue,
    value: baseValue,
    sphere: entry.sphere,
    description: `${entry.name} is a Northstar anchor covering ${group.description}. It is modelled in the ${entry.sphere} sphere to widen causal coverage beyond the original 512-node baseline while remaining reversible through the active graph profile switch.`,
    adjectives: adjsTemplate,
    humanImpact: getHumanImpactProfileForNode({ id: seed, name: entry.name }, parentAnchor),
    expansion: {
      plan: 'Northstar',
      family: group.key,
      baseline_preserved: true
    }
  }, parentAnchor);
}

const EXPANSION_TOPOLOGY_VARIANTS = {
  water_systems: {
    sourceCandidates: ['temp', 'resource_depletion', 'aquifer_overdraft', 'river_flow_regime_shift', 'industry_farming', 'urbanization', 'glacial_lake_failure_risk'],
    targetCandidates: ['drinking_water_treatment_stress', 'hydropower_reliability_decline', 'wastewater_bypass_discharge', 'industry_farming', 'food_import_exposure', 'critical_infrastructure_fragility']
  },
  cryosphere_frontiers: {
    sourceCandidates: ['temp', 'carbon_emission', 'permafrost_thaw', 'ice_sheet_mass_loss', 'sea_ice_season_loss', 'glacial_lake_failure_risk'],
    targetCandidates: ['migration', 'resource_depletion', 'environ_anomalies', 'shipping_lane_disruption', 'critical_infrastructure_fragility', 'food']
  },
  ocean_regimes: {
    sourceCandidates: ['amoc', 'carbon_emission', 'ocean_acidification', 'marine_fisheries_collapse', 'coastal_hypoxia', 'el_nino', 'la_nina', 'resource_depletion'],
    targetCandidates: ['marine_fisheries_collapse', 'fish_landing_supply_disruption', 'food_import_exposure', 'shipping_lane_disruption', 'coastal_hypoxia', 'resource_depletion']
  },
  carbon_cycle_feedbacks: {
    sourceCandidates: ['carbon_emission', 'temp', 'methane', 'deforestation', 'permafrost_thaw', 'ocean_acidification'],
    targetCandidates: ['temp', 'methane', 'environ_anomalies', 'resource_depletion', 'food', 'migration']
  },
  atmospheric_patterns: {
    sourceCandidates: ['temp', 'carbon_emission', 'monsoon_volatility', 'wet_bulb_heat', 'aerosol_cooling_loss', 'el_nino', 'la_nina', 'amoc'],
    targetCandidates: ['environ_anomalies', 'industry_farming', 'migration', 'public_health_heat_burden', 'critical_infrastructure_fragility', 'shipping_lane_disruption', 'food']
  },
  energy_systems: {
    sourceCandidates: ['data_centers', 'ai_data_centers', 'carbon_emission', 'cooling_water_competition', 'grid_peak_load_stress', 'urbanization', 'resource_depletion'],
    targetCandidates: ['carbon_emission', 'critical_infrastructure_fragility', 'adaptation_capital_shortfall', 'insurance_retreat', 'utility_disconnection_risk', 'resource_depletion']
  },
  transport_systems: {
    sourceCandidates: ['personal_conveyance', 'urbanization', 'carbon_emission', 'shipping_lane_disruption', 'aviation_demand_growth', 'road_freight_diesel_lock_in'],
    targetCandidates: ['carbon_emission', 'supply_chain_port_bottlenecks', 'airport_operational_disruption', 'critical_infrastructure_fragility', 'food', 'urbanization']
  },
  biosphere_resilience: {
    sourceCandidates: ['deforestation', 'temp', 'resource_depletion', 'pollinator_service_decline', 'forest_fragmentation', 'biodiversity_intactness_loss'],
    targetCandidates: ['wildlife_habitat_patches', 'freshwater_ecosystem_collapse', 'urban_tree_canopy_loss', 'wetlands_drainage_scales', 'riverine_habitat_fragmentation', 'drinking_water_treatment_stress']
  },
  agriculture_food: {
    sourceCandidates: ['industry_farming', 'temp', 'food', 'resource_depletion', 'methane', 'crop_yield_volatility', 'wet_bulb_heat'],
    targetCandidates: ['food', 'migration', 'resource_depletion', 'public_health_heat_burden', 'critical_infrastructure_fragility', 'urbanization']
  },
  governance_finance: {
    sourceCandidates: ['migration', 'environ_anomalies', 'food', 'resource_depletion', 'urbanization', 'critical_infrastructure_fragility'],
    targetCandidates: ['insurance_retreat', 'coastal_property_insurance_redlines', 'mortgage_market_exposure', 'relocation_governance_capacity', 'climate_litigation_pressure', 'adaptation_capital_shortfall', 'early_warning_coverage_gaps']
  }
};

function rankExpansionCandidateIds(candidateIds, anchorId, salt, excludedIds = []) {
  const excluded = new Set(excludedIds);
  return [...new Set(candidateIds)]
    .filter(Boolean)
    .filter(id => !excluded.has(id))
    .sort((a, b) => {
      const aScore = seededUnit(`${anchorId}:${a}`, salt);
      const bScore = seededUnit(`${anchorId}:${b}`, salt);
      if (aScore !== bScore) return bScore - aScore;
      return a.localeCompare(b);
    });
}

function buildExpansionSpecificEdgePool(nodeCatalog, anchor, group, direction) {
  const variant = EXPANSION_TOPOLOGY_VARIANTS[group.key] || { sourceCandidates: [], targetCandidates: [] };
  const excludedIds = [anchor.id];

  if (direction === 'source') {
    const semanticSource = selectAnchorByKeywordRules(nodeCatalog, anchor.id, excludedIds);
    const sphereSource = selectSphereFallbackAnchor(nodeCatalog, anchor.sphere, anchor.id, [
      ...excludedIds,
      group.parent,
      ...(group.secondary_sources || []).map(source => source.id)
    ]);

    return rankExpansionCandidateIds(
      [
        semanticSource?.id,
        sphereSource?.id,
        ...(variant.sourceCandidates || [])
      ],
      anchor.id,
      `expansion-source:${group.key}`,
      [
        ...excludedIds,
        group.parent,
        ...(group.secondary_sources || []).map(source => source.id)
      ]
    );
  }

  return rankExpansionCandidateIds(
    variant.targetCandidates || [],
    anchor.id,
    `expansion-target:${group.key}`,
    [
      ...excludedIds,
      ...(group.targets || []).map(target => target.id),
      group.target
    ]
  );
}

function buildNodeExpansionEdges(anchor, group, nodeCatalog) {
  const inboundEdges = [
    {
      source: group.parent,
      target: anchor.id,
      verb: group.inboundVerb,
      adverb: 'systemically',
      influence: group.inboundInfluence,
      topology_rule: 'expansion_inbound',
      expansion_family: group.key
    },
    ...((group.secondary_sources || []).map(source => ({
      source: source.id,
      target: anchor.id,
      verb: source.verb,
      adverb: source.adverb || 'indirectly',
      influence: source.influence,
      topology_rule: 'expansion_inbound',
      expansion_family: group.key
    })))
  ];

  const extraSourceIds = buildExpansionSpecificEdgePool(nodeCatalog, anchor, group, 'source').slice(0, 2);
  extraSourceIds.forEach((sourceId, index) => {
    inboundEdges.push({
      source: sourceId,
      target: anchor.id,
      verb: seededChoice(
        ['primes', 'modulates', 'loads', 'conditions', 'stresses', 'amplifies'],
        `${anchor.id}:${sourceId}`,
        'expansion-extra-source-verb'
      ),
      adverb: seededChoice(
        ['through coupled stress', 'through adjacent systems', 'under warming pressure', 'via inherited pathways'],
        `${anchor.id}:${sourceId}`,
        'expansion-extra-source-adverb'
      ),
      influence: parseFloat((0.24 + seededRange(`${anchor.id}:${sourceId}`, 0, 0.18, `expansion-extra-source-influence:${index}`)).toFixed(2)),
      topology_rule: 'expansion_inbound_semantic',
      expansion_family: group.key
    });
  });

  const outboundTargets = group.targets || [
    {
      id: group.target,
      verb: group.outboundVerb,
      adverb: 'across systems',
      influence: group.outboundInfluence
    }
  ];

  const extraTargetIds = buildExpansionSpecificEdgePool(nodeCatalog, anchor, group, 'target').slice(0, 2);
  extraTargetIds.forEach((targetId, index) => {
    outboundTargets.push({
      id: targetId,
      verb: seededChoice(
        ['pressures', 'destabilizes', 'raises exposure for', 'reorganizes', 'constrains', 'propagates into'],
        `${anchor.id}:${targetId}`,
        'expansion-extra-target-verb'
      ),
      adverb: seededChoice(
        ['through cascading effects', 'through compound exposure', 'through coupled infrastructure stress', 'through persistence effects'],
        `${anchor.id}:${targetId}`,
        'expansion-extra-target-adverb'
      ),
      influence: parseFloat((0.22 + seededRange(`${anchor.id}:${targetId}`, 0, 0.17, `expansion-extra-target-influence:${index}`)).toFixed(2))
    });
  });

  const outboundEdges = outboundTargets.map(target => ({
    source: anchor.id,
    target: target.id,
    verb: target.verb,
    adverb: target.adverb || 'across systems',
    influence: target.influence,
    topology_rule: 'expansion_outbound',
    expansion_family: group.key
  }));

  return [...inboundEdges, ...outboundEdges];
}

const CURATED_BASE_EDGES = [...BASE_EDGES, ...CORE_ANCHOR_REPAIR_EDGES, ...RESPONSE_SYSTEM_EDGES];

// Author-curated discovery layer for guided entry points and trail authoring.
const AUTHORED_DISCOVERY_TRAILS = {
  clean_power_to_daily_life: {
    title: 'How Clean Power Reaches Daily Life',
    prompt: 'Follow clean electricity into efficient buildings, heating, transport, and the grid constraints that can slow it down.',
    nodeIds: ['renewable_energy_deployment', 'clean_electricity', 'building_energy_efficiency', 'heat_pump_electrification', 'electric_vehicle_transition']
  },
  surviving_extreme_heat: {
    title: 'How Cities Survive Extreme Heat',
    prompt: 'Connect forecasts, heat plans, passive design, efficient buildings, and equitable cooling to the human toll of heat.',
    nodeIds: ['multi_hazard_early_warning', 'urban_heat_action_plans', 'passive_cooling_design', 'equitable_cooling_access', 'heat_related_mortality_burden']
  },
  resilient_water_and_food: {
    title: 'How Water and Food Systems Adapt',
    prompt: 'Trace water reuse, healthier soils, diverse farming, and ecosystem recovery into more reliable food and water systems.',
    nodeIds: ['water_reuse', 'climate_resilient_agriculture', 'ecosystem_restoration', 'crop_yield_volatility', 'food_import_exposure']
  },
  hard_choices_at_the_coast: {
    title: 'Protection, Nature, or Relocation?',
    prompt: 'Compare flood-resilient infrastructure, nature-based protection, and rights-based relocation as coastal risk grows.',
    nodeIds: ['coastal_inundation_risk', 'flood_resilient_infrastructure', 'nature_based_adaptation', 'planned_relocation', 'relocation_governance_capacity']
  },
  ocean_buffer_breaks: {
    title: 'When the Ocean Stops Buffering Carbon',
    prompt: 'Follow warming into weaker ocean uptake, harsher chemistry, and marine food-system stress.',
    nodeIds: ['carbon_emission', 'ocean_carbon_uptake_weakening', 'ocean_acidification', 'marine_fisheries_collapse']
  },
  ocean_oxygen_and_food: {
    title: 'When Oxygen Loss Reaches the Dinner Table',
    prompt: 'See how coastal oxygen stress can compress habitat, damage fisheries, and affect food exposure.',
    nodeIds: ['temp', 'coastal_hypoxia', 'marine_fisheries_collapse', 'food_import_exposure']
  },
  circulation_to_food: {
    title: 'When Ocean Circulation Rearranges Food Risk',
    prompt: 'Trace a circulation shift into rainfall volatility, import dependence, and displacement pressure.',
    nodeIds: ['amoc', 'monsoon_volatility', 'food_import_exposure', 'migration']
  },
  compute_vs_water: {
    title: 'When Compute Competes for Water',
    prompt: 'Follow AI buildout from chips and cooling into basin stress and resource limits.',
    nodeIds: ['ai_data_centers', 'semiconductor_fabs', 'cooling_water_competition', 'resource_depletion']
  },
  compute_under_heat: {
    title: 'When Heat and Compute Hit the Grid Together',
    prompt: 'See how rising heat and rising compute load can collide through power reliability and public health.',
    nodeIds: ['ai_data_centers', 'grid_peak_load_stress', 'critical_infrastructure_fragility', 'public_health_heat_burden']
  },
  climate_uninsurability: {
    title: 'When Climate Risk Reprices Place',
    prompt: 'Follow extreme risk into reinsurance, local coverage retreat, and housing-finance exposure.',
    nodeIds: ['reinsurance_withdrawal', 'insurance_retreat', 'coastal_property_insurance_redlines', 'mortgage_market_exposure']
  },
  coastal_financial_retreat: {
    title: 'When Coastal Housing Turns into Managed Retreat',
    prompt: 'See how coverage loss becomes a mortgage problem, then a governance and migration problem.',
    nodeIds: ['insurance_retreat', 'coastal_property_insurance_redlines', 'mortgage_market_exposure', 'relocation_governance_capacity', 'migration']
  },
  frozen_carbon_return: {
    title: 'When Frozen Carbon Comes Back Online',
    prompt: 'Track warming into thaw, methane release, and a harder-to-stop carbon cycle.',
    nodeIds: ['temp', 'permafrost_thaw', 'methane', 'carbon_emission']
  },
  industrial_food_fragility: {
    title: 'When Food Systems Weaken Their Own Foundations',
    prompt: 'Follow land clearing and industrial farming into resource pressure, volatile yields, and food risk.',
    nodeIds: ['deforestation', 'industry_farming', 'resource_depletion', 'crop_yield_volatility', 'food']
  },
  heat_to_harvest: {
    title: 'When Heat Moves from Fields to Prices',
    prompt: 'See how humid heat can hit labor, yields, trade exposure, and affordability in sequence.',
    nodeIds: ['wet_bulb_heat', 'farm_heat_stress', 'crop_yield_volatility', 'food_import_exposure', 'food']
  }
};

const AUTHORED_DISCOVERY_GUIDES = {
  temp: {
    tier: 'Anchor',
    gatewayScore: 78,
    entryLabel: 'You know temperatures are rising. See what that destabilizes next.',
    curiosityHook: 'Temperature is the familiar headline, but its hardest effects often appear as failures in food, infrastructure, and habitability.',
    systemPath: ['Heat', 'Systems', 'Habitability'],
    prerequisiteNodeIds: [],
    nextNodeIds: ['wet_bulb_heat', 'monsoon_volatility', 'permafrost_thaw'],
    trailIds: ['frozen_carbon_return', 'ocean_oxygen_and_food']
  },
  carbon_emission: {
    tier: 'Anchor',
    gatewayScore: 82,
    entryLabel: 'You know emissions are rising. See where the damage actually surfaces.',
    curiosityHook: 'Carbon is upstream enough to feel abstract until you follow it into oceans, humid heat, and financial retreat.',
    systemPath: ['Emissions', 'Heat', 'Daily life'],
    prerequisiteNodeIds: [],
    nextNodeIds: ['ocean_carbon_uptake_weakening', 'wet_bulb_heat', 'insurance_retreat'],
    trailIds: ['ocean_buffer_breaks', 'frozen_carbon_return']
  },
  methane: {
    tier: 'Bridge',
    gatewayScore: 84,
    entryLabel: 'Methane makes near-term warming arrive faster than many systems can absorb.',
    curiosityHook: 'Methane matters not because it is more famous than CO2, but because it sharpens the next few decades of heat risk.',
    systemPath: ['Methane', 'Heat', 'Feedbacks'],
    prerequisiteNodeIds: ['carbon_emission'],
    nextNodeIds: ['wet_bulb_heat', 'permafrost_thaw', 'monsoon_volatility'],
    trailIds: ['frozen_carbon_return']
  },
  ocean_carbon_uptake_weakening: {
    tier: 'Bridge',
    gatewayScore: 93,
    entryLabel: 'Oceans are losing their ability to absorb carbon',
    curiosityHook: 'A warmer ocean can keep storing heat while becoming worse at buffering the carbon that caused the warming.',
    systemPath: ['Carbon', 'Oceans', 'Food systems'],
    prerequisiteNodeIds: ['carbon_emission', 'temp'],
    nextNodeIds: ['ocean_acidification', 'marine_fisheries_collapse', 'coastal_hypoxia'],
    trailIds: ['ocean_buffer_breaks'],
    defaultLanding: true,
    landingPriority: 1
  },
  ocean_acidification: {
    tier: 'Bridge',
    gatewayScore: 87,
    entryLabel: 'The ocean can look alive while its chemistry quietly stops favoring the life we depend on.',
    curiosityHook: 'Carbon does not just warm the ocean. It changes the chemistry many shells, reefs, and food webs require to persist.',
    systemPath: ['Chemistry', 'Reefs', 'Food webs'],
    prerequisiteNodeIds: ['ocean_carbon_uptake_weakening', 'carbon_emission'],
    nextNodeIds: ['marine_fisheries_collapse', 'coastal_hypoxia', 'food_import_exposure'],
    trailIds: ['ocean_buffer_breaks']
  },
  marine_fisheries_collapse: {
    tier: 'Bridge',
    gatewayScore: 86,
    entryLabel: 'Marine food systems can unravel before the coastline looks visibly transformed.',
    curiosityHook: 'Ocean decline can become a protein and price shock story long before it looks like a biodiversity headline.',
    systemPath: ['Ocean stress', 'Protein', 'Prices'],
    prerequisiteNodeIds: ['ocean_acidification', 'coastal_hypoxia'],
    nextNodeIds: ['food_import_exposure', 'migration', 'critical_infrastructure_fragility'],
    trailIds: ['ocean_buffer_breaks', 'ocean_oxygen_and_food']
  },
  coastal_hypoxia: {
    tier: 'Frontier',
    gatewayScore: 81,
    entryLabel: 'Low-oxygen water can make coasts biologically poorer long before they look empty.',
    curiosityHook: 'When oxygen disappears from water, fisheries, nursery habitat, and coastal economies all narrow at once.',
    systemPath: ['Runoff', 'Oxygen', 'Fisheries'],
    prerequisiteNodeIds: ['temp', 'industry_farming'],
    nextNodeIds: ['marine_fisheries_collapse', 'food_import_exposure', 'migration'],
    trailIds: ['ocean_oxygen_and_food']
  },
  thermal_stratification_intensification: {
    tier: 'Frontier',
    gatewayScore: 80,
    entryLabel: 'A coast can stay visibly blue while warmer layered water quietly reduces oxygen renewal underneath.',
    curiosityHook: 'Stratification matters because the water column can look normal while the systems that keep nearshore life productive stop mixing properly.',
    systemPath: ['Heat', 'Mixing', 'Nursery stress'],
    prerequisiteNodeIds: ['temp', 'coastal_hypoxia'],
    nextNodeIds: ['estuarine_nursery_loss', 'fish_landing_supply_disruption', 'drinking_water_treatment_stress'],
    trailIds: ['ocean_oxygen_and_food']
  },
  delta_salt_intrusion_fronts: {
    tier: 'Frontier',
    gatewayScore: 82,
    entryLabel: 'A coastline can lose usable freshwater long before it loses land.',
    curiosityHook: 'Salt intrusion is one of the clearest ways sea-level rise, drought, and groundwater stress turn into a direct water-utility problem.',
    systemPath: ['Coasts', 'Salinity', 'Water security'],
    prerequisiteNodeIds: ['coastal_inundation_risk', 'river_flow_regime_shift'],
    nextNodeIds: ['coastal_aquifer_degradation', 'drinking_water_treatment_stress', 'desalination_dependence'],
    trailIds: ['ocean_oxygen_and_food']
  },
  oceanic_upwelling_disruptions: {
    tier: 'Frontier',
    gatewayScore: 79,
    entryLabel: 'A productive fishery can destabilize simply because the nutrient pulse arrives weaker or later than it used to.',
    curiosityHook: 'Upwelling matters because it turns circulation change into something people can feel as less reliable catch and food supply.',
    systemPath: ['Circulation', 'Productivity', 'Landings'],
    prerequisiteNodeIds: ['ocean_current_regime_shift'],
    nextNodeIds: ['phytoplankton_decline', 'fish_landing_supply_disruption', 'fishery_protein_dependence'],
    trailIds: ['ocean_oxygen_and_food']
  },
  drinking_water_treatment_stress: {
    tier: 'Bridge',
    gatewayScore: 84,
    entryLabel: 'A water source can still exist physically while becoming much harder and costlier to make safe.',
    curiosityHook: 'Treatment stress is where floods, drought, salinity, and contamination stop being environmental context and become utility operations.',
    systemPath: ['Source water', 'Treatment', 'Household burden'],
    prerequisiteNodeIds: ['freshwater_lens_compression', 'delta_salt_intrusion_fronts'],
    nextNodeIds: ['desalination_dependence', 'critical_infrastructure_fragility', 'public_health_heat_burden'],
    trailIds: ['ocean_oxygen_and_food']
  },
  amoc: {
    tier: 'Frontier',
    gatewayScore: 84,
    entryLabel: 'A circulation shift in one ocean can rearrange rainfall and food risk far from the Atlantic.',
    curiosityHook: 'AMOC is compelling because it turns ocean circulation into something people can feel through crops, storms, and planning failure.',
    systemPath: ['Circulation', 'Rainfall', 'Food risk'],
    prerequisiteNodeIds: ['temp'],
    nextNodeIds: ['monsoon_volatility', 'food_import_exposure', 'migration'],
    trailIds: ['circulation_to_food']
  },
  permafrost_thaw: {
    tier: 'Bridge',
    gatewayScore: 91,
    entryLabel: 'Frozen ground is releasing ancient carbon',
    curiosityHook: 'Permafrost is not just melting ice. It is turning long-stored carbon and once-stable ground into active liabilities.',
    systemPath: ['Frozen ground', 'Methane', 'Infrastructure'],
    prerequisiteNodeIds: ['temp'],
    nextNodeIds: ['methane', 'resource_depletion', 'critical_infrastructure_fragility'],
    trailIds: ['frozen_carbon_return'],
    defaultLanding: true,
    landingPriority: 4
  },
  wet_bulb_heat: {
    tier: 'Bridge',
    gatewayScore: 89,
    entryLabel: 'Heat becomes different when humidity stops the body from cooling itself.',
    curiosityHook: 'What makes humid heat alarming is not discomfort. It is the point where cooling systems, labor, and the body fail together.',
    systemPath: ['Heat', 'Body', 'Power'],
    prerequisiteNodeIds: ['temp', 'methane'],
    nextNodeIds: ['farm_heat_stress', 'public_health_heat_burden', 'grid_peak_load_stress'],
    trailIds: ['heat_to_harvest']
  },
  monsoon_volatility: {
    tier: 'Bridge',
    gatewayScore: 86,
    entryLabel: 'Seasonal rain can become unreliable in ways that feel economic before they feel climatic.',
    curiosityHook: 'Monsoons are not just weather. They are timing systems for crops, reservoirs, power, and debt.',
    systemPath: ['Rain timing', 'Harvests', 'Stability'],
    prerequisiteNodeIds: ['temp', 'amoc'],
    nextNodeIds: ['crop_yield_volatility', 'food_import_exposure', 'migration'],
    trailIds: ['circulation_to_food']
  },
  industry_farming: {
    tier: 'Bridge',
    gatewayScore: 92,
    entryLabel: 'Industrial farming is weakening the systems it depends on',
    curiosityHook: 'A food system built for output can undermine its own soils, water, pollinators, and resilience.',
    systemPath: ['Food', 'Water', 'Soils'],
    prerequisiteNodeIds: ['food', 'resource_depletion'],
    nextNodeIds: ['crop_yield_volatility', 'resource_depletion', 'food_import_exposure'],
    trailIds: ['industrial_food_fragility'],
    defaultLanding: true,
    landingPriority: 5
  },
  crop_yield_volatility: {
    tier: 'Bridge',
    gatewayScore: 91,
    entryLabel: 'Heat is destabilizing food supply',
    curiosityHook: 'Food instability often shows up as unreliable harvests and price swings before it looks like outright scarcity.',
    systemPath: ['Heat', 'Harvests', 'Prices'],
    prerequisiteNodeIds: ['wet_bulb_heat', 'monsoon_volatility'],
    nextNodeIds: ['food_import_exposure', 'food', 'migration'],
    trailIds: ['industrial_food_fragility', 'heat_to_harvest'],
    defaultLanding: true,
    landingPriority: 6
  },
  farm_heat_stress: {
    tier: 'Frontier',
    gatewayScore: 83,
    entryLabel: 'A food system can still have fields and demand while the people doing the work cannot safely keep going.',
    curiosityHook: 'Farm heat stress matters because harvest risk is not only about crops. It is also about labor capacity.',
    systemPath: ['Heat', 'Labor', 'Harvests'],
    prerequisiteNodeIds: ['wet_bulb_heat'],
    nextNodeIds: ['crop_yield_volatility', 'food_import_exposure', 'migration'],
    trailIds: ['heat_to_harvest']
  },
  food_import_exposure: {
    tier: 'Frontier',
    gatewayScore: 84,
    entryLabel: 'Food shocks often arrive through trade dependence, not just local crop failure.',
    curiosityHook: 'A place can look agriculturally normal and still be highly exposed if import bottlenecks, storage failures, or price spikes do the damage first.',
    systemPath: ['Trade', 'Affordability', 'Security'],
    prerequisiteNodeIds: ['crop_yield_volatility', 'marine_fisheries_collapse'],
    nextNodeIds: ['cold_chain_failure_risk', 'humanitarian_resource_gaps', 'disaster_recovery_inequality'],
    trailIds: ['ocean_oxygen_and_food', 'circulation_to_food', 'heat_to_harvest']
  },
  food: {
    tier: 'Anchor',
    gatewayScore: 79,
    entryLabel: 'Food is familiar. The point is to see what makes it less reliable.',
    curiosityHook: 'People rarely need to be convinced food matters. They need help seeing how climate risk enters the plate through systems.',
    systemPath: ['Diet', 'Supply', 'Stability'],
    prerequisiteNodeIds: [],
    nextNodeIds: ['industry_farming', 'food_import_exposure', 'migration'],
    trailIds: ['industrial_food_fragility', 'heat_to_harvest']
  },
  resource_depletion: {
    tier: 'Bridge',
    gatewayScore: 87,
    entryLabel: 'Water and soil limits can make other crises harder before they become the headline crisis themselves.',
    curiosityHook: 'Resource depletion is what makes shocks harder to recover from because the buffer stock is already gone.',
    systemPath: ['Water', 'Soils', 'Capacity'],
    prerequisiteNodeIds: ['industry_farming', 'cooling_water_competition'],
    nextNodeIds: ['industry_farming', 'migration', 'critical_infrastructure_fragility'],
    trailIds: ['compute_vs_water', 'industrial_food_fragility']
  },
  deforestation: {
    tier: 'Anchor',
    gatewayScore: 80,
    entryLabel: 'Forest loss is not only about trees. It is about weakening rainfall, soils, and future recovery.',
    curiosityHook: 'Deforestation is familiar enough to trust, but it opens into much larger system questions than land cover alone.',
    systemPath: ['Land', 'Rainfall', 'Recovery'],
    prerequisiteNodeIds: [],
    nextNodeIds: ['industry_farming', 'resource_depletion', 'food'],
    trailIds: ['industrial_food_fragility']
  },
  ai_data_centers: {
    tier: 'Bridge',
    gatewayScore: 88,
    entryLabel: 'AI infrastructure can stress water and power before users ever see a model output.',
    curiosityHook: 'The surprise is not that AI uses energy. It is how quickly compute growth becomes a local infrastructure story.',
    systemPath: ['Compute', 'Power', 'Water'],
    prerequisiteNodeIds: ['data_centers'],
    nextNodeIds: ['semiconductor_fabs', 'cooling_water_competition', 'grid_peak_load_stress'],
    trailIds: ['compute_vs_water', 'compute_under_heat']
  },
  semiconductor_fabs: {
    tier: 'Frontier',
    gatewayScore: 83,
    entryLabel: 'The AI boom is also a chip, water, and industrial-corridor story.',
    curiosityHook: 'Fabs turn abstract compute demand into ultrapure water, chemicals, power quality, and chokepoint risk.',
    systemPath: ['Chips', 'Water', 'Supply chains'],
    prerequisiteNodeIds: ['ai_data_centers'],
    nextNodeIds: ['cooling_water_competition', 'resource_depletion', 'grid_peak_load_stress'],
    trailIds: ['compute_vs_water']
  },
  cooling_water_competition: {
    tier: 'Bridge',
    gatewayScore: 94,
    entryLabel: 'AI infrastructure is competing for water',
    curiosityHook: 'A facility can look clean from the outside while quietly competing with cities, farms, and ecosystems for the same basin.',
    systemPath: ['Compute', 'Water', 'Communities'],
    prerequisiteNodeIds: ['ai_data_centers', 'semiconductor_fabs'],
    nextNodeIds: ['resource_depletion', 'grid_peak_load_stress', 'critical_infrastructure_fragility'],
    trailIds: ['compute_vs_water', 'compute_under_heat'],
    defaultLanding: true,
    landingPriority: 2
  },
  grid_peak_load_stress: {
    tier: 'Bridge',
    gatewayScore: 86,
    entryLabel: 'Heat and compute can collide on the same grid at the worst possible time.',
    curiosityHook: 'Peak load stress is where climate adaptation and digital growth stop looking like separate stories.',
    systemPath: ['Heat', 'Electricity', 'Reliability'],
    prerequisiteNodeIds: ['wet_bulb_heat', 'ai_data_centers'],
    nextNodeIds: ['critical_infrastructure_fragility', 'public_health_heat_burden', 'migration'],
    trailIds: ['compute_under_heat']
  },
  insurance_retreat: {
    tier: 'Bridge',
    gatewayScore: 96,
    entryLabel: 'Climate change is making places uninsurable',
    curiosityHook: 'Climate risk can make a place financially unlivable before it becomes physically unlivable.',
    systemPath: ['Housing', 'Insurance', 'Migration'],
    prerequisiteNodeIds: ['temp', 'environ_anomalies'],
    nextNodeIds: ['coastal_property_insurance_redlines', 'mortgage_market_exposure', 'migration'],
    trailIds: ['climate_uninsurability', 'coastal_financial_retreat'],
    defaultLanding: true,
    landingPriority: 3
  },
  reinsurance_withdrawal: {
    tier: 'Frontier',
    gatewayScore: 84,
    entryLabel: 'The insurance crisis often starts upstream, far from the homeowner and even the insurer.',
    curiosityHook: 'When reinsurers pull back, local coverage can disappear long before people understand why prices are jumping.',
    systemPath: ['Capital', 'Insurance', 'Exposure'],
    prerequisiteNodeIds: ['environ_anomalies'],
    nextNodeIds: ['insurance_retreat', 'coastal_property_insurance_redlines', 'mortgage_market_exposure'],
    trailIds: ['climate_uninsurability']
  },
  coastal_property_insurance_redlines: {
    tier: 'Frontier',
    gatewayScore: 85,
    entryLabel: 'A coastline can stay inhabited while finance quietly redraws its boundaries.',
    curiosityHook: 'Insurance redlines matter because they turn hazard maps into credit, disclosure, and property-value problems.',
    systemPath: ['Coasts', 'Coverage', 'Value'],
    prerequisiteNodeIds: ['insurance_retreat', 'reinsurance_withdrawal'],
    nextNodeIds: ['mortgage_market_exposure', 'relocation_governance_capacity', 'migration'],
    trailIds: ['climate_uninsurability', 'coastal_financial_retreat']
  },
  mortgage_market_exposure: {
    tier: 'Frontier',
    gatewayScore: 86,
    entryLabel: 'Once coverage breaks, housing finance can start transmitting climate risk faster than the weather itself.',
    curiosityHook: 'Mortgages assume decades of stability. Insurance can reprice risk in a single renewal cycle.',
    systemPath: ['Housing', 'Credit', 'Retreat'],
    prerequisiteNodeIds: ['insurance_retreat', 'coastal_property_insurance_redlines'],
    nextNodeIds: ['relocation_governance_capacity', 'migration', 'critical_infrastructure_fragility'],
    trailIds: ['climate_uninsurability', 'coastal_financial_retreat']
  },
  migration: {
    tier: 'Anchor',
    gatewayScore: 82,
    entryLabel: 'Migration is usually a downstream response to failing housing, food, safety, or service systems.',
    curiosityHook: 'People usually move after other systems have already become unreliable, which makes migration more defensible as an operational consequence than as a root cause.',
    systemPath: ['Habitability', 'Mobility', 'Governance'],
    prerequisiteNodeIds: ['insurance_retreat', 'food_import_exposure'],
    nextNodeIds: ['relocation_governance_capacity', 'disaster_recovery_inequality', 'managed_retreat_pressure'],
    trailIds: ['circulation_to_food', 'coastal_financial_retreat']
  },
  critical_infrastructure_fragility: {
    tier: 'Bridge',
    gatewayScore: 85,
    entryLabel: 'Many climate risks become real when power, water, transport, and communications stop staying dependable together.',
    curiosityHook: 'Infrastructure fragility is strongest when it is treated as concrete service failure rather than a catch-all label for everything downstream.',
    systemPath: ['Infrastructure', 'Services', 'Recovery'],
    prerequisiteNodeIds: ['grid_peak_load_stress', 'migration'],
    nextNodeIds: ['public_health_heat_burden', 'early_warning_coverage_gaps', 'extreme_weather_infrastructure_costs'],
    trailIds: ['compute_under_heat', 'coastal_financial_retreat']
  },
  public_health_heat_burden: {
    tier: 'Bridge',
    gatewayScore: 83,
    entryLabel: 'Heat is not only a weather issue once clinics, labor, and outages start compounding each other.',
    curiosityHook: 'Public health burden is strongest when it stays tied to illness, clinical strain, and missed recovery rather than becoming a generic social endpoint.',
    systemPath: ['Exposure', 'Care', 'Recovery'],
    prerequisiteNodeIds: ['wet_bulb_heat', 'critical_infrastructure_fragility'],
    nextNodeIds: ['early_warning_coverage_gaps', 'disaster_recovery_inequality', 'relocation_governance_capacity'],
    trailIds: ['compute_under_heat']
  },
  relocation_governance_capacity: {
    tier: 'Frontier',
    gatewayScore: 82,
    entryLabel: 'The hardest part of retreat is often not deciding to move. It is whether institutions can absorb, finance, and govern the move.',
    curiosityHook: 'Relocation governance becomes defensible when it stays about planning capacity, legal process, and service absorption rather than broad political abstraction.',
    systemPath: ['Retreat', 'Governance', 'Stability'],
    prerequisiteNodeIds: ['mortgage_market_exposure', 'migration'],
    nextNodeIds: ['managed_retreat_pressure', 'disaster_recovery_inequality', 'early_warning_coverage_gaps'],
    trailIds: ['coastal_financial_retreat']
  }
};

function filterExistingDiscoveryNodeIds(nodeIds, availableIds) {
  return [...new Set((nodeIds || []).filter(nodeId => availableIds.has(nodeId)))];
}

function attachAuthoredDiscoveryMetadata(nodes) {
  const availableIds = new Set(nodes.map(node => node.id));

  return nodes.map(node => {
    const guide = AUTHORED_DISCOVERY_GUIDES[node.id];
    if (!guide) return node;

    return {
      ...node,
      discoveryGuide: {
        authored: true,
        ...guide,
        systemPath: [...(guide.systemPath || [])],
        prerequisiteNodeIds: filterExistingDiscoveryNodeIds(guide.prerequisiteNodeIds, availableIds),
        nextNodeIds: filterExistingDiscoveryNodeIds(guide.nextNodeIds, availableIds),
        trailIds: [...(guide.trailIds || [])].filter(trailId => AUTHORED_DISCOVERY_TRAILS[trailId])
      }
    };
  });
}

function buildAuthoredDiscoveryTrails(nodes) {
  const availableIds = new Set(nodes.map(node => node.id));

  return Object.fromEntries(
    Object.entries(AUTHORED_DISCOVERY_TRAILS)
      .map(([trailId, trail]) => [
        trailId,
        {
          ...trail,
          nodeIds: filterExistingDiscoveryNodeIds(trail.nodeIds, availableIds)
        }
      ])
      .filter(([, trail]) => trail.nodeIds.length >= 3)
  );
}

function buildNodeExpansionProfile(coreNodes, coreEdges) {
  const expansionAnchors = [];

  NODE_EXPANSION_GROUPS.forEach(group => {
    group.anchors.forEach(entry => {
      const anchor = buildNodeExpansionAnchor(group, entry);
      expansionAnchors.push(anchor);
    });
  });

  const nodeCatalog = [...coreNodes, ...expansionAnchors];
  const expansionEdges = [];

  NODE_EXPANSION_GROUPS.forEach(group => {
    group.anchors.forEach(entry => {
      const anchorId = normalizeNodeKey(entry.name);
      const anchor = nodeCatalog.find(node => node.id === anchorId);
      if (!anchor) return;
      expansionEdges.push(...buildNodeExpansionEdges(anchor, group, nodeCatalog));
    });
  });

  // Authored relationships replace generated edges with the same direction.
  const coreEdgeKeys = new Set(coreEdges.map(edge => `${edge.source}->${edge.target}`));
  const uniqueExpansionEdges = expansionEdges.filter(
    edge => !coreEdgeKeys.has(`${edge.source}->${edge.target}`)
  );

  return {
    id: GRAPH_PROFILE_SETTINGS.northstar.id,
    targetNodeCount: GRAPH_PROFILE_SETTINGS.northstar.targetNodeCount,
    baseNodes: [...coreNodes, ...expansionAnchors],
    baseEdges: [...coreEdges, ...uniqueExpansionEdges],
    metadata: {
      plan: 'Northstar',
      baselineNodeCount: GRAPH_PROFILE_SETTINGS.baseline.targetNodeCount,
      addedAnchorCount: expansionAnchors.length,
      totalAnchorCount: coreNodes.length + expansionAnchors.length,
      reversible: true
    }
  };
}

function buildCanonicalProceduralCatalog(baseNodes) {
  const sphereEntries = Object.entries(ECO_SPHERES);
  const baseNodeIds = new Set(baseNodes.map(node => node.id));
  const catalog = [];
  const maxNamesPerSphere = Math.max(...sphereEntries.map(([, sphere]) => sphere.names.length));

  for (let index = 0; index < maxNamesPerSphere; index++) {
    sphereEntries.forEach(([sphereKey, sphere]) => {
      const name = sphere.names[index];
      if (!name) return;

      const id = normalizeNodeKey(name);
      if (baseNodeIds.has(id)) return;

      baseNodeIds.add(id);
      catalog.push({ sphereKey, sphere, name, id });
    });
  }

  return catalog;
}

function createEdgeInserter(edges) {
  const existing = new Set(edges.map(edge => `${edge.source}->${edge.target}`));

  return edge => {
    const key = `${edge.source}->${edge.target}`;
    if (!edge.source || !edge.target || edge.source === edge.target || existing.has(key)) {
      return false;
    }
    existing.add(key);
    edges.push(edge);
    return true;
  };
}

const SEMANTIC_COLLAPSE_REDIRECTS = {
  ai_data_center_load_growth: 'ai_data_centers',
  antarctic_shelf_fragmentation: 'antarctic_shelf_instability',
  baseline_water_stress: 'water_stress',
  river_flow_regime_change: 'river_flow_regime_shift',
  glacier_fed_water_dependence: 'glacier_meltwater_dependency',
  greenland_glacier_melting: 'ice_sheet_mass_loss',
  mangrove_destruction: 'mangrove_buffer_loss',
  aviation_jet_fuel_emissions: 'aviation',
  hyperscale_server_hall: 'data_centers',
  climate_refugee_migrant_flows: 'migration',
  water_borne_pathogen_outbreaks: 'waterborne_pathogen_outbreaks',
  industrial_maize_monocultures: 'industry_farming',
  ai_accelerator_cluster: 'ai_data_centers',
  arctic_ice_retreat: 'sea_ice_season_loss',
  carrier_hotel_concentration: 'internet_exchange_points',
  long_haul_fiber_backbone: 'telecom_backbone',
  radio_access_network_density: 'mobile_wireless_networks',
  // Reviewed ontology consolidations. These generated labels describe the same
  // system condition as an existing canonical node; retain them as aliases
  // instead of creating separate, weak causal neighborhoods.
  reservoir_storage_volatility: 'reservoir_storage_instability',
  glacial_lake_outburst_floods: 'glacial_lake_failure_risk',
  siberian_permafrost_sinkholes: 'thermokarst_expansion',
  permafrost_cave_ins: 'thermokarst_expansion',
  tundra_thermokarst_development: 'thermokarst_expansion'
  ,petrochemical_plastics_synthesis: 'plastics_petrochemicals'
  ,ev_battery_metal_chains: 'battery_supply_chain_pressure'
  ,adaptation_financing_gap: 'adaptation_capital_shortfall'
  ,waterborne_disease_risk: 'waterborne_pathogen_outbreaks'
  ,irrigation_water_efficiency_gaps: 'irrigation_water_inefficiency'
  // IPCC defines thermohaline circulation as an incomplete conceptual
  // interpretation of observable meridional overturning. Retire the generated
  // disruption label as a causal duplicate while preserving it for search.
  ,thermohaline_disruption: 'amoc'
  // Halons are a species within the assessed chlorine-and-bromine burden,
  // not a separate causal phenomenon. Preserve the generated term for search.
  ,halon_gas_concentrations: 'cfc_saturated_layers'
  // These generated labels describe overlapping timing, route, and stopover
  // dimensions of the same species-specific annual-cycle observation.
  ,migratory_bird_flyway_losses: 'avian_migration_disruptions'
};

const HUB_DECONGESTION_RULES = {
  carbon_emission: {
    maxDegree: 108,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_inbound'],
    alternates: [
      'methane',
      'aerosol_cooling_loss',
      'data_centers',
      'ai_data_centers',
      'grid_peak_load_stress',
      'cooling_water_competition',
      'road_freight_diesel_lock_in',
      'aviation_demand_growth',
      'shipping_lane_disruption'
    ]
  },
  temp: {
    maxDegree: 100,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound'],
    eligibleOutgoingRules: [],
    alternates: [
      'monsoon_volatility',
      'wet_bulb_heat',
      'aerosol_cooling_loss',
      'methane',
      'amoc',
      'el_nino',
      'la_nina'
    ]
  },
  resource_depletion: {
    maxDegree: 96,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_inbound'],
    alternates: [
      'aquifer_overdraft',
      'crop_yield_volatility',
      'deforestation',
      'forest_fragmentation',
      'pollinator_service_decline',
      'basin_treaty_breakdown',
      'desalination_dependence',
      'freshwater_ecosystem_collapse',
      'cooling_water_competition',
      'data_centers'
    ]
  },
  food: {
    maxDegree: 90,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_inbound'],
    alternates: [
      'crop_yield_volatility',
      'farm_heat_stress',
      'food_import_exposure',
      'fishery_protein_dependence',
      'cold_chain_failure_risk',
      'industry_farming',
      'vector_borne_disease_expansion'
    ]
  },
  food_import_exposure: {
    maxDegree: 72,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound', 'hub_rebalanced'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_inbound', 'expansion_outbound'],
    alternates: [
      'cold_chain_failure_risk',
      'humanitarian_resource_gaps',
      'disaster_recovery_inequality',
      'fishery_protein_dependence',
      'fish_landing_supply_disruption',
      'crop_yield_volatility',
      'drinking_water_treatment_stress'
    ]
  },
  migration: {
    maxDegree: 90,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_inbound'],
    alternates: [
      'relocation_governance_capacity',
      'insurance_retreat',
      'adaptation_capital_shortfall',
      'mortgage_market_exposure',
      'disaster_recovery_inequality',
      'conflict_risk_escalation',
      'vector_borne_disease_expansion',
      'public_health_heat_burden'
    ]
  },
  public_health_heat_burden: {
    maxDegree: 68,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound', 'hub_rebalanced'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_inbound', 'expansion_outbound'],
    alternates: [
      'early_warning_coverage_gaps',
      'disaster_recovery_inequality',
      'relocation_governance_capacity',
      'utility_disconnection_risk',
      'cold_chain_failure_risk',
      'agricultural_labor_exposure',
      'humanitarian_resource_gaps'
    ]
  },
  disaster_recovery_inequality: {
    maxDegree: 60,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound', 'hub_rebalanced'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_inbound', 'expansion_outbound'],
    alternates: [
      'early_warning_coverage_gaps',
      'relocation_governance_capacity',
      'humanitarian_resource_gaps',
      'public_health_heat_burden',
      'managed_retreat_pressure',
      'conflict_risk_escalation'
    ]
  },
  relocation_governance_capacity: {
    maxDegree: 58,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound', 'hub_rebalanced'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_inbound', 'expansion_outbound'],
    alternates: [
      'managed_retreat_pressure',
      'disaster_recovery_inequality',
      'early_warning_coverage_gaps',
      'humanitarian_resource_gaps',
      'mortgage_market_exposure'
    ]
  },
  critical_infrastructure_fragility: {
    maxDegree: 90,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound', 'expansion_inbound', 'hub_rebalanced'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_outbound'],
    alternates: [
      'public_health_heat_burden',
      'adaptation_capital_shortfall',
      'insurance_retreat',
      'relocation_governance_capacity',
      'vector_borne_disease_expansion',
      'disaster_recovery_inequality',
      'mortgage_market_exposure',
      'conflict_risk_escalation',
      'basin_treaty_breakdown',
      'desalination_dependence',
      'food_import_exposure',
      'crop_yield_volatility',
      'farm_heat_stress'
    ]
  },
  environ_anomalies: {
    maxDegree: 90,
    eligibleIncomingRules: ['generated_bridge', 'expansion_outbound'],
    eligibleOutgoingRules: ['expansion_inbound_semantic', 'generated_seed', 'expansion_inbound'],
    alternates: [
      'public_health_heat_burden',
      'crop_yield_volatility',
      'food_import_exposure',
      'vector_borne_disease_expansion',
      'shipping_lane_disruption',
      'insurance_retreat',
      'disaster_recovery_inequality',
      'relocation_governance_capacity',
      'farm_heat_stress',
      'port_heat_vulnerability',
      'rail_heat_buckling',
      'aviation_demand_growth',
      'road_freight_diesel_lock_in',
      'pollinator_service_decline',
      'freshwater_ecosystem_collapse'
    ]
  }
};

function resolveSemanticRedirect(nodeId) {
  let current = nodeId;
  const seen = new Set();

  while (SEMANTIC_COLLAPSE_REDIRECTS[current] && !seen.has(current)) {
    seen.add(current);
    current = SEMANTIC_COLLAPSE_REDIRECTS[current];
  }

  return current;
}

function applySemanticCollapse(nodes, edges) {
  const collapsedAliases = new Map();

  nodes.forEach(node => {
    const canonicalId = resolveSemanticRedirect(node.id);
    if (canonicalId === node.id) return;
    if (!collapsedAliases.has(canonicalId)) {
      collapsedAliases.set(canonicalId, []);
    }
    collapsedAliases.get(canonicalId).push({
      id: node.id,
      name: node.name,
      role: node.calibration?.role || 'unknown'
    });
  });

  const survivingNodes = nodes
    .filter(node => resolveSemanticRedirect(node.id) === node.id)
    .map(node => {
      const aliases = collapsedAliases.get(node.id);
      if (!aliases || aliases.length === 0) {
        return node;
      }

      return {
        ...node,
        semanticAliases: aliases
      };
    });

  const collapsedEdges = [];
  const pushCollapsedEdge = createEdgeInserter(collapsedEdges);

  edges.forEach(edge => {
    const source = resolveSemanticRedirect(edge.source);
    const target = resolveSemanticRedirect(edge.target);

    if (source === target) return;

    pushCollapsedEdge({
      ...edge,
      source,
      target
    });
  });

  return { nodes: survivingNodes, edges: collapsedEdges };
}

function buildDegreeMap(nodes, edges) {
  const degreeMap = new Map(nodes.map(node => [node.id, 0]));
  edges.forEach(edge => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  });
  return degreeMap;
}

function rebalanceHubEdge(edge, nextEndpoint, direction) {
  if (direction === 'incoming') {
    return {
      ...edge,
      target: nextEndpoint,
      topology_rule: 'hub_rebalanced',
      original_topology_rule: edge.original_topology_rule || edge.topology_rule
    };
  }

  return {
    ...edge,
    source: nextEndpoint,
    topology_rule: 'hub_rebalanced',
    original_topology_rule: edge.original_topology_rule || edge.topology_rule
  };
}

function decongestMegaHubs(nodes, edges) {
  const nodeIds = new Set(nodes.map(node => node.id));
  const edgeKeys = new Set(edges.map(edge => `${edge.source}->${edge.target}`));
  const degreeMap = buildDegreeMap(nodes, edges);
  const softMax = 72;

  const pickAlternate = (alternates, edge, hubId, direction) => {
    const sourceId = direction === 'incoming' ? edge.source : null;
    const targetId = direction === 'outgoing' ? edge.target : null;

    return alternates
      .filter(id => nodeIds.has(id))
      .filter(id => id !== hubId)
      .filter(id => id !== sourceId)
      .filter(id => id !== targetId)
      .sort((a, b) => {
        const aDeg = degreeMap.get(a) || 0;
        const bDeg = degreeMap.get(b) || 0;
        if (aDeg !== bDeg) return aDeg - bDeg;
        return a.localeCompare(b);
      })
      .find(id => {
        if ((degreeMap.get(id) || 0) >= softMax) return false;
        const nextKey = direction === 'incoming' ? `${edge.source}->${id}` : `${id}->${edge.target}`;
        return !edgeKeys.has(nextKey);
      }) || null;
  };

  Object.entries(HUB_DECONGESTION_RULES).forEach(([hubId, rule]) => {
    let currentDegree = degreeMap.get(hubId) || 0;
    if (currentDegree <= rule.maxDegree) return;

    const candidates = edges
      .map((edge, index) => {
        if (edge.target === hubId && rule.eligibleIncomingRules.includes(edge.topology_rule)) {
          return {
            index,
            direction: 'incoming',
            priority: edge.topology_rule === 'generated_bridge' ? 0 : 1
          };
        }

        if (edge.source === hubId && rule.eligibleOutgoingRules.includes(edge.topology_rule)) {
          const priorityMap = {
            expansion_inbound_semantic: 0,
            generated_seed: 1,
            expansion_inbound: 2
          };
          return {
            index,
            direction: 'outgoing',
            priority: priorityMap[edge.topology_rule] ?? 3
          };
        }

        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.priority - b.priority || a.index - b.index);

    for (const candidate of candidates) {
      currentDegree = degreeMap.get(hubId) || 0;
      if (currentDegree <= rule.maxDegree) break;

      const originalEdge = edges[candidate.index];
      if (!originalEdge) continue;

      const alternateId = pickAlternate(rule.alternates, originalEdge, hubId, candidate.direction);
      if (!alternateId) continue;

      edgeKeys.delete(`${originalEdge.source}->${originalEdge.target}`);
      const nextEdge = rebalanceHubEdge(originalEdge, alternateId, candidate.direction);
      edges[candidate.index] = nextEdge;
      edgeKeys.add(`${nextEdge.source}->${nextEdge.target}`);

      degreeMap.set(hubId, (degreeMap.get(hubId) || 1) - 1);
      degreeMap.set(alternateId, (degreeMap.get(alternateId) || 0) + 1);
    }
  });

  return { nodes, edges };
}

// --- PROCEDURAL SYSTEM DATA GENERATOR ---
const REVIEWED_OFFICIAL_NODE_SOURCE_GROUPS = [
  {
    ids: ['food_insecurity'],
    source_urls: [
      'https://www.fao.org/sustainable-development-goals-data-portal/data/indicators/212-prevalence-of-moderate-or-severe-food-insecurity-in-the-population-based-on-the-food-insecurity-experience-scale/en',
      'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/'
    ],
    notes: 'Node-specific support for food insecurity as FAO SDG 2.1.2 FIES prevalence. This does not collapse undernutrition, food availability, affordability, and dietary quality into one observable.'
  },
  {
    ids: ['nutrient_pollution'],
    source_urls: [
      'https://www.epa.gov/nutrientpollution/sources-and-solutions',
      'https://www.epa.gov/nutrientpollution/effects-dead-zones-and-harmful-algal-blooms',
      'https://api.waterdata.usgs.gov/ogcapi/v0/'
    ],
    notes: 'Node-specific support for nitrogen and phosphorus pollution measured through named analytes, sites, methods, and jurisdiction-specific criteria. US observations are not extrapolated globally.'
  },
  {
    ids: ['seagrass_meadow_decline'],
    source_urls: [
      'https://www.unep.org/topics/ocean-seas-and-coasts/blue-ecosystems/seagrass-meadows',
      'https://www.ipcc.ch/srocc/chapter/chapter-5/',
      'https://www.fisheries.noaa.gov/national/habitat-conservation/protecting-coastal-blue-carbon-through-habitat-conservation'
    ],
    notes: 'Node-specific assessment support for mapped seagrass loss. Area change requires comparable habitat maps; occurrence records remain supporting evidence and are never treated as absence.'
  },
  {
    ids: ['urban_heat_island'],
    source_urls: [
      'https://www.epa.gov/heatislands/what-are-heat-islands',
      'https://www.epa.gov/heatislands/measuring-heat-islands',
      'https://climate.discomap.eea.europa.eu/arcgis/rest/services/UAMV/Urban_Heat_Island_Intensity/MapServer'
    ],
    notes: 'Node-specific support for urban-minus-reference temperature differences. Surface and canopy-layer heat islands, reference footprint, season, and day/night window must remain explicit.'
  },
  {
    ids: ['dam_and_diversion_infrastructure', 'road_stream_crossing_barriers', 'levee_and_channelization_works'],
    source_urls: [
      'https://www.usgs.gov/publications/fish-guidance-and-passage-barriers',
      'https://www.epa.gov/caddis/physical-habitat',
      'https://pubs.usgs.gov/publication/sir20235132/full'
    ],
    notes: 'Official node-specific infrastructure support. Each driver is measured as a mapped structure or alteration; ecological consequences remain separate relationship claims.'
  },
  {
    ids: ['humanitarian_response_funding_shortfall', 'humanitarian_access_constraints', 'humanitarian_surge_demand'],
    source_urls: [
      'https://humanitarianaction.info/',
      'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess',
      'https://www.unhcr.org/about-unhcr/planning-funding-and-results/underfunding'
    ],
    notes: 'Official humanitarian planning and access sources. Funding coverage, access severity, and surge demand remain distinct operational constructs and reporting periods.'
  },
  {
    ids: ['agricultural_groundwater_withdrawal', 'municipal_groundwater_withdrawal', 'industrial_groundwater_withdrawal', 'coastal_groundwater_withdrawal'],
    source_urls: [
      'https://www.usgs.gov/publications/estimated-groundwater-withdrawals-principal-aquifers-united-states-2015',
      'https://www.usgs.gov/water-science-school/science/groundwater-decline-and-depletion',
      'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion'
    ],
    notes: 'USGS node-specific support for sector-resolved groundwater withdrawal. Withdrawal volume is not treated as depletion without aquifer recharge, storage, and return-flow accounting.'
  },
  {
    ids: ['agricultural_nitrogen_application', 'anaerobic_manure_lagoon_operation', 'cattle_stocking_density', 'agricultural_soil_compaction'],
    source_urls: [
      'https://www.epa.gov/nutrientpollution/sources-and-solutions-agriculture',
      'https://www.epa.gov/ghgemissions/agriculture-sector-emissions',
      'https://www.nrcs.usda.gov/conservation-basics/soil/soil-health'
    ],
    notes: 'Official agricultural-management support. Application, lagoon operation, stocking density, and compaction are kept as separately measurable practices rather than interchangeable proxies.'
  },
  {
    ids: ['coal_power_sulfur_emissions'],
    source_urls: [
      'https://www.epa.gov/system/files/documents/2025-07/so2_2024.pdf',
      'https://www.epa.gov/so2-pollution/sulfur-dioxide-basics',
      'https://www.epa.gov/acidrain/acid-rain-program'
    ],
    notes: 'Official EPA support for coal-power sulfur dioxide emissions and program monitoring. Emissions are kept separate from ambient concentration, deposition, and health outcome metrics.'
  },
  {
    ids: ['urban_hydrologic_supply_shortfall', 'urban_water_demand_peak', 'urban_distribution_water_loss', 'urban_source_water_treatment_constraint'],
    source_urls: [
      'https://water.usgs.gov/vizlab/water-availability/01-water-limitation',
      'https://www.usgs.gov/mission-areas/water-resources/science/public-supply-water-use',
      'https://www.epa.gov/natural-disasters/drought'
    ],
    notes: 'Official water-availability and public-supply support. Source availability, peak demand, distribution loss, and treatment capacity remain distinct system measurements.'
  },
  {
    ids: ['wildfire_smoke_pm25_exposure', 'wildfire_smoke_exposure_duration'],
    source_urls: [
      'https://www.epa.gov/wildfires/wildland-fires-and-public-health-effects',
      'https://www.airnow.gov/wildfires/'
    ],
    notes: 'Official support for wildfire-smoke PM2.5 concentration and exposure duration. Concentration, duration, population exposure, and health burden are not conflated.'
  },
  {
    ids: ['surface_water_inflow_deficit', 'surface_water_evaporative_loss', 'surface_water_groundwater_exchange_shift', 'surface_water_withdrawal_pressure'],
    source_urls: [
      'https://www.usgs.gov/water-science-school/water-cycle',
      'https://www.usgs.gov/water-science-school/science/lakes-and-reservoirs',
      'https://www.usgs.gov/special-topics/drought'
    ],
    notes: 'USGS process support for distinct surface-water balance components. Inflow, evaporation, groundwater exchange, and withdrawals must be quantified separately within a bounded basin and period.'
  },
  {
    ids: [
      'coal_power_co2_output', 'gas_power_co2_output', 'oil_power_co2_output',
      'coal_industrial_heat_co2', 'gas_industrial_heat_co2', 'cement_kiln_fuel_co2',
      'iron_steel_process_co2', 'chemical_process_co2', 'refinery_combustion_co2',
      'aviation_jet_fuel_co2', 'shipping_bunker_fuel_co2', 'passenger_road_fuel_co2',
      'diesel_freight_co2', 'rail_diesel_co2', 'residential_gas_heat_co2',
      'commercial_gas_heat_co2', 'oil_building_heat_co2', 'fossil_power_backup_co2',
      'waste_incineration_co2', 'oil_gas_flaring_co2', 'deforestation_co2_release',
      'peatland_drainage_co2', 'land_use_fire_co2', 'construction_material_co2',
      'fossil_hydrogen_co2'
    ],
    source_urls: [
      'https://edgar.jrc.ec.europa.eu/dataset_ghg2025',
      'https://edgar.jrc.ec.europa.eu/report_2025',
      'https://unfccc.int/process-and-meetings/transparency-and-reporting/reporting-and-review/transparency-data-and-tools/greenhouse-gas-data/data-interface-help'
    ],
    notes: 'Node-specific sector and fuel slices are supported by EDGAR 2025 annual or monthly sector-country fossil CO2 tables and checked against UNFCCC inventory categories. These are inventory quantities, not facility attribution or causal effect estimates.'
  }
];

const REVIEWED_OFFICIAL_NODE_NAME_OVERRIDES = Object.freeze({
  aviation_jet_fuel_co2: 'Civil Aviation Fossil CO2 Output',
  refinery_combustion_co2: 'Petroleum Refining and Other Energy Industries Fossil CO2 Output',
  chemical_process_co2: 'Chemical Industry Fossil CO2 Output',
  waste_incineration_co2: 'Waste Incineration and Open-Burning Fossil CO2 Output',
  shipping_bunker_fuel_co2: 'Water-Borne Navigation Fossil CO2 Output',
  rail_diesel_co2: 'Railway Fossil CO2 Output',
  iron_steel_process_co2: 'Metal Industry Fossil CO2 Output',
  oil_gas_flaring_co2: 'Oil and Natural Gas Sector Fossil CO2 Output'
});

const REVIEWED_OFFICIAL_NODE_SOURCE_PACKS = Object.fromEntries(
  REVIEWED_OFFICIAL_NODE_SOURCE_GROUPS.flatMap(group => group.ids.map(id => [id, {
    ...(REVIEWED_OFFICIAL_NODE_NAME_OVERRIDES[id] ? { name: REVIEWED_OFFICIAL_NODE_NAME_OVERRIDES[id] } : {}),
    calibration: {
      source_status: 'official_registry_link',
      source_urls: group.source_urls,
      notes: group.notes
    }
  }]))
);

const NODE_SOURCE_PACK_OVERRIDES = {
  ...REVIEWED_OFFICIAL_NODE_SOURCE_PACKS,
  "aerosol_cooling_loss": {
    "calibration": {
      "source_status": "web_verified_official",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/"
      ],
      "notes": "Scientific assessment of aerosol cooling loss, radiative forcing masking, and climate budget feedbacks."
    }
  },
  "grid_peak_load_stress": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf",
        "https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report.pdf"
      ],
      "notes": "Links extreme heat waves and AI data center energy growth to peak load grid reliability stress."
    }
  },
  "cooling_water_competition": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.energy.gov/sites/prod/files/2014/07/f17/Water%20Energy%20Nexus%20Full%20Report%20July%202014.pdf",
        "https://www.usgs.gov/mission-areas/water-resources/science/thermoelectric-power-water-use"
      ],
      "notes": "Reflects data center and power plant cooling water demands competing with municipal and agricultural basins."
    }
  },
  "critical_infrastructure_fragility": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b",
        "https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/"
      ],
      "notes": "Ties climate hazard exposure to concrete service failures in transport, utility, and power networks, and should be read as an operational systems node rather than a generic downstream bucket."
    }
  },
  "adaptation_capital_shortfall": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unep.org/resources/adaptation-gap-report-2025",
        "https://www.oecd.org/en/publications/climate-finance-provided-and-mobilised-by-developed-countries-in-2013-2022_19150727-en.html"
      ],
      "notes": "Tracks adaptation capital shortfalls, funding deficits, and international public finance flows."
    }
  },
  "insurance_retreat": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://home.treasury.gov/news/press-releases/jy2791",
        "https://home.treasury.gov/system/files/311/Final%20FIO%202025%20Annual%20Report.pdf"
      ],
      "notes": "Documents insurance premium increases, carrier withdrawals, and nonrenewals in climate-exposed housing markets."
    }
  },
  "mortgage_market_exposure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fhfa.gov/blog/statistics/the-need-to-address-climate-risk",
        "https://www.fhfa.gov/blog/insights/an-overview-of-fhfas-key-initiatives-to-address-climate-related-financial-risks"
      ],
      "notes": "Links climate hazard risks to mortgage lending standards, securitization, and systemic financial exposure."
    }
  },
  "shipping_lane_disruption": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://unctad.org/system/files/official-document/rmt2024_en.pdf",
        "https://unctad.org/system/files/official-document/osginf2024d2_en.pdf"
      ],
      "notes": "Details shipping lane disruptions and transit delays in key canals (Panama, Suez) due to climate extremes and geopolitics."
    }
  },
  "road_freight_diesel_lock_in": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/global-ev-outlook-2025",
        "https://theicct.org/heavy-duty-vehicles/"
      ],
      "notes": "Tracks diesel lock-in, commercial truck emissions, and electric heavy-duty vehicle transition barriers."
    }
  },
  "food_import_exposure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/3/I9542EN/i9542en.pdf",
        "https://www.fao.org/3/CA2370EN/ca2370en.pdf"
      ],
      "notes": "Tracks dependence on imported food, trade bottlenecks, and price-sensitive supply shocks rather than acting as a catch-all proxy for food insecurity."
    }
  },
  "pollinator_colony_collapse": {
    "calibration": {
      "source_status": "web_verified_official",
      "source_urls": [
        "https://www.usgs.gov/publications/recent-and-future-declines-a-historically-widespread-pollinator-linked-climate-land",
        "https://www.epa.gov/pollinator-protection/pollinator-health-concerns",
        "https://www.nrcs.usda.gov/conservation-basics/animals/insects-pollinators",
        "https://www.ipbes.net/assessment-reports/pollinators"
      ],
      "notes": "Treats colony or population loss as a measured multistressor outcome for a named pollinator, landscape, and season; pesticide exposure, forage loss, pathogens, climate, and management remain separate drivers."
    }
  },
  "zoonotic_disease_outbreaks": {
    "calibration": {
      "source_status": "web_verified_official",
      "source_urls": [
        "https://www.who.int/news-room/fact-sheets/detail/one-health",
        "https://www.who.int/news-room/fact-sheets/detail/zoonoses",
        "https://www.unep.org/resources/report/preventing-future-zoonotic-disease-outbreaks-protecting-environment-animals-and",
        "https://www.fao.org/animal-health/areas-of-work/veterinary-public-health/en"
      ],
      "notes": "Anchors the node to a confirmed named-pathogen outbreak with case definitions, surveillance, animal-human interface evidence, geography, dates, and reporting limitations; spillover potential is not itself an outbreak."
    }
  },
  "crop_yield_volatility": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/",
        "https://doi.org/10.1038/ncomms6989"
      ],
      "notes": "Ties climate variance to global yield volatility in major staple crops (wheat, rice, maize)."
    }
  },
  "farm_heat_stress": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ilo.org/sites/default/files/wcmsp5/groups/public/%40dgreports/%40dcomm/%40publ/documents/publication/wcms_711919.pdf",
        "https://lancetcountdown.org/heat-and-health/"
      ],
      "notes": "Quantifies agricultural labor-hour losses and occupational exposures under rising wet-bulb heat."
    }
  },
  "water_stress": {
    "name": "Baseline Water Stress",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.wri.org/aqueduct",
        "https://www.fao.org/aquastat/"
      ],
      "notes": "Tracks chronic imbalance between withdrawals and available supply using defensible basin-scale water-stress references."
    }
  },
  "groundwater_depletion": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://gracefo.jpl.nasa.gov/",
        "https://www.usgs.gov/mission-areas/water-resources/science/groundwater-depletion"
      ],
      "notes": "Tracks aquifer storage loss where withdrawals exceed recharge and groundwater reserves decline over time."
    }
  },
  "rain_on_snow_flood_risk": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.usgs.gov/special-topics/water-science-school/science/rain-snow-events",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/"
      ],
      "notes": "Tracks flood-producing rain-on-snow events where warming shifts cold-season storms toward rapid runoff instead of stored snowpack."
    }
  },
  "peak_glacier_runoff_passage": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unesco.org/reports/wwdr/en/2025",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/"
      ],
      "notes": "Tracks passage beyond peak glacier runoff, when short-term meltwater gains give way to declining long-term seasonal water support."
    }
  },
  "vector_borne_disease_expansion": {
    "name": "Vector-Borne Disease Expansion",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.who.int/health-topics/climate-change",
        "https://www.who.int/news-room/fact-sheets/detail/vector-borne-diseases"
      ],
      "notes": "Tracks bounded climate-linked expansion of malaria, dengue, and other vector-sensitive disease exposure zones."
    }
  },
  "marine_pathogen_range_expansion": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fisheries.noaa.gov/",
        "https://www.who.int/news-room/fact-sheets/detail/vector-borne-diseases"
      ],
      "notes": "Tracks the expansion or season-lengthening of harmful marine pathogen exposure under warmer and more unstable coastal conditions."
    }
  },
  "thermal_stratification_intensification": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ncei.noaa.gov/products/world-ocean-database",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/"
      ],
      "notes": "Tracks intensifying ocean layering that reduces vertical mixing and oxygen renewal in coastal and shelf waters."
    }
  },
  "delta_salt_intrusion_fronts": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers",
        "https://oceanservice.noaa.gov/facts/sealevel.html"
      ],
      "notes": "Tracks inland movement of saline fronts in deltas and estuaries where higher sea levels and weaker river flows threaten freshwater use."
    }
  },
  "oceanic_upwelling_disruptions": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/srocc/chapter/chapter-5/",
        "https://www.fisheries.noaa.gov/"
      ],
      "notes": "Tracks disruption of nutrient-bearing coastal upwelling systems where circulation and stratification changes weaken marine productivity."
    }
  },
  "public_health_heat_burden": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
        "https://lancetcountdown.org/2025-report-visual-summary/"
      ],
      "notes": "Tracks heat-related illness, mortality, and clinical-system strain, keeping the node anchored to health outcomes and care-system stress rather than broad social distress."
    }
  },
  "heat_related_mortality_burden": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
        "https://www.who.int/health-topics/climate-change"
      ],
      "notes": "Tracks direct mortality burden from extreme heat exposure, keeping the node narrower than the broader heat-health system burden."
    }
  },
  "air_pollution_health_burden": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health",
        "https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics"
      ],
      "notes": "Tracks respiratory, cardiovascular, and mortality burden tied to outdoor air pollution exposure."
    }
  },
  "occupational_heat_exposure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ilo.org/publications/working-warmer-planet-impact-heat-stress-labour-productivity-and-decent-work",
        "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health"
      ],
      "notes": "Tracks climate-driven heat exposure at work, labor-capacity loss, and injury risk in exposed sectors."
    }
  },
  "extreme_precipitation_intensity": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/",
        "https://www.climate.gov/news-features/understanding-climate/climate-change-heavy-rainfall"
      ],
      "notes": "Tracks the increasing intensity of the heaviest precipitation events under a warmer and wetter atmosphere."
    }
  },
  "tropical_cyclone_rapid_intensification": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.gfdl.noaa.gov/global-warming-and-hurricanes/",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/"
      ],
      "notes": "Tracks rapidly strengthening tropical cyclones, keeping the node focused on compressed warning time and coastal hazard escalation rather than generic storm activity."
    }
  },
  "pyrocumulonimbus_smoke_injection": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://ntrs.nasa.gov/citations/20190025336",
        "https://gml.noaa.gov/"
      ],
      "notes": "Tracks extreme fire-driven convective smoke injection into the upper atmosphere, a narrower and more defensible framing than generic wildfire plume escalation."
    }
  },
  "coastal_permafrost_erosion": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.usgs.gov/mission-areas/climate-research-and-development/science/permafrost",
        "https://www.arctic.noaa.gov/report-card/"
      ],
      "notes": "Tracks erosion of thawing Arctic permafrost coasts where warming ground and sea-ice loss destabilize bluffs, roads, and shoreline settlements."
    }
  },
  "disaster_recovery_inequality": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.gao.gov/assets/720/718175.pdf",
        "https://www.gao.gov/assets/gao-22-104452.pdf"
      ],
      "notes": "Tracks uneven recovery capacity, aid access, and funding distribution after climate shocks, making it a bounded recovery-governance node rather than a generic injustice bucket."
    }
  },
  "relocation_governance_capacity": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://documents1.worldbank.org/curated/en/540941631203608570/pdf/Overview.pdf",
        "https://environmentalmigration.iom.int/planned-relocation"
      ],
      "notes": "Tracks whether institutions can plan, finance, legalize, and service relocation or managed retreat, rather than implying any broad political capacity claim."
    }
  },
  "conflict_risk_escalation": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-8/",
        "https://doi.org/10.1016/j.gloenvcha.2020.102063"
      ],
      "notes": "Analyzes climate-induced disasters acting as conflict risk multipliers through displacement and food systems."
    }
  },
  "basin_treaty_breakdown": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://unece.org/sites/default/files/2021-12/ECE_MP.WAT_64_Handbook%20on%20water%20allocation%20in%20a%20the%20transboundary%20context.pdf",
        "https://unece.org/sites/default/files/2021-12/SDG652_2021_2nd_Progress_Report_ENG_web.pdf"
      ],
      "notes": "Monitors transboundary basin cooperation, allocation treaties, and drought-era sharing strains."
    }
  },
  "freshwater_ecosystem_collapse": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/",
        "https://wedocs.unep.org/bitstream/handle/20.500.11822/36691/PFE6.6.1.pdf"
      ],
      "notes": "Tracks degradation and loss of river, lake, and wetland habitats (SDG 6.6.1)."
    }
  },
  "soil_moisture_collapse": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://cds.climate.copernicus.eu/datasets/satellite-soil-moisture",
        "https://smap.jpl.nasa.gov/data/"
      ],
      "notes": "Active tracking of satellite-derived soil moisture anomalies; requires CDS/Earthdata logins for programmatic data access."
    }
  },
  "drought_persistence": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://drought.emergency.copernicus.eu/",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/"
      ],
      "notes": "Monitors multi-season drought persistence and carryover effects in soil and reservoirs."
    }
  },
  "drinking_water_treatment_stress": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/crwu",
        "https://www.epa.gov/cyanohabs"
      ],
      "notes": "Links salinity, turbidity, and algal blooms to increased water utility treatment complexity and costs."
    }
  },
  "desalination_dependence": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://documents1.worldbank.org/curated/en/476041552622967264/pdf/135312-WP-PUBLIC-14-3-2019-12-3-35-W.pdf",
        "https://doi.org/10.1016/j.scitotenv.2018.12.076"
      ],
      "notes": "Tracks growing desalination reliance, energy footprint, and marine brine disposal tradeoffs."
    }
  },
  "coastal_hypoxia": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/",
        "https://doi.org/10.1126/science.aam7240"
      ],
      "notes": "Monitors oxygen depletion in coastal waters driven by warming, stratification, and runoff."
    }
  },
  "marine_fisheries_collapse": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en",
        "https://www.ipcc.ch/srocc/chapter/chapter-5/"
      ],
      "notes": "Tracks stock depletion trends and climate-driven marine protein insecurity."
    }
  },
  "reef_structural_collapse": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://coralreefwatch.noaa.gov/",
        "https://doi.org/10.1038/s41586-018-0194-z"
      ],
      "notes": "Monitors thermal bleaching heat stress and framework calcification loss."
    }
  },
  "mangrove_buffer_loss": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.globalmangrovewatch.org/",
        "https://doi.org/10.1038/s41598-020-61136-6"
      ],
      "notes": "Maps mangrove extent decline and models coastal storm protection and wave attenuation benefits."
    }
  },
  "coral_bleaching": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://coralreefwatch.noaa.gov/",
        "https://doi.org/10.1038/s41586-018-0194-z"
      ],
      "notes": "Tracks recurrent thermal stress and bleaching alerts that weaken coral survival, growth, and recovery."
    }
  },
  "coral_larval_mortality": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://coralreefwatch.noaa.gov/",
        "https://doi.org/10.1038/s41586-018-0194-z"
      ],
      "notes": "Tracks coral recruitment stress where heat anomalies and reef degradation reduce larval survival and settlement success."
    }
  },
  "coral_reef_fragmentation": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://coralreefwatch.noaa.gov/",
        "https://doi.org/10.1038/s41586-018-0194-z"
      ],
      "notes": "Tracks fragmentation of reef habitat as repeated bleaching and calcification loss break structural continuity."
    }
  },
  "fisheries_range_redistribution": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en",
        "https://www.ipcc.ch/srocc/chapter/chapter-5/"
      ],
      "notes": "Tracks shifting marine species ranges and stock geography as warming and oxygen stress alter habitat suitability."
    }
  },
  "phytoplankton_decline": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/srocc/chapter/chapter-5/",
        "https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en"
      ],
      "notes": "Tracks lower-ocean food-web stress where warming, acidification, and circulation change reduce plankton productivity."
    }
  },
  "shelf_sea_hypoxia": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/",
        "https://doi.org/10.1126/science.aam7240"
      ],
      "notes": "Tracks low-oxygen shelf waters as a more spatially specific extension of coastal hypoxia and warming-stratification stress."
    }
  },
  "estuarine_nursery_loss": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en",
        "https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/"
      ],
      "notes": "Tracks degradation of estuarine juvenile habitat under hypoxia, warming, and pollution stress that weakens fishery recruitment."
    }
  },
  "mangrove_destruction": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.globalmangrovewatch.org/",
        "https://doi.org/10.1038/s41598-020-61136-6"
      ],
      "notes": "Tracks direct mangrove loss that weakens coastal buffering, nursery habitat, and blue-carbon protection."
    }
  },
  "oceanic_carbon_sink_saturation": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/",
        "https://www.socat.info/"
      ],
      "notes": "Monitors weakening ocean carbon sink efficiency and fugacity of CO2 (fCO2) anomalies."
    }
  },
  "ice_sheet_mass_loss": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://imbie.org/publications/",
        "https://doi.org/10.5194/essd-15-1597-2023"
      ],
      "notes": "Compiles satellite observations of Greenland and Antarctic ice sheet mass loss."
    }
  },
  "sea_ice_season_loss": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://nsidc.org/sea-ice-today",
        "https://arctic.noaa.gov/report-card/"
      ],
      "notes": "Tracks sea ice extent anomalies and Arctic feedback loops."
    }
  },
  "arctic_sea_ice_thinning": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://nsidc.org/sea-ice-today",
        "https://arctic.noaa.gov/report-card/"
      ],
      "notes": "Tracks declining Arctic sea-ice thickness as a direct physical expression of shorter ice seasons and warmer polar oceans."
    }
  },
  "sea_ice_extent_deficits": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://nsidc.org/sea-ice-today",
        "https://arctic.noaa.gov/report-card/"
      ],
      "notes": "Tracks below-normal sea-ice area and extent as a directly monitored signal of cryosphere loss."
    }
  },
  "arctic_ice_retreat": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://nsidc.org/sea-ice-today",
        "https://arctic.noaa.gov/report-card/"
      ],
      "notes": "Tracks the spatial retreat of Arctic sea ice and its effects on exposed ocean, ecosystems, and heat absorption."
    }
  },
  "greenland_glacier_melting": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://imbie.org/publications/",
        "https://doi.org/10.5194/essd-15-1597-2023"
      ],
      "notes": "Tracks Greenland ice loss and glacier melt contribution inside the broader observed ice-sheet mass-balance record."
    }
  },
  "glacier_calving_events": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://imbie.org/publications/",
        "https://doi.org/10.5194/essd-15-1597-2023"
      ],
      "notes": "Tracks calving-driven ice loss where marine-terminating glaciers and ice margins shed mass to the ocean."
    }
  },
  "ice_sheet_thinning_speeds": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://imbie.org/publications/",
        "https://doi.org/10.5194/essd-15-1597-2023"
      ],
      "notes": "Tracks the pace of ice-sheet thinning as a direct measurement surface within mass-balance assessment."
    }
  },
  "subglacial_lake_drainages": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://imbie.org/publications/",
        "https://www.ipcc.ch/srocc/chapter/chapter-3-2/"
      ],
      "notes": "Tracks drainage and basal-hydrology shifts beneath ice sheets that signal changing meltwater routing and instability."
    }
  },
  "glacial_lake_outburst_floods": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/srocc/chapter/chapter-3-2/",
        "https://imbie.org/publications/"
      ],
      "notes": "Tracks flood risk from expanding glacial lakes as ice retreat and unstable moraine or ice dams raise outburst potential."
    }
  },
  "permafrost_thaw": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://gtnp.arcticportal.org/",
        "https://www.ipcc.ch/srocc/chapter/chapter-3-2/"
      ],
      "notes": "Monitors active layer thickness and borehole temperature trends; consolidates gas emission craters."
    }
  },
  "monsoon_volatility": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/",
        "https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_AnnexV.pdf"
      ],
      "notes": "Tracks monsoon rainfall variability, onset shifts, and regional circulation drivers."
    }
  },
  "el_nino": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.noaa.gov/understanding-el-nino",
        "https://psl.noaa.gov/enso/"
      ],
      "notes": "Tracks ENSO Oceanic Niño Index (ONI) and Pacific sea surface temperature anomalies."
    }
  },
  "la_nina": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://oceanservice.noaa.gov/facts/ninonina.html",
        "https://doi.org/10.1175/JCLI-D-19-0701.1"
      ],
      "notes": "Tracks ENSO cooling phase anomalies, Oceanic Niño Index (ONI) records, and Pacific teleconnections."
    }
  },
  "forest_fragmentation": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://doi.org/10.1126/sciadv.1500052",
        "https://www.globalforestwatch.org/topics/biodiversity/"
      ],
      "notes": "Links forest canopy edge effects and spatial fragmentation to biodiversity loss."
    }
  },
  "pollinator_service_decline": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipbes.net/assessment-reports/pollinators",
        "https://www.fao.org/pollination/en/"
      ],
      "notes": "Details wild and managed pollinator declines and risks to global crop yields."
    }
  },
  "peatland_degradation": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unep.org/resources/global-peatlands-assessment-2022",
        "https://www.ipcc-nggip.iges.or.jp/public/wetlands/"
      ],
      "notes": "Tracks peatland drainage, soil carbon oxidation, and fires."
    }
  },
  "wildfire_regime_shift": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://firms.modaps.eosdis.nasa.gov/",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/"
      ],
      "notes": "Monitors changes in fire weather, active thermal anomalies, burn severity, and smoke burden; requires a free API map key."
    }
  },
  "fast_fashion": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://doi.org/10.1038/s43017-020-0039-9",
        "https://www.unep.org/resources/publication/sustainability-and-circularity-textile-value-chain-global-roadmap"
      ],
      "notes": "Tracks fast-turnover apparel waste, wastewater, and supply chain emissions."
    }
  },
  "thermal_inversion_events": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/scram",
        "https://doi.org/10.1175/1520-0450(2004)043%3C0259:BOTIID%3E2.0.CO;2"
      ],
      "notes": "Tracks atmospheric stability layers trapping ground-level pollutants and fog."
    }
  },
  "nitrous_oxide": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://gml.noaa.gov/ccgg/trends_n2o/",
        "https://doi.org/10.5194/essd-16-2543-2024"
      ],
      "notes": "Tracks atmospheric N2O abundance trends and agricultural/industrial emissions."
    }
  },
  "cold_chain_failure_risk": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unep.org/resources/report/sustainable-food-cold-chains-opportunities-food-security-climate-action",
        "https://www.who.int/publications/m/item/Annex-9-k-trs-961"
      ],
      "notes": "Details cold chain storage and logistics vulnerabilities under extreme heat events."
    }
  },
  "transmission_buildout_lag": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://eta-publications.lbl.gov/sites/default/files/2025-12/queued_up_2025_edition_12.15.2025.pdf",
        "https://www.energy.gov/sites/default/files/2023-10/National_Transmission_Needs_Study_2023.pdf"
      ],
      "notes": "Tracks regional power grid constraints, interconnection queues, and permitting delays."
    }
  },
  "semiconductor_fabrication_footprint": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://arxiv.org/abs/2209.12523",
        "https://esg.tsmc.com/en-US/file/public/2024-TSMC-Sustainability-Report-e.pdf"
      ],
      "notes": "Details water and electricity footprint metrics of advanced silicon fabrication facilities."
    }
  },
  "cfc_saturated_layers": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://csl.noaa.gov/assessments/ozone/2022/"
      ],
      "notes": "Tracks stratospheric ozone depletion and halogenated source gas concentrations."
    }
  },
  "freeway_acoustic_walls_deficit": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fhwa.dot.gov/environment/noise/regulations_and_guidance/"
      ],
      "notes": "Tracks federal noise abatement criteria and highway noise barrier guidelines."
    }
  },
  "nunatak_habitat_shrinkage": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/srocc/chapter/chapter-3-2/"
      ],
      "notes": "Tracks habitat loss and isolative squeeze for high-altitude cryospheric species."
    }
  },
  "pumped_hydro_land_inundations": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/hydropower-special-market-report"
      ],
      "notes": "Details pumped storage land-use footprint and water management tradeoffs."
    }
  },
  "stratospheric_chlorine_sinks": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://csl.noaa.gov/assessments/ozone/2022/"
      ],
      "notes": "Tracks photochemical pathways of stratospheric chlorine and bromine removal."
    }
  },
  "airport_runway_canopy_clearance": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.faa.gov/airports/resources/advisory_circulars/index.cfm/go/document.current/documentnumber/150_5300-13"
      ],
      "notes": "FAA standards on obstacle clearance limits and runway safety area specifications."
    }
  },
  "marine_biodeposits_loss": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/4/i1750e/i1750e.pdf"
      ],
      "notes": "Tracks organic deposition and biodeposits loss in shellfish aquaculture."
    }
  },
  "supertanker_sound_waves": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.imo.org/en/MediaCentre/PressBriefings/pages/Underwater-radiated-noise-guidelines.aspx"
      ],
      "notes": "IMO recommendations for underwater acoustic noise mitigation in commercial vessels."
    }
  },
  "wildlife_habitat_patches": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://doi.org/10.1126/sciadv.1500052"
      ],
      "notes": "Studies spatial patterns in wildlife habitat patch sizes, connectivity, and trophic dynamics."
    }
  },
  "aerosol_scattering_index": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/"
      ],
      "notes": "Tracks aerosol optical scattering and masking behavior as part of the broader radiative forcing and air-pollution burden."
    }
  },
  "secondary_organic_aerosol_burden": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/",
        "https://www.epa.gov/pm-pollution/particulate-matter-pm-basics"
      ],
      "notes": "Tracks chemically formed secondary aerosols that add to fine-particle exposure and atmospheric pollution loading."
    }
  },
  "particulate_soot_levels": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/",
        "https://www.epa.gov/pm-pollution/particulate-matter-pm-basics"
      ],
      "notes": "Tracks soot and black-carbon particle burden as both an air-quality hazard and a climate-relevant aerosol load."
    }
  },
  "pm2_5_particulates": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/pm-pollution/particulate-matter-pm-basics",
        "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health"
      ],
      "notes": "Tracks fine particulate exposure at the PM2.5 scale as a widely used public-health and air-pollution indicator."
    }
  },
  "stratospheric_water_vapor": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/",
        "https://gml.noaa.gov/"
      ],
      "notes": "Tracks stratospheric water vapor as an upper-atmosphere feedback relevant to radiative forcing and circulation change."
    }
  },
  "stratospheric_cooling": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/",
        "https://csl.noaa.gov/assessments/ozone/2022/"
      ],
      "notes": "Tracks upper-atmosphere cooling linked to greenhouse forcing and ozone-chemistry interactions."
    }
  },
  "acid_rain_deposition": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/acidrain/what-acid-rain",
        "https://www.epa.gov/airmarkets/clean-air-markets-program-data"
      ],
      "notes": "Tracks sulfur- and nitrogen-driven acidic deposition that damages watersheds, soils, and ecosystems."
    }
  },
  "aerosolized_microplastics": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unep.org/plastic-pollution",
        "https://www.epa.gov/pm-pollution/particulate-matter-pm-basics"
      ],
      "notes": "Tracks airborne microplastic particle exposure as an emerging atmospheric pollution burden."
    }
  },
  "pollinator_colony_collapse": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipbes.net/assessment-reports/pollinators",
        "https://www.fao.org/pollination/en/"
      ],
      "notes": "Tracks acute pollinator colony decline where habitat stress, pesticides, and climate pressure translate into visible service failure."
    }
  },
  "seed_germination_drops": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipbes.net/assessment-reports/pollinators",
        "https://www.fao.org/pollination/en/"
      ],
      "notes": "Tracks falling germination success where heat, moisture stress, and ecological degradation weaken plant regeneration."
    }
  },
  "biodiversity_corridors_disruption": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://doi.org/10.1126/sciadv.1500052",
        "https://www.globalforestwatch.org/topics/biodiversity/"
      ],
      "notes": "Tracks breaks in habitat connectivity that weaken movement, recolonization, and long-term ecosystem resilience."
    }
  },
  "invasive_species_encroachment": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.gbif.org/",
        "https://www.iucnredlist.org/"
      ],
      "notes": "Tracks invasive spread pressure where disturbed ecosystems lose resistance and native species are pushed back."
    }
  },
  "monoculture_encroachments": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/faostat/",
        "https://www.ipbes.net/assessment-reports/pollinators"
      ],
      "notes": "Tracks simplified single-crop expansion that strips habitat diversity, weakens pollination support, and concentrates ecological risk."
    }
  },
  "macrofungal_mycelium_decay": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.gbif.org/",
        "https://www.iucnredlist.org/"
      ],
      "notes": "Tracks fungal-network decline as a soil and forest resilience stress signal in degraded ecosystems."
    }
  },
  "lichen_layer_degradations": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/srocc/chapter/chapter-3-2/",
        "https://www.gbif.org/"
      ],
      "notes": "Tracks lichen-layer loss in sensitive cold and dry ecosystems where recovery is slow and ecological buffering is thin."
    }
  },
  "top_predator_extinctions": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iucnredlist.org/",
        "https://doi.org/10.1126/sciadv.1500052"
      ],
      "notes": "Tracks upper-trophic collapse where fragmented habitats and declining prey webs remove stabilizing predators."
    }
  },
  "supply_chain_port_bottlenecks": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://unctad.org/system/files/official-document/rmt2024_en.pdf",
        "https://unctad.org/system/files/official-document/osginf2024d2_en.pdf"
      ],
      "notes": "Tracks climate-sensitive chokepoints in ports and logistics networks where congestion and disruption spill into wider supply chains."
    }
  },
  "commuter_rail_transit_gaps": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fra.dot.gov/",
        "https://www.transportation.gov/climate-and-sustainability"
      ],
      "notes": "Tracks rail-service vulnerability where transit dependence and heat or hazard exposure outpace network resilience."
    }
  },
  "railroad_chemical_car_derailments": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fra.dot.gov/",
        "https://www.epa.gov/emergency-response"
      ],
      "notes": "Tracks derailment and hazardous-material spill risk where rail disruption becomes a public-health and environmental hazard."
    }
  },
  "aviation_condensation_trails": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/",
        "https://www.iea.org/topics/transport"
      ],
      "notes": "Tracks warming-relevant contrail and aviation-atmosphere interactions rather than only direct fuel combustion."
    }
  },
  "aviation_jet_fuel_emissions": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/topics/transport",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/"
      ],
      "notes": "Tracks direct jet-fuel combustion as the core emissions pathway inside aviation climate forcing."
    }
  },
  "transformer_heat_failure_risk": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf",
        "https://www.energy.gov/"
      ],
      "notes": "Tracks transformer overheating and failure risk under rising electrical load and extreme heat stress."
    }
  },
  "gas_pipeline_leak_points": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.phmsa.dot.gov/",
        "https://gml.noaa.gov/ccgg/trends_ch4/"
      ],
      "notes": "Tracks methane and safety risk from pipeline leakage across fossil-gas transport networks."
    }
  },
  "fertilizer_price_shock": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/markets-and-trade/en/",
        "https://www.worldbank.org/en/research/commodity-markets"
      ],
      "notes": "Tracks fertilizer affordability stress where energy prices, trade disruption, and nutrient dependence spill directly into farming costs."
    }
  },
  "agricultural_labor_exposure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ilo.org/global/topics/safety-and-health-at-work/resources-library/publications/WCMS_711919/lang--en/index.htm",
        "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health"
      ],
      "notes": "Tracks agricultural work exposure where heat stress and unsafe field conditions reduce labor capacity and harvest reliability."
    }
  },
  "livestock_disease_pressure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/animal-health/en/",
        "https://www.woah.org/en/what-we-do/animal-health-and-welfare/"
      ],
      "notes": "Tracks animal-health pressure where warming, vectors, and intensified production increase livestock disease exposure."
    }
  },
  "topsoil_erosion_acceleration": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/soils-portal/en/",
        "https://soilgrids.org/"
      ],
      "notes": "Tracks faster topsoil loss where exposed fields, runoff, and degraded land management weaken long-term agricultural productivity."
    }
  },
  "feed_crop_dependency": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/faostat/",
        "https://www.fao.org/animal-production/en/"
      ],
      "notes": "Tracks livestock dependence on feed-crop systems that amplify land, fertilizer, and water pressure across food production."
    }
  },
  "irrigation_water_inefficiency": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/aquastat/en/",
        "https://www.worldbank.org/en/topic/water"
      ],
      "notes": "Tracks irrigation losses and weak delivery efficiency where scarce basin water is spent without proportional crop benefit."
    }
  },
  "nitrogen_fertilizer_runoff": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/nutrientpollution",
        "https://www.fao.org/soils-portal/en/"
      ],
      "notes": "Tracks excess nitrogen movement into waterways where fertilizer use degrades water quality and downstream ecosystem health."
    }
  },
  "groundwater_depletion_wells": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.usgs.gov/mission-areas/water-resources/science/groundwater-depletion",
        "https://www.fao.org/aquastat/en/"
      ],
      "notes": "Tracks well-level groundwater drawdown where extraction exceeds recharge and drought resilience erodes."
    }
  },
  "biodiversity_intactness_loss": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://doi.org/10.1126/sciadv.1500052",
        "https://www.globalforestwatch.org/topics/biodiversity/"
      ],
      "notes": "Tracks loss of ecosystem intactness where habitat degradation and fragmentation remove species richness and functional resilience."
    }
  },
  "aquifer_overdraft": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.usgs.gov/mission-areas/water-resources/science/groundwater-depletion",
        "https://www.wri.org/aqueduct"
      ],
      "notes": "Tracks chronic groundwater overdraft where withdrawals outpace recharge and long-lived water security declines."
    }
  },
  "river_flow_regime_shift": {
    "name": "River Flow Regime Change",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/",
        "https://www.usgs.gov/mission-areas/water-resources"
      ],
      "notes": "Tracks changing flow timing and magnitude where warming, snowmelt change, and drought alter river-system reliability."
    }
  },
  "hydropower_reliability_decline": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/hydropower-special-market-report",
        "https://www.energy.gov/water-power-technologies-office/hydropower-basics"
      ],
      "notes": "Tracks falling hydropower reliability where drought, altered runoff timing, and reservoir stress reduce dependable generation."
    }
  },
  "plastics_petrochemicals": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unep.org/plastic-pollution",
        "https://www.iea.org/reports/the-future-of-petrochemicals"
      ],
      "notes": "Tracks petrochemical and plastics production as a fossil-fuel, waste, and pollution system rather than an undocumented industrial placeholder."
    }
  },
  "fertilizer_production": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/soils-portal/en/",
        "https://www.iea.org/reports/ammonia-technology-roadmap"
      ],
      "notes": "Tracks emissions- and energy-intensive fertilizer production, especially ammonia, as a direct upstream pressure inside industrial agriculture."
    }
  },
  "mining_critical_minerals": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/global-critical-minerals-outlook-2025",
        "https://www.worldbank.org/en/topic/extractiveindustries"
      ],
      "notes": "Tracks extraction pressure around transition minerals where energy demand, water use, waste, and land disruption concentrate."
    }
  },
  "urban_sprawl_housing": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unep.org/resources/global-environment-outlook-6",
        "https://www.unhabitat.org/"
      ],
      "notes": "Tracks land-expansive housing growth where sprawl raises heat, runoff, transport dependence, and infrastructure burden."
    }
  },
  "steel": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/iron-and-steel-technology-roadmap",
        "https://worldsteel.org/"
      ],
      "notes": "Tracks steel as a major industrial emissions and materials node rather than an undocumented shorthand."
    }
  },
  "cement_concrete": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/cement",
        "https://gccassociation.org/"
      ],
      "notes": "Tracks cement and concrete as process-emissions-intensive materials with large embodied carbon and infrastructure lock-in."
    }
  },
  "food_waste": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unep.org/resources/report/unep-food-waste-index-report-2024",
        "https://www.fao.org/platform-food-loss-waste/en/"
      ],
      "notes": "Tracks food loss and waste as a direct pressure on land, water, methane, and overall food-system inefficiency."
    }
  },
  "aviation": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/topics/transport",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/"
      ],
      "notes": "Tracks aviation as a transport-emissions and upper-atmosphere forcing sector rather than an undocumented transport placeholder."
    }
  },
  "shipping": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://unctad.org/system/files/official-document/rmt2024_en.pdf",
        "https://www.imo.org/"
      ],
      "notes": "Tracks global shipping as a trade, fuel-combustion, and chokepoint-dependent system rather than an undocumented transport placeholder."
    }
  },
  "air_conditioning_refrigerants": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unep.org/ozonaction/who-we-are/about-montreal-protocol",
        "https://www.iea.org/reports/the-future-of-cooling"
      ],
      "notes": "Tracks cooling demand and refrigerant leakage as a direct heat-adaptation and climate-forcing node rather than an undocumented appliance bucket."
    }
  },
  "flash_flood_regime": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.weather.gov/pub/pnsfloodsafety",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/"
      ],
      "notes": "Tracks shifts in the frequency or intensity of short-duration flood-producing rainfall and runoff, rather than a vague generic flood alarm."
    }
  },
  "blocking_pattern_persistence": {
    "name": "Persistent Atmospheric Blocking",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.noaa.gov/jetstream/jet-stream",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/"
      ],
      "notes": "Tracks long-lived atmospheric blocking patterns that hold weather in place and can prolong heat, drought, rainfall, or smoke episodes over the same region."
    }
  },
  "humidity_amplification": {
    "name": "Atmospheric Moisture Amplification",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://power.larc.nasa.gov/",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/"
      ],
      "notes": "Tracks amplification of atmospheric moisture and heat-humidity stress where warming lifts water-vapor load and pushes conditions toward more dangerous apparent heat."
    }
  },
  "lightning_fire_weather": {
    "name": "Lightning Ignition under Fire Weather Conditions",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://firms.modaps.eosdis.nasa.gov/",
        "https://www.nifc.gov/fire-information/statistics/wildfires"
      ],
      "notes": "Tracks fire-prone weather patterns where dryness, instability, and lightning align to raise wildfire ignition and spread risk."
    }
  },
  "atmospheric_dryness": {
    "name": "Atmospheric Evaporative Demand",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://power.larc.nasa.gov/",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/"
      ],
      "notes": "Tracks dry atmospheric demand and moisture stress where warmer air and circulation shifts intensify evaporation and vegetation desiccation."
    }
  },
  "soot_deposition_on_snow": {
    "name": "Black Carbon Darkening of Snow",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://arctic.noaa.gov/report-card/",
        "https://nsidc.org/sea-ice-today"
      ],
      "notes": "Tracks dark particle deposition on snow and ice where reduced surface reflectivity can accelerate melt and amplify polar heat absorption."
    }
  },
  "ozone_formation_pressure": {
    "name": "Climate Penalty on Surface Ozone",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics",
        "https://www.airnow.gov/"
      ],
      "notes": "Tracks the precursor and weather conditions that raise the likelihood of harmful ground-level ozone formation."
    }
  },
  "rossby_wave_stalling": {
    "name": "Persistent Rossby Wave Patterns",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.noaa.gov/jetstream/jet-stream",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/"
      ],
      "notes": "Tracks stalled or slow-moving planetary-wave patterns that can lock in anomalous heat, storm, or drought conditions."
    }
  },
  "smoke_exposure_burden": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.airnow.gov/wildfire-smoke-and-air-quality-resources/",
        "https://www.epa.gov/wildfire-smoke-course"
      ],
      "notes": "Tracks the health and air-quality burden of repeated smoke exposure from wildfire and landscape fire events."
    }
  },
  "low_cloud_deck_retreat": {
    "name": "Marine Low-Cloud Decline",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/",
        "https://gml.noaa.gov/"
      ],
      "notes": "Tracks retreat or thinning of reflective low cloud decks where cloud-cover change can alter regional radiation balance and surface heating."
    }
  },
  "tropospheric_ozone": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics",
        "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health"
      ],
      "notes": "Tracks harmful ozone in the lower atmosphere as an air-pollution and crop-damage burden distinct from protective stratospheric ozone."
    }
  },
  "ground_level_ozone_triggers": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics",
        "https://www.airnow.gov/"
      ],
      "notes": "Tracks the heat, sunlight, and precursor-pollution mix that makes ground-level ozone episodes more likely."
    }
  },
  "snowmelt_timing_shift": {
    "name": "Shift in Snowmelt Timing",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://nsidc.org/snow-today/about-snow-today",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/"
      ],
      "notes": "Tracks observed shifts in when seasonal snow melts, making this a bounded timing signal rather than a generic cryosphere placeholder."
    }
  },
  "snow_drought": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://nsidc.org/snow-today/about-snow-today",
        "https://www.drought.gov/topics/snow-drought"
      ],
      "notes": "Tracks snow-drought conditions where snowpack is unusually low for the season, without implying every snow deficit maps to glacier dependence."
    }
  },
  "thermokarst_expansion": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://data.gtn-p.org/",
        "https://www.usgs.gov/mission-areas/climate-research-and-development/science/permafrost"
      ],
      "notes": "Tracks expanding thermokarst terrain where thawing ice-rich permafrost causes subsidence, ponding, and infrastructure instability."
    }
  },
  "firn_layer_depletion": {
    "name": "Loss of Firn Meltwater Storage Capacity",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/",
        "https://nsidc.org/data/measures"
      ],
      "notes": "Tracks loss of firn meltwater storage capacity on land ice, a narrower and more defensible framing than treating firn depletion as a free-floating glacier tail."
    }
  },
  "glacial_lake_failure_risk": {
    "name": "Glacial Lake Outburst Flood Risk",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://rds.icimod.org/metadata/8881454b-6f7c-461b-95c2-eaf7618230d9",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/"
      ],
      "notes": "Tracks glacial lake outburst-flood risk where retreating ice and unstable moraine or ice dams increase downstream hazard exposure."
    }
  },
  "freshwater_lens_compression": {
    "name": "Freshwater Lens Thinning in Small Islands",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers",
        "https://www.unesco.org/en/ihp"
      ],
      "notes": "Tracks thinning and salinization of small-island freshwater lenses, keeping this node tied to a real hydrogeology problem rather than a vague water-stress abstraction."
    }
  },
  "coastal_aquifer_degradation": {
    "name": "Coastal Aquifer Salinization",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion-and-coastal-aquifers",
        "https://www.wri.org/aqueduct"
      ],
      "notes": "Tracks degradation of coastal groundwater quality where salinization and overdraw reduce the usability of local aquifer supplies."
    }
  },
  "glacier_meltwater_dependency": {
    "name": "Glacier-Fed Water Dependence",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.earthdata.nasa.gov/data/tools/glims-glacier-database",
        "https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/"
      ],
      "notes": "Tracks places whose seasonal water systems rely on glacier runoff, making dependence itself the defensible exposure signal rather than any one downstream impact."
    }
  },
  "freight_electrification_gap": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/global-ev-outlook-2025",
        "https://theicct.org/heavy-duty-vehicles/"
      ],
      "notes": "Tracks the gap between current freight fleets and a credible heavy-duty electrification transition using truck-specific market and policy evidence."
    }
  },
  "port_heat_vulnerability": {
    "name": "Port Heat-Related Operational Vulnerability",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://unctad.org/news/climate-change-impacts-seaports-growing-threat-sustainable-trade-and-development",
        "https://msi.nga.mil/Publications/WPI"
      ],
      "notes": "Tracks heat-related operational vulnerability at ports, intentionally softer than a broad port-climate hazard claim and not a proxy for surge or flood exposure."
    }
  },
  "airport_climate_exposure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.faa.gov/data",
        "https://www.faa.gov/airports/planning_capacity/sustainability/resilience"
      ],
      "notes": "Tracks airport exposure to climate stress using official airport registries and resilience guidance, especially around heat, flooding, and operational constraints."
    }
  },
  "bridge_scour_exposure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://infobridge.fhwa.dot.gov/data",
        "https://www.fhwa.dot.gov/engineering/hydraulics/bridge_scour/"
      ],
      "notes": "Tracks bridge scour exposure through official bridge inventory and hydraulic-risk practice, making it one of the stronger infrastructure-tail nodes."
    }
  },
  "arctic_shipping_expansion": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://pame.is/ourwork/arctic-shipping/current-shipping-projects/astd/",
        "https://www.imo.org/"
      ],
      "notes": "Tracks observed expansion of Arctic shipping activity as navigable sea-ice windows lengthen, while keeping the node grounded in route and traffic evidence rather than a generic northern trade thesis."
    }
  },
  "ocean_current_regime_shift": {
    "name": "Ocean Circulation Regime Shifts",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://rapid.ac.uk/",
        "https://www.ncei.noaa.gov/products/world-ocean-database"
      ],
      "notes": "Tracks ocean circulation regime shifts as a broad parent-level circulation node, without collapsing it into any single AMOC-collapse claim."
    }
  },
  "marine_food_web_simplification": {
    "name": "Marine Food-Web Reorganization",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fisheries.noaa.gov/",
        "https://www.ncei.noaa.gov/products/world-ocean-database"
      ],
      "notes": "Tracks marine food-web reorganization under changing ocean structure and species movement, avoiding a misleading implication of uniform collapse everywhere."
    }
  },
  "ocean_salinity_stratification": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://argo.ucsd.edu/",
        "https://www.ncei.noaa.gov/products/world-ocean-database"
      ],
      "notes": "Tracks changing salinity layering and vertical structure in the ocean, a directly observed physical pattern with strong defensibility."
    }
  },
  "pelagic_species_redistribution": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.gbif.org/",
        "https://www.fisheries.noaa.gov/"
      ],
      "notes": "Tracks redistribution of pelagic species across monitored occurrence and survey systems as habitat conditions and circulation patterns shift."
    }
  },
  "littoral_surge_vulnerability": {
    "name": "Coastal Storm-Surge Exposure",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://coast.noaa.gov/floodexposure/",
        "https://oceanservice.noaa.gov/facts/sealevel.html"
      ],
      "notes": "Tracks coastal storm-surge exposure using mapped flood-exposure context, making this a bounded coastal-hazard node rather than a vague littoral stress signal."
    }
  },
  "species_range_compression": {
    "name": "Species Range Contraction",
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iucnredlist.org/",
        "https://www.gbif.org/"
      ],
      "notes": "Tracks species range contraction through occurrence and assessment frameworks, without implying that every contraction is climate-driven by default."
    }
  },
  "soil_humus_decline": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/soils-portal/soil-management/soil-organic-carbon/en/",
        "https://soilgrids.org/"
      ],
      "notes": "Tracks declining soil humus and organic carbon as a foundational soil-fertility and water-retention loss, rather than a free-floating agricultural residue node."
    }
  },
  "insect_biomass_decline": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.ipbes.net/assessment-reports/pollinators",
        "https://www.fao.org/pollination/en/"
      ],
      "notes": "Tracks broad declines in insect abundance and biomass where habitat simplification, warming, and pollinator stress start to erode food-web and crop-support functions."
    }
  },
  "watershed_forest_loss": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.globalforestwatch.org/topics/biodiversity/",
        "https://www.wri.org/aqueduct",
        "https://www.fao.org/forest-resources-assessment/en/"
      ],
      "notes": "Tracks loss of forest cover and buffering function in critical watersheds, where land-cover change reshapes runoff, erosion, habitat quality, and downstream water reliability."
    }
  },
  "coastal_inundation_risk": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://oceanservice.noaa.gov/facts/sealevel.html",
        "https://sealevel.nasa.gov/"
      ],
      "notes": "Tracks recurring and escalating coastal flood exposure from sea-level rise, shoreline erosion, and higher baseline water levels rather than a generic coastal alarm node."
    }
  },
  "harmful_algal_blooms": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://oceanservice.noaa.gov/hazards/hab/",
        "https://www.epa.gov/cyanohabs"
      ],
      "notes": "Tracks toxic or otherwise damaging algal bloom outbreaks across fresh, estuarine, and coastal waters where warming and nutrient stress can translate into ecological and public-health harm."
    }
  },
  "aviation_demand_growth": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/energy-system/transport/aviation",
        "https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/"
      ],
      "notes": "Tracks rising aviation activity as a direct transport-emissions and high-altitude forcing pressure, instead of leaving it as a generic modeled demand tail."
    }
  },
  "rail_heat_buckling": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://railroads.dot.gov/",
        "https://www.transportation.gov/climate-and-sustainability"
      ],
      "notes": "Tracks heat-driven rail deformation and service risk where hotter track conditions can force slow orders, cancellations, and higher derailment exposure."
    }
  },
  "cement_process_emissions": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/cement",
        "https://www.iea.org/reports/demand-and-supply-measures-for-the-steel-and-cement-transition"
      ],
      "notes": "Tracks the irreducible process-emissions burden of cement production, especially clinker calcination, inside the wider construction materials system."
    }
  },
  "industrial_heat_decarbonization_gap": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.energy.gov/cmei/ito/process-heat-basics",
        "https://www.iea.org/reports/the-future-of-heat-pumps"
      ],
      "notes": "Tracks the decarbonization bottleneck in industrial process heat, where reliable high-temperature demand still outpaces electrification and low-emissions alternatives."
    }
  },
  "steel_decarbonization_gap": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/iron-and-steel-technology-roadmap",
        "https://www.iea.org/reports/demand-and-supply-measures-for-the-steel-and-cement-transition"
      ],
      "notes": "Tracks the gap between current steelmaking routes and the lower-emissions technologies, scrap systems, and clean-power inputs needed for a credible transition."
    }
  },
  "peaker_plant_lock_in": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf",
        "https://www.eia.gov/energyexplained/natural-gas/use-of-natural-gas.php"
      ],
      "notes": "Tracks the persistence of fossil peaker capacity where reliability markets and peak-load planning still favor fast-start gas generation."
    }
  },
  "transformer_supply_bottleneck": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.energy.gov/sites/default/files/2023-10/National_Transmission_Needs_Study_2023.pdf",
        "https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf"
      ],
      "notes": "Tracks grid-equipment bottlenecks where transformer and substation constraints slow interconnection, reliability upgrades, and broader grid expansion."
    }
  },
  "gas_power_dependence": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.eia.gov/energyexplained/natural-gas/use-of-natural-gas.php",
        "https://www.epa.gov/egrid"
      ],
      "notes": "Tracks dependence on gas-fired power as a continuing electricity-system anchor that shapes emissions, reliability choices, and fossil fallback."
    }
  },
  "backup_generator_dependence": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report",
        "https://www.epa.gov/egrid"
      ],
      "notes": "Tracks infrastructure dependence on diesel or gas backup generation where primary grid resilience remains insufficient for critical operations."
    }
  },
  "critical_mineral_extraction_pressure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/global-critical-minerals-outlook-2025",
        "https://www.worldbank.org/en/topic/extractiveindustries"
      ],
      "notes": "Tracks the environmental and supply pressure created by rising demand for transition minerals across batteries, grids, and electrified industry."
    }
  },
  "renewable_curtailment_losses": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://eta-publications.lbl.gov/sites/default/files/2025-12/queued_up_2025_edition_12.15.2025.pdf",
        "https://www.energy.gov/sites/default/files/2023-10/National_Transmission_Needs_Study_2023.pdf"
      ],
      "notes": "Tracks renewable generation that cannot fully reach load because wires, interconnection, storage, or operating flexibility lag behind deployment."
    }
  },
  "battery_supply_chain_pressure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/global-ev-outlook-2025",
        "https://www.iea.org/reports/global-critical-minerals-outlook-2025"
      ],
      "notes": "Tracks strain across battery manufacturing and upstream materials systems as electrification scales faster than resilient low-impact supply can follow."
    }
  },
  "reservoir_storage_instability": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.iea.org/reports/hydropower-special-market-report",
        "https://www.usbr.gov/"
      ],
      "notes": "Tracks instability in usable reservoir storage where altered inflows, drought, and sedimentation reduce water-supply and hydropower reliability."
    }
  },
  "reservoir_operating_shortfall": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.usbr.gov/",
        "https://www.iea.org/reports/hydropower-special-market-report"
      ],
      "notes": "Tracks the operating consequence when reservoirs cannot reliably deliver expected storage, release timing, or generation support."
    }
  },
  "wastewater_infrastructure_overflow": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/npdes/combined-sewer-overflows-csos",
        "https://www.epa.gov/waterutilityresponse/water-sector-climate-resilience-evaluation-and-awareness-tool-creat"
      ],
      "notes": "Tracks wastewater overflow risk where stormwater, inundation, or plant-capacity limits cause collection and treatment systems to exceed safe handling thresholds."
    }
  },
  "wastewater_bypass_discharge": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.epa.gov/npdes/combined-sewer-overflows-csos",
        "https://www.epa.gov/cwsrf"
      ],
      "notes": "Tracks bypass or overflow discharge events where utilities release untreated or partially treated wastewater under hydraulic stress."
    }
  },
  "polar_infrastructure_failure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://data.gtn-p.org/",
        "https://www.usgs.gov/mission-areas/climate-research-and-development/science/permafrost"
      ],
      "notes": "Tracks failure risk in polar and subarctic infrastructure where thawing ground undermines foundations, pipelines, roads, and remote facilities."
    }
  },
  "energy_affordability_crisis": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.energy.gov/scep/low-income-energy-affordability-data-lead-tool-and-community-energy-solutions",
        "https://www.eia.gov/electricity/monthly/"
      ],
      "notes": "Tracks the household affordability side of climate-energy stress where high bills, peak demand, and volatile supply turn energy access into a resilience problem."
    }
  },
  "utility_disconnection_risk": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.energy.gov/scep/low-income-energy-affordability-data-lead-tool-and-community-energy-solutions",
        "https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap"
      ],
      "notes": "Tracks shutoff and service-loss risk where energy burden crosses into direct household exposure during extreme conditions."
    }
  },
  "urban_tree_canopy_loss": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fs.usda.gov/managing-land/urban-forests/ucf",
        "https://www.epa.gov/heatislands"
      ],
      "notes": "Tracks decline in urban tree canopy where heat, drought, pests, and development reduce shade, cooling, and stormwater-buffering function."
    }
  },
  "fishery_protein_dependence": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en",
        "https://www.fao.org/fishery/en"
      ],
      "notes": "Tracks populations and food systems that rely heavily on fish as a protein source, making fisheries disruption a direct food-security exposure rather than a vague social spillover."
    }
  },
  "fish_landing_supply_disruption": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.fao.org/fishery/en",
        "https://www.fisheries.noaa.gov/"
      ],
      "notes": "Tracks instability in fish landings and local seafood supply as a practical consequence of shifting stocks, access, and disrupted coastal operations."
    }
  },
  "climate_litigation_pressure": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.unep.org/resources/report/global-climate-litigation-report-2023-status-review",
        "https://climatecasechart.com/"
      ],
      "notes": "Tracks rising climate-litigation pressure where liability, disclosure, adaptation, and rights claims increasingly shape public and private climate decision-making."
    }
  },
  "airport_operational_disruption": {
    "calibration": {
      "source_status": "official_registry_link",
      "source_urls": [
        "https://www.faa.gov/data",
        "https://www.faa.gov/airports/planning_capacity/sustainability/resilience"
      ],
      "notes": "Tracks airport service disruption as the operational layer between climate exposure and wider transport or economic consequences."
    }
  }
};

function applyNodeSourcePackOverride(node) {
  const override = NODE_SOURCE_PACK_OVERRIDES[node.id];
  if (!override) return node;
  return {
    ...node,
    name: override.name || node.name,
    source_status: override.calibration?.source_status || node.source_status,
    source_urls: uniqueValues([
      ...(node.source_urls || []),
      ...(override.calibration?.source_urls || [])
    ]),
    calibration: {
      ...(node.calibration || {}),
      ...(override.calibration || {}),
      source_urls: uniqueValues([
        ...(node.calibration?.source_urls || []),
        ...(override.calibration?.source_urls || [])
      ])
    }
  };
}

function applyFinalNodeSourcePackOverride(node) {
  if (!NODE_SOURCE_PACK_OVERRIDES[node.id]) return node;
  const currentStatus = node.calibration?.source_status || node.source_status || 'undocumented';
  if (!['undocumented', 'inherited', 'family_calibrated_reference'].includes(currentStatus)) return node;
  return applyNodeSourcePackOverride(node);
}

function generateScaleFreeEcosystem(baseNodes, baseEdges, targetNodeCount) {
  const nodes = baseNodes.map(n => {
    const calibratedAnchor = calibrateAnchorFromMetrics(n);
    const isResponseNode = calibratedAnchor.node_kind === 'response';
    const baseline = isResponseNode
      ? calibratedAnchor.responseProfile?.overall || calculateBaselineScore(calibratedAnchor.vector)
      : calculateBaselineScore(calibratedAnchor.vector);
    const context = getNodeContext(calibratedAnchor.sphere, calibratedAnchor.name);
    const calibrationProfile = getAnchorCalibrationProfile(calibratedAnchor);
    
    return applyNodeSourcePackOverride({
      ...calibratedAnchor,
      context,
      calibration: {
        role: 'anchor',
        method: 'source_profile_v1',
        reviewed_at: CALIBRATION_RUBRIC.reviewed_at,
        rubric: CALIBRATION_RUBRIC.vector_dimensions,
        source_status: calibrationProfile.source_status,
        source_urls: calibrationProfile.source_urls,
        api_keys: calibrationProfile.api_keys,
        notes: calibrationProfile.notes,
        metric: calibratedAnchor.calibration_metric || null
      },
      update_policy: {
        last_updated: '2026-06-01',
        update_cadence: 'monthly',
        source_window: 'previous 30 days'
      },
      score: {
        baseline: baseline,
        band: isResponseNode
          ? calibratedAnchor.responseProfile?.band || getResponseLeverageLabel(baseline)
          : getScoreBand(baseline)
      },
      impactScore: Math.round(baseline * 10)
    });
  });
  const edges = baseEdges.map(edge => ({
    ...edge,
    topology_rule: edge.topology_rule || 'curated_base'
  }));
  const pushEdge = createEdgeInserter(edges);

  // 1. Generate Nodes
  const canonicalCatalog = buildCanonicalProceduralCatalog(baseNodes);
  const remainingCapacity = Math.max(0, targetNodeCount - nodes.length);
  const selectedProceduralNodes = canonicalCatalog.slice(0, remainingCapacity);

  // Add a special generated label to distinguish procedurally created nodes
  const adjsTemplate = [
    { min: 0, max: 25, label: 'Stable' },
    { min: 25, max: 50, label: 'Elevated' },
    { min: 50, max: 75, label: 'Critical' },
    { min: 75, max: 100, label: 'Runaway' }
  ];

  selectedProceduralNodes.forEach(({ sphereKey, sphere, name, id }) => {
    const anchorNode =
      selectProceduralFamilyAnchor(baseNodes, { id, sphere: sphereKey }) ||
      selectSphereFallbackAnchor(baseNodes, sphereKey, id) ||
      seededChoice(baseNodes, id, 'fallback-anchor-any');
    const calibrated = calibrateGeneratedNode(id, name, sphereKey, sphere, anchorNode);
    const vector = calibrated.vector;
    const baseVal = calibrated.baseValue;
    const baseline = calculateBaselineScore(vector);
    const context = getNodeContext(sphereKey, name);

    const newNode = {
      id: id,
      name: name,
      vector: vector,
      baseValue: baseVal,
      value: baseVal,
      description: calibrated.description,
      adjectives: adjsTemplate,
      sphere: sphereKey, // metadata
      context,
      calibration: {
        role: 'generated',
        method: 'anchor_blend_v1',
        reviewed_at: CALIBRATION_RUBRIC.reviewed_at,
        anchor_id: anchorNode ? anchorNode.id : null,
        anchor_weight: parseFloat(calibrated.anchorWeight.toFixed(2)),
        source_status: anchorNode ? getAnchorCalibrationProfile(anchorNode).source_status : 'inherited',
        source_urls: anchorNode ? getAnchorCalibrationProfile(anchorNode).source_urls : [],
        api_keys: anchorNode ? getAnchorCalibrationProfile(anchorNode).api_keys : []
      },
      update_policy: {
        last_updated: '2026-06-01',
        update_cadence: 'monthly',
        source_window: 'previous 30 days'
      },
      score: {
        baseline: baseline,
        band: getScoreBand(baseline)
      },
      impactScore: Math.round(baseline * 10)
    };

    const impactTaggedNode = attachImpactProfiles(newNode, anchorNode);
    const overriddenNode = applyNodeSourcePackOverride(impactTaggedNode);
    nodes.push(overriddenNode);
  });

  // Connect each procedural node to a reviewed evidence family without asserting causality.
  const baseNodesCount = baseNodes.length;

  for (let i = baseNodesCount; i < nodes.length; i++) {
    const node = nodes[i];
    const familyAnchor = selectProceduralFamilyAnchor(baseNodes, node);
    const expansionFamily = PROCEDURAL_FAMILY_BY_SPHERE[node.sphere];

    if (familyAnchor && expansionFamily) {
      pushEdge({
        source: familyAnchor.id,
        target: node.id,
        verb: 'can add pressure to',
        adverb: `through anchor-supported inference in the ${expansionFamily.replace(/_/g, ' ')} family`,
        influence: 0.18,
        topology_rule: 'anchor_inference',
        expansion_family: expansionFamily
      });
    }
  }

  const collapsed = applySemanticCollapse(nodes, edges);
  const collapsedNodeMap = new Map(collapsed.nodes.map(node => [node.id, node]));
  const evidencedEdges = collapsed.edges.map(edge => attachEdgeEvidence(edge, collapsedNodeMap));
  const reviewedEdges = evidencedEdges.filter(edge => (
    !['expansion_inbound', 'expansion_inbound_semantic', 'expansion_outbound'].includes(edge.topology_rule)
    && !SUPPRESSED_EDGE_KEYS.has(`${edge.source}->${edge.target}`)
    && !isReviewedExpansionResidue(edge)
  ));
  return { nodes: collapsed.nodes, edges: reviewedEdges };
}

const GRAPH_PROFILES = {
  baseline: {
    id: GRAPH_PROFILE_SETTINGS.baseline.id,
    targetNodeCount: GRAPH_PROFILE_SETTINGS.baseline.targetNodeCount,
    baseNodes: BASE_NODES,
    baseEdges: CURATED_BASE_EDGES,
    metadata: {
      plan: 'Baseline',
      baselineNodeCount: GRAPH_PROFILE_SETTINGS.baseline.targetNodeCount,
      addedAnchorCount: 0,
      totalAnchorCount: BASE_NODES.length,
      reversible: true
    }
  },
  northstar: buildNodeExpansionProfile(BASE_NODES, CURATED_BASE_EDGES)
};

const ACTIVE_GRAPH_PROFILE = GRAPH_PROFILE_SETTINGS.active;
const activeGraphProfile = GRAPH_PROFILES[ACTIVE_GRAPH_PROFILE] || GRAPH_PROFILES.baseline;
const expanded = generateScaleFreeEcosystem(
  activeGraphProfile.baseNodes,
  activeGraphProfile.baseEdges,
  activeGraphProfile.targetNodeCount
);
const OPERATIONAL_NODE_NAME_PATTERN = /(risk|exposure|pressure|gap|shortfall|dependence|dependency|bottleneck|fragility|stress|burden|capacity|volatility|inequality|loss|decline|failure|disruption|retreat|lock-in)/i;
const NODE_AUTHENTICITY_NAME_OVERRIDES = {
  aero_acoustic_jet_noise_plumes: 'Aeroacoustic Aircraft Noise',
  aquifer_recharge_failure: 'Groundwater Recharge Decline',
  agricultural_crop_insurance_hikes: 'Crop Insurance Premium Increases',
  agricultural_silt_runoff_plumes: 'Agricultural Sediment Runoff',
  agrochemical_water_sinks: 'Agrochemical Water Pollution',
  anoxic_dead_zones: 'Coastal Hypoxic Dead Zones',
  biomass_incinerator_fallout: 'Biomass Combustion Air Pollution',
  coal_fired_power_outflow: 'Coal-Fired Power Plant Emissions',
  cloud_albedo_shift: 'Cloud Radiative Effect Change',
  coastal_aquifer_degradation: 'Coastal Aquifer Salinization',
  coastal_property_insurance_redlines: 'Coastal Property Insurance Nonrenewal',
  deepwater_petroleum_spill_risk: 'Deepwater Petroleum Operations',
  cold_chain_refrigerant_leaks: 'Cold-Chain Refrigerant Leakage',
  commercial_refrigeration_freon_leaks: 'Commercial Refrigeration Refrigerant Leakage',
  coral_larval_mortality: 'Coral Larval Survival and Recruitment Failure',
  deep_ocean_heat_sinks: 'Deep-Ocean Heat Uptake',
  desertification_frontiers: 'Dryland Degradation',
  electrical_grid_load_sinks: 'Electricity Demand Concentration',
  ev_battery_metal_chains: 'EV Battery Mineral Supply Chains',
  fishery_border_dispute_zones: 'Transboundary Fisheries Disputes',
  fugitive_dust_plumes: 'Fugitive Dust Emissions',
  geothermal_gas_outflow: 'Geothermal Non-CO2 Gas Emissions',
  glass_furnace_combustion_sinks: 'Glass Furnace Combustion Emissions',
  hyperscale_server_hall: 'Hyperscale Data Center Server Hall',
  industrial_flaring_outflow: 'Industrial Flaring Emissions',
  landfill_methane_outflows: 'Landfill Methane Emissions',
  methane_hydroxyl_sink_loss: 'Atmospheric Hydroxyl Sink Weakening',
  peatland_degradations: 'Peatland Degradation',
  pelagic_zone_depletion: 'Pelagic Fish Stock Depletion',
  permafrost_cave_ins: 'Thermokarst Ground Collapse',
  pesticide_bioaccumulation_chains: 'Pesticide Bioaccumulation',
  pesticide_spray_drift_zones: 'Pesticide Spray Drift',
  petroleum_drilling_footprints: 'Petroleum Extraction Land Disturbance',
  rice_paddy_methane_bubbles: 'Rice Paddy Methane Emissions',
  riparian_zone_erosion: 'Riparian Erosion',
  siberian_permafrost_sinkholes: 'Permafrost Thermokarst Collapse',
  solar_radiation_trapping: 'Greenhouse Gas Effective Radiative Forcing',
  suburban_slum_expansion_areas: 'Informal Settlement Expansion',
  synthetic_fertilizer_n2o_outflow: 'Fertilizer-Related Nitrous Oxide Emissions',
  tropospheric_warming_speeds: 'Tropospheric Warming Rate',
  tundra_shrubification_speeds: 'Tundra Shrub Expansion',
  urban_commuting_time_traps: 'Excessive Urban Commute Times',
  urban_parking_lot_sprawls: 'Surface Parking Expansion',
  urban_water_rationing_zones: 'Urban Water Rationing',
  water_aquifer_conflict_zones: 'Transboundary Aquifer Conflict Risk',
  wetlands_drainage_scales: 'Wetland Drainage',
  wildfire_scorched_earth: 'High-Severity Wildfire Burn Scars'
};

const NODE_SPHERE_OVERRIDES = {
  aquifer_overdraft: 'freshwater',
  drinking_water_treatment_stress: 'freshwater',
  wastewater_infrastructure_overflow: 'freshwater',
  wastewater_bypass_discharge: 'freshwater',
  reservoir_storage_instability: 'freshwater',
  reservoir_operating_shortfall: 'freshwater',
  freshwater_lens_compression: 'freshwater',
  groundwater_depletion_wells: 'freshwater',
  deep_well_water_table_drops: 'freshwater',
  coastal_aquifer_degradation: 'freshwater',
  public_health_heat_burden: 'health',
  vector_borne_disease_expansion: 'health'
};

function attachNodeAuthenticity(node) {
  const role = node.calibration?.role || 'unknown';
  const hasNodeSpecificNotes = Boolean(node.calibration?.notes?.trim());
  const sourceUrls = node.calibration?.source_urls || [];
  const isOperationalIndicator = node.authored_node_class
    ? node.authored_node_class === 'operational_indicator'
    : OPERATIONAL_NODE_NAME_PATTERN.test(node.name || '');

  if (node.node_kind === 'response') {
    return {
      ...node,
      authenticity: {
        status: 'reviewed_climate_response',
        label: 'Reviewed climate response',
        exact_label_validated: true,
        source_scope: 'node_specific',
        anchor_id: null,
        note: 'This is an authored response pathway grounded in official sector assessments. Its leverage and trade-offs vary by place, design, timing, and implementation quality.'
      }
    };
  }

  if (NODE_AUTHENTICITY_NAME_OVERRIDES[node.id]) {
    return {
      ...node,
      authenticity: {
        status: 'source_backed_operational_concept',
        label: 'Source-backed operational concept',
        exact_label_validated: false,
        source_scope: sourceUrls.length ? 'anchor_inherited' : 'unverified',
        anchor_id: node.calibration?.anchor_id || null,
        note: 'This label was manually normalized to standard, neutral terminology. The underlying subject is source-backed; the UI does not claim the phrase is a formal standardized indicator.'
      }
    };
  }

  if (role === 'anchor') {
    return {
      ...node,
      authenticity: {
        status: isOperationalIndicator ? 'reviewed_operational_indicator' : 'reviewed_phenomenon',
        label: isOperationalIndicator ? 'Reviewed operational indicator' : 'Reviewed phenomenon',
        exact_label_validated: true,
        source_scope: 'node_specific',
        note: isOperationalIndicator
          ? 'This is a reviewed analytical indicator grounded in node-specific sources; it may not be a standardized scientific term.'
          : 'This phenomenon label has been reviewed against node-specific official or primary sources.'
      }
    };
  }

  if (hasNodeSpecificNotes) {
    return {
      ...node,
      authenticity: {
        status: 'source_backed_operational_concept',
        label: 'Source-backed operational concept',
        exact_label_validated: false,
        source_scope: 'node_specific',
        note: 'The underlying subject is source-backed, while this concise platform label is an analytical formulation rather than a claimed canonical term.'
      }
    };
  }

  return {
    ...node,
    authenticity: {
      status: 'source_backed_concept_label',
      label: 'Source-backed concept label',
      exact_label_validated: false,
      source_scope: sourceUrls.length ? 'anchor_inherited' : 'unverified',
      anchor_id: node.calibration?.anchor_id || null,
      note: 'The underlying topic inherits official evidence from its reviewed anchor. This generated label remains queued for exact-term validation and should not be read as a standardized scientific name.'
    }
  };
}

const promotedNodes = [...PROMOTED_EXPANSION_NODES, ...RIVER_BARRIER_NODES, ...HUMANITARIAN_EXPANSION_NODES, ...GROUNDWATER_WITHDRAWAL_NODES, ...NITROUS_OXIDE_DRIVER_NODES, ...SULFUR_DIOXIDE_DRIVER_NODES, ...COAL_POWER_EXPANSION_NODES, ...ELECTRONICS_EOL_EXPANSION_NODES, ...CARBON_MONOXIDE_DRIVER_NODES, ...LANDFILL_METHANE_DRIVER_NODES, ...RICE_METHANE_DRIVER_NODES, ...LOCOMOTIVE_EMISSIONS_NODES, ...CEMENT_CALCINATION_NODES, ...REFRIGERANT_LEAKAGE_NODES, ...TIRE_WEAR_NODES, ...SEMICONDUCTOR_FGAS_NODES, ...BLAST_FURNACE_SLAG_NODES, ...MANURE_LAGOON_NODES, ...LITHIUM_BRINE_NODES, ...CATTLE_COMPACTION_NODES, ...WATERBORNE_OUTBREAK_NODES, ...POLLINATOR_COLLAPSE_NODES, ...ACID_DEPOSITION_NODES, ...FOREST_DIEBACK_NODES, ...SOIL_MICROBIAL_NODES, ...URBAN_WATER_RATIONING_NODES, ...DEEPWATER_SPILL_NODES, ...WILDFIRE_SMOKE_HEALTH_NODES, ...RESERVOIR_STORAGE_NODES, ...AIR_POLLUTION_HEALTH_NODES, ...RAIN_ON_SNOW_NODES, ...SURFACE_STORAGE_NODES, ...TALIK_EXPANSION_NODES, ...COASTAL_PERMAFROST_NODES, ...FRACKING_WASTEWATER_NODES, ...COASTAL_HYPOXIA_NODES, ...TUNDRA_SHRUBIFICATION_NODES].map(node => {
  const baseline = calculateBaselineScore(node.vector);
  return {
    ...node,
    context: getNodeContext(node.sphere, node.name),
    score: {
      baseline,
      band: getScoreBand(baseline)
    },
    impactScore: Math.round(baseline * 10)
  };
});
promotedNodes.push(...COASTAL_SALTWATER_INTRUSION_NODES.map(node => {
  const baseline = calculateBaselineScore(node.vector);
  return { ...node, context: getNodeContext(node.sphere, node.name), score: { baseline, band: getScoreBand(baseline) }, impactScore: Math.round(baseline * 10) };
}));
promotedNodes.push(...ARCTIC_ICE_RETREAT_NODES.map(node => {
  const baseline = calculateBaselineScore(node.vector);
  return { ...node, context: getNodeContext(node.sphere, node.name), score: { baseline, band: getScoreBand(baseline) }, impactScore: Math.round(baseline * 10) };
}));
promotedNodes.push(...FINAL_DENSITY_BATCH_NODES.map(node => {
  const baseline = calculateBaselineScore(node.vector);
  return { ...node, context: getNodeContext(node.sphere, node.name), score: { baseline, band: getScoreBand(baseline) }, impactScore: Math.round(baseline * 10) };
}));
promotedNodes.push(...EXTENSION_DENSITY_BATCH_NODES.map(node => {
  const baseline = calculateBaselineScore(node.vector);
  return { ...node, context: getNodeContext(node.sphere, node.name), score: { baseline, band: getScoreBand(baseline) }, impactScore: Math.round(baseline * 10) };
}));
promotedNodes.push(...CARBON_EMISSION_EXPANSION_NODES.map(node => {
  const baseline = calculateBaselineScore(node.vector);
  return { ...node, context: getNodeContext(node.sphere, node.name), score: { baseline, band: getScoreBand(baseline) }, impactScore: Math.round(baseline * 10) };
}));
const promotedNodeIds = new Set(promotedNodes.map(node => node.id));
const expandedNodeById = new Map(expanded.nodes.map(node => [node.id, node]));
const expandedWithPromotions = {
  ...expanded,
  edges: [...expanded.edges, ...MISSING_LINK_RESEARCH_PROMOTION_EDGES, ...MISSING_LINK_RESEARCH_PROMOTION_EDGES_BATCH_TWO, ...MISSING_LINK_RESEARCH_PROMOTION_EDGES_BATCH_THREE],
  nodes: [
    ...expanded.nodes.filter(node => !promotedNodeIds.has(node.id)),
    ...promotedNodes.map(node => {
      const semanticAliases = expandedNodeById.get(node.id)?.semanticAliases;
      return semanticAliases?.length ? { ...node, semanticAliases } : node;
    })
  ]
};
const authenticityNamedNodes = expandedWithPromotions.nodes.map(node => ({
  ...node,
  sphere: NODE_SPHERE_OVERRIDES[node.id] || node.sphere,
  name: NODE_AUTHENTICITY_NAME_OVERRIDES[node.id] || node.name
}));
const discoveryReadyNodes = attachAuthoredDiscoveryMetadata(authenticityNamedNodes).map(attachNodeAuthenticity);
// A prior repair pass introduced narrowly measured mechanisms as authored root-driver
// nodes. When such a record has fewer than three total relationships, retaining it as
// a causal node conflicts with the live graph contract and mistakes an edge metric
// for an independently supported system node. Detect the entire class, preserve its
// measurement/evidence as a binding, and rebuild the graph without the pseudo-node.
const provisionalContractedGraph = applyNorthstarGraphContracts(discoveryReadyNodes, expandedWithPromotions.edges);
const provisionalDegree = new Map(provisionalContractedGraph.nodes.map(node => [node.id, 0]));
for (const edge of provisionalContractedGraph.edges) {
  provisionalDegree.set(edge.source, (provisionalDegree.get(edge.source) || 0) + 1);
  provisionalDegree.set(edge.target, (provisionalDegree.get(edge.target) || 0) + 1);
}
const noncausalRootMetricIds = new Set(provisionalContractedGraph.nodes
  .filter(node => (
    node.graph_contract?.node_class === 'authored_root_driver'
    && node.calibration?.role === 'root_driver'
    && node.metric_contract?.metric_id
    && (provisionalDegree.get(node.id) || 0) < 3
  ))
  .map(node => node.id));
const provisionalNodeById = new Map(provisionalContractedGraph.nodes.map(node => [node.id, node]));
const rawNoncausalRootDriverMetricBindings = Object.fromEntries(
  [...noncausalRootMetricIds].map(metricOwnerId => {
    const node = provisionalNodeById.get(metricOwnerId);
    const outgoingEdge = provisionalContractedGraph.edges.find(edge => edge.source === metricOwnerId);
    const reviewedTargetBinding = outgoingEdge?.target ? REVIEWED_ONTOLOGY_METRIC_BINDINGS[outgoingEdge.target] : null;
    return [metricOwnerId, {
      binding_type: 'target_mechanism_metric',
      canonical_node_id: reviewedTargetBinding?.canonical_node_id || outgoingEdge?.target || null,
      intermediate_metric_owner_id: reviewedTargetBinding ? outgoingEdge.target : null,
      replaced_edge_key: outgoingEdge ? `${outgoingEdge.source}->${outgoingEdge.target}` : null,
      metric_id: node?.metric_contract?.metric_id || null,
      metric_name: node?.metric_contract?.metric_name || node?.name || metricOwnerId.replaceAll('_', ' '),
      mechanism: outgoingEdge?.evidence?.mechanism || outgoingEdge?.evidence?.dossier?.mechanism || null,
      relationship_description: outgoingEdge?.description || null,
      relationship_level: outgoingEdge?.evidence?.relationship_level || null,
      relationship_source_urls: outgoingEdge?.evidence?.relationship_source_urls || [],
      source_locators: outgoingEdge?.evidence?.dossier?.source_locators || [],
      disposition: 'removed_as_low_degree_pseudo_node_retained_as_edge_evidence'
    }];
  })
);
// Operational measurements are not independent causal phenomena. A low-degree
// indicator with a complete metric contract is retained on its only adjacent
// system node as a measurable alias instead of being rendered as a one-edge
// pseudo-node. This applies to the full class, including extension metrics, so
// the live graph cannot regain weak leaves when new generated batches arrive.
const noncausalOperationalIndicatorMetricIds = new Set(provisionalContractedGraph.nodes
  .filter(node => (
    node.graph_contract?.node_class === 'operational_indicator'
    && node.metric_contract?.metric_id
    && (provisionalDegree.get(node.id) || 0) < 3
    && !noncausalRootMetricIds.has(node.id)
    && !REVIEWED_ONTOLOGY_METRIC_BINDINGS[node.id]
  ))
  .map(node => node.id));
const rawNoncausalOperationalIndicatorMetricBindings = Object.fromEntries(
  [...noncausalOperationalIndicatorMetricIds].map(metricOwnerId => {
    const node = provisionalNodeById.get(metricOwnerId);
    const incidentEdges = provisionalContractedGraph.edges.filter(edge => edge.source === metricOwnerId || edge.target === metricOwnerId);
    const canonicalCandidateEdges = incidentEdges.filter(edge => {
      const adjacentId = edge.source === metricOwnerId ? edge.target : edge.source;
      return !noncausalRootMetricIds.has(adjacentId);
    });
    const adjacentNodeIds = [...new Set(canonicalCandidateEdges.map(edge => edge.source === metricOwnerId ? edge.target : edge.source))];
    const canonicalNodeId = adjacentNodeIds.length === 1 ? adjacentNodeIds[0] : null;
    const relationshipSourceUrls = [...new Set(incidentEdges.flatMap(edge => edge.evidence?.relationship_source_urls || edge.evidence?.source_urls || []))];
    return [metricOwnerId, {
      binding_type: canonicalNodeId ? 'canonical_node_metric_alias' : 'research_track_metric_without_canonical_node',
      canonical_node_id: canonicalNodeId,
      metric_id: node?.metric_contract?.metric_id || null,
      metric_name: node?.metric_contract?.metric_name || node?.name || metricOwnerId.replaceAll('_', ' '),
      original_name: node?.name || metricOwnerId.replaceAll('_', ' '),
      original_sphere: node?.sphere || null,
      metric_contract: node?.metric_contract || null,
      removed_incident_edges: incidentEdges.map(edge => ({
        edge_key: `${edge.source}->${edge.target}`,
        mechanism: edge.evidence?.mechanism || edge.evidence?.dossier?.mechanism || null,
        relationship_level: edge.evidence?.relationship_level || null,
        relationship_source_urls: edge.evidence?.relationship_source_urls || edge.evidence?.source_urls || []
      })),
      source_urls: relationshipSourceUrls,
      decision: canonicalNodeId
        ? 'This record is a bounded operational measurement of its adjacent system, not an independently supported causal phenomenon.'
        : 'This bounded operational measurement has no single defensible canonical system and remains in the research ledger.',
      reviewed_at: '2026-07-18',
      disposition: canonicalNodeId
        ? 'merged_into_canonical_node_as_operational_metric_alias'
        : 'removed_from_live_graph_as_research_track_metric'
    }];
  })
);
const resolveMetricCanonicalNodeId = (candidateId, visited = new Set()) => {
  if (!candidateId || visited.has(candidateId)) return null;
  visited.add(candidateId);
  const next = REVIEWED_ONTOLOGY_METRIC_BINDINGS[candidateId]?.canonical_node_id
    || rawNoncausalOperationalIndicatorMetricBindings[candidateId]?.canonical_node_id
    || rawNoncausalRootDriverMetricBindings[candidateId]?.canonical_node_id
    || null;
  return next ? resolveMetricCanonicalNodeId(next, visited) : candidateId;
};
export const NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS = Object.freeze(Object.fromEntries(
  Object.entries(rawNoncausalRootDriverMetricBindings).map(([id, binding]) => [id, {
    ...binding,
    intermediate_canonical_node_id: binding.canonical_node_id,
    canonical_node_id: resolveMetricCanonicalNodeId(binding.canonical_node_id)
  }])
));
export const NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS = Object.freeze(Object.fromEntries(
  Object.entries(rawNoncausalOperationalIndicatorMetricBindings).map(([id, binding]) => [id, {
    ...binding,
    intermediate_canonical_node_id: binding.canonical_node_id,
    canonical_node_id: resolveMetricCanonicalNodeId(binding.canonical_node_id)
  }])
));
const reviewedOntologyMetricIds = new Set(Object.keys(REVIEWED_ONTOLOGY_METRIC_BINDINGS));
const rejectedLowDegreeAnchorInferenceEdgeKeys = new Set(provisionalContractedGraph.edges
  .filter(edge => {
    if (edge.evidence?.source_status !== 'curated_anchor_inference') return false;
    return [provisionalNodeById.get(edge.source), provisionalNodeById.get(edge.target)].some(node => (
      node
      && (provisionalDegree.get(node.id) || 0) < 3
      && node.authenticity?.exact_label_validated !== true
      && node.graph_contract?.publication_status === 'research_track'
    ));
  })
  .map(edge => `${edge.source}->${edge.target}`));
export const REJECTED_LOW_DEGREE_ANCHOR_INFERENCE_EDGE_KEYS = Object.freeze([...rejectedLowDegreeAnchorInferenceEdgeKeys].sort());
const unsupportedFamilyRelationshipEdgeKeys = new Set(UNSUPPORTED_FAMILY_RELATIONSHIP_EDGE_KEYS);
export const NONCAUSAL_GENERATED_METRIC_BINDINGS = Object.freeze(Object.fromEntries(
  Object.entries(REVIEWED_ONTOLOGY_METRIC_BINDINGS).map(([metricOwnerId, binding]) => {
    const node = provisionalNodeById.get(metricOwnerId);
    const incidentEdges = provisionalContractedGraph.edges
      .filter(edge => edge.source === metricOwnerId || edge.target === metricOwnerId)
      .map(edge => ({
        edge_key: `${edge.source}->${edge.target}`,
        mechanism: edge.evidence?.mechanism || edge.evidence?.dossier?.mechanism || null,
        relationship_level: edge.evidence?.relationship_level || null,
        relationship_source_urls: edge.evidence?.relationship_source_urls || []
      }));
    return [metricOwnerId, {
      ...binding,
      original_name: node?.name || metricOwnerId.replaceAll('_', ' '),
      original_sphere: node?.sphere || null,
      removed_incident_edges: incidentEdges,
      disposition: 'merged_into_canonical_node_as_reviewed_metric_alias'
    }];
  })
));
const causalDiscoveryNodes = discoveryReadyNodes.filter(node => !noncausalRootMetricIds.has(node.id) && !noncausalOperationalIndicatorMetricIds.has(node.id) && !reviewedOntologyMetricIds.has(node.id));
const causalInputEdges = expandedWithPromotions.edges.filter(edge => (
  !noncausalRootMetricIds.has(edge.source) && !noncausalRootMetricIds.has(edge.target)
  && !noncausalOperationalIndicatorMetricIds.has(edge.source) && !noncausalOperationalIndicatorMetricIds.has(edge.target)
  && !reviewedOntologyMetricIds.has(edge.source) && !reviewedOntologyMetricIds.has(edge.target)
  && !rejectedLowDegreeAnchorInferenceEdgeKeys.has(`${edge.source}->${edge.target}`)
  && !unsupportedFamilyRelationshipEdgeKeys.has(`${edge.source}->${edge.target}`)
));
const contractedGraph = applyNorthstarGraphContracts(causalDiscoveryNodes, causalInputEdges);
const syntheticNodeDescriptionPattern = /Earth system parameter calibrated|Northstar anchor covering|modelled in the .* sphere to widen causal coverage|anchor and .* domain profile/i;
const genericCalibrationNotePattern = /^Reviewed generated-node rehabilitation|^Node-specific sector and fuel slices|inherits the .* evidence stack/i;
function buildEvidenceBoundNodeDescription(node) {
  if (!syntheticNodeDescriptionPattern.test(node.description || '')) return node.description;

  const calibrationNote = String(node.calibration?.notes || '').trim();
  if (calibrationNote && !genericCalibrationNotePattern.test(calibrationNote)) {
    return calibrationNote;
  }

  const metric = node.metric_contract;
  if (metric?.metric_name && metric?.unit && metric?.geography) {
    const uncertainty = String(metric.uncertainty || '').trim();
    return `${node.name} is represented here through ${lowerFirstToken(metric.metric_name)}, measured in ${metric.unit} for ${metric.geography}.${uncertainty ? ` ${uncertainty}` : ''}`;
  }

  return `${node.name} has relationship evidence and a live graph contract, but its reader-facing definition still requires node-specific editorial review.`;
}
const carbonMetricAliasesByNode = new Map();
for (const [metricOwnerId, binding] of Object.entries(CARBON_EFFECT_METRIC_BINDINGS)) {
  if (!carbonMetricAliasesByNode.has(binding.canonical_node_id)) carbonMetricAliasesByNode.set(binding.canonical_node_id, []);
  const metricContract = CARBON_EMISSION_EXPANSION_METRIC_CONTRACTS[metricOwnerId];
  carbonMetricAliasesByNode.get(binding.canonical_node_id).push({
    id: metricOwnerId,
    name: metricContract?.metric_name || metricOwnerId.replaceAll('_', ' '),
    metric_id: metricContract?.metric_id || null,
    edge_key: binding.edge_key,
    role: 'edge_metric'
  });
}
for (const [metricOwnerId, binding] of Object.entries(NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS)) {
  if (!binding.canonical_node_id) continue;
  if (!carbonMetricAliasesByNode.has(binding.canonical_node_id)) carbonMetricAliasesByNode.set(binding.canonical_node_id, []);
  carbonMetricAliasesByNode.get(binding.canonical_node_id).push({
    id: metricOwnerId,
    name: binding.metric_name,
    metric_id: binding.metric_id,
    edge_key: binding.replaced_edge_key,
    role: 'target_mechanism_metric'
  });
}
for (const [metricOwnerId, binding] of Object.entries(NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS)) {
  if (!binding.canonical_node_id) continue;
  if (!carbonMetricAliasesByNode.has(binding.canonical_node_id)) carbonMetricAliasesByNode.set(binding.canonical_node_id, []);
  carbonMetricAliasesByNode.get(binding.canonical_node_id).push({
    id: metricOwnerId,
    name: binding.original_name,
    metric_id: binding.metric_id,
    edge_key: binding.removed_incident_edges?.[0]?.edge_key || null,
    role: 'operational_indicator_metric_alias'
  });
}
for (const [metricOwnerId, binding] of Object.entries(NONCAUSAL_GENERATED_METRIC_BINDINGS)) {
  if (!binding.canonical_node_id) continue;
  if (!carbonMetricAliasesByNode.has(binding.canonical_node_id)) carbonMetricAliasesByNode.set(binding.canonical_node_id, []);
  carbonMetricAliasesByNode.get(binding.canonical_node_id).push({
    id: metricOwnerId,
    name: binding.original_name,
    metric_id: binding.metric_id,
    edge_key: null,
    role: 'canonical_node_metric_alias'
  });
}
const contractedNodesWithMetricAliases = attachRegionalHubProfiles(applyAnalyticalLabelReview(contractedGraph.nodes.map(node => {
  const metricAliases = carbonMetricAliasesByNode.get(node.id);
  const evidenceBoundNode = {
    ...node,
    description: buildEvidenceBoundNodeDescription(node)
  };
  const nodeWithMetricAliases = metricAliases?.length ? { ...evidenceBoundNode, metricAliases } : evidenceBoundNode;
  return applyFinalNodeSourcePackOverride(nodeWithMetricAliases);
})));
const discoveryTrails = buildAuthoredDiscoveryTrails(contractedNodesWithMetricAliases);

const evidenceGovernedEdges = applyRelationshipEvidenceGovernance(contractedGraph.edges, contractedNodesWithMetricAliases);
const semanticEdges = attachRelationshipSemantics(evidenceGovernedEdges);
const describedEdges = attachRelationshipDescriptions(contractedNodesWithMetricAliases, semanticEdges);
export const NODES = attachCompleteNodeInspectorProfiles(contractedNodesWithMetricAliases, describedEdges);
export const EDGES = describedEdges;
export const RELATIONSHIP_LINEAGE = Object.freeze({
  authored_input_edges: CURATED_BASE_EDGES.map(edge => ({
    key: `${edge.source}->${edge.target}`,
    source: edge.source,
    target: edge.target,
    verb: edge.verb,
    adverb: edge.adverb || '',
    influence: edge.influence,
    relationship_type: edge.relationship_type || edge.evidence?.relationship_type || null,
    topology_rule: edge.topology_rule || 'curated_base'
  })),
  suppressed_edge_keys: [...SUPPRESSED_EDGE_KEYS],
  semantic_redirects: { ...SEMANTIC_COLLAPSE_REDIRECTS },
  final_edge_keys: describedEdges.map(edge => `${edge.source}->${edge.target}`)
});
function buildMinimumDegreeCore(nodes, edges, minimumDegree = 3) {
  const retainedIds = new Set(nodes.map(node => node.id));
  while (true) {
    const degreeById = new Map([...retainedIds].map(id => [id, 0]));
    for (const edge of edges) {
      if (!retainedIds.has(edge.source) || !retainedIds.has(edge.target)) continue;
      degreeById.set(edge.source, (degreeById.get(edge.source) || 0) + 1);
      degreeById.set(edge.target, (degreeById.get(edge.target) || 0) + 1);
    }
    const belowFloor = [...retainedIds].filter(id => (degreeById.get(id) || 0) < minimumDegree);
    if (belowFloor.length === 0) break;
    belowFloor.forEach(id => retainedIds.delete(id));
  }
  return {
    nodes: nodes.filter(node => retainedIds.has(node.id)),
    edges: edges.filter(edge => retainedIds.has(edge.source) && retainedIds.has(edge.target))
  };
}
const publishedGraph = buildMinimumDegreeCore(NODES, EDGES, 3);
export const PUBLISHED_NODES = publishedGraph.nodes;
export const PUBLISHED_EDGES = publishedGraph.edges;
export const EXPLORATION_NODES = NODES.filter(node => node.graph_contract?.visibility === 'default_exploration');
const EXPLORATION_NODE_IDS = new Set(EXPLORATION_NODES.map(node => node.id));
export const EXPLORATION_EDGES = EDGES.filter(edge => EXPLORATION_NODE_IDS.has(edge.source) && EXPLORATION_NODE_IDS.has(edge.target));
export const DISCOVERY_TRAILS = discoveryTrails;
export const DISCOVERY_GATEWAY_NODE_IDS = NODES
  .filter(node => node.discoveryGuide?.authored)
  .map(node => node.id);
export const DISCOVERY_DEFAULT_LANDING_IDS = NODES
  .filter(node => node.discoveryGuide?.defaultLanding)
  .sort((a, b) => (a.discoveryGuide?.landingPriority ?? 999) - (b.discoveryGuide?.landingPriority ?? 999))
  .map(node => node.id);
export const GRAPH_PROFILE = {
  id: activeGraphProfile.id,
  ...activeGraphProfile.metadata,
  targetNodeCount: activeGraphProfile.targetNodeCount,
  actualNodeCount: expandedWithPromotions.nodes.length,
  canonicalProceduralNodeCount: expandedWithPromotions.nodes.length - activeGraphProfile.metadata.totalAnchorCount
};

export function getAdjective(node, val) {
  const rounded = Math.round(val);
  const found = node.adjectives.find(adj => rounded >= adj.min && rounded <= adj.max);
  return found ? found.label : 'Active';
}
