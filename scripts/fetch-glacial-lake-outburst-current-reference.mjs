import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'glacial-lake-outburst-current-reference-snapshot.json');
const checkedOn = '2026-09-24';
const sha256 = value => createHash('sha256').update(value).digest('hex');

const sources = {
  thame2025: {
    id: 'icimod_ndrrma_thame_glof_2025',
    title: 'Thame Valley Glacial Lake Outburst Flood 2024: Causes, impacts and future risks',
    publisher: 'International Centre for Integrated Mountain Development (ICIMOD); National Disaster Risk Reduction & Management Authority (NDRRMA)',
    publicationDate: '2025-09-24',
    doi: 'https://doi.org/10.53055/ICIMOD.1101',
    recordUrl: 'https://lib.icimod.org/records/8g9ze-1r153',
    apiUrl: 'https://lib.icimod.org/api/records/8g9ze-1r153',
  },
  southLhonak2026: {
    id: 'mishra_south_lhonak_glof_2026',
    title: 'Sequence of events that led to the South Lhonak lake outburst flood in Sikkim, India',
    publisher: 'Scientific Reports',
    publicationDate: '2026-03-24',
    doi: 'https://doi.org/10.1038/s41598-026-35895-7',
    articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13013771/',
    xmlUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=13013771',
    pinnedXml: {
      bytes: 101_185,
      sha256: '2bae5b71057046c0b0bf2cfb94ecaf4904e407baf6f60afd00bd6ae1a78aab4d',
    },
  },
  globalHistory2023: {
    id: 'lutzow_global_glof_database_2023',
    title: 'A global database of historic glacier lake outburst floods',
    publisher: 'Earth System Science Data',
    publicationDate: '2023-07-12',
    doi: 'https://doi.org/10.5194/essd-15-2983-2023',
    articleUrl: 'https://essd.copernicus.org/articles/15/2983/2023/',
    xmlUrl: 'https://essd.copernicus.org/articles/15/2983/2023/essd-15-2983-2023.xml',
    pinnedXml: {
      bytes: 162_916,
      sha256: 'bfdcc211861facc1c0a3fe8caa37e09c58d788e8e22836ca626b349dc8340192',
    },
  },
  globalExposure2023: {
    id: 'global_glof_exposure_2023',
    title: 'Glacial lake outburst floods threaten millions globally',
    publisher: 'Nature Communications',
    publicationDate: '2023-02-07',
    doi: 'https://doi.org/10.1038/s41467-023-36033-x',
  },
};

async function fetchBuffer(url, maximumBytes = 2_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: {
      accept: '*/*',
      'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+glacial-lake-outburst-evidence-ingestion)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

function plainText(xml) {
  return xml.toString('utf8')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertPinned(body, source, label) {
  assert.equal(body.length, source.pinnedXml.bytes, `${label}: byte size changed`);
  assert.equal(sha256(body), source.pinnedXml.sha256, `${label}: checksum changed`);
}

const [thameBody, southLhonakXml, globalHistoryXml] = await Promise.all([
  fetchBuffer(sources.thame2025.apiUrl),
  fetchBuffer(sources.southLhonak2026.xmlUrl),
  fetchBuffer(sources.globalHistory2023.xmlUrl),
]);

const thameRecord = JSON.parse(thameBody);
assert.equal(thameRecord.metadata.title, sources.thame2025.title);
assert.equal(thameRecord.metadata.publisher, sources.thame2025.publisher);
assert.equal(thameRecord.metadata.publication_date, sources.thame2025.publicationDate);
assert(thameRecord.metadata.identifiers.some(item => item.scheme === 'doi' && item.identifier === '10.53055/ICIMOD.1101'));
assert.equal(thameRecord.files.total_bytes, 15_440_529);
const thameFile = thameRecord.files.entries['Thame Valey GLOF 2024-n.pdf'];
assert.equal(thameFile.checksum, 'md5:043c510335b1328bad9bc182325204cf');

assertPinned(southLhonakXml, sources.southLhonak2026, 'South Lhonak article XML');
assertPinned(globalHistoryXml, sources.globalHistory2023, 'global historical GLOF database XML');
const southLhonakText = plainText(southLhonakXml);
const globalHistoryText = plainText(globalHistoryXml);
const thameText = plainText(Buffer.from(thameRecord.metadata.description));

assert.match(southLhonakText, /24 fatalities and leaving over 70 persons missing/i);
assert.match(southLhonakText, /Over 60,000 individuals in four districts of Sikkim were impacted/i);
assert.match(southLhonakText, /destroyed 13 bridges and a major hydropower plant/i);
assert.match(globalHistoryText, /3151 reported GLOFs that occurred in 27 countries between 850 and 2022/i);
assert.match(globalHistoryText, /44 GLOFs have killed at least 3636 people/i);
assert.match(globalHistoryText, /only 12\s*% of all reported GLOFs \(\s*n\s*=\s*2484\s*\) had damage/i);
assert.match(globalHistoryText, /Less than one-quarter of all reported cases feature hydrodynamic characteristics/i);
assert.match(thameText, /displacing 135 people/i);
assert.match(thameText, /carrying debris over 80 km/i);
assert.match(thameText, /Sediment deposition, severe erosion, land subsidence, and tension cracks/i);

const sharedAxes = {
  human: {
    severity: { lower: 4, central: 4, upper: 4 },
    reach: { lower: 1, central: 2, upper: 2 },
    persistence: { lower: 4, central: 4, upper: 4 },
  },
  ecosystem: {
    severity: { lower: 0, central: 1, upper: 2 },
    reach: { lower: 0, central: 1, upper: 2 },
    persistence: { lower: 1, central: 2, upper: 3 },
  },
};

const snapshot = {
  version: 'tulip_glacial_lake_outburst_current_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_event_consequences_and_exposure_boundary_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace potential downstream exposure as a harm proxy with recent observed event consequences, while retaining historical under-reporting, compound attribution and missing ecosystem denominators as explicit uncertainty.',
  appliesToNodeIds: ['glacial_lake_failure_risk', 'glacier_hydrologic_system_floods'],
  sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => [key, {
    id: source.id,
    title: source.title,
    publisher: source.publisher,
    publicationDate: source.publicationDate,
    url: source.doi,
    ...(source.articleUrl ? { articleUrl: source.articleUrl } : {}),
    ...(source.recordUrl ? { recordUrl: source.recordUrl } : {}),
    ...(source.pinnedXml ? { fetchedXml: source.pinnedXml } : {}),
  }])),
  evidence: {
    currentHumanConsequences: {
      observationPeriod: { start: 2023, end: 2024 },
      southLhonak2023: {
        eventDate: '2023-10-04',
        fatalities: 24,
        missingPeopleLowerBound: 70,
        impactedPeopleLowerBound: 60_000,
        residencesDestroyed: 1_200,
        bridgesDestroyed: 13,
        majorHydropowerPlantsDestroyed: 1,
        geography: 'four districts of Sikkim, India',
      },
      thame2024: {
        eventDate: '2024-08-16',
        displacedPeople: 135,
        damagedAssets: ['homes', 'schools', 'health facilities', 'bridges', 'hotels', 'farmland', 'hydropower facilities'],
        debrisFlowDistanceKm: 80,
        geography: 'Thame Valley and the Thame and Dudh Koshi rivers, Nepal',
      },
      aggregationBoundary: 'The recent event records show level-4 terminal severity because deaths occurred, level-2 current reach because the largest compatible observed affected count is over 60,000, and permanent persistence for fatalities. The two event counts are not extrapolated to all mountain communities.',
    },
    historicalEventDistribution: {
      recordPeriod: { start: 850, end: 2022 },
      reportedEvents: 3_151,
      countries: 27,
      eventsWithReportedFatalities: 44,
      reportedFatalitiesLowerBound: 3_636,
      eventsFrom1900To2022: 2_484,
      shareWithReportedDamagePercent: 12,
      shareWithHydrodynamicOrLossAndDamageDetail: 'less_than_one_quarter',
      boundary: 'The catalogue establishes that fatal and damaging events occur, but reporting density varies and an unknown number of events is missing. It is historical calibration, not a current annual harmed-person total.',
    },
    ecosystemAndGeomorphicConsequences: {
      directObservations: ['debris transport over more than 80 km', 'severe erosion', 'sediment deposition', 'land subsidence', 'tension cracks and valley destabilisation'],
      compatibleEcosystemConditionLossPercent: null,
      compatibleAffectedEcosystemDistributionPercent: null,
      compatibleRecoveryTimeDistribution: null,
      boundary: 'The Thame report directly establishes major geomorphic disturbance. It does not quantify biological condition loss, the share of a defined ecosystem distribution affected, or recovery time, so those axes remain structured and wide.',
    },
    exposureContext: {
      potentiallyExposedPeople: 15_000_000,
      use: 'risk context only',
      excludedFromCurrentReach: true,
      reason: 'The global exposure assessment estimates people living within potential GLOF runout zones. It does not report that all exposed people were harmed in the current assessment window.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate: {
      prior: { value: 7, grade: 'D', lower: 5.1, upper: 8.9, confidence: 'C' },
      revised: { value: 6.3, grade: 'C', lower: 4.8, upper: 7.4, confidence: 'C' },
    },
    axes: sharedAxes,
    reasoning: [
      'Use observed deaths, displacement and essential-service damage for human severity instead of lake size or exposure. Because reported deaths occurred in the current window, human severity is level 4 in the low, central and high cases.',
      'Use the over-60,000 observed impacted-person count for current human reach. Do not use the 15 million potentially exposed population.',
      'Treat fatalities as permanent terminal consequences, without adding repeated events or record duration as extra persistence.',
      'Use Thame geomorphic disturbance only as bounded ecosystem context because no compatible condition-loss, distribution or recovery denominator is reported.',
      'Treat the two node scores as alternative views of overlapping GLOF pathways; they cannot be added together.',
    ],
    excludedUses: [
      'Do not convert the 15 million potentially exposed people into current harmed reach.',
      'Do not sum reported fatalities across the 850–2022 historical record into the 2023–2024 current window.',
      'Do not treat 80 km of debris travel as 80 km of ecosystem condition loss or as a global distribution percentage.',
      'Do not infer ecosystem recovery time from the age of the historical database or the duration of physical monitoring.',
      'Do not assign all South Lhonak or Thame consequences solely to climate change; both events include local landslide, lake, dam, valley and exposure conditions.',
      'Do not add Glacial Lake Outburst Flood Risk and Glacier Hydrologic System Floods scores or consequences together.',
    ],
    exactRemainingGaps: [
      'A current global event-loss panel with consistent unique-person, service-duration and recovery fields.',
      'Measured biological ecosystem-condition loss joined to mapped GLOF footprints and a defined ecosystem-distribution denominator.',
      'Representative recovery-time distributions for affected river, floodplain and valley ecosystems.',
      'A source-removal or event-attribution model separating climate, local slope failure, lake geometry, dam condition, exposure and protection.',
    ],
  },
};

snapshot.snapshotDigest = sha256(Buffer.from(JSON.stringify(snapshot)));
await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ output, snapshotDigest: snapshot.snapshotDigest }, null, 2));
