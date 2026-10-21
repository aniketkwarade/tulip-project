import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { strFromU8, unzipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'palm-oil-canopy-clearance-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+palm-oil-clearance-evidence-ingestion)';

const sources = {
  synthesis: {
    id: 'marsh_tropical_forest_clearance_biodiversity_function_2025',
    publisher: 'Science',
    title: 'Tropical forest clearance impacts biodiversity and function whereas logging changes structure',
    publicationDate: '2025-02-14',
    doi: 'https://doi.org/10.1126/science.adf9856',
    reportUrl: 'https://ora.ox.ac.uk/objects/uuid:0ae81f33-2105-481f-9655-94df7803cbee/files/r5138jg36c',
  },
  synthesisResults: {
    id: 'marsh_bali_synthesis_results_2024',
    publisher: 'Zenodo',
    title: 'BALI synthesis results and figures',
    publicationDate: '2024-08-06',
    doi: 'https://doi.org/10.5281/zenodo.13161799',
    archiveUrl: 'https://zenodo.org/api/records/13161799/files/BALI_synthesis_results_and_figures.zip/content',
  },
  sumatra: {
    id: 'barnes_tropical_land_use_multitrophic_biodiversity_2014',
    publisher: 'Nature Communications',
    title: 'Consequences of tropical land use for multitrophic biodiversity and ecosystem functioning',
    publicationDate: '2014-11-25',
    doi: 'https://doi.org/10.1038/ncomms6351',
    reportUrl: 'https://www.nature.com/articles/ncomms6351.pdf',
  },
  restoration: {
    id: 'zemp_tree_islands_oil_palm_2023',
    publisher: 'Nature',
    title: 'Tree islands enhance biodiversity and functioning in oil palm landscapes',
    publicationDate: '2023-05-10',
    doi: 'https://doi.org/10.1038/s41586-023-06086-5',
    reportUrl: 'https://www.nature.com/articles/s41586-023-06086-5.pdf',
  },
  globalMap: {
    id: 'xu_global_oil_palm_expansion_2001_2024',
    publisher: 'Zenodo',
    title: 'Global oil palm expansion 2001–2024',
    publicationDate: '2026-06-18',
    doi: 'https://doi.org/10.5281/zenodo.20747717',
    recordUrl: 'https://zenodo.org/api/records/20747717',
    landCoverWorkbookUrl: 'https://zenodo.org/api/records/20747717/files/Validation_LandCoverChange_8classes.xlsx/content',
    extentWorkbookUrl: 'https://zenodo.org/api/records/20747717/files/Validation_stratified_accuracy_8strata_3classes_TTM2024.xlsx/content',
  },
  indonesiaAttribution: {
    id: 'gaveau_indonesia_land_in_limbo_2024',
    publisher: 'Proceedings of the National Academy of Sciences',
    title: 'Land in limbo: Nearly one third of Indonesia’s cleared old-growth forests left idle',
    publicationDate: '2024-07-01',
    doi: 'https://doi.org/10.1073/pnas.2318029121',
    retrieval: 'Manual primary-source cross-check; the publisher blocks automated document retrieval.',
  },
  globalForestDenominator: {
    id: 'fao_global_forest_resources_assessment_2025',
    publisher: 'Food and Agriculture Organization of the United Nations',
    title: 'Global Forest Resources Assessment 2025',
    publicationDate: '2025-10-21',
    url: 'https://www.fao.org/interactive/2025/forest-resources-assessment/en/',
    retrieval: 'Official interactive primary-source page manually cross-checked because its data are rendered client-side.',
  },
};

const expected = {
  synthesis: { bytes: 1_298_253, sha256: '7cf3053cc2e3787fffbd2d794e7da80e826408aee74a9535bb822070a7f7bfd3' },
  synthesisResults: { bytes: 4_240_072, md5: 'a370bf2bbb9b013a810c1c3ca52a076c', sha256: '0a6c3b14b522be38521d17bd17f0625414c0c2c0c92906a7dfdc5cd62d040662' },
  sumatra: { bytes: 2_515_012, sha256: '3dfe837d27f13de2e9953a461ea0b00517d51c92285e2ff1d232ba0217a232ce' },
  restoration: { bytes: 18_376_775, sha256: 'd9bb278f1eec4257b5f14a27b019b7e066a2f05024b4df885ab4eb3833037386' },
  globalMapRecord: { title: 'Global oil palm expansion 2001-2024', publicationDate: '2026-06-18', doi: '10.5281/zenodo.20747717' },
  landCoverWorkbook: { bytes: 906_841, md5: '8586bddde3428f171ca38d32a0a32a25', sha256: '3c736ee5de1bac38b9a7fa291a0c25e7646928d0921ab1497a979dde62ebd844' },
  extentWorkbook: { bytes: 452_608, md5: 'accdb396f627d25116b3ddf0133df525', sha256: '0bb533ffe1f6070f7f06a538d58a2766263fa2e0de85ad1399f6a4ec231fb574' },
};

const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const sha256 = value => hash('sha256', value);
const digest = value => sha256(JSON.stringify(value));
const round = (value, places = 2) => Number(value.toFixed(places));

async function fetchBuffer(url, maxBuffer = 24_000_000) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '240',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer, timeout: 250_000 });
  return stdout;
}

function workbookCell(buffer, sheetNumber, cellReference) {
  const archive = unzipSync(new Uint8Array(buffer));
  const xml = strFromU8(archive[`xl/worksheets/sheet${sheetNumber}.xml`]);
  const escaped = cellReference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(`<c\\b[^>]*\\br="${escaped}"[^>]*>[\\s\\S]*?<v>([^<]+)</v>[\\s\\S]*?</c>`));
  assert(match, `Missing ${cellReference} in worksheet ${sheetNumber}`);
  return match[1];
}

const [synthesisPdf, synthesisResults, sumatraPdf, restorationPdf, globalMapRecordBuffer, landCoverWorkbook, extentWorkbook] = await Promise.all([
  fetchBuffer(sources.synthesis.reportUrl),
  fetchBuffer(sources.synthesisResults.archiveUrl),
  fetchBuffer(sources.sumatra.reportUrl),
  fetchBuffer(sources.restoration.reportUrl),
  fetchBuffer(sources.globalMap.recordUrl),
  fetchBuffer(sources.globalMap.landCoverWorkbookUrl),
  fetchBuffer(sources.globalMap.extentWorkbookUrl),
]);

for (const [key, buffer] of Object.entries({ synthesis: synthesisPdf, sumatra: sumatraPdf, restoration: restorationPdf })) {
  assert.equal(buffer.subarray(0, 4).toString('utf8'), '%PDF', `${key} source is not a PDF`);
  assert.equal(buffer.length, expected[key].bytes, `${key} source byte count changed`);
  assert.equal(sha256(buffer), expected[key].sha256, `${key} source checksum changed`);
}
for (const [key, buffer] of Object.entries({ synthesisResults, landCoverWorkbook, extentWorkbook })) {
  assert.equal(buffer.subarray(0, 2).toString('utf8'), 'PK', `${key} source is not a ZIP-based file`);
  assert.equal(buffer.length, expected[key].bytes, `${key} source byte count changed`);
  assert.equal(hash('md5', buffer), expected[key].md5, `${key} source MD5 changed`);
  assert.equal(sha256(buffer), expected[key].sha256, `${key} source checksum changed`);
}

const globalMapRecord = JSON.parse(globalMapRecordBuffer.toString('utf8'));
assert.equal(globalMapRecord.metadata.title, expected.globalMapRecord.title);
assert.equal(globalMapRecord.metadata.publication_date, expected.globalMapRecord.publicationDate);
assert.equal(globalMapRecord.metadata.doi, expected.globalMapRecord.doi);

const extent = {
  industrialOilPalmHa: Number(workbookCell(extentWorkbook, 6, 'C7')),
  smallholderOilPalmHa: Number(workbookCell(extentWorkbook, 6, 'C8')),
  totalOilPalmHa: Number(workbookCell(extentWorkbook, 6, 'C9')),
  totalOilPalmDisplayMha95: workbookCell(extentWorkbook, 6, 'F9'),
  overallAccuracyPercent95: workbookCell(extentWorkbook, 7, 'F7'),
  industrialUsersAccuracyPercent95: workbookCell(extentWorkbook, 7, 'F9'),
  smallholderUsersAccuracyPercent95: workbookCell(extentWorkbook, 7, 'F10'),
  industrialProducersAccuracyPercent95: workbookCell(extentWorkbook, 7, 'F12'),
  smallholderProducersAccuracyPercent95: workbookCell(extentWorkbook, 7, 'F13'),
};
const clearance = {
  industrialBefore2015Ha: Number(workbookCell(landCoverWorkbook, 3, 'H32')),
  industrialAfter2015Ha: Number(workbookCell(landCoverWorkbook, 3, 'I32')),
  smallholderBefore2015Ha: Number(workbookCell(landCoverWorkbook, 3, 'K32')),
  smallholderAfter2015Ha: Number(workbookCell(landCoverWorkbook, 3, 'L32')),
};
clearance.industrialTotalHa = clearance.industrialBefore2015Ha + clearance.industrialAfter2015Ha;
clearance.smallholderTotalHa = clearance.smallholderBefore2015Ha + clearance.smallholderAfter2015Ha;
clearance.totalOldGrowthClearanceHa = clearance.industrialTotalHa + clearance.smallholderTotalHa;
clearance.shareOfCurrentMappedOilPalmAreaPercent = round(clearance.totalOldGrowthClearanceHa / extent.totalOilPalmHa * 100);

assert(Math.abs(extent.totalOilPalmHa - (extent.industrialOilPalmHa + extent.smallholderOilPalmHa)) < 1e-6);
assert(Math.abs(clearance.totalOldGrowthClearanceHa - 5_858_013.263675054) < 1e-6);
assert.equal(extent.totalOilPalmDisplayMha95, '29.86 (29.17, 30.55)');

const primaryForestArea2025HaLowerBound = 1_180_000_000;
const broadGlobalPrimaryForestSharePercent = round(clearance.totalOldGrowthClearanceHa / primaryForestArea2025HaLowerBound * 100);

const snapshot = {
  version: 'tulip_palm_oil_canopy_clearance_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_extent_clearance_ecosystem_effect_and_recovery_evidence_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Separate the severe local ecological consequence of converting tropical forest to oil palm from the global share of relevant ecosystem affected, recovery time, attribution and downstream human pathways.',
  sources: {
    synthesis: { ...sources.synthesis, fetchedReport: { bytes: synthesisPdf.length, sha256: sha256(synthesisPdf), retrievedOn: checkedOn }, reviewedReportPages: ['PDF pages 1–12 and 25–27'] },
    synthesisResults: { ...sources.synthesisResults, fetchedArchive: { bytes: synthesisResults.length, md5: hash('md5', synthesisResults), sha256: sha256(synthesisResults), retrievedOn: checkedOn } },
    sumatra: { ...sources.sumatra, fetchedReport: { bytes: sumatraPdf.length, sha256: sha256(sumatraPdf), retrievedOn: checkedOn }, reviewedReportPages: ['PDF pages 1–6'] },
    restoration: { ...sources.restoration, fetchedReport: { bytes: restorationPdf.length, sha256: sha256(restorationPdf), retrievedOn: checkedOn }, reviewedReportPages: ['PDF pages 1–10'] },
    globalMap: {
      ...sources.globalMap,
      record: { recordId: globalMapRecord.id, title: globalMapRecord.metadata.title, publicationDate: globalMapRecord.metadata.publication_date, doi: globalMapRecord.metadata.doi, retrievedOn: checkedOn },
      landCoverWorkbook: { bytes: landCoverWorkbook.length, md5: hash('md5', landCoverWorkbook), sha256: sha256(landCoverWorkbook), retrievedOn: checkedOn },
      extentWorkbook: { bytes: extentWorkbook.length, md5: hash('md5', extentWorkbook), sha256: sha256(extentWorkbook), retrievedOn: checkedOn },
      mainRaster: { bytes: 588_279_454, md5: 'b59148928aaba73f5bb36065bc6d5848', ingested: false, reason: 'The source validation workbooks contain the required corrected area estimates and accuracy statistics; the 588 MB raster is not required for this global-axis calculation.' },
    },
    indonesiaAttribution: sources.indonesiaAttribution,
    globalForestDenominator: sources.globalForestDenominator,
  },
  endpoints: {
    localEcosystemConsequences: {
      sumatraSites: 32,
      populations: 2_415,
      species: 871,
      rainforestToOilPalmDeclinesPercent: { speciesRichness: 45, animalDensity: 48, biomass: 52, communityEnergyProcessing: 51 },
      interpretation: 'These are direct, locally measured invertebrate-community and ecosystem-function changes in Sumatra. They support a high local ecosystem consequence but are not global species-loss or ecosystem-collapse percentages.',
    },
    crossMetricSynthesis: {
      ecosystemVariables: 82,
      variablesWithSignificantDisturbanceGradientDifference: 60,
      oilPalmIncluded: {
        biodiversity: { significantVariables: 11, totalVariables: 13, meanMarginalR2: 0.232, standardError: 0.023 },
        structureAndEnvironment: { significantVariables: 9, totalVariables: 12, meanMarginalR2: 0.210, standardError: 0.034 },
        ecosystemFunction: { significantVariables: 2, totalVariables: 4, meanMarginalR2: 0.081, standardError: 0.021 },
      },
      limitations: 'The study uses a space-for-time design in one lowland tropical-forest region in Sabah. Biodiversity changed most strongly after conversion to oil palm, while ecosystem functions were more variable and sometimes resilient.',
    },
    currentGlobalExtentAndAttribution: {
      evidencePeriod: { start: 2001, end: 2024 },
      spatialResolutionMetres: 10,
      correctedExtent: extent,
      mappedOldGrowthClearanceLinkedToCurrentOilPalm: clearance,
      interpretation: 'The mapped clearance classes distinguish industrial and smallholder oil palm and whether clearance occurred before or after 2015. The total is an attributed land-conversion stock, not an annual flow or an ecological-condition percentage.',
    },
    globalReachContext: {
      faoPrimaryForestArea2025HaLowerBound: primaryForestArea2025HaLowerBound,
      mappedClearanceShareOfBroadPrimaryForestPercent: broadGlobalPrimaryForestSharePercent,
      centralReachLevel: 1,
      lowerReachLevel: 1,
      upperReachLevel: 2,
      limitation: 'The FAO denominator includes non-tropical primary forest and is broader than the ecosystem distribution suitable for oil palm. It supports a below-1% broad global lower estimate, while the upper level preserves denominator mismatch near the 1% boundary.',
    },
    recoveryAndPersistence: {
      restorationExperimentYears: 5,
      treeIslands: 52,
      biodiversityIndicators: 10,
      ecosystemFunctionIndicators: 19,
      interpretation: 'Tree islands improved multiple indicators within five years, which supports partial reversibility. The experiment does not show that plantation landscapes recover old-growth forest composition or all functions and explicitly does not replace forest protection.',
    },
    indonesiaAttributionContext: {
      period: { start: 1991, end: 2020 },
      primaryForestLossMha: { estimate: 28.4, uncertainty: 0.7 },
      oilPalmAreaOnPreviouslyForestedLandMha: { estimate: 7.8, uncertainty: 0.4 },
      primaryForestLossLinkedToOilPalmMha: { estimate: 6.0, uncertainty: 0.3 },
      deforestation2017To2020MhaPerYear: { estimate: 0.36, uncertainty: 0.04 },
      attributionBoundary: 'Immediate conversion, mechanically cleared land, fire-cleared land and lagged planting are distinct pathways. These overlapping Indonesia estimates are triangulation and are not added to the global 2001–2024 map.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the 45–52% local biodiversity, density, biomass and energy-processing declines as direct severity proxies for converted tropical-forest sites.',
      'Use the 2025 cross-metric synthesis to corroborate broad biodiversity effects while preserving variable ecosystem-function responses and its one-region space-for-time limitation.',
      'Use 5.858 million hectares of corrected mapped old-growth clearance and 29.859 million hectares of corrected current oil-palm extent as current extent and attribution context.',
      'Use the broad global primary-forest denominator only for a conservative reach bound, retaining an adjacent upper level because the ecosystem denominator is imperfect.',
      'Use the restoration experiment to bound partial recovery, not to claim full old-growth recovery.',
      'Confine the candidate to direct ecosystem consequences; route smoke, health, climate, labour, conflict and livelihood outcomes to separately measured nodes.',
    ],
    prohibited: [
      'Do not treat a 45–52% local decline as 45–52% global ecosystem loss or collapse.',
      'Do not treat global map coverage, total plantation extent or all forest clearance as the share of ecosystems currently harmed.',
      'Do not divide by all global forest area and present the result as a precisely matched tropical ecosystem denominator.',
      'Do not add overlapping global and Indonesia clearance estimates.',
      'Do not infer human-health, livelihood, labour, smoke or climate consequences from forest conversion without direct endpoint evidence and overlap controls.',
      'Do not count the observation period, plantation life or map history as consequence persistence by itself.',
      'Do not treat tree-island improvement as restoration of old-growth forest or as permission to replace forest protection.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'palm_oil_canopy_clearance',
      rating: 'C 6.3',
      uncertainty: 'C 4.8 to D 7.8',
      confidence: 'B',
      domain: 'ecosystem only',
      centralAxes: { severity: 3, reach: 1, persistence: 3 },
      lowerAxes: { severity: 2, reach: 1, persistence: 2 },
      upperAxes: { severity: 3, reach: 2, persistence: 4 },
      reason: 'Direct studies support substantial local ecosystem loss after tropical-forest conversion, while validated global mapping places the affected stock below 1% of a broad primary-forest denominator. Conversion commonly persists for decades and old-growth features may not recover fully, but partial restoration can improve some functions. The central value is retained, the uncertainty narrows from B–D to C–D, confidence rises from C to B and unrelated human pathways are removed.',
    },
  },
  unresolvedForTulip: [
    'Construct a denominator restricted to tropical lowland forest ecologically suitable for oil palm and report the mapped clearance share with uncertainty.',
    'Link the 2001–2024 clearance map to consistent local biodiversity and ecosystem-function response surfaces rather than transferring one regional effect unchanged.',
    'Separate areas still under oil palm, abandoned plantations and restored areas when measuring current ecosystem condition.',
    'Obtain comparable recovery trajectories for species composition, biomass, soils, hydrology and ecosystem functions beyond five years.',
    'Quantify direct human endpoints separately if they are ever admitted to this node, with overlap controls for smoke, labour, livelihoods and climate.',
  ],
};

snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  rating: snapshot.tulipUse.currentCatalogueRecommendation.rating,
  uncertainty: snapshot.tulipUse.currentCatalogueRecommendation.uncertainty,
  mappedClearanceMha: round(clearance.totalOldGrowthClearanceHa / 1_000_000, 3),
  broadGlobalPrimaryForestSharePercent,
  digest: snapshot.snapshotDigest,
}, null, 2));
