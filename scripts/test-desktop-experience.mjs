import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLocalStore, validFootprintAnswers, validTopicIds } from '../src/desktop-storage.js';
import { createDiscoveryIndex, discoverTopics, discoveryIntent } from '../src/desktop-discovery.js';
import { PUBLISHED_NODES, PUBLISHED_EDGES } from '../src/data.js';
import { PERSONAL_FOOTPRINT_QUESTIONS, PERSONAL_FOOTPRINT_BASELINE_SELECTIONS, calculatePersonalFootprint } from '../src/personal-footprint-model.js';
import { getRecentOccurrenceProfile } from '../src/recent-occurrences.js';

const blocked = createLocalStore(() => { throw new Error('Restricted storage'); });
blocked.write('test', { saved: true }); assert.deepEqual(blocked.read('test'), { saved: true });
blocked.forget('test'); assert.equal(blocked.read('test'), null);
const malformed = createLocalStore(() => ({ getItem: () => '{bad json' }));
assert.deepEqual(malformed.read('test', []), []);
assert.deepEqual(validTopicIds(PUBLISHED_NODES, ['temp', 'missing', 'temp', null]), ['temp']);
const restored = validFootprintAnswers(PERSONAL_FOOTPRINT_QUESTIONS, { ...PERSONAL_FOOTPRINT_BASELINE_SELECTIONS, unknown: 'x' });
assert.deepEqual(calculatePersonalFootprint(restored), calculatePersonalFootprint(PERSONAL_FOOTPRINT_BASELINE_SELECTIONS));
assert.equal(validFootprintAnswers(PERSONAL_FOOTPRINT_QUESTIONS, { diet: 'not-an-option' }).diet, null);
const [nodePayload, relationshipPayload] = await Promise.all([
  readFile(new URL('../public/runtime-node-details.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../public/relationship-descriptions.json', import.meta.url), 'utf8').then(JSON.parse)
]);
const details = new Map(nodePayload.nodes.map(node => [node.id, node]));
const relationships = new Map(relationshipPayload.relationships.map(edge => [`${edge.source_id}->${edge.target_id}`, edge]));
const index = createDiscoveryIndex(PUBLISHED_NODES, PUBLISHED_EDGES, details, relationships, getRecentOccurrenceProfile);
assert.equal(discoveryIntent('What causes warming?'), 'cause');
assert.equal(discoveryIntent('What happens next?'), 'effect');
for (const [query, id, kind] of [
  ['What causes ocean acidification?', 'ocean_acidification', 'cause'],
  ['What happens next after global temperature rises?', 'temp', 'effect'],
  ['How can we reduce methane emissions?', 'methane', 'response'],
  ['How is global temperature measured?', 'temp', 'measurement'],
  ['why is the planet getting hotter', 'temp', 'cause']
]) {
  const result = discoverTopics(index, query); const first = result.matches[0];
  assert.equal(first?.node.id, id, query);
  assert.equal(first.evidence.kind, kind, query);
  assert(first.evidence.text.length > 10, `Missing published passage for ${query}`);
  assert(first.evidence.urls.every(url => url.startsWith('https://')));
  for (const related of first.related) {
    assert(PUBLISHED_EDGES.some(edge => kind === 'cause'
      ? edge.source === related.id && edge.target === id
      : edge.source === id && edge.target === related.id));
  }
}
assert.equal(discoverTopics(index, 'zxqv zzqqvv').matches.length, 0);
assert.match(discoverTopics(index, 'air pollution near me').scopeNote, /has not determined your location/);
const causes = discoverTopics(index, 'What causes ocean acidification?').matches[0];
assert.equal(causes.evidence.relatedId, 'carbon_emission', 'Direct documented causes precede indirect modifiers');
assert(causes.evidence.urls.length > 0, 'Relationship answers must retain source links');
const recent = discoverTopics(index, 'latest global temperature').matches[0];
assert.equal(recent.evidence.kind, 'recent');
assert(recent.evidence.urls.length > 0, 'Recent events must retain their own source links');
const tied = createDiscoveryIndex([{ id: 'a', name: 'Example pressure' }, { id: 'b', name: 'Example pressure' }], []);
assert(discoverTopics(tied, 'What causes example pressure?').ambiguous);
console.log('Desktop experience checks passed: storage recovery, Footprint equivalence, question intent, evidence links, relationship direction, ambiguity and no-match recovery.');
