import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  applyCumulativeCoefficients,
  sourceRemovalDifferenceMoments,
  summarize,
} from './analyze-europe-temperature-mortality-source-removal-endpoint.mjs';

const temperatures = [12, 19, 24.5, 31];
const populations = [100, 250, 175, 90];
const statistics = [0, 0, 0, 0];
for (let index = 0; index < temperatures.length; index += 1) {
  const temperature = temperatures[index];
  const population = populations[index];
  statistics[0] += population;
  statistics[1] += population * temperature;
  statistics[2] += population * temperature ** 2;
  statistics[3] += population * temperature ** 3;
}

for (const shift of [0, 0.05, 0.8, -0.2]) {
  const algebraic = sourceRemovalDifferenceMoments(statistics, shift);
  const bruteForce = [1, 2, 3, 4].map(degree => temperatures.reduce((sum, temperature, index) => (
    sum + populations[index] * (temperature ** degree - (temperature - shift) ** degree)
  ), 0));
  for (let degree = 0; degree < 4; degree += 1) {
    assert(Math.abs(algebraic[degree] - bruteForce[degree]) < 1e-7, `degree ${degree + 1}, shift ${shift}`);
  }
}

assert.deepEqual(sourceRemovalDifferenceMoments(statistics, 0), [0, 0, 0, 0]);
assert.equal(applyCumulativeCoefficients([1, 2, 3, 4], [4, 3, 2, 1]), 20);
assert.deepEqual(summarize([1, 2, 3, 4, 5]), { q025: 1.1, median: 3, q975: 4.9, mean: 3 });

const linearCoefficient = [0.000001, 0, 0, 0];
const smallShift = applyCumulativeCoefficients(sourceRemovalDifferenceMoments(statistics, 0.1), linearCoefficient);
const largeShift = applyCumulativeCoefficients(sourceRemovalDifferenceMoments(statistics, 0.2), linearCoefficient);
assert(smallShift > 0);
assert(Math.abs(largeShift - 2 * smallShift) < 1e-12);

const artifactUrl = new URL('../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-source-removal-endpoint.json', import.meta.url);
let artifact = null;
try {
  artifact = JSON.parse(await readFile(artifactUrl, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (artifact) {
  assert.equal(artifact.version, 'tulip_europe_temperature_mortality_source_removal_endpoint_2026_09_26_v1');
  assert.equal(artifact.status, 'complete_matched_source_removal_human_endpoint_ecosystem_endpoint_pending');
  assert.equal(artifact.coverage.regions, 971);
  assert.deepEqual(artifact.coverage.observedYears, Array.from({ length: 23 }, (_, index) => 2000 + index));
  assert.equal(artifact.coverage.sourceNodes, 21);
  assert.equal(artifact.coverage.bootstrapFits, 100);
  assert.equal(artifact.results.length, 21);
  assert.equal(new Set(artifact.results.map(row => row.nodeId)).size, 21);
  assert.equal(artifact.decision.humanEndpointCompleted, true);
  assert.equal(artifact.decision.ecosystemEndpointCompleted, false);
  assert.equal(artifact.decision.axesAdmitted, 0);
  assert.equal(artifact.decision.scoresChanged, 0);
  for (const row of artifact.results) {
    assert.deepEqual(row.physicalCases.map(item => item.physicalCase), ['lower', 'best', 'upper'], row.nodeId);
    for (const physicalCase of row.physicalCases) {
      assert.equal(physicalCase.annual.length, 23, row.nodeId);
      assert.equal(physicalCase.windows.fullObservedPeriod.years, 23, row.nodeId);
      assert.equal(physicalCase.windows.recentObservedPeriod.years, 8, row.nodeId);
      assert.equal(physicalCase.windows.latestYear.year, 2022, row.nodeId);
      for (const window of Object.values(physicalCase.windows)) {
        assert(Number.isFinite(window.centralEstimate), `${row.nodeId} ${physicalCase.physicalCase}`);
        assert(Number.isFinite(window.bootstrap.q025), `${row.nodeId} ${physicalCase.physicalCase}`);
        assert(window.bootstrap.q025 <= window.bootstrap.q975, `${row.nodeId} ${physicalCase.physicalCase}`);
      }
    }
  }
}

console.log('European temperature–mortality source-removal endpoint math passed: exact fourth-degree moment transformation, zero-shift identity, coefficient application and deterministic quantiles.');
