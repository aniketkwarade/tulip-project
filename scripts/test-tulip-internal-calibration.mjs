import assert from 'node:assert/strict';
import { evaluateInternalTulipCandidate, INTERNAL_CALIBRATION_VERSION } from '../src/tulip-internal-calibration.js';

const node = { id: 'example', node_kind: 'issue' };
const policy = { version: 'policy-v1', scenario: 'SSP2-4.5', horizon: { start: 2027, end: 2036 }, geography: 'global', sourceDigest: 'source-v1' };
const axes = value => ({ severity: value, reach: value, persistence: value });
const component = (value, confidence = 'A') => ({
  lower: axes(value), central: axes(value), upper: axes(value), confidence,
  evidenceReferences: ['source-1'], attribution: 'Declared counterfactual',
  aggregation: 'No accumulated flow is summed twice', overlapReview: 'No duplicate terminal consequences',
  systemEffectsNote: 'Quantified cascades are represented through terminal consequences; unquantified cascades do not change the score.',
});
const candidate = (human, ecosystem, applicableDomains = ['human', 'ecosystem']) => ({
  nodeId: node.id, policyVersion: policy.version, calibrationVersion: INTERNAL_CALIBRATION_VERSION,
  geography: policy.geography,
  currentWindow: {
    start: 2021, end: 2025, coverageStatus: 'complete', summaryMethod: 'annualized_flow',
    isLatestAvailable: true, recencyCheckedOn: '2026-09-22',
    recencyRationale: 'This is the latest complete comparable series found by the assessment cut-off.',
    normalization: 'Annual consequences are averaged so window length does not change the level.',
  },
  sourceDigest: policy.sourceDigest,
  history: {
    mode: 'direct_record', recordStartYear: 1976, recordEndYear: 2025, completeCalendarPeriods: true,
    metric: 'Example consequence metric', earlyBaseline: '1976–1995 mean', recentState: '2006–2025 mean',
    currentState: 'Newest reliable current state', fullRecordTrend: '1976–2025 trend',
    observedImpact: 'Observed consequence change', attribution: 'Counterfactual comparison',
    limitations: 'Synthetic test fixture', evidenceReferences: ['historical-source-1'],
  },
  outlook: {
    horizon: policy.horizon, scenario: policy.scenario, direction: 'worsening', confidence: 'B',
    basis: 'Synthetic outlook fixture', evidenceReferences: ['outlook-source-1'],
  },
  applicableDomains, components: { human, ecosystem },
});

const extreme = evaluateInternalTulipCandidate(node, candidate(component(4), component(4)), policy);
assert.equal(extreme.value, 10);
assert.deepEqual(extreme.grade, { letter: 'E', label: 'Extreme Impact' });
assert.deepEqual(evaluateInternalTulipCandidate(node, candidate(component(0), component(0)), policy).grade, { letter: 'A', label: 'Limited Impact' });
assert.deepEqual(evaluateInternalTulipCandidate(node, candidate(component(1), component(1)), policy).grade, { letter: 'B', label: 'Moderate Impact' });
assert.deepEqual(evaluateInternalTulipCandidate(node, candidate(component(2), component(2)), policy).grade, { letter: 'C', label: 'Significant Impact' });
assert.deepEqual(evaluateInternalTulipCandidate(node, candidate(component(3), component(3)), policy).grade, { letter: 'D', label: 'High Impact' });
assert.equal(evaluateInternalTulipCandidate(node, candidate(component(3), component(3)), policy).value, 7.8, 'Quarter-index values round consistently to one decimal');
const mixedQuarter = candidate(component(4), component(3));
assert.equal(evaluateInternalTulipCandidate(node, mixedQuarter, policy).value, 8.9, 'Binary floating-point noise cannot round a .875 index down');

const bounded = component(2, 'C');
bounded.lower = axes(1); bounded.upper = axes(3);
const boundedResult = evaluateInternalTulipCandidate(node, candidate(bounded, bounded), policy);
assert.deepEqual(boundedResult.uncertainty, { lower: 3.3, upper: 7.8, kind: 'structured_axis_bounds_not_probability' });
assert.equal(boundedResult.confidence, 'C');

const structuralZero = component(0);
structuralZero.structuralZero = true;
structuralZero.structuralZeroReason = 'The narrowly defined human outcome has no downstream ecological consequence.';
const singleDomain = evaluateInternalTulipCandidate(node, candidate(component(4), structuralZero, ['human']), policy);
assert.equal(singleDomain.status, 'internal_candidate');
assert.equal(singleDomain.value, 10, 'A severe single-domain phenomenon can use the full scale');
assert.deepEqual(singleDomain.domainWeights, { human: 1, ecosystem: 0 });

const familyEstimated = component(4, 'D');
familyEstimated.familyFallback = { familyId: 'heat', analogueNodeIds: ['analogue-1'], rationale: 'Calibrated against the same hazard family.' };
const familyResult = evaluateInternalTulipCandidate(node, candidate(familyEstimated, component(4)), policy);
assert.equal(familyResult.status, 'internal_candidate');
assert.equal(familyResult.confidence, 'D');
assert(evaluateInternalTulipCandidate(node, candidate(component(4, 'D'), component(4)), policy).reasons.includes('human_family_fallback_missing'));
const missingEvidence = component(4); missingEvidence.evidenceReferences = [];
assert(evaluateInternalTulipCandidate(node, candidate(missingEvidence, component(4)), policy).reasons.includes('human_evidence_missing'));
const opinionatedModifier = component(2); opinionatedModifier.central = { ...axes(2), systemic: 4 };
assert(evaluateInternalTulipCandidate(node, candidate(opinionatedModifier, component(2)), policy).reasons.includes('human_central_axes_invalid'));
assert.equal(evaluateInternalTulipCandidate({ id: 'response', node_kind: 'response' }, null, policy).status, 'not_applicable');

const shortHistory = candidate(component(2, 'C'), component(2, 'C'));
shortHistory.history = { ...shortHistory.history, recordStartYear: 2001, coverageExceptionReason: 'Comparable observations begin in 2001' };
assert.equal(evaluateInternalTulipCandidate(node, shortHistory, policy).status, 'internal_candidate');
const unexplainedShortHistory = candidate(component(2), component(2));
unexplainedShortHistory.history = { ...unexplainedShortHistory.history, recordStartYear: 2001 };
assert(evaluateInternalTulipCandidate(node, unexplainedShortHistory, policy).reasons.includes('historical_short_record_unexplained'));

const improvingOutlook = candidate(component(3), component(3));
improvingOutlook.outlook = { ...improvingOutlook.outlook, direction: 'improving' };
const worseningOutlook = candidate(component(3), component(3));
assert.equal(
  evaluateInternalTulipCandidate(node, improvingOutlook, policy).value,
  evaluateInternalTulipCandidate(node, worseningOutlook, policy).value,
  'Outlook direction must not change the current grade',
);
const missingOutlook = candidate(component(2), component(2));
delete missingOutlook.outlook;
assert(evaluateInternalTulipCandidate(node, missingOutlook, policy).reasons.includes('outlook_missing'));

const extendedCurrentWindow = candidate(component(2), component(2));
extendedCurrentWindow.currentWindow = {
  start: 2015, end: 2026, coverageStatus: 'provisional',
  isLatestAvailable: true, recencyCheckedOn: '2026-09-22',
  recencyRationale: 'This source includes the newest observations available at the assessment cut-off.',
  coverageNote: '2026 contains the latest published provisional observations.',
  summaryMethod: 'event_distribution',
  normalization: 'Event frequency and consequences are expressed per year; 2026 is used only to the source cut-off date.',
};
assert.equal(evaluateInternalTulipCandidate(node, extendedCurrentWindow, policy).status, 'internal_candidate');
const latestOlderWindow = candidate(component(2), component(2));
latestOlderWindow.currentWindow = {
  start: 1998, end: 2019, coverageStatus: 'complete', isLatestAvailable: true,
  recencyCheckedOn: '2026-09-22',
  recencyRationale: 'The measurement programme ended in 2019 and no newer compatible evidence was found.',
  summaryMethod: 'end_state_stock', normalization: 'The latest measured stock is compared with the documented reference condition.',
};
assert.equal(evaluateInternalTulipCandidate(node, latestOlderWindow, policy).status, 'internal_candidate');
const unnormalizedWindow = candidate(component(2), component(2));
delete unnormalizedWindow.currentWindow.normalization;
assert(evaluateInternalTulipCandidate(node, unnormalizedWindow, policy).reasons.includes('current_window_normalization_missing'));
const unverifiedRecency = candidate(component(2), component(2));
unverifiedRecency.currentWindow.isLatestAvailable = false;
assert(evaluateInternalTulipCandidate(node, unverifiedRecency, policy).reasons.includes('current_window_recency_unverified'));

const unresolvedEmissionSource = candidate(component(2, 'D'), component(2, 'D'));
unresolvedEmissionSource.components.human.familyFallback = { familyId: 'emissions', analogueNodeIds: ['aggregate-1'], rationale: 'Temporary family bound while source-specific attribution is unresolved.' };
unresolvedEmissionSource.components.ecosystem.familyFallback = { familyId: 'emissions', analogueNodeIds: ['aggregate-1'], rationale: 'Temporary family bound while source-specific attribution is unresolved.' };
unresolvedEmissionSource.causalAllocation = {
  role: 'emission_source',
  aggregateNodeIds: ['aggregate-1'],
  attributionStatus: 'unresolved',
  inheritsAggregateScore: false,
  counterfactual: 'Compare current harm with the same system absent this source contribution.',
  aggregationDenominator: 'Compatible anthropogenic greenhouse-gas emissions over the same period and geography.',
  overlapExclusions: ['Do not copy the aggregate greenhouse-gas score or downstream warming consequences.'],
  limitations: 'No compatible source-specific terminal-consequence model is yet available.',
};
const unresolvedEmissionResult = evaluateInternalTulipCandidate(node, unresolvedEmissionSource, policy);
assert.equal(unresolvedEmissionResult.status, 'internal_candidate');
assert.equal(unresolvedEmissionResult.causalAllocation.inheritsAggregateScore, false);
const falselyCertainEmissionSource = structuredClone(unresolvedEmissionSource);
falselyCertainEmissionSource.components.human.confidence = 'C';
delete falselyCertainEmissionSource.components.human.familyFallback;
assert(evaluateInternalTulipCandidate(node, falselyCertainEmissionSource, policy).reasons.includes('unresolved_emission_source_requires_confidence_d'));
const inheritedAggregateScore = structuredClone(unresolvedEmissionSource);
inheritedAggregateScore.causalAllocation.inheritsAggregateScore = true;
assert(evaluateInternalTulipCandidate(node, inheritedAggregateScore, policy).reasons.includes('emission_source_cannot_inherit_aggregate_score'));

console.log('Internal TULIP calibration rubric passed: newest reliable evidence, flexible current windows, normalization, current severity grades, independent outlook, history, bounds, confidence, structural zero, causal allocation and response exclusion.');
