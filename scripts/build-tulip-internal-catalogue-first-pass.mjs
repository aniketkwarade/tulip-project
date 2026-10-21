import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PUBLISHED_NODES } from '../src/data.js';
import { evaluateInternalTulipCandidate, INTERNAL_CALIBRATION_VERSION } from '../src/tulip-internal-calibration.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const assessment = await json('public/tulip-assessments.json');
const policy = await json('src/tulip-score-policy.json');
const pilotFirstPass = await json('artifacts/tulip-calibration-2026-09-22/internal-20-node-first-pass-candidates.json');
const manualById = new Map(pilotFirstPass.candidates.map(item => [item.nodeId, item]));
const byId = new Map(PUBLISHED_NODES.map(node => [node.id, node]));

const AXIS_KEYS = ['severity', 'reach', 'persistence'];
const axes = values => Object.fromEntries(AXIS_KEYS.map((key, index) => [key, values[index]]));
const bounds = values => ({
  lower: axes(values.map(value => Math.max(0, value - 1))),
  central: axes(values),
  upper: axes(values.map(value => Math.min(4, value + 1))),
});
const zeroBounds = () => ({ lower: axes([0, 0, 0]), central: axes([0, 0, 0]), upper: axes([0, 0, 0]) });

const textFor = (node, dimension) => {
  const impact = dimension === 'human' ? node.humanImpact : node.planetImpact;
  const reader = dimension === 'human' ? node.readerCopy?.human : node.readerCopy?.planet;
  return [node.name, node.description, impact?.summary, ...(impact?.domains ?? []), ...(impact?.consequences ?? []), reader?.summary, ...(reader?.domains ?? []), ...(reader?.consequences ?? [])]
    .filter(Boolean).join(' ').toLowerCase();
};

const humanEndpointPattern = /mortality|hospital|health burden|human exposure|food insecurity|rationing|insurance|mortgage|migration|displacement|conflict|humanitarian|affordability|price volatility|service interruption|operational disruption|infrastructure failure|supply disruption|labor exposure|labour exposure|disease outbreak|pathogen outbreak|allergen|warning coverage|cooling equity/;
const natureEndpointPattern = /biodiversity|species|coral|forest dieback|habitat|ecosystem collapse|pollinator colony|soil microbial|dead zone|tree mortality|mussel|migratory bird|amphibian|seagrass|nunatak|tundra|savanna|mangrove|reef|jellyfish|bark beetle|chytrid|genetic bottleneck/;

function applicability(node) {
  const humanText = textFor(node, 'human');
  const ecosystemText = textFor(node, 'ecosystem');
  const humanSaysNone = /no direct human outcome established|no direct human consequence/.test(humanText);
  const ecosystemSaysNone = /no direct earth-system outcome established|no direct planetary consequence/.test(ecosystemText);
  const name = node.name.toLowerCase();
  if (ecosystemSaysNone && humanEndpointPattern.test(name)) return ['human'];
  if (humanSaysNone && natureEndpointPattern.test(name)) return ['ecosystem'];
  if (ecosystemSaysNone && !humanSaysNone) return ['human'];
  if (humanSaysNone && !ecosystemSaysNone) return ['ecosystem'];
  return ['human', 'ecosystem'];
}

function severity(node, dimension) {
  const text = textFor(node, dimension);
  const name = node.name.toLowerCase();
  if (dimension === 'human') {
    if (/mortality|fatalit|premature death|hospitalization/.test(name)) return 4;
    if (/death|mortality|fatal|permanent disability|basic survival|starvation/.test(text)) return 3;
    if (/severe illness|hospital|displacement|relocation|food insecurity|water insecurity|service failure|outage|conflict|disease|injury|flooding/.test(text)) return 3;
    if (/illness|exposure|stress|cost|price|disruption|loss|shortage|risk|damage/.test(text)) return 2;
    return 1;
  }
  if (/collapse|extinction|mortality|dieback/.test(name)) return 4;
  if (/ecosystem collapse|extinction|mass mortality|irreversible loss/.test(text)) return 4;
  if (/habitat loss|biodiversity loss|degradation|dead zone|hypoxi|bleach|acidification|pollution|erosion|depletion|dieback|mortality/.test(text)) return 3;
  if (/stress|decline|shift|disruption|exposure|risk|damage|warming|loss/.test(text)) return 2;
  return 1;
}

function reach(node) {
  if (node.context?.reach === 'global') return 4;
  if (node.context?.reach === 'regional') return 3;
  return 1;
}

function persistence(node, dimension) {
  const impact = dimension === 'human' ? node.humanImpact : node.planetImpact;
  const text = textFor(node, dimension);
  if (/irreversible|centur|permanent|extinction/.test(text)) return 4;
  const horizon = impact?.timeHorizon;
  if (['long_term', 'chronic_with_abrupt_risk'].includes(horizon)) return 4;
  if (['chronic', 'acute_and_chronic', 'seasonal_and_chronic', 'near_term_and_chronic', 'chronic_with_acute_failures'].includes(horizon)) return 3;
  if (['near_term'].includes(horizon)) return 2;
  if (['acute', 'seasonal'].includes(horizon)) return 1;
  if (/chronic|long-lived|long term|multi-year|persistent/.test(text)) return 3;
  return 2;
}

function yearFrom(value) {
  const years = [...String(value ?? '').matchAll(/(?:18|19|20)\d{2}/g)].map(match => Number(match[0])).filter(year => year <= 2026);
  return years.length ? Math.max(...years) : 2025;
}

function collectHistoricalYears(value, key = '', years = []) {
  if (value == null) return years;
  if (Array.isArray(value)) {
    for (const item of value) collectHistoricalYears(item, key, years);
    return years;
  }
  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) collectHistoricalYears(childValue, childKey, years);
    return years;
  }
  if (/(year|date|period|start|end|baseline|reference)/i.test(key)) {
    for (const match of String(value).matchAll(/(?:18|19|20)\d{2}/g)) {
      const year = Number(match[0]);
      if (year >= 1850 && year <= 2026) years.push(year);
    }
  }
  return years;
}

function summaryMethod(node, record) {
  const name = node.name.toLowerCase();
  const unit = String(node.calibration_metric?.unit ?? node.metric_contract?.unit ?? '').toLowerCase();
  if (/per year|\/year|annual/.test(unit) || /emission|output|withdrawal|demand|waste generation/.test(name)) return 'annualized_flow';
  if (/heatwave|outbreak|extreme|flood|drought|storm|fire|avalanche|bleach|disruption/.test(name)) return 'event_distribution';
  if (record.evidenceAudit?.previousRoute === 'impact_fallback') return 'period_prevalence';
  return 'end_state_stock';
}

function normalization(method) {
  return {
    annualized_flow: 'Use the source flow per year; never multiply the burden by the number of observations.',
    event_distribution: 'Use event rate, extent and consequence distribution; never sum repeat exposure to the same people or area.',
    period_prevalence: 'Use the source prevalence or representative burden with its declared denominator; repeated observations are not accumulated.',
    end_state_stock: 'Use the newest measured state against its declared reference; record length does not multiply harm.',
  }[method];
}

function evidenceConfidence(record) {
  if (record.evidenceAudit?.previousRoute === 'modeled') return 'B';
  if (record.evidenceAudit?.previousRoute === 'current_data') return 'B';
  return 'C';
}

function isClimateVariable(node) {
  const text = `${node.name} ${node.metric_contract?.metric_name ?? ''}`.toLowerCase();
  return /temperature|precipitation|rainfall|heat|wet-bulb|drought|snow|wind|monsoon|oscillation|climate|sea ice/.test(text);
}

function component(node, dimension, applicable, evidenceReferences, confidence, values) {
  if (!applicable) return {
    ...zeroBounds(), confidence, evidenceReferences,
    attribution: `The narrowly defined ${node.name} node has no direct ${dimension} consequence inside its declared outcome boundary.`,
    aggregation: 'The non-applicable domain is excluded rather than treated as low or missing harm.',
    overlapReview: 'No consequence is copied from a connected node to fill the excluded domain.',
    systemEffectsNote: 'Indirect system effects remain in connected nodes and cannot change structural non-applicability.',
    structuralZero: true,
    structuralZeroReason: `The authored evidence defines ${node.name} as a ${dimension === 'human' ? 'nature' : 'human'} outcome for this assessment.`,
  };
  return {
    ...bounds(values), confidence, evidenceReferences,
    attribution: `First-pass structured classification of current consequences described in the cited evidence for ${node.name}.`,
    aggregation: 'Source-native consequences are classified once; accumulated observations and downstream outcomes are not added together.',
    overlapReview: 'Connected-node consequences are alternative causal views and are not summed into this candidate.',
    systemEffectsNote: 'Only consequences represented in severity, reach and persistence affect the value; plausible unquantified cascades remain limitations.',
    structuralZero: false,
  };
}

function buildAutomaticCandidate(node, record) {
  const evidenceReferences = record.evidenceReferences.map(source => source.id);
  const domains = applicability(node);
  const confidence = evidenceConfidence(record);
  const currentEnd = yearFrom(record.evidenceAudit?.sourceAsOf);
  const method = summaryMethod(node, record);
  const years = collectHistoricalYears(record.evidenceAudit?.observations ?? []);
  const historyEnd = Math.min(currentEnd, 2025);
  const historyStart = Math.min(years.length ? Math.min(...years) : historyEnd, historyEnd);
  const coverageStatus = currentEnd === 2026 ? 'provisional' : 'complete';
  const humanValues = [severity(node, 'human'), reach(node), persistence(node, 'human')];
  const ecosystemValues = [severity(node, 'ecosystem'), reach(node), persistence(node, 'ecosystem')];
  return {
    nodeId: node.id,
    policyVersion: policy.version,
    calibrationVersion: INTERNAL_CALIBRATION_VERSION,
    geography: policy.geography,
    sourceDigest: record.sourceDigest,
    currentWindow: {
      start: currentEnd, end: currentEnd, coverageStatus,
      coverageNote: coverageStatus === 'provisional' ? 'The newest source year is partial or provisional and is used only to its published cut-off.' : undefined,
      summaryMethod: method, normalization: normalization(method),
      isLatestAvailable: true, recencyCheckedOn: '2026-09-22',
      recencyRationale: `The source registry identifies ${record.evidenceAudit.sourceAsOf} as the newest compatible evidence for this first pass.`,
    },
    referenceBasis: isClimateVariable(node)
      ? { type: 'wmo_climatological_normal', start: 1991, end: 2020, purpose: 'Reference for current climate anomalies; source-specific alternatives require review.' }
      : { type: 'source_declared_outcome_reference', start: historyStart, end: historyStart, purpose: 'Source-native comparison or counterfactual for the measured outcome.' },
    history: {
      mode: 'direct_record', recordStartYear: historyStart, recordEndYear: historyEnd,
      completeCalendarPeriods: true,
      coverageExceptionReason: historyStart > 1976 || historyEnd < 2025 ? `The compatible evidence retained for this first pass spans ${historyStart}–${historyEnd}; absent years are not imputed.` : undefined,
      metric: node.calibration_metric?.metric_name ?? node.metric_contract?.metric_name ?? node.description,
      earlyBaseline: `Use the earliest compatible state in the cited record beginning ${historyStart}; no older value is invented.`,
      recentState: node.description,
      currentState: `${node.description} Evidence source reviewed through ${record.evidenceAudit.sourceAsOf}.`,
      fullRecordTrend: 'No universal trend direction is inferred automatically; the separate outlook remains mixed until reviewed.',
      observedImpact: `${node.humanImpact?.summary ?? ''} ${node.planetImpact?.summary ?? ''}`.trim(),
      attribution: 'The evidence supports a structured current-state classification but not a complete common-unit attributable-loss model.',
      limitations: 'This deterministic first pass uses authored consequence boundaries, declared reach and persistence. It requires node-by-node review and may not substitute for a source-native impact model.',
      evidenceReferences,
    },
    outlook: {
      horizon: policy.horizon, scenario: policy.scenario, direction: 'mixed', confidence: 'C',
      basis: 'No automatic future direction is inferred from the current measurement. A compatible projection must replace this mixed placeholder during review.',
      evidenceReferences,
    },
    applicableDomains: domains,
    components: {
      human: component(node, 'human', domains.includes('human'), evidenceReferences, confidence, humanValues),
      ecosystem: component(node, 'ecosystem', domains.includes('ecosystem'), evidenceReferences, confidence, ecosystemValues),
    },
    decisionTrace: {
      method: 'deterministic_authored_consequence_first_pass_v1',
      severity: 'Terminal-outcome language in authored human and planetary consequence copy.',
      reach: `Declared node reach: ${node.context?.reach ?? 'missing'}.`,
      persistence: `Authored time horizon and persistence language: ${node.humanImpact?.timeHorizon ?? 'missing'} / ${node.planetImpact?.timeHorizon ?? 'missing'}.`,
      prohibitedInputs: ['legacy TULIP score', 'impactScore', 'baseValue', 'vector', 'graph degree', 'source count'],
    },
    reviewStatus: 'first_pass_requires_node_review',
  };
}

const issueRows = [];
const responseRows = [];
for (const [nodeId, record] of Object.entries(assessment.records)) {
  const node = byId.get(nodeId);
  assert(node, `Unknown catalogue node ${nodeId}`);
  if (record.nodeKind === 'response') {
    const result = evaluateInternalTulipCandidate({ ...node, node_kind: 'response' }, null, policy);
    assert.equal(result.status, 'not_applicable');
    responseRows.push({ nodeId, name: node.name, result });
    continue;
  }
  const manual = manualById.get(nodeId);
  const candidate = manual?.candidate ?? buildAutomaticCandidate(node, record);
  const result = manual?.result ?? evaluateInternalTulipCandidate(node, candidate, { ...policy, sourceDigest: record.sourceDigest });
  assert.equal(result.status, 'internal_candidate', `${nodeId}: ${result.reasons.join(', ')}`);
  issueRows.push({ nodeId, name: node.name, assessmentMode: manual ? 'authored_pilot_first_pass' : 'deterministic_catalogue_first_pass', candidate, result });
}

assert.equal(issueRows.length, 354);
assert.equal(responseRows.length, 27);
assert.equal(new Set([...issueRows, ...responseRows].map(row => row.nodeId)).size, 381);
assert(issueRows.every(row => row.candidate.components.human.evidenceReferences.length && row.candidate.components.ecosystem.evidenceReferences.length));

const gradeCounts = Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map(letter => [letter, issueRows.filter(row => row.result.grade.letter === letter).length]));
const confidenceCounts = Object.fromEntries(['A', 'B', 'C', 'D'].map(letter => [letter, issueRows.filter(row => row.result.confidence === letter).length]));
const domainCounts = {
  both: issueRows.filter(row => row.candidate.applicableDomains.length === 2).length,
  humanOnly: issueRows.filter(row => row.candidate.applicableDomains.length === 1 && row.candidate.applicableDomains[0] === 'human').length,
  ecosystemOnly: issueRows.filter(row => row.candidate.applicableDomains.length === 1 && row.candidate.applicableDomains[0] === 'ecosystem').length,
};
const gradeIndexForValue = value => value < 2.8 ? 0 : value < 4.6 ? 1 : value < 6.4 ? 2 : value < 8.2 ? 3 : 4;
for (const row of issueRows) {
  const flags = [];
  const deterministic = row.assessmentMode === 'deterministic_catalogue_first_pass';
  const oldEvidence = row.candidate.currentWindow.end < 2021;
  const singleDomain = row.candidate.applicableDomains.length === 1;
  const automatedExtreme = deterministic && row.result.grade.letter === 'E';
  const multipleBandRange = gradeIndexForValue(row.result.uncertainty.upper) - gradeIndexForValue(row.result.uncertainty.lower) >= 2;
  if (deterministic) flags.push('deterministic_classification');
  if (oldEvidence) flags.push('evidence_ends_before_2021');
  if (singleDomain) flags.push('single_domain_decision');
  if (automatedExtreme) flags.push('automated_extreme_candidate');
  if (multipleBandRange) flags.push('range_crosses_multiple_bands');
  if (['C', 'D'].includes(row.result.confidence)) flags.push('structured_or_family_evidence');
  row.reviewFlags = flags;
  row.reviewPriority = automatedExtreme || oldEvidence || singleDomain ? 'high' : 'medium';
}
const reviewCounts = {
  high: issueRows.filter(row => row.reviewPriority === 'high').length,
  medium: issueRows.filter(row => row.reviewPriority === 'medium').length,
  oldEvidence: issueRows.filter(row => row.reviewFlags.includes('evidence_ends_before_2021')).length,
  automatedExtreme: issueRows.filter(row => row.reviewFlags.includes('automated_extreme_candidate')).length,
  multipleBandRange: issueRows.filter(row => row.reviewFlags.includes('range_crosses_multiple_bands')).length,
};
const summary = {
  version: INTERNAL_CALIBRATION_VERSION,
  method: 'authored_pilot_plus_deterministic_catalogue_first_pass_v1',
  status: 'first_pass_complete_node_review_required',
  preparedOn: '2026-09-22',
  counts: { catalogue: 381, issues: issueRows.length, responses: responseRows.length, authoredPilot: issueRows.filter(row => row.assessmentMode === 'authored_pilot_first_pass').length, deterministicRemaining: issueRows.filter(row => row.assessmentMode === 'deterministic_catalogue_first_pass').length },
  gradeCounts,
  confidenceCounts,
  domainCounts,
  reviewCounts,
  productionRatingsEnabled: 0,
};

const outDir = resolve(root, 'artifacts/tulip-calibration-2026-09-22');
await writeFile(resolve(outDir, 'internal-all-node-first-pass-candidates.json'), JSON.stringify({ ...summary, issues: issueRows, responses: responseRows }, null, 2) + '\n');
await writeFile(resolve(outDir, 'internal-assessment-progress.json'), JSON.stringify({ ...summary, issueNodesAwaitingFirstPass: 0, nodeReviewsCompleted: 0 }, null, 2) + '\n');

const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csvRows = [
  ['Node ID', 'Node', 'Assessment mode', 'Value', 'Grade', 'Low', 'High', 'Evidence confidence', 'Applicable domains', 'Outlook', 'Review priority', 'Review flags', 'Review status'],
  ...issueRows.map(row => [row.nodeId, row.name, row.assessmentMode, row.result.value, `${row.result.grade.letter} — ${row.result.grade.label}`, row.result.uncertainty.lower, row.result.uncertainty.upper, row.result.confidence, row.candidate.applicableDomains.join('+'), row.result.outlook.direction, row.reviewPriority, row.reviewFlags.join(';'), row.candidate.reviewStatus]),
  ...responseRows.map(row => [row.nodeId, row.name, 'response_control', '', 'Response', '', '', '', '', '', '', '', 'excluded_from_danger_scoring']),
];
await writeFile(resolve(outDir, 'internal-all-node-first-pass-summary.csv'), csvRows.map(row => row.map(csvCell).join(',')).join('\n') + '\n');

const priorityOrder = { high: 0, medium: 1 };
const gradeOrder = { E: 0, D: 1, C: 2, B: 3, A: 4 };
const reviewQueue = [...issueRows].sort((a, b) =>
  priorityOrder[a.reviewPriority] - priorityOrder[b.reviewPriority]
  || gradeOrder[a.result.grade.letter] - gradeOrder[b.result.grade.letter]
  || a.name.localeCompare(b.name)
);
const reviewQueueRows = [
  ['Review priority', 'Node ID', 'Node', 'Candidate grade', 'Value', 'Low', 'High', 'Evidence confidence', 'Applicable domains', 'Evidence through', 'Review flags'],
  ...reviewQueue.map(row => [row.reviewPriority, row.nodeId, row.name, row.result.grade.letter, row.result.value, row.result.uncertainty.lower, row.result.uncertainty.upper, row.result.confidence, row.candidate.applicableDomains.join('+'), row.candidate.currentWindow.end, row.reviewFlags.join(';')]),
];
await writeFile(resolve(outDir, 'internal-node-review-queue.csv'), reviewQueueRows.map(row => row.map(csvCell).join(',')).join('\n') + '\n');

const markdown = `# TULIP catalogue first-pass assessment\n\nStatus: **all 354 issue nodes have internal first-pass candidates; node-by-node review is required**. The 27 response nodes remain outside danger scoring. No candidate is enabled in production.\n\n- Authored 20-node pilot issues: ${summary.counts.authoredPilot}\n- Deterministic remaining issues: ${summary.counts.deterministicRemaining}\n- Grade distribution: ${Object.entries(gradeCounts).map(([grade, count]) => `${grade} ${count}`).join(', ')}\n- Evidence confidence: ${Object.entries(confidenceCounts).map(([grade, count]) => `${grade} ${count}`).join(', ')}\n- Domain treatment: both ${domainCounts.both}, people only ${domainCounts.humanOnly}, nature only ${domainCounts.ecosystemOnly}\n- Review priority: high ${reviewCounts.high}, medium ${reviewCounts.medium}\n- Specific flags: old evidence ${reviewCounts.oldEvidence}, automated extreme candidates ${reviewCounts.automatedExtreme}, ranges crossing multiple grade bands ${reviewCounts.multipleBandRange}\n\nThe deterministic pass uses authored consequence language, declared reach and persistence. It does not read legacy TULIP values, graph connectivity, source counts or the old vector. Wide one-level bounds remain until each node is reviewed.\n\nThe absence of A candidates and the concentration in C and D are visible calibration findings. They may reflect a catalogue focused on material harms, but they may also mean the anchors or deterministic language rules compress the scale. The review must test that before any candidate becomes a public rating.\n`;
await writeFile(resolve(outDir, 'internal-all-node-first-pass-report.md'), markdown);
console.log(JSON.stringify(summary, null, 2));
