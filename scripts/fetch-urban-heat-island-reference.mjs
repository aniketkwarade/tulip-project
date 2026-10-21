import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'urban-heat-island-reference-snapshot.json');
const execFileAsync = promisify(execFile);
const checkedOn = '2026-09-23';
const userAgent = 'LostPlanet-TULIP/1.0 (+urban-heat-island-evidence-ingestion)';

const source = {
  id: 'wang_global_urban_overheating_mortality_2025',
  publisher: 'Nature Climate Change',
  title: 'Dual impact of global urban overheating on mortality',
  publicationDate: '2025-04-21',
  doi: 'https://doi.org/10.1038/s41558-025-02303-3',
  articleUrl: 'https://www.nature.com/articles/s41558-025-02303-3',
  authorCopyUrl: 'https://tc25.github.io/Papers/NATCLIM_2025.pdf',
  dataDoi: 'https://doi.org/10.5281/zenodo.14869462',
  dataUrl: 'https://zenodo.org/api/records/14869462/files/Wangshasha929/urban-heat-v1.zip/content',
};

const expected = {
  paper: { bytes: 6_158_715, sha256: '82f001d76a7cf752d22a523a4439f25efb47701a12949e0d088a1585c45c55ca' },
  archive: { bytes: 974_662, md5: '1ff0d4eefa47b4a3996fc3e027a17cba', sha256: 'e6e85bec138671f0e026344b30f14124e4ed38a88f79bd03fe673dcc2ecb9431' },
  table: { bytes: 2_073_736, sha256: 'e537eee00f12003075e1d5f8c0c1936c7c978a5f1d69b65e56ba37af2c2833c5' },
  methodCode: { bytes: 3_297, sha256: '7a1ecb9c01b70908352abba8d0fe3dd0f72d56b333083c93bf68d85836c873c5' },
};

const archiveEntries = {
  table: 'Wangshasha929-urban-heat-c33fb48/urban_heat_mortality.csv',
  methodCode: 'Wangshasha929-urban-heat-c33fb48/temperature-related mortality estimation.txt',
};

const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const digest = value => hash('sha256', JSON.stringify(value));
const round = (value, digits = 6) => Number(value.toFixed(digits));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 50_000_000, timeout: 130_000 });
  return stdout;
}

function verify(name, buffer, pinned) {
  assert.equal(buffer.length, pinned.bytes, `${name} byte count changed`);
  assert.equal(hash('sha256', buffer), pinned.sha256, `${name} checksum changed`);
  if (pinned.md5) assert.equal(hash('md5', buffer), pinned.md5, `${name} MD5 changed`);
}

function parseSimpleCsv(buffer) {
  const lines = buffer.toString('utf8').trimEnd().split(/\r?\n/);
  const headers = lines.shift().replace(/^\uFEFF/, '').split(',');
  return { headers, rows: lines.map(line => Object.fromEntries(line.split(',').map((value, index) => [headers[index], value.trim()]))) };
}

function numericSummary(rows, field) {
  const values = rows
    .map(row => row[field] === '' ? null : Number(row[field]))
    .filter(value => value != null && Number.isFinite(value))
    .sort((a, b) => a - b);
  assert(values.length > 0, `${field}: no numerical values`);
  const middle = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  return {
    records: values.length,
    mean: round(values.reduce((sum, value) => sum + value, 0) / values.length, 9),
    median: round(median, 9),
    minimum: round(values[0], 9),
    maximum: round(values.at(-1), 9),
    positiveRecords: values.filter(value => value > 0).length,
    negativeRecords: values.filter(value => value < 0).length,
    zeroRecords: values.filter(value => value === 0).length,
  };
}

const [paper, archive] = await Promise.all([fetchBuffer(source.authorCopyUrl), fetchBuffer(source.dataUrl)]);
verify('Author-hosted paper', paper, expected.paper);
verify('Zenodo archive', archive, expected.archive);

const workDir = await mkdtemp(path.join(os.tmpdir(), 'tulip-uhi-'));
const archivePath = path.join(workDir, 'urban-heat.zip');
await writeFile(archivePath, archive);
const [{ stdout: table }, { stdout: methodCode }] = await Promise.all([
  execFileAsync('unzip', ['-p', archivePath, archiveEntries.table], { encoding: null, maxBuffer: 10_000_000 }),
  execFileAsync('unzip', ['-p', archivePath, archiveEntries.methodCode], { encoding: null, maxBuffer: 1_000_000 }),
]);
await rm(workDir, { recursive: true, force: true });
verify('Open city mortality table', table, expected.table);
verify('Published estimation code', methodCode, expected.methodCode);

const parsed = parseSimpleCsv(table);
assert.equal(parsed.rows.length, 3_280);
assert.deepEqual(parsed.headers.slice(0, 12), ['CityID', 'X', 'Y', 'MMT', 'MMP', '0_5', '5_mmp', 'mmp_95', '95_100', 'heat_UHI', 'cold_UHI', 'annual_UHI']);

const summaries = {
  minimumMortalityTemperatureC: numericSummary(parsed.rows, 'MMT'),
  minimumMortalityPercentile: numericSummary(parsed.rows, 'MMP'),
  uhiHeatMortalityChangePercent: numericSummary(parsed.rows, 'heat_UHI'),
  uhiColdMortalityChangePercent: numericSummary(parsed.rows, 'cold_UHI'),
  uhiAnnualNetMortalityChangePercent: numericSummary(parsed.rows, 'annual_UHI'),
};
const validMortalityRows = summaries.uhiAnnualNetMortalityChangePercent.records;
assert.equal(validMortalityRows, 3_276);
assert.equal(summaries.uhiHeatMortalityChangePercent.records, validMortalityRows);
assert.equal(summaries.uhiColdMortalityChangePercent.records, validMortalityRows);

const sourceFiles = {
  paper: { url: source.authorCopyUrl, bytes: paper.length, sha256: hash('sha256', paper) },
  archive: { url: source.dataUrl, bytes: archive.length, md5: hash('md5', archive), sha256: hash('sha256', archive) },
  table: { archiveEntry: archiveEntries.table, bytes: table.length, sha256: hash('sha256', table) },
  methodCode: { archiveEntry: archiveEntries.methodCode, bytes: methodCode.length, sha256: hash('sha256', methodCode) },
};

const endpoint = {
  studyBoundary: {
    selectedCities: 3_280,
    validOpenTableMortalityRows: validMortalityRows,
    incompleteOpenTableMortalityRows: parsed.rows.length - validMortalityRows,
    citySelection: 'Every 2018 global urban area above 30 square kilometres in the source boundary.',
    currentInputs: 'Primarily 2017–2018 urban climate, population and socioeconomic inputs, with mortality-temperature relationships trained from official mortality records in about 700 cities.',
    geography: 'Global city sample spanning six continents and four source-defined climate-zone groups.',
    endpointUnit: 'Percentage change in temperature-related mortality attributed by the model to the urban-minus-suburban temperature difference.',
  },
  openTableSummary: {
    ...summaries,
    citiesWithHigherHeatMortality: summaries.uhiHeatMortalityChangePercent.positiveRecords,
    citiesWithHigherHeatMortalityPercent: round(100 * summaries.uhiHeatMortalityChangePercent.positiveRecords / validMortalityRows, 6),
    citiesWithAdverseAnnualNetMortality: summaries.uhiAnnualNetMortalityChangePercent.positiveRecords,
    citiesWithAdverseAnnualNetMortalityPercent: round(100 * summaries.uhiAnnualNetMortalityChangePercent.positiveRecords / validMortalityRows, 6),
    citiesWithProtectiveAnnualNetMortality: summaries.uhiAnnualNetMortalityChangePercent.negativeRecords,
    citiesWithProtectiveAnnualNetMortalityPercent: round(100 * summaries.uhiAnnualNetMortalityChangePercent.negativeRecords / validMortalityRows, 6),
  },
  publishedArticleSummary: {
    globalMeanMinimumMortalityPercentile: 77.9,
    meanHeatRelatedMortalityIncreasePercent: 11.7,
    meanColdRelatedMortalityReductionPercent: 51.5,
    coldBenefitToHeatHarmRatio: 4.4,
    interpretation: 'The published global mean finds an adverse effect on hot days and a larger protective effect on cold days. Annual net effects vary by climate and city; the result is not a universal claim that urban warming is harmless.',
  },
  reproducibilityBoundary: {
    status: 'open_city_output_table_and_partial_method_code_checksum_pinned',
    tableResult: `The table reproduces the reported 3,280-city scope and a mean minimum-mortality percentile of ${summaries.minimumMortalityPercentile.mean.toFixed(1)}%.`,
    aggregationDifference: `A simple unweighted mean of the ${validMortalityRows} complete public rows is ${summaries.uhiHeatMortalityChangePercent.mean.toFixed(1)}% for hot-day mortality and ${Math.abs(summaries.uhiColdMortalityChangePercent.mean).toFixed(1)}% for cold-day mortality, compared with the article's 11.7% and 51.5%. The paper does not expose enough intermediate daily data in this archive to resolve the cold-side difference, so article and table summaries remain separate.`,
    limitation: 'The archive contains the city result table and an illustrative model-training script with local input paths. It does not contain the complete daily temperature, mortality, random-forest inputs or end-to-end workflow needed to recreate every published result from raw observations.',
  },
  outlook: {
    sourceScenario: 'SSP2-4.5',
    sourceYear: 2050,
    tulipHorizon: '2027–2036',
    use: 'Method and long-range directional context only. The 2050 estimates do not become a numerical TULIP outlook for 2027–2036.',
  },
};

const tulipUse = {
  admitted: [
    'Direct modeled human mortality consequence for hot and cold days, with the urban-minus-suburban counterfactual defined by the source.',
    'Global multi-city evidence that adverse heat-period mortality and annual net mortality have different signs and geographic distributions.',
    'Permanent-consequence evidence for the human persistence axis where modeled excess mortality is admitted.',
    'SSP2-4.5 method and directional context for a separate outlook; not a 2027–2036 magnitude.',
  ],
  prohibited: [
    'Do not treat 3,280 cities, six continents or climate-zone coverage as a count of people harmed.',
    'Do not convert the mean percentage change in temperature-related mortality into deaths without the matching baseline deaths and population for each city.',
    'Do not subtract avoided cold mortality from heat-period deaths inside a harm axis, or omit the protective finding from the explanation.',
    'Do not treat urban temperature, impervious area or population exposure as ecosystem-condition loss.',
    'Do not use the 2050 SSP2-4.5 results as though they measured 2027–2036.',
    'Do not claim full raw-data reproducibility from the partial public code archive.',
  ],
  reviewFinding: 'This source replaces an exposure-only human rationale with a modeled terminal mortality endpoint and reveals strong climate-specific directionality. It does not supply a harmed-person denominator or any nature endpoint, so those axes cannot be inferred from study coverage.',
};

const payload = {
  version: 'tulip_urban_heat_island_reference_2026_09_23_v1',
  preparedOn: checkedOn,
  status: 'direct_global_human_endpoint_ingested_with_dual_effect_and_reproducibility_boundaries',
  productionRatingsEnabled: 0,
  source: { ...source, checkedOn, files: sourceFiles },
  endpoint,
  tulipUse,
  unresolvedForTulip: [
    'A compatible count or population share of people experiencing attributable adverse mortality or morbidity in the current assessment window.',
    'A reviewed decision on whether the node boundary includes direct ecosystem consequences; this mortality study supplies none.',
    'A current consequence-duration distribution for non-fatal illness and service disruption.',
    'A compatible 2027–2036 SSP2-4.5 outlook if a numerical outlook is later required.',
    'Complete intermediate data or authors’ workflow to reconcile every article aggregation with the public city table.',
  ],
};
payload.snapshotDigest = digest({ source: payload.source, endpoint, tulipUse, unresolvedForTulip: payload.unresolvedForTulip });

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, rows: parsed.rows.length, validMortalityRows, digest: payload.snapshotDigest }, null, 2));
