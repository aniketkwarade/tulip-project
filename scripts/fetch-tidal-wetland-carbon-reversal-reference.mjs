import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'tidal-wetland-carbon-reversal-reference-snapshot.json');
const sourceGridAnalysisPath = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'tidal-wetland-soc-source-grid-analysis.json');
const fullResolutionAnalysisPath = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'tidal-wetland-soc-full-resolution-mean-map-analysis.json');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const execFileAsync = promisify(execFile);

const sources = {
  globalStock: {
    id: 'yang_global_tidal_wetland_soc_change_2026',
    publisher: 'Nature Communications',
    title: 'Spatio-temporal patterns and environmental controls of soil organic carbon stocks in global tidal wetlands since 2009',
    publicationDate: '2026-07-28',
    doi: '10.1038/s41467-026-76092-4',
    url: 'https://www.nature.com/articles/s41467-026-76092-4',
    pdfUrl: 'https://www.nature.com/articles/s41467-026-76092-4.pdf',
    pdfSha256: '961dcfbd32dde2e2a76363a829f793ef491604ce00ea53e89965ee39d8dee71d',
    dataUrl: 'https://zenodo.org/records/19434201',
    codeArchiveUrl: 'https://zenodo.org/records/19434201/files/code_upload.7z?download=1',
    codeArchiveMd5: '733d842a56e259035c5fff133068f7fd',
  },
  disturbanceResponse: {
    id: 'fu_blue_carbon_disturbance_loss_2025',
    publisher: 'Nature Communications; PubMed Central',
    title: 'Nonuniform organic carbon stock loss in soils across disturbed blue carbon ecosystems',
    publicationDate: '2025-05-11',
    doi: '10.1038/s41467-025-59752-9',
    pmid: '40350444',
    pmcid: 'PMC12066739',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12066739/',
    xmlUrl: 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_xml/PMC12066739/unicode',
    xmlSha256: '187bafdbde4e579d70f9fbdf6debed24525d24a8f3d867697a98d3768871f0f6',
    dataUrl: 'https://ndownloader.figshare.com/files/53999528',
    dataSha256: 'ed2cd86feeeee50d19e38885cde921f5cded1d0af04942951feb8910564f243e',
    dataMd5: '786a88a5848ae592ecbb6a346e71ffd0',
  },
  saltMarshChange: {
    id: 'campbell_global_salt_marsh_change_2022',
    publisher: 'Nature',
    title: 'Global hotspots of salt marsh change and carbon emissions',
    publicationDate: '2022-11-30',
    doi: '10.1038/s41586-022-05355-z',
    url: 'https://www.nature.com/articles/s41586-022-05355-z',
    pdfUrl: 'https://www.nature.com/articles/s41586-022-05355-z.pdf',
    pdfSha256: '4935bc36352b656ca6f0bd1fc8c2348fda0520458f279c72882d04fd14395574',
  },
};

async function fetchBytes(url, accept) {
  const response = await fetch(url, {
    headers: { accept, 'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)' },
    signal: AbortSignal.timeout(180_000),
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function fetchPdf(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location',
    '--fail',
    '--silent',
    '--show-error',
    '--max-time',
    '180',
    '--header',
    'Accept: application/pdf',
    url,
  ], { encoding: null, maxBuffer: 50_000_000, timeout: 190_000 });
  return stdout;
}

for (const source of [sources.globalStock, sources.saltMarshChange]) {
  // Nature's PDF endpoint passes through a cookie bootstrap that the Fetch
  // implementation does not retain across redirects. curl follows that flow.
  const bytes = await fetchPdf(source.pdfUrl);
  assert(bytes.subarray(0, 5).equals(Buffer.from('%PDF-')), `${source.id} did not return a PDF`);
  assert.equal(sha256(bytes), source.pdfSha256, `${source.id} PDF changed`);
}

const fuXmlBytes = await fetchBytes(sources.disturbanceResponse.xmlUrl, 'application/xml');
assert.equal(sha256(fuXmlBytes), sources.disturbanceResponse.xmlSha256, 'Fu PMC XML changed');
const fuXml = fuXmlBytes.toString('utf8');
for (const phrase of ['239 paired observations', '−68.4%', '−25.9%', '30 years post-conversion', 'approximately 60 years post-conversion', 'after 80 years']) {
  assert(fuXml.includes(phrase), `Expected Fu source phrase missing: ${phrase}`);
}
const fuDataBytes = await fetchBytes(sources.disturbanceResponse.dataUrl, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
assert.equal(sha256(fuDataBytes), sources.disturbanceResponse.dataSha256, 'Fu source workbook changed');
assert.equal(md5(fuDataBytes), sources.disturbanceResponse.dataMd5, 'Fu source workbook MD5 changed');

const sourceGridAnalysis = JSON.parse(await readFile(sourceGridAnalysisPath, 'utf8'));
assert.equal(sourceGridAnalysis.version, 'tulip_tidal_wetland_soc_source_grid_analysis_2026_09_24_v1');
assert.equal(sourceGridAnalysis.source.archiveMd5, sources.globalStock.codeArchiveMd5);
assert.equal(sourceGridAnalysis.stockReproduction.earlierMeanStockPetagrams, 8.803256);
assert.equal(sourceGridAnalysis.stockReproduction.laterMeanStockPetagrams, 8.265589);
assert.equal(sourceGridAnalysis.ratingImplication.decision, 'compact_grid_alone_cannot_set_reach_full_resolution_area_analysis_required');
const fullResolutionAnalysis = JSON.parse(await readFile(fullResolutionAnalysisPath, 'utf8'));
assert.equal(fullResolutionAnalysis.version, 'tulip_tidal_wetland_soc_mean_map_analysis_2026_09_24_v1');
assert.equal(fullResolutionAnalysis.source.archiveMd5['0030'], 'e6311d771c3ac1e56ef1a84141b4ead3');
assert.equal(fullResolutionAnalysis.source.archiveMd5['3060'], '60d87d27f7c909c7d7d7220bbd761179');
assert.equal(fullResolutionAnalysis.source.archiveMd5['6000'], 'fc74268fd405ac0dc6ee56ea63d1fa32');
assert.equal(fullResolutionAnalysis.ratingImplication.candidate.value, 7);
assert.equal(fullResolutionAnalysis.ratingImplication.candidate.ecosystemAxes.reach.central, 3);

const candidate = {
  initialStructured: { value: 7.0, grade: 'D', lower: 4.8, upper: 9.3, confidence: 'C' },
  previous: { value: 6.3, grade: 'C', lower: 4.0, upper: 10.0, confidence: 'B' },
  revised: { value: 7.0, grade: 'D', lower: 4.0, upper: 10.0, confidence: 'B' },
  axes: {
    ecosystem: {
      severity: { lower: 1, central: 2, upper: 4 },
      reach: { lower: 1, central: 3, upper: 4 },
      persistence: { lower: 2, central: 3, upper: 4 },
    },
  },
  reason: 'A 2026 global model estimates that tidal-wetland soil organic carbon declined 6.11% between 2009–2014 and 2015–2020, with mangroves down 8.41%, tidal flats down 5.67% and salt marshes up 7.92%. TULIP reproduced the headline stocks from the checksum-pinned source products, then area-weighted all six original 90 m mean maps. Within pixels mapped in both periods, 29.0% of the union wetland distribution has at least a 5% mean decline and 20.7% has at least a 10% decline. Across minimum-decline thresholds from 0% through 70%, the paired TULIP severity and reach levels always combine with persistence level 3 to produce D 7.0. Period-only map churn and the absence of a formal change-uncertainty model preserve the B–E range. A 2025 paired-site synthesis independently supports disturbance-specific losses and 30–80-year pathways. The result scores carbon-storage-function loss only and does not add downstream human or climate effects.',
};

const payload = {
  version: 'tulip_tidal_wetland_carbon_reversal_2026_09_24_v3',
  retrievedOn: '2026-09-24',
  status: 'global_stock_change_full_resolution_area_sensitivity_disturbance_response_and_recovery_evidence_ingested_formal_change_uncertainty_and_human_endpoint_missing',
  productionRatingsEnabled: 0,
  nodeId: 'tidal_wetland_carbon_reversal',
  sources,
  currentWindow: {
    start: 2009,
    end: 2020,
    coverageStatus: 'global_modelled_stock_change_with_source_specific_observation_limits',
    summaryMethod: 'end_state_stock',
    coverageNote: 'The global model compares 2009–2014 with 2015–2020 using 42,154 soil-layer records at 5,489 locations and mapped mangroves, salt marshes and tidal flats between 60 degrees north and south. It is not a direct census of every wetland pixel or a current human-harm estimate.',
  },
  evidence: {
    globalStockChange: {
      earlierPeriod: { start: 2009, end: 2014 },
      laterPeriod: { start: 2015, end: 2020 },
      records: 42154,
      uniqueLocations: 5489,
      globalSocPetagramsEarlier: 8.80,
      globalSocPetagramsLater: 8.27,
      globalSocChangePercent: -6.11,
      mangroveSocChangePercent: -8.41,
      tidalFlatSocChangePercent: -5.67,
      saltMarshSocChangePercent: 7.92,
      sourceGridReproduction: {
        analysisVersion: sourceGridAnalysis.version,
        analysisDigest: sourceGridAnalysis.digest,
        earlierMeanStockPetagrams: sourceGridAnalysis.stockReproduction.earlierMeanStockPetagrams,
        laterMeanStockPetagrams: sourceGridAnalysis.stockReproduction.laterMeanStockPetagrams,
        commonOccupiedGridCells: sourceGridAnalysis.stockReproduction.commonMeanGridCells,
        decliningOccupiedGridCellSharePercent: sourceGridAnalysis.spatialSensitivity.periodMeanDifference.decliningCellSharePercent,
        decliningAtLeastFivePercentOccupiedGridCellSharePercent: sourceGridAnalysis.spatialSensitivity.relativeDeclineThresholds['5'].shareOfCommonOccupiedCellsPercent,
        sourceProductReconciliation: sourceGridAnalysis.sourceProductReconciliation,
        interpretationBoundary: 'The compact grid contains carbon stock per occupied 0.5-degree cell, not wetland area. Cell-count and stock-weighted shares are spatial sensitivity checks and cannot become TULIP affected-distribution reach.',
      },
      fullResolutionMeanMapAnalysis: {
        analysisVersion: fullResolutionAnalysis.version,
        analysisDigest: fullResolutionAnalysis.digest,
        sourceFiles: fullResolutionAnalysis.source.files,
        denominator: fullResolutionAnalysis.denominator,
        sourceReproduction: fullResolutionAnalysis.sourceReproduction,
        mappedChange: fullResolutionAnalysis.mappedChange,
        ratingImplication: fullResolutionAnalysis.ratingImplication,
        interpretationBoundaries: fullResolutionAnalysis.interpretationBoundaries,
      },
      interpretation: 'The global total is a modeled stock change with a wide prediction interval and heterogeneous habitat directions. It is evidence of aggregate carbon-storage-function loss, not the percentage of wetland distribution collapsed.',
    },
    disturbanceResponse: {
      pairedObservations: 239,
      sourceArticles: 140,
      sites: { mangrove: 118, saltMarsh: 82, seagrass: 39 },
      observedPercentLossExamples: {
        mangroveAgriculture: -68.4,
        mangroveAquacultureAtThirtyYears: -86.3,
        saltMarshClimateOrHydrologicalChange: -25.9,
        saltMarshAgricultureAtSixtyYears: -49.9,
        seagrassDredgingAtEightyYears: -77.1,
      },
      interpretation: 'Disturbance type and depth matter. Deep conversion can remove most stored soil carbon over decades, while limited disturbances can cause small losses or gains. The extreme categories are upper cases and are not a global central average.',
    },
    saltMarshChangeAndRecovery: {
      studyPeriod: { start: 2000, end: 2019 },
      grossLossSquareKilometres: 2733.33,
      netLossSquareKilometres: 1452.84,
      globalExtentContextSquareKilometres: 90800,
      annualLossRatePercent: 0.28,
      netAnnualEmissionsTgCo2e: 16.3,
      netAnnualEmissions90PercentIntervalTgCo2e: { lower: 0.4, upper: 33.2 },
      recoveredShareOfLossesBy2019Percent: 4.7,
      interpretation: 'The recovery share describes mapped vegetation returning to its reference condition. It does not prove that soil carbon stocks recovered at the same time.',
    },
    boundaries: {
      compatibleAffectedGlobalWetlandDistributionPercent: fullResolutionAnalysis.mappedChange['5'].commonMappedExtentOnly.shareOfUnionMappedWetlandAreaDecliningPercent,
      affectedDistributionCentralThreshold: 'at_least_5_percent_mean_carbon_stock_decline_within_pixels_mapped_in_both_periods',
      occupiedGridCellDeclineSharePercentNotWetlandArea: sourceGridAnalysis.spatialSensitivity.periodMeanDifference.decliningCellSharePercent,
      occupiedGridCellDeclineAtLeastFivePercentShareNotWetlandArea: sourceGridAnalysis.spatialSensitivity.relativeDeclineThresholds['5'].shareOfCommonOccupiedCellsPercent,
      compatibleCurrentHumanConsequence: null,
      attributionToClimateVersusLandUseFullySeparated: false,
      carbonStockRecoveryDistribution: null,
    },
  },
  ratingDecision: {
    change: 'central_grade_increased_from_C_to_D_after_full_resolution_area_denominator_supported_reach_level_3_while_human_domain_remained_excluded',
    candidate,
    admittedUses: [
      'Use the global 6.11% modeled stock decline and paired-site disturbance responses to bound ecosystem carbon-storage-function severity.',
      'Use mapped global heterogeneity and habitat-specific directions to support broad but non-uniform reach without treating model coverage as affected distribution.',
      'Use the checksum-pinned compact source-grid reproduction to confirm the headline stocks and broad modelled spatial heterogeneity; compact cell counts alone do not set reach.',
      'Use the full-resolution common-extent mean-map analysis to set central ecosystem reach level 3; the 5% and 10% minimum-decline cases affect 29.0% and 20.7% of the union mapped distribution.',
      'Use the threshold-invariant D 7.0 sensitivity across 0%, 5%, 10%, 30%, 50% and 70% minimum declines as a central-value robustness check, not as a probability interval.',
      'Use the 30–80-year disturbance curves and low mapped salt-marsh recovery share to support multi-decade persistence bounds.',
      'Use salt-marsh emissions as physical carbon-flow context, not human or ecosystem harm added to the carbon-stock consequence.',
    ],
    excludedUses: [
      'Do not treat global model coverage, soil samples, countries, wetland area or stored petagrams as the share of people harmed.',
      'Do not copy Carbon Emissions, Global Temperature, sea-level, water-security or human-service ratings into this upstream carbon-function node.',
      'Do not add habitat area loss, soil-carbon density decline, carbon stock decline and emitted carbon as separate harms when they describe the same reversal pathway.',
      'Do not interpret the 6.11% global stock decline as 6.11% of wetland area collapsed or as uniform loss in every wetland type.',
      'Do not interpret the share of occupied 0.5-degree cells with decline, the carbon stock situated in those cells or the share of countries with aggregate decline as the affected wetland-area percentage.',
      'Do not treat period mean plus or minus source SD as a formal confidence interval for the change; its non-overlap result is a sensitivity screen only.',
      'Do not treat 2014-only mapped pixels as certain complete loss or 2020-only pixels as certain gain; period-only classification churn remains an upper spatial sensitivity.',
      'Do not call the mean-map result statistically significant or field-observed at every pixel.',
      'Do not generalize extreme agricultural, aquaculture or dredging losses to the global central case.',
      'Do not treat vegetation recovery as proof of soil-carbon recovery.',
    ],
    exactRemainingGaps: [
      'A common collapse or functional-loss reference for tidal-wetland carbon storage across mangroves, salt marshes and tidal flats.',
      'A formal uncertainty model for the difference between periods, including dependence between the two modelled period estimates and reconciliation of the archived period-grid, depth-change and country-table totals.',
      'A global carbon-stock recovery-time distribution after disturbance and restoration.',
      'A causal decomposition of climate, land conversion, hydrology, storms and other drivers for the global stock change.',
      'Any current human health, displacement, service or material-loss consequence attributable specifically to this upstream carbon reversal rather than downstream warming or habitat loss.',
    ],
  },
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  sources: payload.sources,
  currentWindow: payload.currentWindow,
  evidence: payload.evidence,
  ratingDecision: payload.ratingDecision,
}));

await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, digest: payload.digest, candidate: candidate.revised }, null, 2));
