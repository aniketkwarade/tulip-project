import assert from 'node:assert/strict';
import { PUBLISHED_NODES } from '../src/data.js';
import {
  getSearchRecoverySuggestions,
  normalizeSearchText,
  scoreSearchTerm,
  searchNodes
} from '../src/search.js';

assert.equal(normalizeSearchText('  CO₂ / Emissions  '), 'co2 emissions');
assert.equal(scoreSearchTerm('Global Temperature', 'global temp'), 105);
assert.ok(scoreSearchTerm('climate change', 'clmate change') > 0);
assert.equal(scoreSearchTerm('Ocean Acidification', 'mortgage rates'), 0);

assert.equal(searchNodes(PUBLISHED_NODES, 'global warming')[0]?.node.id, 'temp');
assert.equal(searchNodes(PUBLISHED_NODES, 'climate change')[0]?.node.id, 'temp');
assert.equal(searchNodes(PUBLISHED_NODES, 'co2 emissions')[0]?.node.id, 'carbon_emission');
assert.equal(searchNodes(PUBLISHED_NODES, 'water shortage')[0]?.node.id, 'water_stress');
assert.equal(searchNodes(PUBLISHED_NODES, 'food security')[0]?.node.id, 'food_insecurity');
assert.equal(searchNodes(PUBLISHED_NODES, 'smog health effects')[0]?.node.id, 'air_pollution_health_burden');
assert.deepEqual(searchNodes(PUBLISHED_NODES, 'purple banana satellites'), []);

const recoveryIds = getSearchRecoverySuggestions(PUBLISHED_NODES).map(node => node.id);
assert.deepEqual(recoveryIds, ['temp', 'carbon_emission', 'sea_level_rise', 'air_pollution_health_burden']);

console.log('Search relevance and recovery tests passed.');
