import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES, GRAPH_PROFILE } from '../src/data.js';

const OUT_JSON = path.resolve('tmp-connection-consumer-audit.json');
const OUT_MD = path.resolve('tmp-connection-consumer-audit.md');

const nodeById = new Map(NODES.map(node => [node.id, node]));

function formatPercent(value, total) {
  if (!total) return '0.0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function getMode(edge) {
  return edge?.evidence?.evidence_mode || edge?.evidence?.source_status || 'none';
}

function getRiskAction(edge) {
  const mode = getMode(edge);
  const relationshipType = edge?.evidence?.relationship_type || 'unknown';
  const confidence = edge?.evidence?.confidence || 'unknown';

  if (mode === 'curated_anchor_inference') {
    return {
      action: 'hide',
      reason: 'Anchor inference is still presented to users as a direct mechanism.'
    };
  }

  if (mode === 'anchor_context_reference') {
    return {
      action: 'label_hypothesis',
      reason: 'Keep the connected topics discoverable, but explicitly present this direction as an unverified hypothesis rather than a causal fact.'
    };
  }

  if (mode === 'family_calibrated_reference') {
    return {
      action: 'rewrite',
      reason: 'Family-level evidence is defensible, but the current explanation is internal boilerplate rather than user-facing causal copy.'
    };
  }

  if (mode === 'curated_edge_reference' && relationshipType === 'direct' && confidence === 'high') {
    return {
      action: 'keep',
      reason: 'Dedicated edge evidence with strong direct support.'
    };
  }

  if (mode === 'curated_edge_reference') {
    return {
      action: 'soften',
      reason: 'Evidence is defensible, but the claim should avoid hard-causal phrasing or technical wording.'
    };
  }

  return {
    action: 'review',
    reason: 'Unexpected remaining edge mode in the current platform graph.'
  };
}

function buildUiRelation(edge) {
  const source = nodeById.get(edge.source)?.name || edge.source;
  const target = nodeById.get(edge.target)?.name || edge.target;
  const influenceLabel = `${edge.influence > 0 ? '+' : ''}${edge.influence}`;
  return `${source} ${edge.verb} ${target} (${influenceLabel})`;
}

function buildAuditRow(edge) {
  const source = nodeById.get(edge.source)?.name || edge.source;
  const target = nodeById.get(edge.target)?.name || edge.target;
  const mode = getMode(edge);
  const relationshipType = edge?.evidence?.relationship_type || 'unknown';
  const confidence = edge?.evidence?.confidence || 'unknown';
  const mechanism = edge?.evidence?.mechanism || '';
  const { action, reason } = getRiskAction(edge);

  return {
    source,
    target,
    ui_relation: buildUiRelation(edge),
    mode,
    relationship_type: relationshipType,
    confidence,
    action,
    reason,
    mechanism
  };
}

const rows = EDGES.map(buildAuditRow);
const countsByMode = {};
const countsByAction = {};
const countsByModeAndAction = {};

for (const row of rows) {
  countsByMode[row.mode] = (countsByMode[row.mode] || 0) + 1;
  countsByAction[row.action] = (countsByAction[row.action] || 0) + 1;
  if (!countsByModeAndAction[row.mode]) countsByModeAndAction[row.mode] = {};
  countsByModeAndAction[row.mode][row.action] = (countsByModeAndAction[row.mode][row.action] || 0) + 1;
}

const report = {
  generated_at: new Date().toISOString(),
  graph_profile: GRAPH_PROFILE,
  totals: {
    nodes: NODES.length,
    edges: EDGES.length
  },
  counts_by_mode: countsByMode,
  counts_by_action: countsByAction,
  counts_by_mode_and_action: countsByModeAndAction,
  rows
};

const keepSamples = rows.filter(row => row.action === 'keep').slice(0, 12);
const softenSamples = rows.filter(row => row.action === 'soften').slice(0, 12);
const rewriteSamples = rows.filter(row => row.action === 'rewrite').slice(0, 12);
const hideSamples = rows.filter(row => row.action === 'hide').slice(0, 12);

const md = [
  '# Consumer-Facing Connection Audit',
  '',
  `Generated: ${report.generated_at}`,
  `Graph profile: ${GRAPH_PROFILE.id}`,
  `Total nodes: ${NODES.length}`,
  `Total edges: ${EDGES.length}`,
  '',
  '## Recommended Actions',
  '',
  `- Keep: ${countsByAction.keep || 0} (${formatPercent(countsByAction.keep || 0, EDGES.length)})`,
  `- Soften: ${countsByAction.soften || 0} (${formatPercent(countsByAction.soften || 0, EDGES.length)})`,
  `- Rewrite: ${countsByAction.rewrite || 0} (${formatPercent(countsByAction.rewrite || 0, EDGES.length)})`,
  `- Hide: ${countsByAction.hide || 0} (${formatPercent(countsByAction.hide || 0, EDGES.length)})`,
  `- Label hypothesis: ${countsByAction.label_hypothesis || 0} (${formatPercent(countsByAction.label_hypothesis || 0, EDGES.length)})`,
  '',
  '## Mode Summary',
  '',
  '| Mode | Count | Recommended handling |',
  '| --- | ---: | --- |',
  `| curated_edge_reference | ${countsByMode.curated_edge_reference || 0} | Keep only direct/high edges as-is; soften the rest |`,
  `| family_calibrated_reference | ${countsByMode.family_calibrated_reference || 0} | Rewrite explanation layer; current boilerplate is not consumer-facing |`,
  `| curated_anchor_inference | ${countsByMode.curated_anchor_inference || 0} | Hide from user-facing causality until edge-specific support exists |`,
  `| anchor_context_reference | ${countsByMode.anchor_context_reference || 0} | Keep discoverable with explicit hypothesis labeling |`,
  '',
  '## Why',
  '',
  '- `curated_edge_reference` is the only bucket with dedicated edge-level support, but many remaining items are still indirect or medium-confidence and should not read like simple hard-causal facts.',
  '- `family_calibrated_reference` is defensible at the family level, but the current mechanism text is technical boilerplate like "connected through the water systems family topology."',
  '- `curated_anchor_inference` still tells the user a direct-sounding story even though the code itself says those edges should be promoted later if dedicated citations are added.',
  '',
  '## Keep Samples',
  '',
  '| Edge | Why it can stay |',
  '| --- | --- |'
];

for (const row of keepSamples) {
  md.push(`| ${row.ui_relation} | ${row.mechanism} |`);
}

md.push('');
md.push('## Soften Samples');
md.push('');
md.push('| Edge | Why soften |');
md.push('| --- | --- |');

for (const row of softenSamples) {
  md.push(`| ${row.ui_relation} | ${row.mechanism} |`);
}

md.push('');
md.push('## Rewrite Samples');
md.push('');
md.push('| Edge | Why rewrite |');
md.push('| --- | --- |');

for (const row of rewriteSamples) {
  md.push(`| ${row.ui_relation} | ${row.mechanism} |`);
}

md.push('');
md.push('## Hide Samples');
md.push('');
md.push('| Edge | Why hide |');
md.push('| --- | --- |');

for (const row of hideSamples) {
  md.push(`| ${row.ui_relation} | ${row.mechanism} |`);
}

await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(OUT_MD, `${md.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  json: OUT_JSON,
  markdown: OUT_MD,
  counts_by_action: countsByAction,
  counts_by_mode: countsByMode
}, null, 2));
