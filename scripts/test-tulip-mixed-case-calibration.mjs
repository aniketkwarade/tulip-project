import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const base = new URL('../', import.meta.url);
const output = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const preferences = JSON.parse(readFileSync(new URL('docs/tulip-calibration/mixed-case-judgments.json', base)));
const candidates = JSON.parse(readFileSync(new URL('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json', base)));
const prior = JSON.parse(readFileSync(new URL('artifacts/tulip-consequence-rule-audit-2026-09-27/results.json', base)));
const current = new Map(prior.records.map(row => [row.nodeId, row]));
const round = value => Math.round((value + 1e-9) * 10) / 10;
const same = (a, b) => Math.abs(a - b) < 1e-9;
const axesFromArray = value => ({ severity: value[0], reach: value[1], persistence: value[2] });
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2;
};
// Sanity-check that the ecological preferences have a declared time horizon.
// These simple condition-area-time products are only an internal consistency
// check; they are not a universal ecological harm unit.
const horizon = preferences.comparisonAccountingHorizonYears;
assert.equal(horizon, 50);
const natureAreaTime = {
  nature_large_serious: 0.50 * 0.20 * 20,
  nature_small_permanent: 0.80 * 0.005 * horizon,
  nature_widespread_mild: 0.05 * 0.50 * horizon,
  nature_large_extreme: 0.80 * 0.20 * horizon,
};
for (const pair of preferences.requiredOrderings.filter(pair => pair.higher.startsWith('nature_'))) {
  assert(natureAreaTime[pair.higher] > natureAreaTime[pair.lower], `${pair.higher} vs ${pair.lower}`);
}

function componentScore(axes, variant) {
  const weights = [variant.severityWeight, (1 - variant.severityWeight) / 2, (1 - variant.severityWeight) / 2];
  const levels = [axes.severity, axes.reach, axes.persistence].map(value => value / 4);
  assert(levels.every(value => value > 0 && value <= 1));
  const index = variant.aggregation === 'arithmetic'
    ? levels.reduce((sum, value, index) => sum + weights[index] * value, 0)
    : Math.exp(levels.reduce((sum, value, index) => sum + weights[index] * Math.log(value), 0));
  const nineIndex = variant.aggregation === 'arithmetic'
    ? weights[0] + weights[1] * 0.75 + weights[2]
    : Math.pow(0.75, weights[1]);
  if (index <= 0.75) return 1 + 8 * index;
  if (index <= nineIndex) return 7 + 2 * (index - 0.75) / (nineIndex - 0.75);
  return 9 + (index - nineIndex) / (1 - nineIndex);
}

const variants = [
  { id: 'arithmetic_equal', aggregation: 'arithmetic', severityWeight: 1 / 3 },
  { id: 'arithmetic_40_30_30', aggregation: 'arithmetic', severityWeight: 0.4 },
  { id: 'arithmetic_50_25_25', aggregation: 'arithmetic', severityWeight: 0.5 },
  { id: 'geometric_equal', aggregation: 'geometric', severityWeight: 1 / 3 },
  { id: 'geometric_40_30_30', aggregation: 'geometric', severityWeight: 0.4 },
  { id: 'geometric_50_25_25', aggregation: 'geometric', severityWeight: 0.5 },
];

for (const variant of variants) {
  const caseScores = Object.fromEntries(preferences.cases.map(item => [item.id, componentScore(axesFromArray(item.axes), variant)]));
  variant.holdout = preferences.requiredOrderings.map(preference => ({
    higher: preference.higher, lower: preference.lower,
    result: caseScores[preference.higher] > caseScores[preference.lower] + 1e-9 ? 'pass'
      : same(caseScores[preference.higher], caseScores[preference.lower]) ? 'tie' : 'fail',
    difference: round(caseScores[preference.higher] - caseScores[preference.lower]),
  }));
  variant.passed = variant.holdout.filter(row => row.result === 'pass').length;
  variant.caseScores = Object.fromEntries(Object.entries(caseScores).map(([id, score]) => [id, round(score)]));
  const catalogue = candidates.issues.flatMap(item => {
    const previous = current.get(item.nodeId);
    if (previous.conditionalValue === null) return [];
    const domains = item.candidate.applicableDomains;
    const raw = domains.reduce((sum, domain) => sum + componentScore(item.candidate.components[domain].central, variant), 0) / domains.length;
    return [{ nodeId: item.nodeId, raw, value: round(raw), currentRaw: previous.legacyRaw, currentValue: previous.publishedValue }];
  });
  assert.equal(catalogue.length, 352);
  let reversedPairs = 0;
  for (let i = 0; i < catalogue.length; i++) for (let j = i + 1; j < catalogue.length; j++) {
    const before = catalogue[i].currentRaw - catalogue[j].currentRaw;
    const after = catalogue[i].raw - catalogue[j].raw;
    if (!same(before, 0) && !same(after, 0) && before * after < 0) reversedPairs++;
  }
  variant.catalogue = { comparable: catalogue.length, median: median(catalogue.map(row => row.value)),
    distinctDisplayed: new Set(catalogue.map(row => row.value)).size,
    changedFromCurrent: catalogue.filter(row => row.value !== row.currentValue).length,
    reversedPairsFromCurrent: reversedPairs };
  for (const [axes, expected] of [
    [{ severity: 1, reach: 1, persistence: 1 }, 3],
    [{ severity: 2, reach: 2, persistence: 2 }, 5],
    [{ severity: 3, reach: 3, persistence: 3 }, 7],
    [{ severity: 4, reach: 3, persistence: 4 }, 9],
  ]) assert(same(componentScore(axes, variant), expected), `${variant.id}: ${expected}`);
}
assert.equal(variants.find(row => row.id === 'geometric_equal').passed, preferences.requiredOrderings.length);
const result = { status: 'synthetic_holdout_and_conditional_catalogue_trial', preferenceVersion: preferences.version,
  caveat: 'The orderings are internally authored and the catalogue scores reuse old ordinal axes. This identifies a structural defect in additive conversion; it does not validate real node consequences.',
  variants };
writeFileSync(new URL('mixed-case-comparison.json', output), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(variants.map(({ id, passed, caseScores, catalogue }) => ({ id, passed, caseScores, catalogue })), null, 2));
