import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'arctic-amplification-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+arctic-amplification-evidence-ingestion)';

const sources = {
  noaaReportCard: {
    id: 'noaa_arctic_report_card_surface_temperature_2025',
    publisher: 'US National Oceanic and Atmospheric Administration',
    title: 'Arctic Report Card 2025: Surface Air Temperature',
    publicationDate: '2025-12-23',
    doi: 'https://doi.org/10.25923/cj60-9s07',
    articleUrl: 'https://arctic.noaa.gov/report-card/report-card-2025/surface-air-temperature-2025/',
    reportUrl: 'https://arctic.noaa.gov/wp-content/uploads/2025/12/ArcticReportCard_full_report2025.pdf',
  },
  ipccPolarRegions: {
    id: 'ipcc_ar6_wgii_polar_regions_2022',
    publisher: 'Intergovernmental Panel on Climate Change',
    title: 'AR6 WGII Cross-Chapter Paper 6: Polar Regions',
    publicationDate: '2022',
    doi: 'https://doi.org/10.1017/9781009325844.023',
    articleUrl: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp6/',
  },
};

const expected = {
  noaaPdf: { bytes: 10_281_560, sha256: 'f095a6929eea4ef64f134ab1c890b543fc4a3be72b67b971fbbb26c6fef6d4cf' },
  noaaCurrentStateClaim: { bytes: 596, sha256: '0284018c55ab4719f9998b0ce6dd50f9f10d38ff1fad922fc53afb65e38430d7' },
  noaaTrendClaim: { bytes: 792, sha256: 'eb54702f27c23d54ea760a2e1fd76ddb9b96db915df7a68b3bad1731c08e6a06' },
  ipccEcosystemClaim: { bytes: 1_580, sha256: '7a90b90ec0b3872ddf22cee1eef63c79e93256a26d820db37d7f6f1d36a31392' },
  ipccHumanClaim: { bytes: 797, sha256: '48cd44ffb55eb925d6ca409e88e5c2eca0a723d52acd3bfcb1180a55172bdf91' },
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

const [noaaPage, noaaPdf, ipccPage] = await Promise.all([
  fetchBuffer(sources.noaaReportCard.articleUrl, 2_000_000),
  fetchBuffer(sources.noaaReportCard.reportUrl),
  fetchBuffer(sources.ipccPolarRegions.articleUrl, 2_000_000),
]);
assert.equal(noaaPdf.subarray(0, 5).toString('ascii'), '%PDF-');
verify('NOAA Arctic Report Card PDF', noaaPdf, expected.noaaPdf);

const claims = {
  noaaCurrentState: paragraphContaining(noaaPage, '1.60°C above the 1991-2020 mean'),
  noaaTrend: paragraphContaining(noaaPage, '0.77°C/decade versus 0.33°C/decade'),
  ipccEcosystem: paragraphContaining(ipccPage, 'potentially irreversible for hundreds of years'),
  ipccHuman: paragraphContaining(ipccPage, 'Climate change increasingly threatens many facets of Arctic livelihoods'),
};
verify('NOAA current-state claim', claims.noaaCurrentState, expected.noaaCurrentStateClaim);
verify('NOAA amplification-trend claim', claims.noaaTrend, expected.noaaTrendClaim);
verify('IPCC ecosystem-impact claim', claims.ipccEcosystem, expected.ipccEcosystemClaim);
verify('IPCC human-impact claim', claims.ipccHuman, expected.ipccHumanClaim);

const snapshot = {
  version: 'tulip_arctic_amplification_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_amplification_and_bounded_consequences_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace global graph reach and a tiny spatial-data fraction with direct Arctic temperature evidence and assessed human and ecosystem consequences, while preserving attribution and denominator limits.',
  sources: {
    noaaReportCard: { ...sources.noaaReportCard, checkedOn, reportPdf: expected.noaaPdf },
    ipccPolarRegions: { ...sources.ipccPolarRegions, checkedOn },
  },
  currentWindow: {
    start: 2006,
    end: 2025,
    coverageStatus: 'complete',
    summaryMethod: 'end_state_stock',
    referenceNormal: { start: 1991, end: 2020 },
    coverageNote: 'NOAA compares the complete October 2024–September 2025 Arctic water year with the 1991–2020 normal and reports Arctic-versus-global trends since 2006. The IPCC consequence synthesis predates the latest temperature year and is retained as an assessed impact boundary, not a 2025 harm census.',
  },
  endpoints: {
    physicalState: {
      domain: 'pan-Arctic land and ocean, 60–90°N',
      recordStartYear: 1900,
      latestWaterYear: 2025,
      latestAnnualAnomalyCelsiusAbove1991To2020: 1.60,
      consecutiveYearsArcticAnomalyAboveGlobalAverage: 12,
      warmestIndividualYearsOnRecord: { start: 2016, end: 2025, count: 10 },
      annualWarmingRateRelativeToGlobalSince1980Approximate: 'nearly three times faster',
      seasonalTrendsSince2006CelsiusPerDecade: {
        autumn: { arctic: 0.77, global: 0.33 },
        winter: { arctic: 0.87, global: 0.35 },
      },
      interpretation: 'These values establish the temperature state and amplification. They do not by themselves measure harmed people, ecosystem collapse, recovery time or impacts outside the Arctic.',
    },
    assessedHumanConsequences: {
      findings: ['livelihood and subsistence disruption', 'mental-health effects', 'injury and food-security risk', 'transportation and infrastructure effects', 'damage to cultural heritage in some Arctic regions'],
      compatibleUniqueHarmedPersonCount: null,
      amplificationOnlyAttributableShare: null,
      interpretation: 'NOAA and IPCC establish material Arctic consequences, but the evidence does not count unique people harmed specifically by the amplified portion of Arctic warming rather than global warming and its named downstream hazards.',
    },
    assessedEcosystemConsequences: {
      systems: ['marine', 'freshwater', 'terrestrial'],
      assessedStatus: 'substantial impacts with ongoing widespread cascades',
      assessedPersistence: 'some physical, ecological and societal elements potentially irreversible for hundreds of years to millennia',
      compatibleMovementTowardCollapsePercent: null,
      compatibleAffectedDistributionPercent: null,
      amplificationOnlyAttributableShare: null,
      interpretation: 'The assessment supports broad and long-lived Arctic ecological harm. It does not convert every downstream sea-ice, permafrost, fire, species or hydrologic change into an additive amplification loss.',
    },
  },
  tulipUse: {
    admitted: [
      'Use NOAA to establish the newest pan-Arctic temperature state, the WMO-aligned 1991–2020 reference normal and the observed Arctic-versus-global warming contrast.',
      'Use the IPCC assessment to support material human consequences and broad, persistent ecosystem consequences within the Arctic.',
      'Use the lack of a unique harmed-person count, ecosystem collapse conversion and amplification-only attribution share to bound the axes and confidence.',
    ],
    prohibited: [
      'Do not treat the pan-Arctic temperature map, all Arctic residents or lower-latitude societies influenced by Arctic processes as harmed reach.',
      'Do not reuse the previous 0.050603% spatial-data fraction as ecosystem reach.',
      'Do not convert degrees Celsius, an amplification ratio, record rank or observation length directly into severity or persistence.',
      'Do not add scores or consequences from Sea Ice Loss, Permafrost Thaw, Wildfire, Food Security, Migration, Infrastructure or related nodes.',
      'Do not attribute every assessed Arctic climate impact to amplification alone; global warming, local exposure, vulnerability, adaptation and non-climate pressures remain active.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'arctic_amplification_rates',
      rating: 'C 6.3',
      uncertainty: 'B 4.4 to D 7.8',
      confidence: 'C',
      domains: ['human', 'ecosystem'],
      axes: {
        human: {
          lower: { severity: 1, reach: 1, persistence: 1 },
          central: { severity: 2, reach: 1, persistence: 2 },
          upper: { severity: 2, reach: 2, persistence: 3 },
        },
        ecosystem: {
          lower: { severity: 1, reach: 2, persistence: 3 },
          central: { severity: 2, reach: 3, persistence: 4 },
          upper: { severity: 3, reach: 4, persistence: 4 },
        },
      },
      reason: 'The physical amplification is directly measured and assessed consequences are material, broad and long-lived in the Arctic. A C central rating remains appropriate, while the former global human-reach assumption and 0.050603% ecosystem proxy are removed. Missing amplification-only attribution and terminal denominators keep confidence at C and the range at B–D.',
    },
  },
  unresolvedForTulip: [
    'Estimate current terminal human consequences under a counterfactual in which the Arctic warmed only at the global rate.',
    'Measure unique people materially harmed rather than people exposed to or dependent on Arctic systems.',
    'Calibrate Arctic ecosystem condition against explicit functional-loss or collapse references and distribution denominators.',
    'Separate the amplified-warming contribution from global warming and co-occurring local pressures for each terminal endpoint.',
    'Avoid summing consequences already represented by sea ice, permafrost, wildfire, food, infrastructure and migration nodes.',
  ],
};

snapshot.snapshotDigest = digest({ sources: snapshot.sources, currentWindow: snapshot.currentWindow, endpoints: snapshot.endpoints, tulipUse: snapshot.tulipUse, unresolvedForTulip: snapshot.unresolvedForTulip });
await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, recommendation: snapshot.tulipUse.currentCatalogueRecommendation, digest: snapshot.snapshotDigest }, null, 2));
