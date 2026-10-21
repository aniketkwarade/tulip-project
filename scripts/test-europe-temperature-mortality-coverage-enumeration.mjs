import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-coverage-enumeration.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_europe_temperature_mortality_coverage_enumeration_2026_09_25_v2');
assert.equal(payload.status, 'exact_public_region_and_year_coverage_enumerated');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.inputs.bridgeVersion, 'tulip_europe_temperature_mortality_bridge_reference_2026_09_25_v4');
assert.equal(payload.counts.files, 6);
assert.equal(payload.counts.axesAdmitted, 0);
assert.equal(payload.counts.scoresChanged, 0);
assert.equal(payload.files.temperatureLimits.rows, 1_115);
assert.equal(payload.files.temperatureLimits.decodedRegionValues, 1_115);
assert.equal(payload.files.temperatureLimits.uniqueRegions, 1_115);
assert.equal(payload.files.temperatureLimits.regionIds.length, 1_115);
assert.equal(payload.files.temperatureLimits.regionIds[0], 'AL011');
assert.equal(payload.files.temperatureLimits.regionIds.at(-1), 'XK007');
for (const file of Object.values(payload.files)) {
  assert.equal(file.decodedRegionValues, file.rows);
  assert.equal(file.regionIds.length, file.uniqueRegions);
  assert.equal(new Set(file.regionIds).size, file.uniqueRegions);
  assert(/^[a-f0-9]{64}$/.test(file.regionIdDigest));
  if (file.years.length) {
    assert.equal(Object.keys(file.regionYears).length, file.uniqueRegions);
    assert(/^[a-f0-9]{64}$/.test(file.regionYearCoverageDigest));
  }
}
assert.match(payload.coverageDecision.boundary, /not representative global coverage/i);
assert.match(payload.coverageDecision.nextGate, /reproduce the working paper/i);
assert.equal(payload.coverageDecision.currentScoreEffect, 'none_all_21_source_candidates_retained');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  inputs: payload.inputs,
  counts: payload.counts,
  files: payload.files,
  coverageDecision: payload.coverageDecision,
})).digest('hex');
assert.equal(payload.digest, expectedDigest);

console.log('European temperature-mortality coverage enumeration passed: exact region and year coverage is reproducible, with zero axes or scores admitted.');
