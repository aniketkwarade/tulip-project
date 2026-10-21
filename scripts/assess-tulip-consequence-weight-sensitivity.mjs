import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const output = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const audit = JSON.parse(readFileSync(new URL('results.json', output)));
const candidates = JSON.parse(readFileSync(new URL('../artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json', import.meta.url)));
const old = new Map(audit.records.map(record => [record.nodeId, record]));
const round = value => Math.round((value + 1e-9) * 10) / 10;
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2;
};
const score = (axes, severityWeight) => {
  const reachWeight = (1 - severityWeight) / 2;
  const index = (severityWeight * axes.severity + reachWeight * axes.reach + reachWeight * axes.persistence) / 4;
  const nineKnot = (7 + severityWeight) / 8;
  if (index <= 0.75) return 1 + 8 * index;
  if (index <= nineKnot) return 7 + 2 * (index - 0.75) / (nineKnot - 0.75);
  return 9 + (index - nineKnot) / (1 - nineKnot);
};
const sign = value => value > 1e-9 ? 1 : value < -1e-9 ? -1 : 0;
const weightSets = [1 / 3, 0.4, 0.5, 0.6];
const rows = weightSets.map(severityWeight => {
  const comparable = candidates.issues.flatMap(item => {
    const record = old.get(item.nodeId);
    if (record.conditionalRaw === null) return [];
    const domains = item.candidate.applicableDomains;
    const raw = domains.reduce((sum, domain) => sum + score(item.candidate.components[domain].central, severityWeight), 0) / domains.length;
    return [{ nodeId: item.nodeId, oldRaw: record.legacyRaw, oldDisplay: record.publishedValue,
      raw, display: round(raw), experimental50Raw: record.conditionalRaw }];
  });
  assert.equal(comparable.length, 352);
  let oldReversals = 0;
  let candidateReversals = 0;
  for (let i = 0; i < comparable.length; i++) for (let j = i + 1; j < comparable.length; j++) {
    const a = comparable[i], b = comparable[j];
    if (sign(a.oldRaw - b.oldRaw) * sign(a.raw - b.raw) === -1) oldReversals++;
    if (sign(a.experimental50Raw - b.experimental50Raw) * sign(a.raw - b.raw) === -1) candidateReversals++;
  }
  return {
    severityWeight, reachWeight: (1 - severityWeight) / 2, persistenceWeight: (1 - severityWeight) / 2,
    anchorScores: [1, 2, 3].map(level => score({ severity: level, reach: level, persistence: level }, severityWeight))
      .concat(score({ severity: 4, reach: 3, persistence: 4 }, severityWeight)),
    mildWidespreadPersistent: round(score({ severity: 1, reach: 4, persistence: 4 }, severityWeight)),
    severeLocalPermanent: round(score({ severity: 4, reach: 1, persistence: 4 }, severityWeight)),
    median: median(comparable.map(row => row.display)),
    distinctDisplayed: new Set(comparable.map(row => row.display)).size,
    changedFromPublic: comparable.filter(row => row.display !== row.oldDisplay).length,
    rankReversalsFromPublishedMethod: oldReversals,
    rankReversalsFromExperimental50: candidateReversals,
  };
});
for (const row of rows) assert.deepEqual(row.anchorScores, [3, 5, 7, 9]);
const result = { status: 'policy_weight_sensitivity_on_existing_ordinal_axes',
  note: 'All numbers are conditional on prior v6 axis judgments. Rank changes cannot establish which weight is scientifically correct.',
  input: 'artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json',
  rules: 'The same four frozen target scores are refitted for each severity weight; each active domain is transformed before averaging.',
  rows };
writeFileSync(new URL('weight-sensitivity.json', output), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
