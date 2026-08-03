import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchText, readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCT_URL = 'https://www.star.nesdis.noaa.gov/socd/lsa/SeaLevelRise/LSA_SLR_timeseries_global.php';
const SERIES_URL = 'https://www.star.nesdis.noaa.gov/socd/lsa/SeaLevelRise/slr/slr_sla_gbl_keep_ref_90.csv';
const MISSIONS = ['TOPEX/Poseidon', 'Jason-1', 'Jason-2', 'Jason-3', 'Sentinel-6MF'];

const round = (value, digits = 4) => Number(value.toFixed(digits));

function parseSource(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const trendLine = lines.find(line => line.startsWith('#trend ='));
  const trendMatch = trendLine?.match(/(-?\d+(?:\.\d+)?)\s*mm\/year/i);
  if (!trendMatch) throw new Error('NOAA sea-level schema changed: source trend was not found');
  const sourceReportedTrend = Number(trendMatch[1]);
  const headerIndex = lines.findIndex(line => line.startsWith('year,'));
  if (headerIndex < 0) throw new Error('NOAA sea-level schema changed: data header was not found');
  const headers = lines[headerIndex].split(',');
  if (headers.length !== MISSIONS.length + 1 || !MISSIONS.every((mission, index) => headers[index + 1] === mission)) {
    throw new Error(`NOAA sea-level schema changed: received ${headers.join(',')}`);
  }

  const records = lines.slice(headerIndex + 1).map((line, index) => {
    const values = line.split(',');
    const decimalYear = Number(values[0]);
    if (!Number.isFinite(decimalYear)) throw new Error(`NOAA sea-level row ${index + headerIndex + 2} has an invalid year`);
    const missionValues = MISSIONS.map((mission, missionIndex) => ({
      mission,
      anomaly_mm: values[missionIndex + 1] === '' ? null : Number(values[missionIndex + 1])
    })).filter(item => Number.isFinite(item.anomaly_mm));
    if (!missionValues.length) throw new Error(`NOAA sea-level row ${index + headerIndex + 2} has no mission value`);
    const anomalies = missionValues.map(item => item.anomaly_mm);
    const mean = anomalies.reduce((sum, value) => sum + value, 0) / anomalies.length;
    return {
      record_id: `noaa_lsa_gmsl_${decimalYear.toFixed(5).replace('.', '_')}`,
      decimal_year: decimalYear,
      calendar_year: Math.floor(decimalYear),
      geography: 'global ocean between 66 degrees South and 66 degrees North',
      mean_sea_level_anomaly_mm: round(mean),
      contributing_missions: missionValues,
      contributing_mission_count: missionValues.length,
      cross_mission_minimum_mm: Math.min(...anomalies),
      cross_mission_maximum_mm: Math.max(...anomalies),
      source_reported_trend_mm_per_year: sourceReportedTrend,
      glacial_isostatic_adjustment_applied: false,
      inverted_barometer_applied: true,
      annual_signal_treatment: 'retained',
      source_locator: SERIES_URL
    };
  });
  return { records, sourceReportedTrend };
}

async function main() {
  const contracts = await readMetricContracts(ROOT);
  const contract = contracts.sea_level_rise;
  if (!contract) throw new Error('Missing node metric contract for sea_level_rise');
  const sourceText = await fetchText(SERIES_URL);
  const { records, sourceReportedTrend } = parseSource(sourceText);
  if (records.length < 500) throw new Error(`NOAA sea-level series returned only ${records.length} observations`);
  const latest = records.at(-1);

  const snapshot = snapshotEnvelope({
    jobId: 'fetch_noaa_global_mean_sea_level',
    source: {
      id: 'noaa_laboratory_for_satellite_altimetry',
      name: 'NOAA Laboratory for Satellite Altimetry Global Mean Sea Level',
      publisher: 'NOAA NESDIS Center for Satellite Applications and Research',
      product_url: PRODUCT_URL,
      series_url: SERIES_URL
    },
    request: {
      geography: 'global ocean between 66 degrees South and 66 degrees North',
      temporal_resolution: 'approximately ten-day satellite repeat-cycle observations',
      mission_series: MISSIONS,
      annual_signals: 'retained',
      glacial_isostatic_adjustment: 'not applied'
    },
    contractIds: [contract.metric_id],
    contractBindings: [{ node_id: 'sea_level_rise', metric_id: contract.metric_id }],
    cadence: 'monthly source check with full-series replacement when NOAA updates the altimetry record',
    provenance: 'Official NOAA Laboratory for Satellite Altimetry same-ground-track observations from TOPEX/Poseidon, Jason-1, Jason-2, Jason-3, and Sentinel-6MF. Overlap rows retain every mission value and expose the arithmetic cross-mission mean as a transparent convenience field.',
    uncertainty: 'The source file does not report an observation-level confidence interval. Mission overlap spread is retained but is not relabeled as statistical uncertainty. Orbit and instrument corrections, mission calibration, inverse-barometer treatment, spatial coverage, GIA omission, and reference choice affect the series.',
    records,
    sourceSummary: {
      first_decimal_year: records[0].decimal_year,
      latest_decimal_year: latest.decimal_year,
      observations: records.length,
      latest_mean_sea_level_anomaly_mm: latest.mean_sea_level_anomaly_mm,
      source_reported_trend_mm_per_year: sourceReportedTrend,
      uncertainty_interval: 'not reported in the source CSV',
      measurement_boundary: 'Satellite-altimetry global mean sea-level anomaly between 66 degrees South and 66 degrees North with annual signals retained, inverted-barometer correction applied, and no GIA correction. It is not local relative sea level, tide-gauge flooding, or an inundation-depth estimate.'
    },
    caveats: [
      'The NOAA page labels these data experimental rather than an official operational NOAA product.',
      'The source excludes ocean poleward of 66 degrees latitude and does not apply a glacial-isostatic-adjustment correction.',
      'Cross-mission overlap is preserved. The convenience mean must not be treated as an independent uncertainty estimate.',
      'Local relative sea level additionally depends on vertical land motion, ocean dynamics, tides, surge, waves, and datum choice.'
    ],
    failureBehavior: 'Retain the last validated series and mark it stale; reject a missing source trend, changed mission columns, truncated series, or nonnumeric observations; never fill a missing repeat cycle with zero or extrapolate a local water level.'
  });

  const output = await writeSnapshot(ROOT, 'noaa-global-mean-sea-level-snapshot.json', snapshot);
  console.log(JSON.stringify({ output, records: records.length, latest_decimal_year: latest.decimal_year, latest_anomaly_mm: latest.mean_sea_level_anomaly_mm, source_reported_trend_mm_per_year: sourceReportedTrend }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
