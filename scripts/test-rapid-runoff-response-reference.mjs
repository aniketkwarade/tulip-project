import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/rapid-runoff-response-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_human_consequences_and_ecosystem_limitations_ingested');
assert.equal(snapshot.sources.globalFloodDatabase.supplementaryTable.sha256, '2425ba64941c03ebac484ffb16b776199fe57627eed268ab955ca668e6ccb7bb');
assert.equal(snapshot.sources.riverMetaAnalysis.structuralData.sha256, '80a41464973bf5721b2b333a3243a4255231f6894b7329f0b14f6054a0d33678');
assert.equal(snapshot.sources.futureFloodModel.regionalVariationClaim.sha256, '0bf716502c3e0f5d089578fb9a222df8f400cda1cb6e5a8d2560f4326013b3ca');
assert.equal(snapshot.endpoints.globalEventRecord.qualityControlledLargeFloodEvents, 913);
assert.equal(snapshot.endpoints.runoffLinkedEvents.fullRecord.events, 803);
assert.equal(snapshot.endpoints.runoffLinkedEvents.latestFiveYears.events, 139);
assert.equal(snapshot.endpoints.runoffLinkedEvents.latestFiveYears.metrics.deaths.total, 2_652);
assert.equal(snapshot.endpoints.runoffLinkedEvents.latestFiveYears.metrics.displaced.total, 6_518_086);
assert.equal(snapshot.endpoints.runoffLinkedEvents.latestFiveYears.metrics.displaced.annual_median, 1_297_231);
assert.equal(snapshot.endpoints.runoffLinkedEvents.latestFiveYears.event_duration_days.median, 13);
assert.equal(snapshot.endpoints.riverEcosystemEvidence.highFlowStructuralEffectSizes, 32);
assert.equal(snapshot.endpoints.riverEcosystemEvidence.highFlowStructuralStudies, 10);
assert.equal(snapshot.endpoints.riverEcosystemEvidence.highFlowFunctionalEffectSizes, 0);
assert.match(snapshot.endpoints.riverEcosystemEvidence.sourceConclusion, /did not show consistent effects/i);
assert.equal(snapshot.endpoints.outlook.scenario, 'SSP2-4.5');
assert.equal(snapshot.endpoints.outlook.projectedRelativeInundatedAreaChangePercent.pluvial, 4.8);
assert.equal(snapshot.endpoints.outlook.projectedRelativeInundatedAreaChangePercent.fluvial, 1.4);
assert(snapshot.tulipUse.prohibited.some(rule => /255–290 million.*unique people harmed/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /event duration as displacement recovery time/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 4.8');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.uncertainty, 'B 2.9 to D 7.0');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.centralAxes, { human: [3, 3, 1], ecosystem: [1, 1, 1] });

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Rapid-runoff-response reference passed: flood exposure, reported consequences, ecology and outlook remain separate.');
