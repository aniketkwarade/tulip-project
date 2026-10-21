import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const inventory = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/internal-ecosystem-endpoint-inventory.json', import.meta.url), 'utf8'));

assert.equal(inventory.productionRatingsEnabled, 0);
assert.equal(inventory.summary.ecosystemActiveNodes, inventory.nodes.length);
assert.equal(inventory.summary.nodesWithAtLeastOneGap, inventory.nodes.filter(row => row.missingCount > 0).length);
assert.equal(inventory.summary.nodesWithAllThreeExactAxes, inventory.nodes.filter(row => row.missingCount === 0).length);
assert.equal(Object.values(inventory.summary.confidence).reduce((sum, count) => sum + count, 0), inventory.nodes.length);
for (const axis of ['severity', 'reach', 'persistence']) {
  assert.equal(inventory.summary.exactAxisLevelCounts[axis] + inventory.summary.boundedAxisCounts[axis], inventory.nodes.length, axis);
}
assert.equal(inventory.summary.detailedEvidenceReviewedNodes, inventory.nodes.filter(row => row.reviewMethod === 'detailed_evidence_review').length);
assert.equal(new Set(inventory.nodes.map(row => row.nodeId)).size, inventory.nodes.length);
assert(inventory.nodes.every(row => row.missingAxes.length === row.missingCount));
assert(inventory.nodes.every(row => ['terrestrial_extent_condition_and_species', 'marine_habitat_condition_and_species', 'freshwater_extent_connectivity_and_species', 'cryosphere_extent_and_ecological_response', 'pressure_to_receptor_endpoint_linkage', 'direct_footprint_and_terminal_ecosystem_consequence'].includes(row.sourceTrack)));
assert.match(inventory.methodGuard.join(' '), /record length is not consequence persistence/i);
assert.match(inventory.researchSources.find(source => source.id === 'iucn_red_list_v4').licence, /commercial use prohibited/i);

for (const nodeId of ['biodiversity_intactness_loss', 'seagrass_meadow_decline']) {
  const row = inventory.nodes.find(item => item.nodeId === nodeId);
  assert(row, nodeId);
  assert.equal(row.anchored.persistence, false, nodeId);
}
const mangrove = inventory.nodes.find(item => item.nodeId === 'mangrove_buffer_loss');
assert(mangrove);
assert.deepEqual(mangrove.anchored, { severity: true, reach: true, persistence: true });
assert.equal(mangrove.missingCount, 0);

console.log(`TULIP ecosystem endpoint inventory passed: ${inventory.nodes.length} ecosystem-active nodes have complete, non-duplicated gap records and licensed-source constraints remain explicit.`);
