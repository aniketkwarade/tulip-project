import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateEvidenceBoundGeometricCandidate,
  evaluateGeometricConsequenceAssessment } from '../src/tulip-consequence-scoring-v2.js';

const artifact = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const ledger = JSON.parse(readFileSync(new URL('review-ledger.json', artifact)));
const lowerQueue = readFileSync(new URL('lower-bound-repair-queue.csv', artifact), 'utf8').trimEnd().split('\n');
const findings = JSON.parse(readFileSync(new URL('priority-source-findings.json', artifact)));
const mortalityReview = JSON.parse(readFileSync(new URL('air-pollution-mortality-reach-review.json', artifact)));
const mortalitySource = JSON.parse(readFileSync(new URL('who-air-pollution-mortality-row.json', artifact)));
const pilot = JSON.parse(readFileSync(new URL('original-20-semantic-review.json', artifact)));
const publicData = JSON.parse(readFileSync(new URL('../public/tulip-assessments.json', import.meta.url)));
const ids = new Set();
let active = 0, central = 0, lower = 0, admittedWholeNodeRatings = 0;
for (const node of ledger.nodes) {
  assert(!ids.has(node.nodeId));
  ids.add(node.nodeId);
  assert.equal(node.publicValueUnchanged, publicData.records[node.nodeId].value);
  assert.equal(node.typedAssessmentDraft.nodeId, node.nodeId);
  assert.equal(evaluateGeometricConsequenceAssessment(node.typedAssessmentDraft).status, 'needs_consequence_assessment');
  const gated = evaluateEvidenceBoundGeometricCandidate(node.typedAssessmentDraft);
  if (gated.publicReady && Number.isFinite(gated.value)) admittedWholeNodeRatings++;
  assert.equal(gated.value, null);
  assert.equal(gated.publicReady, false);
  for (const review of Object.values(node.domainReviews)) {
    active++;
    assert(review.sourceIds.length > 0);
    assert(review.corrections.length > 0);
    if (review.checks.centralIncoherent) {
      central++;
      assert.equal(node.conditionalGeometricValue, null);
    }
    if (review.checks.lowerIncoherent) {
      lower++;
      assert.notEqual(review.checks.lowerDecision, 'existing_tuple_coherent_but_unverified');
    }
  }
}
for (const node of ledger.responses) {
  assert(!ids.has(node.nodeId));
  ids.add(node.nodeId);
  assert.equal(node.publicValueUnchanged, null);
  assert.equal(evaluateGeometricConsequenceAssessment({ nodeId: node.nodeId, nodeKind: 'response' }).status, 'not_applicable');
  assert.equal(evaluateEvidenceBoundGeometricCandidate({ nodeId: node.nodeId, nodeKind: 'response' }).status, 'not_applicable');
}
assert.equal(ids.size, 381);
assert.equal(active, 518);
assert.equal(central, 2);
assert.equal(lower, 132);
assert.equal(admittedWholeNodeRatings, 0);
const sourceNativeCandidates = ledger.nodes.flatMap(node => node.sourceNativeOutcomeCandidates);
assert.equal(sourceNativeCandidates.length, ledger.summary.registeredSourceNativeOutcomeCandidates);
assert.equal(sourceNativeCandidates.length, 1);
const airSourceCandidate = ledger.nodes.find(node => node.nodeId === 'air_pollution_health_burden').sourceNativeOutcomeCandidates[0];
assert.equal(airSourceCandidate.scope.year, 2023);
assert.equal(airSourceCandidate.scope.outcomeKind, 'attributable_dalys');
assert.deepEqual(airSourceCandidate.quantities, { lower: 194000000, central: 232500000, upper: 264100000 });
assert.equal(airSourceCandidate.wholeNodeAdmitted, false);
assert.equal(airSourceCandidate.publicReady, false);
const airNode = ledger.nodes.find(node => node.nodeId === 'air_pollution_health_burden');
assert.equal(airNode.domainReviews.human.proposedOutcome.endpointId, airSourceCandidate.endpointId);
assert.equal(airNode.domainReviews.human.proposedOutcome.approved, false);
assert.equal(airNode.editionSpecificScopeReviews.length, 1);
assert.equal(airNode.editionSpecificScopeReviews[0].no2AgeScopesInterchangeable, false);
assert.equal(airNode.editionSpecificScopeReviews[0].rawNegativeLimitRetained, true);
assert.equal(ledger.summary.proposedTypedDomainOutcomes, 1);
assert.equal(ledger.summary.editionSpecificScopeReviews, 1);
assert(airSourceCandidate.remainingAdmissionGaps.some(reason => reason.includes('CSV-footer')));
assert.equal(lowerQueue.length - 1, lower);
assert(lowerQueue[0].includes('source_urls'));
assert.equal(ledger.summary.lowerRepairNodes, 110);
assert.equal(findings.findings.length, 6);
assert.equal(pilot.issues.length, 18);
assert.equal(pilot.responses.length, 2);
assert.equal(mortalityReview.proposedFullNodeScore, null);
assert.equal(mortalityReview.publicScoreUnchanged, publicData.records.air_pollution_health_burden.value);
assert.equal(mortalityReview.sourceInterval.lower95.sourceModeledDeaths, mortalitySource.modeledDeaths.lower95);
assert.equal(mortalityReview.sourceInterval.central.sourceModeledDeaths, mortalitySource.modeledDeaths.central);
assert.equal(mortalityReview.sourceInterval.upper95.sourceModeledDeaths, mortalitySource.modeledDeaths.upper95);
assert(mortalityReview.sourceInterval.lower95.affectedReachLevel < mortalityReview.sourceInterval.central.affectedReachLevel);
assert(mortalityReview.sourceInterval.central.affectedReachLevel < mortalityReview.sourceInterval.upper95.affectedReachLevel);
assert(findings.findings.find(row => row.nodeId === 'air_pollution_health_burden')?.decision
  === 'mortality_reach_bound_source_repaired_full_node_unresolved');
assert.equal(new Set([...pilot.issues, ...pilot.responses].map(row => row.nodeId)).size, 20);
for (const row of [...pilot.issues, ...pilot.responses]) assert(ids.has(row.nodeId));
for (const finding of findings.findings) {
  assert(ids.has(finding.nodeId));
  assert(finding.sources.every(url => url.startsWith('https://')));
  assert(finding.needed.length > 40);
}
console.log(JSON.stringify({ status: 'passed', nodes: ids.size, activeDomains: active,
  centralFailures: central, lowerFailures: lower, reviewedPrioritySourceBoundaries: findings.findings.length,
  pilotSemanticScreens: pilot.issues.length + pilot.responses.length,
  admittedWholeNodeRatings }));
