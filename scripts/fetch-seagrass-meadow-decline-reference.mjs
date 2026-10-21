import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'seagrass-meadow-decline-reference-snapshot.json');
const blueCarbon = JSON.parse(await readFile(path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'blue-carbon-habitat-loss-reference-snapshot.json'), 'utf8'));
const sha256 = body => createHash('sha256').update(body).digest('hex');
const plainText = body => body.toString('utf8')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(?:nbsp|#160);/g, ' ')
  .replace(/&gt;/g, '>')
  .replace(/&lt;/g, '<')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

async function fetchBuffer(url, maximumBytes = 4_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: { accept: 'text/html,*/*', 'user-agent': 'Mozilla/5.0' },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

const sources = {
  globalMap2026: {
    id: blueCarbon.sources.seagrass2026.id,
    publisher: blueCarbon.sources.seagrass2026.publisher,
    title: blueCarbon.sources.seagrass2026.title,
    publicationDate: blueCarbon.sources.seagrass2026.publicationDate,
    doi: blueCarbon.sources.seagrass2026.doi,
    url: blueCarbon.sources.seagrass2026.doi,
    dataDoi: blueCarbon.sources.seagrass2026.dataDoi,
    sourceSnapshotVersion: blueCarbon.version,
    sourceSnapshotDigest: blueCarbon.snapshotDigest,
  },
  restorationMetaAnalysis2025: {
    id: 'danovaro_marine_restoration_meta_analysis_2025',
    publisher: 'Nature Communications',
    title: 'Assessing the success of marine ecosystem restoration using meta-analysis',
    publicationDate: '2025-03-29',
    doi: '10.1038/s41467-025-57254-2',
    url: 'https://www.nature.com/articles/s41467-025-57254-2',
    fetchUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11954923/',
  },
  sevenYearRecovery2018: {
    id: 'furman_seagrass_recovery_2018',
    publisher: 'Restoration Ecology; NOAA Institutional Repository',
    title: 'Monitoring of physically restored seagrass meadows reveals a slow rate of recovery for Thalassia testudinum',
    publicationDate: '2018-01-01',
    doi: '10.1111/rec.12877',
    url: 'https://repository.library.noaa.gov/view/noaa/64423',
  },
};

const [metaBody, recoveryBody] = await Promise.all([
  fetchBuffer(sources.restorationMetaAnalysis2025.fetchUrl ?? sources.restorationMetaAnalysis2025.url),
  fetchBuffer(sources.sevenYearRecovery2018.url),
]);
const metaText = plainText(metaBody);
const recoveryText = plainText(recoveryBody);
for (const phrase of ['764 marine restoration interventions', 'seagrasses (average survival 56%)', 'complete failures']) {
  assert(metaText.includes(phrase), `Marine-restoration meta-analysis no longer contains: ${phrase}`);
}
for (const phrase of ['At 7 years posteffort', 'only three had statistically recovered', 'can require decades']) {
  assert(recoveryText.includes(phrase), `NOAA seagrass-recovery record no longer contains: ${phrase}`);
}
assert.equal(blueCarbon.endpoints.seagrass.publishedLossPct, 4);
assert.equal(blueCarbon.endpoints.seagrass.publishedDenseToSparseDegradationPct, 4.2);

const payload = {
  version: 'tulip_seagrass_meadow_decline_reference_2026_09_25_v1',
  generatedOn: '2026-09-25',
  status: 'global_mapped_loss_degradation_and_recovery_evidence_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a generic global seagrass judgment with current mapped habitat loss and degradation, a global restoration synthesis, and direct multi-year recovery observations.',
  appliesToNodeIds: ['seagrass_meadow_decline'],
  sources: {
    globalMap2026: sources.globalMap2026,
    restorationMetaAnalysis2025: { ...sources.restorationMetaAnalysis2025, bytes: metaBody.length, sha256AtIngestion: sha256(metaBody) },
    sevenYearRecovery2018: { ...sources.sevenYearRecovery2018, bytes: recoveryBody.length, sha256AtIngestion: sha256(recoveryBody) },
  },
  evidence: {
    globalMappedChange: {
      periodsCompared: blueCarbon.endpoints.seagrass.periodsCompared,
      mappedExtentKm2: blueCarbon.endpoints.seagrass.publishedMappedExtentKm2,
      completeLossKm2: blueCarbon.endpoints.seagrass.publishedLossKm2,
      completeLossPercentOfMappedExtent: blueCarbon.endpoints.seagrass.publishedLossPct,
      denseToSparseDegradationKm2: blueCarbon.endpoints.seagrass.publishedDenseToSparseDegradationKm2,
      denseToSparseDegradationPercentOfMappedExtent: blueCarbon.endpoints.seagrass.publishedDenseToSparseDegradationPct,
      interpretation: 'Complete mapped loss establishes collapse of the defining habitat at affected pixels. The four-percent share sets global reach against the same mapped seagrass denominator. Dense-to-sparse change is retained separately as degradation and is not added without proving categories are mutually exclusive.',
    },
    globalRestorationEvidence: {
      marineInterventions: 764,
      seagrassAverageSurvivalPercentRange: { lower: 50, upper: 57 },
      seagrassShareAtOrAboveFiftyPercentSurvival: 56,
      interpretation: 'Restoration is possible but variable. Survival of reintroduced plants is not the same as complete recovery of habitat structure, biodiversity or ecosystem function, so it constrains reversibility without proving full recovery time.',
    },
    directRecoveryCase: {
      sites: 8,
      monitoringYears: 7,
      statisticallyRecoveredSites: 3,
      recoveryState: 'target seagrass recolonization remained incomplete at seven years',
      interpretation: 'This source establishes that some physically damaged seagrass meadows remain incompletely recovered after seven years and that succession can take decades. It is a local recovery bound, not a global recovery distribution.',
    },
    boundary: {
      humanDomain: 'No compatible current unique-person consequence is attributed specifically to mapped seagrass decline. Fisheries, shoreline protection, water quality and carbon services remain downstream pathways or separate nodes.',
      severity: 'Use complete conversion of an affected seagrass pixel for local severity. Do not use four-percent global loss or map coverage as local severity.',
      reach: 'Use the four-percent complete-loss share against the mapped seagrass distribution. Keep dense-to-sparse degradation separate unless category overlap is resolved.',
      persistence: 'Use documented recovery state and recovery duration. Do not use the map-comparison interval, publication year or restoration-study count as persistence.',
    },
  },
  ratingDecision: {
    change: 'source_specific_ecosystem_only_review_and_interval_narrowing',
    candidate: {
      prior: { value: 7.4, grade: 'D', lower: 5.1, upper: 9.6, confidence: 'C', domains: ['human', 'ecosystem'] },
      revised: { value: 7.0, grade: 'D', lower: 6.3, upper: 7.8, confidence: 'B', domains: ['ecosystem'] },
    },
    axes: {
      ecosystem: {
        severity: { lower: 3, central: 4, upper: 4 },
        reach: { lower: 2, central: 2, upper: 2 },
        persistence: { lower: 2, central: 2, upper: 3 },
      },
    },
    excludedUses: [
      'Do not infer harmed-person reach from coastal population, fishery dependence, beneficiary counts, country rows or global map coverage.',
      'Do not use the four-percent global loss share as both local severity and ecosystem reach.',
      'Do not add four-percent complete loss and 4.2-percent dense-to-sparse degradation without a verified non-overlapping classification.',
      'Do not treat plant survival as complete ecosystem recovery or intervention failure as ecological irreversibility.',
      'Do not use the four-year map comparison, seven-year monitoring period, 764 interventions or publication age as automatic persistence.',
      'Do not inherit or add scores from Blue Carbon Habitat Loss, Mangrove Buffer Loss, Coastal Habitat Conversion, Fisheries, Carbon Emissions or Sea-Level Rise.',
    ],
    exactRemainingGaps: [
      'A global recovery-time distribution for lost and degraded seagrass habitat using condition, biodiversity and ecosystem-function endpoints rather than plant survival alone.',
      'A resolved spatial crosswalk establishing whether complete loss and dense-to-sparse degradation categories are mutually exclusive at the pixel level.',
      'A compatible current estimate of unique people experiencing attributable terminal livelihood, food-security, shoreline-protection or water-quality consequences from seagrass decline.',
      'A source-compatible 2027–2036 SSP2-4.5 projection of terminal seagrass consequences; the outlook remains separate from the current score.',
      'Independent processing of the two approximately 887-MB map archives to reproduce pixel-level loss, degradation and gain transitions.',
    ],
  },
};
payload.snapshotDigest = sha256(JSON.stringify(payload));
await writeFile(output, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ output, sources: Object.keys(payload.sources).length, digest: payload.snapshotDigest }, null, 2));
