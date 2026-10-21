import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

// Construct test, not measurements of current forest or reef harm. The areas
// are source-based; the condition-loss fractions are deliberately hypothetical.
const reefSnapshot = JSON.parse(readFileSync(new URL('../artifacts/tulip-calibration-2026-09-22/coral-bleaching-reference-snapshot.json', import.meta.url)));
const reefAreaKm2 = reefSnapshot.endpoints.subregionConditionDistribution.mappedGlobalReefAreaM2 / 1e6;
const forestAreaKm2 = 4_140_000_000 * 0.01; // FAO 2025: 4.14 billion hectares; 1 ha = 0.01 km².
const cases = [
  { id: 'illustrative_reef_loss', realm: 'marine', areaKm2: reefAreaKm2, conditionLossFraction: 0.10 },
  { id: 'illustrative_forest_loss', realm: 'terrestrial', areaKm2: forestAreaKm2, conditionLossFraction: 0.01 },
].map(item => ({ ...item,
  conditionAdjustedAreaKm2: item.areaKm2 * item.conditionLossFraction,
  typeRelativeLoss: item.conditionLossFraction,
}));
const [reef, forest] = cases;
assert(reef.typeRelativeLoss > forest.typeRelativeLoss);
assert(reef.conditionAdjustedAreaKm2 < forest.conditionAdjustedAreaKm2);
const originalForestTypeSum = forest.typeRelativeLoss;
const splitForestTypeSum = forest.typeRelativeLoss + forest.typeRelativeLoss;
const splitForestAreaSum = (forest.areaKm2 / 2) * forest.conditionLossFraction
  + (forest.areaKm2 / 2) * forest.conditionLossFraction;
assert.equal(splitForestTypeSum / originalForestTypeSum, 2);
assert.equal(splitForestAreaSum, forest.conditionAdjustedAreaKm2);
const originalAverageAcrossListedTypes = (reef.typeRelativeLoss + forest.typeRelativeLoss) / 2;
const averageAfterAddingUnrelatedZeroType = (reef.typeRelativeLoss + forest.typeRelativeLoss) / 3;
assert(averageAfterAddingUnrelatedZeroType < originalAverageAcrossListedTypes);
const result = {
  version: 'tulip_nature_denominator_sensitivity_2026_09_27_v1',
  status: 'hypothetical_construct_falsification_not_nature_ratings',
  sourceAreas: {
    reef: { areaKm2: reefAreaKm2, source: reefSnapshot.sources.gcrmn2025.reportDoi,
      sourceSnapshotVersion: reefSnapshot.version },
    forest: { areaKm2: forestAreaKm2,
      source: 'https://www.fao.org/newsroom/detail/global-deforestation-slows--but-forests-remain-under-pressure--fao-report-shows/en',
      sourceStatement: 'FAO FRA 2025 estimates 4.14 billion hectares of global forest area.' },
  },
  cases,
  comparisons: {
    forestToReefConditionAdjustedAreaRatio: forest.conditionAdjustedAreaKm2 / reef.conditionAdjustedAreaKm2,
    reefToForestTypeRelativeLossRatio: reef.typeRelativeLoss / forest.typeRelativeLoss,
    unweightedTypeSumAfterHarmlessForestSplitMultiplier: splitForestTypeSum / originalForestTypeSum,
    areaWeightedBurdenAfterForestSplitKm2: splitForestAreaSum,
    originalAverageAcrossListedTypes,
    averageAfterAddingUnrelatedZeroType,
  },
  implications: [
    'Ranking the same hypothetical condition losses by physical area or by fraction of each ecosystem type reverses their order. The choice is a TULIP value rule, not a conversion established by the source areas.',
    'An unweighted sum of type-relative losses doubles when one forest type is split into two identical subtypes. A future-proof nature method must specify a fixed typology and inheritance or area-based weights that preserve the parent burden under partition.',
    'A mean divided by the number of currently listed types changes after adding an unrelated zero-loss type. Catalogue membership and evolving type counts cannot set the denominator of a node score.',
    'Neither case represents observed attributable harm. Comparable condition metrics, attribution, timebase, recovery and cross-realm value weights remain missing.',
  ],
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/nature-denominator-sensitivity.json', import.meta.url),
  `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ status: result.status, comparisons: result.comparisons }, null, 2));
