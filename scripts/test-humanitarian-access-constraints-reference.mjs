import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/humanitarian-access-constraints-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_humanitarian_access_constraints_2026_09_24_v1');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'humanitarian_access_constraints');
assert.equal(payload.source.pdfSha256, '840a33c92cf4b318ea5f12df0cb14e5948b03867480e6a37c6afafdbfead6e4b');
assert.equal(payload.source.relevantPage, 22);
assert.equal(payload.evidence.assessedAccessState.assessedTownships, 330);
assert.equal(payload.evidence.assessedAccessState.extremelyHighDifficultyTownships, 127);
assert.equal(payload.evidence.assessedAccessState.extremelyHighDifficultySharePercentApproximate, 37);
assert.equal(payload.evidence.assessedAccessState.accessIncidentsLowerBound, 1_000);
assert.equal(payload.evidence.assessedAccessState.militaryOperationShareOfReportedAccessIncidentsPercent, 57);
assert.equal(payload.evidence.assessedAccessState.administrativeImpedimentShareOfReportedAccessIncidentsPercent, 25);
assert.equal(payload.evidence.directServiceConsequence.activitiesTemporarilySuspended, true);
assert.equal(payload.evidence.directServiceConsequence.essentialServiceContinuityAffected, true);
assert.equal(payload.evidence.directServiceConsequence.uniqueAffectedPeoplePublished, false);
assert.equal(payload.evidence.directServiceConsequence.serviceInterruptionDurationPublished, false);

const { candidate } = payload.ratingDecision;
assert.deepEqual(candidate.previous, { value: 4.8, grade: 'C', lower: 2.5, upper: 7, confidence: 'B' });
assert.deepEqual(candidate.revised, { value: 4.8, grade: 'C', lower: 4, upper: 7.8, confidence: 'B' });
assert.deepEqual(candidate.axes.human.severity, { lower: 2, central: 2, upper: 3 });
assert.deepEqual(candidate.axes.human.reach, { lower: 1, central: 1, upper: 3 });
assert.deepEqual(candidate.axes.human.persistence, { lower: 1, central: 2, upper: 3 });
assert(payload.ratingDecision.excludedUses.some(item => /1\.4 million/i.test(item)));
assert(payload.ratingDecision.excludedUses.some(item => /reporting window/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /deduplicated count/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Humanitarian access-constraints reference passed: service interruption narrows severity while incident geography remains separate from harmed-person reach.');
