import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const inputDirectory = path.resolve(process.argv[2] ?? '');

if (!inputDirectory || !fs.existsSync(inputDirectory)) {
  throw new Error('Usage: node scripts/analyze-fhwa-nbi-2025.mjs <directory containing state .txt files>');
}

const parseDelimitedLine = line => {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === "'") {
      if (quoted && line[index + 1] === "'") {
        value += "'";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }

  values.push(value);
  return values;
};

const increment = (record, key) => {
  record[key] = (record[key] ?? 0) + 1;
};

const stateFiles = fs.readdirSync(inputDirectory)
  .filter(file => file.endsWith('.txt'))
  .sort();
const aggregateHash = crypto.createHash('sha256');
const scourCriticalCodes = new Set(['0', '1', '2', '3']);
const bridgeOpenStatusCodes = new Set(['A', 'B', 'D', 'E', 'P', 'R']);
const expectedBridgeCount = 624193;
const result = {
  state_file_count: stateFiles.length,
  bridge_count: 0,
  scour_rating_counts: {},
  scour_critical_bridge_count: 0,
  scour_critical_by_state: {},
  scour_critical_state_count: 0,
  scour_critical_adt_record_count: 0,
  scour_critical_daily_vehicle_crossings: 0,
  scour_critical_open_bridge_count: 0,
  scour_critical_open_adt_record_count: 0,
  scour_critical_open_daily_vehicle_crossings: 0,
  scour_critical_truck_adt_record_count: 0,
  scour_critical_daily_truck_crossings_estimate: 0,
  scour_critical_open_closed_posted_counts: {},
  scour_critical_bridge_condition_counts: {},
  scour_critical_adt_year_counts: {},
  scour_critical_inspection_year_counts: {},
  missing_required_field_count: 0
};

for (const file of stateFiles) {
  const state = path.basename(file, '.txt');
  const filePath = path.join(inputDirectory, file);
  aggregateHash.update(file);
  aggregateHash.update(fs.readFileSync(filePath));

  const input = fs.createReadStream(filePath);
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let fieldIndex;

  for await (const line of lines) {
    if (!fieldIndex) {
      const header = parseDelimitedLine(line.replace(/^\ufeff/, ''));
      fieldIndex = Object.fromEntries(header.map((field, index) => [field, index]));
      for (const field of ['SCOUR_CRITICAL_113', 'ADT_029', 'YEAR_ADT_030', 'PERCENT_ADT_TRUCK_109', 'OPEN_CLOSED_POSTED_041', 'BRIDGE_CONDITION', 'DATE_OF_INSPECT_090']) {
        if (fieldIndex[field] === undefined) throw new Error(`${file}: missing ${field}`);
      }
      continue;
    }

    if (!line) continue;
    const values = parseDelimitedLine(line);
    result.bridge_count += 1;
    const scourRating = values[fieldIndex.SCOUR_CRITICAL_113]?.trim() || 'missing';
    increment(result.scour_rating_counts, scourRating);
    if (!scourCriticalCodes.has(scourRating)) continue;

    result.scour_critical_bridge_count += 1;
    increment(result.scour_critical_by_state, state);
    const operatingStatus = values[fieldIndex.OPEN_CLOSED_POSTED_041]?.trim() || 'missing';
    increment(result.scour_critical_open_closed_posted_counts, operatingStatus);
    if (bridgeOpenStatusCodes.has(operatingStatus)) result.scour_critical_open_bridge_count += 1;
    increment(result.scour_critical_bridge_condition_counts, values[fieldIndex.BRIDGE_CONDITION]?.trim() || 'missing');

    const adt = Number(values[fieldIndex.ADT_029]);
    if (Number.isFinite(adt) && adt >= 0) {
      result.scour_critical_adt_record_count += 1;
      result.scour_critical_daily_vehicle_crossings += adt;
      if (bridgeOpenStatusCodes.has(operatingStatus)) {
        result.scour_critical_open_adt_record_count += 1;
        result.scour_critical_open_daily_vehicle_crossings += adt;
      }
      increment(result.scour_critical_adt_year_counts, values[fieldIndex.YEAR_ADT_030]?.trim() || 'missing');
      const truckPercent = Number(values[fieldIndex.PERCENT_ADT_TRUCK_109]);
      if (Number.isFinite(truckPercent) && truckPercent >= 0 && truckPercent <= 100) {
        result.scour_critical_truck_adt_record_count += 1;
        result.scour_critical_daily_truck_crossings_estimate += adt * truckPercent / 100;
      }
    }

    const inspectionDate = values[fieldIndex.DATE_OF_INSPECT_090]?.trim() ?? '';
    const inspectionYear = /^\d{4}$/.test(inspectionDate)
      ? 2000 + Number(inspectionDate.slice(2))
      : 'missing';
    increment(result.scour_critical_inspection_year_counts, String(inspectionYear));
  }
}

result.scour_critical_state_count = Object.keys(result.scour_critical_by_state).length;
result.scour_critical_share_pct = Number((100 * result.scour_critical_bridge_count / result.bridge_count).toFixed(6));
result.scour_critical_daily_truck_crossings_estimate = Math.round(result.scour_critical_daily_truck_crossings_estimate);
result.input_sha256 = aggregateHash.digest('hex');

if (result.bridge_count !== expectedBridgeCount) {
  throw new Error(`Expected ${expectedBridgeCount} highway bridges, found ${result.bridge_count}`);
}

console.log(JSON.stringify(result, null, 2));
