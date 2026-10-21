import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/watershed-forest-loss-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.nodeId, 'watershed_forest_loss');
assert.equal(snapshot.sources.length, 7);
const mumbai = snapshot.sources.find(source => source.id === 'singh_mishra_mumbai_watershed_deforestation_costs_2014');
const waterQuality = snapshot.sources.find(source => source.id === 'caldwell_southeast_us_forest_water_quality_2023');
const health = snapshot.sources.find(source => source.id === 'rasolofoson_watershed_forest_chlorination_2021');
const recovery = snapshot.sources.find(source => source.id === 'rozendaal_neotropical_secondary_forest_recovery_2019');
const globalHealth = snapshot.sources.find(source => source.id === 'world_bank_upstream_deforestation_child_diarrhoea_2025');
const projectedCosts = snapshot.sources.find(source => source.id === 'nehra_southeast_us_forest_loss_treatment_costs_2025');
const landscape = snapshot.sources.find(source => source.id === 'wang_global_landscape_water_quality_meta_analysis_2024');
assert(mumbai && waterQuality && health && recovery && globalHealth && projectedCosts && landscape);
assert.equal(mumbai.facts.treatmentPlantObservationEndYear, 2011);
assert.equal(mumbai.facts.globalRepresentativeness, false);
assert.equal(waterQuality.facts.publicWaterSupplyIntakes, 1746);
assert.equal(waterQuality.facts.globalRepresentativeness, false);
assert.equal(health.facts.averageChlorinationAssociatedDiarrhoeaReductionPercentagePoints, 3.4);
assert.equal(recovery.facts.speciesRichnessRecoveryAfter20YearsPct, 80);
assert.equal(recovery.facts.speciesCompositionRecoveryAfter20YearsPct, 34);
assert.equal(globalHealth.facts.observations, 794517);
assert.deepEqual(globalHealth.facts.nonRichestAdditionalDiarrhoeaProbabilityPercentagePoints, { lower: 0.611, upper: 0.788 });
assert.equal(globalHealth.facts.pooledOls, true);
assert.equal(projectedCosts.facts.treatmentCostIncreasePct, 1.7);
assert.equal(projectedCosts.facts.projectedNotObservedCurrentBurden, true);
assert.equal(landscape.facts.regionalStudies, 625);
assert.equal(landscape.facts.countries, 63);
assert.match(snapshot.evidenceSynthesis.currentDataGap, /geospatial join/i);
assert.match(snapshot.tulipUse.excluded.join(' '), /Do not mark the current burden as refreshed beyond 2011/i);
assert.match(snapshot.tulipUse.excluded.join(' '), /794,517 children/i);
assert.match(snapshot.tulipUse.scoreDisposition, /Recalculate the candidate/i);

console.log('Watershed forest-loss reference passed: current burden, mechanism, reach, persistence and data gaps remain separate.');
