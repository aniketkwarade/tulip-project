import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { EDGES, NODES } from '../src/data.js';
import {
  agreeRelationshipVerbPhrase,
  getRelationshipQuestionAuxiliary,
  getRelationshipSubjectPronoun,
  isCausalRelationship,
  isContextualRelationship
} from '../src/relationship-semantics.js';

const edgeByKey = new Map(EDGES.map(edge => [`${edge.source}->${edge.target}`, edge]));
const getEdge = key => {
  const edge = edgeByKey.get(key);
  assert.ok(edge, `Missing regression edge ${key}`);
  return edge;
};

assert.equal(EDGES.length, 1290);
assert.equal(NODES.filter(node => node.node_kind === 'response').length, 27);

const walking = getEdge('active_mobility->personal_conveyance');
assert.equal(walking.semantic_role, 'reduces');
assert.ok(walking.influence < 0);
assert.match(walking.relationship_description, /^Walking and Cycling Networks reduce dependence on Personal Conveyance/);
assert.doesNotMatch(walking.relationship_description, /^Walking and Cycling Networks reduces/);
assert.equal(getRelationshipQuestionAuxiliary('active_mobility'), 'do');
assert.equal(getRelationshipQuestionAuxiliary('clean_electricity'), 'does');
assert.equal(getRelationshipSubjectPronoun('active_mobility'), 'they');
assert.equal(getRelationshipSubjectPronoun('clean_electricity'), 'it');
assert.equal(agreeRelationshipVerbPhrase('active_mobility', 'cuts fuel use'), 'cut fuel use');
assert.match(
  NODES.find(node => node.id === 'active_mobility')?.planetImpact?.summary || '',
  /^Walking and Cycling Networks benefit the planet because they cut /
);

const enabling = getEdge('renewable_energy_deployment->clean_electricity');
assert.equal(enabling.semantic_role, 'enables');
assert.ok(isCausalRelationship(enabling));

const tradeoff = getEdge('renewable_energy_deployment->critical_mineral_extraction_pressure');
assert.equal(tradeoff.semantic_role, 'increases');
assert.ok(tradeoff.influence > 0);

const constraint = getEdge('transmission_buildout_lag->clean_electricity');
assert.equal(constraint.semantic_role, 'constrains');
assert.ok(constraint.influence < 0);

const context = getEdge('urbanization->urban_sprawl_housing');
assert.equal(context.semantic_role, 'context');
assert.ok(isContextualRelationship(context));
assert.equal(isCausalRelationship(context), false);
assert.equal(context.evidence.quantitative_evidence.effect_direction, 'context_only_no_causal_direction');

for (const edge of EDGES) {
  assert.ok(edge.semantic_role, `Missing semantic role for ${edge.source}->${edge.target}`);
  assert.ok(edge.evidence?.relationship_type, `Missing relationship type for ${edge.source}->${edge.target}`);
}

const [html, main, graph, propagation] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/graph.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/propagation.js', import.meta.url), 'utf8')
]);

assert.match(html, /Choose what influences this/);
assert.match(html, /Choose what this influences/);
assert.doesNotMatch(html, /relationship-context-select|Explore contextual connections/);
assert.doesNotMatch(main, /relationshipContextSelect|Explore contextual connections/);
assert.match(html, /<span class="legend-label">Triggers<\/span>/);
assert.match(html, /<span class="legend-label">Effects<\/span>/);
assert.doesNotMatch(
  html,
  /<span class="legend-label">(?:Increases \/ enables|Reduces \/ constrains|Context)<\/span>/
);
assert.doesNotMatch(html, /Pick a trigger|What does this trigger|No downstream trigger/);
assert.doesNotMatch(main, /Pick a trigger|What does this trigger|No downstream trigger/);
assert.doesNotMatch(main, /causal-relation[^\n]*edge\.influence/);
assert.doesNotMatch(main, /How does \$\{triggerName\} affect/);
assert.match(main, /How \$\{getRelationshipQuestionAuxiliary\(/);

assert.match(main, /showIncomingInfluences: graphInstance\.showIncomingInfluences/);
assert.match(main, /workspace\.showIncomingInfluences[\s\S]*?workspace\.showTriggers/);
assert.match(main, /workspace\.showOutgoingInfluences[\s\S]*?workspace\.showEffects/);
assert.match(graph, /filter\(isCausalRelationship\)/);
assert.match(graph, /ctx\.setLineDash\(\[\]\)/);
assert.match(propagation, /edges\.filter\(isCausalRelationship\)/);

console.log('Relationship semantic regression checks passed.');
