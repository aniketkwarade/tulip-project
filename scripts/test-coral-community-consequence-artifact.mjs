import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const report = JSON.parse(readFileSync(new URL('coral-community-consequence-reference-audit.json', root)));
const close = (a, b) => assert(Math.abs(a - b) < 1e-7, `${a} differs from ${b}`);
const pins = {
  covers: '8de693d861763b7e4edc8161ef344d4d9ad83634adf383ebb2e1e7e46b0aacb4',
  covariates: 'f8e530bae34b293d4b0a62f042504b314d55672c75fdbe9be370d3b73597a232',
  table2: 'b7a441e1c8caf878057ba02c7f47652ac37bd37dc7e71ec74182f7134521d34b',
};
for (const [kind, source] of Object.entries(report.sources)) {
  const data = readFileSync(new URL(`mellin-community-${kind}.${kind === 'table2' ? 'xlsx' : 'csv'}`, root));
  assert.equal(createHash('sha256').update(data).digest('hex'), source.sha256);
  assert.equal(createHash('md5').update(data).digest('hex'), source.md5);
  assert.equal(data.length, source.sizeBytes);
  assert.equal(source.sha256, pins[kind]);
}
// A separate CSV reader binds the derived values back to the pinned records,
// rather than checking only internally consistent arithmetic in the artifact.
function csvRows(file) {
  const text = readFileSync(new URL(file, root), 'utf8').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n')) {
      row.push(value.replace(/\r$/, '')); value = '';
      if (c === '\n') { rows.push(row); row = []; }
    } else value += c;
  }
  assert.equal(quoted, false);
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
  const fields = rows.shift();
  assert.equal(new Set(fields).size, fields.length);
  return rows.filter(r => r.some(v => v !== '')).map(r => {
    assert.equal(r.length, fields.length);
    return Object.fromEntries(fields.map((f, i) => [f, r[i]]));
  });
}
const covers = csvRows('mellin-community-covers.csv');
const covariates = csvRows('mellin-community-covariates.csv');
const key = r => `${r.site_code}:${r.pre_post}`;
const coverByKey = new Map(covers.map(r => [key(r), r]));
const covByKey = new Map(covariates.map(r => [key(r), r]));
assert.equal(coverByKey.size, 524);
assert.equal(covByKey.size, 524);
assert.deepEqual([...coverByKey.keys()].sort(), [...covByKey.keys()].sort());
assert.equal(report.status, 'historical_descriptive_reference_vectors');
assert.equal(report.cases.length, 262);
const ids = new Set();
let depthChanges = 0, totalDeclines = 0, totalIncreases = 0, cancellations = 0;
for (const c of report.cases) {
  assert(!ids.has(c.referenceId));
  ids.add(c.referenceId);
  assert.equal(c.categoryVector.length, 119);
  assert.equal(new Set(c.categoryVector.map(v => v.categoryId)).size, 119);
  let pre = 0, post = 0, decline = 0, increase = 0;
  for (const v of c.categoryVector) {
    assert.equal(v.preCoverPct, Number(coverByKey.get(`${c.siteCode}:Pre`)[v.categoryId]));
    assert.equal(v.postCoverPct, Number(coverByKey.get(`${c.siteCode}:Post`)[v.categoryId]));
    assert(v.preCoverPct >= 0 && v.preCoverPct <= 100);
    assert(v.postCoverPct >= 0 && v.postCoverPct <= 100);
    close(v.differencePp, v.postCoverPct - v.preCoverPct);
    pre += v.preCoverPct;
    post += v.postCoverPct;
    decline += Math.max(0, v.preCoverPct - v.postCoverPct);
    increase += Math.max(0, v.postCoverPct - v.preCoverPct);
  }
  close(pre, c.preTotalCoralCoverPct);
  close(post, c.postTotalCoralCoverPct);
  close(post - pre, c.netTotalCoverDifferencePp);
  close(decline, c.decliningCategoryCoverDifferenceSumPp);
  close(increase, c.increasingCategoryCoverDifferenceSumPp);
  close(c.netTotalCoverDifferencePp, increase - decline);
  assert(pre <= 100 && post <= 100);
  assert(c.preMeanSurveyYear < 2016 && c.postMeanSurveyYear >= 2016);
  const covPre = covByKey.get(`${c.siteCode}:Pre`);
  const covPost = covByKey.get(`${c.siteCode}:Post`);
  assert.equal(c.preMeanDepthM, Number(covPre.depth));
  assert.equal(c.postMeanDepthM, Number(covPost.depth));
  assert.equal(c.preMeanSurveyYear, Number(covPre.Year_Pre));
  assert.equal(c.postMeanSurveyYear, Number(covPost.Year_Post));
  assert.equal(c.latitude, Number(covPre.latitude));
  assert.equal(c.longitude, Number(covPre.longitude));
  assert.equal(c.cluster, Number(covPre.cluster));
  if (c.preMeanDepthM !== c.postMeanDepthM) depthChanges++;
  if (c.netTotalCoverDifferencePp < -1e-8) totalDeclines++;
  if (c.netTotalCoverDifferencePp > 1e-8) totalIncreases++;
  if (Math.abs(c.netTotalCoverDifferencePp) <= 1e-8 && decline > 1e-8) cancellations++;
  for (const field of ['score', 'ecologicalHarmSeverity', 'mappedDamagedAreaKm2', 'nodeAttributableFraction']) {
    assert.equal(c[field], null);
  }
}
assert.equal(depthChanges, 140);
assert.equal(totalDeclines, 146);
assert.equal(totalIncreases, 113);
assert.equal(cancellations, 3);
const cancellation = report.cases.find(c => c.siteCode === 'CS130');
close(cancellation.preTotalCoralCoverPct, 9);
close(cancellation.postTotalCoralCoverPct, 9);
close(cancellation.decliningCategoryCoverDifferenceSumPp, 5);
close(cancellation.increasingCategoryCoverDifferenceSumPp, 5);
const gain = report.cases.find(c => c.siteCode === 'NWS71');
close(gain.netTotalCoverDifferencePp, 0.85);
close(gain.decliningCategoryCoverDifferenceSumPp, 15.5);
assert.equal(gain.depthReview, 'same_reported_mean');
assert.equal(report.supplementAudit.numericRows, 570);
assert.equal(report.supplementAudit.allSiteMeanMatches, 0);
assert.equal(report.supplementAudit.unresolvedRows.length, 1);
assert.equal(report.supplementAudit.unresolvedRows[0].sourceRow, 428);
for (const row of report.supplementAudit.rows) {
  assert.equal(row.allSiteMeanMatch, false);
  assert.equal(row.supplementArithmeticMatches, true);
  assert(row.rawExportSiteCounts.every(n => Number.isInteger(n) && n > 0));
  for (const [i, state] of ['Pre', 'Post'].entries()) {
    const values = covers.filter(r => r.pre_post === state
      && Number(covByKey.get(key(r)).cluster) === row.cluster).map(r => Number(r[row.categoryId]));
    assert.equal(values.length, row.rawExportSiteCounts[i]);
    close(values.reduce((a, b) => a + b, 0) / values.length, row.rawExportAllSiteMeansPct[i]);
  }
}
console.log(JSON.stringify({ status: 'passed', pairedSites: ids.size, categoryObservations: ids.size * 119,
  sourceArtifactsVerified: 3, unchangedCoverWithCategoryChanges: cancellations,
  differentMeanDepthsPreserved: depthChanges, supplementRowsKeptSeparate: 570,
  completedWholeNodeAssessments: 0 }));
