import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mapFixedBenchmarkMagnitude, roundBenchmarkDisplay } from '../src/tulip-fixed-benchmark-map.js';
import { mapSelectedHealthEndpoint, selectedHealthCalibrationDefinition,
  SELECTED_HEALTH_CALIBRATION_DECISION_VERSION } from '../src/tulip-selected-health-calibration.js';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const report = read('../artifacts/tulip-calibration-closeout-2026-09-28/health-benchmark-source-check.json');
const selected = selectedHealthCalibrationDefinition();
assert.equal(report.decisionVersion, SELECTED_HEALTH_CALIBRATION_DECISION_VERSION);
for (const [path, hash] of Object.entries(report.inputs)) {
  assert.equal(createHash('sha256').update(readFileSync(new URL(`../${path}`, import.meta.url))).digest('hex'), hash);
}
for (const row of report.cases) {
  const actual = mapFixedBenchmarkMagnitude(row.modeledDalys, selected.points, selected.logOffset);
  assert(Math.abs(actual - Number(row.unroundedComponentDiagnostic)) < 1e-10, row.cause);
  assert.equal(roundBenchmarkDisplay(actual), row.componentDiagnostic, row.cause);
  assert.equal(row.nodeRating, null);
}
// This is a synthetic mapping control, not a source or whole-node admission.
const diagnosticInput = {
  status: 'source_bound_endpoint', domain: 'human', outcomeKind: 'attributable_dalys', unit: 'DALY',
  reportingPeriodBasis: 'single_calendar_year_estimate', nodeId: 'synthetic_endpoint_control',
  burden: {lower: 100000, central: 1000000, upper: 10000000},
};
const result = mapSelectedHealthEndpoint(diagnosticInput);
assert.equal(result.value, 5);
assert.deepEqual(result.interval, {lower: 3, upper: 7, kind: 'source_interval_transformed_by_fixed_monotone_map'});
assert.equal(result.publicReady, false);
assert.equal(result.wholeNodeScore, null);
selected.points[2].burden = 2;
assert.equal(mapSelectedHealthEndpoint(diagnosticInput).value, 5, 'returned definition cannot mutate fixed ruler');
assert.equal(mapSelectedHealthEndpoint({...diagnosticInput, unit: 'people'}).value, null);
assert.equal(report.publicReady, false);
assert.equal(report.summary.wholeNodeAssessments, 0);
console.log(`Selected health ruler checked: ${report.cases.length} raw-source cases reproduced in separate Python/JavaScript calculations; no public admissions.`);
