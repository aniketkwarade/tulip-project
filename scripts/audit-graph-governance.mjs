import fs from 'node:fs/promises';
import { EDGES, EXPLORATION_EDGES, EXPLORATION_NODES, NODES } from '../src/data.js';
import { LOW_DEGREE_POLICY } from '../src/low-degree-governance.js';

const failures = [];
const degree = new Map(NODES.map(node => [node.id, 0]));
for (const edge of EDGES) { degree.set(edge.source, (degree.get(edge.source) || 0) + 1); degree.set(edge.target, (degree.get(edge.target) || 0) + 1); }
for (const node of NODES) {
  const contract = node.graph_contract || {};
  const low = (degree.get(node.id) || 0) < LOW_DEGREE_POLICY.default_exploration_degree_floor;
  if (!contract.publication_status || !contract.visibility || !contract.triage_action || !contract.label_status) failures.push({ code: 'node_governance_missing', detail: node.id });
  const isExplicitOperationalIndicator = node.graph_contract?.node_class === 'operational_indicator';
  if (low && node.calibration?.role === 'generated' && !isExplicitOperationalIndicator && contract.publication_status !== 'research_track') failures.push({ code: 'low_degree_generated_not_research_track', detail: node.id });
  if (low && node.calibration?.role === 'generated' && !isExplicitOperationalIndicator && contract.visibility !== 'hidden_from_default_exploration') failures.push({ code: 'low_degree_generated_visible_by_default', detail: node.id });
  if (low && node.graph_contract?.node_class === 'phenomenon' && contract.visibility === 'default_exploration') failures.push({ code: 'low_degree_phenomenon_visible_by_default', detail: node.id });
  if (low && node.graph_contract?.node_class === 'operational_indicator' && contract.publication_status !== 'live_exempt_operational_indicator') failures.push({ code: 'operational_indicator_exemption_missing', detail: node.id });
  if (node.authenticity?.status === 'source_backed_concept_label' && contract.label_status !== 'retain_as_analytical_concept') failures.push({ code: 'unverified_label_without_disclosure_status', detail: node.id });
}
const explorationIds = new Set(EXPLORATION_NODES.map(node => node.id));
for (const node of NODES.filter(node => node.graph_contract?.visibility === 'hidden_from_default_exploration')) if (explorationIds.has(node.id)) failures.push({ code: 'research_track_leaked_to_default_exploration', detail: node.id });
for (const edge of EXPLORATION_EDGES) if (!explorationIds.has(edge.source) || !explorationIds.has(edge.target)) failures.push({ code: 'exploration_edge_orphan', detail: `${edge.source}->${edge.target}` });
try {
  const registry = JSON.parse(await fs.readFile('public/graph-governance-registry.json', 'utf8'));
  if (registry.summary?.all_nodes !== NODES.length || registry.summary?.all_edges !== EDGES.length || registry.summary?.default_exploration_nodes !== EXPLORATION_NODES.length || registry.summary?.default_exploration_edges !== EXPLORATION_EDGES.length) failures.push({ code: 'stale_graph_governance_registry', detail: registry.summary });
} catch (error) { failures.push({ code: 'graph_governance_registry_invalid', detail: error.message }); }
const result = { ok: failures.length === 0, summary: { nodes: NODES.length, default_exploration_nodes: EXPLORATION_NODES.length, research_track_nodes: NODES.filter(node => node.graph_contract?.publication_status === 'research_track').length, low_degree_nodes: NODES.filter(node => (degree.get(node.id) || 0) < LOW_DEGREE_POLICY.default_exploration_degree_floor).length }, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
