import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'basin-treaty-breakdown-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+basin-treaty-breakdown-evidence-ingestion)';

const sources = {
  indicatorSnapshot: {
    id: 'unece_progress_on_transboundary_water_cooperation_sdg_6_5_2',
    publisher: 'United Nations Economic Commission for Europe, UNESCO and UN-Water',
    title: 'Progress on Transboundary Water Cooperation 2024',
    publicationDate: '2024-10-01',
    reportUrl: 'https://unece.org/info/publications/pub/395013',
    localSnapshot: 'public/unece-transboundary-water-cooperation-impact-snapshot.json',
  },
  officialSummary: {
    id: 'unesco_unece_transboundary_water_cooperation_2024_summary',
    publisher: 'UNESCO and United Nations Economic Commission for Europe',
    title: 'Global lag on water cooperation undermines resilience to worsening floods and droughts',
    publicationDate: '2024-10-01',
    url: 'https://www.unesco.org/en/articles/global-lag-water-cooperation-undermines-resilience-worsening-floods-and-droughts-unesco-unece-report',
  },
};

const expected = {
  indicatorSnapshot: { bytes: 2_881, sha256: 'f8c64aea514c8cdcb9d5462d9f998df5f5a5777c98b3d89fae6ddd49a76d4ebb' },
  coverageClaim: { bytes: 400, sha256: 'f9eda75893195e6a300d285b5c802fa8c8f94cc5c99453be373caf5714f5e8c8' },
  progressClaim: { bytes: 394, sha256: '71f055368a11053735df6a48a3e56af04668a599663a22958a08f53e8aa4fa7e' },
  climateReadinessClaim: { bytes: 636, sha256: 'f3544dee6f6df08e12b882a630eca261b3dbe24cea7a0ba87681765148087bad' },
  definitionClaim: { bytes: 159, sha256: '219981aae5a905fd30dc274765813a4c42e6f8a4a063e01a4027e018b615962b' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 2_000_000, timeout: 130_000 });
  return stdout;
}

function pageText(buffer) {
  return buffer.toString('utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&#160;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&rsquo;', '’')
    .replaceAll('&ldquo;', '“')
    .replaceAll('&rdquo;', '”')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractClaim(name, text, pattern, pinned) {
  const value = text.match(pattern)?.[0];
  assert(value, `${name} is missing`);
  assert.equal(Buffer.byteLength(value), pinned.bytes, `${name} byte count changed`);
  assert.equal(sha256(value), pinned.sha256, `${name} checksum changed`);
  return { text: value, bytes: pinned.bytes, sha256: pinned.sha256 };
}

const [indicatorBuffer, summaryBuffer] = await Promise.all([
  readFile(path.join(root, sources.indicatorSnapshot.localSnapshot)),
  fetchBuffer(sources.officialSummary.url),
]);
assert.equal(indicatorBuffer.length, expected.indicatorSnapshot.bytes, 'UNECE-UNESCO indicator snapshot byte count changed');
assert.equal(sha256(indicatorBuffer), expected.indicatorSnapshot.sha256, 'UNECE-UNESCO indicator snapshot checksum changed');

const indicator = JSON.parse(indicatorBuffer.toString('utf8'));
const summaryText = pageText(summaryBuffer);
const verifiedClaims = {
  coverage: extractClaim('UNESCO coverage claim', summaryText,
    /Today, 153 countries rely on transboundary waters[\s\S]*?co-management arrangements in place by 2030\./i,
    expected.coverageClaim),
  progress: extractClaim('UNESCO historical progress claim', summaryText,
    /The report notes an improvement in shared water cooperation[\s\S]*?operational arrangements\./i,
    expected.progressClaim),
  climateReadiness: extractClaim('UNESCO climate-readiness claim', summaryText,
    /Nearly two-thirds of transboundary river and lake basins[\s\S]*?30% for droughts\./i,
    expected.climateReadinessClaim),
  definition: extractClaim('UNESCO coverage definition', summaryText,
    /Countries are considered to be co-managing “most”[\s\S]*?these areas\./i,
    expected.definitionClaim),
};

assert.equal(indicator.assessment.countries_sharing_transboundary_waters, 153);
assert.equal(indicator.assessment.countries_reporting, 129);
assert.equal(indicator.assessment.global_indicator_average_pct, 59);
assert.equal(indicator.assessment.global_operational_coverage_gap_pct, 41);
assert.equal(indicator.assessment.countries_with_at_least_90_pct_operational_coverage, 43);
assert.equal(indicator.assessment.countries_with_full_operational_coverage, 26);

const snapshot = {
  version: 'tulip_basin_treaty_breakdown_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_global_cooperation_coverage_context_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Measure current international water-cooperation coverage while preventing missing or incomplete arrangements from becoming invented treaty failures, conflict, service interruption or harmed-person counts.',
  sources: {
    indicatorSnapshot: {
      ...sources.indicatorSnapshot,
      fetchedSnapshot: { bytes: indicatorBuffer.length, sha256: expected.indicatorSnapshot.sha256, retrievedOn: checkedOn },
    },
    officialSummary: {
      ...sources.officialSummary,
      retrievedOn: checkedOn,
      verifiedClaims,
    },
  },
  endpoints: {
    currentCooperationCoverage: {
      monitoringYear: indicator.assessment.monitoring_year,
      publicationYear: indicator.assessment.publication_year,
      countriesSharingTransboundaryWaters: indicator.assessment.countries_sharing_transboundary_waters,
      countriesReporting: indicator.assessment.countries_reporting,
      reportingSharePercent: indicator.assessment.reporting_share_pct,
      countriesWithAtLeast90PercentOperationalCoverage: indicator.assessment.countries_with_at_least_90_pct_operational_coverage,
      countriesWithFullOperationalCoverage: indicator.assessment.countries_with_full_operational_coverage,
      globalIndicatorAveragePercent: indicator.assessment.global_indicator_average_pct,
      globalOperationalCoverageGapPercent: indicator.assessment.global_operational_coverage_gap_pct,
      interpretation: 'These values describe the share of transboundary basin area covered by arrangements that meet the indicator’s operating criteria. They do not count treaty breach, withdrawal, conflict, water-service failure or people harmed.',
    },
    reportedProgress: {
      baselineYear: 2017,
      baselineCountriesWithAtLeast90PercentCoverage: 23,
      currentYear: 2023,
      currentCountriesWithAtLeast90PercentCoverage: 43,
      interpretation: 'The count improved over the monitored period. It therefore cannot be used as evidence that treaty breakdown is becoming more prevalent globally.',
    },
    climateReadinessContext: {
      transboundaryRiverAndLakeBasinsIncludingClimateAdaptationAsJointBodyTaskDescription: 'nearly two-thirds',
      shareWithConcreteClimateStrategyPercent: 14,
      shareWithJointDisasterRiskReductionStrategyPercent: 20,
      operationalRiverAndLakeArrangementsWithCoordinatedFloodAlarmPercent: 50,
      operationalRiverAndLakeArrangementsWithCoordinatedDroughtAlarmPercent: 30,
      interpretation: 'Preparedness measures show incomplete climate readiness among cooperative systems. They do not measure realized breakdown or terminal human harm.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the 2023 indicator as current global institutional-coverage and preparedness context.',
      'Use the 2017-to-2023 comparison to retain the observed direction of cooperation coverage.',
      'Use the operationality definition to distinguish an absent or incomplete arrangement from a documented treaty breakdown.',
      'Confine the node to the human governance domain because no direct ecosystem terminal consequence is measured by the admitted sources.',
    ],
    prohibited: [
      'Do not treat the 41 percent coverage gap as the share of treaties that failed, the share of people harmed or the severity of water insecurity.',
      'Do not treat 153 shared-water countries, 129 reporting countries or basin area as a harmed-person denominator.',
      'Do not infer conflict, water-service interruption, deaths, displacement or material loss from missing operational criteria.',
      'Do not use the 2017-to-2023 monitoring interval as consequence or recovery duration.',
      'Do not treat the report’s 2030 trend continuation as an SSP2-4.5 2027–2036 harm projection.',
      'Do not import drought, flood, conflict, food, displacement or water-service consequences from connected nodes.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'basin_treaty_breakdown',
      rating: 'B 3.3',
      uncertainty: 'A 1.0 to C 5.5',
      confidence: 'C',
      domain: 'human only',
      reason: 'The latest evidence directly measures a widespread institutional coverage gap and incomplete climate readiness, but it does not measure actual treaty breakdown or attributable human consequences. The central rating is a transparent low-impact risk-state judgment, not a conversion of basin area or country counts into harm.',
    },
  },
  unresolvedForTulip: [
    'Define and observe treaty breakdown separately from the absence of an operational arrangement, including suspension, withdrawal, non-compliance or failure of dispute-resolution procedures.',
    'Link documented breakdown events to attributable water-service, livelihood, health, displacement or material consequences using unique affected-person denominators.',
    'Measure consequence and recovery duration after a defined breakdown while separating concurrent drought, conflict, governance and infrastructure drivers.',
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
  coverageGapPercent: snapshot.endpoints.currentCooperationCoverage.globalOperationalCoverageGapPercent,
  digest: snapshot.snapshotDigest,
}, null, 2));
