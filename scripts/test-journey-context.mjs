import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describeJourneyBridge, findRelatedPhenomenon } from '../src/journey-context.js';

const phenomena = [
  { key: 'methane', label: 'Methane', nodeIds: ['methane'] },
  { key: 'carbon_emission', label: 'Carbon', nodeIds: ['carbon_emission'] },
  { key: 'food', label: 'Diet', nodeIds: ['food'] }
];
const edges = [
  { source: 'methane', target: 'temp', influence: 0.85 },
  { source: 'carbon_emission', target: 'temp', influence: 0.8 },
  { source: 'temp', target: 'food', influence: 0.4 }
];

const exact = findRelatedPhenomenon(phenomena, { id: 'methane', name: 'Methane' }, edges);
assert.equal(exact?.phenomenon.key, 'methane');
assert.equal(exact?.relationship, 'exact');

const temperature = findRelatedPhenomenon(
  phenomena,
  { id: 'temp', name: 'Global Temperature' },
  edges,
  { preferredPhenomenonKeyByNodeId: { temp: 'carbon_emission' } }
);
assert.equal(temperature?.phenomenon.key, 'carbon_emission');
assert.equal(temperature?.relationship, 'driver');
assert.equal(
  describeJourneyBridge('Global Temperature', temperature),
  'Carbon is an upstream activity connected to Global Temperature.'
);

const downstream = findRelatedPhenomenon(
  phenomena,
  { id: 'unmapped', name: 'Unmapped Topic' },
  [{ source: 'unmapped', target: 'food' }]
);
assert.equal(downstream?.phenomenon.key, 'food');
assert.equal(downstream?.relationship, 'impact');

const upstreamTwoSteps = findRelatedPhenomenon(
  phenomena,
  { id: 'remote_effect', name: 'Remote Effect' },
  [
    { source: 'methane', target: 'bridge' },
    { source: 'bridge', target: 'remote_effect' }
  ]
);
assert.equal(upstreamTwoSteps?.phenomenon.key, 'methane');
assert.equal(upstreamTwoSteps?.relationship, 'driver');
assert.equal(upstreamTwoSteps?.distance, 2);
assert.equal(
  describeJourneyBridge('Remote Effect', upstreamTwoSteps),
  'Methane is the nearest upstream activity connected to Remote Effect.'
);

const downstreamTwoSteps = findRelatedPhenomenon(
  phenomena,
  { id: 'remote_driver', name: 'Remote Driver' },
  [
    { source: 'remote_driver', target: 'bridge' },
    { source: 'bridge', target: 'food' }
  ]
);
assert.equal(downstreamTwoSteps?.phenomenon.key, 'food');
assert.equal(downstreamTwoSteps?.relationship, 'impact');
assert.equal(downstreamTwoSteps?.distance, 2);

const mixedPath = findRelatedPhenomenon(
  phenomena,
  { id: 'mixed_topic', name: 'Mixed Topic' },
  [
    { source: 'mixed_topic', target: 'shared_effect' },
    { source: 'methane', target: 'shared_effect' }
  ]
);
assert.equal(mixedPath?.phenomenon.key, 'methane');
assert.equal(mixedPath?.relationship, 'connected');
assert.equal(mixedPath?.distance, 2);

assert.equal(findRelatedPhenomenon(phenomena, { id: 'none' }, []), null);

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.doesNotMatch(html, /id="phenomena-journey-context"/, 'Activity Impacts must not add an analysis banner above its content');
assert.doesNotMatch(html, /id="phenomena-return-analysis"/, 'Activity Impacts must not show a return-to-analysis control');
assert.doesNotMatch(html, /From your analysis/i, 'Activity Impacts must not show an analysis-context kicker');
assert.doesNotMatch(html, /id="footprint-journey-context"/, 'My Footprint must remain a standalone assessment');
assert.doesNotMatch(html, /id="footprint-return-analysis"/, 'My Footprint must not link back to analysis');
assert.doesNotMatch(html, /id="inspector-footprint-next"/, 'Analysis must not treat My Footprint as part of its connected journey');
assert.match(html, /id="footer-btn-personal-footprint"/, 'My Footprint must remain independently accessible');

console.log('Journey context tests passed.');
