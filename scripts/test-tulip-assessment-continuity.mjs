import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUBLISHED_NODES } from '../src/data.js';
import { receiptDigest } from './lib/build-tulip-assessments.mjs';
import { resolveAssessmentSourceBasis, validateContinuityArchive, verifyRetainedAssessment } from './lib/tulip-assessment-continuity.mjs';

const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const archive = read('artifacts/tulip-consequence-rule-audit-2026-09-27/public-score-continuity.json');
const node = PUBLISHED_NODES.find(item => item.id === 'glacier_meltwater_dependency');
const receipt = read('public/tulip-urgency-v3-scores.json').receipts.find(item => item.node_id === node.id);
const row = read('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json').issues.find(item => item.nodeId === node.id);
const policy = read('src/tulip-score-policy.json');
const record = read('src/tulip-legacy-score-archive.json').assessmentRegistry.records[node.id];
const input = { node, receipt, row, policy, archive };
const resolve = value => resolveAssessmentSourceBasis({ ...value, fingerprint: receiptDigest });
validateContinuityArchive(archive, PUBLISHED_NODES);
const basis = resolve(input);
assert.equal(basis.sourceDigest, record.sourceDigest);
assert.notEqual(basis.sourceDigest, archive.records[0].correctedSourceDigest);
assert.equal(verifyRetainedAssessment(record, basis, receiptDigest), record);
assert.equal(archive.records[0].replacementAdmitted, false);

// An archival allowance must not become a generic stale-source fallback. These
// changes require review even when the old public number would stay the same.
for (const mutate of [
  value => { value.node.metric_contract.reviewed_at = '2026-09-28'; },
  value => { value.node.source_urls = ['https://example.org/changed-source']; },
  value => { value.receipt.as_of = '2026-09-28'; },
  value => { value.row.result.value = 5.6; },
  value => { value.row.candidate.outlook.direction = 'changed'; },
  value => { value.policy.weights = { human: 0.7, ecosystem: 0.3 }; },
  value => { value.archive.records[0].replacementAdmitted = true; },
  value => { value.archive.records[0].frozenMetricContract.source_id = 'changed'; },
  value => { value.archive.records[0].correctedSourceDigest = '0'.repeat(64); },
]) {
  const changed = structuredClone(input);
  mutate(changed);
  assert.throws(() => resolve(changed), /Changed frozen assessment continuity/);
}
for (const mutate of [
  value => { value.value = 5.6; },
  value => { value.evidenceAudit.reuse = 'New approval'; },
  value => { value.sourceDigest = archive.records[0].correctedSourceDigest; },
]) {
  const changed = structuredClone(record);
  mutate(changed);
  assert.throws(() => verifyRetainedAssessment(changed, basis, receiptDigest), /Changed retained public assessment/);
}
const duplicated = structuredClone(archive);
duplicated.records.push(duplicated.records[0]);
assert.throws(() => validateContinuityArchive(duplicated, PUBLISHED_NODES), /Invalid continuity identity/);
const orphaned = structuredClone(archive);
orphaned.records[0].nodeId = 'future_unreviewed_node';
assert.throws(() => validateContinuityArchive(orphaned, PUBLISHED_NODES), /Invalid continuity identity/);
const withoutAllowance = resolve({ ...input, archive: { ...archive, records: [] } });
assert.notEqual(withoutAllowance.sourceDigest, row.candidate.sourceDigest);
console.log('Assessment continuity passed: exact archival reproduction; changed evidence, policy, candidate or output rejected; no replacement admission.');
