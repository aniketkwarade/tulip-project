import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/tidal-wetland-carbon-reversal-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_tidal_wetland_carbon_reversal_2026_09_24_v3');
assert.equal(snapshot.nodeId, 'tidal_wetland_carbon_reversal');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.sources.globalStock.pdfSha256, '961dcfbd32dde2e2a76363a829f793ef491604ce00ea53e89965ee39d8dee71d');
assert.equal(snapshot.sources.globalStock.codeArchiveMd5, '733d842a56e259035c5fff133068f7fd');
assert.equal(snapshot.sources.disturbanceResponse.xmlSha256, '187bafdbde4e579d70f9fbdf6debed24525d24a8f3d867697a98d3768871f0f6');
assert.equal(snapshot.sources.disturbanceResponse.dataSha256, 'ed2cd86feeeee50d19e38885cde921f5cded1d0af04942951feb8910564f243e');
assert.equal(snapshot.sources.saltMarshChange.pdfSha256, '4935bc36352b656ca6f0bd1fc8c2348fda0520458f279c72882d04fd14395574');
assert.equal(snapshot.evidence.globalStockChange.records, 42154);
assert.equal(snapshot.evidence.globalStockChange.uniqueLocations, 5489);
assert.equal(snapshot.evidence.globalStockChange.globalSocChangePercent, -6.11);
assert.equal(snapshot.evidence.globalStockChange.mangroveSocChangePercent, -8.41);
assert.equal(snapshot.evidence.globalStockChange.saltMarshSocChangePercent, 7.92);
assert.equal(snapshot.evidence.globalStockChange.sourceGridReproduction.earlierMeanStockPetagrams, 8.803256);
assert.equal(snapshot.evidence.globalStockChange.sourceGridReproduction.laterMeanStockPetagrams, 8.265589);
assert.equal(snapshot.evidence.globalStockChange.sourceGridReproduction.decliningOccupiedGridCellSharePercent, 55.423034);
assert.equal(snapshot.evidence.globalStockChange.sourceGridReproduction.decliningAtLeastFivePercentOccupiedGridCellSharePercent, 42.166729);
assert.equal(snapshot.evidence.globalStockChange.sourceGridReproduction.sourceProductReconciliation.sourceSuppliedDepthSummedChangePetagrams, -0.42536);
assert.equal(snapshot.evidence.globalStockChange.fullResolutionMeanMapAnalysis.ratingImplication.candidate.value, 7);
assert.equal(snapshot.evidence.globalStockChange.fullResolutionMeanMapAnalysis.ratingImplication.candidate.ecosystemAxes.reach.central, 3);
assert.equal(snapshot.evidence.globalStockChange.fullResolutionMeanMapAnalysis.mappedChange['5'].commonMappedExtentOnly.shareOfUnionMappedWetlandAreaDecliningPercent, 28.969029);
assert.equal(snapshot.evidence.globalStockChange.fullResolutionMeanMapAnalysis.mappedChange['10'].commonMappedExtentOnly.shareOfUnionMappedWetlandAreaDecliningPercent, 20.701543);
assert.equal(snapshot.evidence.disturbanceResponse.pairedObservations, 239);
assert.equal(snapshot.evidence.disturbanceResponse.observedPercentLossExamples.mangroveAquacultureAtThirtyYears, -86.3);
assert.equal(snapshot.evidence.saltMarshChangeAndRecovery.recoveredShareOfLossesBy2019Percent, 4.7);
assert.equal(snapshot.evidence.boundaries.compatibleCurrentHumanConsequence, null);
assert.deepEqual(snapshot.ratingDecision.candidate.axes.ecosystem, {
  severity: { lower: 1, central: 2, upper: 4 },
  reach: { lower: 1, central: 3, upper: 4 },
  persistence: { lower: 2, central: 3, upper: 4 },
});
assert.deepEqual(snapshot.ratingDecision.candidate.revised, { value: 7, grade: 'D', lower: 4, upper: 10, confidence: 'B' });
assert.equal(snapshot.ratingDecision.excludedUses.length, 10);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 5);

console.log('Tidal wetland carbon-reversal reference passed.');
