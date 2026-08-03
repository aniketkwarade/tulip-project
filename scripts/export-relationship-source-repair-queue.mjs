import fs from 'node:fs/promises';
import path from 'node:path';
import { EDGES, NODES } from '../src/data.js';

const nodeById = new Map(NODES.map(node => [node.id, node]));
const unsourced = EDGES
  .filter(edge => !(edge.evidence?.relationship_source_urls || []).length)
  .map(edge => ({
    edge_key: `${edge.source}->${edge.target}`,
    source: { id: edge.source, name: nodeById.get(edge.source)?.name || edge.source },
    target: { id: edge.target, name: nodeById.get(edge.target)?.name || edge.target },
    topology_rule: edge.topology_rule || 'legacy',
    priority: ['anchor_inference', 'family_reference', 'curated_base'].includes(edge.topology_rule) ? 'high' : 'normal',
    required_exit: ['relationship-specific source URL', 'bounded mechanism', 'geographic and temporal scope', 'confidence and counterevidence']
  }))
  .sort((a, b) => a.priority.localeCompare(b.priority) || a.edge_key.localeCompare(b.edge_key));

const payload = {
  version: 'relationship_source_repair_queue_v1',
  generated_at: new Date().toISOString(),
  summary: { unsourced_relationships: unsourced.length, high_priority: unsourced.filter(item => item.priority === 'high').length },
  entries: unsourced
};
const output = path.resolve('public/relationship-source-repair-queue.json');
await fs.writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/relationship-source-repair-queue.json', ...payload.summary }, null, 2));
