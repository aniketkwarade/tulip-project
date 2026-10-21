import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/reservoir-storage-instability-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.currentWindow.end, 2026);
assert.equal(snapshot.sources.sedimentation2026.files.supplementaryMethods.sha256, '0054d6797474992b716f57c6ae044d5afb4b8b0f66c5a430c3d2950495d271e6');
assert.equal(snapshot.sources.sedimentation2026.files.mainSourceData.sha256, 'b16b11cb73671be554bcc0fb0686e8e079ad63cd8f005eb400e98bb18e661aab');
assert.equal(snapshot.endpoints.globalSedimentationModel.reservoirs, 555_960);
assert.equal(snapshot.endpoints.globalSedimentationModel.reservoirsUnderOneSquareKilometre, 530_301);
assert.equal(snapshot.endpoints.globalSedimentationModel.globalAverageStorageLossPerDecadePercent, 7.3);
assert.equal(snapshot.endpoints.exposureContext.waterSupplyExposurePeopleLowerBound, 2_000_000_000);
assert.equal(snapshot.endpoints.exposureContext.compatibleCurrentHarmedPersonCount, null);
assert.equal(snapshot.endpoints.exposureContext.compatibleCurrentEcosystemConditionLossPercent, null);
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 4.8');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.human.central, { severity: 1, reach: 1, persistence: 3 });
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.central, { severity: 1, reach: 1, persistence: 3 });
assert.match(snapshot.tulipUse.prohibited.join(' '), /two billion people.*currently harmed/i);
assert.match(snapshot.tulipUse.prohibited.join(' '), /26% irrigated-land.*ecosystem reach/i);

console.log('Reservoir storage instability reference passed: physical storage loss, exposure, realized harm, ecosystem condition and projections remain separate.');
