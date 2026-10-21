import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/road-stream-crossing-current-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_road_stream_crossing_current_reference_2026_09_25_v1');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.deepEqual(snapshot.appliesToNodeIds, ['road_stream_crossing_barriers']);
assert.equal(snapshot.sources.usgsCulvertSynthesis2024.pdf.bytes, 9_638_862);
assert.equal(snapshot.sources.usgsCulvertSynthesis2024.pdf.sha256, '8a4929964b2e32bab3e3e671ce5d3ab8649ae5a7bee5f0b24bdae83abd322798');
assert.equal(snapshot.sources.nationalAquaticBarrierInventory2026.version, '4.3.0');
assert.equal(snapshot.sources.culvertRemovalReview2026.doi, '10.1093/fshmag/vuag047');
assert.equal(snapshot.sources.perchedCulvertRemoval2023.doi, '10.1086/723046');
assert.equal(snapshot.sources.tidalCulvertRestoration2026.doi, '10.1002/2688-8319.70244');
assert.equal(snapshot.evidence.currentUnitedStatesInventory.renderedIdentifiedCrossings, 6_318_091);
assert.equal(snapshot.evidence.currentUnitedStatesInventory.surveyedRoadStreamCrossings, 365_439);
assert.equal(snapshot.evidence.currentUnitedStatesInventory.currentSurveyedCrossingsLikelyImpact, 163_768);
assert.equal(snapshot.evidence.currentUnitedStatesInventory.analyzedForConnectivity, 97_646);
assert.equal(snapshot.evidence.currentUnitedStatesInventory.removedOrImproved, 17_302);
assert.equal(snapshot.evidence.currentUnitedStatesInventory.reportedTotalFieldAccountingDifference, 11_334);
assert.equal(snapshot.evidence.restorationEvidence.systematicReview.studies, 11);
assert.equal(snapshot.evidence.restorationEvidence.systematicReview.metaAnalysisCompleted, false);
assert.equal(snapshot.evidence.restorationEvidence.perchedCulvertCase.upstreamMovementBeforeRemoval, false);
assert.equal(snapshot.evidence.restorationEvidence.perchedCulvertCase.allTrackedSpeciesDetectedAboveAfterRemovalEachYear, true);
assert.equal(snapshot.evidence.restorationEvidence.tidalCulvertCase.fishConclusivelyPassingNewCulvertsPercent, 4);
assert.deepEqual(snapshot.ratingDecision.candidate, {
  prior: { value: 5.1, grade: 'C', lower: 2.9, upper: 7.4, confidence: 'C', domains: ['human', 'ecosystem'] },
  revised: { value: 4.8, grade: 'C', lower: 2.5, upper: 7, confidence: 'C', domains: ['ecosystem'] },
});
assert.equal(snapshot.ratingDecision.axes.human.structuralZero, true);
assert.deepEqual(snapshot.ratingDecision.axes.ecosystem, {
  severity: { lower: 0, central: 1, upper: 2 },
  reach: { lower: 1, central: 2, upper: 3 },
  persistence: { lower: 1, central: 2, upper: 3 },
});
assert.equal(snapshot.ratingDecision.excludedUses.length, 8);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 6);

console.log('Road-stream-crossing current-reference checks passed.');
