import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/ocean-acidification-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_ocean_acidification_reference_2026_09_24_v1');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'ocean_acidification');
assert.equal(Object.keys(payload.sources).length, 4);
assert.equal(payload.sources.planetaryBoundary.files.length, 4);
assert.equal(payload.sources.planetaryBoundary.files.find(file => file.name === 'Findlay_OAPB_areaweighted_means_and_SD.csv').md5, '5f387a5c9e84eb2c75c4748d08929b45');
assert.equal(payload.sources.globalBioticFeedback.pdfSha512, '1708f548eb38b8d0f35a980969e6247b0eb528bd19192243e2e52a97c0cb784899541c8bb37c3e499bb562d48d3c8b51aa696fb046e758e2792c0942f97d2758');

assert.equal(payload.evidence.globalChemistry.record.startYear, 1985);
assert.equal(payload.evidence.globalChemistry.record.endYear, 2024);
assert.equal(payload.evidence.globalChemistry.decline1985To2024, 0.065624);
assert.equal(payload.evidence.ecosystemHabitatAndExtent.globalSurfaceAragoniteSaturation.declinePercent, 17.3);
assert.equal(payload.evidence.ecosystemHabitatAndExtent.biologicalThresholds.coastalBivalves.expansionPercentagePoints, 12.2);
assert.equal(payload.evidence.ecosystemHabitatAndExtent.biologicalThresholds.polarPteropods.expansionPercentagePoints, 60.8);
assert.equal(payload.evidence.ecosystemHabitatAndExtent.biologicalThresholds.tropicalAndSubtropicalCorals.expansionPercentagePoints, 42.8);
assert.match(payload.evidence.ecosystemHabitatAndExtent.interpretation, /do not measure observed global ecosystem collapse/i);
assert.equal(payload.evidence.globalBioticPattern.surfaceTotalAlkalinityTrendMicromolPerKgPerYear.estimate, 0.072);
assert.equal(payload.evidence.boundedHumanConsequence.larvalCultureReductionPercentAtLeast, 75);
assert.equal(payload.evidence.boundedHumanConsequence.affectedProductionSeasons, 2);

const { candidate } = payload.ratingDecision;
assert.deepEqual(candidate.previous, { value: 8.1, grade: 'D', lower: 5.9, upper: 9.6, confidence: 'C' });
assert.deepEqual(candidate.revised, { value: 6.3, grade: 'C', lower: 4.4, upper: 8.1, confidence: 'C' });
assert.deepEqual(candidate.axes.human.reach, { lower: 1, central: 1, upper: 2 });
assert.deepEqual(candidate.axes.ecosystem.reach, { lower: 2, central: 3, upper: 4 });
assert(payload.ratingDecision.excludedUses.some(item => /global pH coverage/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /global count of people/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Ocean acidification reference passed: global chemistry is separated from bounded human harm and heterogeneous ecosystem consequence evidence.');
