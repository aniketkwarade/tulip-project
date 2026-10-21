import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/palm-oil-canopy-clearance-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_extent_clearance_ecosystem_effect_and_recovery_evidence_ingested');
assert.equal(snapshot.sources.synthesis.fetchedReport.sha256, '7cf3053cc2e3787fffbd2d794e7da80e826408aee74a9535bb822070a7f7bfd3');
assert.equal(snapshot.sources.synthesisResults.fetchedArchive.sha256, '0a6c3b14b522be38521d17bd17f0625414c0c2c0c92906a7dfdc5cd62d040662');
assert.equal(snapshot.sources.sumatra.fetchedReport.sha256, '3dfe837d27f13de2e9953a461ea0b00517d51c92285e2ff1d232ba0217a232ce');
assert.equal(snapshot.sources.restoration.fetchedReport.sha256, 'd9bb278f1eec4257b5f14a27b019b7e066a2f05024b4df885ab4eb3833037386');
assert.equal(snapshot.sources.globalMap.landCoverWorkbook.sha256, '3c736ee5de1bac38b9a7fa291a0c25e7646928d0921ab1497a979dde62ebd844');
assert.equal(snapshot.sources.globalMap.extentWorkbook.sha256, '0bb533ffe1f6070f7f06a538d58a2766263fa2e0de85ad1399f6a4ec231fb574');
assert.equal(snapshot.endpoints.localEcosystemConsequences.rainforestToOilPalmDeclinesPercent.speciesRichness, 45);
assert.equal(snapshot.endpoints.localEcosystemConsequences.rainforestToOilPalmDeclinesPercent.biomass, 52);
assert.equal(snapshot.endpoints.crossMetricSynthesis.ecosystemVariables, 82);
assert.equal(snapshot.endpoints.crossMetricSynthesis.variablesWithSignificantDisturbanceGradientDifference, 60);
assert(Math.abs(snapshot.endpoints.currentGlobalExtentAndAttribution.correctedExtent.totalOilPalmHa - 29_858_951.525024064) < 1e-6);
assert(Math.abs(snapshot.endpoints.currentGlobalExtentAndAttribution.mappedOldGrowthClearanceLinkedToCurrentOilPalm.totalOldGrowthClearanceHa - 5_858_013.263675054) < 1e-6);
assert.equal(snapshot.endpoints.globalReachContext.centralReachLevel, 1);
assert.equal(snapshot.endpoints.globalReachContext.upperReachLevel, 2);
assert(snapshot.endpoints.globalReachContext.mappedClearanceShareOfBroadPrimaryForestPercent < 1);
assert.equal(snapshot.endpoints.recoveryAndPersistence.treeIslands, 52);
assert(snapshot.tulipUse.prohibited.some(rule => /local decline.*global ecosystem loss/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /overlapping global and Indonesia/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 6.3');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.uncertainty, 'C 4.8 to D 7.8');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.confidence, 'B');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'ecosystem only');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Palm-oil clearance reference passed: local ecosystem consequence, global extent, attribution, denominator and recovery remain separate.');
