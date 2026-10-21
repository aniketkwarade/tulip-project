import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const [validation, allocation] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/internal-methane-to-warming-validation.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-emission-source-allocation.json'),
]);

assert.equal(validation.status, 'published_methane_method_reproduced_rice_physical_intermediate_ready_tundra_history_incomplete');
assert.deepEqual(validation.counts, {
  methaneNodes: 2,
  publishedMethodReproduced: 1,
  sourceHistoriesMeetingTwentyYearRule: 1,
  physicalIntermediatesCalculated: 1,
  terminalEndpointModelsCompleted: 0,
  ratingChanges: 0,
});
assert(validation.reference.maximumAbsoluteReproductionErrorPgCO2we < 1e-9);

const rice = validation.results.find(row => row.nodeId === 'rice_paddy_methane_bubbles');
assert.equal(rice.methodStatus, 'published_gwp_star_transformation_reproduced_and_applied');
assert.deepEqual(rice.sourceHistory, { startYear: 1970, endYear: 2024, records: 55, sourceId: 'edgar_2025_ghg' });
assert.equal(rice.referenceBasis.referenceYear, 1991);
assert.deepEqual(rice.calculation.outputPeriod, { start: 1992, end: 2024 });
assert.equal(rice.calculation.records.length, 33);
assert.equal(rice.latestPhysicalIntermediate.year, 2024);
assert(rice.latestPhysicalIntermediate.annualMtCH4 > 25 && rice.latestPhysicalIntermediate.annualMtCH4 < 26);
assert(rice.latestPhysicalIntermediate.gmstResponseC.lower
  < rice.latestPhysicalIntermediate.gmstResponseC.best);
assert(rice.latestPhysicalIntermediate.gmstResponseC.best
  < rice.latestPhysicalIntermediate.gmstResponseC.upper);
assert.equal(rice.terminalHarmStatus, 'not_modelled');
assert.match(rice.remainingGap, /cannot set severity, reach or persistence/i);

const tundra = validation.results.find(row => row.nodeId === 'tundra_methane_outgassing');
assert.equal(tundra.methodStatus, 'not_applied_insufficient_annual_history_and_node_boundary_unresolved');
assert.deepEqual(tundra.sourceHistory, {
  startYear: 2010,
  endYear: 2021,
  records: 12,
  sourceId: 'basso_arctic_boreal_methane_inversion_2026',
});
assert.equal(tundra.calculation, null);
assert.equal(tundra.latestPhysicalIntermediate, null);
assert.match(tundra.remainingGap, /beginning no later than 1971/i);

for (const result of validation.results) {
  const current = allocation.rows.find(row => row.nodeId === result.nodeId).currentCandidate;
  assert(Number.isFinite(current.value), result.nodeId);
  assert.equal(result.scoreEffect, 'none_candidate_value_grade_and_confidence_unchanged', result.nodeId);
}

console.log('TULIP methane-to-warming validation passed: GWP* is reproduced, rice has a bounded physical series, tundra remains unmodelled without the required history, and no physical result becomes harm.');
