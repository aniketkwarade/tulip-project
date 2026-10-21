import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/wildfire-regime-shift-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'climate_attributed_human_mortality_and_global_forest_recovery_evidence_ingested');
assert.equal(snapshot.sources.human.files.sourceData.sha256, '4a5d5c1ebf1703c1aec7e6facf12308714bce20e66e3efab4bf19a261fa9d2c5');
assert.equal(snapshot.sources.human.files.readme.md5, '45f31fa4ce640083dcd2bac403a1dba9');
assert.equal(snapshot.sources.ecosystem.files.supplementary.sha256, 'fe947930335fe4dc25075d19897beae72ab2d240beeb9a0397e786aca184894a');
assert.equal(snapshot.endpoints.human.currentPublishedDecade.annualFirePm25Deaths, 98_748);
assert.equal(snapshot.endpoints.human.currentPublishedDecade.annualDeathsAttributedToClimateChange, 12_566);
assert.equal(snapshot.endpoints.human.currentPublishedDecade.attributedSharePercent, 12.8);
assert.equal(snapshot.endpoints.human.earliestPublishedDecade.annualDeathsAttributedToClimateChange, 669);
assert.deepEqual(snapshot.endpoints.human.publicSourceDataCheck.labelledDecades, [1960, 1970, 1980, 1990, 2000]);
assert.equal(snapshot.endpoints.human.publicSourceDataCheck.article1960sTotalReproducedAfterRounding, true);
assert.equal(snapshot.endpoints.human.publicSourceDataCheck.article2010sAggregatePresentInCompactWorkbook, false);
assert.equal(snapshot.endpoints.ecosystem.largeSingleTimeFireEvents, 3_281);
assert.equal(snapshot.endpoints.ecosystem.minimumEventAreaKm2, 10);
assert.equal(snapshot.endpoints.ecosystem.recoveryTimeIncreaseAfter2010Percent.grossPrimaryProductivity, 27.3);
assert.equal(snapshot.endpoints.ecosystem.codeBoundary.notebooks, 9);
assert.match(snapshot.endpoints.ecosystem.recoveryWithinSevenYears, /Fewer than one-third/i);
assert(snapshot.tulipUse.prohibited.some(rule => /Do not assign all 98,748/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /fire occurrence itself/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /2027–2036/i.test(rule)));

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Wildfire-regime-shift reference passed: attributable deaths, forest recovery and non-overlap boundaries remain separate.');
