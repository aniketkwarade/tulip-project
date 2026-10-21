import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/humanitarian-funding-shortfall-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_humanitarian_funding_shortfall_2026_09_24_v1');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'humanitarian_response_funding_shortfall');
assert.equal(payload.source.symbol, 'A/80/658');
assert.equal(payload.source.pdfSha256, 'ec5342973c894bfea0943c102cea4e9735ddd5a643eff0ab6bed9ea011f87074');
assert.deepEqual(payload.source.relevantParagraphs, [61, 62, 63]);
assert.equal(payload.currentWindow.start, 2025);
assert.equal(payload.currentWindow.end, 2025);

const consequences = payload.evidence.directHumanConsequences;
assert.equal(consequences.healthFacilitiesClosedOrSuspended, 455);
assert.equal(consequences.peopleAffectedByHealthFacilityClosuresOrSuspensions, 3_800_000);
assert.equal(consequences.nutritionFacilitiesClosed, 305);
assert.equal(consequences.provincesWithNutritionFacilityClosures, 25);
assert.equal(consequences.peopleCutOffFromNutritionServicesLowerBound, 88_000);
assert.equal(consequences.mineActionActivityDeclinePercentFrom2024, 37);
assert.equal(payload.evidence.consequenceLimits.closureDurationPerPersonPublished, false);
assert.equal(payload.evidence.consequenceLimits.globalAffectedPersonCountPublished, false);

const { candidate } = payload.ratingDecision;
assert.deepEqual(candidate.previous, { value: 4.8, grade: 'C', lower: 2.5, upper: 7, confidence: 'B' });
assert.deepEqual(candidate.revised, { value: 6.3, grade: 'C', lower: 5.5, upper: 7.8, confidence: 'B' });
assert.deepEqual(candidate.axes.human.severity, { lower: 2, central: 2, upper: 3 });
assert.deepEqual(candidate.axes.human.reach, { lower: 3, central: 3, upper: 3 });
assert.deepEqual(candidate.axes.human.persistence, { lower: 1, central: 2, upper: 3 });
assert.deepEqual(payload.ratingDecision.relatedNodeDecisions.humanitarian_resource_gaps.revised, { value: 6.3, grade: 'C', lower: 5.5, upper: 7.8, confidence: 'B' });
assert.deepEqual(payload.ratingDecision.relatedNodeDecisions.humanitarian_resource_gaps.axes.human.reach, { lower: 3, central: 3, upper: 3 });
assert.match(payload.ratingDecision.relatedNodeDecisions.humanitarian_resource_gaps.reason, /cannot be added/i);
assert(payload.ratingDecision.excludedUses.some(item => /Do not add 88,000/i.test(item)));
assert(payload.ratingDecision.excludedUses.some(item => /planning populations/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /closure or suspension duration/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Humanitarian funding-shortfall reference passed: direct service interruption fixes reach while overlap, outcome and duration limits remain explicit.');
