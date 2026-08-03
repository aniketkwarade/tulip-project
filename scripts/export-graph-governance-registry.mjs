import fs from 'node:fs/promises';
import path from 'node:path';
import { EDGES, EXPLORATION_EDGES, EXPLORATION_NODES, NODES, PUBLISHED_EDGES, PUBLISHED_NODES } from '../src/data.js';
import { LOW_DEGREE_POLICY, buildSearchAliases } from '../src/low-degree-governance.js';

const degree = new Map(NODES.map(node => [node.id, 0]));
for (const edge of EDGES) {
  degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
  degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
}
const countBy = (items, key) => Object.fromEntries([...items.reduce((counts, item) => {
  const value = key(item) || 'missing'; counts.set(value, (counts.get(value) || 0) + 1); return counts;
}, new Map())].sort(([a], [b]) => a.localeCompare(b)));
const publishedIds = new Set(PUBLISHED_NODES.map(node => node.id));
const nodes = NODES.map(node => ({
  id: node.id, display_name: node.name, search_aliases: buildSearchAliases(node), sphere: node.sphere,
  node_class: node.graph_contract?.node_class || 'missing', calibration_role: node.calibration?.role || 'unknown',
  total_degree: degree.get(node.id) || 0, publication_status: node.graph_contract?.publication_status || 'missing',
  visibility: node.graph_contract?.visibility || 'missing', triage_action: node.graph_contract?.triage_action || 'missing',
  label_status: node.graph_contract?.label_status || 'missing', authenticity_status: node.authenticity?.status || 'missing',
  authenticity_note: node.authenticity?.note || null, source_urls: node.calibration?.source_urls || [], metric_contract_id: node.metric_contract?.metric_id || null,
  in_published_three_core: publishedIds.has(node.id),
  backlog_action: publishedIds.has(node.id)
    ? 'retain_published'
    : node.graph_contract?.node_class === 'phenomenon'
      ? 'research_promote_merge_or_retire'
      : 'research_relationships_or_hold'
}));
const registry = {
  version: LOW_DEGREE_POLICY.version, generated_at: new Date().toISOString(), policy: LOW_DEGREE_POLICY,
  summary: {
    all_nodes: NODES.length, all_edges: EDGES.length, default_exploration_nodes: EXPLORATION_NODES.length,
    default_exploration_edges: EXPLORATION_EDGES.length,
    published_three_core_nodes: PUBLISHED_NODES.length, published_three_core_edges: PUBLISHED_EDGES.length,
    publication_backlog_nodes: NODES.length - PUBLISHED_NODES.length,
    low_degree_nodes: nodes.filter(node => node.total_degree < LOW_DEGREE_POLICY.default_exploration_degree_floor).length,
    publication_statuses: countBy(nodes, node => node.publication_status), label_statuses: countBy(nodes, node => node.label_status)
  }, nodes
};
await fs.writeFile(path.resolve('public/graph-governance-registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/graph-governance-registry.json', summary: registry.summary }, null, 2));
