import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/cement-concrete-consequence-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_cement_concrete_consequence_2026_09_24_v1');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'cement_concrete');
assert.equal(payload.source.doi, '10.1038/s41598-023-38075-z');
assert.equal(payload.source.supplementaryWorkbookSha256, 'a7f081e214c1a32f884cef0c2dca7ade5d2c392b74bb328f251d63f3c431d044');
assert.equal(payload.currentWindow.start, 2016);
assert.equal(payload.currentWindow.end, 2016);
assert.equal(payload.evidence.cementPlantRows.length, 5);
assert(Math.abs(payload.evidence.directHumanHealth.directNonCo2DalyPerYear - 261_597.29556045894) < 1e-6);
assert(Math.abs(payload.evidence.directHumanHealth.excludedCo2DalyPerYear - 1_161_311.8360117965) < 1e-6);
assert.equal(payload.evidence.directHumanHealth.uniqueAffectedPeoplePublished, false);
assert.equal(payload.evidence.directHumanHealth.fatalAndNonfatalBurdenPublishedSeparately, false);
assert.equal(payload.evidence.ecosystemConsequences.compatibleGlobalConditionLossPercentPublished, false);

const { candidate } = payload.ratingDecision;
assert.deepEqual(candidate.previous, { value: 6.6, grade: 'D', lower: 4.4, upper: 8.1, confidence: 'C' });
assert.deepEqual(candidate.revised, { value: 7, grade: 'D', lower: 5.1, upper: 8.5, confidence: 'C' });
assert.deepEqual(candidate.axes.human.severity, { lower: 3, central: 3, upper: 4 });
assert.deepEqual(candidate.axes.human.reach, { lower: 1, central: 2, upper: 3 });
assert.deepEqual(candidate.axes.human.persistence, { lower: 3, central: 4, upper: 4 });
assert(payload.ratingDecision.excludedUses.some(item => /CO2-related DALYs/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /unique affected-person count/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /ecosystem-condition estimate/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Cement / Concrete consequence reference passed: direct plant-health DALYs strengthen human axes while CO2, reach and ecosystem gaps remain separate.');
