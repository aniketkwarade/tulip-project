import assert from 'node:assert/strict';
import {
  hydrateRuntimeNodeDetails,
  resetNodeDetailsForTests
} from '../src/node-details.js';

const nodes = [{ id: 'temp', name: 'Global Temperature', runtimeHints: { hasHumanImpact: true } }];
let requestCount = 0;
const fetchImpl = async url => {
  requestCount += 1;
  assert.equal(url, '/runtime-node-details.json');
  return {
    ok: true,
    json: async () => ({
      version: 1,
      nodes: [{
        id: 'temp',
        humanImpact: { summary: 'Warming raises heat exposure.' },
        metric_contract: { metric_id: 'global_temperature' }
      }]
    })
  };
};

resetNodeDetailsForTests();
await hydrateRuntimeNodeDetails(nodes, fetchImpl);
await hydrateRuntimeNodeDetails(nodes, fetchImpl);

assert.equal(nodes[0].humanImpact.summary, 'Warming raises heat exposure.');
assert.equal(nodes[0].metric_contract.metric_id, 'global_temperature');
assert.equal(requestCount, 1, 'Node details should be fetched once and reused');

console.log('Node detail lazy-loading tests passed.');
