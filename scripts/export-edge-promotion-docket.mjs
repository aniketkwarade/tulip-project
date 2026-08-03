import fs from 'node:fs/promises';
import path from 'node:path';

const registryPath = path.resolve('public/graph-reference-registry.json');
const outputJsonPath = path.resolve('tmp-edge-promotion-docket.json');
const outputMarkdownPath = path.resolve('tmp-edge-promotion-docket.md');

const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
const nodesById = new Map(registry.nodes.map(node => [node.id, node]));
const degreeById = new Map(registry.nodes.map(node => [node.id, 0]));

for (const edge of registry.edges) {
  degreeById.set(edge.source, (degreeById.get(edge.source) || 0) + 1);
  degreeById.set(edge.target, (degreeById.get(edge.target) || 0) + 1);
}

const genericAbstractionIds = new Set([
  'critical_infrastructure_fragility',
  'environ_anomalies',
  'food',
  'industry_farming',
  'migration',
  'public_health_heat_burden',
  'resource_depletion',
  'shipping_lane_disruption',
  'urbanization'
]);

const topologyPriority = {
  expansion_inbound: 5,
  expansion_outbound: 4,
  expansion_inbound_semantic: 3,
  family_reference: 2,
  family_peer_reference: 1
};

function getRecommendation(edge) {
  if (edge.topology_rule === 'family_peer_reference') {
    return {
      action: 'replace_or_retain_context',
      reason: 'Non-causal peer context cannot become a direct relationship without a new mechanism.'
    };
  }

  if (edge.topology_rule === 'family_reference') {
    return {
      action: 'research_taxonomic_membership',
      reason: 'Promote only after node-specific evidence supports this exact family placement or a causal replacement.'
    };
  }

  if (genericAbstractionIds.has(edge.source) || genericAbstractionIds.has(edge.target)) {
    return {
      action: 'prune_or_replace',
      reason: 'The edge touches a broad abstraction and is likely to skip an operational intermediate mechanism.'
    };
  }

  return {
    action: 'research_for_promotion',
    reason: 'The edge is specific enough to test against relationship-level evidence.'
  };
}

const familySupportedRows = registry.edges
  .filter(edge => edge.defensibility?.label === 'family_supported');

const rows = familySupportedRows
  .filter(edge => ['expansion_inbound', 'expansion_outbound', 'expansion_inbound_semantic', 'family_reference', 'family_peer_reference'].includes(edge.topology_rule))
  .map(edge => {
    const recommendation = getRecommendation(edge);
    const sourceDegree = degreeById.get(edge.source) || 0;
    const targetDegree = degreeById.get(edge.target) || 0;
    const traffic = sourceDegree + targetDegree;
    const priorityScore = (topologyPriority[edge.topology_rule] || 0) * 1000 + traffic;

    return {
      key: edge.key,
      source_id: edge.source,
      source_name: nodesById.get(edge.source)?.name || edge.source,
      target_id: edge.target,
      target_name: nodesById.get(edge.target)?.name || edge.target,
      sphere: nodesById.get(edge.target)?.sphere || nodesById.get(edge.source)?.sphere || 'unknown',
      expansion_family: edge.expansion_family || 'unassigned',
      topology_rule: edge.topology_rule,
      relation: `${edge.verb}${edge.adverb ? ` ${edge.adverb}` : ''}`,
      influence: edge.influence,
      source_degree: sourceDegree,
      target_degree: targetDegree,
      traffic,
      priority_score: priorityScore,
      recommended_action: recommendation.action,
      recommendation_reason: recommendation.reason
    };
  })
  .sort((a, b) => b.priority_score - a.priority_score || a.key.localeCompare(b.key));

function countBy(field) {
  return Object.entries(rows.reduce((counts, row) => {
    const key = row[field] || 'unassigned';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {}))
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

const report = {
  generated_at: new Date().toISOString(),
  graph_profile: registry.graph_profile,
  totals: {
    nodes: registry.nodes.length,
    edges: registry.edges.length,
    family_supported: familySupportedRows.length,
    promotion_queue: rows.length,
    residual_expansion: rows.filter(row => row.topology_rule.startsWith('expansion_')).length,
    anchor_hypotheses: familySupportedRows.filter(edge => edge.evidence?.evidence_mode === 'anchor_context_reference').length
  },
  by_expansion_family: countBy('expansion_family'),
  by_topology_rule: countBy('topology_rule'),
  by_recommended_action: countBy('recommended_action'),
  rows
};

const markdown = [
  '# Edge Promotion Docket',
  '',
  `Generated: ${report.generated_at}`,
  '',
  `Family-supported relationships: ${familySupportedRows.length}`,
  `Promotion queue (family context plus residual expansions): ${rows.length}`,
  `Residual expansion relationships: ${report.totals.residual_expansion}`,
  `Explicit low-confidence anchor hypotheses: ${report.totals.anchor_hypotheses}`,
  '',
  '## Recommended Handling',
  '',
  '| Action | Count |',
  '| --- | ---: |',
  ...report.by_recommended_action.map(item => `| ${item.key} | ${item.count} |`),
  '',
  '## Family Queue',
  '',
  '| Family | Count |',
  '| --- | ---: |',
  ...report.by_expansion_family.map(item => `| ${item.key} | ${item.count} |`),
  '',
  '## Highest-Priority Relationships',
  '',
  '| Edge | Family | Topology | Action | Traffic |',
  '| --- | --- | --- | --- | ---: |',
  ...rows.slice(0, 100).map(row => (
    `| ${row.source_name} -> ${row.target_name} | ${row.expansion_family} | ${row.topology_rule} | ${row.recommended_action} | ${row.traffic} |`
  )),
  '',
  '## Promotion Rule',
  '',
  '- Use curated_direct only when a relationship-specific source supports the stated direction and mechanism.',
  '- Use curated_local when relationship evidence supports a bounded multi-step or operational chain.',
  '- Keep family context explicit when the evidence supports co-membership rather than causality.',
  '- Prune generated abstraction jumps when they skip the mechanism needed to make the claim intelligible.'
];

await fs.writeFile(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(outputMarkdownPath, `${markdown.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  json: outputJsonPath,
  markdown: outputMarkdownPath,
  family_supported: familySupportedRows.length,
  promotion_queue: rows.length,
  residual_expansion: report.totals.residual_expansion,
  by_action: report.by_recommended_action
}, null, 2));
