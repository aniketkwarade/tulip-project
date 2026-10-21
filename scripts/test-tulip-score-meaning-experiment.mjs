import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { evaluateInternalTulipCandidate } from '../src/tulip-internal-calibration.js';

const root = new URL('../', import.meta.url);
const output = new URL('artifacts/tulip-score-meaning-test-2026-09-27/', root);
const files = {
  anchors: 'docs/tulip-calibration/score-meaning-anchors.json',
  plan: 'docs/tulip-calibration/score-formula-experiment-plan.md',
  catalogue: 'artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json',
  registry: 'public/tulip-assessments.json',
  policy: 'src/tulip-score-policy.json',
  evaluator: 'src/tulip-internal-calibration.js',
  experimentScript: 'scripts/test-tulip-score-meaning-experiment.mjs',
  verificationScript: 'scripts/verify-tulip-score-meaning-experiment.py',
  mobile: 'Stitch Import/tulip-mobile/src/mobile-inspector-snapshot.json',
  native: 'iOS/TULIPiOS/NativeData/mobile-inspector-snapshot.json',
};
const bytes = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(new URL(path, root))])));
const hashes = Object.fromEntries(Object.entries(bytes).map(([key, buffer]) => [key, createHash('sha256').update(buffer).digest('hex')]));
const parse = key => JSON.parse(bytes[key]);
const anchors = parse('anchors');
const catalogue = parse('catalogue');
const registry = parse('registry');
const policy = parse('policy');
const mobile = parse('mobile');
const native = parse('native');
const axes = ['severity', 'reach', 'persistence'];
const round = value => Math.round((value + 1e-9) * 10) / 10;
const sum = values => values.reduce((total, value) => total + value, 0);
const mean = values => sum(values) / values.length;
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const close = (a, b, label) => assert(Math.abs(a - b) < 1e-9, `${label}: ${a} != ${b}`);
const domainIndex = vector => sum(Array.isArray(vector) ? vector : axes.map(key => vector[key])) / 12;
const mapped = x => x <= 0.75 ? 1 + 8 * x : 7 + 12 * (x - 0.75);
const variants = [
  { id: 'linear', name: 'Current linear', placement: 'after', convert: x => 1 + 9 * x },
  { id: 'power_after', name: 'Power 1.2 after combining', placement: 'after', convert: x => 1 + 9 * x ** 1.2 },
  { id: 'power_domains', name: 'Power 1.2 within each domain', placement: 'before', convert: x => 1 + 9 * x ** 1.2 },
  { id: 'mapped_after', name: 'Benchmark map after combining', placement: 'after', convert: mapped },
  { id: 'mapped_domains', name: 'Benchmark map within each domain', placement: 'before', convert: mapped },
];
const combine = (indices, variant, peopleWeight = 0.5) => {
  const keys = Object.keys(indices);
  assert(keys.length > 0 && keys.every(key => ['human', 'ecosystem'].includes(key)));
  assert(Object.values(indices).every(value => Number.isFinite(value) && value >= 0 && value <= 1));
  if (keys.length === 1) return variant.convert(indices[keys[0]]);
  const weighted = values => peopleWeight * values.human + (1 - peopleWeight) * values.ecosystem;
  return variant.placement === 'after' ? variant.convert(weighted(indices))
    : weighted(Object.fromEntries(keys.map(key => [key, variant.convert(indices[key])])));
};
const indicesFor = (candidate, estimate = 'central') => Object.fromEntries(candidate.applicableDomains.map(key => [key, domainIndex(candidate.components[key][estimate])]));
const csv = rows => rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n') + '\n';

assert.equal(anchors.version, 'tulip_score_meaning_anchors_2026_09_27_v1');
assert.equal(catalogue.issues.length, 354);
assert.equal(catalogue.responses.length, 27);
assert.equal(Object.keys(registry.records).length, 381);
const parity = { issues: 0, responses: 0, estimatesPerIssue: 3, webMobileNative: 0 };
for (const issue of catalogue.issues) {
  const record = registry.records[issue.nodeId];
  assert.equal(issue.candidate.sourceDigest, record.sourceDigest, `${issue.nodeId} source receipt`);
  const evaluated = evaluateInternalTulipCandidate({ id: issue.nodeId, node_kind: 'issue' }, issue.candidate, { ...policy, sourceDigest: record.sourceDigest });
  assert.equal(evaluated.status, 'internal_candidate', `${issue.nodeId}: ${evaluated.reasons.join(', ')}`);
  for (const estimate of ['lower', 'central', 'upper']) {
    const actual = round(combine(indicesFor(issue.candidate, estimate), variants[0]));
    const stored = estimate === 'central' ? issue.result.value : issue.result.uncertainty[estimate];
    const exported = estimate === 'central' ? record.value : record.uncertainty[estimate];
    const runtime = estimate === 'central' ? evaluated.value : evaluated.uncertainty[estimate];
    assert.equal(actual, stored, `${issue.nodeId} stored ${estimate}`);
    assert.equal(actual, exported, `${issue.nodeId} exported ${estimate}`);
    assert.equal(actual, runtime, `${issue.nodeId} evaluator ${estimate}`);
  }
  parity.issues++;
}
for (const response of catalogue.responses) {
  assert.equal(response.result.value, null);
  assert.equal(registry.records[response.nodeId].value, null);
  assert.equal(registry.records[response.nodeId].status, 'not_applicable');
  assert.equal(evaluateInternalTulipCandidate({ id: response.nodeId, node_kind: 'response' }, null, policy).value, null);
  parity.responses++;
}
for (const item of [...catalogue.issues, ...catalogue.responses]) {
  const key = item.name.toLowerCase();
  assert.deepEqual(mobile[key].assessment, registry.records[item.nodeId], `${item.nodeId} mobile`);
  assert.deepEqual(native[key].assessment, registry.records[item.nodeId], `${item.nodeId} native`);
  parity.webMobileNative++;
}

const anchorResults = anchors.anchors.map(anchor => {
  const indices = { human: domainIndex(anchor.humanReference.legacyAxes), ecosystem: domainIndex(anchor.ecosystemReference.legacyAxes) };
  return { target: anchor.targetScore, indices, results: Object.fromEntries(variants.map(variant => {
    const raw = combine(indices, variant);
    return [variant.id, { raw, displayed: round(raw), absoluteError: Math.abs(raw - anchor.targetScore) }];
  })) };
});
const anchorSummary = Object.fromEntries(variants.map(variant => {
  const errors = anchorResults.map(row => row.results[variant.id].absoluteError);
  return [variant.id, { meanAbsoluteError: mean(errors), maximumAbsoluteError: Math.max(...errors), withinQuarterPoint: errors.filter(e => e <= 0.25 + 1e-9).length, withinHalfPoint: errors.filter(e => e <= 0.5 + 1e-9).length }];
}));
const mixedPairs = anchors.anchors.flatMap(h => anchors.anchors.map(e => {
  const indices = { human: domainIndex(h.humanReference.legacyAxes), ecosystem: domainIndex(e.ecosystemReference.legacyAxes) };
  const target = (h.targetScore + e.targetScore) / 2;
  return { humanTarget: h.targetScore, ecosystemTarget: e.targetScore, target, results: Object.fromEntries(variants.map(v => [v.id, { raw: combine(indices, v), displayed: round(combine(indices, v)), absoluteError: Math.abs(combine(indices, v) - target) }])) };
}));
const mixedSummary = Object.fromEntries(variants.map(v => [v.id, { meanAbsoluteError: mean(mixedPairs.map(p => p.results[v.id].absoluteError)), maximumAbsoluteError: Math.max(...mixedPairs.map(p => p.results[v.id].absoluteError)) }]));

const profiles = [];
for (let severity = 0; severity <= 4; severity++) for (let reach = 0; reach <= 4; reach++) for (let persistence = 0; persistence <= 4; persistence++) profiles.push({ severity, reach, persistence });
const grid = profiles.flatMap(h => profiles.map(e => ({ human: domainIndex(h), ecosystem: domainIndex(e), h, e })));
const invariantResults = {};
for (const variant of variants) {
  let singleChecks = 0, combinedChecks = 0, monotoneChecks = 0, averagingDifference = 0;
  for (const profile of profiles) {
    const value = combine({ human: domainIndex(profile) }, variant);
    assert(value >= 1 && value <= 10);
    singleChecks++;
  }
  for (const item of grid) {
    const indices = { human: item.human, ecosystem: item.ecosystem };
    const value = combine(indices, variant);
    assert(value >= 1 && value <= 10);
    combinedChecks++;
    const averageOfDomainScores = (variant.convert(item.human) + variant.convert(item.ecosystem)) / 2;
    averagingDifference = Math.max(averagingDifference, Math.abs(value - averageOfDomainScores));
    for (const domain of ['human', 'ecosystem']) for (const axis of axes) {
      if (item[domain === 'human' ? 'h' : 'e'][axis] >= 4) continue;
      const raised = { ...indices, [domain]: indices[domain] + 1 / 12 };
      assert(combine(raised, variant) >= value - 1e-9);
      monotoneChecks++;
    }
  }
  close(combine({ human: 0, ecosystem: 0 }, variant), 1, variant.id + ' floor');
  close(combine({ human: 1, ecosystem: 1 }, variant), 10, variant.id + ' ceiling');
  invariantResults[variant.id] = { singleProfiles: singleChecks, combinedProfiles: combinedChecks, monotonicityComparisons: monotoneChecks, endpointsPass: true, maximumDifferenceFromMeanOfDomainScores: averagingDifference };
}

const rows = catalogue.issues.map(issue => {
  const indices = indicesFor(issue.candidate);
  const results = Object.fromEntries(variants.map(variant => {
    const low = combine(indicesFor(issue.candidate, 'lower'), variant);
    const raw = combine(indices, variant);
    const high = combine(indicesFor(issue.candidate, 'upper'), variant);
    assert(low <= raw + 1e-9 && raw <= high + 1e-9);
    const axisChanges = [];
    for (const domain of issue.candidate.applicableDomains) for (const axis of axes) for (const direction of [-1, 1]) {
      const level = issue.candidate.components[domain].central[axis] + direction;
      if (level < 0 || level > 4) continue;
      axisChanges.push(Math.abs(combine({ ...indices, [domain]: indices[domain] + direction / 12 }, variant) - raw));
    }
    const alternativeWeights = [0.3, 0.7].map(w => combine(indices, variant, w));
    return [variant.id, { raw, displayed: round(raw), lower: round(low), upper: round(high), rawRangeWidth: high - low, displayedRangeWidth: round(round(high) - round(low)), oneAxisMaximumChange: Math.max(...axisChanges), weightMaximumChange: Math.max(...alternativeWeights.map(v => Math.abs(v - raw))), alternativeWeights }];
  }));
  return { nodeId: issue.nodeId, name: issue.name, applicableDomains: issue.candidate.applicableDomains, confidence: registry.records[issue.nodeId].confidence, indices, results };
});
const catalogueSummary = Object.fromEntries(variants.map(variant => {
  const values = rows.map(row => row.results[variant.id].displayed);
  let strictRankReversals = 0, tiedPairsSplit = 0;
  const examples = [];
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    const before = rows[a].results.linear.raw - rows[b].results.linear.raw;
    const after = rows[a].results[variant.id].raw - rows[b].results[variant.id].raw;
    if (Math.abs(before) < 1e-9 && Math.abs(after) > 1e-9) tiedPairsSplit++;
    if (Math.abs(before) > 1e-9 && Math.abs(after) > 1e-9 && before * after < 0) {
      strictRankReversals++;
      if (examples.length < 5) examples.push({ a: rows[a].nodeId, b: rows[b].nodeId, before: [rows[a].results.linear.raw, rows[b].results.linear.raw], after: [rows[a].results[variant.id].raw, rows[b].results[variant.id].raw] });
    }
  }
  const unchangedWithUnrelatedNode = [...rows, { indices: { human: 1 / 12, ecosystem: 7 / 12 } }].map(r => combine(r.indices, variant));
  rows.forEach((row, i) => close(row.results[variant.id].raw, unchangedWithUnrelatedNode[i], variant.id + ' catalogue independence'));
  return [variant.id, {
    mean: mean(values), median: median(values), minimum: Math.min(...values), maximum: Math.max(...values), distinctDisplayedScores: new Set(values).size,
    displayedCounts: Object.fromEntries([...new Set(values)].sort((a, b) => a - b).map(value => [value.toFixed(1), values.filter(v => v === value).length])),
    atLeastSix: values.filter(v => v >= 6).length, atLeastEight: values.filter(v => v >= 8).length,
    changedDisplayedScores: rows.filter(r => r.results[variant.id].displayed !== r.results.linear.displayed).length,
    largestAbsoluteChange: Math.max(...rows.map(r => Math.abs(r.results[variant.id].raw - r.results.linear.raw))),
    medianRangeWidth: median(rows.map(r => r.results[variant.id].rawRangeWidth)), rangesWiderThanThree: rows.filter(r => r.results[variant.id].displayedRangeWidth > 3).length,
    largestOneAxisChange: Math.max(...rows.map(r => r.results[variant.id].oneAxisMaximumChange)),
    largestDomainWeightChange: Math.max(...rows.map(r => r.results[variant.id].weightMaximumChange)),
    strictRankReversals, tiedPairsSplit, rankReversalExamples: examples, catalogueIndependencePass: true,
  }];
}));

const stressCases = [
  ...anchors.stressCases.map(c => ({ id: c.id, description: c.purpose, indices: { ecosystem: domainIndex(c.legacyAxes) }, interpretation: 'Unresolved trade-off; equality is not proof of equal real harm or of a wrong ranking.' })),
  { id: 'severe_reference', description: 'The 7-point reference profile, levels 3/3/3.', indices: { ecosystem: 0.75 }, interpretation: 'Comparison with the two same-sum stress profiles.' },
  { id: 'reach_bin_lower', description: '10,000 people with the same material harm for six months: levels 2/2/2.', indices: { human: 0.5 }, interpretation: 'The existing reach band discards variation within the band.' },
  { id: 'reach_bin_upper', description: '999,999 people with that same harm and duration: also levels 2/2/2.', indices: { human: 0.5 }, interpretation: 'Nearly 100 times the affected count, but identical scoring inputs. This is information loss, not proof of an exact alternative score.' },
  { id: 'reach_threshold_below', description: '9,999 people with material harm for six months: levels 2/1/2.', indices: { human: 5 / 12 }, interpretation: 'A one-person crossing to 10,000 changes an entire reach level.' },
  { id: 'zero_harm_nonzero_scope', description: 'Level 0 severity with level 4 reach and persistence: no attributable harm, but positive scope/time.', indices: { ecosystem: 8 / 12 }, interpretation: 'An incoherent consequence profile that should trigger input review. Every conversion of its aggregate returns a positive burden above the floor.' },
  { id: 'high_low_domains', description: 'The 9-point reference in people, adequate evidence of zero harm in nature (score 1). Both domains remain applicable.', indices: { human: 11 / 12, ecosystem: 0 }, interpretation: 'Target 5 under the declared average of calibrated domain scores. Unknown nature harm cannot be represented by this zero.' },
];
for (const entry of stressCases) entry.results = Object.fromEntries(variants.map(v => [v.id, { raw: combine(entry.indices, v), displayed: round(combine(entry.indices, v)) }]));
const currentInputFlags = catalogue.issues.flatMap(issue => issue.candidate.applicableDomains.flatMap(domain => {
  const vector = issue.candidate.components[domain].central;
  return (vector.severity === 0 && (vector.reach > 0 || vector.persistence > 0)) || (vector.reach === 0 && (vector.severity > 0 || vector.persistence > 0))
    ? [{ nodeId: issue.nodeId, name: issue.name, domain, axes: vector, currentOverallScore: issue.result.value, currentDomainScore: round(1 + 9 * domainIndex(vector)), storedAttribution: issue.candidate.components[domain].attribution, note: 'Inspect source mapping: a zero consequence or zero affected reach coexists with positive burden axes.' }] : [];
}));
const placementDifferences = Object.fromEntries([['power', 'power_after', 'power_domains'], ['mapped', 'mapped_after', 'mapped_domains']].map(([name, a, b]) => [name, { affectedDisplayedNodes: rows.filter(r => r.results[a].displayed !== r.results[b].displayed).length, largestAbsoluteRawDifference: Math.max(...rows.map(r => Math.abs(r.results[a].raw - r.results[b].raw))) }]));

for (const [key, path] of Object.entries(files)) assert.equal(createHash('sha256').update(await readFile(new URL(path, root))).digest('hex'), hashes[key], `Input changed during experiment: ${path}`);
const result = {
  version: 'tulip_score_meaning_experiment_2026_09_27_v1', generatedOn: '2026-09-27', status: 'experiment_complete_no_runtime_changes',
  scope: 'Fixed hypothetical benchmarks; exhaustive integer-grid invariants; all current catalogue values and structured bounds. No new empirical evidence or independent scientific validation.',
  inputs: Object.fromEntries(Object.entries(files).map(([key, path]) => [key, { path, sha256: hashes[key] }])),
  variants: variants.map(({ id, name, placement }) => ({ id, name, placement })), parity,
  anchorResults, anchorSummary, mixedPairs, mixedSummary, invariantResults, catalogueSummary, placementDifferences, stressCases, currentInputFlags, rows,
};
await mkdir(output, { recursive: true });
await writeFile(new URL('results.json', output), JSON.stringify(result, null, 2) + '\n');
await writeFile(new URL('node-comparison.csv', output), csv([
  ['node_id', 'name', 'domains', 'confidence', ...variants.flatMap(v => [v.id, `${v.id}_lower`, `${v.id}_upper`])],
  ...rows.map(r => [r.nodeId, r.name, r.applicableDomains.join('+'), r.confidence, ...variants.flatMap(v => [r.results[v.id].displayed.toFixed(1), r.results[v.id].lower.toFixed(1), r.results[v.id].upper.toFixed(1)])]),
]));
const anchorTable = anchorResults.map(a => `| ${a.target.toFixed(1)} | ${a.results.linear.displayed.toFixed(1)} | ${a.results.power_after.displayed.toFixed(1)} | ${a.results.mapped_domains.displayed.toFixed(1)} |`).join('\n');
const catalogueTable = variants.map(v => {
  const c = catalogueSummary[v.id];
  return `| ${v.name} | ${c.median.toFixed(1)} | ${c.distinctDisplayedScores} | ${c.atLeastSix} | ${c.strictRankReversals} | ${c.tiedPairsSplit} | ${c.rangesWiderThanThree} |`;
}).join('\n');
const sensitivityTable = variants.map(v => {
  const c = catalogueSummary[v.id];
  return `| ${v.name} | ${c.largestOneAxisChange.toFixed(3)} | ${c.largestDomainWeightChange.toFixed(3)} | ${c.medianRangeWidth.toFixed(3)} |`;
}).join('\n');
const stressTable = stressCases.map(s => `| ${s.id} | ${s.results.linear.displayed.toFixed(1)} | ${s.results.power_after.displayed.toFixed(1)} | ${s.results.mapped_domains.displayed.toFixed(1)} | ${s.interpretation} |`).join('\n');
const flagTable = currentInputFlags.map(f => `| ${f.name} | ${f.currentOverallScore.toFixed(1)} | ${f.currentDomainScore.toFixed(1)} | ${axes.map(k => f.axes[k]).join(' / ')} |`).join('\n');
const markdown = `# TULIP score-meaning experiment

Completed 27 September 2026. **Needs revision as a complete calibration method; mathematical comparison complete.** App ratings and public snapshots are unchanged.

## Result

The 1.2 power conversion improves agreement with the four internally chosen targets. It does not resolve information lost in the underlying three-axis average. A fixed benchmark map reproduces the targets exactly by construction. Applying that map inside each domain also preserves the declared average of the calibrated people and nature scores; applying it only to their combined index does not have the same interpretation.

None of these findings independently validates the empirical accuracy of the 354 issue ratings. The four targets are TULIP choices, not observed ground truth. The mapped candidate is suitable for further internal testing, not an established replacement scoring method.

## Four fixed reference cases

| Target | Current linear | Power 1.2 | Benchmark map |
| --- | --- | --- | --- |
${anchorTable}

Mean absolute error before rounding: **${anchorSummary.linear.meanAbsoluteError.toFixed(3)}** for the current conversion; **${anchorSummary.power_after.meanAbsoluteError.toFixed(3)}** for exponent 1.2; **${anchorSummary.mapped_domains.meanAbsoluteError.toFixed(3)}** for the map fitted to the benchmarks. Exact map agreement is a construction check, not validation. Error is distance from the hypothetical targets, not measurement error in climate harm.

At a descriptive tolerance of 0.25 points, current linear matches ${anchorSummary.linear.withinQuarterPoint}/4 references and power matches ${anchorSummary.power_after.withinQuarterPoint}/4. At 0.5 points, the counts are ${anchorSummary.linear.withinHalfPoint}/4 and ${anchorSummary.power_after.withinHalfPoint}/4. These are sensitivity summaries, not adopted pass criteria.

## Why conversion placement matters

The sixteen pairings of the four people/nature targets are derived from the same benchmarks, not held-out empirical cases. Their maximum absolute error is ${mixedSummary.mapped_after.maximumAbsoluteError.toFixed(3)} after applying the benchmark map to the combined index, versus ${mixedSummary.mapped_domains.maximumAbsoluteError.toFixed(3)} when mapping each domain first.

For the 9-point people reference paired with measured-zero nature harm (score 1), the target is 5. The mapped-domain result is ${stressCases.find(s => s.id === 'high_low_domains').results.mapped_domains.displayed.toFixed(1)}; the map applied after combining gives ${stressCases.find(s => s.id === 'high_low_domains').results.mapped_after.displayed.toFixed(1)}. Both approaches can use equal weights on their inputs, but they define those inputs differently. A missing nature assessment cannot be substituted for a measured zero.

On the existing catalogue, placement changes the displayed result for ${placementDifferences.power.affectedDisplayedNodes} nodes under power 1.2 and ${placementDifferences.mapped.affectedDisplayedNodes} under the benchmark map.

## Catalogue effects

All ${parity.issues} issue records were checked at lower, central and upper estimates against independently recomputed sums, the existing evaluator and the public snapshot. All ${parity.responses} responses remain excluded. Existing web/mobile/native records match for all ${parity.webMobileNative} nodes. Alternative values below are experimental only.

| Candidate | Median | Distinct displayed values | At least 6 | Strict rank reversals | Previously tied pairs split | Evidence ranges wider than 3 |
| --- | --- | --- | --- | --- | --- | --- |
${catalogueTable}

Strict reversals and tied-pair splits compare unrounded values, with each unordered pair counted once. More distinct decimals do not establish better harm measurement. Counts above 6 are descriptive; 6 is not an adopted severity threshold. The range counts use displayed lower/upper differences and remain structured bounds, not confidence intervals.

## Difficult profiles and information loss

| Case | Current | Power after combining | Map within domains | Interpretation |
| --- | --- | --- | --- | --- |
${stressTable}

The three profiles with an axis total of nine remain equal under every tested conversion. Whether their actual burdens should be equal is an unresolved value-and-evidence question, not a demonstrated wrong ranking. No aggregate-only curve can distinguish identical aggregate inputs.

The 10,000 versus 999,999 affected-person cases demonstrate discarded information. A curve cannot recover those counts once both have been replaced by reach level 2. The 9,999 versus 10,000 cases demonstrate the opposite problem: a sharp threshold step for almost identical counts. These are test cases, not observations about real nodes.

Current active components flagged for a zero severity or zero reach coexisting with positive other axes: **${currentInputFlags.length}**. These need source-mapping review; the experiment does not substitute a zero rating or infer an alternative from missing evidence. See the results JSON for the exact records.

### Confirmed mismatch in two stored human-component explanations

| Node | Current overall score | Current human component on 1–10 scale | Human severity / reach / persistence |
| --- | --- | --- | --- |
${flagTable}

The stored explanation for Glacier-Fed Water Dependence explicitly uses the population dependent on water while stating that realized harm was not measured. The Surface Water Storage Instability explanation likewise uses residents in affected basins while reporting no measured shortage, unsafe water, displacement or economic loss. Both use the persistence of the underlying water condition rather than a measured duration of human consequences. These are confirmed inconsistencies between the stored mappings and the stated current-harm rubric, not new claims that these water conditions are harmless.

The remedy needs a documented assessment decision: distinguish unknown human harm from evidence of zero harm; retain exposure/dependence as context; estimate actual consequences through the declared evidence or structured-estimate route. The experiment does not fabricate replacement axis levels or withdraw the existing numerical ratings. A final conversion cannot repair those inputs.

## Sensitivity and mathematical checks

| Candidate | Largest one-level axis change | Largest change with 30/70 or 70/30 domain weights | Median unrounded evidence-range width |
| --- | --- | --- | --- |
${sensitivityTable}

Every candidate stays within 1–10, retains endpoints, and is monotonic on 125 single-domain and 15,625 paired integer profiles. Each candidate passed ${invariantResults.linear.monotonicityComparisons.toLocaleString('en-US')} paired-grid one-axis comparisons. Some grid profiles are logically incoherent as consequences; passing their arithmetic is not evidence that they should be admitted. Adding an unrelated node changes no existing experimental result. Bounds use the same transformation as their central estimates.

The benchmark map has a trade-off: its upper segment is steeper. A one-level change can move a single-domain score by 1.0 point, versus 0.75 under the current conversion. An exact match to the four reference values therefore does not establish better robustness. Moving or narrowing a displayed evidence range through a transformation also does not add evidence.

## Recommended next method work

Keep the frozen benchmarks and use the **map within each domain** as a transparent experimental reference. Do not select 1.2 merely because it moves the displayed numbers closer. Before adopting a revised score, resolve what the severity/reach/duration trade-offs should represent, preserve consequential differences currently hidden inside broad bins, and test additional evidence-backed cases that were not used to set the four targets. Numerical ratings remain available under the existing version during this work.

## Evidence and reproduction

- [Fixed experiment plan](../../docs/tulip-calibration/score-formula-experiment-plan.md)
- [Frozen reference cases](../../docs/tulip-calibration/score-meaning-anchors.json)
- [Complete results and input hashes](./results.json)
- [Every issue's experimental values and ranges](./node-comparison.csv)
- [Independent Decimal-arithmetic reproduction](./verification.json)
- Run: \`node scripts/test-tulip-score-meaning-experiment.mjs\`
- Then run: \`python3 scripts/verify-tulip-score-meaning-experiment.py\`. This independently interpolates the declared knots at 45-digit precision and checks the values, bounds, sensitivity, rankings and reference cases.
- Arithmetic is checked from supplied repository snapshots. This experiment adds no external evidence, population estimates or independent scientific review.
`;
await writeFile(new URL('report.md', output), markdown);
console.log(JSON.stringify({ output: fileURLToPath(output), parity, anchorSummary, mixedSummary, catalogueSummary, placementDifferences, currentInputFlags }, null, 2));
