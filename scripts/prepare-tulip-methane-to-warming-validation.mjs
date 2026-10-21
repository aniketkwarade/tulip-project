import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { calculateMethaneGwpStar, METHANE_GWP_STAR_METHOD } from './lib/tulip-methane-gwp-star.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = resolve(root, 'artifacts/tulip-calibration-2026-09-22');
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const [reference, allocation, edgar, tundra] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/jones-national-warming-reference-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-emission-source-allocation.json'),
  json('public/edgar-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/tundra-methane-reference-snapshot.json'),
]);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

assert.equal(reference.validation.methaneGwpStar.result, 'published_gwp_star_rows_reproduced');
assert(reference.validation.methaneGwpStar.maximumAbsoluteErrorPgCO2we < 1e-9);

const riceInventory = edgar.global_time_series
  .filter(row => row.node_id === 'rice_paddy_methane_bubbles' && row.substance === 'CH4')
  .sort((left, right) => left.observation_year - right.observation_year);
assert.equal(riceInventory.length, 55);
assert.deepEqual([riceInventory[0].observation_year, riceInventory.at(-1).observation_year], [1970, 2024]);
const riceAnnual = riceInventory.map(row => ({
  year: row.observation_year,
  annualTgCH4: row.emission_gg_substance / 1000,
}));
const riceCalculation = calculateMethaneGwpStar({
  annualEmissions: riceAnnual,
  referenceYear: 1991,
  gwp100: METHANE_GWP_STAR_METHOD.biogenicMethaneGwp100,
});
assert.equal(riceCalculation.records.length, 33);
assert.deepEqual([riceCalculation.records[0].year, riceCalculation.records.at(-1).year], [1992, 2024]);

const riceAllocation = allocation.rows.find(row => row.nodeId === 'rice_paddy_methane_bubbles');
const tundraAllocation = allocation.rows.find(row => row.nodeId === 'tundra_methane_outgassing');
assert(riceAllocation && tundraAllocation);
const latestRice = riceCalculation.records.at(-1);
const availableTundra = tundra.endpoints.arcticBorealFlux.annualSeries.total_post.annual;
assert.equal(availableTundra.length, 12);

const results = [{
  nodeId: 'rice_paddy_methane_bubbles',
  name: riceAllocation.name,
  sourceBoundary: 'EDGAR global rice-cultivation CH4. It is treated as biogenic methane using the published 27.2 GWP100 value inside GWP*; other agricultural methane is excluded.',
  sourceHistory: { startYear: 1970, endYear: 2024, records: riceAnnual.length, sourceId: 'edgar_2025_ghg' },
  referenceBasis: {
    referenceYear: 1991,
    reason: 'The 1970 inventory supplies the required twenty-year lookback and allows the physical response change to be reported from the start of the 1991–2020 WMO climatological standard normal.',
    interpretation: 'The output is the change in the rice-source warming contribution since 1991, not its full pre-industrial contribution.',
  },
  methodStatus: 'published_gwp_star_transformation_reproduced_and_applied',
  calculation: riceCalculation,
  latestPhysicalIntermediate: {
    year: latestRice.year,
    annualMtCH4: latestRice.annualTgCH4,
    cumulativePgCO2weSinceReference: latestRice.cumulativePgCO2weSinceReference,
    gmstResponseC: latestRice.gmstResponseC,
  },
  terminalHarmStatus: 'not_modelled',
  scoreEffect: 'none_candidate_value_grade_and_confidence_unchanged',
  remainingGap: 'Translate the source-removal global response through a validated hazard model and matched current human and ecosystem endpoints. The global temperature intermediate cannot set severity, reach or persistence.',
}, {
  nodeId: 'tundra_methane_outgassing',
  name: tundraAllocation.name,
  sourceBoundary: tundra.endpoints.arcticBorealFlux.boundary,
  sourceHistory: {
    startYear: availableTundra[0].year,
    endYear: availableTundra.at(-1).year,
    records: availableTundra.length,
    sourceId: tundra.sources.inverseModel.id,
  },
  referenceBasis: {
    requestedReference: '1991–2020 WMO climatological standard normal with recent years retained separately',
    requiredStartYearForTwentyYearGwpStarAt1991: 1971,
    earliestAvailableYear: availableTundra[0].year,
  },
  methodStatus: 'not_applied_insufficient_annual_history_and_node_boundary_unresolved',
  calculation: null,
  latestPhysicalIntermediate: null,
  terminalHarmStatus: 'not_modelled',
  scoreEffect: 'none_candidate_value_grade_and_confidence_unchanged',
  remainingGap: 'Acquire or reconstruct a compatible annual history beginning no later than 1971, isolate methane attributable to the node without adding overlapping wetland, lake or thaw-altered-landscape fluxes, then run the validated GWP* transformation and matched endpoints.',
}];

const payload = {
  version: 'tulip_internal_methane_to_warming_validation_2026_09_23_v1',
  preparedOn: '2026-09-23',
  status: 'published_methane_method_reproduced_rice_physical_intermediate_ready_tundra_history_incomplete',
  purpose: 'Validate a path-dependent methane-to-warming calculation and apply it only where the TULIP source history and boundary satisfy the method.',
  reference: {
    version: reference.version,
    digest: reference.digest,
    sourceCodeCommit: METHANE_GWP_STAR_METHOD.sourceCodeCommit,
    publishedComponentsReproduced: reference.validation.methaneGwpStar.components,
    maximumAbsoluteReproductionErrorPgCO2we: reference.validation.methaneGwpStar.maximumAbsoluteErrorPgCO2we,
  },
  method: {
    name: 'GWP* warming-equivalent methane transformation followed by the published TCRE mapping',
    equation: reference.method.methaneGwpStar.equation,
    constants: METHANE_GWP_STAR_METHOD,
    minimumHistoryRule: 'A calculation requires a contiguous annual source history beginning at least twenty years before its reference year.',
    useBoundary: 'This is a global physical response intermediate. It is not observed harm, a probability distribution or a TULIP axis.',
  },
  counts: {
    methaneNodes: results.length,
    publishedMethodReproduced: 1,
    sourceHistoriesMeetingTwentyYearRule: 1,
    physicalIntermediatesCalculated: 1,
    terminalEndpointModelsCompleted: 0,
    ratingChanges: 0,
  },
  results,
};
payload.digest = digest({ reference: payload.reference, method: payload.method, counts: payload.counts, results });

const report = `# TULIP methane-to-warming validation\n\nStatus: **The published GWP* methane calculation is reproduced. Rice methane has a physical response series; tundra methane does not yet meet the history and source-boundary requirements.** No TULIP rating changed.\n\n## What was validated\n\nThe checksum-pinned Jones annual dataset reproduces all **348 published fossil and biogenic methane GWP*** output rows from 1851–2024. Maximum absolute reproduction error is ${payload.reference.maximumAbsoluteReproductionErrorPgCO2we} Pg CO2 warming-equivalent. The calculation uses the level of cumulative methane emissions and their change over twenty years, so it does not treat one current-year mass or GWP100 as current harm.\n\n## Rice-paddy methane\n\nEDGAR supplies **55 continuous annual observations from 1970–2024**. Using 1991 as the reference year preserves the required twenty-year lookback and aligns the physical-response change with the start of the 1991–2020 WMO normal. The latest annual source flow is **${latestRice.annualTgCH4.toFixed(3)} Mt CH4**. The validated method estimates a ${latestRice.gmstResponseC.best.toFixed(6)} °C best physical-response change since 1991, with a TCRE range of ${latestRice.gmstResponseC.lower.toFixed(6)}–${latestRice.gmstResponseC.upper.toFixed(6)} °C. This is global mean temperature response, not terminal harm.\n\n## Tundra methane\n\nThe reproducible inversion contains only **12 annual observations from 2010–2021** and measures a broad Arctic-Boreal source mixture. GWP* requires a twenty-year lookback, and the requested 1991 reference would require annual data beginning by 1971. TULIP therefore produces **no tundra temperature number** from this record. Filling missing years with a constant, extrapolating the recent mean or assigning all wetland flux to thaw would create false precision.\n\n## What remains\n\nRice now has a validated physical intermediate but still needs a matched hazard model and terminal human and ecosystem endpoints. Tundra first needs a longer, non-overlapping annual source history. Neither physical response is a severity, reach, persistence, TULIP value or letter.\n`;

await Promise.all([
  writeFile(resolve(outDir, 'internal-methane-to-warming-validation.json'), `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(resolve(outDir, 'internal-methane-to-warming-validation-report.md'), report),
]);

console.log(JSON.stringify({ status: payload.status, counts: payload.counts, riceLatest: results[0].latestPhysicalIntermediate, digest: payload.digest }, null, 2));
