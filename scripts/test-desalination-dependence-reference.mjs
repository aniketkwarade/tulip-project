import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/desalination-dependence-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'reliance_separated_from_harm_with_local_ecological_heterogeneity');
assert.equal(snapshot.endpoints.relianceAndBenefitContext.peopleSuppliedDailyMillionApproximate2019, 300);
assert.equal(snapshot.endpoints.humanConsequences.compatibleCurrentHarmedPersonCount, null);
assert.equal(snapshot.endpoints.ecosystemConsequences.facilitiesWithDirectStudyEvidence, 4);
assert.equal(snapshot.endpoints.ecosystemConsequences.israeliSitesWithRobustBenthicResponse, 2);
assert.equal(snapshot.endpoints.ecosystemConsequences.australianFishStudyDetectedDetrimentalEffect, false);
assert.equal(snapshot.endpoints.ecosystemConsequences.compatibleGlobalEcosystemDistributionAffectedPercent, null);
assert(snapshot.tulipUse.prohibited.some(rule => /300 million people supplied.*300 million people harmed/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'B 4.0');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Desalination-dependence reference passed: water-service beneficiaries remain separate from harm and local ecological studies retain observed heterogeneity.');
