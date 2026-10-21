import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeParquetColumn } from './lib/parquet-range-column-reader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const outputJson = path.join(artifactDir, 'europe-temperature-mortality-source-removal-pattern-screen.json');
const outputReport = path.join(artifactDir, 'europe-temperature-mortality-source-removal-pattern-screen-report.md');
const json = async name => JSON.parse(await readFile(path.join(artifactDir, name), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function type7Quantile(values, probability) {
  assert(values.length > 0, 'Cannot calculate a quantile of an empty collection');
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower] + ((sorted[lower + 1] ?? sorted[lower]) - sorted[lower]) * fraction;
}

function summarize(values) {
  const finite = values.filter(Number.isFinite);
  assert(finite.length > 0, 'No finite values to summarize');
  return {
    minimum: Math.min(...finite),
    q025: type7Quantile(finite, 0.025),
    q25: type7Quantile(finite, 0.25),
    median: type7Quantile(finite, 0.5),
    q75: type7Quantile(finite, 0.75),
    q975: type7Quantile(finite, 0.975),
    maximum: Math.max(...finite),
  };
}

function fit(rows) {
  assert(rows.length >= 8, `At least eight paired years are required; received ${rows.length}`);
  const meanX = rows.reduce((sum, row) => sum + row.gmst, 0) / rows.length;
  const meanY = rows.reduce((sum, row) => sum + row.temperature, 0) / rows.length;
  const sumXX = rows.reduce((sum, row) => sum + (row.gmst - meanX) ** 2, 0);
  const sumXY = rows.reduce((sum, row) => sum + (row.gmst - meanX) * (row.temperature - meanY), 0);
  assert(sumXX > 0, 'Regional regression has no GMST variation');
  const slope = sumXY / sumXX;
  const intercept = meanY - slope * meanX;
  const residualSumSquares = rows.reduce((sum, row) => (
    sum + (row.temperature - (intercept + slope * row.gmst)) ** 2
  ), 0);
  const totalSumSquares = rows.reduce((sum, row) => sum + (row.temperature - meanY) ** 2, 0);
  return {
    years: rows.length,
    firstYear: rows[0].year,
    lastYear: rows.at(-1).year,
    intercept,
    slope,
    slopeStandardError: Math.sqrt(residualSumSquares / (rows.length - 2) / sumXX),
    rSquared: totalSumSquares > 0 ? 1 - residualSumSquares / totalSumSquares : null,
  };
}

const [bridge, coverage, regionalPlan, attribution] = await Promise.all([
  json('europe-temperature-mortality-bridge-reference-snapshot.json'),
  json('europe-temperature-mortality-coverage-enumeration.json'),
  json('internal-europe-heat-regional-pattern-ingestion.json'),
  json('europe-temperature-mortality-attribution-reproduction.json'),
]);

assert.equal(bridge.status, 'candidate_independent_human_endpoint_bridge_not_admitted');
assert.equal(coverage.status, 'exact_public_region_and_year_coverage_enumerated');
assert.equal(attribution.status, 'pooled_factual_temperature_mortality_attribution_internally_reproduced_not_independently_validated');
assert.equal(attribution.admissionDecision.axesAdmitted, 0);
assert.equal(attribution.admissionDecision.scoresChanged, 0);

const annual = bridge.parquet.annualTemperatureSummaries;
assert.equal(annual.rows, 27_875);
assert(annual.completeFile?.sha256, 'Annual-temperature complete-file checksum is missing');
const [regions, yearsRaw, temperaturesRaw] = await Promise.all([
  decodeParquetColumn(annual, 'adm_id'),
  decodeParquetColumn(annual, 'year'),
  decodeParquetColumn(annual, 'avg_temp'),
]);
assert.equal(regions.length, annual.rows);
assert.equal(yearsRaw.length, annual.rows);
assert.equal(temperaturesRaw.length, annual.rows);

const responseRegionIds = coverage.files.fullPanel.regionIds;
assert.equal(responseRegionIds.length, 971);
const responseRegions = new Set(responseRegionIds);
const hadcrutRows = regionalPlan.inputAudit.hadcrut5.trailingSeries1950To2022;
const hadcrutByYear = new Map(hadcrutRows.map(row => [row.year, row.anomalyC]));
const rowsByRegion = new Map(responseRegionIds.map(region => [region, []]));
const regionYearKeys = new Set();
let rowsOutsideResponseUniverse = 0;
let rowsOutsideScreenPeriod = 0;

for (let index = 0; index < annual.rows; index += 1) {
  const region = regions[index];
  const year = Number(yearsRaw[index]);
  const temperature = Number(temperaturesRaw[index]);
  assert(Number.isInteger(year), `Invalid annual-temperature year at row ${index}`);
  assert(Number.isFinite(temperature), `Invalid annual temperature at row ${index}`);
  if (!responseRegions.has(region)) {
    rowsOutsideResponseUniverse += 1;
    continue;
  }
  if (year < 2000 || year > 2022 || !hadcrutByYear.has(year)) {
    rowsOutsideScreenPeriod += 1;
    continue;
  }
  const key = `${region}:${year}`;
  assert(!regionYearKeys.has(key), `Duplicate annual region-year row: ${key}`);
  regionYearKeys.add(key);
  rowsByRegion.get(region).push({ year, temperature, gmst: hadcrutByYear.get(year) });
}

const localWarming2022Factor = regionalPlan.inputAudit.hadcrut5.warming2022CRelativeTo1850To1900;
const regionFits = responseRegionIds.map(region => {
  const rows = rowsByRegion.get(region).sort((left, right) => left.year - right.year);
  const full = fit(rows);
  const firstHalf = fit(rows.filter(row => row.year <= 2011));
  const secondHalf = fit(rows.filter(row => row.year >= 2012));
  return {
    region,
    full,
    firstHalf,
    secondHalf,
    splitHalfAbsoluteSlopeDifference: Math.abs(firstHalf.slope - secondHalf.slope),
    splitHalfOppositeSigns: Math.sign(firstHalf.slope) !== Math.sign(secondHalf.slope),
    impliedLocalWarming2022C: full.slope * localWarming2022Factor,
  };
});

assert(regionFits.every(row => row.full.years === 23));
const slopes = regionFits.map(row => row.full.slope);
const standardErrors = regionFits.map(row => row.full.slopeStandardError);
const rSquared = regionFits.map(row => row.full.rSquared);
const splitDifferences = regionFits.map(row => row.splitHalfAbsoluteSlopeDifference);
const impliedWarming = regionFits.map(row => row.impliedLocalWarming2022C);
const diagnostics = {
  responseRegions: responseRegionIds.length,
  responseRegionYears: regionYearKeys.size,
  yearsPerRegion: summarize(regionFits.map(row => row.full.years)),
  slope: summarize(slopes),
  slopeStandardError: summarize(standardErrors),
  rSquared: summarize(rSquared),
  splitHalfAbsoluteSlopeDifference: summarize(splitDifferences),
  impliedLocalWarming2022C: summarize(impliedWarming),
  negativeFullPeriodSlopes: regionFits.filter(row => row.full.slope < 0).length,
  rSquaredBelowPointTwo: regionFits.filter(row => row.full.rSquared < 0.2).length,
  splitHalfOppositeSigns: regionFits.filter(row => row.splitHalfOppositeSigns).length,
};

const payload = {
  version: 'tulip_europe_temperature_mortality_source_removal_pattern_screen_2026_09_26_v1',
  preparedOn: '2026-09-26',
  status: 'complete_short_record_regional_pattern_screen_not_admitted',
  productionRatingsEnabled: 0,
  purpose: 'Test whether the published 2000–2022 regional annual-temperature summaries are stable enough to create local source-removal temperatures for the reproduced mortality endpoint.',
  inputs: {
    bridgeVersion: bridge.version,
    coverageVersion: coverage.version,
    attributionVersion: attribution.version,
    regionalPlanVersion: regionalPlan.version,
    annualTemperatureSummaries: {
      rows: annual.rows,
      sha256: annual.completeFile.sha256,
    },
    responseRegionIdDigest: coverage.files.fullPanel.regionIdDigest,
    hadcrut5: {
      productVersion: regionalPlan.inputAudit.hadcrut5.productVersion,
      sha256: regionalPlan.sourceSummary.hadcrut5Annual.sha256,
      series: 'four-year trailing mean, inclusive of the assessment year',
      regressionYearsUsed: [2000, 2022],
      warming2022CRelativeTo1850To1900: localWarming2022Factor,
    },
  },
  coverage: {
    decodedAnnualRows: annual.rows,
    rowsOutsideResponseUniverse,
    rowsOutsideScreenPeriod,
    responseRegions: responseRegionIds.length,
    fittedRegions: regionFits.length,
    fittedRegionYears: regionYearKeys.size,
    duplicateRegionYears: 0,
  },
  method: {
    fullFit: 'For each mortality-panel region, ordinary least squares of annual average regional temperature on the four-year trailing HadCRUT5 global anomaly over 2000–2022.',
    splitHalfChallenge: 'Repeat the same regression over 2000–2011 and 2012–2022; compare slope magnitude and sign.',
    impliedWarming: 'Multiply the full-period regional slope by 2022 HadCRUT5 warming relative to 1850–1900.',
    role: 'Short-record stability diagnostic only. No source-removal temperature or mortality total is admitted from this screen.',
  },
  diagnostics,
  regions: regionFits,
  decision: {
    status: 'not_admitted_short_record_pattern_instability',
    reason: `${diagnostics.negativeFullPeriodSlopes} of ${diagnostics.responseRegions} regional slopes are negative, ${diagnostics.rSquaredBelowPointTwo} have R² below 0.2, and ${diagnostics.splitHalfOppositeSigns} reverse sign between the two half-period fits. The median absolute split-half slope difference is ${diagnostics.splitHalfAbsoluteSlopeDifference.median.toFixed(3)}, too large to treat this 23-year observational fit as a calibrated forced-response pattern.`,
    axesAdmitted: 0,
    scoresChanged: 0,
    nextGate: 'Estimate the regional forced-temperature pattern over the predeclared 1950–2022 record using the validated ERA5-Land aggregation, compare it with an independent model or author-provided pattern, then run each source history through the reproduced daily mortality endpoint and all 100 bootstrap fits.',
  },
};
payload.digest = digest(payload);

const report = `# European temperature–mortality source-removal pattern screen

**Version:** \`${payload.version}\`  
**Status:** ${payload.status}

## Question

Can the already-published 2000–2022 regional temperature summaries safely supply the local warming pattern needed to remove each TULIP emission source from the factual mortality record?

## Result

All ${diagnostics.responseRegions.toLocaleString('en-US')} mortality-panel regions have 23 paired annual observations. The median regional slope is ${diagnostics.slope.median.toFixed(3)} local degrees per degree of four-year trailing global anomaly, implying ${diagnostics.impliedLocalWarming2022C.median.toFixed(3)} °C median local warming in 2022. The short record is not stable enough for calibration:

- ${diagnostics.negativeFullPeriodSlopes} full-period slopes are negative.
- ${diagnostics.rSquaredBelowPointTwo} regional fits have R² below 0.2.
- ${diagnostics.splitHalfOppositeSigns} slopes reverse sign between 2000–2011 and 2012–2022.
- The median absolute difference between the two half-period slopes is ${diagnostics.splitHalfAbsoluteSlopeDifference.median.toFixed(3)}.

These are diagnostics of observational fit stability. They are not probability bounds and do not establish a source-specific counterfactual.

## Decision

Zero TULIP axes and zero scores change. The 23-year screen is retained because it demonstrates why a convenient short regression would be unsafe. The next gate is the predeclared 1950–2022 ERA5-Land reconstruction, checked against an independent forced-response pattern or author output, followed by the same 100 mortality bootstrap fits.
`;

await Promise.all([
  writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(outputReport, report),
]);

console.log(JSON.stringify({
  output: path.relative(root, outputJson),
  status: payload.status,
  diagnostics,
  digest: payload.digest,
}, null, 2));
