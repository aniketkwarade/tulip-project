import { getTulipAssessment } from './tulip-assessment.js';
import { metricizeDisplayValue } from './metric-display.js';
import { getNodePhoto } from './node-photos.js';

function pickDefined(source, keys) {
  if (!source) return undefined;
  return Object.fromEntries(
    keys
      .filter(key => source[key] !== undefined)
      .map(key => [key, source[key]])
  );
}

export function projectRuntimeNode(node) {
  return metricizeDisplayValue({
    ...pickDefined(node, [
      'id',
      'name',
      'vector',
      'baseValue',
      'value',
      'sphere',
      'description',
      'readerMeaning',
      'adjectives',
      'context',
      'score',
      'impactScore',
      'discovery',
      'discoveryGuide',
      'node_kind',
      'source_status'
    ]),
    score: { baseline: getTulipAssessment(node)?.value ?? null, band: null },
    tulipScore: getTulipAssessment(node)?.value ?? null,
    impactScore: Number.isFinite(getTulipAssessment(node)?.value) ? getTulipAssessment(node).value * 10 : null,
    calibration: node.calibration
      ? pickDefined(node.calibration, ['role', 'source_status'])
      : undefined,
    authenticity: node.authenticity
      ? pickDefined(node.authenticity, ['status'])
      : undefined,
    graph_contract: node.graph_contract
      ? pickDefined(node.graph_contract, ['metric_contract_status', 'visibility'])
      : undefined,
    semanticAliases: node.semanticAliases?.map(alias => pickDefined(alias, ['id', 'name'])),
    metricAliases: node.metricAliases?.map(alias => pickDefined(alias, ['name', 'metric_name'])),
    runtimeHints: {
      hasHumanImpact: Boolean(node.humanImpact?.primaryPathways?.length),
      hasEconomicContext: Boolean(node.economicContext),
      hasMetricContract: Boolean(node.metric_contract)
    }
  });
}

export function projectRuntimeNodeDetail(node) {
  const detail = metricizeDisplayValue({
    id: node.id,
    humanImpact: node.humanImpact,
    planetImpact: node.planetImpact,
    economicContext: node.economicContext
      ? pickDefined(node.economicContext, [
          'hiddenCost',
          'whoPays',
          'physicalLimit',
          'defaultDriver',
          'systemLevers'
        ])
      : undefined,
    calibration: node.calibration
      ? {
          ...pickDefined(node.calibration, [
            'role',
            'reviewed_at',
            'source_status',
            'source_urls'
          ]),
          metric: node.calibration.metric
            ? pickDefined(node.calibration.metric, [
                'current_value',
                'unit',
                'metric_name',
                'observed_at',
                'share_of_global_electricity'
              ])
            : undefined
        }
      : undefined,
    metric_contract: node.metric_contract
      ? pickDefined(node.metric_contract, [
          'metric_id',
          'metric_name',
          'unit',
          'geography',
          'cadence',
          'observation_time_field',
          'source_id',
          'transformation',
          'uncertainty',
          'threshold_provenance',
          'failure_behavior',
          'reviewed_at'
        ])
      : undefined,
    metricAliases: node.metricAliases,
    readerMeaning: node.readerMeaning,
    readerCopy: node.readerCopy,
    responseProfile: node.responseProfile,
    source_urls: node.source_urls
  });
  // Attribution is verbatim publisher metadata, not measurement copy.
  return { ...detail, photo: getNodePhoto(node.id) };
}

export function projectRuntimeEdge(edge) {
  const evidence = edge.evidence || {};

  return metricizeDisplayValue({
    ...pickDefined(edge, [
      'source',
      'target',
      'verb',
      'adverb',
      'influence',
      'topology_rule',
      'confidence',
      'semantic_role',
      'display_weight',
      'relationship_type'
    ]),
    evidence: {
      ...pickDefined(evidence, [
        'relationship_level',
        'relationship_type',
        'confidence'
      ])
    }
  });
}

export function buildRuntimeGraphSnapshot({
  nodes,
  edges,
  publishedNodes,
  publishedEdges,
  discoveryTrails
}) {
  return {
    nodes: nodes.map(projectRuntimeNode),
    edges: edges.map(projectRuntimeEdge),
    publishedNodeIds: publishedNodes.map(node => node.id),
    publishedEdgeKeys: publishedEdges.map(edge => `${edge.source}->${edge.target}`),
    discoveryTrails: metricizeDisplayValue(discoveryTrails)
  };
}

export function buildRuntimeNodeDetails(nodes) {
  return nodes.map(projectRuntimeNodeDetail);
}
