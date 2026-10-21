import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'port-bottleneck-reference-snapshot.json');
const fixturePath = path.join(root, 'scripts', 'fixtures', 'verschuur-port-systemic-risk-results.json');
const checkedOn = '2026-09-23';
const userAgent = 'LostPlanet-TULIP/1.0 (+port-bottleneck-endpoint-ingestion)';
const execFileAsync = promisify(execFile);

const source = {
  id: 'verschuur_systemic_climate_port_risk_2023',
  title: 'Systemic risks from climate-related disruptions at ports',
  articleUrl: 'https://www.nature.com/articles/s41558-023-01754-w',
  doi: 'https://doi.org/10.1038/s41558-023-01754-w',
  articlePdfUrl: 'https://link.springer.com/content/pdf/10.1038/s41558-023-01754-w.pdf',
  supplementaryMethodsUrl: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41558-023-01754-w/MediaObjects/41558_2023_1754_MOESM1_ESM.pdf',
  reportingSummaryUrl: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41558-023-01754-w/MediaObjects/41558_2023_1754_MOESM2_ESM.pdf',
  repositoryUrl: 'https://data.mendeley.com/datasets/nddrc4wkcc/1',
  repositoryDoi: 'https://doi.org/10.17632/nddrc4wkcc.1',
  repositoryFilesUrl: 'https://data.mendeley.com/public-api/datasets/nddrc4wkcc/files?folder_id=root&version=1&%24start=0&%24limit=1000',
};

const expected = {
  articlePdfSha256: '22657a230b29c22df818667ff384e3c295a4dfe8db97e8828e372458a3a289e4',
  supplementaryMethodsSha256: '480847479d1fc7c004e1c41a86258207c6effe219567a0d4bb93992dd206ee0d',
  reportingSummarySha256: 'c69c53b4dc7b15bef883017e31f45e430bffc43320be09e40d3a6d4df8eb1f38',
  repositoryArchiveSha256: '0e4f1b310365ffbbf4d20d4a4df4bfbf872b7983347bc7738fb8c2a5b3a77225',
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchPdfBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error',
    '--header', `User-Agent: ${userAgent}`,
    '--header', 'Accept: application/pdf',
    url,
  ], { encoding: null, maxBuffer: 20_000_000, timeout: 120_000 });
  return stdout;
}

async function fetchRepositoryFiles() {
  const response = await fetch(source.repositoryFilesUrl, {
    signal: AbortSignal.timeout(120_000),
    headers: {
      Accept: 'application/vnd.mendeley-public-dataset.1+json',
      'User-Agent': userAgent,
    },
  });
  assert(response.ok, `Mendeley file listing returned HTTP ${response.status}`);
  return response.json();
}

const [articlePdf, supplementaryMethods, reportingSummary, fixtureBuffer, repositoryFiles] = await Promise.all([
  fetchPdfBuffer(source.articlePdfUrl),
  fetchPdfBuffer(source.supplementaryMethodsUrl),
  fetchPdfBuffer(source.reportingSummaryUrl),
  readFile(fixturePath),
  fetchRepositoryFiles(),
]);

assert.equal(sha256(articlePdf), expected.articlePdfSha256, 'Article PDF checksum changed');
assert.equal(sha256(supplementaryMethods), expected.supplementaryMethodsSha256, 'Supplementary methods checksum changed');
assert.equal(sha256(reportingSummary), expected.reportingSummarySha256, 'Reporting summary checksum changed');
const fixture = JSON.parse(fixtureBuffer.toString('utf8'));
assert.equal(fixture.source.articlePdfSha256, expected.articlePdfSha256);
assert.equal(fixture.source.articlePdfBytes, articlePdf.length);
assert.equal(fixture.source.supplementaryMethodsSha256, expected.supplementaryMethodsSha256);
assert.equal(fixture.source.supplementaryMethodsBytes, supplementaryMethods.length);
assert.equal(fixture.coverage.ports, 1_320);
assert.equal(fixture.downtime.globalMeanExpectedDaysPerPortYear, 1.4);
assert.equal(fixture.annualRisk.forwardEconomicActivityAtRiskUsdBillion, 122.1);
assert.deepEqual(fixture.methodBoundary.excludedFromClimateHazardSet, ['earthquake', 'tsunami']);

assert.equal(repositoryFiles.length, 1);
const archive = repositoryFiles[0];
assert.equal(archive.filename, 'Systemic_risk_ports.zip');
assert.equal(archive.content_details.sha256_hash, expected.repositoryArchiveSha256);
assert.equal(archive.content_details.size, 758_838_436);

const snapshot = {
  version: 'tulip_port_bottleneck_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'published_global_climate_port_downtime_and_economic_exposure_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace generic supply-chain and ecosystem assumptions with a reproducible global estimate of climate-related port downtime and the economic activity exposed to it.',
  source: {
    ...source,
    licence: 'CC BY 4.0',
    fetchedDocuments: {
      articlePdf: { url: source.articlePdfUrl, bytes: articlePdf.length, sha256: expected.articlePdfSha256 },
      supplementaryMethods: { url: source.supplementaryMethodsUrl, bytes: supplementaryMethods.length, sha256: expected.supplementaryMethodsSha256 },
      reportingSummary: { url: source.reportingSummaryUrl, bytes: reportingSummary.length, sha256: expected.reportingSummarySha256 },
      extractedResultsFixture: { path: 'scripts/fixtures/verschuur-port-systemic-risk-results.json', bytes: fixtureBuffer.length, sha256: sha256(fixtureBuffer), extractedWith: fixture.source.extractedWith },
    },
    reproducibilityArchive: {
      filename: archive.filename,
      fileId: archive.id,
      bytes: archive.content_details.size,
      sha256: archive.content_details.sha256_hash,
      contentType: archive.content_details.content_type,
      createdOn: archive.content_details.created_date,
      downloadUrl: archive.content_details.download_url,
      downloadedForThisSnapshot: false,
      reasonNotDownloaded: 'The 758.8 MB archive is publicly listed and checksum-pinned. The article and supplementary methods contain the admitted aggregate endpoint values; downloading the full archive is unnecessary for this catalogue decision.',
    },
  },
  coverage: fixture.coverage,
  endpoint: {
    downtime: fixture.downtime,
    annualRisk: fixture.annualRisk,
    methodBoundary: fixture.methodBoundary,
    interpretation: 'The model measures expected annual port downtime and economic activity exposed to that downtime. It does not report deaths, a harmed-person count or ecosystem-condition loss.',
  },
  tulipUse: {
    admitted: [
      'Use the expected annual economic activity at risk as a quantitative proxy for material human economic loss or interruption severity.',
      'Use the expected 1.4 downtime days per port-year and the reported upper tail to bound event-scale persistence.',
      'Use the 1,320-port, 184-country supply-chain coverage to establish global model coverage only; do not convert countries, ports or trade volume into affected people.',
      'Confine the node to the human domain because the study does not measure ecosystem condition, ecological extent or ecological recovery.',
    ],
    prohibited: [
      'Do not use the statement that ports handle around 80% of global trade as ecosystem reach.',
      'Do not present US$122.1 billion of activity at risk as an observed cash-loss total.',
      'Do not add the separately reported US$173 billion upstream exposure to the forward result as if both were realized losses.',
      'Do not use the 1979–2018 hazard record as the duration of a single bottleneck consequence.',
      'Do not convert port count, country count, tonnes or trade value into a harmed-person denominator.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'supply_chain_port_bottlenecks',
      rating: 'B 4.0',
      uncertainty: 'A 2.5 to C 5.5',
      confidence: 'B',
      domain: 'human only',
      reason: 'The global model directly measures downtime and economic exposure, but the economic result is activity at risk and no compatible harmed-person count is available.',
    },
  },
  unresolvedForTulip: [
    'Obtain a current observed distribution of realized household, firm or essential-service losses caused by climate-related port bottlenecks.',
    'Obtain a compatible affected-person denominator rather than using ports, countries or trade value as reach.',
    'Validate recovery and disruption duration using observed event records as well as modeled annual expected downtime.',
    'Add a separate ecosystem node or endpoint if port disruption itself is shown to cause measured ecological harm; do not infer it from trade coverage.',
  ],
};

snapshot.snapshotDigest = digest({
  source: snapshot.source,
  coverage: snapshot.coverage,
  endpoint: snapshot.endpoint,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  ports: snapshot.coverage.ports,
  economicActivityAtRiskUsdBillion: snapshot.endpoint.annualRisk.forwardEconomicActivityAtRiskUsdBillion,
  expectedDowntimeDays: snapshot.endpoint.downtime.globalMeanExpectedDaysPerPortYear,
  digest: snapshot.snapshotDigest,
}, null, 2));
