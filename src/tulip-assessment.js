import registry from './tulip-assessment-registry.js';
export { registry as TULIP_ASSESSMENTS };
export { SCORE_METHOD_COPY } from './tulip-score-method.js';
export function getTulipAssessment(node) {
  if (!node?.id) return null;
  if (Object.hasOwn(registry.records, node.id)) return registry.records[node.id];
  const response = node.node_kind === 'response';
  return { nodeId: node.id, nodeKind: response ? 'response' : 'issue', version: registry.version,
    value: null, valueKind: null, status: response ? 'not_applicable' : 'assessment_required',
    label: response ? 'Response' : 'Not yet scored',
    explanation: response ? 'Response topics do not receive danger scores.' : `A current-impact assessment for ${node.name} has not been authored. Missing evidence does not mean low impact.`,
    components: { human: null, ecosystem: null }, uncertainty: null, evidenceReferences: [] };
}
