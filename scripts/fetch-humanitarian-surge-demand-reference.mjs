import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'humanitarian-surge-demand-reference-snapshot.json');
const sourceUrl = 'https://www.who.int/news/item/07-02-2025-dire-health-and-humanitarian-crisis-in-eastern-democratic-republic-of-the-congo-prompts-escalation-of-efforts-by-who--partners';
const sourceSha256 = 'bb1ea909eb96122b42a9cb04525de13e6fbad780346f8e0fed412ec261e323db';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const response = await fetch(sourceUrl, {
  headers: {
    accept: 'text/html',
    'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
  },
  signal: AbortSignal.timeout(180_000),
});
assert(response.ok, `Request failed (${response.status}) for ${sourceUrl}`);
const page = Buffer.from(await response.arrayBuffer());
assert.equal(sha256(page), sourceSha256, 'The WHO eastern DRC news release changed');
const html = page.toString('utf8');
for (const phrase of [
  'Hospitals and morgues are overwhelmed',
  '3082 injured and 843 dead',
  'routine services are also affected',
  'increase hospital capacity by 1000 beds',
]) assert(html.includes(phrase), `Expected source phrase missing: ${phrase}`);

const candidate = {
  previous: { value: 4.8, grade: 'C', lower: 2.5, upper: 7.0, confidence: 'B' },
  revised: { value: 4.0, grade: 'B', lower: 4.0, upper: 7.8, confidence: 'C' },
  axes: {
    human: {
      severity: { lower: 2, central: 2, upper: 3 },
      reach: { lower: 1, central: 1, upper: 3 },
      persistence: { lower: 1, central: 1, upper: 3 },
    },
  },
  reason: 'WHO directly documents overwhelmed hospitals, overburdened staff and affected routine services during the January–February 2025 eastern DRC surge. That establishes material service disruption. The reported deaths and injuries were consequences of violence and cannot be reassigned to response overload; the release also gives no unique count of people whose care worsened because capacity was exceeded and no duration for that service harm. Persistence therefore remains event-scale centrally, producing B rather than C.',
};

const payload = {
  version: 'tulip_humanitarian_surge_demand_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'direct_overload_and_routine_service_disruption_ingested_unique_overload_attributable_people_and_duration_missing',
  productionRatingsEnabled: 0,
  nodeId: 'humanitarian_surge_demand',
  source: {
    id: 'who_eastern_drc_health_surge_response_2025',
    publisher: 'World Health Organization',
    title: 'Dire health and humanitarian crisis in eastern Democratic Republic of the Congo prompts escalation of efforts by WHO, partners',
    publicationDate: '2025-02-07',
    url: sourceUrl,
    contentType: 'text/html',
    sourceSha256,
  },
  currentWindow: {
    start: 2025,
    end: 2025,
    coverageStatus: 'regional_event_case_with_direct_capacity_overload_consequences',
    summaryMethod: 'event_distribution',
    coverageNote: 'The release documents a rapid health-service surge in and around Goma and parts of eastern DRC in late January and early February 2025. It is a direct regional case, not a global prevalence estimate.',
  },
  evidence: {
    demandAndCapacityState: {
      hospitalsAndMorguesOverwhelmed: true,
      reportedInjuredSinceJanuary26: 3_082,
      reportedDeadSinceJanuary26: 843,
      reportingHealthFacilities: 31,
      northKivuHealthFacilitiesAffectedByConflict: 70,
      northKivuHealthFacilitiesAffectedSharePercent: 6,
      healthWorkersWorkingRoundTheClockForDays: true,
      healthWorkersHadLimitedResourcesAndOverwhelmingDemand: true,
      emergencyCapacityAddedBeds: 1_000,
      suppliesDepletingRapidly: true,
      interpretation: 'The casualty counts and facilities affected by violence describe the shock that generated demand and reduced supply. They are not counts of harm caused by surge demand itself.',
    },
    directServiceConsequence: {
      routineCancerServicesAffected: true,
      routineDiabetesServicesAffected: true,
      routineHypertensionServicesAffected: true,
      routineMentalHealthServicesAffected: true,
      medicineStockoutsReported: true,
      healthWorkersAbsentOrOverburdened: true,
      uniquePeopleHarmedByOverloadPublished: false,
      overloadAttributableTerminalOutcomesPublished: false,
      serviceDisruptionDurationPublished: false,
      interpretation: 'The release directly establishes material routine-service disruption during overload, while leaving the affected population, terminal outcome and duration unquantified.',
    },
    overlapBoundary: {
      conflictCausedCasualtiesAndInfrastructureDamage: true,
      accessAndFundingConstraintsAlsoPresent: true,
      interpretation: 'Conflict, damaged facilities, access, supply depletion and funding all contributed. Only the direct service-overload statement is admitted for surge-demand severity.',
    },
  },
  ratingDecision: {
    change: 'central_grade_reduced_and_lower_bound_narrowed_after_separating_overload_harm_from_triggering_casualties',
    candidate,
    admittedUses: [
      'Use overwhelmed facilities, overburdened staff and affected routine services to set human severity lower and central bounds at level 2.',
      'Use the regional event and emergency capacity expansion only to retain a wider upper reach case.',
      'Use the direct event timing to support an event-scale central persistence case while leaving longer disruption as an upper bound.',
    ],
    excludedUses: [
      'Do not attribute the 843 deaths or 3,082 injuries to humanitarian surge demand; the source attributes them to the violence that created the surge.',
      'Do not convert 31 reporting facilities, 70 affected facilities, 1,000 added beds, displaced people or the population of Goma into unique people harmed by overload.',
      'Do not add harm from conflict, facility destruction, staff flight, access restrictions, supply shortages or funding cuts unless a source isolates the non-overlapping surge-demand contribution.',
      'Do not use days worked by staff, the article date or the response period as the duration of disrupted care for each patient.',
      'Do not add this rating to Humanitarian Access Constraints, Response Capacity Gap or Funding Shortfall when the same service interruption is involved.',
      'Do not infer ecosystem harm from a health-service overload case.',
    ],
    exactRemainingGaps: [
      'A deduplicated count of people whose care was delayed, reduced or unavailable specifically because demand exceeded available response capacity.',
      'Measured health outcomes attributable to overload rather than the triggering violence, damaged facilities, access or supply constraints.',
      'Duration of disrupted routine and emergency care and recovery time for affected patients.',
      'Comparable multi-event or multi-country overload data using the same demand, capacity and consequence definitions.',
      'A causal decomposition of demand surge, damaged supply, staffing, access, funding and logistics.',
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
console.log(JSON.stringify({ output, digest: payload.digest, sourceSha256, candidate: candidate.revised }, null, 2));
