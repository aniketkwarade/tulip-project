import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const directory = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const data = JSON.parse(readFileSync(new URL('mhw-foundation-typed-reference-cases.json', directory)));
for (const source of Object.values(data.sources)) {
  const bytes = readFileSync(new URL(source.cachedName, directory));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256);
}
assert.equal(data.cases.length, 94);
assert.equal(data.cases.reduce((sum, row) => sum + row.observationCount, 0), 1322);
assert.equal(new Set(data.cases.map(row => row.caseId)).size, 94);
assert.deepEqual(data.summary.independentFigureCounts, { hard_corals: 1047, gorgonians: 76, seagrass: 60, macroalgae: 139 });
assert.equal(new Set(data.cases.map(row => row.endpointKind)).size, 5);
assert(data.cases.every(row => row.score === null && row.publicReady === false
  && row.attributableDamagedAreaKm2 === null && row.nodeAttributableFraction === null
  && row.currentAssessmentPeriod === null && row.grossPositiveLossMean === null));
const find = (region, group) => data.cases.find(row => row.ecoregion === region && row.sourceGroup === group);
const coral = find('Fiji Islands', 'Hard Corals');
assert.equal(coral.indicatorRole, 'stress_response_prevalence');
assert.equal(coral.meanInhibitionPrevalenceMagnitudePercent, 18.3);
assert.equal(coral.signedRelativeAbundanceChangePercent, null);
assert.equal(coral.postEventResponseWindow, 'within_16_weeks_after_mhw');
const coded = data.cases.filter(row => row.positiveCoralSourceEncodingFlag);
assert.equal(coded.length, 3);
assert(coded.every(row => row.categoryCodingFlag && row.directionEncoding === 'inhibition_only'
  && row.signedRelativeAbundanceChangePercent === null));
assert.equal(data.summary.categoryCodedObservationCount, 191);
const norway = find('Southern Norway', 'Macroalgae (change in cover)');
assert.equal(norway.signedRelativeAbundanceChangePercent, 6.5);
assert.equal(norway.observationsWithAtLeast10PercentLoss, 2);
assert.equal(norway.observationCount, 9);
assert.equal(norway.grossPositiveLossMean, null);
const tweed = find('Tweed - Moreton', 'Seagrass (change in cover)');
assert.equal(tweed.signedRelativeAbundanceChangePercent, -28.6);
assert.equal(tweed.observationsWithAtLeast10PercentLoss, 13);
assert.equal(tweed.observationCount, 20);
assert.equal(tweed.sourceResponseCategoryCounts.mildLossOrGain, 4);
assert.equal(tweed.reportedAcrossObservationSd, 46.7);
assert(tweed.reportedAcrossObservationRange.includes('>100% gain'));
assert.equal(tweed.postEventResponseWindow, '6_to_12_months_after_mhw');
assert.equal(tweed.sourceDatasetPeriodEnvelope.end, 2022);
for (const row of data.cases.filter(row => row.sourceResponseCategoryCounts !== null)) {
  assert.equal(Object.values(row.sourceResponseCategoryCounts).reduce((sum, n) => sum + n, 0), row.observationCount);
}
const continuationRows = data.cases.filter(row => row.sourceGroupFragments.length === 2);
assert.equal(continuationRows.length, 2);
assert(continuationRows.every(row => row.endpointKind === 'macroalgal_density_relative_change'));
assert.equal(continuationRows.reduce((sum, row) => sum + row.observationCount, 0), 12);
assert.equal(data.currentNodeAssessmentsCompleted, 0);
assert.equal(data.publicReady, false);
console.log(JSON.stringify({ status: 'passed', sourceHashesChecked: 2, typedRegionalCases: 94,
  sourceObservationsReconciled: 1322, sourceMetricsKeptSeparate: 5,
  signedGainNotZeroGrossHarm: true, categoryCodingAndWrappedLabelsPreserved: true,
  scoreAssigned: false }, null, 2));
