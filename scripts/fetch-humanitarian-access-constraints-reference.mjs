import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'humanitarian-access-constraints-reference-snapshot.json');
const pdfUrl = 'https://myanmar.un.org/sites/default/files/2026-01/MMR_HNRP_2026_EN_0.pdf';
const reportUrl = 'https://myanmar.un.org/en/309363-myanmar-humanitarian-needs-and-response-plan-2026';
const pdfSha256 = '840a33c92cf4b318ea5f12df0cb14e5948b03867480e6a37c6afafdbfead6e4b';

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
assert.equal(sha256(pdf), pdfSha256, 'The official Myanmar HNRP PDF changed');

const candidate = {
  previous: { value: 4.8, grade: 'C', lower: 2.5, upper: 7.0, confidence: 'B' },
  revised: { value: 4.8, grade: 'C', lower: 4.0, upper: 7.8, confidence: 'B' },
  axes: {
    human: {
      severity: { lower: 2, central: 2, upper: 3 },
      reach: { lower: 1, central: 1, upper: 3 },
      persistence: { lower: 1, central: 2, upper: 3 },
    },
  },
  reason: 'The official response plan directly documents service-continuity loss: staff relocation and temporary activity suspensions affected essential services in several areas. It also records more than 1,000 access incidents, 127 of 330 assessed townships at the highest access-difficulty level and constraints in nearly all townships. These facts remove mild inconvenience from the severity lower bound, but incident and township counts do not reveal unique people harmed. The central rating therefore stays C while the lower bound rises from A to B and widespread upper reach remains explicit rather than asserted.',
};

const payload = {
  version: 'tulip_humanitarian_access_constraints_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'direct_operational_access_and_service_continuity_evidence_ingested_unique_affected_people_and_consequence_duration_missing',
  productionRatingsEnabled: 0,
  nodeId: 'humanitarian_access_constraints',
  source: {
    id: 'ocha_myanmar_hnrp_2026_access_constraints',
    publisher: 'United Nations Office for the Coordination of Humanitarian Affairs, Myanmar',
    title: 'Myanmar Humanitarian Needs and Response Plan 2026',
    issued: '2025-12',
    publicationDate: '2025-12',
    url: reportUrl,
    pdfUrl,
    pdfSha256,
    pageCount: 70,
    relevantPage: 22,
  },
  currentWindow: {
    start: 2025,
    end: 2025,
    coverageStatus: 'country_case_with_direct_operational_consequences',
    summaryMethod: 'period_prevalence',
    coverageNote: 'The current assessment year is 2025. Its access incident input runs from 1 November 2024 through 31 October 2025, while the severity exercise was conducted in October 2025. The report covers Myanmar and cannot be generalized into a global affected-person count.',
  },
  evidence: {
    assessedAccessState: {
      assessedTownships: 330,
      extremelyHighDifficultyTownships: 127,
      extremelyHighDifficultySharePercentApproximate: 37,
      concentrationOfLevel3TownshipsInHighestAffectedRegionsPercentApproximate: 95,
      accessIncidentsLowerBound: 1_000,
      incidentWindowStart: '2024-11-01',
      incidentWindowEnd: '2025-10-31',
      militaryOperationShareOfReportedAccessIncidentsPercent: 57,
      administrativeImpedimentShareOfReportedAccessIncidentsPercent: 25,
      almostAllTownshipsExperiencedSomeConstraint: true,
    },
    directServiceConsequence: {
      affectedAreas: ['Chin', 'Magway', 'Mon', 'Rakhine', 'northern Shan'],
      personnelRelocationRequired: true,
      activitiesTemporarilySuspended: true,
      essentialServiceContinuityAffected: true,
      uniqueAffectedPeoplePublished: false,
      terminalHealthOutcomesPublished: false,
      serviceInterruptionDurationPublished: false,
      interpretation: 'The report directly establishes material operational interruption. It does not state how many unique people lost services, how long each interruption lasted or what terminal outcomes followed.',
    },
    durationContextExcludedFromPersistence: {
      sittweOnlyDirectlyAccessibleTownshipForAuthorizedUnAgenciesSince: '2023-11',
      phoneAndInternetInterruptionSince: '2024-01',
      interpretation: 'These dates describe persistence of access and communications constraints. They are not converted into the duration of service loss or harm for an affected person.',
    },
  },
  ratingDecision: {
    change: 'central_value_retained_lower_grade_bound_narrowed_with_direct_service_interruption',
    candidate,
    admittedUses: [
      'Use personnel relocation, temporary activity suspension and affected essential-service continuity to set central and lower human severity at level 2.',
      'Use the national incident and township distribution only to retain a widespread upper reach case, not to calculate unique people harmed.',
      'Use the direct operational record to replace generic access-family assumptions while keeping service-loss duration bounded.',
    ],
    excludedUses: [
      'Do not convert access incidents, townships, regions or assessed-country coverage into unique people harmed.',
      'Do not treat people in need, people targeted or people reached as people harmed by access constraints.',
      'Do not use the 1.4 million people receiving no aid in the report’s funding section; that estimate is explicitly tied to underfunding and belongs to the funding and capacity-gap review.',
      'Do not add conflict casualties, displacement or food insecurity unless a source attributes a non-overlapping share to access constraints.',
      'Do not treat the reporting window, long-running restrictions or communications interruption dates as the duration of service loss for each person.',
      'Do not infer ecosystem harm from a humanitarian operational-access assessment.',
    ],
    exactRemainingGaps: [
      'A deduplicated count of people whose essential assistance was delayed, reduced or unavailable specifically because of access constraints.',
      'Measured health, nutrition, protection, displacement or material-loss outcomes attributable to the access interruption rather than the underlying conflict or disaster.',
      'Service-interruption and recovery durations by affected person or programme.',
      'A comparable multi-country access-consequence dataset with consistent definitions and denominators.',
      'Independent reproduction of the incident and township-severity totals from a compatible operational dataset.',
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
