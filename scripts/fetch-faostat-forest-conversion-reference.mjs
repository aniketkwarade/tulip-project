import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './lib/contract-snapshot.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'faostat-forest-conversion-reference-snapshot.json');
const recordUrl = 'https://zenodo.org/records/17395880';
const fileUrl = 'https://zenodo.org/api/records/17395880/files/Emissions_Land_Use_Forests_E_All_Data.csv/content';
const expectedBytes = 1_458_442;
const expectedMd5 = '5545c8a346c19e44a83caadac2a1add7';
const expectedSha256 = '4167617c5104014f007d9311be8d0ee0976fcde677fd402a4b1a262358d5c349';
const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const digest = value => hash('sha256', JSON.stringify(value));

const response = await fetch(fileUrl, {
  signal: AbortSignal.timeout(120_000),
  headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+faostat-forest-conversion-ingestion)' },
});
assert(response.ok, `FAOSTAT forests file: HTTP ${response.status}`);
const buffer = Buffer.from(await response.arrayBuffer());
assert.equal(buffer.length, expectedBytes, 'FAOSTAT forests file size changed');
assert.equal(hash('md5', buffer), expectedMd5, 'FAOSTAT forests file MD5 changed');
assert.equal(hash('sha256', buffer), expectedSha256, 'FAOSTAT forests file SHA-256 changed');

const rows = parseCsv(buffer.toString('utf8').replace(/^\uFEFF/, ''));
assert.equal(rows.length, 2_008);
const selected = rows.filter(row => row.Area === 'World'
  && row.Item === 'Net Forest conversion'
  && row.Element === 'Net emissions/removals (CO2) (Forest land)'
  && row.Source === 'FAO TIER 1'
  && row.Unit === 'kt');
assert.equal(selected.length, 1, 'Expected one FAOSTAT world net-forest-conversion emissions row');
const sourceRow = selected[0];
const observations = Array.from({ length: 2025 - 1990 + 1 }, (_value, index) => {
  const year = 1990 + index;
  const valueKtCO2 = Number(sourceRow[`Y${year}`]);
  assert(Number.isFinite(valueKtCO2) && valueKtCO2 >= 0, `${year}: invalid net forest conversion value`);
  return {
    year,
    valueKtCO2,
    flag: sourceRow[`Y${year}F`] || null,
    note: sourceRow[`Y${year}N`] || null,
  };
});
assert(observations.every(row => row.flag === 'E'));
assert(Math.abs(observations[0].valueKtCO2 - 5_175_840.32) < 1e-6);
assert(Math.abs(observations.at(-1).valueKtCO2 - 2_814_055.545) < 1e-6);

const metric = {
  nodeId: 'deforestation_co2_release',
  name: 'Deforestation CO2 Release',
  substance: 'CO2',
  unit: 'kilotonnes CO2 per year',
  geography: 'FAOSTAT World aggregate',
  item: sourceRow.Item,
  element: sourceRow.Element,
  sourceMethod: sourceRow.Source,
  observations,
  cumulativeGtCO2: observations.reduce((sum, row) => sum + row.valueKtCO2, 0) / 1e6,
  boundary: 'FAOSTAT Tier 1 annual net emissions from forest conversion, limited to carbon-stock change in living biomass. It is a partial proxy for the TULIP deforestation node; forest-land removals, soil carbon, dead organic matter, harvested wood products, peat drainage and fire remain outside this series.',
};

const snapshot = {
  version: 'tulip_faostat_forest_conversion_reference_2026_09_23_v1',
  generatedOn: '2026-09-23',
  status: 'partial_net_forest_conversion_history_ingested',
  productionRatingsEnabled: 0,
  source: {
    id: 'faostat_emissions_from_forests_2025_10_20',
    title: 'FAOSTAT Emissions from Forests ver 20 Oct 2025',
    recordUrl,
    version: '20 Oct 2025',
    published: '2025-10-20',
    file: {
      name: 'Emissions_Land_Use_Forests_E_All_Data.csv',
      url: fileUrl,
      bytes: expectedBytes,
      md5: expectedMd5,
      sha256: expectedSha256,
    },
  },
  method: {
    selection: 'Select the source-native World, Net Forest conversion, Net emissions/removals (CO2) (Forest land), FAO TIER 1 row and preserve every annual value and flag from 1990 through 2025.',
    period: { start: 1990, end: 2025, years: observations.length },
    accountingRule: 'Use the net-forest-conversion living-biomass series as a declared partial source history. Do not add it to gross clearing, forest-fire, peat-drainage or broader land-use totals.',
    harmBoundary: 'This source history can support a partial physical CO2 screen. It does not measure current human or ecosystem harm.',
  },
  metric,
  limitations: [
    'Every annual value is source-flagged E (estimated); the file does not provide observation-level confidence intervals.',
    'The dataset description limits carbon-stock change to living biomass. Important land carbon pools and processes are outside this record.',
    'Net forest conversion is narrower than all deforestation-related carbon release and is not interchangeable with gross tree-cover loss or gross fire emissions.',
    'The 2023-2025 values are identical in this release and must not be interpreted as independently observed annual stability.',
  ],
  admissionDecision: {
    admittedUse: 'Partial annual source history and cumulative CO2 physical screening for Deforestation CO2 Release, with the source boundary carried through every downstream result.',
    prohibitedUse: 'Do not convert tonnes or warming directly into TULIP severity, reach, persistence, value or letter, and do not combine this series with overlapping land-use emissions.',
  },
};
snapshot.digest = digest({ source: snapshot.source, method: snapshot.method, metric, limitations: snapshot.limitations, admissionDecision: snapshot.admissionDecision });

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, annualRecords: observations.length, cumulativeGtCO2: metric.cumulativeGtCO2, digest: snapshot.digest }, null, 2));
