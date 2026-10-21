import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateMethaneGwpStar, METHANE_GWP_STAR_METHOD } from './lib/tulip-methane-gwp-star.mjs';

const reference = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/jones-national-warming-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(reference.version, 'jones_national_warming_contributions_2025_1_global_reference_v2');
assert.equal(reference.source.files['EMISSIONS_ANNUAL_1830-2024.csv'].md5, '6801e4fec311446c3a63a12d1d2affd0');
assert.equal(reference.validation.methaneGwpStar.result, 'published_gwp_star_rows_reproduced');
assert.equal(reference.validation.methaneGwpStar.inputRecordCount, 390);
assert.equal(reference.validation.methaneGwpStar.outputRecordCount, 348);
assert(reference.validation.methaneGwpStar.maximumAbsoluteErrorPgCO2we < 1e-9);

for (const component of reference.methaneValidationInputs) {
  const result = calculateMethaneGwpStar({
    annualEmissions: component.annualInputs,
    referenceYear: reference.method.methaneGwpStar.referenceYear,
    gwp100: component.gwp100,
    method: METHANE_GWP_STAR_METHOD,
  });
  assert.equal(result.records.length, component.records.length, component.component);
  for (const [index, record] of result.records.entries()) {
    const published = component.records[index];
    assert.equal(record.year, published.year, component.component);
    assert(Math.abs(record.cumulativePgCO2weSinceReference - published.cumulativePgCO2we) < 1e-9,
      `${component.component} ${record.year}`);
  }
}

console.log('Jones methane GWP* reference passed: the published fossil and biogenic methane histories reproduce from checksum-pinned annual inputs.');
