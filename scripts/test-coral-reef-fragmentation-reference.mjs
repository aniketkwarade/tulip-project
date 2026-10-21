import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/coral-reef-fragmentation-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.version, 'tulip_coral_reef_fragmentation_2026_09_24_v1');
assert.equal(snapshot.nodeId, 'coral_reef_fragmentation');
assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.sources.fragmentationStudy.pdfSha256, '25e1335f7ecb41dbba256cf443b82375955f3db3fa444fb576453c780e53e835');
assert.equal(snapshot.sources.globalReefMap.pdfSha256, '566880c9a7c87d474279c5353d6674cb47cee75b852fd8b14271a89e694c38e5');
assert.equal(snapshot.evidence.studyDesign.sites, 17);
assert.equal(snapshot.evidence.studyDesign.reefs, 15);
assert.equal(snapshot.evidence.observedCondition.absolutePercentagePointChange, -4.5);
assert.equal(snapshot.evidence.observedCondition.sitesWithIncreasedCoralEdge, 15);
assert.equal(snapshot.evidence.observedCondition.rugosityChanged, false);
assert.equal(snapshot.evidence.observedCondition.coralMetricMeanChangesStatisticallySignificantAcrossSites, false);
assert.equal(snapshot.evidence.globalDenominatorContext.coralHabitatAreaSquareKilometres, 80213);
assert.equal(snapshot.evidence.boundaries.compatibleGlobalFragmentedAreaPercent, null);
assert.equal(snapshot.evidence.boundaries.compatibleRecoveryTimeDistribution, null);
assert.deepEqual(snapshot.ratingDecision.candidate.axes.ecosystem, {
  severity: { lower: 0, central: 1, upper: 2 },
  reach: { lower: 1, central: 1, upper: 2 },
  persistence: { lower: 0, central: 1, upper: 3 },
});
assert.deepEqual(snapshot.ratingDecision.candidate.revised, { value: 3.3, grade: 'B', lower: 1.8, upper: 6.3, confidence: 'C' });
assert.equal(snapshot.ratingDecision.excludedUses.length, 6);
assert.equal(snapshot.ratingDecision.exactRemainingGaps.length, 5);

console.log('Coral reef fragmentation reference snapshot passed.');
