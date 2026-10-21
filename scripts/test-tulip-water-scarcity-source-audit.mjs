import assert from 'node:assert/strict';
import { auditAnnualWaterScarcity } from '../src/tulip-water-scarcity-source-audit.js';

const year = (withdrawals, availability) => Array.from({ length: 12 }, (_, index) => ({
  month: index + 1, year: 2020, catchmentId: 'synthetic_catchment', scenarioId: 'synthetic_with_meltwater',
  unit: 'm3', withdrawal: withdrawals[index], availability: availability[index],
}));
// Constructed algebraic counterexamples, not observations of the source basins.
const first = year([20, ...Array(11).fill(1)], [1, ...Array(11).fill(10)]);
const second = year([0, ...Array(11).fill(105)], [1, ...Array(11).fill(100)]);
const a = auditAnnualWaterScarcity(first), b = auditAnnualWaterScarcity(second);
assert.equal(a.category, 'seasonal_only');
assert(a.annualVolumeRatio < 1 && a.meanMonthlyRatioDiagnosticOnly > 1);
assert.equal(b.category, 'perennial');
assert(b.annualVolumeRatio > 1 && b.meanMonthlyRatioDiagnosticOnly < 1);
assert.deepEqual(a, auditAnnualWaterScarcity([...first].reverse()));
const litre = first.map(row => ({ ...row, unit: 'litre', withdrawal: row.withdrawal * 1000, availability: row.availability * 1000 }));
assert.deepEqual(a, auditAnnualWaterScarcity(litre));
const invalid = [first.slice(0, -1), first.map((row, index) => index === 0 ? { ...row, withdrawal: null } : row),
  first.map((row, index) => index === 0 ? { ...row, availability: NaN } : row),
  first.map((row, index) => index === 0 ? { ...row, year: 2021 } : row),
  first.map((row, index) => index === 0 ? { ...row, catchmentId: 'other' } : row),
  first.map((row, index) => index === 0 ? { ...row, scenarioId: 'other' } : row),
  first.map((row, index) => index === 0 ? { ...row, unit: 'm3_per_second' } : row),
  first.map((row, index) => index === 0 ? { ...row, withdrawal: -1 } : row),
  first.map((row, index) => index === 0 ? { ...row, month: 2 } : row)];
for (const input of invalid) {
  const result = auditAnnualWaterScarcity(input);
  assert.equal(result.status, 'needs_source_inputs');
  assert.equal(result.category, null);
  assert.equal(result.score, null);
}
const zero = auditAnnualWaterScarcity(year(Array(12).fill(1), Array(12).fill(0)));
assert.equal(zero.category, 'perennial');
assert.equal(zero.annualVolumeRatio, null);
assert.equal(zero.meanMonthlyRatioDiagnosticOnly, null);
assert.equal(zero.zeroAvailabilityMonthCount, 12);
assert.equal(zero.score, null);
assert.equal(zero.publicReady, false);
console.log('Passed: both aggregation reversals, volume-unit/order invariance, nine missing/incompatible inputs and explicit zero-supply handling. No TULIP scores generated.');
