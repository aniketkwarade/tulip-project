import assert from 'node:assert/strict';

import { ACTION_PROFILES, getActionProfileById } from '../src/actions-data.js';
import { NODES } from '../src/data.js';
import { getPhenomenonLensById } from '../src/phenomenon-lens.js';
import { PHENOMENON_SELECTOR_CONFIG } from '../src/phenomenon-selector.js';

const selectorKeys = PHENOMENON_SELECTOR_CONFIG.map(item => item.key);
const selectorLabels = PHENOMENON_SELECTOR_CONFIG.map(item => item.label);
const graphNodeIds = new Set(NODES.map(node => node.id));

assert.equal(new Set(selectorKeys).size, selectorKeys.length, 'Footprint selector keys must be unique');
assert.equal(new Set(selectorLabels).size, selectorLabels.length, 'Footprint selector labels must be unique');

for (const expectedKey of ['built_environment', 'freight_logistics', 'conveyance_aviation']) {
  assert.ok(selectorKeys.includes(expectedKey), `Footprint selector must include ${expectedKey}`);
  assert.ok(getPhenomenonLensById(expectedKey), `${expectedKey} must resolve to a dedicated lens`);
}

for (const retiredLabel of ['Housing', 'Building Operations', 'Construction', 'Shipping', 'Logistics', 'Conveyance', 'Aviation']) {
  assert.ok(!selectorLabels.includes(retiredLabel), `${retiredLabel} must not remain a standalone selector`);
}
assert.equal(PHENOMENON_SELECTOR_CONFIG.length, 16, 'Conveyance and Aviation must resolve as one Activity category');
assert.ok(selectorLabels.includes('Transport'), 'The combined transport category must remain accessible');
const combinedTransportSelector = PHENOMENON_SELECTOR_CONFIG.find(item => item.key === 'conveyance_aviation');
assert.deepEqual(combinedTransportSelector?.nodeIds, ['personal_conveyance', 'aviation'], 'The combined category must retain both Analyze nodes');

for (const selector of PHENOMENON_SELECTOR_CONFIG) {
  assert.ok(selector.nodeIds.length > 0, `${selector.key} must retain at least one Analyze node`);
  for (const nodeId of selector.nodeIds) {
    assert.ok(graphNodeIds.has(nodeId), `${selector.key} references missing Analyze node ${nodeId}`);
  }
}

const diet = getPhenomenonLensById('food');
const expectedDietLabels = [
  'Beef',
  'Dark Chocolate',
  'Lamb & Mutton',
  'Coffee',
  'Cheese',
  'Seafood',
  'Pork',
  'Chicken',
  'Eggs',
  'Rice',
  'Tofu',
  'Vegetables'
];
assert.equal(diet.items.length, 12, 'Diet must contain 12 food-product rows');
assert.deepEqual(diet.items.map(item => item.label), expectedDietLabels, 'Diet rows must use the approved product list and order');
assert.ok(!diet.items.some(item => /goat/i.test(item.label)), 'Goat must remain deferred until its unit is harmonized');
assert.equal(diet.items.find(item => item.label === 'Vegetables')?.value, 0.98, 'Vegetables must use Peas as its product-level benchmark');
assert.ok(!diet.items.some(item => ['Peas', 'Other Vegetables', 'Potatoes'].includes(item.label)), 'Diet must expose only one consolidated Vegetables row');
for (const item of diet.items) {
  assert.ok(item.typicalPortion, `${item.label} must expose its typical-portion context`);
  assert.match(item.portionSource, /^https:\/\//, `${item.label} must retain a typical-portion source`);
}
assert.equal(diet.items.find(item => item.label === 'Beef')?.typicalPortion, '170 g cooked', 'Beef must use a recognizable meal-size portion rather than the regulatory 85 g reference amount');

for (let index = 1; index < diet.items.length; index += 1) {
  assert.ok(diet.items[index - 1].value >= diet.items[index].value, 'Diet rows must be sorted from highest to lowest footprint');
}

const expectedLensValues = {
  built_environment: [17, 11, 6],
  freight_logistics: [1460, 800, 174, 79, 67],
  conveyance_aviation: [3300, 950, 200, 40],
  aviation: [950]
};
const expectedUnits = {
  built_environment: '% of global CO2 emissions',
  freight_logistics: 'MtCO2 per year',
  conveyance_aviation: 'MtCO2 / CO2e per year',
  aviation: 'MtCO2 per year'
};

for (const lensId of ['food', 'built_environment', 'freight_logistics', 'conveyance_aviation', 'aviation']) {
  const lens = getPhenomenonLensById(lensId);
  const maxValue = Math.max(...lens.items.map(item => item.value));
  assert.ok(lens.items.every(item => Number.isFinite(item.value)), `${lensId} rows must use one numeric unit`);
  assert.ok(lens.axisMax >= maxValue, `${lensId} axisMax must cover its largest row`);
  for (const metadataKey of ['label', 'url', 'baseline', 'method', 'boundary']) {
    assert.ok(lens.source?.[metadataKey], `${lensId} must expose source ${metadataKey} metadata`);
  }
  assert.match(lens.source.url, /^https:\/\//, `${lensId} source URL must be HTTPS`);
}

for (const [lensId, values] of Object.entries(expectedLensValues)) {
  const lens = getPhenomenonLensById(lensId);
  assert.equal(lens.unitLabel, expectedUnits[lensId], `${lensId} must use the approved common unit`);
  assert.deepEqual(lens.items.map(item => item.value), values, `${lensId} must preserve the sourced row values`);
}

for (const profileId of ['built_environment', 'freight_logistics', 'conveyance_aviation', 'aviation']) {
  assert.ok(ACTION_PROFILES[profileId], `${profileId} must have a dedicated Action profile`);
  assert.equal(getActionProfileById(profileId), ACTION_PROFILES[profileId], `${profileId} Action profile must resolve directly`);
}
assert.equal(getActionProfileById('shipping'), ACTION_PROFILES.freight_logistics, 'Shipping must resolve to Freight & Logistics Actions');
assert.equal(getActionProfileById('road_freight_diesel_lock_in'), ACTION_PROFILES.freight_logistics, 'Road freight must resolve to Freight & Logistics Actions');
assert.equal(getActionProfileById('aviation_demand_growth'), ACTION_PROFILES.aviation, 'Aviation growth must resolve to Aviation Actions');

for (const retainedNodeId of ['urban_sprawl_housing', 'cement_concrete', 'steel', 'shipping', 'aviation', 'road_freight_diesel_lock_in']) {
  assert.ok(graphNodeIds.has(retainedNodeId), `Analyze must retain ${retainedNodeId}`);
}

console.log('Phenomenon lens consolidation checks passed.');
