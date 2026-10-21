import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const outputJson = path.join(outDir, 'internal-emission-source-heat-endpoint-sensitivity.json');
const outputReport = path.join(outDir, 'internal-emission-source-heat-endpoint-sensitivity-report.md');
const runner = path.join(root, 'scripts', 'reproduce-europe-heat-source-removal-sensitivity.R');
const warming = JSON.parse(await readFile(path.join(outDir, 'internal-emissions-to-warming-validation.json'), 'utf8'));
const methaneWarming = JSON.parse(await readFile(path.join(outDir, 'internal-methane-to-warming-validation.json'), 'utf8'));
const reference = JSON.parse(await readFile(path.join(outDir, 'europe-heat-mortality-reference-snapshot.json'), 'utf8'));
const execFileAsync = promisify(execFile);
const checkedOn = '2026-09-23';
const rLibrary = path.join(os.homedir(), '.cache', 'tulip-r-library', '4.6.1');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const csvCell = value => `"${String(value).replaceAll('"', '""')}"`;

assert.equal(warming.results.length, 20);
const riceMethane = methaneWarming.results.find(row => row.nodeId === 'rice_paddy_methane_bubbles' && row.calculation);
assert(riceMethane, 'Expected the validated rice-methane physical response.');
const repository = reference.endpoint2024.reproducibility.heatMortalityRepository;
assert.equal(repository.publicSample.regions, 103);
assert.match(repository.scope, /simplified model code and sample inputs/i);
const requiredFiles = ['data.csv', 'metadata.csv'];

async function fetchPinned(filename) {
  const descriptor = repository.files[filename];
  assert(descriptor, `Missing reference descriptor for ${filename}`);
  const response = await fetch(descriptor.url, { signal: AbortSignal.timeout(120_000), headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+emission-source-heat-sensitivity)' } });
  assert(response.ok, `${filename}: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  assert.equal(sha256(buffer), descriptor.sha256, `${filename}: checksum changed`);
  return buffer;
}

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'tulip-source-heat-'));
try {
  const [dataBuffer, metadataBuffer, runnerBuffer] = await Promise.all([
    fetchPinned(requiredFiles[0]),
    fetchPinned(requiredFiles[1]),
    readFile(runner),
  ]);
  const dataPath = path.join(temporaryDirectory, 'data.csv');
  const metadataPath = path.join(temporaryDirectory, 'metadata.csv');
  const shiftsPath = path.join(temporaryDirectory, 'source-shifts.csv');
  const rawOutputPath = path.join(temporaryDirectory, 'result.json');
  const co2ShiftRows = warming.results.map(row => {
    const year2022 = row.annualGmstScreen.records.find(record => record.year === 2022);
    assert(year2022, `${row.nodeId}: missing 2022 GMST screen`);
    return {
      nodeId: row.nodeId,
      name: row.name,
      sourceGas: 'CO2',
      responseBasis: 'partial_cumulative_co2_tcre_screen',
      gmstShiftC2022: year2022.cumulativeGmstBestC,
    };
  });
  const rice2022 = riceMethane.calculation.records.find(record => record.year === 2022);
  assert(rice2022, 'Rice methane: missing 2022 GWP* response.');
  const shiftRows = [...co2ShiftRows, {
    nodeId: riceMethane.nodeId,
    name: riceMethane.name,
    sourceGas: 'CH4',
    responseBasis: 'path_dependent_methane_gwp_star_response_since_1991',
    gmstShiftC2022: rice2022.gmstResponseC.best,
  }];
  const shiftsCsv = [
    ['node_id', 'name', 'source_gas', 'response_basis', 'gmst_shift_c_2022'].map(csvCell).join(','),
    ...shiftRows.map(row => [row.nodeId, row.name, row.sourceGas, row.responseBasis, row.gmstShiftC2022].map(csvCell).join(',')),
  ].join('\n') + '\n';
  await Promise.all([
    writeFile(dataPath, dataBuffer),
    writeFile(metadataPath, metadataBuffer),
    writeFile(shiftsPath, shiftsCsv),
  ]);

  const { stdout, stderr } = await execFileAsync('Rscript', [runner, dataPath, metadataPath, shiftsPath, rawOutputPath], {
    timeout: 30 * 60 * 1000,
    maxBuffer: 20_000_000,
    env: { ...process.env, R_LIBS_USER: rLibrary },
  });
  const raw = JSON.parse(await readFile(rawOutputPath, 'utf8'));
  assert.equal(raw.status, 'source_specific_nonlinear_human_endpoint_sensitivity_not_calibrated_attribution');
  assert.equal(raw.input_counts.regions, 103);
  assert.equal(raw.input_counts.source_nodes, 21);
  assert.equal(raw.results.length, 21);
  assert.equal(raw.input_counts.co2_source_nodes, 20);
  assert.equal(raw.input_counts.methane_source_nodes, 1);
  assert(raw.factual.heat_deaths > 0);
  assert(raw.factual.represented_population > 50_000_000);
  assert(raw.zero_shift_check.absolute_difference < 1e-10);
  for (const row of raw.results) {
    assert.equal(row.sensitivity.length, 4, row.node_id);
    assert.deepEqual(row.sensitivity.map(item => item.pattern_scale), [0.5, 1, 1.5, 2]);
    assert(row.sensitivity.every(item => item.source_attributable_heat_deaths >= 0), row.node_id);
    assert(row.sensitivity.every((item, index) => index === 0 || item.source_attributable_heat_deaths >= row.sensitivity[index - 1].source_attributable_heat_deaths), row.node_id);
  }
  const resultByNode = new Map(raw.results.map(row => [row.node_id, row]));
  assert(resultByNode.get('refinery_combustion_co2').sensitivity.find(item => item.pattern_scale === 1).source_attributable_heat_deaths
    > resultByNode.get('waste_incineration_co2').sensitivity.find(item => item.pattern_scale === 1).source_attributable_heat_deaths);
  assert(resultByNode.get('rice_paddy_methane_bubbles').sensitivity.find(item => item.pattern_scale === 1).source_attributable_heat_deaths > 0);

  const payload = {
    version: 'tulip_internal_emission_source_heat_endpoint_sensitivity_2026_09_25_v6',
    preparedOn: checkedOn,
    status: raw.status,
    productionRatingsEnabled: 0,
    sourceVerification: {
      heatMortalityRepository: repository.url,
      commit: repository.commit,
      data: { bytes: dataBuffer.length, sha256: sha256(dataBuffer) },
      metadata: { bytes: metadataBuffer.length, sha256: sha256(metadataBuffer) },
      runner: { path: 'scripts/reproduce-europe-heat-source-removal-sensitivity.R', bytes: runnerBuffer.length, sha256: sha256(runnerBuffer) },
      runtime: raw.runtime,
      warmingInputVersion: warming.version,
      warmingInputDigest: warming.digest,
      methaneWarmingInputVersion: methaneWarming.version,
      methaneWarmingInputDigest: methaneWarming.digest,
    },
    method: raw.method,
    inputCounts: raw.input_counts,
    factual: raw.factual,
    zeroShiftCheck: raw.zero_shift_check,
    results: raw.results,
    admissionDecision: {
      status: 'sensitivity_only_not_admitted_to_tulip_axes',
      admittedUse: 'Demonstrate that the twenty validated CO2 histories can run through a nonlinear, region-specific human endpoint model and quantify sensitivity to an explicit local-to-global temperature scaling assumption.',
      prohibitedUses: [
        'Do not treat the uniform pattern-scale cases as probabilities, confidence intervals or validated regional climate responses.',
        'Do not use the resulting death estimates to set TULIP severity, reach, persistence, value, letter or confidence.',
        'Do not extrapolate the European 2022 endpoint to the world, other years, other health outcomes or ecosystems.',
        'Do not add these endpoint results across overlapping source boundaries.',
      ],
      gateToAdmission: 'Validate source-removal regional weekly temperature patterns for the same 823 regions and 2022 period, propagate physical and epidemiological uncertainty, and reproduce the result independently.',
    },
    limitations: raw.limitations,
    execution: { stdout: stdout.trim(), stderr: stderr.trim() },
  };
  payload.digest = digest({ sourceVerification: payload.sourceVerification, method: payload.method, inputCounts: payload.inputCounts, factual: payload.factual, results: payload.results, admissionDecision: payload.admissionDecision, limitations: payload.limitations });
  await mkdir(outDir, { recursive: true });
  await writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`);

  const central = payload.results.map(row => ({
    name: row.name,
    sourceGas: row.source_gas,
    responseBasis: row.response_basis,
    gmst: row.cumulative_gmst_screen_c_2022,
    endpoint: row.sensitivity.find(item => item.pattern_scale === 1),
    lower: row.sensitivity.find(item => item.pattern_scale === 0.5),
    upper: row.sensitivity.find(item => item.pattern_scale === 2),
  }));
  const report = `# Emission-source heat endpoint sensitivity\n\nStatus: **nonlinear human-endpoint sensitivity completed; not admitted to TULIP scoring**.\n\nTwenty CO₂ nodes and the rice-methane node now run through the authors’ open 103-region European sample model for summer 2022. For each node, the calculation subtracts its 2022 global-mean temperature-response screen from the factual weekly temperatures, holds the regional exposure-response function and observed mortality baseline fixed, and recomputes heat deaths. CO₂ uses the partial cumulative-emissions TCRE screen. Rice methane uses the path-dependent GWP* response since 1991. This is a real nonlinear endpoint calculation rather than total deaths multiplied by an emissions share.\n\n## Result\n\nThe central sensitivity assumes a uniform regional temperature change equal to the source's global-mean response. The 0.5× and 2× cases show how strongly the endpoint depends on that unvalidated pattern assumption. They are not confidence bounds.\n\n| Node | Gas | 2022 physical response | 0.5× case | 1× central case | 2× case |\n| --- | --- | ---: | ---: | ---: | ---: |\n${central.map(row => `| ${row.name} | ${row.sourceGas} | ${row.gmst.toFixed(6)} °C | ${row.lower.source_attributable_heat_deaths.toFixed(1)} deaths | ${row.endpoint.source_attributable_heat_deaths.toFixed(1)} deaths | ${row.upper.source_attributable_heat_deaths.toFixed(1)} deaths |`).join('\n')}\n\nThe public sample represents ${Math.round(payload.factual.represented_population).toLocaleString('en-US')} people across ${payload.inputCounts.regions} European regions. Its factual point estimate is ${payload.factual.heat_deaths.toFixed(1)} heat deaths for summer 2022 under the simplified open model. The paper reports 823 regions, but the public repository is explicitly a smaller sample whose results differ from the article.\n\n## Why this does not change a TULIP rating\n\nThe global source response cannot yet be assumed to shift every European region by the same amount. Regional amplification, circulation and extremes can differ from global mean temperature. The public mortality code uses a 103-region sample, the run has no propagated uncertainty and the endpoint covers one European summer only. Several histories also omit earlier emissions or retain inventory-specific boundaries, including lifecycle power emissions, Tier 1 agricultural drained-soil estimates and the rice GWP* reference-year choice.\n\nThe next admissible step is to obtain or recreate the full regional endpoint inputs, generate validated source-removal weekly temperature patterns, rerun with physical and epidemiological uncertainty, and reproduce the calculation independently. Ecosystem consequences still require a separate endpoint.\n\n## Rejected shortcuts\n\n- aggregate heat deaths multiplied by an emissions share\n- anthropogenic heat deaths multiplied by a source share of global warming\n- heatwave probability or intensity multiplied by reported deaths\n- European mortality copied into a global people or nature score\n`;
  await writeFile(outputReport, report);
  console.log(JSON.stringify({ outputJson, outputReport, status: payload.status, regions: payload.inputCounts.regions, nodes: payload.results.length, factualHeatDeaths: payload.factual.heat_deaths, digest: payload.digest }, null, 2));
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
