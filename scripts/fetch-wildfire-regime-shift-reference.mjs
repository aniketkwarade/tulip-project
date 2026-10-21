import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { unzipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'wildfire-regime-shift-reference-snapshot.json');
const execFileAsync = promisify(execFile);
const checkedOn = '2026-09-23';
const userAgent = 'LostPlanet-TULIP/1.0 (+wildfire-regime-shift-evidence-ingestion)';

const sources = {
  human: {
    id: 'park_fire_pm25_mortality_climate_attribution_2024',
    publisher: 'Nature Climate Change',
    title: 'Attributing human mortality from fire PM2.5 to climate change',
    publicationDate: '2024-10-21',
    doi: 'https://doi.org/10.1038/s41558-024-02149-1',
    articleUrl: 'https://www.nature.com/articles/s41558-024-02149-1',
    correctionDoi: 'https://doi.org/10.1038/s41558-024-02195-9',
    correctionUrl: 'https://www.nature.com/articles/s41558-024-02195-9',
    sourceDataUrl: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41558-024-02149-1/MediaObjects/41558_2024_2149_MOESM3_ESM.csv',
    repositoryDoi: 'https://doi.org/10.5281/zenodo.13231638',
    repositoryRecordUrl: 'https://zenodo.org/api/records/13231638',
  },
  ecosystem: {
    id: 'lv_global_large_fire_forest_recovery_2025',
    publisher: 'Nature Ecology & Evolution',
    title: 'Increasing severity of large-scale fires prolongs recovery time of forests globally since 2001',
    publicationDate: '2025-04-22',
    doi: 'https://doi.org/10.1038/s41559-025-02683-x',
    articleUrl: 'https://www.nature.com/articles/s41559-025-02683-x',
    correctionDoi: 'https://doi.org/10.1038/s41559-025-02732-5',
    correctionUrl: 'https://www.nature.com/articles/s41559-025-02732-5',
    supplementaryUrl: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41559-025-02683-x/MediaObjects/41559_2025_2683_MOESM1_ESM.pdf',
    codeRepository: 'https://github.com/laura-wq/Extreme-Forest-Fire',
    publicationCodeCommit: '9b469c6f3cbb0484591499c066be6683e8827256',
  },
};

const expected = {
  humanAbstract: { bytes: 1_075, sha256: 'e79edefc737ad64b7178dee0ea466b84fba8e1c66ab8c1f493ccb49193641f2b' },
  humanSourceData: { bytes: 15_199, sha256: '4a5d5c1ebf1703c1aec7e6facf12308714bce20e66e3efab4bf19a261fa9d2c5' },
  humanReadme: { bytes: 1_691, md5: '45f31fa4ce640083dcd2bac403a1dba9', sha256: 'd0121b11f225c88f58f7cc7ecdaf8c294cfc0de770ebd9042daedfd1e195ba1f' },
  humanMainCode: { bytes: 21_703, md5: '2c27167f876d39bfc8ef5edf503aa432', sha256: '58f75b2891e7a0fbcfd1356d467a6839b868dfbd46703f5c212d9c7c00e0c547' },
  ecosystemAbstract: { bytes: 1_978, sha256: '85812dc76f5085a7937e19dcc131a09016dbb70fb2d847179dab49787780fd3d' },
  ecosystemSupplementary: { bytes: 2_998_401, sha256: 'fe947930335fe4dc25075d19897beae72ab2d240beeb9a0397e786aca184894a' },
};

const humanRepositoryFiles = {
  readme: 'https://zenodo.org/api/records/13353679/files/Readme.txt/content',
  mainCode: 'https://zenodo.org/api/records/13353679/files/FireMort_SI_re.mlx/content',
};

const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const digest = value => hash('sha256', JSON.stringify(value));
const round = (value, digits = 6) => Number(value.toFixed(digits));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 50_000_000, timeout: 190_000 });
  return stdout;
}

function verify(name, buffer, pinned) {
  assert.equal(buffer.length, pinned.bytes, `${name} byte count changed`);
  assert.equal(hash('sha256', buffer), pinned.sha256, `${name} checksum changed`);
  if (pinned.md5) assert.equal(hash('md5', buffer), pinned.md5, `${name} MD5 changed`);
}

function decodeHtml(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function paragraphContaining(buffer, needle) {
  const html = buffer.toString('utf8');
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => decodeHtml(match[1]));
  const paragraph = paragraphs.find(value => value.startsWith(needle));
  assert(paragraph, `Article paragraph is missing: ${needle}`);
  return paragraph;
}

function verifyClaim(name, value, pinned) {
  assert.equal(Buffer.byteLength(value), pinned.bytes, `${name} byte count changed`);
  assert.equal(hash('sha256', value), pinned.sha256, `${name} checksum changed`);
}

function decodeXml(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"').replaceAll('&apos;', "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function columnIndex(reference) {
  const letters = reference.match(/[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function xlsxRows(bytes, sheetNumber) {
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
      const attributes = cell[1];
      const reference = attributes.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1];
      const raw = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (raw == null) continue;
      row[columnIndex(reference)] = type === 's' ? sharedStrings[Number(raw)] : type === 'str' ? decodeXml(raw) : Number(raw);
    }
    return row;
  });
}

function decadeTable(bytes, sheetNumber) {
  const rows = xlsxRows(bytes, sheetNumber);
  const years = rows[0].slice(1).map(Number);
  const models = rows.slice(1).map(row => ({ model: row[0], values: Object.fromEntries(years.map((year, index) => [year, row[index + 1]])) }));
  return {
    years,
    models,
    means: Object.fromEntries(years.map(year => [year, round(models.reduce((sum, model) => sum + model.values[year], 0) / models.length, 9)])),
  };
}

const [humanArticle, humanCorrection, humanSourceData, humanReadme, humanMainCode, ecosystemArticle, ecosystemCorrection, ecosystemSupplementary, ecosystemCodeTree] = await Promise.all([
  fetchBuffer(sources.human.articleUrl),
  fetchBuffer(sources.human.correctionUrl),
  fetchBuffer(sources.human.sourceDataUrl),
  fetchBuffer(humanRepositoryFiles.readme),
  fetchBuffer(humanRepositoryFiles.mainCode),
  fetchBuffer(sources.ecosystem.articleUrl),
  fetchBuffer(sources.ecosystem.correctionUrl),
  fetchBuffer(sources.ecosystem.supplementaryUrl),
  fetchBuffer(`https://api.github.com/repos/laura-wq/Extreme-Forest-Fire/git/trees/${sources.ecosystem.publicationCodeCommit}?recursive=1`),
]);

const humanAbstract = paragraphContaining(humanArticle, 'Climate change intensifies fire smoke');
const ecosystemAbstract = paragraphContaining(ecosystemArticle, 'Ongoing and sharply increased global forest fires');
verifyClaim('Human mortality abstract', humanAbstract, expected.humanAbstract);
verifyClaim('Forest recovery abstract', ecosystemAbstract, expected.ecosystemAbstract);
verify('Human source-data workbook', humanSourceData, expected.humanSourceData);
verify('Human repository README', humanReadme, expected.humanReadme);
verify('Human main MATLAB code', humanMainCode, expected.humanMainCode);
verify('Forest recovery supplementary information', ecosystemSupplementary, expected.ecosystemSupplementary);
assert.equal(humanSourceData.subarray(0, 2).toString('hex'), '504b', 'Human source data is not the published XLSX archive');

const humanCorrectionText = decodeHtml(humanCorrection.toString('utf8'));
assert.match(humanCorrectionText, /units were incorrect.*diameter of.*2\.5.*sentence has now been amended/is);
const ecosystemCorrectionText = decodeHtml(ecosystemCorrection.toString('utf8'));
assert.match(ecosystemCorrectionText, /colours of the key in Fig\. 1c were switched.*blue represents.*Pre-2010.*green represents.*Post-2010/is);

const ecosystemTree = JSON.parse(ecosystemCodeTree.toString('utf8'));
assert.equal(ecosystemTree.sha, sources.ecosystem.publicationCodeCommit);
assert.equal(ecosystemTree.truncated, false);
const ecosystemNotebooks = ecosystemTree.tree.filter(entry => entry.type === 'blob' && entry.path.endsWith('.ipynb'));
assert.equal(ecosystemNotebooks.length, 9);

const humanMortality = decadeTable(humanSourceData, 2);
const humanAttributionPercent = decadeTable(humanSourceData, 6);
assert.deepEqual(humanMortality.years, [1960, 1970, 1980, 1990, 2000]);
assert.deepEqual(humanAttributionPercent.years, humanMortality.years);
assert.equal(humanMortality.models.length, 3);
assert.equal(round(humanMortality.means[1960], 0), 46_401);

const endpoints = {
  human: {
    geography: 'Global model ensemble with regional attribution results.',
    record: 'Six decadal means from the 1960s through the 2010s in the published article; the compact Figure 1 source workbook exposes five labelled decades from 1960 through 2000.',
    currentPublishedDecade: {
      decade: '2010s',
      annualFirePm25Deaths: 98_748,
      annualDeathsAttributedToClimateChange: 12_566,
      attributedSharePercent: 12.8,
    },
    earliestPublishedDecade: {
      decade: '1960s',
      annualFirePm25Deaths: 46_401,
      annualDeathsAttributedToClimateChange: 669,
      attributedSharePercent: 1.2,
    },
    strongestPositiveRegions: ['South America', 'Australia', 'Europe', 'boreal forests'],
    countervailingRegionExample: 'Increasing relative humidity lowered modeled fire mortality in regions including South Asia.',
    attributionMethod: 'Three fire–vegetation models, a chemical transport model and a health-risk model compare factual climate with counterfactual climate while retaining source-declared socioeconomic inputs.',
    publicSourceDataCheck: {
      labelledDecades: humanMortality.years,
      models: humanMortality.models.map(model => model.model),
      simpleModelMeanAnnualFirePm25Deaths: humanMortality.means,
      simpleModelMeanClimateAttributionPercent: humanAttributionPercent.means,
      article1960sTotalReproducedAfterRounding: round(humanMortality.means[1960], 0) === 46_401,
      article2010sAggregatePresentInCompactWorkbook: false,
      explanation: 'The compact Figure 1 workbook reproduces the article’s 1960s total after rounding but stops at the 2000-labelled column. The 2010s aggregate remains a published article result backed by the full Zenodo input/output archive; TULIP does not invent a sixth workbook column.',
    },
  },
  ecosystem: {
    geography: 'Global forest large-fire sample across climate regions and forest types.',
    observationPeriod: { start: 2001, end: 2021 },
    largeSingleTimeFireEvents: 3_281,
    minimumEventAreaKm2: 10,
    post2010Finding: 'Large fires after 2010 caused greater forest damage and severity expanded toward higher latitudes and more arid regions, particularly in evergreen needleleaf forest.',
    recoveryWithinSevenYears: 'Fewer than one-third of assessed forests recovered successfully within seven years; most successful cases were tropical moisture-rich broadleaf forests.',
    recoveryTimeIncreaseAfter2010Percent: {
      vegetationDensity: 7.5,
      canopyStructure: 11.1,
      grossPrimaryProductivity: 27.3,
    },
    stagnationFinding: 'Recovery stagnation became more common as severity increased, especially in boreal forests.',
    driverFinding: 'Fire severity had a stronger negative relationship with recovery than post-fire climate conditions in the study models; post-fire soil moisture was the main facilitating factor.',
    codeBoundary: {
      commit: sources.ecosystem.publicationCodeCommit,
      notebooks: ecosystemNotebooks.length,
      paths: ecosystemNotebooks.map(entry => entry.path),
      limitation: 'The publication-linked notebooks use separately acquired datasets and do not package the processed event-level inputs needed for a one-command end-to-end reproduction.',
    },
  },
};

const sourceFiles = {
  human: {
    sourceData: { url: sources.human.sourceDataUrl, bytes: humanSourceData.length, sha256: hash('sha256', humanSourceData), actualFormat: 'xlsx_zip_despite_csv_link_suffix' },
    readme: { url: humanRepositoryFiles.readme, bytes: humanReadme.length, md5: hash('md5', humanReadme), sha256: hash('sha256', humanReadme) },
    mainCode: { url: humanRepositoryFiles.mainCode, bytes: humanMainCode.length, md5: hash('md5', humanMainCode), sha256: hash('sha256', humanMainCode) },
  },
  ecosystem: {
    supplementary: { url: sources.ecosystem.supplementaryUrl, bytes: ecosystemSupplementary.length, sha256: hash('sha256', ecosystemSupplementary) },
    codeTree: { repository: sources.ecosystem.codeRepository, commit: sources.ecosystem.publicationCodeCommit, notebooks: ecosystemNotebooks.length },
  },
};

const tulipUse = {
  admitted: [
    'Use the 12,566 annual fire-PM2.5 deaths attributed to climate change in the 2010s as a modeled terminal human consequence for the wildfire-regime boundary.',
    'Use those 12,566 deaths, rather than all 98,748 fire-PM2.5 deaths, for current human reach under the climate-attributed regime-shift question.',
    'Use permanent mortality as human persistence without multiplying by the number of study years.',
    'Use the post-2010 forest damage and recovery findings as direct evidence that changed large-fire severity can impair vegetation density, canopy structure and gross primary productivity.',
    'Use incomplete recovery within seven years to bound ecosystem persistence while retaining the source’s forest-type and latitude differences.',
  ],
  prohibited: [
    'Do not assign all 98,748 annual fire-PM2.5 deaths to climate change or to the regime-shift node; the source attributes 12,566 in the 2010s.',
    'Do not add the Wildfire Smoke PM2.5 Exposure, Air Pollution Health Burden or Wildfire Smoke Hospitalization scores to this rating. They are overlapping views of related pathways.',
    'Do not convert 3,281 fire events, worldwide model coverage or named regions into a percentage of people harmed or forest distribution affected.',
    'Do not treat fire occurrence itself as ecosystem damage. Fire is natural or beneficial in many ecosystems; the admitted evidence is greater severity, impaired condition and delayed recovery.',
    'Do not use the 7.5%, 11.1% and 27.3% increases in recovery time as percentages of ecosystem condition loss or extent.',
    'Do not assume every forest failing to recover within seven years requires more than ten or fifty years. The source supports an upper uncertainty bound, not an exact long-duration category.',
    'Do not project the historical trend directly into 2027–2036 or call it an SSP2-4.5 forecast; neither source supplies a compatible near-term scenario projection.',
    'Do not claim full raw-data reproduction. The human repository contains multi-gigabyte inputs and outputs, and the forest notebooks rely on separately acquired datasets.',
  ],
  reviewFinding: 'Direct modeled mortality makes the human component source-specific. A global forest-event study makes ecosystem recovery source-specific. The central D remains plausible, but the former B–E range can be narrowed because death count and permanence are now directly anchored and ecosystem recovery is no longer inferred from the monitoring period.',
};

const payload = {
  version: 'tulip_wildfire_regime_shift_reference_2026_09_23_v1',
  preparedOn: checkedOn,
  status: 'climate_attributed_human_mortality_and_global_forest_recovery_evidence_ingested',
  productionRatingsEnabled: 0,
  sources: {
    human: { ...sources.human, checkedOn, files: sourceFiles.human, correctionScope: 'The publisher correction changes the unit used to define PM2.5 particle diameter; it does not change mortality results.' },
    ecosystem: { ...sources.ecosystem, checkedOn, files: sourceFiles.ecosystem, correctionScope: 'The publisher correction swaps two colours in the Figure 1c key; it does not change the reported recovery results.' },
  },
  endpoints,
  tulipUse,
  unresolvedForTulip: [
    'A compatible share of global fire-sensitive forest distribution experiencing attributable condition loss.',
    'A common source-native percentage of vegetation, canopy or productivity condition lost within affected forests.',
    'Recovery observations long enough to distinguish ten-to-fifty-year from longer-than-fifty-year consequences globally.',
    'A compatible 2027–2036 SSP2-4.5 terminal-consequence projection.',
    'An end-to-end local reproduction of the full multi-gigabyte human mortality archive and event-level forest recovery workflow.',
  ],
};
payload.snapshotDigest = digest({ sources: payload.sources, endpoints, tulipUse, unresolvedForTulip: payload.unresolvedForTulip });

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  humanClimateAttributedDeaths: endpoints.human.currentPublishedDecade.annualDeathsAttributedToClimateChange,
  forestEvents: endpoints.ecosystem.largeSingleTimeFireEvents,
  digest: payload.snapshotDigest,
}, null, 2));
