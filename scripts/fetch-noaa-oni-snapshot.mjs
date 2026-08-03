import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'public', 'enso-monitoring-snapshot.json');
const sourceUrl = 'https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt';
const metricIds = Object.freeze(['noaa_oni_warm_phase', 'noaa_oni_cool_phase']);
const seasonOrder = Object.freeze(['DJF', 'JFM', 'FMA', 'MAM', 'AMJ', 'MJJ', 'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ']);

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/plain',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)'
    },
    redirect: 'follow'
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
}

function parseRows(text) {
  const rows = text.split(/\r?\n/).flatMap(line => {
    const match = line.trim().match(/^([A-Z]{3})\s+(\d{4})\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/);
    if (!match || !seasonOrder.includes(match[1])) return [];
    return [{
      season: match[1],
      year: Number(match[2]),
      total_sst_degC: Number(match[3]),
      oni_anomaly_degC: Number(match[4])
    }];
  });
  return rows.sort((a, b) => a.year - b.year || seasonOrder.indexOf(a.season) - seasonOrder.indexOf(b.season));
}

function qualifyingStreak(rows, index, sign) {
  let length = 0;
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const value = rows[cursor].oni_anomaly_degC;
    if ((sign === 'warm' && value >= 0.5) || (sign === 'cool' && value <= -0.5)) length += 1;
    else break;
  }
  return length;
}

async function main() {
  const sourceText = await fetchText(sourceUrl);
  const parsed = parseRows(sourceText);
  if (parsed.length < 600) throw new Error(`Expected at least 600 ONI seasons; received ${parsed.length}`);
  const latest = parsed.at(-1);
  const currentYear = new Date().getUTCFullYear();
  if (!latest || latest.year < currentYear - 1) throw new Error(`ONI table is stale; latest season is ${latest?.season || 'missing'} ${latest?.year || 'missing'}`);

  const records = parsed.flatMap((row, index) => metricIds.map(metricId => {
    const phase = metricId === 'noaa_oni_warm_phase' ? 'warm' : 'cool';
    const thresholdMet = phase === 'warm' ? row.oni_anomaly_degC >= 0.5 : row.oni_anomaly_degC <= -0.5;
    const streak = thresholdMet ? qualifyingStreak(parsed, index, phase) : 0;
    return {
      record_id: `${metricId}-${row.year}-${row.season}`,
      metric_id: metricId,
      observation_period: `${row.season} ${row.year}`,
      season: row.season,
      year: row.year,
      oni_anomaly_degC: row.oni_anomaly_degC,
      total_nino34_sst_degC: row.total_sst_degC,
      threshold_met_this_season: thresholdMet,
      consecutive_qualifying_overlapping_seasons: streak,
      episode_criterion_met: streak >= 5,
      episode_criterion: phase === 'warm'
        ? 'At least five consecutive overlapping three-month seasons at or above +0.5 degrees Celsius.'
        : 'At least five consecutive overlapping three-month seasons at or below -0.5 degrees Celsius.',
      source_locator: sourceUrl
    };
  }));

  const snapshot = {
    version: 'noaa_cpc_oni_measurement_snapshot_v1',
    captured_at: new Date().toISOString(),
    ingestion_job_id: 'fetch_noaa_cpc_oni',
    metric_contract_ids: metricIds,
    cadence: 'monthly NOAA CPC table refresh',
    provenance: 'Official NOAA Climate Prediction Center Oceanic Niño Index table. Each row retains source season, year, total Niño 3.4 SST and rolling three-month anomaly.',
    uncertainty: 'ERSST input, climatology updates and revisions affect ONI. NOAA does not publish an observation-level statistical interval in this table.',
    failure_behavior: 'Retain the last validated complete snapshot and mark stale; reject truncation, malformed seasons or a latest observation older than the previous calendar year; never infer a missing value as neutral.',
    source: {
      id: 'noaa_physical_sciences_laboratory_enso',
      name: 'NOAA CPC Oceanic Niño Index',
      publisher: 'NOAA Climate Prediction Center',
      url: sourceUrl,
      access: 'open_download'
    },
    measurement_boundary: 'ONI is a rolling three-month Niño 3.4 SST anomaly. A single threshold crossing is not an El Niño or La Niña episode; the snapshot separately reports the five-overlapping-season criterion.',
    record_count: records.length,
    source_row_count: parsed.length,
    latest_observation_period: `${latest.season} ${latest.year}`,
    records
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: outputPath,
    source_rows: parsed.length,
    records: records.length,
    latest_observation_period: snapshot.latest_observation_period
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
