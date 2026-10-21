import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'marine-food-web-reorganization-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+marine-food-web-reorganization-evidence-ingestion)';

const sources = {
  caribbeanArticle: {
    id: 'lueders_dumont_caribbean_trophic_simplification_2026',
    publisher: 'Nature',
    title: 'Fossil isotope evidence for trophic simplification on modern Caribbean reefs',
    publicationDate: '2026-02-11',
    doi: 'https://doi.org/10.1038/s41586-025-10077-z',
    articleUrl: 'https://www.nature.com/articles/s41586-025-10077-z',
    pdfUrl: 'https://www.nature.com/articles/s41586-025-10077-z.pdf',
  },
  caribbeanArchive: {
    id: 'lueders_dumont_caribbean_trophic_simplification_figshare_2026',
    publisher: 'Figshare',
    title: 'Supplementary data and code for fossil isotope evidence for trophic simplification on modern Caribbean reefs',
    publicationDate: '2026-01-19',
    doi: 'https://doi.org/10.6084/m9.figshare.28811663',
    apiUrl: 'https://api.figshare.com/v2/articles/28811663',
    dataFileUrl: 'https://ndownloader.figshare.com/files/61110337',
  },
  balticArticle: {
    id: 'faithfull_baltic_food_web_reorganization_2026',
    publisher: 'ICES Journal of Marine Science',
    title: 'Systemic food web reorganization due to multiple pressures in seven Baltic Sea sub-basins',
    publicationDate: '2026-06',
    doi: 'https://doi.org/10.1093/icesjms/fsag112',
    articleUrl: 'https://academic.oup.com/icesjms/article/83/6/fsag112/8713652',
    accessibleArticleUrl: 'https://oup.silverchair-cdn.com/article-minimal/8713652',
  },
  balticArchive: {
    id: 'faithfull_baltic_food_web_reorganization_zenodo_2026',
    publisher: 'Zenodo',
    title: 'Data and code for reproducing the analyses in Systemic food web reorganization due to multiple pressures in seven Baltic Sea sub-basins',
    publicationDate: '2026-05-21',
    doi: 'https://doi.org/10.5281/zenodo.20321614',
    apiUrl: 'https://zenodo.org/api/records/20321614',
    readmeUrl: 'https://zenodo.org/api/records/20321614/files/README.md/content',
    trendCodeUrl: 'https://zenodo.org/api/records/20321614/files/Trend_Analysis.R/content',
    trophicCodeUrl: 'https://zenodo.org/api/records/20321614/files/Trophictrends.R/content',
  },
};

const expected = {
  caribbeanPdf: { bytes: 33_444_968, sha256: '77bef307c15d398f97298810e3c3f9be1e3d4d5040e2d1994506660f0c507d68' },
  caribbeanData: { bytes: 53_720, sha256: 'a07d29d99fbe6c45de7e7a040abc0d0bf3407110679f59ac8c76aef389fad336', md5: 'd005845ee938fc57f66e8de9cd2fc2d0' },
  balticReadme: { bytes: 1_328, sha256: '16f99570df1f750015e80b7ba5648fef7e6fe453ee7258b7fcd9462577589447', md5: 'f91ad19ddb40ec7926726806398e6450' },
  balticTrendCode: { bytes: 21_833, sha256: '43a3619a47bd657177eaa2abcc8eddb25ffa85fb66a85173cdb40ea18a7ffa72', md5: '52095cf1f49077bbd82327f913ea9bc9' },
  balticTrophicCode: { bytes: 14_711, sha256: '5fc13479d934e57e746511ebba741c0299f8af91d055de1208d13934e96f5bb1', md5: '95588033713a7b576cc1ba6f824e4763' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url, maximumBytes = 50_000_000) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: maximumBytes, timeout: 190_000 });
  return stdout;
}

function verify(label, buffer, expectedFile) {
  assert.equal(buffer.length, expectedFile.bytes, `${label} byte count changed`);
  assert.equal(sha256(buffer), expectedFile.sha256, `${label} checksum changed`);
  if (expectedFile.md5) assert.equal(md5(buffer), expectedFile.md5, `${label} MD5 changed`);
}

const [caribbeanArticleHtml, caribbeanPdf, caribbeanArchiveResponse, caribbeanData, balticArticleHtml, balticArchiveResponse, balticReadme, balticTrendCode, balticTrophicCode] = await Promise.all([
  fetchBuffer(sources.caribbeanArticle.articleUrl, 2_000_000),
  fetchBuffer(sources.caribbeanArticle.pdfUrl),
  fetchBuffer(sources.caribbeanArchive.apiUrl, 2_000_000),
  fetchBuffer(sources.caribbeanArchive.dataFileUrl, 2_000_000),
  fetchBuffer(sources.balticArticle.accessibleArticleUrl, 2_000_000),
  fetchBuffer(sources.balticArchive.apiUrl, 3_000_000),
  fetchBuffer(sources.balticArchive.readmeUrl, 2_000_000),
  fetchBuffer(sources.balticArchive.trendCodeUrl, 2_000_000),
  fetchBuffer(sources.balticArchive.trophicCodeUrl, 2_000_000),
]);

verify('Caribbean article PDF', caribbeanPdf, expected.caribbeanPdf);
verify('Caribbean source data', caribbeanData, expected.caribbeanData);
verify('Baltic archive README', balticReadme, expected.balticReadme);
verify('Baltic trend code', balticTrendCode, expected.balticTrendCode);
verify('Baltic trophic-guild code', balticTrophicCode, expected.balticTrophicCode);
assert.equal(caribbeanPdf.subarray(0, 5).toString('ascii'), '%PDF-');

const caribbeanHtml = caribbeanArticleHtml.toString('utf8');
const balticHtml = balticArticleHtml.toString('utf8');
const visibleText = html => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(?:nbsp|#x000a0);/gi, ' ')
  .replace(/&(?:ndash|#x02013);/gi, '–')
  .replace(/\s+/g, ' ');
const caribbeanText = visibleText(caribbeanHtml);
const balticText = visibleText(balticHtml);
const caribbeanArchive = JSON.parse(caribbeanArchiveResponse.toString('utf8'));
const balticArchive = JSON.parse(balticArchiveResponse.toString('utf8'));
assert.match(caribbeanText, /modern food chains are 60–70% shorter/i);
assert.match(caribbeanText, /20–70% lower trophic range/i);
assert.match(caribbeanText, /majority of .*dates between 1926 to 2014 CE/i);
assert.match(balticText, /ecosystem reorganization in all sub-basins/i);
assert.match(balticText, /altered food web regimes have remained despite reductions in the pressures/i);
assert.match(balticText, /Western Baltic Sea \(WB\) 1997–2023/i);
assert.equal(caribbeanArchive.version, 4);
assert.equal(caribbeanArchive.files.find(file => file.id === 61110337)?.computed_md5, expected.caribbeanData.md5);
assert.equal(balticArchive.id, 20321614);
assert.equal(balticArchive.doi, '10.5281/zenodo.20321614');
assert.equal(balticArchive.files.length, 22);
assert.equal(balticArchive.files.reduce((total, file) => total + file.size, 0), 518_509);

const balticPeriods = {
  westernBaltic: { start: 1997, end: 2023 },
  centralBaltic: { start: 1979, end: 2021 },
  gulfOfGdansk: { start: 1995, end: 2022 },
  gulfOfRiga: { start: 1976, end: 2022 },
  gulfOfFinland: { start: 1979, end: 2021 },
  bothnianSea: { start: 1979, end: 2022 },
  bothnianBay: { start: 1986, end: 2021 },
};

const snapshot = {
  version: 'tulip_marine_food_web_reorganization_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'direct_ecosystem_reorganization_evidence_separated_from_human_exposure',
  productionRatingsEnabled: 0,
  purpose: 'Replace a generic threatened-species share and reef-dependent population count with direct food-web structure evidence, while keeping regional coverage, human exposure and downstream fisheries outcomes outside terminal harm.',
  sources: {
    caribbeanArticle: { ...sources.caribbeanArticle, checkedOn, fetchedPdf: expected.caribbeanPdf },
    caribbeanArchive: { ...sources.caribbeanArchive, checkedOn, archiveVersion: caribbeanArchive.version, sourceDataFile: expected.caribbeanData },
    balticArticle: { ...sources.balticArticle, checkedOn },
    balticArchive: {
      ...sources.balticArchive,
      checkedOn,
      recordRevision: balticArchive.revision,
      files: balticArchive.files.length,
      totalUncompressedBytes: balticArchive.files.reduce((total, file) => total + file.size, 0),
      pinnedFiles: { readme: expected.balticReadme, trendCode: expected.balticTrendCode, trophicCode: expected.balticTrophicCode },
    },
  },
  currentWindow: {
    start: 1976,
    end: 2023,
    coverageStatus: 'partial',
    summaryMethod: 'period_prevalence',
    coverageNote: 'The Baltic analysis provides continuous but differently bounded monitoring records for seven sub-basins. The Caribbean reconstruction compares prehistoric reefs with modern deposits whose majority radiocarbon dates span 1926–2014. Neither source measures the global share of marine food webs reorganized.',
  },
  endpoints: {
    caribbeanReefTrophicStructure: {
      regions: ['Bocas del Toro, Panama', 'Enriquillo Basin, Dominican Republic'],
      modernSampleMajorityCalendarRange: { start: 1926, end: 2014 },
      prehistoricComparisonApproximateYearsBeforePresent: 7_000,
      sourceReportedModernFoodChainShorteningPercentRange: { lower: 60, upper: 70 },
      sourceReportedLowerTrophicRangePercentRange: { lower: 20, upper: 70 },
      unweightedFoodChainLengthShorteningPercentApproximate: 40,
      abundanceWeightedDistributionInterquartileRangeReductionPercent: { panama: 53, dominicanRepublic: 60 },
      interpretation: 'The isotope reconstruction directly establishes substantial simplification in two Caribbean reef regions. These percentages describe trophic structure relative to prehistoric reefs; they are not percentages of the global ocean collapsed.',
    },
    balticFoodWebStatus: {
      subBasins: 7,
      monitoringPeriods: balticPeriods,
      yearsOfHarmonizedDataRange: { lower: 26, upper: 46 },
      sourceReportedStatus: 'poor_food_web_status_across_all_assessed_sub_basins',
      persistenceFinding: 'Some altered food-web regimes remained after reductions in pressures that contributed to the initial shift.',
      attributionFinding: 'Multiple pressures were associated with reorganization; warming contributed in several sub-basins and sometimes amplified other pressures.',
      interpretation: 'The Baltic record establishes long-running regional reorganization and persistence. It does not isolate climate as the sole cause or provide a global affected-distribution denominator.',
    },
    globalReach: {
      compatibleShareOfMarineEcosystemDistributionAffectedPercent: null,
      interpretation: 'Two Caribbean reef regions and seven Baltic sub-basins demonstrate occurrence and regional persistence, but cannot be extrapolated to a global marine-food-web share.',
    },
    humanConsequences: {
      compatibleUniqueHarmedPersonCount: null,
      compatibleTerminalHealthOrServiceLoss: null,
      interpretation: 'People living near or depending on reefs are exposure and dependence context. The admitted sources do not quantify unique people suffering a terminal health, food, livelihood or essential-service consequence from food-web reorganization.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the Caribbean isotope reconstruction as direct regional ecosystem-condition evidence for trophic simplification.',
      'Use the seven-sub-basin Baltic analysis as direct regional evidence of food-web reorganization and multi-decade persistence.',
      'Use the source archives to reproduce the underlying measurements and analysis paths.',
      'Retain geographic transfer, collapse-scale conversion, recovery time and multi-pressure attribution in the uncertainty range and confidence.',
    ],
    prohibited: [
      'Do not treat the approximately one billion people near or relying on reefs as people harmed.',
      'Do not treat the 25% of marine species associated with reefs, the number of sub-basins, the number of samples or the length of the records as harm reach.',
      'Do not map a 20–70% trophic-range reduction directly to a 20–70% global movement toward ecosystem collapse.',
      'Do not attribute all Baltic reorganization to climate warming; fishing, nutrient loading, hypoxia, contaminants and other pressures remain active.',
      'Do not add downstream fishery, food-security, carbon, recreation or economic effects already represented by other nodes.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'marine_food_web_simplification',
      rating: 'C 5.5',
      uncertainty: 'B 4.0 to D 7.0',
      confidence: 'C',
      domains: ['ecosystem'],
      axes: {
        lower: { severity: 1, reach: 1, persistence: 2 },
        central: { severity: 2, reach: 1, persistence: 3 },
        upper: { severity: 3, reach: 2, persistence: 3 },
      },
      reason: 'Direct evidence supports material ecosystem reorganization and long-lived regional regimes, but the affected share of global marine food webs, a collapse-calibrated severity conversion and a direct human endpoint remain unavailable. Human dependence is therefore removed from the score rather than counted as harm.',
    },
  },
  unresolvedForTulip: [
    'Build a global, ecosystem-type denominator for food-web condition rather than counting monitored sites or species.',
    'Calibrate trophic-range, food-chain-length and guild-balance changes against a documented functional-loss or collapse reference.',
    'Measure recovery time after pressure reduction across comparable marine systems.',
    'Separate climate-attributable reorganization from fishing, nutrients, hypoxia and other co-occurring pressures.',
    'Link food-web change to unique terminal human outcomes only where the causal chain and overlap exclusions are measured.',
  ],
};

snapshot.snapshotDigest = digest({ sources: snapshot.sources, currentWindow: snapshot.currentWindow, endpoints: snapshot.endpoints, tulipUse: snapshot.tulipUse, unresolvedForTulip: snapshot.unresolvedForTulip });
await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, recommendation: snapshot.tulipUse.currentCatalogueRecommendation, digest: snapshot.snapshotDigest }, null, 2));
