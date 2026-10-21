import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { reachLevelFromHarmedPeople } from '../src/tulip-consequence-scoring.js';

const artifactDir = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const who = JSON.parse(readFileSync(new URL('who-air-pollution-mortality-row.json', artifactDir)));
const ledger = JSON.parse(readFileSync(new URL('review-ledger.json', artifactDir)));
const node = ledger.nodes.find(item => item.nodeId === 'air_pollution_health_burden');
assert(node && who.indicator === 'AIR_35' && who.scope.geography === 'global' && who.scope.year === 2021);
const deaths = who.modeledDeaths;
assert(deaths.lower95 < deaths.central && deaths.central < deaths.upper95);
const mapped = Object.fromEntries(Object.entries(deaths).map(([key, count]) => [key, {
  sourceModeledDeaths: count,
  affectedReachLevel: reachLevelFromHarmedPeople(count),
}]));
assert(mapped.lower95.affectedReachLevel < mapped.central.affectedReachLevel
  && mapped.central.affectedReachLevel < mapped.upper95.affectedReachLevel);

const review = {
  version: 'tulip_air_pollution_mortality_reach_review_2026_09_27_v1',
  sourceNodeId: node.nodeId,
  status: 'one_endpoint_reach_bound_repaired_full_node_not_validated',
  namedOutcome: 'Modeled deaths attributed to the joint effects of ambient and household air pollution',
  affectedGroup: 'People represented by the global 2021 WHO attributable-death estimate',
  geography: 'global', observationPeriod: '2021 calendar year',
  source: { indicator: who.indicator, url: who.sourceUrl, metadataUrl: who.metadataUrl,
    updatedAt: who.sourceUpdatedAt, displayedInterval: who.sourceDisplayValue },
  sourceInterval: { kind: 'WHO reported 95% confidence interval for modeled deaths', ...mapped },
  correctedDecision: 'For a mortality-only endpoint, the lower, central and upper reach cases all use modeled attributable deaths from the same WHO AIR_35 global row. The 99% exposed-population figure is excluded from every harm bound.',
  remainingGate: [
    'Decide and document how mortality severity and enduring loss map to the TULIP levels without treating the same lost life twice.',
    'Decide whether this node is specifically modeled mortality or includes nonfatal illness; if it includes both, build an overlap-safe combined health-burden endpoint rather than presenting the mortality-only number as the whole node.',
    'Source-verify lower, central and upper joint cases for every scored component; the WHO interval covers mortality reach, not all TULIP axes.',
    'Complete the typed same-outcome assessment and second independent source extraction before any experimental number can replace the public score.',
  ],
  publicScoreUnchanged: node.publicValueUnchanged,
  proposedFullNodeScore: null,
};
writeFileSync(new URL('air-pollution-mortality-reach-review.json', artifactDir), JSON.stringify(review, null, 2) + '\n');
console.log(JSON.stringify({ status: review.status, mapped, publicScoreUnchanged: review.publicScoreUnchanged }, null, 2));
