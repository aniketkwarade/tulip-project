import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'floodplain-exposure-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+floodplain-exposure-evidence-ingestion)';

const sources = {
  vulnerabilityAdjusted: {
    id: 'roderick_global_flood_vulnerability_adjusted_risk_2024',
    publisher: 'Nature Communications',
    title: 'Integrating social vulnerability into high-resolution global flood risk mapping',
    publicationDate: '2024-04-13',
    doi: 'https://doi.org/10.1038/s41467-024-47394-2',
    url: 'https://www.nature.com/articles/s41467-024-47394-2',
    openData: 'https://doi.org/10.6084/m9.figshare.25273429.v3',
  },
  significantExposure: {
    id: 'rentschler_global_flood_exposure_poverty_2022',
    publisher: 'Nature Communications; World Bank',
    title: 'Flood exposure and poverty in 188 countries',
    publicationDate: '2022-06-01',
    doi: 'https://doi.org/10.1038/s41467-022-30727-4',
    url: 'https://www.nature.com/articles/s41467-022-30727-4',
    dataCatalog: 'https://datacatalog.worldbank.org/search/dataset/0062763/global-flood-exposure-gridded-exposure-headcounts-by-country',
    dataLicense: 'CC BY 4.0',
  },
};

const expected = {
  riskBoundary: { bytes: 504, sha256: '883160260ce5cdff1dbe7a8bbdb0fc88ef1c51ad9d4f173fb621d639e50363b7' },
  riskCoverage: { bytes: 154, sha256: '268ae91bc819e2070b3c2c2bb4ff62a63b974404014119bb95a67449862c3f61' },
  riskExposure: { bytes: 136, sha256: '248ceda68297cff09b533ec3b19620a660f0ba00ebe6bd77715ad0f9db7a88d2' },
  riskAdjusted: { bytes: 283, sha256: '694cfef80e09215f1ebed5cf91789cc57752a845dee553c3b6a4b29cc8c72550' },
  riskPopulationYear: { bytes: 150, sha256: 'ca1ab73770b7b0601cbb84d5e585279d759e6a3befa091a03619646f4a154df0' },
  exposureHeadline: { bytes: 430, sha256: '3b517320cb9e43026a776aa172556384c289b0015e10163748d3bf6da93d8d24' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 4_000_000, timeout: 130_000 });
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

const [riskBuffer, exposureBuffer] = await Promise.all([
  fetchBuffer(sources.vulnerabilityAdjusted.url),
  fetchBuffer(sources.significantExposure.url),
]);
const riskText = pageText(riskBuffer);
const exposureText = pageText(exposureBuffer);
const verifiedClaims = {
  riskBoundary: extractClaim('exposure-versus-risk claim', riskText,
    /The outputs are more accurately characterised as population or wealth exposure maps[\s\S]*?rather than human well-being\./i,
    expected.riskBoundary),
  riskCoverage: extractClaim('country-coverage claim', riskText,
    /Our sample is comprised of the 175 countries[\s\S]*?98\.6% of the global population\./i,
    expected.riskCoverage),
  riskExposure: extractClaim('fluvial-exposure claim', riskText,
    /In our sample, approximately 2 billion people are estimated to be exposed[\s\S]*?10 cm depth threshold\./i,
    expected.riskExposure),
  riskAdjusted: extractClaim('vulnerability-adjusted claim', riskText,
    /Using this approach, we estimate that 1\.23 billion people live[\s\S]*?proxy for social vulnerability\./i,
    expected.riskAdjusted),
  riskPopulationYear: extractClaim('population-vintage claim', riskText,
    /This data provides population counts at 3-arc second grid spacing for 2020[\s\S]*?United Nations \(UN\) population estimates\./i,
    expected.riskPopulationYear),
  exposureHeadline: extractClaim('significant-exposure claim', exposureText,
    /Our estimates show that globally, 1\.81 billion people[\s\S]*?almost one in four of the world’s people are exposed to significant flood risk\./i,
    expected.exposureHeadline),
};

const snapshot = {
  version: 'tulip_floodplain_exposure_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'global_exposure_and_vulnerability_boundary_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace an outdated generic floodplain trace with current global exposure and vulnerability evidence while preventing modeled exposure, population coverage and relative-risk quintiles from becoming invented current harm.',
  sources: {
    vulnerabilityAdjusted: {
      ...sources.vulnerabilityAdjusted,
      retrievedOn: checkedOn,
      fetchedDocument: { bytes: riskBuffer.length, sha256: sha256(riskBuffer) },
      verifiedClaims: [verifiedClaims.riskBoundary, verifiedClaims.riskCoverage, verifiedClaims.riskExposure, verifiedClaims.riskAdjusted, verifiedClaims.riskPopulationYear],
    },
    significantExposure: {
      ...sources.significantExposure,
      retrievedOn: checkedOn,
      fetchedDocument: { bytes: exposureBuffer.length, sha256: sha256(exposureBuffer) },
      verifiedClaims: [verifiedClaims.exposureHeadline],
    },
  },
  currentWindow: {
    start: 2020,
    end: 2020,
    coverageStatus: 'complete',
    summaryMethod: 'end_state_stock',
    coverageNote: 'The 2024 risk study applies global flood models and vulnerability proxies to a 2020 building-constrained population surface. Publication year is not relabelled as observation year.',
  },
  endpoints: {
    modeledExposure: {
      fluvialFloodDepthThresholdCm: 10,
      populationExposedApproximate: 2_000_000_000,
      countries: 175,
      globalPopulationCoveragePercent: 98.6,
      populationVintage: 2020,
      interpretation: 'This is modeled exposure to fluvial flood hazard, not a count of people currently injured, displaced, deprived of services or losing assets.',
    },
    significantFloodRiskCrossCheck: {
      returnPeriodYears: 100,
      inundationDepthThresholdM: 0.15,
      populationExposed: 1_810_000_000,
      worldPopulationSharePercent: 23,
      interpretation: 'The cross-check uses a different hazard threshold and model boundary. It corroborates large exposure but is not added to the two-billion estimate.',
    },
    vulnerabilityAdjustment: {
      populationInTopTwoExpectedExposureQuintiles: 1_230_000_000,
      populationInTopTwoVulnerabilityAdjustedQuintiles: 866_000_000,
      vulnerabilityProxy: 'relative deprivation derived from gridded GDP per capita',
      interpretation: 'These are relative risk classifications, not observed counts of people harmed. They show that exposure alone does not determine well-being risk.',
    },
    compatibleCurrentHarmedPersonCount: null,
    compatibleCurrentEcosystemEndpoint: null,
  },
  tulipUse: {
    admitted: [
      'Use the global population estimates to establish the scale of modeled flood exposure and the geographic coverage of the evidence.',
      'Use the vulnerability-adjusted comparison to demonstrate that exposure and susceptibility are distinct.',
      'Use the 2020 population vintage as the current-window boundary and the 2024 publication as evidence recency.',
      'Retain the alternative 2022 threshold as a cross-check rather than summing or averaging incompatible exposure estimates.',
    ],
    prohibited: [
      'Do not treat approximately two billion exposed people as two billion people currently harmed.',
      'Do not treat 1.23 billion or 866 million people in high relative-risk quintiles as observed fatalities, displacement, service loss or material loss.',
      'Do not add the 2022 and 2024 exposure estimates; their thresholds and hazard boundaries differ.',
      'Do not convert country count, global population coverage, model-cell count or publication age into reach or persistence.',
      'Do not infer ecosystem condition loss from human population or asset exposure.',
      'Do not import realized flood deaths, displacement, infrastructure failure or habitat effects from connected nodes.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'floodplain_exposure',
      rating: 'B 3.3',
      uncertainty: 'A 1.0 to C 5.5',
      confidence: 'C',
      domain: 'human only',
      reason: 'Current global models establish very large human exposure, but exposure is a risk state rather than a terminal consequence. No compatible current harmed-person count, realized loss duration or ecosystem-condition endpoint is supplied by these sources.',
    },
  },
  unresolvedForTulip: [
    'Join exposure to a current global event-level series of attributable deaths, injury, displacement, service interruption and material loss without double counting repeated people or events.',
    'Measure consequence and recovery duration rather than using residence time, model return period or dataset length.',
    'Add a source-matched ecosystem-condition and affected-distribution endpoint if the node is intended to include nature.',
    'Validate local results against administrative population and defense data because global exposure models can be inaccurate at local scales.',
  ],
};

snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, modeledExposure: snapshot.endpoints.modeledExposure.populationExposedApproximate, compatibleCurrentHarmedPersonCount: snapshot.endpoints.compatibleCurrentHarmedPersonCount, digest: snapshot.snapshotDigest }, null, 2));
