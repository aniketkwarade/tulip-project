import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PUBLISHED_NODES as nodes, PUBLISHED_EDGES as edges } from '../src/data.js';
import { inspectorReaderCopy as copy, assertPublishedReaderCopy, attachInspectorReaderCopy } from '../src/inspector-reader-copy.js';
import { getNodeInspectorMeaning, getNodeInspectorMeasurement, getNodeInspectorEconomicContext, buildHumanInspectorProfile, buildPlanetInspectorProfile } from '../src/node-inspector-display.js';
import { getTulipAssessment } from '../src/tulip-assessment.js';
import { formatMetricDisplayText as metricText, metricizeDisplayValue } from '../src/metric-display.js';
import { buildRuntimeNodeDetails } from '../src/runtime-data-projection.js';
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const mobile = read('../Stitch Import/tulip-mobile/src/mobile-inspector-snapshot.json');
const native = read('../iOS/TULIPiOS/NativeData/mobile-inspector-snapshot.json');
const runtime = buildRuntimeNodeDetails(nodes);
assertPublishedReaderCopy(nodes, edges);
assert.equal(nodes.length, 381);
assert.equal(edges.length, 1290);
const future = { id: 'new_topic_requiring_editorial_review' };
assert.throws(() => assertPublishedReaderCopy([...nodes, future], edges), /new_topic_requiring_editorial_review.definition/);
assert.throws(() => assertPublishedReaderCopy(nodes, [...edges, {source: 'temp', target: 'new_relationship'}]), /temp->new_relationship.explanation/);
for (const collection of ['definitions','profiles','measurements','relationships']) {
  const altered = {...copy, [collection]: {...copy[collection]}};
  delete altered[collection][collection === 'relationships' ? `${edges[0].source}->${edges[0].target}` : nodes[0].id];
  assert.throws(() => assertPublishedReaderCopy(nodes, edges, altered), /Publication requires authored reader copy/);
}
let responses = 0;
for (const node of nodes) {
  const key = node.name.toLowerCase(), m = mobile[key], n = native[key];
  assert(m && n, `Missing platform snapshot: ${node.id}`);
  assert.equal(getNodeInspectorMeaning(node), copy.definitions[node.id]);
  assert(!copy.definitions[node.id].toLowerCase().includes(node.name.toLowerCase()), `Circular definition: ${node.id}`);
  assert.equal(m.description, metricText(copy.definitions[node.id]));
  assert.equal(n.description, m.description);
  const economy = getNodeInspectorEconomicContext(node);
  for (const kind of ['human', 'planet']) {
    const display = kind === 'human' ? buildHumanInspectorProfile(node) : buildPlanetInspectorProfile(node);
    assert.equal(m[kind].summary, metricText(display.summary));
    assert.deepEqual(m[kind].consequences, display.consequences.map(metricText));
    assert.deepEqual(n[kind], m[kind]);
  }
  assert.equal(m.human.hiddenCost, metricText(economy.hiddenCost));
  assert.equal(m.human.whoPays, metricText(economy.whoPays));
  assert.equal(m.planet.physicalLimit, metricText(economy.physicalLimit));
  assert.deepEqual(m.response.levers, economy.systemLevers.map(metricText));
  assert.deepEqual(n.response, m.response);
  assert.deepEqual(m.measurement, metricizeDisplayValue(getNodeInspectorMeasurement(node)));
  assert.deepEqual(n.measurement, m.measurement);
  assert.deepEqual(n.incoming, m.incoming);
  assert.deepEqual(n.outgoing, m.outgoing);
  assert.equal(m.urgency, getTulipAssessment(node).value ?? null);
  assert.equal(n.urgency, m.urgency);
  assert.equal(n.urgencyBand, m.urgencyBand);
  if (node.node_kind === 'response') {responses++; assert.equal(m.urgency, null);}
  const raw = {...node}; delete raw.readerCopy; delete raw.readerMeaning; delete raw.readerMeaningBasis;
  const attached = attachInspectorReaderCopy([raw])[0];
  for (const field of Object.keys(raw)) assert.deepEqual(attached[field], raw[field], `Reader copy mutated ${node.id}.${field}`);
  const detail = Array.isArray(runtime) ? runtime.find(d => d.id === node.id) : runtime[node.id];
  assert.deepEqual(detail.readerCopy, node.readerCopy);
}
assert.equal(responses, 27);
for (const edge of edges) assert.equal(edge.relationship_content.plain_language, copy.relationships[`${edge.source}->${edge.target}`]);
console.log(`Reader copy passed: ${nodes.length} nodes, ${edges.length} relationships; web/mobile/native parity; ${responses} responses without danger scores; missing-copy publication gates.`);
