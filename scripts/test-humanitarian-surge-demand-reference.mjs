import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/humanitarian-surge-demand-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_humanitarian_surge_demand_2026_09_24_v1');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'humanitarian_surge_demand');
assert.equal(payload.source.sourceSha256, 'bb1ea909eb96122b42a9cb04525de13e6fbad780346f8e0fed412ec261e323db');
assert.equal(payload.evidence.demandAndCapacityState.reportedInjuredSinceJanuary26, 3_082);
assert.equal(payload.evidence.demandAndCapacityState.reportedDeadSinceJanuary26, 843);
assert.equal(payload.evidence.demandAndCapacityState.reportingHealthFacilities, 31);
assert.equal(payload.evidence.demandAndCapacityState.emergencyCapacityAddedBeds, 1_000);
assert.equal(payload.evidence.directServiceConsequence.routineCancerServicesAffected, true);
assert.equal(payload.evidence.directServiceConsequence.healthWorkersAbsentOrOverburdened, true);
assert.equal(payload.evidence.directServiceConsequence.uniquePeopleHarmedByOverloadPublished, false);
assert.equal(payload.evidence.directServiceConsequence.serviceDisruptionDurationPublished, false);

const { candidate } = payload.ratingDecision;
assert.deepEqual(candidate.previous, { value: 4.8, grade: 'C', lower: 2.5, upper: 7, confidence: 'B' });
assert.deepEqual(candidate.revised, { value: 4, grade: 'B', lower: 4, upper: 7.8, confidence: 'C' });
assert.deepEqual(candidate.axes.human.severity, { lower: 2, central: 2, upper: 3 });
assert.deepEqual(candidate.axes.human.reach, { lower: 1, central: 1, upper: 3 });
assert.deepEqual(candidate.axes.human.persistence, { lower: 1, central: 1, upper: 3 });
assert(payload.ratingDecision.excludedUses.some(item => /843 deaths.*3,082 injuries/i.test(item)));
assert(payload.ratingDecision.excludedUses.some(item => /days worked by staff/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /deduplicated count/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Humanitarian surge-demand reference passed: direct overload consequences are separated from the casualties and constraints that created the surge.');
