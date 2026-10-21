import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/phytoplankton-decline-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_global_npp_function_and_reach_ingested');
assert.equal(snapshot.sources.article.spatialTrendClaim.sha256, '069628813fe6ec73d66563f8d16eb4613569b9f20484e039c143f9fc5531ef6b');
assert.equal(snapshot.sources.article.globalTrendClaim.sha256, 'ade26efb893c9294c277435d56b18a2b823209c831322dc78f7d4fb0fbcd0796');
assert.equal(snapshot.sources.archive.figure4.bytes, 12_356_558);
assert.equal(snapshot.sources.archive.figure4.md5, 'c9a84d8b9059c16ce23b574a9d3ca49d');
assert.equal(snapshot.sources.archive.figure4.sha256, '164712e7612ebb76924bc7e0d133b19ef0423acb59b2909ec1691a87f37ec071');
assert.equal(snapshot.sources.ipcc.observedAssessmentClaim.sha256, 'd5cda1af161f6f25e621f8d36f9bc4d55ec8487d09b92086b55b70790d7165fe');
assert.equal(snapshot.sources.ipcc.projectionAssessmentClaim.sha256, '93724a7c19233327b0850bc42156fa97bed144b6e32eb3f3de09c435bb32d050');
assert.equal(snapshot.endpoints.currentFunction.record.end, 2022);
assert.equal(snapshot.endpoints.currentFunction.netDecreaseAcrossRecordPercent, 7.4);
assert.equal(snapshot.endpoints.spatialReach.oceanAreaWithSignificantDeclinePercent, 48);
assert.equal(snapshot.endpoints.spatialReach.oceanAreaWithSignificantIncreasePercent, 4);
assert.match(snapshot.endpoints.currentFunction.severityBoundary, /not 7\.4% species loss/i);
assert.match(snapshot.endpoints.attributionAndPersistence.persistenceBoundary, /not a 25-year recovery time/i);
assert(snapshot.tulipUse.prohibited.some(rule => /Fishery Protein Dependence/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.5');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.confidence, 'B');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Phytoplankton-decline reference passed: functional loss, spatial reach, record length and downstream harms remain separate.');
