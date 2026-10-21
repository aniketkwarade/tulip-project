import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import {
  persistenceLevelFromDays,
  reachLevelFromHarmedPeople,
} from '../src/tulip-consequence-scoring.js';
import { scoreGeometricAxes } from '../src/tulip-consequence-scoring-v2.js';

// Hypothetical health states. The illustrative weight is held constant, so
// source selection and health-state valuation cannot explain any ranking tie.
const daysPerYear = 365.25;
const illustrativeDisabilityWeight = 0.05;
const cases = [
  { id: 'hundred_million_two_weeks', harmedPeople: 100_000_000, durationDays: 14 },
  { id: 'billion_two_weeks', harmedPeople: 1_000_000_000, durationDays: 14 },
  { id: 'hundred_million_ten_years', harmedPeople: 100_000_000, durationDays: 10 * daysPerYear },
  { id: 'hundred_million_forty_years', harmedPeople: 100_000_000, durationDays: 40 * daysPerYear },
].map(({ id, harmedPeople, durationDays }) => {
  const axes = {
    severity: 1,
    reach: reachLevelFromHarmedPeople(harmedPeople),
    persistence: persistenceLevelFromDays('human', durationDays),
  };
  return {
    id, harmedPeople, durationDays, axes,
    experimentalScore: scoreGeometricAxes({ human: axes }).value,
    illustrativeHealthyYearsLost: harmedPeople * durationDays / daysPerYear * illustrativeDisabilityWeight,
  };
});
const [first, morePeople, tenYears, fortyYears] = cases;
assert.equal(first.experimentalScore, morePeople.experimentalScore);
assert.equal(morePeople.illustrativeHealthyYearsLost / first.illustrativeHealthyYearsLost, 10);
assert.equal(tenYears.experimentalScore, fortyYears.experimentalScore);
assert.equal(fortyYears.illustrativeHealthyYearsLost / tenYears.illustrativeHealthyYearsLost, 4);
const result = {
  version: 'tulip_anchor_saturation_2026_09_27_v1',
  status: 'hypothetical_construct_stress_not_empirical_validation',
  note: 'All cases use the same invented mild health state and illustrative 0.05 disability weight. The comparisons isolate hard reach and duration caps; the weight is not a WHO estimate for these hypothetical cases.',
  cases,
  finding: 'The current human reach mapping stops at level 4 once 100 million people are harmed, and its duration mapping stops at level 4 at ten years. The experimental geometric scorer therefore ties 10x or 4x aggregate health loss in these examples. If TULIP means aggregate current harm, raw consequence quantities need a non-saturating pre-score mapping across the intended decision range; changing only the final 1–10 curve cannot separate inputs already collapsed to identical axes.',
  interpretationBoundary: 'A deliberately capped criticality index could accept these ties, but must state that meaning rather than claim to preserve total harm magnitude. Any bounded 1–10 display eventually has limited resolution; this test targets exact premature ties below the overall maximum.',
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/anchor-saturation.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ cases: cases.map(({ id, experimentalScore, illustrativeHealthyYearsLost }) => ({ id, experimentalScore, illustrativeHealthyYearsLost })) }, null, 2));
