import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  GEOMETRIC_METHOD_VERSION,
  evaluateGeometricConsequenceAssessment,
} from '../src/tulip-consequence-scoring-v2.js';

const who = JSON.parse(readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-air-pollution-mortality-row.json', import.meta.url)));
const scope = {
  endpointId: 'who_joint_air_pollution_attributable_deaths',
  affectedGroup: 'Modeled attributable deaths worldwide',
  geography: 'global',
  assessmentWindow: '2021',
};
const sourceId = 'who_air_35_global_2021';
const evidenceReferences = [sourceId];
const counts = { lower: who.modeledDeaths.lower95, central: who.modeledDeaths.central, upper: who.modeledDeaths.upper95 };

const makeAssessment = level => ({
  nodeId: 'synthetic_mortality_only_scope',
  nodeKind: 'issue',
  methodVersion: GEOMETRIC_METHOD_VERSION,
  applicableDomains: ['human'],
  domainApplicability: { ecosystem: { status: 'structurally_not_applicable', reason: 'This synthetic endpoint is mortality only.' } },
  components: {
    human: {
      harmBasis: {
        route: 'direct', metricRole: 'modeled_consequence',
        endpoint: 'Modeled deaths attributable to the joint effects of ambient and household air pollution',
        ...scope,
        counterfactual: 'Same population without the modeled pollution exposure.',
        severityAggregation: 'One severity assigned to the modeled death cohort.',
        endpointCoverage: 'The source reports mortality only; nonfatal burden is outside this synthetic scope.',
        overlapCheck: 'The modeled death count is entered once.',
        evidenceReferences,
        primarySourceId: sourceId,
        scoreEndpointScope: 'mortality_only_complete',
        sourceObservations: [{ sourceId, sourceUrl: who.sourceUrl, ...scope,
          outcomeKind: 'attributable_deaths', unit: 'modeled deaths', value: counts.central,
          lower: counts.lower, upper: counts.upper }],
        axisEvidence: Object.fromEntries([
          ['severity', 'modeled_human_consequence'],
          ['reach', 'modeled_count_of_harmed_people'],
          ['persistence', 'bounded_recovery_estimate'],
        ].map(([axis, kind]) => [axis, { kind, ...scope,
          explanation: 'The same WHO mortality source is used in both assessments.',
          estimateRationale: 'The current experimental evaluator does not derive this ordinal level from the outcome kind.' }])),
      },
      ...Object.fromEntries(Object.entries(counts).map(([position, count]) => [position, {
        status: 'assessed_harm', axes: { severity: level, reach: 3, persistence: level },
        harmedPeople: Math.round(count), reachBasis: 'people_with_attributable_harm',
        irreversible: true, durationBasis: 'attributable_consequence_or_recovery',
        jointEvidence: { kind: 'source_interval', ...scope,
          explanation: 'The matching lower, central or upper source death count is used.', evidenceReferences },
      }])),
    },
  },
});

const low = makeAssessment(1);
const high = makeAssessment(4);
assert.deepEqual(low.components.human.harmBasis, high.components.human.harmBasis);
const lowResult = evaluateGeometricConsequenceAssessment(low);
const highResult = evaluateGeometricConsequenceAssessment(high);
const twoValidDifferentScores = lowResult.status === 'experimental_candidate'
  && highResult.status === 'experimental_candidate' && lowResult.value !== highResult.value;
const gatePassed = highResult.status === 'experimental_candidate'
  && lowResult.status === 'needs_consequence_assessment'
  && lowResult.reasons.includes('human_lower_direct_death_interval_not_bound')
  && lowResult.reasons.includes('human_central_direct_death_interval_not_bound')
  && lowResult.reasons.includes('human_upper_direct_death_interval_not_bound');
const result = {
  version: 'tulip_direct_mortality_identifiability_2026_09_27_v1',
  status: gatePassed ? 'passes_narrow_direct_mortality_derivation' : 'fails_narrow_direct_mortality_derivation',
  gatePassed,
  twoValidDifferentScores,
  source: who.sourceUrl,
  scope: 'Synthetic mortality-only endpoint, not the whole Air Pollution Health Burden node.',
  controlledFields: 'Same WHO global 2021 modeled death count and interval, outcome, group, period, geography, counterfactual and source references.',
  variedFields: 'Entered severity and persistence levels only; reach remains derived from the same death interval.',
  evaluations: [
    { enteredSeverityAndPersistence: 1, ...lowResult },
    { enteredSeverityAndPersistence: 4, ...highResult },
  ],
  finding: gatePassed
    ? 'The source-bound mortality-only case is accepted and the arbitrary mild-severity/duration case is rejected. Scientific adequacy of the TULIP death mapping and full-node coverage remain separate questions.'
    : 'The source-bound mortality-only case was not accepted while excluding the arbitrary mild-severity/duration case; the direct route needs further correction.',
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/direct-mortality-identifiability.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ gatePassed: result.gatePassed,
  results: result.evaluations.map(({ enteredSeverityAndPersistence, status, value }) => ({ enteredSeverityAndPersistence, status, value })) }, null, 2));
