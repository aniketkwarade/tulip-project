import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const reference = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-bridge-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(reference.version, 'tulip_europe_temperature_mortality_bridge_reference_2026_09_25_v4');
assert.equal(reference.status, 'candidate_independent_human_endpoint_bridge_not_admitted');
assert.equal(reference.productionRatingsEnabled, 0);
assert.equal(reference.paper.reviewStatus, 'working_paper_not_peer_reviewed');
assert.equal(reference.repository.commit, 'b6d185ed7d596afca420ea2cebb32c878ca5a25d');
assert.equal(reference.counts.parquetFilesAudited, 6);
assert.equal(reference.counts.completeFileChecksums, 6);
assert.equal(reference.counts.fullPanelRows, 679_602);
assert.equal(reference.counts.dailyTemperatureRows, 12_660_307);
assert.equal(reference.counts.temperatureBinRows, 1_837_033);
assert.equal(reference.counts.weeklyMapPanelRows, 679_602);
assert.equal(reference.counts.annualTemperatureSummaryRows, 27_875);
assert.equal(reference.counts.temperatureLimitRows, 1_115);
assert.equal(reference.counts.affectedEmissionSourceNodes, 21);
assert.equal(reference.counts.scoresChanged, 0);
assert.equal(reference.counts.axesAdmitted, 0);
assert.deepEqual(reference.coverage.responsePanelYears, { start: 2000, end: 2023 });
assert.deepEqual(reference.coverage.dailyTemperatureYears, { start: 2000, end: 2022 });
assert.deepEqual(reference.coverage.mapPanelYears, { start: 2000, end: 2023 });
assert.deepEqual(reference.coverage.annualTemperatureSummaryYears, { start: 2000, end: 2024 });
assert.match(reference.coverage.boundary, /weekly response panel is unbalanced/i);
assert.equal(reference.affectedNodeIds.length, 21);
assert.equal(new Set(reference.affectedNodeIds).size, 21);

const columnNames = file => new Set(reference.parquet[file].columns.map(column => column.path));
for (const name of ['adm_id', 'year', 'week', 'n_deaths_all', 'pop_all']) assert(columnNames('fullPanel').has(name), name);
for (const name of ['adm_id', 'year', 'month', 'day', 'week', 'temp1']) assert(columnNames('dailyTemperature').has(name), name);
for (const name of ['adm_id', 'year', 'week', '-49.5', '49.5']) assert(columnNames('temperatureBins').has(name), name);
for (const name of ['adm_id', 'year', 'week', 'deaths', 'pop', 'rate', 'avg_temp', 'sd_temp']) assert(columnNames('weeklyMapPanel').has(name), name);
assert.equal(reference.fullDataChecksumAudit.status, 'complete_public_parquet_files_checksum_pinned');
assert.equal(reference.fullDataChecksumAudit.files, 6);
assert.equal(reference.fullDataChecksumAudit.totalBytes, 718_702_455);
assert.equal(reference.fullDataChecksumAudit.completeSha256Checksums, 6);
assert.equal(reference.coverageEnumeration.status, 'exact_public_region_and_year_coverage_enumerated');
assert.equal(reference.coverageEnumeration.responsePanelUniqueRegions, 971);
assert.equal(reference.coverageEnumeration.dailyTemperatureUniqueRegions, 1_507);
assert.equal(reference.coverageEnumeration.temperatureLimitUniqueRegions, 1_115);
assert.equal(reference.coverageEnumeration.responseRegionsWithEveryObservedYear, 107);
assert.deepEqual(reference.coverage.exactRegionCounts, {
  responsePanel: 971,
  dailyTemperature: 1_507,
  temperatureBins: 1_507,
  weeklyMapPanel: 971,
  annualTemperatureSummaries: 1_115,
  temperatureLimits: 1_115,
});
assert(Object.values(reference.parquet).every(file => file.fingerprintBoundary.includes('complete-file SHA-256')));
assert(Object.values(reference.parquet).every(file => /^[a-f0-9]{64}$/.test(file.completeFile.sha256)));
assert(reference.admissionDecision.prohibitedUses.some(item => /working-paper result/i.test(item)));
assert(reference.admissionDecision.prohibitedUses.some(item => /nature severity/i.test(item)));
assert.match(reference.admissionDecision.nextGate, /reproduce the working paper/i);
assert.match(reference.admissionDecision.nextGate, /separate ecosystem endpoint/i);
assert.equal(reference.admissionDecision.currentScoreEffect, 'none_all_21_source_candidates_retained');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  paper: reference.paper,
  repository: reference.repository,
  fullDataChecksumAudit: reference.fullDataChecksumAudit,
  coverageEnumeration: reference.coverageEnumeration,
  parquet: reference.parquet,
  counts: reference.counts,
  coverage: reference.coverage,
  finding: reference.finding,
  admissionDecision: reference.admissionDecision,
  affectedNodeIds: reference.affectedNodeIds,
})).digest('hex');
assert.equal(reference.digest, expectedDigest);

console.log(`European temperature-mortality bridge audit passed: ${reference.counts.parquetFilesAudited} public files expose a broader human-endpoint path, with zero axes or scores admitted.`);
