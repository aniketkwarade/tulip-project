import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

// IDMC's 2026 methodological note states life-years = e × T × N with
// e = 0.042. The Bangladesh application instead describes using an upper
// mild-anxiety bound without printing e. A GBD research paper reports 0.046
// as one such upper uncertainty bound. This is a candidate reconciliation,
// not proof that the application used that exact parameter. Table 1 prints
// rounded movement counts, disruption duration and life-years; we do not
// have its unrounded event inputs or event-specific recovery factors.
const noteWeight = 0.042;
const upperBoundCandidate = 0.046;
const events = [
  { name: 'Cyclone Amphan', year: 2020, movementsMillions: 2.5, disruptionDays: 30, reportedLifeYears: 9500 },
  { name: 'Cyclone Bulbul', year: 2019, movementsMillions: 2.1, disruptionDays: 15, reportedLifeYears: 4000 },
  { name: 'Monsoon floods', year: 2020, movementsMillions: 1.9, disruptionDays: 36, reportedLifeYears: 8800 },
  { name: 'Cyclone Fani', year: 2019, movementsMillions: 1.7, disruptionDays: 15, reportedLifeYears: 3200 },
  { name: 'Cyclone Mocha', year: 2023, movementsMillions: 1.3, disruptionDays: 15, reportedLifeYears: 2500 },
];

const assessed = events.map(event => {
  const peopleIfOneMovePerPerson = event.movementsMillions * 1_000_000;
  const runAtWeight = weight => {
    const calculated = weight * peopleIfOneMovePerPerson * event.disruptionDays / 365;
    // Illustrative displayed-precision envelope only: movement counts print
    // to 0.1 million and duration prints to whole days. These are neither
    // report-stated rounding rules nor statistical uncertainty intervals.
    const minimum = weight * (event.movementsMillions - 0.05) * 1_000_000
      * (event.disruptionDays - 0.5) / 365;
    const maximum = weight * (event.movementsMillions + 0.05) * 1_000_000
      * (event.disruptionDays + 0.5) / 365;
    return {
      weight,
      calculatedLifeYears: Math.round(calculated),
      illustrativeDisplayedPrecisionRange: [Math.floor(minimum), Math.ceil(maximum)],
      reportedWithinIllustrativeRange: minimum <= event.reportedLifeYears
        && event.reportedLifeYears <= maximum,
    };
  };
  return {
    ...event,
    countInterpretation: 'Table calls these displacements; unique people per event are not verified.',
    noteWeightResult: runAtWeight(noteWeight),
    upperBoundCandidateResult: runAtWeight(upperBoundCandidate),
    impliedWeightIfDisplayedValuesAreExact: Number((event.reportedLifeYears * 365
      / (peopleIfOneMovePerPerson * event.disruptionDays)).toFixed(5)),
  };
});

const fixedIllustrativeCase = { people: 100_000, observedEvacuationDays: 10, welfareWeight: noteWeight };
const atRecoveryFactor = factor => fixedIllustrativeCase.people * fixedIllustrativeCase.observedEvacuationDays
  * factor * fixedIllustrativeCase.welfareWeight / 365;
const recoveryThresholdStress = {
  kind: 'synthetic_fixed_event_not_a_reported_case',
  ...fixedIllustrativeCase,
  severityScore7RecoveryFactor: 4,
  severityScore8RecoveryFactor: 7,
  lifeYearsAtScore7: Number(atRecoveryFactor(4).toFixed(1)),
  lifeYearsAtScore8: Number(atRecoveryFactor(7).toFixed(1)),
  changePercent: 75,
  interpretation: 'One ordinal-point move across the published 7-to-8 recovery-factor boundary increases this modeled burden by 75% with people and observed evacuation days fixed. This is a sensitivity challenge, not an observed event.',
};

assert.equal(assessed.length, 5);
assert(assessed.every(event => !event.noteWeightResult.reportedWithinIllustrativeRange));
assert(assessed.every(event => event.upperBoundCandidateResult.reportedWithinIllustrativeRange));
const result = {
  version: 'idmc_bangladesh_displacement_life_year_reproduction_2026_09_27_v2',
  status: 'consistent_with_upper_bound_candidate_not_verified',
  methodSource: 'https://api.internal-displacement.org/sites/default/files/publications/documents/2026_IDMC_A%20life-year%20approach%20for%20measuring%20the%20human%20cost%20of%20disaster%20displacement.pdf',
  exampleSource: 'https://api.internal-displacement.org/sites/default/files/publications/documents/2026_IDMC_The%20human%20cost%20of%20disaster%20displacement%20in%20Bangladesh.pdf',
  upperBoundSource: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10017349/',
  methodLocator: 'Methodological note PDF pages 2 and 4–5: example weight e = 0.042; life-years = e × T × N; T = D × F / 365.',
  exampleLocator: 'Bangladesh report PDF page 8 Table 1: five event examples; PDF page 12: application describes e as an upper mild-anxiety disability-weight bound without giving its numerical value.',
  upperBoundLocator: 'Santomauro et al. (2023), severity-estimation section: mild anxiety disorder disability weight 0.030, 95% uncertainty interval 0.018–0.046. This paper is a candidate match, not evidence IDMC used that source.',
  noteWeight,
  upperBoundCandidate,
  events: assessed,
  recoveryThresholdStress,
  interpretation: 'The general-note weight 0.042 remains below all five application examples beyond the illustrative displayed-precision ranges. A published upper uncertainty bound 0.046 is consistent with all five within those ranges. The application does not print e, rounding rules, unrounded inputs or event-level factors, so this is a plausible reconciliation rather than exact reproduction or model validation.',
  precisionBoundary: 'The displayed-precision ranges assume half a tenth of a million movements and half a day. IDMC does not state these as bounds; they are not confidence or uncertainty intervals.',
  scopeBoundary: 'The report models displacement-related welfare life-years, not WHO DALYs. Event movement counts may not be unique people; global disaster-displacement stocks and annual movements are not interchangeable, and neither is a climate-attributed count.',
  score: null,
  publicReady: false,
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/idmc-displacement-life-year-reproduction.json', import.meta.url),
  `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  status: result.status,
  examples: assessed.length,
  noteWeightMatches: assessed.filter(event => event.noteWeightResult.reportedWithinIllustrativeRange).length,
  upperBoundCandidateMatches: assessed.filter(event => event.upperBoundCandidateResult.reportedWithinIllustrativeRange).length,
  scoreAssigned: false,
}, null, 2));
