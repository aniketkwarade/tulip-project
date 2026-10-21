import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/ocean-heat-content-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_physical_state_and_ocean_impact_boundary_ingested');
assert.equal(snapshot.sources.noaa.sourceSnapshot.sha256, 'd52251282e4f063ac85ce8f7d2efe559d879e9c0c929b9886c11c568daf2bfd3');
assert.equal(snapshot.sources.noaa.annualAssessmentClaim.sha256, 'cf1e7b9cea4533feecc52757b227684c426cd5c071cef8caa32a0e017ef74a8e');
assert.equal(snapshot.sources.ipccPhysical.assessedClaim.sha256, '8b5ff102a25df2531d586f70c77ac44168d82909fec12306236db82af35ecc93');
assert.equal(snapshot.sources.ipccImpacts.assessedClaim.sha256, '888bc066297010409a0c6feb91c2dce79fb6532836b8ff68318154769e46286f');
assert.equal(snapshot.sources.wmo.fetchedDocument.sha256, 'c51a14175eacc1303627a8ac7009e6e18bacb365c78b5ce3506b9cb91df24f15');
assert.equal(snapshot.endpoints.physicalState.latestYear, 2025);
assert.equal(snapshot.endpoints.physicalState.latestAnomalyZettajoules, 325.33);
assert.equal(snapshot.endpoints.physicalState.latestStandardErrorZettajoules, 2.67);
assert.match(snapshot.endpoints.physicalState.boundary, /measurement domain, not the share/i);
assert(snapshot.tulipUse.prohibited.some(rule => /zettajoules.*directly into a TULIP harm level/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /connected nodes/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 6.3');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.confidence, 'B');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Ocean-heat-content reference passed: physical state, consequence evidence and harm-axis limits remain separate.');
