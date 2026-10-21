import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'ocean-carbon-uptake-reference-snapshot.json');
const sourceSnapshotPath = path.join(root, 'public', 'gcb-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+ocean-carbon-uptake-evidence-ingestion)';
const expected = {
  sourceSnapshotBytes: 31_831,
  sourceSnapshotSha256: '5d988c24c6f8eaf9e557cbb6fe13e6e440d72b890b858d7bccfb979b815c542e',
  gcbObservedClaimBytes: 316,
  gcbObservedClaimSha256: 'ce0756db25c85c3e5e0fa1300d42f180de1173058eb422ca2381aa7352280f60',
  gcbClimateClaimBytes: 1_068,
  gcbClimateClaimSha256: '86b287f7f2032444ef28fb76c17bc2ec730e21f769527beb14b0ef03986304da',
  ipccObservedClaimBytes: 469,
  ipccObservedClaimSha256: '9eaac0b3f9af95cec50901c9287603eba7142189f10f5478cc1a95735a2e5082',
  ipccFutureClaimBytes: 1_497,
  ipccFutureClaimSha256: 'aa90845d328fa8f361b5089794468ef48cf78bd788b547f32d3da58a782391b1',
};
const sources = {
  gcb: {
    id: 'global_carbon_budget_2025_ocean_sink',
    publisher: 'Global Carbon Project and Copernicus Publications',
    title: 'Global Carbon Budget 2025',
    publicationDate: '2026-05-13',
    articleUrl: 'https://essd.copernicus.org/articles/18/3211/2026/',
    doi: 'https://doi.org/10.5194/essd-18-3211-2026',
  },
  ipcc: {
    id: 'ipcc_ar6_wgi_ocean_carbon_sink',
    publisher: 'Intergovernmental Panel on Climate Change',
    title: 'AR6 Working Group I, Chapter 5: Global Carbon and other Biogeochemical Cycles and Feedbacks',
    publicationDate: '2021-08-09',
    chapterUrl: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/',
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

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
    '--header', 'Accept: text/html',
    url,
  ], { encoding: null, maxBuffer: 50_000_000, timeout: 130_000 });
  return stdout;
}

function paragraphContaining(buffer, needle) {
  const html = buffer.toString('utf8');
  const index = html.indexOf(needle);
  assert(index >= 0, `Official source paragraph is missing: ${needle}`);
  const start = html.lastIndexOf('<p', index);
  const contentStart = html.indexOf('>', start);
  const end = html.indexOf('</p>', index);
  assert(start >= 0 && contentStart >= 0 && end >= 0, `Could not isolate paragraph: ${needle}`);
  return decodeHtml(html.slice(contentStart + 1, end));
}

const [sourceSnapshotBuffer, gcbPage, ipccPage] = await Promise.all([
  readFile(sourceSnapshotPath),
  fetchBuffer(sources.gcb.articleUrl),
  fetchBuffer(sources.ipcc.chapterUrl),
]);
assert.equal(sourceSnapshotBuffer.length, expected.sourceSnapshotBytes, 'GCB source snapshot byte count changed');
assert.equal(sha256(sourceSnapshotBuffer), expected.sourceSnapshotSha256, 'GCB source snapshot checksum changed');

const gcbObservedClaim = paragraphContaining(gcbPage, 'The ocean-borne fraction');
const gcbClimateClaim = paragraphContaining(gcbPage, 'The increase of the ocean sink is primarily driven');
const ipccObservedClaim = paragraphContaining(ipccPage, 'Recent observations show that ocean carbon processes');
const ipccFutureClaim = paragraphContaining(ipccPage, 'Climate has three important impacts on the ocean uptake');
for (const [name, value, bytes, checksum] of [
  ['GCB observed sink', gcbObservedClaim, expected.gcbObservedClaimBytes, expected.gcbObservedClaimSha256],
  ['GCB climate counterfactual', gcbClimateClaim, expected.gcbClimateClaimBytes, expected.gcbClimateClaimSha256],
  ['IPCC observed sink', ipccObservedClaim, expected.ipccObservedClaimBytes, expected.ipccObservedClaimSha256],
  ['IPCC future feedback', ipccFutureClaim, expected.ipccFutureClaimBytes, expected.ipccFutureClaimSha256],
]) {
  assert.equal(Buffer.byteLength(value), bytes, `${name} claim byte count changed`);
  assert.equal(sha256(value), checksum, `${name} claim checksum changed`);
}

const sourceSnapshot = JSON.parse(sourceSnapshotBuffer.toString('utf8'));
const records = sourceSnapshot.annual_global_budget;
assert.equal(records.length, 66);
assert.equal(records[0].year, 1959);
assert.equal(records.at(-1).year, 2024);
const latest = records.at(-1);
const fraction = row => 100 * row.ocean_sink_gtc_yr
  / (row.fossil_emissions_excluding_carbonation_gtc_yr + row.land_use_change_emissions_gtc_yr);
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2;
};
const recent = records.filter(row => row.year >= 2015 && row.year <= 2024);

const snapshot = {
  version: 'tulip_ocean_carbon_uptake_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'counterfactual_ocean_sink_weakening_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Distinguish the observed total ocean sink from the climate-attributable reduction relative to a CO2-only counterfactual, then keep this regulating-function loss separate from downstream warming and impact nodes.',
  sources: {
    gcb: {
      ...sources.gcb,
      sourceSnapshot: { path: 'public/gcb-snapshot.json', bytes: sourceSnapshotBuffer.length, sha256: expected.sourceSnapshotSha256 },
      observedSinkClaim: { bytes: Buffer.byteLength(gcbObservedClaim), sha256: expected.gcbObservedClaimSha256, retrievedOn: checkedOn },
      climateCounterfactualClaim: { bytes: Buffer.byteLength(gcbClimateClaim), sha256: expected.gcbClimateClaimSha256, retrievedOn: checkedOn },
    },
    ipcc: {
      ...sources.ipcc,
      observedSinkClaim: { bytes: Buffer.byteLength(ipccObservedClaim), sha256: expected.ipccObservedClaimSha256, retrievedOn: checkedOn },
      futureFeedbackClaim: { bytes: Buffer.byteLength(ipccFutureClaim), sha256: expected.ipccFutureClaimSha256, retrievedOn: checkedOn },
    },
  },
  endpoints: {
    observedTotalSink: {
      startYear: records[0].year,
      latestYear: latest.year,
      latestOceanSinkGtCPerYear: Number(latest.ocean_sink_gtc_yr.toFixed(6)),
      latestOceanBorneFractionPercent: Number(fraction(latest).toFixed(6)),
      historicalMedianOceanBorneFractionPercent: Number(median(records.map(fraction)).toFixed(6)),
      recentMeanOceanSinkGtCPerYear: Number((recent.reduce((sum, row) => sum + row.ocean_sink_gtc_yr, 0) / recent.length).toFixed(6)),
      recentMeanOceanBorneFractionPercent: Number((recent.reduce((sum, row) => sum + fraction(row), 0) / recent.length).toFixed(6)),
      assessedFinding: 'The ocean-borne fraction averaged about 27% and showed no sustained decrease over 1959–2024. Rising atmospheric CO2 continued to increase the absolute sink.',
    },
    climateAttributableWeakening: {
      period: { start: 2015, end: 2024 },
      reductionGtCPerYear: 0.20,
      standardUncertaintyGtCPerYear: 0.05,
      relativeToCo2OnlyPercent: 7.1,
      modelRangePercent: { lower: 4.2, upper: 10.7 },
      spatialFinding: 'All participating models simulate climate-driven weakening, evident in the north, tropics and south large-scale latitude bands.',
      comparison: 'A simulation responding only to increased atmospheric CO2, with the climate-change effect separated by the model experiment.',
      measurementBoundary: 'This is a model-derived global carbon-buffering loss relative to a counterfactual. It is not a 7.1% decline in the observed total sink, a 7.1% ecosystem collapse or a count of people harmed.',
    },
    assessedDirectionAndPersistence: {
      observedDirection: 'Contemporary total uptake has grown, while climate change has already weakened that uptake relative to the CO2-only counterfactual.',
      futureDirection: 'IPCC assesses positive climate–carbon feedback with scenario-dependent ocean-sink weakening; SSP2-4.5-specific 2027–2036 magnitude is not supplied by the admitted passages.',
      persistence: 'Carbon stored below the ocean surface can remain isolated from the atmosphere for decades to centuries, while the exact recovery time of the climate-attributable buffering loss is not quantified.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the 2015–2024 7.1% counterfactual reduction as a converted severity proxy for loss of the ocean carbon-buffering function.',
      'Use the 4.2%–10.7% model range to retain severity levels 1–2 rather than presenting 7.1% as an exact ecosystem-condition measurement.',
      'Use occurrence in all three large-scale latitude bands as broad evidence scope while retaining uncertainty in the share of ecosystem distributions affected.',
      'Use IPCC process evidence for worsening direction and a bounded multi-decade persistence judgment.',
    ],
    prohibited: [
      'Do not describe the observed total ocean sink or ocean-borne fraction as having declined continuously.',
      'Do not treat the 7.1% counterfactual reduction as 7.1% ecosystem collapse or 7.1% of people harmed.',
      'Do not use global budget geography or latitude-band coverage as proof that all ecosystems or people are harmed.',
      'Do not add downstream warming, acidification, deoxygenation, fisheries, health, infrastructure or economic scores.',
      'Do not treat annual sink variability, source record length or model count as consequence persistence or reach.',
      'Do not invent an SSP2-4.5 2027–2036 numerical change from longer-horizon scenario statements.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'ocean_carbon_uptake_weakening',
      rating: 'C 5.5',
      uncertainty: 'B 4.0 to D 7.8',
      confidence: 'B',
      domain: 'ecosystem regulating function',
      reason: 'The source directly quantifies a climate-attributable loss of carbon-buffering function. It does not quantify independent terminal human harm or the fraction of ecosystem distributions damaged, so those downstream pathways remain outside this node.',
    },
  },
  unresolvedForTulip: [
    'Obtain a source-native SSP2-4.5 estimate for 2027–2036 using the same CO2-only counterfactual definition.',
    'Obtain an attributable distribution of carbon-buffering loss across ecosystem regions rather than using latitude-band occurrence as a reach proxy.',
    'Obtain a directly modelled recovery or elevated-effect duration for the lost buffering function.',
    'Keep updating the annual budget and counterfactual model ensemble to separate long-term climate feedback from short-term variability.',
  ],
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
  observedLatestYear: snapshot.endpoints.observedTotalSink.latestYear,
  climateAttributableWeakeningPercent: snapshot.endpoints.climateAttributableWeakening.relativeToCo2OnlyPercent,
  rating: snapshot.tulipUse.currentCatalogueRecommendation.rating,
  digest: snapshot.snapshotDigest,
}, null, 2));
