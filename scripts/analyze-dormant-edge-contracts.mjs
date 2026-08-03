import fs from 'node:fs';
import { NODES, EDGES } from '../src/data.js';

const source = fs.readFileSync(new URL('../src/data.js', import.meta.url), 'utf8');
const profileEdges = [...source.matchAll(/["'`]([a-z0-9_]+)->([a-z0-9_]+)["'`]\s*:/g)]
  .map(match => ({ source: match[1], target: match[2] }));
const nodeIds = new Set(NODES.map(node => node.id));
const currentEdges = new Set(EDGES.map(edge => `${edge.source}->${edge.target}`));
const incoming = new Map(NODES.map(node => [node.id, 0]));

for (const edge of EDGES) {
  incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
}

const dormant = profileEdges.filter(edge => (
  nodeIds.has(edge.source)
  && nodeIds.has(edge.target)
  && !currentEdges.has(`${edge.source}->${edge.target}`)
));

const dormantToUnderconnected = dormant.filter(edge => (incoming.get(edge.target) || 0) < 3);

console.log(JSON.stringify({
  profile_keys: profileEdges.length,
  dormant_valid: dormant.length,
  dormant_to_underconnected: dormantToUnderconnected.length,
  candidates: dormantToUnderconnected
}, null, 2));
