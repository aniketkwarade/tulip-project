import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'snow-harm-reference-snapshot.json');
const rawDir = process.env.TULIP_SNOW_HARM_RAW_DIR;
const checkedOn = '2026-09-24';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(Buffer.from(JSON.stringify(value)));
const round = (value, places = 6) => Number(value.toFixed(places));

const sources = {
  northernHemisphereSnowLoss: {
    id: 'gottlieb_northern_hemisphere_snow_loss_2024',
    title: 'Evidence of human influence on Northern Hemisphere snow loss',
    publisher: 'Nature',
    publicationDate: '2024-01-10',
    articleUrl: 'https://www.nature.com/articles/s41586-023-06794-y',
    doi: 'https://doi.org/10.1038/s41586-023-06794-y',
    figure3: {
      rawName: '41586_2023_6794_MOESM5_ESM.xlsx',
      url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-023-06794-y/MediaObjects/41586_2023_6794_MOESM5_ESM.xlsx',
      bytes: 36_050,
      sha256: '7b240ba2205d7278276a4e46992b9019bdbb07d4d4b9b3eefb2c20ffbc2bc790',
    },
    figure4: {
      rawName: '41586_2023_6794_MOESM6_ESM.xlsx',
      url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-023-06794-y/MediaObjects/41586_2023_6794_MOESM6_ESM.xlsx',
      bytes: 25_183,
      sha256: 'a2e1fd49a8e07a96146c623b35d206dae00834dc41b08fa20cf6d8fdc4208296',
    },
  },
  canadianSnowDrought: {
    id: 'zaerpour_canada_snow_drought_2025',
    title: 'Creeping snow drought threatens Canada’s water supply',
    publisher: 'Communications Earth & Environment',
    publicationDate: '2025-12-04',
    articleUrl: 'https://www.nature.com/articles/s43247-025-03162-8',
    doi: 'https://doi.org/10.1038/s43247-025-03162-8',
    supplement: {
      rawName: '43247_2025_3162_MOESM2_ESM.pdf',
      url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs43247-025-03162-8/MediaObjects/43247_2025_3162_MOESM2_ESM.pdf',
      bytes: 7_763_659,
      sha256: '8699605d4ecd425590280a96fb5d2d09f7687e9ba227302897e537d1a829691d',
    },
  },
  snowmeltFloodTiming: {
    id: 'guo_snowmelt_flood_timing_2025',
    title: 'Warming leads to both earlier and later snowmelt floods over the past 70 years',
    publisher: 'Nature Communications',
    publicationDate: '2025-04-23',
    articleUrl: 'https://www.nature.com/articles/s41467-025-58832-0',
    doi: 'https://doi.org/10.1038/s41467-025-58832-0',
    sourceDataFigure1: {
      rawName: '41467_2025_58832_MOESM3_ESM.xls',
      url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41467-025-58832-0/MediaObjects/41467_2025_58832_MOESM3_ESM.xls',
      bytes: 381_952,
      sha256: '4a0812d2ae276ba5824cd84a7048ebd2763a95bc7e1e10e511b4bc4b91abfae5',
    },
    catchmentMetadataDoi: 'https://doi.org/10.5281/zenodo.13892758',
    codeDoi: 'https://doi.org/10.5281/zenodo.15117546',
  },
  alpineSnowLegacy: {
    id: 'choler_alpine_snow_cover_legacy_2025',
    title: 'Legacy of snow cover on alpine landscapes',
    publisher: 'Communications Earth & Environment',
    publicationDate: '2025-09-29',
    articleUrl: 'https://www.nature.com/articles/s43247-025-02702-6',
    doi: 'https://doi.org/10.1038/s43247-025-02702-6',
    archiveDoi: 'https://doi.org/10.5281/zenodo.15211652',
    analysisCode: {
      rawName: 'legacy-figshare.r',
      url: 'https://zenodo.org/api/records/15211652/files/figshare.r/content',
      bytes: 37_399,
      sha256: 'abb3fcd7d3e01002f9d5032e9eae363049bc30a3ce5c26886c9d54315b38ae5e',
    },
  },
};

async function fetchBuffer(url, maximumBytes = 12_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: {
      accept: '*/*',
      'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+snow-harm-evidence-ingestion)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength)) assert(declaredLength <= maximumBytes, `${url} exceeds the download limit`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

async function loadPinned(file, label) {
  const body = rawDir
    ? await readFile(path.join(rawDir, file.rawName))
    : await fetchBuffer(file.url);
  assert.equal(body.length, file.bytes, `${label}: byte size changed`);
  assert.equal(sha256(body), file.sha256, `${label}: checksum changed`);
  return body;
}

async function fetchCrossref(doi) {
  const payload = JSON.parse(await fetchBuffer(`https://api.crossref.org/works/${doi}?mailto=research%40tulip.earth`, 2_000_000));
  return payload.message;
}

function decodeXml(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"').replaceAll('&apos;', "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function columnIndex(reference) {
  const letters = reference.match(/[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function xlsxRows(bytes, sheetNumber = 1) {
  const archive = unzipSync(new Uint8Array(bytes));
  const decoder = new TextDecoder();
  const sharedXml = archive['xl/sharedStrings.xml'] ? decoder.decode(archive['xl/sharedStrings.xml']) : '';
  const sharedStrings = [...sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(match => (
    [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(part => decodeXml(part[1])).join('')
  ));
  const sheet = decoder.decode(archive[`xl/worksheets/sheet${sheetNumber}.xml`]);
  return [...sheet.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)].map(rowMatch => {
    const row = [];
    for (const cell of rowMatch[1].matchAll(/<c\s([^>]*)>([\s\S]*?)<\/c>/g)) {
      const reference = cell[1].match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const type = cell[1].match(/\bt="([^"]+)"/)?.[1];
      const raw = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (raw == null) continue;
      row[columnIndex(reference)] = type === 's' ? sharedStrings[Number(raw)] : type === 'str' ? decodeXml(raw) : Number(raw);
    }
    return row;
  });
}

const snowLossMetadata = await fetchCrossref('10.1038/s41586-023-06794-y');
const snowDroughtMetadata = await fetchCrossref('10.1038/s43247-025-03162-8');
const snowmeltMetadata = await fetchCrossref('10.1038/s41467-025-58832-0');
const alpineLegacyMetadata = await fetchCrossref('10.1038/s43247-025-02702-6');

const [
  snowLossFigure3,
  snowLossFigure4,
  snowDroughtSupplement,
  snowmeltSourceData,
  alpineLegacyCode,
] = await Promise.all([
  loadPinned(sources.northernHemisphereSnowLoss.figure3, 'Northern Hemisphere snow-loss Fig. 3 source data'),
  loadPinned(sources.northernHemisphereSnowLoss.figure4, 'Northern Hemisphere snow-loss Fig. 4 source data'),
  loadPinned(sources.canadianSnowDrought.supplement, 'Canadian snow-drought supplement'),
  loadPinned(sources.snowmeltFloodTiming.sourceDataFigure1, 'snowmelt-flood timing source data'),
  loadPinned(sources.alpineSnowLegacy.analysisCode, 'alpine snow-cover legacy code'),
]);

assert.equal(snowLossMetadata.title[0], sources.northernHemisphereSnowLoss.title);
assert.equal(snowDroughtMetadata.title[0], sources.canadianSnowDrought.title);
assert.equal(snowmeltMetadata.title[0], sources.snowmeltFloodTiming.title);
assert.equal(alpineLegacyMetadata.title[0], sources.alpineSnowLegacy.title);
assert.equal(snowDroughtSupplement.subarray(0, 5).toString(), '%PDF-');
assert.deepEqual([...snowmeltSourceData.subarray(0, 8)], [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
assert.match(alpineLegacyCode.toString('utf8'), /library\(/);

const historicalRows = xlsxRows(snowLossFigure3, 1);
const attributedRows = xlsxRows(snowLossFigure3, 3);
const futureContextRows = xlsxRows(snowLossFigure4, 2);
assert.deepEqual(historicalRows[0].slice(0, 4), ['MRBID', 'RIVER_BASI', 'swe_trend_pct', 'frac_agree']);
assert.deepEqual(attributedRows[0].slice(0, 6), ['MRBID', 'RIVER_BASI', 'acc_effect', 'acc_p_effect', 'acc_t_effect', 'frac_agree_all']);
assert.deepEqual(futureContextRows[0].slice(0, 6), ['MRBID', 'RIVER_BASI', 'delta_swe_fut', 'delta_q_fut', 'pop', 'eoc_t']);
assert.equal(historicalRows.length - 1, 169);
assert.equal(attributedRows.length - 1, 169);
assert.equal(futureContextRows.length - 1, 169);
const basinPopulationContext = futureContextRows.slice(1).reduce((sum, row) => sum + row[4], 0);

const snapshot = {
  version: 'tulip_snow_harm_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_snow_physical_state_and_bounded_consequences_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace inherited exposure counts and generic cryosphere persistence with node-specific snow evidence. Physical snow loss, basin population, flood timing, observed human consequences and ecosystem consequences remain separate quantities.',
  sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => [key, {
    id: source.id,
    title: source.title,
    publisher: source.publisher,
    publicationDate: source.publicationDate,
    articleUrl: source.articleUrl,
    doi: source.doi,
    ...(source.archiveDoi ? { archiveDoi: source.archiveDoi } : {}),
    ...(source.catchmentMetadataDoi ? { catchmentMetadataDoi: source.catchmentMetadataDoi } : {}),
    ...(source.codeDoi ? { codeDoi: source.codeDoi } : {}),
  }])),
  evidence: {
    northernHemisphereSnowpack: {
      period: { start: 1981, end: 2020 },
      majorRiverBasins: 169,
      basinsWithRobustSnowTrendsReported: 82,
      basinsWithTrendsConfidentlyAttributedToHumanInfluenceReported: 31,
      midLatitudeHumanForcedSpringSnowpackChangePercentPerDecade: { estimate: -4.1, standardDeviation: 3.4 },
      sourceData: {
        historicalRows: historicalRows.length - 1,
        attributedRows: attributedRows.length - 1,
        figure3Sha256: sources.northernHemisphereSnowLoss.figure3.sha256,
        figure4Sha256: sources.northernHemisphereSnowLoss.figure4.sha256,
      },
      basinPopulationContext: {
        summedModelInput: round(basinPopulationContext, 0),
        interpretation: 'This is the sum of the population field used for the paper’s future basin context. It is exposure context, not a count of people currently harmed by snow loss and not a TULIP reach input.',
      },
      endpointBoundary: 'The source measures physical March snow-water-equivalent trends and attribution. It does not measure current terminal human harm, ecosystem condition loss, or consequence recovery time across the 169 basins.',
    },
    canadianSnowDrought: {
      physicalAnalysisPeriod: { start: 2000, end: 2019 },
      boundedObservedCase: {
        year: 2015,
        geography: 'western Canada',
        humanConsequence: 'Municipal water supplies were stressed enough to require emergency actions.',
        ecosystemConsequence: 'Low meltwater and warm conditions pushed stream temperatures beyond aquatic thermal thresholds and were associated with mass sockeye-salmon die-offs.',
      },
      compatibleUniqueHarmedPersonCount: null,
      compatibleAffectedEcosystemDistributionPercent: null,
      compatibleRecoveryTimeDistribution: null,
      endpointBoundary: 'The regional case establishes material consequences, but the study does not supply a unique harmed-person count, a collapse-calibrated ecosystem loss percentage, a compatible ecosystem-distribution denominator, or a recovery distribution.',
    },
    snowmeltTiming: {
      observationPeriod: { start: 1950, end: 2020 },
      snowAffectedCatchments: 2_339,
      catchmentsWithDelayedSnowmeltFloodsApproximatePercent: 30,
      hemisphericFloodTimingShiftDaysPerDecade: { estimate: -0.87, uncertainty: 2.4 },
      direction: 'mixed',
      compatibleTerminalHumanConsequence: null,
      compatibleEcosystemConditionLoss: null,
      endpointBoundary: 'The source establishes heterogeneous changes in flood timing. Catchments, days and the seventy-year record do not measure people harmed, ecosystem collapse, or consequence duration.',
    },
    alpineSnowCoverLegacy: {
      geography: 'two catchments in the south-western French Alps',
      remoteSensingPeriod: { start: 2013, end: 2023 },
      direction: 'mixed_by_topography_and_snow_duration',
      recoveryContext: 'Some local ecosystem properties may take several decades to approach the compared site state.',
      compatibleGlobalConditionLossPercent: null,
      compatibleGlobalAffectedDistributionPercent: null,
      endpointBoundary: 'The study directly supports local, lagged ecosystem responses and mixed direction. It does not provide a global adverse-condition percentage or affected alpine-ecosystem denominator.',
    },
  },
  ratingDecision: {
    changes: {
      snow_drought: { prior: { value: 7.4, grade: 'D' }, revised: { value: 4.4, grade: 'B', lower: 2.1, upper: 6.3, confidence: 'C' } },
      snowmelt_timing_shift: { prior: { value: 7.4, grade: 'D' }, revised: { value: 3.6, grade: 'B', lower: 1.8, upper: 5.9, confidence: 'C' } },
      alpine_snowpack_declines: { prior: { value: 7, grade: 'D' }, revised: { value: 4, grade: 'B', lower: 1.8, upper: 6.3, confidence: 'C' } },
    },
    reason: 'The prior structured candidates used 700 million people dependent on mountain water as if they were currently harmed and treated chronic snow trends as consequence persistence. The new evidence supports widespread physical change plus bounded regional consequences, while leaving current harmed-person, global ecosystem-condition and recovery denominators unresolved.',
    excludedUses: [
      'Do not convert basin population, people dependent on mountain water, catchment count or area with snow trends into harmed-person reach.',
      'Do not convert snow-water-equivalent loss, days of timing shift, model agreement or anthropogenic attribution confidence into harm severity.',
      'Do not use the 1950–2020, 1981–2020 or 2000–2019 observation periods as consequence persistence.',
      'Do not add reservoir, drought, flood, wildfire, hydropower, agricultural or species-node scores to these snow ratings.',
      'Do not generalize a regional water emergency, salmon die-off or local alpine legacy to every basin or alpine ecosystem.',
    ],
    exactRemainingGaps: [
      'A joined, current record of snow-attributable terminal human outcomes with unique people and duration.',
      'A condition-loss numerator and compatible distribution denominator for snow-dependent ecosystems.',
      'A representative recovery-time distribution for the attributed human and ecosystem consequences.',
      'A source-matched allocation separating snow drought, declining snowpack and snowmelt timing without counting one consequence more than once.',
    ],
  },
  sourceVerification: {
    northernHemisphereFigure3: { bytes: snowLossFigure3.length, sha256: sha256(snowLossFigure3) },
    northernHemisphereFigure4: { bytes: snowLossFigure4.length, sha256: sha256(snowLossFigure4) },
    canadianSnowDroughtSupplement: { bytes: snowDroughtSupplement.length, sha256: sha256(snowDroughtSupplement) },
    snowmeltFloodTimingFigure1: { bytes: snowmeltSourceData.length, sha256: sha256(snowmeltSourceData) },
    alpineSnowLegacyCode: { bytes: alpineLegacyCode.length, sha256: sha256(alpineLegacyCode) },
  },
};

snapshot.snapshotDigest = digest(snapshot);
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, version: snapshot.version, changes: snapshot.ratingDecision.changes, digest: snapshot.snapshotDigest }, null, 2));
