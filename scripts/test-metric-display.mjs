import assert from 'node:assert/strict';
import {
  containsImperialDisplayUnit,
  formatMetricDisplayText,
  metricizeDisplayValue,
} from '../src/metric-display.js';

assert.equal(formatMetricDisplayText('30 miles downstream'), '48.3 km downstream');
assert.equal(formatMetricDisplayText('20 feet above flood stage'), '6.1 m above flood stage');
assert.equal(formatMetricDisplayText('843,444 gallons released'), '3,192,783 L released');
assert.equal(formatMetricDisplayText('29 million gallons released'), '110 million L released');
assert.equal(formatMetricDisplayText('843,444-gallon crude-oil release'), '3,192,783 L crude-oil release');
assert.equal(formatMetricDisplayText('68 ft/year retreat'), '20.7 m/year retreat');
assert.equal(formatMetricDisplayText('100 cubic feet'), '2.83 m³');
assert.equal(formatMetricDisplayText('100 yards'), '91.4 m');
assert.equal(formatMetricDisplayText('2 barrels'), '318 L');
assert.equal(formatMetricDisplayText('86°F'), '30 °C');
assert.equal(formatMetricDisplayText('12-inch-equivalent wafer'), '30.5 cm-equivalent wafer');
assert.equal(formatMetricDisplayText('last-mile delivery'), 'last-mile delivery');
assert.equal(formatMetricDisplayText('trips made on foot or wheels'), 'trips made on foot or wheels');
assert.equal(formatMetricDisplayText('a named rail yard'), 'a named rail yard');
assert.equal(formatMetricDisplayText('tonne-miles and nautical miles'), 'tonne-kilometres and kilometres');
assert.deepEqual(
  metricizeDisplayValue({ unit: 'feet or meters from station datum', url: 'https://example.com/10-miles' }),
  { unit: 'metres from station datum', url: 'https://example.com/10-miles' }
);
assert.equal(containsImperialDisplayUnit('20 feet'), true);
assert.equal(containsImperialDisplayUnit('6.1 m'), false);
assert.equal(containsImperialDisplayUnit('last-mile delivery and travel on foot'), false);

console.log('Metric display tests passed.');
