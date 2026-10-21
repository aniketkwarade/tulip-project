import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const [review, mediumReview, allReview, combined, registry, progress, firstPass, endpointPilot] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/internal-high-priority-second-pass.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-medium-priority-second-pass.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-all-node-second-pass.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json'),
  json('public/tulip-assessments.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-assessment-progress.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-all-node-first-pass-candidates.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-emission-source-endpoint-pilot.json'),
]);

assert.equal(review.counts.highPriorityReviewed, 154);
assert.equal(review.reviews.length, 154);
assert.equal(new Set(review.reviews.map(row => row.nodeId)).size, 154);
assert.equal(review.counts.detailedEvidenceReviews, 154);
assert.equal(review.counts.remainingMediumPriority, 0);
assert.equal(mediumReview.counts.mediumPriorityReviewed, 200);
assert.equal(mediumReview.counts.detailedEvidenceReviews, 200);
assert.equal(mediumReview.reviews.length, 200);
assert.equal(allReview.counts.allIssueNodesReviewed, 354);
assert.equal(allReview.counts.remainingSecondPass, 0);
assert.equal(allReview.reviews.length, 354);
assert.equal(new Set(allReview.reviews.map(row => row.nodeId)).size, 354);
assert.equal(allReview.reviewVersion, 'tulip_internal_catalogue_review_2026_09_27_v131');
assert.equal(allReview.counts.detailedEvidenceReviews, 354);
assert.equal(allReview.counts.blindStructuredReclassifications, 0);
assert.equal(allReview.counts.pilotEvidenceAdjudications, 0);
assert.equal(review.productionRatingsEnabled, 0);
assert.equal(combined.issues.length, 354);
assert.equal(combined.responses.length, 27);
assert(combined.issues.every(row => row.reviewPriority === 'reviewed'));
assert.equal(progress.nodeReviewsCompleted, 354);
assert.equal(progress.issueNodesAwaitingSecondPass, 0);

for (const row of review.reviews) {
  assert.equal(row.reviewed.result.status, 'internal_candidate', row.nodeId);
  assert(Number.isFinite(row.reviewed.result.value), row.nodeId);
  assert(['A', 'B', 'C', 'D', 'E'].includes(row.reviewed.result.grade.letter), row.nodeId);
  assert(row.reviewed.result.uncertainty.lower <= row.reviewed.result.value, row.nodeId);
  assert(row.reviewed.result.value <= row.reviewed.result.uncertainty.upper, row.nodeId);
  assert.equal(row.reviewed.candidate.sourceDigest, registry.records[row.nodeId].sourceDigest, row.nodeId);
  assert.equal(row.reviewed.candidate.decisionTrace.blindToFirstPassDuringClassification, true, row.nodeId);
  assert.equal(row.reviewed.candidate.decisionTrace.firstPassRevealedAfterClassification, true, row.nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.evidenceRules, /prohibited/i, row.nodeId);
  for (const prohibited of ['baseValue', 'impactScore', 'vector', 'graphDegree', 'sourceCount']) {
    assert.equal(row.reviewed.candidate[prohibited], undefined, `${row.nodeId}: ${prohibited}`);
  }
}

const byId = new Map(review.reviews.map(row => [row.nodeId, row]));
const lightningFireWeather = byId.get('lightning_fire_weather');
assert.equal(lightningFireWeather.reviewMode, 'detailed_evidence_review');
assert.equal(lightningFireWeather.reviewed.result.value, 6.3);
assert.equal(lightningFireWeather.reviewed.result.grade.letter, 'C');
assert.equal(lightningFireWeather.reviewed.result.uncertainty.lower, 5.1);
assert.equal(lightningFireWeather.reviewed.result.uncertainty.upper, 7.8);
assert.equal(lightningFireWeather.reviewed.result.confidence, 'C');
assert.equal(lightningFireWeather.oldEvidenceOpen, true);
assert.equal(lightningFireWeather.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2020);
assert.deepEqual(lightningFireWeather.reviewed.candidate.components.human.central, { severity: 4, reach: 1, persistence: 4 });
assert.deepEqual(lightningFireWeather.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 2 });
assert.match(lightningFireWeather.finding, /26 direct fatalities/i);
assert.match(lightningFireWeather.finding, /burned area do not become/i);
const mobileWireless = byId.get('mobile_wireless_networks');
assert.equal(mobileWireless.reviewMode, 'detailed_evidence_review');
assert.equal(mobileWireless.reviewed.result.value, 5.5);
assert.equal(mobileWireless.reviewed.result.grade.letter, 'C');
assert.equal(mobileWireless.reviewed.result.uncertainty.lower, 3.3);
assert.equal(mobileWireless.reviewed.result.uncertainty.upper, 7);
assert.equal(mobileWireless.reviewed.result.confidence, 'C');
assert.equal(mobileWireless.oldEvidenceOpen, true);
assert.deepEqual(mobileWireless.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(mobileWireless.reviewed.candidate.components.human.central, { severity: 3, reach: 1, persistence: 2 });
assert.equal(mobileWireless.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.match(mobileWireless.finding, /site percentages.*do not become unique harmed reach/i);
const inlandWaterwaySpill = byId.get('inland_waterway_fuel_spills');
assert.equal(inlandWaterwaySpill.reviewMode, 'detailed_evidence_review');
assert.equal(inlandWaterwaySpill.reviewed.result.value, 4.4);
assert.equal(inlandWaterwaySpill.reviewed.result.grade.letter, 'B');
assert.equal(inlandWaterwaySpill.reviewed.result.uncertainty.lower, 2.5);
assert.equal(inlandWaterwaySpill.reviewed.result.uncertainty.upper, 5.9);
assert.equal(inlandWaterwaySpill.reviewed.result.confidence, 'C');
assert.equal(inlandWaterwaySpill.oldEvidenceOpen, true);
assert.deepEqual(inlandWaterwaySpill.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 });
assert.deepEqual(inlandWaterwaySpill.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 2 });
assert.match(inlandWaterwaySpill.finding, /320 symptomatic people/i);
assert.match(inlandWaterwaySpill.finding, /no longer inflate multiple axes/i);
const monsoonVolatility = byId.get('monsoon_volatility');
assert.equal(monsoonVolatility.reviewMode, 'detailed_evidence_review');
assert.equal(monsoonVolatility.reviewed.result.value, 6.6);
assert.equal(monsoonVolatility.reviewed.result.grade.letter, 'D');
assert.equal(monsoonVolatility.reviewed.result.uncertainty.lower, 4);
assert.equal(monsoonVolatility.reviewed.result.uncertainty.upper, 8.1);
assert.equal(monsoonVolatility.reviewed.result.confidence, 'C');
assert.equal(monsoonVolatility.oldEvidenceOpen, true);
assert.deepEqual(monsoonVolatility.reviewed.candidate.components.human.central, { severity: 4, reach: 3, persistence: 4 });
assert.deepEqual(monsoonVolatility.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 1 });
assert.match(monsoonVolatility.finding, /5\.4 million affected people and 433 deaths/i);
assert.match(monsoonVolatility.finding, /displacement is a subset/i);
const shellCalcification = byId.get('shell_calcification_failures');
assert.equal(shellCalcification.reviewMode, 'detailed_evidence_review');
assert.equal(shellCalcification.reviewed.result.value, 5.9);
assert.equal(shellCalcification.reviewed.result.grade.letter, 'C');
assert.equal(shellCalcification.reviewed.result.uncertainty.lower, 3.6);
assert.equal(shellCalcification.reviewed.result.uncertainty.upper, 7.8);
assert.equal(shellCalcification.reviewed.result.confidence, 'C');
assert.equal(shellCalcification.reviewed.candidate.currentWindow.start, 2020);
assert.equal(shellCalcification.reviewed.candidate.currentWindow.end, 2024);
assert.equal(shellCalcification.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2025);
assert.equal(shellCalcification.oldEvidenceOpen, false);
assert.deepEqual(shellCalcification.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.deepEqual(shellCalcification.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 3 });
assert(shellCalcification.reviewed.candidate.components.ecosystem.evidenceReferences.includes('findlay_ocean_acidification_boundary_2025'));
assert(shellCalcification.reviewed.candidate.components.human.evidenceReferences.includes('lewis_smith_pacific_shellfish_adaptation_2025'));
assert.match(shellCalcification.finding, /two affected production seasons as two harmed people/i);
assert.match(shellCalcification.finding, /hatchery-supply share as global ecosystem reach/i);
const urbanSprawl = byId.get('urban_sprawl_housing');
assert.equal(urbanSprawl.reviewMode, 'detailed_evidence_review');
assert.equal(urbanSprawl.reviewed.result.value, 5.5);
assert.equal(urbanSprawl.reviewed.result.grade.letter, 'C');
assert.equal(urbanSprawl.reviewed.result.uncertainty.lower, 3.3);
assert.equal(urbanSprawl.reviewed.result.uncertainty.upper, 7.8);
assert.equal(urbanSprawl.reviewed.result.confidence, 'C');
assert.equal(urbanSprawl.reviewed.candidate.currentWindow.end, 2025);
assert.equal(urbanSprawl.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert.equal(urbanSprawl.oldEvidenceOpen, false);
assert.deepEqual(urbanSprawl.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 3 });
assert.equal(urbanSprawl.reviewed.candidate.components.human.structuralZero, true);
assert(urbanSprawl.reviewed.candidate.components.ecosystem.evidenceReferences.includes('un_sdg_goal11_land_consumption_2026'));
assert.match(urbanSprawl.finding, /improving recent land-use efficiency/i);
const groundwaterRecharge = byId.get('aquifer_recharge_failure');
assert.equal(groundwaterRecharge.reviewMode, 'detailed_evidence_review');
assert.equal(groundwaterRecharge.reviewed.result.value, 4.4);
assert.equal(groundwaterRecharge.reviewed.result.grade.letter, 'B');
assert.equal(groundwaterRecharge.reviewed.result.uncertainty.lower, 2.1);
assert.equal(groundwaterRecharge.reviewed.result.uncertainty.upper, 7);
assert.equal(groundwaterRecharge.reviewed.result.confidence, 'C');
assert.equal(groundwaterRecharge.reviewed.candidate.currentWindow.start, 2001);
assert.equal(groundwaterRecharge.reviewed.candidate.currentWindow.end, 2020);
assert.equal(groundwaterRecharge.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2025);
assert.equal(groundwaterRecharge.oldEvidenceOpen, false);
assert.deepEqual(groundwaterRecharge.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(groundwaterRecharge.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 2 });
assert(groundwaterRecharge.reviewed.candidate.components.human.evidenceReferences.includes('nazari_global_rainfed_groundwater_recharge_2025'));
assert.match(groundwaterRecharge.finding, /recharge decline, storage depletion, pumping, exposed residents and downstream harm/i);
const roadStreamCrossing = byId.get('road_stream_crossing_barriers');
assert.equal(roadStreamCrossing.reviewMode, 'detailed_evidence_review');
assert.equal(roadStreamCrossing.reviewed.result.value, 4.8);
assert.equal(roadStreamCrossing.reviewed.result.grade.letter, 'C');
assert.equal(roadStreamCrossing.reviewed.result.uncertainty.lower, 2.5);
assert.equal(roadStreamCrossing.reviewed.result.uncertainty.upper, 7);
assert.equal(roadStreamCrossing.reviewed.result.confidence, 'C');
assert.deepEqual(roadStreamCrossing.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(roadStreamCrossing.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(roadStreamCrossing.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 2 });
assert.equal(roadStreamCrossing.oldEvidenceOpen, false);
assert(roadStreamCrossing.reviewed.candidate.components.ecosystem.evidenceReferences.includes('nacc_national_aquatic_barrier_inventory_2026'));
assert.match(roadStreamCrossing.finding, /unrelated reservoir relationship/i);
const anaerobicManureLagoon = byId.get('anaerobic_manure_lagoon_operation');
assert.equal(anaerobicManureLagoon.reviewMode, 'detailed_evidence_review');
assert.equal(anaerobicManureLagoon.reviewed.result.value, 4);
assert.equal(anaerobicManureLagoon.reviewed.result.grade.letter, 'B');
assert.equal(anaerobicManureLagoon.reviewed.result.uncertainty.lower, 2.1);
assert.equal(anaerobicManureLagoon.reviewed.result.uncertainty.upper, 6.3);
assert.equal(anaerobicManureLagoon.reviewed.result.confidence, 'C');
assert.equal(anaerobicManureLagoon.oldEvidenceOpen, false);
assert.deepEqual(anaerobicManureLagoon.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.deepEqual(anaerobicManureLagoon.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 3 });
assert(anaerobicManureLagoon.reviewed.candidate.components.ecosystem.evidenceReferences.includes('lawrinenko_cafo_groundwater_remediation_2025'));
assert.match(anaerobicManureLagoon.finding, /Airport Climate Exposure/i);
const wetlandPeatFires = byId.get('wetland_peat_fires');
assert.equal(wetlandPeatFires.reviewMode, 'detailed_evidence_review');
assert.equal(wetlandPeatFires.reviewed.result.value, 7.4);
assert.equal(wetlandPeatFires.reviewed.result.grade.letter, 'D');
assert.equal(wetlandPeatFires.reviewed.result.uncertainty.lower, 6.3);
assert.equal(wetlandPeatFires.reviewed.result.uncertainty.upper, 8.1);
assert.equal(wetlandPeatFires.reviewed.result.confidence, 'C');
assert.equal(wetlandPeatFires.oldEvidenceOpen, false);
assert.equal(wetlandPeatFires.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2023);
assert.deepEqual(wetlandPeatFires.reviewed.candidate.components.human.central, { severity: 4, reach: 2, persistence: 4 });
assert.deepEqual(wetlandPeatFires.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert(wetlandPeatFires.reviewed.candidate.components.human.evidenceReferences.includes('grosvenor_indonesian_peat_fire_health_2024'));
assert(wetlandPeatFires.reviewed.candidate.components.ecosystem.evidenceReferences.includes('zhong_canada_soil_peat_fire_carbon_2026'));
assert.match(wetlandPeatFires.finding, /exposed populations are excluded/i);
assert.equal(byId.get('heat_related_mortality_burden').reviewed.result.grade.letter, 'E');
assert.equal(byId.get('wildlife_habitat_patches').reviewed.result.grade.letter, 'D');
assert.equal(byId.get('acid_rain_deposition').reviewed.result.grade.letter, 'C');
assert.equal(byId.get('freshwater_mussel_depletion').reviewed.result.grade.letter, 'D');
assert.equal(byId.get('mountain_pass_avalanches').reviewed.result.grade.letter, 'B');
assert.equal(byId.get('mountain_pass_avalanches').reviewed.result.value, 4);
assert.equal(byId.get('air_pollution_health_burden').reviewed.result.grade.letter, 'E');
assert.equal(byId.get('air_pollution_health_burden').reviewed.result.uncertainty.lower, 9.3);
const troposphericOzone = byId.get('tropospheric_ozone');
assert.equal(troposphericOzone.reviewMode, 'detailed_evidence_review');
assert.equal(troposphericOzone.reviewed.result.value, 8.5);
assert.equal(troposphericOzone.reviewed.result.grade.letter, 'E');
assert.equal(troposphericOzone.reviewed.result.confidence, 'B');
assert.equal(troposphericOzone.reviewed.result.uncertainty.lower, 8.5);
assert.equal(troposphericOzone.reviewed.result.uncertainty.upper, 8.5);
assert.equal(troposphericOzone.reviewed.candidate.currentWindow.end, 2021);
assert.equal(troposphericOzone.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2021);
assert.equal(troposphericOzone.oldEvidenceOpen, false);
assert(troposphericOzone.reviewed.candidate.components.human.evidenceReferences.includes('state_of_global_air_2024_gbd_2021_ozone'));
assert.deepEqual(troposphericOzone.reviewed.candidate.components.human.central, { severity: 4, reach: 2, persistence: 4 });
assert.match(troposphericOzone.finding, /upgraded confidence from C to B/i);
assert.equal(byId.get('wildfire_smoke_pm25_exposure').reviewed.result.value, 10);
const coastalPermafrostErosion = byId.get('coastal_permafrost_erosion');
assert.equal(coastalPermafrostErosion.reviewMode, 'detailed_evidence_review');
assert.equal(coastalPermafrostErosion.reviewed.result.value, 7);
assert.equal(coastalPermafrostErosion.reviewed.result.grade.letter, 'D');
assert.equal(coastalPermafrostErosion.reviewed.result.uncertainty.lower, 5.9);
assert.equal(coastalPermafrostErosion.reviewed.result.uncertainty.upper, 7.4);
assert.equal(coastalPermafrostErosion.reviewed.result.confidence, 'B');
assert.equal(coastalPermafrostErosion.reviewed.candidate.currentWindow.end, 2024);
assert.equal(coastalPermafrostErosion.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2025);
assert.equal(coastalPermafrostErosion.oldEvidenceOpen, false);
assert.deepEqual(coastalPermafrostErosion.reviewed.candidate.components.human.lower, { severity: 3, reach: 1, persistence: 4 });
assert.deepEqual(coastalPermafrostErosion.reviewed.candidate.components.human.central, { severity: 3, reach: 1, persistence: 4 });
assert.deepEqual(coastalPermafrostErosion.reviewed.candidate.components.human.upper, { severity: 3, reach: 1, persistence: 4 });
assert(coastalPermafrostErosion.reviewed.candidate.components.human.evidenceReferences.includes('gao_high_risk_newtok_relocation_2025'));
assert(coastalPermafrostErosion.reviewed.candidate.components.ecosystem.evidenceReferences.includes('jorgenson_yukon_kuskokwim_delta_compound_change_2025'));
assert.match(coastalPermafrostErosion.finding, /range narrows from C 5\.1–D 7\.8 to C 5\.9–D 7\.4/i);
for (const nodeId of ['glacial_lake_failure_risk', 'glacier_hydrologic_system_floods']) {
  const row = byId.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 6.3, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'C', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 4.8, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 7.4, nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.equal(row.reviewed.candidate.currentWindow.start, 2023, nodeId);
  assert.equal(row.reviewed.candidate.currentWindow.end, 2024, nodeId);
  assert.equal(row.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026, nodeId);
  assert.equal(row.oldEvidenceOpen, false, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.human.central, { severity: 4, reach: 2, persistence: 4 }, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 2 }, nodeId);
  assert(row.reviewed.candidate.components.human.evidenceReferences.includes('mishra_south_lhonak_glof_2026'), nodeId);
  assert(row.reviewed.candidate.components.ecosystem.evidenceReferences.includes('icimod_ndrrma_thame_glof_2025'), nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Potential runout exposure/i, nodeId);
  assert.match(row.finding, /15 million potentially exposed people as harmed/i, nodeId);
}
const rainOnSnowFloodRisk = byId.get('rain_on_snow_flood_risk');
assert.equal(rainOnSnowFloodRisk.reviewMode, 'detailed_evidence_review');
assert.equal(rainOnSnowFloodRisk.reviewed.result.value, 5.5);
assert.equal(rainOnSnowFloodRisk.reviewed.result.grade.letter, 'C');
assert.equal(rainOnSnowFloodRisk.reviewed.result.uncertainty.lower, 3.6);
assert.equal(rainOnSnowFloodRisk.reviewed.result.uncertainty.upper, 6.6);
assert.equal(rainOnSnowFloodRisk.reviewed.result.confidence, 'C');
assert.equal(rainOnSnowFloodRisk.reviewed.candidate.currentWindow.start, 2022);
assert.equal(rainOnSnowFloodRisk.reviewed.candidate.currentWindow.end, 2022);
assert.equal(rainOnSnowFloodRisk.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert.equal(rainOnSnowFloodRisk.oldEvidenceOpen, false);
assert.deepEqual(rainOnSnowFloodRisk.reviewed.candidate.components.human.central, { severity: 3, reach: 2, persistence: 3 });
assert.deepEqual(rainOnSnowFloodRisk.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 2 });
assert(rainOnSnowFloodRisk.reviewed.candidate.components.human.evidenceReferences.includes('nps_yellowstone_flood_one_year_2023'));
assert.match(rainOnSnowFloodRisk.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Visitors in a normal year/i);
assert.match(rainOnSnowFloodRisk.finding, /old 1996 fatal event/i);
const urbanTreeCanopyLoss = byId.get('urban_tree_canopy_loss');
assert.equal(urbanTreeCanopyLoss.reviewMode, 'detailed_evidence_review');
assert.equal(urbanTreeCanopyLoss.reviewed.result.value, 4.8);
assert.equal(urbanTreeCanopyLoss.reviewed.result.grade.letter, 'C');
assert.equal(urbanTreeCanopyLoss.reviewed.result.uncertainty.lower, 2.5);
assert.equal(urbanTreeCanopyLoss.reviewed.result.uncertainty.upper, 7);
assert.equal(urbanTreeCanopyLoss.reviewed.result.confidence, 'C');
assert.deepEqual(urbanTreeCanopyLoss.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(urbanTreeCanopyLoss.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(urbanTreeCanopyLoss.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 3 });
assert.equal(urbanTreeCanopyLoss.reviewed.candidate.currentWindow.end, 2022);
assert.equal(urbanTreeCanopyLoss.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert.equal(urbanTreeCanopyLoss.oldEvidenceOpen, false);
assert(urbanTreeCanopyLoss.reviewed.candidate.components.ecosystem.evidenceReferences.includes('dong_global_urban_tree_lai_2025'));
assert.match(urbanTreeCanopyLoss.reviewed.candidate.decisionTrace.measurementSemantics.reach, /modeled cells/i);
assert.match(urbanTreeCanopyLoss.finding, /32% impervious-transition share/i);
assert.equal(byId.get('cooling_water_competition').reviewed.result.grade.letter, 'B');
assert.equal(byId.get('cooling_water_competition').reviewed.result.uncertainty.lower, 2.9);
assert.equal(byId.get('cooling_water_competition').reviewed.result.uncertainty.upper, 5.9);
assert.equal(byId.get('urban_distribution_water_loss').reviewed.result.grade.letter, 'C');
assert.equal(byId.get('urban_distribution_water_loss').reviewed.result.uncertainty.lower, 2.9);
assert.equal(byId.get('urban_distribution_water_loss').reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2024);
assert.equal(byId.get('soil_microbial_depletion').reviewed.result.grade.letter, 'B');
assert.equal(byId.get('soil_microbial_depletion').reviewed.result.value, 4);
assert.deepEqual(byId.get('soil_microbial_depletion').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(byId.get('soil_humus_decline').reviewed.result.grade.letter, 'C');
assert.equal(byId.get('soil_humus_decline').reviewed.result.value, 5.9);
assert.deepEqual(byId.get('acid_rain_deposition').reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.equal(byId.get('freshwater_ecosystem_collapse').reviewed.result.uncertainty.lower, 8.5);
assert(review.counts.gradeChanged > 0);
assert(review.counts.domainChanged > 0);

const allById = new Map(allReview.reviews.map(row => [row.nodeId, row]));
const completedDeferredP3NodeIds = [
  'environ_anomalies', 'land_carbon_sink_weakening', 'arctic_oscillation', 'atmospheric_dryness',
  'cloud_albedo_shift', 'coal_power_sulfur_emissions', 'fertilizer_production', 'humidity_amplification',
  'nitrous_oxide', 'southern_annular_mode', 'stratospheric_cooling', 'tropical_cyclone_rapid_intensification',
  'volatile_organic_compounds', 'carbon_monoxide', 'cattle_stocking_density', 'emergency_response_overload',
  'madden_julian_oscillation', 'pacific_north_american_pattern', 'quasi_biennial_oscillation', 'sulfur_dioxide',
  'arctic_shipping_expansion', 'compound_day_night_heat_extremes', 'disaster_recovery_inequality',
  'early_warning_coverage_gaps', 'climate_litigation_pressure', 'farm_heat_stress', 'rail_heat_buckling',
  'food_import_exposure', 'pm2_5_particulates', 'desertification_frontiers', 'water_stress',
  'particulate_soot_levels', 'hail_hazard_shift', 'crop_yield_volatility', 'feed_crop_dependency',
  'fertilizer_price_shock', 'nocturnal_heat_stress', 'vector_borne_disease_expansion',
  'ambient_air_quality_deficit', 'deepwater_petroleum_spill_risk', 'flash_flood_regime',
  'wildfire_smoke_hospitalization_burden', 'pollinator_service_decline', 'public_health_heat_burden',
  'conflict_risk_escalation', 'waterborne_pathogen_outbreaks',
];
assert.equal(completedDeferredP3NodeIds.length, 46);
for (const nodeId of completedDeferredP3NodeIds) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.candidate.decisionTrace.method, 'detailed_evidence_review', nodeId);
  assert(row.reviewed.candidate.decisionTrace.reviewEvidence.length > 0, nodeId);
  assert.match(row.finding, /completed the deferred source-specific review/i, nodeId);
}
for (const [nodeId, value, grade, lower, upper, confidence, domains, human, ecosystem] of [
  ['conflict_risk_escalation', 4, 'B', 1, 10, 'D', ['human'], [1, 1, 2], [0, 0, 0]],
  ['ambient_air_quality_deficit', 9.3, 'E', 9.3, 9.3, 'B', ['human'], [4, 3, 4], [0, 0, 0]],
  ['public_health_heat_burden', 8.5, 'E', 8.5, 9.3, 'B', ['human'], [4, 2, 4], [0, 0, 0]],
  ['pollinator_service_decline', 8.5, 'E', 7.8, 8.5, 'C', ['human'], [4, 2, 4], [0, 0, 0]],
  ['waterborne_pathogen_outbreaks', 8.5, 'E', 8.5, 9.3, 'B', ['human'], [4, 2, 4], [0, 0, 0]],
  ['flash_flood_regime', 8.5, 'E', 7.8, 8.5, 'C', ['human'], [4, 2, 4], [0, 0, 0]],
  ['wildfire_smoke_hospitalization_burden', 4, 'B', 1, 9.3, 'C', ['human'], [2, 1, 1], [0, 0, 0]],
  ['fertilizer_production', 4, 'B', 1, 8.5, 'D', ['ecosystem'], [0, 0, 0], [1, 1, 2]],
  ['water_stress', 5.1, 'C', 1, 9.6, 'C', ['human', 'ecosystem'], [1, 2, 2], [2, 2, 2]],
  ['deepwater_petroleum_spill_risk', 7.4, 'D', 5.9, 8.5, 'C', ['human', 'ecosystem'], [4, 1, 4], [3, 1, 4]],
  ['desertification_frontiers', 6.6, 'D', 4.4, 9.3, 'C', ['human', 'ecosystem'], [2, 2, 2], [3, 3, 3]],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewed.result.value, value, nodeId);
  assert.equal(row.reviewed.result.grade.letter, grade, nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, lower, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, upper, nodeId);
  assert.equal(row.reviewed.result.confidence, confidence, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, domains, nodeId);
  assert.deepEqual(Object.values(row.reviewed.candidate.components.human.central), human, nodeId);
  assert.deepEqual(Object.values(row.reviewed.candidate.components.ecosystem.central), ecosystem, nodeId);
}
assert.match(allById.get('conflict_risk_escalation').finding, /not the share caused by climate conditions/i);
assert.match(allById.get('wildfire_smoke_hospitalization_burden').finding, /study coverage, not attributable admissions/i);
for (const [nodeId, expected] of Object.entries({
  dust_storm_frequency: { value: 3.3, grade: 'B', lower: 1, upper: 6.6, confidence: 'C', domains: ['human', 'ecosystem'], sourceYear: 2024, old: false, human: [1, 1, 1], ecosystem: [1, 1, 1] },
  smoke_exposure_burden: { value: 9.3, grade: 'E', lower: 8.5, upper: 9.3, confidence: 'B', domains: ['human'], sourceYear: 2019, old: true, human: [4, 3, 4], ecosystem: [0, 0, 0] },
  ozone_formation_pressure: { value: 3.3, grade: 'B', lower: 1, upper: 8.1, confidence: 'D', domains: ['human', 'ecosystem'], sourceYear: 2017, old: true, human: [1, 1, 1], ecosystem: [1, 1, 1] },
  nighttime_heat_retention: { value: 4, grade: 'B', lower: 1, upper: 8.5, confidence: 'C', domains: ['human'], sourceYear: 2022, old: false, human: [2, 1, 1], ecosystem: [0, 0, 0] },
  kelp_forest_collapse: { value: 4.8, grade: 'C', lower: 2.5, upper: 7.8, confidence: 'C', domains: ['ecosystem'], sourceYear: 2023, old: false, human: [0, 0, 0], ecosystem: [1, 3, 1] },
  jellyfish_swarm_surges: { value: 4.8, grade: 'C', lower: 2.5, upper: 5.5, confidence: 'C', domains: ['human'], sourceYear: 2009, old: true, human: [2, 1, 2], ecosystem: [0, 0, 0] },
  agricultural_soil_compaction: { value: 5.5, grade: 'C', lower: 4, upper: 7, confidence: 'C', domains: ['human', 'ecosystem'], sourceYear: 2018, old: true, human: [2, 1, 2], ecosystem: [2, 2, 3] },
  atmospheric_river_intensification: { value: 3.6, grade: 'B', lower: 1.8, upper: 7.8, confidence: 'C', domains: ['human', 'ecosystem'], sourceYear: 2021, old: false, human: [2, 1, 1], ecosystem: [1, 1, 1] },
  adaptation_capital_shortfall: { value: 3.3, grade: 'B', lower: 1, upper: 8.1, confidence: 'D', domains: ['human', 'ecosystem'], sourceYear: 2023, old: false, human: [1, 1, 1], ecosystem: [1, 1, 1] },
  fast_fashion: { value: 3.3, grade: 'B', lower: 1, upper: 8.1, confidence: 'D', domains: ['human', 'ecosystem'], sourceYear: 2025, old: false, human: [1, 1, 1], ecosystem: [1, 1, 1] },
  grid_peak_load_stress: { value: 3.3, grade: 'B', lower: 1, upper: 7, confidence: 'C', domains: ['human'], sourceYear: 2025, old: false, human: [1, 1, 1], ecosystem: [0, 0, 0] },
  utility_disconnection_risk: { value: 4.8, grade: 'C', lower: 3.3, upper: 7.8, confidence: 'C', domains: ['human'], sourceYear: 2024, old: false, human: [2, 2, 1], ecosystem: [0, 0, 0] },
  firn_layer_depletion: { value: 5.5, grade: 'C', lower: 4, upper: 7.8, confidence: 'C', domains: ['ecosystem'], sourceYear: 2024, old: false, human: [0, 0, 0], ecosystem: [1, 2, 3] },
  ice_cap_decapitation: { value: 5.5, grade: 'C', lower: 4, upper: 7.8, confidence: 'C', domains: ['ecosystem'], sourceYear: 2025, old: false, human: [0, 0, 0], ecosystem: [2, 1, 3] },
  ice_shelf_grounding_line_retreat: { value: 5.1, grade: 'C', lower: 3.3, upper: 7.4, confidence: 'C', domains: ['human', 'ecosystem'], sourceYear: 2025, old: false, human: [1, 1, 3], ecosystem: [2, 1, 3] },
  glacier_calving_events: { value: 5.5, grade: 'C', lower: 3.3, upper: 8.5, confidence: 'C', domains: ['human'], sourceYear: 2026, old: false, human: [2, 2, 2], ecosystem: [0, 0, 0] },
  critical_infrastructure_fragility: { value: 4, grade: 'B', lower: 1.8, upper: 7.8, confidence: 'C', domains: ['human'], sourceYear: 2023, old: false, human: [2, 1, 1], ecosystem: [0, 0, 0] },
  insurance_retreat: { value: 4, grade: 'B', lower: 1.8, upper: 7, confidence: 'C', domains: ['human'], sourceYear: 2025, old: false, human: [2, 1, 1], ecosystem: [0, 0, 0] },
  mortgage_market_exposure: { value: 4, grade: 'B', lower: 1.8, upper: 6.3, confidence: 'C', domains: ['human'], sourceYear: 2024, old: false, human: [1, 1, 2], ecosystem: [0, 0, 0] },
  airport_climate_exposure: { value: 3.3, grade: 'B', lower: 1, upper: 6.3, confidence: 'C', domains: ['human'], sourceYear: 2021, old: false, human: [1, 1, 1], ecosystem: [0, 0, 0] },
  airport_operational_disruption: { value: 3.3, grade: 'B', lower: 2.5, upper: 5.5, confidence: 'C', domains: ['human'], sourceYear: 2025, old: false, human: [1, 1, 1], ecosystem: [0, 0, 0] },
  personal_conveyance: { value: 3.3, grade: 'B', lower: 1, upper: 6.3, confidence: 'C', domains: ['ecosystem'], sourceYear: 2025, old: false, human: [0, 0, 0], ecosystem: [1, 1, 1] },
  renewable_curtailment_losses: { value: 4, grade: 'B', lower: 2.5, upper: 7, confidence: 'C', domains: ['human'], sourceYear: 2026, old: false, human: [2, 1, 1], ecosystem: [0, 0, 0] },
  semiconductor_fabrication_footprint: { value: 3.3, grade: 'B', lower: 1, upper: 7.8, confidence: 'C', domains: ['ecosystem'], sourceYear: 2025, old: false, human: [0, 0, 0], ecosystem: [1, 1, 1] },
  energy_affordability_crisis: { value: 7, grade: 'D', lower: 4.8, upper: 8.5, confidence: 'C', domains: ['human'], sourceYear: 2024, old: false, human: [2, 4, 2], ecosystem: [0, 0, 0] },
  fracking_wastewater_lakes: { value: 5.5, grade: 'C', lower: 4.8, upper: 7, confidence: 'C', domains: ['ecosystem'], sourceYear: 2021, old: false, human: [0, 0, 0], ecosystem: [2, 1, 3] },
})) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, expected.value, nodeId);
  assert.equal(row.reviewed.result.grade.letter, expected.grade, nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, expected.lower, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, expected.upper, nodeId);
  assert.equal(row.reviewed.result.confidence, expected.confidence, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, expected.domains, nodeId);
  assert.equal(row.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, expected.sourceYear, nodeId);
  assert.equal(row.oldEvidenceOpen, expected.old, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.human.central, { severity: expected.human[0], reach: expected.human[1], persistence: expected.human[2] }, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, { severity: expected.ecosystem[0], reach: expected.ecosystem[1], persistence: expected.ecosystem[2] }, nodeId);
}
assert.match(allById.get('dust_storm_frequency').finding, /3\.8 billion exposed people/i);
assert.match(allById.get('smoke_exposure_burden').finding, /cause-specific subsets/i);
assert.match(allById.get('ozone_formation_pressure').finding, /no longer become harm caused by the climate penalty/i);
assert.match(allById.get('nighttime_heat_retention').finding, /not assigned to nighttime retention/i);
assert.match(allById.get('kelp_forest_collapse').finding, /regional declines.*no longer become global collapse severity/i);
assert.match(allById.get('jellyfish_swarm_surges').finding, /excluded seasonal or national projections/i);
assert.match(allById.get('agricultural_soil_compaction').finding, /not expanded into harmed-person reach/i);
assert.match(allById.get('atmospheric_river_intensification').finding, /do not establish a global intensification trend/i);
assert.match(allById.get('adaptation_capital_shortfall').finding, /financial amounts.*no longer become current terminal harm/i);
assert.match(allById.get('fast_fashion').finding, /wider-sector totals no longer become node-specific/i);
assert.match(allById.get('grid_peak_load_stress').finding, /system-pressure evidence rather than outages/i);
assert.match(allById.get('utility_disconnection_risk').finding, /service-loss evidence.*no longer become unique harmed people/i);
assert.match(allById.get('firn_layer_depletion').finding, /retained-water mass.*no longer become human harm/i);
assert.match(allById.get('ice_cap_decapitation').finding, /five-summit survey.*no longer create global reach/i);
assert.match(allById.get('ice_shelf_grounding_line_retreat').finding, /mapped coastline.*no longer become harmed people/i);
assert.match(allById.get('glacier_calving_events').finding, /compound chain rather than a sole-cause record/i);
assert.match(allById.get('critical_infrastructure_fragility').finding, /facilities.*no longer become harmed-person reach/i);
assert.match(allById.get('insurance_retreat').finding, /policy-years.*no longer become harmed-person reach/i);
assert.match(allById.get('mortgage_market_exposure').finding, /unpaid principal balance no longer become realized loss/i);
assert.match(allById.get('airport_climate_exposure').finding, /expected disruptions.*no longer become realized harm/i);
assert.match(allById.get('airport_operational_disruption').finding, /prorated flight equivalents.*no longer become harmed-person reach/i);
assert.match(allById.get('personal_conveyance').finding, /emissions mass.*no longer become terminal harm/i);
assert.match(allById.get('renewable_curtailment_losses').finding, /constraint payments support material system loss/i);
assert.match(allById.get('semiconductor_fabrication_footprint').finding, /environmental spending.*no longer become terminal harm/i);
assert.match(allById.get('energy_affordability_crisis').finding, /160 million additional households.*fixed reach anchor/i);
assert.match(allById.get('fracking_wastewater_lakes').finding, /2\.5-year chemical persistence/i);
const seagrassMeadowDecline = allById.get('seagrass_meadow_decline');
assert.equal(seagrassMeadowDecline.reviewMode, 'detailed_evidence_review');
assert.equal(seagrassMeadowDecline.reviewed.result.value, 7);
assert.equal(seagrassMeadowDecline.reviewed.result.grade.letter, 'D');
assert.equal(seagrassMeadowDecline.reviewed.result.uncertainty.lower, 6.3);
assert.equal(seagrassMeadowDecline.reviewed.result.uncertainty.upper, 7.8);
assert.equal(seagrassMeadowDecline.reviewed.result.confidence, 'B');
assert.equal(seagrassMeadowDecline.oldEvidenceOpen, false);
assert.deepEqual(seagrassMeadowDecline.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(seagrassMeadowDecline.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(seagrassMeadowDecline.reviewed.candidate.components.ecosystem.central, { severity: 4, reach: 2, persistence: 2 });
assert(seagrassMeadowDecline.reviewed.candidate.components.ecosystem.evidenceReferences.includes('li_global_seagrass_maps_2026'));
assert(seagrassMeadowDecline.reviewed.candidate.components.ecosystem.evidenceReferences.includes('furman_seagrass_recovery_2018'));
assert.match(seagrassMeadowDecline.finding, /human service pathways remain unquantified/i);
for (const [nodeId, expected] of Object.entries({
  snow_drought: { value: 4.4, lower: 2.1, upper: 6.3, human: [2, 1, 2], ecosystem: [2, 1, 1] },
  snowmelt_timing_shift: { value: 3.6, lower: 1.8, upper: 5.9, human: [1, 1, 1], ecosystem: [1, 1, 2] },
  alpine_snowpack_declines: { value: 4, lower: 1.8, upper: 6.3, human: [1, 1, 2], ecosystem: [1, 1, 2] },
})) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, expected.value, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, expected.lower, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, expected.upper, nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.equal(row.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2025, nodeId);
  assert.deepEqual(Object.values(row.reviewed.candidate.components.human.central), expected.human, nodeId);
  assert.deepEqual(Object.values(row.reviewed.candidate.components.ecosystem.central), expected.ecosystem, nodeId);
  assert(!/700\s*million|700,000,000/i.test(row.reviewed.candidate.components.human.attribution), nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.reach, /exposure|study scope|not substitutes/i, nodeId);
}
assert(allById.get('snow_drought').reviewed.candidate.components.human.evidenceReferences.includes('zaerpour_canada_snow_drought_2025'));
assert(allById.get('snowmelt_timing_shift').reviewed.candidate.components.human.evidenceReferences.includes('guo_snowmelt_flood_timing_2025'));
assert(allById.get('alpine_snowpack_declines').reviewed.candidate.components.ecosystem.evidenceReferences.includes('choler_alpine_snow_cover_legacy_2025'));
const oceanAcidification = allById.get('ocean_acidification');
assert.equal(oceanAcidification.reviewMode, 'detailed_evidence_review');
assert.equal(oceanAcidification.reviewed.result.value, 6.3);
assert.equal(oceanAcidification.reviewed.result.grade.letter, 'C');
assert.equal(oceanAcidification.reviewed.result.uncertainty.lower, 4.4);
assert.equal(oceanAcidification.reviewed.result.uncertainty.upper, 8.1);
assert.equal(oceanAcidification.reviewed.result.confidence, 'C');
assert.deepEqual(oceanAcidification.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.deepEqual(oceanAcidification.reviewed.candidate.components.ecosystem.central, { severity: 3, reach: 3, persistence: 3 });
assert(oceanAcidification.reviewed.candidate.components.ecosystem.evidenceReferences.includes('findlay_ocean_acidification_planetary_boundary_2025'));
assert(oceanAcidification.reviewed.candidate.components.ecosystem.evidenceReferences.includes('barrett_global_biotic_calcification_feedback_2025'));
assert(oceanAcidification.reviewed.candidate.components.human.evidenceReferences.includes('noaa_oap_pacific_northwest_shellfish_acidification_2015'));
assert.match(oceanAcidification.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Global chemical coverage is excluded/i);
assert.match(oceanAcidification.finding, /global chemical exposure/i);
const palmOil = allById.get('palm_oil_canopy_clearance');
assert.equal(palmOil.reviewed.result.value, 6.3);
assert.equal(palmOil.reviewed.result.grade.letter, 'C');
assert.equal(palmOil.reviewed.result.uncertainty.lower, 4.8);
assert.equal(palmOil.reviewed.result.uncertainty.upper, 7.8);
assert.equal(palmOil.reviewed.result.confidence, 'B');
assert.deepEqual(palmOil.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.deepEqual(palmOil.reviewed.candidate.components.ecosystem.central, { severity: 3, reach: 1, persistence: 3 });
assert.equal(palmOil.reviewMode, 'detailed_evidence_review');
const marineFoodWeb = allById.get('marine_food_web_simplification');
assert.equal(marineFoodWeb.reviewMode, 'detailed_evidence_review');
assert.equal(marineFoodWeb.reviewed.result.value, 5.5);
assert.equal(marineFoodWeb.reviewed.result.grade.letter, 'C');
assert.equal(marineFoodWeb.reviewed.result.uncertainty.lower, 4);
assert.equal(marineFoodWeb.reviewed.result.uncertainty.upper, 7);
assert.equal(marineFoodWeb.reviewed.result.confidence, 'C');
assert.deepEqual(marineFoodWeb.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(marineFoodWeb.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(marineFoodWeb.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 3 });
assert(marineFoodWeb.reviewed.candidate.components.ecosystem.evidenceReferences.includes('faithfull_baltic_food_web_reorganization_2026'));
assert.match(marineFoodWeb.finding, /human dependence as if they measured.*harm/i);
const arcticAmplification = allById.get('arctic_amplification_rates');
assert.equal(arcticAmplification.reviewMode, 'detailed_evidence_review');
assert.equal(arcticAmplification.reviewed.result.value, 6.3);
assert.equal(arcticAmplification.reviewed.result.grade.letter, 'C');
assert.equal(arcticAmplification.reviewed.result.uncertainty.lower, 4.4);
assert.equal(arcticAmplification.reviewed.result.uncertainty.upper, 7.8);
assert.equal(arcticAmplification.reviewed.result.confidence, 'C');
assert.deepEqual(arcticAmplification.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(arcticAmplification.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.deepEqual(arcticAmplification.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 4 });
assert(arcticAmplification.reviewed.candidate.components.ecosystem.evidenceReferences.includes('ipcc_ar6_wgii_polar_regions_2022'));
assert.match(arcticAmplification.finding, /0\.050603% spatial-data proxy/i);
const iceAlbedoFeedback = allById.get('ice_albedo_feedback_loops');
assert.equal(iceAlbedoFeedback.reviewMode, 'detailed_evidence_review');
assert.equal(iceAlbedoFeedback.reviewed.result.value, 5.1);
assert.equal(iceAlbedoFeedback.reviewed.result.grade.letter, 'C');
assert.equal(iceAlbedoFeedback.reviewed.result.uncertainty.lower, 4);
assert.equal(iceAlbedoFeedback.reviewed.result.uncertainty.upper, 7.4);
assert.equal(iceAlbedoFeedback.reviewed.result.confidence, 'C');
assert.deepEqual(iceAlbedoFeedback.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(iceAlbedoFeedback.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(iceAlbedoFeedback.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert(iceAlbedoFeedback.reviewed.candidate.components.ecosystem.evidenceReferences.includes('noaa_arctic_report_card_terrestrial_snow_2025'));
assert(iceAlbedoFeedback.reviewed.candidate.components.ecosystem.evidenceReferences.includes('ipcc_ar6_wgi_surface_albedo_feedback_2021'));
assert.match(iceAlbedoFeedback.finding, /700-million harmed-population assumption/i);
const peatOxidation = allById.get('peat_oxidation_pulse');
assert.equal(peatOxidation.reviewMode, 'detailed_evidence_review');
assert.equal(peatOxidation.reviewed.result.value, 6.3);
assert.equal(peatOxidation.reviewed.result.grade.letter, 'C');
assert.equal(peatOxidation.reviewed.result.uncertainty.lower, 4.8);
assert.equal(peatOxidation.reviewed.result.uncertainty.upper, 7.8);
assert.equal(peatOxidation.reviewed.result.confidence, 'C');
assert.deepEqual(peatOxidation.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(peatOxidation.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(peatOxidation.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert(peatOxidation.reviewed.candidate.components.ecosystem.evidenceReferences.includes('faostat_drained_organic_soils_2025_10_28'));
assert(peatOxidation.reviewed.candidate.components.ecosystem.evidenceReferences.includes('elo_boreal_peatland_restoration_2024'));
assert.match(peatOxidation.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Peatland vegetation degradation/i);
assert.match(peatOxidation.finding, /range narrows from B–E to C–D/i);
const speciesRangeContraction = allById.get('species_range_compression');
assert.equal(speciesRangeContraction.reviewMode, 'detailed_evidence_review');
assert.equal(speciesRangeContraction.reviewed.result.value, 5.5);
assert.equal(speciesRangeContraction.reviewed.result.grade.letter, 'C');
assert.equal(speciesRangeContraction.reviewed.result.uncertainty.lower, 3.3);
assert.equal(speciesRangeContraction.reviewed.result.uncertainty.upper, 7.8);
assert.equal(speciesRangeContraction.reviewed.result.confidence, 'C');
assert.deepEqual(speciesRangeContraction.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(speciesRangeContraction.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(speciesRangeContraction.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert(speciesRangeContraction.reviewed.candidate.components.ecosystem.evidenceReferences.includes('pacifici_global_mammal_range_change_2020'));
assert(speciesRangeContraction.reviewed.candidate.components.ecosystem.evidenceReferences.includes('wiens_climate_related_local_extinctions_2016'));
assert.match(speciesRangeContraction.reviewed.candidate.decisionTrace.measurementSemantics.reach, /selected species/i);
assert.match(speciesRangeContraction.reviewed.candidate.causalAllocation.limitations, /representative global area denominator/i);
const reservoirStorageInstability = allById.get('reservoir_storage_instability');
assert.equal(reservoirStorageInstability.reviewMode, 'detailed_evidence_review');
assert.equal(reservoirStorageInstability.reviewed.result.value, 4.8);
assert.equal(reservoirStorageInstability.reviewed.result.grade.letter, 'C');
assert.equal(reservoirStorageInstability.reviewed.result.uncertainty.lower, 3.6);
assert.equal(reservoirStorageInstability.reviewed.result.uncertainty.upper, 7.4);
assert.equal(reservoirStorageInstability.reviewed.result.confidence, 'C');
assert.deepEqual(reservoirStorageInstability.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(reservoirStorageInstability.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 3 });
assert.deepEqual(reservoirStorageInstability.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 3 });
assert(reservoirStorageInstability.reviewed.candidate.components.human.evidenceReferences.includes('liu_global_reservoir_sedimentation_2026'));
assert.match(reservoirStorageInstability.reviewed.candidate.decisionTrace.measurementSemantics.reach, /threatened supply/i);
assert.match(reservoirStorageInstability.finding, /people already harmed/i);
const oldGrowthForestLogging = allById.get('old_growth_forest_logging');
assert.equal(oldGrowthForestLogging.reviewMode, 'detailed_evidence_review');
assert.equal(oldGrowthForestLogging.reviewed.result.value, 4.8);
assert.equal(oldGrowthForestLogging.reviewed.result.grade.letter, 'C');
assert.equal(oldGrowthForestLogging.reviewed.result.uncertainty.lower, 2.9);
assert.equal(oldGrowthForestLogging.reviewed.result.uncertainty.upper, 7.4);
assert.equal(oldGrowthForestLogging.reviewed.result.confidence, 'C');
assert.deepEqual(oldGrowthForestLogging.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(oldGrowthForestLogging.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 3 });
assert(oldGrowthForestLogging.reviewed.candidate.components.ecosystem.evidenceReferences.includes('fao_global_forest_resources_assessment_2025'));
assert(oldGrowthForestLogging.reviewed.candidate.components.ecosystem.evidenceReferences.includes('ewers_logged_tropical_forest_thresholds_2024'));
assert.match(oldGrowthForestLogging.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Primary-forest share.*excluded/i);
assert.match(oldGrowthForestLogging.finding, /Tongass regional area share/i);
const iceSheetMassLoss = allById.get('ice_sheet_mass_loss');
assert.equal(iceSheetMassLoss.reviewMode, 'detailed_evidence_review');
assert.equal(iceSheetMassLoss.reviewed.result.value, 5.1);
assert.equal(iceSheetMassLoss.reviewed.result.grade.letter, 'C');
assert.equal(iceSheetMassLoss.reviewed.result.uncertainty.lower, 3.3);
assert.equal(iceSheetMassLoss.reviewed.result.uncertainty.upper, 7.4);
assert.equal(iceSheetMassLoss.reviewed.result.confidence, 'C');
assert.deepEqual(iceSheetMassLoss.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 3 });
assert.deepEqual(iceSheetMassLoss.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 3 });
assert(iceSheetMassLoss.reviewed.candidate.components.human.evidenceReferences.includes('imbie_mass_balance_1970s_to_2023_2026'));
assert(iceSheetMassLoss.reviewed.candidate.components.ecosystem.evidenceReferences.includes('meire_greenland_fjord_ecosystem_retreat_2023'));
assert.match(iceSheetMassLoss.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Ice-sheet extent.*excluded/i);
assert.match(iceSheetMassLoss.finding, /global measurement coverage/i);
const blueCarbonHabitatLoss = allById.get('blue_carbon_habitat_loss');
assert.equal(blueCarbonHabitatLoss.reviewMode, 'detailed_evidence_review');
assert.equal(blueCarbonHabitatLoss.reviewed.result.value, 5.9);
assert.equal(blueCarbonHabitatLoss.reviewed.result.grade.letter, 'C');
assert.equal(blueCarbonHabitatLoss.reviewed.result.uncertainty.lower, 3.6);
assert.equal(blueCarbonHabitatLoss.reviewed.result.uncertainty.upper, 7.8);
assert.equal(blueCarbonHabitatLoss.reviewed.result.confidence, 'B');
assert.deepEqual(blueCarbonHabitatLoss.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(blueCarbonHabitatLoss.reviewed.candidate.components.ecosystem.central, { severity: 4, reach: 2, persistence: 3 });
assert(blueCarbonHabitatLoss.reviewed.candidate.components.ecosystem.evidenceReferences.includes('li_global_seagrass_maps_2026'));
assert.match(blueCarbonHabitatLoss.reviewed.candidate.decisionTrace.measurementSemantics.reach, /not added/i);
assert.match(blueCarbonHabitatLoss.finding, /human reach/i);
const coralBleaching = allById.get('coral_bleaching');
assert.equal(coralBleaching.reviewMode, 'detailed_evidence_review');
assert.equal(coralBleaching.reviewed.result.value, 7);
assert.equal(coralBleaching.reviewed.result.grade.letter, 'D');
assert.equal(coralBleaching.reviewed.result.uncertainty.lower, 6.3);
assert.equal(coralBleaching.reviewed.result.uncertainty.upper, 8.5);
assert.equal(coralBleaching.reviewed.result.confidence, 'B');
assert.deepEqual(coralBleaching.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(coralBleaching.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(coralBleaching.reviewed.candidate.components.ecosystem.lower, { severity: 2, reach: 3, persistence: 2 });
assert.deepEqual(coralBleaching.reviewed.candidate.components.ecosystem.central, { severity: 3, reach: 3, persistence: 2 });
assert.deepEqual(coralBleaching.reviewed.candidate.components.ecosystem.upper, { severity: 3, reach: 4, persistence: 3 });
assert(coralBleaching.reviewed.candidate.components.ecosystem.evidenceReferences.includes('gcrmn_status_coral_reefs_2025'));
assert(coralBleaching.reviewed.candidate.components.ecosystem.evidenceReferences.includes('noaa_coral_reef_watch'));
assert(coralBleaching.reviewed.candidate.components.ecosystem.evidenceReferences.includes('eakin_global_coral_bleaching_damage_2026'));
assert(coralBleaching.reviewed.candidate.components.ecosystem.evidenceReferences.includes('ortiz_great_barrier_reef_recovery_2018'));
assert.match(coralBleaching.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /84\.4% heat-stress exposure.*does not enter central reach as observed damage/i);
assert.match(coralBleaching.finding, /human domain remains excluded/i);
const firstPassById = new Map(firstPass.issues.map(row => [row.nodeId, row]));
for (const row of allReview.reviews) {
  const before = new Set(firstPassById.get(row.nodeId).candidate.applicableDomains);
  const after = row.reviewed.candidate.applicableDomains;
  const added = after.filter(domain => !before.has(domain));
  if (added.length) {
    assert(['detailed_evidence_review_override', 'explicit_direct_domain_override']
      .includes(row.reviewed.candidate.decisionTrace.domainScopeRule), `${row.nodeId}: unexplained domain expansion`);
  }
}
assert.deepEqual(allById.get('heatwave_excess_mortality_rates').reviewed.candidate.applicableDomains, ['human']);
assert.equal(allById.get('heatwave_excess_mortality_rates').reviewed.candidate.components.ecosystem.structuralZero, true);
assert.equal(allById.get('heatwave_excess_mortality_rates').reviewed.result.value, 8.5);
assert.equal(allById.get('heatwave_excess_mortality_rates').reviewed.result.grade.letter, 'E');
assert.equal(allById.get('heatwave_excess_mortality_rates').reviewed.result.confidence, 'B');
assert.equal(allById.get('heatwave_excess_mortality_rates').reviewMode, 'detailed_evidence_review');
assert.equal(allById.get('heatwave_excess_mortality_rates').reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert.match(allById.get('heatwave_excess_mortality_rates').reviewed.candidate.decisionTrace.axisBasis.human.severity.basis, /38,154 deaths/);
assert.match(allById.get('heatwave_excess_mortality_rates').finding, /confidence upgraded from C to B/i);
const portBottleneck = allById.get('supply_chain_port_bottlenecks');
assert.equal(portBottleneck.reviewMode, 'detailed_evidence_review');
assert.deepEqual(portBottleneck.reviewed.candidate.applicableDomains, ['human']);
assert.equal(portBottleneck.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.equal(portBottleneck.reviewed.result.value, 4);
assert.equal(portBottleneck.reviewed.result.grade.letter, 'B');
assert.equal(portBottleneck.reviewed.result.confidence, 'B');
assert.equal(portBottleneck.reviewed.result.uncertainty.lower, 2.5);
assert.equal(portBottleneck.reviewed.result.uncertainty.upper, 5.5);
assert.deepEqual(portBottleneck.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 });
assert(portBottleneck.reviewed.candidate.components.human.evidenceReferences.includes('verschuur_systemic_climate_port_risk_2023'));
assert.match(portBottleneck.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /80% of world trade is not reused/i);
assert.match(portBottleneck.finding, /incorrectly treated.*global trade.*ecological extent/i);
const urbanHeatIsland = allById.get('urban_heat_island');
assert.equal(urbanHeatIsland.reviewMode, 'detailed_evidence_review');
assert.deepEqual(urbanHeatIsland.reviewed.candidate.applicableDomains, ['human']);
assert.equal(urbanHeatIsland.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.equal(urbanHeatIsland.reviewed.result.value, 7.8);
assert.equal(urbanHeatIsland.reviewed.result.grade.letter, 'D');
assert.equal(urbanHeatIsland.reviewed.result.confidence, 'B');
assert.equal(urbanHeatIsland.reviewed.result.uncertainty.lower, 6.3);
assert.equal(urbanHeatIsland.reviewed.result.uncertainty.upper, 9.3);
assert.deepEqual(urbanHeatIsland.reviewed.candidate.components.human.central, { severity: 3, reach: 2, persistence: 4 });
assert(urbanHeatIsland.reviewed.candidate.components.human.evidenceReferences.includes('wang_global_urban_overheating_mortality_2025'));
assert.match(urbanHeatIsland.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /avoided cold mortality.*not subtracted/i);
assert.match(urbanHeatIsland.finding, /protective cold-period finding/i);
const invasiveSpecies = allById.get('invasive_species_encroachment');
assert.equal(invasiveSpecies.reviewMode, 'detailed_evidence_review');
assert.deepEqual(invasiveSpecies.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.equal(invasiveSpecies.reviewed.result.value, 7.8);
assert.equal(invasiveSpecies.reviewed.result.grade.letter, 'D');
assert.equal(invasiveSpecies.reviewed.result.confidence, 'B');
assert.equal(invasiveSpecies.reviewed.result.uncertainty.lower, 5.9);
assert.equal(invasiveSpecies.reviewed.result.uncertainty.upper, 9.3);
assert.deepEqual(invasiveSpecies.reviewed.candidate.components.human.central, { severity: 2, reach: 2, persistence: 3 });
assert.deepEqual(invasiveSpecies.reviewed.candidate.components.ecosystem.central, { severity: 4, reach: 3, persistence: 4 });
assert(invasiveSpecies.reviewed.candidate.components.ecosystem.evidenceReferences.includes('ipbes_ias_summary_policy_makers_2023'));
assert.match(invasiveSpecies.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /16% sole-driver.*contained within the 60% contributor/i);
assert.match(invasiveSpecies.finding, /coverage and report shares are not used as substitutes/i);
const agriculturalDemand = allById.get('food');
assert.equal(agriculturalDemand.reviewMode, 'detailed_evidence_review');
assert.deepEqual(agriculturalDemand.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(agriculturalDemand.reviewed.candidate.components.human.structuralZero, true);
assert.equal(agriculturalDemand.reviewed.result.value, 5.5);
assert.equal(agriculturalDemand.reviewed.result.grade.letter, 'C');
assert.equal(agriculturalDemand.reviewed.result.confidence, 'B');
assert.equal(agriculturalDemand.reviewed.result.uncertainty.lower, 4);
assert.equal(agriculturalDemand.reviewed.result.uncertainty.upper, 7.8);
assert.deepEqual(agriculturalDemand.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 3 });
assert(agriculturalDemand.reviewed.candidate.components.ecosystem.evidenceReferences.includes('cabernard_agri_food_land_use_biodiversity_2024'));
assert.match(agriculturalDemand.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /1\.4%.*enters ecosystem severity once/i);
assert.match(agriculturalDemand.finding, /dedicated nodes rather than being copied/i);
const managedRetreat = allById.get('managed_retreat_pressure');
assert.equal(managedRetreat.reviewMode, 'detailed_evidence_review');
assert.deepEqual(managedRetreat.reviewed.candidate.applicableDomains, ['human']);
assert.equal(managedRetreat.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.equal(managedRetreat.reviewed.result.value, 5.5);
assert.equal(managedRetreat.reviewed.result.grade.letter, 'C');
assert.equal(managedRetreat.reviewed.result.confidence, 'B');
assert.equal(managedRetreat.reviewed.result.uncertainty.lower, 4);
assert.equal(managedRetreat.reviewed.result.uncertainty.upper, 7);
assert.deepEqual(managedRetreat.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 3 });
assert(managedRetreat.reviewed.candidate.components.human.evidenceReferences.includes('gao_26_109045_fema_flood_property_acquisitions'));
assert.match(managedRetreat.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /69,415 historical acquisitions establish context only/i);
assert.match(managedRetreat.finding, /permanent open space does not become adverse ecosystem harm/i);
const foodWaste = allById.get('food_waste');
assert.equal(foodWaste.reviewMode, 'detailed_evidence_review');
assert.deepEqual(foodWaste.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.equal(foodWaste.reviewed.result.value, 3.6);
assert.equal(foodWaste.reviewed.result.grade.letter, 'B');
assert.equal(foodWaste.reviewed.result.confidence, 'B');
assert.equal(foodWaste.reviewed.result.uncertainty.lower, 2.9);
assert.equal(foodWaste.reviewed.result.uncertainty.upper, 5.1);
assert.deepEqual(foodWaste.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 });
assert.deepEqual(foodWaste.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 1 });
assert(foodWaste.reviewed.candidate.components.human.evidenceReferences.includes('unep_food_waste_index'));
assert(foodWaste.reviewed.candidate.components.ecosystem.evidenceReferences.includes('fao_food_wastage_footprint_2013'));
assert.match(foodWaste.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /One billion meals is not people harmed/i);
assert.match(foodWaste.finding, /overstated persistence and reach/i);
const oceanHeatContent = allById.get('ocean_heat_content');
assert.equal(oceanHeatContent.reviewMode, 'detailed_evidence_review');
assert.deepEqual(oceanHeatContent.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.equal(oceanHeatContent.reviewed.result.value, 6.3);
assert.equal(oceanHeatContent.reviewed.result.grade.letter, 'C');
assert.equal(oceanHeatContent.reviewed.result.confidence, 'B');
assert.equal(oceanHeatContent.reviewed.result.uncertainty.lower, 4);
assert.equal(oceanHeatContent.reviewed.result.uncertainty.upper, 8.1);
assert.deepEqual(oceanHeatContent.reviewed.candidate.components.human.central, { severity: 2, reach: 2, persistence: 2 });
assert.deepEqual(oceanHeatContent.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 3 });
assert.equal(oceanHeatContent.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert(oceanHeatContent.reviewed.candidate.components.human.evidenceReferences.includes('ipcc_ar6_wgii_ocean_coastal_impacts'));
assert.match(oceanHeatContent.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /connected nodes remain separate ratings/i);
assert.match(oceanHeatContent.finding, /global measurement geography as harm reach/i);
const oceanCarbonUptake = allById.get('ocean_carbon_uptake_weakening');
assert.equal(oceanCarbonUptake.reviewMode, 'detailed_evidence_review');
assert.deepEqual(oceanCarbonUptake.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(oceanCarbonUptake.reviewed.candidate.components.human.structuralZero, true);
assert.equal(oceanCarbonUptake.reviewed.result.value, 5.5);
assert.equal(oceanCarbonUptake.reviewed.result.grade.letter, 'C');
assert.equal(oceanCarbonUptake.reviewed.result.confidence, 'B');
assert.equal(oceanCarbonUptake.reviewed.result.uncertainty.lower, 4);
assert.equal(oceanCarbonUptake.reviewed.result.uncertainty.upper, 7.8);
assert.deepEqual(oceanCarbonUptake.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 3 });
assert.equal(oceanCarbonUptake.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert(oceanCarbonUptake.reviewed.candidate.components.ecosystem.evidenceReferences.includes('global_carbon_budget_2025_ocean_sink'));
assert.match(oceanCarbonUptake.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /7\.1% counterfactual reduction enters ecosystem severity once/i);
assert.match(oceanCarbonUptake.finding, /still-growing observed total sink/i);
const phytoplanktonDecline = allById.get('phytoplankton_decline');
assert.equal(phytoplanktonDecline.reviewMode, 'detailed_evidence_review');
assert.deepEqual(phytoplanktonDecline.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(phytoplanktonDecline.reviewed.candidate.components.human.structuralZero, true);
assert.equal(phytoplanktonDecline.reviewed.result.value, 5.5);
assert.equal(phytoplanktonDecline.reviewed.result.grade.letter, 'C');
assert.equal(phytoplanktonDecline.reviewed.result.confidence, 'B');
assert.equal(phytoplanktonDecline.reviewed.result.uncertainty.lower, 4.8);
assert.equal(phytoplanktonDecline.reviewed.result.uncertainty.upper, 7);
assert.deepEqual(phytoplanktonDecline.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 3, persistence: 2 });
assert.equal(phytoplanktonDecline.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert(phytoplanktonDecline.reviewed.candidate.components.ecosystem.evidenceReferences.includes('silsbe_global_npp_decline_2025'));
assert.match(phytoplanktonDecline.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /7\.4% cumulative global loss enters severity once/i);
assert.match(phytoplanktonDecline.finding, /downstream fish-supply effects/i);
const riverFragmentation = allById.get('riverine_habitat_fragmentation');
assert.equal(riverFragmentation.reviewMode, 'detailed_evidence_review');
assert.deepEqual(riverFragmentation.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(riverFragmentation.reviewed.candidate.components.human.structuralZero, true);
assert.equal(riverFragmentation.reviewed.result.value, 7);
assert.equal(riverFragmentation.reviewed.result.grade.letter, 'D');
assert.equal(riverFragmentation.reviewed.result.confidence, 'C');
assert.equal(riverFragmentation.reviewed.result.uncertainty.lower, 5.5);
assert.equal(riverFragmentation.reviewed.result.uncertainty.upper, 8.5);
assert.deepEqual(riverFragmentation.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 3 });
assert.equal(riverFragmentation.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert(riverFragmentation.reviewed.candidate.components.ecosystem.evidenceReferences.includes('tamario_diadromous_fragmentation_meta_analysis_2025'));
assert.match(riverFragmentation.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /63% long-river share enters reach once/i);
assert.match(riverFragmentation.finding, /central result remains D 7\.0/i);
const harmfulAlgalBlooms = allById.get('harmful_algal_blooms');
assert.equal(harmfulAlgalBlooms.reviewMode, 'detailed_evidence_review');
assert.deepEqual(harmfulAlgalBlooms.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.equal(harmfulAlgalBlooms.reviewed.result.value, 5.5);
assert.equal(harmfulAlgalBlooms.reviewed.result.grade.letter, 'C');
assert.equal(harmfulAlgalBlooms.reviewed.result.confidence, 'C');
assert.equal(harmfulAlgalBlooms.reviewed.result.uncertainty.lower, 3.6);
assert.equal(harmfulAlgalBlooms.reviewed.result.uncertainty.upper, 7.4);
assert.deepEqual(harmfulAlgalBlooms.reviewed.candidate.components.human.central, { severity: 2, reach: 2, persistence: 2 });
assert.deepEqual(harmfulAlgalBlooms.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert(harmfulAlgalBlooms.reviewed.candidate.components.human.evidenceReferences.includes('fao_who_ciguatera_expert_meeting_2020'));
assert(harmfulAlgalBlooms.reviewed.candidate.components.ecosystem.evidenceReferences.includes('murray_south_australia_hab_mortality_2026'));
assert.match(harmfulAlgalBlooms.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /34-year record.*do not add points/i);
assert.match(harmfulAlgalBlooms.finding, /monitoring geography as reach/i);
const rapidRunoffResponse = allById.get('hydrological_runoff_surges');
assert.equal(rapidRunoffResponse.reviewMode, 'detailed_evidence_review');
assert.deepEqual(rapidRunoffResponse.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.equal(rapidRunoffResponse.reviewed.result.value, 4.8);
assert.equal(rapidRunoffResponse.reviewed.result.grade.letter, 'C');
assert.equal(rapidRunoffResponse.reviewed.result.confidence, 'C');
assert.equal(rapidRunoffResponse.reviewed.result.uncertainty.lower, 2.9);
assert.equal(rapidRunoffResponse.reviewed.result.uncertainty.upper, 7);
assert.deepEqual(rapidRunoffResponse.reviewed.candidate.components.human.central, { severity: 3, reach: 3, persistence: 1 });
assert.deepEqual(rapidRunoffResponse.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 1 });
assert(rapidRunoffResponse.reviewed.candidate.components.human.evidenceReferences.includes('tellman_global_flood_database_2021'));
assert(rapidRunoffResponse.reviewed.candidate.components.ecosystem.evidenceReferences.includes('sabater_river_extremes_meta_analysis_2023'));
assert.match(rapidRunoffResponse.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /satellite exposure/i);
assert.match(rapidRunoffResponse.finding, /global reach and chronic persistence without source support/i);
const tundraMethane = allById.get('tundra_methane_outgassing');
assert.equal(tundraMethane.reviewMode, 'detailed_evidence_review');
assert.equal(tundraMethane.reviewed.result.value, 6.6);
assert.equal(tundraMethane.reviewed.result.grade.letter, 'D');
assert.equal(tundraMethane.reviewed.result.confidence, 'D');
assert.equal(tundraMethane.reviewed.result.uncertainty.lower, 4.4);
assert.equal(tundraMethane.reviewed.result.uncertainty.upper, 8.9);
assert.deepEqual([tundraMethane.reviewed.candidate.currentWindow.start, tundraMethane.reviewed.candidate.currentWindow.end], [2010, 2021]);
assert.equal(tundraMethane.reviewed.candidate.currentWindow.summaryMethod, 'annualized_flow');
assert.equal(tundraMethane.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert.equal(tundraMethane.reviewed.candidate.causalAllocation.attributionStatus, 'unresolved');
assert.equal(tundraMethane.reviewed.candidate.causalAllocation.inheritsAggregateScore, false);
assert.equal(tundraMethane.reviewed.candidate.causalAllocation.researchRecord, 'artifacts/tulip-calibration-2026-09-22/internal-emission-source-allocation.json');
assert.equal(tundraMethane.reviewed.candidate.causalAllocation.sourceEvidenceRecord, 'artifacts/tulip-calibration-2026-09-22/tundra-methane-reference-snapshot.json');
assert.deepEqual(tundraMethane.reviewed.candidate.components.human.familyFallback.analogueNodeIds, ['methane', 'permafrost_thaw']);
assert.deepEqual(tundraMethane.reviewed.candidate.components.ecosystem.familyFallback.analogueNodeIds, ['methane', 'permafrost_thaw']);
assert.equal(tundraMethane.reviewed.candidate.decisionTrace.axisBasis.human.severity.sourceAnchored, false);
assert.equal(tundraMethane.reviewed.candidate.decisionTrace.axisBasis.ecosystem.severity.sourceAnchored, false);
assert.match(tundraMethane.reviewed.candidate.decisionTrace.measurementSemantics.severity, /Gross Tg CH4 is a physical input only/i);
assert.match(tundraMethane.finding, /six harm axes remain explicitly family-calibrated/i);
const wildfireRegimeShift = allById.get('wildfire_regime_shift');
assert.equal(wildfireRegimeShift.reviewMode, 'detailed_evidence_review');
assert.equal(wildfireRegimeShift.reviewed.result.value, 7);
assert.equal(wildfireRegimeShift.reviewed.result.grade.letter, 'D');
assert.equal(wildfireRegimeShift.reviewed.result.confidence, 'B');
assert.equal(wildfireRegimeShift.reviewed.result.uncertainty.lower, 5.9);
assert.equal(wildfireRegimeShift.reviewed.result.uncertainty.upper, 8.1);
assert.deepEqual(wildfireRegimeShift.reviewed.candidate.components.human.central, { severity: 4, reach: 2, persistence: 4 });
assert.deepEqual(wildfireRegimeShift.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert(wildfireRegimeShift.reviewed.candidate.components.human.evidenceReferences.includes('park_fire_pm25_mortality_climate_attribution_2024'));
assert(wildfireRegimeShift.reviewed.candidate.components.ecosystem.evidenceReferences.includes('lv_global_large_fire_forest_recovery_2025'));
assert.match(wildfireRegimeShift.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /12,566 climate-attributed deaths/i);
assert.match(wildfireRegimeShift.finding, /range B–E.*range C–D/i);
for (const nodeId of ['biodiversity_intactness_loss']) {
  const row = allById.get(nodeId).reviewed;
  for (const dimension of row.candidate.applicableDomains) {
    const persistence = row.candidate.decisionTrace.axisBasis[dimension].persistence;
    assert.equal(persistence.sourceAnchored, false, `${nodeId}: elapsed source span must not anchor ${dimension} persistence`);
    assert.doesNotMatch(persistence.basis, /source documents [\d.]+ years/i, `${nodeId}: record length must not be described as consequence duration`);
  }
}
assert.equal(seagrassMeadowDecline.reviewed.candidate.decisionTrace.axisBasis.ecosystem.persistence.sourceAnchored, true);
assert.match(seagrassMeadowDecline.reviewed.candidate.decisionTrace.axisBasis.ecosystem.persistence.basis, /statistically recovered after 7 years/i);
const mangrove = allById.get('mangrove_buffer_loss').reviewed;
assert.equal(mangrove.result.value, 5.9);
assert.equal(mangrove.result.grade.letter, 'C');
assert.equal(mangrove.result.uncertainty.lower, 4.8);
assert.equal(mangrove.result.uncertainty.upper, 8.1);
assert.deepEqual([mangrove.candidate.currentWindow.start, mangrove.candidate.currentWindow.end], [2016, 2025]);
assert.deepEqual(mangrove.candidate.components.human.central, { severity: 2, reach: 2, persistence: 2 });
assert.deepEqual(mangrove.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert.equal(mangrove.candidate.components.ecosystem.central.reach, 2);
assert.match(mangrove.candidate.decisionTrace.axisBasis.ecosystem.reach.basis, /6\.183745%/);
assert.equal(mangrove.candidate.decisionTrace.axisBasis.human.persistence.sourceAnchored, false);
assert.equal(mangrove.candidate.decisionTrace.axisBasis.ecosystem.persistence.sourceAnchored, true);
assert.match(mangrove.candidate.decisionTrace.axisBasis.ecosystem.persistence.basis, /20 years.*40 years/i);
assert.match(mangrove.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /25\.01% MCPI change enters ecosystem severity/i);
assert.match(mangrove.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /fifteen million people.*not counted as current harm/i);
assert(mangrove.candidate.history.evidenceReferences.includes('global_mangrove_watch_v4112'));
assert(mangrove.candidate.history.evidenceReferences.includes('xu_global_mangrove_coastal_protection_index_2024'));
assert(mangrove.candidate.history.evidenceReferences.includes('chen_coastal_wetland_carbon_nitrogen_recovery_2025'));
assert.equal(allById.get('marine_fisheries_collapse').reviewed.result.grade.letter, 'D');
assert.equal(allById.get('temp').reviewMode, 'detailed_evidence_review');
assert.equal(allById.get('temp').reviewed.result.value, 9.3);
for (const nodeId of ['temp', 'methane', 'deforestation', 'industry_farming', 'carbon_emission', 'groundwater_depletion', 'drought_persistence', 'sea_ice_season_loss', 'ocean_acidification', 'coral_bleaching', 'sea_level_rise']) {
  const candidate = allById.get(nodeId).reviewed.candidate;
  assert.equal(candidate.decisionTrace.method, 'detailed_evidence_review', nodeId);
  for (const dimension of candidate.applicableDomains) {
    for (const axis of ['severity', 'reach', 'persistence']) {
      assert.match(candidate.decisionTrace.axisBasis[dimension][axis].basis, /\S/, `${nodeId}: ${dimension}.${axis}`);
    }
  }
}
assert.match(allById.get('coral_bleaching').reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /84\.4%.*exposure.*observed damage/i);
assert.equal(allById.get('biodiversity_intactness_loss').reviewed.result.value, 7.8);
assert.equal(allById.get('biodiversity_intactness_loss').reviewed.result.grade.letter, 'D');
assert.equal(allById.get('biodiversity_intactness_loss').reviewed.candidate.components.ecosystem.central.severity, 2);
assert.match(allById.get('biodiversity_intactness_loss').reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /20%.*severity.*75%.*reach/i);
assert.equal(allById.get('cattle_grazing_overcompaction').reviewed.result.value, 6.3);
assert.deepEqual(allById.get('cattle_grazing_overcompaction').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('cattle_grazing_overcompaction').reviewed.candidate.components.ecosystem.central.severity, 4);
const insectDecline = allById.get('insect_biomass_decline').reviewed;
assert.equal(insectDecline.result.value, 7);
assert.equal(insectDecline.result.grade.letter, 'D');
assert.deepEqual(insectDecline.candidate.applicableDomains, ['ecosystem']);
assert.deepEqual(insectDecline.candidate.currentWindow, {
  start: 2020,
  end: 2021,
  coverageStatus: 'partial',
  summaryMethod: 'period_prevalence',
  coverageNote: 'The newest directly comparable standardized biomass observations cover 21 German protected areas. They update regional condition but do not represent a global sample.',
  isLatestAvailable: true,
  recencyCheckedOn: '2026-09-23',
  recencyRationale: 'The 2024 direct biomass study is the newest compatible standardized condition measurement located; a 2025 reanalysis is retained for methodological uncertainty and attribution.',
  normalization: 'Compare biomass only within compatible Malaise-trap protocols and declared habitats. Keep abundance, biomass, site coverage and ecosystem function as separate quantities.',
});
assert.deepEqual(insectDecline.candidate.components.ecosystem.central, { severity: 3, reach: 2, persistence: 3 });
assert.match(insectDecline.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /not compounded/i);
assert.match(insectDecline.candidate.decisionTrace.axisBasis.ecosystem.reach.basis, /cannot be geographically extrapolated/i);
const peatland = allById.get('peatland_degradations').reviewed;
assert.equal(peatland.result.value, 7.8);
assert.equal(peatland.result.grade.letter, 'D');
assert.equal(peatland.result.uncertainty.lower, 5.5);
assert.equal(peatland.result.uncertainty.upper, 9.3);
assert.deepEqual(peatland.candidate.applicableDomains, ['ecosystem']);
assert.deepEqual(peatland.candidate.components.ecosystem.central, { severity: 3, reach: 3, persistence: 3 });
assert.match(peatland.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /12% figure enters reach only/i);
assert.match(peatland.candidate.decisionTrace.axisBasis.ecosystem.persistence.basis, /151 Finnish boreal sites/i);
assert.doesNotMatch(peatland.candidate.decisionTrace.axisBasis.ecosystem.persistence.basis, /120 years/i);
const coldChain = allById.get('cold_chain_failure_risk').reviewed;
assert.equal(coldChain.result.value, 5.5);
assert.equal(coldChain.result.grade.letter, 'C');
assert.equal(coldChain.result.uncertainty.lower, 3.3);
assert.equal(coldChain.result.uncertainty.upper, 7.8);
assert.deepEqual(coldChain.candidate.applicableDomains, ['human']);
assert.deepEqual(coldChain.candidate.components.human.central, { severity: 2, reach: 2, persistence: 2 });
assert.match(coldChain.candidate.decisionTrace.measurementSemantics.reach, /not a harmed-population denominator/i);
assert.match(coldChain.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /one-billion-person equivalent/i);
const damDiversion = allById.get('dam_and_diversion_infrastructure').reviewed;
assert.equal(damDiversion.result.value, 6.6);
assert.equal(damDiversion.result.grade.letter, 'D');
assert.equal(damDiversion.result.uncertainty.lower, 4.8);
assert.equal(damDiversion.result.uncertainty.upper, 8.1);
assert.equal(damDiversion.result.confidence, 'C');
assert.deepEqual(damDiversion.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(damDiversion.candidate.components.human.central, { severity: 2, reach: 2, persistence: 3 });
assert.deepEqual(damDiversion.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 3 });
assert.match(damDiversion.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /158-million-person service scope is excluded/i);
assert.match(damDiversion.candidate.decisionTrace.axisBasis.ecosystem.reach.basis, /63% of rivers longer than 1,000 kilometres/i);
assert.doesNotMatch(damDiversion.candidate.decisionTrace.axisBasis.human.reach.basis, /158,000,000 people/i);
assert.equal(damDiversion.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
const trophicCascade = allById.get('trophic_cascade_collapses').reviewed;
assert.equal(trophicCascade.result.value, 5.5);
assert.equal(trophicCascade.result.grade.letter, 'C');
assert.equal(trophicCascade.result.uncertainty.lower, 3.3);
assert.equal(trophicCascade.result.uncertainty.upper, 7.8);
assert.equal(trophicCascade.result.confidence, 'C');
assert.deepEqual(trophicCascade.candidate.applicableDomains, ['ecosystem']);
assert.deepEqual(trophicCascade.candidate.components.ecosystem.central, { severity: 3, reach: 1, persistence: 2 });
assert.equal(trophicCascade.candidate.components.human.structuralZero, true);
assert.match(trophicCascade.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /study coverage does not become reach/i);
assert.match(trophicCascade.candidate.decisionTrace.axisBasis.ecosystem.reach.basis, /study-coverage counts rather than a fraction/i);
assert.equal(trophicCascade.candidate.decisionTrace.latestCompatibleEvidenceYear, 2024);
const watershedForestLoss = allById.get('watershed_forest_loss').reviewed;
assert.equal(watershedForestLoss.result.value, 5.5);
assert.equal(watershedForestLoss.result.grade.letter, 'C');
assert.equal(watershedForestLoss.result.uncertainty.lower, 3.6);
assert.equal(watershedForestLoss.result.uncertainty.upper, 7.8);
assert.equal(watershedForestLoss.result.confidence, 'C');
assert.deepEqual(watershedForestLoss.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(watershedForestLoss.candidate.components.human.central, { severity: 2, reach: 2, persistence: 1 });
assert.deepEqual(watershedForestLoss.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert.match(watershedForestLoss.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /794,517 observations as cases/i);
assert.match(watershedForestLoss.candidate.decisionTrace.axisBasis.human.persistence.basis, /previous two weeks/i);
assert.equal(watershedForestLoss.candidate.decisionTrace.latestCompatibleEvidenceYear, 2025);
for (const nodeId of ['insect_biomass_decline', 'trophic_cascade_collapses', 'genetic_diversity_bottlenecks']) {
  assert.doesNotMatch(allById.get(nodeId).reviewed.candidate.decisionTrace.axisBasis.ecosystem.severity.basis, /source reports 25%/i, nodeId);
}
assert.equal(allById.get('amoc').reviewed.result.value, 4);
assert.equal(allById.get('amoc').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('amoc').reviewed.result.uncertainty.lower, 1);
assert.equal(allById.get('amoc').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('amoc').reviewed.result.confidence, 'C');
assert.equal(allById.get('amoc').reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.equal(allById.get('amoc').reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert.equal(allById.get('permafrost_thaw').reviewed.result.value, 5.9);
assert.equal(allById.get('permafrost_thaw').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('permafrost_thaw').reviewed.result.uncertainty.lower, 3.6);
assert.equal(allById.get('permafrost_thaw').reviewed.result.uncertainty.upper, 8.1);
assert.equal(allById.get('permafrost_thaw').reviewed.result.confidence, 'C');
assert.equal(allById.get('permafrost_thaw').reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.equal(allById.get('permafrost_thaw').reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert(allById.get('permafrost_thaw').reviewed.candidate.history.evidenceReferences.includes('isimip3a_permafrost_thaw_counterfactual_2026'));
assert(allById.get('permafrost_thaw').reviewed.candidate.history.evidenceReferences.includes('nps_adc_permafrost_rusting_rivers_2024_2025'));
assert(allById.get('permafrost_thaw').reviewed.candidate.components.ecosystem.evidenceReferences.includes('nps_adc_permafrost_rusting_rivers_2024_2025'));
assert.match(allById.get('permafrost_thaw').finding, /score and B–D interval do not change|remains C 5\.9/i);
assert.equal(allById.get('thermokarst_expansion').reviewMode, 'detailed_evidence_review');
assert.equal(allById.get('thermokarst_expansion').reviewed.result.value, 6.3);
assert.equal(allById.get('thermokarst_expansion').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('thermokarst_expansion').reviewed.result.uncertainty.lower, 4);
assert.equal(allById.get('thermokarst_expansion').reviewed.result.uncertainty.upper, 8.1);
assert.equal(allById.get('thermokarst_expansion').reviewed.result.confidence, 'C');
assert.equal(allById.get('thermokarst_expansion').reviewed.candidate.components.human.central.reach, 1);
assert.equal(allById.get('thermokarst_expansion').reviewed.candidate.components.ecosystem.central.reach, 1);
assert.equal(allById.get('thermokarst_expansion').reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2025);
assert.equal(allById.get('thermokarst_expansion').oldEvidenceOpen, false);
assert(allById.get('thermokarst_expansion').reviewed.candidate.history.evidenceReferences.includes('abolt_circumpolar_thermokarst_pool_expansion_2024'));
assert(allById.get('thermokarst_expansion').reviewed.candidate.components.human.evidenceReferences.includes('jones_point_lay_thermokarst_infrastructure_2025'));
assert(allById.get('thermokarst_expansion').reviewed.candidate.components.ecosystem.evidenceReferences.includes('jorgenson_tundra_ecosystem_transformation_2022'));
assert(allById.get('thermokarst_expansion').reviewed.candidate.components.ecosystem.evidenceReferences.includes('budy_arctic_lake_thermokarst_recovery_2025'));
assert.match(allById.get('thermokarst_expansion').finding, /authored global reach|changes from D 7\.0/i);
assert.equal(allById.get('sea_level_rise').reviewed.result.value, 8.5);
assert.equal(allById.get('marine_heatwaves').reviewed.result.value, 4.8);
assert.equal(allById.get('marine_heatwaves').reviewed.result.grade.letter, 'C');
assert.deepEqual(allById.get('marine_heatwaves').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('wet_bulb_heat').reviewed.result.value, 4.8);
assert.equal(allById.get('wet_bulb_heat').reviewed.result.grade.letter, 'C');
assert.deepEqual(allById.get('wet_bulb_heat').reviewed.candidate.applicableDomains, ['human']);
assert.equal(allById.get('coral_larval_mortality').reviewed.result.value, 4.8);
assert.equal(allById.get('coral_larval_mortality').reviewed.result.grade.letter, 'C');
assert.deepEqual(allById.get('coral_larval_mortality').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('pyrocumulonimbus_smoke_injection').reviewed.result.value, 5.5);
assert.equal(allById.get('pyrocumulonimbus_smoke_injection').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('pyrocumulonimbus_smoke_injection').reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert.deepEqual(allById.get('pyrocumulonimbus_smoke_injection').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('forest_fragmentation').reviewed.result.value, 6.3);
assert.equal(allById.get('forest_fragmentation').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('forest_fragmentation').reviewed.result.confidence, 'B');
assert.equal(allById.get('forest_fragmentation').reviewed.result.uncertainty.lower, 4.8);
assert.equal(allById.get('forest_fragmentation').reviewed.result.uncertainty.upper, 7.8);
assert.deepEqual(allById.get('forest_fragmentation').reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert.deepEqual(allById.get('forest_fragmentation').reviewed.candidate.components.ecosystem.lower, { severity: 1, reach: 1, persistence: 3 });
assert.deepEqual(allById.get('forest_fragmentation').reviewed.candidate.components.ecosystem.upper, { severity: 3, reach: 3, persistence: 3 });
assert.deepEqual(allById.get('forest_fragmentation').reviewed.candidate.applicableDomains, ['ecosystem']);
const bridgeScour = allById.get('bridge_scour_exposure');
assert.equal(bridgeScour.reviewMode, 'detailed_evidence_review');
assert.equal(bridgeScour.reviewed.result.value, 3.3);
assert.equal(bridgeScour.reviewed.result.grade.letter, 'B');
assert.equal(bridgeScour.reviewed.result.confidence, 'C');
assert.equal(bridgeScour.reviewed.result.uncertainty.lower, 1);
assert.equal(bridgeScour.reviewed.result.uncertainty.upper, 5.5);
assert.deepEqual(bridgeScour.reviewed.candidate.applicableDomains, ['human']);
assert.equal(bridgeScour.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(bridgeScour.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert(bridgeScour.reviewed.candidate.components.human.evidenceReferences.includes('fhwa_nbi_highway_bridges_2025'));
assert.match(bridgeScour.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Traffic crossings do not enter reach/i);
assert.match(bridgeScour.finding, /range A–D.*range A–C/i);
const coastalGroundwaterWithdrawal = allById.get('coastal_groundwater_withdrawal');
assert.equal(coastalGroundwaterWithdrawal.reviewMode, 'detailed_evidence_review');
assert.equal(coastalGroundwaterWithdrawal.reviewed.result.value, 6.3);
assert.equal(coastalGroundwaterWithdrawal.reviewed.result.grade.letter, 'C');
assert.equal(coastalGroundwaterWithdrawal.reviewed.result.confidence, 'C');
assert.equal(coastalGroundwaterWithdrawal.reviewed.result.uncertainty.lower, 4.8);
assert.equal(coastalGroundwaterWithdrawal.reviewed.result.uncertainty.upper, 7.4);
assert.deepEqual(coastalGroundwaterWithdrawal.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(coastalGroundwaterWithdrawal.reviewed.candidate.components.human.central, { severity: 2, reach: 2, persistence: 4 });
assert.deepEqual(coastalGroundwaterWithdrawal.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert(coastalGroundwaterWithdrawal.reviewed.candidate.components.human.evidenceReferences.includes('usgs_cape_may_groundwater_allocation_2020'));
assert(coastalGroundwaterWithdrawal.reviewed.candidate.components.human.evidenceReferences.includes('usgs_virginia_coastal_plain_groundwater_budgets_2026'));
assert(coastalGroundwaterWithdrawal.reviewed.candidate.components.human.evidenceReferences.includes('cape_may_water_treatment_project_narrative_2025'));
assert.equal(coastalGroundwaterWithdrawal.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert.equal(coastalGroundwaterWithdrawal.oldEvidenceOpen, false);
assert.match(coastalGroundwaterWithdrawal.reviewed.candidate.history.recentState, /slightly under 7%/i);
assert.match(coastalGroundwaterWithdrawal.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Accounts, wells, aquifers, communities.*not added as people/i);
assert.match(coastalGroundwaterWithdrawal.finding, /five-aquifer-as-five-people/i);
for (const nodeId of ['coastal_aquifer_degradation', 'coastal_saltwater_intrusion']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 6.3, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'C', nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 4.8, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 7.4, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.human.central, { severity: 2, reach: 2, persistence: 4 }, nodeId);
  assert(row.reviewed.candidate.components.human.evidenceReferences.includes('cape_may_water_treatment_project_narrative_2025'), nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Do not add.*global low-lying-coast population/i, nodeId);
  assert.match(row.finding, /900 million people exposed.*people harmed/i, nodeId);
}
for (const [nodeId, confidence] of [
  ['coastal_inundation_risk', 'C'],
  ['littoral_surge_vulnerability', 'D'],
  ['compound_coastal_flooding', 'D'],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 3.3, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.confidence, confidence, nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 1, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 5.5, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['human'], nodeId);
  assert.deepEqual(row.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 }, nodeId);
  assert.equal(row.reviewed.candidate.components.ecosystem.structuralZero, true, nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.reach, /900 million.*14 million.*already harmed/i, nodeId);
  if (confidence === 'D') assert(row.reviewed.candidate.components.human.familyFallback, nodeId);
}
for (const nodeId of ['delta_salt_intrusion_fronts', 'freshwater_lens_compression']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 4.8, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'C', nodeId);
  assert.equal(row.reviewed.result.confidence, 'D', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 2.5, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 7.4, nodeId);
  assert(row.reviewed.candidate.components.human.familyFallback, nodeId);
  assert.match(row.finding, /source does not measure/i, nodeId);
}
const coastalErosion = allById.get('coastal_erosion');
assert.equal(coastalErosion.reviewMode, 'detailed_evidence_review');
assert.equal(coastalErosion.reviewed.result.value, 6.3);
assert.equal(coastalErosion.reviewed.result.grade.letter, 'C');
assert.equal(coastalErosion.reviewed.result.confidence, 'D');
assert.deepEqual(coastalErosion.reviewed.candidate.applicableDomains, ['ecosystem']);
assert(coastalErosion.reviewed.candidate.components.ecosystem.familyFallback);
assert.match(coastalErosion.finding, /sea-level and human-exposure source/i);
const nutrientPollution = allById.get('nutrient_pollution');
assert.equal(nutrientPollution.reviewMode, 'detailed_evidence_review');
assert.equal(nutrientPollution.reviewed.result.value, 4);
assert.equal(nutrientPollution.reviewed.result.grade.letter, 'B');
assert.equal(nutrientPollution.reviewed.result.confidence, 'C');
assert.deepEqual(nutrientPollution.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(nutrientPollution.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 });
assert.match(nutrientPollution.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Do not use nutrient tonnage.*fisheries dependence/i);
const nitrogenRunoff = allById.get('nitrogen_fertilizer_runoff');
assert.equal(nitrogenRunoff.reviewMode, 'detailed_evidence_review');
assert.equal(nitrogenRunoff.reviewed.result.value, 3.3);
assert.equal(nitrogenRunoff.reviewed.result.grade.letter, 'B');
assert.deepEqual(nitrogenRunoff.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(nitrogenRunoff.reviewed.candidate.components.human.structuralZero, true);
assert.match(nitrogenRunoff.finding, /fertilizer-input share.*ecosystem loss/i);
for (const [nodeId, value, grade, confidence] of [
  ['estuary_eutrophication', 4, 'B', 'C'],
  ['anoxic_dead_zones', 4.8, 'C', 'C'],
  ['shelf_sea_hypoxia', 4, 'B', 'D'],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, value, nodeId);
  assert.equal(row.reviewed.result.grade.letter, grade, nodeId);
  assert.equal(row.reviewed.result.confidence, confidence, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['ecosystem'], nodeId);
  assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  assert.equal(row.reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2008, nodeId);
  assert.equal(row.oldEvidenceOpen, true, nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Do not turn 405 or 500 sites into area/i, nodeId);
}
assert(allById.get('shelf_sea_hypoxia').reviewed.candidate.components.ecosystem.familyFallback);
const aquiferOverdraft = allById.get('aquifer_overdraft');
assert.equal(aquiferOverdraft.reviewMode, 'detailed_evidence_review');
assert.equal(aquiferOverdraft.reviewed.result.value, 3.6);
assert.equal(aquiferOverdraft.reviewed.result.grade.letter, 'B');
assert.deepEqual(aquiferOverdraft.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.match(aquiferOverdraft.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Do not use urban population supplied.*global coverage/i);
for (const nodeId of ['agricultural_groundwater_withdrawal', 'municipal_groundwater_withdrawal', 'irrigation_water_inefficiency']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 3.3, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['ecosystem'], nodeId);
  assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  assert.match(row.finding, /dependence, global coverage and elapsed assessment time.*terminal harm/i, nodeId);
}
for (const nodeId of ['urban_hydrologic_supply_shortfall', 'urban_source_water_treatment_constraint', 'drinking_water_treatment_stress']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 4.8, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'C', nodeId);
  assert.equal(row.reviewed.result.confidence, 'D', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 2.5, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 8.5, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['human'], nodeId);
  assert(row.reviewed.candidate.components.human.familyFallback, nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /alternative causal views.*Do not add their ratings/i, nodeId);
  assert.match(row.finding, /2\.1 billion.*24-year monitoring span/i, nodeId);
}
const polarInfrastructure = allById.get('polar_infrastructure_failure');
assert.equal(polarInfrastructure.reviewMode, 'detailed_evidence_review');
assert.equal(polarInfrastructure.reviewed.result.value, 3.3);
assert.equal(polarInfrastructure.reviewed.result.grade.letter, 'B');
assert.equal(polarInfrastructure.reviewed.result.confidence, 'D');
assert.deepEqual(polarInfrastructure.reviewed.candidate.applicableDomains, ['human']);
assert.match(polarInfrastructure.finding, /2050 infrastructure-exposure projection.*current failure/i);
for (const [nodeId, confidence] of [['snowpack_dust_soot_coverage', 'D'], ['soot_deposition_on_snow', 'C']]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 3.3, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.confidence, confidence, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['ecosystem'], nodeId);
  assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  assert.match(row.finding, /radiative forcing.*700 million residents.*industrial-era reference span/i, nodeId);
}
const shippingLane = allById.get('shipping_lane_disruption');
assert.equal(shippingLane.reviewMode, 'detailed_evidence_review');
assert.equal(shippingLane.reviewed.result.value, 4);
assert.equal(shippingLane.reviewed.result.grade.letter, 'B');
assert.equal(shippingLane.reviewed.result.confidence, 'C');
assert.match(shippingLane.finding, /seaborne trade is exposure/i);
const shipping = allById.get('shipping');
assert.equal(shipping.reviewMode, 'detailed_evidence_review');
assert.equal(shipping.reviewed.result.value, 3.3);
assert.equal(shipping.reviewed.result.grade.letter, 'B');
assert.deepEqual(shipping.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.match(shipping.finding, /fleet activity and world-trade scope.*terminal human and ecosystem harm/i);
const portHeat = allById.get('port_heat_vulnerability');
assert.equal(portHeat.reviewMode, 'detailed_evidence_review');
assert.equal(portHeat.reviewed.result.value, 3.3);
assert.equal(portHeat.reviewed.result.grade.letter, 'B');
assert.equal(portHeat.reviewed.result.confidence, 'D');
assert.match(portHeat.finding, /no port-heat metric/i);
const pesticideDrift = allById.get('pesticide_spray_drift_zones');
assert.equal(pesticideDrift.reviewMode, 'detailed_evidence_review');
assert.equal(pesticideDrift.reviewed.result.value, 4.4);
assert.equal(pesticideDrift.reviewed.result.grade.letter, 'B');
assert.equal(pesticideDrift.reviewed.result.confidence, 'D');
assert.match(pesticideDrift.finding, /385-million poisoning estimate.*no longer assigned to spray drift/i);
const pesticideBioaccumulation = allById.get('pesticide_bioaccumulation_chains');
assert.equal(pesticideBioaccumulation.reviewed.result.value, 4.8);
assert.equal(pesticideBioaccumulation.reviewed.result.grade.letter, 'C');
assert.equal(pesticideBioaccumulation.reviewed.result.confidence, 'D');
assert.deepEqual(pesticideBioaccumulation.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.match(pesticideBioaccumulation.finding, /do not measure bioaccumulation/i);
const agrochemicalWater = allById.get('agrochemical_water_sinks');
assert.equal(agrochemicalWater.reviewed.result.value, 4);
assert.equal(agrochemicalWater.reviewed.result.grade.letter, 'B');
assert.equal(agrochemicalWater.reviewed.result.confidence, 'D');
assert.match(agrochemicalWater.finding, /no water-residue mass or aquatic-condition endpoint/i);
const floodplainExposure = allById.get('floodplain_exposure');
assert.equal(floodplainExposure.reviewMode, 'detailed_evidence_review');
assert.equal(floodplainExposure.reviewed.result.value, 3.3);
assert.equal(floodplainExposure.reviewed.result.grade.letter, 'B');
assert.equal(floodplainExposure.reviewed.result.confidence, 'C');
assert.equal(floodplainExposure.reviewed.result.uncertainty.lower, 1);
assert.equal(floodplainExposure.reviewed.result.uncertainty.upper, 5.5);
assert.deepEqual(floodplainExposure.reviewed.candidate.applicableDomains, ['human']);
assert.equal(floodplainExposure.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(floodplainExposure.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert(floodplainExposure.reviewed.candidate.components.human.evidenceReferences.includes('roderick_global_flood_vulnerability_adjusted_risk_2024'));
assert.match(floodplainExposure.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /alternative threshold checks/i);
assert.match(floodplainExposure.finding, /exposure.*distinct from realized harm/i);
const urbanization = allById.get('urbanization');
assert.equal(urbanization.reviewMode, 'detailed_evidence_review');
assert.equal(urbanization.reviewed.result.value, 5.1);
assert.equal(urbanization.reviewed.result.grade.letter, 'C');
assert.equal(urbanization.reviewed.result.confidence, 'C');
assert.equal(urbanization.reviewed.result.uncertainty.lower, 2.9);
assert.equal(urbanization.reviewed.result.uncertainty.upper, 7.8);
assert.deepEqual(urbanization.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(urbanization.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(urbanization.reviewed.candidate.components.ecosystem.central, { severity: 3, reach: 1, persistence: 3 });
assert(urbanization.reviewed.candidate.components.human.evidenceReferences.includes('un_world_urbanization_prospects_2025_summary'));
assert.match(urbanization.reviewed.candidate.decisionTrace.measurementSemantics.reach, /not residents/i);
assert.match(urbanization.finding, /6\.25 billion urban residents/i);
const groundwaterDepletion = allById.get('groundwater_depletion_wells');
assert.equal(groundwaterDepletion.reviewMode, 'detailed_evidence_review');
assert.equal(groundwaterDepletion.reviewed.result.value, 5.1);
assert.equal(groundwaterDepletion.reviewed.result.grade.letter, 'C');
assert.equal(groundwaterDepletion.reviewed.result.confidence, 'C');
assert.equal(groundwaterDepletion.reviewed.result.uncertainty.lower, 2.9);
assert.equal(groundwaterDepletion.reviewed.result.uncertainty.upper, 7.8);
assert.deepEqual(groundwaterDepletion.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(groundwaterDepletion.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(groundwaterDepletion.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert(groundwaterDepletion.reviewed.candidate.components.ecosystem.evidenceReferences.includes('jasechko_global_groundwater_levels_2024'));
assert.match(groundwaterDepletion.reviewed.candidate.decisionTrace.measurementSemantics.reach, /75%.*study countries.*not 75%.*harmed/i);
assert.match(groundwaterDepletion.finding, /false level-4 ecosystem reach/i);
const desalinationDependence = allById.get('desalination_dependence');
assert.equal(desalinationDependence.reviewMode, 'detailed_evidence_review');
assert.equal(desalinationDependence.reviewed.result.value, 4);
assert.equal(desalinationDependence.reviewed.result.grade.letter, 'B');
assert.equal(desalinationDependence.reviewed.result.confidence, 'C');
assert.equal(desalinationDependence.reviewed.result.uncertainty.lower, 2.1);
assert.equal(desalinationDependence.reviewed.result.uncertainty.upper, 6.3);
assert.deepEqual(desalinationDependence.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(desalinationDependence.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.deepEqual(desalinationDependence.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 2 });
assert(desalinationDependence.reviewed.candidate.components.human.evidenceReferences.includes('world_bank_the_role_of_desalination_in_an_increasingly_water_scarce_world'));
assert.match(desalinationDependence.reviewed.candidate.decisionTrace.measurementSemantics.reach, /not people supplied/i);
assert.match(desalinationDependence.finding, /300 million people supplied/i);
const gasPowerDependence = allById.get('gas_power_dependence');
assert.equal(gasPowerDependence.reviewMode, 'detailed_evidence_review');
assert.equal(gasPowerDependence.reviewed.result.value, 3.3);
assert.equal(gasPowerDependence.reviewed.result.grade.letter, 'B');
assert.equal(gasPowerDependence.reviewed.result.confidence, 'C');
assert.equal(gasPowerDependence.reviewed.result.uncertainty.lower, 1);
assert.equal(gasPowerDependence.reviewed.result.uncertainty.upper, 5.5);
assert.deepEqual(gasPowerDependence.reviewed.candidate.applicableDomains, ['human']);
assert.equal(gasPowerDependence.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(gasPowerDependence.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert(gasPowerDependence.reviewed.candidate.components.human.evidenceReferences.includes('iea_world_energy_outlook_2022_gas_power_affordability'));
assert.match(gasPowerDependence.reviewed.candidate.decisionTrace.measurementSemantics.reach, /generation share.*do not supply/i);
assert.match(gasPowerDependence.finding, /B 4\.4 to B 3\.3/i);
const hydropowerReliability = allById.get('hydropower_reliability_decline');
assert.equal(hydropowerReliability.reviewMode, 'detailed_evidence_review');
assert.equal(hydropowerReliability.reviewed.result.value, 4.8);
assert.equal(hydropowerReliability.reviewed.result.grade.letter, 'C');
assert.equal(hydropowerReliability.reviewed.result.confidence, 'C');
assert.equal(hydropowerReliability.reviewed.result.uncertainty.lower, 3.3);
assert.equal(hydropowerReliability.reviewed.result.uncertainty.upper, 7);
assert.deepEqual(hydropowerReliability.reviewed.candidate.applicableDomains, ['human']);
assert.equal(hydropowerReliability.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(hydropowerReliability.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert(hydropowerReliability.reviewed.candidate.components.human.evidenceReferences.includes('iea_electricity_2025_ecuador_hydropower_outages'));
assert.match(hydropowerReliability.reviewed.candidate.decisionTrace.measurementSemantics.severity, /capacity factor and TWh.*production and utilisation/i);
assert.match(hydropowerReliability.finding, /Retained C 4\.8.*human only/i);
const fishLandingSupplyDisruption = allById.get('fish_landing_supply_disruption');
assert.equal(fishLandingSupplyDisruption.reviewMode, 'detailed_evidence_review');
assert.equal(fishLandingSupplyDisruption.reviewed.result.value, 4.8);
assert.equal(fishLandingSupplyDisruption.reviewed.result.grade.letter, 'C');
assert.equal(fishLandingSupplyDisruption.reviewed.result.confidence, 'C');
assert.equal(fishLandingSupplyDisruption.reviewed.result.uncertainty.lower, 3.3);
assert.equal(fishLandingSupplyDisruption.reviewed.result.uncertainty.upper, 5.5);
assert.deepEqual(fishLandingSupplyDisruption.reviewed.candidate.applicableDomains, ['human']);
assert.equal(fishLandingSupplyDisruption.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(fishLandingSupplyDisruption.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert(fishLandingSupplyDisruption.reviewed.candidate.components.human.evidenceReferences.includes('bcrp_peru_annual_report_2025_fishing'));
assert.match(fishLandingSupplyDisruption.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Tonnes.*do not provide.*harmed-person denominator/i);
assert.match(fishLandingSupplyDisruption.finding, /range from A–D to B–C/i);
const fisheryProteinDependence = allById.get('fishery_protein_dependence');
assert.equal(fisheryProteinDependence.reviewMode, 'detailed_evidence_review');
assert.equal(fisheryProteinDependence.reviewed.result.value, 3.3);
assert.equal(fisheryProteinDependence.reviewed.result.grade.letter, 'B');
assert.equal(fisheryProteinDependence.reviewed.result.confidence, 'C');
assert.equal(fisheryProteinDependence.reviewed.result.uncertainty.lower, 1);
assert.equal(fisheryProteinDependence.reviewed.result.uncertainty.upper, 5.5);
assert.deepEqual(fisheryProteinDependence.reviewed.candidate.applicableDomains, ['human']);
assert.equal(fisheryProteinDependence.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(fisheryProteinDependence.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert(fisheryProteinDependence.reviewed.candidate.components.human.evidenceReferences.includes('fao_state_world_fisheries_aquaculture_2026'));
assert.match(fisheryProteinDependence.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /dependency count establishes exposure once/i);
assert.match(fisheryProteinDependence.finding, /range A–D.*range A–C/i);
const basinTreatyBreakdown = allById.get('basin_treaty_breakdown');
assert.equal(basinTreatyBreakdown.reviewMode, 'detailed_evidence_review');
assert.equal(basinTreatyBreakdown.reviewed.result.value, 3.3);
assert.equal(basinTreatyBreakdown.reviewed.result.grade.letter, 'B');
assert.equal(basinTreatyBreakdown.reviewed.result.confidence, 'C');
assert.equal(basinTreatyBreakdown.reviewed.result.uncertainty.lower, 1);
assert.equal(basinTreatyBreakdown.reviewed.result.uncertainty.upper, 5.5);
assert.deepEqual(basinTreatyBreakdown.reviewed.candidate.applicableDomains, ['human']);
assert.equal(basinTreatyBreakdown.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(basinTreatyBreakdown.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert(basinTreatyBreakdown.reviewed.candidate.components.human.evidenceReferences.includes('unece_progress_on_transboundary_water_cooperation_sdg_6_5_2'));
assert.match(basinTreatyBreakdown.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /41% basin-area gap establishes institutional context once/i);
assert.match(basinTreatyBreakdown.finding, /range A–D.*range A–C/i);
const migration = allById.get('migration');
assert.equal(migration.reviewMode, 'detailed_evidence_review');
assert.equal(migration.reviewed.result.value, 6.3);
assert.equal(migration.reviewed.result.grade.letter, 'C');
assert.equal(migration.reviewed.result.confidence, 'C');
assert.equal(migration.reviewed.result.uncertainty.lower, 4);
assert.equal(migration.reviewed.result.uncertainty.upper, 7.8);
assert.deepEqual(migration.reviewed.candidate.applicableDomains, ['human']);
assert.equal(migration.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(migration.reviewed.candidate.components.human.central, { severity: 2, reach: 3, persistence: 2 });
assert(migration.reviewed.candidate.components.human.evidenceReferences.includes('idmc_grid_2026_disaster_displacement'));
assert(migration.reviewed.candidate.components.human.evidenceReferences.includes('idmc_world_bank_disaster_displacement'));
assert.match(migration.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /13,600,000-person stock enters reach once/i);
assert.match(migration.finding, /29\.9 million movements as unique people/i);
const subseaCableLanding = allById.get('subsea_cable_landing_chokepoint');
assert.equal(subseaCableLanding.reviewMode, 'detailed_evidence_review');
assert.equal(subseaCableLanding.reviewed.result.value, 4);
assert.equal(subseaCableLanding.reviewed.result.grade.letter, 'B');
assert.equal(subseaCableLanding.reviewed.result.confidence, 'C');
assert.equal(subseaCableLanding.reviewed.result.uncertainty.lower, 3.3);
assert.equal(subseaCableLanding.reviewed.result.uncertainty.upper, 6.3);
assert.deepEqual(subseaCableLanding.reviewed.candidate.applicableDomains, ['human']);
assert.equal(subseaCableLanding.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.deepEqual(subseaCableLanding.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 });
assert(subseaCableLanding.reviewed.candidate.components.human.evidenceReferences.includes('itu_submarine_cable_resilience_2026'));
assert(subseaCableLanding.reviewed.candidate.components.human.evidenceReferences.includes('oecd_communication_network_resilience_2025'));
assert(subseaCableLanding.reviewed.candidate.components.human.evidenceReferences.includes('world_bank_cloud_cybersecurity_2024'));
assert.match(subseaCableLanding.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /99% traffic.*add no axis points/i);
assert.match(subseaCableLanding.finding, /traffic share.*outside harmed-person reach/i);
assert.equal(allById.get('coastal_property_insurance_redlines').reviewed.result.value, 5.5);
assert.equal(allById.get('coastal_property_insurance_redlines').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('coastal_property_insurance_redlines').reviewed.result.confidence, 'C');
assert.deepEqual(allById.get('coastal_property_insurance_redlines').reviewed.candidate.applicableDomains, ['human']);
assert.equal(allById.get('urban_water_rationing_zones').reviewed.result.value, 6.3);
assert.equal(allById.get('urban_water_rationing_zones').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('urban_water_rationing_zones').reviewed.result.confidence, 'B');
assert.equal(allById.get('urban_water_rationing_zones').reviewed.result.uncertainty.lower, 5.5);
assert.equal(allById.get('urban_water_rationing_zones').reviewed.result.uncertainty.upper, 7);
assert.equal(allById.get('tundra_shrubification_speeds').reviewed.result.value, 6.3);
assert.equal(allById.get('tundra_shrubification_speeds').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('tundra_shrubification_speeds').reviewed.result.confidence, 'C');
assert.equal(allById.get('tundra_shrubification_speeds').reviewed.result.uncertainty.lower, 4);
assert.equal(allById.get('tundra_shrubification_speeds').reviewed.result.uncertainty.upper, 7.8);
assert.deepEqual(allById.get('tundra_shrubification_speeds').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('transformer_heat_failure_risk').reviewed.result.value, 3.3);
assert.equal(allById.get('transformer_heat_failure_risk').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('transformer_heat_failure_risk').reviewed.result.confidence, 'C');
assert.equal(allById.get('transformer_heat_failure_risk').reviewed.result.uncertainty.lower, 1);
assert.equal(allById.get('transformer_heat_failure_risk').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('resource_depletion').reviewed.result.value, 6.3);
assert.equal(allById.get('resource_depletion').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('resource_depletion').reviewed.result.uncertainty.lower, 4);
assert.equal(allById.get('resource_depletion').reviewed.result.uncertainty.upper, 7.8);
assert.equal(allById.get('extreme_precipitation_intensity').reviewed.result.value, 6.3);
assert.equal(allById.get('extreme_precipitation_intensity').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('extreme_precipitation_intensity').reviewed.result.uncertainty.lower, 4.4);
assert.equal(allById.get('extreme_precipitation_intensity').reviewed.result.uncertainty.upper, 7.8);
assert.equal(allById.get('convective_instability_shift').reviewed.result.value, 3.3);
assert.equal(allById.get('convective_instability_shift').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('convective_instability_shift').reviewed.result.uncertainty.lower, 1);
assert.equal(allById.get('convective_instability_shift').reviewed.result.uncertainty.upper, 4.8);
assert.equal(allById.get('black_carbon_deposition').reviewed.result.value, 4);
assert.equal(allById.get('black_carbon_deposition').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('black_carbon_deposition').reviewed.result.uncertainty.lower, 3.3);
assert.equal(allById.get('black_carbon_deposition').reviewed.result.uncertainty.upper, 5.5);
assert.deepEqual(allById.get('black_carbon_deposition').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('antarctic_shelf_instability').reviewed.result.value, 4.8);
assert.equal(allById.get('antarctic_shelf_instability').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('antarctic_shelf_instability').reviewed.result.uncertainty.lower, 3.6);
assert.equal(allById.get('antarctic_shelf_instability').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('antarctic_shelf_instability').reviewed.result.confidence, 'C');
assert.equal(allById.get('savannah_tree_cover_decline').reviewed.result.value, 5.5);
assert.equal(allById.get('savannah_tree_cover_decline').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('savannah_tree_cover_decline').reviewed.result.uncertainty.lower, 4);
assert.equal(allById.get('savannah_tree_cover_decline').reviewed.result.uncertainty.upper, 7);
assert.equal(allById.get('savannah_tree_cover_decline').reviewed.result.confidence, 'C');
assert.deepEqual(allById.get('savannah_tree_cover_decline').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('ice_algae_pigmentation').reviewed.result.value, 4);
assert.equal(allById.get('ice_algae_pigmentation').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('ice_algae_pigmentation').reviewed.result.uncertainty.lower, 2.5);
assert.equal(allById.get('ice_algae_pigmentation').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('ice_algae_pigmentation').reviewed.result.confidence, 'C');
assert.deepEqual(allById.get('ice_algae_pigmentation').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('cryoconite_hole_expansion').reviewed.result.value, 3.3);
assert.equal(allById.get('cryoconite_hole_expansion').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('cryoconite_hole_expansion').reviewed.result.uncertainty.lower, 1);
assert.equal(allById.get('cryoconite_hole_expansion').reviewed.result.uncertainty.upper, 5.5);
assert.equal(allById.get('cryoconite_hole_expansion').reviewed.result.confidence, 'C');
assert.deepEqual(allById.get('cryoconite_hole_expansion').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('high_altitude_forest_shrinkage').reviewed.result.value, 5.5);
assert.equal(allById.get('high_altitude_forest_shrinkage').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('high_altitude_forest_shrinkage').reviewed.result.uncertainty.lower, 4);
assert.equal(allById.get('high_altitude_forest_shrinkage').reviewed.result.uncertainty.upper, 7);
assert.equal(allById.get('high_altitude_forest_shrinkage').reviewed.result.confidence, 'C');
assert.deepEqual(allById.get('high_altitude_forest_shrinkage').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('glacial_siltation_streams').reviewed.result.value, 4);
assert.equal(allById.get('glacial_siltation_streams').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('glacial_siltation_streams').reviewed.result.uncertainty.lower, 1.8);
assert.equal(allById.get('glacial_siltation_streams').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('glacial_siltation_streams').reviewed.result.confidence, 'C');
assert.deepEqual(allById.get('glacial_siltation_streams').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('talik_expansion').reviewed.result.value, 4);
assert.equal(allById.get('talik_expansion').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('talik_expansion').reviewed.result.uncertainty.lower, 1.8);
assert.equal(allById.get('talik_expansion').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('talik_expansion').reviewed.result.confidence, 'C');
assert.deepEqual(allById.get('talik_expansion').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('soil_moisture_collapse').reviewed.result.value, 4.8);
assert.equal(allById.get('soil_moisture_collapse').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('soil_moisture_collapse').reviewed.result.uncertainty.lower, 3.3);
assert.equal(allById.get('soil_moisture_collapse').reviewed.result.uncertainty.upper, 7);
assert.equal(allById.get('soil_moisture_collapse').reviewed.result.confidence, 'C');
assert.deepEqual(allById.get('soil_moisture_collapse').reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(allById.get('atlantic_ni_o_ni_a').reviewed.result.value, 4);
assert.equal(allById.get('atlantic_ni_o_ni_a').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('atlantic_ni_o_ni_a').reviewed.result.uncertainty.lower, 1.8);
assert.equal(allById.get('atlantic_ni_o_ni_a').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('atlantic_ni_o_ni_a').reviewed.result.confidence, 'C');
assert.equal(allById.get('indian_ocean_dipole').reviewed.result.value, 4);
assert.equal(allById.get('indian_ocean_dipole').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('indian_ocean_dipole').reviewed.result.uncertainty.lower, 1.8);
assert.equal(allById.get('indian_ocean_dipole').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('indian_ocean_dipole').reviewed.result.confidence, 'C');
assert.equal(allById.get('indian_ocean_dipole').reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.equal(allById.get('indian_ocean_dipole').reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert.equal(allById.get('north_atlantic_oscillation').reviewed.result.value, 4.8);
assert.equal(allById.get('north_atlantic_oscillation').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('north_atlantic_oscillation').reviewed.result.uncertainty.lower, 2.1);
assert.equal(allById.get('north_atlantic_oscillation').reviewed.result.uncertainty.upper, 6.6);
assert.equal(allById.get('north_atlantic_oscillation').reviewed.result.confidence, 'C');
assert.equal(allById.get('north_atlantic_oscillation').reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.equal(allById.get('north_atlantic_oscillation').reviewed.candidate.decisionTrace.latestCompatibleEvidenceYear, 2026);
assert(allById.get('north_atlantic_oscillation').reviewed.candidate.history.evidenceReferences.includes('zanardo_nao_european_flood_losses_2019'));
assert(allById.get('north_atlantic_oscillation').reviewed.candidate.history.evidenceReferences.includes('guimaraes_nobre_european_flood_loss_forecast_2020'));
assert(allById.get('north_atlantic_oscillation').reviewed.candidate.history.evidenceReferences.includes('hanze_v2_1_european_flood_impacts_2024'));
assert.match(allById.get('north_atlantic_oscillation').reviewed.candidate.components.human.attribution, /false-discovery control/i);
const cementConcrete = allById.get('cement_concrete');
assert.equal(cementConcrete.reviewMode, 'detailed_evidence_review');
assert.equal(cementConcrete.reviewed.result.value, 7);
assert.equal(cementConcrete.reviewed.result.grade.letter, 'D');
assert.equal(cementConcrete.reviewed.result.uncertainty.lower, 5.1);
assert.equal(cementConcrete.reviewed.result.uncertainty.upper, 8.5);
assert.equal(cementConcrete.reviewed.result.confidence, 'C');
assert.deepEqual(cementConcrete.reviewed.candidate.components.human.central, { severity: 3, reach: 2, persistence: 4 });
assert.deepEqual(cementConcrete.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 4 });
assert(cementConcrete.reviewed.candidate.components.human.evidenceReferences.includes('oberschelp_global_cement_plant_health_impacts_2023'));
assert.equal(cementConcrete.reviewed.candidate.causalAllocation.role, 'aggregate_pressure');
assert.match(cementConcrete.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /CO2-related DALYs/i);
const humanitarianFundingShortfall = allById.get('humanitarian_response_funding_shortfall');
assert.equal(humanitarianFundingShortfall.reviewMode, 'detailed_evidence_review');
assert.equal(humanitarianFundingShortfall.reviewed.result.value, 6.3);
assert.equal(humanitarianFundingShortfall.reviewed.result.grade.letter, 'C');
assert.equal(humanitarianFundingShortfall.reviewed.result.uncertainty.lower, 5.5);
assert.equal(humanitarianFundingShortfall.reviewed.result.uncertainty.upper, 7.8);
assert.equal(humanitarianFundingShortfall.reviewed.result.confidence, 'B');
assert.deepEqual(humanitarianFundingShortfall.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(humanitarianFundingShortfall.reviewed.candidate.components.human.central, { severity: 2, reach: 3, persistence: 2 });
assert(humanitarianFundingShortfall.reviewed.candidate.components.human.evidenceReferences.includes('un_afghanistan_secretary_general_report_a_80_658_2026'));
assert.equal(humanitarianFundingShortfall.reviewed.candidate.causalAllocation.role, 'aggregate_pressure');
assert.match(humanitarianFundingShortfall.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /3\.8 million affected people once/i);
const humanitarianResourceGaps = allById.get('humanitarian_resource_gaps');
assert.equal(humanitarianResourceGaps.reviewMode, 'detailed_evidence_review');
assert.equal(humanitarianResourceGaps.reviewed.result.value, 6.3);
assert.equal(humanitarianResourceGaps.reviewed.result.grade.letter, 'C');
assert.equal(humanitarianResourceGaps.reviewed.result.uncertainty.lower, 5.5);
assert.equal(humanitarianResourceGaps.reviewed.result.uncertainty.upper, 7.8);
assert.equal(humanitarianResourceGaps.reviewed.result.confidence, 'B');
assert.deepEqual(humanitarianResourceGaps.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(humanitarianResourceGaps.reviewed.candidate.components.human.central, { severity: 2, reach: 3, persistence: 2 });
assert(humanitarianResourceGaps.reviewed.candidate.components.human.evidenceReferences.includes('un_afghanistan_secretary_general_report_a_80_658_2026'));
assert.equal(humanitarianResourceGaps.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(humanitarianResourceGaps.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /never add their scores/i);
const humanitarianAccessConstraints = allById.get('humanitarian_access_constraints');
assert.equal(humanitarianAccessConstraints.reviewMode, 'detailed_evidence_review');
assert.equal(humanitarianAccessConstraints.reviewed.result.value, 4.8);
assert.equal(humanitarianAccessConstraints.reviewed.result.grade.letter, 'C');
assert.equal(humanitarianAccessConstraints.reviewed.result.uncertainty.lower, 4);
assert.equal(humanitarianAccessConstraints.reviewed.result.uncertainty.upper, 7.8);
assert.equal(humanitarianAccessConstraints.reviewed.result.confidence, 'B');
assert.deepEqual(humanitarianAccessConstraints.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(humanitarianAccessConstraints.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert(humanitarianAccessConstraints.reviewed.candidate.components.human.evidenceReferences.includes('ocha_myanmar_hnrp_2026_access_constraints'));
assert.equal(humanitarianAccessConstraints.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(humanitarianAccessConstraints.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /incident counts.*township shares/i);
const stapleFoodPriceVolatility = allById.get('staple_food_price_volatility');
assert.equal(stapleFoodPriceVolatility.reviewMode, 'detailed_evidence_review');
assert.equal(stapleFoodPriceVolatility.reviewed.result.value, 4.8);
assert.equal(stapleFoodPriceVolatility.reviewed.result.grade.letter, 'C');
assert.equal(stapleFoodPriceVolatility.reviewed.result.uncertainty.lower, 4);
assert.equal(stapleFoodPriceVolatility.reviewed.result.uncertainty.upper, 7.8);
assert.equal(stapleFoodPriceVolatility.reviewed.result.confidence, 'B');
assert.deepEqual(stapleFoodPriceVolatility.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(stapleFoodPriceVolatility.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert(stapleFoodPriceVolatility.reviewed.candidate.components.human.evidenceReferences.includes('fao_sofi_2025_food_price_inflation_consequences'));
assert.equal(stapleFoodPriceVolatility.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(stapleFoodPriceVolatility.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /child-wasting results as corroborating outcome pathways/i);
const humanitarianSurgeDemand = allById.get('humanitarian_surge_demand');
assert.equal(humanitarianSurgeDemand.reviewMode, 'detailed_evidence_review');
assert.equal(humanitarianSurgeDemand.reviewed.result.value, 4);
assert.equal(humanitarianSurgeDemand.reviewed.result.grade.letter, 'B');
assert.equal(humanitarianSurgeDemand.reviewed.result.uncertainty.lower, 4);
assert.equal(humanitarianSurgeDemand.reviewed.result.uncertainty.upper, 7.8);
assert.equal(humanitarianSurgeDemand.reviewed.result.confidence, 'C');
assert.deepEqual(humanitarianSurgeDemand.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(humanitarianSurgeDemand.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 });
assert(humanitarianSurgeDemand.reviewed.candidate.components.human.evidenceReferences.includes('who_eastern_drc_health_surge_response_2025'));
assert.equal(humanitarianSurgeDemand.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(humanitarianSurgeDemand.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Do not add casualties/i);
const reefStructuralCollapse = allById.get('reef_structural_collapse');
assert.equal(reefStructuralCollapse.reviewMode, 'detailed_evidence_review');
assert.equal(reefStructuralCollapse.reviewed.result.value, 4.8);
assert.equal(reefStructuralCollapse.reviewed.result.grade.letter, 'C');
assert.equal(reefStructuralCollapse.reviewed.result.uncertainty.lower, 4);
assert.equal(reefStructuralCollapse.reviewed.result.uncertainty.upper, 7.8);
assert.equal(reefStructuralCollapse.reviewed.result.confidence, 'C');
assert.deepEqual(reefStructuralCollapse.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(reefStructuralCollapse.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(reefStructuralCollapse.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 2 });
assert(reefStructuralCollapse.reviewed.candidate.components.ecosystem.evidenceReferences.includes('bruce_reef_structural_complexity_heatwave_2026'));
assert.equal(reefStructuralCollapse.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(reefStructuralCollapse.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Do not add heat exposure.*coral bleaching/i);
const ozoneDepletingSubstanceBurden = allById.get('cfc_saturated_layers');
assert.equal(ozoneDepletingSubstanceBurden.reviewMode, 'detailed_evidence_review');
assert.equal(ozoneDepletingSubstanceBurden.reviewed.result.value, 3.3);
assert.equal(ozoneDepletingSubstanceBurden.reviewed.result.grade.letter, 'B');
assert.equal(ozoneDepletingSubstanceBurden.reviewed.result.uncertainty.lower, 1.8);
assert.equal(ozoneDepletingSubstanceBurden.reviewed.result.uncertainty.upper, 7);
assert.equal(ozoneDepletingSubstanceBurden.reviewed.result.confidence, 'D');
assert.deepEqual(ozoneDepletingSubstanceBurden.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.deepEqual(ozoneDepletingSubstanceBurden.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 1 });
assert(ozoneDepletingSubstanceBurden.reviewed.candidate.components.ecosystem.evidenceReferences.includes('noaa_ozone_depleting_gas_index_2024'));
assert(ozoneDepletingSubstanceBurden.reviewed.candidate.components.ecosystem.evidenceReferences.includes('young_montreal_protocol_terrestrial_carbon_sink_2021'));
assert(ozoneDepletingSubstanceBurden.reviewed.candidate.components.ecosystem.evidenceReferences.includes('chipperfield_montreal_protocol_ozone_uv_benefits_2015'));
assert(ozoneDepletingSubstanceBurden.reviewed.candidate.components.ecosystem.evidenceReferences.includes('robinson_extended_ozone_hole_antarctic_biota_2024'));
assert(ozoneDepletingSubstanceBurden.reviewed.candidate.components.ecosystem.evidenceReferences.includes('he_antarctic_ozone_trends_2026'));
assert.equal(ozoneDepletingSubstanceBurden.reviewed.candidate.causalAllocation.role, 'aggregate_pressure');
assert.match(ozoneDepletingSubstanceBurden.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /alternative view.*ozone causal chain/i);
const ozoneColumnDepletion = allById.get('stratospheric_chlorine_sinks');
assert.equal(ozoneColumnDepletion.reviewMode, 'detailed_evidence_review');
assert.equal(ozoneColumnDepletion.reviewed.result.value, 4);
assert.equal(ozoneColumnDepletion.reviewed.result.grade.letter, 'B');
assert.equal(ozoneColumnDepletion.reviewed.result.uncertainty.lower, 1.8);
assert.equal(ozoneColumnDepletion.reviewed.result.uncertainty.upper, 7);
assert.equal(ozoneColumnDepletion.reviewed.result.confidence, 'C');
assert.deepEqual(ozoneColumnDepletion.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.deepEqual(ozoneColumnDepletion.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 1 });
assert(ozoneColumnDepletion.reviewed.candidate.components.ecosystem.evidenceReferences.includes('wmo_ozone_uv_bulletin_2024'));
assert(ozoneColumnDepletion.reviewed.candidate.components.ecosystem.evidenceReferences.includes('he_antarctic_ozone_trends_2026'));
assert.equal(ozoneColumnDepletion.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(ozoneColumnDepletion.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /upstream ODS stock/i);
const coralReefFragmentation = allById.get('coral_reef_fragmentation');
assert.equal(coralReefFragmentation.reviewMode, 'detailed_evidence_review');
assert.equal(coralReefFragmentation.reviewed.result.value, 3.3);
assert.equal(coralReefFragmentation.reviewed.result.grade.letter, 'B');
assert.equal(coralReefFragmentation.reviewed.result.uncertainty.lower, 1.8);
assert.equal(coralReefFragmentation.reviewed.result.uncertainty.upper, 6.3);
assert.equal(coralReefFragmentation.reviewed.result.confidence, 'C');
assert.deepEqual(coralReefFragmentation.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.deepEqual(coralReefFragmentation.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 1 });
assert(coralReefFragmentation.reviewed.candidate.components.ecosystem.evidenceReferences.includes('cumming_coral_reef_fragmentation_2025'));
assert(coralReefFragmentation.reviewed.candidate.components.ecosystem.evidenceReferences.includes('lyons_global_coral_reef_area_2024'));
assert.equal(coralReefFragmentation.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(coralReefFragmentation.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Do not add coral bleaching/i);
const tidalWetlandCarbonReversal = allById.get('tidal_wetland_carbon_reversal');
assert.equal(tidalWetlandCarbonReversal.reviewMode, 'detailed_evidence_review');
assert.equal(tidalWetlandCarbonReversal.reviewed.result.value, 7);
assert.equal(tidalWetlandCarbonReversal.reviewed.result.grade.letter, 'D');
assert.equal(tidalWetlandCarbonReversal.reviewed.result.uncertainty.lower, 4);
assert.equal(tidalWetlandCarbonReversal.reviewed.result.uncertainty.upper, 10);
assert.equal(tidalWetlandCarbonReversal.reviewed.result.confidence, 'B');
assert.deepEqual(tidalWetlandCarbonReversal.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(tidalWetlandCarbonReversal.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(tidalWetlandCarbonReversal.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 3, persistence: 3 });
assert(tidalWetlandCarbonReversal.reviewed.candidate.components.ecosystem.evidenceReferences.includes('yang_global_tidal_wetland_soc_change_2026'));
assert(tidalWetlandCarbonReversal.reviewed.candidate.components.ecosystem.evidenceReferences.includes('fu_blue_carbon_disturbance_loss_2025'));
assert.equal(tidalWetlandCarbonReversal.reviewed.candidate.causalAllocation.role, 'aggregate_pressure');
assert.match(tidalWetlandCarbonReversal.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Score loss of carbon-storage function once/i);
assert.match(tidalWetlandCarbonReversal.reviewed.candidate.decisionTrace.axisBasis.ecosystem.reach.basis, /29\.0% and 20\.7% of the union mapped wetland distribution/i);
assert.match(tidalWetlandCarbonReversal.reviewed.candidate.history.recentState, /central score remains D 7\.0/i);
assert.match(tidalWetlandCarbonReversal.reviewed.candidate.history.fullRecordTrend, /64,581 square kilometres of period-only classification churn/i);
const riverFlowRegimeShift = allById.get('river_flow_regime_shift');
assert.equal(riverFlowRegimeShift.reviewMode, 'detailed_evidence_review');
assert.equal(riverFlowRegimeShift.reviewed.result.value, 4);
assert.equal(riverFlowRegimeShift.reviewed.result.grade.letter, 'B');
assert.equal(riverFlowRegimeShift.reviewed.result.uncertainty.lower, 1.8);
assert.equal(riverFlowRegimeShift.reviewed.result.uncertainty.upper, 7);
assert.equal(riverFlowRegimeShift.reviewed.result.confidence, 'C');
assert.deepEqual(riverFlowRegimeShift.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(riverFlowRegimeShift.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(riverFlowRegimeShift.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 2, persistence: 1 });
assert(riverFlowRegimeShift.reviewed.candidate.components.ecosystem.evidenceReferences.includes('unep_un_water_progress_on_water_related_ecosystems_2024'));
assert(riverFlowRegimeShift.reviewed.candidate.components.ecosystem.evidenceReferences.includes('mohan_environmental_flow_biodiversity_2022'));
assert.equal(riverFlowRegimeShift.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(riverFlowRegimeShift.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Score the direct river-condition consequence once/i);
assert.equal(allById.get('wastewater_infrastructure_overflow').reviewed.result.value, 4);
assert.equal(allById.get('wastewater_infrastructure_overflow').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('wastewater_infrastructure_overflow').reviewed.result.uncertainty.lower, 3.3);
assert.equal(allById.get('wastewater_infrastructure_overflow').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('wastewater_infrastructure_overflow').reviewed.result.confidence, 'C');
assert.equal(allById.get('wastewater_infrastructure_overflow').reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.equal(allById.get('relocation_governance_capacity').reviewed.result.value, 5.5);
assert.equal(allById.get('relocation_governance_capacity').reviewed.result.grade.letter, 'C');
assert.equal(allById.get('relocation_governance_capacity').reviewed.result.uncertainty.lower, 4.8);
assert.equal(allById.get('relocation_governance_capacity').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('relocation_governance_capacity').reviewed.result.confidence, 'B');
assert.deepEqual(allById.get('relocation_governance_capacity').reviewed.candidate.applicableDomains, ['human']);
assert.equal(allById.get('relocation_governance_capacity').reviewed.candidate.causalAllocation.role, 'hazard_or_state');
for (const nodeId of ['transformer_supply_bottleneck', 'transmission_buildout_lag']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewed.result.value, 5.5, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'C', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 4.8, nodeId);
  assert.equal(row.reviewed.result.confidence, 'B', nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['human'], nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'aggregate_pressure', nodeId);
}
assert.equal(allById.get('transformer_supply_bottleneck').reviewed.result.uncertainty.upper, 6.3);
assert.equal(allById.get('transmission_buildout_lag').reviewed.result.uncertainty.upper, 7);
assert.equal(allById.get('subsea_cables').reviewed.result.value, 3.3);
assert.equal(allById.get('subsea_cables').reviewed.result.grade.letter, 'B');
assert.equal(allById.get('subsea_cables').reviewed.result.uncertainty.lower, 3.3);
assert.equal(allById.get('subsea_cables').reviewed.result.uncertainty.upper, 5.5);
assert.equal(allById.get('subsea_cables').reviewed.result.confidence, 'C');
assert.deepEqual(allById.get('subsea_cables').reviewed.candidate.applicableDomains, ['human']);
for (const nodeId of ['jet_stream_volatility', 'rossby_wave_stalling']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewed.result.value, 4.4, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 2.9, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 5.5, nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'hazard_or_state', nodeId);
}
for (const [nodeId, role] of [
  ['peaker_plant_lock_in', 'hazard_or_state'],
  ['semiconductor_fabs', 'aggregate_pressure'],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewed.result.value, 3.6, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 3.3, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 5.1, nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, role, nodeId);
  assert(row.reviewed.candidate.causalAllocation.overlapExclusions.length >= 3, nodeId);
}
for (const [nodeId, expectedValue, expectedUpper, expectedPersistence] of [
  ['steel', 4, 6.3, 2],
  ['steel_decarbonization_gap', 3.3, 5.5, 1],
  ['industrial_heat_decarbonization_gap', 3.3, 5.5, 1],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, expectedValue, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 1, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, expectedUpper, nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['ecosystem'], nodeId);
  assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  assert.deepEqual(
    row.reviewed.candidate.components.ecosystem.central,
    { severity: 1, reach: 1, persistence: expectedPersistence },
    nodeId,
  );
  assert(row.reviewed.candidate.components.ecosystem.evidenceReferences.includes('iea_global_industry_transition_assessments'), nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'aggregate_pressure', nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Do not add steel, industrial heat, cement/i, nodeId);
}
for (const [nodeId, expectedValue, domains, expectedPersistence] of [
  ['mining_critical_minerals', 3.6, ['human', 'ecosystem'], 2],
  ['critical_mineral_extraction_pressure', 3.3, ['ecosystem'], 1],
  ['battery_supply_chain_pressure', 3.3, ['ecosystem'], 1],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, expectedValue, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 1, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 7.8, nodeId);
  assert.equal(row.reviewed.result.confidence, 'D', nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, domains, nodeId);
  assert.equal(row.reviewed.candidate.components.human.structuralZero, nodeId !== 'mining_critical_minerals', nodeId);
  assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: expectedPersistence }, nodeId);
  assert(row.reviewed.candidate.components.ecosystem.evidenceReferences.includes('iea_global_critical_minerals_outlook_2025'), nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'aggregate_pressure', nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /three nodes are alternative views of overlapping supply pressure/i, nodeId);
}
for (const [nodeId, expectedValue, expectedPersistence] of [
  ['aviation', 4, 2],
  ['aviation_demand_growth', 3.3, 1],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, expectedValue, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 1, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 7.8, nodeId);
  assert.equal(row.reviewed.result.confidence, 'D', nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['ecosystem'], nodeId);
  assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: expectedPersistence }, nodeId);
  assert(row.reviewed.candidate.components.ecosystem.evidenceReferences.includes('icao_environmental_reports'), nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'aggregate_pressure', nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.axisBasis.ecosystem.reach.basis, /reporting coverage/i, nodeId);
}
for (const [nodeId, expectedValue, expectedUpper, expectedConfidence, expectedPersistence] of [
  ['ai_data_centers', 3.3, 7.8, 'D', 1],
  ['data_centers', 4, 6.3, 'C', 2],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, expectedValue, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 1, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, expectedUpper, nodeId);
  assert.equal(row.reviewed.result.confidence, expectedConfidence, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['ecosystem'], nodeId);
  assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: expectedPersistence }, nodeId);
  assert(row.reviewed.candidate.components.ecosystem.evidenceReferences.includes('iea_energy_and_ai'), nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'aggregate_pressure', nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Do not add AI data centres, all data centres/i, nodeId);
}
for (const nodeId of ['combined_sewer_overflow', 'wastewater_bypass_discharge']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 4, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 2.5, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 6.6, nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['human', 'ecosystem'], nodeId);
  assert.deepEqual(row.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 1 }, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 1 }, nodeId);
  assert(row.reviewed.candidate.components.human.evidenceReferences.includes('epa_echo_sewer_overflow_bypass_events_2026'), nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'hazard_or_state', nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Do not use impact records, events, permits, facilities, outfalls/i, nodeId);
}
for (const nodeId of ['occupational_heat_exposure', 'agricultural_labor_exposure']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 4.8, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'C', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 2.5, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 7.8, nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['human'], nodeId);
  assert.deepEqual(row.reviewed.candidate.components.human.central, { severity: 2, reach: 2, persistence: 1 }, nodeId);
  assert.equal(row.reviewed.candidate.components.ecosystem.structuralZero, true, nodeId);
  assert(row.reviewed.candidate.components.human.evidenceReferences.includes('lancet_countdown_data_explorer'), nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'hazard_or_state', nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.nonDoubleCounting, /Agricultural hours are nested within the all-sector total/i, nodeId);
}
const airConditioningRefrigerants = allById.get('air_conditioning_refrigerants');
assert.equal(airConditioningRefrigerants.reviewMode, 'detailed_evidence_review');
assert.equal(airConditioningRefrigerants.reviewed.result.value, 4);
assert.equal(airConditioningRefrigerants.reviewed.result.grade.letter, 'B');
assert.equal(airConditioningRefrigerants.reviewed.result.uncertainty.lower, 1);
assert.equal(airConditioningRefrigerants.reviewed.result.uncertainty.upper, 6.3);
assert.equal(airConditioningRefrigerants.reviewed.result.confidence, 'C');
assert.deepEqual(airConditioningRefrigerants.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(airConditioningRefrigerants.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(airConditioningRefrigerants.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 2 });
assert(airConditioningRefrigerants.reviewed.candidate.components.ecosystem.evidenceReferences.includes('unep_global_cooling_watch_2025'));
assert.equal(airConditioningRefrigerants.reviewed.candidate.causalAllocation.role, 'aggregate_pressure');
const coolingEquityGaps = allById.get('cooling_equity_gaps');
assert.equal(coolingEquityGaps.reviewMode, 'detailed_evidence_review');
assert.equal(coolingEquityGaps.reviewed.result.value, 6.3);
assert.equal(coolingEquityGaps.reviewed.result.grade.letter, 'C');
assert.equal(coolingEquityGaps.reviewed.result.uncertainty.lower, 4);
assert.equal(coolingEquityGaps.reviewed.result.uncertainty.upper, 8.5);
assert.equal(coolingEquityGaps.reviewed.result.confidence, 'C');
assert.deepEqual(coolingEquityGaps.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(coolingEquityGaps.reviewed.candidate.components.human.central, { severity: 2, reach: 4, persistence: 1 });
assert.equal(coolingEquityGaps.reviewed.candidate.components.ecosystem.structuralZero, true);
assert(coolingEquityGaps.reviewed.candidate.components.human.evidenceReferences.includes('unep_global_cooling_watch_2025'));
assert.equal(coolingEquityGaps.reviewed.candidate.causalAllocation.role, 'hazard_or_state');
assert.match(coolingEquityGaps.reviewed.candidate.decisionTrace.axisBasis.human.reach.basis, /service-gap reach, not terminal health-outcome reach/i);
const livestockDisease = allById.get('livestock_disease_pressure');
assert.equal(livestockDisease.reviewMode, 'detailed_evidence_review');
assert.equal(livestockDisease.reviewed.result.value, 4.8);
assert.equal(livestockDisease.reviewed.result.grade.letter, 'C');
assert.equal(livestockDisease.reviewed.result.uncertainty.lower, 2.5);
assert.equal(livestockDisease.reviewed.result.uncertainty.upper, 7.8);
assert.equal(livestockDisease.reviewed.result.confidence, 'C');
assert.deepEqual(livestockDisease.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(livestockDisease.reviewed.candidate.components.human.central, { severity: 2, reach: 2, persistence: 1 });
assert.equal(livestockDisease.reviewed.candidate.components.ecosystem.structuralZero, true);
assert(livestockDisease.reviewed.candidate.components.human.evidenceReferences.includes('woah_state_of_world_animal_health_2026'));
assert.match(livestockDisease.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Do not use animals, outbreaks, countries/i);
const zoonoticOutbreaks = allById.get('zoonotic_disease_outbreaks');
assert.equal(zoonoticOutbreaks.reviewMode, 'detailed_evidence_review');
assert.equal(zoonoticOutbreaks.reviewed.result.value, 3.3);
assert.equal(zoonoticOutbreaks.reviewed.result.grade.letter, 'B');
assert.equal(zoonoticOutbreaks.reviewed.result.uncertainty.lower, 1);
assert.equal(zoonoticOutbreaks.reviewed.result.uncertainty.upper, 7.8);
assert.equal(zoonoticOutbreaks.reviewed.result.confidence, 'D');
assert.deepEqual(zoonoticOutbreaks.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(zoonoticOutbreaks.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.equal(zoonoticOutbreaks.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.match(zoonoticOutbreaks.finding, /unsupported human cases, deaths or recovery duration/i);
const oceanicDeoxygenation = allById.get('oceanic_deoxygenation');
assert.equal(oceanicDeoxygenation.reviewMode, 'detailed_evidence_review');
assert.equal(oceanicDeoxygenation.reviewed.result.value, 5.5);
assert.equal(oceanicDeoxygenation.reviewed.result.grade.letter, 'C');
assert.equal(oceanicDeoxygenation.reviewed.result.uncertainty.lower, 3.3);
assert.equal(oceanicDeoxygenation.reviewed.result.uncertainty.upper, 7.8);
assert.equal(oceanicDeoxygenation.reviewed.result.confidence, 'C');
assert.deepEqual(oceanicDeoxygenation.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(oceanicDeoxygenation.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(oceanicDeoxygenation.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 2, persistence: 2 });
assert(oceanicDeoxygenation.reviewed.candidate.components.ecosystem.evidenceReferences.includes('ioc_unesco_global_ocean_oxygen_network'));
assert.match(oceanicDeoxygenation.reviewed.candidate.decisionTrace.measurementSemantics.persistence, /Do not use assessment age, comparison period or monitoring-program length/i);
const coastalHypoxia = allById.get('coastal_hypoxia');
assert.equal(coastalHypoxia.reviewMode, 'detailed_evidence_review');
assert.equal(coastalHypoxia.reviewed.result.value, 4);
assert.equal(coastalHypoxia.reviewed.result.grade.letter, 'B');
assert.equal(coastalHypoxia.reviewed.result.uncertainty.lower, 2.5);
assert.equal(coastalHypoxia.reviewed.result.uncertainty.upper, 7.8);
assert.equal(coastalHypoxia.reviewed.result.confidence, 'C');
assert.deepEqual(coastalHypoxia.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(coastalHypoxia.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(coastalHypoxia.reviewed.candidate.components.ecosystem.central, { severity: 2, reach: 1, persistence: 1 });
assert(coastalHypoxia.reviewed.candidate.components.ecosystem.evidenceReferences.includes('noaa_dynamics_and_distribution_of_natural_and_human_caused_coastal_hypoxia'));
assert.match(coastalHypoxia.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Do not convert coastal sites to area/i);
for (const [nodeId, value, grade, lower, confidence, axes] of [
  ['surface_water_withdrawal_pressure', 4, 'B', 1, 'D', { severity: 1, reach: 1, persistence: 2 }],
  ['surface_water_inflow_deficit', 4.8, 'C', 2.5, 'C', { severity: 1, reach: 2, persistence: 2 }],
  ['surface_water_evaporative_loss', 4, 'B', 1, 'D', { severity: 1, reach: 1, persistence: 2 }],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, value, nodeId);
  assert.equal(row.reviewed.result.grade.letter, grade, nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, lower, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 7.8, nodeId);
  assert.equal(row.reviewed.result.confidence, confidence, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['ecosystem'], nodeId);
  assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, axes, nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Do not use global coverage.*basin residents.*scarcity exposure/i, nodeId);
}
const urbanWaterDemandPeak = allById.get('urban_water_demand_peak');
assert.equal(urbanWaterDemandPeak.reviewMode, 'detailed_evidence_review');
assert.equal(urbanWaterDemandPeak.reviewed.result.value, 3.3);
assert.equal(urbanWaterDemandPeak.reviewed.result.grade.letter, 'B');
assert.equal(urbanWaterDemandPeak.reviewed.result.uncertainty.lower, 1);
assert.equal(urbanWaterDemandPeak.reviewed.result.uncertainty.upper, 5.5);
assert.equal(urbanWaterDemandPeak.reviewed.result.confidence, 'C');
assert.deepEqual(urbanWaterDemandPeak.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(urbanWaterDemandPeak.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.equal(urbanWaterDemandPeak.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.match(urbanWaterDemandPeak.finding, /rationing population.*avoided Day Zero/i);
for (const nodeId of ['antarctic_bottom_water_decline', 'thermal_stratification_intensification']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 4, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 1.8, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 7.8, nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['ecosystem'], nodeId);
  assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 2 }, nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.reach, /Do not use global or circumpolar measurement scope/i, nodeId);
}
assert(allById.get('antarctic_bottom_water_decline').reviewed.candidate.components.ecosystem.evidenceReferences.includes('csiro_antarctic_bottom_water_observations_2023'));
assert(allById.get('thermal_stratification_intensification').reviewed.candidate.components.ecosystem.evidenceReferences.includes('global_ocean_stratification_observation_assessment'));
const amphibianChytrid = allById.get('amphibian_chytrid_fungus_spreads');
assert.equal(amphibianChytrid.reviewMode, 'detailed_evidence_review');
assert.equal(amphibianChytrid.reviewed.result.value, 5.1);
assert.equal(amphibianChytrid.reviewed.result.grade.letter, 'C');
assert.equal(amphibianChytrid.reviewed.result.uncertainty.lower, 3.3);
assert.equal(amphibianChytrid.reviewed.result.uncertainty.upper, 7);
assert.equal(amphibianChytrid.reviewed.result.confidence, 'C');
assert.deepEqual(amphibianChytrid.reviewed.candidate.applicableDomains, ['human', 'ecosystem']);
assert.deepEqual(amphibianChytrid.reviewed.candidate.components.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.deepEqual(amphibianChytrid.reviewed.candidate.components.ecosystem.central, { severity: 3, reach: 1, persistence: 2 });
assert.equal(amphibianChytrid.reviewed.candidate.decisionTrace.axisBasis.human.persistence.sourceAnchored, true);
assert.match(amphibianChytrid.finding, /must not become global reach or persistence|no longer become global reach or persistence/i);
const pollinatorColony = allById.get('pollinator_colony_collapse');
assert.equal(pollinatorColony.reviewMode, 'detailed_evidence_review');
assert.equal(pollinatorColony.reviewed.result.value, 3.3);
assert.equal(pollinatorColony.reviewed.result.grade.letter, 'B');
assert.equal(pollinatorColony.reviewed.result.uncertainty.lower, 1);
assert.equal(pollinatorColony.reviewed.result.uncertainty.upper, 7.8);
assert.equal(pollinatorColony.reviewed.result.confidence, 'D');
assert.deepEqual(pollinatorColony.reviewed.candidate.applicableDomains, ['ecosystem']);
assert.equal(pollinatorColony.reviewed.candidate.components.human.structuralZero, true);
assert.deepEqual(pollinatorColony.reviewed.candidate.components.ecosystem.central, { severity: 1, reach: 1, persistence: 1 });
assert.match(pollinatorColony.reviewed.candidate.currentWindow.coverageNote, /contract is bound to Pollinator Service Decline/i);
const pollenAllergenSpikes = allById.get('pollen_allergen_spikes');
assert.equal(pollenAllergenSpikes.reviewMode, 'detailed_evidence_review');
assert.equal(pollenAllergenSpikes.reviewed.result.value, 3.3);
assert.equal(pollenAllergenSpikes.reviewed.result.grade.letter, 'B');
assert.equal(pollenAllergenSpikes.reviewed.result.uncertainty.lower, 1);
assert.equal(pollenAllergenSpikes.reviewed.result.uncertainty.upper, 5.5);
assert.equal(pollenAllergenSpikes.reviewed.result.confidence, 'C');
assert.deepEqual(pollenAllergenSpikes.reviewed.candidate.applicableDomains, ['human']);
assert.deepEqual(pollenAllergenSpikes.reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 1 });
assert.equal(pollenAllergenSpikes.reviewed.candidate.components.ecosystem.structuralZero, true);
assert.match(pollenAllergenSpikes.finding, /national allergic-rhinitis cases.*27 observation years/i);
for (const [nodeId, value, grade, lower, upper, domains, humanAxes, ecosystemAxes] of [
  ['peak_glacier_runoff_passage', 4.4, 'B', 1.8, 7, ['human', 'ecosystem'], { severity: 1, reach: 1, persistence: 2 }, { severity: 1, reach: 2, persistence: 2 }],
  ['glacier_meltwater_dependency', 5.5, 'C', 1.8, 8.5, ['human'], { severity: 0, reach: 4, persistence: 2 }, null],
  ['topsoil_salinization_fields', 5.5, 'C', 3.3, 7.8, ['human', 'ecosystem'], { severity: 2, reach: 1, persistence: 2 }, { severity: 2, reach: 2, persistence: 3 }],
  ['surface_water_storage_instability', 4.4, 'B', 2.5, 7, ['human', 'ecosystem'], { severity: 0, reach: 3, persistence: 2 }, { severity: 1, reach: 1, persistence: 2 }],
  ['reservoir_operating_shortfall', 3.3, 'B', 1, 6.3, ['human'], { severity: 1, reach: 1, persistence: 1 }, null],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, value, nodeId);
  assert.equal(row.reviewed.result.grade.letter, grade, nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, lower, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, upper, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, domains, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.human.central, humanAxes, nodeId);
  if (ecosystemAxes) assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, ecosystemAxes, nodeId);
  else assert.equal(row.reviewed.candidate.components.ecosystem.structuralZero, true, nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.reach, /unique|dependence|affected basin share/i, nodeId);
}
assert.match(allById.get('peak_glacier_runoff_passage').finding, /stops converting more than two billion/i);
assert.match(allById.get('glacier_meltwater_dependency').finding, /dependence reach only/i);
assert.match(allById.get('topsoil_salinization_fields').finding, /population exposure.*no longer inflate/i);
assert.match(allById.get('surface_water_storage_instability').finding, /residents are now treated as exposure/i);
assert.match(allById.get('reservoir_operating_shortfall').finding, /replacement generation.*no longer substitute/i);
for (const nodeId of ['el_nino', 'la_nina', 'atlantic_multidecadal_oscillation', 'pacific_decadal_oscillation', 'gulf_stream_slowdown']) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, 4, nodeId);
  assert.equal(row.reviewed.result.grade.letter, 'B', nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, 1, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, 7.8, nodeId);
  assert.equal(row.reviewed.result.confidence, 'C', nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, ['human', 'ecosystem'], nodeId);
  assert.deepEqual(row.reviewed.candidate.components.human.central, row.reviewed.candidate.components.ecosystem.central, nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'hazard_or_state', nodeId);
  assert.match(row.reviewed.candidate.decisionTrace.measurementSemantics.severity, /physical index, anomaly or transport value does not establish/i, nodeId);
}
assert.deepEqual(allById.get('el_nino').reviewed.candidate.components.human.central, { severity: 1, reach: 2, persistence: 1 });
assert.deepEqual(allById.get('gulf_stream_slowdown').reviewed.candidate.components.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.match(allById.get('el_nino').finding, /ONI now establishes the physical phase only/i);
assert.match(allById.get('gulf_stream_slowdown').finding, /one section.*no longer become harm/i);
for (const [nodeId, value, grade, lower, upper, domains, humanAxes, ecosystemAxes] of [
  ['estuarine_nursery_loss', 5.9, 'C', 3.3, 8.5, ['human', 'ecosystem'], { severity: 1, reach: 1, persistence: 2 }, { severity: 2, reach: 3, persistence: 4 }],
  ['wetlands_drainage_scales', 6.3, 'C', 4, 7.8, ['ecosystem'], null, { severity: 2, reach: 2, persistence: 3 }],
  ['bark_beetle_epidemics', 4.8, 'C', 2.5, 7.8, ['ecosystem'], null, { severity: 2, reach: 1, persistence: 2 }],
  ['biodiversity_corridors_disruption', 6.3, 'C', 3.3, 9.3, ['ecosystem'], null, { severity: 1, reach: 4, persistence: 2 }],
  ['forest_dieback_areas', 5.5, 'C', 3.3, 8.5, ['ecosystem'], null, { severity: 2, reach: 1, persistence: 3 }],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, value, nodeId);
  assert.equal(row.reviewed.result.grade.letter, grade, nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, lower, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, upper, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, domains, nodeId);
  if (humanAxes) assert.deepEqual(row.reviewed.candidate.components.human.central, humanAxes, nodeId);
  else assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, ecosystemAxes, nodeId);
}
assert.match(allById.get('estuarine_nursery_loss').finding, /proximity and fishery dependence no longer become human severity/i);
assert.match(allById.get('wetlands_drainage_scales').finding, /all-cause loss.*no longer become drainage-specific/i);
assert.match(allById.get('bark_beetle_epidemics').finding, /overlapping annual mapped area.*no longer inflate/i);
assert.match(allById.get('biodiversity_corridors_disruption').finding, /functional severity and recovery remain bounded/i);
assert.match(allById.get('forest_dieback_areas').finding, /program spending.*no longer become forest reach/i);
for (const [nodeId, value, grade, lower, upper, domains, confidence, humanAxes, ecosystemAxes] of [
  ['aerosol_cooling_loss', 4, 'B', 1, 7.8, ['human', 'ecosystem'], 'C', { severity: 1, reach: 1, persistence: 2 }, { severity: 1, reach: 1, persistence: 2 }],
  ['levee_and_channelization_works', 7, 'D', 5.5, 7.8, ['ecosystem'], 'C', null, { severity: 3, reach: 1, persistence: 4 }],
  ['riparian_zone_erosion', 5.1, 'C', 3.3, 7.4, ['human', 'ecosystem'], 'C', { severity: 2, reach: 1, persistence: 3 }, { severity: 1, reach: 1, persistence: 3 }],
  ['lightning_regime_shifts', 3.3, 'B', 1, 8.5, ['human'], 'D', { severity: 1, reach: 1, persistence: 1 }, null],
]) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.result.value, value, nodeId);
  assert.equal(row.reviewed.result.grade.letter, grade, nodeId);
  assert.equal(row.reviewed.result.uncertainty.lower, lower, nodeId);
  assert.equal(row.reviewed.result.uncertainty.upper, upper, nodeId);
  assert.equal(row.reviewed.result.confidence, confidence, nodeId);
  assert.deepEqual(row.reviewed.candidate.applicableDomains, domains, nodeId);
  if (humanAxes) assert.deepEqual(row.reviewed.candidate.components.human.central, humanAxes, nodeId);
  else assert.equal(row.reviewed.candidate.components.human.structuralZero, true, nodeId);
  if (ecosystemAxes) assert.deepEqual(row.reviewed.candidate.components.ecosystem.central, ecosystemAxes, nodeId);
  else assert.equal(row.reviewed.candidate.components.ecosystem.structuralZero, true, nodeId);
}
assert.match(allById.get('aerosol_cooling_loss').finding, /forcing series now establishes a global physical state only/i);
assert.match(allById.get('levee_and_channelization_works').finding, /channel size, spending.*no longer inflate/i);
assert.match(allById.get('riparian_zone_erosion').finding, /projected cost.*no longer become severity/i);
assert.match(allById.get('lightning_regime_shifts').finding, /full casualty record no longer stand in for harm caused by a regime shift/i);
const emissionSourceIds = [
  'tundra_methane_outgassing', 'rice_paddy_methane_bubbles', 'cement_process_emissions',
  'coal_power_co2_output', 'gas_power_co2_output', 'oil_power_co2_output',
  'fossil_power_backup_co2', 'cement_kiln_fuel_co2', 'coal_industrial_heat_co2',
  'construction_material_co2', 'diesel_freight_co2', 'fossil_hydrogen_co2',
  'gas_industrial_heat_co2', 'passenger_road_fuel_co2', 'iron_steel_process_co2',
  'chemical_process_co2', 'refinery_combustion_co2', 'aviation_jet_fuel_co2',
  'shipping_bunker_fuel_co2', 'rail_diesel_co2', 'residential_gas_heat_co2',
  'commercial_gas_heat_co2', 'oil_building_heat_co2', 'waste_incineration_co2',
  'oil_gas_flaring_co2', 'deforestation_co2_release', 'peatland_drainage_co2',
  'land_use_fire_co2',
];
assert.equal(emissionSourceIds.length, 28);
for (const nodeId of emissionSourceIds) {
  const row = allById.get(nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.role, 'emission_source', nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.inheritsAggregateScore, false, nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.attributionStatus, 'unresolved', nodeId);
  assert.equal(row.reviewed.result.confidence, 'D', nodeId);
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
}
const endpointReviewedEmissionSources = emissionSourceIds.filter(nodeId => (
  allById.get(nodeId).reviewed.candidate.causalAllocation.endpointSensitivity
));
assert.equal(endpointReviewedEmissionSources.length, 21);
const endpointPilotById = new Map(endpointPilot.rows.map(row => [row.nodeId, row]));
for (const nodeId of endpointReviewedEmissionSources) {
  const row = allById.get(nodeId);
  const endpointRow = endpointPilotById.get(nodeId);
  const patternPipeline = endpointRow.humanEndpointStage
    .regionalPatternDataGap
    .candidateIndependentEuropeanEndpointBridge
    .longRecordPreparation;
  const expectedPatternStatus = patternPipeline.matchedSourceRemovalHumanEndpoint?.status
    ?? patternPipeline.regionalPatternPromotion?.status
    ?? patternPipeline.exactWeekIndependentPatternAnalysis?.comparison?.status
    ?? patternPipeline.monthlyIndependentPatternAnalysis?.comparison?.status
    ?? patternPipeline.patternAnalysis?.status
    ?? patternPipeline.execution.status;
  assert.equal(row.reviewMode, 'detailed_evidence_review', nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.scoreResponseStatus, 'provisional_family_candidate_not_yet_calibrated_to_source_specific_endpoint', nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.endpointSensitivity.admittedToAxes, false, nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.regionalPatternEvidence.status, expectedPatternStatus, nodeId);
  assert.equal(row.reviewed.candidate.causalAllocation.regionalPatternEvidence.nextGate, endpointRow.nextAction, nodeId);
  assert.equal(
    row.reviewed.candidate.causalAllocation.regionalPatternEvidence.matchedHumanEndpointCompleted,
    patternPipeline.matchedSourceRemovalHumanEndpoint?.humanEndpointCompleted ?? false,
    nodeId,
  );
  assert.match(row.finding, /not yet responsive to the source-specific endpoint/i, nodeId);
}
const inventoryOnlyEmissionSources = emissionSourceIds.filter(nodeId => (
  !allById.get(nodeId).reviewed.candidate.causalAllocation.endpointSensitivity
  && nodeId !== 'tundra_methane_outgassing'
));
assert.equal(inventoryOnlyEmissionSources.length, 6);
for (const nodeId of inventoryOnlyEmissionSources) {
  assert.equal(allById.get(nodeId).reviewed.candidate.causalAllocation.scoreResponseStatus, 'provisional_family_candidate_no_source_specific_endpoint', nodeId);
  assert.equal(allById.get(nodeId).reviewed.candidate.causalAllocation.sourceHistoryFeasibility.ratingEffect, 'none_candidate_retained_at_confidence_d', nodeId);
  assert.match(allById.get(nodeId).reviewed.candidate.causalAllocation.sourceHistoryFeasibility.nextRequiredData, /global|annual|boundary|source-removal/i, nodeId);
}
assert.equal(allById.get('rice_paddy_methane_bubbles').reviewed.candidate.causalAllocation.endpointSensitivity.sourceGas, 'CH4');
assert.equal(allById.get('rice_paddy_methane_bubbles').reviewed.candidate.causalAllocation.endpointSensitivity.physicalResponseBasis, 'path_dependent_methane_gwp_star_response_since_1991');
assert.equal(allById.get('temp').blindComparison, null);

console.log('TULIP catalogue review passed: all 354 issue records, 154 high-priority and 200 medium-priority reviews, explicit pilot traces, numerical coverage, source binding and response preservation.');
