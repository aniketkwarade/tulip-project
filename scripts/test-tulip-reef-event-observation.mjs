import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { evaluateRecentReefCoverChange, REEF_EVENT_OBSERVATION_VERSION }
  from '../src/tulip-reef-event-observation.js';
import { REGISTERED_REEF_EVENT_CHANGE_OBSERVATIONS }
  from '../src/tulip-source-observation-registry.js';

const row = REGISTERED_REEF_EVENT_CHANGE_OBSERVATIONS.gcrmn_global_hard_coral_cover_2023_2024;
const snapshotBytes = readFileSync(new URL('../artifacts/tulip-calibration-2026-09-22/coral-bleaching-reference-snapshot.json', import.meta.url));
const snapshot = JSON.parse(snapshotBytes);
assert.equal(row.sourceArtifactSha256, createHash('sha256').update(snapshotBytes).digest('hex'));
assert.equal(row.beforeCoverPct, snapshot.endpoints.globalHardCoralCondition.series.find(x => x.year === 2023).medianPct);
assert.equal(row.afterCoverPct, snapshot.endpoints.globalHardCoralCondition.series.find(x => x.year === 2024).medianPct);
assert.equal(row.mappedReefAreaKm2, snapshot.endpoints.subregionConditionDistribution.mappedGlobalReefAreaM2 / 1e6);

const input = {
  methodVersion: REEF_EVENT_OBSERVATION_VERSION,
  nodeId: 'coral_bleaching', nodeKind: 'issue', domain: 'ecosystem',
  coverage: 'endpoint_only', attributionStatus: 'event_associated_not_apportioned',
  sourceId: row.sourceId, sourceObservation: { ...row },
  geography: row.geography, ecosystemType: row.ecosystemType,
  outcomeKind: row.outcomeKind, yearBefore: row.yearBefore, yearAfter: row.yearAfter,
};
const result = evaluateRecentReefCoverChange(input);
assert.equal(result.status, 'source_bound_event_associated_change');
assert(Math.abs(result.change.absoluteCoverDropPctPoints - 2.52) < 1e-10);
assert(Math.abs(result.change.relativePointEstimateDropPct - 8.907741) < 1e-5);
assert(Math.abs(result.change.coverEquivalentKm2 - 6562.930189) < 1e-5);
assert.equal(result.change.pairedChangeUncertaintyInterval, null);
assert.equal(result.nodeAttributable, false);
assert.equal(result.score, null);
assert.equal(result.publicReady, false);
const futureNode = evaluateRecentReefCoverChange({ ...input, nodeId: 'synthetic_future_reef_node' });
assert.deepEqual(futureNode.change, result.change);

const rejects = (changed, reason) => {
  const output = evaluateRecentReefCoverChange(changed);
  assert.equal(output.status, 'needs_source_native_reef_change');
  assert(output.reasons.includes(reason), `${reason}: ${output.reasons.join(', ')}`);
  assert.equal(output.score, null);
};
rejects({ ...input, sourceObservation: { ...row, afterCoverPct: 20 } },
  'candidate_source_row_differs_from_registry');
rejects({ ...input, sourceObservation: { ...row, coverUnit: 'percent_reefs_bleached' } },
  'compatible_cover_and_area_required');
rejects({ ...input, sourceObservation: { ...row, pairedChangeUncertaintyInterval: [2, 3] } },
  'unsupported_paired_change_interval');
rejects({ ...input, attributionStatus: 'established_for_node' }, 'node_attribution_not_established');
rejects({ ...input, yearBefore: 2020 }, 'yearBefore_source_scope_mismatch');
rejects({ ...input, sourceId: '__proto__' }, 'registered_source_row_required');

console.log(JSON.stringify({ status: 'passed', sourcePinned: true,
  coverEquivalentKm2: result.change.coverEquivalentKm2,
  nodeAdditionInvariant: true, rejectedMismatches: 6,
  nodeAttributionEstablished: false, scoreAssigned: false }, null, 2));
