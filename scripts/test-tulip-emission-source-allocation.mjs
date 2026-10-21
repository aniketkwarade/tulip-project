import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const [allocation, catalogue] = await Promise.all([
  readJson('artifacts/tulip-calibration-2026-09-22/internal-emission-source-allocation.json'),
  readJson('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json'),
]);

assert.equal(allocation.rows.length, 28);
assert.equal(allocation.version, 'tulip_internal_emission_source_allocation_2026_09_23_v8');
assert.equal(allocation.counts.emissionSourceNodes, 28);
assert.equal(allocation.counts.numericalCandidatesRetained, 28);
assert.equal(allocation.counts.sameInventoryAnnualShares, 10);
assert.equal(allocation.counts.cumulativeCo2PhysicalScreens, 20);
assert.equal(allocation.counts.methaneGwpStarPhysicalScreens, 1);
assert.equal(allocation.counts.sourceSpecificAnnualMassFlows, 25);
assert.equal(allocation.counts.scoreReadyFromSourceAllocation, 0);
assert.equal(allocation.nextModelCandidates.length, 3);
assert.deepEqual(allocation.nextIngestionOrder.map(wave => wave.nodeIds.length), [9, 11, 2, 6]);
assert.equal(new Set(allocation.nextIngestionOrder.flatMap(wave => wave.nodeIds)).size, 28);
assert(allocation.rows.every(row => row.currentCandidate.confidence === 'D'));
assert(allocation.rows.every(row => row.scoreReadiness === 'not_ready_terminal_consequence_model_missing'));
assert(allocation.rows.every(row => row.prohibitedConversions.some(rule => rule.includes('aggregate TULIP value'))));

const reviewedSources = catalogue.issues.filter(row => row.result.causalAllocation?.role === 'emission_source');
assert.equal(reviewedSources.length, 28);
assert.deepEqual(
  allocation.rows.map(row => row.nodeId).sort(),
  reviewedSources.map(row => row.nodeId).sort(),
);
for (const row of allocation.rows) {
  const reviewed = reviewedSources.find(item => item.nodeId === row.nodeId);
  assert.equal(row.currentCandidate.value, reviewed.result.value);
  assert.equal(row.currentCandidate.grade, reviewed.result.grade.letter);
  assert.equal(reviewed.result.causalAllocation.inheritsAggregateScore, false);
  assert.equal(reviewed.result.causalAllocation.researchRecord,
    'artifacts/tulip-calibration-2026-09-22/internal-emission-source-allocation.json');
}

const rice = allocation.rows.find(row => row.nodeId === 'rice_paddy_methane_bubbles');
assert.equal(rice.gasOrBoundary, 'methane');
assert.equal(rice.physicalScreening, null);
assert(rice.annualInventoryShare.valuePct > 7 && rice.annualInventoryShare.valuePct < 8);
assert.equal(rice.allocationReadiness, 'methane_physical_intermediate_ready_terminal_endpoints_needed');
assert.equal(rice.methanePhysicalScreening.status, 'published_gwp_star_method_reproduced_partial_source_history');
assert.equal(rice.methanePhysicalScreening.records.length, 33);
assert.deepEqual([rice.methanePhysicalScreening.records[0].year, rice.methanePhysicalScreening.records.at(-1).year], [1992, 2024]);
assert(rice.methanePhysicalScreening.latest.gmstResponseC.best > 0.004
  && rice.methanePhysicalScreening.latest.gmstResponseC.best < 0.0043);
assert.match(rice.requiredNextEvidence[0], /hazard model and matched current human and ecosystem endpoints/i);

const tundra = allocation.rows.find(row => row.nodeId === 'tundra_methane_outgassing');
assert.equal(tundra.measurement.value, 45.385);
assert.equal(tundra.measurement.unit, 'Mt CH4/year');
assert.equal(tundra.measurement.quality, 'broad_arctic_boreal_total_not_node_specific');
assert.deepEqual([tundra.annualHistory.startYear, tundra.annualHistory.endYear], [2010, 2021]);
assert.equal(tundra.annualHistory.valuesMtCH4.length, 12);
assert.equal(tundra.componentMeasurements.wetlandMeanMtCH4PerYear, 21.49);
assert.deepEqual(tundra.thawAttributionBoundary.directCurrentThawEmissionTgCH4PerYearRange, [0, 1]);
assert.equal(tundra.allocationReadiness, 'broad_flux_history_ingested_node_boundary_and_methane_response_needed');
assert.match(tundra.requiredNextEvidence[0], /1991–2020 reference/i);
assert.equal(tundra.physicalScreening, null);

const coal = allocation.rows.find(row => row.nodeId === 'coal_power_co2_output');
assert(coal.physicalScreening.cumulativeGtCO2 > 200);
assert(coal.physicalScreening.estimatedWarmingContributionC.best > 0.09);

const coalIndustrialHeat = allocation.rows.find(row => row.nodeId === 'coal_industrial_heat_co2');
assert(coalIndustrialHeat.physicalScreening.cumulativeGtCO2 > 209
  && coalIndustrialHeat.physicalScreening.cumulativeGtCO2 < 210);
assert.deepEqual([coalIndustrialHeat.physicalScreening.recordStartYear,
  coalIndustrialHeat.physicalScreening.recordEndYear], [1750, 2022]);
assert.equal(coalIndustrialHeat.measurement.quality, 'source_native_disjoint_industrial_sector_fuel_co2');
assert.equal(coalIndustrialHeat.annualInventoryShare, null);
assert.equal(coalIndustrialHeat.allocationReadiness, 'physical_intermediate_ready_current_refresh_needed');

const gasIndustrialHeat = allocation.rows.find(row => row.nodeId === 'gas_industrial_heat_co2');
assert(gasIndustrialHeat.physicalScreening.cumulativeGtCO2 > 72
  && gasIndustrialHeat.physicalScreening.cumulativeGtCO2 < 73);
assert.deepEqual([gasIndustrialHeat.physicalScreening.recordStartYear,
  gasIndustrialHeat.physicalScreening.recordEndYear], [1750, 2022]);
assert.equal(gasIndustrialHeat.measurement.quality, 'source_native_disjoint_industrial_sector_fuel_co2');
assert.equal(gasIndustrialHeat.annualInventoryShare, null);
assert.equal(gasIndustrialHeat.allocationReadiness, 'physical_intermediate_ready_current_refresh_needed');

const cementKiln = allocation.rows.find(row => row.nodeId === 'cement_kiln_fuel_co2');
assert(cementKiln.physicalScreening.cumulativeGtCO2 > 34
  && cementKiln.physicalScreening.cumulativeGtCO2 < 35);
assert.deepEqual([cementKiln.physicalScreening.recordStartYear,
  cementKiln.physicalScreening.recordEndYear], [1750, 2022]);
assert.equal(cementKiln.measurement.quality,
  'reconstructed_CEDS_nonmetallic_minerals_scaled_to_2019_cement_combustion_benchmark');
assert.equal(cementKiln.annualInventoryShare, null);
assert.equal(cementKiln.allocationReadiness,
  'physical_intermediate_ready_reconstructed_sector_proxy_review_needed');
assert.match(cementKiln.physicalScreening.boundaryNote, /constant 2019 cement share/i);
assert.match(cementKiln.requiredNextEvidence[0], /time-varying cement share/i);

const deforestation = allocation.rows.find(row => row.nodeId === 'deforestation_co2_release');
assert(deforestation.physicalScreening.cumulativeGtCO2 > 132
  && deforestation.physicalScreening.cumulativeGtCO2 < 133);
assert.deepEqual([deforestation.physicalScreening.recordStartYear,
  deforestation.physicalScreening.recordEndYear], [1990, 2025]);
assert.equal(deforestation.measurement.quality,
  'FAOSTAT_Tier_1_estimated_partial_net_forest_conversion_living_biomass');
assert.equal(deforestation.annualInventoryShare, null);
assert.equal(deforestation.allocationReadiness,
  'physical_intermediate_ready_partial_land_boundary_review_needed');
assert.match(deforestation.physicalScreening.boundaryNote, /living biomass/i);

const landFire = allocation.rows.find(row => row.nodeId === 'land_use_fire_co2');
assert.equal(landFire.physicalScreening, null);
assert.equal(landFire.allocationReadiness, 'net_flux_and_anthropogenic_attribution_needed');

const methaneWave = allocation.nextIngestionOrder.find(wave => wave.wave === 3);
assert.deepEqual(methaneWave.nodeIds.sort(), ['rice_paddy_methane_bubbles', 'tundra_methane_outgassing']);

const ecosystemCandidate = allocation.nextModelCandidates.find(candidate => candidate.stage === 'ecosystem_terminal_endpoint');
assert.equal(ecosystemCandidate.status, 'research_target_no_common_quantitative_denominator_selected');
assert(ecosystemCandidate.doesNotAnswer.includes('universal ecosystem-loss percentage'));

const humanCandidate = allocation.nextModelCandidates.find(candidate => candidate.stage === 'human_terminal_endpoint');
assert.equal(humanCandidate.status, 'published_algorithm_reproduced_on_hypothetical_example');
assert.equal(humanCandidate.referenceSnapshotVersion, 'tulip_heat_mortality_attribution_reference_2026_09_23_v1');
assert.equal(humanCandidate.referenceSnapshotDigest.length, 64);
assert.match(humanCandidate.doesNotAnswer, /hypothetical/i);

console.log('TULIP emission-source allocation tests passed.');
