import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/ice-albedo-feedback-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_physical_feedback_and_bounded_consequences_ingested');
assert.equal(snapshot.sources.noaaSnow.reportPdf.sha256, 'f095a6929eea4ef64f134ab1c890b543fc4a3be72b67b971fbbb26c6fef6d4cf');
assert.deepEqual(snapshot.currentWindow.referenceNormal, { start: 1991, end: 2020 });
assert.equal(snapshot.endpoints.physicalState.arcticLandSnow.juneExtentDeclinePercentSince1967, 50);
assert.equal(snapshot.endpoints.physicalState.arcticSeaIce.endOfSummerExtentDeclinePercentSince2005, 28);
assert.equal(snapshot.endpoints.physicalState.arcticSeaIce.oldIceDeclinePercentVersus1985To2004Mean, 95);
assert.equal(snapshot.endpoints.assessedHumanConsequences.compatibleUniqueHarmedPersonCount, null);
assert.equal(snapshot.endpoints.assessedHumanConsequences.feedbackOnlyAttributableShare, null);
assert.equal(snapshot.endpoints.assessedEcosystemConsequences.compatibleMovementTowardCollapsePercent, null);
assert.equal(snapshot.endpoints.assessedEcosystemConsequences.compatibleAffectedDistributionPercent, null);
assert(snapshot.tulipUse.prohibited.some(rule => /700 million/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /13\.4%/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.1');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.uncertainty, 'B 4.0 to D 7.4');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.confidence, 'C');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Ice–albedo feedback reference passed: physical snow and ice change is separated from harmed reach, ecological collapse and downstream-node overlap.');
