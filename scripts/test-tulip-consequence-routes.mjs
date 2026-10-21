import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUBLISHED_NODES } from '../src/data.js';
import { requireConsequenceRoute, requireCatalogueConsequenceRoutes } from './lib/tulip-consequence-route-contract.mjs';

const registry = JSON.parse(readFileSync(new URL('../src/tulip-consequence-routes-v1.json', import.meta.url)));
const rows = requireCatalogueConsequenceRoutes(PUBLISHED_NODES, registry);
assert.equal(rows.length, 381);
assert.equal(rows.filter(row => row.nodeKind === 'response').length, 27);
assert.equal(rows.filter(row => row.provenance === 'definition_and_metric_semantic_interpretation_2026_09_28').length, 69);
const node = PUBLISHED_NODES.find(node => node.id === 'temp');
const unchanged = structuredClone(requireConsequenceRoute(node, registry));
for (const mutation of [
  copy => { copy.metric_contract.unit = 'different unit'; },
  copy => { copy.readerMeaning = 'A different node boundary.'; },
  copy => { copy.metric_contract.geography = 'different geography'; },
  copy => { copy.metric_contract.source_id = 'different source'; },
  copy => { copy.node_kind = 'response'; },
]) {
  const changed = structuredClone(node); mutation(changed);
  assert.throws(() => requireConsequenceRoute(changed, registry));
}
const future = { ...node, id: 'future_consequence_node' };
assert.throws(() => requireConsequenceRoute(future, registry), /explicit consequence research route/);
assert.throws(() => requireConsequenceRoute({ ...node, id: 'constructor' }, registry));
assert.throws(() => requireCatalogueConsequenceRoutes([...PUBLISHED_NODES, future], registry));
assert.deepEqual(requireConsequenceRoute(node, registry), unchanged, 'An unrelated node must not alter existing route requirements.');
const misleading = structuredClone(registry);
misleading.records.temp.numericalAdmission = true;
assert.throws(() => requireConsequenceRoute(node, misleading), /not numerical calibration approval/);
assert.equal(registry.records.biodiversity_intactness_loss.indicatorRole, 'occurrence_coverage_proxy');
assert(registry.records.heat_related_mortality_burden.reason.includes('overlapping'));
console.log('Consequence research routes passed: 381 explicit records, 69 new semantic interpretations, stale/missing routes rejected, no numerical admission.');
