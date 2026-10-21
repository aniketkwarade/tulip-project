import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'artifacts/tulip-calibration-2026-09-22');
const outputPath = path.join(artifactDir, 'europe-heat-population-panel.json');
const checkedOn = '2026-09-23';
const years = Array.from({ length: 8 }, (_, index) => String(2015 + index));
const userAgent = 'LostPlanet-TULIP/1.0 (+europe-heat-population-panel)';
const apiRoot = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const urls = {
  primary: `${apiRoot}/demo_r_gind3?lang=EN&sinceTimePeriod=2015&untilTimePeriod=2022&indic_de=JAN`,
  corroborating: `${apiRoot}/demo_r_pjanaggr3?lang=EN&sinceTimePeriod=2015&untilTimePeriod=2022&sex=T&age=TOTAL`,
};
const sha256 = value => createHash('sha256').update(value).digest('hex');

async function fetchBuffer(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000), headers: { 'User-Agent': userAgent } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

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

function nearestObservedCandidate(populationByYear, targetYear) {
  const candidates = Object.entries(populationByYear)
    .filter(([, value]) => value !== null)
    .map(([year, value]) => ({ year, value, distanceYears: Math.abs(Number(year) - Number(targetYear)) }))
    .sort((left, right) => left.distanceYears - right.distanceYears || Number(right.year) - Number(left.year));
  return candidates[0] ?? null;
}

const universe = JSON.parse(await readFile(path.join(artifactDir, 'europe-heat-823-region-universe.json'), 'utf8'));
assert.equal(universe.regions.length, 823);
const [primaryBuffer, corroboratingBuffer] = await Promise.all([fetchBuffer(urls.primary), fetchBuffer(urls.corroborating)]);
const primary = JSON.parse(primaryBuffer.toString('utf8'));
const corroborating = JSON.parse(corroboratingBuffer.toString('utf8'));
assert.equal(primary.label.trim(), 'Population change - Demographic balance and crude rates at regional level (NUTS 3)');
assert.equal(corroborating.label, 'Population on 1 January by broad age group, sex and NUTS 3 region');

let overlappingValues = 0;
let disagreementsOverOnePerson = 0;
const regions = universe.regions.map(region => {
  const populationByYear = {};
  const sourceByYear = {};
  for (const year of years) {
    const primaryValue = valueAt(primary, { geo: region.id, time: year });
    const corroboratingValue = valueAt(corroborating, { geo: region.id, time: year });
    if (primaryValue !== null && corroboratingValue !== null) {
      overlappingValues += 1;
      if (Math.abs(primaryValue - corroboratingValue) > 1) disagreementsOverOnePerson += 1;
    }
    populationByYear[year] = primaryValue ?? corroboratingValue;
    sourceByYear[year] = primaryValue !== null ? 'demo_r_gind3' : corroboratingValue !== null ? 'demo_r_pjanaggr3' : null;
  }
  const nearestObservedCandidateByYear = Object.fromEntries(years.map(year => [
    year,
    populationByYear[year] === null ? nearestObservedCandidate(populationByYear, year) : null,
  ]));
  return {
    id: region.id,
    countryCode: region.countryCode,
    country: region.country,
    boundaryRelease: region.boundaryRelease,
    nutsLevel: region.nutsLevel,
    populationByYear,
    sourceByYear,
    nearestObservedCandidateByYear,
  };
});

const coverageByYear = Object.fromEntries(years.map(year => {
  const observed = regions.filter(region => region.populationByYear[year] !== null);
  const missing = regions.filter(region => region.populationByYear[year] === null);
  const observedTotal = observed.reduce((sum, region) => sum + region.populationByYear[year], 0);
  const nearestYearCandidateTotal = regions.reduce((sum, region) => {
    const exact = region.populationByYear[year];
    return sum + (exact ?? region.nearestObservedCandidateByYear[year]?.value ?? 0);
  }, 0);
  return [year, {
    observedRegions: observed.length,
    missingRegions: missing.length,
    observedTotal,
    missingIds: missing.map(region => region.id),
    nearestYearCandidateTotal,
    nearestYearCandidateImputations: missing.length,
  }];
}));

assert.equal(overlappingValues, 6424);
assert.equal(disagreementsOverOnePerson, 0);
assert.equal(coverageByYear['2017'].observedRegions, 823);
assert.equal(coverageByYear['2018'].observedRegions, 823);
assert.equal(coverageByYear['2019'].observedRegions, 823);
assert.equal(coverageByYear['2022'].observedRegions, 801);

const payload = {
  version: 'tulip_europe_heat_population_panel_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'official_population_panel_ingested_boundary_aligned_values_for_22_regions_still_required_in_2022',
  productionRatingsEnabled: 0,
  purpose: 'Pin the official regional population series needed to reproduce the population-weighted European warming check and expose rather than conceal boundary-vintage gaps.',
  method: {
    primary: 'Use the Population on 1 January (JAN) field from demo_r_gind3, the Eurostat collection cited by the source article.',
    corroboration: 'Use total population from demo_r_pjanaggr3 only when the cited collection is missing a value. Where both collections report a value, their difference may not exceed one person.',
    missingData: 'A nearest-year value is recorded only as a sensitivity candidate. It is not treated as an observed value and cannot enable a TULIP rating.',
    weighting: 'For a population-weighted regional mean, divide the sum of regional value times population by the sum of the same included populations. Never replace missing populations with zero.',
  },
  sources: {
    article: {
      url: 'https://www.nature.com/articles/s41612-024-00783-2',
      reportedCoverage: '823 contiguous regions inhabited by over 543 million Europeans in 35 countries.',
      reportedPopulationSource: 'Eurostat regional population estimates; the article links demo_r_gind3.',
    },
    primary: {
      dataset: 'demo_r_gind3',
      url: urls.primary,
      updated: primary.updated,
      bytes: primaryBuffer.length,
      sha256: sha256(primaryBuffer),
    },
    corroborating: {
      dataset: 'demo_r_pjanaggr3',
      url: urls.corroborating,
      updated: corroborating.updated,
      bytes: corroboratingBuffer.length,
      sha256: sha256(corroboratingBuffer),
    },
    regionUniverse: {
      version: universe.version,
      digest: universe.digest,
      regions: universe.regions.length,
    },
  },
  checks: {
    regions: regions.length,
    years,
    overlappingValues,
    disagreementsOverOnePerson,
    completeYears: years.filter(year => coverageByYear[year].observedRegions === 823),
    latestYearObservedRegions: coverageByYear['2022'].observedRegions,
    latestYearMissingRegions: coverageByYear['2022'].missingRegions,
    latestYearMissingIds: coverageByYear['2022'].missingIds,
    latestNearestYearCandidateTotal: coverageByYear['2022'].nearestYearCandidateTotal,
    publishedCoverageFloor: 543_000_000,
    differenceFromPublishedCoverageFloor: coverageByYear['2022'].nearestYearCandidateTotal - 543_000_000,
  },
  interpretation: {
    established: 'The two official Eurostat collections provide mutually consistent values and a complete 823-region panel for 2017, 2018 and 2019.',
    unresolved: 'Twenty-two 2022 values are absent under the older region identifiers used by the study. Nearest-year fills produce about 535.2 million people, below the article’s stated coverage of over 543 million, so those fills are a sensitivity case rather than the source population table.',
    next: 'Obtain or reconstruct the authors’ boundary-aligned yearly population panel, including the old Belgian, Estonian and United Kingdom units, then reproduce the published 2.10 °C population-weighted mean and its interval.',
  },
  coverageByYear,
  regions,
};
payload.digest = sha256(Buffer.from(JSON.stringify({ sources: payload.sources, checks: payload.checks, coverageByYear, regions })));
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, outputPath), status: payload.status, checks: payload.checks, digest: payload.digest }, null, 2));
