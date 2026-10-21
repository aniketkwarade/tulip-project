import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { unzipSync } from 'fflate';
import { parseCsv } from './lib/contract-snapshot.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'forest-fragmentation-reference-snapshot.json');
const execFileAsync = promisify(execFile);
const checkedOn = '2026-09-23';
const userAgent = 'LostPlanet-TULIP/1.0 (+forest-fragmentation-evidence-ingestion)';

const sources = {
  currentBiodiversity: {
    id: 'goncalves_souza_fragmented_landscape_biodiversity_2025',
    publisher: 'Nature',
    title: 'Species turnover does not rescue biodiversity in fragmented landscapes',
    publicationDate: '2025-03-12',
    doi: 'https://doi.org/10.1038/s41586-025-08688-7',
    articleUrl: 'https://www.nature.com/articles/s41586-025-08688-7',
    repositoryDoi: 'https://doi.org/10.5281/zenodo.14885581',
    repositoryRecordUrl: 'https://zenodo.org/api/records/14885581',
    archiveUrl: 'https://zenodo.org/api/records/14885581/files/thiago-goncalves-souza/ms-biodiversity-loss-fragmented-landscapes-0.1.0.zip/content',
    publicationCodeCommit: '15f5919a57062ac9b87044aaf49213c2894b1dea',
  },
  longTermExperiment: {
    id: 'haddad_habitat_fragmentation_long_term_experiments_2015',
    publisher: 'Science Advances',
    title: 'Habitat fragmentation and its lasting impact on Earth’s ecosystems',
    publicationDate: '2015-03-20',
    doi: 'https://doi.org/10.1126/sciadv.1500052',
    articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4643828/',
    pmcid: 'PMC4643828',
    biocUrl: 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/PMC4643828/unicode',
  },
};

const expected = {
  currentArchive: {
    bytes: 611_191,
    md5: '0c2359ddbf07ac5e411b7f1f55073e0c',
    sha256: 'f715c9929021431eb7eca06ac3a23e737ffe62dd9e177a1edc5a59cb53e9f2b2',
  },
  longTermAbstract: {
    bytes: 744,
    sha256: '7a7d5ba058057456c8cfcca8695dcaf1e76f37a359c59ef776d20f55272f492c',
  },
};

const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const digest = value => hash('sha256', JSON.stringify(value));
const round = (value, digits = 1) => Number(value.toFixed(digits));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 20_000_000, timeout: 190_000 });
  return stdout;
}

function verifyBuffer(name, buffer, pinned) {
  assert.equal(buffer.length, pinned.bytes, `${name} byte count changed`);
  assert.equal(hash('sha256', buffer), pinned.sha256, `${name} checksum changed`);
  if (pinned.md5) assert.equal(hash('md5', buffer), pinned.md5, `${name} MD5 changed`);
}

function collectTexts(value, texts = []) {
  if (Array.isArray(value)) value.forEach(item => collectTexts(item, texts));
  else if (value && typeof value === 'object') {
    if (typeof value.text === 'string') texts.push(value.text);
    Object.values(value).forEach(item => collectTexts(item, texts));
  }
  return texts;
}

function rowFor(rows, model) {
  const row = rows.find(value => value.model === model && value.term === 'patch_typefragmented');
  assert(row, `Missing published result row: ${model}`);
  return row;
}

const [archive, longTermBioc] = await Promise.all([
  fetchBuffer(sources.currentBiodiversity.archiveUrl),
  fetchBuffer(sources.longTermExperiment.biocUrl),
]);
verifyBuffer('Current biodiversity archive', archive, expected.currentArchive);

const archiveFiles = unzipSync(new Uint8Array(archive));
const resultPath = Object.keys(archiveFiles).find(name => name.endsWith('/results/extracted_summaries_study.csv'));
const readmePath = Object.keys(archiveFiles).find(name => name.endsWith('/README.md'));
const abundancePath = Object.keys(archiveFiles).find(name => name.endsWith('/data/landfrag_37sset_abundance.csv'));
assert(resultPath && readmePath && abundancePath, 'Published archive is missing required data or result files');
const decoder = new TextDecoder();
const resultBytes = Buffer.from(archiveFiles[resultPath]);
const readmeBytes = Buffer.from(archiveFiles[readmePath]);
const abundanceBytes = Buffer.from(archiveFiles[abundancePath]);
const results = parseCsv(decoder.decode(resultBytes));
const readme = decoder.decode(readmeBytes);
assert.match(readme, /4,006 taxa across 37 studies from six continents/i);

const models = [
  ['alphaRichness', 'Alpha (all pairs)'],
  ['gammaRichness', 'Gamma (all pairs)'],
  ['alphaRareWeighted', 'Alpha (all pairs) - q = 0'],
  ['gammaRareWeighted', 'Gamma (all pairs) - q = 0'],
  ['alphaAbundantWeighted', 'Alpha (all pairs) - q = 2'],
  ['gammaAbundantWeighted', 'Gamma (all pairs) - q = 2'],
];
const biodiversityEffects = Object.fromEntries(models.map(([key, model]) => {
  const row = rowFor(results, model);
  const coefficient = Number(row.Estimate);
  const pValue = Number(row['Pr(>|z|)']);
  return [key, {
    model,
    logScaleCoefficient: coefficient,
    fragmentedVersusContinuousPercent: round((Math.exp(coefficient) - 1) * 100, 1),
    pValue,
  }];
}));
assert(Object.values(biodiversityEffects).every(value => value.fragmentedVersusContinuousPercent < 0));
assert(Object.values(biodiversityEffects).every(value => value.pValue < 0.05));

const bioc = JSON.parse(longTermBioc.toString('utf8'));
const longTermAbstract = collectTexts(bioc).find(text => text.startsWith('We conducted an analysis of global forest cover'));
assert(longTermAbstract, 'Long-term fragmentation abstract is missing');
verifyBuffer('Long-term fragmentation abstract', Buffer.from(longTermAbstract), expected.longTermAbstract);
assert.match(longTermAbstract, /70% of remaining forest is within 1 km/);
assert.match(longTermAbstract, /13 to 75%/);
assert.match(longTermAbstract, /35 years/);

const endpoints = {
  currentBiodiversity: {
    geography: 'Thirty-seven forest-fragmentation studies spanning six continents.',
    taxa: 4_006,
    studies: 37,
    continents: 6,
    comparison: 'Fragmented landscapes compared with continuous landscapes; positive beta diversity did not offset lower alpha and gamma diversity.',
    publishedModelEffects: biodiversityEffects,
    directEffectRangePercent: {
      leastNegative: Math.max(...Object.values(biodiversityEffects).map(value => value.fragmentedVersusContinuousPercent)),
      mostNegative: Math.min(...Object.values(biodiversityEffects).map(value => value.fragmentedVersusContinuousPercent)),
    },
    interpretation: 'The source-native model contrasts directly support roughly 10–17% lower alpha or gamma diversity in the principal log-link models. Study coverage is not the fraction of the world’s forests harmed.',
  },
  longTermExperiments: {
    geography: 'Fragmentation experiments across multiple biomes and scales on five continents, paired with global forest-edge mapping.',
    maximumExperimentYears: 35,
    biodiversityReductionRangePercent: { lower: 13, upper: 75 },
    remainingForestWithinOneKmOfEdgePercent: 70,
    effectDirection: 'Effects were greatest in the smallest and most isolated fragments and magnified with time.',
    interpretation: 'The 35-year experiments directly support a ten-to-fifty-year persistence class. The 70% edge-proximity share is exposure to fragmentation pressure, not a demonstrated 70% ecosystem-condition loss or reach value.',
  },
};

const tulipUse = {
  proposedAxes: {
    ecosystem: {
      severity: { lower: 1, central: 2, upper: 3 },
      reach: { lower: 1, central: 2, upper: 3 },
      persistence: { lower: 3, central: 3, upper: 3 },
    },
  },
  admitted: [
    'Use the reproduced 2025 fragmented-versus-continuous diversity contrasts as direct forest-biodiversity condition evidence.',
    'Use the almost-10% global share of forests with little or no connectivity from the existing UNEP-WCMC source as the central affected-distribution anchor.',
    'Use 20% of forests within 100 metres of an edge and 70% within one kilometre only to bound potential reach; edge proximity is pressure and does not prove condition loss.',
    'Use the directly observed 35-year experimental record as a ten-to-fifty-year persistence endpoint.',
  ],
  prohibited: [
    'Do not treat 4,006 taxa, 37 studies or six continents as the fraction of forests or species harmed.',
    'Do not convert the 70% edge-proximity share into 70% movement toward ecosystem collapse or a demonstrated 70% affected distribution.',
    'Do not apply the 13–75% multi-biome experimental range as one global forest average.',
    'Do not add deforestation, forest conversion, species extinction, carbon loss, pollination or human livelihood scores; those are related pathways with their own nodes.',
    'Do not call the 2025 study an SSP2-4.5 projection or extend its cross-study contrast into 2027–2036.',
  ],
  reviewFinding: 'The central C remains appropriate. Direct current forest-biodiversity contrasts anchor severity and the long experiment anchors persistence, narrowing the former B–E range to C–D without treating global edge exposure as demonstrated harm.',
};

const payload = {
  version: 'tulip_forest_fragmentation_reference_2026_09_23_v1',
  preparedOn: checkedOn,
  status: 'direct_biodiversity_contrast_and_long_term_persistence_evidence_ingested',
  productionRatingsEnabled: 0,
  sources: {
    currentBiodiversity: {
      ...sources.currentBiodiversity,
      checkedOn,
      files: {
        archive: { url: sources.currentBiodiversity.archiveUrl, bytes: archive.length, md5: hash('md5', archive), sha256: hash('sha256', archive) },
        resultTable: { path: resultPath, bytes: resultBytes.length, sha256: hash('sha256', resultBytes) },
        abundanceData: { path: abundancePath, bytes: abundanceBytes.length, sha256: hash('sha256', abundanceBytes) },
        readme: { path: readmePath, bytes: readmeBytes.length, sha256: hash('sha256', readmeBytes) },
      },
    },
    longTermExperiment: {
      ...sources.longTermExperiment,
      checkedOn,
      files: {
        extractedAbstract: { bytes: Buffer.byteLength(longTermAbstract), sha256: hash('sha256', longTermAbstract) },
      },
    },
  },
  endpoints,
  tulipUse,
  unresolvedForTulip: [
    'A current global spatial denominator pairing forest fragmentation with measured adverse condition loss, rather than edge exposure alone.',
    'A common collapse reference for alpha and gamma diversity across forest types.',
    'A compatible 2027–2036 SSP2-4.5 forest-fragmentation consequence projection.',
  ],
};
payload.snapshotDigest = digest({ sources: payload.sources, endpoints, tulipUse, unresolvedForTulip: payload.unresolvedForTulip });

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  severityRangePercent: endpoints.currentBiodiversity.directEffectRangePercent,
  persistenceYears: endpoints.longTermExperiments.maximumExperimentYears,
  digest: payload.snapshotDigest,
}, null, 2));
