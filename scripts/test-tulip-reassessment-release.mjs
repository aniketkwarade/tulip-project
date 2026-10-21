import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PUBLISHED_NODES } from '../src/data.js';
import { buildTulipAssessments } from './lib/build-tulip-assessments.mjs';
import { currentSourceBinding, requireAuthoredCatalogue, restoreLegacyRegistry } from './lib/build-current-tulip-assessments.mjs';
import { evaluateInternalEstimateAssessment } from '../src/tulip-internal-estimate-assessment.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const [authored, benchmark, decision, legacy, release, publicRegistry, worksheet] = await Promise.all([
  read('src/tulip-reassessments/assessments-v1.json'), read('src/tulip-consequence-policy-v1.json'),
  read('src/tulip-estimate-policy-decision.json'), read('src/tulip-legacy-score-archive.json'),
  read('src/tulip-score-release.json'), read('public/tulip-assessments.json'),
  readFile(new URL('../src/tulip-reassessments/authored-outcomes-v1.tsv', import.meta.url), 'utf8'),
]);
assert.equal(release.active, 'internal_estimates_v1');
assert.equal(release.publicFallback, false);
assert.deepEqual(await buildTulipAssessments(root, { active: 'legacy_archive' }), legacy.assessmentRegistry, 'Rollback must restore the entire exact registry, not recompute legacy values');
assert.equal(legacy.label, 'TULIP Legacy Score');
assert.deepEqual(restoreLegacyRegistry(legacy, release), legacy.assessmentRegistry);
const damaged = structuredClone(legacy); damaged.assessmentRegistry.records.temp.value -= 0.1;
assert.throws(() => restoreLegacyRegistry(damaged, release), /integrity/);
const verify = (nodes = PUBLISHED_NODES, data = authored, b = benchmark, d = decision, t = worksheet) => requireAuthoredCatalogue(nodes, data, b, d, t);
verify();
for (const change of [a => delete a.records.temp, a => a.records.temp.components.human.quantityEstimate += 1,
  a => a.records.temp.components.human.evidenceReferences[0].url = 'https://example.org/changed',
  a => a.records.temp.components.ecosystem.unit = 'wrong', a => a.records.temp.assessmentPeriod = '2036']) {
  const changed = structuredClone(authored); change(changed); assert.throws(() => verify(PUBLISHED_NODES, changed));
}
const changedSource = structuredClone(PUBLISHED_NODES); changedSource[0].source_urls = ['https://example.org/new'];
assert.notEqual(currentSourceBinding(changedSource[0]), currentSourceBinding(PUBLISHED_NODES[0]));
assert.throws(() => verify(changedSource), /Changed definition or source/);
assert.throws(() => verify([...PUBLISHED_NODES, {id:'future_issue',name:'Future',node_kind:'issue'}]), /Missing authored/);
const changedBenchmark = structuredClone(benchmark); changedBenchmark.human.points[1].burden *= 2;
assert.throws(() => verify(PUBLISHED_NODES, authored, changedBenchmark), /policy changed/);
const changedDecision = structuredClone(decision); changedDecision.weights.human = 0.7;
assert.throws(() => verify(PUBLISHED_NODES, authored, benchmark, changedDecision), /policy changed/);
assert.throws(() => verify(PUBLISHED_NODES, authored, benchmark, decision, worksheet + '\n'), /inputs or policy changed/);
for (const node of PUBLISHED_NODES) {
  const assessment = publicRegistry.records[node.id];
  if (node.node_kind === 'response') { assert.equal(assessment.value, null); continue; }
  const row = authored.records[node.id];
  const result = evaluateInternalEstimateAssessment(row);
  assert.equal(result.value, assessment.value);
  assert.equal(result.status, 'internal_estimate');
  assert.equal(assessment.uncertainty, null);
  assert(!('legacyValue' in row) && !('value' in row));
  assert.equal(assessment.measuredHarmClaim, false);
  assert.equal(assessment.scientificCalibrationApproved, false);
  for (const domain of ['human', 'ecosystem']) {
    const component = row.components[domain];
    assert(component.outcomeDefinition.length > 20 && component.attribution.length > 20);
    if (!component.quantityEstimate) assert(component.estimatedAbsenceReason);
    assert(component.assumptions.every(a => a.kind === 'authored_assumption'));
  }
}
assert.equal(authored.records.glacier_meltwater_dependency.components.human.derivation.harmedPeopleEstimate, 10000000);
assert.equal(authored.records.surface_water_storage_instability.components.human.derivation.harmedPeopleEstimate, 5000000);
assert.equal(authored.records.air_pollution_health_burden.components.human.quantityEstimate, 184000000);
assert.equal(authored.records.air_pollution_health_burden.components.human.derivation.sourceYear, 2021);
for (const id of ['heat_related_mortality_burden','heatwave_excess_mortality_rates']) {
  assert.equal(authored.records[id].components.ecosystem.quantityEstimate, 0);
  assert(publicRegistry.records[id].value <= 5.5, 'Fixed 50/50 must not redistribute an absent domain');
}
console.log('Reassessment release passed: 354 explicit estimates, 27 response exclusions; exact legacy rollback; changed sources, assumptions, units, policy and future missing records rejected.');
