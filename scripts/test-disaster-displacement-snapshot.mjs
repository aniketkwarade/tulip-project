import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../public/disaster-displacement-snapshot.json', import.meta.url), 'utf8'));
const records = snapshot.records;
const years = [...new Set(records.map(record => record.observation_year))].sort((a, b) => b - a);
const latestYear = years[0];
const latest = records.filter(record => record.observation_year === latestYear);
const latestPositiveRows = latest.filter(record => record.new_displacement_movements > 0);
const latestTotal = latest.reduce((sum, record) => sum + record.new_displacement_movements, 0);

assert.equal(snapshot.overview.displacement_latest_observation_year, latestYear);
assert.equal(snapshot.overview.displacement_latest_country_count, latest.length);
assert.equal(snapshot.overview.displacement_latest_reported_movements, latestTotal);
assert(latestPositiveRows.length > 0, 'The latest accepted year cannot be an all-zero placeholder slice.');
assert(latestTotal > 0, 'The latest accepted year must contain a positive reported global movement total.');
assert.deepEqual(snapshot.overview.excluded_trailing_all_zero_years.map(row => row.year), [2025, 2024]);
assert(!records.some(record => record.observation_year === 2025));
assert(!records.some(record => record.observation_year === 2024));
assert.equal(latestYear, 2023);
assert.equal(latestTotal, 26_375_278);
assert.match(snapshot.failure_behavior, /exclude trailing all-zero country-year slices/i);

console.log(`Disaster-displacement snapshot passed: ${latestYear} is the latest positive World Bank-IDMC year; trailing 2024–2025 all-zero placeholders are excluded.`);
