import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'invasive-species-reference-snapshot.json');
const fixturePath = path.join(root, 'scripts', 'fixtures', 'ipbes-invasive-alien-species-spm-results.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);

const fixtureBuffer = await readFile(fixturePath);
const fixture = JSON.parse(fixtureBuffer.toString('utf8'));
const { stdout: pdf } = await execFileAsync('curl', [
  '--location', '--fail', '--silent', '--show-error',
  '--header', 'User-Agent: LostPlanet-TULIP/1.0 (+invasive-species-endpoint-ingestion)',
  '--header', 'Accept: application/pdf',
  fixture.source.pdfUrl,
], { encoding: null, maxBuffer: 15_000_000, timeout: 120_000 });

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
assert.equal(pdf.length, fixture.source.pdfBytes, 'IPBES Summary PDF byte size changed');
assert.equal(sha256(pdf), fixture.source.pdfSha256, 'IPBES Summary PDF checksum changed');
assert.equal(fixture.ecosystemEndpoints.recordedGlobalExtinctionsWithInvasiveSpeciesAsContributorPercent, 60);
assert.equal(fixture.ecosystemEndpoints.recordedGlobalExtinctionsWithInvasiveSpeciesAsSoleDriverPercent, 16);
assert.equal(fixture.humanEndpoints.annualGlobalEconomicCost2019UsdBillionLowerBound, 423);
assert.equal(fixture.trendAndManagement.successfulIslandEradicationAttemptsPercent, 88);

const snapshot = {
  version: 'tulip_invasive_species_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'approved_global_ipbes_invasive_species_endpoints_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace family-level assumptions with the approved IPBES assessment of current ecological and human consequences from invasive alien species.',
  source: {
    id: 'ipbes_ias_summary_policy_makers_2023',
    ...fixture.source,
    fetchedDocument: {
      url: fixture.source.pdfUrl,
      bytes: pdf.length,
      sha256: sha256(pdf),
      extractedResultsFixture: {
        path: 'scripts/fixtures/ipbes-invasive-alien-species-spm-results.json',
        bytes: fixtureBuffer.length,
        sha256: sha256(fixtureBuffer),
        extractedWith: fixture.source.extractedWith
      }
    }
  },
  coverage: fixture.coverage,
  endpoints: {
    ecosystem: fixture.ecosystemEndpoints,
    human: fixture.humanEndpoints,
    trendAndManagement: fixture.trendAndManagement,
    evidenceLanguage: fixture.evidenceLanguage
  },
  tulipUse: {
    admitted: [
      'Use recorded global and local extinctions as direct evidence that ecological severity can reach the terminal level.',
      'Use explicit irreversibility findings to support long ecological persistence, while retaining lower bounds because impacts vary by species and ecosystem.',
      'Use the annual economic cost as evidence of material human loss; the dollar total does not by itself establish severe illness, major displacement or lost survival needs.',
      'Use all-region and realm coverage as evidence of broad assessment scope; documented-impact shares are not affected-ecosystem or harmed-person denominators.',
      'Use the reported evidence qualifiers to set confidence and bounds.'
    ],
    prohibited: [
      'Do not add the 60% contributor share to the 16% sole-driver share; the latter is contained within the former.',
      'Do not use the 75%, 14% and 10% shares of documented reports as fractions of global ecosystem area affected.',
      'Do not use 37,000 alien species, 3,500 invasive species or 200 new records per year as human or ecosystem reach.',
      'Do not treat the 1970–2019 cost trend as consequence or recovery duration.',
      'Do not infer a harmed-person count from economic costs or the statement that effects occur in all regions.',
      'Do not apply a global extinction outcome uniformly to every invasive species or affected ecosystem.'
    ],
    currentCatalogueRecommendation: {
      nodeId: 'invasive_species_encroachment',
      rating: 'D 7.8',
      uncertainty: 'C 5.9 to E 9.3',
      confidence: 'B',
      domain: 'human and ecosystem',
      reason: 'The global assessment directly establishes material economic and quality-of-life harm plus extinction and sometimes irreversible ecological harm. Compatible harmed-person and affected-ecosystem denominators remain unavailable.'
    }
  },
  unresolvedForTulip: [
    'Obtain a non-overlapping count of people currently experiencing attributable health, food, water, livelihood or service consequences.',
    'Obtain the share of each relevant ecosystem distribution with demonstrated condition loss rather than the share of documented reports.',
    'Separate reversible managed invasions from entrenched and irreversible cases in a compatible global recovery distribution.',
    'Refresh the human economic endpoint to a common price year only through a documented published conversion.'
  ]
};

snapshot.snapshotDigest = digest({
  source: snapshot.source,
  coverage: snapshot.coverage,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  economicCostUsdBillion: snapshot.endpoints.human.annualGlobalEconomicCost2019UsdBillionLowerBound,
  documentedLocalExtinctions: snapshot.endpoints.ecosystem.documentedLocalExtinctions,
  digest: snapshot.snapshotDigest
}, null, 2));
