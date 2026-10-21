import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const analysis = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/tidal-wetland-soc-full-resolution-mean-map-analysis.json', import.meta.url),
  'utf8',
));

assert.equal(analysis.version, 'tulip_tidal_wetland_soc_mean_map_analysis_2026_09_24_v1');
assert.equal(analysis.source.archiveMd5['0030'], 'e6311d771c3ac1e56ef1a84141b4ead3');
assert.equal(analysis.source.archiveMd5['3060'], '60d87d27f7c909c7d7d7220bbd761179');
assert.equal(analysis.source.archiveMd5['6000'], 'fc74268fd405ac0dc6ee56ea63d1fa32');
assert.equal(analysis.source.files['2014_0030'].sha256, 'c5a0659640743d8c326c100a70d142a25dc725d7284da10ac006e6dff2fdadda');
assert.equal(analysis.source.files['2020_6000'].sha256, '970858ca1e7ae86bafb2c19f3849083c948974e756f1a73b34a87a4a57172c8c');

assert.equal(analysis.denominator.unionAreaSquareKilometres, 380525.440015);
assert.equal(analysis.denominator.commonAreaSquareKilometres, 315944.737781);
assert.equal(analysis.denominator.earlierOnlyAreaSquareKilometres, 33769.708165);
assert.equal(analysis.denominator.laterOnlyAreaSquareKilometres, 30810.994069);
assert.equal(analysis.denominator.periodOnlyClassificationChurnSquareKilometres, 64580.702234);
assert.equal(analysis.denominator.periodOnlyClassificationChurnShareOfUnionPercent, 16.971455);

assert.equal(analysis.sourceReproduction.earlierStockPetagramsFromDepthRasters, 8.830062);
assert.equal(analysis.sourceReproduction.laterStockPetagramsFromDepthRasters, 8.291514);

const fivePercent = analysis.mappedChange['5'].commonMappedExtentOnly;
assert.equal(fivePercent.decliningAreaSquareKilometres, 110234.526544);
assert.equal(fivePercent.shareOfUnionMappedWetlandAreaDecliningPercent, 28.969029);
assert.equal(fivePercent.shareOfCommonMappedWetlandAreaDecliningPercent, 34.890445);
assert.equal(fivePercent.areaWeightedMeanLossWithinDecliningAreaPercent, 20.727882);
assert.deepEqual(fivePercent.tulipAxisSensitivity, {
  severity: 2,
  reach: 3,
  persistence: 3,
  value: 7,
  note: fivePercent.tulipAxisSensitivity.note,
});

const tenPercent = analysis.mappedChange['10'].commonMappedExtentOnly;
assert.equal(tenPercent.shareOfUnionMappedWetlandAreaDecliningPercent, 20.701543);
assert.equal(tenPercent.areaWeightedMeanLossWithinDecliningAreaPercent, 26.094907);
assert.equal(tenPercent.tulipAxisSensitivity.value, 7);

for (const threshold of ['0', '5', '10', '30', '50', '70']) {
  assert.equal(analysis.mappedChange[threshold].commonMappedExtentOnly.tulipAxisSensitivity.value, 7, threshold);
  assert.match(analysis.mappedChange[threshold].includingMappedExtentChangeAssumption.note, /upper spatial sensitivity/i);
}

assert.deepEqual(analysis.ratingImplication.candidate, {
  value: 7,
  grade: 'D',
  lower: 4,
  upper: 10,
  confidence: 'B',
  ecosystemAxes: {
    severity: { lower: 1, central: 2, upper: 4 },
    reach: { lower: 1, central: 3, upper: 4 },
    persistence: { lower: 2, central: 3, upper: 4 },
  },
});
assert.match(analysis.ratingImplication.reason, /every tested minimum-decline threshold.*D 7\.0/i);
assert(analysis.interpretationBoundaries.some(row => /not a formal significance test/i.test(row)));

console.log('Tidal-wetland full-resolution mean-map analysis passed.');
