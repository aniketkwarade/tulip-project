import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/faostat-forest-conversion-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.version, 'tulip_faostat_forest_conversion_reference_2026_09_23_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.source.file.bytes, 1_458_442);
assert.equal(snapshot.source.file.md5, '5545c8a346c19e44a83caadac2a1add7');
assert.equal(snapshot.source.file.sha256, '4167617c5104014f007d9311be8d0ee0976fcde677fd402a4b1a262358d5c349');
assert.equal(snapshot.metric.nodeId, 'deforestation_co2_release');
assert.equal(snapshot.metric.observations.length, 36);
assert.deepEqual([snapshot.metric.observations[0].year, snapshot.metric.observations.at(-1).year], [1990, 2025]);
assert(snapshot.metric.observations.every(row => row.flag === 'E'));
assert(snapshot.metric.cumulativeGtCO2 > 132 && snapshot.metric.cumulativeGtCO2 < 133);
assert.match(snapshot.metric.boundary, /living biomass/i);
assert.match(snapshot.admissionDecision.prohibitedUse, /do not combine/i);
const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: snapshot.source,
  method: snapshot.method,
  metric: snapshot.metric,
  limitations: snapshot.limitations,
  admissionDecision: snapshot.admissionDecision,
})).digest('hex');
assert.equal(snapshot.digest, expectedDigest);
console.log('FAOSTAT forest-conversion reference passed: 36 checksum-pinned annual values preserve the partial living-biomass boundary without converting land-use emissions into harm.');
