import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PUBLISHED_NODES } from '../src/data.js';
import nodeSourceDateRegistry from '../src/node-source-dates.json' with { type: 'json' };
import {
  buildMonitoringSourceProfile,
  extractReviewedHighlights,
  getEvidenceMethodPresentation,
  getSourceAccessPresentation,
  resolveCanonicalSource,
  resolveSupportingSources
} from '../src/monitoring-sources.js';

const registry = JSON.parse(fs.readFileSync(new URL('../public/tulip-source-registry.json', import.meta.url), 'utf8'));
const sources = registry.sources || [];
const urgencyRegistry = JSON.parse(fs.readFileSync(new URL('../public/tulip-urgency-v3-scores.json', import.meta.url), 'utf8'));
const receiptByNodeId = new Map((urgencyRegistry.receipts || []).map(receipt => [receipt.node_id, receipt]));

assert.equal(PUBLISHED_NODES.length, 381, 'The monitoring-source audit must cover every published node');

for (const node of PUBLISHED_NODES) {
  assert.ok(node.metric_contract?.source_id, `${node.id} must declare an exact metric source ID`);
  const matchingSources = sources.filter(source => source.id === node.metric_contract.source_id);
  assert.ok(matchingSources.length >= 1, `${node.id} must have a matching source-registry record`);

  const canonicalSource = resolveCanonicalSource(
    sources,
    node.metric_contract.source_id,
    node.metric_contract.metric_id
  );
  assert.ok(canonicalSource, `${node.id} must resolve one canonical source`);
  assert.equal(canonicalSource.id, node.metric_contract.source_id, `${node.id} must never cross source IDs`);

  const profile = buildMonitoringSourceProfile(
    node,
    sources,
    nodeSourceDateRegistry.entries?.[node.id],
    { urgencyReceipt: receiptByNodeId.get(node.id), urgencyStatus: 'ready' }
  );
  assert.ok(profile, `${node.id} must produce a monitoring profile`);
  assert.equal(profile.nodeId, node.id);
  assert.equal(profile.sourceId, node.metric_contract.source_id);
  assert.ok(profile.sourceResolved, `${node.id} must use registry metadata`);
  assert.ok(profile.sourceName);
  assert.ok(profile.sourceUrl);
  assert.ok(profile.metricName);
  assert.ok(profile.unit);
  assert.ok(profile.geography);
  assert.ok(profile.cadence);
  assert.ok(profile.cadenceLabel);
  assert.ok(profile.meaning, `${node.id} must explain what the metric tells visitors`);
  assert.ok(profile.measurementSource, `${node.id} must expose a separate primary measurement source`);

  if (node.node_kind === 'response') {
    assert.equal(profile.evidenceSnapshot, null, `${node.id} response must not receive urgency evidence`);
    assert.ok(profile.responseTracking, `${node.id} response must explain how progress is tracked`);
    assert.match(profile.responseTracking.note, /does not assign/i);
  } else {
    const receipt = receiptByNodeId.get(node.id);
    assert.ok(receipt, `${node.id} issue must have an urgency receipt`);
    assert.ok(profile.evidenceSnapshot, `${node.id} issue must expose its reviewed evidence snapshot`);
    assert.equal(profile.evidenceSnapshot.asOf, receipt.as_of);
    assert.equal(profile.evidenceSnapshot.method, receipt.method);
    assert.equal(profile.evidenceSnapshot.score, receipt.value);
    assert.ok(profile.evidenceSnapshot.rationale);
    assert.ok(profile.evidenceSnapshot.freshness);
    assert.ok(profile.evidenceSnapshot.highlights.length <= 4);
    assert.equal(profile.supportingSources.length, new Set(receipt.source_ids).size);
    profile.supportingSources.forEach(supportingSource => {
      assert.ok(supportingSource.resolved, `${node.id} evidence source ${supportingSource.id} must resolve exactly`);
      assert.ok(receipt.source_ids.includes(supportingSource.id));
    });
  }
}

assert.equal(receiptByNodeId.size, 354, 'All 354 issue nodes must have reviewed evidence receipts');
assert.equal(PUBLISHED_NODES.filter(node => node.node_kind === 'response').length, 27, 'All 27 response nodes must use response tracking');

const expectedSources = new Map([
  ['water_stress', 'WRI Aqueduct'],
  ['resource_depletion', 'UNSD SDG API / UNEP Material Flows'],
  ['temp', 'NASA GISS Surface Temperature Analysis'],
  ['data_centers', 'IEA Energy and AI']
]);

for (const [nodeId, expectedSourceName] of expectedSources) {
  const node = PUBLISHED_NODES.find(candidate => candidate.id === nodeId);
  const profile = buildMonitoringSourceProfile(node, sources, nodeSourceDateRegistry.entries?.[nodeId], {
    urgencyReceipt: receiptByNodeId.get(nodeId),
    urgencyStatus: 'ready'
  });
  assert.equal(profile.sourceName, expectedSourceName, `${nodeId} must show its canonical source`);
  assert.ok(!JSON.stringify(profile).includes('USAP-2322117'), `${nodeId} must not include loose Earthdata matches`);
}

const waterStressProfile = buildMonitoringSourceProfile(
  PUBLISHED_NODES.find(node => node.id === 'water_stress'),
  sources,
  nodeSourceDateRegistry.entries.water_stress,
  { urgencyReceipt: receiptByNodeId.get('water_stress'), urgencyStatus: 'ready' }
);
assert.equal(waterStressProfile.evidenceSnapshot.asOf, '2023');
assert.equal(waterStressProfile.evidenceSnapshot.methodLabel, 'Current observations');

const resourceProfile = buildMonitoringSourceProfile(
  PUBLISHED_NODES.find(node => node.id === 'resource_depletion'),
  sources,
  nodeSourceDateRegistry.entries.resource_depletion,
  { urgencyReceipt: receiptByNodeId.get('resource_depletion'), urgencyStatus: 'ready' }
);
assert.equal(resourceProfile.evidenceSnapshot.methodLabel, 'Accumulated evidence');
assert.equal(resourceProfile.evidenceSnapshot.highlights.length, 4);

const temperatureProfile = buildMonitoringSourceProfile(
  PUBLISHED_NODES.find(node => node.id === 'temp'),
  sources,
  nodeSourceDateRegistry.entries.temp,
  { urgencyReceipt: receiptByNodeId.get('temp'), urgencyStatus: 'ready' }
);
assert.equal(temperatureProfile.measurementSource.name, 'NASA GISS Surface Temperature Analysis');
assert.deepEqual(
  temperatureProfile.supportingSources.map(source => source.name),
  ['WMO State of the Global Climate 2025', 'Copernicus Surface Air Temperature June 2026']
);
assert.equal(
  temperatureProfile.evidenceSnapshot.highlights.filter(highlight => highlight.value === '1.43').length,
  1,
  'Equivalent Celsius units must not repeat the same reviewed temperature value'
);

const dataCentersNode = PUBLISHED_NODES.find(node => node.id === 'data_centers');
const dataCenterHighlights = extractReviewedHighlights(dataCentersNode, receiptByNodeId.get('data_centers'));
assert.deepEqual(dataCenterHighlights.map(highlight => [highlight.value, highlight.unit]), [['415', 'TWh'], ['1.5', '%']]);

assert.equal(getEvidenceMethodPresentation('modeled').label, 'Modeled estimate');
assert.deepEqual(
  resolveSupportingSources(sources, ['wmo_state_of_global_climate_2025', 'wmo_state_of_global_climate_2025']).map(source => source.id),
  ['wmo_state_of_global_climate_2025'],
  'Supporting sources must be de-duplicated without fuzzy substitution'
);

assert.deepEqual(getSourceAccessPresentation('open_api'), {
  label: 'Technical API',
  cta: 'Open technical API'
});
assert.deepEqual(getSourceAccessPresentation('open_download'), {
  label: 'Downloadable dataset',
  cta: 'View data'
});
assert.deepEqual(getSourceAccessPresentation('reference_only'), {
  label: 'Report or scientific reference',
  cta: 'Read source'
});

const fallbackNode = PUBLISHED_NODES.find(node => node.id === 'water_stress');
const fallbackProfile = buildMonitoringSourceProfile(
  fallbackNode,
  [],
  nodeSourceDateRegistry.entries.water_stress,
  { registryStatus: 'error' }
);
assert.equal(fallbackProfile.sourceResolved, false);
assert.ok(fallbackProfile.sourceUrl, 'Registry failure must retain a reviewed source link');
assert.equal(fallbackProfile.registryStatus, 'error');

const maliciousNode = {
  id: 'malicious_test',
  name: '<img src=x onerror=alert(1)>',
  metric_contract: {
    source_id: 'malicious_source',
    metric_id: 'malicious_metric',
    metric_name: '<script>alert(1)</script>',
    unit: '<b>unit</b>',
    geography: 'global',
    cadence: 'annual'
  },
  source_urls: ['javascript:alert(1)']
};
const maliciousProfile = buildMonitoringSourceProfile(maliciousNode, [], null, { registryStatus: 'error' });
assert.equal(maliciousProfile.sourceUrl, 'javascript:alert(1)', 'The view model preserves source data for the renderer to sanitize');

console.log(`Monitoring source tests passed for ${PUBLISHED_NODES.length} published nodes.`);
