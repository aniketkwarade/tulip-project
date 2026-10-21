import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/north-atlantic-oscillation-consequence-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_north_atlantic_oscillation_consequence_2026_09_24_v2');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'north_atlantic_oscillation');
assert.equal(payload.sources.floodLossStudy.doi, '10.1029/2019GL081956');
assert.equal(payload.sources.floodLossStudy.crossrefResponseSha256.length, 64);
assert.match(payload.sources.floodLossStudy.abstract, /up to 50%/i);
assert.equal(payload.sources.reproducibilityArchive.files.length, 6);
assert(payload.sources.reproducibilityArchive.files.every(file => file.sha256.length === 64));
assert.equal(payload.sources.reproducibilityArchive.verifiedShape.historicalFloodEventRows, 1_575);
assert.equal(payload.sources.reproducibilityArchive.verifiedShape.monthlyNaoRows, 819);
assert.equal(payload.sources.reproducibilityArchive.verifiedShape.hydrologicStations, 4_062);
assert.equal(payload.sources.reproducibilityArchive.verifiedShape.annualPeakDateRows, 171_325);
assert.equal(payload.sources.independentForecastStudy.doi, '10.1029/2019EF001450');
assert.equal(payload.sources.independentForecastStudy.openPdfSha256, '3fa486e3b5abf94f70dc1becb2995bc0d3d24e56495983408f96ad54fe268246');
assert.equal(payload.sources.openFloodImpactDataset.eventsMd5, '369bcff3d1f97624db2b444e44d45217');
assert.equal(payload.sources.openFloodImpactDataset.eventRows, 2_521);
assert.equal(payload.sources.openFloodImpactDataset.eventRows1980To2020, 1_412);
assert.equal(payload.sources.openFloodImpactDataset.eventsWithReported2020EuroLoss1980To2020, 727);
assert.equal(payload.sources.officialNaoSeries.responseSha256.length, 64);
assert.equal(payload.evidence.materialLoss.maximumReportedDifferenceBetweenOppositeNaoStatesPercent, 50);
assert.equal(payload.evidence.materialLoss.absoluteAttributableLossPublished, false);
assert.equal(payload.evidence.reproducibility.authorArchiveContainsCatastropheModelOutputs, false);
const stressTest = payload.evidence.independentOpenStressTest;
for (const window of Object.values(stressTest.windows)) {
  assert.equal(window.regionSeasonStrata, 16);
  assert.equal(window.classes.damaging.falseDiscoveryControlledModelCount, 3);
  assert.equal(window.classes.low.falseDiscoveryControlledModelCount, 0);
  assert.equal(window.classes.medium.falseDiscoveryControlledModelCount, 0);
  assert.equal(window.classes.high.falseDiscoveryControlledModelCount, 0);
  assert.deepEqual(
    window.classes.damaging.falseDiscoveryControlledModels.map(model => [model.region, model.season, model.direction]),
    [
      ['Northern', 'winter', 'positive_nao_increases_probability'],
      ['Northern', 'summer', 'negative_nao_increases_probability'],
      ['Eastern', 'spring', 'negative_nao_increases_probability'],
    ],
  );
}

const { candidate } = payload.ratingDecision;
assert.deepEqual(candidate.previous, { value: 4.4, grade: 'B', lower: 1.8, upper: 6.6, confidence: 'C' });
assert.deepEqual(candidate.revised, { value: 4.8, grade: 'C', lower: 2.1, upper: 6.6, confidence: 'C' });
assert.deepEqual(candidate.axes.human.severity, { lower: 1, central: 2, upper: 2 });
assert.deepEqual(candidate.axes.human.reach, { lower: 1, central: 2, upper: 3 });
assert.deepEqual(candidate.axes.human.persistence, { lower: 0, central: 1, upper: 2 });
assert(payload.ratingDecision.excludedUses.some(item => /15-country model domain/i.test(item)));
assert(payload.ratingDecision.excludedUses.some(item => /false-discovery-controlled high-loss classifier/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /absolute NAO-attributable loss/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('North Atlantic Oscillation consequence reference passed: independent open flood-loss reproduction supports material harm and sign reversal without inventing severity, reach, duration or causal attribution.');
