import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-full-data-checksums.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_europe_temperature_mortality_full_data_checksums_2026_09_25_v1');
assert.equal(payload.status, 'complete_public_parquet_files_checksum_pinned');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.source.repositoryCommit, 'b6d185ed7d596afca420ea2cebb32c878ca5a25d');
assert.equal(payload.counts.files, 6);
assert.equal(payload.counts.totalBytes, 718_702_455);
assert.equal(payload.counts.completeSha256Checksums, 6);
assert.equal(payload.counts.axesAdmitted, 0);
assert.equal(payload.counts.scoresChanged, 0);
assert.equal(Object.keys(payload.files).length, 6);
assert.equal(new Set(Object.values(payload.files).map(file => file.sha256)).size, 6);
for (const file of Object.values(payload.files)) {
  assert(/^[a-f0-9]{64}$/.test(file.sha256), file.name);
  assert(file.bytes > 0, file.name);
  assert.equal(file.leadingParquetMagic, true, file.name);
  assert.equal(file.trailingParquetMagic, true, file.name);
  assert(file.attempts >= 1 && file.attempts <= 3, file.name);
}
assert.match(payload.integrityDecision.boundary, /does not validate the working-paper model/i);
assert.match(payload.integrityDecision.nextGate, /enumerate unique adm_id coverage/i);
assert.match(payload.integrityDecision.nextGate, /separate ecosystem endpoint/i);
assert.equal(payload.integrityDecision.currentScoreEffect, 'none_all_21_source_candidates_retained');

const expectedDigest = createHash('sha256').update(JSON.stringify({
  source: payload.source,
  counts: payload.counts,
  files: payload.files,
  integrityDecision: payload.integrityDecision,
})).digest('hex');
assert.equal(payload.digest, expectedDigest);

console.log('European temperature-mortality full-data checksum audit passed: all six public files are pinned, with zero axes or scores admitted.');
