import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const directory = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const read = name => readFileSync(new URL(name, directory));
const profile = JSON.parse(read('soga-edition-outcome-profile.json'));
for (const source of profile.inputs) assert.equal(createHash('sha256').update(read(`soga-2025-source/${source.file}`)).digest('hex'), source.sha256);
const raw = read('soga-2025-source/no2-global-dalys.csv').toString('utf8');
const lines = raw.split(/\r?\n/).filter(line => /^\d+,/.test(line));
const decode = line => [...line.matchAll(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g)]
  .map(match => match[1] === undefined ? match[2] : match[1].replaceAll('""', '"'))
  .map(value => value.startsWith('="') && value.endsWith('"') ? value.slice(2, -1) : value);
const chart = new Map(JSON.parse(read('soga-2025-source/no2-global-dalys-chart.json'))[0].data);
assert.equal(lines.length, 34);
for (const line of lines) {
  const fields = decode(line);
  assert.equal(fields.length, 22);
  assert.equal(fields[12], 'All Ages');
  assert.equal(fields[10], 'Nitrogen dioxide pollution');
  const row = profile.no2ReportedScope.capturedAnnualSeries.find(row => row.rowId === fields[0]);
  assert(row);
  assert.equal(row.year, Number(fields[6]));
  assert.equal(row.central, Number(fields[13]));
  assert.equal(row.lower, Number(fields[16]));
  assert.equal(row.upper, Number(fields[15]));
  assert.equal(row.central, chart.get(row.year));
}
assert.deepEqual(profile.no2ReportedScope.capturedAllAgesRow, { year: 2023, rowId: '678572', lower: -250000, central: 232600, upper: 956000 });
assert.equal(profile.no2ReportedScope.ageScopesInterchangeable, false);
assert.equal(profile.no2ReportedScope.approvedHarmConversion, null);
assert.equal(profile.no2ReportedScope.score, null);
assert.equal(profile.countryCauseBarAudit.globalRiskOutcomeSpecification, false);
assert.equal(profile.genericWebMethodologyAudit.currentEditionOutcomeSpecification, false);
assert.equal(profile.mortalityDisplayOutcomeClasses.length, 8);
assert.equal(new Set(profile.mortalityDisplayOutcomeClasses.map(row => row.id)).size, 8);
assert.equal(profile.publishedModelIdentity.footerConflictResolved, false);
assert.equal(profile.wholeNodeAdmitted, false);
assert.equal(profile.publicReady, false);
console.log('SoGA scope passed: 34 source rows independently reproduced; negative limits, age boundaries and missing country-chart scope preserved; no score admitted.');
