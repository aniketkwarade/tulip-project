import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'urban-tree-canopy-current-reference-snapshot.json');
const oldSnapshot = JSON.parse(await readFile(path.join(root, 'public', 'global-urban-tree-cover-impact-snapshot.json'), 'utf8'));
const laiAnalysisPath = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'urban-tree-lai-current-analysis.json');
const laiAnalysis = JSON.parse(await readFile(laiAnalysisPath, 'utf8'));
const analysisScriptPath = path.join(root, 'scripts', 'analyze-urban-tree-lai-current-reference.py');
const analysisScript = await readFile(analysisScriptPath);

const sha256 = value => createHash('sha256').update(value).digest('hex');
const execFileAsync = promisify(execFile);

async function fetchBuffer(url, maximumBytes = 8_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: {
      accept: '*/*',
      'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+urban-tree-canopy-evidence-ingestion)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

async function fetchBufferWithCurl(url, maximumBytes = 8_000_000) {
  // Nature's CDN serves an anti-bot HTML page to Node fetch for this stable
  // article URL while curl receives the published PDF. The fixed byte count and
  // SHA-256 below still make the ingestion fail closed if that response changes.
  const { stdout } = await execFileAsync(
    'curl',
    ['-L', '--fail', '--silent', '--show-error', url],
    { encoding: 'buffer', maxBuffer: maximumBytes },
  );
  const body = Buffer.from(stdout);
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

const crossref = async doi => JSON.parse(await fetchBuffer(`https://api.crossref.org/works/${doi}?mailto=research%40tulip.earth`, 1_000_000)).message;

const sources = {
  globalCanopyChange2020: {
    id: 'nowak_greenfield_global_urban_tree_cover_change_2020',
    title: 'The increase of impervious cover and decrease of tree cover within urban areas globally (2012–2017)',
    publisher: 'USDA Forest Service; Urban Forestry & Urban Greening',
    publicationDate: '2020-03-01',
    url: 'https://research.fs.usda.gov/treesearch/59488',
    pdfUrl: 'https://research.fs.usda.gov/download/treesearch/59488.pdf',
    pdfSha256: 'a7058a7cd401166b844756d2857e732bba297372e819be611c1c14793a169d5b',
  },
  globalUrbanTreeLai2025: {
    id: 'dong_global_urban_tree_lai_2025',
    title: 'A global urban tree leaf area index dataset for urban climate modeling',
    publisher: 'Scientific Data',
    publicationDate: '2025-03-13',
    url: 'https://doi.org/10.1038/s41597-025-04729-y',
    doi: '10.1038/s41597-025-04729-y',
  },
  globalUrbanTreeLaiData2025: {
    id: 'dong_global_urban_tree_lai_zenodo_2025',
    title: 'Global urban tree LAI/SAI dataset for urban climate modeling',
    publisher: 'Zenodo',
    publicationDate: '2025-01-16',
    url: 'https://doi.org/10.5281/zenodo.14709655',
    recordUrl: 'https://zenodo.org/api/records/14709655',
    file: {
      name: 'global_0.5.tar.gz',
      bytes: 51_370_376,
      md5: 'e85a098e09eedb86ebd9cce949dd3cd6',
    },
  },
  tokyoCanopyChange2024: {
    id: 'shiraishi_tokyo_urban_tree_canopy_change_2024',
    title: 'Tokyo’s urban tree challenge: Decline in tree canopy cover in Tokyo from 2013 to 2022',
    publisher: 'Urban Forestry & Urban Greening',
    publicationDate: '2024-07-01',
    url: 'https://doi.org/10.1016/j.ufug.2024.128331',
    doi: '10.1016/j.ufug.2024.128331',
    articleApiUrl: 'https://api.elsevier.com/content/article/doi/10.1016/j.ufug.2024.128331?httpAccept=text%2Fxml',
  },
  globalCooling2026: {
    id: 'mcdonald_global_urban_tree_cooling_2026',
    title: 'Trees halve urban heat island effect globally but unequal benefits only modestly mitigate climate-change warming',
    publisher: 'Nature Communications',
    publicationDate: '2026-05-06',
    url: 'https://doi.org/10.1038/s41467-026-71825-x',
    articleUrl: 'https://www.nature.com/articles/s41467-026-71825-x',
    pdfUrl: 'https://www.nature.com/articles/s41467-026-71825-x.pdf',
    pdfFile: {
      bytes: 2_132_914,
      sha256: 'e1b07e6793e1ed96eb7524c591fab137adf2f1ee977c001624eb97f56834f6aa',
    },
    doi: '10.1038/s41467-026-71825-x',
  },
};

const [globalPdf, laiCrossref, zenodo, tokyoCrossref, coolingCrossref, coolingPdf] = await Promise.all([
  fetchBuffer(sources.globalCanopyChange2020.pdfUrl),
  crossref(sources.globalUrbanTreeLai2025.doi),
  fetchBuffer(sources.globalUrbanTreeLaiData2025.recordUrl, 2_000_000).then(value => JSON.parse(value)),
  crossref(sources.tokyoCanopyChange2024.doi),
  crossref(sources.globalCooling2026.doi),
  fetchBufferWithCurl(sources.globalCooling2026.pdfUrl, 5_000_000),
]);

assert.equal(sha256(globalPdf), sources.globalCanopyChange2020.pdfSha256);
assert.equal(laiCrossref.title[0], sources.globalUrbanTreeLai2025.title);
assert.equal(tokyoCrossref.title[0], sources.tokyoCanopyChange2024.title);
assert.equal(coolingCrossref.title[0], sources.globalCooling2026.title);
const zenodoFile = zenodo.files.find(file => file.key === sources.globalUrbanTreeLaiData2025.file.name);
assert(zenodoFile, 'Zenodo 0.5-degree archive missing');
assert.equal(zenodoFile.size, sources.globalUrbanTreeLaiData2025.file.bytes);
assert.equal(zenodoFile.checksum, `md5:${sources.globalUrbanTreeLaiData2025.file.md5}`);
assert.equal(laiAnalysis.archive.bytes, zenodoFile.size);
assert.equal(laiAnalysis.archive.md5, sources.globalUrbanTreeLaiData2025.file.md5);
assert.equal(laiAnalysis.grid.annualFiles, 23);
assert.equal(laiAnalysis.grid.commonValidGridCells, 22_323);
assert.equal(laiAnalysis.periodDiagnostics.fullRecord.weightedMeanChangePercent, 12.184);
assert.equal(laiAnalysis.periodDiagnostics.sinceDirectCanopyStudyEnd.weightedMeanChangePercent, -2.204);
assert.equal(laiAnalysis.periodDiagnostics.sinceDirectCanopyStudyEnd.areaWeightedCommonGridShareWithLowerEndStatePercent, 68.32);

assert.equal(coolingPdf.length, sources.globalCooling2026.pdfFile.bytes);
assert.equal(sha256(coolingPdf), sources.globalCooling2026.pdfFile.sha256);
assert.equal(coolingPdf.subarray(0, 5).toString(), '%PDF-');

const oldGlobal = oldSnapshot.assessment.global_cover_change;
const persistence = oldSnapshot.assessment.persistence_context;
assert.equal(oldGlobal.urban_tree_cover_start_pct, 26.7);
assert.equal(oldGlobal.urban_tree_cover_end_pct, 26.5);
assert.equal(persistence.tree_cover_loss_converted_to_impervious_pct, 32);

const payload = {
  version: 'tulip_urban_tree_canopy_current_reference_2026_09_24_v1',
  generatedOn: '2026-09-24',
  status: 'direct_canopy_change_current_leaf_area_regional_contrast_and_cooling_boundary_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a wholly structured urban-canopy rating with direct global net-change evidence, a reproducible 2000–2022 leaf-area diagnostic, a recent regional loss case and a global human-benefit boundary without converting model coverage or beneficiaries into terminal harm.',
  appliesToNodeIds: ['urban_tree_canopy_loss'],
  sources,
  evidence: {
    directGlobalCanopyChange: {
      observationPeriod: { approximateStart: oldGlobal.approximate_start_year, end: oldGlobal.end_year },
      pairedSamplePoints: oldGlobal.paired_sample_points,
      canopyCoverPercent: { start: oldGlobal.urban_tree_cover_start_pct, end: oldGlobal.urban_tree_cover_end_pct },
      netChangePercentagePoints: oldGlobal.net_change_percentage_points,
      relativeNetChangePercent: Number(((oldGlobal.urban_tree_cover_end_pct / oldGlobal.urban_tree_cover_start_pct - 1) * 100).toFixed(3)),
      annualNetLossHectaresApproximate: oldGlobal.annual_tree_cover_loss_hectares,
      continentsWithNetLoss: oldSnapshot.assessment.global_extent.continents_with_net_tree_cover_loss,
      boundary: 'The result is a small global net stock change inside a fixed urban boundary. It does not reveal gross tree removal, local condition loss, the affected share of current global urban-tree distribution or terminal human harm.',
    },
    persistenceContext: {
      lostCanopyConvertedToImperviousPercent: persistence.tree_cover_loss_converted_to_impervious_pct,
      boundary: 'This transition describes the fate and likely long persistence of part of the lost canopy. It does not make the remaining urban forest 32% degraded and does not prove that every lost patch is irreversible.',
    },
    currentLeafAreaDiagnostic: {
      analysisVersion: laiAnalysis.version,
      analysisScriptSha256: sha256(analysisScript),
      analysisOutputSha256: sha256(await readFile(laiAnalysisPath)),
      grid: laiAnalysis.grid,
      fullRecord: laiAnalysis.periodDiagnostics.fullRecord,
      since2017: laiAnalysis.periodDiagnostics.sinceDirectCanopyStudyEnd,
      boundary: laiAnalysis.method.boundary,
      interpretationBoundary: laiAnalysis.interpretationBoundary,
    },
    recentRegionalContrast: {
      geography: 'Tokyo 23 wards, Japan',
      observationPeriod: { start: 2013, end: 2022 },
      canopyCoverPercent: { start: 9.2, end: 7.3 },
      absoluteChangePercentagePoints: -1.9,
      relativeChangePercent: Number(((7.3 / 9.2 - 1) * 100).toFixed(3)),
      boundary: 'Tokyo establishes that recent local loss can be material. It is not a global severity or reach denominator.',
    },
    humanBenefitBoundary: {
      functionalUrbanAreas: 8_919,
      currentPopulationWeightedTreeCoverPercent: 18.3,
      completeLossCounterfactualUrbanAirTemperatureIncreaseC: { estimate: 0.151, standardError: 0.003 },
      peopleReceivingAtLeastQuarterDegreeCoolingMillions: { estimate: 914, lower95: 805, upper95: 1_040 },
      boundary: 'These are current benefits and a hypothetical complete-canopy-loss counterfactual. They do not measure harm caused by the small observed current canopy-loss flow, and they stay outside the human axes to avoid duplicating urban heat and heat-mortality nodes.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate: {
      prior: { value: 5.5, grade: 'C', lower: 3.3, upper: 7.8, confidence: 'C' },
      revised: { value: 4.8, grade: 'C', lower: 2.5, upper: 7.0, confidence: 'C' },
    },
    axes: {
      ecosystem: {
        severity: { lower: 0, central: 1, upper: 2 },
        reach: { lower: 0, central: 1, upper: 2 },
        persistence: { lower: 2, central: 3, upper: 4 },
      },
    },
    excludedUses: [
      'Do not treat modeled LAI grid coverage, common grid-cell share or latitude weighting as the affected share of global urban-tree area.',
      'Do not treat the 32% impervious-transition share as 32% condition loss across the remaining urban forest.',
      'Do not apply Tokyo’s local relative canopy decline to the world.',
      'Do not count 914 million people receiving existing cooling as people harmed by current canopy loss.',
      'Do not scale the hypothetical complete-canopy-loss temperature counterfactual linearly to the observed net loss without a validated model.',
      'Do not add Urban Heat Island, Nocturnal Heat Stress, heat-mortality, stormwater or air-pollution scores to this rating.',
    ],
    exactRemainingGaps: [
      'A globally consistent urban canopy-cover change product extending beyond 2017 with gross loss, gain and a stable urban boundary.',
      'A defined urban-ecosystem condition reference that converts local canopy removal into movement toward functional collapse without using the node name as evidence.',
      'The affected share of the current global urban-tree distribution rather than continents, cities, model cells or people receiving benefits.',
      'A representative recovery-time distribution separated by conversion to impervious cover, removal with replanting, mortality and temporary leaf-area decline.',
      'A current loss-specific human endpoint model that separates canopy loss from existing tree benefits and avoids overlap with heat and air-pollution nodes.',
    ],
  },
};

payload.snapshotDigest = sha256(JSON.stringify(payload));
await writeFile(out, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ output: out, snapshotDigest: payload.snapshotDigest }, null, 2));
