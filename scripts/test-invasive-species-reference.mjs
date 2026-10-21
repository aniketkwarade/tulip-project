import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/invasive-species-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'approved_global_ipbes_invasive_species_endpoints_ingested');
assert.equal(snapshot.source.fetchedDocument.sha256, 'dc7b05e0c8b42bbb827f76f279ba640241edae37f6604652c7c85077f97e5339');
assert.equal(snapshot.coverage.establishedAlienSpeciesLowerBound, 37_000);
assert.equal(snapshot.coverage.invasiveAlienSpeciesWithDocumentedImpactsLowerBound, 3_500);
assert.equal(snapshot.endpoints.ecosystem.recordedGlobalExtinctionsWithInvasiveSpeciesAsContributorPercent, 60);
assert.equal(snapshot.endpoints.ecosystem.recordedGlobalExtinctionsWithInvasiveSpeciesAsSoleDriverPercent, 16);
assert.equal(snapshot.endpoints.ecosystem.documentedLocalExtinctions, 1_215);
assert.equal(snapshot.endpoints.human.annualGlobalEconomicCost2019UsdBillionLowerBound, 423);
assert.equal(snapshot.endpoints.trendAndManagement.successfulIslandEradicationAttemptsPercent, 88);
assert(snapshot.tulipUse.prohibited.some(rule => /Do not add the 60% contributor share to the 16%/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /shares of documented reports as fractions of global ecosystem area/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'D 7.8');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: snapshot.source,
  coverage: snapshot.coverage,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Invasive-species reference passed: extinction, economic loss, coverage and recovery evidence are pinned without turning report shares into reach denominators.');
