import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { scoreGeometricAxes } from '../src/tulip-consequence-scoring-v2.js';
import { validateAbsoluteBurdenAnchors } from '../src/tulip-burden-scale-experiment.js';

// Hypothetical holdout: WHO's YLD arithmetic motivates the comparison, but
// these particular disability weights and cohorts are invented stress inputs.
const daysPerYear = 365.25;
const candidateAnchors = JSON.parse(readFileSync(new URL('../docs/tulip-calibration/human-health-anchor-candidate.json', import.meta.url)));
assert.deepEqual(validateAbsoluteBurdenAnchors(candidateAnchors), []);
// The cases are invented. This independently checks only how the proposed
// fixed health ruler orders compatible hypothetical burden quantities.
const mapHypotheticalBurden = burden => {
  for (let index = 1; index < candidateAnchors.points.length; index++) {
    const high = candidateAnchors.points[index];
    if (burden > high.burden) continue;
    const low = candidateAnchors.points[index - 1];
    const share = (Math.log1p(burden) - Math.log1p(low.burden))
      / (Math.log1p(high.burden) - Math.log1p(low.burden));
    return Math.round((low.score + share * (high.score - low.score)) * 10) / 10;
  }
  return 10;
};
const cases = [
  { id: 'widespread_mild', people: 100_000_000, durationDays: 14,
    illustrativeDisabilityWeight: 0.05, axes: { severity: 1, reach: 4, persistence: 1 } },
  { id: 'small_permanent', people: 5_000, durationDays: 40 * daysPerYear,
    illustrativeDisabilityWeight: 0.5, axes: { severity: 4, reach: 1, persistence: 4 } },
].map(item => ({ ...item,
  personYears: item.people * item.durationDays / daysPerYear,
  illustrativeHealthyYearsLost: item.people * item.durationDays / daysPerYear * item.illustrativeDisabilityWeight,
  geometricScore: scoreGeometricAxes({ human: item.axes }).value,
  candidateHealthOnlyReading: mapHypotheticalBurden(
    item.people * item.durationDays / daysPerYear * item.illustrativeDisabilityWeight),
}));
const [mild, severe] = cases;
const breakEvenMildWeightAsFractionOfSevere = severe.personYears / mild.personYears;
assert(mild.geometricScore < severe.geometricScore);
assert(mild.illustrativeHealthyYearsLost > severe.illustrativeHealthyYearsLost);
assert(mild.candidateHealthOnlyReading > severe.candidateHealthOnlyReading);
assert(breakEvenMildWeightAsFractionOfSevere > 0.05 && breakEvenMildWeightAsFractionOfSevere < 0.06);
const result = {
  version: 'tulip_human_burden_stress_2026_09_27_v1',
  status: 'hypothetical_policy_falsification_case_not_empirical_validation',
  methodReference: 'https://www.who.int/docs/default-source/gho-documents/global-health-estimates/ghe2019_daly-methods.pdf',
  sourceMethod: 'WHO years-lived-with-disability arithmetic multiplies cases, duration and a disability weight. The particular cases and weights below are illustrative TULIP stress assumptions, not WHO estimates.',
  cases,
  candidateHealthAnchorVersion: candidateAnchors.version,
  candidateComparisonBoundary: 'Hypothetical incident cohorts with their modeled full-course health loss; not measured annual TULIP node burdens or public ratings.',
  breakEvenMildWeightAsFractionOfSevere,
  breakEvenMildWeightIfSevereWeightIsPointFive: breakEvenMildWeightAsFractionOfSevere * 0.5,
  finding: 'Under TULIP’s chosen aggregate-current-harm construct, the geometric ordinal score orders these compatible hypothetical burden cases in the opposite direction from their calculated health-years lost. The proposed fixed WHO-based health ruler preserves the aggregate ordering for this pair. This is a directional mechanism check, not calibration or empirical validation; invented disability weights and incompatible timebases would invalidate a real node comparison.',
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/human-burden-stress.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ scores: cases.map(({ id, geometricScore, illustrativeHealthyYearsLost, candidateHealthOnlyReading }) => ({ id, geometricScore, illustrativeHealthyYearsLost, candidateHealthOnlyReading })),
  breakEvenMildWeightIfSevereWeightIsPointFive: result.breakEvenMildWeightIfSevereWeightIsPointFive }, null, 2));
