import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/internal-emission-source-heat-endpoint-sensitivity.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'source_specific_nonlinear_human_endpoint_sensitivity_not_calibrated_attribution');
assert.equal(snapshot.inputCounts.regions, 103);
assert.equal(snapshot.version, 'tulip_internal_emission_source_heat_endpoint_sensitivity_2026_09_25_v6');
assert.equal(snapshot.inputCounts.source_nodes, 21);
assert.equal(snapshot.inputCounts.co2_source_nodes, 20);
assert.equal(snapshot.inputCounts.methane_source_nodes, 1);
assert.equal(snapshot.results.length, 21);
assert(snapshot.factual.heat_deaths > 0);
assert(snapshot.factual.represented_population > 50_000_000);
assert(snapshot.zeroShiftCheck.absolute_difference < 1e-10);
assert.equal(snapshot.admissionDecision.status, 'sensitivity_only_not_admitted_to_tulip_axes');
assert.match(snapshot.admissionDecision.gateToAdmission, /regional weekly temperature patterns/i);
for (const row of snapshot.results) {
  assert.deepEqual(row.sensitivity.map(item => item.pattern_scale), [0.5, 1, 1.5, 2], row.node_id);
  assert(row.sensitivity.every(item => item.source_attributable_heat_deaths >= 0), row.node_id);
  assert(row.sensitivity.every((item, index) => index === 0 || item.source_attributable_heat_deaths >= row.sensitivity[index - 1].source_attributable_heat_deaths), row.node_id);
}
const byId = new Map(snapshot.results.map(row => [row.node_id, row]));
const central = nodeId => byId.get(nodeId).sensitivity.find(item => item.pattern_scale === 1).source_attributable_heat_deaths;
assert(central('refinery_combustion_co2') > central('aviation_jet_fuel_co2'));
assert(central('aviation_jet_fuel_co2') > central('waste_incineration_co2'));
assert(central('cement_kiln_fuel_co2') > 0);
assert(central('rice_paddy_methane_bubbles') > 0);
assert.equal(byId.get('rice_paddy_methane_bubbles').source_gas, 'CH4');
assert.equal(byId.get('rice_paddy_methane_bubbles').response_basis, 'path_dependent_methane_gwp_star_response_since_1991');
assert.equal(snapshot.admissionDecision.prohibitedUses.some(rule => /TULIP severity, reach, persistence/i.test(rule)), true);

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sourceVerification: snapshot.sourceVerification,
  method: snapshot.method,
  inputCounts: snapshot.inputCounts,
  factual: snapshot.factual,
  results: snapshot.results,
  admissionDecision: snapshot.admissionDecision,
  limitations: snapshot.limitations,
})).digest('hex');
assert.equal(snapshot.digest, expectedDigest);

console.log('Emission-source heat sensitivity passed: twenty CO2 histories and the rice-methane response run through the nonlinear 103-region public sample, with the unvalidated temperature-pattern assumption kept outside TULIP scoring.');
