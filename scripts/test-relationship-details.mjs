import assert from 'node:assert/strict';
import {
  getRelationshipDetail,
  loadRelationshipDetails,
  resetRelationshipDetailsForTests
} from '../src/relationship-details.js';

const payload = {
  relationships: [
    {
      source_id: 'carbon_emission',
      target_id: 'temp',
      plain_language: 'Carbon emissions warm the atmosphere.',
      technical_detail: 'Long-lived greenhouse forcing raises radiative imbalance.',
      confidence: { level: 'high', explanation: 'Supported by multiple observing systems.' },
      sources: [{ url: 'https://example.com/source', section: 'Results' }]
    }
  ]
};
let requestCount = 0;
const fetchImpl = async url => {
  requestCount += 1;
  assert.equal(url, '/relationship-descriptions.json');
  return { ok: true, json: async () => payload };
};

resetRelationshipDetailsForTests();
const details = await loadRelationshipDetails(fetchImpl);
assert.equal(details.size, 1);
assert.equal((await getRelationshipDetail('carbon_emission->temp', fetchImpl))?.confidence.level, 'high');
assert.equal(await getRelationshipDetail('temp->unknown', fetchImpl), null);
assert.equal(requestCount, 1, 'Relationship details should be fetched once and reused');

console.log('Relationship detail lazy-loading tests passed.');
