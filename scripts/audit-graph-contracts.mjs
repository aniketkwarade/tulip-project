import fs from 'node:fs/promises';
import path from 'node:path';

import {
  ANCHOR_REPAIR_RELATIONSHIPS,
  FIRST_50_ANCHOR_REPAIR_IDS,
  GENERATED_REHABILITATION_RELATIONSHIPS,
  NODE_CLASSES,
  NODE_METRIC_CONTRACTS,
  REHABILITATED_GENERATED_NODE_IDS,
  REJECTED_LEGACY_EDGE_KEYS
} from '../src/northstar-contracts.js';
import {
  CASCADE_ANCHOR_IDS,
  CASCADE_ANCHOR_RELATIONSHIPS,
  CASCADE_UNSUPPORTED_EDGE_KEYS,
  hasCompletePromotedDossier
} from '../src/cascade-anchor-contracts.js';
import { EDGES, NODES, PUBLISHED_EDGES, PUBLISHED_NODES, NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS, NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS, NONCAUSAL_GENERATED_METRIC_BINDINGS, REJECTED_LOW_DEGREE_ANCHOR_INFERENCE_EDGE_KEYS } from '../src/data.js';
import { CARBON_EFFECT_METRIC_BINDINGS, CARBON_EMISSION_EXPANSION_METRIC_CONTRACTS } from '../src/carbon-emission-expansion-contracts.js';
import { SUBSEA_CABLE_NODE_ID, SUBSEA_CABLE_RELATIONSHIPS, hasCompleteSubseaCableDossier } from '../src/subsea-cable-rehabilitation-contracts.js';
import { PALM_OIL_CLEARANCE_NODE_ID, PALM_OIL_CLEARANCE_RELATIONSHIPS, hasCompletePalmOilClearanceDossier } from '../src/palm-oil-clearance-rehabilitation-contracts.js';
import { ONTOLOGY_PROMOTION_METRIC_CONTRACTS, ONTOLOGY_PROMOTION_NODE_IDS, ONTOLOGY_PROMOTION_RELATIONSHIPS, hasCompleteOntologyPromotionDossier } from '../src/ontology-promotion-batch-contracts.js';
import { ONTOLOGY_PROMOTION_BATCH_TWO_METRIC_CONTRACTS, ONTOLOGY_PROMOTION_BATCH_TWO_NODE_IDS, ONTOLOGY_PROMOTION_BATCH_TWO_RELATIONSHIPS, ONTOLOGY_PROMOTION_BATCH_TWO_REJECTED_EDGE_KEYS, hasCompleteOntologyPromotionBatchTwoDossier } from '../src/ontology-promotion-batch-two-contracts.js';
import { DEGREE_TWO_OPERATIONAL_INDICATOR_IDS, DEGREE_TWO_PROMOTION_METRIC_CONTRACTS, DEGREE_TWO_PROMOTION_NODE_IDS, DEGREE_TWO_PROMOTION_RELATIONSHIPS, DEGREE_TWO_PROMOTION_REJECTED_EDGE_KEYS, hasCompleteDegreeTwoPromotionDossier } from '../src/degree-two-promotion-contracts.js';
import { INVASIVE_SPECIES_NODE_ID, INVASIVE_SPECIES_RELATIONSHIPS, hasCompleteInvasiveSpeciesDossier } from '../src/invasive-species-repair-contracts.js';
import { OPEN_BACKLOG_WAVE_ONE_NODE_IDS, OPEN_BACKLOG_WAVE_ONE_OPERATIONAL_INDICATOR_IDS, OPEN_BACKLOG_WAVE_ONE_ROOT_DRIVER_IDS, OPEN_BACKLOG_WAVE_ONE_RELATIONSHIPS, hasCompleteOpenBacklogWaveOneDossier } from '../src/open-backlog-wave-one-contracts.js';
import { GREENHOUSE_FORCING_NODE_ID, GREENHOUSE_FORCING_RELATIONSHIPS, hasCompleteGreenhouseForcingDossier } from '../src/greenhouse-forcing-repair-contracts.js';
import { BARK_BEETLE_NODE_ID, BARK_BEETLE_RELATIONSHIPS, hasCompleteBarkBeetleDossier } from '../src/bark-beetle-repair-contracts.js';
import { ZOONOTIC_OUTBREAK_NODE_ID, ZOONOTIC_OUTBREAK_RELATIONSHIPS, hasCompleteZoonoticOutbreakDossier } from '../src/zoonotic-outbreak-repair-contracts.js';
import {
  PROMOTED_EXPANSION_NODE_IDS,
  PROMOTED_EXPANSION_RELATIONSHIPS,
  hasCompleteExpansionDossier
} from '../src/promoted-expansion-contracts.js';
import {
  PRIORITY_ANCHOR_IDS,
  PRIORITY_ANCHOR_RELATIONSHIPS,
  hasCompletePriorityAnchorDossier
} from '../src/priority-anchor-contracts.js';
import {
  RESEARCH_BATCH_NODE_IDS,
  RESEARCH_BATCH_RELATIONSHIPS,
  hasCompleteResearchBatchDossier
} from '../src/research-track-batch-contracts.js';
import {
  RESEARCH_BATCH_TWO_NODE_IDS,
  RESEARCH_BATCH_TWO_RELATIONSHIPS,
  hasCompleteResearchBatchTwoDossier
} from '../src/research-track-batch-two-contracts.js';
import {
  JET_REHABILITATION_NODE_ID,
  JET_REHABILITATION_RELATIONSHIPS,
  hasCompleteJetDossier
} from '../src/research-track-jet-contracts.js';
import {
  RIVER_BARRIER_NODE_IDS,
  RIVER_BARRIER_RELATIONSHIPS,
  hasCompleteRiverBarrierDossier
} from '../src/river-barrier-expansion-contracts.js';
import { INGESTION_JOB_CONTRACTS } from '../src/ingestion-job-contracts.js';
import { OPERATIONAL_INDICATOR_REHABILITATION_IDS, OPERATIONAL_INDICATOR_REHABILITATION_RELATIONSHIPS, hasCompleteOperationalIndicatorDossier } from '../src/operational-indicator-rehabilitation-contracts.js';
import { NITROUS_OXIDE_DRIVER_NODE_IDS, NITROUS_OXIDE_REHABILITATION_NODE_ID, NITROUS_OXIDE_REHABILITATION_RELATIONSHIPS, hasCompleteNitrousOxideDossier } from '../src/nitrous-oxide-rehabilitation-contracts.js';
import { SULFUR_DIOXIDE_DRIVER_NODE_IDS, SULFUR_DIOXIDE_REHABILITATION_NODE_ID, SULFUR_DIOXIDE_REHABILITATION_RELATIONSHIPS, hasCompleteSulfurDioxideDossier } from '../src/sulfur-dioxide-rehabilitation-contracts.js';
import { RICE_METHANE_INDICATOR_ID, RICE_METHANE_RELATIONSHIPS, RICE_METHANE_REJECTED_EDGE_KEYS, hasCompleteRiceMethaneDossier } from '../src/rice-methane-rehabilitation-contracts.js';
import { COAL_POWER_EXPANSION_NODE_IDS, COAL_POWER_INDICATOR_ID, COAL_POWER_RELATIONSHIPS, hasCompleteCoalPowerDossier } from '../src/coal-power-expansion-contracts.js';
import { CARBON_MONOXIDE_INDICATOR_ID, CARBON_MONOXIDE_RELATIONSHIPS, hasCompleteCarbonMonoxideDossier } from '../src/carbon-monoxide-rehabilitation-contracts.js';
import { UNSUPPORTED_FAMILY_RELATIONSHIP_EDGE_KEYS } from '../src/relationship-rejection-decisions.js';

const failures = [];
const nodeById = new Map(NODES.map(node => [node.id, node]));
const edgeKeys = EDGES.map(edge => `${edge.source}->${edge.target}`);
const edgeKeySet = new Set(edgeKeys);
const reviewedMetricAliasEdges = new Map(Object.values(NONCAUSAL_GENERATED_METRIC_BINDINGS)
  .flatMap(binding => binding.removed_incident_edges || [])
  .filter(edge => edge?.edge_key)
  .map(edge => [edge.edge_key, edge]));
for (const key of REJECTED_LOW_DEGREE_ANCHOR_INFERENCE_EDGE_KEYS) if (edgeKeySet.has(key)) fail('rejected_low_degree_anchor_inference_still_live', key);
for (const key of UNSUPPORTED_FAMILY_RELATIONSHIP_EDGE_KEYS) if (edgeKeySet.has(key)) fail('unsupported_family_relationship_still_live', key);
const rootMetricBindingIds = new Set(Object.keys(NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS));
const operationalIndicatorMetricBindingIds = new Set(Object.keys(NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS));
const allowedClasses = new Set(Object.values(NODE_CLASSES));
const publishedDegree = new Map(PUBLISHED_NODES.map(node => [node.id, 0]));
for (const edge of PUBLISHED_EDGES) {
  publishedDegree.set(edge.source, (publishedDegree.get(edge.source) || 0) + 1);
  publishedDegree.set(edge.target, (publishedDegree.get(edge.target) || 0) + 1);
}
for (const node of PUBLISHED_NODES) {
  if ((publishedDegree.get(node.id) || 0) < 3) fail('published_node_below_degree_floor', { node_id: node.id, degree: publishedDegree.get(node.id) || 0 });
}
for (const [metricOwnerId, binding] of Object.entries(CARBON_EFFECT_METRIC_BINDINGS)) {
  if (nodeById.has(metricOwnerId)) fail('edge_metric_retained_as_causal_node', metricOwnerId);
  const canonicalNode = nodeById.get(binding.canonical_node_id);
  if (!canonicalNode) fail('edge_metric_canonical_node_missing', { metric_owner_id: metricOwnerId, canonical_node_id: binding.canonical_node_id });
  if (!edgeKeySet.has(binding.edge_key)) fail('edge_metric_relationship_missing', { metric_owner_id: metricOwnerId, edge_key: binding.edge_key });
  if (!CARBON_EMISSION_EXPANSION_METRIC_CONTRACTS[metricOwnerId]?.metric_id) fail('edge_metric_contract_missing', metricOwnerId);
  if (!canonicalNode?.metricAliases?.some(alias => alias.id === metricOwnerId && alias.edge_key === binding.edge_key)) fail('edge_metric_alias_binding_missing', metricOwnerId);
}
for (const [metricOwnerId, binding] of Object.entries(NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS)) {
  if (nodeById.has(metricOwnerId)) fail('noncausal_root_metric_retained_as_node', metricOwnerId);
  const canonicalNode = nodeById.get(binding.canonical_node_id);
  if (!canonicalNode) fail('noncausal_root_metric_canonical_node_missing', { metric_owner_id: metricOwnerId, canonical_node_id: binding.canonical_node_id });
  if (!binding.replaced_edge_key || !binding.metric_id || !binding.mechanism || !(binding.relationship_source_urls || []).length) fail('noncausal_root_metric_binding_incomplete', { metric_owner_id: metricOwnerId, binding });
  if (!canonicalNode?.metricAliases?.some(alias => alias.id === metricOwnerId && alias.role === 'target_mechanism_metric')) fail('noncausal_root_metric_alias_missing', metricOwnerId);
}
for (const [metricOwnerId, binding] of Object.entries(NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS)) {
  if (nodeById.has(metricOwnerId)) fail('noncausal_operational_indicator_still_live', metricOwnerId);
  if (!binding.metric_id || !binding.metric_name || !binding.metric_contract) fail('noncausal_operational_indicator_metric_incomplete', metricOwnerId);
  if (binding.canonical_node_id && !nodeById.has(binding.canonical_node_id)) fail('noncausal_operational_indicator_canonical_missing', { metricOwnerId, canonical_node_id: binding.canonical_node_id });
  if (!binding.removed_incident_edges?.length) fail('noncausal_operational_indicator_incident_edge_missing', metricOwnerId);
}
for (const [metricOwnerId, binding] of Object.entries(NONCAUSAL_GENERATED_METRIC_BINDINGS)) {
  if (nodeById.has(metricOwnerId)) fail('noncausal_generated_metric_retained_as_node', metricOwnerId);
  const researchOnly = binding.binding_type === 'research_track_metric_without_canonical_node';
  const canonicalNode = nodeById.get(binding.canonical_node_id);
  if (researchOnly && binding.canonical_node_id !== null) fail('research_track_metric_has_canonical_node', { metric_owner_id: metricOwnerId, canonical_node_id: binding.canonical_node_id });
  if (!researchOnly && !canonicalNode) fail('noncausal_generated_metric_canonical_node_missing', { metric_owner_id: metricOwnerId, canonical_node_id: binding.canonical_node_id });
  if (!binding.metric_id || !binding.decision || (binding.source_urls || []).length < 2) fail('noncausal_generated_metric_binding_incomplete', { metric_owner_id: metricOwnerId, binding });
  if (!researchOnly && !canonicalNode?.metricAliases?.some(alias => alias.id === metricOwnerId && alias.role === 'canonical_node_metric_alias')) fail('noncausal_generated_metric_alias_missing', metricOwnerId);
}
const remainingLowDegreeRootDrivers = NODES.filter(node => node.graph_contract?.node_class === NODE_CLASSES.AUTHORED_ROOT_DRIVER && (EDGES.filter(edge => edge.source === node.id || edge.target === node.id).length < 3));
if (remainingLowDegreeRootDrivers.length) fail('low_degree_root_driver_nodes_remaining', remainingLowDegreeRootDrivers.map(node => node.id));
const invasiveSpeciesNode = nodeById.get(INVASIVE_SPECIES_NODE_ID);
if (!invasiveSpeciesNode || (publishedDegree.get(INVASIVE_SPECIES_NODE_ID) || 0) < 3) fail('invasive_species_not_published_above_degree_floor', invasiveSpeciesNode?.graph_contract);
if ((invasiveSpeciesNode?.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3) fail('invasive_species_under_three_qualified_drivers', invasiveSpeciesNode?.graph_contract?.driver_gate);
if (!invasiveSpeciesNode?.metric_contract?.metric_id) fail('invasive_species_metric_missing', INVASIVE_SPECIES_NODE_ID);
for (const edge of INVASIVE_SPECIES_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteInvasiveSpeciesDossier(edge) || !live || !hasCompleteInvasiveSpeciesDossier(live)) fail('invasive_species_dossier_missing_or_incomplete', key);
}
for (const nodeId of OPEN_BACKLOG_WAVE_ONE_NODE_IDS) {
  const node = nodeById.get(nodeId);
  if (!node || (publishedDegree.get(nodeId) || 0) < 3) fail('open_backlog_wave_one_node_not_published_above_degree_floor', { node_id: nodeId, contract: node?.graph_contract });
  if (!node?.metric_contract?.metric_id) fail('open_backlog_wave_one_metric_missing', nodeId);
  const isRootDriver = OPEN_BACKLOG_WAVE_ONE_ROOT_DRIVER_IDS.includes(nodeId);
  const isOperationalIndicator = OPEN_BACKLOG_WAVE_ONE_OPERATIONAL_INDICATOR_IDS.includes(nodeId);
  if (isRootDriver && node?.graph_contract?.node_class !== NODE_CLASSES.AUTHORED_ROOT_DRIVER) fail('open_backlog_wave_one_root_driver_class_missing', { node_id: nodeId, class: node?.graph_contract?.node_class });
  if (isOperationalIndicator && (node?.graph_contract?.node_class !== NODE_CLASSES.OPERATIONAL_INDICATOR || (node?.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 1)) fail('open_backlog_wave_one_operational_indicator_gate_failed', { node_id: nodeId, contract: node?.graph_contract });
  if (!isRootDriver && !isOperationalIndicator && (node?.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3) fail('open_backlog_wave_one_phenomenon_under_three_qualified_drivers', { node_id: nodeId, gate: node?.graph_contract?.driver_gate });
}
for (const edge of OPEN_BACKLOG_WAVE_ONE_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  const retainedMetricEvidence = reviewedMetricAliasEdges.get(key);
  const retainedMetricEvidenceComplete = Boolean(
    retainedMetricEvidence?.mechanism
    && retainedMetricEvidence?.relationship_level
    && retainedMetricEvidence?.relationship_source_urls?.length >= 2
  );
  const liveDossierComplete = Boolean(live && hasCompleteOpenBacklogWaveOneDossier(live));
  if (!hasCompleteOpenBacklogWaveOneDossier(edge) || (!liveDossierComplete && !retainedMetricEvidenceComplete)) {
    fail('open_backlog_wave_one_dossier_missing_or_incomplete', key);
  }
}
for (const edge of GREENHOUSE_FORCING_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteGreenhouseForcingDossier(edge) || !live || !hasCompleteGreenhouseForcingDossier(live)) fail('greenhouse_forcing_dossier_missing_or_incomplete', key);
}
if (!nodeById.get(GREENHOUSE_FORCING_NODE_ID)?.metric_contract?.metric_id) fail('greenhouse_forcing_metric_missing', GREENHOUSE_FORCING_NODE_ID);
for (const edge of BARK_BEETLE_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteBarkBeetleDossier(edge) || !live || !hasCompleteBarkBeetleDossier(live)) fail('bark_beetle_dossier_missing_or_incomplete', key);
}
if (!nodeById.get(BARK_BEETLE_NODE_ID)?.metric_contract?.metric_id) fail('bark_beetle_metric_missing', BARK_BEETLE_NODE_ID);
for (const edge of ZOONOTIC_OUTBREAK_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteZoonoticOutbreakDossier(edge) || !live || !hasCompleteZoonoticOutbreakDossier(live)) fail('zoonotic_outbreak_dossier_missing_or_incomplete', key);
}
if (!nodeById.get(ZOONOTIC_OUTBREAK_NODE_ID)?.metric_contract?.metric_id) fail('zoonotic_outbreak_metric_missing', ZOONOTIC_OUTBREAK_NODE_ID);
const carbonMonoxideNode = nodeById.get(CARBON_MONOXIDE_INDICATOR_ID);
if (!carbonMonoxideNode || (publishedDegree.get(CARBON_MONOXIDE_INDICATOR_ID) || 0) < 3) fail('carbon_monoxide_not_published_above_degree_floor', carbonMonoxideNode?.graph_contract);
if ((carbonMonoxideNode?.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 1) fail('carbon_monoxide_missing_qualified_driver', carbonMonoxideNode?.graph_contract?.driver_gate);
if (!carbonMonoxideNode?.metric_contract?.metric_id) fail('carbon_monoxide_metric_missing', CARBON_MONOXIDE_INDICATOR_ID);
for (const edge of CARBON_MONOXIDE_RELATIONSHIPS.filter(item => ['road_freight_diesel_lock_in', 'shipping', 'wildfire_regime_shift', CARBON_MONOXIDE_INDICATOR_ID].includes(item.source))) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteCarbonMonoxideDossier(edge) || !live || !hasCompleteCarbonMonoxideDossier(live)) fail('carbon_monoxide_live_dossier_missing_or_incomplete', key);
}
const subseaCableNode = nodeById.get(SUBSEA_CABLE_NODE_ID);
if (!subseaCableNode || (publishedDegree.get(SUBSEA_CABLE_NODE_ID) || 0) < 3) fail('subsea_cable_not_published_above_degree_floor', subseaCableNode?.graph_contract);
for (const edge of SUBSEA_CABLE_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteSubseaCableDossier(edge) || !live || !hasCompleteSubseaCableDossier(live)) fail('subsea_cable_dossier_missing_or_incomplete', key);
}
const palmOilClearanceNode = nodeById.get(PALM_OIL_CLEARANCE_NODE_ID);
if (!palmOilClearanceNode || (publishedDegree.get(PALM_OIL_CLEARANCE_NODE_ID) || 0) < 3) fail('palm_oil_clearance_not_published_above_degree_floor', palmOilClearanceNode?.graph_contract);
if ((palmOilClearanceNode?.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3) fail('palm_oil_clearance_under_three_qualified_drivers', palmOilClearanceNode?.graph_contract?.driver_gate);
if (!palmOilClearanceNode?.metric_contract?.metric_id) fail('palm_oil_clearance_metric_missing', PALM_OIL_CLEARANCE_NODE_ID);
for (const edge of PALM_OIL_CLEARANCE_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompletePalmOilClearanceDossier(edge) || !live || !hasCompletePalmOilClearanceDossier(live)) fail('palm_oil_clearance_dossier_missing_or_incomplete', key);
}
for (const nodeId of ONTOLOGY_PROMOTION_NODE_IDS) {
  const node = nodeById.get(nodeId);
  if (!node) {
    fail('ontology_promoted_node_missing', nodeId);
    continue;
  }
  if ((publishedDegree.get(nodeId) || 0) < 3) fail('ontology_promoted_node_below_degree_floor', { node_id: nodeId, degree: publishedDegree.get(nodeId) || 0 });
  if ((node.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3) fail('ontology_promoted_node_under_three_qualified_drivers', { node_id: nodeId, gate: node.graph_contract?.driver_gate });
  if (node.authenticity?.exact_label_validated !== true || node.authenticity?.source_scope !== 'node_specific') fail('ontology_promoted_node_not_exact_source_backed', { node_id: nodeId, authenticity: node.authenticity });
  if (!ONTOLOGY_PROMOTION_METRIC_CONTRACTS[nodeId]?.metric_id || !node.metric_contract?.metric_id) fail('ontology_promoted_node_metric_missing', nodeId);
}
for (const edge of ONTOLOGY_PROMOTION_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteOntologyPromotionDossier(edge) || !live || !hasCompleteOntologyPromotionDossier(live)) fail('ontology_promotion_dossier_missing_or_incomplete', key);
}
for (const nodeId of ONTOLOGY_PROMOTION_BATCH_TWO_NODE_IDS) {
  const node = nodeById.get(nodeId);
  if (!node) {
    fail('ontology_batch_two_promoted_node_missing', nodeId);
    continue;
  }
  if ((publishedDegree.get(nodeId) || 0) < 3) fail('ontology_batch_two_node_below_degree_floor', { node_id: nodeId, degree: publishedDegree.get(nodeId) || 0 });
  if ((node.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3) fail('ontology_batch_two_node_under_three_qualified_drivers', { node_id: nodeId, gate: node.graph_contract?.driver_gate });
  if (node.authenticity?.exact_label_validated !== true || node.authenticity?.source_scope !== 'node_specific') fail('ontology_batch_two_node_not_exact_source_backed', { node_id: nodeId, authenticity: node.authenticity });
  if (!ONTOLOGY_PROMOTION_BATCH_TWO_METRIC_CONTRACTS[nodeId]?.metric_id || !node.metric_contract?.metric_id) fail('ontology_batch_two_node_metric_missing', nodeId);
}
for (const edge of ONTOLOGY_PROMOTION_BATCH_TWO_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteOntologyPromotionBatchTwoDossier(edge) || !live || !hasCompleteOntologyPromotionBatchTwoDossier(live)) fail('ontology_batch_two_dossier_missing_or_incomplete', key);
}
for (const key of ONTOLOGY_PROMOTION_BATCH_TWO_REJECTED_EDGE_KEYS) {
  if (edgeKeySet.has(key)) fail('ontology_batch_two_rejected_legacy_edge_live', key);
}
for (const nodeId of DEGREE_TWO_PROMOTION_NODE_IDS) {
  const node = nodeById.get(nodeId);
  if (!node) { fail('degree_two_promoted_node_missing', nodeId); continue; }
  if ((publishedDegree.get(nodeId) || 0) < 3) fail('degree_two_promoted_node_below_degree_floor', { node_id: nodeId, degree: publishedDegree.get(nodeId) || 0 });
  const expectedClass = DEGREE_TWO_OPERATIONAL_INDICATOR_IDS.includes(nodeId) ? NODE_CLASSES.OPERATIONAL_INDICATOR : NODE_CLASSES.PHENOMENON;
  const requiredDrivers = expectedClass === NODE_CLASSES.OPERATIONAL_INDICATOR ? 1 : 3;
  if (node.graph_contract?.node_class !== expectedClass) fail('degree_two_promoted_node_wrong_class', { node_id: nodeId, expected: expectedClass, actual: node.graph_contract?.node_class });
  if ((node.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < requiredDrivers) fail('degree_two_promoted_node_driver_gate_failed', { node_id: nodeId, gate: node.graph_contract?.driver_gate });
  if (node.authenticity?.exact_label_validated !== true || node.authenticity?.source_scope !== 'node_specific') fail('degree_two_promoted_node_not_exact_source_backed', { node_id: nodeId, authenticity: node.authenticity });
  if (!DEGREE_TWO_PROMOTION_METRIC_CONTRACTS[nodeId]?.metric_id || !node.metric_contract?.metric_id) fail('degree_two_promoted_node_metric_missing', nodeId);
}
for (const edge of DEGREE_TWO_PROMOTION_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteDegreeTwoPromotionDossier(edge) || !live || !hasCompleteDegreeTwoPromotionDossier(live)) fail('degree_two_promotion_dossier_missing_or_incomplete', key);
}
for (const key of DEGREE_TWO_PROMOTION_REJECTED_EDGE_KEYS) if (edgeKeySet.has(key)) fail('degree_two_rejected_legacy_edge_live', key);
const metricRequiredFields = [
  'metric_id',
  'metric_name',
  'unit',
  'geography',
  'cadence',
  'observation_time_field',
  'source_id',
  'transformation',
  'uncertainty',
  'threshold_provenance',
  'failure_behavior'
];
const graphRegistryPath = path.resolve('public/graph-contract-registry.json');
const metricRegistryPath = path.resolve('public/node-metric-contracts.json');
const promotionRegistryPath = path.resolve('public/phenomenon-promotion-registry.json');
const anchorDossierRegistryPath = path.resolve('public/anchor-edge-dossiers.json');
const promotedDossierRegistryPath = path.resolve('public/promoted-phenomenon-edge-dossiers.json');
const ingestionJobRegistryPath = path.resolve('public/ingestion-job-registry.json');
const sourceRegistryPath = path.resolve('public/tulip-source-registry.json');
const densityProgressPath = path.resolve('public/density-rebuild-progress.json');
const researchBacklogPath = path.resolve('public/research-backlog.json');

function fail(code, detail) {
  failures.push({ code, detail });
}

function requireLiveOrMetricBoundContract(edge, completenessCheck, failureCode) {
  const key = `${edge.source}->${edge.target}`;
  if (!completenessCheck(edge)) {
    fail(failureCode, key);
    return;
  }
  if (rootMetricBindingIds.has(edge.source)) {
    const binding = NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS[edge.source];
    const expectedCanonicalTarget = NONCAUSAL_GENERATED_METRIC_BINDINGS[edge.target]?.canonical_node_id || edge.target;
    if (binding?.canonical_node_id !== expectedCanonicalTarget || binding?.replaced_edge_key !== key) fail(failureCode, key);
    return;
  }
  if (NONCAUSAL_GENERATED_METRIC_BINDINGS[edge.target]) {
    const binding = NONCAUSAL_GENERATED_METRIC_BINDINGS[edge.target];
    if (!nodeById.has(binding.canonical_node_id) || !binding.metric_id || (binding.source_urls || []).length < 2) fail(failureCode, key);
    return;
  }
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!live || !completenessCheck(live)) fail(failureCode, key);
}

for (const node of NODES) {
  if (!allowedClasses.has(node.graph_contract?.node_class)) {
    fail('invalid_node_class', node.id);
  }
  if (!node.graph_contract?.driver_gate?.status) {
    fail('missing_driver_gate', node.id);
  }
}

for (const edge of EDGES) {
  if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
    fail('orphan_edge', `${edge.source}->${edge.target}`);
  }
  if (!edge.evidence?.relationship_level) {
    fail('missing_relationship_level', `${edge.source}->${edge.target}`);
  }
}

for (const key of REJECTED_LEGACY_EDGE_KEYS) {
  if (edgeKeySet.has(key)) fail('rejected_legacy_edge_returned', key);
}

if (edgeKeys.length !== edgeKeySet.size) {
  fail('duplicate_directional_edges', edgeKeys.length - edgeKeySet.size);
}

for (const id of FIRST_50_ANCHOR_REPAIR_IDS) {
  const node = nodeById.get(id);
  if (!node) fail('missing_anchor_repair_target', id);
  else if (!['pass', 'exempt'].includes(node.graph_contract?.driver_gate?.status)) {
    fail('anchor_repair_gate_failed', {
      id,
      driver_gate: node.graph_contract?.driver_gate
    });
  }
}

for (const id of CASCADE_ANCHOR_IDS) {
  const node = nodeById.get(id);
  if (!node) {
    fail('missing_cascade_anchor', id);
    continue;
  }
  if (node.graph_contract?.driver_gate?.qualification_basis !== 'complete_promoted_edge_dossiers') {
    fail('cascade_anchor_not_dossier_gated', id);
  }
  if ((node.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3) {
    fail('cascade_anchor_under_three_qualified_drivers', {
      id,
      driver_gate: node.graph_contract?.driver_gate
    });
  }
  if (node.graph_contract?.driver_gate?.status !== 'pass') {
    fail('cascade_anchor_driver_gate_failed', id);
  }
}

for (const edge of CASCADE_ANCHOR_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  if (!hasCompletePromotedDossier(edge)) {
    fail('cascade_edge_dossier_incomplete', key);
  }
  const liveEdge = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!liveEdge) {
    fail('cascade_edge_missing_from_live_graph', key);
  } else if (!hasCompletePromotedDossier(liveEdge)) {
    fail('cascade_live_edge_dossier_incomplete', key);
  }
}

for (const id of PROMOTED_EXPANSION_NODE_IDS) {
  const node = nodeById.get(id);
  if (!node) fail('promoted_phenomenon_missing', id);
  else {
    if (node.graph_contract?.node_class !== 'phenomenon') fail('promoted_phenomenon_wrong_class', id);
    if ((node.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3 || node.graph_contract?.driver_gate?.status !== 'pass') fail('promoted_phenomenon_driver_gate_failed', id);
    if ((node.graph_contract?.observed_outgoing_effects || 0) < 1) fail('promoted_phenomenon_without_effect', id);
    if (!node.metric_contract?.metric_id) fail('promoted_phenomenon_metric_missing', id);
  }
}
for (const edge of PROMOTED_EXPANSION_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteExpansionDossier(edge) || !live || !hasCompleteExpansionDossier(live)) fail('promoted_phenomenon_dossier_missing_or_incomplete', key);
}

for (const id of PRIORITY_ANCHOR_IDS) {
  const node = nodeById.get(id);
  if (!node) fail('priority_anchor_missing', id);
  else {
    if (node.graph_contract?.node_class !== 'phenomenon') fail('priority_anchor_wrong_class', id);
    if (node.graph_contract?.driver_gate?.qualification_basis !== 'complete_promoted_edge_dossiers') fail('priority_anchor_not_dossier_gated', id);
    if ((node.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3 || node.graph_contract?.driver_gate?.status !== 'pass') fail('priority_anchor_driver_gate_failed', id);
    if ((node.graph_contract?.observed_outgoing_effects || 0) < 1) fail('priority_anchor_without_effect', id);
    if (!node.metric_contract?.metric_id) fail('priority_anchor_metric_missing', id);
  }
}
for (const edge of PRIORITY_ANCHOR_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompletePriorityAnchorDossier(edge) || !live || !hasCompletePriorityAnchorDossier(live)) fail('priority_anchor_dossier_missing_or_incomplete', key);
}

for (const id of RESEARCH_BATCH_NODE_IDS) {
  const node = nodeById.get(id);
  if (!node) fail('research_batch_node_missing', id);
  else {
    if (node.graph_contract?.node_class !== 'phenomenon') fail('research_batch_node_wrong_class', id);
    if (node.graph_contract?.driver_gate?.qualification_basis !== 'complete_promoted_edge_dossiers') fail('research_batch_node_not_dossier_gated', id);
    if ((node.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3 || node.graph_contract?.driver_gate?.status !== 'pass') fail('research_batch_node_driver_gate_failed', id);
    if ((node.graph_contract?.observed_outgoing_effects || 0) < 1) fail('research_batch_node_without_effect', id);
    if (!node.metric_contract?.metric_id) fail('research_batch_node_metric_missing', id);
  }
}
for (const edge of RESEARCH_BATCH_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteResearchBatchDossier(edge) || !live || !hasCompleteResearchBatchDossier(live)) fail('research_batch_dossier_missing_or_incomplete', key);
}

for (const id of RESEARCH_BATCH_TWO_NODE_IDS) {
  const node = nodeById.get(id);
  if (!node) fail('research_batch_two_node_missing', id);
  else {
    if (node.graph_contract?.node_class !== 'phenomenon') fail('research_batch_two_node_wrong_class', id);
    if (node.graph_contract?.driver_gate?.qualification_basis !== 'complete_promoted_edge_dossiers') fail('research_batch_two_node_not_dossier_gated', id);
    if ((node.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3 || node.graph_contract?.driver_gate?.status !== 'pass') fail('research_batch_two_node_driver_gate_failed', id);
    if ((node.graph_contract?.observed_outgoing_effects || 0) < 1) fail('research_batch_two_node_without_effect', id);
    if (!node.metric_contract?.metric_id) fail('research_batch_two_node_metric_missing', id);
  }
}
for (const edge of RESEARCH_BATCH_TWO_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteResearchBatchTwoDossier(edge) || !live || !hasCompleteResearchBatchTwoDossier(live)) fail('research_batch_two_dossier_missing_or_incomplete', key);
}

const jetNode = nodeById.get(JET_REHABILITATION_NODE_ID);
if (!jetNode) fail('jet_rehabilitation_node_missing', JET_REHABILITATION_NODE_ID);
else {
  if (jetNode.graph_contract?.driver_gate?.status !== 'pass' || (jetNode.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3) fail('jet_rehabilitation_driver_gate_failed', jetNode.graph_contract?.driver_gate);
  if ((jetNode.graph_contract?.observed_outgoing_effects || 0) < 1) fail('jet_rehabilitation_without_effect', JET_REHABILITATION_NODE_ID);
  if (!jetNode.metric_contract?.metric_id) fail('jet_rehabilitation_metric_missing', JET_REHABILITATION_NODE_ID);
}
for (const edge of JET_REHABILITATION_RELATIONSHIPS) {
  const key = `${edge.source}->${edge.target}`;
  const live = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === key);
  if (!hasCompleteJetDossier(edge) || !live || !hasCompleteJetDossier(live)) fail('jet_rehabilitation_dossier_missing_or_incomplete', key);
}

for (const id of RIVER_BARRIER_NODE_IDS) {
  const node = nodeById.get(id);
  if (node) {
    if (node.graph_contract?.node_class !== 'authored_root_driver') fail('river_barrier_root_wrong_class', id);
    else if (!node.metric_contract?.metric_id) fail('river_barrier_root_metric_missing', id);
  } else if (!rootMetricBindingIds.has(id)) fail('river_barrier_metric_binding_missing', id);
}
const riverFragmentation = nodeById.get('riverine_habitat_fragmentation');
if (!riverFragmentation || !riverFragmentation.metric_contract?.metric_id) fail('river_fragmentation_contract_missing', riverFragmentation?.graph_contract);
for (const edge of RIVER_BARRIER_RELATIONSHIPS) {
  requireLiveOrMetricBoundContract(edge, hasCompleteRiverBarrierDossier, 'river_barrier_dossier_missing_or_incomplete');
}

for (const id of OPERATIONAL_INDICATOR_REHABILITATION_IDS) {
  const node = nodeById.get(id);
  const metricBinding = NONCAUSAL_GENERATED_METRIC_BINDINGS[id];
  if (!node && metricBinding) {
    if (!metricBinding.metric_id || !nodeById.has(metricBinding.canonical_node_id)) fail('operational_indicator_rehabilitation_metric_binding_invalid', id);
  } else if (!node || node.graph_contract?.node_class !== NODE_CLASSES.OPERATIONAL_INDICATOR) fail('operational_indicator_rehabilitation_wrong_class', id);
  else if (node.graph_contract?.driver_gate?.status !== 'pass' || (node.graph_contract?.driver_gate?.observed_incoming_drivers || 0) < 1) fail('operational_indicator_rehabilitation_driver_gate_failed', id);
  else if (!node.metric_contract?.metric_id) fail('operational_indicator_rehabilitation_metric_missing', id);
}
for (const edge of OPERATIONAL_INDICATOR_REHABILITATION_RELATIONSHIPS) {
  requireLiveOrMetricBoundContract(edge, hasCompleteOperationalIndicatorDossier, 'operational_indicator_rehabilitation_dossier_missing_or_incomplete');
}

for (const id of NITROUS_OXIDE_DRIVER_NODE_IDS) {
  const node = nodeById.get(id);
  if (!node) fail('nitrous_oxide_driver_missing', id);
}
const nitrousOxide = nodeById.get(NITROUS_OXIDE_REHABILITATION_NODE_ID);
if (!nitrousOxide || nitrousOxide.graph_contract?.node_class !== NODE_CLASSES.PHENOMENON || nitrousOxide.graph_contract?.driver_gate?.status !== 'pass' || (nitrousOxide.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3 || (nitrousOxide.graph_contract?.observed_outgoing_effects || 0) < 1 || !nitrousOxide.metric_contract?.metric_id || (publishedDegree.get(NITROUS_OXIDE_REHABILITATION_NODE_ID) || 0) < 3) fail('nitrous_oxide_rehabilitation_failed', nitrousOxide?.graph_contract);
for (const edge of NITROUS_OXIDE_REHABILITATION_RELATIONSHIPS) {
  requireLiveOrMetricBoundContract(edge, hasCompleteNitrousOxideDossier, 'nitrous_oxide_rehabilitation_dossier_missing_or_incomplete');
}

for (const id of SULFUR_DIOXIDE_DRIVER_NODE_IDS) {
  const node = nodeById.get(id);
  if (!node) fail('sulfur_dioxide_driver_missing', id);
}
const sulfurDioxide = nodeById.get(SULFUR_DIOXIDE_REHABILITATION_NODE_ID);
if (!sulfurDioxide || sulfurDioxide.graph_contract?.node_class !== NODE_CLASSES.PHENOMENON || sulfurDioxide.graph_contract?.driver_gate?.status !== 'pass' || (sulfurDioxide.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 3 || (sulfurDioxide.graph_contract?.observed_outgoing_effects || 0) < 1 || !sulfurDioxide.metric_contract?.metric_id || (publishedDegree.get(SULFUR_DIOXIDE_REHABILITATION_NODE_ID) || 0) < 3) fail('sulfur_dioxide_rehabilitation_failed', sulfurDioxide?.graph_contract);
for (const edge of SULFUR_DIOXIDE_REHABILITATION_RELATIONSHIPS) {
  requireLiveOrMetricBoundContract(edge, hasCompleteSulfurDioxideDossier, 'sulfur_dioxide_rehabilitation_dossier_missing_or_incomplete');
}

const riceMethane = nodeById.get(RICE_METHANE_INDICATOR_ID);
if (!riceMethane || riceMethane.graph_contract?.node_class !== NODE_CLASSES.OPERATIONAL_INDICATOR || riceMethane.graph_contract?.driver_gate?.status !== 'pass' || (riceMethane.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) < 1 || !riceMethane.metric_contract?.metric_id || (publishedDegree.get(RICE_METHANE_INDICATOR_ID) || 0) < 3) fail('rice_methane_rehabilitation_failed', riceMethane?.graph_contract);
for (const edge of RICE_METHANE_RELATIONSHIPS) requireLiveOrMetricBoundContract(edge, hasCompleteRiceMethaneDossier, 'rice_methane_dossier_missing_or_incomplete');
for (const key of RICE_METHANE_REJECTED_EDGE_KEYS) if (edgeKeySet.has(key)) fail('rice_methane_reversed_legacy_edge_live', key);

for (const id of COAL_POWER_EXPANSION_NODE_IDS) {
  const node = nodeById.get(id);
  if (node) {
    if (node.graph_contract?.node_class !== NODE_CLASSES.AUTHORED_ROOT_DRIVER || !node.metric_contract?.metric_id) fail('coal_power_driver_uncontracted', id);
  } else if (!rootMetricBindingIds.has(id)) fail('coal_power_metric_binding_missing', id);
}
const coalPowerOutflow = nodeById.get(COAL_POWER_INDICATOR_ID);
const coalPowerOutflowBinding = NONCAUSAL_GENERATED_METRIC_BINDINGS[COAL_POWER_INDICATOR_ID];
if (!coalPowerOutflow && coalPowerOutflowBinding) {
  if (!coalPowerOutflowBinding.metric_id || !nodeById.has(coalPowerOutflowBinding.canonical_node_id) || (coalPowerOutflowBinding.source_urls || []).length < 2) fail('coal_power_indicator_metric_binding_invalid', coalPowerOutflowBinding);
} else if (!coalPowerOutflow || coalPowerOutflow.graph_contract?.node_class !== NODE_CLASSES.OPERATIONAL_INDICATOR || !coalPowerOutflow.metric_contract?.metric_id) fail('coal_power_indicator_rehabilitation_failed', coalPowerOutflow?.graph_contract);
for (const edge of COAL_POWER_RELATIONSHIPS) {
  requireLiveOrMetricBoundContract(edge, hasCompleteCoalPowerDossier, 'coal_power_indicator_dossier_missing_or_incomplete');
}

for (const edge of EDGES) {
  const key = `${edge.source}->${edge.target}`;
  if (CASCADE_UNSUPPORTED_EDGE_KEYS.has(key)) {
    fail('unsupported_cascade_edge_returned', key);
  }
  const touchesCascadeAnchor = CASCADE_ANCHOR_IDS.includes(edge.source) || CASCADE_ANCHOR_IDS.includes(edge.target);
  if (touchesCascadeAnchor && !(edge.evidence?.relationship_source_urls || []).length) {
    fail('unsourced_cascade_edge_returned', key);
  }
}

for (const id of REHABILITATED_GENERATED_NODE_IDS) {
  const node = nodeById.get(id);
  if (!node) {
    fail('missing_rehabilitated_node', id);
    continue;
  }
  const requiredIncomingDrivers = node.graph_contract?.driver_gate?.required_incoming_drivers ?? 3;
  if ((node.graph_contract?.driver_gate?.observed_incoming_drivers || 0) < requiredIncomingDrivers) {
    fail('rehabilitated_node_under_required_drivers', { id, requiredIncomingDrivers, gate: node.graph_contract?.driver_gate });
  }
  if ((node.graph_contract?.observed_outgoing_effects || 0) < 1) {
    fail('rehabilitated_node_without_effect', id);
  }
  if (node.authenticity?.source_scope !== 'node_specific') {
    fail('rehabilitated_node_not_node_specific', id);
  }
  if ((node.calibration?.source_urls || []).length < 2) {
    fail('rehabilitated_node_without_two_node_specific_sources', id);
  }
}

for (const edge of [...ANCHOR_REPAIR_RELATIONSHIPS, ...GENERATED_REHABILITATION_RELATIONSHIPS]) {
  if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
    fail('contract_endpoint_missing', `${edge.source}->${edge.target}`);
  }
  if (!(edge.evidence?.relationship_source_urls || []).length) {
    fail('contract_relationship_source_missing', `${edge.source}->${edge.target}`);
  }
  if (!edge.evidence?.mechanism || !edge.evidence?.geographic_scope || !edge.evidence?.temporal_scope) {
    fail('contract_scope_incomplete', `${edge.source}->${edge.target}`);
  }
}

for (const [nodeId, contract] of Object.entries(NODE_METRIC_CONTRACTS)) {
  if (!nodeById.has(nodeId) && !CARBON_EFFECT_METRIC_BINDINGS[nodeId] && !NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS[nodeId] && !NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS[nodeId] && !NONCAUSAL_GENERATED_METRIC_BINDINGS[nodeId]) fail('metric_contract_node_missing', nodeId);
  for (const field of metricRequiredFields) {
    if (!contract[field] || !String(contract[field]).trim()) {
      fail('metric_contract_field_missing', { node_id: nodeId, field });
    }
  }
  if (/^(index|score|units?)$/i.test(String(contract.unit || '').trim())) fail('metric_contract_unit_unbounded', { node_id: nodeId, unit: contract.unit });
}

for (const job of INGESTION_JOB_CONTRACTS) {
  for (const field of ['ingestion_job_id', 'source_id', 'snapshot_file', 'api_route', 'cadence', 'provenance', 'uncertainty', 'failure_behavior']) {
    if (!job[field] || !String(job[field]).trim()) fail('ingestion_job_field_missing', { job: job.ingestion_job_id, field });
  }
  if (!job.contract_bindings?.length) fail('ingestion_job_without_contract_binding', job.ingestion_job_id);
  for (const binding of job.contract_bindings || []) {
    const contract = NODE_METRIC_CONTRACTS[binding.node_id];
    if (!contract || contract.metric_id !== binding.metric_contract_id) fail('ingestion_job_binding_unresolved', { job: job.ingestion_job_id, binding });
  }
}

try {
  const sourceRegistry = JSON.parse(await fs.readFile(sourceRegistryPath, 'utf8'));
  const sourceIds = new Set((sourceRegistry.sources || []).map(source => source.id));
  for (const [nodeId, contract] of Object.entries(NODE_METRIC_CONTRACTS)) {
    if (!sourceIds.has(contract.source_id)) {
      fail('metric_contract_source_unregistered', {
        node_id: nodeId,
        source_id: contract.source_id
      });
    }
  }
} catch (error) {
  fail('source_registry_invalid', error.message);
}

try {
  const densityProgress = JSON.parse(await fs.readFile(densityProgressPath, 'utf8'));
  const researchBacklog = JSON.parse(await fs.readFile(researchBacklogPath, 'utf8'));
  const openBacklogNodes = researchBacklog.summary?.open_backlog_nodes;
  if (densityProgress.target_mode !== 'exhaustive_open_backlog' || densityProgress.fixed_target_limit !== null) fail('density_rebuild_not_exhaustive', densityProgress);
  if (!Array.isArray(densityProgress.promoted_additional_evidence_backed_nodes) || densityProgress.count !== densityProgress.promoted_additional_evidence_backed_nodes.length) fail('density_rebuild_progress_count_invalid', densityProgress);
  if (new Set(densityProgress.promoted_additional_evidence_backed_nodes || []).size !== densityProgress.count) fail('density_rebuild_progress_contains_duplicates', densityProgress.promoted_additional_evidence_backed_nodes);
  if (densityProgress.open_backlog_nodes !== openBacklogNodes || densityProgress.campaign_eligible_nodes !== openBacklogNodes || densityProgress.remaining !== openBacklogNodes) fail('density_rebuild_backlog_scope_invalid', { densityProgress, open_backlog_nodes: openBacklogNodes });
  for (const id of densityProgress.promoted_additional_evidence_backed_nodes || []) {
    const node = nodeById.get(id);
    if (!node || node.graph_contract?.visibility !== 'default_exploration') fail('density_rebuild_node_not_live', id);
    if (id.startsWith('evidence_') || id.startsWith('extension_')) fail('density_rebuild_noncausal_metric_counted_as_node', id);
  }
} catch (error) {
  fail('density_rebuild_progress_invalid', error.message);
}

for (const [label, file] of [
  ['graph_contract_registry', graphRegistryPath],
  ['metric_contract_registry', metricRegistryPath],
  ['phenomenon_promotion_registry', promotionRegistryPath],
  ['anchor_edge_dossier_registry', anchorDossierRegistryPath]
  ,['promoted_phenomenon_dossier_registry', promotedDossierRegistryPath]
  ,['ingestion_job_registry', ingestionJobRegistryPath]
]) {
  try {
    await fs.access(file);
  } catch {
    fail('generated_registry_missing', { label, file });
  }
}

try {
  const registry = JSON.parse(await fs.readFile(graphRegistryPath, 'utf8'));
  if (registry.summary?.nodes !== NODES.length || registry.summary?.edges !== EDGES.length) {
    fail('stale_graph_contract_registry', {
      registry_nodes: registry.summary?.nodes,
      registry_edges: registry.summary?.edges,
      live_nodes: NODES.length,
      live_edges: EDGES.length
    });
  }
} catch (error) {
  fail('graph_contract_registry_invalid', error.message);
}

try {
  const registry = JSON.parse(await fs.readFile(metricRegistryPath, 'utf8'));
  const registryIds = Object.keys(registry.contracts || {}).sort();
  const liveIds = Object.keys(NODE_METRIC_CONTRACTS).sort();
  if (JSON.stringify(registryIds) !== JSON.stringify(liveIds)) {
    fail('stale_metric_contract_registry', { registryIds, liveIds });
  }
} catch (error) {
  fail('metric_contract_registry_invalid', error.message);
}

try {
  const registry = JSON.parse(await fs.readFile(promotionRegistryPath, 'utf8'));
  if ((registry.candidates || []).length !== 10) {
    fail('promotion_decision_count_regression', (registry.candidates || []).length);
  }
  const expectedApprovalByStatus = {
    approved_and_promoted: 'approved_and_promoted',
    staged_awaiting_explicit_promotion_approval: 'awaiting_explicit_promotion_approval',
    merged_metric_only: 'not_applicable_metric_merge',
    deferred_research_track: 'not_applicable_deferred',
    rejected_ontology: 'not_applicable_rejected'
  };
  for (const candidate of registry.candidates || []) {
    if (!(candidate.official_sources || []).length) {
      fail('promotion_candidate_without_official_sources', candidate.id);
    }
    const expectedApproval = expectedApprovalByStatus[candidate.status];
    if (!expectedApproval || candidate.approval?.status !== expectedApproval) {
      fail('promotion_candidate_boundary_broken', {
        id: candidate.id,
        status: candidate.status,
        approval: candidate.approval?.status
      });
    }
    if (candidate.status === 'staged_awaiting_explicit_promotion_approval') {
      if (nodeById.has(candidate.canonical_id)) {
        fail('staged_candidate_leaked_into_live_graph', candidate.canonical_id);
      }
      if (!candidate.staged_metric_contract) {
        fail('staged_candidate_metric_missing', candidate.canonical_id);
      }
    }
    if (candidate.status === 'approved_and_promoted') {
      const liveNode = nodeById.get(candidate.canonical_id);
      if (!liveNode || liveNode.graph_contract?.driver_gate?.status !== 'pass') fail('approved_candidate_not_live_or_gated', candidate.canonical_id);
    }
    if (candidate.status === 'merged_metric_only') {
      const liveNode = nodeById.get(candidate.canonical_id);
      if (!liveNode || liveNode.metric_contract?.metric_id !== candidate.staged_metric_contract?.metric_id) {
        fail('metric_merge_not_implemented', candidate.canonical_id);
      }
    }
    if (candidate.status === 'deferred_research_track' || candidate.status === 'rejected_ontology') {
      if (candidate.canonical_id && nodeById.has(candidate.canonical_id)) {
        fail('deferred_or_rejected_candidate_live', candidate.canonical_id);
      }
    }
    for (const nodeId of [
      ...(candidate.proposed_driver_ids || []),
      ...(candidate.proposed_effect_ids || [])
    ]) {
      if (!nodeById.has(nodeId) && !NONCAUSAL_GENERATED_METRIC_BINDINGS[nodeId]) {
        fail('promotion_candidate_endpoint_missing', { candidate: candidate.id, node_id: nodeId });
      }
    }
  }
  for (const forbiddenLabel of [
    'Food Insecurity and Undernutrition',
    'Nutrient Pollution and Biogeochemical Flow Disruption',
    'Toxic Chemical Pressure and Novel Entities'
  ]) {
    if (NODES.some(node => node.name === forbiddenLabel)) {
      fail('composite_candidate_label_live', forbiddenLabel);
    }
  }
} catch (error) {
  fail('phenomenon_promotion_registry_invalid', error.message);
}

try {
  const registry = JSON.parse(await fs.readFile(anchorDossierRegistryPath, 'utf8'));
  const registryEdgeKeys = (registry.anchors || [])
    .flatMap(anchor => anchor.dossiers || [])
    .map(dossier => dossier.edge_key)
    .sort();
  const liveEdgeKeys = EDGES.filter(edge => CASCADE_ANCHOR_IDS.includes(edge.target) && hasCompletePromotedDossier(edge))
    .map(edge => `${edge.source}->${edge.target}`)
    .sort();
  if (JSON.stringify(registryEdgeKeys) !== JSON.stringify(liveEdgeKeys)) {
    fail('stale_anchor_edge_dossier_registry', {
      registry_count: registryEdgeKeys.length,
      live_count: liveEdgeKeys.length
    });
  }
} catch (error) {
  fail('anchor_edge_dossier_registry_invalid', error.message);
}

try {
  const registry = JSON.parse(await fs.readFile(promotedDossierRegistryPath, 'utf8'));
  if (registry.summary?.anchors !== PROMOTED_EXPANSION_NODE_IDS.length || registry.summary?.dossiers !== PROMOTED_EXPANSION_RELATIONSHIPS.length) fail('stale_promoted_phenomenon_dossier_registry', registry.summary);
} catch (error) { fail('promoted_phenomenon_dossier_registry_invalid', error.message); }

try {
  const registry = JSON.parse(await fs.readFile(ingestionJobRegistryPath, 'utf8'));
  if (registry.summary?.jobs !== INGESTION_JOB_CONTRACTS.length) fail('stale_ingestion_job_registry', registry.summary);
} catch (error) { fail('ingestion_job_registry_invalid', error.message); }

const relationshipSourced = EDGES.filter(edge => (
  (edge.evidence?.relationship_source_urls || []).length > 0
)).length;
const relationshipSourceRate = relationshipSourced / Math.max(1, EDGES.length);
if (relationshipSourceRate < 0.74) {
  fail('relationship_source_coverage_regression', {
    observed: Number(relationshipSourceRate.toFixed(4)),
    minimum: 0.74
  });
}

const result = {
  ok: failures.length === 0,
  generated_at: new Date().toISOString(),
  summary: {
    nodes: NODES.length,
    edges: EDGES.length,
    first_anchor_repairs_passing: FIRST_50_ANCHOR_REPAIR_IDS.filter(id => (
      ['pass', 'exempt'].includes(nodeById.get(id)?.graph_contract?.driver_gate?.status)
    )).length,
    cascade_anchors_dossier_gated: CASCADE_ANCHOR_IDS.filter(id => (
      nodeById.get(id)?.graph_contract?.driver_gate?.status === 'pass'
      && (nodeById.get(id)?.graph_contract?.driver_gate?.qualified_incoming_drivers || 0) >= 3
    )).length,
    promoted_cascade_edge_dossiers: EDGES.filter(edge => CASCADE_ANCHOR_IDS.includes(edge.target) && hasCompletePromotedDossier(edge)).length,
    promoted_outcome_system_anchors: PROMOTED_EXPANSION_NODE_IDS.length,
    promoted_outcome_system_edge_dossiers: PROMOTED_EXPANSION_RELATIONSHIPS.length,
    ingestion_jobs: INGESTION_JOB_CONTRACTS.length,
    rehabilitated_generated_nodes: REHABILITATED_GENERATED_NODE_IDS.size,
    metric_contracts: Object.keys(NODE_METRIC_CONTRACTS).length,
    relationship_source_coverage_pct: Number((relationshipSourceRate * 100).toFixed(1))
  },
  failures
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
