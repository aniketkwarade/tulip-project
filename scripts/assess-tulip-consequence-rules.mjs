import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CONSEQUENCE_METHOD_VERSION, consequenceIndex, scoreCoherentAxes,
} from '../src/tulip-consequence-scoring.js';

const root = new URL('../', import.meta.url);
const output = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const sources = {
  reviewedCandidates: 'artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json',
  publicAssessments: 'public/tulip-assessments.json',
  frozenBenchmarks: 'docs/tulip-calibration/score-meaning-anchors.json',
  rules: 'src/tulip-consequence-scoring.js',
};
const inputs = Object.fromEntries(Object.entries(sources).map(([key, path]) => {
  const bytes = readFileSync(new URL(path, root));
  return [key, { path, sha256: createHash('sha256').update(bytes).digest('hex'), bytes }];
}));
const candidates = JSON.parse(inputs.reviewedCandidates.bytes);
const publicData = JSON.parse(inputs.publicAssessments.bytes);
const anchors = JSON.parse(inputs.frozenBenchmarks.bytes);
const axisKeys = ['severity', 'reach', 'persistence'];
const oneDecimal = value => Math.round((value + 1e-9) * 10) / 10;
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2;
};
const zero = () => ({ severity: 0, reach: 0, persistence: 0 });
const mixedZero = axes => axisKeys.some(key => axes[key] === 0) && axisKeys.some(key => axes[key] > 0);
const same = (a, b) => Math.abs(a - b) < 1e-9;

assert.equal(candidates.issues.length, 354);
assert.equal(candidates.responses.length, 27);
assert.equal(Object.keys(publicData.records).length, 381);
assert.equal(anchors.anchors.length, 4);

const records = [];
for (const item of candidates.issues) {
  const candidate = item.candidate;
  const domains = candidate.applicableDomains;
  const old = publicData.records[item.nodeId];
  assert(old && old.nodeKind === 'issue' && old.value === item.result.value);
  assert(domains.length >= 1 && domains.length <= 2);
  const centralViolations = domains.filter(domain => mixedZero(candidate.components[domain].central));
  const lowerViolations = domains.filter(domain => mixedZero(candidate.components[domain].lower));
  const upperViolations = domains.filter(domain => mixedZero(candidate.components[domain].upper));
  const coherentLower = Object.fromEntries(domains.map(domain => [domain,
    lowerViolations.includes(domain) ? zero() : candidate.components[domain].lower]));
  const centralAxes = Object.fromEntries(domains.map(domain => [domain, candidate.components[domain].central]));
  const upperAxes = Object.fromEntries(domains.map(domain => [domain, candidate.components[domain].upper]));
  const central = scoreCoherentAxes(centralAxes);
  const lower = scoreCoherentAxes(coherentLower);
  const upper = scoreCoherentAxes(upperAxes);
  assert(lower && upper);
  const legacyRaw = 1 + 9 * domains.reduce((total, domain) => {
    const axes = candidate.components[domain].central;
    return total + axisKeys.reduce((axisTotal, key) => axisTotal + axes[key], 0) / 12;
  }, 0) / domains.length;
  assert.equal(oneDecimal(legacyRaw), old.value);
  if (!centralViolations.length) {
    assert(central);
    assert(lower.rawValue <= central.rawValue + 1e-9 && central.rawValue <= upper.rawValue + 1e-9);
  }
  records.push({
    nodeId: item.nodeId, name: item.name, domains, publishedValue: old.value,
    legacyRaw, confidence: old.confidence,
    conditionalValue: central?.value ?? null, conditionalRaw: central?.rawValue ?? null,
    conditionalComponents: central?.components ?? null,
    conservativeLower: lower.value, conditionalUpper: upper.value,
    centralViolations, lowerViolations, upperViolations,
    reviewStatus: central ? 'conditional_on_legacy_axis_evidence' : 'needs_attributable_consequence_evidence',
    harmEvidenceReferences: domains.flatMap(domain => candidate.components[domain].evidenceReferences),
    existingReasoning: centralViolations.length ? Object.fromEntries(centralViolations.map(domain => [domain, {
      axes: candidate.components[domain].central,
      attribution: candidate.components[domain].attribution,
      currentWindow: candidate.currentWindow,
    }])) : undefined,
  });
}

for (const response of candidates.responses) {
  assert.equal(publicData.records[response.nodeId].value, null);
  assert.equal(publicData.records[response.nodeId].status, 'not_applicable');
}

const computable = records.filter(row => row.conditionalValue !== null);
const unresolved = records.filter(row => row.conditionalValue === null);
const lowerIssueCount = records.filter(row => row.lowerViolations.length > 0).length;
const upperIssueCount = records.filter(row => row.upperViolations.length > 0).length;
const ordered = [...computable].sort((a, b) => Math.abs(b.conditionalRaw - b.legacyRaw) - Math.abs(a.conditionalRaw - a.legacyRaw));
let reversedPairs = 0;
let tiedPairsSplit = 0;
const reversalExamples = [];
for (let i = 0; i < computable.length; i++) for (let j = i + 1; j < computable.length; j++) {
  const a = computable[i], b = computable[j];
  const before = a.legacyRaw - b.legacyRaw;
  const after = a.conditionalRaw - b.conditionalRaw;
  if (same(before, 0) && !same(after, 0)) tiedPairsSplit++;
  if (!same(before, 0) && !same(after, 0) && before * after < 0) {
    reversedPairs++;
    if (reversalExamples.length < 12) reversalExamples.push({ nodes: [a.nodeId, b.nodeId], before: [a.publishedValue, b.publishedValue], after: [a.conditionalValue, b.conditionalValue] });
  }
}

const checkKnots = anchors.anchors.map(anchor => {
  const human = Object.fromEntries(axisKeys.map((key, index) => [key, anchor.humanReference.legacyAxes[index]]));
  const ecosystem = Object.fromEntries(axisKeys.map((key, index) => [key, anchor.ecosystemReference.legacyAxes[index]]));
  const result = scoreCoherentAxes({ human, ecosystem });
  assert.equal(result.value, anchor.targetScore);
  return { target: anchor.targetScore, humanIndex: consequenceIndex(human), ecosystemIndex: consequenceIndex(ecosystem), result: result.value };
});

// A one-axis level change is a practical measure of how much uncertain source
// classification can move the result. Use active axes only; zero states require
// a separate evidence decision rather than a fabricated fractional consequence.
const sensitivity = [];
for (const item of candidates.issues) {
  const row = records.find(record => record.nodeId === item.nodeId);
  if (row.conditionalValue === null) continue;
  const baseline = Object.fromEntries(item.candidate.applicableDomains.map(domain => [domain, item.candidate.components[domain].central]));
  const shifts = [];
  for (const domain of item.candidate.applicableDomains) for (const axis of axisKeys) for (const delta of [-1, 1]) {
    const level = baseline[domain][axis] + delta;
    if (level <= 0 || level > 4) continue;
    const changed = { ...baseline, [domain]: { ...baseline[domain], [axis]: level } };
    const scored = scoreCoherentAxes(changed);
    if (scored) shifts.push(Math.abs(scored.rawValue - row.conditionalRaw));
  }
  sensitivity.push({ nodeId: row.nodeId, maximumOneLevelChange: Math.max(...shifts) });
}

const summary = {
  catalogue: { issues: records.length, responses: candidates.responses.length, conditionallyScorable: computable.length,
    requiringConsequenceEvidence: unresolved.length, lowerBoundComponentsNeedingJointReview: records.reduce((n, r) => n + r.lowerViolations.length, 0),
    lowerBoundAffectedNodes: lowerIssueCount, upperBoundAffectedNodes: upperIssueCount },
  display: { currentDistinct: new Set(records.map(r => r.publishedValue)).size,
    currentDistinctOnComparableNodes: new Set(computable.map(r => r.publishedValue)).size,
    conditionalDistinct: new Set(computable.map(r => r.conditionalValue)).size,
    currentMedianOnComparableNodes: median(computable.map(r => r.publishedValue)),
    conditionalMedian: median(computable.map(r => r.conditionalValue)),
    conditionalAtLeastSix: computable.filter(r => r.conditionalValue >= 6).length,
    conditionalChanged: computable.filter(r => r.conditionalValue !== r.publishedValue).length,
    conditionalRangesWiderThanThree: computable.filter(r => r.conditionalUpper - r.conservativeLower > 3).length },
  rankings: { reversedPairs, previouslyTiedPairsSplit: tiedPairsSplit, examples: reversalExamples },
  sensitivity: { largestSingleLevelChange: Math.max(...sensitivity.map(r => r.maximumOneLevelChange)),
    medianLargestSingleLevelChangePerNode: median(sensitivity.map(r => r.maximumOneLevelChange)) },
  benchmarkMatches: checkKnots,
};

const files = Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, { path: value.path, sha256: value.sha256 }]));
const result = { version: 'tulip_consequence_rules_audit_2026_09_27_v1', methodVersion: CONSEQUENCE_METHOD_VERSION,
  status: 'experimental_rules_with_conditional_legacy_axis_projection',
  scope: 'All 354 published issue candidates and 27 response controls. The conditional values reuse v6 axes; this is not a new source assessment or a publishable rating migration.',
  inputs: files, summary, records, sensitivity };

mkdirSync(output, { recursive: true });
writeFileSync(new URL('results.json', output), JSON.stringify(result, null, 2) + '\n');
const csvCell = value => `"${String(value).replaceAll('"', '""')}"`;
const csv = rows => rows.map(row => row.map(csvCell).join(',')).join('\n') + '\n';
writeFileSync(new URL('node-audit.csv', output), csv([
  ['node_id', 'name', 'published_score', 'conditional_score', 'conservative_low', 'conditional_high', 'review_status', 'confidence', 'central_invalid_domains', 'lower_invalid_domains'],
  ...records.map(r => [r.nodeId, r.name, r.publishedValue.toFixed(1), r.conditionalValue?.toFixed(1) ?? '', r.conservativeLower.toFixed(1), r.conditionalUpper.toFixed(1), r.reviewStatus, r.confidence, r.centralViolations.join('+'), r.lowerViolations.join('+')]),
]));
const largestRows = ordered.slice(0, 12).map(r => `| ${r.name} | ${r.publishedValue.toFixed(1)} | ${r.conditionalValue.toFixed(1)} | ${r.confidence} |`).join('\n');
const unresolvedRows = unresolved.map(r => `| ${r.name} | ${r.publishedValue.toFixed(1)} | ${r.centralViolations.join(', ')} |`).join('\n');
const markdown = `# Consequence-rule experiment and catalogue assessment

Prepared 27 September 2026. Method: \`${CONSEQUENCE_METHOD_VERSION}\`. This assessment precedes any public score migration.

## Result

The experimental method now requires an attributable consequence, the affected people or damaged ecosystem distribution, and the duration of that consequence or its recovery. Severity, reach and duration must describe the same affected group, geography and assessment period. A verified absence of harm requires all three axes to be zero. An unknown consequence cannot be entered as zero, and exposure or a long-lived physical state cannot fill the reach or duration of harm. Each active domain is converted on the [frozen benchmark map](../../docs/tulip-calibration/score-meaning-anchors.json) before the people and nature results are averaged.

The method gives severity 50%, affected reach 25%, and consequence duration 25%. This is a stated TULIP design choice. It separates the previous tie: mild widespread long-lived loss scores **6.0**, the severe reference scores **7.0**, and severe local permanent loss scores **7.7**. The four frozen reference cases still map to **3.0, 5.0, 7.0, 9.0**; complete maximum axes map to 10.0. The upper segment is steep, so source classification near the ceiling needs particular scrutiny.

## Assessment of the existing catalogue

- ${summary.catalogue.conditionallyScorable} of ${summary.catalogue.issues} issue candidates have coherent central axis combinations under the new rule. Their values below are **conditional projections** from existing v6 axis judgments, not fresh source assessments.
- ${summary.catalogue.requiringConsequenceEvidence} issue candidates fail the new central consequence rule. They retain numerical public scores under the existing published method while their attributable-consequence evidence is resolved.
- ${summary.catalogue.lowerBoundComponentsNeedingJointReview} lower-bound components across ${summary.catalogue.lowerBoundAffectedNodes} nodes contain a zero on one axis and positive values on another. For the conditional comparison, these lower cases conservatively become a coherent all-zero component. Their joint bounds require review before migration.
- All ${summary.catalogue.responses} response nodes remain outside danger scoring.
- The conditional median is **${summary.display.conditionalMedian.toFixed(1)}** versus **${summary.display.currentMedianOnComparableNodes.toFixed(1)}** on the same ${computable.length} nodes. Conditional scores have **${summary.display.conditionalDistinct}** distinct displayed values versus **${summary.display.currentDistinctOnComparableNodes}** for those current nodes; ${summary.display.conditionalChanged} of the ${computable.length} displayed issue values change.
- ${summary.rankings.reversedPairs} previously strictly ordered node pairs reverse under the experimental rule, and ${summary.rankings.previouslyTiedPairsSplit} previously tied pairs separate. These are effects of declared policy changes, not proof of a more accurate ranking.
- The largest observed one-level input sensitivity is **${summary.sensitivity.largestSingleLevelChange.toFixed(2)}** points for one node; the median of each node's largest one-level change is **${summary.sensitivity.medianLargestSingleLevelChangePerNode.toFixed(2)}**. This is especially material with the catalogue's wide evidence bounds.

## Two assessments needing attributable-consequence evidence

| Node | Current public score | Active domain rejected |
| --- | ---: | --- |
${unresolvedRows}

For [Glacier-Fed Water Dependence](https://www.unesco.org/reports/wwdr/en/2025), the cited global report gives a dependent population, not a count experiencing attributable shortage, illness or lost service. For [Surface Water Storage Instability](https://www.unwater.org/publications/progress-water-related-ecosystems-2024-update), the cited 93.1 million are people living in basins with receding water, not a measured count of people harmed. Their stored central human severity is zero while reach and persistence are positive. The existing lower bounds also express uncertainty as incompatible axis combinations. Neither record can be corrected by treating all dependent or exposed people as harmed, nor by declaring the unknown human consequence to be measured zero.

The resolution path is node-specific: identify an outcome such as current attributable shortage or service interruption; estimate who experienced it and for how long with compatible geography and period; document the counterfactual and uncertainty. If direct estimates are unavailable, the existing structured or family estimate route can still give a numerical candidate, but its affected count, severity and duration must refer to harm and have an explicit rationale. The public number should be recalculated only from that completed assessment.

## Largest conditional score movements

| Node | Current | Conditional experiment | Current evidence confidence |
| --- | ---: | ---: | --- |
${largestRows}

All ${records.length} decisions are in [node-audit.csv](./node-audit.csv), with per-domain reasoning for the two rejected cases in [results.json](./results.json). A change in score here means the method changed; it does not represent a new measurement. No official rating, confidence word, search result, PDF or native snapshot has been overwritten by this experiment.

## Method tests and next evidence gate

The tests cover all four reference cases in the people-only, nature-only and mixed contexts; a measured-zero component; missing and exposure-only inputs; mismatched affected groups and periods; continuous reach across the 9,999/10,000 boundary; monotonicity; domain exclusions; and response exclusion. A numeric affected count or ecosystem percentage can be interpolated between fixed reference cases. Existing published candidates do not yet record those numbers and consequence periods in the typed format this method requires. The conditional catalogue projection therefore uses their prior ordinal levels and cannot claim to have resolved within-bin ties.

The [weight sensitivity comparison](./weight-sensitivity.json) refits the same benchmark map under four severity weights. The 50/25/25 candidate is not determined by the four matched benchmark cases: equal weights also fit all four and preserve the old ties. The chosen trade-off must be checked against independently judged mixed profiles. For example, Global Temperature's existing 3/4/4 inputs in both domains produce 8.3 rather than 9.3 because the revised method places more weight on the existing severity level of 3. That change is a policy consequence, not a new claim that warming is less harmful. A score from one broad endpoint could undercount other genuine outcomes, while taking the worst severity from a small subgroup and the total reach of a mild group would overcount. The typed rule requires one compatible affected group and a documented endpoint-coverage decision, but editorial source review remains necessary.

Before enabling this method for real ratings, the current records need the typed consequence evidence, starting with the two rejected nodes and the ${summary.catalogue.lowerBoundAffectedNodes} nodes with incoherent lower-bound components. Review additional rank reversals and one-level sensitivity using their cited evidence. A [separate Python Decimal check](./verification.json) reproduces the 352 conditional values and two rejections; it checks arithmetic, not scientific validity. All four benchmarks and the 50/25/25 weights are internal policy choices; tests show consistency with them, not independent scientific validation.

Sources: [experimental rule code](../../src/tulip-consequence-scoring.js), [reproducible catalogue audit](../../scripts/assess-tulip-consequence-rules.mjs), [benchmark cases](../../docs/tulip-calibration/score-meaning-anchors.json), [reviewed candidate inputs](../tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json).
`;
writeFileSync(new URL('report.md', output), markdown);
console.log(JSON.stringify({ report: fileURLToPath(new URL('report.md', output)), ...summary }, null, 2));
