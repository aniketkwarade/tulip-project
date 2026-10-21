import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// An exploratory same-source extent × condition calculation. This is not a
// climate-attributed node assessment, an ecosystem-function metric or a score.
const snapshotPath = new URL('../artifacts/tulip-calibration-2026-09-22/coral-bleaching-reference-snapshot.json', import.meta.url);
const outputPath = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/gcrmn-reef-cover-area-audit.json', import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const round = (value, places = 6) => Number(value.toFixed(places));
const sourceBytes = await readFile(snapshotPath);
const snapshot = JSON.parse(sourceBytes);
const files = snapshot.sources.gcrmn2025.files;
const subregions = snapshot.endpoints.subregionConditionDistribution.subregions;
const reportFiles = [
  'gcrmnAustraliaDetails', 'gcrmnBrazilDetails', 'gcrmnCaribbeanDetails',
  'gcrmnEastAsianSeasDetails', 'gcrmnEasternTropicalPacificDetails',
  'gcrmnPacificDetails', 'gcrmnRopmeDetails', 'gcrmnRedSeaGulfAdenDetails',
  'gcrmnSouthAsiaDetails', 'gcrmnWesternIndianOceanDetails',
];
const clean = value => value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
const tableAfter = (html, marker) => {
  const markerIndex = html.indexOf(marker);
  assert(markerIndex >= 0, `Missing table marker: ${marker}`);
  const start = html.indexOf('<table', markerIndex);
  const end = html.indexOf('</table>', start);
  assert(start >= 0 && end > start);
  return html.slice(start, end + '</table>'.length);
};
const cellsOf = row => [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
  .map(match => match[1]);

async function readReport(key) {
  const file = files[key];
  assert(file?.url && file?.sha256 && Number.isInteger(file.bytes));
  const response = await fetch(file.url, {
    signal: AbortSignal.timeout(120_000),
    headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+source-bound-reef-condition-audit)' },
  });
  assert(response.ok, `${key}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.length, file.bytes, `${key}: size changed`);
  assert.equal(sha256(bytes), file.sha256, `${key}: checksum changed`);
  const table = tableAfter(bytes.toString('utf8'), 'Change in Hard coral cover (%) for each Subregion');
  const parsed = [];
  for (const match of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = cellsOf(match[1]);
    if (cells.length !== 5) continue;
    const name = clean(cells[0]);
    const sourceRow = subregions.find(row => row.name === name && row.sourceFile === file.rawName);
    if (!sourceRow) continue; // Header or regional aggregate.
    const cover = clean(cells[2]).match(/^(NA|\d+(?:\.\d+)?)%\s+(NA|\d+(?:\.\d+)?)%/);
    assert(cover, `${file.rawName}: period-cover fields missing for ${name}`);
    const referenceCoverPct = cover[1] === 'NA' ? null : Number(cover[1]);
    const currentCoverPct = cover[2] === 'NA' ? null : Number(cover[2]);
    assert(referenceCoverPct === null || referenceCoverPct >= 0 && referenceCoverPct <= 100);
    assert(currentCoverPct === null || currentCoverPct >= 0 && currentCoverPct <= 100);
    const paired = referenceCoverPct !== null && currentCoverPct !== null;
    const reportedDecline = sourceRow.changePct < 0 && sourceRow.evidenceBars >= 1;
    if (reportedDecline) assert(paired && referenceCoverPct > currentCoverPct,
      `${file.rawName}: reported decline conflicts with paired cover for ${name}`);
    parsed.push({
      region: sourceRow.region, subregion: sourceRow.subregion, name,
      sourceFile: file.rawName, areaM2: sourceRow.areaM2,
      referenceCoverPct, currentCoverPct,
      reportedRelativeChangePct: sourceRow.changePct,
      evidenceBars: sourceRow.evidenceBars,
      pairedCoverDifferencePctPoints: paired ? round(referenceCoverPct - currentCoverPct, 1) : null,
      liveCoralCoverEquivalentDifferenceKm2: paired ? round(
        sourceRow.areaM2 * (referenceCoverPct - currentCoverPct) / 100 / 1e6) : null,
    });
  }
  assert(parsed.length > 0, `${key}: no matched subregions`);
  return parsed;
}

// Limit concurrent large downloads. Pinned hashes, not arrival order, define
// the source version; report order is stable in the output artifact.
const batches = [];
for (let index = 0; index < reportFiles.length; index += 3) {
  batches.push(...await Promise.all(reportFiles.slice(index, index + 3).map(readReport)));
}
const rows = batches.flat();
assert.equal(rows.length, 51);
assert.equal(new Set(rows.map(row => `${row.sourceFile}:${row.name}`)).size, 51);
const totalAreaM2 = rows.reduce((sum, row) => sum + row.areaM2, 0);
assert.equal(totalAreaM2, snapshot.endpoints.subregionConditionDistribution.mappedGlobalReefAreaM2);
const pairedRows = rows.filter(row => row.referenceCoverPct !== null && row.currentCoverPct !== null);
const km2 = rows => rows.reduce((sum, row) => sum + row.areaM2
  * (row.referenceCoverPct - row.currentCoverPct) / 100 / 1e6, 0);
const allModeledDeclines = pairedRows.filter(row => row.referenceCoverPct > row.currentCoverPct);
const reportedDeclines = rows.filter(row => row.reportedRelativeChangePct < 0 && row.evidenceBars >= 1);
assert.equal(reportedDeclines.length, snapshot.endpoints.subregionConditionDistribution.decliningSubregionCount);
const reportedAreaM2 = reportedDeclines.reduce((sum, row) => sum + row.areaM2, 0);
assert(Math.abs(reportedAreaM2 / totalAreaM2 * 100
  - snapshot.endpoints.subregionConditionDistribution.decliningSubregionsShareOfMappedGlobalReefAreaPct) < 1e-5);
const global = snapshot.endpoints.globalHardCoralCondition;
const result = {
  version: 'tulip_gcrmn_cover_area_audit_2026_09_27_v1',
  status: 'exploratory_source_matched_condition_extent_not_node_harm',
  sourceSnapshotVersion: snapshot.version,
  sourceSnapshotSha256: sha256(sourceBytes),
  sourceReportDoi: snapshot.sources.gcrmn2025.reportDoi,
  sourceRepositoryCommit: snapshot.sources.gcrmn2025.repositoryCommit,
  sourceFiles: reportFiles.map(key => ({ name: files[key].rawName, sha256: files[key].sha256 })),
  referencePeriod: global.referencePeriod,
  currentPeriod: global.currentPeriod,
  mappedReefAreaKm2: round(totalAreaM2 / 1e6),
  metrics: {
    pairedSubregions: pairedRows.length,
    pairedSubregionAreaSharePct: round(pairedRows.reduce((sum, row) => sum + row.areaM2, 0) / totalAreaM2 * 100),
    pairedSubregionCoverNetDifferenceKm2: round(km2(pairedRows)),
    allSubregionModeledGrossDeclineKm2: round(km2(allModeledDeclines)),
    evidenceAdmittedDecliningSubregions: reportedDeclines.length,
    evidenceAdmittedDecliningSubregionAreaSharePct: round(reportedAreaM2 / totalAreaM2 * 100),
    evidenceAdmittedGrossCoverEquivalentDeclineKm2: round(km2(reportedDeclines)),
    globalMeanCoverDifferenceTimesMappedAreaKm2: round(totalAreaM2
      * (global.referencePeriod.meanModelledCoverPct - global.currentPeriod.meanModelledCoverPct) / 100 / 1e6),
    unavailableReportedChangeAreaSharePct: snapshot.endpoints.subregionConditionDistribution.unavailableChangeShareOfMappedGlobalReefAreaPct,
  },
  boundary: [
    'Square kilometres here are reef-area times a change in modeled live hard-coral percentage cover. They are cover-equivalent surface differences, not square kilometres of destroyed reef.',
    'The evidence-admitted sum is coverage-limited and based on report-rounded period cover, not a statistical lower confidence bound. The all-subregion modeled sum includes areas for which the report did not support a change classification.',
    'The subregion net and global-mean calculations need not agree exactly: regional posterior summaries and the global hierarchical estimate are not interchangeable raw observations.',
    'No result isolates climate or bleaching attribution, recovery time, other ecosystem functions or human harm. None is a TULIP nature component or score.',
  ],
  subregions: rows,
};
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ status: result.status, metrics: result.metrics }, null, 2));
