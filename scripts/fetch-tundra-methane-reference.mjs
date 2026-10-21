import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'tundra-methane-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+tundra-methane-evidence-ingestion)';

const expected = {
  inverseDataset: {
    bytes: 11_960_904,
    md5: 'ade31c9aa15c56501fa41c95d493e352',
    sha256: 'ce0dced353c95c39425403e5a6caddcee7040f16f54783f2f951c7985393f5af',
  },
  inverseAbstract: { bytes: 1_198, sha256: '90b8b376c4a15c693e948625810c7d287cfaa61112a81fdd3e0e2b5449f7f743' },
  inverseTrend: { bytes: 1_303, sha256: '23cd836db19f805208487f28f0c0e82a3c1d93aca1a4e6e68a060019570b5f6d' },
  globalBudgetThaw: { bytes: 2_713, sha256: '7e08acffc0b6aa52c8965f88000ff2fe56a70a1f4f4055a147def0ac797a4747' },
  borealArcticOutlook: { bytes: 983, sha256: '2573d714e564ab9ec06a37c4295165a08750b6e77543d9d1b2c36835416b6a73' },
};

const sources = {
  inverseModel: {
    id: 'basso_arctic_boreal_methane_inversion_2026',
    publisher: 'npj Climate and Atmospheric Science',
    title: 'Quantifying Arctic-boreal methane emissions using atmospheric observations and a global inverse model',
    publicationDate: '2026-02-14',
    articleUrl: 'https://www.nature.com/articles/s41612-026-01348-1',
    doi: 'https://doi.org/10.1038/s41612-026-01348-1',
    dataRecordUrl: 'https://zenodo.org/records/18563123',
    dataApiUrl: 'https://zenodo.org/api/records/18563123',
  },
  globalMethaneBudget: {
    id: 'global_methane_budget_2000_2020',
    publisher: 'Earth System Science Data',
    title: 'Global Methane Budget 2000–2020',
    publicationDate: '2025-04-09',
    articleUrl: 'https://essd.copernicus.org/articles/17/1873/2025/',
    doi: 'https://doi.org/10.5194/essd-17-1873-2025',
  },
  borealArcticOutlook: {
    id: 'kuhn_boreal_arctic_methane_2025',
    publisher: 'Nature Climate Change',
    title: 'Current and future methane emissions from boreal-Arctic wetlands and lakes',
    publicationDate: '2025-08-28',
    articleUrl: 'https://www.nature.com/articles/s41558-025-02413-y',
    doi: 'https://doi.org/10.1038/s41558-025-02413-y',
    dataRecordUrl: 'https://zenodo.org/records/14991411',
    codeRecordUrl: 'https://zenodo.org/records/15636336',
  },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const round = (value, digits = 6) => Number(value.toFixed(digits));
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

async function fetchBuffer(url, accept) {
  const args = [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '240',
    '--header', `User-Agent: ${userAgent}`,
  ];
  if (accept) args.push('--header', `Accept: ${accept}`);
  args.push(url);
  const { stdout } = await execFileAsync('curl', args, { encoding: null, maxBuffer: 100_000_000, timeout: 250_000 });
  return stdout;
}

function paragraphContaining(buffer, needle) {
  const html = buffer.toString('utf8');
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => decodeHtml(match[1]));
  const paragraph = paragraphs.find(value => value.includes(needle));
  assert(paragraph, `Official source paragraph is missing: ${needle}`);
  return paragraph;
}

function verifyClaim(name, value, pinned) {
  assert.equal(Buffer.byteLength(value), pinned.bytes, `${name} byte count changed`);
  assert.equal(sha256(value), pinned.sha256, `${name} checksum changed`);
}

function parseClassicNetCdf(buffer) {
  assert.equal(buffer.subarray(0, 4).toString('latin1'), 'CDF\u0001', 'Expected NetCDF classic CDF-1');
  let cursor = 4;
  const readU32 = () => { const value = buffer.readUInt32BE(cursor); cursor += 4; return value; };
  const readString = () => {
    const length = readU32();
    const value = buffer.subarray(cursor, cursor + length).toString('utf8');
    cursor += length + ((4 - (length % 4)) % 4);
    return value;
  };
  const typeBytes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 4, 6: 8 };
  const readAttributes = () => {
    const tag = readU32();
    if (tag === 0) return [];
    assert.equal(tag, 12, 'Unexpected NetCDF attribute-list tag');
    const count = readU32();
    return Array.from({ length: count }, () => {
      const name = readString();
      const type = readU32();
      const values = readU32();
      const bytes = values * typeBytes[type];
      const raw = buffer.subarray(cursor, cursor + bytes);
      cursor += bytes + ((4 - (bytes % 4)) % 4);
      return { name, type, values, raw };
    });
  };

  const records = readU32();
  assert.equal(records, 0, 'This reference must use fixed dimensions');
  assert.equal(readU32(), 10, 'Unexpected NetCDF dimension-list tag');
  const dimensionCount = readU32();
  const dimensions = Array.from({ length: dimensionCount }, () => ({ name: readString(), length: readU32() }));
  readAttributes();
  assert.equal(readU32(), 11, 'Unexpected NetCDF variable-list tag');
  const variableCount = readU32();
  const variables = Array.from({ length: variableCount }, () => {
    const name = readString();
    const dimensionIds = Array.from({ length: readU32() }, () => readU32());
    const attributes = readAttributes();
    const type = readU32();
    const size = readU32();
    const begin = readU32();
    return { name, dimensionIds, attributes, type, size, begin };
  });

  const values = variable => {
    const count = variable.dimensionIds.reduce((product, id) => product * dimensions[id].length, 1);
    assert.equal(count * typeBytes[variable.type], variable.size, `${variable.name}: unexpected byte size`);
    const methods = { 3: 'readInt16BE', 4: 'readInt32BE', 5: 'readFloatBE', 6: 'readDoubleBE' };
    const method = methods[variable.type];
    assert(method, `${variable.name}: unsupported NetCDF type ${variable.type}`);
    return Array.from({ length: count }, (_, index) => buffer[method](variable.begin + index * typeBytes[variable.type]));
  };
  return { dimensions, variables, values };
}

const [inversePage, inverseMetadataBuffer, globalBudgetPage, outlookPage] = await Promise.all([
  fetchBuffer(sources.inverseModel.articleUrl, 'text/html'),
  fetchBuffer(sources.inverseModel.dataApiUrl, 'application/json'),
  fetchBuffer(sources.globalMethaneBudget.articleUrl, 'text/html'),
  fetchBuffer(sources.borealArcticOutlook.articleUrl, 'text/html'),
]);
const inverseMetadata = JSON.parse(inverseMetadataBuffer.toString('utf8'));
assert.equal(inverseMetadata.id, 18_563_123);
assert.equal(inverseMetadata.metadata?.license?.id, 'cc-by-4.0');
const inverseFile = inverseMetadata.files.find(file => file.key === 'CarboScope_posterior_CH4_Arctic_emissions.nc');
assert(inverseFile, 'Zenodo record is missing the CarboScope NetCDF file');
assert.equal(inverseFile.size, expected.inverseDataset.bytes);
assert.equal(inverseFile.checksum, `md5:${expected.inverseDataset.md5}`);
const inverseDataset = await fetchBuffer(inverseFile.links.self);
assert.equal(inverseDataset.length, expected.inverseDataset.bytes);
assert.equal(md5(inverseDataset), expected.inverseDataset.md5);
assert.equal(sha256(inverseDataset), expected.inverseDataset.sha256);

const claims = {
  inverseAbstract: paragraphContaining(inversePage, 'From 2010 to 2021'),
  inverseTrend: paragraphContaining(inversePage, 'shows an increasing trend over time'),
  globalBudgetThaw: paragraphContaining(globalBudgetPage, '20–30'),
  borealArcticOutlook: paragraphContaining(outlookPage, 'Our estimate of net annual methane emission'),
};
verifyClaim('Inverse-model abstract', claims.inverseAbstract, expected.inverseAbstract);
verifyClaim('Inverse-model trend paragraph', claims.inverseTrend, expected.inverseTrend);
verifyClaim('Global Methane Budget thaw paragraph', claims.globalBudgetThaw, expected.globalBudgetThaw);
verifyClaim('Boreal-Arctic current and future abstract', claims.borealArcticOutlook, expected.borealArcticOutlook);

const netcdf = parseClassicNetCdf(inverseDataset);
assert.deepEqual(netcdf.dimensions, [
  { name: 'longitude', length: 72 },
  { name: 'latitude', length: 48 },
  { name: 'time', length: 144 },
]);
const variableByName = new Map(netcdf.variables.map(variable => [variable.name, variable]));
const timeValues = netcdf.values(variableByName.get('time'));
const timeDates = timeValues.map(seconds => new Date(Date.UTC(2000, 0, 1) + seconds * 1000));
assert.equal(timeDates[0].toISOString().slice(0, 10), '2010-01-16');
assert.equal(timeDates.at(-1).toISOString().slice(0, 10), '2021-12-16');

const fluxVariables = ['total_post', 'anthropogenic_post', 'fire_post', 'other_post', 'ocean_post', 'wetland_post'];
const annualByVariable = {};
for (const variableName of fluxVariables) {
  const data = netcdf.values(variableByName.get(variableName));
  assert.equal(data.length, 144 * 48 * 72);
  const annual = [];
  for (let yearIndex = 0; yearIndex < 12; yearIndex += 1) {
    const start = yearIndex * 12 * 48 * 72;
    const end = start + 12 * 48 * 72;
    const total = data.slice(start, end).filter(value => Number.isFinite(value) && value > -1e20)
      .reduce((sum, value) => sum + value, 0);
    annual.push({ year: 2010 + yearIndex, valueTgCH4: round(total, 6) });
  }
  annualByVariable[variableName] = annual;
}

const mean = rows => rows.reduce((sum, row) => sum + row.valueTgCH4, 0) / rows.length;
const summary = Object.fromEntries(fluxVariables.map(variableName => {
  const rows = annualByVariable[variableName];
  return [variableName, {
    meanTgCH4PerYear: round(mean(rows), 6),
    minimumTgCH4PerYear: round(Math.min(...rows.map(row => row.valueTgCH4)), 6),
    maximumTgCH4PerYear: round(Math.max(...rows.map(row => row.valueTgCH4)), 6),
    annual: rows,
  }];
}));
assert.equal(summary.total_post.meanTgCH4PerYear, 45.384995);
assert.equal(summary.wetland_post.meanTgCH4PerYear, 21.489571);
assert.equal(summary.anthropogenic_post.meanTgCH4PerYear, 11.620939);

const snapshot = {
  version: 'tulip_tundra_methane_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'gross_flux_and_attribution_boundary_ingested_endpoint_model_pending',
  productionRatingsEnabled: 0,
  purpose: 'Replace a placeholder site-flux description and generic global-reach assumptions with a reproducible Arctic-Boreal annual methane series, explicit natural-source overlap limits and an SSP2-4.5 outlook.',
  sources: {
    inverseModel: {
      ...sources.inverseModel,
      abstractClaim: { ...expected.inverseAbstract, retrievedOn: checkedOn },
      trendClaim: { ...expected.inverseTrend, retrievedOn: checkedOn },
      dataset: {
        filename: inverseFile.key,
        sourceUrl: inverseFile.links.self,
        license: inverseMetadata.metadata.license.id,
        ...expected.inverseDataset,
        retrievedOn: checkedOn,
      },
    },
    globalMethaneBudget: {
      ...sources.globalMethaneBudget,
      thawClaim: { ...expected.globalBudgetThaw, retrievedOn: checkedOn },
    },
    borealArcticOutlook: {
      ...sources.borealArcticOutlook,
      abstractClaim: { ...expected.borealArcticOutlook, retrievedOn: checkedOn },
    },
  },
  endpoints: {
    arcticBorealFlux: {
      observationPeriod: { start: 2010, end: 2021 },
      monthlyRecords: timeValues.length,
      grid: { longitudeCells: 72, latitudeCells: 48 },
      units: 'Tg CH4 per year after summing monthly gridded Tg CH4 fluxes',
      annualSeries: summary,
      articleReportedMeanTgCH4PerYear: 45.4,
      articleReportedUncertaintyTgCH4PerYear: 0.7,
      articleReportedShareOfGlobalEmissionsPercentApproximate: 7,
      articleTrend: { slopeTgCH4PerYear: 0.27, rSquared: 0.25, pValue: 0.09, statisticallySignificant: false },
      boundary: 'The inversion covers a broad Arctic-Boreal domain and includes wetland, anthropogenic, fire, other-natural and ocean sources. Total or wetland flux is not identical to methane newly caused by present-day tundra thaw.',
    },
    permafrostThawAttribution: {
      synthesisPeriod: { start: 2000, end: 2017 },
      permafrostRegionBottomUpTgCH4PerYear: { central: 50, reportedBounds: [23, 53] },
      permafrostRegionTopDownTgCH4PerYear: { central: 19, reportedBounds: [15, 24] },
      directCurrentThawEmissionTgCH4PerYearRange: [0, 1],
      thawAlteredLandCoverFluxTgCH4PerYearRange: [20, 30],
      attributionBoundary: 'The 20–30 Tg estimate covers thermokarst lakes, wetlands and hillslopes altered by thaw that may have occurred decades or centuries ago. These fluxes overlap wetland and freshwater inventories, so they cannot be added to those totals or treated as a present-year thaw increment.',
    },
    borealArcticWetlandsAndLakes: {
      observationPeriod: { start: 1988, end: 2019 },
      netAnnualMethaneTgCH4PerYear: { central: 34, lower95: 25, upper95: 43 },
      wetlandTgCH4PerYear: 26,
      lakeTgCH4PerYear: 5.7,
      outlook: {
        scenario: 'SSP2-4.5',
        horizonEndYear: 2100,
        estimatedChangePercent: 31,
        principalDriver: 'warming rather than permafrost thaw',
        direction: 'worsening',
        boundary: 'The full-century result supports direction only. It does not provide a numerical 2027–2036 increment or isolate TULIP’s tundra-outgassing boundary from all boreal-Arctic wetlands and lakes.',
      },
    },
  },
  tulipUse: {
    admitted: [
      'Use the 2010–2021 annual inversion series to describe the newest reproducible Arctic-Boreal methane state and interannual variability.',
      'Keep wetland, anthropogenic, fire, other-natural and ocean fluxes separate; use the source-specific annual components instead of the regional total when discussing source composition.',
      'Use the Global Methane Budget to define the direct-versus-indirect thaw boundary and prevent double counting with wetland and freshwater inventories.',
      'Use the SSP2-4.5 study for worsening outlook direction only, retaining the 2100 horizon and its finding that warming rather than thaw is the principal driver.',
    ],
    prohibited: [
      'Do not treat 45.4 Tg CH4 per year or 7% of global emissions as methane caused by present-day tundra thaw.',
      'Do not add the 20–30 Tg CH4 per year thaw-altered-landscape estimate to wetland or freshwater totals.',
      'Do not use gross methane mass, global atmospheric mixing or the 2010–2021 record length as human or ecosystem severity, reach or persistence.',
      'Do not multiply the aggregate Methane TULIP score by a flux share.',
      'Do not convert GWP100 mass into current terminal harm or a TULIP axis.',
      'Do not translate the 31% 2100 SSP2-4.5 change into a 2027–2036 numerical increment.',
    ],
    currentCatalogueRecommendation: {
      rating: 'D 6.6 retained provisionally',
      uncertainty: 'B 4.4 to E 8.9',
      confidence: 'D',
      centralAxes: { human: [2, 3, 3], ecosystem: [1, 3, 3] },
      finding: 'The gross-flux record and future direction are now source-specific, but no compatible source-removal model connects this natural methane source to non-overlapping current human and ecosystem endpoints. The numerical family-calibrated candidate remains visible without claiming that the new flux data validate its six axes.',
    },
  },
  unresolvedForTulip: [
    'A compatible natural methane history extending at least twenty years before the current endpoint, with the tundra, wetland, lake, geologic and anthropogenic boundaries separated.',
    'A validated time-dependent methane source-removal climate response; annual mass and GWP100 are insufficient.',
    'Matched human terminal endpoints evaluated under factual and source-removal climate rather than allocated by emissions share.',
    'Matched ecosystem condition, extent and recovery endpoints evaluated under the same counterfactual.',
    'A 2027–2036 SSP2-4.5 projection matching the tundra-outgassing boundary instead of the complete boreal-Arctic wetland-and-lake system.',
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
console.log(`Wrote ${path.relative(root, output)} (${snapshot.snapshotDigest})`);
