import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(
  root,
  'artifacts',
  'tulip-calibration-2026-09-22',
  'permafrost-rusting-rivers-current-reference.json',
);
const endpoints = {
  npsProfile: 'https://irma.nps.gov/DataStore/Reference/Profile/2303647',
  npsHoldings: 'https://irma.nps.gov/DataStore/Reference/GetHoldings?referenceId=2303647',
  arcticDataDoi: 'https://doi.org/10.18739/A2F47GW4M',
  arcticDataMetadata: 'https://arcticdata.io/metacat/d1/mn/v2/object/doi:10.18739/A2F47GW4M',
  arcticDataCsv: 'https://cn.dataone.org/cn/v2/resolve/urn:uuid:a1027f2e-576f-4bfa-abd9-f4af1d8ddc6d',
  noaaSynthesis: 'https://arctic.noaa.gov/report-card/report-card-2025/rusting-rivers-assessing-the-causes-and-consequences-in-alaska-and-across-the-arctic/',
  pnasArticle: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12452937/',
  pnasArticleXml: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=12452937',
};

const fetchText = async url => {
  const response = await fetch(url, { headers: { accept: '*/*', 'user-agent': 'TULIP-calibration/1.0' } });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  return response.text();
};
const fetchBuffer = async url => {
  const response = await fetch(url, { headers: { accept: '*/*' } });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  return Buffer.from(await response.arrayBuffer());
};
const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');

const parseCsv = source => {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(cell);
      cell = '';
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
    } else {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...records] = rows;
  return records.map(values => Object.fromEntries(headers.map((header, index) => [header.replace(/^\uFEFF/, ''), values[index] ?? ''])));
};

const haversineKm = (left, right) => {
  const radians = degrees => degrees * Math.PI / 180;
  const [lat1, lon1, lat2, lon2] = [left.latitude, left.longitude, right.latitude, right.longitude].map(radians);
  const haversine = Math.sin((lat2 - lat1) / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(haversine));
};

const [holdingsText, eml, metalCsvBuffer, pnasHtml] = await Promise.all([
  fetchText(endpoints.npsHoldings),
  fetchText(endpoints.arcticDataMetadata),
  fetchBuffer(endpoints.arcticDataCsv),
  fetchText(endpoints.pnasArticleXml),
]);
const holdings = JSON.parse(holdingsText);
const npsHolding = holdings.find(item => item.FileDescription === 'orange_streams_irma_20240506.csv');
assert(npsHolding, 'NPS occurrence CSV not found');
assert.equal(npsHolding.FileSize, 4720);
assert.equal(npsHolding.MimeType, 'text/csv');
const npsCsv = await fetchText(npsHolding.Url);
assert.equal(Buffer.byteLength(npsCsv), npsHolding.FileSize);
const npsRows = parseCsv(npsCsv);
assert.deepEqual(Object.keys(npsRows[0]), ['NameLong', 'NameShort', 'Latitude', 'Longitude']);
const npsPoints = npsRows.map(row => ({
  name: row.NameLong.trim(),
  shortName: row.NameShort.trim(),
  latitude: Number(row.Latitude),
  longitude: Number(row.Longitude),
}));
assert(npsPoints.every(point => Object.values(point).every(value => value !== '' && value != null)));

let maximumPairwiseDistance = { km: 0, from: null, to: null };
for (let left = 0; left < npsPoints.length; left += 1) {
  for (let right = left + 1; right < npsPoints.length; right += 1) {
    const km = haversineKm(npsPoints[left], npsPoints[right]);
    if (km > maximumPairwiseDistance.km) {
      maximumPairwiseDistance = { km, from: npsPoints[left].name, to: npsPoints[right].name };
    }
  }
}

assert.match(eml, /Metal Concentrations in Tundra Seep, Tributary and River Waters of the Western Brooks Range/i);
assert.match(eml, /Creative Commons Attribution 4\.0 International License/i);
assert.match(eml, /<authentication method="MD5">4ac1957f53b2c56f9d701861bf933fa5<\/authentication>/);
assert.equal(metalCsvBuffer.length, 52_719);
assert.equal(md5(metalCsvBuffer), '4ac1957f53b2c56f9d701861bf933fa5');
const metalCsv = metalCsvBuffer.toString('utf8');
const metalRows = parseCsv(metalCsv);
assert.equal(Object.keys(metalRows[0]).length, 38);

const unique = values => [...new Set(values)].sort();
const numericRange = field => {
  const values = metalRows.map(row => row[field]).filter(value => value && value !== 'NA').map(Number);
  return { observations: values.length, minimum: Math.min(...values), maximum: Math.max(...values) };
};
const sampleEvents = unique(metalRows.map(row => `${row.Lat}|${row.Lon}|${row.Date}`));
const reportedFindings = {
  majorTributariesSampled: 10,
  majorTributariesExceedingAtLeastOneChronicMetalThreshold: 9,
  mainStemFinding: 'The authors report total recoverable iron, total recoverable aluminium and dissolved cadmium above Alaska chronic aquatic-life thresholds from the first major tributary to the river mouth.',
  source: endpoints.pnasArticle,
  reproductionStatus: 'authors_report_checked_against_article_text_not_recalculated',
};
assert.match(pnasHtml, /Nine of ten major tributaries/i);
assert.match(pnasHtml, /Data presented in this article have been archived/i);

const payload = {
  version: 'tulip_permafrost_rusting_rivers_current_reference_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'direct_regional_consequence_data_pinned_reach_denominator_missing',
  productionRatingsEnabled: 0,
  nodeId: 'permafrost_thaw',
  sources: {
    endpoints,
    npsOccurrenceFile: {
      referenceId: 2_303_647,
      holdingId: npsHolding.Id,
      filename: npsHolding.FileDescription,
      bytes: npsHolding.FileSize,
      sha256: sha256(npsCsv),
      description: npsHolding.Description,
    },
    arcticDataCenterFile: {
      doi: '10.18739/A2F47GW4M',
      objectId: 'urn:uuid:a1027f2e-576f-4bfa-abd9-f4af1d8ddc6d',
      filename: 'Orange_Stream_Field_Data_and_Metal_Concentrations_for_ADC.csv',
      bytes: metalCsvBuffer.length,
      md5: md5(metalCsvBuffer),
      sha256: sha256(metalCsvBuffer),
      metadataSha256: sha256(eml),
      licence: 'CC BY 4.0',
      temporalCoverage: { start: '2022-08-14', end: '2023-08-15' },
    },
  },
  occurrenceInventory: {
    records: npsPoints.length,
    uniqueLongNames: unique(npsPoints.map(point => point.name)).length,
    uniqueShortNames: unique(npsPoints.map(point => point.shortName)).length,
    boundingBox: {
      south: Math.min(...npsPoints.map(point => point.latitude)),
      north: Math.max(...npsPoints.map(point => point.latitude)),
      west: Math.min(...npsPoints.map(point => point.longitude)),
      east: Math.max(...npsPoints.map(point => point.longitude)),
    },
    maximumPairwiseDistanceKm: Number(maximumPairwiseDistance.km.toFixed(3)),
    maximumPairwiseDistanceEndpoints: { from: maximumPairwiseDistance.from, to: maximumPairwiseDistance.to },
    boundary: 'Affected-location inventory assembled from satellite and local observations. It is not a probability sample and contains no complete comparable-stream denominator.',
  },
  chemistryInventory: {
    rows: metalRows.length,
    columns: Object.keys(metalRows[0]).length,
    sampleEvents: sampleEvents.length,
    fieldNames: unique(metalRows.map(row => row.FieldName)).length,
    basins: unique(metalRows.map(row => row.Basin)),
    sampleTypes: unique(metalRows.map(row => row.Type)),
    filtration: Object.fromEntries(unique(metalRows.map(row => row.Filtration)).map(kind => [kind, metalRows.filter(row => row.Filtration === kind).length])),
    sourceNativeRanges: {
      pH: numericRange('pH'),
      aluminiumPpm: numericRange('Al_ppm'),
      ironPpm: numericRange('Fe_ppm'),
      cadmiumPpm: numericRange('Cd_ppm'),
      copperPpm: numericRange('Cu_ppm'),
      nickelPpm: numericRange('Ni_ppm'),
      zincPpm: numericRange('Zn_ppm'),
      sulfatePpm: numericRange('SO4_ppm'),
    },
    boundary: 'Measurements cover selected lakes, wetlands, seeps, tributaries and rivers in seven western Brooks Range basin labels. Rows, sites and concentrations are not affected-ecosystem fractions.',
  },
  reportedFindings,
  evidenceDecision: {
    admittedUse: 'Direct regional evidence that thaw-linked mineral weathering has degraded water quality and aquatic habitat, plus checksum-pinned occurrence and chemistry provenance.',
    excludedUse: [
      'Do not divide 109 affected locations by all Arctic streams; the file has no complete surveyed-stream denominator.',
      'Do not treat the later NOAA statement of more than 200 watersheds as the contents of the 2024 NPS CSV.',
      'Do not extrapolate the Salmon River toxicity result to all permafrost watersheds; sulfide minerals, hydrology and groundwater pathways modify the outcome.',
      'Do not count each chemistry row, coordinate or sampling date as a separate damaged ecosystem.',
      'Do not convert metal concentration or observation span into ecological recovery time.',
    ],
    exactRemainingGap: 'A defined population of comparable permafrost watersheds with systematic affected and unaffected classification, an ecosystem-condition endpoint relative to a documented functional-loss reference, and repeat observations sufficient to estimate recovery or persistence.',
    ratingChange: 'none',
    candidateRetained: { value: 5.9, grade: 'C', lower: 3.6, upper: 8.1, confidence: 'C' },
    reason: 'The files strengthen direct regional consequence provenance but do not narrow the global ecosystem-reach or recovery bounds, and they add no compatible harmed-person denominator.',
  },
};
payload.digest = sha256(JSON.stringify({
  version: payload.version,
  sources: payload.sources,
  occurrenceInventory: payload.occurrenceInventory,
  chemistryInventory: payload.chemistryInventory,
  reportedFindings,
  evidenceDecision: payload.evidenceDecision,
}));

await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, status: payload.status, occurrenceRecords: npsPoints.length, chemistryRows: metalRows.length, sampleEvents: sampleEvents.length, digest: payload.digest }, null, 2));
