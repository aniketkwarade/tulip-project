import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, GRAPH_PROFILE, NODES } from '../src/data.js';

const OUT_JSON = path.resolve('tmp-phenomenon-coverage-audit.json');
const OUT_MD = path.resolve('tmp-phenomenon-coverage-audit.md');
const SOURCE_REGISTRY_PATH = path.resolve('public/tulip-source-registry.json');
const SOURCE_ATTACHMENTS_PATH = path.resolve('public/node-source-attachments.json');
const API_KEY_REGISTRY_PATH = path.resolve('public/api-key-registry.json');

const nodeById = new Map(NODES.map(node => [node.id, node]));
const incomingById = new Map(NODES.map(node => [node.id, []]));
const outgoingById = new Map(NODES.map(node => [node.id, []]));

for (const edge of EDGES) {
  incomingById.get(edge.target)?.push(edge);
  outgoingById.get(edge.source)?.push(edge);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function isResponse(node) {
  return node?.node_kind === 'response'
    || node?.authenticity?.status === 'reviewed_climate_response';
}

function getRelationshipLevel(edge) {
  return edge?.evidence?.relationship_level || 'missing';
}

function getEvidenceMode(edge) {
  return edge?.evidence?.evidence_mode || edge?.evidence?.source_status || 'missing';
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item) || 'missing';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function summarizeNodes(nodes) {
  const incoming = nodes.map(node => incomingById.get(node.id)?.length || 0);
  const outgoing = nodes.map(node => outgoingById.get(node.id)?.length || 0);
  const underThree = nodes.filter(node => (incomingById.get(node.id)?.length || 0) < 3).length;
  const gateApplicable = nodes.filter(node => node.graph_contract?.driver_gate?.applicable);
  const gateFailures = gateApplicable.filter(node => (
    node.graph_contract?.driver_gate?.status !== 'pass'
  ));

  return {
    count: nodes.length,
    avg_incoming_drivers: Number(average(incoming).toFixed(2)),
    avg_outgoing_effects: Number(average(outgoing).toFixed(2)),
    zero_incoming: incoming.filter(value => value === 0).length,
    one_incoming: incoming.filter(value => value === 1).length,
    two_incoming: incoming.filter(value => value === 2).length,
    under_three_incoming: underThree,
    under_three_rate_pct: percent(underThree, nodes.length),
    semantic_driver_gate_applicable: gateApplicable.length,
    semantic_driver_gate_failures: gateFailures.length,
    semantic_driver_gate_failure_rate_pct: percent(gateFailures.length, gateApplicable.length),
    zero_outgoing: outgoing.filter(value => value === 0).length,
    total_degree_lte_two: nodes.filter(node => (
      (incomingById.get(node.id)?.length || 0) + (outgoingById.get(node.id)?.length || 0)
    ) <= 2).length
  };
}

function buildNodeRow(node) {
  const incoming = incomingById.get(node.id) || [];
  const outgoing = outgoingById.get(node.id) || [];
  const incomingLevels = countBy(incoming, getRelationshipLevel);
  const outgoingLevels = countBy(outgoing, getRelationshipLevel);
  const driverSpheres = Array.from(new Set(
    incoming.map(edge => nodeById.get(edge.source)?.sphere).filter(Boolean)
  )).sort();
  const sourceScope = node.authenticity?.source_scope || 'missing';
  const missingMetric = !node.calibration_metric && !node.calibration?.metric;
  const missingHumanImpact = !node.humanImpact;
  const missingPlanetImpact = !node.planetImpact;
  const inheritedEvidence = sourceScope === 'anchor_inherited';
  const requiredDrivers = node.graph_contract?.driver_gate?.required_incoming_drivers
    ?? (isResponse(node) ? 0 : 3);
  const incomingGap = Math.max(0, requiredDrivers - incoming.length);
  const baseline = node.score?.baseline || 0;

  // This is a remediation queue, not a scientific importance score.
  const remediationPriority = Number((
    (incomingGap * 20)
    + (node.calibration?.role === 'anchor' ? 12 : 0)
    + (baseline * 2)
    + (missingMetric ? 5 : 0)
    + (missingHumanImpact ? 3 : 0)
    + (missingPlanetImpact ? 3 : 0)
    + (inheritedEvidence ? 5 : 0)
  ).toFixed(1));

  return {
    id: node.id,
    name: node.name,
    sphere: node.sphere,
    role: node.calibration?.role || 'unknown',
    node_kind: node.node_kind || 'phenomenon_or_indicator',
    node_class: node.graph_contract?.node_class || 'missing',
    authenticity_status: node.authenticity?.status || 'missing',
    source_scope: sourceScope,
    source_status: node.calibration?.source_status || 'missing',
    baseline_score: node.score?.baseline ?? null,
    incoming_drivers: incoming.length,
    outgoing_effects: outgoing.length,
    total_degree: incoming.length + outgoing.length,
    incoming_relationship_levels: incomingLevels,
    outgoing_relationship_levels: outgoingLevels,
    unique_driver_spheres: driverSpheres.length,
    driver_spheres: driverSpheres,
    driver_node_ids: incoming.map(edge => edge.source),
    effect_node_ids: outgoing.map(edge => edge.target),
    driver_gate_applicable: node.graph_contract?.driver_gate?.applicable ?? !isResponse(node),
    driver_gate_status: node.graph_contract?.driver_gate?.status || (incomingGap ? 'research_track' : 'pass'),
    under_three_driver_gate: (node.graph_contract?.driver_gate?.applicable ?? !isResponse(node)) && incomingGap > 0,
    missing_driver_count_to_gate: incomingGap,
    has_calibration_metric: !missingMetric || Boolean(node.metric_contract),
    has_metric_contract: Boolean(node.metric_contract),
    has_human_impact: !missingHumanImpact,
    has_planet_impact: !missingPlanetImpact,
    economic_context_basis: node.economicContext?.basis || 'missing',
    remediation_priority: remediationPriority
  };
}

const nodeRows = NODES.map(buildNodeRow).sort((a, b) => (
  b.remediation_priority - a.remediation_priority
  || a.name.localeCompare(b.name)
));

const phenomena = NODES.filter(node => !isResponse(node));
const responses = NODES.filter(isResponse);
const anchors = phenomena.filter(node => node.calibration?.role === 'anchor');
const generated = phenomena.filter(node => node.calibration?.role === 'generated');
const spheres = Array.from(new Set(NODES.map(node => node.sphere))).sort();

const sourceRegistry = JSON.parse(await fs.readFile(SOURCE_REGISTRY_PATH, 'utf8'));
const sourceAttachments = JSON.parse(await fs.readFile(SOURCE_ATTACHMENTS_PATH, 'utf8'));
const apiKeyRegistry = JSON.parse(await fs.readFile(API_KEY_REGISTRY_PATH, 'utf8'));
const attachmentCoveredIds = new Set(
  (sourceAttachments.rules || []).flatMap(rule => rule.node_ids || [])
);
const coveredGraphNodes = NODES.filter(node => attachmentCoveredIds.has(node.id));
const operationalOpenNotActive = (sourceRegistry.sources || [])
  .filter(source => source.operational_open && !source.platform_integration?.active)
  .map(source => ({
    id: source.id,
    name: source.name,
    url: source.url,
    ingestion_mode: source.ingestion_mode,
    fit: source.fit || []
  }));

const directedKeys = EDGES.map(edge => `${edge.source}->${edge.target}`);
const directedKeySet = new Set(directedKeys);
const reciprocalPairCount = EDGES.filter(edge => (
  directedKeySet.has(`${edge.target}->${edge.source}`)
)).length / 2;
const crossSphereEdges = EDGES.filter(edge => (
  nodeById.get(edge.source)?.sphere !== nodeById.get(edge.target)?.sphere
));
const trustedEdges = EDGES.filter(edge => (
  ['direct', 'indirect'].includes(getRelationshipLevel(edge))
));

const contentCompleteness = {
  missing_description: NODES.filter(node => !node.description?.trim()).length,
  missing_human_impact: NODES.filter(node => !node.humanImpact).length,
  missing_planet_impact: NODES.filter(node => !node.planetImpact).length,
  missing_economic_context: NODES.filter(node => !node.economicContext).length,
  default_economic_context_fallback: NODES.filter(node => (
    node.economicContext?.basis === 'default_sphere_fallback_v1'
  )).length,
  missing_calibration_metric: NODES.filter(node => (
    !node.calibration_metric && !node.calibration?.metric
  )).length,
  missing_measurement_contract: NODES.filter(node => (
    !node.calibration_metric && !node.calibration?.metric && !node.metric_contract
  )).length,
  defined_node_metric_contracts: NODES.filter(node => Boolean(node.metric_contract)).length,
  missing_update_policy: NODES.filter(node => !node.update_policy).length,
  missing_node_source_urls: NODES.filter(node => (
    !(node.calibration?.source_urls || []).length
  )).length,
  generated_nodes_with_anchor_inherited_evidence: NODES.filter(node => (
    node.calibration?.role === 'generated'
    && node.authenticity?.source_scope === 'anchor_inherited'
  )).length,
  node_specific_authenticity_scope: NODES.filter(node => (
    node.authenticity?.source_scope === 'node_specific'
  )).length
};

const edgeIntegrity = {
  orphan_edges: EDGES.filter(edge => (
    !nodeById.has(edge.source) || !nodeById.has(edge.target)
  )).length,
  self_loops: EDGES.filter(edge => edge.source === edge.target).length,
  duplicate_directional_edges: directedKeys.length - directedKeySet.size,
  missing_relationship_level: EDGES.filter(edge => !edge.evidence?.relationship_level).length,
  missing_relationship_source_urls: EDGES.filter(edge => (
    !(edge.evidence?.relationship_source_urls || []).length
  )).length,
  missing_any_source_urls: EDGES.filter(edge => (
    !(edge.evidence?.source_urls || []).length
  )).length,
  missing_evidence_notes: EDGES.filter(edge => !edge.evidence?.notes?.trim()).length,
  missing_confidence: EDGES.filter(edge => !edge.evidence?.confidence).length,
  missing_relationship_type: EDGES.filter(edge => !edge.evidence?.relationship_type).length,
  nonfinite_influence: EDGES.filter(edge => !Number.isFinite(edge.influence)).length
};

const report = {
  generated_at: new Date().toISOString(),
  methodology: {
    driver_gate: 'Phenomena require three incoming drivers, operational indicators require one, and responses plus explicitly authored root drivers are exempt.',
    important_boundary: 'The driver gate is a coverage test, not permission to create unsupported edges. Each candidate relationship still needs relationship-specific evidence and bounded causal wording.',
    graph_source: 'src/data.js live NODES and EDGES export',
    source_inventory: 'public/tulip-source-registry.json',
    source_attachment_inventory: 'public/node-source-attachments.json'
  },
  graph_profile: GRAPH_PROFILE,
  totals: {
    nodes: NODES.length,
    edges: EDGES.length,
    phenomena_or_indicators: phenomena.length,
    climate_responses: responses.length,
    node_classes: countBy(NODES, node => node.graph_contract?.node_class || 'missing')
  },
  findings: [
    {
      id: 'phenomenon_driver_undercoverage',
      severity: 'critical',
      confidence: 'high',
      evidence: `${summarizeNodes(phenomena).semantic_driver_gate_failures} of ${summarizeNodes(phenomena).semantic_driver_gate_applicable} non-response nodes fail their semantic driver gate; ${summarizeNodes(phenomena).under_three_incoming} remain below three incoming drivers in the raw topology.`,
      risk: 'The graph presents many phenomena as single-cause spokes and cannot yet express realistic multi-driver pathways.',
      remediation: 'Research and promote relationship-specific drivers in evidence batches, prioritizing anchors and high-impact generated nodes.'
    },
    {
      id: 'generated_star_topology',
      severity: 'critical',
      confidence: 'high',
      evidence: `${summarizeNodes(generated).one_incoming} of ${generated.length} generated phenomena have exactly one incoming driver; ${summarizeNodes(generated).zero_outgoing} have no outgoing effects.`,
      risk: 'Generated nodes inherit a label and evidence family without becoming meaningful causal participants in the graph.',
      remediation: 'Replace one-anchor generation with a research queue requiring multiple independent mechanisms and at least one downstream effect where defensible.'
    },
    {
      id: 'measurement_gap',
      severity: 'critical',
      confidence: 'high',
      evidence: `${contentCompleteness.missing_measurement_contract} of ${NODES.length} nodes have neither a calibration metric nor a defined metric contract; ${contentCompleteness.defined_node_metric_contracts} now have explicit API-ready contracts.`,
      risk: 'Most scores cannot be refreshed from an observed quantity, so API ingestion cannot reliably update the graph.',
      remediation: 'Introduce metric contracts per anchor: metric, unit, geography, cadence, source, observation time, transformation, uncertainty, and threshold provenance.'
    },
    {
      id: 'relationship_specific_evidence_gap',
      severity: 'high',
      confidence: 'high',
      evidence: `${edgeIntegrity.missing_relationship_source_urls} of ${EDGES.length} edges lack relationship-specific source URLs.`,
      risk: 'Node-level sources may be incorrectly read as supporting the direction or mechanism of an edge.',
      remediation: 'Require relationship_source_urls and a bounded mechanism before promoting inferred or family-level edges.'
    },
    {
      id: 'context_gap',
      severity: 'high',
      confidence: 'high',
      evidence: `${contentCompleteness.missing_human_impact} nodes lack human-impact context, ${contentCompleteness.missing_planet_impact} lack planetary context, and ${contentCompleteness.default_economic_context_fallback} use generic economic fallback text.`,
      risk: 'The same topology reads as universal even when pathways vary by geography, population, timescale, and system vulnerability.',
      remediation: 'Add structured spatial scope, temporal horizon, exposed systems/populations, moderators, countervailing factors, and uncertainty.'
    },
    {
      id: 'source_attachment_gap',
      severity: 'high',
      confidence: 'high',
      evidence: `${coveredGraphNodes.length} of ${NODES.length} graph nodes are covered by a source-attachment rule.`,
      risk: 'Many sources exist in the registry but are not connected to refreshable node or relationship contracts.',
      remediation: 'Map source bundles to node metrics and edge evidence, then test coverage and freshness in CI.'
    }
  ],
  cohorts: {
    all_nodes: summarizeNodes(NODES),
    phenomena_or_indicators: summarizeNodes(phenomena),
    climate_responses: summarizeNodes(responses),
    non_response_anchors: summarizeNodes(anchors),
    generated_phenomena: summarizeNodes(generated)
  },
  sphere_coverage: Object.fromEntries(spheres.map(sphere => [
    sphere,
    summarizeNodes(phenomena.filter(node => node.sphere === sphere))
  ])),
  relationship_inventory: {
    levels: countBy(EDGES, getRelationshipLevel),
    evidence_modes: countBy(EDGES, getEvidenceMode),
    trusted_direct_or_indirect: trustedEdges.length,
    trusted_direct_or_indirect_rate_pct: percent(trustedEdges.length, EDGES.length),
    cross_sphere_edges: crossSphereEdges.length,
    cross_sphere_rate_pct: percent(crossSphereEdges.length, EDGES.length),
    reciprocal_pairs: reciprocalPairCount,
    integrity: edgeIntegrity
  },
  content_completeness: contentCompleteness,
  source_and_api_inventory: {
    source_registry_summary: sourceRegistry.summary,
    source_attachment_bundle_count: Object.keys(sourceAttachments.bundles || {}).length,
    source_attachment_rule_count: (sourceAttachments.rules || []).length,
    graph_nodes_covered_by_attachment_rules: coveredGraphNodes.length,
    attachment_rule_coverage_rate_pct: percent(coveredGraphNodes.length, NODES.length),
    operational_open_sources_not_active: operationalOpenNotActive,
    api_keys: (apiKeyRegistry.keys || []).map(key => ({
      id: key.id,
      status: key.status,
      drives_core_scoring: key.drives_core_scoring
    }))
  },
  priority_underconnected_anchors: nodeRows.filter(row => (
    row.role === 'anchor'
    && row.node_kind !== 'response'
    && row.driver_gate_status === 'research_track'
  )).slice(0, 50),
  priority_underconnected_generated_nodes: nodeRows.filter(row => (
    row.role === 'generated'
    && row.driver_gate_status === 'research_track'
  )).slice(0, 100),
  nodes: nodeRows
};

const cohort = report.cohorts.phenomena_or_indicators;
const generatedSummary = report.cohorts.generated_phenomena;
const md = [
  '# Phenomenon, Relationship, Context, and Ingestion Audit',
  '',
  `Generated: ${report.generated_at}`,
  `Graph profile: ${GRAPH_PROFILE.id}`,
  `Live export: ${NODES.length} nodes / ${EDGES.length} edges`,
  '',
  '## Executive Summary',
  '',
  `- **The graph remains underdeveloped after semantic exemptions.** ${cohort.semantic_driver_gate_failures} of ${cohort.semantic_driver_gate_applicable} applicable non-response nodes (${cohort.semantic_driver_gate_failure_rate_pct}%) remain on research track; ${cohort.under_three_incoming} are below three drivers in the raw topology.`,
  `- **The procedural expansion is still a one-anchor star model.** ${generatedSummary.one_incoming} of ${generatedSummary.count} generated nodes have exactly one incoming driver and ${generatedSummary.zero_outgoing} have no downstream effect.`,
  `- **The largest data gap is measurement, not labels.** ${contentCompleteness.missing_measurement_contract} of ${NODES.length} nodes have neither a calibration metric nor a defined metric contract; ${contentCompleteness.defined_node_metric_contracts} API-ready contracts are now explicit.`,
  `- **Evidence volume is not the same as relationship evidence.** ${edgeIntegrity.missing_relationship_source_urls} of ${EDGES.length} edges lack relationship-specific URLs even though every edge has at least one general source URL.`,
  `- **The source registry is ahead of graph ingestion.** ${sourceRegistry.summary.total_sources} sources are catalogued, but only ${coveredGraphNodes.length} graph nodes (${percent(coveredGraphNodes.length, NODES.length)}%) are covered by attachment rules.`,
  '',
  '## Coverage by Cohort',
  '',
  '| Cohort | Nodes | Avg drivers | Avg effects | 0 drivers | 1 driver | 2 drivers | <3 raw | Gate failures | Gate failure rate | 0 effects |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...Object.entries(report.cohorts).map(([name, summary]) => (
    `| ${name.replace(/_/g, ' ')} | ${summary.count} | ${summary.avg_incoming_drivers} | ${summary.avg_outgoing_effects} | ${summary.zero_incoming} | ${summary.one_incoming} | ${summary.two_incoming} | ${summary.under_three_incoming} | ${summary.semantic_driver_gate_failures} | ${summary.semantic_driver_gate_failure_rate_pct}% | ${summary.zero_outgoing} |`
  )),
  '',
  '## Coverage by Sphere (Non-Response Nodes)',
  '',
  '| Sphere | Nodes | Avg drivers | <3 drivers | <3 rate | 0 effects |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
  ...Object.entries(report.sphere_coverage).map(([sphere, summary]) => (
    `| ${sphere} | ${summary.count} | ${summary.avg_incoming_drivers} | ${summary.under_three_incoming} | ${summary.under_three_rate_pct}% | ${summary.zero_outgoing} |`
  )),
  '',
  '## Relationship Evidence',
  '',
  `- Relationship levels: ${Object.entries(report.relationship_inventory.levels).map(([key, value]) => `${key}=${value}`).join(', ')}`,
  `- Evidence modes: ${Object.entries(report.relationship_inventory.evidence_modes).map(([key, value]) => `${key}=${value}`).join(', ')}`,
  `- Direct or indirect edges: ${trustedEdges.length} (${percent(trustedEdges.length, EDGES.length)}%)`,
  `- Cross-sphere edges: ${crossSphereEdges.length} (${percent(crossSphereEdges.length, EDGES.length)}%)`,
  `- Relationship-specific URL missing: ${edgeIntegrity.missing_relationship_source_urls}`,
  `- Missing confidence: ${edgeIntegrity.missing_confidence}`,
  `- Missing relationship type: ${edgeIntegrity.missing_relationship_type}`,
  '',
  '## Context and Measurement',
  '',
  `- Missing calibration metric: ${contentCompleteness.missing_calibration_metric}`,
  `- Defined API-ready metric contracts: ${contentCompleteness.defined_node_metric_contracts}`,
  `- Missing both calibration metric and metric contract: ${contentCompleteness.missing_measurement_contract}`,
  `- Missing human-impact profile: ${contentCompleteness.missing_human_impact}`,
  `- Missing planetary-impact profile: ${contentCompleteness.missing_planet_impact}`,
  `- Generic economic-context fallback: ${contentCompleteness.default_economic_context_fallback}`,
  `- Generated nodes with anchor-inherited evidence: ${contentCompleteness.generated_nodes_with_anchor_inherited_evidence}`,
  '',
  '## Highest-Priority Underconnected Anchors',
  '',
  '| Node | Sphere | Drivers | Effects | Driver spheres | Score |',
  '| --- | --- | ---: | ---: | ---: | ---: |',
  ...report.priority_underconnected_anchors.slice(0, 35).map(row => (
    `| ${row.name} | ${row.sphere} | ${row.incoming_drivers} | ${row.outgoing_effects} | ${row.unique_driver_spheres} | ${row.baseline_score ?? '-'} |`
  )),
  '',
  '## Existing Operational Sources Not Yet Active',
  '',
  '| Source | Mode | Best fit |',
  '| --- | --- | --- |',
  ...operationalOpenNotActive.map(source => (
    `| ${source.name} | ${source.ingestion_mode} | ${source.fit.join(', ')} |`
  )),
  '',
  '## Remediation Gates',
  '',
  '1. Do not add an edge only to satisfy the three-driver gate; require a relationship-specific source and bounded mechanism.',
  '2. Prioritize underconnected anchors before generated leaves, then rehabilitate generated nodes in evidence-family batches.',
  '3. Require each anchor to expose a metric contract before connecting a new API to scoring.',
  '4. Add structured geographic scope, time horizon, exposed populations/systems, moderators, and uncertainty to context.',
  '5. Keep inferred and extrapolated relationships discoverable as research candidates until source entailment is read back.',
  ''
];

await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(OUT_MD, `${md.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  json: OUT_JSON,
  markdown: OUT_MD,
  totals: report.totals,
  phenomenon_coverage: report.cohorts.phenomena_or_indicators,
  generated_coverage: report.cohorts.generated_phenomena,
  content_completeness: contentCompleteness,
  relationship_integrity: edgeIntegrity,
  attachment_coverage_pct: report.source_and_api_inventory.attachment_rule_coverage_rate_pct
}, null, 2));
