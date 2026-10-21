import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/gmw-mangrove-extent-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.source.version, '4.1.12');
assert.deepEqual(snapshot.source.dataPeriod, { start: 1985, end: 2025, annualEpochs: 41 });
assert.equal(snapshot.extentSeries.length, 41);
assert.equal(snapshot.extentSeries[0].year, 1985);
assert.equal(snapshot.extentSeries.at(-1).year, 2025);
assert.equal(snapshot.ingestion.countryRows, 129);
assert.equal(snapshot.ingestion.changeCountryMatrices, 126);
assert.equal(snapshot.ingestion.sourceFilesVerifiedByMd5, true);
assert.equal(snapshot.currentWindow.start, 2016);
assert.equal(snapshot.currentWindow.end, 2025);
assert.equal(snapshot.currentWindow.completeCalendarYears, 10);
assert(snapshot.currentWindow.grossLossHa > 0);
assert(snapshot.currentWindow.grossGainHa > 0);
assert(Math.abs(snapshot.currentWindow.netChangeHaFromGrossFlows - snapshot.currentWindow.netChangeHaFromExtent) < 1);
assert(snapshot.currentWindow.grossLossPctOfBaseline > 1 && snapshot.currentWindow.grossLossPctOfBaseline < 10);
assert.equal(snapshot.tulipUse.proposedReachAnchor.centralLevel, 2);
assert.match(snapshot.tulipUse.excluded.join(' '), /Do not treat the 41-year record as 41 years/i);
assert.match(snapshot.tulipUse.excluded.join(' '), /both ecosystem severity and reach/i);

console.log(`GMW reference passed: ${snapshot.currentWindow.grossLossPctOfBaseline}% of the 2016 mangrove extent was mapped as gross loss through 2025, with gains, net change and map error kept separate.`);
