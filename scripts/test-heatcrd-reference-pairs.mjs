import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const audit = read('heatcrd-calibration-input-quality-audit.json');
const metadata = read('heatcrd-v1-published-metadata.json');
const bytes = readFileSync(new URL(audit.pairArtifact.filename, root));
assert.equal(createHash('sha256').update(bytes).digest('hex'), audit.pairArtifact.sha256);
const pool = JSON.parse(bytes);
assert.equal(metadata.id, 25488724);
assert.equal(metadata.version, 1);
assert.equal(metadata.files[0].computed_md5, pool.source.publishedMd5);
assert.equal(metadata.files[0].size, pool.source.sizeBytes);
assert.deepEqual(pool.summary, audit.summary);
assert.equal(pool.summary.historicalMatchedPairs, 2078);
assert.equal(pool.summary.pairedSites, 719);
assert.equal(pool.summary.baseForeignKeyViolationCount, 51548);
assert.equal(audit.rawRelationalJoinAdmission, 'rejected');
assert.equal(audit.checks.baseSampleQueryFieldMismatches.rows[0].count, 24086);
assert.deepEqual(Object.keys(audit.ambiguousSampleIds), ['42146', '42208', '42215']);
assert.equal(pool.summary.duplicateSampleAffectedRows, 6);
for (const field of ['queryCoverOrphans', 'querySampleFieldMismatches', 'querySiteFieldMismatches']) {
  assert.equal(audit.checks[field].rows[0].count, 0);
}
const ids = new Set();
const forbiddenSamples = new Set(Object.keys(audit.ambiguousSampleIds).map(Number));
let declines = 0, gains = 0, unchanged = 0, undefinedRelative = 0;
const near = (actual, expected) => assert(Math.abs(actual - expected) < 1e-10);
for (const pair of pool.cases) {
  assert(!ids.has(pair.caseId));
  ids.add(pair.caseId);
  assert(!forbiddenSamples.has(pair.before.sampleId) && !forbiddenSamples.has(pair.after.sampleId));
  assert(pair.after.year > pair.before.year);
  assert.equal(pair.before.month, pair.after.month);
  assert(pair.depthMeters >= 0 && Number.isFinite(pair.depthMeters));
  const first = pair.before.coverPercent, last = pair.after.coverPercent;
  assert(first >= 0 && first <= 100 && last >= 0 && last <= 100);
  const change = last - first;
  near(pair.signedCoverChangePercentagePoints, change);
  near(pair.positiveObservedCoverLossPercentagePoints, Math.max(0, -change));
  if (first === 0) {
    assert.equal(pair.signedRelativeCoverChangePercent, null);
    assert.equal(pair.positiveObservedRelativeCoverLossPercent, null);
    undefinedRelative++;
  } else {
    near(pair.signedRelativeCoverChangePercent, change / first * 100);
    near(pair.positiveObservedRelativeCoverLossPercent, Math.max(0, -change / first * 100));
  }
  if (change < 0) declines++;
  else if (change > 0) gains++;
  else unchanged++;
}
assert.equal(pool.cases.length, pool.summary.historicalMatchedPairs);
assert.equal(declines, pool.summary.declinePairs);
assert.equal(gains, pool.summary.gainPairs);
assert.equal(unchanged, pool.summary.unchangedPairs);
assert.equal(undefinedRelative, pool.summary.undefinedRelativeChangePairs);
const maldives = pool.cases.find(pair => pair.before.sampleId === 143 && pair.after.sampleId === 144);
assert.equal(maldives.originalSourceCitation, 'Montefalcone et al. 2020');
near(maldives.positiveObservedCoverLossPercentagePoints, 71);
near(maldives.positiveObservedRelativeCoverLossPercent, 71 / 83.3 * 100);
assert.equal(pool.score, null);
assert.equal(pool.nodeAttributableFraction, null);
assert.equal(pool.attributableDamagedAreaKm2, null);
assert.equal(pool.currentNodeAssessmentsCompleted, 0);
assert.equal(pool.publicReady, false);
console.log(JSON.stringify({ status: 'passed', historicalPairsChecked: ids.size,
  rawTableJoinsRejected: true, ambiguousSampleIdsExcluded: 3,
  absoluteAndRelativeArithmeticReproduced: true, scoreAssigned: false }, null, 2));
