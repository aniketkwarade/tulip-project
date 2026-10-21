import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  decodeParquetColumn,
  decodeParquetColumnRowGroup,
} from './lib/parquet-range-column-reader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const inputPath = name => path.join(artifactDir, name);
const outputJson = inputPath('europe-temperature-mortality-source-removal-endpoint.json');
const outputReport = inputPath('europe-temperature-mortality-source-removal-endpoint-report.md');
const VERSION = 'tulip_europe_temperature_mortality_source_removal_endpoint_2026_09_26_v1';
const YEARS = Array.from({ length: 23 }, (_, index) => 2000 + index);
const RECENT_YEARS = YEARS.filter(year => year >= 2015);
const EXPECTED_REGIONS = 971;
const EXPECTED_SOURCES = 21;
const BOOTSTRAPS = 100;

const json = async name => JSON.parse(await readFile(inputPath(name), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

function type7QuantileSorted(sorted, probability) {
  assert(sorted.length > 0, 'Cannot calculate a quantile of an empty collection');
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  if (!fraction) return sorted[lower];
  return sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
}

export function summarize(values) {
  assert(values.length > 0 && values.every(Number.isFinite), 'Endpoint summary contains a non-finite value');
  const sorted = [...values].sort((left, right) => left - right);
  return {
    q025: type7QuantileSorted(sorted, 0.025),
    median: type7QuantileSorted(sorted, 0.5),
    q975: type7QuantileSorted(sorted, 0.975),
    mean: mean(values),
  };
}

export function sourceRemovalDifferenceMoments(statistics, shiftC) {
  assert.equal(statistics.length, 4);
  assert(statistics.every(Number.isFinite) && Number.isFinite(shiftC));
  const [personDays, weightedT, weightedT2, weightedT3] = statistics;
  const shift2 = shiftC ** 2;
  const shift3 = shiftC ** 3;
  const shift4 = shiftC ** 4;
  return [
    personDays * shiftC,
    2 * shiftC * weightedT - shift2 * personDays,
    3 * shiftC * weightedT2 - 3 * shift2 * weightedT + shift3 * personDays,
    4 * shiftC * weightedT3 - 6 * shift2 * weightedT2 + 4 * shift3 * weightedT - shift4 * personDays,
  ];
}

export function applyCumulativeCoefficients(moments, coefficients) {
  assert.equal(moments.length, 4);
  assert.equal(coefficients.length, 4);
  return moments.reduce((total, value, index) => total + value * coefficients[index], 0);
}

function panelKey(regionIndex, year, week) {
  return regionIndex * 1_000_000 + year * 100 + week;
}

function exactInteger(value, label) {
  assert(Number.isInteger(value), `${label} is not an integer: ${value}`);
  return value;
}

function physicalSources(co2, methane) {
  const sources = co2.results.map(row => {
    const byYear = new Map(row.annualGmstScreen.records.map(record => [record.year, record]));
    return {
      nodeId: row.nodeId,
      name: row.name,
      gas: 'CO2',
      physicalResponseBasis: 'partial_cumulative_co2_tcre_screen',
      boundary: row.history.boundaryNote,
      firstYear: row.annualGmstScreen.firstYear,
      lastYear: row.annualGmstScreen.lastYear,
      cases: {
        lower: new Map([...byYear].map(([year, record]) => [year, record.cumulativeGmstLowerC])),
        best: new Map([...byYear].map(([year, record]) => [year, record.cumulativeGmstBestC])),
        upper: new Map([...byYear].map(([year, record]) => [year, record.cumulativeGmstUpperC])),
      },
    };
  });
  const methaneRow = methane.results.find(row => row.nodeId === 'rice_paddy_methane_bubbles');
  assert(methaneRow?.calculation?.records, 'Rice-methane physical response is missing');
  const methaneByYear = new Map(methaneRow.calculation.records.map(record => [record.year, record]));
  sources.push({
    nodeId: methaneRow.nodeId,
    name: methaneRow.name,
    gas: 'CH4',
    physicalResponseBasis: 'path_dependent_methane_gwp_star_response_since_1991',
    boundary: `${methaneRow.sourceBoundary} ${methaneRow.referenceBasis.interpretation}`,
    firstYear: methaneRow.calculation.inputPeriod.start,
    lastYear: methaneRow.calculation.inputPeriod.end,
    cases: {
      lower: new Map([...methaneByYear].map(([year, record]) => [year, record.gmstResponseC.lower])),
      best: new Map([...methaneByYear].map(([year, record]) => [year, record.gmstResponseC.best])),
      upper: new Map([...methaneByYear].map(([year, record]) => [year, record.gmstResponseC.upper])),
    },
  });
  sources.sort((left, right) => left.nodeId.localeCompare(right.nodeId));
  assert.equal(sources.length, EXPECTED_SOURCES);
  assert.equal(new Set(sources.map(row => row.nodeId)).size, EXPECTED_SOURCES);
  for (const source of sources) {
    for (const [caseName, values] of Object.entries(source.cases)) {
      assert.deepEqual(
        YEARS.filter(year => !values.has(year)),
        [],
        `${source.nodeId} ${caseName} does not cover every endpoint year`,
      );
      assert(YEARS.every(year => Number.isFinite(values.get(year))), `${source.nodeId} ${caseName} has a non-finite response`);
    }
  }
  return sources;
}

async function sufficientStatistics(bridge, pattern) {
  const fullPanel = bridge.parquet.fullPanel;
  const dailyTemperature = bridge.parquet.dailyTemperature;
  const [panelRegions, panelYearsRaw, panelWeeksRaw, panelPopulation, panelDeaths] = await Promise.all([
    decodeParquetColumn(fullPanel, 'adm_id'),
    decodeParquetColumn(fullPanel, 'year'),
    decodeParquetColumn(fullPanel, 'week'),
    decodeParquetColumn(fullPanel, 'pop_all'),
    decodeParquetColumn(fullPanel, 'n_deaths_all'),
  ]);
  const regionDictionary = [...new Set(panelRegions)].sort();
  assert.equal(regionDictionary.length, EXPECTED_REGIONS);
  const regionIndexById = new Map(regionDictionary.map((region, index) => [region, index]));
  const patternByRegion = new Map(pattern.regions.map(row => [row.region, row.full.slope]));
  assert.deepEqual([...patternByRegion.keys()].sort(), regionDictionary, 'Pattern and endpoint region universes differ');
  const yearIndexByYear = new Map(YEARS.map((year, index) => [year, index]));
  const panelIndexByKey = new Map();
  const annualObservedDeaths = new Float64Array(YEARS.length);
  for (let index = 0; index < panelRegions.length; index += 1) {
    const year = exactInteger(panelYearsRaw[index], 'fullPanel.year');
    const week = exactInteger(panelWeeksRaw[index], 'fullPanel.week');
    const yearIndex = yearIndexByYear.get(year);
    if (yearIndex === undefined) continue;
    const regionIndex = regionIndexById.get(panelRegions[index]);
    const key = panelKey(regionIndex, year, week);
    assert(!panelIndexByKey.has(key), `Duplicate response-panel key ${panelRegions[index]} ${year} ${week}`);
    panelIndexByKey.set(key, index);
    annualObservedDeaths[yearIndex] += panelDeaths[index];
  }

  // Per region-year: population-weighted [1, T, T², T³]. These are sufficient
  // for the exact fourth-degree response difference under a constant regional shift.
  const moments = new Float64Array(EXPECTED_REGIONS * YEARS.length * 4);
  let matchedDailyRows = 0;
  let unmatchedDailyRows = 0;
  for (let rowGroup = 0; rowGroup < dailyTemperature.rowGroupRows.length; rowGroup += 1) {
    const [regions, yearsRaw, weeksRaw, temperatures] = await Promise.all([
      decodeParquetColumnRowGroup(dailyTemperature, 'adm_id', rowGroup),
      decodeParquetColumnRowGroup(dailyTemperature, 'year', rowGroup),
      decodeParquetColumnRowGroup(dailyTemperature, 'week', rowGroup),
      decodeParquetColumnRowGroup(dailyTemperature, 'temp1', rowGroup),
    ]);
    for (let index = 0; index < regions.length; index += 1) {
      const year = exactInteger(yearsRaw[index], 'dailyTemperature.year');
      const yearIndex = yearIndexByYear.get(year);
      const regionIndex = regionIndexById.get(regions[index]);
      const week = exactInteger(weeksRaw[index], 'dailyTemperature.week');
      const panelIndex = yearIndex === undefined || regionIndex === undefined
        ? undefined
        : panelIndexByKey.get(panelKey(regionIndex, year, week));
      if (panelIndex === undefined) {
        unmatchedDailyRows += 1;
        continue;
      }
      const temperature = temperatures[index];
      const population = panelPopulation[panelIndex];
      assert(Number.isFinite(temperature) && Number.isFinite(population) && population >= 0);
      const base = (regionIndex * YEARS.length + yearIndex) * 4;
      moments[base] += population;
      moments[base + 1] += population * temperature;
      moments[base + 2] += population * temperature ** 2;
      moments[base + 3] += population * temperature ** 3;
      matchedDailyRows += 1;
    }
  }
  assert.equal(matchedDailyRows, 4_454_230);
  assert.equal(matchedDailyRows + unmatchedDailyRows, dailyTemperature.rows);
  return {
    regionDictionary,
    patternSlopes: Float64Array.from(regionDictionary.map(region => patternByRegion.get(region))),
    moments,
    annualObservedDeaths,
    matchedDailyRows,
    unmatchedDailyRows,
  };
}

function windowSummary(annualRows, selectedYears) {
  const selected = annualRows.filter(row => selectedYears.includes(row.year));
  assert.equal(selected.length, selectedYears.length);
  const bootstrapValues = Array.from({ length: BOOTSTRAPS }, (_, iteration) => (
    mean(selected.map(row => row.bootstrap[iteration]))
  ));
  const observedDeaths = mean(selected.map(row => row.observedDeaths));
  const centralEstimate = mean(selected.map(row => row.centralEstimate));
  return {
    firstYear: selectedYears[0],
    lastYear: selectedYears.at(-1),
    years: selectedYears.length,
    annualization: 'mean_annual_source_attributable_deaths',
    centralEstimate,
    bootstrap: summarize(bootstrapValues),
    averageAnnualObservedDeaths: observedDeaths,
    centralShareOfObservedDeaths: centralEstimate / observedDeaths,
  };
}

function analyzePhysicalCase(source, caseName, context, centralCoefficients, bootstrapCoefficients) {
  const annualRows = [];
  for (let yearIndex = 0; yearIndex < YEARS.length; yearIndex += 1) {
    const year = YEARS[yearIndex];
    const gmst = source.cases[caseName].get(year);
    const aggregateMoments = [0, 0, 0, 0];
    for (let regionIndex = 0; regionIndex < EXPECTED_REGIONS; regionIndex += 1) {
      const base = (regionIndex * YEARS.length + yearIndex) * 4;
      const statistics = Array.from(context.moments.subarray(base, base + 4));
      const shiftC = context.patternSlopes[regionIndex] * gmst;
      const difference = sourceRemovalDifferenceMoments(statistics, shiftC);
      for (let degree = 0; degree < 4; degree += 1) aggregateMoments[degree] += difference[degree];
    }
    const bootstrap = bootstrapCoefficients.map(coefficients => (
      applyCumulativeCoefficients(aggregateMoments, coefficients)
    ));
    annualRows.push({
      year,
      sourceGmstResponseC: gmst,
      centralEstimate: applyCumulativeCoefficients(aggregateMoments, centralCoefficients),
      bootstrap,
      bootstrapSummary: summarize(bootstrap),
      observedDeaths: context.annualObservedDeaths[yearIndex],
    });
  }
  const latest = annualRows.at(-1);
  return {
    physicalCase: caseName,
    interpretation: 'A deterministic physical-response case. Its 100-value bootstrap distribution represents epidemiological spatial-resampling uncertainty only.',
    windows: {
      fullObservedPeriod: windowSummary(annualRows, YEARS),
      recentObservedPeriod: windowSummary(annualRows, RECENT_YEARS),
      latestYear: {
        year: latest.year,
        sourceGmstResponseC: latest.sourceGmstResponseC,
        centralEstimate: latest.centralEstimate,
        bootstrap: latest.bootstrapSummary,
        observedDeaths: latest.observedDeaths,
        centralShareOfObservedDeaths: latest.centralEstimate / latest.observedDeaths,
      },
    },
    annual: annualRows.map(({ bootstrap, ...row }) => row),
  };
}

function analyzeSources(sources, context, pooledModel) {
  const centralCoefficients = pooledModel.model.fit.cumulativeTemperatureCoefficients;
  const bootstrapCoefficients = pooledModel.model.bootstrap.cumulativeTemperatureCoefficients;
  assert.equal(centralCoefficients.length, 4);
  assert.equal(bootstrapCoefficients.length, BOOTSTRAPS);
  assert(bootstrapCoefficients.every(row => row.length === 4));
  return sources.map(source => ({
    nodeId: source.nodeId,
    name: source.name,
    gas: source.gas,
    physicalResponseBasis: source.physicalResponseBasis,
    sourceHistoryBoundary: source.boundary,
    sourceHistoryPeriod: [source.firstYear, source.lastYear],
    pattern: 'ERA5-Land 1950–2022 full-period region-specific slopes for ISO weeks 22–35',
    physicalCases: ['lower', 'best', 'upper'].map(caseName => (
      analyzePhysicalCase(source, caseName, context, centralCoefficients, bootstrapCoefficients)
    )),
    admissionDecision: {
      status: 'matched_human_endpoint_complete_ecosystem_endpoint_and_axis_mapping_pending',
      axesAdmitted: 0,
      scoresChanged: 0,
    },
  }));
}

async function run() {
  const [promotion, pattern, attribution, pooledModel, bridge, co2, methane] = await Promise.all([
    json('europe-temperature-mortality-pattern-promotion-decision.json'),
    json('europe-temperature-mortality-long-record-pattern-analysis.json'),
    json('europe-temperature-mortality-attribution-reproduction.json'),
    json('europe-temperature-mortality-pooled-model-reproduction.json'),
    json('europe-temperature-mortality-bridge-reference-snapshot.json'),
    json('internal-emissions-to-warming-validation.json'),
    json('internal-methane-to-warming-validation.json'),
  ]);
  assert.equal(promotion.status, 'regional_pattern_promoted_to_matched_endpoint_input');
  assert.equal(promotion.decision.patternInputAdmittedToMatchedEndpoint, true);
  assert.equal(promotion.inputs.era5PatternDigest, pattern.digest);
  assert.equal(pattern.regions.length, EXPECTED_REGIONS);
  assert.equal(attribution.coverage.responsePanelRegions, EXPECTED_REGIONS);
  assert.equal(attribution.coverage.matchedDailyTemperatureRows, 4_454_230);
  assert.equal(pooledModel.model.bootstrap.iterations, BOOTSTRAPS);
  assert.equal(pooledModel.model.crossRuntimeValidation.status, 'passed_python_numpy_vs_base_r');

  const sources = physicalSources(co2, methane);
  const context = await sufficientStatistics(bridge, pattern);
  const results = analyzeSources(sources, context, pooledModel);
  const payloadWithoutDigest = {
    version: VERSION,
    preparedOn: '2026-09-26',
    status: 'complete_matched_source_removal_human_endpoint_ecosystem_endpoint_pending',
    productionRatingsEnabled: 0,
    purpose: 'Propagate each validated partial source-removal GMST history through the independently admitted regional pattern and the complete reproduced mortality endpoint with all 100 fixed bootstrap fits.',
    inputs: {
      promotionVersion: promotion.version,
      promotionDigest: promotion.digest,
      patternVersion: pattern.version,
      patternDigest: pattern.digest,
      attributionVersion: attribution.version,
      attributionDigest: attribution.digest,
      pooledModelVersion: pooledModel.version,
      pooledModelDigest: pooledModel.digest,
      co2PhysicalVersion: co2.version,
      co2PhysicalDigest: co2.digest,
      methanePhysicalVersion: methane.version,
      methanePhysicalDigest: methane.digest,
    },
    method: {
      factual: 'The checksum-pinned 2000–2022 daily temperatures, weekly all-age population and mortality panel used by the reproduced European endpoint.',
      counterfactual: 'For each source, year and region, subtract the source GMST response multiplied by that region’s independently admitted 1950–2022 ERA5-Land forced-temperature slope.',
      endpoint: 'Evaluate factual-minus-counterfactual fourth-degree temperature response with the same central coefficients and every one of the 100 fixed spatial bootstrap fits.',
      physicalUncertainty: 'Lower, best and upper source-GMST cases remain three deterministic TCRE or GWP* cases; they are not pooled into a probability distribution.',
      epidemiologicalUncertainty: 'Within each physical case, q025 and q975 are empirical type-7 quantiles across the 100 fixed spatial bootstrap fits.',
      patternUncertainty: 'The promotion gate selects the full-period ERA5-Land regional slopes. Region-level slope standard errors remain reported in the pattern artifact and are not mixed into the epidemiological bootstrap.',
      currentEvidenceWindows: 'Report every observed year, the full 2000–2022 mean, the recent 2015–2022 mean and the latest 2022 estimate. These summaries do not replace TULIP axis thresholds.',
    },
    coverage: {
      regions: EXPECTED_REGIONS,
      observedYears: YEARS,
      matchedDailyTemperatureRows: context.matchedDailyRows,
      unmatchedDailyTemperatureRows: context.unmatchedDailyRows,
      sourceNodes: results.length,
      co2SourceNodes: results.filter(row => row.gas === 'CO2').length,
      methaneSourceNodes: results.filter(row => row.gas === 'CH4').length,
      bootstrapFits: BOOTSTRAPS,
      physicalCasesPerSource: 3,
    },
    results,
    decision: {
      status: 'admitted_as_matched_human_endpoint_evidence_only',
      humanEndpointCompleted: true,
      ecosystemEndpointCompleted: false,
      axesAdmitted: 0,
      scoresChanged: 0,
      nextGate: 'Map the matched human endpoint to the fixed severity, reach and persistence anchors without double counting, then complete or structurally exclude a compatible source-specific ecosystem endpoint before changing a rating.',
    },
  };
  const payload = { ...payloadWithoutDigest, digest: sha256(JSON.stringify(payloadWithoutDigest)) };
  await writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`);
  await writeFile(outputReport, `# European temperature–mortality matched source-removal endpoint\n\nStatus: **${payload.status.replaceAll('_', ' ')}**.\n\nThe calculation covers **${payload.coverage.sourceNodes} source nodes**, **${payload.coverage.regions} regions**, **${payload.coverage.observedYears.length} observed years**, three separate physical-response cases and all **${payload.coverage.bootstrapFits}** fixed epidemiological bootstrap fits.\n\nThe regional pattern passed the frozen independent-comparison gate before use. Lower, best and upper physical cases remain separate from the bootstrap interval, so the output does not manufacture one probability distribution from unlike uncertainties.\n\nThis completes a matched human endpoint. It changes zero TULIP axes and zero ratings. A reviewed axis mapping and a compatible ecosystem endpoint or structural exclusion remain required.\n`);
  console.log(JSON.stringify({
    outputJson,
    outputReport,
    status: payload.status,
    coverage: payload.coverage,
    axesAdmitted: 0,
    scoresChanged: 0,
    digest: payload.digest,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(error => {
    console.error(error.stack ?? error);
    process.exitCode = 1;
  });
}

