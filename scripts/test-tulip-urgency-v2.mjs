import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { NODES } from '../src/data.js';
import { restoreGeneratedArtifactsOnExit } from './lib/restore-generated-artifacts.mjs';
import {
  buildTulipUrgencyReceipt,
  calculateComposite,
  compositeToTulipScore,
  getTulipUrgencyBand,
  hashTulipInputs,
  historicalDistributionAnchors,
  normalizeWithAnchors,
  qualifiesForCurrentData,
  qualifiesForImpactFallback,
  selectHighestUrgencyMethod,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = filename => JSON.parse(fs.readFileSync(path.join(ROOT, 'public', filename), 'utf8'));

restoreGeneratedArtifactsOnExit(ROOT, [
  'public/tulip-urgency-pilot-comparison.json',
  'public/tulip-urgency-pilot-scores.json',
  'public/tulip-urgency-rollout-comparison.json',
  'public/tulip-urgency-scores.json'
]);

// Documented anchor boundaries and interpolation.
assert.equal(normalizeWithAnchors(0, [0, 10, 20, 30]), 0);
assert.equal(normalizeWithAnchors(10, [0, 10, 20, 30]), 0.33);
assert.equal(normalizeWithAnchors(20, [0, 10, 20, 30]), 0.67);
assert.equal(normalizeWithAnchors(30, [0, 10, 20, 30]), 1);
assert.equal(normalizeWithAnchors(75, [100, 75, 50, 25], 'lower_is_worse'), 0.33);
assert.equal(normalizeWithAnchors(25, [100, 75, 50, 25], 'lower_is_worse'), 1);

// Historical distributions require 20 annual or 60 monthly complete observations.
assert.equal(historicalDistributionAnchors(Array.from({ length: 19 }, (_, i) => i), 'annual'), null);
assert.equal(historicalDistributionAnchors(Array.from({ length: 59 }, (_, i) => i), 'monthly'), null);
assert.equal(historicalDistributionAnchors(Array.from({ length: 20 }, (_, i) => i), 'annual').length, 4);
assert.equal(historicalDistributionAnchors(Array.from({ length: 60 }, (_, i) => i), 'monthly').length, 4);

// Weighting, 1–10 conversion, rounding and all band transitions.
assert.equal(calculateComposite('current_data', { magnitude: 1, threshold: 0, momentum: 0, extent: 0 }), 0.30);
assert.equal(calculateComposite('impact_fallback', { biophysical_burden: 1, human_economic_burden: 0, persistence: 0, extent: 0 }), 0.35);
assert.equal(compositeToTulipScore(0.555), 6.0);
assert.equal(getTulipUrgencyBand(1), 'Low');
assert.equal(getTulipUrgencyBand(2.9), 'Low');
assert.equal(getTulipUrgencyBand(3), 'Elevated');
assert.equal(getTulipUrgencyBand(4.9), 'Elevated');
assert.equal(getTulipUrgencyBand(5), 'Rising');
assert.equal(getTulipUrgencyBand(6.9), 'Rising');
assert.equal(getTulipUrgencyBand(7), 'Critical');
assert.equal(getTulipUrgencyBand(8.4), 'Critical');
assert.equal(getTulipUrgencyBand(8.5), 'Critical');
assert.equal(getTulipUrgencyBand(10), 'Critical');

// Missing inputs fail closed and are never converted to zero.
assert.throws(() => calculateComposite('current_data', { magnitude: 0.5, threshold: 0.5, extent: 1 }), /Missing normalized components/);
assert.throws(() => normalizeWithAnchors(undefined, [0, 1, 2, 3]), /finite number/);

const currentCandidate = {
  direct_components: ['magnitude', 'threshold'],
  global_scope: true,
  current_observation: true
};
const impactCandidate = {
  quantitative_evidence: true,
  components: { biophysical_burden: 0.6, human_economic_burden: 0.6, persistence: 0.6, extent: 1 }
};
const modeledCandidate = { components: { modeled_estimate: 0.6 } };
assert.equal(qualifiesForCurrentData(currentCandidate), true);
assert.equal(qualifiesForImpactFallback(impactCandidate), true);
assert.equal(selectHighestUrgencyMethod({ current_data: currentCandidate, impact_fallback: impactCandidate, modeled: modeledCandidate }), 'current_data');
assert.equal(selectHighestUrgencyMethod({ current_data: null, impact_fallback: impactCandidate, modeled: modeledCandidate }), 'impact_fallback');
assert.equal(selectHighestUrgencyMethod({ current_data: null, impact_fallback: null, modeled: modeledCandidate }), 'modeled');

// The same node automatically advances modeled → impact → current as coverage improves.
const progression = [
  selectHighestUrgencyMethod({ modeled: modeledCandidate }),
  selectHighestUrgencyMethod({ impact_fallback: impactCandidate, modeled: modeledCandidate }),
  selectHighestUrgencyMethod({ current_data: currentCandidate, impact_fallback: impactCandidate, modeled: modeledCandidate })
];
assert.deepEqual(progression, ['modeled', 'impact_fallback', 'current_data']);

// Stable canonical hashing is independent of object insertion order.
assert.equal(hashTulipInputs({ b: 2, a: 1 }), hashTulipInputs({ a: 1, b: 2 }));

// Current-data backtest: reference anchors produce low urgency and extreme anchors produce extreme urgency.
const backtestReceipt = component => buildTulipUrgencyReceipt({
  node_id: 'temperature_calibration_backtest',
  method: 'current_data',
  as_of: '2000-12-31',
  components: { magnitude: component, threshold: component, momentum: component, extent: component },
  raw_inputs: { calibration_component: component },
  transformations: [{ type: 'anchor_boundary_backtest' }],
  source_ids: ['temperature_calibration_fixture'],
  uncertainty: 'Deterministic boundary fixture.',
  freshness: 'test fixture',
  selection_reason: { selected_method_passed: 'fixture', higher_priority_failures: [] }
});
assert.equal(backtestReceipt(0).value, 1);
assert.equal(backtestReceipt(1).value, 10);

const beforePilot = readJson('tulip-urgency-pilot-scores.json');
execFileSync(process.execPath, ['scripts/export-tulip-urgency-pilot.mjs'], { cwd: ROOT, stdio: 'pipe' });
const pilotRegistry = readJson('tulip-urgency-pilot-scores.json');
const pilotReport = readJson('tulip-urgency-pilot-comparison.json');
assert.equal(pilotRegistry.status, 'shadow_review');
assert.equal(pilotRegistry.production_scores_replaced, false);
assert.equal(pilotRegistry.receipts.length, 12);
assert.deepEqual(beforePilot.receipts.map(receipt => receipt.input_hash), pilotRegistry.receipts.map(receipt => receipt.input_hash));
assert.ok(pilotRegistry.receipts.every(receipt => verifyTulipUrgencyReceipt(receipt).valid));

const expectedMethods = {
  temp: 'current_data', methane: 'current_data', carbon_emission: 'current_data',
  deforestation: 'impact_fallback', industry_farming: 'impact_fallback', food: 'impact_fallback',
  urbanization: 'impact_fallback', fast_fashion: 'impact_fallback', migration: 'impact_fallback',
  resource_depletion: 'impact_fallback', personal_conveyance: 'impact_fallback',
  environ_anomalies: 'current_data'
};
for (const receipt of pilotRegistry.receipts) {
  assert.equal(receipt.method, expectedMethods[receipt.node_id]);
  assert.ok(receipt.selection_reason.selected_method_passed);
  if (receipt.method !== 'modeled') {
    assert.ok(receipt.source_ids.length > 0, `${receipt.node_id} must cite quantitative evidence`);
  } else {
    assert.ok(receipt.model_version, `${receipt.node_id} must name its model version`);
  }
}

const graphNodes = new Map(NODES.map(node => [node.id, node]));
assert.ok(pilotRegistry.receipts.every(receipt => graphNodes.get(receipt.node_id)?.node_kind !== 'response'));
for (const row of pilotReport.comparison) assert.equal(graphNodes.get(row.node_id).score.baseline, row.legacy_score);

// ±20% sensitivity was run for every row and unstable rank neighborhoods are flagged.
assert.equal(pilotReport.comparison.length, 12);
assert.ok(pilotReport.comparison.every(row => Number.isFinite(row.sensitivity.minimum)
  && Number.isFinite(row.sensitivity.maximum)
  && typeof row.sensitivity.rank_unstable === 'boolean'));

// Full rollout produces exactly one approved receipt per issue node and excludes every response node.
execFileSync(process.execPath, ['scripts/export-tulip-urgency-registry.mjs'], { cwd: ROOT, stdio: 'pipe' });
const registry = readJson('tulip-urgency-scores.json');
const rolloutReport = readJson('tulip-urgency-rollout-comparison.json');
execFileSync(process.execPath, ['scripts/export-tulip-urgency-registry.mjs'], { cwd: ROOT, stdio: 'pipe' });
const repeatedRegistry = readJson('tulip-urgency-scores.json');
const issueNodes = NODES.filter(node => node.node_kind !== 'response');
const responseNodes = NODES.filter(node => node.node_kind === 'response');
assert.equal(registry.status, 'approved');
assert.equal(registry.production_scores_replaced, true);
assert.equal(registry.scope, 'all_issue_nodes');
assert.equal(registry.receipts.length, issueNodes.length);
assert.equal(registry.excluded_response_node_ids.length, responseNodes.length);
assert.deepEqual(new Set(registry.receipts.map(receipt => receipt.node_id)), new Set(issueNodes.map(node => node.id)));
assert.ok(responseNodes.every(node => !registry.receipts.some(receipt => receipt.node_id === node.id)));
assert.ok(registry.receipts.every(receipt => verifyTulipUrgencyReceipt(receipt).valid));
assert.deepEqual(registry.receipts.map(receipt => receipt.input_hash), repeatedRegistry.receipts.map(receipt => receipt.input_hash));
assert.equal(Object.values(registry.method_counts).reduce((sum, count) => sum + count, 0), issueNodes.length);
assert.ok(registry.method_counts.current_data >= 61);
assert.ok(registry.method_counts.impact_fallback >= 37);
assert.ok(registry.method_counts.impact_fallback >= 12);
assert.equal(registry.method_counts.modeled, issueNodes.length - registry.method_counts.current_data - registry.method_counts.impact_fallback);

// Pilot evidence tiers are preserved, while every newly modeled node carries a named reproducible model.
for (const [nodeId, method] of Object.entries(expectedMethods)) {
  assert.equal(registry.receipts.find(receipt => receipt.node_id === nodeId)?.method, method);
}
assert.ok(registry.receipts.filter(receipt => receipt.method === 'modeled').every(receipt => receipt.model_version));
assert.ok(registry.receipts.every(receipt => receipt.selection_reason?.selected_method_passed));
assert.ok(registry.receipts.filter(receipt => receipt.method === 'modeled')
  .every(receipt => receipt.selection_reason.higher_priority_failures?.length === 2));
assert.ok(registry.receipts.filter(receipt => receipt.method !== 'modeled').every(receipt => receipt.source_ids.length > 0));
assert.ok(registry.receipts.filter(receipt => receipt.model_version === 'tulip_modeled_global_v1')
  .every(receipt => receipt.transformations.some(transformation => transformation.exclusions?.includes('graph degree'))));

// Operational lineage is metadata, never an evidence-volume urgency multiplier.
const modeledWithLineage = registry.receipts.filter(receipt => receipt.method === 'modeled' && receipt.raw_inputs.operational_lineage?.length);
// Zero is valid once every operationally bound modeled node has been promoted to an evidence-backed tier.
assert.ok(modeledWithLineage.every(receipt => receipt.raw_inputs.operational_lineage.every(binding => binding.snapshot_sha256)));

// Full comparison and sensitivity cover the same complete issue-node scope.
assert.equal(rolloutReport.comparison.length, issueNodes.length);
assert.ok(rolloutReport.comparison.every(row => Number.isFinite(row.sensitivity.minimum)
  && Number.isFinite(row.sensitivity.maximum)
  && Number.isFinite(row.sensitivity.max_delta)
  && typeof row.sensitivity.rank_unstable === 'boolean'));
for (const row of rolloutReport.comparison) assert.equal(graphNodes.get(row.node_id).score.baseline, row.legacy_score);

// Only the modeled score receives a visible modeled-tag path in the inspector implementation.
const mainSource = fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const styleSource = fs.readFileSync(path.join(ROOT, 'src', 'style.css'), 'utf8');
assert.match(htmlSource, /id="console-urgency-modeled"[^>]*hidden/);
assert.match(mainSource, /receipt\.method === 'modeled'/);
assert.match(mainSource, /tulipUrgencyStatus === 'approved'/);

// Displayed regions align exactly with score intervals 1–3, 3–5, 5–7 and 7–10.
const urgencyBandLabels = ['Low', 'Elevated', 'Rising', 'Critical'];
assert.deepEqual(
  [...htmlSource.matchAll(/data-urgency-band="([^"]+)"/g)].map(match => match[1]),
  urgencyBandLabels,
);
for (const label of urgencyBandLabels) {
  assert.match(
    htmlSource,
    new RegExp(`data-urgency-band="${label}"[^>]*>[\\s\\S]*?class="urgency-band-abbreviation"[^>]*>${label}<\\/span>`),
  );
}
assert.match(styleSource, /grid-template-columns:\s*2fr 2fr 2fr 3fr/);
assert.match(htmlSource, /left:\s*22\.222%[\s\S]*left:\s*44\.444%[\s\S]*left:\s*66\.667%/);

console.log('TULIP urgency v2 tests passed: normalization, hierarchy, receipts, shadow safety, sensitivity and modeled presentation.');
