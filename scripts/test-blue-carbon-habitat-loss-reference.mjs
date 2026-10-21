import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/blue-carbon-habitat-loss-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.sources.mangrove2026.sourceSnapshotVersion, 'tulip_gmw_mangrove_extent_reference_2026_09_23_v1');
assert.equal(snapshot.sources.seagrass2026.files.extentSourceData.sha256, '9a4ee1202dee3eff79f201eb7825a9f80b1909156cfdb67409a6a868e509749c');
assert.equal(snapshot.sources.seagrass2026.files.countrySourceData.sha256, 'b9419d691d00aac7322212bf00b4b95435d02aa9500e08acd3b5ee16ae25f50e');
assert.equal(snapshot.sources.saltMarsh2022.conceptId, 'C2575421513-ORNL_CLOUD');
assert.equal(snapshot.currentWindow.coverageStatus, 'mixed_source_native_windows');
assert.equal(snapshot.endpoints.seagrass.gridCellsWithSeagrass, 1_987);
assert(Math.abs(snapshot.endpoints.seagrass.reproducedGridExtentKm2 - 148_506.709938) < 0.000001);
assert.equal(snapshot.endpoints.seagrass.publishedLossPct, 4);
assert.equal(snapshot.endpoints.seagrass.publishedDenseToSparseDegradationPct, 4.2);
assert(snapshot.endpoints.seagrass.ambiguousCountryWorkbookLossTotalKm2 > 40_000);
assert.match(snapshot.endpoints.seagrass.ambiguousCountryWorkbookLossDisposition, /Excluded from TULIP/i);
assert(snapshot.endpoints.mangrove.grossLossPctOfBaseline > 1 && snapshot.endpoints.mangrove.grossLossPctOfBaseline < 10);
assert.equal(snapshot.endpoints.saltMarsh.publishedAnnualNetLossRatePct, 0.28);
assert.equal(snapshot.endpoints.compatibleCurrentHarmedPersonCount, null);
assert.equal(snapshot.endpoints.compatibleSharedBlueCarbonEcosystemDistributionLossPercent, null);
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.9');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.central, { severity: 4, reach: 2, persistence: 3 });
assert.match(snapshot.tulipUse.prohibited.join(' '), /Do not add mangrove, seagrass and salt-marsh percentages/i);
assert.match(snapshot.tulipUse.prohibited.join(' '), /WMO climatological normals/i);

console.log('Blue-carbon habitat-loss reference passed: local condition loss, habitat reach, carbon flux, gains and human services remain separate.');
