import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PUBLISHED_NODES } from '../src/data.js';
import { TULIP_ASSESSMENTS, getTulipAssessment, SCORE_METHOD_COPY } from '../src/tulip-assessment.js';
import { evaluateHarmScore, normalizeHarm, scoreSensitivity, policyDefinition, calibrationDefinition, assessmentDefinition } from '../src/tulip-score-method.js';
import { applyAssessmentToProfile, historicalRank } from '../src/tulip-assessment-core.js';
import { projectRuntimeNode } from '../src/runtime-data-projection.js';
import { buildTulipAssessments } from './lib/build-tulip-assessments.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const [registry, mobile, native, graph, policy, method, pilot] = await Promise.all([
  json('public/tulip-assessments.json'), json('Stitch Import/tulip-mobile/src/mobile-inspector-snapshot.json'),
  json('iOS/TULIPiOS/NativeData/mobile-inspector-snapshot.json'), json('Stitch Import/tulip-mobile/src/mobile-graph-snapshot.json'),
  json('src/tulip-score-policy.json'), json('iOS/TULIPiOS/NativeData/tulip-score-method.json'), json('src/tulip-assessment-pilot.json'),
]);
assert.deepEqual(TULIP_ASSESSMENTS, registry);
assert.deepEqual(await buildTulipAssessments(root), registry, 'Regenerate source-bound assessment exports');
await import('./test-tulip-assessment-continuity.mjs');
await import('./test-tulip-consequence-routes.mjs');
assert.deepEqual(method, SCORE_METHOD_COPY);
assert.equal(registry.coverage.total, 381);
assert.equal(registry.coverage.assessed, 354);
assert.equal(registry.coverage.internalEstimates, 354);
assert.equal(registry.coverage.measuredWholeNodeRatings, 0);
assert.equal(registry.coverage.responses, 27);
assert.equal(registry.coverage.unscored, 0);
assert.equal(registry.policy.assessmentBasis, 'current_harm_with_explicit_ecological_priority');
assert.deepEqual(registry.policy.outlook, {horizon:{start:2027,end:2036},scenario:'SSP2-4.5',changesCurrentScore:false});
assert.equal(registry.schemaVersion, 5);
assert.deepEqual(registry.policy.scoreScale, {minimum:1,maximum:10,decimalPlaces:1,direction:'higher_means_greater_current_harm_and_declared_priority'});
assert.equal(registry.policy.scientificCalibrationApproved, false);
assert(!('gradeBands' in registry.policy));
for (const node of PUBLISHED_NODES) {
  const a = getTulipAssessment(node), key = node.name.toLowerCase();
  assert.equal(a.nodeId, node.id);
  assert(!('legacy' in a));
  assert.deepEqual(mobile[key].assessment, a);
  assert.deepEqual(native[key].assessment, a);
  for(const profile of [mobile[key],native[key]]) {assert.equal(profile.human.severity,undefined);assert.equal(profile.planet.severity,undefined);}
  assert.equal(mobile[key].urgency, a.value);
  assert.equal(native[key].urgency, a.value);
  assert.equal(mobile[key].urgencyBand, null);
  assert.equal(native[key].urgencyBand, null);
  assert(!('band' in a));
  assert(!('grade' in a));
  const g = graph.graphNodes.find(g => g.id === node.id);
  const runtime = projectRuntimeNode(node);
  assert(a.explanation.includes(node.name) || node.node_kind === 'response');
  assert(a.evidenceAudit.required.length);
  assert.equal(a.evidenceAudit.previousRoute, undefined);
  assert.equal(a.evidenceAudit.observations, undefined);
  for(const ref of a.evidenceReferences) {assert.equal(new URL(ref.url).protocol,'https:');assert(!/[\s|]/.test(ref.url));}
  if (node.node_kind === 'response') {
    assert.equal(a.label, 'Response'); assert.equal(a.status, 'not_applicable');
    assert.equal(a.value, null);
    assert.equal(g.tulipScore, null); assert.equal(g.score.baseline, null);
    assert.equal(runtime.tulipScore, null); assert.equal(runtime.score.baseline, null); assert.equal(runtime.impactScore, null);
  }
  else {
    assert.equal(a.label, 'TULIP Score'); assert.equal(a.status, 'internal_estimate');
    assert.equal(a.valueLabel, 'Internal estimate'); assert.equal(a.valueKind, 'internal_estimate');
    assert(Number.isFinite(a.value) && a.value >= 1 && a.value <= 10);
    assert.equal(a.confidence, 'provisional');
    assert.equal(a.uncertainty, null);
    assert.deepEqual(a.domainWeights, {human:0.5,ecosystem:0.5});
    assert.equal(a.assessmentBasis, 'current_harm_with_explicit_ecological_priority');
    assert.equal(a.sensitivity.status, 'illustrative_assumption_sensitivity_not_uncertainty');
    for (const component of Object.values(a.components)) {
      assert.equal(component.confidence, 'provisional');
      assert(component.assumptions.length && component.evidenceReferences.length);
      assert.equal(component.kind, 'internal_estimate');
      assert(!('lower' in component)); assert(!('upper' in component)); assert(!('axes' in component));
    }
    assert.match(a.accessibilityLabel, /Internal estimate/);
    assert.equal(a.sensitivity.scoreRange, undefined);
    assert.deepEqual(a.scenarioChecks, []);
    assert.equal(g.tulipScore, a.value); assert.equal(g.score.baseline, a.value);
    assert.equal(runtime.tulipScore, a.value); assert.equal(runtime.score.baseline, a.value); assert.equal(runtime.impactScore, a.value * 10);
  }
}
assert(pilot.nodes.every(n => registry.records[n.node_id].evidenceAudit.pilotFinding));
assert(Object.values(registry.records).filter(record => record.nodeKind === 'issue').every(record => Number.isFinite(record.value)));
const future = getTulipAssessment({id:'future',name:'Future',score:{baseline:9.9}});
assert.equal(future.value, null); assert.equal(applyAssessmentToProfile({urgency:9.9}, future).urgency, null);
assert.equal(getTulipAssessment({id:'constructor',name:'Future'}).value, null);
assert.equal(getTulipAssessment({id:'response_future',name:'Response',node_kind:'response'}).label, 'Response');

// Synthetic contracts exercise the mathematics and admission rules only. They are
// not real forecasts, external reviews, or calibration evidence and are never exported.
const reviewed = definition => ({status:'approved',definition:structuredClone(definition), reviews:['domain','statistical'].map(role => ({role,independent:true,reviewerType:'external_expert',reviewer:'Synthetic test fixture',evidenceUrl:'https://example.org/test-only'}))});
const p = structuredClone(policy);
p.calibrationReview = reviewed(policyDefinition(p));
for (const dimension of ['human','ecosystem']) {
  const c = {dimension,policyVersion:p.version,unit:dimension === 'human' ? 'person-days' : 'area-years',anchors:[[0,0],[100,1]],modelIds:[`${dimension}_test_model`],rationale:'Synthetic test scale only',evidenceReferences:[{id:'fixture',label:'Test only',url:'https://example.org/test-only'}]};
  c.review = reviewed(calibrationDefinition(c)); p.calibrations[dimension] = c;
}
const node = {id:'test_only',name:'Synthetic fixture'};
const candidate = {nodeId:node.id,policyVersion:p.version,sourceDigest:'test-digest',horizon:p.horizon,scenario:p.scenario,geography:p.geography,comparisonGroup:p.comparisonGroup,
  inputs:[{path:'test-only.json',sha256:'a'.repeat(64)}],
  evidenceReferences:[{id:'fixture',label:'Test only',url:'https://example.org/test-only'}],
  components:Object.fromEntries(['human','ecosystem'].map((dimension,i)=>[dimension,{estimate:i ? 80 : 20,unit:p.calibrations[dimension].unit,
    context:{horizon:p.horizon,scenario:p.scenario,geography:p.geography,comparisonGroup:p.comparisonGroup},
    calibrationId:dimension,modelId:`${dimension}_test_model`,counterfactual:'Test absence of pressure',attribution:'Test attribution',aggregation:'Test global total',overlapReview:'Test disjoint consequences',
    sourceIds:['fixture'],lossIds:[dimension],uncertainty:{lower:i ? 70 : 10,upper:i ? 90 : 30,label:'Test bounds, not probabilities'}}]))};
candidate.review = reviewed(assessmentDefinition(candidate));
const evaluate = (c=candidate,pol=p,digest='test-digest') => evaluateHarmScore(node,c,pol,digest);
const good = evaluate(); assert.equal(good.value,5.5); assert.equal(good.band,null); assert.equal(good.status,'assessed');
assert.equal(good.uncertainty.kind,'propagated_bounds');
assert.equal(good.uncertainty.lower,4.6); assert(Math.abs(good.uncertainty.upper-6.4)<1e-12);
assert.equal(scoreSensitivity(good).weightCases.length,3);
for (const mutate of [
 c=>delete c.components.ecosystem,
 c=>c.components.human.unit='wrong-unit',
 c=>c.components.ecosystem.lossIds=['human'],
 c=>c.components.human.lossIds=['human','human'],
 c=>c.scenario='SSP3-7.0',
 c=>c.components.human.context.scenario='SSP1-2.6',
 c=>c.components.ecosystem.context.geography='one region',
 c=>delete c.review,
 c=>c.horizon={start:2050,end:2060},
 c=>c.geography='one city',
 c=>c.comparisonGroup='incompatible',
 c=>c.nodeId='wrong',
 c=>c.policyVersion='old',
 c=>c.components.human.modelId='peer-score',
 c=>c.components.human.estimate=NaN,
 c=>c.components.human.estimate=101,
 c=>c.components.human.uncertainty={lower:80,upper:20,label:'reversed'},
 c=>delete c.components.human.uncertainty,
 c=>c.components.human.sourceIds=['missing'],
 c=>c.evidenceReferences.push(c.evidenceReferences[0]),
 c=>delete c.components.human.counterfactual,
 c=>c.inputs=[],
]) { const changed=structuredClone(candidate);mutate(changed);if(changed.review) changed.review=reviewed(assessmentDefinition(changed));assert.equal(evaluate(changed).value,null); }
assert.equal(evaluate(candidate,p,'changed-source').status,'needs_review');
for (const mutate of [
 p=>p.calibrationReview=null,
 p=>p.calibrationReview.reviews[0].reviewerType='ai_assisted',
 p=>p.calibrations.human.anchors=[[0,0],[200,1]],
 p=>p.calibrations.human.review=null,
 p=>{delete p.calibrations.human.evidenceReferences;p.calibrations.human.review=reviewed(calibrationDefinition(p.calibrations.human));},
 p=>p.weights={human:.7,ecosystem:.3},
]) { const changed=structuredClone(p);mutate(changed);assert.equal(evaluate(candidate,changed).value,null); }
// Missing evidence is never redistributed; supported zero is different from absent.
for (const value of [0,20,40,60,80,100]) {
 const c=structuredClone(candidate);for(const d of ['human','ecosystem']) {c.components[d].estimate=value;c.components[d].uncertainty={lower:value,upper:value,label:'Test exact'};}
 c.review=reviewed(assessmentDefinition(c));
 assert.equal(evaluate(c).value,Math.round((1+9*value/100)*10)/10);
}
const unreviewedChange=structuredClone(candidate);unreviewedChange.components.human.estimate=25;
assert(evaluate(unreviewedChange).reasons.includes('assessment_review_pending'));
// Separate scenario assessments cannot overwrite or enter the reference ranking.
for (const scenario of policy.alternativeScenarios) {
 const separatePolicy=structuredClone(p);separatePolicy.scenario=scenario;separatePolicy.calibrationReview=reviewed(policyDefinition(separatePolicy));
 const separate=structuredClone(candidate);separate.scenario=scenario;
 for(const c of Object.values(separate.components)) c.context.scenario=scenario;
 separate.review=reviewed(assessmentDefinition(separate));
 assert.equal(evaluate(separate,separatePolicy).value,5.5);
 assert.equal(evaluate(separate,p).value,null);
 assert(evaluate(separate,separatePolicy).explanation.includes(scenario));
}
// A synthetic people-heavy and nature-heavy pair changes order with the weights.
const reversed=structuredClone(candidate);
for(const d of ['human','ecosystem']) { const c=reversed.components[d];c.estimate=d==='human'?80:20;c.uncertainty={lower:c.estimate-10,upper:c.estimate+10,label:'Test bounds'};}
reversed.review=reviewed(assessmentDefinition(reversed));
const cases=scoreSensitivity(good).weightCases, other=scoreSensitivity(evaluate(reversed)).weightCases;
assert(cases[0].value>other[0].value);assert.equal(cases[1].value,other[1].value);assert(cases[2].value<other[2].value);
assert.deepEqual(evaluate(),good,'Unrelated catalogue changes cannot affect pure assessment');
assert.equal(evaluateHarmScore({...node,node_kind:'response'},candidate,p,'test-digest').value,null);
assert.equal(normalizeHarm(0,[[0,0],[10,1]]),0);
assert.equal(normalizeHarm(5,[[0,0],[10,1]]),.5);
assert.equal(normalizeHarm(-1,[[0,0],[10,1]]),null);
assert.equal(normalizeHarm(5,[[0,0],[0,1]]),null);
assert.equal(historicalRank({value:4,reference:Array(30).fill(4),direction:'higher'}).percentile,50);
console.log('TULIP assessments passed: 354 labelled internal current-impact estimates, 27 response exclusions, shared web/iOS parity and source binding; synthetic strict-scoring controls tested separately.');
