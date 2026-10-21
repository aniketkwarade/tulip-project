import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import {
  GEOMETRIC_METHOD_VERSION,
  evaluateEvidenceBoundGeometricCandidate,
  evaluateGeometricConsequenceAssessment,
} from '../src/tulip-consequence-scoring-v2.js';

// Diagnostic, not a real node: hold the source and causal story fixed while
// changing only ordinal judgments. Passing schema validation is not evidence
// that those judgments are uniquely supported by the source.
const scope = {
  endpointId: 'synthetic_service_hardship',
  affectedGroup: 'people_with_attributable_service_hardship',
  geography: 'synthetic_reference_area',
  assessmentWindow: 'synthetic_current_period',
};
const evidenceReferences = ['synthetic-source-1'];
const jointEvidence = {
  kind: 'structured_joint_scenario',
  explanation: 'The same synthetic account of service hardship is used in both assessments.',
  ...scope,
  evidenceReferences,
};
const axes = level => ({ severity: level, reach: level, persistence: level });
const estimate = level => ({
  status: 'assessed_harm',
  axes: axes(level),
  jointEvidence: structuredClone(jointEvidence),
});
const makeAssessment = centralLevel => ({
  nodeId: 'synthetic_future_node',
  nodeKind: 'issue',
  methodVersion: GEOMETRIC_METHOD_VERSION,
  applicableDomains: ['human'],
  domainApplicability: {
    ecosystem: {
      status: 'structurally_not_applicable',
      reason: 'This synthetic node is defined solely by a human service outcome.',
    },
  },
  components: {
    human: {
      harmBasis: {
        route: 'structured',
        endpoint: 'Attributable service hardship',
        metricRole: 'structured_consequence_estimate',
        ...scope,
        counterfactual: 'The same people, place and period without the disruption.',
        severityAggregation: 'The level describes the affected group.',
        endpointCoverage: 'One service outcome, counted once.',
        overlapCheck: 'No second pathway is added.',
        evidenceReferences,
        estimateRationale: 'The same synthetic source and rationale are used in both assessments.',
        axisEvidence: Object.fromEntries([
          ['severity', 'bounded_human_consequence_estimate'],
          ['reach', 'bounded_harmed_people_estimate'],
          ['persistence', 'bounded_recovery_estimate'],
        ].map(([axis, kind]) => [axis, {
          kind,
          explanation: 'The same synthetic evidence is cited in both assessments.',
          estimateRationale: 'Ordinal level remains a reviewer judgment in this fixture.',
          ...scope,
        }])),
      },
      lower: estimate(1),
      central: estimate(centralLevel),
      upper: estimate(4),
    },
  },
});

const low = makeAssessment(1);
const high = makeAssessment(4);
assert.deepEqual(low.components.human.harmBasis, high.components.human.harmBasis);
assert.deepEqual(low.components.human.central.jointEvidence, high.components.human.central.jointEvidence);
const lowResult = evaluateGeometricConsequenceAssessment(low);
const highResult = evaluateGeometricConsequenceAssessment(high);
const lowGate = evaluateEvidenceBoundGeometricCandidate(low);
const highGate = evaluateEvidenceBoundGeometricCandidate(high);
assert.equal(lowGate.status, 'needs_calibrated_route');
assert.equal(highGate.status, 'needs_calibrated_route');
assert.equal(lowGate.value, null);
assert.equal(highGate.value, null);
const twoValidDifferentScores = lowResult.status === 'experimental_candidate'
  && highResult.status === 'experimental_candidate'
  && lowResult.value !== highResult.value;

const result = {
  version: 'tulip_structured_identifiability_2026_09_27_v1',
  status: twoValidDifferentScores ? 'fails_structured_route_reproducibility' : 'ambiguity_not_demonstrated',
  gatePassed: !twoValidDifferentScores,
  controlledFields: 'Same node, source reference, outcome, affected group, place, period, counterfactual, axis-evidence prose, joint-scenario prose, lower bound and upper bound.',
  variedFields: 'Central severity, reach and persistence ordinal entries only.',
  evaluations: [
    { centralAxes: low.components.human.central.axes, ...lowResult },
    { centralAxes: high.components.human.central.axes, ...highResult },
  ],
  evidenceGate: {
    bothUnconstrainedJudgmentsRejected: true,
    low: { status: lowGate.status, value: lowGate.value, reasons: lowGate.reasons },
    high: { status: highGate.status, value: highGate.value, reasons: highGate.reasons },
  },
  finding: twoValidDifferentScores
    ? 'The experimental structured route accepts two different scores from identical recorded evidence. A reviewer can vary ordinal entries without a source-native quantity, frozen classification rule or adjudicated analogue constraining them. The method is not yet reproducible for future structured nodes.'
    : 'This particular ambiguity is no longer demonstrated. Other source-to-score cases still need independent tests.',
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/structured-identifiability.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ permissiveDiagnosticGatePassed: result.gatePassed,
  evidenceBoundGateRejectsBoth: result.evidenceGate.bothUnconstrainedJudgmentsRejected,
  results: result.evaluations.map(({ centralAxes, status, value }) => ({ centralAxes, status, value })) }, null, 2));
