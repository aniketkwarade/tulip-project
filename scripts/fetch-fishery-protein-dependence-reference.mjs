import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'fishery-protein-dependence-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+fishery-protein-dependence-evidence-ingestion)';

const source = {
  id: 'fao_state_world_fisheries_aquaculture_2026',
  publisher: 'Food and Agriculture Organization of the United Nations',
  title: 'The State of World Fisheries and Aquaculture 2026',
  publicationDate: '2026-06-16',
  doi: 'https://doi.org/10.4060/cd8357en',
  reportUrl: 'https://openknowledge.fao.org/server/api/core/bitstreams/12715642-41ce-4b25-b1ed-2aa503fba80d/content',
  officialSummaryUrl: 'https://www.fao.org/newsroom/detail/sofia-2026--global-fisheries-and-aquaculture-production-reaches-new-highs/',
};

const expected = {
  report: { bytes: 41_332_656, sha256: 'ef343073e620cf0fe872cf6732e57fb5d4b83faaba0d15a7d23d1824637e708d' },
  dietClaim: { bytes: 212, sha256: '7c871b8de4ae86df4c20b2bd224fa534d4464d35e50c34f4a68bfe3ed7e49e64' },
  livelihoodsClaim: { bytes: 69, sha256: '7f773fd20a11003d9cb30ffb2262400c9c266df25696f1086da7724ab1735b2b' },
  productionClaim: { bytes: 217, sha256: 'd80fce0e026bec7a9f1d12b9ff77b966490479a2304d9be56b0688c0fc18f55f' },
  captureClaim: { bytes: 281, sha256: '80018b993b3c8872ff82a01c5eac9cb665661fad4f52af8cdebca7d59e6b83b2' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url, maxBuffer = 50_000_000) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer, timeout: 190_000 });
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

const [report, summaryPage] = await Promise.all([
  fetchBuffer(source.reportUrl),
  fetchBuffer(source.officialSummaryUrl, 2_000_000),
]);
assert.equal(report.length, expected.report.bytes, 'SOFIA 2026 report byte count changed');
assert.equal(sha256(report), expected.report.sha256, 'SOFIA 2026 report checksum changed');
assert.equal(report.subarray(0, 4).toString('utf8'), '%PDF', 'SOFIA 2026 report is not a PDF');

const summaryText = pageText(summaryPage);
const verifiedClaims = {
  diet: extractClaim('FAO diet claim', summaryText,
    /Aquatic animal foods are increasingly central to diets:[\s\S]*?3\.1 billion people\./i,
    expected.dietClaim),
  livelihoods: extractClaim('FAO livelihoods claim', summaryText,
    /The sector also supports more than 600 million livelihoods worldwide\./i,
    expected.livelihoodsClaim),
  production: extractClaim('FAO production claim', summaryText,
    /SOFIA 2026 estimates global fisheries and aquaculture production[\s\S]*?feeding the world\./i,
    expected.productionClaim),
  capture: extractClaim('FAO capture-fisheries claim', summaryText,
    /In particular, in 2024 aquaculture production[\s\S]*?late 1980s\./i,
    expected.captureClaim),
};

const snapshot = {
  version: 'tulip_fishery_protein_dependence_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_global_dietary_dependence_and_supply_context_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Measure the current scale of dietary and livelihood reliance on aquatic foods while preventing a beneficial food contribution, production tonnage or population coverage from becoming invented current harm.',
  source: {
    ...source,
    fetchedReport: { bytes: report.length, sha256: expected.report.sha256, retrievedOn: checkedOn },
    verifiedClaims,
  },
  endpoints: {
    dietaryDependence: {
      referenceYear: 2023,
      peopleReceivingAtLeastOneFifthAnimalProteinFromAquaticFoods: 3_100_000_000,
      minimumAnimalProteinSharePercent: 20,
      globalPopulationShareDescription: 'over 40 percent',
      interpretation: 'This measures dietary reliance and nutritional contribution. It does not show that 3.1 billion people are harmed, food-insecure or currently experiencing a fish-supply disruption.',
    },
    livelihoodsContext: {
      supportedLivelihoods: 600_000_000,
      countQualifier: 'more than',
      interpretation: 'This is a sector-support estimate. It is not a count of livelihoods lost or people harmed by protein dependence.',
    },
    currentSupplyContext: {
      referenceYear: 2024,
      totalFisheriesAndAquacultureProductionMillionTonnes: 235,
      aquaticAnimalProductionMillionTonnes: 195,
      shareOfAquaticAnimalProductionForHumanConsumptionPercent: 89,
      captureFisheriesMillionTonnes: 92,
      captureFisheriesRangeSinceLate1980sMillionTonnes: { lower: 86, upper: 94 },
      interpretation: 'Supply and production establish the size and composition of the food system. Tonnes do not measure nutrition loss, harmed-person reach or consequence duration.',
    },
  },
  tulipUse: {
    admitted: [
      'Use 3.1 billion people and the at-least-20-percent threshold as global dietary-dependence context.',
      'Use the 2023–2024 figures to establish current evidence recency and the distinction between dependence, production and harm.',
      'Use the long-running 86–94 million-tonne capture-fisheries range only as supply context; it is not a stability guarantee or consequence duration.',
      'Confine the node to the human domain because the admitted source measures dietary and livelihood reliance rather than ecosystem condition.',
    ],
    prohibited: [
      'Do not treat 3.1 billion people as harmed, food-insecure or affected by a current supply disruption.',
      'Do not treat more than 600 million supported livelihoods as livelihoods lost or people harmed.',
      'Do not map production tonnes, consumption share, country coverage or world-population coverage to harm severity.',
      'Do not use the period since the late 1980s as human consequence persistence.',
      'Do not import fish-stock decline, fishery collapse, food insecurity, price volatility or nutrition-health scores from connected nodes.',
      'Do not assign ecosystem harm to dietary dependence itself.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'fishery_protein_dependence',
      rating: 'B 3.3',
      uncertainty: 'A 1.0 to C 5.5',
      confidence: 'C',
      domain: 'human only',
      reason: 'The global dependence denominator is current and direct, but dependence is not a harmful outcome. No compatible current nutrition loss, disrupted-person count or consequence-duration distribution is attributable to dependence itself.',
    },
  },
  unresolvedForTulip: [
    'Link a defined fish-supply disruption to measured changes in dietary intake, food security, health or household costs without reusing outcomes assigned to separate nodes.',
    'Estimate unique people experiencing a current attributable consequence rather than people receiving nutritional benefit from aquatic foods.',
    'Measure consequence and recovery duration after a defined disruption across different substitution and social-protection settings.',
  ],
};

snapshot.snapshotDigest = digest({
  source: snapshot.source,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  dependentPeople: snapshot.endpoints.dietaryDependence.peopleReceivingAtLeastOneFifthAnimalProteinFromAquaticFoods,
  digest: snapshot.snapshotDigest,
}, null, 2));
