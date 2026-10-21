import { validateConsequenceAssessment } from './tulip-consequence-scoring.js';
import { REGISTERED_DIRECT_OUTCOME_OBSERVATIONS } from './tulip-source-observation-registry.js';

// Rejected as an aggregate-current-harm scoring rule: ordinal saturation can
// erase measured burden differences. Retained as a typed diagnostic comparator
// and does not alter published ratings.
export const GEOMETRIC_METHOD_VERSION = 'tulip_consequence_2026_09_27_v2_experimental';
export const GEOMETRIC_EVIDENCE_GATE_VERSION = 'tulip_consequence_evidence_gate_2026_09_27_v1';
const AXES = ['severity', 'reach', 'persistence'];
const DOMAINS = ['human', 'ecosystem'];
const JOINT_EVIDENCE_KINDS = new Set(['source_interval', 'modeled_joint_scenario', 'structured_joint_scenario', 'possible_zero', 'verified_zero']);
const OBSERVED_OUTCOME_KINDS = Object.freeze({
  human: new Set(['attributable_deaths', 'attributable_health_loss', 'realized_service_loss', 'realized_livelihood_loss', 'displacement']),
  ecosystem: new Set(['measured_condition_loss', 'modeled_condition_loss', 'measured_distribution_loss']),
});
const NINE_INDEX = Math.cbrt(0.75);
const round = value => Math.round((value + 1e-9) * 10) / 10;

export function geometricConsequenceIndex(axes) {
  if (!axes || AXES.some(axis => typeof axes[axis] !== 'number'
    || !Number.isFinite(axes[axis]) || axes[axis] < 0 || axes[axis] > 4)) return null;
  const hasZero = AXES.some(axis => axes[axis] === 0);
  if (hasZero && AXES.some(axis => axes[axis] > 0)) return null;
  if (hasZero) return 0;
  return Math.cbrt(axes.severity * axes.reach * axes.persistence / 64);
}

export function mapGeometricIndex(index) {
  if (typeof index !== 'number' || !Number.isFinite(index) || index < 0 || index > 1) return null;
  if (index <= 0.75) return 1 + 8 * index;
  if (index <= NINE_INDEX) return 7 + 2 * (index - 0.75) / (NINE_INDEX - 0.75);
  return 9 + (index - NINE_INDEX) / (1 - NINE_INDEX);
}

export function scoreGeometricAxes(axesByDomain) {
  if (!axesByDomain || !Object.keys(axesByDomain).length
    || Object.keys(axesByDomain).some(domain => !DOMAINS.includes(domain))) return null;
  const rawComponents = {};
  for (const [domain, axes] of Object.entries(axesByDomain)) {
    const index = geometricConsequenceIndex(axes);
    if (index === null) return null;
    rawComponents[domain] = mapGeometricIndex(index);
  }
  const rawValue = Object.values(rawComponents).reduce((sum, value) => sum + value, 0) / Object.keys(rawComponents).length;
  return { rawValue, value: round(rawValue), rawComponents,
    components: Object.fromEntries(Object.entries(rawComponents).map(([domain, value]) => [domain, round(value)])) };
}

// This checks a direct source's *scope*, not whether its scientific model is
// correct. A regional result cannot become a global observation by copying a
// global label into the assessment, and exposure is not a harmed cohort.
export function validateDirectSourceScope(domain, basis) {
  if (basis?.route !== 'direct') return [];
  const observations = basis.sourceObservations;
  if (!Array.isArray(observations) || !observations.length) return [`${domain}_direct_source_observation_missing`];
  const compatible = observations.filter(observation =>
    basis.evidenceReferences?.includes(observation.sourceId)
    && typeof observation.sourceUrl === 'string' && observation.sourceUrl.startsWith('https://')
    && observation.endpointId === basis.endpointId
    && observation.affectedGroup === basis.affectedGroup
    && observation.geography === basis.geography
    && observation.assessmentWindow === basis.assessmentWindow
    && OBSERVED_OUTCOME_KINDS[domain]?.has(observation.outcomeKind)
    && typeof observation.unit === 'string' && observation.unit.trim()
    && typeof observation.value === 'number' && Number.isFinite(observation.value)
    && observation.value >= 0
  );
  if (compatible.filter(observation => observation.sourceId === basis.primarySourceId).length !== 1) {
    return [`${domain}_direct_source_scope_or_outcome_mismatch`];
  }
  if (compatible.some(observation => (observation.lower !== undefined || observation.upper !== undefined)
    && (!(typeof observation.lower === 'number' && Number.isFinite(observation.lower))
      || !(typeof observation.upper === 'number' && Number.isFinite(observation.upper))
      || observation.lower < 0 || observation.lower > observation.value || observation.value > observation.upper))) {
    return [`${domain}_direct_source_interval_invalid`];
  }
  return [];
}

export function evaluateGeometricConsequenceAssessment(assessment) {
  const validated = validateConsequenceAssessment(assessment, GEOMETRIC_METHOD_VERSION);
  if (validated.status !== 'valid') return validated;
  // A set of ordered axis minima is not an uncertainty scenario. Require an
  // explicit, same-outcome joint case at each bound before calculating v2.
  const jointReasons = [];
  for (const domain of assessment.applicableDomains) {
    const component = assessment.components[domain];
    const basis = component.harmBasis;
    const directScopeReasons = validateDirectSourceScope(domain, basis);
    jointReasons.push(...directScopeReasons);
    if (!directScopeReasons.length && basis.route === 'direct' && domain === 'human') {
      const deathObservation = basis.sourceObservations.find(observation =>
        observation.sourceId === basis.primarySourceId
        && basis.evidenceReferences.includes(observation.sourceId)
        && observation.outcomeKind === 'attributable_deaths'
        && observation.endpointId === basis.endpointId
        && observation.affectedGroup === basis.affectedGroup
        && observation.geography === basis.geography
        && observation.assessmentWindow === basis.assessmentWindow);
      if (deathObservation) {
        // Death is the *complete* endpoint only for a mortality-specific node.
        // The source count can never validate a broader health-burden node that
        // also includes nonfatal illness, services or ecosystem consequences.
        if (basis.scoreEndpointScope !== 'mortality_only_complete') {
          jointReasons.push('human_direct_mortality_endpoint_scope_missing');
        }
        for (const [position, observedCount] of [['lower', deathObservation.lower],
          ['central', deathObservation.value], ['upper', deathObservation.upper]]) {
          const estimate = component[position];
          const sourceBoundCount = typeof observedCount === 'number' && Number.isFinite(observedCount)
            && observedCount >= 0 && observedCount <= Number.MAX_SAFE_INTEGER
            && estimate?.reachBasis === 'people_with_attributable_harm'
            && Number.isSafeInteger(estimate?.harmedPeople)
            && estimate.harmedPeople === Math.round(observedCount);
          const zeroLowerBound = position === 'lower' && observedCount === 0
            && estimate?.status === 'possible_zero'
            && estimate?.harmedPeople === 0
            && AXES.every(axis => estimate?.axes?.[axis] === 0)
            && estimate?.jointEvidence?.kind === 'possible_zero';
          const positiveMortality = observedCount > 0
            && estimate?.status === 'assessed_harm'
            && estimate?.jointEvidence?.kind === 'source_interval'
            && estimate?.axes?.severity === 4
            && estimate?.axes?.persistence === 4
            && estimate?.irreversible === true
            && estimate?.durationBasis === 'attributable_consequence_or_recovery';
          if (!sourceBoundCount || !(zeroLowerBound || positiveMortality)) {
            jointReasons.push(`${domain}_${position}_direct_death_interval_not_bound`);
          }
        }
      }
    }
    for (const position of ['lower', 'central', 'upper']) {
      const estimate = component[position];
      const joint = estimate.jointEvidence;
      if (!joint || !JOINT_EVIDENCE_KINDS.has(joint.kind)
        || typeof joint.explanation !== 'string' || !joint.explanation.trim()
        || joint.endpointId !== basis.endpointId || joint.affectedGroup !== basis.affectedGroup
        || joint.geography !== basis.geography || joint.assessmentWindow !== basis.assessmentWindow
        || !Array.isArray(joint.evidenceReferences) || !joint.evidenceReferences.length
        || joint.evidenceReferences.some(ref => !basis.evidenceReferences.includes(ref))) {
        jointReasons.push(`${domain}_${position}_joint_evidence_missing_or_incompatible`);
      }
      if (estimate.status === 'possible_zero' && joint?.kind !== 'possible_zero') {
        jointReasons.push(`${domain}_${position}_possible_zero_scenario_missing`);
      }
      if (estimate.status === 'verified_zero' && joint?.kind !== 'verified_zero') {
        jointReasons.push(`${domain}_${position}_verified_zero_scenario_missing`);
      }
      if (estimate.status === 'assessed_harm' && ['possible_zero', 'verified_zero'].includes(joint?.kind)) {
        jointReasons.push(`${domain}_${position}_harm_scenario_kind_mismatch`);
      }
    }
  }
  if (jointReasons.length) return { status: 'needs_consequence_assessment', value: null, reasons: jointReasons };
  const { estimates } = validated;
  const values = Object.fromEntries(['lower', 'central', 'upper'].map(position => [position,
    scoreGeometricAxes(Object.fromEntries(assessment.applicableDomains.map(domain => [domain, estimates[domain][position]])))
  ]));
  if (Object.values(values).some(value => value === null) || values.lower.rawValue > values.central.rawValue
    || values.central.rawValue > values.upper.rawValue) {
    return { status: 'needs_consequence_assessment', value: null, reasons: ['score_bounds_invalid'] };
  }
  return { status: 'experimental_candidate', methodVersion: GEOMETRIC_METHOD_VERSION,
    constructStatus: 'rejected_for_aggregate_current_harm', publicReady: false,
    value: values.central.value,
    uncertainty: { lower: values.lower.value, upper: values.upper.value, kind: 'structured_bounds_not_probability' },
    components: values.central.components,
    domainWeights: Object.fromEntries(DOMAINS.map(domain => [domain, assessment.applicableDomains.includes(domain) ? 1 / assessment.applicableDomains.length : 0])),
    reasons: [] };
}

// v2 remains an intentionally permissive mathematical diagnostic. This gate
// decides whether its input route has an executable evidence-to-axis rule.
// A cited rationale or analogue ID cannot make a numerical node assessment.
export function evaluateEvidenceBoundGeometricCandidate(assessment) {
  const diagnostic = evaluateGeometricConsequenceAssessment(assessment);
  if (diagnostic.status !== 'experimental_candidate') {
    return { ...diagnostic, publicReady: false, gateVersion: GEOMETRIC_EVIDENCE_GATE_VERSION };
  }
  const reasons = [];
  const registeredFields = ['sourceId', 'sourceUrl', 'endpointId', 'affectedGroup',
    'geography', 'assessmentWindow', 'outcomeKind', 'unit', 'value', 'lower', 'upper'];
  let registeredSource = null;
  for (const domain of assessment.applicableDomains) {
    const basis = assessment.components[domain].harmBasis;
    if (basis.route === 'structured') {
      reasons.push(`${domain}_structured_calibration_rule_missing`);
    } else if (basis.route === 'family') {
      reasons.push(`${domain}_family_transfer_rule_missing`);
    } else if (basis.route === 'converted') {
      reasons.push(`${domain}_converted_calculation_missing`);
    } else if (basis.route === 'verified_zero') {
      reasons.push(`${domain}_verified_zero_source_rule_missing`);
    } else if (basis.route === 'direct') {
      const observation = basis.sourceObservations?.[0];
      const registered = Object.hasOwn(REGISTERED_DIRECT_OUTCOME_OBSERVATIONS, basis.primarySourceId)
        ? REGISTERED_DIRECT_OUTCOME_OBSERVATIONS[basis.primarySourceId] : null;
      if (domain !== 'human' || observation?.outcomeKind !== 'attributable_deaths'
        || basis.scoreEndpointScope !== 'mortality_only_complete') {
        reasons.push(`${domain}_direct_endpoint_rule_missing`);
      } else if (!registered || basis.sourceObservations.length !== 1
        || registeredFields.some(field => observation?.[field] !== registered[field])) {
        reasons.push(`${domain}_direct_source_not_registered_exact_match`);
      } else {
        registeredSource = registered;
      }
    }
  }
  if (reasons.length) return { status: 'needs_calibrated_route', value: null,
    publicReady: false, gateVersion: GEOMETRIC_EVIDENCE_GATE_VERSION, reasons };
  return {
    status: 'source_bound_endpoint_candidate', value: null, publicReady: false,
    constructStatus: 'rejected_for_aggregate_current_harm',
    gateVersion: GEOMETRIC_EVIDENCE_GATE_VERSION,
    endpointCandidate: { value: diagnostic.value, uncertainty: diagnostic.uncertainty,
      components: diagnostic.components, methodVersion: diagnostic.methodVersion },
    source: { id: registeredSource.sourceId, version: registeredSource.sourceVersion,
      artifactSha256: registeredSource.sourceArtifactSha256,
      locator: registeredSource.sourceLocator },
    limitations: 'Source-bound mortality is only one endpoint. Its ordinal magnitude map is uncalibrated, and node coverage and excluded domains still require review.',
    reasons: [],
  };
}
