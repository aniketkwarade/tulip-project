import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/permafrost-rusting-rivers-current-reference.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_permafrost_rusting_rivers_current_reference_2026_09_24_v1');
assert.equal(payload.status, 'direct_regional_consequence_data_pinned_reach_denominator_missing');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'permafrost_thaw');
assert.equal(payload.sources.npsOccurrenceFile.bytes, 4720);
assert.equal(payload.sources.npsOccurrenceFile.sha256.length, 64);
assert.equal(payload.sources.arcticDataCenterFile.bytes, 52_719);
assert.equal(payload.sources.arcticDataCenterFile.md5, '4ac1957f53b2c56f9d701861bf933fa5');
assert.equal(payload.sources.arcticDataCenterFile.sha256, '6ce5f0471cae6c4d6925b2330fe0fd757294736ad2f280ba07a90d3b80850870');
assert.equal(payload.occurrenceInventory.records, 109);
assert.equal(payload.occurrenceInventory.uniqueLongNames, 109);
assert.equal(payload.occurrenceInventory.uniqueShortNames, 108);
assert(payload.occurrenceInventory.maximumPairwiseDistanceKm > 780);
assert(payload.occurrenceInventory.maximumPairwiseDistanceKm < 781);
assert.match(payload.occurrenceInventory.boundary, /no complete comparable-stream denominator/i);
assert.equal(payload.chemistryInventory.rows, 206);
assert.equal(payload.chemistryInventory.columns, 38);
assert.equal(payload.chemistryInventory.sampleEvents, 153);
assert.equal(payload.chemistryInventory.fieldNames, 61);
assert.equal(payload.chemistryInventory.basins.length, 7);
assert.equal(payload.chemistryInventory.filtration.Filtered, 150);
assert.equal(payload.chemistryInventory.filtration.Unfiltered, 56);
assert.equal(payload.chemistryInventory.sourceNativeRanges.pH.minimum, 2.04);
assert(payload.chemistryInventory.sourceNativeRanges.ironPpm.maximum > 1_100);
assert.equal(payload.reportedFindings.majorTributariesSampled, 10);
assert.equal(payload.reportedFindings.majorTributariesExceedingAtLeastOneChronicMetalThreshold, 9);
assert.match(payload.reportedFindings.reproductionStatus, /not_recalculated/);
assert.equal(payload.evidenceDecision.ratingChange, 'none');
assert.equal(payload.evidenceDecision.candidateRetained.value, 5.9);
assert.match(payload.evidenceDecision.exactRemainingGap, /systematic affected and unaffected classification/i);
assert(payload.evidenceDecision.excludedUse.some(item => /Do not divide 109 affected locations/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Permafrost rusting-rivers reference passed: both official datasets are checksum pinned, the direct regional consequence is retained, and affected locations remain separate from ecosystem reach.');
