export const RELATIONSHIP_SEMANTIC_ROLES = Object.freeze([
  'increases',
  'enables',
  'reduces',
  'constrains',
  'context'
]);

export const CONTEXT_ONLY_EFFECT_DIRECTION = 'context_only_no_causal_direction';

const VALID_ROLE_SET = new Set(RELATIONSHIP_SEMANTIC_ROLES);
const PLURAL_RELATIONSHIP_SUBJECT_IDS = new Set([
  'weatherization_retrofits',
  'building_performance_standards',
  'active_mobility',
  'urban_heat_action_plans'
]);
const PLURAL_VERB_FORMS = Object.freeze({
  accelerates: 'accelerate',
  amplifies: 'amplify',
  benefits: 'benefit',
  broadens: 'broaden',
  closes: 'close',
  coordinates: 'coordinate',
  creates: 'create',
  cuts: 'cut',
  delivers: 'deliver',
  enables: 'enable',
  expands: 'expand',
  improves: 'improve',
  increases: 'increase',
  makes: 'make',
  reduces: 'reduce',
  rewards: 'reward',
  supports: 'support'
});
const CONTEXT_VERB_PATTERN = /\b(?:provides|shares) evidence context (?:for|with)\b|\bshown near\b/i;
const CONSTRAINT_PATTERN = /\bconstraint\b|\bconstrain/i;
const ENABLING_TYPE_PATTERN = /(?:^|_)(?:enabl|complement|implementation|policy_enabler|transition_pathway)/i;
const ENABLING_VERB_PATTERN = /\b(?:enable|support|strengthen|amplif|broaden|coordinate|integrate|accelerate|reward|deliver|provide|finance|sustain|power|make|create room|create demand)\b/i;

export function isRelationshipSemanticRole(value) {
  return VALID_ROLE_SET.has(value);
}

export function usesPluralRelationshipSubject(nodeOrId) {
  const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId?.id;
  return PLURAL_RELATIONSHIP_SUBJECT_IDS.has(id);
}

export function getRelationshipQuestionAuxiliary(nodeOrId) {
  return usesPluralRelationshipSubject(nodeOrId) ? 'do' : 'does';
}

export function getRelationshipSubjectPronoun(nodeOrId) {
  return usesPluralRelationshipSubject(nodeOrId) ? 'they' : 'it';
}

export function agreeRelationshipVerbPhrase(nodeOrId, verb = '') {
  if (!usesPluralRelationshipSubject(nodeOrId)) return verb;
  return String(verb).replace(/^([A-Za-z]+)/, word => PLURAL_VERB_FORMS[word.toLowerCase()] || word);
}

export function inferRelationshipSemanticRole(edge) {
  if (isRelationshipSemanticRole(edge?.semantic_role)) return edge.semantic_role;

  const verb = String(edge?.verb || '').trim();
  const relationshipType = String(edge?.evidence?.relationship_type || edge?.relationship_type || '').trim();

  if (CONTEXT_VERB_PATTERN.test(verb)) return 'context';
  if (!Number.isFinite(edge?.influence) || edge.influence === 0) return null;
  if (edge.influence < 0) {
    return CONSTRAINT_PATTERN.test(`${relationshipType} ${verb}`) ? 'constrains' : 'reduces';
  }
  if (
    ENABLING_TYPE_PATTERN.test(relationshipType)
    || ENABLING_VERB_PATTERN.test(verb)
  ) {
    return 'enables';
  }
  return 'increases';
}

export function getRelationshipSemanticLabel(edge) {
  const role = inferRelationshipSemanticRole(edge);
  if (!role) return 'Unclassified';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function getRelationshipPolarity(edge) {
  const role = inferRelationshipSemanticRole(edge);
  if (role === 'context') return 'context';
  if (role === 'reduces' || role === 'constrains') return 'negative';
  if (role === 'increases' || role === 'enables') return 'positive';
  return 'unclassified';
}

export function isContextualRelationship(edge) {
  return inferRelationshipSemanticRole(edge) === 'context';
}

export function isCausalRelationship(edge) {
  return Boolean(inferRelationshipSemanticRole(edge)) && !isContextualRelationship(edge);
}

function expectedEffectDirection(role) {
  if (role === 'context') return CONTEXT_ONLY_EFFECT_DIRECTION;
  if (role === 'reduces' || role === 'constrains') return 'decreases_or_constrains_target';
  if (role === 'increases' || role === 'enables') return 'increases_or_enables_target';
  return null;
}

function fallbackRelationshipType(role) {
  if (role === 'context') return 'context_only';
  return `bounded_${role || 'unclassified'}_influence`;
}

function attachEvidenceSemantics(evidence = {}, role) {
  const quantitativeEvidence = evidence.quantitative_evidence || {};
  const relationshipQuantification = quantitativeEvidence.relationship_quantification;
  const estimand = relationshipQuantification?.estimand;
  const direction = expectedEffectDirection(role);
  const nextRelationshipQuantification = relationshipQuantification
    ? {
        ...relationshipQuantification,
        ...(estimand ? { estimand: { ...estimand, direction } } : {})
      }
    : relationshipQuantification;

  return {
    ...evidence,
    relationship_type: evidence.relationship_type || fallbackRelationshipType(role),
    relationship_type_origin: evidence.relationship_type ? 'authored' : 'semantic_fallback',
    quantitative_evidence: {
      ...quantitativeEvidence,
      effect_direction: direction,
      ...(nextRelationshipQuantification
        ? { relationship_quantification: nextRelationshipQuantification }
        : {})
    }
  };
}

export function attachRelationshipSemantics(edges) {
  return edges.map(edge => {
    const semanticRole = inferRelationshipSemanticRole(edge);
    return {
      ...edge,
      semantic_role: semanticRole,
      display_weight: Number.isFinite(edge.influence) ? Math.abs(edge.influence) : null,
      evidence: attachEvidenceSemantics(edge.evidence, semanticRole)
    };
  });
}
