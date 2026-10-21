import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const artifact = JSON.parse(readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/gcrmn-reef-cover-area-audit.json', import.meta.url)));
const sourceBytes = readFileSync(new URL('../artifacts/tulip-calibration-2026-09-22/coral-bleaching-reference-snapshot.json', import.meta.url));
const snapshot = JSON.parse(sourceBytes);
const round = number => Number(number.toFixed(6));
assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), artifact.sourceSnapshotSha256);
assert.equal(artifact.status, 'exploratory_source_matched_condition_extent_not_node_harm');
assert.equal(artifact.sourceReportDoi, snapshot.sources.gcrmn2025.reportDoi);
assert.equal(artifact.sourceFiles.length, 10);
for (const file of artifact.sourceFiles) {
  const registered = Object.values(snapshot.sources.gcrmn2025.files)
    .find(candidate => candidate.rawName === file.name);
  assert(registered);
  assert.equal(file.sha256, registered.sha256);
}
assert.equal(artifact.subregions.length, 51);
const sourceRows = snapshot.endpoints.subregionConditionDistribution.subregions;
const paired = [];
const declining = [];
const reportedDeclining = [];
for (const row of artifact.subregions) {
  const source = sourceRows.find(candidate => candidate.sourceFile === row.sourceFile
    && candidate.name === row.name);
  assert(source);
  assert.equal(row.areaM2, source.areaM2);
  assert.equal(row.reportedRelativeChangePct, source.changePct);
  assert.equal(row.evidenceBars, source.evidenceBars);
  const complete = row.referenceCoverPct !== null && row.currentCoverPct !== null;
  if (!complete) {
    assert.equal(row.liveCoralCoverEquivalentDifferenceKm2, null);
    continue;
  }
  paired.push(row);
  assert(row.referenceCoverPct >= 0 && row.referenceCoverPct <= 100);
  assert(row.currentCoverPct >= 0 && row.currentCoverPct <= 100);
  assert.equal(row.liveCoralCoverEquivalentDifferenceKm2,
    round(row.areaM2 * (row.referenceCoverPct - row.currentCoverPct) / 100 / 1e6));
  if (row.referenceCoverPct > row.currentCoverPct) declining.push(row);
  if (row.reportedRelativeChangePct < 0 && row.evidenceBars >= 1) {
    assert(row.referenceCoverPct > row.currentCoverPct);
    reportedDeclining.push(row);
  }
}
const areaM2 = rows => rows.reduce((total, row) => total + row.areaM2, 0);
const coverKm2 = rows => rows.reduce((total, row) => total
  + row.areaM2 * (row.referenceCoverPct - row.currentCoverPct) / 100 / 1e6, 0);
const totalArea = areaM2(artifact.subregions);
assert.equal(totalArea, snapshot.endpoints.subregionConditionDistribution.mappedGlobalReefAreaM2);
assert.equal(paired.length, artifact.metrics.pairedSubregions);
assert.equal(round(areaM2(paired) / totalArea * 100), artifact.metrics.pairedSubregionAreaSharePct);
assert.equal(round(coverKm2(paired)), artifact.metrics.pairedSubregionCoverNetDifferenceKm2);
assert.equal(round(coverKm2(declining)), artifact.metrics.allSubregionModeledGrossDeclineKm2);
assert.equal(reportedDeclining.length, artifact.metrics.evidenceAdmittedDecliningSubregions);
assert.equal(round(areaM2(reportedDeclining) / totalArea * 100), artifact.metrics.evidenceAdmittedDecliningSubregionAreaSharePct);
assert.equal(round(coverKm2(reportedDeclining)), artifact.metrics.evidenceAdmittedGrossCoverEquivalentDeclineKm2);
assert.equal(artifact.metrics.unavailableReportedChangeAreaSharePct,
  snapshot.endpoints.subregionConditionDistribution.unavailableChangeShareOfMappedGlobalReefAreaPct);
assert(artifact.metrics.evidenceAdmittedGrossCoverEquivalentDeclineKm2
  < artifact.metrics.allSubregionModeledGrossDeclineKm2);
assert(artifact.metrics.pairedSubregionCoverNetDifferenceKm2
  < artifact.metrics.evidenceAdmittedGrossCoverEquivalentDeclineKm2);
assert(!('score' in artifact));
console.log(JSON.stringify({ status: 'passed', pairedSubregions: paired.length,
  evidenceAdmittedDeclines: reportedDeclining.length,
  coverEquivalentKm2: artifact.metrics.evidenceAdmittedGrossCoverEquivalentDeclineKm2,
  wholeNodeScoreAssigned: false }, null, 2));
