import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  CONSEQUENCE_METHOD_VERSION, consequenceIndex, evaluateConsequenceAssessment,
  mapConsequenceIndex, persistenceLevelFromDays, reachLevelFromHarmedPeople,
  scoreCoherentAxes,
} from '../src/tulip-consequence-scoring.js';
import { GEOMETRIC_METHOD_VERSION, evaluateEvidenceBoundGeometricCandidate,
  evaluateGeometricConsequenceAssessment,
  geometricConsequenceIndex, scoreGeometricAxes, validateDirectSourceScope } from '../src/tulip-consequence-scoring-v2.js';
import { WHO_JOINT_AIR_DEATHS_2021_ARTIFACT_SHA256 } from '../src/tulip-source-observation-registry.js';

const anchors = JSON.parse(readFileSync(new URL('../docs/tulip-calibration/score-meaning-anchors.json', import.meta.url)));
const evidence = domain => {
  const result = ({
  route: 'structured', endpoint: `${domain} attributable harm`, metricRole: 'structured_consequence_estimate',
  endpointId: `${domain}_hypothetical_consequence`, affectedGroup: `${domain}_hypothetical_harmed_group`,
  geography: 'synthetic reference area', assessmentWindow: 'synthetic reference period',
  severityAggregation: 'The level describes the counted group, not the worst individual case.',
  endpointCoverage: 'One defined synthetic endpoint; other pathways do not exist in this fixture.',
  overlapCheck: 'The endpoint is counted once in the fixture.',
  counterfactual: 'Compare the same place and period without the harmful condition.',
  evidenceReferences: ['hypothetical-benchmark'], estimateRationale: 'Synthetic calibration fixture, not a real node.',
  axisEvidence: {
    severity: { kind: domain === 'human' ? 'bounded_human_consequence_estimate' : 'bounded_ecosystem_condition_estimate', explanation: 'Defined consequence in the fixed reference case.', estimateRationale: 'Frozen benchmark.' },
    reach: { kind: domain === 'human' ? 'bounded_harmed_people_estimate' : 'bounded_degraded_distribution_estimate', explanation: 'Counts harmed people or degraded ecosystem distribution.', estimateRationale: 'Frozen benchmark.' },
    persistence: { kind: 'bounded_recovery_estimate', explanation: 'Duration of the attributable consequence or its recovery.', estimateRationale: 'Frozen benchmark.' },
  },
  });
  for (const item of Object.values(result.axisEvidence)) {
    item.endpointId = result.endpointId;
    item.affectedGroup = result.affectedGroup;
    item.geography = result.geography;
    item.assessmentWindow = result.assessmentWindow;
  }
  return result;
};
const estimate = (axes, extra = {}) => ({ status: 'assessed_harm', axes: { ...axes }, ...extra });
const zeros = () => ({ status: 'possible_zero', axes: { severity: 0, reach: 0, persistence: 0 } });
const withJointEvidence = (component, domain) => {
  const basis = component.harmBasis;
  for (const position of ['lower', 'central', 'upper']) {
    const item = component[position];
    item.jointEvidence = {
      kind: item.status === 'possible_zero' ? 'possible_zero' : item.status === 'verified_zero' ? 'verified_zero' : 'structured_joint_scenario',
      explanation: `The ${position} synthetic ${domain} case is a jointly possible whole-vector scenario.`,
      endpointId: basis.endpointId, affectedGroup: basis.affectedGroup,
      geography: basis.geography, assessmentWindow: basis.assessmentWindow,
      evidenceReferences: basis.evidenceReferences,
    };
  }
  return component;
};
const fixture = (human, ecosystem, domains = ['human', 'ecosystem']) => ({
  nodeId: 'synthetic_reference', nodeKind: 'issue', methodVersion: CONSEQUENCE_METHOD_VERSION,
  applicableDomains: domains,
  domainApplicability: domains.length === 1 ? { [domains[0] === 'human' ? 'ecosystem' : 'human']:
    { status: 'structurally_not_applicable', reason: 'This hypothetical endpoint is defined in one domain only.' } } : {},
  components: {
    human: withJointEvidence({ harmBasis: evidence('human'), lower: zeros(), central: human, upper: estimate({ severity: 4, reach: 4, persistence: 4 }) }, 'human'),
    ecosystem: withJointEvidence({ harmBasis: evidence('ecosystem'), lower: zeros(), central: ecosystem, upper: estimate({ severity: 4, reach: 4, persistence: 4 }) }, 'ecosystem'),
  },
});

const humanDurations = [14, 182.625, 1826.25, null];
const ecosystemDurations = [91.3125, 1826.25, 7305, null];
for (const [index, anchor] of anchors.anchors.entries()) {
  const human = estimate({ severity: anchor.humanReference.legacyAxes[0], persistence: 0 }, {
    harmedPeople: anchor.humanReference.peopleAffected,
    reachBasis: 'people_with_attributable_harm',
    durationDays: humanDurations[index] ?? undefined,
    irreversible: humanDurations[index] === null,
    durationBasis: 'attributable_consequence_or_recovery',
  });
  const ecosystem = estimate({ severity: 0, reach: 0, persistence: 0 }, {
    relativeConditionLossPercent: anchor.ecosystemReference.relativeSeverityPercent,
    conditionIndicator: 'Hypothetical ecosystem condition measure', referenceState: 'Hypothetical intact reference',
    collapseThreshold: 'Hypothetical loss of defining ecosystem features',
    degradedDistributionPercent: anchor.ecosystemReference.affectedDistributionPercent,
    distributionDenominator: 'Full distribution of the hypothetical ecosystem type',
    durationDays: ecosystemDurations[index] ?? undefined,
    irreversible: ecosystemDurations[index] === null,
    durationBasis: 'attributable_consequence_or_recovery',
  });
  for (const domains of [['human', 'ecosystem'], ['human'], ['ecosystem']]) {
    const result = evaluateConsequenceAssessment(fixture(human, ecosystem, domains));
    assert.equal(result.status, 'experimental_candidate', `${anchor.targetScore}: ${result.reasons.join(',')}`);
    assert.equal(result.value, anchor.targetScore);
    assert.equal(result.uncertainty.lower, 1);
    assert.equal(result.uncertainty.upper, 10);
    const geometricFixture = fixture(human, ecosystem, domains);
    geometricFixture.methodVersion = GEOMETRIC_METHOD_VERSION;
    const geometric = evaluateGeometricConsequenceAssessment(geometricFixture);
    assert.equal(geometric.status, 'experimental_candidate', `${anchor.targetScore}: ${geometric.reasons.join(',')}`);
    assert.equal(geometric.value, anchor.targetScore);
    assert.equal(evaluateEvidenceBoundGeometricCandidate(geometricFixture).status, 'needs_calibrated_route');
    assert.equal(evaluateEvidenceBoundGeometricCandidate(geometricFixture).value, null);
  }
}

const mixed = fixture(estimate({ severity: 4, reach: 3, persistence: 4 }), estimate({ severity: 0, reach: 0, persistence: 0 }, { status: 'verified_zero' }));
mixed.components.ecosystem.harmBasis = { ...evidence('ecosystem'),
  route: 'verified_zero', endpoint: 'Measured absence of attributable ecosystem loss', metricRole: 'verified_zero',
  counterfactual: 'Same ecosystem without the condition', evidenceReferences: ['hypothetical-zero-check'],
  zeroFinding: 'The hypothetical complete measurement finds no attributable loss.',
};
mixed.components.ecosystem.upper = estimate({ severity: 0, reach: 0, persistence: 0 }, { status: 'verified_zero' });
mixed.components.ecosystem.lower = estimate({ severity: 0, reach: 0, persistence: 0 }, { status: 'verified_zero' });
withJointEvidence(mixed.components.ecosystem, 'ecosystem');
assert.equal(evaluateConsequenceAssessment(mixed).value, 5);
const geometricMixed = structuredClone(mixed);
geometricMixed.methodVersion = GEOMETRIC_METHOD_VERSION;
assert.equal(evaluateGeometricConsequenceAssessment(geometricMixed).value, 5);
const familyWithoutTransfer = fixture(estimate({ severity: 2, reach: 2, persistence: 2 }),
  estimate({ severity: 2, reach: 2, persistence: 2 }), ['human']);
familyWithoutTransfer.methodVersion = GEOMETRIC_METHOD_VERSION;
familyWithoutTransfer.components.human.harmBasis.route = 'family';
familyWithoutTransfer.components.human.harmBasis.analogueNodeIds = ['synthetic_analogue'];
familyWithoutTransfer.components.human.harmBasis.adjustmentRationale = 'A prose-only adjustment.';
assert.equal(evaluateGeometricConsequenceAssessment(familyWithoutTransfer).status, 'experimental_candidate');
assert(evaluateEvidenceBoundGeometricCandidate(familyWithoutTransfer).reasons
  .includes('human_family_transfer_rule_missing'));
const convertedWithoutCalculation = structuredClone(familyWithoutTransfer);
convertedWithoutCalculation.components.human.harmBasis.route = 'converted';
assert(evaluateEvidenceBoundGeometricCandidate(convertedWithoutCalculation).reasons
  .includes('human_converted_calculation_missing'));

const independentlyCombinedBounds = fixture(estimate({ severity: 3, reach: 3, persistence: 3 }), estimate({ severity: 3, reach: 3, persistence: 3 }));
independentlyCombinedBounds.methodVersion = GEOMETRIC_METHOD_VERSION;
delete independentlyCombinedBounds.components.human.lower.jointEvidence;
assert(evaluateGeometricConsequenceAssessment(independentlyCombinedBounds).reasons
  .includes('human_lower_joint_evidence_missing_or_incompatible'));
const mismatchedJointReference = fixture(estimate({ severity: 3, reach: 3, persistence: 3 }), estimate({ severity: 3, reach: 3, persistence: 3 }));
mismatchedJointReference.methodVersion = GEOMETRIC_METHOD_VERSION;
mismatchedJointReference.components.human.upper.jointEvidence.evidenceReferences = ['unrelated-exposure-data'];
assert(evaluateGeometricConsequenceAssessment(mismatchedJointReference).reasons
  .includes('human_upper_joint_evidence_missing_or_incompatible'));

const who = JSON.parse(readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-air-pollution-mortality-row.json', import.meta.url)));
assert.equal(createHash('sha256').update(readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-air-pollution-mortality-row.json', import.meta.url))).digest('hex'),
  WHO_JOINT_AIR_DEATHS_2021_ARTIFACT_SHA256);
const direct = fixture(estimate({ severity: 4, reach: 3, persistence: 4 }),
  estimate({ severity: 1, reach: 1, persistence: 1 }), ['human']);
direct.methodVersion = GEOMETRIC_METHOD_VERSION;
const directBasis = direct.components.human.harmBasis;
directBasis.route = 'direct';
directBasis.endpointId = 'who_joint_air_pollution_attributable_deaths';
directBasis.endpoint = 'Modeled deaths attributable to joint ambient and household air pollution';
directBasis.affectedGroup = 'Modeled attributable deaths worldwide';
directBasis.geography = 'global';
directBasis.assessmentWindow = '2021';
directBasis.evidenceReferences = ['who_air_35_global_2021'];
directBasis.primarySourceId = 'who_air_35_global_2021';
directBasis.scoreEndpointScope = 'mortality_only_complete';
for (const [position, count] of [['lower', who.modeledDeaths.lower95],
  ['central', who.modeledDeaths.central], ['upper', who.modeledDeaths.upper95]]) {
  direct.components.human[position] = estimate({ severity: 4, reach: 3, persistence: 4 },
    { harmedPeople: Math.round(count), reachBasis: 'people_with_attributable_harm',
      irreversible: true, durationBasis: 'attributable_consequence_or_recovery' });
}
withJointEvidence(direct.components.human, 'human');
for (const item of Object.values(directBasis.axisEvidence)) {
  item.endpointId = directBasis.endpointId;
  item.affectedGroup = directBasis.affectedGroup;
  item.geography = directBasis.geography;
  item.assessmentWindow = directBasis.assessmentWindow;
}
for (const item of ['lower', 'central', 'upper'].map(position => direct.components.human[position])) {
  item.jointEvidence.endpointId = directBasis.endpointId;
  item.jointEvidence.affectedGroup = directBasis.affectedGroup;
  item.jointEvidence.geography = directBasis.geography;
  item.jointEvidence.assessmentWindow = directBasis.assessmentWindow;
  item.jointEvidence.evidenceReferences = directBasis.evidenceReferences;
  item.jointEvidence.kind = 'source_interval';
}
directBasis.sourceObservations = [{
  sourceId: 'who_air_35_global_2021', sourceUrl: who.sourceUrl,
  endpointId: directBasis.endpointId, affectedGroup: directBasis.affectedGroup,
  geography: directBasis.geography, assessmentWindow: directBasis.assessmentWindow,
  outcomeKind: 'attributable_deaths', unit: 'modeled deaths',
  value: who.modeledDeaths.central, lower: who.modeledDeaths.lower95, upper: who.modeledDeaths.upper95,
}];
assert.deepEqual(validateDirectSourceScope('human', directBasis), []);
assert.equal(evaluateGeometricConsequenceAssessment(direct).status, 'experimental_candidate');
const originalMortalityResult = evaluateGeometricConsequenceAssessment(direct);
const admittedMortalityEndpoint = evaluateEvidenceBoundGeometricCandidate(direct);
assert.equal(admittedMortalityEndpoint.status, 'source_bound_endpoint_candidate');
assert.equal(admittedMortalityEndpoint.constructStatus, 'rejected_for_aggregate_current_harm');
assert.equal(admittedMortalityEndpoint.publicReady, false);
assert.equal(admittedMortalityEndpoint.value, null);
assert.equal(admittedMortalityEndpoint.publicReady, false);
assert.equal(admittedMortalityEndpoint.endpointCandidate.value, originalMortalityResult.value);
const selfRevisedMortality = structuredClone(direct);
selfRevisedMortality.components.human.harmBasis.sourceObservations[0].value += 0.1;
assert.equal(evaluateGeometricConsequenceAssessment(selfRevisedMortality).status, 'experimental_candidate');
assert(evaluateEvidenceBoundGeometricCandidate(selfRevisedMortality).reasons
  .includes('human_direct_source_not_registered_exact_match'));
const addedFutureNode = structuredClone(direct);
addedFutureNode.nodeId = 'synthetic_future_mortality_only_node';
assert.deepEqual(evaluateGeometricConsequenceAssessment(addedFutureNode), originalMortalityResult);
assert.deepEqual(evaluateEvidenceBoundGeometricCandidate(addedFutureNode), admittedMortalityEndpoint);
assert.deepEqual(evaluateGeometricConsequenceAssessment(direct), originalMortalityResult);
const partialMortalityEndpoint = structuredClone(direct);
partialMortalityEndpoint.components.human.harmBasis.scoreEndpointScope = 'mortality_only_partial';
assert(evaluateGeometricConsequenceAssessment(partialMortalityEndpoint).reasons
  .includes('human_direct_mortality_endpoint_scope_missing'));
const arbitraryMortalitySeverity = structuredClone(direct);
for (const position of ['lower', 'central', 'upper']) {
  arbitraryMortalitySeverity.components.human[position].axes.severity = 1;
}
assert(evaluateGeometricConsequenceAssessment(arbitraryMortalitySeverity).reasons
  .includes('human_central_direct_death_interval_not_bound'));
const arbitraryMortalityDuration = structuredClone(direct);
arbitraryMortalityDuration.components.human.central.irreversible = false;
assert(evaluateGeometricConsequenceAssessment(arbitraryMortalityDuration).reasons
  .includes('human_central_direct_death_interval_not_bound'));
const zeroMortalityLower = structuredClone(direct);
zeroMortalityLower.components.human.harmBasis.sourceObservations[0].lower = 0;
zeroMortalityLower.components.human.lower = {
  ...zeros(), harmedPeople: 0, reachBasis: 'people_with_attributable_harm',
  jointEvidence: { ...direct.components.human.lower.jointEvidence, kind: 'possible_zero' },
};
assert.equal(evaluateGeometricConsequenceAssessment(zeroMortalityLower).status, 'experimental_candidate');
assert.equal(evaluateGeometricConsequenceAssessment(zeroMortalityLower).uncertainty.lower, 1);
const regionalSubstitution = structuredClone(direct);
regionalSubstitution.components.human.harmBasis.sourceObservations[0].geography = 'Europe, 35 countries';
regionalSubstitution.components.human.harmBasis.sourceObservations[0].assessmentWindow = 'summer 2022';
assert(evaluateGeometricConsequenceAssessment(regionalSubstitution).reasons
  .includes('human_direct_source_scope_or_outcome_mismatch'));
const exposureSubstitution = structuredClone(direct);
exposureSubstitution.components.human.harmBasis.sourceObservations[0].outcomeKind = 'population_exposed';
assert(evaluateGeometricConsequenceAssessment(exposureSubstitution).reasons
  .includes('human_direct_source_scope_or_outcome_mismatch'));
const invertedInterval = structuredClone(direct);
invertedInterval.components.human.harmBasis.sourceObservations[0].upper = 100;
assert(evaluateGeometricConsequenceAssessment(invertedInterval).reasons
  .includes('human_direct_source_interval_invalid'));
const mixedReachBounds = structuredClone(direct);
mixedReachBounds.components.human.upper.harmedPeople = 7_900_000_000;
assert(evaluateGeometricConsequenceAssessment(mixedReachBounds).reasons
  .includes('human_upper_direct_death_interval_not_bound'));
const offByOneDeathCount = structuredClone(direct);
offByOneDeathCount.components.human.central.harmedPeople += 1;
assert(evaluateGeometricConsequenceAssessment(offByOneDeathCount).reasons
  .includes('human_central_direct_death_interval_not_bound'));
const imaginedZero = structuredClone(direct);
imaginedZero.components.human.lower = zeros();
imaginedZero.components.human.lower.jointEvidence = { ...direct.components.human.lower.jointEvidence, kind: 'possible_zero' };
assert(evaluateGeometricConsequenceAssessment(imaginedZero).reasons
  .includes('human_lower_direct_death_interval_not_bound'));

const unverifiedZero = structuredClone(mixed);
unverifiedZero.components.ecosystem.harmBasis = evidence('ecosystem');
assert(evaluateConsequenceAssessment(unverifiedZero).reasons.includes('ecosystem_unknown_harm_cannot_be_zero'));

const exposureOnly = fixture(estimate({ severity: 0, reach: 4, persistence: 2 }), estimate({ severity: 1, reach: 1, persistence: 1 }), ['human']);
exposureOnly.components.human.harmBasis.metricRole = 'exposure_only';
exposureOnly.components.human.harmBasis.axisEvidence.reach.kind = 'population_exposed';
const rejected = evaluateConsequenceAssessment(exposureOnly);
assert.equal(rejected.status, 'needs_consequence_assessment');
assert.equal(rejected.value, null);
assert(rejected.reasons.includes('human_terminal_metric_required'));
assert(rejected.reasons.includes('human_reach_consequence_evidence_missing'));
assert(rejected.reasons.includes('human_axes_incoherent_zero'));

const riskPopulation = fixture(estimate({ severity: 2, reach: 2, persistence: 2 }, {
  harmedPeople: 100000, reachBasis: 'people_exposed',
}), estimate({ severity: 2, reach: 2, persistence: 2 }));
assert(evaluateConsequenceAssessment(riskPopulation).reasons.includes('human_harmed_people_basis_invalid'));

const missingDuration = fixture(estimate({ severity: 2, reach: 2, persistence: 2 }, {
  durationDays: 182.625, durationBasis: 'duration_of_hazard',
}), estimate({ severity: 2, reach: 2, persistence: 2 }));
assert(evaluateConsequenceAssessment(missingDuration).reasons.includes('human_duration_basis_invalid'));

const mixedGroups = fixture(estimate({ severity: 3, reach: 3, persistence: 3 }), estimate({ severity: 3, reach: 3, persistence: 3 }));
mixedGroups.components.human.harmBasis.axisEvidence.reach.affectedGroup = 'everyone exposed, including people without the stated harm';
assert(evaluateConsequenceAssessment(mixedGroups).reasons.includes('human_reach_endpoint_scope_mismatch'));

const mismatchedPeriod = fixture(estimate({ severity: 3, reach: 3, persistence: 3 }), estimate({ severity: 3, reach: 3, persistence: 3 }));
mismatchedPeriod.components.human.harmBasis.axisEvidence.persistence.assessmentWindow = 'different unconverted source period';
assert(evaluateConsequenceAssessment(mismatchedPeriod).reasons.includes('human_persistence_period_or_geography_mismatch'));

const unsupportedFraction = fixture(estimate({ severity: 2.7, reach: 2, persistence: 2 }), estimate({ severity: 2, reach: 2, persistence: 2 }));
assert(evaluateConsequenceAssessment(unsupportedFraction).reasons.includes('human_severity_ordinal_level_invalid'));

const unverifiedAllZero = structuredClone(mixed);
unverifiedAllZero.components.ecosystem.upper.status = 'possible_zero';
assert(evaluateConsequenceAssessment(unverifiedAllZero).reasons.includes('ecosystem_upper_verified_zero_bound_invalid'));

const missingSingleDomainDecision = fixture(estimate({ severity: 2, reach: 2, persistence: 2 }), estimate({ severity: 2, reach: 2, persistence: 2 }), ['human']);
missingSingleDomainDecision.domainApplicability = {};
assert(evaluateConsequenceAssessment(missingSingleDomainDecision).reasons.includes('ecosystem_structural_exclusion_missing'));

const zeroButDuration = fixture(estimate({ severity: 0, reach: 0, persistence: 2 }), estimate({ severity: 2, reach: 2, persistence: 2 }));
assert(evaluateConsequenceAssessment(zeroButDuration).reasons.includes('human_axes_incoherent_zero'));
assert.equal(scoreCoherentAxes({ human: { severity: 0, reach: 4, persistence: 4 } }), null);
assert.equal(scoreCoherentAxes({ human: { severity: 0, reach: 0, persistence: 0 } }).value, 1);

const mildWide = scoreCoherentAxes({ ecosystem: { severity: 1, reach: 4, persistence: 4 } });
const severeTypical = scoreCoherentAxes({ ecosystem: { severity: 3, reach: 3, persistence: 3 } });
const severeLocal = scoreCoherentAxes({ ecosystem: { severity: 4, reach: 1, persistence: 4 } });
assert(mildWide.value < severeTypical.value);
assert(severeTypical.value < severeLocal.value);
assert.equal(severeTypical.value, 7);
assert.equal(reachLevelFromHarmedPeople(5000), 1);
assert.equal(reachLevelFromHarmedPeople(100000), 2);
assert.equal(reachLevelFromHarmedPeople(10000000), 3);
assert.equal(reachLevelFromHarmedPeople(100000000), 4);
assert(Math.abs(reachLevelFromHarmedPeople(9999) - reachLevelFromHarmedPeople(10000)) < 0.001);
assert(reachLevelFromHarmedPeople(999999) > reachLevelFromHarmedPeople(10000));
assert.equal(persistenceLevelFromDays('human', 1826.25), 3);
assert.equal(consequenceIndex({ severity: 4, reach: 3, persistence: 4 }), 15 / 16);
assert.equal(mapConsequenceIndex(15 / 16), 9);
assert.equal(evaluateConsequenceAssessment({ nodeKind: 'response' }).value, null);
assert.equal(evaluateGeometricConsequenceAssessment({ nodeKind: 'response' }).value, null);
assert.equal(geometricConsequenceIndex({ severity: 0, reach: 4, persistence: 4 }), null);
assert.equal(scoreGeometricAxes({ human: { severity: 0, reach: 0, persistence: 0 } }).value, 1);
assert(scoreGeometricAxes({ human: { severity: 3, reach: 3, persistence: 3 } }).value
  > scoreGeometricAxes({ human: { severity: 4, reach: 1, persistence: 4 } }).value);

let monotonicComparisons = 0;
for (let severity = 1; severity <= 4; severity++) for (let reach = 1; reach <= 4; reach++) {
  for (let persistence = 1; persistence <= 4; persistence++) {
    const base = { severity, reach, persistence };
    const result = scoreCoherentAxes({ human: base });
    const geometric = scoreGeometricAxes({ human: base });
    assert(result && result.value >= 1 && result.value <= 10);
    assert(geometric && geometric.value >= 1 && geometric.value <= 10);
    for (const axis of ['severity', 'reach', 'persistence']) {
      if (base[axis] === 4) continue;
      const raised = scoreCoherentAxes({ human: { ...base, [axis]: base[axis] + 1 } });
      assert(raised.rawValue > result.rawValue);
      assert(scoreGeometricAxes({ human: { ...base, [axis]: base[axis] + 1 } }).rawValue > geometric.rawValue);
      monotonicComparisons++;
    }
  }
}

console.log(JSON.stringify({ status: 'passed', anchors: 4, domainScenarios: 12, exposureAndUnknownRejections: 8,
  monotonicComparisons,
  stressScores: { mildWide: mildWide.value, severeTypical: severeTypical.value, severeLocal: severeLocal.value },
  note: 'Synthetic calibration controls. They do not validate real source-to-axis assessments.' }, null, 2));
