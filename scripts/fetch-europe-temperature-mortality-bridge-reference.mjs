import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const outputJson = path.join(outDir, 'europe-temperature-mortality-bridge-reference-snapshot.json');
const outputReport = path.join(outDir, 'europe-temperature-mortality-bridge-reference-report.md');
const [responsiveness, fullDataChecksums, coverageEnumeration] = await Promise.all([
  readFile(path.join(outDir, 'internal-emission-source-score-responsiveness-audit.json'), 'utf8').then(JSON.parse),
  readFile(path.join(outDir, 'europe-temperature-mortality-full-data-checksums.json'), 'utf8').then(JSON.parse),
  readFile(path.join(outDir, 'europe-temperature-mortality-coverage-enumeration.json'), 'utf8').then(JSON.parse),
]);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const userAgent = 'LostPlanet-TULIP/1.0 (+temperature-mortality-bridge-reference)';
const headers = { 'User-Agent': userAgent };

const repository = {
  url: 'https://github.com/echolab-stanford/temperature-mortality',
  apiUrl: 'https://api.github.com/repos/echolab-stanford/temperature-mortality',
  commit: 'b6d185ed7d596afca420ea2cebb32c878ca5a25d',
  files: {
    'README.md': '7a0bfec0b3fb3a69db3f108133951f9220dc83f9a7f83847765ccad59add70b8',
    'us_mex_eu_response_attribution.R': 'dd296700b2ecc70c0e6fbca1c9493d6806421316bb6a40efd17598744ff8e87c',
    'us_mex_eu_maps.R': '7051696c28b751e364c791f1cb8b797e2f1a11788e42409651bf9eefac0c74e7',
  },
};

const parquetSources = {
  fullPanel: {
    url: 'https://www.dropbox.com/scl/fi/108e8ohy269thyhjsp90j/EUFullPanel_complete.pq?rlkey=r552u8o05x5k8eedpt8d7e2io&dl=1',
    expected: { bytes: 132_504_666, footerBytes: 14_460, footerSha256: '799fa47f9f9c2d48ae56658ef82bf2492986335e3e094ad106570d80790fda8e' },
  },
  dailyTemperature: {
    url: 'https://www.dropbox.com/scl/fi/28mzqrpn8d225440ytigp/EUDaily_temp_covariates.pq?rlkey=10460u0qlbehc27kdnjq2yu4j&dl=1',
    expected: { bytes: 421_775_528, footerBytes: 32_200, footerSha256: 'fa8b49abf0cdb0d5414b5dd2de0e08db14a036f3d7ac067b05b984fab60fe49f' },
  },
  temperatureBins: {
    url: 'https://www.dropbox.com/scl/fi/zr35tn5pczh1vyljyq7o2/EUTempBins_monthly_complete.pq?rlkey=46683aso0umbizbfb7zhixc1z&dl=1',
    expected: { bytes: 11_000_661, footerBytes: 37_573, footerSha256: '121cbcef3b713ad2ce45c8bb08c5d2e75565421953042966389022ea9179855f' },
  },
  weeklyMapPanel: {
    url: 'https://www.dropbox.com/scl/fi/txd2ajouz26hjo4u2x7yt/full_weekly.pq?rlkey=kre5ziioq7c9g5uw38yo2kubm&dl=1',
    expected: { bytes: 152_800_708, footerBytes: 28_642_824, footerSha256: '90dee36c4d1732b0c1d6eb99d289be96e72644b4dff3968096166b515897267b' },
  },
  annualTemperatureSummaries: {
    url: 'https://www.dropbox.com/scl/fi/e4d0h3kam7el7nb7syrzx/eu_avg_temps.pq?rlkey=pusolhe8r17g39fnsjw4vtlz4&dl=1',
    expected: { bytes: 596_257, footerBytes: 1_777, footerSha256: '2636e88a797a7b5b128710c1971be5d921fbb1097522fe4245df942395a2186d' },
  },
  temperatureLimits: {
    url: 'https://www.dropbox.com/scl/fi/73pgc9dj4c4xoqbse7fhy/eu_temp_limits.pq?rlkey=bsbpt29bvbd67tbhy632w2btb&dl=1',
    expected: { bytes: 24_635, footerBytes: 1_521, footerSha256: '5f65bc9f79d579e063c6b466a4c61f9294bec16f4e098bd462bf5a96d19c7c45' },
  },
};

async function fetchBuffer(url, requestHeaders = {}) {
  const response = await fetch(url, {
    headers: { ...headers, ...requestHeaders },
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return { response, buffer: Buffer.from(await response.arrayBuffer()) };
}

async function fetchRange(url, start, end) {
  const { response, buffer } = await fetchBuffer(url, { Range: `bytes=${start}-${end}` });
  assert.equal(response.status, 206, `${url}: server did not honor byte range`);
  return {
    buffer,
    contentRange: response.headers.get('content-range'),
    etag: response.headers.get('etag'),
  };
}

class CompactReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  byte() {
    assert(this.offset < this.buffer.length, 'Compact-protocol read passed the footer boundary');
    return this.buffer[this.offset++];
  }

  varint() {
    let value = 0n;
    let shift = 0n;
    while (true) {
      const current = this.byte();
      value |= BigInt(current & 0x7f) << shift;
      if (!(current & 0x80)) return value;
      shift += 7n;
      assert(shift <= 70n, 'Compact-protocol varint is too long');
    }
  }

  zigzag() {
    const encoded = this.varint();
    const value = (encoded >> 1n) ^ (-(encoded & 1n));
    if (value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= BigInt(Number.MIN_SAFE_INTEGER)) return Number(value);
    return value.toString();
  }

  binary() {
    const length = Number(this.varint());
    const value = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return Buffer.from(value);
  }

  value(type, fieldBoolean = null) {
    if (type === 1) return fieldBoolean ?? true;
    if (type === 2) return fieldBoolean ?? false;
    if (type === 3) {
      const value = this.byte();
      return value > 127 ? value - 256 : value;
    }
    if (type >= 4 && type <= 6) return this.zigzag();
    if (type === 7) {
      const value = this.buffer.readDoubleLE(this.offset);
      this.offset += 8;
      return value;
    }
    if (type === 8) return this.binary();
    if (type === 9 || type === 10) {
      const header = this.byte();
      let length = header >> 4;
      const elementType = header & 0x0f;
      if (length === 15) length = Number(this.varint());
      return Array.from({ length }, () => this.value(elementType));
    }
    if (type === 11) {
      const length = Number(this.varint());
      if (!length) return [];
      const header = this.byte();
      const keyType = header >> 4;
      const valueType = header & 0x0f;
      return Array.from({ length }, () => [this.value(keyType), this.value(valueType)]);
    }
    if (type === 12) return this.structure();
    throw new Error(`Unsupported compact-protocol type ${type}`);
  }

  structure() {
    const result = {};
    let lastFieldId = 0;
    while (true) {
      const header = this.byte();
      if (header === 0) return result;
      const delta = header >> 4;
      const type = header & 0x0f;
      const fieldId = delta ? lastFieldId + delta : this.zigzag();
      lastFieldId = fieldId;
      result[fieldId] = this.value(type, type === 1 ? true : type === 2 ? false : null);
    }
  }
}

const parquetTypeNames = ['boolean', 'int32', 'int64', 'int96', 'float', 'double', 'byte_array', 'fixed_len_byte_array'];
const parquetCodecNames = ['uncompressed', 'snappy', 'gzip', 'lzo', 'brotli', 'lz4', 'zstd', 'lz4_raw'];
const parquetEncodingNames = ['plain', 'group_var_int', 'plain_dictionary', 'rle', 'bit_packed', 'delta_binary_packed', 'delta_length_byte_array', 'delta_byte_array', 'rle_dictionary', 'byte_stream_split'];
const text = value => Buffer.isBuffer(value) ? value.toString('utf8') : value;

function decodeStatistic(buffer, physicalType) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (physicalType === 0) return Boolean(buffer[0]);
  if (physicalType === 1) return buffer.readInt32LE(0);
  if (physicalType === 2) {
    const value = buffer.readBigInt64LE(0);
    return value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(value) : value.toString();
  }
  if (physicalType === 4) return buffer.readFloatLE(0);
  if (physicalType === 5) return buffer.readDoubleLE(0);
  if (physicalType === 6) return buffer.toString('utf8');
  return buffer.toString('hex');
}

function aggregateColumnMetadata(fileMetadata) {
  const columns = new Map();
  for (const [rowGroupIndex, rowGroup] of (fileMetadata[4] ?? []).entries()) {
    for (const chunk of rowGroup[1] ?? []) {
      const metadata = chunk[3];
      if (!metadata) continue;
      const pathName = (metadata[3] ?? []).map(text).join('.');
      const type = metadata[1];
      const statistics = metadata[12] ?? {};
      const minimum = decodeStatistic(statistics[6] ?? statistics[2], type);
      const maximum = decodeStatistic(statistics[5] ?? statistics[1], type);
      const previous = columns.get(pathName) ?? {
        path: pathName,
        physicalType: parquetTypeNames[type] ?? `unknown_${type}`,
        values: 0,
        nulls: 0,
        compressedBytes: 0,
        uncompressedBytes: 0,
        codec: parquetCodecNames[metadata[4]] ?? `unknown_${metadata[4]}`,
        encodings: (metadata[2] ?? []).map(encoding => parquetEncodingNames[encoding] ?? `unknown_${encoding}`),
        chunks: [],
        minimum: null,
        maximum: null,
      };
      assert.equal(previous.codec, parquetCodecNames[metadata[4]] ?? `unknown_${metadata[4]}`, `${pathName}: codec changed across row groups`);
      previous.chunks.push({
        rowGroup: rowGroupIndex,
        values: Number(metadata[5] ?? 0),
        compressedBytes: Number(metadata[7] ?? 0),
        dataPageOffset: Number(metadata[9]),
        dictionaryPageOffset: metadata[11] == null ? null : Number(metadata[11]),
      });
      previous.values += Number(metadata[5] ?? 0);
      previous.nulls += Number(statistics[3] ?? 0);
      previous.compressedBytes += Number(metadata[7] ?? 0);
      previous.uncompressedBytes += Number(metadata[6] ?? 0);
      if (minimum != null && (previous.minimum == null || minimum < previous.minimum)) previous.minimum = minimum;
      if (maximum != null && (previous.maximum == null || maximum > previous.maximum)) previous.maximum = maximum;
      columns.set(pathName, previous);
    }
  }
  return [...columns.values()];
}

async function inspectParquet(name, descriptor) {
  const first = await fetchRange(descriptor.url, 0, 7);
  assert.equal(first.buffer.subarray(0, 4).toString('ascii'), 'PAR1', `${name}: missing leading Parquet magic`);
  const totalBytes = Number(first.contentRange?.match(/\/(\d+)$/)?.[1]);
  assert.equal(totalBytes, descriptor.expected.bytes, `${name}: byte size changed`);
  const tail = await fetchRange(descriptor.url, totalBytes - 8, totalBytes - 1);
  assert.equal(tail.buffer.subarray(4).toString('ascii'), 'PAR1', `${name}: missing trailing Parquet magic`);
  const footerBytes = tail.buffer.readUInt32LE(0);
  assert.equal(footerBytes, descriptor.expected.footerBytes, `${name}: footer size changed`);
  const footer = await fetchRange(descriptor.url, totalBytes - 8 - footerBytes, totalBytes - 9);
  assert.equal(sha256(footer.buffer), descriptor.expected.footerSha256, `${name}: footer checksum changed`);
  const reader = new CompactReader(footer.buffer);
  const metadata = reader.structure();
  assert.equal(reader.offset, footer.buffer.length, `${name}: footer parser did not consume the complete metadata block`);
  const schema = (metadata[2] ?? []).map(element => ({
    name: text(element[4]),
    physicalType: element[1] == null ? null : parquetTypeNames[element[1]] ?? `unknown_${element[1]}`,
    repetition: element[3] ?? null,
    children: element[5] ?? 0,
  }));
  const columns = aggregateColumnMetadata(metadata);
  return {
    name,
    url: descriptor.url,
    bytes: totalBytes,
    etag: footer.etag,
    fingerprintBoundary: 'Byte size, leading and trailing Parquet magic, and the complete footer are verified. This is not a checksum of every data page.',
    footer: { bytes: footerBytes, sha256: descriptor.expected.footerSha256 },
    parquetVersion: metadata[1],
    createdBy: text(metadata[6]),
    rows: Number(metadata[3]),
    rowGroups: (metadata[4] ?? []).length,
    rowGroupRows: (metadata[4] ?? []).map(rowGroup => Number(rowGroup[3])),
    schema,
    columns,
  };
}

const repositoryResponse = await fetchBuffer(repository.apiUrl, { Accept: 'application/vnd.github+json' });
const repositoryMetadata = JSON.parse(repositoryResponse.buffer.toString('utf8'));
assert.equal(repositoryMetadata.default_branch, 'main');
const commitResponse = await fetchBuffer(`${repository.apiUrl}/commits/${repository.commit}`, { Accept: 'application/vnd.github+json' });
const commitMetadata = JSON.parse(commitResponse.buffer.toString('utf8'));
assert.equal(commitMetadata.sha, repository.commit);

const repositoryFiles = {};
for (const [filename, expectedHash] of Object.entries(repository.files)) {
  const url = `https://raw.githubusercontent.com/echolab-stanford/temperature-mortality/${repository.commit}/${filename}`;
  const { buffer } = await fetchBuffer(url);
  assert.equal(sha256(buffer), expectedHash, `${filename}: repository file changed`);
  repositoryFiles[filename] = { url, bytes: buffer.length, sha256: expectedHash };
}
const readme = (await fetchBuffer(repositoryFiles['README.md'].url)).buffer.toString('utf8');
const responseCode = (await fetchBuffer(repositoryFiles['us_mex_eu_response_attribution.R'].url)).buffer.toString('utf8');
const mapCode = (await fetchBuffer(repositoryFiles['us_mex_eu_maps.R'].url)).buffer.toString('utf8');
assert.match(readme, /Understanding and addressing temperature impacts on mortality/i);
assert.match(readme, /EUFullPanel_complete\.pq/);
assert.match(responseCode, /fixed_effects <- "adm_id\^year \+ adm_id\^week"/);
assert.match(responseCode, /n_deaths_all/);
assert.match(mapCode, /read_parquet\('data\/EU\/full_weekly\.pq'\)/);
assert.match(mapCode, /year == 2023/);

const parquet = {};
assert.equal(fullDataChecksums.status, 'complete_public_parquet_files_checksum_pinned');
assert.equal(fullDataChecksums.source.repositoryCommit, repository.commit);
assert.equal(fullDataChecksums.counts.files, Object.keys(parquetSources).length);
assert.equal(fullDataChecksums.counts.completeSha256Checksums, Object.keys(parquetSources).length);
assert.equal(fullDataChecksums.counts.axesAdmitted, 0);
assert.equal(fullDataChecksums.counts.scoresChanged, 0);
assert.equal(coverageEnumeration.status, 'exact_public_region_and_year_coverage_enumerated');
assert.equal(coverageEnumeration.inputs.fullDataChecksumDigest, fullDataChecksums.digest);
assert.equal(coverageEnumeration.counts.files, Object.keys(parquetSources).length);
assert.equal(coverageEnumeration.counts.axesAdmitted, 0);
assert.equal(coverageEnumeration.counts.scoresChanged, 0);
for (const [name, descriptor] of Object.entries(parquetSources)) {
  const inspected = await inspectParquet(name, descriptor);
  const completeFile = fullDataChecksums.files[name];
  assert(completeFile, `${name}: complete-file checksum missing`);
  assert.equal(completeFile.sourceUrl, descriptor.url, `${name}: checksum source URL mismatch`);
  assert.equal(completeFile.bytes, inspected.bytes, `${name}: checksum byte count mismatch`);
  assert(/^[a-f0-9]{64}$/.test(completeFile.sha256), `${name}: complete-file SHA-256 invalid`);
  parquet[name] = {
    ...inspected,
    fingerprintBoundary: 'Byte size, leading and trailing Parquet magic, complete footer, and complete-file SHA-256 are verified.',
    completeFile: {
      sha256: completeFile.sha256,
      etag: completeFile.etag,
      leadingParquetMagic: completeFile.leadingParquetMagic,
      trailingParquetMagic: completeFile.trailingParquetMagic,
    },
  };
}

const column = (file, name) => file.columns.find(item => item.path === name);
assert.equal(parquet.fullPanel.rows, 679_602);
assert.equal(parquet.dailyTemperature.rows, 12_660_307);
assert.equal(parquet.temperatureBins.rows, 1_837_033);
assert.equal(parquet.weeklyMapPanel.rows, 679_602);
assert.equal(parquet.annualTemperatureSummaries.rows, 27_875);
assert.equal(parquet.temperatureLimits.rows, 1_115);
for (const required of ['adm_id', 'year', 'week', 'n_deaths_all', 'pop_all']) assert(column(parquet.fullPanel, required), `fullPanel: ${required} missing`);
for (const required of ['adm_id', 'year', 'month', 'day', 'week', 'temp1']) assert(column(parquet.dailyTemperature, required), `dailyTemperature: ${required} missing`);
for (const required of ['adm_id', 'year', 'week', '-49.5', '49.5']) assert(column(parquet.temperatureBins, required), `temperatureBins: ${required} missing`);
for (const required of ['adm_id', 'year', 'week', 'deaths', 'pop', 'rate', 'avg_temp', 'sd_temp']) assert(column(parquet.weeklyMapPanel, required), `weeklyMapPanel: ${required} missing`);
for (const required of ['adm_id', 'avg_temp', 'sd_temp', 'year']) assert(column(parquet.annualTemperatureSummaries, required), `annualTemperatureSummaries: ${required} missing`);
for (const required of ['adm_id', 'min_temp', 'max_temp']) assert(column(parquet.temperatureLimits, required), `temperatureLimits: ${required} missing`);

const payload = {
  version: 'tulip_europe_temperature_mortality_bridge_reference_2026_09_25_v4',
  checkedOn: '2026-09-25',
  status: 'candidate_independent_human_endpoint_bridge_not_admitted',
  productionRatingsEnabled: 0,
  purpose: 'Evaluate a newly available, broader European temperature-mortality model as an independent route beyond the existing 103-region public sample without treating a working-paper dataset as a calibrated TULIP endpoint.',
  paper: {
    title: 'Understanding and Addressing Temperature Impacts on Mortality',
    nberWorkingPaper: '34313',
    doi: 'https://doi.org/10.3386/w34313',
    issueDate: '2025-10',
    reviewStatus: 'working_paper_not_peer_reviewed',
    paperUrl: 'https://www.nber.org/papers/w34313',
  },
  repository: {
    url: repository.url,
    commit: repository.commit,
    commitDate: commitMetadata.commit.committer.date,
    files: repositoryFiles,
    declaredRuntime: 'R 4.5.1 or later with Arrow, fixed-effects and supporting packages',
  },
  fullDataChecksumAudit: {
    version: fullDataChecksums.version,
    digest: fullDataChecksums.digest,
    status: fullDataChecksums.status,
    files: fullDataChecksums.counts.files,
    totalBytes: fullDataChecksums.counts.totalBytes,
    completeSha256Checksums: fullDataChecksums.counts.completeSha256Checksums,
  },
  coverageEnumeration: {
    version: coverageEnumeration.version,
    digest: coverageEnumeration.digest,
    status: coverageEnumeration.status,
    responsePanelUniqueRegions: coverageEnumeration.counts.responsePanelUniqueRegions,
    dailyTemperatureUniqueRegions: coverageEnumeration.files.dailyTemperature.uniqueRegions,
    temperatureLimitUniqueRegions: coverageEnumeration.counts.temperatureLimitUniqueRegions,
    responseRegionsWithEveryObservedYear: coverageEnumeration.files.fullPanel.regionsWithEveryObservedYear,
    responsePanelYears: coverageEnumeration.files.fullPanel.years,
    dailyTemperatureYears: coverageEnumeration.files.dailyTemperature.years,
  },
  parquet,
  counts: {
    parquetFilesAudited: Object.keys(parquet).length,
    completeFileChecksums: fullDataChecksums.counts.completeSha256Checksums,
    fullPanelRows: parquet.fullPanel.rows,
    dailyTemperatureRows: parquet.dailyTemperature.rows,
    temperatureBinRows: parquet.temperatureBins.rows,
    weeklyMapPanelRows: parquet.weeklyMapPanel.rows,
    annualTemperatureSummaryRows: parquet.annualTemperatureSummaries.rows,
    temperatureLimitRows: parquet.temperatureLimits.rows,
    affectedEmissionSourceNodes: responsiveness.rows.length,
    scoresChanged: 0,
    axesAdmitted: 0,
  },
  coverage: {
    responsePanelYears: { start: column(parquet.fullPanel, 'year').minimum, end: column(parquet.fullPanel, 'year').maximum },
    dailyTemperatureYears: { start: column(parquet.dailyTemperature, 'year').minimum, end: column(parquet.dailyTemperature, 'year').maximum },
    mapPanelYears: { start: column(parquet.weeklyMapPanel, 'year').minimum, end: column(parquet.weeklyMapPanel, 'year').maximum },
    annualTemperatureSummaryYears: { start: column(parquet.annualTemperatureSummaries, 'year').minimum, end: column(parquet.annualTemperatureSummaries, 'year').maximum },
    adminIdLexicalBounds: {
      responsePanel: { minimum: column(parquet.fullPanel, 'adm_id').minimum, maximum: column(parquet.fullPanel, 'adm_id').maximum },
      annualTemperatureSummaries: { minimum: column(parquet.annualTemperatureSummaries, 'adm_id').minimum, maximum: column(parquet.annualTemperatureSummaries, 'adm_id').maximum },
    },
    exactRegionCounts: {
      responsePanel: coverageEnumeration.files.fullPanel.uniqueRegions,
      dailyTemperature: coverageEnumeration.files.dailyTemperature.uniqueRegions,
      temperatureBins: coverageEnumeration.files.temperatureBins.uniqueRegions,
      weeklyMapPanel: coverageEnumeration.files.weeklyMapPanel.uniqueRegions,
      annualTemperatureSummaries: coverageEnumeration.files.annualTemperatureSummaries.uniqueRegions,
      temperatureLimits: coverageEnumeration.files.temperatureLimits.uniqueRegions,
    },
    responseRegionsWithEveryObservedYear: coverageEnumeration.files.fullPanel.regionsWithEveryObservedYear,
    boundary: 'Exact identifiers and observed years are enumerated from the pinned files. The public panels have different regional universes, and the weekly response panel is unbalanced; file coverage is not a harmed-person denominator or representative global coverage.',
  },
  finding: {
    strength: 'The public files contain direct weekly mortality counts, population, temperature covariates and a broader regional panel. The response code declares adm_id-by-year and adm_id-by-week fixed effects, and the map code uses 2023 regional temperature summaries.',
    comparisonWithExistingSample: `This route is materially broader than TULIP’s current 103-region method sample and supplies a distinct model family for independent reproduction. Exact decoding finds ${coverageEnumeration.files.fullPanel.uniqueRegions.toLocaleString('en-US')} unique response-panel regions, ${coverageEnumeration.files.dailyTemperature.uniqueRegions.toLocaleString('en-US')} daily-temperature regions and ${coverageEnumeration.files.temperatureLimits.uniqueRegions.toLocaleString('en-US')} temperature-limit regions. Only ${coverageEnumeration.files.fullPanel.regionsWithEveryObservedYear.toLocaleString('en-US')} response-panel regions appear in every observed response year, so the public model universe must be reproduced as an unbalanced panel rather than inferred from any single file.`,
    boundary: 'The files describe temperature-attributable mortality. They do not contain an emissions-source-removal climate, a unique all-harms reach denominator, or an ecosystem condition, distribution or recovery endpoint.',
    integrityBoundary: 'The repository code and every byte of all six public Parquet files are checksum-pinned. File identity does not validate the working-paper model or make its outputs source-attributable TULIP endpoints.',
  },
  admissionDecision: {
    status: 'not_admitted_to_tulip_axes',
    admittedUse: 'Use the audit to define a concrete independent human-endpoint reproduction path and to verify that the required public mortality, population and temperature fields exist.',
    prohibitedUses: [
      'Do not infer 1,115 unique regions from a 1,115-row table without reading and checking adm_id values.',
      'Do not turn temperature-attributable deaths into source-attributable deaths without rerunning a matched source-removal climate.',
      'Do not treat a working-paper result as independent review of TULIP calibration.',
      'Do not use human mortality data for nature severity, reach or persistence.',
      'Do not change any current candidate from footer metadata or repository claims.',
    ],
    nextGate: 'Reproduce the working paper’s European response and mortality outputs from the pinned code, complete files and exact unbalanced public panel, then run validated regional source-removal temperatures through the same model with propagated uncertainty. Compare the result with the existing nonlinear endpoint before admitting any human axis. A separate ecosystem endpoint remains required.',
    currentScoreEffect: 'none_all_21_source_candidates_retained',
  },
  affectedNodeIds: responsiveness.rows.map(row => row.nodeId).sort(),
};
payload.digest = digest({
  paper: payload.paper,
  repository: payload.repository,
  fullDataChecksumAudit: payload.fullDataChecksumAudit,
  coverageEnumeration: payload.coverageEnumeration,
  parquet: payload.parquet,
  counts: payload.counts,
  coverage: payload.coverage,
  finding: payload.finding,
  admissionDecision: payload.admissionDecision,
  affectedNodeIds: payload.affectedNodeIds,
});

const report = `# European temperature-mortality bridge audit

Status: **a broader independent human-endpoint route exists, but it is not admitted to TULIP scoring**.

The checksum-pinned code repository for the 2025 NBER working paper *Understanding and Addressing Temperature Impacts on Mortality* now publishes a European temperature-mortality model and public data links. TULIP inspected the complete Parquet metadata and streamed all ${(payload.fullDataChecksumAudit.totalBytes / 1_000_000).toFixed(1)} MB to pin every data page without installing a new runtime or retaining another local copy.

## Verified scope

| File | Rows | Row groups | Key fields |
| --- | ---: | ---: | --- |
| European weekly response panel | ${parquet.fullPanel.rows.toLocaleString('en-US')} | ${parquet.fullPanel.rowGroups} | adm_id, year, week, deaths by age, population by age, temperature, income, baseline mortality |
| Daily temperature covariates | ${parquet.dailyTemperature.rows.toLocaleString('en-US')} | ${parquet.dailyTemperature.rowGroups} | adm_id, date fields, temperature polynomials and regional covariates |
| Weekly temperature-bin exposure | ${parquet.temperatureBins.rows.toLocaleString('en-US')} | ${parquet.temperatureBins.rowGroups} | adm_id, year, week and 100 one-degree temperature bins |
| Map-model weekly panel | ${parquet.weeklyMapPanel.rows.toLocaleString('en-US')} | ${parquet.weeklyMapPanel.rowGroups} | deaths, population, mortality rate, temperature, income and baseline mortality |
| Annual temperature summaries | ${parquet.annualTemperatureSummaries.rows.toLocaleString('en-US')} | ${parquet.annualTemperatureSummaries.rowGroups} | adm_id, year, mean and standard deviation |
| Regional temperature limits | ${parquet.temperatureLimits.rows.toLocaleString('en-US')} | ${parquet.temperatureLimits.rowGroups} | adm_id, minimum and maximum temperature |

The response panel covers ${payload.coverage.responsePanelYears.start}–${payload.coverage.responsePanelYears.end}; its daily temperature input covers ${payload.coverage.dailyTemperatureYears.start}–${payload.coverage.dailyTemperatureYears.end}; and the annual temperature summaries extend through ${payload.coverage.annualTemperatureSummaryYears.end}. Exact column decoding finds ${payload.coverage.exactRegionCounts.responsePanel.toLocaleString('en-US')} response-panel regions, ${payload.coverage.exactRegionCounts.dailyTemperature.toLocaleString('en-US')} daily-temperature regions and ${payload.coverage.exactRegionCounts.temperatureLimits.toLocaleString('en-US')} temperature-limit regions. Only ${payload.coverage.responseRegionsWithEveryObservedYear.toLocaleString('en-US')} response regions appear in every observed response year. The response code specifies regional-by-year and regional-by-week fixed effects. The separate map model uses 2023 regional temperature summaries. This is a materially broader and independent model family than the existing 103-region public sample, but it is an unbalanced public panel with distinct file universes.

## Boundary

This audit verifies that the required mortality, population and temperature fields exist, pins the complete six-file dataset by SHA-256 and enumerates the exact region identifiers and observed years. It has not executed the working-paper model. The source is a working paper, not peer-reviewed independent validation.

The data contain no emissions-source-removal climate and no ecosystem endpoint. Therefore zero TULIP axes and zero scores change. The next step is to reproduce the European outputs on the exact unbalanced panel and then run validated regional source-removal temperatures through the same model with uncertainty. A separate ecosystem endpoint is still required.
`;

await mkdir(outDir, { recursive: true });
await Promise.all([
  writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(outputReport, report),
]);

console.log(JSON.stringify({
  status: payload.status,
  counts: payload.counts,
  nextGate: payload.admissionDecision.nextGate,
  digest: payload.digest,
}, null, 2));
