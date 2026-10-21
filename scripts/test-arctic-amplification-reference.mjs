import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/arctic-amplification-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_amplification_and_bounded_consequences_ingested');
assert.equal(snapshot.sources.noaaReportCard.reportPdf.sha256, 'f095a6929eea4ef64f134ab1c890b543fc4a3be72b67b971fbbb26c6fef6d4cf');
assert.equal(snapshot.currentWindow.referenceNormal.start, 1991);
assert.equal(snapshot.currentWindow.referenceNormal.end, 2020);
assert.equal(snapshot.endpoints.physicalState.latestAnnualAnomalyCelsiusAbove1991To2020, 1.60);
assert.deepEqual(snapshot.endpoints.physicalState.seasonalTrendsSince2006CelsiusPerDecade.autumn, { arctic: 0.77, global: 0.33 });
assert.deepEqual(snapshot.endpoints.physicalState.seasonalTrendsSince2006CelsiusPerDecade.winter, { arctic: 0.87, global: 0.35 });
assert.equal(snapshot.endpoints.assessedHumanConsequences.compatibleUniqueHarmedPersonCount, null);
assert.equal(snapshot.endpoints.assessedEcosystemConsequences.compatibleMovementTowardCollapsePercent, null);
assert(snapshot.tulipUse.prohibited.some(rule => /0\.050603% spatial-data fraction/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 6.3');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.uncertainty, 'B 4.4 to D 7.8');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.confidence, 'C');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.human.central, { severity: 2, reach: 1, persistence: 2 });
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.central, { severity: 2, reach: 3, persistence: 4 });

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Arctic-amplification reference passed: observed amplification is separated from harmed reach, terminal severity and downstream-node overlap.');
