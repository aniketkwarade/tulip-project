import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/managed-retreat-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_us_property_acquisition_pipeline_and_process_ingested');
assert.equal(snapshot.source.fetchedReport.sha256, 'e9c598be8596f956079cc7e108dfb040384fd36ff71a10d6895f9528f53766bd');
assert.equal(snapshot.endpoints.historicalProgramContext.completedAcquisitions, 69_415);
assert.equal(snapshot.endpoints.currentDecisionCase.identifiedPropertyCaseloadLowerBound, 657);
assert.equal(snapshot.endpoints.processDuration.averageStateApplicationSubmissionDelayMonths, 16);
assert.equal(snapshot.endpoints.processDuration.typicalTotalProcessYearsLowerBound, 2);
assert(snapshot.tulipUse.prohibited.some(rule => /historical completed acquisitions.*currently harmed/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /open-space status.*ecosystem/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.5');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'human only');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: snapshot.source,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Managed-retreat reference passed: current property cases and multi-year decision burden are pinned without converting historical acquisitions into current people or open space into ecosystem harm.');
