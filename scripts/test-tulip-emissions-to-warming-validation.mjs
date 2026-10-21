import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const readJson = async filename => JSON.parse(await readFile(path.join(dir, filename), 'utf8'));
const [reference, validation, allocation] = await Promise.all([
  readJson('jones-national-warming-reference-snapshot.json'),
  readJson('internal-emissions-to-warming-validation.json'),
  readJson('internal-emission-source-allocation.json'),
]);

assert.equal(reference.source.license, 'cc-by-4.0');
assert.equal(reference.validation.recordCount, 2088);
assert.equal(reference.validation.firstYear, 1851);
assert.equal(reference.validation.lastYear, 2024);
assert(reference.validation.maxAbsoluteReproductionErrorC < 1e-12);
assert.equal(reference.source.files['GMST_response_1851-2024.csv'].md5, '1a9ffc845c30dc1ac23168d752dbaaea');
assert.equal(reference.source.files['EMISSIONS_CUMULATIVE_CO2e100_1851-2024.csv'].md5, '8bc5aab2e7e40fdb31c42ca83afd000b');

const globalCo2Total2024 = reference.records.find(record => record.year === 2024
  && record.gas === 'CO[2]' && record.component === 'Total');
assert(globalCo2Total2024);
assert(Math.abs(globalCo2Total2024.cumulativePgCO2eSourceMethod - 2701.07526948993) < 1e-10);
assert(Math.abs(globalCo2Total2024.gmstResponseCSourceReported - 1.21636850290895) < 1e-12);

assert.equal(validation.version, 'tulip_internal_emissions_to_warming_validation_2026_09_23_v6');
assert.equal(validation.validation.sourceHistoriesValidated, 20);
assert.equal(validation.validation.annualRecordsValidated, 1649);
assert.equal(validation.validation.annualSeriesEndingAtValidatedCumulativeTotal, 20);
assert.equal(validation.validation.sourceHistoriesWithTerminalEndpointModel, 0);
assert.equal(validation.results.length, 20);
assert(validation.results.every(result => result.physicalAttributionStatus
  === 'published_arithmetic_reproduced_partial_source_history'));
assert(validation.results.every(result => result.scoreEffect === 'none_candidate_value_and_grade_unchanged'));
assert(validation.results.every(result => result.attributableGmstScreenC.differenceBetweenBestMethodsC < 0.0001));
assert(validation.results.every(result => result.annualGmstScreen.status === 'validated_partial_source_history_time_series'));
assert.deepEqual(Object.values(validation.validation.historyPeriods).sort(), [
  ...Array(3).fill('1750-2022'),
  ...Array(4).fill('1970-2022'),
  ...Array(9).fill('1970-2024'),
  '1990-2024',
  '1990-2025',
  ...Array(2).fill('2000-2025'),
].sort());
assert.equal(validation.results.filter(result => result.history.sourceId === 'edgar_global_emissions_database').length, 9);
assert.equal(validation.results.filter(result => result.history.sourceId === 'ceds_v2024_04_01_release_emission_data').length, 6);
assert.equal(validation.results.filter(result => result.history.sourceId
  === 'ceds_v2024_04_01_release_emission_data_reconstructed_cement_kiln').length, 1);
assert.equal(validation.results.filter(result => result.history.sourceId === 'ember_global_electricity_data').length, 2);
assert.equal(validation.results.filter(result => result.history.sourceId === 'faostat').length, 1);
assert.equal(validation.results.filter(result => result.history.sourceId === 'faostat_emissions_from_forests_2025_10_20').length, 1);
assert(validation.results.every(result => Math.abs(result.annualGmstScreen.records.at(-1).cumulativeGmstBestC
  - result.attributableGmstScreenC.bestPublishedMethod) < 1e-6));
assert(validation.results.every(result => result.annualGmstScreen.records.every((record, index, records) => index === 0
  || record.cumulativeGtCO2 >= records[index - 1].cumulativeGtCO2)));

const expected = allocation.rows.filter(row => row.physicalScreening).map(row => row.nodeId).sort();
assert.deepEqual(validation.results.map(result => result.nodeId).sort(), expected);
const cementKiln = validation.results.find(result => result.nodeId === 'cement_kiln_fuel_co2');
assert.equal(cementKiln.annualGmstScreen.records.length, 273);
assert.match(cementKiln.history.sourceBoundary, /constant 2019 cement allocation factor/i);
assert.match(cementKiln.history.boundaryNote, /glass, ceramics, lime/i);
console.log('TULIP emissions-to-warming validation tests passed.');
