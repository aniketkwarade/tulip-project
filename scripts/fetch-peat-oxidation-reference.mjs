import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parseCsv } from './lib/contract-snapshot.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'peat-oxidation-reference-snapshot.json');
const checkedOn = '2026-09-24';
const execFileAsync = promisify(execFile);
const zipUrl = 'https://bulks-faostat.fao.org/production/Emissions_Drained_Organic_Soils_E_All_Data_(Normalized).zip';
const csvName = 'Emissions_Drained_Organic_Soils_E_All_Data_(Normalized).csv';
const expectedZip = {
  bytes: 585_655,
  sha256: 'd2f65fac574a4b58a422d41b4de4559b616fd9dd9c49cbaa448fab4b34aab003',
};
const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const digest = value => hash('sha256', JSON.stringify(value));

const response = await fetch(zipUrl, {
  signal: AbortSignal.timeout(120_000),
  headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+peat-oxidation-evidence-ingestion)' },
});
assert(response.ok, `FAOSTAT drained-organic-soils archive: HTTP ${response.status}`);
const zip = Buffer.from(await response.arrayBuffer());
assert.equal(zip.length, expectedZip.bytes, 'FAOSTAT drained-organic-soils archive size changed');
assert.equal(hash('sha256', zip), expectedZip.sha256, 'FAOSTAT drained-organic-soils archive checksum changed');

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'tulip-peat-oxidation-'));
const temporaryZip = path.join(temporaryDirectory, 'faostat-drained-organic-soils.zip');
await writeFile(temporaryZip, zip);
const { stdout: csv } = await execFileAsync('unzip', ['-p', temporaryZip, csvName], {
  encoding: 'utf8',
  maxBuffer: 20_000_000,
  timeout: 60_000,
});
const rows = parseCsv(csv.replace(/^\uFEFF/, ''));
assert.equal(rows.length, 87_484, 'FAOSTAT normalized row count changed');

const worldRows = rows.filter(row => row.Area === 'World'
  && row.Item === 'Drained organic soils'
  && row.Source === 'FAO TIER 1'
  && ['Area', 'Emissions (CO2)'].includes(row.Element));
assert.equal(worldRows.length, 70, 'Expected two complete 1990–2024 World series');

const seriesFor = element => worldRows
  .filter(row => row.Element === element)
  .map(row => ({
    year: Number(row.Year),
    value: Number(row.Value),
    unit: row.Unit,
    flag: row.Flag,
    sourceMethod: row.Source,
  }))
  .sort((left, right) => left.year - right.year);
const area = seriesFor('Area');
const emissions = seriesFor('Emissions (CO2)');
assert.equal(area.length, 35);
assert.equal(emissions.length, 35);
assert.deepEqual(area.map(row => row.year), emissions.map(row => row.year));
assert(area.every(row => row.unit === 'ha'));
assert(emissions.every(row => row.unit === 'kt'));

const latestArea = area.filter(row => row.flag !== 'I').at(-1);
const latestEmissions = emissions.filter(row => row.flag !== 'I').at(-1);
assert.equal(latestArea.year, 2022);
assert.equal(latestEmissions.year, 2022);
assert.equal(latestArea.value, 24_593_322.008);
assert.equal(latestEmissions.value, 830_200.724);
assert(area.filter(row => row.flag !== 'I').length === 33);
assert(emissions.filter(row => row.flag !== 'I').length === 33);
assert(area.slice(-2).every(row => row.flag === 'I'));
assert(emissions.slice(-2).every(row => row.flag === 'I'));

const firstEmissions = emissions[0];
const intensityTonnesCo2PerHa = latestEmissions.value * 1_000 / latestArea.value;
const increaseSince1990Kt = latestEmissions.value - firstEmissions.value;
assert(Math.abs(firstEmissions.value - 750_897.1094) < 1e-6);
assert(Math.abs(intensityTonnesCo2PerHa - 33.757161) < 1e-6);

const peatlandReference = JSON.parse(await readFile(path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'peatland-degradation-reference-snapshot.json'), 'utf8'));
const unep = peatlandReference.sources.find(source => source.id === 'unep_global_peatlands_assessment_2022');
const restoration = peatlandReference.sources.find(source => source.id === 'elo_boreal_peatland_restoration_2024');
assert(unep && restoration);
assert.equal(unep.facts.drainedOrDegradedCurrentPeatlandsPct, 12);
assert.equal(restoration.facts.sites, 151);
assert.equal(restoration.facts.globalRepresentativeness, false);

const snapshot = {
  version: 'tulip_peat_oxidation_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_physical_flux_and_bounded_ecosystem_function_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Measure the current agricultural drained-organic-soil carbon flux while keeping physical emissions, peatland reach, recovery and downstream human or climate harms separate.',
  sources: {
    faostat: {
      id: 'faostat_drained_organic_soils_2025_10_28',
      publisher: 'Food and Agriculture Organization of the United Nations',
      title: 'FAOSTAT Emissions from Drained Organic Soils',
      publicationDate: '2025-10-28',
      datasetUrl: 'https://data.fao.org/catalog/dataset/drained-organic-soils',
      methodologyUrl: 'https://files-faostat.fao.org/production/GV/GV_e.pdf',
      file: { url: zipUrl, name: csvName, ...expectedZip },
      checkedOn,
    },
    unep: {
      id: unep.id,
      publisher: unep.publisher,
      title: unep.title,
      publicationDate: unep.publicationDate,
      url: unep.url,
      checkedOn,
    },
    restoration: {
      id: restoration.id,
      publisher: restoration.publisher,
      title: restoration.title,
      publicationDate: restoration.publicationDate,
      doi: restoration.doi,
      repositoryFileChecksum: restoration.repositoryFileChecksum,
      checkedOn,
    },
  },
  currentWindow: {
    start: 2022,
    end: 2022,
    coverageStatus: 'complete',
    summaryMethod: 'annualized_flow',
    coverageNote: 'The October 2025 release contains 1990–2024 estimates, but the 2023 and 2024 World values are source-flagged I (imputed). TULIP therefore uses 2022 as the latest non-imputed annual state.',
  },
  endpoints: {
    agriculturalDrainedOrganicSoils: {
      geography: 'FAOSTAT World aggregate',
      boundary: 'Cropland and grassland organic soils under agricultural drainage; fires, non-agricultural drainage and all intact peatlands are outside this series.',
      record: { start: 1990, end: 2024, sourceYears: 35, nonImputedYears: 33 },
      latestNonImputed: {
        year: 2022,
        areaHa: latestArea.value,
        co2KtPerYear: latestEmissions.value,
        co2TonnesPerHaPerYear: Number(intensityTonnesCo2PerHa.toFixed(6)),
        flag: latestEmissions.flag,
      },
      history: {
        co2KtPerYear1990: firstEmissions.value,
        co2KtIncrease1990To2022: Number(increaseSince1990Kt.toFixed(6)),
        interpretation: 'The series establishes continuing carbon loss from an agricultural drained-peat subset. Tonnes, trend and intensity are physical fluxes and do not directly set harm severity, reach or persistence.',
      },
    },
    broaderPeatlandContext: {
      drainedOrDegradedCurrentPeatlandsPct: unep.facts.drainedOrDegradedCurrentPeatlandsPct,
      interpretation: 'UNEP’s 12% share covers broader drained or degraded peatlands. It is an upper context for the oxidation footprint, not proof that all affected peat has the same oxidation rate or condition loss.',
    },
    recoveryContext: {
      sites: restoration.facts.sites,
      ecosystemTypes: restoration.facts.ecosystemTypes,
      geography: restoration.facts.geography,
      observationsAfterRestorationYears: restoration.facts.observationsAfterRestorationYears,
      finding: restoration.facts.finding,
      interpretation: 'The experiment supports multi-year persistence and incomplete recovery after ten years in boreal Finland. It does not provide a universal global recovery duration.',
    },
    compatibleDirectHumanConsequence: null,
  },
  tulipUse: {
    admitted: [
      'Use FAOSTAT to establish the current agricultural drained-organic-soil area, carbon-dioxide flow and source uncertainty.',
      'Use the loss of peat carbon-storage function as the direct ecosystem endpoint for this node.',
      'Use UNEP only to bound the broader affected peatland footprint, and the controlled restoration study to bound recovery time.',
    ],
    prohibited: [
      'Do not convert tonnes of carbon dioxide, tonnes per hectare, record length or the 1990–2022 increase into TULIP severity, reach or persistence.',
      'Do not treat imputed 2023 or 2024 values as new observations or evidence of stability.',
      'Do not score Carbon Emissions, warming, water stress, smoke, wildfire or other downstream consequences again in this node.',
      'Do not use the 12% broad drained-or-degraded peatland share as if every affected hectare were agricultural drained soil or had equal oxidation damage.',
      'Do not assign direct human harm without a compatible measured human consequence attributable to peat oxidation itself.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'peat_oxidation_pulse',
      rating: 'C 6.3',
      uncertainty: 'C 4.8 to D 7.8',
      confidence: 'C',
      domains: ['ecosystem'],
      axes: {
        ecosystem: {
          lower: { severity: 1, reach: 2, persistence: 2 },
          central: { severity: 2, reach: 2, persistence: 3 },
          upper: { severity: 3, reach: 2, persistence: 4 },
        },
      },
      reason: 'The source record proves a large, continuing loss of peat carbon-storage function and the restoration evidence supports multi-year persistence. The central C remains, but unsupported direct human harm is removed and the B–E range is narrowed to C–D.',
    },
  },
  unresolvedForTulip: [
    'Measure condition loss within oxidizing peat independently of carbon-dioxide flow.',
    'Map agricultural and non-agricultural oxidizing peat against a compatible global peatland denominator.',
    'Estimate recovery of carbon-storage function across tropical, temperate, boreal and permafrost peatlands after rewetting.',
    'Keep peat-degradation condition, peat-fire emissions and downstream climate harm from being counted twice across connected nodes.',
  ],
};
snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, recommendation: snapshot.tulipUse.currentCatalogueRecommendation, digest: snapshot.snapshotDigest }, null, 2));
