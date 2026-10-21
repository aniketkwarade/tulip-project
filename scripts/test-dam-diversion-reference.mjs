import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/dam-diversion-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.nodeId, 'dam_and_diversion_infrastructure');
assert.deepEqual(snapshot.appliesToNodeIds, ['dam_and_diversion_infrastructure', 'riverine_habitat_fragmentation']);
assert.equal(snapshot.sources.length, 5);
const rivers = snapshot.sources.find(source => source.id === 'global_free_flowing_rivers_assessment_2019');
const fish = snapshot.sources.find(source => source.id === 'barbarossa_global_fish_range_connectivity_2020');
const human = snapshot.sources.find(source => source.id === 'zhang_recent_hydropower_nearby_impacts_2022');
const recovery = snapshot.sources.find(source => source.id === 'tamario_diadromous_fragmentation_meta_analysis_2025');
const current = snapshot.sources.find(source => source.id === 'zhang_global_hydropower_freshwater_biodiversity_2026');
assert(rivers && fish && human && recovery && current);
assert.equal(rivers.facts.longRiversNotFreeFlowingPct, 63);
assert.equal(rivers.facts.exposureIsNotHarm, true);
assert.equal(fish.facts.assessedLoticFishSpecies, 9794);
assert.deepEqual(fish.facts.impliedMeanConnectivityLossPct, { nondiadromous: 27, diadromous: 14 });
assert.equal(human.facts.impactStudyDams, 631);
assert.equal(human.facts.postCommissionComparisonYears, 3);
assert.deepEqual(recovery.facts.damRemovalPositiveResponseYears, { lower: 1, upper: 11 });
assert.equal(current.facts.threatStatusPeriod.end, 2022);
assert.deepEqual(snapshot.tulipUse.proposedAxes.human.reach, { lower: 1, central: 2, upper: 3 });
assert.deepEqual(snapshot.tulipUse.proposedAxes.ecosystem.reach, { lower: 3, central: 3, upper: 4 });
assert.deepEqual(snapshot.tulipUse.riverineHabitatFragmentationAxes.ecosystem.severity, { lower: 1, central: 2, upper: 3 });
assert.deepEqual(snapshot.tulipUse.riverineHabitatFragmentationAxes.ecosystem.persistence, { lower: 2, central: 3, upper: 3 });
assert.match(snapshot.tulipUse.excluded.join(' '), /Do not count 158 million/i);
assert.match(snapshot.evidenceSynthesis.attributionBoundary, /adverse consequences rather than net social value/i);

console.log('Dam and diversion reference passed: exposure, harm, connectivity, reach, persistence and attribution remain separate.');
