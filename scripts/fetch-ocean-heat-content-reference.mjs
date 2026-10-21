import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'ocean-heat-content-reference-snapshot.json');
const sourceSnapshotPath = path.join(root, 'public', 'noaa-ocean-heat-content-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+ocean-heat-content-evidence-ingestion)';
const expected = {
  sourceSnapshotBytes: 21_125,
  sourceSnapshotSha256: 'd52251282e4f063ac85ce8f7d2efe559d879e9c0c929b9886c11c568daf2bfd3',
  noaaClaimBytes: 395,
  noaaClaimSha256: 'cf1e7b9cea4533feecc52757b227684c426cd5c071cef8caa32a0e017ef74a8e',
  ipccPhysicalClaimBytes: 1_296,
  ipccPhysicalClaimSha256: '8b5ff102a25df2531d586f70c77ac44168d82909fec12306236db82af35ecc93',
  ipccImpactClaimBytes: 1_940,
  ipccImpactClaimSha256: '888bc066297010409a0c6feb91c2dce79fb6532836b8ff68318154769e46286f',
  wmoPdfBytes: 1_324_091,
  wmoPdfSha256: 'c51a14175eacc1303627a8ac7009e6e18bacb365c78b5ce3506b9cb91df24f15',
};
const sources = {
  noaa: {
    id: 'noaa_global_ocean_heat_content_cdr',
    publisher: 'NOAA National Centers for Environmental Information',
    title: 'Global Ocean Heat Content Climate Data Record and 2025 annual assessment',
    publicationDate: '2026-01-13',
    productUrl: 'https://www.ncei.noaa.gov/products/climate-data-records/global-ocean-heat-content',
    annualAssessmentUrl: 'https://www.ncei.noaa.gov/news/global-climate-202513',
  },
  ipccPhysical: {
    id: 'ipcc_ar6_wgi_ocean_heat_content',
    publisher: 'Intergovernmental Panel on Climate Change',
    title: 'AR6 Working Group I, Chapter 9: Ocean, Cryosphere and Sea Level Change',
    publicationDate: '2021-08-09',
    chapterUrl: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
  },
  ipccImpacts: {
    id: 'ipcc_ar6_wgii_ocean_coastal_impacts',
    publisher: 'Intergovernmental Panel on Climate Change',
    title: 'AR6 Working Group II, Chapter 3: Oceans and Coastal Ecosystems and their Services',
    publicationDate: '2022-02-28',
    chapterUrl: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
  },
  wmo: {
    id: 'wmo_state_global_climate_2025_ocean_heat',
    publisher: 'World Meteorological Organization',
    title: 'State of the Global Climate 2025',
    publicationDate: '2026-03-23',
    publicationUrl: 'https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025',
    onePagePdfUrl: 'https://wmo.int/sites/default/files/2026-03/State%20of%20the%20Climate%202025_1%20pager_final.pdf',
  },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const decodeHtml = value => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&ndash;|&#8211;|&#x2013;/gi, '–')
  .replace(/&mdash;|&#8212;|&#x2014;/gi, '—')
  .replace(/&plusmn;|&#177;|&#xB1;/gi, '±')
  .replace(/&deg;|&#176;/gi, '°')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

async function fetchBuffer(url, accept) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
    '--header', `Accept: ${accept}`,
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

const [sourceSnapshotBuffer, noaaPage, ipccPhysicalPage, ipccImpactPage, wmoPdf] = await Promise.all([
  readFile(sourceSnapshotPath),
  fetchBuffer(sources.noaa.annualAssessmentUrl, 'text/html'),
  fetchBuffer(sources.ipccPhysical.chapterUrl, 'text/html'),
  fetchBuffer(sources.ipccImpacts.chapterUrl, 'text/html'),
  fetchBuffer(sources.wmo.onePagePdfUrl, 'application/pdf'),
]);

assert.equal(sourceSnapshotBuffer.length, expected.sourceSnapshotBytes, 'NOAA OHC source snapshot byte count changed');
assert.equal(sha256(sourceSnapshotBuffer), expected.sourceSnapshotSha256, 'NOAA OHC source snapshot checksum changed');
assert.equal(wmoPdf.length, expected.wmoPdfBytes, 'WMO 2025 one-page report byte count changed');
assert.equal(sha256(wmoPdf), expected.wmoPdfSha256, 'WMO 2025 one-page report checksum changed');

const noaaClaim = paragraphContaining(noaaPage, 'Upper ocean heat content (OHC) was record high');
const ipccPhysicalClaim = paragraphContaining(ipccPhysicalPage, 'The heat content of the global ocean has increased since at least 1970');
const ipccImpactClaim = paragraphContaining(ipccImpactPage, 'greatly impacted life in the ocean and along its coasts');
for (const [name, value, bytes, checksum] of [
  ['NOAA annual assessment', noaaClaim, expected.noaaClaimBytes, expected.noaaClaimSha256],
  ['IPCC physical assessment', ipccPhysicalClaim, expected.ipccPhysicalClaimBytes, expected.ipccPhysicalClaimSha256],
  ['IPCC impacts assessment', ipccImpactClaim, expected.ipccImpactClaimBytes, expected.ipccImpactClaimSha256],
]) {
  assert.equal(Buffer.byteLength(value), bytes, `${name} claim byte count changed`);
  assert.equal(sha256(value), checksum, `${name} claim checksum changed`);
}

const sourceSnapshot = JSON.parse(sourceSnapshotBuffer.toString('utf8'));
assert.equal(sourceSnapshot.source_summary.latest_analysis_year, 2025);
assert.equal(sourceSnapshot.source_summary.latest_ocean_heat_content_anomaly_zj, 325.33);
assert.equal(sourceSnapshot.source_summary.latest_standard_error_zj, 2.67);

const records = sourceSnapshot.records;
const latest = records.at(-1);
const prior = records.at(-2);
const earliest = records[0];
const recentIncreaseZJ = Number((latest.ocean_heat_content_anomaly_zj - prior.ocean_heat_content_anomaly_zj).toFixed(2));
const recordIncreaseZJ = Number((latest.ocean_heat_content_anomaly_zj - earliest.ocean_heat_content_anomaly_zj).toFixed(2));

const snapshot = {
  version: 'tulip_ocean_heat_content_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_physical_state_and_ocean_impact_boundary_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Separate the measured global ocean heat state from demonstrated human and ecological consequences so physical coverage, downstream nodes and report confidence cannot silently become harm axes.',
  sources: {
    noaa: {
      ...sources.noaa,
      sourceSnapshot: { path: 'public/noaa-ocean-heat-content-snapshot.json', bytes: sourceSnapshotBuffer.length, sha256: expected.sourceSnapshotSha256 },
      annualAssessmentClaim: { bytes: Buffer.byteLength(noaaClaim), sha256: expected.noaaClaimSha256, retrievedOn: checkedOn },
    },
    ipccPhysical: {
      ...sources.ipccPhysical,
      assessedClaim: { bytes: Buffer.byteLength(ipccPhysicalClaim), sha256: expected.ipccPhysicalClaimSha256, retrievedOn: checkedOn },
    },
    ipccImpacts: {
      ...sources.ipccImpacts,
      assessedClaim: { bytes: Buffer.byteLength(ipccImpactClaim), sha256: expected.ipccImpactClaimSha256, retrievedOn: checkedOn },
    },
    wmo: {
      ...sources.wmo,
      fetchedDocument: { bytes: wmoPdf.length, sha256: expected.wmoPdfSha256, retrievedOn: checkedOn },
    },
  },
  endpoints: {
    physicalState: {
      geography: sourceSnapshot.request.geography,
      depthLayerMetres: sourceSnapshot.request.depth_layer_m,
      baseline: latest.baseline,
      earliestAvailableYearInCurrentDepthSeries: earliest.analysis_year,
      latestYear: latest.analysis_year,
      latestAnomalyZettajoules: latest.ocean_heat_content_anomaly_zj,
      latestStandardErrorZettajoules: latest.standard_error_zj,
      latestDerived95IntervalZettajoules: [latest.derived_lower_95_interval_zj, latest.derived_upper_95_interval_zj],
      latestAnnualIncreaseZettajoules: recentIncreaseZJ,
      increaseAcrossAvailableDepthSeriesZettajoules: recordIncreaseZJ,
      boundary: 'This is a global 0–2000 m heat-content anomaly. Its global geography describes the measurement domain, not the share of people or ecosystems already harmed.',
    },
    assessedDirectionAndPersistence: {
      observedDirection: 'Ocean heat content has increased since at least 1970.',
      futureDirection: 'It is virtually certain to continue increasing through the twenty-first century.',
      physicalPersistence: 'Ocean warming at depth is assessed as irreversible for centuries to millennia with very high confidence.',
      scoringBoundary: 'Physical persistence constrains the upper bound for consequence persistence. It does not prove that every human or ecological consequence lasts for centuries.',
    },
    assessedImpacts: {
      ecosystem: 'IPCC assesses that interacting physical and chemical ocean changes have altered timing, distribution and abundance of marine organisms in every region, with habitat loss, population declines and food-web rearrangement.',
      human: 'IPCC documents effects on fisheries, aquaculture, coastal protection and other ocean-dependent activities, but the admitted sources do not provide one compatible global count of harmed people or a single loss total attributable to ocean heat content.',
      attributionBoundary: 'The impact assessment covers ocean warming acting with acidification, deoxygenation, extremes and non-climate pressures. It does not allocate every observed impact to the global heat-content stock alone.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the NOAA anomaly and standard error to establish the measured current physical state and its measurement uncertainty.',
      'Use the IPCC assessment to establish worsening direction, broad ocean-region evidence and long physical persistence.',
      'Use IPCC-observed habitat, population, food-web and ocean-service consequences as bounded harm evidence without assigning all combined-driver impacts to ocean heat content.',
      'Retain separate uncertainty for consequence severity, affected people or ecosystem distribution, and consequence recovery time.',
    ],
    prohibited: [
      'Do not treat World Ocean coverage as a count or percentage of people harmed.',
      'Do not treat a global physical measurement as 100% ecosystem harm reach.',
      'Do not convert zettajoules or measurement standard error directly into a TULIP harm level.',
      'Do not add scores for marine heatwaves, coral bleaching, sea-level rise, deoxygenation, fisheries disruption or other connected nodes.',
      'Do not treat centuries of physical ocean warming as proof that every human or ecological consequence is equally persistent.',
      'Do not assign the combined IPCC ocean-impact record entirely to ocean heat content when acidification, oxygen loss, exploitation and pollution also contribute.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'ocean_heat_content',
      rating: 'C 6.3',
      uncertainty: 'B 4.0 to D 8.1',
      confidence: 'B',
      domain: 'human and ecosystem',
      reason: 'The physical state, direction and broad ocean impacts are well established. The exact human reach, ecosystem-distribution loss and duration of each consequence remain converted bounds rather than direct common-unit measurements.',
    },
  },
  unresolvedForTulip: [
    'Obtain an attributable global distribution of human material or service losses tied specifically to ocean warming rather than all ocean climate drivers.',
    'Obtain the share of marine ecosystem distributions with current condition loss attributable specifically to warming or accumulated ocean heat.',
    'Obtain consequence-recovery distributions that distinguish persistent physical warming from recovery of people, species and ecosystems.',
    'Reconcile independent 0–2000 m products and baselines before using cross-product spread as structural measurement uncertainty.',
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
  latestYear: snapshot.endpoints.physicalState.latestYear,
  latestAnomalyZettajoules: snapshot.endpoints.physicalState.latestAnomalyZettajoules,
  rating: snapshot.tulipUse.currentCatalogueRecommendation.rating,
  digest: snapshot.snapshotDigest,
}, null, 2));
