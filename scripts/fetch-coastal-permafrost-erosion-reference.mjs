import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'coastal-permafrost-erosion-reference-snapshot.json');
const rawDir = process.env.TULIP_COASTAL_PERMAFROST_RAW_DIR;
const checkedOn = '2026-09-24';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(Buffer.from(JSON.stringify(value)));

const sources = {
  gaoHighRisk2025: {
    id: 'gao_high_risk_newtok_relocation_2025',
    title: 'High-Risk Series: Heightened Attention to High-Risk Areas Could Yield Billions in Savings and a More Efficient and Effective Government',
    publisher: 'U.S. Government Accountability Office',
    publicationDate: '2025-02-25',
    url: 'https://files.gao.gov/reports/GAO-25-107743/index.html',
    file: {
      rawName: 'GAO-25-107743.html',
      bytes: 1_477_048,
      sha256: '6847187f1ff76ecafb446a0b6a27963e12b0b86c4a7deca665d575bc919d39a3',
    },
  },
  alaskaUnmetNeeds2024: {
    id: 'anthc_unmet_needs_newtok_2024',
    title: 'The Unmet Needs of Environmentally Threatened Alaska Native Villages: Assessment and Recommendations',
    publisher: 'Alaska Native Tribal Health Consortium and State of Alaska Division of Community and Regional Affairs',
    publicationDate: '2024-01-22',
    url: 'https://anthc.org/wp-content/uploads/2025/04/Unmet_Needs_Report_22JAN24-1.pdf',
    file: {
      rawName: 'Unmet_Needs_Report_22JAN24-1.pdf',
      bytes: 7_150_026,
      sha256: '537d289275b7a0b8fdb9d9c23db55655dd39582daf84478ad84509756dd2d6e1',
    },
  },
  yukonKuskokwimCompoundStudy2025: {
    id: 'jorgenson_yukon_kuskokwim_delta_compound_change_2025',
    title: 'Interacting Sea‐Level Rise, Sea‐Ice Loss, Storm Flooding, Erosion, and Permafrost Thaw Threaten Ecosystems, Wildlife, and Communities on the Yukon‐Kuskokwim Delta',
    publisher: "Earth's Future",
    publicationDate: '2025-08-11',
    articleUrl: 'https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2025EF006015',
    doi: 'https://doi.org/10.1029/2025EF006015',
    crossrefUrl: 'https://api.crossref.org/works/10.1029/2025EF006015?mailto=research%40tulip.earth',
  },
};

async function fetchBuffer(url, maximumBytes = 10_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: {
      accept: '*/*',
      'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+coastal-permafrost-evidence-ingestion)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength)) assert(declaredLength <= maximumBytes, `${url} exceeds the download limit`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

async function loadPinned(source, label) {
  const body = rawDir
    ? await readFile(path.join(rawDir, source.file.rawName))
    : await fetchBuffer(source.url);
  assert.equal(body.length, source.file.bytes, `${label}: byte size changed`);
  assert.equal(sha256(body), source.file.sha256, `${label}: checksum changed`);
  return body;
}

const [gaoHtml, alaskaPdf, crossrefBody] = await Promise.all([
  loadPinned(sources.gaoHighRisk2025, 'GAO 2025 High-Risk report'),
  loadPinned(sources.alaskaUnmetNeeds2024, 'Alaska Native village unmet-needs report'),
  fetchBuffer(sources.yukonKuskokwimCompoundStudy2025.crossrefUrl, 2_000_000),
]);

const gaoText = gaoHtml.toString('utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
assert.match(gaoText, /in the fall of 2024, Newtok, Alaska became one of the first Alaska Native villages to fully relocate its population to a new site because of climate change/i);
assert.match(gaoText, /work remains to complete important infrastructure and permanent housing/i);
assert.match(gaoText, /It took over 30 years to begin relocating Newtok/i);
assert.equal(alaskaPdf.subarray(0, 5).toString(), '%PDF-');

const crossref = JSON.parse(crossrefBody).message;
assert.equal(crossref.title[0], sources.yukonKuskokwimCompoundStudy2025.title);
assert.deepEqual(crossref.issued['date-parts'][0].slice(0, 2), [2025, 8]);
assert.equal(crossref['container-title'][0], sources.yukonKuskokwimCompoundStudy2025.publisher);

const snapshot = {
  version: 'tulip_coastal_permafrost_erosion_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_human_terminal_consequence_and_compound_ecosystem_boundary_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Refresh the Coastal Permafrost Erosion assessment with a completed community relocation while keeping compound coastal drivers, future projections, exposed populations and physical study coverage out of current harm axes unless a source supplies a compatible consequence denominator.',
  sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => [key, {
    id: source.id,
    title: source.title,
    publisher: source.publisher,
    publicationDate: source.publicationDate,
    url: source.doi ?? source.url ?? source.articleUrl,
    ...(source.articleUrl ? { articleUrl: source.articleUrl } : {}),
    ...(source.file ? { fetchedFile: { bytes: source.file.bytes, sha256: source.file.sha256 } } : {}),
  }])),
  evidence: {
    newtokRelocation: {
      observedPeriod: { start: 2024, end: 2024 },
      geography: 'Newtok and Mertarvik, Alaska',
      observedConsequence: 'GAO reports that Newtok fully relocated its population to a new site in fall 2024 because of climate change.',
      remainingConsequence: 'Important infrastructure and permanent housing remained incomplete when GAO reported the completed population move.',
      planningContextYears: 'more_than_30',
      populationScaleEvidence: 'The 2024 Alaska report describes about 120 residents as one-third of the population in 2019, supporting a community total well below 10,000 without treating every resident of the wider region as harmed.',
      compatibleReachClassification: 'fewer_than_10000_people',
      endpointBoundary: 'A completed whole-community relocation is a direct terminal human consequence. The more-than-thirty-year planning process is governance context and is not scored as consequence duration.',
    },
    newtokMechanismAndLoss: {
      sourceReportPages: [30, 31],
      mechanism: 'The Alaska report describes usteq as catastrophic land collapse involving ice-rich permafrost, reduced sea ice, waves and thaw along the Ninglick River bank.',
      reportedLandLossFeetPerYearMaximum: 72,
      homesAtImmediateRiskAndDemolishedIn2019: 7,
      adaptationFinding: 'The report identifies relocation as the only viable adaptation strategy for the community site.',
      attributionBoundary: 'The realized consequence is compound. It cannot be assigned to coastal permafrost erosion alone or added again under flooding, sea-ice loss, permafrost thaw and storm nodes.',
    },
    yukonKuskokwimEcosystems: {
      sourcePublicationYear: 2025,
      historicalLandscapeComparisonApproximate: { start: 1953, end: 2015 },
      observedEcotypeAreaChangedPercent: 16,
      observedProcessSharesOfStudyAreaPercent: {
        permafrostDegradation: 5.3,
        channelErosion: 3,
        channelDeposition: 2.2,
        vegetationColonization: 2.3,
        lakeDrainage: 1.5,
      },
      severeCompoundThreatCommunities: { affected: 10, assessed: 18 },
      regionalContext: { highQualityBirdHabitatKm2: 67_000, yupikResidents: 30_000 },
      projectedOuterDeltaTransformationPercentBy2100: 70,
      compatibleCurrentErosionOnlyConditionLossPercent: null,
      compatibleCurrentErosionOnlyAffectedDistributionPercent: null,
      compatibleRecoveryTimeDistribution: null,
      endpointBoundary: 'The paper separates several observed landscape processes but describes present community threats and future ecosystem change as interacting effects of sea-level rise, sea-ice loss, storms, flooding, salinization, erosion and permafrost thaw. Its roughly 70% transformation estimate is a future compound projection, not current erosion-only harm.',
    },
  },
  ratingDecision: {
    change: 'range_narrowed_central_retained',
    candidate: {
      prior: { value: 7, grade: 'D', lower: 5.1, upper: 7.8, confidence: 'B' },
      revised: { value: 7, grade: 'D', lower: 5.9, upper: 7.4, confidence: 'B' },
    },
    axes: {
      human: {
        severity: { lower: 3, central: 3, upper: 3 },
        reach: { lower: 1, central: 1, upper: 1 },
        persistence: { lower: 4, central: 4, upper: 4 },
      },
      ecosystem: {
        severity: { lower: 1, central: 2, upper: 3 },
        reach: { lower: 1, central: 2, upper: 2 },
        persistence: { lower: 3, central: 4, upper: 4 },
      },
    },
    reason: 'The completed relocation fixes the bounded human consequence at severe whole-community displacement, local reach and permanent settlement loss. New ecosystem research improves process understanding but remains compound, regional and partly projected, so it does not justify a current erosion-only condition-loss or recovery point estimate.',
    excludedUses: [
      'Do not score the roughly 30,000 Yupik residents in the Yukon-Kuskokwim Delta as currently harmed; that number describes regional population and exposure context.',
      'Do not score 67,000 square kilometres of bird habitat as current condition loss; it describes habitat scope.',
      'Do not use the roughly 70% outer-delta transformation projected by 2100 as current harm or as erosion-only harm.',
      'Do not add flooding, sea-level rise, sea-ice loss, storms, salinization, thermokarst and permafrost-thaw consequences to this node a second time.',
      'Do not use the more-than-thirty-year relocation process as the duration of the human consequence.',
      'Do not treat the 2025 publication date as if every ecological observation extends through 2025.',
    ],
    exactRemainingGaps: [
      'A current ecosystem-condition estimate attributable specifically to coastal permafrost erosion rather than the compound coastal process.',
      'The affected share of the relevant global or regional coastal-permafrost ecosystem distribution.',
      'A recovery-time or irreversibility distribution for the affected ecosystems.',
    ],
  },
  fileVerification: {
    gaoHighRisk2025: sources.gaoHighRisk2025.file,
    alaskaUnmetNeeds2024: sources.alaskaUnmetNeeds2024.file,
    crossrefTitleVerified: true,
  },
};

snapshot.snapshotDigest = digest(snapshot);
await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ output, version: snapshot.version, snapshotDigest: snapshot.snapshotDigest, revisedCandidate: snapshot.ratingDecision.candidate.revised }, null, 2));
