import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calibrationDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const readJson = async filename => JSON.parse(await readFile(path.join(calibrationDir, filename), 'utf8'));
const [reference, allocation, edgar, ceds, cedsIndustrialHeat, cementKilnFuel, ember, faostat, faostatForests] = await Promise.all([
  readJson('jones-national-warming-reference-snapshot.json'),
  readJson('internal-emission-source-allocation.json'),
  JSON.parse(await readFile(path.join(root, 'public', 'edgar-snapshot.json'), 'utf8')),
  JSON.parse(await readFile(path.join(root, 'public', 'ceds-sector-fuel-co2-snapshot.json'), 'utf8')),
  readJson('ceds-industrial-heat-reference-snapshot.json'),
  readJson('cement-kiln-fuel-reference-snapshot.json'),
  JSON.parse(await readFile(path.join(root, 'public', 'ember-global-power-snapshot.json'), 'utf8')),
  JSON.parse(await readFile(path.join(root, 'public', 'faostat-agriculture-snapshot.json'), 'utf8')),
  readJson('faostat-forest-conversion-reference-snapshot.json'),
]);
const outputJson = path.join(calibrationDir, 'internal-emissions-to-warming-validation.json');
const outputReport = path.join(calibrationDir, 'internal-emissions-to-warming-validation-report.md');
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const round = (value, digits = 6) => Number(value.toFixed(digits));

assert.equal(reference.validation.result, 'published_gmst_rows_reproduced');
assert(reference.validation.maxAbsoluteReproductionErrorC < 1e-12);
const eligibleNodeIds = allocation.rows.filter(row => row.physicalScreening).map(row => row.nodeId).sort();
assert.equal(eligibleNodeIds.length, 20);

function annualCo2History(nodeId) {
  const edgarRows = edgar.global_time_series
    .filter(record => record.node_id === nodeId && record.substance === 'CO2')
    .sort((left, right) => left.observation_year - right.observation_year);
  if (edgarRows.length) return {
    sourceId: edgar.source.id,
    sourceVersion: edgar.version,
    sourceBoundary: 'EDGAR fossil CO2 category',
    records: edgarRows.map(record => ({ year: record.observation_year, annualMtCO2: record.emission_gg_substance / 1000 })),
  };
  const cedsMetric = ceds.metrics[nodeId];
  if (cedsMetric) return {
    sourceId: ceds.source.id,
    sourceVersion: ceds.version,
    sourceBoundary: 'CEDS source-native sector and fuel CO2',
    records: cedsMetric.observations.map(record => ({ year: record.year, annualMtCO2: record.value_kt_co2 / 1000 })),
  };
  const cedsIndustrialHeatMetric = cedsIndustrialHeat.metrics[nodeId];
  if (cedsIndustrialHeatMetric) return {
    sourceId: cedsIndustrialHeat.source.id,
    sourceVersion: cedsIndustrialHeat.version,
    sourceBoundary: 'CEDS source-native stationary industrial-combustion sector and fuel CO2',
    records: cedsIndustrialHeatMetric.observations.map(record => ({ year: record.year, annualMtCO2: record.valueKtCO2 / 1000 })),
  };
  if (nodeId === 'cement_kiln_fuel_co2') return {
    sourceId: 'ceds_v2024_04_01_release_emission_data_reconstructed_cement_kiln',
    sourceVersion: cementKilnFuel.version,
    sourceBoundary: 'CEDS non-metallic-minerals fossil combustion reconstructed with a constant 2019 cement allocation factor',
    records: cementKilnFuel.metric.observations.map(record => ({
      year: record.year,
      annualMtCO2: record.reconstructedCementKilnFuelKtCO2 / 1000,
    })),
  };
  const emberRows = ember.records
    .filter(record => record.node_id === nodeId)
    .sort((left, right) => left.observation_year - right.observation_year);
  if (emberRows.length) return {
    sourceId: ember.source.id,
    sourceVersion: ember.version,
    sourceBoundary: 'Ember source-reported lifecycle power CO2',
    records: emberRows.map(record => ({ year: record.observation_year, annualMtCO2: record.value })),
  };
  if (nodeId === 'peatland_drainage_co2') {
    const rows = faostat.records
      .filter(record => record.metric_id === 'drained_peat_co2_flux'
        && record.area === 'World'
        && record.component === 'agricultural_drained_organic_soil_total_co2')
      .sort((left, right) => left.year - right.year);
    return {
      sourceId: faostat.source.id,
      sourceVersion: faostat.version,
      sourceBoundary: 'FAOSTAT Tier 1 agricultural drained-organic-soil CO2',
      records: rows.map(record => ({ year: record.year, annualMtCO2: record.value / 1000 })),
    };
  }
  if (nodeId === 'deforestation_co2_release') return {
    sourceId: faostatForests.source.id,
    sourceVersion: faostatForests.version,
    sourceBoundary: 'FAOSTAT Tier 1 partial net forest conversion CO2 from living biomass',
    records: faostatForests.metric.observations.map(record => ({ year: record.year, annualMtCO2: record.valueKtCO2 / 1000 })),
  };
  throw new Error(`${nodeId}: no annual CO2 history`);
}

const coefficient = reference.method.gmstCPerPgCO2e;
const results = eligibleNodeIds.map(nodeId => {
  const row = allocation.rows.find(candidate => candidate.nodeId === nodeId);
  assert(row?.physicalScreening, `${nodeId}: missing physical screening`);
  const history = annualCo2History(nodeId);
  const annualInventory = history.records;
  assert(annualInventory.length >= 25, `${nodeId}: expected at least 25 annual records`);
  assert.equal(annualInventory[0].year, row.physicalScreening.recordStartYear);
  assert.equal(annualInventory.at(-1).year, row.physicalScreening.recordEndYear);
  let cumulativeGtCO2Running = 0;
  const annualGmstScreen = annualInventory.map(record => {
    const annualGtCO2 = record.annualMtCO2 / 1000;
    cumulativeGtCO2Running += annualGtCO2;
    return {
      year: record.year,
      annualMtCO2: round(record.annualMtCO2, 6),
      cumulativeGtCO2: round(cumulativeGtCO2Running, 9),
      annualGmstIncrementC: round(annualGtCO2 * coefficient, 9),
      cumulativeGmstBestC: round(cumulativeGtCO2Running * coefficient, 9),
      cumulativeGmstLowerC: round(cumulativeGtCO2Running * allocation.constants.tcre.likelyLowerCPer1000GtCO2 / 1000, 9),
      cumulativeGmstUpperC: round(cumulativeGtCO2Running * allocation.constants.tcre.likelyUpperCPer1000GtCO2 / 1000, 9),
    };
  });
  const cumulativeGtCO2 = row.physicalScreening.cumulativeGtCO2;
  const reproducedMethodBestC = cumulativeGtCO2 * coefficient;
  const roundedIpccBestC = cumulativeGtCO2 * allocation.constants.tcre.bestEstimateCPer1000GtCO2 / 1000;
  assert(Math.abs(cumulativeGtCO2Running - cumulativeGtCO2) < 0.001, `${nodeId}: annual history does not reproduce cumulative total`);
  assert(Math.abs(annualGmstScreen.at(-1).cumulativeGmstBestC - reproducedMethodBestC) < 1e-6,
    `${nodeId}: annual GMST history does not reproduce the 2024 result`);
  assert(annualGmstScreen.every((entry, index) => index === 0
    || entry.cumulativeGtCO2 >= annualGmstScreen[index - 1].cumulativeGtCO2));
  return {
    nodeId,
    name: row.name,
    history: {
      startYear: row.physicalScreening.recordStartYear,
      endYear: row.physicalScreening.recordEndYear,
      cumulativeGtCO2,
      boundaryNote: row.physicalScreening.boundaryNote,
      sourceId: history.sourceId,
      sourceVersion: history.sourceVersion,
      sourceBoundary: history.sourceBoundary,
    },
    attributableGmstScreenC: {
      lower: row.physicalScreening.estimatedWarmingContributionC.lower,
      bestPublishedMethod: round(reproducedMethodBestC, 6),
      bestRoundedIpccTcre: round(roundedIpccBestC, 6),
      upper: row.physicalScreening.estimatedWarmingContributionC.upper,
      differenceBetweenBestMethodsC: round(Math.abs(reproducedMethodBestC - roundedIpccBestC), 8),
    },
    annualGmstScreen: {
      status: 'validated_partial_source_history_time_series',
      firstYear: annualGmstScreen[0].year,
      lastYear: annualGmstScreen.at(-1).year,
      records: annualGmstScreen,
      interpretation: `Each year is the cumulative CO2-only GMST screening contribution within the declared ${history.sourceBoundary} record. It is not a local temperature series or terminal harm.`,
    },
    physicalAttributionStatus: 'published_arithmetic_reproduced_partial_source_history',
    terminalHarmStatus: 'not_modelled',
    scoreEffect: 'none_candidate_value_and_grade_unchanged',
    confidenceEffect: 'physical_step_strengthened_overall_tulip_confidence_unchanged_until_terminal_endpoints',
  };
});

assert(results.every(result => result.attributableGmstScreenC.differenceBetweenBestMethodsC < 0.0001));
const global2024 = reference.records.filter(record => record.year === 2024 && record.component === 'Total');
const referenceChecks = Object.fromEntries(global2024.map(record => [record.gas, {
  cumulativePgCO2eSourceMethod: record.cumulativePgCO2eSourceMethod,
  gmstResponseCSourceReported: record.gmstResponseCSourceReported,
  gmstResponseCRecomputed: record.gmstResponseCRecomputed,
  absoluteReproductionErrorC: record.absoluteReproductionErrorC,
} ]));

const payload = {
  version: 'tulip_internal_emissions_to_warming_validation_2026_09_23_v6',
  preparedOn: '2026-09-23',
  status: 'all_available_annual_co2_physical_attribution_series_validated_terminal_endpoints_pending',
  referenceDigest: reference.digest,
  allocationDigest: allocation.digest,
  method: {
    equation: reference.method.equation,
    coefficientCPerGtCO2: coefficient,
    interpretation: 'For CO2-only histories, removing the source history in this linear screening changes GMST by the reported contribution. This is a physical attribution intermediate.',
    currentHarmBoundary: 'The result is not current observed harm and is never mapped directly to a TULIP axis or band.',
    omittedEffects: 'Non-CO2 co-emissions, aerosols, contrails, land-surface effects, avoided replacement emissions and local climate patterns are outside this CO2-only screen.',
  },
  validation: {
    referenceRecords: reference.validation.recordCount,
    referencePeriod: `${reference.validation.firstYear}-${reference.validation.lastYear}`,
    maximumReproductionErrorC: reference.validation.maxAbsoluteReproductionErrorC,
    global2024ReferenceChecks: referenceChecks,
    sourceHistoriesValidated: results.length,
    annualRecordsValidated: results.reduce((sum, result) => sum + result.annualGmstScreen.records.length, 0),
    historyPeriods: Object.fromEntries(results.map(result => [result.nodeId, `${result.history.startYear}-${result.history.endYear}`])),
    annualSeriesEndingAtValidatedCumulativeTotal: results.filter(result => Math.abs(
      result.annualGmstScreen.records.at(-1).cumulativeGmstBestC
      - result.attributableGmstScreenC.bestPublishedMethod) < 1e-6).length,
    sourceHistoriesWithTerminalEndpointModel: 0,
  },
  results,
};
payload.digest = digest({ method: payload.method, validation: payload.validation, results });

const report = `# TULIP emissions-to-warming validation

Status: **All twenty currently available annual CO₂ histories reproduced; human and ecosystem endpoint calibration remains pending.** No TULIP value, letter or confidence grade changed.

## Reproduction result

- ${reference.validation.recordCount} published global reference rows covering ${reference.validation.firstYear}-${reference.validation.lastYear} were reproduced.
- Maximum absolute difference from the published GMST output: ${reference.validation.maxAbsoluteReproductionErrorC} C.
- ${results.length} compatible TULIP CO₂-source histories now use the reproduced physical method as explicitly partial source-removal screens.
- Their ${payload.validation.annualRecordsValidated} annual records cover source-specific periods from 1750–2022, 1970–2024, 1970–2022, 2000–2025, 1990–2024 or 1990–2025; every series reproduces its separately checked cumulative total.
- None of those histories has yet passed a matched terminal human or ecosystem endpoint gate.

The published implementation converts cumulative CO₂-equivalent mass to GMST using \`${reference.method.equation}\`. Applied to CO₂-only histories, this is equivalent to TULIP’s IPCC TCRE screening apart from the published implementation retaining the exact 1.65/3.664 conversion. The largest difference is below 0.0001 C.

## Validated results

| Node | Source boundary | Record | Annual points | Cumulative CO₂ | Reproduced best GMST screen | TULIP score effect |
| --- | --- | --- | ---: | ---: | ---: | --- |
${results.map(result => `| ${result.name} | ${result.history.sourceBoundary} | ${result.history.startYear}-${result.history.endYear} | ${result.annualGmstScreen.records.length} | ${result.history.cumulativeGtCO2} Gt | ${result.attributableGmstScreenC.bestPublishedMethod} C | None |`).join('\n')}

## What this resolves

The emissions-to-warming arithmetic is independently reproducible against the published reference method. The nine EDGAR histories are joined by four CEDS building and power histories, two CEDS industrial-heat histories, the reconstructed CEDS cement-kiln fuel sensitivity, two Ember power histories, the FAOSTAT agricultural drained-soil history and the partial FAOSTAT net-forest-conversion history. Each now supplies an annual physical response screen rather than only a latest-year value.

## Boundaries retained

- EDGAR and the building and power CEDS extracts begin in 1970, so earlier emissions are absent. The industrial-heat CEDS extracts begin in 1750 but end in 2022 and do not report observation-level uncertainty.
- The cement-kiln series is reconstructed from the wider CEDS non-metallic-minerals sector by holding the published approximate 2019 cement share constant through history. It is a sensitivity input rather than an observed cement-only record.
- Ember begins in 2000 and reports lifecycle power emissions, requiring scope reconciliation with direct-combustion inventories.
- FAOSTAT begins in 1990 and covers Tier 1 agricultural drained organic soils, excluding fire and non-agricultural drainage.
- The separate FAOSTAT forest-conversion series begins in 1990, is source-flagged estimated throughout and covers living biomass only. It excludes other land pools and overlapping fire, peat and wider land-use sources.
- A global CO₂ response is not a regional weekly temperature history or terminal harm estimate.

The next stage must translate each source-removal global response through validated regional hazard patterns, then evaluate matched terminal endpoints with uncertainty. A temperature contribution still does not state how many people were harmed, how much ecosystem condition was lost, how widespread the consequence was or how long recovery takes.

## Sources

- [Jones et al. national warming contributions dataset](https://doi.org/10.5281/zenodo.16640595), version ${reference.source.version}, ${reference.source.license}.
- [Jones et al. method paper](https://www.nature.com/articles/s41597-023-02041-1).
- [Accompanying source code](${reference.method.sourceCodeUrl}), commit \`${reference.method.sourceCodeCommit}\`.
`

await Promise.all([
  writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(outputReport, report),
]);
console.log(JSON.stringify({ outputJson, outputReport, status: payload.status, validation: payload.validation, digest: payload.digest }, null, 2));
