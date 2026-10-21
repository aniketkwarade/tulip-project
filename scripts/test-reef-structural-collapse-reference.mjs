import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/reef-structural-collapse-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_reef_structural_collapse_2026_09_24_v1');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'reef_structural_collapse');
assert.equal(payload.source.xmlSha256, '155469ebfeeaaf6a9f970b95d599cec216e42286e9b178f619febfc99811a142');
assert.equal(payload.source.doi, '10.1111/1365-2656.70347');
assert.equal(payload.evidence.studyDesign.permanentQuadrats, 30);
assert.equal(payload.evidence.structuralCondition.surfaceComplexityFoldDecline, 1.18);
assert.equal(payload.evidence.structuralCondition.vectorRuggednessMeasureFoldDecline, 1.52);
assert.equal(payload.evidence.structuralCondition.fractalDimensionFoldDecline, 1.03);
assert.equal(payload.evidence.recovery.allMetricsIncreasedSignificantlyFrom2017To2019, true);
assert.equal(payload.evidence.recovery.returnedToPreHeatwaveLevelsBy2019, false);
assert.equal(payload.evidence.boundaries.compatibleGlobalAffectedReefAreaPercent, null);
assert.equal(payload.evidence.boundaries.compatibleCurrentHumanConsequence, null);

const { candidate } = payload.ratingDecision;
assert.deepEqual(candidate.previous, { value: 6.6, grade: 'D', lower: 4.8, upper: 8.5, confidence: 'C' });
assert.deepEqual(candidate.revised, { value: 4.8, grade: 'C', lower: 4, upper: 7.8, confidence: 'C' });
assert.deepEqual(candidate.axes.ecosystem.severity, { lower: 1, central: 2, upper: 3 });
assert.deepEqual(candidate.axes.ecosystem.reach, { lower: 1, central: 1, upper: 3 });
assert.deepEqual(candidate.axes.ecosystem.persistence, { lower: 2, central: 2, upper: 3 });
assert(payload.ratingDecision.excludedUses.some(item => /thirty quadrats.*people harmed/i.test(item)));
assert(payload.ratingDecision.excludedUses.some(item => /four-year observation interval/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /representative global/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Reef structural-collapse reference passed: direct three-dimensional condition and recovery replace heat exposure, false human reach and global-collapse assumptions.');
