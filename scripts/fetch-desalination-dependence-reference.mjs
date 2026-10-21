import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'desalination-dependence-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+desalination-dependence-evidence-ingestion)';

const sources = {
  worldBank: {
    id: 'world_bank_the_role_of_desalination_in_an_increasingly_water_scarce_world',
    publisher: 'World Bank Water Global Practice',
    title: 'The Role of Desalination in an Increasingly Water-Scarce World',
    publicationDate: '2019',
    url: 'https://documents1.worldbank.org/curated/en/476041552622967264/pdf/135312-WP-PUBLIC-14-3-2019-12-3-35-W.pdf',
  },
  iea: {
    id: 'iea_future_of_electricity_mena_2025',
    publisher: 'International Energy Agency',
    title: 'The Future of Electricity in the Middle East and North Africa',
    publicationDate: '2025-09',
    url: 'https://iea.blob.core.windows.net/assets/71d04046-37df-45fb-bb39-a4f818c9aaec/TheFutureofElectricityintheMiddleEastandNorthAfrica.pdf',
    license: 'CC BY 4.0',
  },
  kenigsberg: {
    id: 'kenigsberg_long_term_brine_benthic_foraminifera_2020',
    publisher: 'PLOS ONE',
    title: 'The effect of long-term brine discharge from desalination plants on benthic foraminifera',
    publicationDate: '2020-01-14',
    doi: 'https://doi.org/10.1371/journal.pone.0227589',
    url: 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/PMC6959559/unicode',
    license: 'CC BY',
  },
  whitmarsh: {
    id: 'whitmarsh_desalination_fish_assemblages_2020',
    publisher: 'ICES Journal of Marine Science',
    title: 'No detrimental effects of desalination waste on temperate fish assemblages',
    publicationDate: '2020-12-13',
    doi: 'https://doi.org/10.1093/icesjms/fsaa174',
    url: 'https://oup.silverchair-cdn.com/article-minimal/6032770',
    articleUrl: 'https://academic.oup.com/icesjms/article/78/1/45/6032770',
  },
};

const expected = {
  worldBank: { bytes: 3_473_701, sha256: '3f6741bd8095b1e4dd092629664fd81839cfa3f2949e2aa340f92b6749828ea1' },
  iea: { bytes: 7_971_671, sha256: '9768643d5f0b5096bec95978f304d03afc682feb262840837efc3602343c11ab' },
  kenigsberg: { bytes: 115_714, sha256: '0a9d0b814655d221c4161c15412f61b0e39f6da538a6fd9d088faf32dfc83ba6' },
  whitmarsh: { bytes: 226_012, sha256: '92b2bbb221bbaab1cfc01f8f3110e689eaebd7f564443451bfced89ffaa82e42' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 12_000_000, timeout: 190_000 });
  return stdout;
}

function compactHtml(buffer) {
  return buffer.toString('utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function claim(text, pattern, name) {
  const value = text.match(pattern)?.[0];
  assert(value, `${name} is missing`);
  return { text: value, bytes: Buffer.byteLength(value), sha256: sha256(value) };
}

const [worldBankPdf, ieaPdf, kenigsbergJson, whitmarshHtml, existingWorldBank] = await Promise.all([
  fetchBuffer(sources.worldBank.url),
  fetchBuffer(sources.iea.url),
  fetchBuffer(sources.kenigsberg.url),
  fetchBuffer(sources.whitmarsh.url),
  readFile(path.join(root, 'public', 'world-bank-desalination-impact-snapshot.json'), 'utf8'),
]);

for (const [key, blob] of Object.entries({ worldBank: worldBankPdf, iea: ieaPdf, kenigsberg: kenigsbergJson, whitmarsh: whitmarshHtml })) {
  assert.equal(blob.length, expected[key].bytes, `${key} byte count changed`);
  assert.equal(sha256(blob), expected[key].sha256, `${key} checksum changed`);
}

const worldBankSnapshot = JSON.parse(existingWorldBank);
assert.equal(worldBankSnapshot.assessment.people_supplied_daily_million, 300);
const kenigsbergRecord = JSON.parse(kenigsbergJson.toString('utf8'));
const kenigsbergText = kenigsbergRecord[0].documents[0].passages.map(passage => passage.text ?? '').join(' ').replace(/\s+/g, ' ');
const whitmarshText = compactHtml(whitmarshHtml);

const verifiedClaims = {
  kenigsbergTwoOfThree: claim(kenigsbergText,
    /most robust responses were observed at two out of three desalination shallow sites[\s\S]{0,500}?control stations\./i,
    'Kenigsberg two-of-three-site claim'),
  kenigsbergSalinityOnly: claim(kenigsbergText,
    /most noticeable response to exclusively elevated salinity was detected at Sorek discharge site[\s\S]{0,300}?elevated salinity\./i,
    'Kenigsberg salinity-only claim'),
  whitmarshNoFishEffect: claim(whitmarshText,
    /found no evidence that the saline waste was having a detrimental effect on fish assemblages in proximity to the outfall, with species diversity and abundance comparable to those observed at reference sites\./i,
    'Whitmarsh fish-assemblage claim'),
  whitmarshTransferLimit: claim(whitmarshText,
    /Whether our findings are consistent to the effects of other desalinisation plants on fish assemblages is difficult to assess\.[\s\S]{0,500}?environmental conditions\./i,
    'Whitmarsh transfer-limit claim'),
};

const snapshot = {
  version: 'tulip_desalination_dependence_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'reliance_separated_from_harm_with_local_ecological_heterogeneity',
  productionRatingsEnabled: 0,
  purpose: 'Correct the false conversion of people supplied by desalination into people harmed, while adding direct local ecological studies that show both adverse benthic responses and no detectable fish-assemblage harm.',
  sources: {
    worldBank: { ...sources.worldBank, retrievedOn: checkedOn, fetchedDocument: expected.worldBank },
    iea: {
      ...sources.iea, retrievedOn: checkedOn, fetchedDocument: expected.iea,
      documentedContext: {
        menaDesalinatedWaterBillionM3PerYear2023: 11,
        menaShareFreshwaterWithdrawalsPercent2023: 3.5,
        menaShareGlobalInstalledCapacityMoreThanPercent: 40,
        menaShareTotalEnergyDemandPercent2023: 4,
        currentElectricityKwhPerM3Range: [3, 6],
      },
      interpretation: 'These are production, reliance and energy-system quantities. They do not count people harmed by desalination or measure marine ecosystem condition.',
    },
    kenigsberg: { ...sources.kenigsberg, retrievedOn: checkedOn, fetchedDocument: expected.kenigsberg, verifiedClaims: [verifiedClaims.kenigsbergTwoOfThree, verifiedClaims.kenigsbergSalinityOnly] },
    whitmarsh: { ...sources.whitmarsh, retrievedOn: checkedOn, fetchedDocument: expected.whitmarsh, verifiedClaims: [verifiedClaims.whitmarshNoFishEffect, verifiedClaims.whitmarshTransferLimit] },
  },
  currentWindow: {
    start: 2016,
    end: 2018,
    coverageStatus: 'partial',
    summaryMethod: 'period_prevalence',
    coverageNote: 'The compatible direct ecological studies cover three Israeli facilities sampled in 2016–2017 and one South Australian facility sampled in 2015 and 2018. The 2025 IEA report updates reliance and energy context but not global terminal harm.',
  },
  endpoints: {
    relianceAndBenefitContext: {
      peopleSuppliedDailyMillionApproximate2019: 300,
      globalPlantsLowerBound2019: 20_000,
      countriesUsingDesalinationLowerBound2019: 150,
      interpretation: 'People receiving drinking water are beneficiaries or users who depend on the service. They are not an observed harmed population.',
    },
    humanConsequences: {
      compatibleCurrentHarmedPersonCount: null,
      compatibleCurrentSeverityEndpoint: null,
      compatibleCurrentRecoveryDuration: null,
      interpretation: 'Current sources establish reliance, energy demand and operational vulnerability, but do not provide a compatible global count or duration of attributable service loss, illness, displacement or material loss.',
    },
    ecosystemConsequences: {
      facilitiesWithDirectStudyEvidence: 4,
      israeliSitesWithRobustBenthicResponse: 2,
      israeliSitesStudied: 3,
      australianFishStudyDetectedDetrimentalEffect: false,
      affectedAreaExamplesKm2: { ashkelon: 1.2, hadera: 0.9, sorekRange: [0.5, 1.5] },
      compatibleGlobalEcosystemConditionLossPercent: null,
      compatibleGlobalEcosystemDistributionAffectedPercent: null,
      compatibleRecoveryDuration: null,
      interpretation: 'The studies establish material but local and taxon-specific effects with clear heterogeneity. Plant count, brine volume and plume area cannot become a global affected-ecosystem share.',
    },
  },
  tulipUse: {
    admitted: [
      'Use people supplied and regional water shares only as reliance and benefit context.',
      'Use the Israeli outfall-control comparisons as evidence that brine and co-occurring heat can materially change local benthic communities.',
      'Use the Sorek result as evidence that salinity alone can affect a sensitive benthic group locally.',
      'Use the South Australian result to retain heterogeneity and prevent universal ecosystem-harm assumptions.',
      'Use the small reported disturbed areas as local scale context, not a global ecosystem denominator.',
    ],
    prohibited: [
      'Do not treat 300 million people supplied as 300 million people harmed.',
      'Do not treat plant count, country count, installed capacity, production volume or freshwater share as human reach.',
      'Do not treat brine volume, energy intensity or energy demand as ecosystem severity or reach.',
      'Do not generalize four studied facilities to all facilities or all marine ecosystems.',
      'Do not treat one year of ecological sampling or years of plant operation as recovery duration.',
      'Do not count energy-related carbon consequences again; they remain with energy and emissions nodes.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'desalination_dependence',
      rating: 'B 4.0',
      uncertainty: 'A 2.1 to C 6.3',
      confidence: 'C',
      domains: ['human', 'ecosystem'],
      reason: 'Desalination can create operational vulnerability and local marine effects, but it also provides water security. The former C rating assigned maximum human reach from beneficiaries. Direct ecological studies show local adverse responses and no detectable fish effect at another facility, supporting a lower central rating and wide bounds.',
    },
  },
  unresolvedForTulip: [
    'Join comparable outage, affordability, service-loss and public-health records to desalination-dependent populations without counting all users as harmed.',
    'Build a representative multi-region sample of marine condition around intakes and outfalls with common taxa, controls and effect sizes.',
    'Estimate affected marine-habitat share using an ecosystem-distribution denominator rather than plants, plume volume or study coverage.',
    'Measure ecological recovery after discharge reduction, diffuser changes or plant closure.',
    'Separate desalination operation from co-located power-plant heat, construction, artificial-reef and fishing-exclusion effects.',
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
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  correctedHarmedPersonCount: snapshot.endpoints.humanConsequences.compatibleCurrentHarmedPersonCount,
  directEcologicalFacilities: snapshot.endpoints.ecosystemConsequences.facilitiesWithDirectStudyEvidence,
  digest: snapshot.snapshotDigest,
}, null, 2));
