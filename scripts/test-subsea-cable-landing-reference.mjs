import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/subsea-cable-landing-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'current_service_disruption_and_structural_concentration_evidence_ingested');
assert.equal(snapshot.sources.itu.fetchedReport.sha256, 'c5761c88fd1aa2ad0479d67e0122a9d9ae960c4abf0d34256674d9931ce61003');
assert.equal(snapshot.sources.oecd.fetchedReport.sha256, '49d4d31cc295bd77b702301fd4bf8543a5dfc3aa36bf1300f4fab2eca399d912');
assert.equal(snapshot.sources.worldBank.fetchedReport.sha256, 'bfe6233d22ad638dcc83869ce52ee00259117c756672372424119808ab949cad');
assert.equal(snapshot.endpoints.realizedHumanConsequences.tonga2022.durationDays, 61);
assert.equal(snapshot.endpoints.realizedHumanConsequences.tonga2022.estimatedDamageAndEconomicLossUsd, 182_000_000);
assert.equal(snapshot.endpoints.realizedHumanConsequences.tonga2022.shareOf2021GdpPercent, 38.7);
assert.equal(snapshot.endpoints.realizedHumanConsequences.aae1Cut2022.internationalBandwidthLostPercent, 85);
assert.deepEqual(snapshot.endpoints.concentrationAndFaultContext.annualGlobalFaultRange, { lower: 150, upper: 200 });
assert.equal(snapshot.endpoints.repairAndPersistenceContext.meanResponseToCommenceRepairDays2024LowerBound, 50);
assert.equal(snapshot.endpoints.repairAndPersistenceContext.southeastAsia2023.repairCompletionMonths, 9);
assert(snapshot.tulipUse.prohibited.some(rule => /99%.*people harmed/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /every cable fault.*landing-site failure/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /repair duration.*user-outage persistence/i.test(rule)));
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.rating, 'B 4.0');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.uncertainty, 'B 3.3 to C 6.3');
assert.equal(snapshot.tulipUse.currentCatalogueRecommendation.domain, 'human only');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
})).digest('hex');
assert.equal(snapshot.snapshotDigest, expectedDigest);

console.log('Subsea-cable landing reference passed: infrastructure exposure, faults, repairs, service loss and human consequences remain separate.');
