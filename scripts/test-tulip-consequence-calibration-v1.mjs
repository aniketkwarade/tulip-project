import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createConsequenceCalibrationExperiment, describeConsequenceCalibrationPolicy,
  CONSEQUENCE_CALIBRATION_VERSION, CONSEQUENCE_CALIBRATION_POLICY_KEY } from '../src/tulip-consequence-calibration-v1.js';
import { mapFixedBenchmarkMagnitude } from '../src/tulip-fixed-benchmark-map.js';
import { fixedBenchmarkPolicyKey } from '../src/tulip-benchmark-score-experiment.js';
import { consequenceCalibrationFixture } from './lib/tulip-consequence-calibration-fixtures.mjs';

const policy = describeConsequenceCalibrationPolicy();
const run = options => {
  const fixture = consequenceCalibrationFixture(options);
  const calculator = createConsequenceCalibrationExperiment(fixture.registry);
  const packet = fixture.makePacket(calculator);
  return {fixture,calculator,packet,result:calculator.calculate(packet)};
};
const initial = run({});
assert.equal(initial.result.status,'experimental_complete_policy_calculation');
assert.equal(initial.result.components.human.quantities.central,1050000);
assert(Math.abs(initial.result.components.ecosystem.quantities.central-10000)<1e-8);
assert.equal(initial.result.experimentalValue,5);
assert.equal(initial.result.value,null);
assert.equal(initial.result.publicReady,false);
assert.equal(initial.result.range,null,'no interval is manufactured for point-only cases');

const anchorCases = [];
for (const h of policy.human.points) for (const n of policy.ecosystem.points) {
  // A zero nature control still has an assessed positive area and complete
  // unchanged feature observations, rather than an empty array of unknowns.
  const x = run({health:h.burden,functioning:0,overlap:0,areas:[Math.max(1,n.burden)],losses:[n.burden === 0 ? 0 : 1]});
  assert.equal(x.result.status,'experimental_complete_policy_calculation',JSON.stringify(x.result.reasons));
  assert(Math.abs(x.result.unrounded-(h.score+n.score)/2)<1e-10);
  anchorCases.push({kind:'synthetic_anchor_control',human:h.score,ecosystem:n.score,
    humanQuantity:h.burden,ecosystemQuantity:n.burden,result:x.result});
}
const repeated = run({areas:[20000,30000],losses:[0.2,0.2]});
assert(Math.abs(repeated.result.unrounded-initial.result.unrounded)<1e-10,'disjoint spatial split preserves magnitude');
const future = initial.calculator.calculate({...initial.packet,nodeId:'synthetic_future_case'});
assert.equal(future.unrounded,initial.result.unrounded);
const extendedRegistry = structuredClone(initial.fixture.registry);
extendedRegistry.observations.unrelated = {...extendedRegistry.observations.health,nodeIds:['unrelated'],id:'unrelated'};
const extended = createConsequenceCalibrationExperiment(extendedRegistry);
assert.equal(extended.calculate(initial.packet).unrounded,initial.result.unrounded);
initial.fixture.registry.observations.health.cases.central = 1;
assert.equal(initial.calculator.calculate(initial.packet).unrounded,initial.result.unrounded,'registry was snapshotted');

const rejected = [];
const refuse = (name,changeFixture,changePacket,expected) => {
  const fixture = consequenceCalibrationFixture({});
  changeFixture?.(fixture.registry);
  const calculator = createConsequenceCalibrationExperiment(fixture.registry);
  const packet = fixture.makePacket(calculator);
  changePacket?.(packet,calculator);
  const r = calculator.calculate(packet);
  assert.equal(r.experimentalValue,null,name);
  assert(r.reasons.some(x=>x.includes(expected)),`${name}: ${r.reasons}`);
  rejected.push({name,reasons:r.reasons});
};
refuse('missing nature',null,p=>delete p.ecosystem,'complete_ecological');
refuse('missing residual human function',null,p=>p.human.function=[],'complete_human');
refuse('unregistered wellbeing conversion',r=>delete r.profiles.synthetic_function_profile,null,'function_conversion');
refuse('changed wellbeing definition',r=>r.profiles.synthetic_function_profile.functionDefinition='different outcome',null,'function_conversion');
refuse('unknown overlap',null,p=>delete p.human.overlap,'complete_human');
refuse('invented final value',null,p=>p.value=9,'packet_override');
refuse('exposure passed as outcome',r=>r.observations.health.quantityRole='exposure',null,'not_consequence');
refuse('death count mislabeled DALYs',r=>r.observations.health.unit='deaths',null,'annual_health');
refuse('unmatched geography',r=>r.observations.health.geography='elsewhere',null,'geography_scope');
refuse('changed source binding',null,p=>p.human.health[0].artifactSha256='f'.repeat(64),'binding_changed');
refuse('counterfactual relabel',r=>r.observations.health.counterfactualVersion='v2',null,'counterfactual_binding');
refuse('changed counterfactual meaning with unchanged version and digest',r=>{
  r.counterfactuals.synthetic_without_node.definition='A different invented baseline without a method update';
},null,'counterfactual_binding');
refuse('duplicate health row',null,p=>p.human.health.push(p.human.health[0]),'duplicate_human');
refuse('identical evidence renamed under a new ID',r=>{
  r.observations.health_alias={...structuredClone(r.observations.health),id:'health_alias'};
  r.counterfactuals.synthetic_without_node.observationIds.push('health_alias');
  for (const row of Object.values(r.observations)) row.counterfactualDefinitionKey=fixedBenchmarkPolicyKey(r.counterfactuals.synthetic_without_node);
},(p,c)=>p.human.health.push(c.reference('health_alias')),'duplicate_human_source');
refuse('oversized overlap',r=>r.observations.overlap.cases.central=100001,null,'overlap_amount');
refuse('unverified zero',r=>{r.observations.functioning.cases.central=0;delete r.observations.functioning.zeroMeaning;},null,'verified_human_zero');
refuse('stock times history',r=>r.observations.nature_0.durationYears=50,null,'current_condition');
refuse('missing ecological characteristic',r=>{delete r.observations.nature_0.cases.central.function;},null,'characteristic_observations');
refuse('profile changes without matching identity',r=>r.profiles.synthetic_ecological_profile.classes.function[0].intact=2,null,'ecological_profile');
refuse('condition outside source references',r=>r.observations.nature_0.cases.central.function.withNode=-0.1,null,'out_of_reference');
refuse('hazard treated as terminal condition',r=>{
  const p=r.profiles.synthetic_ecological_profile;p.classes.physical[0].role='climate_anomaly';
  r.observations.nature_0.profileKey=fixedBenchmarkPolicyKey(p);
},null,'feature_definition');
refuse('double-counted feature across classes',r=>{
  const p=r.profiles.synthetic_ecological_profile;p.classes.function[0].overlapGroup='structure';
  r.observations.nature_0.profileKey=fixedBenchmarkPolicyKey(p);
},null,'feature_definition');
refuse('malformed ecological feature',r=>{
  const p=r.profiles.synthetic_ecological_profile;p.classes.function[0]=null;
  r.observations.nature_0.profileKey=fixedBenchmarkPolicyKey(p);
},null,'feature_definition');
refuse('overlapping area allocation exceeds one',r=>{
  r.partitions.synthetic_partition.allocations.allocation_0.share=1.1;
},null,'allocation_area_or_share');
refuse('zero spatial allocation cannot stand for a supported zero outcome',r=>{
  r.partitions.synthetic_partition.allocations.allocation_0.share=0;
},null,'allocation_area_or_share');
refuse('partial bounds',r=>r.observations.health.cases.lower=900000,null,'partial_bounds');
refuse('marginal scenarios masquerading as joint',r=>r.observations.functioning.caseSetId='different',null,'joint_case_set');
refuse('negative displacement person time',r=>{
  Object.assign(r.observations.functioning,{kind:'displacement_person_days',unit:'person_day',
    profileId:'idmc_disaster_displacement_proxy_0042',populationBasis:'unique_person_time_no_repeat_spell_overlap',
    personTimeReviewId:'synthetic',cases:{central:-1}});
},null,'function_conversion');
refuse('missing displacement person time',r=>{
  Object.assign(r.observations.functioning,{kind:'displacement_person_days',unit:'person_day',
    profileId:'idmc_disaster_displacement_proxy_0042',populationBasis:'unique_person_time_no_repeat_spell_overlap',
    personTimeReviewId:'synthetic',zeroMeaning:'reviewed_zero_for_declared_outcome',cases:{central:null}});
},null,'function_conversion');

const percent = consequenceCalibrationFixture({});
for (const pair of Object.values(percent.registry.observations.nature_0.cases.central)) {
  pair.unit='percent';pair.withNode*=100;pair.withoutNode*=100;
}
const percentCalc=createConsequenceCalibrationExperiment(percent.registry);
assert(Math.abs(percentCalc.calculate(percent.makePacket(percentCalc)).unrounded-initial.result.unrounded)<1e-10);

const displaced=run({health:0,functioning:0,overlap:0,displacementPersonDays:36500000});
assert.equal(displaced.result.components.human.quantities.central,4200);
const movement=consequenceCalibrationFixture({health:0,functioning:0,overlap:0,displacementPersonDays:36500000});
movement.registry.observations.functioning.populationBasis='movement_count';
const movementCalc=createConsequenceCalibrationExperiment(movement.registry);
assert(movementCalc.calculate(movement.makePacket(movementCalc)).reasons.some(x=>x.includes('function_conversion')));
rejected.push({name:'movements are not unique affected person-time',reasons:['source_specific_function_conversion_required']});

const shared=consequenceCalibrationFixture({areas:[50000,50000],losses:[0.2,0.2]});
shared.registry.partitions.synthetic_partition.allocations.allocation_0.share=0.4;
Object.assign(shared.registry.partitions.synthetic_partition.allocations.allocation_1,{footprintId:'footprint_0',share:0.6});
const sharedCalc=createConsequenceCalibrationExperiment(shared.registry);
assert(Math.abs(sharedCalc.calculate(shared.makePacket(sharedCalc)).unrounded-initial.result.unrounded)<1e-10,
  'shared footprints must use allocated shares, not duplicate full area');
const sharedExcess=structuredClone(shared.registry);
sharedExcess.partitions.synthetic_partition.allocations.allocation_1.share=0.7;
const sharedExcessCalc=createConsequenceCalibrationExperiment(sharedExcess);
const sharedExcessPacket=shared.makePacket(sharedExcessCalc);
sharedExcessPacket.ecosystem.partitionKey=fixedBenchmarkPolicyKey(sharedExcess.partitions.synthetic_partition);
const sharedExcessResult=sharedExcessCalc.calculate(sharedExcessPacket);
assert(sharedExcessResult.reasons.some(x=>x.includes('overlapping_allocation_exceeds_one')));
rejected.push({name:'two valid individual shares jointly exceed one',reasons:sharedExcessResult.reasons});

const gain=consequenceCalibrationFixture({});
gain.registry.observations.nature_0.cases.central.structure.withoutNode=0.9;
gain.registry.observations.nature_0.cases.central.structure.withNode=1;
const gainCalc=createConsequenceCalibrationExperiment(gain.registry);
const gainResult=gainCalc.calculate(gain.makePacket(gainCalc));
assert(Math.abs(gainResult.components.ecosystem.quantities.central-50000/6)<1e-8,
  'an improvement in one characteristic does not cancel losses in five others');
assert(gainResult.components.ecosystem.vectors[0].signedFeatureChanges.structure<0);

const bounded=consequenceCalibrationFixture({});
for (const row of Object.values(bounded.registry.observations)) {
  row.caseSetId='synthetic_matched_joint_cases';
  if (row.kind==='ecosystem_condition_cohort') {
    row.cases.lower=structuredClone(row.cases.central);row.cases.upper=structuredClone(row.cases.central);
    for (const pair of Object.values(row.cases.lower)) pair.withNode=0.85;
    for (const pair of Object.values(row.cases.upper)) pair.withNode=0.75;
  } else {row.cases.lower=row.cases.central*0.9;row.cases.upper=row.cases.central*1.1;}
}
const boundedCalc=createConsequenceCalibrationExperiment(bounded.registry);
const boundedResult=boundedCalc.calculate(bounded.makePacket(boundedCalc));
assert.equal(boundedResult.status,'experimental_complete_policy_calculation');
assert.equal(boundedResult.range.kind,'matched_source_case_envelope_not_probability_interval');
assert(boundedResult.range.lower<boundedResult.unrounded&&boundedResult.unrounded<boundedResult.range.upper);
bounded.registry.observations.nature_0.caseSetId='synthetic_separate_marginal_cases';
const marginalCalc=createConsequenceCalibrationExperiment(bounded.registry);
assert.equal(marginalCalc.calculate(bounded.makePacket(marginalCalc)).range,null,
  'separate domain envelopes must not manufacture a joint interval');
const unknown=createConsequenceCalibrationExperiment().calculate(initial.packet);
assert.equal(unknown.experimentalValue,null,'an empty real registry does not inherit synthetic results');

const response=initial.calculator.calculate({nodeId:'synthetic_response',nodeKind:'response',
  policyVersion:CONSEQUENCE_CALIBRATION_VERSION,policyKey:CONSEQUENCE_CALIBRATION_POLICY_KEY});
assert.equal(response.status,'outside_danger_scoring');assert.equal(response.experimentalValue,null);

const sensitivityCases = [
  {name:'health-heavy',health:1000000,functionYears:100000,natureKm2:10000},
  {name:'function-heavy',health:100000,functionYears:1000000,natureKm2:10000},
  {name:'nature-heavy',health:100000,functionYears:0,natureKm2:1000000},
].map(item=>({...item,kind:'synthetic_policy_sensitivity_not_observed_node',
  bridgeReadings:[0.5,1,2].map(factor=>({functionBridgeFactor:factor,
    unrounded:0.5*mapFixedBenchmarkMagnitude(item.health+factor*item.functionYears,policy.human.points)
      +0.5*mapFixedBenchmarkMagnitude(item.natureKm2,policy.ecosystem.points)}))}));
const oneClass = 100000/6;
const naturePolicyChallenges = [
  {name:'1000 km2 full profile loss',areaKm2:1000,losses:[1,1,1,1,1,1]},
  {name:'100000 km2 one characteristic fully lost',areaKm2:100000,losses:[0,0,0,1,0,0]},
  {name:'100000 km2 all characteristics 50 percent lost',areaKm2:100000,losses:[0.5,0.5,0.5,0.5,0.5,0.5]},
  {name:'1 km2 irreversible full profile loss',areaKm2:1,losses:[1,1,1,1,1,1]},
].map(item=>{
  const q=item.areaKm2*item.losses.reduce((sum,x)=>sum+x,0)/6;
  return {...item,kind:'synthetic_ecological_tradeoff_not_observed_loss',quantity:q,
    component:mapFixedBenchmarkMagnitude(q,policy.ecosystem.points),
    reweightEachClassTwice:item.losses.map((_,index)=>{
      const changed=item.areaKm2*item.losses.reduce((sum,x,i)=>sum+x*(i===index?2:1),0)/7;
      return {classIndex:index,quantity:changed,component:mapFixedBenchmarkMagnitude(changed,policy.ecosystem.points)};
    })};
});
assert(oneClass<50000);
const directory=new URL('../artifacts/tulip-consequence-calibration-v1-2026-09-28/',import.meta.url);
mkdirSync(directory,{recursive:true});
const paths=['src/tulip-consequence-policy-v1.json','src/tulip-consequence-calibration-v1.js'];
const report={version:'tulip_consequence_calibration_candidate_check_2026_09_28_v1',
  policyVersion:policy.version,policyKey:CONSEQUENCE_CALIBRATION_POLICY_KEY,
  status:'experimental_policy_calculations_pass_real_node_calibration_incomplete',
  inputs:Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(readFileSync(new URL(`../${p}`,import.meta.url))).digest('hex')])),
  summary:{anchorControls:anchorCases.length,rejections:rejected.length,completeRealNodeRatings:0},
  anchorCases,rejected,sensitivityCases,naturePolicyChallenges,
  jointSourceCaseControl:{kind:'synthetic_joint_case_control',result:boundedResult},
  limitation:'All complete composite controls are synthetic. They expose trade-offs and verify arithmetic, not biological equivalences, wellbeing/health equivalence, causal evidence, source review or public numerical admission.',
  publicReady:false};
writeFileSync(new URL('candidate-check.json',directory),`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify({status:report.status,...report.summary},null,2));
