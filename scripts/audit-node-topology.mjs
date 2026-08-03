import fs from 'node:fs/promises';
import path from 'node:path';

import { NODES, EDGES, GRAPH_PROFILE } from '../src/data.js';

const OUT_JSON = path.resolve('tmp-node-topology-audit.json');
const OUT_MD = path.resolve('tmp-node-topology-audit.md');

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getNodeRole(node) {
  return node?.calibration?.role || 'unknown';
}

function summarize(nodes) {
  const indegrees = nodes.map(node => node.direct_triggers);
  const outdegrees = nodes.map(node => node.direct_effects);
  const totals = nodes.map(node => node.total_direct_degree);

  return {
    count: nodes.length,
    avg_triggers: parseFloat(average(indegrees).toFixed(2)),
    avg_effects: parseFloat(average(outdegrees).toFixed(2)),
    avg_total_degree: parseFloat(average(totals).toFixed(2)),
    zero_trigger_count: nodes.filter(node => node.direct_triggers === 0).length,
    zero_effect_count: nodes.filter(node => node.direct_effects === 0).length,
    one_or_less_trigger_count: nodes.filter(node => node.direct_triggers <= 1).length,
    one_or_less_effect_count: nodes.filter(node => node.direct_effects <= 1).length,
    two_or_less_total_degree_count: nodes.filter(node => node.total_direct_degree <= 2).length
  };
}

const auditNodes = NODES.map(node => {
  const directTriggers = EDGES.filter(edge => edge.target === node.id);
  const directEffects = EDGES.filter(edge => edge.source === node.id);

  return {
    id: node.id,
    name: node.name,
    sphere: node.sphere,
    role: getNodeRole(node),
    score: node.score?.baseline ?? null,
    direct_triggers: directTriggers.length,
    direct_effects: directEffects.length,
    total_direct_degree: directTriggers.length + directEffects.length,
    trigger_nodes: directTriggers.map(edge => edge.source),
    effect_nodes: directEffects.map(edge => edge.target)
  };
}).sort((a, b) => {
  if (a.total_direct_degree !== b.total_direct_degree) {
    return a.total_direct_degree - b.total_direct_degree;
  }
  if (a.direct_triggers !== b.direct_triggers) {
    return a.direct_triggers - b.direct_triggers;
  }
  if (a.direct_effects !== b.direct_effects) {
    return a.direct_effects - b.direct_effects;
  }
  return a.name.localeCompare(b.name);
});

const anchors = auditNodes.filter(node => node.role === 'anchor');
const generated = auditNodes.filter(node => node.role === 'generated');
const sparseNodes = auditNodes.filter(node => node.direct_triggers <= 1 || node.direct_effects <= 1);
const criticallySparseNodes = auditNodes.filter(node => node.total_direct_degree <= 2);

const report = {
  generated_at: new Date().toISOString(),
  graph_profile: GRAPH_PROFILE,
  summary: {
    all_nodes: summarize(auditNodes),
    anchors: summarize(anchors),
    generated: summarize(generated)
  },
  sparse_breakpoints: {
    critically_sparse_total_degree_lte_2: criticallySparseNodes.length,
    sparse_trigger_or_effect_lte_1: sparseNodes.length
  },
  nodes: auditNodes
};

const mdLines = [
  '# Node Topology Audit',
  '',
  `Generated: ${report.generated_at}`,
  `Graph profile: ${GRAPH_PROFILE.id}`,
  `Total nodes: ${auditNodes.length}`,
  `Total edges: ${EDGES.length}`,
  '',
  '## Summary',
  '',
  `- All nodes: avg triggers ${report.summary.all_nodes.avg_triggers}, avg effects ${report.summary.all_nodes.avg_effects}, avg total degree ${report.summary.all_nodes.avg_total_degree}`,
  `- All nodes: ${report.summary.all_nodes.zero_trigger_count} with zero triggers, ${report.summary.all_nodes.zero_effect_count} with zero effects`,
  `- All nodes: ${report.summary.all_nodes.one_or_less_trigger_count} with <=1 trigger, ${report.summary.all_nodes.one_or_less_effect_count} with <=1 effect`,
  `- All nodes: ${report.summary.all_nodes.two_or_less_total_degree_count} with total degree <=2`,
  `- Anchors: avg triggers ${report.summary.anchors.avg_triggers}, avg effects ${report.summary.anchors.avg_effects}, avg total degree ${report.summary.anchors.avg_total_degree}`,
  `- Anchors: ${report.summary.anchors.one_or_less_trigger_count} with <=1 trigger, ${report.summary.anchors.one_or_less_effect_count} with <=1 effect`,
  `- Generated: avg triggers ${report.summary.generated.avg_triggers}, avg effects ${report.summary.generated.avg_effects}, avg total degree ${report.summary.generated.avg_total_degree}`,
  '',
  '## Most Underconnected Nodes',
  '',
  '| Node | Role | Sphere | Triggers | Effects | Total |',
  '| --- | --- | --- | ---: | ---: | ---: |'
];

auditNodes.slice(0, 80).forEach(node => {
  mdLines.push(`| ${node.name} | ${node.role} | ${node.sphere} | ${node.direct_triggers} | ${node.direct_effects} | ${node.total_direct_degree} |`);
});

mdLines.push('');
mdLines.push('## Full Census');
mdLines.push('');
mdLines.push('| Node | Role | Triggers | Effects | Trigger Nodes | Effect Nodes |');
mdLines.push('| --- | --- | ---: | ---: | --- | --- |');

auditNodes.forEach(node => {
  const triggerNodes = node.trigger_nodes.join(', ') || '-';
  const effectNodes = node.effect_nodes.join(', ') || '-';
  mdLines.push(`| ${node.name} | ${node.role} | ${node.direct_triggers} | ${node.direct_effects} | ${triggerNodes} | ${effectNodes} |`);
});

await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(OUT_MD, `${mdLines.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  json: OUT_JSON,
  markdown: OUT_MD,
  total_nodes: auditNodes.length,
  total_edges: EDGES.length,
  all_nodes: report.summary.all_nodes,
  anchors: report.summary.anchors,
  generated: report.summary.generated,
  lowest_degree_nodes: auditNodes.slice(0, 20).map(node => ({
    name: node.name,
    role: node.role,
    sphere: node.sphere,
    triggers: node.direct_triggers,
    effects: node.direct_effects,
    total: node.total_direct_degree
  }))
}, null, 2));
