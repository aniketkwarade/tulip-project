import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'coastal-groundwater-current-reference-snapshot.json');
const checkedOn = '2026-09-24';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+coastal-groundwater-current-evidence-ingestion)';

const source = {
  id: 'usgs_virginia_coastal_plain_groundwater_budgets_2026',
  publisher: 'U.S. Geological Survey',
  title: 'Computation of regional groundwater budgets for the Virginia Coastal Plain aquifer system',
  publicationDate: '2026-04-16',
  doi: 'https://doi.org/10.3133/ofr20261002',
  metadataUrl: 'https://pubs.usgs.gov/pubs-services/publication/ofr20261002',
  reportUrl: 'https://pubs.usgs.gov/of/2026/1002/ofr20261002.pdf',
  dataReleaseUrl: 'https://doi.org/10.5066/P13GJEYW',
};

const expected = {
  publicationId: 70_275_076,
  publicationYear: '2026',
  report: {
    bytes: 6_616_534,
    sha256: '0283737b02eab5be37e602ba3283eb2443711b4f75693ca48186697d9d667ae4',
  },
  claims: {
    partialRecovery: { bytes: 515, sha256: 'cf17569ca9cb73b9c23d48a008fd444db252cb76ea6978af8f7c32a6fd3e018f' },
    easternShoreStorage: { bytes: 435, sha256: '72615f4cd6220d2f92ed61189b1b626e8e61f53b980e55611a334d5e266a88a5' },
    salinityConcern: { bytes: 241, sha256: '3522f0b812ca70efa59ec90198a2e9079413b60aa963378e37036eec542adea5' },
    notMeasured: { bytes: 134, sha256: 'fed965add5562a487b576c641e4f86699f116af6e09d996eeff3675b343735a7' },
  },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 10_000_000, timeout: 190_000 });
  return stdout;
}

function pageText(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractClaim(name, text, pattern, pinned) {
  const value = text.match(pattern)?.[0];
  assert(value, `${name} is missing`);
  assert.equal(Buffer.byteLength(value), pinned.bytes, `${name} byte count changed`);
  assert.equal(sha256(value), pinned.sha256, `${name} checksum changed`);
  return { text: value, bytes: pinned.bytes, sha256: pinned.sha256 };
}

const [metadataBuffer, report] = await Promise.all([
  fetchBuffer(source.metadataUrl),
  fetchBuffer(source.reportUrl),
]);
const metadata = JSON.parse(metadataBuffer.toString('utf8'));
assert.equal(metadata.id, expected.publicationId);
assert.equal(metadata.title, source.title);
assert.equal(metadata.publicationYear, expected.publicationYear);
assert.equal(metadata.doi, '10.3133/ofr20261002');
assert.equal(report.subarray(0, 5).toString('ascii'), '%PDF-');
assert.equal(report.length, expected.report.bytes, 'USGS report byte count changed');
assert.equal(sha256(report), expected.report.sha256, 'USGS report checksum changed');

const abstract = pageText(metadata.docAbstract);
const verifiedClaims = {
  partialRecovery: extractClaim('partial storage recovery claim', abstract,
    /From 2010 to 2023, rates of withdrawal[\s\S]*?adjacent areas of Maryland and North Carolina\./,
    expected.claims.partialRecovery),
  easternShoreStorage: extractClaim('Eastern Shore storage claim', abstract,
    /For the most recent simulated period \(2023\), estimated storage loss[\s\S]*?groundwater levels appear to be relatively stable\./,
    expected.claims.easternShoreStorage),
  salinityConcern: extractClaim('salinity concern claim', abstract,
    /Estimated groundwater flow rates upward[\s\S]*?lateral intrusion of salty groundwater\./,
    expected.claims.salinityConcern),
  notMeasured: extractClaim('unmeasured intrusion boundary', abstract,
    /Groundwater inflow from coastal regions could be contributing to saltwater intrusion, even though that was not measured in this study\./,
    expected.claims.notMeasured),
};

const snapshot = {
  version: 'tulip_coastal_groundwater_current_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_regional_physical_condition_ingested_terminal_endpoints_still_missing',
  productionRatingsEnabled: 0,
  purpose: 'Refresh the physical-condition evidence for Coastal Groundwater Withdrawal through 2023 while preventing modeled storage, withdrawal rates and salinity concerns from becoming terminal human or ecosystem harm.',
  source: {
    ...source,
    retrievedOn: checkedOn,
    publicationRecordId: metadata.id,
    fetchedMetadata: { bytes: metadataBuffer.length, sha256: sha256(metadataBuffer) },
    fetchedReport: { bytes: report.length, sha256: sha256(report) },
    verifiedClaims,
  },
  currentWindow: {
    start: 2010,
    end: 2023,
    coverageStatus: 'partial',
    summaryMethod: 'end_state_stock',
    coverageNote: 'The report compares modeled groundwater budgets through 2023. It is a regional physical-condition assessment, not a census of people or ecosystems harmed.',
  },
  endpoints: {
    physicalCondition: {
      virginiaCoastalPlain: {
        period: '2010–2023',
        finding: 'Lower withdrawals produced small net storage increases in most Virginia Coastal Plain regions, while storage across the entire model domain continued to decline incrementally.',
      },
      virginiaEasternShore: {
        observationYear: 2023,
        confinedAquiferStorageLossShareOfWithdrawalsPercent: 'slightly under 7',
        withdrawalPosition: 'near the highest reported rate',
        direction: 'storage depletion expected to continue even though groundwater levels appear relatively stable',
      },
      interpretation: 'The newer case shows both partial physical recovery after lower pumping and continued depletion where withdrawals remain high. Apparently stable water levels do not by themselves establish stable storage.',
    },
    attributionBoundary: {
      finding: 'The groundwater model uses historical and current withdrawals to quantify storage and flow changes.',
      salinity: 'The report identifies up-coning and lateral saltwater-intrusion concerns, but does not measure saltwater intrusion in the Virginia Coastal Plain analysis.',
      interpretation: 'The storage result can update withdrawal-related physical condition. Salinity concern remains mechanism and risk context rather than an observed terminal endpoint in this source.',
    },
    humanConsequence: {
      compatibleCurrentEndpoint: null,
      interpretation: 'The report does not count people with attributable water-service loss, unsafe water, added treatment cost, illness or displacement.',
    },
    ecosystemCondition: {
      compatibleCurrentEndpoint: null,
      interpretation: 'The report does not measure attributable loss of ecosystem condition, affected ecosystem distribution or ecological recovery time.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the 2010–2023 storage direction and 2023 modeled budget as current regional physical-condition evidence.',
      'Use the contrast between partial recovery and continued Eastern Shore depletion to retain management and geographic heterogeneity.',
      'Use the near-record withdrawal context and modeled storage loss to support continuing physical pressure without converting it into a terminal consequence.',
      'Use the explicit not-measured statement to keep salinity concern outside observed current harm.',
    ],
    prohibited: [
      'Do not treat slightly under 7 percent storage loss relative to withdrawals as 7 percent ecosystem-condition loss or 7 percent of people harmed.',
      'Do not treat stable groundwater levels as proof that aquifer storage has recovered.',
      'Do not treat a saltwater-intrusion concern as measured intrusion or measured human harm in this source.',
      'Do not generalize the Virginia regional model to global reach.',
      'Do not add the Cape May and Virginia case-study geographies or physical measurements as separate harms.',
      'Do not use the 2010–2023 analysis period as human or ecosystem consequence duration.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'coastal_groundwater_withdrawal',
      rating: 'C 4.8',
      uncertainty: 'A 2.5 to D 7.0',
      confidence: 'C',
      domains: ['human', 'ecosystem'],
      reason: 'The 2026 source resolves the evidence-age gap and confirms current withdrawal-related storage pressure and partial reversibility. It does not supply the terminal human or ecosystem endpoints needed to narrow the existing consequence bounds, so the rating and confidence remain unchanged.',
    },
  },
  unresolvedForTulip: [
    'Join current water-service loss, unsafe salinity, treatment-cost or displacement outcomes to the same modeled withdrawal counterfactual and population denominator.',
    'Join ecosystem-condition loss and recovery measurements to the same aquifer regions and withdrawal counterfactual.',
    'Add comparable case studies outside the United States before assigning broad geographic reach.',
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
  ratingChanged: false,
  digest: snapshot.snapshotDigest,
}, null, 2));
