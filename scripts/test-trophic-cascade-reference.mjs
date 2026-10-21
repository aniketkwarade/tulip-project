import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/trophic-cascade-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.nodeId, 'trophic_cascade_collapses');
assert.equal(snapshot.sources.length, 3);
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.match(snapshot.sources[0].facts.boundary, /conditional local cascade strength/i);
assert.equal(snapshot.sources[0].facts.predatorHerbivoreProducerMeasurements, 147);
assert.equal(snapshot.sources[1].facts.globalSites, 161);
assert.equal(snapshot.sources[2].facts.studies, 297);
assert.equal(snapshot.sources[2].facts.observations, 5990);
assert.equal(snapshot.sources[2].facts.nonSignificantResponseCategories, 14);
assert.deepEqual(snapshot.tulipUse.proposedAxes.applicableDomains, ['ecosystem']);
assert.deepEqual(snapshot.tulipUse.proposedAxes.ecosystem, {
  severity: { lower: 2, central: 3, upper: 4 },
  reach: { lower: 0, central: 1, upper: 2 },
  persistence: { lower: 1, central: 2, upper: 3 },
});
assert(snapshot.tulipUse.excluded.some(rule => /study counts.+reach/i.test(rule)));
assert(snapshot.tulipUse.excluded.some(rule => /harmed-person count/i.test(rule)));
assert.match(snapshot.snapshotDigest, /^[a-f0-9]{64}$/);

console.log('Trophic-cascade reference passed: conditional effect size, global prevalence, direction, persistence and human pathways remain separate.');
