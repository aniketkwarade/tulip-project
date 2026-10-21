import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/cement-kiln-fuel-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'reconstructed_cement_kiln_fuel_history_sensitivity_only');
assert.equal(snapshot.nodeId, 'cement_kiln_fuel_co2');
assert.equal(snapshot.sources.ceds.archive.md5, '636752881e915244bb96b4793d9fb121');
assert.equal(snapshot.sources.ceds.archive.sha256, '913237080a65c9166a0270b9765bb1489701c125aebe0f512f0da2634098d04e');
assert.equal(snapshot.sources.ceds.member.sha256, '5568aba2a7a83d5d8a2a658cc0e2e9956470cd70caf3c3bb640493afcb9e1fac');
assert.equal(snapshot.sources.cementBenchmark.version, '210505');
assert.match(snapshot.sources.cementBenchmark.admittedFinding, /approximately 0\.9 Gt CO2/i);
assert.equal(snapshot.metric.observations.length, 273);
assert.deepEqual([snapshot.metric.observations[0].year, snapshot.metric.observations.at(-1).year], [1750, 2022]);
assert.equal(snapshot.metric.selectedRows, 7);
assert.equal(snapshot.metric.fuels.includes('biomass'), false);
assert(Math.abs(snapshot.method.allocationFactor - 0.8493241341173515) < 1e-12);
assert(Math.abs(snapshot.method.benchmark.cedsNonMetallicMineralsKtCO2 - 1_059_666.1084349295) < 1e-6);
assert(Math.abs(snapshot.metric.observations.find(row => row.year === 2019).reconstructedCementKilnFuelKtCO2 - 900_000) < 1e-6);
assert(Math.abs(snapshot.metric.observations.at(-1).reconstructedCementKilnFuelKtCO2 - 920_782.4748721486) < 1e-6);
assert(Math.abs(snapshot.metric.cumulativeGtCO2 - 34.20509820901176) < 1e-9);
assert.match(snapshot.limitations.join(' '), /glass, ceramics, lime/i);
assert.match(snapshot.limitations.join(' '), /time-invariant share/i);
assert.match(snapshot.admissionDecision.prohibitedUse, /observed cement-only history/i);
const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  method: snapshot.method,
  metric: snapshot.metric,
  limitations: snapshot.limitations,
  admissionDecision: snapshot.admissionDecision,
})).digest('hex');
assert.equal(snapshot.digest, expectedDigest);
console.log('Cement-kiln fuel reference passed: 273 reconstructed annual records preserve the sector-allocation assumption and remain outside TULIP rating inputs.');
