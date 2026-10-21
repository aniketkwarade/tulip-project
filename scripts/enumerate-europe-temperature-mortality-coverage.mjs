import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const bridge = JSON.parse(await readFile(path.join(outDir, 'europe-temperature-mortality-bridge-reference-snapshot.json'), 'utf8'));
const checksumAudit = JSON.parse(await readFile(path.join(outDir, 'europe-temperature-mortality-full-data-checksums.json'), 'utf8'));
const outputJson = path.join(outDir, 'europe-temperature-mortality-coverage-enumeration.json');
const outputReport = path.join(outDir, 'europe-temperature-mortality-coverage-enumeration-report.md');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const userAgent = 'LostPlanet-TULIP/1.0 (+temperature-mortality-coverage-enumeration)';

assert.equal(bridge.status, 'candidate_independent_human_endpoint_bridge_not_admitted');
assert.equal(bridge.counts.completeFileChecksums, 6);
assert.equal(checksumAudit.status, 'complete_public_parquet_files_checksum_pinned');
assert.equal(bridge.fullDataChecksumAudit.digest, checksumAudit.digest);

class CompactReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  byte() {
    assert(this.offset < this.buffer.length, 'Compact-protocol read passed the buffer boundary');
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
    assert(value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= BigInt(Number.MIN_SAFE_INTEGER));
    return Number(value);
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
      return Array.from({ length }, () => [this.value(header >> 4), this.value(header & 0x0f)]);
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

const readVarintNumber = (buffer, state) => {
  let value = 0;
  let shift = 0;
  while (true) {
    assert(state.offset < buffer.length, 'Varint read passed the buffer boundary');
    const current = buffer[state.offset++];
    value += (current & 0x7f) * 2 ** shift;
    if (!(current & 0x80)) return value;
    shift += 7;
    assert(shift <= 49, 'Numeric varint is too long');
  }
};

function decompressSnappy(buffer) {
  const state = { offset: 0 };
  const outputLength = readVarintNumber(buffer, state);
  const output = Buffer.alloc(outputLength);
  let outputOffset = 0;
  while (state.offset < buffer.length && outputOffset < outputLength) {
    const tag = buffer[state.offset++];
    const type = tag & 0x03;
    if (type === 0) {
      let length = tag >> 2;
      if (length < 60) length += 1;
      else {
        const lengthBytes = length - 59;
        length = 0;
        for (let index = 0; index < lengthBytes; index += 1) length += buffer[state.offset++] * 2 ** (8 * index);
        length += 1;
      }
      assert(state.offset + length <= buffer.length, 'Snappy literal passed the input boundary');
      buffer.copy(output, outputOffset, state.offset, state.offset + length);
      state.offset += length;
      outputOffset += length;
      continue;
    }

    let length;
    let copyOffset;
    if (type === 1) {
      length = 4 + ((tag >> 2) & 0x07);
      copyOffset = ((tag & 0xe0) << 3) | buffer[state.offset++];
    } else if (type === 2) {
      length = 1 + (tag >> 2);
      copyOffset = buffer[state.offset] | (buffer[state.offset + 1] << 8);
      state.offset += 2;
    } else {
      length = 1 + (tag >> 2);
      copyOffset = buffer.readUInt32LE(state.offset);
      state.offset += 4;
    }
    assert(copyOffset > 0 && copyOffset <= outputOffset, 'Snappy copy offset is invalid');
    assert(outputOffset + length <= output.length, 'Snappy copy passed the output boundary');
    for (let index = 0; index < length; index += 1) {
      output[outputOffset + index] = output[outputOffset - copyOffset + index];
    }
    outputOffset += length;
  }
  assert.equal(state.offset, buffer.length, 'Snappy input was not consumed exactly');
  assert.equal(outputOffset, outputLength, 'Snappy output length mismatch');
  return output;
}

function decodeHybrid(buffer, bitWidth, count) {
  const state = { offset: 0 };
  const values = [];
  while (values.length < count) {
    const header = readVarintNumber(buffer, state);
    if ((header & 1) === 0) {
      const runLength = header >> 1;
      const valueBytes = Math.ceil(bitWidth / 8);
      let value = 0;
      for (let index = 0; index < valueBytes; index += 1) value += buffer[state.offset++] * 2 ** (8 * index);
      for (let index = 0; index < runLength && values.length < count; index += 1) values.push(value);
      continue;
    }

    const groups = header >> 1;
    const runValues = groups * 8;
    const runBytes = groups * bitWidth;
    const start = state.offset;
    assert(start + runBytes <= buffer.length, 'Bit-packed run passed the buffer boundary');
    for (let valueIndex = 0; valueIndex < runValues && values.length < count; valueIndex += 1) {
      let value = 0;
      for (let bit = 0; bit < bitWidth; bit += 1) {
        const absoluteBit = valueIndex * bitWidth + bit;
        value |= ((buffer[start + (absoluteBit >> 3)] >> (absoluteBit & 7)) & 1) * 2 ** bit;
      }
      values.push(value);
    }
    state.offset += runBytes;
  }
  return values;
}

function decodePlain(buffer, physicalType, count) {
  const values = [];
  let offset = 0;
  if (physicalType === 'byte_array') {
    for (let index = 0; index < count; index += 1) {
      const length = buffer.readUInt32LE(offset);
      offset += 4;
      values.push(buffer.subarray(offset, offset + length).toString('utf8'));
      offset += length;
    }
  } else if (physicalType === 'int32') {
    for (let index = 0; index < count; index += 1) {
      values.push(buffer.readInt32LE(offset));
      offset += 4;
    }
  } else {
    throw new Error(`Plain decoder does not support ${physicalType}`);
  }
  assert.equal(offset, buffer.length, `Plain ${physicalType} page was not consumed exactly`);
  return values;
}

async function fetchRange(url, start, end) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': userAgent, Range: `bytes=${start}-${end}` },
        signal: AbortSignal.timeout(180_000),
      });
      assert.equal(response.status, 206, `${url}: server did not honor range ${start}-${end}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      assert.equal(buffer.length, end - start + 1, `${url}: ranged byte count mismatch`);
      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
    }
  }
  throw lastError;
}

function decodeColumnChunk(buffer, column, expectedValues) {
  let offset = 0;
  let dictionary = null;
  const values = [];
  while (offset < buffer.length) {
    const reader = new CompactReader(buffer.subarray(offset));
    const pageHeader = reader.structure();
    const pageType = pageHeader[1];
    const uncompressedBytes = pageHeader[2];
    const compressedBytes = pageHeader[3];
    assert(Number.isInteger(compressedBytes) && compressedBytes >= 0, 'Parquet page compressed size missing');
    const compressed = buffer.subarray(offset + reader.offset, offset + reader.offset + compressedBytes);
    assert.equal(compressed.length, compressedBytes, 'Parquet page payload passed the chunk boundary');
    const payload = column.codec === 'snappy' ? decompressSnappy(compressed) : compressed;
    assert.equal(payload.length, uncompressedBytes, 'Parquet page uncompressed size mismatch');

    if (pageType === 2) {
      const dictionaryHeader = pageHeader[7];
      assert(dictionaryHeader, 'Dictionary page header missing');
      assert.equal(dictionaryHeader[2], 0, 'Only plain Parquet dictionaries are supported');
      dictionary = decodePlain(payload, column.physicalType, dictionaryHeader[1]);
    } else if (pageType === 0) {
      const dataHeader = pageHeader[5];
      assert(dataHeader, 'Data page v1 header missing');
      const pageValues = dataHeader[1];
      let valueOffset = 0;
      if (column.schemaRepetition === 1) {
        const definitionBytes = payload.readUInt32LE(valueOffset);
        valueOffset += 4 + definitionBytes;
      }
      const encoded = payload.subarray(valueOffset);
      if (dataHeader[2] === 8 || dataHeader[2] === 2) {
        assert(dictionary, 'Dictionary-encoded page preceded the dictionary page');
        const bitWidth = encoded[0];
        const indexes = decodeHybrid(encoded.subarray(1), bitWidth, pageValues);
        for (const index of indexes) {
          assert(index < dictionary.length, 'Dictionary index passed the dictionary boundary');
          values.push(dictionary[index]);
        }
      } else if (dataHeader[2] === 0) {
        for (const value of decodePlain(encoded, column.physicalType, pageValues)) values.push(value);
      } else {
        throw new Error(`Unsupported Parquet data-page encoding ${dataHeader[2]}`);
      }
    } else {
      throw new Error(`Unsupported Parquet page type ${pageType}`);
    }
    offset += reader.offset + compressedBytes;
  }
  assert.equal(offset, buffer.length, 'Parquet column chunk was not consumed exactly');
  assert.equal(values.length, expectedValues, 'Decoded Parquet value count mismatch');
  return values;
}

async function decodeColumn(file, columnName) {
  const column = file.columns.find(item => item.path === columnName);
  assert(column, `${file.name}: ${columnName} column missing`);
  assert.equal(column.nulls, 0, `${file.name}.${columnName}: nulls require definition-level filtering`);
  assert(['snappy', 'uncompressed'].includes(column.codec), `${file.name}.${columnName}: unsupported codec ${column.codec}`);
  const schema = file.schema.find(item => item.name === columnName);
  assert(schema, `${file.name}.${columnName}: schema field missing`);
  const configured = { ...column, schemaRepetition: schema.repetition };
  const values = [];
  for (const chunk of [...column.chunks].sort((left, right) => left.rowGroup - right.rowGroup)) {
    const start = Math.min(chunk.dictionaryPageOffset ?? chunk.dataPageOffset, chunk.dataPageOffset);
    const buffer = await fetchRange(file.url, start, start + chunk.compressedBytes - 1);
    for (const value of decodeColumnChunk(buffer, configured, chunk.values)) values.push(value);
  }
  assert.equal(values.length, column.values, `${file.name}.${columnName}: aggregate value count mismatch`);
  const sorted = [...values].sort((left, right) => typeof left === 'number' ? left - right : left.localeCompare(right));
  assert.equal(sorted[0], column.minimum, `${file.name}.${columnName}: decoded minimum mismatch`);
  assert.equal(sorted.at(-1), column.maximum, `${file.name}.${columnName}: decoded maximum mismatch`);
  return values;
}

const files = {};
for (const [name, file] of Object.entries(bridge.parquet)) {
  process.stderr.write(`${name}: enumerating adm_id${file.columns.some(column => column.path === 'year') ? ' and year' : ''}\n`);
  const regionIds = await decodeColumn(file, 'adm_id');
  const years = file.columns.some(column => column.path === 'year') ? await decodeColumn(file, 'year') : null;
  if (years) assert.equal(years.length, regionIds.length, `${name}: region/year row alignment mismatch`);
  const uniqueRegionIds = [...new Set(regionIds)].sort();
  const uniqueYears = years ? [...new Set(years)].sort((left, right) => left - right) : [];
  const regionYears = {};
  if (years) {
    for (let index = 0; index < regionIds.length; index += 1) {
      if (!regionYears[regionIds[index]]) regionYears[regionIds[index]] = new Set();
      regionYears[regionIds[index]].add(years[index]);
    }
  }
  const serializedRegionYears = Object.fromEntries(Object.entries(regionYears)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([regionId, yearSet]) => [regionId, [...yearSet].sort((left, right) => left - right)]));
  files[name] = {
    rows: file.rows,
    decodedRegionValues: regionIds.length,
    uniqueRegions: uniqueRegionIds.length,
    regionIds: uniqueRegionIds,
    regionIdDigest: digest(uniqueRegionIds),
    years: uniqueYears,
    regionsWithEveryObservedYear: years
      ? Object.values(serializedRegionYears).filter(regionYearList => regionYearList.length === uniqueYears.length).length
      : null,
    regionYears: serializedRegionYears,
    regionYearCoverageDigest: years ? digest(serializedRegionYears) : null,
  };
}

const responseRegions = new Set(files.fullPanel.regionIds);
const limitRegions = new Set(files.temperatureLimits.regionIds);
const payload = {
  version: 'tulip_europe_temperature_mortality_coverage_enumeration_2026_09_25_v2',
  checkedOn: '2026-09-25',
  status: 'exact_public_region_and_year_coverage_enumerated',
  productionRatingsEnabled: 0,
  inputs: {
    bridgeVersion: bridge.version,
    fullDataChecksumVersion: checksumAudit.version,
    fullDataChecksumDigest: checksumAudit.digest,
  },
  counts: {
    files: Object.keys(files).length,
    responsePanelUniqueRegions: files.fullPanel.uniqueRegions,
    temperatureLimitUniqueRegions: files.temperatureLimits.uniqueRegions,
    responseRegionsMissingFromTemperatureLimits: [...responseRegions].filter(regionId => !limitRegions.has(regionId)).length,
    temperatureLimitRegionsMissingFromResponsePanel: [...limitRegions].filter(regionId => !responseRegions.has(regionId)).length,
    axesAdmitted: 0,
    scoresChanged: 0,
  },
  files,
  coverageDecision: {
    admittedUse: 'Use the enumerated identifiers and observed years to reproduce the working-paper model on its actual public data universe and to test joins explicitly.',
    boundary: 'Exact file coverage is not representative global coverage, an affected-person denominator, an emissions-source-removal climate, model validation, or ecosystem harm.',
    nextGate: 'Reproduce the working paper’s European response and mortality outputs from the pinned code and exact public data universe, then run validated regional source-removal temperatures through the same model with propagated uncertainty. Compare the result with the existing nonlinear endpoint before admitting any human axis. A separate ecosystem endpoint remains required.',
    currentScoreEffect: 'none_all_21_source_candidates_retained',
  },
};
payload.digest = digest({
  inputs: payload.inputs,
  counts: payload.counts,
  files: payload.files,
  coverageDecision: payload.coverageDecision,
});

const report = `# European temperature–mortality coverage enumeration

Status: **the exact public regional identifiers and observed years are enumerated without installing a Parquet runtime**.

| File | Rows | Unique regions | Years | Regions present in every observed year |
| --- | ---: | ---: | --- | ---: |
${Object.entries(files).map(([name, file]) => `| ${name} | ${file.rows.toLocaleString('en-US')} | ${file.uniqueRegions.toLocaleString('en-US')} | ${file.years.length ? `${file.years[0]}–${file.years.at(-1)} (${file.years.length})` : 'none'} | ${file.regionsWithEveryObservedYear ?? 'n/a'} |`).join('\n')}

The response panel contains ${payload.counts.responsePanelUniqueRegions.toLocaleString('en-US')} unique region identifiers. The temperature-limit table contains ${payload.counts.temperatureLimitUniqueRegions.toLocaleString('en-US')}. ${payload.counts.responseRegionsMissingFromTemperatureLimits} response identifiers are absent from the limit table, and ${payload.counts.temperatureLimitRegionsMissingFromResponsePanel} limit-table identifiers are absent from the response panel.

This closes the metadata-only uncertainty about whether 1,115 rows represented 1,115 unique regions. It does not establish global representativeness, harmed-person reach, model validity, source attribution or nature harm. Zero axes and zero scores change.

Next: ${payload.coverageDecision.nextGate}
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
  fileCoverage: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, {
    rows: file.rows,
    uniqueRegions: file.uniqueRegions,
    years: file.years,
    regionsWithEveryObservedYear: file.regionsWithEveryObservedYear,
  }])),
  digest: payload.digest,
}, null, 2));
