import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/old-growth-forest-logging-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.currentWindow.end, 2025);
assert.equal(snapshot.sources.fra2025.file.sha256, '9b77d433587bec0c6882a3f9e06c96ad6eb33ffe823bfe910e4f6a418cc68d27');
assert.equal(snapshot.sources.loggingThresholds2024.supplement.sha256, '34f45d4f69ef0e186d0cecd5a62edbde79938eb991400cb5f164674d62afdcdb');
assert.equal(snapshot.endpoints.globalPrimaryForestContext.primaryForestArea2025Ha, 1_176_142_000);
assert.equal(snapshot.endpoints.globalPrimaryForestContext.annualNetLoss2015To2025Ha, 1_609_000);
assert.match(snapshot.endpoints.globalPrimaryForestContext.causeResolution, /do not show.*deforestation or conversion/i);
assert.equal(snapshot.endpoints.directLoggingEffects.taxaModelled, 1_681);
assert.equal(snapshot.endpoints.directLoggingEffects.lightlyLoggedBiomassRemovalThresholdPercent, 29);
assert.equal(snapshot.endpoints.directLoggingEffects.heavilyDegradedBiomassRemovalThresholdPercent, 68);
assert.equal(snapshot.endpoints.compatibleGlobalLoggingAttributableEcosystemAreaPercent, null);
assert.equal(snapshot.endpoints.compatibleCurrentHumanConsequence, null);
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'C 4.8');
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.human.central, { severity: 1, reach: 1, persistence: 2 });
assert.deepEqual(snapshot.tulipUse.currentCatalogueRecommendation.axes.ecosystem.central, { severity: 2, reach: 1, persistence: 3 });
assert.match(snapshot.tulipUse.prohibited.join(' '), /Do not attribute all global primary-forest net loss to logging/i);
assert.match(snapshot.tulipUse.prohibited.join(' '), /Sabah shares.*global ecosystem area/i);

console.log('Old-growth forest logging reference passed: global primary-forest context, logging-attributable ecological damage, reach and human harm remain separate.');
