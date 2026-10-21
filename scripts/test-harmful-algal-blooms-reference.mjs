import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/harmful-algal-blooms-reference-snapshot.json', import.meta.url), 'utf8'));
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_human_and_ecosystem_consequences_ingested');
assert.equal(snapshot.sources.globalAssessment.compositionClaim.sha256, '567830adc0e873c19ac43d86dcd82b2ba33eeb60c94414653ec156fe824bbd27');
assert.equal(snapshot.sources.currentMortality.abstractClaim.sha256, 'a00a9925c097f4699b04f85da88536c263e8ac57428c9b274ae13327308e1697');
assert.equal(snapshot.sources.currentMortality.supplementaryData.sha256, '5ac8fee02512dc666cb87b31ffddb9766b6d84fa34f8ef5fdf2fa2a8f097a671');
assert.equal(snapshot.sources.ciguateraAssessment.fetchedDocument.sha256, '324bcbb0302e9b1e96f0baab5829059fb516f3fd0186f7364fb1bf3d77efbbae');
assert.equal(snapshot.sources.ipccHealth.outlookClaim.sha256, 'edb1b2fc8fb2ceca1028808a8c4b7ed1181fb8a764608ca9ab30dfc768b5e4e9');
assert.equal(snapshot.endpoints.globalEventRecord.recordedEvents, 9_503);
assert.equal(snapshot.endpoints.globalEventRecord.eventSharesPercent.massAnimalOrPlantMortality, 7);
assert.equal(snapshot.endpoints.globalEventRecord.recordsWithMultipleEventTypesPercent, 11);
assert.equal(snapshot.endpoints.globalEventRecord.monitoringAdjustedTrend.p, 0.18);
assert.equal(snapshot.endpoints.humanConsequences.ciguateraAnnualAffectedPeople.lower, 10_000);
assert.equal(snapshot.endpoints.humanConsequences.ciguateraAnnualAffectedPeople.upper, 50_000);
assert.equal(snapshot.endpoints.humanConsequences.chronicSymptomShareLowerBoundPercent, 20);
assert.equal(snapshot.endpoints.currentEcosystemEvent.durationMonthsLowerBound, 12);
assert.equal(snapshot.endpoints.currentEcosystemEvent.deathsApproximate, 1_000_000);
assert.equal(snapshot.endpoints.currentEcosystemEvent.affectedTaxaLowerBound, 600);
assert.match(snapshot.endpoints.currentEcosystemEvent.boundary, /not a percentage movement toward global ecosystem collapse/i);
assert.match(snapshot.endpoints.persistenceAndRecovery.boundary, /1985–2018 observation record is not persistence/i);
assert(snapshot.tulipUse.prohibited.some(rule => /Do not use 9,503 reports/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /Do not treat the 7% mass-mortality event share/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.5');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.uncertainty, 'B 3.6 to D 7.4');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.centralAxes, { human: [2, 2, 2], ecosystem: [2, 2, 2] });

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);
console.log('Harmful-algal-blooms reference passed: illnesses, event composition, ecosystem mortality, monitoring coverage and persistence remain separate.');
