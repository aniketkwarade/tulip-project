import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'harmful-algal-blooms-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+harmful-algal-bloom-evidence-ingestion)';

const expected = {
  globalCompositionClaim: { bytes: 875, sha256: '567830adc0e873c19ac43d86dcd82b2ba33eeb60c94414653ec156fe824bbd27' },
  globalTrendClaim: { bytes: 1_104, sha256: '5ed4934254aadf43cfb6de4e463013d4c579f397ec29a6e37def50262bda8bee' },
  globalHumanClaim: { bytes: 3_321, sha256: '768473db37aa2c7e7503dba01ce8b0574cd0eede045d60a749d0d2951657a689' },
  globalManagementClaim: { bytes: 1_934, sha256: 'ed7d4b96afe0f3e71e8e6fa415d20dd2fbd9090cfa501e6600298de2b50eb39e' },
  currentMassMortalityClaim: { bytes: 1_376, sha256: 'a00a9925c097f4699b04f85da88536c263e8ac57428c9b274ae13327308e1697' },
  currentMassMortalityData: { bytes: 89_043, sha256: '5ac8fee02512dc666cb87b31ffddb9766b6d84fa34f8ef5fdf2fa2a8f097a671' },
  ciguateraReport: { bytes: 2_551_184, sha256: '324bcbb0302e9b1e96f0baab5829059fb516f3fd0186f7364fb1bf3d77efbbae' },
  ipccMarineClaim: { bytes: 2_146, sha256: '52db14d60fc3d9654a252c2d8305560fb408412b332cbdbfef03bf7bc7c55c78' },
  ipccHealthClaim: { bytes: 593, sha256: 'edb1b2fc8fb2ceca1028808a8c4b7ed1181fb8a764608ca9ab30dfc768b5e4e9' },
};

const sources = {
  globalAssessment: {
    id: 'hallegraeff_global_hab_assessment_2021',
    publisher: 'Communications Earth & Environment',
    title: 'Perceived global increase in algal blooms is attributable to intensified monitoring and emerging bloom impacts',
    publicationDate: '2021-06-08',
    articleUrl: 'https://www.nature.com/articles/s43247-021-00178-8',
    doi: 'https://doi.org/10.1038/s43247-021-00178-8',
  },
  ciguateraAssessment: {
    id: 'fao_who_ciguatera_expert_meeting_2020',
    publisher: 'Food and Agriculture Organization of the United Nations and World Health Organization',
    title: 'Report of the Expert Meeting on Ciguatera Poisoning',
    publicationDate: '2020',
    pdfUrl: 'https://www.fao.org/3/ca8817en/CA8817EN.pdf',
    isbn: '978-92-5-132518-6',
  },
  currentMortality: {
    id: 'murray_south_australia_hab_mortality_2026',
    publisher: 'Nature Ecology & Evolution',
    title: 'A catastrophic marine mortality event caused by a complex algal bloom including the brevetoxin producer Karenia cristata',
    publicationDate: '2026-07-06',
    articleUrl: 'https://www.nature.com/articles/s41559-026-03115-0',
    doi: 'https://doi.org/10.1038/s41559-026-03115-0',
    supplementaryDataUrl: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41559-026-03115-0/MediaObjects/41559_2026_3115_MOESM4_ESM.zip',
  },
  ipccMarine: {
    id: 'ipcc_ar6_wgii_chapter3_hab_assessment',
    publisher: 'Intergovernmental Panel on Climate Change',
    title: 'AR6 Working Group II, Chapter 3: Oceans and Coastal Ecosystems and their Services',
    publicationDate: '2022-02-28',
    chapterUrl: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
  },
  ipccHealth: {
    id: 'ipcc_ar6_wgii_chapter7_hab_health_outlook',
    publisher: 'Intergovernmental Panel on Climate Change',
    title: 'AR6 Working Group II, Chapter 7: Health, Wellbeing and the Changing Structure of Communities',
    publicationDate: '2022-02-28',
    chapterUrl: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/',
  },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const decodeHtml = value => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#xA0;/gi, ' ')
  .replace(/&ndash;|&#8211;|&#x2013;/gi, '–')
  .replace(/&mdash;|&#8212;|&#x2014;/gi, '—')
  .replace(/&plusmn;|&#177;|&#xB1;/gi, '±')
  .replace(/&minus;|&#8722;|&#x2212;/gi, '−')
  .replace(/&deg;|&#176;/gi, '°')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#x27;|&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

async function fetchBuffer(url, accept) {
  const args = [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
  ];
  if (accept) args.push('--header', `Accept: ${accept}`);
  args.push(url);
  const { stdout } = await execFileAsync('curl', args, { encoding: null, maxBuffer: 200_000_000, timeout: 130_000 });
  return stdout;
}

function paragraphContaining(buffer, needle) {
  const html = buffer.toString('utf8');
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => decodeHtml(match[1]));
  const paragraph = paragraphs.find(value => value.includes(needle));
  assert(paragraph, `Official source paragraph is missing: ${needle}`);
  return paragraph;
}

function verifyClaim(name, value, pinned) {
  assert.equal(Buffer.byteLength(value), pinned.bytes, `${name} byte count changed`);
  assert.equal(sha256(value), pinned.sha256, `${name} checksum changed`);
}

const [globalPage, ciguateraPdf, currentMortalityPage, currentMortalityData, ipccMarinePage, ipccHealthPage] = await Promise.all([
  fetchBuffer(sources.globalAssessment.articleUrl, 'text/html'),
  fetchBuffer(sources.ciguateraAssessment.pdfUrl, 'application/pdf'),
  fetchBuffer(sources.currentMortality.articleUrl, 'text/html'),
  fetchBuffer(sources.currentMortality.supplementaryDataUrl, 'application/zip'),
  fetchBuffer(sources.ipccMarine.chapterUrl, 'text/html'),
  fetchBuffer(sources.ipccHealth.chapterUrl, 'text/html'),
]);

const claims = {
  globalComposition: paragraphContaining(globalPage, 'As of 10 December 2019'),
  globalTrend: paragraphContaining(globalPage, 'Once HAEDAT events were adjusted'),
  globalHuman: paragraphContaining(globalPage, 'Globally, some 11,000'),
  globalManagement: paragraphContaining(globalPage, 'Apart from increased observational efforts'),
  currentMassMortality: paragraphContaining(currentMortalityPage, 'During 2025 an unprecedented mass marine mortality occurred'),
  ipccMarine: paragraphContaining(ipccMarinePage, 'appear to jointly favour the proliferation'),
  ipccHealth: paragraphContaining(ipccHealthPage, 'Harmful algal blooms are projected to increase globally'),
};
verifyClaim('Global event composition', claims.globalComposition, expected.globalCompositionClaim);
verifyClaim('Monitoring-adjusted trend', claims.globalTrend, expected.globalTrendClaim);
verifyClaim('Human consequences', claims.globalHuman, expected.globalHumanClaim);
verifyClaim('Management and recovery', claims.globalManagement, expected.globalManagementClaim);
verifyClaim('Current mass mortality', claims.currentMassMortality, expected.currentMassMortalityClaim);
verifyClaim('IPCC marine assessment', claims.ipccMarine, expected.ipccMarineClaim);
verifyClaim('IPCC health outlook', claims.ipccHealth, expected.ipccHealthClaim);
assert.equal(ciguateraPdf.length, expected.ciguateraReport.bytes, 'FAO/WHO report byte count changed');
assert.equal(sha256(ciguateraPdf), expected.ciguateraReport.sha256, 'FAO/WHO report checksum changed');
assert.equal(currentMortalityData.length, expected.currentMassMortalityData.bytes, 'Supplementary data byte count changed');
assert.equal(sha256(currentMortalityData), expected.currentMassMortalityData.sha256, 'Supplementary data checksum changed');
assert.equal(currentMortalityData.subarray(0, 4).toString('hex'), '504b0304', 'Supplementary data is not a ZIP archive');

const snapshot = {
  version: 'tulip_harmful_algal_blooms_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_human_and_ecosystem_consequences_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace event-count, monitoring-coverage and record-length scoring with separate current human illness, ecosystem mortality, reach and consequence-duration evidence while retaining the different marine and freshwater evidence boundaries.',
  sources: {
    globalAssessment: {
      ...sources.globalAssessment,
      compositionClaim: { ...expected.globalCompositionClaim, retrievedOn: checkedOn },
      monitoringAdjustedTrendClaim: { ...expected.globalTrendClaim, retrievedOn: checkedOn },
      humanConsequencesClaim: { ...expected.globalHumanClaim, retrievedOn: checkedOn },
      managementClaim: { ...expected.globalManagementClaim, retrievedOn: checkedOn },
    },
    ciguateraAssessment: {
      ...sources.ciguateraAssessment,
      fetchedDocument: { ...expected.ciguateraReport, retrievedOn: checkedOn },
      locators: {
        executiveSummary: 'PDF printed page xvii; file page 19',
        chronicSymptoms: 'PDF printed page 69; file page 89',
        epidemiology: 'PDF printed page 79; file page 99',
        backCoverSummary: 'PDF file page 156',
      },
    },
    currentMortality: {
      ...sources.currentMortality,
      abstractClaim: { ...expected.currentMassMortalityClaim, retrievedOn: checkedOn },
      supplementaryData: { ...expected.currentMassMortalityData, format: 'ZIP containing sequence alignments', retrievedOn: checkedOn },
    },
    ipccMarine: {
      ...sources.ipccMarine,
      assessmentClaim: { ...expected.ipccMarineClaim, retrievedOn: checkedOn },
    },
    ipccHealth: {
      ...sources.ipccHealth,
      outlookClaim: { ...expected.ipccHealthClaim, retrievedOn: checkedOn },
    },
  },
  endpoints: {
    globalEventRecord: {
      observationPeriod: { start: 1985, end: 2018 },
      databaseCutoff: '2019-12-10',
      recordedEvents: 9_503,
      eventSharesPercent: { seafoodBiotoxin: 48, socioeconomicHighCountsOrDiscoloration: 43, massAnimalOrPlantMortality: 7, other: 2 },
      recordsWithMultipleEventTypesPercent: 11,
      monitoringAdjustedTrend: { correlation: 0.35, z: 1.33, p: 0.18, result: 'no statistically significant uniform global trend' },
      boundary: 'HAEDAT records harmful marine events and has no matching negative-event inventory. Event counts, region counts and event-type shares do not measure harmed-population reach, ecosystem condition loss or recovery time.',
    },
    humanConsequences: {
      ciguateraAnnualAffectedPeople: { lower: 10_000, upper: 50_000, globalAssessmentEstimate: true },
      alternateUnderreportingEstimate: { lower: 50_000, upper: 500_000, source: 'FAO/WHO expert report chapter 6', scoringBoundary: 'Still below the one-million TULIP reach anchor; retained as uncertainty, not added to the 10,000–50,000 estimate.' },
      chronicSymptomShareLowerBoundPercent: 20,
      chronicDefinition: 'Symptoms continuing beyond three months after the initial poisoning.',
      duration: 'Neurological, psychiatric or general symptoms can persist for months or years in a subset of affected people.',
      severity: 'The FAO/WHO expert group documents severe neurological, cardiovascular and respiratory presentations as well as rare deaths; the common global burden cannot be treated as uniformly severe.',
      boundary: 'Ciguatera is one HAB-related syndrome. It establishes a quantified global human lower bound and duration evidence, not the full worldwide burden of every marine and freshwater bloom.',
    },
    currentEcosystemEvent: {
      location: 'South Australia',
      startYear: 2025,
      affectedAreaApproximateKm2: 20_000,
      durationMonthsLowerBound: 12,
      deathsApproximate: 1_000_000,
      affectedTaxaLowerBound: 600,
      attribution: 'The study isolated and characterized a brevetoxin-producing Karenia species and linked it to the mass mortality event using metabarcoding, targeted assays and toxicology.',
      boundary: 'This is a severe regional event and an upper-bound severity example. Counts of organisms and taxa are not a percentage movement toward global ecosystem collapse, and 20,000 km² is not global ecosystem reach.',
    },
    persistenceAndRecovery: {
      human: 'At least 20% of ciguatera-affected people may have symptoms beyond three months; some symptoms persist for months or years.',
      ecosystem: 'The current South Australian bloom and associated mortality persisted longer than twelve months. Global ecosystem recovery after HAB mortality is not quantified.',
      management: 'The global assessment reports that shellfish-toxin impacts can fall rapidly under effective monitoring, while finfish-aquaculture industries may take years to rebuild after mass mortality.',
      boundary: 'Bloom duration, symptom duration, economic rebuilding and ecological recovery are separate. The 1985–2018 observation record is not persistence.',
    },
    outlook: {
      direction: 'worsening',
      confidence: 'B',
      assessment: 'IPCC assesses increasing future likelihood and health risk from HABs, while also finding limited evidence and regional variation for marine mechanisms and no uniform monitoring-adjusted global historical trend.',
      boundary: 'The evidence supports direction under continued warming, not a numerical SSP2-4.5 change for 2027–2036. Nutrient management, monitoring and regional ocean conditions can change outcomes.',
    },
  },
  tulipUse: {
    admitted: [
      'Use ciguatera illness counts as a quantified global human-reach lower bound and the FAO/WHO chronic-symptom evidence to bound human persistence.',
      'Use documented severe poisoning presentations to support a material-illness central severity with a severe-illness upper bound.',
      'Use the 2025–2026 South Australian event as direct evidence that current blooms can cause large regional multi-taxon mortality lasting longer than one year.',
      'Use HAEDAT regional coverage and event composition only to show that the problem is multi-region and heterogeneous; keep the missing ecosystem-distribution denominator explicit.',
      'Use IPCC assessments for outlook direction and uncertainty without converting end-century or qualitative statements into a 2027–2036 magnitude.',
    ],
    prohibited: [
      'Do not sum the 48%, 43%, 7% and 2% event shares because 11% of records have multiple event types.',
      'Do not use 9,503 reports, twelve assessment regions or the number of monitored grids as human or ecosystem reach.',
      'Do not treat the 7% mass-mortality event share as 7% ecosystem collapse or local condition loss.',
      'Do not use the 34-year HAEDAT record as human symptom duration, bloom duration or ecosystem recovery time.',
      'Do not scale the South Australian million-animal mortality count into a global population or ecosystem percentage.',
      'Do not add connected Fish Landing Supply Disruption, seafood safety, hypoxia, tourism or water-treatment scores.',
      'Do not assign all HAB occurrence or harm to climate change; nutrient loading, monitoring effort, exposure and management remain active causes and modifiers.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'harmful_algal_blooms',
      rating: 'C 5.5',
      uncertainty: 'B 3.6 to D 7.4',
      confidence: 'C',
      domains: ['human', 'ecosystem'],
      centralAxes: { human: [2, 2, 2], ecosystem: [2, 2, 2] },
      lowerAxes: { human: [1, 2, 1], ecosystem: [1, 1, 1] },
      upperAxes: { human: [3, 2, 3], ecosystem: [3, 3, 3] },
      reason: 'Current sources quantify a global human lower bound and document severe regional ecosystem mortality, but no compatible worldwide ecosystem-condition or affected-distribution denominator exists. The corrected central result therefore remains a structured C with wide B–D bounds.',
    },
  },
  unresolvedForTulip: [
    'A complete current global HAB illness inventory covering all syndromes, freshwater and marine exposures, and underreporting.',
    'A global affected-ecosystem denominator paired with condition loss rather than reports, taxa counts or event shares.',
    'Comparable ecological recovery estimates across bloom types and affected ecosystems.',
    'A scenario-matched SSP2-4.5 projection for 2027–2036 that separates climate, nutrient, monitoring and management effects.',
  ],
};

snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ output, version: snapshot.version, digest: snapshot.snapshotDigest }, null, 2));
