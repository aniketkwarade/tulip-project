import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { GEOMETRIC_METHOD_VERSION, evaluateGeometricConsequenceAssessment,
  scoreGeometricAxes } from '../src/tulip-consequence-scoring-v2.js';

const root = new URL('../', import.meta.url);
const output = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const inputPath = 'artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json';
const bytes = readFileSync(new URL(inputPath, root));
const reviewed = JSON.parse(bytes);
const publicData = JSON.parse(readFileSync(new URL('public/tulip-assessments.json', root)));
const oldAudit = JSON.parse(readFileSync(new URL('artifacts/tulip-consequence-rule-audit-2026-09-27/results.json', root)));
const sourceRegistry = JSON.parse(readFileSync(new URL('public/tulip-source-registry.json', root)));
const sourceNativeAirCandidate = JSON.parse(readFileSync(new URL('soga-air-health-source-candidate.json', output)));
const airScopeProfile = JSON.parse(readFileSync(new URL('soga-edition-outcome-profile.json', output)));
const centralWaterRepairs = JSON.parse(readFileSync(new URL('central-water-source-repairs.json', output)));
const centralWaterById = new Map(centralWaterRepairs.records.map(record => [record.nodeId, record]));
assert.equal(sourceNativeAirCandidate.nodeId, 'air_pollution_health_burden');
assert.equal(sourceNativeAirCandidate.publicReady, false);
assert.equal(sourceNativeAirCandidate.wholeNodeAdmitted, false);
assert.equal(airScopeProfile.nodeId, sourceNativeAirCandidate.nodeId);
assert.equal(airScopeProfile.wholeNodeAdmitted, false);
const sourceById = new Map(sourceRegistry.sources.map(source => [source.id, source]));
const oldById = new Map(oldAudit.records.map(row => [row.nodeId, row]));
const axes = ['severity', 'reach', 'persistence'];
const mixedZero = vector => axes.some(axis => vector[axis] === 0) && axes.some(axis => vector[axis] > 0);
const copy = value => structuredClone(value);
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;

const nodes = reviewed.issues.map(item => {
  const candidate = item.candidate;
  const previous = oldById.get(item.nodeId);
  assert(previous && previous.publishedValue === publicData.records[item.nodeId].value);
  const domains = candidate.applicableDomains;
  const domainReviews = Object.fromEntries(domains.map(domain => {
    const component = candidate.components[domain];
    const centralInvalid = mixedZero(component.central);
    const lowerInvalid = mixedZero(component.lower);
    const sourceIds = [...new Set(component.evidenceReferences)];
    const sourceLinks = sourceIds.map(id => ({ id, url: sourceById.get(id)?.url ?? null }));
    const lowerDecision = !lowerInvalid ? 'existing_tuple_coherent_but_unverified'
      : component.lower.severity === 0 ? 'possible_no_harm_branch_requires_evidence'
        : component.lower.reach === 0 ? 'positive_severity_with_zero_affected_reach_requires_joint_bound'
          : 'positive_harm_with_zero_consequence_duration_requires_joint_bound';
    const corrections = [];
    if (centralInvalid) corrections.push('Remove the exposure/dependence or hazard-duration substitutions; determine one attributable outcome and who or what actually experienced it. The central vector is withheld from the new score.');
    if (lowerInvalid) corrections.push('Replace the independent axis minima with one jointly possible lower scenario justified by source evidence. Do not silently substitute all zero or copy the central vector.');
    corrections.push('Bind severity, affected reach and consequence duration to one named outcome, affected group, geography and period; check overlap and attribution against the cited sources.');
    return [domain, {
      status: 'typed_outcome_review_required',
      original: { lower: copy(component.lower), central: copy(component.central), upper: copy(component.upper), confidence: component.confidence },
      checks: { centralIncoherent: centralInvalid, lowerIncoherent: lowerInvalid,
        lowerDecision, centralSourceAnchored: Object.fromEntries(axes.map(axis => [axis, candidate.decisionTrace?.axisBasis?.[domain]?.[axis]?.sourceAnchored ?? null])) },
      sourceIds, sourceLinks,
      existingReasoning: { attribution: component.attribution, aggregation: component.aggregation, overlap: component.overlapReview },
      existingAxisBasis: copy(candidate.decisionTrace?.axisBasis?.[domain] ?? {}),
      proposedOutcome: { endpointId: null, endpoint: null, affectedGroup: null,
        geography: candidate.geography, assessmentWindow: null, counterfactual: candidate.causalAllocation?.counterfactual ?? null,
        severityAggregation: null, endpointCoverage: null, overlapCheck: null },
      corrections,
    }];
  }));
  if (item.nodeId === sourceNativeAirCandidate.nodeId) {
    domainReviews.human.status = 'typed_outcome_proposed_scope_unresolved';
    domainReviews.human.proposedOutcome = {
      endpointId: sourceNativeAirCandidate.endpointId,
      endpoint: 'Annual modeled air-pollution-attributable healthy life-years lost, fatal plus nonfatal',
      affectedGroup: 'Global, both sexes, all ages within the model-included pollutant and disease scope',
      geography: sourceNativeAirCandidate.scope.geography,
      assessmentWindow: { start: 2023, end: 2023 },
      counterfactual: sourceNativeAirCandidate.scope.counterfactual,
      severityAggregation: 'Source-modeled DALYs; no exposure-to-reach substitution or added death count',
      endpointCoverage: 'Edition-specific clinical scope documented; full node and exact parent risk/outcome inclusion unresolved',
      overlapCheck: 'Use the published parent estimate once; marginal pollutant totals cannot independently reconstruct it',
      approved: false,
    };
  }
  const centralInvalid = domains.some(domain => domainReviews[domain].checks.centralIncoherent);
  const lowerInvalid = domains.some(domain => domainReviews[domain].checks.lowerIncoherent);
  const conditional = centralInvalid ? null : scoreGeometricAxes(Object.fromEntries(domains.map(domain => [domain, candidate.components[domain].central])));
  const excludedDomain = domains.length === 1 ? (domains[0] === 'human' ? 'ecosystem' : 'human') : null;
  const draft = {
    nodeId: item.nodeId, nodeKind: 'issue', methodVersion: GEOMETRIC_METHOD_VERSION,
    applicableDomains: domains,
    domainApplicability: excludedDomain ? { [excludedDomain]: { status: 'structurally_not_applicable',
      reason: candidate.components[excludedDomain]?.structuralZeroReason || null } } : {},
    components: Object.fromEntries(domains.map(domain => [domain, {
      harmBasis: { route: null, endpointId: null, endpoint: null, affectedGroup: null,
        geography: candidate.geography, assessmentWindow: null, counterfactual: candidate.causalAllocation?.counterfactual ?? null,
        evidenceReferences: domainReviews[domain].sourceIds, severityAggregation: null,
        endpointCoverage: null, overlapCheck: null, axisEvidence: null },
      lower: null, central: null, upper: null,
    }])),
  };
  const gate = evaluateGeometricConsequenceAssessment(draft);
  assert.equal(gate.status, 'needs_consequence_assessment');
  return {
    nodeId: item.nodeId, name: item.name, nodeKind: 'issue',
    status: centralInvalid ? 'central_consequence_repair_required'
      : lowerInvalid ? 'joint_lower_repair_required' : 'typed_outcome_review_required',
    priority: centralInvalid ? 'P0' : lowerInvalid ? 'P1' : previous.confidence === 'provisional' ? 'P2' : 'P3',
    publicValueUnchanged: previous.publishedValue,
    conditionalGeometricValue: conditional?.value ?? null,
    conditionalOnly: true,
    sourceWindow: candidate.currentWindow,
    historicalObservedImpact: candidate.history?.observedImpact ?? null,
    historicalLimitations: candidate.history?.limitations ?? null,
    domainReviews,
    typedAssessmentDraft: draft,
    currentGateReasons: gate.reasons,
    ...(centralWaterById.has(item.nodeId) ? { centralSourceRepairReview: {
      version: centralWaterRepairs.version,
      artifact: 'artifacts/tulip-consequence-rule-audit-2026-09-27/central-water-source-repairs.json',
      ...copy(centralWaterById.get(item.nodeId)),
    } } : {}),
    sourceNativeOutcomeCandidates: item.nodeId === sourceNativeAirCandidate.nodeId ? [{
      domain: 'human', endpointId: sourceNativeAirCandidate.endpointId,
      sourceCandidateVersion: sourceNativeAirCandidate.version,
      artifact: 'artifacts/tulip-consequence-rule-audit-2026-09-27/soga-air-health-source-candidate.json',
      sourceArtifactSha256: sourceNativeAirCandidate.sourceArtifactSha256,
      scope: copy(sourceNativeAirCandidate.scope), quantities: copy(sourceNativeAirCandidate.modeledDalys),
      completedGap: sourceNativeAirCandidate.completedGap,
      remainingAdmissionGaps: copy(sourceNativeAirCandidate.remainingAdmissionGaps),
      wholeNodeAdmitted: sourceNativeAirCandidate.wholeNodeAdmitted,
      publicReady: sourceNativeAirCandidate.publicReady,
    }] : [],
    editionSpecificScopeReviews: item.nodeId === airScopeProfile.nodeId ? [{
      version: airScopeProfile.version,
      artifact: 'artifacts/tulip-consequence-rule-audit-2026-09-27/soga-edition-outcome-profile.json',
      mortalityDisplayClassCount: airScopeProfile.mortalityDisplayOutcomeClasses.length,
      no2AgeScopesInterchangeable: airScopeProfile.no2ReportedScope.ageScopesInterchangeable,
      rawNegativeLimitRetained: airScopeProfile.no2ReportedScope.rawNegativeLimitRetained,
      genericWebPageSpecifiesCurrentEdition: airScopeProfile.genericWebMethodologyAudit.currentEditionOutcomeSpecification,
      remaining: copy(airScopeProfile.remaining), publicReady: false,
    }] : [],
  };
});

const responses = reviewed.responses.map(item => {
  assert.equal(publicData.records[item.nodeId].value, null);
  const gate = evaluateGeometricConsequenceAssessment({ nodeId: item.nodeId, nodeKind: 'response', methodVersion: GEOMETRIC_METHOD_VERSION });
  assert.equal(gate.status, 'not_applicable');
  return { nodeId: item.nodeId, name: item.name, nodeKind: 'response', status: 'outside_danger_scoring', publicValueUnchanged: null };
});
assert.equal(nodes.length, 354);
assert.equal(responses.length, 27);
const summary = {
  issueNodes: nodes.length, responseNodes: responses.length,
  activeDomainReviews: nodes.reduce((sum, node) => sum + Object.keys(node.domainReviews).length, 0),
  centralRepairs: nodes.filter(node => node.status === 'central_consequence_repair_required').length,
  lowerRepairNodes: nodes.filter(node => Object.values(node.domainReviews).some(domain => domain.checks.lowerIncoherent)).length,
  lowerRepairComponents: nodes.reduce((sum, node) => sum + Object.values(node.domainReviews).filter(domain => domain.checks.lowerIncoherent).length, 0),
  possibleNoHarmLowerComponents: nodes.reduce((sum, node) => sum + Object.values(node.domainReviews).filter(domain => domain.checks.lowerDecision === 'possible_no_harm_branch_requires_evidence').length, 0),
  zeroReachLowerComponents: nodes.reduce((sum, node) => sum + Object.values(node.domainReviews).filter(domain => domain.checks.lowerDecision === 'positive_severity_with_zero_affected_reach_requires_joint_bound').length, 0),
  zeroDurationLowerComponents: nodes.reduce((sum, node) => sum + Object.values(node.domainReviews).filter(domain => domain.checks.lowerDecision === 'positive_harm_with_zero_consequence_duration_requires_joint_bound').length, 0),
  conditionallyCalculableFromOldAxes: nodes.filter(node => node.conditionalGeometricValue !== null).length,
  validatedTypedAssessments: 0,
  registeredSourceNativeOutcomeCandidates: nodes.reduce((sum, node) => sum + node.sourceNativeOutcomeCandidates.length, 0),
  proposedTypedDomainOutcomes: nodes.reduce((sum, node) => sum + Object.values(node.domainReviews).filter(review => review.proposedOutcome.endpointId !== null).length, 0),
  editionSpecificScopeReviews: nodes.reduce((sum, node) => sum + node.editionSpecificScopeReviews.length, 0),
  explicitCentralSourceRepairReviews: nodes.filter(node => node.centralSourceRepairReview).length,
};
summary.sourceAnchoring = { true: 0, false: 0, missing: 0 };
for (const node of nodes) for (const review of Object.values(node.domainReviews)) {
  for (const anchored of Object.values(review.checks.centralSourceAnchored)) {
    summary.sourceAnchoring[anchored === null ? 'missing' : String(anchored)]++;
  }
}
assert.equal(summary.activeDomainReviews, 518);
assert.equal(summary.centralRepairs, 2);
assert.equal(summary.lowerRepairNodes, 110);
assert.equal(summary.lowerRepairComponents, 132);
assert.equal(summary.possibleNoHarmLowerComponents + summary.zeroReachLowerComponents + summary.zeroDurationLowerComponents, 132);
assert.equal(Object.values(summary.sourceAnchoring).reduce((sum, count) => sum + count, 0), summary.activeDomainReviews * 3);
const result = { version: 'tulip_consequence_review_ledger_2026_09_27_v1',
  methodVersion: GEOMETRIC_METHOD_VERSION,
  status: 'all_nodes_queued_with_explicit_unresolved_source_binding',
  caveat: 'This is a complete machine review of stored assessment fields, not a completed scientific re-assessment of 518 domain outcomes. Conditional values are not publishable ratings.',
  input: { path: inputPath, sha256: createHash('sha256').update(bytes).digest('hex') },
  summary, nodes, responses };
writeFileSync(new URL('review-ledger.json', output), JSON.stringify(result, null, 2) + '\n');
const csvRows = [
  ['node_id', 'name', 'status', 'priority', 'current_public_value', 'conditional_geometric_value', 'domains', 'central_failed_domains', 'lower_failed_domains', 'typed_gate_reason_count'],
  ...nodes.map(node => [node.nodeId, node.name, node.status, node.priority, node.publicValueUnchanged.toFixed(1),
    node.conditionalGeometricValue?.toFixed(1) ?? '', Object.keys(node.domainReviews).join('+'),
    Object.entries(node.domainReviews).filter(([, review]) => review.checks.centralIncoherent).map(([domain]) => domain).join('+'),
    Object.entries(node.domainReviews).filter(([, review]) => review.checks.lowerIncoherent).map(([domain]) => domain).join('+'),
    node.currentGateReasons.length]),
  ...responses.map(node => [node.nodeId, node.name, node.status, '', '', '', '', '', '', '']),
];
writeFileSync(new URL('review-ledger.csv', output), csvRows.map(row => row.map(csvCell).join(',')).join('\n') + '\n');
const lowerQueue = [
  ['node_id', 'name', 'domain', 'failure_type', 'original_lower_severity', 'original_lower_reach',
    'original_lower_duration', 'central_severity', 'central_reach', 'central_duration',
    'severity_source_basis', 'reach_source_basis', 'duration_source_basis', 'source_urls', 'required_decision'],
  ...nodes.flatMap(node => Object.entries(node.domainReviews)
    .filter(([, review]) => review.checks.lowerIncoherent)
    .map(([domain, review]) => [node.nodeId, node.name, domain, review.checks.lowerDecision,
      review.original.lower.severity, review.original.lower.reach, review.original.lower.persistence,
      review.original.central.severity, review.original.central.reach, review.original.central.persistence,
      review.existingAxisBasis.severity?.basis ?? '', review.existingAxisBasis.reach?.basis ?? '',
      review.existingAxisBasis.persistence?.basis ?? '',
      review.sourceLinks.map(source => source.url).filter(Boolean).join(' | '),
      review.checks.lowerDecision === 'possible_no_harm_branch_requires_evidence'
        ? 'Check whether a genuinely no-harm case is possible for this same endpoint, group, place and period; if supported, set all three axes to zero together.'
        : review.checks.lowerDecision === 'positive_severity_with_zero_affected_reach_requires_joint_bound'
          ? 'Determine whether the affected group is genuinely absent, or obtain a positive lower reach for the same severity and duration case.'
          : 'Determine whether the consequence is genuinely absent, or obtain a positive consequence-duration lower bound for the same severity and reach case.'
    ])),
];
assert.equal(lowerQueue.length - 1, 132);
writeFileSync(new URL('lower-bound-repair-queue.csv', output), lowerQueue.map(row => row.map(csvCell).join(',')).join('\n') + '\n');
console.log(JSON.stringify(summary, null, 2));
