import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const analysis = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/tidal-wetland-soc-source-grid-analysis.json', import.meta.url),
  'utf8',
));

assert.equal(analysis.version, 'tulip_tidal_wetland_soc_source_grid_analysis_2026_09_24_v1');
assert.equal(analysis.source.archiveMd5, '733d842a56e259035c5fff133068f7fd');
assert.equal(analysis.grid.width, 693);
assert.equal(analysis.grid.height, 232);
assert.equal(analysis.stockReproduction.earlierMeanStockPetagrams, 8.803256);
assert.equal(analysis.stockReproduction.laterMeanStockPetagrams, 8.265589);
assert.equal(analysis.stockReproduction.commonMeanGridCells, 8049);
assert.equal(analysis.spatialSensitivity.periodMeanDifference.decliningCells, 4461);
assert.equal(analysis.spatialSensitivity.periodMeanDifference.decliningCellSharePercent, 55.423034);
assert.equal(
  analysis.spatialSensitivity.relativeDeclineThresholds['5'].shareOfCommonOccupiedCellsPercent,
  42.166729,
);
assert.equal(
  analysis.spatialSensitivity.standardDeviationNonOverlap['1.0'].shareOfComparableCellsPercent,
  43.58006,
);
assert.equal(
  analysis.spatialSensitivity.sourceSuppliedDepthSummedChange.depthChangeGridSumMaximumAbsoluteDifferencePetagrams,
  4.66e-10,
);
assert.equal(analysis.spatialSensitivity.countryAggregateSensitivity.countryLabels, 149);
assert.equal(
  analysis.spatialSensitivity.countryAggregateSensitivity.decliningStockCountries.earlierWetlandAreaLocatedInSelectedCountriesPercent,
  71.632757,
);
assert.equal(analysis.sourceProductReconciliation.periodMeanGridChangePetagrams, -0.537672);
assert.equal(analysis.sourceProductReconciliation.sourceSuppliedDepthSummedChangePetagrams, -0.42536);
assert.equal(analysis.sourceProductReconciliation.countryTableChangePetagrams, -0.52419);
assert.equal(
  analysis.ratingImplication.decision,
  'compact_grid_alone_cannot_set_reach_full_resolution_area_analysis_required',
);
assert.match(analysis.interpretationBoundaries.join(' '), /not the share of the global tidal-wetland distribution harmed/i);

console.log('Tidal-wetland source-grid analysis passed.');
