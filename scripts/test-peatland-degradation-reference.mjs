import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/peatland-degradation-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.nodeId, 'peatland_degradations');
assert.equal(snapshot.sources.length, 2);
const assessment = snapshot.sources.find(source => source.id === 'unep_global_peatlands_assessment_2022');
const restoration = snapshot.sources.find(source => source.id === 'elo_boreal_peatland_restoration_2024');
assert(assessment && restoration);
assert.equal(assessment.facts.drainedOrDegradedCurrentPeatlandsPct, 12);
assert.equal(restoration.facts.sites, 151);
assert.equal(restoration.facts.ecosystemTypes, 6);
assert.deepEqual(restoration.facts.observationsAfterRestorationYears, [0, 2, 5, 10]);
assert.equal(restoration.facts.globalRepresentativeness, false);
assert.deepEqual(snapshot.tulipUse.proposedAxes.applicableDomains, ['ecosystem']);
assert.deepEqual(snapshot.tulipUse.proposedAxes.ecosystem.severity, { lower: 2, central: 3, upper: 4 });
assert.deepEqual(snapshot.tulipUse.proposedAxes.ecosystem.reach, { lower: 2, central: 3, upper: 3 });
assert.deepEqual(snapshot.tulipUse.proposedAxes.ecosystem.persistence, { lower: 2, central: 3, upper: 4 });
assert.match(snapshot.tulipUse.excluded.join(' '), /120-year recovery or consequence duration/i);
assert.match(snapshot.evidenceSynthesis.humanBoundary, /do not quantify direct illness/i);

console.log('Peatland degradation reference passed: condition, affected reach, restoration time, geography and human consequences remain separate.');
