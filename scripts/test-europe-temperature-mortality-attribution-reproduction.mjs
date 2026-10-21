import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const readJson = async name => JSON.parse(await readFile(path.join(artifactDir, name), 'utf8'));
const [artifact, bridge, pooled] = await Promise.all([
  readJson('europe-temperature-mortality-attribution-reproduction.json'),
  readJson('europe-temperature-mortality-bridge-reference-snapshot.json'),
  readJson('europe-temperature-mortality-pooled-model-reproduction.json'),
]);

const close = (actual, expected, relativeTolerance = 1e-11) => {
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  assert(Math.abs(actual - expected) / scale <= relativeTolerance, `${actual} != ${expected}`);
};
const type7 = (values, probability) => {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return fraction ? sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]) : sorted[lower];
};
const summarize = values => ({
  q025: type7(values, 0.025),
  median: type7(values, 0.5),
  q975: type7(values, 0.975),
  mean: values.reduce((sum, value) => sum + value, 0) / values.length,
});
const responseAt = (temperature, centeredAt, coefficients) => coefficients.reduce((sum, coefficient, index) => (
  sum + (temperature ** (index + 1) - centeredAt ** (index + 1)) * coefficient
), 0);

assert.equal(artifact.version, 'tulip_europe_temperature_mortality_attribution_reproduction_2026_09_25_v1');
assert.equal(artifact.status, 'pooled_factual_temperature_mortality_attribution_internally_reproduced_not_independently_validated');
assert.equal(artifact.productionRatingsEnabled, 0);
assert.equal(artifact.inputs.bridgeVersion, bridge.version);
assert.equal(artifact.inputs.pooledModelVersion, pooled.version);
assert.equal(artifact.inputs.parquet.fullPanel.sha256, bridge.parquet.fullPanel.completeFile.sha256);
assert.equal(artifact.inputs.parquet.dailyTemperature.sha256, bridge.parquet.dailyTemperature.completeFile.sha256);
assert.equal(artifact.inputs.parquet.temperatureBins.sha256, bridge.parquet.temperatureBins.completeFile.sha256);

const { digest, ...withoutDigest } = artifact;
assert.equal(digest, createHash('sha256').update(JSON.stringify(withoutDigest)).digest('hex'));
assert.equal(artifact.observedTemperature.rows, 12_660_307);
close(artifact.observedTemperature.q01C, -7.461097821012151);
close(artifact.observedTemperature.q998C, 29.215688577671102);
assert.deepEqual(artifact.observedTemperature.eligibleIntegerBinsC, [-7, 29]);
assert.equal(artifact.observedTemperature.minimumMortalityTemperatureC, 19);

assert.equal(artifact.coverage.responsePanelRows, 679_602);
assert.equal(artifact.coverage.responsePanelRegions, 971);
assert.equal(artifact.coverage.matchedDailyTemperatureRows, 4_454_230);
assert.equal(artifact.coverage.matchedTemperatureBinRows, 637_399);
assert.equal(artifact.coverage.matchedTemperatureBinDays, 4_454_230);
assert.equal(artifact.coverage.matchedDailyMinusBinnedDayCount, 0);
assert.equal(artifact.coverage.responsePanelWeeksWithDailyTemperature, artifact.coverage.matchedTemperatureBinRows);
assert.equal(artifact.coverage.maximumDailyRowsPerResponsePanelWeek, 9);
assert.equal(
  Object.entries(artifact.coverage.dailyRowsPerResponsePanelWeekHistogram)
    .reduce((sum, [days, weeks]) => sum + Number(days) * weeks, 0),
  artifact.coverage.matchedDailyTemperatureRows,
);
assert.equal(
  Object.values(artifact.coverage.dailyRowsPerResponsePanelWeekHistogram).reduce((sum, value) => sum + value, 0),
  artifact.coverage.responsePanelRows,
);
assert.equal(artifact.validation.dailyDateOrderViolations, 0);
assert.equal(artifact.validation.duplicateDailyDateRows, 0);
assert(Math.max(...artifact.validation.maximumTemperaturePolynomialAbsoluteDifference) < 1e-8);

const bootstrap = pooled.model.bootstrap.cumulativeTemperatureCoefficients;
assert.equal(bootstrap.length, 100);
for (const row of artifact.responseCurve) {
  const values = bootstrap.map(coefficients => responseAt(
    row.temperatureC,
    artifact.observedTemperature.minimumMortalityTemperatureC,
    coefficients,
  ));
  const expected = summarize(values);
  for (const name of ['q025', 'median', 'q975', 'mean']) close(row[name], expected[name]);
}

for (const sufficient of artifact.sufficientStatistics.annualSide) {
  const values = bootstrap.map(coefficients => sufficient.populationWeightedCenteredTemperaturePowers.reduce(
    (sum, moment, index) => sum + moment * coefficients[index],
    0,
  ));
  const expected = summarize(values);
  const actual = artifact.attribution.annualBySide.find(row => (
    row.year === sufficient.year && row.side === sufficient.side
  ));
  assert(actual, `${sufficient.year} ${sufficient.side}: annual output missing`);
  assert.equal(actual.matchedDailyRows, sufficient.matchedDailyRows);
  for (const name of ['q025', 'median', 'q975', 'mean']) close(actual[name], expected[name]);
}

const binTemperatures = artifact.sufficientStatistics.personDayResponseBinsC;
const personDayYears = artifact.sufficientStatistics.annualPersonDays;
const personDayTotals = bootstrap.map(coefficients => binTemperatures.reduce((total, temperature, binIndex) => {
  const averagePersonDays = personDayYears.reduce(
    (sum, year) => sum + year.personDaysByResponseBin[binIndex],
    0,
  ) / personDayYears.length;
  return total + responseAt(
    temperature,
    artifact.observedTemperature.minimumMortalityTemperatureC,
    coefficients,
  ) * averagePersonDays;
}, 0));
const expectedPersonDayTotal = summarize(personDayTotals);
for (const name of ['q025', 'median', 'q975', 'mean']) {
  close(artifact.attribution.personDayTotal[name], expectedPersonDayTotal[name]);
}
close(artifact.attribution.averageAnnualTotal.mean, 423_200.66353065195);
close(artifact.attribution.personDayTotal.mean, 406_946.760490983);
assert(artifact.attribution.personDayTotal.mean < artifact.attribution.averageAnnualTotal.mean);
assert.equal(artifact.validation.authorOutputsCompared, false);
assert.equal(artifact.admissionDecision.status, 'not_admitted_factual_temperature_endpoint_only');
assert.equal(artifact.admissionDecision.axesAdmitted, 0);
assert.equal(artifact.admissionDecision.scoresChanged, 0);
assert.match(artifact.admissionDecision.nextGate, /matched local source-removal temperatures/i);

console.log('European temperature–mortality attribution reproduction passed: exact daily/bin day reconciliation, transparent sufficient-statistic recomputation, and no premature TULIP axis or score admission.');
