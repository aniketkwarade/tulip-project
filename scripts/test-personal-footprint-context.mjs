import assert from 'node:assert/strict';
import {
  CARBON_PERCENTILE_ANCHORS,
  estimateGlobalCarbonPercentile,
  formatOrdinal,
  getFootprintEquivalencies
} from '../src/personal-footprint-context.js';

for (let index = 1; index < CARBON_PERCENTILE_ANCHORS.length; index += 1) {
  assert.ok(
    CARBON_PERCENTILE_ANCHORS[index].tonnesCo2e > CARBON_PERCENTILE_ANCHORS[index - 1].tonnesCo2e,
    'Carbon anchors must increase by footprint'
  );
  assert.ok(
    CARBON_PERCENTILE_ANCHORS[index].percentile > CARBON_PERCENTILE_ANCHORS[index - 1].percentile,
    'Carbon anchors must increase by percentile'
  );
}

assert.equal(estimateGlobalCarbonPercentile(1).label, 'Below the 20th percentile');
assert.equal(estimateGlobalCarbonPercentile(1.8).percentile, 20);
assert.equal(estimateGlobalCarbonPercentile(3.1).percentile, 50);
assert.equal(estimateGlobalCarbonPercentile(3.1).populationLabel, 'Around 50% of global population');
assert.equal(estimateGlobalCarbonPercentile(13).percentile, 90);
assert.equal(estimateGlobalCarbonPercentile(46).percentile, 99);
assert.equal(estimateGlobalCarbonPercentile(130).percentile, 99.9);
assert.equal(estimateGlobalCarbonPercentile(600).label, 'Above the 99.99th percentile');
assert.equal(estimateGlobalCarbonPercentile(-1), null);

assert.equal(formatOrdinal(1), '1st');
assert.equal(formatOrdinal(12), '12th');
assert.equal(formatOrdinal(23), '23rd');
assert.equal(formatOrdinal(99.9), '99.9th');

const comparisons = getFootprintEquivalencies({
  carbonTotal: 4.29,
  waterTotalM3: 2500,
  landTotalM2: 7140,
  materialTotalTonnes: 2
});
assert.equal(comparisons[0].headline, '~1 car');
assert.equal(comparisons[0].evidence, '≈ 4.3 tonnes CO₂e annually');
assert.equal(comparisons[1].headline, '~38,000 showers');
assert.equal(comparisons[1].evidence, '≈ 2,500,000 litres annually');
assert.equal(comparisons[2].headline, '~16 basketball courts');
assert.equal(comparisons[3].headline, '~1 car');

const lowCarbonComparison = getFootprintEquivalencies({ carbonTotal: 2.3 })[0];
assert.equal(lowCarbonComparison.headline, '~5,900 miles');
assert.equal(lowCarbonComparison.descriptor, 'driven in a gasoline car');

console.log('Personal footprint context tests passed.');
