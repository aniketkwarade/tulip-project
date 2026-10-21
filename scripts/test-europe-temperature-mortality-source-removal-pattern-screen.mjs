import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const artifact = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-source-removal-pattern-screen.json', import.meta.url), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const type7 = (values, probability) => {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower] + ((sorted[lower + 1] ?? sorted[lower]) - sorted[lower]) * fraction;
};
const close = (left, right, tolerance = 1e-12) => assert(Math.abs(left - right) <= tolerance, `${left} != ${right}`);

const storedDigest = artifact.digest;
delete artifact.digest;
assert.equal(digest(artifact), storedDigest);
assert.equal(artifact.version, 'tulip_europe_temperature_mortality_source_removal_pattern_screen_2026_09_26_v1');
assert.equal(artifact.status, 'complete_short_record_regional_pattern_screen_not_admitted');
assert.equal(artifact.productionRatingsEnabled, 0);
assert.equal(artifact.coverage.responseRegions, 971);
assert.equal(artifact.coverage.fittedRegions, 971);
assert.equal(artifact.coverage.fittedRegionYears, 22_333);
assert.equal(artifact.coverage.duplicateRegionYears, 0);
assert.equal(artifact.regions.length, 971);
assert(artifact.regions.every(row => row.full.years === 23));
assert.equal(new Set(artifact.regions.map(row => row.region)).size, 971);

const slopes = artifact.regions.map(row => row.full.slope);
const rSquared = artifact.regions.map(row => row.full.rSquared);
const splitDifferences = artifact.regions.map(row => row.splitHalfAbsoluteSlopeDifference);
const impliedWarming = artifact.regions.map(row => row.impliedLocalWarming2022C);
close(type7(slopes, 0.5), artifact.diagnostics.slope.median);
close(type7(rSquared, 0.5), artifact.diagnostics.rSquared.median);
close(type7(splitDifferences, 0.5), artifact.diagnostics.splitHalfAbsoluteSlopeDifference.median);
close(type7(impliedWarming, 0.5), artifact.diagnostics.impliedLocalWarming2022C.median);
assert.equal(slopes.filter(value => value < 0).length, artifact.diagnostics.negativeFullPeriodSlopes);
assert.equal(rSquared.filter(value => value < 0.2).length, artifact.diagnostics.rSquaredBelowPointTwo);
assert.equal(artifact.regions.filter(row => row.splitHalfOppositeSigns).length, artifact.diagnostics.splitHalfOppositeSigns);
assert.equal(artifact.diagnostics.negativeFullPeriodSlopes, 24);
assert.equal(artifact.diagnostics.rSquaredBelowPointTwo, 76);
assert.equal(artifact.diagnostics.splitHalfOppositeSigns, 22);
close(artifact.diagnostics.slope.median, 1.471544352411281);
close(artifact.diagnostics.splitHalfAbsoluteSlopeDifference.median, 0.7994723578267546);
assert.equal(artifact.decision.status, 'not_admitted_short_record_pattern_instability');
assert.equal(artifact.decision.axesAdmitted, 0);
assert.equal(artifact.decision.scoresChanged, 0);
assert.match(artifact.decision.nextGate, /1950–2022/);

console.log('European temperature–mortality source-removal pattern screen passed: all 971 regions are reproduced and the unstable 23-year shortcut remains excluded from TULIP scoring.');
