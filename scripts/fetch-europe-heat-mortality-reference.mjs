import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { strFromU8, unzipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calibrationDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(calibrationDir, 'europe-heat-mortality-reference-snapshot.json');
const tableFixturePath = path.join(root, 'scripts', 'fixtures', 'beck-europe-heat-mortality-table1.json');
const checkedOn = '2026-09-23';
const userAgent = 'LostPlanet-TULIP/1.0 (+europe-heat-mortality-endpoint-ingestion)';
const execFileAsync = promisify(execFile);

const attribution2024 = {
  articleUrl: 'https://www.nature.com/articles/s41612-024-00783-2',
  articlePdfUrl: 'https://link.springer.com/content/pdf/10.1038/s41612-024-00783-2.pdf',
  articlePdfSha256: '38f5e96e0717aad097129895dd6dc576b578bd6c8957f770e78c78b68a09b8d9',
  supplementaryUrl: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41612-024-00783-2/MediaObjects/41612_2024_783_MOESM1_ESM.pdf',
  supplementaryPdfSha256: '8938fa85eba984ad1204163239c7cbd2592651ca78bf3517760a8a9d2690065f',
};
const attribution2026 = {
  articleUrl: 'https://www.nature.com/articles/s44360-026-00193-z',
  sourceDataUrl: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs44360-026-00193-z/MediaObjects/44360_2026_193_MOESM3_ESM.xlsx',
  sourceDataSha256: '1cae471516c71df9da11fb53d799f5d3df212121fc3ff3c44aae0ff3f5e39515',
};
const heatMortalityRepository = {
  url: 'https://github.com/BallesterJoan/europe_summer_2022_heat',
  commit: '5c628ca7b8498ca71531e8e7e05168f8bc3a8619',
  files: {
    'LICENSE': '3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986',
    'code.R': '065d28dd43da11ac917641ecd8291729d6daaf08859635c2feb52900e30b09cc',
    'data.csv': '311dea060298564226197a6310f0c9bb1768f3c788a7695cf163127e22508da9',
    'metadata.csv': 'e70b2c55b73a5815f694d4eec912cb2a1cfd553e3f7dbff60651e343591a981c',
  },
};
const attributionRepository = {
  url: 'https://github.com/tmb-esr/2022_attribution_Europe',
  commit: '5a783659914881c8c8c76ed4e6ffedfd00450837',
  files: {
    'LICENSE': '3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986',
    'README.md': '8bbb8802a7a3c5e43df62eba7558856f91ca3abac86c5f002bf6c3e1a4ea1159',
  },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url, accept = '*/*', allowNotFound = false) {
  let lastFailure = 'request failed';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(120_000),
        headers: { Accept: accept, 'User-Agent': userAgent },
      });
      if (response.ok) return { status: response.status, buffer: Buffer.from(await response.arrayBuffer()) };
      if (allowNotFound && response.status === 404) return { status: 404, buffer: Buffer.alloc(0) };
      lastFailure = `HTTP ${response.status}`;
      if ((response.status < 500 && response.status !== 429) || attempt === 3) break;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
      if (attempt === 3) break;
    }
    await new Promise(resolveRetry => setTimeout(resolveRetry, attempt * 1000));
  }
  throw new Error(`${url}: ${lastFailure}`);
}

async function fetchPdfBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location',
    '--fail',
    '--silent',
    '--show-error',
    '--header', `User-Agent: ${userAgent}`,
    '--header', 'Accept: application/pdf',
    url,
  ], { encoding: null, maxBuffer: 20_000_000, timeout: 120_000 });
  return { status: 200, buffer: stdout };
}

function decodeEntities(value = '') {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&ndash;', '–')
    .replaceAll('&minus;', '−')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function columnNumber(reference) {
  return [...reference].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0);
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match =>
    [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(text => decodeEntities(text[1])).join('')
  );
}

function parseSheet(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)\br="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attributes = `${cellMatch[1]} ${cellMatch[3]}`;
      const column = columnNumber(cellMatch[2]) - 1;
      const raw = cellMatch[4]?.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? null;
      if (raw == null) row[column] = null;
      else if (/\bt="s"/.test(attributes)) row[column] = sharedStrings[Number(raw)];
      else row[column] = Number(raw);
    }
    rows[Number(rowMatch[1]) - 1] = row;
  }
  return rows;
}

function parseWorkbook(buffer) {
  const archive = unzipSync(new Uint8Array(buffer));
  const workbookXml = strFromU8(archive['xl/workbook.xml']);
  const relationshipXml = strFromU8(archive['xl/_rels/workbook.xml.rels']);
  const sharedStrings = parseSharedStrings(strFromU8(archive['xl/sharedStrings.xml']));
  const relationships = new Map([...relationshipXml.matchAll(/<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/>/g)]
    .map(match => [match[1], match[2]]));
  const sheets = {};
  for (const match of workbookXml.matchAll(/<sheet\b[^>]*\bname="([^"]+)"[^>]*\br:id="([^"]+)"[^>]*\/>/g)) {
    const target = relationships.get(match[2]);
    assert(target, `Missing relationship for ${match[1]}`);
    const sheetXml = strFromU8(archive[`xl/${target}`]);
    const dimension = sheetXml.match(/<dimension ref="([^"]+)"/)?.[1] ?? null;
    sheets[decodeEntities(match[1])] = { dimension, rows: parseSheet(sheetXml, sharedStrings) };
  }
  return sheets;
}

function distribution(values) {
  const sorted = [...values].filter(Number.isFinite).sort((left, right) => left - right);
  const quantile = probability => {
    const index = (sorted.length - 1) * probability;
    const lower = Math.floor(index);
    const fraction = index - lower;
    return sorted[lower + 1] == null ? sorted[lower] : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
  };
  return { count: sorted.length, minimum: sorted[0], median: quantile(0.5), p95: quantile(0.95), maximum: sorted.at(-1) };
}

const [article2024PdfResponse, supplementary2024PdfResponse, workbook2026Response, tableFixtureBuffer] = await Promise.all([
  fetchPdfBuffer(attribution2024.articlePdfUrl),
  fetchPdfBuffer(attribution2024.supplementaryUrl),
  fetchBuffer(attribution2026.sourceDataUrl, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  readFile(tableFixturePath),
]);
assert.equal(sha256(article2024PdfResponse.buffer), attribution2024.articlePdfSha256, 'The 2024 article PDF checksum changed');
assert.equal(sha256(supplementary2024PdfResponse.buffer), attribution2024.supplementaryPdfSha256, 'The 2024 supplementary PDF checksum changed');
const tableFixture = JSON.parse(tableFixtureBuffer.toString('utf8'));
assert.equal(tableFixture.source.pdfSha256, attribution2024.articlePdfSha256);
assert.equal(tableFixture.source.pdfBytes, article2024PdfResponse.buffer.length);
const table2024 = tableFixture.table1;
assert.deepEqual(Object.keys(table2024).filter(key => /^20/.test(key)).sort(), ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']);
assert.equal(table2024['2022'].anthropogenicHeatDeaths.estimate, 38_154);
assert.equal(table2024['2022'].anthropogenicSharePercent.estimate, 56);

assert.equal(sha256(workbook2026Response.buffer), attribution2026.sourceDataSha256, 'The 2026 source-data workbook checksum changed');
const sheets = parseWorkbook(workbook2026Response.buffer);
const expectedSheets = ['Figure1_a', 'Figure1_b', 'Figure1_c', 'Figure1_d', 'Figure2_a', 'Figure2_b', 'Figure2_c', 'Figure2_d', 'Figure3', 'Figure4', 'Figure5_ab', 'Figure5_cd', 'Extended Data Figure1', 'Extended Data Figure2'];
assert.deepEqual(Object.keys(sheets), expectedSheets);
const dataRows = name => sheets[name].rows.slice(1).filter(Boolean);
const mortalityProbabilityRatios2022 = dataRows('Figure3').map(row => row[6]).filter(Number.isFinite);
const mortalityProbabilityRatios2018 = dataRows('Extended Data Figure2').map(row => row[6]).filter(Number.isFinite);
const regionalAttributableFractions2022 = dataRows('Figure1_d').map(row => row[1]).filter(Number.isFinite);
assert.equal(mortalityProbabilityRatios2022.length, 232);
assert.equal(mortalityProbabilityRatios2018.length, 232);
assert.equal(regionalAttributableFractions2022.length, 232);

const downloadedRepositoryFiles = {};
const repositoryFileBuffers = {};
for (const [filename, expectedHash] of Object.entries(heatMortalityRepository.files)) {
  const url = `https://raw.githubusercontent.com/BallesterJoan/europe_summer_2022_heat/${heatMortalityRepository.commit}/${filename}`;
  const { buffer } = await fetchBuffer(url);
  assert.equal(sha256(buffer), expectedHash, `${filename}: heat-mortality repository checksum changed`);
  downloadedRepositoryFiles[filename] = { url, bytes: buffer.length, sha256: expectedHash };
  repositoryFileBuffers[filename] = buffer;
}
const publicModelCode = repositoryFileBuffers['code.R'].toString('utf8');
const publicDataLines = repositoryFileBuffers['data.csv'].toString('utf8').trim().split(/\r?\n/);
const publicMetadataLines = repositoryFileBuffers['metadata.csv'].toString('utf8').trim().split(/\r?\n/);
const publicDataLocations = new Set(publicDataLines.slice(1).map(line => line.match(/^"?([^",]+)"?,/)?.[1]).filter(Boolean));
const publicMetadataLocations = new Set(publicMetadataLines.slice(1).map(line => line.match(/^"?([^",]+)"?,/)?.[1]).filter(Boolean));
assert.match(publicModelCode, /simplified code with sample data/i);
assert.match(publicModelCode, /results are expected to[\s\S]*differ from those published/i);
assert.equal(publicDataLines.length - 1, 42_642);
assert.equal(publicMetadataLines.length - 1, 103);
assert.equal(publicDataLocations.size, 103);
assert.deepEqual([...publicDataLocations].sort(), [...publicMetadataLocations].sort());
const downloadedAttributionFiles = {};
for (const [filename, expectedHash] of Object.entries(attributionRepository.files)) {
  const url = `https://raw.githubusercontent.com/tmb-esr/2022_attribution_Europe/${attributionRepository.commit}/${filename}`;
  const { buffer } = await fetchBuffer(url);
  assert.equal(sha256(buffer), expectedHash, `${filename}: attribution repository checksum changed`);
  downloadedAttributionFiles[filename] = { url, bytes: buffer.length, sha256: expectedHash };
}
const attributionReadme = await fetchBuffer(`https://raw.githubusercontent.com/tmb-esr/2022_attribution_Europe/${attributionRepository.commit}/README.md`);
assert.equal(attributionReadme.buffer.toString('utf8').trim(), '# 2022_attribution_Europe');
const code2026Status = await fetchBuffer('https://api.github.com/repos/the-sea-git/impact-eea', 'application/vnd.github+json', true);

const annualRows = Object.fromEntries(Object.entries(table2024).filter(([key]) => /^20/.test(key)));
const recentAnthropogenicAnnualDeaths = Object.entries(annualRows)
  .filter(([year]) => Number(year) <= 2021)
  .map(([, row]) => row.anthropogenicHeatDeaths.estimate);
const snapshot = {
  version: 'tulip_europe_heat_mortality_reference_2026_09_23_v2',
  generatedOn: checkedOn,
  status: 'published_current_heat_mortality_endpoint_ingested_with_regional_boundary',
  productionRatingsEnabled: 0,
  purpose: 'Add a recent, quantitative terminal human endpoint for current heat harm without treating European mortality as global or allocating it to individual emissions sources.',
  endpoint2024: {
    id: 'beck_europe_anthropogenic_heat_mortality_2024',
    title: 'Mortality burden attributed to anthropogenic warming during Europe’s 2022 record-breaking summer',
    doi: 'https://doi.org/10.1038/s41612-024-00783-2',
    articleUrl: attribution2024.articleUrl,
    supplementaryUrl: attribution2024.supplementaryUrl,
    fetchedDocuments: {
      articlePdf: { url: attribution2024.articlePdfUrl, bytes: article2024PdfResponse.buffer.length, sha256: attribution2024.articlePdfSha256 },
      supplementaryPdf: { url: attribution2024.supplementaryUrl, bytes: supplementary2024PdfResponse.buffer.length, sha256: attribution2024.supplementaryPdfSha256 },
      extractedTableFixture: { path: 'scripts/fixtures/beck-europe-heat-mortality-table1.json', bytes: tableFixtureBuffer.length, sha256: sha256(tableFixtureBuffer), page: tableFixture.source.page, extractedWith: tableFixture.source.extractedWith },
    },
    geography: { region: 'Europe', countries: 35, contiguousRegions: 823, representedPopulation: 'over 543 million' },
    inputMortalityRecord: { start: '2015-01', end: '2022-11', totalDeathCounts: 45_184_044, womenDeathCounts: 22_000_519, menDeathCounts: 21_913_050 },
    method: {
      temperatureRecord: 'ERA5-Land regional temperatures, 1950–2022',
      counterfactual: 'Regress regional summer mean temperature on a four-year running mean of HadCRUT5 GMST, then subtract the estimated anthropogenic regional warming from factual weekly temperatures.',
      endpoint: 'Apply location-specific distributed-lag nonlinear mortality relationships to factual and counterfactual temperatures; factual minus counterfactual is the anthropogenic heat-mortality endpoint.',
      uncertainty: '1,000 Monte Carlo simulations aggregated at national and continental levels; reported intervals retained as intervals rather than converted to an invented probability distribution.',
      adaptationBoundary: 'The same epidemiological relationship is applied to factual and counterfactual climates, so the result excludes the potential role of adaptation between those climate regimes.',
    },
    annualResults: annualRows,
    summary: {
      anthropogenicHeatDeaths2022: table2024['2022'].anthropogenicHeatDeaths,
      anthropogenicShare2022Percent: table2024['2022'].anthropogenicSharePercent,
      anthropogenicAnnualDeaths2015To2021: distribution(recentAnthropogenicAnnualDeaths),
      southernEuropeAnthropogenicDeaths2022: 26_813,
      southernEuropeShareOfAnthropogenicDeaths2022Percent: 70,
      womenAnthropogenicDeaths2022: table2024.Women.anthropogenicHeatDeaths,
      menAnthropogenicDeaths2022: table2024.Men.anthropogenicHeatDeaths,
      age80PlusAnthropogenicDeaths2022: table2024['Age >80'].anthropogenicHeatDeaths,
    },
    reproducibility: {
      heatMortalityRepository: {
        ...heatMortalityRepository,
        files: downloadedRepositoryFiles,
        scope: 'The repository contains simplified model code and sample inputs for 103 regions. Its authors state that results are expected to differ from the published article; it is not the full 823-region study dataset.',
        publicSample: {
          regions: publicDataLocations.size,
          weeklyRows: publicDataLines.length - 1,
          relationshipToPublishedStudy: 'method illustration and sample data only',
        },
      },
      attributionRepository: { ...attributionRepository, files: downloadedAttributionFiles, scope: 'At the pinned commit the repository contains only a GPL-3.0 license and a one-line README, so it does not reproduce the attribution step.' },
      regionalPatternAvailability: {
        requiredForSourceRemoval: [
          'The regional regression slope linking summer temperature to the four-year running mean HadCRUT5 GMST series.',
          'The lower and upper uncertainty bounds for each regional anthropogenic-warming estimate.',
          'A region identifier that joins those values to the mortality-model inputs.',
        ],
        publishedArticleSummary: 'The article reports a 2022 regional anthropogenic-warming range of 0.63 to 3.90 degrees C and a population-weighted European mean of 2.10 degrees C, but not the 823 region-level values.',
        publishedSupplementScope: [
          'Table S1 separates epidemiological-model uncertainty from anthropogenic-warming uncertainty for the Europe-wide mortality endpoint.',
          'Table S2 reports factual, counterfactual and attributable mortality for 35 countries.',
        ],
        regionLevelWarmingFactorsPublished: false,
        regionLevelWarmingConfidenceBoundsPublished: false,
        attributionCodePubliclyReproducible: false,
        implication: 'The published endpoint can support the heat-mortality node. It cannot validate a regional emissions-source removal run because the regional pattern factors and attribution code are absent from the public materials.',
      },
      status: 'published_methods_and_terminal_results_available_attribution_code_incomplete',
    },
  },
  endpointAttribution2026: {
    id: 'beck_europe_extreme_heat_mortality_attribution_2026',
    title: 'Extreme event attribution for heat-related mortality due to anthropogenic climate change across Europe',
    doi: 'https://doi.org/10.1038/s44360-026-00193-z',
    articleUrl: attribution2026.articleUrl,
    workbook: { url: attribution2026.sourceDataUrl, bytes: workbook2026Response.buffer.length, sha256: attribution2026.sourceDataSha256, sheets: expectedSheets.length },
    publishedScope: { countries: 34, regionsInSourceWorkbook: 232, focalEvents: [2018, 2022] },
    sourceData: {
      sheetDimensions: Object.fromEntries(expectedSheets.map(name => [name, sheets[name].dimension])),
      regionalMortalityProbabilityRatio2022: distribution(mortalityProbabilityRatios2022),
      regionalMortalityProbabilityRatio2018: distribution(mortalityProbabilityRatios2018),
      regionalAttributableFraction2022: distribution(regionalAttributableFractions2022),
      demographicHeatDeathFigureRows: dataRows('Figure1_c').map(row => ({ group: row[1], heatRelatedDeaths: row[2] })),
    },
    interpretation: 'The source data describe the changed likelihood of extreme heat-related mortality events after the epidemiological transformation. A mortality-event probability ratio is an endpoint likelihood measure, not a death count or a TULIP reach denominator.',
    codeAvailability: {
      claimedRepository: 'https://github.com/the-sea-git/impact-eea',
      checkedOn,
      httpStatus: code2026Status.status,
      status: code2026Status.status === 404 ? 'claimed_repository_not_publicly_resolvable_at_review_time' : 'repository_resolvable',
    },
  },
  tulipUse: {
    admitted: [
      'Use the 2015–2022 factual-minus-counterfactual death estimates as direct current human-endpoint evidence for heat-mortality nodes within the declared European geography.',
      'Use the repeated annual estimates to support persistence of the current burden, while counting each death only once and never adding years into one current death total.',
      'Use the 2026 regional mortality-event probability ratios to validate non-linearity and geographic heterogeneity in the endpoint model.',
      'Retain the published intervals and the stated adaptation boundary when assigning confidence and axis bounds.',
    ],
    prohibited: [
      'Do not extrapolate European death counts or rates to the world without a compatible global model and denominator.',
      'Do not multiply the 56% anthropogenic share by a source emissions share, warming share or actor hazard contribution.',
      'Do not treat a mortality-event probability ratio as a death count, affected-person count or TULIP reach measure.',
      'Do not allocate these deaths to an individual TULIP emissions-source node without rerunning the endpoint under that source-removal counterfactual.',
      'Do not use human mortality evidence for ecosystem severity, reach or persistence.',
    ],
    currentCatalogueRecommendation: {
      heatRelatedMortalityBurden: 'Retain E 8.5 and confidence B; the new source independently validates direct terminal harm but does not justify a higher score.',
      heatAttributableExcessMortality: 'Retain E 8.5 and upgrade internal evidence confidence from C to B after detailed review; the quantitative endpoint is direct but geographically aggregated for a global node.',
      emissionSourceNodes: 'No score or confidence change. Source-specific factual-versus-removal endpoint runs remain absent.',
    },
  },
  unresolvedForTulip: [
    'Obtain a compatible global current-period endpoint estimate or assemble a geographically representative set of regional models before using these European results as global reach evidence.',
    'Resolve the incomplete public attribution-code trail for the 2024 study and the currently unresolved claimed repository for the 2026 study.',
    'Obtain the full 823-region mortality-model inputs or independently reproduce the published endpoint; the public model repository contains a 103-region sample only.',
    'Obtain the 823 regional warming slopes and their uncertainty bounds, or rebuild them from ERA5-Land and HadCRUT5, before replacing the uniform local-warming sensitivity with a validated regional source-removal pattern.',
    'Model adaptation explicitly when comparing current populations with historical or source-removal climates.',
    'Run the full nonlinear endpoint for each valid TULIP source-removal temperature history rather than applying proportional allocation.',
    'Select separate source-compatible ecosystem endpoints.',
  ],
};

snapshot.snapshotDigest = digest({
  endpoint2024: snapshot.endpoint2024,
  endpointAttribution2026: snapshot.endpointAttribution2026,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(calibrationDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  deaths2022: snapshot.endpoint2024.summary.anthropogenicHeatDeaths2022,
  annualDeaths2015To2021: snapshot.endpoint2024.summary.anthropogenicAnnualDeaths2015To2021,
  regions2026: snapshot.endpointAttribution2026.publishedScope.regionsInSourceWorkbook,
  digest: snapshot.snapshotDigest,
}, null, 2));
