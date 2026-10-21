import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/ice-sheet-mass-loss-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.currentWindow.end, 2023);
assert.equal(snapshot.sources.imbie2026.files.greenlandMassBalance.sha256, '1d4df7c73845ab9194fd07999ce7a7716d01ef5c9fbc2d4a464be5afc6b52a26');
assert.equal(snapshot.sources.imbie2026.files.antarcticaMassBalance.sha256, 'cdb5f37c703af3fb36ccbf89f6ca0ba8b444817cb48ff34cc77ca7a9d9a525b2');
assert.equal(snapshot.endpoints.physicalState.combinedIceLoss1979To2023Gt.central, 11_309);
assert.equal(snapshot.endpoints.physicalState.combinedGlobalMeanSeaLevelContribution1979To2023Mm.central, 31.4);
assert.equal(snapshot.endpoints.physicalState.checksumReproduction.greenlandMonthlyRows, 630);
assert.equal(snapshot.endpoints.physicalState.checksumReproduction.antarcticaMonthlyRows, 540);
assert.equal(snapshot.endpoints.localEcosystemConsequences.annualPrimaryProductionGramsCarbonPerSquareMetre.landTerminatingFjord, 30);
assert.equal(snapshot.endpoints.outlookContext.scenario, 'SSP2-4.5');
assert.equal(snapshot.endpoints.compatibleCurrentHarmedPersonCount, null);
assert.equal(snapshot.endpoints.compatibleGlobalAffectedEcosystemDistributionPercent, null);
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 5.1');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.human.central, { severity: 1, reach: 1, persistence: 3 });
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.central, { severity: 2, reach: 1, persistence: 3 });
assert.match(snapshot.tulipUse.prohibited.join(' '), /Do not convert ice lost.*human or ecosystem reach/i);
assert.match(snapshot.tulipUse.prohibited.join(' '), /Do not add Sea Level Rise/i);

console.log('Ice-sheet mass-loss reference passed: physical state, local ecosystem effects, downstream harm and outlook remain separate.');
