import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const result = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/internal-europe-heat-arco-era5-crosscheck.json', import.meta.url), 'utf8'));

assert.equal(result.version, 'tulip_europe_heat_arco_era5_crosscheck_2026_09_24_v1');
assert.equal(result.productionRatingsEnabled, 0);
assert.equal(result.status, 'fallback_not_admitted_resolution_and_agreement_insufficient');
assert.equal(result.source.access, 'anonymous public Google Cloud Storage');
assert.equal(result.source.period.end, 2021);
assert.match(result.source.period.boundaryNote, /decoded time coordinate ends on 2021-12-31/i);
assert.equal(result.results.absoluteTemperatures.matchedRegions, 103);
assert.equal(result.results.heldOutWeeklyAnomalies.matchedRegions, 103);
assert.equal(result.results.passesPredeclaredAbsoluteReconstructionCriteria, false);
assert(result.results.absoluteTemperatures.medianAbsoluteErrorC > 0.15);
assert(result.results.heldOutWeeklyAnomalies.medianAbsoluteErrorC > 0.15);
assert(result.results.heldOutWeeklyAnomalies.pearsonCorrelation < 0.995);
assert.equal(result.decision.admissionStatus, 'rejected_for_source_removal_endpoint_attribution');
assert.match(result.decision.prohibitedUses.join(' '), /Do not enable or change a TULIP rating/i);

console.log('Open ARCO ERA5 fallback check passed: full Italian-region coverage is retained as a failed coarse-resolution validation, not scoring evidence.');
