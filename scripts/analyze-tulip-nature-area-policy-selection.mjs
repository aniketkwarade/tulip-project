import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const decision = read('../docs/tulip-calibration/nature-aggregation-selection.json');
const priorBytes = readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/nature-aggregation-policy-analysis.json', import.meta.url));
const prior = JSON.parse(priorBytes);
assert.equal(decision.selectedExperimentPolicyId, 'area_two_family_emphasis');
assert.equal(decision.publicReady, false);
const referenceArea = Object.values(prior.sourceExtentReferences).reduce((sum, item) => sum + item.mappedExtentKm2, 0);
const selectedPolicy = prior.policies[decision.selectedExperimentPolicyId];
const selectedResults = prior.cases.map(item => {
  const result = item.results[decision.selectedExperimentPolicyId];
  const lossEquivalentArea = Object.values(result.byFamily).reduce((sum, family) =>
    sum + family.collapseRelativeIndicatorLossAreaKm2, 0);
  const directAreaIndex = lossEquivalentArea / referenceArea;
  assert(Math.abs(result.index - directAreaIndex) < 1e-14);
  return { id: item.id, evidenceKind: 'invented_condition_and_attribution_case_real_mapped_extent_reference',
    type: item.type, affectedShare: item.extent, degradationFraction: item.severity,
    lossEquivalentAreaKm2: lossEquivalentArea, index: result.index,
    equalFamilyAlternativeIndex: item.results.equal_two_family_emphasis.index };
});

// Declare an amount of comparable loss before looking at either family label.
// It is not a source-observed ecological outcome.
const comparableLossKm2 = 1000;
const sameLossAcrossFamilies = Object.entries(prior.sourceExtentReferences).map(([id, reference]) => {
  const areaIndex = selectedPolicy.weights[id] * comparableLossKm2 / reference.mappedExtentKm2;
  const equalFamilyIndex = 0.5 * comparableLossKm2 / reference.mappedExtentKm2;
  assert(Math.abs(areaIndex - comparableLossKm2 / referenceArea) < 1e-15);
  return { type: id, comparableLossKm2, shareOfFamily: comparableLossKm2 / reference.mappedExtentKm2,
    areaIndex, equalFamilyIndex };
});
assert(Math.abs(sameLossAcrossFamilies[0].areaIndex - sameLossAcrossFamilies[1].areaIndex) < 1e-15);
assert(sameLossAcrossFamilies.find(item => item.type === 'mapped_mangrove').equalFamilyIndex
  > sameLossAcrossFamilies.find(item => item.type === 'mapped_coral_reef').equalFamilyIndex);
const equalFamilyPerAreaPremium = prior.sourceExtentReferences.mapped_coral_reef.mappedExtentKm2
  / prior.sourceExtentReferences.mapped_mangrove.mappedExtentKm2;

// A disjoint refinement inherits the same numerator and frozen denominator.
const refinement = { originalLossKm2: comparableLossKm2, childLossesKm2: [400, 600] };
assert.equal(refinement.childLossesKm2.reduce((sum, value) => sum + value, 0) / referenceArea,
  refinement.originalLossKm2 / referenceArea);
const report = {
  version: 'tulip_nature_area_policy_selection_analysis_2026_09_27_v1',
  status: 'provisional_policy_decision_not_nature_calibration',
  decisionVersion: decision.version, selectedPolicyId: decision.selectedExperimentPolicyId,
  selectedPolicyVersion: selectedPolicy.version,
  sourceAnalysisSha256: createHash('sha256').update(priorBytes).digest('hex'),
  sourceExtentReferences: prior.sourceExtentReferences,
  fixedCompatibleGroupAreaKm2: referenceArea,
  selectedResults, sameLossAcrossFamilies,
  equalFamilyPerAreaMangrovePremiumRelativeToReef: equalFamilyPerAreaPremium,
  refinement,
  adjudication: {
    sameComparableAmountAcrossFamilies: 'Equal under the selected area rule; unequal under equal-family weighting.',
    reefTenPercentVersusMangroveFifteenPercent: 'The synthetic reef case has more comparable condition-equivalent area and ranks higher under the selected rule. This does not establish the ecological equivalence of real coral-cover and mangrove-extent losses.',
    localIntensity: 'Retained in the explanation, not added as a hidden bonus to total burden.',
    irreplaceability: 'Not established by area. A separate explicit policy is needed if it changes the headline construct.',
  },
  natureScore: null, globalNatureCalibrationPassed: false, publicReady: false,
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/nature-area-policy-selection-analysis.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, selectedPolicy: report.selectedPolicyId,
  sameComparableLossGetsSameIndex: true, equalFamilyPerAreaPremium,
  globalNatureCalibrationPassed: false, natureScore: null }, null, 2));
