import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'reservoir-storage-instability-reference-snapshot.json');
const checkedOn = '2026-09-24';
const execFileAsync = promisify(execFile);
const hash = value => createHash('sha256').update(value).digest('hex');
const digest = value => hash(JSON.stringify(value));

const files = {
  supplementaryMethods: {
    url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41893-026-01859-y/MediaObjects/41893_2026_1859_MOESM1_ESM.pdf',
    bytes: 4_860_617,
    sha256: '0054d6797474992b716f57c6ae044d5afb4b8b0f66c5a430c3d2950495d271e6',
  },
  mainSourceData: {
    url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41893-026-01859-y/MediaObjects/41893_2026_1859_MOESM3_ESM.xlsx',
    bytes: 718_618,
    sha256: 'b16b11cb73671be554bcc0fb0686e8e079ad63cd8f005eb400e98bb18e661aab',
  },
  extendedSourceData: {
    url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41893-026-01859-y/MediaObjects/41893_2026_1859_MOESM4_ESM.xlsx',
    bytes: 164_494,
    sha256: '905482971c5bfaf5ed9c803d0c4946d0e355834344665124cfb202ca06389c6a',
  },
};

async function fetchPinned(source, label) {
  const response = await fetch(source.url, {
    signal: AbortSignal.timeout(120_000),
    headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+reservoir-storage-evidence-ingestion)' },
  });
  assert(response.ok, `${label}: HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(body.length, source.bytes, `${label}: byte size changed`);
  assert.equal(hash(body), source.sha256, `${label}: checksum changed`);
  return body;
}

const [supplementaryMethods, mainSourceData, extendedSourceData] = await Promise.all([
  fetchPinned(files.supplementaryMethods, 'supplementary methods'),
  fetchPinned(files.mainSourceData, 'main source data'),
  fetchPinned(files.extendedSourceData, 'extended source data'),
]);
assert(supplementaryMethods.length > 0 && extendedSourceData.length > 0);

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'tulip-reservoir-storage-'));
const workbookPath = path.join(temporaryDirectory, 'source-data.xlsx');
await writeFile(workbookPath, mainSourceData);
const [{ stdout: stringsXml }, { stdout: figure4Xml }] = await Promise.all([
  execFileAsync('unzip', ['-p', workbookPath, 'xl/sharedStrings.xml'], { encoding: 'utf8', maxBuffer: 10_000_000 }),
  execFileAsync('unzip', ['-p', workbookPath, 'xl/worksheets/sheet4.xml'], { encoding: 'utf8', maxBuffer: 20_000_000 }),
]);

const decodeXml = value => value
  .replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"').replaceAll('&apos;', "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const sharedStrings = [...stringsXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match =>
  decodeXml([...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(text => text[1]).join('')),
);
const rows = [...figure4Xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(rowMatch => {
  const row = {};
  for (const cell of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const column = cell[1].match(/\br="([A-Z]+)\d+"/)?.[1];
    const value = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
    if (!column || value === undefined) continue;
    row[column] = /\bt="s"/.test(cell[1]) ? sharedStrings[Number(value)] : Number(value);
  }
  return row;
});
assert.equal(rows[0].AO, 'Area_Class');
assert.equal(rows[0].AP, 'Reservoir number');
const areaClassRows = rows.slice(1).filter(row => typeof row.AO === 'string' && Number.isFinite(row.AP));
assert.deepEqual(areaClassRows.map(row => row.AO), ['<0.1', '0.1-1', '1-10', '10-100', '>100']);
const reservoirCount = areaClassRows.reduce((sum, row) => sum + row.AP, 0);
const underOneSquareKilometreCount = areaClassRows
  .filter(row => ['<0.1', '0.1-1'].includes(row.AO))
  .reduce((sum, row) => sum + row.AP, 0);
const weightedRatio = column => areaClassRows.reduce((sum, row) => sum + row.AP * row[column], 0) / reservoirCount;
assert.equal(reservoirCount, 555_960);
assert.equal(underOneSquareKilometreCount, 530_301);

const snapshot = {
  version: 'tulip_reservoir_storage_instability_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_storage_function_and_exposure_semantics_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Measure loss and instability of reservoir storage function while keeping physical capacity, exposed water users, realized human harm, ecosystem condition and future projections separate.',
  sources: {
    sedimentation2026: {
      id: 'liu_global_reservoir_sedimentation_2026',
      publisher: 'Nature Sustainability',
      title: 'Global patterns of reservoir sedimentation and overlooked risks in small reservoirs',
      publicationDate: '2026-06-05',
      doi: 'https://doi.org/10.1038/s41893-026-01859-y',
      files,
      checkedOn,
    },
    storageReturns2023: {
      id: 'nature_diminishing_reservoir_storage_returns_2023',
      publisher: 'Nature Communications',
      title: 'Diminishing storage returns of reservoir construction',
      publicationDate: '2023-06-13',
      doi: 'https://doi.org/10.1038/s41467-023-38843-5',
      checkedOn,
    },
  },
  currentWindow: {
    start: 2026,
    end: 2026,
    coverageStatus: 'partial',
    summaryMethod: 'end_state_stock',
    coverageNote: 'The 2026 global model estimates present sedimentation and storage-function risk from heterogeneous reservoir surveys and physical predictors. Publication year is retained because the source defines a modelled current condition; it is not presented as a same-year census of service failures.',
  },
  endpoints: {
    globalSedimentationModel: {
      reservoirs: reservoirCount,
      reservoirsUnderOneSquareKilometre: underOneSquareKilometreCount,
      reservoirsUnderOneSquareKilometrePercent: Number((100 * underOneSquareKilometreCount / reservoirCount).toFixed(2)),
      globalAverageStorageLossPerDecadePercent: 7.3,
      globalAverageStorageLossPerDecadeUncertaintyPlusMinusPercentagePoints: 2.8,
      reservoirsCurrentlyHighRisk: 'nearly one in five',
      globalHotspots: 16,
      interpretation: 'These are modeled physical storage-function and infrastructure-risk results. Reservoir share is not a harmed-person or ecosystem-distribution denominator.',
    },
    exposureContext: {
      waterSupplyExposurePeopleLowerBound: 2_000_000_000,
      irrigatedLandExposurePercentApproximate: 26,
      compatibleCurrentHarmedPersonCount: null,
      compatibleCurrentEcosystemConditionLossPercent: null,
      interpretation: 'The article describes water supplies as threatened and irrigated land as impacted. These are exposure and system-dependence contexts, not counts of people already harmed or a percentage of ecosystem collapse.',
    },
    futureModelChecks: {
      workbookReservoirs: reservoirCount,
      defaultModelNonFunctionalRatio2040: Number(weightedRatio('AU').toFixed(6)),
      defaultModelNonFunctionalRatio2060: Number(weightedRatio('AV').toFixed(6)),
      articleProjection2060: 'More than half of all reservoirs could become functionally inoperable without intervention.',
      interpretation: 'The 2040 and 2060 workbook results test the source files and remain future projections. They do not enter the current TULIP grade or substitute for the 2027-2036 SSP2-4.5 outlook.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the modeled current storage-loss rate and high-risk reservoir share as direct evidence of reservoir storage-function deterioration.',
      'Use the global inventory and source-data workbooks to establish broad geographic and infrastructure coverage.',
      'Use the long-lived sediment accumulation mechanism to support persistence of lost storage function.',
      'Use the 1999-2018 satellite storage study as independent evidence that normalized storage varies by region and reservoir function.',
    ],
    prohibited: [
      'Do not treat more than two billion people with threatened water supplies as two billion people currently harmed.',
      'Do not use the 26% irrigated-land exposure as ecosystem reach or ecosystem condition loss.',
      'Do not use reservoir count, region count, storage volume or map coverage as human or ecosystem reach.',
      'Do not use 2040, 2060 or later projections to score current harm.',
      'Do not assign all sedimentation, storage variability or resulting consequences to climate change; operations, demand, land use and sediment management also matter.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'reservoir_storage_instability',
      rating: 'C 4.8',
      uncertainty: 'B 3.6 to D 7.4',
      confidence: 'C',
      domains: ['human', 'ecosystem'],
      axes: {
        human: {
          lower: { severity: 1, reach: 1, persistence: 2 },
          central: { severity: 1, reach: 1, persistence: 3 },
          upper: { severity: 2, reach: 3, persistence: 4 },
        },
        ecosystem: {
          lower: { severity: 1, reach: 1, persistence: 1 },
          central: { severity: 1, reach: 1, persistence: 3 },
          upper: { severity: 2, reach: 2, persistence: 4 },
        },
      },
      reason: 'The new evidence directly establishes persistent global storage-function loss but does not measure current people harmed or ecosystem condition loss. The previous two-billion-person reach level is therefore removed while uncertainty stays wide.',
    },
  },
  unresolvedForTulip: [
    'Link reservoir-specific storage loss to observed interruptions in drinking water, irrigation, flood protection or electricity, with unique affected people and duration.',
    'Measure aquatic and downstream ecosystem condition against a compatible reference and distribution denominator.',
    'Separate sedimentation, climate-driven inflow change, operations and demand in an attributable current-harm model.',
    'Produce a compatible 2027-2036 SSP2-4.5 outlook rather than importing longer 2040-2100 projections.',
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
console.log(`Wrote ${output}`);
console.log(JSON.stringify(snapshot.tulipUse.currentCatalogueRecommendation, null, 2));
