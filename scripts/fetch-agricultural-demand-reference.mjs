import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'agricultural-demand-reference-snapshot.json');
const fixturePath = path.join(root, 'scripts', 'fixtures', 'agricultural-demand-land-use-results.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

const fixtureBuffer = await readFile(fixturePath);
const fixture = JSON.parse(fixtureBuffer.toString('utf8'));
const work = await mkdtemp(path.join(tmpdir(), 'tulip-ag-demand-'));

async function fetchFile(url, name) {
  const destination = path.join(work, name);
  await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error',
    '--header', 'User-Agent: LostPlanet-TULIP/1.0 (+agricultural-demand-endpoint-ingestion)',
    '--output', destination,
    url,
  ], { timeout: 180_000, maxBuffer: 1_000_000 });
  return readFile(destination);
}

try {
  const [articlePdf, landPdf, sourceArchive, zenodoResponse] = await Promise.all([
    fetchFile(fixture.sources.biodiversity.pdfUrl, 'article.pdf'),
    fetchFile(fixture.sources.land.pdfUrl, 'land.pdf'),
    fetchFile(fixture.sources.biodiversity.sourceData.archiveUrl, 'source-data.zip'),
    fetch(fixture.sources.biodiversity.sourceData.apiUrl, {
      headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+agricultural-demand-endpoint-ingestion)' },
    }),
  ]);
  assert(zenodoResponse.ok, `Zenodo metadata request failed: ${zenodoResponse.status}`);
  const zenodo = await zenodoResponse.json();
  const archiveMetadata = zenodo.files.find(file => file.key === fixture.sources.biodiversity.sourceData.archiveFileName);

  assert.equal(articlePdf.length, fixture.sources.biodiversity.pdfBytes, 'Nature article PDF byte size changed');
  assert.equal(sha256(articlePdf), fixture.sources.biodiversity.pdfSha256, 'Nature article PDF checksum changed');
  assert.equal(landPdf.length, fixture.sources.land.pdfBytes, 'FAO land brief byte size changed');
  assert.equal(sha256(landPdf), fixture.sources.land.pdfSha256, 'FAO land brief checksum changed');
  assert.equal(sourceArchive.length, fixture.sources.biodiversity.sourceData.archiveBytes, 'Source-data archive byte size changed');
  assert.equal(sha256(sourceArchive), fixture.sources.biodiversity.sourceData.archiveSha256, 'Source-data archive SHA-256 changed');
  assert.equal(md5(sourceArchive), fixture.sources.biodiversity.sourceData.archiveMd5, 'Source-data archive MD5 changed');
  assert.equal(archiveMetadata?.size, fixture.sources.biodiversity.sourceData.archiveBytes, 'Zenodo archive size changed');
  assert.equal(archiveMetadata?.checksum, `md5:${fixture.sources.biodiversity.sourceData.archiveMd5}`, 'Zenodo archive checksum changed');
  assert.equal(fixture.biodiversityEndpoint.netExactFractionFromSourceWorkbook, 0.013896174054540059);
  assert.equal(fixture.landContext.agriculturalLandChangeMillionHa, -75);

  const snapshot = {
    version: 'tulip_agricultural_demand_reference_2026_09_23_v1',
    generatedOn: checkedOn,
    status: 'direct_global_land_use_biodiversity_endpoint_ingested',
    productionRatingsEnabled: 0,
    purpose: 'Replace a broad agricultural-demand proxy with a direct, source-data-backed estimate of biodiversity harm from demand-driven recent land-use change, while keeping human downstream outcomes separate.',
    sources: {
      biodiversity: {
        ...fixture.sources.biodiversity,
        fetchedArticle: { bytes: articlePdf.length, sha256: sha256(articlePdf) },
        fetchedSourceData: {
          bytes: sourceArchive.length,
          md5: md5(sourceArchive),
          sha256: sha256(sourceArchive),
          zenodoRecordId: zenodo.id,
          zenodoDoi: zenodo.doi,
        },
      },
      land: {
        ...fixture.sources.land,
        fetchedDocument: { bytes: landPdf.length, sha256: sha256(landPdf) },
      },
      extractedResultsFixture: {
        path: 'scripts/fixtures/agricultural-demand-land-use-results.json',
        bytes: fixtureBuffer.length,
        sha256: sha256(fixtureBuffer),
        extractedWith: fixture.extractedWith,
      },
    },
    endpoints: {
      biodiversity: fixture.biodiversityEndpoint,
      landContext: fixture.landContext,
    },
    tulipUse: {
      admitted: [
        'Use the 1.3896174054540059% modelled global potential species loss as a converted proxy for ecosystem severity from 1995–2022 land-use change.',
        'Use the agriculture attribution and international supply-chain structure to bind the endpoint to Agricultural Demand.',
        'Use FAO land statistics to correct the pressure narrative: cropland expanded while total agricultural land declined slightly.',
        'Use restoration and abandonment as evidence that some land-use biodiversity effects can decrease; retain a higher persistence bound because modelled committed extinctions can be irreversible.',
        'Use model and land coverage as evidence scope only; retain bounded ecosystem reach because the sources do not report the affected share of each ecosystem type’s distribution.'
      ],
      prohibited: fixture.evidenceBoundaries,
      currentCatalogueRecommendation: {
        nodeId: 'food',
        rating: 'C 5.5',
        uncertainty: 'B 4.0 to D 7.8',
        confidence: 'B',
        domain: 'ecosystem only',
        axes: { ecosystem: { severity: 1, reach: 2, persistence: 3 } },
        reason: 'The direct global model supports a small but consequential biodiversity-condition loss spread through agricultural land-use supply chains. It does not establish a direct adverse human endpoint for demand itself, and the exact affected-ecosystem extent and recovery distribution remain unresolved.'
      }
    },
    unresolvedForTulip: [
      'Obtain a denominator that maps the land-use model to the share of each affected ecosystem type’s distribution.',
      'Obtain a compatible global distribution of recovery time after the relevant agricultural land conversions.',
      'If the node is later defined to include human harm, add an attributable non-overlapping human endpoint rather than importing Food Insecurity, food-price, water-stress or labour-exposure scores.',
      'Locate an SSP2-4.5 projection that directly maps the 2027–2036 agricultural-demand pathway to the admitted biodiversity endpoint.'
    ]
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
    netPotentialSpeciesLossPercent: snapshot.endpoints.biodiversity.netRoundedPercentReportedInArticle,
    agriculturalLand2023MillionHa: snapshot.endpoints.landContext.agriculturalLand2023MillionHa,
    digest: snapshot.snapshotDigest,
  }, null, 2));
} finally {
  await rm(work, { recursive: true, force: true });
}
