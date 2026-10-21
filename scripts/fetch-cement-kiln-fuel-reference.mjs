import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'cement-kiln-fuel-reference-snapshot.json');
const cedsRecordUrl = 'https://zenodo.org/records/10904361';
const cedsArchiveUrl = `${cedsRecordUrl}/files/CEDS_v_2024_04_01_aggregate.zip?download=1`;
const cedsArchiveMd5 = '636752881e915244bb96b4793d9fb121';
const cedsArchiveSha256 = '913237080a65c9166a0270b9765bb1489701c125aebe0f512f0da2634098d04e';
const cedsMember = 'CEDS_v_2024_04_01_aggregate/CO2_CEDS_global_emissions_by_sector_fuel_v2024_04_01.csv';
const cedsMemberSha256 = '5568aba2a7a83d5d8a2a658cc0e2e9956470cd70caf3c3bb640493afcb9e1fac';
const cementRecordUrl = 'https://zenodo.org/records/4738593';
const cementApiUrl = 'https://zenodo.org/api/records/4738593';
const sector = '1A2f_Ind-Comb-Non-metalic-minerals';
const fossilFuels = ['brown_coal', 'coal_coke', 'diesel_oil', 'hard_coal', 'heavy_oil', 'light_oil', 'natural_gas'];
const cementFuelBenchmark2019KtCO2 = 900_000;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const cells = line => line.split(',').map(value => value.replace(/^"|"$/g, ''));
  const header = cells(lines[0]);
  return lines.slice(1).map(line => Object.fromEntries(cells(line).map((value, index) => [header[index], value])));
}

function plainText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const headers = { 'User-Agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+cement-kiln-ingestion)' };
const cementResponse = await fetch(cementApiUrl, {
  signal: AbortSignal.timeout(180_000),
  headers: { ...headers, Accept: 'application/json' },
});
assert(cementResponse.ok, `Cement benchmark metadata: HTTP ${cementResponse.status}`);
const cementMetadata = await cementResponse.json();

const archiveResponse = await fetch(cedsArchiveUrl, { signal: AbortSignal.timeout(300_000), headers });
assert(archiveResponse.ok, `CEDS archive: HTTP ${archiveResponse.status}`);

const archive = Buffer.from(await archiveResponse.arrayBuffer());
assert.equal(md5(archive), cedsArchiveMd5, 'CEDS archive MD5 changed');
assert.equal(sha256(archive), cedsArchiveSha256, 'CEDS archive SHA-256 changed');
const entries = unzipSync(new Uint8Array(archive));
assert(entries[cedsMember], `Missing ${cedsMember}`);
const memberBuffer = Buffer.from(entries[cedsMember]);
assert.equal(sha256(memberBuffer), cedsMemberSha256, 'CEDS member checksum changed');
const rows = parseCsv(strFromU8(entries[cedsMember]));

const description = plainText(cementMetadata.metadata.description);
assert.equal(cementMetadata.metadata.title, 'Global CO2 emissions from cement production');
assert.equal(cementMetadata.metadata.version, '210505');
assert.equal(cementMetadata.metadata.publication_date, '2021-05-05');
assert.match(description, /process emissions.*~1\.6 Gt CO\s*2 in 2019/i);
assert.match(description, /combustion of fossil fuels.*additional ~0\.9 Gt CO\s*2 in 2019/i);

const selected = rows.filter(row => row.sector === sector && fossilFuels.includes(row.fuel));
assert.equal(selected.length, fossilFuels.length);
assert.deepEqual(selected.map(row => row.fuel).sort(), fossilFuels);
const years = Array.from({ length: 2022 - 1750 + 1 }, (_value, index) => 1750 + index);
const sectorObservations = years.map(year => ({
  year,
  sectorValueKtCO2: selected.reduce((sum, row) => sum + Number(row[`X${year}`]), 0),
}));
assert(sectorObservations.every(row => Number.isFinite(row.sectorValueKtCO2) && row.sectorValueKtCO2 >= 0));
const sector2019KtCO2 = sectorObservations.find(row => row.year === 2019).sectorValueKtCO2;
assert(Math.abs(sector2019KtCO2 - 1_059_666.1084349295) < 1e-6);
const allocationFactor = cementFuelBenchmark2019KtCO2 / sector2019KtCO2;
const observations = sectorObservations.map(row => ({
  ...row,
  reconstructedCementKilnFuelKtCO2: row.sectorValueKtCO2 * allocationFactor,
}));
const cumulativeGtCO2 = observations.reduce((sum, row) => sum + row.reconstructedCementKilnFuelKtCO2, 0) / 1e6;
assert(Math.abs(allocationFactor - 0.8493241341173515) < 1e-12);
assert(Math.abs(observations.at(-1).reconstructedCementKilnFuelKtCO2 - 920_782.4748721486) < 1e-6);
assert(Math.abs(cumulativeGtCO2 - 34.20509820901176) < 1e-9);

const snapshot = {
  version: 'tulip_cement_kiln_fuel_reference_2026_09_23_v1',
  generatedOn: '2026-09-23',
  status: 'reconstructed_cement_kiln_fuel_history_sensitivity_only',
  productionRatingsEnabled: 0,
  nodeId: 'cement_kiln_fuel_co2',
  sources: {
    ceds: {
      id: 'ceds_v2024_04_01_release_emission_data',
      title: 'CEDS v_2024_04_01 Release Emission Data',
      recordUrl: cedsRecordUrl,
      version: 'v_2024_04_01',
      published: '2024-04-01',
      archive: { url: cedsArchiveUrl, bytes: archive.length, md5: cedsArchiveMd5, sha256: cedsArchiveSha256 },
      member: { path: cedsMember, bytes: memberBuffer.length, sha256: cedsMemberSha256 },
    },
    cementBenchmark: {
      id: 'andrew_global_cement_co2_210505',
      title: cementMetadata.metadata.title,
      recordUrl: cementRecordUrl,
      apiUrl: cementApiUrl,
      version: cementMetadata.metadata.version,
      published: cementMetadata.metadata.publication_date,
      metadataDigest: sha256(JSON.stringify(cementMetadata.metadata)),
      admittedFinding: 'The source reports approximately 1.6 Gt CO2 of cement process emissions and an additional approximately 0.9 Gt CO2 from fossil-fuel combustion for cement heat in 2019.',
    },
  },
  method: {
    selection: `Sum the seven declared fossil-fuel rows in CEDS sector ${sector} for each year, excluding biomass.`,
    reconstruction: 'Scale every annual CEDS non-metallic-minerals combustion value by the ratio of the approximately 0.9 Gt cement-fuel benchmark to the matching 2019 CEDS sector total.',
    allocationFactor,
    benchmark: {
      year: 2019,
      cementFuelKtCO2: cementFuelBenchmark2019KtCO2,
      cedsNonMetallicMineralsKtCO2: sector2019KtCO2,
    },
    period: { start: 1750, end: 2022, years: years.length },
    harmBoundary: 'This is a reconstructed source mass-flow history and physical-attribution sensitivity input, not a direct cement-only observation or a measurement of human or ecosystem harm.',
  },
  metric: {
    substance: 'CO2',
    unit: 'kilotonnes CO2 per year',
    geography: 'global',
    cedsSector: sector,
    fuels: fossilFuels,
    selectedRows: selected.length,
    observations,
    cumulativeGtCO2,
  },
  limitations: [
    'The CEDS sector includes glass, ceramics, lime and other non-metallic minerals in addition to cement; it is not a cement-only series.',
    'The reconstruction assumes cement retained its 2019 share of non-metallic-minerals fuel combustion throughout 1750–2022. That time-invariant share is a modelling assumption that must be replaced or validated with GCCA/GNR or equivalent data.',
    'The approximately 0.9 Gt CO2 cement-combustion benchmark is rounded and has no uncertainty interval in the cited metadata.',
    'CEDS does not provide annual observation-level uncertainty for this aggregate.',
    'Cement process emissions are excluded and remain represented by the separate cement_process_emissions node.',
  ],
  admissionDecision: {
    admittedUse: 'Partial cumulative CO2 physical screening and explicitly labelled sensitivity analysis for cement_kiln_fuel_co2.',
    prohibitedUse: 'Do not describe the reconstruction as an observed cement-only history, use it to set a terminal-harm axis, or change a TULIP value, grade or confidence.',
  },
};
snapshot.digest = digest({
  sources: snapshot.sources,
  method: snapshot.method,
  metric: snapshot.metric,
  limitations: snapshot.limitations,
  admissionDecision: snapshot.admissionDecision,
});

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  annualRecords: observations.length,
  allocationFactor,
  cumulativeGtCO2,
  digest: snapshot.digest,
}, null, 2));
