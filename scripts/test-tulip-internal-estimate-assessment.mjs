import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyIrreplaceabilityAdjustment, createInternalEstimateEvaluator, evaluateInternalEstimateAssessment } from '../src/tulip-internal-estimate-assessment.js';

const decision = JSON.parse(readFileSync(new URL('../src/tulip-estimate-policy-decision.json', import.meta.url)));
const source = { id: 'synthetic', label: 'Synthetic context only', url: 'https://example.org/test-only',
  supports: 'context', relevance: 'Invented control; never a real scientific observation.' };
const component = (unit, quantityEstimate) => ({ kind: 'internal_estimate', coverage: 'whole_domain_estimate',
  unit, quantityEstimate, geography: 'global', assessmentPeriod: '2026',
  outcomeDefinition: 'Invented typed outcome', estimationMethod: 'Invented assumption-based magnitude for arithmetic controls.',
  attribution: 'Invented with/without-node comparison.', overlapReview: 'Invented disjoint outcome accounting.',
  limitations: 'Synthetic fixture; no real node assessment.', evidenceReferences: [source],
  assumptions: [{ id: 'fixture-only', statement: 'Invented amount, not an observed source quantity.', kind: 'authored_assumption' }] });
const fixture = { nodeId: 'synthetic_estimate', name: 'Synthetic estimate', nodeKind: 'issue',
  policyVersion: decision.version, valueKind: 'internal_estimate', assessmentId: 'fixture_only', authoredOn: '2026-09-28',
  geography: 'global', assessmentPeriod: '2026', missingEvidence: 'All fixture inputs are invented for control testing.',
  components: { human: component('TULIP_human_loss_year', 1_000_000), ecosystem: component('TULIP_condition_equivalent_km2', 10_000) },
  irreplaceability: { status: 'not_assigned', reason: 'No priority adjustment in this synthetic control.' } };
assert.equal(decision.irreplaceability.capStatus, 'confirmed');
assert.equal(decision.irreplaceability.maximumNatureBonus, 1);
assert.equal(decision.irreplaceability.maximumOverallIncrease, 0.5);
assert.equal(evaluateInternalEstimateAssessment(fixture).status, 'internal_estimate');
assert.equal(evaluateInternalEstimateAssessment(fixture).value, 5);
const priority = structuredClone(fixture);
priority.irreplaceability = { status:'eligible', basis:'internal_judgment', irreversibleLossFractionEstimate:1,
  rareAssetDefinition:'Invented whole rare ecological asset',rarityBasis:'Invented rarity basis',
  irreversibilityBasis:'Invented irreversible loss',attribution:'Invented attributable loss',
  limitations:'Synthetic only',assumption:'Invented complete irreversible loss',evidenceReferences:[source] };
const good = evaluateInternalEstimateAssessment(priority);
assert.equal(good.value, 5.5);
assert.equal(good.valueKind, 'internal_estimate');
assert.equal(good.valueLabel, 'Internal estimate');
assert.equal(good.scientificCalibrationApproved, false);
assert.equal(good.measuredHarmClaim, false);
assert(good.accessibilityLabel.includes('Internal estimate'));
assert.deepEqual(good.components.human.assumptions, fixture.components.human.assumptions);
const partial = structuredClone(priority); partial.irreplaceability.irreversibleLossFractionEstimate=0.25;
assert.equal(evaluateInternalEstimateAssessment(partial).unrounded, 5.125);
assert.equal(evaluateInternalEstimateAssessment(partial).value, 5.1);
let rejectionCases = 0;
for (const mutate of [
  r=>delete r.components.ecosystem,
  r=>r.value=9.9,
  r=>r.previousValue=9.9,
  r=>r.valueKind='measured',
  r=>r.components.human.assumptions=[],
  r=>r.components.ecosystem.geography='one region',
  r=>r.components.human.quantityEstimate=0,
  r=>r.components.human.evidenceReferences=[],
  r=>r.components.human.evidenceReferences.push({...source,id:'alias-of-same-document'}),
  r=>r.irreplaceability.evidenceReferences.push({...source,id:'alias-of-same-document'}),
  r=>r.uncertainty={lower:4,upper:6,kind:'confidence_interval'},
  r=>r.irreplaceability.irreversibleLossFractionEstimate=2,
  r=>r.irreplaceability.irreversibleLossFractionEstimate=-0.1,
  r=>r.irreplaceability.irreversibleLossFractionEstimate=NaN,
  r=>r.irreplaceability.assumption='',
]) { const changed=structuredClone(priority);mutate(changed);assert.equal(evaluateInternalEstimateAssessment(changed).value,null);rejectionCases++; }
const zero = structuredClone(fixture);zero.components.human.quantityEstimate=0;
zero.components.human.estimatedAbsenceReason='Invented reason for an estimated absence, not a verified zero.';
assert.equal(evaluateInternalEstimateAssessment(zero).value,3);
const response = evaluateInternalEstimateAssessment({...priority,nodeKind:'response'});
assert.equal(response.value,null);assert.equal(response.label,'Response');assert.equal(response.valueKind,null);
assert.equal(evaluateInternalEstimateAssessment({...fixture,nodeId:'unrelated_synthetic_node'}).value,5);
const high = structuredClone(priority); high.components.ecosystem.quantityEstimate=510_000_000;
const clipped = evaluateInternalEstimateAssessment(high);
assert.equal(clipped.components.ecosystem.adjustedValue,10);
assert.equal(clipped.components.ecosystem.priorityBonus,0);
assert.equal(clipped.irreplaceability.overallIncreaseBeforeRounding,0);
assert.equal(clipped.value,7.5);
const nearCeiling = applyIrreplaceabilityAdjustment(9.8,1);
assert(Math.abs(nearCeiling.appliedBonus-0.2)<1e-12);
assert(Math.abs(nearCeiling.overallIncrease-0.1)<1e-12);
for (const args of [[9.8,2],[11,1],[0,1],[5,NaN],[5,1,2]]) assert.equal(applyIrreplaceabilityAdjustment(...args),null);
let propertyCases = 0;
for(let i=10;i<=100;i++) for(let j=0;j<=100;j++) {
  const base = i/10, fraction = j/100;
  const adjusted = applyIrreplaceabilityAdjustment(base,fraction);
  assert(adjusted.adjustedValue>=base && adjusted.adjustedValue<=10);
  assert(adjusted.overallIncrease>=0 && adjusted.overallIncrease<=0.5);
  if(j>0) assert(adjusted.adjustedValue>=applyIrreplaceabilityAdjustment(base,(j-1)/100).adjustedValue);
  propertyCases++;
}
const oversized = structuredClone(decision);oversized.irreplaceability.maximumNatureBonus=2;
assert.throws(()=>createInternalEstimateEvaluator({decision:oversized}),/confirmed_irreplaceability_cap_exceeded/);
const pending = structuredClone(decision);pending.irreplaceability.capStatus='user_question_pending';pending.irreplaceability.maximumNatureBonus=null;
assert.equal(createInternalEstimateEvaluator({decision:pending}).evaluate(priority).status,'priority_cap_choice_pending');
console.log(JSON.stringify({status:'internal_estimate_contract_controls_passed',capDecision:decision.irreplaceability.capStatus,
  maximumNatureBonus:1,maximumOverallIncrease:0.5,syntheticFullLossValue:good.value,syntheticQuarterLossValue:evaluateInternalEstimateAssessment(partial).value,
  rejectionCases,propertyCases,realReplacementRatings:0}));
