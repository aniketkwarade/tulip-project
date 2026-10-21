import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/ceds-industrial-heat-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'two_non_overlapping_industrial_fuel_histories_ingested');
assert.equal(snapshot.source.archive.md5, '636752881e915244bb96b4793d9fb121');
assert.equal(snapshot.source.archive.sha256, '913237080a65c9166a0270b9765bb1489701c125aebe0f512f0da2634098d04e');
assert.equal(snapshot.source.member.sha256, '5568aba2a7a83d5d8a2a658cc0e2e9956470cd70caf3c3bb640493afcb9e1fac');
assert.deepEqual(Object.keys(snapshot.metrics), ['coal_industrial_heat_co2', 'gas_industrial_heat_co2']);
const coal = snapshot.metrics.coal_industrial_heat_co2;
const gas = snapshot.metrics.gas_industrial_heat_co2;
assert.equal(coal.observations.length, 273);
assert.equal(gas.observations.length, 273);
assert.equal(coal.observations[0].year, 1750);
assert.equal(coal.observations.at(-1).year, 2022);
assert.equal(coal.selectedRows, 39);
assert.equal(gas.selectedRows, 13);
assert(Math.abs(coal.observations.at(-1).valueKtCO2 - 2_305_519.64724353) < 1e-6);
assert(Math.abs(gas.observations.at(-1).valueKtCO2 - 1_811_883.3133229723) < 1e-6);
assert(Math.abs(coal.cumulativeGtCO2 - 209.28679472074667) < 1e-9);
assert(Math.abs(gas.cumulativeGtCO2 - 72.13085005204786) < 1e-9);
assert.equal(new Set(coal.fuels.filter(fuel => gas.fuels.includes(fuel))).size, 0);
assert.match(coal.boundary, /Electricity, heat production, transformation, buildings, transport/i);
const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: snapshot.source,
  method: snapshot.method,
  metrics: snapshot.metrics,
  limitations: snapshot.limitations,
  admissionDecision: snapshot.admissionDecision,
})).digest('hex');
assert.equal(snapshot.digest, expectedDigest);
console.log('CEDS industrial-heat reference passed: 546 checksum-pinned annual records preserve disjoint coal and natural-gas boundaries without converting emissions into harm.');
