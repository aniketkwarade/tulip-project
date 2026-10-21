import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const bridgePath = path.join(outDir, 'europe-temperature-mortality-bridge-reference-snapshot.json');
const outputJson = path.join(outDir, 'europe-temperature-mortality-full-data-checksums.json');
const outputReport = path.join(outDir, 'europe-temperature-mortality-full-data-checksums-report.md');
const bridge = JSON.parse(await readFile(bridgePath, 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const userAgent = 'LostPlanet-TULIP/1.0 (+temperature-mortality-full-data-checksums)';

assert.equal(bridge.status, 'candidate_independent_human_endpoint_bridge_not_admitted');
assert.equal(bridge.productionRatingsEnabled, 0);
assert.equal(Object.keys(bridge.parquet).length, 6);

async function streamChecksum(name, source) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error(`${name}: complete-file checksum timed out`)), 30 * 60_000);
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': userAgent, Accept: 'application/octet-stream' },
        signal: controller.signal,
      });
      assert(response.ok, `${name}: ${response.status} ${response.statusText}`);
      assert(response.body, `${name}: response body missing`);
      const declaredBytes = Number(response.headers.get('content-length'));
      if (Number.isFinite(declaredBytes) && declaredBytes > 0) {
        assert.equal(declaredBytes, source.bytes, `${name}: Content-Length changed`);
      }

      const hash = createHash('sha256');
      let bytes = 0;
      let leading = Buffer.alloc(0);
      let trailing = Buffer.alloc(0);
      let nextProgress = 64 * 1024 * 1024;
      for await (const rawChunk of response.body) {
        const chunk = Buffer.from(rawChunk);
        hash.update(chunk);
        bytes += chunk.length;
        if (leading.length < 4) leading = Buffer.concat([leading, chunk]).subarray(0, 4);
        trailing = Buffer.concat([trailing, chunk]).subarray(-4);
        if (bytes >= nextProgress) {
          process.stderr.write(`${name}: ${Math.min(bytes, source.bytes).toLocaleString('en-US')} / ${source.bytes.toLocaleString('en-US')} bytes\n`);
          nextProgress += 64 * 1024 * 1024;
        }
      }
      assert.equal(bytes, source.bytes, `${name}: streamed byte count changed`);
      assert.equal(leading.toString('ascii'), 'PAR1', `${name}: leading Parquet magic missing`);
      assert.equal(trailing.toString('ascii'), 'PAR1', `${name}: trailing Parquet magic missing`);
      clearTimeout(timeout);
      return {
        name,
        sourceUrl: source.url,
        resolvedUrl: response.url,
        bytes,
        sha256: hash.digest('hex'),
        etag: response.headers.get('etag'),
        contentLength: Number.isFinite(declaredBytes) && declaredBytes > 0 ? declaredBytes : null,
        leadingParquetMagic: true,
        trailingParquetMagic: true,
        attempts: attempt,
      };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt === 3) throw error;
      process.stderr.write(`${name}: attempt ${attempt} failed; retrying complete stream (${error.message})\n`);
    }
  }
  throw lastError;
}

const files = {};
for (const [name, source] of Object.entries(bridge.parquet)) {
  process.stderr.write(`${name}: hashing complete ${source.bytes.toLocaleString('en-US')}-byte file\n`);
  files[name] = await streamChecksum(name, source);
}

const totalBytes = Object.values(files).reduce((sum, file) => sum + file.bytes, 0);
const payload = {
  version: 'tulip_europe_temperature_mortality_full_data_checksums_2026_09_25_v1',
  checkedOn: '2026-09-25',
  status: 'complete_public_parquet_files_checksum_pinned',
  productionRatingsEnabled: 0,
  purpose: 'Pin every byte of the six public European mortality and temperature files before any working-paper result or TULIP axis is reproduced from them.',
  source: {
    bridgeVersionAtCapture: bridge.version,
    repositoryCommit: bridge.repository.commit,
    paper: bridge.paper.paperUrl,
  },
  counts: {
    files: Object.keys(files).length,
    totalBytes,
    completeSha256Checksums: Object.values(files).filter(file => /^[a-f0-9]{64}$/.test(file.sha256)).length,
    axesAdmitted: 0,
    scoresChanged: 0,
  },
  files,
  integrityDecision: {
    admittedUse: 'Use these complete-file hashes to reproduce the pinned European model and detect any later data-page change.',
    boundary: 'A complete checksum establishes file identity. It does not validate the working-paper model, establish unique regional coverage, create an emissions-source-removal climate, or measure ecosystem harm.',
    nextGate: 'Reproduce the working paper’s European response and mortality outputs from the pinned code and complete files, enumerate unique adm_id coverage and years, then run validated regional source-removal temperatures through the same model with propagated uncertainty. Compare the result with the existing nonlinear endpoint before admitting any human axis. A separate ecosystem endpoint remains required.',
    currentScoreEffect: 'none_all_21_source_candidates_retained',
  },
};
payload.digest = digest({
  source: payload.source,
  counts: payload.counts,
  files: payload.files,
  integrityDecision: payload.integrityDecision,
});

const report = `# European temperature–mortality full-data checksum audit

Status: **all ${payload.counts.files} public Parquet files are checksum pinned byte for byte**.

The audit streamed ${(payload.counts.totalBytes / 1_000_000).toFixed(1)} MB directly from the published links. It did not install a runtime or retain another local copy of the data.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
${Object.values(files).map(file => `| ${file.name} | ${file.bytes.toLocaleString('en-US')} | \`${file.sha256}\` |`).join('\n')}

Complete-file identity is now established. No model output has been reproduced, exact regional coverage has not been enumerated, and no source-removal climate or ecosystem endpoint exists. Therefore zero axes and zero scores change.

Next: ${payload.integrityDecision.nextGate}
`;

await mkdir(outDir, { recursive: true });
await Promise.all([
  writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(outputReport, report),
]);

console.log(JSON.stringify({
  outputJson,
  outputReport,
  status: payload.status,
  counts: payload.counts,
  digest: payload.digest,
}, null, 2));
