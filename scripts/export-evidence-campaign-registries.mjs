import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES } from '../src/data.js';
import { ANALYTICAL_LABEL_REVIEW } from '../src/analytical-label-review.js';
import { REGIONAL_HUB_PROFILES } from '../src/regional-hub-profiles.js';

const generatedAt = new Date().toISOString();
const degree = new Map(NODES.map(node => [node.id, 0]));
for (const edge of EDGES) {
  degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
  degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
}
const top25 = [...degree.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 25);

const terminology = {
  version: 'analytical_label_review_v1',
  generated_at: generatedAt,
  summary: {
    reviewed: Object.keys(ANALYTICAL_LABEL_REVIEW).length,
    canonical: Object.values(ANALYTICAL_LABEL_REVIEW).filter(item => item.disposition.startsWith('canonical_term')).length,
    operational: Object.values(ANALYTICAL_LABEL_REVIEW).filter(item => item.disposition === 'normalized_operational_term').length,
    retained_analytical: Object.values(ANALYTICAL_LABEL_REVIEW).filter(item => item.disposition === 'retained_analytical_concept').length
  },
  decisions: Object.entries(ANALYTICAL_LABEL_REVIEW).map(([nodeId, review]) => ({ node_id: nodeId, ...review }))
};

const regional = {
  version: 'regional_hub_profiles_v1',
  generated_at: generatedAt,
  policy: 'Profiles state broad applicability, weakening conditions, and evidence gaps. Individual edge dossiers remain authoritative for relationship-specific scope.',
  summary: { profiles: Object.keys(REGIONAL_HUB_PROFILES).length, top_hubs: top25.length },
  top_hubs: top25.map(([nodeId, nodeDegree], index) => ({
    rank: index + 1,
    node_id: nodeId,
    node_name: NODES.find(node => node.id === nodeId)?.name || nodeId,
    degree: nodeDegree,
    profile: REGIONAL_HUB_PROFILES[nodeId] || null
  }))
};

const evidence = {
  version: 'relationship_evidence_governance_v1',
  generated_at: generatedAt,
  required_quantitative_fields: ['effect_direction', 'effect_magnitude', 'uncertainty', 'evidence_design', 'population', 'sample_period', 'replication'],
  summary: {
    relationships: EDGES.length,
    confidence: EDGES.reduce((counts, edge) => {
      counts[edge.evidence?.confidence || 'missing'] = (counts[edge.evidence?.confidence || 'missing'] || 0) + 1;
      return counts;
    }, {}),
    structured_readbacks: EDGES.filter(edge => edge.evidence?.source_readback?.status === 'confirmed_bounded').length,
    quantitative_evidence_complete: EDGES.filter(edge => edge.evidence?.quantitative_evidence).length
  },
  relationships: EDGES.map(edge => ({
    edge_key: `${edge.source}->${edge.target}`,
    semantic_role: edge.semantic_role,
    relationship_type: edge.evidence?.relationship_type,
    confidence: edge.evidence?.confidence,
    confidence_basis: edge.evidence?.confidence_basis,
    source_readback: edge.evidence?.source_readback || null,
    quantitative_evidence: edge.evidence?.quantitative_evidence
  }))
};

const quantification = {
  version: 'relationship_quantification_registry_v1',
  generated_at: generatedAt,
  policy: 'Every relationship receives a numeric evidence-support assessment and an explicit operational estimand. Scientific effect estimates remain null unless a relationship-specific source reports an estimate, unit, uncertainty, geography, period, and design. Graph influence is never an effect size.',
  summary: {
    relationships: EDGES.length,
    evidence_support_scores: EDGES.filter(edge => Number.isFinite(edge.evidence?.quantitative_evidence?.relationship_quantification?.evidence_support_quantification?.score)).length,
    estimands_defined: EDGES.filter(edge => edge.evidence?.quantitative_evidence?.relationship_quantification?.estimand).length,
    estimands_measurement_ready: EDGES.filter(edge => [
      'estimand_defined_measurement_pending',
      'source_reported_effect_estimate'
    ].includes(edge.evidence?.quantitative_evidence?.relationship_quantification?.status)).length,
    estimands_missing_endpoint_metrics: EDGES.filter(edge => edge.evidence?.quantitative_evidence?.relationship_quantification?.status === 'estimand_blocked_by_missing_node_metric').length,
    source_reported_effect_estimates: EDGES.filter(edge => edge.evidence?.quantitative_evidence?.relationship_quantification?.scientific_effect_estimate?.status === 'source_reported_estimate').length,
    false_precision_violations: EDGES.filter(edge => edge.evidence?.quantitative_evidence?.effect_magnitude?.estimate === edge.influence).length
  },
  relationships: EDGES.map(edge => ({
    edge_key: `${edge.source}->${edge.target}`,
    relationship_level: edge.evidence?.relationship_level,
    confidence: edge.confidence,
    quantification: edge.evidence?.quantitative_evidence?.relationship_quantification
  }))
};

const confidenceReassessments = EDGES
  .filter(edge => edge.evidence?.confidence_reassessment)
  .map(edge => ({
    edge_key: `${edge.source}->${edge.target}`,
    decision: edge.confidence,
    confidence_basis: edge.evidence.confidence_basis,
    rationale: edge.evidence.confidence_rationale,
    reassessment: edge.evidence.confidence_reassessment
  }));
const confidenceRegistry = {
  version: 'conservative_confidence_reassessment_v1',
  generated_at: generatedAt,
  policy: 'Former conservative defaults are reassessed individually from relationship level, relationship-specific source count and domain independence, evidence design, mechanism, bounded scope, moderators, counterevidence, and source readback. Missing bounded dimensions cap confidence rather than being silently ignored.',
  summary: {
    reassessed: confidenceReassessments.length,
    pending_conservative_defaults: EDGES.filter(edge => edge.evidence?.confidence_basis === 'conservative_default_pending_reassessment').length,
    decisions: confidenceReassessments.reduce((counts, item) => {
      counts[item.decision] = (counts[item.decision] || 0) + 1;
      return counts;
    }, {})
  },
  relationships: confidenceReassessments
};

await Promise.all([
  fs.writeFile(path.resolve('public/analytical-label-review-registry.json'), `${JSON.stringify(terminology, null, 2)}\n`, 'utf8'),
  fs.writeFile(path.resolve('public/regional-hub-profile-registry.json'), `${JSON.stringify(regional, null, 2)}\n`, 'utf8'),
  fs.writeFile(path.resolve('public/relationship-evidence-registry.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8'),
  fs.writeFile(path.resolve('public/relationship-quantification-registry.json'), `${JSON.stringify(quantification, null, 2)}\n`, 'utf8'),
  fs.writeFile(path.resolve('public/conservative-confidence-reassessment-registry.json'), `${JSON.stringify(confidenceRegistry, null, 2)}\n`, 'utf8')
]);

console.log(JSON.stringify({ terminology: terminology.summary, regional: regional.summary, evidence: evidence.summary, quantification: quantification.summary, confidence_reassessment: confidenceRegistry.summary }, null, 2));
