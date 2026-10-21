import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const optionalJson = async path => {
  try {
    return await json(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};
const [pass1, pass2, catalogue] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/internal-catalogue-audit-pass-1.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-catalogue-audit-pass-2.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json'),
]);
const [longRecordPatternAnalysis, monthlyPatternAnalysis, exactWeekPatternAnalysis, regionalPatternPromotion, matchedSourceRemovalEndpoint] = await Promise.all([
  optionalJson('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-long-record-pattern-analysis.json'),
  optionalJson('artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-independent-pattern-analysis.json'),
  optionalJson('artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-analysis.json'),
  optionalJson('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-pattern-promotion-decision.json'),
  optionalJson('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-source-removal-endpoint.json'),
]);

assert.equal(pass1.status, 'passed');
assert.equal(pass1.auditVersion, 'tulip_internal_catalogue_double_audit_2026_09_27_v109');
assert.deepEqual(pass1.counts, {
  catalogue: 381,
  issues: 354,
  responses: 27,
  passed: 381,
  failed: 0,
  globalErrors: 0,
});
assert.equal(pass1.failures.length, 0);
assert.equal(pass1.nodes.length, 381);
assert(pass1.nodes.every(row => row.status === 'passed' && row.errors.length === 0));

assert.equal(pass2.status, 'method_consistent_with_material_stability_findings');
assert.equal(pass2.counts.issues, 354);
assert.equal(pass2.counts.criticalFailures, 0);
assert.equal(pass2.criticalFailures.length, 0);
assert.equal(pass2.nodes.length, 354);
assert.equal(Object.values(pass2.counts.gradeCounts).reduce((sum, value) => sum + value, 0), 354);
assert.equal(Object.values(pass2.counts.gradeStability).reduce((sum, value) => sum + value, 0), 354);
assert.equal(pass2.counts.activeZeroAxes, 2);
assert.equal(pass2.counts.unresolvedEmissionSourceAllocations, 28);
assert.equal(pass2.counts.emissionSourceCandidatesNotEndpointCalibrated, 21);
assert.equal(pass2.counts.emissionSourceAxisAdmissionAudits, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointBridgeAudits, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointFullDataChecksumAudits, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointCoverageAudits, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointPooledModelReproductions, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointAttributionReproductions, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointPatternScreens, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointBoundaryCrosswalks, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointLongRecordRetrievalPlans, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointAreaWeightSets, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointLongRecordRetrievalsStarted, 21);
assert.equal(pass2.counts.emissionSourceHumanEndpointLongRecordPatternAnalyses, longRecordPatternAnalysis ? 21 : 0);
assert.equal(pass2.counts.emissionSourceHumanEndpointMonthlyPatternAnalyses, monthlyPatternAnalysis ? 21 : 0);
assert.equal(pass2.counts.emissionSourceHumanEndpointExactWeekPatternAnalyses, exactWeekPatternAnalysis ? 21 : 0);
assert.equal(pass2.counts.emissionSourceHumanEndpointRegionalPatternPromotionDecisions, regionalPatternPromotion ? 21 : 0);
assert.equal(pass2.counts.emissionSourceHumanEndpointMatchedSourceRemovalEndpoints, matchedSourceRemovalEndpoint ? 21 : 0);
assert.equal(pass2.counts.emissionSourceHistoryBoundaryAudits, 6);
assert.equal(pass2.counts.ecosystemPercentagesHeldForSemanticReview, 0);
assert.equal(pass2.counts.retainedPilotAxisBasisNotRecorded, 0);
assert.equal(pass2.counts.ecosystemExactSeveritySemanticsUnreviewed, 0);
assert(pass2.counts.gradeStability.crossesMultipleBoundaries > 0, 'Material grade instability must remain visible');
for (const row of pass2.nodes) {
  assert(!row.criticalFindings.some(finding => finding.includes('title_used_as_evidence')), row.nodeId);
  assert(!row.criticalFindings.some(finding => finding.includes('excluded_context_used_as_evidence')), row.nodeId);
  assert(!row.criticalFindings.some(finding => finding.includes('observation_window_used_as_consequence_duration')), row.nodeId);
  assert(!row.criticalFindings.some(finding => finding.includes('generic_persistence_field_used_as_consequence_duration')), row.nodeId);
  assert(!row.criticalFindings.some(finding => finding.includes('ecosystem_severity_reach_metric_reused_without_semantic_split')), row.nodeId);
}
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_attribution_reproduced')).length, 21);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_pattern_screen_completed')).length, 21);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_boundary_crosswalk_completed')).length, 21);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_long_record_retrieval_planned')).length, 21);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_area_weights_completed')).length, 21);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_long_record_retrieval_started')).length, 21);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_long_record_pattern_analyzed')).length, longRecordPatternAnalysis ? 21 : 0);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_monthly_pattern_analysis_completed')).length, monthlyPatternAnalysis ? 21 : 0);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_exact_week_pattern_analysis_completed')).length, exactWeekPatternAnalysis ? 21 : 0);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_regional_pattern_promotion_decided')).length, regionalPatternPromotion ? 21 : 0);
assert.equal(pass2.nodes.filter(row => row.calibrationFlags.includes('emission_source_human_endpoint_matched_source_removal_completed')).length, matchedSourceRemovalEndpoint ? 21 : 0);

const candidateById = new Map(catalogue.issues.map(row => [row.nodeId, row]));
assert.deepEqual(pass2.counts.gradeCounts, { A: 0, B: 163, C: 120, D: 54, E: 17 });
for (const [nodeId, value, grade, domains] of [
  ['livestock_disease_pressure', 4.8, 'C', ['human']],
  ['zoonotic_disease_outbreaks', 3.3, 'B', ['human']],
  ['oceanic_deoxygenation', 5.5, 'C', ['ecosystem']],
  ['coastal_hypoxia', 4, 'B', ['ecosystem']],
  ['surface_water_withdrawal_pressure', 4, 'B', ['ecosystem']],
  ['surface_water_inflow_deficit', 4.8, 'C', ['ecosystem']],
  ['surface_water_evaporative_loss', 4, 'B', ['ecosystem']],
  ['urban_water_demand_peak', 3.3, 'B', ['human']],
  ['antarctic_bottom_water_decline', 4, 'B', ['ecosystem']],
  ['thermal_stratification_intensification', 4, 'B', ['ecosystem']],
  ['amphibian_chytrid_fungus_spreads', 5.1, 'C', ['human', 'ecosystem']],
  ['pollinator_colony_collapse', 3.3, 'B', ['ecosystem']],
  ['pollen_allergen_spikes', 3.3, 'B', ['human']],
  ['lightning_fire_weather', 6.3, 'C', ['human', 'ecosystem']],
  ['mobile_wireless_networks', 5.5, 'C', ['human']],
  ['inland_waterway_fuel_spills', 4.4, 'B', ['human', 'ecosystem']],
  ['monsoon_volatility', 6.6, 'D', ['human', 'ecosystem']],
  ['dust_storm_frequency', 3.3, 'B', ['human', 'ecosystem']],
  ['smoke_exposure_burden', 9.3, 'E', ['human']],
  ['ozone_formation_pressure', 3.3, 'B', ['human', 'ecosystem']],
  ['nighttime_heat_retention', 4, 'B', ['human']],
  ['kelp_forest_collapse', 4.8, 'C', ['ecosystem']],
  ['jellyfish_swarm_surges', 4.8, 'C', ['human']],
  ['agricultural_soil_compaction', 5.5, 'C', ['human', 'ecosystem']],
  ['atmospheric_river_intensification', 3.6, 'B', ['human', 'ecosystem']],
  ['adaptation_capital_shortfall', 3.3, 'B', ['human', 'ecosystem']],
  ['fast_fashion', 3.3, 'B', ['human', 'ecosystem']],
  ['grid_peak_load_stress', 3.3, 'B', ['human']],
  ['utility_disconnection_risk', 4.8, 'C', ['human']],
  ['firn_layer_depletion', 5.5, 'C', ['ecosystem']],
  ['ice_cap_decapitation', 5.5, 'C', ['ecosystem']],
  ['ice_shelf_grounding_line_retreat', 5.1, 'C', ['human', 'ecosystem']],
  ['glacier_calving_events', 5.5, 'C', ['human']],
  ['critical_infrastructure_fragility', 4, 'B', ['human']],
  ['insurance_retreat', 4, 'B', ['human']],
  ['mortgage_market_exposure', 4, 'B', ['human']],
  ['airport_climate_exposure', 3.3, 'B', ['human']],
  ['airport_operational_disruption', 3.3, 'B', ['human']],
  ['personal_conveyance', 3.3, 'B', ['ecosystem']],
  ['renewable_curtailment_losses', 4, 'B', ['human']],
  ['semiconductor_fabrication_footprint', 3.3, 'B', ['ecosystem']],
  ['energy_affordability_crisis', 7, 'D', ['human']],
  ['fracking_wastewater_lakes', 5.5, 'C', ['ecosystem']],
]) {
  const candidate = candidateById.get(nodeId);
  assert.equal(candidate.result.value, value, nodeId);
  assert.equal(candidate.result.grade.letter, grade, nodeId);
  assert.deepEqual(candidate.candidate.applicableDomains, domains, nodeId);
  assert.equal(pass2.nodes.find(row => row.nodeId === nodeId).criticalFindings.length, 0, nodeId);
}
const wetlandPeatFires = candidateById.get('wetland_peat_fires');
assert.equal(wetlandPeatFires.result.value, 7.4);
assert.equal(wetlandPeatFires.result.grade.letter, 'D');
assert.equal(wetlandPeatFires.result.uncertainty.lower, 6.3);
assert.equal(wetlandPeatFires.result.uncertainty.upper, 8.1);
assert.equal(wetlandPeatFires.result.confidence, 'C');
assert.deepEqual(wetlandPeatFires.candidate.components.human.central, { severity: 4, reach: 2, persistence: 4 });
assert.deepEqual(wetlandPeatFires.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert.match(wetlandPeatFires.candidate.decisionTrace.measurementSemantics.reach, /Population, exposure, sensor count/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'wetland_peat_fires').criticalFindings.length, 0);
const seagrassMeadowDecline = candidateById.get('seagrass_meadow_decline');
assert.equal(seagrassMeadowDecline.result.value, 7);
assert.equal(seagrassMeadowDecline.result.grade.letter, 'D');
assert.equal(seagrassMeadowDecline.result.uncertainty.lower, 6.3);
assert.equal(seagrassMeadowDecline.result.uncertainty.upper, 7.8);
assert.equal(seagrassMeadowDecline.result.confidence, 'B');
assert.deepEqual(seagrassMeadowDecline.candidate.applicableDomains, ['ecosystem']);
assert.equal(seagrassMeadowDecline.candidate.components.human.structuralZero, true);
assert.deepEqual(seagrassMeadowDecline.candidate.components.ecosystem.central, { severity: 4, reach: 2, persistence: 2 });
assert.match(seagrassMeadowDecline.candidate.decisionTrace.measurementSemantics.reach, /compatible mapped seagrass distribution/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'seagrass_meadow_decline').criticalFindings.length, 0);
const shellCalcification = candidateById.get('shell_calcification_failures');
assert.equal(shellCalcification.result.value, 5.9);
assert.equal(shellCalcification.result.grade.letter, 'C');
assert.equal(shellCalcification.result.uncertainty.lower, 3.6);
assert.equal(shellCalcification.result.uncertainty.upper, 7.8);
assert.equal(shellCalcification.result.confidence, 'C');
assert.deepEqual(shellCalcification.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.deepEqual(shellCalcification.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 3 });
assert.equal(pass2.nodes.find(row => row.nodeId === 'shell_calcification_failures').criticalFindings.length, 0);
const urbanSprawl = candidateById.get('urban_sprawl_housing');
assert.equal(urbanSprawl.result.value, 5.5);
assert.equal(urbanSprawl.result.grade.letter, 'C');
assert.equal(urbanSprawl.result.uncertainty.lower, 3.3);
assert.equal(urbanSprawl.result.uncertainty.upper, 7.8);
assert.equal(urbanSprawl.result.confidence, 'C');
assert.deepEqual(urbanSprawl.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 3 });
assert.equal(urbanSprawl.candidate.components.human.structuralZero, true);
assert.equal(pass2.nodes.find(row => row.nodeId === 'urban_sprawl_housing').criticalFindings.length, 0);
const groundwaterRecharge = candidateById.get('aquifer_recharge_failure');
assert.equal(groundwaterRecharge.result.value, 4.4);
assert.equal(groundwaterRecharge.result.grade.letter, 'B');
assert.equal(groundwaterRecharge.result.uncertainty.lower, 2.1);
assert.equal(groundwaterRecharge.result.uncertainty.upper, 7);
assert.equal(groundwaterRecharge.result.confidence, 'C');
assert.deepEqual(groundwaterRecharge.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(groundwaterRecharge.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 2 });
assert.equal(pass2.nodes.find(row => row.nodeId === 'aquifer_recharge_failure').criticalFindings.length, 0);
for (const [nodeId, expected] of Object.entries({
  snow_drought: { value: 4.4, lower: 2.1, upper: 6.3 },
  snowmelt_timing_shift: { value: 3.6, lower: 1.8, upper: 5.9 },
  alpine_snowpack_declines: { value: 4, lower: 1.8, upper: 6.3 },
})) {
  const candidate = candidateById.get(nodeId);
  assert.equal(candidate.result.value, expected.value, nodeId);
  assert.equal(candidate.result.grade.letter, 'B', nodeId);
  assert.equal(candidate.result.uncertainty.lower, expected.lower, nodeId);
  assert.equal(candidate.result.uncertainty.upper, expected.upper, nodeId);
  assert.equal(candidate.result.confidence, 'C', nodeId);
  assert.equal(pass2.nodes.find(row => row.nodeId === nodeId).criticalFindings.length, 0, nodeId);
}
for (const nodeId of ['glacial_lake_failure_risk', 'glacier_hydrologic_system_floods']) {
  const candidate = candidateById.get(nodeId);
  assert.equal(candidate.result.value, 6.3, nodeId);
  assert.equal(candidate.result.grade.letter, 'C', nodeId);
  assert.equal(candidate.result.uncertainty.lower, 4.8, nodeId);
  assert.equal(candidate.result.uncertainty.upper, 7.4, nodeId);
  assert.equal(candidate.result.confidence, 'C', nodeId);
  assert.deepEqual(candidate.candidate.components.human.central, { severity: 4, reach: 2, persistence: 4 }, nodeId);
  assert.deepEqual(candidate.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 2 }, nodeId);
  assert.match(candidate.candidate.decisionTrace.measurementSemantics.reach, /Potential runout exposure/i, nodeId);
  assert.equal(pass2.nodes.find(row => row.nodeId === nodeId).criticalFindings.length, 0, nodeId);
}
const rainOnSnowFloodRisk = candidateById.get('rain_on_snow_flood_risk');
assert.equal(rainOnSnowFloodRisk.result.value, 5.5);
assert.equal(rainOnSnowFloodRisk.result.grade.letter, 'C');
assert.equal(rainOnSnowFloodRisk.result.uncertainty.lower, 3.6);
assert.equal(rainOnSnowFloodRisk.result.uncertainty.upper, 6.6);
assert.equal(rainOnSnowFloodRisk.result.confidence, 'C');
assert.deepEqual(rainOnSnowFloodRisk.candidate.components.human.central, { severity: 3, reach: 2, persistence: 3 });
assert.deepEqual(rainOnSnowFloodRisk.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 2 });
assert.match(rainOnSnowFloodRisk.candidate.decisionTrace.measurementSemantics.persistence, /longest facility closure is not applied to all/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'rain_on_snow_flood_risk').criticalFindings.length, 0);
const coralBleaching = candidateById.get('coral_bleaching');
assert.equal(coralBleaching.result.value, 7);
assert.equal(coralBleaching.result.grade.letter, 'D');
assert.equal(coralBleaching.result.confidence, 'B');
assert.equal(coralBleaching.result.uncertainty.lower, 6.3);
assert.equal(coralBleaching.result.uncertainty.upper, 8.5);
assert.deepEqual(coralBleaching.candidate.components.ecosystem.central, { severity: 3, reach: 3, persistence: 2 });
assert.equal(pass2.nodes.find(row => row.nodeId === 'coral_bleaching').criticalFindings.length, 0);
const oceanAcidification = candidateById.get('ocean_acidification');
assert.equal(oceanAcidification.result.value, 6.3);
assert.equal(oceanAcidification.result.grade.letter, 'C');
assert.equal(oceanAcidification.result.confidence, 'C');
assert.equal(oceanAcidification.result.uncertainty.lower, 4.4);
assert.equal(oceanAcidification.result.uncertainty.upper, 8.1);
assert.deepEqual(oceanAcidification.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.deepEqual(oceanAcidification.candidate.components.ecosystem.central, { severity: 3, reach: 3, persistence: 3 });
assert.match(oceanAcidification.candidate.decisionTrace.measurementSemantics.reach, /Global chemical coverage is excluded/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'ocean_acidification').criticalFindings.length, 0);
const cementConcrete = candidateById.get('cement_concrete');
assert.equal(cementConcrete.result.value, 7);
assert.equal(cementConcrete.result.grade.letter, 'D');
assert.equal(cementConcrete.result.confidence, 'C');
assert.equal(cementConcrete.result.uncertainty.lower, 5.1);
assert.equal(cementConcrete.result.uncertainty.upper, 8.5);
assert.deepEqual(cementConcrete.candidate.components.human.central, { severity: 3, reach: 2, persistence: 4 });
assert.deepEqual(cementConcrete.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 4 });
assert.match(cementConcrete.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /CO2-related DALYs/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'cement_concrete').criticalFindings.length, 0);
const humanitarianFundingShortfall = candidateById.get('humanitarian_response_funding_shortfall');
assert.equal(humanitarianFundingShortfall.result.value, 6.3);
assert.equal(humanitarianFundingShortfall.result.grade.letter, 'C');
assert.equal(humanitarianFundingShortfall.result.confidence, 'B');
assert.equal(humanitarianFundingShortfall.result.uncertainty.lower, 5.5);
assert.equal(humanitarianFundingShortfall.result.uncertainty.upper, 7.8);
assert.deepEqual(humanitarianFundingShortfall.candidate.applicableDomains, ['human']);
assert.deepEqual(humanitarianFundingShortfall.candidate.components.human.central, { severity: 2, reach: 3, persistence: 2 });
assert.match(humanitarianFundingShortfall.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /3\.8 million affected people once/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'humanitarian_response_funding_shortfall').criticalFindings.length, 0);
const humanitarianResourceGaps = candidateById.get('humanitarian_resource_gaps');
assert.equal(humanitarianResourceGaps.result.value, 6.3);
assert.equal(humanitarianResourceGaps.result.grade.letter, 'C');
assert.equal(humanitarianResourceGaps.result.confidence, 'B');
assert.equal(humanitarianResourceGaps.result.uncertainty.lower, 5.5);
assert.equal(humanitarianResourceGaps.result.uncertainty.upper, 7.8);
assert.deepEqual(humanitarianResourceGaps.candidate.applicableDomains, ['human']);
assert.deepEqual(humanitarianResourceGaps.candidate.components.human.central, { severity: 2, reach: 3, persistence: 2 });
assert.equal(humanitarianResourceGaps.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(humanitarianResourceGaps.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /never add their scores/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'humanitarian_resource_gaps').criticalFindings.length, 0);
const humanitarianAccessConstraints = candidateById.get('humanitarian_access_constraints');
assert.equal(humanitarianAccessConstraints.result.value, 4.8);
assert.equal(humanitarianAccessConstraints.result.grade.letter, 'C');
assert.equal(humanitarianAccessConstraints.result.confidence, 'B');
assert.equal(humanitarianAccessConstraints.result.uncertainty.lower, 4);
assert.equal(humanitarianAccessConstraints.result.uncertainty.upper, 7.8);
assert.deepEqual(humanitarianAccessConstraints.candidate.applicableDomains, ['human']);
assert.deepEqual(humanitarianAccessConstraints.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.equal(humanitarianAccessConstraints.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(humanitarianAccessConstraints.candidate.decisionTrace.measurementSemantics.reach, /Incidents, townships/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'humanitarian_access_constraints').criticalFindings.length, 0);
const stapleFoodPriceVolatility = candidateById.get('staple_food_price_volatility');
assert.equal(stapleFoodPriceVolatility.result.value, 4.8);
assert.equal(stapleFoodPriceVolatility.result.grade.letter, 'C');
assert.equal(stapleFoodPriceVolatility.result.confidence, 'B');
assert.equal(stapleFoodPriceVolatility.result.uncertainty.lower, 4);
assert.equal(stapleFoodPriceVolatility.result.uncertainty.upper, 7.8);
assert.deepEqual(stapleFoodPriceVolatility.candidate.applicableDomains, ['human']);
assert.deepEqual(stapleFoodPriceVolatility.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.equal(stapleFoodPriceVolatility.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(stapleFoodPriceVolatility.candidate.decisionTrace.measurementSemantics.reach, /Countries.*residents.*excluded/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'staple_food_price_volatility').criticalFindings.length, 0);
const humanitarianSurgeDemand = candidateById.get('humanitarian_surge_demand');
assert.equal(humanitarianSurgeDemand.result.value, 4);
assert.equal(humanitarianSurgeDemand.result.grade.letter, 'B');
assert.equal(humanitarianSurgeDemand.result.confidence, 'C');
assert.equal(humanitarianSurgeDemand.result.uncertainty.lower, 4);
assert.equal(humanitarianSurgeDemand.result.uncertainty.upper, 7.8);
assert.deepEqual(humanitarianSurgeDemand.candidate.applicableDomains, ['human']);
assert.deepEqual(humanitarianSurgeDemand.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 });
assert.equal(humanitarianSurgeDemand.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(humanitarianSurgeDemand.candidate.decisionTrace.measurementSemantics.reach, /Casualties.*beds.*residents.*excluded/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'humanitarian_surge_demand').criticalFindings.length, 0);
const reefStructuralCollapse = candidateById.get('reef_structural_collapse');
assert.equal(reefStructuralCollapse.result.value, 4.8);
assert.equal(reefStructuralCollapse.result.grade.letter, 'C');
assert.equal(reefStructuralCollapse.result.confidence, 'C');
assert.equal(reefStructuralCollapse.result.uncertainty.lower, 4);
assert.equal(reefStructuralCollapse.result.uncertainty.upper, 7.8);
assert.deepEqual(reefStructuralCollapse.candidate.applicableDomains, ['ecosystem']);
assert.equal(reefStructuralCollapse.candidate.components.human.structuralZero, true);
assert.deepEqual(reefStructuralCollapse.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 2 });
assert.equal(reefStructuralCollapse.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(reefStructuralCollapse.candidate.decisionTrace.measurementSemantics.reach, /Quadrats.*heat exposure.*excluded/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'reef_structural_collapse').criticalFindings.length, 0);
const ozoneDepletingSubstanceBurden = candidateById.get('cfc_saturated_layers');
assert.equal(ozoneDepletingSubstanceBurden.result.value, 3.3);
assert.equal(ozoneDepletingSubstanceBurden.result.grade.letter, 'B');
assert.equal(ozoneDepletingSubstanceBurden.result.confidence, 'D');
assert.equal(ozoneDepletingSubstanceBurden.result.uncertainty.lower, 1.8);
assert.equal(ozoneDepletingSubstanceBurden.result.uncertainty.upper, 7);
assert.deepEqual(ozoneDepletingSubstanceBurden.candidate.applicableDomains, ['ecosystem']);
assert.deepEqual(ozoneDepletingSubstanceBurden.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 1 });
assert.equal(ozoneDepletingSubstanceBurden.candidate.causalAllocation.role, 'aggregate_pressure');
assert.match(ozoneDepletingSubstanceBurden.candidate.decisionTrace.measurementSemantics.severity, /not residual halogen concentration/i);
assert(ozoneDepletingSubstanceBurden.candidate.components.ecosystem.evidenceReferences.includes('young_montreal_protocol_terrestrial_carbon_sink_2021'));
assert(ozoneDepletingSubstanceBurden.candidate.components.ecosystem.evidenceReferences.includes('he_antarctic_ozone_trends_2026'));
assert.equal(pass2.nodes.find(row => row.nodeId === 'cfc_saturated_layers').criticalFindings.length, 0);
const ozoneColumnDepletion = candidateById.get('stratospheric_chlorine_sinks');
assert.equal(ozoneColumnDepletion.result.value, 4);
assert.equal(ozoneColumnDepletion.result.grade.letter, 'B');
assert.equal(ozoneColumnDepletion.result.confidence, 'C');
assert.equal(ozoneColumnDepletion.result.uncertainty.lower, 1.8);
assert.equal(ozoneColumnDepletion.result.uncertainty.upper, 7);
assert.deepEqual(ozoneColumnDepletion.candidate.applicableDomains, ['ecosystem']);
assert.deepEqual(ozoneColumnDepletion.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 1 });
assert.equal(ozoneColumnDepletion.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(ozoneColumnDepletion.candidate.decisionTrace.measurementSemantics.persistence, /not the ozone-hole season/i);
assert(ozoneColumnDepletion.candidate.components.ecosystem.evidenceReferences.includes('robinson_extended_ozone_hole_antarctic_biota_2024'));
assert.equal(pass2.nodes.find(row => row.nodeId === 'stratospheric_chlorine_sinks').criticalFindings.length, 0);
const marineFoodWeb = candidateById.get('marine_food_web_simplification');
assert.equal(marineFoodWeb.result.value, 5.5);
assert.equal(marineFoodWeb.result.grade.letter, 'C');
assert.equal(marineFoodWeb.result.confidence, 'C');
assert.equal(marineFoodWeb.result.uncertainty.lower, 4);
assert.equal(marineFoodWeb.result.uncertainty.upper, 7);
assert.deepEqual(marineFoodWeb.candidate.applicableDomains, ['ecosystem']);
assert.equal(marineFoodWeb.candidate.components.human.structuralZero, true);
assert.equal(pass2.nodes.find(row => row.nodeId === 'marine_food_web_simplification').criticalFindings.length, 0);
const arcticAmplification = candidateById.get('arctic_amplification_rates');
assert.equal(arcticAmplification.result.value, 6.3);
assert.equal(arcticAmplification.result.grade.letter, 'C');
assert.equal(arcticAmplification.result.confidence, 'C');
assert.equal(arcticAmplification.result.uncertainty.lower, 4.4);
assert.equal(arcticAmplification.result.uncertainty.upper, 7.8);
assert.deepEqual(arcticAmplification.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(arcticAmplification.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.deepEqual(arcticAmplification.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 4 });
assert.equal(pass2.nodes.find(row => row.nodeId === 'arctic_amplification_rates').criticalFindings.length, 0);
const iceAlbedoFeedback = candidateById.get('ice_albedo_feedback_loops');
assert.equal(iceAlbedoFeedback.result.value, 5.1);
assert.equal(iceAlbedoFeedback.result.grade.letter, 'C');
assert.equal(iceAlbedoFeedback.result.confidence, 'C');
assert.equal(iceAlbedoFeedback.result.uncertainty.lower, 4);
assert.equal(iceAlbedoFeedback.result.uncertainty.upper, 7.4);
assert.deepEqual(iceAlbedoFeedback.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(iceAlbedoFeedback.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(iceAlbedoFeedback.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert.match(iceAlbedoFeedback.candidate.decisionTrace.measurementSemantics.reach, /700 million exposed people/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'ice_albedo_feedback_loops').criticalFindings.length, 0);
const peatOxidation = candidateById.get('peat_oxidation_pulse');
assert.equal(peatOxidation.result.value, 6.3);
assert.equal(peatOxidation.result.grade.letter, 'C');
assert.equal(peatOxidation.result.confidence, 'C');
assert.equal(peatOxidation.result.uncertainty.lower, 4.8);
assert.equal(peatOxidation.result.uncertainty.upper, 7.8);
assert.deepEqual(peatOxidation.candidate.applicableDomains, ['ecosystem']);
assert.equal(peatOxidation.candidate.components.human.structuralZero, true);
assert.deepEqual(peatOxidation.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert.equal(peatOxidation.candidate.causalAllocation.role, 'aggregate_pressure');
assert.match(peatOxidation.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Peatland vegetation degradation/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'peat_oxidation_pulse').criticalFindings.length, 0);
const speciesRangeContraction = candidateById.get('species_range_compression');
assert.equal(speciesRangeContraction.result.value, 5.5);
assert.equal(speciesRangeContraction.result.grade.letter, 'C');
assert.equal(speciesRangeContraction.result.confidence, 'C');
assert.equal(speciesRangeContraction.result.uncertainty.lower, 3.3);
assert.equal(speciesRangeContraction.result.uncertainty.upper, 7.8);
assert.deepEqual(speciesRangeContraction.candidate.applicableDomains, ['ecosystem']);
assert.equal(speciesRangeContraction.candidate.components.human.structuralZero, true);
assert.deepEqual(speciesRangeContraction.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert.match(speciesRangeContraction.candidate.decisionTrace.measurementSemantics.reach, /selected species/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'species_range_compression').criticalFindings.length, 0);
const reservoirStorageInstability = candidateById.get('reservoir_storage_instability');
assert.equal(reservoirStorageInstability.result.value, 4.8);
assert.equal(reservoirStorageInstability.result.grade.letter, 'C');
assert.equal(reservoirStorageInstability.result.confidence, 'C');
assert.equal(reservoirStorageInstability.result.uncertainty.lower, 3.6);
assert.equal(reservoirStorageInstability.result.uncertainty.upper, 7.4);
assert.deepEqual(reservoirStorageInstability.candidate.components.human.central, { severity: 1, reach: 1, persistence: 3 });
assert.deepEqual(reservoirStorageInstability.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 3 });
assert.match(reservoirStorageInstability.candidate.decisionTrace.measurementSemantics.reach, /threatened supply/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'reservoir_storage_instability').criticalFindings.length, 0);
const oldGrowthForestLogging = candidateById.get('old_growth_forest_logging');
assert.equal(oldGrowthForestLogging.result.value, 4.8);
assert.equal(oldGrowthForestLogging.result.grade.letter, 'C');
assert.equal(oldGrowthForestLogging.result.confidence, 'C');
assert.equal(oldGrowthForestLogging.result.uncertainty.lower, 2.9);
assert.equal(oldGrowthForestLogging.result.uncertainty.upper, 7.4);
assert.deepEqual(oldGrowthForestLogging.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(oldGrowthForestLogging.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 3 });
assert.match(oldGrowthForestLogging.candidate.decisionTrace.measurementSemantics.reach, /sampled-taxon share.*excluded/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'old_growth_forest_logging').criticalFindings.length, 0);
const iceSheetMassLoss = candidateById.get('ice_sheet_mass_loss');
assert.equal(iceSheetMassLoss.result.value, 5.1);
assert.equal(iceSheetMassLoss.result.grade.letter, 'C');
assert.equal(iceSheetMassLoss.result.confidence, 'C');
assert.equal(iceSheetMassLoss.result.uncertainty.lower, 3.3);
assert.equal(iceSheetMassLoss.result.uncertainty.upper, 7.4);
assert.deepEqual(iceSheetMassLoss.candidate.components.human.central, { severity: 1, reach: 1, persistence: 3 });
assert.deepEqual(iceSheetMassLoss.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 3 });
assert.match(iceSheetMassLoss.candidate.decisionTrace.measurementSemantics.reach, /satellite coverage.*excluded/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'ice_sheet_mass_loss').criticalFindings.length, 0);
const blueCarbonHabitatLoss = candidateById.get('blue_carbon_habitat_loss');
assert.equal(blueCarbonHabitatLoss.result.value, 5.9);
assert.equal(blueCarbonHabitatLoss.result.grade.letter, 'C');
assert.equal(blueCarbonHabitatLoss.result.confidence, 'B');
assert.equal(blueCarbonHabitatLoss.result.uncertainty.lower, 3.6);
assert.equal(blueCarbonHabitatLoss.result.uncertainty.upper, 7.8);
assert.deepEqual(blueCarbonHabitatLoss.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(blueCarbonHabitatLoss.candidate.components.ecosystem.central, { severity: 4, reach: 2, persistence: 3 });
assert.match(blueCarbonHabitatLoss.candidate.decisionTrace.measurementSemantics.reach, /not added/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'blue_carbon_habitat_loss').criticalFindings.length, 0);
const palmOil = candidateById.get('palm_oil_canopy_clearance');
assert.equal(palmOil.result.value, 6.3);
assert.equal(palmOil.result.grade.letter, 'C');
assert.equal(palmOil.result.confidence, 'B');
assert.equal(palmOil.result.uncertainty.lower, 4.8);
assert.equal(palmOil.result.uncertainty.upper, 7.8);
assert.deepEqual(palmOil.candidate.applicableDomains, ['ecosystem']);
assert.equal(pass2.nodes.find(row => row.nodeId === 'palm_oil_canopy_clearance').criticalFindings.length, 0);
const avalanche = candidateById.get('mountain_pass_avalanches');
assert.equal(avalanche.result.value, 4);
assert.equal(avalanche.result.grade.letter, 'B');
assert.equal(avalanche.candidate.components.human.central.reach, 1);
assert.equal(pass2.nodes.find(row => row.nodeId === 'mountain_pass_avalanches').criticalFindings.length, 0);
const damDiversion = candidateById.get('dam_and_diversion_infrastructure');
assert.equal(damDiversion.result.value, 6.6);
assert.equal(damDiversion.result.grade.letter, 'D');
assert.equal(damDiversion.candidate.components.human.central.reach, 2);
assert.equal(damDiversion.candidate.components.ecosystem.central.reach, 3);
assert.equal(pass2.nodes.find(row => row.nodeId === 'dam_and_diversion_infrastructure').criticalFindings.length, 0);
const portBottleneck = candidateById.get('supply_chain_port_bottlenecks');
assert.equal(portBottleneck.result.value, 4);
assert.equal(portBottleneck.result.grade.letter, 'B');
assert.equal(portBottleneck.result.confidence, 'B');
assert.deepEqual(portBottleneck.candidate.applicableDomains, ['human']);
assert.equal(portBottleneck.candidate.components.ecosystem.structuralZero, true);
assert.equal(pass2.nodes.find(row => row.nodeId === 'supply_chain_port_bottlenecks').criticalFindings.length, 0);
const urbanHeatIsland = candidateById.get('urban_heat_island');
assert.equal(urbanHeatIsland.result.value, 7.8);
assert.equal(urbanHeatIsland.result.grade.letter, 'D');
assert.equal(urbanHeatIsland.result.confidence, 'B');
assert.deepEqual(urbanHeatIsland.candidate.applicableDomains, ['human']);
assert.equal(urbanHeatIsland.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(urbanHeatIsland.candidate.components.human.central, { severity: 3, reach: 2, persistence: 4 });
assert.equal(pass2.nodes.find(row => row.nodeId === 'urban_heat_island').criticalFindings.length, 0);
const troposphericOzone = candidateById.get('tropospheric_ozone');
assert.equal(troposphericOzone.result.value, 8.5);
assert.equal(troposphericOzone.result.grade.letter, 'E');
assert.equal(troposphericOzone.result.confidence, 'B');
assert.equal(troposphericOzone.result.uncertainty.lower, 8.5);
assert.equal(troposphericOzone.result.uncertainty.upper, 8.5);
assert.deepEqual(troposphericOzone.candidate.applicableDomains, ['human']);
assert.deepEqual(troposphericOzone.candidate.components.human.central, { severity: 4, reach: 2, persistence: 4 });
assert.equal(troposphericOzone.candidate.components.ecosystem.structuralZero, true);
assert.equal(pass2.nodes.find(row => row.nodeId === 'tropospheric_ozone').criticalFindings.length, 0);
const wildfireRegimeShift = candidateById.get('wildfire_regime_shift');
assert.equal(wildfireRegimeShift.result.value, 7);
assert.equal(wildfireRegimeShift.result.grade.letter, 'D');
assert.equal(wildfireRegimeShift.result.confidence, 'B');
assert.equal(wildfireRegimeShift.result.uncertainty.lower, 5.9);
assert.equal(wildfireRegimeShift.result.uncertainty.upper, 8.1);
assert.deepEqual(wildfireRegimeShift.candidate.components.human.central, { severity: 4, reach: 2, persistence: 4 });
assert.deepEqual(wildfireRegimeShift.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert.equal(pass2.nodes.find(row => row.nodeId === 'wildfire_regime_shift').criticalFindings.length, 0);
const forestFragmentation = candidateById.get('forest_fragmentation');
assert.equal(forestFragmentation.result.value, 6.3);
assert.equal(forestFragmentation.result.grade.letter, 'C');
assert.equal(forestFragmentation.result.confidence, 'B');
assert.equal(forestFragmentation.result.uncertainty.lower, 4.8);
assert.equal(forestFragmentation.result.uncertainty.upper, 7.8);
assert.deepEqual(forestFragmentation.candidate.applicableDomains, ['ecosystem']);
assert.equal(forestFragmentation.candidate.components.human.structuralZero, true);
assert.deepEqual(forestFragmentation.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert.match(forestFragmentation.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /10–17% diversity contrasts enter severity only/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'forest_fragmentation').criticalFindings.length, 0);
const bridgeScour = candidateById.get('bridge_scour_exposure');
assert.equal(bridgeScour.result.value, 3.3);
assert.equal(bridgeScour.result.grade.letter, 'B');
assert.equal(bridgeScour.result.confidence, 'C');
assert.equal(bridgeScour.result.uncertainty.lower, 1);
assert.equal(bridgeScour.result.uncertainty.upper, 5.5);
assert.deepEqual(bridgeScour.candidate.applicableDomains, ['human']);
assert.equal(bridgeScour.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(bridgeScour.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.match(bridgeScour.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Traffic crossings do not enter reach/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'bridge_scour_exposure').criticalFindings.length, 0);
const coastalGroundwaterWithdrawal = candidateById.get('coastal_groundwater_withdrawal');
assert.equal(coastalGroundwaterWithdrawal.result.value, 6.3);
assert.equal(coastalGroundwaterWithdrawal.result.grade.letter, 'C');
assert.equal(coastalGroundwaterWithdrawal.result.confidence, 'C');
assert.equal(coastalGroundwaterWithdrawal.result.uncertainty.lower, 4.8);
assert.equal(coastalGroundwaterWithdrawal.result.uncertainty.upper, 7.4);
assert.deepEqual(coastalGroundwaterWithdrawal.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(coastalGroundwaterWithdrawal.candidate.components.human.central, { severity: 2, reach: 2, persistence: 4 });
assert.deepEqual(coastalGroundwaterWithdrawal.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert.match(coastalGroundwaterWithdrawal.candidate.decisionTrace.measurementSemantics.reach, /Accounts, wells, aquifers, communities.*not added as people/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'coastal_groundwater_withdrawal').criticalFindings.length, 0);
const floodplainExposure = candidateById.get('floodplain_exposure');
assert.equal(floodplainExposure.result.value, 3.3);
assert.equal(floodplainExposure.result.grade.letter, 'B');
assert.equal(floodplainExposure.result.confidence, 'C');
assert.equal(floodplainExposure.result.uncertainty.lower, 1);
assert.equal(floodplainExposure.result.uncertainty.upper, 5.5);
assert.deepEqual(floodplainExposure.candidate.applicableDomains, ['human']);
assert.equal(floodplainExposure.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(floodplainExposure.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.match(floodplainExposure.candidate.decisionTrace.measurementSemantics.reach, /Modeled exposure.*risk-state context/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'floodplain_exposure').criticalFindings.length, 0);
const urbanization = candidateById.get('urbanization');
assert.equal(urbanization.result.value, 5.1);
assert.equal(urbanization.result.grade.letter, 'C');
assert.equal(urbanization.result.confidence, 'C');
assert.equal(urbanization.result.uncertainty.lower, 2.9);
assert.equal(urbanization.result.uncertainty.upper, 7.8);
assert.deepEqual(urbanization.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(urbanization.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(urbanization.candidate.components.ecosystem.central, { severity: 3, reach: 1, persistence: 3 });
assert.match(urbanization.candidate.decisionTrace.measurementSemantics.reach, /not residents/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'urbanization').criticalFindings.length, 0);
const groundwaterDepletion = candidateById.get('groundwater_depletion_wells');
assert.equal(groundwaterDepletion.result.value, 5.1);
assert.equal(groundwaterDepletion.result.grade.letter, 'C');
assert.equal(groundwaterDepletion.result.confidence, 'C');
assert.equal(groundwaterDepletion.result.uncertainty.lower, 2.9);
assert.equal(groundwaterDepletion.result.uncertainty.upper, 7.8);
assert.deepEqual(groundwaterDepletion.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(groundwaterDepletion.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(groundwaterDepletion.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert.match(groundwaterDepletion.candidate.decisionTrace.measurementSemantics.reach, /75%.*study countries.*not 75%.*harmed/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'groundwater_depletion_wells').criticalFindings.length, 0);
const desalinationDependence = candidateById.get('desalination_dependence');
assert.equal(desalinationDependence.result.value, 4);
assert.equal(desalinationDependence.result.grade.letter, 'B');
assert.equal(desalinationDependence.result.confidence, 'C');
assert.equal(desalinationDependence.result.uncertainty.lower, 2.1);
assert.equal(desalinationDependence.result.uncertainty.upper, 6.3);
assert.deepEqual(desalinationDependence.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(desalinationDependence.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.deepEqual(desalinationDependence.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 2 });
assert.match(desalinationDependence.candidate.decisionTrace.measurementSemantics.reach, /not people supplied/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'desalination_dependence').criticalFindings.length, 0);
const gasPowerDependence = candidateById.get('gas_power_dependence');
assert.equal(gasPowerDependence.result.value, 3.3);
assert.equal(gasPowerDependence.result.grade.letter, 'B');
assert.equal(gasPowerDependence.result.confidence, 'C');
assert.equal(gasPowerDependence.result.uncertainty.lower, 1);
assert.equal(gasPowerDependence.result.uncertainty.upper, 5.5);
assert.deepEqual(gasPowerDependence.candidate.applicableDomains, ['human']);
assert.equal(gasPowerDependence.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(gasPowerDependence.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.match(gasPowerDependence.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /carbon emissions.*remain with their own nodes/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'gas_power_dependence').criticalFindings.length, 0);
const hydropowerReliability = candidateById.get('hydropower_reliability_decline');
assert.equal(hydropowerReliability.result.value, 4.8);
assert.equal(hydropowerReliability.result.grade.letter, 'C');
assert.equal(hydropowerReliability.result.confidence, 'C');
assert.equal(hydropowerReliability.result.uncertainty.lower, 3.3);
assert.equal(hydropowerReliability.result.uncertainty.upper, 7);
assert.deepEqual(hydropowerReliability.candidate.applicableDomains, ['human']);
assert.equal(hydropowerReliability.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(hydropowerReliability.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.match(hydropowerReliability.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /dam and river ecology.*remain with their own nodes/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'hydropower_reliability_decline').criticalFindings.length, 0);
const fishLandingSupplyDisruption = candidateById.get('fish_landing_supply_disruption');
assert.equal(fishLandingSupplyDisruption.result.value, 4.8);
assert.equal(fishLandingSupplyDisruption.result.grade.letter, 'C');
assert.equal(fishLandingSupplyDisruption.result.confidence, 'C');
assert.equal(fishLandingSupplyDisruption.result.uncertainty.lower, 3.3);
assert.equal(fishLandingSupplyDisruption.result.uncertainty.upper, 5.5);
assert.deepEqual(fishLandingSupplyDisruption.candidate.applicableDomains, ['human']);
assert.equal(fishLandingSupplyDisruption.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(fishLandingSupplyDisruption.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.match(fishLandingSupplyDisruption.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Fish-stock condition.*remain with their own nodes/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'fish_landing_supply_disruption').criticalFindings.length, 0);
const fisheryProteinDependence = candidateById.get('fishery_protein_dependence');
assert.equal(fisheryProteinDependence.result.value, 3.3);
assert.equal(fisheryProteinDependence.result.grade.letter, 'B');
assert.equal(fisheryProteinDependence.result.confidence, 'C');
assert.equal(fisheryProteinDependence.result.uncertainty.lower, 1);
assert.equal(fisheryProteinDependence.result.uncertainty.upper, 5.5);
assert.deepEqual(fisheryProteinDependence.candidate.applicableDomains, ['human']);
assert.equal(fisheryProteinDependence.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(fisheryProteinDependence.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.match(fisheryProteinDependence.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /dependency count establishes exposure once/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'fishery_protein_dependence').criticalFindings.length, 0);
const basinTreatyBreakdown = candidateById.get('basin_treaty_breakdown');
assert.equal(basinTreatyBreakdown.result.value, 3.3);
assert.equal(basinTreatyBreakdown.result.grade.letter, 'B');
assert.equal(basinTreatyBreakdown.result.confidence, 'C');
assert.equal(basinTreatyBreakdown.result.uncertainty.lower, 1);
assert.equal(basinTreatyBreakdown.result.uncertainty.upper, 5.5);
assert.deepEqual(basinTreatyBreakdown.candidate.applicableDomains, ['human']);
assert.equal(basinTreatyBreakdown.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(basinTreatyBreakdown.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.match(basinTreatyBreakdown.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /41% basin-area gap establishes institutional context once/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'basin_treaty_breakdown').criticalFindings.length, 0);
const migration = candidateById.get('migration');
assert.equal(migration.result.value, 6.3);
assert.equal(migration.result.grade.letter, 'C');
assert.equal(migration.result.confidence, 'C');
assert.equal(migration.result.uncertainty.lower, 4);
assert.equal(migration.result.uncertainty.upper, 7.8);
assert.deepEqual(migration.candidate.applicableDomains, ['human']);
assert.equal(migration.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(migration.candidate.components.human.central, { severity: 2, reach: 3, persistence: 2 });
assert.match(migration.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /29,900,000 annual movements are recurrence context/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'migration').criticalFindings.length, 0);
const subseaCableLanding = candidateById.get('subsea_cable_landing_chokepoint');
assert.equal(subseaCableLanding.result.value, 4);
assert.equal(subseaCableLanding.result.grade.letter, 'B');
assert.equal(subseaCableLanding.result.confidence, 'C');
assert.equal(subseaCableLanding.result.uncertainty.lower, 3.3);
assert.equal(subseaCableLanding.result.uncertainty.upper, 6.3);
assert.deepEqual(subseaCableLanding.candidate.applicableDomains, ['human']);
assert.equal(subseaCableLanding.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(subseaCableLanding.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 });
assert.match(subseaCableLanding.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /150–200 annual faults.*add no axis points/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'subsea_cable_landing_chokepoint').criticalFindings.length, 0);
const invasiveSpecies = candidateById.get('invasive_species_encroachment');
assert.equal(invasiveSpecies.result.value, 7.8);
assert.equal(invasiveSpecies.result.grade.letter, 'D');
assert.equal(invasiveSpecies.result.confidence, 'B');
assert.deepEqual(invasiveSpecies.candidate.components.human.central, { severity: 2, reach: 2, persistence: 3 });
assert.deepEqual(invasiveSpecies.candidate.components.ecosystem.central, { severity: 4, reach: 3, persistence: 4 });
assert.equal(pass2.nodes.find(row => row.nodeId === 'invasive_species_encroachment').criticalFindings.length, 0);
const agriculturalDemand = candidateById.get('food');
assert.equal(agriculturalDemand.result.value, 5.5);
assert.equal(agriculturalDemand.result.grade.letter, 'C');
assert.equal(agriculturalDemand.result.confidence, 'B');
assert.equal(agriculturalDemand.result.uncertainty.lower, 4);
assert.equal(agriculturalDemand.result.uncertainty.upper, 7.8);
assert.deepEqual(agriculturalDemand.candidate.applicableDomains, ['ecosystem']);
assert.equal(agriculturalDemand.candidate.components.human.structuralZero, true);
assert.deepEqual(agriculturalDemand.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 3 });
assert.match(agriculturalDemand.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /1\.4%.*enters ecosystem severity once/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'food').criticalFindings.length, 0);
const managedRetreat = candidateById.get('managed_retreat_pressure');
assert.equal(managedRetreat.result.value, 5.5);
assert.equal(managedRetreat.result.grade.letter, 'C');
assert.equal(managedRetreat.result.confidence, 'B');
assert.equal(managedRetreat.result.uncertainty.lower, 4);
assert.equal(managedRetreat.result.uncertainty.upper, 7);
assert.deepEqual(managedRetreat.candidate.applicableDomains, ['human']);
assert.equal(managedRetreat.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(managedRetreat.candidate.components.human.central, { severity: 2, reach: 1, persistence: 3 });
assert.match(managedRetreat.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /69,415 historical acquisitions establish context only/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'managed_retreat_pressure').criticalFindings.length, 0);
const foodWaste = candidateById.get('food_waste');
assert.equal(foodWaste.result.value, 3.6);
assert.equal(foodWaste.result.grade.letter, 'B');
assert.equal(foodWaste.result.confidence, 'B');
assert.equal(foodWaste.result.uncertainty.lower, 2.9);
assert.equal(foodWaste.result.uncertainty.upper, 5.1);
assert.deepEqual(foodWaste.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(foodWaste.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 });
assert.deepEqual(foodWaste.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 1 });
assert.match(foodWaste.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /One billion meals is not people harmed/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'food_waste').criticalFindings.length, 0);
const oceanHeatContent = candidateById.get('ocean_heat_content');
assert.equal(oceanHeatContent.result.value, 6.3);
assert.equal(oceanHeatContent.result.grade.letter, 'C');
assert.equal(oceanHeatContent.result.confidence, 'B');
assert.equal(oceanHeatContent.result.uncertainty.lower, 4);
assert.equal(oceanHeatContent.result.uncertainty.upper, 8.1);
assert.deepEqual(oceanHeatContent.candidate.components.human.central, { severity: 2, reach: 2, persistence: 2 });
assert.deepEqual(oceanHeatContent.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 3 });
assert.equal(oceanHeatContent.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(oceanHeatContent.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /connected nodes remain separate ratings/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'ocean_heat_content').criticalFindings.length, 0);
const oceanCarbonUptake = candidateById.get('ocean_carbon_uptake_weakening');
assert.equal(oceanCarbonUptake.result.value, 5.5);
assert.equal(oceanCarbonUptake.result.grade.letter, 'C');
assert.equal(oceanCarbonUptake.result.confidence, 'B');
assert.equal(oceanCarbonUptake.result.uncertainty.lower, 4);
assert.equal(oceanCarbonUptake.result.uncertainty.upper, 7.8);
assert.deepEqual(oceanCarbonUptake.candidate.applicableDomains, ['ecosystem']);
assert.equal(oceanCarbonUptake.candidate.components.human.structuralZero, true);
assert.deepEqual(oceanCarbonUptake.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 3 });
assert.equal(oceanCarbonUptake.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(oceanCarbonUptake.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /7\.1% counterfactual reduction enters ecosystem severity once/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'ocean_carbon_uptake_weakening').criticalFindings.length, 0);
const phytoplanktonDecline = candidateById.get('phytoplankton_decline');
assert.equal(phytoplanktonDecline.result.value, 5.5);
assert.equal(phytoplanktonDecline.result.grade.letter, 'C');
assert.equal(phytoplanktonDecline.result.confidence, 'B');
assert.equal(phytoplanktonDecline.result.uncertainty.lower, 4.8);
assert.equal(phytoplanktonDecline.result.uncertainty.upper, 7);
assert.deepEqual(phytoplanktonDecline.candidate.applicableDomains, ['ecosystem']);
assert.equal(phytoplanktonDecline.candidate.components.human.structuralZero, true);
assert.deepEqual(phytoplanktonDecline.candidate.components.ecosystem.central, { severity: 1, reach: 3, persistence: 2 });
assert.equal(phytoplanktonDecline.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(phytoplanktonDecline.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /48% declining ocean area enters reach once/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'phytoplankton_decline').criticalFindings.length, 0);
const riverFragmentation = candidateById.get('riverine_habitat_fragmentation');
assert.equal(riverFragmentation.result.value, 7);
assert.equal(riverFragmentation.result.grade.letter, 'D');
assert.equal(riverFragmentation.result.confidence, 'C');
assert.equal(riverFragmentation.result.uncertainty.lower, 5.5);
assert.equal(riverFragmentation.result.uncertainty.upper, 8.5);
assert.deepEqual(riverFragmentation.candidate.applicableDomains, ['ecosystem']);
assert.equal(riverFragmentation.candidate.components.human.structuralZero, true);
assert.deepEqual(riverFragmentation.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 3 });
assert.equal(riverFragmentation.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(riverFragmentation.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /one-to-eleven-year post-removal response informs persistence/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'riverine_habitat_fragmentation').criticalFindings.length, 0);
const harmfulAlgalBlooms = candidateById.get('harmful_algal_blooms');
assert.equal(harmfulAlgalBlooms.result.value, 5.5);
assert.equal(harmfulAlgalBlooms.result.grade.letter, 'C');
assert.equal(harmfulAlgalBlooms.result.confidence, 'C');
assert.equal(harmfulAlgalBlooms.result.uncertainty.lower, 3.6);
assert.equal(harmfulAlgalBlooms.result.uncertainty.upper, 7.4);
assert.deepEqual(harmfulAlgalBlooms.candidate.components.human.central, { severity: 2, reach: 2, persistence: 2 });
assert.deepEqual(harmfulAlgalBlooms.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert.match(harmfulAlgalBlooms.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /9,503 reports.*do not add points/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'harmful_algal_blooms').criticalFindings.length, 0);
const rapidRunoffResponse = candidateById.get('hydrological_runoff_surges');
assert.equal(rapidRunoffResponse.result.value, 4.8);
assert.equal(rapidRunoffResponse.result.grade.letter, 'C');
assert.equal(rapidRunoffResponse.result.confidence, 'C');
assert.equal(rapidRunoffResponse.result.uncertainty.lower, 2.9);
assert.equal(rapidRunoffResponse.result.uncertainty.upper, 7);
assert.deepEqual(rapidRunoffResponse.candidate.components.human.central, { severity: 3, reach: 3, persistence: 1 });
assert.deepEqual(rapidRunoffResponse.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 1 });
assert.match(rapidRunoffResponse.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /satellite exposure/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'hydrological_runoff_surges').criticalFindings.length, 0);
const tundraMethane = candidateById.get('tundra_methane_outgassing');
assert.equal(tundraMethane.result.value, 6.6);
assert.equal(tundraMethane.result.grade.letter, 'D');
assert.equal(tundraMethane.result.confidence, 'D');
assert.equal(tundraMethane.result.uncertainty.lower, 4.4);
assert.equal(tundraMethane.result.uncertainty.upper, 8.9);
assert.deepEqual([tundraMethane.candidate.currentWindow.start, tundraMethane.candidate.currentWindow.end], [2010, 2021]);
assert.equal(tundraMethane.candidate.causalAllocation.attributionStatus, 'unresolved');
assert.equal(tundraMethane.candidate.causalAllocation.inheritsAggregateScore, false);
assert.match(tundraMethane.candidate.history.currentState, /broad regional total.*not assigned wholly to tundra outgassing/i);
assert.match(tundraMethane.candidate.decisionTrace.measurementSemantics.severity, /Gross Tg CH4 is a physical input only/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'tundra_methane_outgassing').criticalFindings.length, 0);
const riverFlowRegimeShift = candidateById.get('river_flow_regime_shift');
assert.equal(riverFlowRegimeShift.result.value, 4);
assert.equal(riverFlowRegimeShift.result.grade.letter, 'B');
assert.equal(riverFlowRegimeShift.result.confidence, 'C');
assert.equal(riverFlowRegimeShift.result.uncertainty.lower, 1.8);
assert.equal(riverFlowRegimeShift.result.uncertainty.upper, 7);
assert.deepEqual(riverFlowRegimeShift.candidate.applicableDomains, ['ecosystem']);
assert.equal(riverFlowRegimeShift.candidate.components.human.structuralZero, true);
assert.deepEqual(riverFlowRegimeShift.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 1 });
assert.match(riverFlowRegimeShift.candidate.decisionTrace.measurementSemantics.reach, /river length or ecosystem distribution/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'river_flow_regime_shift').criticalFindings.length, 0);
const tidalWetlandCarbonReversal = candidateById.get('tidal_wetland_carbon_reversal');
assert.equal(tidalWetlandCarbonReversal.result.value, 7);
assert.equal(tidalWetlandCarbonReversal.result.grade.letter, 'D');
assert.equal(tidalWetlandCarbonReversal.result.confidence, 'B');
assert.equal(tidalWetlandCarbonReversal.result.uncertainty.lower, 4);
assert.equal(tidalWetlandCarbonReversal.result.uncertainty.upper, 10);
assert.deepEqual(tidalWetlandCarbonReversal.candidate.applicableDomains, ['ecosystem']);
assert.equal(tidalWetlandCarbonReversal.candidate.components.human.structuralZero, true);
assert.deepEqual(tidalWetlandCarbonReversal.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 3 });
assert.match(tidalWetlandCarbonReversal.candidate.decisionTrace.axisBasis.ecosystem.reach.basis, /29\.0% and 20\.7% of the union mapped wetland distribution/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'tidal_wetland_carbon_reversal').criticalFindings.length, 0);
const urbanTreeCanopyLoss = candidateById.get('urban_tree_canopy_loss');
assert.equal(urbanTreeCanopyLoss.result.value, 4.8);
assert.equal(urbanTreeCanopyLoss.result.grade.letter, 'C');
assert.equal(urbanTreeCanopyLoss.result.confidence, 'C');
assert.equal(urbanTreeCanopyLoss.result.uncertainty.lower, 2.5);
assert.equal(urbanTreeCanopyLoss.result.uncertainty.upper, 7);
assert.deepEqual(urbanTreeCanopyLoss.candidate.applicableDomains, ['ecosystem']);
assert.equal(urbanTreeCanopyLoss.candidate.components.human.structuralZero, true);
assert.deepEqual(urbanTreeCanopyLoss.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 3 });
assert.match(urbanTreeCanopyLoss.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /hypothetical complete-loss counterfactual/i);
assert.equal(pass2.nodes.find(row => row.nodeId === 'urban_tree_canopy_loss').criticalFindings.length, 0);
for (const response of catalogue.responses) {
  assert.equal(response.result.status, 'not_applicable', response.nodeId);
  assert.equal(response.result.value, null, response.nodeId);
  assert.equal(response.result.grade, null, response.nodeId);
}

console.log('TULIP double audit passed: all 381 catalogue records reproduce, all 354 issue traces pass critical checks, response exclusions hold, and grade-instability findings remain explicit.');
