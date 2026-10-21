import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'ice-albedo-feedback-reference-snapshot.json');
const checkedOn = '2026-09-24';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+ice-albedo-feedback-evidence-ingestion)';

const sources = {
  noaaSnow: {
    id: 'noaa_arctic_report_card_terrestrial_snow_2025',
    publisher: 'US National Oceanic and Atmospheric Administration',
    title: 'Arctic Report Card 2025: Terrestrial Snow Cover',
    publicationDate: '2025-12-04',
    doi: 'https://doi.org/10.25923/cfhv-c239',
    articleUrl: 'https://arctic.noaa.gov/report-card/report-card-2025/terrestrial-snow-cover-2025/',
    reportUrl: 'https://arctic.noaa.gov/wp-content/uploads/2025/12/ArcticReportCard_full_report2025.pdf',
  },
  noaaSeaIce: {
    id: 'noaa_arctic_report_card_sea_ice_2025',
    publisher: 'US National Oceanic and Atmospheric Administration',
    title: 'Arctic Report Card 2025: Sea Ice',
    publicationDate: '2025-12-10',
    doi: 'https://doi.org/10.25923/mmxf-0r86',
    articleUrl: 'https://arctic.noaa.gov/report-card/report-card-2025/sea-ice-2025/',
  },
  ipccFeedback: {
    id: 'ipcc_ar6_wgi_surface_albedo_feedback_2021',
    publisher: 'Intergovernmental Panel on Climate Change',
    title: "AR6 WGI Chapter 7: The Earth's Energy Budget, Climate Feedbacks, and Climate Sensitivity",
    publicationDate: '2021',
    doi: 'https://doi.org/10.1017/9781009157896.009',
    articleUrl: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
  },
};

const expected = {
  noaaPdf: { bytes: 10_281_560, sha256: 'f095a6929eea4ef64f134ab1c890b543fc4a3be72b67b971fbbb26c6fef6d4cf' },
  snowMechanismAndEffects: { bytes: 788, sha256: '67236c485e61aedd0d832207f15bb0db7ba0ec528322df7aba55b316e1197968' },
  snowTrend: { bytes: 1_142, sha256: '19529e4f1d590e4af7d16eea33a34c5f98e6082221532d41c41fd4dbc6074f23' },
  seaIcePeopleAndEcosystems: { bytes: 902, sha256: '762a3e0dc2d3916eedfaa1e8c00862bb275810aa136d02fd10e772aab574d02a' },
  seaIceCurrentState: { bytes: 429, sha256: 'a3b5bc6af865805697a2019fe36f1b15a5cb0663a012d70fa9efdf4c2a192fa4' },
  seaIceFeedbackMechanism: { bytes: 838, sha256: '070dfbfba821eaf89e36a171344caeb176a55071c3ad3bce7f742afbe32b7203' },
  ipccMechanism: { bytes: 1_417, sha256: 'e2e2417ccb990f37c46a62a1a104dc092022e67fb07696d24c15815ca929c1e0' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url, maximumBytes = 20_000_000) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: maximumBytes, timeout: 190_000 });
  return stdout;
}

const visibleText = value => value
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&ndash;/gi, '–')
  .replace(/&mdash;/gi, '—')
  .replace(/&deg;/gi, '°')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&apos;/gi, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
  .replace(/\s+/g, ' ')
  .trim();

function paragraphContaining(buffer, needle) {
  const paragraphs = [...buffer.toString('utf8').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => visibleText(match[1]));
  const paragraph = paragraphs.find(value => value.toLowerCase().includes(needle.toLowerCase()));
  assert(paragraph, `Official source paragraph is missing: ${needle}`);
  return paragraph;
}

function verify(label, value, pinned) {
  assert.equal(Buffer.byteLength(value), pinned.bytes, `${label} byte count changed`);
  assert.equal(sha256(value), pinned.sha256, `${label} checksum changed`);
}

const [snowPage, seaIcePage, ipccPage, noaaPdf] = await Promise.all([
  fetchBuffer(sources.noaaSnow.articleUrl, 2_000_000),
  fetchBuffer(sources.noaaSeaIce.articleUrl, 2_000_000),
  fetchBuffer(sources.ipccFeedback.articleUrl, 8_000_000),
  fetchBuffer(sources.noaaSnow.reportUrl),
]);
assert.equal(noaaPdf.subarray(0, 5).toString('ascii'), '%PDF-');
verify('NOAA Arctic Report Card PDF', noaaPdf, expected.noaaPdf);

const claims = {
  snowMechanismAndEffects: paragraphContaining(snowPage, 'Loss of snow cover also contributes to amplified Arctic warming'),
  snowTrend: paragraphContaining(snowPage, 'For the Arctic as a whole, May SCE has declined'),
  seaIcePeopleAndEcosystems: paragraphContaining(seaIcePage, 'Changes in sea ice extent and seasonality have already impacted'),
  seaIceCurrentState: paragraphContaining(seaIcePage, 'The Arctic sea ice environment has substantially changed'),
  seaIceFeedbackMechanism: paragraphContaining(seaIcePage, 'Following melt onset, more advanced stages of surface melt'),
  ipccMechanism: paragraphContaining(ipccPage, 'Temperature change induces surface-albedo change'),
};
for (const [key, value] of Object.entries(claims)) verify(key, value, expected[key]);

const snapshot = {
  version: 'tulip_ice_albedo_feedback_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_physical_feedback_and_bounded_consequences_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace harmed-population and ecosystem-collapse proxies with current snow, sea-ice and feedback evidence, while keeping the physical feedback separate from terminal human and ecosystem harm.',
  sources: {
    noaaSnow: { ...sources.noaaSnow, checkedOn, reportPdf: expected.noaaPdf },
    noaaSeaIce: { ...sources.noaaSeaIce, checkedOn },
    ipccFeedback: { ...sources.ipccFeedback, checkedOn },
  },
  currentWindow: {
    start: 2005,
    end: 2025,
    coverageStatus: 'complete',
    summaryMethod: 'end_state_stock',
    referenceNormal: { start: 1991, end: 2020 },
    coverageNote: 'NOAA reports complete 2025 snow and sea-ice observations against the 1991–2020 normal and longer records beginning in 1967 or 1979. The 2005–2025 comparison describes the current physical state; it is not accumulated harm.',
  },
  endpoints: {
    physicalState: {
      arcticLandSnow: {
        recordStartYear: 1967,
        latestYear: 2025,
        mayExtentDeclinePercentSince1967: 15,
        juneExtentDeclinePercentSince1967: 50,
        juneExtentTrendPercentPerDecade: -8.7,
        recentMeltTimingWeeksEarlierThan1967To1981: { lower: 1, upper: 2, recentPeriod: '2010–2024' },
      },
      arcticSeaIce: {
        recordStartYear: 1979,
        latestYear: 2025,
        endOfSummerExtentDeclinePercentSince2005: 28,
        oldIceAreaKm2AtSeptemberMinimum: 95_000,
        oldIceDeclinePercentVersus1985To2004Mean: 95,
        meltOnsetTrendDaysEarlierPerDecade: 4.1,
      },
      feedbackMechanism: 'Less reflective snow or ice and more melt ponds or open surface increase absorbed solar energy. IPCC assesses sea-ice extent and seasonal snow cover as the largest present multi-decadal surface-albedo feedback contributions.',
      interpretation: 'Snow-cover decline, sea-ice decline, earlier melt and the feedback mechanism establish a strong physical change. Their percentages, ranks, record lengths and Arctic footprint are not terminal-harm severity, reach or persistence.',
    },
    assessedHumanConsequences: {
      findings: ['effects on people relying on Arctic ocean resources', 'changes to Indigenous life and culture', 'safety and security concerns as marine access changes'],
      compatibleUniqueHarmedPersonCount: null,
      feedbackOnlyAttributableShare: null,
      interpretation: 'NOAA documents material consequences associated with changing sea ice. It does not isolate the share caused by the extra warming from the albedo feedback or count unique people materially harmed by that share.',
    },
    assessedEcosystemConsequences: {
      findings: ['loss or alteration of sea-ice habitat', 'changes to snow-insulated habitat', 'changes in water timing, vegetation timing, ground temperature and fire risk'],
      compatibleMovementTowardCollapsePercent: null,
      compatibleAffectedDistributionPercent: null,
      feedbackOnlyAttributableShare: null,
      interpretation: 'NOAA establishes ecological effects associated with snow and sea-ice change. It does not translate physical snow or ice loss into ecosystem collapse, nor isolate the feedback-only share from warming and other drivers.',
    },
  },
  tulipUse: {
    admitted: [
      'Use NOAA to establish the current snow and sea-ice state against declared records and the 1991–2020 climate normal.',
      'Use IPCC and NOAA to establish the surface-albedo mechanism and that the pathway has human and ecosystem consequences.',
      'Use the missing feedback-only attribution, harmed-person count, ecosystem-condition conversion and affected-distribution denominator to bound the axes and confidence.',
    ],
    prohibited: [
      'Do not treat 700 million people exposed to broader cryosphere change as people harmed by the ice–albedo feedback.',
      'Do not treat 13.4%, 15%, 28%, 50% or 95% physical snow or ice changes as ecosystem collapse or harmed-ecosystem reach.',
      'Do not convert the Arctic footprint, source coverage, record rank or observation length into harm reach, severity or persistence.',
      'Do not add scores or consequences from Arctic Amplification, Sea Ice Season Loss, Permafrost Thaw, Wildfire, Migration or other downstream nodes.',
      'Do not attribute all snow- and sea-ice-related impacts to the albedo feedback; greenhouse forcing, ocean heat, weather, clouds, aerosols, soot, local exposure and adaptation remain active.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'ice_albedo_feedback_loops',
      rating: 'C 5.1',
      uncertainty: 'B 4.0 to D 7.4',
      confidence: 'C',
      domains: ['human', 'ecosystem'],
      axes: {
        human: {
          lower: { severity: 1, reach: 1, persistence: 1 },
          central: { severity: 1, reach: 1, persistence: 2 },
          upper: { severity: 2, reach: 2, persistence: 3 },
        },
        ecosystem: {
          lower: { severity: 1, reach: 2, persistence: 2 },
          central: { severity: 2, reach: 2, persistence: 3 },
          upper: { severity: 3, reach: 3, persistence: 4 },
        },
      },
      reason: 'The feedback is directly established and the associated snow and sea-ice changes have material Arctic consequences. The former D rating overstated human reach and treated physical change as ecological harm. C is the structured central case; the B–D range records the unresolved feedback-only share rather than hiding it.',
    },
  },
  unresolvedForTulip: [
    'Estimate terminal consequences under a matched climate counterfactual that holds snow and ice reflectivity at a reference state while preserving other warming drivers.',
    'Measure unique people materially harmed by the incremental albedo-feedback contribution rather than people exposed to broader cryosphere change.',
    'Convert observed snow and sea-ice change into calibrated ecosystem-condition loss and affected-distribution denominators.',
    'Separate feedback-attributable consequences from greenhouse forcing, ocean heat, soot, clouds, weather variability and local vulnerability.',
    'Avoid summing consequences already represented by Arctic amplification, sea ice, permafrost, wildfire, hydrology, migration and infrastructure nodes.',
  ],
};

snapshot.snapshotDigest = digest({ sources: snapshot.sources, currentWindow: snapshot.currentWindow, endpoints: snapshot.endpoints, tulipUse: snapshot.tulipUse, unresolvedForTulip: snapshot.unresolvedForTulip });
await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, recommendation: snapshot.tulipUse.currentCatalogueRecommendation, digest: snapshot.snapshotDigest }, null, 2));
