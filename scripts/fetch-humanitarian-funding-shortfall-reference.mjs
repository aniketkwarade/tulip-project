import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'humanitarian-funding-shortfall-reference-snapshot.json');
const symbol = 'A/80/658';
const documentUrl = `https://docs.un.org/en/${symbol}`;
const pdfUrl = `https://documents.un.org/api/symbol/access?s=${encodeURIComponent(symbol)}&l=en&t=pdf`;
const pdfSha256 = 'ec5342973c894bfea0943c102cea4e9735ddd5a643eff0ab6bed9ea011f87074';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const response = await fetch(pdfUrl, {
  headers: {
    accept: 'application/pdf',
    'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
  },
  signal: AbortSignal.timeout(180_000),
});
assert(response.ok, `Request failed (${response.status}) for ${pdfUrl}`);
const pdf = Buffer.from(await response.arrayBuffer());
assert.equal(sha256(pdf), pdfSha256, 'The official United Nations report PDF changed');

const candidate = {
  previous: { value: 4.8, grade: 'C', lower: 2.5, upper: 7.0, confidence: 'B' },
  revised: { value: 6.3, grade: 'C', lower: 5.5, upper: 7.8, confidence: 'B' },
  axes: {
    human: {
      severity: { lower: 2, central: 2, upper: 3 },
      reach: { lower: 3, central: 3, upper: 3 },
      persistence: { lower: 1, central: 2, upper: 3 },
    },
  },
  reason: 'An official 2026 United Nations report directly attributes 455 health-facility closures or suspensions affecting 3.8 million people, 305 nutrition-facility closures cutting off services for more than 88,000 vulnerable children and women, and a 37% decline in mine-action activity to funding shortfalls during 2025. The largest non-additive affected-person count fixes reach at level 3. Essential-service interruption fixes central severity at level 2, while the absence of a health-outcome estimate or closure-duration distribution keeps severity and persistence bounded.',
};

const capacityGapCandidate = {
  previous: { value: 4.8, grade: 'C', lower: 2.5, upper: 7.0, confidence: 'B' },
  revised: { value: 6.3, grade: 'C', lower: 5.5, upper: 7.8, confidence: 'B' },
  axes: candidate.axes,
  reason: 'For the downstream capacity-gap node, the same report measures the realized operational shortfall rather than merely the financial driver: hundreds of facilities closed or suspended and millions of people lost or had reduced essential services. The record fixes human reach and central severity while leaving service-loss duration and terminal health outcomes bounded. This rating is an alternative view of the same consequence chain and cannot be added to the funding-shortfall rating.',
};

const payload = {
  version: 'tulip_humanitarian_funding_shortfall_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'direct_official_service_interruption_and_affected_population_ingested_duration_and_terminal_health_outcomes_missing',
  productionRatingsEnabled: 0,
  nodeId: 'humanitarian_response_funding_shortfall',
  source: {
    id: 'un_afghanistan_secretary_general_report_a_80_658_2026',
    publisher: 'United Nations Security Council and General Assembly',
    title: 'The situation in Afghanistan and its implications for international peace and security — Report of the Secretary-General',
    publicationDate: '2026-02-27',
    symbol,
    url: documentUrl,
    pdfUrl,
    pdfSha256,
    pageCount: 15,
    relevantPage: 11,
    relevantParagraphs: [61, 62, 63],
  },
  currentWindow: {
    start: 2025,
    end: 2025,
    coverageStatus: 'country_case_with_direct_service_consequences',
    summaryMethod: 'period_prevalence',
    coverageNote: 'The report covers Afghanistan during 2025. It directly connects funding shortfalls or cuts to facility closures, affected people and reduced mine-action activity. It does not establish a global burden or the duration of each person’s service interruption.',
  },
  evidence: {
    directHumanConsequences: {
      healthFacilitiesClosedOrSuspended: 455,
      peopleAffectedByHealthFacilityClosuresOrSuspensions: 3_800_000,
      nutritionFacilitiesClosed: 305,
      provincesWithNutritionFacilityClosures: 25,
      peopleCutOffFromNutritionServicesLowerBound: 88_000,
      affectedGroups: ['vulnerable children', 'women'],
      mineActionActivityDeclinePercentFrom2024: 37,
      causalLanguage: {
        nutrition: 'funding shortfalls forced the closure',
        health: 'major funding cuts led to the closure or suspension',
        mineAction: 'declined ... due to funding shortfalls',
      },
    },
    consequenceLimits: {
      uniquePeopleAcrossHealthAndNutritionPublished: false,
      fatalAndNonfatalHealthOutcomesPublished: false,
      closureDurationPerPersonPublished: false,
      recoveryTimePublished: false,
      globalAffectedPersonCountPublished: false,
      ecosystemEndpointPublished: false,
      interpretation: 'Facility closures and service loss are direct human consequences. The 3.8 million health-facility figure is the largest documented affected-person count and is used once. Other counts may overlap and are not added.',
    },
  },
  ratingDecision: {
    change: 'human_reach_source_anchored_and_human_severity_directly_observed',
    candidate,
    relatedNodeDecisions: {
      humanitarian_resource_gaps: capacityGapCandidate,
    },
    admittedUses: [
      'Use 3.8 million affected people once to set human reach at level 3 under the 1 million to under 100 million anchor.',
      'Use closure or suspension of essential health and nutrition facilities to set central human severity at level 2.',
      'Retain an upper severity level of 3 because large-scale essential-service loss can cause severe outcomes, while acknowledging that the report does not quantify those outcomes.',
      'Keep persistence bounded because the report establishes interruption during 2025 but does not publish person-level closure duration or recovery time.',
    ],
    excludedUses: [
      'Do not add 88,000 nutrition-service users to the 3.8 million people affected by health-facility closures; overlap is unknown.',
      'Do not add mine-action activity decline as a second human consequence after using the service-interruption assessment.',
      'Do not treat humanitarian planning populations, people in need or people targeted as people demonstrably harmed by this funding shortfall.',
      'Do not treat the 2025 reporting year as a one-year consequence duration.',
      'Do not infer deaths, illnesses, injuries, displacement or ecosystem harm that the report does not quantify.',
      'Do not generalize the Afghanistan affected-person count into a global burden without compatible country-level records and deduplication.',
    ],
    exactRemainingGaps: [
      'Compatible country-level counts of people who actually lost essential services because of humanitarian funding shortfalls, with cross-program deduplication.',
      'Measured health, nutrition, protection or displacement outcomes attributable to the service interruptions.',
      'A distribution of closure or suspension duration and the time required to restore service.',
      'A global denominator and consistent reporting boundary for humanitarian programmes affected by funding shortfalls.',
      'An independent source or compatible operational dataset that can reproduce the Afghanistan facility and affected-person totals.',
    ],
  },
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  source: payload.source,
  currentWindow: payload.currentWindow,
  evidence: payload.evidence,
  ratingDecision: payload.ratingDecision,
}));

await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, digest: payload.digest, sourcePdfSha256: pdfSha256, candidate: candidate.revised }, null, 2));
