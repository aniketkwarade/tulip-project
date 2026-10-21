import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'coastal-groundwater-withdrawal-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+coastal-groundwater-evidence-ingestion)';

const source = {
  id: 'usgs_cape_may_groundwater_allocation_2020',
  publisher: 'U.S. Geological Survey',
  title: 'Simulation of Potential Water Allocation Changes, Cape May County, New Jersey',
  publicationDate: '2020',
  doi: 'https://doi.org/10.3133/sir20205052',
  url: 'https://pubs.usgs.gov/publication/sir20205052/full',
};

const expected = {
  communities: { bytes: 241, sha256: '43a248c1d6ae4807836f0a43fefb272de024119d48b13ce589149dd8077ff9bd' },
  persistence: { bytes: 178, sha256: '1ed7a657d62154149efb4e7f3c78a62a7c9592d75a29a14f71ebf316dd74baf8' },
  observedDuration: { bytes: 308, sha256: 'ce2ae0c4468aab77a66c5b4a2079f85f4289276dc4cc45ea6ebe0d9f3d8f2603' },
  f35: { bytes: 453, sha256: 'a7c488bc56c7d50180088f94d9042530f088378b03389369f12632cfb5cee0d2' },
  oyster: { bytes: 378, sha256: '81eda315ecf4877efca6ab1d52249e00333e6f256236fa4268c246e198adc3a2' },
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

const sourceBuffer = await fetchBuffer(source.url);
const text = pageText(sourceBuffer);
const verifiedClaims = {
  communities: extractClaim('single-aquifer communities claim', text,
    /Several communities in the county have only one aquifer[\s\S]*?caused by groundwater withdrawals\./i,
    expected.communities),
  persistence: extractClaim('continued-withdrawal persistence claim', text,
    /With continued withdrawals, water levels are unlikely to recover to above sea level[\s\S]*?saltwater intrusion is expected to continue\./i,
    expected.persistence),
  observedDuration: extractClaim('observed intrusion duration claim', text,
    /Saltwater intrusion in the Cohansey aquifer has been observed[\s\S]*?increasing since about 2003\./i,
    expected.observedDuration),
  f35: extractClaim('F-35 chloride claim', text,
    /Chloride concentrations in samples from observation well F-35 obs[\s\S]*?consistent with lateral saltwater intrusion\./i,
    expected.f35),
  oyster: extractClaim('Oyster Lab 4 chloride claim', text,
    /Chloride concentrations in samples from observation well Oyster Lab 4[\s\S]*?through 2018[\s\S]*?\)\./i,
    expected.oyster),
};

const snapshot = {
  version: 'tulip_coastal_groundwater_withdrawal_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'source_specific_current_condition_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a generic count parser that mistook five aquifers for five people with source-specific groundwater-condition evidence, while keeping communities, wells, aquifers and harmed people as separate quantities.',
  source: {
    ...source,
    retrievedOn: checkedOn,
    fetchedDocument: { bytes: sourceBuffer.length, sha256: sha256(sourceBuffer) },
    verifiedClaims,
  },
  currentWindow: {
    start: 2013,
    end: 2018,
    coverageStatus: 'partial',
    summaryMethod: 'end_state_stock',
    coverageNote: 'The report combines 2013 water levels with chloride observations ending between 2010 and 2018. It is not a complete annual countywide series.',
  },
  endpoints: {
    hydrologicCondition: {
      groundwaterLevel2013: 'More than 10 feet below sea level in the Wildwood Water Utility Rio Grande well field and south throughout Lower Township.',
      cohanseyIntrusionObservedSinceApproximateYear: 1987,
      rioGrandeWellFieldChlorideIncreaseSinceApproximateYear: 2003,
      f35ChlorideMgPerL: { startYear: 1975, start: 16, endYear: 2010, end: 1154 },
      oysterLab4ChlorideThrough2018MgPerLMaximum: 40,
      interpretation: 'Measured water levels and chloride records establish a persistent local aquifer condition. The contrasting wells also show that the condition is spatially uneven.',
    },
    humanServiceContext: {
      finding: 'Several Cape May County communities depend on one freshwater aquifer that the report describes as threatened by saltwater intrusion or withdrawal-related water-level decline.',
      compatibleHarmedPersonCount: null,
      interpretation: 'A community, well or aquifer count is not a count of people currently harmed, deprived of water or paying added costs.',
    },
    ecosystemCondition: {
      compatibleCurrentEndpoint: null,
      interpretation: 'The report models groundwater flow and salinity. It does not measure a compatible current percentage loss of wetland, estuarine or terrestrial ecosystem condition attributable to this node.',
    },
    modeledOutlook: {
      scenarioType: 'water-allocation alternatives',
      interpretation: 'Modeled alternatives test possible future groundwater responses. They are not observations of current harm and are excluded from the current rating axes.',
    },
  },
  tulipUse: {
    admitted: [
      'Use measured water levels and chloride trends to establish a persistent, source-specific local aquifer condition.',
      'Use single-aquifer community dependence as human service vulnerability context only.',
      'Use variation between monitoring wells to retain spatial uncertainty.',
      'Use the report year as evidence recency and the observation endpoints as the current-window boundary.',
    ],
    prohibited: [
      'Do not convert five aquifers, communities, wells or model scenarios into five people harmed.',
      'Do not convert threatened water supply into a measured current count of illness, deprivation or displacement.',
      'Do not treat chloride concentration as the percentage of human or ecosystem condition lost.',
      'Do not treat the years since 1958, 1975, 1987 or 2003 as the duration of every human or ecosystem consequence.',
      'Do not use modeled allocation alternatives as observed current burden.',
      'Do not generalize one New Jersey county to global reach without compatible evidence.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'coastal_groundwater_withdrawal',
      rating: 'C 4.8',
      uncertainty: 'A 2.5 to D 7.0',
      confidence: 'C',
      domains: ['human', 'ecosystem'],
      reason: 'The report directly establishes long-lived local aquifer degradation and water-supply vulnerability, but it does not quantify people currently harmed or a compatible ecosystem-condition endpoint. The central rating is retained while the bounds widen to remove false precision from the prior five-person parse.',
    },
  },
  unresolvedForTulip: [
    'Obtain a current, compatible count of people experiencing attributable water-service loss, unsafe salinity, added treatment cost or displacement.',
    'Obtain current ecosystem-condition, affected-extent and recovery measurements attributable to coastal groundwater withdrawal.',
    'Extend compatible monitoring beyond 2018 and distinguish withdrawal effects from sea-level, drought and other salinity drivers.',
    'Add comparable source-specific assessments outside Cape May County before assigning broad geographic reach.',
  ],
};

snapshot.snapshotDigest = digest({
  source: snapshot.source,
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
  currentObservationEnd: snapshot.currentWindow.end,
  correctedHarmedPersonCount: snapshot.endpoints.humanServiceContext.compatibleHarmedPersonCount,
  digest: snapshot.snapshotDigest,
}, null, 2));
