import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES, RELATIONSHIP_LINEAGE } from '../src/data.js';
import {
  CONTEXT_ONLY_EFFECT_DIRECTION,
  RELATIONSHIP_SEMANTIC_ROLES,
  inferRelationshipSemanticRole,
  isCausalRelationship,
  isContextualRelationship
} from '../src/relationship-semantics.js';

const EXPECTED_FINAL_EDGE_COUNT = 1290;
const OUT_JSON = path.resolve('tmp-relationship-semantics-audit.json');
const OUT_MD = path.resolve('tmp-relationship-semantics-audit.md');
const nodeIds = new Set(NODES.map(node => node.id));
const allowedRoles = new Set(RELATIONSHIP_SEMANTIC_ROLES);
const failures = [];
const findings = [];

function fail(code, edgeKey, detail, severity = 'high') {
  failures.push({ code, edge_key: edgeKey, detail, severity, status: 'unresolved' });
}

function expectedDirection(role) {
  if (role === 'context') return CONTEXT_ONLY_EFFECT_DIRECTION;
  if (role === 'reduces' || role === 'constrains') return 'decreases_or_constrains_target';
  return 'increases_or_enables_target';
}

function countBy(items, keyFn) {
  const result = {};
  for (const item of items) {
    const key = keyFn(item) || 'missing';
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

const edgeKeys = new Set();
for (const edge of EDGES) {
  const key = `${edge.source}->${edge.target}`;
  if (edgeKeys.has(key)) fail('duplicate_final_edge_key', key, 'The final graph contains the same directed edge more than once.', 'critical');
  edgeKeys.add(key);

  if (!nodeIds.has(edge.source)) fail('orphan_source', key, `Missing source node: ${edge.source}`, 'critical');
  if (!nodeIds.has(edge.target)) fail('orphan_target', key, `Missing target node: ${edge.target}`, 'critical');
  if (!allowedRoles.has(edge.semantic_role)) fail('missing_or_invalid_semantic_role', key, String(edge.semantic_role));
  if (inferRelationshipSemanticRole(edge) !== edge.semantic_role) {
    fail('semantic_role_not_reproducible', key, `Stored ${edge.semantic_role}; inferred ${inferRelationshipSemanticRole(edge)}`);
  }

  const effectDirection = edge.evidence?.quantitative_evidence?.effect_direction;
  if (effectDirection !== expectedDirection(edge.semantic_role)) {
    fail('effect_direction_mismatch', key, `Role ${edge.semantic_role}; direction ${effectDirection}`);
  }
  if (!edge.evidence?.relationship_type) fail('missing_relationship_type', key, 'No detailed or bounded fallback relationship type.');
  if (!edge.relationship_description?.trim()) fail('missing_consumer_description', key, 'No reader-facing relationship explanation.');

  if ((edge.semantic_role === 'reduces' || edge.semantic_role === 'constrains') && !(edge.influence < 0)) {
    fail('negative_role_sign_mismatch', key, `Role ${edge.semantic_role}; influence ${edge.influence}`);
  }
  if ((edge.semantic_role === 'increases' || edge.semantic_role === 'enables') && !(edge.influence > 0)) {
    fail('positive_role_sign_mismatch', key, `Role ${edge.semantic_role}; influence ${edge.influence}`);
  }
  if (edge.semantic_role === 'context' && isCausalRelationship(edge)) {
    fail('context_classified_as_causal', key, 'Context-only relationship entered a causal pathway.', 'critical');
  }
  if (edge.semantic_role !== 'context' && !isCausalRelationship(edge)) {
    fail('causal_relationship_excluded', key, `Role ${edge.semantic_role} was excluded from causal pathways.`);
  }
}

if (EDGES.length !== EXPECTED_FINAL_EDGE_COUNT) {
  fail('unexpected_final_edge_count', 'graph', `Expected ${EXPECTED_FINAL_EDGE_COUNT}; found ${EDGES.length}`, 'critical');
}

const authoredKeyCounts = countBy(RELATIONSHIP_LINEAGE.authored_input_edges, edge => edge.key);
for (const [key, count] of Object.entries(authoredKeyCounts)) {
  if (count > 1) fail('duplicate_authored_edge_key', key, `${count} authored records`, 'critical');
}
for (const edge of RELATIONSHIP_LINEAGE.authored_input_edges) {
  if (!inferRelationshipSemanticRole(edge)) {
    fail('ambiguous_authored_semantics', edge.key, `Verb ${edge.verb}; influence ${edge.influence}`);
  }
}

const pluralResponseNames = [
  'Weatherization Retrofits',
  'Building Performance Standards',
  'Walking and Cycling Networks',
  'Urban Heat Action Plans'
];
const singularVerbPattern = /\b(?:accelerates|amplifies|broadens|closes|coordinates|creates|delivers|enables|expands|improves|increases|makes|reduces|rewards|supports)\b/i;
for (const edge of EDGES) {
  const sourceName = NODES.find(node => node.id === edge.source)?.name;
  if (!pluralResponseNames.includes(sourceName)) continue;
  const opening = edge.relationship_description.slice(0, sourceName.length + 40);
  if (opening.startsWith(sourceName) && singularVerbPattern.test(opening.slice(sourceName.length))) {
    fail('plural_subject_verb_mismatch', `${edge.source}->${edge.target}`, opening, 'medium');
  }
}

const contextEdges = EDGES.filter(isContextualRelationship);
const negativeEdges = EDGES.filter(edge => ['reduces', 'constrains'].includes(edge.semantic_role));
const fallbackTypeEdges = EDGES.filter(edge => edge.evidence?.relationship_type_origin === 'semantic_fallback');
const responseNodeIds = new Set(NODES.filter(node => node.node_kind === 'response').map(node => node.id));
const responseEdges = EDGES.filter(edge => responseNodeIds.has(edge.source));

findings.push(
  {
    code: 'signed_relationship_presentation',
    severity: 'high',
    evidence: `${negativeEdges.length} negative relationships across ${new Set(negativeEdges.map(edge => edge.target)).size} target nodes`,
    impact: 'Incoming and outgoing topology can no longer be mistaken for positive triggering.',
    remediation: 'Every edge now carries a signed consumer semantic role.',
    status: 'resolved'
  },
  {
    code: 'context_in_causal_graph',
    severity: 'high',
    evidence: `${contextEdges.length} context-only relationships`,
    impact: 'Context associations no longer enter causal trails, loops, or propagation.',
    remediation: 'Assigned context-only direction and separate UI grouping.',
    status: 'resolved'
  },
  {
    code: 'missing_detailed_relationship_type',
    severity: 'medium',
    evidence: `${fallbackTypeEdges.length} relationships required bounded semantic fallback types`,
    impact: 'No final relationship type remains null.',
    remediation: 'Fallback types are explicit and provenance-marked for later domain refinement.',
    status: 'resolved'
  },
  {
    code: 'authored_to_final_lineage',
    severity: 'medium',
    evidence: `${RELATIONSHIP_LINEAGE.authored_input_edges.length} authored inputs; ${RELATIONSHIP_LINEAGE.suppressed_edge_keys.length} suppression rules; ${Object.keys(RELATIONSHIP_LINEAGE.semantic_redirects).length} redirects; ${EDGES.length} final edges`,
    impact: 'Dropped or redirected authored relationships are inspectable instead of silent.',
    remediation: 'Lineage is exported with the runtime graph contract and checked for duplicate authored keys.',
    status: 'resolved'
  }
);

const report = {
  generated_at: new Date().toISOString(),
  dataset: 'TULIP final relationship graph',
  grain: 'one directed source-to-target relationship per edge key',
  totals: {
    nodes: NODES.length,
    final_edges: EDGES.length,
    authored_input_edges: RELATIONSHIP_LINEAGE.authored_input_edges.length,
    response_nodes: responseNodeIds.size,
    response_outgoing_edges: responseEdges.length,
    context_edges: contextEdges.length,
    suppressed_edge_rules: RELATIONSHIP_LINEAGE.suppressed_edge_keys.length,
    semantic_redirects: Object.keys(RELATIONSHIP_LINEAGE.semantic_redirects).length
  },
  semantic_roles: countBy(EDGES, edge => edge.semantic_role),
  relationship_type_origin: countBy(EDGES, edge => edge.evidence?.relationship_type_origin),
  findings,
  failures,
  ok: failures.length === 0,
  assumptions: [
    'Response nodes remain beneficial interventions rather than being inverted into deficit nodes.',
    'Numeric influence remains a display/salience weight and is not presented as a scientific effect estimate.',
    'Evidence validity remains governed by the existing source-entailment audit.'
  ]
};

const md = [
  '# Relationship Semantics Audit',
  '',
  `Generated: ${report.generated_at}`,
  `Status: **${report.ok ? 'PASS' : 'FAIL'}**`,
  '',
  '## Dataset and grain',
  '',
  `${report.totals.final_edges} final directed relationships across ${report.totals.nodes} nodes; one source-to-target claim per edge key.`,
  '',
  '## Semantic roles',
  '',
  '| Role | Count |',
  '| --- | ---: |',
  ...Object.entries(report.semantic_roles).map(([role, count]) => `| ${role} | ${count} |`),
  '',
  '## Findings',
  '',
  '| Severity | Finding | Evidence | Status |',
  '| --- | --- | --- | --- |',
  ...findings.map(item => `| ${item.severity} | ${item.code} | ${item.evidence} | ${item.status} |`),
  '',
  '## Unresolved failures',
  '',
  ...(failures.length
    ? ['| Severity | Code | Edge | Detail |', '| --- | --- | --- | --- |', ...failures.map(item => `| ${item.severity} | ${item.code} | ${item.edge_key} | ${item.detail} |`)]
    : ['None.']),
  '',
  '## Assumptions',
  '',
  ...report.assumptions.map(item => `- ${item}`),
  ''
];

await Promise.all([
  fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
  fs.writeFile(OUT_MD, `${md.join('\n')}\n`, 'utf8')
]);

console.log(JSON.stringify({
  ok: report.ok,
  edges: EDGES.length,
  semantic_roles: report.semantic_roles,
  failures: failures.length,
  report_json: OUT_JSON,
  report_markdown: OUT_MD
}, null, 2));

if (!report.ok) process.exitCode = 1;
