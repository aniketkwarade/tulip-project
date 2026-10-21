import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateMethaneGwpStar, METHANE_GWP_STAR_METHOD } from './lib/tulip-methane-gwp-star.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'jones-national-warming-reference-snapshot.json');
const metadataUrl = 'https://zenodo.org/api/records/16640595';
const rawDir = process.env.TULIP_JONES_RAW_DIR || null;
const wantedFiles = [
  'EMISSIONS_CUMULATIVE_CO2e100_1851-2024.csv',
  'GMST_response_1851-2024.csv',
  'EMISSIONS_ANNUAL_1830-2024.csv',
];
const userAgent = 'LostPlanet-TULIP/1.0 (+calibration-reference-ingestion)';

function md5(buffer) {
  return createHash('md5').update(buffer).digest('hex');
}

function sha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else value += character;
  }
  values.push(value);
  return values;
}

function parseGlobalRows(buffer, filename) {
  const lines = buffer.toString('utf8').split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const required = ['CNTR_NAME', 'ISO3', 'Gas', 'Component', 'Year', 'Data', 'Unit'];
  for (const header of required) assert(headers.includes(header), `${filename}: missing ${header}`);
  const column = Object.fromEntries(headers.map((header, index) => [header, index]));
  const rows = [];
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const values = parseCsvLine(line);
    if (values[column.ISO3] !== 'GLOBAL') continue;
    const year = Number(values[column.Year]);
    const data = Number(values[column.Data]);
    assert(Number.isInteger(year) && Number.isFinite(data), `${filename}: invalid GLOBAL row`);
    rows.push({
      countryName: values[column.CNTR_NAME],
      iso3: values[column.ISO3],
      gas: values[column.Gas],
      component: values[column.Component],
      year,
      data,
      unit: values[column.Unit],
    });
  }
  return rows;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': userAgent },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

async function sourceBuffer(file) {
  if (rawDir) return readFile(path.join(rawDir, file.key));
  const response = await fetch(file.links.self, {
    headers: { 'User-Agent': userAgent },
    signal: AbortSignal.timeout(240_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${file.links.self}`);
  return Buffer.from(await response.arrayBuffer());
}

const metadata = await fetchJson(metadataUrl);
assert.equal(metadata.id, 16640595);
assert.equal(metadata.metadata?.license?.id, 'cc-by-4.0');
const files = Object.fromEntries(metadata.files.filter(file => wantedFiles.includes(file.key)).map(file => [file.key, file]));
for (const filename of wantedFiles) assert(files[filename], `Zenodo record is missing ${filename}`);

const buffers = {};
const fileEvidence = {};
for (const filename of wantedFiles) {
  const file = files[filename];
  const buffer = await sourceBuffer(file);
  const expectedMd5 = file.checksum.replace(/^md5:/, '');
  const actualMd5 = md5(buffer);
  assert.equal(actualMd5, expectedMd5, `${filename}: checksum mismatch`);
  buffers[filename] = buffer;
  fileEvidence[filename] = {
    bytes: buffer.length,
    md5: actualMd5,
    sourceUrl: file.links.self,
  };
}

const cumulativeRows = parseGlobalRows(buffers[wantedFiles[0]], wantedFiles[0]);
const gmstRows = parseGlobalRows(buffers[wantedFiles[1]], wantedFiles[1]);
const annualRows = parseGlobalRows(buffers[wantedFiles[2]], wantedFiles[2]);
assert.equal(cumulativeRows.length, 2088);
assert.equal(gmstRows.length, 2088);

const key = row => `${row.gas}|${row.component}|${row.year}`;
const gmstByKey = new Map(gmstRows.map(row => [key(row), row]));
const method = {
  tcreCPer1000PgC: 1.65,
  co2PerCarbonMassRatio: 3.664,
  gmstCPerPgCO2e: 1.65 / 1000 / 3.664,
  equation: 'GMST_C = cumulative_Pg_CO2e / 3.664 * (1.65 / 1000)',
  sourceCodeCommit: '1a16ce60e0e3cc74086c28a53386ac95bc9007fd',
  sourceCodeUrl: 'https://github.com/jonesmattw/National_Warming_Contributions',
  methaneGwpStar: {
    equation: 'CO2we_Pg(t) = [g*s*C_CH4(t)*GWP100 + g*(1-s)*100*(C_CH4(t)-C_CH4(t-20))*GWP100/20]/1000, rebased to the reference year',
    g: 1.13,
    s: 0.25,
    changePeriodYears: 20,
    fossilMethaneGwp100: 29.8,
    biogenicMethaneGwp100: 27.2,
    referenceYear: 1850,
    sourceCodePath: 'Scripts/TRUNK/TR.2_calculate_CO2e_emissions_GWPstar.R',
    interpretation: 'C_CH4 is cumulative Tg CH4. The second term uses the change in cumulative emissions over twenty years, which is the methane emitted during that interval. This retains methane path dependence before the result is mapped through the same TCRE coefficient.',
  },
};

function reproduceMethaneComponent(component) {
  const rows = annualRows
    .filter(row => row.gas === 'CH[4]' && row.component === component)
    .sort((left, right) => left.year - right.year);
  assert.equal(rows.length, 195, `${component}: expected 1830-2024 annual methane rows`);
  assert.deepEqual([rows[0].year, rows.at(-1).year], [1830, 2024]);
  const gwp100 = component === 'Fossil'
    ? method.methaneGwpStar.fossilMethaneGwp100
    : method.methaneGwpStar.biogenicMethaneGwp100;
  const annualInputs = rows.map(row => ({ year: row.year, annualTgCH4: row.data }));
  const calculated = calculateMethaneGwpStar({
    annualEmissions: annualInputs,
    referenceYear: method.methaneGwpStar.referenceYear,
    gwp100,
    method: METHANE_GWP_STAR_METHOD,
  });
  const reproduced = calculated.records.map(row => ({
    year: row.year,
    annualTgCH4: row.annualTgCH4,
    cumulativePgCO2we: row.cumulativePgCO2weSinceReference,
  }));
  const published = cumulativeRows.filter(row => row.gas === 'CH[4]' && row.component === component);
  assert.equal(published.length, reproduced.length, `${component}: published GWP* row count`);
  const publishedByYear = new Map(published.map(row => [row.year, row.data]));
  const maximumAbsoluteErrorPgCO2we = Math.max(...reproduced.map(row => (
    Math.abs(row.cumulativePgCO2we - publishedByYear.get(row.year))
  )));
  assert(maximumAbsoluteErrorPgCO2we < 1e-9, `${component}: GWP* reproduction error ${maximumAbsoluteErrorPgCO2we}`);
  return {
    component,
    annualInputs,
    inputPeriod: { start: rows[0].year, end: rows.at(-1).year },
    outputPeriod: { start: reproduced[0].year, end: reproduced.at(-1).year },
    gwp100,
    records: reproduced,
    maximumAbsoluteErrorPgCO2we,
  };
}

const methaneValidationComponents = [
  reproduceMethaneComponent('Fossil'),
  reproduceMethaneComponent('LULUCF'),
];
const methaneValidation = {
  result: 'published_gwp_star_rows_reproduced',
  components: methaneValidationComponents.map(component => component.component),
  inputRecordCount: methaneValidationComponents.reduce((sum, component) => sum + component.annualInputs.length, 0),
  outputRecordCount: methaneValidationComponents.reduce((sum, component) => sum + component.records.length, 0),
  firstInputYear: 1830,
  referenceYear: method.methaneGwpStar.referenceYear,
  lastYear: 2024,
  maximumAbsoluteErrorPgCO2we: Math.max(...methaneValidationComponents.map(component => component.maximumAbsoluteErrorPgCO2we)),
};

const records = cumulativeRows.map(cumulative => {
  const paired = gmstByKey.get(key(cumulative));
  assert(paired, `Missing GMST pair for ${key(cumulative)}`);
  const recomputed = cumulative.data * method.gmstCPerPgCO2e;
  return {
    recordId: `jones_global_${cumulative.gas.replaceAll(/[^A-Za-z0-9]+/g, '_')}_${cumulative.component}_${cumulative.year}`.toLowerCase(),
    geography: 'World',
    year: cumulative.year,
    gas: cumulative.gas,
    component: cumulative.component,
    cumulativePgCO2eSourceMethod: cumulative.data,
    cumulativeSourceUnit: cumulative.unit,
    gmstResponseCSourceReported: paired.data,
    gmstSourceUnit: paired.unit,
    gmstResponseCRecomputed: recomputed,
    absoluteReproductionErrorC: Math.abs(paired.data - recomputed),
    sourceLocator: `https://doi.org/10.5281/zenodo.16640595; GLOBAL; Gas=${cumulative.gas}; Component=${cumulative.component}; Year=${cumulative.year}`,
  };
}).sort((left, right) => left.gas.localeCompare(right.gas)
  || left.component.localeCompare(right.component) || left.year - right.year);

const groupCounts = Object.fromEntries([...new Set(records.map(record => `${record.gas}|${record.component}`))]
  .sort().map(group => [group, records.filter(record => `${record.gas}|${record.component}` === group).length]));
assert.equal(Object.keys(groupCounts).length, 12);
assert(Object.values(groupCounts).every(count => count === 174));
const maxAbsoluteReproductionErrorC = Math.max(...records.map(record => record.absoluteReproductionErrorC));
assert(maxAbsoluteReproductionErrorC < 1e-12);

const payload = {
  version: 'jones_national_warming_contributions_2025_1_global_reference_v2',
  ingestedOn: new Date().toISOString().slice(0, 10),
  status: 'checksum_verified_reference_slice',
  purpose: 'Reproduce a published emissions-to-GMST calculation before applying the same physical intermediate to compatible TULIP source histories.',
  source: {
    title: metadata.metadata.title,
    doi: metadata.metadata.doi,
    recordUrl: metadata.links.self_html,
    publicationDate: metadata.metadata.publication_date,
    version: metadata.metadata.version,
    license: metadata.metadata.license.id,
    articleUrl: 'https://www.nature.com/articles/s41597-023-02041-1',
    files: fileEvidence,
  },
  method,
  validation: {
    recordCount: records.length,
    groupCounts,
    firstYear: Math.min(...records.map(record => record.year)),
    lastYear: Math.max(...records.map(record => record.year)),
    maxAbsoluteReproductionErrorC,
    result: 'published_gmst_rows_reproduced',
    methaneGwpStar: methaneValidation,
  },
  boundary: {
    admittedUse: 'Validate the arithmetic that maps the source dataset cumulative CO2-equivalent histories to global mean surface temperature response.',
    tulipWave1Use: 'Apply the CO2-only coefficient to compatible cumulative CO2 source histories as a physical intermediate.',
    excludedUse: 'The output is not a TULIP severity, reach, persistence, value or letter, and it does not quantify terminal harm.',
    methaneCaution: 'The source dataset constructs methane warming-equivalent histories with GWP*. TULIP has reproduced that transformation, but a TULIP methane node still needs at least twenty years of compatible annual source history and a defensible source boundary before it can use the method.',
  },
  methaneValidationInputs: methaneValidationComponents.map(component => ({
    component: component.component,
    inputPeriod: component.inputPeriod,
    outputPeriod: component.outputPeriod,
    gwp100: component.gwp100,
    annualInputs: component.annualInputs,
    records: component.records,
  })),
  records,
};
payload.digest = sha256({
  source: payload.source,
  method,
  validation: payload.validation,
  boundary: payload.boundary,
  methaneValidationInputs: payload.methaneValidationInputs,
  records,
});

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, records: records.length, validation: payload.validation, digest: payload.digest }, null, 2));
