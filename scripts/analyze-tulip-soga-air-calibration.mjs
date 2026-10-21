import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mapFixedBenchmarkMagnitude, roundBenchmarkDisplay } from '../src/tulip-fixed-benchmark-map.js';

const root = new URL('../', import.meta.url);
const directory = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const bytes = readFileSync(new URL('soga-air-health-source-candidate.json', directory));
const source = JSON.parse(bytes);
const raw = readFileSync(new URL('soga-2025-source/joint-air-global-dalys.csv', directory));
assert.equal(createHash('sha256').update(raw).digest('hex'), source.sourceArtifactSha256);

// Independently extract the selected physical CSV line. Quoted CSV literals
// are decoded as strings, never evaluated as spreadsheet formulas.
const line = raw.toString('utf8').split(/\r?\n/).filter(value => value.startsWith('1129018,'));
assert.equal(line.length, 1);
const fields = [...line[0].matchAll(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g)]
  .map(match => (match[1] === undefined ? match[2] : match[1].replaceAll('""', '"')))
  .map(value => value.startsWith('="') && value.endsWith('"') ? value.slice(2, -1) : value);
assert.equal(fields.length, 22);
for (const [index, expected] of [[1, 'global'], [2, 'Global'], [6, '2023'], [7, 'daly'],
  [8, 'number'], [9, 'Both'], [10, 'Air pollution'], [11, 'All causes'], [12, 'All Ages'], [17, 'airpoll']]) {
  assert.equal(fields[index], expected);
}
const reconstructed = { lower: Number(fields[16]), central: Number(fields[13]), upper: Number(fields[15]) };
assert.deepEqual(reconstructed, source.modeledDalys);
assert.match(source.provenance.exportFooterCitation, /Global Burden of Disease Study 2021/);
assert.equal(source.provenance.siteClaimedModel, 'Global Burden of Disease Study 2023');
assert.equal(source.provenance.modelVersionResolution, 'unresolved_publisher_metadata_conflict');
assert.equal(source.publicReady, false);
assert.equal(source.wholeNodeAdmitted, false);
assert.equal(source.annualSeries.length, 14);
assert.equal(source.annualSeries.at(-1).central, reconstructed.central);

const calibration = JSON.parse(readFileSync(new URL('docs/tulip-calibration/human-health-anchor-candidate.json', root)));
const mapped = Object.fromEntries(Object.entries(reconstructed)
  .map(([label, quantity]) => [label, mapFixedBenchmarkMagnitude(quantity, calibration.points, 1)]));
assert(mapped.lower <= mapped.central && mapped.central <= mapped.upper);
const publicData = JSON.parse(readFileSync(new URL('public/tulip-assessments.json', root)));
const report = {
  version: 'tulip_soga_air_calibration_diagnostic_2026_09_27_v1',
  nodeId: source.nodeId,
  sourceCandidateVersion: source.version,
  sourceCandidateSha256: createHash('sha256').update(bytes).digest('hex'),
  calibrationVersion: calibration.version,
  inputDalys: reconstructed,
  interpretation: 'Provisional mapping diagnostic only; does not resolve source identity, outcome coverage or anchor calibration',
  unroundedHealthReadings: mapped,
  diagnosticDisplay: roundBenchmarkDisplay(mapped.central),
  diagnosticDisplayRange: {
    lower: Math.floor(mapped.lower * 10) / 10,
    upper: Math.ceil(mapped.upper * 10) / 10,
  },
  historicalHandling: 'Use the 2023 row once. The 2010–2023 annual series is context, not an accumulated current burden or an uncertainty interval.',
  comparisonWithWHO: 'WHO 2021 and SoGA 2023 are alternative model/year/scope candidates. Do not combine their values or use their differences as source uncertainty.',
  publicValueUnchanged: publicData.records[source.nodeId].value,
  publicValue: null,
  publicReady: false,
  wholeNodeAdmitted: false,
  admissionReasons: source.remainingAdmissionGaps,
  validation: {
    selectedCSVRowIndependentlyExtractedInJavaScript: true,
    all14CSVMeansMatchOfficialChart: true,
    sourceBoundsRetained: true,
    publisherVersionConflictRetained: true,
    scientificIndependentReviewCompleted: false,
  },
};
writeFileSync(new URL('soga-air-calibration-diagnostic.json', directory), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: 'source_extraction_checked', inputDalys: reconstructed,
  experimentalDisplay: report.diagnosticDisplay, publicValueUnchanged: report.publicValueUnchanged,
  publisherVersionConflictRetained: true, wholeNodeAdmitted: false }, null, 2));
