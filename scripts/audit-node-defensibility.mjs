import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, GRAPH_PROFILE, NODES } from '../src/data.js';

const OUT_JSON = path.resolve('tmp-node-defensibility-audit.json');
const OUT_MD = path.resolve('tmp-node-defensibility-audit.md');

const NODE_STATUS_SCORE = {
  primary_research_link: 4.8,
  web_verified_official: 4.6,
  official_registry_link: 4.3,
  node_specific_rehabilitation: 4.3,
  relationship_dossier_readback: 4.3,
  curated_response_reference: 4.1,
  curated_anchor_reference: 4.1,
  family_calibrated_reference: 2.3,
  inherited: 2.2,
  undocumented: 1.4
};

const ROLE_ADJUSTMENT = {
  anchor: 0.2,
  generated: -0.4,
  unknown: 0
};

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getEdgeMode(edge) {
  return edge?.evidence?.evidence_mode || edge?.evidence?.source_status || 'none';
}

function getEdgeScore(edge) {
  const mode = getEdgeMode(edge);
  const relationshipType = edge?.evidence?.relationship_type || 'indirect';
  const confidence = edge?.evidence?.confidence || 'medium';

  if (mode === 'curated_edge_reference') {
    if (confidence === 'high') return 4.8;
    if (confidence === 'moderate' || confidence === 'medium') return 4.3;
    return 3.8;
  }

  if (mode === 'curated_local_reference') {
    if (confidence === 'high') return 4.1;
    if (confidence === 'moderate' || confidence === 'medium') return 3.7;
    return 3.3;
  }

  if (mode === 'family_reference') return 2.7;
  if (mode === 'family_peer_reference') return 2.5;
  if (mode === 'family_calibrated_reference') return 2.6;
  if (mode === 'anchor_context_reference' || mode === 'curated_anchor_inference') return 2.1;
  if (mode === 'generated_bridge') return 1.8;
  if (mode === 'generated_intra_sphere') return 1.7;
  if (mode === 'generated_seed') return 1.6;
  if (mode === 'generated_inter_sphere') return 1.5;
  if (mode === 'hub_rebalanced') return 1.4;
  return 1.2;
}

function getTier(score) {
  if (score >= 82) return 'A';
  if (score >= 68) return 'B';
  if (score >= 52) return 'C';
  return 'D';
}

function getTierLabel(tier) {
  if (tier === 'A') return 'Highly defensible';
  if (tier === 'B') return 'Defensible with caveats';
  if (tier === 'C') return 'Plausible but mostly modeled';
  return 'Weakest empirical support';
}

function getNodeBaseScore(node) {
  const status = node?.source_status || node?.calibration?.source_status || 'undocumented';
  const role = node?.role || node?.calibration?.role || 'unknown';
  return (NODE_STATUS_SCORE[status] ?? NODE_STATUS_SCORE.undocumented) + (ROLE_ADJUSTMENT[role] ?? 0);
}

function buildRationale(nodeAudit) {
  const rationale = [];

  if (nodeAudit.role === 'anchor') {
    rationale.push('anchor node');
  } else {
    rationale.push('generated node');
  }

  rationale.push(`node source: ${nodeAudit.source_status}`);

  if (nodeAudit.curated_edges > 0) {
    rationale.push(`${nodeAudit.curated_edges} curated edge(s)`);
  } else if (nodeAudit.family_edges > 0) {
    rationale.push('no curated edges, but family-calibrated links exist');
  } else {
    rationale.push('all adjacent edges are inferred/procedural');
  }

  if (nodeAudit.generated_edges >= Math.ceil(nodeAudit.total_degree * 0.75)) {
    rationale.push('neighborhood is dominated by generated topology');
  }

  if (nodeAudit.total_degree <= 4) {
    rationale.push('sparse local topology');
  }

  return rationale;
}

const nodeMap = new Map(
  NODES.map(node => [
    node.id,
    {
      id: node.id,
      name: node.name,
      sphere: node.sphere,
      role: node?.calibration?.role || 'unknown',
      source_status: node?.calibration?.source_status || 'undocumented',
      tulip_score: node?.score?.baseline ?? null,
      inbound: [],
      outbound: []
    }
  ])
);

for (const edge of EDGES) {
  if (nodeMap.has(edge.source)) nodeMap.get(edge.source).outbound.push(edge);
  if (nodeMap.has(edge.target)) nodeMap.get(edge.target).inbound.push(edge);
}

const audits = Array.from(nodeMap.values()).map(node => {
  const adjacentEdges = [...node.inbound, ...node.outbound];
  const baseScore = getNodeBaseScore(node);
  const avgEdgeScore = average(adjacentEdges.map(getEdgeScore));
  const modeCounts = adjacentEdges.reduce((acc, edge) => {
    const mode = getEdgeMode(edge);
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {});

  let totalScore = (((baseScore * 0.55) + (avgEdgeScore * 0.45)) / 5) * 100;
  if (adjacentEdges.length <= 4) totalScore -= 6;
  else if (adjacentEdges.length <= 6) totalScore -= 3;
  totalScore = Math.max(0, Math.min(100, totalScore));

  const audit = {
    id: node.id,
    name: node.name,
    sphere: node.sphere,
    role: node.role,
    source_status: node.source_status,
    tulip_score: node.tulip_score,
    base_evidence_score: Number(baseScore.toFixed(2)),
    avg_connection_score: Number(avgEdgeScore.toFixed(2)),
    defensibility_score: Number(totalScore.toFixed(1)),
    tier: getTier(totalScore),
    tier_label: getTierLabel(getTier(totalScore)),
    inbound_degree: node.inbound.length,
    outbound_degree: node.outbound.length,
    total_degree: adjacentEdges.length,
    curated_edges: (modeCounts.curated_edge_reference || 0) + (modeCounts.curated_local_reference || 0),
    family_edges:
      (modeCounts.family_calibrated_reference || 0) +
      (modeCounts.family_reference || 0) +
      (modeCounts.family_peer_reference || 0),
    inferred_edges: (modeCounts.anchor_context_reference || 0) + (modeCounts.curated_anchor_inference || 0),
    generated_edges:
      (modeCounts.generated_bridge || 0) +
      (modeCounts.generated_intra_sphere || 0) +
      (modeCounts.generated_seed || 0) +
      (modeCounts.generated_inter_sphere || 0) +
      (modeCounts.hub_rebalanced || 0),
    edge_mode_counts: modeCounts
  };

  audit.rationale = buildRationale(audit);
  return audit;
}).sort((a, b) => {
  if (b.defensibility_score !== a.defensibility_score) {
    return b.defensibility_score - a.defensibility_score;
  }
  if (b.avg_connection_score !== a.avg_connection_score) {
    return b.avg_connection_score - a.avg_connection_score;
  }
  return a.name.localeCompare(b.name);
});

const tierCounts = audits.reduce((acc, audit) => {
  acc[audit.tier] = (acc[audit.tier] || 0) + 1;
  return acc;
}, {});

const roleCounts = audits.reduce((acc, audit) => {
  acc[audit.role] = (acc[audit.role] || 0) + 1;
  return acc;
}, {});

const nodeSourceCounts = audits.reduce((acc, audit) => {
  acc[audit.source_status] = (acc[audit.source_status] || 0) + 1;
  return acc;
}, {});

const edgeModeCounts = EDGES.reduce((acc, edge) => {
  const mode = getEdgeMode(edge);
  acc[mode] = (acc[mode] || 0) + 1;
  return acc;
}, {});

const report = {
  generated_at: new Date().toISOString(),
  graph_profile: GRAPH_PROFILE,
  totals: {
    nodes: NODES.length,
    edges: EDGES.length
  },
  methodology: {
    note: 'This is a graph-internal defensibility audit, not a full scientific truth certification.',
    node_status_score: NODE_STATUS_SCORE,
    role_adjustment: ROLE_ADJUSTMENT,
    edge_scoring_rules: {
      curated_edge_reference_high: 4.8,
      curated_edge_reference_moderate: 4.3,
      curated_edge_reference_other: 3.8,
      curated_local_reference_high: 4.1,
      curated_local_reference_moderate: 3.7,
      family_reference: 2.7,
      family_peer_reference: 2.5,
      family_calibrated_reference: 2.6,
      anchor_context_reference: 2.1,
      generated_bridge: 1.8,
      generated_intra_sphere: 1.7,
      generated_seed: 1.6,
      generated_inter_sphere: 1.5,
      hub_rebalanced: 1.4
    },
    tier_thresholds: {
      A: '>= 82',
      B: '>= 68',
      C: '>= 52',
      D: '< 52'
    }
  },
  summary: {
    tier_counts: tierCounts,
    role_counts: roleCounts,
    node_source_counts: nodeSourceCounts,
    edge_mode_counts: edgeModeCounts
  },
  top_25: audits.slice(0, 25),
  bottom_25: audits.slice(-25),
  nodes: audits.map((audit, index) => ({
    rank: index + 1,
    ...audit
  }))
};

const md = [
  '# Node Defensibility Audit',
  '',
  `Generated: ${report.generated_at}`,
  `Graph profile: ${GRAPH_PROFILE.id}`,
  `Total nodes: ${NODES.length}`,
  `Total edges: ${EDGES.length}`,
  '',
  '## What this is',
  '',
  '- This is a graph-internal audit of how defensible each node is in the current repo.',
  '- It does not certify that every node is scientifically settled; it ranks nodes by how well the current graph grounds them.',
  '- A node ranks higher when its own calibration is attached to official or primary sources and when its adjacent edges are curated instead of procedural.',
  '',
  '## Summary',
  '',
  `- Tier A (highly defensible): ${tierCounts.A || 0}`,
  `- Tier B (defensible with caveats): ${tierCounts.B || 0}`,
  `- Tier C (plausible but mostly modeled): ${tierCounts.C || 0}`,
  `- Tier D (weakest empirical support): ${tierCounts.D || 0}`,
  '',
  `- Anchor nodes: ${roleCounts.anchor || 0}`,
  `- Generated nodes: ${roleCounts.generated || 0}`,
  '',
  `- Node sources: ${Object.entries(nodeSourceCounts).map(([key, value]) => `${key}=${value}`).join(', ')}`,
  `- Edge evidence modes: ${Object.entries(edgeModeCounts).map(([key, value]) => `${key}=${value}`).join(', ')}`,
  '',
  '## Method',
  '',
  '- Node evidence score comes from the node calibration source status.',
  '- Connection evidence score is the average quality of all adjacent edges.',
  '- Sparse local topology gets a small penalty because weakly connected generated nodes are easier to overstate.',
  '- This means a node can be real and important, but still rank poorly if the current graph only supports it with modeled topology.',
  '',
  '## Top 25 Nodes',
  '',
  '| Rank | Node | Tier | Score | Role | Source | In | Out | Curated | Family | Generated |',
  '| ---: | --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |'
];

report.top_25.forEach((audit, index) => {
  md.push(
    `| ${index + 1} | ${audit.name} | ${audit.tier} | ${audit.defensibility_score} | ${audit.role} | ${audit.source_status} | ${audit.inbound_degree} | ${audit.outbound_degree} | ${audit.curated_edges} | ${audit.family_edges} | ${audit.generated_edges} |`
  );
});

md.push('');
md.push('## Bottom 25 Nodes');
md.push('');
md.push('| Rank | Node | Tier | Score | Role | Source | In | Out | Curated | Family | Generated |');
md.push('| ---: | --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |');

report.bottom_25.forEach(audit => {
  const rank = report.nodes.find(node => node.id === audit.id)?.rank;
  md.push(
    `| ${rank} | ${audit.name} | ${audit.tier} | ${audit.defensibility_score} | ${audit.role} | ${audit.source_status} | ${audit.inbound_degree} | ${audit.outbound_degree} | ${audit.curated_edges} | ${audit.family_edges} | ${audit.generated_edges} |`
  );
});

md.push('');
md.push('## Full Ranking');
md.push('');
md.push('| Rank | Node | Tier | Score | Sphere | Role | Source | In | Out | Curated | Family | Inferred | Generated | Rationale |');
md.push('| ---: | --- | --- | ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |');

report.nodes.forEach(node => {
  md.push(
    `| ${node.rank} | ${node.name} | ${node.tier} | ${node.defensibility_score} | ${node.sphere} | ${node.role} | ${node.source_status} | ${node.inbound_degree} | ${node.outbound_degree} | ${node.curated_edges} | ${node.family_edges} | ${node.inferred_edges} | ${node.generated_edges} | ${node.rationale.join('; ')} |`
  );
});

await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(OUT_MD, `${md.join('\n')}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      json: OUT_JSON,
      markdown: OUT_MD,
      totals: report.totals,
      tier_counts: tierCounts,
      top_10: report.top_25.slice(0, 10).map(node => ({
        rank: report.nodes.find(entry => entry.id === node.id)?.rank,
        name: node.name,
        score: node.defensibility_score,
        tier: node.tier
      })),
      bottom_10: report.bottom_25.slice(-10).map(node => ({
        rank: report.nodes.find(entry => entry.id === node.id)?.rank,
        name: node.name,
        score: node.defensibility_score,
        tier: node.tier
      }))
    },
    null,
    2
  )
);
