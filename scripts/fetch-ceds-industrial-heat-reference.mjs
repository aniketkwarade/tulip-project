import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'ceds-industrial-heat-reference-snapshot.json');
const recordUrl = 'https://zenodo.org/records/10904361';
const archiveUrl = `${recordUrl}/files/CEDS_v_2024_04_01_aggregate.zip?download=1`;
const archiveMd5 = '636752881e915244bb96b4793d9fb121';
const archiveSha256 = '913237080a65c9166a0270b9765bb1489701c125aebe0f512f0da2634098d04e';
const member = 'CEDS_v_2024_04_01_aggregate/CO2_CEDS_global_emissions_by_sector_fuel_v2024_04_01.csv';
const memberSha256 = '5568aba2a7a83d5d8a2a658cc0e2e9956470cd70caf3c3bb640493afcb9e1fac';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const cells = line => line.split(',').map(value => value.replace(/^"|"$/g, ''));
  const header = cells(lines[0]);
  return lines.slice(1).map(line => Object.fromEntries(cells(line).map((value, index) => [header[index], value])));
}

const response = await fetch(archiveUrl, {
  signal: AbortSignal.timeout(180_000),
  headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+ceds-industrial-heat-ingestion)' },
});
assert(response.ok, `CEDS archive: HTTP ${response.status}`);
const archive = Buffer.from(await response.arrayBuffer());
assert.equal(md5(archive), archiveMd5, 'CEDS archive MD5 changed');
assert.equal(sha256(archive), archiveSha256, 'CEDS archive SHA-256 changed');
const entries = unzipSync(new Uint8Array(archive));
assert(entries[member], `Missing ${member}`);
const memberBuffer = Buffer.from(entries[member]);
assert.equal(sha256(memberBuffer), memberSha256, 'CEDS member checksum changed');
const rows = parseCsv(strFromU8(entries[member]));
assert.equal(rows.length, 250);
const years = Array.from({ length: 2022 - 1750 + 1 }, (_value, index) => 1750 + index);
const industrialSectors = [...new Set(rows.filter(row => row.sector.startsWith('1A2')).map(row => row.sector))].sort();
assert.equal(industrialSectors.length, 13);

const definitions = {
  coal_industrial_heat_co2: {
    name: 'Coal Industrial-Heat CO2 Output',
    fuels: ['brown_coal', 'coal_coke', 'hard_coal'],
    boundary: 'Global CEDS stationary industrial-combustion sectors beginning 1A2, using brown coal, hard coal or coal coke. Electricity, heat production, transformation, buildings, transport, fugitive emissions, biomass and industrial process emissions are excluded.',
  },
  gas_industrial_heat_co2: {
    name: 'Gas Industrial-Heat CO2 Output',
    fuels: ['natural_gas'],
    boundary: 'Global CEDS stationary industrial-combustion sectors beginning 1A2, using natural gas. Electricity, heat production, transformation, buildings, transport, fugitive emissions, biomass and industrial process emissions are excluded.',
  },
};

const metrics = {};
for (const [nodeId, definition] of Object.entries(definitions)) {
  const selected = rows.filter(row => industrialSectors.includes(row.sector) && definition.fuels.includes(row.fuel));
  const observations = years.map(year => ({
    year,
    valueKtCO2: selected.reduce((sum, row) => sum + Number(row[`X${year}`]), 0),
  }));
  assert(observations.every(row => Number.isFinite(row.valueKtCO2) && row.valueKtCO2 >= 0));
  metrics[nodeId] = {
    name: definition.name,
    substance: 'CO2',
    unit: 'kilotonnes CO2 per year',
    geography: 'CEDS source-native global aggregate',
    sectors: industrialSectors,
    fuels: definition.fuels,
    selectedRows: selected.length,
    boundary: definition.boundary,
    observations,
    cumulativeGtCO2: observations.reduce((sum, row) => sum + row.valueKtCO2, 0) / 1e6,
  };
}
assert.equal(metrics.coal_industrial_heat_co2.selectedRows, 39);
assert.equal(metrics.gas_industrial_heat_co2.selectedRows, 13);
assert(Math.abs(metrics.coal_industrial_heat_co2.observations.at(-1).valueKtCO2 - 2_305_519.64724353) < 1e-6);
assert(Math.abs(metrics.gas_industrial_heat_co2.observations.at(-1).valueKtCO2 - 1_811_883.3133229723) < 1e-6);

const snapshot = {
  version: 'tulip_ceds_industrial_heat_reference_2026_09_23_v1',
  generatedOn: '2026-09-23',
  status: 'two_non_overlapping_industrial_fuel_histories_ingested',
  productionRatingsEnabled: 0,
  source: {
    id: 'ceds_v2024_04_01_release_emission_data',
    title: 'CEDS v_2024_04_01 Release Emission Data',
    recordUrl,
    version: 'v_2024_04_01',
    published: '2024-04-01',
    archive: { url: archiveUrl, bytes: archive.length, md5: archiveMd5, sha256: archiveSha256 },
    member: { path: member, bytes: memberBuffer.length, sha256: memberSha256 },
  },
  method: {
    selection: 'Sum the source-native global CO2 rows for every stationary industrial-combustion sector beginning 1A2, separately by declared fossil-fuel set and year.',
    period: { start: 1750, end: 2022, years: years.length },
    overlapRule: 'Coal and natural-gas fuel sets are disjoint. Process emissions, electricity, public heat, transport, buildings, fugitive emissions and biomass are excluded.',
    harmBoundary: 'These are source mass-flow histories and physical-attribution inputs, not measurements of human or ecosystem harm.',
  },
  metrics,
  limitations: [
    'CEDS estimates depend on activity data, fuel assignments, emission factors, sector mapping and inventory revisions; the archive does not provide annual observation-level uncertainty for these aggregates.',
    'Industrial-combustion sectors cover iron and steel, non-ferrous metals, chemicals, pulp and paper, food and tobacco, non-metallic minerals, construction, machinery, mining, textiles, transport equipment, wood products and other industry.',
    'A fuel-specific industrial history cannot be added to overlapping aggregate industrial or fuel nodes in one total.',
    'The record ends in 2022 and must be refreshed when a compatible CEDS release becomes available.',
  ],
  admissionDecision: {
    admittedUse: 'Annual source history and cumulative CO2 physical screening for the two matching TULIP industrial-heat nodes.',
    prohibitedUse: 'Do not convert tonnes, inventory share or warming directly into TULIP severity, reach, persistence, value or letter.',
  },
};
snapshot.digest = digest({ source: snapshot.source, method: snapshot.method, metrics, limitations: snapshot.limitations, admissionDecision: snapshot.admissionDecision });

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, nodes: Object.keys(metrics).length, annualRecords: Object.values(metrics).reduce((sum, metric) => sum + metric.observations.length, 0), digest: snapshot.digest }, null, 2));
