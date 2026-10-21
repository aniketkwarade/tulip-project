import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const artifact = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/internal-europe-heat-openmeteo-era5land-crosscheck.json', import.meta.url),
  'utf8',
));
const absolute = artifact.results.absoluteTemperatures;
const anomalies = artifact.results.heldOutWeeklyAnomalies;
const criteria = artifact.method.predeclaredCriteria;

assert.equal(artifact.productionRatingsEnabled, 0);
assert.equal(artifact.source.spatialGrid, '0.1 degree, 1,801 by 3,600');
assert.equal(artifact.source.temporalResolution, 'hourly');
assert.equal(artifact.source.objects.length, 13);
assert.equal(new Set(artifact.source.objects.map(row => row.url)).size, 13);
assert(artifact.source.objects.every(row => row.contentLength > 0 && row.etag && row.lastModified));
assert.match(artifact.source.objectIdentityDigest, /^[a-f0-9]{64}$/);
assert.match(artifact.source.provenanceBoundary, /mirror.*not a second climate model/i);

assert.deepEqual(artifact.method.validationYears, [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022]);
assert.deepEqual(artifact.method.weeks, [22, 35]);
assert.deepEqual([...artifact.method.spatialMethods].sort(), [
  'area_intersection',
  'cell_centre_coslat',
  'cell_centre_unweighted',
]);
assert.deepEqual(artifact.method.timeZoneSensitivities, ['UTC+00:00', 'UTC+01:00']);
assert.equal(artifact.rawChecks.length, 13);
assert.equal(artifact.rawChecks.filter(row => row.key.startsWith('year_')).length, 7);
assert.equal(artifact.rawChecks.filter(row => row.key.startsWith('chunk_')).length, 6);
for (const year of artifact.method.validationYears) {
  assert.equal(
    artifact.rawChecks.filter(row => row.year === year).reduce((sum, row) => sum + row.readHours, 0),
    2544,
  );
}
assert(artifact.rawChecks.every(row => row.finiteInputFraction > 0 && row.finiteInputFraction <= 1));
assert(artifact.rawChecks.every(row => Object.values(row.missingRegionalHourlyValues).every(value => value === 0)));

assert.equal(absolute.expectedRows, 11_536);
assert.equal(absolute.matchedRows, 11_536);
assert.equal(absolute.matchedFraction, 1);
assert.equal(absolute.matchedRegions, 103);
assert.equal(anomalies.matchedRegions, 103);
assert.deepEqual(anomalies.trainingYears, [2015, 2016, 2017, 2018]);
assert.deepEqual(anomalies.validationYears, [2019, 2020, 2021, 2022]);
assert.equal(Object.keys(artifact.results.methodSensitivities).length, 6);

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
assert.equal(artifact.status, independentlyPasses
  ? 'public_sample_temperature_pattern_validated_full_endpoint_still_pending'
  : 'mirror_not_admitted_agreement_insufficient');
assert.equal(artifact.decision.prohibitedUses.length, 4);
assert.match(artifact.decision.nextGate, /823.*uncertainty.*independently/i);
assert.match(artifact.digest, /^[a-f0-9]{64}$/);

console.log(`Open 0.1-degree ERA5-Land mirror cross-check passed: ${independentlyPasses ? 'Italian sample validated' : 'failed tolerances retained'}, with no production rating enabled.`);
