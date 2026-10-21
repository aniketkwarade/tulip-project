import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decodeParquetColumn, typedArrayBuffer } from './lib/parquet-range-column-reader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const bridgePath = path.join(outDir, 'europe-temperature-mortality-bridge-reference-snapshot.json');
const coveragePath = path.join(outDir, 'europe-temperature-mortality-coverage-enumeration.json');
const checksumPath = path.join(outDir, 'europe-temperature-mortality-full-data-checksums.json');
const outputJson = path.join(outDir, 'europe-temperature-mortality-pooled-model-reproduction.json');
const outputReport = path.join(outDir, 'europe-temperature-mortality-pooled-model-reproduction-report.md');
const pythonRunner = path.join(root, 'scripts', 'reproduce-europe-temperature-mortality-pooled-model.py');
const rRunner = path.join(root, 'scripts', 'reproduce-europe-temperature-mortality-pooled-model-base-r.R');
const rBootstrapSampleGenerator = path.join(root, 'scripts', 'generate-europe-temperature-mortality-bootstrap-samples-base-r.R');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

const [bridge, coverage, checksumAudit] = await Promise.all([
  readFile(bridgePath, 'utf8').then(JSON.parse),
  readFile(coveragePath, 'utf8').then(JSON.parse),
  readFile(checksumPath, 'utf8').then(JSON.parse),
]);
assert.equal(bridge.status, 'candidate_independent_human_endpoint_bridge_not_admitted');
assert.equal(coverage.status, 'exact_public_region_and_year_coverage_enumerated');
assert.equal(bridge.coverageEnumeration.digest, coverage.digest);
assert.equal(bridge.fullDataChecksumAudit.digest, checksumAudit.digest);

const fullPanel = bridge.parquet.fullPanel;
assert.equal(fullPanel.rows, 679_602);
assert.equal(coverage.files.fullPanel.uniqueRegions, 971);
const weatherColumns = [
  'temp_d1_l0',
  'temp_d2_l0',
  'temp_d3_l0',
  'temp_d4_l0',
  'precip_d1_l0',
  'precip_d2_l0',
];
const selectedColumns = ['adm_id', 'year', 'week', 'rate_all', ...weatherColumns];
const typeDescriptor = {
  int32: { suffix: 'i32', dtype: '<i4' },
  float: { suffix: 'f32', dtype: '<f4' },
  double: { suffix: 'f64', dtype: '<f8' },
};

function runPython(metadataPath, resultPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [pythonRunner, metadataPath, resultPath], {
      cwd: root,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Python model runner exited with ${code}`)));
  });
}

function runBaseR(inputDir, resultPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('Rscript', [rRunner, inputDir, resultPath], {
      cwd: root,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Base-R model runner exited with ${code}`)));
  });
}

function generateBootstrapSamples(regions, iterations, resultPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('Rscript', [rBootstrapSampleGenerator, String(regions), String(iterations), resultPath], {
      cwd: root,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Base-R bootstrap sample generator exited with ${code}`)));
  });
}

function parseBaseRResult(content) {
  const metrics = {};
  const coefficients = {};
  const cumulative = [];
  const bootstrapCoefficients = [];
  const bootstrapCumulative = [];
  for (const line of content.trim().split('\n')) {
    const fields = line.split('\t');
    const [kind, name] = fields;
    const rawValue = fields.at(-1);
    const value = Number(rawValue);
    assert(Number.isFinite(value), `Base-R result contains a non-finite value: ${line}`);
    if (kind === 'metric') metrics[name] = value;
    else if (kind === 'coefficient') coefficients[name] = value;
    else if (kind === 'cumulative') cumulative[Number(name) - 1] = value;
    else if (kind === 'bootstrap_coefficient') {
      const iteration = Number(name) - 1;
      const coefficientName = fields[2];
      if (!bootstrapCoefficients[iteration]) bootstrapCoefficients[iteration] = {};
      bootstrapCoefficients[iteration][coefficientName] = value;
    } else if (kind === 'bootstrap_cumulative') {
      const iteration = Number(name) - 1;
      const polynomial = Number(fields[2]) - 1;
      if (!bootstrapCumulative[iteration]) bootstrapCumulative[iteration] = [];
      bootstrapCumulative[iteration][polynomial] = value;
    }
    else throw new Error(`Unknown Base-R result row: ${line}`);
  }
  return { metrics, coefficients, cumulative, bootstrapCoefficients, bootstrapCumulative };
}

const relativeDifference = (left, right, floor = 1e-15) => Math.abs(left - right) / Math.max(Math.abs(left), Math.abs(right), floor);

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'tulip-eu-pooled-model-'));
try {
  const descriptors = {};
  let regionDictionary = null;
  for (const columnName of selectedColumns) {
    process.stderr.write(`decoding ${columnName}\n`);
    const values = await decodeParquetColumn(fullPanel, columnName, {
      userAgent: 'LostPlanet-TULIP/1.0 (+temperature-mortality-pooled-reproduction)',
    });
    if (columnName === 'adm_id') {
      const uniqueRegions = [...new Set(values)].sort();
      assert.equal(uniqueRegions.length, coverage.files.fullPanel.uniqueRegions);
      regionDictionary = uniqueRegions;
      const regionIndexes = new Map(uniqueRegions.map((region, index) => [region, index]));
      const encoded = Int32Array.from(values, value => regionIndexes.get(value));
      const file = `${columnName}.i32`;
      await writeFile(path.join(tempDir, file), typedArrayBuffer(encoded));
      descriptors[columnName] = { file, dtype: '<i4', rows: encoded.length };
      continue;
    }

    const physicalType = fullPanel.columns.find(column => column.path === columnName).physicalType;
    const type = typeDescriptor[physicalType];
    assert(type, `${columnName}: unsupported transient type ${physicalType}`);
    const file = `${columnName}.${type.suffix}`;
    await writeFile(path.join(tempDir, file), typedArrayBuffer(values));
    descriptors[columnName] = { file, dtype: type.dtype, rows: values.length };
  }

  const metadata = {
    rows: fullPanel.rows,
    regionDictionary,
    weatherColumns,
    columns: descriptors,
    bootstrap: {
      file: 'bootstrap_counts.i32',
      dtype: '<i4',
      seed: 12,
      iterations: 100,
      regions: regionDictionary.length,
    },
  };
  const metadataPath = path.join(tempDir, 'metadata.json');
  const resultPath = path.join(tempDir, 'result.json');
  const rResultPath = path.join(tempDir, 'base-r-result.tsv');
  await generateBootstrapSamples(regionDictionary.length, metadata.bootstrap.iterations, path.join(tempDir, metadata.bootstrap.file));
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  await runPython(metadataPath, resultPath);
  const model = JSON.parse(await readFile(resultPath, 'utf8'));
  await runBaseR(tempDir, rResultPath);
  const rResult = parseBaseRResult(await readFile(rResultPath, 'utf8'));

  assert.equal(model.status, 'central_pooled_model_internally_reproduced_not_independently_validated');
  assert.equal(model.panel.inputRows, fullPanel.rows);
  assert.equal(model.panel.regions, coverage.files.fullPanel.uniqueRegions);
  assert.equal(model.panel.rowsDroppedForLags, model.panel.regions * 3);
  assert.equal(model.panel.duplicateRegionYearWeekRows, 0);
  assert.equal(model.fit.rank, 24);
  assert.equal(model.fit.columns, 24);
  assert(model.residualization.maximumRegionYearMean < 1e-9);
  assert(model.residualization.maximumRegionWeekMean < 1e-9);

  const metricComparisons = {
    inputRows: [model.panel.inputRows, rResult.metrics.input_rows],
    modelRows: [model.panel.modelRows, rResult.metrics.model_rows],
    regions: [model.panel.regions, rResult.metrics.regions],
    regionYearGroups: [model.panel.regionYearFixedEffectGroups, rResult.metrics.region_year_groups],
    regionWeekGroups: [model.panel.regionWeekFixedEffectGroups, rResult.metrics.region_week_groups],
    duplicateRegionYearWeekRows: [model.panel.duplicateRegionYearWeekRows, rResult.metrics.duplicate_region_year_week_rows],
    winsorizedRows: [model.winsorization.rowsCapped, rResult.metrics.winsorized_rows],
    rank: [model.fit.rank, rResult.metrics.rank],
    minimumMortalityTemperature: [model.fit.minimumMortalityTemperatureOnIntegerMinus50To50Grid, rResult.metrics.minimum_mortality_temperature],
  };
  for (const [name, [pythonValue, rValue]] of Object.entries(metricComparisons)) {
    assert.equal(rValue, pythonValue, `${name}: Python/Base-R mismatch`);
  }
  assert(relativeDifference(model.winsorization.threshold, rResult.metrics.winsor_threshold) < 1e-13, 'winsor threshold Python/Base-R mismatch');
  const coefficientComparisons = model.fit.coefficientNames.map((name, index) => {
    assert(Object.hasOwn(rResult.coefficients, name), `Base-R coefficient missing: ${name}`);
    const pythonValue = model.fit.coefficients[index];
    const rValue = rResult.coefficients[name];
    return { name, pythonValue, rValue, relativeDifference: relativeDifference(pythonValue, rValue) };
  });
  const cumulativeComparisons = model.fit.cumulativeTemperatureCoefficients.map((pythonValue, index) => ({
    polynomial: index + 1,
    pythonValue,
    rValue: rResult.cumulative[index],
    relativeDifference: relativeDifference(pythonValue, rResult.cumulative[index]),
  }));
  const maximumCoefficientRelativeDifference = Math.max(...coefficientComparisons.map(item => item.relativeDifference));
  const maximumCumulativeRelativeDifference = Math.max(...cumulativeComparisons.map(item => item.relativeDifference));
  assert.equal(rResult.bootstrapCoefficients.length, model.bootstrap.iterations);
  assert.equal(rResult.bootstrapCumulative.length, model.bootstrap.iterations);
  const bootstrapCoefficientComparisons = model.bootstrap.coefficients.flatMap((pythonRow, iteration) => (
    model.fit.coefficientNames.map((name, index) => {
      assert(Object.hasOwn(rResult.bootstrapCoefficients[iteration], name), `Base-R bootstrap coefficient missing: ${iteration + 1}.${name}`);
      const rValue = rResult.bootstrapCoefficients[iteration][name];
      return { iteration: iteration + 1, name, pythonValue: pythonRow[index], rValue, relativeDifference: relativeDifference(pythonRow[index], rValue) };
    })
  ));
  const bootstrapCumulativeComparisons = model.bootstrap.cumulativeTemperatureCoefficients.flatMap((pythonRow, iteration) => (
    pythonRow.map((pythonValue, polynomial) => {
      const rValue = rResult.bootstrapCumulative[iteration][polynomial];
      return { iteration: iteration + 1, polynomial: polynomial + 1, pythonValue, rValue, relativeDifference: relativeDifference(pythonValue, rValue) };
    })
  ));
  const maximumBootstrapCoefficientRelativeDifference = Math.max(...bootstrapCoefficientComparisons.map(item => item.relativeDifference));
  const maximumBootstrapCumulativeRelativeDifference = Math.max(...bootstrapCumulativeComparisons.map(item => item.relativeDifference));
  assert(maximumCoefficientRelativeDifference < 1e-5, 'Python/Base-R coefficient cross-check exceeded tolerance');
  assert(maximumCumulativeRelativeDifference < 1e-6, 'Python/Base-R cumulative coefficient cross-check exceeded tolerance');
  assert(maximumBootstrapCoefficientRelativeDifference < 1e-5, 'Python/Base-R bootstrap coefficient cross-check exceeded tolerance');
  assert(maximumBootstrapCumulativeRelativeDifference < 1e-5, 'Python/Base-R bootstrap cumulative coefficient cross-check exceeded tolerance');
  model.crossRuntimeValidation = {
    status: 'passed_python_numpy_vs_base_r',
    baseRScript: 'scripts/reproduce-europe-temperature-mortality-pooled-model-base-r.R',
    baseRScriptSha256: sha256(await readFile(rRunner)),
    baseRVersion: (await new Promise((resolve, reject) => {
      const child = spawn('Rscript', ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '';
      child.stdout.on('data', chunk => { output += chunk; });
      child.stderr.on('data', chunk => { output += chunk; });
      child.once('error', reject);
      child.once('exit', code => code === 0 ? resolve(output.trim()) : reject(new Error(`Rscript --version exited with ${code}`)));
    })),
    metricComparisons,
    winsorThresholdRelativeDifference: relativeDifference(model.winsorization.threshold, rResult.metrics.winsor_threshold),
    maximumCoefficientRelativeDifference,
    maximumCumulativeRelativeDifference,
    maximumBootstrapCoefficientRelativeDifference,
    maximumBootstrapCumulativeRelativeDifference,
    coefficientComparisons,
    cumulativeComparisons,
    bootstrapCoefficientComparisons,
    bootstrapCumulativeComparisons,
  };

  const payload = {
    version: 'tulip_europe_temperature_mortality_pooled_model_reproduction_2026_09_25_v3',
    checkedOn: '2026-09-25',
    status: model.status,
    productionRatingsEnabled: 0,
    inputs: {
      bridgeVersion: bridge.version,
      repository: bridge.repository,
      fullPanelCompleteFileSha256: checksumAudit.files.fullPanel.sha256,
      coverageVersion: coverage.version,
      coverageDigest: coverage.digest,
      modelScript: {
        path: 'scripts/reproduce-europe-temperature-mortality-pooled-model.py',
        sha256: sha256(await readFile(pythonRunner)),
      },
      baseRModelScript: {
        path: 'scripts/reproduce-europe-temperature-mortality-pooled-model-base-r.R',
        sha256: sha256(await readFile(rRunner)),
      },
      baseRBootstrapSampleGenerator: {
        path: 'scripts/generate-europe-temperature-mortality-bootstrap-samples-base-r.R',
        sha256: sha256(await readFile(rBootstrapSampleGenerator)),
      },
      extractorScript: {
        path: 'scripts/reproduce-europe-temperature-mortality-pooled-model.mjs',
        sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
      },
    },
    model,
    admissionDecision: {
      axesAdmitted: 0,
      scoresChanged: 0,
      reason: 'Two independent local implementations agree on the central pooled specification and all 100 seeded spatial-unit bootstrap fits, but the authors publish no reference coefficients or processed outputs at the pinned commit. Temperature-bin mortality attribution, matched source-removal temperatures and an ecosystem endpoint are still absent.',
      nextGate: 'Reproduce the daily-temperature and person-day-bin mortality attribution, preferably compare coefficients with an author-generated reference, then run matched source-removal temperatures through the validated model with propagated bootstrap uncertainty. Do not admit a human axis until those comparisons pass; require a separate ecosystem endpoint.',
    },
  };
  payload.digest = digest({ inputs: payload.inputs, model: payload.model, admissionDecision: payload.admissionDecision });

  const cumulativeRows = payload.model.fit.cumulativeTemperatureCoefficients
    .map((value, index) => `| Temperature polynomial ${index + 1} | ${value.toExponential(12)} |`)
    .join('\n');
  const report = `# European temperature–mortality pooled-model reproduction

Status: **the central pooled European specification runs on the exact public panel without installing additional software**.

This is an internal mathematical reproduction. It is not independent validation because the pinned author repository provides code but no reference coefficients or processed outputs for exact comparison.

The author repository also does not pin contributed R-package versions. The pinned script calls \`collapse::fnth\` without overriding its documented type-7 quantile default; both local implementations use that same type-7 rule and agree exactly on the resulting winsor threshold.

| Check | Result |
| --- | ---: |
| Input rows | ${payload.model.panel.inputRows.toLocaleString('en-US')} |
| Model rows after three required lags | ${payload.model.panel.modelRows.toLocaleString('en-US')} |
| Regions | ${payload.model.panel.regions.toLocaleString('en-US')} |
| Region × year fixed effects | ${payload.model.panel.regionYearFixedEffectGroups.toLocaleString('en-US')} |
| Region × week fixed effects | ${payload.model.panel.regionWeekFixedEffectGroups.toLocaleString('en-US')} |
| Winsorized rows | ${payload.model.winsorization.rowsCapped.toLocaleString('en-US')} |
| Fixed-effect iterations | ${payload.model.residualization.iterations} |
| Model rank | ${payload.model.fit.rank} / ${payload.model.fit.columns} |
| Scaled design condition number | ${payload.model.fit.conditionNumberScaledResidualDesign.toFixed(3)} |
| Python vs base-R maximum coefficient difference | ${(payload.model.crossRuntimeValidation.maximumCoefficientRelativeDifference * 100).toExponential(3)}% |
| Python vs base-R maximum cumulative difference | ${(payload.model.crossRuntimeValidation.maximumCumulativeRelativeDifference * 100).toExponential(3)}% |
| Seeded spatial bootstrap fits | ${payload.model.bootstrap.iterations} |
| Python vs base-R maximum bootstrap coefficient difference | ${(payload.model.crossRuntimeValidation.maximumBootstrapCoefficientRelativeDifference * 100).toExponential(3)}% |
| Python vs base-R maximum bootstrap cumulative difference | ${(payload.model.crossRuntimeValidation.maximumBootstrapCumulativeRelativeDifference * 100).toExponential(3)}% |

| Cumulative coefficient | Value |
| --- | ---: |
${cumulativeRows}

No TULIP axis or score changes. ${payload.admissionDecision.nextGate}
`;

  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`),
    writeFile(outputReport, report),
  ]);
  console.log(JSON.stringify({
    outputJson,
    outputReport,
    status: payload.status,
    panel: payload.model.panel,
    fit: {
      rank: payload.model.fit.rank,
      columns: payload.model.fit.columns,
      coefficientDigest: payload.model.fit.coefficientDigest,
      cumulativeTemperatureCoefficients: payload.model.fit.cumulativeTemperatureCoefficients,
      conditionNumber: payload.model.fit.conditionNumberScaledResidualDesign,
    },
    admissionDecision: payload.admissionDecision,
    digest: payload.digest,
  }, null, 2));
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
