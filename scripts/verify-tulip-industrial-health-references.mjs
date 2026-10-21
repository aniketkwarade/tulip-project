import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import { mapFixedBenchmarkMagnitude } from '../src/tulip-fixed-benchmark-map.js';

const root = new URL('../', import.meta.url);
const directory = 'artifacts/tulip-calibration-completion-2026-09-28/';
const read = path => readFileSync(new URL(path, root));
const reference = JSON.parse(read(`${directory}industrial-health-references.json`));
const workbook = read(reference.workbookPath);
assert.equal(createHash('sha256').update(workbook).digest('hex'), reference.workbookSha256);
const policyBytes = read('src/tulip-consequence-policy-v1.json');
assert.equal(createHash('sha256').update(policyBytes).digest('hex'), reference.policySha256);
const policy = JSON.parse(policyBytes);
const archive = unzipSync(new Uint8Array(workbook));
const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const strings = [...strFromU8(archive['xl/sharedStrings.xml']).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)]
  .map(item => [...item[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(part => decode(part[1])).join(''));
const xml = strFromU8(archive['xl/worksheets/sheet25.xml']);
const rows = new Map();
for (const match of xml.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
  const cells = {};
  for (const cell of match[2].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const address = cell[1].match(/\br="([A-Z]+)\d+"/)?.[1];
    const value = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
    if (value === undefined) continue;
    assert(address);
    cells[address] = /\bt="s"/.test(cell[1]) ? strings[Number(value)] : Number(value);
  }
  rows.set(Number(match[1]), cells);
}
const header = rows.get(4);
for (const [column, name] of Object.entries({ I: 'PM2.5', J: 'SO2', K: 'NOX', L: 'NH3' })) {
  assert.equal(header[column], `HEALTH_IMPACTS_${name}_DALY_PER_YEAR`);
}
assert.equal(header.H, 'HEALTH_IMPACTS_CO2_DALY_PER_YEAR');
const byCategory = new Map(), seen = new Set();
for (let rowNumber = 5; rowNumber <= 30; rowNumber++) {
  const row = rows.get(rowNumber);
  assert(row && typeof row.A === 'string' && typeof row.B === 'string', `Missing source row ${rowNumber}`);
  const key = JSON.stringify([row.A, row.B]);
  assert(!seen.has(key), 'Duplicate source row'); seen.add(key);
  let sum = 0;
  for (const column of ['I', 'J', 'K', 'L']) {
    assert.equal(typeof row[column], 'number', `Missing DALY amount at ${column}${rowNumber}`);
    assert(Number.isFinite(row[column]) && row[column] >= 0);
    sum += row[column];
  }
  assert(Number.isFinite(row.H) && row.H >= 0);
  const entry = byCategory.get(row.A) ?? { quantity: 0, rows: [], byPollutant: { I: 0, J: 0, K: 0, L: 0 } };
  for (const column of ['I', 'J', 'K', 'L']) entry.byPollutant[column] += row[column];
  entry.quantity += sum; entry.rows.push(rowNumber); byCategory.set(row.A, entry);
}
assert.equal(seen.size, 26); assert.equal(byCategory.size, 6);
const comparisons = reference.references.map(item => {
  const rebuilt = byCategory.get(item.sourceCategory);
  assert(rebuilt); assert.deepEqual(rebuilt.rows, item.sourceRows);
  const amountDifference = Math.abs(rebuilt.quantity - Number(item.quantityExact));
  assert(amountDifference < 1e-8);
  for (const column of ['I', 'J', 'K', 'L']) {
    assert(Math.abs(rebuilt.byPollutant[column] - Number(item.byPollutantExact[header[column]])) < 1e-8);
  }
  const mapped = mapFixedBenchmarkMagnitude(rebuilt.quantity, policy.human.points);
  assert(Math.abs(mapped - Number(item.benchmarkDiagnosticExact)) < 1e-12);
  assert.equal(item.replacementValue, null); assert.equal(item.publicReady, false);
  return { sourceCategory: item.sourceCategory, dalys: rebuilt.quantity,
    quantityDifference: amountDifference, benchmarkDiagnostic: mapped, wholeNodeRating: null };
});
const report = {
  version: 'tulip_industrial_health_separate_reproduction_2026_09_28_v1',
  status: 'raw_source_arithmetic_reproduced_not_scientific_model_validation',
  sourceWorkbookSha256: reference.workbookSha256,
  inputReferenceSha256: createHash('sha256').update(read(`${directory}industrial-health-references.json`)).digest('hex'),
  summary: { sourceRows: 26, referenceCategories: 6, missingHealthCellsImputed: 0,
    completedReplacementRatings: 0, publicScoreChanges: 0 }, comparisons,
  limitations: reference.limitations,
};
writeFileSync(new URL(`${directory}industrial-health-reproduction.json`, root), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, ...report.summary }, null, 2));
