import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PUBLISHED_NODES } from '../src/data.js';
import {
  evaluateInternalTulipCandidate,
  INTERNAL_CALIBRATION_VERSION,
} from '../src/tulip-internal-calibration.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const ratings = await json('docs/tulip-calibration/pilot-first-pass-ratings.json');
const pilot = await json('src/tulip-assessment-pilot.json');
const assessment = await json('public/tulip-assessments.json');
const policy = await json('src/tulip-score-policy.json');
const byId = new Map(PUBLISHED_NODES.map(node => [node.id, node]));
const issueIds = pilot.nodes.filter(({ node_id }) => assessment.records[node_id].nodeKind === 'issue').map(({ node_id }) => node_id);
assert.deepEqual(Object.keys(ratings).sort(), [...issueIds].sort(), 'First-pass ratings must cover every pilot issue exactly once');

const axes = values => Object.fromEntries(['severity', 'reach', 'persistence'].map((key, index) => [key, values[index]]));
const bounded = values => ({
  lower: axes(values.map(value => Math.max(0, value - 1))),
  central: axes(values),
  upper: axes(values.map(value => Math.min(4, value + 1))),
});
const sourceIds = record => record.evidenceReferences.map(source => source.id);
const yearFrom = value => Number(String(value ?? '').match(/\d{4}/)?.[0]);
const coverageNote = status => status === 'complete' ? undefined : 'The latest year is partial or provisional and is used only to the cited source cut-off.';
const summaryNormalization = method => ({
  annualized_flow: 'Report the source flow per year; do not multiply it by the number of years in the evidence window.',
  end_state_stock: 'Use the latest measured state against the declared reference; record length does not multiply the burden.',
  period_prevalence: 'Use the source prevalence or representative burden with its declared denominator; do not sum repeated observations.',
  event_distribution: 'Use event frequency, coverage and consequence distribution; do not add the same affected people or area across events.',
})[method];

function componentFor(node, dimension, values, evidenceReferences, rationale) {
  if (!values) return {
    lower: axes([0, 0, 0]), central: axes([0, 0, 0]), upper: axes([0, 0, 0]),
    confidence: 'C', evidenceReferences,
    attribution: `The narrowly defined ${node.name} node has no direct ${dimension} consequence inside its declared boundary.`,
    aggregation: 'The non-applicable domain is excluded rather than entered as a zero-valued harm estimate.',
    overlapReview: 'No terminal consequence is transferred from another node.',
    systemEffectsNote: 'Indirect pathways may appear in connected nodes and do not change this structural non-applicability decision.',
    structuralZero: true,
    structuralZeroReason: `The current node definition is limited to the ${dimension === 'human' ? 'ecological' : 'human'} outcome represented by its evidence.`,
  };
  return {
    ...bounded(values), confidence: 'C', evidenceReferences,
    attribution: rationale,
    aggregation: 'Current source-native consequences are classified once; accumulated series and downstream outcomes are not added together.',
    overlapReview: 'Shared downstream consequences are treated as alternative node views and are not added to this score.',
    systemEffectsNote: 'Only terminal consequences represented in severity, reach and persistence affect the candidate; unquantified cascades remain limitations.',
    structuralZero: false,
  };
}

const candidates = [];
for (const nodeId of issueIds) {
  const node = byId.get(nodeId);
  const record = assessment.records[nodeId];
  const input = ratings[nodeId];
  const [currentStart, currentEnd, coverageStatus, summaryMethod] = input.current;
  const [historyStart, historyEnd] = input.history;
  const evidenceReferences = sourceIds(record);
  const currentEvidence = record.evidenceAudit?.observations?.[0]?.value;
  const candidate = {
    nodeId,
    policyVersion: policy.version,
    calibrationVersion: INTERNAL_CALIBRATION_VERSION,
    geography: policy.geography,
    sourceDigest: record.sourceDigest,
    currentWindow: {
      start: currentStart,
      end: currentEnd,
      coverageStatus,
      coverageNote: coverageNote(coverageStatus),
      summaryMethod,
      normalization: summaryNormalization(summaryMethod),
      isLatestAvailable: true,
      recencyCheckedOn: '2026-09-22',
      recencyRationale: `This is the newest compatible evidence retained in TULIP's source registry as of the assessment cut-off; source audit date: ${record.evidenceAudit?.sourceAsOf ?? 'not supplied'}.`,
    },
    referenceBasis: {
      type: input.baseline[0], start: input.baseline[1], end: input.baseline[2],
      purpose: 'Reference for interpreting the latest current evidence; it is not the current evidence window.',
    },
    history: {
      mode: 'direct_record', recordStartYear: historyStart, recordEndYear: Math.min(historyEnd, 2025),
      completeCalendarPeriods: true,
      coverageExceptionReason: historyStart > 1976 || historyEnd < 2025
        ? `The compatible source record spans ${historyStart}–${historyEnd}; missing years are not imputed.` : undefined,
      metric: node.calibration_metric?.metric_name ?? node.metric_contract?.metric_name ?? node.description,
      earlyBaseline: `Use the earliest compatible state in the cited ${historyStart}–${historyEnd} record; no older value is invented.`,
      recentState: node.description,
      currentState: JSON.stringify(currentEvidence ?? { sourceAsOf: record.evidenceAudit?.sourceAsOf }),
      fullRecordTrend: `Structured first-pass trend classification: ${input.direction}.`,
      observedImpact: `${node.humanImpact?.summary ?? ''} ${node.planetImpact?.summary ?? ''}`.trim(),
      attribution: input.rationale,
      limitations: 'This first pass lacks a complete common-unit terminal-consequence model. Axis bounds therefore span one rubric level and require an independent internal check.',
      evidenceReferences,
    },
    outlook: {
      horizon: policy.horizon, scenario: policy.scenario, direction: input.direction, confidence: 'C',
      basis: 'Structured first-pass direction based on the cited current record and documented causal pathways; it is not a probability or a straight-line forecast.',
      evidenceReferences,
    },
    applicableDomains: ['human', 'ecosystem'].filter(dimension => input[dimension] !== null),
    components: {
      human: componentFor(node, 'human', input.human, evidenceReferences, input.rationale),
      ecosystem: componentFor(node, 'ecosystem', input.ecosystem, evidenceReferences, input.rationale),
    },
    reviewStatus: 'first_pass_requires_independent_internal_check',
  };
  const result = evaluateInternalTulipCandidate(node, candidate, { ...policy, sourceDigest: record.sourceDigest });
  assert.equal(result.status, 'internal_candidate', `${nodeId}: ${result.reasons.join(', ')}`);
  candidates.push({ nodeId, name: node.name, candidate, result });
}

const responseControls = pilot.nodes
  .filter(({ node_id }) => assessment.records[node_id].nodeKind === 'response')
  .map(({ node_id }) => {
    const node = byId.get(node_id);
    return { nodeId: node_id, name: node.name, result: evaluateInternalTulipCandidate(node, null, policy) };
  });
assert.equal(candidates.length, 18);
assert.equal(responseControls.length, 2);

const output = {
  version: INTERNAL_CALIBRATION_VERSION,
  status: 'first_pass_requires_independent_internal_check',
  preparedOn: '2026-09-22',
  candidates,
  responseControls,
};
const outDir = resolve(root, 'artifacts/tulip-calibration-2026-09-22');
await writeFile(resolve(outDir, 'internal-20-node-first-pass-candidates.json'), JSON.stringify(output, null, 2) + '\n');

const rows = [
  ['Node', 'Value', 'Grade', 'Low', 'High', 'Confidence', 'Outlook', 'Status'],
  ...candidates.map(({ name, result }) => [name, result.value, `${result.grade.letter} — ${result.grade.label}`, result.uncertainty.lower, result.uncertainty.upper, result.confidence, result.outlook.direction, 'Internal check required']),
  ...responseControls.map(({ name }) => [name, '', 'Response', '', '', '', '', 'Excluded from danger scoring']),
];
const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n') + '\n';
await writeFile(resolve(outDir, 'internal-20-node-first-pass-summary.csv'), csv);

const markdown = `# TULIP 20-node first-pass assessment\n\nStatus: **internal candidates requiring an independent internal check**. These values are not enabled in the public application. Bounds are structured one-level rubric ranges, not probability intervals.\n\n| Node | Candidate | Grade | Range | Evidence | Outlook |\n| --- | ---: | --- | --- | --- | --- |\n${candidates.map(({ name, result }) => `| ${name} | ${result.value.toFixed(1)} | ${result.grade.letter} — ${result.grade.label} | ${result.uncertainty.lower.toFixed(1)}–${result.uncertainty.upper.toFixed(1)} | ${result.confidence} | ${result.outlook.direction} |`).join('\n')}\n${responseControls.map(({ name }) => `| ${name} | — | Response | — | — | — |`).join('\n')}\n\nA–E under evidence means evidence route/confidence, while A–E in the Grade column means impact band. They are separate classifications.\n`;
await writeFile(resolve(outDir, 'internal-20-node-first-pass-report.md'), markdown);
const progress = {
  catalogueNodes: PUBLISHED_NODES.length,
  issueNodes: Object.values(assessment.records).filter(record => record.nodeKind === 'issue').length,
  responseNodes: Object.values(assessment.records).filter(record => record.nodeKind === 'response').length,
  firstPassCandidates: candidates.length,
  independentInternalChecksCompleted: 0,
  issueNodesAwaitingFirstPass: Object.values(assessment.records).filter(record => record.nodeKind === 'issue').length - candidates.length,
  productionRatingsEnabled: 0,
  gradeCounts: Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map(letter => [letter, candidates.filter(({ result }) => result.grade.letter === letter).length])),
};
await writeFile(resolve(outDir, 'internal-assessment-progress.json'), JSON.stringify(progress, null, 2) + '\n');
console.log(JSON.stringify(progress, null, 2));
