import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const artifact = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-regional-boundary-crosswalk.json', import.meta.url), 'utf8'));
const geometry = await readFile(new URL(`../${artifact.geometryOutput.path}`, import.meta.url));
const sha256 = value => createHash('sha256').update(value).digest('hex');

assert.equal(artifact.version, 'tulip_europe_temperature_mortality_regional_boundary_crosswalk_2026_09_26_v1');
assert.equal(artifact.status, 'complete_all_response_regions_resolved_to_official_gisco_boundaries');
assert.equal(artifact.productionRatingsEnabled, 0);
assert.equal(artifact.coverage.responseRegions, 971);
assert.equal(artifact.coverage.resolvedRegions, 971);
assert.deepEqual(artifact.coverage.missingRegions, []);
assert.equal(artifact.coverage.duplicateRegionIds, 0);
assert.equal(artifact.coverage.invalidGeometries, 0);
assert.equal(artifact.coverage.emptyGeometries, 0);
assert.equal(artifact.coverage.topologyRepairs, 1);
assert.deepEqual(artifact.coverage.sourceReleaseCounts, { 2021: 181, 2024: 790 });
assert.deepEqual(artifact.coverage.nutsLevelCounts, { 1: 16, 3: 955 });
assert.equal(artifact.rows.length, 971);
assert.equal(new Set(artifact.rows.map(row => row.regionId)).size, 971);
assert.equal(artifact.geometryOutput.features, 971);
assert.equal(artifact.geometryOutput.bytes, geometry.length);
assert.equal(artifact.geometryOutput.sha256, sha256(geometry));
assert.equal(artifact.decision.status, 'admitted_as_regional_geometry_input_only');
assert.equal(artifact.decision.axesAdmitted, 0);
assert.equal(artifact.decision.scoresChanged, 0);
assert.match(artifact.decision.nextGate, /1950–2022 ERA5-Land/i);
assert.equal(artifact.digest.length, 64);

console.log('European temperature–mortality regional-boundary crosswalk passed: all 971 panel regions resolve exactly, and geometry alone changes no TULIP axes or scores.');
