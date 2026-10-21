import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'phytoplankton-decline-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+phytoplankton-decline-evidence-ingestion)';
const expected = {
  articleTrendClaimBytes: 2_085,
  articleTrendClaimSha256: '069628813fe6ec73d66563f8d16eb4613569b9f20484e039c143f9fc5531ef6b',
  articleGlobalClaimBytes: 938,
  articleGlobalClaimSha256: 'ade26efb893c9294c277435d56b18a2b823209c831322dc78f7d4fb0fbcd0796',
  articleLimitationsClaimBytes: 1_288,
  articleLimitationsClaimSha256: '47444e1f19d0d0ffc318d55bd4cb8432b2efd95c59861c525c22ecbdd4516053',
  ipccObservedClaimBytes: 1_148,
  ipccObservedClaimSha256: 'd5cda1af161f6f25e621f8d36f9bc4d55ec8487d09b92086b55b70790d7165fe',
  ipccFutureClaimBytes: 1_291,
  ipccFutureClaimSha256: '93724a7c19233327b0850bc42156fa97bed144b6e32eb3f3de09c435bb32d050',
  figure4Bytes: 12_356_558,
  figure4Md5: 'c9a84d8b9059c16ce23b574a9d3ca49d',
  figure4Sha256: '164712e7612ebb76924bc7e0d133b19ef0423acb59b2909ec1691a87f37ec071',
};
const sources = {
  article: {
    id: 'silsbe_global_npp_decline_2025',
    publisher: 'Nature Communications',
    title: 'Global declines in net primary production in the ocean color era',
    publicationDate: '2025-07-01',
    articleUrl: 'https://www.nature.com/articles/s41467-025-60906-y',
    doi: 'https://doi.org/10.1038/s41467-025-60906-y',
  },
  archive: {
    id: 'silsbe_global_npp_zenodo_2025',
    publisher: 'Zenodo',
    title: 'Monthly global net phytoplankton production and phytoplankton absorbed energy derived from the CAFE model',
    publicationDate: '2025',
    recordId: 15_497_141,
    recordUrl: 'https://zenodo.org/records/15497141',
    apiUrl: 'https://zenodo.org/api/records/15497141',
    doi: 'https://doi.org/10.5281/zenodo.15497141',
  },
  ipcc: {
    id: 'ipcc_ar6_wgii_ocean_primary_production',
    publisher: 'Intergovernmental Panel on Climate Change',
    title: 'AR6 Working Group II, Chapter 3: Oceans and Coastal Ecosystems and their Services',
    publicationDate: '2022-02-28',
    chapterUrl: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
  },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const decodeHtml = value => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#xA0;/gi, ' ')
  .replace(/&ndash;|&#8211;|&#x2013;/gi, '–')
  .replace(/&mdash;|&#8212;|&#x2014;/gi, '—')
  .replace(/&plusmn;|&#177;|&#xB1;/gi, '±')
  .replace(/&minus;|&#8722;|&#x2212;/gi, '−')
  .replace(/&deg;|&#176;/gi, '°')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#x27;|&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

async function fetchBuffer(url, accept) {
  const args = [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
  ];
  if (accept) args.push('--header', `Accept: ${accept}`);
  args.push(url);
  const { stdout } = await execFileAsync('curl', args, { encoding: null, maxBuffer: 200_000_000, timeout: 130_000 });
  return stdout;
}

function paragraphContaining(buffer, needle) {
  const html = buffer.toString('utf8');
  const index = html.indexOf(needle);
  assert(index >= 0, `Official source paragraph is missing: ${needle}`);
  const start = html.lastIndexOf('<p', index);
  const contentStart = html.indexOf('>', start);
  const end = html.indexOf('</p>', index);
  assert(start >= 0 && contentStart >= 0 && end >= 0, `Could not isolate paragraph: ${needle}`);
  return decodeHtml(html.slice(contentStart + 1, end));
}

const [articlePage, archiveBuffer, ipccPage] = await Promise.all([
  fetchBuffer(sources.article.articleUrl, 'text/html'),
  fetchBuffer(sources.archive.apiUrl, 'application/json'),
  fetchBuffer(sources.ipcc.chapterUrl, 'text/html'),
]);
const archive = JSON.parse(archiveBuffer.toString('utf8'));
assert.equal(archive.id, sources.archive.recordId);
assert.equal(archive.metadata?.doi, '10.5281/zenodo.15497141');
assert.equal(archive.metadata?.title, sources.archive.title);
const figure4Metadata = archive.files?.find(file => file.key === 'NPP Trends Figure 4.nc');
assert(figure4Metadata, 'Published Figure 4 dataset is missing from Zenodo record');
assert.equal(figure4Metadata.size, expected.figure4Bytes);
assert.equal(figure4Metadata.checksum, `md5:${expected.figure4Md5}`);
// Zenodo's content endpoint can return 406 when an explicit Accept header is
// supplied even though it serves the file as application/octet-stream.
const figure4 = await fetchBuffer(figure4Metadata.links.self);
assert.equal(figure4.length, expected.figure4Bytes, 'Figure 4 data byte count changed');
assert.equal(md5(figure4), expected.figure4Md5, 'Figure 4 data MD5 changed');
assert.equal(sha256(figure4), expected.figure4Sha256, 'Figure 4 data SHA-256 changed');
assert.equal(figure4.subarray(0, 8).toString('hex'), '894844460d0a1a0a', 'Figure 4 data is not an HDF5/NetCDF4 file');

const articleTrendClaim = paragraphContaining(articlePage, 'Across the satellite record, NPP is decreasing');
const articleGlobalClaim = paragraphContaining(articlePage, 'Across the 25-year record, NPP averaged');
const articleLimitationsClaim = paragraphContaining(articlePage, 'The model and analyses presented here are agnostic');
const ipccObservedClaim = paragraphContaining(ipccPage, 'Analyses of satellite-derived primary production over the past two decades');
const ipccFutureClaim = paragraphContaining(ipccPage, 'Across 10 CMIP5 and 13 CMIP6 ESM ensembles');
for (const [name, value, bytes, checksum] of [
  ['Article spatial trend', articleTrendClaim, expected.articleTrendClaimBytes, expected.articleTrendClaimSha256],
  ['Article global trend', articleGlobalClaim, expected.articleGlobalClaimBytes, expected.articleGlobalClaimSha256],
  ['Article limitations', articleLimitationsClaim, expected.articleLimitationsClaimBytes, expected.articleLimitationsClaimSha256],
  ['IPCC observed assessment', ipccObservedClaim, expected.ipccObservedClaimBytes, expected.ipccObservedClaimSha256],
  ['IPCC projection assessment', ipccFutureClaim, expected.ipccFutureClaimBytes, expected.ipccFutureClaimSha256],
]) {
  assert.equal(Buffer.byteLength(value), bytes, `${name} claim byte count changed`);
  assert.equal(sha256(value), checksum, `${name} claim checksum changed`);
}

const snapshot = {
  version: 'tulip_phytoplankton_decline_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_global_npp_function_and_reach_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a 1998–2015 trend proxy with the current 25-year global ocean-colour assessment, route cumulative functional loss and affected ocean area to separate axes, and keep downstream fisheries or human outcomes outside this node.',
  sources: {
    article: {
      ...sources.article,
      spatialTrendClaim: { bytes: Buffer.byteLength(articleTrendClaim), sha256: expected.articleTrendClaimSha256, retrievedOn: checkedOn },
      globalTrendClaim: { bytes: Buffer.byteLength(articleGlobalClaim), sha256: expected.articleGlobalClaimSha256, retrievedOn: checkedOn },
      limitationsClaim: { bytes: Buffer.byteLength(articleLimitationsClaim), sha256: expected.articleLimitationsClaimSha256, retrievedOn: checkedOn },
    },
    archive: {
      ...sources.archive,
      figure4: {
        key: figure4Metadata.key,
        bytes: figure4.length,
        md5: expected.figure4Md5,
        sha256: expected.figure4Sha256,
        contentUrl: figure4Metadata.links.self,
        format: 'NetCDF4/HDF5',
        retrievedOn: checkedOn,
      },
    },
    ipcc: {
      ...sources.ipcc,
      observedAssessmentClaim: { bytes: Buffer.byteLength(ipccObservedClaim), sha256: expected.ipccObservedClaimSha256, retrievedOn: checkedOn },
      projectionAssessmentClaim: { bytes: Buffer.byteLength(ipccFutureClaim), sha256: expected.ipccFutureClaimSha256, retrievedOn: checkedOn },
    },
  },
  endpoints: {
    currentFunction: {
      record: { start: 1997, end: 2022, months: 303, durationLabel: '25-year satellite record' },
      averageGlobalNppPgCPerYear: 56.8,
      annualStandardDeviationPgCPerYear: 1.9,
      declineRatePgCPerDecade: 1.8,
      netDecreaseAcrossRecordPercent: 7.4,
      measurement: 'CAFE absorption-based net primary production estimated from harmonized SeaWiFS and MODIS-Aqua ocean-colour records.',
      severityBoundary: 'The 7.4% value measures net loss of global phytoplankton production function across the record. It is not 7.4% species loss, ecosystem collapse or fisheries loss.',
    },
    spatialReach: {
      oceanAreaWithSignificantDeclinePercent: 48,
      averageDeclineWithinDecliningAreaPercentPerDecade: 7.1,
      oceanAreaWithSignificantIncreasePercent: 4,
      averageIncreaseWithinIncreasingAreaPercentPerDecade: 20,
      confidenceThreshold: 'Spatial trends exceed the study’s 90% confidence interval after autocorrelation adjustment.',
      geographicPattern: 'Declines dominate tropical and subtropical stratified waters; increases occur mainly in lower-productivity polar, subpolar and selected current regions.',
      reachBoundary: 'The 48% value is an ocean-area reach measure. The 7.1% regional trend rate is not added to the 7.4% global functional loss.',
    },
    attributionAndPersistence: {
      mechanism: 'The study links declining production primarily to stronger nutrient limitation in a warmer, more stratified surface ocean, while interannual variability and regional increases remain substantial.',
      attributionBoundary: 'The study is an observational and model-based trend analysis, not a factual-versus-no-anthropogenic-climate counterfactual. It does not allocate the entire change to human-caused warming.',
      persistenceBoundary: 'A 25-year declining record establishes a sustained trend, not a 25-year recovery time. Direct recovery or reversibility of the production loss is not measured.',
    },
    outlook: {
      direction: 'mixed',
      confidence: 'C',
      assessment: 'IPCC reports low confidence in projected global NPP decline because individual CMIP6 models project both increases and decreases within every SSP and model uncertainty exceeds scenario uncertainty.',
      boundary: 'No numerical SSP2-4.5 change for 2027–2036 is inferred from end-century projections.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the 7.4% cumulative loss in global NPP as a converted severity proxy for current ecosystem production-function loss.',
      'Use the 48% share of ocean area with a statistically significant decline as the ecosystem reach measure.',
      'Use the observed 25-year trend and persistent warming-stratification mechanism only to bound persistence; do not translate record length into recovery time.',
      'Use IPCC model disagreement to retain a mixed, low-confidence outlook rather than manufacturing an SSP2-4.5 ten-year value.',
    ],
    prohibited: [
      'Do not add the 7.4% cumulative global loss, the 7.1% decadal rate in declining regions and the 48% affected area as repeated severity terms.',
      'Do not treat the 48% ocean-area share as 48% species loss or ecosystem collapse.',
      'Do not use the 25-year observation record as a consequence or recovery duration.',
      'Do not add Fishery Protein Dependence, Fish Landing Supply Disruption, Ocean Carbon Uptake or other downstream scores.',
      'Do not infer people harmed, food insecurity, fishery loss or economic loss from the NPP measurement without a matched terminal endpoint.',
      'Do not assign all of the observed decline to anthropogenic climate change without a matched counterfactual attribution study.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'phytoplankton_decline',
      rating: 'C 5.5',
      uncertainty: 'C 4.8 to D 7.0',
      confidence: 'B',
      domain: 'ecosystem production function',
      reason: 'The current source measures both functional loss and affected ocean area directly. Recovery time and formal anthropogenic attribution remain bounded, while downstream human consequences are excluded.',
    },
  },
  unresolvedForTulip: [
    'Obtain a directly estimated recovery or reversibility distribution for regional NPP loss after nutrient and stratification conditions change.',
    'Reproduce the published global trend and 48% spatial share from the complete gridded archive and code, including uncertainty propagation across satellite harmonization choices.',
    'Obtain an anthropogenic-climate counterfactual for the observed 1997–2022 NPP change.',
    'Obtain a source-native SSP2-4.5 projection for 2027–2036 without interpolating from end-century scenarios.',
    'Keep any attributable fisheries or human material endpoint in its matching downstream node unless the node boundary is explicitly changed.',
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
  currentEvidenceEnd: snapshot.endpoints.currentFunction.record.end,
  netDecreasePercent: snapshot.endpoints.currentFunction.netDecreaseAcrossRecordPercent,
  decliningOceanAreaPercent: snapshot.endpoints.spatialReach.oceanAreaWithSignificantDeclinePercent,
  rating: snapshot.tulipUse.currentCatalogueRecommendation.rating,
  digest: snapshot.snapshotDigest,
}, null, 2));
