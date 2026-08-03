import fs from 'node:fs/promises';
import path from 'node:path';

import { NODES, EDGES, GRAPH_PROFILE } from '../src/data.js';

const outputPath = path.resolve('public/graph-reference-registry.json');

function getEdgeDefensibility(edge) {
  const evidence = edge.evidence || {};
  const status = evidence.source_status || '';
  const topology = edge.topology_rule || 'curated_base';

  if (status === 'curated_edge_reference') {
    return {
      score: 5,
      label: 'curated_direct',
      bucket: 'direct_edge_citation',
      review_priority: 'low'
    };
  }

  if (status === 'curated_local_reference') {
    return {
      score: 4,
      label: 'curated_local',
      bucket: 'relationship_backed_local_chain',
      review_priority: 'medium'
    };
  }

  if (['anchor_context_reference', 'curated_anchor_inference'].includes(status)) {
    return {
      score: 3,
      label: 'family_supported',
      bucket: 'undemonstrated_anchor_hypothesis',
      review_priority: 'high'
    };
  }

  if (topology === 'curated_base') {
    return {
      score: 4,
      label: 'curated_local',
      bucket: 'anchor_backed_local_chain',
      review_priority: 'medium'
    };
  }

  if (['expansion_inbound', 'expansion_outbound', 'expansion_inbound_semantic', 'family_reference', 'family_peer_reference'].includes(topology)) {
    return {
      score: 3,
      label: 'family_supported',
      bucket: 'family_supported_topology',
      review_priority: 'medium'
    };
  }

  if (['generated_bridge', 'hub_rebalanced'].includes(topology)) {
    return {
      score: 2,
      label: 'modeled_local',
      bucket: 'modeled_local_reroute',
      review_priority: 'high'
    };
  }

  return {
    score: 1,
    label: 'weak_modeled',
    bucket: 'broad_modeled_inference',
    review_priority: 'high'
  };
}

const registry = {
  generated_at: new Date().toISOString(),
  graph_profile: GRAPH_PROFILE,
  summary: {
    node_count: NODES.length,
    edge_count: EDGES.length
  },
  nodes: NODES.map(node => ({
    id: node.id,
    name: node.name,
    sphere: node.sphere,
    role: node.calibration?.role || 'unknown',
    source_status: node.calibration?.source_status || 'undocumented',
    source_urls: node.calibration?.source_urls || [],
    api_keys: node.calibration?.api_keys || [],
    notes: node.calibration?.notes || null,
    metric: node.calibration?.metric || null,
    anchor_id: node.calibration?.anchor_id || null,
    expansion_family: node.expansion?.family || null,
    registry_action: node.registryMeta?.registry_action || null,
    source_pack_rank: node.registryMeta?.source_pack_rank || null,
    boundary_note: node.registryMeta?.boundary_note || null,
    semantic_aliases: node.semanticAliases || [],
    authenticity: node.authenticity || null
  })),
  edges: EDGES.map(edge => ({
    key: `${edge.source}->${edge.target}`,
    source: edge.source,
    target: edge.target,
    verb: edge.verb,
    adverb: edge.adverb,
    influence: edge.influence,
    semantic_role: edge.semantic_role,
    display_weight: edge.display_weight,
    topology_rule: edge.topology_rule || null,
    expansion_family: edge.expansion_family || null,
    evidence: edge.evidence || null,
    defensibility: getEdgeDefensibility(edge)
  }))
};

await fs.writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: outputPath, node_count: registry.nodes.length, edge_count: registry.edges.length }, null, 2));
