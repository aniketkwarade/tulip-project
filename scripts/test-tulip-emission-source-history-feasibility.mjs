import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const audit = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/internal-emission-source-history-feasibility.json', import.meta.url),
  'utf8',
));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

assert.equal(audit.version, 'tulip_internal_emission_source_history_feasibility_2026_09_25_v1');
assert.equal(audit.status, 'six_remaining_source_histories_audited_no_false_splits_admitted');
assert.equal(audit.productionRatingsEnabled, 0);
assert.equal(audit.counts.nodesAudited, 6);
assert.equal(audit.counts.nodeSpecificHistoriesAdmitted, 0);
assert.equal(audit.counts.numericalCandidatesRetained, 6);
assert.equal(audit.counts.ratingChanges, 0);
assert.equal(audit.rows.length, 6);
assert(audit.rows.every(row => row.currentCandidate.confidence === 'D'));
assert(audit.rows.every(row => row.ratingEffect === 'none_candidate_retained_at_confidence_d'));

const byId = new Map(audit.rows.map(row => [row.nodeId, row]));
assert.match(byId.get('passenger_road_fuel_co2').finding, /Neither identifies passenger vehicles separately/i);
assert.match(byId.get('diesel_freight_co2').prohibitedUse, /all road diesel with freight/i);
assert.match(byId.get('construction_material_co2').finding, /not emissions embodied/i);
assert.match(byId.get('fossil_hydrogen_co2').finding, /does not separate production-route CO2/i);
assert.match(byId.get('fossil_power_backup_co2').finding, /not whether a generator ran in standby or backup mode/i);
assert.match(byId.get('land_use_fire_co2').prohibitedUse, /Do not sum gross fire CO2 into cumulative fossil CO2/i);
assert.equal(audit.sharedSourceFacts.climateTraceLandFire.annualRecords.length, 10);
assert(audit.sharedSourceFacts.climateTraceLandFire.yearsWithFlatMonthlyValues.length > 0);
assert(audit.sharedSourceFacts.cedsRoad.selectedRows > 0);
assert(audit.sharedSourceFacts.cedsConstructionActivity.selectedRows > 0);
assert(audit.sharedSourceFacts.cedsOilElectricity.selectedRows > 0);

const expectedDigest = digest({
  sourceVerification: audit.sourceVerification,
  methodBoundary: audit.methodBoundary,
  counts: audit.counts,
  sharedSourceFacts: audit.sharedSourceFacts,
  rows: audit.rows,
});
assert.equal(audit.digest, expectedDigest);

console.log('Emission-source history feasibility passed: six remaining source nodes retain numerical candidates while aggregate, overlapping and mixed-gas histories stay outside node-specific physical attribution.');
