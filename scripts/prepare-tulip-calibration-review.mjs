// Research packet only. This script cannot enable production ratings.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { PUBLISHED_NODES } from '../src/data.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async p => JSON.parse(await readFile(resolve(root, p), 'utf8'));
const digest = b => createHash('sha256').update(b).digest('hex');
const assessment = await json('public/tulip-assessments.json');
const cases = await json('docs/tulip-calibration/cases.json');
const pilot = await json('src/tulip-assessment-pilot.json');
const policy = await json('src/tulip-score-policy.json');
assert.equal(assessment.version, policy.version);
assert.equal(new Set(cases.map(c => c.nodeId)).size, cases.length, 'Duplicate case');
assert.equal(new Set(PUBLISHED_NODES.map(n => n.id)).size, PUBLISHED_NODES.length);
assert.equal(Object.keys(assessment.records).length, PUBLISHED_NODES.length, 'Export catalogue mismatch');
const pilotIds = new Set(pilot.nodes.map(n => n.node_id));
const caseMap = new Map(cases.map(c => [c.nodeId, c]));
for (const c of cases) {
  assert(PUBLISHED_NODES.some(n => n.id === c.nodeId), `Unknown case ${c.nodeId}`);
  assert.notEqual(assessment.records[c.nodeId].nodeKind, 'response');
  assert(c.missing.length && c.firstAction && c.acceptance);
  for (const s of c.candidateSources) assert(/^https:\/\//.test(s.url));
}
const rows = PUBLISHED_NODES.map(n => {
  const r = assessment.records[n.id], c = caseMap.get(n.id);
  assert(r, `Missing assessment for ${n.id}`);
  assert.match(r.sourceDigest, /^[a-f0-9]{64}$/);
  const response = r.nodeKind === 'response';
  return {
    nodeId: n.id, name: n.name, nodeKind: r.nodeKind,
    originalPilot: pilotIds.has(n.id), priorRoute: r.evidenceAudit?.previousRoute ?? '',
    queue: response ? 'response_excluded' : c ? 'first_eight_cases' : pilotIds.has(n.id) ? 'pilot_regression_queued' : 'catalogue_screening_queued',
    familyProposal: c?.family ?? '', screeningStatus: c?.screeningStatus ?? (response ? 'not_applicable' : 'not_screened_in_this_packet'),
    productionStatus: r.status, productionValue: r.value, assessmentVersion: r.version,
    sourceDigest: r.sourceDigest, internalCheck: 'not_started', externalChallenge: 'on_hold_until_internal_method_complete',
    nextAction: response ? 'Preserve exclusion from danger scoring.' : c?.firstAction ?? 'Classify the node construct, inspect its existing sources and identify compatible consequence models before proposing calibration.',
    existingSources: r.evidenceReferences, missingRequirements: c?.missing ?? r.evidenceAudit?.required ?? r.reasons,
  };
});
assert.equal(rows.filter(r => r.originalPilot).length, pilotIds.size, 'Pilot coverage missing');
const out = resolve(root, 'artifacts/tulip-calibration-2026-09-22');
await mkdir(out, { recursive: true });
const csvCell = v => '"' + String(v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v).replaceAll('"', '""') + '"';
const csv = rows => { const fields = Object.keys(rows[0]); return [fields.map(csvCell).join(','), ...rows.map(r => fields.map(f => csvCell(r[f])).join(','))].join('\n') + '\n'; };
await writeFile(resolve(out, 'node-review-queue.csv'), csv(rows));
await writeFile(resolve(out, 'node-review-queue.json'), JSON.stringify(rows, null, 2) + '\n');
const anchors = ['human_health', 'human_essential_services', 'ecosystem_condition', 'ecosystem_irreversibility'].flatMap(endpoint => [0, .25, .5, .75, 1].map(utilityPosition => ({
  endpointProposal: endpoint, utilityPosition, rawLossValue: null, rawUnit: null,
  benchmarkSource: null, geography: policy.geography, startYear: null,
  endYear: null, context: 'latest_reliable_current_evidence', rationale: null,
  reviewer: null, status: 'draft_position_raw_anchor_not_calibrated',
})));
await writeFile(resolve(out, 'anchor-worksheet.csv'), csv(anchors));
const pilotById = new Map(pilot.nodes.map(n => [n.node_id, n]));
const axisFields = ['severity', 'reach', 'persistence'];
const estimates = ['lower', 'central', 'upper'];
const buildInternalWorksheetRecord = r => {
  const pilotNode = pilotById.get(r.nodeId);
  const record = {
    nodeId: r.nodeId, name: r.name, nodeKind: r.nodeKind,
    catalogueRole: pilotNode?.role ?? r.familyProposal ?? r.priorRoute ?? '',
    originalPilot: r.originalPilot,
    assessmentVersion: r.assessmentVersion, internalCalibrationVersion: 'tulip_internal_rubric_2026_09_22_v5',
    currentWindowStart: null, currentWindowEnd: null, currentWindowCoverageStatus: null,
    currentWindowCoverageNote: null, currentWindowSummaryMethod: null,
    currentWindowNormalization: null, currentWindowIsLatestAvailable: null,
    currentWindowRecencyCheckedOn: null, currentWindowRecencyRationale: null,
    referenceBaselineType: null, referenceBaselineStart: null, referenceBaselineEnd: null,
    referenceBaselinePurpose: null, referenceBaselineAlternativeReason: null,
    geography: policy.geography,
    sourceDigest: r.sourceDigest, existingSources: r.existingSources,
    historicalTargetStart: 1976, historicalTargetEnd: 2025,
    historicalRecordStart: null, historicalRecordEnd: null, historicalMode: null,
    historicalCompleteCalendarPeriods: null, historicalCoverageExceptionReason: null,
    historicalMetric: null, historicalEarlyBaseline1976To1995: null,
    historicalRecentState2006To2025: null, historicalCurrentState: null,
    historicalCurrentStatePeriod: null, historicalFullRecordTrend: null,
    historicalObservedImpact2006To2025: null, historicalAttribution: null,
    historicalLimitations: null, historicalEvidenceReferences: null,
    outlookHorizon: policy.horizon, outlookScenario: policy.scenario,
    outlookDirection: null, outlookConfidence: null, outlookBasis: null, outlookEvidenceReferences: null,
    causalBoundary: null, counterfactual: null, adaptationAssumption: null,
    applicableDomains: r.nodeKind === 'response' ? [] : null,
  };
  for (const dimension of ['human', 'ecosystem']) {
    for (const estimate of estimates) for (const axis of axisFields) record[`${dimension}_${estimate}_${axis}`] = null;
    record[`${dimension}_confidence`] = null;
    record[`${dimension}_familyId`] = null;
    record[`${dimension}_analogueNodeIds`] = null;
    record[`${dimension}_familyFallbackRationale`] = null;
    record[`${dimension}_attribution`] = null;
    record[`${dimension}_aggregation`] = null;
    record[`${dimension}_overlapReview`] = null;
    record[`${dimension}_systemEffectsNote`] = null;
    record[`${dimension}_structuralZero`] = false;
    record[`${dimension}_structuralZeroReason`] = null;
    record[`${dimension}_evidenceReferences`] = null;
  }
  return { ...record, analyst: null, analystDecisionOn: null, checker: null, checkerDecisionOn: null,
    disagreement: null, resolution: null, candidateValue: null, candidateGrade: null, candidateLower: null, candidateUpper: null,
    candidateConfidence: null, publicGradeRequired: r.nodeKind === 'issue',
    status: r.nodeKind === 'response' ? 'response_excluded' : 'internal_calibration_pending' };
};
const internalCatalogue = rows.map(buildInternalWorksheetRecord);
const internalPilot = internalCatalogue.filter(r => r.originalPilot);
assert.equal(internalCatalogue.length, PUBLISHED_NODES.length, 'Catalogue worksheet coverage mismatch');
assert.equal(new Set(internalCatalogue.map(r => r.nodeId)).size, PUBLISHED_NODES.length, 'Catalogue worksheet duplicate');
assert.equal(internalCatalogue.filter(r => r.publicGradeRequired).length, 354, 'Issue worksheet coverage mismatch');
assert.equal(internalCatalogue.filter(r => r.status === 'response_excluded').length, 27, 'Response worksheet coverage mismatch');
await writeFile(resolve(out, 'internal-20-node-worksheet.csv'), csv(internalPilot));
await writeFile(resolve(out, 'internal-20-node-worksheet.json'), JSON.stringify(internalPilot, null, 2) + '\n');
await writeFile(resolve(out, 'internal-all-node-worksheet.csv'), csv(internalCatalogue));
await writeFile(resolve(out, 'internal-all-node-worksheet.json'), JSON.stringify(internalCatalogue, null, 2) + '\n');
const text = `# Eight initial calibration cases\n\nGenerated from authored case dossiers. These are feasibility screens, not numerical or independent scientific assessments. Sources are candidates unless explicitly admitted through the production process.\n\n` + cases.map(c => {
  const n = PUBLISHED_NODES.find(n => n.id === c.nodeId), r = assessment.records[c.nodeId];
  return `## ${n.name}\n\nStable ID: \`${c.nodeId}\`. Role: ${c.role}. Family proposal: ${c.family}. Prior evidence route: ${r.evidenceAudit?.previousRoute}.\n\n**Screen status:** ${c.screeningStatus}\n\n**Proposed consequences:** ${c.proposedEndpoints}\n\n**Existing evidence reuse:** ${c.reuse}\n\n**Candidate sources:**\n\n${c.candidateSources.length ? c.candidateSources.map(s => `- [${s.label}](${s.url})`).join('\n') : '- No compatible new projection verified yet.'}\n\n**Still needed:**\n\n${c.missing.map(m => '- ' + m).join('\n')}\n\n**Main pitfall:** ${c.pitfall}\n\n**Next action:** ${c.firstAction}\n\n**Acceptance:** ${c.acceptance}\n`;
}).join('\n');
await writeFile(resolve(root, 'docs/tulip-calibration/case-dossiers.md'), text);
const inputs = ['src/tulip-score-policy.json', 'src/tulip-score-method.js', 'src/tulip-internal-calibration.js', 'public/tulip-assessments.json', 'src/tulip-assessment-pilot.json', 'docs/tulip-calibration/README.md', 'docs/tulip-calibration/internal-score-logic.md', 'docs/tulip-calibration/protocol.md', 'docs/tulip-calibration/reviewer-brief.md', 'docs/tulip-calibration/cases.json', 'docs/tulip-calibration/review-form.json', 'docs/tulip-calibration/pilot-first-pass-ratings.json', 'scripts/prepare-tulip-calibration-review.mjs', 'scripts/build-tulip-internal-pilot-candidates.mjs', 'scripts/build-tulip-internal-catalogue-first-pass.mjs', 'scripts/review-tulip-high-priority-candidates.mjs', 'scripts/audit-tulip-reviewed-catalogue.mjs', 'scripts/ingest-tulip-certainty-supplements.mjs', 'scripts/prepare-tulip-certainty-campaign.mjs', 'scripts/test-tulip-internal-calibration.mjs', 'scripts/test-tulip-internal-catalogue-first-pass.mjs', 'scripts/test-tulip-high-priority-review.mjs', 'scripts/test-tulip-reviewed-catalogue-audit.mjs', 'scripts/test-tulip-certainty-campaign.mjs', 'artifacts/tulip-calibration-2026-09-22/heat-source-audit.json'];
const inputHashes = {};
for (const path of inputs) inputHashes[path] = digest(await readFile(resolve(root, path)));
const summary = {
  packetVersion: 'tulip_calibration_working_2026_09_22_v3', preparedOn: '2026-09-22',
  status: 'internal_calibration_ready_external_challenge_on_hold', assessmentRevision: assessment.revision,
  counts: { catalogue: rows.length, issues: rows.filter(r => r.nodeKind === 'issue').length,
    responses: rows.filter(r => r.nodeKind === 'response').length, firstCases: cases.length,
    originalPilot: rows.filter(r => r.originalPilot).length, previouslyModeled: rows.filter(r => r.priorRoute === 'modeled').length,
    supportedProductionRatings: rows.filter(r => Number.isFinite(r.productionValue)).length,
    internalPilotCandidates: internalPilot.filter(r => Number.isFinite(r.candidateValue)).length,
    internalCatalogueRows: internalCatalogue.length,
    internalCatalogueIssueRows: internalCatalogue.filter(r => r.publicGradeRequired).length,
    internalCatalogueResponseRows: internalCatalogue.filter(r => r.status === 'response_excluded').length,
    internalCatalogueCandidates: internalCatalogue.filter(r => Number.isFinite(r.candidateValue)).length,
    externalReviewsCompleted: 0 },
  inputHashes, packetSha256: digest(JSON.stringify(inputHashes)),
  constraints: ['Internal method authored by TULIP', 'Outside challenge held until internal 20-node pilot is complete', 'No reviewer contacted', 'No paid engagement commissioned', 'Production scoring unchanged', 'No source model executed'],
};
await writeFile(resolve(out, 'manifest.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary.counts));
console.log(`Packet SHA-256: ${summary.packetSha256}`);
