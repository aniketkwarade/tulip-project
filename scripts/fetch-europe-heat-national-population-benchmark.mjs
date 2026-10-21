import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'artifacts/tulip-calibration-2026-09-22');
const outputPath = path.join(artifactDir, 'europe-heat-national-population-benchmark.json');
const checkedOn = '2026-09-23';
const years = Array.from({ length: 8 }, (_, index) => String(2015 + index));
const userAgent = 'LostPlanet-TULIP/1.0 (+europe-heat-national-population-benchmark)';
const apiRoot = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const sha256 = value => createHash('sha256').update(value).digest('hex');

function categoryValues(dimension) {
  const index = dimension.category.index;
  if (Array.isArray(index)) return index;
  return Object.entries(index).sort((left, right) => left[1] - right[1]).map(([value]) => value);
}

function valueAt(payload, selection) {
  let flatIndex = 0;
  let stride = 1;
  for (let dimensionIndex = payload.id.length - 1; dimensionIndex >= 0; dimensionIndex -= 1) {
    const dimensionId = payload.id[dimensionIndex];
    const categories = categoryValues(payload.dimension[dimensionId]);
    const requested = selection[dimensionId] ?? categories[0];
    const coordinate = categories.indexOf(requested);
    if (coordinate < 0) return null;
    flatIndex += coordinate * stride;
    stride *= payload.size[dimensionIndex];
  }
  return payload.value?.[flatIndex] ?? null;
}

const universe = JSON.parse(await readFile(path.join(artifactDir, 'europe-heat-823-region-universe.json'), 'utf8'));
const populationPanel = JSON.parse(await readFile(path.join(artifactDir, 'europe-heat-population-panel.json'), 'utf8'));
const boundarySupplement = JSON.parse(await readFile(path.join(artifactDir, 'europe-heat-population-boundary-supplement.json'), 'utf8'));
const countries = universe.countries.map(country => country.code);
assert.equal(countries.length, 35);

const query = new URLSearchParams([['lang', 'EN'], ['indic_de', 'JAN']]);
for (const country of countries) query.append('geo', country);
for (const year of years) query.append('time', year);
const url = `${apiRoot}/demo_gind?${query}`;
const response = await fetch(url, { signal: AbortSignal.timeout(180_000), headers: { 'User-Agent': userAgent } });
if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
const sourceBuffer = Buffer.from(await response.arrayBuffer());
const national = JSON.parse(sourceBuffer.toString('utf8'));
assert.equal(national.label, 'Population change - Demographic balance and crude rates at national level');

const regionalTotalsByCountryYear = Object.fromEntries(countries.map(country => [
  country,
  Object.fromEntries(years.map(year => [
    year,
    populationPanel.regions
      .filter(region => region.countryCode === country)
      .reduce((sum, region) => sum + (region.populationByYear[year] ?? 0), 0),
  ])),
]));

const countryValues = countries.map(country => ({
  country,
  nationalByYear: Object.fromEntries(years.map(year => [year, valueAt(national, { geo: country, time: year })])),
  regionalObservedByYear: regionalTotalsByCountryYear[country],
  regionalMinusNationalByYear: Object.fromEntries(years.map(year => [
    year,
    regionalTotalsByCountryYear[country][year] - valueAt(national, { geo: country, time: year }),
  ])),
}));
assert(countryValues.every(country => years.every(year => country.nationalByYear[year] !== null)));

const totalsByYear = Object.fromEntries(years.map(year => {
  const nationalTotal = countryValues.reduce((sum, country) => sum + country.nationalByYear[year], 0);
  const regionalObservedTotal = populationPanel.coverageByYear[year].observedTotal;
  const regionalNearestYearSensitivityTotal = populationPanel.coverageByYear[year].nearestYearCandidateTotal;
  return [year, {
    nationalTotal,
    regionalObservedTotal,
    regionalNearestYearSensitivityTotal,
    nationalMinusRegionalObserved: nationalTotal - regionalObservedTotal,
    nationalMinusRegionalNearestYearSensitivity: nationalTotal - regionalNearestYearSensitivityTotal,
    publishedStatementMinusNational: 543_000_000 - nationalTotal,
  }];
}));

const completeRegionalYears = years.filter(year => populationPanel.coverageByYear[year].observedRegions === 823);
assert.deepEqual(completeRegionalYears, ['2017', '2018', '2019']);
const maximumNational = years
  .map(year => ({ year, value: totalsByYear[year].nationalTotal }))
  .sort((left, right) => right.value - left.value)[0];
const latestSupplementedTotal = boundarySupplement.checks.fullySupplementedSensitivityTotal;

const countryGaps2019 = countryValues
  .map(country => ({
    country: country.country,
    national: country.nationalByYear['2019'],
    regional: country.regionalObservedByYear['2019'],
    nationalMinusRegional: country.nationalByYear['2019'] - country.regionalObservedByYear['2019'],
  }))
  .filter(country => Math.abs(country.nationalMinusRegional) >= 1_000)
  .sort((left, right) => Math.abs(right.nationalMinusRegional) - Math.abs(left.nationalMinusRegional));

const payload = {
  version: 'tulip_europe_heat_national_population_benchmark_2026_09_23_v2',
  generatedOn: checkedOn,
  status: 'official_national_benchmark_ingested_article_coverage_statement_not_reproduced',
  productionRatingsEnabled: 0,
  purpose: 'Test whether the article\'s statement that its 823 regions contain over 543 million people can be explained by current official national totals or by the known regional boundary gaps.',
  method: {
    national: 'Sum Eurostat demo_gind Population on 1 January (JAN) for the same 35 countries in each study year.',
    regional: 'Compare the national totals with the 823-region panel. A national total is a ceiling-like diagnostic, not an interchangeable replacement, because the study excludes non-contiguous French territories and mixes NUTS levels.',
    interpretation: 'The article statement is not treated as an exact yearly denominator. A mismatch triggers source-vintage reconciliation and never an automatic population rescaling.',
  },
  sources: {
    article: {
      url: 'https://www.nature.com/articles/s41612-024-00783-2',
      reportedCoverage: '823 contiguous regions inhabited by over 543 million Europeans in 35 countries.',
    },
    eurostatNationalPopulation: {
      dataset: 'demo_gind',
      url,
      updated: national.updated,
      bytes: sourceBuffer.length,
      sha256: sha256(sourceBuffer),
    },
    regionUniverse: { version: universe.version, digest: universe.digest },
    regionalPopulationPanel: { version: populationPanel.version, digest: populationPanel.digest },
    boundarySupplement: { version: boundarySupplement.version, digest: boundarySupplement.digest },
  },
  checks: {
    countries: countries.length,
    years,
    completeRegionalYears,
    maximumNationalPopulationYear: maximumNational.year,
    maximumNationalPopulation: maximumNational.value,
    maximumNationalStillBelowPublishedStatementBy: 543_000_000 - maximumNational.value,
    latestNationalPopulation: totalsByYear['2022'].nationalTotal,
    latestSupplementedRegionalSensitivityTotal: latestSupplementedTotal,
    latestNationalMinusSupplementedRegionalSensitivity: totalsByYear['2022'].nationalTotal - latestSupplementedTotal,
    publishedStatementMinusLatestNational: 543_000_000 - totalsByYear['2022'].nationalTotal,
    publishedStatementMinusLatestSupplementedRegionalSensitivity: 543_000_000 - latestSupplementedTotal,
  },
  findings: {
    nationalBenchmark: 'The current Eurostat national series for the same 35 countries remains below 543 million in every study year from 2015 through 2022.',
    completeRegionalPanel: 'In the complete 2017-2019 regional years, most of the national-minus-regional gap is France because the study universe explicitly keeps mainland France and Corsica while the national series includes overseas territories.',
    remainingMismatch: 'Known UK and Belgian/Estonian boundary sensitivity inputs do not reproduce the article\'s population statement. The LAU population field is voluntary, not validated by Eurostat and lacks an exact reference date in the workbook. The unresolved difference is therefore a source-vintage or author-panel reconciliation question, not permission to inflate or rescale population values.',
    ratingRule: 'Do not change any TULIP rating from this coverage statement. Use it only as a validation check on the regional reconstruction.',
  },
  totalsByYear,
  countryGaps2019,
  countries: countryValues,
};
payload.digest = sha256(Buffer.from(JSON.stringify({ sources: payload.sources, checks: payload.checks, totalsByYear, countryGaps2019, countryValues })));
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, outputPath), status: payload.status, checks: payload.checks, digest: payload.digest }, null, 2));
