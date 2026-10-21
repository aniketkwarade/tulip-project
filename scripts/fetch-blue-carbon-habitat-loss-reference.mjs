import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'blue-carbon-habitat-loss-reference-snapshot.json');
const rawDir = process.env.TULIP_BLUE_CARBON_RAW_DIR;
const checkedOn = '2026-09-24';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => sha256(Buffer.from(JSON.stringify(value)));
const round = (value, places = 6) => Number(value.toFixed(places));

const files = {
  seagrassExtentWorkbook: {
    rawName: 'seagrass-source-fig1.xlsx',
    url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-026-10704-3/MediaObjects/41586_2026_10704_MOESM4_ESM.xlsx',
    bytes: 71_204,
    sha256: '9a4ee1202dee3eff79f201eb7825a9f80b1909156cfdb67409a6a868e509749c',
  },
  seagrassCountryWorkbook: {
    rawName: 'seagrass-source-fig3.xlsx',
    url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-026-10704-3/MediaObjects/41586_2026_10704_MOESM5_ESM.xlsx',
    bytes: 17_019,
    sha256: 'b9419d691d00aac7322212bf00b4b95435d02aa9500e08acd3b5ee16ae25f50e',
  },
  seagrassMapMetadata: {
    rawName: 'zenodo-18612240.json',
    url: 'https://zenodo.org/api/records/18612240',
    bytes: 5_091,
    sha256: '43d82969a9472c865bf5373030f9e7c922a56324c5d2e298a7d686568ff53986',
  },
  saltMarshCollectionMetadata: {
    rawName: 'saltmarsh-cmr.json',
    url: 'https://cmr.earthdata.nasa.gov/search/collections.umm_json?doi=10.3334%2FORNLDAAC%2F2122',
    validation: 'semantic_identity_and_collection_fields',
  },
  saltMarshUserGuide: {
    rawName: 'Global_Salt_Marsh_Change.pdf',
    url: 'https://data.ornldaac.earthdata.nasa.gov/public/cms/Global_Salt_Marsh_Change/comp/Global_Salt_Marsh_Change.pdf',
    bytes: 298_943,
    sha256: '57b68b79208a1344b271232a9d0d2e93bc00a986b73cdcace19a5d7d9bdab97e',
  },
  saltMarshArticleSupplement: {
    rawName: 'saltmarsh-supp.pdf',
    url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-022-05355-z/MediaObjects/41586_2022_5355_MOESM1_ESM.pdf',
    bytes: 1_018_654,
    sha256: 'c0a45f5aad26912aa89408cb1ba74dc51a09afedef326796e202f9f77d78b4e8',
  },
};

async function loadPinned(file, label) {
  let body;
  if (rawDir) body = await readFile(path.join(rawDir, file.rawName));
  else {
    const response = await fetch(file.url, {
      signal: AbortSignal.timeout(120_000),
      headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+blue-carbon-habitat-evidence-ingestion)' },
    });
    assert(response.ok, `${label}: HTTP ${response.status}`);
    body = Buffer.from(await response.arrayBuffer());
  }
  if (Number.isInteger(file.bytes)) assert.equal(body.length, file.bytes, `${label}: byte size changed`);
  if (file.sha256) assert.equal(sha256(body), file.sha256, `${label}: checksum changed`);
  return body;
}

function decodeXml(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"').replaceAll('&apos;', "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function columnIndex(reference) {
  const letters = reference.match(/[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function xlsxRows(bytes, sheetNumber = 1) {
  const archive = unzipSync(new Uint8Array(bytes));
  const decoder = new TextDecoder();
  const sharedXml = archive['xl/sharedStrings.xml'] ? decoder.decode(archive['xl/sharedStrings.xml']) : '';
  const sharedStrings = [...sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(match => (
    [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(part => decodeXml(part[1])).join('')
  ));
  const sheet = decoder.decode(archive[`xl/worksheets/sheet${sheetNumber}.xml`]);
  return [...sheet.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)].map(rowMatch => {
    const row = [];
    for (const cell of rowMatch[1].matchAll(/<c\s([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cell[1];
      const reference = attributes.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1];
      const raw = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (raw == null) continue;
      row[columnIndex(reference)] = type === 's' ? sharedStrings[Number(raw)] : type === 'str' ? decodeXml(raw) : Number(raw);
    }
    return row;
  });
}

const [
  mangrove,
  seagrassExtentWorkbook,
  seagrassCountryWorkbook,
  seagrassMapMetadataBytes,
  saltMarshCollectionMetadataBytes,
  saltMarshUserGuide,
  saltMarshArticleSupplement,
] = await Promise.all([
  readFile(path.join(root, 'artifacts/tulip-calibration-2026-09-22/gmw-mangrove-extent-reference-snapshot.json'), 'utf8').then(JSON.parse),
  loadPinned(files.seagrassExtentWorkbook, 'seagrass extent source workbook'),
  loadPinned(files.seagrassCountryWorkbook, 'seagrass country source workbook'),
  loadPinned(files.seagrassMapMetadata, 'seagrass map metadata'),
  loadPinned(files.saltMarshCollectionMetadata, 'salt-marsh collection metadata'),
  loadPinned(files.saltMarshUserGuide, 'salt-marsh user guide'),
  loadPinned(files.saltMarshArticleSupplement, 'salt-marsh article supplement'),
]);
assert.equal(mangrove.productionRatingsEnabled, 0);
assert.equal(saltMarshUserGuide.subarray(0, 5).toString(), '%PDF-');
assert.equal(saltMarshArticleSupplement.subarray(0, 5).toString(), '%PDF-');

const seagrassGridRows = xlsxRows(seagrassExtentWorkbook);
assert.deepEqual(seagrassGridRows[0].slice(0, 3), ['seagrass_area_km2', 'grid_center_latitude_deg', 'grid_center_longitude_deg']);
const seagrassGridData = seagrassGridRows.slice(1).filter(row => Number.isFinite(row[0]));
const seagrassGridExtentKm2 = seagrassGridData.reduce((sum, row) => sum + row[0], 0);

const seagrassCountryRows = xlsxRows(seagrassCountryWorkbook);
assert.deepEqual(seagrassCountryRows[0].slice(0, 4), ['SOVEREIGN', 'Seagrass gross area loss (km²)', 'Seagrass area (km²)', 'Seagrass organic carbon stock (Tg C)']);
const seagrassCountryData = seagrassCountryRows.slice(1).filter(row => typeof row[0] === 'string' && Number.isFinite(row[2]));
const seagrassCountryExtentKm2 = seagrassCountryData.reduce((sum, row) => sum + row[2], 0);
const ambiguousCountryLossKm2 = seagrassCountryData.reduce((sum, row) => sum + (Number.isFinite(row[1]) ? row[1] : 0), 0);

const seagrassMetadata = JSON.parse(seagrassMapMetadataBytes);
assert.equal(seagrassMetadata.id, 18_612_240);
assert.equal(seagrassMetadata.doi, '10.5281/zenodo.18612240');
const seagrassMaps = Object.fromEntries(seagrassMetadata.files.map(file => [file.key, {
  bytes: file.size,
  md5: file.checksum.replace(/^md5:/, ''),
  url: file.links.self,
} ]));

const saltMarshMetadata = JSON.parse(saltMarshCollectionMetadataBytes);
assert.equal(saltMarshMetadata.hits, 1);
const saltMarshCollection = saltMarshMetadata.items[0];
assert.equal(saltMarshCollection.meta['concept-id'], 'C2575421513-ORNL_CLOUD');
assert.equal(saltMarshCollection.umm.DOI.DOI, '10.3334/ORNLDAAC/2122');

const currentMangrove = mangrove.currentWindow;
const snapshot = {
  version: 'tulip_blue_carbon_habitat_loss_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_habitat_change_ingested_for_internal_adjudication',
  productionRatingsEnabled: 0,
  purpose: 'Constrain the current Blue Carbon Habitat Loss rating with denominator-compatible mangrove and seagrass change while retaining the older global salt-marsh record as cross-habitat context. Habitat loss, degradation, carbon flux and human services remain separate quantities.',
  sources: {
    mangrove2026: {
      id: mangrove.source.id,
      title: mangrove.source.title,
      publisher: mangrove.source.publisher,
      publicationDate: mangrove.source.publicationDate,
      doi: mangrove.source.doi,
      sourceSnapshotVersion: mangrove.version,
      sourceSnapshotDigest: mangrove.snapshotDigest,
    },
    seagrass2026: {
      id: 'li_global_seagrass_maps_2026',
      title: 'Global high-resolution mapping of seagrass to support conservation',
      publisher: 'Nature',
      publicationDate: '2026-06-24',
      doi: 'https://doi.org/10.1038/s41586-026-10704-3',
      dataDoi: 'https://doi.org/10.5281/zenodo.18612240',
      mapPeriods: [{ start: 2019, end: 2020 }, { start: 2023, end: 2024 }],
      spatialResolutionMetres: 10,
      satelliteImages: 4_750_000,
      files: {
        extentSourceData: files.seagrassExtentWorkbook,
        countrySourceData: files.seagrassCountryWorkbook,
        mapMetadata: files.seagrassMapMetadata,
        mapArchives: seagrassMaps,
      },
      mapArchiveDownloadNote: 'The two checksum-declared map archives total about 887 MB and were not downloaded for this adjudication. The article source-data workbooks and Zenodo metadata were checksum verified locally.',
    },
    saltMarsh2022: {
      id: 'campbell_global_salt_marsh_change_2022',
      title: 'Global hotspots of salt marsh change and carbon emissions',
      publisher: 'Nature; NASA ORNL DAAC',
      publicationDate: '2022-11-30',
      articleDoi: 'https://doi.org/10.1038/s41586-022-05355-z',
      dataDoi: 'https://doi.org/10.3334/ORNLDAAC/2122',
      conceptId: saltMarshCollection.meta['concept-id'],
      dataPeriod: { start: 2000, end: 2019 },
      spatialResolutionMetres: 30,
      collectionSizeGb: saltMarshCollection.umm.ArchiveAndDistributionInformation.FileDistributionInformation[0].TotalCollectionFileSize,
      access: 'Protected Earthdata raster collection; public metadata, guide and article supplement checksum verified locally.',
      files: {
        collectionMetadata: files.saltMarshCollectionMetadata,
        userGuide: files.saltMarshUserGuide,
        articleSupplement: files.saltMarshArticleSupplement,
        protectedRasterChecksumsDeclaredByDataset: {
          'sm_loss.tif': '9f5809f2ba09029d840affd66cb3fc6a9d56999234d7faf164deb06ab15082fa',
          'sm_gain.tif': '22776193d2efacf1f6f2bd60de9156ae401895913dcd603f0d6dc7b312c0a18e',
        },
      },
    },
  },
  currentWindow: {
    start: 2016,
    end: 2025,
    coverageStatus: 'mixed_source_native_windows',
    summaryMethod: 'habitat_specific_state_change',
    coverageNote: 'Mangroves use 2016–2025. Seagrass compares 2019–2020 with 2023–2024. Salt marshes use 2000–2019 and therefore provide older cross-habitat context rather than a current denominator. The habitat percentages are not summed.',
    isLatestAvailable: true,
    recencyCheckedOn: checkedOn,
    recencyRationale: 'The 2026 mangrove and seagrass products are the newest compatible global mapped-change products located. The latest compatible global salt-marsh change product remains the 2000–2019 record.',
    normalization: 'For each habitat, divide mapped loss by that habitat product’s own baseline extent. Keep loss, gain, degradation and net change separate. Do not pool habitat areas or percentages without a shared sampling frame.',
  },
  endpoints: {
    mangrove: {
      period: { start: currentMangrove.start, end: currentMangrove.end },
      baselineExtentHa: currentMangrove.baselineExtentHa,
      endingExtentHa: currentMangrove.endingExtentHa,
      grossLossHa: currentMangrove.grossLossHa,
      grossLossPctOfBaseline: currentMangrove.grossLossPctOfBaseline,
      grossGainHa: currentMangrove.grossGainHa,
      grossGainPctOfBaseline: currentMangrove.grossGainPctOfBaseline,
      netChangePctOfBaseline: currentMangrove.netChangePctOfBaseline,
      globalF1: mangrove.accuracy.globalF1,
    },
    seagrass: {
      periodsCompared: [{ start: 2019, end: 2020 }, { start: 2023, end: 2024 }],
      publishedMappedExtentKm2: 148_506,
      reproducedGridExtentKm2: round(seagrassGridExtentKm2, 6),
      gridCellsWithSeagrass: seagrassGridData.length,
      countryRows: seagrassCountryData.length,
      reproducedCountryExtentKm2: round(seagrassCountryExtentKm2, 6),
      publishedLossKm2: 5_969,
      publishedLossPct: 4,
      publishedDenseToSparseDegradationKm2: 6_221,
      publishedDenseToSparseDegradationPct: 4.2,
      ambiguousCountryWorkbookLossTotalKm2: round(ambiguousCountryLossKm2, 6),
      ambiguousCountryWorkbookLossDisposition: 'Excluded from TULIP because the workbook total does not reconcile to the article’s explicitly reported 5,969 km² four-year loss. It cannot narrow an axis until its semantics are resolved.',
    },
    saltMarsh: {
      period: { start: 2000, end: 2019 },
      publishedNetLossKm2BeforeUncertaintyCorrection: 1_452.84,
      publishedNetLossKm2AfterUncertaintyCorrection: 719,
      publishedAnnualNetLossRatePct: 0.28,
      publishedAnnualEmissionsFromNetLossTgCo2e: { central: 16.3, lower90: 0.4, upper90: 33.2 },
      publishedReducedCarbonBurialTgCo2ePerYear: { central: 0.045, lower90: -0.14, upper90: 0.115 },
      currentUse: 'Historical cross-habitat context only because the change record ends in 2019.',
    },
    compatibleCurrentHarmedPersonCount: null,
    compatibleSharedBlueCarbonEcosystemDistributionLossPercent: null,
    compatibleRecoveryTimeDistribution: null,
  },
  tulipUse: {
    nodeId: 'blue_carbon_habitat_loss',
    admitted: [
      'Use mapped conversion from mangrove or seagrass to non-habitat as direct evidence that the affected habitat patch lost its defining state.',
      'Use each source-native loss share to constrain ecosystem reach. Recent mangrove gross loss is 6.18% of its 2016 baseline and recent seagrass loss is 4% of mapped extent, both within the TULIP 1% to under 10% reach anchor.',
      'Use seagrass dense-to-sparse change as degradation evidence, separately from complete mapped loss.',
      'Use the salt-marsh record to show that loss occurs across another blue-carbon habitat and to preserve its reported carbon consequence, without relabelling a record ending in 2019 as current.',
      'Treat gains as necessary context: new mapped habitat elsewhere does not restore the same local habitat, but it prevents a claim of uniform global decline.',
    ],
    prohibited: [
      'Do not add mangrove, seagrass and salt-marsh percentages; their denominators, periods, sensors and habitat definitions differ.',
      'Do not use gross loss percentage as both local ecosystem severity and global reach. Local conversion informs severity; the share of the habitat distribution informs reach.',
      'Do not use carbon stock, carbon emissions, protected-area coverage, country count, map coverage or source count as harmed-person reach.',
      'Do not infer current human severity or reach from the number of people who benefit from fisheries, shoreline protection or carbon storage.',
      'Do not add the scores of Mangrove Buffer Loss, Coastal Habitat Conversion, Carbon Emissions, Sea Level Rise or related service nodes.',
      'Do not treat the mapping interval as recovery time or assume every converted pixel is irreversible.',
      'Do not use WMO climatological normals for habitat condition; each source’s mapped habitat baseline is the relevant denominator.',
    ],
    currentCatalogueRecommendation: {
      rating: 'C 5.9',
      uncertainty: 'B 3.6 to D 7.8',
      confidence: 'B',
      axes: {
        human: {
          lower: { severity: 0, reach: 0, persistence: 1 },
          central: { severity: 1, reach: 1, persistence: 2 },
          upper: { severity: 2, reach: 2, persistence: 3 },
        },
        ecosystem: {
          lower: { severity: 3, reach: 1, persistence: 2 },
          central: { severity: 4, reach: 2, persistence: 3 },
          upper: { severity: 4, reach: 3, persistence: 4 },
        },
      },
      reason: 'Recent global maps directly establish local habitat removal and place measured mangrove and seagrass loss within a 1% to under 10% distribution share. That supports high local ecosystem severity with moderate global reach. Recovery time and direct human consequences remain incompletely measured, so the bounds remain wide and the human component stays conservative.',
    },
  },
  unresolvedForTulip: [
    'Obtain a compatible current estimate of people experiencing attributable loss of fisheries, shoreline protection, water quality or another essential service, with double counting removed.',
    'Resolve the country workbook’s seagrass gross-loss semantics before using its country values or total.',
    'Produce a shared global blue-carbon sampling frame if a combined affected-distribution percentage is needed; do not add habitat-specific percentages.',
    'Measure recovery or permanent conversion distributions for lost and degraded mangrove, seagrass and salt-marsh areas.',
    'Obtain a source-compatible 2027–2036 SSP2-4.5 projection of habitat consequences; physical sea-level or temperature direction alone is not a terminal-harm outlook.',
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
