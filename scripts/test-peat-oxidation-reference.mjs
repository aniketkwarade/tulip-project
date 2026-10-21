import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/peat-oxidation-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.sources.faostat.file.bytes, 585_655);
assert.equal(snapshot.sources.faostat.file.sha256, 'd2f65fac574a4b58a422d41b4de4559b616fd9dd9c49cbaa448fab4b34aab003');
assert.deepEqual(snapshot.currentWindow, {
  start: 2022,
  end: 2022,
  coverageStatus: 'complete',
  summaryMethod: 'annualized_flow',
  coverageNote: 'The October 2025 release contains 1990–2024 estimates, but the 2023 and 2024 World values are source-flagged I (imputed). TULIP therefore uses 2022 as the latest non-imputed annual state.',
});
const endpoint = snapshot.endpoints.agriculturalDrainedOrganicSoils;
assert.equal(endpoint.latestNonImputed.year, 2022);
assert.equal(endpoint.latestNonImputed.areaHa, 24_593_322.008);
assert.equal(endpoint.latestNonImputed.co2KtPerYear, 830_200.724);
assert.equal(endpoint.latestNonImputed.co2TonnesPerHaPerYear, 33.757161);
assert.equal(endpoint.history.co2KtPerYear1990, 750_897.1094);
assert.equal(snapshot.endpoints.broaderPeatlandContext.drainedOrDegradedCurrentPeatlandsPct, 12);
assert.equal(snapshot.endpoints.recoveryContext.sites, 151);
assert.equal(snapshot.endpoints.compatibleDirectHumanConsequence, null);
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.domains, ['ecosystem']);
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.central, { severity: 2, reach: 2, persistence: 3 });
assert.match(snapshot.tulipUse.prohibited.join(' '), /imputed 2023 or 2024/i);
assert.match(snapshot.tulipUse.prohibited.join(' '), /direct human harm/i);

console.log('Peat oxidation reference passed: current flux, source flags, ecosystem function, recovery and downstream harm remain separate.');
