import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'coral-bleaching-reference-snapshot.json');
const rawDir = process.env.TULIP_CORAL_BLEACHING_RAW_DIR;
const checkedOn = '2026-09-24';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => sha256(Buffer.from(JSON.stringify(value)));
const round = (value, places = 6) => Number(value.toFixed(places));

const files = {
  gcrmnExecutiveSummary: {
    rawName: 'gcrmn_2025_executive-summary.pdf',
    url: 'https://gcrmn.net/wp-content/uploads/2026/08/gcrmn_2025_executive-summary.pdf',
    bytes: 1_789_130,
    sha256: '8b3e62d159a3d155c0d50b1c3197a1af0508fc85ebbf2e32c0eca9e6385b5b53',
  },
  gcrmnZenodoMetadata: {
    rawName: 'gcrmn-zenodo-22654613.json',
    url: 'https://zenodo.org/api/records/22654613',
    validation: 'semantic_record_and_file_identity',
  },
  gcrmnModelledData: {
    rawName: '03_modelled-data.csv',
    url: 'https://zenodo.org/api/records/22654613/files/03_modelled-data.csv/content',
    bytes: 834_878,
    sha256: '92c47be596ffbf9cf6e08305daaa8360c643f0a07ca16e349185874f25c990af',
    md5: 'f7d43683d4a7468a12d69ab79ae46df7',
  },
  gcrmnDetailedGlobal: {
    rawName: '04_detailed-results_global.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_global.html/content',
    bytes: 3_288_624,
    sha256: '0e680f147a2e5e9bcf2f48b2dab97811ec0592091cf18818ebef8f64d002f53d',
    md5: '59c139c9b7fbf88d5593ea0d437e64bf',
  },
  gcrmnRepositoryReadme: {
    rawName: 'global-2025-README.md',
    url: 'https://raw.githubusercontent.com/GCRMN/global_2025/7ef705f7009f51102582bbb15a88026fce140ed2/README.md',
    bytes: 23_075,
    sha256: '40a5e28093b16ff008a9bd9634e2bf18be12095b063471b0b19bc562c2db3488',
  },
  gcrmnExecutiveCode: {
    rawName: 'd11_executive-summary.R',
    url: 'https://raw.githubusercontent.com/GCRMN/global_2025/7ef705f7009f51102582bbb15a88026fce140ed2/code/d11_executive-summary.R',
    bytes: 24_949,
    sha256: '1131a4e24408c31e1e01bd1d902149514ec731cd2938669dd8f01de64cde36e3',
  },
  gcrmnAustraliaDetails: {
    rawName: 'gcrmn-australia.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_australia.html/content',
    bytes: 4_505_576,
    sha256: 'ae30e33c90dbf9f37e82ebb220a92082f7a0cbe8ec528ba4f8f4aaca9fd9105a',
    md5: '7b3e1711b35c18d71d95911b81ffda41',
  },
  gcrmnBrazilDetails: {
    rawName: 'gcrmn-brazil.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_brazil.html/content',
    bytes: 3_766_475,
    sha256: 'b5d6cc92e63395a67cf50868ebd1a248c5e39eb60f5a71fa95928aae6581a07a',
    md5: '9c29df4af368b42c23517bd89640c9b1',
  },
  gcrmnCaribbeanDetails: {
    rawName: 'gcrmn-caribbean.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_caribbean.html/content',
    bytes: 4_378_426,
    sha256: '5606461f795bd71daaf7f6738dcaefc70abbf96a3a31b9ecaba5cdefe9fa62de',
    md5: 'c5659ab44c2a581c4cf1546941136385',
  },
  gcrmnEastAsianSeasDetails: {
    rawName: 'gcrmn-eas.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_eas.html/content',
    bytes: 4_378_101,
    sha256: 'a24f88c7022a97fb56059ba7b63811cf907d88a954e3b66046a1106ec80294bb',
    md5: '1d42289123c7a9a72392b7fafcff6e85',
  },
  gcrmnEasternTropicalPacificDetails: {
    rawName: 'gcrmn-etp.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_etp.html/content',
    bytes: 3_910_020,
    sha256: '72c01137f021ebe28fdd2bc7335f2211461a637be088e8fd9e68fa2ae29df4be',
    md5: '8e8c030fa247f3246b174f0480920dd3',
  },
  gcrmnPacificDetails: {
    rawName: 'gcrmn-pacific.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_pacific.html/content',
    bytes: 4_512_055,
    sha256: 'c8d7597d85e3db8b0ab6e46aa7acf88c82088abbba8da01f3471bd9265dc1b44',
    md5: '3eaa9f2918e2126c5cea5209e37b0f7b',
  },
  gcrmnRopmeDetails: {
    rawName: 'gcrmn-ropme.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_ropme.html/content',
    bytes: 3_588_824,
    sha256: '0912eceb496904337d801260cb7486cba471b1d81b8d36e2ee43e39f5a1eb5ed',
    md5: '449d0bbc7db85a42ef42c7135ea72042',
  },
  gcrmnRedSeaGulfAdenDetails: {
    rawName: 'gcrmn-rsga.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_rsga.html/content',
    bytes: 3_629_541,
    sha256: 'e93c9fc5c1d93bdd0af8962ff063c39cc8e759af9385d66de0c89d1eb4a05222',
    md5: '0e5617c34ae77a338bc50dd101277d48',
  },
  gcrmnSouthAsiaDetails: {
    rawName: 'gcrmn-south-asia.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_south-asia.html/content',
    bytes: 3_661_671,
    sha256: '58fda8d64e5401de2b436f1f89025da44fe8ece48218e5e7501f6a21d3dd49e0',
    md5: 'bf3f700d98e6bb00ea0f2844fd46c69a',
  },
  gcrmnWesternIndianOceanDetails: {
    rawName: 'gcrmn-wio.html',
    url: 'https://zenodo.org/api/records/22654613/files/04_detailed-results_wio.html/content',
    bytes: 4_068_789,
    sha256: '534a6adbfb56f62cbc9f145d0e8ecf54bd196117c2306d77ec6d79b7dd2757e6',
    md5: 'b84e271a07e1a5fcac6842d7771384b1',
  },
  eakinArticleXml: {
    rawName: 'coral-damage-article.xml',
    url: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12891614/fullTextXML',
    bytes: 189_717,
    sha256: 'e2b2c392558e868a9d35a60f98de0c1da236a7dfaab77133fc2268da91b5ca6b',
  },
  eakinZenodoMetadata: {
    rawName: 'coral-damage-meta.json',
    url: 'https://zenodo.org/api/records/17612210',
    validation: 'semantic_record_and_file_identity',
  },
  eakinSurveyDatabase: {
    rawName: 'coral-damage-database.csv',
    url: 'https://zenodo.org/api/records/17612210/files/Database_v7_061219_fixNA.csv/content',
    bytes: 6_678_093,
    sha256: '7e1db98b6aba96c06b9d56c1ee3cdca2a679a9dbea1579ff8d7cf4715833684e',
    md5: '74346b5176d6fe84b399c82da870ca4e',
  },
  greatBarrierReefRecoveryXml: {
    rawName: 'gbr-recovery.xml',
    url: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6051737/fullTextXML',
    bytes: 95_305,
    sha256: 'b2bfd467f410131c59d468f436aa24fd5bcb3faef298e9b4f6fde83fda01c80a',
  },
};

async function load(file, label) {
  let body;
  if (rawDir) body = await readFile(path.join(rawDir, file.rawName));
  else {
    const response = await fetch(file.url, {
      signal: AbortSignal.timeout(120_000),
      headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+coral-bleaching-evidence-ingestion)' },
    });
    assert(response.ok, `${label}: HTTP ${response.status}`);
    body = Buffer.from(await response.arrayBuffer());
  }
  if (Number.isInteger(file.bytes)) assert.equal(body.length, file.bytes, `${label}: byte size changed`);
  if (file.sha256) assert.equal(sha256(body), file.sha256, `${label}: checksum changed`);
  return body;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else value += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n') {
      row.push(value.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      value = '';
    } else value += character;
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function mean(values) {
  assert(values.length > 0);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function extractRegionWeights(html) {
  const caption = 'Region reef area and weights applied in the aggregation up to the Global scale.';
  const captionIndex = html.indexOf(caption);
  assert(captionIndex >= 0, 'GCRMN detailed results: region-weight table caption missing');
  const tableStart = html.indexOf('<table', captionIndex);
  const tableEnd = html.indexOf('</table>', tableStart);
  assert(tableStart >= 0 && tableEnd > tableStart, 'GCRMN detailed results: region-weight table missing');
  const table = html.slice(tableStart, tableEnd + '</table>'.length);
  const entries = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map(match => [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(cell => cell[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()))
    .filter(cells => cells.length === 3)
    .map(([region, area, weight]) => ({ region, areaM2: Number(area), weight: Number(weight) }));
  assert.equal(entries.length, 10, 'GCRMN detailed results: expected ten regional weights');
  assert(Math.abs(entries.reduce((sum, entry) => sum + entry.weight, 0) - 1) < 1e-6);
  return entries;
}

function cleanHtml(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTableAfter(html, marker) {
  const markerIndex = html.indexOf(marker);
  assert(markerIndex >= 0, `GCRMN regional results: marker missing: ${marker}`);
  const tableStart = html.indexOf('<table', markerIndex);
  const tableEnd = html.indexOf('</table>', tableStart);
  assert(tableStart >= 0 && tableEnd > tableStart, `GCRMN regional results: table missing after: ${marker}`);
  return html.slice(tableStart, tableEnd + '</table>'.length);
}

function extractCells(row) {
  return [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(match => match[1]);
}

function extractSubregionChanges(html, sourceFile) {
  const weightsTable = extractTableAfter(html, 'Subregion reef area and weights applied in the aggregation up to Region.');
  const weights = new Map();
  for (const match of weightsTable.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = extractCells(match[1]);
    if (cells.length !== 5 || cleanHtml(cells[0]) === 'Region') continue;
    const name = cleanHtml(cells[2]);
    weights.set(name, {
      region: cleanHtml(cells[0]),
      subregion: cleanHtml(cells[1]),
      name,
      areaM2: Number(cleanHtml(cells[3])),
      regionWeight: Number(cleanHtml(cells[4])),
    });
  }

  const changeTable = extractTableAfter(html, 'Change in Hard coral cover (%) for each Subregion');
  const rows = [];
  for (const match of changeTable.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = extractCells(match[1]);
    if (cells.length !== 5) continue;
    const name = cleanHtml(cells[0]);
    if (!weights.has(name)) continue;
    const changeMatch = cleanHtml(cells[2]).match(/[Δ𝚫]\s*([+-]?\d+(?:\.\d+)?)%/);
    const evidenceIcons = [...cells[4].matchAll(/data:image\/svg\+xml;base64,([^"']+)/g)]
      .map(icon => Buffer.from(icon[1], 'base64').toString('utf8').match(/antenna-bars-(\d)/)?.[1])
      .filter(Boolean)
      .map(Number);
    const evidenceIcon = evidenceIcons.length ? Math.max(...evidenceIcons) : null;
    rows.push({
      ...weights.get(name),
      changePct: changeMatch ? Number(changeMatch[1]) : null,
      evidenceBars: evidenceIcon === null ? null : evidenceIcon - 1,
      sourceFile,
    });
  }
  assert.equal(rows.length, weights.size, `GCRMN regional results: parsed change rows differ from area rows in ${sourceFile}`);
  return rows;
}

const [
  gcrmnExecutiveSummary,
  gcrmnZenodoMetadataBytes,
  gcrmnModelledData,
  gcrmnDetailedGlobal,
  gcrmnRepositoryReadme,
  gcrmnExecutiveCode,
  gcrmnAustraliaDetails,
  gcrmnBrazilDetails,
  gcrmnCaribbeanDetails,
  gcrmnEastAsianSeasDetails,
  gcrmnEasternTropicalPacificDetails,
  gcrmnPacificDetails,
  gcrmnRopmeDetails,
  gcrmnRedSeaGulfAdenDetails,
  gcrmnSouthAsiaDetails,
  gcrmnWesternIndianOceanDetails,
  eakinArticleXml,
  eakinZenodoMetadataBytes,
  eakinSurveyDatabase,
  greatBarrierReefRecoveryXml,
  noaaSnapshotText,
] = await Promise.all([
  load(files.gcrmnExecutiveSummary, 'GCRMN executive summary'),
  load(files.gcrmnZenodoMetadata, 'GCRMN Zenodo metadata'),
  load(files.gcrmnModelledData, 'GCRMN modelled data'),
  load(files.gcrmnDetailedGlobal, 'GCRMN detailed global results'),
  load(files.gcrmnRepositoryReadme, 'GCRMN repository README'),
  load(files.gcrmnExecutiveCode, 'GCRMN executive-summary code'),
  ...[
    'gcrmnAustraliaDetails',
    'gcrmnBrazilDetails',
    'gcrmnCaribbeanDetails',
    'gcrmnEastAsianSeasDetails',
    'gcrmnEasternTropicalPacificDetails',
    'gcrmnPacificDetails',
    'gcrmnRopmeDetails',
    'gcrmnRedSeaGulfAdenDetails',
    'gcrmnSouthAsiaDetails',
    'gcrmnWesternIndianOceanDetails',
  ].map(key => load(files[key], key)),
  load(files.eakinArticleXml, 'Eakin global coral-damage article'),
  load(files.eakinZenodoMetadata, 'Eakin global coral-damage Zenodo metadata'),
  load(files.eakinSurveyDatabase, 'Eakin global coral-damage survey database'),
  load(files.greatBarrierReefRecoveryXml, 'Great Barrier Reef recovery article XML'),
  readFile(path.join(root, 'public', 'coral-reef-watch-snapshot.json'), 'utf8'),
]);

assert.equal(gcrmnExecutiveSummary.subarray(0, 5).toString(), '%PDF-');
const gcrmnZenodoMetadata = JSON.parse(gcrmnZenodoMetadataBytes);
assert.equal(gcrmnZenodoMetadata.id, 22_654_613);
assert.equal(gcrmnZenodoMetadata.doi, '10.5281/zenodo.22654613');
assert.equal(gcrmnZenodoMetadata.conceptrecid, '21824188');
const zenodoFiles = Object.fromEntries(gcrmnZenodoMetadata.files.map(file => [file.key, file]));
assert.equal(zenodoFiles['03_modelled-data.csv'].size, files.gcrmnModelledData.bytes);
assert.equal(zenodoFiles['03_modelled-data.csv'].checksum, `md5:${files.gcrmnModelledData.md5}`);
assert.equal(zenodoFiles['04_detailed-results_global.html'].size, files.gcrmnDetailedGlobal.bytes);
assert.equal(zenodoFiles['04_detailed-results_global.html'].checksum, `md5:${files.gcrmnDetailedGlobal.md5}`);
for (const key of [
  'gcrmnAustraliaDetails',
  'gcrmnBrazilDetails',
  'gcrmnCaribbeanDetails',
  'gcrmnEastAsianSeasDetails',
  'gcrmnEasternTropicalPacificDetails',
  'gcrmnPacificDetails',
  'gcrmnRopmeDetails',
  'gcrmnRedSeaGulfAdenDetails',
  'gcrmnSouthAsiaDetails',
  'gcrmnWesternIndianOceanDetails',
]) {
  const record = files[key];
  const remoteKey = new URL(record.url).pathname.split('/').at(-2);
  assert.equal(zenodoFiles[remoteKey].size, record.bytes);
  assert.equal(zenodoFiles[remoteKey].checksum, `md5:${record.md5}`);
}

const eakinArticleText = cleanHtml(eakinArticleXml.toString('utf8'));
assert.match(eakinArticleText, /15,066 reef surveys globally during 2014[–-]2017/i);
assert.match(eakinArticleText, /models predict that 51% and 15% of the world’s coral reefs suffered moderate or greater bleaching and mortality/i);
assert.match(eakinArticleText, /80% and 35% experienced moderate or greater.*bleaching and mortality/i);
const eakinZenodoMetadata = JSON.parse(eakinZenodoMetadataBytes);
assert.equal(eakinZenodoMetadata.id, 17_612_210);
assert.equal(eakinZenodoMetadata.doi, '10.5281/zenodo.17612210');
assert.equal(eakinZenodoMetadata.conceptrecid, '15114357');
const eakinFiles = Object.fromEntries(eakinZenodoMetadata.files.map(file => [file.key, file]));
assert.equal(eakinFiles['Database_v7_061219_fixNA.csv'].size, files.eakinSurveyDatabase.bytes);
assert.equal(eakinFiles['Database_v7_061219_fixNA.csv'].checksum, `md5:${files.eakinSurveyDatabase.md5}`);
const eakinDatabaseRows = parseCsv(eakinSurveyDatabase.toString('utf8'));
assert.equal(eakinDatabaseRows.length, 15_103);
const greatBarrierReefRecoveryText = cleanHtml(greatBarrierReefRecoveryXml.toString('utf8'));
assert.match(greatBarrierReefRecoveryText, /more than 1300 post-disturbance trajectories of coral taxa from 81 reefs over 19 years/i);
assert.match(greatBarrierReefRecoveryText, /recovery rates across the GBR declined by an average of 84% between 1992 and 2010/i);

const noaaSnapshot = JSON.parse(noaaSnapshotText);
assert.equal(noaaSnapshot.source.id, 'noaa_coral_reef_watch');
assert.equal(noaaSnapshot.current_global_bleaching_event.reef_area_with_bleaching_level_heat_stress_pct, 84.4);
assert.equal(noaaSnapshot.current_global_bleaching_event.jurisdictions_with_documented_mass_bleaching_lower_bound, 83);

const csvRows = parseCsv(gcrmnModelledData.toString('utf8'));
const headers = csvRows.shift();
assert.deepEqual(headers, ['category', 'level', 'region', 'subregion', 'subregion_name', 'year', 'median', 'lower_ci_95', 'upper_ci_95', 'lower_ci_80', 'upper_ci_80', 'data_obs']);
const modelledRows = csvRows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
const globalHardCoral = modelledRows
  .filter(row => row.category === 'Hard coral' && row.level === 'global')
  .map(row => ({
    year: Number(row.year),
    medianPct: Number(row.median),
    lower95Pct: Number(row.lower_ci_95),
    upper95Pct: Number(row.upper_ci_95),
    observedDataPresent: row.data_obs === 'TRUE',
  }));
assert.equal(globalHardCoral.length, 45);
assert.deepEqual([globalHardCoral[0].year, globalHardCoral.at(-1).year], [1980, 2024]);
const referenceRows = globalHardCoral.filter(row => row.year >= 1980 && row.year <= 2009);
const currentPeriodRows = globalHardCoral.filter(row => row.year >= 2020 && row.year <= 2024);
const byYear = new Map(globalHardCoral.map(row => [row.year, row]));
const referenceMedianPct = mean(referenceRows.map(row => row.medianPct));
const currentPeriodMedianPct = mean(currentPeriodRows.map(row => row.medianPct));
const latest = byYear.get(2024);
const regionWeights = extractRegionWeights(gcrmnDetailedGlobal.toString('utf8'));
const decliningRegions = ['Australia', 'Caribbean', 'Pacific', 'ROPME'];
const decliningRegionWeight = regionWeights
  .filter(row => decliningRegions.includes(row.region))
  .reduce((sum, row) => sum + row.weight, 0);
const regionalKeys = [
  'gcrmnAustraliaDetails',
  'gcrmnBrazilDetails',
  'gcrmnCaribbeanDetails',
  'gcrmnEastAsianSeasDetails',
  'gcrmnEasternTropicalPacificDetails',
  'gcrmnPacificDetails',
  'gcrmnRopmeDetails',
  'gcrmnRedSeaGulfAdenDetails',
  'gcrmnSouthAsiaDetails',
  'gcrmnWesternIndianOceanDetails',
];
const gcrmnRegionalDetails = [
  gcrmnAustraliaDetails,
  gcrmnBrazilDetails,
  gcrmnCaribbeanDetails,
  gcrmnEastAsianSeasDetails,
  gcrmnEasternTropicalPacificDetails,
  gcrmnPacificDetails,
  gcrmnRopmeDetails,
  gcrmnRedSeaGulfAdenDetails,
  gcrmnSouthAsiaDetails,
  gcrmnWesternIndianOceanDetails,
];
const subregionChanges = gcrmnRegionalDetails.flatMap((body, index) => extractSubregionChanges(
  body.toString('utf8'),
  files[regionalKeys[index]].rawName,
));
assert.equal(subregionChanges.length, 51);
const mappedReefAreaM2 = subregionChanges.reduce((sum, row) => sum + row.areaM2, 0);
const decliningSubregions = subregionChanges.filter(row => row.changePct < 0 && row.evidenceBars >= 1);
const decliningSubregionAreaM2 = decliningSubregions.reduce((sum, row) => sum + row.areaM2, 0);
const unavailableSubregionAreaM2 = subregionChanges
  .filter(row => row.changePct === null)
  .reduce((sum, row) => sum + row.areaM2, 0);
const areaWeightedDeclineWithinDecliningSubregionsPct = decliningSubregions
  .reduce((sum, row) => sum + (-row.changePct * row.areaM2), 0) / decliningSubregionAreaM2;
const declineBands = [
  { id: 'under_10_pct', min: 0, max: 10 },
  { id: '10_to_under_30_pct', min: 10, max: 30 },
  { id: '30_to_under_70_pct', min: 30, max: 70 },
  { id: '70_pct_or_more', min: 70, max: Infinity },
].map(band => {
  const matching = decliningSubregions.filter(row => -row.changePct >= band.min && -row.changePct < band.max);
  const areaM2 = matching.reduce((sum, row) => sum + row.areaM2, 0);
  return { id: band.id, subregionCount: matching.length, shareOfMappedGlobalReefAreaPct: round(areaM2 / mappedReefAreaM2 * 100) };
});

const repositoryReadmeText = gcrmnRepositoryReadme.toString('utf8');
assert.match(repositoryReadmeText.replace(/\s+/g, ' '), /status and trends of shallow-water coral reefs worldwide from 1980 to 2024/i);
const executiveCodeText = gcrmnExecutiveCode.toString('utf8');
assert.match(executiveCodeText, /change\s*=\s*c\(-10\.9,\s*0,\s*-43\.4,\s*0,\s*0,\s*-18\.3,\s*0,\s*-48\.7,\s*16\.2,\s*43\.0,\s*-9\.5\)/);
const gcrmnFileKeys = [
  'gcrmnExecutiveSummary',
  'gcrmnZenodoMetadata',
  'gcrmnModelledData',
  'gcrmnDetailedGlobal',
  'gcrmnRepositoryReadme',
  'gcrmnExecutiveCode',
  ...regionalKeys,
];

const snapshot = {
  version: 'tulip_coral_bleaching_reference_2026_09_24_v2',
  generatedOn: checkedOn,
  status: 'current_global_condition_subregion_distribution_and_global_event_damage_ingested_for_internal_adjudication',
  productionRatingsEnabled: 0,
  purpose: 'Constrain the Coral Bleaching rating with current global hard-coral condition, a 51-subregion reef-area distribution, a global modeled bleaching and mortality study, and observed recovery evidence while keeping condition, exposure, mortality and human dependence separate.',
  sources: {
    gcrmn2025: {
      id: 'gcrmn_status_coral_reefs_2025',
      title: 'Status of Coral Reefs of the World: 2025',
      publisher: 'Global Coral Reef Monitoring Network; International Coral Reef Initiative',
      publicationDate: '2026-08-31',
      reportDoi: 'https://doi.org/10.59387/LFPR6347',
      supplementConceptDoi: 'https://doi.org/10.5281/zenodo.21824188',
      supplementVersionDoi: 'https://doi.org/10.5281/zenodo.22654613',
      repository: 'https://github.com/GCRMN/global_2025',
      repositoryCommit: '7ef705f7009f51102582bbb15a88026fce140ed2',
      externalScientificReview: 'International Coral Reef Society coordinated independent external review of the global assessment and methods.',
      files: Object.fromEntries(gcrmnFileKeys.map(key => [key, files[key]])),
    },
    noaaCoralReefWatch: {
      id: noaaSnapshot.source.id,
      title: noaaSnapshot.source.name,
      publisher: noaaSnapshot.source.publisher,
      url: noaaSnapshot.source.url,
      sourceSnapshotVersion: noaaSnapshot.version,
      sourceSnapshotDigest: sha256(Buffer.from(noaaSnapshotText)),
      sourceUpdatedAt: noaaSnapshot.current_global_bleaching_event.source_updated_at,
    },
    globalBleachingDamage2026: {
      id: 'eakin_global_coral_bleaching_damage_2026',
      title: 'Severe and widespread coral reef damage during the 2014–2017 Global Coral Bleaching Event',
      publisher: 'Nature Communications',
      publicationDate: '2026-02-10',
      articleDoi: 'https://doi.org/10.1038/s41467-025-67506-w',
      dataConceptDoi: 'https://doi.org/10.5281/zenodo.15114357',
      dataVersionDoi: 'https://doi.org/10.5281/zenodo.17612210',
      files: {
        articleXml: files.eakinArticleXml,
        zenodoMetadata: files.eakinZenodoMetadata,
        surveyDatabase: files.eakinSurveyDatabase,
      },
    },
    greatBarrierReefRecovery2018: {
      id: 'ortiz_great_barrier_reef_recovery_2018',
      title: 'Impaired recovery of the Great Barrier Reef under cumulative stress',
      publisher: 'Science Advances',
      publicationDate: '2018-07-18',
      articleDoi: 'https://doi.org/10.1126/sciadv.aar6127',
      pmcid: 'PMC6051737',
      file: files.greatBarrierReefRecoveryXml,
    },
  },
  currentWindow: {
    start: 2020,
    end: 2024,
    coverageStatus: 'global_modelled_condition_with_operational_event_context_through_2025',
    summaryMethod: 'reef_area_weighted_global_hard_coral_cover',
    coverageNote: 'GCRMN compares the mean modelled hard-coral cover in 2020–2024 with its 1980–2009 reference period and reports annual estimates through 2024. NOAA supplies 2023–2025 heat-stress exposure and documented mass-bleaching context, not a global coral-mortality census.',
    isLatestAvailable: true,
    recencyCheckedOn: checkedOn,
    recencyRationale: 'The 31 August 2026 GCRMN report is the newest global condition synthesis located. It covers 1980–2024 and notes that the fourth global event is not yet fully represented. NOAA provides the later event boundary through September 2025.',
    normalization: 'Use percentage live hard-coral cover as a reef-condition indicator. Compare source-modelled periods and retain regional reef-area weights. Do not convert heat-stress exposure, country count, monitoring coverage or people living near reefs into biological condition loss.',
  },
  endpoints: {
    globalHardCoralCondition: {
      referencePeriod: { start: 1980, end: 2009, meanModelledCoverPct: round(referenceMedianPct) },
      currentPeriod: { start: 2020, end: 2024, meanModelledCoverPct: round(currentPeriodMedianPct) },
      relativeChangeCurrentPeriodVsReferencePct: round((currentPeriodMedianPct / referenceMedianPct - 1) * 100),
      latestYear: {
        year: latest.year,
        medianCoverPct: latest.medianPct,
        lower95Pct: latest.lower95Pct,
        upper95Pct: latest.upper95Pct,
        relativeChangeVsReferencePct: round((latest.medianPct / referenceMedianPct - 1) * 100),
      },
      largestSingleYearDecline2023To2024Pct: round((byYear.get(2024).medianPct / byYear.get(2023).medianPct - 1) * 100),
      partialRecovery2017To2019Pct: round((byYear.get(2019).medianPct / byYear.get(2017).medianPct - 1) * 100),
      series: globalHardCoral,
      indicatorBoundary: 'Live hard-coral cover is a standard reef-condition indicator but does not fully represent species composition, diversity, three-dimensional structure or ecosystem function.',
    },
    regionalConditionContext: {
      regionWeights,
      reportClassifiedDecliningRegions: decliningRegions,
      decliningRegionsShareOfMappedGlobalReefAreaPct: round(decliningRegionWeight * 100),
      boundary: 'This is the reef-area weight represented by regions whose aggregate trend is classified as declining. It is not the percentage of individual reefs or colonies that declined and therefore constrains, but does not directly set, TULIP reach.',
    },
    subregionConditionDistribution: {
      subregionCount: subregionChanges.length,
      mappedGlobalReefAreaM2: mappedReefAreaM2,
      decliningSubregionCount: decliningSubregions.length,
      decliningSubregionsShareOfMappedGlobalReefAreaPct: round(decliningSubregionAreaM2 / mappedReefAreaM2 * 100),
      strongEvidenceDecliningSubregionsShareOfMappedGlobalReefAreaPct: round(
        decliningSubregions.filter(row => row.evidenceBars >= 3).reduce((sum, row) => sum + row.areaM2, 0) / mappedReefAreaM2 * 100,
      ),
      maximumEvidenceDecliningSubregionsShareOfMappedGlobalReefAreaPct: round(
        decliningSubregions.filter(row => row.evidenceBars >= 4).reduce((sum, row) => sum + row.areaM2, 0) / mappedReefAreaM2 * 100,
      ),
      unavailableChangeShareOfMappedGlobalReefAreaPct: round(unavailableSubregionAreaM2 / mappedReefAreaM2 * 100),
      areaWeightedRelativeCoverDeclineWithinDecliningSubregionsPct: round(areaWeightedDeclineWithinDecliningSubregionsPct),
      declineBands,
      subregions: subregionChanges,
      boundary: 'This distribution uses the report’s modelled subregion hard-coral-cover changes and mapped reef-area weights. A subregion aggregate is not a census of every reef or colony. The unavailable share keeps the upper reach bound open, and hard-coral cover remains an incomplete measure of reef function.',
    },
    globalBleachingAndMortality2014To2017: {
      inWaterAndAerialSurveysAfterExclusions: 15_066,
      archivedDatabaseRowsIncludingHeader: eakinDatabaseRows.length,
      surveyedReefsWithModerateOrGreaterBleachingPct: 80,
      surveyedReefsWithSevereBleachingPct: 31,
      surveyedReefsWithModerateOrGreaterRecentMortalityPct: 35,
      surveyedReefsWithSevereRecentMortalityPct: 6,
      modeledGlobalReefLocationsWithModerateOrGreaterBleachingPct: 51,
      modeledGlobalReefLocationsWithModerateOrGreaterMortalityPct: 15,
      thresholdDefinition: 'Moderate or greater means more than 10% of corals; severe means more than 50%.',
      modelBoundary: 'The global 51% bleaching and 15% mortality estimates are the peer-reviewed study’s bias-corrected model outputs for 2014–2017. They are not simple row percentages from the archived survey CSV and are not relabelled as current 2023–2025 outcomes.',
    },
    recoveryEvidence: {
      globalPartialRecovery2017To2019Pct: round((byYear.get(2019).medianPct / byYear.get(2017).medianPct - 1) * 100),
      greatBarrierReefPostDisturbanceTrajectories: 1_300,
      greatBarrierReefReefCount: 81,
      greatBarrierReefObservationYears: 19,
      greatBarrierReefRecoveryRateDecline1992To2010Pct: 84,
      boundary: 'The global series establishes multi-year partial recovery and reversal. The Great Barrier Reef study shows that recovery can remain suppressed for years, but one region cannot supply a global recovery-time distribution.',
    },
    operationalBleachingEvent: {
      observationPeriod: {
        start: noaaSnapshot.current_global_bleaching_event.observation_start,
        end: noaaSnapshot.current_global_bleaching_event.observation_end,
      },
      reefAreaWithBleachingLevelHeatStressPct: noaaSnapshot.current_global_bleaching_event.reef_area_with_bleaching_level_heat_stress_pct,
      jurisdictionsWithDocumentedMassBleachingLowerBound: noaaSnapshot.current_global_bleaching_event.jurisdictions_with_documented_mass_bleaching_lower_bound,
      measurementBoundary: noaaSnapshot.current_global_bleaching_event.measurement_boundary,
    },
    compatibleCurrentHarmedPersonCount: null,
    compatibleCurrentGlobalFractionOfReefAreaWithMeasuredBleachingOrMortality: null,
    compatibleGlobalRecoveryTimeDistribution: null,
  },
  tulipUse: {
    nodeId: 'coral_bleaching',
    admitted: [
      'Use the GCRMN global hard-coral cover series as direct current reef-condition evidence and as an incomplete proxy for consequences of repeated mass bleaching.',
      'Use the 2024 cover estimate relative to the 1980–2009 reference to constrain ecosystem severity; retain the report warning that hard-coral cover is not the whole reef ecosystem.',
      'Use the 51-subregion distribution to establish that modelled declining subregions represent 37.8% of mapped global reef area. Keep the 46.9% unavailable-change share in the upper reach bound.',
      'Use the affected-subregion area-weighted 30.7% relative cover decline to constrain severity within affected ecosystems, while retaining hard-coral cover as an incomplete reef-condition indicator.',
      'Use the 2017–2019 partial recovery, subsequent reversal and Great Barrier Reef recovery trajectories to establish multi-year persistence without claiming a global recovery-time distribution.',
      'Use the peer-reviewed 2014–2017 modeled 51% bleaching and 15% mortality estimates as historical global calibration, not as the current condition denominator.',
      'Use NOAA heat-stress coverage and documented mass bleaching to establish the event footprint and to bound possible reach, while keeping it separate from measured condition loss and mortality.',
    ],
    prohibited: [
      'Do not treat NOAA’s 84.4% heat-stress exposure as the fraction of reef area bleached, killed or structurally collapsed.',
      'Do not treat 83 countries and territories as an ecosystem-area denominator or add them to GCRMN regional weights.',
      'Do not assign every square metre in a declining GCRMN region the region-average condition change.',
      'Do not treat a subregion aggregate as proof that every reef or coral colony within that subregion changed by the reported amount.',
      'Do not reproduce the Eakin model by taking unweighted row percentages from its survey CSV; the published global estimates use fitted response curves and spatial heat-stress coverage.',
      'Do not relabel 2014–2017 bleaching or mortality as current 2023–2025 biological condition.',
      'Do not count people living near reefs, people benefiting from reefs, tourism value, fisheries production or coastal-protection value as current human harm.',
      'Do not add Coral Reef Fragmentation, Coral Recruitment Failure, Marine Heatwaves, Ocean Acidification, Fisheries or Tourism node scores.',
      'Do not treat the 1980–2024 record length or the 2023–2025 event window as ecological recovery time.',
      'Do not infer irreversibility from bleaching alone; bleaching is not death, while mortality and structural reef recovery require separate evidence.',
    ],
    currentCatalogueRecommendation: {
      rating: 'D 7.0',
      uncertainty: 'C 6.3 to E 8.5',
      confidence: 'B',
      applicableDomains: ['ecosystem'],
      axes: {
        ecosystem: {
          lower: { severity: 2, reach: 3, persistence: 2 },
          central: { severity: 3, reach: 3, persistence: 2 },
          upper: { severity: 3, reach: 4, persistence: 3 },
        },
      },
      reason: 'The newest global synthesis directly measures a roughly 9.5% lower 2020–2024 mean hard-coral cover than the 1980–2009 reference. Its 51-subregion tables show modelled declines across 37.8% of mapped global reef area, and declining subregions average a 30.7% relative cover loss when weighted by mapped reef area. That supports central severity 3 and reach 3. The lower axes no longer depend on broad regional inference. A 46.9% unavailable-change share preserves upper reach 4, and hard-coral cover does not represent all reef functions. Multi-year global recovery and reversal plus regional recovery trajectories support persistence 2–3. Human dependence remains excluded because the sources do not measure current attributable human consequences from this node.',
    },
  },
  unresolvedForTulip: [
    'Obtain a current global reef-area denominator for field-measured bleaching prevalence, coral mortality or condition loss during the 2023–2025 event; the 2014–2017 model and current thermal exposure do not fill that gap.',
    'Obtain a global distribution of recovery time separated by surviving bleached colonies, coral mortality and structural reef recovery.',
    'Add taxonomic composition, reef structure and function alongside live hard-coral cover when a compatible global synthesis is available.',
    'If TULIP later wants a human component for this node, obtain current attributable losses in health, food, livelihood or coastal protection with affected-person counts and overlap removal. Beneficiary counts are not harm.',
    'Obtain a source-compatible 2027–2036 SSP2-4.5 projection of biological reef consequences; a heat-stress outlook alone is not a terminal-harm outlook.',
  ],
};

snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${output}`);
console.log(JSON.stringify(snapshot.tulipUse.currentCatalogueRecommendation, null, 2));
