import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  decodeParquetColumn,
  decodeParquetColumnRowGroup,
} from './lib/parquet-range-column-reader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const bridgePath = path.join(artifactDir, 'europe-temperature-mortality-bridge-reference-snapshot.json');
const pooledModelPath = path.join(artifactDir, 'europe-temperature-mortality-pooled-model-reproduction.json');
const outputJson = path.join(artifactDir, 'europe-temperature-mortality-attribution-reproduction.json');
const outputReport = path.join(artifactDir, 'europe-temperature-mortality-attribution-reproduction-report.md');

const sha256 = value => createHash('sha256').update(value).digest('hex');
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

function type7QuantileSorted(sorted, probability) {
  assert(sorted.length > 0, 'Cannot calculate a quantile of an empty collection');
  assert(probability >= 0 && probability <= 1, 'Quantile probability is outside [0, 1]');
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  if (!fraction) return sorted[lower];
  return sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
}

function summarize(values) {
  assert(values.length > 0, 'Cannot summarize an empty collection');
  const sorted = Float64Array.from(values);
  sorted.sort();
  return {
    q025: type7QuantileSorted(sorted, 0.025),
    median: type7QuantileSorted(sorted, 0.5),
    q975: type7QuantileSorted(sorted, 0.975),
    mean: mean(values),
  };
}

function responseAt(temperature, centeredAt, coefficients) {
  let result = 0;
  for (let degree = 1; degree <= 4; degree += 1) {
    result += (temperature ** degree - centeredAt ** degree) * coefficients[degree - 1];
  }
  return result;
}

function panelKey(regionIndex, year, week) {
  return regionIndex * 1_000_000 + year * 100 + week;
}

function requireInteger(value, label) {
  assert(Number.isInteger(value), `${label} is not an integer: ${value}`);
  return value;
}

const bridge = await json(bridgePath);
const pooledModel = await json(pooledModelPath);
assert.equal(bridge.status, 'candidate_independent_human_endpoint_bridge_not_admitted');
assert.equal(pooledModel.model.crossRuntimeValidation.status, 'passed_python_numpy_vs_base_r');
assert.equal(pooledModel.model.bootstrap.iterations, 100);
assert.equal(pooledModel.model.fit.columns, 24);
assert.equal(pooledModel.productionRatingsEnabled, 0);

const fullPanel = bridge.parquet.fullPanel;
const dailyTemperature = bridge.parquet.dailyTemperature;
const temperatureBins = bridge.parquet.temperatureBins;
for (const file of [fullPanel, dailyTemperature, temperatureBins]) {
  assert(file.completeFile?.sha256, `${file.name}: complete-file checksum missing`);
  assert.equal(file.rows, file.columns[0].values, `${file.name}: metadata row count mismatch`);
}

const [panelRegions, panelYearsRaw, panelWeeksRaw, panelPopulation, panelDeaths] = await Promise.all([
  decodeParquetColumn(fullPanel, 'adm_id'),
  decodeParquetColumn(fullPanel, 'year'),
  decodeParquetColumn(fullPanel, 'week'),
  decodeParquetColumn(fullPanel, 'pop_all'),
  decodeParquetColumn(fullPanel, 'n_deaths_all'),
]);
assert.equal(panelRegions.length, fullPanel.rows);
for (const values of [panelYearsRaw, panelWeeksRaw, panelPopulation, panelDeaths]) assert.equal(values.length, fullPanel.rows);

const regionDictionary = [...new Set(panelRegions)].sort();
const regionIndexById = new Map(regionDictionary.map((region, index) => [region, index]));
assert.equal(regionDictionary.length, pooledModel.model.panel.regions);
const panelIndexByKey = new Map();
const panelYears = new Int32Array(fullPanel.rows);
const panelWeeks = new Int16Array(fullPanel.rows);
const annualDeathsMap = new Map();
for (let index = 0; index < fullPanel.rows; index += 1) {
  const regionIndex = regionIndexById.get(panelRegions[index]);
  assert.notEqual(regionIndex, undefined);
  const year = requireInteger(panelYearsRaw[index], 'fullPanel.year');
  const week = requireInteger(panelWeeksRaw[index], 'fullPanel.week');
  assert(Number.isFinite(panelPopulation[index]) && panelPopulation[index] >= 0, 'fullPanel.pop_all is invalid');
  assert(Number.isInteger(panelDeaths[index]) && panelDeaths[index] >= 0, 'fullPanel.n_deaths_all is invalid');
  const key = panelKey(regionIndex, year, week);
  assert(!panelIndexByKey.has(key), `Duplicate full-panel key: ${panelRegions[index]} ${year} ${week}`);
  panelIndexByKey.set(key, index);
  panelYears[index] = year;
  panelWeeks[index] = week;
  annualDeathsMap.set(year, (annualDeathsMap.get(year) ?? 0) + panelDeaths[index]);
}
const years = [...annualDeathsMap.keys()].sort((left, right) => left - right);
const yearIndexByYear = new Map(years.map((year, index) => [year, index]));

let observedTemperatures = new Float64Array(dailyTemperature.rows);
let observedOffset = 0;
let observedMinimum = Infinity;
let observedMaximum = -Infinity;
for (let rowGroup = 0; rowGroup < dailyTemperature.rowGroupRows.length; rowGroup += 1) {
  const values = await decodeParquetColumnRowGroup(dailyTemperature, 'temp1', rowGroup);
  assert.equal(values.length, dailyTemperature.rowGroupRows[rowGroup]);
  for (const value of values) {
    assert(Number.isFinite(value), 'dailyTemperature.temp1 contains a non-finite value');
    if (value < observedMinimum) observedMinimum = value;
    if (value > observedMaximum) observedMaximum = value;
  }
  observedTemperatures.set(values, observedOffset);
  observedOffset += values.length;
}
assert.equal(observedOffset, dailyTemperature.rows);
observedTemperatures.sort();
const observedQ01 = type7QuantileSorted(observedTemperatures, 0.01);
const observedQ998 = type7QuantileSorted(observedTemperatures, 0.998);

const centralCumulative = pooledModel.model.fit.cumulativeTemperatureCoefficients;
const bootstrapCumulative = pooledModel.model.bootstrap.cumulativeTemperatureCoefficients;
assert.equal(centralCumulative.length, 4);
assert.equal(bootstrapCumulative.length, 100);
assert(bootstrapCumulative.every(row => row.length === 4));
const predictionBins = Array.from({ length: 101 }, (_, index) => index - 50);
const eligibleMmtBins = predictionBins.filter(value => value > observedQ01 && value < observedQ998);
assert(eligibleMmtBins.length > 0, 'Observed-temperature trimming removed every MMT candidate');
let minimumMortalityTemperature = eligibleMmtBins[0];
let minimumResponse = responseAt(minimumMortalityTemperature, 0, centralCumulative);
for (const value of eligibleMmtBins.slice(1)) {
  const response = responseAt(value, 0, centralCumulative);
  if (response < minimumResponse) {
    minimumResponse = response;
    minimumMortalityTemperature = value;
  }
}
observedTemperatures = null;
if (global.gc) global.gc();

const sideNames = ['cold', 'hot'];
const annualSideMoments = new Float64Array(years.length * sideNames.length * 4);
const annualSideDays = new Float64Array(years.length * sideNames.length);
const panelDailyCounts = new Uint16Array(fullPanel.rows);
let matchedDailyRows = 0;
let unmatchedDailyRows = 0;
let dailyRowsOutsidePanelYears = 0;
let duplicateDailyDateRows = 0;
let dailyDateOrderViolations = 0;
let previousDailyDate = null;
const maximumTemperaturePolynomialAbsoluteDifference = [0, 0, 0, 0];
for (let rowGroup = 0; rowGroup < dailyTemperature.rowGroupRows.length; rowGroup += 1) {
  const [regions, yearsRaw, monthsRaw, daysRaw, weeksRaw, temp1, temp2, temp3, temp4] = await Promise.all([
    decodeParquetColumnRowGroup(dailyTemperature, 'adm_id', rowGroup),
    decodeParquetColumnRowGroup(dailyTemperature, 'year', rowGroup),
    decodeParquetColumnRowGroup(dailyTemperature, 'month', rowGroup),
    decodeParquetColumnRowGroup(dailyTemperature, 'day', rowGroup),
    decodeParquetColumnRowGroup(dailyTemperature, 'week', rowGroup),
    decodeParquetColumnRowGroup(dailyTemperature, 'temp1', rowGroup),
    decodeParquetColumnRowGroup(dailyTemperature, 'temp2', rowGroup),
    decodeParquetColumnRowGroup(dailyTemperature, 'temp3', rowGroup),
    decodeParquetColumnRowGroup(dailyTemperature, 'temp4', rowGroup),
  ]);
  const rowCount = dailyTemperature.rowGroupRows[rowGroup];
  for (const values of [regions, yearsRaw, monthsRaw, daysRaw, weeksRaw, temp1, temp2, temp3, temp4]) assert.equal(values.length, rowCount);
  for (let index = 0; index < rowCount; index += 1) {
    const regionIndex = regionIndexById.get(regions[index]);
    const year = requireInteger(yearsRaw[index], 'dailyTemperature.year');
    const month = requireInteger(monthsRaw[index], 'dailyTemperature.month');
    const day = requireInteger(daysRaw[index], 'dailyTemperature.day');
    const week = requireInteger(weeksRaw[index], 'dailyTemperature.week');
    const currentDailyDate = [regions[index], year, month, day];
    if (previousDailyDate) {
      let comparison = currentDailyDate[0].localeCompare(previousDailyDate[0]);
      for (let part = 1; !comparison && part < currentDailyDate.length; part += 1) {
        comparison = currentDailyDate[part] - previousDailyDate[part];
      }
      if (comparison === 0) duplicateDailyDateRows += 1;
      if (comparison < 0) dailyDateOrderViolations += 1;
    }
    previousDailyDate = currentDailyDate;
    const temperatures = [temp1[index], temp2[index], temp3[index], temp4[index]];
    assert(temperatures.every(Number.isFinite), 'Daily temperature polynomial contains a non-finite value');
    for (let degreeIndex = 0; degreeIndex < 4; degreeIndex += 1) {
      maximumTemperaturePolynomialAbsoluteDifference[degreeIndex] = Math.max(
        maximumTemperaturePolynomialAbsoluteDifference[degreeIndex],
        Math.abs(temperatures[degreeIndex] - temp1[index] ** (degreeIndex + 1)),
      );
    }
    if (regionIndex === undefined) {
      unmatchedDailyRows += 1;
      if (!yearIndexByYear.has(year)) dailyRowsOutsidePanelYears += 1;
      continue;
    }
    const panelIndex = panelIndexByKey.get(panelKey(regionIndex, year, week));
    if (panelIndex === undefined) {
      unmatchedDailyRows += 1;
      if (!yearIndexByYear.has(year)) dailyRowsOutsidePanelYears += 1;
      continue;
    }
    const yearIndex = yearIndexByYear.get(year);
    assert.notEqual(yearIndex, undefined);
    const sideIndex = temp1[index] > minimumMortalityTemperature ? 1 : 0;
    const population = panelPopulation[panelIndex];
    const base = (yearIndex * 2 + sideIndex) * 4;
    for (let degreeIndex = 0; degreeIndex < 4; degreeIndex += 1) {
      annualSideMoments[base + degreeIndex] += population * (
        temperatures[degreeIndex] - minimumMortalityTemperature ** (degreeIndex + 1)
      );
    }
    annualSideDays[yearIndex * 2 + sideIndex] += 1;
    panelDailyCounts[panelIndex] += 1;
    matchedDailyRows += 1;
  }
}
assert.equal(matchedDailyRows + unmatchedDailyRows, dailyTemperature.rows);
const panelWeeksWithDailyTemperature = panelDailyCounts.reduce((count, value) => count + Number(value > 0), 0);
const panelWeeksWithoutDailyTemperature = fullPanel.rows - panelWeeksWithDailyTemperature;
const maximumDailyRowsPerPanelWeek = panelDailyCounts.reduce((maximum, value) => Math.max(maximum, value), 0);
const dailyRowsPerPanelWeekHistogram = {};
for (const value of panelDailyCounts) {
  dailyRowsPerPanelWeekHistogram[value] = (dailyRowsPerPanelWeekHistogram[value] ?? 0) + 1;
}

const binMidpoints = temperatureBins.schema
  .slice(4)
  .map(item => Number(item.name));
assert.equal(binMidpoints.length, 100);
assert(binMidpoints.every(Number.isFinite));
const attributedBins = binMidpoints.map(value => Math.ceil(value));
assert.equal(new Set(attributedBins).size, attributedBins.length);
const annualPersonDays = new Float64Array(years.length * binMidpoints.length);
const annualBinDayCounts = new Float64Array(years.length * binMidpoints.length);
const binYearHasRows = new Uint8Array(years.length);
let matchedTemperatureBinRows = 0;
let unmatchedTemperatureBinRows = 0;
let matchedTemperatureBinDays = 0;
for (let rowGroup = 0; rowGroup < temperatureBins.rowGroupRows.length; rowGroup += 1) {
  const [regions, yearsRaw, weeksRaw] = await Promise.all([
    decodeParquetColumnRowGroup(temperatureBins, 'adm_id', rowGroup),
    decodeParquetColumnRowGroup(temperatureBins, 'year', rowGroup),
    decodeParquetColumnRowGroup(temperatureBins, 'week', rowGroup),
  ]);
  const rowCount = temperatureBins.rowGroupRows[rowGroup];
  const matchedPanelIndexes = new Int32Array(rowCount);
  matchedPanelIndexes.fill(-1);
  const matchedYearIndexes = new Int16Array(rowCount);
  matchedYearIndexes.fill(-1);
  for (let index = 0; index < rowCount; index += 1) {
    const regionIndex = regionIndexById.get(regions[index]);
    const year = requireInteger(yearsRaw[index], 'temperatureBins.year');
    const week = requireInteger(weeksRaw[index], 'temperatureBins.week');
    const panelIndex = regionIndex === undefined ? undefined : panelIndexByKey.get(panelKey(regionIndex, year, week));
    if (panelIndex === undefined) {
      unmatchedTemperatureBinRows += 1;
      continue;
    }
    const yearIndex = yearIndexByYear.get(year);
    assert.notEqual(yearIndex, undefined);
    matchedPanelIndexes[index] = panelIndex;
    matchedYearIndexes[index] = yearIndex;
    binYearHasRows[yearIndex] = 1;
    matchedTemperatureBinRows += 1;
  }

  const batchSize = 10;
  for (let batchStart = 0; batchStart < binMidpoints.length; batchStart += batchSize) {
    const batchIndexes = Array.from(
      { length: Math.min(batchSize, binMidpoints.length - batchStart) },
      (_, offset) => batchStart + offset,
    );
    const columns = await Promise.all(batchIndexes.map(binIndex => (
      decodeParquetColumnRowGroup(temperatureBins, String(binMidpoints[binIndex]), rowGroup)
    )));
    for (let batchIndex = 0; batchIndex < columns.length; batchIndex += 1) {
      const binIndex = batchIndexes[batchIndex];
      const counts = columns[batchIndex];
      assert.equal(counts.length, rowCount);
      for (let index = 0; index < rowCount; index += 1) {
        const panelIndex = matchedPanelIndexes[index];
        if (panelIndex < 0) continue;
        const dayCount = counts[index];
        assert(Number.isInteger(dayCount) && dayCount >= 0, 'Temperature-bin day count is invalid');
        if (!dayCount) continue;
        const yearIndex = matchedYearIndexes[index];
        const destination = yearIndex * binMidpoints.length + binIndex;
        annualBinDayCounts[destination] += dayCount;
        annualPersonDays[destination] += dayCount * panelPopulation[panelIndex];
        matchedTemperatureBinDays += dayCount;
      }
    }
  }
}
assert.equal(matchedTemperatureBinRows + unmatchedTemperatureBinRows, temperatureBins.rows);

const responseCurve = predictionBins.map(temperature => {
  const bootstrapResponses = bootstrapCumulative.map(coefficients => (
    responseAt(temperature, minimumMortalityTemperature, coefficients)
  ));
  return { temperatureC: temperature, ...summarize(bootstrapResponses) };
});

const annualBySide = [];
const annualBootstrapBySide = new Map();
for (let yearIndex = 0; yearIndex < years.length; yearIndex += 1) {
  for (let sideIndex = 0; sideIndex < sideNames.length; sideIndex += 1) {
    const days = annualSideDays[yearIndex * 2 + sideIndex];
    if (!days) continue;
    const base = (yearIndex * 2 + sideIndex) * 4;
    const bootstrapDeaths = bootstrapCumulative.map(coefficients => {
      let deaths = 0;
      for (let degreeIndex = 0; degreeIndex < 4; degreeIndex += 1) {
        deaths += annualSideMoments[base + degreeIndex] * coefficients[degreeIndex];
      }
      return deaths;
    });
    const year = years[yearIndex];
    annualBootstrapBySide.set(`${year}:${sideIndex}`, bootstrapDeaths);
    annualBySide.push({
      year,
      side: sideNames[sideIndex],
      matchedDailyRows: days,
      ...summarize(bootstrapDeaths),
      totalDeaths: annualDeathsMap.get(year),
    });
  }
}

const averageAnnualBySide = sideNames.map((side, sideIndex) => {
  const rows = annualBySide.filter(item => item.side === side);
  return {
    side,
    observedYears: rows.length,
    totalDeaths: mean(rows.map(item => item.totalDeaths)),
    q025: mean(rows.map(item => item.q025)),
    mean: mean(rows.map(item => item.mean)),
    median: mean(rows.map(item => item.median)),
    q975: mean(rows.map(item => item.q975)),
  };
});

const annualTotals = [];
for (const year of years) {
  const cold = annualBootstrapBySide.get(`${year}:0`);
  const hot = annualBootstrapBySide.get(`${year}:1`);
  if (!cold && !hot) continue;
  const values = Array.from({ length: bootstrapCumulative.length }, (_, index) => (
    (cold?.[index] ?? 0) + (hot?.[index] ?? 0)
  ));
  annualTotals.push({ year, ...summarize(values), totalDeaths: annualDeathsMap.get(year) });
}
const averageAnnualTotal = {
  observedYears: annualTotals.length,
  totalDeaths: mean(annualTotals.map(item => item.totalDeaths)),
  q025: mean(annualTotals.map(item => item.q025)),
  mean: mean(annualTotals.map(item => item.mean)),
  median: mean(annualTotals.map(item => item.median)),
  q975: mean(annualTotals.map(item => item.q975)),
};
averageAnnualTotal.shareOfObservedDeaths = averageAnnualTotal.mean / averageAnnualTotal.totalDeaths;

const exposureYearIndexes = [...binYearHasRows]
  .map((value, index) => value ? index : -1)
  .filter(index => index >= 0);
assert(exposureYearIndexes.length > 0);
const averageObservedDeathsForBinYears = mean(exposureYearIndexes.map(index => annualDeathsMap.get(years[index])));
const personDayAttributionByBin = attributedBins.map((temperature, binIndex) => {
  const averageAnnualPersonDays = mean(exposureYearIndexes.map(yearIndex => (
    annualPersonDays[yearIndex * binMidpoints.length + binIndex]
  )));
  const averageAnnualDays = mean(exposureYearIndexes.map(yearIndex => (
    annualBinDayCounts[yearIndex * binMidpoints.length + binIndex]
  )));
  const bootstrapDeaths = bootstrapCumulative.map(coefficients => (
    responseAt(temperature, minimumMortalityTemperature, coefficients) * averageAnnualPersonDays
  ));
  const summary = summarize(bootstrapDeaths);
  return {
    sourceMidpointC: binMidpoints[binIndex],
    responseBinC: temperature,
    averageAnnualDays,
    averageAnnualPersonDays,
    ...summary,
    shareOfObservedDeaths: summary.mean / averageObservedDeathsForBinYears,
  };
});
const personDayTotalBootstrapDeaths = Array.from({ length: bootstrapCumulative.length }, (_, iteration) => (
  personDayAttributionByBin.reduce((sum, row) => {
    const response = responseAt(row.responseBinC, minimumMortalityTemperature, bootstrapCumulative[iteration]);
    return sum + response * row.averageAnnualPersonDays;
  }, 0)
));
const personDayTotal = {
  observedYears: exposureYearIndexes.length,
  totalDeaths: averageObservedDeathsForBinYears,
  ...summarize(personDayTotalBootstrapDeaths),
};
personDayTotal.shareOfObservedDeaths = personDayTotal.mean / personDayTotal.totalDeaths;

const yearsWithDailyAttribution = annualTotals.map(item => item.year);
const yearsWithPersonDayBins = exposureYearIndexes.map(index => years[index]);
const annualSideSufficientStatistics = [];
for (let yearIndex = 0; yearIndex < years.length; yearIndex += 1) {
  for (let sideIndex = 0; sideIndex < sideNames.length; sideIndex += 1) {
    const days = annualSideDays[yearIndex * 2 + sideIndex];
    if (!days) continue;
    const base = (yearIndex * 2 + sideIndex) * 4;
    annualSideSufficientStatistics.push({
      year: years[yearIndex],
      side: sideNames[sideIndex],
      matchedDailyRows: days,
      populationWeightedCenteredTemperaturePowers: Array.from(annualSideMoments.subarray(base, base + 4)),
    });
  }
}
const annualPersonDaySufficientStatistics = exposureYearIndexes.map(yearIndex => ({
  year: years[yearIndex],
  personDaysByResponseBin: Array.from(
    annualPersonDays.subarray(yearIndex * binMidpoints.length, (yearIndex + 1) * binMidpoints.length),
  ),
}));
const payloadWithoutDigest = {
  version: 'tulip_europe_temperature_mortality_attribution_reproduction_2026_09_25_v1',
  checkedOn: '2026-09-25',
  status: 'pooled_factual_temperature_mortality_attribution_internally_reproduced_not_independently_validated',
  productionRatingsEnabled: 0,
  inputs: {
    bridgeVersion: bridge.version,
    pooledModelVersion: pooledModel.version,
    repository: bridge.repository,
    parquet: {
      fullPanel: { rows: fullPanel.rows, sha256: fullPanel.completeFile.sha256 },
      dailyTemperature: { rows: dailyTemperature.rows, sha256: dailyTemperature.completeFile.sha256 },
      temperatureBins: { rows: temperatureBins.rows, sha256: temperatureBins.completeFile.sha256 },
    },
  },
  method: {
    population: 'All ages (pop_all, n_deaths_all and rate_all).',
    response: 'Sum the current and three lag coefficients for each raw temperature polynomial degree, matching the pinned author script.',
    observedTemperatureTrim: 'Global type-7 1st and 99.8th percentiles of daily temp1; eligible MMT integers are strictly inside both limits.',
    minimumMortalityTemperature: 'Choose the lowest central fitted response on the eligible integer grid, then center every bootstrap response at that temperature.',
    dailyAttribution: 'Within each region-year-week and hot/cold side, sum daily raw temperature powers, subtract the MMT powers once per day, multiply by the matching weekly population, then apply each bootstrap response curve.',
    personDayBins: 'Multiply each reported one-degree day count by matching weekly population, map midpoint columns to the author script ceiling bin, and apply the centered bootstrap response at that integer.',
    uncertainty: 'The 2.5th and 97.5th percentiles are empirical quantiles across the 100 spatial bootstrap fits. They are not probability bounds over every source of uncertainty.',
  },
  observedTemperature: {
    rows: dailyTemperature.rows,
    minimumC: observedMinimum,
    maximumC: observedMaximum,
    q01C: observedQ01,
    q998C: observedQ998,
    eligibleIntegerBinsC: [eligibleMmtBins[0], eligibleMmtBins.at(-1)],
    minimumMortalityTemperatureC: minimumMortalityTemperature,
    untrimmedMinimumMortalityTemperatureC: pooledModel.model.fit.minimumMortalityTemperatureOnIntegerMinus50To50Grid,
  },
  coverage: {
    responsePanelRows: fullPanel.rows,
    responsePanelRegions: regionDictionary.length,
    dailyTemperatureRows: dailyTemperature.rows,
    matchedDailyTemperatureRows: matchedDailyRows,
    unmatchedDailyTemperatureRows: unmatchedDailyRows,
    unmatchedDailyRowsOutsideResponsePanelYears: dailyRowsOutsidePanelYears,
    responsePanelWeeksWithDailyTemperature: panelWeeksWithDailyTemperature,
    responsePanelWeeksWithoutDailyTemperature: panelWeeksWithoutDailyTemperature,
    maximumDailyRowsPerResponsePanelWeek: maximumDailyRowsPerPanelWeek,
    dailyRowsPerResponsePanelWeekHistogram: dailyRowsPerPanelWeekHistogram,
    temperatureBinRows: temperatureBins.rows,
    matchedTemperatureBinRows,
    unmatchedTemperatureBinRows,
    matchedTemperatureBinDays,
    matchedDailyMinusBinnedDayCount: matchedDailyRows - matchedTemperatureBinDays,
    yearsWithDailyAttribution,
    yearsWithPersonDayBins,
  },
  responseCurve,
  attribution: {
    annualBySide,
    averageAnnualBySide,
    annualTotal: annualTotals,
    averageAnnualTotal,
    personDayAttributionByBin,
    personDayTotal,
  },
  sufficientStatistics: {
    annualSide: annualSideSufficientStatistics,
    personDayResponseBinsC: attributedBins,
    annualPersonDays: annualPersonDaySufficientStatistics,
  },
  validation: {
    authorCodeSha256: bridge.repository.files['us_mex_eu_response_attribution.R'].sha256,
    authorOutputsAvailableAtPinnedCommit: false,
    authorOutputsCompared: false,
    bootstrapIterations: bootstrapCumulative.length,
    bootstrapRanks: [pooledModel.model.bootstrap.minimumRank, pooledModel.model.bootstrap.maximumRank],
    crossRuntimeCentralAndBootstrapModelStatus: pooledModel.model.crossRuntimeValidation.status,
    dailyDateSort: 'adm_id, year, month, day',
    dailyDateOrderViolations,
    duplicateDailyDateRows,
    maximumTemperaturePolynomialAbsoluteDifference,
    exactAuthorOperationsReproduced: [
      'type-7 1% and 99.8% daily-temperature trimming',
      'strictly interior integer-grid MMT selection',
      'hot/cold split at temp1 > MMT',
      'population-weighted raw-polynomial daily attribution',
      'ceiling conversion of one-degree midpoint bins',
      'type-7 bootstrap uncertainty summaries',
    ],
  },
  admissionDecision: {
    status: 'not_admitted_factual_temperature_endpoint_only',
    reason: 'This reproduces mortality associated with factual hot and cold temperatures in the covered European panel. It does not isolate the temperature removed by any TULIP emission-source node, and it supplies no ecosystem consequence endpoint.',
    axesAdmitted: 0,
    scoresChanged: 0,
    nextGate: 'Run matched local source-removal temperatures through this reproduced daily endpoint with the same 100 bootstrap fits, compare against an author-generated output if obtainable, and validate a separate ecosystem endpoint before admitting any source-node axis.',
  },
};
const payload = { ...payloadWithoutDigest, digest: sha256(JSON.stringify(payloadWithoutDigest)) };
await writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`);

const hot = averageAnnualBySide.find(item => item.side === 'hot');
const cold = averageAnnualBySide.find(item => item.side === 'cold');
const report = `# European temperature–mortality attribution reproduction

**Status:** internal factual-temperature endpoint reproduction; not an admitted TULIP score input  
**Version:** \`${payload.version}\`  
**Source model:** [${bridge.paper.title}](${bridge.paper.paperUrl}), pinned at \`${bridge.repository.commit}\`

## What now reproduces

- The checksum-pinned daily file contributes **${dailyTemperature.rows.toLocaleString('en-US')}** observed temperature rows. Its type-7 1st and 99.8th percentiles are **${observedQ01.toFixed(4)} °C** and **${observedQ998.toFixed(4)} °C**.
- Applying the author's strict interior trim to the central response curve gives a minimum-mortality temperature of **${minimumMortalityTemperature} °C**. The untrimmed integer-grid result was ${pooledModel.model.fit.minimumMortalityTemperatureOnIntegerMinus50To50Grid} °C.
- **${matchedDailyRows.toLocaleString('en-US')}** daily rows match the 971-region weekly mortality panel. The hot and cold estimates use the same 100 full-rank spatial bootstrap fits already reproduced in Python and base R.
- The one-degree person-day calculation matches **${matchedTemperatureBinRows.toLocaleString('en-US')}** weekly bin rows and applies the author's midpoint-to-ceiling conversion.
- The daily file is ordered by region and calendar date, with zero duplicate region-date rows. **${(dailyRowsPerPanelWeekHistogram[8] ?? 0).toLocaleString('en-US')}** matched response weeks contain eight daily rows and **${(dailyRowsPerPanelWeekHistogram[9] ?? 0).toLocaleString('en-US')}** contain nine; this comes from the source's year/week assignment rather than duplicate dates, and the reproduction preserves the author's grouping exactly.

## Reproduced pooled factual-temperature estimates

| Quantity | Average annual estimate | 2.5% bootstrap | 97.5% bootstrap | Share of observed deaths |
| --- | ---: | ---: | ---: | ---: |
| Hot-temperature mortality | ${hot.mean.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${hot.q025.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${hot.q975.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${(hot.mean / hot.totalDeaths * 100).toFixed(3)}% |
| Cold-temperature mortality | ${cold.mean.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${cold.q025.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${cold.q975.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${(cold.mean / cold.totalDeaths * 100).toFixed(3)}% |
| Hot + cold daily calculation | ${averageAnnualTotal.mean.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${averageAnnualTotal.q025.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${averageAnnualTotal.q975.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${(averageAnnualTotal.shareOfObservedDeaths * 100).toFixed(3)}% |
| One-degree person-day approximation | ${personDayTotal.mean.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${personDayTotal.q025.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${personDayTotal.q975.toLocaleString('en-US', { maximumFractionDigits: 1 })} | ${(personDayTotal.shareOfObservedDeaths * 100).toFixed(3)}% |

These are factual-temperature response estimates for the public European panel. They are not deaths attributed to a particular TULIP node. The bootstrap interval covers spatial resampling of the fitted model; it does not cover all data, specification, source-removal-climate or transfer uncertainty.

## Admission decision

No human or ecosystem axis changes. No TULIP score changes. The human gate now requires matched local source-removal temperatures through this same endpoint, ideally an author-output comparison, and the source nodes still require a separate ecosystem endpoint.
`;
await writeFile(outputReport, report);

console.log(JSON.stringify({
  outputJson,
  outputReport,
  status: payload.status,
  minimumMortalityTemperatureC: minimumMortalityTemperature,
  matchedDailyRows,
  matchedTemperatureBinRows,
  matchedTemperatureBinDays,
  averageAnnualTotal,
  personDayTotal,
  axesAdmitted: 0,
  scoresChanged: 0,
  digest: payload.digest,
}, null, 2));
