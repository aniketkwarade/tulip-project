import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const artifact = JSON.parse(await readFile(new URL(
  '../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-pooled-model-reproduction.json',
  import.meta.url,
), 'utf8'));

assert.equal(artifact.version, 'tulip_europe_temperature_mortality_pooled_model_reproduction_2026_09_25_v3');
assert.equal(artifact.status, 'central_pooled_model_internally_reproduced_not_independently_validated');
assert.equal(artifact.productionRatingsEnabled, 0);
assert.equal(artifact.model.panel.inputRows, 679_602);
assert.equal(artifact.model.panel.modelRows, 676_689);
assert.equal(artifact.model.panel.rowsDroppedForLags, 2_913);
assert.equal(artifact.model.panel.regions, 971);
assert.equal(artifact.model.panel.duplicateRegionYearWeekRows, 0);
assert.equal(artifact.model.fit.rank, 24);
assert.equal(artifact.model.fit.columns, 24);
assert.equal(artifact.model.fit.coefficientNames.length, 24);
assert.equal(artifact.model.fit.coefficients.length, 24);
assert.equal(artifact.model.fit.cumulativeTemperatureCoefficients.length, 4);
assert.equal(artifact.model.fit.minimumMortalityTemperatureOnIntegerMinus50To50Grid, 19);
assert.equal(artifact.model.bootstrap.seed, 12);
assert.equal(artifact.model.bootstrap.iterations, 100);
assert.equal(artifact.model.bootstrap.spatialUnitsPerIteration, 971);
assert.equal(artifact.model.bootstrap.minimumRank, 24);
assert.equal(artifact.model.bootstrap.maximumRank, 24);
assert.equal(artifact.model.bootstrap.coefficients.length, 100);
assert(artifact.model.bootstrap.coefficients.every(row => row.length === 24));
assert.equal(artifact.model.bootstrap.cumulativeTemperatureCoefficients.length, 100);
assert(artifact.model.bootstrap.cumulativeTemperatureCoefficients.every(row => row.length === 4));
assert.equal(artifact.model.crossRuntimeValidation.status, 'passed_python_numpy_vs_base_r');
assert.equal(artifact.model.crossRuntimeValidation.winsorThresholdRelativeDifference, 0);
assert(artifact.model.crossRuntimeValidation.maximumCoefficientRelativeDifference < 1e-12);
assert(artifact.model.crossRuntimeValidation.maximumCumulativeRelativeDifference < 1e-12);
assert(artifact.model.crossRuntimeValidation.maximumBootstrapCoefficientRelativeDifference < 1e-9);
assert(artifact.model.crossRuntimeValidation.maximumBootstrapCumulativeRelativeDifference < 1e-12);
assert(artifact.model.residualization.maximumRegionYearMean < 1e-9);
assert(artifact.model.residualization.maximumRegionWeekMean < 1e-9);
assert.equal(artifact.admissionDecision.axesAdmitted, 0);
assert.equal(artifact.admissionDecision.scoresChanged, 0);
assert.equal(artifact.model.boundaries.authorDependencyVersionsPinned, false);
assert.equal(artifact.model.boundaries.authorFixestCoefficientsCompared, false);
assert.match(artifact.admissionDecision.nextGate, /daily-temperature and person-day-bin mortality attribution/i);

console.log('European temperature–mortality pooled-model reproduction artifact passed.');
