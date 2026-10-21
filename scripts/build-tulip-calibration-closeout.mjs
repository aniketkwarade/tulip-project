import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root)));
const sha = path => createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
const paths = {
  decisions: 'docs/tulip-calibration/calibration-decisions-2026-09-28.json',
  combination: 'src/tulip-domain-combination-decision.json',
  ledger: 'artifacts/tulip-consequence-rule-audit-2026-09-27/review-ledger.json',
  health: 'artifacts/tulip-calibration-closeout-2026-09-28/health-benchmark-source-check.json',
  pilot: 'artifacts/tulip-consequence-rule-audit-2026-09-27/original-20-semantic-review.json',
};
const choices = read(paths.decisions), combination = read(paths.combination);
const ledger = read(paths.ledger), health = read(paths.health), pilot = read(paths.pilot);
assert.equal(choices.combinationDecisionVersion, combination.version);
assert.deepEqual(choices.weights, combination.weights);
assert.equal(ledger.nodes.length, 354);
assert.equal(ledger.responses.length, 27);
const domains = ['human', 'ecosystem'];
const requiredTypedFields = ['endpointId', 'endpoint', 'affectedGroup', 'geography',
  'assessmentWindow', 'counterfactual', 'severityAggregation', 'endpointCoverage', 'overlapCheck'];
const nodeIds = new Set();
const componentDocket = [];
const nodes = ledger.nodes.map(node => {
  assert(!nodeIds.has(node.nodeId));
  nodeIds.add(node.nodeId);
  const domainPositions = domains.map(domain => {
    const existing = node.domainReviews[domain];
    const draft = existing?.proposedOutcome ?? {};
    const missingTypedFields = requiredTypedFields.filter(field => !draft[field]);
    const sourceCandidates = node.sourceNativeOutcomeCandidates ?? [];
    const position = {
      nodeId: node.nodeId, name: node.name, domain,
      priority: node.priority,
      status: existing ? 'existing_component_requires_source_native_outcome_review'
        : 'previously_outside_draft_scope_requires_verified_zero_or_consequence_assessment',
      oldDraftPresent: !!existing,
      centralInputRejected: existing?.checks?.centralIncoherent === true,
      lowerCaseRejected: existing?.checks?.lowerIncoherent === true,
      missingTypedFields,
      sourceIds: existing?.sourceIds ?? [],
      sourceLinks: existing?.sourceLinks ?? [],
      existingCorrections: existing?.corrections ?? [],
      sourceCandidateCountAtNode: sourceCandidates.length,
      sourceCandidateCountDoesNotProveDomainCoverage: true,
      nextAction: existing
        ? 'Define and extract the attributable terminal outcome, its scope/timebase and joint evidence bounds; use the selected endpoint ruler only where its unit and coverage apply.'
        : 'Review the node definition. Register a justified zero for this domain only if it has no consequences within that definition; otherwise assess its attributable consequences. Do not reweight the other domain.',
      replacementValue: null,
    };
    componentDocket.push(position);
    return position;
  });
  return { nodeId: node.nodeId, name: node.name, priority: node.priority,
    publicValueRetained: node.publicValueUnchanged, replacementValue: null,
    status: 'no_completed_source_native_replacement', domainPositions };
});
const oldPositions = componentDocket.filter(x => x.oldDraftPresent).length;
const addedPositions = componentDocket.length - oldPositions;
assert.equal(oldPositions, ledger.summary.activeDomainReviews);
assert.equal(addedPositions, 190);
assert.equal(componentDocket.filter(x => x.centralInputRejected).length, ledger.summary.centralRepairs);
assert.equal(componentDocket.filter(x => x.lowerCaseRejected).length, ledger.summary.lowerRepairComponents);
const byId = Object.fromEntries(nodes.map(node => [node.nodeId, node]));
const pilotReview = pilot.issues.map(item => ({...item, name: byId[item.nodeId].name,
  currentPublicValue: byId[item.nodeId].publicValueRetained, replacementValue: null,
  newSourceReviewPerformedByThisCloseout: false}));
const summary = {
  catalogueNodes: nodes.length + ledger.responses.length, issueNodes: nodes.length,
  responseExclusions: ledger.responses.length,
  fixedEqualWeightDomainPositions: componentDocket.length,
  existingDraftPositions: oldPositions, previouslyOmittedDomainPositions: addedPositions,
  centralRejectedInputs: ledger.summary.centralRepairs,
  rejectedLowerComponents: ledger.summary.lowerRepairComponents,
  nodesWithRejectedLowerCases: ledger.summary.lowerRepairNodes,
  completeTypedReplacementNodes: ledger.summary.validatedTypedAssessments,
  publicNumericalValuesChanged: 0,
  externallySourcedHealthMagnitudeCases: health.summary.referenceRows,
  additionalHealthMagnitudeChallenges: health.summary.additionalMagnitudeChallenges,
};
assert.equal(summary.completeTypedReplacementNodes, 0);
const result = {
  version: 'tulip_calibration_closeout_2026_09_28_v1',
  status: 'health_benchmark_choice_closed_full_calibration_incomplete',
  decisionVersion: choices.version, combinationVersion: combination.version,
  inputs: Object.fromEntries(Object.values(paths).map(path => [path, sha(path)])),
  summary,
  calibrationRoutes: {
    annualAttributableHealthDalys: 'internal_fixed_benchmarks_selected_endpoint_scope_only',
    otherHumanConsequences: 'conversion_and_overlap_calibration_missing',
    comparableEcosystemConditionArea: 'aggregation_principle_selected_reference_and_numeric_calibration_missing',
    speciesAndEcologicalFunctions: 'profile_equivalence_and_tradeoffs_missing',
  },
  scopeCorrection: 'The old 518-position ledger reflected single-domain draft exclusions. A fixed 50/50 composite requires 708 domain positions for 354 issues. The additional 190 positions require a consequence assessment or a justified zero; this is not a count of 190 additional nodes.',
  nodes,
  responses: ledger.responses.map(node => ({...node, replacementValue: null})),
  originalTwenty: {issueCases: pilotReview, responseCases: pilot.responses},
  unresolvedCalibration: choices.nature.remainingCalibration,
  publicReady: false, wholeMethodCalibrated: false,
  limitation: 'This closeout selects an internal health ruler and inventories work from the existing source-review ledger. It does not newly review all node sources, approve ecological equivalences, repair unsupported water counts or lower scenarios, independently validate a scientific model, or admit replacement public scores.',
};
const dir = 'artifacts/tulip-calibration-closeout-2026-09-28/';
mkdirSync(new URL(dir, root), {recursive:true});
writeFileSync(new URL(`${dir}coverage.json`, root), `${JSON.stringify(result, null, 2)}\n`);
const columns = ['nodeId', 'name', 'domain', 'priority', 'status', 'centralInputRejected',
  'lowerCaseRejected', 'missingTypedFields', 'nextAction'];
const quote = value => `"${String(Array.isArray(value) ? value.join(' | ') : value ?? '').replaceAll('"', '""')}"`;
writeFileSync(new URL(`${dir}component-docket.csv`, root),
  `${columns.join(',')}\n${componentDocket.map(row => columns.map(c => quote(row[c])).join(',')).join('\n')}\n`);
console.log(JSON.stringify({status: result.status, ...summary}, null, 2));
