import release from './tulip-score-release.json' with { type: 'json' };
import legacyMethod from './tulip-legacy-score-method.json' with { type: 'json' };

// Authored index choices, not universal scientific harm units.
export const CURRENT_SCORE_METHOD_COPY = Object.freeze({
  title: 'How the TULIP Score works',
  summary: 'TULIP Score gives a one-decimal view of estimated current impact on a 1–10 scale. This release uses labelled internal estimates at the 28 September 2026 cut-off. Older source evidence informs some estimates; this is not a measured 2026 global total or a ten-year forecast.',
  components: 'People and nature each receive 50% weight in every issue score. People covers attributable health and essential-function loss. Nature covers affected habitat area and its present condition deficit. A zero component needs an explicit scoped absence estimate; missing evidence is never silently treated as zero or given to the other component.',
  formula: 'TULIP maps each consequence amount separately against fixed benchmarks, using a logarithmic curve between them, then averages the two scores and rounds once. Benchmarks, health/function equivalence and weights are TULIP choices. They do not change when unrelated topics are added. A documented rare, irreversible ecological loss can add up to 1 point to nature before averaging, at most 0.5 overall, with a ceiling of 10.',
  missing: 'Every published issue in this release has an Internal estimate. Its harmed-population, loss-per-person, affected-area and condition assumptions are documented separately from source measurements. These are provisional judgments, not independently calibrated facts. New issues need their own reviewed assessment before publication.',
  evidence: 'Historical records and WMO standard normals provide context. Unusualness, exposure, citations and graph connections are not harm amounts. The human estimate represents annual-equivalent health/function loss; nature represents a present condition stock. Their comparison is an explicit TULIP convention. Source years and transfer assumptions remain in the assessment record.',
  limits: 'An aggregate score is not the worst local impact or an event probability. Scores for overlapping pathways must not be added. This release has no calibrated confidence interval. Sensitivity tests are hypothetical changes to assumptions, not uncertainty bounds. Response topics receive no danger score. Future scenario outlooks are separate from the current rating.',
});
export const SCORE_METHOD_COPY = release.active === 'legacy_archive' ? Object.freeze(legacyMethod) : CURRENT_SCORE_METHOD_COPY;

const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const policyDefinition = p => ({version:p.version, weights:p.weights, horizon:p.horizon, scenario:p.scenario, geography:p.geography, comparisonGroup:p.comparisonGroup, bands:p.bands});
export const calibrationDefinition = c => { const {review, ...definition} = c; return definition; };
export const assessmentDefinition = calibrationDefinition;
const reviewed = (review, definition) => same(review?.definition, definition) && review?.status === 'approved'
  && ['domain', 'statistical'].every(role => review.reviews?.some(r => r.role === role
    && r.independent === true && r.reviewerType === 'external_expert'
    && typeof r.reviewer === 'string' && r.reviewer.trim()
    && /^https:\/\//.test(r.evidenceUrl || '')));

export function normalizeHarm(value, anchors) {
  if (!Number.isFinite(value) || !Array.isArray(anchors) || anchors.length < 2
    || anchors.some((a, i) => !Array.isArray(a) || a.length !== 2 || a.some(v => !Number.isFinite(v))
      || a[1] < 0 || a[1] > 1 || (i > 0 && (a[0] <= anchors[i - 1][0] || a[1] < anchors[i - 1][1])))
    || anchors[0][1] !== 0 || anchors.at(-1)[1] !== 1
    || value < anchors[0][0] || value > anchors.at(-1)[0]) return null;
  if (value === anchors[0][0]) return 0;
  const i = anchors.findIndex(a => a[0] >= value);
  const [x0, y0] = anchors[i - 1], [x1, y1] = anchors[i];
  return y0 + (value - x0) / (x1 - x0) * (y1 - y0);
}

export function evaluateHarmScore(node, candidate, policy, sourceDigest) {
  const response = node.node_kind === 'response';
  const result = {
    nodeId: node.id, nodeKind: response ? 'response' : 'issue', version: policy.version,
    value: null, band: null, status: response ? 'not_applicable' : 'not_assessed',
    label: response ? 'Response' : 'Not yet scored',
    horizon: policy.horizon, scenario: policy.scenario, geography: policy.geography,
    comparisonGroup: policy.comparisonGroup, components: { human: null, ecosystem: null },
    uncertainty: null, reasons: [], evidenceReferences: [],
    explanation: response ? 'This topic describes a response. Its benefits and tradeoffs need to be assessed against what would happen without it.'
      : `A 2027–2036 rating for ${node.name} needs supported estimates of harm to both people and nature, plus reviewed scales for comparing them. Missing evidence does not mean low harm.`,
  };
  if (response) return result;
  const reasons = result.reasons;
  if (!reviewed(policy.calibrationReview, policyDefinition(policy))) reasons.push('calibration_pending');
  if (!candidate) {
    reasons.push('human_projection_missing', 'ecosystem_projection_missing', 'impact_models_missing');
    result.status = 'calibration_pending';
    return result;
  }
  if (!reviewed(candidate.review, assessmentDefinition(candidate))) reasons.push('assessment_review_pending');
  if (candidate.nodeId !== node.id || candidate.policyVersion !== policy.version) reasons.push('identity_mismatch');
  if (typeof sourceDigest !== 'string' || !sourceDigest || candidate.sourceDigest !== sourceDigest) reasons.push('source_changed');
  if (!Array.isArray(candidate.inputs) || !candidate.inputs.length || candidate.inputs.some(i => !i.path || !/^[a-f0-9]{64}$/.test(i.sha256 || ''))) reasons.push('projection_inputs_missing');
  for (const key of ['horizon', 'scenario', 'geography', 'comparisonGroup']) {
    if (!same(candidate[key], policy[key])) reasons.push(`${key}_incompatible`);
  }
  const lossIds = [];
  for (const dimension of ['human', 'ecosystem']) {
    const c = candidate.components?.[dimension];
    const calibration = policy.calibrations?.[c?.calibrationId];
    if (!c) { reasons.push(`${dimension}_projection_missing`); continue; }
    if (!calibration || calibration.dimension !== dimension || calibration.policyVersion !== policy.version
      || !reviewed(calibration.review, calibrationDefinition(calibration))) { reasons.push(`${dimension}_calibration_pending`); continue; }
    if (!calibration.rationale || !Array.isArray(calibration.evidenceReferences) || !calibration.evidenceReferences.length
      || calibration.evidenceReferences.some(s => !s.id || !s.label || !/^https:\/\//.test(s.url || ''))) reasons.push(`${dimension}_calibration_evidence_missing`);
    for (const key of ['horizon', 'scenario', 'geography', 'comparisonGroup']) {
      if (!same(c.context?.[key], candidate[key])) reasons.push(`${dimension}_${key}_incompatible`);
    }
    if (c.unit !== calibration.unit) reasons.push(`${dimension}_unit_mismatch`);
    if (!c.modelId || !calibration.modelIds?.includes(c.modelId)) reasons.push(`${dimension}_model_ineligible`);
    if (!c.counterfactual || !c.attribution || !c.aggregation || !c.overlapReview
      || !Array.isArray(c.sourceIds) || !c.sourceIds.length
      || !Array.isArray(c.lossIds) || !c.lossIds.length) reasons.push(`${dimension}_impact_contract_incomplete`);
    lossIds.push(...(c.lossIds || []));
    const value = normalizeHarm(c.estimate, calibration.anchors);
    const lower = normalizeHarm(c.uncertainty?.lower, calibration.anchors);
    const upper = normalizeHarm(c.uncertainty?.upper, calibration.anchors);
    if (value === null || lower === null || upper === null || lower > value || upper < value
      || !c.uncertainty?.label) reasons.push(`${dimension}_uncertainty_or_scale_invalid`);
    result.components[dimension] = { value, lower, upper, unit: c.unit, estimate: c.estimate,
      modelId: c.modelId, calibrationId: c.calibrationId, sourceIds: c.sourceIds || [], uncertaintyLabel: c.uncertainty?.label };
  }
  if (new Set(lossIds).size !== lossIds.length) reasons.push('duplicate_consequences');
  const sources = candidate.evidenceReferences || [];
  if (!sources.length || sources.some(s => !s.id || !s.label || !/^https:\/\//.test(s.url || ''))
    || new Set(sources.map(s => s.id)).size !== sources.length) reasons.push('invalid_evidence_references');
  const ids = new Set(sources.map(s => s.id));
  for (const c of Object.values(candidate.components || {})) {
    if ((c.sourceIds || []).some(id => !ids.has(id))) reasons.push('missing_evidence_reference');
  }
  result.evidenceReferences = sources;
  if (policy.weights.human !== 0.5 || policy.weights.ecosystem !== 0.5) reasons.push('policy_weights_changed');
  if (reasons.length) { result.status = reasons.includes('source_changed') ? 'needs_review' : 'not_assessed'; return result; }
  const { human, ecosystem } = result.components;
  const combine = key => 1 + 9 * (0.5 * human[key] + 0.5 * ecosystem[key]);
  result.value = Math.round(combine('value') * 10) / 10;
  // Bounds, not invented probabilities or an independence-based confidence interval.
  result.uncertainty = { lower: combine('lower'), upper: combine('upper'), kind: 'propagated_bounds' };
  result.band = policy.bands.find(b => result.value >= b.min && result.value <= b.max)?.label ?? null;
  result.status = 'assessed'; result.label = 'TULIP Score';
  result.explanation = `Projected harm from ${policy.horizon.start} to ${policy.horizon.end} under ${policy.scenario}, with equal weight given to people and nature. ${SCORE_METHOD_COPY.formula}`;
  return result;
}

export function scoreSensitivity(record) {
  if (record.status !== 'assessed') return { status: 'not_evaluable', reason: 'Both calibrated harm components are required; no ranking or range is invented.' };
  return { status: 'assessed', weightCases: [0.3, 0.5, 0.7].map(humanWeight => ({ humanWeight,
    value: 1 + 9 * (humanWeight * record.components.human.value + (1 - humanWeight) * record.components.ecosystem.value) })),
    uncertainty: record.uncertainty };
}
