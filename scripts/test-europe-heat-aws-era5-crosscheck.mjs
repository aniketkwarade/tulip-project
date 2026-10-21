import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const artifact = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/internal-europe-heat-aws-era5-crosscheck.json', import.meta.url), 'utf8'));
const absolute = artifact.results.absoluteTemperatures;
const anomalies = artifact.results.heldOutWeeklyAnomalies;

assert.equal(artifact.productionRatingsEnabled, 0);
assert.equal(artifact.source.icechunkSnapshotId, 'ZFKDHBCTBVHVXM3BQFV0');
assert.equal(artifact.source.spatialGrid, '0.25 degree, 721 by 1440');
assert.equal(artifact.source.chunking.valid_time, 8736);
assert.equal(artifact.source.chunking.latitude, 12);
assert.equal(artifact.source.chunking.longitude, 12);
assert.equal(artifact.rawChecks.length, 8);
assert(artifact.rawChecks.every(row => row.timeSteps === 2544 && row.finiteFraction === 1));
assert.equal(absolute.expectedRows, 11_536);
assert.equal(absolute.matchedRows, 11_536);
assert.equal(absolute.matchedFraction, 1);
assert.equal(absolute.matchedRegions, 103);
assert.equal(anomalies.matchedRegions, 103);
assert.deepEqual(anomalies.trainingYears, [2015, 2016, 2017, 2018]);
assert.deepEqual(anomalies.validationYears, [2019, 2020, 2021, 2022]);
assert.equal(artifact.status, 'fallback_not_admitted_agreement_insufficient');
assert.equal(absolute.overallBiasC, 0.3233952);
assert.equal(absolute.medianAbsoluteErrorC, 0.3924939);
assert.equal(absolute.p95AbsoluteErrorC, 1.0195355);
assert.equal(absolute.pearsonCorrelation, 0.9939376);
assert.equal(anomalies.overallBiasC, -0.064055);
assert.equal(anomalies.medianAbsoluteErrorC, 0.2276551);
assert.equal(anomalies.p95AbsoluteErrorC, 0.6760101);
assert.equal(anomalies.pearsonCorrelation, 0.9889738);
assert.equal(artifact.results.improvementVersusCoarseOpenFallback.absoluteMedianErrorReductionC, 0.4963617);
assert.equal(artifact.results.improvementVersusCoarseOpenFallback.absoluteP95ErrorReductionC, 2.4380279);
assert.equal(artifact.results.improvementVersusCoarseOpenFallback.anomalyMedianErrorReductionC, 0.1401257);
assert.equal(artifact.results.improvementVersusCoarseOpenFallback.anomalyP95ErrorReductionC, 0.5398247);
assert.deepEqual(Object.keys(artifact.results.methodSensitivities).sort(), [
  'area_intersection_utcplus0000',
  'area_intersection_utcplus0100',
  'land_fraction_area_utcplus0000',
  'land_fraction_area_utcplus0100',
]);
assert(Object.values(artifact.results.methodSensitivities)
  .every(result => result.passesPredeclaredAbsoluteReconstructionCriteria === false));
assert.equal(artifact.results.methodSensitivities.land_fraction_area_utcplus0000.absoluteTemperatures.medianAbsoluteErrorC, 0.3596528);
assert.equal(artifact.results.methodSensitivities.area_intersection_utcplus0100.heldOutWeeklyAnomalies.medianAbsoluteErrorC, 0.2301512);
assert.match(artifact.method.diagnosticSensitivityBoundary, /cannot qualify.*admission/i);
assert.equal(artifact.decision.prohibitedUses.length, 4);
assert.match(artifact.decision.nextGate, /823.*uncertainty.*independently/i);

const criteria = artifact.method.predeclaredCriteria;
const independentlyPasses = absolute.matchedRegions >= criteria.minimumMatchedRegions
  && absolute.matchedFraction >= criteria.minimumMatchedRegionWeeksFraction
  && Math.abs(absolute.overallBiasC) <= criteria.maximumAbsoluteOverallBiasC
  && absolute.medianAbsoluteErrorC <= criteria.maximumMedianAbsoluteErrorC
  && absolute.p95AbsoluteErrorC <= criteria.maximumP95AbsoluteErrorC
  && absolute.pearsonCorrelation >= criteria.minimumPearsonCorrelation;
assert.equal(artifact.results.passesPredeclaredAbsoluteReconstructionCriteria, independentlyPasses);
assert.equal(artifact.decision.admissionStatus, independentlyPasses
  ? 'accepted_for_public_sample_temperature_pattern_validation_only'
  : 'rejected_for_source_removal_endpoint_attribution');
// The Python producer canonicalizes nested keys; verify stability by requiring the recorded digest shape here.
assert.match(artifact.digest, /^[a-f0-9]{64}$/);

console.log(`Open 0.25-degree ERA5 cross-check passed: ${independentlyPasses ? 'public Italian sample validated' : 'failed tolerances retained'}, with no production rating enabled.`);
