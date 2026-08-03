import fs from 'node:fs/promises';
import path from 'node:path';
import { EDGES, NODES } from '../src/data.js';

const nodeById = new Map(NODES.map(node => [node.id, node]));
const relationships = EDGES.map((edge, index) => ({
  relationship_id: `RD-${String(index + 1).padStart(4, '0')}`,
  source_id: edge.source,
  source_name: nodeById.get(edge.source)?.name || edge.source,
  target_id: edge.target,
  target_name: nodeById.get(edge.target)?.name || edge.target,
  semantic_role: edge.semantic_role,
  relationship_level: edge.relationship_level || edge.evidence?.relationship_level || 'missing',
  description: edge.relationship_description,
  relationship_source_urls: edge.evidence?.relationship_source_urls || edge.evidence?.source_urls || []
}));

const registry = {
  version: 'relationship_descriptions_v1',
  generated_at: new Date().toISOString(),
  recall_key: 'RELATIONSHIP DESCRIPTIONS',
  constraints: [
    'Every relationship has a unique description.',
    'Descriptions contain one or two sentences.',
    'Descriptions preserve endpoint names when they are needed for precise, natural-language mechanisms.'
  ],
  relationship_count: relationships.length,
  relationships
};

const output = path.resolve('public/relationship-descriptions.json');
await fs.writeFile(output, `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output, relationship_count: relationships.length }, null, 2));
